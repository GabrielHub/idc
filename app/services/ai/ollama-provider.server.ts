import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed, generateObject, generateText } from "ai";
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
): Promise<GeneratedTextResult> {
  const runtimeConfig = normalizeRuntimeConfig(config);
  const modelId = runtimeConfig.performerModel;

  return generateTextWithFallback({
    system: packet.system,
    prompt: packet.prompt,
    modelId,
    config: runtimeConfig,
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

  try {
    const provider = createOllama({
      baseURL: runtimeConfig.ollamaBaseURL,
    });
    const result = await embed({
      model: provider.embedding(modelId),
      value: text,
    });

    return {
      embedding: result.embedding,
      model: modelId,
      dimensions: result.embedding.length,
    };
  } catch (firstError) {
    try {
      const provider = createOpenAICompatible({
        name: "ollama-openai-compatible",
        baseURL: runtimeConfig.openAICompatibleBaseURL ?? DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
        apiKey: "ollama",
      });
      const result = await embed({
        model: provider.embeddingModel(modelId),
        value: text,
      });

      return {
        embedding: result.embedding,
        model: modelId,
        dimensions: result.embedding.length,
      };
    } catch (secondError) {
      throw createLocalAiError(
        "Embedding generation failed. Confirm Ollama is running and the embedding model is pulled.",
        [firstError, secondError],
      );
    }
  }
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
}: {
  system: string;
  prompt: string;
  modelId: string;
  config: LocalAiRuntimeConfig;
}): Promise<GeneratedTextResult> {
  const providerModes = providerModeOrder(config.providerMode ?? "ollama");
  const errors: unknown[] = [];

  for (const providerMode of providerModes) {
    try {
      const result = await generateText({
        model: createLanguageModel(providerMode, modelId, config),
        system,
        prompt,
        timeout: config.requestTimeoutMs,
      });

      return {
        text: result.text.trim(),
        providerMode,
        model: modelId,
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

function createLanguageModel(
  providerMode: LocalAiProviderMode,
  modelId: string,
  config: LocalAiRuntimeConfig,
) {
  if (providerMode === "openai-compatible") {
    const provider = createOpenAICompatible({
      name: "ollama-openai-compatible",
      baseURL: config.openAICompatibleBaseURL ?? DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
      apiKey: "ollama",
      supportsStructuredOutputs: true,
    });

    return provider.chatModel(modelId);
  }

  const provider = createOllama({
    baseURL: config.ollamaBaseURL,
  });

  return provider(modelId);
}

function providerModeOrder(preferredMode: LocalAiProviderMode): LocalAiProviderMode[] {
  return preferredMode === "ollama"
    ? ["ollama", "openai-compatible"]
    : ["openai-compatible", "ollama"];
}

function createLocalAiError(message: string, errors: unknown[]): LocalAiError {
  return new LocalAiError(message, errors.map(errorToMessage).join(" | "));
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
