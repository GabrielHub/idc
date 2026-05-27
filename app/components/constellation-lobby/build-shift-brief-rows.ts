import type { GameSave, ShiftState } from "../../domain/game";
import { companyGoals, memberRequests } from "../../fixtures";
import {
  buildGoalProgressSnapshots,
  buildShiftGoalMetrics,
  deriveHotRequestId,
  fallbackGoalProgress,
} from "../../services/date-engine";
import type { ShiftBriefData, ShiftBriefStatus } from "./shift-brief-dock";

/**
 * Derive the shift-brief payload the bottom-right dock renders: the lead ask,
 * shift goals with live progress, and the operational gates. Pure projection
 * of save + shift state into a presentation-ready shape.
 */
export function buildShiftBriefData({
  save,
  shift,
  readyClosurePairCount,
  pendingFollowUpCount,
  fileShiftBlockedReason,
}: {
  save: GameSave;
  shift: ShiftState;
  readyClosurePairCount: number;
  pendingFollowUpCount: number;
  fileShiftBlockedReason: string | undefined;
}): ShiftBriefData {
  return {
    leadAsk: buildLeadAsk(save, shift),
    goals: buildGoals(save, shift),
    gates: {
      closure: {
        value:
          readyClosurePairCount === 0
            ? "None ready"
            : `${readyClosurePairCount} ${readyClosurePairCount === 1 ? "pair" : "pairs"} ready`,
        status: readyClosurePairCount > 0 ? "alert" : "met",
      },
      followUp: {
        value: pendingFollowUpCount === 0 ? "Clear" : `${pendingFollowUpCount} due`,
        status: pendingFollowUpCount > 0 ? "alert" : "met",
      },
      fileShift: {
        value: fileShiftBlockedReason === undefined ? "Ready" : "Blocked",
        status: fileShiftBlockedReason === undefined ? "met" : "open",
      },
    },
  };
}

function buildLeadAsk(save: GameSave, shift: ShiftState): ShiftBriefData["leadAsk"] {
  const leadRequestId = deriveHotRequestId(shift);
  if (leadRequestId === undefined) return { kind: "empty" };
  const leadRequest = memberRequests.find((request) => request.id === leadRequestId);
  if (leadRequest === undefined) return { kind: "empty" };
  const leadMember = save.members.find((candidate) => candidate.id === leadRequest.memberId);
  if (leadMember === undefined) return { kind: "empty" };
  return {
    kind: "queued",
    memberName: leadMember.firstName,
    text: leadRequest.text,
  };
}

function buildGoals(save: GameSave, shift: ShiftState): ShiftBriefData["goals"] {
  const goals = shift.companyGoalIds
    .map((goalId) => companyGoals.find((goal) => goal.id === goalId))
    .filter((goal): goal is (typeof companyGoals)[number] => goal !== undefined);
  if (goals.length === 0) {
    return { summary: "None assigned", summaryStatus: "met", items: [] };
  }
  const metrics = buildShiftGoalMetrics({
    shift,
    dateSessions: save.dateSessions,
    members: save.members,
  });
  const snapshots = buildGoalProgressSnapshots({
    goals,
    shiftStatus: shift.status,
    metrics,
    shiftReport: shift.report,
  });
  const snapshotById = new Map(snapshots.map((snapshot) => [snapshot.goalId, snapshot] as const));
  const metGoalCount = snapshots.filter((snapshot) => snapshot.status === "met").length;
  const hasMissedGoal = snapshots.some((snapshot) => snapshot.status === "missed");
  return {
    summary: `${metGoalCount} / ${goals.length} clear`,
    summaryStatus: hasMissedGoal ? "alert" : metGoalCount === goals.length ? "met" : "open",
    items: goals.map((goal) => {
      const progress = snapshotById.get(goal.id) ?? fallbackGoalProgress(goal);
      const status: ShiftBriefStatus =
        progress.status === "met" ? "met" : progress.status === "missed" ? "alert" : "open";
      return {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        progress: progress.label,
        status,
      };
    }),
  };
}
