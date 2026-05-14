import { describe, expect, it } from "vitest";

import {
  dateFinalReportSchema,
  dateSessionSchema,
  gameSaveSchema,
  memoryRecordSchema,
  type DateFinalReport,
  type DateSession,
  type GameSave,
  type PairState,
  type PairStats,
} from "../domain/game";
import { memberRequests, starterScenarios } from "../fixtures";
import {
  CLIENT_LOSS_LIMIT_BASE,
  CLOSURE_RETENTION_BUMP,
  CLOSURE_THRESHOLD,
  ClosureSummaryValidationError,
  PAIR_CLOSURE_TAG,
  SOFT_WIN_THRESHOLD,
  clientLossLimit,
  closePair,
  evaluateClosureReadiness,
  getReadyClosurePairs,
  isSoftWinReached,
  markSoftWinSeen,
  shouldShowSoftWin,
  shouldShowSoftWinForActiveShift,
  validateClosureSummary,
  type ClosureReadinessMember,
} from "./closures";
import {
  CLOSURE_NEAR_MISS_TAG,
  createClosureNearMissMemoryRecord,
  finalizeDateSession,
  isCampaignLost,
  linkFinalReportMemoryRecords,
} from "./date-engine";
import { createSeedGameSave, makePairId } from "./game-seed";

const FIRST_MEMBER_ID = "jenna-pike";
const SECOND_MEMBER_ID = "sana-karim";

function buildPairStats(overrides: Partial<PairStats> = {}): PairStats {
  return {
    chemistry: 80,
    trust: 80,
    stability: 70,
    conflict: 20,
    weirdnessTolerance: 55,
    spark: 70,
    strain: 20,
    relationshipHealth: 80,
    ...overrides,
  };
}

function buildPairState({
  participantIds,
  stats,
  completedDateIds,
}: {
  participantIds: [string, string];
  stats: PairStats;
  completedDateIds: string[];
}): PairState {
  const allScenarioUseCounts: Record<string, number> = {};
  return {
    id: makePairId(participantIds[0], participantIds[1]),
    participantIds,
    stats,
    completedDateIds,
    scenarioUseCounts: allScenarioUseCounts,
    agreements: [],
    openLoops: [],
  };
}

function buildFinalReport(overrides: Partial<DateFinalReport> = {}): DateFinalReport {
  return dateFinalReportSchema.parse({
    id: "final-date-1",
    dateSessionId: "date-1-1-test",
    completedAt: new Date("2026-05-01T10:00:00Z").toISOString(),
    outcome: "second_date",
    summary: "Test pair completed a strong date.",
    statSummary: "Case read: the pair left with mutual signal.",
    recommendedFollowUp: "encourage",
    memoryRecordIds: [],
    readyToClose: true,
    ...overrides,
  });
}

function buildDateSession({
  sessionId,
  pairId,
  scenarioId = "park-loop-with-a-dog",
  participants,
  finalReport,
}: {
  sessionId: string;
  pairId: string;
  scenarioId?: string;
  participants: [string, string];
  finalReport?: DateFinalReport;
}): DateSession {
  return dateSessionSchema.parse({
    id: sessionId,
    pairId,
    scenarioId,
    focusMemberId: participants[0],
    turnLimit: 30,
    currentTurn: 30,
    dateHealth: 80,
    status: "completed",
    runtimeMode: "local_ai",
    participants,
    transcript: [
      {
        id: `${sessionId}-msg-0`,
        dateSessionId: sessionId,
        kind: "scenario",
        turnIndex: 0,
        sequenceIndex: 0,
        text: "Opening scene.",
        createdAt: new Date("2026-05-01T10:00:00Z").toISOString(),
      },
    ],
    privateStateByCharacter: {},
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: null,
    interventions: [],
    finalReport,
  });
}

