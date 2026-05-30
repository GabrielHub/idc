import {
  DEFAULT_GATEWAY_BASE_URL,
  DEFAULT_GATEWAY_EMBEDDING_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  type GameConfig,
} from "../domain/game";
import {
  GATEWAY_CHAT_MODELS,
  GPU_RECOMMENDATION_PROFILES,
  OLLAMA_REASONING_LEVEL_OPTIONS,
  gatewayModelCostLabel,
  type AiModelBrand,
  type AiModelCostTier,
  type AiModelOption,
  type OllamaModelSummary,
} from "../services/ai/model-catalog";
import {
  AdvancedDetails,
  FormSection,
  ReadOnlyField,
  SetupFeedback,
  TextInput,
} from "./ai-setup-panel-atoms";
import { GhostButton, MutedLabel, PrimaryButton, SelectInput } from "./dashboard-atoms";

export function OllamaSetupTab({
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

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.85fr)]">
      <div className="space-y-4">
        <section className="rounded-card border border-aura-hairline bg-white/45 p-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <MutedLabel>chat model</MutedLabel>
              <h3 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
                Pick a chat model
              </h3>
            </div>
            <GhostButton disabled={isScanning} onClick={onScan}>
              {isScanning ? "Scanning" : "Scan for models"}
            </GhostButton>
          </header>

          {error === null ? null : (
            <p className="mt-3 rounded-tile border border-aura-rose/25 bg-rose-50/75 px-3 py-2 text-label text-aura-rose">
              {error}
            </p>
          )}

          <div className="mt-3 grid gap-3 md:grid-cols-2">
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
            <SelectInput
              label="reasoning effort"
              value={config.reasoningLevel}
              options={OLLAMA_REASONING_LEVEL_OPTIONS}
              onChange={(value) => onConfig({ reasoningLevel: value })}
            />
          </div>
        </section>

        <AdvancedDetails>
          <TextInput
            label="ollama server address"
            value={config.ollamaBaseURL}
            disabled={isUrlLocked}
            onChange={(value) => onConfig({ ollamaBaseURL: value })}
          />
          <ReadOnlyField label="embedding model" value={embeddingLabel} />
          {isUrlLocked ? (
            <p className="text-label leading-relaxed text-aura-muted">
              Desktop talks to <span className="font-mono text-aura-ink">localhost</span> Ollama. A
              custom server needs a new build.
            </p>
          ) : null}
        </AdvancedDetails>
      </div>

      <section className="rounded-card border border-aura-hairline bg-white/45 p-4">
        <header className="flex items-baseline justify-between gap-3">
          <div className="space-y-0.5">
            <MutedLabel>model shortcuts</MutedLabel>
            <h3 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
              Pick by your GPU
            </h3>
          </div>
        </header>
        <ul className="mt-2 divide-y divide-aura-hairline">
          {GPU_RECOMMENDATION_PROFILES.map((profile) => (
            <li
              key={profile.id}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 py-1.5 first:pt-1 last:pb-1"
            >
              <span className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
                {profile.vram}
              </span>
              <p className="min-w-0 truncate text-label leading-snug text-aura-muted">
                {profile.examples}
              </p>
              <div className="flex flex-nowrap justify-end gap-1">
                {profile.modelIds.map((modelId) => (
                  <button
                    key={modelId}
                    type="button"
                    title={`Use ${modelId}`}
                    onClick={() =>
                      onConfig({
                        chatModel: modelId,
                        embeddingModel: DEFAULT_OLLAMA_EMBEDDING_MODEL,
                      })
                    }
                    className="cursor-pointer rounded-pill bg-aura-ink px-2 py-0.5 font-mono text-micro font-semibold lowercase tracking-[0.12em] text-white transition hover:bg-aura-rose"
                  >
                    {shortOllamaModelLabel(modelId)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function shortOllamaModelLabel(modelId: string): string {
  return modelId.replace(/^gemma4:/i, "");
}

export function GatewaySetupTab({
  config,
  pastedGatewayKey,
  hasStoredGatewayKey,
  isUrlLocked,
  isSaving,
  isVerifying,
  busy,
  saveError,
  saveHint,
  onConfig,
  onPastedGatewayKey,
  onClearGatewayApiKey,
  onSaveAndCheck,
  onVerify,
}: {
  config: GameConfig;
  pastedGatewayKey: string;
  hasStoredGatewayKey: boolean;
  isUrlLocked: boolean;
  isSaving: boolean;
  isVerifying: boolean;
  busy: boolean;
  saveError: string | null;
  saveHint: string | null;
  onConfig: (config: Partial<GameConfig>) => void;
  onPastedGatewayKey: (value: string) => void;
  onClearGatewayApiKey: () => void;
  onSaveAndCheck: () => void;
  onVerify: () => void;
}) {
  const keyPlaceholder = hasStoredGatewayKey
    ? "Paste a new key to replace the saved one"
    : "Paste your Vercel AI Gateway key";
  const hasPastedKey = pastedGatewayKey.trim().length > 0;
  const selectedModel = GATEWAY_CHAT_MODELS.find((model) => model.id === config.chatModel);
  const lockedReasoningLevel = selectedModel?.recommendedReasoningLevel ?? "off";
  const advancedAddressNote = isUrlLocked
    ? `Desktop uses ${DEFAULT_GATEWAY_BASE_URL}.`
    : "Browser dev uses this address and stores the key in localStorage.";

  return (
    <div className="space-y-5">
      <section className="rounded-card border border-aura-rose/25 bg-white/70 p-5 shadow-cta ring-1 ring-white/60">
        <div className="space-y-1.5">
          <MutedLabel>step 1</MutedLabel>
          <h3 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
            Add your API key
          </h3>
          <p className="text-body leading-relaxed text-aura-muted">
            Get a key from your Vercel AI Gateway dashboard. Cupid saves it on this device and uses
            it for every date.
          </p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <TextInput
            label="api key"
            type="password"
            value={pastedGatewayKey}
            placeholder={keyPlaceholder}
            prominence="primary"
            onChange={onPastedGatewayKey}
          />
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <GhostButton disabled={busy} onClick={onVerify}>
              {isVerifying ? "Checking" : hasPastedKey ? "Check pasted key" : "Check saved key"}
            </GhostButton>
            <PrimaryButton disabled={busy} onClick={onSaveAndCheck}>
              {isSaving ? "Saving" : "Save and connect"}
            </PrimaryButton>
          </div>
        </div>

        {hasStoredGatewayKey ? (
          <p className="mt-3 text-label leading-relaxed text-aura-muted">
            A key is already saved on this device. Paste a new one only to replace it.
          </p>
        ) : null}

        <SetupFeedback className="mt-3" saveError={saveError} saveHint={saveHint} />
      </section>

      <FormSection
        label="step 2"
        title="Pick a chat model"
        description="Cupid runs every date through this model. Cost is per date and shown next to each option."
      >
        <SelectInput
          label="chat model"
          value={config.chatModel}
          options={GATEWAY_CHAT_MODELS.map((model) => ({
            value: model.id,
            label: model.label,
            icon: gatewayModelIconForOption(model),
            meta: <GatewayModelCostBadge model={model} />,
          }))}
          onChange={(value) => {
            const nextModel = GATEWAY_CHAT_MODELS.find((model) => model.id === value);
            onConfig({
              chatModel: value,
              embeddingModel: DEFAULT_GATEWAY_EMBEDDING_MODEL,
              reasoningLevel: nextModel?.recommendedReasoningLevel ?? "off",
            });
          }}
        />
      </FormSection>

      <AdvancedDetails>
        <TextInput
          label="gateway server address"
          value={config.gatewayBaseURL}
          disabled={isUrlLocked}
          onChange={(value) => onConfig({ gatewayBaseURL: value })}
        />
        <p className="text-label leading-relaxed text-aura-muted">{advancedAddressNote}</p>
        <ReadOnlyField label="embedding model" value={DEFAULT_GATEWAY_EMBEDDING_MODEL} />
        <ReadOnlyField
          label="reasoning effort"
          value={selectedModel?.reasoningSupported === true ? lockedReasoningLevel : "off"}
        />
        {hasStoredGatewayKey ? (
          <button
            type="button"
            onClick={onClearGatewayApiKey}
            disabled={busy}
            className="cursor-pointer self-start rounded-pill border border-aura-hairline bg-white/65 px-3.5 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove saved key
          </button>
        ) : null}
      </AdvancedDetails>
    </div>
  );
}

type GatewayModelBrandMark = {
  label: string;
  className: string;
};

const GATEWAY_MODEL_BRAND_MARKS: Record<AiModelBrand, GatewayModelBrandMark> = {
  deepseek: {
    label: "D",
    className: "bg-sky-50 text-blue-600",
  },
  gemini: {
    label: "G",
    className: "bg-indigo-50 text-indigo-600",
  },
  claude: {
    label: "C",
    className: "bg-orange-50 text-orange-700",
  },
  kimi: {
    label: "K",
    className: "bg-violet-50 text-violet-700",
  },
  minimax: {
    label: "M",
    className: "bg-pink-50 text-pink-700",
  },
  qwen: {
    label: "Q",
    className: "bg-cyan-50 text-cyan-700",
  },
  xiaomi: {
    label: "Mi",
    className: "bg-amber-50 text-amber-700",
  },
  zhipu: {
    label: "Z",
    className: "bg-emerald-50 text-emerald-700",
  },
  openai: {
    label: "O",
    className: "bg-neutral-100 text-neutral-700",
  },
};

function gatewayModelIconForOption(model: AiModelOption) {
  if (model.brand === undefined) {
    return undefined;
  }

  return <GatewayModelBrandIcon brand={model.brand} />;
}

function GatewayModelBrandIcon({ brand }: { brand: AiModelBrand }) {
  const mark = GATEWAY_MODEL_BRAND_MARKS[brand];

  return (
    <span
      aria-hidden="true"
      className={`grid size-6 shrink-0 place-items-center rounded-chip ring-1 ring-aura-hairline ${mark.className}`}
    >
      <span className="font-mono text-sm font-semibold leading-none">{mark.label}</span>
    </span>
  );
}

function GatewayModelCostBadge({ model }: { model: AiModelOption }) {
  const costTier = model.cost?.costTier;

  return (
    <span
      aria-hidden="true"
      className={`shrink-0 rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.16em] ${gatewayModelCostBadgeClass(
        costTier,
      )}`}
    >
      {gatewayModelCostLabel(model.id)}
    </span>
  );
}

function gatewayModelCostBadgeClass(costTier: AiModelCostTier | undefined): string {
  if (costTier === "low") {
    return "bg-aura-emerald/15 text-aura-emerald";
  }

  if (costTier === "medium") {
    return "bg-aura-amber/15 text-aura-amber";
  }

  if (costTier === "high") {
    return "bg-aura-rose/12 text-aura-rose";
  }

  if (costTier === "very-high") {
    return "bg-aura-ink text-white";
  }

  return "bg-white/55 text-aura-muted";
}
