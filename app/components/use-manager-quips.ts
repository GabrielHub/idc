import { useCallback, useRef, useState } from "react";

import type { DateFinalReport, DateSessionStatus, GameSave } from "../domain/game";
import type { DateEngineResult } from "../services/date-engine";
import { getActiveShift } from "../services/game-seed";
import {
  appendManagerQuipHistory,
  detectFocusSwapDropOfActive,
  detectMemberQuitTransition,
  detectRetentionWarningDip,
  indexMembersById,
  pairEnteredBrittleTrajectory,
  resolveManagerQuip,
  type ManagerQuipResolveResult,
} from "../services/manager-quips";
import {
  getManagerQuipById,
  type ManagerQuip,
  type ManagerQuipTriggerKey,
} from "../fixtures/manager-quips";
import type { GameRepository } from "../repositories/game-repository";
import type { SfxCue } from "./sfx-provider";

const OUTCOME_QUIP_TRIGGER_KEYS: Partial<
  Record<DateFinalReport["outcome"], ManagerQuipTriggerKey>
> = {
  bad_fit: "date.outcome.bad-fit",
  cool_down: "date.outcome.cool-down",
  second_date: "date.outcome.encourage",
  mixed: "date.outcome.encourage",
};

/**
 * Owns manager-quip popup state and the dispatch surface the rest of the shell
 * calls into:
 *
 *   - `dispatchManagerQuip` resolves a trigger against history + tutorial gate
 *     and presents the popup if the resolver returns one;
 *   - `processManagerQuipSaveDiff` scans before/after saves for member quits,
 *     retention dips, and focus-swap drops, firing quips per detection;
 *   - `dispatchPostDateQuips` packages the session-transition trigger,
 *     outcome quip, brittle-trajectory check, and post-diff scan into a single
 *     call that the date-engine handlers can fire once they have a result.
 *
 * The hook persists each quip's history record itself (best-effort, errors
 * logged) so callers don't have to thread that path. Session-played ids are
 * tracked in a ref so a single shift doesn't repeat the same quip even if the
 * underlying trigger fires twice.
 */