function withClosurePairSetup(
  save: GameSave,
  options: {
    statsOverride?: Partial<PairStats>;
    outcome?: DateFinalReport["outcome"];
    completedCount?: number;
    finalReportOverrides?: Partial<DateFinalReport>;
    focusBoth?: boolean;
  } = {},
): { save: GameSave; pairId: string; sessionId: string } {
  const completedCount = options.completedCount ?? 3;
  const completedDateIds = Array.from({ length: completedCount }, (_, index) => `date-${index}`);
  const pairState = buildPairState({
    participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
    stats: buildPairStats(options.statsOverride),
    completedDateIds,
  });
  const sessionId = "date-1-1-jenna-pike__sana-karim-park-loop-with-a-dog";
  const finalReport = buildFinalReport({
    dateSessionId: sessionId,
    outcome: options.outcome ?? "second_date",
    ...options.finalReportOverrides,
  });
  const session = buildDateSession({
    sessionId,
    pairId: pairState.id,
    participants: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
    finalReport,
  });

  const otherPairStates = save.pairStates.filter((candidate) => candidate.id !== pairState.id);
  const nextSave = gameSaveSchema.parse({
    ...save,
    pairStates: [...otherPairStates, pairState],
    dateSessions: [...save.dateSessions, session],
    focusedMemberIds: options.focusBoth
      ? [FIRST_MEMBER_ID, SECOND_MEMBER_ID, ...save.focusedMemberIds.slice(0, 2)]
      : save.focusedMemberIds,
  });

  return { save: nextSave, pairId: pairState.id, sessionId };
}

describe("evaluateClosureReadiness", () => {
  const baseMembers: ClosureReadinessMember[] = [
    { id: FIRST_MEMBER_ID, state: { status: "active" } },
    { id: SECOND_MEMBER_ID, state: { status: "active" } },
  ];

  it("returns true when every gate is met", () => {
    const result = evaluateClosureReadiness({
      pairState: {
        stats: buildPairStats(),
        completedDateIds: ["a", "b"],
        participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
      },
      outcome: "second_date",
      completedDateCount: 3,
      members: baseMembers,
    });

    expect(result).toBe(true);
  });

  it("rejects outcomes other than second_date", () => {
    for (const outcome of ["mixed", "cool_down", "bad_fit", "early_end"] as const) {
      expect(
        evaluateClosureReadiness({
          pairState: {
            stats: buildPairStats(),
            completedDateIds: ["a", "b"],
            participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
          },
          outcome,
          completedDateCount: 3,
          members: baseMembers,
        }),
      ).toBe(false);
    }
  });

  it("requires at least 3 completed dates including the current one", () => {
    expect(
      evaluateClosureReadiness({
        pairState: {
          stats: buildPairStats(),
          completedDateIds: ["a"],
          participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
        },
        outcome: "second_date",
        completedDateCount: 2,
        members: baseMembers,
      }),
    ).toBe(false);
  });

  it("enforces individual stat gates", () => {
    expect(
      evaluateClosureReadiness({
        pairState: {
          stats: buildPairStats({ chemistry: CLOSURE_THRESHOLD.chemistry - 1 }),
          completedDateIds: ["a", "b"],
          participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
        },
        outcome: "second_date",
        completedDateCount: 3,
        members: baseMembers,
      }),
    ).toBe(false);

    expect(
      evaluateClosureReadiness({
        pairState: {
          stats: buildPairStats({ strain: CLOSURE_THRESHOLD.strainMax + 1 }),
          completedDateIds: ["a", "b"],
          participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
        },
        outcome: "second_date",
        completedDateCount: 3,
        members: baseMembers,
      }),
    ).toBe(false);

    expect(
      evaluateClosureReadiness({
        pairState: {
          stats: buildPairStats({ conflict: CLOSURE_THRESHOLD.conflictMax + 1 }),
          completedDateIds: ["a", "b"],
          participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
        },
        outcome: "second_date",
        completedDateCount: 3,
        members: baseMembers,
      }),
    ).toBe(false);
  });

  it("rejects when either participant is not active", () => {
    expect(
      evaluateClosureReadiness({
        pairState: {
          stats: buildPairStats(),
          completedDateIds: ["a", "b"],
          participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
        },
        outcome: "second_date",
        completedDateCount: 3,
        members: [
          { id: FIRST_MEMBER_ID, state: { status: "active" } },
          { id: SECOND_MEMBER_ID, state: { status: "closed" } },
        ] satisfies ClosureReadinessMember[],
      }),
    ).toBe(false);
  });

  it("rejects broken agreements and open loops as closure blockers", () => {
    expect(
      evaluateClosureReadiness({
        pairState: {
          stats: buildPairStats(),
          completedDateIds: ["a", "b"],
          participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
          agreements: [
            {
              id: "agreement-broken",
              text: "No public archive questions.",
              status: "broken",
              createdAt: "2026-05-05T11:00:00.000Z",
              resolvedAt: "2026-05-05T12:00:00.000Z",
            },
          ],
          openLoops: [],
        },
        outcome: "second_date",
        completedDateCount: 3,
        members: baseMembers,
      }),
    ).toBe(false);

    expect(
      evaluateClosureReadiness({
        pairState: {
          stats: buildPairStats(),
          completedDateIds: ["a", "b"],
          participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
          agreements: [],
          openLoops: [
            {
              id: "loop-open",
              text: "Whether the next booking survives daylight.",
              status: "open",
              createdAt: "2026-05-05T11:00:00.000Z",
            },
          ],
        },
        outcome: "second_date",
        completedDateCount: 3,
        members: baseMembers,
      }),
    ).toBe(false);
  });

  it("rejects when a participant record is missing", () => {
    expect(
      evaluateClosureReadiness({
        pairState: {
          stats: buildPairStats(),
          completedDateIds: ["a", "b"],
          participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
        },
        outcome: "second_date",
        completedDateCount: 3,
        members: [{ id: FIRST_MEMBER_ID, state: { status: "active" } }],
      }),
    ).toBe(false);
  });
});

