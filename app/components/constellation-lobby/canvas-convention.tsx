/**
 * Shared canvas convention for the constellation lobby rewrite. This module
 * owns the 3D scene primitives and production-facing scene convention.
 * DOM HUD shards and morphing detail cards live in sibling modules.
 *
 * v6 direction (full 3D upgrade):
 *   - react-three-fiber Canvas replaces the CSS-3D stage
 *   - Volumetric backdrop: canvas-generated gradient + fog + warm bleed lights
 *   - PerspectiveCamera with damped lerp + cursor lead-ahead + per-state framing
 *   - Per-aura point lights illuminate focus / partner avatars
 *   - Postprocessing: Bloom + DepthOfField (auto-targets the focus pair) + Vignette
 *   - Per-star idle drift (subtle sin breathing, seeded phase per member)
 *   - Hover constellation lines: focus to hovered eligible partner
 *   - Star sprites: billboarded avatar planes with lit MeshStandardMaterial,
 *     additive halo behind, ring frame on top
 *   - HUD stays as HTML/Tailwind overlays. UI element reconsideration is the
 *     next spike pass — v6 focuses purely on the 3D scene language.
 *
 * Keep this biased toward R3F-only behavior; DOM overlays belong in narrower
 * sibling modules.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Billboard, Html, Line, useTexture } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { AnimatePresence } from "motion/react";

import { ParticleField } from "./particle-field";
import {
  advanceFlythroughLayer,
  computeLayerZOffset,
  computeRosterCohort,
  computeStarFlythroughLayer,
  flythroughLayerDirectionFromKey,
  flythroughMemberSlabActivity,
  FOCUS_MARKER_POSITION,
  FOCUS_MARKER_SCALE,
  haloColorForStar,
  intensityForRole,
  pairPartnerPosition,
  resolveClusterPosition,
  resolveStarRenderTarget,
  roleForStar,
  sizeForStar3D,
  starWorldPosition,
} from "./math";
import type {
  ArchiveSelection,
  CameraTarget,
  FlythroughLayer,
  LobbyState,
  RosterSubview,
  StarFlythroughLayer,
  StarMark,
  StarRole,
  Vec3,
  ViewMode,
} from "./types";
import type { PairBoardEdge } from "../pair-board-layout";
import type { PairEdgeRenderSpec } from "./archive-layout";
import { HoverDetailCard } from "./hover-detail-card";
import { FocusSelectionMarker } from "./focus-selection-marker";
import { PairEdgeMesh } from "./pair-edge-mesh";
import {
  buildBackdropTexture,
  buildFlareTexture,
  buildRimLightTexture,
  buildSoftSparkleTexture,
  featherAvatarShader,
} from "./textures";

const EMPTY_OFF_TONIGHT_IDS: ReadonlySet<string> = new Set();
const EMPTY_ELIGIBLE_PARTNER_IDS: ReadonlySet<string> = new Set();

// Types are shared with the production lobby — see
// app/components/constellation-lobby/types.ts. World-space scale constants
// and role/availability helpers live in ./math.

/* ============================================================================
 * 3D scene root. All R3F primitives live below this. We preload the avatar
 * textures once via Suspense, then hand them down to each StarSprite.
 * ========================================================================== */

/**
 * Optional render-prop the production lobby uses to inject a knowledge-gated
 * HoverDetailCard with real save state (focus handlers, swap penalty, sealed
 * counts). The spike falls back to a vanilla card when this prop is absent.
 */
export type RenderHoverCard = (args: { star: StarMark }) => ReactNode;

/**
 * Optional callbacks the production lobby uses to drive focus picking, swap
 * targeting, reselect-mode toggling, and case-file zoom from star pointer
 * events. The spike does not need any of these (it cycles state via the
 * production lobby controls).
 */
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

function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("input, textarea, select, [contenteditable='true']") !== null;
}

