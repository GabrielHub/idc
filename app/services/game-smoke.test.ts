import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  type DateScenario,
  gameSaveSchema,
  type GameSave,
  MEMBER_IDENTITY_TAGS,
  memoryRecordSchema,
  memberRequestTagSchema,
  memberSchema,
  memberTagSchema,
  type Member,
  type PairState,
  SAVE_SCHEMA_VERSION,
  shiftStateSchema,
  type PortraitAsset,
} from "../domain/game";
import { memberRequests, starterMembers, starterScenarios } from "../fixtures";
import {
  CURRENT_SAVE_KEY,
  LEGACY_SAVE_KEYS,
  LocalGameRepository,
  MemoryStorageDriver,
  readGameConfigFromStorage,
} from "../repositories/local-game-repository";
import { searchCupidMemory } from "./cupid-memory";
import {
  addCupidIntervention,
  advanceDateExchange,
  applyFollowUpAction,
  buildShiftGoalMetrics,
  CLIENT_LOSS_LIMIT,
  completeDateSession,
  completeShift,
  finalizeDateSession,
  isCampaignLost,
  isMemberRetained,
  startDateSession,
  startNextShift,
} from "./date-engine";
import { createSeedGameSave, makePairId } from "./game-seed";
import { evaluateMatchFit } from "./match-fit";
import { SHIFT_FEATURED_MEMBER_COUNT } from "./shift-planning";
import { buildFeaturedMemberIds, withFeaturedMembers } from "./test-helpers";
import { createDeterministicEmbedding } from "./vector-memory";

