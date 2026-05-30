/**
 * Per-role sizing, intensity, ring/halo colors, and avatar URL helpers used
 * by the star sprite renderer. Pure helpers — no React, no Three runtime state.
 */

import { clamp } from "../../services/utils";
import type { LobbyState, StarRole, StarTier } from "./types";
import type { PortraitPalette } from "../portrait-palette";
import type { MemberAuraConfig } from "../member-aura-registry";

export type StarSizing = {
  avatarRadius: number;
  haloRadius: number;
  sparkRadius: number;
  flareSize: number;
  scale: number;
};

export type StarSlabActivity = {
  intensityMultiplier: number;
  scaleMultiplier: number;
};

export type StarPresentation = {
  avatarOpacity: number;
  avatarScale: number;
  hitRadius: number;
  slabIntensity: number;
  slabScale: number;
  zLift: number;
};

export type CanvasAvatarScaleInput = {
  width: number;
  height: number;
  dpr: number;
};

/**
 * Floor for the invisible hit plane so background pinhead dots stay grabbable.
 * Capped just under half of the minimum world-space distance between adjacent
 * background dots (FIELD_BG_TO_BG_SPACING=4 × WORLD_Y_SCALE=0.12 ≈ 0.48), so
 * neighbouring hit planes don't overlap and steal each other's pointer events.
 */
const MIN_STAR_HIT_RADIUS = 0.22;
const BACKGROUND_HOVER_AVATAR_SCALE = 1.85;
const ARCHIVE_AVATAR_SCALE_MAX = 1.52;
const ARCHIVE_AVATAR_SCALE_MIN = 0.88;
const ARCHIVE_AVATAR_FULL_SIZE_NODE_COUNT = 4;
const ARCHIVE_AVATAR_SCALE_STEP = 0.035;
const MIN_RESPONSIVE_AVATAR_SCALE = 0.72;
const MAX_RESPONSIVE_AVATAR_SCALE = 1.12;
const BASE_CANVAS_WIDTH = 1920;
const BASE_CANVAS_HEIGHT = 1080;

export function avatarScaleForCanvas({ width, height, dpr }: CanvasAvatarScaleInput): number {
  if (width <= 0 || height <= 0) return 1;
  const widthFit = width / BASE_CANVAS_WIDTH;
  const heightFit = height / BASE_CANVAS_HEIGHT;
  const shortSideFit = Math.sqrt(Math.min(widthFit, heightFit));
  const aspect = width / height;
  const narrowAspectPenalty = aspect < 1.45 ? clamp(aspect / 1.45, 0.82, 1) : 1;
  const lowDensityPenalty = dpr < 1.25 ? 0.98 : 1;
  return clamp(
    shortSideFit * narrowAspectPenalty * lowDensityPenalty,
    MIN_RESPONSIVE_AVATAR_SCALE,
    MAX_RESPONSIVE_AVATAR_SCALE,
  );
}

export function starHitRadiusFloorForCanvasScale(canvasScale: number): number {
  return clamp(MIN_STAR_HIT_RADIUS * canvasScale, 0.16, MIN_STAR_HIT_RADIUS);
}

export function archiveAvatarScaleForNodeCount(nodeCount: number): number {
  const wholeNodeCount = Math.max(0, Math.ceil(nodeCount));
  const extraNodes = Math.max(0, wholeNodeCount - ARCHIVE_AVATAR_FULL_SIZE_NODE_COUNT);
  return clamp(
    ARCHIVE_AVATAR_SCALE_MAX - extraNodes * ARCHIVE_AVATAR_SCALE_STEP,
    ARCHIVE_AVATAR_SCALE_MIN,
    ARCHIVE_AVATAR_SCALE_MAX,
  );
}

/** Base avatar disc radius (world units) for an archive-graph portrait, before
 *  canvas + node-count scaling. Mirrors the "eligible" branch of sizeForStar3D,
 *  which is the sizing role every forced archive avatar renders at. */
const ARCHIVE_AVATAR_BASE_RADIUS = 0.38;
/** Clear gap (world units) left between an edge endpoint and the disc it meets. */
const ARCHIVE_EDGE_ENDPOINT_GAP = 0.26;

/**
 * World-space distance an archive edge should stop short of each paired star so
 * the line meets the portrait disc's edge with a small, consistent gap instead
 * of stabbing into the face or floating off it. Tracks the live avatar size
 * (which shrinks as the graph grows) so the gap reads the same on a 2-pair board
 * and a 16-pair board. Consumed by PairEdgeMesh to trim its sampled bezier.
 */