export function Scene({
  state,
  stars,
  focusStar,
  partnerStar,
  cameraTarget,
  showAuras,
  showParallax,
  reducedMotion,
  renderHoverCard,
  starClickHandlers,
  activeStarId = null,
  onActiveStarChange,
  currentLayer,
  onLayerChange,
  focusedIds,
  offTonightSet,
  rosterSubview,
  viewMode = "tonight",
  archiveData,
  archiveSelection = null,
  archiveIsolation,
  onArchiveEdgeHover,
  onArchiveEdgeClick,
  renderArchiveEdgeTooltip,
}: {
  state: LobbyState;
  stars: StarMark[];
  focusStar: StarMark | undefined;
  partnerStar: StarMark | undefined;
  cameraTarget: CameraTarget;
  showAuras: boolean;
  showParallax: boolean;
  reducedMotion: boolean;
  renderHoverCard?: RenderHoverCard;
  starClickHandlers?: StarClickHandlers;
  /**
   * View mode. "tonight" is the default flythrough lobby. "archive" flips
   * stars into a pair-graph layout and mounts constellation edges between
   * paired stars. The layer wheel/keyboard handler is disabled in archive
   * mode — layers belong to tonight's framing.
   */
  viewMode?: ViewMode;
  /**
   * Archive payload. Required when viewMode === "archive" to render edges
   * and reposition stars. `positions` maps every star's member id to its
   * archive world target; `edges` is the LOD-budgeted render spec list.
   */
  archiveData?: {
    positions: ReadonlyMap<string, Vec3>;
    edges: readonly PairEdgeRenderSpec[];
  };
  archiveSelection?: ArchiveSelection;
  /**
   * Isolation scope when a member is archive-selected. Stars whose ids fall
   * outside `includedMemberIds` get extra dimming; edges that don't touch
   * `focusMemberId` fade. Undefined means no isolation (full graph reads).
   */
  archiveIsolation?: {
    focusMemberId: string;
    includedMemberIds: ReadonlySet<string>;
  };
  onArchiveEdgeHover?: (pairId: string | null) => void;
  onArchiveEdgeClick?: (pairId: string) => void;
  /**
   * Optional drei-Html tooltip renderer mounted at a hovered edge's midpoint
   * when the LOD spec is in the near band. Returning null hides it.
   */
  renderArchiveEdgeTooltip?: (edge: PairBoardEdge) => ReactNode;
  /**
   * Controlled active-star id. The HoverDetailCard morphs out of the star
   * whose id matches this value. The consumer owns the state and sets it on
   * click; Esc, background click on the Canvas (`onPointerMissed`), a same-
   * star toggle, or a card action button all clear it.
   */
  activeStarId?: string | null;
  onActiveStarChange?: (id: string | null) => void;
  /**
   * Discrete depth slab the player has scrolled into. When provided, Scene
   * mounts a wheel handler that advances the layer per scroll tick instead
   * of the previous cycle-focus behavior, and overlays per-layer slab
   * activity (active layer pulled forward, others receded) on top of the
   * existing role-driven star treatment.
   */
  currentLayer?: FlythroughLayer;
  onLayerChange?: (next: FlythroughLayer) => void;
  /**
   * Member ids that live on the focus slab (slab 0). Everyone else lives on
   * the roster slab (slab 1); the eligible / off-tonight / other cohort
   * split is driven by `offTonightSet` and `rosterSubview` rather than a
   * separate slab. Required for the layer-flythrough overlay; when
   * undefined, the Scene falls back to no slab treatment.
   */
  focusedIds?: ReadonlySet<string>;
  /**
   * Member ids that are scheduled off-tonight. The roster slab uses this
   * (plus `eligiblePartnerIds` from starClickHandlers) to assign a per-star
   * cohort that the layer-1 RosterSubview toggle then spotlights.
   */
  offTonightSet?: ReadonlySet<string>;
  /**
   * Roster-slab subview the player has toggled to. Defaults to "eligibles"
   * — the eligible cohort leads the eye, off-tonight recedes; flipping to
   * "off_tonight" inverts that highlight.
   */
  rosterSubview?: RosterSubview;
}) {
  // Hover drives the visual hover bump on `StarSprite` and the eligible-
  // partner connector in `focus_selected`. It no longer opens the card —
  // that's `activeStarId`, which is click-set by the consumer.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Archive-mode hover state for the constellation edges. Drives the hover
  // halo on PairEdgeMesh and the midpoint Html tooltip mount.
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  // Set true while the pointer is over an in-scene HTML overlay (today, the
  // inline focus-pill that anchors to the focus star). The pill captures
  // pointer events, so the canvas's `state.pointer` freezes — leaving camera
  // parallax to lerp the world-anchored pill across the screen and produce a
  // shake feedback loop. Suppressing parallax while the overlay is hovered
  // breaks the loop. Idle sway is left alone so the field still feels alive.
  const [hudOverlayHovered, setHudOverlayHovered] = useState(false);
  useEffect(() => {
    // Reset if the pill unmounts under the cursor — pointer-leave won't fire
    // and the camera would stay frozen otherwise.
    if (state !== "focus_selected") setHudOverlayHovered(false);
  }, [state]);

  // Esc dismisses the active card. Both the spike route and the production
  // wrapper get this for free.
  useEffect(() => {
    if (onActiveStarChange === undefined) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onActiveStarChange(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onActiveStarChange]);

  // R&D debug hook: `?active=<memberId>` (or legacy `?hover=`) pins an open
  // card on mount so the morph can be verified without a real click. Opt-in;
  // only seeds initial state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (onActiveStarChange === undefined) return;
    const params = new URLSearchParams(window.location.search);
    const debugId = params.get("active") ?? params.get("hover");
    if (debugId !== null && debugId.length > 0) {
      onActiveStarChange(debugId);
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Layer-flythrough input handler. Wheel/trackpad and A/D/Up/Down all advance
  // `currentLayer` by one step, with the document scroll locked while this
  // scene owns layer navigation.
  const currentLayerRef = useRef<FlythroughLayer | undefined>(currentLayer);
  const lastLayerAdvanceRef = useRef(0);
  useEffect(() => {
    currentLayerRef.current = currentLayer;
  }, [currentLayer]);

  useEffect(() => {
    if (onLayerChange === undefined) return;
    if (viewMode === "archive") return;
    const advanceLayer = (direction: 1 | -1) => {
      const next = advanceFlythroughLayer(currentLayerRef.current ?? 0, direction);
      if (next !== currentLayerRef.current) {
        onLayerChange(next);
      }
    };
    const handleWheel = (event: WheelEvent) => {
      const dominantDelta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(dominantDelta) < 4) return;
      // Layer 2 is the cathedral — its panel has an inner scrollable card grid
      // (library mode runs long). Let downward wheels and upward wheels with
      // scrollTop > 0 propagate so the panel scrolls natively. Only intercept
      // an upward wheel when the panel is already at the top: that's the
      // gesture the player uses to back out to layer 1.
      if (currentLayerRef.current === 2) {
        if (dominantDelta >= 0) return;
        const panel = document.querySelector(".cathedral-scroll");
        if (panel instanceof HTMLElement && panel.scrollTop > 0) return;
      }
      event.preventDefault();
      const now = performance.now();
      // 220ms throttle — a normal mouse-wheel motion advances one layer per
      // tick instead of zipping through all three. Trackpad inertia still
      // produces multiple events per gesture but is similarly clamped.
      if (now - lastLayerAdvanceRef.current < 220) {
        return;
      }
      lastLayerAdvanceRef.current = now;
      const dir: 1 | -1 = dominantDelta > 0 ? 1 : -1;
      advanceLayer(dir);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isEditableEventTarget(event.target)) return;
      const direction = flythroughLayerDirectionFromKey(event.code);
      if (direction === null) return;
      event.preventDefault();
      const now = performance.now();
      if (event.repeat && now - lastLayerAdvanceRef.current < 160) return;
      lastLayerAdvanceRef.current = now;
      advanceLayer(direction);
    };
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverscroll = root.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      root.style.overscrollBehavior = previousRootOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, [onLayerChange, viewMode]);

  const sources = useMemo(
    () =>
      Object.fromEntries(
        // 512px base lets mipmaps handle downscaling. Loading 256 made
        // foreground roles (focus / partner / cluster picker) visibly blur
        // once the avatar scaled past its source resolution.
        stars.map((s) => [s.member.id, `/assets/portraits/${s.member.id}/avatar-512.png`]),
      ),
    [stars],
  );
  const textures = useTexture(sources) as Record<string, THREE.Texture>;

  useEffect(() => {
    // Per-texture aspect-ratio compensation. Portraits are cutouts on
    // transparent backgrounds, so "contain" semantics — sampling the full
    // short edge with no zoom — keeps the whole head + shoulders in frame.
    // Anchoring the square to the upper portion of tall textures keeps the
    // face near the disc center instead of dropping into the lower half.
    Object.values(textures).forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.generateMipmaps = true;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      const img = t.image as { width?: number; height?: number } | undefined;
      const w = img?.width ?? 256;
      const h = img?.height ?? 256;
      const aspect = w / h;
      if (aspect >= 1) {
        // Wide / square: sample the full height as a square, centered.
        t.repeat.set(1 / aspect, 1);
        t.center.set(0.5, 0.5);
      } else {
        // Tall: sample a square the width of the texture, anchored toward
        // the top so the head fills the disc and the body drops off.
        const repeatY = aspect;
        t.repeat.set(1, repeatY);
        t.center.set(0.5, 1 - repeatY / 2);
      }
      t.needsUpdate = true;
    });
  }, [textures]);

  const flareTexture = useMemo(() => buildFlareTexture(), []);
  const haloTexture = useMemo(() => buildSoftSparkleTexture(), []);
  const rimLightTexture = useMemo(() => buildRimLightTexture(), []);

  // When focus is pinned to the layer-1 marker slot, the connector and DOF
  // target should originate from the pinned position too — otherwise the
  // hover connector to an eligible partner draws from an off-screen anchor
  // (the focus star's random natural field point).
  const focusPinned = state === "focus_selected" && currentLayer === 1;
  const focusPos = focusStar
    ? focusPinned
      ? FOCUS_MARKER_POSITION
      : starWorldPosition(focusStar)
    : null;
  const partnerNatural = partnerStar ? starWorldPosition(partnerStar) : null;
  const partnerCompressed = focusStar ? pairPartnerPosition(focusStar) : null;
  // stars.find returns `undefined`, not `null`, so we normalize to a single
  // `undefined` sentinel — the JSX `!== undefined` guard then narrows the
  // result to a real StarMark for the children.
  const hoveredStar =
    hoveredId === null ? undefined : (stars.find((s) => s.member.id === hoveredId) ?? undefined);
  const hoveredPos = hoveredStar ? starWorldPosition(hoveredStar) : null;
  const activeStar =
    activeStarId === null
      ? undefined
      : (stars.find((s) => s.member.id === activeStarId) ?? undefined);

  const pairConnectorEndpoint =
    state === "committed_pair" || state === "scenario_chosen"
      ? partnerCompressed
      : state === "partner_selected"
        ? partnerNatural
        : null;

  const eligiblePartnerSet = starClickHandlers?.eligiblePartnerIds ?? EMPTY_ELIGIBLE_PARTNER_IDS;
  const showHoverConnector =
    state === "focus_selected" && hoveredId !== null && eligiblePartnerSet.has(hoveredId);

  const dofTarget = useMemo(() => {
    if (state === "idle" || state === "callout_heavy") return new THREE.Vector3(0, 0, 0);
    const target = state === "focus_selected" ? focusPos : (pairConnectorEndpoint ?? focusPos);
    if (target === null) return new THREE.Vector3(0, 0, 0);
    if (state === "focus_selected" || !focusPos || !pairConnectorEndpoint) {
      return new THREE.Vector3(target.x, target.y, target.z);
    }
    return new THREE.Vector3(
      (focusPos.x + pairConnectorEndpoint.x) / 2,
      (focusPos.y + pairConnectorEndpoint.y) / 2,
      (focusPos.z + pairConnectorEndpoint.z) / 2,
    );
  }, [state, focusPos, pairConnectorEndpoint]);

  const focusId = focusStar?.member.id;
  const partnerId = partnerStar?.member.id;

  // Iteration order of focusedIds matches save.focusedMemberIds; the index
  // drives the centered 2x2 cluster on layer 0.
  const focusOrder = useMemo(
    () => (focusedIds === undefined ? [] : Array.from(focusedIds)),
    [focusedIds],
  );

  // Layer-1 roster cluster order. The active subview's cohort packs into a
  // viewport-fitting grid (see `rosterClusterPosition`) so every pickable face
  // fits on screen at once. Iteration order matches use-roster-fold's set
  // construction (which walks save.members in roster order), giving each
  // member a stable slot across renders. Falls back to empty when the player
  // isn't on layer 1 so the cluster releases as they scroll between layers.
  const rosterLeadOrder = useMemo(() => {
    if (currentLayer !== 1) return [];
    const set =
      rosterSubview === "off_tonight"
        ? (offTonightSet ?? EMPTY_OFF_TONIGHT_IDS)
        : (starClickHandlers?.eligiblePartnerIds ?? EMPTY_ELIGIBLE_PARTNER_IDS);
    return Array.from(set);
  }, [currentLayer, rosterSubview, offTonightSet, starClickHandlers?.eligiblePartnerIds]);

  // The morph anchor must match where the StarSprite actually renders — cluster
  // grid on layer 0, partner override after the pair commits, archive layout in
  // archive mode. Anchoring at `starWorldPosition` projects the card to the
  // star's raw field coordinates, which is far off-screen for any star whose
  // sprite is at a non-natural target.
  const activePos = useMemo<Vec3 | null>(() => {
    if (activeStar === undefined) return null;
    const natural = starWorldPosition(activeStar);
    const inArchive = viewMode === "archive";
    if (inArchive) {
      return archiveData?.positions.get(activeStar.member.id) ?? natural;
    }
    const role = roleForStar(activeStar, {
      state,
      focusId,
      partnerId,
      eligiblePartnerIds: eligiblePartnerSet,
    });
    const overridePos =
      role === "partner" && focusStar !== undefined ? pairPartnerPosition(focusStar) : null;
    const flythroughLayer =
      focusedIds === undefined
        ? undefined
        : computeStarFlythroughLayer(activeStar.member.id, { focusedIds });
    const clusterPosition = resolveClusterPosition({
      memberId: activeStar.member.id,
      role,
      state,
      flythroughLayer,
      currentLayer,
      focusOrder,
      rosterLeadOrder,
    });
    return resolveStarRenderTarget({
      natural,
      overridePos,
      clusterPosition,
      flythroughLayer,
      layerZOffset: computeLayerZOffset(role, state),
    });
  }, [
    activeStar,
    viewMode,
    archiveData,
    state,
    focusId,
    partnerId,
    eligiblePartnerSet,
    focusStar,
    focusedIds,
    currentLayer,
    focusOrder,
    rosterLeadOrder,
  ]);

  return (
    <>
      <CameraRig
        target={cameraTarget}
        parallax={showParallax && activeStarId === null && !hudOverlayHovered}
        reducedMotion={reducedMotion}
      />
      <SceneBackground />
      <fog attach="fog" args={["#2a1a3f", 16, 44]} />

      <Lights state={state} focusStar={focusStar} partnerStar={partnerStar} />

      <ParticleField count={620} />

      {stars.map((star) => {
        const role = roleForStar(star, {
          state,
          focusId,
          partnerId,
          eligiblePartnerIds: eligiblePartnerSet,
        });
        // Archive mode overrides position via the per-member archive map; it
        // also disables flythrough slab / cluster / role-Z stacking so the
        // graph layout reads cleanly without tonight-mode framing.
        const inArchive = viewMode === "archive";
        const archivePos = inArchive ? (archiveData?.positions.get(star.member.id) ?? null) : null;
        // Archive only positions members that have a filed-note pair. Skip
        // the rest so the constellation reads as the pair graph it actually
        // is, not the entire roster ringing an empty center.
        if (inArchive && archivePos === null) return null;
        const overridePos = inArchive
          ? archivePos
          : role === "partner" && focusStar
            ? pairPartnerPosition(focusStar)
            : null;
        const layerZOffset = inArchive ? 0 : computeLayerZOffset(role, state);
        const lensFilteredOut =
          starClickHandlers?.filterMatchedIds !== undefined &&
          !starClickHandlers.filterMatchedIds.has(star.member.id);
        // Archive isolation: when a member is selected, stars outside the
        // member + partners scope dim alongside any lens filtering already
        // active. Same `filteredOut` channel — the visual treatment composes.
        const archiveIsolated =
          inArchive &&
          archiveIsolation !== undefined &&
          !archiveIsolation.includedMemberIds.has(star.member.id);
        const filteredOut = lensFilteredOut || archiveIsolated;
        // Flythrough slab membership. Each star lives on exactly one of the
        // two member slabs (0 focus, 1 roster). Eligible vs off-tonight is a
        // per-star cohort within slab 1 — the roster subview toggle picks
        // which cohort leads the eye. Archive mode opts out entirely.
        const flythroughLayer: StarFlythroughLayer | undefined = inArchive
          ? undefined
          : focusedIds === undefined
            ? undefined
            : computeStarFlythroughLayer(star.member.id, { focusedIds });
        const cohort =
          !inArchive && flythroughLayer === 1
            ? computeRosterCohort(star.member.id, {
                eligibleIds: eligiblePartnerSet,
                offTonightIds: offTonightSet ?? EMPTY_OFF_TONIGHT_IDS,
              })
            : undefined;
        // Focus marker pin: once the player has committed a focus and
        // scrolled past the picker, the focus star would otherwise be
        // culled by the off-slab activity drop. Pin it to a visible
        // top-center slot so the inline focus pill anchored to it stays
        // on-screen and the hover connector to eligible partners has a
        // stable origin.
        const isFocusMarker =
          !inArchive && role === "focus" && state === "focus_selected" && currentLayer === 1;
        const slabActivity = isFocusMarker
          ? { intensityMultiplier: 1, scaleMultiplier: FOCUS_MARKER_SCALE }
          : inArchive || flythroughLayer === undefined || currentLayer === undefined
            ? undefined
            : flythroughMemberSlabActivity(
                flythroughLayer,
                currentLayer,
                cohort,
                rosterSubview ?? "eligibles",
              );
        // Cluster layouts: layer 0 packs focused leads into a centered grid,
        // layer 1 packs the active roster cohort (eligibles or off-tonight,
        // depending on subview) into a viewport-fitting grid so every pickable
        // face fits on screen. Both release on layer / subview change so the
        // natural field returns. Archive mode never clusters — it owns its own
        // layout.
        const clusterPosition = resolveClusterPosition({
          memberId: star.member.id,
          role,
          state,
          flythroughLayer,
          currentLayer,
          focusOrder,
          rosterLeadOrder,
          inArchive,
        });
        return (
          <StarSprite
            key={star.member.id}
            star={star}
            role={role}
            state={state}
            overridePos={overridePos}
            layerZOffset={layerZOffset}
            texture={textures[star.member.id]}
            flareTexture={flareTexture}
            haloTexture={haloTexture}
            rimLightTexture={rimLightTexture}
            showAura={showAuras}
            reducedMotion={reducedMotion}
            filteredOut={filteredOut}
            hovered={hoveredId === star.member.id}
            cardOpen={activeStarId === star.member.id}
            flythroughLayer={flythroughLayer}
            slabActivity={slabActivity}
            clusterPosition={clusterPosition}
            renderOverlay={buildFocusMarkerOverlay({
              role,
              state,
              star,
              onClearFocus: starClickHandlers?.onClearFocus,
              onHoverChange: setHudOverlayHovered,
            })}
            onHoverEnter={() => setHoveredId(star.member.id)}
            onHoverLeave={() => setHoveredId(null)}
            onClick={
              starClickHandlers?.onStarClick === undefined
                ? undefined
                : (event) => starClickHandlers.onStarClick?.(star, event)
            }
            onDoubleClick={
              starClickHandlers?.onStarDoubleClick === undefined
                ? undefined
                : (event) => starClickHandlers.onStarDoubleClick?.(star, event)
            }
          />
        );
      })}

      {viewMode === "archive" && archiveData !== undefined
        ? archiveData.edges.map((spec) => {
            const pairId = spec.edge.pairId;
            const isSelected =
              archiveSelection !== null &&
              archiveSelection.kind === "pair" &&
              archiveSelection.pairId === pairId;
            // Edge counts as hovered when either the player is pointing at
            // the edge itself OR pointing at one of its endpoint stars —
            // hovering a star highlights its incident edges.
            const incidentToHoveredStar =
              hoveredId !== null && (spec.edge.a === hoveredId || spec.edge.b === hoveredId);
            const isHovered = hoveredEdgeId === pairId || incidentToHoveredStar;
            // Isolation: when a member is selected, edges not touching them
            // fade (still visible so the graph reads, but recede).
            const isFaded =
              archiveIsolation !== undefined &&
              spec.edge.a !== archiveIsolation.focusMemberId &&
              spec.edge.b !== archiveIsolation.focusMemberId;
            return (
              <PairEdgeMesh
                key={pairId}
                edge={spec.edge}
                from={spec.from}
                to={spec.to}
                control={spec.control}
                isHovered={isHovered}
                isSelected={isSelected}
                isFaded={isFaded}
                onHoverEnter={() => {
                  setHoveredEdgeId(pairId);
                  onArchiveEdgeHover?.(pairId);
                }}
                onHoverLeave={() => {
                  setHoveredEdgeId((current) => (current === pairId ? null : current));
                  onArchiveEdgeHover?.(null);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onArchiveEdgeClick?.(pairId);
                }}
                hoverTooltip={renderArchiveEdgeTooltip?.(spec.edge)}
              />
            );
          })
        : null}

      {viewMode === "tonight" && pairConnectorEndpoint !== null && focusPos !== null ? (
        <PairConnector3D from={focusPos} to={pairConnectorEndpoint} />
      ) : null}

      {viewMode === "tonight" && showHoverConnector && focusPos !== null && hoveredPos !== null ? (
        <HoverConnector from={focusPos} to={hoveredPos} />
      ) : null}

      <AnimatePresence>
        {activeStar !== undefined && activePos !== null ? (
          <Html
            key={activeStar.member.id}
            position={[activePos.x, activePos.y, activePos.z]}
            zIndexRange={[60, 0]}
            className="pointer-events-none"
          >
            {/*
             * The morph anchors at the star's projected screen point. The card
             * itself owns the slide-out-and-grow transform, so this wrapper is
             * just a 0x0 anchor; the motion.div inside expands outward.
             */}
            <div className="relative h-0 w-0">
              {renderHoverCard !== undefined ? (
                renderHoverCard({ star: activeStar })
              ) : (
                <HoverDetailCard star={activeStar} />
              )}
            </div>
          </Html>
        ) : null}
      </AnimatePresence>

      <EffectComposer multisampling={4}>
        <Bloom intensity={0.72} luminanceThreshold={0.55} luminanceSmoothing={0.5} mipmapBlur />
        <DepthOfField
          target={dofTarget}
          focalLength={0.034}
          bokehScale={cameraTarget.bokehScale}
          height={1080}
        />
        <Vignette eskil={false} offset={0.28} darkness={0.62} />
      </EffectComposer>
    </>
  );
}

