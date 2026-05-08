import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed, generateText, Output, streamText, type ModelMessage } from "ai";
import {
  createOllama,
  type OllamaChatSettings,
  type Options as OllamaOptions,
} from "ai-sdk-ollama";
import { z } from "zod";

import {
  DEFAULT_GATEWAY_BASE_URL,
  DEFAULT_OLLAMA_BASE_URL,
  gameConfigSchema,
  judgeSnapshotSchema,
  memoryCandidateSchema,
  memberIdSchema,
  relationshipStatSchema,
  type AiProvider,
  type GameConfig,
  type JudgeSnapshot,
  type MemoryCandidate,
} from "../../domain/game";
import {
  lockAiProviderBaseUrlsForRuntime,
  normalizeOllamaBaseUrlForRuntime,
} from "../../platform/runtime";
import type {
  CharacterPromptPacket,
  JudgePromptPacket,
  SummarizerPromptPacket,
} from "../date-prompts";
import { errorToMessage, isRecord } from "../utils";
import { selectFetch } from "./fetch-transport";
import {
  gatewayReasoningLevelForModel,
  isRecommendedOllamaChatModel,
  isRecommendedOllamaEmbeddingModel,
  type OllamaModelSummary,
} from "./model-catalog";

const OLLAMA_CHARACTER_MAX_OUTPUT_TOKENS = 160;
const OLLAMA_JUDGE_MAX_OUTPUT_TOKENS = 360;
const OLLAMA_SUMMARIZER_MAX_OUTPUT_TOKENS = 480;
const OLLAMA_READINESS_MAX_OUTPUT_TOKENS = 32;
const OLLAMA_CONTEXT_WINDOW_TOKENS = 16384;
const OLLAMA_JUDGE_CONTEXT_WINDOW_TOKENS = 4096;
const OLLAMA_SUMMARIZER_CONTEXT_WINDOW_TOKENS = 16384;
const OLLAMA_READINESS_CONTEXT_WINDOW_TOKENS = 4096;
const OLLAMA_EMBEDDING_CONTEXT_WINDOW_TOKENS = 2048;
const OLLAMA_DISCOVERY_TIMEOUT_MS = 5_000;
const OLLAMA_REQUEST_TIMEOUT_MS = 30_000;
const GATEWAY_REQUEST_TIMEOUT_MS = 120_000;
const OLLAMA_KEEP_ALIVE = "10m";
const GATEWAY_PROVIDER_NAME = "vercel-ai-gateway";
const OLLAMA_BASE_CHAT_SETTINGS: OllamaChatSettings = {
  think: false,
  keep_alive: OLLAMA_KEEP_ALIVE,
};
const OLLAMA_JSON_CHAT_SETTINGS: OllamaChatSettings = {
  ...OLLAMA_BASE_CHAT_SETTINGS,
  format: "json",
};
const AI_DATE_HEALTH_DELTA_SCHEMA = z.number().int().min(-12).max(12);
const AI_STAT_DELTA_SCHEMA = z.number().int().min(-8).max(8);
const AI_MEMBER_MOOD_DELTA_SCHEMA = z.number().int().min(-8).max(8);
const STREAM_TEXT_DELTA_PART_SCHEMA = z.object({
  type: z.enum(["text", "text-delta"]),
  text: z.string(),
});
const STREAM_REASONING_DELTA_PART_SCHEMA = z.object({
  type: z.enum(["reasoning", "reasoning-delta"]),
  text: z.string(),
});

export type AiGenerationOptions = {
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  numCtx?: number;
};

const DEFAULT_CHARACTER_GENERATION_OPTIONS: AiGenerationOptions = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
};

export type AiRuntimeConfig = GameConfig & {
  gatewayApiKey?: string;
  requestTimeoutMs?: number;
  contextWindowTokens?: number;
  embeddingContextWindowTokens?: number;
};

export type GeneratedTextResult = {
  text: string;
  reasoningText?: string;
  providerMode: AiProvider;
  model: string;
  stepCount: number;
  toolCallCount: number;
  toolResultCount: number;
  promptCharacters?: number;
  estimatedPromptTokens?: number;
  usage?: AiUsageTelemetry;
  warningMessages?: string[];
};

