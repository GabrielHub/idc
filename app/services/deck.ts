import {
  DECK_SIZE_MAX,
  DECK_SIZE_MIN,
  STARTER_BUDGET_CAP,
  pendingCardOfferSchema,
  scenarioDeckSchema,
  type ActiveDateBooking,
  type CardOfferKind,
  type DateScenario,
  type GameSave,
  type PendingCardOffer,
  type ScenarioDeck,
} from "../domain/game";
import {
  computeEffectiveCosts,
  currentDeckSpend,
  deriveDeckBudgetStatus,
  activeBudgetDiscountOffers,
} from "./budget";
import { arraysShallowEqual, createNamespacedRandom, randomIndex, shuffleInPlace } from "./utils";

export const SCENARIO_HAND_SIZE = 3;

/**
 * Post-date card offer sizing. A date end offers DATE_OFFER_COUNT cards from the
 * top of the circulating draw pile and lets the player take up to DATE_OFFER_TAKE.
 * Closures (the win action) draw a larger CLOSURE_OFFER_COUNT and allow a one-time
 * pile reshuffle. Tunable; see drawCardOffer().
 */
export const DATE_OFFER_COUNT = 3;
export const DATE_OFFER_TAKE = 1;
export const CLOSURE_OFFER_COUNT = 5;
export const CLOSURE_OFFER_TAKE = 2;

/**
 * Starter-eligible scenario ids. Mixes grounded real-world rooms (DMV, diner,
 * bowling) with cozy-cosmic and gently absurd ones (cheese moon, alive brick,
 * chrome aviary, beer river) so onboarding advertises the game's range. This is
 * the pool the player drafts their opening deck from during onboarding. Every
 * other room (heavier set pieces, grief beats, high-pressure rooms) reaches the
 * player through post-date card offers off the circulating draw pile, not a
 * numeric unlock gate.
 *
 * Listed grounded-first then weird, cost ascending within each group. UI sorts
 * by cost anyway via sortedStarterCatalog().
 */
export const STARTER_CATALOG_IDS: readonly string[] = [
  // Grounded real-world rooms.
  "dmv-number-ticket",
  "grocery-run-one-dinner",
  "couch-night-takeout",
  "mall-food-court-weeknight",
  "park-loop-with-a-dog",
  "hardware-store-one-project",
  "diner-eleven-pm",
  "open-house-sunday",
  "pottery-studio-drop-in",
  "executive-lunch-one-agenda-item",
  "county-fair-friday",
  // Cozy-cosmic and gently absurd rooms.
  "brick-by-brick",
  "empty-room-many-windows",
  "tap-water",
  "concession-stand-heat-death",
  "build-a-bear-empty-mall",
  "not-the-bees",
  "the-peanut-gallery",
  "birds-arent-real",
  "wet-paint",
  "hedge-witch-tea-hour",
  "how-to-train-your-wagon",
  "infinite-library",
  "it-was-cheese-all-along",
];

/**
 * Player-facing starter deck used when onboarding finishes. Hand-picked to
 * span flow types (conversation / activity / set_piece) and tone axes
 * (grounded, absurd-funny, cozy-haunted, cosmic-comedic) so the first shift
 * never looks like an all-chore board or an all-spectacle one. Sits well under
 * STARTER_BUDGET_CAP and is sized at DECK_SIZE_MIN so onboarding hands the
 * player the smallest legal deck to start.
 */
export const STARTER_DECK_IDS: readonly string[] = [
  "park-loop-with-a-dog",
  "diner-eleven-pm",
  "tap-water",
  "build-a-bear-empty-mall",
  "not-the-bees",
  "it-was-cheese-all-along",
];

/**
 * Deterministic fallback used when no player-drafted deck exists yet (pre-onboarding
 * test fixtures, dev seeds). This is NOT the player-facing starter deck; onboarding
 * applies STARTER_DECK_IDS when the first focus cases are confirmed.
 */
