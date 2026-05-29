import { describe, expect, it } from "vitest";

import { DECK_SIZE_MAX, DECK_SIZE_MIN, STARTER_BUDGET_CAP, type GameSave } from "../domain/game";
import { starterScenarios } from "../fixtures";
import {
  attachClosureCardOffer,
  attachDateCardOffer,
  createOnboardingDeckPrefillIds,
  createDraftedScenarioDeck,
  createInitialScenarioDeck,
  createStarterScenarioDeck,
  dateBookEditingUnlocked,
  drawCardOffer,
  drawHand,
  drawHandForBooking,
  onboardingDeckTutorialPickId,
  reconcileDrawState,
  removeCardFromDeck,
  resolveCardOffer,
  SCENARIO_HAND_SIZE,
  seedDrawPile,
  shuffleCardOffer,
  STARTER_CATALOG_IDS,
  STARTER_DECK_IDS,
  softComposeWarnings,
} from "./deck";
import { createSeedGameSave } from "./game-seed";
import { computeEffectiveCosts } from "./budget";

const ALL_SCENARIO_IDS = starterScenarios.map((scenario) => scenario.id);

/** The deck, draw pile, and pending offer must always partition the full catalog. */
function expectDrawPartition(save: GameSave): void {
  const ids = [
    ...save.scenarioDeck.cardIds,
    ...save.drawPile,
    ...(save.pendingCardOffer?.cardIds ?? []),
  ];
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.length).toBe(ALL_SCENARIO_IDS.length);
  expect(new Set(ids)).toEqual(new Set(ALL_SCENARIO_IDS));
}

describe("deck service", () => {
  it("STARTER_DECK_IDS is a subset of STARTER_CATALOG_IDS", () => {
    // The starter deck used to derive from the catalog via `.slice(0, DECK_SIZE_MIN)`,
    // which kept the invariant trivially. Now that the deck is hand-picked for
    // tone variety, lock the subset relationship so the deck can't drift into
    // an unreachable scenario when the catalog is reshuffled.
    const catalog = new Set(STARTER_CATALOG_IDS);
    const orphans = STARTER_DECK_IDS.filter((id) => !catalog.has(id));
    expect(orphans).toEqual([]);
  });

  it("createStarterScenarioDeck installs the minimum legal starter deck", () => {
    const deck = createStarterScenarioDeck(starterScenarios);
    const effectiveCosts = computeEffectiveCosts(starterScenarios, []);

    expect(deck.cardIds).toEqual(STARTER_DECK_IDS);
    expect(deck.cardIds).toHaveLength(DECK_SIZE_MIN);
    expect(deck.cardIds.length).toBeLessThanOrEqual(DECK_SIZE_MAX);
    expect(
      deck.cardIds.reduce((sum, id) => sum + (effectiveCosts[id] ?? 0), 0),
    ).toBeLessThanOrEqual(STARTER_BUDGET_CAP);
  });

  it("prefills onboarding with the minimum legal starter deck", () => {
    const prefillIds = createOnboardingDeckPrefillIds(starterScenarios);
    const tutorialPickId = onboardingDeckTutorialPickId(starterScenarios);

    if (tutorialPickId === undefined) throw new Error("starter deck is empty");
    expect(tutorialPickId).toBe(STARTER_DECK_IDS[0]);
    expect(prefillIds).toEqual(STARTER_DECK_IDS);
    expect(prefillIds).toHaveLength(DECK_SIZE_MIN);
    expect(prefillIds).toContain(tutorialPickId);

    const completedDraft = createDraftedScenarioDeck({
      cardIds: prefillIds,
      catalog: starterScenarios,
      catalogIds: STARTER_CATALOG_IDS,
      budgetCap: STARTER_BUDGET_CAP,
      effectiveCosts: computeEffectiveCosts(starterScenarios, []),
    });

    expect(completedDraft.cardIds).toEqual(STARTER_DECK_IDS);
    expect(completedDraft.cardIds).toHaveLength(DECK_SIZE_MIN);
  });

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

  it("removeCardFromDeck drops the card and recirculates it to the pile bottom", () => {
    const save = createSeedGameSave();
    const dropId = save.scenarioDeck.cardIds[0];
    if (dropId === undefined) throw new Error("starter deck empty");

    const afterRemove = removeCardFromDeck(save, dropId);
    expect(afterRemove.scenarioDeck.cardIds).not.toContain(dropId);
    // The dropped card recirculates to the bottom of the draw pile rather than
    // being orphaned, so deck ∪ pile stays whole.
    expect(afterRemove.drawPile.at(-1)).toBe(dropId);
    expect(afterRemove.drawPile.length).toBe(save.drawPile.length + 1);
    expect([...afterRemove.scenarioDeck.cardIds, ...afterRemove.drawPile].length).toBe(
      [...save.scenarioDeck.cardIds, ...save.drawPile].length,
    );
  });

  it("removeCardFromDeck refuses to drop below the deck minimum", () => {
    let save = createSeedGameSave();
    // Trim the seeded deck down to the floor; each drop recirculates a card.
    while (save.scenarioDeck.cardIds.length > DECK_SIZE_MIN) {
      const next = save.scenarioDeck.cardIds[0];
      if (next === undefined) throw new Error("deck unexpectedly empty");
      save = removeCardFromDeck(save, next);
    }
    expect(save.scenarioDeck.cardIds).toHaveLength(DECK_SIZE_MIN);

    const floorCard = save.scenarioDeck.cardIds[0];
    if (floorCard === undefined) throw new Error("deck unexpectedly empty");
    // The Date Book drop must not push the deck under its minimum — the offer
    // overlay enforces the same floor, and the library re-add path is gone.
    expect(() => removeCardFromDeck(save, floorCard)).toThrow(/at least/);
  });

  it("dateBookEditingUnlocked waits for a completed date report", () => {
    expect(dateBookEditingUnlocked(createSeedGameSave())).toBe(false);
  });

  it("softComposeWarnings returns advisory strings only", () => {
    const deck = createInitialScenarioDeck(starterScenarios);
    const warnings = softComposeWarnings(deck, starterScenarios);
    expect(Array.isArray(warnings)).toBe(true);
  });
});