describe("closure near miss", () => {
  it("files player-safe copy and memory without readyToClose", () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const first = seed.members.find((member) => member.id === FIRST_MEMBER_ID);
    const second = seed.members.find((member) => member.id === SECOND_MEMBER_ID);
    const scenario = starterScenarios.find((candidate) => candidate.id === "park-loop-with-a-dog");

    if (first === undefined || second === undefined || scenario === undefined) {
      throw new Error("Expected closure near miss fixtures.");
    }

    const pairState = buildPairState({
      participantIds: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
      stats: buildPairStats(),
      completedDateIds: ["date-1", "date-2"],
    });
    const blockedPairState: PairState = {
      ...pairState,
      openLoops: [
        {
          id: "loop-open",
          text: "Whether the next booking survives daylight.",
          status: "open",
          sourceDateSessionId: "date-2",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
      ],
    };
    const session = buildDateSession({
      sessionId: "date-3",
      pairId: blockedPairState.id,
      participants: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
    });
    const completed = finalizeDateSession({
      session,
      pairState: blockedPairState,
      members: [first, second],
      scenario,
      completedAt: "2026-05-05T12:30:00.000Z",
    });
    const memory = createClosureNearMissMemoryRecord({
      session: completed,
      pairState: {
        ...blockedPairState,
        completedDateIds: [...blockedPairState.completedDateIds, completed.id],
      },
      members: [first, second],
      createdAt: "2026-05-05T12:30:00.000Z",
    });

    expect(completed.finalReport?.readyToClose).toBe(false);
    expect(completed.finalReport?.statSummary).toContain("nearly cleared closure");
    expect(memory?.tags).toContain(CLOSURE_NEAR_MISS_TAG);
    if (memory === null) {
      throw new Error("Expected closure near miss memory.");
    }
    expect(
      linkFinalReportMemoryRecords(completed, [memory.id]).finalReport?.memoryRecordIds,
    ).toContain(memory.id);
  });
});

