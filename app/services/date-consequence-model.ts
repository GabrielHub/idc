import {
  judgeSnapshotSchema,
  type DateMessage,
  type DateEvidenceVector,
  type DateScenario,
  type DateSession,
  type JudgeMemberAffect,
  type JudgeSnapshot,
  type Member,
  type RelationshipStat,
} from "../domain/game";
import type { MatchFitResult } from "./match-fit";
import { deriveMemberScenarioPolicy, memberHasTag } from "./member-scenario-policy";
import { clamp, clampDelta } from "./utils";

export const ZERO_DATE_EVIDENCE_VECTOR: DateEvidenceVector = {
  warmth: 0,
  attraction: 0,
  reciprocity: 0,
  repair: 0,
  boundaryRespect: 0,
  pressure: 0,
  avoidance: 0,
  novelty: 0,
  askProgress: 0,
};

const DATE_EVIDENCE_KEYS = [
  "warmth",
  "attraction",
  "reciprocity",
  "repair",
  "boundaryRespect",
  "pressure",
  "avoidance",
  "novelty",
  "askProgress",
] satisfies readonly (keyof DateEvidenceVector)[];

type PrimaryModeledStat = Exclude<RelationshipStat, "relationshipHealth" | "strain">;

const PRIMARY_MODELED_STATS = [
  "chemistry",
  "trust",
  "stability",
  "conflict",
  "weirdnessTolerance",
  "spark",
] satisfies readonly PrimaryModeledStat[];

type ApplyDateConsequenceModelInput = {
  session: DateSession;
  members: readonly Member[];
  scenario: DateScenario;
  judgeSnapshot: JudgeSnapshot;
  matchFit?: MatchFitResult;
  exchangeMessages: readonly DateMessage[];
};

export function applyDateConsequenceModel({
  session,
  members,
  scenario,
  judgeSnapshot,
  matchFit,
  exchangeMessages,
}: ApplyDateConsequenceModelInput): JudgeSnapshot {
  const evidenceVector = resolveEvidenceVector(judgeSnapshot);
  const dateHealthDelta = deriveModeledDateHealthDelta(
    judgeSnapshot.dateHealthDelta,
    evidenceVector,
  );
  const statDeltas = deriveModeledStatDeltas(judgeSnapshot.statDeltas, evidenceVector);
  const memberMoodDeltas = deriveModeledMemberMoodDeltas({
    session,
    members,
    scenario,
    judgeSnapshot,
    evidenceVector,
    dateHealthDelta,
    matchFit,
    exchangeMessages,
  });
  const memberAffects = deriveMemberAffects({
    members,
    scenario,
    judgeSnapshot,
    evidenceVector,
    memberMoodDeltas,
    matchFit,
  });

  return judgeSnapshotSchema.parse({
    ...judgeSnapshot,
    dateHealthDelta,
    statDeltas,
    memberMoodDeltas,
    evidenceVector,
    memberAffects,
  });
}

export function hasEvidenceVectorSignal(vector: DateEvidenceVector | undefined): boolean {
  if (vector === undefined) {
    return false;
  }

  return DATE_EVIDENCE_KEYS.some((key) => vector[key] !== 0);
}

function resolveEvidenceVector(judgeSnapshot: JudgeSnapshot): DateEvidenceVector {
  if (hasEvidenceVectorSignal(judgeSnapshot.evidenceVector)) {
    return normalizeEvidenceVector(judgeSnapshot.evidenceVector);
  }

  return deriveEvidenceVectorFromSnapshot(judgeSnapshot);
}

function normalizeEvidenceVector(vector: DateEvidenceVector | undefined): DateEvidenceVector {
  const source = vector ?? ZERO_DATE_EVIDENCE_VECTOR;
  return {
    warmth: clampEvidence(source.warmth),
    attraction: clampEvidence(source.attraction),
    reciprocity: clampEvidence(source.reciprocity),
    repair: clampEvidence(source.repair),
    boundaryRespect: clampEvidence(source.boundaryRespect),
    pressure: clampEvidence(source.pressure),
    avoidance: clampEvidence(source.avoidance),
    novelty: clampEvidence(source.novelty),
    askProgress: clampEvidence(source.askProgress),
  };
}

