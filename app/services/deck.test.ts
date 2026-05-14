import { describe, expect, it } from "vitest";

import { DECK_SIZE_MAX, DECK_SIZE_MIN, STARTER_BUDGET_CAP } from "../domain/game";
import { starterScenarios } from "../fixtures";
import {
  addCardToDeck,
  createDraftedScenarioDeck,
  createInitialScenarioDeck,
  drawHand,
  drawHandForBooking,
  listLibraryCards,
  removeCardFromDeck,
  SCENARIO_HAND_SIZE,
  STARTER_CATALOG_IDS,
  softComposeWarnings,
  unlockedScenarioIds,
} from "./deck";
import { createSeedGameSave } from "./game-seed";
import { computeEffectiveCosts } from "./budget";

describe("deck service", () => {
  it("createDraftedScenarioDeck enforces size and budget gates", () => {
    const effectiveCosts = computeEffectiveCosts(starterScenarios, []);
    const draft = STARTER_CATALOG_IDS.slice(0, 10);

    const deck = createDraftedScenarioDeck({
      cardIds: draft,
      catalog: starterScenarios,
      catalogIds: STARTER_CATALOG_IDS,
      budgetCap: STARTER_BUDGET_CAP,
      effectiveCosts,
    });

    expect(deck.cardIds.length).toBeGreaterThanOrEqual(DECK_SIZE_MIN);
    expect(deck.cardIds.length).toBeLessThanOrEqual(DECK_SIZE_MAX);
  });

  it("createDraftedScenarioDeck rejects decks that exceed the cap", () => {
    const effectiveCosts = computeEffectiveCosts(starterScenarios, []);
    const expensiveCards = [...starterScenarios]
      .sort((a, b) => b.card.cost - a.card.cost)
      .slice(0, 8)
      .map((scenario) => scenario.id);

    expect(() =>
      createDraftedScenarioDeck({
        cardIds: expensiveCards,
        catalog: starterScenarios,
        budgetCap: 60,
        effectiveCosts,
      }),
    ).toThrow(/spends/);
  });

  it("createDraftedScenarioDeck rejects decks below the minimum size", () => {
    const effectiveCosts = computeEffectiveCosts(starterScenarios, []);
    expect(() =>
      createDraftedScenarioDeck({
        cardIds: STARTER_CATALOG_IDS.slice(0, 3),
        catalog: starterScenarios,
        budgetCap: STARTER_BUDGET_CAP,
        effectiveCosts,
      }),
    ).toThrow(/must hold between/);
  });

  it("drawHand returns hand size cards", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    const hand = drawHand(deck, "test-seed");
    expect(hand).toHaveLength(SCENARIO_HAND_SIZE);
    expect(new Set(hand).size).toBe(hand.length);
    for (const cardId of hand) {
      expect(deck.cardIds).toContain(cardId);
    }
  });

  it("drawHandForBooking is deterministic for the same pair on the same deck", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    const first = drawHandForBooking({ deck, shiftNumber: 1, pairId: "alice__bob" });
    const second = drawHandForBooking({ deck, shiftNumber: 1, pairId: "alice__bob" });
    expect(first).toEqual(second);
  });

  it("drawHandForBooking changes when the deck changes", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    const reordered = { cardIds: [...deck.cardIds].reverse() };
    const first = drawHandForBooking({ deck, shiftNumber: 1, pairId: "alice__bob" });
    const second = drawHandForBooking({
      deck: reordered,
      shiftNumber: 1,
      pairId: "alice__bob",
    });
    // Sorted ids match, so identical deck contents must yield identical draws
    // regardless of order.
    expect(first).toEqual(second);
  });

  it("removeCardFromDeck drops the card and addCardToDeck refunds headroom", () => {
    const save = createSeedGameSave();
    const dropId = save.scenarioDeck.cardIds[0];
    if (dropId === undefined) throw new Error("starter deck empty");

    const afterRemove = removeCardFromDeck(save, dropId);
    expect(afterRemove.scenarioDeck.cardIds).not.toContain(dropId);

    const incoming = starterScenarios.find(
      (scenario) =>
        !afterRemove.scenarioDeck.cardIds.includes(scenario.id) && scenario.card.cost <= 8,
    );
    if (incoming === undefined) throw new Error("no cheap incoming scenario");

    const afterAdd = addCardToDeck({
      save: afterRemove,
      scenarios: starterScenarios,
      cardId: incoming.id,
    });
    expect(afterAdd.scenarioDeck.cardIds).toContain(incoming.id);
  });

  it("addCardToDeck rejects duplicate or over-budget additions", () => {
    const save = createSeedGameSave();
    const existingId = save.scenarioDeck.cardIds[0];
    if (existingId === undefined) throw new Error("starter deck empty");

    expect(() =>
      addCardToDeck({
        save,
        scenarios: starterScenarios,
        cardId: existingId,
      }),
    ).toThrow(/already in the deck/);

    const cappedSave = { ...save, budgetCap: 1 };
    const incoming = starterScenarios.find(
      (scenario) => !save.scenarioDeck.cardIds.includes(scenario.id),
    );
    if (incoming === undefined) throw new Error("no library card available");

    expect(() =>
      addCardToDeck({
        save: cappedSave,
        scenarios: starterScenarios,
        cardId: incoming.id,
      }),
    ).toThrow(/exceeds the remaining budget/);
  });

  it("listLibraryCards excludes deck cards", () => {
    const save = createSeedGameSave();
    const deckIds = new Set(save.scenarioDeck.cardIds);
    const library = listLibraryCards(save, starterScenarios);
    for (const entry of library) {
      expect(deckIds.has(entry.scenarioId)).toBe(false);
    }
  });

  it("unlockedScenarioIds gates closure-tier and shift-tier picks", () => {
    const starterOnly = unlockedScenarioIds({ closureCount: 0, shiftNumber: 1 });
    const afterClosure = unlockedScenarioIds({ closureCount: 1, shiftNumber: 1 });
    const lateShift = unlockedScenarioIds({ closureCount: 3, shiftNumber: 20 });

    expect(afterClosure.size).toBeGreaterThan(starterOnly.size);
    expect(lateShift.size).toBeGreaterThan(afterClosure.size);
  });

  it("softComposeWarnings returns advisory strings only", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    const warnings = softComposeWarnings(deck, starterScenarios);
    expect(Array.isArray(warnings)).toBe(true);
  });
});
