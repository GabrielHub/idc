import { describe, expect, it, vi } from "vitest";

import type { GameSave, ManagerQuipHistoryRecord, PairState } from "../domain/game";
import {
  MANAGER_QUIP_CATALOG,
  MANAGER_RETENTION_WARNING_THRESHOLD,
} from "../fixtures/manager-quips";
import { createSeedGameSave } from "./game-seed";
import {
  appendManagerQuipHistory,
  detectFocusSwapDropOfActive,
  detectMemberQuitTransition,
  detectRetentionWarningDip,
  pairEnteredBrittleTrajectory,
  pruneManagerQuipHistory,
  resolveManagerQuip,
  shouldFireSoftWinQuip,
} from "./manager-quips";

const NOW = new Date("2026-05-15T12:00:00.000Z");

function makeHistoryRecord(
  partial: Partial<ManagerQuipHistoryRecord> & Pick<ManagerQuipHistoryRecord, "triggerKey">,
): ManagerQuipHistoryRecord {
  return {
    quipId: partial.quipId ?? "date-start-01",
    cadence: partial.cadence ?? "regular",
    shiftNumber: partial.shiftNumber ?? 1,
    firedAt: partial.firedAt ?? NOW.toISOString(),
    triggerKey: partial.triggerKey,
    ...(partial.surfaceKey === undefined ? {} : { surfaceKey: partial.surfaceKey }),
  };
}

describe("resolveManagerQuip", () => {
  it("returns null for unknown trigger keys", () => {
    const result = resolveManagerQuip({
      triggerKey: "fake.event" as never,
      history: [],
      currentShiftNumber: 1,
      now: NOW,
      random: () => 0,
    });
    expect(result).toBeNull();
  });

  it("fires a regular quip the first time per shift", () => {
    const result = resolveManagerQuip({
      triggerKey: "date.started",
      history: [],
      currentShiftNumber: 1,
      now: NOW,
      random: () => 0,
    });
    expect(result).not.toBeNull();
    expect(result?.triggerKey).toBe("date.started");
    expect(result?.cadence).toBe("regular");
    expect(MANAGER_QUIP_CATALOG.some((quip) => quip.id === result?.quipId)).toBe(true);
  });

  it("suppresses a second regular quip during the same shift", () => {
    const first = resolveManagerQuip({
      triggerKey: "date.started",
      history: [],
      currentShiftNumber: 3,
      now: NOW,
      random: () => 0,
    });
    expect(first).not.toBeNull();
    const second = resolveManagerQuip({
      triggerKey: "date.started",
      history: first === null ? [] : [first.historyRecord],
      currentShiftNumber: 3,
      now: NOW,
      random: () => 0,
    });
    expect(second).toBeNull();
  });

  it("fires a regular quip again on the next shift", () => {
    const earlier = makeHistoryRecord({
      triggerKey: "date.started",
      cadence: "regular",
      shiftNumber: 2,
    });
    const next = resolveManagerQuip({
      triggerKey: "date.started",
      history: [earlier],
      currentShiftNumber: 3,
      now: NOW,
      random: () => 0,
    });
    expect(next).not.toBeNull();
  });

  it("never fires a rare quip twice across the save", () => {
    const earlier = makeHistoryRecord({
      triggerKey: "campaign.closures.five",
      cadence: "rare",
      shiftNumber: 4,
      quipId: "soft-win-01",
    });
    const result = resolveManagerQuip({
      triggerKey: "campaign.closures.five",
      history: [earlier],
      currentShiftNumber: 12,
      now: NOW,
      random: () => 0,
    });
    expect(result).toBeNull();
  });

  it("episodic quips dedupe by surface key", () => {
    const earlier = makeHistoryRecord({
      triggerKey: "datebook.commit.over-budget",
      cadence: "episodic",
      shiftNumber: 2,
      surfaceKey: "shift-2",
    });

    const sameSurface = resolveManagerQuip({
      triggerKey: "datebook.commit.over-budget",
      history: [earlier],
      currentShiftNumber: 2,
      surfaceKey: "shift-2",
      now: NOW,
      random: () => 0,
    });
    expect(sameSurface).toBeNull();

    const differentSurface = resolveManagerQuip({
      triggerKey: "datebook.commit.over-budget",
      history: [earlier],
      currentShiftNumber: 3,
      surfaceKey: "shift-3",
      now: NOW,
      random: () => 0,
    });
    expect(differentSurface).not.toBeNull();
    expect(differentSurface?.surfaceKey).toBe("shift-3");
  });

  it("prefers variants the session has not heard yet", () => {
    const dateStartVariants = MANAGER_QUIP_CATALOG.filter(
      (quip) => quip.triggerKey === "date.started",
    );
    expect(dateStartVariants.length).toBeGreaterThanOrEqual(2);
    const playedThisSession = new Set([dateStartVariants[0].id]);

    const result = resolveManagerQuip({
      triggerKey: "date.started",
      history: [],
      currentShiftNumber: 1,
      sessionPlayedQuipIds: playedThisSession,
      now: NOW,
      random: () => 0,
    });
    expect(result).not.toBeNull();
    expect(result?.quipId).not.toBe(dateStartVariants[0].id);
  });

  it("falls back to the full pool when every variant has been heard", () => {
    const dateStartVariants = MANAGER_QUIP_CATALOG.filter(
      (quip) => quip.triggerKey === "date.started",
    );
    const playedAll = new Set(dateStartVariants.map((quip) => quip.id));
    const result = resolveManagerQuip({
      triggerKey: "date.started",
      history: [],
      currentShiftNumber: 1,
      sessionPlayedQuipIds: playedAll,
      now: NOW,
      random: () => 0,
    });
    expect(result).not.toBeNull();
    expect(playedAll.has(result!.quipId)).toBe(true);
  });

  it("uses reproducible fallback randomness without Math.random", () => {
    const mathRandom = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Manager quip selection should not use global randomness.");
    });

    try {
      const first = resolveManagerQuip({
        triggerKey: "date.started",
        history: [],
        currentShiftNumber: 1,
        surfaceKey: "date-session-1",
        now: NOW,
      });
      const second = resolveManagerQuip({
        triggerKey: "date.started",
        history: [],
        currentShiftNumber: 1,
        surfaceKey: "date-session-1",
        now: NOW,
      });

      expect(first?.quipId).toBe(second?.quipId);
    } finally {
      mathRandom.mockRestore();
    }
  });

  it("penalizes recently played variants for the same trigger", () => {
    const dateStartVariants = MANAGER_QUIP_CATALOG.filter(
      (quip) => quip.triggerKey === "date.started",
    );
    const stale = dateStartVariants[0];

    if (stale === undefined || dateStartVariants.length < 2) {
      throw new Error("Expected at least two date.started quips.");
    }

    const result = resolveManagerQuip({
      triggerKey: "date.started",
      history: [
        makeHistoryRecord({
          triggerKey: "date.started",
          cadence: "regular",
          shiftNumber: 1,
          quipId: stale.id,
        }),
      ],
      currentShiftNumber: 2,
      now: NOW,
      random: () => 0,
    });

    expect(result).not.toBeNull();
    expect(result?.quipId).not.toBe(stale.id);
  });
});

