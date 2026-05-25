import type { GameSave, ShiftState } from "../../domain/game";
import { companyGoals, memberRequests } from "../../fixtures";
import {
  buildGoalProgressSnapshots,
  buildShiftGoalMetrics,
  deriveHotRequestId,
  fallbackGoalProgress,
} from "../../services/date-engine";
import type { ShiftBriefRowData } from "./shift-brief-dock";

/**
 * Author the shift brief dock rows: the lead ask, the goal summary + per-goal
 * status rows, the closure/follow-up tallies, and the file-shift terminator.
 * Pure derivation — given save + shift + closure/follow-up counts + the
 * filing-blocked reason, returns the ordered row list the dock renders.
 */
export function buildShiftBriefRows({
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
}): ShiftBriefRowData[] {
  const leadAskRow = buildLeadAskRow(save, shift);
  const goalRows = buildGoalRows(save, shift);

  return [
    leadAskRow,
    ...goalRows,
    {
      id: "closure",
      label: "Closure",
      value:
        readyClosurePairCount === 0
          ? "None ready"
          : `${readyClosurePairCount} ${readyClosurePairCount === 1 ? "pair" : "pairs"} ready`,
      status: readyClosurePairCount > 0 ? "alert" : "met",
    },
    {
      id: "follow-up",
      label: "Follow-up",
      value: pendingFollowUpCount === 0 ? "Clear" : `${pendingFollowUpCount} due`,
      status: pendingFollowUpCount > 0 ? "alert" : "met",
    },
    {
      id: "file-shift",
      label: "File shift",
      value: fileShiftBlockedReason === undefined ? "Ready" : "Blocked",
      status: fileShiftBlockedReason === undefined ? "met" : "open",
    },
  ];
}

function buildLeadAskRow(save: GameSave, shift: ShiftState): ShiftBriefRowData {
  const leadRequestId = deriveHotRequestId(shift);
  if (leadRequestId === undefined) {
    return { id: "lead-ask", label: "Lead ask", value: "None queued", status: "met" };
  }
  const leadRequest = memberRequests.find((request) => request.id === leadRequestId);
  if (leadRequest === undefined) {
    return { id: "lead-ask", label: "Lead ask", value: "None queued", status: "met" };
  }
  const leadMember = save.members.find((candidate) => candidate.id === leadRequest.memberId);
  if (leadMember === undefined) {
    return { id: "lead-ask", label: "Lead ask", value: "None queued", status: "met" };
  }
  return {
    id: "lead-ask",
    label: "Lead ask",
    value: trimBriefValue(`${leadMember.firstName}: ${leadRequest.text}`),
    status: "open",
  };
}

function buildGoalRows(save: GameSave, shift: ShiftState): ShiftBriefRowData[] {
  const goals = shift.companyGoalIds
    .map((goalId) => companyGoals.find((goal) => goal.id === goalId))
    .filter((goal): goal is (typeof companyGoals)[number] => goal !== undefined);
  if (goals.length === 0) {
    return [{ id: "goals", label: "Goals", value: "None assigned", status: "met" }];
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
  return [
    {
      id: "goals",
      label: "Goals",
      value: `${metGoalCount} / ${goals.length} clear`,
      status: hasMissedGoal ? "alert" : metGoalCount === goals.length ? "met" : "open",
    },
    ...goals.map((goal) => {
      const progress = snapshotById.get(goal.id) ?? fallbackGoalProgress(goal);
      return {
        id: `goal-${goal.id}`,
        label: trimBriefValue(progress.label, 24),
        value: trimBriefValue(goal.title),
        status: progress.status === "met" ? "met" : progress.status === "missed" ? "alert" : "open",
      } satisfies ShiftBriefRowData;
    }),
  ];
}

function trimBriefValue(value: string, maxLength: number = 54): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}