export type AiUsageTelemetry = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AiReadiness = {
  languageModels: string[];
  providerModes: AiProvider[];
  embeddingModel: string;
  embeddingDimensions: number;
};

export type OllamaModelInventory = {
  models: OllamaModelSummary[];
  chatModels: OllamaModelSummary[];
  embeddingModels: OllamaModelSummary[];
  runningModels: OllamaModelSummary[];
};

export class AiModelError extends Error {
  constructor(
    message: string,
    readonly causeMessage: string,
  ) {
    super(message);
    this.name = "AiModelError";
  }
}

export class LocalAiError extends AiModelError {
  constructor(message: string, causeMessage: string) {
    super(message, causeMessage);
    this.name = "LocalAiError";
  }
}

export class DateStreamAbortedError extends Error {
  constructor() {
    super("Date stream aborted by player.");
    this.name = "DateStreamAbortedError";
  }
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DateStreamAbortedError) {
    return true;
  }

  return error instanceof Error && error.name === "AbortError";
}

const judgeAiOutputSchema = z.object({
  dateHealthDelta: AI_DATE_HEALTH_DELTA_SCHEMA,
  statDeltas: z.partialRecord(relationshipStatSchema, AI_STAT_DELTA_SCHEMA),
  memberMoodDeltas: z.record(memberIdSchema, AI_MEMBER_MOOD_DELTA_SCHEMA),
  shouldEndEarly: z.boolean(),
  earlyEndReason: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  ),
  notableMoments: z.array(z.string().min(1)),
  playerSummary: z.string().min(1),
  memoryCandidates: z.array(memoryCandidateSchema),
});

const ollamaListResponseSchema = z.object({
  models: z.array(
    z
      .object({
        name: z.string().min(1),
        size: z.number().optional(),
        modified_at: z.string().optional(),
      })
      .passthrough(),
  ),
});

export async function generateCharacterTurn(
  packet: CharacterPromptPacket,
  config?: Partial<AiRuntimeConfig>,
  options?: AiGenerationOptions,
): Promise<GeneratedTextResult> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const generationOptions = normalizeCharacterGenerationOptions(options);

  return streamTextWithModelService({
    system: packet.system,
    prompt: packet.prompt,
    messages: packet.messages,
    modelId: runtimeConfig.chatModel,
    config: runtimeConfig,
    ...withOptionalMaxOutputTokens(
      generationOptions.maxOutputTokens ??
        defaultMaxOutputTokensForProvider(
          runtimeConfig.aiProvider,
          OLLAMA_CHARACTER_MAX_OUTPUT_TOKENS,
        ),
    ),
    generationOptions,
    onTextDelta: () => undefined,
  });
}

export async function streamCharacterTurn(
  packet: CharacterPromptPacket,
  config: Partial<AiRuntimeConfig> | undefined,
  onTextDelta: (delta: string) => Promise<void> | void,
  onReasoningDelta?: (delta: string) => Promise<void> | void,
  options?: AiGenerationOptions,
  abortSignal?: AbortSignal,
): Promise<GeneratedTextResult> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const generationOptions = normalizeCharacterGenerationOptions(options);

  return streamTextWithModelService({
    system: packet.system,
    prompt: packet.prompt,
    messages: packet.messages,
    modelId: runtimeConfig.chatModel,
    config: runtimeConfig,
    ...withOptionalMaxOutputTokens(
      generationOptions.maxOutputTokens ??
        defaultMaxOutputTokensForProvider(
          runtimeConfig.aiProvider,
          OLLAMA_CHARACTER_MAX_OUTPUT_TOKENS,
        ),
    ),
    generationOptions,
    abortSignal,
    onTextDelta,
    onReasoningDelta,
  });
}

