import { motion } from "motion/react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router";

import { EASE_OUT_QUART, Eyebrow, MutedLabel } from "../components/dashboard-atoms";
import { AiPromptLabTest } from "./playground/tests/ai-prompt-lab";
import { AllMembersTest } from "./playground/tests/all-members";
import { ChatBubbleGalleryTest } from "./playground/tests/chat-bubble-gallery";
import { ConstellationLobbyTest } from "./playground/tests/constellation-lobby";
import { DateReactionsTest } from "./playground/tests/date-reactions";
import {
  ClosureCampaignLabTest,
  DateSessionLabTest,
  DeckWorkshopTest,
  FinalReportLabTest,
  FocusEconomyLabTest,
  ShiftPlanningLabTest,
} from "./playground/tests/gameplay-loop-labs";
import { HeightLineupTest } from "./playground/tests/height-lineup";
import { MatchFitMatrixTest } from "./playground/tests/match-fit-matrix";
import { MemoryLabTest } from "./playground/tests/memory-lab";
import { PlayerKnowledgeRevealLabTest } from "./playground/tests/player-knowledge-reveal-lab";
import { ShiftFollowUpSimulatorTest } from "./playground/tests/shift-follow-up-simulator";

/* ================================================================== */
/* Bench registry. Grouped by `category` so the rail stays scannable   */
/* as benches are added. Array order is also display + step order, so   */
/* keep entries inside their category block.                            */
/* ================================================================== */

const PLAYGROUND_TESTS = [
  {
    id: "ai-lab",
    category: "AI & memory",
    title: "AI prompt bench",
    summary: "Character turn prompting, one-on-one chat, model choice, sampling.",
  },
  {
    id: "memory-lab",
    category: "AI & memory",
    title: "Memory lab",
    summary: "Pair agreements, open loops, aging, strain, follow-up cleanup, and prompt spotlight.",
  },
  {
    id: "reveal-lab",
    category: "AI & memory",
    title: "Reveal lab",
    summary:
      "Player knowledge candidates, transcript eligibility, filed reads, and member modal view.",
  },
  {
    id: "date-session",
    category: "Gameplay loop",
    title: "Date session lab",
    summary: "Booking, scene drafting, Cupid reads, scene drops, cut-short gates, and wrap states.",
  },
  {
    id: "shift-planning",
    category: "Gameplay loop",
    title: "Shift planning lab",
    summary:
      "Partner availability, cooldown, follow-up reservations, lead asks, and active bookings.",
  },
  {
    id: "deck-workshop",
    category: "Gameplay loop",
    title: "Date Book lab",
    summary:
      "Draw hands, post-date offers, closure offers, shuffles, budget drops, and repair gates.",
  },
  {
    id: "focus-economy",
    category: "Gameplay loop",
    title: "Focus economy lab",
    summary: "Focus slots, swap/drop penalties, quit risk, budget cuts, and member-state deltas.",
  },
  {
    id: "closure-campaign",
    category: "Gameplay loop",
    title: "Closure campaign lab",
    summary:
      "Closure thresholds, near misses, close-pair side effects, soft win, and campaign loss.",
  },
  {
    id: "final-report",
    category: "Gameplay loop",
    title: "Final report lab",
    summary: "Outcome receipts, campaign meaning, stat deltas, filed reads, and follow-up state.",
  },
  {
    id: "match-fit",
    category: "Systems",
    title: "Match fit matrix",
    summary: "Partner and room grid for deterministic fit, pressure, room reads, and risk notes.",
  },
  {
    id: "shift-follow-up",
    category: "Systems",
    title: "Shift and follow-up",
    summary: "Lead ask outcomes, shift pressure, and outcome-aware follow-up effect previews.",
  },
  {
    id: "all-members",
    category: "Roster & standee",
    title: "Member files",
    summary: "Every field on every member, with a roster rail and avatar IDs for quick switching.",
  },
  {
    id: "date-reactions",
    category: "Roster & standee",
    title: "Date reactions",
    summary: "Mood, speaking bubble, and reactions on the date standee.",
  },
  {
    id: "height-scale",
    category: "Roster & standee",
    title: "Height lineup",
    summary: "Canonical member heights rendered through live date standee scaling.",
  },
  {
    id: "chat-bubbles",
    category: "Roster & standee",
    title: "Chat bubble gallery",
    summary: "Per-member focused-side bubble styles in one grid.",
  },
  {
    id: "constellation-lobby",
    category: "Lobby",
    title: "Constellation lobby",
    summary:
      "Production lobby + pair-graph archive view, seeded at four stages (empty / few pairs / mid game / end game).",
  },
] as const;

