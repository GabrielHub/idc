import { describe, expect, it } from "vitest";

import { jennaPike } from "../../fixtures/members";
import type { MemberAuraConfig } from "../member-aura-registry";
import { resolvePortraitPalette } from "../portrait-palette";
import {
  availabilityRole,
  computeCameraTarget,
  computeLayerZOffset,
  haloColorForStar,
  intensityForRole,
  pairPartnerPosition,
  rainColorForStar,
  rainDensityForStar,
  rgbChannelsFromColor,
  ringColorForRole,
  roleForStar,
  sizeForStar3D,
  starWorldPosition,
  withAlpha,
  WORLD_X_SCALE,
  WORLD_Y_SCALE,
  WORLD_Z_SCALE,
} from "./math";
import type { StarMark } from "./types";

const SAMPLE_AURA: MemberAuraConfig = {
  kind: "godray",
  tint: { primary: "#88ccff", glow: "rgba(136, 204, 255, 0.35)" },
};

const palette = resolvePortraitPalette(jennaPike);

function makeStar(overrides: Partial<StarMark> = {}): StarMark {
  return {
    member: jennaPike,
    palette,
    aura: undefined,
    x: 50,
    y: 50,
    z: 0,
    tier: "mid",
    availability: "ready",
    phase: 0,
    ...overrides,
  };
}

describe("starWorldPosition", () => {
  it("maps a centered field position to the world origin", () => {
    const pos = starWorldPosition(makeStar({ x: 50, y: 50, z: 0 }));
    expect(pos.x).toBe(0);
    expect(pos.y).toBeCloseTo(0);
    expect(pos.z).toBe(0);
  });

  it("scales x, y, z by the per-axis world-scale constants", () => {
    expect(starWorldPosition(makeStar({ x: 100, y: 100, z: 60 }))).toEqual({
      x: 50 * WORLD_X_SCALE,
      y: 50 * WORLD_Y_SCALE,
      z: 60 * WORLD_Z_SCALE,
    });
  });

  it("flips y so a higher field y reads lower on screen", () => {
    const top = starWorldPosition(makeStar({ x: 50, y: 0 }));
    const bottom = starWorldPosition(makeStar({ x: 50, y: 100 }));
    expect(top.y).toBeGreaterThan(bottom.y);
  });
});

describe("pairPartnerPosition", () => {
  it("offsets the partner +14 in field-x and +2 in field-y from the focus", () => {
    const focus = makeStar({ x: 30, y: 40, z: 0 });
    const pos = pairPartnerPosition(focus);
    expect(pos.x).toBeCloseTo((30 + 14 - 50) * WORLD_X_SCALE);
    expect(pos.y).toBeCloseTo((40 + 2 - 50) * WORLD_Y_SCALE);
    expect(pos.z).toBeCloseTo(0);
  });
});

describe("computeCameraTarget", () => {
  it("returns the centered idle frame when the lobby is idle", () => {
    expect(computeCameraTarget("idle", undefined)).toEqual({
      position: [0, 0, 17],
      lookAt: [0, 0, -1],
      bokehScale: 1.2,
    });
  });

  it("returns the centered idle frame when callouts dominate", () => {
    expect(computeCameraTarget("callout_heavy", makeStar())).toEqual({
      position: [0, 0, 17],
      lookAt: [0, 0, -1],
      bokehScale: 1.2,
    });
  });

  it("falls back to the centered frame in non-idle states without a focus", () => {
    expect(computeCameraTarget("focus_selected", undefined)).toEqual({
      position: [0, 0, 17],
      lookAt: [0, 0, -1],
      bokehScale: 1.2,
    });
  });

  it("dollies in toward the focus on focus_selected", () => {
    const focus = makeStar({ x: 70, y: 30, z: 0 });
    const target = computeCameraTarget("focus_selected", focus);
    expect(target.position[2]).toBe(10);
    expect(target.bokehScale).toBe(1.4);
    const fp = starWorldPosition(focus);
    expect(target.position[0]).toBeCloseTo(fp.x * 0.55);
    expect(target.position[1]).toBeCloseTo(fp.y * 0.5);
  });

  it("frames the pair anchor on partner_selected and beyond", () => {
    const focus = makeStar({ x: 60, y: 40, z: 0 });
    const target = computeCameraTarget("partner_selected", focus);
    expect(target.position[2]).toBe(6.5);
    expect(target.bokehScale).toBe(1.5);
  });
});