export async function judgeDateExchange({
  packet,
  dateSessionId,
  exchangeIndex,
  config,
}: {
  packet: JudgePromptPacket;
  dateSessionId: string;
  exchangeIndex: number;
  config?: Partial<AiRuntimeConfig>;
}): Promise<JudgeSnapshot> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const output = await generateObjectWithModelService(judgeAiOutputSchema, {
    system: packet.system,
    prompt: packet.prompt,
    messages: packet.messages,
    modelId: runtimeConfig.chatModel,
    config: withSecondaryContextWindow(runtimeConfig, OLLAMA_JUDGE_CONTEXT_WINDOW_TOKENS),
    ...withOptionalMaxOutputTokens(
      defaultMaxOutputTokensForProvider(runtimeConfig.aiProvider, OLLAMA_JUDGE_MAX_OUTPUT_TOKENS),
    ),
  });

  return judgeSnapshotSchema.parse({
    id: `judge-${dateSessionId}-${exchangeIndex}`,
    dateSessionId,
    exchangeIndex,
    ...output,
  });
}

export async function summarizeDateMemories(
  packet: SummarizerPromptPacket,
  config?: Partial<AiRuntimeConfig>,
): Promise<MemoryCandidate[]> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  return generateArrayWithModelService(memoryCandidateSchema, {
    system: packet.system,
    prompt: packet.prompt,
    modelId: runtimeConfig.chatModel,
    config: withSecondaryContextWindow(runtimeConfig, OLLAMA_SUMMARIZER_CONTEXT_WINDOW_TOKENS),
    ...withOptionalMaxOutputTokens(
      defaultMaxOutputTokensForProvider(
        runtimeConfig.aiProvider,
        OLLAMA_SUMMARIZER_MAX_OUTPUT_TOKENS,
      ),
    ),
  });
}

export async function embedMemoryText(
  text: string,
  config?: Partial<AiRuntimeConfig>,
): Promise<{ embedding: number[]; model: string; dimensions: number }> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const modelId = runtimeConfig.embeddingModel;

  try {
    const result = await embed({
      model: createEmbeddingModel(modelId, runtimeConfig),
      value: text,
      abortSignal: AbortSignal.timeout(runtimeConfig.requestTimeoutMs ?? 30_000),
    });

    return {
      embedding: result.embedding,
      model: modelId,
      dimensions: result.embedding.length,
    };
  } catch (error) {
    throw createAiError(
      embeddingFailureMessage(runtimeConfig.aiProvider),
      [error],
      runtimeConfig.aiProvider,
    );
  }
}

export async function checkAiReadiness(config?: Partial<AiRuntimeConfig>): Promise<AiReadiness> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const [result, embeddingResult] = await Promise.all([
    generateTextWithModelService({
      system: "You are an IDC AI readiness check.",
      prompt: "Reply with exactly: READY",
      modelId: runtimeConfig.chatModel,
      config: withSecondaryContextWindow(runtimeConfig, OLLAMA_READINESS_CONTEXT_WINDOW_TOKENS),
      ...withOptionalMaxOutputTokens(
        defaultMaxOutputTokensForProvider(
          runtimeConfig.aiProvider,
          OLLAMA_READINESS_MAX_OUTPUT_TOKENS,
        ),
      ),
      generationOptions: {
        numCtx: OLLAMA_READINESS_CONTEXT_WINDOW_TOKENS,
      },
    }),
    embedMemoryText("IDC AI readiness check.", runtimeConfig),
  ]);

  if (result.text.length === 0) {
    throw new AiModelError("Readiness check failed. AI returned an empty reply.", result.model);
  }

  return {
    languageModels: [result.model],
    providerModes: [result.providerMode],
    embeddingModel: embeddingResult.model,
    embeddingDimensions: embeddingResult.dimensions,
  };
}

export async function listOllamaModelInventory(
  config?: Partial<Pick<AiRuntimeConfig, "ollamaBaseURL" | "requestTimeoutMs">>,
): Promise<OllamaModelInventory> {
  const baseURL = normalizeOllamaBaseUrlForRuntime(config?.ollamaBaseURL);
  const timeoutMs = config?.requestTimeoutMs ?? OLLAMA_DISCOVERY_TIMEOUT_MS;
  const [tagPayload, psPayload] = await Promise.all([
    fetchOllamaJson(`${baseURL}/api/tags`, timeoutMs),
    fetchOllamaJson(`${baseURL}/api/ps`, timeoutMs),
  ]);

  return parseOllamaModelInventory(tagPayload, psPayload);
}

