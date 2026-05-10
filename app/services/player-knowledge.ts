import {
  playerKnowledgeRecordSchema,
  type DateMessage,
  type DateScenario,
  type GameSave,
  type JudgeSnapshot,
  type Member,
  type MemberRequest,
  type MemberTag,
  type PairState,
  type PlayerKnowledgeReadKind,
  type PlayerKnowledgeRecord,
  type PlayerKnowledgeSource,
  type ScenarioTag,
} from "../domain/game";
import { evaluateMatchFit, type MatchFitResult } from "./match-fit";

export type RevealCandidate = {
  id: string;
  subjectKind: "member" | "pair" | "scenario";
  subjectId: string;
  readKind: PlayerKnowledgeReadKind;
  readText: string;
  evidenceText: string;
  source: "judge" | "hard_stop";
};

export type BuildRevealCandidatesInput = {
  members: readonly Member[];
  scenario: DateScenario;
  pairState: PairState;
  focusRequest?: MemberRequest;
  matchFit: MatchFitResult;
};

export type FilterExchangeEligibleInput = {
  candidates: readonly RevealCandidate[];
  matchFit: MatchFitResult;
  exchangeMessages: readonly DateMessage[];
  triggeredEventIds: readonly string[];
  focusRequest?: MemberRequest;
};

export type SelectDeterministicRevealIdsInput = {
  candidates: readonly RevealCandidate[];
  matchFit: MatchFitResult;
  judgeSnapshot: JudgeSnapshot;
};

export type ApplyJudgeRevealsInput = {
  save: GameSave;
  candidates: readonly RevealCandidate[];
  acceptedIds: readonly string[];
  judgeSnapshot: JudgeSnapshot;
  source: PlayerKnowledgeSource;
  revealedAt: string;
};

const MAX_REVEAL_PROMPT_CANDIDATES = 6;
const MAX_DETERMINISTIC_REVEALS_PER_PASS = 1;
const MAX_DETERMINISTIC_REVEALS_HIGH_DELTA = 2;
const HIGH_DATE_HEALTH_DELTA_THRESHOLD = 6;
const MEANINGFUL_DELTA_MAGNITUDE = 3;

export function visibleReadsForMember(save: GameSave, memberId: string): PlayerKnowledgeRecord[] {
  return save.playerKnowledge.filter(
    (record) => record.subjectKind === "member" && record.subjectId === memberId,
  );
}

export function visibleReadsForPair(save: GameSave, pairId: string): PlayerKnowledgeRecord[] {
  return save.playerKnowledge.filter(
    (record) => record.subjectKind === "pair" && record.subjectId === pairId,
  );
}

export function visibleReadsForScenario(
  save: GameSave,
  scenarioId: string,
): PlayerKnowledgeRecord[] {
  return save.playerKnowledge.filter(
    (record) => record.subjectKind === "scenario" && record.subjectId === scenarioId,
  );
}

export function isReadKnown(save: GameSave, readId: string): boolean {
  return save.playerKnowledge.some((record) => record.readId === readId);
}

export type VisibleMemberProfile = {
  publicFragments: string[];
  redactedBlocks: Array<{
    id: string;
    label: string;
    lineCount: number;
  }>;
  revealedReads: PlayerKnowledgeRecord[];
};

