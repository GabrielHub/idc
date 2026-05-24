import { describe, expect, it } from "vitest";

import { gameConfigSchema } from "../../domain/game";
import {
  applyDeepSeekRoleplayThinkingMode,
  defaultMaxOutputTokensForProvider,
  defaultRequestTimeoutMsForProvider,
  ollamaThinkForReasoningLevel,
  parseOllamaModelInventory,
  providerOptionsForRuntime,
} from "./model-service";

describe("AI model service", () => {
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
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "deepseek/deepseek-v4-pro")).toEqual({
      deepseek: {
        thinking: { type: "enabled" },
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "anthropic/claude-sonnet-4.6")).toBeUndefined();
    expect(providerOptionsForRuntime(gatewayConfig, "anthropic/claude-haiku-4.5")).toBeUndefined();
    expect(providerOptionsForRuntime(gatewayConfig, "xai/grok-4.3")).toBeUndefined();
    expect(providerOptionsForRuntime(gatewayConfig, "openai/gpt-5.4-nano")).toEqual({
      openai: {
        reasoningEffort: "none",
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
      },
    });
    expect(providerOptionsForRuntime(noneConfig, "xai/grok-4.3")).toBeUndefined();
    expect(providerOptionsForRuntime(noneConfig, "alibaba/qwen3.5-flash")).toEqual({
      alibaba: {
        enableThinking: false,
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
});