export function parseOllamaModelInventory(
  tagPayload: unknown,
  psPayload: unknown,
): OllamaModelInventory {
  const parsedTags = ollamaListResponseSchema.safeParse(tagPayload);
  const parsedPs = ollamaListResponseSchema.safeParse(psPayload);
  const runningNames = new Set(
    parsedPs.success ? parsedPs.data.models.map((model) => model.name) : [],
  );
  const knownModels = parsedTags.success ? parsedTags.data.models : [];
  const runningOnlyModels = parsedPs.success && !parsedTags.success ? parsedPs.data.models : [];
  const models = [...knownModels, ...runningOnlyModels]
    .map((model) => ({
      name: model.name,
      size: model.size,
      modifiedAt: model.modified_at,
      running: runningNames.has(model.name),
    }))
    .filter(uniqueModelByName)
    .sort((first, second) => first.name.localeCompare(second.name));
  const chatModels = models.filter((model) => isRecommendedOllamaChatModel(model.name));
  const embeddingModels = models.filter((model) => isRecommendedOllamaEmbeddingModel(model.name));
  const runningModels = models.filter((model) => model.running === true);

  return {
    models,
    chatModels,
    embeddingModels,
    runningModels,
  };
}

function normalizeRuntimeConfig(config?: Partial<AiRuntimeConfig>): AiRuntimeConfig {
  const gameConfig = lockAiProviderBaseUrlsForRuntime(gameConfigSchema.parse(config ?? {}));

  return {
    ...gameConfig,
    gatewayApiKey: normalizeOptionalSecret(config?.gatewayApiKey),
    requestTimeoutMs:
      config?.requestTimeoutMs ?? defaultRequestTimeoutMsForProvider(gameConfig.aiProvider),
    contextWindowTokens: config?.contextWindowTokens ?? OLLAMA_CONTEXT_WINDOW_TOKENS,
    embeddingContextWindowTokens:
      config?.embeddingContextWindowTokens ?? OLLAMA_EMBEDDING_CONTEXT_WINDOW_TOKENS,
  };
}

export function defaultMaxOutputTokensForProvider(
  provider: AiProvider,
  ollamaMaxOutputTokens: number,
): number | undefined {
  return provider === "gateway" ? undefined : ollamaMaxOutputTokens;
}

function withOptionalMaxOutputTokens(maxOutputTokens: number | undefined): {
  maxOutputTokens?: number;
} {
  return maxOutputTokens === undefined ? {} : { maxOutputTokens };
}

export function defaultRequestTimeoutMsForProvider(provider: AiProvider): number {
  return provider === "gateway" ? GATEWAY_REQUEST_TIMEOUT_MS : OLLAMA_REQUEST_TIMEOUT_MS;
}

function withSecondaryContextWindow(
  config: AiRuntimeConfig,
  contextWindowTokens: number,
): AiRuntimeConfig {
  return {
    ...config,
    contextWindowTokens,
  };
}

function normalizeCharacterGenerationOptions(options?: AiGenerationOptions): AiGenerationOptions {
  return {
    ...DEFAULT_CHARACTER_GENERATION_OPTIONS,
    ...options,
  };
}

async function generateTextWithModelService({
  system,
  prompt,
  messages,
  modelId,
  config,
  maxOutputTokens,
  generationOptions,
}: {
  system: string;
  prompt: string;
  messages?: ModelMessage[];
  modelId: string;
  config: AiRuntimeConfig;
  maxOutputTokens?: number;
  generationOptions?: AiGenerationOptions;
}): Promise<GeneratedTextResult> {
  try {
    const model = createLanguageModel(modelId, config, generationOptions);
    const promptStats = promptStatsForRequest({
      system,
      prompt,
      messages,
      provider: config.aiProvider,
      contextWindowTokens: config.contextWindowTokens ?? OLLAMA_CONTEXT_WINDOW_TOKENS,
    });
    const callSettings = {
      model,
      system,
      ...withOptionalMaxOutputTokens(maxOutputTokens),
      temperature: generationOptions?.temperature,
      topP: generationOptions?.topP,
      topK: config.aiProvider === "ollama" ? generationOptions?.topK : undefined,
      timeout: config.requestTimeoutMs,
      providerOptions: providerOptionsForRuntime(config, modelId),
    };
    const result =
      messages === undefined
        ? await generateText({
            ...callSettings,
            prompt,
          })
        : await generateText({
            ...callSettings,
            messages,
          });

    return {
      text: result.text.trim(),
      reasoningText: result.reasoningText,
      providerMode: config.aiProvider,
      model: modelId,
      stepCount: result.steps.length,
      toolCallCount: 0,
      toolResultCount: 0,
      ...buildPromptTelemetry(promptStats, result.totalUsage, result.warnings),
    };
  } catch (error) {
    throw createAiError(textFailureMessage(config.aiProvider), [error], config.aiProvider);
  }
}

