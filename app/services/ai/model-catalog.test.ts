import { describe, expect, it } from "vitest";

import { DEFAULT_GATEWAY_BASE_URL, gameConfigSchema } from "../../domain/game";
import {
  GPU_RECOMMENDATION_PROFILES,
  gatewayReasoningLevelForModel,
  isGatewayChatModel,
  isRecommendedOllamaChatModel,
  isRecommendedOllamaEmbeddingModel,
  modelDefaultsForProvider,
  normalizeOllamaModelName,
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
    expect(config.reasoningLevel).toBe("medium");
    expect(config.gatewayBaseURL).toBe(DEFAULT_GATEWAY_BASE_URL);
  });

  it("migrates the old OpenAI-compatible Gateway base URL", () => {
    const config = gameConfigSchema.parse({
      aiProvider: "gateway",
      gatewayBaseURL: "https://ai-gateway.vercel.sh/v1",
    });

    expect(config.gatewayBaseURL).toBe(DEFAULT_GATEWAY_BASE_URL);
  });

  it("keeps Gateway choices narrow and disables reasoning for Kimi and Claude Haiku", () => {
    expect(isGatewayChatModel(modelDefaultsForProvider("gateway").chatModel)).toBe(true);
    expect(gatewayReasoningLevelForModel("deepseek/deepseek-v4-flash", "off")).toBe("off");
    expect(gatewayReasoningLevelForModel("deepseek/deepseek-v4-flash", "high")).toBe("high");
    expect(gatewayReasoningLevelForModel("anthropic/claude-haiku-4.5", "high")).toBe("off");
    expect(gatewayReasoningLevelForModel("moonshotai/kimi-k2.5", "medium")).toBe("off");
  });

  it("filters Ollama recommendations to Gemma and Qwen only", () => {
    const filtered = recommendedOllamaChatModels([
      { name: "llama3.3:70b" },
      { name: "embeddinggemma" },
      { name: "gemma4:e4b" },
      { name: "qwen3.5:9b" },
    ]);

    expect(filtered.map((model) => model.name)).toEqual(["gemma4:e4b", "qwen3.5:9b"]);
    expect(isRecommendedOllamaChatModel("llama3.3:70b")).toBe(false);
  });

  it("treats Ollama latest tags as the base model for recommendations", () => {
    expect(normalizeOllamaModelName("embeddinggemma:latest")).toBe("embeddinggemma");
    expect(isRecommendedOllamaEmbeddingModel("embeddinggemma:latest")).toBe(true);
  });

  it("keeps GPU tier recommendations explicit", () => {
    expect(
      GPU_RECOMMENDATION_PROFILES.find((profile) => profile.id === "rtx-3080-10gb")?.modelIds,
    ).toEqual(["gemma4:e2b", "gemma4:e4b"]);
    expect(
      GPU_RECOMMENDATION_PROFILES.find((profile) => profile.id === "balanced-12gb")?.modelIds,
    ).toEqual(["qwen3.5:9b", "gemma4:e4b"]);
    expect(
      GPU_RECOMMENDATION_PROFILES.find((profile) => profile.id === "large-24gb")?.modelIds,
    ).toEqual(["gemma4:26b", "qwen3.5:27b"]);
  });
});
