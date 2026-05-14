import { describe, expect, it } from "vitest";

import {
  dateSessionSchema,
  followUpActionSchema,
  pairStateSchema,
  type DateFinalReport,
  type FollowUpAction,
} from "../domain/game";
import { previewFollowUpEffects } from "./date-engine";

const OUTCOMES: readonly DateFinalReport["outcome"][] = [
  "second_date",
  "mixed",
  "cool_down",
  "bad_fit",
  "early_end",
];
const ACTIONS: readonly FollowUpAction[] = followUpActionSchema.options;

function buildPairState() {
  return pairStateSchema.parse({
    id: "pair-jenna-pike-vhool",
    participantIds: ["jenna-pike", "vhool"],
    stats: {
      chemistry: 50,
      trust: 52,
      stability: 50,
      conflict: 35,
      weirdnessTolerance: 55,
      spark: 48,
      strain: 42,
      relationshipHealth: 50,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [
      {
        id: "agreement-1",
        text: "No public archive questions.",
        status: "broken",
        createdAt: "2026-05-05T11:00:00.000Z",
        resolvedAt: "2026-05-05T12:00:00.000Z",
      },
    ],
    openLoops: [
      {
        id: "loop-1",
        text: "Whether Vhool can leave without auditing the receipt.",
        status: "open",
        createdAt: "2026-05-05T11:00:00.000Z",
      },
    ],
  });
}

function buildSession(outcome?: DateFinalReport["outcome"]) {
  return dateSessionSchema.parse({
    id: "date-session-follow-up",
    pairId: "pair-jenna-pike-vhool",
    scenarioId: "temporal-coffee-shop",
    turnLimit: 24,
    currentTurn: 4,
    dateHealth: 55,
    status: outcome === "early_end" ? "ended_early" : "completed",
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
    finalReport:
      outcome === undefined
        ? undefined
        : {
            id: "final-follow-up",
            dateSessionId: "date-session-follow-up",
            completedAt: "2026-05-05T12:30:00.000Z",
            outcome,
            summary: "Cupid filed a follow-up test.",
            statSummary: "Case read: follow-up test.",
            recommendedFollowUp: "repair",
            memoryRecordIds: [],
            readyToClose: false,
          },
  });
}

describe("outcome aware follow-up preview", () => {
  it.each(OUTCOMES.flatMap((outcome) => ACTIONS.map((action) => ({ outcome, action }))))(
    "previews $action after $outcome",
    ({ outcome, action }) => {
      const preview = previewFollowUpEffects(buildPairState(), buildSession(outcome), action);

      expect(preview.outcome).toBe(outcome);
      expect(preview.action).toBe(action);
      expect(preview.reasons).toContain(`outcome:${outcome}`);
      expect(Object.values(preview.nextStats).every((score) => score >= 0 && score <= 100)).toBe(
        true,
      );
    },
  );

  it("rejects follow-up previews before a final outcome exists", () => {
    expect(() => previewFollowUpEffects(buildPairState(), buildSession(), "repair")).toThrow(
      "Follow-up actions require a completed date report.",
    );
  });
});
