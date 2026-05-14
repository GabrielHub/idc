import {
  judgeSnapshotSchema,
  type DateScenario,
  type DateSession,
  type JudgeSnapshot,
  type Member,
  type MemberRequest,
  type MemberRequestTag,
  type MemberTag,
  type PairState,
  type PlayerKnowledgeRecord,
} from "../domain/game";
import { makePairId } from "./game-seed";
import { clamp } from "./utils";

export type MatchFitLevel = "strong" | "neutral" | "risky";
export type MatchPressureLevel = "low" | "medium" | "high";
export type MatchAskSignal = "covered" | "uncertain" | "blocked" | "none";

export type MatchFitPublicSignal = {
  fitLevel: MatchFitLevel;
  pressureLevel: MatchPressureLevel;
  askSignal: MatchAskSignal;
};

export type MatchFitBoundaryRisk = {
  memberId: string;
  reason: string;
};

export type MatchFitResult = MatchFitPublicSignal & {
  startingDateHealthDelta: number;
  boundaryRisk: MatchFitBoundaryRisk | null;
  blockedRequestIds: string[];
  coveredRequestIds: string[];
  internalRuleHits: string[];
};

export type MatchRecommendationCandidate<TCandidate> = {
  candidate: TCandidate;
  fit: MatchFitResult;
};

export type EvaluateMatchFitInput = {
  members: readonly Member[];
  scenario: DateScenario;
  pairState: PairState;
  activeRequests?: readonly MemberRequest[];
  knownPairReads?: readonly PlayerKnowledgeRecord[];
};

export type ApplyMatchFitToJudgeInput = {
  session: DateSession;
  pairState: PairState;
  judgeSnapshot: JudgeSnapshot;
};

const HIGH_PRESSURE_THRESHOLD = 6;
const MEDIUM_PRESSURE_THRESHOLD = 3;
const WALKOUT_DATE_HEALTH_THRESHOLD = 25;
const WALKOUT_SOFT_HEALTH_THRESHOLD = 40;
const WALKOUT_STRAIN_THRESHOLD = 60;
const WALKOUT_CONFLICT_THRESHOLD = 60;
const WALKOUT_EXCHANGE_TENSION_DELTA = 4;
const SHARP_DROP_THRESHOLD = -6;
const RECOMMENDATION_MIN_STARTING_HEALTH_DELTA = 5;
const RECOMMENDATION_MIN_SCORE_LEAD = 3;
const PROPHECY_BLOCKED_REQUEST_TAGS = [
  "prophecy_averse",
  "normal_date",
  "choice",
] satisfies readonly MemberRequestTag[];
const HIGH_PRESSURE_BLOCKED_REQUEST_TAGS = [
  "privacy",
  "quiet_date",
  "discretion",
  "name_discretion",
] satisfies readonly MemberRequestTag[];
const LOW_PRESSURE_BLOCKED_REQUEST_TAGS = [
  "low_pressure",
  "career_fatigue",
] satisfies readonly MemberRequestTag[];
const SINCERITY_REQUEST_TAGS = [
  "sincerity",
  "grounded",
  "widower",
] satisfies readonly MemberRequestTag[];
const LOW_PRESSURE_COVERED_REQUEST_TAGS = [
  "normal_date",
  "low_pressure",
  "career_fatigue",
] satisfies readonly MemberRequestTag[];
const CAREER_COVERED_REQUEST_TAGS = [
  "career",
  "respect",
  "decisiveness",
] satisfies readonly MemberRequestTag[];
const STRUCTURE_REQUEST_TAG = "structure" satisfies MemberRequestTag;
const WARM_PAIR_READ_SUFFIXES = new Set<string>([
  "dynamic:career-alignment",
  "dynamic:ceremony-alignment",
  "dynamic:mutual-acquisition",
  "dynamic:grief-low-intimacy-alignment",
  "dynamic:weirdness-recognition",
]);
const FRICTION_PAIR_READ_SUFFIXES = new Set<string>([
  "dynamic:sincerity-vs-performance",
  "dynamic:status-vs-attention",
  "dynamic:shared-spiral",
  "dynamic:competitive-clash",
  "dynamic:attention-rivalry",
  "dynamic:performer-distrust",
  "dynamic:grief-high-intimacy-overload",
  "dynamic:ceremony-vs-performance",
  "dynamic:privacy-vs-attention",
  "dynamic:repeat-room",
]);

type AuthoredMemberScenarioRule = {
  memberId: string;
  scenarioIds: readonly string[];
  scoreDelta: number;
  pressureDelta: number;
  ruleHit: string;
};

type AuthoredPairRule = {
  memberIds: readonly [string, string];
  scoreDelta: number;
  pressureDelta: number;
  ruleHit: string;
};

type AuthoredRequestRule = {
  requestIds: readonly string[];
  status: Exclude<MatchAskSignal, "none">;
  ruleHit: string;
  partnerIds?: readonly string[];
  scenarioIds?: readonly string[];
};

type AuthoredScore = {
  scoreDelta: number;
  pressureDelta: number;
};