export function buildVisibleMemberProfile(
  member: Member,
  knowledge: readonly PlayerKnowledgeRecord[],
): VisibleMemberProfile {
  const memberKnowledge = knowledge.filter(
    (record) => record.subjectKind === "member" && record.subjectId === member.id,
  );
  const profileSentences = splitSentences(member.datingProfile);
  const publicFragments: string[] = [];

  if (profileSentences.length > 0) {
    publicFragments.push(profileSentences[0]);
  }

  const hasProfileRead = memberKnowledge.some((record) => record.readKind === "profile");

  if (hasProfileRead && profileSentences.length > 1) {
    publicFragments.push(...profileSentences.slice(1));
  }

  const redactedBlocks: VisibleMemberProfile["redactedBlocks"] = [];

  if (!hasProfileRead && profileSentences.length > 1) {
    const remainingLineCount = Math.max(profileSentences.length - 1, 1);
    redactedBlocks.push({
      id: `member:${member.id}:profile:remainder`,
      label: "Profile continues",
      lineCount: remainingLineCount,
    });
  }

  const hasNeedsRead = memberKnowledge.some(
    (record) => record.readKind === "comfort" || record.readKind === "ask",
  );

  if (!hasNeedsRead) {
    redactedBlocks.push({
      id: `member:${member.id}:needs:sealed`,
      label: "Looking for",
      lineCount: Math.max(member.relationshipNeeds.length, 1),
    });
  }

  const hasBoundaryRead = memberKnowledge.some((record) => record.readKind === "boundary");

  if (!hasBoundaryRead && member.dealbreakers.length > 0) {
    redactedBlocks.push({
      id: `member:${member.id}:dealbreakers:sealed`,
      label: "Dealbreakers",
      lineCount: Math.min(member.dealbreakers.length, 3),
    });
  }

  return {
    publicFragments,
    redactedBlocks,
    revealedReads: memberKnowledge,
  };
}

export function upsertPlayerKnowledge(
  save: GameSave,
  records: readonly PlayerKnowledgeRecord[],
): GameSave {
  if (records.length === 0) {
    return save;
  }

  const next = [...save.playerKnowledge];

  for (const incoming of records) {
    const parsed = playerKnowledgeRecordSchema.parse(incoming);
    const existingIndex = next.findIndex((record) => record.readId === parsed.readId);

    if (existingIndex === -1) {
      next.push(parsed);
      continue;
    }

    const existing = next[existingIndex];
    const upgradedConfidence =
      existing.confidence === "confirmed" || parsed.confidence === "confirmed"
        ? "confirmed"
        : "filed";
    const upgradedSource =
      existing.source === "hard_stop" || parsed.source === "hard_stop"
        ? "hard_stop"
        : parsed.source === "final_report" || existing.source === "final_report"
          ? "final_report"
          : "judge";

    next[existingIndex] = playerKnowledgeRecordSchema.parse({
      ...existing,
      confidence: upgradedConfidence,
      source: upgradedSource,
      revealedAt: parsed.revealedAt,
      dateSessionId: parsed.dateSessionId ?? existing.dateSessionId,
      judgeSnapshotId: parsed.judgeSnapshotId ?? existing.judgeSnapshotId,
      evidenceText: parsed.evidenceText ?? existing.evidenceText,
    });
  }

  return { ...save, playerKnowledge: next };
}

const MEMBER_BOUNDARY_READS: Partial<
  Record<MemberTag, { readId: string; toReadText: (firstName: string) => string; evidence: string }>
> = {
  prophecy_averse: {
    readId: "boundary:destiny-pressure",
    toReadText: (firstName) => `${firstName} resists destiny pressure.`,
    evidence: "The room or exchange applied fate, prophecy, or chosen-one framing.",
  },
  privacy_sensitive: {
    readId: "boundary:public-exposure",
    toReadText: (firstName) => `${firstName} pulls back when the room becomes a stage.`,
    evidence: "The room or exchange placed public attention on the pair.",
  },
  grief_sensitive: {
    readId: "boundary:forced-recovery",
    toReadText: (firstName) => `${firstName} flinches when the room pushes recovery on a schedule.`,
    evidence: "The room or exchange applied recovery, closure, or healing pressure.",
  },
  memory_sensitive: {
    readId: "boundary:memory-pressure",
    toReadText: (firstName) => `${firstName} guards how their past gets handled.`,
    evidence: "The room or exchange leaned on memory or the past as the topic.",
  },
};

const MEMBER_COMFORT_READS: Partial<
  Record<MemberTag, { readId: string; toReadText: (firstName: string) => string; evidence: string }>