describe("pruneManagerQuipHistory", () => {
  it("keeps every rare record forever and drops stale regular records", () => {
    const records: ManagerQuipHistoryRecord[] = [
      makeHistoryRecord({
        triggerKey: "campaign.closures.five",
        cadence: "rare",
        shiftNumber: 1,
      }),
      makeHistoryRecord({
        triggerKey: "date.started",
        cadence: "regular",
        shiftNumber: 1,
      }),
      makeHistoryRecord({
        triggerKey: "date.started",
        cadence: "regular",
        shiftNumber: 5,
      }),
    ];
    const pruned = pruneManagerQuipHistory(records, 6);
    expect(pruned).toHaveLength(2);
    expect(pruned.some((record) => record.cadence === "rare")).toBe(true);
    expect(pruned.some((record) => record.shiftNumber === 5)).toBe(true);
  });

  it("appendManagerQuipHistory prunes stale entries before appending", () => {
    const records: ManagerQuipHistoryRecord[] = [
      makeHistoryRecord({
        triggerKey: "date.started",
        cadence: "regular",
        shiftNumber: 1,
      }),
    ];
    const next = appendManagerQuipHistory(
      records,
      makeHistoryRecord({ triggerKey: "date.ended", cadence: "regular", shiftNumber: 5 }),
      5,
    );
    expect(next.some((record) => record.triggerKey === "date.started")).toBe(false);
    expect(next.some((record) => record.triggerKey === "date.ended")).toBe(true);
  });
});