const AUTHORED_MEMBER_SCENARIO_RULES: readonly AuthoredMemberScenarioRule[] = [
  {
    memberId: "anansi",
    scenarioIds: ["hotel-bar-last-call", "diner-eleven-pm", "adventurers-speakeasy"],
    scoreDelta: 3,
    pressureDelta: 0,
    ruleHit: "anansi:long_story_room",
  },
  {
    memberId: "anansi",
    scenarioIds: ["soft-launch-photo-wall"],
    scoreDelta: -7,
    pressureDelta: 3,
    ruleHit: "anansi:filming_story_pressure",
  },
  {
    memberId: "nawal-marrash",
    scenarioIds: [
      "chain-restaurant-tuesday",
      "dmv-number-ticket",
      "executive-lunch-one-agenda-item",
    ],
    scoreDelta: 3,
    pressureDelta: 0,
    ruleHit: "nawal:confirmed_low_followup_room",
  },
  {
    memberId: "nawal-marrash",
    scenarioIds: ["underworld-department-mixer"],
    scoreDelta: -3,
    pressureDelta: 2,
    ruleHit: "nawal:office_reopened_room",
  },
  {
    memberId: "nawal-marrash",
    scenarioIds: ["memory-course-dinner"],
    scoreDelta: -2,
    pressureDelta: 2,
    ruleHit: "nawal:caseload_memory_pressure",
  },
  {
    memberId: "imani-wallace",
    scenarioIds: ["diner-eleven-pm", "grocery-run-one-dinner"],
    scoreDelta: 3,
    pressureDelta: 0,
    ruleHit: "imani:shift_hour_real_place",
  },
  {
    memberId: "imani-wallace",
    scenarioIds: ["listening-booth-after-close"],
    scoreDelta: 2,
    pressureDelta: 0,
    ruleHit: "imani:music_followup_room",
  },
  {
    memberId: "imani-wallace",
    scenarioIds: ["soft-launch-photo-wall"],
    scoreDelta: -7,
    pressureDelta: 3,
    ruleHit: "imani:filmed_job_pressure",
  },
  {
    memberId: "sienna-bae",
    scenarioIds: ["diner-eleven-pm"],
    scoreDelta: 3,
    pressureDelta: 0,
    ruleHit: "sienna:post_rehearsal_late_booth",
  },
  {
    memberId: "sienna-bae",
    scenarioIds: ["soft-launch-photo-wall"],
    scoreDelta: -9,
    pressureDelta: 4,
    ruleHit: "sienna:label_clause_camera_pressure",
  },
  {
    memberId: "sienna-bae",
    scenarioIds: ["cousins-wedding-plus-one"],
    scoreDelta: -5,
    pressureDelta: 3,
    ruleHit: "sienna:public_photo_call_pressure",
  },
  {
    memberId: "sienna-bae",
    scenarioIds: ["hotel-bar-last-call", "listening-booth-after-close"],
    scoreDelta: -3,
    pressureDelta: 2,
    ruleHit: "sienna:silence_anxiety_room",
  },
  {
    memberId: "maeve",
    scenarioIds: ["hotel-bar-last-call", "empty-room-many-windows", "long-afternoon-pool-bar"],
    scoreDelta: 4,
    pressureDelta: 0,
    ruleHit: "maeve:long_silence_room",
  },
  {
    memberId: "maeve",
    scenarioIds: ["memory-course-dinner"],
    scoreDelta: -6,
    pressureDelta: 3,
    ruleHit: "maeve:forced_unsaid_receipt",
  },
  {
    memberId: "maeve",
    scenarioIds: ["chain-restaurant-tuesday"],
    scoreDelta: -3,
    pressureDelta: 1,
    ruleHit: "maeve:ninety_minute_turnover",
  },
  {
    memberId: "maeve",
    scenarioIds: ["soft-launch-photo-wall"],
    scoreDelta: -8,
    pressureDelta: 4,
    ruleHit: "maeve:camera_consent_pressure",
  },
];

const AUTHORED_PAIR_RULES: readonly AuthoredPairRule[] = [
  {
    memberIds: ["anansi", "mei-sato"],
    scoreDelta: 5,
    pressureDelta: 0,
    ruleHit: "pair:anansi_mei_story_craft",
  },
  {
    memberIds: ["anansi", "naia-velorae"],
    scoreDelta: 4,
    pressureDelta: 0,
    ruleHit: "pair:anansi_naia_no_count",
  },
  {
    memberIds: ["anansi", "sana-karim"],
    scoreDelta: -6,
    pressureDelta: 2,
    ruleHit: "pair:anansi_sana_lie_evasion",
  },
  {
    memberIds: ["aldric-vale-marsh", "anansi"],
    scoreDelta: -6,
    pressureDelta: 2,
    ruleHit: "pair:anansi_aldric_blasphemy_read",
  },
  {
    memberIds: ["anansi", "kade-sumner"],
    scoreDelta: -7,
    pressureDelta: 2,
    ruleHit: "pair:anansi_kade_filmed_punchline",
  },
  {
    memberIds: ["cha-yusung", "nawal-marrash"],
    scoreDelta: 5,
    pressureDelta: 0,
    ruleHit: "pair:nawal_cha_ex_professional_silence",
  },
  {
    memberIds: ["naia-velorae", "nawal-marrash"],
    scoreDelta: 5,
    pressureDelta: 0,
    ruleHit: "pair:nawal_naia_plain_answer",
  },
  {
    memberIds: ["imani-wallace", "nawal-marrash"],
    scoreDelta: 4,
    pressureDelta: 0,
    ruleHit: "pair:imani_nawal_post_career_silence",
  },
  {
    memberIds: ["maeve", "nawal-marrash"],
    scoreDelta: 4,
    pressureDelta: 0,
    ruleHit: "pair:maeve_nawal_closed_questions",
  },
  {
    memberIds: ["nawal-marrash", "venus"],
    scoreDelta: -6,
    pressureDelta: 2,
    ruleHit: "pair:nawal_venus_compliment_economy",
  },
  {
    memberIds: ["bai-wenshu", "nawal-marrash"],
    scoreDelta: -7,
    pressureDelta: 2,
    ruleHit: "pair:nawal_wenshu_cosmic_vocabulary",
  },
  {
    memberIds: ["brady-strait", "nawal-marrash"],
    scoreDelta: -5,
    pressureDelta: 2,
    ruleHit: "pair:nawal_brady_bit_collapse",
  },
  {
    memberIds: ["imani-wallace", "mei-sato"],
    scoreDelta: 5,
    pressureDelta: 0,
    ruleHit: "pair:imani_mei_rapid_sincere",
  },
  {
    memberIds: ["imani-wallace", "sienna-bae"],
    scoreDelta: 5,
    pressureDelta: 1,
    ruleHit: "pair:imani_sienna_bright_fan_overlap",
  },
  {
    memberIds: ["imani-wallace", "kade-sumner"],
    scoreDelta: -8,
    pressureDelta: 3,
    ruleHit: "pair:imani_kade_filming_reaper",
  },
  {
    memberIds: ["gabriel-tan", "imani-wallace"],
    scoreDelta: -5,
    pressureDelta: 2,
    ruleHit: "pair:imani_gabriel_deadpan_cold",
  },
  {
    memberIds: ["cha-yusung", "imani-wallace"],
    scoreDelta: -5,
    pressureDelta: 2,
    ruleHit: "pair:imani_cha_wrong_category",
  },
  {
    memberIds: ["bai-wenshu", "imani-wallace"],
    scoreDelta: -7,
    pressureDelta: 2,
    ruleHit: "pair:imani_wenshu_kind_decline",
  },
  {
    memberIds: ["naia-velorae", "sienna-bae"],
    scoreDelta: 5,
    pressureDelta: 0,
    ruleHit: "pair:sienna_naia_unscored_compliments",
  },
  {
    memberIds: ["mei-sato", "sienna-bae"],
    scoreDelta: 5,
    pressureDelta: 0,
    ruleHit: "pair:sienna_mei_working_craft",
  },
  {
    memberIds: ["kade-sumner", "sienna-bae"],
    scoreDelta: -8,
    pressureDelta: 3,
    ruleHit: "pair:sienna_kade_label_clause",
  },
  {
    memberIds: ["mira-park", "sienna-bae"],
    scoreDelta: -6,
    pressureDelta: 2,
    ruleHit: "pair:sienna_mira_brand_pitch",
  },
  {
    memberIds: ["sera-vohn", "sienna-bae"],
    scoreDelta: -6,
    pressureDelta: 2,
    ruleHit: "pair:sienna_sera_terms_panic",
  },
  {
    memberIds: ["gabriel-tan", "sienna-bae"],
    scoreDelta: -5,
    pressureDelta: 2,
    ruleHit: "pair:sienna_gabriel_deadpan_silence",
  },
  {
    memberIds: ["gabriel-tan", "maeve"],
    scoreDelta: 3,
    pressureDelta: 0,
    ruleHit: "pair:maeve_gabriel_silence_capacity",
  },
  {
    memberIds: ["kade-sumner", "maeve"],
    scoreDelta: -8,
    pressureDelta: 3,
    ruleHit: "pair:maeve_kade_filming_table",
  },
  {
    memberIds: ["maeve", "toby-wenz"],
    scoreDelta: -7,
    pressureDelta: 2,
    ruleHit: "pair:maeve_toby_disclosure_spiral",
  },
  {
    memberIds: ["maeve", "mira-park"],
    scoreDelta: -5,
    pressureDelta: 2,
    ruleHit: "pair:maeve_mira_audit_pitch",
  },
  {
    memberIds: ["bai-wenshu", "maeve"],
    scoreDelta: -5,
    pressureDelta: 2,
    ruleHit: "pair:maeve_wenshu_cosmic_frame",
  },
];