export const PRE_ONBOARDING_FALLBACK_DECK_IDS: readonly string[] = STARTER_CATALOG_IDS.slice(0, 10);

export function dateBookEditingUnlocked(save: GameSave): boolean {
  return save.dateSessions.some((session) => session.finalReport !== undefined);
}

export function createInitialScenarioDeck(scenarios: readonly DateScenario[]): ScenarioDeck {
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
  const cardIds = PRE_ONBOARDING_FALLBACK_DECK_IDS.filter((cardId) => scenarioIds.has(cardId));

  return scenarioDeckSchema.parse({
    cardIds: [...cardIds],
  });
}

export function sortedStarterCatalog(scenarios: readonly DateScenario[]): DateScenario[] {
  const starterIds = new Set(STARTER_CATALOG_IDS);
  return scenarios
    .filter((scenario) => starterIds.has(scenario.id))
    .sort((a, b) => a.card.cost - b.card.cost);
}

export function onboardingDeckTutorialPickId(
  scenarios: readonly DateScenario[],
): string | undefined {
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
  return STARTER_DECK_IDS.find((id) => scenarioIds.has(id));
}

export function createOnboardingDeckPrefillIds(scenarios: readonly DateScenario[]): string[] {
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
  return STARTER_DECK_IDS.filter((id) => scenarioIds.has(id));
}

export function createStarterScenarioDeck(scenarios: readonly DateScenario[]): ScenarioDeck {
  return createDraftedScenarioDeck({
    cardIds: STARTER_DECK_IDS,
    catalog: scenarios,
    catalogIds: STARTER_CATALOG_IDS,
    budgetCap: STARTER_BUDGET_CAP,
    effectiveCosts: computeEffectiveCosts(scenarios, []),
  });
}

export type DraftDeckInput = {
  cardIds: readonly string[];
  catalog: readonly DateScenario[];
  catalogIds?: readonly string[];
  budgetCap: number;
  effectiveCosts: Record<string, number>;
};

export function createDraftedScenarioDeck(input: DraftDeckInput): ScenarioDeck {
  const catalogById = new Map(input.catalog.map((scenario) => [scenario.id, scenario]));
  const catalogAllowed = input.catalogIds === undefined ? null : new Set(input.catalogIds);
  const uniqueIds: string[] = [];
  const seen = new Set<string>();

  for (const cardId of input.cardIds) {
    if (seen.has(cardId)) {
      throw new Error(`Date Book draft duplicates ${cardId}.`);
    }
    if (!catalogById.has(cardId)) {
      throw new Error(`Date Book draft includes unknown room card ${cardId}.`);
    }
    if (catalogAllowed !== null && !catalogAllowed.has(cardId)) {
      throw new Error(`Scenario ${cardId} is not in the starter catalog.`);
    }
    seen.add(cardId);
    uniqueIds.push(cardId);
  }

  if (uniqueIds.length < DECK_SIZE_MIN || uniqueIds.length > DECK_SIZE_MAX) {
    throw new Error(
      `Date Book must hold between ${DECK_SIZE_MIN} and ${DECK_SIZE_MAX} room cards. Got ${uniqueIds.length}.`,
    );
  }

  const spend = currentDeckSpend(uniqueIds, input.effectiveCosts);
  if (spend > input.budgetCap) {
    throw new Error(
      `Date Book spends ${spend} against a ${input.budgetCap} cap. Drop room cards before confirming.`,
    );
  }

  return scenarioDeckSchema.parse({
    cardIds: uniqueIds,
  });
}

export type DrawHandResult = {
  cardIds: string[];
};