describe("clientLossLimit and campaign loss", () => {
  it("returns base 3 with no closures and 8 with 5 closures", () => {
    expect(clientLossLimit({ closureCount: 0 })).toBe(CLIENT_LOSS_LIMIT_BASE);
    expect(clientLossLimit({ closureCount: 5 })).toBe(CLIENT_LOSS_LIMIT_BASE + 5);
  });

  it("isCampaignLost compares quit count to the dynamic cap", () => {
    const seed = createSeedGameSave();
    const quitMembers = seed.members.slice(0, 4).map((member) => ({
      ...member,
      state: { ...member.state, retention: 0, status: "quit" as const },
    }));
    const fourQuit = {
      ...seed,
      members: seed.members.map((candidate) => {
        const replacement = quitMembers.find((entry) => entry.id === candidate.id);
        return replacement ?? candidate;
      }),
    };

    expect(isCampaignLost(fourQuit)).toBe(true);
    expect(isCampaignLost({ ...fourQuit, closureCount: 2 })).toBe(false);
    expect(isCampaignLost({ ...fourQuit, closureCount: 1 })).toBe(true);
  });
});

describe("soft-win bookkeeping", () => {
  it("isSoftWinReached fires at five closures", () => {
    expect(isSoftWinReached({ closureCount: 4 })).toBe(false);
    expect(isSoftWinReached({ closureCount: SOFT_WIN_THRESHOLD })).toBe(true);
  });

  it("shouldShowSoftWin only fires while softWinSeen is false", () => {
    expect(shouldShowSoftWin({ closureCount: SOFT_WIN_THRESHOLD, softWinSeen: false })).toBe(true);
    expect(shouldShowSoftWin({ closureCount: SOFT_WIN_THRESHOLD, softWinSeen: true })).toBe(false);
  });

  it("markSoftWinSeen flips the flag without rotating timestamps unnecessarily", () => {
    const seed = createSeedGameSave();
    const ready = gameSaveSchema.parse({
      ...seed,
      closureCount: SOFT_WIN_THRESHOLD,
    });
    const seen = markSoftWinSeen(ready);
    expect(seen.softWinSeen).toBe(true);
    const idempotent = markSoftWinSeen(seen);
    expect(idempotent).toBe(seen);
  });

  it("waits until the active shift starts after the fifth closure", () => {
    const seed = createSeedGameSave(new Date("2026-05-01T09:00:00Z"));
    const closureMemories = seed.pairStates.slice(0, SOFT_WIN_THRESHOLD).map((pairState, index) =>
      memoryRecordSchema.parse({
        id: `memory-${pairState.id}-${PAIR_CLOSURE_TAG}-${index}`,
        scope: "pair",
        visibility: "public",
        subjectIds: pairState.participantIds,
        pairId: pairState.id,
        text: `Closure note ${index + 1}. The pair leaves with groceries scheduled.`,
        tags: [PAIR_CLOSURE_TAG],
        importance: 5,
        createdAt: `2026-05-0${index + 1}T12:00:00Z`,
      }),
    );
    const beforeNextShift = gameSaveSchema.parse({
      ...seed,
      closureCount: SOFT_WIN_THRESHOLD,
      memories: closureMemories,
      shifts: seed.shifts.map((shift) =>
        shift.id === seed.activeShiftId ? { ...shift, startedAt: "2026-05-01T09:00:00Z" } : shift,
      ),
    });
    const afterNextShift = gameSaveSchema.parse({
      ...beforeNextShift,
      shifts: beforeNextShift.shifts.map((shift) =>
        shift.id === beforeNextShift.activeShiftId
          ? { ...shift, startedAt: "2026-05-06T09:00:00Z" }
          : shift,
      ),
    });

    expect(shouldShowSoftWinForActiveShift(beforeNextShift)).toBe(false);
    expect(shouldShowSoftWinForActiveShift(afterNextShift)).toBe(true);
    expect(shouldShowSoftWinForActiveShift({ ...afterNextShift, softWinSeen: true })).toBe(false);
  });
});

