/**
 * Library mode panel for the constellation lobby's ScenarioPanel. When the
 * player taps the Date book NavShard a second time, the ScenarioPanel
 * swaps from deck mode into this view: every unlocked library scenario
 * rendered as a liquid-glass tile, with a filter rail (search input + risk
 * chips + sort chips) and a tap-to-expand inline focused glass-rose card
 * with an Add CTA.
 *
 * Tiles read as disabled (dimmed + cursor-not-allowed) when the card is
 * already in the deck, when the deck is at its slot cap, or when adding
 * would push the deck over budget. Tapping a disabled tile still expands
 * the card so the player can read the brief — the Add CTA is the gated
 * control, not the tap target.
 *
 * Hide the library entirely when bookingLocked — once a pair is committed,
 * the only action available is Cancel pair from the BottomDock.
 */

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import type { DateScenario, GameSave } from "../../domain/game";
import { DECK_SIZE_MAX } from "../../domain/game";
import { canAddToDeck } from "../../services/budget";
import { listLibraryCards, unlockedScenarioIds } from "../../services/deck";
import { LobbyScenarioCard } from "../../routes/constellation-lobby-spike";
import type { LobbyScenario } from "./types";

export type LibraryModePanelProps = {
  save: GameSave;
  currentShift: number;
  scenarios: readonly DateScenario[];
  scenarioById: ReadonlyMap<string, DateScenario>;
  toLobbyScenario: (scenario: DateScenario) => LobbyScenario;
  effectiveCosts: Record<string, number>;
  budgetCap: number;
  isActionPending: boolean;
  bookingLocked: boolean;
  onAdd: (cardId: string) => void;
};

type RiskFilter = "any" | "low" | "medium" | "high";
type SortMode = "alpha" | "risk" | "intimacy" | "chaos" | "cost";

