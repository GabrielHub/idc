import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  DECK_SIZE_MAX,
  DECK_SIZE_MIN,
  type DateScenario,
  type GameSave,
  type PendingCardOffer,
} from "../../domain/game";
import {
  activeBudgetDiscountOffers,
  computeEffectiveCosts,
  currentDeckSpend,
} from "../../services/budget";
import { planCardOfferResolution } from "../../services/deck";
import { starterScenarios } from "../../fixtures";
import { AuraButton } from "../aura-button";
import { EASE_OUT_QUART } from "../dashboard-atoms";
import { CathedralCard } from "./cathedral-card";
import type { DoorEntry } from "./cathedral";
import { scenarioWithEffectiveCost } from "./scenario-doors";

/**
 * Post-date / post-closure card-offer resolution. Driven declaratively by
 * `save.pendingCardOffer`: it surfaces whenever the player is in the lobby with
 * an unresolved offer (so it survives reload and is decoupled from the
 * date-completion handlers). The player takes up to `takeLimit` offered cards;
 * when a take would push the deck over the slot cap or the budget cap, a
 * drop-selection step appears so the resulting deck lands inside
 * [DECK_SIZE_MIN, DECK_SIZE_MAX] and at or under the budget. The confirm button
 * mirrors `resolveCardOffer`'s guards exactly, so it can never throw.
 */
export function CardOfferOverlay({
  save,
  isActionPending,
  onResolve,
  onShuffle,
}: {
  save: GameSave;
  isActionPending: boolean;
  onResolve: (input: { takenIds: string[]; droppedIds: string[] }) => void;
  onShuffle: () => void;
}) {
  const offer = save.pendingCardOffer;
  if (offer === null) return null;
  return (
    <CardOfferOverlayBody
      // Re-mount per offer identity so the local selection state resets when a
      // reshuffle swaps the cards or a fresh offer arrives.
      key={`${offer.kind}:${offer.cardIds.join("|")}`}
      save={save}
      offer={offer}
      isActionPending={isActionPending}
      onResolve={onResolve}
      onShuffle={onShuffle}
    />
  );
}