/* ============================================================================
 * Camera rig. Damped lerp toward the target position + lookAt + cursor lead-
 * ahead (NDC pointer biases the camera toward the cursor by a small amount so
 * the field always feels alive).
 * ========================================================================== */

function CameraRig({
  target,
  parallax,
  reducedMotion,
}: {
  target: CameraTarget;
  parallax: boolean;
  reducedMotion: boolean;
}) {
  const lookAt = useRef(new THREE.Vector3(target.lookAt[0], target.lookAt[1], target.lookAt[2]));

  useFrame((sceneState, delta) => {
    const camera = sceneState.camera;
    const t = sceneState.clock.elapsedTime;
    const px = parallax ? sceneState.pointer.x : 0;
    const py = parallax ? sceneState.pointer.y : 0;

    // Continuous idle orbital sway — gentle yaw/pitch on top of the per-state target.
    // Closer-to-camera stars swing more than far stars (perspective parallax), which
    // is what sells the 2.5D feel even when the user isn't moving the mouse.
    const swayX = reducedMotion ? 0 : Math.sin(t * 0.09) * 0.55 + Math.sin(t * 0.21) * 0.18;
    const swayY = reducedMotion ? 0 : Math.cos(t * 0.075) * 0.32 + Math.sin(t * 0.17) * 0.1;

    const desiredX = target.position[0] + px * 1.7 + swayX;
    const desiredY = target.position[1] + py * 1.0 + swayY;
    const desiredZ = target.position[2];

    const lerpAmount = reducedMotion ? 1 : 1 - Math.pow(0.0009, delta);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, desiredX, lerpAmount);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, lerpAmount);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, desiredZ, lerpAmount);

    const desiredLookX = target.lookAt[0] + px * 0.55 + swayX * 0.35;
    const desiredLookY = target.lookAt[1] + py * 0.4 + swayY * 0.3;
    const desiredLookZ = target.lookAt[2];

    lookAt.current.x = THREE.MathUtils.lerp(lookAt.current.x, desiredLookX, lerpAmount);
    lookAt.current.y = THREE.MathUtils.lerp(lookAt.current.y, desiredLookY, lerpAmount);
    lookAt.current.z = THREE.MathUtils.lerp(lookAt.current.z, desiredLookZ, lerpAmount);

    camera.lookAt(lookAt.current);
  });

  return null;
}

