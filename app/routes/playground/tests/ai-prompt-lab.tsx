import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { EASE_OUT_QUART, MutedLabel, SelectInput } from "../../../components/dashboard-atoms";
import type { AiProvider, AiReasoningLevel, Member } from "../../../domain/game";
import { starterMembers, starterScenarios } from "../../../fixtures";
import {
  GATEWAY_CHAT_MODELS,
  GATEWAY_REASONING_LEVEL_OPTIONS,
  OLLAMA_REASONING_LEVEL_OPTIONS,
  modelDefaultsForProvider,
  type OllamaModelSummary,
} from "../../../services/ai/model-catalog";
import {
  DEFAULT_DATE_PLAYGROUND_SETTINGS,
  DEFAULT_FEATURE_BENCH_SETTINGS,
  DEFAULT_MEMBER_CHAT_SETTINGS as DEFAULT_MEMBER_CHAT_PLAYGROUND_SETTINGS,
  loadPlaygroundDefaults,
  runPlaygroundDateConversation,
  runPlaygroundFeatureBench,
  runPlaygroundMemberChat,
  type DatePlaygroundInput,
  type FeatureBenchPlaygroundInput,
  type FeatureBenchPlaygroundMode,
  type MemberChatPlaygroundInput,
  type PlaygroundResult,
  type PromptPreviewPayload,
} from "../../../services/ai/playground";
import type { PlaygroundSeedPack } from "../../../services/ai/playground-seeds";
import { errorToMessage } from "../../../services/utils";
import { TestHeader, TextAreaControl } from "../shared";

type AiPlaygroundMode = "dateConversation" | "memberChat" | FeatureBenchPlaygroundMode;

type AiPromptPreviewPayload = PromptPreviewPayload;

type AiBasePlaygroundSettings = {
  mode: AiPlaygroundMode;
  provider: AiProvider;
  model: string;
  gatewayApiKey?: string;
  ollamaBaseURL?: string;
  gatewayBaseURL?: string;
  reasoningLevel: AiReasoningLevel;
  temperature: number;
  topP: number;
  topK: number;
  numCtx: number;
  maxOutputTokens: number;
  systemOverride: string;
  promptOverride: string;
};

type AiPlaygroundResult = PlaygroundResult;

type AiDatePlaygroundSettings = Omit<DatePlaygroundInput, "action">;
type AiMemberChatSettings = Omit<MemberChatPlaygroundInput, "action">;
type AiFeatureBenchSettings = Omit<FeatureBenchPlaygroundInput, "action">;
type AiActivePlaygroundSettings =
  | AiDatePlaygroundSettings
  | AiMemberChatSettings
  | AiFeatureBenchSettings;

const DEFAULT_AI_SETTINGS: AiDatePlaygroundSettings = toDateSettings(
  DEFAULT_DATE_PLAYGROUND_SETTINGS,
);
const DEFAULT_MEMBER_CHAT_SETTINGS: AiMemberChatSettings = toMemberChatSettings(
  DEFAULT_MEMBER_CHAT_PLAYGROUND_SETTINGS,
);
const DEFAULT_FEATURE_BENCH_PLAYGROUND_SETTINGS: AiFeatureBenchSettings = toFeatureBenchSettings(
  DEFAULT_FEATURE_BENCH_SETTINGS,
);

