import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  EASE_OUT_QUART,
  Eyebrow,
  GhostButton,
  MutedLabel,
  SelectInput,
} from "../components/dashboard-atoms";
import { DATE_PORTRAIT_MOODS, hasReadyPortraitMood } from "../components/date-presentation-signals";
import {
  DaterStandee,
  pushReactionSignal,
  REACTION_ICON,
  REACTION_KINDS,
  REACTION_LABEL,
  REACTION_STREAM_LIMIT,
  type ReactionIntensity,
  type ReactionKind,
  type ReactionSignal,
} from "../components/date-reactions";
import type { AiProvider, AiReasoningLevel, Member, PortraitMood } from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import { jennaPike, vhool } from "../fixtures/members";
import {
  GATEWAY_CHAT_MODELS,
  modelDefaultsForProvider,
  type OllamaModelSummary,
} from "../services/ai/model-catalog";
import {
  DEFAULT_DATE_PLAYGROUND_SETTINGS,
  DEFAULT_MEMBER_CHAT_SETTINGS as DEFAULT_MEMBER_CHAT_PLAYGROUND_SETTINGS,
  loadPlaygroundDefaults,
  runPlaygroundDateConversation,
  runPlaygroundMemberChat,
  type DatePlaygroundInput,
  type MemberChatPlaygroundInput,
  type PlaygroundResult,
  type PromptPreviewPayload,
} from "../services/ai/playground";
import { errorToMessage } from "../services/utils";

const REACTION_TINT: Record<ReactionKind, string> = {
  spark: "text-violet-500",
  love: "text-aura-rose",
  laugh: "text-amber-600",
  anger: "text-rose-700",
  cry: "text-sky-600",
  warning: "text-amber-700",
};

const PLAYGROUND_TESTS = [
  {
    id: "ai-lab",
    title: "AI prompt bench",
    summary: "Character turn prompting, model choice, sampling.",
  },
  {
    id: "date-reactions",
    title: "Date reactions",
    summary: "Mood, speaking bubble, and reactions on the date standee.",
  },
] as const;

type PlaygroundTestId = (typeof PLAYGROUND_TESTS)[number]["id"];

type AiPlaygroundMode = "dateConversation" | "memberChat";

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

const DEFAULT_AI_SETTINGS: AiDatePlaygroundSettings = toDateSettings(
  DEFAULT_DATE_PLAYGROUND_SETTINGS,
);
const DEFAULT_MEMBER_CHAT_SETTINGS: AiMemberChatSettings = toMemberChatSettings(
  DEFAULT_MEMBER_CHAT_PLAYGROUND_SETTINGS,
);

export function meta() {
  return [
    { title: "IDC | UI Playground" },
    {
      name: "description",
      content: "Local UI playground for IDC. Components run with mock data outside gameplay.",
    },
  ];
}

export default function PlaygroundRoute() {
  const [activeTestId, setActiveTestId] = useState<PlaygroundTestId>("ai-lab");

  return (
    <main className="relative min-h-screen overflow-hidden bg-aura-bg text-aura-ink">
      <AmbientMesh />
      <DotGridLayer />
      <PlaygroundTopBar />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-28 lg:px-10 lg:pt-32">
        <PlaygroundHeader />

        <div className="mt-10 grid gap-6 lg:grid-cols-[240px_1fr]">
          <TestList activeTestId={activeTestId} onSelect={setActiveTestId} />

          <div className="min-w-0">
            {activeTestId === "ai-lab" ? <AiPromptLabTest /> : null}
            {activeTestId === "date-reactions" ? <DateReactionsTest /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ================================================================== */
/* Atmosphere, mirrors splash so the playground reads as IDC chrome    */
/* ================================================================== */

function AmbientMesh() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[640px] w-[640px] rounded-full bg-aura-mesh-rose/45 blur-[140px] aura-blob-1" />
      <div className="absolute -top-20 right-0 h-[560px] w-[560px] rounded-full bg-aura-mesh-violet/45 blur-[140px] aura-blob-2" />
      <div className="absolute -bottom-40 left-1/4 h-[700px] w-[700px] rounded-full bg-aura-mesh-amber/35 blur-[140px] aura-blob-3" />
    </div>
  );
}

function DotGridLayer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 aura-dot-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_75%)]"
    />
  );
}

