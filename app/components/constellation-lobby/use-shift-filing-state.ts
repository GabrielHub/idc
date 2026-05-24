import { useMemo } from "react";

import type { GameSave, ShiftState } from "../../domain/game";
import { companyGoals, memberRequests } from "../../fixtures";
import {
  buildGoalProgressSnapshots,
  buildShiftGoalMetrics,
  fallbackGoalProgress,
  pendingFollowUpSessionsForShift,
  sessionBelongsToShift,
  deriveHotRequestId,
} from "../../services/date-engine";
import type { ShiftBriefRowData } from "./shift-brief-dock";

export function useShiftFilingState({
  save,
  shift,
  readyClosurePairCount,
  pendingFollowUpCount,
}: {
  save: GameSave;
  shift: ShiftState;
  readyClosurePairCount: number;
  pendingFollowUpCount: number;
}) {
  const shiftSessions = useMemo(
    () => save.dateSessions.filter((session) => sessionBelongsToShift(session, shift.shiftNumber)),
    [save.dateSessions, shift.shiftNumber],
  );

  const fileShiftReady = useMemo(
    () =>
      shiftSessions.some(
        (session) =>
          session.status !== "active" && session.finalReport?.appliedFollowUp !== undefined,
      ),
    [shiftSessions],
  );

  const pendingFollowUps = useMemo(
    () => pendingFollowUpSessionsForShift(save, shift.shiftNumber),
    [save, shift.shiftNumber],
  );

  const fileShiftBlockedReason = useMemo(() => {
    if (shift.activeBooking !== undefined) {
      return "Resolve or cancel the active booking before filing the shift.";
    }

    if (shiftSessions.some((session) => session.status === "active")) {
      return "Resolve the active date before filing the shift.";
    }

    if (pendingFollowUps.length > 0) {
      return "File a follow-up for every completed date before filing the shift.";
    }

    return undefined;
  }, [pendingFollowUps.length, shift.activeBooking, shiftSessions]);

  const noDatesThisShift = shiftSessions.length === 0;
  const leadAskRow = useMemo<ShiftBriefRowData>(() => {
    const leadRequestId = deriveHotRequestId(shift);
    const leadRequest =
      leadRequestId === undefined
        ? undefined
        : memberRequests.find((request) => request.id === leadRequestId);
    const member =
      leadRequest === undefined
        ? undefined
        : save.members.find((candidate) => candidate.id === leadRequest.memberId);

    if (leadRequest === undefined || member === undefined) {
      return { id: "lead-ask", label: "Lead ask", value: "None queued", status: "met" };
    }

    return {
      id: "lead-ask",
      label: "Lead ask",
      value: `${member.firstName}: ${trimBriefValue(leadRequest.text)}`,
      status: "open",
    };
  }, [save.members, shift]);

  const goalRows = useMemo<ShiftBriefRowData[]>(() => {
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
          status:
            progress.status === "met" ? "met" : progress.status === "missed" ? "alert" : "open",
        } satisfies ShiftBriefRowData;
      }),
    ];
  }, [save.dateSessions, save.members, shift]);

  const shiftBriefRows = useMemo<ShiftBriefRowData[]>(
    () => [
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
    ],
    [fileShiftBlockedReason, goalRows, leadAskRow, pendingFollowUpCount, readyClosurePairCount],
  );

  return {
    fileShiftReady,
    fileShiftBlockedReason,
    noDatesThisShift,
    shiftBriefRows,
  };
}

function trimBriefValue(value: string, maxLength: number = 54): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}
