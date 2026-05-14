import { describe, expect, it } from "vitest";

import {
  dateSessionSchema,
  judgeSnapshotSchema,
  pairStateSchema,
  type DateSession,
  type JudgeSnapshot,
  type PairState,
} from "../domain/game";
import {
  AGREEMENT_BROKEN_TAG,
  applyCompletedDatePairMemoryEffects,
  applyFollowUpPairMemoryEffects,
  applyJudgePairMemoryEffects,
  OPEN_LOOP_DROPPED_TAG,
  OPEN_LOOP_RESOLVED_TAG,
  OPEN_LOOP_TAG,
  PAIR_AGREEMENT_TAG,
  selectPairSpotlightItem,
} from "./pair-memory";

const NOW = "2026-05-05T12:10:00.000Z";

function buildPairState(overrides: Partial<PairState> = {}): PairState {
  return pairStateSchema.parse({
    id: "pair-jenna-pike-vhool",
    participantIds: ["jenna-pike", "vhool"],
    stats: {
      chemistry: 50,
      trust: 50,
      stability: 50,
      conflict: 20,
      weirdnessTolerance: 50,
      spark: 50,
      strain: 20,
      relationshipHealth: 50,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
    ...overrides,
  });
}

function buildJudgeSnapshot(overrides: Partial<JudgeSnapshot> = {}): JudgeSnapshot {
  return judgeSnapshotSchema.parse({
    id: "judge-1",
    dateSessionId: "date-session-1",
    exchangeIndex: 2,
    dateHealthDelta: 0,
    statDeltas: {},
    memberMoodDeltas: {},
    shouldEndEarly: false,
    endSentiment: null,
    notableMoments: ["Cupid filed the table noise."],
    playerSummary: "Cupid filed the exchange.",
    memoryCandidates: [],
    usedEvidenceIds: [],
    agreementCandidates: [],
    agreementUpdates: [],
    openLoopCandidates: [],
    openLoopUpdates: [],
    ...overrides,
  });
}

function buildDateSession(overrides: Partial<DateSession> = {}): DateSession {
  return dateSessionSchema.parse({
    id: "date-session-3",
    pairId: "pair-jenna-pike-vhool",
    scenarioId: "temporal-coffee-shop",
    turnLimit: 24,
    currentTurn: 24,
    dateHealth: 70,
    status: "completed",
    runtimeMode: "local_ai",
    participants: ["jenna-pike", "vhool"],
    transcript: [],
    privateStateByCharacter: {},
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: null,
    interventions: [],
    finalReport: {
      id: "final-date-session-3",
      dateSessionId: "date-session-3",
      completedAt: NOW,
      outcome: "second_date",
      summary: "Cupid filed a completed date.",
      statSummary: "Case read: pair memory test.",
      recommendedFollowUp: "encourage",
      memoryRecordIds: [],
      readyToClose: false,
    },
    ...overrides,
  });
}

describe("pair memory effects", () => {
  it("creates deduped agreements and mirrors them into public pair memories", () => {
    const result = applyJudgePairMemoryEffects({
      pairState: buildPairState(),
      judgeSnapshot: buildJudgeSnapshot({
        agreementCandidates: [
          { text: "No filming at the table." },
          { text: "No filming at the table" },
        ],
      }),
      timestamp: NOW,
    });

    expect(result.pairState.agreements).toHaveLength(1);
    expect(result.pairState.agreements[0]).toMatchObject({
      text: "No filming at the table.",
      status: "active",
      sourceDateSessionId: "date-session-1",
      sourceJudgeSnapshotId: "judge-1",
    });
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0]?.visibility).toBe("public");
    expect(result.memories[0]?.tags).toContain(PAIR_AGREEMENT_TAG);
    expect(result.memories[0]?.text).toContain("Agreement filed");
  });

  it("updates active agreements and rejects fabricated agreement ids", () => {
    const pairState = buildPairState({
      agreements: [
        {
          id: "agreement-existing",
          text: "No public archive questions.",
          status: "active",
          sourceDateSessionId: "date-session-0",
          sourceJudgeSnapshotId: "judge-0",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
      ],
    });
    const result = applyJudgePairMemoryEffects({
      pairState,
      judgeSnapshot: buildJudgeSnapshot({
        agreementUpdates: [
          {
            agreementId: "agreement-missing",
            status: "broken",
            note: "The judge invented this id.",
          },
          {
            agreementId: "agreement-existing",
            status: "broken",
            note: "Ryan asked it in public.",
          },
        ],
      }),
      timestamp: NOW,
    });

    expect(result.pairState.agreements).toHaveLength(1);
    expect(result.pairState.agreements[0]?.status).toBe("broken");
    expect(result.pairState.agreements[0]?.resolvedAt).toBe(NOW);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0]?.tags).toContain(AGREEMENT_BROKEN_TAG);
    expect(result.memories[0]?.text).toContain("Ryan asked it in public.");
  });

  it("creates and resolves open loops without accepting duplicate concepts", () => {
    const created = applyJudgePairMemoryEffects({
      pairState: buildPairState(),
      judgeSnapshot: buildJudgeSnapshot({
        openLoopCandidates: [
          { text: "Whether Vhool can return the receipt without ceremony." },
          { text: "Whether Vhool can return the receipt without ceremony" },
        ],
      }),
      timestamp: NOW,
    });
    const loopId = created.pairState.openLoops[0]?.id;

    if (loopId === undefined) {
      throw new Error("Expected created loop id.");
    }

    const resolved = applyJudgePairMemoryEffects({
      pairState: created.pairState,
      judgeSnapshot: buildJudgeSnapshot({
        id: "judge-2",
        openLoopUpdates: [
          {
            openLoopId: loopId,
            status: "resolved",
            note: "The receipt was returned calmly.",
          },
        ],
      }),
      timestamp: "2026-05-05T12:20:00.000Z",
    });

    expect(created.pairState.openLoops).toHaveLength(1);
    expect(created.memories[0]?.tags).toContain(OPEN_LOOP_TAG);
    expect(resolved.pairState.openLoops[0]?.status).toBe("resolved");
    expect(resolved.memories).toHaveLength(1);
    expect(resolved.memories[0]?.tags).toContain(OPEN_LOOP_RESOLVED_TAG);
  });

  it("drops stale open loops and rejects updates to already closed loops", () => {
    const pairState = buildPairState({
      openLoops: [
        {
          id: "loop-open",
          text: "Whether the venue choice survives daylight.",
          status: "open",
          sourceDateSessionId: "date-session-0",
          sourceJudgeSnapshotId: "judge-0",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
        {
          id: "loop-resolved",
          text: "Whether soup counts as a plan.",
          status: "resolved",
          sourceDateSessionId: "date-session-0",
          sourceJudgeSnapshotId: "judge-0",
          createdAt: "2026-05-05T11:00:00.000Z",
          resolvedAt: "2026-05-05T11:30:00.000Z",
        },
      ],
    });
    const result = applyJudgePairMemoryEffects({
      pairState,
      judgeSnapshot: buildJudgeSnapshot({
        openLoopUpdates: [
          { openLoopId: "loop-open", status: "dropped", note: "The venue was no longer relevant." },
          { openLoopId: "loop-resolved", status: "dropped", note: "Do not reopen closed loops." },
        ],
      }),
      timestamp: NOW,
    });

    expect(result.pairState.openLoops.find((loop) => loop.id === "loop-open")?.status).toBe(
      "dropped",
    );
    expect(result.pairState.openLoops.find((loop) => loop.id === "loop-resolved")?.status).toBe(
      "resolved",
    );
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0]?.tags).toContain(OPEN_LOOP_DROPPED_TAG);
  });

  it("honors active agreements after two later completed dates", () => {
    const pairState = buildPairState({
      completedDateIds: ["date-session-1", "date-session-2", "date-session-3"],
      agreements: [
        {
          id: "agreement-kept",
          text: "No filming at the table.",
          status: "active",
          sourceDateSessionId: "date-session-1",
          sourceJudgeSnapshotId: "judge-1",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
      ],
    });

    const result = applyCompletedDatePairMemoryEffects({
      pairState,
      session: buildDateSession(),
      timestamp: NOW,
    });

    expect(result.pairState.agreements[0]?.status).toBe("honored");
    expect(result.pairState.agreements[0]?.resolvedAt).toBe(NOW);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0]?.tags).toContain(PAIR_AGREEMENT_TAG);
    expect(result.memories[0]?.text).toContain("Agreement honored");
  });

  it("prioritizes older open loops for spotlight without mutating state", () => {
    const pairState = buildPairState({
      completedDateIds: ["date-session-1", "date-session-2", "date-session-3"],
      agreements: [
        {
          id: "agreement-active",
          text: "Keep the receipt off the table.",
          status: "active",
          sourceDateSessionId: "date-session-2",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
      ],
      openLoops: [
        {
          id: "loop-old",
          text: "Whether Vhool can leave without auditing the receipt.",
          status: "open",
          sourceDateSessionId: "date-session-1",
          createdAt: "2026-05-05T11:10:00.000Z",
        },
      ],
    });

    const spotlight = selectPairSpotlightItem(pairState);

    expect(spotlight).toMatchObject({
      kind: "open_loop",
      id: "loop-old",
    });
    expect(pairState.openLoops[0]?.status).toBe("open");
  });

  it("applies follow-up pair memory effects without new schema fields", () => {
    const pairState = buildPairState({
      agreements: [
        {
          id: "agreement-broken",
          text: "No public archive questions.",
          status: "broken",
          sourceDateSessionId: "date-session-1",
          createdAt: "2026-05-05T11:00:00.000Z",
          resolvedAt: "2026-05-05T12:00:00.000Z",
        },
        {
          id: "agreement-active",
          text: "Keep the receipt off the table.",
          status: "active",
          sourceDateSessionId: "date-session-1",
          createdAt: "2026-05-05T11:10:00.000Z",
        },
      ],
      openLoops: [
        {
          id: "loop-open",
          text: "Whether Ryan can repair by walking Calvin out.",
          status: "open",
          sourceDateSessionId: "date-session-1",
          createdAt: "2026-05-05T11:15:00.000Z",
        },
      ],
    });

    const repaired = applyFollowUpPairMemoryEffects({
      pairState,
      session: buildDateSession({ status: "ended_early" }),
      action: "repair",
      timestamp: NOW,
    });
    const markedBadFit = applyFollowUpPairMemoryEffects({
      pairState,
      session: buildDateSession({
        finalReport: { ...buildDateSession().finalReport!, outcome: "bad_fit" },
      }),
      action: "mark_bad_fit",
      timestamp: NOW,
    });

    expect(
      repaired.pairState.agreements.some((agreement) => agreement.text.includes("Repair")),
    ).toBe(true);
    expect(repaired.memories.some((memory) => memory.tags.includes("follow_up"))).toBe(true);
    expect(
      markedBadFit.pairState.agreements.find((entry) => entry.id === "agreement-active")?.status,
    ).toBe("retired");
    expect(markedBadFit.pairState.openLoops[0]?.status).toBe("dropped");
  });
});