const AUTHORED_REQUEST_RULES: readonly AuthoredRequestRule[] = [
  {
    requestIds: [
      "request-anansi-call-the-lie",
      "request-anansi-story-as-story",
      "request-imani-show-recommendation",
      "request-imani-shift-work",
      "request-imani-twice-respected",
      "request-sienna-pick-one-venue",
      "request-sienna-no-real-name-hunt",
      "request-sienna-work-is-work",
      "request-maeve-question-stays-closed",
      "request-maeve-no-trade-disclosures",
    ],
    scenarioIds: ["soft-launch-photo-wall"],
    status: "blocked",
    ruleHit: "request:soft_launch_camera_blocks_target_asks",
  },
  {
    requestIds: [
      "request-sienna-pick-one-venue",
      "request-sienna-no-real-name-hunt",
      "request-sienna-work-is-work",
    ],
    scenarioIds: ["cousins-wedding-plus-one"],
    status: "blocked",
    ruleHit: "request:sienna_wedding_photo_pressure",
  },
  {
    requestIds: ["request-nawal-office-closed", "request-nawal-no-wishes"],
    scenarioIds: ["underworld-department-mixer"],
    status: "blocked",
    ruleHit: "request:nawal_office_reopened_by_room",
  },
  {
    requestIds: ["request-maeve-question-stays-closed", "request-maeve-no-trade-disclosures"],
    scenarioIds: ["memory-course-dinner"],
    status: "blocked",
    ruleHit: "request:maeve_unsaid_receipt_forces_trade",
  },
  {
    requestIds: ["request-anansi-call-the-lie", "request-anansi-story-as-story"],
    partnerIds: ["sana-karim", "aldric-vale-marsh", "cha-yusung", "opal-sunday", "kade-sumner"],
    status: "blocked",
    ruleHit: "request:anansi_lie_recovery_partner_blocked",
  },
  {
    requestIds: ["request-nawal-office-closed", "request-nawal-no-wishes"],
    partnerIds: ["bai-wenshu", "brady-strait", "reaver", "venus"],
    status: "blocked",
    ruleHit: "request:nawal_closed_office_partner_blocked",
  },
  {
    requestIds: ["request-imani-show-recommendation", "request-imani-twice-respected"],
    partnerIds: ["brady-strait", "gabriel-tan", "kade-sumner", "cha-yusung", "bai-wenshu"],
    status: "blocked",
    ruleHit: "request:imani_bright_hobby_partner_blocked",
  },
  {
    requestIds: ["request-imani-shift-work"],
    partnerIds: ["kade-sumner"],
    status: "blocked",
    ruleHit: "request:imani_shift_work_phone_blocked",
  },
  {
    requestIds: ["request-sienna-pick-one-venue"],
    partnerIds: ["kade-sumner", "mira-park", "sera-vohn"],
    status: "blocked",
    ruleHit: "request:sienna_short_list_partner_blocked",
  },
  {
    requestIds: ["request-sienna-hold-the-silence"],
    partnerIds: ["cha-yusung", "gabriel-tan", "sera-vohn"],
    status: "blocked",
    ruleHit: "request:sienna_silence_partner_blocked",
  },
  {
    requestIds: ["request-sienna-no-real-name-hunt"],
    partnerIds: ["kade-sumner", "mira-park"],
    status: "blocked",
    ruleHit: "request:sienna_name_hunt_partner_blocked",
  },
  {
    requestIds: ["request-sienna-work-is-work"],
    partnerIds: ["kade-sumner", "mira-park"],
    status: "blocked",
    ruleHit: "request:sienna_work_respect_partner_blocked",
  },
  {
    requestIds: ["request-maeve-question-stays-closed"],
    partnerIds: ["bai-wenshu"],
    status: "blocked",
    ruleHit: "request:maeve_question_partner_blocked",
  },
  {
    requestIds: ["request-maeve-no-trade-disclosures"],
    partnerIds: ["bai-wenshu", "mira-park", "toby-wenz"],
    status: "blocked",
    ruleHit: "request:maeve_trade_disclosure_partner_blocked",
  },
  {
    requestIds: ["request-maeve-silence-holds"],
    partnerIds: ["toby-wenz"],
    status: "blocked",
    ruleHit: "request:maeve_silence_partner_blocked",
  },
  {
    requestIds: ["request-maeve-license-satisfies"],
    partnerIds: ["mira-park"],
    status: "blocked",
    ruleHit: "request:maeve_license_audit_partner_blocked",
  },
  {
    requestIds: ["request-anansi-call-the-lie", "request-anansi-story-as-story"],
    partnerIds: ["brady-strait", "mei-sato", "naia-velorae", "vhool"],
    status: "covered",
    ruleHit: "request:anansi_story_partner_covered",
  },
  {
    requestIds: [
      "request-nawal-pick-the-venue",
      "request-nawal-office-closed",
      "request-nawal-no-wishes",
      "request-nawal-quiet-thursday",
    ],
    partnerIds: [
      "cha-yusung",
      "decimus-marius-tullio",
      "imani-wallace",
      "junie-marrow",
      "maeve",
      "naia-velorae",
      "sana-karim",
    ],
    status: "covered",
    ruleHit: "request:nawal_plain_partner_covered",
  },
  {
    requestIds: [
      "request-imani-show-recommendation",
      "request-imani-shift-work",
      "request-imani-twice-respected",
      "request-imani-pick-a-place",
    ],
    partnerIds: ["aldric-vale-marsh", "mei-sato", "naia-velorae", "nawal-marrash", "sienna-bae"],
    status: "covered",
    ruleHit: "request:imani_sincere_followup_covered",
  },
  {
    requestIds: [
      "request-sienna-pick-one-venue",
      "request-sienna-hold-the-silence",
      "request-sienna-no-real-name-hunt",
      "request-sienna-work-is-work",
    ],
    partnerIds: ["alex-yoon", "imani-wallace", "mei-sato", "naia-velorae"],
    status: "covered",
    ruleHit: "request:sienna_short_list_partner_covered",
  },
  {
    requestIds: [
      "request-maeve-question-stays-closed",
      "request-maeve-no-trade-disclosures",
      "request-maeve-silence-holds",
      "request-maeve-license-satisfies",
    ],
    partnerIds: ["gabriel-tan", "nawal-marrash"],
    status: "covered",
    ruleHit: "request:maeve_closed_question_partner_covered",
  },
];

