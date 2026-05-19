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
  type ScenarioTag,
} from "../domain/game";
import { type MatchFitResult } from "./match-fit";
import { pushIntoBucket } from "./utils";

export type RevealCandidate = {
  id: string;
  subjectKind: "member" | "pair" | "scenario";
  subjectId: string;
  readKind: PlayerKnowledgeReadKind;
  readText: string;
  evidenceText: string;
  source: "judge";
  evidenceTerms?: readonly string[];
};

export type MemberFieldVisibilityTier =
  | "public"
  | "earned"
  | "mixed_state"
  | "presentation"
  | "prompt_private"
  | "never_player_facing";

export type MemberFieldVisibilityEntry = {
  field: keyof Member;
  tier: MemberFieldVisibilityTier;
  playerPath: string;
  readKinds?: readonly PlayerKnowledgeReadKind[];
};

export const MEMBER_PLAYER_VISIBILITY_CONTRACT: readonly MemberFieldVisibilityEntry[] = [
  {
    field: "id",
    tier: "public",
    playerPath:
      "Stable case identity. UI derives case file numbers from ids, raw ids stay plumbing.",
  },
  { field: "name", tier: "public", playerPath: "Roster cards, case files, and date surfaces." },
  {
    field: "firstName",
    tier: "public",
    playerPath: "Roster cards, prompts, case files, and date copy.",
  },
  {
    field: "characterHeightInInches",
    tier: "public",
    playerPath: "Listed profile height in member dossiers and date prompts.",
  },
  {
    field: "standeeRenderHeightInInches",
    tier: "never_player_facing",
    playerPath: "Asset normalization only. It is not dating profile canon.",
  },
  {
    field: "origin",
    tier: "never_player_facing",
    playerPath:
      "Internal authoring and prompt context. Player surfaces use public profile copy and reads.",
  },
  {
    field: "species",
    tier: "never_player_facing",
    playerPath:
      "Internal authoring and prompt context. Player surfaces use public profile copy and reads.",
  },
  {
    field: "dimension",
    tier: "never_player_facing",
    playerPath:
      "Internal authoring and prompt context. Player surfaces use public profile copy and reads.",
  },
  {
    field: "realityStatus",
    tier: "never_player_facing",
    playerPath:
      "Internal authoring and prompt context. Player surfaces use public profile copy and reads.",
  },
  {
    field: "bio",
    tier: "prompt_private",
    playerPath:
      "Runtime performer context only. Dates may reveal facts through transcript and memory.",
  },
  {
    field: "datingProfile",
    tier: "earned",
    playerPath:
      "First sentence is public. Remaining sentences unlock through a profile read with transcript evidence.",
    readKinds: ["profile"],
  },
  {
    field: "visualDescription",
    tier: "public",
    playerPath: "Portrait-derived description used by prompts and visual surfaces.",
  },
  {
    field: "relationshipNeeds",
    tier: "earned",
    playerPath:
      "Raw notes stay sealed. Player-safe ask reads file when a focus ask or need evidence matters in a date.",
    readKinds: ["ask"],
  },
  {
    field: "preferences",
    tier: "earned",
    playerPath:
      "Raw notes stay sealed. Player-safe comfort reads file when a comfort beat or preference evidence matters in a date.",
    readKinds: ["comfort"],
  },
  {
    field: "dealbreakers",
    tier: "earned",
    playerPath:
      "Raw notes stay sealed. Player-safe boundary reads file when a boundary risk or dealbreaker evidence matters in a date.",
    readKinds: ["boundary"],
  },
  {
    field: "secrets",
    tier: "prompt_private",
    playerPath: "Runtime performer pressure only. Raw secrets never render in player case files.",
  },
  {
    field: "tags",
    tier: "never_player_facing",
    playerPath:
      "Hidden deterministic inputs. Reads may derive player-safe consequences without exposing tag names.",
  },
  {
    field: "voice",
    tier: "prompt_private",
    playerPath:
      "Runtime performer style context only. Player sees the performed conversation, not the fixture field.",
  },
  {
    field: "state",
    tier: "mixed_state",
    playerPath:
      "Status, cooldown, current ask, and qualitative outcomes can surface. Exact mood, openness, burnout, and retention stay hidden.",
  },
  {
    field: "portraits",
    tier: "public",
    playerPath: "Approved portrait assets render in roster, dossiers, and dates.",
  },
  {
    field: "chatBubble",
    tier: "presentation",
    playerPath: "Visible date presentation style. It carries no player-facing case fact.",
  },
];

export type BuildRevealCandidatesInput = {
  members: readonly Member[];
  scenario: DateScenario;
  pairState: PairState;
  focusRequest?: MemberRequest;
  matchFit: MatchFitResult;
  knownReads?: readonly PlayerKnowledgeRecord[];
};