> = {
  needs_low_pressure: {
    readId: "comfort:low-pressure",
    toReadText: (firstName) => `${firstName} relaxes when the room takes pressure off.`,
    evidence: "The room or exchange kept the pressure low.",
  },
  needs_clear_plan: {
    readId: "comfort:clear-plan",
    toReadText: (firstName) => `${firstName} settles when the plan stays clear.`,
    evidence: "The room or exchange held to a plan instead of dissolving it.",
  },
  career_focused: {
    readId: "comfort:career-context",
    toReadText: (firstName) =>
      `${firstName} engages when the room makes work part of the conversation.`,
    evidence: "The room or exchange treated career as legitimate dating territory.",
  },
  weirdness_native: {
    readId: "comfort:weirdness-tolerance",
    toReadText: (firstName) => `${firstName} treats the strange parts of the room as normal.`,
    evidence: "The room or exchange leaned into chaos or weirdness.",
  },
  ceremony_minded: {
    readId: "comfort:ceremony",
    toReadText: (firstName) => `${firstName} responds to ritual and structure in the room.`,
    evidence: "The room or exchange offered ceremony or named structure.",
  },
  sincerity_seeking: {
    readId: "comfort:sincerity",
    toReadText: (firstName) => `${firstName} responds to plain sincerity from a partner.`,
    evidence: "The exchange let plain sincerity land instead of routing through performance.",
  },
  acquisitive: {
    readId: "comfort:transactional-register",
    toReadText: (firstName) =>
      `${firstName} settles when the room treats relationships as something to acquire.`,
    evidence:
      "The room or exchange let transactional, contractual, or recruiting language land plainly.",
  },
};

const SCENARIO_PRESSURE_READS: Partial<
  Record<ScenarioTag, { readId: string; readText: string; evidence: string }>
> = {
  public: {
    readId: "pressure:public-attention",
    readText: "This room turns public attention into the main hazard.",
    evidence: "The scenario stages the date in front of an audience or public space.",
  },
  prophecy: {
    readId: "pressure:prophecy-framing",
    readText: "This room applies fate framing to whoever shows up.",
    evidence: "The scenario reads chosen-one or prophecy framing onto the pair.",
  },
  memory: {
    readId: "pressure:memory-recovery",
    readText: "This room presses on memory in a way that asks for recovery.",
    evidence: "The scenario builds the date around memory, recovery, or the past.",
  },
  high_pressure: {
    readId: "pressure:high-pressure",
    readText: "This room runs hot. Pressure is the point.",
    evidence: "The scenario keeps the pressure dial high through the date.",
  },
  haunted: {
    readId: "pressure:haunted-business",
    readText: "This room treats unfinished business as the floor plan.",
    evidence: "The scenario foregrounds the pair's unfinished history.",
  },
  temporal: {
    readId: "pressure:temporal-shift",
    readText: "This room rewrites time on whoever is in it.",
    evidence: "The scenario applies time loops, replays, or temporal jumps.",
  },
  cosmic: {
    readId: "pressure:cosmic-scale",
    readText: "This room stages the date at cosmic scale.",
    evidence: "The scenario opens onto cosmic stakes or scale.",
  },
};

