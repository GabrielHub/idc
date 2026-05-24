import { describe, expect, it } from "vitest";

import { isLayerEnabled, normalizeLayer } from "./layer-access";

describe("constellation layer access", () => {
  it("keeps the cathedral locked until a pair is committed", () => {
    expect(isLayerEnabled(0, "planning")).toBe(true);
    expect(isLayerEnabled(1, "planning")).toBe(true);
    expect(isLayerEnabled(2, "planning")).toBe(false);
    expect(normalizeLayer(2, "planning")).toBe(1);
  });

  it("locks the player to the cathedral after commit", () => {
    expect(isLayerEnabled(0, "committed")).toBe(false);
    expect(isLayerEnabled(1, "committed")).toBe(false);
    expect(isLayerEnabled(2, "committed")).toBe(true);
    expect(normalizeLayer(0, "committed")).toBe(2);
  });
});
