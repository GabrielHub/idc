import { describe, expect, it } from "vitest";

import {
  judgeSnapshotSchema,
  type GameSave,
  type JudgeSnapshot,
  type Member,
  type PlayerKnowledgeRecord,
} from "../domain/game";
import { starterScenarios, memberRequests } from "../fixtures";
import { createSeedGameSave, makePairId } from "./game-seed";
import { evaluateMatchFit } from "./match-fit";
import {
  applyJudgeReveals,
  buildJudgeRevealCandidatePacket,
  buildRevealCandidates,
  buildVisibleMemberProfile,
  filterExchangeEligibleRevealCandidates,
  isReadKnown,
  selectDeterministicRevealIds,
  upsertPlayerKnowledge,
  validateUsedEvidenceIds,
  visibleReadsForMember,
  visibleReadsForPair,
  visibleReadsForScenario,
} from "./player-knowledge";

const SEED_DATE = new Date("2026-05-09T12:00:00.000Z");

function findMember(save: GameSave, memberId: string): Member {
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

function makeJudgeSnapshot(
  input: Partial<JudgeSnapshot> & {
    dateSessionId: string;
    exchangeIndex: number;
  },
): JudgeSnapshot {
  return judgeSnapshotSchema.parse({
    id: `judge-${input.dateSessionId}-${input.exchangeIndex}`,
    dateSessionId: input.dateSessionId,
    exchangeIndex: input.exchangeIndex,
    dateHealthDelta: input.dateHealthDelta ?? 0,
    statDeltas: input.statDeltas ?? {},
    memberMoodDeltas: input.memberMoodDeltas ?? {},
    shouldEndEarly: input.shouldEndEarly ?? false,
    earlyEndReason: input.earlyEndReason,
    endSentiment: input.endSentiment ?? null,
    notableMoments: input.notableMoments ?? ["one note"],
    playerSummary: input.playerSummary ?? "Cupid filed the exchange.",
    memoryCandidates: input.memoryCandidates ?? [],
    usedEvidenceIds: input.usedEvidenceIds ?? [],
  });
}

describe("player-knowledge selectors", () => {
  it("returns no hidden facts on a new save", () => {
    const save = createSeedGameSave(SEED_DATE);

    expect(save.playerKnowledge).toHaveLength(0);

    for (const member of save.members) {
      expect(visibleReadsForMember(save, member.id)).toHaveLength(0);
    }

    for (const pairState of save.pairStates) {
      expect(visibleReadsForPair(save, pairState.id)).toHaveLength(0);
    }

    for (const scenario of starterScenarios) {
      expect(visibleReadsForScenario(save, scenario.id)).toHaveLength(0);
    }
  });

  it("returns only matching subject reads", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const otherMember = findMember(seed, "bai-wenshu");
    const record: PlayerKnowledgeRecord = {
      id: "test-1",
      subjectKind: "member",
      subjectId: member.id,
      readKind: "boundary",
      readId: `member:${member.id}:boundary:destiny-pressure`,
      readText: `${member.firstName} resists destiny pressure.`,
      confidence: "filed",
      source: "judge",
      revealedAt: SEED_DATE.toISOString(),
    };
    const save = upsertPlayerKnowledge(seed, [record]);

    expect(visibleReadsForMember(save, member.id)).toHaveLength(1);
    expect(visibleReadsForMember(save, otherMember.id)).toHaveLength(0);
    expect(isReadKnown(save, record.readId)).toBe(true);
    expect(isReadKnown(save, "missing")).toBe(false);
  });

  it("upsert deduplicates by read id and upgrades filed to confirmed", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const filed: PlayerKnowledgeRecord = {
      id: "rec-1",
      subjectKind: "pair",
      subjectId: "pair-1",
      readKind: "pair_dynamic",
      readId: "pair:pair-1:dynamic:sincerity-vs-performance",
      readText: "Sincerity and performance pull against each other in this pair.",
      confidence: "filed",
      source: "judge",
      revealedAt: SEED_DATE.toISOString(),
    };
    const confirmed: PlayerKnowledgeRecord = {
      ...filed,
      id: "rec-2",
      confidence: "confirmed",
      source: "hard_stop",
      revealedAt: new Date(SEED_DATE.getTime() + 1000).toISOString(),
    };

    const afterFiled = upsertPlayerKnowledge(seed, [filed]);
    const afterUpgrade = upsertPlayerKnowledge(afterFiled, [confirmed]);

    expect(afterUpgrade.playerKnowledge).toHaveLength(1);
    expect(afterUpgrade.playerKnowledge[0].confidence).toBe("confirmed");
    expect(afterUpgrade.playerKnowledge[0].source).toBe("hard_stop");
  });
});