export function AiPromptLabTest() {
  const [mode, setMode] = useState<AiPlaygroundMode>("dateConversation");
  const [dateSettings, setDateSettings] = useState<AiDatePlaygroundSettings>(DEFAULT_AI_SETTINGS);
  const [memberChatSettings, setMemberChatSettings] = useState<AiMemberChatSettings>(
    DEFAULT_MEMBER_CHAT_SETTINGS,
  );
  const [featureBenchSettings, setFeatureBenchSettings] = useState<AiFeatureBenchSettings>(
    DEFAULT_FEATURE_BENCH_PLAYGROUND_SETTINGS,
  );
  const [seedPacks, setSeedPacks] = useState<readonly PlaygroundSeedPack[]>([]);
  const [models, setModels] = useState<OllamaModelSummary[]>([]);
  const [result, setResult] = useState<AiPlaygroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const activeSettings = activeSettingsForMode({
    mode,
    dateSettings,
    memberChatSettings,
    featureBenchSettings,
  });
  const selectedSeed = seedPacks.find((seed) => seed.id === featureBenchSettings.seedId);
  const selectedMemberId =
    mode === "dateConversation"
      ? dateSettings.memberId
      : mode === "memberChat"
        ? memberChatSettings.memberId
        : selectedSeed?.memberId;
  const selectedMember = starterMembers.find((member) => member.id === selectedMemberId);
  const selectedPartner =
    mode === "dateConversation"
      ? starterMembers.find((member) => member.id === dateSettings.partnerId)
      : mode === "memberChat"
        ? undefined
        : starterMembers.find((member) => member.id === selectedSeed?.partnerId);
  const selectedScenario =
    mode === "dateConversation"
      ? starterScenarios.find((scenario) => scenario.id === dateSettings.scenarioId)
      : mode === "memberChat"
        ? undefined
        : starterScenarios.find((scenario) => scenario.id === selectedSeed?.scenarioId);
  const partnerOptions = useMemo(
    () => starterMembers.filter((member) => member.id !== dateSettings.memberId),
    [dateSettings.memberId],
  );
  const modelOptions = useMemo<OllamaModelSummary[]>(
    () =>
      activeSettings.provider === "gateway"
        ? GATEWAY_CHAT_MODELS.map((model) => ({ name: model.id, modifiedAt: model.label }))
        : models,
    [activeSettings.provider, models],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadModels() {
      try {
        const payload = await loadPlaygroundDefaults();

        if (!isMounted) {
          return;
        }

        setModels(payload.models);
        setDateSettings(toDateSettings(payload.defaults));
        setMemberChatSettings(toMemberChatSettings(payload.memberChatDefaults));
        setFeatureBenchSettings(toFeatureBenchSettings(payload.featureBenchDefaults));
        setSeedPacks(payload.seedPacks);
        setResult(previewToResult(payload.previews.dateConversation, "dateConversation"));
      } catch {
        if (isMounted) {
          setModels([]);
        }
      }
    }

    void loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (dateSettings.memberId !== dateSettings.partnerId) {
      return;
    }

    const fallbackPartner = starterMembers.find((member) => member.id !== dateSettings.memberId);

    if (fallbackPartner !== undefined) {
      setDateSetting("partnerId", fallbackPartner.id);
    }
  }, [dateSettings.memberId, dateSettings.partnerId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void refreshPreview(controller.signal);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeSettings, mode]);

  function setDateSetting<TKey extends keyof AiDatePlaygroundSettings>(
    key: TKey,
    value: AiDatePlaygroundSettings[TKey],
  ) {
    setDateSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function setMemberChatSetting<TKey extends keyof AiMemberChatSettings>(
    key: TKey,
    value: AiMemberChatSettings[TKey],
  ) {
    setMemberChatSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function setFeatureBenchSetting<TKey extends keyof AiFeatureBenchSettings>(
    key: TKey,
    value: AiFeatureBenchSettings[TKey],
  ) {
    setFeatureBenchSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function setBaseSetting<TKey extends keyof AiBasePlaygroundSettings>(
    key: TKey,
    value: AiBasePlaygroundSettings[TKey],
  ) {
    if (mode === "dateConversation") {
      setDateSettings((current) => ({
        ...current,
        [key]: value,
      }));
      return;
    }

    if (mode === "memberChat") {
      setMemberChatSettings((current) => ({
        ...current,
        [key]: value,
      }));
      return;
    }

    setFeatureBenchSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function selectMode(nextMode: AiPlaygroundMode) {
    setMode(nextMode);

    if (isFeatureBenchMode(nextMode)) {
      setFeatureBenchSettings((current) => ({
        ...current,
        mode: nextMode,
      }));
    }
  }

  function selectFeatureBenchMode(nextMode: FeatureBenchPlaygroundMode) {
    setMode(nextMode);
    setFeatureBenchSettings((current) => ({
      ...current,
      mode: nextMode,
    }));
  }

  function selectProvider(provider: AiProvider) {
    const defaults = modelDefaultsForProvider(provider);
    const nextBase = {
      provider,
      model: defaults.chatModel,
      reasoningLevel:
        mode === "memberChat" && provider === "gateway" ? "none" : defaults.reasoningLevel,
    };

    if (mode === "dateConversation") {
      setDateSettings((current) => ({
        ...current,
        ...nextBase,
      }));
      return;
    }

    if (mode === "memberChat") {
      setMemberChatSettings((current) => ({
        ...current,
        ...nextBase,
      }));
      return;
    }

    setFeatureBenchSettings((current) => ({
      ...current,
      ...nextBase,
    }));
  }

  async function refreshPreview(signal?: AbortSignal) {
    try {
      const preview = await postPlayground({ ...activeSettings, action: "preview" }, signal);
      if (signal?.aborted === true) {
        return;
      }
      setResult(preview);
      setError(null);
    } catch (caught) {
      if (signal?.aborted === true) {
        return;
      }
      setError(errorToMessage(caught));
    }
  }

  async function runPrompt() {
    setIsRunning(true);
    setError(null);

    try {
      const payload = await postPlayground({ ...activeSettings, action: "generate" });
      setResult(payload);

      if (payload.mode === "memberChat" && payload.chatMessages !== undefined) {
        setMemberChatSettings((current) => ({
          ...current,
          chatMessages: payload.chatMessages ?? current.chatMessages,
          testerMessage: "",
        }));
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "AI playground could not run that prompt.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="AI prompt bench"
        description="Run performer, extractor, judge, follow-up, and private chat prompts against the same local prompt contracts."
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <RunSheet
          mode={mode}
          onMode={selectMode}
          onFeatureMode={selectFeatureBenchMode}
          isRunning={isRunning}
          onRun={runPrompt}
          activeSettings={activeSettings}
          dateSettings={dateSettings}
          memberChatSettings={memberChatSettings}
          featureBenchSettings={featureBenchSettings}
          seedPacks={seedPacks}
          modelOptions={modelOptions}
          partnerOptions={partnerOptions}
          onSelectProvider={selectProvider}
          onBase={setBaseSetting}
          onDate={setDateSetting}
          onMemberChat={setMemberChatSetting}
          onFeatureBench={setFeatureBenchSetting}
        />

        <section className="min-w-0 space-y-6">
          <AiRunSummary
            memberName={selectedMember?.name ?? "Member"}
            partnerName={selectedPartner?.name ?? "You"}
            scenarioTitle={
              mode === "memberChat" ? "Private chat" : (selectedScenario?.title ?? "Scenario")
            }
            result={result}
            error={error}
          />

          {mode === "dateConversation" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <TextAreaControl
                label="transcript so far"
                value={dateSettings.transcriptText}
                rows={9}
                onChange={(value) => setDateSetting("transcriptText", value)}
              />
              <TextAreaControl
                label="permitted memory"
                value={dateSettings.memoryText}
                rows={9}
                onChange={(value) => setDateSetting("memoryText", value)}
              />
            </div>
          ) : mode === "memberChat" ? (
            <MemberChatPanel
              settings={memberChatSettings}
              result={result}
              onMessage={(value) => setMemberChatSetting("testerMessage", value)}
              onClear={() => setMemberChatSetting("chatMessages", [])}
            />
          ) : (
            <FeatureSeedPanel seed={selectedSeed} mode={mode} />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <TextAreaControl
              label="system override"
              value={activeSettings.systemOverride}
              rows={6}
              onChange={(value) => setBaseSetting("systemOverride", value)}
            />
            <TextAreaControl
              label="prompt override"
              value={activeSettings.promptOverride}
              rows={6}
              onChange={(value) => setBaseSetting("promptOverride", value)}
            />
          </div>

          <AiOutputPanel result={result} mode={mode} />
        </section>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* Run sheet                                                          */
/* ------------------------------------------------------------------ */

function RunSheet({
  mode,
  onMode,
  onFeatureMode,
  isRunning,
  onRun,
  activeSettings,
  dateSettings,
  memberChatSettings,
  featureBenchSettings,
  seedPacks,
  modelOptions,
  partnerOptions,
  onSelectProvider,
  onBase,
  onDate,
  onMemberChat,
  onFeatureBench,
}: {
  mode: AiPlaygroundMode;
  onMode: (mode: AiPlaygroundMode) => void;
  onFeatureMode: (mode: FeatureBenchPlaygroundMode) => void;
  isRunning: boolean;
  onRun: () => void;
  activeSettings: AiActivePlaygroundSettings;
  dateSettings: AiDatePlaygroundSettings;
  memberChatSettings: AiMemberChatSettings;
  featureBenchSettings: AiFeatureBenchSettings;
  seedPacks: readonly PlaygroundSeedPack[];
  modelOptions: OllamaModelSummary[];
  partnerOptions: Member[];
  onSelectProvider: (provider: AiProvider) => void;
  onBase: <TKey extends keyof AiBasePlaygroundSettings>(
    key: TKey,
    value: AiBasePlaygroundSettings[TKey],
  ) => void;
  onDate: <TKey extends keyof AiDatePlaygroundSettings>(
    key: TKey,
    value: AiDatePlaygroundSettings[TKey],
  ) => void;
  onMemberChat: <TKey extends keyof AiMemberChatSettings>(
    key: TKey,
    value: AiMemberChatSettings[TKey],
  ) => void;
  onFeatureBench: <TKey extends keyof AiFeatureBenchSettings>(
    key: TKey,
    value: AiFeatureBenchSettings[TKey],
  ) => void;
}) {
  const reasoningOptions =
    activeSettings.provider === "gateway"
      ? GATEWAY_REASONING_LEVEL_OPTIONS
      : OLLAMA_REASONING_LEVEL_OPTIONS;

  return (
    <section className="aura-glass h-fit rounded-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <MutedLabel>run sheet</MutedLabel>
          <h3 className="mt-2 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            {playgroundModeLabel(mode)}
          </h3>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="cursor-pointer rounded-pill bg-aura-ink px-5 py-2 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-aura-rose disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isRunning ? "Running" : "Run"}
        </button>
      </header>

      <div className="mt-5 space-y-5">
        <RunSheetSection label="bench mode">
          <div className="flex flex-wrap gap-2">
            <ModeButton label="Performer" value="dateConversation" mode={mode} onSelect={onMode} />
            <ModeButton
              label="Extractor"
              value="extractorBench"
              mode={mode}
              onSelect={onFeatureMode}
            />
            <ModeButton label="Judge" value="judgeBench" mode={mode} onSelect={onFeatureMode} />
            <ModeButton
              label="Follow-up"
              value="followUpBench"
              mode={mode}
              onSelect={onFeatureMode}
            />
            <ModeButton label="Member chat" value="memberChat" mode={mode} onSelect={onMode} />
          </div>
        </RunSheetSection>

        <RunSheetSection label="provider">
          <SelectInput
            label="provider"
            value={activeSettings.provider}
            options={[
              { value: "ollama", label: "Ollama" },
              { value: "gateway", label: "Vercel AI Gateway" },
            ]}
            onChange={(value) => onSelectProvider(value as AiProvider)}
          />
          <ModelControl
            value={activeSettings.model}
            models={modelOptions}
            onChange={(value) => onBase("model", value)}
          />
          <SelectInput
            label="reasoning"
            value={activeSettings.reasoningLevel}
            options={reasoningOptions}
            onChange={(value) =>
              onBase("reasoningLevel", value as AiBasePlaygroundSettings["reasoningLevel"])
            }
          />
          {activeSettings.provider === "gateway" ? (
            <TextInputControl
              label="gateway key"
              type="password"
              value={activeSettings.gatewayApiKey ?? ""}
              onChange={(value) => onBase("gatewayApiKey", value)}
            />
          ) : null}
        </RunSheetSection>

        <RunSheetSection label="subjects">
          {mode === "dateConversation" ? (
            <>
              <SelectInput
                label="member"
                value={dateSettings.memberId}
                options={starterMembers.map((member) => ({
                  value: member.id,
                  label: member.name,
                }))}
                onChange={(value) => onDate("memberId", value)}
              />
              <SelectInput
                label="partner"
                value={dateSettings.partnerId}
                options={partnerOptions.map((member) => ({
                  value: member.id,
                  label: member.name,
                }))}
                onChange={(value) => onDate("partnerId", value)}
              />
              <SelectInput
                label="scenario"
                value={dateSettings.scenarioId}
                options={starterScenarios.map((scenario) => ({
                  value: scenario.id,
                  label: scenario.title,
                }))}
                onChange={(value) => onDate("scenarioId", value)}
              />
            </>
          ) : mode === "memberChat" ? (
            <SelectInput
              label="member"
              value={memberChatSettings.memberId}
              options={starterMembers.map((member) => ({
                value: member.id,
                label: member.name,
              }))}
              onChange={(value) => selectMemberChatSubject(value, onMemberChat)}
            />
          ) : (
            <SelectInput
              label="seed pack"
              value={featureBenchSettings.seedId}
              options={seedPacks.map((seed) => ({
                value: seed.id,
                label: seed.title,
              }))}
              onChange={(value) => onFeatureBench("seedId", value)}
            />
          )}
        </RunSheetSection>

        <RunSheetSection label="limits">
          <NumberControl
            label="context"
            value={activeSettings.numCtx}
            min={2048}
            max={262144}
            step={1024}
            onChange={(value) => onBase("numCtx", value)}
          />
          <NumberControl
            label="output tokens"
            value={activeSettings.maxOutputTokens}
            min={24}
            max={mode === "memberChat" ? 512 : 1024}
            step={8}
            onChange={(value) => onBase("maxOutputTokens", value)}
          />
          {mode === "dateConversation" ? (
            <NumberControl
              label="turns"
              value={dateSettings.turnCount}
              min={1}
              max={6}
              step={1}
              onChange={(value) => onDate("turnCount", value)}
            />
          ) : null}
        </RunSheetSection>

        <RunSheetSection label="sampling">
          <RangeControl
            label="temperature"
            value={activeSettings.temperature}
            min={0}
            max={2}
            step={0.05}
            onChange={(value) => onBase("temperature", value)}
          />
          <RangeControl
            label="top p"
            value={activeSettings.topP}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => onBase("topP", value)}
          />
          <NumberControl
            label="top k"
            value={activeSettings.topK}
            min={1}
            max={200}
            step={1}
            onChange={(value) => onBase("topK", value)}
          />
        </RunSheetSection>

        {mode === "dateConversation" ? (
          <RunSheetSection label="scene state">
            <RangeControl
              label="comfort"
              value={dateSettings.dateHealth}
              min={0}
              max={100}
              step={1}
              onChange={(value) => onDate("dateHealth", Math.round(value))}
            />
            <RangeControl
              label="spark"
              value={dateSettings.spark}
              min={0}
              max={100}
              step={1}
              onChange={(value) => onDate("spark", Math.round(value))}
            />
            <RangeControl
              label="strain"
              value={dateSettings.strain}
              min={0}
              max={100}
              step={1}
              onChange={(value) => onDate("strain", Math.round(value))}
            />
            <CurrentAskToggle
              checked={dateSettings.includeCurrentAsk}
              onChange={(value) => onDate("includeCurrentAsk", value)}
            />
          </RunSheetSection>
        ) : null}
      </div>
    </section>
  );
}

function selectMemberChatSubject(
  memberId: string,
  onMemberChat: <TKey extends keyof AiMemberChatSettings>(
    key: TKey,
    value: AiMemberChatSettings[TKey],
  ) => void,
) {
  onMemberChat("memberId", memberId);
  onMemberChat("chatMessages", []);
}

function activeSettingsForMode({
  mode,
  dateSettings,
  memberChatSettings,
  featureBenchSettings,
}: {
  mode: AiPlaygroundMode;
  dateSettings: AiDatePlaygroundSettings;
  memberChatSettings: AiMemberChatSettings;
  featureBenchSettings: AiFeatureBenchSettings;
}): AiActivePlaygroundSettings {
  if (mode === "dateConversation") {
    return dateSettings;
  }

  if (mode === "memberChat") {
    return memberChatSettings;
  }

  return featureBenchSettings;
}

function isFeatureBenchMode(mode: AiPlaygroundMode): mode is FeatureBenchPlaygroundMode {
  return mode === "extractorBench" || mode === "judgeBench" || mode === "followUpBench";
}

function playgroundModeLabel(mode: AiPlaygroundMode): string {
  if (mode === "dateConversation") return "Performer";
  if (mode === "memberChat") return "Member chat";
  if (mode === "judgeBench") return "Judge";
  if (mode === "followUpBench") return "Follow-up";
  return "Extractor";
}

function RunSheetSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-aura-hairline pt-5 first:border-t-0 first:pt-0">
      <MutedLabel>{label}</MutedLabel>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ModeButton<TMode extends AiPlaygroundMode>({
  label,
  value,
  mode,
  onSelect,
}: {
  label: string;
  value: TMode;
  mode: AiPlaygroundMode;
  onSelect: (mode: TMode) => void;
}) {
  const isActive = value === mode;

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(value)}
      className={`cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
        isActive
          ? "bg-aura-ink text-white"
          : "bg-white/55 text-aura-muted hover:bg-white hover:text-aura-ink"
      }`}
    >
      {label}
    </button>
  );
}

function CurrentAskToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-tile border border-aura-hairline bg-white/45 px-3 py-2.5">
      <span>
        <span className="block font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
          include current ask
        </span>
        <span className="mt-1 block text-label leading-relaxed text-aura-muted">
          Pulls in the member's pinned request when one is active.
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="size-4 cursor-pointer accent-aura-rose"
      />
    </label>
  );
}

function FeatureSeedPanel({
  seed,
  mode,
}: {
  seed: PlaygroundSeedPack | undefined;
  mode: FeatureBenchPlaygroundMode;
}) {
  if (seed === undefined) {
    return (
      <div className="aura-glass rounded-card p-5">
        <MutedLabel>seed pack</MutedLabel>
        <p className="mt-3 text-label text-aura-muted">No seed pack is loaded for this bench.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="aura-glass rounded-card p-5">
        <MutedLabel>seed pack</MutedLabel>
        <h3 className="mt-2 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
          {seed.title}
        </h3>
        <p className="mt-2 text-label leading-relaxed text-aura-muted">{seed.notes}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MetricPill label="bench" value={playgroundModeLabel(mode)} />
          <MetricPill label="schema" value={seed.seedSchemaVersion.toString()} />
          <MetricPill label="pressure" value={seed.expected.judgePressure} />
          <MetricPill label="outcome" value={seed.expected.outcome} />
        </div>
      </section>

      <section className="aura-glass rounded-card p-5">
        <MutedLabel>expected memory</MutedLabel>
        <ExpectedSeedList label="agreements" values={seed.expected.agreements} />
        <ExpectedSeedList label="open loops" values={seed.expected.openLoops} />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MetricPill label="follow-up" value={seed.expected.followUpAction} />
          <MetricPill label="turns" value={seed.turnCount.toString()} />
        </div>
      </section>

      <FeatureSeedField label="seed transcript" value={seed.transcriptText} />
      <FeatureSeedField label="pair memories" value={seed.memoryText} />
    </div>
  );
}

function ExpectedSeedList({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <div className="mt-4 first:mt-0">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      {values.length === 0 ? (
        <p className="mt-2 rounded-tile border border-dashed border-aura-hairline-strong bg-white/45 px-3 py-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          none filed
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {values.map((value, index) => (
            <li
              key={`${label}-${index}`}
              className="rounded-tile border border-aura-hairline bg-white/60 px-3 py-2 text-label leading-relaxed text-aura-muted"
            >
              {value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FeatureSeedField({ label, value }: { label: string; value: string }) {
  return (
    <label className="aura-glass block rounded-card p-5">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <textarea
        readOnly
        value={value}
        rows={8}
        className="mt-3 block w-full resize-y rounded-tile border border-aura-hairline bg-white/55 px-3 py-2 font-mono text-sm leading-5 text-aura-muted outline-none"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Member chat panel                                                  */
/* ------------------------------------------------------------------ */

function MemberChatPanel({
  settings,
  result,
  onMessage,
  onClear,
}: {
  settings: AiMemberChatSettings;
  result: AiPlaygroundResult | null;
  onMessage: (value: string) => void;
  onClear: () => void;
}) {
  const member = starterMembers.find((candidate) => candidate.id === settings.memberId);
  const chatMessages =
    result?.mode === "memberChat" && result.chatMessages !== undefined
      ? result.chatMessages
      : settings.chatMessages;

  return (
    <div className="aura-glass rounded-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <MutedLabel>one-on-one thread</MutedLabel>
          <h3 className="mt-2 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            {member?.name ?? "Member"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={chatMessages.length === 0}
          className="cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <ol className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
        {chatMessages.length === 0 ? (
          <li className="rounded-tile border border-dashed border-aura-hairline-strong bg-white/45 px-3 py-4 text-center font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            // no chat filed yet
          </li>
        ) : (
          chatMessages.map((message, index) => (
            <li
              key={`${message.role}-${index}`}
              className={`rounded-tile px-3 py-2 ${
                message.role === "tester" ? "bg-white/65 text-aura-ink" : "bg-aura-ink text-white"
              }`}
            >
              <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] opacity-70">
                {message.role === "tester" ? "You" : (member?.firstName ?? "Member")}
              </span>
              <p className="mt-1 whitespace-pre-wrap text-body leading-relaxed">{message.text}</p>
            </li>
          ))
        )}
      </ol>

      <TextAreaControl
        label="your message"
        value={settings.testerMessage}
        rows={4}
        onChange={onMessage}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Output / summary panels                                            */
/* ------------------------------------------------------------------ */

function AiRunSummary({
  memberName,
  partnerName,
  scenarioTitle,
  result,
  error,
}: {
  memberName: string;
  partnerName: string;
  scenarioTitle: string;
  result: AiPlaygroundResult | null;
  error: string | null;
}) {
  return (
    <div className="aura-glass-strong rounded-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <MutedLabel>bench target</MutedLabel>
          <h3 className="mt-2 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            {memberName} to {partnerName}
          </h3>
          <p className="mt-1 text-label text-aura-muted">{scenarioTitle}</p>
        </div>
        {result === null ? null : (
          <div className="grid grid-cols-3 gap-3 text-right">
            <MetricPill label="ms" value={result.elapsedMs.toString()} />
            <MetricPill label="tokens" value={result.approximatePromptTokens.toString()} />
            <MetricPill label="provider" value={result.providerMode} />
          </div>
        )}
      </div>
      {error === null ? null : (
        <p className="mt-4 rounded-tile border border-aura-rose/25 bg-rose-50/75 px-3 py-2 text-label text-aura-rose">
          {error}
        </p>
      )}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-20 rounded-tile bg-white/55 px-3 py-2">
      <span className="block font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
        {label}
      </span>
      <span className="mt-1 block truncate font-display text-body font-semibold text-aura-ink">
        {value}
      </span>
    </div>
  );
}

function AiOutputPanel({
  result,
  mode,
}: {
  result: AiPlaygroundResult | null;
  mode: AiPlaygroundMode;
}) {
  const outputMode = result?.mode ?? mode;
  const isMemberChat = outputMode === "memberChat";
  const isFeatureBench = isFeatureBenchMode(outputMode);
  const emptyLabel = isMemberChat
    ? "// no reply on file"
    : isFeatureBench
      ? "// no bench output on file"
      : "// no transcript on file";
  const emptyText = isMemberChat
    ? "Run the bench to file the first member reply. Prompts update as you change settings."
    : isFeatureBench
      ? "Run the bench to file a prompt result. Prompts update as you change settings."
      : "Run the bench to file the first transcript. Prompts update as you change settings.";
  const outputLabel = isMemberChat
    ? "generated reply"
    : isFeatureBench
      ? "generated bench output"
      : "generated transcript";

  return (
    <div className="space-y-4">
      <div className="aura-glass rounded-card p-5">
        <div className="flex items-baseline justify-between gap-3">
          <MutedLabel>{outputLabel}</MutedLabel>
          {result === null || result.turns.length === 0 ? (
            <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
              idle
            </span>
          ) : (
            <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
              {result.turns.length} turn{result.turns.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {result === null || result.turns.length === 0 ? (
          <div className="mt-3 flex min-h-32 flex-col items-center justify-center gap-2 rounded-tile border border-dashed border-aura-hairline-strong bg-white/45 px-4 py-8 text-center">
            <p className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
              {emptyLabel}
            </p>
            <p className="max-w-md text-label leading-relaxed text-aura-muted">{emptyText}</p>
          </div>
        ) : (
          <ol className="mt-3 space-y-2">
            {result.turns.map((turn, index) => (
              <li
                key={`${turn.speakerId}-${index}`}
                className="rounded-tile border border-aura-hairline bg-white/60 px-4 py-3"
              >
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
                  {turn.speakerName}
                </span>
                <p className="mt-1 whitespace-pre-wrap text-body leading-relaxed text-aura-ink">
                  {turn.text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <PromptMetaPanel preview={result?.preview} />

      <div className="grid gap-4 xl:grid-cols-2">
        <PromptPreview title="system" value={result?.system ?? ""} />
        <PromptPreview title="prompt" value={result?.prompt ?? ""} />
      </div>
    </div>
  );
}

function PromptMetaPanel({ preview }: { preview: AiPromptPreviewPayload | undefined }) {
  if (preview === undefined) {
    return null;
  }

  return (
    <div className="grid gap-3 rounded-card border border-aura-hairline bg-white/55 p-4 md:grid-cols-4">
      <MetricPill label="model" value={preview.model} />
      <MetricPill label="temp" value={preview.sampling.temperature.toString()} />
      <MetricPill label="top p" value={preview.sampling.topP.toString()} />
      <MetricPill label="limit" value={preview.limits.maxOutputTokens.toString()} />
    </div>
  );
}

function PromptPreview({ title, value }: { title: string; value: string }) {
  return (
    <label className="block">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {title}
      </span>
      <textarea
        readOnly
        value={value}
        rows={14}
        className="mt-2 block w-full resize-y rounded-card border border-aura-hairline bg-white/55 px-4 py-3 font-mono text-sm leading-5 text-aura-muted outline-none"
      />
    </label>
  );
}

function ModelControl({
  value,
  models,
  onChange,
}: {
  value: string;
  models: OllamaModelSummary[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
          model
        </span>
        <input
          list="ai-playground-models"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="mt-2 block w-full rounded-tile border border-aura-hairline bg-white/65 px-3 py-2.5 font-mono text-label text-aura-ink outline-none transition focus:border-aura-rose"
        />
      </label>
      <datalist id="ai-playground-models">
        {models.map((model) => (
          <option key={model.name} value={model.name} />
        ))}
      </datalist>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {models.slice(0, 5).map((model) => (
          <button
            key={model.name}
            type="button"
            onClick={() => onChange(model.name)}
            className="cursor-pointer rounded-pill bg-white/55 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.2em] text-aura-muted transition hover:bg-aura-ink hover:text-white"
          >
            {model.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextInputControl({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: "password" | "text";
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
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 block w-full rounded-tile border border-aura-hairline bg-white/65 px-3 py-2.5 font-mono text-label text-aura-ink outline-none transition focus:border-aura-rose"
      />
    </label>
  );
}

function NumberControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="mt-2 block w-full rounded-tile border border-aura-hairline bg-white/65 px-3 py-2.5 font-mono text-label text-aura-ink outline-none transition focus:border-aura-rose"
      />
    </label>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
          {label}
        </span>
        <span className="font-mono text-micro tabular-nums text-aura-ink">{value}</span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="mt-2 block w-full cursor-pointer accent-aura-rose"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Bridge to the playground service                                   */
/* ------------------------------------------------------------------ */

async function postPlayground(
  settings:
    | (AiDatePlaygroundSettings & { action: "generate" | "preview" })
    | (AiMemberChatSettings & { action: "generate" | "preview" })
    | (AiFeatureBenchSettings & { action: "generate" | "preview" }),
  signal?: AbortSignal,
): Promise<AiPlaygroundResult> {
  if (signal?.aborted === true) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (settings.mode === "memberChat") {
    return runPlaygroundMemberChat(settings);
  }

  if (settings.mode === "dateConversation") {
    return runPlaygroundDateConversation(settings);
  }

  return runPlaygroundFeatureBench(settings);
}

function toDateSettings(input: DatePlaygroundInput): AiDatePlaygroundSettings {
  const { action: _action, ...rest } = input;
  return rest;
}

function toMemberChatSettings(input: MemberChatPlaygroundInput): AiMemberChatSettings {
  const { action: _action, ...rest } = input;
  return rest;
}

function toFeatureBenchSettings(input: FeatureBenchPlaygroundInput): AiFeatureBenchSettings {
  const { action: _action, ...rest } = input;
  return rest;
}

function previewToResult(
  preview: AiPromptPreviewPayload,
  mode: AiPlaygroundMode,
): AiPlaygroundResult {
  return {
    mode,
    text: "",
    turns: [],
    model: preview.model,
    providerMode: preview.providerMode,
    elapsedMs: 0,
    promptCharacters: preview.system.length + preview.prompt.length,
    approximatePromptTokens: Math.ceil((preview.system.length + preview.prompt.length) / 4),
    system: preview.system,
    prompt: preview.prompt,
    preview,
  };
}
