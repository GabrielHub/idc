import { describe, expect, it } from "vitest";

import { starterMembers } from "../fixtures";
import { DATE_PORTRAIT_MOODS, selectPortraitAsset } from "./date-presentation-signals";
import { resolveStandeeFooting, STANDEE_FOOTING_BY_CUTOUT_PATH } from "./standee-footing";

describe("standee footing", () => {
  it("covers every active member portrait cutout", () => {
    const missingPaths: string[] = [];

    for (const member of starterMembers) {
      for (const mood of DATE_PORTRAIT_MOODS) {
        const path = selectPortraitAsset(member, "portrait", mood).cutoutPath;
        if (STANDEE_FOOTING_BY_CUTOUT_PATH[path] === undefined) {
          missingPaths.push(path);
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
});
