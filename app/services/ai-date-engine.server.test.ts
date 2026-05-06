import { describe, expect, it } from "vitest";

import { judgeSnapshotSchema, memoryCandidateSchema, memoryRecordSchema } from "../domain/game";
import { LocalGameRepository, MemoryStorageDriver } from "../repositories/local-game-repository";
import {
  advanceDateExchangeWithLocalAiStream,
  completeDateSessionWithLocalAi,
  type LocalAiDateRuntime,
  type LocalAiDateStreamEvent,
} from "./ai-date-engine.server";
import { startDateSession } from "./date-engine";
import { createSeedGameSave, makePairId } from "./game-seed";
import { withFeaturedMembers } from "./test-helpers";
import { createDeterministicEmbedding } from "./vector-memory";

describe("local AI date engine orchestration", () => {
  it("runs character, judge, summarizer, embedding, and deterministic memory retrieval", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "ai-engine-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const pairId = makePairId("jenna-pike", "vhool");
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 2,
      },
      memories: [
        ...save.memories,
        memoryRecordSchema.parse({
          id: "memory-ai-test-soup",
          scope: "pair",
          visibility: "member_private",
          subjectIds: ["jenna-pike", "vhool"],
          visibleToMemberIds: ["jenna-pike", "vhool"],
          pairId,
          scenarioId: "temporal-coffee-shop",
          text: "Jenna remembers that Vhool treated soup as a sincere planning document.",
          tags: ["soup", "date_memory"],
          importance: 4,
          createdAt: "2026-05-05T12:00:00.000Z",
          embedding: createDeterministicEmbedding("Jenna Vhool Temporal Coffee Shop soup"),
          embeddingModel: "deterministic-local",
          embeddingDimensions: 64,
        }),
      ],
    };
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => {
        const sawPromptContract =
          packet.prompt.includes("Output contract:") &&
          packet.prompt.includes("Back and forth so far:");
        const sawMemory = packet.prompt.includes("sincere planning document");

        return {
          text: packet.prompt.includes("Jenna")
            ? `ai Jenna asks a grounded question after contract ${sawPromptContract} and memory ${sawMemory}.`
            : `ai Vhool answers without recruiting anyone after contract ${sawPromptContract} and memory ${sawMemory}.`,
          providerMode: "ollama",
          model: "fake-performer",
          stepCount: 1,
          toolCallCount: 0,
          toolResultCount: 0,
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
    expect(result.aiTelemetry.characterToolCallCount).toBe(0);
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

  it("blocks the date update when required local AI callbacks fail", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "ai-block-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 2,
      },
    };
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
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
      embedMemoryText: async ({ text }) => {
        const embedding = createDeterministicEmbedding(text);

        return {
          embedding,
          model: "fake-embedding",
          dimensions: embedding.length,
        };
      },
    };
    await expect(
      completeDateSessionWithLocalAi(started.save, repository, {
        dateSessionId: started.session.id,
        runtime,
        config: started.save.config,
        now: new Date("2026-05-05T12:02:00.000Z"),
      }),
    ).rejects.toThrow("Local AI performer failed for Jenna Pike: performer unavailable");

    const loadedSave = await repository.loadGame();
    const loadedSession = loadedSave?.dateSessions.find(
      (session) => session.id === started.session.id,
    );

    expect(loadedSession?.status).toBe("active");
    expect(loadedSession?.currentTurn).toBe(0);
    expect(loadedSession?.transcript).toHaveLength(started.session.transcript.length);
    expect(loadedSave?.memories).toHaveLength(started.save.memories.length);
  });

  it("streams performer deltas before committing the validated exchange", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "ai-stream-test");
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async () => {
        throw new Error("non-streaming performer should not run");
      },
      streamCharacterTurn: async ({ packet, onTextDelta }) => {
        const text = packet.prompt.includes("as Jenna Pike")
          ? "Jenna watches the coffee unspill and asks if that is normal."
          : "Vhool says\u2014normal is a department opinion, not a fact.";

        for (const chunk of text.split(" ")) {
          await onTextDelta(`${chunk} `);
        }

        return {
          text,
          providerMode: "ollama",
          model: "fake-stream-performer",
          stepCount: 1,
          toolCallCount: 0,
          toolResultCount: 0,
        };
      },
      judgeDateExchange: async ({ dateSessionId, exchangeIndex }) =>
        judgeSnapshotSchema.parse({
          id: `judge-${dateSessionId}-${exchangeIndex}`,
          dateSessionId,
          exchangeIndex,
          dateHealthDelta: 3,
          statDeltas: {
            chemistry: 2,
          },
          memberMoodDeltas: {
            "jenna-pike": 1,
            vhool: 1,
          },
          shouldEndEarly: false,
          notableMoments: ["Coffee behaved like a labor dispute."],
          playerSummary: "The streamed exchange landed cleanly.",
          memoryCandidates: [],
        }),
      summarizeDateMemories: async () => [],
      embedMemoryText: async ({ text }) => {
        const embedding = createDeterministicEmbedding(text);

        return {
          embedding,
          model: "fake-embedding",
          dimensions: embedding.length,
        };
      },
    };
    const events: LocalAiDateStreamEvent[] = [];
    await repository.saveGame(started.save);

    const result = await advanceDateExchangeWithLocalAiStream(
      started.save,
      repository,
      {
        dateSessionId: started.session.id,
        runtime,
        config: started.save.config,
        now: new Date("2026-05-05T12:02:00.000Z"),
      },
      (event) => {
        events.push(event);
      },
    );

    expect(
      result.session.transcript.filter((message) => message.kind === "character"),
    ).toHaveLength(2);
    expect(events.map((event) => event.type)).toContain("characterDelta");
    expect(events.at(-1)?.type).toBe("judgeStart");
    expect(
      events
        .filter((event) => event.type === "characterDelta")
        .map((event) => event.textDelta)
        .join(""),
    ).not.toMatch(/[\u2014\u2013]/);
    expect(
      events.some(
        (event) => event.type === "characterDone" && event.text.includes("department opinion"),
      ),
    ).toBe(true);
    expect(
      result.session.transcript
        .filter((message) => message.kind === "character")
        .map((message) => message.text)
        .join(" "),
    ).toContain("Vhool says, normal");
    const loadedSave = await repository.loadGame();
    const loadedSession = loadedSave?.dateSessions.find(
      (session) => session.id === started.session.id,
    );

    expect(
      loadedSession?.transcript.filter((message) => message.kind === "character"),
    ).toHaveLength(2);
    expect(loadedSession?.judgeSnapshots).toHaveLength(1);
  });
});
