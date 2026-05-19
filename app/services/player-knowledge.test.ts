import { describe, expect, it } from "vitest";

import {
  judgeSnapshotSchema,
  memberSchema,
  type DateMessage,
  type GameSave,
  type JudgeSnapshot,
  type Member,
  type PlayerKnowledgeRecord,
} from "../domain/game";
import { starterScenarios, memberRequests } from "../fixtures";
import { createSeedGameSave, makePairId } from "./game-seed";
import { evaluateMatchFit } from "./match-fit";
import { getPairProjectionFromSave } from "./relationship-index";
import {
  MEMBER_PLAYER_VISIBILITY_CONTRACT,
  applyJudgeReveals,
  buildJudgeRevealCandidatePacket,
  buildRevealCandidates,
  buildVisibleMemberProfile,
  filterExchangeEligibleRevealCandidates,
  isReadKnown,
  selectDeterministicRevealIds,
  splitSentences,
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

function makeCharacterMessage(speakerId: string, text: string): DateMessage {
  return {
    id: `message-${speakerId}-${text.length}`,
    dateSessionId: "test",
    kind: "character",
    speakerId,
    turnIndex: 1,
    sequenceIndex: 1,
    text,
    createdAt: SEED_DATE.toISOString(),
  };
}

describe("player-knowledge selectors", () => {
  it("accounts for every member field in the player visibility contract", () => {
    const contractFields = MEMBER_PLAYER_VISIBILITY_CONTRACT.map((entry) => entry.field).sort();
    const schemaFields = [...memberSchema.keyof().options].sort();

    expect(contractFields).toEqual(schemaFields);

    const earnedFields = MEMBER_PLAYER_VISIBILITY_CONTRACT.filter(
      (entry) => entry.tier === "earned",
    );
    const memberEarnedReadKinds = new Set(["profile", "ask", "comfort", "boundary"]);
    for (const entry of earnedFields) {
      expect(entry.readKinds?.length).toBeGreaterThan(0);
      for (const readKind of entry.readKinds ?? []) {
        expect(memberEarnedReadKinds.has(readKind)).toBe(true);
      }
    }
  });

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

    for (const preference of member.preferences) {
      expect(blockJson.includes(preference)).toBe(false);
    }

    const neverVisibleValues = [
      member.species,
      member.origin,
      member.dimension,
      member.realityStatus,
      member.bio,
    ];

    for (const value of neverVisibleValues) {
      expect(JSON.stringify(profile).includes(value)).toBe(false);
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

  it("tracks preferences as a separate sealed intel block", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const profile = buildVisibleMemberProfile(member, []);

    expect(profile.redactedBlocks.map((block) => block.label)).toContain("Preferences");
  });
});

describe("buildRevealCandidates", () => {
  it("ids do not contain raw member tag enum names", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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

  it("boundary risk produces a judge-owned boundary candidate", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
    const boundaryCandidate = candidates.find(
      (candidate) => candidate.readKind === "boundary" && candidate.subjectId === member.id,
    );

    expect(matchFit.boundaryRisk).not.toBeNull();
    expect(boundaryCandidate).toBeDefined();
    expect(boundaryCandidate?.source).toBe("judge");
  });

  it("blocked ask produces an ask candidate that names the friction", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
    expect(askCandidate?.readText).not.toBe(
      `${member.firstName}'s current ask is blocked in this room.`,
    );
    expect(askCandidate?.readText).toMatch(/dealbreaker|destiny|stage|pressure|memory/i);
  });

  it("pair rule hits produce pair dynamic candidates", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const meiSato = findMember(seed, "mei-sato");
    const opal = findMember(seed, "opal-sunday");
    const scenario = findScenario("listening-booth-after-close");
    const pairState = getPairProjectionFromSave(seed, makePairId(meiSato.id, opal.id))!;
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

  it("emits a profile candidate per member with a multi-sentence profile", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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

    const profileCandidates = candidates.filter((candidate) => candidate.readKind === "profile");
    expect(profileCandidates.map((candidate) => candidate.subjectId).sort()).toEqual(
      [member.id, partner.id].sort(),
    );
    for (const candidate of profileCandidates) {
      expect(candidate.subjectKind).toBe("member");
      expect(candidate.id).toContain("profile:expand");
      expect(candidate.source).toBe("judge");
    }
  });

  it("emits fallback candidates for every sealed member dossier block", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const scenario = findScenario("couch-night-takeout");

    for (const member of seed.members) {
      const partner = seed.members.find((candidate) => candidate.id !== member.id);
      if (partner === undefined) {
        throw new Error("Expected a partner fixture.");
      }

      const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id));
      if (pairState === undefined) {
        throw new Error(`Expected pair state for ${member.id}.`);
      }

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
      const memberReadKinds = new Set(
        candidates
          .filter(
            (candidate) => candidate.subjectKind === "member" && candidate.subjectId === member.id,
          )
          .map((candidate) => candidate.readKind),
      );

      if (splitSentences(member.datingProfile).length > 1) {
        expect(memberReadKinds.has("profile")).toBe(true);
      }
      expect(memberReadKinds.has("ask")).toBe(true);

      if (member.preferences.length > 0) {
        expect(memberReadKinds.has("comfort")).toBe(true);
      }

      if (member.dealbreakers.length > 0) {
        expect(memberReadKinds.has("boundary")).toBe(true);
      }
    }
  });

  it("suppresses the profile candidate once a profile read is already filed", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
      knownReads: [
        {
          id: `member:${member.id}:profile:expand:prior`,
          subjectKind: "member",
          subjectId: member.id,
          readKind: "profile",
          readId: `member:${member.id}:profile:expand`,
          readText: "Profile expanded.",
          confidence: "filed",
          source: "judge",
          revealedAt: SEED_DATE.toISOString(),
        },
      ],
    });

    const profileSubjectIds = candidates
      .filter((candidate) => candidate.readKind === "profile")
      .map((candidate) => candidate.subjectId);
    expect(profileSubjectIds).not.toContain(member.id);
    expect(profileSubjectIds).toContain(partner.id);
  });
});

