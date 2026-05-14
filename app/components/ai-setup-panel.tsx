import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  DEFAULT_GATEWAY_BASE_URL,
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

type ProviderInfo = {
  route: string;
  label: string;
  tagline: string;
};

type TrustBoundaryItem = {
  label: string;
  value: string;
};

const OLLAMA_LOCAL_FLOW =
  "Prompts, character data, date transcripts, and retrieved memories stay on this machine and only your Ollama process sees them.";
const GATEWAY_CLOUD_FLOW =
  "Date prompts, character context, transcripts, and retrieved memories leave this machine through Vercel AI Gateway and go to the selected model provider.";
const DESKTOP_GATEWAY_KEY_STORAGE =
  "Plaintext file in app local data at secrets/gateway-api-key.txt, outside saves and not in the OS keychain.";
const BROWSER_GATEWAY_KEY_STORAGE =
  "Browser dev stores the key in localStorage under idc.cupid.aiGatewayKey. This is not the desktop key path.";

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
  const footerCopy =
    activeProvider === "gateway"
      ? isProviderUrlLocked
        ? "Desktop stores the Gateway key as plaintext in app local data outside saves. Saving a blank key removes it. Gateway sends date prompts, context, transcripts, and retrieved memories off this device."
        : "Browser dev stores the Gateway key in localStorage. Gateway sends date prompts, context, transcripts, and retrieved memories off this device."
      : isProviderUrlLocked
        ? "Ollama route keeps date data local. Desktop builds talk only to localhost Ollama."
        : "Ollama route keeps date data local to the configured endpoint.";

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

