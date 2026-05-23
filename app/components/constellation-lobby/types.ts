/**
 * Shared types for the constellation lobby. Both the R&D spike route and the
 * production lobby in CupidShell speak this vocabulary. Members are stars,
 * stars carry tier + availability + role, scenarios carry venue + axes +
 * room-read. The state machine name is "LobbyState" because it spans more
 * than the spike — focus → partner → committed → scenario → begin.
 */

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
  /** 0–100 layout x in field space, before world scaling. */
  x: number;
  /** 0–100 layout y in field space, before world scaling. */
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
};

export type CameraTarget = {
  position: [number, number, number];
  lookAt: [number, number, number];
  /** EffectComposer DepthOfField bokeh scale for this framing. */
  bokehScale: number;
};

/**
 * Discrete depth layer the player has scrolled into. Scrolling down advances
 * the layer 0 → 1 → 2 → 3 (clamped). Each layer corresponds to a depth slab
 * the player is currently traversing — 0 = focus cases pulled forward, 1 =
 * tonight's eligible partners, 2 = off-tonight members, 3 = the scenarios
 * layer where date plans render as 3D card meshes inside the canvas.
 */
export type FlythroughLayer = 0 | 1 | 2 | 3;

/**
 * Which layer a given star belongs to in the flythrough. Stars only live on
 * one of the three member layers; `none` means the star is not a roster
 * star at all (today: not used, but reserved for future non-member meshes
 * that might float between layers).
 */
export type StarFlythroughLayer = 0 | 1 | 2;

export type Vec3 = { x: number; y: number; z: number };