export function evaluateMatchFit(input: EvaluateMatchFitInput): MatchFitResult {
  const [firstMember, secondMember] = requireTwoMembers(input.members);
  const members: [Member, Member] = [firstMember, secondMember];
  const ruleHits: string[] = [];
  let score = 0;
  let pressure = basePressure(input.scenario);

  score += pairHistoryScore(input.pairState, input.scenario, ruleHits);

  for (const member of members) {
    score += memberScenarioScore(member, input.scenario, ruleHits);
    pressure += memberPressure(member, input.scenario);
  }

  score += pairTraitScore(firstMember, secondMember, input.pairState, input.scenario, ruleHits);
  const authoredPairScoreResult = authoredPairScore(firstMember, secondMember, ruleHits);
  score += authoredPairScoreResult.scoreDelta;
  pressure += authoredPairScoreResult.pressureDelta;
  const pairMemoryScoreResult = pairMemoryScore(input.pairState, ruleHits);
  score += pairMemoryScoreResult.scoreDelta;
  pressure += pairMemoryScoreResult.pressureDelta;
  const knownReadScoreResult = knownPairReadScore(input.knownPairReads ?? [], ruleHits);
  score += knownReadScoreResult.scoreDelta;
  pressure += knownReadScoreResult.pressureDelta;

  const boundaryRisk = findBoundaryRisk(members, input.scenario);
  const requestSignals = evaluateRequestSignals({
    members,
    scenario: input.scenario,
    activeRequests: input.activeRequests ?? [],
    boundaryRisk,
    ruleHits,
  });
  const requestScore = requestSignalScore(requestSignals.askSignal);
  const totalScore = boundaryRisk === null ? score + requestScore : score + requestScore - 12;

  return {
    fitLevel: toFitLevel(totalScore, boundaryRisk),
    pressureLevel: toPressureLevel(pressure),
    askSignal: requestSignals.askSignal,
    startingDateHealthDelta: clamp(totalScore, -12, 12),
    boundaryRisk,
    blockedRequestIds: requestSignals.blockedRequestIds,
    coveredRequestIds: requestSignals.coveredRequestIds,
    internalRuleHits: ruleHits,
  };
}

export function isMemberRequestBlocked(fit: MatchFitResult, requestId: string): boolean {
  return fit.blockedRequestIds.includes(requestId);
}

export function chooseRecommendedMatchCandidate<TCandidate>(
  candidates: readonly MatchRecommendationCandidate<TCandidate>[],
): TCandidate | null {
  const recommendable = candidates
    .filter((entry) => isRecommendableMatchFit(entry.fit))
    .sort(
      (first, second) => second.fit.startingDateHealthDelta - first.fit.startingDateHealthDelta,
    );
  const [best, runnerUp] = recommendable;

  if (best === undefined) {
    return null;
  }

  if (
    runnerUp !== undefined &&
    best.fit.startingDateHealthDelta - runnerUp.fit.startingDateHealthDelta <
      RECOMMENDATION_MIN_SCORE_LEAD
  ) {
    return null;
  }

  return best.candidate;
}