const PAIR_DYNAMIC_READS: Record<string, { readId: string; readText: string; evidence: string }> = {
  "pair:sincerity_vs_performance": {
    readId: "dynamic:sincerity-vs-performance",
    readText: "Sincerity and performance pull against each other in this pair.",
    evidence: "Sincerity from one member runs into performance or avoidance from the other.",
  },
  "pair:status_vs_attention": {
    readId: "dynamic:status-vs-attention",
    readText: "Status and attention compete for the same room.",
    evidence: "One member protects status while the other angles for attention.",
  },
  "pair:shared_spiral": {
    readId: "dynamic:shared-spiral",
    readText: "Both members spiral when stress lands at once.",
    evidence: "Both members carry an anxious spiral pattern.",
  },
  "pair:career_alignment": {
    readId: "dynamic:career-alignment",
    readText: "Career focus aligns the pair when the room makes room for it.",
    evidence: "Both members hold career as central.",
  },
  "pair:ceremony_alignment": {
    readId: "dynamic:ceremony-alignment",
    readText: "Both members lean into ritual together.",
    evidence: "Both members hold ceremony as a shared anchor.",
  },
  "pair:mutual_acquisition": {
    readId: "dynamic:mutual-acquisition",
    readText: "Both members treat the table as a recruitment funnel.",
    evidence: "Both members run on transactional or contractual relationship vocabulary.",
  },
  "pair:competitive_clash": {
    readId: "dynamic:competitive-clash",
    readText: "Competitive instincts make the room sharper than the rubric expects.",
    evidence: "Both members carry a competitive streak.",
  },
  "pair:attention_rivalry": {
    readId: "dynamic:attention-rivalry",
    readText: "Both members want the spotlight at the same time.",
    evidence: "Both members angle for attention as the default move.",
  },
  "pair:performer_distrust": {
    readId: "dynamic:performer-distrust",
    readText: "Performance reads as masking to both members.",
    evidence: "Both members run a performative register and recognize it in the other.",
  },
  "pair:grief_high_intimacy_overload": {
    readId: "dynamic:grief-high-intimacy-overload",
    readText: "Shared grief plus high intimacy overwhelms the room.",
    evidence: "Both members carry grief sensitivity and the scenario forces intimacy.",
  },
  "pair:grief_low_intimacy_alignment": {
    readId: "dynamic:grief-low-intimacy-alignment",
    readText: "Shared grief fits a quieter setting.",
    evidence: "Both members carry grief sensitivity in a low-intimacy room.",
  },
  "pair:weirdness_displaced_recognition": {
    readId: "dynamic:weirdness-recognition",
    readText: "Weirdness and displacement recognize each other across the table.",
    evidence: "One member is at home in the strange while the other is freshly displaced.",
  },
  "pair:ceremony_vs_performance": {
    readId: "dynamic:ceremony-vs-performance",
    readText: "Ceremony and performance read past each other.",
    evidence: "One member holds ritual seriously while the other treats it as material.",
  },
  "pair:privacy_vs_attention": {
    readId: "dynamic:privacy-vs-attention",
    readText: "Privacy and attention pull in opposite directions.",
    evidence: "One member needs the room small while the other needs it visible.",
  },
  "pair:repeat_scenario": {
    readId: "dynamic:repeat-room",
    readText: "This pair has worked this room before.",
    evidence: "The pair has booked this scenario at least once already.",
  },
};

export function buildRevealCandidates(input: BuildRevealCandidatesInput): RevealCandidate[] {
  const candidates: RevealCandidate[] = [];
  const seenIds = new Set<string>();
  const pushCandidate = (candidate: RevealCandidate) => {
    if (seenIds.has(candidate.id)) {
      return;
    }
    seenIds.add(candidate.id);
    candidates.push(candidate);
  };
  const scenarioTags = new Set<ScenarioTag>(input.scenario.card.tags);

  if (input.matchFit.hardStop !== null) {
    const hardStopCandidate = buildHardStopBoundaryCandidate(
      input.members,
      input.scenario,
      input.matchFit.hardStop.memberId,
    );
    if (hardStopCandidate !== null) {
      pushCandidate(hardStopCandidate);
    }
  }

  for (const member of input.members) {
    for (const tag of member.tags) {
      const boundary = MEMBER_BOUNDARY_READS[tag];

      if (boundary !== undefined && scenarioTagPressuresBoundary(tag, scenarioTags)) {
        pushCandidate({
          id: `member:${member.id}:${boundary.readId}`,
          subjectKind: "member",
          subjectId: member.id,
          readKind: "boundary",
          readText: boundary.toReadText(member.firstName),
          evidenceText: boundary.evidence,
          source: input.matchFit.hardStop?.memberId === member.id ? "hard_stop" : "judge",
        });
      }

      const comfort = MEMBER_COMFORT_READS[tag];

      if (comfort !== undefined && scenarioTagSupportsComfort(tag, scenarioTags, input.scenario)) {
        pushCandidate({
          id: `member:${member.id}:${comfort.readId}`,
          subjectKind: "member",
          subjectId: member.id,
          readKind: "comfort",
          readText: comfort.toReadText(member.firstName),
          evidenceText: comfort.evidence,
          source: "judge",
        });
      }
    }
  }

  if (input.focusRequest !== undefined) {
    const requestMember = input.members.find(
      (member) => member.id === input.focusRequest?.memberId,
    );

    if (requestMember !== undefined) {
      if (input.matchFit.blockedRequestIds.includes(input.focusRequest.id)) {
        pushCandidate({
          id: `member:${requestMember.id}:ask-blocked:${input.focusRequest.id}`,
          subjectKind: "member",
          subjectId: requestMember.id,
          readKind: "ask",
          readText: `${requestMember.firstName}'s current ask is blocked in this room.`,
          evidenceText: "The room cannot honor the focused ask in its current shape.",
          source: "judge",
        });
      } else if (input.matchFit.coveredRequestIds.includes(input.focusRequest.id)) {
        pushCandidate({
          id: `member:${requestMember.id}:ask-covered:${input.focusRequest.id}`,
          subjectKind: "member",
          subjectId: requestMember.id,
          readKind: "ask",
          readText: `${requestMember.firstName}'s current ask fits this room.`,
          evidenceText: "The room covers the focused ask without strain.",
          source: "judge",
        });
      }
    }
  }

  for (const ruleHit of input.matchFit.internalRuleHits) {
    if (!ruleHit.startsWith("pair:")) {
      continue;
    }

    const dynamic = PAIR_DYNAMIC_READS[ruleHit];

    if (dynamic !== undefined) {
      pushCandidate({
        id: `pair:${input.pairState.id}:${dynamic.readId}`,
        subjectKind: "pair",
        subjectId: input.pairState.id,
        readKind: "pair_dynamic",
        readText: dynamic.readText,
        evidenceText: dynamic.evidence,
        source: "judge",
      });
    }
  }

  for (const tag of input.scenario.card.tags) {
    const pressure = SCENARIO_PRESSURE_READS[tag];

    if (pressure !== undefined) {
      pushCandidate({
        id: `scenario:${input.scenario.id}:${pressure.readId}`,
        subjectKind: "scenario",
        subjectId: input.scenario.id,
        readKind: "scenario_pressure",
        readText: pressure.readText,
        evidenceText: pressure.evidence,
        source: "judge",
      });
    }
  }

  return candidates;
}

