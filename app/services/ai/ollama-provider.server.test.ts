import { describe, expect, it } from "vitest";

const runOllamaSmoke = process.env.IDC_RUN_OLLAMA_SMOKE === "1" ? it : it.skip;

describe("local Ollama AI adapter", () => {
  runOllamaSmoke(
    "generates a short local character response",
    async () => {
      const { generateCharacterTurn } = await import("./ollama-provider.server");
      const result = await generateCharacterTurn(
        {
          system: "You are a terse local smoke test for Interdimensional Dating Coach.",
          prompt: "Reply with exactly: IDC local model ready",
        },
        {
          performerModel: process.env.IDC_PERFORMER_MODEL ?? "gemma4:26b",
          requestTimeoutMs: 90_000,
        },
      );

      expect(result.text.length).toBeGreaterThan(0);
      expect(result.model).toBe(process.env.IDC_PERFORMER_MODEL ?? "gemma4:26b");
    },
    120_000,
  );

  runOllamaSmoke(
    "embeds memory text with the configured local model",
    async () => {
      const { embedMemoryText } = await import("./ollama-provider.server");
      const result = await embedMemoryText("Cupid remembers a soup-related date.");

      expect(result.embedding.length).toBeGreaterThan(0);
      expect(result.model).toBe("embeddinggemma");
      expect(result.dimensions).toBe(result.embedding.length);
    },
    120_000,
  );
});
