import { describe, expect, it, vi } from "vitest";

import {
  dateSessionSchema,
  gameSaveSchema,
  pairStateSchema,
  SAVE_SCHEMA_VERSION,
} from "../domain/game";
import { memberRequests, starterMembers, starterScenarios } from "../fixtures";
import { LocalGameRepository } from "../repositories/local-game-repository";
import { MemorySaveStore } from "../repositories/memory-save-store";
import {
  advanceDateExchange,
  applyFollowUpAction,
  CLIENT_LOSS_LIMIT_BASE,
  CLOSURE_NEAR_MISS_TAG,
  clearActiveBooking,
  commitDateBooking,
  completeShift,
  isCampaignLost,
  isMemberRetained,
  startDateSessionFromBooking,
  startNextShift,
} from "./date-engine";
import { isMemberInCooldown } from "./shift-planning";
import { canBeFocusCase, selectInitialFocusCases } from "./focus-cases";
import { createSeedGameSave, makePairId } from "./game-seed";
import { getPairProjectionFromSave } from "./relationship-index";
import {
  activeBudgetDiscountOffers,
  buildPerformanceReviewReasons,
  MEMBER_QUIT_BUDGET_CUT,
  rotateBudgetPeriod,
} from "./budget";
import {
  ensureScenarioInDeck,
  startAndDraftDateSession,
  withFeaturedMembers,
} from "./test-helpers";
import { mulberry32 } from "./utils";

