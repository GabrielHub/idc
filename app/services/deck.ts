import {
  DECK_SIZE_MAX,
  DECK_SIZE_MIN,
  scenarioDeckSchema,
  type ActiveDateBooking,
  type DateScenario,
  type GameSave,
  type ScenarioDeck,
} from "../domain/game";
import {
  computeEffectiveCosts,
  currentDeckSpend,
  deriveDeckBudgetStatus,
  activeBudgetDiscountOffers,
} from "./budget";
import { createNamespacedRandom, randomIndex } from "./utils";

export const SCENARIO_HAND_SIZE = 3;

/**
 * Starter-eligible scenario ids. Picks the gentler, more legible scenarios so a
 * first-time player is not dumped into the chaos- and intimacy-heavy stuff on
 * shift one. The rest unlock through closures and shift thresholds. See
 * unlockedScenarioIds() for runtime gating.
 */
export const STARTER_CATALOG_IDS: readonly string[] = [
  "dmv-number-ticket",
  "grocery-run-one-dinner",
  "park-loop-with-a-dog",
  "couch-night-takeout",
  "diner-eleven-pm",
  "mall-food-court-weeknight",
  "open-house-sunday",
  "chain-restaurant-tuesday",
  "hardware-store-one-project",
  "bowling-league-night",
  "pottery-studio-drop-in",
  "executive-lunch-one-agenda-item",
  "listening-booth-after-close",
  "hotel-bar-last-call",
  "midnight-notary-two-clean-promises",
  "build-a-bear-empty-mall",
  "moonglass-kiln-after-hours",
  "drive-in-last-reel",
  "long-afternoon-pool-bar",
  "concession-stand-heat-death",
  "hawker-floor-six-branches",
  "county-fair-friday",
  "cable-car-across-biomes",
  "empty-room-many-windows",
  "hedge-witch-tea-hour",
  "vivarium-wing-tiny-residents",
  "temporal-coffee-shop",
  "moon-picnic",
];

/**
 * Deterministic fallback used when no player-drafted deck exists yet (pre-onboarding
 * test fixtures, dev seeds). This is NOT the player-facing starter deck; the player
 * builds that during onboarding from STARTER_CATALOG_IDS.
 */
export const PRE_ONBOARDING_FALLBACK_DECK_IDS: readonly string[] = STARTER_CATALOG_IDS.slice(0, 10);

