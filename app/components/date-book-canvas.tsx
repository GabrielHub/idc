import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import type { DateScenario, GameSave } from "../domain/game";
import { SCENARIO_DECK_RETIREMENT_SHIFTS } from "../domain/game";
import { listLibraryCards, softComposeWarnings } from "../services/deck";
import { EASE_OUT_QUART, GhostButton } from "./dashboard-atoms";
import { ScenarioCard } from "./scenario-card";
import { ScenarioDetailsModal, type ScenarioDetailsAction } from "./scenario-details-modal";

export type DateBookCanvasProps = {
  save: GameSave;
  currentShift: number;
  drawnScenarioIds: readonly string[];
  scenarios: DateScenario[];
  isActionPending: boolean;
  onPickLibrary: (libraryCardId: string) => void;
  onSwap: (deckCardId: string, libraryCardId: string) => void;
  onBack: () => void;
};

type SwapMode =
  | { kind: "none" }
  | { kind: "drop-deck"; deckCardId: string }
  | { kind: "swap-in"; libraryCardId: string }
  | { kind: "library-pick" };

type InspectorTarget =
  | { kind: "deck"; cardId: string }
  | { kind: "library"; cardId: string; availableOnShift: number | null };

type RiskFilter = "any" | "low" | "medium" | "high";
type SortMode = "alpha" | "risk" | "intimacy" | "chaos";

const ROMAN_NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
] as const;