describe("getReadyClosurePairs and closePair", () => {
  it("flags a fully ready pair from the latest completed session", () => {
    const seed = createSeedGameSave();
    const { save, pairId } = withClosurePairSetup(seed);
    const ready = getReadyClosurePairs(save);

    expect(ready).toHaveLength(1);
    expect(ready[0]?.pairState.id).toBe(pairId);
  });

  it("ignores stale older reports after a later non-ready date", () => {
    const seed = createSeedGameSave();
    const { save, pairId } = withClosurePairSetup(seed);
    const olderSession = save.dateSessions[save.dateSessions.length - 1];
    if (olderSession === undefined) {
      throw new Error("expected setup session");
    }

    const newerSession = buildDateSession({
      sessionId: `${olderSession.id}-2`,
      pairId,
      participants: [FIRST_MEMBER_ID, SECOND_MEMBER_ID],
      finalReport: buildFinalReport({
        id: "final-newer",
        dateSessionId: `${olderSession.id}-2`,
        outcome: "mixed",
        completedAt: new Date("2026-05-08T10:00:00Z").toISOString(),
        readyToClose: false,
      }),
    });

    const stale = gameSaveSchema.parse({
      ...save,
      dateSessions: [...save.dateSessions, newerSession],
    });

    expect(getReadyClosurePairs(stale)).toHaveLength(0);
  });

  it("closePair flips members closed, frees focus, applies bumps, files memory, bumps closureCount", () => {
    const seed = createSeedGameSave();
    const firstRequest = memberRequests.find((request) => request.memberId === FIRST_MEMBER_ID);
    if (firstRequest === undefined) {
      throw new Error("expected first member request");
    }
    const focusIds = [
      FIRST_MEMBER_ID,
      SECOND_MEMBER_ID,
      ...seed.members
        .filter((member) => member.id !== FIRST_MEMBER_ID && member.id !== SECOND_MEMBER_ID)
        .slice(0, 2)
        .map((member) => member.id),
    ];
    const seedWithFocus = gameSaveSchema.parse({
      ...seed,
      focusedMemberIds: focusIds,
      shifts: seed.shifts.map((shift) =>
        shift.id === seed.activeShiftId
          ? {
              ...shift,
              featuredMemberIds: focusIds,
              memberRequestIds: [firstRequest.id],
            }
          : shift,
      ),
    });
    const { save, pairId } = withClosurePairSetup(seedWithFocus);
    const otherActiveBefore = save.members.find(
      (member) =>
        member.state.status === "active" &&
        member.id !== FIRST_MEMBER_ID &&
        member.id !== SECOND_MEMBER_ID,
    );
    if (otherActiveBefore === undefined) {
      throw new Error("expected another active member");
    }
    const summary =
      "Jenna and Sana made it through a quiet park loop. They want the next argument to be about groceries.";
    const closed = closePair({ save, pairId, summary, now: new Date("2026-05-10T12:00:00Z") });

    expect(closed.closureCount).toBe(1);
    expect(closed.focusedMemberIds).not.toContain(FIRST_MEMBER_ID);
    expect(closed.focusedMemberIds).not.toContain(SECOND_MEMBER_ID);
    const activeShift = closed.shifts.find((shift) => shift.id === closed.activeShiftId);
    expect(activeShift?.featuredMemberIds).not.toContain(FIRST_MEMBER_ID);
    expect(activeShift?.memberRequestIds).not.toContain(firstRequest.id);

    const first = closed.members.find((member) => member.id === FIRST_MEMBER_ID);
    const second = closed.members.find((member) => member.id === SECOND_MEMBER_ID);
    expect(first?.state.status).toBe("closed");
    expect(second?.state.status).toBe("closed");

    const otherActiveAfter = closed.members.find((member) => member.id === otherActiveBefore.id);
    expect(otherActiveAfter?.state.retention).toBe(
      Math.min(100, otherActiveBefore.state.retention + CLOSURE_RETENTION_BUMP),
    );

    const closureMemory = closed.memories.find((memory) => memory.tags.includes(PAIR_CLOSURE_TAG));
    expect(closureMemory).toBeDefined();
    expect(closureMemory?.pairId).toBe(pairId);
    expect(closureMemory?.scope).toBe("pair");
    expect(closureMemory?.text).toBe(summary);
  });

  it("closePair rejects when the pair no longer meets the threshold", () => {
    const seed = createSeedGameSave();
    const { save, pairId } = withClosurePairSetup(seed, {
      statsOverride: { chemistry: CLOSURE_THRESHOLD.chemistry - 5 },
    });
    expect(() =>
      closePair({
        save,
        pairId,
        summary:
          "Jenna and Sana made it through a quiet park loop. They want the next argument to be about groceries.",
      }),
    ).toThrow(/no longer meets/);
  });

  it("closePair rejects when a participant has already quit", () => {
    const seed = createSeedGameSave();
    const quitFirst = {
      ...seed,
      members: seed.members.map((member) =>
        member.id === FIRST_MEMBER_ID
          ? { ...member, state: { ...member.state, status: "quit" as const, retention: 0 } }
          : member,
      ),
    };
    const { save, pairId } = withClosurePairSetup(quitFirst);
    expect(() =>
      closePair({
        save,
        pairId,
        summary:
          "Jenna and Sana made it through a quiet park loop. They want the next argument to be about groceries.",
      }),
    ).toThrow();
  });

  it("closePair rejects when a participant is already closed", () => {
    const seed = createSeedGameSave();
    const alreadyClosed = {
      ...seed,
      members: seed.members.map((member) =>
        member.id === FIRST_MEMBER_ID
          ? { ...member, state: { ...member.state, status: "closed" as const } }
          : member,
      ),
    };
    const { save, pairId } = withClosurePairSetup(alreadyClosed);
    expect(() =>
      closePair({
        save,
        pairId,
        summary:
          "Jenna and Sana made it through a quiet park loop. They want the next argument to be about groceries.",
      }),
    ).toThrow();
  });
});

