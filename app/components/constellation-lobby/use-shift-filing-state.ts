import { useMemo } from "react";

import type { GameSave, ShiftState } from "../../domain/game";
import { pendingFollowUpSessionsForShift, sessionBelongsToShift } from "../../services/date-engine";
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

  const shiftBriefRows = useMemo<ShiftBriefRowData[]>(
    () => [
      {
        label: "Goals",
        value:
          shift.companyGoalIds.length === 0
            ? "None assigned"
            : `${shift.companyGoalIds.length} active`,
        status: shift.companyGoalIds.length === 0 ? "met" : "open",
      },
      {
        label: "Closure",
        value:
          readyClosurePairCount === 0
            ? "None ready"
            : `${readyClosurePairCount} ${readyClosurePairCount === 1 ? "pair" : "pairs"} ready`,
        status: readyClosurePairCount > 0 ? "alert" : "met",
      },
      {
        label: "Follow-up",
        value: pendingFollowUpCount === 0 ? "Clear" : `${pendingFollowUpCount} due`,
        status: pendingFollowUpCount > 0 ? "alert" : "met",
      },
      {
        label: "File shift",
        value: fileShiftBlockedReason === undefined ? "Ready" : "Blocked",
        status: fileShiftBlockedReason === undefined ? "met" : "open",
      },
    ],
    [fileShiftBlockedReason, pendingFollowUpCount, readyClosurePairCount, shift.companyGoalIds],
  );

  return {
    fileShiftReady,
    fileShiftBlockedReason,
    noDatesThisShift,
    shiftBriefRows,
  };
}
