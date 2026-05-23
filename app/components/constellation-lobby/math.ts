/**
 * Pure helpers for the constellation lobby — world-space conversions, camera
 * framing per state, role/availability resolution, layered Z, per-role sizing
 * and intensity, and small text/color utilities. No React, no Three runtime
 * state, no closures over component state. Anything that needs `state` or
 * `role` takes them as args so the same helper works for spike and prod.
 */

import type {
  CameraTarget,
  FlythroughLayer,
  LobbyState,
  StarAvailability,
  StarFlythroughLayer,
  StarMark,
  StarRole,
  StarTier,
  Vec3,
} from "./types";
import type { PortraitPalette } from "../portrait-palette";
import type { MemberAuraConfig } from "../member-aura-registry";

/** star.x (0–100) → world x (~-11..+11). */
export const WORLD_X_SCALE = 0.22;
/** star.y (0–100) → world y (~+6..-6, flipped to match screen orientation). */
export const WORLD_Y_SCALE = -0.12;
/** star.z (-260..+60) → world z (~-13..+3) — broad depth so perspective parallax actually reads. */
export const WORLD_Z_SCALE = 0.05;

export function starWorldPosition(star: StarMark): Vec3 {
  return {
    x: (star.x - 50) * WORLD_X_SCALE,
    y: (star.y - 50) * WORLD_Y_SCALE,
    z: star.z * WORLD_Z_SCALE,
  };
}

/**
 * When a focus is selected, the partner star compresses to a fixed offset
 * near the focus so the pair frames cleanly without depending on the
 * partner's natural field position.
 */
export function pairPartnerPosition(focus: StarMark): Vec3 {
  const px = focus.x + 14;
  const py = focus.y + 2;
  return {
    x: (px - 50) * WORLD_X_SCALE,
    y: (py - 50) * WORLD_Y_SCALE,
    z: focus.z * WORLD_Z_SCALE,
  };
}

export function computeCameraTarget(state: LobbyState, focus: StarMark | undefined): CameraTarget {
  // Idle / callout-heavy keep DoF mild so focus-case stars scattered through
  // the field still read sharp — the player hasn't picked a target yet, so
  // there's nothing to bias the focus plane around.
  if (state === "idle" || state === "callout_heavy") {
    return { position: [0, 0, 17], lookAt: [0, 0, -1], bokehScale: 0.45 };
  }
  if (focus === undefined) {
    return { position: [0, 0, 17], lookAt: [0, 0, -1], bokehScale: 0.45 };
  }
  const fp = starWorldPosition(focus);
  if (state === "focus_selected") {
    return {
      position: [fp.x * 0.55, fp.y * 0.5, 10],
      lookAt: [fp.x * 0.9, fp.y * 0.9, fp.z + 0.2],
      bokehScale: 1.1,
    };
  }
  // partner_selected / committed_pair / scenario_chosen — frame the pair
  const anchorX = fp.x + 1.4;
  const anchorY = fp.y + 0.2;
  return {
    position: [anchorX * 0.55, anchorY * 0.45, 6.5],
    lookAt: [anchorX * 0.85, anchorY * 0.8, fp.z + 0.3],
    bokehScale: 1.25,
  };
}

/**
 * Per-layer world Z position the camera dollies toward in the flythrough.
 * Layer 0 sits where the default idle camera does (z=17); each subsequent
 * layer punches forward in world Z so the active member slab is right under
 * the lens. Layer 3 (scenarios) lands at z=4 so the scenario card meshes
 * sitting at z ≈ -1 read as the foreground "wall" the player just zoomed up
 * against.
 */
export const FLYTHROUGH_CAMERA_Z: Record<FlythroughLayer, number> = {
  0: 17,
  1: 13,
  2: 9,
  3: 4,
};

