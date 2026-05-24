import { describe, expect, it } from "vitest";

import { starterScenarios } from "../../fixtures";
import { createStarterScenarioDeck, drawHandForBooking } from "../../services/deck";
import { buildAutoModeScenarios } from "./use-cathedral-model";

const scenarioById = new Map(starterScenarios.map((scenario) => [scenario.id, scenario] as const));

describe("buildAutoModeScenarios", () => {
  it("previews the same deterministic draw that booking will persist", () => {
    const deck = createStarterScenarioDeck(starterScenarios);
    const pairId = "jenna-pike__vhool";
    const shiftNumber = 1;

    const preview = buildAutoModeScenarios({
      drawnScenarios: [],
      deck,
      shiftNumber,
      previewPairId: pairId,
      scenarioById,
    });

    expect(preview.map((scenario) => scenario.id)).toEqual(
      drawHandForBooking({ deck, shiftNumber, pairId }),
    );
  });

  it("uses the persisted draw once a booking exists", () => {
    const deck = createStarterScenarioDeck(starterScenarios);
    const drawnScenarios = starterScenarios.slice(3, 6);

    const preview = buildAutoModeScenarios({
      drawnScenarios,
      deck,
      shiftNumber: 1,
      previewPairId: "jenna-pike__vhool",
      scenarioById,
    });

    expect(preview).toEqual(drawnScenarios);
  });
});
