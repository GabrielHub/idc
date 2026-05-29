import { describe, expect, it } from "vitest";

import { dateMessageSchema, memoryRecordSchema, type MemoryRecord } from "../domain/game";
import { starterScenarios } from "../fixtures";
import { LocalGameRepository } from "../repositories/local-game-repository";
import { MemorySaveStore } from "../repositories/memory-save-store";
import { retrieveRelevantMemories, searchCupidMemory } from "./cupid-memory";
import { createDateTranscriptMemoryRecords } from "./date-transcript-memory";
import { createSeedGameSave, makePairId } from "./game-seed";
import { startAndDraftDateSession, withFeaturedMembers } from "./test-helpers";
import { DETERMINISTIC_EMBEDDING_MODEL, createDeterministicEmbedding } from "./vector-memory";

type MemoryFixtureInput = {
  id: string;
  scope: MemoryRecord["scope"];
  visibility?: MemoryRecord["visibility"];
  subjectIds: string[];
  visibleToMemberIds?: string[];
  pairId?: string;
  scenarioId?: string;
  dateSessionId?: string;
  text: string;
  tags?: string[];
  importance?: number;
  createdAt?: string;
  embeddingText?: string;
  embeddingModel?: string;
};

function buildMemory(input: MemoryFixtureInput): MemoryRecord {
  const embedding = createDeterministicEmbedding(input.embeddingText ?? input.text);

  return memoryRecordSchema.parse({
    id: input.id,
    scope: input.scope,
    visibility: input.visibility ?? "public",
    subjectIds: input.subjectIds,
    visibleToMemberIds: input.visibleToMemberIds,
    pairId: input.pairId,
    scenarioId: input.scenarioId,
    dateSessionId: input.dateSessionId,
    text: input.text,
    tags: input.tags ?? ["date_summary"],
    importance: input.importance ?? 3,
    createdAt: input.createdAt ?? "2026-05-05T12:00:00.000Z",
    embedding,
    embeddingModel: input.embeddingModel ?? DETERMINISTIC_EMBEDDING_MODEL,
    embeddingDimensions: embedding.length,
  });
}

function buildNoiseMemories(count: number, scenarioId: string): MemoryRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const first = `noise-member-${index}-a`;
    const second = `noise-member-${index}-b`;

    return buildMemory({
      id: `memory-noise-${index}`,
      scope: index % 2 === 0 ? "pair" : "scenario",
      subjectIds: [first, second],
      pairId: makePairId(first, second),
      scenarioId,
      dateSessionId: `date-noise-${index}`,
      text: `Unrelated pair ${index} also kept a brass receipt by the soup spoon.`,
      embeddingText: "brass receipt soup spoon",
    });
  });
}

