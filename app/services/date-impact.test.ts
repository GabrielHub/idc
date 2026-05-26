import { describe, expect, it } from "vitest";

import {
  dateFinalReportSchema,
  dateSessionSchema,
  type DateFinalReport,
  type DateSession,
  type JudgeSnapshot,
  type PairState,
  type PairStats,
} from "../domain/game";
import { memberRequests, starterMembers } from "../fixtures";
import { buildAskEvidenceId } from "./player-knowledge";
import { buildDateImpactReceipt } from "./date-impact";

const FOCUS_MEMBER_ID = "jenna-pike";
const PARTNER_MEMBER_ID = "vhool";
const PAIR_ID = "pair-impact-test";
const REQUEST = memberRequests.find((candidate) => candidate.memberId === FOCUS_MEMBER_ID);

if (REQUEST === undefined) {
  throw new Error("Expected Jenna request fixture.");
}

describe("date impact receipt", () => {
  it("puts closure-ready dates in closure language first", () => {
    const receipt = buildDateImpactReceipt({
      report: makeReport({ readyToClose: true, outcome: "second_date" }),
      session: makeSession({ focusRequestId: REQUEST.id }),
      save: {
        members: starterMembers,
        pairStates: [makePairState()],
      },
    });

    expect(receipt.verdict).toBe("ready_to_close");
    expect(receipt.verdictLabel).toBe("Closure ready");
    expect(receipt.campaignMeaning).toContain("ready to become a closure");
    expect(receipt.consequences).toContain("Closure is available in dispatch.");
  });

  it("treats a covered lead ask as useful progress without exposing stats", () => {
    const session = makeSession({
      focusRequestId: REQUEST.id,
      judgeSnapshots: [
        makeJudgeSnapshot({
          usedEvidenceIds: [buildAskEvidenceId(REQUEST.memberId, REQUEST.id, "covered")],
        }),
      ],
    });
    const receipt = buildDateImpactReceipt({
      report: makeReport({ outcome: "mixed", readyToClose: false }),
      session,
      save: {
        members: starterMembers,
        pairStates: [makePairState()],
      },
    });

    expect(receipt.verdict).toBe("closer_to_win");
    expect(receipt.verdictLabel).toBe("Closure gained ground");
    expect(receipt.reason).toContain("stronger closure path");
    expect(receipt.consequences).toContain("Lead ask landed.");
  });

  it("turns hard endings into loss-risk language", () => {
    const receipt = buildDateImpactReceipt({
      report: makeReport({ outcome: "early_end", recommendedFollowUp: "cool_down" }),
      session: makeSession({ status: "ended_early" }),
      save: {
        members: starterMembers,
        pairStates: [makePairState()],
      },
    });

    expect(receipt.verdict).toBe("closer_to_loss");
    expect(receipt.verdictLabel).toBe("Case risk rose");
    expect(receipt.campaignMeaning).toContain("harder to close");
    expect(receipt.nextAction).toBe("Cool Down");
  });

  it("surfaces the most important closure blocker concisely", () => {
    const receipt = buildDateImpactReceipt({
      report: makeReport({ outcome: "second_date", readyToClose: false }),
      session: makeSession({}),
      save: {
        members: starterMembers,
        pairStates: [
          makePairState({
            completedDateIds: ["date-impact-1", "date-impact-2", "date-impact-3"],
            openLoops: [
              {
                id: "open-loop-impact",
                text: "They still need to answer what happens after the next booking.",
                status: "open",
                sourceDateSessionId: "date-impact-1",
                createdAt: "2026-05-01T10:00:00.000Z",
              },
            ],
          }),
        ],
      },
    });

    expect(receipt.consequences).toContain("Still blocking closure: unresolved issue.");
  });
});

function makePairStats(overrides: Partial<PairStats> = {}): PairStats {
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

function makePairState(overrides: Partial<PairState> = {}): PairState {
  return {
    id: PAIR_ID,
    participantIds: [FOCUS_MEMBER_ID, PARTNER_MEMBER_ID],
    laneStatus: "open",
    stats: makePairStats(),
    completedDateIds: ["date-impact-1"],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
    ...overrides,
  };
}

function makeReport(overrides: Partial<DateFinalReport> = {}): DateFinalReport {
  return dateFinalReportSchema.parse({
    id: "final-date-impact",
    dateSessionId: "date-impact-1",
    completedAt: "2026-05-01T10:00:00.000Z",
    outcome: "second_date",
    summary: "Jenna and Vhool completed a test date.",
    statSummary: "Case read: the pair left with enough mutual signal.",
    recommendedFollowUp: "pursue",
    memoryRecordIds: [],
    readyToClose: false,
    ...overrides,
  });
}

function makeSession(overrides: Partial<DateSession> = {}): DateSession {
  return dateSessionSchema.parse({
    id: "date-impact-1",
    pairId: PAIR_ID,
    scenarioId: "temporal-coffee-shop",
    focusMemberId: FOCUS_MEMBER_ID,
    focusRequestId: undefined,
    turnLimit: 12,
    currentTurn: 12,
    dateHealth: 65,
    status: "completed",
    runtimeMode: "local_ai",
    participants: [FOCUS_MEMBER_ID, PARTNER_MEMBER_ID],
    transcript: [],
    privateStateByCharacter: {
      [FOCUS_MEMBER_ID]: { mood: 50, comfort: 50, intent: "hold the date conversation" },
      [PARTNER_MEMBER_ID]: { mood: 50, comfort: 50, intent: "hold the date conversation" },
    },
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: null,
    endReason: null,
    interventions: [],
    ...overrides,
  });
}

function makeJudgeSnapshot(overrides: Partial<JudgeSnapshot> = {}): JudgeSnapshot {
  return {
    id: "judge-impact-1",
    dateSessionId: "date-impact-1",
    exchangeIndex: 1,
    dateHealthDelta: 0,
    statDeltas: {},
    memberMoodDeltas: {},
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
    ...overrides,
  };
}
