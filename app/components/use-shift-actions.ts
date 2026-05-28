import { useCallback } from "react";

import type { GameSave, MatchmakingIntent } from "../domain/game";
import { companyGoals, memberRequests, starterScenarios } from "../fixtures";
import type { ManagerQuipTriggerKey } from "../fixtures/manager-quips";
import {
  clearActiveBooking,
  commitDateBooking,
  completeShift,
  startDateSessionFromBooking,
  startNextShift,
} from "../services/date-engine";
import { addCardToDeck, removeCardFromDeck } from "../services/deck";
import {
  addFocusCase as focusAddCase,
  removeFocusCase as focusRemoveCase,
  reselectFocusCases as focusReselect,
} from "../services/focus-cases";
import { getActiveShift } from "../services/game-seed";
import { completeInitialOnboarding } from "../services/onboarding";
import { markSoftWinSeen } from "../services/closures";
import { swapShiftPartner } from "../services/shift-partner-actions";
import type { AiSetupStatus } from "./ai-setup-panel";
import type { SfxCue } from "./sfx-provider";

export type ShiftActionKind =
  | "startDate"
  | "endShift"
  | "nextShift"
  | "focusCase"
  | "partnerSwap"
  | "deck"
  | "softWin";

/**
 * Action handlers that mutate the shift planning + lifecycle save state:
 * commit / begin / cancel a booking, complete a shift, advance to the next,
 * swap roster partners, edit the date book deck, mark soft-win seen, and the
 * focused-member CRUD operations. Date-session handlers (advance exchange,
 * cut short, intervene, trigger event, toggle playback, follow-up resolution)
 * stay in the shell because they live next to the streaming-draft UI state.
 */
