import {
  judgeSnapshotSchema,
  RELATIONSHIP_STATS,
  type DateScenario,
  type DateSession,
  type JudgeSnapshot,
  type Member,
  type MemberRequest,
  type MemberTag,
  type PairState,
  type PairStats,
  type RelationshipStat,
} from "../domain/game";
import { clampDelta } from "./utils";

export type MatchFitLevel = "strong" | "neutral" | "risky";
export type MatchPressureLevel = "low" | "medium" | "high";
export type MatchAskSignal = "covered" | "uncertain" | "blocked" | "none";

export type MatchFitPublicSignal = {
  fitLevel: MatchFitLevel;
  pressureLevel: MatchPressureLevel;
  askSignal: MatchAskSignal;
};

export type MatchFitHardStop = {
  memberId: string;
  reason: string;
};

export type MatchFitResult = MatchFitPublicSignal & {
  startingDateHealthDelta: number;
  exchangeDateHealthDrift: number;
  hardStop: MatchFitHardStop | null;
  blockedRequestIds: string[];
  coveredRequestIds: string[];
  internalRuleHits: string[];
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
  members: readonly Member[];
  judgeSnapshot: JudgeSnapshot;
  fit: MatchFitResult;
};

const HARD_STOP_SCORE = 5;
const HIGH_PRESSURE_THRESHOLD = 6;
const MEDIUM_PRESSURE_THRESHOLD = 3;

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

  score += pairTraitScore(firstMember, secondMember, input.pairState, ruleHits);

  const hardStop = findHardStop(members, input.scenario);
  const requestSignals = evaluateRequestSignals({
    members,
    scenario: input.scenario,
    activeRequests: input.activeRequests ?? [],
    hardStop,
  });
  const requestScore = requestSignalScore(requestSignals.askSignal);
  const totalScore = hardStop === null ? score + requestScore : score + requestScore - 12;

  return {
    fitLevel: toFitLevel(totalScore, hardStop),
    pressureLevel: toPressureLevel(pressure),
    askSignal: requestSignals.askSignal,
    startingDateHealthDelta: clamp(totalScore, -12, 12),
    exchangeDateHealthDrift: clamp(Math.round(totalScore / 5), -3, 3),
    hardStop,
    blockedRequestIds: requestSignals.blockedRequestIds,
    coveredRequestIds: requestSignals.coveredRequestIds,
    internalRuleHits: ruleHits,
  };
}

export function isMemberRequestBlocked(fit: MatchFitResult, requestId: string): boolean {
  return fit.blockedRequestIds.includes(requestId);
}

