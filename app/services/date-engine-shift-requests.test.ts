import { describe, expect, it } from "vitest";

import { memberRequests } from "../fixtures";
import {
  dateFinalReportSchema,
  dateSessionSchema,
  judgeSnapshotSchema,
  shiftReportSchema,
  shiftStateSchema,
  type DateSession,
  type GameSave,
  type JudgeSnapshot,
  type Member,
  type ShiftReport,
  type ShiftRequestAskOutcome,
  type ShiftState,
} from "../domain/game";
import {
  applyDateFinalReportToMembers,
  classifyShiftRequestOutcomes,
  completeShift,
  deriveHotRequestId,
  PERFORMANCE_REVIEW_INTERVAL,
  recentRequestFulfillmentRate,
} from "./date-engine";
import { selectInitialFocusCases, syncActiveShiftFocusCases } from "./focus-cases";
import { createSeedGameSave } from "./game-seed";
import { buildAskEvidenceId } from "./player-knowledge";
import { selectHotRequestId } from "./shift-planning";

const SHIFT_BASE = {
  id: "shift-1",
  shiftNumber: 1,
  status: "active",
  dateSlotsTotal: 1,
  dateSlotsUsed: 1,
  featuredMemberIds: ["jenna-pike"],
  drawnScenarioIds: [],
  companyGoalIds: [],
  startedAt: "2026-05-21T12:00:00.000Z",
} as const;

const SESSION_BASE = {
  id: "date-1-jenna-pike-test",
  pairId: "pair-jenna-pike--meridian-vale",
  scenarioId: "park-loop-with-a-dog",
  turnLimit: 2,
  currentTurn: 2,
  dateHealth: 60,
  status: "completed",
  runtimeMode: "local_ai",
  participants: ["jenna-pike", "meridian-vale"],
  transcript: [],
  privateStateByCharacter: {
    "jenna-pike": { mood: 60, comfort: 60, intent: "trying" },
    "meridian-vale": { mood: 60, comfort: 60, intent: "trying" },
  },
  judgeSnapshots: [],
  eventDraft: { offered: [], picked: [] },
  eventsTriggered: [],
  playbackState: "ended",
  endSentiment: null,
  interventions: [],
} as const;

function makeShift(requestIds: string[]): ShiftState {
  return shiftStateSchema.parse({
    ...SHIFT_BASE,
    memberRequestIds: requestIds,
  });
}

function makeJudgeSnapshot(
  dateSessionId: string,
  usedEvidenceIds: string[],
  overrides: { id?: string; exchangeIndex?: number } = {},
): JudgeSnapshot {
  return judgeSnapshotSchema.parse({
    id: overrides.id ?? `${dateSessionId}-judge-1`,
    dateSessionId,
    exchangeIndex: overrides.exchangeIndex ?? 0,
    dateHealthDelta: 0,
    statDeltas: {},
    memberMoodDeltas: {},
    shouldEndEarly: false,
    notableMoments: ["snapshot"],
    playerSummary: "Cupid filed the exchange.",
    memoryCandidates: [],
    usedEvidenceIds,
  });
}

function makeCompletedSession(
  focusMemberId: string,
  focusRequestId: string,
  overrides: { id?: string; snapshots?: JudgeSnapshot[] } = {},
): DateSession {
  const id = overrides.id ?? SESSION_BASE.id;
  return dateSessionSchema.parse({
    ...SESSION_BASE,
    id,
    focusMemberId,
    focusRequestId,
    judgeSnapshots: overrides.snapshots ?? [],
  });
}

