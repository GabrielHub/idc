import {
  SCENARIO_DECK_RETIREMENT_SHIFTS,
  SCENARIO_DECK_SIZE,
  scenarioDeckSchema,
  type DateScenario,
  type GameSave,
  type RetiredScenarioCard,
  type ScenarioDeck,
} from "../domain/game";
import { hashSeedUint32, mulberry32 } from "./utils";

export const STARTER_DECK_CARD_IDS: readonly string[] = [
  "dmv-number-ticket",
  "dinosaur-bbq-all-you-can-eat",
  "listening-booth-after-close",
  "grocery-run-one-dinner",
  "memory-course-dinner",
  "midnight-notary-two-clean-promises",
  "temporal-coffee-shop",
  "impossible-lost-and-found",
  "pilgrimage-mercy-spine",
  "cousins-wedding-plus-one",
  "vivarium-wing-tiny-residents",
  "prophecy-karaoke",
];

export const SCENARIO_HAND_SIZE = 3;

export type LibraryCardEntry = {
  scenarioId: string;
  availableOnShift: number | null;
};

export function createInitialScenarioDeck(scenarios: readonly DateScenario[]): ScenarioDeck {
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
  const cardIds = STARTER_DECK_CARD_IDS.filter((cardId) => scenarioIds.has(cardId));

  if (cardIds.length !== SCENARIO_DECK_SIZE) {
    throw new Error(
      `Starter deck expected ${SCENARIO_DECK_SIZE} scenarios, got ${cardIds.length}. Check STARTER_DECK_CARD_IDS against scenarios fixture.`,
    );
  }

  return scenarioDeckSchema.parse({
    cardIds: [...cardIds],
    retiredCards: [],
  });
}

export function drawHand(deck: ScenarioDeck, shiftNumber: number, random?: () => number): string[] {
  const sourceRandom = random ?? mulberry32(hashSeedUint32(`scenario-hand:${shiftNumber}`));
  const availableIds = [...deck.cardIds];

  if (availableIds.length === 0) {
    return [];
  }

  const handSize = Math.min(SCENARIO_HAND_SIZE, availableIds.length);
  const drawn: string[] = [];

  for (let index = 0; index < handSize; index += 1) {
    const pickIndex = Math.floor(sourceRandom() * availableIds.length);
    const picked = availableIds.splice(pickIndex, 1)[0];

    if (picked !== undefined) {
      drawn.push(picked);
    }
  }

  return drawn;
}

/**
 * Number of full shifts a just-played card stays out of the library before it
 * can be re-added. A card played on shift N becomes available again on shift
 * N + this constant.
 */
export const SCENARIO_PLAYED_COOLDOWN_SHIFTS = 1;

export function markCardPlayed(save: GameSave, cardId: string, currentShift: number): GameSave {
  if (save.scenarioDeck.pendingLibraryPick !== undefined) {
    throw new Error("Cupid already filed a pending library pick. Resolve it before playing again.");
  }

  if (!save.scenarioDeck.cardIds.includes(cardId)) {
    throw new Error(`Card ${cardId} is not in the active deck.`);
  }

  const playedCardCooldown = currentShift + SCENARIO_PLAYED_COOLDOWN_SHIFTS;
  const retiredWithoutPlayed = save.scenarioDeck.retiredCards.filter(
    (entry) => entry.cardId !== cardId,
  );
  const retiredCards: RetiredScenarioCard[] = [
    ...retiredWithoutPlayed,
    { cardId, availableOnShift: playedCardCooldown },
  ];

  const updatedDeck = scenarioDeckSchema.parse({
    cardIds: save.scenarioDeck.cardIds.filter((id) => id !== cardId),
    pendingLibraryPick: {
      playedCardId: cardId,
      playedAtShift: currentShift,
    },
    retiredCards,
  });

  return { ...save, scenarioDeck: updatedDeck };
}

