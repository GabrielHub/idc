import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed, generateObject, generateText, streamText } from "ai";
import { createOllama, type OllamaChatSettings, type OllamaEmbeddingSettings } from "ai-sdk-ollama";
import { z } from "zod";

import {
  gameConfigSchema,
  judgeSnapshotSchema,
  memoryCandidateSchema,
  memberIdSchema,
  relationshipStatSchema,
  type GameConfig,
  type JudgeSnapshot,
  type MemoryCandidate,
} from "../../domain/game";
import type {
  CharacterPromptPacket,
  JudgePromptPacket,
  SummarizerPromptPacket,
} from "../date-prompts";
import { errorToMessage } from "../utils";

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OPENAI_COMPATIBLE_BASE_URL = "http://127.0.0.1:11434/v1";
const CHARACTER_MAX_OUTPUT_TOKENS = 160;
const JUDGE_MAX_OUTPUT_TOKENS = 900;
const SUMMARIZER_MAX_OUTPUT_TOKENS = 900;
const READINESS_MAX_OUTPUT_TOKENS = 32;
const OLLAMA_CONTEXT_WINDOW_TOKENS = 8192;
const OLLAMA_EMBEDDING_CONTEXT_WINDOW_TOKENS = 2048;
const OLLAMA_KEEP_ALIVE = "10m";
const OLLAMA_CHAT_SETTINGS: OllamaChatSettings = {
  think: false,
  keep_alive: OLLAMA_KEEP_ALIVE,
  options: {
    num_ctx: OLLAMA_CONTEXT_WINDOW_TOKENS,
  },
};
const OLLAMA_JSON_CHAT_SETTINGS: OllamaChatSettings = {
  ...OLLAMA_CHAT_SETTINGS,
  format: "json",
};
const OLLAMA_EMBEDDING_SETTINGS: OllamaEmbeddingSettings = {
  options: {
    num_ctx: OLLAMA_EMBEDDING_CONTEXT_WINDOW_TOKENS,
  },
};
const LOCAL_AI_DATE_HEALTH_DELTA_SCHEMA = z.number().int().min(-12).max(12);
const LOCAL_AI_STAT_DELTA_SCHEMA = z.number().int().min(-8).max(8);
const LOCAL_AI_MEMBER_MOOD_DELTA_SCHEMA = z.number().int().min(-8).max(8);

export type LocalAiProviderMode = "ollama" | "openai-compatible";

export type LocalAiRuntimeConfig = GameConfig & {
  providerMode?: LocalAiProviderMode;
  ollamaBaseURL?: string;
  openAICompatibleBaseURL?: string;
  requestTimeoutMs?: number;
};

export type GeneratedTextResult = {
  text: string;
  providerMode: LocalAiProviderMode;
  model: string;
  stepCount: number;
  toolCallCount: number;
  toolResultCount: number;
};

export type LocalAiReadiness = {
  languageModels: string[];
  providerModes: LocalAiProviderMode[];
  embeddingModel: string;
  embeddingDimensions: number;
};

export class LocalAiError extends Error {
  constructor(
    message: string,
    readonly causeMessage: string,
  ) {
    super(message);
    this.name = "LocalAiError";
  }
}

const judgeAiOutputSchema = z.object({
  dateHealthDelta: LOCAL_AI_DATE_HEALTH_DELTA_SCHEMA,
  statDeltas: z.partialRecord(relationshipStatSchema, LOCAL_AI_STAT_DELTA_SCHEMA),
  memberMoodDeltas: z.record(memberIdSchema, LOCAL_AI_MEMBER_MOOD_DELTA_SCHEMA),
  shouldEndEarly: z.boolean(),
  earlyEndReason: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  ),
  notableMoments: z.array(z.string().min(1)),
  playerSummary: z.string().min(1),
  memoryCandidates: z.array(memoryCandidateSchema),
});

