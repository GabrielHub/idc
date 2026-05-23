/**
 * Pure helpers for the constellation lobby — world-space conversions, camera
 * framing per state, role/availability resolution, layered Z, per-role sizing
 * and intensity, and small text/color utilities. No React, no Three runtime
 * state, no closures over component state. Anything that needs `state` or
 * `role` takes them as args so the same helper works for spike and prod.
 */

import type {
  CameraTarget,
  LobbyState,
  StarAvailability,
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
  if (state === "idle" || state === "callout_heavy") {
    return { position: [0, 0, 17], lookAt: [0, 0, -1], bokehScale: 1.2 };
  }
  if (focus === undefined) {
    return { position: [0, 0, 17], lookAt: [0, 0, -1], bokehScale: 1.2 };
  }
  const fp = starWorldPosition(focus);
  if (state === "focus_selected") {
    return {
      position: [fp.x * 0.55, fp.y * 0.5, 10],
      lookAt: [fp.x * 0.9, fp.y * 0.9, fp.z + 0.2],
      bokehScale: 1.4,
    };
  }
  // partner_selected / committed_pair / scenario_chosen — frame the pair
  const anchorX = fp.x + 1.4;
  const anchorY = fp.y + 0.2;
  return {
    position: [anchorX * 0.55, anchorY * 0.45, 6.5],
    lookAt: [anchorX * 0.85, anchorY * 0.8, fp.z + 0.3],
    bokehScale: 1.5,
  };
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
 * Parses an `rgba(r, g, b, a)` / `rgb(r, g, b)` / `#rgb` / `#rrggbb` string
 * into normalized 0–1 RGB channels. Alpha is dropped — the rain-glow and
 * shimmer effects modulate brightness via additive blending, so per-vertex
 * alpha isn't needed (and additive is what makes them bloom through the
 * post-process pass). Returns a soft warm fallback for unparseable inputs so
 * no star ever renders pure-black rain.
 */
export function rgbChannelsFromColor(color: string): { r: number; g: number; b: number } {
  const channels = color.match(/\d+(?:\.\d+)?/g);
  if (
    channels !== null &&
    (color.startsWith("rgba") || color.startsWith("rgb")) &&
    channels.length >= 3
  ) {
    const r = Number.parseFloat(channels[0] ?? "255") / 255;
    const g = Number.parseFloat(channels[1] ?? "255") / 255;
    const b = Number.parseFloat(channels[2] ?? "255") / 255;
    return { r, g, b };
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
    const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
    const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
    const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
    return { r, g, b };
  }
  return { r: 1, g: 0.92, b: 0.78 };
}

/**
 * Per-star rain / glow tint. Focus and partner roles get the active-pair tints
 * so the player can read them from across the field; eligible candidates use
 * the member's aura-primary when present (so members with a registered aura
 * like vhool's violet runes or epsy's cyan pixel-rain carry that identity into
 * the lobby) and otherwise fall back to the portrait palette accent. Cooling
 * stars cool toward soft rose; off-shift / closed stars desaturate to a cool
 * blue-grey so they read as inactive without disappearing.
 */
export function rainColorForStar(
  role: StarRole,
  palette: PortraitPalette,
  aura: MemberAuraConfig | undefined,
): { r: number; g: number; b: number } {
  if (role === "focus") return rgbChannelsFromColor("#fb7185");
  if (role === "partner") return rgbChannelsFromColor("#c4b5fd");
  if (role === "eligible") {
    if (aura !== undefined) return rgbChannelsFromColor(aura.tint.primary);
    return rgbChannelsFromColor(palette.accent);
  }
  if (role === "ineligible_cooling") return rgbChannelsFromColor("#fda4af");
  if (role === "ineligible_off_shift" || role === "ineligible_closed") {
    return rgbChannelsFromColor("#94a3b8");
  }
  // Dim background stars still get a soft palette tint so each one carries a
  // hint of identity, just at low density and brightness.
  if (aura !== undefined) return rgbChannelsFromColor(aura.tint.primary);
  return rgbChannelsFromColor(palette.accent);
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

/**
 * Pixel-rain density per role and tier. Active roles cascade heavy data; the
 * eligible slate cascades moderately; ineligibles get the bare minimum so
 * they still read as "alive" without competing with the active pair. Counts
 * stay small (focus/partner = 14, eligible = 9, dim = 0-6) so the total
 * particle budget across 48 stars stays under ~300 — well inside what a
 * single per-star Points geometry can handle without dropping frames.
 */
export function rainDensityForStar(role: StarRole, tier: StarTier, state: LobbyState): number {
  if (role === "focus") return 22;
  if (role === "partner") return 18;
  if (role === "eligible") return 12;
  if (role === "ineligible_cooling") return 5;
  if (role === "ineligible_off_shift") return 2;
  if (role === "ineligible_closed") return 0;
  if (state === "idle") {
    if (tier === "foreground") return 8;
    if (tier === "mid") return 4;
    return 2;
  }
  if (tier === "foreground") return 5;
  if (tier === "mid") return 2;
  return 0;
}
