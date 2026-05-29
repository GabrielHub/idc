import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { AiProvider, GameConfig } from "../domain/game";
import {
  areAiProviderBaseUrlsLockedForRuntime,
  lockAiProviderBaseUrlsForRuntime,
} from "../platform/runtime";
import {
  OLLAMA_CHAT_MODEL_OPTIONS,
  gatewayLockedReasoningLevelForModel,
  modelDefaultsForProvider,
  recommendedOllamaChatModels,
  recommendedOllamaEmbeddings,
  type OllamaModelSummary,
} from "../services/ai/model-catalog";
import { listOllamaModelInventory } from "../services/ai/model-service";
import { errorToMessage } from "../services/utils";
import { SetupFeedback, uniqueModelOptions } from "./ai-setup-panel-atoms";
import { dataDestination, routeSummary } from "./ai-setup-panel-copy";
import { GatewaySetupTab, OllamaSetupTab } from "./ai-setup-panel-tabs";
import {
  ChromeButton,
  EASE_OUT_QUART,
  GhostButton,
  LiveDot,
  MutedLabel,
  PrimaryButton,
} from "./dashboard-atoms";

export type AiSetupStatus = {
  status: "checking" | "ready" | "unavailable";
  message: string;
  details: string[];
  checkedAt?: string;
};

const DRAFT_PENDING_STATUS: AiSetupStatus = {
  status: "checking",
  message: "Settings changed. Save and verify before Cupid uses this connection.",
  details: [],
};

/**
 * Shown before the player has finished AI setup. A fresh save defaults to
 * Ollama, so both the splash readiness probe and the in-app status hook skip the
 * provider check until `aiSetupComplete` flips — surfacing this instead of
 * firing failing localhost:11434 requests at players who never opted in.
 */
export const AI_NOT_CONFIGURED_STATUS: AiSetupStatus = {
  status: "unavailable",
  message: "AI provider not set up yet. Configure one before your first date.",
  details: [],
};

const STATUS_TONE: Record<
  AiSetupStatus["status"],
  { dot: "emerald" | "amber" | "rose"; label: string; ring: string }
> = {
  ready: { dot: "emerald", label: "Connected", ring: "ring-emerald-300/40" },
  checking: { dot: "amber", label: "Checking", ring: "ring-amber-300/40" },
  unavailable: { dot: "rose", label: "Not connected", ring: "ring-rose-300/40" },
};