describe("classifyShiftRequestOutcomes", () => {
  it("marks an unbooked shift request as ignored", () => {
    const shift = makeShift(["request-jenna-normal-date"]);

    const outcomes = classifyShiftRequestOutcomes(shift, []);

    expect(outcomes.get("request-jenna-normal-date")).toBe("ignored");
  });

  it("marks a booked request as missed when the session surfaced no ask evidence", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const session = makeCompletedSession("jenna-pike", "request-jenna-normal-date");

    const outcomes = classifyShiftRequestOutcomes(shift, [session]);

    expect(outcomes.get("request-jenna-normal-date")).toBe("missed");
  });

  it("marks a booked request as covered when the session surfaced ask-covered evidence", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const session = makeCompletedSession("jenna-pike", "request-jenna-normal-date", {
      snapshots: [
        makeJudgeSnapshot(SESSION_BASE.id, [
          buildAskEvidenceId("jenna-pike", "request-jenna-normal-date", "covered"),
        ]),
      ],
    });

    const outcomes = classifyShiftRequestOutcomes(shift, [session]);

    expect(outcomes.get("request-jenna-normal-date")).toBe("covered");
  });

  it("marks a booked request as raised when only ask-blocked evidence was surfaced", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const session = makeCompletedSession("jenna-pike", "request-jenna-normal-date", {
      snapshots: [
        makeJudgeSnapshot(SESSION_BASE.id, [
          buildAskEvidenceId("jenna-pike", "request-jenna-normal-date", "blocked"),
        ]),
      ],
    });

    const outcomes = classifyShiftRequestOutcomes(shift, [session]);

    expect(outcomes.get("request-jenna-normal-date")).toBe("raised");
  });

  it("prefers covered when later snapshots surface ask-covered after an earlier ask-blocked", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const session = makeCompletedSession("jenna-pike", "request-jenna-normal-date", {
      snapshots: [
        makeJudgeSnapshot(
          SESSION_BASE.id,
          [buildAskEvidenceId("jenna-pike", "request-jenna-normal-date", "blocked")],
          { id: "judge-a", exchangeIndex: 0 },
        ),
        makeJudgeSnapshot(
          SESSION_BASE.id,
          [buildAskEvidenceId("jenna-pike", "request-jenna-normal-date", "covered")],
          { id: "judge-b", exchangeIndex: 1 },
        ),
      ],
    });

    const outcomes = classifyShiftRequestOutcomes(shift, [session]);

    expect(outcomes.get("request-jenna-normal-date")).toBe("covered");
  });

  it("does not let a prior session's ask-covered evidence leak into a later shift's classification", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const currentSession = makeCompletedSession("jenna-pike", "request-jenna-normal-date", {
      id: "date-shift-3-jenna-pike",
    });
    const priorSession = makeCompletedSession("jenna-pike", "request-jenna-normal-date", {
      id: "date-shift-1-jenna-pike",
      snapshots: [
        makeJudgeSnapshot("date-shift-1-jenna-pike", [
          buildAskEvidenceId("jenna-pike", "request-jenna-normal-date", "covered"),
        ]),
      ],
    });
    expect(priorSession.judgeSnapshots[0]?.usedEvidenceIds[0]).toBe(
      buildAskEvidenceId("jenna-pike", "request-jenna-normal-date", "covered"),
    );

    const outcomes = classifyShiftRequestOutcomes(shift, [currentSession]);

    expect(outcomes.get("request-jenna-normal-date")).toBe("missed");
  });

  it("does not promote requests that are not on the shift roster", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const session = makeCompletedSession("jenna-pike", "request-jenna-decent-driver", {
      id: "date-1-jenna-pike-other",
    });

    const outcomes = classifyShiftRequestOutcomes(shift, [session]);

    expect(outcomes.has("request-jenna-decent-driver")).toBe(false);
    expect(outcomes.get("request-jenna-normal-date")).toBe("ignored");
  });
});

