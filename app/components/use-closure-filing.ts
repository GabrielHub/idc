import { useCallback, useState } from "react";

import type { GameSave } from "../domain/game";
import type { ManagerQuipTriggerKey } from "../fixtures/manager-quips";
import { closePair, type ReadyClosurePair } from "../services/closures";
import { generateClosureSummary } from "../services/closure-summary";
import { shouldFireSoftWinQuip } from "../services/manager-quips";
import { errorToMessage } from "../services/utils";
import type { AiSetupStatus } from "./ai-setup-panel";
import type { SfxCue } from "./sfx-provider";

export type ClosureFilingInput = {
  pairId: string;
  ready: ReadyClosurePair;
};

export function useClosureFiling({
  getSave,
  gatewayApiKey,
  refreshLocalAiStatus,
  runClosureAction,
  persist,
  dispatchManagerQuip,
  processManagerQuipSaveDiff,
  play,
  setIsAiSetupOpen,
  setErrorMessage,
}: {
  // Accessor over a ref so the hook reads the latest save inside the async
  // body — closing over the rendered `save` would let a stale snapshot be
  // applied after a multi-second LLM await, silently overwriting any state
  // change that landed during that window.
  getSave: () => GameSave | null;
  gatewayApiKey: string;
  refreshLocalAiStatus: () => Promise<AiSetupStatus>;
  runClosureAction: (run: () => Promise<void>) => Promise<boolean>;
  persist: (nextSave: GameSave) => Promise<void>;
  dispatchManagerQuip: (input: {
    triggerKey: ManagerQuipTriggerKey;
    surfaceKey?: string;
    bypassTutorialGate?: boolean;
  }) => void;
  processManagerQuipSaveDiff: (previousSave: GameSave, nextSave: GameSave) => void;
  play: (cue: SfxCue) => void;
  setIsAiSetupOpen: (open: boolean) => void;
  setErrorMessage: (message: string | null) => void;
}): {
  closureErrorMessage: string | null;
  handleClosePair: (input: ClosureFilingInput) => Promise<boolean>;
  resetClosureError: () => void;
} {
  const [closureErrorMessage, setClosureErrorMessage] = useState<string | null>(null);

  const resetClosureError = useCallback(() => {
    setClosureErrorMessage(null);
  }, []);

  const handleClosePair = useCallback(
    async (input: ClosureFilingInput): Promise<boolean> => {
      const initialSave = getSave();
      if (initialSave === null) return false;
      if (!initialSave.config.aiSetupComplete) {
        setIsAiSetupOpen(true);
        const message = "AI setup is required to file a closure summary.";
        setErrorMessage(message);
        setClosureErrorMessage(message);
        return false;
      }

      setClosureErrorMessage(null);
      return runClosureAction(async () => {
        try {
          const status = await refreshLocalAiStatus();
          if (status.status !== "ready") {
            throw new Error(status.message);
          }

          // Re-read save right before each external boundary so the LLM call
          // and the closePair / persist trio operate on the same up-to-date
          // snapshot. Save can mutate during the multi-second await (tutorial
          // step.complete, manager-quip history, etc.).
          const summarySave = getSave();
          if (summarySave === null) {
            throw new Error("Save cleared before closure summary could generate.");
          }
          const summary = await generateClosureSummary({
            save: summarySave,
            ready: input.ready,
            config: { ...summarySave.config, gatewayApiKey: gatewayApiKey || undefined },
          });
          const previousSave = getSave();
          if (previousSave === null) {
            throw new Error("Save cleared before closure could be filed.");
          }
          const nextSave = closePair({ save: previousSave, pairId: input.pairId, summary });
          await persist(nextSave);
          dispatchManagerQuip({
            triggerKey: "pair.closure.confirmed",
            surfaceKey: input.pairId,
            bypassTutorialGate: true,
          });
          if (shouldFireSoftWinQuip(nextSave.managerQuipHistory, nextSave.closureCount)) {
            dispatchManagerQuip({
              triggerKey: "campaign.closures.five",
              bypassTutorialGate: true,
            });
          }
          setClosureErrorMessage(null);
          processManagerQuipSaveDiff(previousSave, nextSave);
          play("report");
        } catch (error) {
          setClosureErrorMessage(errorToMessage(error));
          throw error;
        }
      });
    },
    [
      dispatchManagerQuip,
      gatewayApiKey,
      getSave,
      persist,
      play,
      processManagerQuipSaveDiff,
      refreshLocalAiStatus,
      runClosureAction,
      setErrorMessage,
      setIsAiSetupOpen,
    ],
  );

  return { closureErrorMessage, handleClosePair, resetClosureError };
}
