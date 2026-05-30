import { describe, expect, it } from "vitest";

import {
  dateFinalReportSchema,
  dateSessionSchema,
  judgeSnapshotSchema,
  pairStateSchema,
} from "../domain/game";
import { deriveEdgeClosureDetail } from "./edge-closure-detail";

function buildPair({
  stats = {},
  completedDateIds = [],
}: {
  stats?: Partial<{ strain: number; chemistry: number; trust: number; relationshipHealth: number }>;
  completedDateIds?: string[];
}) {
  return pairStateSchema.parse({
    id: "pair-test",
    participantIds: ["alice", "ben"],
    stats: {
      chemistry: 40,
      trust: 40,
      stability: 50,
      conflict: 20,
      weirdnessTolerance: 50,
      spark: 50,
      strain: 20,
      relationshipHealth: 40,
      ...stats,
    },
    completedDateIds,
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
  });
}

function buildSnapshot(statDeltas: Partial<Record<"chemistry" | "trust" | "strain", number>>) {
  return judgeSnapshotSchema.parse({
    id: "judge-0",
    dateSessionId: "date-1",
    exchangeIndex: 0,
    dateHealthDelta: 0,
    statDeltas,
    memberMoodDeltas: {},
    shouldEndEarly: false,
    notableMoments: ["judged"],
    playerSummary: "Summary.",
    memoryCandidates: [],
  });
}

function buildSession(id: string, judgeSnapshots: ReturnType<typeof buildSnapshot>[]) {
  return dateSessionSchema.parse({
    id,
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
    judgeSnapshots,
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: null,
    finalReport: dateFinalReportSchema.parse({
      id: "final-1",
      dateSessionId: id,
      completedAt: "2026-05-05T12:00:00.000Z",
      outcome: "second_date",
      summary: "Summary.",
      statSummary: "Stats.",
      recommendedFollowUp: "pursue",
      memoryRecordIds: ["m1", "m2", "m3", "m4"],
      readyToClose: false,
    }),
  });
}

describe("deriveEdgeClosureDetail", () => {
  it("returns no last-date delta and a steady trajectory with no completed dates", () => {
    const detail = deriveEdgeClosureDetail({ pairState: buildPair({}), dateSessions: [] });
    expect(detail.lastDate).toBeNull();
    expect(detail.trajectory).toBe("steady");
  });

  it("surfaces the pair stat swing from the pair's last completed date", () => {
    const session = buildSession("date-1", [buildSnapshot({ chemistry: 5, trust: 3, strain: -2 })]);
    const detail = deriveEdgeClosureDetail({
      pairState: buildPair({ completedDateIds: ["date-1"] }),
      dateSessions: [session],
    });
    expect(detail.lastDate).toEqual({ chemistry: 5, trust: 3, strain: -2 });
  });

  it("classifies a high-strain pair as a fragile trajectory", () => {
    const detail = deriveEdgeClosureDetail({
      pairState: buildPair({ stats: { strain: 75 } }),
      dateSessions: [],
    });
    expect(detail.trajectory).toBe("brittle");
  });
});