function buildHardStopBoundaryCandidate(
  members: readonly Member[],
  scenario: DateScenario,
  hardStopMemberId: string,
): RevealCandidate | null {
  const member = members.find((candidate) => candidate.id === hardStopMemberId);

  if (member === undefined) {
    return null;
  }

  const scenarioTags = new Set<ScenarioTag>(scenario.card.tags);

  const orderedTags: MemberTag[] = [
    "prophecy_averse",
    "privacy_sensitive",
    "grief_sensitive",
    "memory_sensitive",
  ];

  for (const tag of orderedTags) {
    if (!member.tags.includes(tag)) {
      continue;
    }

    const boundary = MEMBER_BOUNDARY_READS[tag];

    if (boundary === undefined) {
      continue;
    }

    if (!scenarioTagPressuresBoundary(tag, scenarioTags)) {
      continue;
    }

    return {
      id: `member:${member.id}:${boundary.readId}`,
      subjectKind: "member",
      subjectId: member.id,
      readKind: "boundary",
      readText: boundary.toReadText(member.firstName),
      evidenceText: boundary.evidence,
      source: "hard_stop",
    };
  }

  return null;
}

export function filterExchangeEligibleRevealCandidates(
  input: FilterExchangeEligibleInput,
): RevealCandidate[] {
  const eligible: RevealCandidate[] = [];
  const exchangeText = input.exchangeMessages
    .map((message) => message.text.toLowerCase())
    .join("\n");
  const hasPendingScenarioEvent = input.exchangeMessages.some(
    (message) => message.kind === "scenario",
  );

  for (const candidate of input.candidates) {
    if (candidate.source === "hard_stop") {
      eligible.push(candidate);
      continue;
    }

    if (candidate.readKind === "ask") {
      if (
        input.matchFit.blockedRequestIds.length > 0 ||
        input.matchFit.coveredRequestIds.length > 0
      ) {
        eligible.push(candidate);
      }
      continue;
    }

    if (candidate.readKind === "scenario_pressure") {
      const referencesEvidence = scenarioPressureMatchesExchange(candidate, exchangeText);

      if (referencesEvidence || hasPendingScenarioEvent || input.matchFit.hardStop !== null) {
        eligible.push(candidate);
      }
      continue;
    }

    if (candidate.readKind === "pair_dynamic") {
      const meaningfulDrift = Math.abs(input.matchFit.exchangeDateHealthDrift) >= 1;
      const referencesEvidence = pairDynamicMatchesExchange(candidate, exchangeText);
      if (meaningfulDrift || referencesEvidence) {
        eligible.push(candidate);
      }
      continue;
    }

    if (candidate.readKind === "comfort" || candidate.readKind === "boundary") {
      const referencesEvidence = memberReadMatchesExchange(candidate, exchangeText);
      if (referencesEvidence || input.matchFit.hardStop !== null) {
        eligible.push(candidate);
      }
      continue;
    }
  }

  return prioritizeAndCap(eligible);
}

