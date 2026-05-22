import { describe, expect, it } from "vitest";

import type { DateSession, JudgeSnapshot } from "../domain/game";
import {
  MATCHMAKING_INTENT_LABEL,
  MATCHMAKING_INTENTS,
  deriveIntentOutcome,
  intentEchoLine,
} from "./matchmaking-intent";

type SessionLike = Pick<DateSession, "judgeSnapshots" | "dateHealth" | "endSentiment">;

function makeSession(overrides: Partial<SessionLike> = {}): SessionLike {
  return {
    judgeSnapshots: [],
    dateHealth: 50,
    endSentiment: null,
    ...overrides,
  };
}

function makeSnapshot(deltas: Partial<{ conflict: number; strain: number }>): JudgeSnapshot {
  return {
    id: "snapshot-1",
    dateSessionId: "session-1",
    exchangeIndex: 0,
    dateHealthDelta: 0,
    statDeltas: deltas,
    memberMoodDeltas: {},
    shouldEndEarly: false,
    endSentiment: null,
    notableMoments: ["beat"],
    playerSummary: "summary",
    memoryCandidates: [],
    usedEvidenceIds: [],
    agreementCandidates: [],
    agreementUpdates: [],
    openLoopCandidates: [],
    openLoopUpdates: [],
  };
}

describe("deriveIntentOutcome", () => {
  it("scores comfort as supported when the pair settled into a second date", () => {
    expect(
      deriveIntentOutcome({
        intent: "comfort",
        outcome: "second_date",
        session: makeSession(),
      }),
    ).toBe("supported");
  });

  it("scores comfort as unsupported when the room ended early", () => {
    expect(
      deriveIntentOutcome({
        intent: "comfort",
        outcome: "early_end",
        session: makeSession(),
      }),
    ).toBe("unsupported");
  });

  it("scores spark as supported only when health cleared the booking line", () => {
    expect(
      deriveIntentOutcome({
        intent: "spark",
        outcome: "second_date",
        session: makeSession({ dateHealth: 70 }),
      }),
    ).toBe("supported");

    expect(
      deriveIntentOutcome({
        intent: "spark",
        outcome: "second_date",
        session: makeSession({ dateHealth: 40 }),
      }),
    ).toBe("mixed");
  });

  it("scores surface as supported when judge filed friction", () => {
    expect(
      deriveIntentOutcome({
        intent: "surface",
        outcome: "mixed",
        session: makeSession({ judgeSnapshots: [makeSnapshot({ conflict: 4 })] }),
      }),
    ).toBe("supported");

    expect(
      deriveIntentOutcome({
        intent: "surface",
        outcome: "second_date",
        session: makeSession({ judgeSnapshots: [] }),
      }),
    ).toBe("unsupported");
  });

  it("scores repair as supported when strain eased without an early end", () => {
    expect(
      deriveIntentOutcome({
        intent: "repair",
        outcome: "mixed",
        session: makeSession({ judgeSnapshots: [makeSnapshot({ strain: -6 })] }),
      }),
    ).toBe("supported");

    expect(
      deriveIntentOutcome({
        intent: "repair",
        outcome: "early_end",
        session: makeSession({ judgeSnapshots: [makeSnapshot({ strain: -6 })] }),
      }),
    ).toBe("unsupported");
  });

  it("scores swing as supported only when the long shot landed", () => {
    expect(
      deriveIntentOutcome({
        intent: "swing",
        outcome: "second_date",
        session: makeSession(),
      }),
    ).toBe("supported");

    expect(
      deriveIntentOutcome({
        intent: "swing",
        outcome: "bad_fit",
        session: makeSession(),
      }),
    ).toBe("unsupported");

    expect(
      deriveIntentOutcome({
        intent: "swing",
        outcome: "mixed",
        session: makeSession(),
      }),
    ).toBe("mixed");
  });
});

describe("intentEchoLine", () => {
  it("uses the matchmaking sentence + outcome verdict for every intent", () => {
    for (const intent of MATCHMAKING_INTENTS) {
      const line = intentEchoLine(intent, "supported");
      expect(line).toContain("Cupid booked this");
      expect(line).toContain("supported");
    }
  });

  it("exposes a label for every intent", () => {
    for (const intent of MATCHMAKING_INTENTS) {
      expect(MATCHMAKING_INTENT_LABEL[intent]).toMatch(/.+/);
    }
  });
});