export function pickLibraryCard(save: GameSave, libraryCardId: string): GameSave {
  if (save.scenarioDeck.pendingLibraryPick === undefined) {
    throw new Error("Cupid has no pending library pick to resolve.");
  }

  if (save.scenarioDeck.cardIds.includes(libraryCardId)) {
    throw new Error("That scenario is already in the active deck.");
  }

  const retiredEntry = save.scenarioDeck.retiredCards.find(
    (entry) => entry.cardId === libraryCardId,
  );

  const currentShift = save.scenarioDeck.pendingLibraryPick.playedAtShift;

  if (retiredEntry !== undefined && retiredEntry.availableOnShift > currentShift) {
    throw new Error(
      `That scenario is retired until shift ${retiredEntry.availableOnShift}. Pick another.`,
    );
  }

  const updatedDeck = scenarioDeckSchema.parse({
    cardIds: [...save.scenarioDeck.cardIds, libraryCardId],
    pendingLibraryPick: undefined,
    retiredCards: save.scenarioDeck.retiredCards.filter((entry) => entry.cardId !== libraryCardId),
  });

  return { ...save, scenarioDeck: updatedDeck };
}

export function swapCard(
  save: GameSave,
  deckCardId: string,
  libraryCardId: string,
  currentShift: number,
): GameSave {
  if (save.scenarioDeck.pendingLibraryPick !== undefined) {
    throw new Error("Resolve the pending library pick before swapping.");
  }

  if (!save.scenarioDeck.cardIds.includes(deckCardId)) {
    throw new Error(`Card ${deckCardId} is not in the active deck.`);
  }

  if (save.scenarioDeck.cardIds.includes(libraryCardId)) {
    throw new Error("That scenario is already in the active deck.");
  }

  if (deckCardId === libraryCardId) {
    throw new Error("Pick a different scenario to swap in.");
  }

  const retiredEntry = save.scenarioDeck.retiredCards.find(
    (entry) => entry.cardId === libraryCardId,
  );

  if (retiredEntry !== undefined && retiredEntry.availableOnShift > currentShift) {
    throw new Error(
      `That scenario is retired until shift ${retiredEntry.availableOnShift}. Pick another.`,
    );
  }

  const nextRetired: RetiredScenarioCard[] = [
    ...save.scenarioDeck.retiredCards.filter((entry) => entry.cardId !== libraryCardId),
    { cardId: deckCardId, availableOnShift: currentShift + SCENARIO_DECK_RETIREMENT_SHIFTS + 1 },
  ];

  const updatedDeck = scenarioDeckSchema.parse({
    cardIds: save.scenarioDeck.cardIds.map((id) => (id === deckCardId ? libraryCardId : id)),
    pendingLibraryPick: undefined,
    retiredCards: nextRetired,
  });
  const updatedShifts = save.shifts.map((shift) =>
    shift.id === save.activeShiftId && shift.shiftNumber === currentShift
      ? {
          ...shift,
          drawnScenarioIds: shift.drawnScenarioIds.map((id) =>
            id === deckCardId ? libraryCardId : id,
          ),
        }
      : shift,
  );

  return { ...save, scenarioDeck: updatedDeck, shifts: updatedShifts };
}

export function listLibraryCards(
  save: GameSave,
  scenarios: readonly DateScenario[],
): LibraryCardEntry[] {
  const inDeck = new Set(save.scenarioDeck.cardIds);
  const retiredById = new Map(
    save.scenarioDeck.retiredCards.map((entry) => [entry.cardId, entry.availableOnShift] as const),
  );

  return scenarios
    .filter((scenario) => !inDeck.has(scenario.id))
    .map((scenario) => ({
      scenarioId: scenario.id,
      availableOnShift: retiredById.get(scenario.id) ?? null,
    }));
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

export function getActiveRetirements(
  deck: ScenarioDeck,
  currentShift: number,
): RetiredScenarioCard[] {
  return deck.retiredCards.filter((entry) => entry.availableOnShift > currentShift);
}

export function pruneExpiredRetirements(deck: ScenarioDeck, currentShift: number): ScenarioDeck {
  const activeRetired = getActiveRetirements(deck, currentShift);

  if (activeRetired.length === deck.retiredCards.length) {
    return deck;
  }

  return scenarioDeckSchema.parse({
    ...deck,
    retiredCards: activeRetired,
  });
}