function isRecommendableMatchFit(fit: MatchFitResult): boolean {
  return (
    fit.fitLevel === "strong" &&
    fit.pressureLevel !== "high" &&
    fit.askSignal !== "blocked" &&
    fit.boundaryRisk === null &&
    fit.startingDateHealthDelta >= RECOMMENDATION_MIN_STARTING_HEALTH_DELTA
  );
}

export function buildPublicRiskNotes({
  members,
  scenario,
  scenarioRepeatCount,
  fitSignal,
  focusRequests,
}: {
  members: readonly Member[];
  scenario: DateScenario;
  scenarioRepeatCount: number;
  fitSignal: MatchFitPublicSignal;
  focusRequests: readonly MemberRequest[];
}): string[] {
  const notes: string[] = [];
  const scenarioTags = scenario.card.tags;
  const focusMember = members[0];

  for (const member of members) {
    if (scenarioTags.includes("prophecy") && hasTag(member, "prophecy_averse")) {
      notes.push(`${member.firstName} flags prophecy as a hard boundary. Keep the scene careful.`);
    }

    if (scenarioTags.includes("public") && hasTag(member, "privacy_sensitive")) {
      notes.push(`${member.firstName} cannot do public pressure. The venue is the risk.`);
    }

    if (
      scenarioTags.includes("memory") &&
      (hasTag(member, "memory_sensitive") || hasTag(member, "grief_sensitive"))
    ) {
      notes.push(`${member.firstName} flags memory pressure. Push gently or expect a report.`);
    }
  }

  if (fitSignal.askSignal === "blocked" && focusRequests.length > 0 && focusMember !== undefined) {
    notes.push(`${focusMember.firstName}'s ask is under pressure here. The booking makes it hard.`);
  }

  if (scenarioRepeatCount > 0) {
    notes.push("Pair has worked this room before. Returning to it costs points.");
  }

  return Array.from(new Set(notes)).slice(0, 2);
}

export function applyMatchFitToJudgeSnapshot(input: ApplyMatchFitToJudgeInput): JudgeSnapshot {
  return applyWalkoutEscalation({
    session: input.session,
    pairState: input.pairState,
    judgeSnapshot: input.judgeSnapshot,
  });
}

function applyWalkoutEscalation({
  session,
  pairState,
  judgeSnapshot,
}: {
  session: DateSession;
  pairState: PairState;
  judgeSnapshot: JudgeSnapshot;
}): JudgeSnapshot {
  if (judgeSnapshot.shouldEndEarly) {
    return judgeSnapshot;
  }

  if (!shouldEscalateWalkout({ session, pairState, judgeSnapshot })) {
    return judgeSnapshot;
  }

  const reason = "Member boundary crossed walkout threshold.";

  return judgeSnapshotSchema.parse({
    ...judgeSnapshot,
    shouldEndEarly: true,
    earlyEndReason: reason,
    endSentiment: "negative",
    notableMoments: [reason, ...judgeSnapshot.notableMoments].slice(0, 3),
    playerSummary: "Boundary crossed. Date ended before the room could make it worse.",
  });
}

function shouldEscalateWalkout({
  session,
  pairState,
  judgeSnapshot,
}: {
  session: DateSession;
  pairState: PairState;
  judgeSnapshot: JudgeSnapshot;
}): boolean {
  const projectedDateHealth = session.dateHealth + judgeSnapshot.dateHealthDelta;
  const projectedStrain = pairState.stats.strain + (judgeSnapshot.statDeltas.strain ?? 0);
  const projectedConflict = pairState.stats.conflict + (judgeSnapshot.statDeltas.conflict ?? 0);
  const highTension =
    projectedStrain >= WALKOUT_STRAIN_THRESHOLD || projectedConflict >= WALKOUT_CONFLICT_THRESHOLD;
  const exchangeTension =
    (judgeSnapshot.statDeltas.strain ?? 0) >= WALKOUT_EXCHANGE_TENSION_DELTA ||
    (judgeSnapshot.statDeltas.conflict ?? 0) >= WALKOUT_EXCHANGE_TENSION_DELTA;
  const activeTension = highTension || exchangeTension;

  if (projectedDateHealth <= WALKOUT_DATE_HEALTH_THRESHOLD && activeTension) {
    return true;
  }

  return (
    projectedDateHealth <= WALKOUT_SOFT_HEALTH_THRESHOLD &&
    judgeSnapshot.dateHealthDelta <= SHARP_DROP_THRESHOLD &&
    activeTension
  );
}

function memberScenarioScore(member: Member, scenario: DateScenario, ruleHits: string[]): number {
  let score = 0;

  if (hasTag(member, "needs_low_pressure") && scenario.card.tags.includes("low_pressure")) {
    score += 3;
    ruleHits.push(`${member.id}:low_pressure_supported`);
  }

  if (hasTag(member, "needs_low_pressure") && scenario.card.tags.includes("high_pressure")) {
    score -= 4;
    ruleHits.push(`${member.id}:high_pressure_strain`);
  }

  if (hasTag(member, "prophecy_averse") && scenario.card.tags.includes("prophecy")) {
    score -= 8;
    ruleHits.push(`${member.id}:prophecy_rejected`);
  }

  if (hasTag(member, "privacy_sensitive") && scenario.card.tags.includes("public")) {
    score -= scenario.card.risk === "high" ? 6 : 3;
    ruleHits.push(`${member.id}:public_pressure`);
  }

  if (hasTag(member, "memory_sensitive") && scenario.card.tags.includes("memory")) {
    score -= 3;
    ruleHits.push(`${member.id}:memory_pressure`);
  }

  if (hasTag(member, "grief_sensitive") && scenario.card.tags.includes("memory")) {
    score -= scenario.card.intimacy === "high" ? 5 : 2;
    ruleHits.push(`${member.id}:grief_pressure`);
  }

  if (hasTag(member, "career_focused") && scenario.card.tags.includes("career")) {
    score += 3;
    ruleHits.push(`${member.id}:career_context`);
  }

  if (hasTag(member, "status_sensitive") && scenario.card.tags.includes("career")) {
    score += 1;
  }

  if (hasTag(member, "weirdness_native") && scenario.card.chaos !== "low") {
    score += 2;
    ruleHits.push(`${member.id}:weirdness_native`);
  }

  if (hasTag(member, "needs_clear_plan") && scenario.card.chaos === "low") {
    score += 1;
  }

  if (hasTag(member, "needs_clear_plan") && scenario.card.chaos === "high") {
    score -= 2;
  }

  const authored = authoredMemberScenarioContribution(member, scenario);
  score += authored.scoreDelta;
  ruleHits.push(...authored.ruleHits);

  return score;
}