export function AiSetupPanel({
  config,
  gatewayApiKey,
  status,
  required,
  isActionPending,
  onSave,
  onCheck,
  onClose,
}: {
  config: GameConfig;
  gatewayApiKey: string;
  status: AiSetupStatus;
  required: boolean;
  isActionPending: boolean;
  onSave: (config: GameConfig, gatewayApiKey: string) => Promise<void>;
  onCheck: (config: GameConfig, gatewayApiKey: string) => Promise<AiSetupStatus>;
  onClose: () => void;
}) {
  const [draftConfig, setDraftConfig] = useState<GameConfig>(config);
  const [pastedGatewayKey, setPastedGatewayKey] = useState("");
  const [activeProvider, setActiveProvider] = useState<AiProvider>(config.aiProvider);
  const [ollamaModels, setOllamaModels] = useState<OllamaModelSummary[]>([]);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const isProviderUrlLocked = areAiProviderBaseUrlsLockedForRuntime();

  useEffect(() => {
    if (!isProviderUrlLocked) {
      return;
    }

    setDraftConfig((current) => {
      const lockedConfig = lockAiProviderBaseUrlsForRuntime(current);

      if (
        current.ollamaBaseURL === lockedConfig.ollamaBaseURL &&
        current.gatewayBaseURL === lockedConfig.gatewayBaseURL
      ) {
        return current;
      }

      return lockedConfig;
    });
  }, [isProviderUrlLocked]);

  useEffect(() => {
    setDraftConfig(config);
    setActiveProvider(config.aiProvider);
  }, [config]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const ollamaChatModels = useMemo(
    () =>
      uniqueModelOptions([
        ...recommendedOllamaChatModels(ollamaModels),
        ...OLLAMA_CHAT_MODEL_OPTIONS,
      ]),
    [ollamaModels],
  );
  const ollamaEmbeddingModels = useMemo(
    () => recommendedOllamaEmbeddings(ollamaModels),
    [ollamaModels],
  );
  const verifiedConfig = useMemo(() => lockAiProviderBaseUrlsForRuntime(config), [config]);
  const draftStatusMatchesVerifiedConfig = useMemo(() => {
    const activeDraftConfig = lockAiProviderBaseUrlsForRuntime({
      ...draftConfig,
      aiProvider: activeProvider,
      reasoningLevel:
        activeProvider === "gateway"
          ? gatewayLockedReasoningLevelForModel(draftConfig.chatModel)
          : draftConfig.reasoningLevel,
    });
    const configMatches =
      activeDraftConfig.aiProvider === verifiedConfig.aiProvider &&
      activeDraftConfig.ollamaBaseURL === verifiedConfig.ollamaBaseURL &&
      activeDraftConfig.gatewayBaseURL === verifiedConfig.gatewayBaseURL &&
      activeDraftConfig.chatModel === verifiedConfig.chatModel &&
      activeDraftConfig.embeddingModel === verifiedConfig.embeddingModel &&
      activeDraftConfig.reasoningLevel === verifiedConfig.reasoningLevel;
    const keyMatches = activeProvider !== "gateway" || pastedGatewayKey.trim().length === 0;

    return configMatches && keyMatches;
  }, [activeProvider, draftConfig, pastedGatewayKey, verifiedConfig]);
  const displayedStatus = draftStatusMatchesVerifiedConfig ? status : DRAFT_PENDING_STATUS;
  const hasStoredGatewayKey = gatewayApiKey.trim().length > 0;

  function updateDraft(nextConfig: Partial<GameConfig>) {
    setDraftConfig((current) => ({
      ...current,
      ...nextConfig,
      reasoningLevel:
        (nextConfig.aiProvider ?? current.aiProvider) === "gateway"
          ? gatewayLockedReasoningLevelForModel(nextConfig.chatModel ?? current.chatModel)
          : (nextConfig.reasoningLevel ?? current.reasoningLevel),
    }));
  }

  function selectProvider(provider: AiProvider) {
    const defaults = modelDefaultsForProvider(provider);
    setActiveProvider(provider);
    setDraftConfig((current) => ({
      ...current,
      ...defaults,
      aiSetupComplete: false,
    }));
  }

  function activeRuntimeConfig(aiSetupComplete = draftConfig.aiSetupComplete): GameConfig {
    return {
      ...lockAiProviderBaseUrlsForRuntime(draftConfig),
      aiProvider: activeProvider,
      reasoningLevel:
        activeProvider === "gateway"
          ? gatewayLockedReasoningLevelForModel(draftConfig.chatModel)
          : draftConfig.reasoningLevel,
      aiSetupComplete,
    };
  }

  async function scanOllama() {
    setIsScanning(true);
    setOllamaError(null);

    try {
      const inventory = await listOllamaModelInventory({
        ollamaBaseURL: draftConfig.ollamaBaseURL,
      });
      setOllamaModels(inventory.models);
    } catch (error) {
      setOllamaModels([]);
      setOllamaError(errorToMessage(error));
    } finally {
      setIsScanning(false);
    }
  }

  async function saveAndCheck() {
    if (isSaving || isVerifying) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveHint(null);

    try {
      const pendingConfig = activeRuntimeConfig(false);
      const effectiveKey = effectiveGatewayKey();

      await onSave(pendingConfig, effectiveKey);
      const checkedStatus = await onCheck(pendingConfig, effectiveKey);

      if (checkedStatus.status !== "ready") {
        setSaveHint(
          "Saved, but the connection check did not return ready. Fix the issue above and try again.",
        );
        return;
      }

      const completeConfig = {
        ...pendingConfig,
        aiSetupComplete: true,
      };
      setDraftConfig(completeConfig);
      await onSave(completeConfig, effectiveKey);
      onClose();
    } catch (error) {
      setSaveError(errorToMessage(error) || "Cupid could not save the AI setup.");
    } finally {
      setIsSaving(false);
    }
  }

  async function verifyOnly() {
    if (isVerifying || isSaving) {
      return;
    }

    setIsVerifying(true);
    try {
      await onCheck(activeRuntimeConfig(), effectiveGatewayKey());
    } finally {
      setIsVerifying(false);
    }
  }

  async function clearStoredGatewayKey() {
    if (isSaving || isVerifying) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveHint(null);

    try {
      const pendingConfig = activeRuntimeConfig(false);

      await onSave(pendingConfig, "");
      setDraftConfig(pendingConfig);
      setPastedGatewayKey("");
      setSaveHint("Saved key removed. Paste a new one to use the cloud route again.");
    } catch (error) {
      setSaveError(errorToMessage(error) || "Cupid could not remove the saved key.");
    } finally {
      setIsSaving(false);
    }
  }

  function effectiveGatewayKey(): string {
    return pastedGatewayKey.trim().length > 0 ? pastedGatewayKey : gatewayApiKey;
  }

  const busy = isActionPending || isSaving || isVerifying;
  const eyebrow = required ? "// ai setup required" : "// ai setup";

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
      role="dialog"
      aria-modal="true"
      aria-label="AI setup"
      onClick={onClose}
      className="fixed inset-0 z-[60] overflow-y-auto bg-aura-ink/45 px-4 py-6 backdrop-blur-xl lg:px-6"
    >
      <motion.section
        layout
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
        onClick={(event) => event.stopPropagation()}
        className="aura-glass-strong relative mx-auto w-full max-w-7xl rounded-card p-5 shadow-card lg:p-6"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-aura-hairline pb-4">
          <div className="max-w-2xl space-y-1.5">
            <MutedLabel>{eyebrow}</MutedLabel>
            <h2 className="font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
              Connect Cupid to an AI.
            </h2>
            <p className="text-label leading-relaxed text-aura-muted">
              Pick where dates run. Cupid checks the connection before the first date.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={displayedStatus} />
            <ChromeButton onClick={onClose}>Close</ChromeButton>
          </div>
        </header>

        <RouteChooser activeProvider={activeProvider} onSelect={selectProvider} />

        <div className="mt-4 space-y-4">
          {activeProvider === "ollama" ? (
            <OllamaSetupTab
              config={draftConfig}
              chatModels={ollamaChatModels}
              embeddingModels={ollamaEmbeddingModels}
              isScanning={isScanning}
              error={ollamaError}
              isUrlLocked={isProviderUrlLocked}
              onScan={scanOllama}
              onConfig={updateDraft}
            />
          ) : (
            <GatewaySetupTab
              config={draftConfig}
              pastedGatewayKey={pastedGatewayKey}
              hasStoredGatewayKey={hasStoredGatewayKey}
              isUrlLocked={isProviderUrlLocked}
              isSaving={isSaving}
              isVerifying={isVerifying}
              busy={busy}
              saveError={saveError}
              saveHint={saveHint}
              onConfig={updateDraft}
              onPastedGatewayKey={setPastedGatewayKey}
              onClearGatewayApiKey={clearStoredGatewayKey}
              onSaveAndCheck={saveAndCheck}
              onVerify={verifyOnly}
            />
          )}
        </div>

        {activeProvider === "ollama" ? (
          <SetupFeedback className="mt-4" saveError={saveError} saveHint={saveHint} />
        ) : null}

        <StatusDetails status={displayedStatus} />

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-aura-hairline pt-4">
          <p className="max-w-md text-label leading-relaxed text-aura-muted">
            {dataDestination(activeProvider)}
          </p>
          {activeProvider === "ollama" ? (
            <div className="flex flex-wrap gap-2">
              <GhostButton disabled={busy} onClick={() => void verifyOnly()}>
                {isVerifying ? "Checking" : "Check connection"}
              </GhostButton>
              <PrimaryButton disabled={busy} onClick={saveAndCheck}>
                {isSaving ? "Saving" : "Save and connect"}
              </PrimaryButton>
            </div>
          ) : null}
        </footer>
      </motion.section>
    </motion.div>,
    document.body,
  );
}

