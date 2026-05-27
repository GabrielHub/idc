import type { GameSave, ShiftState } from "../../domain/game";
import { pendingFollowUpSessionsForShift, sessionBelongsToShift } from "../../services/date-engine";
import { buildShiftBriefData } from "./build-shift-brief-rows";
import type { ShiftBriefData } from "./shift-brief-dock";

export type ShiftFilingState = {
  fileShiftReady: boolean;
  fileShiftBlockedReason: string | undefined;
  noDatesThisShift: boolean;
  shiftBrief: ShiftBriefData;
};

/**
 * Pure derivation of the shift-filing brief: whether filing is unblocked, the
 * reason it's blocked (if any), and the brief rows the bottom dock renders.
 * Brief-row authoring lives in `build-shift-brief-rows.ts` so this file stays
 * focused on the filing-readiness question.
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

  const shiftBrief = buildShiftBriefData({
    save,
    shift,
    readyClosurePairCount,
    pendingFollowUpCount,
    fileShiftBlockedReason,
  });

  return {
    fileShiftReady,
    fileShiftBlockedReason,
    noDatesThisShift,
    shiftBrief,
  };
}
