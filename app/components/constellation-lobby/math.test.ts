import { describe, expect, it } from "vitest";

import { jennaPike } from "../../fixtures/members";
import type { MemberAuraConfig } from "../member-aura-registry";
import { resolvePortraitPalette } from "../portrait-palette";
import {
  advanceFlythroughLayer,
  avatarScaleForCanvas,
  availabilityRole,
  computeFlythroughCameraTarget,
  computeLayerZOffset,
  computeStarFlythroughLayer,
  FLYTHROUGH_CAMERA_Z,
  FLYTHROUGH_LAYER_Z,
  flythroughLayerDirectionFromKey,
  flythroughMemberSlabActivity,
  flythroughStarZ,
  haloColorForStar,
  intensityForRole,
  pairPartnerPosition,
  resolveStarPresentation,
  resolveStarRenderTarget,
  ringColorForRole,
  roleForStar,
  rosterClusterBoundsForCanvas,
  rosterClusterPosition,
  shouldUsePartnerRingLayout,
  sizeForStar3D,
  sizingRoleForStar,
  starHitRadiusFloorForCanvasScale,
  starWorldPosition,
  visibleWorldSizeAtDepth,
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

describe("resolveStarRenderTarget", () => {
  const natural = { x: 1, y: 2, z: -10 };

  it("returns the natural position when nothing overrides it", () => {
    expect(
      resolveStarRenderTarget({
        natural,
        overridePos: null,
        clusterPosition: null,
        flythroughLayer: undefined,
        layerZOffset: 0,
      }),
    ).toEqual({ x: 1, y: 2, z: -10 });
  });

  it("layers role-driven Z offset on top of the natural Z when no slab is set", () => {
    expect(
      resolveStarRenderTarget({
        natural,
        overridePos: null,
        clusterPosition: null,
        flythroughLayer: undefined,
        layerZOffset: 2.4,
      }),
    ).toEqual({ x: 1, y: 2, z: -10 + 2.4 });
  });

  it("uses the override XY and Z when one is provided (partner anchor)", () => {
    expect(
      resolveStarRenderTarget({
        natural,
        overridePos: { x: 5, y: 6, z: -3 },
        clusterPosition: null,
        flythroughLayer: undefined,
        layerZOffset: 1.4,
      }),
    ).toEqual({ x: 5, y: 6, z: -3 + 1.4 });
  });

  it("snaps to the flythrough slab Z plus a small jitter pulled from natural Z", () => {
    const layered = resolveStarRenderTarget({
      natural,
      overridePos: null,
      clusterPosition: null,
      flythroughLayer: 1,
      layerZOffset: 0,
    });
    expect(layered.x).toBe(1);
    expect(layered.y).toBe(2);
    expect(layered.z).toBeCloseTo(FLYTHROUGH_LAYER_Z[1] + natural.z * 0.18);
  });

  it("clusters in front of the camera on the focus slab without natural-Z jitter", () => {
    const clustered = resolveStarRenderTarget({
      natural,
      overridePos: null,
      clusterPosition: { x: -2.6, y: 1.8, z: 0 },
      flythroughLayer: 0,
      layerZOffset: 0,
    });
    expect(clustered.x).toBe(-2.6);
    expect(clustered.y).toBe(1.8);
    expect(clustered.z).toBe(FLYTHROUGH_LAYER_Z[0]);
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

  it("applies canvas scale to avatar geometry without changing role hierarchy", () => {
    const focus = sizeForStar3D("mid", "focus", "focus_selected", 0.8);
    const partner = sizeForStar3D("mid", "partner", "partner_selected", 0.8);
    const defaultFocus = sizeForStar3D("mid", "focus", "focus_selected");

    expect(focus.avatarRadius).toBeCloseTo(defaultFocus.avatarRadius * 0.8);
    expect(focus.haloRadius).toBeCloseTo(defaultFocus.haloRadius * 0.8);
    expect(focus.avatarRadius).toBeGreaterThan(partner.avatarRadius);
  });
});

describe("avatarScaleForCanvas", () => {
  it("keeps the design canvas near baseline scale", () => {
    expect(avatarScaleForCanvas({ width: 1920, height: 1080, dpr: 1.6 })).toBe(1);
  });

  it("shrinks avatars on smaller laptop canvases", () => {
    expect(avatarScaleForCanvas({ width: 1366, height: 768, dpr: 1 })).toBeLessThan(1);
  });

  it("expands avatars only within a bounded range on large canvases", () => {
    expect(avatarScaleForCanvas({ width: 2560, height: 1440, dpr: 1.6 })).toBe(1.12);
  });

  it("keeps hit radius floors in step with scaled avatars", () => {
    expect(starHitRadiusFloorForCanvasScale(0.72)).toBeLessThan(
      starHitRadiusFloorForCanvasScale(1),
    );
    expect(starHitRadiusFloorForCanvasScale(1.12)).toBe(0.22);
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

describe("resolveStarPresentation", () => {
  it("keeps dormant background stars as visible hit targets without avatar opacity", () => {
    const presentation = resolveStarPresentation({
      tier: "background",
      role: "dim",
      clustered: false,
      hovered: false,
      slabActivity: { intensityMultiplier: 0.2, scaleMultiplier: 0.4 },
      baseIntensity: 0.24,
      filteredOut: false,
      avatarRadius: 0.11,
    });

    expect(presentation.avatarOpacity).toBe(0);
    expect(presentation.avatarScale).toBe(0);
    // Hit radius floor is tuned to stay just under half the world-space
    // FIELD_BG_TO_BG_SPACING so neighbouring background dots don't share a
    // hit plane (which would steal each other's pointer events). The exact
    // value lives in math-render.ts; this test pins the floor against the
    // tiny visible avatar so future changes either bump both together or
    // make the divergence intentional.
    expect(presentation.hitRadius).toBeGreaterThan(0.11);
    expect(presentation.hitRadius).toBeLessThanOrEqual(0.24);
    expect(presentation.slabIntensity).toBe(1);
    expect(presentation.slabScale).toBe(1);
  });

  it("uses the canvas-scaled hit radius floor when provided", () => {
    const presentation = resolveStarPresentation({
      tier: "background",
      role: "dim",
      clustered: false,
      hovered: false,
      slabActivity: undefined,
      baseIntensity: 0.24,
      filteredOut: false,
      avatarRadius: 0.08,
      hitRadiusFloor: 0.16,
    });

    expect(presentation.hitRadius).toBe(0.16);
  });

  it("promotes hovered background stars to full avatars above the parallax field", () => {
    const presentation = resolveStarPresentation({
      tier: "background",
      role: "dim",
      clustered: false,
      hovered: true,
      slabActivity: { intensityMultiplier: 0.2, scaleMultiplier: 0.4 },
      baseIntensity: 0.24,
      filteredOut: false,
      avatarRadius: 0.11,
    });

    expect(presentation.avatarOpacity).toBe(1);
    expect(presentation.avatarScale).toBe(1);
    expect(presentation.zLift).toBe(1.8);
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

  it("strips alpha from rgba aura colors before handing them to Three", () => {
    const translucentAura: MemberAuraConfig = {
      kind: "godray",
      tint: { primary: "rgba(255, 224, 168, 0.55)", glow: "rgba(255, 220, 160, 0.35)" },
    };

    expect(haloColorForStar("eligible", palette, translucentAura)).toBe("rgb(255, 224, 168)");
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
    expect(advanceFlythroughLayer(2, 1)).toBe(4);
    expect(advanceFlythroughLayer(4, 1)).toBe(3);
  });

  it("reverses one layer per call when scrolling back out", () => {
    expect(advanceFlythroughLayer(3, -1)).toBe(4);
    expect(advanceFlythroughLayer(4, -1)).toBe(2);
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

describe("flythroughLayerDirectionFromKey", () => {
  it("maps D and ArrowDown to deeper layer navigation", () => {
    expect(flythroughLayerDirectionFromKey("KeyD")).toBe(1);
    expect(flythroughLayerDirectionFromKey("ArrowDown")).toBe(1);
  });

  it("maps A and ArrowUp to reverse layer navigation", () => {
    expect(flythroughLayerDirectionFromKey("KeyA")).toBe(-1);
    expect(flythroughLayerDirectionFromKey("ArrowUp")).toBe(-1);
  });

  it("ignores unrelated keys", () => {
    expect(flythroughLayerDirectionFromKey("Space")).toBeNull();
  });
});

describe("computeStarFlythroughLayer", () => {
  const focusedIds = new Set(["focus-1", "focus-2"]);

  it("places focused members on the focus slab", () => {
    expect(computeStarFlythroughLayer("focus-1", { focusedIds })).toBe(0);
  });

  it("places everyone else on the roster slab", () => {
    expect(computeStarFlythroughLayer("stranger", { focusedIds })).toBe(1);
  });
});

describe("flythroughStarZ", () => {
  it("places the focus slab in front of the roster slab", () => {
    expect(flythroughStarZ(0)).toBe(FLYTHROUGH_LAYER_Z[0]);
    expect(flythroughStarZ(1)).toBe(FLYTHROUGH_LAYER_Z[1]);
    expect(flythroughStarZ(0)).toBeGreaterThan(flythroughStarZ(1));
  });
});

describe("flythroughMemberSlabActivity", () => {
  it("gives the active focus slab a full intensity and a scale bump", () => {
    const focusActive = flythroughMemberSlabActivity(0, 0);
    expect(focusActive.intensityMultiplier).toBe(1);
    expect(focusActive.scaleMultiplier).toBeGreaterThan(1);
  });

  it("dims the off-axis slab when the player is on the focus layer", () => {
    const offAxis = flythroughMemberSlabActivity(1, 0);
    expect(offAxis.intensityMultiplier).toBeLessThan(1);
  });

  it("spotlights the eligible cohort on layer 1 when the subview is eligibles", () => {
    const eligibleLeads = flythroughMemberSlabActivity(1, 1, "eligible", "eligibles");
    const offTonightRecedes = flythroughMemberSlabActivity(1, 1, "off_tonight", "eligibles");
    expect(eligibleLeads.intensityMultiplier).toBeGreaterThan(
      offTonightRecedes.intensityMultiplier,
    );
  });

  it("spotlights the off-tonight cohort on layer 2 when the subview flips", () => {
    const offTonightLeads = flythroughMemberSlabActivity(1, 2, "off_tonight", "off_tonight");
    const eligibleRecedes = flythroughMemberSlabActivity(1, 2, "eligible", "off_tonight");
    expect(offTonightLeads.intensityMultiplier).toBeGreaterThan(
      eligibleRecedes.intensityMultiplier,
    );
  });

  it("slightly reduces active roster scale as the highlighted cohort grows", () => {
    const smallRoster = flythroughMemberSlabActivity(1, 2, "off_tonight", "off_tonight", 8);
    const largeRoster = flythroughMemberSlabActivity(1, 2, "off_tonight", "off_tonight", 20);
    expect(largeRoster.scaleMultiplier).toBeLessThan(smallRoster.scaleMultiplier);
    expect(largeRoster.scaleMultiplier).toBeGreaterThan(2);
  });

  it("crushes non-lead intensity on layer 1 so leads pop unambiguously", () => {
    const lead = flythroughMemberSlabActivity(1, 1, "eligible", "eligibles");
    const offCohort = flythroughMemberSlabActivity(1, 1, "off_tonight", "eligibles");
    const otherIneligible = flythroughMemberSlabActivity(1, 1, "other_ineligible", "eligibles");
    // Leads should be at least 5x brighter than the dimmer cohorts so the
    // pickable faces dominate while the off cohorts read as outline stars.
    expect(lead.intensityMultiplier).toBeGreaterThan(offCohort.intensityMultiplier * 5);
    expect(lead.intensityMultiplier).toBeGreaterThan(otherIneligible.intensityMultiplier * 5);
    // Other ineligible should be the dimmest tier.
    expect(otherIneligible.intensityMultiplier).toBeLessThan(offCohort.intensityMultiplier);
  });

  it("recedes every member slab when the player is on the scenarios layer", () => {
    const layer0 = flythroughMemberSlabActivity(0, 3);
    const layer1 = flythroughMemberSlabActivity(1, 3);
    expect(layer0.intensityMultiplier).toBeLessThan(0.5);
    expect(layer1.intensityMultiplier).toBeLessThan(0.5);
    expect(layer0).toEqual(layer1);
  });
});

describe("sizingRoleForStar", () => {
  it("normalizes active eligible roster leads to eligible geometry", () => {
    expect(
      sizingRoleForStar({
        role: "dim",
        flythroughLayer: 1,
        currentLayer: 1,
        cohort: "eligible",
        rosterSubview: "eligibles",
      }),
    ).toBe("eligible");
  });

  it("normalizes active off-tonight roster leads to the shared roster geometry", () => {
    expect(
      sizingRoleForStar({
        role: "ineligible_off_shift",
        flythroughLayer: 1,
        currentLayer: 2,
        cohort: "off_tonight",
        rosterSubview: "off_tonight",
      }),
    ).toBe("eligible");
  });

  it("keeps non-lead roster stars on their semantic geometry", () => {
    expect(
      sizingRoleForStar({
        role: "ineligible_off_shift",
        flythroughLayer: 1,
        currentLayer: 1,
        cohort: "off_tonight",
        rosterSubview: "eligibles",
      }),
    ).toBe("ineligible_off_shift");
  });
});

describe("rosterClusterPosition", () => {
  it("returns the origin for an empty or single-item cohort", () => {
    expect(rosterClusterPosition(0, 0)).toEqual({ x: 0, y: 0, z: 0 });
    expect(rosterClusterPosition(0, 1)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("lays a pair out horizontally so both faces sit side-by-side", () => {
    const left = rosterClusterPosition(0, 2);
    const right = rosterClusterPosition(1, 2);
    expect(left.y).toBe(0);
    expect(right.y).toBe(0);
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    expect(left.x).toBe(-right.x);
  });

  it("centers a partial last row so the cluster reads as a balanced rectangle", () => {
    // 5 items -> 2 rows of 3 (last row has 2, centered)
    const lastRowLeft = rosterClusterPosition(3, 5);
    const lastRowRight = rosterClusterPosition(4, 5);
    expect(lastRowLeft.y).toBe(lastRowRight.y);
    expect(lastRowLeft.x).toBeLessThan(0);
    expect(lastRowRight.x).toBeGreaterThan(0);
    expect(lastRowLeft.x).toBeCloseTo(-lastRowRight.x);
  });

  it("clamps spacing so a roster of 12 still fits inside the viewport bounds", () => {
    const positions = Array.from({ length: 12 }, (_, i) => rosterClusterPosition(i, 12));
    const xs = positions.map((p) => p.x);
    const ys = positions.map((p) => p.y);
    const maxX = Math.max(...xs.map(Math.abs));
    const maxY = Math.max(...ys.map(Math.abs));
    // Half-width should fit within the camera-fov-derived safe area (~6.5 wu)
    // and half-height inside the chrome-cleared safe area (~3.5 wu).
    expect(maxX).toBeLessThanOrEqual(6.5);
    expect(maxY).toBeLessThanOrEqual(3.5);
  });

  it("clamps even a large 20-member roster inside the viewport bounds", () => {
    const positions = Array.from({ length: 20 }, (_, i) => rosterClusterPosition(i, 20));
    const xs = positions.map((p) => p.x);
    const ys = positions.map((p) => p.y);
    const maxX = Math.max(...xs.map(Math.abs));
    const maxY = Math.max(...ys.map(Math.abs));
    expect(maxX).toBeLessThanOrEqual(6.5);
    expect(maxY).toBeLessThanOrEqual(3.5);
  });

  it("uses a wider shallow formation for a 20-member off-duty cohort", () => {
    const positions = Array.from({ length: 20 }, (_, i) => rosterClusterPosition(i, 20));
    const rows = new Set(positions.map((p) => p.y));
    expect(rows.size).toBe(3);
  });

  it("balances row counts so large cohorts do not stack into rigid columns", () => {
    const positions = Array.from({ length: 20 }, (_, i) => rosterClusterPosition(i, 20));
    const topRowLeft = positions[0]!.x;
    const middleRowLeft = positions[7]!.x;
    expect(middleRowLeft).toBeGreaterThan(topRowLeft);
  });

  it("accepts responsive bounds for narrow canvases", () => {
    const bounds = { maxWidth: 7.2, maxHeight: 4.2 };
    const positions = Array.from({ length: 20 }, (_, i) => rosterClusterPosition(i, 20, bounds));
    const xs = positions.map((p) => p.x);
    const ys = positions.map((p) => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(bounds.maxWidth);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(bounds.maxHeight);
  });

  it("keeps every cluster position on the roster slab plane (z=0 before slab snap)", () => {
    for (const total of [1, 4, 9, 12, 16]) {
      for (let i = 0; i < total; i += 1) {
        expect(rosterClusterPosition(i, total).z).toBe(0);
      }
    }
  });

  it("clamps out-of-range indices to the last valid slot", () => {
    const last = rosterClusterPosition(11, 12);
    const clamped = rosterClusterPosition(99, 12);
    expect(clamped).toEqual(last);
  });
});

describe("viewport roster fit", () => {
  it("computes world-space frustum size from the active camera plane", () => {
    const wide = visibleWorldSizeAtDepth({
      canvasWidth: 1920,
      canvasHeight: 1080,
      cameraZ: FLYTHROUGH_CAMERA_Z[1],
      planeZ: FLYTHROUGH_LAYER_Z[1],
    });
    const narrow = visibleWorldSizeAtDepth({
      canvasWidth: 1024,
      canvasHeight: 768,
      cameraZ: FLYTHROUGH_CAMERA_Z[1],
      planeZ: FLYTHROUGH_LAYER_Z[1],
    });

    expect(wide.height).toBeCloseTo(narrow.height);
    expect(wide.width).toBeGreaterThan(narrow.width);
  });

  it("derives tighter roster bounds for narrow canvases", () => {
    const wide = rosterClusterBoundsForCanvas({
      canvasWidth: 1920,
      canvasHeight: 1080,
      cameraZ: FLYTHROUGH_CAMERA_Z[1],
      planeZ: FLYTHROUGH_LAYER_Z[1],
      avatarScale: 1,
    });
    const narrow = rosterClusterBoundsForCanvas({
      canvasWidth: 1024,
      canvasHeight: 768,
      cameraZ: FLYTHROUGH_CAMERA_Z[1],
      planeZ: FLYTHROUGH_LAYER_Z[1],
      avatarScale: 0.8,
    });

    expect(narrow.maxWidth).toBeLessThan(wide.maxWidth);
    expect(narrow.maxHeight).toBeLessThanOrEqual(wide.maxHeight);
  });
});

describe("shouldUsePartnerRingLayout", () => {
  it("keeps the partner orbit only for small cohorts", () => {
    expect(shouldUsePartnerRingLayout(1)).toBe(false);
    expect(shouldUsePartnerRingLayout(2)).toBe(true);
    expect(shouldUsePartnerRingLayout(6)).toBe(true);
    expect(shouldUsePartnerRingLayout(7)).toBe(false);
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
    const target = computeFlythroughCameraTarget(3, focus);
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
    expect(layer3.bokehScale).toBeLessThan(1);
    expect(layer0.bokehScale).toBeLessThan(1);
  });
});
