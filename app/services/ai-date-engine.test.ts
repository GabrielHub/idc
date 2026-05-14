import { describe, expect, it, vi } from "vitest";

import {
  dateMessageSchema,
  judgeSnapshotSchema,
  memoryCandidateSchema,
  memoryRecordSchema,
} from "../domain/game";
import { LocalGameRepository } from "../repositories/local-game-repository";
import { MemorySaveStore } from "../repositories/memory-save-store";
import {
  advanceDateExchangeWithLocalAi,
  advanceDateExchangeWithLocalAiStream,
  completeDateSessionWithLocalAi,
  sanitizeCharacterText,
  type LocalAiDateRuntime,
  type LocalAiDateStreamEvent,
} from "./ai-date-engine";
import { createSeedGameSave, makePairId } from "./game-seed";
import { OPEN_LOOP_TAG, PAIR_AGREEMENT_TAG } from "./pair-memory";
import { startAndDraftDateSession, withFeaturedMembers } from "./test-helpers";
import { createDeterministicEmbedding } from "./vector-memory";

describe("AI date text sanitation", () => {
  it("removes bare action narration while keeping spoken text", () => {
    expect(
      sanitizeCharacterText(
        "laughs once, quiet. you know, that is the most normal offer in months.",
        "Jenna Pike",
      ),
    ).toBe("you know, that is the most normal offer in months.");
    expect(
      sanitizeCharacterText(
        "I release the tablet. The screen now asks for tonight's winner, no omen attached.",
        "Bai Wenshu of the Falling Plum Sect",
      ),
    ).toBe("The screen now asks for tonight's winner, no omen attached.");
    expect(
      sanitizeCharacterText(
        "I am pressing the tablet now. Thy laugh earns a mark in my private count.",
        "Bai Wenshu of the Falling Plum Sect",
      ),
    ).toBe("Thy laugh earns a mark in my private count.");
  });

  it("keeps first-person spoken admissions", () => {
    expect(sanitizeCharacterText("I am glad you accept both uses.", "Vhool")).toBe(
      "I am glad you accept both uses.",
    );
  });

  it("removes unmatched double quotes without touching balanced quoted phrases", () => {
    expect(
      sanitizeCharacterText('Torn" by Natalie Imbruglia. It is not a destiny.', "Opal Sunday"),
    ).toBe("Torn by Natalie Imbruglia. It is not a destiny.");
    expect(sanitizeCharacterText('The texts say "hold frame".', "Bai Wenshu")).toBe(
      'The texts say "hold frame".',
    );
  });
});