async function streamTextWithModelService({
  system,
  prompt,
  messages,
  modelId,
  config,
  maxOutputTokens,
  generationOptions,
  abortSignal,
  onTextDelta,
  onReasoningDelta,
}: {
  system: string;
  prompt: string;
  messages?: ModelMessage[];
  modelId: string;
  config: AiRuntimeConfig;
  maxOutputTokens?: number;
  generationOptions?: AiGenerationOptions;
  abortSignal?: AbortSignal;
  onTextDelta: (delta: string) => Promise<void> | void;
  onReasoningDelta?: (delta: string) => Promise<void> | void;
}): Promise<GeneratedTextResult> {
  let emittedText = "";
  let emittedReasoning = "";

  try {
    const model = createLanguageModel(modelId, config, generationOptions);
    const promptStats = promptStatsForRequest({
      system,
      prompt,
      messages,
      provider: config.aiProvider,
      contextWindowTokens: config.contextWindowTokens ?? OLLAMA_CONTEXT_WINDOW_TOKENS,
    });
    const callSettings = {
      model,
      system,
      ...withOptionalMaxOutputTokens(maxOutputTokens),
      temperature: generationOptions?.temperature,
      topP: generationOptions?.topP,
      topK: config.aiProvider === "ollama" ? generationOptions?.topK : undefined,
      timeout: config.requestTimeoutMs,
      abortSignal,
      providerOptions: providerOptionsForRuntime(config, modelId),
    };
    const result =
      messages === undefined
        ? streamText({
            ...callSettings,
            prompt,
          })
        : streamText({
            ...callSettings,
            messages,
          });

    for await (const part of result.fullStream) {
      const textDelta = streamTextDeltaFromPart(part);
      if (textDelta !== null) {
        emittedText += textDelta;
        await onTextDelta(textDelta);
        continue;
      }

      const reasoningDelta = streamReasoningDeltaFromPart(part);
      if (reasoningDelta !== null) {
        emittedReasoning += reasoningDelta;
        await onReasoningDelta?.(reasoningDelta);
        continue;
      }

      if (part.type === "error") {
        throw new Error(errorToMessage(part.error));
      }
    }

    const [steps, usage, warnings] = await Promise.all([
      result.steps,
      result.totalUsage,
      result.warnings,
    ]);

    return {
      text: emittedText.trim(),
      reasoningText: emittedReasoning.trim(),
      providerMode: config.aiProvider,
      model: modelId,
      stepCount: steps.length,
      toolCallCount: 0,
      toolResultCount: 0,
      ...buildPromptTelemetry(promptStats, usage, warnings),
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw new DateStreamAbortedError();
    }

    if (emittedText.length > 0) {
      throw error;
    }

    throw createAiError(streamFailureMessage(config.aiProvider), [error], config.aiProvider);
  }
}

function streamTextDeltaFromPart(part: unknown): string | null {
  const parsedPart = STREAM_TEXT_DELTA_PART_SCHEMA.safeParse(part);

  return parsedPart.success ? parsedPart.data.text : null;
}

function streamReasoningDeltaFromPart(part: unknown): string | null {
  const parsedPart = STREAM_REASONING_DELTA_PART_SCHEMA.safeParse(part);

  return parsedPart.success ? parsedPart.data.text : null;
}