function pairTraitScore(
  firstMember: Member,
  secondMember: Member,
  pairState: PairState,
  scenario: DateScenario,
  ruleHits: string[],
): number {
  let score = 0;

  if (bothHaveTag(firstMember, secondMember, "anxious_spiral")) {
    score -= 2;
    ruleHits.push("pair:shared_spiral");
  }

  if (oneHasTag(firstMember, secondMember, "sincerity_seeking")) {
    const otherMember = hasTag(firstMember, "sincerity_seeking") ? secondMember : firstMember;

    if (hasTag(otherMember, "performative") || hasTag(otherMember, "avoidant")) {
      score -= 2;
      ruleHits.push("pair:sincerity_vs_performance");
    }
  }

  if (oneHasTag(firstMember, secondMember, "status_sensitive")) {
    const otherMember = hasTag(firstMember, "status_sensitive") ? secondMember : firstMember;

    if (hasTag(otherMember, "attention_seeking")) {
      score -= 2;
      ruleHits.push("pair:status_vs_attention");
    }
  }

  if (bothHaveTag(firstMember, secondMember, "career_focused")) {
    score += 2;
    ruleHits.push("pair:career_alignment");
  }

  if (splitHaveTags(firstMember, secondMember, "career_focused", "status_sensitive")) {
    score += 1;
  }

  if (
    splitHaveTags(firstMember, secondMember, "ordinary_human", "non_human") &&
    pairState.stats.weirdnessTolerance >= 55
  ) {
    score += 1;
  }

  if (bothHaveTag(firstMember, secondMember, "ceremony_minded")) {
    score += 2;
    ruleHits.push("pair:ceremony_alignment");
  }

  if (bothHaveTag(firstMember, secondMember, "acquisitive")) {
    score += 1;
    ruleHits.push("pair:mutual_acquisition");
  }

  if (bothHaveTag(firstMember, secondMember, "competitive")) {
    score -= 1;
    ruleHits.push("pair:competitive_clash");
  }

  if (bothHaveTag(firstMember, secondMember, "attention_seeking")) {
    score -= 2;
    ruleHits.push("pair:attention_rivalry");
  }

  if (bothHaveTag(firstMember, secondMember, "performative")) {
    score -= 1;
    ruleHits.push("pair:performer_distrust");
  }

  if (bothHaveTag(firstMember, secondMember, "grief_sensitive")) {
    if (scenario.card.intimacy === "high") {
      score -= 2;
      ruleHits.push("pair:grief_high_intimacy_overload");
    } else {
      score += 2;
      ruleHits.push("pair:grief_low_intimacy_alignment");
    }
  }

  if (splitHaveTags(firstMember, secondMember, "weirdness_native", "reality_displaced")) {
    score += 1;
    ruleHits.push("pair:weirdness_displaced_recognition");
  }

  if (oneHasTag(firstMember, secondMember, "ceremony_minded")) {
    const otherMember = hasTag(firstMember, "ceremony_minded") ? secondMember : firstMember;

    if (hasTag(otherMember, "performative")) {
      score -= 2;
      ruleHits.push("pair:ceremony_vs_performance");
    }
  }

  if (oneHasTag(firstMember, secondMember, "privacy_sensitive")) {
    const otherMember = hasTag(firstMember, "privacy_sensitive") ? secondMember : firstMember;

    if (hasTag(otherMember, "attention_seeking")) {
      score -= 2;
      ruleHits.push("pair:privacy_vs_attention");
    }
  }

  return score;
}

function authoredPairScore(
  firstMember: Member,
  secondMember: Member,
  ruleHits: string[],
): AuthoredScore {
  let scoreDelta = 0;
  let pressureDelta = 0;

  for (const rule of AUTHORED_PAIR_RULES) {
    if (
      makePairId(rule.memberIds[0], rule.memberIds[1]) !==
      makePairId(firstMember.id, secondMember.id)
    ) {
      continue;
    }

    scoreDelta += rule.scoreDelta;
    pressureDelta += rule.pressureDelta;
    ruleHits.push(rule.ruleHit);
  }

  return { scoreDelta, pressureDelta };
}

function pairHistoryScore(
  pairState: PairState,
  scenario: DateScenario,
  ruleHits: string[],
): number {
  const repeatCount = pairState.scenarioUseCounts[scenario.id] ?? 0;

  if (repeatCount === 0) {
    return 0;
  }

  ruleHits.push("pair:repeat_scenario");
  return -3;
}

