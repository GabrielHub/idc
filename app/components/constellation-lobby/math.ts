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
  RosterSubview,
  StarAvailability,
  StarFlythroughLayer,
  StarMark,
  StarRole,
  StarTier,
  Vec3,
} from "./types";
import type { PortraitPalette } from "../portrait-palette";
import type { MemberAuraConfig } from "../member-aura-registry";

/** star.x (0-100) -> world x (~-11..+11). */
export const WORLD_X_SCALE = 0.22;
/** star.y (0-100) -> world y (~+6..-6, flipped to match screen orientation). */
export const WORLD_Y_SCALE = -0.12;
/** star.z (-260..+60) -> world z (~-13..+3) — broad depth so perspective parallax actually reads. */
export const WORLD_Z_SCALE = 0.05;

export function starWorldPosition(star: StarMark): Vec3 {
  return {
    x: (star.x - 50) * WORLD_X_SCALE,
    y: (star.y - 50) * WORLD_Y_SCALE,
    z: star.z * WORLD_Z_SCALE,
  };
}

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
 * Layer 0 sits where the default idle camera does (z=17); layer 1 punches
 * forward so the roster slab is right under the lens. Layer 2 (scenarios)
 * lands at z=4 so the scenario card meshes sitting at z ≈ -1 read as the
 * foreground "wall" the player just zoomed up against.
 */
export const FLYTHROUGH_CAMERA_Z: Record<FlythroughLayer, number> = {
  0: 17,
  1: 11,
  2: 4,
};

/**
 * Per-slab world-Z plane each cohort of stars lives on once flythrough is
 * active. Slab 0 (focus) is pulled forward; slab 1 (roster) sits behind.
 */
export const FLYTHROUGH_LAYER_Z: Record<StarFlythroughLayer, number> = {
  0: 6.0,
  1: -1.5,
};

/**
 * Focus-slab cluster layout. The 4 focused leads sit in a centered grid in
 * front of the camera on layer 0 so the player reads them as the shift's
 * picker, instead of scattered across the field. Single member centers,
 * two sit side-by-side, three or four arrange in a 2x2 grid (third lands in
 * the bottom-left slot when total is 3). All share the focus slab's Z plane.
 */
const FOCUS_CLUSTER_SPACING_X = 5.2;
const FOCUS_CLUSTER_SPACING_Y = 3.6;

export function focusClusterPosition(index: number, total: number): Vec3 {
  if (total <= 0) return { x: 0, y: 0, z: 0 };
  const clamped = Math.max(0, Math.min(index, total - 1));
  if (total === 1) return { x: 0, y: 0, z: 0 };
  if (total === 2) {
    return { x: (clamped - 0.5) * FOCUS_CLUSTER_SPACING_X, y: 0, z: 0 };
  }
  const col = clamped % 2;
  const row = Math.floor(clamped / 2);
  return {
    x: (col - 0.5) * FOCUS_CLUSTER_SPACING_X,
    y: (0.5 - row) * FOCUS_CLUSTER_SPACING_Y,
    z: 0,
  };
}

/**
 * Camera target for archive mode. Idle reads as a pulled-back overhead of
 * the whole constellation field so every star + edge is in frame at once.
 * When a selection bisects two stars (pair edge selected), the camera dollies
 * forward to bracket the chosen edge. When a single star is selected, the
 * camera bias-tracks that star at archive depth so its incident edges stay
 * in view (slightly farther back than the tonight-mode focus dolly).
 */
export const ARCHIVE_CAMERA_Z = 22;

export function computeArchiveCameraTarget(input: {
  pairMidpoint?: Vec3;
  focusedStar?: Vec3;
}): CameraTarget {
  if (input.pairMidpoint !== undefined) {
    const mid = input.pairMidpoint;
    return {
      position: [mid.x * 0.55, mid.y * 0.55, 14],
      lookAt: [mid.x, mid.y, mid.z],
      bokehScale: 0.9,
    };
  }
  if (input.focusedStar !== undefined) {
    const star = input.focusedStar;
    return {
      position: [star.x * 0.45, star.y * 0.45, 16],
      lookAt: [star.x * 0.8, star.y * 0.8, star.z],
      bokehScale: 0.7,
    };
  }
  return { position: [0, 0, ARCHIVE_CAMERA_Z], lookAt: [0, 0, 0], bokehScale: 0.45 };
}

