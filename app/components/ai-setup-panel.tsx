import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_GATEWAY_EMBEDDING_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  type AiProvider,
  type AiReasoningLevel,
  type GameConfig,
} from "../domain/game";
import {
  GATEWAY_CHAT_MODELS,
  GPU_RECOMMENDATION_PROFILES,
  OLLAMA_CHAT_MODEL_OPTIONS,
  gatewayReasoningSupported,
  modelDefaultsForProvider,
  recommendedOllamaChatModels,
  recommendedOllamaEmbeddings,
  type OllamaModelSummary,
} from "../services/ai/model-catalog";
import { aiModelDiscoveryResponseSchema } from "../services/game-api-contracts";
import { errorToMessage } from "../services/utils";
import { ChromeButton, GhostButton, MutedLabel, PrimaryButton } from "./dashboard-atoms";

const AI_MODELS_URL = "/api/game?intent=ai-models";

export type AiSetupStatus = {
  status: "checking" | "ready" | "unavailable";
  message: string;
  details: string[];
  checkedAt?: string;
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

  useEffect(() => {
    setDraftConfig(config);
    setActiveProvider(config.aiProvider);
  }, [config]);

  useEffect(() => {
    setDraftGatewayKey(gatewayApiKey);
  }, [gatewayApiKey]);

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
      const response = await fetch(AI_MODELS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config: draftConfig }),
      });
      const payload: unknown = await response.json();
      const parsed = aiModelDiscoveryResponseSchema.safeParse(payload);

      if (!response.ok || !parsed.success) {
        throw new Error("Ollama scan did not return a readable model list.");
      }

      setOllamaModels(parsed.data.models);
    } catch (error) {
      setOllamaModels([]);
      setOllamaError(errorToMessage(error));
    } finally {
      setIsScanning(false);
    }
  }

  async function saveAndCheck() {
    setIsSaving(true);

    try {
      const pendingConfig = {
        ...draftConfig,
        aiProvider: activeProvider,
        aiSetupComplete: false,
      };
      await onSave(pendingConfig, draftGatewayKey);
      const checkedStatus = await onCheck(pendingConfig, draftGatewayKey);

      if (checkedStatus.status !== "ready") {
        return;
      }

      const completeConfig = {
        ...pendingConfig,
        aiSetupComplete: true,
      };
      setDraftConfig(completeConfig);
      await onSave(completeConfig, draftGatewayKey);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  const busy = isActionPending || isSaving;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-aura-bg/80 px-4 py-8 backdrop-blur-xl">
      <section className="aura-glass-strong mx-auto w-full max-w-5xl rounded-card p-6 shadow-card lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <MutedLabel>{required ? "required.ai.setup" : "ai.setup"}</MutedLabel>
            <h2 className="mt-2 font-display text-display-md font-semibold tracking-tight text-aura-ink">
              Pick Cupid's AI desk.
            </h2>
            <p className="mt-2 max-w-2xl text-body leading-relaxed text-aura-muted">
              Dates need one working provider. Local Ollama keeps everything on this PC. Gateway
              uses stronger cloud models after you add a key.
            </p>
          </div>
          {required ? null : <ChromeButton onClick={onClose}>Close</ChromeButton>}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-aura-hairline pb-4">
          <ProviderTab
            provider="ollama"
            activeProvider={activeProvider}
            label="Ollama"
            onSelect={selectProvider}
          />
          <ProviderTab
            provider="gateway"
            activeProvider={activeProvider}
            label="Vercel AI Gateway"
            onSelect={selectProvider}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            {activeProvider === "ollama" ? (
              <OllamaSetupTab
                config={draftConfig}
                chatModels={ollamaChatModels}
                embeddingModels={ollamaEmbeddingModels}
                isScanning={isScanning}
                error={ollamaError}
                onScan={scanOllama}
                onConfig={updateDraft}
              />
            ) : (
              <GatewaySetupTab
                config={draftConfig}
                gatewayApiKey={draftGatewayKey}
                reasoningDisabled={gatewayReasoningDisabled}
                activeGatewayModelLabel={activeGatewayModel?.label ?? draftConfig.chatModel}
                onConfig={updateDraft}
                onGatewayApiKey={setDraftGatewayKey}
              />
            )}
          </div>

          <aside className="space-y-4">
            <StatusPanel status={status} />
            <div className="rounded-card border border-aura-hairline bg-white/55 p-4">
              <MutedLabel>resolved defaults</MutedLabel>
              <dl className="mt-3 space-y-2 text-label text-aura-muted">
                <KeyValue label="provider" value={activeProvider} />
                <KeyValue label="chat" value={draftConfig.chatModel} />
                <KeyValue label="embedding" value={draftConfig.embeddingModel} />
                <KeyValue label="reasoning" value={draftConfig.reasoningLevel} />
              </dl>
            </div>
          </aside>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-aura-hairline pt-5">
          <p className="max-w-xl text-label leading-relaxed text-aura-muted">
            Gateway keys stay outside the save file. Cupid keeps that clipboard in a locked drawer.
          </p>
          <div className="flex flex-wrap gap-2">
            <GhostButton disabled={busy} onClick={() => void onCheck(draftConfig, draftGatewayKey)}>
              Check
            </GhostButton>
            <PrimaryButton disabled={busy} onClick={saveAndCheck}>
              {busy ? "Checking" : "Save and check"}
            </PrimaryButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProviderTab({
  provider,
  activeProvider,
  label,
  onSelect,
}: {
  provider: AiProvider;
  activeProvider: AiProvider;
  label: string;
  onSelect: (provider: AiProvider) => void;
}) {
  const isActive = provider === activeProvider;

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(provider)}
      className={`cursor-pointer rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.24em] transition ${
        isActive
          ? "bg-aura-ink text-white"
          : "bg-white/55 text-aura-muted hover:bg-white hover:text-aura-ink"
      }`}
    >
      {label}
    </button>
  );
}

