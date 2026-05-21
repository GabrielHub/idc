import { describe, expect, it } from "vitest";

import {
  dateFinalReportSchema,
  dateSessionSchema,
  playerKnowledgeRecordSchema,
  shiftStateSchema,
  type DateSession,
  type Member,
  type PlayerKnowledgeRecord,
  type ShiftState,
} from "../domain/game";
import { applyDateFinalReportToMembers, classifyShiftRequestOutcomes } from "./date-engine";
import { createSeedGameSave } from "./game-seed";

const SHIFT_BASE = {
  id: "shift-1",
  shiftNumber: 1,
  status: "active",
  dateSlotsTotal: 1,
  dateSlotsUsed: 1,
  featuredMemberIds: ["jenna-pike"],
  drawnScenarioIds: [],
  companyGoalIds: [],
  startedAt: "2026-05-21T12:00:00.000Z",
} as const;

const SESSION_BASE = {
  id: "date-1-jenna-pike-test",
  pairId: "pair-jenna-pike--meridian-vale",
  scenarioId: "park-loop-with-a-dog",
  turnLimit: 2,
  currentTurn: 2,
  dateHealth: 60,
  status: "completed",
  runtimeMode: "local_ai",
  participants: ["jenna-pike", "meridian-vale"],
  transcript: [],
  privateStateByCharacter: {
    "jenna-pike": { mood: 60, comfort: 60, intent: "trying" },
    "meridian-vale": { mood: 60, comfort: 60, intent: "trying" },
  },
  judgeSnapshots: [],
  eventDraft: { offered: [], picked: [] },
  eventsTriggered: [],
  playbackState: "ended",
  endSentiment: null,
  interventions: [],
} as const;

function makeShift(requestIds: string[]): ShiftState {
  return shiftStateSchema.parse({
    ...SHIFT_BASE,
    memberRequestIds: requestIds,
  });
}

function makeCompletedSession(
  focusMemberId: string,
  focusRequestId: string,
  overrides: { id?: string } = {},
): DateSession {
  return dateSessionSchema.parse({
    ...SESSION_BASE,
    ...overrides,
    focusMemberId,
    focusRequestId,
  });
}

function makeAskRead(
  memberId: string,
  requestId: string,
  variant: "covered" | "blocked",
): PlayerKnowledgeRecord {
  return playerKnowledgeRecordSchema.parse({
    id: `member:${memberId}:ask-${variant}:${requestId}:judge-1`,
    subjectKind: "member",
    subjectId: memberId,
    readKind: "ask",
    readId: `member:${memberId}:ask-${variant}:${requestId}`,
    readText: "ask read",
    confidence: "filed",
    source: "judge",
    dateSessionId: SESSION_BASE.id,
    judgeSnapshotId: "judge-1",
    revealedAt: "2026-05-21T12:00:00.000Z",
  });
}

describe("classifyShiftRequestOutcomes", () => {
  it("marks an unbooked shift request as ignored", () => {
    const shift = makeShift(["request-jenna-normal-date"]);

    const outcomes = classifyShiftRequestOutcomes([], shift, []);

    expect(outcomes.get("request-jenna-normal-date")).toBe("ignored");
  });

  it("marks a booked request as missed when no ask read was filed", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const session = makeCompletedSession("jenna-pike", "request-jenna-normal-date");

    const outcomes = classifyShiftRequestOutcomes([], shift, [session]);

    expect(outcomes.get("request-jenna-normal-date")).toBe("missed");
  });

  it("marks a booked request as covered when ask-covered is in knowledge", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const session = makeCompletedSession("jenna-pike", "request-jenna-normal-date");
    const knowledge = [makeAskRead("jenna-pike", "request-jenna-normal-date", "covered")];

    const outcomes = classifyShiftRequestOutcomes(knowledge, shift, [session]);

    expect(outcomes.get("request-jenna-normal-date")).toBe("covered");
  });

  it("marks a booked request as raised when only ask-blocked is in knowledge", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const session = makeCompletedSession("jenna-pike", "request-jenna-normal-date");
    const knowledge = [makeAskRead("jenna-pike", "request-jenna-normal-date", "blocked")];

    const outcomes = classifyShiftRequestOutcomes(knowledge, shift, [session]);

    expect(outcomes.get("request-jenna-normal-date")).toBe("raised");
  });

  it("does not promote requests that are not on the shift roster", () => {
    const shift = makeShift(["request-jenna-normal-date"]);
    const session = makeCompletedSession("jenna-pike", "request-jenna-decent-driver", {
      id: "date-1-jenna-pike-other",
    });

    const outcomes = classifyShiftRequestOutcomes([], shift, [session]);

    expect(outcomes.has("request-jenna-decent-driver")).toBe(false);
    expect(outcomes.get("request-jenna-normal-date")).toBe("ignored");
  });
});