export function archiveEdgeEndpointInset(nodeCount: number, canvasScale = 1): number {
  const scale = clamp(canvasScale, MIN_RESPONSIVE_AVATAR_SCALE, MAX_RESPONSIVE_AVATAR_SCALE);
  const avatarWorldRadius =
    ARCHIVE_AVATAR_BASE_RADIUS * scale * archiveAvatarScaleForNodeCount(nodeCount);
  return avatarWorldRadius + ARCHIVE_EDGE_ENDPOINT_GAP;
}

/**
 * World units that span one screen pixel for a perspective camera at a given
 * view-space depth (distance in front of the camera). Scene-anchored star UI
 * (name pill, quick-action rail, focus marker) multiplies a pixel length by
 * this to render at a constant on-screen size regardless of the star's depth
 * or world scale — the perspective foreshortening that otherwise crushes the
 * UI on deeper flythrough layers is cancelled out. Returns 0 for a degenerate
 * viewport / frustum so callers can guard before dividing.
 */
export function worldPerScreenPixel(
  viewDepth: number,
  tanHalfFov: number,
  viewportHeightPx: number,
): number {
  if (viewportHeightPx <= 0 || tanHalfFov <= 0) return 0;
  return (2 * Math.max(0.0001, viewDepth) * tanHalfFov) / viewportHeightPx;
}

function scaleStarSizing(sizing: StarSizing, canvasScale: number): StarSizing {
  return {
    avatarRadius: sizing.avatarRadius * canvasScale,
    haloRadius: sizing.haloRadius * canvasScale,
    sparkRadius: sizing.sparkRadius * canvasScale,
    flareSize: sizing.flareSize * canvasScale,
    scale: sizing.scale,
  };
}