type PlaygroundTest = (typeof PLAYGROUND_TESTS)[number];
type PlaygroundTestId = PlaygroundTest["id"];
const PLAYGROUND_TEST_IDS = new Set<string>(PLAYGROUND_TESTS.map((test) => test.id));

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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLab = searchParams.get("lab");
  const activeTestId: PlaygroundTestId = isPlaygroundTestId(requestedLab) ? requestedLab : "ai-lab";

  function setActiveTestId(testId: PlaygroundTestId) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("lab", testId);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-aura-bg text-aura-ink">
      <AmbientMesh />
      <DotGridLayer />
      <PlaygroundTopBar />

      <div className="relative z-10 w-full px-5 pb-24 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <PlaygroundMasthead activeTestId={activeTestId} onSelect={setActiveTestId} />

        <motion.div
          key={activeTestId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
          className="mt-8 min-w-0 lg:mt-10"
        >
          {activeTestId === "ai-lab" ? <AiPromptLabTest /> : null}
          {activeTestId === "date-session" ? <DateSessionLabTest /> : null}
          {activeTestId === "final-report" ? <FinalReportLabTest /> : null}
          {activeTestId === "deck-workshop" ? <DeckWorkshopTest /> : null}
          {activeTestId === "shift-planning" ? <ShiftPlanningLabTest /> : null}
          {activeTestId === "closure-campaign" ? <ClosureCampaignLabTest /> : null}
          {activeTestId === "focus-economy" ? <FocusEconomyLabTest /> : null}
          {activeTestId === "memory-lab" ? <MemoryLabTest /> : null}
          {activeTestId === "match-fit" ? <MatchFitMatrixTest /> : null}
          {activeTestId === "shift-follow-up" ? <ShiftFollowUpSimulatorTest /> : null}
          {activeTestId === "reveal-lab" ? <PlayerKnowledgeRevealLabTest /> : null}
          {activeTestId === "all-members" ? <AllMembersTest /> : null}
          {activeTestId === "date-reactions" ? <DateReactionsTest /> : null}
          {activeTestId === "height-scale" ? <HeightLineupTest /> : null}
          {activeTestId === "chat-bubbles" ? <ChatBubbleGalleryTest /> : null}
        </motion.div>
      </div>

      {/* Hoisted out of the page chrome's z-10 stacking context so its fullscreen overlay can sit above the playground top bar (z-30) and the lobby's wheel/keyboard nav can be cleanly disabled. */}
      {activeTestId === "constellation-lobby" ? (
        <ConstellationLobbyTest onExit={() => setActiveTestId("ai-lab")} />
      ) : null}
    </main>
  );
}

function isPlaygroundTestId(value: string | null): value is PlaygroundTestId {
  return value !== null && PLAYGROUND_TEST_IDS.has(value);
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
/* Masthead: title block + bench deck share the top band so the active */
/* bench below gets the full page width.                               */
/* ================================================================== */

function PlaygroundMasthead({
  activeTestId,
  onSelect,
}: {
  activeTestId: PlaygroundTestId;
  onSelect: (testId: PlaygroundTestId) => void;
}) {
  return (
    <div className="flex flex-col gap-8 xl:flex-row xl:items-stretch xl:gap-12">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.05 }}
        className="flex shrink-0 flex-col justify-center gap-3 xl:w-[26rem]"
      >
        <Eyebrow>// internal.tooling.ui</Eyebrow>
        <h1 className="font-display text-display-lg font-semibold leading-[1] tracking-tight text-aura-ink">
          Component <span className="aura-accent text-display-lg text-aura-rose">workshop.</span>
        </h1>
        <p className="max-w-[46ch] text-lead text-aura-muted">
          Live previews of game components on mock data, same code paths as the operations floor.
          Pick a bench to isolate motion, layout, and color work that is hard to reach in normal
          play.
        </p>
      </motion.section>

      <BenchDeck activeTestId={activeTestId} onSelect={onSelect} />
    </div>
  );
}