function prioritizeAndCap(candidates: RevealCandidate[]): RevealCandidate[] {
  const priorityOrder: PlayerKnowledgeReadKind[] = [
    "boundary",
    "ask",
    "pair_dynamic",
    "scenario_pressure",
    "comfort",
    "profile",
  ];
  const sorted = [...candidates].sort((first, second) => {
    if (first.source === "hard_stop" && second.source !== "hard_stop") return -1;
    if (second.source === "hard_stop" && first.source !== "hard_stop") return 1;
    return priorityOrder.indexOf(first.readKind) - priorityOrder.indexOf(second.readKind);
  });
  return sorted.slice(0, MAX_REVEAL_PROMPT_CANDIDATES);
}

export function selectDeterministicRevealIds(input: SelectDeterministicRevealIdsInput): string[] {
  if (input.matchFit.hardStop !== null) {
    const hardStopCandidate = input.candidates.find(
      (candidate) => candidate.source === "hard_stop" && candidate.readKind === "boundary",
    );
    const ids: string[] = [];
    if (hardStopCandidate !== undefined) {
      ids.push(hardStopCandidate.id);
    }
    const scenarioPressure = input.candidates.find(
      (candidate) => candidate.readKind === "scenario_pressure",
    );
    if (scenarioPressure !== undefined) {
      ids.push(scenarioPressure.id);
    }
    return ids;
  }

  const dateHealthMagnitude = Math.abs(input.judgeSnapshot.dateHealthDelta);
  const maxStatMagnitude = Object.values(input.judgeSnapshot.statDeltas).reduce<number>(
    (max, value) => Math.max(max, Math.abs(value ?? 0)),
    0,
  );
  const maxMoodMagnitude = Object.values(input.judgeSnapshot.memberMoodDeltas).reduce<number>(
    (max, value) => Math.max(max, Math.abs(value)),
    0,
  );
  const meaningful =
    dateHealthMagnitude >= MEANINGFUL_DELTA_MAGNITUDE ||
    maxStatMagnitude >= MEANINGFUL_DELTA_MAGNITUDE ||
    maxMoodMagnitude >= MEANINGFUL_DELTA_MAGNITUDE;

  if (!meaningful) {
    return [];
  }

  const limit =
    dateHealthMagnitude >= HIGH_DATE_HEALTH_DELTA_THRESHOLD
      ? MAX_DETERMINISTIC_REVEALS_HIGH_DELTA
      : MAX_DETERMINISTIC_REVEALS_PER_PASS;

  const priorityOrder: PlayerKnowledgeReadKind[] = [
    "ask",
    "pair_dynamic",
    "scenario_pressure",
    "comfort",
    "boundary",
    "profile",
  ];
  const sorted = [...input.candidates].sort(
    (first, second) =>
      priorityOrder.indexOf(first.readKind) - priorityOrder.indexOf(second.readKind),
  );

  return sorted.slice(0, limit).map((candidate) => candidate.id);
}

