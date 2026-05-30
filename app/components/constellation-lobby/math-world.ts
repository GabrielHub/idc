/**
 * World-space conversions, camera framing per state, slab Z planes, and
 * cluster layouts for the constellation lobby. Pure helpers — no React, no
 * Three runtime state.
 */

import { clamp } from "../../services/utils";
import type {
  CameraTarget,
  FlythroughLayer,
  LobbyState,
  RosterSubview,
  StarFlythroughLayer,
  StarMark,
  StarRole,
  Vec3,
} from "./types";
import { isRosterFlythroughLayer, SCENARIO_FLYTHROUGH_LAYER } from "./types";

/** star.x (0-100) -> world x (~-11..+11). */
export const WORLD_X_SCALE = 0.22;
/** star.y (0-100) -> world y (~+6..-6, flipped to match screen orientation). */
export const WORLD_Y_SCALE = -0.12;
/** star.z (-260..+60) -> world z (~-13..+3) — broad depth so perspective parallax actually reads. */
export const WORLD_Z_SCALE = 0.05;

/** Canvas FOV used by the constellation lobby perspective camera. */
export const CONSTELLATION_CAMERA_FOV = 38;

export type RosterClusterBounds = {
  maxWidth: number;
  maxHeight: number;
};

export type CanvasFrustumInput = {
  canvasWidth: number;
  canvasHeight: number;
  cameraZ: number;
  planeZ: number;
  fov?: number;
};

export type RosterClusterBoundsInput = CanvasFrustumInput & {
  avatarScale: number;
};

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

/**
 * Resolves the world position a star is actually rendered at — the lerp target
 * its `<StarSprite>` follows each frame. Anything anchored to the star (the
 * active HoverDetailCard mount, the pair connector endpoint, an overlay arrow)
 * should use this instead of `starWorldPosition` so it lands on the rendered
 * star instead of its raw field coordinates. Drift, lerp damping, and per-axis
 * jitter are visual-only and handled inside StarSprite — this returns the
 * static target.
 */
export function resolveStarRenderTarget(input: {
  natural: Vec3;
  overridePos: Vec3 | null;
  clusterPosition: Vec3 | null;
  flythroughLayer: StarFlythroughLayer | undefined;
  layerZOffset: number;
}): Vec3 {
  const { natural, overridePos, clusterPosition, flythroughLayer, layerZOffset } = input;
  const x = clusterPosition?.x ?? overridePos?.x ?? natural.x;
  const y = clusterPosition?.y ?? overridePos?.y ?? natural.y;
  const flythroughZ =
    flythroughLayer === undefined
      ? null
      : flythroughStarZ(flythroughLayer) + (clusterPosition === null ? natural.z * 0.18 : 0);
  const z = flythroughZ !== null ? flythroughZ : (overridePos?.z ?? natural.z) + layerZOffset;
  return { x, y, z };
}

/**
 * Per-layer world Z position the camera dollies toward in the flythrough.
 * Layer 0 sits where the default idle camera does (z=17); layers 1 and 2
 * punch forward so the two roster cohorts sit under the lens, but stay far
 * enough back that the fitted roster cluster keeps portrait halos in frame.
 * Layer 3
 * (scenarios) lands at z=4 so the scenario card meshes sitting at z ≈ -1
 * read as the foreground "wall" the player just zoomed up against.
 */