/* ============================================================================
 * Lighting. Warm ambient, cool key directional, rim violet. Plus a moving
 * palette-tinted point light near the focus and partner stars so avatars catch
 * a soft front-light when active.
 * ========================================================================== */

function Lights({
  state,
  focusStar,
  partnerStar,
}: {
  state: LobbyState;
  focusStar: StarMark | undefined;
  partnerStar: StarMark | undefined;
}) {
  const focusActive = state !== "idle" && state !== "callout_heavy" && focusStar !== undefined;
  const partnerActive =
    (state === "partner_selected" || state === "committed_pair" || state === "scenario_chosen") &&
    partnerStar !== undefined;

  const focusPos = focusStar ? starWorldPosition(focusStar) : { x: 0, y: 0, z: 0 };
  const partnerPos = focusStar ? pairPartnerPosition(focusStar) : { x: 0, y: 0, z: 0 };

  return (
    <>
      <ambientLight intensity={0.55} color="#322048" />
      <directionalLight position={[6, 8, 6]} intensity={0.85} color="#fff5e0" />
      <directionalLight position={[-6, -2, 4]} intensity={0.32} color="#a78bfa" />
      <pointLight position={[0, -2, -8]} intensity={1.6} color="#f97373" distance={26} decay={2} />
      <pointLight
        position={[-15, 9, -11]}
        intensity={2.4}
        color="#a78bfa"
        distance={32}
        decay={2}
      />
      <pointLight position={[15, 9, -11]} intensity={2.0} color="#d946ef" distance={30} decay={2} />
      {focusActive ? (
        <pointLight
          position={[focusPos.x, focusPos.y + 0.2, focusPos.z + 1.4]}
          intensity={5.2}
          color="#fb7185"
          distance={5}
          decay={2}
        />
      ) : null}
      {partnerActive ? (
        <pointLight
          position={[partnerPos.x, partnerPos.y + 0.2, partnerPos.z + 1.4]}
          intensity={4.4}
          color="#c4b5fd"
          distance={5}
          decay={2}
        />
      ) : null}
    </>
  );
}