const APPROVED_PORTRAIT_MEMBER_IDS = [
  "aldric-vale-marsh",
  "calvin-hewes",
  "decimus-marius-tullio",
  "eleanor-ash",
  "gideon-glass",
  "marcus-pellish",
  "meridian-vale",
  "mr-whiskers",
  "vhool",
];
const OPTIONAL_PORTRAIT_VARIANTS = [
  "flirty",
  "confused",
  "angry",
  "embarrassed",
  "furious",
] as const;
describe("IDC playable smoke path", () => {
  it("validates the starter fixture counts", () => {
    expect(starterMembers).toHaveLength(21);
    expect(starterScenarios).toHaveLength(25);
    expect(
      starterMembers.every((member) => member.portraits.neutral.avatar.cutoutPath.length > 0),
    ).toBe(true);
  });

  it("keeps member gameplay tags controlled and hidden from old fixture fields", () => {
    for (const member of starterMembers) {
      expect(Object.hasOwn(member, "traits")).toBe(false);
      expect(Object.hasOwn(member, "redFlags")).toBe(false);
      expect(member.tags).toHaveLength(Math.min(Math.max(member.tags.length, 3), 5));
      expect(member.tags.every((tag) => memberTagSchema.safeParse(tag).success)).toBe(true);
      expect(member.tags.filter((tag) => MEMBER_IDENTITY_TAGS.includes(tag)).length).toBe(1);
    }
  });

  it("keeps member request tags controlled", () => {
    for (const request of memberRequests) {
      expect(request.tags.length).toBeGreaterThan(0);
      expect(request.tags.every((tag) => memberRequestTagSchema.safeParse(tag).success)).toBe(true);
    }
  });

  it("keeps portrait source paths outside public runtime assets", () => {
    const sourcePaths = starterMembers.flatMap((member) =>
      memberPortraitAssets(member).map((asset) => asset.sourcePath),
    );

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

      for (const variant of OPTIONAL_PORTRAIT_VARIANTS) {
        const variantPortrait = member.portraits[variant]?.portrait;

        if (variantPortrait === undefined) {
          continue;
        }

        expect(variantPortrait.sourcePath).toBe(
          `assets-source/portraits/${member.id}/portrait-${variant}.png`,
        );
        expect(variantPortrait.cutoutPath).toBe(
          `/assets/portraits/${member.id}/portrait-${variant}.png`,
        );
      }
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
      const assets = memberPortraitAssets(member).filter((asset) => asset.model !== "pending");

      for (const asset of assets) {
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
    expect(save.config.aiProvider).toBe("ollama");
    expect(save.config.chatModel).toBe("gemma4:26b");
    expect(save.config.embeddingModel).toBe("embeddinggemma");
    expect(save.config.reasoningLevel).toBe("off");
    expect(save.config.aiSetupComplete).toBe(false);
    expect(save.shifts[0]?.scenarioDeck.maxSize).toBe(starterScenarios.length);
    expect(loaded?.activeShiftId).toBe(save.activeShiftId);
    expect(await repository.listMembers()).toHaveLength(21);
    expect(await repository.listPairStates()).toHaveLength(210);
    expect(await repository.getActiveShift()).not.toBeNull();
  });

  it("reads legacy AI config from stale server saves without parsing gameplay state", () => {
    const storage = new MemoryStorageDriver();
    storage.setItem(
      CURRENT_SAVE_KEY,
      JSON.stringify({
        version: SAVE_SCHEMA_VERSION,
        config: {
          performerModel: "custom-performer",
          judgeModel: "custom-judge",
          summarizerModel: "custom-summarizer",
          embeddingModel: "custom-embedding",
        },
        members: [{ name: "Stale member without current schema fields" }],
      }),
    );

    const config = readGameConfigFromStorage(storage);

    expect(config.aiProvider).toBe("ollama");
    expect(config.chatModel).toBe("custom-performer");
    expect(config.embeddingModel).toBe("custom-embedding");
  });

  it("migrates the experimental split AI defaults into one chat model", async () => {
    const storage = new MemoryStorageDriver();
    const oldDefaultSave = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    storage.setItem(
      CURRENT_SAVE_KEY,
      JSON.stringify({
        ...oldDefaultSave,
        config: {
          performerModel: "gemma4:26b",
          judgeModel: "gemma4:e4b",
          summarizerModel: "gemma4:e4b",
        },
      }),
    );
    const repository = new LocalGameRepository(storage);
    const loaded = await repository.loadGame();

    expect(loaded?.config.aiProvider).toBe("ollama");
    expect(loaded?.config.chatModel).toBe("gemma4:26b");
    expect(loaded?.config.embeddingModel).toBe("embeddinggemma");
  });

  it("keeps Gateway keys out of parsed saves", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const parsed = gameSaveSchema.parse({
      ...save,
      config: {
        ...save.config,
        gatewayApiKey: "not-for-the-save-file",
      },
    });

    expect("gatewayApiKey" in parsed.config).toBe(false);
  });

  it("seeds featured cases and derives shift asks from featured members", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);

    if (activeShift === undefined) {
      throw new Error("Expected an active shift.");
    }

    const featuredMemberIds = new Set(activeShift.featuredMemberIds);
    const featuredMembers = save.members.filter((member) => featuredMemberIds.has(member.id));

    expect(activeShift.featuredMemberIds).toHaveLength(SHIFT_FEATURED_MEMBER_COUNT);
    expect(featuredMemberIds.size).toBe(SHIFT_FEATURED_MEMBER_COUNT);
    expect(featuredMembers.some((member) => member.tags.includes("ordinary_human"))).toBe(true);
    expect(featuredMembers.some((member) => member.tags.includes("non_human"))).toBe(true);
    expect(
      activeShift.memberRequestIds.every((requestId) => {
        const request = memberRequests.find((candidate) => candidate.id === requestId);
        return request !== undefined && featuredMemberIds.has(request.memberId);
      }),
    ).toBe(true);
    expect(activeShift.companyGoalIds).toHaveLength(2);
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
    expect(loaded?.members).toHaveLength(21);
    expect(loaded?.pairStates).toHaveLength(210);
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

    expect(loaded?.members).toHaveLength(21);
    expect(loaded?.pairStates).toHaveLength(210);
    expect(loaded?.members.some((member) => member.id === "aldric-vale-marsh")).toBe(true);
    expect(persistedRaw).not.toBeNull();
    expect(parsePersistedSave(persistedRaw)?.members).toHaveLength(21);
  });

  it("hydrates new starter scenarios into existing scenario decks", async () => {
    const storage = new MemoryStorageDriver();
    const repository = new LocalGameRepository(storage);
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const oldStarterScenarioIds = starterScenarios.slice(0, 14).map((scenario) => scenario.id);
    const staleDeckSave = gameSaveSchema.parse({
      ...save,
      shifts: save.shifts.map((shift) =>
        shiftStateSchema.parse({
          ...shift,
          scenarioDeck: {
            ...shift.scenarioDeck,
            scenarioIds: oldStarterScenarioIds,
            maxSize: 14,
            offeredScenarioIds: shift.scenarioDeck.offeredScenarioIds.filter((scenarioId) =>
              oldStarterScenarioIds.includes(scenarioId),
            ),
          },
        }),
      ),
    });
    storage.setItem(CURRENT_SAVE_KEY, JSON.stringify(staleDeckSave));

    const loaded = await repository.loadGame();
    const persistedRaw = storage.getItem(CURRENT_SAVE_KEY);
    if (loaded === null) {
      throw new Error("Expected hydrated save.");
    }

    const loadedShift = loaded.shifts.find((shift) => shift.id === loaded.activeShiftId);
    const persistedShift = parsePersistedSave(persistedRaw)?.shifts.find(
      (shift) => shift.id === loaded.activeShiftId,
    );
    const expectedScenarioIds = starterScenarios.map((scenario) => scenario.id);

    expect(loadedShift?.scenarioDeck.scenarioIds).toEqual(expectedScenarioIds);
    expect(loadedShift?.scenarioDeck.maxSize).toBe(starterScenarios.length);
    expect(persistedShift?.scenarioDeck.scenarioIds).toEqual(expectedScenarioIds);
    expect(persistedShift?.scenarioDeck.maxSize).toBe(starterScenarios.length);
  });

  it("migrates pre-gameplay-tag v2 saves without resetting campaign state", async () => {
    const storage = new MemoryStorageDriver();
    const repository = new LocalGameRepository(storage);
    const staleSave = createPreGameplayTagSave(new Date("2026-05-05T12:00:00.000Z"));
    storage.setItem(CURRENT_SAVE_KEY, JSON.stringify(staleSave));

    const loaded = await repository.loadGame();
    const persistedRaw = storage.getItem(CURRENT_SAVE_KEY);
    const loadedJenna = loaded?.members.find((member) => member.id === "jenna-pike");
    const persistedSave = parsePersistedSave(persistedRaw);
    const persistedJenna = persistedSave?.members.find((member) => member.id === "jenna-pike");

    expect(loaded?.members).toHaveLength(21);
    expect(loaded?.pairStates).toHaveLength(210);
    expect(loadedJenna?.firstName).toBe("Jenna");
    expect(loadedJenna?.state.mood).toBe(11);
    expect(loadedJenna?.tags).toContain("prophecy_averse");
    expect(persistedJenna?.firstName).toBe("Jenna");
    expect(persistedJenna?.tags.every((tag) => memberTagSchema.safeParse(tag).success)).toBe(true);
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

  it("hydrates fixture-owned data on load instead of ordinary save writes", async () => {
    const storage = new MemoryStorageDriver();
    const repository = new LocalGameRepository(storage, "hot-path-save");
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const staleSave = gameSaveSchema.parse({
      ...save,
      members: save.members.map((member) =>
        member.id === "sana-karim"
          ? memberSchema.parse({
              ...member,
              portraits: {
                ...member.portraits,
                neutral: {
                  portrait: {
                    ...member.portraits.neutral.portrait,
                    model: "stale-model",
                  },
                  avatar: {
                    ...member.portraits.neutral.avatar,
                    model: "stale-model",
                  },
                },
              },
            })
          : member,
      ),
    });

    await repository.saveGame(staleSave);
    const persistedBeforeLoad = parsePersistedSave(storage.getItem("hot-path-save"));
    const savedSana = persistedBeforeLoad?.members.find((member) => member.id === "sana-karim");

    expect(savedSana?.portraits.neutral.avatar.model).toBe("stale-model");

    const loaded = await repository.loadGame();
    const loadedSana = loaded?.members.find((member) => member.id === "sana-karim");
    const persistedAfterLoad = parsePersistedSave(storage.getItem("hot-path-save"));
    const persistedSana = persistedAfterLoad?.members.find((member) => member.id === "sana-karim");
    const fixtureSana = starterMembers.find((member) => member.id === "sana-karim");

    expect(loadedSana?.portraits.neutral.avatar.model).toBe(
      fixtureSana?.portraits.neutral.avatar.model,
    );
    expect(persistedSana?.portraits.neutral.avatar.model).toBe(
      fixtureSana?.portraits.neutral.avatar.model,
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
    const compatibleResults = await searchCupidMemory(repository, {
      characterId: "jenna-pike",
      pairId,
      scenarioId: "temporal-coffee-shop",
      query: "soup planning",
      queryEmbedding: createDeterministicEmbedding("soup sincere planning document"),
      queryEmbeddingModel: "deterministic-local",
      queryEmbeddingDimensions: 64,
      scope: ["self", "pair", "scenario"],
      limit: 3,
    });
    const mismatchedResults = await searchCupidMemory(repository, {
      characterId: "jenna-pike",
      pairId,
      scenarioId: "temporal-coffee-shop",
      query: "soup planning",
      queryEmbedding: createDeterministicEmbedding("soup sincere planning document"),
      queryEmbeddingModel: "other-model",
      queryEmbeddingDimensions: 64,
      scope: ["self", "pair", "scenario"],
      limit: 3,
    });

    expect(visibleResults.map((result) => result.id)).toContain(memory.id);
    expect(hiddenResults.map((result) => result.id)).not.toContain(memory.id);
    expect(compatibleResults.map((result) => result.id)).toContain(memory.id);
    expect(mismatchedResults.map((result) => result.id)).not.toContain(memory.id);
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
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
      "vhool",
    ]);
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
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

  it("scores match fit from hidden member tags and scenario pressure", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const prophecyFit = evaluateFixtureFit(save, {
      firstMemberId: "jenna-pike",
      secondMemberId: "opal-sunday",
      scenarioId: "prophecy-karaoke",
      requestIds: ["request-jenna-normal-date"],
    });
    const privacyFit = evaluateFixtureFit(save, {
      firstMemberId: "meridian-vale",
      secondMemberId: "calvin-hewes",
      scenarioId: "museum-exhibit-mixup",
    });
    const quietFit = evaluateFixtureFit(save, {
      firstMemberId: "marcus-pellish",
      secondMemberId: "sana-karim",
      scenarioId: "chain-restaurant-tuesday",
      requestIds: ["request-sana-decompress"],
    });
    const quietFitWithoutAsk = evaluateFixtureFit(save, {
      firstMemberId: "marcus-pellish",
      secondMemberId: "sana-karim",
      scenarioId: "chain-restaurant-tuesday",
    });
    const careerFit = evaluateFixtureFit(save, {
      firstMemberId: "tasha-rell",
      secondMemberId: "mr-whiskers",
      scenarioId: "underworld-department-mixer",
    });
    const chaoticFit = evaluateFixtureFit(save, {
      firstMemberId: "tasha-rell",
      secondMemberId: "mr-whiskers",
      scenarioId: "alternate-ex-double-date",
    });

    expect(prophecyFit.fitLevel).toBe("risky");
    expect(prophecyFit.pressureLevel).toBe("high");
    expect(prophecyFit.askSignal).toBe("blocked");
    expect(prophecyFit.hardStop?.memberId).toBe("jenna-pike");
    expect(privacyFit.fitLevel).toBe("risky");
    expect(privacyFit.hardStop?.memberId).toBe("meridian-vale");
    expect(quietFit.startingDateHealthDelta).toBeGreaterThan(0);
    expect(quietFit.startingDateHealthDelta).toBeGreaterThan(
      quietFitWithoutAsk.startingDateHealthDelta,
    );
    expect(quietFit.askSignal).toBe("covered");
    expect(careerFit.startingDateHealthDelta).toBeGreaterThan(chaoticFit.startingDateHealthDelta);
  });

  it("applies hard stops as near zero relationship collapses", () => {
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "meridian-vale",
      "calvin-hewes",
    ]);
    const started = startDateSession(save, {
      focusMemberId: "meridian-vale",
      firstMemberId: "meridian-vale",
      secondMemberId: "calvin-hewes",
      scenarioId: "museum-exhibit-mixup",
    });
    const advanced = advanceDateExchange(started.save, {
      dateSessionId: started.session.id,
    });
    const session = advanced.session;
    const pairState = findPairState(advanced.save, session.pairId);

    expect(session.status).toBe("ended_early");
    expect(session.dateHealth).toBe(5);
    expect(session.finalReport?.outcome).toBe("early_end");
    expect(session.judgeSnapshots.at(-1)?.earlyEndReason).toContain("dealbreaker");
    expect(pairState.stats.relationshipHealth).toBe(5);
    expect(pairState.stats.conflict).toBeGreaterThanOrEqual(90);
    expect(pairState.stats.strain).toBeGreaterThanOrEqual(90);

    save = applyFollowUpAction(advanced.save, {
      dateSessionId: session.id,
      action: "repair",
    }).save;
    save = withCompanyGoals(save, ["goal-prevent-early-end"]);
    const completedShift = completeShift(save, new Date("2026-05-05T13:00:00.000Z"));
    const preventEarlyEndGoal = completedShift.report.goalResults.find(
      (result) => result.goalId === "goal-prevent-early-end",
    );

    expect(completedShift.report.completedDates).toBe(1);
    expect(completedShift.report.earlyEndedDates).toBe(1);
    expect(preventEarlyEndGoal?.status).toBe("missed");
    expect(preventEarlyEndGoal?.progress).toBe(1);
  });

  it("files completed collapsed compatibility as a bad fit", () => {
    const save = withActiveShiftConfig(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), {
      drawnScenarioIds: ["chain-restaurant-tuesday"],
      memberRequestIds: ["request-sana-decompress"],
      featuredMemberIds: ["sana-karim"],
    });
    const started = startDateSession(save, {
      focusMemberId: "sana-karim",
      firstMemberId: "sana-karim",
      secondMemberId: "brady-strait",
      scenarioId: "chain-restaurant-tuesday",
    });
    const pairState = findPairState(started.save, started.session.pairId);
    const badFitPairState: PairState = {
      ...pairState,
      stats: {
        ...pairState.stats,
        chemistry: 18,
        trust: 20,
        stability: 22,
        conflict: 82,
        spark: 12,
        strain: 88,
        relationshipHealth: 22,
      },
    };
    const scenario = findScenario("chain-restaurant-tuesday");
    const members = started.session.participants.map((memberId) =>
      findMember(started.save, memberId),
    );
    const finalSession = finalizeDateSession({
      session: {
        ...started.session,
        status: "completed",
        currentTurn: started.session.turnLimit,
      },
      pairState: badFitPairState,
      members,
      scenario,
      completedAt: "2026-05-05T12:30:00.000Z",
    });

    expect(finalSession.finalReport?.outcome).toBe("bad_fit");
    expect(finalSession.finalReport?.recommendedFollowUp).toBe("mark_bad_fit");
  });

  it("penalizes ignored member requests against client retention at shift close", () => {
    let save = withActiveShiftConfig(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), {
      drawnScenarioIds: ["chain-restaurant-tuesday"],
      memberRequestIds: ["request-sana-decompress", "request-jenna-normal-date"],
      featuredMemberIds: ["sana-karim", "jenna-pike"],
    });
    save = withMemberRetention(save, "jenna-pike", 5);
    const started = startDateSession(save, {
      focusMemberId: "sana-karim",
      firstMemberId: "sana-karim",
      secondMemberId: "marcus-pellish",
      scenarioId: "chain-restaurant-tuesday",
    });
    save = completeDateSession(started.save, started.session.id).save;

    const completedShift = completeShift(save, new Date("2026-05-05T13:00:00.000Z"));
    const jenna = findMember(completedShift.save, "jenna-pike");

    expect(completedShift.report.ignoredRequestIds).toContain("request-jenna-normal-date");
    expect(jenna.state.retention).toBe(0);
    expect(isMemberRetained(jenna)).toBe(false);
  });

  it("ends high tension low health dates before the turn limit", () => {
    let save = withActiveShiftConfig(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), {
      drawnScenarioIds: ["alternate-ex-double-date"],
      memberRequestIds: ["request-tasha-counterparty"],
      featuredMemberIds: ["tasha-rell"],
    });
    const started = startDateSession(save, {
      focusMemberId: "tasha-rell",
      firstMemberId: "tasha-rell",
      secondMemberId: "mr-whiskers",
      scenarioId: "alternate-ex-double-date",
    });
    const pairState = findPairState(started.save, started.session.pairId);
    const stressedPairState: PairState = {
      ...pairState,
      stats: {
        ...pairState.stats,
        conflict: 82,
        strain: 84,
        relationshipHealth: 28,
      },
    };
    save = gameSaveSchema.parse({
      ...started.save,
      pairStates: started.save.pairStates.map((candidate) =>
        candidate.id === stressedPairState.id ? stressedPairState : candidate,
      ),
      dateSessions: started.save.dateSessions.map((session) =>
        session.id === started.session.id ? { ...session, dateHealth: 16 } : session,
      ),
    });

    const advanced = advanceDateExchange(save, {
      dateSessionId: started.session.id,
    });

    expect(advanced.session.status).toBe("ended_early");
    expect(advanced.session.currentTurn).toBeLessThan(advanced.session.turnLimit);
    expect(advanced.session.judgeSnapshots.at(-1)?.earlyEndReason).toContain("walkout");
  });

  it("detects campaign loss when enough clients quit", () => {
    let save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));

    for (const memberId of save.members.slice(0, CLIENT_LOSS_LIMIT).map((member) => member.id)) {
      save = withMemberRetention(save, memberId, 0);
    }

    expect(isCampaignLost(save)).toBe(true);
  });

  it("uses focused member asks as modifiers without ignored penalties", () => {
    let save = withActiveShiftConfig(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), {
      drawnScenarioIds: ["prophecy-karaoke"],
      memberRequestIds: ["request-jenna-normal-date"],
      featuredMemberIds: ["jenna-pike"],
    });
    const blockedDate = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "opal-sunday",
      scenarioId: "prophecy-karaoke",
    });
    save = advanceDateExchange(blockedDate.save, {
      dateSessionId: blockedDate.session.id,
    }).save;
    const blockedShift = completeShift(save, new Date("2026-05-05T13:00:00.000Z"));

    expect(blockedDate.session.focusRequestId).toBe("request-jenna-normal-date");
    expect(blockedShift.report.ignoredRequestIds).toEqual([]);

    save = withActiveShiftConfig(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), {
      drawnScenarioIds: ["chain-restaurant-tuesday"],
      memberRequestIds: ["request-sana-decompress"],
      featuredMemberIds: ["sana-karim"],
    });
    const coveredDate = startDateSession(save, {
      focusMemberId: "sana-karim",
      firstMemberId: "sana-karim",
      secondMemberId: "marcus-pellish",
      scenarioId: "chain-restaurant-tuesday",
    });
    save = completeDateSession(coveredDate.save, coveredDate.session.id).save;
    const coveredShift = completeShift(save, new Date("2026-05-05T13:00:00.000Z"));

    expect(coveredDate.session.focusRequestId).toBe("request-sana-decompress");
    expect(coveredShift.report.ignoredRequestIds).toEqual([]);
  });

  it("applies follow-up actions and scores a shift report", () => {
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
      "vhool",
    ]);
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
    });
    save = completeDateSession(started.save, started.session.id).save;
    save = applyFollowUpAction(save, {
      dateSessionId: started.session.id,
      action: "repair",
    }).save;
    const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);

    if (activeShift === undefined) {
      throw new Error("Expected an active shift for live goal metrics.");
    }

    const liveMetrics = buildShiftGoalMetrics({
      shift: activeShift,
      dateSessions: save.dateSessions,
      members: save.members,
    });

    expect(liveMetrics.completedDates).toBe(1);
    expect(liveMetrics.earlyEndedDates).toBe(0);

    const completedShift = completeShift(save, new Date("2026-05-05T13:00:00.000Z"));

    expect(completedShift.report.completedDates).toBe(1);
    expect(completedShift.report.goalResults).toHaveLength(2);
    expect(completedShift.save.shifts[0].status).toBe("completed");
  });

  it("opens the next shift without wiping completed campaign state", () => {
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
      "vhool",
    ]);
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
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
    expect(nextShift.shift.featuredMemberIds).toHaveLength(SHIFT_FEATURED_MEMBER_COUNT);
    expect(
      nextShift.shift.memberRequestIds.every((requestId) => {
        const request = memberRequests.find((candidate) => candidate.id === requestId);
        return (
          request !== undefined && nextShift.shift.featuredMemberIds.includes(request.memberId)
        );
      }),
    ).toBe(true);
    expect(nextShift.shift.drawnScenarioIds).toHaveLength(3);
    expect(nextShift.save.activeShiftId).toBe(nextShift.shift.id);
    expect(nextShift.save.shifts).toHaveLength(2);
    expect(nextShift.save.shifts[0].status).toBe("completed");
    expect(nextShift.save.shifts[0].report).toBeDefined();
    expect(completedDate?.finalReport?.appliedFollowUp).toBe("repair");
  });

  it("enforces active date, scenario hand, shift ending, and follow-up invariants", () => {
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
      "vhool",
    ]);
    expect(() => startNextShift(save)).toThrow("File the active shift");

    const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);
    const unfeaturedMember = save.members.find(
      (member) => activeShift?.featuredMemberIds.includes(member.id) !== true,
    );

    if (activeShift === undefined || unfeaturedMember === undefined) {
      throw new Error("Expected an active shift with an unfeatured member.");
    }

    expect(() =>
      startDateSession(save, {
        focusMemberId: unfeaturedMember.id,
        firstMemberId: unfeaturedMember.id,
        secondMemberId: activeShift.featuredMemberIds[0] ?? "jenna-pike",
        scenarioId: activeShift.drawnScenarioIds[0] ?? "temporal-coffee-shop",
      }),
    ).toThrow("not one of today's cases");

    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
    });

    expect(() =>
      startDateSession(started.save, {
        focusMemberId: "opal-sunday",
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
        focusMemberId: "opal-sunday",
        firstMemberId: "opal-sunday",
        secondMemberId: "gideon-glass",
        scenarioId: "memory-course-dinner",
      }),
    ).toThrow("not in today's drawn hand");
  });

  it("carries repeated scenario history into the next date transcript", () => {
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
      "vhool",
    ]);
    const firstDate = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
    });
    save = completeDateSession(firstDate.save, firstDate.session.id).save;
    const secondDate = startDateSession(save, {
      focusMemberId: "jenna-pike",
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

function createPreGameplayTagSave(now: Date): Record<string, unknown> {
  const save = createSeedGameSave(now);

  return {
    ...save,
    members: save.members.map(toPreGameplayTagMember),
    shifts: save.shifts.map(toPreFeaturedShift),
  };
}

function toPreGameplayTagMember(member: Member): Record<string, unknown> {
  return {
    id: member.id,
    name: member.name,
    origin: member.origin,
    species: member.species,
    dimension: member.dimension,
    realityStatus: member.realityStatus,
    bio: member.bio,
    datingProfile: member.datingProfile,
    traits: ["legacy trait"],
    relationshipNeeds: member.relationshipNeeds,
    redFlags: ["legacy red flag"],
    preferences: member.preferences,
    dealbreakers: member.dealbreakers,
    secrets: member.secrets,
    tags: ["legacy_tag", `${member.id}_legacy`],
    voice: member.voice,
    state: {
      ...member.state,
      mood: member.id === "jenna-pike" ? 11 : member.state.mood,
    },
    portraits: member.portraits,
  };
}

function toPreFeaturedShift(shift: GameSave["shifts"][number]): Record<string, unknown> {
  return {
    id: shift.id,
    shiftNumber: shift.shiftNumber,
    status: shift.status,
    dateSlotsTotal: shift.dateSlotsTotal,
    dateSlotsUsed: shift.dateSlotsUsed,
    drawnScenarioIds: shift.drawnScenarioIds,
    companyGoalIds: shift.companyGoalIds,
    memberRequestIds: shift.memberRequestIds,
    scenarioDeck: shift.scenarioDeck,
    startedAt: shift.startedAt,
    ...(shift.completedAt === undefined ? {} : { completedAt: shift.completedAt }),
    ...(shift.report === undefined ? {} : { report: shift.report }),
  };
}

function evaluateFixtureFit(
  save: GameSave,
  input: {
    firstMemberId: string;
    secondMemberId: string;
    scenarioId: string;
    requestIds?: string[];
  },
) {
  const firstMember = findMember(save, input.firstMemberId);
  const secondMember = findMember(save, input.secondMemberId);
  const scenario = findScenario(input.scenarioId);
  const pairState = findPairState(save, makePairId(firstMember.id, secondMember.id));
  const activeRequests =
    input.requestIds === undefined
      ? []
      : memberRequests.filter((request) => input.requestIds?.includes(request.id) === true);

  return evaluateMatchFit({
    members: [firstMember, secondMember],
    scenario,
    pairState,
    activeRequests,
  });
}

function memberPortraitAssets(member: Member): PortraitAsset[] {
  const variantAssets = OPTIONAL_PORTRAIT_VARIANTS.flatMap((variant) => {
    const asset = member.portraits[variant]?.portrait;
    return asset === undefined ? [] : [asset];
  });

  return [member.portraits.neutral.portrait, member.portraits.neutral.avatar, ...variantAssets];
}

function withActiveShiftConfig(
  save: GameSave,
  input: {
    drawnScenarioIds: string[];
    memberRequestIds: string[];
    featuredMemberIds?: string[];
  },
): GameSave {
  const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);

  if (activeShift === undefined) {
    throw new Error("Expected an active shift.");
  }

  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    featuredMemberIds: buildFeaturedMemberIds(save, input.featuredMemberIds),
    drawnScenarioIds: input.drawnScenarioIds,
    memberRequestIds: input.memberRequestIds,
  });

  return gameSaveSchema.parse({
    ...save,
    shifts: save.shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
  });
}