export function applyJudgeReveals({
  save,
  candidates,
  acceptedIds,
  judgeSnapshot,
  source,
  revealedAt,
}: ApplyJudgeRevealsInput): {
  save: GameSave;
  acceptedIds: string[];
  records: PlayerKnowledgeRecord[];
} {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const accepted: string[] = [];
  const records: PlayerKnowledgeRecord[] = [];

  for (const candidateId of acceptedIds) {
    const candidate = candidatesById.get(candidateId);

    if (candidate === undefined) {
      continue;
    }

    accepted.push(candidate.id);
    const existing = save.playerKnowledge.find((record) => record.readId === candidate.id);
    const resolvedSource: PlayerKnowledgeSource =
      source === "hard_stop" || candidate.source === "hard_stop" ? "hard_stop" : source;
    const confidence: PlayerKnowledgeRecord["confidence"] =
      resolvedSource === "hard_stop" || (existing !== undefined && existing.confidence === "filed")
        ? "confirmed"
        : "filed";

    const record = playerKnowledgeRecordSchema.parse({
      id: `${candidate.id}:${judgeSnapshot.id}`,
      subjectKind: candidate.subjectKind,
      subjectId: candidate.subjectId,
      readKind: candidate.readKind,
      readId: candidate.id,
      readText: candidate.readText,
      confidence,
      source: resolvedSource,
      dateSessionId: judgeSnapshot.dateSessionId,
      judgeSnapshotId: judgeSnapshot.id,
      evidenceText: candidate.evidenceText,
      revealedAt,
    });
    records.push(record);
  }

  return {
    save: upsertPlayerKnowledge(save, records),
    acceptedIds: accepted,
    records,
  };
}

export function evaluateMatchFitForReveal(input: {
  members: readonly Member[];
  scenario: DateScenario;
  pairState: PairState;
  focusRequest?: MemberRequest;
}): MatchFitResult {
  return evaluateMatchFit({
    members: input.members,
    scenario: input.scenario,
    pairState: input.pairState,
    activeRequests: input.focusRequest === undefined ? [] : [input.focusRequest],
  });
}

export function buildJudgeRevealCandidatePacket(input: {
  candidates: readonly RevealCandidate[];
}): { promptLines: string[]; ids: string[] } {
  const lines: string[] = [];
  const ids: string[] = [];

  for (const candidate of input.candidates) {
    lines.push(`- id: ${candidate.id}`);
    lines.push(`  read: ${candidate.readText}`);
    lines.push(`  evidence: ${candidate.evidenceText}`);
    ids.push(candidate.id);
  }

  return { promptLines: lines, ids };
}

export function validateUsedEvidenceIds(
  proposed: readonly string[] | undefined,
  candidates: readonly RevealCandidate[],
): string[] {
  if (proposed === undefined || proposed.length === 0) {
    return [];
  }

  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  const accepted: string[] = [];
  const seen = new Set<string>();

  for (const id of proposed) {
    if (seen.has(id) || !candidateIds.has(id)) {
      continue;
    }
    seen.add(id);
    accepted.push(id);
    if (accepted.length >= 3) {
      break;
    }
  }

  return accepted;
}

function scenarioTagPressuresBoundary(
  memberTag: MemberTag,
  scenarioTags: ReadonlySet<ScenarioTag>,
): boolean {
  if (memberTag === "prophecy_averse") return scenarioTags.has("prophecy");
  if (memberTag === "privacy_sensitive") return scenarioTags.has("public");
  if (memberTag === "grief_sensitive") return scenarioTags.has("memory");
  if (memberTag === "memory_sensitive") return scenarioTags.has("memory");
  return false;
}

function scenarioTagSupportsComfort(
  memberTag: MemberTag,
  scenarioTags: ReadonlySet<ScenarioTag>,
  scenario: DateScenario,
): boolean {
  if (memberTag === "needs_low_pressure") return scenarioTags.has("low_pressure");
  if (memberTag === "needs_clear_plan") return scenario.card.chaos !== "high";
  if (memberTag === "career_focused") return scenarioTags.has("career");
  if (memberTag === "weirdness_native") return scenario.card.chaos !== "low";
  if (memberTag === "ceremony_minded")
    return scenarioTags.has("low_pressure") || scenarioTags.has("public");
  if (memberTag === "sincerity_seeking") return scenario.card.intimacy !== "low";
  if (memberTag === "acquisitive") return scenarioTags.has("career");
  return false;
}

function scenarioPressureMatchesExchange(
  candidate: RevealCandidate,
  exchangeText: string,
): boolean {
  if (exchangeText.length === 0) {
    return false;
  }
  const keywords = SCENARIO_PRESSURE_KEYWORDS[candidate.id.split(":pressure:")[1] ?? ""] ?? [];
  return keywords.some((keyword) => exchangeText.includes(keyword));
}

