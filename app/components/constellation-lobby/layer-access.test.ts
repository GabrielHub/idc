import { describe, expect, it } from "vitest";

import { isLayerEnabled, normalizeLayer } from "./layer-access";
import { flythroughLayerForRosterSubview, rosterSubviewForFlythroughLayer } from "./types";

describe("constellation layer access", () => {
  it("keeps the cathedral locked until a pair is committed", () => {
    expect(isLayerEnabled(0, "planning")).toBe(true);
    expect(isLayerEnabled(1, "planning")).toBe(true);
    expect(isLayerEnabled(2, "planning")).toBe(true);
    expect(isLayerEnabled(3, "planning")).toBe(false);
    expect(isLayerEnabled(4, "planning")).toBe(true);
    expect(normalizeLayer(3, "planning")).toBe(2);
  });

  it("locks the player to the cathedral after commit", () => {
    expect(isLayerEnabled(0, "committed")).toBe(false);
    expect(isLayerEnabled(1, "committed")).toBe(false);
    expect(isLayerEnabled(2, "committed")).toBe(false);
    expect(isLayerEnabled(3, "committed")).toBe(true);
    expect(isLayerEnabled(4, "committed")).toBe(false);
    expect(normalizeLayer(0, "committed")).toBe(3);
  });

  it("maps roster subviews to their split flythrough layers", () => {
    expect(rosterSubviewForFlythroughLayer(1)).toBe("eligibles");
    expect(rosterSubviewForFlythroughLayer(2)).toBe("off_tonight");
    expect(rosterSubviewForFlythroughLayer(0)).toBeUndefined();
    expect(rosterSubviewForFlythroughLayer(3)).toBeUndefined();
    expect(rosterSubviewForFlythroughLayer(4)).toBeUndefined();

    expect(flythroughLayerForRosterSubview("eligibles")).toBe(1);
    expect(flythroughLayerForRosterSubview("off_tonight")).toBe(2);
  });
});
