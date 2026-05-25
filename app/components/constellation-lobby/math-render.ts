/**
 * Per-role sizing, intensity, ring/halo colors, and avatar URL helpers used
 * by the star sprite renderer. Pure helpers — no React, no Three runtime state.
 */

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

/**
 * Floor for the invisible hit plane so background pinhead dots stay grabbable.
 * Capped just under half of the minimum world-space distance between adjacent
 * background dots (FIELD_BG_TO_BG_SPACING=4 × WORLD_Y_SCALE=0.12 ≈ 0.48), so
 * neighbouring hit planes don't overlap and steal each other's pointer events.
 */
const MIN_STAR_HIT_RADIUS = 0.22;

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

export function resolveStarPresentation({
  tier,
  role,
  clustered,
  hovered,
  slabActivity,
  baseIntensity,
  filteredOut,
  avatarRadius,
}: {
  tier: StarTier;
  role: StarRole;
  clustered: boolean;
  hovered: boolean;
  slabActivity: StarSlabActivity | undefined;
  baseIntensity: number;
  filteredOut: boolean;
  avatarRadius: number;
}): StarPresentation {
  const forceAvatar = role === "focus" || role === "partner";
  const ineligibleRole =
    role === "ineligible_closed" ||
    role === "ineligible_off_shift" ||
    role === "ineligible_cooling";
  // Only generic "dim" members participate in the parallax background field.
  // Ineligible roles keep their normal slab treatment so their dim visual
  // contract (cooled-off, closed, off-shift) reads even on background tier.
  const parallaxBackground = tier === "background" && !clustered && !forceAvatar && role === "dim";
  const dormantDot = parallaxBackground && !hovered;
  const slabIntensity = parallaxBackground ? 1 : (slabActivity?.intensityMultiplier ?? 1);
  const slabScale = parallaxBackground ? 1 : (slabActivity?.scaleMultiplier ?? 1);
  // Hover promotes a star to full opacity so a dormant dot reveals as a crisp
  // portrait. Ineligible roles keep their dim floor on hover — full opacity
  // would erase the "unavailable" signal.
  const prominent = clustered || slabIntensity >= 0.9 || (hovered && !ineligibleRole);
  const fullAvatar = forceAvatar || clustered || (hovered && !ineligibleRole);
  const filterMultiplier = filteredOut ? 0.32 : 1;

  return {
    avatarOpacity: dormantDot
      ? 0
      : prominent
        ? filterMultiplier
        : baseIntensity * filterMultiplier * slabIntensity,
    avatarScale: dormantDot ? 0 : fullAvatar ? 1 : 0.38,
    hitRadius: Math.max(avatarRadius, MIN_STAR_HIT_RADIUS),
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