const RISK_FILTER_OPTIONS: ReadonlyArray<{ value: RiskFilter; label: string }> = [
  { value: "any", label: "Any" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

const SORT_OPTIONS: ReadonlyArray<{ value: SortMode; label: string }> = [
  { value: "alpha", label: "A→Z" },
  { value: "cost", label: "Cost" },
  { value: "risk", label: "Risk" },
  { value: "intimacy", label: "Intim" },
  { value: "chaos", label: "Chaos" },
];

const RISK_RANK = { low: 0, medium: 1, high: 2 } as const;

export function LibraryModePanel({
  save,
  currentShift,
  scenarios,
  scenarioById,
  toLobbyScenario,
  effectiveCosts,
  budgetCap,
  isActionPending,
  bookingLocked,
  onAdd,
}: LibraryModePanelProps) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("any");
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unlocked = useMemo(
    () => unlockedScenarioIds({ closureCount: save.closureCount, shiftNumber: currentShift }),
    [save.closureCount, currentShift],
  );

  const library = useMemo(() => listLibraryCards(save, scenarios), [save, scenarios]);

  const filteredLibrary = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = library.filter((entry) => {
      const scenario = scenarioById.get(entry.scenarioId);
      if (scenario === undefined) return false;
      if (!unlocked.has(scenario.id)) return false;
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
      if (sortMode === "cost") {
        return (
          (effectiveCosts[aScenario.id] ?? aScenario.card.cost) -
          (effectiveCosts[bScenario.id] ?? bScenario.card.cost)
        );
      }
      if (sortMode === "risk")
        return RISK_RANK[aScenario.card.risk] - RISK_RANK[bScenario.card.risk];
      if (sortMode === "intimacy")
        return RISK_RANK[aScenario.card.intimacy] - RISK_RANK[bScenario.card.intimacy];
      return RISK_RANK[aScenario.card.chaos] - RISK_RANK[bScenario.card.chaos];
    });
  }, [library, scenarioById, search, riskFilter, sortMode, unlocked, effectiveCosts]);

  return (
    <section className="flex flex-col gap-3 rounded-card aura-liquid-glass aura-liquid-glass-ink p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="leading-tight">
          <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
            // date book · library
          </div>
          <div className="font-display text-display-sm text-aura-paper">
            {filteredLibrary.length} unlocked
          </div>
        </div>
        <LibraryFilterRail
          search={search}
          riskFilter={riskFilter}
          sortMode={sortMode}
          onSearchChange={setSearch}
          onRiskFilterChange={setRiskFilter}
          onSortChange={setSortMode}
        />
      </header>

      {filteredLibrary.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-white/65">
          No library cards match these filters.
        </p>
      ) : (
        <div className="grid max-h-[42vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {filteredLibrary.map((entry) => {
            const scenario = scenarioById.get(entry.scenarioId);
            if (scenario === undefined) return null;
            const effective = effectiveCosts[scenario.id] ?? scenario.card.cost;
            const add = canAddToDeck({
              cardId: scenario.id,
              cardIds: save.scenarioDeck.cardIds,
              effectiveCosts,
              budgetCap,
            });
            const inDeck = save.scenarioDeck.cardIds.includes(scenario.id);
            const deckFull = save.scenarioDeck.cardIds.length >= DECK_SIZE_MAX;
            const expanded = expandedId === scenario.id;
            const cantFit = inDeck || deckFull || !add.ok;
            return (
              <div key={scenario.id} className={cantFit ? "opacity-60 saturate-[0.75]" : ""}>
                <LobbyScenarioCard
                  scenario={{ ...toLobbyScenario(scenario), cost: effective }}
                  selected={expanded}
                  dimmed={expandedId !== null && expandedId !== scenario.id}
                  onClick={() => setExpandedId(expanded ? null : scenario.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {expandedId !== null
          ? (() => {
              const scenario = scenarioById.get(expandedId);
              if (scenario === undefined) return null;
              const effective = effectiveCosts[expandedId] ?? scenario.card.cost;
              const add = canAddToDeck({
                cardId: scenario.id,
                cardIds: save.scenarioDeck.cardIds,
                effectiveCosts,
                budgetCap,
              });
              const inDeck = save.scenarioDeck.cardIds.includes(scenario.id);
              const deckFull = save.scenarioDeck.cardIds.length >= DECK_SIZE_MAX;
              const reason = inDeck
                ? "Already in deck."
                : deckFull
                  ? "Deck is at the slot cap. Drop a card first."
                  : !add.ok && add.reason === "over_budget"
                    ? "Adding this card would exceed remaining budget."
                    : undefined;
              return (
                <LibraryCardExpanded
                  key={expandedId}
                  scenario={scenario}
                  effectiveCost={effective}
                  canAdd={add.ok && !inDeck && !deckFull}
                  blockedReason={reason}
                  isActionPending={isActionPending}
                  bookingLocked={bookingLocked}
                  onAdd={() => {
                    onAdd(expandedId);
                    setExpandedId(null);
                  }}
                  onClose={() => setExpandedId(null)}
                />
              );
            })()
          : null}
      </AnimatePresence>
    </section>
  );
}

function LibraryFilterRail({
  search,
  riskFilter,
  sortMode,
  onSearchChange,
  onRiskFilterChange,
  onSortChange,
}: {
  search: string;
  riskFilter: RiskFilter;
  sortMode: SortMode;
  onSearchChange: (v: string) => void;
  onRiskFilterChange: (v: RiskFilter) => void;
  onSortChange: (v: SortMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search title or venue"
        className="aura-liquid-glass-ink cursor-text rounded-pill px-3.5 py-1.5 font-sans text-label text-aura-paper placeholder:font-mono placeholder:text-micro placeholder:uppercase placeholder:tracking-[0.18em] placeholder:text-white/45 focus:outline-none"
      />
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
    <div className="inline-flex items-center gap-1 rounded-pill aura-liquid-glass aura-liquid-glass-ink px-1 py-0.5">
      <span className="px-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white/55">
        {label}
      </span>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={`cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] transition ${
              isActive
                ? "bg-aura-rose text-white"
                : "text-white/70 hover:bg-white/12 hover:text-aura-paper"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function LibraryCardExpanded({
  scenario,
  effectiveCost,
  canAdd,
  blockedReason,
  isActionPending,
  bookingLocked,
  onAdd,
  onClose,
}: {
  scenario: DateScenario;
  effectiveCost: number;
  canAdd: boolean;
  blockedReason: string | undefined;
  isActionPending: boolean;
  bookingLocked: boolean;
  onAdd: () => void;
  onClose: () => void;
}) {
  const addDisabled = !canAdd || isActionPending || bookingLocked;
  return (
    <motion.div
      key="library-expanded"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.24, ease: [0.22, 0.8, 0.2, 1] }}
      className="rounded-card aura-liquid-glass aura-liquid-glass-rose p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 leading-tight">
          <div className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
            // library card
          </div>
          <div className="mt-1 font-display text-display-md text-aura-paper">{scenario.title}</div>
          <div className="mt-1 font-mono text-micro uppercase tracking-[0.18em] text-white/55">
            {scenario.publicBrief.location}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail"
          className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3 py-1.5 font-display text-label text-aura-paper"
        >
          Close
        </button>
      </div>
      <p className="mt-3 max-w-3xl font-sans text-label text-white/80">{scenario.card.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-micro uppercase tracking-[0.18em] text-white/65">
        <span>risk · {scenario.card.risk}</span>
        <span>intim · {scenario.card.intimacy}</span>
        <span>chaos · {scenario.card.chaos}</span>
        <span>cost · {effectiveCost}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={addDisabled}
          className="cursor-pointer disabled:cursor-not-allowed aura-liquid-cta rounded-full px-5 py-2 font-display text-label disabled:opacity-55"
        >
          Add to deck · spend {effectiveCost}
        </button>
        {blockedReason === undefined ? null : (
          <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-amber">
            {blockedReason}
          </span>
        )}
      </div>
    </motion.div>
  );
}