function deriveEvidenceVectorFromSnapshot(judgeSnapshot: JudgeSnapshot): DateEvidenceVector {
  const stats = judgeSnapshot.statDeltas;
  const dateLift = positive(judgeSnapshot.dateHealthDelta);
  const dateDrop = positive(-judgeSnapshot.dateHealthDelta);
  const trustLift = positive(stats.trust ?? 0);
  const stabilityLift = positive(stats.stability ?? 0);
  const trustDrop = positive(-(stats.trust ?? 0));
  const stabilityDrop = positive(-(stats.stability ?? 0));
  const conflictLift = positive(stats.conflict ?? 0);
  const strainLift = positive(stats.strain ?? 0);
  const conflictDrop = positive(-(stats.conflict ?? 0));
  const strainDrop = positive(-(stats.strain ?? 0));
  const honoredAgreement = judgeSnapshot.agreementUpdates.some(
    (update) => update.status === "honored",
  );
  const resolvedLoop = judgeSnapshot.openLoopUpdates.some((update) => update.status === "resolved");
  const brokenAgreement = judgeSnapshot.agreementUpdates.some(
    (update) => update.status === "broken",
  );
  const droppedLoop = judgeSnapshot.openLoopUpdates.some((update) => update.status === "dropped");
  const askCovered = judgeSnapshot.usedEvidenceIds.some((id) => id.includes(":ask-covered:"));
  const askBlocked = judgeSnapshot.usedEvidenceIds.some((id) => id.includes(":ask-blocked:"));

  return {
    warmth: clampEvidence(Math.round((dateLift + positive(stats.chemistry ?? 0) + trustLift) / 2)),
    attraction: clampEvidence(
      Math.round((positive(stats.spark ?? 0) * 1.2 + positive(stats.chemistry ?? 0)) / 2),
    ),
    reciprocity: clampEvidence(
      Math.round((trustLift + stabilityLift + (honoredAgreement ? 3 : 0)) / 2),
    ),
    repair: clampEvidence(
      Math.round(
        (conflictDrop + strainDrop + (resolvedLoop ? 4 : 0) + (honoredAgreement ? 2 : 0)) / 2,
      ),
    ),
    boundaryRespect: clampEvidence(
      Math.round((trustLift + stabilityLift + conflictDrop + strainDrop) / 3) -
        (brokenAgreement ? 4 : 0),
    ),
    pressure: clampEvidence(
      Math.round(
        (dateDrop + conflictLift + strainLift + (judgeSnapshot.shouldEndEarly ? 5 : 0)) / 2,
      ),
    ),
    avoidance: clampEvidence(
      Math.round(
        (trustDrop +
          stabilityDrop +
          judgeSnapshot.openLoopCandidates.length * 2 +
          (droppedLoop ? 2 : 0)) /
          2,
      ),
    ),
    novelty: clampEvidence(positive(stats.weirdnessTolerance ?? 0)),
    askProgress: askCovered ? 4 : askBlocked ? -3 : 0,
  };
}

function deriveModeledDateHealthDelta(
  rawDateHealthDelta: number,
  evidenceVector: DateEvidenceVector,
): number {
  const evidenceDelta = Math.round(
    evidenceVector.warmth * 0.8 +
      evidenceVector.attraction * 0.5 +
      evidenceVector.reciprocity * 0.7 +
      evidenceVector.repair * 0.9 +
      evidenceVector.boundaryRespect * 0.6 +
      evidenceVector.novelty * 0.25 +
      evidenceVector.askProgress * 0.55 -
      evidenceVector.pressure * 0.95 -
      evidenceVector.avoidance * 0.65,
  );
  return clamp(
    rawDateHealthDelta === 0
      ? evidenceDelta
      : Math.round(rawDateHealthDelta * 0.55 + evidenceDelta * 0.65),
    -18,
    14,
  );
}

