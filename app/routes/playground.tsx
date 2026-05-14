import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import {
  EASE_OUT_QUART,
  Eyebrow,
  GhostButton,
  MutedLabel,
  pad2,
  Portrait,
  SelectInput,
} from "../components/dashboard-atoms";
import { NotesView } from "../components/dashboard-views";
import { PairBoard } from "../components/pair-board";
import {
  DATE_PORTRAIT_MOODS,
  hasReadyPortraitMood,
  selectDominantMood,
} from "../components/date-presentation-signals";
import {
  DaterStandee,
  formatMemberHeightLabel,
  pushReactionSignal,
  REACTION_ICON,
  REACTION_KINDS,
  REACTION_LABEL,
  REACTION_STREAM_LIMIT,
  resolveStandeeHeightScale,
  type ReactionIntensity,
  type ReactionKind,
  type ReactionSignal,
} from "../components/date-reactions";
import { resolveStandeeFooting } from "../components/standee-footing";
import { resolveStandeeSourceScale } from "../components/standee-source-scale";
import {
  HOUSE_BUBBLE_LEFT_CLASS,
  HOUSE_BUBBLE_NAME_CLASS,
  resolveMemberChatBubbleStyle,
} from "../components/member-chat-bubble-style";
import {
  loadScenarioBackdropIds,
  SCENARIO_BACKDROP_MICRO_MOTION_VARIANTS,
  SCENARIO_BACKDROP_PARTICLE_STYLES,
  ScenarioBackdropLayer,
  type ScenarioBackdropMicroMotion,
  type ScenarioBackdropParticleStyle,
} from "../components/scenario-backdrop";
import type {
  AiProvider,
  AiReasoningLevel,
  MemoryRecord,
  Member,
  PairState,
  PortraitMood,
} from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import {
  bradyStrait,
  chaYusung,
  eleanorAsh,
  gideonGlass,
  jennaPike,
  marcusPellish,
  meiSato,
  miraPark,
  naiaVelorae,
  opalSunday,
  reaver,
  seraVohn,
  tashaRell,
  vhool,
} from "../fixtures/members";
import { makePairId, sortMemberIds } from "../services/game-seed";
import {
  GATEWAY_CHAT_MODELS,
  GATEWAY_REASONING_LEVEL_OPTIONS,
  OLLAMA_REASONING_LEVEL_OPTIONS,
  modelDefaultsForProvider,
  type OllamaModelSummary,
} from "../services/ai/model-catalog";
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
} from "../services/ai/playground";
import type { PlaygroundSeedPack } from "../services/ai/playground-seeds";
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
    summary: "Character turn prompting, one-on-one chat, model choice, sampling.",
  },
  {
    id: "date-reactions",
    title: "Date reactions",
    summary: "Mood, speaking bubble, and reactions on the date standee.",
  },
  {
    id: "height-scale",
    title: "Height lineup",
    summary: "Canonical member heights rendered through live date standee scaling.",
  },
  {
    id: "chat-bubbles",
    title: "Chat bubble gallery",
    summary: "Per-member focused-side bubble styles in one grid.",
  },
  {
    id: "notes-archive",
    title: "Notes archive",
    summary: "Case notes view with mock pair, date, and scenario memories.",
  },
  {
    id: "pair-board",
    title: "Pair board",
    summary: "Network-graph view of filed pair connections with hover, expand, and rail UX.",
  },
] as const;

type PlaygroundTestId = (typeof PLAYGROUND_TESTS)[number]["id"];

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
        <PlaygroundHeader activeTestId={activeTestId} onSelect={setActiveTestId} />

        <div className="mt-10 min-w-0">
          {activeTestId === "ai-lab" ? <AiPromptLabTest /> : null}
          {activeTestId === "date-reactions" ? <DateReactionsTest /> : null}
          {activeTestId === "height-scale" ? <HeightLineupTest /> : null}
          {activeTestId === "chat-bubbles" ? <ChatBubbleGalleryTest /> : null}
          {activeTestId === "notes-archive" ? <NotesArchiveTest /> : null}
          {activeTestId === "pair-board" ? <PairBoardTest /> : null}
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

function PlaygroundHeader({
  activeTestId,
  onSelect,
}: {
  activeTestId: PlaygroundTestId;
  onSelect: (testId: PlaygroundTestId) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.05 }}
      className="relative z-30 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between"
    >
      <div className="space-y-3">
        <Eyebrow>// internal.tooling.ui</Eyebrow>
        <h1 className="font-display text-display-lg font-semibold leading-[1] tracking-tight text-aura-ink">
          Component <span className="aura-accent text-display-lg text-aura-rose">workshop.</span>
        </h1>
        <p className="max-w-[58ch] text-lead text-aura-muted">
          Live previews of game components, wired to mock data. Same code paths as the operations
          floor. Use this to isolate motion, layout, and color changes that are awkward to reach
          through normal play.
        </p>
      </div>
      <TestList activeTestId={activeTestId} onSelect={onSelect} />
    </motion.section>
  );
}

/* ================================================================== */
/* Test list (header selector)                                        */
/* ================================================================== */