async function generateObjectWithModelService<TSchema extends z.ZodType>(
  schema: TSchema,
  input: {
    system: string;
    prompt: string;
    messages?: ModelMessage[];
    modelId: string;
    config: AiRuntimeConfig;
    maxOutputTokens?: number;
  },
): Promise<z.infer<TSchema>> {
  if (input.config.aiProvider === "ollama") {
    try {
      return await generateJsonTextWithSchema(schema, input);
    } catch (error) {
      throw createAiError(structuredFailureMessage(input.config.aiProvider), [error], "ollama");
    }
  }

  try {
    const callSettings = {
      model: createLanguageModel(input.modelId, input.config),
      output: Output.object({ schema }),
      system: input.system,
      ...withOptionalMaxOutputTokens(input.maxOutputTokens),
      timeout: input.config.requestTimeoutMs,
      providerOptions: providerOptionsForRuntime(input.config, input.modelId),
    };
    const result =
      input.messages === undefined
        ? await generateText({
            ...callSettings,
            prompt: input.prompt,
          })
        : await generateText({
            ...callSettings,
            messages: input.messages,
          });

    return schema.parse(result.output);
  } catch (error) {
    throw createAiError(structuredFailureMessage(input.config.aiProvider), [error], "gateway");
  }
}

async function generateArrayWithModelService<TElementSchema extends z.ZodType>(
  elementSchema: TElementSchema,
  input: {
    system: string;
    prompt: string;
    messages?: ModelMessage[];
    modelId: string;
    config: AiRuntimeConfig;
    maxOutputTokens?: number;
  },
): Promise<Array<z.infer<TElementSchema>>> {
  const arraySchema = z.array(elementSchema);

  if (input.config.aiProvider === "ollama") {
    try {
      return await generateJsonTextWithSchema(arraySchema, input);
    } catch (error) {
      throw createAiError(structuredFailureMessage(input.config.aiProvider), [error], "ollama");
    }
  }

  try {
    const callSettings = {
      model: createLanguageModel(input.modelId, input.config),
      output: Output.array({ element: elementSchema }),
      system: input.system,
      ...withOptionalMaxOutputTokens(input.maxOutputTokens),
      timeout: input.config.requestTimeoutMs,
      providerOptions: providerOptionsForRuntime(input.config, input.modelId),
    };
    const result =
      input.messages === undefined
        ? await generateText({
            ...callSettings,
            prompt: input.prompt,
          })
        : await generateText({
            ...callSettings,
            messages: input.messages,
          });

    return arraySchema.parse(result.output);
  } catch (error) {
    throw createAiError(structuredFailureMessage(input.config.aiProvider), [error], "gateway");
  }
}

async function generateJsonTextWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  input: {
    system: string;
    prompt: string;
    messages?: ModelMessage[];
    modelId: string;
    config: AiRuntimeConfig;
    maxOutputTokens?: number;
  },
): Promise<z.infer<TSchema>> {
  const callSettings = {
    model: createJsonLanguageModel(input.modelId, input.config),
    system: [
      input.system,
      "",
      "Return valid JSON only. Do not include Markdown, comments, or prose outside JSON.",
    ].join("\n"),
    ...withOptionalMaxOutputTokens(input.maxOutputTokens),
    temperature: 0.2,
    timeout: input.config.requestTimeoutMs,
  };
  const result =
    input.messages === undefined
      ? await generateText({
          ...callSettings,
          prompt: input.prompt,
        })
      : await generateText({
          ...callSettings,
          messages: input.messages,
        });
  const parsedJson = parseJsonText(result.text);

  return schema.parse(parsedJson);
}

type OllamaProvider = ReturnType<typeof createOllama>;
type GatewayProvider = ReturnType<typeof createOpenAICompatible>;

const PROVIDER_CACHE_LIMIT = 8;
const ollamaProviderCache = new Map<string, OllamaProvider>();
const gatewayProviderCache = new Map<string, GatewayProvider>();

