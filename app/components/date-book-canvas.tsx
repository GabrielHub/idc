import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { BudgetDiscountOffer, DateScenario, GameSave } from "../domain/game";
import { DECK_SIZE_MAX, DECK_SIZE_MIN } from "../domain/game";
import {
  activeBudgetDiscountOffers,
  canAddToDeck,
  computeEffectiveCosts,
  deriveDeckBudgetStatus,
  isOfferApplicableToScenario,
} from "../services/budget";
import {
  deckIsRepairBlocked,
  listLibraryCards,
  softComposeWarnings,
  unlockedScenarioIds,
} from "../services/deck";
import { useTutorialStep } from "../services/tutorial";
import { EASE_OUT_QUART, GhostButton, Tooltip } from "./dashboard-atoms";
import { RISK_DOT_TONE, RISK_TEXT_TONE, ScenarioCard } from "./scenario-card";
import { ScenarioDetailsModal, type ScenarioDetailsAction } from "./scenario-details-modal";
import { TutorialCoachMark } from "./tutorial";

export type DateBookCanvasProps = {
  save: GameSave;
  currentShift: number;
  scenarios: DateScenario[];
  isActionPending: boolean;
  bookingLocked: boolean;
  onTutorialUpdate: (next: GameSave) => void;
  onAddToDeck: (cardId: string) => void;
  onRemoveFromDeck: (cardId: string) => void;
  onBack: () => void;
};

type InspectorTarget = { kind: "deck"; cardId: string } | { kind: "library"; cardId: string };

type RiskFilter = "any" | "low" | "medium" | "high";
type SortMode = "alpha" | "risk" | "intimacy" | "chaos" | "cost";