function TestList({
  activeTestId,
  onSelect,
}: {
  activeTestId: PlaygroundTestId;
  onSelect: (testId: PlaygroundTestId) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const activeTest =
    PLAYGROUND_TESTS.find((test) => test.id === activeTestId) ?? PLAYGROUND_TESTS[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current === null) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(testId: PlaygroundTestId) {
    if (testId !== activeTestId) {
      onSelect(testId);
    }
    setOpen(false);
  }

  return (
    <aside className="aura-glass h-fit rounded-card p-4 lg:w-72 lg:shrink-0">
      <div className="flex items-center justify-between gap-3">
        <MutedLabel>bench tests</MutedLabel>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {PLAYGROUND_TESTS.length}
        </span>
      </div>

      <div ref={containerRef} className="relative mt-3">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={`Bench test: ${activeTest.title}`}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-tile bg-aura-ink px-3 py-2 text-left text-white shadow-[0_8px_22px_-12px_rgba(15,23,42,0.45)] outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-aura-rose/50"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-body font-semibold tracking-tight">
              {activeTest.title}
            </span>
            <span className="mt-0.5 block truncate font-mono text-micro uppercase tracking-[0.22em] text-white/70">
              {activeTest.id}
            </span>
          </span>
          <TestListChevron open={open} />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.ul
              id={menuId}
              key="test-list-menu"
              role="menu"
              aria-label="Bench tests"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: EASE_OUT_QUART }}
              className="aura-glass-strong absolute inset-x-0 top-full z-[60] mt-2 max-h-80 space-y-1 overflow-auto rounded-card p-1.5 shadow-card"
            >
              {PLAYGROUND_TESTS.map((test) => {
                const selected = test.id === activeTestId;
                return (
                  <li key={test.id} role="none">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => handleSelect(test.id)}
                      className={`block w-full cursor-pointer rounded-tile px-3 py-2 text-left transition ${
                        selected
                          ? "bg-aura-ink text-white"
                          : "text-aura-muted hover:bg-white/65 hover:text-aura-ink"
                      }`}
                    >
                      <span className="block truncate font-display text-body font-semibold tracking-tight">
                        {test.title}
                      </span>
                      <span
                        className={`mt-0.5 block truncate font-mono text-micro uppercase tracking-[0.22em] ${selected ? "text-white/70" : "text-aura-faint"}`}
                      >
                        {test.id}
                      </span>
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>

      <p className="mt-3 text-sm text-aura-muted">{activeTest.summary}</p>
    </aside>
  );
}

function TestListChevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      fill="none"
      className={`size-3.5 shrink-0 text-white/70 transition ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M3.5 5.5L7 9L10.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================================================== */
/* Test: Chat bubble gallery                                          */
/* ================================================================== */

const CHAT_BUBBLE_FALLBACK_SAMPLE =
  "no but seriously, send me a time, a place, and a chair that does not creak. that is the whole vibe.";

function pickChatBubbleSample(member: Member): string {
  const opener = member.voice.sampleMessages.opener[0];
  if (typeof opener === "string" && opener.trim().length > 0) {
    return opener;
  }
  return CHAT_BUBBLE_FALLBACK_SAMPLE;
}

function ChatBubbleGalleryTest() {
  const [replayKey, setReplayKey] = useState(0);

  const customCount = useMemo(
    () => starterMembers.filter((member) => member.chatBubble !== undefined).length,
    [],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Chat bubble gallery"
        description="Every member's focused-side bubble in one screen. Each card uses the same resolver as a live date so authoring tweaks land here first. Continuous textures (drift, holographic, crackling) animate in place. Replay re-mounts the grid to retrigger entry animations."
      />

      <div className="aura-glass flex flex-wrap items-center justify-between gap-3 rounded-card px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <MutedLabel>roster</MutedLabel>
          <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            <span className="text-aura-ink tabular-nums">{customCount}</span> custom
            <span aria-hidden> · </span>
            <span className="text-aura-ink tabular-nums">
              {starterMembers.length - customCount}
            </span>{" "}
            default
            <span aria-hidden> · </span>
            <span className="text-aura-ink tabular-nums">{starterMembers.length}</span> total
          </span>
        </div>
        <button
          type="button"
          onClick={() => setReplayKey((current) => current + 1)}
          className="cursor-pointer rounded-pill bg-aura-ink px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-aura-rose"
        >
          Replay animations
        </button>
      </div>

      <div key={replayKey} className="grid gap-4 lg:grid-cols-2">
        {starterMembers.map((member) => (
          <ChatBubblePreviewCard key={member.id} member={member} />
        ))}
      </div>
    </motion.section>
  );
}

function ChatBubblePreviewCard({ member }: { member: Member }) {
  const customBubble = member.chatBubble ? resolveMemberChatBubbleStyle(member.chatBubble) : null;
  const sampleText = pickChatBubbleSample(member);

  const bubbleClass = customBubble ? customBubble.className : HOUSE_BUBBLE_LEFT_CLASS;
  const bubbleStyle = customBubble?.style;
  const textColorClass = customBubble ? "" : "text-white";
  const nameClass = customBubble
    ? "text-[color:var(--member-bubble-accent)] opacity-80"
    : HOUSE_BUBBLE_NAME_CLASS;
  const accentStyle = customBubble?.accentStyle;

  const axes = describeBubbleAxes(member);

  return (
    <article className="aura-glass flex flex-col gap-4 rounded-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Portrait member={member} variant="row" />
          <div className="space-y-1">
            <h3 className="font-display text-body font-semibold tracking-tight text-aura-ink">
              {member.name}
            </h3>
            <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
              {member.voice.register}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em] ${
            customBubble ? "bg-aura-ink/5 text-aura-muted" : "bg-[#0a84ff]/10 text-[#0a84ff]"
          }`}
        >
          {customBubble ? "custom" : "default house"}
        </span>
      </header>

      <div className="flex justify-start">
        <div className="flex max-w-[88%] flex-col items-start gap-2" style={accentStyle}>
          <span
            className={`relative z-20 px-3 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-left ${nameClass}`}
          >
            {member.firstName}
          </span>
          <div className={bubbleClass} style={bubbleStyle}>
            <p className={`text-body leading-relaxed ${textColorClass}`}>{sampleText}</p>
          </div>
        </div>
      </div>

      {axes.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 border-t border-aura-hairline pt-3">
          {axes.map((axis) => (
            <li
              key={axis.label}
              className="rounded-pill border border-aura-hairline bg-white/55 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-muted"
            >
              <span className="text-aura-faint">{axis.label}</span>{" "}
              <span className="text-aura-ink">{axis.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-aura-hairline pt-3 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          // falls through to the default house bubble
        </p>
      )}
    </article>
  );
}

function describeBubbleAxes(member: Member): ReadonlyArray<{ label: string; value: string }> {
  const bubble = member.chatBubble;
  if (!bubble) {
    return [];
  }
  const axes: Array<{ label: string; value: string }> = [];
  axes.push({
    label: "bg",
    value: bubble.background.kind === "solid" ? "solid" : `${bubble.background.stops.length}-stop`,
  });
  axes.push({ label: "shape", value: bubble.shape });
  if (bubble.tail) {
    axes.push({ label: "tail", value: bubble.tail });
  }
  if (bubble.border && bubble.border !== "none") {
    axes.push({ label: "border", value: bubble.border });
  }
  if (bubble.glow) {
    axes.push({ label: "glow", value: bubble.glow.intensity });
  }
  if (bubble.texture) {
    axes.push({ label: "texture", value: bubble.texture });
  }
  if (bubble.entryAnimation) {
    axes.push({ label: "anim", value: bubble.entryAnimation });
  }
  if (bubble.fontFamily) {
    axes.push({ label: "font", value: bubble.fontFamily });
  }
  if (bubble.textEffect) {
    axes.push({ label: "fx", value: bubble.textEffect });
  }
  return axes;
}

/* ================================================================== */
/* Test: Notes archive                                                */
/* ================================================================== */

type NotesPreviewState = "full" | "single" | "pairs-only" | "scenarios-only" | "empty";

const NOTES_PREVIEW_STATES: {
  id: NotesPreviewState;
  label: string;
  hint: string;
}[] = [
  { id: "full", label: "full archive", hint: "Many notes across pair, date, and scenario scopes" },
  { id: "single", label: "single lead", hint: "One filed note (only the featured card renders)" },
  { id: "pairs-only", label: "pairs only", hint: "Pair and date scope notes only" },
  { id: "scenarios-only", label: "scenarios only", hint: "Scenario scope notes only" },
  { id: "empty", label: "empty", hint: "No public notes filed yet" },
];

function NotesArchiveTest() {
  const [previewState, setPreviewState] = useState<NotesPreviewState>("full");
  const [shiftCount, setShiftCount] = useState(3);

  const dataset = useMemo(() => buildNotesPreviewDataset(previewState), [previewState]);
  const activeOption =
    NOTES_PREVIEW_STATES.find((option) => option.id === previewState) ?? NOTES_PREVIEW_STATES[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Notes archive"
        description="Mounts the live Notes view with mock public memories so we can preview the filter rail, empty states, and card layouts without playing through to a date wrap. The featured lead card, paired-portrait stack, scenario glyph, and importance rail all render against the same code path the dashboard uses."
      />

      <div className="aura-glass flex flex-wrap items-end gap-x-6 gap-y-4 rounded-card px-5 py-4">
        <div className="space-y-2">
          <MutedLabel>preview state</MutedLabel>
          <div className="inline-flex flex-wrap items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
            {NOTES_PREVIEW_STATES.map((option) => {
              const active = option.id === previewState;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-sfx="click"
                  aria-pressed={active}
                  title={option.hint}
                  onClick={() => setPreviewState(option.id)}
                  className={`cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                    active
                      ? "bg-aura-ink text-white shadow-quiet"
                      : "text-aura-muted hover:text-aura-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <NotesShiftStepper value={shiftCount} onChange={setShiftCount} />

        <div className="ml-auto flex flex-col items-end gap-1">
          <MutedLabel>records loaded</MutedLabel>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            <span className="text-aura-ink tabular-nums">{dataset.memories.length}</span> on file
            <span aria-hidden> · </span>
            <span className="text-aura-ink">{activeOption.label}</span>
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-card bg-white/45 ring-1 ring-aura-hairline">
        <NotesView
          memories={dataset.memories}
          members={dataset.members}
          pairStates={dataset.pairStates}
          scenarios={dataset.scenarios}
          shiftCount={shiftCount}
        />
      </div>
    </motion.section>
  );
}

function NotesShiftStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-2">
      <MutedLabel>shift number</MutedLabel>
      <div className="inline-flex items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
        <button
          type="button"
          aria-label="Decrement shift number"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:text-aura-ink disabled:cursor-not-allowed disabled:text-aura-faint"
        >
          minus
        </button>
        <span className="min-w-12 text-center font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-ink tabular-nums">
          {pad2(value)}
        </span>
        <button
          type="button"
          aria-label="Increment shift number"
          onClick={() => onChange(Math.min(99, value + 1))}
          disabled={value === 99}
          className="cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:text-aura-ink disabled:cursor-not-allowed disabled:text-aura-faint"
        >
          plus
        </button>
      </div>
    </div>
  );
}

type NotesPreviewDataset = {
  members: Member[];
  pairStates: PairState[];
  scenarios: typeof starterScenarios;
  memories: MemoryRecord[];
};

function buildNotesPreviewDataset(state: NotesPreviewState): NotesPreviewDataset {
  const couples: { a: Member; b: Member }[] = [
    { a: jennaPike, b: vhool },
    { a: meiSato, b: bradyStrait },
    { a: eleanorAsh, b: marcusPellish },
  ];

  const pairStates = couples.map(({ a, b }) => buildBoardPairState(a, b, 64));
  const scenarios = starterScenarios;
  const members = starterMembers;

  if (state === "empty") {
    return { members, pairStates, scenarios, memories: [] };
  }

  const all = buildPreviewMemories();

  if (state === "single") {
    return { members, pairStates, scenarios, memories: all.slice(0, 1) };
  }
  if (state === "pairs-only") {
    return {
      members,
      pairStates,
      scenarios,
      memories: all.filter((memory) => memory.scope === "pair" || memory.scope === "date"),
    };
  }
  if (state === "scenarios-only") {
    return {
      members,
      pairStates,
      scenarios,
      memories: all.filter((memory) => memory.scope === "scenario"),
    };
  }

  return { members, pairStates, scenarios, memories: all };
}

function buildPreviewMemories(): MemoryRecord[] {
  const jennaVhool = makePairId(jennaPike.id, vhool.id);
  const meiBrady = makePairId(meiSato.id, bradyStrait.id);
  const eleanorMarcus = makePairId(eleanorAsh.id, marcusPellish.id);

  const records: MemoryRecord[] = [
    {
      id: "preview-pair-jenna-vhool-temporal",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(jennaPike.id, vhool.id),
      pairId: jennaVhool,
      scenarioId: "temporal-coffee-shop",
      dateSessionId: "preview-session-jenna-vhool-1",
      text: "Jenna and Vhool produced a steady warm-up exchange at Temporal Coffee Shop. Vhool kept the questions concrete after Cupid flagged it, and Jenna stopped editing her schedule mid-sentence by exchange three.",
      tags: ["date_summary", "low"],
      importance: 4,
      createdAt: "2026-05-08T19:24:00.000Z",
    },
    {
      id: "preview-date-mei-brady-volcano",
      scope: "date",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: meiBrady,
      scenarioId: "volcano-hot-spring",
      dateSessionId: "preview-session-mei-brady-1",
      text: "Mei and Brady cleared a tense exchange at Hot Spring Inside The Volcano. Brady asked a follow-up about the lab schedule instead of pivoting to himself, and Mei filed a comfort movement upward.",
      tags: ["ai_summary", "high"],
      importance: 5,
      createdAt: "2026-05-08T22:11:00.000Z",
    },
    {
      id: "preview-scenario-temporal-repeat",
      scope: "scenario",
      visibility: "public",
      subjectIds: sortMemberIds(jennaPike.id, vhool.id),
      pairId: jennaVhool,
      scenarioId: "temporal-coffee-shop",
      dateSessionId: "preview-session-jenna-vhool-1",
      text: "Jenna and Vhool have used Temporal Coffee Shop. Repeat bookings should mention that Cupid has a file and that the espresso machine eats one minute every third pull.",
      tags: ["scenario_repeat"],
      importance: 3,
      createdAt: "2026-05-08T19:25:00.000Z",
    },
    {
      id: "preview-pair-eleanor-marcus-listening",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(eleanorAsh.id, marcusPellish.id),
      pairId: eleanorMarcus,
      scenarioId: "listening-booth-after-close",
      dateSessionId: "preview-session-eleanor-marcus-1",
      text: "Eleanor and Marcus filed a clean exchange at Listening Booth After Close. They agreed on a second meeting before Cupid had to suggest one, which is rare on a first booking.",
      tags: ["date_summary", "medium"],
      importance: 3,
      createdAt: "2026-05-07T23:48:00.000Z",
    },
    {
      id: "preview-scenario-diner-cupid-note",
      scope: "scenario",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: meiBrady,
      scenarioId: "diner-eleven-pm",
      dateSessionId: "preview-session-mei-brady-2",
      text: "Diner At Eleven keeps producing comfort movements when Cupid sets a clear closing time. Hold the booth at the back and let the first soda land before the first hard question.",
      tags: ["scenario_repeat", "low"],
      importance: 2,
      createdAt: "2026-05-07T03:02:00.000Z",
    },
    {
      id: "preview-date-jenna-vhool-diner",
      scope: "date",
      visibility: "public",
      subjectIds: sortMemberIds(jennaPike.id, vhool.id),
      pairId: jennaVhool,
      scenarioId: "diner-eleven-pm",
      dateSessionId: "preview-session-jenna-vhool-2",
      text: "Jenna and Vhool kept a steady tempo at Diner At Eleven. Vhool ordered the pancakes a second time without explanation and Jenna let it go, which Cupid is filing as progress.",
      tags: ["ai_summary", "low"],
      importance: 3,
      createdAt: "2026-05-06T04:18:00.000Z",
    },
    {
      id: "preview-pair-mei-brady-temporal",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: meiBrady,
      scenarioId: "temporal-coffee-shop",
      dateSessionId: "preview-session-mei-brady-3",
      text: "Mei and Brady filed a flat second exchange at Temporal Coffee Shop. Cupid logged a fallback filing because the AI judge timed out. Hold the room from the rotation until next shift.",
      tags: ["fallback_summary", "medium"],
      importance: 2,
      createdAt: "2026-05-05T18:33:00.000Z",
    },
    {
      id: "preview-scenario-volcano-room-note",
      scope: "scenario",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: meiBrady,
      scenarioId: "volcano-hot-spring",
      dateSessionId: "preview-session-mei-brady-1",
      text: "Hot Spring Inside The Volcano runs hot for first dates and cool for confessions. Two pairs have reported the temperature ladder cleared a held topic without an intervention.",
      tags: ["scenario_repeat", "high"],
      importance: 4,
      createdAt: "2026-05-05T20:08:00.000Z",
    },
  ];

  return records;
}

/* ================================================================== */
/* Test: Pair board                                                   */
/* ================================================================== */

type PairBoardPreviewState = "dense" | "sparse" | "single-hub" | "unfiled" | "empty";

const PAIR_BOARD_PREVIEW_STATES: {
  id: PairBoardPreviewState;
  label: string;
  hint: string;
}[] = [
  {
    id: "dense",
    label: "dense graph",
    hint: "Many cross-pairs across the roster, multiple hubs",
  },
  {
    id: "sparse",
    label: "sparse graph",
    hint: "A handful of pairs, mostly single connections",
  },
  {
    id: "single-hub",
    label: "single hub",
    hint: "One central member connected to several spokes",
  },
  {
    id: "unfiled",
    label: "unfiled states",
    hint: "Pair states exist but no notes filed yet",
  },
  {
    id: "empty",
    label: "empty",
    hint: "No pair states at all",
  },
];

function PairBoardTest() {
  const [previewState, setPreviewState] = useState<PairBoardPreviewState>("dense");
  const [shiftCount, setShiftCount] = useState(7);

  const dataset = useMemo(() => buildPairBoardPreviewDataset(previewState), [previewState]);
  const activeOption =
    PAIR_BOARD_PREVIEW_STATES.find((option) => option.id === previewState) ??
    PAIR_BOARD_PREVIEW_STATES[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Pair board"
        description="Standalone graph view of filed pair connections. Each member is a node bubble, each filed pair is a curved thread between two nodes. Hover a node to highlight its connections, hover a thread to preview the latest pair note, click anywhere to expand the bespoke detail rail."
      />

      <div className="aura-glass flex flex-wrap items-end gap-x-6 gap-y-4 rounded-card px-5 py-4">
        <div className="space-y-2">
          <MutedLabel>preview state</MutedLabel>
          <div className="inline-flex flex-wrap items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
            {PAIR_BOARD_PREVIEW_STATES.map((option) => {
              const active = option.id === previewState;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-sfx="click"
                  aria-pressed={active}
                  title={option.hint}
                  onClick={() => setPreviewState(option.id)}
                  className={`cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                    active
                      ? "bg-aura-ink text-white shadow-quiet"
                      : "text-aura-muted hover:text-aura-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <NotesShiftStepper value={shiftCount} onChange={setShiftCount} />

        <div className="ml-auto flex flex-col items-end gap-1">
          <MutedLabel>graph contents</MutedLabel>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            <span className="text-aura-ink tabular-nums">{dataset.pairStates.length}</span> pair
            {dataset.pairStates.length === 1 ? "" : "s"}
            <span aria-hidden> · </span>
            <span className="text-aura-ink tabular-nums">{dataset.memories.length}</span> note
            {dataset.memories.length === 1 ? "" : "s"}
            <span aria-hidden> · </span>
            <span className="text-aura-ink">{activeOption.label}</span>
          </span>
        </div>
      </div>

      <PairBoard
        members={dataset.members}
        pairStates={dataset.pairStates}
        memories={dataset.memories}
        scenarios={starterScenarios}
        shiftCount={shiftCount}
      />
    </motion.section>
  );
}

type PairBoardPreviewDataset = {
  members: Member[];
  pairStates: PairState[];
  memories: MemoryRecord[];
};

function buildPairBoardPreviewDataset(state: PairBoardPreviewState): PairBoardPreviewDataset {
  if (state === "empty") {
    return { members: starterMembers, pairStates: [], memories: [] };
  }

  if (state === "single-hub") {
    return buildSingleHubDataset();
  }

  if (state === "sparse") {
    return buildSparseDataset();
  }

  if (state === "unfiled") {
    return buildUnfiledDataset();
  }

  return buildDenseDataset();
}

function buildDenseDataset(): PairBoardPreviewDataset {
  const couples: { a: Member; b: Member; health: number }[] = [
    { a: jennaPike, b: vhool, health: 72 },
    { a: jennaPike, b: bradyStrait, health: 58 },
    { a: jennaPike, b: opalSunday, health: 64 },
    { a: meiSato, b: bradyStrait, health: 81 },
    { a: meiSato, b: gideonGlass, health: 47 },
    { a: meiSato, b: chaYusung, health: 69 },
    { a: eleanorAsh, b: marcusPellish, health: 76 },
    { a: eleanorAsh, b: gideonGlass, health: 52 },
    { a: miraPark, b: chaYusung, health: 60 },
    { a: miraPark, b: tashaRell, health: 66 },
    { a: seraVohn, b: reaver, health: 41 },
    { a: seraVohn, b: vhool, health: 55 },
    { a: naiaVelorae, b: opalSunday, health: 63 },
    { a: tashaRell, b: gideonGlass, health: 49 },
  ];

  const pairStates = couples.map(({ a, b, health }) => buildBoardPairState(a, b, health));
  const memories = buildDenseMemories();
  const members = collectMembers(couples);
  return { members, pairStates, memories };
}

function buildSparseDataset(): PairBoardPreviewDataset {
  const couples: { a: Member; b: Member; health: number }[] = [
    { a: jennaPike, b: vhool, health: 64 },
    { a: meiSato, b: bradyStrait, health: 70 },
    { a: eleanorAsh, b: marcusPellish, health: 55 },
    { a: miraPark, b: chaYusung, health: 48 },
  ];
  const pairStates = couples.map(({ a, b, health }) => buildBoardPairState(a, b, health));
  const members = collectMembers(couples);
  const memories: MemoryRecord[] = [
    {
      id: "preview-pair-jenna-vhool-sparse-1",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(jennaPike.id, vhool.id),
      pairId: makePairId(jennaPike.id, vhool.id),
      scenarioId: "temporal-coffee-shop",
      dateSessionId: "preview-sparse-1",
      text: "Jenna and Vhool produced a steady warm-up exchange at Temporal Coffee Shop. Vhool kept the questions concrete after Cupid flagged it.",
      tags: ["date_summary", "low"],
      importance: 3,
      createdAt: "2026-05-09T18:20:00.000Z",
    },
    {
      id: "preview-pair-mei-brady-sparse-1",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: makePairId(meiSato.id, bradyStrait.id),
      scenarioId: "volcano-hot-spring",
      dateSessionId: "preview-sparse-2",
      text: "Mei and Brady cleared a tense exchange at Hot Spring Inside The Volcano. Brady asked a follow-up about the lab schedule instead of pivoting to himself.",
      tags: ["date_summary", "high"],
      importance: 5,
      createdAt: "2026-05-08T22:11:00.000Z",
    },
    {
      id: "preview-pair-eleanor-marcus-sparse-1",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(eleanorAsh.id, marcusPellish.id),
      pairId: makePairId(eleanorAsh.id, marcusPellish.id),
      scenarioId: "listening-booth-after-close",
      dateSessionId: "preview-sparse-3",
      text: "Eleanor and Marcus filed a clean exchange at Listening Booth After Close. They agreed on a second meeting before Cupid had to suggest one.",
      tags: ["date_summary", "medium"],
      importance: 3,
      createdAt: "2026-05-07T23:48:00.000Z",
    },
    {
      id: "preview-pair-mira-cha-sparse-1",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(miraPark.id, chaYusung.id),
      pairId: makePairId(miraPark.id, chaYusung.id),
      scenarioId: "world-sim-operator-booth",
      dateSessionId: "preview-sparse-4",
      text: "Mira and Cha kept a quiet bench at World-Sim Operator Booth. Neither pushed for an answer and the room let it be.",
      tags: ["date_summary", "low"],
      importance: 2,
      createdAt: "2026-05-06T21:02:00.000Z",
    },
  ];
  return { members, pairStates, memories };
}

function buildSingleHubDataset(): PairBoardPreviewDataset {
  const hub = meiSato;
  const spokes: {
    partner: Member;
    health: number;
    importance: 1 | 2 | 3 | 4 | 5;
    scenario: string;
    text: string;
    createdAt: string;
  }[] = [
    {
      partner: bradyStrait,
      health: 78,
      importance: 5,
      scenario: "volcano-hot-spring",
      text: "Mei and Brady cleared a tense exchange at Hot Spring Inside The Volcano. Brady asked a follow-up about the lab schedule instead of pivoting to himself.",
      createdAt: "2026-05-09T22:11:00.000Z",
    },
    {
      partner: gideonGlass,
      health: 51,
      importance: 3,
      scenario: "underworld-department-mixer",
      text: "Mei and Gideon held a flat first exchange at Underworld Department Mixer. Gideon read the room and shifted the topic before the second round.",
      createdAt: "2026-05-08T20:14:00.000Z",
    },
    {
      partner: chaYusung,
      health: 65,
      importance: 4,
      scenario: "world-sim-operator-booth",
      text: "Mei and Cha shared a steady debrief at World-Sim Operator Booth. Cha drew a workplace boundary cleanly and Mei did not push.",
      createdAt: "2026-05-07T19:33:00.000Z",
    },
    {
      partner: jennaPike,
      health: 60,
      importance: 3,
      scenario: "temporal-coffee-shop",
      text: "Mei and Jenna kept a warm pace at Temporal Coffee Shop. Jenna stopped editing her schedule by exchange three.",
      createdAt: "2026-05-06T17:48:00.000Z",
    },
    {
      partner: opalSunday,
      health: 44,
      importance: 2,
      scenario: "diner-eleven-pm",
      text: "Mei and Opal logged a quiet round at Diner At Eleven. Cupid filed a fallback summary because the judge timed out.",
      createdAt: "2026-05-05T03:18:00.000Z",
    },
  ];

  const couples = spokes.map((s) => ({ a: hub, b: s.partner, health: s.health }));
  const pairStates = couples.map(({ a, b, health }) => buildBoardPairState(a, b, health));
  const members = collectMembers(couples);
  const memories: MemoryRecord[] = spokes.map((spoke, index) => ({
    id: `preview-hub-${spoke.partner.id}-${index}`,
    scope: "pair",
    visibility: "public",
    subjectIds: sortMemberIds(hub.id, spoke.partner.id),
    pairId: makePairId(hub.id, spoke.partner.id),
    scenarioId: spoke.scenario,
    dateSessionId: `preview-hub-${index}`,
    text: spoke.text,
    tags: ["date_summary"],
    importance: spoke.importance,
    createdAt: spoke.createdAt,
  }));
  return { members, pairStates, memories };
}

function buildUnfiledDataset(): PairBoardPreviewDataset {
  const couples: { a: Member; b: Member; health: number }[] = [
    { a: jennaPike, b: vhool, health: 60 },
    { a: meiSato, b: bradyStrait, health: 60 },
    { a: eleanorAsh, b: marcusPellish, health: 60 },
    { a: miraPark, b: chaYusung, health: 60 },
    { a: seraVohn, b: reaver, health: 60 },
    { a: gideonGlass, b: tashaRell, health: 60 },
  ];
  const pairStates = couples.map(({ a, b, health }) => buildBoardPairState(a, b, health));
  const members = collectMembers(couples);
  return { members, pairStates, memories: [] };
}

function buildDenseMemories(): MemoryRecord[] {
  const items: {
    a: Member;
    b: Member;
    scenario: string;
    text: string;
    tags: string[];
    importance: 1 | 2 | 3 | 4 | 5;
    iso: string;
    idTag: string;
  }[] = [
    {
      a: jennaPike,
      b: vhool,
      scenario: "temporal-coffee-shop",
      text: "Jenna and Vhool produced a steady warm-up exchange at Temporal Coffee Shop. Vhool kept the questions concrete after Cupid flagged it, and Jenna stopped editing her schedule by exchange three.",
      tags: ["date_summary", "low"],
      importance: 4,
      iso: "2026-05-09T18:24:00.000Z",
      idTag: "jenna-vhool-temporal",
    },
    {
      a: jennaPike,
      b: vhool,
      scenario: "diner-eleven-pm",
      text: "Jenna and Vhool kept a steady tempo at Diner At Eleven. Vhool ordered the pancakes a second time without explanation and Jenna let it go.",
      tags: ["date_summary", "low"],
      importance: 3,
      iso: "2026-05-07T04:18:00.000Z",
      idTag: "jenna-vhool-diner",
    },
    {
      a: jennaPike,
      b: bradyStrait,
      scenario: "executive-lunch-one-agenda-item",
      text: "Jenna and Brady held a clipped exchange at Executive Lunch One Agenda Item. Brady tried a single agenda item and Jenna gave it back to him cleaner.",
      tags: ["date_summary", "medium"],
      importance: 3,
      iso: "2026-05-08T13:02:00.000Z",
      idTag: "jenna-brady-exec",
    },
    {
      a: jennaPike,
      b: opalSunday,
      scenario: "open-house-sunday",
      text: "Jenna and Opal toured Open House Sunday and filed a pleasant first exchange. Opal asked for a follow-up before Cupid prompted.",
      tags: ["date_summary", "medium"],
      importance: 4,
      iso: "2026-05-09T15:11:00.000Z",
      idTag: "jenna-opal-open",
    },
    {
      a: meiSato,
      b: bradyStrait,
      scenario: "volcano-hot-spring",
      text: "Mei and Brady cleared a tense exchange at Hot Spring Inside The Volcano. Brady asked a follow-up about the lab schedule instead of pivoting to himself, and Mei filed a comfort movement upward.",
      tags: ["date_summary", "high"],
      importance: 5,
      iso: "2026-05-09T22:11:00.000Z",
      idTag: "mei-brady-volcano",
    },
    {
      a: meiSato,
      b: bradyStrait,
      scenario: "temporal-coffee-shop",
      text: "Mei and Brady filed a flat second exchange at Temporal Coffee Shop. Cupid logged a fallback filing because the AI judge timed out.",
      tags: ["fallback_summary", "medium"],
      importance: 2,
      iso: "2026-05-05T18:33:00.000Z",
      idTag: "mei-brady-temporal",
    },
    {
      a: meiSato,
      b: gideonGlass,
      scenario: "underworld-department-mixer",
      text: "Mei and Gideon held a flat first exchange at Underworld Department Mixer. Gideon read the room and shifted the topic before the second round.",
      tags: ["date_summary", "low"],
      importance: 3,
      iso: "2026-05-08T20:14:00.000Z",
      idTag: "mei-gideon-underworld",
    },
    {
      a: meiSato,
      b: chaYusung,
      scenario: "world-sim-operator-booth",
      text: "Mei and Cha shared a steady debrief at World-Sim Operator Booth. Cha drew a workplace boundary cleanly and Mei did not push.",
      tags: ["date_summary", "medium"],
      importance: 4,
      iso: "2026-05-07T19:33:00.000Z",
      idTag: "mei-cha-worldsim",
    },
    {
      a: eleanorAsh,
      b: marcusPellish,
      scenario: "listening-booth-after-close",
      text: "Eleanor and Marcus filed a clean exchange at Listening Booth After Close. They agreed on a second meeting before Cupid had to suggest one, which is rare on a first booking.",
      tags: ["date_summary", "medium"],
      importance: 4,
      iso: "2026-05-08T23:48:00.000Z",
      idTag: "eleanor-marcus-listening",
    },
    {
      a: eleanorAsh,
      b: gideonGlass,
      scenario: "memory-course-dinner",
      text: "Eleanor and Gideon ran cool through Memory Course Dinner. Gideon paced his stories and Eleanor matched him for a clean exit.",
      tags: ["date_summary", "low"],
      importance: 3,
      iso: "2026-05-06T20:22:00.000Z",
      idTag: "eleanor-gideon-memory",
    },
    {
      a: miraPark,
      b: chaYusung,
      scenario: "park-loop-with-a-dog",
      text: "Mira and Cha walked Park Loop With A Dog and kept the pace easy. Mira deferred to Cha on a tense neighbor and Cha noticed.",
      tags: ["date_summary", "medium"],
      importance: 3,
      iso: "2026-05-09T16:54:00.000Z",
      idTag: "mira-cha-park",
    },
    {
      a: miraPark,
      b: tashaRell,
      scenario: "bowling-league-night",
      text: "Mira and Tasha closed Bowling League Night without a hard topic. Tasha telegraphed her interest before the score reset and Mira rolled with it.",
      tags: ["date_summary", "low"],
      importance: 3,
      iso: "2026-05-08T22:39:00.000Z",
      idTag: "mira-tasha-bowling",
    },
    {
      a: seraVohn,
      b: reaver,
      scenario: "phantom-doorbell-suite",
      text: "Sera and Reaver filed a tense pass through Phantom Doorbell Suite. Reaver tested an entry early and Sera held the line without escalating.",
      tags: ["date_summary", "high"],
      importance: 5,
      iso: "2026-05-09T01:02:00.000Z",
      idTag: "sera-reaver-phantom",
    },
    {
      a: seraVohn,
      b: vhool,
      scenario: "midnight-notary-two-clean-promises",
      text: "Sera and Vhool walked Midnight Notary clean. Vhool signed both promises without an edit and Sera kept the silence after.",
      tags: ["date_summary", "high"],
      importance: 4,
      iso: "2026-05-08T04:18:00.000Z",
      idTag: "sera-vhool-notary",
    },
    {
      a: naiaVelorae,
      b: opalSunday,
      scenario: "moon-picnic",
      text: "Naia and Opal kept Moon Picnic still and unhurried. Naia named what was on her mind and Opal answered without filling.",
      tags: ["date_summary", "medium"],
      importance: 4,
      iso: "2026-05-09T03:14:00.000Z",
      idTag: "naia-opal-moon",
    },
    {
      a: tashaRell,
      b: gideonGlass,
      scenario: "hardware-store-one-project",
      text: "Tasha and Gideon split Hardware Store One Project into halves. Gideon picked his half first and Tasha did not negotiate.",
      tags: ["date_summary", "low"],
      importance: 2,
      iso: "2026-05-06T17:09:00.000Z",
      idTag: "tasha-gideon-hardware",
    },
  ];

  return items.map((entry, index) => ({
    id: `preview-board-${entry.idTag}-${index}`,
    scope: "pair" as const,
    visibility: "public" as const,
    subjectIds: sortMemberIds(entry.a.id, entry.b.id),
    pairId: makePairId(entry.a.id, entry.b.id),
    scenarioId: entry.scenario,
    dateSessionId: `preview-board-session-${index}`,
    text: entry.text,
    tags: entry.tags,
    importance: entry.importance,
    createdAt: entry.iso,
  }));
}

function buildBoardPairState(a: Member, b: Member, health: number): PairState {
  return {
    id: makePairId(a.id, b.id),
    participantIds: sortMemberIds(a.id, b.id),
    stats: {
      chemistry: 65,
      trust: 60,
      stability: 55,
      conflict: 25,
      weirdnessTolerance: 70,
      spark: 60,
      strain: 30,
      relationshipHealth: health,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
  };
}

function collectMembers(couples: { a: Member; b: Member }[]): Member[] {
  const seen = new Set<string>();
  const ordered: Member[] = [];
  for (const { a, b } of couples) {
    if (!seen.has(a.id)) {
      ordered.push(a);
      seen.add(a.id);
    }
    if (!seen.has(b.id)) {
      ordered.push(b);
      seen.add(b.id);
    }
  }
  // Pad with a few un-paired starter members so the off-the-board chip strip
  // has content to render and we can validate the empty-degree case.
  for (const member of starterMembers) {
    if (ordered.length >= 18) break;
    if (seen.has(member.id)) continue;
    ordered.push(member);
    seen.add(member.id);
  }
  return ordered;
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

/* ================================================================== */
/* Run sheet                                                          */
/* ================================================================== */

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
        className="mt-3 block w-full resize-y rounded-tile border border-aura-hairline bg-white/55 px-3 py-2 font-mono text-xs leading-5 text-aura-muted outline-none"
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

type MoodTintSelection = "off" | "auto" | PortraitMood;

const MOOD_TINT_OPTIONS: ReadonlyArray<{ value: MoodTintSelection; label: string }> = [
  { value: "off", label: "off" },
  { value: "auto", label: "auto (sides)" },
  { value: "neutral", label: "neutral" },
  { value: "flirty", label: "flirty" },
  { value: "confused", label: "confused" },
  { value: "angry", label: "angry" },
];

const MICRO_MOTION_LABELS: Record<ScenarioBackdropMicroMotion, string> = {
  off: "off",
  drift: "drift",
  pointer: "pointer",
  "drift-pointer": "drift + pointer",
};

const PARTICLE_STYLE_LABELS: Record<ScenarioBackdropParticleStyle, string> = {
  off: "off",
  motes: "motes",
  embers: "embers",
  snow: "snow",
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
    label: "bottom-right",
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

/* ================================================================== */
/* Test: Height lineup                                                */
/* ================================================================== */

type HeightLineupSort = "visible-desc" | "height-desc" | "height-asc" | "roster" | "name";

const HEIGHT_LINEUP_SORT_OPTIONS: ReadonlyArray<{ value: HeightLineupSort; label: string }> = [
  { value: "visible-desc", label: "Visible height" },
  { value: "height-desc", label: "Tallest first" },
  { value: "height-asc", label: "Shortest first" },
  { value: "roster", label: "Roster order" },
  { value: "name", label: "Name" },
];

const HEIGHT_ANCHOR_MEMBER_IDS = [
  "derek-halsey",
  "alex-yoon",
  "gabriel-tan",
  "noah-kim",
  "ryan-doyle",
] as const;
const KNOWN_HEIGHT_ANCHOR_IDS = new Set<string>(HEIGHT_ANCHOR_MEMBER_IDS);
const HEIGHT_GUIDE_IN_INCHES = 72;
const HEIGHT_LINEUP_GUIDE_BOTTOM_CLASS = "bottom-[29.07rem]";
const HEIGHT_LINEUP_Z_CLASSES = [
  "z-[1]",
  "z-[2]",
  "z-[3]",
  "z-[4]",
  "z-[5]",
  "z-[6]",
  "z-[7]",
  "z-[8]",
  "z-[9]",
  "z-[10]",
  "z-[11]",
  "z-[12]",
  "z-[13]",
  "z-[14]",
  "z-[15]",
  "z-[16]",
  "z-[17]",
  "z-[18]",
  "z-[19]",
  "z-[20]",
  "z-[21]",
  "z-[22]",
  "z-[23]",
  "z-[24]",
  "z-[25]",
  "z-[26]",
  "z-[27]",
  "z-[28]",
  "z-[29]",
  "z-[30]",
  "z-[31]",
  "z-[32]",
  "z-[33]",
  "z-[34]",
  "z-[35]",
  "z-[36]",
  "z-[37]",
  "z-[38]",
  "z-[39]",
  "z-[40]",
] as const;
const HEIGHT_LINEUP_BACKGROUND_MEMBER_IDS = new Set<string>(["junie-marrow"]);
const HEIGHT_LINEUP_BACKGROUND_Z_CLASS = "z-0";

function HeightLineupTest() {
  const [sort, setSort] = useState<HeightLineupSort>("visible-desc");
  const [showHeightGuide, setShowHeightGuide] = useState(true);
  const stageScrollRef = useRef<HTMLDivElement>(null);
  const sortedMembers = useMemo(() => sortHeightLineupMembers(starterMembers, sort), [sort]);
  const shortestMember = sortedMembers.reduce((shortest, member) =>
    member.characterHeightInInches < shortest.characterHeightInInches ? member : shortest,
  );
  const tallestMember = sortedMembers.reduce((tallest, member) =>
    member.characterHeightInInches > tallest.characterHeightInInches ? member : tallest,
  );

  function scrollToMember(memberId: string) {
    const stage = stageScrollRef.current;
    if (stage === null) {
      return;
    }
    const target = stage.querySelector<HTMLElement>(`[data-member-id="${memberId}"]`);
    target?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Height lineup"
        description="Neutral cutouts rendered through the live date standee path. Derek anchors the 6 ft guide from his 6 ft 4 in visual height."
      />

      <div className="aura-glass relative z-20 flex flex-wrap items-center justify-between gap-4 rounded-card px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <MutedLabel>height canon</MutedLabel>
          <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            <span className="text-aura-ink tabular-nums">{starterMembers.length}</span> members
            <span aria-hidden> · </span>
            {formatMemberHeightLabel(shortestMember.characterHeightInInches)}
            <span aria-hidden> to </span>
            {formatMemberHeightLabel(tallestMember.characterHeightInInches)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={showHeightGuide}
            onClick={() => setShowHeightGuide((current) => !current)}
            className={`cursor-pointer rounded-pill px-3 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
              showHeightGuide
                ? "bg-aura-ink text-white shadow-[0_10px_24px_-16px_rgba(15,23,42,0.55)]"
                : "border border-aura-hairline bg-white/55 text-aura-muted hover:border-aura-hairline-strong hover:text-aura-ink"
            }`}
          >
            {showHeightGuide ? "6 ft guide on" : "6 ft guide off"}
          </button>
          <SelectInput<HeightLineupSort>
            label="sort"
            value={sort}
            options={HEIGHT_LINEUP_SORT_OPTIONS}
            onChange={setSort}
            layout="inline"
            align="right"
          />
        </div>
      </div>

      <HeightAnchorStrip onSelect={scrollToMember} />
      <div className="relative left-1/2 w-screen -translate-x-1/2 px-6">
        <HeightLineupStage
          members={sortedMembers}
          showHeightGuide={showHeightGuide}
          scrollRef={stageScrollRef}
        />
      </div>
    </motion.section>
  );
}

function sortHeightLineupMembers(
  members: readonly Member[],
  sort: HeightLineupSort,
): readonly Member[] {
  const indexedMembers = members.map((member, index) => ({ member, index }));

  indexedMembers.sort((first, second) => {
    if (sort === "visible-desc") {
      return (
        resolveHeightLineupVisibleHeight(second.member) -
          resolveHeightLineupVisibleHeight(first.member) || first.index - second.index
      );
    }
    if (sort === "height-desc") {
      return (
        second.member.characterHeightInInches - first.member.characterHeightInInches ||
        first.index - second.index
      );
    }
    if (sort === "height-asc") {
      return (
        first.member.characterHeightInInches - second.member.characterHeightInInches ||
        first.index - second.index
      );
    }
    if (sort === "name") {
      return first.member.name.localeCompare(second.member.name);
    }
    return first.index - second.index;
  });

  return indexedMembers.map((entry) => entry.member);
}

function resolveHeightLineupVisibleHeight(member: Member): number {
  const heightScale = resolveStandeeHeightScale(member.standeeRenderHeightInInches).value;
  const sourceScale = resolveStandeeSourceScale(member.id).value;
  const footing = resolveStandeeFooting(member.portraits.neutral.portrait.cutoutPath);
  return footing.renderedVisibleHeightRatio * heightScale * sourceScale;
}

function buildHeightLineupZClassByMemberId(
  members: readonly Member[],
): ReadonlyMap<string, string> {
  const sortedMembers = [...members].sort(
    (first, second) =>
      resolveHeightLineupVisibleHeight(first) - resolveHeightLineupVisibleHeight(second) ||
      first.name.localeCompare(second.name),
  );
  const zClassByMemberId = new Map<string, string>();
  const maxIndex = HEIGHT_LINEUP_Z_CLASSES.length - 1;
  let foregroundIndex = 0;

  sortedMembers.forEach((member) => {
    if (HEIGHT_LINEUP_BACKGROUND_MEMBER_IDS.has(member.id)) {
      zClassByMemberId.set(member.id, HEIGHT_LINEUP_BACKGROUND_Z_CLASS);
      return;
    }

    zClassByMemberId.set(member.id, HEIGHT_LINEUP_Z_CLASSES[Math.min(foregroundIndex, maxIndex)]);
    foregroundIndex += 1;
  });

  return zClassByMemberId;
}

function HeightAnchorStrip({ onSelect }: { onSelect: (memberId: string) => void }) {
  const anchorMembers = HEIGHT_ANCHOR_MEMBER_IDS.map((memberId) =>
    starterMembers.find((member) => member.id === memberId),
  ).filter((member): member is Member => member !== undefined);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {anchorMembers.map((member) => {
        const scale = resolveStandeeHeightScale(member.standeeRenderHeightInInches);
        const sourceScale = resolveStandeeSourceScale(member.id);
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            aria-label={`Scroll stage to ${member.name}`}
            className="aura-glass group cursor-pointer rounded-card px-3 py-2.5 text-left outline-none transition hover:border-aura-rose/40 hover:shadow-card focus-visible:border-aura-rose"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-body font-semibold tracking-tight text-aura-ink">
                  {member.name}
                </span>
                <span className="mt-1 block whitespace-nowrap font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
                  locked anchor
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-pill bg-aura-rose/10 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.14em] text-aura-rose ring-1 ring-aura-rose/20">
                {formatMemberHeightLabel(member.characterHeightInInches)}
              </span>
            </span>
            <span className="mt-2 block whitespace-nowrap font-mono text-micro uppercase tracking-[0.18em] text-aura-muted">
              h scale <span className="tabular-nums text-aura-ink">{scale.value.toFixed(2)}</span>
              <span aria-hidden> · </span>
              src <span className="tabular-nums text-aura-ink">{sourceScale.value.toFixed(2)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function HeightLineupStage({
  members,
  showHeightGuide,
  scrollRef,
}: {
  members: readonly Member[];
  showHeightGuide: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const zClassByMemberId = useMemo(() => buildHeightLineupZClassByMemberId(members), [members]);

  return (
    <div className="aura-glass overflow-hidden rounded-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-aura-hairline px-5 py-4">
        <div>
          <MutedLabel>standee stage</MutedLabel>
          <p className="mt-1 text-label text-aura-muted">
            Uniform scale, bottom anchored. The guide line and anchor faces expose source-scale
            drift.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showHeightGuide ? (
            <span className="rounded-pill bg-aura-rose/10 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose ring-1 ring-aura-rose/20">
              guide {formatMemberHeightLabel(HEIGHT_GUIDE_IN_INCHES)}
            </span>
          ) : null}
          <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            horizontal audit
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden scroll-smooth">
        <div className="relative flex min-w-max items-end px-10 pb-6 pt-10">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 bottom-[5.5rem] z-0 h-px bg-aura-hairline-strong"
          />
          {showHeightGuide ? (
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-x-10 ${HEIGHT_LINEUP_GUIDE_BOTTOM_CLASS} z-0 h-px bg-aura-rose/60 shadow-[0_0_18px_rgba(244,63,94,0.28)]`}
            />
          ) : null}
          {members.map((member) => (
            <HeightLineupMember
              key={member.id}
              member={member}
              zClass={zClassByMemberId.get(member.id) ?? HEIGHT_LINEUP_Z_CLASSES[0]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeightLineupMember({ member, zClass }: { member: Member; zClass: string }) {
  const scale = resolveStandeeHeightScale(member.standeeRenderHeightInInches);
  const sourceScale = resolveStandeeSourceScale(member.id);
  const isKnownAnchor = KNOWN_HEIGHT_ANCHOR_IDS.has(member.id);

  return (
    <article
      data-member-id={member.id}
      className={`relative -ml-7 h-[36rem] w-36 shrink-0 scroll-mx-10 first:ml-0 ${zClass}`}
    >
      {isKnownAnchor ? (
        <span className="absolute top-2 left-1/2 z-20 -translate-x-1/2 rounded-pill bg-aura-rose/10 px-1.5 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-rose ring-1 ring-aura-rose/20 backdrop-blur-sm">
          anchor
        </span>
      ) : null}
      <DaterStandee
        member={member}
        placement="bottom-left"
        reactions={[]}
        className="absolute bottom-20 left-1/2 h-96 w-48 -translate-x-1/2 origin-bottom"
      />
      <footer className="absolute bottom-1 left-1/2 w-[6.75rem] -translate-x-1/2 rounded-tile bg-white/70 px-2 py-1 text-center ring-1 ring-aura-hairline backdrop-blur-sm">
        <p className="truncate font-display text-xs font-semibold leading-tight tracking-tight text-aura-ink">
          {member.firstName}
        </p>
        <p className="mt-0.5 whitespace-nowrap font-mono text-micro uppercase leading-tight tracking-[0.08em] text-aura-faint">
          {formatMemberHeightLabel(member.characterHeightInInches)}
        </p>
        <div className="mx-auto mt-1 grid w-fit grid-cols-[auto_auto] gap-x-1.5 font-mono text-micro uppercase leading-tight tracking-[0.06em] text-aura-muted">
          <span>h</span>
          <span className="tabular-nums text-aura-ink">{scale.value.toFixed(2)}</span>
          <span>src</span>
          <span className="tabular-nums text-aura-ink">{sourceScale.value.toFixed(2)}</span>
        </div>
      </footer>
    </article>
  );
}

function DateReactionsTest() {
  const [leftSide, setLeftSide] = useState<SideState>(() => defaultSideState(jennaPike.id));
  const [rightSide, setRightSide] = useState<SideState>(() => defaultSideState(vhool.id));
  const [intensity, setIntensity] = useState<ReactionIntensity>(2);
  const [backdropScenarioId, setBackdropScenarioId] = useState<string>("");
  const [availableBackdropIds, setAvailableBackdropIds] = useState<readonly string[]>([]);
  const [microMotion, setMicroMotion] = useState<ScenarioBackdropMicroMotion>("drift");
  const [particleStyle, setParticleStyle] = useState<ScenarioBackdropParticleStyle>("motes");
  const [moodTint, setMoodTint] = useState<MoodTintSelection>("auto");

  const leftMember = starterMembers.find((member) => member.id === leftSide.memberId) ?? jennaPike;
  const rightMember = starterMembers.find((member) => member.id === rightSide.memberId) ?? vhool;

  useEffect(() => {
    let isCurrent = true;
    void loadScenarioBackdropIds().then((ids) => {
      if (isCurrent) {
        setAvailableBackdropIds(Array.from(ids));
      }
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  const backdropOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [
      { value: "", label: "None (fallback)" },
    ];
    availableBackdropIds.forEach((id) => {
      const scenario = starterScenarios.find((candidate) => candidate.id === id);
      options.push({ value: id, label: scenario?.title ?? id });
    });
    return options;
  }, [availableBackdropIds]);

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
        backdropScenarioId={backdropScenarioId}
        backdropOptions={backdropOptions}
        microMotion={microMotion}
        particleStyle={particleStyle}
        moodTint={moodTint}
        onBackdropChange={setBackdropScenarioId}
        onMicroMotionChange={setMicroMotion}
        onParticleStyleChange={setParticleStyle}
        onMoodTintChange={setMoodTint}
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
        // active bench
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
  backdropScenarioId,
  backdropOptions,
  microMotion,
  particleStyle,
  moodTint,
  onBackdropChange,
  onMicroMotionChange,
  onParticleStyleChange,
  onMoodTintChange,
}: {
  leftMember: Member;
  rightMember: Member;
  leftSide: SideState;
  rightSide: SideState;
  backdropScenarioId: string;
  backdropOptions: ReadonlyArray<{ value: string; label: string }>;
  microMotion: ScenarioBackdropMicroMotion;
  particleStyle: ScenarioBackdropParticleStyle;
  moodTint: MoodTintSelection;
  onBackdropChange: (value: string) => void;
  onMicroMotionChange: (value: ScenarioBackdropMicroMotion) => void;
  onParticleStyleChange: (value: ScenarioBackdropParticleStyle) => void;
  onMoodTintChange: (value: MoodTintSelection) => void;
}) {
  const activeBackdropId = backdropScenarioId === "" ? undefined : backdropScenarioId;
  const resolvedMoodTint =
    moodTint === "off"
      ? undefined
      : moodTint === "auto"
        ? selectDominantMood(leftSide.mood, rightSide.mood)
        : moodTint;
  const microMotionOptions = SCENARIO_BACKDROP_MICRO_MOTION_VARIANTS.map((value) => ({
    value,
    label: MICRO_MOTION_LABELS[value],
  }));
  const particleStyleOptions = SCENARIO_BACKDROP_PARTICLE_STYLES.map((value) => ({
    value,
    label: PARTICLE_STYLE_LABELS[value],
  }));

  return (
    <div className="aura-glass-strong relative overflow-hidden rounded-card">
      <header className="relative z-10 space-y-3 border-b border-aura-hairline/60 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
            // stage backdrop
          </span>
          <SelectInput
            label="scenario"
            value={backdropScenarioId}
            options={backdropOptions}
            onChange={onBackdropChange}
            layout="inline"
            align="right"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <SelectInput<ScenarioBackdropMicroMotion>
            label="motion"
            value={microMotion}
            options={microMotionOptions}
            onChange={onMicroMotionChange}
            layout="inline"
            align="right"
          />
          <SelectInput<ScenarioBackdropParticleStyle>
            label="particles"
            value={particleStyle}
            options={particleStyleOptions}
            onChange={onParticleStyleChange}
            layout="inline"
            align="right"
          />
          <SelectInput<MoodTintSelection>
            label="mood tint"
            value={moodTint}
            options={MOOD_TINT_OPTIONS}
            onChange={onMoodTintChange}
            layout="inline"
            align="right"
          />
        </div>
      </header>

      <div className="relative h-[68vh] min-h-[520px] w-full overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(244,63,94,0.08),transparent_70%)]"
        />
        <ScenarioBackdropLayer
          scenarioId={activeBackdropId}
          containment="absolute"
          microMotion={microMotion}
          particles={particleStyle}
          moodTint={resolvedMoodTint}
        />
        <DaterStandee
          member={leftMember}
          placement="bottom-left"
          mood={leftSide.mood}
          reactions={leftSide.reactions}
          className="absolute bottom-0 left-6 h-full w-48 lg:left-16 lg:w-64"
        />
        <DaterStandee
          member={rightMember}
          placement="bottom-right"
          mood={rightSide.mood}
          reactions={rightSide.reactions}
          className="absolute bottom-0 right-6 h-full w-48 lg:right-16 lg:w-64"
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