export type FilterExchangeEligibleInput = {
  candidates: readonly RevealCandidate[];
  exchangeMessages: readonly DateMessage[];
};

export type SelectDeterministicRevealIdsInput = {
  candidates: readonly RevealCandidate[];
  judgeSnapshot: JudgeSnapshot;
};

export type ApplyJudgeRevealsInput = {
  save: GameSave;
  candidates: readonly RevealCandidate[];
  acceptedIds: readonly string[];
  judgeSnapshot: JudgeSnapshot;
  revealedAt: string;
};

const MAX_REVEAL_PROMPT_CANDIDATES = 6;
const MAX_DETERMINISTIC_REVEALS_PER_PASS = 1;
const MAX_DETERMINISTIC_REVEALS_HIGH_DELTA = 2;
const HIGH_DATE_HEALTH_DELTA_THRESHOLD = 6;
const MEANINGFUL_DELTA_MAGNITUDE = 3;

type PlayerKnowledgeIndex = {
  bySubject: Map<string, PlayerKnowledgeRecord[]>;
  knownReadIds: Set<string>;
};

const PLAYER_KNOWLEDGE_INDEX_CACHE = new WeakMap<
  readonly PlayerKnowledgeRecord[],
  PlayerKnowledgeIndex
>();

function buildPlayerKnowledgeIndex(
  records: readonly PlayerKnowledgeRecord[],
): PlayerKnowledgeIndex {
  const bySubject = new Map<string, PlayerKnowledgeRecord[]>();
  const knownReadIds = new Set<string>();
  for (const record of records) {
    pushIntoBucket(bySubject, `${record.subjectKind}:${record.subjectId}`, record);
    knownReadIds.add(record.readId);
  }
  return { bySubject, knownReadIds };
}

function getOrBuildIndex(records: readonly PlayerKnowledgeRecord[]): PlayerKnowledgeIndex {
  let index = PLAYER_KNOWLEDGE_INDEX_CACHE.get(records);
  if (index === undefined) {
    index = buildPlayerKnowledgeIndex(records);
    PLAYER_KNOWLEDGE_INDEX_CACHE.set(records, index);
  }
  return index;
}

function getPlayerKnowledgeIndex(save: GameSave): PlayerKnowledgeIndex {
  return getOrBuildIndex(save.playerKnowledge);
}

function readsForSubject(
  save: GameSave,
  kind: PlayerKnowledgeRecord["subjectKind"],
  subjectId: string,
): PlayerKnowledgeRecord[] {
  const bucket = getPlayerKnowledgeIndex(save).bySubject.get(`${kind}:${subjectId}`);
  // Defensive copy so callers can sort or splice without mutating the cached bucket.
  return bucket === undefined ? [] : [...bucket];
}

export function visibleReadsForMember(save: GameSave, memberId: string): PlayerKnowledgeRecord[] {
  return readsForSubject(save, "member", memberId);
}

export function visibleReadsForPair(save: GameSave, pairId: string): PlayerKnowledgeRecord[] {
  return readsForSubject(save, "pair", pairId);
}

export function visibleReadsForScenario(
  save: GameSave,
  scenarioId: string,
): PlayerKnowledgeRecord[] {
  return readsForSubject(save, "scenario", scenarioId);
}

