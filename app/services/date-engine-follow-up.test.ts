import { describe, expect, it } from "vitest";

import {
  dateSessionSchema,
  followUpActionSchema,
  gameSaveSchema,
  pairStateSchema,
  type DateFinalReport,
  type FollowUpAction,
} from "../domain/game";
import {
  applyFollowUpAction,
  applyFollowUpActionAndMaybeCompleteShift,
  commitDateBooking,
  completeShift,
  pendingFollowUpSessionsForShift,
  previewFollowUpEffects,
  shouldAutoCompleteShift,
  startNextShift,
} from "./date-engine";
import { MEMBER_QUIT_BUDGET_CUT } from "./budget";
import {
  createSeedGameSave,
  getActiveShift,
  hydrateFixtureOwnedMemberData,
  makePairId,
} from "./game-seed";
import { selectShiftPartnerMemberIds } from "./shift-availability";

const OUTCOMES: readonly DateFinalReport["outcome"][] = [
  "second_date",
  "mixed",
  "cool_down",
  "bad_fit",
  "early_end",
];
const ACTIONS: readonly FollowUpAction[] = followUpActionSchema.options;
const JENNA_VHOOL_PAIR_ID = makePairId("jenna-pike", "vhool");

function buildPairState() {
  return pairStateSchema.parse({
    id: JENNA_VHOOL_PAIR_ID,
    participantIds: ["jenna-pike", "vhool"],
    stats: {
      chemistry: 50,
      trust: 52,
      stability: 50,
      conflict: 35,
      weirdnessTolerance: 55,
      spark: 48,
      strain: 42,
      relationshipHealth: 50,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [
      {
        id: "agreement-1",
        text: "No public archive questions.",
        status: "broken",
        createdAt: "2026-05-05T11:00:00.000Z",
        resolvedAt: "2026-05-05T12:00:00.000Z",
      },
    ],
    openLoops: [
      {
        id: "loop-1",
        text: "Whether Vhool can leave without auditing the receipt.",
        status: "open",
        createdAt: "2026-05-05T11:00:00.000Z",
      },
    ],
  });
}

function buildSession(outcome?: DateFinalReport["outcome"]) {
  return dateSessionSchema.parse({
    id: "date-session-follow-up",
    pairId: JENNA_VHOOL_PAIR_ID,
    scenarioId: "temporal-coffee-shop",
    turnLimit: 24,
    currentTurn: 4,
    dateHealth: 55,
    status: outcome === "early_end" ? "ended_early" : "completed",
    runtimeMode: "local_ai",
    participants: ["jenna-pike", "vhool"],
    transcript: [],
    privateStateByCharacter: {},
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: null,
    interventions: [],
    finalReport:
      outcome === undefined
        ? undefined
        : {
            id: "final-follow-up",
            dateSessionId: "date-session-follow-up",
            completedAt: "2026-05-05T12:30:00.000Z",
            outcome,
            summary: "Cupid filed a follow-up test.",
            statSummary: "Case read: follow-up test.",
            recommendedFollowUp: "pursue",
            memoryRecordIds: [],
            readyToClose: false,
          },
  });
}

describe("outcome aware follow-up preview", () => {
  it.each(OUTCOMES.flatMap((outcome) => ACTIONS.map((action) => ({ outcome, action }))))(
    "previews $action after $outcome",
    ({ outcome, action }) => {
      const preview = previewFollowUpEffects(buildPairState(), buildSession(outcome), action);

      expect(preview.outcome).toBe(outcome);
      expect(preview.action).toBe(action);
      expect(preview.reasons).toContain(`outcome:${outcome}`);
      expect(Object.values(preview.nextStats).every((score) => score >= 0 && score <= 100)).toBe(
        true,
      );
    },
  );

  it("rejects follow-up previews before a final outcome exists", () => {
    expect(() => previewFollowUpEffects(buildPairState(), buildSession(), "pursue")).toThrow(
      "Follow-up actions require a completed date report.",
    );
  });

  it("persists follow-up pair memory effects through the save path", () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const pairState = buildPairState();
    const session = buildSession("early_end");
    const save = gameSaveSchema.parse({
      ...seed,
      pairStates: [
        ...seed.pairStates.filter((candidate) => candidate.id !== pairState.id),
        pairState,
      ],
      dateSessions: [...seed.dateSessions, session],
    });

    const result = applyFollowUpAction(save, {
      dateSessionId: session.id,
      action: "pursue",
    });
    const updatedPair = result.save.pairStates.find((candidate) => candidate.id === pairState.id);

    expect(updatedPair?.agreements.some((agreement) => agreement.text.includes("Repair"))).toBe(
      true,
    );
    expect(result.save.memories.some((memory) => memory.tags.includes("follow_up"))).toBe(true);
    expect(result.session.finalReport?.appliedFollowUp).toBe("pursue");
  });

  it("repairs duplicate active pair memory before follow-up resolution persists", () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const pairState = pairStateSchema.parse({
      ...buildPairState(),
      agreements: [
        {
          id: "agreement-kept",
          text: "Keep the garnish aisle small.",
          status: "active",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
        {
          id: "agreement-duplicate",
          text: "Keep the garnish aisle small",
          status: "active",
          createdAt: "2026-05-05T11:05:00.000Z",
        },
      ],
      openLoops: [
        {
          id: "loop-kept",
          text: "Whether Sienna's basil policy is still classified.",
          status: "open",
          createdAt: "2026-05-05T11:10:00.000Z",
        },
        {
          id: "loop-duplicate",
          text: "Whether Sienna's basil policy is still classified",
          status: "open",
          createdAt: "2026-05-05T11:15:00.000Z",
        },
      ],
    });
    const session = buildSession("bad_fit");
    const save = gameSaveSchema.parse({
      ...seed,
      pairStates: [
        ...seed.pairStates.filter((candidate) => candidate.id !== pairState.id),
        pairState,
      ],
      dateSessions: [...seed.dateSessions, session],
    });

    const hydrated = hydrateFixtureOwnedMemberData(save).save;
    const result = applyFollowUpAction(hydrated, {
      dateSessionId: session.id,
      action: "close",
    });
    const updatedPair = result.save.pairStates.find((candidate) => candidate.id === pairState.id);

    expect(updatedPair?.agreements.find((entry) => entry.id === "agreement-kept")?.status).toBe(
      "retired",
    );
    expect(
      updatedPair?.agreements.find((entry) => entry.id === "agreement-duplicate")?.status,
    ).toBe("retired");
    expect(updatedPair?.openLoops.find((entry) => entry.id === "loop-kept")?.status).toBe(
      "dropped",
    );
    expect(updatedPair?.openLoops.find((entry) => entry.id === "loop-duplicate")?.status).toBe(
      "dropped",
    );
    expect(updatedPair?.laneStatus).toBe("closed");
    expect(result.save.memories.filter((memory) => memory.tags.includes("follow_up"))).toHaveLength(
      2,
    );
  });

  it("blocks future bookings for a closed romantic lane", () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const activeShift = getActiveShift(seed);
    const closedPair = pairStateSchema.parse({
      ...buildPairState(),
      laneStatus: "closed",
    });
    const save = gameSaveSchema.parse({
      ...seed,
      focusedMemberIds: ["jenna-pike"],
      pairStates: [
        ...seed.pairStates.filter((candidate) => candidate.id !== closedPair.id),
        closedPair,
      ],
      shifts: [
        {
          ...activeShift,
          featuredMemberIds: ["jenna-pike"],
          availablePartnerMemberIds: ["vhool"],
          followUpReservations: [],
        },
      ],
      activeShiftId: activeShift.id,
    });

    expect(() =>
      commitDateBooking(save, {
        focusMemberId: "jenna-pike",
        partnerMemberId: "vhool",
      }),
    ).toThrow("Cupid closed the romantic lane between these members.");
  });

  it("records a budget cut when follow-up makes a member quit", () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const pairState = buildPairState();
    const session = buildSession("second_date");
    const save = gameSaveSchema.parse({
      ...seed,
      members: seed.members.map((member) =>
        member.id === "jenna-pike"
          ? { ...member, state: { ...member.state, retention: 3 } }
          : member,
      ),
      pairStates: [
        ...seed.pairStates.filter((candidate) => candidate.id !== pairState.id),
        pairState,
      ],
      dateSessions: [...seed.dateSessions, session],
    });

    const result = applyFollowUpAction(save, {
      dateSessionId: session.id,
      action: "close",
    });
    const updatedMember = result.save.members.find((member) => member.id === "jenna-pike");

    expect(updatedMember?.state.status).toBe("quit");
    expect(result.save.budgetCap).toBe(save.budgetCap + MEMBER_QUIT_BUDGET_CUT);
    expect(
      result.save.budgetHistory.some((entry) =>
        entry.reasons.some((reason) => reason.kind === "member_quit"),
      ),
    ).toBe(true);
  });
});

