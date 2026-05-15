import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { AiProvider, AiReasoningLevel, GameConfig } from "../domain/game";
import {
  areAiProviderBaseUrlsLockedForRuntime,
  lockAiProviderBaseUrlsForRuntime,
} from "../platform/runtime";
import {
  OLLAMA_CHAT_MODEL_OPTIONS,
  gatewayReasoningSupported,
  modelDefaultsForProvider,
  recommendedOllamaChatModels,
  recommendedOllamaEmbeddings,
  type OllamaModelSummary,
} from "../services/ai/model-catalog";
import { listOllamaModelInventory } from "../services/ai/model-service";
import { errorToMessage } from "../services/utils";
import { KeyValue, SetupFeedback, uniqueModelOptions } from "./ai-setup-panel-atoms";
import { providerTrustBoundaryItems } from "./ai-setup-panel-copy";
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

type ProviderInfo = {
  route: string;
  label: string;
  tagline: string;
};

const PROVIDER_INFO: Record<AiProvider, ProviderInfo> = {
  ollama: {
    route: "Local",
    label: "Ollama local",
    tagline: "Private route. Date simulation stays on this machine.",
  },
  gateway: {
    route: "Cloud",
    label: "Vercel AI Gateway",
    tagline: "Cloud route. Cupid sends date context to the selected provider.",
  },
};

const DRAFT_PENDING_STATUS: AiSetupStatus = {
  status: "checking",
  message: "Settings changed. Save and verify before Cupid trusts this desk.",
  details: [],
};

const STATUS_TONE: Record<
  AiSetupStatus["status"],
  { dot: "emerald" | "amber" | "rose"; badge: string; ring: string }