export function isReadKnown(save: GameSave, readId: string): boolean {
  return getPlayerKnowledgeIndex(save).knownReadIds.has(readId);
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

export type MemberProfileVisibilityMode = "earned" | "dev_unveiled";

export type BuildVisibleMemberProfileOptions = {
  visibilityMode?: MemberProfileVisibilityMode;
};

export function buildVisibleMemberProfile(
  member: Member,
  knowledge: readonly PlayerKnowledgeRecord[],
  options: BuildVisibleMemberProfileOptions = {},
): VisibleMemberProfile {
  const memberKnowledge = getOrBuildIndex(knowledge).bySubject.get(`member:${member.id}`) ?? [];
  const revealAll = options.visibilityMode === "dev_unveiled";
  const profileSentences = splitSentences(member.datingProfile);
  const publicFragments: string[] = [];

  if (profileSentences.length > 0) {
    publicFragments.push(profileSentences[0]);
  }

  const hasProfileRead =
    revealAll || memberKnowledge.some((record) => record.readKind === "profile");

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

  const hasNeedsRead = revealAll || memberKnowledge.some((record) => record.readKind === "ask");

  if (!hasNeedsRead) {
    redactedBlocks.push({
      id: `member:${member.id}:needs:sealed`,
      label: "Looking for",
      lineCount: Math.max(member.relationshipNeeds.length, 1),
    });
  }

  const hasPreferenceRead =
    revealAll || memberKnowledge.some((record) => record.readKind === "comfort");

  if (!hasPreferenceRead && member.preferences.length > 0) {
    redactedBlocks.push({
      id: `member:${member.id}:preferences:sealed`,
      label: "Preferences",
      lineCount: Math.min(member.preferences.length, 4),
    });
  }

  const hasBoundaryRead =
    revealAll || memberKnowledge.some((record) => record.readKind === "boundary");

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
    revealedReads: [...memberKnowledge],
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
    evidence:
      "Look for foretold-this-pair language, named destiny, chosen-one beats, or prophecy used to schedule the date.",
  },
  privacy_sensitive: {
    readId: "boundary:public-exposure",
    toReadText: (firstName) => `${firstName} pulls back when the room becomes a stage.`,
    evidence:
      "Look for named audience or crowd, filming or posting, performing for onlookers, or the room being treated as a public event.",
  },
  grief_sensitive: {
    readId: "boundary:forced-recovery",
    toReadText: (firstName) => `${firstName} flinches when the room pushes recovery on a schedule.`,
    evidence:
      "Look for closure or healing framed as a deliverable, prescribed grief steps, or recovery as the point of the date.",
  },
  memory_sensitive: {
    readId: "boundary:memory-pressure",
    toReadText: (firstName) => `${firstName} guards how their past gets handled.`,
    evidence:
      "Look for the partner pressing on a named past event, requests to revisit or explain a memory, or memory used to corner the member.",
  },
};

const MEMBER_COMFORT_READS: Partial<
  Record<MemberTag, { readId: string; toReadText: (firstName: string) => string; evidence: string }>
> = {
  needs_low_pressure: {
    readId: "comfort:low-pressure",
    toReadText: (firstName) => `${firstName} relaxes when the room takes pressure off.`,
    evidence:
      "Look for the pair settling into a slower pace, named low-stakes choices, or relief beats that read as pressure dropping.",
  },
  needs_clear_plan: {
    readId: "comfort:clear-plan",
    toReadText: (firstName) => `${firstName} settles when the plan stays clear.`,
    evidence:
      "Look for the pair sticking to a named plan, confirming an order or itinerary, or refusing to dissolve the agenda.",
  },
  career_focused: {
    readId: "comfort:career-context",
    toReadText: (firstName) =>
      `${firstName} engages when the room makes work part of the conversation.`,
    evidence:
      "Look for the partner asking about work as work, a concrete career detail landing, or career framing treated as legitimate.",
  },
  weirdness_native: {
    readId: "comfort:weirdness-tolerance",
    toReadText: (firstName) => `${firstName} treats the strange parts of the room as normal.`,
    evidence:
      "Look for the member meeting a cosmic, ritual, or portal beat without flinching while the partner treats it as ordinary.",
  },
  ceremony_minded: {
    readId: "comfort:ceremony",
    toReadText: (firstName) => `${firstName} responds to ritual and structure in the room.`,
    evidence:
      "Look for a named ritual, toast, vow, or formal beat that the member meets with seriousness instead of irony.",
  },
  sincerity_seeking: {
    readId: "comfort:sincerity",
    toReadText: (firstName) => `${firstName} responds to plain sincerity from a partner.`,
    evidence:
      "Look for the partner dropping a bit or performance and the member softening on the next move.",
  },
  acquisitive: {
    readId: "comfort:transactional-register",
    toReadText: (firstName) =>
      `${firstName} settles when the room treats relationships as something to acquire.`,
    evidence:
      "Look for contract, terms, equity, recruiting, or portfolio vocabulary landing without the partner pushing back.",
  },
};

const SCENARIO_PRESSURE_READS: Partial<
  Record<ScenarioTag, { readId: string; readText: string; evidence: string }>
> = {
  public: {
    readId: "pressure:public-attention",
    readText: "This room turns public attention into the main hazard.",
    evidence:
      "Look for an audience, crowd, filming, or posting beat reshaping how the pair behaves.",
  },
  prophecy: {
    readId: "pressure:prophecy-framing",
    readText: "This room applies fate framing to whoever shows up.",
    evidence: "Look for the room invoking destiny, prophecy, or chosen-one framing on the pair.",
  },
  memory: {
    readId: "pressure:memory-recovery",
    readText: "This room presses on memory in a way that asks for recovery.",
    evidence:
      "Look for the room demanding the pair revisit a named memory, or framing recovery as the deliverable.",
  },
  high_pressure: {
    readId: "pressure:high-pressure",
    readText: "This room runs hot. Pressure is the point.",
    evidence:
      "Look for a named deadline, escalating stakes, or scene beats that crank intensity rather than ease it.",
  },
  haunted: {
    readId: "pressure:haunted-business",
    readText: "This room treats unfinished business as the floor plan.",
    evidence:
      "Look for the room surfacing the pair's prior breach, return, or unsettled business as the scene driver.",
  },
  temporal: {
    readId: "pressure:temporal-shift",
    readText: "This room rewrites time on whoever is in it.",
    evidence: "Look for a time loop, replay, rewind, or temporal jump landing in the exchange.",
  },
  cosmic: {
    readId: "pressure:cosmic-scale",
    readText: "This room stages the date at cosmic scale.",
    evidence: "Look for cosmic stakes, scale beats, or vast framing arriving in the scene.",
  },
};

