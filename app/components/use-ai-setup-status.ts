import { useCallback, useEffect, useRef, useState } from "react";

import type { GameConfig } from "../domain/game";
import {
  readStoredGatewayApiKey,
  requestLocalAiStatus,
  storeGatewayApiKey,
} from "../services/ai/client";
import { errorToMessage } from "../services/utils";
import type { AiSetupStatus } from "./ai-setup-panel";

const CHECKING_LOCAL_AI_STATUS: AiSetupStatus = {
  status: "checking",
  message: "Checking AI provider. Cupid is holding the clipboard very still.",
  details: [],
};

/**
 * Owns AI setup status state and side effects:
 *
 *   - reads the OS-stored gateway API key on mount;
 *   - runs the AI-status check whenever the relevant config / key changes
 *     (provider, models, base URLs, setup-complete flag);
 *   - exposes `refreshLocalAiStatus` for in-flight rechecks (action handlers
 *     poke this before kicking the date engine);
 *   - exposes `applyGatewayApiKeyUpdate` for the AI setup panel's save flow.
 *
 * The hook coalesces concurrent `refreshLocalAiStatus` calls via a ref so
 * multiple handlers awaiting AI readiness don't fire overlapping checks.
 */
export function useAiSetupStatus({
  aiStatusConfig,
  setErrorMessage,
}: {
  aiStatusConfig: GameConfig | undefined;
  setErrorMessage: (message: string | null) => void;
}) {
  const [localAiStatus, setLocalAiStatus] = useState<AiSetupStatus>(CHECKING_LOCAL_AI_STATUS);
  const [gatewayApiKey, setGatewayApiKey] = useState("");
  const [gatewayApiKeyReadError, setGatewayApiKeyReadError] = useState<string | null>(null);
  const [isGatewayApiKeyLoaded, setIsGatewayApiKeyLoaded] = useState(false);
  const localAiStatusRequestRef = useRef<Promise<AiSetupStatus> | null>(null);

  // Read the OS-stored gateway key once on mount.
  useEffect(() => {
    let mounted = true;
    void (async () => {
      let stored = "";
      let readError: string | null = null;
      try {
        stored = await readStoredGatewayApiKey();
      } catch (error) {
        readError = errorToMessage(error) || "OS credential store operation failed.";
      }
      if (!mounted) return;
      setGatewayApiKey(stored);
      setGatewayApiKeyReadError(readError);
      setIsGatewayApiKeyLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // A stable key over the AI-relevant fields of config — re-running the
  // status checker on every save mutation would refire on unrelated game
  // state. Includes the gatewayApiKey through the effect's dep list below.
  const aiStatusConfigKey =
    aiStatusConfig === undefined
      ? ""
      : [
          aiStatusConfig.aiProvider,
          aiStatusConfig.chatModel,
          aiStatusConfig.embeddingModel,
          aiStatusConfig.reasoningLevel,
          aiStatusConfig.ollamaBaseURL,
          aiStatusConfig.gatewayBaseURL,
          aiStatusConfig.aiSetupComplete ? "complete" : "incomplete",
        ].join("|");

  useEffect(() => {
    if (aiStatusConfig === undefined || !isGatewayApiKeyLoaded) {
      return;
    }
    const configForStatus = aiStatusConfig;
    if (configForStatus.aiProvider === "gateway" && gatewayApiKeyReadError !== null) {
      const message = `Gateway key storage unavailable. ${gatewayApiKeyReadError}`;
      setLocalAiStatus({
        status: "unavailable",
        message,
        details: [],
        checkedAt: new Date().toISOString(),
      });
      if (configForStatus.aiSetupComplete) {
        setErrorMessage(message);
      }
      return;
    }
    let mounted = true;
    async function loadStatus() {
      setLocalAiStatus(CHECKING_LOCAL_AI_STATUS);
      const status = await requestLocalAiStatus(configForStatus, gatewayApiKey);
      if (!mounted) return;
      setLocalAiStatus(status);
      if (status.status === "unavailable" && configForStatus.aiSetupComplete) {
        setErrorMessage(status.message);
      }
    }
    void loadStatus();
    return () => {
      mounted = false;
    };
    // aiStatusConfigKey is the stable signature; we only want this to fire
    // when the AI-relevant config fields change, not on every save mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiStatusConfigKey, gatewayApiKey, gatewayApiKeyReadError, isGatewayApiKeyLoaded]);

  const refreshLocalAiStatus = useCallback(
    async (
      config: GameConfig | undefined = aiStatusConfig,
      key: string = gatewayApiKey,
    ): Promise<AiSetupStatus> => {
      if (config === undefined) {
        return {
          status: "unavailable",
          message: "AI provider check needs a save file first.",
          details: [],
          checkedAt: new Date().toISOString(),
        };
      }
      if (localAiStatusRequestRef.current !== null) {
        return localAiStatusRequestRef.current;
      }
      setLocalAiStatus(CHECKING_LOCAL_AI_STATUS);
      const request = (async () => {
        try {
          const status = await requestLocalAiStatus(config, key);
          setLocalAiStatus(status);
          if (status.status === "unavailable") {
            setErrorMessage(status.message);
          }
          return status;
        } finally {
          localAiStatusRequestRef.current = null;
        }
      })();
      localAiStatusRequestRef.current = request;
      return request;
    },
    [aiStatusConfig, gatewayApiKey, setErrorMessage],
  );

  const applyGatewayApiKeyUpdate = useCallback(async (nextGatewayApiKey: string) => {
    await storeGatewayApiKey(nextGatewayApiKey);
    setGatewayApiKey(nextGatewayApiKey.trim());
    setGatewayApiKeyReadError(null);
    setIsGatewayApiKeyLoaded(true);
  }, []);

  return {
    localAiStatus,
    gatewayApiKey,
    refreshLocalAiStatus,
    applyGatewayApiKeyUpdate,
  };
}

export { CHECKING_LOCAL_AI_STATUS };