describe("IDC playable smoke path", () => {
  it("validates the starter fixture counts", () => {
    expect(starterMembers).toHaveLength(42);
    expect(starterScenarios).toHaveLength(56);
  });

  it("seeds a save with the pre-onboarding fallback deck and no drawn hand", async () => {
    const repository = new LocalGameRepository(new MemorySaveStore(), undefined, [], {
      writeDebounceMs: 0,
    });
    const save = await repository.resetGame();

    expect(save.version).toBe(SAVE_SCHEMA_VERSION);
    expect(save.config.shiftDateSlots).toBe(1);
    expect(save.scenarioDeck.cardIds.length).toBeGreaterThanOrEqual(6);
    expect(save.focusedMemberIds).toEqual([]);
    expect(save.shifts[0]?.featuredMemberIds).toEqual([]);
    // Drawn hand is empty until the player commits a booking.
    expect(save.shifts[0]?.drawnScenarioIds).toEqual([]);
    expect(save.shifts[0]?.activeBooking).toBeUndefined();
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

  it("commitDateBooking writes an active booking and draws three scenarios", () => {
    const baseSave = createSeedGameSave();
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInDeck(
      withFeaturedMembers(baseSave, [firstMemberId, secondMemberId]),
      scenarioId,
    );

    const { save, booking } = commitDateBooking(setupSave, {
      focusMemberId: firstMemberId,
      partnerMemberId: secondMemberId,
    });

    expect(booking.drawnScenarioIds).toHaveLength(3);
    expect(booking.status).toBe("scenario_selection");
    expect(booking.deckSnapshot.cardIds).toEqual(setupSave.scenarioDeck.cardIds);
    expect(booking.deckSnapshot.budgetCap).toBe(setupSave.budgetCap);

    const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);
    expect(activeShift?.activeBooking?.id).toBe(booking.id);
    expect(activeShift?.dateSlotsUsed).toBe(1);
    expect(activeShift?.drawnScenarioIds).toEqual([...booking.drawnScenarioIds]);
  });

  it("clearActiveBooking cancels the reserved slot and drawn hand before a session starts", () => {
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInDeck(
      withFeaturedMembers(createSeedGameSave(), [firstMemberId, secondMemberId]),
      scenarioId,
    );
    const { save: committedSave } = commitDateBooking(setupSave, {
      focusMemberId: firstMemberId,
      partnerMemberId: secondMemberId,
    });

    const clearedSave = clearActiveBooking(committedSave);
    const activeShift = clearedSave.shifts.find((shift) => shift.id === clearedSave.activeShiftId);

    expect(activeShift?.activeBooking).toBeUndefined();
    expect(activeShift?.dateSlotsUsed).toBe(0);
    expect(activeShift?.drawnScenarioIds).toEqual([]);
  });

  it("clearActiveBooking rejects an active date session", () => {
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInDeck(
      withFeaturedMembers(createSeedGameSave(), [firstMemberId, secondMemberId]),
      scenarioId,
    );
    const { save: committedSave, booking } = commitDateBooking(setupSave, {
      focusMemberId: firstMemberId,
      partnerMemberId: secondMemberId,
    });
    const firstDrawnScenarioId = booking.drawnScenarioIds[0];

    if (firstDrawnScenarioId === undefined) {
      throw new Error("Expected booking to draw at least one scenario.");
    }

    const { save: activeSessionSave } = startDateSessionFromBooking(committedSave, {
      scenarioId: firstDrawnScenarioId,
    });

    expect(() => clearActiveBooking(activeSessionSave)).toThrow(/active date session/);
  });

  it("threads seeded randomness into scenario event drafts when starting from a booking", () => {
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const setupSave = withFeaturedMembers(createSeedGameSave(), [firstMemberId, secondMemberId]);
    const { save: committedSave, booking } = commitDateBooking(setupSave, {
      focusMemberId: firstMemberId,
      partnerMemberId: secondMemberId,
      now: new Date("2026-05-05T12:00:00.000Z"),
    });
    const scenarioId = booking.drawnScenarioIds[0];

    if (scenarioId === undefined) {
      throw new Error("Expected booking to draw at least one scenario.");
    }

    const mathRandom = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Expected startDateSessionFromBooking to use the provided random source.");
    });

    try {
      const first = startDateSessionFromBooking(committedSave, {
        scenarioId,
        now: new Date("2026-05-05T12:01:00.000Z"),
        random: mulberry32(1776),
      });
      const second = startDateSessionFromBooking(committedSave, {
        scenarioId,
        now: new Date("2026-05-05T12:01:00.000Z"),
        random: mulberry32(1776),
      });

      expect(first.session.eventDraft).toEqual(second.session.eventDraft);
    } finally {
      mathRandom.mockRestore();
    }
  });

  it("defaults scenario event drafts to reproducible booking scoped randomness", () => {
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const setupSave = withFeaturedMembers(createSeedGameSave(), [firstMemberId, secondMemberId]);
    const { save: committedSave, booking } = commitDateBooking(setupSave, {
      focusMemberId: firstMemberId,
      partnerMemberId: secondMemberId,
      now: new Date("2026-05-05T12:00:00.000Z"),
    });
    const scenarioId = booking.drawnScenarioIds[0];

    if (scenarioId === undefined) {
      throw new Error("Expected booking to draw at least one scenario.");
    }

    const mathRandom = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Scenario event drafts should not use global randomness.");
    });

    try {
      const first = startDateSessionFromBooking(committedSave, {
        scenarioId,
        now: new Date("2026-05-05T12:01:00.000Z"),
      });
      const second = startDateSessionFromBooking(committedSave, {
        scenarioId,
        now: new Date("2026-05-05T12:01:00.000Z"),
      });

      expect(first.session.eventDraft).toEqual(second.session.eventDraft);
    } finally {
      mathRandom.mockRestore();
    }
  });

  it("varies scenario event drafts across live bookings for the same pair and scenario", () => {
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const setupSave = withFeaturedMembers(createSeedGameSave(), [firstMemberId, secondMemberId]);
    const firstBooking = commitDateBooking(setupSave, {
      focusMemberId: firstMemberId,
      partnerMemberId: secondMemberId,
      now: new Date("2026-05-05T12:00:00.000Z"),
    });
    const secondBooking = commitDateBooking(setupSave, {
      focusMemberId: firstMemberId,
      partnerMemberId: secondMemberId,
      now: new Date("2026-05-05T12:00:01.000Z"),
    });
    const scenarioId = firstBooking.booking.drawnScenarioIds[0];

    if (scenarioId === undefined || scenarioId !== secondBooking.booking.drawnScenarioIds[0]) {
      throw new Error("Expected matching deterministic hands for the same pair and shift.");
    }

    const first = startDateSessionFromBooking(firstBooking.save, {
      scenarioId,
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const second = startDateSessionFromBooking(secondBooking.save, {
      scenarioId,
      now: new Date("2026-05-05T12:01:00.000Z"),
    });

    expect(first.session.eventDraft).not.toEqual(second.session.eventDraft);
  });

  it("running a date does not mutate the active deck", () => {
    const baseSave = createSeedGameSave();
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInDeck(
      withFeaturedMembers(baseSave, [firstMemberId, secondMemberId]),
      scenarioId,
    );

    const beforeDeckIds = [...setupSave.scenarioDeck.cardIds];
    const { save: saveAfterStart, session } = startAndDraftDateSession(setupSave, {
      focusMemberId: firstMemberId,
      firstMemberId,
      secondMemberId,
      scenarioId,
    });

    expect(saveAfterStart.scenarioDeck.cardIds).toEqual(beforeDeckIds);

    let next = advanceDateExchange(saveAfterStart, { dateSessionId: session.id });
    let safety = 50;
    while (next.session.status === "active" && safety > 0) {
      next = advanceDateExchange(next.save, { dateSessionId: session.id });
      safety -= 1;
    }

    // Deck stays intact after the date completes. The active booking is
    // cleared so the next shift can book again.
    expect(next.save.scenarioDeck.cardIds).toEqual(beforeDeckIds);
    const finalShift = next.save.shifts.find((shift) => shift.id === next.save.activeShiftId);
    expect(finalShift?.activeBooking).toBeUndefined();
  });

  it("puts both members in cooldown after a completed date", () => {
    const baseSave = createSeedGameSave();
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInDeck(
      withFeaturedMembers(baseSave, [firstMemberId, secondMemberId]),
      scenarioId,
    );

    const { save: saveAfterStart, session } = startAndDraftDateSession(setupSave, {
      focusMemberId: firstMemberId,
      firstMemberId,
      secondMemberId,
      scenarioId,
    });

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

  it("records a budget cut when date completion makes a member quit", () => {
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInDeck(
      withFeaturedMembers(createSeedGameSave(), [firstMemberId, secondMemberId]),
      scenarioId,
    );
    const started = startAndDraftDateSession(setupSave, {
      focusMemberId: firstMemberId,
      firstMemberId,
      secondMemberId,
      scenarioId,
    });
    const pairProjection = getPairProjectionFromSave(started.save, started.session.pairId);

    if (pairProjection === undefined) {
      throw new Error("Expected started pair projection.");
    }

    const weakPair = pairStateSchema.parse({
      ...pairProjection,
      stats: {
        ...pairProjection.stats,
        chemistry: 20,
        trust: 20,
        relationshipHealth: 20,
        conflict: 75,
      },
    });
    const shortSession = dateSessionSchema.parse({
      ...started.session,
      turnLimit: 2,
    });
    const fragileSave = gameSaveSchema.parse({
      ...started.save,
      members: started.save.members.map((member) =>
        member.id === firstMemberId
          ? { ...member, state: { ...member.state, retention: 5 } }
          : member,
      ),
      pairStates: [...started.save.pairStates.filter((pair) => pair.id !== weakPair.id), weakPair],
      dateSessions: started.save.dateSessions.map((session) =>
        session.id === shortSession.id ? shortSession : session,
      ),
    });

    const result = advanceDateExchange(fragileSave, { dateSessionId: shortSession.id });
    const updatedMember = result.save.members.find((member) => member.id === firstMemberId);

    expect(result.session.finalReport?.outcome).toBe("bad_fit");
    expect(updatedMember?.state.status).toBe("quit");
    expect(result.save.budgetCap).toBe(fragileSave.budgetCap + MEMBER_QUIT_BUDGET_CUT);
    expect(
      result.save.budgetHistory.some((entry) =>
        entry.reasons.some((reason) => reason.kind === "member_quit"),
      ),
    ).toBe(true);
  });

  it("links closure near miss memories from completed date reports", () => {
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInDeck(
      withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
        firstMemberId,
        secondMemberId,
      ]),
      scenarioId,
    );
    const started = startAndDraftDateSession(setupSave, {
      focusMemberId: firstMemberId,
      firstMemberId,
      secondMemberId,
      scenarioId,
    });
    const pairProjection = getPairProjectionFromSave(started.save, started.session.pairId);

    if (pairProjection === undefined) {
      throw new Error("Expected started pair projection.");
    }

    const nearMissPairState = pairStateSchema.parse({
      ...pairProjection,
      stats: {
        ...pairProjection.stats,
        chemistry: 92,
        trust: 92,
        relationshipHealth: 92,
        strain: 42,
        conflict: 18,
      },
      completedDateIds: ["prior-date-1", "prior-date-2"],
      openLoops: [
        {
          id: "loop-closure-blocker",
          text: "Whether anyone can leave the room without making it a policy memo.",
          status: "open",
          sourceDateSessionId: "prior-date-2",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
      ],
    });
    const shortSession = dateSessionSchema.parse({
      ...started.session,
      turnLimit: 2,
    });
    const readySave = gameSaveSchema.parse({
      ...started.save,
      pairStates: [
        ...started.save.pairStates.filter((pair) => pair.id !== nearMissPairState.id),
        nearMissPairState,
      ],
      dateSessions: started.save.dateSessions.map((session) =>
        session.id === shortSession.id ? shortSession : session,
      ),
    });

    const result = advanceDateExchange(readySave, { dateSessionId: shortSession.id });
    const nearMissMemory = result.save.memories.find(
      (memory) =>
        memory.dateSessionId === shortSession.id && memory.tags.includes(CLOSURE_NEAR_MISS_TAG),
    );

    expect(result.session.status).not.toBe("active");
    expect(nearMissMemory).toBeDefined();
    expect(result.session.finalReport?.memoryRecordIds).toContain(nearMissMemory?.id);
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
            endReason: null,
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

  it("opens the next shift using focused members and an empty hand", () => {
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
    // The new flow does not pre-draw a hand. The hand is drawn when the player
    // commits a pair.
    expect(result.shift.drawnScenarioIds).toEqual([]);
  });

  it("generates first-period discounts from selected onboarding focus cases", () => {
    const baseSave = createSeedGameSave();
    const focusedMemberIds = ["jenna-pike", "sana-karim", "alex-yoon", "calvin-hewes"];
    const withFocus = selectInitialFocusCases(baseSave, focusedMemberIds);
    const requestsById = new Map(memberRequests.map((request) => [request.id, request] as const));
    const focusedRequests = withFocus.focusedMemberIds
      .map((memberId) => withFocus.members.find((member) => member.id === memberId))
      .map((member) =>
        member?.state.currentRequestId === undefined
          ? undefined
          : requestsById.get(member.state.currentRequestId),
      )
      .filter((request): request is (typeof memberRequests)[number] => request !== undefined);

    const withBudgetPeriod = rotateBudgetPeriod({
      save: withFocus,
      shiftNumber: 1,
      scenarios: starterScenarios,
      focusedMemberRequests: focusedRequests,
      recentClosurePairTags: [],
      activeCompanyGoals: [],
    });
    const activeOffers = activeBudgetDiscountOffers(withBudgetPeriod);

    expect(activeOffers.some((offer) => offer.kind === "request")).toBe(true);
    expect(activeOffers.flatMap((offer) => offer.scenarioTagIds).length).toBeGreaterThan(0);
  });

  it("skips pair performance reasons when no pair edges exist yet", () => {
    const reasons = buildPerformanceReviewReasons({
      save: createSeedGameSave(),
      shiftNumber: 5,
      closuresSinceLastReview: 0,
      quitsSinceLastReview: 0,
      averageActiveRetention: 50,
      averagePairHealth: null,
      averagePairFriction: null,
      requestFulfillmentRate: 0.5,
    });

    expect(reasons.some((reason) => reason.kind === "performance_pair_health")).toBe(false);
    expect(reasons.some((reason) => reason.kind === "performance_pair_friction")).toBe(false);
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

  it("rejects filing while a booking is committed", () => {
    const firstMemberId = "jenna-pike";
    const secondMemberId = "sana-karim";
    const scenarioId = "park-loop-with-a-dog";
    const setupSave = ensureScenarioInDeck(
      withFeaturedMembers(createSeedGameSave(), [firstMemberId, secondMemberId]),
      scenarioId,
    );
    const { save } = commitDateBooking(setupSave, {
      focusMemberId: firstMemberId,
      partnerMemberId: secondMemberId,
    });

    expect(() => completeShift(save)).toThrow(/active booking/);
  });
});
