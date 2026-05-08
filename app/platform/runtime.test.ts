import { describe, expect, it } from "vitest";

import {
  DEFAULT_GATEWAY_BASE_URL,
  DEFAULT_OLLAMA_BASE_URL,
  gameConfigSchema,
} from "../domain/game";
import { lockAiProviderBaseUrlsForDesktop, normalizeDesktopOllamaBaseUrl } from "./runtime";

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
});