describe("applyDateFinalReportToMembers ask-state prefix", () => {
  const seed = createSeedGameSave(new Date("2026-05-21T12:00:00.000Z"));

  function getMember(id: string): Member {
    const member = seed.members.find((candidate) => candidate.id === id);
    if (member === undefined) {
      throw new Error(`Missing seed member ${id}`);
    }
    return member;
  }

  function makeSessionWithReport(
    focusMemberId: string,
    focusRequestId: string,
    outcome: "second_date" | "mixed" | "bad_fit",
    overrides: { snapshots?: JudgeSnapshot[] } = {},
  ): DateSession {
    const finalReport = dateFinalReportSchema.parse({
      id: `report-${SESSION_BASE.id}`,
      dateSessionId: SESSION_BASE.id,
      completedAt: "2026-05-21T12:00:00.000Z",
      outcome,
      summary: "summary",
      statSummary: "stat",
      recommendedFollowUp: outcome === "second_date" ? "encourage" : "repair",
      memoryRecordIds: [],
    });
    return dateSessionSchema.parse({
      ...SESSION_BASE,
      focusMemberId,
      focusRequestId,
      finalReport,
      judgeSnapshots: overrides.snapshots ?? [],
    });
  }

  it("prepends 'Ask covered.' to the focus member when the session surfaced ask-covered evidence", () => {
    const session = makeSessionWithReport(
      "jenna-pike",
      "request-jenna-normal-date",
      "second_date",
      {
        snapshots: [
          makeJudgeSnapshot(SESSION_BASE.id, [
            buildAskEvidenceId("jenna-pike", "request-jenna-normal-date", "covered"),
          ]),
        ],
      },
    );

    const updated = applyDateFinalReportToMembers(
      [getMember("jenna-pike"), getMember("meridian-vale")],
      session,
      1,
    );

    const focus = updated.find((member) => member.id === "jenna-pike");
    const partner = updated.find((member) => member.id === "meridian-vale");
    expect(focus?.state.recentDateResult).toMatch(/^Ask covered\./);
    expect(partner?.state.recentDateResult ?? "").not.toMatch(/Ask covered/);
  });

  it("prepends 'Booked, but the ask never landed.' when the session surfaced no ask evidence", () => {
    const session = makeSessionWithReport("jenna-pike", "request-jenna-normal-date", "mixed");

    const updated = applyDateFinalReportToMembers(
      [getMember("jenna-pike"), getMember("meridian-vale")],
      session,
      1,
    );

    const focus = updated.find((member) => member.id === "jenna-pike");
    expect(focus?.state.recentDateResult).toMatch(/^Booked, but the ask never landed\./);
  });

  it("prepends 'Ask raised' when the session only surfaced ask-blocked evidence", () => {
    const session = makeSessionWithReport("jenna-pike", "request-jenna-normal-date", "bad_fit", {
      snapshots: [
        makeJudgeSnapshot(SESSION_BASE.id, [
          buildAskEvidenceId("jenna-pike", "request-jenna-normal-date", "blocked"),
        ]),
      ],
    });

    const updated = applyDateFinalReportToMembers(
      [getMember("jenna-pike"), getMember("meridian-vale")],
      session,
      1,
    );

    const focus = updated.find((member) => member.id === "jenna-pike");
    expect(focus?.state.recentDateResult).toMatch(/^Ask raised, room blocked it\./);
  });

  it("falls back to plain outcome text when no focusRequestId is set", () => {
    const session = dateSessionSchema.parse({
      ...SESSION_BASE,
      focusMemberId: "jenna-pike",
      finalReport: dateFinalReportSchema.parse({
        id: `report-${SESSION_BASE.id}`,
        dateSessionId: SESSION_BASE.id,
        completedAt: "2026-05-21T12:00:00.000Z",
        outcome: "second_date",
        summary: "summary",
        statSummary: "stat",
        recommendedFollowUp: "encourage",
        memoryRecordIds: [],
      }),
    });

    const updated = applyDateFinalReportToMembers(
      [getMember("jenna-pike"), getMember("meridian-vale")],
      session,
      1,
    );

    const focus = updated.find((member) => member.id === "jenna-pike");
    expect(focus?.state.recentDateResult ?? "").not.toMatch(/Ask|Booked/);
  });
});