/* ================================================================== */
/* Provider router                                                    */
/* ================================================================== */

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
    ? "Desktop talks to localhost Ollama through the app HTTP scope. Custom hosts need a new build."
    : "Browser dev talks to this Ollama URL. Use a local endpoint you trust.";
  const endpointTrustCopy = isUrlLocked
    ? "No Gateway key is used, and desktop does not need OLLAMA_ORIGINS for localhost."
    : "No Gateway key is used. Browser CORS rules still apply to the local Ollama server.";

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(21rem,0.64fr)]">
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
          {error === null ? null : (
            <p className="mt-3 rounded-tile border border-aura-rose/25 bg-rose-50/75 px-3 py-2 text-label text-aura-rose">
              {error}
            </p>
          )}
          <p className="mt-3 rounded-tile border border-aura-emerald/30 bg-aura-emerald/10 px-3 py-2 text-label leading-relaxed text-aura-ink">
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-emerald">
              local route ::
            </span>{" "}
            {OLLAMA_LOCAL_FLOW} {endpointTrustCopy}
          </p>
        </FormSection>

        <FormSection
          label="model"
          description="Pick a pulled chat model. The default is gemma4:e4b, and embedding stays on embeddinggemma."
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
      </div>

      <FormSection label="model shortcuts" description="One-click chat picks by VRAM tier.">
        <ul className="divide-y divide-aura-hairline">
          {GPU_RECOMMENDATION_PROFILES.map((profile) => (
            <li key={profile.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="font-display text-body font-semibold tracking-tight text-aura-ink">
                  {profile.label}
                </p>
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                  {profile.vram}
                </span>
              </div>
              <p className="mt-1 text-label leading-relaxed text-aura-muted">{profile.examples}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
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
  isUrlLocked,
  isSaving,
  isVerifying,
  busy,
  saveError,
  saveHint,
  onConfig,
  onGatewayApiKey,
  onSaveAndCheck,
  onVerify,
}: {
  config: GameConfig;
  gatewayApiKey: string;
  reasoningDisabled: boolean;
  isUrlLocked: boolean;
  isSaving: boolean;
  isVerifying: boolean;
  busy: boolean;
  saveError: string | null;
  saveHint: string | null;
  onConfig: (config: Partial<GameConfig>) => void;
  onGatewayApiKey: (value: string) => void;
  onSaveAndCheck: () => void;
  onVerify: () => void;
}) {
  const endpointDescription = isUrlLocked
    ? `Desktop uses the fixed Vercel AI Gateway endpoint: ${DEFAULT_GATEWAY_BASE_URL}.`
    : "Browser dev uses this Gateway URL and keeps the key in localStorage.";
  const keyPlaceholder = isUrlLocked ? "Plaintext app local data" : "Browser localStorage for dev";
  const storageTrustCopy = isUrlLocked
    ? `${DESKTOP_GATEWAY_KEY_STORAGE} Wiping a save leaves it in place. Saving a blank key removes it.`
    : BROWSER_GATEWAY_KEY_STORAGE;

  return (
    <div className="space-y-5">
      <section className="rounded-card border border-aura-rose/25 bg-white/70 p-5 shadow-cta ring-1 ring-white/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <MutedLabel>api key intake</MutedLabel>
            <h3 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
              Paste the Vercel AI Gateway key
            </h3>
            <p className="text-body leading-relaxed text-aura-muted">
              Use the key from Vercel. Cupid saves it, then checks that date simulation can reach
              Gateway.
            </p>
          </div>
          <span className="rounded-pill bg-aura-ink px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white">
            cloud desk
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <TextInput
            label="api key"
            type="password"
            value={gatewayApiKey}
            placeholder={keyPlaceholder}
            prominence="primary"
            onChange={onGatewayApiKey}
          />
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <GhostButton disabled={busy} onClick={onVerify}>
              {isVerifying ? "Verifying" : "Verify saved key"}
            </GhostButton>
            <PrimaryButton disabled={busy} onClick={onSaveAndCheck}>
              {isSaving ? "Verifying" : "Save and verify"}
            </PrimaryButton>
          </div>
        </div>

        <p className="mt-3 rounded-tile border border-aura-hairline bg-white/55 px-3 py-2 text-label leading-relaxed text-aura-muted">
          Saving a blank key removes the stored key. Cupid will not book dates until this desk
          verifies.
        </p>
        <SetupFeedback className="mt-3" saveError={saveError} saveHint={saveHint} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(21rem,0.64fr)]">
        <FormSection label="gateway url" description={endpointDescription}>
          <TextInput
            label="gateway url"
            value={config.gatewayBaseURL}
            disabled={isUrlLocked}
            onChange={(value) => onConfig({ gatewayBaseURL: value })}
          />
        </FormSection>

        <FormSection
          label="model"
          description="Pick a chat model. Gateway forwards each date request to that provider, and reasoning only applies where the provider accepts it."
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
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <p className="rounded-tile border border-aura-amber/40 bg-aura-amber/10 px-3 py-2 text-label leading-relaxed text-aura-ink">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-amber">
            data flow ::
          </span>{" "}
          {GATEWAY_CLOUD_FLOW} Use this route only if you accept that date data leaves the machine.
        </p>
        <p className="rounded-tile border border-aura-hairline bg-white/55 px-3 py-2 text-label leading-relaxed text-aura-muted">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
            key storage ::
          </span>{" "}
          {storageTrustCopy}
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Sidebar cards                                                      */
/* ================================================================== */

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
  const tone =
    status.status === "ready"
      ? { dot: "emerald" as const, badge: "ready", ring: "ring-emerald-300/40" }
      : status.status === "checking"
        ? { dot: "amber" as const, badge: "checking", ring: "ring-amber-300/40" }
        : { dot: "rose" as const, badge: "offline", ring: "ring-rose-300/40" };
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

function providerTrustBoundaryItems(
  provider: AiProvider,
  isUrlLocked: boolean,
): TrustBoundaryItem[] {
  if (provider === "ollama") {
    return [
      {
        label: "stays local",
        value: OLLAMA_LOCAL_FLOW,
      },
      {
        label: "endpoint",
        value: isUrlLocked
          ? "Desktop is scoped to localhost Ollama."
          : "Browser dev uses the configured Ollama URL.",
      },
      {
        label: "key",
        value: "No Gateway key is used for this route.",
      },
      {
        label: "saves",
        value: "Save files stay local. Cupid does not send telemetry.",
      },
    ];
  }

  return [
    {
      label: "leaves machine",
      value: GATEWAY_CLOUD_FLOW,
    },
    {
      label: "endpoint",
      value: isUrlLocked
        ? "Desktop is scoped to the default Vercel AI Gateway."
        : "Browser dev uses the configured Gateway URL.",
    },
    {
      label: "key",
      value: isUrlLocked ? DESKTOP_GATEWAY_KEY_STORAGE : BROWSER_GATEWAY_KEY_STORAGE,
    },
    {
      label: "saves",
      value: "Save files stay local. Gateway requests still leave the machine by design.",
    },
  ];
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
    <section className="rounded-card border border-aura-hairline bg-white/45 p-4">
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

function SetupFeedback({
  saveError,
  saveHint,
  className = "",
}: {
  saveError: string | null;
  saveHint: string | null;
  className?: string;
}) {
  if (saveError !== null) {
    return (
      <p
        className={`rounded-tile border border-aura-rose/30 bg-rose-50/75 px-3 py-2 text-label leading-relaxed text-aura-rose ${className}`}
      >
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em]">
          save failed ::
        </span>{" "}
        {saveError}
      </p>
    );
  }

  if (saveHint !== null) {
    return (
      <p
        className={`rounded-tile border border-aura-amber/40 bg-aura-amber/10 px-3 py-2 text-label leading-relaxed text-aura-ink ${className}`}
      >
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-amber">
          pending ::
        </span>{" "}
        {saveHint}
      </p>
    );
  }

  return null;
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
  prominence = "normal",
  onChange,
}: {
  label: string;
  value: string;
  type?: "password" | "text";
  placeholder?: string;
  disabled?: boolean;
  prominence?: "normal" | "primary";
  onChange: (value: string) => void;
}) {
  const disabledClass = disabled ? "cursor-not-allowed opacity-60" : "focus:border-aura-rose";
  const labelClass =
    prominence === "primary"
      ? "text-aura-rose tracking-[0.26em]"
      : "text-aura-faint tracking-[0.24em]";
  const inputClass =
    prominence === "primary" ? "px-4 py-4 text-body font-semibold" : "px-3 py-2.5 text-label";

  return (
    <label className="block">
      <span className={`font-mono text-micro font-semibold uppercase ${labelClass}`}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={`mt-2 block w-full rounded-tile border border-aura-hairline bg-white/65 font-mono text-aura-ink outline-none transition placeholder:text-aura-faint ${inputClass} ${disabledClass}`}
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