describe("computeLayerZOffset", () => {
  it("is flat when the lobby is idle or callout-heavy", () => {
    expect(computeLayerZOffset("focus", "idle")).toBe(0);
    expect(computeLayerZOffset("eligible", "callout_heavy")).toBe(0);
  });

  it("pulls focus and partner forward in non-idle states", () => {
    expect(computeLayerZOffset("focus", "focus_selected")).toBe(1.4);
    expect(computeLayerZOffset("partner", "partner_selected")).toBe(1.4);
  });

  it("pulls eligible candidates even further forward", () => {
    expect(computeLayerZOffset("eligible", "focus_selected")).toBe(2.4);
  });

  it("recedes ineligible stars by availability severity", () => {
    expect(computeLayerZOffset("ineligible_cooling", "focus_selected")).toBe(-3);
    expect(computeLayerZOffset("ineligible_off_shift", "focus_selected")).toBe(-5);
    expect(computeLayerZOffset("ineligible_closed", "focus_selected")).toBe(-6);
  });

  it("recedes dim stars slightly so the active layer reads forward", () => {
    expect(computeLayerZOffset("dim", "focus_selected")).toBe(-1.5);
  });
});

describe("roleForStar", () => {
  const eligibleSet = new Set<string>([jennaPike.id]);

  it("returns dim for ready stars in idle so the field reads quietly", () => {
    expect(
      roleForStar(makeStar({ availability: "ready" }), {
        state: "idle",
        focusId: undefined,
        partnerId: undefined,
        eligiblePartnerIds: new Set(),
      }),
    ).toBe("dim");
  });

  it("returns the availability role for non-ready stars in idle", () => {
    expect(
      roleForStar(makeStar({ availability: "cooling" }), {
        state: "idle",
        focusId: undefined,
        partnerId: undefined,
        eligiblePartnerIds: new Set(),
      }),
    ).toBe("ineligible_cooling");
  });

  it("returns availability-based roles in callout_heavy regardless of focus", () => {
    expect(
      roleForStar(makeStar({ availability: "off_shift" }), {
        state: "callout_heavy",
        focusId: jennaPike.id,
        partnerId: undefined,
        eligiblePartnerIds: eligibleSet,
      }),
    ).toBe("ineligible_off_shift");
  });

  it("identifies the focus member by id when a focus is selected", () => {
    expect(
      roleForStar(makeStar(), {
        state: "focus_selected",
        focusId: jennaPike.id,
        partnerId: undefined,
        eligiblePartnerIds: new Set(),
      }),
    ).toBe("focus");
  });

  it("identifies the partner member by id when a partner is selected", () => {
    expect(
      roleForStar(makeStar(), {
        state: "partner_selected",
        focusId: "someone-else",
        partnerId: jennaPike.id,
        eligiblePartnerIds: new Set(),
      }),
    ).toBe("partner");
  });

  it("marks ready members in the eligible set as eligible during focus_selected", () => {
    expect(
      roleForStar(makeStar({ availability: "ready" }), {
        state: "focus_selected",
        focusId: "someone-else",
        partnerId: undefined,
        eligiblePartnerIds: eligibleSet,
      }),
    ).toBe("eligible");
  });

  it("falls back to availability for non-eligible stars during focus_selected", () => {
    expect(
      roleForStar(makeStar({ availability: "closed" }), {
        state: "focus_selected",
        focusId: "someone-else",
        partnerId: undefined,
        eligiblePartnerIds: eligibleSet,
      }),
    ).toBe("ineligible_closed");
  });

  it("returns dim in pair / scenario states for non-focus, non-partner stars", () => {
    expect(
      roleForStar(makeStar({ availability: "ready" }), {
        state: "committed_pair",
        focusId: "someone-else",
        partnerId: "another-one",
        eligiblePartnerIds: eligibleSet,
      }),
    ).toBe("dim");
  });
});

describe("availabilityRole", () => {
  it("maps each non-ready availability to its ineligible role", () => {
    expect(availabilityRole("cooling")).toBe("ineligible_cooling");
    expect(availabilityRole("off_shift")).toBe("ineligible_off_shift");
    expect(availabilityRole("closed")).toBe("ineligible_closed");
  });

  it("returns dim for ready stars (the caller decides if dim is appropriate)", () => {
    expect(availabilityRole("ready")).toBe("dim");
  });
});