describe("recentRequestFulfillmentRate", () => {
  const seed = createSeedGameSave(new Date("2026-05-21T12:00:00.000Z"));

  function makeReport(
    shiftId: string,
    requestOutcomes: Record<string, ShiftRequestAskOutcome>,
  ): ShiftReport {
    return shiftReportSchema.parse({
      id: `report-${shiftId}`,
      shiftId,
      completedAt: "2026-05-21T13:00:00.000Z",
      completedDates: 0,
      earlyEndedDates: 0,
      ordinaryNonHumanDates: 0,
      memberMoodDelta: 0,
      goalResults: [],
      requestOutcomes,
      offeredScenarioIds: [],
      summary: "summary",
      deckCoverage: [],
    });
  }

  function makeLegacyReport(shiftId: string, ignoredRequestIds: string[]): ShiftReport {
    return shiftReportSchema.parse({
      id: `report-${shiftId}`,
      shiftId,
      completedAt: "2026-05-21T13:00:00.000Z",
      completedDates: 0,
      earlyEndedDates: 0,
      ordinaryNonHumanDates: 0,
      memberMoodDelta: 0,
      goalResults: [],
      ignoredRequestIds,
      offeredScenarioIds: [],
      summary: "summary",
      deckCoverage: [],
    });
  }

  function makeArchivedShift(
    shiftNumber: number,
    requestIds: string[],
    report: ShiftReport,
  ): ShiftState {
    return shiftStateSchema.parse({
      id: `shift-${shiftNumber}`,
      shiftNumber,
      status: "completed",
      dateSlotsTotal: 1,
      dateSlotsUsed: 1,
      featuredMemberIds: [],
      drawnScenarioIds: [],
      companyGoalIds: [],
      memberRequestIds: requestIds,
      startedAt: "2026-05-21T12:00:00.000Z",
      completedAt: "2026-05-21T13:00:00.000Z",
      report,
    });
  }

  function makeSingleAskShift(
    shiftNumber: number,
    requestId: string,
    outcome: ShiftRequestAskOutcome,
  ): ShiftState {
    return makeArchivedShift(
      shiftNumber,
      [requestId],
      makeReport(`shift-${shiftNumber}`, { [requestId]: outcome }),
    );
  }

  function withShifts(shifts: ShiftState[]): GameSave {
    return { ...seed, shifts };
  }

  it("returns 1 when no shifts are in the window", () => {
    expect(recentRequestFulfillmentRate(withShifts([]), 0)).toBe(1);
  });

  it("weights covered, raised, missed, and ignored at 1, 0.75, 0.5, and 0", () => {
    const weights: Array<[ShiftRequestAskOutcome, number]> = [
      ["covered", 1],
      ["raised", 0.75],
      ["missed", 0.5],
      ["ignored", 0],
    ];
    for (const [outcome, expected] of weights) {
      const shift = makeSingleAskShift(1, "r-a", outcome);
      expect(recentRequestFulfillmentRate(withShifts([shift]), 0)).toBe(expected);
    }
  });

  it("scores only the hot ask, derived from memberRequestIds and shiftNumber", () => {
    // Pick a 4-ask roster and a shift number; whichever id the derived hot picks should be
    // the one that drives the score.
    const ids = ["r-a", "r-b", "r-c", "r-d"];
    const hot = selectHotRequestId({ memberRequestIds: ids, shiftNumber: 5 });
    if (hot === undefined) throw new Error("Expected a hot pick.");
    const outcomes: Record<string, ShiftRequestAskOutcome> = {};
    for (const id of ids) {
      outcomes[id] = id === hot ? "missed" : "covered";
    }
    const shift = makeArchivedShift(5, ids, makeReport("shift-5", outcomes));
    // Only the hot id's outcome counts. hot was missed → weight 0.5.
    expect(recentRequestFulfillmentRate(withShifts([shift]), 0)).toBe(0.5);
  });

  it("averages across shifts in the window", () => {
    const covered = makeSingleAskShift(1, "r-a", "covered");
    const missed = makeSingleAskShift(2, "r-b", "missed");
    expect(recentRequestFulfillmentRate(withShifts([covered, missed]), 0)).toBe(0.75);
  });

  it("excludes shifts at or below the window start", () => {
    const inside = makeSingleAskShift(3, "r-a", "ignored");
    const outside = makeSingleAskShift(2, "r-b", "covered");
    expect(recentRequestFulfillmentRate(withShifts([inside, outside]), 2)).toBe(0);
  });

  it("treats legacy reports (only ignoredRequestIds) as covered for the remainder", () => {
    // Legacy reports predate the requestOutcomes map. They have no hot id either, so the
    // rate is per-request: ignored=0, everything else=1, averaged.
    const legacy = makeArchivedShift(
      1,
      ["r-a", "r-b", "r-c"],
      makeLegacyReport("shift-1", ["r-a"]),
    );
    // 1 ignored + 2 treated-as-covered out of 3 = 2/3
    expect(recentRequestFulfillmentRate(withShifts([legacy]), 0)).toBeCloseTo(2 / 3, 4);
  });

  it("deriveHotRequestId returns the same pick selectHotRequestId would", () => {
    const shift = makeArchivedShift(7, ["r-a", "r-b", "r-c"], makeReport("shift-7", {}));
    expect(deriveHotRequestId(shift)).toBe(
      selectHotRequestId({ memberRequestIds: ["r-a", "r-b", "r-c"], shiftNumber: 7 }),
    );
  });
});