/* ============================================================================
 * Scene background. The dawn-gradient backdrop texture is built once via
 * buildBackdropTexture (see ./textures.ts) and assigned as scene.background
 * so it always sits behind the fog/particles without being affected by
 * camera distance.
 * ========================================================================== */

function SceneBackground() {
  const texture = useMemo(() => buildBackdropTexture(), []);
  return <primitive attach="background" object={texture} />;
}

/* ============================================================================
 * Star sprite. Billboard group containing: additive halo behind, lit avatar
 * plane center, ring frame on top. Position + scale + opacity are damped each
 * frame so role transitions feel mechanical free.
 * ========================================================================== */

type StarOverlayMetrics = {
  avatarRadius: number;
  haloSize: number;
};

type StarOverlayRenderer = (metrics: StarOverlayMetrics) => ReactNode;

function buildFocusMarkerOverlay({
  role,
  state,
  star,
  onClearFocus,
  onHoverChange,
}: {
  role: StarRole;
  state: LobbyState;
  star: StarMark;
  onClearFocus?: () => void;
  onHoverChange: (hovered: boolean) => void;
}): StarOverlayRenderer | undefined {
  if (role !== "focus" || state !== "focus_selected" || onClearFocus === undefined) {
    return undefined;
  }

  return ({ avatarRadius }) => (
    <FocusSelectionMarker
      member={star.member}
      avatarRadius={avatarRadius}
      onClearFocus={onClearFocus}
      onHoverChange={onHoverChange}
    />
  );
}

