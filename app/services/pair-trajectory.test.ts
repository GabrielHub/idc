import { describe, expect, it } from "vitest";

import {
  dateSessionSchema,
  judgeSnapshotSchema,
  pairStateSchema,
  type DateSession,
  type PairState,
} from "../domain/game";
import { selectPairSpotlightItem } from "./pair-memory";
import { derivePairTrajectory } from "./pair-trajectory";

function buildPairState(overrides: Partial<PairState> = {}): PairState {
  return pairStateSchema.parse({
    id: "pair-jenna-pike-vhool",
    participantIds: ["jenna-pike", "vhool"],
    stats: {
      chemistry: 60,
      trust: 60,
      stability: 60,
      conflict: 20,
      weirdnessTolerance: 55,
      spark: 60,
      strain: 20,
      relationshipHealth: 60,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
    ...overrides,
  });
}

function buildSession({
  id = "date-session-1",
  outcome = "mixed",
  appliedFollowUp,
  status = "completed",
  dateHealthDelta = 0,
}: {
  id?: string;
  outcome?: "second_date" | "mixed" | "cool_down" | "bad_fit" | "early_end";
  appliedFollowUp?: "encourage" | "cool_down" | "repair" | "mark_bad_fit";
  status?: "completed" | "ended_early";
  dateHealthDelta?: number;
} = {}): DateSession {
  return dateSessionSchema.parse({
    id,
    pairId: "pair-jenna-pike-vhool",
    scenarioId: "temporal-coffee-shop",
    turnLimit: 24,
    currentTurn: 4,
    dateHealth: 60,
    status,
    runtimeMode: "local_ai",
    participants: ["jenna-pike", "vhool"],
    transcript: [],
    privateStateByCharacter: {},
    judgeSnapshots: [
      judgeSnapshotSchema.parse({
        id: `${id}-judge-1`,
        dateSessionId: id,
        exchangeIndex: 1,
        dateHealthDelta,
        statDeltas: {},
        memberMoodDeltas: {},
        shouldEndEarly: status === "ended_early",
        endSentiment: null,
        notableMoments: ["Cupid filed the movement."],
        playerSummary: "Cupid filed the exchange.",
        memoryCandidates: [],
        usedEvidenceIds: [],
      }),
    ],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: null,
    interventions: [],
    finalReport: {
      id: `${id}-report`,
      dateSessionId: id,
      completedAt: "2026-05-05T12:30:00.000Z",
      outcome,
      summary: "Cupid filed a trajectory test.",
      statSummary: "Case read: trajectory test.",
      recommendedFollowUp: "repair",
      appliedFollowUp,
      memoryRecordIds: [],
      readyToClose: false,
    },
  });
}

describe("pair trajectory", () => {
  it("detects positive momentum", () => {
    const trajectory = derivePairTrajectory({
      pairState: buildPairState(),
      completedSessions: [buildSession({ dateHealthDelta: 8, outcome: "second_date" })],
    });

    expect(trajectory.state).toBe("warming");
  });

  it("detects recovery after repair", () => {
    const trajectory = derivePairTrajectory({
      pairState: buildPairState(),
      completedSessions: [buildSession({ appliedFollowUp: "repair", dateHealthDelta: -2 })],
    });

    expect(trajectory.state).toBe("recovering");
  });

  it("detects repeated mismatch as stuck", () => {
    const pairState = buildPairState({
      openLoops: [
        {
          id: "loop-1",
          text: "Whether Jenna can trust the menu.",
          status: "open",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
        {
          id: "loop-2",
          text: "Whether Vhool can stop auditing the coffee.",
          status: "open",
          createdAt: "2026-05-05T11:10:00.000Z",
        },
      ],
    });
    const trajectory = derivePairTrajectory({
      pairState,
      completedSessions: [
        buildSession({ id: "date-session-1", dateHealthDelta: 1 }),
        buildSession({ id: "date-session-2", dateHealthDelta: -1 }),
      ],
    });

    expect(trajectory.state).toBe("stuck");
    expect(selectPairSpotlightItem(pairState)?.kind).toBe("open_loop");
    expect(trajectory.subnotes.some((note) => note.includes("unresolved"))).toBe(true);
  });

  it("detects early end damage as brittle", () => {
    const trajectory = derivePairTrajectory({
      pairState: buildPairState(),
      completedSessions: [buildSession({ outcome: "early_end", status: "ended_early" })],
    });

    expect(trajectory.state).toBe("brittle");
  });

  it("detects closure runway near the threshold", () => {
    const trajectory = derivePairTrajectory({
      pairState: buildPairState({
        stats: {
          chemistry: 76,
          trust: 74,
          stability: 70,
          conflict: 12,
          weirdnessTolerance: 65,
          spark: 72,
          strain: 18,
          relationshipHealth: 74,
        },
        completedDateIds: ["date-session-1", "date-session-2"],
      }),
      completedSessions: [buildSession({ outcome: "second_date", dateHealthDelta: 3 })],
    });

    expect(trajectory.state).toBe("closure_runway");
    expect(trajectory.subnotes).toEqual([]);
  });

  it("adds hidden subnotes for warm low-trust files", () => {
    const trajectory = derivePairTrajectory({
      pairState: buildPairState({
        stats: {
          chemistry: 70,
          trust: 48,
          stability: 62,
          conflict: 18,
          weirdnessTolerance: 55,
          spark: 78,
          strain: 22,
          relationshipHealth: 64,
        },
      }),
    });

    expect(trajectory.subnotes).toContain(
      "Warmth is outrunning trust. Reward concrete follow-through over charm.",
    );
  });
});