export async function generateCharacterTurn(
  packet: CharacterPromptPacket,
  config?: Partial<LocalAiRuntimeConfig>,
): Promise<GeneratedTextResult> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const modelId = runtimeConfig.performerModel;

  return generateTextWithFallback({
    system: packet.system,
    prompt: packet.prompt,
    modelId,
    config: runtimeConfig,
    maxOutputTokens: CHARACTER_MAX_OUTPUT_TOKENS,
  });
}

export async function streamCharacterTurn(
  packet: CharacterPromptPacket,
  config: Partial<LocalAiRuntimeConfig> | undefined,
  onTextDelta: (delta: string) => Promise<void> | void,
): Promise<GeneratedTextResult> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const modelId = runtimeConfig.performerModel;

  return streamTextWithFallback({
    system: packet.system,
    prompt: packet.prompt,
    modelId,
    config: runtimeConfig,
    maxOutputTokens: CHARACTER_MAX_OUTPUT_TOKENS,
    onTextDelta,
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
  config?: Partial<LocalAiRuntimeConfig>;
}): Promise<JudgeSnapshot> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const modelId = runtimeConfig.judgeModel;
  const output = await generateObjectWithFallback(judgeAiOutputSchema, {
    system: packet.system,
    prompt: packet.prompt,
    modelId,
    config: runtimeConfig,
    maxOutputTokens: JUDGE_MAX_OUTPUT_TOKENS,
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
  config?: Partial<LocalAiRuntimeConfig>,
): Promise<MemoryCandidate[]> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const modelId = runtimeConfig.summarizerModel;
  return generateObjectWithFallback(z.array(memoryCandidateSchema), {
    system: packet.system,
    prompt: packet.prompt,
    modelId,
    config: runtimeConfig,
    maxOutputTokens: SUMMARIZER_MAX_OUTPUT_TOKENS,
  });
}

export async function embedMemoryText(
  text: string,
  config?: Partial<LocalAiRuntimeConfig>,
): Promise<{ embedding: number[]; model: string; dimensions: number }> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const modelId = runtimeConfig.embeddingModel;
  const providerModes = providerModeOrder(runtimeConfig.providerMode ?? "ollama");
  const errors: unknown[] = [];

  for (const providerMode of providerModes) {
    try {
      const result = await embed({
        model: createEmbeddingModel(providerMode, modelId, runtimeConfig),
        value: text,
        abortSignal: AbortSignal.timeout(runtimeConfig.requestTimeoutMs ?? 30_000),
      });

      return {
        embedding: result.embedding,
        model: modelId,
        dimensions: result.embedding.length,
      };
    } catch (error) {
      errors.push(error);
    }
  }

  throw createLocalAiError(
    "Embedding generation failed. Confirm Ollama is running and the embedding model is pulled.",
    errors,
  );
}

export async function checkLocalAiReadiness(
  config?: Partial<LocalAiRuntimeConfig>,
): Promise<LocalAiReadiness> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const languageModelIds = Array.from(
    new Set([
      runtimeConfig.performerModel,
      runtimeConfig.judgeModel,
      runtimeConfig.summarizerModel,
    ]),
  );
  const languageResults: GeneratedTextResult[] = [];

  for (const modelId of languageModelIds) {
    const result = await generateTextWithFallback({
      system: "You are an IDC local AI readiness check.",
      prompt: "Reply with exactly: READY",
      modelId,
      config: runtimeConfig,
      maxOutputTokens: READINESS_MAX_OUTPUT_TOKENS,
    });

    if (result.text.length === 0) {
      throw new LocalAiError("Readiness check failed. Local AI returned an empty reply.", modelId);
    }

    languageResults.push(result);
  }

  const embeddingResult = await embedMemoryText("IDC local AI readiness check.", runtimeConfig);

  return {
    languageModels: languageResults.map((result) => result.model),
    providerModes: Array.from(new Set(languageResults.map((result) => result.providerMode))),
    embeddingModel: embeddingResult.model,
    embeddingDimensions: embeddingResult.dimensions,
  };
}