/**
 * Per-layer world-Z plane each slab of stars lives on once flythrough is
 * active. Layer 0 (focus) is pulled WAY forward — these are the closest,
 * largest, brightest stars; the player landed here. Layer 1 (eligible) sits
 * a step behind layer 0. Layer 2 (off-tonight) sits another step behind.
 * Layer 3 doesn't carry stars — it's the scenarios layer. These are absolute
 * world-Z targets, not offsets, so the StarSprite useFrame can lerp toward
 * them regardless of the star's seeded natural Z. We add a small natural-Z
 * jitter back in the StarSprite so each layer slab still has a bit of inner
 * depth and the player can read parallax across stars within a layer.
 */
export const FLYTHROUGH_LAYER_Z: Record<StarFlythroughLayer, number> = {
  0: 6.0, // focus slab — pulled hard forward
  1: 1.0, // eligible slab
  2: -4.0, // off-tonight slab
};

/**
 * Camera framing for the flythrough. The base focus/partner framing still
 * drives lookAt + dolly inside the focus slab when the player has picked one;
 * for layers 1-3 we look down-axis (Z negative) so the slab the player is
 * traversing reads flat across the screen. Bokeh deepens slightly per layer
 * so the active slab feels punched into focus while the others feather away.
 *
 * The lookAt point sits ahead of the camera (further in -Z) so each layer
 * traversal feels like punching through the previous one rather than tilting
 * down at the field from above.
 */
export function computeFlythroughCameraTarget(
  layer: FlythroughLayer,
  focus: StarMark | undefined,
): CameraTarget {
  const z = FLYTHROUGH_CAMERA_Z[layer];
  // Bias toward focus star x/y on layer 0 so the framing leads with whichever
  // focus case the player most recently engaged — falls back to centered
  // framing when no focus is picked.
  const focusBias = layer === 0 && focus !== undefined ? starWorldPosition(focus) : null;
  const biasX = focusBias === null ? 0 : focusBias.x * 0.25;
  const biasY = focusBias === null ? 0 : focusBias.y * 0.25;

  // DoF target sits at the slab the camera is currently looking at, so the
  // active layer stays sharp under post.
  const slabZ = layer === 3 ? -1 : FLYTHROUGH_LAYER_Z[layer];

  // Bokeh deepens slightly as we punch through; layer 3 (scenarios) gets the
  // tightest framing so the cards read crisply.
  const bokeh = layer === 0 ? 0.45 : layer === 1 ? 0.75 : layer === 2 ? 0.95 : 0.6;

  return {
    position: [biasX, biasY, z],
    lookAt: [biasX, biasY * 0.6, slabZ - 1],
    bokehScale: bokeh,
  };
}

/**
 * Map a member-layer flythrough slab (0 / 1 / 2) onto its absolute world-Z
 * plane. Pure pass-through into the FLYTHROUGH_LAYER_Z record; exists as a
 * function so callers don't import the constant directly and so the math
 * stays in one place for tests + future extension.
 */
export function flythroughStarZ(layer: StarFlythroughLayer): number {
  return FLYTHROUGH_LAYER_Z[layer];
}

/**
 * Decide which member layer a star belongs to in the flythrough. Pure
 * function — takes the membership sets the lobby has already computed
 * (focused, eligible, ineligible) and returns 0/1/2. Returns 2 as the
 * fallback so any uncategorised member still has a layer rather than
 * disappearing.
 */
export function computeStarFlythroughLayer(
  memberId: string,
  {
    focusedIds,
    eligibleIds,
  }: { focusedIds: ReadonlySet<string>; eligibleIds: ReadonlySet<string> },
): StarFlythroughLayer {
  if (focusedIds.has(memberId)) return 0;
  if (eligibleIds.has(memberId)) return 1;
  return 2;
}

/**
 * Per-star opacity / scale multiplier driven by the active flythrough layer.
 * The active slab gets the full role intensity; non-active slabs get pushed
 * down so the eye reads the active layer as the foreground. Layer 3 (the
 * scenarios layer) recedes ALL member slabs so the scenario cards sit
 * clearly in front of a muted constellation backdrop.
 */