export function createInitialScenarioDeck(scenarios: readonly DateScenario[]): ScenarioDeck {
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
  const cardIds = PRE_ONBOARDING_FALLBACK_DECK_IDS.filter((cardId) => scenarioIds.has(cardId));

  return scenarioDeckSchema.parse({
    cardIds: [...cardIds],
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
      throw new Error(`Drafted deck duplicates ${cardId}.`);
    }
    if (!catalogById.has(cardId)) {
      throw new Error(`Drafted deck includes unknown scenario ${cardId}.`);
    }
    if (catalogAllowed !== null && !catalogAllowed.has(cardId)) {
      throw new Error(`Scenario ${cardId} is not in the starter catalog.`);
    }
    seen.add(cardId);
    uniqueIds.push(cardId);
  }

  if (uniqueIds.length < DECK_SIZE_MIN || uniqueIds.length > DECK_SIZE_MAX) {
    throw new Error(
      `Drafted deck must hold between ${DECK_SIZE_MIN} and ${DECK_SIZE_MAX} cards. Got ${uniqueIds.length}.`,
    );
  }

  const spend = currentDeckSpend(uniqueIds, input.effectiveCosts);
  if (spend > input.budgetCap) {
    throw new Error(
      `Drafted deck spends ${spend} against a ${input.budgetCap} cap. Drop cards before confirming.`,
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

export type DeckEditResult = { save: GameSave };

export function addCardToDeck({
  save,
  scenarios,
  cardId,
}: {
  save: GameSave;
  scenarios: readonly DateScenario[];
  cardId: string;
}): GameSave {
  if (save.scenarioDeck.cardIds.includes(cardId)) {
    throw new Error("That scenario is already in the deck.");
  }
  if (save.scenarioDeck.cardIds.length >= DECK_SIZE_MAX) {
    throw new Error(`The deck is at ${DECK_SIZE_MAX} cards. Drop one before adding.`);
  }

  const scenarioExists = scenarios.some((scenario) => scenario.id === cardId);
  if (!scenarioExists) {
    throw new Error(`Scenario ${cardId} is not in the catalog.`);
  }

  const offers = activeBudgetDiscountOffers(save);
  const effectiveCosts = computeEffectiveCosts(scenarios, offers);
  const remaining = save.budgetCap - currentDeckSpend(save.scenarioDeck.cardIds, effectiveCosts);
  const cost = effectiveCosts[cardId] ?? 0;

  if (cost > remaining) {
    throw new Error("That scenario exceeds the remaining budget. Drop a card first.");
  }

  return {
    ...save,
    scenarioDeck: scenarioDeckSchema.parse({
      cardIds: [...save.scenarioDeck.cardIds, cardId],
    }),
  };
}

export function removeCardFromDeck(save: GameSave, cardId: string): GameSave {
  if (!save.scenarioDeck.cardIds.includes(cardId)) {
    throw new Error(`Card ${cardId} is not in the active deck.`);
  }

  return {
    ...save,
    scenarioDeck: scenarioDeckSchema.parse({
      cardIds: save.scenarioDeck.cardIds.filter((id) => id !== cardId),
    }),
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

export type LibraryCardEntry = {
  scenarioId: string;
};

export function listLibraryCards(
  save: GameSave,
  scenarios: readonly DateScenario[],
): LibraryCardEntry[] {
  const inDeck = new Set(save.scenarioDeck.cardIds);
  return scenarios
    .filter((scenario) => !inDeck.has(scenario.id))
    .map((scenario) => ({ scenarioId: scenario.id }));
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
    warnings.push("No low pressure cards in the deck. Procurement may flag burnout next shift.");
  }

  if (!hasHighPressure) {
    warnings.push("No high pressure cards in the deck. The board may feel quiet.");
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

export type UnlockTier =
  | "starter"
  | "closure_one"
  | "closure_two"
  | "closure_three"
  | "shift_10"
  | "shift_20";

export type CatalogUnlock = {
  scenarioId: string;
  tier: UnlockTier;
};

const CATALOG_UNLOCK_TIERS: Record<UnlockTier, readonly string[]> = (() => {
  // Starter pool is STARTER_CATALOG_IDS (above). Allocate the remainder to
  // closure and shift gates.
  const closureOne: string[] = [
    "memory-course-dinner",
    "soft-launch-photo-wall",
    "cousins-wedding-plus-one",
    "phantom-doorbell-suite",
    "underworld-department-mixer",
  ];
  const closureTwo: string[] = [
    "museum-exhibit-mixup",
    "prophecy-karaoke",
    "impossible-lost-and-found",
    "mess-hall-auriga",
    "dinosaur-bbq-all-you-can-eat",
  ];
  const closureThree: string[] = [
    "pilgrimage-mercy-spine",
    "whale-concert-below-world",
    "olympus-bottomless-brunch",
    "world-sim-operator-booth",
    "hephaestus-forge",
  ];
  const shift10: string[] = [
    "cloud-castle-mini-golf",
    "volcano-hot-spring",
    "adventurers-speakeasy",
    "capital-ship-war-dinner",
    "colosseum-box-four",
    "aquarium-of-cryptids",
  ];
  const shift20: string[] = [
    "bank-heist-1920s-escape-room",
    "wet-market-three-seas",
    "beach-where-sea-is-above",
    "picnic-on-sleeping-giant",
    "picnic-on-bifrost",
    "aurora-line-private-compartment",
  ];

  return {
    starter: STARTER_CATALOG_IDS,
    closure_one: closureOne,
    closure_two: closureTwo,
    closure_three: closureThree,
    shift_10: shift10,
    shift_20: shift20,
  };
})();

export function unlockedScenarioIds({
  closureCount,
  shiftNumber,
}: {
  closureCount: number;
  shiftNumber: number;
}): Set<string> {
  const unlocked = new Set<string>(CATALOG_UNLOCK_TIERS.starter);
  if (closureCount >= 1) {
    for (const id of CATALOG_UNLOCK_TIERS.closure_one) unlocked.add(id);
  }
  if (closureCount >= 2) {
    for (const id of CATALOG_UNLOCK_TIERS.closure_two) unlocked.add(id);
  }
  if (closureCount >= 3) {
    for (const id of CATALOG_UNLOCK_TIERS.closure_three) unlocked.add(id);
  }
  if (shiftNumber >= 10) {
    for (const id of CATALOG_UNLOCK_TIERS.shift_10) unlocked.add(id);
  }
  if (shiftNumber >= 20) {
    for (const id of CATALOG_UNLOCK_TIERS.shift_20) unlocked.add(id);
  }
  return unlocked;
}

export function listUnlockedScenarios(
  scenarios: readonly DateScenario[],
  options: { closureCount: number; shiftNumber: number },
): DateScenario[] {
  const unlocked = unlockedScenarioIds(options);
  return scenarios.filter((scenario) => unlocked.has(scenario.id));
}