function normalizeRuntimeConfig(config?: Partial<LocalAiRuntimeConfig>): LocalAiRuntimeConfig {
  const gameConfig = gameConfigSchema.parse(config ?? {});

  return {
    ...gameConfig,
    providerMode: config?.providerMode ?? "ollama",
    ollamaBaseURL: config?.ollamaBaseURL ?? DEFAULT_OLLAMA_BASE_URL,
    openAICompatibleBaseURL: config?.openAICompatibleBaseURL ?? DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
    requestTimeoutMs: config?.requestTimeoutMs ?? 30_000,
  };
}

async function generateTextWithFallback({
  system,
  prompt,
  modelId,
  config,
  maxOutputTokens,
}: {
  system: string;
  prompt: string;
  modelId: string;
  config: LocalAiRuntimeConfig;
  maxOutputTokens: number;
}): Promise<GeneratedTextResult> {
  const providerModes = providerModeOrder(config.providerMode ?? "ollama");
  const errors: unknown[] = [];

  for (const providerMode of providerModes) {
    try {
      const result = await generateText({
        model: createLanguageModel(providerMode, modelId, config),
        system,
        prompt,
        maxOutputTokens,
        timeout: config.requestTimeoutMs,
      });

      return {
        text: result.text.trim(),
        providerMode,
        model: modelId,
        stepCount: result.steps.length,
        toolCallCount: 0,
        toolResultCount: 0,
      };
    } catch (error) {
      errors.push(error);
    }
  }

  throw createLocalAiError(
    "Text generation failed. Confirm Ollama is running and the requested model is pulled.",
    errors,
  );
}

async function streamTextWithFallback({
  system,
  prompt,
  modelId,
  config,
  maxOutputTokens,
  onTextDelta,
}: {
  system: string;
  prompt: string;
  modelId: string;
  config: LocalAiRuntimeConfig;
  maxOutputTokens: number;
  onTextDelta: (delta: string) => Promise<void> | void;
}): Promise<GeneratedTextResult> {
  const providerModes = providerModeOrder(config.providerMode ?? "ollama");
  const errors: unknown[] = [];
  let emittedText = "";

  for (const providerMode of providerModes) {
    try {
      const result = streamText({
        model: createLanguageModel(providerMode, modelId, config),
        system,
        prompt,
        maxOutputTokens,
        timeout: config.requestTimeoutMs,
      });
      let text = "";

      for await (const delta of result.textStream) {
        text += delta;
        emittedText += delta;
        await onTextDelta(delta);
      }

      const steps = await result.steps;

      return {
        text: text.trim(),
        providerMode,
        model: modelId,
        stepCount: steps.length,
        toolCallCount: 0,
        toolResultCount: 0,
      };
    } catch (error) {
      if (emittedText.length > 0) {
        throw error;
      }

      errors.push(error);
    }
  }

  throw createLocalAiError(
    "Text streaming failed. Confirm Ollama is running and the requested model is pulled.",
    errors,
  );
}

async function generateObjectWithFallback<TSchema extends z.ZodType>(
  schema: TSchema,
  input: {
    system: string;
    prompt: string;
    modelId: string;
    config: LocalAiRuntimeConfig;
    maxOutputTokens: number;
  },
): Promise<z.infer<TSchema>> {
  const providerModes = providerModeOrder(input.config.providerMode ?? "ollama");
  const errors: unknown[] = [];

  for (const providerMode of providerModes) {
    if (providerMode === "ollama") {
      try {
        return await generateJsonTextWithSchema(schema, input);
      } catch (error) {
        errors.push(error);
      }
    }

    try {
      const result = await generateObject({
        model: createLanguageModel(providerMode, input.modelId, input.config),
        schema,
        system: input.system,
        prompt: input.prompt,
        maxOutputTokens: input.maxOutputTokens,
        timeout: input.config.requestTimeoutMs,
      });

      return schema.parse(result.object);
    } catch (error) {
      errors.push(error);
    }
  }

  throw createLocalAiError(
    "Structured generation failed. Confirm Ollama can produce JSON for this model.",
    errors,
  );
}

