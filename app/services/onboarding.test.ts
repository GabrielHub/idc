import { describe, expect, it } from "vitest";

import { companyGoals, memberRequests, starterScenarios } from "../fixtures";
import { STARTER_DECK_IDS } from "./deck";
import { createSeedGameSave, getActiveShift } from "./game-seed";
import { completeInitialOnboarding } from "./onboarding";

describe("initial onboarding", () => {
  it("keeps the selected focus cases and date scenario deck before entering the lobby", () => {
    const save = createSeedGameSave(new Date("2026-05-23T12:00:00.000Z"));
    const focusedMemberIds = save.members
      .filter((member) => member.state.status === "active")
      .slice(0, 4)
      .map((member) => member.id);
    const scenarioDeckCardIds = [...STARTER_DECK_IDS].reverse();

    const next = completeInitialOnboarding({
      save,
      focusedMemberIds,
      scenarioDeckCardIds,
      scenarios: starterScenarios,
      memberRequests,
      companyGoals,
    });

    const activeShift = getActiveShift(next);
    expect(next.focusedMemberIds).toEqual(focusedMemberIds);
    expect(next.scenarioDeck.cardIds).toEqual(scenarioDeckCardIds);
    expect(activeShift.featuredMemberIds).toEqual(focusedMemberIds);
    expect(activeShift.drawnScenarioIds).toEqual([]);
    expect(next.budgetPeriodId).toBe("budget-period-shift-1");

    // The draw pile is re-derived against the drafted deck: it excludes the
    // drafted cards and, with them, partitions the full catalog.
    const allIds = starterScenarios.map((scenario) => scenario.id);
    for (const id of next.scenarioDeck.cardIds) {
      expect(next.drawPile).not.toContain(id);
    }
    expect(next.pendingCardOffer).toBeNull();
    expect(new Set([...next.scenarioDeck.cardIds, ...next.drawPile])).toEqual(new Set(allIds));
  });
});
