import { describe, expect, it } from "vitest";

import { starterScenarios } from "../../fixtures";
import { buildAutoModeScenarios } from "./use-cathedral-model";

describe("buildAutoModeScenarios", () => {
  it("keeps auto mode empty before the pair is committed", () => {
    expect(
      buildAutoModeScenarios({
        drawnScenarios: [],
      }),
    ).toEqual([]);
  });

  it("uses the persisted draw once a booking exists", () => {
    const drawnScenarios = starterScenarios.slice(3, 6);

    const preview = buildAutoModeScenarios({
      drawnScenarios,
    });

    expect(preview).toEqual(drawnScenarios);
  });
});