describe("selectHotRequestId", () => {
  it("returns undefined when no requests are staged", () => {
    expect(selectHotRequestId({ memberRequestIds: [], shiftNumber: 1 })).toBeUndefined();
  });

  it("returns a deterministic id for the same shift number and roster", () => {
    const ids = ["r-a", "r-b", "r-c", "r-d"];
    const first = selectHotRequestId({ memberRequestIds: ids, shiftNumber: 7 });
    const second = selectHotRequestId({ memberRequestIds: ids, shiftNumber: 7 });
    expect(first).toBe(second);
    expect(ids).toContain(first);
  });

  it("is insensitive to input order", () => {
    const ids = ["r-a", "r-b", "r-c", "r-d"];
    const reversed = [...ids].reverse();
    expect(selectHotRequestId({ memberRequestIds: ids, shiftNumber: 4 })).toBe(
      selectHotRequestId({ memberRequestIds: reversed, shiftNumber: 4 }),
    );
  });

  it("rotates the hot pick across consecutive shifts on a 4-ask roster", () => {
    const ids = ["r-a", "r-b", "r-c", "r-d"];
    const picks = new Set<string>();
    for (let shift = 1; shift <= 16; shift += 1) {
      const pick = selectHotRequestId({ memberRequestIds: ids, shiftNumber: shift });
      if (pick !== undefined) {
        picks.add(pick);
      }
    }
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("completeShift hot-only penalty gating", () => {
  function seedWithFourFocus(): {
    save: ReturnType<typeof createSeedGameSave>;
    focusIds: string[];
  } {
    const baseSave = createSeedGameSave(new Date("2026-05-21T12:00:00.000Z"));
    const focusIds = baseSave.members
      .filter((member) => member.state.status === "active")
      .slice(0, 4)
      .map((member) => member.id);
    const focused = selectInitialFocusCases(baseSave, focusIds);
    const synced = syncActiveShiftFocusCases(focused);
    return { save: synced, focusIds };
  }

  function getHotRequest(save: GameSave): { id: string; memberId: string } {
    const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);
    if (activeShift === undefined) throw new Error("Expected an active shift.");
    const hotRequestId = deriveHotRequestId(activeShift);
    if (hotRequestId === undefined) throw new Error("Hot request not selected.");
    const hotRequest = memberRequests.find((request) => request.id === hotRequestId);
    if (hotRequest === undefined) throw new Error("Hot request fixture missing.");
    return { id: hotRequestId, memberId: hotRequest.memberId };
  }

  it("penalizes only the hot member when no bookings happened", () => {
    const { save, focusIds } = seedWithFourFocus();
    const hot = getHotRequest(save);
    expect(focusIds).toContain(hot.memberId);

    const moodBefore = new Map(save.members.map((member) => [member.id, member.state.mood]));

    const { save: nextSave, report } = completeShift(save, new Date("2026-05-21T13:00:00.000Z"));

    const moodAfter = new Map(nextSave.members.map((member) => [member.id, member.state.mood]));

    for (const memberId of focusIds) {
      const before = moodBefore.get(memberId) ?? 0;
      const after = moodAfter.get(memberId) ?? 0;
      if (memberId === hot.memberId) {
        expect(after).toBeLessThan(before);
      } else {
        expect(after).toBe(before);
      }
    }

    expect(report.hrNote ?? "").toMatch(/Lead ask sat/);
    expect(report.hrNote ?? "").toMatch(/3 cases in the queue/);
  });

  it("does not penalize anyone when the lead ask was a covered booking", () => {
    const { save: setupSave } = seedWithFourFocus();
    const hot = getHotRequest(setupSave);
    const activeShift = setupSave.shifts.find((shift) => shift.id === setupSave.activeShiftId);

    const partnerId = setupSave.members.find(
      (member) => member.id !== hot.memberId && member.state.status === "active",
    )?.id;
    if (partnerId === undefined) {
      throw new Error("No partner member available.");
    }

    const fakeSessionId = `date-${activeShift?.shiftNumber}-${hot.memberId}-test`;
    const fakeSession = dateSessionSchema.parse({
      ...SESSION_BASE,
      id: fakeSessionId,
      participants: [hot.memberId, partnerId],
      focusMemberId: hot.memberId,
      focusRequestId: hot.id,
      judgeSnapshots: [
        makeJudgeSnapshot(fakeSessionId, [buildAskEvidenceId(hot.memberId, hot.id, "covered")]),
      ],
      finalReport: dateFinalReportSchema.parse({
        id: `report-fake-${hot.memberId}`,
        dateSessionId: fakeSessionId,
        completedAt: "2026-05-21T12:30:00.000Z",
        outcome: "second_date",
        summary: "summary",
        statSummary: "stat",
        recommendedFollowUp: "encourage",
        memoryRecordIds: [],
      }),
    });

    const save = {
      ...setupSave,
      dateSessions: [fakeSession],
    };

    const moodBefore = new Map(save.members.map((member) => [member.id, member.state.mood]));

    const { save: nextSave, report } = completeShift(save, new Date("2026-05-21T13:00:00.000Z"));

    for (const member of nextSave.members) {
      expect(member.state.mood).toBe(moodBefore.get(member.id) ?? 0);
    }
    expect(report.hrNote ?? "").toMatch(/Lead ask landed/);
  });

  it("includes the filed current shift in performance review ask scoring", () => {
    const { save: setupSave } = seedWithFourFocus();
    const sourceShift = setupSave.shifts.find((shift) => shift.id === setupSave.activeShiftId);
    if (sourceShift === undefined) {
      throw new Error("Expected an active shift.");
    }
    const shiftNumber = PERFORMANCE_REVIEW_INTERVAL;
    const activeShift = shiftStateSchema.parse({
      ...sourceShift,
      id: `shift-${shiftNumber}`,
      shiftNumber,
    });
    const save: GameSave = {
      ...setupSave,
      shifts: [activeShift],
      activeShiftId: activeShift.id,
      lastBudgetReviewShift: 0,
    };

    const { report } = completeShift(save, new Date("2026-05-21T13:00:00.000Z"));
    const requestReason = report.budgetReview?.reasons.find(
      (reason) => reason.kind === "performance_request_fulfillment",
    );

    expect(report.budgetReview).toBeDefined();
    expect(requestReason?.label).toBe("0% of asks honored");
    expect(requestReason?.delta).toBe(-5);
  });
});