const RISK_FILTER_OPTIONS: ReadonlyArray<{ value: RiskFilter; label: string }> = [
  { value: "any", label: "Any" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

const SORT_OPTIONS: ReadonlyArray<{ value: SortMode; label: string }> = [
  { value: "alpha", label: "Title A→Z" },
  { value: "risk", label: "By risk" },
  { value: "intimacy", label: "By intimacy" },
  { value: "chaos", label: "By chaos" },
];

const RISK_RANK = { low: 0, medium: 1, high: 2 } as const;

const RISK_TONE = {
  low: "text-emerald-700",
  medium: "text-amber-700",
  high: "text-aura-rose",
} as const;

const RISK_DOT = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-aura-rose",
} as const;

export function DateBookCanvas({
  save,
  currentShift,
  drawnScenarioIds,
  scenarios,
  isActionPending,
  onPickLibrary,
  onSwap,
  onBack,
}: DateBookCanvasProps) {
  const [inspector, setInspector] = useState<InspectorTarget | null>(null);
  const [swapMode, setSwapMode] = useState<SwapMode>({ kind: "none" });
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("any");
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const [showRetired, setShowRetired] = useState(false);

  const pendingLibraryPick = save.scenarioDeck.pendingLibraryPick;
  const drawnScenarioSet = useMemo(() => new Set(drawnScenarioIds), [drawnScenarioIds]);

  const scenarioById = useMemo(
    () => new Map(scenarios.map((scenario) => [scenario.id, scenario])),
    [scenarios],
  );

  const deckScenarios = useMemo(
    () =>
      save.scenarioDeck.cardIds.map((id, index) => ({
        cardId: id,
        scenario: scenarioById.get(id),
        slot: index,
      })),
    [save.scenarioDeck.cardIds, scenarioById],
  );

  const library = useMemo(() => listLibraryCards(save, scenarios), [save, scenarios]);

  const filteredLibrary = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = library.filter((entry) => {
      const scenario = scenarioById.get(entry.scenarioId);
      if (scenario === undefined) return false;
      const isRetired = entry.availableOnShift !== null && entry.availableOnShift > currentShift;
      if (isRetired && !showRetired) return false;
      if (riskFilter !== "any" && scenario.card.risk !== riskFilter) return false;
      if (term.length > 0) {
        const haystack = `${scenario.title} ${scenario.publicBrief.location}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      const aScenario = scenarioById.get(a.scenarioId);
      const bScenario = scenarioById.get(b.scenarioId);
      if (aScenario === undefined || bScenario === undefined) return 0;
      if (sortMode === "alpha") return aScenario.title.localeCompare(bScenario.title);
      if (sortMode === "risk")
        return RISK_RANK[aScenario.card.risk] - RISK_RANK[bScenario.card.risk];
      if (sortMode === "intimacy")
        return RISK_RANK[aScenario.card.intimacy] - RISK_RANK[bScenario.card.intimacy];
      return RISK_RANK[aScenario.card.chaos] - RISK_RANK[bScenario.card.chaos];
    });
  }, [library, scenarioById, search, riskFilter, sortMode, showRetired, currentShift]);

  const deckComposition = useMemo(() => {
    const composition = {
      risk: { low: 0, medium: 0, high: 0 },
      intimacy: { low: 0, medium: 0, high: 0 },
      chaos: { low: 0, medium: 0, high: 0 },
      lowPressure: 0,
      highPressure: 0,
    };
    for (const entry of deckScenarios) {
      const scenario = entry.scenario;
      if (scenario === undefined) continue;
      composition.risk[scenario.card.risk] += 1;
      composition.intimacy[scenario.card.intimacy] += 1;
      composition.chaos[scenario.card.chaos] += 1;
      if (scenario.card.tags.includes("low_pressure")) composition.lowPressure += 1;
      if (scenario.card.tags.includes("high_pressure")) composition.highPressure += 1;
    }
    return composition;
  }, [deckScenarios]);

  const warnings = useMemo(
    () => softComposeWarnings(save.scenarioDeck, scenarios),
    [save.scenarioDeck, scenarios],
  );

  useEffect(() => {
    if (pendingLibraryPick !== undefined && swapMode.kind !== "library-pick") {
      setSwapMode({ kind: "library-pick" });
    }
    if (pendingLibraryPick === undefined && swapMode.kind === "library-pick") {
      setSwapMode({ kind: "none" });
    }
  }, [pendingLibraryPick, swapMode.kind]);

  useEffect(() => {
    if (!isActionPending) return;
    setInspector(null);
  }, [isActionPending]);

  function cancelSwapMode() {
    if (pendingLibraryPick !== undefined) return;
    setSwapMode({ kind: "none" });
  }

  function handleDeckCardClick(cardId: string) {
    if (swapMode.kind === "swap-in") {
      if (isActionPending) return;
      onSwap(cardId, swapMode.libraryCardId);
      setSwapMode({ kind: "none" });
      return;
    }
    if (swapMode.kind === "library-pick") {
      return;
    }
    const scenario = scenarioById.get(cardId);
    if (scenario === undefined) return;
    setInspector({ kind: "deck", cardId });
  }

  function handleLibraryCardClick(entry: { scenarioId: string; availableOnShift: number | null }) {
    const isRetired = entry.availableOnShift !== null && entry.availableOnShift > currentShift;
    if (isRetired) return;
    if (swapMode.kind === "drop-deck") {
      if (isActionPending) return;
      onSwap(swapMode.deckCardId, entry.scenarioId);
      setSwapMode({ kind: "none" });
      return;
    }
    if (swapMode.kind === "library-pick") {
      if (isActionPending) return;
      onPickLibrary(entry.scenarioId);
      return;
    }
    setInspector({
      kind: "library",
      cardId: entry.scenarioId,
      availableOnShift: entry.availableOnShift,
    });
  }

  function startSwapInFromLibrary(libraryCardId: string) {
    setSwapMode({ kind: "swap-in", libraryCardId });
    setInspector(null);
  }

  function startDropFromDeck(deckCardId: string) {
    setSwapMode({ kind: "drop-deck", deckCardId });
    setInspector(null);
  }

  function confirmLibraryPick(libraryCardId: string) {
    if (isActionPending) return;
    onPickLibrary(libraryCardId);
    setInspector(null);
  }

  const swapModeLibraryScenario =
    swapMode.kind === "swap-in" ? scenarioById.get(swapMode.libraryCardId) : undefined;
  const swapModeDeckScenario =
    swapMode.kind === "drop-deck" ? scenarioById.get(swapMode.deckCardId) : undefined;
  const pendingLibraryPickScenario =
    pendingLibraryPick === undefined
      ? undefined
      : scenarioById.get(pendingLibraryPick.playedCardId);

  return (
    <section className="relative mx-auto w-full max-w-canvas px-6 pb-16 pt-8 lg:px-12">
      <DateBookHeader
        composition={deckComposition}
        deckTotal={save.scenarioDeck.cardIds.length}
        librarySize={library.length}
        warnings={warnings}
        onBack={onBack}
      />

      <AnimatePresence>
        {swapMode.kind !== "none" ? (
          <SwapModeBanner
            mode={swapMode}
            libraryScenario={swapModeLibraryScenario}
            deckScenario={swapModeDeckScenario}
            pendingLibraryPickScenario={pendingLibraryPickScenario}
            onCancel={cancelSwapMode}
          />
        ) : null}
      </AnimatePresence>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
        <DeckColumn
          deckScenarios={deckScenarios}
          pendingLibraryPick={pendingLibraryPick}
          drawnScenarioSet={drawnScenarioSet}
          swapMode={swapMode}
          onDeckCardClick={handleDeckCardClick}
        />

        <div className="lg:relative">
          <div className="lg:absolute lg:inset-0">
            <LibraryColumn
              library={filteredLibrary}
              scenarioById={scenarioById}
              search={search}
              riskFilter={riskFilter}
              sortMode={sortMode}
              showRetired={showRetired}
              currentShift={currentShift}
              swapMode={swapMode}
              onSearchChange={setSearch}
              onRiskFilterChange={setRiskFilter}
              onSortChange={setSortMode}
              onShowRetiredToggle={() => setShowRetired((value) => !value)}
              onLibraryCardClick={handleLibraryCardClick}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {inspector !== null ? (
          <InspectorModal
            target={inspector}
            scenarioById={scenarioById}
            isActionPending={isActionPending}
            hasPendingLibraryPick={pendingLibraryPick !== undefined}
            currentShift={currentShift}
            onClose={() => setInspector(null)}
            onStartSwapIn={startSwapInFromLibrary}
            onStartDrop={startDropFromDeck}
            onConfirmLibraryPick={confirmLibraryPick}
          />
        ) : null}
      </AnimatePresence>

      {isActionPending ? (
        <p className="mt-6 text-center font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          filing change…
        </p>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

type DeckComposition = {
  risk: { low: number; medium: number; high: number };
  intimacy: { low: number; medium: number; high: number };
  chaos: { low: number; medium: number; high: number };
  lowPressure: number;
  highPressure: number;
};

function DateBookHeader({
  composition,
  deckTotal,
  librarySize,
  warnings,
  onBack,
}: {
  composition: DeckComposition;
  deckTotal: number;
  librarySize: number;
  warnings: string[];
  onBack: () => void;
}) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            // date-book.workbench
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-aura-ink lg:text-display-md">
            Date book
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-aura-muted">
            Twelve plans face up on the bench. {librarySize} more in cold storage. Voluntary swaps
            retire the dropped plan for {SCENARIO_DECK_RETIREMENT_SHIFTS} shifts.
          </p>
        </div>
        <GhostButton onClick={onBack}>← Back to lobby</GhostButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DeckStatPill label="Slots" value={`${deckTotal} / 12`} tone="ink" />
        <AxisPill label="Risk" counts={composition.risk} />
        <AxisPill label="Intim" counts={composition.intimacy} />
        <AxisPill label="Chaos" counts={composition.chaos} />
        <DeckStatPill
          label="Pressure"
          value={`${composition.lowPressure} low · ${composition.highPressure} high`}
          tone="ink"
        />
        {warnings.map((warning) => (
          <DeckStatPill key={warning} label="Heads up" value={warning} tone="amber" />
        ))}
      </div>
    </header>
  );
}

function DeckStatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ink" | "amber";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-300/60 bg-amber-50/80 text-amber-800"
      : "border-aura-hairline bg-white/70 text-aura-ink";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill border px-3 py-1 font-mono text-micro uppercase tracking-[0.22em] ${toneClass}`}
    >
      <span className="text-aura-faint">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function AxisPill({
  label,
  counts,
}: {
  label: string;
  counts: { low: number; medium: number; high: number };
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-pill border border-aura-hairline bg-white/70 px-3 py-1 font-mono text-micro uppercase tracking-[0.22em]">
      <span className="text-aura-faint">{label}</span>
      <span className="flex items-center gap-1.5">
        <CountPip count={counts.low} tone="low" />
        <CountPip count={counts.medium} tone="medium" />
        <CountPip count={counts.high} tone="high" />
      </span>
    </span>
  );
}

function CountPip({ count, tone }: { count: number; tone: "low" | "medium" | "high" }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${RISK_TONE[tone]}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${RISK_DOT[tone]}`} />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Deck column                                                         */
/* ------------------------------------------------------------------ */

function DeckColumn({
  deckScenarios,
  pendingLibraryPick,
  drawnScenarioSet,
  swapMode,
  onDeckCardClick,
}: {
  deckScenarios: ReadonlyArray<{
    cardId: string;
    scenario: DateScenario | undefined;
    slot: number;
  }>;
  pendingLibraryPick: GameSave["scenarioDeck"]["pendingLibraryPick"];
  drawnScenarioSet: ReadonlySet<string>;
  swapMode: SwapMode;
  onDeckCardClick: (cardId: string) => void;
}) {
  const isDropTarget = swapMode.kind === "swap-in";
  const isHoldingDeckCard = swapMode.kind === "drop-deck";

  return (
    <section className="relative">
      <div className="flex items-baseline justify-between gap-3 pb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">
            Active deck
          </h2>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            {deckScenarios.length} / 12 slots
          </span>
        </div>
        {isDropTarget ? (
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
            tap a slot to drop
          </span>
        ) : null}
      </div>

      <div className="aura-glass relative rounded-card p-4 lg:p-5">
        <div className="aura-dot-grid pointer-events-none absolute inset-0 rounded-card opacity-30" />
        <ul className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {deckScenarios.map(({ cardId, scenario, slot }) => {
            if (scenario === undefined) return null;
            const numeral = ROMAN_NUMERALS[slot] ?? `${slot + 1}`;
            const isHeldSource = swapMode.kind === "drop-deck" && swapMode.deckCardId === cardId;
            const isDimmed = isHoldingDeckCard && !isHeldSource;
            return (
              <li key={cardId} className="relative">
                <SlotLabel numeral={numeral} highlighted={isDropTarget} />
                <motion.div
                  layout
                  initial={false}
                  animate={
                    isDropTarget ? { y: [0, -2, 0] } : isHeldSource ? { scale: 1.02 } : { scale: 1 }
                  }
                  transition={{
                    duration: isDropTarget ? 1.6 : 0.24,
                    repeat: isDropTarget ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut",
                  }}
                  className={isDimmed ? "opacity-65 saturate-[0.7]" : ""}
                >
                  <ScenarioCard
                    scenario={scenario}
                    size="tile"
                    state={isHeldSource ? "selected" : "default"}
                    inHand={drawnScenarioSet.has(cardId)}
                    onClick={() => onDeckCardClick(cardId)}
                  />
                </motion.div>
              </li>
            );
          })}

          {pendingLibraryPick !== undefined ? (
            <li className="relative">
              <OpenSlot />
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

function SlotLabel({ numeral, highlighted }: { numeral: string; highlighted: boolean }) {
  const tone = highlighted ? "text-aura-rose" : "text-aura-muted/70";
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute bottom-1.5 right-2.5 z-30 font-antique italic text-[13px] leading-none ${tone}`}
    >
      {numeral}
    </span>
  );
}

function OpenSlot() {
  return (
    <div className="relative aspect-[4/5] min-h-[150px] overflow-hidden rounded-[14px]">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute inset-0 rounded-[14px] border-2 border-dashed border-aura-rose/55 bg-gradient-to-br from-aura-mesh-rose/40 via-white/60 to-aura-mesh-violet/40"
      />
      <div className="relative grid h-full place-items-center px-3 text-center">
        <div>
          <span
            aria-hidden
            className="mx-auto grid size-9 place-items-center rounded-full bg-white/85 font-display text-lg font-semibold text-aura-rose shadow-quiet"
          >
            +
          </span>
          <p className="mt-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
            open slot
          </p>
          <p className="mt-0.5 font-display text-xs text-aura-ink">Pick from library</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Library column                                                      */
/* ------------------------------------------------------------------ */

function LibraryColumn({
  library,
  scenarioById,
  search,
  riskFilter,
  sortMode,
  showRetired,
  currentShift,
  swapMode,
  onSearchChange,
  onRiskFilterChange,
  onSortChange,
  onShowRetiredToggle,
  onLibraryCardClick,
}: {
  library: ReadonlyArray<{ scenarioId: string; availableOnShift: number | null }>;
  scenarioById: ReadonlyMap<string, DateScenario>;
  search: string;
  riskFilter: RiskFilter;
  sortMode: SortMode;
  showRetired: boolean;
  currentShift: number;
  swapMode: SwapMode;
  onSearchChange: (value: string) => void;
  onRiskFilterChange: (value: RiskFilter) => void;
  onSortChange: (value: SortMode) => void;
  onShowRetiredToggle: () => void;
  onLibraryCardClick: (entry: { scenarioId: string; availableOnShift: number | null }) => void;
}) {
  const isDropTarget = swapMode.kind === "drop-deck" || swapMode.kind === "library-pick";
  const isHoldingLibraryCard = swapMode.kind === "swap-in";

  return (
    <aside className="relative lg:flex lg:h-full lg:flex-col">
      <div className="flex items-baseline justify-between gap-3 pb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">
            Library
          </h2>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            {library.length} {library.length === 1 ? "card" : "cards"}
          </span>
        </div>
        {isDropTarget ? (
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
            tap a card to swap in
          </span>
        ) : null}
      </div>

      <div className="aura-glass relative flex flex-col gap-3 rounded-card p-4 lg:min-h-0 lg:flex-1 lg:p-5">
        <LibraryFilters
          search={search}
          riskFilter={riskFilter}
          sortMode={sortMode}
          showRetired={showRetired}
          onSearchChange={onSearchChange}
          onRiskFilterChange={onRiskFilterChange}
          onSortChange={onSortChange}
          onShowRetiredToggle={onShowRetiredToggle}
        />

        <div className="aura-rule" />

        <div className="max-h-[64vh] overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1">
          {library.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-aura-muted">
              No cards match these filters.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {library.map((entry) => {
                const scenario = scenarioById.get(entry.scenarioId);
                if (scenario === undefined) return null;
                const isRetired =
                  entry.availableOnShift !== null && entry.availableOnShift > currentShift;
                const isHeldSource =
                  swapMode.kind === "swap-in" && swapMode.libraryCardId === entry.scenarioId;
                const isDimmed = isHoldingLibraryCard && !isHeldSource;
                return (
                  <li key={entry.scenarioId} className="relative">
                    <motion.div
                      layout
                      initial={false}
                      animate={
                        isDropTarget && !isRetired
                          ? { y: [0, -2, 0] }
                          : isHeldSource
                            ? { scale: 1.02 }
                            : { scale: 1 }
                      }
                      transition={{
                        duration: isDropTarget && !isRetired ? 1.6 : 0.24,
                        repeat: isDropTarget && !isRetired ? Number.POSITIVE_INFINITY : 0,
                        ease: "easeInOut",
                      }}
                      className={isDimmed ? "opacity-65 saturate-[0.7]" : ""}
                    >
                      <ScenarioCard
                        scenario={scenario}
                        size="tile"
                        state={isRetired ? "retired" : isHeldSource ? "selected" : "default"}
                        availableOnShift={entry.availableOnShift}
                        currentShift={currentShift}
                        onClick={() => onLibraryCardClick(entry)}
                      />
                    </motion.div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

function LibraryFilters({
  search,
  riskFilter,
  sortMode,
  showRetired,
  onSearchChange,
  onRiskFilterChange,
  onSortChange,
  onShowRetiredToggle,
}: {
  search: string;
  riskFilter: RiskFilter;
  sortMode: SortMode;
  showRetired: boolean;
  onSearchChange: (value: string) => void;
  onRiskFilterChange: (value: RiskFilter) => void;
  onSortChange: (value: SortMode) => void;
  onShowRetiredToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint"
          >
            ⌕
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title or venue"
            className="w-full cursor-text rounded-pill border border-aura-hairline bg-white/85 px-9 py-2 font-sans text-sm text-aura-ink outline-none transition placeholder:font-mono placeholder:text-micro placeholder:uppercase placeholder:tracking-[0.18em] placeholder:text-aura-faint hover:border-aura-rose/40 focus:border-aura-rose focus:bg-white"
          />
          {search.length > 0 ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              data-sfx="click"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-aura-faint transition hover:bg-white/55 hover:text-aura-ink"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChipGroup
          label="Risk"
          value={riskFilter}
          options={RISK_FILTER_OPTIONS}
          onChange={onRiskFilterChange}
        />
        <FilterChipGroup
          label="Sort"
          value={sortMode}
          options={SORT_OPTIONS}
          onChange={onSortChange}
        />
        <button
          type="button"
          data-sfx="click"
          aria-pressed={showRetired}
          onClick={onShowRetiredToggle}
          className={`cursor-pointer rounded-pill border px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
            showRetired
              ? "border-transparent bg-aura-ink text-white"
              : "border-aura-hairline bg-white/70 text-aura-muted hover:border-aura-rose/40 hover:text-aura-ink"
          }`}
        >
          {showRetired ? "Retired: shown" : "Retired: hidden"}
        </button>
      </div>
    </div>
  );
}

function FilterChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-pill border border-aura-hairline bg-white/70 px-1 py-0.5">
      <span className="px-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        {label}
      </span>
      <span className="flex items-center gap-0.5">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              data-sfx="click"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={`cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] transition ${
                isActive
                  ? "bg-aura-ink text-white"
                  : "text-aura-muted hover:bg-white/65 hover:text-aura-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Swap mode banner                                                    */
/* ------------------------------------------------------------------ */

function SwapModeBanner({
  mode,
  libraryScenario,
  deckScenario,
  pendingLibraryPickScenario,
  onCancel,
}: {
  mode: SwapMode;
  libraryScenario: DateScenario | undefined;
  deckScenario: DateScenario | undefined;
  pendingLibraryPickScenario: DateScenario | undefined;
  onCancel: () => void;
}) {
  if (mode.kind === "none") return null;
  return (
    <motion.div
      key={mode.kind}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
      role="status"
      aria-live="polite"
      className="aura-glass-strong mt-5 flex flex-wrap items-center justify-between gap-3 rounded-pill px-4 py-2.5 shadow-quiet"
    >
      <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
        {mode.kind === "swap-in" ? (
          <>
            <span className="text-aura-rose">swap mode</span> · swapping in{" "}
            <strong className="text-aura-ink">{libraryScenario?.title ?? "library card"}</strong>.
            Tap any deck card to drop it. Dropped plan retires for {SCENARIO_DECK_RETIREMENT_SHIFTS}{" "}
            shifts.
          </>
        ) : null}
        {mode.kind === "drop-deck" ? (
          <>
            <span className="text-aura-rose">swap mode</span> · dropping{" "}
            <strong className="text-aura-ink">{deckScenario?.title ?? "deck card"}</strong>. Tap any
            library card to fill the slot. Dropped plan retires for{" "}
            {SCENARIO_DECK_RETIREMENT_SHIFTS} shifts.
          </>
        ) : null}
        {mode.kind === "library-pick" ? (
          <>
            <span className="text-aura-rose">open slot</span> ·{" "}
            <strong className="text-aura-ink">
              {pendingLibraryPickScenario?.title ?? "just-played plan"}
            </strong>{" "}
            cools off until next shift. Pick a library card to fill the open slot.
          </>
        ) : null}
      </p>
      {mode.kind === "library-pick" ? null : <GhostButton onClick={onCancel}>Cancel</GhostButton>}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Inspector modal                                                     */
/* ------------------------------------------------------------------ */

function InspectorModal({
  target,
  scenarioById,
  isActionPending,
  hasPendingLibraryPick,
  currentShift,
  onClose,
  onStartSwapIn,
  onStartDrop,
  onConfirmLibraryPick,
}: {
  target: InspectorTarget;
  scenarioById: ReadonlyMap<string, DateScenario>;
  isActionPending: boolean;
  hasPendingLibraryPick: boolean;
  currentShift: number;
  onClose: () => void;
  onStartSwapIn: (libraryCardId: string) => void;
  onStartDrop: (deckCardId: string) => void;
  onConfirmLibraryPick: (libraryCardId: string) => void;
}) {
  const scenario = scenarioById.get(target.cardId);

  if (scenario === undefined) return null;

  const isLibrary = target.kind === "library";
  const isRetired =
    isLibrary && target.availableOnShift !== null && target.availableOnShift > currentShift;
  const eyebrow = target.kind === "deck" ? "// active deck slot" : "// library card";
  let primaryAction: ScenarioDetailsAction | undefined;

  if (target.kind === "library" && !isRetired) {
    primaryAction = hasPendingLibraryPick
      ? {
          label: "Add to deck",
          onClick: () => onConfirmLibraryPick(target.cardId),
          disabled: isActionPending,
        }
      : {
          label: "Swap into deck",
          onClick: () => onStartSwapIn(target.cardId),
          disabled: isActionPending,
        };
  }

  if (target.kind === "deck" && !hasPendingLibraryPick) {
    primaryAction = {
      label: "Drop this card",
      onClick: () => onStartDrop(target.cardId),
      disabled: isActionPending,
    };
  }

  return (
    <ScenarioDetailsModal
      scenario={scenario}
      eyebrow={eyebrow}
      statusLabel={
        isRetired && target.kind === "library"
          ? `Retired · returns shift ${target.availableOnShift}`
          : undefined
      }
      primaryAction={primaryAction}
      onClose={onClose}
    />
  );
}
