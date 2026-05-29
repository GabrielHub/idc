import { APICallError, JSONParseError, MissingToolResultsError } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { gameConfigSchema } from "../../domain/game";
import {
  applyDeepSeekRoleplayThinkingMode,
  defaultMaxOutputTokensForProvider,
  defaultRequestTimeoutMsForProvider,
  generateCharacterTurn,
  judgeDateExchange,
  ollamaThinkForReasoningLevel,
  parseOllamaModelInventory,
  providerOptionsForRuntime,
  summarizeDateMemories,
  type AiRuntimeConfig,
} from "./model-service";

const aiMocks = vi.hoisted(() => ({
  createGateway: vi.fn(() => ({
    embeddingModel: vi.fn((modelId: string) => ({ modelId, provider: "gateway-embedding" })),
    languageModel: vi.fn((modelId: string) => ({ modelId, provider: "gateway-language" })),
  })),
  generateText: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    createGateway: aiMocks.createGateway,
    generateText: aiMocks.generateText,
  };
});

type MinimalGenerateTextResult = {
  output?: unknown;
  text: string;
};

const gatewayConfig = {
  aiProvider: "gateway",
  chatModel: "google/gemini-3.1-flash-lite",
  gatewayApiKey: "test-gateway-key",
  requestTimeoutMs: 1_000,
} satisfies Partial<AiRuntimeConfig>;

const judgeOutput = {
  dateHealthDelta: 0,
  statDeltas: {},
  memberMoodDeltas: {
    "alex-yoon": 0,
    vhool: 0,
  },
  shouldEndEarly: false,
  endSentiment: null,
  notableMoments: ["Alex and Vhool kept the table steady."],
  playerSummary: "Cupid filed a steady exchange.",
  memoryCandidates: [],
  usedEvidenceIds: [],
  agreementCandidates: [],
  agreementUpdates: [],
  openLoopCandidates: [],
  openLoopUpdates: [],
};

const memoryCandidate = {
  scope: "pair",
  visibility: "public",
  subjectIds: ["alex-yoon", "vhool"],
  pairId: "alex-yoon__vhool",
  scenarioId: "temporal-coffee-shop",
  dateSessionId: "date-1",
  text: "Alex and Vhool agreed the table stayed manageable.",
  tags: ["date_summary", "interaction"],
  importance: 3,
};

function textGenerationResult(text: string): MinimalGenerateTextResult {
  return { text };
}

function characterGenerationResult(text: string) {
  return {
    text,
    steps: [],
    totalUsage: {},
    warnings: [],
  };
}

