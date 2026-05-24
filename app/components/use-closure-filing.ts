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
  save,
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
  save: GameSave | null;
  gatewayApiKey: string;
  refreshLocalAiStatus: () => Promise<AiSetupStatus>;
  runClosureAction: (run: () => Promise<void>) => Promise<boolean>;
  persist: (nextSave: GameSave) => Promise<void>;
  dispatchManagerQuip: (input: { triggerKey: ManagerQuipTriggerKey; surfaceKey?: string }) => void;
  processManagerQuipSaveDiff: (previousSave: GameSave, nextSave: GameSave) => void;
  play: (cue: SfxCue) => void;
  setIsAiSetupOpen: (open: boolean) => void;
  setErrorMessage: (message: string | null) => void;
}): {
  closureErrorMessage: string | null;
  handleClosePair: (input: ClosureFilingInput) => Promise<boolean>;
} {
  const [closureErrorMessage, setClosureErrorMessage] = useState<string | null>(null);

  const handleClosePair = useCallback(
    async (input: ClosureFilingInput): Promise<boolean> => {
      if (save === null) return false;
      if (!save.config.aiSetupComplete) {
        setIsAiSetupOpen(true);
        const message = "AI setup is required to file a closure summary.";
        setErrorMessage(message);
        setClosureErrorMessage(message);
        return false;
      }

      const previousSave = save;
      setClosureErrorMessage(null);
      return runClosureAction(async () => {
        try {
          const status = await refreshLocalAiStatus();
          if (status.status !== "ready") {
            throw new Error(status.message);
          }

          const summary = await generateClosureSummary({
            save,
            ready: input.ready,
            config: { ...save.config, gatewayApiKey: gatewayApiKey || undefined },
          });
          const nextSave = closePair({ save, pairId: input.pairId, summary });
          await persist(nextSave);
          dispatchManagerQuip({
            triggerKey: "pair.closure.confirmed",
            surfaceKey: input.pairId,
          });
          if (shouldFireSoftWinQuip(nextSave.managerQuipHistory, nextSave.closureCount)) {
            dispatchManagerQuip({ triggerKey: "campaign.closures.five" });
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
      persist,
      play,
      processManagerQuipSaveDiff,
      refreshLocalAiStatus,
      runClosureAction,
      save,
      setErrorMessage,
      setIsAiSetupOpen,
    ],
  );

  return { closureErrorMessage, handleClosePair };
}