describe("filterExchangeEligibleRevealCandidates", () => {
  it("excludes candidates without exchange evidence in normal cases", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
      exchangeMessages: [],
    });

    expect(eligible.length).toBeLessThanOrEqual(candidates.length);
  });

  it("does not make member boundary reads eligible just because the member spoke", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "meridian-vale");
    const partner = findMember(seed, "jenna-pike");
    const scenario = findScenario("county-fair-friday");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
    });
    const relatedEligible = filterExchangeEligibleRevealCandidates({
      candidates,
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
    });

    expect(unrelatedEligible.map((candidate) => candidate.id)).not.toContain(boundary.id);
    expect(relatedEligible.map((candidate) => candidate.id)).toContain(boundary.id);
  });

  it("requires keyword evidence even when a scenario beat lands in the exchange", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
    const exchangeMessages: DateMessage[] = [
      {
        id: "message-1",
        dateSessionId: "test",
        kind: "character",
        speakerId: member.id,
        turnIndex: 1,
        sequenceIndex: 1,
        text: "Mei admits she keeps the same takeout receipt on the fridge for three weeks.",
        createdAt: SEED_DATE.toISOString(),
      },
      {
        id: "message-2",
        dateSessionId: "test",
        kind: "scenario",
        turnIndex: 1,
        sequenceIndex: 2,
        text: "The packaging holds a sticky note in old handwriting.",
        createdAt: SEED_DATE.toISOString(),
      },
    ];
    const eligible = filterExchangeEligibleRevealCandidates({
      candidates,
      exchangeMessages,
    });

    for (const candidate of eligible) {
      expect(["scenario_pressure", "ask"]).toContain(candidate.readKind);
    }
  });

  it("keeps profile candidates ineligible until profile evidence reaches the exchange", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
    const profile = candidates.find(
      (candidate) => candidate.subjectId === member.id && candidate.readKind === "profile",
    );

    if (profile === undefined) {
      throw new Error("Expected profile candidate.");
    }

    const unrelated = filterExchangeEligibleRevealCandidates({
      candidates,
      exchangeMessages: [
        makeCharacterMessage(member.id, "The lemonade is fine. I can work with this table."),
      ],
    });
    const related = filterExchangeEligibleRevealCandidates({
      candidates,
      exchangeMessages: [
        makeCharacterMessage(
          member.id,
          "The sunset opening is in the profile because the residency matters.",
        ),
      ],
    });

    expect(unrelated.map((candidate) => candidate.id)).not.toContain(profile.id);
    expect(related.map((candidate) => candidate.id)).toContain(profile.id);
  });

  it("allows a profile reveal when the member names their own profile", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "calvin-hewes");
    const partner = findMember(seed, "mei-sato");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
    const profile = candidates.find(
      (candidate) => candidate.subjectId === member.id && candidate.readKind === "profile",
    );

    if (profile === undefined) {
      throw new Error("Expected profile candidate.");
    }

    const eligible = filterExchangeEligibleRevealCandidates({
      candidates,
      exchangeMessages: [
        makeCharacterMessage(
          member.id,
          "My profile says civilized lighting for a reason. I would like the pendants left where they are.",
        ),
      ],
    });

    expect(eligible.map((candidate) => candidate.id)).toContain(profile.id);
  });

  it("does not earn a profile reveal from a generic partner profile mention", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "calvin-hewes");
    const partner = findMember(seed, "mei-sato");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
    const profile = candidates.find(
      (candidate) => candidate.subjectId === member.id && candidate.readKind === "profile",
    );

    if (profile === undefined) {
      throw new Error("Expected profile candidate.");
    }

    const eligible = filterExchangeEligibleRevealCandidates({
      candidates,
      exchangeMessages: [
        makeCharacterMessage(
          partner.id,
          "Your profile seems deliberately sparse. What is missing?",
        ),
        makeCharacterMessage(member.id, "The lemonade is fine. The table is acceptable."),
      ],
    });

    expect(eligible.map((candidate) => candidate.id)).not.toContain(profile.id);
  });

  it("allows a profile reveal when a partner names hidden profile detail and the member answers", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "calvin-hewes");
    const partner = findMember(seed, "mei-sato");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
    const profile = candidates.find(
      (candidate) => candidate.subjectId === member.id && candidate.readKind === "profile",
    );

    if (profile === undefined) {
      throw new Error("Expected profile candidate.");
    }

    const eligible = filterExchangeEligibleRevealCandidates({
      candidates,
      exchangeMessages: [
        makeCharacterMessage(
          partner.id,
          "Your profile says civilized lighting and no overhead camera infrastructure. Is that literal?",
        ),
        makeCharacterMessage(
          member.id,
          "It is operational language. I prefer the pendants exactly where they are.",
        ),
      ],
    });

    expect(eligible.map((candidate) => candidate.id)).toContain(profile.id);
  });

  it("uses authored member evidence as a fallback path for ask, comfort, and boundary reads", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "cha-yusung");
    const partner = findMember(seed, "mei-sato");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
    const readIdByKind = new Map(
      candidates
        .filter((candidate) => candidate.subjectId === member.id)
        .map((candidate) => [candidate.readKind, candidate.id]),
    );
    const askReadId = readIdByKind.get("ask");
    const comfortReadId = readIdByKind.get("comfort");
    const boundaryReadId = readIdByKind.get("boundary");

    if (askReadId === undefined || comfortReadId === undefined || boundaryReadId === undefined) {
      throw new Error("Expected fallback member read candidates.");
    }

    const eligible = filterExchangeEligibleRevealCandidates({
      candidates,
      exchangeMessages: [
        makeCharacterMessage(
          member.id,
          "Protecting is not the point. I need silence to sit, scheduled hours with no improvisation, and no performative necromancy.",
        ),
      ],
    });
    const eligibleIds = eligible.map((candidate) => candidate.id);

    expect(eligibleIds).toContain(askReadId);
    expect(eligibleIds).toContain(comfortReadId);
    expect(eligibleIds).toContain(boundaryReadId);
  });

  it("boundary risk candidates need transcript evidence before eligibility", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
      exchangeMessages: [],
    });
    const exchangeMessages: DateMessage[] = [
      {
        id: "exchange-1",
        dateSessionId: "test",
        kind: "character",
        speakerId: member.id,
        text: "The prophecy framing is already on the table.",
        turnIndex: 1,
        sequenceIndex: 0,
        createdAt: SEED_DATE.toISOString(),
      },
    ];
    const eligibleWithEvidence = filterExchangeEligibleRevealCandidates({
      candidates,
      exchangeMessages,
    });

    expect(eligible.some((candidate) => candidate.readKind === "boundary")).toBe(false);
    expect(eligibleWithEvidence.some((candidate) => candidate.readKind === "boundary")).toBe(true);
  });
});