export function applyMatchFitToJudgeSnapshot({
  session,
  pairState,
  members,
  judgeSnapshot,
  fit,
}: ApplyMatchFitToJudgeInput): JudgeSnapshot {
  if (fit.hardStop !== null) {
    const memberMoodDeltas = Object.fromEntries(
      members.map((member) => [
        member.id,
        clampDelta((judgeSnapshot.memberMoodDeltas[member.id] ?? 0) - 8),
      ]),
    );

    return judgeSnapshotSchema.parse({
      ...judgeSnapshot,
      dateHealthDelta: clampDelta(HARD_STOP_SCORE - session.dateHealth),
      statDeltas: {
        ...judgeSnapshot.statDeltas,
        ...hardStopStatDeltas(pairState.stats),
      },
      memberMoodDeltas,
      shouldEndEarly: true,
      earlyEndReason: fit.hardStop.reason,
      notableMoments: [fit.hardStop.reason, ...judgeSnapshot.notableMoments].slice(0, 3),
      playerSummary: "Dealbreaker tripped. Date Health collapsed. Recommend Repair.",
    });
  }

  if (fit.exchangeDateHealthDrift === 0) {
    return judgeSnapshot;
  }

  const drift = fit.exchangeDateHealthDrift;
  const driftMagnitude = Math.abs(drift);
  const statDeltas =
    drift > 0
      ? {
          trust: drift,
          stability: drift,
          relationshipHealth: drift,
        }
      : {
          conflict: driftMagnitude,
          strain: driftMagnitude,
          stability: drift,
          relationshipHealth: drift,
        };
  const memberMoodDeltas = Object.fromEntries(
    members.map((member) => [
      member.id,
      clampDelta((judgeSnapshot.memberMoodDeltas[member.id] ?? 0) + Math.sign(drift)),
    ]),
  );

  return judgeSnapshotSchema.parse({
    ...judgeSnapshot,
    dateHealthDelta: clampDelta(judgeSnapshot.dateHealthDelta + drift),
    statDeltas: mergeStatDeltas(judgeSnapshot.statDeltas, statDeltas),
    memberMoodDeltas,
  });
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

  if (
    oneHasTag(firstMember, secondMember, "career_focused") &&
    oneHasTag(firstMember, secondMember, "status_sensitive")
  ) {
    score += 1;
  }

  if (
    oneHasTag(firstMember, secondMember, "ordinary_human") &&
    oneHasTag(firstMember, secondMember, "non_human") &&
    pairState.stats.weirdnessTolerance >= 55
  ) {
    score += 1;
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

function findHardStop(members: readonly Member[], scenario: DateScenario): MatchFitHardStop | null {
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
  hardStop,
}: {
  members: readonly [Member, Member];
  scenario: DateScenario;
  activeRequests: readonly MemberRequest[];
  hardStop: MatchFitHardStop | null;
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

    const status = evaluateRequestFit(request, member, partner, scenario, hardStop);

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
  hardStop: MatchFitHardStop | null,
): MatchAskSignal {
  if (hardStop?.memberId === member.id) {
    return "blocked";
  }

  const requestTags = new Set(request.tags);

  if (
    (requestTags.has("prophecy_averse") ||
      requestTags.has("normal_date") ||
      requestTags.has("choice")) &&
    scenario.card.tags.includes("prophecy")
  ) {
    return "blocked";
  }

  if (
    (requestTags.has("privacy") ||
      requestTags.has("quiet_date") ||
      requestTags.has("discretion") ||
      requestTags.has("name_discretion")) &&
    (scenario.card.tags.includes("high_pressure") || scenario.card.risk === "high")
  ) {
    return "blocked";
  }

  if (
    (requestTags.has("low_pressure") || requestTags.has("career_fatigue")) &&
    scenario.card.tags.includes("high_pressure")
  ) {
    return "blocked";
  }

  if (
    (requestTags.has("sincerity") || requestTags.has("grounded") || requestTags.has("widower")) &&
    (hasTag(partner, "performative") || hasTag(partner, "avoidant"))
  ) {
    return "blocked";
  }

  if (
    (requestTags.has("normal_date") ||
      requestTags.has("low_pressure") ||
      requestTags.has("career_fatigue")) &&
    scenario.card.tags.includes("low_pressure")
  ) {
    return "covered";
  }

  if (
    (requestTags.has("career") || requestTags.has("respect") || requestTags.has("decisiveness")) &&
    (hasTag(partner, "career_focused") ||
      hasTag(partner, "status_sensitive") ||
      scenario.card.tags.includes("career"))
  ) {
    return "covered";
  }

  if (
    (requestTags.has("sincerity") || requestTags.has("grounded") || requestTags.has("widower")) &&
    !hasTag(partner, "performative") &&
    !hasTag(partner, "avoidant")
  ) {
    return "covered";
  }

  if (requestTags.has("structure") && scenario.card.chaos !== "high") {
    return "covered";
  }

  return "uncertain";
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

function toFitLevel(score: number, hardStop: MatchFitHardStop | null): MatchFitLevel {
  if (hardStop !== null || score <= -5) {
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

function hardStopStatDeltas(stats: PairStats): Partial<Record<RelationshipStat, number>> {
  return {
    chemistry: clampDelta(10 - stats.chemistry),
    trust: clampDelta(10 - stats.trust),
    stability: clampDelta(10 - stats.stability),
    conflict: clampDelta(90 - stats.conflict),
    spark: clampDelta(5 - stats.spark),
    strain: clampDelta(90 - stats.strain),
    relationshipHealth: clampDelta(HARD_STOP_SCORE - stats.relationshipHealth),
  };
}

function mergeStatDeltas(
  existingDeltas: Partial<Record<RelationshipStat, number>>,
  newDeltas: Partial<Record<RelationshipStat, number>>,
): Partial<Record<RelationshipStat, number>> {
  const nextDeltas: Partial<Record<RelationshipStat, number>> = { ...existingDeltas };

  for (const stat of RELATIONSHIP_STATS) {
    const newDelta = newDeltas[stat];

    if (newDelta === undefined) {
      continue;
    }

    nextDeltas[stat] = clampDelta((nextDeltas[stat] ?? 0) + newDelta);
  }

  return nextDeltas;
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
