import type {
  DateSession,
  GameSave,
  MemberRequest,
  ShiftRequestAskOutcome,
  ShiftState,
} from "../domain/game";
import { memberRequests } from "../fixtures";
import { buildAskEvidenceId } from "./player-knowledge";
import { selectHotRequestId } from "./shift-planning";

export type ShiftRequestAssessment = {
  shiftNumber: number;
  outcomes: ReadonlyMap<string, ShiftRequestAskOutcome>;
  leadRequestId: string | undefined;
  leadRequest: MemberRequest | undefined;
  leadOutcome: ShiftRequestAskOutcome | undefined;
  penaltyRequests: {
    ignored: readonly MemberRequest[];
    missed: readonly MemberRequest[];
  };
  backgroundIgnoredCount: number;
  moodAdjustments: ReadonlyMap<string, number>;
  fulfillmentScore: RequestFulfillmentScore;
};

export type RequestFulfillmentScore = {
  asked: number;
  weighted: number;
};

export function assessShiftRequests({
  shift,
  completedDates,
}: {
  shift: ShiftState;
  completedDates: readonly DateSession[];
}): ShiftRequestAssessment {
  const outcomes = classifyShiftRequestOutcomes(shift, completedDates);
  const leadRequestId = deriveHotRequestId(shift);
  const leadRequest =
    leadRequestId === undefined
      ? undefined
      : memberRequests.find((request) => request.id === leadRequestId);
  const leadOutcome = leadRequestId === undefined ? undefined : outcomes.get(leadRequestId);
  const ignored = leadOutcome === "ignored" && leadRequest !== undefined ? [leadRequest] : [];
  const missed = leadOutcome === "missed" && leadRequest !== undefined ? [leadRequest] : [];
  const ignoredCount = countShiftRequestsByOutcome(outcomes, "ignored");

  return {
    shiftNumber: shift.shiftNumber,
    outcomes,
    leadRequestId,
    leadRequest,
    leadOutcome,
    penaltyRequests: { ignored, missed },
    backgroundIgnoredCount: ignoredCount - ignored.length,
    moodAdjustments: buildShiftRequestMoodAdjustments(ignored, missed),
    fulfillmentScore: scoreShiftRequestFulfillment({
      shiftNumber: shift.shiftNumber,
      memberRequestIds: shift.memberRequestIds,
      requestOutcomes: Object.fromEntries(outcomes),
    }),
  };
}

export function classifyFocusAskOutcomeFromSession(
  session: DateSession,
  memberId: string,
  requestId: string,
): "covered" | "raised" | "missed" {
  const coveredEvidenceId = buildAskEvidenceId(memberId, requestId, "covered");
  const blockedEvidenceId = buildAskEvidenceId(memberId, requestId, "blocked");
  let blockedSeen = false;

  for (const snapshot of session.judgeSnapshots) {
    for (const evidenceId of snapshot.usedEvidenceIds) {
      if (evidenceId === coveredEvidenceId) {
        return "covered";
      }
      if (evidenceId === blockedEvidenceId) {
        blockedSeen = true;
      }
    }
  }

  return blockedSeen ? "raised" : "missed";
}

export function deriveHotRequestId(shift: ShiftState): string | undefined {
  return selectHotRequestId({
    memberRequestIds: shift.memberRequestIds,
    shiftNumber: shift.shiftNumber,
  });
}

export function classifyShiftRequestOutcomes(
  shift: ShiftState,
  completedDates: readonly DateSession[],
): Map<string, ShiftRequestAskOutcome> {
  const outcomes = new Map<string, ShiftRequestAskOutcome>();

  for (const requestId of shift.memberRequestIds) {
    outcomes.set(requestId, "ignored");
  }

  for (const session of completedDates) {
    const requestId = session.focusRequestId;
    if (requestId === undefined || !outcomes.has(requestId)) {
      continue;
    }

    const request = memberRequests.find((candidate) => candidate.id === requestId);
    if (request === undefined) {
      continue;
    }

    outcomes.set(
      requestId,
      classifyFocusAskOutcomeFromSession(session, request.memberId, requestId),
    );
  }

  return outcomes;
}

export function recentRequestFulfillmentRate(
  save: GameSave,
  windowStart: number,
  currentShiftAssessment?: ShiftRequestAssessment,
): number {
  let asked = 0;
  let weighted = 0;
  const skipShiftNumber = currentShiftAssessment?.shiftNumber;

  for (const shift of save.shifts) {
    if (
      shift.shiftNumber <= windowStart ||
      shift.shiftNumber === skipShiftNumber ||
      shift.report === undefined
    ) {
      continue;
    }
    const score = scoreShiftRequestFulfillment({
      shiftNumber: shift.shiftNumber,
      memberRequestIds: shift.memberRequestIds,
      requestOutcomes: shift.report.requestOutcomes,
      ignoredRequestIds: shift.report.ignoredRequestIds,
    });
    asked += score.asked;
    weighted += score.weighted;
  }

  if (currentShiftAssessment !== undefined && currentShiftAssessment.shiftNumber > windowStart) {
    asked += currentShiftAssessment.fulfillmentScore.asked;
    weighted += currentShiftAssessment.fulfillmentScore.weighted;
  }

  if (asked === 0) return 1;
  return weighted / asked;
}

function scoreShiftRequestFulfillment({
  shiftNumber,
  memberRequestIds,
  requestOutcomes,
  ignoredRequestIds = [],
}: {
  shiftNumber: number;
  memberRequestIds: readonly string[];
  requestOutcomes: Readonly<Record<string, ShiftRequestAskOutcome>>;
  ignoredRequestIds?: readonly string[];
}): RequestFulfillmentScore {
  const total = memberRequestIds.length;
  if (total === 0) return { asked: 0, weighted: 0 };

  if (Object.keys(requestOutcomes).length > 0) {
    const leadRequestId = selectHotRequestId({ memberRequestIds, shiftNumber });
    if (leadRequestId !== undefined) {
      const outcome = requestOutcomes[leadRequestId] ?? "ignored";
      return { asked: 1, weighted: SHIFT_REQUEST_OUTCOME_WEIGHT[outcome] };
    }
  }

  return { asked: total, weighted: total - ignoredRequestIds.length };
}

const SHIFT_REQUEST_OUTCOME_WEIGHT: Record<ShiftRequestAskOutcome, number> = {
  covered: 1,
  raised: 0.75,
  missed: 0.5,
  ignored: 0,
};

function countShiftRequestsByOutcome(
  outcomes: ReadonlyMap<string, ShiftRequestAskOutcome>,
  target: ShiftRequestAskOutcome,
): number {
  let count = 0;
  for (const outcome of outcomes.values()) {
    if (outcome === target) count += 1;
  }
  return count;
}

export function missedRequestMoodPenalty(request: MemberRequest): number {
  return Math.ceil(request.moodPenaltyIfIgnored / 2);
}

function buildShiftRequestMoodAdjustments(
  ignoredRequests: readonly MemberRequest[],
  missedRequests: readonly MemberRequest[],
): Map<string, number> {
  const adjustments = new Map<string, number>();

  for (const request of ignoredRequests) {
    adjustments.set(
      request.memberId,
      (adjustments.get(request.memberId) ?? 0) - request.moodPenaltyIfIgnored,
    );
  }

  for (const request of missedRequests) {
    adjustments.set(
      request.memberId,
      (adjustments.get(request.memberId) ?? 0) - missedRequestMoodPenalty(request),
    );
  }

  return adjustments;
}