> = {
  ready: { dot: "emerald", badge: "ready", ring: "ring-emerald-300/40" },
  checking: { dot: "amber", badge: "checking", ring: "ring-amber-300/40" },
  unavailable: { dot: "rose", badge: "offline", ring: "ring-rose-300/40" },
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
  const [draftGatewayKey, setDraftGatewayKey] = useState(gatewayApiKey);
  const [activeProvider, setActiveProvider] = useState<AiProvider>(config.aiProvider);
  const [ollamaModels, setOllamaModels] = useState<OllamaModelSummary[]>([]);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const isProviderUrlLocked = areAiProviderBaseUrlsLockedForRuntime();
  const footerCopy = footerCopyFor(activeProvider, isProviderUrlLocked);

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
    setDraftGatewayKey(gatewayApiKey);
  }, [gatewayApiKey]);

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
  const gatewayReasoningDisabled =
    draftConfig.aiProvider === "gateway" && !gatewayReasoningSupported(draftConfig.chatModel);
  const verifiedConfig = useMemo(() => lockAiProviderBaseUrlsForRuntime(config), [config]);
  const draftStatusMatchesVerifiedConfig = useMemo(() => {
    const activeDraftConfig = lockAiProviderBaseUrlsForRuntime({
      ...draftConfig,
      aiProvider: activeProvider,
    });
    const configMatches =
      activeDraftConfig.aiProvider === verifiedConfig.aiProvider &&
      activeDraftConfig.ollamaBaseURL === verifiedConfig.ollamaBaseURL &&
      activeDraftConfig.gatewayBaseURL === verifiedConfig.gatewayBaseURL &&
      activeDraftConfig.chatModel === verifiedConfig.chatModel &&
      activeDraftConfig.embeddingModel === verifiedConfig.embeddingModel &&
      activeDraftConfig.reasoningLevel === verifiedConfig.reasoningLevel;
    const keyMatches =
      activeProvider !== "gateway" || draftGatewayKey.trim() === gatewayApiKey.trim();

    return configMatches && keyMatches;
  }, [activeProvider, draftConfig, draftGatewayKey, gatewayApiKey, verifiedConfig]);
  const displayedStatus = draftStatusMatchesVerifiedConfig ? status : DRAFT_PENDING_STATUS;

  function updateDraft(nextConfig: Partial<GameConfig>) {
    setDraftConfig((current) => ({
      ...current,
      ...nextConfig,
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
      const pendingConfig = {
        ...lockAiProviderBaseUrlsForRuntime(draftConfig),
        aiProvider: activeProvider,
        aiSetupComplete: false,
      };
      await onSave(pendingConfig, draftGatewayKey);
      const checkedStatus = await onCheck(pendingConfig, draftGatewayKey);

      if (checkedStatus.status !== "ready") {
        setSaveHint(
          "Saved, but the provider check did not return ready. Fix the issue above and click Verify.",
        );
        return;
      }

      const completeConfig = {
        ...pendingConfig,
        aiSetupComplete: true,
      };
      setDraftConfig(completeConfig);
      await onSave(completeConfig, draftGatewayKey);
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
      await onCheck(
        lockAiProviderBaseUrlsForRuntime({
          ...draftConfig,
          aiProvider: activeProvider,
        }),
        draftGatewayKey,
      );
    } finally {
      setIsVerifying(false);
    }
  }

  const busy = isActionPending || isSaving || isVerifying;
  const formSerial = required ? "form 04-a // required intake" : "form 04-a // ai provisioning";

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
      aria-label="AI desk setup"
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
        className="aura-glass-strong relative mx-auto w-full max-w-[88rem] rounded-card p-5 shadow-card lg:p-8"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-aura-hairline pb-6">
          <div className="max-w-2xl space-y-3">
            <MutedLabel>{formSerial}</MutedLabel>
            <h2 className="font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
              Provision an AI desk.
            </h2>
            <p className="text-body leading-relaxed text-aura-muted">
              Pick one provider. Cupid will not book a date until the desk is staffed, verified, and
              clear about where date data goes.
            </p>
          </div>
          <ChromeButton onClick={onClose}>Close</ChromeButton>
        </header>

        <ProviderRouter
          activeProvider={activeProvider}
          defaultProvider={isProviderUrlLocked ? "gateway" : "ollama"}
          defaultLabel={isProviderUrlLocked ? "desktop default" : "web default"}
          onSelect={selectProvider}
        />

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">
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
                gatewayApiKey={draftGatewayKey}
                reasoningDisabled={gatewayReasoningDisabled}
                isUrlLocked={isProviderUrlLocked}
                isSaving={isSaving}
                isVerifying={isVerifying}
                busy={busy}
                saveError={saveError}
                saveHint={saveHint}
                onConfig={updateDraft}
                onGatewayApiKey={setDraftGatewayKey}
                onSaveAndCheck={saveAndCheck}
                onVerify={verifyOnly}
              />
            )}
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <StatusCard
              status={displayedStatus}
              provider={activeProvider}
              chatModel={draftConfig.chatModel}
              embeddingModel={draftConfig.embeddingModel}
              reasoningLevel={draftConfig.reasoningLevel}
              isUrlLocked={isProviderUrlLocked}
            />
          </aside>
        </div>

        {activeProvider === "ollama" ? (
          <SetupFeedback className="mt-6" saveError={saveError} saveHint={saveHint} />
        ) : null}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-aura-hairline pt-5">
          <p className="max-w-2xl text-label leading-relaxed text-aura-muted">{footerCopy}</p>
          {activeProvider === "ollama" ? (
            <div className="flex flex-wrap gap-2">
              <GhostButton disabled={busy} onClick={() => void verifyOnly()}>
                {isVerifying ? "Verifying" : "Verify"}
              </GhostButton>
              <PrimaryButton disabled={busy} onClick={saveAndCheck}>
                {isSaving ? "Verifying" : "Save and verify"}
              </PrimaryButton>
            </div>
          ) : null}
        </footer>
      </motion.section>
    </motion.div>,
    document.body,
  );
}

