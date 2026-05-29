import { describe, expect, it } from "vitest";

import {
  dateMessageSchema,
  dateSessionSchema,
  gameSaveSchema,
  memoryRecordSchema,
  SAVE_SCHEMA_VERSION,
  type MemoryRecord,
} from "../domain/game";
import { createSeedGameSave, makePairId } from "../services/game-seed";
import { startAndDraftDateSession, withFeaturedMembers } from "../services/test-helpers";
import {
  DETERMINISTIC_EMBEDDING_MODEL,
  createDeterministicEmbedding,
} from "../services/vector-memory";
import { CURRENT_SAVE_KEY, LEGACY_SAVE_KEYS, LocalGameRepository } from "./local-game-repository";
import { MemorySaveStore } from "./memory-save-store";

type RepositoryMemoryInput = {
  id: string;
  text: string;
  embedding?: number[];
  embeddingText?: string;
  subjectIds?: string[];
  pairId?: string;
  scope?: MemoryRecord["scope"];
  visibility?: MemoryRecord["visibility"];
  createdAt?: string;
};

function buildRepositoryMemory(input: RepositoryMemoryInput): MemoryRecord {
  const embedding =
    input.embedding ?? createDeterministicEmbedding(input.embeddingText ?? input.text);

  return memoryRecordSchema.parse({
    id: input.id,
    scope: input.scope ?? "pair",
    visibility: input.visibility ?? "public",
    subjectIds: input.subjectIds ?? ["jenna-pike", "vhool"],
    pairId: input.pairId,
    text: input.text,
    tags: ["date_summary"],
    importance: 3,
    createdAt: input.createdAt ?? "2026-05-05T12:00:00.000Z",
    embedding,
    embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
    embeddingDimensions: embedding.length,
  });
}

class WriteCountingMemorySaveStore extends MemorySaveStore {
  writeCount = 0;

  override async write(key: string, value: string): Promise<void> {
    this.writeCount += 1;
    await super.write(key, value);
  }
}

