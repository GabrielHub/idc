import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { EASE_OUT_QUART, Eyebrow, GhostButton, MutedLabel } from "../components/dashboard-atoms";
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
import type { AiProvider, AiReasoningLevel, Member } from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import { jennaPike, vhool } from "../fixtures/members";
import {
  GATEWAY_CHAT_MODELS,
  modelDefaultsForProvider,
  type OllamaModelSummary,
} from "../services/ai/model-catalog";
import { errorToMessage, isRecord } from "../services/utils";

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
    title: "AI prompt lab",
    summary: "Character turn prompting, model choice, and sampling controls.",
  },
  {
    id: "date-reactions",
    title: "Date reactions",
    summary: "Floating bubbles emitted from a standee when a judge pass returns feedback.",
  },
] as const;

type PlaygroundTestId = (typeof PLAYGROUND_TESTS)[number]["id"];

type AiPlaygroundMode = "dateConversation" | "memberChat";

type AiPromptPreviewPayload = {
  system: string;
  prompt: string;
  model: string;
  providerMode: AiProvider;
  sampling: {
    temperature: number;
    topP: number;
    topK: number;
  };
  limits: {
    numCtx: number;
    maxOutputTokens: number;
  };
  reasoningLevel: string;
};

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

type AiPlaygroundResult = {
  mode: AiPlaygroundMode;
  text: string;
  turns: AiGeneratedTurn[];
  chatMessages?: MemberChatMessage[];
  model: string;
  providerMode: AiProvider;
  elapsedMs: number;
  promptCharacters: number;
  approximatePromptTokens: number;
  system: string;
  prompt: string;
  preview?: AiPromptPreviewPayload;
};

type AiGeneratedTurn = {
  speakerId: string;
  speakerName: string;
  text: string;
};

type MemberChatMessage = {
  role: "tester" | "member";
  text: string;
};

type AiDatePlaygroundSettings = AiBasePlaygroundSettings & {
  mode: "dateConversation";
  memberId: string;
  partnerId: string;
  scenarioId: string;
  dateHealth: number;
  spark: number;
  strain: number;
  transcriptText: string;
  memoryText: string;
  includeCurrentAsk: boolean;
  turnCount: number;
};

type AiMemberChatSettings = AiBasePlaygroundSettings & {
  mode: "memberChat";
  memberId: string;
  testerMessage: string;
  chatMessages: MemberChatMessage[];
};

