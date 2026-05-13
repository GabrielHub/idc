import { describe, expect, it } from "vitest";

import { formatMemberHeightLabel, resolveStandeeHeightScale } from "./date-reactions";

describe("standee height scaling", () => {
  it("formats fixture inches as feet and inches", () => {
    expect(formatMemberHeightLabel(76)).toBe("6 ft 4 in");
    expect(formatMemberHeightLabel(69)).toBe("5 ft 9 in");
    expect(formatMemberHeightLabel(68)).toBe("5 ft 8 in");
    expect(formatMemberHeightLabel(67)).toBe("5 ft 7 in");
  });

  it("keeps supplied height anchors in distinct visible scale buckets", () => {
    expect(resolveStandeeHeightScale(76).value).toBe(1.13);
    expect(resolveStandeeHeightScale(69).value).toBe(1.03);
    expect(resolveStandeeHeightScale(68).value).toBe(1);
    expect(resolveStandeeHeightScale(67).value).toBe(0.99);
  });

  it("bounds unusual forms for the date stage", () => {
    expect(resolveStandeeHeightScale(24).value).toBe(0.84);
    expect(resolveStandeeHeightScale(108).value).toBe(1.18);
  });
});