export function computeFlythroughCameraTarget(
  layer: FlythroughLayer,
  focus: StarMark | undefined,
): CameraTarget {
  const z = FLYTHROUGH_CAMERA_Z[layer];
  const focusBias = layer === 0 && focus !== undefined ? starWorldPosition(focus) : null;
  const biasX = focusBias === null ? 0 : focusBias.x * 0.25;
  const biasY = focusBias === null ? 0 : focusBias.y * 0.25;

  const slabZ = layer === 2 ? -1 : FLYTHROUGH_LAYER_Z[layer];
  const bokeh = layer === 0 ? 0.45 : layer === 1 ? 0.85 : 0.6;

  return {
    position: [biasX, biasY, z],
    lookAt: [biasX, biasY * 0.6, slabZ - 1],
    bokehScale: bokeh,
  };
}

export function flythroughStarZ(layer: StarFlythroughLayer): number {
  return FLYTHROUGH_LAYER_Z[layer];
}

/**
 * Decide which slab a star belongs to in the flythrough. Focused -> 0,
 * everyone else -> 1. The eligibles vs off-tonight distinction is a per-star
 * cohort within the roster slab, not a separate slab.
 */
export function computeStarFlythroughLayer(
  memberId: string,
  { focusedIds }: { focusedIds: ReadonlySet<string> },
): StarFlythroughLayer {
  if (focusedIds.has(memberId)) return 0;
  return 1;
}

/**
 * Cohort within the roster slab. Stars on the roster slab still belong to
 * one of three groups (eligible / off_tonight / other_ineligible — the last
 * for cooling and closed); the layer-1 RosterSubview toggle picks which
 * group leads the eye.
 */
export type RosterCohort = "eligible" | "off_tonight" | "other_ineligible";

export function computeRosterCohort(
  memberId: string,
  {
    eligibleIds,
    offTonightIds,
  }: { eligibleIds: ReadonlySet<string>; offTonightIds: ReadonlySet<string> },
): RosterCohort {
  if (eligibleIds.has(memberId)) return "eligible";
  if (offTonightIds.has(memberId)) return "off_tonight";
  return "other_ineligible";
}

/**
 * Per-star opacity / scale multiplier driven by the active flythrough layer
 * and (on the roster slab) the active roster subview.
 */
export function flythroughMemberSlabActivity(
  starLayer: StarFlythroughLayer,
  currentLayer: FlythroughLayer,
  cohort?: RosterCohort,
  rosterSubview: RosterSubview = "eligibles",
): { intensityMultiplier: number; scaleMultiplier: number } {
  if (currentLayer === 2) {
    // Cathedral layer — stars vanish entirely so the door array reads as
    // its own room. Scale collapses to 0.55 so any half-faded sprites
    // mid-transition recede into the distance instead of staying at full
    // size while their opacity falls.
    return { intensityMultiplier: 0, scaleMultiplier: 0.55 };
  }
  if (starLayer !== currentLayer) {
    // Off-axis slab — the layer the player isn't on is entirely culled so
    // each layer reads as its own room. Scale collapses so any in-flight
    // transition reads as a pull-back rather than a fade-against-field.
    return { intensityMultiplier: 0, scaleMultiplier: 0.6 };
  }
  if (currentLayer === 0) {
    // Focus picker — the 4 focused leads sit in a centered cluster. Scale is
    // large enough that each avatar reads as a hero card but doesn't fill the
    // screen; the cluster position override in StarSprite drives the layout.
    return { intensityMultiplier: 1, scaleMultiplier: 2.5 };
  }
  if (currentLayer === 1) {
    // Roster slab — avatars need to read as portraits, not as a sea of small
    // sparkles. Leads are pulled forward at hero-card sizes; the inactive
    // cohort and other ineligibles still get readable sizes so the slab
    // reads as a real roster, not background noise.
    const leads = rosterSubview === "eligibles" ? cohort === "eligible" : cohort === "off_tonight";
    if (leads) return { intensityMultiplier: 1.05, scaleMultiplier: 2.4 };
    if (cohort === "other_ineligible") {
      return { intensityMultiplier: 0.32, scaleMultiplier: 1.4 };
    }
    return { intensityMultiplier: 0.45, scaleMultiplier: 1.6 };
  }
  return { intensityMultiplier: 1, scaleMultiplier: 1.15 };
}

export function advanceFlythroughLayer(
  current: FlythroughLayer,
  direction: 1 | -1,
): FlythroughLayer {
  const next = current + direction;
  if (next < 0) return 0;
  if (next > 2) return 2;
  if (next === 0) return 0;
  if (next === 1) return 1;
  return 2;
}

export function flythroughLayerDirectionFromKey(code: string): 1 | -1 | null {
  if (code === "KeyD" || code === "ArrowDown") return 1;
  if (code === "KeyA" || code === "ArrowUp") return -1;
  return null;
}

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