describe("AI date engine orchestration", () => {
  it("runs character, judge, summarizer, embedding, and deterministic memory retrieval", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-engine-test");
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
    const started = startAndDraftDateSession(save, {
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
          endSentiment: "positive",
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
    expect(result.session.judgeSnapshots[0]?.endSentiment).toBeNull();
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

  it("applies accepted pair memory proposals while rejecting duplicates and fabricated ids", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-pair-memory-test");
    const save = {
      ...withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
        "junie-marrow",
        "kade-sumner",
      ]),
      config: {
        ...createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")).config,
        defaultDateMessageLimit: 2,
      },
    };
    const started = startAndDraftDateSession(save, {
      focusMemberId: "junie-marrow",
      firstMemberId: "junie-marrow",
      secondMemberId: "kade-sumner",
      scenarioId: "soft-launch-photo-wall",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => ({
        text: packet.prompt.includes("Junie")
          ? "No filming at the table, please."
          : "No filming at the table. I can make a memory without uploading it.",
        providerMode: "ollama",
        model: "fake-performer",
        stepCount: 1,
        toolCallCount: 0,
        toolResultCount: 0,
      }),
      judgeDateExchange: async ({ dateSessionId, exchangeIndex }) =>
        judgeSnapshotSchema.parse({
          id: `judge-${dateSessionId}-${exchangeIndex}`,
          dateSessionId,
          exchangeIndex,
          dateHealthDelta: 1,
          statDeltas: { trust: 1 },
          memberMoodDeltas: {
            "junie-marrow": 1,
            "kade-sumner": 1,
          },
          shouldEndEarly: false,
          endSentiment: null,
          notableMoments: ["Kade accepted the phone boundary."],
          playerSummary: "Cupid filed the phone boundary.",
          memoryCandidates: [],
          agreementCandidates: [
            { text: "No filming at the table." },
            { text: "No filming at the table" },
          ],
          agreementUpdates: [{ agreementId: "agreement-fabricated", status: "broken" }],
          openLoopCandidates: [{ text: "Whether Kade can make a memory without uploading it." }],
          openLoopUpdates: [{ openLoopId: "loop-fabricated", status: "resolved" }],
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
    await repository.saveGame(started.save);

    const result = await completeDateSessionWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });
    const pairState = result.save.pairStates.find(
      (candidate) => candidate.id === makePairId("junie-marrow", "kade-sumner"),
    );

    expect(pairState?.agreements).toHaveLength(1);
    expect(pairState?.agreements[0]?.text).toBe("No filming at the table.");
    expect(pairState?.openLoops).toHaveLength(1);
    expect(pairState?.openLoops[0]?.text).toBe(
      "Whether Kade can make a memory without uploading it.",
    );
    expect(result.save.memories.some((memory) => memory.tags.includes(PAIR_AGREEMENT_TAG))).toBe(
      true,
    );
    expect(result.save.memories.some((memory) => memory.tags.includes(OPEN_LOOP_TAG))).toBe(true);
  });

  it("attaches Gateway vision images only to the first generated turn", async () => {
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url.endsWith("/v1/models")) {
          return Response.json({
            data: [{ id: "google/gemini-3-flash", tags: ["vision", "file-input"] }],
          });
        }

        if (url.endsWith("/assets/scenarios/manifest.json")) {
          return Response.json({ backgrounds: ["temporal-coffee-shop"] });
        }

        if (
          url.endsWith("/assets/portraits/vhool/portrait.png") ||
          url.endsWith("/assets/scenarios/temporal-coffee-shop/background.webp")
        ) {
          return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
        }

        return new Response(null, { status: 404 });
      }),
    );

    try {
      const repository = new LocalGameRepository(new MemorySaveStore(), "ai-vision-test");
      const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
        "jenna-pike",
      ]);
      const started = startAndDraftDateSession(save, {
        focusMemberId: "jenna-pike",
        firstMemberId: "jenna-pike",
        secondMemberId: "vhool",
        scenarioId: "temporal-coffee-shop",
        now: new Date("2026-05-05T12:01:00.000Z"),
      });
      const packets: Array<Parameters<LocalAiDateRuntime["generateCharacterTurn"]>[0]["packet"]> =
        [];
      const runtime: LocalAiDateRuntime = {
        generateCharacterTurn: async ({ packet }) => {
          packets.push(packet);

          return {
            text:
              packets.length === 1
                ? "Jenna notices the table and asks Vhool about the receipt."
                : "Vhool answers without recruiting anyone.",
            providerMode: "gateway",
            model: "fake-gateway",
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
            dateHealthDelta: 0,
            statDeltas: {},
            memberMoodDeltas: {
              "jenna-pike": 0,
              vhool: 0,
            },
            shouldEndEarly: false,
            endSentiment: null,
            notableMoments: ["The pair held the table."],
            playerSummary: "Cupid filed the table.",
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
      await repository.saveGame(started.save);

      const result = await advanceDateExchangeWithLocalAi(started.save, repository, {
        dateSessionId: started.session.id,
        turnCount: 2,
        runtime,
        config: {
          ...started.save.config,
          aiProvider: "gateway",
          chatModel: "google/gemini-3-flash",
        },
        now: new Date("2026-05-05T12:02:00.000Z"),
      });

      expect(result.session.currentTurn).toBe(2);
      expect(packets).toHaveLength(2);
      expect(packets[0]?.prompt).toContain("Attached image 1 is Vhool's full-body date portrait.");
      expect(packets[0]?.prompt).toContain(
        "Attached image 2 is Temporal Coffee Shop, the date scenario background.",
      );
      expect(packets[1]?.prompt).not.toContain("Attached image 1 is");

      const firstFinalMessage = packets[0]?.messages?.at(-1);
      const secondFinalMessage = packets[1]?.messages?.at(-1);

      expect(Array.isArray(firstFinalMessage?.content)).toBe(true);
      expect(typeof secondFinalMessage?.content).toBe("string");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("lets character turns tool call scoped memory search", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-memory-tool-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const pairId = makePairId("jenna-pike", "vhool");
    save = {
      ...save,
      memories: [
        ...save.memories,
        memoryRecordSchema.parse({
          id: "memory-tool-visible-receipt",
          scope: "pair",
          visibility: "member_private",
          subjectIds: ["jenna-pike", "vhool"],
          visibleToMemberIds: ["jenna-pike"],
          pairId,
          scenarioId: "temporal-coffee-shop",
          text: "Jenna remembers Vhool keeping a brass soup receipt after their first date.",
          tags: ["soup", "receipt", "date_memory"],
          importance: 4,
          createdAt: "2026-05-05T12:00:00.000Z",
          embedding: createDeterministicEmbedding("brass soup receipt first date"),
          embeddingModel: "fake-embedding",
          embeddingDimensions: 64,
        }),
        memoryRecordSchema.parse({
          id: "memory-tool-hidden-surprise",
          scope: "pair",
          visibility: "member_private",
          subjectIds: ["jenna-pike", "vhool"],
          visibleToMemberIds: ["vhool"],
          pairId,
          scenarioId: "temporal-coffee-shop",
          text: "Vhool is hiding a private surprise involving the receipt.",
          tags: ["private", "surprise"],
          importance: 3,
          createdAt: "2026-05-05T12:00:00.000Z",
          embedding: createDeterministicEmbedding("brass soup receipt first date"),
          embeddingModel: "fake-embedding",
          embeddingDimensions: 64,
        }),
      ],
    };
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const toolMemoryIds: string[] = [];
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ tools }) => {
        if (tools === undefined) {
          throw new Error("Expected character memory tools.");
        }

        const result = await tools.searchCupidMemory({
          query: "brass soup receipt",
          scope: ["pair"],
          limit: 3,
        });
        toolMemoryIds.push(...result.memories.map((memory) => memory.id));

        return {
          text: "Jenna remembers the brass receipt and asks whether Vhool kept it on purpose.",
          providerMode: "ollama",
          model: "fake-performer",
          stepCount: 2,
          toolCallCount: 1,
          toolResultCount: 1,
        };
      },
      judgeDateExchange: async () => {
        throw new Error("judge should not run after a single unpaired turn");
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

    const result = await advanceDateExchangeWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      turnCount: 1,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(toolMemoryIds).toContain("memory-tool-visible-receipt");
    expect(toolMemoryIds).not.toContain("memory-tool-hidden-surprise");
    expect(result.aiTelemetry.characterToolCallCount).toBe(1);
    expect(result.aiTelemetry.characterToolResultCount).toBe(1);
    expect(result.session.currentTurn).toBe(1);
    expect(result.session.transcript.at(-1)?.text).toContain("brass receipt");
  });

  it("completes the date when final memory filing fails", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-memory-fail-test");
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
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => ({
        text: packet.prompt.includes("as Jenna Pike")
          ? "Jenna asks one grounded coffee question."
          : "Vhool answers the coffee question without recruiting anyone.",
        providerMode: "ollama",
        model: "fake-performer",
        stepCount: 1,
        toolCallCount: 0,
        toolResultCount: 0,
      }),
      judgeDateExchange: async ({ dateSessionId, exchangeIndex }) =>
        judgeSnapshotSchema.parse({
          id: `judge-${dateSessionId}-${exchangeIndex}`,
          dateSessionId,
          exchangeIndex,
          dateHealthDelta: 3,
          statDeltas: {
            trust: 2,
          },
          memberMoodDeltas: {
            "jenna-pike": 1,
            vhool: 1,
          },
          shouldEndEarly: false,
          notableMoments: ["The pair handled coffee like adults."],
          playerSummary: "The date stayed useful despite filing trouble.",
          memoryCandidates: [],
        }),
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
    await repository.saveGame(started.save);

    const result = await completeDateSessionWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(result.session.status).toBe("completed");
    expect(result.session.finalReport?.memoryRecordIds).toEqual([
      `memory-${started.session.id}-ai-fallback`,
    ]);
    expect(result.save.memories).toHaveLength(started.save.memories.length + 1);
    const fallbackMemory = result.save.memories.find(
      (memory) => memory.id === `memory-${started.session.id}-ai-fallback`,
    );
    expect(fallbackMemory).toBeDefined();
    if (fallbackMemory === undefined) {
      throw new Error("Expected fallback memory to be saved.");
    }
    expect(fallbackMemory.visibility).toBe("public");
    expect(fallbackMemory.tags).toContain("fallback_summary");
    expect(fallbackMemory.embeddingModel).toBe("deterministic-local");
    expect(fallbackMemory.text).toContain("Cupid filed a basic case note");
    expect(result.warningMessages.join(" ")).toContain(
      "AI memory filing used a deterministic fallback case note.",
    );
    expect(result.warningMessages.join(" ")).toContain(
      "Structured memory output failed, but the date was filed.",
    );
  });

  it("lets a validated AI judge snapshot end a date before the turn limit", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-early-end-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 8,
      },
    };
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    let generatedTurns = 0;
    let summarized = false;
    const generatedLines = [
      "Jenna asks why the top receipt knows her locker number.",
      "Vhool folds the corner and asks whether paper can consent.",
      "Jenna pushes the cup away and names the question as too close.",
      "Vhool admits the loop answered before either of them spoke.",
      "Jenna says the table can keep its prophecy and stands up.",
      "Vhool lets the chair scrape back without making a joke.",
    ];
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async () => {
        generatedTurns += 1;
        const line = generatedLines[generatedTurns - 1];

        return {
          text: line ?? `Receipt exit line ${generatedTurns}.`,
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
          dateHealthDelta: -10,
          statDeltas: {
            conflict: 4,
            strain: 5,
            relationshipHealth: -7,
          },
          memberMoodDeltas: {
            "jenna-pike": -4,
            vhool: -3,
          },
          shouldEndEarly: true,
          earlyEndReason: "Jenna stopped after the receipt loop got personal.",
          endSentiment: "negative",
          notableMoments: ["Jenna stopped answering after the receipt got personal."],
          playerSummary: "Cupid stopped the receipt loop before it ate the table.",
          memoryCandidates: [],
          usedEvidenceIds: [],
        }),
      summarizeDateMemories: async () => {
        summarized = true;

        return [
          memoryCandidateSchema.parse({
            scope: "pair",
            visibility: "public",
            subjectIds: ["jenna-pike", "vhool"],
            pairId: started.session.pairId,
            scenarioId: started.session.scenarioId,
            dateSessionId: started.session.id,
            text: "The top receipt got personal, Jenna stopped answering, and Vhool let the coffee date end.",
            tags: ["date_summary", "early_end"],
            importance: 4,
          }),
        ];
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
      turnCount: 2,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });
    const secondAdvance = await advanceDateExchangeWithLocalAi(firstAdvance.save, repository, {
      dateSessionId: started.session.id,
      turnCount: 2,
      runtime,
      config: firstAdvance.save.config,
      now: new Date("2026-05-05T12:03:00.000Z"),
    });
    const result = await advanceDateExchangeWithLocalAi(secondAdvance.save, repository, {
      dateSessionId: started.session.id,
      turnCount: 2,
      runtime,
      config: secondAdvance.save.config,
      now: new Date("2026-05-05T12:04:00.000Z"),
    });

    expect(result.session.status).toBe("ended_early");
    expect(result.session.currentTurn).toBe(6);
    expect(result.session.turnLimit).toBe(8);
    expect(result.session.playbackState).toBe("ended");
    expect(result.session.endSentiment).toBe("negative");
    expect(result.session.finalReport?.outcome).toBe("early_end");
    expect(result.session.finalReport?.recommendedFollowUp).toBe("repair");
    expect(result.session.judgeSnapshots[0]?.shouldEndEarly).toBe(true);
    expect(result.session.judgeSnapshots[0]?.earlyEndReason).toContain("Jenna stopped");
    expect(generatedTurns).toBe(6);
    expect(summarized).toBe(true);
  });

  it("blocks the date update when required AI callbacks fail", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-block-test");
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
    const started = startAndDraftDateSession(save, {
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
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-stream-test");
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
    const started = startAndDraftDateSession(save, {
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
    const eventTypes = events.map((event) => event.type as string);
    expect(eventTypes).toContain("characterDelta");
    expect(
      eventTypes.every(
        (type) =>
          type === "characterStart" ||
          type === "characterDelta" ||
          type === "characterDone" ||
          type === "judgeStart",
      ),
    ).toBe(true);
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

  it("stops after the active streamed character when requested", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-stream-pause-test");
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
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    let streamCallCount = 0;
    let stopAfterCurrentTurn = false;
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async () => {
        throw new Error("non-streaming performer should not run");
      },
      streamCharacterTurn: async ({ onTextDelta }) => {
        streamCallCount += 1;
        const text = "Jenna pauses at the backwards coffee.";

        await onTextDelta(text);
        stopAfterCurrentTurn = true;

        return {
          text,
          providerMode: "ollama",
          model: "fake-stream-performer",
          stepCount: 1,
          toolCallCount: 0,
          toolResultCount: 0,
        };
      },
      judgeDateExchange: async () => {
        throw new Error("judge waits for a full exchange");
      },
      summarizeDateMemories: async () => {
        throw new Error("summarizer waits for a completed date");
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
    const events: LocalAiDateStreamEvent[] = [];
    await repository.saveGame(started.save);

    const result = await advanceDateExchangeWithLocalAiStream(
      started.save,
      repository,
      {
        dateSessionId: started.session.id,
        runtime,
        config: started.save.config,
        turnCount: 2,
        shouldStopAfterCurrentTurn: () => stopAfterCurrentTurn,
        now: new Date("2026-05-05T12:02:00.000Z"),
      },
      (event) => {
        events.push(event);
      },
    );
    const characterMessages = result.session.transcript.filter(
      (message) => message.kind === "character",
    );
    const loadedSave = await repository.loadGame();
    const loadedSession = loadedSave?.dateSessions.find(
      (session) => session.id === started.session.id,
    );

    expect(streamCallCount).toBe(1);
    expect(characterMessages).toHaveLength(1);
    expect(characterMessages[0]?.text).toBe("Jenna pauses at the backwards coffee.");
    expect(result.session.currentTurn).toBe(1);
    expect(result.session.judgeSnapshots).toHaveLength(0);
    expect(events.map((event) => event.type)).toEqual([
      "characterStart",
      "characterDelta",
      "characterDone",
    ]);
    expect(loadedSession?.currentTurn).toBe(1);
  });

  it("rejects the streamed exchange and preserves the prior commit when the second speaker fails", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-stream-second-fail");
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
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    let streamCallCount = 0;
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async () => {
        throw new Error("non-streaming performer should not run");
      },
      streamCharacterTurn: async ({ packet, onTextDelta }) => {
        streamCallCount += 1;

        if (streamCallCount === 1) {
          const text = "Jenna leads with a calm receipt question.";

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
        }

        if (!packet.prompt.includes("as Vhool")) {
          throw new Error("expected the second performer call to be Vhool");
        }

        await onTextDelta("Vhool starts ");
        throw new Error("provider dropped the connection mid stream");
      },
      judgeDateExchange: async () => {
        throw new Error("judge should not run when a performer fails mid stream");
      },
      summarizeDateMemories: async () => {
        throw new Error("summarizer should not run when a performer fails mid stream");
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
    const events: LocalAiDateStreamEvent[] = [];
    await repository.saveGame(started.save);

    await expect(
      advanceDateExchangeWithLocalAiStream(
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
      ),
    ).rejects.toThrow("AI performer failed for Vhool: provider dropped the connection mid stream");

    expect(streamCallCount).toBe(2);
    expect(events.filter((event) => event.type === "characterStart")).toHaveLength(2);
    expect(events.some((event) => event.type === "judgeStart")).toBe(false);

    const loadedSave = await repository.loadGame();
    const loadedSession = loadedSave?.dateSessions.find(
      (session) => session.id === started.session.id,
    );

    expect(loadedSession?.status).toBe("active");
    expect(loadedSession?.currentTurn).toBe(0);
    expect(
      loadedSession?.transcript.filter((message) => message.kind === "character"),
    ).toHaveLength(0);
    expect(loadedSession?.judgeSnapshots).toHaveLength(0);

    streamCallCount = 0;
    const retryRuntime: LocalAiDateRuntime = {
      ...runtime,
      streamCharacterTurn: async ({ packet, onTextDelta }) => {
        const text = packet.prompt.includes("as Jenna Pike")
          ? "Jenna asks the calm receipt question on retry."
          : "Vhool answers the receipt on retry.";

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
          dateHealthDelta: 1,
          statDeltas: {},
          memberMoodDeltas: {},
          shouldEndEarly: false,
          notableMoments: ["Retry produced two clean lines."],
          playerSummary: "Retry succeeded.",
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
          text: "Retry exchange completed.",
          tags: ["date_summary"],
          importance: 2,
        }),
      ],
    };

    const retryResult = await advanceDateExchangeWithLocalAiStream(
      started.save,
      repository,
      {
        dateSessionId: started.session.id,
        runtime: retryRuntime,
        config: started.save.config,
        now: new Date("2026-05-05T12:03:00.000Z"),
      },
      () => {},
    );

    expect(
      retryResult.session.transcript.filter((message) => message.kind === "character"),
    ).toHaveLength(2);
    expect(retryResult.session.judgeSnapshots).toHaveLength(1);
  });

  it("generates each local AI character turn from the previous generated turn", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-sequential-test");
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
    const started = startAndDraftDateSession(save, {
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
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-judge-cadence-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 18,
      },
    };
    const started = startAndDraftDateSession(save, {
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

    let runningSave = started.save;
    let runningSession = started.session;

    for (let exchange = 0; exchange < 3; exchange += 1) {
      const advanced = await advanceDateExchangeWithLocalAi(runningSave, repository, {
        dateSessionId: started.session.id,
        runtime,
        config: runningSave.config,
        now: new Date(`2026-05-05T12:0${exchange + 2}:00.000Z`),
      });
      runningSave = advanced.save;
      runningSession = advanced.session;
    }

    expect(runningSession.judgeSnapshots).toHaveLength(1);
    const firstJudgeSnapshot = runningSession.judgeSnapshots[0];
    expect(runningSession.currentTurn).toBe(6);
    expect(firstJudgeSnapshot).toBeDefined();
    if (firstJudgeSnapshot === undefined) {
      throw new Error("Expected first judge snapshot after completed judge cadence window.");
    }
    expect(runningSession.dateHealth).toBe(
      started.session.dateHealth + firstJudgeSnapshot.dateHealthDelta,
    );
    expect(judgePrompts[0]).toContain("line 1 response");
    expect(judgePrompts[0]).toContain("line 6 response");

    for (let exchange = 0; exchange < 3; exchange += 1) {
      const advanced = await advanceDateExchangeWithLocalAi(runningSave, repository, {
        dateSessionId: started.session.id,
        runtime,
        config: runningSave.config,
        now: new Date(`2026-05-05T12:1${exchange}:00.000Z`),
      });
      runningSave = advanced.save;
      runningSession = advanced.session;
    }

    expect(runningSession.currentTurn).toBe(12);
    expect(runningSession.judgeSnapshots).toHaveLength(2);
    expect(judgePrompts[1]).toContain("line 7 response");
    expect(judgePrompts[1]).toContain("line 12 response");
  });

  it("can advance one AI member message before judging the exchange", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-single-line-test");
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    save = {
      ...save,
      config: {
        ...save.config,
        defaultDateMessageLimit: 8,
      },
    };
    const started = startAndDraftDateSession(save, {
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

    let runningSave = started.save;
    let runningSession = started.session;
    for (let turn = 0; turn < 5; turn += 1) {
      const advanced = await advanceDateExchangeWithLocalAi(runningSave, repository, {
        dateSessionId: started.session.id,
        turnCount: 1,
        runtime,
        config: runningSave.config,
        now: new Date(`2026-05-05T12:0${turn + 2}:00.000Z`),
      });
      runningSave = advanced.save;
      runningSession = advanced.session;
    }

    expect(runningSession.currentTurn).toBe(5);
    expect(runningSession.judgeSnapshots).toHaveLength(0);

    const sixthLine = await advanceDateExchangeWithLocalAi(runningSave, repository, {
      dateSessionId: started.session.id,
      turnCount: 2,
      runtime,
      config: runningSave.config,
      now: new Date("2026-05-05T12:08:00.000Z"),
    });

    expect(sixthLine.session.currentTurn).toBe(6);
    expect(sixthLine.session.judgeSnapshots).toHaveLength(1);
    expect(characterCount).toBe(6);
    expect(judgePrompts[0]).toContain("single line 1");
    expect(judgePrompts[0]).toContain("single line 6");
  });

  it("feeds performers the full active date transcript after judged exchanges", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-full-context-test");
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
    const started = startAndDraftDateSession(save, {
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

  it("retries the performer once when the line nearly duplicates a recent speaker line", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-repetition-guard-test");
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
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const repeatedLine =
      "Jenna keeps circling the same pizza place across the street with the new neon sign.";
    const correctedLine =
      "Jenna pivots to the lemon tart at the back booth and asks Vhool to commit.";
    const transcriptWithPriorJenna = [
      ...started.session.transcript,
      dateMessageSchema.parse({
        id: `${started.session.id}-msg-1`,
        dateSessionId: started.session.id,
        kind: "character" as const,
        speakerId: "jenna-pike",
        turnIndex: 1,
        sequenceIndex: 1,
        text: repeatedLine,
        createdAt: "2026-05-05T12:01:30.000Z",
      }),
      dateMessageSchema.parse({
        id: `${started.session.id}-msg-2`,
        dateSessionId: started.session.id,
        kind: "character" as const,
        speakerId: "vhool",
        turnIndex: 2,
        sequenceIndex: 2,
        text: "Vhool answers about the awning that the recruiter pinned to the menu.",
        createdAt: "2026-05-05T12:01:45.000Z",
      }),
    ];
    const sessionWithHistory = {
      ...started.session,
      currentTurn: 2,
      transcript: transcriptWithPriorJenna,
    };
    const saveWithHistory = {
      ...started.save,
      dateSessions: started.save.dateSessions.map((session) =>
        session.id === sessionWithHistory.id ? sessionWithHistory : session,
      ),
    };
    const performerCalls: { promptIncludesRetryGuard: boolean; recentLinesPresent: boolean }[] = [];
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => {
        const isJennaPrompt = packet.prompt.includes("as Jenna Pike");

        if (!isJennaPrompt) {
          return {
            text: "Vhool answers the lemon tart question without recruiting anyone.",
            providerMode: "ollama",
            model: "fake-performer",
            stepCount: 1,
            toolCallCount: 0,
            toolResultCount: 0,
          };
        }

        performerCalls.push({
          promptIncludesRetryGuard: packet.prompt.includes("Retry guard:"),
          recentLinesPresent: packet.prompt.includes(repeatedLine),
        });
        const text =
          performerCalls.length === 1
            ? "Jenna circles the same pizza place again across the street with the neon sign."
            : correctedLine;

        return {
          text,
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
          statDeltas: {},
          memberMoodDeltas: {},
          shouldEndEarly: false,
          notableMoments: ["The retry kept the date moving."],
          playerSummary: "Cupid filed a recovered turn.",
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
      turnCount: 1,
      runtime,
      config: saveWithHistory.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(performerCalls).toHaveLength(2);
    expect(performerCalls[0]?.promptIncludesRetryGuard).toBe(false);
    expect(performerCalls[0]?.recentLinesPresent).toBe(true);
    expect(performerCalls[1]?.promptIncludesRetryGuard).toBe(true);
    expect(result.session.transcript.at(-1)?.text).toBe(correctedLine);
    expect(result.warningMessages.join(" ")).toContain(
      "Cupid asked Jenna Pike to rewrite a near duplicate line",
    );
  });

  it("retries a blank performer line before committing the turn", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-empty-line-retry-test");
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
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const performerCalls: {
      promptIncludesRetryGuard: boolean;
      messagesIncludeRetryGuard: boolean;
    }[] = [];
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => {
        const messageText =
          packet.messages
            ?.map((message) =>
              typeof message.content === "string"
                ? message.content
                : message.content.map((part) => (part.type === "text" ? part.text : "")).join("\n"),
            )
            .join("\n") ?? "";

        performerCalls.push({
          promptIncludesRetryGuard: packet.prompt.includes("no usable spoken line"),
          messagesIncludeRetryGuard: messageText.includes("no usable spoken line"),
        });

        return {
          text:
            performerCalls.length === 1
              ? ""
              : "Jenna asks whether the inventory soup has a normal spoon policy.",
          providerMode: "ollama",
          model: "fake-performer",
          stepCount: 1,
          toolCallCount: 0,
          toolResultCount: 0,
        };
      },
      judgeDateExchange: async () => {
        throw new Error("judge should not run before the exchange boundary");
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

    const result = await advanceDateExchangeWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      turnCount: 1,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(performerCalls).toEqual([
      { promptIncludesRetryGuard: false, messagesIncludeRetryGuard: false },
      { promptIncludesRetryGuard: true, messagesIncludeRetryGuard: true },
    ]);
    expect(result.session.transcript.at(-1)?.text).toBe(
      "Jenna asks whether the inventory soup has a normal spoon policy.",
    );
    expect(result.warningMessages.join(" ")).toContain(
      "Cupid asked Jenna Pike to retry an empty AI line",
    );
  });

  it("retries a repeated approval phrase before committing the turn", async () => {
    const repository = new LocalGameRepository(
      new MemorySaveStore(),
      "ai-repeated-approval-retry-test",
    );
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
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const priorJennaLine = "i respect the soup planning, honestly.";
    const sessionWithHistory = {
      ...started.session,
      currentTurn: 2,
      transcript: [
        ...started.session.transcript,
        dateMessageSchema.parse({
          id: `${started.session.id}-msg-1`,
          dateSessionId: started.session.id,
          kind: "character",
          speakerId: "jenna-pike",
          turnIndex: 1,
          sequenceIndex: 1,
          text: priorJennaLine,
          createdAt: "2026-05-05T12:01:30.000Z",
        }),
        dateMessageSchema.parse({
          id: `${started.session.id}-msg-2`,
          dateSessionId: started.session.id,
          kind: "character",
          speakerId: "vhool",
          turnIndex: 2,
          sequenceIndex: 2,
          text: "Vhool offers a jar of soup that behaves itself.",
          createdAt: "2026-05-05T12:01:45.000Z",
        }),
      ],
    };
    const saveWithHistory = {
      ...started.save,
      dateSessions: started.save.dateSessions.map((session) =>
        session.id === sessionWithHistory.id ? sessionWithHistory : session,
      ),
    };
    const performerCalls: { promptIncludesRhythmRetry: boolean }[] = [];
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => {
        performerCalls.push({
          promptIncludesRhythmRetry: packet.prompt.includes("Rhythm retry:"),
        });

        return {
          text:
            performerCalls.length === 1
              ? "i respect the jar strategy, that is pretty solid."
              : "the jar strategy is strange, but warm soup is doing real work here.",
          providerMode: "ollama",
          model: "fake-performer",
          stepCount: 1,
          toolCallCount: 0,
          toolResultCount: 0,
        };
      },
      judgeDateExchange: async () => {
        throw new Error("judge should not run before the exchange boundary");
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
    await repository.saveGame(saveWithHistory);

    const result = await advanceDateExchangeWithLocalAi(saveWithHistory, repository, {
      dateSessionId: started.session.id,
      turnCount: 1,
      runtime,
      config: saveWithHistory.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(performerCalls).toEqual([
      { promptIncludesRhythmRetry: false },
      { promptIncludesRhythmRetry: true },
    ]);
    expect(result.session.transcript.at(-1)?.text).toBe(
      "the jar strategy is strange, but warm soup is doing real work here.",
    );
    expect(result.warningMessages.join(" ")).toContain(
      "Cupid asked Jenna Pike to rewrite a repeated approval phrase",
    );
  });

  it("replaces generic judge summaries and memory text with deterministic fallbacks", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-voice-fallback-test");
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
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => ({
        text: packet.prompt.includes("as Jenna Pike")
          ? "Jenna asks a grounded coffee question."
          : "Vhool answers without recruiting anyone.",
        providerMode: "ollama",
        model: "fake-performer",
        stepCount: 1,
        toolCallCount: 0,
        toolResultCount: 0,
      }),
      judgeDateExchange: async ({ dateSessionId, exchangeIndex }) =>
        judgeSnapshotSchema.parse({
          id: `judge-${dateSessionId}-${exchangeIndex}`,
          dateSessionId,
          exchangeIndex,
          dateHealthDelta: 4,
          statDeltas: {
            trust: 2,
          },
          memberMoodDeltas: {
            "jenna-pike": 1,
            vhool: 1,
          },
          shouldEndEarly: false,
          notableMoments: ["The pair built a deeper connection over the coffee."],
          playerSummary:
            "Cupid helped Jenna and Vhool leverage their synergies to elevate their connection.",
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
          text: "Jenna and Vhool navigated their feelings and built a deep connection.",
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
    await repository.saveGame(started.save);

    const result = await completeDateSessionWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    const snapshot = result.session.judgeSnapshots[0];
    expect(snapshot?.playerSummary).not.toContain("leverage");
    expect(snapshot?.playerSummary).not.toContain("synergies");
    expect(snapshot?.playerSummary).toContain("Cupid filed exchange 1.");
    expect(snapshot?.playerSummary).toContain("Temporal Coffee Shop");
    expect(snapshot?.notableMoments.join(" ")).not.toMatch(/deeper connection/i);

    const memory = result.save.memories.find(
      (entry) => entry.id === `memory-${started.session.id}-ai-1`,
    );
    expect(memory).toBeDefined();
    expect(memory?.text).not.toMatch(/deep connection/i);
    expect(memory?.text).not.toMatch(/navigated/i);
    expect(memory?.tags).toContain("fallback_summary");
  });

  it("validates judge usedEvidenceIds and persists only valid display-safe knowledge", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "ai-reveal-validation-test");
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
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const promptSeenByJudge: string[] = [];
    const runtime: LocalAiDateRuntime = {
      generateCharacterTurn: async ({ packet }) => ({
        text: packet.prompt.includes("as Jenna Pike")
          ? "Jenna asks a grounded coffee question."
          : "Vhool answers without recruiting anyone.",
        providerMode: "ollama",
        model: "fake-performer",
        stepCount: 1,
        toolCallCount: 0,
        toolResultCount: 0,
      }),
      judgeDateExchange: async ({ packet, dateSessionId, exchangeIndex }) => {
        promptSeenByJudge.push(packet.prompt);

        return judgeSnapshotSchema.parse({
          id: `judge-${dateSessionId}-${exchangeIndex}`,
          dateSessionId,
          exchangeIndex,
          dateHealthDelta: 1,
          statDeltas: {},
          memberMoodDeltas: {
            "jenna-pike": 0,
            vhool: 0,
          },
          shouldEndEarly: false,
          notableMoments: ["the date filed nothing notable"],
          playerSummary: "AI judge filed a quiet exchange.",
          memoryCandidates: [],
          usedEvidenceIds: ["fabricated:invented-id"],
        });
      },
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
    await repository.saveGame(started.save);

    const result = await completeDateSessionWithLocalAi(started.save, repository, {
      dateSessionId: started.session.id,
      runtime,
      config: started.save.config,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    expect(promptSeenByJudge.length).toBeGreaterThan(0);
    expect(promptSeenByJudge[0]).toContain("usedEvidenceIds");

    const persistedSnapshots = result.session.judgeSnapshots;

    for (const snapshot of persistedSnapshots) {
      expect(snapshot.usedEvidenceIds).not.toContain("fabricated:invented-id");
    }

    for (const record of result.save.playerKnowledge) {
      expect(record.readId).not.toContain("fabricated");
    }
  });
});
