import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";

import { EASE_OUT_QUART, Eyebrow, MutedLabel } from "../components/dashboard-atoms";
import { AiPromptLabTest } from "./playground/tests/ai-prompt-lab";
import { AllMembersTest } from "./playground/tests/all-members";
import { ChatBubbleGalleryTest } from "./playground/tests/chat-bubble-gallery";
import { DateReactionsTest } from "./playground/tests/date-reactions";
import { HeightLineupTest } from "./playground/tests/height-lineup";
import { NotesArchiveTest } from "./playground/tests/notes-archive";
import { PairBoardTest } from "./playground/tests/pair-board";

const PLAYGROUND_TESTS = [
  {
    id: "ai-lab",
    title: "AI prompt bench",
    summary: "Character turn prompting, one-on-one chat, model choice, sampling.",
  },
  {
    id: "all-members",
    title: "Member dossier",
    summary: "Every field on every member, with a roster rail and avatar IDs for quick switching.",
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
    <main className="relative min-h-screen overflow-x-clip bg-aura-bg text-aura-ink">
      <AmbientMesh />
      <DotGridLayer />
      <PlaygroundTopBar />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-28 lg:px-10 lg:pt-32">
        <PlaygroundHeader activeTestId={activeTestId} onSelect={setActiveTestId} />

        <div className="mt-10 min-w-0">
          {activeTestId === "ai-lab" ? <AiPromptLabTest /> : null}
          {activeTestId === "all-members" ? <AllMembersTest /> : null}
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
