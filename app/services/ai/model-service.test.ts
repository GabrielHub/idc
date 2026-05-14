import { describe, expect, it } from "vitest";

import { gameConfigSchema } from "../../domain/game";
import {
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
          { name: "qwen3.5:9b", size: 9 },
          { name: "llama3.3:70b", size: 70 },
          { name: "embeddinggemma:latest" },
        ],
      },
      {
        models: [{ name: "gemma4:e4b" }],
      },
    );

    expect(inventory.models.find((model) => model.name === "gemma4:e4b")?.running).toBe(true);
    expect(inventory.chatModels.map((model) => model.name)).toEqual(["gemma4:e4b", "qwen3.5:9b"]);
    expect(inventory.embeddingModels.map((model) => model.name)).toEqual(["embeddinggemma:latest"]);
    expect(inventory.runningModels.map((model) => model.name)).toEqual(["gemma4:e4b"]);
  });

  it("uses running models when tags fail", () => {
    const inventory = parseOllamaModelInventory(null, {
      models: [{ name: "qwen3.5:9b" }, { name: "llama3.3:70b" }],
    });

    expect(inventory.models.map((model) => model.name)).toEqual(["llama3.3:70b", "qwen3.5:9b"]);
    expect(inventory.chatModels.map((model) => model.name)).toEqual(["qwen3.5:9b"]);
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

    expect(providerOptionsForRuntime(gatewayConfig, "google/gemini-3-flash")).toEqual({
      google: {
        thinkingConfig: {
          thinkingLevel: "high",
          includeThoughts: false,
        },
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "deepseek/deepseek-v4-flash")).toEqual({
      deepseek: {
        thinking: { type: "enabled" },
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "anthropic/claude-sonnet-4.6")).toEqual({
      anthropic: {
        thinking: {
          type: "enabled",
          budgetTokens: 12_000,
        },
        effort: "high",
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "anthropic/claude-haiku-4.5")).toBeUndefined();
  });

  it("passes the full OpenAI Gateway reasoning effort set", () => {
    const noneConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      reasoningLevel: "none",
    });
    const xhighConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      reasoningLevel: "xhigh",
    });

    expect(providerOptionsForRuntime(noneConfig, "openai/gpt-5.1-thinking")).toEqual({
      openai: {
        reasoningEffort: "none",
      },
    });
    expect(providerOptionsForRuntime(xhighConfig, "openai/gpt-5.1-codex-max")).toEqual({
      openai: {
        reasoningEffort: "xhigh",
      },
    });
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

    expect(providerOptionsForRuntime(minimalConfig, "google/gemini-3-flash")).toEqual({
      google: {
        thinkingConfig: {
          thinkingLevel: "low",
          includeThoughts: false,
        },
      },
    });
    expect(providerOptionsForRuntime(noneConfig, "deepseek/deepseek-v4-flash")).toBeUndefined();
  });

  it("does not send Gateway provider options for Ollama", () => {
    const ollamaConfig = gameConfigSchema.parse({
      aiProvider: "ollama",
      reasoningLevel: "high",
    });

    expect(providerOptionsForRuntime(ollamaConfig, "google/gemini-3-flash")).toBeUndefined();
  });
});
