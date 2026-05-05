import { describe, expect, it } from "vitest";

import { memoryRecordSchema } from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import { LocalGameRepository, MemoryStorageDriver } from "../repositories/local-game-repository";
import { searchCupidMemory } from "./cupid-memory";
import {
  addCupidIntervention,
  advanceDateExchange,
  applyFollowUpAction,
  completeDateSession,
  completeShift,
  startDateSession,
} from "./date-engine";
import { createSeedGameSave, makePairId } from "./game-seed";
import { createDeterministicEmbedding } from "./vector-memory";

describe("IDC playable smoke path", () => {
  it("validates the starter fixture counts", () => {
    expect(starterMembers).toHaveLength(6);
    expect(starterScenarios).toHaveLength(6);
    expect(
      starterMembers.every((member) => member.portraits.neutral.avatar.cutoutPath.length > 0),
    ).toBe(true);
  });

  it("seeds and persists canonical game state through the repository", async () => {
    const repository = new LocalGameRepository(new MemoryStorageDriver(), "test-save");
    const save = await repository.resetGame(new Date("2026-05-05T12:00:00.000Z"));
    const loaded = await repository.loadGame();

    expect(loaded?.activeShiftId).toBe(save.activeShiftId);
    expect(await repository.listMembers()).toHaveLength(6);
    expect(await repository.listPairStates()).toHaveLength(15);
    expect(await repository.getActiveShift()).not.toBeNull();
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

  it("enforces active date, scenario hand, shift ending, and follow-up invariants", () => {
    let save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
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