function deriveModeledStatDeltas(
  rawStatDeltas: JudgeSnapshot["statDeltas"],
  evidenceVector: DateEvidenceVector,
): Partial<Record<RelationshipStat, number>> {
  const modeled: Partial<Record<PrimaryModeledStat, number>> = {
    chemistry: modeledStatDelta(
      rawStatDeltas.chemistry,
      evidenceVector.warmth * 0.45 +
        evidenceVector.attraction * 0.75 +
        evidenceVector.repair * 0.25 -
        evidenceVector.pressure * 0.35,
    ),
    trust: modeledStatDelta(
      rawStatDeltas.trust,
      evidenceVector.reciprocity * 0.65 +
        evidenceVector.repair * 0.75 +
        evidenceVector.boundaryRespect * 0.85 +
        evidenceVector.askProgress * 0.35 -
        evidenceVector.avoidance * 0.65 -
        evidenceVector.pressure * 0.3,
    ),
    stability: modeledStatDelta(
      rawStatDeltas.stability,
      evidenceVector.boundaryRespect * 0.7 +
        evidenceVector.reciprocity * 0.35 +
        evidenceVector.repair * 0.45 -
        evidenceVector.pressure * 0.65 -
        evidenceVector.avoidance * 0.35,
    ),
    conflict: modeledStatDelta(
      rawStatDeltas.conflict,
      evidenceVector.pressure * 0.8 +
        evidenceVector.avoidance * 0.35 -
        evidenceVector.repair * 0.55 -
        evidenceVector.boundaryRespect * 0.35,
    ),
    weirdnessTolerance: modeledStatDelta(
      rawStatDeltas.weirdnessTolerance,
      evidenceVector.novelty * 0.75 + evidenceVector.warmth * 0.2 - evidenceVector.pressure * 0.2,
    ),
    spark: modeledStatDelta(
      rawStatDeltas.spark,
      evidenceVector.attraction * 0.95 +
        evidenceVector.warmth * 0.35 +
        evidenceVector.novelty * 0.15 -
        evidenceVector.pressure * 0.4,
    ),
  };

  return removeZeroDeltas(modeled);
}

function modeledStatDelta(rawDelta: number | undefined, evidenceDelta: number): number {
  const raw = rawDelta ?? 0;
  const blended = raw === 0 ? evidenceDelta : raw * 0.45 + evidenceDelta * 0.85;
  const rounded = Math.round(blended);

  if (rounded === 0 && Math.abs(blended) >= 0.5) {
    return blended > 0 ? 1 : -1;
  }

  return clampDelta(clamp(rounded, -8, 8));
}

function removeZeroDeltas(
  deltas: Partial<Record<PrimaryModeledStat, number>>,
): Partial<Record<RelationshipStat, number>> {
  const result: Partial<Record<RelationshipStat, number>> = {};
  for (const stat of PRIMARY_MODELED_STATS) {
    const delta = deltas[stat] ?? 0;
    if (delta !== 0) {
      result[stat] = delta;
    }
  }
  return result;
}

function deriveModeledMemberMoodDeltas({
  session,
  members,
  scenario,
  judgeSnapshot,
  evidenceVector,
  dateHealthDelta,
  matchFit,
  exchangeMessages,
}: {
  session: DateSession;
  members: readonly Member[];
  scenario: DateScenario;
  judgeSnapshot: JudgeSnapshot;
  evidenceVector: DateEvidenceVector;
  dateHealthDelta: number;
  matchFit: MatchFitResult | undefined;
  exchangeMessages: readonly DateMessage[];
}): Record<string, number> {
  const deltas: Record<string, number> = {};

  for (const member of members) {
    const rawMood = judgeSnapshot.memberMoodDeltas[member.id] ?? Math.round(dateHealthDelta / 4);
    const utility = memberUtilityDelta({
      member,
      scenario,
      evidenceVector,
      boundaryRiskHit: matchFit?.boundaryRisk?.memberId === member.id,
      wasNudged: memberRespondedAfterIntervention(session, member.id, exchangeMessages),
    });
    const modeled = Math.round(rawMood * 0.65 + utility * 0.7);
    const clipped = modeled === 0 && Math.abs(rawMood) >= 3 ? (rawMood > 0 ? 1 : -1) : modeled;
    deltas[member.id] = clamp(clipped, -8, 8);
  }

  return deltas;
}

function memberUtilityDelta({
  member,
  scenario,
  evidenceVector,
  boundaryRiskHit,
  wasNudged,
}: {
  member: Member;
  scenario: DateScenario;
  evidenceVector: DateEvidenceVector;
  boundaryRiskHit: boolean;
  wasNudged: boolean;
}): number {
  let utility = Math.round(
    (evidenceVector.warmth +
      evidenceVector.reciprocity +
      evidenceVector.repair +
      evidenceVector.boundaryRespect +
      evidenceVector.attraction * 0.45 +
      evidenceVector.askProgress -
      evidenceVector.pressure -
      evidenceVector.avoidance * 0.75) /
      4,
  );
  const policy = deriveMemberScenarioPolicy(member, scenario);

  if (boundaryRiskHit) utility -= 3;
  if (wasNudged) utility += 2;

  if (policy.highPressureStrain) {
    utility -= 2 + Math.floor(positive(evidenceVector.pressure) / 4);
  }
  if (policy.lowPressureSupported) {
    utility += 1;
  }
  if (policy.publicPressure) {
    utility -= 1 + Math.floor(positive(evidenceVector.pressure) / 3);
  }
  if (policy.prophecyPressure) {
    utility -= 3;
  }
  if (policy.memoryPressure) {
    utility -= 1 + (scenario.card.intimacy === "high" ? 1 : 0);
  }
  if (policy.griefPressure) {
    utility -= scenario.card.intimacy === "high" ? 3 : 1;
  }
  if (memberHasTag(member, "sincerity_seeking")) {
    utility += Math.min(2, positive(evidenceVector.reciprocity + evidenceVector.repair));
    utility -= Math.min(2, positive(evidenceVector.avoidance));
  }
  if (memberHasTag(member, "avoidant")) {
    utility -= Math.min(2, positive(evidenceVector.pressure));
  }
  if (memberHasTag(member, "competitive")) {
    utility += evidenceVector.attraction >= 3 && evidenceVector.pressure <= 3 ? 1 : 0;
    utility -= evidenceVector.pressure >= 5 ? 1 : 0;
  }
  if (policy.careerContext) {
    utility += 1;
  }
  if (policy.weirdnessNative && evidenceVector.novelty >= 3) {
    utility += 1;
  }

  return clamp(utility, -8, 8);
}