describe("sizeForStar3D", () => {
  it("scales role hierarchy from focus down through partner, eligible, ineligible", () => {
    const focus = sizeForStar3D("mid", "focus", "focus_selected");
    const partner = sizeForStar3D("mid", "partner", "partner_selected");
    const eligible = sizeForStar3D("mid", "eligible", "focus_selected");
    const cooling = sizeForStar3D("mid", "ineligible_cooling", "focus_selected");
    expect(focus.avatarRadius).toBeGreaterThan(partner.avatarRadius);
    expect(partner.avatarRadius).toBeGreaterThan(eligible.avatarRadius);
    expect(eligible.avatarRadius).toBeGreaterThan(cooling.avatarRadius);
  });

  it("gives foreground tier the largest dim size in idle, background the smallest", () => {
    const fg = sizeForStar3D("foreground", "dim", "idle");
    const mid = sizeForStar3D("mid", "dim", "idle");
    const bg = sizeForStar3D("background", "dim", "idle");
    expect(fg.avatarRadius).toBeGreaterThan(mid.avatarRadius);
    expect(mid.avatarRadius).toBeGreaterThan(bg.avatarRadius);
  });

  it("shrinks dim stars further when the lobby is no longer idle", () => {
    expect(sizeForStar3D("foreground", "dim", "focus_selected").avatarRadius).toBeLessThan(
      sizeForStar3D("foreground", "dim", "idle").avatarRadius,
    );
  });
});

describe("intensityForRole", () => {
  it("pegs focus and partner at full intensity", () => {
    expect(intensityForRole("focus", "mid", "focus_selected")).toBe(1);
    expect(intensityForRole("partner", "mid", "partner_selected")).toBe(1);
  });

  it("keeps eligible candidates nearly as bright as focus", () => {
    expect(intensityForRole("eligible", "mid", "focus_selected")).toBe(0.96);
  });

  it("dims ineligible stars in availability severity order", () => {
    expect(intensityForRole("ineligible_cooling", "mid", "focus_selected")).toBeGreaterThan(
      intensityForRole("ineligible_off_shift", "mid", "focus_selected"),
    );
    expect(intensityForRole("ineligible_off_shift", "mid", "focus_selected")).toBeGreaterThan(
      intensityForRole("ineligible_closed", "mid", "focus_selected"),
    );
  });

  it("brightens the field hierarchy in idle (so the field has presence)", () => {
    expect(intensityForRole("dim", "foreground", "idle")).toBeGreaterThan(
      intensityForRole("dim", "foreground", "focus_selected"),
    );
  });
});

describe("ringColorForRole", () => {
  it("uses the focus pink ring", () => {
    expect(ringColorForRole("focus", "focus_selected", palette)).toBe("#fb7185");
  });

  it("uses the partner violet ring", () => {
    expect(ringColorForRole("partner", "partner_selected", palette)).toBe("#c4b5fd");
  });

  it("uses the palette accent for eligible candidates so each star reads distinct", () => {
    expect(ringColorForRole("eligible", "focus_selected", palette)).toBe(palette.accent);
  });
});

describe("withAlpha", () => {
  it("converts #rgb hex to rgba", () => {
    expect(withAlpha("#abc", 0.5)).toBe("rgba(170, 187, 204, 0.5)");
  });

  it("converts #rrggbb hex to rgba", () => {
    expect(withAlpha("#ff0080", 0.25)).toBe("rgba(255, 0, 128, 0.25)");
  });

  it("rewrites the alpha of an existing rgba color", () => {
    expect(withAlpha("rgba(10, 20, 30, 0.9)", 0.1)).toBe("rgba(10, 20, 30, 0.1)");
  });

  it("converts an rgb color to rgba with the requested alpha", () => {
    expect(withAlpha("rgb(10, 20, 30)", 0.4)).toBe("rgba(10, 20, 30, 0.4)");
  });

  it("returns the source string for unknown formats", () => {
    expect(withAlpha("currentColor", 0.5)).toBe("currentColor");
  });
});

describe("rgbChannelsFromColor", () => {
  it("normalizes #rrggbb to 0-1 channels", () => {
    expect(rgbChannelsFromColor("#ff0080")).toEqual({ r: 1, g: 0, b: 128 / 255 });
  });

  it("normalizes #rgb to 0-1 channels via duplication", () => {
    expect(rgbChannelsFromColor("#abc")).toEqual({
      r: 0xaa / 255,
      g: 0xbb / 255,
      b: 0xcc / 255,
    });
  });

  it("normalizes rgb() to 0-1 channels and drops the alpha", () => {
    expect(rgbChannelsFromColor("rgb(255, 128, 0)")).toEqual({ r: 1, g: 128 / 255, b: 0 });
  });

  it("normalizes rgba() and drops the alpha", () => {
    expect(rgbChannelsFromColor("rgba(0, 64, 192, 0.5)")).toEqual({
      r: 0,
      g: 64 / 255,
      b: 192 / 255,
    });
  });

  it("returns a soft warm fallback for unparseable inputs (never pure-black rain)", () => {
    const fallback = rgbChannelsFromColor("currentColor");
    expect(fallback.r).toBeGreaterThan(0.5);
    expect(fallback.g).toBeGreaterThan(0.5);
    expect(fallback.b).toBeGreaterThan(0.5);
  });
});