export function drawHand(deck: ScenarioDeck, seedKey: string): string[] {
  const random = createNamespacedRandom("scenario-hand", [seedKey]);
  const availableIds = [...deck.cardIds];

  if (availableIds.length === 0) {
    return [];
  }

  const handSize = Math.min(SCENARIO_HAND_SIZE, availableIds.length);
  const drawn: string[] = [];

  for (let index = 0; index < handSize; index += 1) {
    const pickIndex = randomIndex(availableIds.length, random);
    const picked = availableIds.splice(pickIndex, 1)[0];

    if (picked !== undefined) {
      drawn.push(picked);
    }
  }

  return drawn;
}

export function drawHandForBooking({
  deck,
  shiftNumber,
  pairId,
}: {
  deck: ScenarioDeck;
  shiftNumber: number;
  pairId: string;
}): string[] {
  const sortedCardIds = [...deck.cardIds].sort();
  const cardSignature = sortedCardIds.join("|");
  return drawHand({ cardIds: sortedCardIds }, `booking:${shiftNumber}:${pairId}:${cardSignature}`);
}

export function removeCardFromDeck(save: GameSave, cardId: string): GameSave {
  if (!save.scenarioDeck.cardIds.includes(cardId)) {
    throw new Error(`Room card ${cardId} is not in the Date Book.`);
  }
  if (save.scenarioDeck.cardIds.length <= DECK_SIZE_MIN) {
    throw new Error(
      `Date Book must keep at least ${DECK_SIZE_MIN} room cards. Draw new room cards before dropping.`,
    );
  }

  // Recirculate the dropped card to the bottom of the draw pile so it can be
  // re-offered later. Without this the card is orphaned — present in neither the
  // deck nor the pile — which breaks the deck ∪ pile ∪ offer partition until a
  // load-time reconcile silently repairs it.
  return {
    ...save,
    scenarioDeck: scenarioDeckSchema.parse({
      cardIds: save.scenarioDeck.cardIds.filter((id) => id !== cardId),
    }),
    drawPile: [...save.drawPile, cardId],
  };
}

export function deckIsRepairBlocked(save: GameSave, scenarios: readonly DateScenario[]): boolean {
  const offers = activeBudgetDiscountOffers(save);
  const effectiveCosts = computeEffectiveCosts(scenarios, offers);
  const status = deriveDeckBudgetStatus({
    cardIds: save.scenarioDeck.cardIds,
    effectiveCosts,
    budgetCap: save.budgetCap,
  }).status;
  return status !== "within_budget";
}

export function buildBookingDeckSnapshot({
  save,
  scenarios,
  booking,
}: {
  save: GameSave;
  scenarios: readonly DateScenario[];
  booking?: ActiveDateBooking;
}): {
  cardIds: readonly string[];
  effectiveCosts: Record<string, number>;
  budgetCap: number;
} {
  if (booking !== undefined) {
    return {
      cardIds: booking.deckSnapshot.cardIds,
      effectiveCosts: booking.deckSnapshot.effectiveCosts,
      budgetCap: booking.deckSnapshot.budgetCap,
    };
  }
  const offers = activeBudgetDiscountOffers(save);
  return {
    cardIds: save.scenarioDeck.cardIds,
    effectiveCosts: computeEffectiveCosts(scenarios, offers),
    budgetCap: save.budgetCap,
  };
}

export function softComposeWarnings(
  deck: ScenarioDeck,
  scenarios: readonly DateScenario[],
): string[] {
  const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario] as const));
  const deckScenarios = deck.cardIds
    .map((cardId) => scenarioById.get(cardId))
    .filter((scenario): scenario is DateScenario => scenario !== undefined);
  const warnings: string[] = [];
  const hasLowPressure = deckScenarios.some((scenario) =>
    scenario.card.tags.includes("low_pressure"),
  );
  const hasHighPressure = deckScenarios.some((scenario) =>
    scenario.card.tags.includes("high_pressure"),
  );

  if (!hasLowPressure) {
    warnings.push(
      "No low-pressure room cards in the Date Book. Procurement may flag burnout next shift.",
    );
  }

  if (!hasHighPressure) {
    warnings.push("No high-pressure room cards in the Date Book. The board may feel quiet.");
  }

  const lowRisk = deckScenarios.filter((scenario) => scenario.card.risk === "low").length;
  const highRisk = deckScenarios.filter((scenario) => scenario.card.risk === "high").length;

  if (lowRisk === 0) {
    warnings.push("No low risk rooms available. Cooler dates are off the table.");
  }

  if (highRisk === 0) {
    warnings.push("No high risk rooms available. Big swings are off the table.");
  }

  return warnings;
}

