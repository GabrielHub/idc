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
} from "../domain/game";

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
};

export type ApplyMatchFitToJudgeInput = {
  session: DateSession;
  pairState: PairState;
  judgeSnapshot: JudgeSnapshot;
};

const HIGH_PRESSURE_THRESHOLD = 6;
const MEDIUM_PRESSURE_THRESHOLD = 3;
const WALKOUT_DATE_HEALTH_THRESHOLD = 15;
const WALKOUT_SOFT_HEALTH_THRESHOLD = 25;
const WALKOUT_STRAIN_THRESHOLD = 70;
const WALKOUT_CONFLICT_THRESHOLD = 70;
const SHARP_DROP_THRESHOLD = -8;
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

  const boundaryRisk = findBoundaryRisk(members, input.scenario);
  const requestSignals = evaluateRequestSignals({
    members,
    scenario: input.scenario,
    activeRequests: input.activeRequests ?? [],
    boundaryRisk,
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

  if (projectedDateHealth <= WALKOUT_DATE_HEALTH_THRESHOLD && highTension) {
    return true;
  }

  return (
    projectedDateHealth <= WALKOUT_SOFT_HEALTH_THRESHOLD &&
    judgeSnapshot.dateHealthDelta <= SHARP_DROP_THRESHOLD &&
    highTension
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
}: {
  members: readonly [Member, Member];
  scenario: DateScenario;
  activeRequests: readonly MemberRequest[];
  boundaryRisk: MatchFitBoundaryRisk | null;
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

    const status = evaluateRequestFit(request, member, partner, scenario, boundaryRisk);

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
): MatchAskSignal {
  if (boundaryRisk?.memberId === member.id) {
    return "blocked";
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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