function promptStatsForRequest({
  system,
  prompt,
  messages,
  provider,
  contextWindowTokens,
}: {
  system: string;
  prompt: string;
  messages?: ModelMessage[];
  provider: AiProvider;
  contextWindowTokens: number;
}): { characters: number; estimatedTokens: number; warningMessages: string[] } {
  const promptText =
    messages === undefined
      ? `${system}\n${prompt}`
      : `${system}\n${messages.map((message) => messageContentText(message.content)).join("\n")}`;
  const characters = promptText.length;
  const estimatedTokens = Math.ceil(characters / 4);
  const warningMessages =
    provider === "ollama" && estimatedTokens >= Math.floor(contextWindowTokens * 0.8)
      ? [
          `Prompt is near the local context budget (${estimatedTokens}/${contextWindowTokens} estimated tokens). Cupid may need to summarize older turns soon.`,
        ]
      : [];

  return {
    characters,
    estimatedTokens,
    warningMessages,
  };
}

function messageContentText(content: ModelMessage["content"]): string {
  if (typeof content === "string") {
    return content;
  }

  return JSON.stringify(content);
}

function usageTelemetryFrom(usage: {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}): AiUsageTelemetry {
  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
  };
}

function warningMessagesFrom(warnings: readonly unknown[] | undefined): string[] {
  if (warnings === undefined) {
    return [];
  }

  return warnings.map(warningMessageFrom);
}

function buildPromptTelemetry(
  promptStats: { characters: number; estimatedTokens: number; warningMessages: string[] },
  usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number },
  warnings: readonly unknown[] | undefined,
): {
  promptCharacters: number;
  estimatedPromptTokens: number;
  usage: AiUsageTelemetry;
  warningMessages: string[];
} {
  return {
    promptCharacters: promptStats.characters,
    estimatedPromptTokens: promptStats.estimatedTokens,
    usage: usageTelemetryFrom(usage),
    warningMessages: [...promptStats.warningMessages, ...warningMessagesFrom(warnings)],
  };
}

function warningMessageFrom(warning: unknown): string {
  if (isRecord(warning)) {
    const type = typeof warning.type === "string" ? warning.type : "provider warning";
    const message = typeof warning.message === "string" ? warning.message : undefined;

    return message === undefined ? type : `${type}: ${message}`;
  }

  return errorToMessage(warning);
}

function getOllamaProvider(baseURL: string | undefined): OllamaProvider {
  return getOrCreateProvider(ollamaProviderCache, baseURL ?? "", () =>
    createOllama({ baseURL, fetch: selectFetch() }),
  );
}

function getGatewayProvider(baseURL: string, apiKey: string | undefined): GatewayProvider {
  return getOrCreateProvider(gatewayProviderCache, JSON.stringify([baseURL, apiKey ?? ""]), () =>
    createOpenAICompatible({
      name: GATEWAY_PROVIDER_NAME,
      baseURL,
      apiKey,
      supportsStructuredOutputs: true,
      fetch: selectFetch(),
    }),
  );
}