/**
 * Build the circulating draw pile for a save: every catalog scenario not in the
 * active deck, in a deterministic per-save shuffle. The pile is the only gate on
 * card acquisition — no numeric unlock tiering. `deck ∪ pile` is the full
 * catalog, disjoint. `seedKey` should be stable per save (we use `createdAt`).
 */
export function seedDrawPile(
  allScenarios: readonly DateScenario[],
  deckCardIds: readonly string[],
  seedKey: string,
): string[] {
  const inDeck = new Set(deckCardIds);
  const remaining = allScenarios.map((scenario) => scenario.id).filter((id) => !inDeck.has(id));
  shuffleInPlace(remaining, createNamespacedRandom("draw-pile", [seedKey]));
  return remaining;
}

export type DrawCardOfferInput = {
  count: number;
  kind: CardOfferKind;
  takeLimit: number;
  canShuffle: boolean;
};

type OfferMeta = {
  kind: CardOfferKind;
  takeLimit: number;
  canShuffle: boolean;
};

/**
 * Deal up to `count` cards off the front of `pool` into a pending offer,
 * returning the leftover pile and the offer (null when nothing is dealt). This
 * is the only place that lifts pile cards into a `pendingCardOffer`; both
 * drawCardOffer and shuffleCardOffer assemble a pool and delegate here.
 */
function dealOffer(
  pool: readonly string[],
  count: number,
  meta: OfferMeta,
): { drawPile: string[]; pendingCardOffer: PendingCardOffer | null } {
  const drawCount = Math.min(count, pool.length);
  if (drawCount <= 0) {
    return { drawPile: [...pool], pendingCardOffer: null };
  }
  return {
    drawPile: pool.slice(drawCount),
    pendingCardOffer: pendingCardOfferSchema.parse({
      cardIds: pool.slice(0, drawCount),
      kind: meta.kind,
      takeLimit: Math.min(meta.takeLimit, drawCount),
      canShuffle: meta.canShuffle,
    }),
  };
}

/**
 * Lift up to `count` cards off the top of the draw pile into a pending offer.
 * Any unresolved prior offer is first returned to the pile bottom (treated as
 * declined) so cards never leak out of the `deck ∪ pile ∪ offer` set. An empty
 * pile yields no offer (`pendingCardOffer` stays null).
 */
export function drawCardOffer(save: GameSave, input: DrawCardOfferInput): GameSave {
  const reclaimed =
    save.pendingCardOffer === null
      ? save.drawPile
      : [...save.drawPile, ...save.pendingCardOffer.cardIds];
  return { ...save, ...dealOffer(reclaimed, input.count, input) };
}

/** Draw the standard post-date offer (3 cards, take 1). */
export function attachDateCardOffer(save: GameSave): GameSave {
  return drawCardOffer(save, {
    count: DATE_OFFER_COUNT,
    kind: "date",
    takeLimit: DATE_OFFER_TAKE,
    canShuffle: false,
  });
}

/** Draw the larger closure offer (5 cards, take 2) with a one-time reshuffle. */
export function attachClosureCardOffer(save: GameSave): GameSave {
  return drawCardOffer(save, {
    count: CLOSURE_OFFER_COUNT,
    kind: "closure",
    takeLimit: CLOSURE_OFFER_TAKE,
    canShuffle: true,
  });
}

export type ResolveCardOfferInput = {
  takenIds: readonly string[];
  droppedIds: readonly string[];
};