function OllamaSetupTab({
  config,
  chatModels,
  embeddingModels,
  isScanning,
  error,
  onScan,
  onConfig,
}: {
  config: GameConfig;
  chatModels: OllamaModelSummary[];
  embeddingModels: OllamaModelSummary[];
  isScanning: boolean;
  error: string | null;
  onScan: () => void;
  onConfig: (config: Partial<GameConfig>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Ollama URL"
          value={config.ollamaBaseURL}
          onChange={(value) => onConfig({ ollamaBaseURL: value })}
        />
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
              reasoningLevel: "off",
            })
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <GhostButton disabled={isScanning} onClick={onScan}>
          {isScanning ? "Scanning" : "Scan Ollama"}
        </GhostButton>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          /api/tags and /api/ps
        </span>
      </div>
      {error === null ? null : (
        <p className="rounded-tile border border-aura-rose/25 bg-rose-50/75 px-3 py-2 text-label text-aura-rose">
          {error}
        </p>
      )}

      <section className="rounded-card border border-aura-hairline bg-white/50 p-4">
        <MutedLabel>gpu recommendations</MutedLabel>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {GPU_RECOMMENDATION_PROFILES.map((profile) => (
            <li key={profile.id} className="rounded-tile bg-white/65 p-3 ring-1 ring-aura-hairline">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-body font-semibold text-aura-ink">
                  {profile.label}
                </p>
                <span className="font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
                  {profile.vram}
                </span>
              </div>
              <p className="mt-1 text-label text-aura-muted">{profile.examples}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.modelIds.map((modelId) => (
                  <button
                    key={modelId}
                    type="button"
                    onClick={() =>
                      onConfig({
                        chatModel: modelId,
                        embeddingModel: DEFAULT_OLLAMA_EMBEDDING_MODEL,
                        reasoningLevel: "off",
                      })
                    }
                    className="cursor-pointer rounded-pill bg-aura-ink px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-aura-rose"
                  >
                    {modelId}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-aura-hairline bg-white/50 p-4">
        <MutedLabel>local setup</MutedLabel>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-label leading-relaxed text-aura-muted">
          <li>Install Ollama.</li>
          <li>Open a terminal.</li>
          <li>Pull the recommended chat model.</li>
          <li>Pull embeddinggemma.</li>
          <li>Start or keep Ollama running.</li>
          <li>Return to Cupid and click scan.</li>
        </ol>
      </section>

      <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
        Embedding model:{" "}
        <span className="text-aura-ink">
          {embeddingModels.at(0)?.name ?? DEFAULT_OLLAMA_EMBEDDING_MODEL}
        </span>
      </p>
    </div>
  );
}

function GatewaySetupTab({
  config,
  gatewayApiKey,
  reasoningDisabled,
  activeGatewayModelLabel,
  onConfig,
  onGatewayApiKey,
}: {
  config: GameConfig;
  gatewayApiKey: string;
  reasoningDisabled: boolean;
  activeGatewayModelLabel: string;
  onConfig: (config: Partial<GameConfig>) => void;
  onGatewayApiKey: (value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Gateway URL"
          value={config.gatewayBaseURL}
          onChange={(value) => onConfig({ gatewayBaseURL: value })}
        />
        <TextInput
          label="browser key"
          type="password"
          value={gatewayApiKey}
          placeholder="Uses AI_GATEWAY_API_KEY when the server has one"
          onChange={onGatewayApiKey}
        />
      </div>

      <SelectInput
        label="chat model"
        value={config.chatModel}
        options={GATEWAY_CHAT_MODELS.map((model) => ({ value: model.id, label: model.label }))}
        onChange={(value) => {
          const supportsReasoning = gatewayReasoningSupported(value);
          onConfig({
            chatModel: value,
            embeddingModel: DEFAULT_GATEWAY_EMBEDDING_MODEL,
            reasoningLevel: supportsReasoning ? "medium" : "off",
          });
        }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SelectInput
          label="reasoning"
          value={config.reasoningLevel}
          disabled={reasoningDisabled}
          options={[
            { value: "off", label: "Off" },
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
          onChange={(value) => onConfig({ reasoningLevel: value as AiReasoningLevel })}
        />
        <ReadOnlyField label="embedding" value={DEFAULT_GATEWAY_EMBEDDING_MODEL} />
      </div>

      <p className="rounded-tile border border-aura-hairline bg-white/55 px-3 py-2 text-label leading-relaxed text-aura-muted">
        {activeGatewayModelLabel} is the active cloud model. Reasoning is kept off for Claude Haiku
        4.5 and Kimi K2.5.
      </p>
    </div>
  );
}

function StatusPanel({ status }: { status: AiSetupStatus }) {
  const tone =
    status.status === "ready"
      ? "border-emerald-500/25 bg-emerald-50/75 text-emerald-800"
      : status.status === "checking"
        ? "border-amber-500/25 bg-amber-50/75 text-amber-800"
        : "border-aura-rose/25 bg-rose-50/75 text-aura-rose";

  return (
    <div className={`rounded-card border p-4 ${tone}`}>
      <MutedLabel>status</MutedLabel>
      <p className="mt-2 text-label leading-relaxed">{status.message}</p>
      {status.details.length === 0 ? null : (
        <ul className="mt-3 space-y-1 font-mono text-micro uppercase tracking-[0.18em]">
          {status.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TextInput({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: "password" | "text";
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 block w-full rounded-tile border border-aura-hairline bg-white/65 px-3 py-2.5 font-mono text-label text-aura-ink outline-none transition placeholder:text-aura-faint focus:border-aura-rose"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 block w-full cursor-pointer rounded-tile border border-aura-hairline bg-white/65 px-3 py-2.5 text-body font-semibold text-aura-ink outline-none transition hover:border-aura-hairline-strong focus:border-aura-rose disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
    <div className="grid grid-cols-[7rem_1fr] gap-3">
      <dt className="font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">{label}</dt>
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