/* ================================================================== */
/* Bench deck: search + a masonry board of every bench, grouped by     */
/* category so all 16 stay visible and findable in the header band.    */
/* Keyboard-driven and filterable; selection deep-links via ?lab=.     */
/* ================================================================== */

function BenchDeck({
  activeTestId,
  onSelect,
}: {
  activeTestId: PlaygroundTestId;
  onSelect: (testId: PlaygroundTestId) => void;
}) {
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const optionBaseId = useId();

  const activeTest =
    PLAYGROUND_TESTS.find((test) => test.id === activeTestId) ?? PLAYGROUND_TESTS[0];

  // Filtered benches, kept grouped by category for display.
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const buckets: { category: string; items: PlaygroundTest[] }[] = [];
    for (const test of PLAYGROUND_TESTS) {
      if (needle !== "") {
        const haystack = `${test.title} ${test.id} ${test.category} ${test.summary}`.toLowerCase();
        if (!haystack.includes(needle)) {
          continue;
        }
      }
      const bucket = buckets.find((entry) => entry.category === test.category);
      if (bucket) {
        bucket.items.push(test);
      } else {
        buckets.push({ category: test.category, items: [test] });
      }
    }
    return buckets;
  }, [query]);

  // Flattened in display order, the source of truth for arrow-key navigation.
  const flatResults = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    flatResults.forEach((test, index) => map.set(test.id, index));
    return map;
  }, [flatResults]);

  const safeHighlight =
    flatResults.length === 0 ? -1 : Math.min(Math.max(highlightedIndex, 0), flatResults.length - 1);
  const activeDescendant =
    safeHighlight >= 0 ? `${optionBaseId}-${flatResults[safeHighlight].id}` : undefined;

  // Keep the highlighted row in view while arrowing through a long, scrolled list.
  useEffect(() => {
    if (safeHighlight < 0) {
      return;
    }
    document
      .getElementById(`${optionBaseId}-${flatResults[safeHighlight].id}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeHighlight, flatResults, optionBaseId]);

  // Page-level shortcuts. Disabled while the lobby overlay owns the keyboard.
  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      return (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (activeTestId === "constellation-lobby") {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if ((event.key === "[" || event.key === "]") && !isTypingTarget(event.target)) {
        event.preventDefault();
        const current = PLAYGROUND_TESTS.findIndex((test) => test.id === activeTestId);
        const delta = event.key === "]" ? 1 : -1;
        const next =
          PLAYGROUND_TESTS[(current + delta + PLAYGROUND_TESTS.length) % PLAYGROUND_TESTS.length];
        onSelect(next.id);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTestId, onSelect]);

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.min(index + 1, flatResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = flatResults[safeHighlight];
      if (target) {
        onSelect(target.id);
      }
    } else if (event.key === "Escape") {
      if (query !== "") {
        setQuery("");
        setHighlightedIndex(0);
      } else {
        inputRef.current?.blur();
      }
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setHighlightedIndex(0);
  }

  return (
    <motion.section
      aria-label="Bench deck"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.1 }}
      className="aura-glass relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-card p-4 lg:p-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-aura-mesh-rose/40 blur-[90px]"
      />

      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2.5">
          <MutedLabel>bench deck</MutedLabel>
          <span className="rounded-full bg-aura-ink/[0.06] px-2 py-0.5 font-mono text-micro tabular-nums text-aura-muted">
            {flatResults.length === PLAYGROUND_TESTS.length
              ? PLAYGROUND_TESTS.length
              : `${flatResults.length} / ${PLAYGROUND_TESTS.length}`}
          </span>
        </div>

        <div className="relative ml-auto w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-aura-faint" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={activeDescendant}
            aria-label="Filter benches"
            value={query}
            placeholder="Filter benches"
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            className="w-full rounded-pill border border-aura-hairline bg-aura-paper/70 py-2 pr-9 pl-9 text-sm text-aura-ink outline-none transition placeholder:text-aura-faint focus-visible:border-aura-rose/40 focus-visible:ring-2 focus-visible:ring-aura-rose/30"
          />
          {query !== "" ? (
            <button
              type="button"
              aria-label="Clear filter"
              onClick={() => {
                handleQueryChange("");
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-2.5 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-aura-faint transition hover:bg-aura-rose/10 hover:text-aura-rose"
            >
              <ClearIcon />
            </button>
          ) : (
            <Kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2">/</Kbd>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="relative mt-5 px-1 py-6 text-sm text-aura-muted">
          No benches match{" "}
          <span className="font-semibold text-aura-ink">&ldquo;{query}&rdquo;</span>. Press{" "}
          <Kbd>esc</Kbd> to clear.
        </p>
      ) : (
        <div
          id={listId}
          role="listbox"
          aria-label="Benches"
          className="relative mt-4 gap-x-6 [column-fill:_balance] sm:columns-2 lg:columns-3 xl:columns-4"
        >
          {groups.map((group, groupIndex) => (
            <motion.div
              key={group.category}
              role="group"
              aria-label={group.category}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_QUART, delay: 0.16 + groupIndex * 0.04 }}
              className="mb-4 break-inside-avoid"
            >
              <div className="flex items-center gap-2 px-1 pb-1.5">
                <MutedLabel>{group.category}</MutedLabel>
                <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
              </div>
              <ul className="space-y-0.5">
                {group.items.map((test) => {
                  const selected = test.id === activeTestId;
                  const highlighted = (indexById.get(test.id) ?? -1) === safeHighlight;
                  return (
                    <li key={test.id}>
                      <button
                        id={`${optionBaseId}-${test.id}`}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => onSelect(test.id)}
                        onMouseMove={() => setHighlightedIndex(indexById.get(test.id) ?? 0)}
                        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-tile px-3 py-1.5 text-left font-display text-body font-semibold tracking-tight transition ${
                          selected
                            ? "bg-aura-ink text-white shadow-[0_8px_20px_-12px_rgba(15,23,42,0.5)]"
                            : highlighted
                              ? "bg-aura-rose/8 text-aura-rose"
                              : "text-aura-ink hover:bg-aura-rose/8 hover:text-aura-rose"
                        }`}
                      >
                        <span className="min-w-0 truncate">{test.title}</span>
                        {selected ? (
                          <BenchActiveMark />
                        ) : highlighted ? (
                          <span aria-hidden className="font-mono text-micro text-aura-rose/70">
                            ↵
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </div>
      )}

      <div className="relative mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-aura-hairline pt-3">
        <p className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
            {activeTest.id}
          </span>
          <span className="min-w-0 truncate text-sm text-aura-muted">{activeTest.summary}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-micro text-aura-faint">
          <Kbd>/</Kbd> filter
          <span aria-hidden className="text-aura-hairline-strong">
            ·
          </span>
          <Kbd>[</Kbd>
          <Kbd>]</Kbd> step
          <span aria-hidden className="text-aura-hairline-strong">
            ·
          </span>
          <Kbd>↵</Kbd> open
        </p>
      </div>
    </motion.section>
  );
}

function Kbd({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={`inline-flex min-w-5 items-center justify-center rounded border border-aura-hairline bg-aura-paper/60 px-1.5 py-0.5 font-mono text-micro leading-none text-aura-muted ${className}`}
    >
      {children}
    </kbd>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 10.5L13.5 13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden className="size-3">
      <path
        d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BenchActiveMark() {
  return (
    <svg aria-hidden viewBox="0 0 14 14" fill="none" className="size-4 shrink-0">
      <path
        d="M3.25 7.25L5.75 9.75L10.75 4.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
