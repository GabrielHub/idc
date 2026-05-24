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

import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { useTexture } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

import {
  ActiveCardAnchor,
  type RenderHoverCard as ActiveCardRenderHoverCard,
} from "./active-card-anchor";
import { ArchiveEdgeLayer } from "./archive-edge-layer";
import { CameraRig, Lights, SceneBackground } from "./canvas-environment";
import { PairConnector3D, PartnerSpoke } from "./canvas-connectors";
import { ParticleField } from "./particle-field";
import {
  computeLayerZOffset,
  computeStarFlythroughLayer,
  flythroughStarZ,
  FOCUS_MARKER_POSITION,
  pairPartnerPosition,
  partnerRingPosition,
  resolveClusterPosition,
  resolveStarRenderTarget,
  roleForStar,
  starWorldPosition,
} from "./math";
import type {
  ArchiveSelection,
  CameraTarget,
  FlythroughLayer,
  LobbyState,
  RosterSubview,
  StarClickHandlers,
  StarMark,
  Vec3,
  ViewMode,
} from "./types";
import type { PairArchiveEdge } from "../../services/pair-archive-graph";
import type { PairEdgeRenderSpec } from "./archive-layout";
import type { LayerNavigationMode } from "./layer-access";
import { buildFlareTexture, buildRimLightTexture, buildSoftSparkleTexture } from "./textures";
import { StarField } from "./star-field";
import { useLayerNavigation } from "./use-layer-navigation";

const EMPTY_ELIGIBLE_PARTNER_IDS: ReadonlySet<string> = new Set();
const EMPTY_OFF_TONIGHT_IDS: ReadonlySet<string> = new Set();

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
 * Returns a ReactElement (not bare ReactNode) so `ActiveCardAnchor` can clone
 * it with the per-member key that AnimatePresence needs to detect swaps.
 */
export type RenderHoverCard = ActiveCardRenderHoverCard;

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
  layerNavigationMode,
  cathedralScrollRef,
  focusedIds,
  offTonightSet,
  rosterSubview,
  pairMoodByPartnerId,
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
  renderArchiveEdgeTooltip?: (edge: PairArchiveEdge) => ReactNode;
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
  layerNavigationMode?: LayerNavigationMode;
  cathedralScrollRef?: RefObject<HTMLDivElement | null>;
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
  /**
   * Per-eligible-partner pair mood (relationshipHealth, 0..100) keyed by
   * partner member id. Drives the constellation spokes drawn from the
   * pinned focus to each ringed eligible during state === "focus_selected".
   * Missing entries fall back to a neutral midline so untouched pairs still
   * get a spoke, but in the steady violet color band.
   */
  pairMoodByPartnerId?: ReadonlyMap<string, number>;
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

  useLayerNavigation({
    currentLayer,
    viewMode,
    cathedralScrollRef,
    onLayerChange,
    navigationMode: layerNavigationMode,
  });

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
  const focusOrder = useMemo<readonly string[]>(
    () => (focusedIds === undefined ? [] : Array.from(focusedIds)),
    [focusedIds],
  );

  // Layer-1 roster cluster order. The active subview's cohort packs into a
  // viewport-fitting grid (see `rosterClusterPosition`) so every pickable face
  // fits on screen at once. Iteration order matches use-roster-fold's set
  // construction (which walks save.members in roster order), giving each
  // member a stable slot across renders. Falls back to empty when the player
  // isn't on layer 1 so the cluster releases as they scroll between layers.
  const rosterLeadOrder = useMemo<readonly string[]>(() => {
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
      rosterSubview,
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
    rosterSubview,
  ]);

  return (
    <>
      <CameraRig
        target={cameraTarget}
        parallax={showParallax && activeStarId === null}
        freezeParallax={hudOverlayHovered}
        reducedMotion={reducedMotion}
      />
      <SceneBackground />
      <fog attach="fog" args={["#2a1a3f", 16, 44]} />

      <Lights state={state} focusStar={focusStar} partnerStar={partnerStar} />

      <ParticleField count={620} />

      <StarField
        state={state}
        stars={stars}
        focusStar={focusStar}
        focusId={focusId}
        partnerId={partnerId}
        eligiblePartnerSet={eligiblePartnerSet}
        viewMode={viewMode}
        archivePositions={archiveData?.positions}
        archiveIsolation={archiveIsolation}
        starClickHandlers={starClickHandlers}
        focusedIds={focusedIds}
        currentLayer={currentLayer}
        focusOrder={focusOrder}
        rosterLeadOrder={rosterLeadOrder}
        rosterSubview={rosterSubview}
        offTonightSet={offTonightSet}
        textures={textures}
        flareTexture={flareTexture}
        haloTexture={haloTexture}
        rimLightTexture={rimLightTexture}
        showAuras={showAuras}
        reducedMotion={reducedMotion}
        hoveredId={hoveredId}
        activeStarId={activeStarId}
        onHoveredIdChange={setHoveredId}
        onHudOverlayHoveredChange={setHudOverlayHovered}
      />

      {viewMode === "archive" && archiveData !== undefined ? (
        <ArchiveEdgeLayer
          edges={archiveData.edges}
          archiveSelection={archiveSelection}
          archiveIsolation={archiveIsolation}
          hoveredStarId={hoveredId}
          hoveredEdgeId={hoveredEdgeId}
          onHoveredEdgeChange={setHoveredEdgeId}
          onArchiveEdgeHover={onArchiveEdgeHover}
          onArchiveEdgeClick={onArchiveEdgeClick}
          renderArchiveEdgeTooltip={renderArchiveEdgeTooltip}
        />
      ) : null}

      {viewMode === "tonight" && pairConnectorEndpoint !== null && focusPos !== null ? (
        <PairConnector3D from={focusPos} to={pairConnectorEndpoint} />
      ) : null}

      {viewMode === "tonight" &&
      state === "focus_selected" &&
      currentLayer === 1 &&
      rosterSubview === "eligibles" &&
      focusPos !== null &&
      hoveredId !== null &&
      eligiblePartnerSet.has(hoveredId)
        ? (() => {
            // Single spoke from the focus to whichever eligible partner the
            // player is currently pointing at. Drawing all spokes at once
            // produced a star-burst that washed the field; the spoke now
            // reads as a directed "this pair" line that follows the cursor.
            // Endpoint anchors on slab Z planes (focus z ≈ 6, partners z ≈
            // -1.5) so the line ends visually touch the sprite centers.
            const index = rosterLeadOrder.indexOf(hoveredId);
            if (index === -1) return null;
            const focusSpokeOrigin: Vec3 = {
              x: focusPos.x,
              y: focusPos.y,
              z: flythroughStarZ(0),
            };
            const ring = partnerRingPosition(index, rosterLeadOrder.length);
            const partnerEnd: Vec3 = { x: ring.x, y: ring.y, z: flythroughStarZ(1) };
            const health = pairMoodByPartnerId?.get(hoveredId) ?? 50;
            return (
              <PartnerSpoke from={focusSpokeOrigin} to={partnerEnd} health={health} highlighted />
            );
          })()
        : null}

      <ActiveCardAnchor
        activeStar={activeStar}
        activePos={activePos}
        renderHoverCard={renderHoverCard}
      />

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