const RISK_FILTER_OPTIONS: ReadonlyArray<{ value: RiskFilter; label: string }> = [
  { value: "any", label: "Any" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

const SORT_OPTIONS: ReadonlyArray<{ value: SortMode; label: string }> = [
  { value: "alpha", label: "Title A→Z" },
  { value: "cost", label: "By cost" },
  { value: "risk", label: "By risk" },
  { value: "intimacy", label: "By intimacy" },
  { value: "chaos", label: "By chaos" },
];

const RISK_RANK = { low: 0, medium: 1, high: 2 } as const;

const DECK_STAT_TOOLTIPS = {
  cap: "Allocation cap from coach performance. Closures bump it, quits cut it, and the periodic review can move it both ways.",
  spent:
    "Authored cost of every card in the active deck, after any active period discounts. Stay at or under the cap.",
  remaining: "Headroom left under the cap. Adding a card needs this much or more.",
  slots: `Deck size. Holds ${DECK_SIZE_MIN} to ${DECK_SIZE_MAX} cards. Each leg of the date draws 3 from this pool.`,
  risk: "Chance the setup strains the pair. Dots count low, medium, and high risk plans.",
  intimacy:
    "How close the setup asks the pair to get. Dots count low, medium, and high intimacy plans.",
  chaos: "How weird the room gets. Dots count low, medium, and high chaos plans.",
  pressure:
    "Counts plans marked low pressure or high pressure. Low gives breathing room. High puts requests or boundaries under heat.",
} as const;

export function DateBookCanvas({
  save,
  currentShift,
  scenarios,
  isActionPending,
  bookingLocked,
  onTutorialUpdate,
  onAddToDeck,
  onRemoveFromDeck,
  onBack,
}: DateBookCanvasProps) {
  const [inspector, setInspector] = useState<InspectorTarget | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("any");
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const headerAnchorRef = useRef<HTMLDivElement | null>(null);
  const isRepairBlocked = useMemo(() => deckIsRepairBlocked(save, scenarios), [save, scenarios]);
  const lockedStep = useTutorialStep(
    save,
    "lazy.datebook.locked",
    bookingLocked && !isRepairBlocked,
    onTutorialUpdate,
  );
  const repairStep = useTutorialStep(
    save,
    "lazy.datebook.repair",
    isRepairBlocked,
    onTutorialUpdate,
  );

  const scenarioById = useMemo(
    () => new Map(scenarios.map((scenario) => [scenario.id, scenario])),
    [scenarios],
  );

  const offers = useMemo(() => activeBudgetDiscountOffers(save), [save]);
  const effectiveCostsByScenarioId = useMemo(
    () => computeEffectiveCosts(scenarios, offers),
    [scenarios, offers],
  );

  const unlocked = useMemo(
    () =>
      unlockedScenarioIds({
        closureCount: save.closureCount,
        shiftNumber: currentShift,
      }),
    [save.closureCount, currentShift],
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
          (effectiveCostsByScenarioId[aScenario.id] ?? aScenario.card.cost) -
          (effectiveCostsByScenarioId[bScenario.id] ?? bScenario.card.cost)
        );
      }
      if (sortMode === "risk")
        return RISK_RANK[aScenario.card.risk] - RISK_RANK[bScenario.card.risk];
      if (sortMode === "intimacy")
        return RISK_RANK[aScenario.card.intimacy] - RISK_RANK[bScenario.card.intimacy];
      return RISK_RANK[aScenario.card.chaos] - RISK_RANK[bScenario.card.chaos];
    });
  }, [library, scenarioById, search, riskFilter, sortMode, unlocked, effectiveCostsByScenarioId]);

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

  const budgetStatus = useMemo(
    () =>
      deriveDeckBudgetStatus({
        cardIds: save.scenarioDeck.cardIds,
        effectiveCosts: effectiveCostsByScenarioId,
        budgetCap: save.budgetCap,
      }),
    [save.scenarioDeck.cardIds, effectiveCostsByScenarioId, save.budgetCap],
  );

  useEffect(() => {
    if (!isActionPending) return;
    setInspector(null);
  }, [isActionPending]);

  function handleDeckCardClick(cardId: string) {
    const scenario = scenarioById.get(cardId);
    if (scenario === undefined) return;
    setInspector({ kind: "deck", cardId });
  }

  function handleLibraryCardClick(scenarioId: string) {
    setInspector({ kind: "library", cardId: scenarioId });
  }

  function handleConfirmRemove(cardId: string) {
    if (isActionPending || bookingLocked) return;
    onRemoveFromDeck(cardId);
    setInspector(null);
  }

  function handleConfirmAdd(cardId: string) {
    if (isActionPending || bookingLocked) return;
    onAddToDeck(cardId);
    setInspector(null);
  }

  return (
    <section className="relative mx-auto w-full max-w-canvas px-6 pb-16 pt-8 lg:px-12">
      <div ref={headerAnchorRef}>
        <DateBookHeader
          composition={deckComposition}
          budgetCap={save.budgetCap}
          spend={budgetStatus.spend}
          remaining={budgetStatus.remaining}
          deckSize={save.scenarioDeck.cardIds.length}
          status={budgetStatus.status}
          warnings={warnings}
          offers={offers}
          bookingLocked={bookingLocked}
          onBack={onBack}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
        <DeckColumn
          deckScenarios={deckScenarios}
          effectiveCosts={effectiveCostsByScenarioId}
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
              effectiveCosts={effectiveCostsByScenarioId}
              budgetCap={save.budgetCap}
              deckCardIds={save.scenarioDeck.cardIds}
              onSearchChange={setSearch}
              onRiskFilterChange={setRiskFilter}
              onSortChange={setSortMode}
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
            effectiveCosts={effectiveCostsByScenarioId}
            bookingLocked={bookingLocked}
            isActionPending={isActionPending}
            canAdd={
              inspector.kind === "library"
                ? canAddToDeck({
                    cardId: inspector.cardId,
                    cardIds: save.scenarioDeck.cardIds,
                    effectiveCosts: effectiveCostsByScenarioId,
                    budgetCap: save.budgetCap,
                  })
                : { ok: false, reason: "duplicate" }
            }
            canRemove={inspector.kind === "deck" && !bookingLocked && !isActionPending}
            onClose={() => setInspector(null)}
            onConfirmAdd={handleConfirmAdd}
            onConfirmRemove={handleConfirmRemove}
          />
        ) : null}
      </AnimatePresence>

      {isActionPending ? (
        <p className="mt-6 text-center font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          filing change…
        </p>
      ) : null}

      {repairStep.active ? (
        <TutorialCoachMark
          target={headerAnchorRef}
          placement="bottom"
          eyebrow="// datebook.repair"
          title="The Date Book is over budget"
          body="A budget cut put the deck above the cap. Drop cards from the deck below until the cap covers the spend. Cupid can not commit a new pair until the file is clean."
          primaryLabel="Got it"
          onPrimary={repairStep.complete}
          dismissLabel="Skip tour"
          onDismiss={repairStep.dismiss}
        />
      ) : null}

      {!repairStep.active && lockedStep.active ? (
        <TutorialCoachMark
          target={headerAnchorRef}
          placement="bottom"
          eyebrow="// datebook.locked"
          title="Date Book is locked"
          body="A pair is committed, so the deck is frozen until the date resolves. Cancel the booking from Live Date to edit, or finish the date first."
          primaryLabel="Got it"
          onPrimary={lockedStep.complete}
          dismissLabel="Skip tour"
          onDismiss={lockedStep.dismiss}
        />
      ) : null}
    </section>
  );
}