/**
 * The verdict for resolving the pending offer with a given take/drop selection.
 * Single source of truth shared by `resolveCardOffer` (which throws `message`
 * when `!legal`) and the card-offer overlay (which reads the flags to drive the
 * confirm button and the drop-step affordances). `legal` means `resolveCardOffer`
 * would commit without throwing — note an empty take is legal (it declines the
 * whole offer), so the overlay gates its confirm button on a non-empty take.
 */
export type OfferResolutionPlan = {
  dropped: string[];
  declined: string[];
  nextCardIds: string[];
  finalSize: number;
  finalSpend: number;
  overSlotCap: boolean;
  underSlotMin: boolean;
  overBudget: boolean;
  legal: boolean;
  message: string | null;
};

/**
 * Compute the take/drop resolution verdict without mutating the save: the
 * resulting deck ids, its size/spend, and the first failing guard (if any).
 * `scenarioDeckSchema` does not enforce deck size, so this is the authoritative
 * size/budget check for the offer path.
 */
export function planCardOfferResolution(
  save: GameSave,
  scenarios: readonly DateScenario[],
  input: ResolveCardOfferInput,
): OfferResolutionPlan {
  const offer = save.pendingCardOffer;
  const deckCardIds = save.scenarioDeck.cardIds;
  const effectiveCosts = computeEffectiveCosts(scenarios, activeBudgetDiscountOffers(save));
  const taken = [...new Set(input.takenIds)];
  const dropped = [...new Set(input.droppedIds)];
  const droppedSet = new Set(dropped);
  const nextCardIds = [...deckCardIds.filter((id) => !droppedSet.has(id)), ...taken];
  const finalSize = nextCardIds.length;
  const finalSpend = currentDeckSpend(nextCardIds, effectiveCosts);
  const overSlotCap = finalSize > DECK_SIZE_MAX;
  const underSlotMin = finalSize < DECK_SIZE_MIN;
  const overBudget = finalSpend > save.budgetCap;

  const base = {
    dropped,
    nextCardIds,
    finalSize,
    finalSpend,
    overSlotCap,
    underSlotMin,
    overBudget,
  };

  if (offer === null) {
    return {
      ...base,
      declined: [],
      legal: false,
      message: "There is no pending room-card offer to resolve.",
    };
  }

  const offerIds = new Set(offer.cardIds);
  const deckIds = new Set(deckCardIds);
  const takenSet = new Set(taken);
  const declined = offer.cardIds.filter((id) => !takenSet.has(id));

  let message: string | null = null;
  const fail = (nextMessage: string): void => {
    if (message === null) {
      message = nextMessage;
    }
  };

  for (const id of taken) {
    if (!offerIds.has(id)) {
      fail(`Room card ${id} is not part of the current offer.`);
    } else if (deckIds.has(id)) {
      fail(`Room card ${id} is already in the Date Book.`);
    }
  }
  if (taken.length > offer.takeLimit) {
    fail(`This offer allows taking at most ${offer.takeLimit} room cards.`);
  }
  for (const id of dropped) {
    if (!deckIds.has(id)) {
      fail(`Room card ${id} is not in the Date Book.`);
    }
  }
  if (overSlotCap || underSlotMin) {
    fail(
      `Resolving the offer leaves ${finalSize} room cards. Date Book must hold ${DECK_SIZE_MIN}-${DECK_SIZE_MAX}.`,
    );
  }
  if (overBudget) {
    fail(
      `Resolving the offer spends ${finalSpend} against a ${save.budgetCap} cap. Drop more room cards first.`,
    );
  }

  return { ...base, declined, legal: message === null, message };
}

/**
 * Resolve the pending offer: move `takenIds` into the deck, drop `droppedIds`
 * from the deck, and return both the dropped cards and the declined offer cards
 * to the pile bottom (dropped first, then declined). Delegates the size/budget/
 * membership verdict to `planCardOfferResolution` and commits only when legal.
 */
