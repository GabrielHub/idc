import { describe, expect, it } from "vitest";

import { dateFinalReportSchema, dateSessionSchema, judgeSnapshotSchema } from "../domain/game";
import { computeAppliedDateStatChange } from "./date-engine";
import { computeDateStatChange, hasMemberChange, hasPairChange } from "./date-stat-change";
import { createSeedGameSave } from "./game-seed";

function buildSession(
  overrides: {
    judgeSnapshots?: ReturnType<typeof judgeSnapshotSchema.parse>[];
    outcome?: "second_date" | "mixed" | "cool_down" | "bad_fit" | "early_end";
  } = {},
) {
  const finalReport =
    overrides.outcome === undefined
      ? undefined
      : dateFinalReportSchema.parse({
          id: "final-test",
          dateSessionId: "date-test",
          completedAt: "2026-05-05T12:00:00.000Z",
          outcome: overrides.outcome,
          summary: "Test summary.",
          statSummary: "Test stats.",
          recommendedFollowUp: "pursue",
          memoryRecordIds: ["m1", "m2", "m3", "m4"],
          readyToClose: false,
        });
  return dateSessionSchema.parse({
    id: "date-test",
    pairId: "pair-test",
    scenarioId: "temporal-coffee-shop",
    turnLimit: 4,
    currentTurn: 4,
    dateHealth: 60,
    status: "completed",
    runtimeMode: "local_ai",
    participants: ["alice", "ben"],
    transcript: [],
    privateStateByCharacter: {},
    judgeSnapshots: overrides.judgeSnapshots ?? [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: null,
    finalReport,
  });
}

function buildJudgeSnapshot(
  statDeltas: Partial<Record<"chemistry" | "trust" | "strain" | "relationshipHealth", number>>,
  memberMoodDeltas: Record<string, number>,
  index = 0,
) {
  return judgeSnapshotSchema.parse({
    id: `judge-${index}`,
    dateSessionId: "date-test",
    exchangeIndex: index,
    dateHealthDelta: 0,
    statDeltas,
    memberMoodDeltas,
    shouldEndEarly: false,
    notableMoments: ["judged"],
    playerSummary: "Player summary.",
    memoryCandidates: [],
  });
}

describe("computeDateStatChange", () => {
  it("returns empty deltas for a session with no snapshots and no outcome", () => {
    const change = computeDateStatChange(buildSession());
    expect(hasPairChange(change)).toBe(false);
    expect(change.members.alice).toEqual({ mood: 0, retention: 0, burnout: 0 });
    expect(change.members.ben).toEqual({ mood: 0, retention: 0, burnout: 0 });
  });

  it("aggregates statDeltas and memberMoodDeltas across judge snapshots", () => {
    const change = computeDateStatChange(
      buildSession({
        judgeSnapshots: [
          buildJudgeSnapshot({ chemistry: 4, trust: 2 }, { alice: 3, ben: -1 }, 0),
          buildJudgeSnapshot({ chemistry: 2, strain: -3 }, { alice: 2, ben: 1 }, 1),
        ],
      }),
    );
    expect(change.pair.chemistry).toBe(6);
    expect(change.pair.trust).toBe(2);
    expect(change.pair.strain).toBe(-3);
    expect(change.members.alice.mood).toBe(5);
    expect(change.members.ben.mood).toBe(0);
  });

  it("adds the outcome retention and burnout deltas on top of judge mood", () => {
    const change = computeDateStatChange(
      buildSession({
        judgeSnapshots: [buildJudgeSnapshot({}, { alice: 2, ben: 1 }, 0)],
        outcome: "bad_fit",
      }),
    );
    expect(change.members.alice.retention).toBe(-14);
    expect(change.members.alice.burnout).toBe(6);
    expect(change.members.alice.mood).toBe(2 + -7);
    expect(hasMemberChange(change, "alice")).toBe(true);
  });

  it("uses the outcome retention bump on a second_date outcome", () => {
    const change = computeDateStatChange(
      buildSession({
        judgeSnapshots: [],
        outcome: "second_date",
      }),
    );
    expect(change.members.alice.retention).toBe(2);
    expect(change.members.alice.burnout).toBe(-2);
  });
});

describe("computeAppliedDateStatChange", () => {
  it("reports actual clamped start-to-finish deltas from session snapshots", () => {
    const seed = createSeedGameSave();
    const first = seed.members[0];
    const second = seed.members[1];
    const session = dateSessionSchema.parse({
      ...buildSession({ outcome: "bad_fit" }),
      participants: [first.id, second.id],
      initialPairStats: {
        chemistry: 95,
        trust: 50,
        stability: 50,
        conflict: 20,
        weirdnessTolerance: 50,
        spark: 50,
        strain: 35,
        relationshipHealth: 69,
      },
      initialMemberStates: {
        [first.id]: { mood: 98, retention: 10, burnout: 96 },
        [second.id]: { mood: 40, retention: 70, burnout: 10 },
      },
    });
    const finalMembers = seed.members.map((member) => {
      if (member.id === first.id) {
        return {
          ...member,
          state: { ...member.state, mood: 100, retention: 0, burnout: 100 },
        };
      }
      if (member.id === second.id) {
        return {
          ...member,
          state: { ...member.state, mood: 35, retention: 63, burnout: 14 },
        };
      }
      return member;
    });

    const change = computeAppliedDateStatChange({
      session,
      finalPairStats: {
        chemistry: 100,
        trust: 45,
        stability: 50,
        conflict: 20,
        weirdnessTolerance: 50,
        spark: 50,
        strain: 35,
        relationshipHealth: 72,
      },
      finalMembers,
    });

    expect(change?.pair.chemistry).toBe(5);
    expect(change?.pair.trust).toBe(-5);
    expect(change?.pair.relationshipHealth).toBe(3);
    expect(change?.members[first.id]).toEqual({ mood: 2, retention: -10, burnout: 4 });
    expect(change?.members[second.id]).toEqual({ mood: -5, retention: -7, burnout: 4 });
  });
});