const SCENARIO_PRESSURE_KEYWORDS: Record<string, string[]> = {
  "public-attention": ["audience", "public", "stage", "watching", "filming", "posted"],
  "prophecy-framing": ["prophecy", "destiny", "chosen", "fate", "foretold"],
  "memory-recovery": ["memory", "remember", "forgot", "remind", "recovery"],
  "high-pressure": ["pressure", "stakes", "urgent", "deadline"],
  "haunted-business": ["unfinished", "haunted", "again", "before"],
  "temporal-shift": ["time", "loop", "again", "rewind", "earlier"],
  "cosmic-scale": ["cosmic", "stars", "scale", "vast"],
};

function pairDynamicMatchesExchange(candidate: RevealCandidate, exchangeText: string): boolean {
  if (exchangeText.length === 0) {
    return false;
  }
  const keywords = PAIR_DYNAMIC_KEYWORDS[candidate.id.split(":dynamic:")[1] ?? ""] ?? [];
  return keywords.some((keyword) => exchangeText.includes(keyword));
}

const PAIR_DYNAMIC_KEYWORDS: Record<string, string[]> = {
  "sincerity-vs-performance": ["sincere", "honest", "real", "bit", "perform", "performance"],
  "status-vs-attention": ["status", "attention", "watching", "important"],
  "shared-spiral": ["spiral", "anxious", "panic", "worry"],
  "career-alignment": ["work", "career", "meeting", "calendar", "client"],
  "ceremony-alignment": ["ceremony", "ritual", "formal", "vow", "promise"],
  "competitive-clash": ["win", "compete", "better", "score"],
  "attention-rivalry": ["attention", "spotlight", "watching", "filming"],
  "performer-distrust": ["bit", "perform", "performance", "mask"],
  "grief-high-intimacy-overload": ["grief", "loss", "memory", "heal", "recovery"],
  "grief-low-intimacy-alignment": ["quiet", "grief", "loss", "memory"],
  "weirdness-recognition": ["weird", "strange", "elsewhere", "home", "normal"],
  "ceremony-vs-performance": ["ceremony", "ritual", "bit", "perform", "mock"],
  "privacy-vs-attention": ["private", "privacy", "attention", "watching", "filming"],
  "repeat-room": ["again", "before", "same room", "last time"],
};

function memberReadMatchesExchange(candidate: RevealCandidate, exchangeText: string): boolean {
  if (candidate.subjectKind !== "member") {
    return false;
  }

  if (exchangeText.length === 0) {
    return false;
  }

  const keywords = MEMBER_READ_KEYWORDS[candidate.id.split(":").slice(2).join(":")] ?? [];
  return keywords.some((keyword) => exchangeText.includes(keyword));
}

const MEMBER_READ_KEYWORDS: Record<string, string[]> = {
  "boundary:destiny-pressure": [
    "prophecy",
    "destiny",
    "chosen",
    "fate",
    "foretold",
    "omen",
    "sign",
  ],
  "boundary:public-exposure": [
    "audience",
    "public",
    "stage",
    "watching",
    "filming",
    "posted",
    "crowd",
  ],
  "boundary:forced-recovery": ["recover", "recovery", "closure", "heal", "healing", "grief"],
  "boundary:memory-pressure": ["memory", "remember", "forgot", "past", "history"],
  "comfort:low-pressure": ["quiet", "calm", "low pressure", "easy", "simple", "normal"],
  "comfort:clear-plan": ["plan", "schedule", "reservation", "time", "route", "order"],
  "comfort:career-context": ["work", "career", "job", "client", "meeting", "shift"],
  "comfort:weirdness-tolerance": ["weird", "strange", "odd", "cosmic", "ritual", "portal"],
  "comfort:ceremony": ["ceremony", "ritual", "formal", "vow", "promise", "toast"],
  "comfort:sincerity": ["sincere", "honest", "real", "plain", "mean it"],
  "comfort:transactional-register": [
    "deal",
    "terms",
    "contract",
    "trade",
    "equity",
    "portfolio",
    "asset",
    "liquidity",
  ],
};

function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }
  const matches = trimmed.match(/[^.!?]+[.!?]+(\s|$)/gu);

  if (matches === null) {
    return [trimmed];
  }

  return matches.map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 0);
}
