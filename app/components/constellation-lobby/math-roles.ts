/**
 * Role / availability / cohort resolution and layer arithmetic. Pure
 * helpers — no React, no Three runtime state.
 */

import type {
  FlythroughLayer,
  LobbyState,
  RosterSubview,
  StarAvailability,
  StarFlythroughLayer,
  StarMark,
  StarRole,
} from "./types";
import { FLYTHROUGH_LAYERS, isRosterFlythroughLayer, SCENARIO_FLYTHROUGH_LAYER } from "./types";

/**
 * Cohort within the roster slab. Stars on the roster slab still belong to
 * one of three groups (eligible / off_tonight / other_ineligible — the last
 * for cooling and closed); the active roster flythrough layer picks which
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
  if (currentLayer === SCENARIO_FLYTHROUGH_LAYER) {
    // Cathedral layer — stars vanish entirely so the door array reads as
    // its own room. Scale collapses to 0.55 so any half-faded sprites
    // mid-transition recede into the distance instead of staying at full
    // size while their opacity falls.
    return { intensityMultiplier: 0, scaleMultiplier: 0.55 };
  }
  const activeStarLayer: StarFlythroughLayer = isRosterFlythroughLayer(currentLayer)
    ? 1
    : currentLayer;
  if (starLayer !== activeStarLayer) {
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
  if (isRosterFlythroughLayer(currentLayer)) {
    // Roster slab. Leads (the cohort the player has the pill on) get a hero
    // size + full brightness so the pickable faces dominate the canvas. The
    // off cohort and other ineligibles drop to faint outline stars — visible
    // enough to keep the constellation feel, but dim enough that they don't
    // compete with the cluster for attention.
    const leads = rosterSubview === "eligibles" ? cohort === "eligible" : cohort === "off_tonight";
    if (leads) return { intensityMultiplier: 1.1, scaleMultiplier: 2.6 };
    if (cohort === "other_ineligible") {
      return { intensityMultiplier: 0.12, scaleMultiplier: 0.85 };
    }
    return { intensityMultiplier: 0.18, scaleMultiplier: 1.0 };
  }
  return { intensityMultiplier: 1, scaleMultiplier: 1.15 };
}

export function advanceFlythroughLayer(
  current: FlythroughLayer,
  direction: 1 | -1,
  layers: readonly FlythroughLayer[] = FLYTHROUGH_LAYERS,
): FlythroughLayer {
  const currentIndex = layers.indexOf(current);
  if (currentIndex === -1) return layers[0] ?? current;
  const nextIndex = Math.max(0, Math.min(layers.length - 1, currentIndex + direction));
  return layers[nextIndex] ?? current;
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