const AI_PLAYGROUND_API_URL = "/api/playground-ai";
const DEFAULT_AI_SETTINGS: AiDatePlaygroundSettings = {
  mode: "dateConversation",
  provider: "ollama",
  memberId: "jenna-pike",
  partnerId: "vhool",
  scenarioId: "temporal-coffee-shop",
  model: "gemma4:26b",
  reasoningLevel: "off",
  temperature: 1,
  topP: 0.95,
  topK: 64,
  numCtx: 16384,
  maxOutputTokens: 160,
  dateHealth: 62,
  spark: 55,
  strain: 24,
  transcriptText: [
    "Vhool: The coffee has reversed into its bean form. This is either flirting or inventory.",
    "Jenna: I was hoping for normal, but I can work with inventory if it stays polite.",
  ].join("\n"),
  memoryText: "Jenna remembers that Vhool treated soup as a sincere planning document.",
  includeCurrentAsk: true,
  turnCount: 4,
  systemOverride: "",
  promptOverride: "",
};
const DEFAULT_MEMBER_CHAT_SETTINGS: AiMemberChatSettings = {
  mode: "memberChat",
  provider: "gateway",
  memberId: "jenna-pike",
  model: modelDefaultsForProvider("gateway").chatModel,
  reasoningLevel: modelDefaultsForProvider("gateway").reasoningLevel,
  temperature: 0.8,
  topP: 0.95,
  topK: 64,
  numCtx: 8192,
  maxOutputTokens: 180,
  testerMessage: "What would make a date feel normal enough to trust?",
  chatMessages: [],
  systemOverride: "",
  promptOverride: "",
};

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
      <MutedLabel>tests on file</MutedLabel>
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
        New tests land here as components grow. Add an entry to{" "}
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
        const response = await fetch(AI_PLAYGROUND_API_URL);
        const payload: unknown = await response.json();

        if (!isMounted || !isAiLoaderPayload(payload)) {
          return;
        }

        setModels(payload.models);
        setDateSettings(payload.defaults);
        setMemberChatSettings(payload.memberChatDefaults);
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
    const timeoutId = window.setTimeout(() => {
      void refreshPreview();
    }, 250);

    return () => window.clearTimeout(timeoutId);
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

  async function refreshPreview() {
    try {
      const preview = await postPlayground({ ...activeSettings, action: "preview" });
      setResult(preview);
      setError(null);
    } catch (caught) {
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
        title="AI prompt lab"
        description="Run date prompt tests or interview one member directly. Prompt previews update before the first generation so the route is easier to audit."
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="aura-glass h-fit rounded-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <MutedLabel>run sheet</MutedLabel>
              <h3 className="mt-2 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
                {mode === "dateConversation" ? "Date conversation" : "Member chat"}
              </h3>
            </div>
            <button
              type="button"
              onClick={runPrompt}
              disabled={isRunning}
              className="cursor-pointer rounded-pill bg-aura-ink px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-aura-rose disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isRunning ? "Running" : "Run"}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ModeButton label="Date test" value="dateConversation" mode={mode} onSelect={setMode} />
            <ModeButton label="Member chat" value="memberChat" mode={mode} onSelect={setMode} />
          </div>

          <div className="mt-5 space-y-5">
            <SelectControl
              label="provider"
              value={activeSettings.provider}
              options={[
                { value: "ollama", label: "Ollama" },
                { value: "gateway", label: "Vercel AI Gateway" },
              ]}
              onChange={(value) => selectProvider(value as AiProvider)}
            />
            <ModelControl
              value={activeSettings.model}
              models={modelOptions}
              onChange={(value) => setBaseSetting("model", value)}
            />
            {activeSettings.provider === "gateway" ? (
              <>
                <SelectControl
                  label="reasoning"
                  value={activeSettings.reasoningLevel}
                  options={[
                    { value: "off", label: "Off" },
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                  ]}
                  onChange={(value) =>
                    setBaseSetting(
                      "reasoningLevel",
                      value as AiBasePlaygroundSettings["reasoningLevel"],
                    )
                  }
                />
                <TextInputControl
                  label="Gateway key"
                  type="password"
                  value={activeSettings.gatewayApiKey ?? ""}
                  onChange={(value) => setBaseSetting("gatewayApiKey", value)}
                />
              </>
            ) : null}

            <SelectControl
              label="member"
              value={activeSettings.memberId}
              options={starterMembers.map((member) => ({
                value: member.id,
                label: member.name,
              }))}
              onChange={(value) =>
                mode === "dateConversation"
                  ? setDateSetting("memberId", value)
                  : setMemberChatSetting("memberId", value)
              }
            />

            {mode === "dateConversation" ? (
              <>
                <SelectControl
                  label="partner"
                  value={dateSettings.partnerId}
                  options={partnerOptions.map((member) => ({
                    value: member.id,
                    label: member.name,
                  }))}
                  onChange={(value) => setDateSetting("partnerId", value)}
                />
                <SelectControl
                  label="scenario"
                  value={dateSettings.scenarioId}
                  options={starterScenarios.map((scenario) => ({
                    value: scenario.id,
                    label: scenario.title,
                  }))}
                  onChange={(value) => setDateSetting("scenarioId", value)}
                />
              </>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <NumberControl
                label="context"
                value={activeSettings.numCtx}
                min={2048}
                max={262144}
                step={1024}
                onChange={(value) => setBaseSetting("numCtx", value)}
              />
              <NumberControl
                label="output tokens"
                value={activeSettings.maxOutputTokens}
                min={24}
                max={512}
                step={8}
                onChange={(value) => setBaseSetting("maxOutputTokens", value)}
              />
              {mode === "dateConversation" ? (
                <NumberControl
                  label="turns"
                  value={dateSettings.turnCount}
                  min={1}
                  max={6}
                  step={1}
                  onChange={(value) => setDateSetting("turnCount", value)}
                />
              ) : null}
            </div>

            <RangeControl
              label="temperature"
              value={activeSettings.temperature}
              min={0}
              max={2}
              step={0.05}
              onChange={(value) => setBaseSetting("temperature", value)}
            />
            <RangeControl
              label="top p"
              value={activeSettings.topP}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => setBaseSetting("topP", value)}
            />
            <NumberControl
              label="top k"
              value={activeSettings.topK}
              min={1}
              max={200}
              step={1}
              onChange={(value) => setBaseSetting("topK", value)}
            />

            {mode === "dateConversation" ? (
              <DatePlaygroundControls settings={dateSettings} onChange={setDateSetting} />
            ) : null}
          </div>
        </section>

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
                label="back and forth"
                value={dateSettings.transcriptText}
                rows={9}
                onChange={(value) => setDateSetting("transcriptText", value)}
              />
              <TextAreaControl
                label="allowed memories"
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
              label="context override"
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

function DatePlaygroundControls({
  settings,
  onChange,
}: {
  settings: AiDatePlaygroundSettings;
  onChange: <TKey extends keyof AiDatePlaygroundSettings>(
    key: TKey,
    value: AiDatePlaygroundSettings[TKey],
  ) => void;
}) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
        <RangeControl
          label="comfort"
          value={settings.dateHealth}
          min={0}
          max={100}
          step={1}
          onChange={(value) => onChange("dateHealth", Math.round(value))}
        />
        <RangeControl
          label="spark"
          value={settings.spark}
          min={0}
          max={100}
          step={1}
          onChange={(value) => onChange("spark", Math.round(value))}
        />
        <RangeControl
          label="strain"
          value={settings.strain}
          min={0}
          max={100}
          step={1}
          onChange={(value) => onChange("strain", Math.round(value))}
        />
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-tile border border-aura-hairline bg-white/45 px-3 py-2.5">
        <span>
          <span className="block font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
            current ask
          </span>
          <span className="mt-1 block text-label text-aura-muted">
            Include the selected member request when one is active.
          </span>
        </span>
        <input
          type="checkbox"
          checked={settings.includeCurrentAsk}
          onChange={(event) => onChange("includeCurrentAsk", event.currentTarget.checked)}
          className="size-4 cursor-pointer accent-aura-rose"
        />
      </label>
    </>
  );
}

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
          <MutedLabel>member thread</MutedLabel>
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
          <li className="rounded-tile bg-white/55 px-3 py-2 text-label text-aura-muted">
            No interview transcript filed yet.
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
        label="tester message"
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

function DateReactionsTest() {
  const [leftMember] = useState<Member>(jennaPike);
  const [rightMember] = useState<Member>(vhool);
  const [leftReactions, setLeftReactions] = useState<ReactionSignal[]>([]);
  const [rightReactions, setRightReactions] = useState<ReactionSignal[]>([]);
  const [intensity, setIntensity] = useState<ReactionIntensity>(2);

  function fire(side: "left" | "right", kind: ReactionKind) {
    const signal: ReactionSignal = {
      id: `playground-${side}-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      side,
      kind,
      intensity,
    };
    if (side === "left") {
      setLeftReactions((current) => pushReactionSignal(current, signal));
    } else {
      setRightReactions((current) => pushReactionSignal(current, signal));
    }
  }

  function fireBoth(kind: ReactionKind) {
    fire("left", kind);
    fire("right", kind);
  }

  function fireCombo(side: "left" | "right") {
    REACTION_KINDS.forEach((kind) => fire(side, kind));
  }

  function clear() {
    setLeftReactions([]);
    setRightReactions([]);
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
        description="Glass bubbles emit from each standee when the judge returns feedback. Fire a kind and intensity to preview the swarm. Same component the date scene uses."
      />

      <BubbleStage
        leftMember={leftMember}
        rightMember={rightMember}
        leftReactions={leftReactions}
        rightReactions={rightReactions}
      />

      <ControlPanel
        intensity={intensity}
        onIntensity={setIntensity}
        leftCount={leftReactions.length}
        rightCount={rightReactions.length}
        onFire={fire}
        onFireBoth={fireBoth}
        onFireCombo={fireCombo}
        onClear={clear}
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
        <MutedLabel>generated conversation</MutedLabel>
        {result === null || result.turns.length === 0 ? (
          <p className="mt-3 min-h-24 whitespace-pre-wrap rounded-tile bg-white/60 px-4 py-3 text-body leading-relaxed text-aura-ink">
            Run a chat to file the first test transcript.
          </p>
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

function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 block w-full cursor-pointer rounded-tile border border-aura-hairline bg-white/65 px-3 py-2.5 text-body font-semibold text-aura-ink outline-none transition hover:border-aura-hairline-strong focus:border-aura-rose"
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
        <span className="font-mono text-micro text-aura-muted">{value}</span>
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
  leftReactions,
  rightReactions,
}: {
  leftMember: Member;
  rightMember: Member;
  leftReactions: ReactionSignal[];
  rightReactions: ReactionSignal[];
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
          reactions={leftReactions}
          className="absolute bottom-0 left-6 h-full w-44 lg:left-16 lg:w-56"
        />
        <DaterStandee
          member={rightMember}
          placement="top-right"
          reactions={rightReactions}
          className="absolute top-12 right-6 h-[88%] w-44 lg:right-16 lg:w-56"
        />

        <StageScrim />
      </div>

      <StageFooter leftCount={leftReactions.length} rightCount={rightReactions.length} />
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

function StageFooter({ leftCount, rightCount }: { leftCount: number; rightCount: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-aura-hairline px-5 py-3 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
      <span>// stage</span>
      <span className="flex items-center gap-4 text-aura-muted">
        <span>
          left: <span className="text-aura-ink tabular-nums">{leftCount}</span> active
        </span>
        <span aria-hidden>·</span>
        <span>
          right: <span className="text-aura-ink tabular-nums">{rightCount}</span> active
        </span>
      </span>
    </div>
  );
}

/* ================================================================== */
/* Control panel                                                      */
/* ================================================================== */

function ControlPanel({
  intensity,
  onIntensity,
  leftCount,
  rightCount,
  onFire,
  onFireBoth,
  onFireCombo,
  onClear,
}: {
  intensity: ReactionIntensity;
  onIntensity: (next: ReactionIntensity) => void;
  leftCount: number;
  rightCount: number;
  onFire: (side: "left" | "right", kind: ReactionKind) => void;
  onFireBoth: (kind: ReactionKind) => void;
  onFireCombo: (side: "left" | "right") => void;
  onClear: () => void;
}) {
  const sideAtCap = leftCount >= REACTION_STREAM_LIMIT && rightCount >= REACTION_STREAM_LIMIT;

  return (
    <div className="aura-glass rounded-card p-6">
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <IntensityControl intensity={intensity} onChange={onIntensity} />
        <ReactionGrid intensity={intensity} onFire={onFire} onFireBoth={onFireBoth} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-aura-hairline pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <GhostButton
            onClick={() => onFireCombo("left")}
            disabled={leftCount >= REACTION_STREAM_LIMIT}
          >
            Fire combo, left
          </GhostButton>
          <GhostButton
            onClick={() => onFireCombo("right")}
            disabled={rightCount >= REACTION_STREAM_LIMIT}
          >
            Fire combo, right
          </GhostButton>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={leftCount === 0 && rightCount === 0}
          className="cursor-pointer rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear stage
        </button>
      </div>

      {sideAtCap ? (
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

function ReactionGrid({
  intensity,
  onFire,
  onFireBoth,
}: {
  intensity: ReactionIntensity;
  onFire: (side: "left" | "right", kind: ReactionKind) => void;
  onFireBoth: (kind: ReactionKind) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <MutedLabel>reactions</MutedLabel>
        <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          intensity {intensity}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {REACTION_KINDS.map((kind) => (
          <li key={kind}>
            <ReactionRow kind={kind} onFire={onFire} onFireBoth={onFireBoth} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReactionRow({
  kind,
  onFire,
  onFireBoth,
}: {
  kind: ReactionKind;
  onFire: (side: "left" | "right", kind: ReactionKind) => void;
  onFireBoth: (kind: ReactionKind) => void;
}) {
  return (
    <div className="aura-glass-lift flex items-center justify-between gap-2 rounded-tile px-3 py-2">
      <span className="flex items-center gap-2.5 min-w-0">
        <span className={`text-2xl leading-none ${REACTION_TINT[kind]}`}>
          {REACTION_ICON[kind]}
        </span>
        <span className="min-w-0 space-y-0.5">
          <span className="block font-display text-body font-semibold tracking-tight text-aura-ink">
            {REACTION_LABEL[kind]}
          </span>
          <span className="block font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            {kind}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-1">
        <SideButton label="L" onClick={() => onFire("left", kind)} />
        <SideButton label="R" onClick={() => onFire("right", kind)} />
        <SideButton label="L+R" wide onClick={() => onFireBoth(kind)} />
      </span>
    </div>
  );
}

function SideButton({
  label,
  wide = false,
  onClick,
}: {
  label: string;
  wide?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-pill bg-white/65 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-muted transition hover:bg-aura-ink hover:text-white ${wide ? "px-2.5 py-1" : "px-2 py-1"}`}
    >
      {label}
    </button>
  );
}

async function postPlayground(
  settings:
    | (AiDatePlaygroundSettings & { action: "generate" | "preview" })
    | (AiMemberChatSettings & { action: "generate" | "preview" }),
): Promise<AiPlaygroundResult> {
  const response = await fetch(AI_PLAYGROUND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(readErrorMessage(payload));
  }

  if (!isAiResultPayload(payload)) {
    throw new Error("AI playground returned an unreadable result.");
  }

  return payload;
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

function isAiLoaderPayload(value: unknown): value is {
  models: OllamaModelSummary[];
  defaults: AiDatePlaygroundSettings;
  memberChatDefaults: AiMemberChatSettings;
  previews: {
    dateConversation: AiPromptPreviewPayload;
    memberChat: AiPromptPreviewPayload;
  };
} {
  if (
    !isRecord(value) ||
    !Array.isArray(value.models) ||
    !isRecord(value.defaults) ||
    !isRecord(value.memberChatDefaults) ||
    !isRecord(value.previews)
  ) {
    return false;
  }

  return (
    value.models.every((model) => isRecord(model) && typeof model.name === "string") &&
    isPromptPreviewPayload(value.previews.dateConversation) &&
    isPromptPreviewPayload(value.previews.memberChat)
  );
}

function isAiResultPayload(value: unknown): value is AiPlaygroundResult {
  return (
    isRecord(value) &&
    typeof value.text === "string" &&
    Array.isArray(value.turns) &&
    value.turns.every(
      (turn) =>
        isRecord(turn) &&
        typeof turn.speakerId === "string" &&
        typeof turn.speakerName === "string" &&
        typeof turn.text === "string",
    ) &&
    typeof value.model === "string" &&
    (value.providerMode === "ollama" || value.providerMode === "gateway") &&
    typeof value.elapsedMs === "number" &&
    typeof value.promptCharacters === "number" &&
    typeof value.approximatePromptTokens === "number" &&
    typeof value.system === "string" &&
    typeof value.prompt === "string" &&
    (value.preview === undefined || isPromptPreviewPayload(value.preview)) &&
    (value.chatMessages === undefined ||
      (Array.isArray(value.chatMessages) &&
        value.chatMessages.every(
          (message) =>
            isRecord(message) &&
            (message.role === "tester" || message.role === "member") &&
            typeof message.text === "string",
        )))
  );
}

function isPromptPreviewPayload(value: unknown): value is AiPromptPreviewPayload {
  return (
    isRecord(value) &&
    typeof value.system === "string" &&
    typeof value.prompt === "string" &&
    typeof value.model === "string" &&
    (value.providerMode === "ollama" || value.providerMode === "gateway") &&
    isRecord(value.sampling) &&
    typeof value.sampling.temperature === "number" &&
    typeof value.sampling.topP === "number" &&
    typeof value.sampling.topK === "number" &&
    isRecord(value.limits) &&
    typeof value.limits.numCtx === "number" &&
    typeof value.limits.maxOutputTokens === "number" &&
    typeof value.reasoningLevel === "string"
  );
}

function readErrorMessage(value: unknown): string {
  if (isRecord(value) && typeof value.error === "string") {
    return value.error;
  }

  return "AI playground rejected that prompt.";
}