function pairMemoryScore(pairState: PairState, ruleHits: string[]): AuthoredScore {
  let scoreDelta = 0;
  let pressureDelta = 0;
  const activeAgreementCount = pairState.agreements.filter(
    (agreement) => agreement.status === "active",
  ).length;
  const honoredAgreementCount = pairState.agreements.filter(
    (agreement) => agreement.status === "honored",
  ).length;
  const brokenAgreementCount = pairState.agreements.filter(
    (agreement) => agreement.status === "broken",
  ).length;
  const openLoopCount = pairState.openLoops.filter((loop) => loop.status === "open").length;
  const resolvedLoopCount = pairState.openLoops.filter((loop) => loop.status === "resolved").length;

  if (activeAgreementCount > 0) {
    scoreDelta += Math.min(2, activeAgreementCount);
    ruleHits.push("pair:active_agreement_table_stakes");
  }

  if (honoredAgreementCount > 0) {
    scoreDelta += Math.min(4, honoredAgreementCount * 2);
    ruleHits.push("pair:honored_agreement_momentum");
  }

  if (brokenAgreementCount > 0) {
    scoreDelta -= Math.min(6, brokenAgreementCount * 3);
    pressureDelta += Math.min(4, brokenAgreementCount * 2);
    ruleHits.push("pair:broken_agreement_pressure");
  }

  if (openLoopCount >= 2) {
    scoreDelta -= Math.min(4, openLoopCount);
    pressureDelta += 1;
    ruleHits.push("pair:open_loop_crowding");
  }

  if (resolvedLoopCount > 0) {
    scoreDelta += Math.min(3, resolvedLoopCount);
    ruleHits.push("pair:resolved_loop_momentum");
  }

  return { scoreDelta, pressureDelta };
}

function knownPairReadScore(
  knownPairReads: readonly PlayerKnowledgeRecord[],
  ruleHits: string[],
): AuthoredScore {
  let scoreDelta = 0;
  let pressureDelta = 0;
  const readIds = new Set(
    knownPairReads
      .filter((record) => record.readKind === "pair_dynamic")
      .map((record) => record.readId),
  );

  for (const readId of readIds) {
    if (hasReadSuffix(readId, WARM_PAIR_READ_SUFFIXES)) {
      scoreDelta += 2;
      ruleHits.push("pair:known_warm_dynamic");
    } else if (hasReadSuffix(readId, FRICTION_PAIR_READ_SUFFIXES)) {
      scoreDelta -= 2;
      pressureDelta += 1;
      ruleHits.push("pair:known_friction_dynamic");
    }
  }

  return {
    scoreDelta: clamp(scoreDelta, -4, 4),
    pressureDelta: clamp(pressureDelta, 0, 3),
  };
}

function hasReadSuffix(readId: string, suffixes: ReadonlySet<string>): boolean {
  for (const suffix of suffixes) {
    if (readId.endsWith(suffix)) {
      return true;
    }
  }

  return false;
}

function basePressure(scenario: DateScenario): number {
  const riskPressure = scenario.card.risk === "high" ? 3 : scenario.card.risk === "medium" ? 2 : 1;
  const intimacyPressure =
    scenario.card.intimacy === "high" ? 2 : scenario.card.intimacy === "medium" ? 1 : 0;
  const chaosPressure =
    scenario.card.chaos === "high" ? 2 : scenario.card.chaos === "medium" ? 1 : 0;
  const publicPressure = scenario.card.tags.includes("public") ? 1 : 0;
  const highPressure = scenario.card.tags.includes("high_pressure") ? 1 : 0;

  return riskPressure + intimacyPressure + chaosPressure + publicPressure + highPressure;
}

function memberPressure(member: Member, scenario: DateScenario): number {
  let pressure = 0;

  if (hasTag(member, "privacy_sensitive") && scenario.card.tags.includes("public")) {
    pressure += 2;
  }

  if (hasTag(member, "prophecy_averse") && scenario.card.tags.includes("prophecy")) {
    pressure += 3;
  }

  if (
    (hasTag(member, "grief_sensitive") || hasTag(member, "memory_sensitive")) &&
    scenario.card.tags.includes("memory")
  ) {
    pressure += 2;
  }

  if (hasTag(member, "needs_low_pressure") && scenario.card.tags.includes("high_pressure")) {
    pressure += 2;
  }

  pressure += authoredMemberScenarioContribution(member, scenario).pressureDelta;

  return pressure;
}

function findBoundaryRisk(
  members: readonly Member[],
  scenario: DateScenario,
): MatchFitBoundaryRisk | null {
  for (const member of members) {
    if (hasTag(member, "prophecy_averse") && scenario.card.tags.includes("prophecy")) {
      return {
        memberId: member.id,
        reason: "Prophecy tripped a visible dealbreaker.",
      };
    }

    if (hasTag(member, "privacy_sensitive") && scenario.id === "museum-exhibit-mixup") {
      return {
        memberId: member.id,
        reason: "Public exposure tripped a visible dealbreaker.",
      };
    }

    if (
      hasTag(member, "grief_sensitive") &&
      scenario.card.tags.includes("memory") &&
      scenario.card.intimacy === "high"
    ) {
      return {
        memberId: member.id,
        reason: "Forced recovery tripped a visible dealbreaker.",
      };
    }
  }

  return null;
}

function evaluateRequestSignals({
  members,
  scenario,
  activeRequests,
  boundaryRisk,
  ruleHits,
}: {
  members: readonly [Member, Member];
  scenario: DateScenario;
  activeRequests: readonly MemberRequest[];
  boundaryRisk: MatchFitBoundaryRisk | null;
  ruleHits: string[];
}): {
  askSignal: MatchAskSignal;
  blockedRequestIds: string[];
  coveredRequestIds: string[];
} {
  const selectedMemberIds = new Set(members.map((member) => member.id));
  const relevantRequests = activeRequests.filter((request) =>
    selectedMemberIds.has(request.memberId),
  );
  const blockedRequestIds: string[] = [];
  const coveredRequestIds: string[] = [];

  for (const request of relevantRequests) {
    const member = members.find((candidate) => candidate.id === request.memberId);
    const partner = members.find((candidate) => candidate.id !== request.memberId);

    if (member === undefined || partner === undefined) {
      continue;
    }

    const status = evaluateRequestFit(request, member, partner, scenario, boundaryRisk, ruleHits);

    if (status === "blocked") {
      blockedRequestIds.push(request.id);
    }

    if (status === "covered") {
      coveredRequestIds.push(request.id);
    }
  }

  if (relevantRequests.length === 0) {
    return { askSignal: "none", blockedRequestIds, coveredRequestIds };
  }

  if (blockedRequestIds.length > 0) {
    return { askSignal: "blocked", blockedRequestIds, coveredRequestIds };
  }

  if (coveredRequestIds.length > 0) {
    return { askSignal: "covered", blockedRequestIds, coveredRequestIds };
  }

  return { askSignal: "uncertain", blockedRequestIds, coveredRequestIds };
}

