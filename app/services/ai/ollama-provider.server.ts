import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed, generateObject, generateText, stepCountIs, tool } from "ai";
import { createOllama } from "ai-sdk-ollama";
import { z } from "zod";

import {
  deltaSchema,
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

export type CharacterMemoryToolInput = {
  query: string;
  scope: Array<"self" | "pair" | "scenario">;
  limit: number;
};

export type CharacterMemoryToolResult = {
  id: string;
  text: string;
  score: number;
  scope: string;
  tags: string[];
};

export type CharacterMemoryToolExecution = (
  input: CharacterMemoryToolInput,
) => Promise<CharacterMemoryToolResult[]>;

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
  dateHealthDelta: deltaSchema,
  statDeltas: z.partialRecord(relationshipStatSchema, deltaSchema),
  memberMoodDeltas: z.record(memberIdSchema, deltaSchema),
  shouldEndEarly: z.boolean(),
  earlyEndReason: z.string().min(1).optional(),
  notableMoments: z.array(z.string().min(1)),
  playerSummary: z.string().min(1),
  memoryCandidates: z.array(memoryCandidateSchema),
});

export async function generateCharacterTurn(
  packet: CharacterPromptPacket,
  config?: Partial<LocalAiRuntimeConfig>,
  memoryTool?: CharacterMemoryToolExecution,
): Promise<GeneratedTextResult> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const modelId = runtimeConfig.performerModel;

  return generateTextWithFallback({
    system: packet.system,
    prompt: packet.prompt,
    modelId,
    config: runtimeConfig,
    memoryTool,
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
  const output = await generateObjectWithFallback(z.array(memoryCandidateSchema), {
    system: packet.system,
    prompt: packet.prompt,
    modelId,
    config: runtimeConfig,
  });

  return z.array(memoryCandidateSchema).parse(output);
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
  memoryTool,
}: {
  system: string;
  prompt: string;
  modelId: string;
  config: LocalAiRuntimeConfig;
  memoryTool?: CharacterMemoryToolExecution;
}): Promise<GeneratedTextResult> {
  const providerModes = providerModeOrder(config.providerMode ?? "ollama");
  const errors: unknown[] = [];

  for (const providerMode of providerModes) {
    try {
      const result = await generateText({
        model: createLanguageModel(providerMode, modelId, config),
        system,
        prompt,
        tools: createCharacterTools(memoryTool),
        stopWhen: memoryTool === undefined ? stepCountIs(1) : stepCountIs(2),
        timeout: config.requestTimeoutMs,
      });

      return {
        text: result.text.trim(),
        providerMode,
        model: modelId,
        stepCount: result.steps.length,
        toolCallCount: result.steps.reduce((total, step) => total + step.toolCalls.length, 0),
        toolResultCount: result.steps.reduce((total, step) => total + step.toolResults.length, 0),
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

function createCharacterTools(memoryTool: CharacterMemoryToolExecution | undefined) {
  if (memoryTool === undefined) {
    return undefined;
  }

  return {
    searchCupidMemory: tool({
      description:
        "Search only this character's allowed IDC memories for self, pair, or current scenario context.",
      inputSchema: z.object({
        query: z.string().min(1).max(240),
        scope: z
          .array(z.enum(["self", "pair", "scenario"]))
          .min(1)
          .max(3),
        limit: z.number().int().min(1).max(5),
      }),
      execute: memoryTool,
    }),
  };
}

async function generateObjectWithFallback<TSchema extends z.ZodType>(
  schema: TSchema,
  input: {
    system: string;
    prompt: string;
    modelId: string;
    config: LocalAiRuntimeConfig;
  },
): Promise<z.infer<TSchema>> {
  const providerModes = providerModeOrder(input.config.providerMode ?? "ollama");
  const errors: unknown[] = [];

  for (const providerMode of providerModes) {
    try {
      const result = await generateObject({
        model: createLanguageModel(providerMode, input.modelId, input.config),
        schema,
        system: input.system,
        prompt: input.prompt,
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

  return getOllamaProvider(config.ollamaBaseURL)(modelId);
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

  return getOllamaProvider(config.ollamaBaseURL).embedding(modelId);
}

function providerModeOrder(preferredMode: LocalAiProviderMode): LocalAiProviderMode[] {
  return preferredMode === "ollama"
    ? ["ollama", "openai-compatible"]
    : ["openai-compatible", "ollama"];
}

function createLocalAiError(message: string, errors: unknown[]): LocalAiError {
  return new LocalAiError(message, errors.map(errorToMessage).join(" | "));
}
