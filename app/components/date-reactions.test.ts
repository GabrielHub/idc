import { describe, expect, it } from "vitest";

import {
  formatMemberHeightLabel,
  formatMemberHeightShort,
  resolveStandeeHeightScale,
} from "./date-reactions";

describe("standee height scaling", () => {
  it("formats fixture inches as feet and inches", () => {
    expect(formatMemberHeightLabel(76)).toBe("6 ft 4 in");
    expect(formatMemberHeightLabel(73)).toBe("6 ft 1 in");
    expect(formatMemberHeightLabel(69)).toBe("5 ft 9 in");
    expect(formatMemberHeightLabel(68)).toBe("5 ft 8 in");
    expect(formatMemberHeightLabel(67)).toBe("5 ft 7 in");
  });

  it("formats fixture inches in compact feet-prime form", () => {
    expect(formatMemberHeightShort(76)).toBe("6'4");
    expect(formatMemberHeightShort(69)).toBe("5'9");
    expect(formatMemberHeightShort(60)).toBe("5'0");
  });

  it("keeps generated-height anchors in their locked visible scale buckets", () => {
    expect(resolveStandeeHeightScale(76).value).toBe(1.12);
    expect(resolveStandeeHeightScale(73).value).toBe(1.07);
    expect(resolveStandeeHeightScale(69).value).toBe(1.01);
  });

  it("bounds unusual forms for the date stage", () => {
    expect(resolveStandeeHeightScale(24).value).toBe(0.78);
    expect(resolveStandeeHeightScale(108).value).toBe(1.24);
  });
});