describe("rainColorForStar", () => {
  const palette = resolvePortraitPalette(jennaPike);

  it("uses the focus rose for focus stars", () => {
    expect(rainColorForStar("focus", palette, undefined)).toEqual(rgbChannelsFromColor("#fb7185"));
  });

  it("uses the partner violet for partner stars", () => {
    expect(rainColorForStar("partner", palette, undefined)).toEqual(
      rgbChannelsFromColor("#c4b5fd"),
    );
  });

  it("prefers aura tint for eligible candidates when an aura is registered", () => {
    expect(rainColorForStar("eligible", palette, SAMPLE_AURA)).toEqual(
      rgbChannelsFromColor(SAMPLE_AURA.tint.primary),
    );
  });

  it("falls back to the palette accent for eligible candidates without an aura", () => {
    expect(rainColorForStar("eligible", palette, undefined)).toEqual(
      rgbChannelsFromColor(palette.accent),
    );
  });

  it("warms cooling stars toward soft rose", () => {
    expect(rainColorForStar("ineligible_cooling", palette, undefined)).toEqual(
      rgbChannelsFromColor("#fda4af"),
    );
  });

  it("desaturates off-shift and closed stars to a cool blue-grey", () => {
    const offShift = rainColorForStar("ineligible_off_shift", palette, undefined);
    const closed = rainColorForStar("ineligible_closed", palette, undefined);
    expect(offShift).toEqual(rgbChannelsFromColor("#94a3b8"));
    expect(closed).toEqual(rgbChannelsFromColor("#94a3b8"));
  });

  it("still tints dim background stars by aura or palette so each carries identity", () => {
    expect(rainColorForStar("dim", palette, SAMPLE_AURA)).toEqual(
      rgbChannelsFromColor(SAMPLE_AURA.tint.primary),
    );
    expect(rainColorForStar("dim", palette, undefined)).toEqual(
      rgbChannelsFromColor(palette.accent),
    );
  });
});

describe("haloColorForStar", () => {
  const palette = resolvePortraitPalette(jennaPike);

  it("uses the active-pair colors for focus and partner", () => {
    expect(haloColorForStar("focus", palette, SAMPLE_AURA)).toBe("#fb7185");
    expect(haloColorForStar("partner", palette, SAMPLE_AURA)).toBe("#c4b5fd");
  });

  it("uses the aura primary for non-active roles when registered", () => {
    expect(haloColorForStar("eligible", palette, SAMPLE_AURA)).toBe(SAMPLE_AURA.tint.primary);
    expect(haloColorForStar("dim", palette, SAMPLE_AURA)).toBe(SAMPLE_AURA.tint.primary);
  });

  it("falls back to the palette accent when no aura is registered", () => {
    expect(haloColorForStar("eligible", palette, undefined)).toBe(palette.accent);
    expect(haloColorForStar("dim", palette, undefined)).toBe(palette.accent);
  });
});

describe("rainDensityForStar", () => {
  it("cascades heavy data for focus and partner", () => {
    expect(rainDensityForStar("focus", "mid", "focus_selected")).toBe(22);
    expect(rainDensityForStar("partner", "mid", "partner_selected")).toBe(18);
  });

  it("gives eligibles a moderate cascade", () => {
    expect(rainDensityForStar("eligible", "mid", "focus_selected")).toBe(12);
  });

  it("dims ineligibles in availability severity order (closed gets nothing)", () => {
    expect(rainDensityForStar("ineligible_cooling", "mid", "focus_selected")).toBe(5);
    expect(rainDensityForStar("ineligible_off_shift", "mid", "focus_selected")).toBe(2);
    expect(rainDensityForStar("ineligible_closed", "mid", "focus_selected")).toBe(0);
  });

  it("scales dim density by tier in the idle field", () => {
    expect(rainDensityForStar("dim", "foreground", "idle")).toBe(8);
    expect(rainDensityForStar("dim", "mid", "idle")).toBe(4);
    expect(rainDensityForStar("dim", "background", "idle")).toBe(2);
  });

  it("shrinks dim density further when the lobby is non-idle so the active pair leads", () => {
    expect(rainDensityForStar("dim", "foreground", "focus_selected")).toBeLessThan(
      rainDensityForStar("dim", "foreground", "idle"),
    );
    expect(rainDensityForStar("dim", "background", "focus_selected")).toBe(0);
  });
});