describe("selectDeterministicRevealIds", () => {
  it("returns empty when no consequences are meaningful", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "mei-sato");
    const partner = findMember(seed, "calvin-hewes");
    const scenario = findScenario("couch-night-takeout");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
      judgeSnapshot,
    });

    expect(ids).toHaveLength(0);
  });

  it("selects up to two candidates when |dateHealthDelta| >= 6", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
      judgeSnapshot,
    });

    expect(ids.length).toBeGreaterThanOrEqual(1);
    expect(ids.length).toBeLessThanOrEqual(2);
  });

  it("does not select boundary reads only because match fit flagged risk", () => {
    const seed = createSeedGameSave(SEED_DATE);
    const member = findMember(seed, "opal-sunday");
    const partner = findMember(seed, "bai-wenshu");
    const scenario = findScenario("prophecy-karaoke");
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
      exchangeMessages: [],
    });
    const judgeSnapshot = makeJudgeSnapshot({
      dateSessionId: "test",
      exchangeIndex: 0,
      shouldEndEarly: true,
      dateHealthDelta: -50,
    });
    const ids = selectDeterministicRevealIds({
      candidates: eligible,
      judgeSnapshot,
    });

    expect(matchFit.boundaryRisk).not.toBeNull();
    expect(ids).toEqual([]);
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
    const pairState = getPairProjectionFromSave(seed, makePairId(member.id, partner.id))!;
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
