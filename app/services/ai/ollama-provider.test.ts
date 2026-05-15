import { describe, expect, it } from "vitest";

describe("LLM provider test guard", () => {
  it("blocks direct Ollama API fetches during Vitest", async () => {
    await expect(fetch("http://127.0.0.1:11434/api/tags")).rejects.toThrow(
      "Tests must not reach real LLM endpoints.",
    );
  });

  it("blocks direct Vercel Gateway fetches during Vitest", async () => {
    await expect(fetch("https://ai-gateway.vercel.sh/v3/ai/language-model")).rejects.toThrow(
      "Tests must not reach real LLM endpoints.",
    );
  });
});