function outputGenerationResult(output: unknown): MinimalGenerateTextResult {
  return { text: "", output };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

describe("AI model service", () => {
  beforeEach(() => {
    aiMocks.createGateway.mockClear();
    aiMocks.generateText.mockReset();
  });

  it("parses Ollama tags and running model status for recommended families", () => {
    const inventory = parseOllamaModelInventory(
      {
        models: [
          { name: "gemma4:e4b", size: 4 },
          { name: "llama3.3:70b", size: 70 },
          { name: "embeddinggemma:latest" },
        ],
      },
      {
        models: [{ name: "gemma4:e4b" }],
      },
    );

    expect(inventory.models.find((model) => model.name === "gemma4:e4b")?.running).toBe(true);
    expect(inventory.chatModels.map((model) => model.name)).toEqual(["gemma4:e4b"]);
    expect(inventory.embeddingModels.map((model) => model.name)).toEqual(["embeddinggemma:latest"]);
    expect(inventory.runningModels.map((model) => model.name)).toEqual(["gemma4:e4b"]);
  });

  it("uses running models when tags fail", () => {
    const inventory = parseOllamaModelInventory(null, {
      models: [{ name: "gemma4:e4b" }, { name: "llama3.3:70b" }],
    });

    expect(inventory.models.map((model) => model.name)).toEqual(["gemma4:e4b", "llama3.3:70b"]);
    expect(inventory.chatModels.map((model) => model.name)).toEqual(["gemma4:e4b"]);
  });

  it("leaves Gateway output unbounded unless a caller sets an explicit cap", () => {
    expect(defaultMaxOutputTokensForProvider("ollama", 32)).toBe(32);
    expect(defaultMaxOutputTokensForProvider("gateway", 32)).toBeUndefined();
  });

  it("caps Gateway character replies at the performer boundary", async () => {
    aiMocks.generateText.mockResolvedValueOnce(characterGenerationResult("short line."));

    await generateCharacterTurn({
      packet: {
        system: "perform Alex",
        prompt: "preview",
        messages: [{ role: "user", content: "How was work?" }],
      },
      config: gatewayConfig,
    });

    expect(aiMocks.generateText).toHaveBeenCalledWith(
      expect.objectContaining({ maxOutputTokens: 2048 }),
    );
  });

  it("gives Gateway requests a longer default timeout", () => {
    expect(defaultRequestTimeoutMsForProvider("ollama")).toBe(30_000);
    expect(defaultRequestTimeoutMsForProvider("gateway")).toBe(120_000);
  });

  it("maps saved reasoning levels into Ollama think settings", () => {
    expect(ollamaThinkForReasoningLevel("off")).toBe(false);
    expect(ollamaThinkForReasoningLevel("none")).toBe(false);
    expect(ollamaThinkForReasoningLevel("minimal")).toBe("low");
    expect(ollamaThinkForReasoningLevel("low")).toBe("low");
    expect(ollamaThinkForReasoningLevel("medium")).toBe("medium");
    expect(ollamaThinkForReasoningLevel("high")).toBe("high");
    expect(ollamaThinkForReasoningLevel("xhigh")).toBe("high");
  });

  it("uses native Gateway provider options without returning Google thought summaries", () => {
    const gatewayConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      reasoningLevel: "high",
    });

    expect(providerOptionsForRuntime(gatewayConfig, "google/gemini-3.1-flash-lite")).toEqual({
      google: {
        thinkingConfig: {
          thinkingLevel: "medium",
          includeThoughts: false,
        },
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "deepseek/deepseek-v4-flash")).toEqual({
      deepseek: {
        thinking: { type: "enabled" },
        reasoningEffort: "max",
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "deepseek/deepseek-v4-pro")).toEqual({
      deepseek: {
        thinking: { type: "enabled" },
        reasoningEffort: "max",
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "anthropic/claude-sonnet-4.6")).toBeUndefined();
    expect(providerOptionsForRuntime(gatewayConfig, "anthropic/claude-haiku-4.5")).toBeUndefined();
    expect(providerOptionsForRuntime(gatewayConfig, "moonshotai/kimi-k2.5")).toBeUndefined();
    expect(providerOptionsForRuntime(gatewayConfig, "xai/grok-4.3")).toBeUndefined();
    expect(providerOptionsForRuntime(gatewayConfig, "openai/gpt-5.4-nano")).toEqual({
      openai: {
        reasoningEffort: "none",
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "xiaomi/mimo-v2.5")).toEqual({
      xiaomi: {
        thinking: { type: "enabled" },
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "xiaomi/mimo-v2.5-pro")).toEqual({
      xiaomi: {
        thinking: { type: "enabled" },
      },
    });
  });

  it("does not pass reasoning for unsurfaced Gateway model ids", () => {
    const noneConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      reasoningLevel: "none",
    });
    const xhighConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      reasoningLevel: "xhigh",
    });

    expect(providerOptionsForRuntime(noneConfig, "openai/gpt-5.1-thinking")).toBeUndefined();
    expect(providerOptionsForRuntime(xhighConfig, "openai/gpt-5.1-codex-max")).toBeUndefined();
  });

  it("scales Gateway reasoning levels for providers with a smaller native set", () => {
    const minimalConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      reasoningLevel: "minimal",
    });
    const noneConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      reasoningLevel: "none",
    });

    expect(providerOptionsForRuntime(minimalConfig, "google/gemini-3.1-flash-lite")).toEqual({
      google: {
        thinkingConfig: {
          thinkingLevel: "medium",
          includeThoughts: false,
        },
      },
    });
    expect(providerOptionsForRuntime(noneConfig, "deepseek/deepseek-v4-flash")).toEqual({
      deepseek: {
        thinking: { type: "enabled" },
        reasoningEffort: "max",
      },
    });
    expect(providerOptionsForRuntime(noneConfig, "xai/grok-4.3")).toBeUndefined();
    expect(providerOptionsForRuntime(noneConfig, "alibaba/qwen3.5-flash")).toEqual({
      alibaba: {
        enableThinking: false,
      },
    });
    expect(providerOptionsForRuntime(noneConfig, "xiaomi/mimo-v2.5")).toEqual({
      xiaomi: {
        thinking: { type: "enabled" },
      },
    });
    expect(providerOptionsForRuntime(noneConfig, "xiaomi/mimo-v2.5-pro")).toEqual({
      xiaomi: {
        thinking: { type: "enabled" },
      },
    });
    expect(providerOptionsForRuntime(noneConfig, "zai/glm-4.7-flash")).toBeUndefined();
  });

  it("does not send Gateway provider options for Ollama", () => {
    const ollamaConfig = gameConfigSchema.parse({
      aiProvider: "ollama",
      reasoningLevel: "high",
    });

    expect(providerOptionsForRuntime(ollamaConfig, "google/gemini-3.1-flash-lite")).toBeUndefined();
  });

  it("appends DeepSeek roleplay thinking marker only to the first user message", () => {
    const gatewayConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      chatModel: "deepseek/deepseek-v4-flash",
    });
    const result = applyDeepSeekRoleplayThinkingMode({
      packet: {
        system: "perform Alex",
        prompt: "preview only",
        messages: [
          { role: "user", content: "Alex sits down." },
          { role: "assistant", content: "hey." },
          { role: "user", content: "How was your day?" },
        ],
      },
      config: gatewayConfig,
      modelId: "deepseek/deepseek-v4-flash",
      enabled: true,
    });

    expect(result.messages?.[0]?.content).toContain("【角色沉浸要求】");
    expect(result.messages?.[2]?.content).toBe("How was your day?");
  });

  it("does not append DeepSeek roleplay thinking marker to non-DeepSeek models", () => {
    const gatewayConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      chatModel: "google/gemini-3.1-flash-lite",
    });

    expect(
      applyDeepSeekRoleplayThinkingMode({
        packet: { system: "perform Alex", prompt: "hello" },
        config: gatewayConfig,
        modelId: "google/gemini-3.1-flash-lite",
        enabled: true,
      }).prompt,
    ).toBe("hello");
  });

  it("falls back to Gateway JSON text when native object output fails schema validation", async () => {
    aiMocks.generateText
      .mockResolvedValueOnce(outputGenerationResult({ dateHealthDelta: "not a number" }))
      .mockResolvedValueOnce(textGenerationResult(JSON.stringify(judgeOutput)));

    const result = await judgeDateExchange({
      packet: { system: "Score the exchange.", prompt: "Alex and Vhool talked." },
      dateSessionId: "date-1",
      exchangeIndex: 0,
      config: gatewayConfig,
    });

    expect(result.playerSummary).toBe("Cupid filed a steady exchange.");
    expect(aiMocks.generateText).toHaveBeenCalledTimes(2);
    expect(aiMocks.generateText).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ output: expect.anything() }),
    );

    const secondCallInput = aiMocks.generateText.mock.calls[1]?.[0];
    expect(isRecord(secondCallInput) && "output" in secondCallInput).toBe(false);
    expect(isRecord(secondCallInput) ? secondCallInput.system : "").toContain(
      "Return valid JSON only.",
    );
  });

  it("falls back to Gateway JSON text when native array output fails JSON parsing", async () => {
    aiMocks.generateText
      .mockRejectedValueOnce(
        new JSONParseError({
          text: "{",
          cause: new SyntaxError("Unexpected end of JSON input"),
        }),
      )
      .mockResolvedValueOnce(textGenerationResult(JSON.stringify([memoryCandidate])));

    const result = await summarizeDateMemories(
      { system: "Summarize memories.", prompt: "Alex and Vhool finished a date." },
      gatewayConfig,
    );

    expect(result).toEqual([memoryCandidate]);
    expect(aiMocks.generateText).toHaveBeenCalledTimes(2);
  });

  it("falls back to Gateway JSON text when native object output loses tool results", async () => {
    aiMocks.generateText
      .mockRejectedValueOnce(new MissingToolResultsError({ toolCallIds: ["structured-output"] }))
      .mockResolvedValueOnce(textGenerationResult(`Result:\n${JSON.stringify(judgeOutput)}`));

    const result = await judgeDateExchange({
      packet: { system: "Score the exchange.", prompt: "Alex and Vhool talked." },
      dateSessionId: "date-1",
      exchangeIndex: 0,
      config: gatewayConfig,
    });

    expect(result.notableMoments).toEqual(["Alex and Vhool kept the table steady."]);
    expect(aiMocks.generateText).toHaveBeenCalledTimes(2);
  });

  it("falls back to Gateway JSON text when a provider rejects native structured schema", async () => {
    aiMocks.generateText
      .mockRejectedValueOnce(
        new APICallError({
          message: "Provider rejected response_format json_schema.",
          url: "https://gateway.example/language-model",
          requestBodyValues: {},
          statusCode: 400,
          responseBody: "Unsupported response_format schema.",
          isRetryable: false,
        }),
      )
      .mockResolvedValueOnce(textGenerationResult(JSON.stringify(judgeOutput)));

    const result = await judgeDateExchange({
      packet: { system: "Score the exchange.", prompt: "Alex and Vhool talked." },
      dateSessionId: "date-1",
      exchangeIndex: 0,
      config: gatewayConfig,
    });

    expect(result.dateSessionId).toBe("date-1");
    expect(aiMocks.generateText).toHaveBeenCalledTimes(2);
  });
});
