import { describe, expect, it } from "vitest";

import { starterMembers } from "../fixtures";
import { DATE_PORTRAIT_MOODS, selectPortraitAsset } from "./date-presentation-signals";
import { resolveStandeeFooting, STANDEE_FOOTING_BY_CUTOUT_PATH } from "./standee-footing";

describe("standee footing", () => {
  it("covers every approved active member portrait cutout", () => {
    const missingPaths: string[] = [];

    for (const member of starterMembers) {
      if (member.state.status !== "active") continue;
      for (const mood of DATE_PORTRAIT_MOODS) {
        const asset = selectPortraitAsset(member, "portrait", mood);
        if (asset.model === "pending") continue;
        if (STANDEE_FOOTING_BY_CUTOUT_PATH[asset.cutoutPath] === undefined) {
          missingPaths.push(asset.cutoutPath);
        }
      }
    }

    expect(missingPaths).toEqual([]);
  });

  it("grounds Junie from her visible cutout feet instead of the canvas bottom", () => {
    const junie = starterMembers.find((member) => member.id === "junie-marrow");
    expect(junie).toBeDefined();

    if (junie === undefined) {
      return;
    }

    const footing = resolveStandeeFooting(junie.portraits.neutral.portrait.cutoutPath);

    expect(footing.renderedCanvasTranslatePercent).toBeGreaterThan(10);
    expect(footing.className).not.toBe("translate-y-0");
  });

  it("uses default footing when a portrait asset is not available yet", () => {
    const footing = resolveStandeeFooting("/assets/portraits/future-member/portrait.png");

    expect(footing.renderedCanvasTranslatePercent).toBe(0);
    expect(footing.className).toBe("translate-y-0");
  });
});
