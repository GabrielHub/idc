import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  DEFAULT_GATEWAY_EMBEDDING_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  type AiProvider,
  type AiReasoningLevel,
  type GameConfig,
} from "../domain/game";
import {
  areAiProviderBaseUrlsLockedForRuntime,
  lockAiProviderBaseUrlsForRuntime,
} from "../platform/runtime";
import {
  GATEWAY_CHAT_MODELS,
  GATEWAY_REASONING_LEVEL_OPTIONS,
  GPU_RECOMMENDATION_PROFILES,
  OLLAMA_CHAT_MODEL_OPTIONS,
  OLLAMA_REASONING_LEVEL_OPTIONS,
  gatewayReasoningSupported,
  modelDefaultsForProvider,
  recommendedOllamaChatModels,
  recommendedOllamaEmbeddings,
  type OllamaModelSummary,
} from "../services/ai/model-catalog";
import { listOllamaModelInventory } from "../services/ai/model-service";
import { errorToMessage } from "../services/utils";
import {
  ChromeButton,
  EASE_OUT_QUART,
  GhostButton,
  LiveDot,
  MutedLabel,
  PrimaryButton,
  SelectInput,
} from "./dashboard-atoms";

export type AiSetupStatus = {
  status: "checking" | "ready" | "unavailable";
  message: string;
  details: string[];
  checkedAt?: string;
};

const PROVIDER_INFO: Record<AiProvider, { route: string; label: string; tagline: string }> = {
  ollama: {
    route: "Local",
    label: "Ollama on this PC",
    tagline: "Stays on the workstation. No keys, no network.",
  },
  gateway: {
    route: "Cloud",
    label: "Vercel AI Gateway",
    tagline: "DeepSeek, Gemini, Claude, Kimi. Sends prompts off this machine.",
  },
};

const DRAFT_PENDING_STATUS: AiSetupStatus = {
  status: "checking",
  message: "Settings changed. Save and verify before Cupid trusts this desk.",
  details: [],
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
  const keyStorageCopy = isProviderUrlLocked
    ? "Desktop stores Gateway keys as a plaintext file in app local data, separate from saves. It is not encrypted and not in the OS keychain. Wiping a save leaves the key on this device."
    : "Browser dev stores Gateway keys in localStorage. Game saves do not contain them.";

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
  const activeGatewayModel = GATEWAY_CHAT_MODELS.find(
    (model) => model.id === draftConfig.chatModel,
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
      await onCheck(draftConfig, draftGatewayKey);
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
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div aria-hidden className="absolute inset-0 bg-aura-bg" />
      <ModalAmbientMesh />
      <div className="absolute inset-0 overflow-y-auto px-4 py-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
          className="aura-glass-strong relative mx-auto w-full max-w-5xl rounded-card p-6 shadow-card lg:p-10"
        >
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-aura-hairline pb-7">
            <div className="max-w-2xl space-y-3">
              <MutedLabel>{formSerial}</MutedLabel>
              <h2 className="font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
                Provision an AI desk.
              </h2>
              <p className="text-body leading-relaxed text-aura-muted">
                Pick one provider. Cupid will not book a date until the desk is staffed and the
                provider status reads ready.
              </p>
            </div>
            {required ? null : <ChromeButton onClick={onClose}>Close</ChromeButton>}
          </header>

          <ProviderRouter activeProvider={activeProvider} onSelect={selectProvider} />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
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
                  activeGatewayModelLabel={activeGatewayModel?.label ?? draftConfig.chatModel}
                  isUrlLocked={isProviderUrlLocked}
                  onConfig={updateDraft}
                  onGatewayApiKey={setDraftGatewayKey}
                />
              )}
            </div>

            <aside className="space-y-4">
              <StatusCard status={displayedStatus} />
              <ResolvedCard
                provider={activeProvider}
                chatModel={draftConfig.chatModel}
                embeddingModel={draftConfig.embeddingModel}
                reasoningLevel={draftConfig.reasoningLevel}
              />
            </aside>
          </div>

          {saveError === null ? null : (
            <p className="mt-6 rounded-tile border border-aura-rose/30 bg-rose-50/75 px-3 py-2 text-label leading-relaxed text-aura-rose">
              <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em]">
                save failed ::
              </span>{" "}
              {saveError}
            </p>
          )}
          {saveError === null && saveHint !== null ? (
            <p className="mt-6 rounded-tile border border-aura-amber/40 bg-aura-amber/10 px-3 py-2 text-label leading-relaxed text-aura-ink">
              <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-amber">
                pending ::
              </span>{" "}
              {saveHint}
            </p>
          ) : null}

          <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-aura-hairline pt-6">
            <p className="max-w-md text-label leading-relaxed text-aura-muted">{keyStorageCopy}</p>
            <div className="flex flex-wrap gap-2">
              <GhostButton disabled={busy} onClick={() => void verifyOnly()}>
                {isVerifying ? "Verifying" : "Verify"}
              </GhostButton>
              <PrimaryButton disabled={busy} onClick={saveAndCheck}>
                {isSaving ? "Verifying" : "Save and verify"}
              </PrimaryButton>
            </div>
          </footer>
        </motion.section>
      </div>
    </div>,
    document.body,
  );
}

