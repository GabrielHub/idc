import { describe, expect, it } from "vitest";

import { dateSessionSchema, judgeSnapshotSchema } from "../domain/game";
import { starterScenarios } from "../fixtures";
import { createSeedGameSave, makePairId } from "./game-seed";
import {
  applyMatchFitToJudgeSnapshot,
  chooseRecommendedMatchCandidate,
  evaluateMatchFit,
  type MatchFitResult,
} from "./match-fit";

const SEED_DATE = new Date("2026-05-11T12:00:00.000Z");

function findMember(save: ReturnType<typeof createSeedGameSave>, memberId: string) {
  const member = save.members.find((candidate) => candidate.id === memberId);

  if (member === undefined) {
    throw new Error(`Expected member ${memberId}.`);
  }

  return member;
}

function findScenario(scenarioId: string) {
  const scenario = starterScenarios.find((candidate) => candidate.id === scenarioId);

  if (scenario === undefined) {
    throw new Error(`Expected scenario ${scenarioId}.`);
  }

  return scenario;
}

function makeFit({
  score,
  fitLevel = "strong",
  pressureLevel = "low",
  askSignal = "covered",
  boundaryRisk = null,
}: {
  score: number;
  fitLevel?: MatchFitResult["fitLevel"];
  pressureLevel?: MatchFitResult["pressureLevel"];
  askSignal?: MatchFitResult["askSignal"];
  boundaryRisk?: MatchFitResult["boundaryRisk"];
}): MatchFitResult {
  return {
    fitLevel,
    pressureLevel,
    askSignal,
    startingDateHealthDelta: score,
    boundaryRisk,
    blockedRequestIds: [],
    coveredRequestIds: [],
    internalRuleHits: [],
  };
}

describe("evaluateMatchFit", () => {
  it("requires mixed pair tags to come from opposite members", () => {
    const save = createSeedGameSave(SEED_DATE);
    const jenna = findMember(save, "jenna-pike");
    const sera = findMember(save, "sera-vohn");
    const scenario = findScenario("memory-course-dinner");
    const pairState = save.pairStates.find((state) => state.id === makePairId(jenna.id, sera.id));

    if (pairState === undefined) {
      throw new Error("Expected Jenna and Sera pair state.");
    }

    const fit = evaluateMatchFit({
      members: [jenna, sera],
      scenario,
      pairState,
    });

    expect(fit.internalRuleHits).not.toContain("pair:weirdness_displaced_recognition");
    expect(fit.startingDateHealthDelta).toBe(2);
  });

  it("keeps mixed pair bonuses when each side contributes a tag", () => {
    const save = createSeedGameSave(SEED_DATE);
    const sera = findMember(save, "sera-vohn");
    const opal = findMember(save, "opal-sunday");
    const scenario = findScenario("memory-course-dinner");
    const pairState = save.pairStates.find((state) => state.id === makePairId(sera.id, opal.id));

    if (pairState === undefined) {
      throw new Error("Expected Sera and Opal pair state.");
    }

    const fit = evaluateMatchFit({
      members: [sera, opal],
      scenario,
      pairState,
    });

    expect(fit.internalRuleHits).toContain("pair:weirdness_displaced_recognition");
  });
});

describe("chooseRecommendedMatchCandidate", () => {
  it("selects a strong candidate with a meaningful score lead", () => {
    const recommended = chooseRecommendedMatchCandidate([
      { candidate: "sera", fit: makeFit({ score: 8 }) },
      { candidate: "kade", fit: makeFit({ score: 4 }) },
    ]);

    expect(recommended).toBe("sera");
  });

  it("returns no recommendation when the top candidates are too close", () => {
    const recommended = chooseRecommendedMatchCandidate([
      { candidate: "sera", fit: makeFit({ score: 8 }) },
      { candidate: "vhool", fit: makeFit({ score: 6 }) },
    ]);

    expect(recommended).toBeNull();
  });

  it("returns no recommendation when the best score is only least bad", () => {
    const recommended = chooseRecommendedMatchCandidate([
      { candidate: "sera", fit: makeFit({ score: 4 }) },
      { candidate: "kade", fit: makeFit({ score: -2, fitLevel: "neutral" }) },
    ]);

    expect(recommended).toBeNull();
  });

  it("filters blocked, high pressure, and boundary risk candidates before recommending", () => {
    const recommended = chooseRecommendedMatchCandidate([
      { candidate: "blocked", fit: makeFit({ score: 12, askSignal: "blocked" }) },
      {
        candidate: "boundary",
        fit: makeFit({ score: 11, boundaryRisk: { memberId: "x", reason: "Risk." } }),
      },
      { candidate: "pressure", fit: makeFit({ score: 10, pressureLevel: "high" }) },
      { candidate: "clean", fit: makeFit({ score: 7 }) },
    ]);

    expect(recommended).toBe("clean");
  });
});