describe("shift closure follow-up gate", () => {
  function buildSaveWithCompletedShiftSession(
    filed: boolean,
    shiftSlots: { used: number; total: number } = { used: 1, total: 1 },
  ) {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const activeShift = seed.shifts.find((shift) => shift.id === seed.activeShiftId);
    if (activeShift === undefined) {
      throw new Error("Expected an active shift in the seed save.");
    }
    const session = dateSessionSchema.parse({
      id: `date-${activeShift.shiftNumber}-1-${JENNA_VHOOL_PAIR_ID}-temporal-coffee-shop`,
      pairId: JENNA_VHOOL_PAIR_ID,
      scenarioId: "temporal-coffee-shop",
      turnLimit: 24,
      currentTurn: 4,
      dateHealth: 55,
      status: "completed",
      runtimeMode: "local_ai",
      participants: ["jenna-pike", "vhool"],
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: [] },
      eventsTriggered: [],
      playbackState: "ended",
      endSentiment: null,
      interventions: [],
      finalReport: {
        id: "final-gate-test",
        dateSessionId: `date-${activeShift.shiftNumber}-1-${JENNA_VHOOL_PAIR_ID}-temporal-coffee-shop`,
        completedAt: "2026-05-05T12:30:00.000Z",
        outcome: "mixed",
        summary: "Cupid filed a follow-up gate test.",
        statSummary: "Case read: gate test.",
        recommendedFollowUp: "pursue",
        appliedFollowUp: filed ? "pursue" : undefined,
        memoryRecordIds: [],
        readyToClose: false,
      },
    });
    const rawSave = gameSaveSchema.parse({
      ...seed,
      shifts: seed.shifts.map((shift) =>
        shift.id === activeShift.id
          ? { ...shift, dateSlotsUsed: shiftSlots.used, dateSlotsTotal: shiftSlots.total }
          : shift,
      ),
      pairStates: [
        ...seed.pairStates.filter((candidate) => candidate.id !== session.pairId),
        buildPairState(),
      ],
      dateSessions: [...seed.dateSessions, session],
    });
    return hydrateFixtureOwnedMemberData(rawSave).save;
  }

  it("reports the pending sessions for the active shift", () => {
    const save = buildSaveWithCompletedShiftSession(false);
    const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);
    if (activeShift === undefined) {
      throw new Error("Expected an active shift in the test save.");
    }

    const pending = pendingFollowUpSessionsForShift(save, activeShift.shiftNumber);

    expect(pending).toHaveLength(1);
    expect(pending[0]?.finalReport?.appliedFollowUp).toBeUndefined();
  });

  it("blocks completeShift while a session is missing a follow-up", () => {
    const save = buildSaveWithCompletedShiftSession(false);

    expect(() => completeShift(save)).toThrow(/File a follow-up/);
  });

  it("allows completeShift once every completed session has a follow-up filed", () => {
    const save = buildSaveWithCompletedShiftSession(true);

    expect(() => completeShift(save)).not.toThrow();
  });

  it("auto-completes only when the final shift slot has a filed follow-up", () => {
    expect(shouldAutoCompleteShift(buildSaveWithCompletedShiftSession(false))).toBe(false);
    expect(shouldAutoCompleteShift(buildSaveWithCompletedShiftSession(true))).toBe(true);
    expect(
      shouldAutoCompleteShift(buildSaveWithCompletedShiftSession(true, { used: 1, total: 2 })),
    ).toBe(false);
  });

  it("can file the final follow-up and completed shift as one service result", () => {
    const save = buildSaveWithCompletedShiftSession(false);
    const session = save.dateSessions.at(-1);

    if (session === undefined) {
      throw new Error("Expected completed date session.");
    }

    const result = applyFollowUpActionAndMaybeCompleteShift(save, {
      dateSessionId: session.id,
      action: "pursue",
    });

    expect(result.session.finalReport?.appliedFollowUp).toBe("pursue");
    expect(result.completedShiftReport).toBeDefined();
    expect(result.saveBeforeShiftCompletion?.activeShiftId).toBe(save.activeShiftId);
    expect(getActiveShift(result.save).status).toBe("completed");
  });

  it("opens the exact booking path for the latest follow-up partner while cooling", () => {
    const focusedMemberIds = ["noah-kim", "vhool", "sienna-bae", "kade-sumner"];
    const focusMemberId = focusedMemberIds[0];
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const membersAfterDate = seed.members.map((member) =>
      member.id === focusMemberId
        ? { ...member, state: { ...member.state, lastDateShift: 1 } }
        : member,
    );
    const baselineShiftThreeSlate = selectShiftPartnerMemberIds({
      members: membersAfterDate,
      focusedMemberIds,
      shiftNumber: 3,
    });
    const followUpPartner = membersAfterDate.find(
      (member) =>
        member.state.status === "active" &&
        !focusedMemberIds.includes(member.id) &&
        !baselineShiftThreeSlate.includes(member.id),
    );

    if (followUpPartner === undefined || focusMemberId === undefined) {
      throw new Error("Expected an active off-slate partner for the follow-up regression.");
    }

    const pairId = makePairId(focusMemberId, followUpPartner.id);
    const priorSession = dateSessionSchema.parse({
      id: `date-1-1-${pairId}-temporal-coffee-shop`,
      pairId,
      scenarioId: "temporal-coffee-shop",
      focusMemberId,
      turnLimit: 12,
      currentTurn: 12,
      dateHealth: 70,
      status: "completed",
      runtimeMode: "local_ai",
      participants: [focusMemberId, followUpPartner.id],
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: [] },
      eventsTriggered: [],
      playbackState: "ended",
      endSentiment: null,
      interventions: [],
      finalReport: {
        id: "final-follow-up-booking",
        dateSessionId: `date-1-1-${pairId}-temporal-coffee-shop`,
        completedAt: "2026-05-05T12:30:00.000Z",
        outcome: "second_date",
        summary: "Cupid filed enough signal to warrant another booking.",
        statSummary: "Case read: second booking signal.",
        recommendedFollowUp: "pursue",
        appliedFollowUp: "pursue",
        memoryRecordIds: [],
        readyToClose: false,
      },
    });
    const shiftTwo = {
      ...getActiveShift(seed),
      id: "shift-2",
      shiftNumber: 2,
      status: "completed" as const,
      featuredMemberIds: focusedMemberIds,
      availablePartnerMemberIds: [],
      completedAt: "2026-05-05T13:00:00.000Z",
    };
    const readyForShiftThree = gameSaveSchema.parse({
      ...seed,
      focusedMemberIds,
      members: membersAfterDate.map((member) =>
        member.id === followUpPartner.id
          ? { ...member, state: { ...member.state, lastDateShift: 2 } }
          : member,
      ),
      shifts: [shiftTwo],
      activeShiftId: shiftTwo.id,
      dateSessions: [priorSession],
    });

    const { save: shiftThreeSave, shift } = startNextShift(readyForShiftThree);

    expect(shift.availablePartnerMemberIds).toContain(followUpPartner.id);
    expect(shift.followUpReservations).toContainEqual({
      focusMemberId,
      partnerMemberId: followUpPartner.id,
      sourceDateSessionId: priorSession.id,
    });
    expect(() =>
      commitDateBooking(shiftThreeSave, {
        focusMemberId: focusedMemberIds[1] ?? "",
        partnerMemberId: followUpPartner.id,
      }),
    ).toThrow("One of the members is still in cooldown from a recent date.");
    expect(() =>
      commitDateBooking(shiftThreeSave, {
        focusMemberId,
        partnerMemberId: followUpPartner.id,
      }),
    ).not.toThrow();
  });
});