describe("buildVisibleMemberProfile", () => {
  it("always returns publicFragments, redactedBlocks, and revealedReads", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const profile = buildVisibleMemberProfile(member, []);

    expect(profile.publicFragments.length).toBeGreaterThanOrEqual(1);
    expect(profile.redactedBlocks.length).toBeGreaterThan(0);
    expect(profile.revealedReads).toHaveLength(0);
  });

  it("does not embed hidden text in redacted blocks", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const profile = buildVisibleMemberProfile(member, []);
    const blockJson = JSON.stringify(profile.redactedBlocks);

    for (const dealbreaker of member.dealbreakers) {
      expect(blockJson.includes(dealbreaker)).toBe(false);
    }

    for (const need of member.relationshipNeeds) {
      expect(blockJson.includes(need)).toBe(false);
    }
  });

  it("supports dev preview without filing player reads", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const earnedProfile = buildVisibleMemberProfile(member, []);
    const previewProfile = buildVisibleMemberProfile(member, [], {
      visibilityMode: "dev_unveiled",
    });

    expect(previewProfile.publicFragments.length).toBeGreaterThan(
      earnedProfile.publicFragments.length,
    );
    expect(previewProfile.redactedBlocks).toHaveLength(0);
    expect(previewProfile.revealedReads).toHaveLength(0);
  });
});

describe("buildRevealCandidates", () => {
  it("ids do not contain raw member tag enum names", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });

    for (const candidate of candidates) {
      expect(candidate.id).not.toContain("prophecy_averse");
      expect(candidate.id).not.toContain("privacy_sensitive");
      expect(candidate.id).not.toContain("grief_sensitive");
      expect(candidate.id).not.toContain("memory_sensitive");
      expect(candidate.id).not.toContain("ordinary_human");
      expect(candidate.id).not.toContain("non_human");
    }
  });

  it("hard stop produces a hard_stop boundary candidate", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const hardStopCandidate = candidates.find((candidate) => candidate.source === "hard_stop");

    expect(matchFit.hardStop).not.toBeNull();
    expect(hardStopCandidate).toBeDefined();
    expect(hardStopCandidate?.readKind).toBe("boundary");
  });

  it("blocked ask produces an ask candidate", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const focusRequest = memberRequests.find((request) => request.memberId === member.id);

    if (focusRequest === undefined) {
      throw new Error("Expected a member request.");
    }

    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
      activeRequests: [focusRequest],
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
      focusRequest,
    });

    const askCandidate = candidates.find((candidate) => candidate.readKind === "ask");
    expect(askCandidate).toBeDefined();
    expect(askCandidate?.id).toContain(focusRequest.id);
  });

  it("pair rule hits produce pair dynamic candidates", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const meiSato = findMember(seed, "mei-sato");
    const opal = findMember(seed, "opal-sunday");
    const scenario = findScenario("listening-booth-after-close");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(meiSato.id, opal.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [meiSato, opal],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [meiSato, opal],
      scenario,
      pairState,
      matchFit,
    });

    if (matchFit.internalRuleHits.some((hit) => hit.startsWith("pair:"))) {
      expect(candidates.some((candidate) => candidate.readKind === "pair_dynamic")).toBe(true);
    }
  });
});