function evaluateRequestFit(
  request: MemberRequest,
  member: Member,
  partner: Member,
  scenario: DateScenario,
  boundaryRisk: MatchFitBoundaryRisk | null,
  ruleHits: string[],
): MatchAskSignal {
  if (boundaryRisk?.memberId === member.id) {
    return "blocked";
  }

  const authoredStatus = evaluateAuthoredRequestFit(request, partner, scenario, ruleHits);
  if (authoredStatus !== null) {
    return authoredStatus;
  }

  const requestTags = new Set<MemberRequestTag>(request.tags);

  if (
    requestHasAnyTag(requestTags, PROPHECY_BLOCKED_REQUEST_TAGS) &&
    scenario.card.tags.includes("prophecy")
  ) {
    return "blocked";
  }

  if (
    requestHasAnyTag(requestTags, HIGH_PRESSURE_BLOCKED_REQUEST_TAGS) &&
    (scenario.card.tags.includes("high_pressure") || scenario.card.risk === "high")
  ) {
    return "blocked";
  }

  if (
    requestHasAnyTag(requestTags, LOW_PRESSURE_BLOCKED_REQUEST_TAGS) &&
    scenario.card.tags.includes("high_pressure")
  ) {
    return "blocked";
  }

  if (
    requestHasAnyTag(requestTags, SINCERITY_REQUEST_TAGS) &&
    (hasTag(partner, "performative") || hasTag(partner, "avoidant"))
  ) {
    return "blocked";
  }

  if (
    requestHasAnyTag(requestTags, LOW_PRESSURE_COVERED_REQUEST_TAGS) &&
    scenario.card.tags.includes("low_pressure")
  ) {
    return "covered";
  }

  if (
    requestHasAnyTag(requestTags, CAREER_COVERED_REQUEST_TAGS) &&
    (hasTag(partner, "career_focused") ||
      hasTag(partner, "status_sensitive") ||
      scenario.card.tags.includes("career"))
  ) {
    return "covered";
  }

  if (
    requestHasAnyTag(requestTags, SINCERITY_REQUEST_TAGS) &&
    !hasTag(partner, "performative") &&
    !hasTag(partner, "avoidant")
  ) {
    return "covered";
  }

  if (requestTags.has(STRUCTURE_REQUEST_TAG) && scenario.card.chaos !== "high") {
    return "covered";
  }

  return "uncertain";
}

type AuthoredMemberScenarioContribution = {
  scoreDelta: number;
  pressureDelta: number;
  ruleHits: readonly string[];
};

function authoredMemberScenarioContribution(
  member: Member,
  scenario: DateScenario,
): AuthoredMemberScenarioContribution {
  let scoreDelta = 0;
  let pressureDelta = 0;
  const ruleHits: string[] = [];

  for (const rule of AUTHORED_MEMBER_SCENARIO_RULES) {
    if (rule.memberId !== member.id || !rule.scenarioIds.includes(scenario.id)) {
      continue;
    }

    scoreDelta += rule.scoreDelta;
    pressureDelta += rule.pressureDelta;
    ruleHits.push(rule.ruleHit);
  }

  return { scoreDelta, pressureDelta, ruleHits };
}

function evaluateAuthoredRequestFit(
  request: MemberRequest,
  partner: Member,
  scenario: DateScenario,
  ruleHits: string[],
): MatchAskSignal | null {
  for (const rule of AUTHORED_REQUEST_RULES) {
    if (!rule.requestIds.includes(request.id)) {
      continue;
    }

    if (rule.partnerIds !== undefined && !rule.partnerIds.includes(partner.id)) {
      continue;
    }

    if (rule.scenarioIds !== undefined && !rule.scenarioIds.includes(scenario.id)) {
      continue;
    }

    ruleHits.push(rule.ruleHit);
    return rule.status;
  }

  return null;
}

function requestHasAnyTag(
  requestTags: ReadonlySet<MemberRequestTag>,
  tags: readonly MemberRequestTag[],
): boolean {
  return tags.some((tag) => requestTags.has(tag));
}

function requestSignalScore(signal: MatchAskSignal): number {
  if (signal === "covered") {
    return 3;
  }

  if (signal === "blocked") {
    return -4;
  }

  return 0;
}

function toFitLevel(score: number, boundaryRisk: MatchFitBoundaryRisk | null): MatchFitLevel {
  if (boundaryRisk !== null || score <= -5) {
    return "risky";
  }

  return score >= 5 ? "strong" : "neutral";
}

function toPressureLevel(pressure: number): MatchPressureLevel {
  if (pressure >= HIGH_PRESSURE_THRESHOLD) {
    return "high";
  }

  return pressure >= MEDIUM_PRESSURE_THRESHOLD ? "medium" : "low";
}

function hasTag(member: Member, tag: MemberTag): boolean {
  return member.tags.includes(tag);
}

function oneHasTag(firstMember: Member, secondMember: Member, tag: MemberTag): boolean {
  return hasTag(firstMember, tag) || hasTag(secondMember, tag);
}

function bothHaveTag(firstMember: Member, secondMember: Member, tag: MemberTag): boolean {
  return hasTag(firstMember, tag) && hasTag(secondMember, tag);
}

function splitHaveTags(
  firstMember: Member,
  secondMember: Member,
  firstTag: MemberTag,
  secondTag: MemberTag,
): boolean {
  return (
    (hasTag(firstMember, firstTag) && hasTag(secondMember, secondTag)) ||
    (hasTag(firstMember, secondTag) && hasTag(secondMember, firstTag))
  );
}

function requireTwoMembers(members: readonly Member[]): [Member, Member] {
  const [firstMember, secondMember, thirdMember] = members;

  if (firstMember === undefined || secondMember === undefined || thirdMember !== undefined) {
    throw new Error("Match fit requires exactly two members.");
  }

  return [firstMember, secondMember];
}
