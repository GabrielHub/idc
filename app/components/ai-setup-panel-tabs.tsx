import {
  DEFAULT_GATEWAY_BASE_URL,
  DEFAULT_GATEWAY_EMBEDDING_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
  type GameConfig,
} from "../domain/game";
import {
  GATEWAY_CHAT_MODELS,
  GATEWAY_REASONING_LEVEL_OPTIONS,
  GPU_RECOMMENDATION_PROFILES,
  OLLAMA_REASONING_LEVEL_OPTIONS,
  type OllamaModelSummary,
} from "../services/ai/model-catalog";
import {
  BROWSER_GATEWAY_KEY_STORAGE,
  DESKTOP_GATEWAY_KEY_STORAGE,
  GATEWAY_CLOUD_FLOW,
  OLLAMA_LOCAL_FLOW,
} from "./ai-setup-panel-copy";
import { FormSection, ReadOnlyField, SetupFeedback, TextInput } from "./ai-setup-panel-atoms";
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

export function GatewaySetupTab({
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
