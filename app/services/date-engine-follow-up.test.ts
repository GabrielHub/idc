import { describe, expect, it } from "vitest";

import {
  dateSessionSchema,
  followUpActionSchema,
  gameSaveSchema,
  pairStateSchema,
  type DateFinalReport,
  type FollowUpAction,
} from "../domain/game";
import { applyFollowUpAction, previewFollowUpEffects } from "./date-engine";
import { MEMBER_QUIT_BUDGET_CUT } from "./budget";
import { createSeedGameSave } from "./game-seed";

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

  it("persists follow-up pair memory effects through the save path", () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const pairState = buildPairState();
    const session = buildSession("early_end");
    const save = gameSaveSchema.parse({
      ...seed,
      pairStates: [
        ...seed.pairStates.filter((candidate) => candidate.id !== pairState.id),
        pairState,
      ],
      dateSessions: [...seed.dateSessions, session],
    });

    const result = applyFollowUpAction(save, {
      dateSessionId: session.id,
      action: "repair",
    });
    const updatedPair = result.save.pairStates.find((candidate) => candidate.id === pairState.id);

    expect(updatedPair?.agreements.some((agreement) => agreement.text.includes("Repair"))).toBe(
      true,
    );
    expect(result.save.memories.some((memory) => memory.tags.includes("follow_up"))).toBe(true);
    expect(result.session.finalReport?.appliedFollowUp).toBe("repair");
  });

  it("records a budget cut when follow-up makes a member quit", () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const pairState = buildPairState();
    const session = buildSession("second_date");
    const save = gameSaveSchema.parse({
      ...seed,
      members: seed.members.map((member) =>
        member.id === "jenna-pike"
          ? { ...member, state: { ...member.state, retention: 3 } }
          : member,
      ),
      pairStates: [
        ...seed.pairStates.filter((candidate) => candidate.id !== pairState.id),
        pairState,
      ],
      dateSessions: [...seed.dateSessions, session],
    });

    const result = applyFollowUpAction(save, {
      dateSessionId: session.id,
      action: "mark_bad_fit",
    });
    const updatedMember = result.save.members.find((member) => member.id === "jenna-pike");

    expect(updatedMember?.state.status).toBe("quit");
    expect(result.save.budgetCap).toBe(save.budgetCap + MEMBER_QUIT_BUDGET_CUT);
    expect(
      result.save.budgetHistory.some((entry) =>
        entry.reasons.some((reason) => reason.kind === "member_quit"),
      ),
    ).toBe(true);
  });
});