export function useShiftActions({
  getSave,
  tryAction,
  persist,
  play,
  dispatchManagerQuip,
  processManagerQuipSaveDiff,
  refreshLocalAiStatus,
  setIsAiSetupOpen,
  setActiveDateSessionId,
  setInterventionText,
  setInterventionTargetMemberId,
}: {
  getSave: () => GameSave | null;
  tryAction: (kind: ShiftActionKind, run: () => Promise<void>) => Promise<boolean>;
  persist: (nextSave: GameSave) => Promise<void>;
  play: (cue: SfxCue) => void;
  dispatchManagerQuip: (input: {
    triggerKey: ManagerQuipTriggerKey;
    surfaceKey?: string;
    bypassTutorialGate?: boolean;
  }) => void;
  processManagerQuipSaveDiff: (previousSave: GameSave, nextSave: GameSave) => void;
  refreshLocalAiStatus: () => Promise<AiSetupStatus>;
  setIsAiSetupOpen: (open: boolean) => void;
  setActiveDateSessionId: (id: string | null) => void;
  setInterventionText: (value: string) => void;
  setInterventionTargetMemberId: (value: string) => void;
}) {
  const handleCommitPair = useCallback(
    async (input: {
      focusMemberId: string;
      partnerMemberId: string;
      matchmakingIntent?: MatchmakingIntent;
    }) => {
      const save = getSave();
      if (save === null) return;
      await tryAction("startDate", async () => {
        if (!save.config.aiSetupComplete) {
          setIsAiSetupOpen(true);
          throw new Error("AI setup is required before Cupid commits a pair.");
        }
        const result = commitDateBooking(save, input);
        await persist(result.save);
      });
    },
    [getSave, persist, setIsAiSetupOpen, tryAction],
  );

  const handleBeginDate = useCallback(
    async (input: {
      focusMemberId: string;
      partnerMemberId: string;
      scenarioId: string;
      matchmakingIntent?: MatchmakingIntent;
    }) => {
      const save = getSave();
      if (save === null) return;
      await tryAction("startDate", async () => {
        if (!save.config.aiSetupComplete) {
          setIsAiSetupOpen(true);
          throw new Error("AI setup is required before Cupid starts a date.");
        }
        const status = await refreshLocalAiStatus();
        if (status.status !== "ready") {
          throw new Error(status.message);
        }
        const activeShift = getActiveShift(save);
        if (activeShift.activeBooking === undefined) {
          throw new Error("Commit the pair before choosing a room.");
        }
        const result = startDateSessionFromBooking(save, { scenarioId: input.scenarioId });
        await persist(result.save);
        dispatchManagerQuip({ triggerKey: "date.started", surfaceKey: result.session.id });
        setActiveDateSessionId(result.session.id);
        setInterventionText("");
        setInterventionTargetMemberId("");
      });
    },
    [
      dispatchManagerQuip,
      getSave,
      persist,
      refreshLocalAiStatus,
      setActiveDateSessionId,
      setInterventionTargetMemberId,
      setInterventionText,
      setIsAiSetupOpen,
      tryAction,
    ],
  );

  const handleCancelBooking = useCallback(async () => {
    const save = getSave();
    if (save === null) return;
    await tryAction("startDate", async () => {
      await persist(clearActiveBooking(save));
    });
  }, [getSave, persist, tryAction]);

  const handleConfirmOnboarding = useCallback(
    async (payload: {
      focusedMemberIds: string[];
      scenarioDeckCardIds: string[];
    }): Promise<boolean> => {
      const save = getSave();
      if (save === null) return false;
      // Gate the warp animation on validation success. The previous version
      // fired the warp unconditionally and could leave the player staring at a
      // finished animation with no room transition when
      // completeInitialOnboarding threw on a bad payload.
      return tryAction("focusCase", async () => {
        const withBudgetPeriod = completeInitialOnboarding({
          save,
          focusedMemberIds: payload.focusedMemberIds,
          scenarioDeckCardIds: payload.scenarioDeckCardIds,
          scenarios: starterScenarios,
          memberRequests,
          companyGoals,
        });
        await persist(withBudgetPeriod);
      });
    },
    [getSave, persist, tryAction],
  );

  const handleAddFocus = useCallback(
    async (memberId: string) => {
      const save = getSave();
      if (save === null) return;
      await tryAction("focusCase", async () => {
        await persist(focusAddCase(save, memberId));
        play("reveal");
      });
    },
    [getSave, persist, play, tryAction],
  );

  const handleRemoveFocus = useCallback(
    async (memberId: string) => {
      const save = getSave();
      if (save === null) return;
      await tryAction("focusCase", async () => {
        await persist(focusRemoveCase(save, memberId));
      });
    },
    [getSave, persist, tryAction],
  );

  const handleReselectFocus = useCallback(
    async (nextFocusIds: string[]) => {
      const save = getSave();
      if (save === null) return;
      const previousSave = save;
      await tryAction("focusCase", async () => {
        const nextSave = focusReselect(save, nextFocusIds);
        await persist(nextSave);
        processManagerQuipSaveDiff(previousSave, nextSave);
      });
    },
    [getSave, persist, processManagerQuipSaveDiff, tryAction],
  );

  const handleSwapShiftPartner = useCallback(
    async (input: {
      outgoingPartnerMemberId: string;
      incomingPartnerMemberId: string;
    }): Promise<boolean> => {
      const save = getSave();
      if (save === null) return false;
      return tryAction("partnerSwap", async () => {
        const nextSave = swapShiftPartner(save, input);
        await persist(nextSave);
        play("reveal");
      });
    },
    [getSave, persist, play, tryAction],
  );

  const handleCompleteShift = useCallback(async () => {
    const save = getSave();
    if (save === null) return;
    const previousSave = save;
    await tryAction("endShift", async () => {
      const result = completeShift(save);
      await persist(result.save);
      dispatchManagerQuip({ triggerKey: "shift.ended", surfaceKey: result.report.id });
      processManagerQuipSaveDiff(previousSave, result.save);
      play("report");
    });
  }, [dispatchManagerQuip, getSave, persist, play, processManagerQuipSaveDiff, tryAction]);

  const handleStartNextShift = useCallback(async () => {
    const save = getSave();
    if (save === null) return;
    const previousSave = save;
    await tryAction("nextShift", async () => {
      const { save: nextSave } = startNextShift(save);
      await persist(nextSave);
      dispatchManagerQuip({ triggerKey: "shift.started" });
      processManagerQuipSaveDiff(previousSave, nextSave);
    });
  }, [dispatchManagerQuip, getSave, persist, processManagerQuipSaveDiff, tryAction]);

  const handleAddDeckCard = useCallback(
    async (libraryCardId: string) => {
      const save = getSave();
      if (save === null) return;
      await tryAction("deck", async () => {
        const next = addCardToDeck({
          save,
          scenarios: starterScenarios,
          cardId: libraryCardId,
        });
        await persist(next);
      });
    },
    [getSave, persist, tryAction],
  );

  const handleRemoveDeckCard = useCallback(
    async (deckCardId: string) => {
      const save = getSave();
      if (save === null) return;
      await tryAction("deck", async () => {
        const next = removeCardFromDeck(save, deckCardId);
        await persist(next);
      });
    },
    [getSave, persist, tryAction],
  );

  const handleMarkSoftWinSeen = useCallback(async () => {
    const save = getSave();
    if (save === null) return;
    await tryAction("softWin", async () => {
      const next = markSoftWinSeen(save);
      await persist(next);
    });
  }, [getSave, persist, tryAction]);

  return {
    handleAddDeckCard,
    handleAddFocus,
    handleBeginDate,
    handleCancelBooking,
    handleCommitPair,
    handleCompleteShift,
    handleConfirmOnboarding,
    handleMarkSoftWinSeen,
    handleRemoveDeckCard,
    handleRemoveFocus,
    handleReselectFocus,
    handleStartNextShift,
    handleSwapShiftPartner,
  };
}
