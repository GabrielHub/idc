import { describe, expect, it } from "vitest";

import { DEFAULT_GATEWAY_BASE_URL, gameConfigSchema } from "../../domain/game";
import {
  GPU_RECOMMENDATION_PROFILES,
  GATEWAY_CHAT_MODELS,
  GATEWAY_REASONING_LEVEL_OPTIONS,
  OLLAMA_REASONING_LEVEL_OPTIONS,
  gatewayImageInputSupported,
  gatewayReasoningLevelForModel,
  isGatewayChatModel,
  isRecommendedOllamaChatModel,
  isRecommendedOllamaEmbeddingModel,
  modelDefaultsForProvider,
  normalizeOllamaModelName,
  ollamaImageInputSupported,
  recommendedOllamaChatModels,
} from "./model-catalog";

describe("AI model catalog", () => {
  it("defaults to Ollama and strips browser Gateway keys from save config", () => {
    const config = gameConfigSchema.parse({
      gatewayApiKey: "browser-key",
    });

    expect(config.aiProvider).toBe("ollama");
    expect(config.chatModel).toBe("gemma4:e4b");
    expect(config.embeddingModel).toBe("embeddinggemma");
    expect(config.reasoningLevel).toBe("off");
    expect("gatewayApiKey" in config).toBe(false);
  });

  it("sets Gateway defaults when Gateway is selected without explicit models", () => {
    const config = gameConfigSchema.parse({
      aiProvider: "gateway",
    });

    expect(config.chatModel).toBe("deepseek/deepseek-v4-flash");
    expect(config.embeddingModel).toBe("google/gemini-embedding-2");
    expect(config.reasoningLevel).toBe("high");
    expect(config.gatewayBaseURL).toBe(DEFAULT_GATEWAY_BASE_URL);
  });

  it("normalizes saved Gateway reasoning to the selected model lock", () => {
    expect(
      gameConfigSchema.parse({
        aiProvider: "gateway",
        chatModel: "deepseek/deepseek-v4-flash",
        reasoningLevel: "medium",
      }).reasoningLevel,
    ).toBe("high");
    expect(
      gameConfigSchema.parse({
        aiProvider: "gateway",
        chatModel: "deepseek/deepseek-v4-pro",
        reasoningLevel: "high",
      }).reasoningLevel,
    ).toBe("xhigh");
    expect(
      gameConfigSchema.parse({
        aiProvider: "gateway",
        chatModel: "google/gemini-3.1-flash-lite",
        reasoningLevel: "high",
      }).reasoningLevel,
    ).toBe("medium");
    expect(
      gameConfigSchema.parse({
        aiProvider: "gateway",
        chatModel: "anthropic/claude-haiku-4.5",
        reasoningLevel: "high",
      }).reasoningLevel,
    ).toBe("off");
    expect(
      gameConfigSchema.parse({
        aiProvider: "gateway",
        chatModel: "openai/gpt-5.4-nano",
        reasoningLevel: "xhigh",
      }).reasoningLevel,
    ).toBe("none");
  });

  it("accepts the expanded reasoning level set", () => {
    expect(gameConfigSchema.parse({ reasoningLevel: "none" }).reasoningLevel).toBe("none");
    expect(gameConfigSchema.parse({ reasoningLevel: "minimal" }).reasoningLevel).toBe("minimal");
    expect(gameConfigSchema.parse({ reasoningLevel: "xhigh" }).reasoningLevel).toBe("xhigh");
  });

  it("migrates the old OpenAI-compatible Gateway base URL", () => {
    const config = gameConfigSchema.parse({
      aiProvider: "gateway",
      gatewayBaseURL: "https://ai-gateway.vercel.sh/v1",
    });

    expect(config.gatewayBaseURL).toBe(DEFAULT_GATEWAY_BASE_URL);
  });

  it("migrates retired Gateway Gemini chat model ids to Flash Lite", () => {
    expect(
      gameConfigSchema.parse({
        aiProvider: "gateway",
        chatModel: "google/gemini-3-flash",
      }).chatModel,
    ).toBe("google/gemini-3.1-flash-lite");
    expect(
      gameConfigSchema.parse({
        aiProvider: "gateway",
        chatModel: "google/gemini-3.1-flash-lite-preview",
      }).chatModel,
    ).toBe("google/gemini-3.1-flash-lite");
  });

  it("migrates retired expensive Gateway chat model ids to the default", () => {
    expect(
      gameConfigSchema.parse({
        aiProvider: "gateway",
        chatModel: "moonshotai/kimi-k2.5",
      }).chatModel,
    ).toBe("deepseek/deepseek-v4-flash");
    expect(
      gameConfigSchema.parse({
        aiProvider: "gateway",
        chatModel: "xai/grok-4.3",
      }).chatModel,
    ).toBe("deepseek/deepseek-v4-flash");
  });

  it("surfaces the curated Gateway choices from the Vercel catalog", () => {
    expect(GATEWAY_CHAT_MODELS.map((model) => model.id)).toEqual([
      "deepseek/deepseek-v4-flash",
      "deepseek/deepseek-v4-pro",
      "google/gemini-3.1-flash-lite",
      "anthropic/claude-haiku-4.5",
      "minimax/minimax-m2.7",
      "alibaba/qwen3.5-flash",
      "zai/glm-4.7-flash",
      "openai/gpt-5.4-nano",
    ]);
    expect(GATEWAY_CHAT_MODELS.some((model) => model.id === "google/gemini-3-flash")).toBe(false);
    expect(GATEWAY_CHAT_MODELS.some((model) => model.id === "moonshotai/kimi-k2.5")).toBe(false);
    expect(GATEWAY_CHAT_MODELS.some((model) => model.id === "xai/grok-4.3")).toBe(false);
    expect(GATEWAY_CHAT_MODELS.every((model) => model.brand !== undefined)).toBe(true);
  });

  it("keeps Gateway choices narrow and disables reasoning where no Gateway knob is exposed", () => {
    expect(isGatewayChatModel(modelDefaultsForProvider("gateway").chatModel)).toBe(true);
    expect(modelDefaultsForProvider("gateway").reasoningLevel).toBe("high");
    expect(gatewayReasoningLevelForModel("deepseek/deepseek-v4-flash", "off")).toBe("high");
    expect(gatewayReasoningLevelForModel("deepseek/deepseek-v4-flash", "none")).toBe("high");
    expect(gatewayReasoningLevelForModel("deepseek/deepseek-v4-flash", "minimal")).toBe("high");
    expect(gatewayReasoningLevelForModel("deepseek/deepseek-v4-flash", "high")).toBe("high");
    expect(gatewayReasoningLevelForModel("deepseek/deepseek-v4-flash", "xhigh")).toBe("high");
    expect(gatewayReasoningLevelForModel("deepseek/deepseek-v4-pro", "high")).toBe("xhigh");
    expect(gatewayReasoningLevelForModel("anthropic/claude-haiku-4.5", "high")).toBe("off");
    expect(gatewayReasoningLevelForModel("minimax/minimax-m2.7", "high")).toBe("off");
    expect(gatewayReasoningLevelForModel("alibaba/qwen3.5-flash", "high")).toBe("off");
    expect(gatewayReasoningLevelForModel("zai/glm-4.7-flash", "high")).toBe("off");
    expect(gatewayReasoningLevelForModel("openai/gpt-5.4-nano", "high")).toBe("none");
  });

  it("marks Gateway models that accept image input", () => {
    expect(gatewayImageInputSupported("deepseek/deepseek-v4-flash")).toBe(false);
    expect(gatewayImageInputSupported("deepseek/deepseek-v4-pro")).toBe(false);
    expect(gatewayImageInputSupported("google/gemini-3-flash")).toBe(false);
    expect(gatewayImageInputSupported("google/gemini-3.1-flash-lite")).toBe(true);
    expect(gatewayImageInputSupported("anthropic/claude-haiku-4.5")).toBe(true);
    expect(gatewayImageInputSupported("minimax/minimax-m2.7")).toBe(false);
    expect(gatewayImageInputSupported("alibaba/qwen3.5-flash")).toBe(true);
    expect(gatewayImageInputSupported("zai/glm-4.7-flash")).toBe(false);
    expect(gatewayImageInputSupported("openai/gpt-5.4-nano")).toBe(true);
  });

  it("attaches cost metadata to Gateway selector models", () => {
    for (const model of GATEWAY_CHAT_MODELS) {
      expect(model.cost).not.toBeNull();
      expect(model.cost?.inputUsdPerMillionTokens).toBeGreaterThan(0);
      expect(model.cost?.outputUsdPerMillionTokens).toBeGreaterThan(0);
    }
  });

  it("marks supported Ollama image input models", () => {
    expect(ollamaImageInputSupported("gemma4:e4b")).toBe(true);
    expect(ollamaImageInputSupported("gemma4:e4b:latest")).toBe(true);
    expect(ollamaImageInputSupported("qwen3.5:9b")).toBe(false);
  });

  it("exposes provider-specific reasoning option lists", () => {
    expect(OLLAMA_REASONING_LEVEL_OPTIONS.map((option) => option.value)).toEqual([
      "off",
      "low",
      "medium",
      "high",
    ]);
    expect(GATEWAY_REASONING_LEVEL_OPTIONS.map((option) => option.value)).toEqual([
      "off",
      "none",
      "minimal",
      "low",
      "medium",
      "high",
      "xhigh",
    ]);
  });

  it("filters Ollama recommendations to Gemma only", () => {
    const filtered = recommendedOllamaChatModels([
      { name: "llama3.3:70b" },
      { name: "embeddinggemma" },
      { name: "gemma4:e4b" },
      { name: "qwen3.5:9b" },
    ]);

    expect(filtered.map((model) => model.name)).toEqual(["gemma4:e4b"]);
    expect(isRecommendedOllamaChatModel("llama3.3:70b")).toBe(false);
    expect(isRecommendedOllamaChatModel("qwen3.5:9b")).toBe(false);
  });

  it("treats Ollama latest tags as the base model for recommendations", () => {
    expect(normalizeOllamaModelName("embeddinggemma:latest")).toBe("embeddinggemma");
    expect(isRecommendedOllamaEmbeddingModel("embeddinggemma:latest")).toBe(true);
  });

  it("keeps GPU tier recommendations explicit", () => {
    expect(GPU_RECOMMENDATION_PROFILES.map((profile) => profile.id)).toEqual([
      "vram-8gb",
      "vram-12gb",
      "vram-16gb",
      "vram-24gb",
      "vram-32gb",
      "apple-silicon",
    ]);
    expect(
      GPU_RECOMMENDATION_PROFILES.find((profile) => profile.id === "vram-8gb")?.modelIds,
    ).toEqual(["gemma4:e2b"]);
    expect(
      GPU_RECOMMENDATION_PROFILES.find((profile) => profile.id === "vram-12gb")?.modelIds,
    ).toEqual(["gemma4:e2b", "gemma4:e4b"]);
    expect(
      GPU_RECOMMENDATION_PROFILES.find((profile) => profile.id === "vram-16gb")?.modelIds,
    ).toEqual(["gemma4:e4b"]);
    expect(
      GPU_RECOMMENDATION_PROFILES.find((profile) => profile.id === "vram-24gb")?.modelIds,
    ).toEqual(["gemma4:26b"]);
    expect(
      GPU_RECOMMENDATION_PROFILES.find((profile) => profile.id === "vram-32gb")?.modelIds,
    ).toEqual(["gemma4:26b"]);
    expect(
      GPU_RECOMMENDATION_PROFILES.find((profile) => profile.id === "apple-silicon")?.modelIds,
    ).toEqual(["gemma4:e2b", "gemma4:e4b", "gemma4:26b"]);
    const allExamples = GPU_RECOMMENDATION_PROFILES.map((profile) => profile.examples).join(" ");
    expect(allExamples).toContain("5070");
    expect(allExamples).toContain("5090");
    expect(allExamples).toContain("RX 9070");
    expect(allExamples).toContain("RX 7900 XTX");
    expect(allExamples).toContain("M4");
  });
});
