import { describe, expect, it } from "vitest";

import type { JudgeSnapshot } from "../domain/game";
import { buildReactionSignals } from "./date-view-transcript";

const LEFT_MEMBER_ID = "left-member";
const RIGHT_MEMBER_ID = "right-member";

describe("date view reaction signals", () => {
  it("keeps standee reactions tied to each member mood delta", () => {
    const signals = buildReactionSignals(
      [
        makeJudgeSnapshot({
          dateHealthDelta: 3,
          statDeltas: {
            spark: 3,
            chemistry: 3,
            conflict: 4,
          },
          memberMoodDeltas: {
            [LEFT_MEMBER_ID]: -4,
            [RIGHT_MEMBER_ID]: 3,
          },
        }),
      ],
      LEFT_MEMBER_ID,
      RIGHT_MEMBER_ID,
    );

    const leftKinds = signals
      .filter((signal) => signal.side === "left")
      .map((signal) => signal.kind);
    const rightKinds = signals
      .filter((signal) => signal.side === "right")
      .map((signal) => signal.kind);

    expect(leftKinds).toContain("anger");
    expect(leftKinds).toContain("cry");
    expect(leftKinds).not.toContain("spark");
    expect(leftKinds).not.toContain("love");
    expect(rightKinds).toContain("spark");
    expect(rightKinds).toContain("love");
    expect(rightKinds).not.toContain("anger");
    expect(rightKinds).not.toContain("cry");
  });
});

function makeJudgeSnapshot({
  dateHealthDelta = 0,
  statDeltas = {},
  memberMoodDeltas = {},
}: {
  dateHealthDelta?: number;
  statDeltas?: JudgeSnapshot["statDeltas"];
  memberMoodDeltas?: Record<string, number>;
}): JudgeSnapshot {
  return {
    id: "judge-test",
    dateSessionId: "date-test",
    exchangeIndex: 1,
    dateHealthDelta,
    statDeltas,
    memberMoodDeltas,
    shouldEndEarly: false,
    endSentiment: null,
    notableMoments: ["Cupid observed a test exchange."],
    playerSummary: "Cupid filed the exchange.",
    memoryCandidates: [],
    usedEvidenceIds: [],
    agreementCandidates: [],
    agreementUpdates: [],
    openLoopCandidates: [],
    openLoopUpdates: [],
  };
}
