import { describe, expect, it } from "vitest";

import { dateSessionSchema, judgeSnapshotSchema, type DateMessage } from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import { applyDateConsequenceModel } from "./date-consequence-model";
import { createSeedGameSave, makePairId } from "./game-seed";
import { getPairProjectionFromSave } from "./relationship-index";

describe("date consequence model", () => {
  it("turns evidence into asymmetric mood and affect movement", () => {
    const { scenario, mira, calvin, session } = createConsequenceFixture();
    const rawJudge = judgeSnapshotSchema.parse({
      id: "judge-consequence-test",
      dateSessionId: session.id,
      exchangeIndex: 0,
      dateHealthDelta: 0,
      evidenceVector: {
        warmth: 1,
        attraction: 0,
        reciprocity: 0,
        repair: 0,
        boundaryRespect: -2,
        pressure: 6,
        avoidance: 2,
        novelty: 1,
        askProgress: -3,
      },
      statDeltas: {},
      memberMoodDeltas: {
        [mira.id]: 0,
        [calvin.id]: 0,
      },
      shouldEndEarly: false,
      endSentiment: null,
      notableMoments: ["The camera pressure took over."],
      playerSummary: "Photo wall pressure took over.",
      memoryCandidates: [],
    });

    const modeled = applyDateConsequenceModel({
      session,
      members: [mira, calvin],
      scenario,
      judgeSnapshot: rawJudge,
      exchangeMessages: [],
    });

    expect(modeled.dateHealthDelta).toBeLessThan(0);
    expect(modeled.statDeltas.conflict).toBeGreaterThan(0);
    expect(modeled.memberMoodDeltas[calvin.id]).toBeLessThan(modeled.memberMoodDeltas[mira.id]);
    expect(modelledAffect(modeled.memberAffects?.[calvin.id]?.affect)).toBe("angry");
  });

  it("only counts a nudge when the target answered after the intervention", () => {
    const { scenario, mira, calvin, session } = createConsequenceFixture();
    const nudgedSession = dateSessionSchema.parse({
      ...session,
      interventions: [
        {
          id: "intervention-mira",
          text: "Keep the pitch human.",
          targetMemberId: mira.id,
          usedAtTurn: 1,
        },
      ],
    });
    const rawJudge = judgeSnapshotSchema.parse({
      id: "judge-nudge-test",
      dateSessionId: nudgedSession.id,
      exchangeIndex: 0,
      dateHealthDelta: 0,
      evidenceVector: {
        warmth: 0,
        attraction: 0,
        reciprocity: 0,
        repair: 0,
        boundaryRespect: 0,
        pressure: 0,
        avoidance: 0,
        novelty: 0,
        askProgress: 0,
      },
      statDeltas: {},
      memberMoodDeltas: {
        [mira.id]: 0,
        [calvin.id]: 0,
      },
      shouldEndEarly: false,
      endSentiment: null,
      notableMoments: ["A neutral test exchange."],
      playerSummary: "Cupid filed a neutral exchange.",
      memoryCandidates: [],
    });
    const noTargetReply = applyDateConsequenceModel({
      session: nudgedSession,
      members: [mira, calvin],
      scenario,
      judgeSnapshot: rawJudge,
      exchangeMessages: [
        characterMessage({
          sessionId: nudgedSession.id,
          speakerId: calvin.id,
          turnIndex: 2,
          text: "Calvin Hewes answers before Mira can take the nudge.",
        }),
      ],
    });
    const withTargetReply = applyDateConsequenceModel({
      session: nudgedSession,
      members: [mira, calvin],
      scenario,
      judgeSnapshot: rawJudge,
      exchangeMessages: [
        characterMessage({
          sessionId: nudgedSession.id,
          speakerId: mira.id,
          turnIndex: 2,
          text: "Mira Park uses the nudge and asks a concrete question.",
        }),
      ],
    });

    expect(withTargetReply.memberMoodDeltas[mira.id]).toBeGreaterThan(
      noTargetReply.memberMoodDeltas[mira.id] ?? 0,
    );
    expect(withTargetReply.memberMoodDeltas[calvin.id]).toBe(
      noTargetReply.memberMoodDeltas[calvin.id],
    );
  });
});

function modelledAffect(value: string | undefined): string {
  if (value === undefined) {
    throw new Error("Expected modeled affect.");
  }
  return value;
}

function createConsequenceFixture() {
  const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
  const scenario = starterScenarios.find((candidate) => candidate.id === "soft-launch-photo-wall");
  const mira = starterMembers.find((member) => member.id === "mira-park");
  const calvin = starterMembers.find((member) => member.id === "calvin-hewes");

  if (scenario === undefined || mira === undefined || calvin === undefined) {
    throw new Error("Expected consequence model fixtures.");
  }

  const pairState = getPairProjectionFromSave(save, makePairId(mira.id, calvin.id));
  if (pairState === undefined) {
    throw new Error("Expected projected pair.");
  }

  return {
    scenario,
    mira,
    calvin,
    session: dateSessionSchema.parse({
      id: "date-consequence-test",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 12,
      currentTurn: 4,
      dateHealth: 60,
      status: "active",
      runtimeMode: "local_ai",
      participants: [mira.id, calvin.id],
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: [] },
      eventsTriggered: [],
      playbackState: "playing",
      endSentiment: null,
      interventions: [],
    }),
  };
}

function characterMessage({
  sessionId,
  speakerId,
  turnIndex,
  text,
}: {
  sessionId: string;
  speakerId: string;
  turnIndex: number;
  text: string;
}): DateMessage {
  return {
    id: `message-${speakerId}-${turnIndex}`,
    dateSessionId: sessionId,
    kind: "character",
    speakerId,
    turnIndex,
    sequenceIndex: turnIndex,
    text,
    createdAt: "2026-05-05T12:02:00.000Z",
  };
}