function CardOfferOverlayBody({
  save,
  offer,
  isActionPending,
  onResolve,
  onShuffle,
}: {
  save: GameSave;
  offer: PendingCardOffer;
  isActionPending: boolean;
  onResolve: (input: { takenIds: string[]; droppedIds: string[] }) => void;
  onShuffle: () => void;
}) {
  const scenarioById = useMemo(
    () => new Map(starterScenarios.map((scenario) => [scenario.id, scenario] as const)),
    [],
  );
  const effectiveCosts = useMemo(
    () => computeEffectiveCosts(starterScenarios, activeBudgetDiscountOffers(save)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [save.budgetDiscountOffers, save.budgetPeriodId],
  );
  const deckBaseIds = save.scenarioDeck.cardIds;
  const currentSpend = useMemo(
    () => currentDeckSpend(deckBaseIds, effectiveCosts),
    [deckBaseIds, effectiveCosts],
  );

  const [takenIds, setTakenIds] = useState<ReadonlySet<string>>(() => new Set());
  const [droppedIds, setDroppedIds] = useState<ReadonlySet<string>>(() => new Set());

  const costOf = (id: string) => effectiveCosts[id] ?? scenarioById.get(id)?.card.cost ?? 0;
  const takenList = useMemo(() => [...takenIds], [takenIds]);
  const droppedList = useMemo(() => [...droppedIds], [droppedIds]);

  const takenCost = takenList.reduce((sum, id) => sum + costOf(id), 0);

  // Single source of truth for the take/drop verdict — the same plan
  // resolveCardOffer commits. The overlay structurally prevents illegal
  // membership moves, so in practice only the size/budget flags fire here.
  const plan = useMemo(
    () =>
      planCardOfferResolution(save, starterScenarios, {
        takenIds: takenList,
        droppedIds: droppedList,
      }),
    [save, takenList, droppedList],
  );
  const { finalSize, finalSpend, overSlotCap, overBudget, underSlotMin } = plan;
  // The drop step opens once the staged take would overflow the slot cap or the
  // budget; otherwise the player can confirm a clean take straight away.
  const needsDropStep = overSlotCap || overBudget || droppedList.length > 0;
  const isLegal = plan.legal && takenList.length > 0;

  // The smallest spend any take of `extraCost` can reach: drop the most
  // expensive deck cards down to the slot floor. If even that stays over budget
  // the take is infeasible, so its card is locked with a reason.
  const sortedDeckCostsDesc = useMemo(
    () => deckBaseIds.map((id) => costOf(id)).sort((a, b) => b - a),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deckBaseIds, effectiveCosts],
  );
  const minSpendForTakeCount = (takeCount: number, extraCost: number): number => {
    const maxDrops = Math.max(0, deckBaseIds.length + takeCount - DECK_SIZE_MIN);
    let refund = 0;
    for (let index = 0; index < maxDrops && index < sortedDeckCostsDesc.length; index += 1) {
      refund += sortedDeckCostsDesc[index] ?? 0;
    }
    return currentSpend + extraCost - refund;
  };

  const atTakeLimit = takenList.length >= offer.takeLimit;
  const offerCardState = (
    id: string,
  ): { selected: boolean; disabled: boolean; reason?: string } => {
    const selected = takenIds.has(id);
    if (selected) return { selected: true, disabled: false };
    if (atTakeLimit) {
      return {
        selected: false,
        disabled: true,
        reason: `Offer allows taking ${offer.takeLimit} card${offer.takeLimit === 1 ? "" : "s"}.`,
      };
    }
    // Feasibility: could taking this card alongside the current picks ever land
    // a legal deck? If the cheapest reachable spend stays over budget, no.
    const projectedTakeCount = takenList.length + 1;
    const projectedExtra = takenCost + costOf(id);
    if (minSpendForTakeCount(projectedTakeCount, projectedExtra) > save.budgetCap) {
      return {
        selected: false,
        disabled: true,
        reason: "No drop set keeps the deck under budget.",
      };
    }
    return { selected: false, disabled: false };
  };

  const toggleTake = (id: string) => {
    setTakenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (current.size >= offer.takeLimit) return current;
        next.add(id);
      }
      return next;
    });
  };
  const toggleDrop = (id: string) => {
    setDroppedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (!isLegal || isActionPending) return;
    onResolve({ takenIds: takenList, droppedIds: droppedList });
  };
  const handleSkip = () => {
    if (isActionPending) return;
    onResolve({ takenIds: [], droppedIds: [] });
  };

  const eyebrow = offer.kind === "date" ? "// draw.date" : "// draw.closure";
  const heading =
    offer.kind === "date"
      ? "New rooms from tonight's date — take one"
      : "Closure draw — take up to two";
  const slotTone = overSlotCap || underSlotMin ? "text-aura-rose" : "text-aura-paper";
  const budgetToneClass = overBudget ? "text-aura-rose" : "text-aura-paper";

  const confirmReason = overBudget
    ? "Drop more cards — deck is over budget."
    : overSlotCap
      ? "Drop cards until the deck fits the slot cap."
      : underSlotMin
        ? `Keep at least ${DECK_SIZE_MIN} cards in the deck.`
        : takenList.length === 0
          ? "Pick a card to add, or skip the draw."
          : undefined;

  return (
    <AnimatePresence>
      <motion.div
        key="card-offer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
        className="fixed inset-0 z-[70] grid place-items-center px-4 py-6"
        role="dialog"
        aria-modal="true"
        aria-label={heading}
      >
        <span aria-hidden className="absolute inset-0 bg-aura-ink/60 backdrop-blur-sm" />

        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.99 }}
          transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
          className="aura-liquid-glass aura-liquid-glass-rose relative flex max-h-[88vh] w-full max-w-[68rem] flex-col overflow-hidden rounded-card"
        >
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-white/10 px-6 py-5">
            <div className="min-w-0">
              <div className="font-mono text-sm uppercase tracking-[0.22em] text-aura-rose">
                {eyebrow}
              </div>
              <h2 className="mt-1 font-display text-display-md font-semibold leading-tight text-aura-paper">
                {heading}
              </h2>
              <p className="mt-2 font-sans text-sm text-white/70">
                Taken rooms join your deck. The rest return to the bottom of the draw pile.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OfferShard
                eyebrow="slots"
                value={`${finalSize} / ${DECK_SIZE_MAX}`}
                valueClass={slotTone}
              />
              <OfferShard
                eyebrow="budget"
                value={`${finalSpend} / ${save.budgetCap}`}
                valueClass={budgetToneClass}
              />
              <OfferShard
                eyebrow="taken"
                value={`${takenList.length} / ${offer.takeLimit}`}
                valueClass="text-aura-paper"
              />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <OfferCardGrid
              label="Offered rooms"
              hint={`Tap to take up to ${offer.takeLimit}.`}
              cards={offer.cardIds}
              scenarioById={scenarioById}
              effectiveCosts={effectiveCosts}
              stateFor={offerCardState}
              onToggle={toggleTake}
            />

            {needsDropStep ? (
              <div className="mt-6">
                <DropStepBanner overBudget={overBudget} overSlotCap={overSlotCap} />
                <DeckDropGrid
                  cards={deckBaseIds}
                  scenarioById={scenarioById}
                  effectiveCosts={effectiveCosts}
                  droppedIds={droppedIds}
                  onToggle={toggleDrop}
                />
              </div>
            ) : null}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
            <div className="font-mono text-sm uppercase tracking-[0.18em] text-aura-amber">
              {confirmReason ?? "Deck is legal — add and continue."}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {offer.canShuffle ? (
                <AuraButton
                  tooltip="Return these cards and redraw a fresh offer"
                  onClick={() => {
                    if (!isActionPending) onShuffle();
                  }}
                  disabled={isActionPending}
                  className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-4 py-2 font-display text-sm text-aura-paper disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Reshuffle
                </AuraButton>
              ) : null}
              <AuraButton
                tooltip="Decline the draw — all cards return to the pile"
                onClick={handleSkip}
                disabled={isActionPending}
                className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-4 py-2 font-display text-sm text-aura-paper disabled:cursor-not-allowed disabled:opacity-55"
              >
                Skip
              </AuraButton>
              <AuraButton
                tooltip={confirmReason ?? "Add the selection to your deck"}
                onClick={handleConfirm}
                disabled={!isLegal || isActionPending}
                className="aura-liquid-cta cursor-pointer rounded-full px-5 py-2 font-display text-sm disabled:cursor-not-allowed disabled:opacity-55"
              >
                Add to deck
              </AuraButton>
            </div>
          </footer>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}

