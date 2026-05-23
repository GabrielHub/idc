import { describe, expect, it } from "vitest";

import { jennaPike } from "../../fixtures/members";
import type { MemberAuraConfig } from "../member-aura-registry";
import { resolvePortraitPalette } from "../portrait-palette";
import {
  advanceFlythroughLayer,
  availabilityRole,
  computeCameraTarget,
  computeFlythroughCameraTarget,
  computeLayerZOffset,
  computeStarFlythroughLayer,
  FLYTHROUGH_CAMERA_Z,
  FLYTHROUGH_LAYER_Z,
  flythroughMemberSlabActivity,
  flythroughStarZ,
  haloColorForStar,
  intensityForRole,
  pairPartnerPosition,
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
  it("returns the centered idle frame with mild bokeh so focus cases stay sharp", () => {
    expect(computeCameraTarget("idle", undefined)).toEqual({
      position: [0, 0, 17],
      lookAt: [0, 0, -1],
      bokehScale: 0.45,
    });
  });

  it("returns the mild-bokeh idle frame when callouts dominate", () => {
    expect(computeCameraTarget("callout_heavy", makeStar())).toEqual({
      position: [0, 0, 17],
      lookAt: [0, 0, -1],
      bokehScale: 0.45,
    });
  });

  it("falls back to the centered frame in non-idle states without a focus", () => {
    expect(computeCameraTarget("focus_selected", undefined)).toEqual({
      position: [0, 0, 17],
      lookAt: [0, 0, -1],
      bokehScale: 0.45,
    });
  });

  it("dollies in toward the focus on focus_selected with a deeper bokeh", () => {
    const focus = makeStar({ x: 70, y: 30, z: 0 });
    const target = computeCameraTarget("focus_selected", focus);
    expect(target.position[2]).toBe(10);
    expect(target.bokehScale).toBe(1.1);
    const fp = starWorldPosition(focus);
    expect(target.position[0]).toBeCloseTo(fp.x * 0.55);
    expect(target.position[1]).toBeCloseTo(fp.y * 0.5);
  });

  it("frames the pair anchor on partner_selected and beyond with the deepest bokeh", () => {
    const focus = makeStar({ x: 60, y: 40, z: 0 });
    const target = computeCameraTarget("partner_selected", focus);
    expect(target.position[2]).toBe(6.5);
    expect(target.bokehScale).toBe(1.25);
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

describe("advanceFlythroughLayer", () => {
  it("advances one layer per call when scrolling deeper", () => {
    expect(advanceFlythroughLayer(0, 1)).toBe(1);
    expect(advanceFlythroughLayer(1, 1)).toBe(2);
    expect(advanceFlythroughLayer(2, 1)).toBe(3);
  });

  it("reverses one layer per call when scrolling back out", () => {
    expect(advanceFlythroughLayer(3, -1)).toBe(2);
    expect(advanceFlythroughLayer(2, -1)).toBe(1);
    expect(advanceFlythroughLayer(1, -1)).toBe(0);
  });

  it("clamps at the focus layer when scrolling up from layer 0", () => {
    expect(advanceFlythroughLayer(0, -1)).toBe(0);
  });

  it("clamps at the scenarios layer when scrolling down from layer 3", () => {
    expect(advanceFlythroughLayer(3, 1)).toBe(3);
  });
});

describe("computeStarFlythroughLayer", () => {
  const focusedIds = new Set(["focus-1", "focus-2"]);
  const eligibleIds = new Set(["eligible-1", "eligible-2"]);

  it("places focused members on layer 0", () => {
    expect(computeStarFlythroughLayer("focus-1", { focusedIds, eligibleIds })).toBe(0);
  });

  it("places eligible members on layer 1", () => {
    expect(computeStarFlythroughLayer("eligible-1", { focusedIds, eligibleIds })).toBe(1);
  });

  it("places everyone else on layer 2 (off tonight)", () => {
    expect(computeStarFlythroughLayer("stranger", { focusedIds, eligibleIds })).toBe(2);
  });

  it("prefers focus over eligible when a member is in both sets", () => {
    const overlap = new Set(["overlap-id"]);
    expect(
      computeStarFlythroughLayer("overlap-id", {
        focusedIds: overlap,
        eligibleIds: new Set(["overlap-id"]),
      }),
    ).toBe(0);
  });
});

describe("flythroughStarZ", () => {
  it("maps each member slab to a forward-receding world Z", () => {
    expect(flythroughStarZ(0)).toBe(FLYTHROUGH_LAYER_Z[0]);
    expect(flythroughStarZ(1)).toBe(FLYTHROUGH_LAYER_Z[1]);
    expect(flythroughStarZ(2)).toBe(FLYTHROUGH_LAYER_Z[2]);
    expect(flythroughStarZ(0)).toBeGreaterThan(flythroughStarZ(1));
    expect(flythroughStarZ(1)).toBeGreaterThan(flythroughStarZ(2));
  });
});

describe("flythroughMemberSlabActivity", () => {
  it("gives the active slab a full intensity and a scale bump so it reads forward", () => {
    const focusActive = flythroughMemberSlabActivity(0, 0);
    expect(focusActive.intensityMultiplier).toBe(1);
    expect(focusActive.scaleMultiplier).toBeGreaterThan(1);
  });

  it("dims neighbouring slabs less than far slabs", () => {
    // Player on layer 1; layer 0 is 1 away, layer 2 is 1 away.
    const near = flythroughMemberSlabActivity(0, 1);
    const far = flythroughMemberSlabActivity(2, 0);
    expect(near.intensityMultiplier).toBeGreaterThan(far.intensityMultiplier);
  });

  it("recedes every member slab when the player is on the scenarios layer", () => {
    const layer0 = flythroughMemberSlabActivity(0, 3);
    const layer1 = flythroughMemberSlabActivity(1, 3);
    const layer2 = flythroughMemberSlabActivity(2, 3);
    expect(layer0.intensityMultiplier).toBeLessThan(0.5);
    expect(layer1.intensityMultiplier).toBeLessThan(0.5);
    expect(layer2.intensityMultiplier).toBeLessThan(0.5);
    // Uniform recede so no member slab sneaks forward of the scenarios.
    expect(layer0).toEqual(layer1);
    expect(layer1).toEqual(layer2);
  });
});

describe("computeFlythroughCameraTarget", () => {
  it("punches the camera forward as the player advances through the layers", () => {
    expect(computeFlythroughCameraTarget(0, undefined).position[2]).toBe(FLYTHROUGH_CAMERA_Z[0]);
    expect(computeFlythroughCameraTarget(1, undefined).position[2]).toBe(FLYTHROUGH_CAMERA_Z[1]);
    expect(computeFlythroughCameraTarget(2, undefined).position[2]).toBe(FLYTHROUGH_CAMERA_Z[2]);
    expect(computeFlythroughCameraTarget(3, undefined).position[2]).toBe(FLYTHROUGH_CAMERA_Z[3]);
    expect(FLYTHROUGH_CAMERA_Z[0]).toBeGreaterThan(FLYTHROUGH_CAMERA_Z[1]);
    expect(FLYTHROUGH_CAMERA_Z[1]).toBeGreaterThan(FLYTHROUGH_CAMERA_Z[2]);
    expect(FLYTHROUGH_CAMERA_Z[2]).toBeGreaterThan(FLYTHROUGH_CAMERA_Z[3]);
  });

  it("biases layer 0 framing toward the focus star x/y when one is provided", () => {
    const focus = makeStar({ x: 80, y: 20, z: 0 });
    const fp = starWorldPosition(focus);
    const target = computeFlythroughCameraTarget(0, focus);
    expect(target.position[0]).toBeCloseTo(fp.x * 0.25);
    expect(target.position[1]).toBeCloseTo(fp.y * 0.25);
  });

  it("centers the framing on layers beyond 0 regardless of focus", () => {
    const focus = makeStar({ x: 80, y: 20, z: 0 });
    const target = computeFlythroughCameraTarget(2, focus);
    expect(target.position[0]).toBe(0);
    expect(target.position[1]).toBe(0);
  });

  it("looks ahead in -Z so each layer punches through the previous one", () => {
    for (const layer of [0, 1, 2, 3] as const) {
      const target = computeFlythroughCameraTarget(layer, undefined);
      expect(target.lookAt[2]).toBeLessThan(target.position[2]);
    }
  });

  it("tightens DoF as the player closes in on the scenarios layer", () => {
    const layer0 = computeFlythroughCameraTarget(0, undefined);
    const layer3 = computeFlythroughCameraTarget(3, undefined);
    // Layer 0 stays mild (idle field), layer 3 reads as a foreground "wall"
    // of scenario cards so the bokeh tightens up to keep text crisp.
    expect(layer3.bokehScale).toBeLessThan(1);
    expect(layer0.bokehScale).toBeLessThan(1);
  });
});
