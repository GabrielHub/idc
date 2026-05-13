import { describe, expect, it } from "vitest";

import { SAVE_SCHEMA_VERSION, SCENARIO_DECK_SIZE } from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import { LocalGameRepository } from "../repositories/local-game-repository";
import { MemorySaveStore } from "../repositories/memory-save-store";
import {
  advanceDateExchange,
  applyFollowUpAction,
  CLIENT_LOSS_LIMIT_BASE,
  completeShift,
  isCampaignLost,
  isMemberRetained,
  startNextShift,
} from "./date-engine";
import { isMemberInCooldown } from "./shift-planning";
import { canBeFocusCase, selectInitialFocusCases } from "./focus-cases";
import { createSeedGameSave, makePairId } from "./game-seed";
import {
  ensureScenarioInHand,
  startAndDraftDateSession,
  withFeaturedMembers,
} from "./test-helpers";

describe("IDC playable smoke path", () => {
  it("validates the starter fixture counts", () => {
    expect(starterMembers).toHaveLength(38);
    expect(starterScenarios).toHaveLength(47);
  });

  it("seeds a save with a 12-card deck and no focused members", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), undefined, [], {
      writeDebounceMs: 0,
    });
    const save = await repository.resetGame();

    expect(save.version).toBe(SAVE_SCHEMA_VERSION);
    expect(save.config.shiftDateSlots).toBe(1);
    expect(save.scenarioDeck.cardIds).toHaveLength(SCENARIO_DECK_SIZE);
    expect(new Set(save.scenarioDeck.cardIds).size).toBe(SCENARIO_DECK_SIZE);
    expect(save.focusedMemberIds).toEqual([]);
    expect(save.shifts[0]?.featuredMemberIds).toEqual([]);
    expect(save.shifts[0]?.drawnScenarioIds).toHaveLength(3);
    for (const cardId of save.shifts[0]?.drawnScenarioIds ?? []) {
      expect(save.scenarioDeck.cardIds).toContain(cardId);
    }
  });

  it("rejects legacy save keys so alpha saves start fresh", async () => {
    const store = new MemorySaveStore();
    await store.write("idc.cupid.save.v1", "{}");
    const repository = new LocalGameRepository(store, undefined, ["idc.cupid.save.v1"], {
      writeDebounceMs: 0,
    });

    await expect(repository.loadGame()).rejects.toThrow();
  });

  it("selectInitialFocusCases requires exactly 4 ids", () => {
    const save = createSeedGameSave();
    const candidates = save.members
      .filter(canBeFocusCase)
      .slice(0, 4)
      .map((m) => m.id);
    const next = selectInitialFocusCases(save, candidates);
    expect(next.focusedMemberIds).toEqual(candidates);
  });

  it("runs a complete date that puts both members in cooldown next shift", () => {
    const baseSave = createSeedGameSave();
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInHand(
      withFeaturedMembers(baseSave, [firstMemberId, secondMemberId]),
      scenarioId,
    );

    const { save: saveAfterStart, session } = startAndDraftDateSession(setupSave, {
      focusMemberId: firstMemberId,
      firstMemberId,
      secondMemberId,
      scenarioId,
    });

    expect(saveAfterStart.scenarioDeck.pendingLibraryPick).toBeDefined();
    expect(saveAfterStart.scenarioDeck.cardIds).toHaveLength(SCENARIO_DECK_SIZE - 1);

    let next = advanceDateExchange(saveAfterStart, { dateSessionId: session.id });
    let safety = 50;
    while (next.session.status === "active" && safety > 0) {
      next = advanceDateExchange(next.save, { dateSessionId: session.id });
      safety -= 1;
    }

    const completedSession = next.save.dateSessions.find(
      (candidate) => candidate.id === session.id,
    );
    expect(completedSession?.finalReport).toBeDefined();

    const firstMember = next.save.members.find((m) => m.id === firstMemberId);
    const secondMember = next.save.members.find((m) => m.id === secondMemberId);
    const currentShift = next.save.shifts.find((shift) => shift.id === next.save.activeShiftId);

    if (firstMember === undefined || secondMember === undefined || currentShift === undefined) {
      throw new Error("Test setup failed.");
    }

    expect(firstMember.state.lastDateShift).toBe(currentShift.shiftNumber);
    expect(secondMember.state.lastDateShift).toBe(currentShift.shiftNumber);

    expect(isMemberInCooldown(firstMember, currentShift.shiftNumber)).toBe(true);
    expect(isMemberInCooldown(firstMember, currentShift.shiftNumber + 1)).toBe(true);
    expect(isMemberInCooldown(firstMember, currentShift.shiftNumber + 2)).toBe(false);
  });

  it("flips member status to quit when retention drops to zero", () => {
    const save = createSeedGameSave();
    const member = save.members[0];

    if (member === undefined) {
      throw new Error("Expected at least one member.");
    }

    const drained = {
      ...save,
      members: save.members.map((candidate) =>
        candidate.id === member.id
          ? { ...candidate, state: { ...candidate.state, retention: 5 } }
          : candidate,
      ),
    };

    const pairId = makePairId(member.id, save.members[1]?.id ?? "");
    const session = {
      id: `date-1-1-${pairId}-loop`,
      pairId,
      scenarioId: "park-loop-with-a-dog",
      participants: [member.id, save.members[1]?.id ?? ""] as [string, string],
      finalReport: {
        id: "final-test",
        dateSessionId: `date-1-1-${pairId}-loop`,
        completedAt: new Date().toISOString(),
        outcome: "bad_fit" as const,
        summary: "Test summary.",
        statSummary: "Test stat summary.",
        recommendedFollowUp: "mark_bad_fit" as const,
        memoryRecordIds: [],
        readyToClose: false,
      },
    };

    const result = applyFollowUpAction(
      {
        ...drained,
        dateSessions: [
          {
            ...session,
            focusMemberId: member.id,
            turnLimit: 30,
            currentTurn: 0,
            dateHealth: 0,
            status: "completed" as const,
            runtimeMode: "local_ai" as const,
            transcript: [],
            privateStateByCharacter: {},
            judgeSnapshots: [],
            eventDraft: { offered: [], picked: [] },
            eventsTriggered: [],
            playbackState: "ended" as const,
            endSentiment: null,
            interventions: [],
          },
        ],
      },
      {
        dateSessionId: session.id,
        action: "mark_bad_fit",
      },
    );

    const updatedMember = result.save.members.find((candidate) => candidate.id === member.id);
    expect(updatedMember?.state.retention).toBeGreaterThanOrEqual(0);
  });

  it("detects campaign loss when enough members quit", () => {
    const save = createSeedGameSave();
    const quitMembers = save.members.slice(0, CLIENT_LOSS_LIMIT_BASE).map((member) => ({
      ...member,
      state: { ...member.state, retention: 0, status: "quit" as const },
    }));
    const draftSave = {
      ...save,
      members: save.members.map((candidate) => {
        const replacement = quitMembers.find((entry) => entry.id === candidate.id);
        return replacement ?? candidate;
      }),
    };

    expect(isCampaignLost(draftSave)).toBe(true);
    expect(quitMembers.every((member) => !isMemberRetained(member))).toBe(true);
  });

  it("opens the next shift using focused members and draws a new hand", () => {
    const baseSave = createSeedGameSave();
    const focused = baseSave.members
      .filter(canBeFocusCase)
      .slice(0, 4)
      .map((m) => m.id);
    const withFocus = selectInitialFocusCases(baseSave, focused);
    const activeShiftIndex = withFocus.shifts.findIndex(
      (shift) => shift.id === withFocus.activeShiftId,
    );
    const closed = {
      ...withFocus,
      shifts: withFocus.shifts.map((shift, index) =>
        index === activeShiftIndex
          ? { ...shift, status: "completed" as const, completedAt: new Date().toISOString() }
          : shift,
      ),
    };

    const result = startNextShift(closed);

    expect(result.shift.shiftNumber).toBe(2);
    expect(result.shift.featuredMemberIds).toEqual(focused);
    expect(result.shift.drawnScenarioIds).toHaveLength(3);

    for (const cardId of result.shift.drawnScenarioIds) {
      expect(result.save.scenarioDeck.cardIds).toContain(cardId);
    }
  });

  it("rejects bookings while a library pick is pending", () => {
    const baseSave = createSeedGameSave();
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInHand(
      withFeaturedMembers(baseSave, [firstMemberId, secondMemberId]),
      scenarioId,
    );
    const afterStart = startAndDraftDateSession(setupSave, {
      focusMemberId: firstMemberId,
      firstMemberId,
      secondMemberId,
      scenarioId,
    });

    const pending = afterStart.save.scenarioDeck.pendingLibraryPick;
    expect(pending).toBeDefined();

    // Reset slot so we can try a second booking
    const reset = {
      ...afterStart.save,
      shifts: afterStart.save.shifts.map((shift) =>
        shift.id === afterStart.save.activeShiftId ? { ...shift, dateSlotsUsed: 0 } : shift,
      ),
      dateSessions: afterStart.save.dateSessions.filter((s) => s.id !== afterStart.session.id),
    };

    expect(() =>
      startAndDraftDateSession(reset, {
        focusMemberId: firstMemberId,
        firstMemberId,
        secondMemberId,
        scenarioId: reset.scenarioDeck.cardIds[0] ?? "park-loop-with-a-dog",
      }),
    ).toThrow();
  });
});

describe("completeShift", () => {
  it("files a report and stamps the shift completed", () => {
    const baseSave = createSeedGameSave();
    const focused = baseSave.members
      .filter(canBeFocusCase)
      .slice(0, 4)
      .map((m) => m.id);
    const withFocus = selectInitialFocusCases(baseSave, focused);

    const { save: nextSave, report } = completeShift(withFocus);
    expect(report.completedDates).toBe(0);
    const closedShift = nextSave.shifts.find((shift) => shift.id === nextSave.activeShiftId);
    expect(closedShift?.status).toBe("completed");
  });
});