describe("applyDateFinalReportToMembers ask-state prefix", () => {
  const seed = createSeedGameSave(new Date("2026-05-21T12:00:00.000Z"));

  function getMember(id: string): Member {
    const member = seed.members.find((candidate) => candidate.id === id);
    if (member === undefined) {
      throw new Error(`Missing seed member ${id}`);
    }
    return member;
  }

  function makeSessionWithReport(
    focusMemberId: string,
    focusRequestId: string,
    outcome: "second_date" | "mixed" | "bad_fit",
  ): DateSession {
    const finalReport = dateFinalReportSchema.parse({
      id: `report-${SESSION_BASE.id}`,
      dateSessionId: SESSION_BASE.id,
      completedAt: "2026-05-21T12:00:00.000Z",
      outcome,
      summary: "summary",
      statSummary: "stat",
      recommendedFollowUp: outcome === "second_date" ? "encourage" : "repair",
      memoryRecordIds: [],
    });
    return dateSessionSchema.parse({
      ...SESSION_BASE,
      focusMemberId,
      focusRequestId,
      finalReport,
    });
  }

  it("prepends 'Ask covered.' to the focus member when ask-covered is recorded", () => {
    const session = makeSessionWithReport("jenna-pike", "request-jenna-normal-date", "second_date");
    const knowledge = [makeAskRead("jenna-pike", "request-jenna-normal-date", "covered")];

    const updated = applyDateFinalReportToMembers(
      [getMember("jenna-pike"), getMember("meridian-vale")],
      session,
      1,
      knowledge,
    );

    const focus = updated.find((member) => member.id === "jenna-pike");
    const partner = updated.find((member) => member.id === "meridian-vale");
    expect(focus?.state.recentDateResult).toMatch(/^Ask covered\./);
    expect(partner?.state.recentDateResult ?? "").not.toMatch(/Ask covered/);
  });

  it("prepends 'Booked, but the ask never landed.' when no ask read exists", () => {
    const session = makeSessionWithReport("jenna-pike", "request-jenna-normal-date", "mixed");

    const updated = applyDateFinalReportToMembers(
      [getMember("jenna-pike"), getMember("meridian-vale")],
      session,
      1,
      [],
    );

    const focus = updated.find((member) => member.id === "jenna-pike");
    expect(focus?.state.recentDateResult).toMatch(/^Booked, but the ask never landed\./);
  });

  it("prepends 'Ask raised' when ask-blocked is recorded", () => {
    const session = makeSessionWithReport("jenna-pike", "request-jenna-normal-date", "bad_fit");
    const knowledge = [makeAskRead("jenna-pike", "request-jenna-normal-date", "blocked")];

    const updated = applyDateFinalReportToMembers(
      [getMember("jenna-pike"), getMember("meridian-vale")],
      session,
      1,
      knowledge,
    );

    const focus = updated.find((member) => member.id === "jenna-pike");
    expect(focus?.state.recentDateResult).toMatch(/^Ask raised, room blocked it\./);
  });

  it("falls back to plain outcome text when no focusRequestId is set", () => {
    const session = dateSessionSchema.parse({
      ...SESSION_BASE,
      focusMemberId: "jenna-pike",
      finalReport: dateFinalReportSchema.parse({
        id: `report-${SESSION_BASE.id}`,
        dateSessionId: SESSION_BASE.id,
        completedAt: "2026-05-21T12:00:00.000Z",
        outcome: "second_date",
        summary: "summary",
        statSummary: "stat",
        recommendedFollowUp: "encourage",
        memoryRecordIds: [],
      }),
    });

    const updated = applyDateFinalReportToMembers(
      [getMember("jenna-pike"), getMember("meridian-vale")],
      session,
      1,
      [],
    );

    const focus = updated.find((member) => member.id === "jenna-pike");
    expect(focus?.state.recentDateResult ?? "").not.toMatch(/Ask|Booked/);
  });
});