function deriveMemberAffects({
  members,
  scenario,
  judgeSnapshot,
  evidenceVector,
  memberMoodDeltas,
  matchFit,
}: {
  members: readonly Member[];
  scenario: DateScenario;
  judgeSnapshot: JudgeSnapshot;
  evidenceVector: DateEvidenceVector;
  memberMoodDeltas: Record<string, number>;
  matchFit: MatchFitResult | undefined;
}): Record<string, JudgeMemberAffect> {
  const affects: Record<string, JudgeMemberAffect> = {};

  for (const member of members) {
    const moodDelta = memberMoodDeltas[member.id] ?? 0;
    affects[member.id] = deriveMemberAffect({
      scenario,
      judgeSnapshot,
      evidenceVector,
      moodDelta,
      boundaryRiskHit: matchFit?.boundaryRisk?.memberId === member.id,
    });
  }

  return affects;
}

function deriveMemberAffect({
  scenario,
  judgeSnapshot,
  evidenceVector,
  moodDelta,
  boundaryRiskHit,
}: {
  scenario: DateScenario;
  judgeSnapshot: JudgeSnapshot;
  evidenceVector: DateEvidenceVector;
  moodDelta: number;
  boundaryRiskHit: boolean;
}): JudgeMemberAffect {
  const pressure = positive(evidenceVector.pressure);
  const attraction = positive(evidenceVector.attraction);
  const warmth = positive(evidenceVector.warmth);
  const repair = positive(evidenceVector.repair);
  const boundaryRespect = positive(evidenceVector.boundaryRespect);
  const novelty = positive(evidenceVector.novelty);

  if (judgeSnapshot.shouldEndEarly || boundaryRiskHit || (moodDelta <= -4 && pressure >= 4)) {
    return affect("angry", "boundary pressure");
  }

  if (moodDelta <= -5 || pressure >= 6) {
    return affect("overloaded", "room pressure");
  }

  if (moodDelta <= -2 && attraction >= 3) {
    return affect("disappointed", "spark did not feel safe");
  }

  if (moodDelta < 0) {
    return affect("guarded", "trust dipped");
  }

  if (moodDelta >= 4 && attraction >= 3) {
    return affect("leaning_in", "spark landed");
  }

  if (moodDelta > 0 && (repair >= 3 || boundaryRespect >= 3)) {
    return affect("relieved", "repair landed");
  }

  if (moodDelta > 0 && warmth + attraction >= 4) {
    return affect("warming", "warmth landed");
  }

  if (moodDelta >= 0 && novelty >= 4 && scenario.card.chaos !== "low") {
    return affect("curious", "weirdness registered");
  }

  return affect("neutral", "no strong affect shift");
}

function affect(affectValue: JudgeMemberAffect["affect"], cause: string): JudgeMemberAffect {
  return {
    affect: affectValue,
    cause,
  };
}

function memberRespondedAfterIntervention(
  session: DateSession,
  memberId: string,
  exchangeMessages: readonly DateMessage[],
): boolean {
  return session.interventions.some(
    (intervention) =>
      intervention.targetMemberId === memberId &&
      exchangeMessages.some(
        (message) =>
          message.kind === "character" &&
          message.speakerId === memberId &&
          message.turnIndex > intervention.usedAtTurn,
      ),
  );
}

function positive(value: number): number {
  return Math.max(0, value);
}

function clampEvidence(value: number): number {
  return clamp(Math.round(value), -8, 8);
}
