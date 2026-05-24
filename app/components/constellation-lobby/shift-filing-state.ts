import type { GameSave, ShiftState } from "../../domain/game";
import { companyGoals, memberRequests } from "../../fixtures";
import {
  buildGoalProgressSnapshots,
  buildShiftGoalMetrics,
  deriveHotRequestId,
  fallbackGoalProgress,
  pendingFollowUpSessionsForShift,
  sessionBelongsToShift,
} from "../../services/date-engine";
import type { ShiftBriefRowData } from "./shift-brief-dock";

export type ShiftFilingState = {
  fileShiftReady: boolean;
  fileShiftBlockedReason: string | undefined;
  noDatesThisShift: boolean;
  shiftBriefRows: readonly ShiftBriefRowData[];
};

/**
 * Pure derivation of the shift-filing brief: whether filing is unblocked, the
 * reason it's blocked (if any), and the brief rows the bottom dock renders.
 */
export function deriveShiftFilingState({
  save,
  shift,
  readyClosurePairCount,
  pendingFollowUpCount,
}: {
  save: GameSave;
  shift: ShiftState;
  readyClosurePairCount: number;
  pendingFollowUpCount: number;
}): ShiftFilingState {
  const shiftSessions = save.dateSessions.filter((session) =>
    sessionBelongsToShift(session, shift.shiftNumber),
  );

  const fileShiftReady = shiftSessions.some(
    (session) => session.status !== "active" && session.finalReport?.appliedFollowUp !== undefined,
  );

  const pendingFollowUps = pendingFollowUpSessionsForShift(save, shift.shiftNumber);

  const fileShiftBlockedReason =
    shift.activeBooking !== undefined
      ? "Resolve or cancel the active booking before filing the shift."
      : shiftSessions.some((session) => session.status === "active")
        ? "Resolve the active date before filing the shift."
        : pendingFollowUps.length > 0
          ? "File a follow-up for every completed date before filing the shift."
          : undefined;

  const noDatesThisShift = shiftSessions.length === 0;

  const leadRequestId = deriveHotRequestId(shift);
  const leadRequest =
    leadRequestId === undefined
      ? undefined
      : memberRequests.find((request) => request.id === leadRequestId);
  const leadMember =
    leadRequest === undefined
      ? undefined
      : save.members.find((candidate) => candidate.id === leadRequest.memberId);

  const leadAskRow: ShiftBriefRowData =
    leadRequest === undefined || leadMember === undefined
      ? { id: "lead-ask", label: "Lead ask", value: "None queued", status: "met" }
      : {
          id: "lead-ask",
          label: "Lead ask",
          value: `${leadMember.firstName}: ${trimBriefValue(leadRequest.text)}`,
          status: "open",
        };

  const goals = shift.companyGoalIds
    .map((goalId) => companyGoals.find((goal) => goal.id === goalId))
    .filter((goal): goal is (typeof companyGoals)[number] => goal !== undefined);
  const goalRows: ShiftBriefRowData[] =
    goals.length === 0
      ? [{ id: "goals", label: "Goals", value: "None assigned", status: "met" }]
      : (() => {
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
          const snapshotById = new Map(
            snapshots.map((snapshot) => [snapshot.goalId, snapshot] as const),
          );
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
                  progress.status === "met"
                    ? "met"
                    : progress.status === "missed"
                      ? "alert"
                      : "open",
              } satisfies ShiftBriefRowData;
            }),
          ];
        })();

  const shiftBriefRows: ShiftBriefRowData[] = [
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
