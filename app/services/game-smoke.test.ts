import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  gameSaveSchema,
  memoryRecordSchema,
  memberSchema,
  SAVE_SCHEMA_VERSION,
  type PortraitAsset,
} from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import {
  CURRENT_SAVE_KEY,
  LEGACY_SAVE_KEYS,
  LocalGameRepository,
  MemoryStorageDriver,
} from "../repositories/local-game-repository";
import { searchCupidMemory } from "./cupid-memory";
import {
  addCupidIntervention,
  advanceDateExchange,
  applyFollowUpAction,
  completeDateSession,
  completeShift,
  startDateSession,
  startNextShift,
} from "./date-engine";
import { createSeedGameSave, makePairId } from "./game-seed";
import { createDeterministicEmbedding } from "./vector-memory";

const APPROVED_PORTRAIT_MEMBER_IDS = [
  "aldric-vale-marsh",
  "calvin-hewes",
  "gideon-glass",
  "marcus-pellish",
  "meridian-vale",
  "mr-whiskers",
  "vhool",
];

describe("IDC playable smoke path", () => {
  it("validates the starter fixture counts", () => {
    expect(starterMembers).toHaveLength(16);
    expect(starterScenarios).toHaveLength(14);
    expect(
      starterMembers.every((member) => member.portraits.neutral.avatar.cutoutPath.length > 0),
    ).toBe(true);
  });

  it("keeps portrait source paths outside public runtime assets", () => {
    const sourcePaths = starterMembers.flatMap((member) => [
      member.portraits.neutral.portrait.sourcePath,
      member.portraits.neutral.avatar.sourcePath,
    ]);

    expect(
      sourcePaths.every(
        (sourcePath) =>
          !sourcePath.replaceAll("\\", "/").startsWith("public/assets/portraits/source"),
      ),
    ).toBe(true);
  });

  it("keeps portrait assets grouped by member id", () => {
    for (const member of starterMembers) {
      expect(member.portraits.neutral.portrait.sourcePath).toBe(
        `assets-source/portraits/${member.id}/portrait.png`,
      );
      expect(member.portraits.neutral.avatar.sourcePath).toBe(
        `assets-source/portraits/${member.id}/avatar.png`,
      );
      expect(member.portraits.neutral.portrait.cutoutPath).toBe(
        `/assets/portraits/${member.id}/portrait.png`,
      );
      expect(member.portraits.neutral.avatar.cutoutPath).toBe(
        `/assets/portraits/${member.id}/avatar.png`,
      );
    }
  });

  it("keeps approved portrait sets backed by checked files", () => {
    const approvedMembers = starterMembers.filter((member) =>
      APPROVED_PORTRAIT_MEMBER_IDS.includes(member.id),
    );

    expect(approvedMembers.map((member) => member.id).sort()).toEqual(
      [...APPROVED_PORTRAIT_MEMBER_IDS].sort(),
    );

    for (const member of approvedMembers) {
      const assets = [
        member.portraits.neutral.portrait,
        member.portraits.neutral.avatar,
      ] satisfies PortraitAsset[];

      for (const asset of assets) {
        expect(asset.model).not.toBe("pending");
        expect(existsSync(toWorkspaceFilePath(asset.sourcePath))).toBe(true);
        expect(existsSync(toWorkspaceFilePath(asset.cutoutPath))).toBe(true);
      }
    }
  });

  it("seeds and persists canonical game state through the repository", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "test-save");
    const save = await repository.resetGame(new Date("2026-05-05T12:00:00.000Z"));
    const loaded = await repository.loadGame();

    expect(save.version).toBe(SAVE_SCHEMA_VERSION);
    expect(loaded?.activeShiftId).toBe(save.activeShiftId);
    expect(await repository.listMembers()).toHaveLength(16);
    expect(await repository.listPairStates()).toHaveLength(120);
    expect(await repository.getActiveShift()).not.toBeNull();
  });

  it("migrates valid default saves from legacy storage keys", async () => {
    const legacySaveKey = LEGACY_SAVE_KEYS.at(-1);

    if (legacySaveKey === undefined) {
      throw new Error("Expected a legacy save key for schema migration coverage.");
    }

    const storage = new MemoryStorageDriver();
    const repository = new LocalGameRepository(storage);
    const save = createThirteenMemberSave(new Date("2026-05-05T12:00:00.000Z"));
    storage.setItem(legacySaveKey, JSON.stringify(save));

    const loaded = await repository.loadGame();

    expect(loaded?.version).toBe(SAVE_SCHEMA_VERSION);
    expect(loaded?.activeShiftId).toBe(save.activeShiftId);
    expect(loaded?.members).toHaveLength(16);
    expect(loaded?.pairStates).toHaveLength(120);
    expect(loaded?.members.some((member) => member.id === "marcus-pellish")).toBe(true);
    expect(storage.getItem(CURRENT_SAVE_KEY)).not.toBeNull();
    expect(storage.getItem(legacySaveKey)).toBeNull();
  });

  it("hydrates new starter members and pair states into current schema saves", async () => {
    const storage = new MemoryStorageDriver();
    const repository = new LocalGameRepository(storage);
    const save = createThirteenMemberSave(new Date("2026-05-05T12:00:00.000Z"));
    storage.setItem(CURRENT_SAVE_KEY, JSON.stringify(save));

    const loaded = await repository.loadGame();
    const persistedRaw = storage.getItem(CURRENT_SAVE_KEY);

    expect(loaded?.members).toHaveLength(16);
    expect(loaded?.pairStates).toHaveLength(120);
    expect(loaded?.members.some((member) => member.id === "aldric-vale-marsh")).toBe(true);
    expect(persistedRaw).not.toBeNull();
    expect(parsePersistedSave(persistedRaw)?.members).toHaveLength(16);
  });

  it("removes legacy storage keys when resetting or wiping default saves", async () => {
    const legacySaveKey = LEGACY_SAVE_KEYS.at(-1);

    if (legacySaveKey === undefined) {
      throw new Error("Expected a legacy save key for delete coverage.");
    }

    const storage = new MemoryStorageDriver();
    const repository = new LocalGameRepository(storage);
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    storage.setItem(legacySaveKey, JSON.stringify(save));

    const resetSave = await repository.resetGame(new Date("2026-05-05T12:01:00.000Z"));

    expect(resetSave.version).toBe(SAVE_SCHEMA_VERSION);
    expect(storage.getItem(CURRENT_SAVE_KEY)).not.toBeNull();
    expect(storage.getItem(legacySaveKey)).toBeNull();

    storage.setItem(legacySaveKey, JSON.stringify(save));
    await repository.deleteSave();

    expect(storage.getItem(CURRENT_SAVE_KEY)).toBeNull();
    expect(storage.getItem(legacySaveKey)).toBeNull();
  });

  it("hydrates fixture-owned member portrait metadata from old saves", async () => {
    const storage = new MemoryStorageDriver();
    const repository = new LocalGameRepository(storage, "stale-portrait-save");
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const staleSave = gameSaveSchema.parse({
      ...save,
      members: save.members.map((member) =>
        member.id === "sana-karim"
          ? memberSchema.parse({
              ...member,
              state: {
                ...member.state,
                mood: 12,
              },
              portraits: {
                ...member.portraits,
                neutral: {
                  portrait: {
                    ...member.portraits.neutral.portrait,
                    model: "pending",
                  },
                  avatar: {
                    ...member.portraits.neutral.avatar,
                    model: "pending",
                  },
                },
              },
            })
          : member,
      ),
    });
    storage.setItem("stale-portrait-save", JSON.stringify(staleSave));

    const loaded = await repository.loadGame();
    const loadedSana = loaded?.members.find((member) => member.id === "sana-karim");
    const fixtureSana = starterMembers.find((member) => member.id === "sana-karim");

    expect(loadedSana?.state.mood).toBe(12);
    expect(loadedSana?.portraits.neutral.avatar.model).toBe(
      fixtureSana?.portraits.neutral.avatar.model,
    );
    expect(loadedSana?.portraits.neutral.portrait.model).toBe(
      fixtureSana?.portraits.neutral.portrait.model,
    );
  });

  it("searches stored embeddings with metadata and visibility filters", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "memory-save");
    const save = await repository.resetGame(new Date("2026-05-05T12:00:00.000Z"));
    const pairId = makePairId("jenna-pike", "vhool");
    const memory = memoryRecordSchema.parse({
      id: "memory-test-private",
      scope: "member",
      visibility: "member_private",
      subjectIds: ["jenna-pike"],
      visibleToMemberIds: ["jenna-pike"],
      pairId,
      scenarioId: "temporal-coffee-shop",
      text: "Jenna privately remembers that Vhool treated soup as a sincere planning document.",
      tags: ["soup", "private_date_memory"],
      importance: 4,
      createdAt: save.createdAt,
      embedding: createDeterministicEmbedding("soup sincere planning document"),
      embeddingModel: "deterministic-local",
      embeddingDimensions: 64,
    });
    await repository.saveMemory(memory);

    const visibleResults = await searchCupidMemory(repository, {
      characterId: "jenna-pike",
      pairId,
      scenarioId: "temporal-coffee-shop",
      query: "soup planning",
      scope: ["self", "pair", "scenario"],
      limit: 3,
    });
    const hiddenResults = await searchCupidMemory(repository, {
      characterId: "vhool",
      pairId,
      scenarioId: "temporal-coffee-shop",
      query: "soup planning",
      scope: ["self", "pair", "scenario"],
      limit: 3,
    });

    expect(visibleResults.map((result) => result.id)).toContain(memory.id);
    expect(hiddenResults.map((result) => result.id)).not.toContain(memory.id);
  });

  it("does not leak pair-specific scenario memories to another pair", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "scenario-memory-save");
    const save = await repository.resetGame(new Date("2026-05-05T12:00:00.000Z"));
    const originalPairId = makePairId("jenna-pike", "vhool");
    const otherPairId = makePairId("meridian-vale", "mr-whiskers");
    const scenarioMemory = memoryRecordSchema.parse({
      id: "memory-test-scenario-repeat",
      scope: "scenario",
      visibility: "public",
      subjectIds: ["jenna-pike", "vhool"],
      pairId: originalPairId,
      scenarioId: "temporal-coffee-shop",
      text: "Jenna and Vhool already noticed the Temporal Coffee Shop receipt loop.",
      tags: ["scenario_repeat", "temporal-coffee-shop"],
      importance: 3,
      createdAt: save.createdAt,
      embedding: createDeterministicEmbedding("receipt loop repeat"),
      embeddingModel: "deterministic-local",
      embeddingDimensions: 64,
    });
    await repository.saveMemory(scenarioMemory);

    const otherPairResults = await searchCupidMemory(repository, {
      characterId: "meridian-vale",
      pairId: otherPairId,
      scenarioId: "temporal-coffee-shop",
      query: "receipt loop repeat",
      scope: ["scenario"],
      limit: 3,
    });

    expect(otherPairResults.map((result) => result.id)).not.toContain(scenarioMemory.id);
  });

  it("runs a complete date with intervention, judge updates, final report, and memories", () => {
    let save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const started = startDateSession(save, {
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    save = started.save;
    save = addCupidIntervention(save, {
      dateSessionId: started.session.id,
      text: "Ask one grounded question before the room becomes symbolic.",
      now: new Date("2026-05-05T12:02:00.000Z"),
    }).save;

    const completed = completeDateSession(
      save,
      started.session.id,
      new Date("2026-05-05T12:03:00.000Z"),
    );
    const session = completed.session;
    const pairState = completed.save.pairStates.find((pair) => pair.id === session.pairId);

    expect(session.status).toBe("completed");
    expect(session.currentTurn).toBe(30);
    expect(session.judgeSnapshots).toHaveLength(15);
    expect(session.finalReport?.recommendedFollowUp).toBeDefined();
    expect(pairState?.completedDateIds).toContain(session.id);
    expect(pairState?.scenarioUseCounts["temporal-coffee-shop"]).toBe(1);
    expect(completed.save.memories.some((memory) => memory.dateSessionId === session.id)).toBe(
      true,
    );
  });

  it("applies follow-up actions and scores a shift report", () => {
    let save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const started = startDateSession(save, {
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
    });
    save = completeDateSession(started.save, started.session.id).save;
    save = applyFollowUpAction(save, {
      dateSessionId: started.session.id,
      action: "repair",
    }).save;
    const completedShift = completeShift(save, new Date("2026-05-05T13:00:00.000Z"));

    expect(completedShift.report.completedDates).toBe(1);
    expect(completedShift.report.goalResults).toHaveLength(2);
    expect(completedShift.save.shifts[0].status).toBe("completed");
  });

  it("opens the next shift without wiping completed campaign state", () => {
    let save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const started = startDateSession(save, {
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
    });
    save = completeDateSession(started.save, started.session.id).save;
    save = applyFollowUpAction(save, {
      dateSessionId: started.session.id,
      action: "repair",
    }).save;

    const closedShift = completeShift(save, new Date("2026-05-05T13:00:00.000Z"));
    const nextShift = startNextShift(closedShift.save, new Date("2026-05-05T13:01:00.000Z"));
    const completedDate = nextShift.save.dateSessions.find(
      (session) => session.id === started.session.id,
    );

    expect(nextShift.shift.id).toBe("shift-2");
    expect(nextShift.shift.status).toBe("active");
    expect(nextShift.shift.dateSlotsUsed).toBe(0);
    expect(nextShift.shift.drawnScenarioIds).toHaveLength(3);
    expect(nextShift.save.activeShiftId).toBe(nextShift.shift.id);
    expect(nextShift.save.shifts).toHaveLength(2);
    expect(nextShift.save.shifts[0].status).toBe("completed");
    expect(nextShift.save.shifts[0].report).toBeDefined();
    expect(completedDate?.finalReport?.appliedFollowUp).toBe("repair");
  });

  it("enforces active date, scenario hand, shift ending, and follow-up invariants", () => {
    let save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    expect(() => startNextShift(save)).toThrow("File the active shift");

    const started = startDateSession(save, {
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
    });

    expect(() =>
      startDateSession(started.save, {
        firstMemberId: "opal-sunday",
        secondMemberId: "gideon-glass",
        scenarioId: "memory-course-dinner",
      }),
    ).toThrow("Resolve the active date");
    expect(() => completeShift(started.save)).toThrow("Resolve active dates");

    save = completeDateSession(started.save, started.session.id).save;
    save = applyFollowUpAction(save, {
      dateSessionId: started.session.id,
      action: "repair",
    }).save;
    expect(() =>
      applyFollowUpAction(save, {
        dateSessionId: started.session.id,
        action: "encourage",
      }),
    ).toThrow("already filed");
    expect(() =>
      startDateSession(save, {
        firstMemberId: "opal-sunday",
        secondMemberId: "gideon-glass",
        scenarioId: "memory-course-dinner",
      }),
    ).toThrow("not in today's drawn hand");
  });

  it("carries repeated scenario history into the next date transcript", () => {
    let save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const firstDate = startDateSession(save, {
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
    });
    save = completeDateSession(firstDate.save, firstDate.session.id).save;
    const secondDate = startDateSession(save, {
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
    });
    const advanced = advanceDateExchange(secondDate.save, {
      dateSessionId: secondDate.session.id,
    });

    expect(
      advanced.session.transcript.some((message) => message.text.includes("recognize this setup")),
    ).toBe(true);
  });
});

function createThirteenMemberSave(now: Date) {
  const save = createSeedGameSave(now);
  const legacyMemberIds = new Set(save.members.slice(0, 13).map((member) => member.id));

  return gameSaveSchema.parse({
    ...save,
    members: save.members.filter((member) => legacyMemberIds.has(member.id)),
    pairStates: save.pairStates.filter((pairState) =>
      pairState.participantIds.every((memberId) => legacyMemberIds.has(memberId)),
    ),
  });
}

function parsePersistedSave(raw: string | null) {
  if (raw === null) {
    return null;
  }

  const parsed: unknown = JSON.parse(raw);
  return gameSaveSchema.parse(parsed);
}

function toWorkspaceFilePath(assetPath: string) {
  const normalizedPath = assetPath.replaceAll("\\", "/");
  const workspaceRelativePath = normalizedPath.startsWith("/assets/")
    ? `public${normalizedPath}`
    : normalizedPath.replace(/^\/+/, "");

  return join(process.cwd(), ...workspaceRelativePath.split("/"));
}
