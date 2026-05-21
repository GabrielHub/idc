import { describe, expect, it } from "vitest";

import { judgeSnapshotSchema, pairStateSchema } from "../domain/game";
import { applyJudgeToPairState } from "./date-engine";
import { deriveJudgeSnapshotPairStatDeltas } from "./pair-stats";

function buildPairState() {
  return pairStateSchema.parse({
    id: "pair-derived-stats",
    participantIds: ["member-a", "member-b"],
    stats: {
      chemistry: 50,
      trust: 50,
      stability: 50,
      conflict: 20,
      weirdnessTolerance: 50,
      spark: 50,
      strain: 40,
      relationshipHealth: 50,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
  });
}

describe("pair stat derivation", () => {
  it("ignores authored derived judge deltas when applying pair stats", () => {
    const pairState = buildPairState();
    const judgeSnapshot = judgeSnapshotSchema.parse({
      id: "judge-derived-stat-test",
      dateSessionId: "date-derived-stat-test",
      exchangeIndex: 0,
      dateHealthDelta: 0,
      statDeltas: {
        chemistry: 10,
        conflict: 10,
        relationshipHealth: -100,
        strain: 100,
      },
      memberMoodDeltas: {
        "member-a": 0,
        "member-b": 0,
      },
      shouldEndEarly: false,
      endSentiment: null,
      notableMoments: ["Cupid filed a math check."],
      playerSummary: "Cupid filed a math check.",
      memoryCandidates: [],
    });

    const result = applyJudgeToPairState(pairState, judgeSnapshot);

    expect(result.stats.chemistry).toBe(60);
    expect(result.stats.conflict).toBe(30);
    expect(result.stats.relationshipHealth).toBe(58);
    expect(result.stats.strain).toBe(40);
  });

  it("rewrites judge snapshot derived deltas from the projected primary stats", () => {
    const pairState = buildPairState();
    const judgeSnapshot = judgeSnapshotSchema.parse({
      id: "judge-derived-delta-test",
      dateSessionId: "date-derived-delta-test",
      exchangeIndex: 0,
      dateHealthDelta: 0,
      statDeltas: {
        chemistry: 10,
        conflict: 10,
        relationshipHealth: -100,
        strain: 100,
      },
      memberMoodDeltas: {
        "member-a": 0,
        "member-b": 0,
      },
      shouldEndEarly: false,
      endSentiment: null,
      notableMoments: ["Cupid filed a delta check."],
      playerSummary: "Cupid filed a delta check.",
      memoryCandidates: [],
    });

    const result = deriveJudgeSnapshotPairStatDeltas(pairState, judgeSnapshot);

    expect(result.statDeltas.chemistry).toBe(10);
    expect(result.statDeltas.conflict).toBe(10);
    expect(result.statDeltas.relationshipHealth).toBe(8);
    expect(result.statDeltas.strain).toBe(0);
  });
});