describe("pairEnteredBrittleTrajectory", () => {
  function makePairState(overrides: Partial<PairState["stats"]>): PairState {
    return {
      id: "pair-a",
      participantIds: ["member-a", "member-b"],
      stats: {
        chemistry: 60,
        trust: 60,
        stability: 60,
        conflict: 20,
        weirdnessTolerance: 50,
        spark: 60,
        strain: 20,
        relationshipHealth: 60,
        ...overrides,
      },
      completedDateIds: [],
      scenarioUseCounts: {},
      agreements: [],
      openLoops: [],
    };
  }

  it("fires only when the trajectory enters brittle from a non-brittle state", () => {
    const previousPair = makePairState({});
    const nextPair = makePairState({ strain: 85, conflict: 80 });

    expect(
      pairEnteredBrittleTrajectory({
        previousPairState: previousPair,
        nextPairState: nextPair,
        nextCompletedSessions: [],
      }),
    ).toBe(true);
  });

  it("does not fire when the pair was already brittle", () => {
    const previousPair = makePairState({ strain: 85, conflict: 80 });
    const nextPair = makePairState({ strain: 90, conflict: 82 });

    expect(
      pairEnteredBrittleTrajectory({
        previousPairState: previousPair,
        nextPairState: nextPair,
        nextCompletedSessions: [],
      }),
    ).toBe(false);
  });
});

describe("save diff detectors", () => {
  it("detectRetentionWarningDip flags an active member crossing below the warning threshold", () => {
    const base = createSeedGameSave(NOW);
    const targetId = base.members[0].id;
    const previous: GameSave = {
      ...base,
      members: base.members.map((member) =>
        member.id === targetId
          ? {
              ...member,
              state: { ...member.state, retention: MANAGER_RETENTION_WARNING_THRESHOLD },
            }
          : member,
      ),
    };
    const next: GameSave = {
      ...base,
      members: base.members.map((member) =>
        member.id === targetId
          ? {
              ...member,
              state: { ...member.state, retention: MANAGER_RETENTION_WARNING_THRESHOLD - 3 },
            }
          : member,
      ),
    };
    const dip = detectRetentionWarningDip(previous, next);
    expect(dip).not.toBeNull();
    expect(dip?.memberId).toBe(targetId);
  });

  it("detectRetentionWarningDip returns null when no member crosses the threshold", () => {
    const base = createSeedGameSave(NOW);
    const dip = detectRetentionWarningDip(base, base);
    expect(dip).toBeNull();
  });

  it("detectMemberQuitTransition fires when an active member transitions to quit", () => {
    const base = createSeedGameSave(NOW);
    const targetId = base.members[1].id;
    const next: GameSave = {
      ...base,
      members: base.members.map((member) =>
        member.id === targetId ? { ...member, state: { ...member.state, status: "quit" } } : member,
      ),
    };
    expect(detectMemberQuitTransition(base, next)).toBe(targetId);
  });

  it("detectFocusSwapDropOfActive flags a dropped active focus", () => {
    const base = createSeedGameSave(NOW);
    const fourFocus = base.members.slice(0, 4).map((member) => member.id);
    const previous: GameSave = { ...base, focusedMemberIds: fourFocus };
    const replacement = base.members[4].id;
    const next: GameSave = {
      ...previous,
      focusedMemberIds: [...fourFocus.slice(0, 3), replacement],
    };
    expect(detectFocusSwapDropOfActive(previous, next)).toBe(fourFocus[3]);
  });

  it("detectFocusSwapDropOfActive ignores closure or quit lifecycle drops", () => {
    const base = createSeedGameSave(NOW);
    const fourFocus = base.members.slice(0, 4).map((member) => member.id);
    const previous: GameSave = { ...base, focusedMemberIds: fourFocus };
    const closedMemberId = fourFocus[3];
    const next: GameSave = {
      ...previous,
      focusedMemberIds: fourFocus.slice(0, 3),
      members: previous.members.map((member) =>
        member.id === closedMemberId
          ? { ...member, state: { ...member.state, status: "closed" } }
          : member,
      ),
    };
    expect(detectFocusSwapDropOfActive(previous, next)).toBeNull();
  });
});

describe("shouldFireSoftWinQuip", () => {
  it("requires five closures and no prior soft-win record", () => {
    expect(shouldFireSoftWinQuip([], 5)).toBe(true);
    expect(shouldFireSoftWinQuip([], 4)).toBe(false);
    expect(
      shouldFireSoftWinQuip(
        [makeHistoryRecord({ triggerKey: "campaign.closures.five", cadence: "rare" })],
        7,
      ),
    ).toBe(false);
  });
});