function getOrCreateProvider<TProvider>(
  cache: Map<string, TProvider>,
  key: string,
  build: () => TProvider,
): TProvider {
  const cached = cache.get(key);

  if (cached !== undefined) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  if (cache.size >= PROVIDER_CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  const provider = build();
  cache.set(key, provider);
  return provider;
}

function createLanguageModel(
  modelId: string,
  config: AiRuntimeConfig,
  options?: AiGenerationOptions,
) {
  if (config.aiProvider === "gateway") {
    assertGatewayKey(config);
    return getGatewayProvider(
      config.gatewayBaseURL ?? DEFAULT_GATEWAY_BASE_URL,
      config.gatewayApiKey,
    ).chatModel(modelId);
  }

  return getOllamaProvider(config.ollamaBaseURL ?? DEFAULT_OLLAMA_BASE_URL)(
    modelId,
    createOllamaChatSettings(config, options),
  );
}

function createJsonLanguageModel(modelId: string, config: AiRuntimeConfig) {
  return getOllamaProvider(config.ollamaBaseURL ?? DEFAULT_OLLAMA_BASE_URL)(
    modelId,
    createOllamaChatSettings(config, undefined, OLLAMA_JSON_CHAT_SETTINGS),
  );
}

function createEmbeddingModel(modelId: string, config: AiRuntimeConfig) {
  if (config.aiProvider === "gateway") {
    assertGatewayKey(config);
    return getGatewayProvider(
      config.gatewayBaseURL ?? DEFAULT_GATEWAY_BASE_URL,
      config.gatewayApiKey,
    ).embeddingModel(modelId);
  }

  return getOllamaProvider(config.ollamaBaseURL ?? DEFAULT_OLLAMA_BASE_URL).embedding(modelId, {
    options: {
      num_ctx: config.embeddingContextWindowTokens,
    },
  });
}

function createOllamaChatSettings(
  config: AiRuntimeConfig,
  options?: AiGenerationOptions,
  baseSettings: OllamaChatSettings = OLLAMA_BASE_CHAT_SETTINGS,
): OllamaChatSettings {
  const ollamaOptions: Partial<OllamaOptions> = {
    num_ctx: options?.numCtx ?? config.contextWindowTokens,
  };

  return {
    ...baseSettings,
    options: ollamaOptions,
  };
}

function providerOptionsForRuntime(
  config: AiRuntimeConfig,
  modelId: string,
): { openaiCompatible: { reasoningEffort: string } } | undefined {
  if (config.aiProvider !== "gateway") {
    return undefined;
  }

  const reasoningEffort = gatewayReasoningLevelForModel(modelId, config.reasoningLevel);

  if (reasoningEffort === "off") {
    return undefined;
  }

  return {
    openaiCompatible: {
      reasoningEffort,
    },
  };
}

function assertGatewayKey(config: AiRuntimeConfig): void {
  if (normalizeOptionalSecret(config.gatewayApiKey) !== undefined) {
    return;
  }

  throw new AiModelError(
    "Gateway API key missing. Enter a key in AI setup.",
    "missing gateway API key",
  );
}

async function fetchOllamaJson(url: string, timeoutMs: number): Promise<unknown> {
  try {
    const response = await selectFetch()(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

function uniqueModelByName(
  model: OllamaModelSummary,
  index: number,
  models: OllamaModelSummary[],
): boolean {
  return models.findIndex((candidate) => candidate.name === model.name) === index;
}

function normalizeOptionalSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}

function createAiError(message: string, errors: unknown[], provider: AiProvider): AiModelError {
  const causeMessage = errors.map(errorToMessage).join(" | ");

  return provider === "ollama"
    ? new LocalAiError(message, causeMessage)
    : new AiModelError(message, causeMessage);
}

function textFailureMessage(provider: AiProvider): string {
  return provider === "ollama"
    ? "Text generation failed. Confirm Ollama is running and the requested model is pulled."
    : "Text generation failed. Confirm the Gateway key and selected model.";
}

function streamFailureMessage(provider: AiProvider): string {
  return provider === "ollama"
    ? "Text streaming failed. Confirm Ollama is running and the requested model is pulled."
    : "Text streaming failed. Confirm the Gateway key and selected model.";
}

function structuredFailureMessage(provider: AiProvider): string {
  return provider === "ollama"
    ? "Structured generation failed. Confirm Ollama can produce JSON for this model."
    : "Structured generation failed. Confirm the Gateway key and selected model.";
}

function embeddingFailureMessage(provider: AiProvider): string {
  return provider === "ollama"
    ? "Embedding generation failed. Confirm Ollama is running and embeddinggemma is pulled."
    : "Embedding generation failed. Confirm the Gateway key and embedding model.";
}

function parseJsonText(text: string): unknown {
  const trimmedText = text.trim();

  try {
    return JSON.parse(trimmedText);
  } catch (error) {
    const payload = extractJsonPayload(trimmedText);

    if (payload === null) {
      throw error;
    }

    return JSON.parse(payload);
  }
}

function extractJsonPayload(text: string): string | null {
  const objectStart = text.indexOf("{");
  const arrayStart = text.indexOf("[");
  const startCandidates = [objectStart, arrayStart].filter((index) => index >= 0);

  if (startCandidates.length === 0) {
    return null;
  }

  const start = Math.min(...startCandidates);
  const endToken = text[start] === "{" ? "}" : "]";
  const end = text.lastIndexOf(endToken);

  if (end < start) {
    return null;
  }

  return text.slice(start, end + 1);
}
