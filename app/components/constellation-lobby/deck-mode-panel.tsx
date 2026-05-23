/**
 * Deck mode panel for the constellation lobby's ScenarioPanel. When the
 * player taps the Date book NavShard from the TopBar, the ScenarioPanel
 * swaps from the auto 3-card draw view into this view: every card in
 * `save.scenarioDeck.cardIds` rendered as a liquid-glass tile, with a
 * filter rail summary header (slot count + spend + budget), and a
 * tap-to-expand inline focused glass-rose card with a Drop CTA.
 *
 * The panel lives inside the lobby's overlay surface and does NOT scroll
 * the page; tiles are laid out in a 4-column grid sized to the deck cap.
 *
 * No filter chips here — the deck is already curated by the player. Filter
 * controls live in the Library mode panel.
 */

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import type { DateScenario } from "../../domain/game";
import { DECK_SIZE_MAX, DECK_SIZE_MIN } from "../../domain/game";
import { LobbyScenarioCard } from "./canvas-convention";
import type { LobbyScenario } from "./types";

export type DeckModePanelProps = {
  deckCardIds: readonly string[];
  scenarioById: ReadonlyMap<string, DateScenario>;
  toLobbyScenario: (scenario: DateScenario) => LobbyScenario;
  effectiveCosts: Record<string, number>;
  spend: number;
  budgetCap: number;
  status: "within_budget" | "over_budget" | "invalid_size";
  bookingLocked: boolean;
  isActionPending: boolean;
  onDrop: (cardId: string) => void;
};

export function DeckModePanel({
  deckCardIds,
  scenarioById,
  toLobbyScenario,
  effectiveCosts,
  spend,
  budgetCap,
  status,
  bookingLocked,
  isActionPending,
  onDrop,
}: DeckModePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const slotCount = deckCardIds.length;
  const budgetTone =
    status === "over_budget" ? "text-aura-rose" : spend > budgetCap * 0.85 ? "text-aura-amber" : "";
  const overBudget = status === "over_budget";

  return (
    <section className="flex flex-col gap-3 rounded-card aura-liquid-glass aura-liquid-glass-ink p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="leading-tight">
          <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
            // date book · deck
          </div>
          <div className="font-display text-display-sm text-aura-paper">
            {slotCount}/{DECK_SIZE_MAX} slots
            <span className="ml-2 font-mono text-micro uppercase tracking-[0.18em] text-white/55">
              · {DECK_SIZE_MIN} min
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-micro uppercase tracking-[0.22em] ${budgetTone || "text-white/65"}`}
          >
            {spend}/{budgetCap} budget
            {overBudget ? " · over" : ""}
          </span>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
            · tap a card to drop · refunds the full effective cost
          </span>
        </div>
      </header>

      {slotCount === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-white/65">
          No cards in deck. Switch to library to add scenarios.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {deckCardIds.map((cardId, slot) => {
            const scenario = scenarioById.get(cardId);
            if (scenario === undefined) return null;
            const lobby = toLobbyScenario(scenario);
            const effective = effectiveCosts[cardId] ?? scenario.card.cost;
            const expanded = expandedId === cardId;
            return (
              <LobbyScenarioCard
                key={cardId}
                scenario={{ ...lobby, cost: effective }}
                selected={expanded}
                dimmed={expandedId !== null && expandedId !== cardId}
                slotLabel={`slot ${slot + 1}`}
                onClick={() => setExpandedId(expanded ? null : cardId)}
              />
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
              return (
                <DeckCardExpanded
                  key={expandedId}
                  scenario={scenario}
                  effectiveCost={effective}
                  bookingLocked={bookingLocked}
                  isActionPending={isActionPending}
                  onDrop={() => {
                    onDrop(expandedId);
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

function DeckCardExpanded({
  scenario,
  effectiveCost,
  bookingLocked,
  isActionPending,
  onDrop,
  onClose,
}: {
  scenario: DateScenario;
  effectiveCost: number;
  bookingLocked: boolean;
  isActionPending: boolean;
  onDrop: () => void;
  onClose: () => void;
}) {
  const dropDisabled = bookingLocked || isActionPending;
  return (
    <motion.div
      key="deck-expanded"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.24, ease: [0.22, 0.8, 0.2, 1] }}
      className="rounded-card aura-liquid-glass aura-liquid-glass-rose p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 leading-tight">
          <div className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
            // active deck slot
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
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onDrop}
          disabled={dropDisabled}
          className="cursor-pointer disabled:cursor-not-allowed aura-liquid-cta rounded-full px-5 py-2 font-display text-label disabled:opacity-55"
        >
          Drop card · refund {effectiveCost}
        </button>
        {bookingLocked ? (
          <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-amber">
            booking active · edits locked until the date resolves
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