export function flythroughMemberSlabActivity(
  starLayer: StarFlythroughLayer,
  currentLayer: FlythroughLayer,
): { intensityMultiplier: number; scaleMultiplier: number } {
  if (currentLayer === 3) {
    // Scenarios layer — all member layers recede uniformly so the scenario
    // cards lead.
    return { intensityMultiplier: 0.35, scaleMultiplier: 0.85 };
  }
  if (starLayer === currentLayer) {
    return { intensityMultiplier: 1, scaleMultiplier: 1.15 };
  }
  // Off-axis member layers fade — closer-to-active fades less.
  const distance = Math.abs(starLayer - currentLayer);
  if (distance === 1) return { intensityMultiplier: 0.45, scaleMultiplier: 0.9 };
  return { intensityMultiplier: 0.22, scaleMultiplier: 0.78 };
}

/**
 * Advance the flythrough layer by one step in the given direction (1 = scroll
 * down / punch deeper, -1 = scroll up / come back out). Clamped to the 0..3
 * range so the player can't scroll past the scenarios layer or out the back
 * of the focus layer.
 */
export function advanceFlythroughLayer(
  current: FlythroughLayer,
  direction: 1 | -1,
): FlythroughLayer {
  const next = current + direction;
  if (next < 0) return 0;
  if (next > 3) return 3;
  // The arithmetic guarantees 0..3 — cast keeps the union narrow without
  // relying on type assertions.
  if (next === 0) return 0;
  if (next === 1) return 1;
  if (next === 2) return 2;
  return 3;
}

/**
 * Layered zoom Z offset. Once the player picks a focus, the foreground layer
 * (focus + partner + eligible candidates) pulls forward in world Z so it
 * lands sharper after the camera dolly; off-tonight / cooling / closed
 * members recede so they read as context behind the active layer. Stars lerp
 * into these offsets each frame via the StarSprite useFrame, so transitions
 * feel like depth re-layering rather than teleports.
 */
export function computeLayerZOffset(role: StarRole, state: LobbyState): number {
  if (state === "idle" || state === "callout_heavy") return 0;
  if (role === "focus" || role === "partner") return 1.4;
  if (role === "eligible") return 2.4;
  if (role === "ineligible_cooling") return -3;
  if (role === "ineligible_off_shift") return -5;
  if (role === "ineligible_closed") return -6;
  return -1.5;
}

export function roleForStar(
  star: StarMark,
  {
    state,
    focusId,
    partnerId,
    eligiblePartnerIds,
  }: {
    state: LobbyState;
    focusId: string | undefined;
    partnerId: string | undefined;
    eligiblePartnerIds: ReadonlySet<string>;
  },
): StarRole {
  if (state === "idle") {
    return star.availability === "ready" ? "dim" : availabilityRole(star.availability);
  }
  if (state === "callout_heavy") {
    return availabilityRole(star.availability);
  }
  if (focusId !== undefined && star.member.id === focusId) return "focus";
  if (partnerId !== undefined && star.member.id === partnerId) return "partner";
  if (state === "focus_selected") {
    if (eligiblePartnerIds.has(star.member.id) && star.availability === "ready") {
      return "eligible";
    }
    return availabilityRole(star.availability);
  }
  return "dim";
}

export function availabilityRole(availability: StarAvailability): StarRole {
  if (availability === "cooling") return "ineligible_cooling";
  if (availability === "off_shift") return "ineligible_off_shift";
  if (availability === "closed") return "ineligible_closed";
  return "dim";
}

export type StarSizing = {
  avatarRadius: number;
  haloRadius: number;
  sparkRadius: number;
  flareSize: number;
  scale: number;
};

