/**
 * Shared types for the constellation lobby. Both the R&D spike route and the
 * production lobby in CupidShell speak this vocabulary. Members are stars,
 * stars carry tier + availability + role, scenarios carry venue + axes +
 * room-read. The state machine name is "LobbyState" because it spans more
 * than the spike — focus → partner → committed → scenario → begin.
 */

import type { ThreeEvent } from "@react-three/fiber";

import type { Member } from "../../domain/game";
import type { PortraitPalette } from "../portrait-palette";
import type { MemberAuraConfig } from "../member-aura-registry";

export type LobbyState =
  | "idle"
  | "focus_selected"
  | "partner_selected"
  | "committed_pair"
  | "scenario_chosen"
  | "callout_heavy";

export type StarTier = "background" | "mid" | "foreground";

export type StarAvailability = "ready" | "cooling" | "off_shift" | "closed";

export type StarRole =
  | "focus"
  | "partner"
  | "eligible"
  | "ineligible_cooling"
  | "ineligible_off_shift"
  | "ineligible_closed"
  | "dim";

export type StarMark = {
  member: Member;
  palette: PortraitPalette;
  aura: MemberAuraConfig | undefined;
  /** 0-100 layout x in field space, before world scaling. */
  x: number;
  /** 0-100 layout y in field space, before world scaling. */
  y: number;
  /** Signed Z depth in field space (~-260..+60), before world scaling. */
  z: number;
  tier: StarTier;
  availability: StarAvailability;
  /** Per-star phase offset for the idle drift sin functions. */
  phase: number;
};

export type LobbyScenario = {
  id: string;
  title: string;
  venue: string;
  cost: number;
  axes: { risk: number; intimacy: number; chaos: number };
  roomRead: "steady" | "promising" | "volatile";
  flow: "conversation" | "activity" | "pressure" | "set_piece";
};

export type CameraTarget = {
  position: [number, number, number];
  lookAt: [number, number, number];
  /** EffectComposer DepthOfField bokeh scale for this framing. */
  bokehScale: number;
};

/**
 * Discrete depth layer the player has scrolled into. 0 = focus cases pulled
 * forward, 1 = eligible partners on the roster slab, 2 = off-tonight members
 * on the same roster slab, 3 = the scenarios layer where date plans render as
 * 3D card meshes inside the canvas, 4 = the pair graph once relationship
 * records exist.
 */
export type FlythroughLayer = 0 | 1 | 2 | 3 | 4;

export const FOCUS_FLYTHROUGH_LAYER: FlythroughLayer = 0;
export const ELIGIBLE_ROSTER_FLYTHROUGH_LAYER: FlythroughLayer = 1;
export const OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER: FlythroughLayer = 2;
export const SCENARIO_FLYTHROUGH_LAYER: FlythroughLayer = 3;
export const PAIR_GRAPH_FLYTHROUGH_LAYER: FlythroughLayer = 4;
export const FLYTHROUGH_LAYERS: readonly FlythroughLayer[] = [
  FOCUS_FLYTHROUGH_LAYER,
  ELIGIBLE_ROSTER_FLYTHROUGH_LAYER,
  OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER,
  PAIR_GRAPH_FLYTHROUGH_LAYER,
  SCENARIO_FLYTHROUGH_LAYER,
];

/**
 * Which slab a given star belongs to in the flythrough. Stars only live on
 * one of two visual slabs — focus or roster. The eligibles vs off-tonight
 * split is exposed as separate flythrough layers, but both layers render this
 * same roster slab with different active cohorts.
 */
export type StarFlythroughLayer = 0 | 1;

/**
 * On the roster layers (FlythroughLayer 1 / 2), the player can flip which
 * cohort the field highlights. "eligibles" frames tonight's available
 * partners; "off_tonight" frames members on rest. The inactive cohort recedes
 * so the chosen one leads the eye.
 */
export type RosterSubview = "eligibles" | "off_tonight";

export function isRosterFlythroughLayer(
  layer: FlythroughLayer | undefined,
): layer is typeof ELIGIBLE_ROSTER_FLYTHROUGH_LAYER | typeof OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER {
  return (
    layer === ELIGIBLE_ROSTER_FLYTHROUGH_LAYER || layer === OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER
  );
}

export function rosterSubviewForFlythroughLayer(layer: FlythroughLayer): RosterSubview | undefined {
  if (layer === ELIGIBLE_ROSTER_FLYTHROUGH_LAYER) return "eligibles";
  if (layer === OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER) return "off_tonight";
  return undefined;
}

export function flythroughLayerForRosterSubview(subview: RosterSubview): FlythroughLayer {
  return subview === "eligibles"
    ? ELIGIBLE_ROSTER_FLYTHROUGH_LAYER
    : OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER;
}

/**
 * Top-level view mode for the constellation lobby. "tonight" is the
 * date-prep flythrough (focus picker → roster → cathedral). "archive" is
 * the pair-history view: stars re-flow into a graph layout and constellation
 * edges etch between pairs with filed notes. Orthogonal to LobbyState — a
 * player can be in archive mode regardless of focus/partner selection.
 */
export type ViewMode = "tonight" | "archive";

/**
 * What the player has selected inside archive mode. Edge selection drives
 * the side-rail PairDossierShard; star selection opens the CaseFilePanel
 * with incident edges highlighted in the field.
 */
export type ArchiveSelection =
  | { kind: "pair"; pairId: string }
  | { kind: "member"; memberId: string }
  | null;

export type StarClickHandlers = {
  onStarClick?: (star: StarMark, event: ThreeEvent<MouseEvent>) => void;
  onStarDoubleClick?: (star: StarMark, event: ThreeEvent<MouseEvent>) => void;
  /** Eligible partner ids for focus-selected hover affordances. */
  eligiblePartnerIds?: ReadonlySet<string>;
  /** Stars not in this set get extra dimming. Used by the lens filter. */
  filterMatchedIds?: ReadonlySet<string>;
  /**
   * Drops the current focus selection. When provided AND this is the focus
   * star AND state === "focus_selected", the star renders an inline "Focus"
   * pill with an X dismiss button so the player can swap without leaving the
   * field for the side rail.
   */
  onClearFocus?: () => void;
};

export type Vec3 = { x: number; y: number; z: number };