function ProviderRouter({
  activeProvider,
  defaultProvider,
  defaultLabel,
  onSelect,
}: {
  activeProvider: AiProvider;
  defaultProvider: AiProvider;
  defaultLabel: string;
  onSelect: (provider: AiProvider) => void;
}) {
  const selectedProvider = PROVIDER_INFO[activeProvider];

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-aura-hairline bg-white/35 p-2">
      <div className="px-2 py-1">
        <MutedLabel>routing slip</MutedLabel>
        <p className="mt-1 text-label leading-relaxed text-aura-muted">
          Current desk:{" "}
          <span className="font-semibold text-aura-ink">{selectedProvider.label}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROVIDER_INFO) as AiProvider[]).map((provider) => (
          <ProviderCard
            key={provider}
            provider={provider}
            isActive={provider === activeProvider}
            badge={
              provider === activeProvider
                ? "active"
                : provider === defaultProvider
                  ? defaultLabel
                  : "option"
            }
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function ProviderCard({
  provider,
  isActive,
  badge,
  onSelect,
}: {
  provider: AiProvider;
  isActive: boolean;
  badge: string;
  onSelect: (provider: AiProvider) => void;
}) {
  const info = PROVIDER_INFO[provider];
  const surface = isActive
    ? "border-aura-rose/45 bg-aura-rose/15 text-aura-ink shadow-quiet ring-1 ring-aura-rose/25"
    : "bg-aura-card text-aura-muted hover:bg-aura-veil hover:text-aura-ink";

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(provider)}
      className={`group flex cursor-pointer items-center gap-3 rounded-pill border border-aura-hairline px-4 py-2 text-left transition ${surface}`}
    >
      <span className="font-display text-body font-semibold tracking-tight">{info.label}</span>
      <span
        className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${
          isActive ? "text-aura-rose" : "text-aura-faint"
        }`}
      >
        {badge}
      </span>
    </button>
  );
}

function StatusCard({
  status,
  provider,
  chatModel,
  embeddingModel,
  reasoningLevel,
  isUrlLocked,
}: {
  status: AiSetupStatus;
  provider: AiProvider;
  chatModel: string;
  embeddingModel: string;
  reasoningLevel: AiReasoningLevel;
  isUrlLocked: boolean;
}) {
  const tone = STATUS_TONE[status.status];
  const checkedAtLabel =
    status.checkedAt === undefined ? "" : new Date(status.checkedAt).toLocaleTimeString();
  const showDetails = status.status !== "ready" && status.details.length > 0;
  const trustBoundaryItems = providerTrustBoundaryItems(provider, isUrlLocked);

  return (
    <div className={`aura-glass rounded-card p-4 ring-1 ${tone.ring}`}>
      <div className="flex items-center justify-between gap-3">
        <MutedLabel>provider status</MutedLabel>
        <span className="inline-flex items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink">
          <LiveDot tone={tone.dot} />
          {tone.badge}
        </span>
      </div>
      <p className="mt-3 text-label leading-relaxed text-aura-ink">{status.message}</p>
      {showDetails ? (
        <ul className="mt-3 space-y-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-muted">
          {status.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      {checkedAtLabel === "" ? null : (
        <p className="mt-3 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          checked :: <span className="text-aura-ink">{checkedAtLabel}</span>
        </p>
      )}
      <dl className="mt-4 space-y-2 border-t border-aura-hairline pt-3">
        <KeyValue label="provider" value={provider} />
        <KeyValue label="chat" value={chatModel} />
        <KeyValue label="embedding" value={embeddingModel} />
        <KeyValue label="reasoning" value={reasoningLevel} />
      </dl>
      <div className="mt-4 border-t border-aura-hairline pt-3">
        <MutedLabel>trust boundary</MutedLabel>
        <ul className="mt-3 divide-y divide-aura-hairline">
          {trustBoundaryItems.map((item) => (
            <li key={item.label} className="py-2 first:pt-0 last:pb-0">
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                {item.label}
              </p>
              <p className="mt-1 text-label leading-relaxed text-aura-ink">{item.value}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function footerCopyFor(provider: AiProvider, isUrlLocked: boolean): string {
  if (provider === "gateway") {
    return isUrlLocked
      ? "Desktop stores the Gateway key as plaintext in app local data outside saves. Saving a blank key removes it. Gateway sends date prompts, context, transcripts, and retrieved memories off this device."
      : "Browser dev stores the Gateway key in localStorage. Gateway sends date prompts, context, transcripts, and retrieved memories off this device.";
  }
  return isUrlLocked
    ? "Ollama route keeps date data local. Desktop builds talk only to localhost Ollama."
    : "Ollama route keeps date data local to the configured endpoint.";
}
