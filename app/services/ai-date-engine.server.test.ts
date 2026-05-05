import { describe, expect, it } from "vitest";

import { judgeSnapshotSchema, memoryCandidateSchema } from "../domain/game";
import { LocalGameRepository, MemoryStorageDriver } from "../repositories/local-game-repository";
import { completeDateSessionWithLocalAi, type LocalAiDateRuntime } from "./ai-date-engine.server";
import { startDateSession } from "./date-engine";
import { createSeedGameSave } from "./game-seed";
import { createDeterministicEmbedding } from "./vector-memory";

describe("local AI date engine orchestration", () => {
  it("runs character, judge, summarizer, embedding, and scoped memory tool callbacks", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "ai-engine-test");
    let save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 2,
      },
    };
    const started = startDateSession(save, {
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet, memoryTool }) => {
        const memories = await memoryTool({
          query: "baseline date context",
          scope: ["self", "pair", "scenario"],
          limit: 2,
        });

        return {
          text: packet.prompt.includes("Jenna")
            ? `ai Jenna asks a grounded question after ${memories.length} memories.`
            : `ai Vhool answers without recruiting anyone after ${memories.length} memories.`,
          providerMode: "ollama",
          model: "fake-performer",
          stepCount: 2,
          toolCallCount: 1,
          toolResultCount: 1,
        };
      },
      judgeDateExchange: async ({ dateSessionId, exchangeIndex }) =>
        judgeSnapshotSchema.parse({
          id: `judge-${dateSessionId}-${exchangeIndex}`,
          dateSessionId,
          exchangeIndex,
          dateHealthDelta: 5,
          statDeltas: {
            chemistry: 3,
            trust: 2,
            relationshipHealth: 2,
          },
          memberMoodDeltas: {
            "jenna-pike": 1,
            vhool: 1,
            "opal-sunday": -100,
          },
          shouldEndEarly: false,
          notableMoments: ["Jenna asked a practical question."],
          playerSummary: "Local AI judge filed a useful report.",
          memoryCandidates: [],
        }),
      summarizeDateMemories: async () => [
        memoryCandidateSchema.parse({
          scope: "pair",
          visibility: "member_private",
          subjectIds: ["jenna-pike"],
          visibleToMemberIds: ["opal-sunday"],
          pairId: "opal-sunday__vhool",
          scenarioId: "prophecy-karaoke",
          text: "Jenna and Vhool completed a local AI orchestrated coffee date.",
          tags: ["date_summary"],
          importance: 4,
        }),
      ],
      embedMemoryText: async ({ text }) => {
        const embedding = createDeterministicEmbedding(text);

        return {
          embedding,
          model: "fake-embedding",
          dimensions: embedding.length,
        };
      },
    };
    await repository.saveGame(started.save);

    const result = await completeDateSessionWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(result.session.status).toBe("completed");
    expect(result.session.currentTurn).toBe(2);
    expect(result.session.transcript.some((message) => message.text.startsWith("ai Jenna"))).toBe(
      true,
    );
    expect(result.aiTelemetry.characterToolCallCount).toBe(2);
    const aiMemory = result.save.memories.find(
      (memory) => memory.id === `memory-${started.session.id}-ai-1`,
    );
    const opal = result.save.members.find((member) => member.id === "opal-sunday");

    expect(opal?.state.mood).toBe(
      started.save.members.find((member) => member.id === "opal-sunday")?.state.mood,
    );
    expect(aiMemory?.embeddingModel).toBe("fake-embedding");
    expect(aiMemory?.pairId).toBe(started.session.pairId);
    expect(aiMemory?.scenarioId).toBe(started.session.scenarioId);
    expect(aiMemory?.visibleToMemberIds).toEqual(["jenna-pike"]);
    expect(result.session.finalReport?.memoryRecordIds).toContain(aiMemory?.id);
  });

  it("falls back without corrupting state when local AI callbacks fail", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "ai-fallback-test");
    let save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 2,
      },
    };
    const started = startDateSession(save, {
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async () => {
        throw new Error("performer unavailable");
      },
      judgeDateExchange: async () => {
        throw new Error("judge unavailable");
      },
      summarizeDateMemories: async () => {
        throw new Error("summarizer unavailable");
      },
      embedMemoryText: async () => {
        throw new Error("embedding unavailable");
      },
    };
    await repository.saveGame(started.save);

    const result = await completeDateSessionWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(result.session.status).toBe("completed");
    expect(result.aiTelemetry.deterministicFallbackCount).toBe(2);
    expect(result.warningMessages.some((message) => message.includes("performer fallback"))).toBe(
      true,
    );
    expect(result.warningMessages.some((message) => message.includes("judge fallback"))).toBe(true);
    expect(result.warningMessages.some((message) => message.includes("memory fallback"))).toBe(
      true,
    );
    expect(
      result.save.memories.some((memory) => memory.embeddingModel === "deterministic-local"),
    ).toBe(true);
  });
});