describe("LocalGameRepository", () => {
  it("rejects older save keys while preserving them for backup before reset", async () => {
    const legacySaveKey = LEGACY_SAVE_KEYS.at(-1);
    if (legacySaveKey === undefined) {
      throw new Error("Expected a legacy save key.");
    }

    const legacyRaw = JSON.stringify({ version: SAVE_SCHEMA_VERSION - 1, legacy: true });
    const legacyArchiveKey = `${legacySaveKey}.transcript.date-old`;
    const store = new MemorySaveStore();
    await store.write(legacySaveKey, legacyRaw);
    await store.write(legacyArchiveKey, "[]");

    const repository = new LocalGameRepository(store, undefined, {
      writeDebounceMs: 0,
    });

    await expect(repository.loadGame()).rejects.toThrow(/Unsupported local save key/);

    const backupKey = await repository.backupSave(new Date("2026-05-05T12:00:00.000Z"));
    expect(backupKey).toBe(`${legacySaveKey}.bak.2026-05-05T12-00-00-000Z`);
    expect(await store.read(backupKey ?? "")).toBe(legacyRaw);

    const fresh = await repository.resetGame(new Date("2026-05-05T12:01:00.000Z"));

    expect(fresh.version).toBe(SAVE_SCHEMA_VERSION);
    expect(await store.read(CURRENT_SAVE_KEY)).not.toBeNull();
    expect(await store.read(legacySaveKey)).toBeNull();
    expect(await store.read(legacyArchiveKey)).toBeNull();
  });

  it("deletes older save keys during wipe", async () => {
    const legacySaveKey = LEGACY_SAVE_KEYS.at(-1);
    if (legacySaveKey === undefined) {
      throw new Error("Expected a legacy save key.");
    }

    const store = new MemorySaveStore();
    await store.write(legacySaveKey, "{}");
    await store.write(`${legacySaveKey}.transcript.date-old`, "[]");
    const repository = new LocalGameRepository(store, undefined, {
      writeDebounceMs: 0,
    });

    await repository.deleteSave();

    expect(await store.read(legacySaveKey)).toBeNull();
    expect(await store.read(`${legacySaveKey}.transcript.date-old`)).toBeNull();
  });

  it("refreshes fixture-owned member voice from fixtures on load", async () => {
    const sourceSave = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const driftedSave = {
      ...sourceSave,
      members: sourceSave.members.map((member) => ({
        ...member,
        voice: { ...member.voice, register: "stale drifted register" },
      })),
    };
    const store = new MemorySaveStore();
    await store.write(CURRENT_SAVE_KEY, JSON.stringify(driftedSave));

    const repository = new LocalGameRepository(store, CURRENT_SAVE_KEY, {
      writeDebounceMs: 0,
    });
    const loaded = await repository.loadGame();
    const sourceMember = sourceSave.members[0];
    const loadedMember =
      sourceMember === undefined
        ? undefined
        : loaded?.members.find((member) => member.id === sourceMember.id);

    if (sourceMember === undefined || loadedMember === undefined) {
      throw new Error("Expected seed member to load.");
    }

    expect(loadedMember.voice.register).toEqual(sourceMember.voice.register);
    expect(loadedMember.voice.register).not.toBe("stale drifted register");
    expect(loadedMember.voice.comedyMechanics).toEqual(sourceMember.voice.comedyMechanics);
    expect(loadedMember.voice.outputConstraints).toEqual(sourceMember.voice.outputConstraints);
  });

  it("archives completed date transcripts outside the main save and restores them on load", async () => {
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
    const transcriptMessage = dateMessageSchema.parse({
      id: `${started.session.id}-archive-test-message`,
      dateSessionId: started.session.id,
      kind: "character",
      speakerId: "jenna-pike",
      turnIndex: 1,
      sequenceIndex: started.session.transcript.length,
      text: "Jenna asks Vhool whether the brass receipt counts as soup paperwork.",
      createdAt: "2026-05-05T12:02:00.000Z",
    });
    const completedSession = dateSessionSchema.parse({
      ...started.session,
      currentTurn: 1,
      status: "completed",
      endReason: "natural_wrap",
      transcript: [...started.session.transcript, transcriptMessage],
    });
    const completedSave = {
      ...started.save,
      dateSessions: started.save.dateSessions.map((session) =>
        session.id === completedSession.id ? completedSession : session,
      ),
    };
    const store = new WriteCountingMemorySaveStore();
    const repository = new LocalGameRepository(store, "archive-transcript-test", {
      writeDebounceMs: 0,
    });
    await repository.saveGame(completedSave);

    const rawMainSave = await store.read("archive-transcript-test");
    const archiveKeys = await store.listKeys("archive-transcript-test.transcript.");
    const writeCountAfterArchive = store.writeCount;
    const reloadRepository = new LocalGameRepository(store, "archive-transcript-test", {
      writeDebounceMs: 0,
    });
    const loaded = await reloadRepository.loadGame();
    const loadedSession = loaded?.dateSessions.find(
      (session) => session.id === completedSession.id,
    );

    expect(rawMainSave).not.toBeNull();
    if (rawMainSave === null) {
      throw new Error("Expected main save to be written.");
    }

    const parsedMainSave = gameSaveSchema.parse(JSON.parse(rawMainSave));
    const archivedMainSession = parsedMainSave.dateSessions.find(
      (session) => session.id === completedSession.id,
    );

    expect(archivedMainSession).toBeDefined();
    expect(archivedMainSession?.transcript).toEqual([]);
    expect(archiveKeys).toEqual([`archive-transcript-test.transcript.${completedSession.id}`]);
    expect(loadedSession?.transcript).toEqual(completedSession.transcript);
    expect(store.writeCount).toBe(writeCountAfterArchive);
  });

  it("returns fresh vector search results when memories change", async () => {
    const pairId = makePairId("jenna-pike", "vhool");
    const firstEmbedding = createDeterministicEmbedding("first brass receipt");
    const secondEmbedding = createDeterministicEmbedding("second silver compass");
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const firstMemory = buildRepositoryMemory({
      id: "memory-cache-first",
      pairId,
      text: "Jenna and Vhool filed the first brass receipt.",
      embedding: firstEmbedding,
    });
    const secondMemory = buildRepositoryMemory({
      id: "memory-cache-second",
      pairId,
      text: "Jenna and Vhool filed the second silver compass.",
      createdAt: "2026-05-05T12:01:00.000Z",
      embedding: secondEmbedding,
    });
    const repository = new LocalGameRepository(new MemorySaveStore(), "vector-cache-test", {
      writeDebounceMs: 0,
    });
    await repository.saveGame({ ...seed, memories: [firstMemory] });

    const firstResults = await repository.searchMemoriesByVector(
      firstEmbedding,
      {
        pairId,
        scopes: ["pair"],
        embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
        embeddingDimensions: firstEmbedding.length,
        viewer: { role: "character", memberId: "jenna-pike" },
      },
      5,
    );
    await repository.saveGame({ ...seed, memories: [firstMemory, secondMemory] });
    const secondResults = await repository.searchMemoriesByVector(
      secondEmbedding,
      {
        pairId,
        scopes: ["pair"],
        embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
        embeddingDimensions: secondEmbedding.length,
        viewer: { role: "character", memberId: "jenna-pike" },
      },
      5,
    );

    expect(firstResults.map((result) => result.memory.id)).toContain("memory-cache-first");
    expect(secondResults.map((result) => result.memory.id)).toContain("memory-cache-second");
  });

  it("keeps distinct vector queries separate", async () => {
    const pairId = makePairId("jenna-pike", "vhool");
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const horizontalMemory = buildRepositoryMemory({
      id: "memory-cache-horizontal",
      pairId,
      text: "Jenna and Vhool filed the horizontal receipt.",
      embedding: [1, 0],
    });
    const verticalMemory = buildRepositoryMemory({
      id: "memory-cache-vertical",
      pairId,
      text: "Jenna and Vhool filed the vertical receipt.",
      createdAt: "2026-05-05T12:01:00.000Z",
      embedding: [0, 1],
    });
    const repository = new LocalGameRepository(new MemorySaveStore(), "vector-cache-key-test", {
      writeDebounceMs: 0,
    });
    await repository.saveGame({ ...seed, memories: [horizontalMemory, verticalMemory] });

    const verticalResults = await repository.searchMemoriesByVector(
      [0.0000001, 0.0000004],
      {
        pairId,
        scopes: ["pair"],
        embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
        embeddingDimensions: 2,
        viewer: { role: "character", memberId: "jenna-pike" },
      },
      1,
    );
    const horizontalResults = await repository.searchMemoriesByVector(
      [0.0000004, 0.0000001],
      {
        pairId,
        scopes: ["pair"],
        embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
        embeddingDimensions: 2,
        viewer: { role: "character", memberId: "jenna-pike" },
      },
      1,
    );

    expect(verticalResults.map((result) => result.memory.id)).toEqual(["memory-cache-vertical"]);
    expect(horizontalResults.map((result) => result.memory.id)).toEqual([
      "memory-cache-horizontal",
    ]);
  });

  it("searches every requested subject when subject-only vector filters use OR semantics", async () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const repository = new LocalGameRepository(new MemorySaveStore(), "subject-vector-index-test", {
      writeDebounceMs: 0,
    });
    await repository.saveGame({
      ...seed,
      memories: [
        buildRepositoryMemory({
          id: "memory-subject-jenna",
          scope: "member",
          subjectIds: ["jenna-pike"],
          text: "Jenna kept the horizontal receipt.",
          embedding: [1, 0],
        }),
        buildRepositoryMemory({
          id: "memory-subject-vhool",
          scope: "member",
          subjectIds: ["vhool"],
          text: "Vhool kept the vertical receipt.",
          embedding: [0, 1],
        }),
      ],
    });

    const results = await repository.searchMemoriesByVector(
      [1, 1],
      {
        subjectIds: ["vhool", "jenna-pike"],
        scopes: ["member"],
        embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
        embeddingDimensions: 2,
        viewer: { role: "judge" },
      },
      5,
    );

    expect(results.map((result) => result.memory.id).sort()).toEqual([
      "memory-subject-jenna",
      "memory-subject-vhool",
    ]);
  });
});
