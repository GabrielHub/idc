import { describe, expect, it } from "vitest";

import { gameConfigSchema } from "../../domain/game";
import {
  defaultMaxOutputTokensForProvider,
  defaultRequestTimeoutMsForProvider,
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

  it("uses native Gateway provider options for provider reasoning", () => {
    const gatewayConfig = gameConfigSchema.parse({
      aiProvider: "gateway",
      reasoningLevel: "high",
    });

    expect(providerOptionsForRuntime(gatewayConfig, "google/gemini-3-flash")).toEqual({
      google: {
        thinkingConfig: {
          thinkingLevel: "high",
          includeThoughts: true,
        },
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "deepseek/deepseek-v4-flash")).toEqual({
      deepseek: {
        thinking: { type: "enabled" },
      },
    });
    expect(providerOptionsForRuntime(gatewayConfig, "anthropic/claude-haiku-4.5")).toBeUndefined();
  });

  it("does not send Gateway provider options for Ollama", () => {
    const ollamaConfig = gameConfigSchema.parse({
      aiProvider: "ollama",
      reasoningLevel: "high",
    });

    expect(providerOptionsForRuntime(ollamaConfig, "google/gemini-3-flash")).toBeUndefined();
  });
});