function OfferShard({
  eyebrow,
  value,
  valueClass,
}: {
  eyebrow: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="aura-liquid-glass rounded-full px-3 py-1 leading-tight">
      <span className="font-mono text-sm uppercase tracking-[0.18em] text-white/55">{eyebrow}</span>
      <span className={`ml-1.5 font-display text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}

function DropStepBanner({
  overBudget,
  overSlotCap,
}: {
  overBudget: boolean;
  overSlotCap: boolean;
}) {
  const copy = overBudget
    ? "This take is over budget. Drop deck cards to free up spend."
    : overSlotCap
      ? "This take overflows the slot cap. Drop deck cards to make room."
      : "Drop deck cards to swap them out for the take.";
  return (
    <div className="aura-liquid-glass aura-liquid-glass-amber mb-3 inline-flex items-center gap-2 rounded-pill py-1.5 pl-2.5 pr-3.5 leading-tight">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full bg-aura-amber shadow-[0_0_10px_rgba(245,158,11,0.85)]"
      />
      <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-aura-amber">
        drop to fit
      </span>
      <span className="font-sans text-sm text-aura-paper">{copy}</span>
    </div>
  );
}

function OfferCardGrid({
  label,
  hint,
  cards,
  scenarioById,
  effectiveCosts,
  stateFor,
  onToggle,
}: {
  label: string;
  hint: string;
  cards: readonly string[];
  scenarioById: ReadonlyMap<string, DateScenario>;
  effectiveCosts: Readonly<Record<string, number>>;
  stateFor: (id: string) => { selected: boolean; disabled: boolean; reason?: string };
  onToggle: (id: string) => void;
}) {
  return (
    <section>
      <GridHeading label={label} hint={hint} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {cards.map((id) => {
          const scenario = scenarioById.get(id);
          if (scenario === undefined) return null;
          const state = stateFor(id);
          const entry: DoorEntry = {
            scenario: scenarioWithEffectiveCost(scenario, effectiveCosts),
            kind: "draw",
            disabled: state.disabled,
          };
          return (
            <OfferCardCell key={id} reason={state.disabled ? state.reason : undefined}>
              <CathedralCard
                entry={entry}
                mode="auto"
                showTooltip={false}
                selected={state.selected}
                hovered={false}
                onSelect={() => {
                  if (!state.disabled) onToggle(id);
                }}
                onOpenDetail={() => {
                  if (!state.disabled) onToggle(id);
                }}
                onHoverEnter={() => undefined}
                onHoverLeave={() => undefined}
                indexDelay={0}
                reducedMotion={true}
              />
            </OfferCardCell>
          );
        })}
      </div>
    </section>
  );
}

function DeckDropGrid({
  cards,
  scenarioById,
  effectiveCosts,
  droppedIds,
  onToggle,
}: {
  cards: readonly string[];
  scenarioById: ReadonlyMap<string, DateScenario>;
  effectiveCosts: Readonly<Record<string, number>>;
  droppedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section>
      <GridHeading label="Your deck" hint="Tap a staged card to drop it." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((id, index) => {
          const scenario = scenarioById.get(id);
          if (scenario === undefined) return null;
          const entry: DoorEntry = {
            scenario: scenarioWithEffectiveCost(scenario, effectiveCosts),
            kind: "deck",
            slotLabel: droppedIds.has(id) ? "dropping" : `slot ${index + 1}`,
          };
          return (
            <CathedralCard
              key={id}
              entry={entry}
              mode="deck"
              showTooltip={false}
              selected={droppedIds.has(id)}
              hovered={false}
              onSelect={() => onToggle(id)}
              onOpenDetail={() => onToggle(id)}
              onHoverEnter={() => undefined}
              onHoverLeave={() => undefined}
              indexDelay={0}
              reducedMotion={true}
            />
          );
        })}
      </div>
    </section>
  );
}

function GridHeading({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h3 className="font-display text-display-sm leading-none text-aura-paper">{label}</h3>
      <span className="font-mono text-sm uppercase tracking-[0.18em] text-white/55">{hint}</span>
    </div>
  );
}

function OfferCardCell({ reason, children }: { reason?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {children}
      {reason === undefined ? null : (
        <span className="font-mono text-sm uppercase tracking-[0.14em] text-aura-amber/90">
          {reason}
        </span>
      )}
    </div>
  );
}