/* ================================================================== */
/* Top bar                                                            */
/* ================================================================== */

function PlaygroundTopBar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="flex w-full items-center justify-between gap-3 px-4 pt-4 lg:px-8 lg:pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
          className="aura-glass pointer-events-auto inline-flex items-center gap-3 rounded-pill px-5 py-2.5"
        >
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            IDC
          </span>
          <span aria-hidden className="h-3 w-px bg-aura-hairline" />
          <span className="font-display text-base font-semibold tracking-tight text-aura-ink">
            UI Playground
          </span>
          <span aria-hidden className="hidden h-3 w-px bg-aura-hairline lg:inline-block" />
          <span className="hidden font-mono text-micro uppercase tracking-[0.24em] text-aura-faint lg:inline">
            sub-basement 4.b
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.06 }}
          className="pointer-events-auto"
        >
          <Link
            to="/"
            className="aura-glass group inline-flex cursor-pointer items-center gap-2 rounded-pill px-4 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted transition hover:text-aura-rose"
          >
            <BackArrow />
            <span>back to splash</span>
          </Link>
        </motion.div>
      </div>
    </header>
  );
}

function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden>
      <path
        d="M19 12H5M11 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================================================== */
/* Page header                                                        */
/* ================================================================== */

function PlaygroundHeader() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.05 }}
      className="space-y-3"
    >
      <Eyebrow>// internal.tooling.ui</Eyebrow>
      <h1 className="font-display text-display-lg font-semibold leading-[1] tracking-tight text-aura-ink">
        Component <span className="aura-accent text-display-lg text-aura-rose">workshop.</span>
      </h1>
      <p className="max-w-[58ch] text-lead text-aura-muted">
        Live previews of game components, wired to mock data. Same code paths as the operations
        floor. Use this to isolate motion, layout, and color changes that are awkward to reach
        through normal play.
      </p>
    </motion.section>
  );
}

/* ================================================================== */
/* Test list (sidebar)                                                */
/* ================================================================== */

