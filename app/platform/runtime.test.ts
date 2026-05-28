import { afterEach, describe, expect, it, vi } from "vitest";

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
  BROWSER_DEV_GATEWAY_PROXY_BASE_URL,
  createDefaultGameConfigForPlatform,
  lockAiProviderBaseUrlsForDesktop,
  normalizeGatewayBaseUrlForRuntime,
  normalizeDesktopOllamaBaseUrl,
  resetCachedRuntimePlatformForTesting,
} from "./runtime";

describe("desktop runtime URL policy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetCachedRuntimePlatformForTesting();
  });

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
      reasoningLevel: "xhigh",
    });
  });

  it("routes only the default Gateway through the browser dev proxy", () => {
    vi.stubGlobal("window", {});

    expect(normalizeGatewayBaseUrlForRuntime(DEFAULT_GATEWAY_BASE_URL)).toBe(
      BROWSER_DEV_GATEWAY_PROXY_BASE_URL,
    );
    expect(normalizeGatewayBaseUrlForRuntime("https://gateway.example/v3/ai/")).toBe(
      "https://gateway.example/v3/ai",
    );
  });
});