const PAIR_DYNAMIC_READS: Record<string, { readId: string; readText: string; evidence: string }> = {
  "pair:sincerity_vs_performance": {
    readId: "dynamic:sincerity-vs-performance",
    readText: "Sincerity and performance pull against each other in this pair.",
    evidence:
      "Look for one member offering a plain truth and the other reaching for a bit or deflection.",
  },
  "pair:status_vs_attention": {
    readId: "dynamic:status-vs-attention",
    readText: "Status and attention compete for the same room.",
    evidence:
      "Look for one member guarding standing or reputation while the other steers the room toward eyes on them.",
  },
  "pair:shared_spiral": {
    readId: "dynamic:shared-spiral",
    readText: "Both members spiral when stress lands at once.",
    evidence:
      "Look for both members escalating worry, second-guessing, or panic in the same exchange.",
  },
  "pair:career_alignment": {
    readId: "dynamic:career-alignment",
    readText: "Career focus aligns the pair when the room makes room for it.",
    evidence:
      "Look for both members trading concrete work detail and treating career as legitimate dating ground.",
  },
  "pair:ceremony_alignment": {
    readId: "dynamic:ceremony-alignment",
    readText: "Both members lean into ritual together.",
    evidence:
      "Look for both members meeting a named ritual, toast, or formal beat with shared seriousness.",
  },
  "pair:mutual_acquisition": {
    readId: "dynamic:mutual-acquisition",
    readText: "Both members treat the table as a recruitment funnel.",
    evidence:
      "Look for both members trading contract, terms, equity, or recruiting vocabulary as the love language.",
  },
  "pair:competitive_clash": {
    readId: "dynamic:competitive-clash",
    readText: "Competitive instincts make the room sharper than the rubric expects.",
    evidence: "Look for both members keeping score, racing, or one-upping inside the exchange.",
  },
  "pair:attention_rivalry": {
    readId: "dynamic:attention-rivalry",
    readText: "Both members want the spotlight at the same time.",
    evidence: "Look for both members angling for the audience or interrupting to take the floor.",
  },
  "pair:performer_distrust": {
    readId: "dynamic:performer-distrust",
    readText: "Performance reads as masking to both members.",
    evidence: "Look for both members calling out a bit, performance, or mask in the other's move.",
  },
  "pair:grief_high_intimacy_overload": {
    readId: "dynamic:grief-high-intimacy-overload",
    readText: "Shared grief plus high intimacy overwhelms the room.",
    evidence:
      "Look for both members hitting a loss or healing beat in an already-intimate room and going quiet or shutting down.",
  },
  "pair:grief_low_intimacy_alignment": {
    readId: "dynamic:grief-low-intimacy-alignment",
    readText: "Shared grief fits a quieter setting.",
    evidence:
      "Look for both members trading a quiet acknowledgment of loss without the room pushing for resolution.",
  },
  "pair:weirdness_displaced_recognition": {
    readId: "dynamic:weirdness-recognition",
    readText: "Weirdness and displacement recognize each other across the table.",
    evidence:
      "Look for one member naming the strange parts of the room as ordinary while the other registers displacement.",
  },
  "pair:ceremony_vs_performance": {
    readId: "dynamic:ceremony-vs-performance",
    readText: "Ceremony and performance read past each other.",
    evidence:
      "Look for one member holding a ritual or vow seriously while the other treats it as material for a bit.",
  },
  "pair:privacy_vs_attention": {
    readId: "dynamic:privacy-vs-attention",
    readText: "Privacy and attention pull in opposite directions.",
    evidence: "Look for one member shrinking the room while the other invites the audience in.",
  },
  "pair:repeat_scenario": {
    readId: "dynamic:repeat-room",
    readText: "This pair has worked this room before.",
    evidence: "Look for the pair referencing the prior booking, the last time, or the same room.",
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
  const knownReadIndex = getOrBuildIndex(input.knownReads ?? []);

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
          source: "judge",
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
        const block = describeAskBlock(requestMember, input.scenario, input.matchFit);
        pushCandidate({
          id: `member:${requestMember.id}:ask-blocked:${input.focusRequest.id}`,
          subjectKind: "member",
          subjectId: requestMember.id,
          readKind: "ask",
          readText: block.readText,
          evidenceText: block.evidence,
          source: "judge",
        });
      } else if (input.matchFit.coveredRequestIds.includes(input.focusRequest.id)) {
        const cover = describeAskCover(requestMember, input.scenario);
        pushCandidate({
          id: `member:${requestMember.id}:ask-covered:${input.focusRequest.id}`,
          subjectKind: "member",
          subjectId: requestMember.id,
          readKind: "ask",
          readText: cover.readText,
          evidenceText: cover.evidence,
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

  for (const member of input.members) {
    const memberRecords = knownReadIndex.bySubject.get(`member:${member.id}`) ?? [];
    pushMemberSurfaceFallbackCandidates({
      member,
      candidates,
      pushCandidate,
      knownReadKinds: new Set(memberRecords.map((record) => record.readKind)),
    });
  }

  return candidates;
}

function pushMemberSurfaceFallbackCandidates({
  member,
  candidates,
  pushCandidate,
  knownReadKinds,
}: {
  member: Member;
  candidates: readonly RevealCandidate[];
  pushCandidate: (candidate: RevealCandidate) => void;
  knownReadKinds: ReadonlySet<PlayerKnowledgeReadKind>;
}) {
  const hasCandidate = (readKind: PlayerKnowledgeReadKind) =>
    candidates.some(
      (candidate) =>
        candidate.subjectKind === "member" &&
        candidate.subjectId === member.id &&
        candidate.readKind === readKind,
    );

  if (
    !knownReadKinds.has("profile") &&
    !hasCandidate("profile") &&
    splitSentences(member.datingProfile).length > 1
  ) {
    pushCandidate({
      id: `member:${member.id}:profile:expand`,
      subjectKind: "member",
      subjectId: member.id,
      readKind: "profile",
      readText: `More of ${member.firstName}'s Cupid profile reads through in conversation.`,
      evidenceText: `Look for ${member.firstName} volunteering a detail from their Cupid profile beyond the opening line, or expanding on a topic the profile lists in their own words.`,
      evidenceTerms: buildMemberEvidenceTerms(
        member,
        splitSentences(member.datingProfile).slice(1),
      ),
      source: "judge",
    });
  }

  if (!knownReadKinds.has("ask") && !hasCandidate("ask") && member.relationshipNeeds.length > 0) {
    pushCandidate({
      id: `member:${member.id}:ask:needs`,
      subjectKind: "member",
      subjectId: member.id,
      readKind: "ask",
      readText: `Cupid has a clearer read on what ${member.firstName} needs from the table.`,
      evidenceText: `Look for ${member.firstName}'s dating needs becoming visible in the exchange.`,
      evidenceTerms: buildMemberEvidenceTerms(member, member.relationshipNeeds),
      source: "judge",
    });
  }

  if (!knownReadKinds.has("comfort") && !hasCandidate("comfort") && member.preferences.length > 0) {
    pushCandidate({
      id: `member:${member.id}:comfort:preferences`,
      subjectKind: "member",
      subjectId: member.id,
      readKind: "comfort",
      readText: `Cupid has a clearer read on what helps ${member.firstName} stay engaged.`,
      evidenceText: `Look for one of ${member.firstName}'s soft preferences becoming visible in the exchange.`,
      evidenceTerms: buildMemberEvidenceTerms(member, member.preferences),
      source: "judge",
    });
  }

  if (
    !knownReadKinds.has("boundary") &&
    !hasCandidate("boundary") &&
    member.dealbreakers.length > 0
  ) {
    pushCandidate({
      id: `member:${member.id}:boundary:dealbreakers`,
      subjectKind: "member",
      subjectId: member.id,
      readKind: "boundary",
      readText: `Cupid has a clearer read on what makes ${member.firstName} pull back.`,
      evidenceText: `Look for one of ${member.firstName}'s dealbreakers becoming visible in the exchange.`,
      evidenceTerms: buildMemberEvidenceTerms(member, member.dealbreakers),
      source: "judge",
    });
  }
}

function describeAskBlock(
  member: Member,
  scenario: DateScenario,
  matchFit: BuildRevealCandidatesInput["matchFit"],
): { readText: string; evidence: string } {
  const firstName = member.firstName;

  if (matchFit.boundaryRisk?.memberId === member.id) {
    return {
      readText: `${firstName}'s ask cannot land while the room presses on a dealbreaker.`,
      evidence:
        "Look for the partner or scenario forcing the named dealbreaker into the ask itself.",
    };
  }

  const scenarioTags = new Set<ScenarioTag>(scenario.card.tags);

  if (scenarioTags.has("prophecy")) {
    return {
      readText: `${firstName}'s ask gets overwritten by destiny framing in this room.`,
      evidence: "Look for prophecy or chosen-one framing reshaping the focused ask.",
    };
  }

  if (scenarioTags.has("public")) {
    return {
      readText: `${firstName}'s ask cannot land while the room is a stage.`,
      evidence: "Look for public attention or filming reshaping the focused ask into performance.",
    };
  }

  if (scenarioTags.has("high_pressure") || scenario.card.risk === "high") {
    return {
      readText: `${firstName}'s ask cannot survive this room's pressure level.`,
      evidence: "Look for stakes or pace pushing past what the focused ask can carry.",
    };
  }

  if (scenarioTags.has("memory") && scenario.card.intimacy === "high") {
    return {
      readText: `${firstName}'s ask runs into the room's memory pressure.`,
      evidence: "Look for the room pulling the ask back into a named past event.",
    };
  }

  return {
    readText: `${firstName}'s ask does not fit this room as scheduled.`,
    evidence: "Look for the room reshaping or refusing the focused ask within the exchange.",
  };
}

function describeAskCover(
  member: Member,
  scenario: DateScenario,
): { readText: string; evidence: string } {
  const firstName = member.firstName;
  const scenarioTags = new Set<ScenarioTag>(scenario.card.tags);

  if (scenarioTags.has("low_pressure")) {
    return {
      readText: `${firstName}'s ask fits this room's quieter pressure.`,
      evidence: "Look for the room's low-pressure shape giving the ask room to land plainly.",
    };
  }

  if (scenarioTags.has("career")) {
    return {
      readText: `${firstName}'s ask lands inside the room's career framing.`,
      evidence: "Look for career context covering the focused ask without strain.",
    };
  }

  if (scenarioTags.has("domestic")) {
    return {
      readText: `${firstName}'s ask fits this room's domestic register.`,
      evidence: "Look for a low-key home or routine beat making the ask easy to honor.",
    };
  }

  return {
    readText: `${firstName}'s ask fits this room without strain.`,
    evidence: "Look for the room honoring the focused ask plainly in the exchange.",
  };
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

  const normalizedExchangeText = normalizeEvidenceText(exchangeText);
  for (const candidate of input.candidates) {
    if (candidate.readKind === "ask") {
      if (
        candidate.evidenceTerms === undefined ||
        memberEvidenceTermsMatchExchange(candidate, normalizedExchangeText)
      ) {
        eligible.push(candidate);
      }
      continue;
    }

    if (candidate.readKind === "profile") {
      if (profileMatchesExchange(candidate, input.exchangeMessages, normalizedExchangeText)) {
        eligible.push(candidate);
      }
      continue;
    }

    if (candidate.readKind === "scenario_pressure") {
      const referencesEvidence = scenarioPressureMatchesExchange(candidate, exchangeText);

      if (referencesEvidence || hasPendingScenarioEvent) {
        eligible.push(candidate);
      }
      continue;
    }

    if (candidate.readKind === "pair_dynamic") {
      if (pairDynamicMatchesExchange(candidate, exchangeText)) {
        eligible.push(candidate);
      }
      continue;
    }

    if (candidate.readKind === "comfort" || candidate.readKind === "boundary") {
      if (
        memberReadMatchesExchange(candidate, exchangeText) ||
        memberEvidenceTermsMatchExchange(candidate, normalizedExchangeText)
      ) {
        eligible.push(candidate);
      }
      continue;
    }
  }

  return prioritizeAndCap(eligible);
}

const REVEAL_PRIORITY_ORDER: readonly PlayerKnowledgeReadKind[] = [
  "ask",
  "pair_dynamic",
  "scenario_pressure",
  "comfort",
  "boundary",
  "profile",
];

function prioritizeAndCap(candidates: RevealCandidate[]): RevealCandidate[] {
  const sorted = [...candidates].sort((first, second) => {
    return (
      REVEAL_PRIORITY_ORDER.indexOf(first.readKind) - REVEAL_PRIORITY_ORDER.indexOf(second.readKind)
    );
  });
  return sorted.slice(0, MAX_REVEAL_PROMPT_CANDIDATES);
}

export function selectDeterministicRevealIds(input: SelectDeterministicRevealIdsInput): string[] {
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

  // Profile reads need an LLM-proposed evidence id; the deterministic fallback never auto-files
  // them based on date-health swings alone.
  const sorted = [...input.candidates]
    .filter((candidate) => candidate.readKind !== "profile")
    .sort(
      (first, second) =>
        REVEAL_PRIORITY_ORDER.indexOf(first.readKind) -
        REVEAL_PRIORITY_ORDER.indexOf(second.readKind),
    );

  return sorted.slice(0, limit).map((candidate) => candidate.id);
}

export function applyJudgeReveals({
  save,
  candidates,
  acceptedIds,
  judgeSnapshot,
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
    const confidence: PlayerKnowledgeRecord["confidence"] =
      existing !== undefined && existing.confidence === "filed" ? "confirmed" : "filed";

    const record = playerKnowledgeRecordSchema.parse({
      id: `${candidate.id}:${judgeSnapshot.id}`,
      subjectKind: candidate.subjectKind,
      subjectId: candidate.subjectId,
      readKind: candidate.readKind,
      readId: candidate.id,
      readText: candidate.readText,
      confidence,
      source: "judge",
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
  "public-attention": ["audience", "crowd", "stage", "filming", "filmed", "posted", "spectator"],
  "prophecy-framing": ["prophecy", "destiny", "chosen one", "foretold", "fated"],
  "memory-recovery": ["closure", "recovery", "heal", "healing", "grief"],
  "high-pressure": ["high pressure", "stakes", "deadline", "urgent"],
  "haunted-business": ["unfinished", "haunted", "last time we", "same room"],
  "temporal-shift": ["time loop", "rewind", "replay", "reset the day", "yesterday again"],
  "cosmic-scale": ["cosmic", "constellation", "galaxy", "vast"],
};

function pairDynamicMatchesExchange(candidate: RevealCandidate, exchangeText: string): boolean {
  if (exchangeText.length === 0) {
    return false;
  }
  const keywords = PAIR_DYNAMIC_KEYWORDS[candidate.id.split(":dynamic:")[1] ?? ""] ?? [];
  return keywords.some((keyword) => exchangeText.includes(keyword));
}

const PAIR_DYNAMIC_KEYWORDS: Record<string, string[]> = {
  "sincerity-vs-performance": ["sincerely", "honestly", "doing a bit", "performing", "performance"],
  "status-vs-attention": ["status", "reputation", "spotlight", "look important"],
  "shared-spiral": ["spiraling", "spiral", "panicking", "freaking out"],
  "career-alignment": ["career", "shift", "client", "deadline", "promotion", "quarter"],
  "ceremony-alignment": ["ceremony", "ritual", "vow", "toast", "blessing"],
  "competitive-clash": ["winning", "compete", "keep score", "beat you"],
  "attention-rivalry": ["spotlight", "filming", "everyone's looking", "audience"],
  "performer-distrust": ["doing a bit", "performance", "mask", "pretending"],
  "grief-high-intimacy-overload": ["grief", "loss", "mourning", "funeral"],
  "grief-low-intimacy-alignment": ["grief", "loss", "mourning", "quietly"],
  "weirdness-recognition": ["cosmic", "portal", "dimension", "elsewhere", "from elsewhere"],
  "ceremony-vs-performance": ["ceremony", "ritual", "doing a bit", "mock"],
  "privacy-vs-attention": ["private", "privacy", "filming", "audience"],
  "repeat-room": ["last time we", "same room", "we did this before", "we were here"],
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
  "boundary:destiny-pressure": ["prophecy", "destiny", "chosen one", "foretold", "fated", "omen"],
  "boundary:public-exposure": [
    "audience",
    "crowd",
    "stage",
    "filming",
    "filmed",
    "posted",
    "spectator",
  ],
  "boundary:forced-recovery": ["closure", "recovery", "heal", "healing", "moved on"],
  "boundary:memory-pressure": ["that memory", "what you remembered", "back then", "your past"],
  "comfort:low-pressure": ["low pressure", "no rush", "take it easy", "slow down"],
  "comfort:clear-plan": ["the plan", "stick to", "reservation", "itinerary", "agenda"],
  "comfort:career-context": ["career", "shift", "client", "promotion", "quarter", "the job"],
  "comfort:weirdness-tolerance": ["cosmic", "portal", "dimension", "ritual", "the weirdness"],
  "comfort:ceremony": ["ceremony", "ritual", "vow", "toast", "blessing"],
  "comfort:sincerity": ["sincerely", "honestly", "plainly", "mean it", "for real"],
  "comfort:transactional-register": [
    "deal",
    "terms",
    "contract",
    "equity",
    "portfolio",
    "liquidity",
    "recruiting",
  ],
};

const PROFILE_SELF_DISCLOSURE_CUES: readonly string[] = [
  "my profile",
  "my cupid profile",
  "profile says",
  "profile reads",
  "what i wrote",
  "what i put",
  "i wrote that",
  "i put that",
  "in my profile",
  "on my profile",
];

function profileMatchesExchange(
  candidate: RevealCandidate,
  exchangeMessages: readonly DateMessage[],
  normalizedExchangeText: string,
): boolean {
  if (candidate.subjectKind !== "member" || normalizedExchangeText.length === 0) {
    return false;
  }

  const subjectLines: string[] = [];
  for (const message of exchangeMessages) {
    if (message.kind !== "character") {
      continue;
    }
    if (message.speakerId === candidate.subjectId) {
      subjectLines.push(message.text);
    }
  }

  if (subjectLines.length === 0) {
    return false;
  }

  const subjectText = normalizeEvidenceText(subjectLines.join("\n"));
  if (PROFILE_SELF_DISCLOSURE_CUES.some((cue) => includesEvidenceTerm(subjectText, cue))) {
    return true;
  }

  return memberEvidenceTermsMatchExchange(candidate, normalizedExchangeText);
}

function memberEvidenceTermsMatchExchange(
  candidate: RevealCandidate,
  normalizedExchangeText: string,
): boolean {
  if (candidate.subjectKind !== "member" || normalizedExchangeText.length === 0) {
    return false;
  }

  const evidenceTerms = candidate.evidenceTerms ?? [];
  if (evidenceTerms.length === 0) {
    return false;
  }

  if (
    evidenceTerms.some(
      (term) => term.includes(" ") && includesEvidenceTerm(normalizedExchangeText, term),
    )
  ) {
    return true;
  }

  let singleTermMatches = 0;
  const seen = new Set<string>();

  for (const term of evidenceTerms) {
    if (term.includes(" ") || seen.has(term)) {
      continue;
    }

    if (includesEvidenceTerm(normalizedExchangeText, term)) {
      seen.add(term);
      singleTermMatches += 1;
    }

    if (singleTermMatches >= MIN_SINGLE_TERM_MATCHES) {
      return true;
    }
  }

  return false;
}

function includesEvidenceTerm(text: string, term: string): boolean {
  return ` ${text} `.includes(` ${term} `);
}

const EVIDENCE_TERM_CAP = 48;
const MIN_EVIDENCE_PHRASE_LENGTH = 9;
const MIN_EVIDENCE_TOKEN_LENGTH = 6;
const MIN_SINGLE_TERM_MATCHES = 2;
const EVIDENCE_PHRASE_SIZES: readonly number[] = [2, 3];

function buildMemberEvidenceTerms(member: Member, texts: readonly string[]): readonly string[] {
  const blocked = new Set<string>([
    ...COMMON_EVIDENCE_STOP_WORDS,
    ...normalizeEvidenceText(member.name).split(" "),
    normalizeEvidenceText(member.firstName),
  ]);
  const phrases = new Set<string>();
  const singles = new Set<string>();

  for (const text of texts) {
    const tokens = normalizeEvidenceText(text)
      .split(" ")
      .filter((token) => isEvidenceToken(token, blocked));

    for (const token of tokens) {
      singles.add(token);
    }

    for (const size of EVIDENCE_PHRASE_SIZES) {
      for (let index = 0; index <= tokens.length - size; index += 1) {
        const phrase = tokens.slice(index, index + size).join(" ");
        if (phrase.length >= MIN_EVIDENCE_PHRASE_LENGTH) {
          phrases.add(phrase);
        }
      }
    }
  }

  return [...phrases, ...singles].slice(0, EVIDENCE_TERM_CAP);
}

function isEvidenceToken(token: string, blocked: ReadonlySet<string>): boolean {
  if (blocked.has(token)) {
    return false;
  }

  return token.length >= MIN_EVIDENCE_TOKEN_LENGTH || /\d/u.test(token);
}

function normalizeEvidenceText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9' ]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

const COMMON_EVIDENCE_STOP_WORDS: readonly string[] = [
  "about",
  "across",
  "after",
  "again",
  "against",
  "almost",
  "already",
  "also",
  "always",
  "anyone",
  "anything",
  "around",
  "because",
  "before",
  "being",
  "between",
  "could",
  "cupid",
  "date",
  "dating",
  "dinner",
  "does",
  "during",
  "every",
  "first",
  "flirting",
  "from",
  "going",
  "inside",
  "instead",
  "looking",
  "needs",
  "notes",
  "partner",
  "partners",
  "people",
  "person",
  "photos",
  "place",
  "places",
  "profile",
  "really",
  "someone",
  "table",
  "their",
  "there",
  "thing",
  "through",
  "tonight",
  "treats",
  "venue",
  "venues",
  "where",
  "which",
  "without",
  "would",
];

export function splitSentences(text: string): string[] {
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