export function resolveCardOffer(
  save: GameSave,
  scenarios: readonly DateScenario[],
  input: ResolveCardOfferInput,
): GameSave {
  const plan = planCardOfferResolution(save, scenarios, input);
  if (!plan.legal) {
    throw new Error(plan.message ?? "The card offer cannot be resolved.");
  }

  return {
    ...save,
    scenarioDeck: scenarioDeckSchema.parse({ cardIds: plan.nextCardIds }),
    drawPile: [...save.drawPile, ...plan.dropped, ...plan.declined],
    pendingCardOffer: null,
  };
}

/**
 * Re-roll the current offer: return its cards to the pile, reshuffle the whole
 * pile with a fresh seed, and redraw the same count/kind. Consumes the one-time
 * shuffle (`canShuffle` becomes false). Used by closure offers.
 */
export function shuffleCardOffer(save: GameSave, seedKey: string): GameSave {
  const offer = save.pendingCardOffer;
  if (offer === null) {
    throw new Error("There is no pending room-card offer to shuffle.");
  }
  if (!offer.canShuffle) {
    throw new Error("This offer has already been reshuffled.");
  }

  const pool = [...save.drawPile, ...offer.cardIds];
  shuffleInPlace(pool, createNamespacedRandom("draw-pile-shuffle", [seedKey]));
  return {
    ...save,
    ...dealOffer(pool, offer.cardIds.length, {
      kind: offer.kind,
      takeLimit: offer.takeLimit,
      canShuffle: false,
    }),
  };
}

/**
 * Reconcile the deck / pile / offer triple so it partitions the full catalog:
 * drop unknown ids, dedupe, ensure disjointness (a deck card never also sits in
 * the pile/offer), and append any catalog scenario missing from all three to the
 * pile bottom. Returns the same references when nothing changed so callers can
 * cheaply detect drift.
 */
export function reconcileDrawState(
  save: GameSave,
  allScenarios: readonly DateScenario[],
): { scenarioDeck: ScenarioDeck; drawPile: string[]; pendingCardOffer: PendingCardOffer | null } {
  const known = new Set(allScenarios.map((scenario) => scenario.id));
  const claimed = new Set<string>();

  const reconcile = (ids: readonly string[]): string[] => {
    const next: string[] = [];
    for (const id of ids) {
      if (!known.has(id) || claimed.has(id)) continue;
      claimed.add(id);
      next.push(id);
    }
    return next;
  };

  const deckCardIds = reconcile(save.scenarioDeck.cardIds);
  const offerCardIds =
    save.pendingCardOffer === null ? [] : reconcile(save.pendingCardOffer.cardIds);
  const pile = reconcile(save.drawPile);

  for (const scenario of allScenarios) {
    if (!claimed.has(scenario.id)) {
      claimed.add(scenario.id);
      pile.push(scenario.id);
    }
  }

  const deckChanged = !arraysShallowEqual(deckCardIds, save.scenarioDeck.cardIds);
  const pileChanged = !arraysShallowEqual(pile, save.drawPile);

  let nextOffer = save.pendingCardOffer;
  if (save.pendingCardOffer !== null) {
    const offerChanged = !arraysShallowEqual(offerCardIds, save.pendingCardOffer.cardIds);
    if (offerCardIds.length === 0) {
      nextOffer = null;
    } else if (offerChanged) {
      nextOffer = pendingCardOfferSchema.parse({
        ...save.pendingCardOffer,
        cardIds: offerCardIds,
        takeLimit: Math.min(save.pendingCardOffer.takeLimit, offerCardIds.length),
      });
    }
  }

  return {
    scenarioDeck: deckChanged
      ? scenarioDeckSchema.parse({ cardIds: deckCardIds })
      : save.scenarioDeck,
    drawPile: pileChanged ? pile : save.drawPile,
    pendingCardOffer: nextOffer,
  };
}