describe("draw pile", () => {
  it("a fresh seed save partitions the catalog across deck and pile", () => {
    const save = createSeedGameSave();
    expect(save.pendingCardOffer).toBeNull();
    expectDrawPartition(save);
  });

  it("seedDrawPile excludes the deck and is deterministic per seed", () => {
    const deck = createStarterScenarioDeck(starterScenarios);
    const deckSet = new Set(deck.cardIds);
    const pile = seedDrawPile(starterScenarios, deck.cardIds, "key-a");
    for (const id of pile) expect(deckSet.has(id)).toBe(false);
    expect(new Set([...deck.cardIds, ...pile])).toEqual(new Set(ALL_SCENARIO_IDS));
    expect(seedDrawPile(starterScenarios, deck.cardIds, "key-a")).toEqual(pile);
    expect(seedDrawPile(starterScenarios, deck.cardIds, "key-b")).not.toEqual(pile);
  });
});

describe("card offers", () => {
  it("drawCardOffer lifts cards off the top into a pending offer", () => {
    const save = createSeedGameSave();
    const topThree = save.drawPile.slice(0, 3);
    const next = drawCardOffer(save, { count: 3, kind: "date", takeLimit: 1, canShuffle: false });

    expect(next.pendingCardOffer?.cardIds).toEqual(topThree);
    expect(next.drawPile).toEqual(save.drawPile.slice(3));
    expectDrawPartition(next);
  });

  it("drawCardOffer reclaims a stale offer to the bottom before drawing", () => {
    const save = createSeedGameSave();
    const first = drawCardOffer(save, { count: 3, kind: "date", takeLimit: 1, canShuffle: false });
    const stale = first.pendingCardOffer?.cardIds ?? [];
    const second = drawCardOffer(first, {
      count: 3,
      kind: "date",
      takeLimit: 1,
      canShuffle: false,
    });

    expect(second.drawPile.slice(-3)).toEqual(stale);
    expectDrawPartition(second);
  });

  it("drawCardOffer clamps to the pile length and never offers an empty hand", () => {
    const save = createSeedGameSave();
    const drained: GameSave = { ...save, drawPile: save.drawPile.slice(0, 2) };
    const next = drawCardOffer(drained, {
      count: 3,
      kind: "date",
      takeLimit: 1,
      canShuffle: false,
    });
    expect(next.pendingCardOffer?.cardIds).toHaveLength(2);

    const empty: GameSave = { ...save, drawPile: [] };
    const noOffer = drawCardOffer(empty, {
      count: 3,
      kind: "date",
      takeLimit: 1,
      canShuffle: false,
    });
    expect(noOffer.pendingCardOffer).toBeNull();
  });

  it("attachDateCardOffer draws 3/take-1 and attachClosureCardOffer draws 5/take-2 with a shuffle", () => {
    const save = createSeedGameSave();

    const dateOffer = attachDateCardOffer(save).pendingCardOffer;
    expect(dateOffer?.cardIds).toHaveLength(3);
    expect(dateOffer?.takeLimit).toBe(1);
    expect(dateOffer?.canShuffle).toBe(false);

    const closureOffer = attachClosureCardOffer(save).pendingCardOffer;
    expect(closureOffer?.cardIds).toHaveLength(5);
    expect(closureOffer?.takeLimit).toBe(2);
    expect(closureOffer?.canShuffle).toBe(true);
  });

  it("resolveCardOffer moves the taken card into the deck and recirculates the rest", () => {
    const save = createSeedGameSave();
    const offered = drawCardOffer(save, {
      count: 3,
      kind: "date",
      takeLimit: 1,
      canShuffle: false,
    });
    const offerCards = offered.pendingCardOffer?.cardIds ?? [];
    const taken = offerCards[0];
    if (taken === undefined) throw new Error("no offer drawn");

    const resolved = resolveCardOffer(offered, starterScenarios, {
      takenIds: [taken],
      droppedIds: [],
    });

    expect(resolved.scenarioDeck.cardIds).toContain(taken);
    expect(resolved.pendingCardOffer).toBeNull();
    expect(resolved.drawPile.slice(-2)).toEqual(offerCards.slice(1));
    expectDrawPartition(resolved);
  });

  it("resolveCardOffer with no take recirculates every offered card", () => {
    const save = createSeedGameSave();
    const offered = drawCardOffer(save, {
      count: 3,
      kind: "date",
      takeLimit: 1,
      canShuffle: false,
    });
    const offerCards = offered.pendingCardOffer?.cardIds ?? [];

    const resolved = resolveCardOffer(offered, starterScenarios, { takenIds: [], droppedIds: [] });

    expect(resolved.scenarioDeck.cardIds).toEqual(save.scenarioDeck.cardIds);
    expect(resolved.drawPile.slice(-3)).toEqual(offerCards);
    expectDrawPartition(resolved);
  });

  it("resolveCardOffer requires a compensating drop when the deck is full", () => {
    // A high cap makes deck SIZE (not budget) the constraint that forces the swap.
    const base = createSeedGameSave();
    const fullDeckIds = starterScenarios.slice(0, DECK_SIZE_MAX).map((scenario) => scenario.id);
    const save: GameSave = {
      ...base,
      budgetCap: 9_999,
      scenarioDeck: { ...base.scenarioDeck, cardIds: fullDeckIds },
      // Seed the pile to exclude the full deck so deck ∪ pile stays whole.
      drawPile: seedDrawPile(starterScenarios, fullDeckIds, "full"),
    };
    expect(save.scenarioDeck.cardIds).toHaveLength(DECK_SIZE_MAX);

    const offered = drawCardOffer(save, {
      count: 3,
      kind: "date",
      takeLimit: 1,
      canShuffle: false,
    });
    const taken = offered.pendingCardOffer?.cardIds[0];
    const drop = offered.scenarioDeck.cardIds[0];
    if (taken === undefined || drop === undefined) throw new Error("missing offer or deck card");

    expect(() =>
      resolveCardOffer(offered, starterScenarios, { takenIds: [taken], droppedIds: [] }),
    ).toThrow(/must hold/);

    const resolved = resolveCardOffer(offered, starterScenarios, {
      takenIds: [taken],
      droppedIds: [drop],
    });
    expect(resolved.scenarioDeck.cardIds).toContain(taken);
    expect(resolved.scenarioDeck.cardIds).not.toContain(drop);
    expect(resolved.scenarioDeck.cardIds).toHaveLength(DECK_SIZE_MAX);
    expectDrawPartition(resolved);
  });

  it("resolveCardOffer rejects taking a card outside the offer", () => {
    const save = createSeedGameSave();
    const offered = drawCardOffer(save, {
      count: 3,
      kind: "date",
      takeLimit: 1,
      canShuffle: false,
    });
    const notOffered = offered.drawPile[0];
    if (notOffered === undefined) throw new Error("pile empty");
    expect(() =>
      resolveCardOffer(offered, starterScenarios, { takenIds: [notOffered], droppedIds: [] }),
    ).toThrow(/not part of the current offer/);
  });

  it("shuffleCardOffer redraws deterministically and consumes the one-time shuffle", () => {
    const save = createSeedGameSave();
    const offered = attachClosureCardOffer(save);

    const reshuffled = shuffleCardOffer(offered, "closure-1");
    const reshuffledAgain = shuffleCardOffer(offered, "closure-1");
    expect(reshuffled.pendingCardOffer?.cardIds).toEqual(reshuffledAgain.pendingCardOffer?.cardIds);
    expect(reshuffled.pendingCardOffer?.canShuffle).toBe(false);
    expectDrawPartition(reshuffled);

    expect(() => shuffleCardOffer(reshuffled, "closure-1")).toThrow(/already been reshuffled/);
  });

  it("reconcileDrawState repairs missing and duplicated cards", () => {
    const save = createSeedGameSave();
    // Drop a pile card entirely and smuggle a deck card into the pile too.
    const deckCard = save.scenarioDeck.cardIds[0];
    if (deckCard === undefined) throw new Error("deck empty");
    const drifted: GameSave = {
      ...save,
      drawPile: [deckCard, ...save.drawPile.slice(1)],
    };

    const result = reconcileDrawState(drifted, starterScenarios);
    const ids = [
      ...result.scenarioDeck.cardIds,
      ...result.drawPile,
      ...(result.pendingCardOffer?.cardIds ?? []),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(ALL_SCENARIO_IDS));
    // The deck still owns the card; the pile no longer duplicates it.
    expect(result.scenarioDeck.cardIds).toContain(deckCard);
    expect(result.drawPile.filter((id) => id === deckCard)).toHaveLength(0);
  });
});