function TestList({
  activeTestId,
  onSelect,
}: {
  activeTestId: PlaygroundTestId;
  onSelect: (testId: PlaygroundTestId) => void;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.1 }}
      className="aura-glass h-fit rounded-card p-5"
    >
      <MutedLabel>bench tests</MutedLabel>
      <ul className="mt-3 space-y-1.5">
        {PLAYGROUND_TESTS.map((test) => {
          const isActive = test.id === activeTestId;
          return (
            <li key={test.id}>
              <button
                type="button"
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSelect(test.id)}
                className={`block w-full cursor-pointer rounded-tile px-3 py-2.5 text-left transition ${
                  isActive
                    ? "bg-aura-ink text-white shadow-[0_8px_22px_-12px_rgba(15,23,42,0.45)]"
                    : "text-aura-muted hover:bg-white/55 hover:text-aura-ink"
                }`}
              >
                <span className="block font-display text-body font-semibold tracking-tight">
                  {test.title}
                </span>
                <span
                  className={`mt-1 block font-mono text-micro uppercase tracking-[0.22em] ${isActive ? "text-white/70" : "text-aura-faint"}`}
                >
                  {test.id}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 border-t border-aura-hairline pt-4 text-label leading-relaxed text-aura-muted">
        File a new bench test by adding an entry to{" "}
        <span className="font-mono text-micro tracking-[0.22em] text-aura-ink">
          PLAYGROUND_TESTS
        </span>{" "}
        and a render branch in the route.
      </p>
    </motion.aside>
  );
}

/* ================================================================== */
/* Test: AI prompt lab                                                */
/* ================================================================== */

function AiPromptLabTest() {
  const [mode, setMode] = useState<AiPlaygroundMode>("dateConversation");
  const [dateSettings, setDateSettings] = useState<AiDatePlaygroundSettings>(DEFAULT_AI_SETTINGS);
  const [memberChatSettings, setMemberChatSettings] = useState<AiMemberChatSettings>(
    DEFAULT_MEMBER_CHAT_SETTINGS,
  );
  const [models, setModels] = useState<OllamaModelSummary[]>([]);
  const [result, setResult] = useState<AiPlaygroundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const activeSettings = mode === "dateConversation" ? dateSettings : memberChatSettings;
  const selectedMember = starterMembers.find((member) => member.id === activeSettings.memberId);
  const selectedPartner =
    mode === "dateConversation"
      ? starterMembers.find((member) => member.id === dateSettings.partnerId)
      : undefined;
  const selectedScenario =
    mode === "dateConversation"
      ? starterScenarios.find((scenario) => scenario.id === dateSettings.scenarioId)
      : undefined;
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

    setMemberChatSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function selectProvider(provider: AiProvider) {
    const defaults = modelDefaultsForProvider(provider);
    const nextBase = {
      provider,
      model: defaults.chatModel,
      reasoningLevel: defaults.reasoningLevel,
    };

    if (mode === "dateConversation") {
      setDateSettings((current) => ({
        ...current,
        ...nextBase,
      }));
      return;
    }

    setMemberChatSettings((current) => ({
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
        description="Run a date prompt or interview a single member. Prompt previews refresh as you type so the route is easier to audit."
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <RunSheet
          mode={mode}
          onMode={setMode}
          isRunning={isRunning}
          onRun={runPrompt}
          activeSettings={activeSettings}
          dateSettings={dateSettings}
          modelOptions={modelOptions}
          partnerOptions={partnerOptions}
          onSelectProvider={selectProvider}
          onBase={setBaseSetting}
          onDate={setDateSetting}
          onMemberChat={setMemberChatSetting}
        />

        <section className="min-w-0 space-y-6">
          <AiRunSummary
            memberName={selectedMember?.name ?? "Member"}
            partnerName={selectedPartner?.name ?? "Cupid QA"}
            scenarioTitle={
              mode === "dateConversation" ? (selectedScenario?.title ?? "Scenario") : "Private QA"
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
          ) : (
            <MemberChatPanel
              settings={memberChatSettings}
              result={result}
              onMessage={(value) => setMemberChatSetting("testerMessage", value)}
              onClear={() => setMemberChatSetting("chatMessages", [])}
            />
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

          <AiOutputPanel result={result} />
        </section>
      </div>
    </motion.section>
  );
}

/* ================================================================== */
/* Run sheet                                                          */
/* ================================================================== */

function RunSheet({
  mode,
  onMode,
  isRunning,
  onRun,
  activeSettings,
  dateSettings,
  modelOptions,
  partnerOptions,
  onSelectProvider,
  onBase,
  onDate,
  onMemberChat,
}: {
  mode: AiPlaygroundMode;
  onMode: (mode: AiPlaygroundMode) => void;
  isRunning: boolean;
  onRun: () => void;
  activeSettings: AiDatePlaygroundSettings | AiMemberChatSettings;
  dateSettings: AiDatePlaygroundSettings;
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
}) {
  return (
    <section className="aura-glass h-fit rounded-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <MutedLabel>run sheet</MutedLabel>
          <h3 className="mt-2 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            {mode === "dateConversation" ? "Date sim" : "Member interview"}
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
        <RunSheetSection label="test mode">
          <div className="flex flex-wrap gap-2">
            <ModeButton label="Date sim" value="dateConversation" mode={mode} onSelect={onMode} />
            <ModeButton label="Member interview" value="memberChat" mode={mode} onSelect={onMode} />
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
          {activeSettings.provider === "gateway" ? (
            <>
              <SelectInput
                label="reasoning"
                value={activeSettings.reasoningLevel}
                options={[
                  { value: "off", label: "Off" },
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
                onChange={(value) =>
                  onBase("reasoningLevel", value as AiBasePlaygroundSettings["reasoningLevel"])
                }
              />
              <TextInputControl
                label="gateway key"
                type="password"
                value={activeSettings.gatewayApiKey ?? ""}
                onChange={(value) => onBase("gatewayApiKey", value)}
              />
            </>
          ) : null}
        </RunSheetSection>

        <RunSheetSection label="subjects">
          <SelectInput
            label="member"
            value={activeSettings.memberId}
            options={starterMembers.map((member) => ({
              value: member.id,
              label: member.name,
            }))}
            onChange={(value) =>
              mode === "dateConversation"
                ? onDate("memberId", value)
                : onMemberChat("memberId", value)
            }
          />
          {mode === "dateConversation" ? (
            <>
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
          ) : null}
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
            max={512}
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

function RunSheetSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-aura-hairline pt-5 first:border-t-0 first:pt-0">
      <MutedLabel>{label}</MutedLabel>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ModeButton({
  label,
  value,
  mode,
  onSelect,
}: {
  label: string;
  value: AiPlaygroundMode;
  mode: AiPlaygroundMode;
  onSelect: (mode: AiPlaygroundMode) => void;
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

/* ================================================================== */
/* Member chat panel                                                  */
/* ================================================================== */

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
          <MutedLabel>interview thread</MutedLabel>
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
            // no interview filed yet
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
                {message.role === "tester" ? "Cupid QA" : (member?.firstName ?? "Member")}
              </span>
              <p className="mt-1 whitespace-pre-wrap text-body leading-relaxed">{message.text}</p>
            </li>
          ))
        )}
      </ol>

      <TextAreaControl
        label="interviewer message"
        value={settings.testerMessage}
        rows={4}
        onChange={onMessage}
      />
    </div>
  );
}

/* ================================================================== */
/* Test: Date reactions                                               */
/* ================================================================== */

type SideId = "left" | "right";

type SideState = {
  memberId: string;
  mood: PortraitMood;
  speaking: boolean;
  reasoningText: string;
  reactions: ReactionSignal[];
};

const SIDE_THEME: Record<
  SideId,
  {
    label: string;
    accentText: string;
    accentPill: string;
    railGradient: string;
  }
> = {
  left: {
    label: "bottom-left",
    accentText: "text-aura-rose",
    accentPill: "bg-rose-100/65 text-aura-rose",
    railGradient: "from-rose-200/40 via-rose-100/8 to-transparent",
  },
  right: {
    label: "top-right",
    accentText: "text-violet-600",
    accentPill: "bg-violet-100/70 text-violet-600",
    railGradient: "from-violet-200/40 via-violet-100/8 to-transparent",
  },
};

const SAMPLE_REASONING_LINES = [
  "running the line back, what would land softer here",
  "wait does this read as flirting or a planning document",
  "if i pivot now i lose the thread, hold one more beat",
] as const;

function defaultSideState(memberId: string): SideState {
  return {
    memberId,
    mood: "neutral",
    speaking: false,
    reasoningText: "",
    reactions: [],
  };
}

function DateReactionsTest() {
  const [leftSide, setLeftSide] = useState<SideState>(() => defaultSideState(jennaPike.id));
  const [rightSide, setRightSide] = useState<SideState>(() => defaultSideState(vhool.id));
  const [intensity, setIntensity] = useState<ReactionIntensity>(2);

  const leftMember = starterMembers.find((member) => member.id === leftSide.memberId) ?? jennaPike;
  const rightMember = starterMembers.find((member) => member.id === rightSide.memberId) ?? vhool;

  function fire(side: SideId, kind: ReactionKind) {
    const signal: ReactionSignal = {
      id: `playground-${side}-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      side,
      kind,
      intensity,
    };
    const setter = side === "left" ? setLeftSide : setRightSide;
    setter((current) => ({
      ...current,
      reactions: pushReactionSignal(current.reactions, signal),
    }));
  }

  function fireBoth(kind: ReactionKind) {
    fire("left", kind);
    fire("right", kind);
  }

  function fireCombo(side: SideId) {
    REACTION_KINDS.forEach((kind) => fire(side, kind));
  }

  function clearSide(side: SideId) {
    const setter = side === "left" ? setLeftSide : setRightSide;
    setter((current) => ({ ...current, reactions: [] }));
  }

  function clearAll() {
    clearSide("left");
    clearSide("right");
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Date reactions"
        description="Drive each standee independently. Mood swaps the portrait variant, speaking floats the thought bubble, and reactions emit the same glass swarm the date scene fires on judge feedback."
      />

      <BubbleStage
        leftMember={leftMember}
        rightMember={rightMember}
        leftSide={leftSide}
        rightSide={rightSide}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SideController
          side="left"
          state={leftSide}
          member={leftMember}
          intensity={intensity}
          onChange={setLeftSide}
          onFire={(kind) => fire("left", kind)}
          onFireCombo={() => fireCombo("left")}
          onClearReactions={() => clearSide("left")}
        />
        <SideController
          side="right"
          state={rightSide}
          member={rightMember}
          intensity={intensity}
          onChange={setRightSide}
          onFire={(kind) => fire("right", kind)}
          onFireCombo={() => fireCombo("right")}
          onClearReactions={() => clearSide("right")}
        />
      </div>

      <GlobalDeck
        intensity={intensity}
        onIntensity={setIntensity}
        onFireBoth={fireBoth}
        onClearAll={clearAll}
        leftCount={leftSide.reactions.length}
        rightCount={rightSide.reactions.length}
      />
    </motion.section>
  );
}

function TestHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="space-y-2">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
        // active test
      </p>
      <h2 className="font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
        {title}
      </h2>
      <p className="max-w-[64ch] text-body text-aura-muted">{description}</p>
    </header>
  );
}

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
          <MutedLabel>test target</MutedLabel>
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

function AiOutputPanel({ result }: { result: AiPlaygroundResult | null }) {
  return (
    <div className="space-y-4">
      <div className="aura-glass rounded-card p-5">
        <div className="flex items-baseline justify-between gap-3">
          <MutedLabel>generated transcript</MutedLabel>
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
              // no transcript on file
            </p>
            <p className="max-w-md text-label leading-relaxed text-aura-muted">
              Run the bench to file the first transcript. Prompts update as you change settings.
            </p>
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
        className="mt-2 block w-full resize-y rounded-card border border-aura-hairline bg-white/55 px-4 py-3 font-mono text-xs leading-5 text-aura-muted outline-none"
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

function TextAreaControl({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 block w-full resize-y rounded-card border border-aura-hairline bg-white/60 px-4 py-3 text-body leading-relaxed text-aura-ink outline-none transition focus:border-aura-rose"
      />
    </label>
  );
}

function BubbleStage({
  leftMember,
  rightMember,
  leftSide,
  rightSide,
}: {
  leftMember: Member;
  rightMember: Member;
  leftSide: SideState;
  rightSide: SideState;
}) {
  return (
    <div className="aura-glass-strong relative overflow-hidden rounded-card">
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_60%,rgba(244,63,94,0.08),transparent_70%)]"
      />
      <div className="relative h-[68vh] min-h-[520px] w-full">
        <DaterStandee
          member={leftMember}
          placement="bottom-left"
          mood={leftSide.mood}
          speaking={leftSide.speaking}
          reasoningText={leftSide.reasoningText}
          reactions={leftSide.reactions}
          className="absolute bottom-0 left-6 h-full w-44 lg:left-16 lg:w-56"
        />
        <DaterStandee
          member={rightMember}
          placement="top-right"
          mood={rightSide.mood}
          speaking={rightSide.speaking}
          reasoningText={rightSide.reasoningText}
          reactions={rightSide.reactions}
          className="absolute top-12 right-6 h-[88%] w-44 lg:right-16 lg:w-56"
        />

        <StageScrim />
      </div>

      <StageFooter
        leftMember={leftMember}
        rightMember={rightMember}
        leftSide={leftSide}
        rightSide={rightSide}
      />
    </div>
  );
}

function StageScrim() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/45 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/35 to-transparent"
      />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.34em] text-aura-faint/80">
          // judge feedback preview
        </p>
        <p className="mt-2 font-display text-display-sm font-semibold tracking-tight text-aura-faint/60">
          stage
        </p>
      </div>
    </>
  );
}

function StageFooter({
  leftMember,
  rightMember,
  leftSide,
  rightSide,
}: {
  leftMember: Member;
  rightMember: Member;
  leftSide: SideState;
  rightSide: SideState;
}) {
  return (
    <div className="grid gap-2 border-t border-aura-hairline px-5 py-3 sm:grid-cols-3">
      <StageMarker member={leftMember} state={leftSide} side="left" align="left" />
      <span className="hidden items-center justify-center font-mono text-micro uppercase tracking-[0.28em] text-aura-faint sm:flex">
        // stage
      </span>
      <StageMarker member={rightMember} state={rightSide} side="right" align="right" />
    </div>
  );
}

function StageMarker({
  member,
  state,
  side,
  align,
}: {
  member: Member;
  state: SideState;
  side: SideId;
  align: "left" | "right";
}) {
  const theme = SIDE_THEME[side];
  return (
    <div
      className={`flex flex-col gap-1 ${align === "right" ? "items-end text-right" : "items-start text-left"}`}
    >
      <span
        className={`font-mono text-micro font-semibold uppercase tracking-[0.28em] ${theme.accentText}`}
      >
        // {theme.label}
      </span>
      <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
        <span className="text-aura-ink">{member.firstName}</span>
        <span className="text-aura-faint"> · {state.mood}</span>
        {state.speaking ? <span className="text-aura-rose"> · speaking</span> : null}
      </span>
      <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        reactions <span className="text-aura-ink tabular-nums">{state.reactions.length}</span>
      </span>
    </div>
  );
}

/* ================================================================== */
/* Side controller, mirrors one standee end-to-end                    */
/* ================================================================== */

function SideController({
  side,
  state,
  member,
  intensity,
  onChange,
  onFire,
  onFireCombo,
  onClearReactions,
}: {
  side: SideId;
  state: SideState;
  member: Member;
  intensity: ReactionIntensity;
  onChange: React.Dispatch<React.SetStateAction<SideState>>;
  onFire: (kind: ReactionKind) => void;
  onFireCombo: () => void;
  onClearReactions: () => void;
}) {
  const theme = SIDE_THEME[side];
  const wiredCount = DATE_PORTRAIT_MOODS.filter((mood) =>
    hasReadyPortraitMood(member, mood),
  ).length;
  const atCap = state.reactions.length >= REACTION_STREAM_LIMIT;

  function patch<TKey extends keyof SideState>(key: TKey, value: SideState[TKey]) {
    onChange((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="aura-glass relative overflow-hidden rounded-card">
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b ${theme.railGradient}`}
      />
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="space-y-1">
          <span
            className={`font-mono text-micro font-semibold uppercase tracking-[0.32em] ${theme.accentText}`}
          >
            // {theme.label}
          </span>
          <h3 className="font-display text-display-sm font-semibold tracking-tight text-aura-ink">
            {member.name}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-pill ${theme.accentPill} px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em]`}
        >
          {wiredCount} / {DATE_PORTRAIT_MOODS.length} wired
        </span>
      </header>

      <div className="space-y-5 px-5 pt-5 pb-5">
        <SideSection label="member">
          <SelectInput
            label="character"
            value={state.memberId}
            options={starterMembers.map((candidate) => ({
              value: candidate.id,
              label: candidate.name,
            }))}
            onChange={(value) => patch("memberId", value)}
          />
        </SideSection>

        <SideSection label="portrait variant">
          <MoodPicker
            member={member}
            value={state.mood}
            onChange={(value) => patch("mood", value)}
          />
        </SideSection>

        <SideSection label="thought bubble">
          <SpeakingToggle checked={state.speaking} onChange={(value) => patch("speaking", value)} />
          <TextAreaControl
            label="reasoning text"
            value={state.reasoningText}
            rows={3}
            onChange={(value) => patch("reasoningText", value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_REASONING_LINES.map((line, index) => (
              <button
                key={index}
                type="button"
                onClick={() => patch("reasoningText", line)}
                className="cursor-pointer rounded-pill border border-aura-hairline bg-white/55 px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-hairline-strong hover:text-aura-ink"
              >
                Sample {index + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => patch("reasoningText", "")}
              disabled={state.reasoningText === ""}
              className="cursor-pointer rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </SideSection>

        <SideSection
          label={`reactions · intensity ${intensity} · ${state.reactions.length} active`}
        >
          <ReactionDeck onFire={onFire} disabled={atCap} />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <GhostButton onClick={onFireCombo} disabled={atCap}>
              Fire combo
            </GhostButton>
            <button
              type="button"
              onClick={onClearReactions}
              disabled={state.reactions.length === 0}
              className="cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear side
            </button>
          </div>
          {atCap ? (
            <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-amber">
              // four-reaction cap reached. clear to add more.
            </p>
          ) : null}
        </SideSection>
      </div>
    </section>
  );
}

function SideSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-aura-hairline pt-5 first:border-t-0 first:pt-0">
      <MutedLabel>{label}</MutedLabel>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function MoodPicker({
  member,
  value,
  onChange,
}: {
  member: Member;
  value: PortraitMood;
  onChange: (mood: PortraitMood) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {DATE_PORTRAIT_MOODS.map((mood) => {
        const isActive = mood === value;
        const wired = hasReadyPortraitMood(member, mood);
        return (
          <li key={mood}>
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(mood)}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-tile border px-3 py-2 transition ${
                isActive
                  ? "border-transparent bg-aura-ink text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.45)]"
                  : "border-aura-hairline bg-white/55 text-aura-muted hover:border-aura-hairline-strong hover:text-aura-ink"
              }`}
            >
              <span className="font-display text-body font-semibold tracking-tight">{mood}</span>
              <span
                className={`font-mono text-micro uppercase tracking-[0.22em] ${
                  isActive
                    ? wired
                      ? "text-white/80"
                      : "text-white/55"
                    : wired
                      ? "text-emerald-600"
                      : "text-aura-faint"
                }`}
              >
                {wired ? "wired" : "fallback"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SpeakingToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-tile border border-aura-hairline bg-white/45 px-3 py-2.5">
      <span>
        <span className="block font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
          speaking
        </span>
        <span className="mt-1 block text-label leading-relaxed text-aura-muted">
          Floats the thought bubble. Pulses while reasoning text streams.
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

function ReactionDeck({
  onFire,
  disabled,
}: {
  onFire: (kind: ReactionKind) => void;
  disabled: boolean;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {REACTION_KINDS.map((kind) => (
        <li key={kind}>
          <button
            type="button"
            onClick={() => onFire(kind)}
            disabled={disabled}
            className="aura-glass-lift flex w-full cursor-pointer flex-col items-center gap-1 rounded-tile border border-aura-hairline bg-white/55 px-3 py-3 transition hover:border-aura-hairline-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className={`text-2xl leading-none ${REACTION_TINT[kind]}`}>
              {REACTION_ICON[kind]}
            </span>
            <span className="block font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
              {REACTION_LABEL[kind]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ================================================================== */
/* Global deck, intensity + shared fire actions                       */
/* ================================================================== */

function GlobalDeck({
  intensity,
  onIntensity,
  onFireBoth,
  onClearAll,
  leftCount,
  rightCount,
}: {
  intensity: ReactionIntensity;
  onIntensity: (next: ReactionIntensity) => void;
  onFireBoth: (kind: ReactionKind) => void;
  onClearAll: () => void;
  leftCount: number;
  rightCount: number;
}) {
  const bothAtCap = leftCount >= REACTION_STREAM_LIMIT && rightCount >= REACTION_STREAM_LIMIT;

  return (
    <div className="aura-glass rounded-card p-6">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <IntensityControl intensity={intensity} onChange={onIntensity} />
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <MutedLabel>fire on both sides</MutedLabel>
            <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
              intensity {intensity}
            </span>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {REACTION_KINDS.map((kind) => (
              <li key={kind}>
                <button
                  type="button"
                  onClick={() => onFireBoth(kind)}
                  disabled={bothAtCap}
                  className="aura-glass-lift flex w-full cursor-pointer flex-col items-center gap-1 rounded-tile border border-aura-hairline bg-white/55 px-2 py-3 transition hover:border-aura-hairline-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className={`text-2xl leading-none ${REACTION_TINT[kind]}`}>
                    {REACTION_ICON[kind]}
                  </span>
                  <span className="block font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                    {REACTION_LABEL[kind]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-aura-hairline pt-4">
        <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          left <span className="text-aura-ink tabular-nums">{leftCount}</span>{" "}
          <span aria-hidden>·</span> right{" "}
          <span className="text-aura-ink tabular-nums">{rightCount}</span>
        </span>
        <button
          type="button"
          onClick={onClearAll}
          disabled={leftCount === 0 && rightCount === 0}
          className="cursor-pointer rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear stage
        </button>
      </div>

      {bothAtCap ? (
        <p className="mt-3 font-mono text-micro uppercase tracking-[0.24em] text-aura-amber">
          // both sides at the four-reaction cap. clear to add more.
        </p>
      ) : null}
    </div>
  );
}

function IntensityControl({
  intensity,
  onChange,
}: {
  intensity: ReactionIntensity;
  onChange: (next: ReactionIntensity) => void;
}) {
  const tiers: Array<{ value: ReactionIntensity; label: string; bubbles: number }> = [
    { value: 1, label: "soft", bubbles: 3 },
    { value: 2, label: "warm", bubbles: 5 },
    { value: 3, label: "loud", bubbles: 7 },
  ];

  return (
    <div className="space-y-3">
      <MutedLabel>intensity</MutedLabel>
      <div className="flex flex-col gap-1.5">
        {tiers.map((tier) => {
          const isActive = tier.value === intensity;
          return (
            <button
              key={tier.value}
              type="button"
              onClick={() => onChange(tier.value)}
              aria-pressed={isActive}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-tile border px-3 py-2 transition ${
                isActive
                  ? "border-transparent bg-aura-ink text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.45)]"
                  : "border-aura-hairline bg-white/55 text-aura-muted hover:border-aura-hairline-strong hover:text-aura-ink"
              }`}
            >
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em]">
                  {tier.value}
                </span>
                <span className="font-display text-body font-semibold tracking-tight">
                  {tier.label}
                </span>
              </span>
              <span
                className={`font-mono text-micro uppercase tracking-[0.22em] ${isActive ? "text-white/65" : "text-aura-faint"}`}
              >
                {tier.bubbles} bubbles
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

async function postPlayground(
  settings:
    | (AiDatePlaygroundSettings & { action: "generate" | "preview" })
    | (AiMemberChatSettings & { action: "generate" | "preview" }),
  signal?: AbortSignal,
): Promise<AiPlaygroundResult> {
  if (signal?.aborted === true) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (settings.mode === "memberChat") {
    return runPlaygroundMemberChat(settings);
  }

  return runPlaygroundDateConversation(settings);
}

function toDateSettings(input: DatePlaygroundInput): AiDatePlaygroundSettings {
  const { action: _action, ...rest } = input;
  return rest;
}

function toMemberChatSettings(input: MemberChatPlaygroundInput): AiMemberChatSettings {
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