export function sizeForStar3D(
  tier: StarTier,
  role: StarRole,
  state: LobbyState,
  canvasScale = 1,
): StarSizing {
  const scale = clamp(canvasScale, MIN_RESPONSIVE_AVATAR_SCALE, MAX_RESPONSIVE_AVATAR_SCALE);
  let sizing: StarSizing;
  if (role === "focus")
    sizing = { avatarRadius: 0.62, haloRadius: 0.82, sparkRadius: 0.075, flareSize: 4.6, scale: 1 };
  else if (role === "partner")
    sizing = { avatarRadius: 0.52, haloRadius: 0.7, sparkRadius: 0.065, flareSize: 3.8, scale: 1 };
  else if (role === "eligible")
    sizing = { avatarRadius: 0.38, haloRadius: 0.5, sparkRadius: 0.05, flareSize: 2.2, scale: 1 };
  else if (role === "ineligible_cooling")
    sizing = { avatarRadius: 0.24, haloRadius: 0.3, sparkRadius: 0.03, flareSize: 1, scale: 1 };
  else if (role === "ineligible_off_shift" || role === "ineligible_closed") {
    sizing = { avatarRadius: 0.2, haloRadius: 0.26, sparkRadius: 0.025, flareSize: 1, scale: 1 };
  } else if (state === "idle") {
    if (tier === "foreground")
      sizing = { avatarRadius: 0.3, haloRadius: 0.38, sparkRadius: 0.045, flareSize: 1, scale: 1 };
    else if (tier === "mid")
      sizing = { avatarRadius: 0.19, haloRadius: 0.24, sparkRadius: 0.032, flareSize: 1, scale: 1 };
    else
      sizing = { avatarRadius: 0.11, haloRadius: 0.14, sparkRadius: 0.022, flareSize: 1, scale: 1 };
  } else if (tier === "foreground")
    sizing = { avatarRadius: 0.26, haloRadius: 0.32, sparkRadius: 0.04, flareSize: 1, scale: 1 };
  else if (tier === "mid")
    sizing = { avatarRadius: 0.17, haloRadius: 0.22, sparkRadius: 0.028, flareSize: 1, scale: 1 };
  else sizing = { avatarRadius: 0.11, haloRadius: 0.15, sparkRadius: 0.02, flareSize: 1, scale: 1 };
  return scaleStarSizing(sizing, scale);
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

export function resolveStarPresentation({
  tier,
  role,
  clustered,
  hovered,
  slabActivity,
  baseIntensity,
  filteredOut,
  avatarRadius,
  forceAvatar = false,
  hitRadiusFloor = MIN_STAR_HIT_RADIUS,
}: {
  tier: StarTier;
  role: StarRole;
  clustered: boolean;
  hovered: boolean;
  slabActivity: StarSlabActivity | undefined;
  baseIntensity: number;
  filteredOut: boolean;
  avatarRadius: number;
  forceAvatar?: boolean;
  hitRadiusFloor?: number;
}): StarPresentation {
  const shouldForceAvatar = forceAvatar || role === "focus" || role === "partner";
  const ineligibleRole =
    role === "ineligible_closed" ||
    role === "ineligible_off_shift" ||
    role === "ineligible_cooling";
  // Only generic "dim" members participate in the parallax background field.
  // Ineligible roles keep their normal slab treatment so their dim visual
  // contract (cooled-off, closed, off-shift) reads even on background tier.
  const backgroundField = tier === "background" && !clustered && !shouldForceAvatar;
  const parallaxBackground = backgroundField && role === "dim";
  const dormantDot = parallaxBackground && !hovered;
  const backgroundHoverAvatar = backgroundField && hovered;
  const slabIntensity = parallaxBackground ? 1 : (slabActivity?.intensityMultiplier ?? 1);
  const slabScale = parallaxBackground ? 1 : (slabActivity?.scaleMultiplier ?? 1);
  // Hover promotes a star to full opacity so a dormant dot reveals as a crisp
  // portrait. Ineligible roles keep their dim floor on hover — full opacity
  // would erase the "unavailable" signal.
  const prominent =
    shouldForceAvatar || clustered || slabIntensity >= 0.9 || (hovered && !ineligibleRole);
  // Hover promotes the avatar subgroup to full size for every role — including
  // ineligible cooling / off-shift / closed members. The dim opacity, desat
  // color, and rim treatment still carry the unavailable cue; size only
  // gates *readability* of the quick-action rail that lives inside the
  // subgroup. Keeping the subgroup at 0.38 on hover crushes the rail to ~38%
  // of its normal footprint, making labels and tap targets unreadable.
  const fullAvatar = shouldForceAvatar || clustered || hovered;
  const filterMultiplier = filteredOut ? 0.32 : 1;
  // Hovered ineligible background stars get enlarged by BACKGROUND_HOVER_AVATAR_SCALE
  // but their base * slab opacity is ~5-7%, so the enlarged disc reads as a
  // barely-visible sliver. The color desaturation in star-sprite already
  // carries the "unavailable" cue, so floor the alpha at something legible
  // while still staying clearly below the active-state opacity.
  const INELIGIBLE_HOVER_OPACITY_FLOOR = 0.55;
  const dimMultiplier = baseIntensity * filterMultiplier * slabIntensity;

  return {
    avatarOpacity: dormantDot
      ? 0
      : prominent
        ? filterMultiplier
        : backgroundHoverAvatar
          ? Math.max(INELIGIBLE_HOVER_OPACITY_FLOOR * filterMultiplier, dimMultiplier)
          : dimMultiplier,
    avatarScale: dormantDot
      ? 0
      : backgroundHoverAvatar
        ? BACKGROUND_HOVER_AVATAR_SCALE
        : fullAvatar
          ? 1
          : 0.38,
    hitRadius: Math.max(
      backgroundHoverAvatar ? avatarRadius * BACKGROUND_HOVER_AVATAR_SCALE : avatarRadius,
      hitRadiusFloor,
    ),
    slabIntensity,
    slabScale,
    zLift: hovered && tier === "background" && !clustered ? 1.8 : 0,
  };
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

export type HaloRiskTone = "steady" | "cooling" | "at-risk";

const RISK_HALO_COLOR: Record<Exclude<HaloRiskTone, "steady">, string> = {
  cooling: "#f59e0b",
  "at-risk": "#f43f5e",
};

export function haloColorForStar(
  role: StarRole,
  palette: PortraitPalette,
  aura: MemberAuraConfig | undefined,
  riskTone: HaloRiskTone = "steady",
): string {
  // Risk owns the glow color so the canvas reads retention at a glance — the
  // warning tone wins even for the selected lead/partner. A steady member
  // keeps their role / aura / palette identity color (no alarm tint).
  if (riskTone !== "steady") return RISK_HALO_COLOR[riskTone];
  if (role === "focus") return "#fb7185";
  if (role === "partner") return "#c4b5fd";
  if (aura !== undefined) return withoutAlpha(aura.tint.primary);
  return palette.accent;
}

function withoutAlpha(color: string): string {
  const channels = color.match(/\d+(?:\.\d+)?/g);
  if (channels !== null && color.startsWith("rgba") && channels.length === 4) {
    return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
  }
  return color;
}