function StarSprite({
  star,
  role,
  state,
  overridePos,
  layerZOffset,
  texture,
  flareTexture,
  haloTexture,
  rimLightTexture,
  showAura,
  reducedMotion,
  filteredOut = false,
  hovered = false,
  cardOpen = false,
  flythroughLayer,
  slabActivity,
  clusterPosition = null,
  renderOverlay,
  onHoverEnter,
  onHoverLeave,
  onClick,
  onDoubleClick,
}: {
  star: StarMark;
  role: StarRole;
  state: LobbyState;
  overridePos: Vec3 | null;
  layerZOffset: number;
  texture: THREE.Texture | undefined;
  flareTexture: THREE.Texture | null;
  /** Soft radial halo behind every avatar — replaces the old sparkle cross. */
  haloTexture: THREE.Texture | null;
  /**
   * Tinted ring gradient composited in front of the avatar disc. Bridges the
   * portrait silhouette into the surrounding sparkle halo so the avatar
   * stops reading as a sticker pasted on top of the glow.
   */
  rimLightTexture: THREE.Texture | null;
  showAura: boolean;
  reducedMotion: boolean;
  /** Lens-filter excluded this star — gets extra dimming + lower opacity. */
  filteredOut?: boolean;
  /** Pointer is over the star — bump scale to telegraph "you can click me". */
  hovered?: boolean;
  /**
   * The HoverDetailCard is morphing out of this star — hide the 3D mesh so
   * the card reads as the same element (i.e. the star itself becoming the
   * card) instead of doubling-up over the avatar mesh that's still rendered
   * underneath.
   */
  cardOpen?: boolean;
  /**
   * Flythrough slab the star lives on. When provided, the star lerps toward
   * the slab's absolute world-Z instead of its seeded natural Z + role offset
   * so each scroll tick re-layers the field. Undefined = legacy (no slab
   * treatment), the old role-based layer offset stands.
   */
  flythroughLayer?: StarFlythroughLayer;
  /**
   * Per-star multipliers driven by the currentLayer vs this star's slab.
   * The active slab gets `intensityMultiplier=1, scaleMultiplier=1.15`;
   * receded slabs get lower values. Pure multiplicative — applies AFTER
   * the role intensity so the focus + partner roles stay distinct within
   * their slab.
   */
  slabActivity?: { intensityMultiplier: number; scaleMultiplier: number };
  /**
   * Layer-0 picker override. When non-null, the star lerps to this position
   * in world space instead of its natural field position, so the 4 focused
   * leads form a centered 2x2 grid. Released (null) on any other layer and
   * after a focus is committed.
   */
  clusterPosition?: Vec3 | null;
  /**
   * Optional world-anchored HTML overlay rendered inside the billboard after
   * the generic hover label. Feature-specific controls live in their own
   * modules and enter StarSprite through this narrow slot.
   */
  renderOverlay?: StarOverlayRenderer;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onDoubleClick?: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const avatarMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const rimMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const flareMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const flareMeshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);
  // Visual avatar disc lives on its own sub-group so it can shrink to nestle
  // inside the halo glow ("small portrait inset in a big star") and expand
  // back on hover without disturbing the halo plane or the click target.
  const avatarSubgroupRef = useRef<THREE.Group>(null);
  const avatarSubgroupScaleRef = useRef(0.38);

  const natural = useMemo(() => starWorldPosition(star), [star]);
  const sizing = useMemo(() => sizeForStar3D(star.tier, role, state), [star.tier, role, state]);
  // Per-member halo tint: aura primary when present so vhool reads violet,
  // epsy cyan, alex-yoon warm-amber etc.; focus / partner override to the
  // active-pair rose/violet so the player can read the selection from
  // across the field. Fall back to portrait palette accent for stars with
  // no aura registered.
  const haloColor = useMemo(
    () => haloColorForStar(role, star.palette, star.aura),
    [role, star.palette, star.aura],
  );
  const flareColor = useMemo(() => (role === "focus" ? "#ffd5a3" : "#dec8ff"), [role]);
  const intensity = useMemo(
    () => intensityForRole(role, star.tier, state),
    [role, star.tier, state],
  );
  // Sparkle plane size — a soft halo with the ✦ silhouette dominating the
  // visible star, with the avatar disc nestled at its bright center. Reach
  // is generous so the glow reads as the primary shape and the portrait
  // sits as a small inset inside it. Focus / partner halos stay slightly
  // tighter since their avatars remain at full size.
  const haloSize = useMemo(() => {
    const reach =
      role === "focus" || role === "partner"
        ? 1.9
        : role === "eligible"
          ? 2.2
          : role === "ineligible_cooling"
            ? 1.85
            : 1.95;
    return sizing.avatarRadius * reach;
  }, [role, sizing.avatarRadius]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;

    if (groupRef.current !== null) {
      const driftAmp = role === "focus" || role === "partner" ? 0.045 : 0.075;
      const driftX = Math.sin(t * 0.28 + star.phase) * driftAmp;
      const driftY = Math.cos(t * 0.21 + star.phase * 1.43) * driftAmp;

      const target = resolveStarRenderTarget({
        natural,
        overridePos,
        clusterPosition,
        flythroughLayer,
        layerZOffset,
      });
      const targetX = target.x + driftX;
      const targetY = target.y + driftY;
      const targetZ = target.z;

      const moveLerp = reducedMotion ? 1 : 1 - Math.pow(0.0008, delta);
      const pos = groupRef.current.position;
      pos.x = THREE.MathUtils.lerp(pos.x, targetX, moveLerp);
      pos.y = THREE.MathUtils.lerp(pos.y, targetY, moveLerp);
      pos.z = THREE.MathUtils.lerp(pos.z, targetZ, moveLerp);

      // On hover the whole star puffs up — halo plane and avatar both grow
      // together so the glow expands alongside the portrait. The avatar
      // inner subgroup adds an additional dramatic bump (see
      // avatarSubgroupScaleRef below) so the disc reads as opening out of
      // the glow.
      const scaleLerp = reducedMotion ? 1 : 1 - Math.pow(0.002, delta);
      const slabScale = slabActivity?.scaleMultiplier ?? 1;
      const hoverBoost = hovered ? 1.25 : 1;
      scaleRef.current = THREE.MathUtils.lerp(
        scaleRef.current,
        sizing.scale * slabScale * hoverBoost,
        scaleLerp,
      );
      groupRef.current.scale.setScalar(scaleRef.current);
    }

    // Slab activity multiplier from the flythrough layer state. Same value
    // applies to avatar opacity, halo, ring, and flare so the entire star
    // dims/sharps together when the player scrolls between layers. The
    // hovered-card grace and lens-filter dim still composes on top.
    const slabIntensity = slabActivity?.intensityMultiplier ?? 1;

    // "Prominent" stars are the cluster (layer-0 picker) and the active
    // layer's leading cohort (slabIntensity >= 0.9). For these the avatar
    // pins to full opacity so the additive sparkle never bleeds through the
    // face. Cluster also bypasses the availability-driven desat so the
    // player's chosen leads always read in full color.
    const inCluster = clusterPosition !== null;
    const isProminent = inCluster || slabIntensity >= 0.9;

    // Avatar disc scale — shrinks the portrait so it sits as a small inset
    // inside the halo glow, then expands back to full readability on hover.
    // Focus / partner stay full-size — they're the active selected pair and
    // need to dominate. Cluster picker stars (layer-0 focused leads, layer-1
    // roster cohort) also pin to full size so pickable faces are unambiguous
    // in the cluster grid. Background field stars stay as small portraits
    // inset in their halos so the constellation reads as such.
    const keepFullAvatar = role === "focus" || role === "partner" || inCluster;
    const targetAvatarScale = keepFullAvatar ? 1 : hovered ? 1.1 : 0.38;
    const avatarSubgroupLerp = reducedMotion ? 1 : 1 - Math.pow(0.0018, delta);
    avatarSubgroupScaleRef.current = THREE.MathUtils.lerp(
      avatarSubgroupScaleRef.current,
      targetAvatarScale,
      avatarSubgroupLerp,
    );
    if (avatarSubgroupRef.current !== null) {
      avatarSubgroupRef.current.scale.setScalar(avatarSubgroupScaleRef.current);
    }

    if (avatarMatRef.current !== null) {
      // filteredOut multiplies intensity by 0.32 so non-matching cases dim
      // visibly without disappearing — the field stays a constellation, the
      // lens just spotlights what matches.
      const filterMultiplier = filteredOut ? 0.32 : 1;
      const targetOpacity = isProminent
        ? filterMultiplier
        : intensity * filterMultiplier * slabIntensity;
      avatarMatRef.current.opacity = THREE.MathUtils.lerp(
        avatarMatRef.current.opacity,
        targetOpacity,
        Math.min(1, delta * 5),
      );
      const desat =
        !inCluster &&
        (role === "ineligible_off_shift" || role === "ineligible_closed" || filteredOut);
      const cool = !inCluster && role === "ineligible_cooling";
      avatarMatRef.current.color.setRGB(
        desat ? 0.5 : cool ? 0.92 : 1,
        desat ? 0.5 : cool ? 0.85 : 1,
        desat ? 0.55 : cool ? 0.88 : 1,
      );
    }
    // Halo + flare both ride a slow sin pulse + a sharper twinkle. Each star
    // gets a distinct phase so the field reads as a constellation of stars
    // breathing on their own timing instead of a synchronized strobe. The
    // twinkle term is a cubed sine so most of the time it sits low and
    // occasionally peaks — that asymmetric attack is what reads as a real
    // star "twinkling" rather than a uniform pulse.
    const slow = Math.sin(t * 1.4 + star.phase) * 0.5 + 0.5;
    const twinkleRaw = Math.sin(t * 3.6 + star.phase * 2.3) * 0.5 + 0.5;
    const twinkle = twinkleRaw * twinkleRaw * twinkleRaw;

    if (haloMatRef.current !== null) {
      // Soft sparkle halo opacity — the glow is the dominant visible shape
      // (the avatar disc is a small inset for non-focus/non-partner stars),
      // so the base values are pushed higher than a subtle accent would be.
      // Falls off on ineligibles by severity. Slow breath + sharper twinkle
      // modulate the opacity; the twinkle peaks bump up to ~30% above the
      // breath floor so the glow visibly sparks every few seconds. Hovered
      // stars get an extra brightness ignite. Slab intensity composes on
      // top; auras toggle dims (not kills) the glow.
      const haloBase =
        role === "focus"
          ? 0.82
          : role === "partner"
            ? 0.74
            : role === "eligible"
              ? 0.78
              : role === "ineligible_cooling"
                ? 0.55
                : role === "ineligible_off_shift"
                  ? 0.42
                  : role === "ineligible_closed"
                    ? 0.32
                    : 0.62;
      const haloMix = reducedMotion ? 1 : 0.78 + slow * 0.22 + twinkle * 0.32;
      const hoverIgnite = hovered ? 1.25 : 1;
      const auraGate = showAura ? 1 : 0.4;
      haloMatRef.current.opacity = THREE.MathUtils.lerp(
        haloMatRef.current.opacity,
        haloBase * haloMix * auraGate * slabIntensity * hoverIgnite,
        Math.min(1, delta * 5),
      );

      // Rim-light bleed rides the same breathing pulse as the halo so the
      // ring pulses in sync — the portrait edge looks lit BY the star.
      // Slightly lower base than the halo: the rim is the bridge, not the
      // dominant glow. Aura toggle dims it (not kills) so the ring stays
      // legible when the player has hidden auras.
      if (rimMatRef.current !== null) {
        const rimBase =
          role === "focus"
            ? 0.65
            : role === "partner"
              ? 0.58
              : role === "eligible"
                ? 0.55
                : role === "ineligible_cooling"
                  ? 0.36
                  : role === "ineligible_off_shift"
                    ? 0.26
                    : role === "ineligible_closed"
                      ? 0.2
                      : 0.42;
        rimMatRef.current.opacity = THREE.MathUtils.lerp(
          rimMatRef.current.opacity,
          rimBase * haloMix * auraGate * slabIntensity * hoverIgnite,
          Math.min(1, delta * 5),
        );
      }
    }
    if (flareMatRef.current !== null) {
      // Same rule for the lens-flare: dropped on focus / partner so the face
      // reads cleanly; kept as a subtle glint on eligibles.
      const flareBase = role === "eligible" ? 0.22 : 0;
      flareMatRef.current.opacity = THREE.MathUtils.lerp(
        flareMatRef.current.opacity,
        flareBase * (0.85 + slow * 0.3) * slabIntensity,
        Math.min(1, delta * 5),
      );
    }
    if (flareMeshRef.current !== null) {
      // Tiny rotation on focus/partner so the flare arms feel alive.
      const rot = reducedMotion ? 0 : Math.sin(t * 0.3 + star.phase) * 0.06;
      flareMeshRef.current.rotation.z = rot;
    }

    // Cull the group entirely once it's fully receded so off-axis stars stop
    // intercepting pointer events on the active layer. We key off the lerped
    // avatar opacity rather than the slab intensity directly so the group
    // stays renderable during the fade-in / fade-out transitions.
    if (groupRef.current !== null) {
      const avatarOpacity = avatarMatRef.current?.opacity ?? 0;
      const shouldRender = !cardOpen && avatarOpacity > 0.01;
      if (groupRef.current.visible !== shouldRender) {
        groupRef.current.visible = shouldRender;
      }
    }
  });

  const handlePointerEnter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (typeof document !== "undefined") document.body.style.cursor = "pointer";
    onHoverEnter();
  };
  const handlePointerLeave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (typeof document !== "undefined") document.body.style.cursor = "";
    onHoverLeave();
  };
  const handleClick =
    onClick === undefined
      ? undefined
      : (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onClick(event);
        };
  const handleDoubleClick =
    onDoubleClick === undefined
      ? undefined
      : (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onDoubleClick(event);
        };

  const showFlare = role === "eligible";
  // Closed/quit glyph keys off the underlying member status so it works even
  // when the field is filtered down or in reselect mode. Closed reads as a
  // small heart (closure-filed); quit reads as a small X (membership ended).
  const closureGlyph: "heart" | "x" | null =
    star.member.state.status === "closed"
      ? "heart"
      : star.member.state.status === "quit"
        ? "x"
        : null;

  // Rain trail brightness rides the role intensity AND the filtered-out
  return (
    <group ref={groupRef} position={[natural.x, natural.y, natural.z]}>
      <Billboard>
        {/* Soft halo — a circular radial gradient that fades to transparent
            at the edges. Sits behind the avatar disc so the bleed reads as
            ambient glow rather than a sharp shape cutting through the face.
            Additive blending lets the per-member tint bloom outward.
            Raycast skipped so the visual glow doesn't intercept pointer
            events — the dedicated hit target below owns hover detection. */}
        <mesh raycast={() => null} position={[0, 0, -0.05]}>
          <planeGeometry args={[haloSize * 2, haloSize * 2]} />
          <meshBasicMaterial
            ref={haloMatRef}
            map={haloTexture}
            color={haloColor}
            transparent
            opacity={0.001}
            depthWrite={false}
            fog={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        {/* Invisible hit target — kept at the full avatar radius so hover /
            click work generously even when the visible portrait disc shrinks
            to nestle inside the halo. Sits in front so the raycaster picks
            it up before the avatar disc behind. */}
        <mesh
          position={[0, 0, 0.08]}
          onPointerOver={handlePointerEnter}
          onPointerOut={handlePointerLeave}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <circleGeometry args={[sizing.avatarRadius, 24]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Avatar (lit) + rim-light + closure glyph share a sub-group whose
            scale is damped each frame between a small inset (idle) and full
            size (hovered, focus, partner, or cluster). The rim plane and the
            closure mark ride the same transform so they stay pinned to the
            visible disc edge as the portrait scales. */}
        <group ref={avatarSubgroupRef}>
          {/* circleGeometry clips the cutout PNG to a disc so the shoulders /
              body of the original image don't bleed past the disc edge.
              Unlit basic material: the portrait should render at full texture
              color regardless of the scene's volumetric lighting (the cluster
              Z plane is otherwise dim and made the avatars look shadowed).
              The feather shader injection (onBeforeCompile) ramps alpha down
              across the outer ~26% of the disc so the portrait blends into
              the surrounding halo instead of cutting a hard circle through
              it. alphaTest is dropped to 0.02 so the feather's tail isn't
              clipped into a visible hard rim. */}
          <mesh raycast={() => null}>
            <circleGeometry args={[sizing.avatarRadius, 96]} />
            <meshBasicMaterial
              ref={avatarMatRef}
              map={texture}
              transparent
              alphaTest={0.02}
              depthWrite={false}
              toneMapped
              onBeforeCompile={featherAvatarShader}
            />
          </mesh>

          {/* Rim-light bleed plane — additively tints the portrait's feathered
              edge with the halo color and bleeds outward into the surrounding
              sparkle. Sits in front of the avatar disc at z=+0.005 so the
              additive blend lands ON the portrait edge, not behind it. Sized
              ~2.4x the avatar radius so the ring peak (texture distance ~0.78)
              maps to just outside the visible disc edge, with the inward ramp
              overlapping the avatar feather. */}
          <mesh raycast={() => null} position={[0, 0, 0.005]}>
            <planeGeometry args={[sizing.avatarRadius * 2.4, sizing.avatarRadius * 2.4]} />
            <meshBasicMaterial
              ref={rimMatRef}
              map={rimLightTexture}
              color={haloColor}
              transparent
              opacity={0.001}
              depthWrite={false}
              fog={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          {/* Closure glyph — small ring-corner mark on closed (heart) and
              quit (X) cases so the player can read the file's outcome before
              opening it. Anchored to the upper-right of the bubble. */}
          {closureGlyph !== null ? (
            <Html
              position={[sizing.avatarRadius * 0.85, sizing.avatarRadius * 0.85, 0.05]}
              zIndexRange={[40, 0]}
              className="pointer-events-none"
              transform={false}
            >
              <div
                className={`-translate-x-1/2 -translate-y-1/2 grid size-5 place-items-center rounded-full ring-2 ring-[#07041a]/70 ${
                  closureGlyph === "heart"
                    ? "bg-emerald-400 text-[#07041a]"
                    : "bg-rose-400 text-[#07041a]"
                }`}
              >
                {closureGlyph === "heart" ? (
                  <svg viewBox="0 0 16 16" className="size-3" fill="currentColor" aria-hidden>
                    <path d="M8 13.5 C 3 10.5 2 7.5 4 5.5 C 5.5 4.5 7 5 8 6 C 9 5 10.5 4.5 12 5.5 C 14 7.5 13 10.5 8 13.5 Z" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 16 16"
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M4 4 L 12 12" />
                    <path d="M12 4 L 4 12" />
                  </svg>
                )}
              </div>
            </Html>
          ) : null}
        </group>

        {/* Lens-flare cross — only on the active pair and eligible partners.
            Decorative, so it skips raycasting to keep the hit-target stack
            clean. */}
        {showFlare && flareTexture !== null ? (
          <mesh ref={flareMeshRef} raycast={() => null} position={[0, 0, 0.035]}>
            <planeGeometry args={[sizing.flareSize, sizing.flareSize]} />
            <meshBasicMaterial
              ref={flareMatRef}
              map={flareTexture}
              color={flareColor}
              transparent
              opacity={0.001}
              depthWrite={false}
              fog={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        ) : null}

        {/* Hover name label. Mounts when the star is hovered (and the detail
            card isn't already morphing out of it). Anchored just below the
            halo so the face stays unobstructed. Html with `center` keeps the
            tooltip readable at constant pixel size regardless of the star's
            world scale. Suppressed when a feature overlay occupies this
            same anchor so the two affordances don't stack. */}
        {hovered && !cardOpen && renderOverlay === undefined ? (
          <Html
            position={[0, -haloSize * 0.78, 0.12]}
            zIndexRange={[50, 0]}
            className="pointer-events-none"
            center
          >
            <div className="aura-liquid-glass aura-liquid-glass-ink rounded-pill px-3 py-1 font-display text-label leading-none text-aura-paper whitespace-nowrap shadow-cta">
              {star.member.name}
            </div>
          </Html>
        ) : null}
        {renderOverlay?.({ avatarRadius: sizing.avatarRadius, haloSize })}
      </Billboard>
    </group>
  );
}

/* ============================================================================
 * Connectors. Hover connector (focus -> hovered eligible) is a faint dashed
 * line that fades in. PairConnector3D is the locked-in line for the committed
 * pair, slightly thicker with rose->violet color blend.
 * ========================================================================== */

function HoverConnector({ from, to }: { from: Vec3; to: Vec3 }) {
  const points = useMemo(
    () => [
      new THREE.Vector3(from.x, from.y, from.z + 0.15),
      new THREE.Vector3(to.x, to.y, to.z + 0.15),
    ],
    [from.x, from.y, from.z, to.x, to.y, to.z],
  );
  return (
    <Line
      points={points}
      color="#fb7185"
      lineWidth={1.4}
      dashed
      dashScale={6}
      dashSize={0.18}
      gapSize={0.22}
      transparent
      opacity={0.7}
    />
  );
}

function PairConnector3D({ from, to }: { from: Vec3; to: Vec3 }) {
  const points = useMemo(
    () => [
      new THREE.Vector3(from.x, from.y, from.z + 0.2),
      new THREE.Vector3((from.x + to.x) / 2, (from.y + to.y) / 2 + 0.1, (from.z + to.z) / 2 + 0.25),
      new THREE.Vector3(to.x, to.y, to.z + 0.2),
    ],
    [from.x, from.y, from.z, to.x, to.y, to.z],
  );
  return (
    <Line
      points={points}
      vertexColors={[
        [0.984, 0.443, 0.522],
        [0.95, 0.62, 0.78],
        [0.768, 0.71, 0.99],
      ]}
      lineWidth={2.4}
      dashed
      dashScale={3.4}
      dashSize={0.28}
      gapSize={0.18}
      transparent
      opacity={0.82}
    />
  );
}