export const FLYTHROUGH_CAMERA_Z: Record<FlythroughLayer, number> = {
  0: 17,
  1: 14,
  2: 13.6,
  3: 4,
  4: 22,
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

function focusClusterPosition(index: number, total: number): Vec3 {
  if (total <= 1) return { x: 0, y: 0, z: 0 };
  const clamped = Math.max(0, Math.min(index, total - 1));
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
 * Pinned focus marker position when state === "focus_selected" and the
 * player is on the eligibles roster layer. Sits at world center so the
 * eligible-partner ring (see `partnerRingPosition`) wraps around it as its
 * own gravity well. Only used on the eligibles subview — on off-tonight the
 * focus star has no functional anchor (the player is browsing who is
 * unavailable, not picking from them), so the star falls through to the
 * off-axis slab cull and disappears. The z is overwritten by the slab-z
 * lookup in resolveStarRenderTarget — it lives on the focus slab (z ≈ 6) at
 * runtime, so the value here is a placeholder.
 */
export const FOCUS_MARKER_POSITION: Vec3 = { x: 0, y: 0, z: 0 };

/**
 * Scale multiplier applied to the focus star when it's pinned to the
 * focus marker slot. Reads as the center of gravity (perspective puts it
 * forward of the partner slab too) without dominating the canvas — partners
 * need room to orbit and the Focus chip needs to clear the partner halos.
 */
export const FOCUS_MARKER_SCALE = 1;

/**
 * Single dispatcher for a star's tonight-mode cluster slot. Returns the
 * focus marker pin when the focus star is parked on a roster layer, the
 * layer-0 focus cluster slot for a focused lead currently on layer 0, the
 * roster cluster slot for an eligible/off-tonight lead currently on a roster
 * layer, or `null` to fall back to the star's natural field position.
 *
 * When state === "focus_selected" AND the player is in the "eligibles"
 * subview, eligible partners arrange in a bounded orbit around the centered
 * focus marker (`partnerRingPosition`). The orbit still uses canvas-derived
 * bounds, but the selected focus remains the visual gravity well instead of
 * being swallowed by the roster grid.
 *
 * Archive mode bypasses clustering entirely — callers pass `inArchive` so
 * the helper can short-circuit instead of every callsite re-checking.
 */
export function resolveClusterPosition(input: {
  memberId: string;
  role: StarRole;
  state: LobbyState;
  flythroughLayer: StarFlythroughLayer | undefined;
  currentLayer: FlythroughLayer | undefined;
  focusOrder: readonly string[];
  rosterLeadOrder: readonly string[];
  rosterClusterBounds?: RosterClusterBounds;
  partnerRingBounds?: RosterClusterBounds;
  inArchive?: boolean;
  rosterSubview?: RosterSubview;
}): Vec3 | null {
  const {
    memberId,
    role,
    state,
    flythroughLayer,
    currentLayer,
    focusOrder,
    rosterLeadOrder,
    rosterClusterBounds,
    partnerRingBounds,
    inArchive = false,
    rosterSubview = "eligibles",
  } = input;
  if (inArchive) return null;
  if (
    role === "focus" &&
    state === "focus_selected" &&
    isRosterFlythroughLayer(currentLayer) &&
    rosterSubview === "eligibles"
  ) {
    return FOCUS_MARKER_POSITION;
  }
  if (flythroughLayer === 0 && currentLayer === 0 && focusOrder.length > 0) {
    const idx = focusOrder.indexOf(memberId);
    if (idx >= 0) return focusClusterPosition(idx, focusOrder.length);
  }
  if (
    flythroughLayer === 1 &&
    isRosterFlythroughLayer(currentLayer) &&
    rosterLeadOrder.length > 0
  ) {
    const idx = rosterLeadOrder.indexOf(memberId);
    if (idx >= 0) {
      const useRing = state === "focus_selected" && rosterSubview === "eligibles";
      return useRing && shouldUsePartnerRingLayout(rosterLeadOrder.length)
        ? partnerRingPosition(idx, rosterLeadOrder.length, partnerRingBounds ?? rosterClusterBounds)
        : rosterClusterPosition(idx, rosterLeadOrder.length, rosterClusterBounds);
    }
  }
  return null;
}

/**
 * Radial ring layout for eligible partners orbiting the focused member.
 * The focus pins at (0, 0); partners arrange at equal angles on a responsive
 * ellipse around it, starting at the top (-π/2) and walking clockwise so the
 * visual order matches the deterministic rosterLeadOrder iteration.
 *
 * The horizontal and vertical radii are constrained by canvas-derived bounds
 * (see `partnerRingBoundsForCanvas`) that are more generous than the
 * rectangular grid bounds — the orbit only touches its bounding ellipse at
 * discrete points, so it can breathe wider than a packed grid would.
 */
const PARTNER_RING_BASE_RADIUS_X = 5;
const PARTNER_RING_BASE_RADIUS_Y = 2.4;
const PARTNER_RING_PER_PARTNER_X = 0.22;
const PARTNER_RING_PER_PARTNER_Y = 0.1;
const PARTNER_RING_MAX_RADIUS_X = 8;
const PARTNER_RING_MAX_RADIUS_Y = 4;
const PARTNER_RING_SAFE_INSET_X = 0.6;
const PARTNER_RING_SAFE_INSET_Y = 0.2;

export function shouldUsePartnerRingLayout(total: number): boolean {
  return total > 1;
}

export function partnerRingPosition(
  index: number,
  total: number,
  bounds: RosterClusterBounds = DEFAULT_ROSTER_CLUSTER_BOUNDS,
): Vec3 {
  if (total <= 0) return { x: 0, y: 0, z: 0 };
  const clamped = Math.max(0, Math.min(index, total - 1));
  const maxRadiusX = Math.max(1.4, bounds.maxWidth / 2 - PARTNER_RING_SAFE_INSET_X);
  const maxRadiusY = Math.max(1.75, bounds.maxHeight / 2 - PARTNER_RING_SAFE_INSET_Y);
  const radiusX = Math.min(
    maxRadiusX,
    PARTNER_RING_MAX_RADIUS_X,
    PARTNER_RING_BASE_RADIUS_X + total * PARTNER_RING_PER_PARTNER_X,
  );
  const radiusY = Math.min(
    maxRadiusY,
    PARTNER_RING_MAX_RADIUS_Y,
    PARTNER_RING_BASE_RADIUS_Y + total * PARTNER_RING_PER_PARTNER_Y,
  );
  const angle = -Math.PI / 2 + (clamped / total) * Math.PI * 2;
  return {
    x: Math.cos(angle) * radiusX,
    y: Math.sin(angle) * -radiusY,
    z: 0,
  };
}

/**
 * Roster-slab cluster layout. The active subview's leads (eligibles when the
 * pill is on "Eligibles", off-tonight cohort when flipped) pack into a
 * viewport-fitting rectangular grid centered on the layer-1 lookAt so every
 * pickable face fits on screen at once instead of being scattered across the
 * field. Non-lead members keep their natural positions and recede behind the
 * cluster as outline-only background stars (handled by the heavy intensity
 * drop in `flythroughMemberSlabActivity` for the off cohort).
 *
 * The grid picker scores candidate row counts against the actual safe box
 * instead of using hard-coded roster buckets. That lets a 20-member off-duty
 * cohort use a wide, shallow formation on desktop canvases while still
 * compressing to narrower boxes without clipping. Row sizes are balanced and
 * centered so partial rows offset the columns instead of creating tall stacks.
 */
const ROSTER_CLUSTER_MAX_WIDTH = 11;
const ROSTER_CLUSTER_MAX_HEIGHT = 6;
const ROSTER_CLUSTER_DEFAULT_SPACING_X = 2.8;
const ROSTER_CLUSTER_DEFAULT_SPACING_Y = 2.5;
const ROSTER_CLUSTER_DESIRED_SPACING_X = 2.0;
const ROSTER_CLUSTER_DESIRED_SPACING_Y = 2.3;
const ROSTER_CLUSTER_MAX_ROWS = 6;
const DEFAULT_ROSTER_CLUSTER_BOUNDS: RosterClusterBounds = {
  maxWidth: ROSTER_CLUSTER_MAX_WIDTH,
  maxHeight: ROSTER_CLUSTER_MAX_HEIGHT,
};

export function visibleWorldSizeAtDepth({
  canvasWidth,
  canvasHeight,
  cameraZ,
  planeZ,
  fov = CONSTELLATION_CAMERA_FOV,
}: CanvasFrustumInput): { width: number; height: number; aspect: number } {
  const safeWidth = canvasWidth > 0 ? canvasWidth : 1920;
  const safeHeight = canvasHeight > 0 ? canvasHeight : 1080;
  const aspect = safeWidth / safeHeight;
  const distance = Math.max(0.1, Math.abs(cameraZ - planeZ));
  const halfHeight = Math.tan((fov * Math.PI) / 180 / 2) * distance;
  return {
    width: halfHeight * 2 * aspect,
    height: halfHeight * 2,
    aspect,
  };
}

export function rosterClusterBoundsForCanvas(input: RosterClusterBoundsInput): RosterClusterBounds {
  const visible = visibleWorldSizeAtDepth(input);
  const canvasScale = clamp(input.avatarScale, 0.72, 1.12);
  // Inset budget for halo bleed on the outermost members. Sized for the
  // shrunk avatars used in larger cohorts (see rosterLeadScaleMultiplier);
  // the earlier 2.2 figure was tuned for the hero-size focus picker and
  // left a lot of canvas unused once the cluster shrank.
  const avatarInset = 1.4 * canvasScale;
  const worldPackingScale = clamp(canvasScale, 0.8, 1.05);
  // Cluster spans ±maxWidth/2 around x=0 with each star adding ~avatarRadius
  // on its outward side, so the visible-width budget needs an inset on both
  // edges, not just one.
  const widthBudget = visible.width * 0.88 * worldPackingScale - avatarInset * 2;
  const heightBudget = visible.height * 0.95 * worldPackingScale - avatarInset * 2;
  return {
    maxWidth: clamp(widthBudget, 7.2, 14),
    maxHeight: clamp(heightBudget, 4.2, 8.5),
  };
}

/**
 * Canvas-aware bounds for the eligible partner orbit. The orbit only touches
 * its bounding ellipse at discrete partner slots (unlike the rectangular
 * grid that has to pack whole rows + columns inside), so it gets a more
 * generous slice of the visible area. Vertical headroom still leaves space
 * for the top roster pill and the bottom-right Shift Brief panel, and the
 * avatar inset stays moderate so smaller-scaled partner avatars don't waste
 * the canvas they fit inside.
 */
export function partnerRingBoundsForCanvas(input: RosterClusterBoundsInput): RosterClusterBounds {
  const visible = visibleWorldSizeAtDepth(input);
  const canvasScale = clamp(input.avatarScale, 0.72, 1.12);
  // Ring inset is tighter than the grid's because the orbit only places a
  // single partner near each edge (vs the grid packing whole rows), so less
  // halo-bleed margin is needed before partners crash into the canvas edge.
  const avatarInset = 1 * canvasScale;
  const widthBudget = visible.width * 0.88 - avatarInset * 2;
  const heightBudget = visible.height * 0.92 - avatarInset * 2;
  return {
    maxWidth: clamp(widthBudget, 8.4, 18),
    maxHeight: clamp(heightBudget, 4.8, 8.6),
  };
}

function pickRosterClusterGrid(
  total: number,
  bounds: RosterClusterBounds,
): { rows: number; cols: number } {
  if (total <= 3) return { rows: 1, cols: total };

  const maxWidth = Math.max(0, bounds.maxWidth);
  const maxHeight = Math.max(0, bounds.maxHeight);
  const maxRows = Math.min(total, ROSTER_CLUSTER_MAX_ROWS);
  let best = { rows: 2, cols: Math.ceil(total / 2), score: -Infinity };

  for (let rows = 2; rows <= maxRows; rows += 1) {
    const cols = Math.ceil(total / rows);
    const spacingX =
      cols > 1
        ? Math.min(ROSTER_CLUSTER_DEFAULT_SPACING_X, maxWidth / (cols - 1))
        : ROSTER_CLUSTER_DEFAULT_SPACING_X;
    const spacingY =
      rows > 1
        ? Math.min(ROSTER_CLUSTER_DEFAULT_SPACING_Y, maxHeight / (rows - 1))
        : ROSTER_CLUSTER_DEFAULT_SPACING_Y;
    const horizontalFit = spacingX / ROSTER_CLUSTER_DESIRED_SPACING_X;
    const verticalFit =
      rows > 1 ? spacingY / ROSTER_CLUSTER_DESIRED_SPACING_Y : Number.POSITIVE_INFINITY;
    const separationScore = Math.min(horizontalFit, verticalFit);
    const aspectScore = Math.min(horizontalFit, 1.2) + Math.min(verticalFit, 1.2);
    const rowPenalty = rows * 0.015;
    const score = separationScore * 4 + aspectScore - rowPenalty;
    if (score > best.score) {
      best = { rows, cols, score };
    }
  }

  return { rows: best.rows, cols: best.cols };
}

function rosterClusterRows(total: number, rows: number): readonly number[] {
  if (rows <= 0) return [];
  const base = Math.floor(total / rows);
  let remainder = total % rows;
  const counts = Array.from({ length: rows }, () => base);
  const order = Array.from({ length: rows }, (_, row) => ({
    row,
    distanceFromCenter: Math.abs(row - (rows - 1) / 2),
  })).sort((a, b) => b.distanceFromCenter - a.distanceFromCenter || a.row - b.row);

  for (const { row } of order) {
    if (remainder <= 0) break;
    counts[row] += 1;
    remainder -= 1;
  }
  return counts;
}

export function rosterClusterPosition(
  index: number,
  total: number,
  bounds: RosterClusterBounds = DEFAULT_ROSTER_CLUSTER_BOUNDS,
): Vec3 {
  if (total <= 1) return { x: 0, y: 0, z: 0 };
  const clamped = Math.max(0, Math.min(index, total - 1));

  const { rows, cols } = pickRosterClusterGrid(total, bounds);
  const rowCounts = rosterClusterRows(total, rows);
  const maxWidth = Math.max(0, bounds.maxWidth);
  const maxHeight = Math.max(0, bounds.maxHeight);
  const spacingX =
    cols > 1
      ? Math.min(ROSTER_CLUSTER_DEFAULT_SPACING_X, maxWidth / (cols - 1))
      : ROSTER_CLUSTER_DEFAULT_SPACING_X;
  const spacingY =
    rows > 1
      ? Math.min(ROSTER_CLUSTER_DEFAULT_SPACING_Y, maxHeight / (rows - 1))
      : ROSTER_CLUSTER_DEFAULT_SPACING_Y;

  let row = 0;
  let indexInRow = clamped;
  while (row < rowCounts.length && indexInRow >= (rowCounts[row] ?? 0)) {
    indexInRow -= rowCounts[row] ?? 0;
    row += 1;
  }
  const itemsInThisRow = rowCounts[row] ?? cols;
  const effectiveCol = indexInRow + (cols - itemsInThisRow) / 2;

  return {
    x: (effectiveCol - (cols - 1) / 2) * spacingX,
    y: ((rows - 1) / 2 - row) * spacingY,
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
const ARCHIVE_CAMERA_Z = 22;

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

// Canvas FOV (38°) mirrored from the lobby's <Canvas camera={fov: 38}/> config.
// A change there must also update this constant — the fit math depends on the
// matching vertical FOV so the bounding box fills the actual viewport.
const ARCHIVE_FIT_HALF_FOV_TAN = Math.tan((CONSTELLATION_CAMERA_FOV * Math.PI) / 180 / 2);
// Most desktop viewports are at least 16:9. We bias horizontal headroom to a
// slightly narrower assumption so portrait-ish browser windows don't crop the
// outer paired stars.
const ARCHIVE_FIT_ASPECT = 16 / 10;
const ARCHIVE_FIT_MIN_Z = 9;
// Slack baked around the bounding extent so the outermost stars never sit at
// the literal viewport edge. Higher = more breathing room, smaller stars.
const ARCHIVE_FIT_MARGIN = 1.55;

/**
 * Bounding-box-fit camera for archive mode's default (no-selection) view.
 * With fewer paired stars the camera dollies in until the bounding box of
 * their positions fills the viewport, so a single filed pair reads as a
 * close-up duo rather than two specks in a vast pulled-back field.
 *
 * Returns the pulled-back overhead when called with an empty position list —
 * callers that don't want that should gate on `positions.length` before
 * calling.
 */
export function computeArchiveFitCamera(positions: readonly Vec3[]): CameraTarget {
  if (positions.length === 0) {
    return { position: [0, 0, ARCHIVE_CAMERA_Z], lookAt: [0, 0, 0], bokehScale: 0.45 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const pos of positions) {
    if (pos.x < minX) minX = pos.x;
    if (pos.x > maxX) maxX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.y > maxY) maxY = pos.y;
  }
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  // Single-point or near-degenerate bbox (one paired member, or two in the
  // same slot) — floor the extent so we don't divide toward zero and end up
  // jammed inside the star.
  const halfWidth = Math.max((maxX - minX) / 2, 1.5);
  const halfHeight = Math.max((maxY - minY) / 2, 1.5);
  const zForY = (halfHeight * ARCHIVE_FIT_MARGIN) / ARCHIVE_FIT_HALF_FOV_TAN;
  const zForX = (halfWidth * ARCHIVE_FIT_MARGIN) / (ARCHIVE_FIT_HALF_FOV_TAN * ARCHIVE_FIT_ASPECT);
  const z = Math.max(ARCHIVE_FIT_MIN_Z, Math.min(ARCHIVE_CAMERA_Z, Math.max(zForY, zForX)));
  return {
    position: [centerX * 0.55, centerY * 0.55, z],
    lookAt: [centerX, centerY, 0],
    bokehScale: 0.45,
  };
}

// Ego framing wants a touch more breathing room than the bounding-box fit so
// the focus star's name pill, the ring of partners, and their spokes all clear
// the canvas edges. Floored a little closer than the fit camera so a single
// partner still reads as a deliberate duo rather than a distant speck.
const EGO_FIT_MARGIN = 1.78;
const EGO_FIT_MIN_Z = 11;

/**
 * Camera target for the archive ego view (a member is selected). Centers the
 * frame on the world origin where `archiveEgoLayout` pins the focused star, and
 * dollies back just far enough to bracket the partner ring with headroom for
 * the scene-anchored name pills.
 */
export function computeArchiveEgoCameraTarget(input: {
  ringRadiusX: number;
  ringRadiusY: number;
}): CameraTarget {
  const zForY = (input.ringRadiusY * EGO_FIT_MARGIN) / ARCHIVE_FIT_HALF_FOV_TAN;
  const zForX =
    (input.ringRadiusX * EGO_FIT_MARGIN) / (ARCHIVE_FIT_HALF_FOV_TAN * ARCHIVE_FIT_ASPECT);
  const z = Math.max(EGO_FIT_MIN_Z, Math.min(ARCHIVE_CAMERA_Z, Math.max(zForY, zForX)));
  return { position: [0, 0, z], lookAt: [0, 0, 0], bokehScale: 0.6 };
}

export function computeFlythroughCameraTarget(
  layer: FlythroughLayer,
  focus: StarMark | undefined,
): CameraTarget {
  const z = FLYTHROUGH_CAMERA_Z[layer];
  const focusBias = layer === 0 && focus !== undefined ? starWorldPosition(focus) : null;
  const biasX = focusBias === null ? 0 : focusBias.x * 0.25;
  const biasY = focusBias === null ? 0 : focusBias.y * 0.25;

  const slabZ =
    layer === SCENARIO_FLYTHROUGH_LAYER
      ? -1
      : isRosterFlythroughLayer(layer)
        ? FLYTHROUGH_LAYER_Z[1]
        : FLYTHROUGH_LAYER_Z[0];
  const bokeh = layer === 0 ? 0.45 : isRosterFlythroughLayer(layer) ? 0.85 : 0.6;

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
 * everyone else -> 1. The eligibles vs off-tonight distinction is exposed as
 * separate flythrough layers, but stars still render on the shared roster
 * slab.
 */
export function computeStarFlythroughLayer(
  memberId: string,
  { focusedIds }: { focusedIds: ReadonlySet<string> },
): StarFlythroughLayer {
  if (focusedIds.has(memberId)) return 0;
  return 1;
}