export function useManagerQuips({
  getSave,
  repository,
  commitSave,
  isTutorialBlockingRef,
  play,
}: {
  getSave: () => GameSave | null;
  repository: GameRepository;
  commitSave: (next: GameSave) => void;
  isTutorialBlockingRef: { readonly current: boolean };
  play: (cue: SfxCue) => void;
}) {
  const [activeManagerQuip, setActiveManagerQuip] = useState<ManagerQuip | null>(null);
  const [managerQuipPresentationKey, setManagerQuipPresentationKey] = useState(0);
  const sessionManagerQuipIdsRef = useRef<Set<string>>(new Set());

  const presentManagerQuip = useCallback(
    (currentSave: GameSave, result: ManagerQuipResolveResult, shiftNumber: number): void => {
      const quip = getManagerQuipById(result.quipId);
      if (quip === undefined) return;
      const nextHistory = appendManagerQuipHistory(
        currentSave.managerQuipHistory,
        result.historyRecord,
        shiftNumber,
      );
      const updatedSave: GameSave = { ...currentSave, managerQuipHistory: nextHistory };
      commitSave(updatedSave);
      void repository.saveGame(updatedSave).catch((error) => {
        console.warn("Manager quip history persist failed", error);
      });
      sessionManagerQuipIdsRef.current.add(result.quipId);
      setActiveManagerQuip(quip);
      setManagerQuipPresentationKey((prev) => prev + 1);
    },
    [commitSave, repository],
  );

  const dispatchManagerQuip = useCallback(
    (input: {
      triggerKey: ManagerQuipTriggerKey;
      surfaceKey?: string;
      bypassTutorialGate?: boolean;
    }): void => {
      if (isTutorialBlockingRef.current && input.bypassTutorialGate !== true) return;
      const currentSave = getSave();
      if (currentSave === null) return;
      const shiftNumber = getActiveShift(currentSave).shiftNumber;
      const result = resolveManagerQuip({
        triggerKey: input.triggerKey,
        history: currentSave.managerQuipHistory,
        currentShiftNumber: shiftNumber,
        sessionPlayedQuipIds: sessionManagerQuipIdsRef.current,
        surfaceKey: input.surfaceKey,
      });
      if (result === null) return;
      presentManagerQuip(currentSave, result, shiftNumber);
    },
    [getSave, isTutorialBlockingRef, presentManagerQuip],
  );

  const processManagerQuipSaveDiff = useCallback(
    (previousSave: GameSave, nextSave: GameSave): void => {
      if (isTutorialBlockingRef.current) return;
      const previousById = indexMembersById(previousSave.members);
      const nextById = indexMembersById(nextSave.members);
      const quit = detectMemberQuitTransition(previousSave, nextSave, previousById);
      if (quit !== null) {
        dispatchManagerQuip({ triggerKey: "member.status.quit", surfaceKey: quit });
      }
      const retentionDip = detectRetentionWarningDip(previousSave, nextSave, previousById);
      if (retentionDip !== null) {
        dispatchManagerQuip({
          triggerKey: "member.retention.warning",
          surfaceKey: retentionDip.memberId,
        });
      }
      const swapDrop = detectFocusSwapDropOfActive(previousSave, nextSave, previousById, nextById);
      if (swapDrop !== null) {
        dispatchManagerQuip({ triggerKey: "focus.swap.first", surfaceKey: swapDrop });
      }
    },
    [dispatchManagerQuip, isTutorialBlockingRef],
  );

  const dispatchPostDateQuips = useCallback(
    (input: {
      previousStatus: DateSessionStatus;
      previousSave: GameSave;
      result: DateEngineResult;
    }): void => {
      const { previousStatus, previousSave, result } = input;
      const sessionId = result.session.id;
      const transitionTrigger: ManagerQuipTriggerKey | null =
        previousStatus === "active" && result.session.status === "completed"
          ? "date.ended"
          : previousStatus === "active" && result.session.status === "ended_early"
            ? "date.ended-early"
            : null;
      if (transitionTrigger !== null) {
        dispatchManagerQuip({ triggerKey: transitionTrigger, surfaceKey: sessionId });
        dispatchOutcomeQuip(dispatchManagerQuip, result.session.finalReport, sessionId);
        dispatchBrittleTrajectoryIfChanged(
          dispatchManagerQuip,
          previousSave,
          result.save,
          result.session.pairId,
        );
        play("report");
      }
      processManagerQuipSaveDiff(previousSave, result.save);
    },
    [dispatchManagerQuip, play, processManagerQuipSaveDiff],
  );

  const handleManagerQuipDismissed = useCallback(() => setActiveManagerQuip(null), []);

  const resetSessionQuips = useCallback(() => {
    sessionManagerQuipIdsRef.current = new Set();
    setActiveManagerQuip(null);
  }, []);

  return {
    activeManagerQuip,
    managerQuipPresentationKey,
    dispatchManagerQuip,
    processManagerQuipSaveDiff,
    dispatchPostDateQuips,
    handleManagerQuipDismissed,
    resetSessionQuips,
  };
}

function dispatchOutcomeQuip(
  dispatchManagerQuip: (input: { triggerKey: ManagerQuipTriggerKey; surfaceKey?: string }) => void,
  report: DateFinalReport | undefined,
  sessionId: string,
): void {
  if (report === undefined) return;
  // Filing Close on a non-bad_fit outcome retires the romantic lane on the
  // player's own call. Route to the bad-fit quip pool so the manager doesn't
  // celebrate the lane the player just chose to kill.
  const triggerKey =
    report.appliedFollowUp === "close" && report.outcome !== "bad_fit"
      ? "date.outcome.bad-fit"
      : OUTCOME_QUIP_TRIGGER_KEYS[report.outcome];
  if (triggerKey === undefined) return;
  dispatchManagerQuip({ triggerKey, surfaceKey: sessionId });
}

function dispatchBrittleTrajectoryIfChanged(
  dispatchManagerQuip: (input: { triggerKey: ManagerQuipTriggerKey; surfaceKey?: string }) => void,
  previousSave: GameSave,
  nextSave: GameSave,
  pairId: string,
): void {
  const previousPair = previousSave.pairStates.find((pair) => pair.id === pairId);
  const nextPair = nextSave.pairStates.find((pair) => pair.id === pairId);
  if (nextPair === undefined) return;
  const previousCompleted = previousSave.dateSessions.filter(
    (session) => session.finalReport !== undefined,
  );
  const nextCompleted = nextSave.dateSessions.filter(
    (session) => session.finalReport !== undefined,
  );
  if (
    pairEnteredBrittleTrajectory({
      previousPairState: previousPair,
      nextPairState: nextPair,
      previousCompletedSessions: previousCompleted,
      nextCompletedSessions: nextCompleted,
    })
  ) {
    dispatchManagerQuip({ triggerKey: "pair.trajectory.brittle", surfaceKey: pairId });
  }
}
