import { describe, expect, it } from "vitest";

import { SCENARIO_DECK_RETIREMENT_SHIFTS, SCENARIO_DECK_SIZE } from "../domain/game";
import { starterScenarios } from "../fixtures";
import { createSeedGameSave } from "./game-seed";
import {
  createInitialScenarioDeck,
  drawHand,
  listLibraryCards,
  markCardPlayed,
  pickLibraryCard,
  SCENARIO_HAND_SIZE,
  STARTER_DECK_CARD_IDS,
  softComposeWarnings,
  swapCard,
} from "./deck";

describe("deck service", () => {
  it("initial deck has 12 unique cards from starter list", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    expect(deck.cardIds).toHaveLength(SCENARIO_DECK_SIZE);
    expect(new Set(deck.cardIds).size).toBe(SCENARIO_DECK_SIZE);
    expect(deck.cardIds).toEqual([...STARTER_DECK_CARD_IDS]);
    expect(deck.pendingLibraryPick).toBeUndefined();
    expect(deck.retiredCards).toEqual([]);
  });

  it("starter deck satisfies risk count of 4 low, 5 medium, 3 high", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    const scenarioById = new Map(starterScenarios.map((scenario) => [scenario.id, scenario]));
    const risks = deck.cardIds.map((cardId) => scenarioById.get(cardId)?.card.risk);
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0 };

    for (const risk of risks) {
      if (risk !== undefined) {
        counts[risk] += 1;
      }
    }

    expect(counts.low).toBe(4);
    expect(counts.medium).toBe(5);
    expect(counts.high).toBe(3);
  });

  it("drawHand returns hand size cards from the deck", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    const hand = drawHand(deck, 1);
    expect(hand).toHaveLength(SCENARIO_HAND_SIZE);
    const uniqueCards = new Set(hand);
    expect(uniqueCards.size).toBe(hand.length);

    for (const cardId of hand) {
      expect(deck.cardIds).toContain(cardId);
    }
  });

  it("drawHand is deterministic for the same shift seed", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    const first = drawHand(deck, 7);
    const second = drawHand(deck, 7);
    expect(first).toEqual(second);
  });

  it("markCardPlayed creates an 11-card deck with pending pick", () => {
    const save = createSeedGameSave();
    const playedId = save.scenarioDeck.cardIds[0];
    if (playedId === undefined) {
      throw new Error("Starter deck unexpectedly empty.");
    }

    const nextSave = markCardPlayed(save, playedId, 1);
    expect(nextSave.scenarioDeck.cardIds).toHaveLength(SCENARIO_DECK_SIZE - 1);
    expect(nextSave.scenarioDeck.cardIds).not.toContain(playedId);
    expect(nextSave.scenarioDeck.pendingLibraryPick).toEqual({
      playedCardId: playedId,
      playedAtShift: 1,
    });
  });

  it("markCardPlayed rejects when a pick is already pending", () => {
    const save = createSeedGameSave();
    const first = save.scenarioDeck.cardIds[0];
    const second = save.scenarioDeck.cardIds[1];
    if (first === undefined || second === undefined) {
      throw new Error("Starter deck unexpectedly small.");
    }
    const nextSave = markCardPlayed(save, first, 1);
    expect(() => markCardPlayed(nextSave, second, 1)).toThrow();
  });

  it("pickLibraryCard restores deck to 12 cards when pending", () => {
    const save = createSeedGameSave();
    const played = save.scenarioDeck.cardIds[0];
    if (played === undefined) {
      throw new Error("Starter deck unexpectedly empty.");
    }
    const afterPlay = markCardPlayed(save, played, 1);
    const libraryEntry = listLibraryCards(afterPlay, starterScenarios)[0];
    if (libraryEntry === undefined) {
      throw new Error("Library expected to have at least one card.");
    }
    const afterPick = pickLibraryCard(afterPlay, libraryEntry.scenarioId);
    expect(afterPick.scenarioDeck.cardIds).toHaveLength(SCENARIO_DECK_SIZE);
    expect(afterPick.scenarioDeck.cardIds).toContain(libraryEntry.scenarioId);
    expect(afterPick.scenarioDeck.pendingLibraryPick).toBeUndefined();
  });

  it("pickLibraryCard fails when nothing is pending", () => {
    const save = createSeedGameSave();
    const libraryEntry = listLibraryCards(save, starterScenarios)[0];
    if (libraryEntry === undefined) {
      throw new Error("Library expected to have at least one card.");
    }
    expect(() => pickLibraryCard(save, libraryEntry.scenarioId)).toThrow();
  });

  it("swapCard retires the dropped card for exactly 3 future shifts", () => {
    const save = createSeedGameSave();
    const droppedId = save.scenarioDeck.cardIds[0];
    if (droppedId === undefined) {
      throw new Error("Starter deck unexpectedly empty.");
    }
    const library = listLibraryCards(save, starterScenarios);
    const libraryEntry = library[0];
    if (libraryEntry === undefined) {
      throw new Error("Library expected to have at least one card.");
    }
    const currentShift = 4;
    const swapped = swapCard(save, droppedId, libraryEntry.scenarioId, currentShift);

    expect(swapped.scenarioDeck.cardIds).toHaveLength(SCENARIO_DECK_SIZE);
    expect(swapped.scenarioDeck.cardIds).not.toContain(droppedId);
    expect(swapped.scenarioDeck.cardIds).toContain(libraryEntry.scenarioId);

    const retired = swapped.scenarioDeck.retiredCards.find((entry) => entry.cardId === droppedId);
    expect(retired).toBeDefined();
    expect(retired?.availableOnShift).toBe(currentShift + SCENARIO_DECK_RETIREMENT_SHIFTS + 1);
  });

  it("swapCard replaces dropped drawn cards in the active hand", () => {
    const save = createSeedGameSave();
    const activeShift = save.shifts.find((shift) => shift.id === save.activeShiftId);
    const droppedId = activeShift?.drawnScenarioIds[0];
    const libraryEntry = listLibraryCards(save, starterScenarios)[0];

    if (activeShift === undefined || droppedId === undefined || libraryEntry === undefined) {
      throw new Error("Expected a drawn card and an available library card.");
    }

    const swapped = swapCard(save, droppedId, libraryEntry.scenarioId, activeShift.shiftNumber);
    const updatedShift = swapped.shifts.find((shift) => shift.id === swapped.activeShiftId);

    expect(updatedShift?.drawnScenarioIds).toContain(libraryEntry.scenarioId);
    expect(updatedShift?.drawnScenarioIds).not.toContain(droppedId);
  });

  it("listLibraryCards excludes deck cards and flags retired availability", () => {
    const save = createSeedGameSave();
    const droppedId = save.scenarioDeck.cardIds[0];
    if (droppedId === undefined) {
      throw new Error("Starter deck unexpectedly empty.");
    }
    const library = listLibraryCards(save, starterScenarios);
    const incoming = library.find((entry) => entry.availableOnShift === null);
    if (incoming === undefined) {
      throw new Error("Expected at least one available library card.");
    }
    const swapped = swapCard(save, droppedId, incoming.scenarioId, 2);
    const updatedLibrary = listLibraryCards(swapped, starterScenarios);
    const retired = updatedLibrary.find((entry) => entry.scenarioId === droppedId);
    expect(retired?.availableOnShift).toBe(2 + SCENARIO_DECK_RETIREMENT_SHIFTS + 1);
  });

  it("softComposeWarnings returns advisory strings only", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    const warnings = softComposeWarnings(deck, starterScenarios);
    expect(Array.isArray(warnings)).toBe(true);
  });
});