async function generateJsonTextWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  input: {
    system: string;
    prompt: string;
    modelId: string;
    config: LocalAiRuntimeConfig;
    maxOutputTokens: number;
  },
): Promise<z.infer<TSchema>> {
  const result = await generateText({
    model: createJsonLanguageModel(input.modelId, input.config),
    system: [
      input.system,
      "",
      "Return valid JSON only. Do not include Markdown, comments, or prose outside JSON.",
    ].join("\n"),
    prompt: input.prompt,
    maxOutputTokens: input.maxOutputTokens,
    temperature: 0.2,
    timeout: input.config.requestTimeoutMs,
  });
  const parsedJson = parseJsonText(result.text);

  return schema.parse(parsedJson);
}

type OllamaProvider = ReturnType<typeof createOllama>;
type OpenAICompatibleProvider = ReturnType<typeof createOpenAICompatible>;

const ollamaProviderCache = new Map<string, OllamaProvider>();
const openAICompatibleProviderCache = new Map<string, OpenAICompatibleProvider>();

function getOllamaProvider(baseURL: string | undefined): OllamaProvider {
  const cacheKey = baseURL ?? "";
  const cached = ollamaProviderCache.get(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const provider = createOllama({ baseURL });
  ollamaProviderCache.set(cacheKey, provider);
  return provider;
}

function getOpenAICompatibleProvider(baseURL: string): OpenAICompatibleProvider {
  const cached = openAICompatibleProviderCache.get(baseURL);

  if (cached !== undefined) {
    return cached;
  }

  const provider = createOpenAICompatible({
    name: "ollama-openai-compatible",
    baseURL,
    apiKey: "ollama",
    supportsStructuredOutputs: true,
  });
  openAICompatibleProviderCache.set(baseURL, provider);
  return provider;
}

function createLanguageModel(
  providerMode: LocalAiProviderMode,
  modelId: string,
  config: LocalAiRuntimeConfig,
) {
  if (providerMode === "openai-compatible") {
    const baseURL = config.openAICompatibleBaseURL ?? DEFAULT_OPENAI_COMPATIBLE_BASE_URL;
    return getOpenAICompatibleProvider(baseURL).chatModel(modelId);
  }

  return getOllamaProvider(config.ollamaBaseURL)(modelId, OLLAMA_CHAT_SETTINGS);
}

function createJsonLanguageModel(modelId: string, config: LocalAiRuntimeConfig) {
  return getOllamaProvider(config.ollamaBaseURL)(modelId, OLLAMA_JSON_CHAT_SETTINGS);
}

function createEmbeddingModel(
  providerMode: LocalAiProviderMode,
  modelId: string,
  config: LocalAiRuntimeConfig,
) {
  if (providerMode === "openai-compatible") {
    const baseURL = config.openAICompatibleBaseURL ?? DEFAULT_OPENAI_COMPATIBLE_BASE_URL;
    return getOpenAICompatibleProvider(baseURL).embeddingModel(modelId);
  }

  return getOllamaProvider(config.ollamaBaseURL).embedding(modelId, OLLAMA_EMBEDDING_SETTINGS);
}

function providerModeOrder(preferredMode: LocalAiProviderMode): LocalAiProviderMode[] {
  return preferredMode === "ollama"
    ? ["ollama", "openai-compatible"]
    : ["openai-compatible", "ollama"];
}

function createLocalAiError(message: string, errors: unknown[]): LocalAiError {
  return new LocalAiError(message, errors.map(errorToMessage).join(" | "));
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
