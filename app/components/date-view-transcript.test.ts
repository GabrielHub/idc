import { describe, expect, it } from "vitest";

import type { DateSession, JudgeSnapshot } from "../domain/game";
import { memberRequests, starterMembers } from "../fixtures";
import { buildAskEvidenceId } from "../services/player-knowledge";
import {
  buildLeadAskStatus,
  buildNudgeSuggestions,
  buildReactionSignals,
} from "./date-view-transcript";

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

describe("date view lead ask status", () => {
  const request = memberRequests.find((candidate) => candidate.memberId === "jenna-pike");

  if (request === undefined) {
    throw new Error("Expected Jenna request fixture.");
  }

  it("marks the live lead ask as drifting until Cupid files evidence", () => {
    const session = makeDateSession({
      focusRequestId: request.id,
      judgeSnapshots: [makeJudgeSnapshot({})],
    });

    expect(buildLeadAskStatus(session, starterMembers)?.kind).toBe("drifting");
    expect(
      buildNudgeSuggestions(session.judgeSnapshots, buildLeadAskStatus(session, starterMembers))[0],
    ).toContain("lead ask");
  });

  it("marks the live lead ask as covered when Cupid uses ask evidence", () => {
    const session = makeDateSession({
      focusRequestId: request.id,
      judgeSnapshots: [
        {
          ...makeJudgeSnapshot({}),
          usedEvidenceIds: [buildAskEvidenceId(request.memberId, request.id, "covered")],
        },
      ],
    });

    expect(buildLeadAskStatus(session, starterMembers)?.kind).toBe("covered");
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

function makeDateSession(overrides: Partial<DateSession>): DateSession {
  return {
    id: "date-test",
    pairId: "pair-test",
    scenarioId: "temporal-coffee-shop",
    focusMemberId: "jenna-pike",
    focusRequestId: undefined,
    turnLimit: 12,
    currentTurn: 6,
    dateHealth: 55,
    status: "active",
    runtimeMode: "local_ai",
    participants: ["jenna-pike", "vhool"],
    transcript: [],
    privateStateByCharacter: {
      "jenna-pike": { mood: 50, comfort: 50, intent: "hold the date conversation" },
      vhool: { mood: 50, comfort: 50, intent: "hold the date conversation" },
    },
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "paused",
    endSentiment: null,
    endReason: null,
    interventions: [],
    ...overrides,
  };
}