function withCompanyGoals(save: GameSave, goalIds: string[]): GameSave {
  const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);

  if (activeShift === undefined) {
    throw new Error("Expected an active shift.");
  }

  const updatedShift = shiftStateSchema.parse({
    ...activeShift,
    companyGoalIds: goalIds,
  });

  return gameSaveSchema.parse({
    ...save,
    shifts: save.shifts.map((shift) => (shift.id === updatedShift.id ? updatedShift : shift)),
  });
}

function withMemberRetention(save: GameSave, memberId: string, retention: number): GameSave {
  return gameSaveSchema.parse({
    ...save,
    members: save.members.map((member) =>
      member.id === memberId
        ? {
            ...member,
            state: {
              ...member.state,
              retention,
            },
          }
        : member,
    ),
  });
}

function findMember(save: GameSave, memberId: string): Member {
  const member = save.members.find((candidate) => candidate.id === memberId);

  if (member === undefined) {
    throw new Error(`Expected member ${memberId}.`);
  }

  return member;
}

function findScenario(scenarioId: string): DateScenario {
  const scenario = starterScenarios.find((candidate) => candidate.id === scenarioId);

  if (scenario === undefined) {
    throw new Error(`Expected scenario ${scenarioId}.`);
  }

  return scenario;
}

function findPairState(save: GameSave, pairId: string): PairState {
  const pairState = save.pairStates.find((candidate) => candidate.id === pairId);

  if (pairState === undefined) {
    throw new Error(`Expected pair state ${pairId}.`);
  }

  return pairState;
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