describe("Cupid memory retrieval", () => {
  it("scopes performer tool search to memories from the current character's own dates", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "cupid-memory-tool-scope", {
      writeDebounceMs: 0,
    });
    const currentPairId = makePairId("jenna-pike", "vhool");
    const otherPairId = makePairId("opal-sunday", "bai-wenshu");
    const scenarioId = "temporal-coffee-shop";
    const save = {
      ...createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")),
      memories: [
        buildMemory({
          id: "memory-current-scenario",
          scope: "scenario",
          subjectIds: ["jenna-pike", "vhool"],
          pairId: currentPairId,
          scenarioId,
          dateSessionId: "date-current",
          text: "Jenna and Vhool remember the brass receipt curling under the soup spoon.",
          embeddingText: "brass receipt soup spoon",
        }),
        buildMemory({
          id: "memory-other-scenario",
          scope: "scenario",
          subjectIds: ["opal-sunday", "bai-wenshu"],
          pairId: otherPairId,
          scenarioId,
          dateSessionId: "date-other",
          text: "Opal and Bai remember the brass receipt curling under the soup spoon.",
          embeddingText: "brass receipt soup spoon",
        }),
        buildMemory({
          id: "memory-current-pair",
          scope: "pair",
          subjectIds: ["jenna-pike", "vhool"],
          pairId: currentPairId,
          scenarioId,
          dateSessionId: "date-current",
          text: "Vhool kept the brass receipt after Jenna asked if soup came with paperwork.",
          embeddingText: "brass receipt soup paperwork",
        }),
        buildMemory({
          id: "memory-other-pair",
          scope: "pair",
          subjectIds: ["opal-sunday", "bai-wenshu"],
          pairId: otherPairId,
          scenarioId,
          dateSessionId: "date-other",
          text: "Bai kept the brass receipt after Opal asked if soup came with paperwork.",
          embeddingText: "brass receipt soup paperwork",
        }),
        ...buildNoiseMemories(40, scenarioId),
      ],
    };
    await repository.saveGame(save);

    const scenarioResult = await searchCupidMemory(repository, {
      characterId: "jenna-pike",
      pairId: currentPairId,
      scenarioId,
      query: "brass receipt soup spoon",
      scope: ["scenario"],
      limit: 5,
    });
    const pairResult = await searchCupidMemory(repository, {
      characterId: "jenna-pike",
      pairId: currentPairId,
      scenarioId,
      query: "brass receipt soup paperwork",
      scope: ["pair"],
      limit: 5,
    });

    expect(scenarioResult.map((memory) => memory.id)).toEqual(["memory-current-scenario"]);
    expect(pairResult.map((memory) => memory.id)).toEqual(["memory-current-pair"]);
    expect([...scenarioResult, ...pairResult].every((memory) => memory.tags.length === 0)).toBe(
      true,
    );
  });

  it("retrieves semantic prompt memories without leaking same-scenario dates from other pairs", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), "cupid-memory-pack-scope", {
      writeDebounceMs: 0,
    });
    const baseSave = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(baseSave, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const currentPairId = started.session.pairId;
    const otherPairId = makePairId("opal-sunday", "bai-wenshu");
    const transcriptMessage = dateMessageSchema.parse({
      id: `${started.session.id}-test-memory-msg`,
      dateSessionId: started.session.id,
      kind: "character",
      speakerId: "jenna-pike",
      turnIndex: 1,
      sequenceIndex: started.session.transcript.length,
      text: "Jenna asks whether the brass receipt is part of the soup ritual.",
      createdAt: "2026-05-05T12:01:30.000Z",
    });
    const session = {
      ...started.session,
      transcript: [...started.session.transcript, transcriptMessage],
    };
    const save = {
      ...started.save,
      dateSessions: started.save.dateSessions.map((dateSession) =>
        dateSession.id === session.id ? session : dateSession,
      ),
      memories: [
        buildMemory({
          id: "memory-self-journal",
          scope: "member",
          visibility: "member_private",
          subjectIds: ["jenna-pike"],
          visibleToMemberIds: ["jenna-pike"],
          pairId: currentPairId,
          scenarioId: session.scenarioId,
          dateSessionId: "date-current",
          text: "Jenna privately remembers testing Vhool with the brass receipt question.",
          embeddingText: "Jenna brass receipt question",
        }),
        buildMemory({
          id: "memory-pair-receipt",
          scope: "pair",
          subjectIds: ["jenna-pike", "vhool"],
          pairId: currentPairId,
          scenarioId: session.scenarioId,
          dateSessionId: "date-current",
          text: "Vhool kept the brass receipt after Jenna made the soup ritual specific.",
          embeddingText: "Vhool Jenna brass receipt soup ritual",
        }),
        buildMemory({
          id: "memory-current-place",
          scope: "scenario",
          subjectIds: ["jenna-pike", "vhool"],
          pairId: currentPairId,
          scenarioId: session.scenarioId,
          dateSessionId: "date-current",
          text: "At Cart Before The Horse, Jenna and Vhool treated the brass receipt as soup paperwork.",
          embeddingText: "Cart Before The Horse brass receipt soup paperwork",
        }),
        buildMemory({
          id: "memory-other-place",
          scope: "scenario",
          subjectIds: ["opal-sunday", "bai-wenshu"],
          pairId: otherPairId,
          scenarioId: session.scenarioId,
          dateSessionId: "date-other",
          text: "At Cart Before The Horse, Opal and Bai treated the brass receipt as soup paperwork.",
          embeddingText: "Cart Before The Horse brass receipt soup paperwork",
        }),
      ],
    };
    await repository.saveGame(save);

    const pack = await retrieveRelevantMemories(repository, {
      characterId: "jenna-pike",
      partnerId: "vhool",
      pairId: currentPairId,
      scenarioId: session.scenarioId,
      session,
      query: "Jenna Vhool Cart Before The Horse brass receipt soup ritual",
      limit: 5,
    });

    expect(pack.self.map((memory) => memory.id)).toEqual(["memory-self-journal"]);
    expect(pack.pair.map((memory) => memory.id)).toEqual(["memory-pair-receipt"]);
    expect(pack.scenario.map((memory) => memory.id)).toEqual(["memory-current-place"]);
    expect(pack.recentTranscript).toEqual(session.transcript);
  });

  it("keeps repository vector search bounded by filters, embedding compatibility, and visibility", async () => {
    const repository = new LocalGameRepository(
      new MemorySaveStore(),
      "cupid-memory-vector-search",
      {
        writeDebounceMs: 0,
      },
    );
    const pairId = makePairId("jenna-pike", "vhool");
    const query = "brass receipt soup spoon";
    const save = {
      ...createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")),
      memories: [
        buildMemory({
          id: "memory-vector-visible",
          scope: "pair",
          subjectIds: ["jenna-pike", "vhool"],
          pairId,
          scenarioId: "temporal-coffee-shop",
          text: "Jenna and Vhool filed the brass receipt under soup paperwork.",
          embeddingText: query,
        }),
        buildMemory({
          id: "memory-vector-wrong-model",
          scope: "pair",
          subjectIds: ["jenna-pike", "vhool"],
          pairId,
          scenarioId: "temporal-coffee-shop",
          text: "Jenna and Vhool kept a second brass receipt near the soup spoon.",
          embeddingText: query,
          embeddingModel: "old-embedding-model",
        }),
        buildMemory({
          id: "memory-vector-private",
          scope: "pair",
          visibility: "member_private",
          subjectIds: ["jenna-pike", "vhool"],
          visibleToMemberIds: ["vhool"],
          pairId,
          scenarioId: "temporal-coffee-shop",
          text: "Vhool privately hid a brass receipt before Jenna could read it.",
          embeddingText: query,
        }),
      ],
    };
    const embedding = createDeterministicEmbedding(query);
    await repository.saveGame(save);

    const results = await repository.searchMemoriesByVector(
      embedding,
      {
        pairId,
        scopes: ["pair"],
        visibilities: ["public", "member_private"],
        embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
        embeddingDimensions: embedding.length,
        viewer: { role: "character", memberId: "jenna-pike" },
      },
      5,
    );

    expect(results.map((result) => result.memory.id)).toEqual(["memory-vector-visible"]);
    expect(results[0]?.score).toBeCloseTo(1, 5);
  });

  it("stores completed transcript chunks as private pair-searchable date context", async () => {
    const repository = new LocalGameRepository(
      new MemorySaveStore(),
      "cupid-memory-transcript-chunks",
      {
        writeDebounceMs: 0,
      },
    );
    const baseSave = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "imani-wallace",
      "sienna-bae",
    ]);
    const started = startAndDraftDateSession(baseSave, {
      focusMemberId: "imani-wallace",
      firstMemberId: "imani-wallace",
      secondMemberId: "sienna-bae",
      scenarioId: "diner-eleven-pm",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const messages = [
      "Imani says booth four is the only booth with honest pie lighting.",
      "Sienna says booth four sounds less like a calendar trap than the other three places.",
      "The neon over booth four buzzes twice and then settles.",
      "Imani names a silver compass charm from her keychain as the tie-breaker.",
      "Sienna promises to ask one real K drama follow-up before she panics.",
    ].map((text, index) => {
      const base = {
        id: `${started.session.id}-chunk-${index + 1}`,
        dateSessionId: started.session.id,
        turnIndex: index + 1,
        sequenceIndex: started.session.transcript.length + index,
        text,
        createdAt: "2026-05-05T12:02:00.000Z",
      };

      return index === 2
        ? dateMessageSchema.parse({
            ...base,
            kind: "scenario",
          })
        : dateMessageSchema.parse({
            ...base,
            kind: "character",
            speakerId: index % 2 === 0 ? "imani-wallace" : "sienna-bae",
          });
    });
    const session = {
      ...started.session,
      transcript: [...started.session.transcript, ...messages],
    };
    const scenario = starterScenarios.find((candidate) => candidate.id === session.scenarioId);
    const members = session.participants.map((memberId) => {
      const member = started.save.members.find((candidate) => candidate.id === memberId);
      if (member === undefined) throw new Error(`Expected member ${memberId}.`);
      return member;
    });
    if (scenario === undefined) {
      throw new Error("Expected diner scenario.");
    }
    const transcriptMemories = createDateTranscriptMemoryRecords(
      session,
      members,
      scenario,
      "2026-05-05T12:10:00.000Z",
    );
    const save = {
      ...started.save,
      memories: [...started.save.memories, ...transcriptMemories],
    };
    await repository.saveGame(save);

    const result = await searchCupidMemory(repository, {
      characterId: "sienna-bae",
      pairId: session.pairId,
      scenarioId: session.scenarioId,
      query: "silver compass charm booth four",
      scope: ["pair"],
      limit: 3,
    });
    const chunkMemory = transcriptMemories.find((memory) =>
      memory.text.includes("silver compass charm"),
    );

    expect(chunkMemory?.scope).toBe("date");
    expect(chunkMemory?.visibility).toBe("member_private");
    expect(chunkMemory?.visibleToMemberIds).toEqual(session.participants);
    expect(result.map((memory) => memory.id)).toContain(chunkMemory?.id);
  });

  it("keeps late transcript details searchable when long dates exceed the chunk limit", async () => {
    const repository = new LocalGameRepository(
      new MemorySaveStore(),
      "cupid-memory-transcript-tail",
      {
        writeDebounceMs: 0,
      },
    );
    const baseSave = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "imani-wallace",
      "sienna-bae",
    ]);
    const started = startAndDraftDateSession(baseSave, {
      focusMemberId: "imani-wallace",
      firstMemberId: "imani-wallace",
      secondMemberId: "sienna-bae",
      scenarioId: "diner-eleven-pm",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const messages = Array.from({ length: 24 }, (_, index) => {
      const isTailDetail = index === 23;
      return dateMessageSchema.parse({
        id: `${started.session.id}-tail-${index + 1}`,
        dateSessionId: started.session.id,
        kind: "character",
        speakerId: index % 2 === 0 ? "imani-wallace" : "sienna-bae",
        turnIndex: index + 1,
        sequenceIndex: started.session.transcript.length + index,
        text: isTailDetail
          ? "Sienna promises to bring the blue comet breakfast back to booth twelve."
          : `Routine exchange ${index + 1} keeps the coffee clock moving.`,
        createdAt: "2026-05-05T12:02:00.000Z",
      });
    });
    const session = {
      ...started.session,
      transcript: [...started.session.transcript, ...messages],
    };
    const scenario = starterScenarios.find((candidate) => candidate.id === session.scenarioId);
    const members = session.participants.map((memberId) => {
      const member = started.save.members.find((candidate) => candidate.id === memberId);
      if (member === undefined) throw new Error(`Expected member ${memberId}.`);
      return member;
    });
    if (scenario === undefined) {
      throw new Error("Expected diner scenario.");
    }
    const transcriptMemories = createDateTranscriptMemoryRecords(
      session,
      members,
      scenario,
      "2026-05-05T12:10:00.000Z",
    );
    const save = {
      ...started.save,
      memories: [...started.save.memories, ...transcriptMemories],
    };
    await repository.saveGame(save);

    const result = await searchCupidMemory(repository, {
      characterId: "sienna-bae",
      pairId: session.pairId,
      scenarioId: session.scenarioId,
      query: "blue comet breakfast booth twelve",
      scope: ["pair"],
      limit: 3,
    });

    expect(transcriptMemories.some((memory) => memory.text.includes("blue comet breakfast"))).toBe(
      true,
    );
    expect(result.map((memory) => memory.text).join(" ")).toContain("blue comet breakfast");
  });
});