function RouteChooser({
  activeProvider,
  onSelect,
}: {
  activeProvider: AiProvider;
  onSelect: (provider: AiProvider) => void;
}) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {(["ollama", "gateway"] as const).map((provider) => (
        <RouteOption
          key={provider}
          provider={provider}
          isActive={provider === activeProvider}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function RouteOption({
  provider,
  isActive,
  onSelect,
}: {
  provider: AiProvider;
  isActive: boolean;
  onSelect: (provider: AiProvider) => void;
}) {
  const summary = routeSummary(provider);
  const surface = isActive
    ? "border-aura-rose/45 bg-aura-rose/12 shadow-quiet ring-1 ring-aura-rose/25"
    : "border-aura-hairline bg-white/55 hover:border-aura-rose/30 hover:bg-white/75";

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(provider)}
      className={`group flex cursor-pointer items-center justify-between gap-4 rounded-card border p-4 text-left transition ${surface}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
            {summary.title}
          </p>
          {isActive ? (
            <span className="rounded-pill bg-aura-rose/15 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
              selected
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-label leading-relaxed text-aura-muted">{summary.privacy}</p>
      </div>
      <span className="shrink-0 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        {summary.cost}
      </span>
    </button>
  );
}

function StatusPill({ status }: { status: AiSetupStatus }) {
  const tone = STATUS_TONE[status.status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill bg-white/65 px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink ring-1 ${tone.ring}`}
    >
      <LiveDot tone={tone.dot} />
      {tone.label}
    </span>
  );
}

function StatusDetails({ status }: { status: AiSetupStatus }) {
  if (status.status === "ready") {
    return null;
  }

  const checkedAtLabel =
    status.checkedAt === undefined ? "" : new Date(status.checkedAt).toLocaleTimeString();
  const tone = STATUS_TONE[status.status];

  return (
    <div
      className={`mt-4 rounded-card border border-aura-hairline bg-white/55 p-3 ring-1 ${tone.ring}`}
    >
      <p className="text-label leading-relaxed text-aura-ink">{status.message}</p>
      {status.details.length > 0 ? (
        <ul className="mt-3 space-y-1 text-label leading-relaxed text-aura-muted">
          {status.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      {checkedAtLabel === "" ? null : (
        <p className="mt-3 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          last checked :: <span className="text-aura-ink">{checkedAtLabel}</span>
        </p>
      )}
    </div>
  );
}