/* ================================================================== */
/* Modal ambient mesh                                                 */
/* ================================================================== */

function ModalAmbientMesh() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-aura-mesh-rose/35 blur-[140px]" />
      <div className="absolute -bottom-24 right-0 h-[420px] w-[420px] rounded-full bg-aura-mesh-violet/35 blur-[140px]" />
    </div>
  );
}

/* ================================================================== */
/* Provider router                                                    */
/* ================================================================== */

function ProviderRouter({
  activeProvider,
  onSelect,
}: {
  activeProvider: AiProvider;
  onSelect: (provider: AiProvider) => void;
}) {
  return (
    <div className="mt-7 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <MutedLabel>routing slip</MutedLabel>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          1 / 2 selected
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(Object.keys(PROVIDER_INFO) as AiProvider[]).map((provider) => (
          <ProviderCard
            key={provider}
            provider={provider}
            isActive={provider === activeProvider}
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
  onSelect,
}: {
  provider: AiProvider;
  isActive: boolean;
  onSelect: (provider: AiProvider) => void;
}) {
  const info = PROVIDER_INFO[provider];
  const surface = isActive
    ? "aura-glass-ink border-transparent"
    : "aura-glass hover:-translate-y-0.5";

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(provider)}
      className={`group block cursor-pointer rounded-card p-5 text-left transition ${surface}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`font-mono text-micro font-semibold uppercase tracking-[0.28em] ${
            isActive ? "text-white/70" : "text-aura-faint"
          }`}
        >
          {info.route}
        </span>
        <span
          className={`font-mono text-micro font-semibold uppercase tracking-[0.24em] ${
            isActive ? "text-aura-rose" : "text-aura-faint"
          }`}
        >
          {isActive ? "active" : "idle"}
        </span>
      </div>
      <p
        className={`mt-3 font-display text-display-sm font-semibold tracking-tight ${
          isActive ? "text-white" : "text-aura-ink"
        }`}
      >
        {info.label}
      </p>
      <p
        className={`mt-2 text-label leading-relaxed ${
          isActive ? "text-white/72" : "text-aura-muted"
        }`}
      >
        {info.tagline}
      </p>
    </button>
  );
}

/* ================================================================== */
/* Ollama tab                                                         */
/* ================================================================== */

function OllamaSetupTab({
  config,
  chatModels,
  embeddingModels,
  isScanning,
  error,
  isUrlLocked,
  onScan,
  onConfig,
}: {
  config: GameConfig;
  chatModels: OllamaModelSummary[];
  embeddingModels: OllamaModelSummary[];
  isScanning: boolean;
  error: string | null;
  isUrlLocked: boolean;
  onScan: () => void;
  onConfig: (config: Partial<GameConfig>) => void;
}) {
  const embeddingLabel = embeddingModels.at(0)?.name ?? DEFAULT_OLLAMA_EMBEDDING_MODEL;
  const urlDescription = isUrlLocked
    ? "Desktop builds talk to localhost only. Other endpoints need a build with an updated HTTP scope."
    : "The Ollama server Cupid talks to. Defaults to localhost.";

  return (
    <div className="space-y-5">
      <FormSection label="endpoint" description={urlDescription}>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <TextInput
            label="ollama url"
            value={config.ollamaBaseURL}
            disabled={isUrlLocked}
            onChange={(value) => onConfig({ ollamaBaseURL: value })}
          />
          <GhostButton disabled={isScanning} onClick={onScan}>
            {isScanning ? "Scanning" : "Scan local desk"}
          </GhostButton>
        </div>
        <p className="mt-3 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          polls /api/tags and /api/ps
        </p>
        {error === null ? null : (
          <p className="mt-3 rounded-tile border border-aura-rose/25 bg-rose-50/75 px-3 py-2 text-label text-aura-rose">
            {error}
          </p>
        )}
      </FormSection>

      <FormSection
        label="model"
        description="Pick a chat model already pulled into Ollama. Embedding stays on embeddinggemma."
      >
        <SelectInput
          label="chat model"
          value={config.chatModel}
          options={chatModels.map((model) => ({
            value: model.name,
            label: model.running === true ? `${model.name} (running)` : model.name,
          }))}
          onChange={(value) =>
            onConfig({
              chatModel: value,
              embeddingModel: DEFAULT_OLLAMA_EMBEDDING_MODEL,
            })
          }
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectInput
            label="reasoning"
            value={config.reasoningLevel}
            options={OLLAMA_REASONING_LEVEL_OPTIONS}
            onChange={(value) => onConfig({ reasoningLevel: value })}
          />
          <ReadOnlyField label="embedding" value={embeddingLabel} />
        </div>
      </FormSection>

      <FormSection
        label="card recommendations"
        description="One-click chat picks per VRAM tier. Cupid swaps embedding to embeddinggemma."
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {GPU_RECOMMENDATION_PROFILES.map((profile) => (
            <li
              key={profile.id}
              className="aura-glass-lift rounded-card bg-white/65 p-4 ring-1 ring-aura-hairline"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-body font-semibold tracking-tight text-aura-ink">
                  {profile.label}
                </p>
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                  {profile.vram}
                </span>
              </div>
              <p className="mt-1.5 text-label leading-relaxed text-aura-muted">
                {profile.examples}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.modelIds.map((modelId) => (
                  <button
                    key={modelId}
                    type="button"
                    onClick={() =>
                      onConfig({
                        chatModel: modelId,
                        embeddingModel: DEFAULT_OLLAMA_EMBEDDING_MODEL,
                      })
                    }
                    className="cursor-pointer rounded-pill bg-aura-ink px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-aura-rose"
                  >
                    pick {modelId}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </FormSection>

      <FormSection
        label="first-time checklist"
        description="Walk this list on a fresh PC, then run a scan."
      >
        <ol className="grid gap-2 md:grid-cols-2">
          <ChecklistItem step={1} text="Install Ollama." />
          <ChecklistItem step={2} text="Open a terminal." />
          <ChecklistItem step={3} text="Pull a recommended chat model." />
          <ChecklistItem step={4} text="Pull embeddinggemma." />
          <ChecklistItem step={5} text="Keep Ollama running." />
          <ChecklistItem step={6} text="Return here. Click scan." />
        </ol>
      </FormSection>
    </div>
  );
}

/* ================================================================== */
/* Gateway tab                                                        */
/* ================================================================== */

function GatewaySetupTab({
  config,
  gatewayApiKey,
  reasoningDisabled,
  activeGatewayModelLabel,
  isUrlLocked,
  onConfig,
  onGatewayApiKey,
}: {
  config: GameConfig;
  gatewayApiKey: string;
  reasoningDisabled: boolean;
  activeGatewayModelLabel: string;
  isUrlLocked: boolean;
  onConfig: (config: Partial<GameConfig>) => void;
  onGatewayApiKey: (value: string) => void;
}) {
  const endpointDescription = isUrlLocked
    ? "Desktop uses the default Vercel AI Gateway URL. The key is stored as a plaintext file in app local data, outside saves."
    : "Browser dev uses this URL and stores the key in localStorage.";
  const keyPlaceholder = isUrlLocked
    ? "Stored as a plaintext file in app local data"
    : "Stored in browser localStorage for dev";
  const keyTrustCopy = isUrlLocked
    ? "The Gateway key is plaintext on disk under app local data. It is not encrypted and not in the OS keychain. Anyone with file access on this device can read it. Date prompts, character context, and transcripts are sent to the Gateway."
    : "Browser dev stores the key in localStorage. Date prompts, character context, and transcripts are sent to the Gateway.";

  return (
    <div className="space-y-5">
      <FormSection label="endpoint" description={endpointDescription}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="gateway url"
            value={config.gatewayBaseURL}
            disabled={isUrlLocked}
            onChange={(value) => onConfig({ gatewayBaseURL: value })}
          />
          <TextInput
            label="api key"
            type="password"
            value={gatewayApiKey}
            placeholder={keyPlaceholder}
            onChange={onGatewayApiKey}
          />
        </div>
        <p className="mt-3 rounded-tile border border-aura-amber/40 bg-aura-amber/10 px-3 py-2 text-label leading-relaxed text-aura-ink">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-amber">
            data flow ::
          </span>{" "}
          {keyTrustCopy}
        </p>
      </FormSection>

      <FormSection
        label="model"
        description="Pick a chat model. Gateway reasoning exposes the full effort set where the provider accepts it."
      >
        <SelectInput
          label="chat model"
          value={config.chatModel}
          options={GATEWAY_CHAT_MODELS.map((model) => ({ value: model.id, label: model.label }))}
          onChange={(value) => {
            const selectedModel = GATEWAY_CHAT_MODELS.find((model) => model.id === value);
            onConfig({
              chatModel: value,
              embeddingModel: DEFAULT_GATEWAY_EMBEDDING_MODEL,
              reasoningLevel: selectedModel?.recommendedReasoningLevel ?? "off",
            });
          }}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectInput
            label="reasoning"
            value={config.reasoningLevel}
            disabled={reasoningDisabled}
            options={GATEWAY_REASONING_LEVEL_OPTIONS}
            onChange={(value) => onConfig({ reasoningLevel: value })}
          />
          <ReadOnlyField label="embedding" value={DEFAULT_GATEWAY_EMBEDDING_MODEL} />
        </div>
      </FormSection>

      <p className="rounded-tile border border-aura-hairline bg-white/55 px-4 py-3 leading-relaxed">
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          active ::
        </span>{" "}
        <span className="font-display text-body font-semibold text-aura-ink">
          {activeGatewayModelLabel}
        </span>
      </p>
    </div>
  );
}

/* ================================================================== */
/* Sidebar cards                                                      */
/* ================================================================== */

function StatusCard({ status }: { status: AiSetupStatus }) {
  const tone =
    status.status === "ready"
      ? { dot: "emerald" as const, badge: "ready", ring: "ring-emerald-300/40" }
      : status.status === "checking"
        ? { dot: "amber" as const, badge: "checking", ring: "ring-amber-300/40" }
        : { dot: "rose" as const, badge: "offline", ring: "ring-rose-300/40" };
  const checkedAtLabel =
    status.checkedAt === undefined ? "" : new Date(status.checkedAt).toLocaleTimeString();

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
      {status.details.length === 0 ? null : (
        <ul className="mt-3 space-y-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-muted">
          {status.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
      {checkedAtLabel === "" ? null : (
        <p className="mt-3 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          checked :: <span className="text-aura-ink">{checkedAtLabel}</span>
        </p>
      )}
    </div>
  );
}

function ResolvedCard({
  provider,
  chatModel,
  embeddingModel,
  reasoningLevel,
}: {
  provider: AiProvider;
  chatModel: string;
  embeddingModel: string;
  reasoningLevel: AiReasoningLevel;
}) {
  return (
    <div className="rounded-card border border-aura-hairline bg-white/55 p-4">
      <MutedLabel>resolved</MutedLabel>
      <dl className="mt-3 space-y-2">
        <KeyValue label="provider" value={provider} />
        <KeyValue label="chat" value={chatModel} />
        <KeyValue label="embedding" value={embeddingModel} />
        <KeyValue label="reasoning" value={reasoningLevel} />
      </dl>
    </div>
  );
}

/* ================================================================== */
/* Layout helpers                                                     */
/* ================================================================== */

function FormSection({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-aura-hairline bg-white/45 p-5">
      <header className="space-y-1.5">
        <MutedLabel>{label}</MutedLabel>
        {description === undefined ? null : (
          <p className="text-label leading-relaxed text-aura-muted">{description}</p>
        )}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ChecklistItem({ step, text }: { step: number; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-aura-ink font-mono text-micro font-semibold text-white">
        {step}
      </span>
      <span className="text-label leading-relaxed text-aura-muted">{text}</span>
    </li>
  );
}

/* ================================================================== */
/* Field controls                                                     */
/* ================================================================== */

function TextInput({
  label,
  value,
  type = "text",
  placeholder,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  type?: "password" | "text";
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const disabledClass = disabled ? "cursor-not-allowed opacity-60" : "focus:border-aura-rose";

  return (
    <label className="block">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={`mt-2 block w-full rounded-tile border border-aura-hairline bg-white/65 px-3 py-2.5 font-mono text-label text-aura-ink outline-none transition placeholder:text-aura-faint ${disabledClass}`}
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <p className="mt-2 rounded-tile border border-aura-hairline bg-white/55 px-3 py-2.5 font-mono text-label text-aura-ink">
        {value}
      </p>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3">
      <dt className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">{label}</dt>
      <dd className="min-w-0 truncate font-mono text-micro uppercase tracking-[0.16em] text-aura-ink">
        {value}
      </dd>
    </div>
  );
}

function uniqueModelOptions(
  models: Array<OllamaModelSummary | { id: string; label: string }>,
): OllamaModelSummary[] {
  const seen = new Set<string>();
  const options: OllamaModelSummary[] = [];

  for (const model of models) {
    const name = "name" in model ? model.name : model.id;

    if (seen.has(name)) {
      continue;
    }

    seen.add(name);
    options.push({
      name,
      running: "running" in model ? model.running : undefined,
    });
  }

  return options;
}
