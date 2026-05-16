import { describe, expect, it } from "vitest";

import { dateSessionSchema, judgeSnapshotSchema, type PlayerKnowledgeRecord } from "../domain/game";
import { memberRequests, starterScenarios } from "../fixtures";
import { createSeedGameSave, makePairId } from "./game-seed";
import {
  applyMatchFitToJudgeSnapshot,
  chooseRecommendedMatchCandidate,
  evaluateMatchFit,
  type MatchFitResult,
} from "./match-fit";
import { getPairProjectionFromSave } from "./relationship-index";

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

function findRequest(requestId: string) {
  const request = memberRequests.find((candidate) => candidate.id === requestId);

  if (request === undefined) {
    throw new Error(`Expected request ${requestId}.`);
  }

  return request;
}

function findPairState(
  save: ReturnType<typeof createSeedGameSave>,
  firstMemberId: string,
  secondMemberId: string,
) {
  const pairState = getPairProjectionFromSave(save, makePairId(firstMemberId, secondMemberId));

  if (pairState === undefined) {
    throw new Error(`Expected ${firstMemberId} and ${secondMemberId} pair projection.`);
  }

  return pairState;
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
    const pairState = getPairProjectionFromSave(save, makePairId(jenna.id, sera.id));

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
    const pairState = getPairProjectionFromSave(save, makePairId(sera.id, opal.id));

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

  it("covers Imani and Sienna's bright fandom asks without generic performer blocking", () => {
    const save = createSeedGameSave(SEED_DATE);
    const imani = findMember(save, "imani-wallace");
    const sienna = findMember(save, "sienna-bae");
    const scenario = findScenario("diner-eleven-pm");
    const pairState = findPairState(save, imani.id, sienna.id);
    const request = findRequest("request-imani-show-recommendation");

    const fit = evaluateMatchFit({
      members: [imani, sienna],
      scenario,
      pairState,
      activeRequests: [request],
    });

    expect(fit.fitLevel).toBe("strong");
    expect(fit.askSignal).toBe("covered");
    expect(fit.coveredRequestIds).toContain(request.id);
    expect(fit.blockedRequestIds).not.toContain(request.id);
    expect(fit.internalRuleHits).toContain("imani:shift_hour_real_place");
    expect(fit.internalRuleHits).toContain("sienna:post_rehearsal_late_booth");
    expect(fit.internalRuleHits).toContain("pair:imani_sienna_bright_fan_overlap");
    expect(fit.internalRuleHits).toContain("request:imani_sincere_followup_covered");
  });

  it("blocks Sienna's label-sensitive ask at the photo wall with Kade", () => {
    const save = createSeedGameSave(SEED_DATE);
    const sienna = findMember(save, "sienna-bae");
    const kade = findMember(save, "kade-sumner");
    const scenario = findScenario("soft-launch-photo-wall");
    const pairState = findPairState(save, sienna.id, kade.id);
    const request = findRequest("request-sienna-work-is-work");

    const fit = evaluateMatchFit({
      members: [sienna, kade],
      scenario,
      pairState,
      activeRequests: [request],
    });

    expect(fit.fitLevel).toBe("risky");
    expect(fit.pressureLevel).toBe("high");
    expect(fit.askSignal).toBe("blocked");
    expect(fit.blockedRequestIds).toContain(request.id);
    expect(fit.internalRuleHits).toContain("sienna:label_clause_camera_pressure");
    expect(fit.internalRuleHits).toContain("pair:sienna_kade_label_clause");
    expect(fit.internalRuleHits).toContain("request:soft_launch_camera_blocks_target_asks");
  });

  it("keeps Anansi and Mei's story craft visible over generic sincerity friction", () => {
    const save = createSeedGameSave(SEED_DATE);
    const anansi = findMember(save, "anansi");
    const mei = findMember(save, "mei-sato");
    const scenario = findScenario("hotel-bar-last-call");
    const pairState = findPairState(save, anansi.id, mei.id);
    const request = findRequest("request-anansi-call-the-lie");

    const fit = evaluateMatchFit({
      members: [anansi, mei],
      scenario,
      pairState,
      activeRequests: [request],
    });

    expect(fit.fitLevel).toBe("strong");
    expect(fit.askSignal).toBe("covered");
    expect(fit.coveredRequestIds).toContain(request.id);
    expect(fit.internalRuleHits).toContain("anansi:long_story_room");
    expect(fit.internalRuleHits).toContain("pair:anansi_mei_story_craft");
    expect(fit.internalRuleHits).toContain("request:anansi_story_partner_covered");
  });

  it("uses pair memory and earned reads as conservative hidden booking pressure", () => {
    const save = createSeedGameSave(SEED_DATE);
    const anansi = findMember(save, "anansi");
    const mei = findMember(save, "mei-sato");
    const scenario = findScenario("hotel-bar-last-call");
    const pairState = {
      ...findPairState(save, anansi.id, mei.id),
      agreements: [
        {
          id: "agreement-honored",
          text: "Call the small lie once and let the story finish.",
          status: "honored" as const,
          sourceDateSessionId: "date-session-1",
          createdAt: "2026-05-05T11:00:00.000Z",
          resolvedAt: "2026-05-05T12:00:00.000Z",
        },
      ],
      openLoops: [
        {
          id: "loop-open-1",
          text: "Whether Anansi lets Mei call the next small lie.",
          status: "open" as const,
          sourceDateSessionId: "date-session-1",
          createdAt: "2026-05-05T11:10:00.000Z",
        },
        {
          id: "loop-open-2",
          text: "Whether Mei lets the story finish twice.",
          status: "open" as const,
          sourceDateSessionId: "date-session-2",
          createdAt: "2026-05-05T11:20:00.000Z",
        },
      ],
    };
    const warmRead: PlayerKnowledgeRecord = {
      id: "read-warm",
      subjectKind: "pair",
      subjectId: pairState.id,
      readKind: "pair_dynamic",
      readId: `pair:${pairState.id}:dynamic:weirdness-recognition`,
      readText: "Weirdness and displacement recognize each other across the table.",
      confidence: "filed",
      source: "judge",
      revealedAt: SEED_DATE.toISOString(),
    };

    const fit = evaluateMatchFit({
      members: [anansi, mei],
      scenario,
      pairState,
      knownPairReads: [warmRead],
    });

    expect(fit.internalRuleHits).toContain("pair:honored_agreement_momentum");
    expect(fit.internalRuleHits).toContain("pair:open_loop_crowding");
    expect(fit.internalRuleHits).toContain("pair:known_warm_dynamic");
  });

  it("blocks Nawal's closed Office ask when the room and partner reopen that frame", () => {
    const save = createSeedGameSave(SEED_DATE);
    const nawal = findMember(save, "nawal-marrash");
    const wenshu = findMember(save, "bai-wenshu");
    const scenario = findScenario("underworld-department-mixer");
    const pairState = findPairState(save, nawal.id, wenshu.id);
    const request = findRequest("request-nawal-office-closed");

    const fit = evaluateMatchFit({
      members: [nawal, wenshu],
      scenario,
      pairState,
      activeRequests: [request],
    });

    expect(fit.fitLevel).toBe("risky");
    expect(fit.pressureLevel).toBe("high");
    expect(fit.askSignal).toBe("blocked");
    expect(fit.blockedRequestIds).toContain(request.id);
    expect(fit.internalRuleHits).toContain("nawal:office_reopened_room");
    expect(fit.internalRuleHits).toContain("pair:nawal_wenshu_cosmic_vocabulary");
    expect(fit.internalRuleHits).toContain("request:nawal_office_reopened_by_room");
  });

  it("blocks Maeve's no-trade ask when the room forces unsaid items and Toby spirals", () => {
    const save = createSeedGameSave(SEED_DATE);
    const maeve = findMember(save, "maeve");
    const toby = findMember(save, "toby-wenz");
    const scenario = findScenario("memory-course-dinner");
    const pairState = findPairState(save, maeve.id, toby.id);
    const request = findRequest("request-maeve-no-trade-disclosures");

    const fit = evaluateMatchFit({
      members: [maeve, toby],
      scenario,
      pairState,
      activeRequests: [request],
    });

    expect(fit.fitLevel).toBe("risky");
    expect(fit.pressureLevel).toBe("high");
    expect(fit.askSignal).toBe("blocked");
    expect(fit.blockedRequestIds).toContain(request.id);
    expect(fit.internalRuleHits).toContain("maeve:forced_unsaid_receipt");
    expect(fit.internalRuleHits).toContain("pair:maeve_toby_disclosure_spiral");
    expect(fit.internalRuleHits).toContain("request:maeve_unsaid_receipt_forces_trade");
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
    const pairState = getPairProjectionFromSave(save, makePairId(opal.id, wenshu.id));

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
    const pairState = getPairProjectionFromSave(save, makePairId(jenna.id, vhool.id));

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
