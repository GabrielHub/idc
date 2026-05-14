import { describe, expect, it } from "vitest";

import {
  DEFAULT_GATEWAY_CHAT_MODEL,
  DEFAULT_GATEWAY_BASE_URL,
  DEFAULT_GATEWAY_EMBEDDING_MODEL,
  DEFAULT_OLLAMA_CHAT_MODEL,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  gameConfigSchema,
} from "../domain/game";
import {
  createDefaultGameConfigForPlatform,
  lockAiProviderBaseUrlsForDesktop,
  normalizeDesktopOllamaBaseUrl,
} from "./runtime";

describe("desktop runtime URL policy", () => {
  it("keeps scoped Ollama hosts and normalizes trailing slashes", () => {
    expect(normalizeDesktopOllamaBaseUrl("http://localhost:11434/")).toBe("http://localhost:11434");
    expect(normalizeDesktopOllamaBaseUrl(`${DEFAULT_OLLAMA_BASE_URL}/`)).toBe(
      DEFAULT_OLLAMA_BASE_URL,
    );
  });

  it("falls back to scoped endpoints for custom desktop hosts", () => {
    const config = gameConfigSchema.parse({
      aiProvider: "gateway",
      ollamaBaseURL: "http://192.168.0.20:11434",
      gatewayBaseURL: "https://example.invalid/v1",
    });

    expect(lockAiProviderBaseUrlsForDesktop(config)).toMatchObject({
      ollamaBaseURL: DEFAULT_OLLAMA_BASE_URL,
      gatewayBaseURL: DEFAULT_GATEWAY_BASE_URL,
    });
  });

  it("uses platform-specific default providers", () => {
    expect(createDefaultGameConfigForPlatform("browser")).toMatchObject({
      aiProvider: "ollama",
      chatModel: DEFAULT_OLLAMA_CHAT_MODEL,
      embeddingModel: DEFAULT_OLLAMA_EMBEDDING_MODEL,
      reasoningLevel: "off",
    });
    expect(createDefaultGameConfigForPlatform("tauri")).toMatchObject({
      aiProvider: "gateway",
      chatModel: DEFAULT_GATEWAY_CHAT_MODEL,
      embeddingModel: DEFAULT_GATEWAY_EMBEDDING_MODEL,
      gatewayBaseURL: DEFAULT_GATEWAY_BASE_URL,
      reasoningLevel: "medium",
    });
  });
});
