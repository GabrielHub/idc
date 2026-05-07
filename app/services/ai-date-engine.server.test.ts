import { describe, expect, it } from "vitest";

import {
  dateMessageSchema,
  judgeSnapshotSchema,
  memoryCandidateSchema,
  memoryRecordSchema,
} from "../domain/game";
import { LocalGameRepository, MemoryStorageDriver } from "../repositories/local-game-repository";
import {
  advanceDateExchangeWithLocalAi,
  advanceDateExchangeWithLocalAiStream,
  completeDateSessionWithLocalAi,
  type LocalAiDateRuntime,
  type LocalAiDateStreamEvent,
} from "./ai-date-engine.server";
import { startDateSession } from "./date-engine";
import { createSeedGameSave, makePairId } from "./game-seed";
import { withFeaturedMembers } from "./test-helpers";
import { createDeterministicEmbedding } from "./vector-memory";

describe("AI date engine orchestration", () => {
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
          playerSummary: "AI judge filed a useful report.",
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
          text: "Jenna and Vhool completed an AI orchestrated coffee date.",
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

  it("blocks the date update when required AI callbacks fail", async () => {
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
    ).rejects.toThrow("AI performer failed for Jenna Pike: performer unavailable");

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
        throw new Error("non-streaming performer should not run");
      },
      streamCharacterTurn: async ({ packet, onTextDelta, onReasoningDelta }) => {
        const text = packet.prompt.includes("as Jenna Pike")
          ? "Jenna watches the coffee unspill and asks if that is normal."
          : "Vhool says\u2014normal is a department opinion, not a fact.";
        const reasoningText = packet.prompt.includes("as Jenna Pike")
          ? "Jenna thinks\u2014this coffee is doing paperwork."
          : "";

        for (const chunk of reasoningText.split(" ").filter((part) => part.length > 0)) {
          await onReasoningDelta?.(`${chunk} `);
        }

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
      summarizeDateMemories: async () => [
        memoryCandidateSchema.parse({
          scope: "pair",
          visibility: "public",
          subjectIds: ["jenna-pike", "vhool"],
          pairId: started.session.pairId,
          scenarioId: started.session.scenarioId,
          dateSessionId: started.session.id,
          text: "Jenna and Vhool completed a streamed AI exchange.",
          tags: ["date_summary"],
          importance: 3,
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
    expect(events.map((event) => event.type)).toContain("characterReasoningDelta");
    expect(events.at(-1)?.type).toBe("judgeStart");
    expect(
      events
        .filter((event) => event.type === "characterDelta")
        .map((event) => event.textDelta)
        .join(""),
    ).not.toMatch(/[\u2014\u2013]/);
    expect(
      events
        .filter((event) => event.type === "characterReasoningDelta")
        .map((event) => event.textDelta)
        .join(""),
    ).toContain("Jenna thinks, this coffee");
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

  it("generates each local AI character turn from the previous generated turn", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "ai-sequential-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 4,
      },
    };
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const performerPrompts: string[] = [];
    const firstGeneratedText = "Jenna names the first receipt and asks if Vhool trusts clocks.";
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => {
        performerPrompts.push(packet.prompt);

        return {
          text:
            performerPrompts.length === 1
              ? firstGeneratedText
              : "Vhool answers the clock question after hearing Jenna.",
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
          dateHealthDelta: 2,
          statDeltas: {
            trust: 1,
          },
          memberMoodDeltas: {
            "jenna-pike": 1,
            vhool: 1,
          },
          shouldEndEarly: false,
          notableMoments: ["Vhool answered Jenna's actual generated line."],
          playerSummary: "The exchange stayed sequential.",
          memoryCandidates: [],
        }),
      summarizeDateMemories: async () => {
        throw new Error("summarizer should not run before completion");
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
    await repository.saveGame(started.save);

    await advanceDateExchangeWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(performerPrompts).toHaveLength(2);
    expect(performerPrompts[0]).not.toContain(firstGeneratedText);
    expect(performerPrompts[1]).toContain(firstGeneratedText);
  });

  it("judges every completed AI exchange with the pending transcript", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "ai-judge-cadence-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 6,
      },
    };
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    let characterCount = 0;
    const judgePrompts: string[] = [];
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async () => {
        characterCount += 1;

        return {
          text: `line ${characterCount} response`,
          providerMode: "ollama",
          model: "fake-performer",
          stepCount: 1,
          toolCallCount: 0,
          toolResultCount: 0,
        };
      },
      judgeDateExchange: async ({ packet, dateSessionId, exchangeIndex }) => {
        judgePrompts.push(packet.prompt);

        return judgeSnapshotSchema.parse({
          id: `judge-${dateSessionId}-${exchangeIndex}`,
          dateSessionId,
          exchangeIndex,
          dateHealthDelta: 2,
          statDeltas: {
            trust: 1,
          },
          memberMoodDeltas: {
            "jenna-pike": 1,
            vhool: 1,
          },
          shouldEndEarly: false,
          notableMoments: ["Four turns gave the judge enough context."],
          playerSummary: "Judge waited for a real sample before filing.",
          memoryCandidates: [],
        });
      },
      summarizeDateMemories: async () => {
        throw new Error("summarizer should not run before completion");
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
    await repository.saveGame(started.save);

    const firstAdvance = await advanceDateExchangeWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(firstAdvance.session.judgeSnapshots).toHaveLength(1);
    const firstJudgeSnapshot = firstAdvance.session.judgeSnapshots[0];
    expect(firstAdvance.session.currentTurn).toBe(2);
    expect(firstJudgeSnapshot).toBeDefined();
    if (firstJudgeSnapshot === undefined) {
      throw new Error("Expected first judge snapshot after completed AI exchange.");
    }
    expect(firstAdvance.session.dateHealth).toBe(
      started.session.dateHealth + firstJudgeSnapshot.dateHealthDelta,
    );
    expect(firstJudgeSnapshot.exchangeIndex).toBe(0);
    expect(judgePrompts[0]).toContain("line 1 response");
    expect(judgePrompts[0]).toContain("line 2 response");
    expect(judgePrompts[0]).not.toContain("line 3 response");

    const secondAdvance = await advanceDateExchangeWithLocalAi(firstAdvance.save, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: firstAdvance.save.config,
      now: new Date("2026-05-05T12:03:00.000Z"),
    });

    expect(secondAdvance.session.currentTurn).toBe(4);
    expect(secondAdvance.session.judgeSnapshots).toHaveLength(2);
    expect(secondAdvance.session.judgeSnapshots[1]?.exchangeIndex).toBe(1);
    expect(judgePrompts[1]).toContain("Prior judge filing for exchange 0");
    expect(judgePrompts[1]).toContain("line 3 response");
    expect(judgePrompts[1]).toContain("line 4 response");
  });

  it("can advance one AI member message before judging the exchange", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "ai-single-line-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 4,
      },
    };
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    let characterCount = 0;
    const judgePrompts: string[] = [];
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async () => {
        characterCount += 1;

        return {
          text: `single line ${characterCount}`,
          providerMode: "ollama",
          model: "fake-performer",
          stepCount: 1,
          toolCallCount: 0,
          toolResultCount: 0,
        };
      },
      judgeDateExchange: async ({ packet, dateSessionId, exchangeIndex }) => {
        judgePrompts.push(packet.prompt);

        return judgeSnapshotSchema.parse({
          id: `judge-${dateSessionId}-${exchangeIndex}`,
          dateSessionId,
          exchangeIndex,
          dateHealthDelta: 1,
          statDeltas: {
            trust: 1,
          },
          memberMoodDeltas: {
            "jenna-pike": 1,
            vhool: 1,
          },
          shouldEndEarly: false,
          notableMoments: ["Two lines gave the judge enough context."],
          playerSummary: "The exchange landed in sequence.",
          memoryCandidates: [],
        });
      },
      summarizeDateMemories: async () => {
        throw new Error("summarizer should not run before completion");
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
    await repository.saveGame(started.save);

    const firstLine = await advanceDateExchangeWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      turnCount: 1,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });
    const secondLine = await advanceDateExchangeWithLocalAi(firstLine.save, repository, {
      dateSessionId: started.session.id,
      turnCount: 1,
      runtime,
      config: firstLine.save.config,
      now: new Date("2026-05-05T12:03:00.000Z"),
    });

    expect(firstLine.session.currentTurn).toBe(1);
    expect(firstLine.session.judgeSnapshots).toHaveLength(0);
    expect(secondLine.session.currentTurn).toBe(2);
    expect(secondLine.session.judgeSnapshots).toHaveLength(1);
    expect(judgePrompts[0]).toContain("single line 1");
    expect(judgePrompts[0]).toContain("single line 2");
  });

  it("feeds performers the full active date transcript after judged exchanges", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "ai-full-context-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "venus",
    ]);
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 14,
      },
    };
    const started = startDateSession(save, {
      focusMemberId: "venus",
      firstMemberId: "venus",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const historySpeakers = ["venus", "vhool"] as const;
    const historyTranscript = Array.from({ length: 10 }, (_, index) =>
      dateMessageSchema.parse({
        id: `${started.session.id}-history-${index + 1}`,
        dateSessionId: started.session.id,
        kind: "character" as const,
        speakerId: historySpeakers[index % historySpeakers.length],
        turnIndex: index + 1,
        sequenceIndex: index + 1,
        text:
          index === 0
            ? "Venus opener locked: the table is an altar with invoices."
            : index === 1
              ? "Vhool opener locked: I hear the cups practicing a hymn."
              : `line ${index + 1} established the second refill as mutual property.`,
        createdAt: "2026-05-05T12:02:00.000Z",
      }),
    );
    const judgedHistory = Array.from({ length: 5 }, (_, index) =>
      judgeSnapshotSchema.parse({
        id: `judge-${started.session.id}-${index}`,
        dateSessionId: started.session.id,
        exchangeIndex: index,
        dateHealthDelta: 1,
        statDeltas: {
          trust: 1,
        },
        memberMoodDeltas: {
          venus: 1,
          vhool: 1,
        },
        shouldEndEarly: false,
        notableMoments: [`exchange ${index + 1} stayed conversational.`],
        playerSummary: `Judge filed exchange ${index + 1}.`,
        memoryCandidates: [],
      }),
    );
    const sessionWithHistory = {
      ...started.session,
      currentTurn: 10,
      turnLimit: 14,
      transcript: [...started.session.transcript, ...historyTranscript],
      judgeSnapshots: judgedHistory,
    };
    const saveWithHistory = {
      ...started.save,
      dateSessions: started.save.dateSessions.map((session) =>
        session.id === sessionWithHistory.id ? sessionWithHistory : session,
      ),
    };
    const performerPrompts: string[] = [];
    let generationCount = 0;
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => {
        performerPrompts.push(packet.prompt);
        generationCount += 1;

        return {
          text: `full context response ${generationCount}`,
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
          dateHealthDelta: 1,
          statDeltas: {
            trust: 1,
          },
          memberMoodDeltas: {
            venus: 1,
            vhool: 1,
          },
          shouldEndEarly: false,
          notableMoments: ["The pair kept the old refills in context."],
          playerSummary: "Cupid observed a continuous exchange.",
          memoryCandidates: [],
        }),
      summarizeDateMemories: async () => {
        throw new Error("summarizer should not run before completion");
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
    await repository.saveGame(saveWithHistory);

    const result = await advanceDateExchangeWithLocalAi(saveWithHistory, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: saveWithHistory.config,
      now: new Date("2026-05-05T12:03:00.000Z"),
    });

    expect(result.session.currentTurn).toBe(12);
    expect(performerPrompts).toHaveLength(2);
    for (const prompt of performerPrompts) {
      expect(prompt).toContain("Venus opener locked: the table is an altar with invoices.");
      expect(prompt).toContain("Vhool opener locked: I hear the cups practicing a hymn.");
    }
  });
});