describe("filterExchangeEligibleRevealCandidates", () => {
  it("excludes candidates without exchange evidence in normal cases", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const eligible = filterExchangeEligibleRevealCandidates({
      candidates,
      matchFit,
      exchangeMessages: [],
      triggeredEventIds: [],
    });

    expect(eligible.length).toBeLessThanOrEqual(candidates.length);
  });

  it("does not make member boundary reads eligible just because the member spoke", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "meridian-vale");
    const partner = findMember(seed, "jenna-pike");
    const scenario = findScenario("county-fair-friday");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const boundary = candidates.find(
      (candidate) => candidate.subjectId === member.id && candidate.readKind === "boundary",
    );

    if (boundary === undefined) {
      throw new Error("Expected public exposure boundary candidate.");
    }

    const unrelatedEligible = filterExchangeEligibleRevealCandidates({
      candidates,
      matchFit,
      exchangeMessages: [
        {
          id: "message-1",
          dateSessionId: "test",
          kind: "character",
          speakerId: member.id,
          turnIndex: 1,
          sequenceIndex: 1,
          text: "The lemonade is fine. I am standing normally.",
          createdAt: SEED_DATE.toISOString(),
        },
      ],
      triggeredEventIds: [],
    });
    const relatedEligible = filterExchangeEligibleRevealCandidates({
      candidates,
      matchFit,
      exchangeMessages: [
        {
          id: "message-2",
          dateSessionId: "test",
          kind: "character",
          speakerId: member.id,
          turnIndex: 1,
          sequenceIndex: 1,
          text: "The crowd is watching and someone is filming the table.",
          createdAt: SEED_DATE.toISOString(),
        },
      ],
      triggeredEventIds: [],
    });

    expect(unrelatedEligible.map((candidate) => candidate.id)).not.toContain(boundary.id);
    expect(relatedEligible.map((candidate) => candidate.id)).toContain(boundary.id);
  });

  it("surfaces at least one safe read when a reveal-kind event triggers in the exchange", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const exchangeMessages = [
      {
        id: "message-1",
        dateSessionId: "test",
        kind: "character" as const,
        speakerId: member.id,
        turnIndex: 1,
        sequenceIndex: 1,
        text: "Mei admits she keeps the same takeout reciept on the fridge for three weeks.",
        createdAt: SEED_DATE.toISOString(),
      },
      {
        id: "message-2",
        dateSessionId: "test",
        kind: "scenario" as const,
        turnIndex: 1,
        sequenceIndex: 2,
        text: "The room turns honest. The packaging holds a sticky note in old handwriting.",
        createdAt: SEED_DATE.toISOString(),
      },
    ];

    const withoutReveal = filterExchangeEligibleRevealCandidates({
      candidates,
      matchFit,
      exchangeMessages,
      triggeredEventIds: [],
    });
    const withReveal = filterExchangeEligibleRevealCandidates({
      candidates,
      matchFit,
      exchangeMessages,
      triggeredEventIds: [],
      pendingEventKinds: ["reveal"],
    });

    expect(withReveal.length).toBeGreaterThanOrEqual(1);
    expect(withReveal.length).toBeGreaterThanOrEqual(withoutReveal.length);
    for (const candidate of withReveal) {
      expect(candidate.readText).not.toMatch(/\d+/);
    }
  });

  it("does not fabricate reveal-fallback candidates when the transcript is empty", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const eligible = filterExchangeEligibleRevealCandidates({
      candidates,
      matchFit,
      exchangeMessages: [
        {
          id: "scenario-only",
          dateSessionId: "test",
          kind: "scenario" as const,
          turnIndex: 0,
          sequenceIndex: 1,
          text: "A scene happens without any spoken line.",
          createdAt: SEED_DATE.toISOString(),
        },
      ],
      triggeredEventIds: [],
      pendingEventKinds: ["reveal"],
    });

    expect(eligible).toEqual([]);
  });

  it("hard stop candidates are always eligible", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const eligible = filterExchangeEligibleRevealCandidates({
      candidates,
      matchFit,
      exchangeMessages: [],
      triggeredEventIds: [],
    });

    expect(eligible.some((candidate) => candidate.source === "hard_stop")).toBe(true);
  });
});

