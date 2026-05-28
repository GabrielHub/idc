import { describe, expect, it } from "vitest";

import { shouldShowStarQuickActions } from "./star-quick-action-visibility";
import type { StarQuickAction } from "./types";

const CASE_ACTION: StarQuickAction = {
  id: "case",
  label: "View case",
  icon: null,
  onSelect: () => {},
};

describe("shouldShowStarQuickActions", () => {
  it("hides the side rail for unclustered background stars", () => {
    expect(
      shouldShowStarQuickActions({
        tier: "background",
        clustered: false,
        actions: [CASE_ACTION],
      }),
    ).toBe(false);
  });

  it("keeps actions for clustered background stars and foreground stars", () => {
    expect(
      shouldShowStarQuickActions({
        tier: "background",
        clustered: true,
        actions: [CASE_ACTION],
      }),
    ).toBe(true);
    expect(
      shouldShowStarQuickActions({
        tier: "foreground",
        clustered: false,
        actions: [CASE_ACTION],
      }),
    ).toBe(true);
  });
});