export function sizeForStar3D(tier: StarTier, role: StarRole, state: LobbyState): StarSizing {
  if (role === "focus")
    return { avatarRadius: 0.62, haloRadius: 0.82, sparkRadius: 0.075, flareSize: 4.6, scale: 1 };
  if (role === "partner")
    return { avatarRadius: 0.52, haloRadius: 0.7, sparkRadius: 0.065, flareSize: 3.8, scale: 1 };
  if (role === "eligible")
    return { avatarRadius: 0.38, haloRadius: 0.5, sparkRadius: 0.05, flareSize: 2.2, scale: 1 };
  if (role === "ineligible_cooling")
    return { avatarRadius: 0.24, haloRadius: 0.3, sparkRadius: 0.03, flareSize: 1, scale: 1 };
  if (role === "ineligible_off_shift" || role === "ineligible_closed") {
    return { avatarRadius: 0.2, haloRadius: 0.26, sparkRadius: 0.025, flareSize: 1, scale: 1 };
  }
  if (state === "idle") {
    if (tier === "foreground")
      return { avatarRadius: 0.3, haloRadius: 0.38, sparkRadius: 0.045, flareSize: 1, scale: 1 };
    if (tier === "mid")
      return { avatarRadius: 0.19, haloRadius: 0.24, sparkRadius: 0.032, flareSize: 1, scale: 1 };
    return { avatarRadius: 0.11, haloRadius: 0.14, sparkRadius: 0.022, flareSize: 1, scale: 1 };
  }
  if (tier === "foreground")
    return { avatarRadius: 0.26, haloRadius: 0.32, sparkRadius: 0.04, flareSize: 1, scale: 1 };
  if (tier === "mid")
    return { avatarRadius: 0.17, haloRadius: 0.22, sparkRadius: 0.028, flareSize: 1, scale: 1 };
  return { avatarRadius: 0.11, haloRadius: 0.15, sparkRadius: 0.02, flareSize: 1, scale: 1 };
}

export function intensityForRole(role: StarRole, tier: StarTier, state: LobbyState): number {
  if (role === "focus" || role === "partner") return 1;
  if (role === "eligible") return 0.96;
  if (role === "ineligible_cooling") return 0.55;
  if (role === "ineligible_off_shift") return 0.38;
  if (role === "ineligible_closed") return 0.3;
  if (state === "idle") {
    if (tier === "foreground") return 0.82;
    if (tier === "mid") return 0.58;
    return 0.36;
  }
  if (tier === "foreground") return 0.62;
  if (tier === "mid") return 0.42;
  return 0.24;
}

export function ringColorForRole(
  role: StarRole,
  state: LobbyState,
  palette: PortraitPalette,
): string {
  if (role === "focus") return "#fb7185";
  if (role === "partner") return "#c4b5fd";
  if (role === "eligible") return palette.accent;
  if (role === "ineligible_cooling") return "#fecdd3";
  if (role === "ineligible_off_shift") return "#94a3b8";
  if (role === "ineligible_closed") return "#64748b";
  if (state === "idle") return "#ffe6c8";
  return "#ffeed0";
}

export function avatarSrcsetFor(id: string): { src: string; srcset: string } {
  const base = `/assets/portraits/${id}`;
  return {
    src: `${base}/avatar-256.png`,
    srcset: `${base}/avatar-128.png 128w, ${base}/avatar-256.png 256w, ${base}/avatar-512.png 512w`,
  };
}

export function withAlpha(color: string, alpha: number): string {
  const channels = color.match(/\d+(?:\.\d+)?/g);
  if (channels !== null && color.startsWith("rgba") && channels.length === 4) {
    return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
  }
  if (channels !== null && color.startsWith("rgb") && channels.length >= 3) {
    return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
  }
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

/**
 * Halo tint preference. Active roles keep the rose/violet pair colors so the
 * player can read focus vs partner at a glance; everyone else picks up the
 * per-member aura color (or palette accent fallback) so the field reads as
 * a constellation of differently-glowing stars instead of a uniform warm wash.
 */
export function haloColorForStar(
  role: StarRole,
  palette: PortraitPalette,
  aura: MemberAuraConfig | undefined,
): string {
  if (role === "focus") return "#fb7185";
  if (role === "partner") return "#c4b5fd";
  if (aura !== undefined) return aura.tint.primary;
  return palette.accent;
}