describe("validateClosureSummary", () => {
  const validBody =
    "Jenna and Sana made it through a quiet park loop. They want the next argument to be about groceries.";

  it("accepts a clean, specific note", () => {
    expect(() => validateClosureSummary(validBody)).not.toThrow();
  });

  it("rejects em or en dashes", () => {
    expect(() =>
      validateClosureSummary("Jenna and Sana made it through a quiet park loop \u2014 together."),
    ).toThrow(ClosureSummaryValidationError);
    expect(() =>
      validateClosureSummary("Jenna and Sana made it through a quiet park loop \u2013 together."),
    ).toThrow(ClosureSummaryValidationError);
  });

  it("rejects Cupid editorializing", () => {
    expect(() =>
      validateClosureSummary(
        "Cupid finally landed a match between Jenna and Sana, the app worked.",
      ),
    ).toThrow(ClosureSummaryValidationError);
  });

  it("rejects exact stat numbers", () => {
    expect(() =>
      validateClosureSummary(
        "Jenna and Sana logged Date Health 78 after a quiet park loop together.",
      ),
    ).toThrow(ClosureSummaryValidationError);
  });

  it("rejects too short or too long", () => {
    expect(() => validateClosureSummary("Jenna and Sana.")).toThrow(ClosureSummaryValidationError);
    expect(() => validateClosureSummary("a".repeat(500))).toThrow(ClosureSummaryValidationError);
  });
});
