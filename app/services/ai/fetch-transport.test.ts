import { describe, expect, it } from "vitest";

import { isDesktopOllamaFetchUrl } from "./fetch-transport";

describe("AI fetch transport", () => {
  it("identifies local Ollama API URLs inside the desktop HTTP scope", () => {
    expect(isDesktopOllamaFetchUrl("http://127.0.0.1:11434/api/tags")).toBe(true);
    expect(isDesktopOllamaFetchUrl("http://localhost:11434/api/embeddings")).toBe(true);
    expect(isDesktopOllamaFetchUrl("http://127.0.0.1:11434/not-api/tags")).toBe(false);
    expect(isDesktopOllamaFetchUrl("https://ai-gateway.vercel.sh/v1/chat/completions")).toBe(false);
    expect(isDesktopOllamaFetchUrl("http://192.168.0.20:11434/api/tags")).toBe(false);
  });
});