type DeckComposition = {
  risk: { low: number; medium: number; high: number };
  intimacy: { low: number; medium: number; high: number };
  chaos: { low: number; medium: number; high: number };
  lowPressure: number;
  highPressure: number;
};

function DateBookHeader({
  composition,
  budgetCap,
  spend,
  remaining,
  deckSize,
  status,
  warnings,
  offers,
  bookingLocked,
  onBack,
}: {
  composition: DeckComposition;
  budgetCap: number;
  spend: number;
  remaining: number;
  deckSize: number;
  status: ReturnType<typeof deriveDeckBudgetStatus>["status"];
  warnings: string[];
  offers: readonly BudgetDiscountOffer[];
  bookingLocked: boolean;
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
            Allocate budget across {DECK_SIZE_MIN} to {DECK_SIZE_MAX} cards. Drop refunds full cost
            instantly. Cupid draws three from this pool when you commit a pair.
          </p>
        </div>
        <GhostButton onClick={onBack}>← Back to Live Date</GhostButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DeckStatPill
          label="Remaining"
          value={remaining < 0 ? `−${Math.abs(remaining)}` : `${remaining}`}
          tone={status === "over_budget" ? "rose" : remaining <= 5 ? "amber" : "ink"}
          tooltip={DECK_STAT_TOOLTIPS.remaining}
        />
        <DeckStatPill
          label="Spent"
          value={`${spend} / ${budgetCap}`}
          tone={status === "over_budget" ? "rose" : "ink"}
          tooltip={DECK_STAT_TOOLTIPS.spent}
        />
        <DeckStatPill
          label="Cap"
          value={`${budgetCap}`}
          tone="ink"
          tooltip={DECK_STAT_TOOLTIPS.cap}
        />
        <DeckStatPill
          label="Slots"
          value={`${deckSize} / ${DECK_SIZE_MAX}`}
          tone={deckSize < DECK_SIZE_MIN ? "amber" : deckSize > DECK_SIZE_MAX ? "rose" : "ink"}
          tooltip={DECK_STAT_TOOLTIPS.slots}
        />
        <AxisPill label="Risk" counts={composition.risk} tooltip={DECK_STAT_TOOLTIPS.risk} />
        <AxisPill
          label="Intim"
          counts={composition.intimacy}
          tooltip={DECK_STAT_TOOLTIPS.intimacy}
        />
        <AxisPill label="Chaos" counts={composition.chaos} tooltip={DECK_STAT_TOOLTIPS.chaos} />
        <DeckStatPill
          label="Pressure"
          value={`${composition.lowPressure} low · ${composition.highPressure} high`}
          tone="ink"
          tooltip={DECK_STAT_TOOLTIPS.pressure}
        />
        {status === "over_budget" ? (
          <DeckStatPill label="Repair needed" value="drop cards to clear booking" tone="rose" />
        ) : null}
        {bookingLocked ? (
          <DeckStatPill
            label="Booking active"
            value="edits locked until date resolves"
            tone="amber"
          />
        ) : null}
        {warnings.map((warning) => (
          <DeckStatPill key={warning} label="Heads up" value={warning} tone="amber" />
        ))}
      </div>

      {offers.length === 0 ? null : (
        <div className="rounded-card border border-aura-hairline bg-white/70 p-3">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
            // discounts this period
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {offers.map((offer) => (
              <li
                key={offer.id}
                className="rounded-pill bg-aura-rose/10 px-3 py-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-rose"
                title={`Applies to ${offer.scenarioTagIds.join(", ") || "named cards"} until shift ${offer.expiresAtReviewShift}.`}
              >
                {offer.label} · {offer.percentOff}% off
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

function DeckStatPill({
  label,
  value,
  tone,
  tooltip,
}: {
  label: string;
  value: string;
  tone: "ink" | "amber" | "rose";
  tooltip?: string;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-300/60 bg-amber-50/80 text-amber-800"
      : tone === "rose"
        ? "border-aura-rose/30 bg-aura-rose/10 text-aura-rose"
        : "border-aura-hairline bg-white/70 text-aura-ink";
  const focusClass =
    tooltip === undefined
      ? ""
      : "cursor-help outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/45";
  const pill = (
    <span
      tabIndex={tooltip === undefined ? undefined : 0}
      aria-label={tooltip === undefined ? undefined : `${label}: ${value}. ${tooltip}`}
      className={`inline-flex items-center gap-2 rounded-pill border px-3 py-1 font-mono text-micro uppercase tracking-[0.22em] ${toneClass} ${focusClass}`}
    >
      <span className="text-aura-faint">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );

  if (tooltip === undefined) {
    return pill;
  }

  return (
    <Tooltip message={tooltip} placement="bottom-start">
      {pill}
    </Tooltip>
  );
}

function AxisPill({
  label,
  counts,
  tooltip,
}: {
  label: string;
  counts: { low: number; medium: number; high: number };
  tooltip: string;
}) {
  const countSummary = `${counts.low} low, ${counts.medium} medium, ${counts.high} high`;

  return (
    <Tooltip message={tooltip} placement="bottom-start">
      <span
        tabIndex={0}
        aria-label={`${label}: ${countSummary}. ${tooltip}`}
        className="inline-flex cursor-help items-center gap-2 rounded-pill border border-aura-hairline bg-white/70 px-3 py-1 font-mono text-micro uppercase tracking-[0.22em] outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/45"
      >
        <span className="text-aura-faint">{label}</span>
        <span className="flex items-center gap-1.5">
          <CountPip count={counts.low} tone="low" />
          <CountPip count={counts.medium} tone="medium" />
          <CountPip count={counts.high} tone="high" />
        </span>
      </span>
    </Tooltip>
  );
}

function CountPip({ count, tone }: { count: number; tone: "low" | "medium" | "high" }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${RISK_TEXT_TONE[tone]}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${RISK_DOT_TONE[tone]}`} />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}

function DeckColumn({
  deckScenarios,
  effectiveCosts,
  onDeckCardClick,
}: {
  deckScenarios: ReadonlyArray<{
    cardId: string;
    scenario: DateScenario | undefined;
    slot: number;
  }>;
  effectiveCosts: Record<string, number>;
  onDeckCardClick: (cardId: string) => void;
}) {
  return (
    <section className="relative">
      <div className="flex items-baseline justify-between gap-3 pb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">
            Active deck
          </h2>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            {deckScenarios.length} / {DECK_SIZE_MAX} slots
          </span>
        </div>
      </div>

      <div className="aura-glass relative rounded-card p-4 lg:p-5">
        <div className="aura-dot-grid pointer-events-none absolute inset-0 rounded-card opacity-30" />
        <ul className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {deckScenarios.map(({ cardId, scenario, slot }) => {
            if (scenario === undefined) return null;
            return (
              <li key={cardId} className="relative">
                <motion.div
                  layout
                  initial={false}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.24, ease: "easeInOut" }}
                >
                  <ScenarioCard
                    scenario={scenario}
                    size="tile"
                    state="default"
                    effectiveCost={effectiveCosts[cardId] ?? scenario.card.cost}
                    onClick={() => onDeckCardClick(cardId)}
                  />
                </motion.div>
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-1.5 left-2 z-30 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint"
                >
                  slot {slot + 1}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function LibraryColumn({
  library,
  scenarioById,
  search,
  riskFilter,
  sortMode,
  effectiveCosts,
  budgetCap,
  deckCardIds,
  onSearchChange,
  onRiskFilterChange,
  onSortChange,
  onLibraryCardClick,
}: {
  library: ReadonlyArray<{ scenarioId: string }>;
  scenarioById: ReadonlyMap<string, DateScenario>;
  search: string;
  riskFilter: RiskFilter;
  sortMode: SortMode;
  effectiveCosts: Record<string, number>;
  budgetCap: number;
  deckCardIds: readonly string[];
  onSearchChange: (value: string) => void;
  onRiskFilterChange: (value: RiskFilter) => void;
  onSortChange: (value: SortMode) => void;
  onLibraryCardClick: (scenarioId: string) => void;
}) {
  const libraryRows = useMemo(() => {
    const deckSet = new Set(deckCardIds);
    const remaining = budgetCap - deckCardIds.reduce((s, id) => s + (effectiveCosts[id] ?? 0), 0);
    const deckIsFull = deckCardIds.length >= DECK_SIZE_MAX;
    return library.flatMap((entry) => {
      const scenario = scenarioById.get(entry.scenarioId);
      if (scenario === undefined) return [];
      const effectiveCost = effectiveCosts[scenario.id] ?? scenario.card.cost;
      const inDeck = deckSet.has(scenario.id);
      const overBudget = !inDeck && effectiveCost > remaining;
      const cantFit = inDeck || deckIsFull || overBudget;
      const fitTitle = inDeck
        ? "Already in deck."
        : deckIsFull
          ? "Deck is at the slot cap. Drop a card first."
          : overBudget
            ? "Adding this card would exceed remaining budget."
            : undefined;
      return [{ scenario, effectiveCost, cantFit, fitTitle }];
    });
  }, [library, scenarioById, effectiveCosts, deckCardIds, budgetCap]);

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
      </div>

      <div className="aura-glass relative flex flex-col gap-3 rounded-card p-4 lg:min-h-0 lg:flex-1 lg:p-5">
        <LibraryFilters
          search={search}
          riskFilter={riskFilter}
          sortMode={sortMode}
          onSearchChange={onSearchChange}
          onRiskFilterChange={onRiskFilterChange}
          onSortChange={onSortChange}
        />

        <div className="aura-rule" />

        <div className="max-h-[64vh] overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1">
          {library.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-aura-muted">
              No cards match these filters.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {libraryRows.map((row) => (
                <li key={row.scenario.id} className="relative">
                  <motion.div
                    layout
                    initial={false}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.24, ease: "easeInOut" }}
                    className={row.cantFit ? "opacity-65 saturate-[0.7]" : ""}
                    title={row.fitTitle}
                  >
                    <ScenarioCard
                      scenario={row.scenario}
                      size="tile"
                      state={row.cantFit ? "disabled" : "default"}
                      effectiveCost={row.effectiveCost}
                      onClick={() => onLibraryCardClick(row.scenario.id)}
                    />
                  </motion.div>
                </li>
              ))}
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
  onSearchChange,
  onRiskFilterChange,
  onSortChange,
}: {
  search: string;
  riskFilter: RiskFilter;
  sortMode: SortMode;
  onSearchChange: (value: string) => void;
  onRiskFilterChange: (value: RiskFilter) => void;
  onSortChange: (value: SortMode) => void;
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

function InspectorModal({
  target,
  scenarioById,
  effectiveCosts,
  bookingLocked,
  isActionPending,
  canAdd,
  canRemove,
  onClose,
  onConfirmAdd,
  onConfirmRemove,
}: {
  target: InspectorTarget;
  scenarioById: ReadonlyMap<string, DateScenario>;
  effectiveCosts: Record<string, number>;
  bookingLocked: boolean;
  isActionPending: boolean;
  canAdd: { ok: true } | { ok: false; reason: string };
  canRemove: boolean;
  onClose: () => void;
  onConfirmAdd: (cardId: string) => void;
  onConfirmRemove: (cardId: string) => void;
}) {
  const scenario = scenarioById.get(target.cardId);
  if (scenario === undefined) return null;
  const isDeck = target.kind === "deck";
  const eyebrow = isDeck ? "// active deck slot" : "// library card";
  let primaryAction: ScenarioDetailsAction | undefined;
  let footnote: string | undefined;

  if (target.kind === "deck") {
    if (bookingLocked) {
      footnote = "Booking is committed. Drop is locked until the date resolves.";
    } else if (canRemove) {
      primaryAction = {
        label: `Drop this card · refund ${effectiveCosts[target.cardId] ?? scenario.card.cost}`,
        onClick: () => onConfirmRemove(target.cardId),
        disabled: isActionPending,
      };
    }
  } else if (canAdd.ok) {
    primaryAction = {
      label: `Add to deck · spend ${effectiveCosts[target.cardId] ?? scenario.card.cost}`,
      onClick: () => onConfirmAdd(target.cardId),
      disabled: isActionPending || bookingLocked,
    };
  } else {
    footnote =
      canAdd.reason === "deck_full"
        ? "Deck is at the slot cap. Drop a card first."
        : canAdd.reason === "over_budget"
          ? "Adding this card would exceed remaining budget. Drop a card or wait for a discount."
          : canAdd.reason === "duplicate"
            ? "Already in deck."
            : "This card is not currently bookable.";
  }

  return (
    <ScenarioDetailsModal
      scenario={scenario}
      eyebrow={eyebrow}
      statusLabel={footnote}
      primaryAction={primaryAction}
      onClose={onClose}
    />
  );
}

export const __INTERNAL = { isOfferApplicableToScenario, EASE_OUT_QUART };