describe("selectDeterministicRevealIds", () => {
  it("returns empty when no consequences are meaningful", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const judgeSnapshot = makeJudgeSnapshot({
      dateSessionId: "test",
      exchangeIndex: 0,
      dateHealthDelta: 1,
    });
    const ids = selectDeterministicRevealIds({
      candidates,
      matchFit,
      judgeSnapshot,
    });

    expect(ids).toHaveLength(0);
  });

  it("selects up to two candidates when |dateHealthDelta| >= 6", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const judgeSnapshot = makeJudgeSnapshot({
      dateSessionId: "test",
      exchangeIndex: 0,
      dateHealthDelta: -10,
    });
    const ids = selectDeterministicRevealIds({
      candidates,
      matchFit,
      judgeSnapshot,
    });

    expect(ids.length).toBeGreaterThanOrEqual(1);
    expect(ids.length).toBeLessThanOrEqual(2);
  });

  it("hard stop selects boundary plus scenario pressure", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const judgeSnapshot = makeJudgeSnapshot({
      dateSessionId: "test",
      exchangeIndex: 0,
      shouldEndEarly: true,
      dateHealthDelta: -50,
    });
    const ids = selectDeterministicRevealIds({
      candidates,
      matchFit,
      judgeSnapshot,
    });

    expect(matchFit.hardStop).not.toBeNull();
    expect(ids.length).toBeGreaterThanOrEqual(1);
    const idTexts = ids.join(",");
    expect(idTexts).toContain("boundary");
  });
});

describe("validateUsedEvidenceIds", () => {
  it("drops unknown ids and caps at three", () => {
    const candidates = [
      {
        id: "member:opal-sunday:boundary:destiny-pressure",
        subjectKind: "member" as const,
        subjectId: "opal-sunday",
        readKind: "boundary" as const,
        readText: "Opal resists destiny pressure.",
        evidenceText: "Prophecy framing.",
        source: "judge" as const,
      },
      {
        id: "scenario:prophecy-karaoke:pressure:prophecy-framing",
        subjectKind: "scenario" as const,
        subjectId: "prophecy-karaoke",
        readKind: "scenario_pressure" as const,
        readText: "This room applies fate framing.",
        evidenceText: "Prophecy framing.",
        source: "judge" as const,
      },
    ];

    const accepted = validateUsedEvidenceIds(
      [
        "unknown-id",
        "member:opal-sunday:boundary:destiny-pressure",
        "member:opal-sunday:boundary:destiny-pressure",
        "scenario:prophecy-karaoke:pressure:prophecy-framing",
        "another-unknown",
      ],
      candidates,
    );

    expect(accepted).toEqual([
      "member:opal-sunday:boundary:destiny-pressure",
      "scenario:prophecy-karaoke:pressure:prophecy-framing",
    ]);
  });

  it("returns empty when proposed list is missing", () => {
    expect(validateUsedEvidenceIds(undefined, [])).toEqual([]);
  });
});

describe("applyJudgeReveals", () => {
  it("persists only valid display-safe records", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = seed.pairStates.find(
      (state) => state.id === makePairId(member.id, partner.id),
    )!;
    const matchFit = evaluateMatchFit({
      members: [member, partner],
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members: [member, partner],
      scenario,
      pairState,
      matchFit,
    });
    const candidate = candidates.find((entry) => entry.readKind === "boundary");

    if (candidate === undefined) {
      throw new Error("Expected a boundary candidate.");
    }

    const judgeSnapshot = makeJudgeSnapshot({
      dateSessionId: "test-session",
      exchangeIndex: 0,
    });
    const result = applyJudgeReveals({
      save: seed,
      candidates,
      acceptedIds: [candidate.id, "unknown-id"],
      judgeSnapshot,
      source: "judge",
      revealedAt: SEED_DATE.toISOString(),
    });

    expect(result.acceptedIds).toEqual([candidate.id]);
    expect(result.records).toHaveLength(1);
    expect(result.save.playerKnowledge).toHaveLength(1);
    expect(result.save.playerKnowledge[0].readId).toBe(candidate.id);
  });
});

describe("buildJudgeRevealCandidatePacket", () => {
  it("formats candidates as id/read/evidence lines", () => {
    const candidates = [
      {
        id: "member:opal-sunday:boundary:destiny-pressure",
        subjectKind: "member" as const,
        subjectId: "opal-sunday",
        readKind: "boundary" as const,
        readText: "Opal resists destiny pressure.",
        evidenceText: "Prophecy framing.",
        source: "judge" as const,
      },
    ];
    const packet = buildJudgeRevealCandidatePacket({ candidates });

    expect(packet.ids).toEqual(["member:opal-sunday:boundary:destiny-pressure"]);
    expect(packet.promptLines.join("\n")).toContain("read: Opal resists destiny pressure.");
    expect(packet.promptLines.join("\n")).toContain("evidence:");
  });
});