describe("applyMatchFitToJudgeSnapshot", () => {
  it("does not override a positive judge read for a risky booking", () => {
    const save = createSeedGameSave(SEED_DATE);
    const opal = findMember(save, "opal-sunday");
    const wenshu = findMember(save, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = save.pairStates.find((state) => state.id === makePairId(opal.id, wenshu.id));

    if (pairState === undefined) {
      throw new Error("Expected Opal and Wenshu pair state.");
    }

    const fit = evaluateMatchFit({
      members: [opal, wenshu],
      scenario,
      pairState,
    });
    const session = dateSessionSchema.parse({
      id: "test-risky-booking",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 24,
      currentTurn: 6,
      dateHealth: 48,
      status: "active",
      runtimeMode: "local_ai",
      participants: pairState.participantIds,
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing",
      endSentiment: null,
      interventions: [],
    });
    const judgeSnapshot = judgeSnapshotSchema.parse({
      id: "judge-positive-risk",
      dateSessionId: session.id,
      exchangeIndex: 0,
      dateHealthDelta: 5,
      statDeltas: {
        trust: 4,
        relationshipHealth: 4,
      },
      memberMoodDeltas: {
        [opal.id]: 2,
        [wenshu.id]: 2,
      },
      shouldEndEarly: false,
      endSentiment: "positive",
      notableMoments: ["Opal challenged the prophecy frame and Wenshu answered plainly."],
      playerSummary: "Cupid filed a clean objection and a cleaner answer.",
      memoryCandidates: [],
      usedEvidenceIds: [],
    });

    const result = applyMatchFitToJudgeSnapshot({
      session,
      pairState,
      judgeSnapshot,
    });

    expect(fit.boundaryRisk).not.toBeNull();
    expect(result.dateHealthDelta).toBe(5);
    expect(result.statDeltas).toEqual(judgeSnapshot.statDeltas);
    expect(result.memberMoodDeltas).toEqual(judgeSnapshot.memberMoodDeltas);
    expect(result.shouldEndEarly).toBe(false);
  });

  it("escalates a sharp negative exchange with visible tension into an early end", () => {
    const save = createSeedGameSave(SEED_DATE);
    const jenna = findMember(save, "jenna-pike");
    const vhool = findMember(save, "vhool");
    const scenario = findScenario("temporal-coffee-shop");
    const pairState = save.pairStates.find((state) => state.id === makePairId(jenna.id, vhool.id));

    if (pairState === undefined) {
      throw new Error("Expected Jenna and Vhool pair state.");
    }

    const session = dateSessionSchema.parse({
      id: "test-negative-exchange",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 24,
      currentTurn: 6,
      dateHealth: 48,
      status: "active",
      runtimeMode: "local_ai",
      participants: pairState.participantIds,
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing",
      endSentiment: null,
      interventions: [],
    });
    const judgeSnapshot = judgeSnapshotSchema.parse({
      id: "judge-sharp-negative",
      dateSessionId: session.id,
      exchangeIndex: 0,
      dateHealthDelta: -10,
      statDeltas: {
        conflict: 4,
        strain: 5,
        relationshipHealth: -7,
      },
      memberMoodDeltas: {
        [jenna.id]: -4,
        [vhool.id]: -3,
      },
      shouldEndEarly: false,
      endSentiment: null,
      notableMoments: ["The receipt got personal and Jenna stopped answering."],
      playerSummary: "Cupid filed the receipt as hostile.",
      memoryCandidates: [],
      usedEvidenceIds: [],
    });

    const result = applyMatchFitToJudgeSnapshot({
      session,
      pairState,
      judgeSnapshot,
    });

    expect(result.dateHealthDelta).toBe(-10);
    expect(result.statDeltas).toEqual(judgeSnapshot.statDeltas);
    expect(result.memberMoodDeltas).toEqual(judgeSnapshot.memberMoodDeltas);
    expect(result.shouldEndEarly).toBe(true);
    expect(result.earlyEndReason).toBe("Member boundary crossed walkout threshold.");
    expect(result.endSentiment).toBe("negative");
    expect(result.notableMoments[0]).toBe("Member boundary crossed walkout threshold.");
  });
});
