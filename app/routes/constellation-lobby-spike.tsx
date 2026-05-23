/**
 * R&D spike v6 for the constellation lobby rewrite. This route exists to answer
 * the design question "what should the primary pre-date screen feel like?"
 * before any architecture lands. It uses fixture members, local state only, and
 * no game services. Plan: app/docs/roadmap/constellation-lobby-spike.tsx.
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
 * Single file by design. We expect to throw most of this code away once the
 * foundation plan picks up the approved direction.
 */

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Billboard, Html, Line, useTexture } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { Member } from "../domain/game";
import { starterMembers } from "../fixtures/members";
import { getMemberAuraConfig } from "../components/member-aura-registry";
import { resolvePortraitPalette, type PortraitPalette } from "../components/portrait-palette";
import { caseFileNumber } from "../components/member-card-atoms";
import { createSeededRandom } from "../services/utils";
import { PixelRainTrail, ShimmerPixels } from "../components/constellation-lobby/pixel-rain";
import {
  advanceFlythroughLayer,
  computeFlythroughCameraTarget,
  computeStarFlythroughLayer,
  flythroughMemberSlabActivity,
  flythroughStarZ,
  haloColorForStar,
  rainColorForStar,
  rainDensityForStar,
} from "../components/constellation-lobby/math";
import type {
  CameraTarget,
  FlythroughLayer,
  LobbyScenario,
  LobbyState,
  StarAvailability,
  StarFlythroughLayer,
  StarMark,
  StarRole,
  StarTier,
  Vec3,
} from "../components/constellation-lobby/types";

export function meta() {
  return [
    { title: "IDC | Constellation lobby spike" },
    { name: "description", content: "R&D spike for the constellation lobby primary screen." },
  ];
}

// Types are shared with the production lobby — see
// app/components/constellation-lobby/types.ts.

const FIELD_SEED = "constellation-spike.v6.layout";
const FIELD_PADDING_X = 8;
const FIELD_PADDING_Y = 14;
const FIELD_MIN_SPACING = 9;

const WORLD_X_SCALE = 0.22; // star.x (0-100) -> world x (-11..+11)
const WORLD_Y_SCALE = -0.12; // star.y (0-100) -> world y (+6..-6, flipped)
const WORLD_Z_SCALE = 0.05; // star.z (-260..+60) -> world z (-13..+3) — broad depth so perspective parallax actually reads

const FOCUS_ID = "jenna-pike";
const PARTNER_ID = "ryan-doyle";

const ELIGIBLE_PARTNER_IDS = new Set<string>([
  "ryan-doyle",
  "marcus-pellish",
  "brady-strait",
  "kade-sumner",
  "fred-stavropoulos",
  "calvin-hewes",
  "toby-wenz",
  "noah-kim",
  "alex-yoon",
  "gideon-glass",
]);

const COOLING_IDS = new Set<string>(["mei-sato", "mira-park", "sana-karim"]);
const OFF_SHIFT_IDS = new Set<string>(["aldric-vale-marsh", "anubis", "anansi", "cthala"]);
const CLOSED_IDS = new Set<string>(["concord", "epsy"]);

const MOCK_SCENARIOS: LobbyScenario[] = [
  {
    id: "weeknight-diner",
    title: "Weeknight Diner Run",
    venue: "Big Sky Diner, 9:40pm booth",
    cost: 38,
    axes: { risk: 1, intimacy: 2, chaos: 1 },
    roomRead: "steady",
  },
  {
    id: "lakeside-walk",
    title: "Lakeside Walk + Stand",
    venue: "Marrow Pier, hot pretzel stand",
    cost: 22,
    axes: { risk: 2, intimacy: 3, chaos: 2 },
    roomRead: "promising",
  },
  {
    id: "off-strip-karaoke",
    title: "Off-Strip Karaoke Loft",
    venue: "Velour Room, mezzanine, weeknight rate",
    cost: 64,
    axes: { risk: 3, intimacy: 3, chaos: 4 },
    roomRead: "volatile",
  },
];

/* ============================================================================
 * Top-level route component.
 * ========================================================================== */

export default function ConstellationLobbySpike() {
  const [state, setState] = useState<LobbyState>("idle");
  const [showAuras, setShowAuras] = useState(true);
  const [showParallax, setShowParallax] = useState(true);
  /**
   * Flythrough layer the player has scrolled into. Scroll-down advances
   * 0 → 1 → 2 → 3, scroll-up reverses; the throttle inside Scene's wheel
   * handler ensures a normal wheel notch advances one layer per tick. The
   * layer state is orthogonal to LobbyState — the player can traverse the
   * member slabs and the scenarios layer regardless of whether they've
   * committed to a focus / partner / scenario.
   */
  const [currentLayer, setCurrentLayer] = useState<FlythroughLayer>(0);
  /** Selected scenario id when the player commits one from the scenarios layer. */
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const stars = useMemo<StarMark[]>(() => buildStars(starterMembers), []);
  const focusStar = stars.find((s) => s.member.id === FOCUS_ID);
  const partnerStar = stars.find((s) => s.member.id === PARTNER_ID);

  /**
   * Spike layer membership. Layer 0 is the seeded focus case + a couple
   * starter focus stars to populate the slab. Layer 1 = the eligible set.
   * Layer 2 is implicit (everyone else: cooling / off_shift / closed).
   */
  const focusedIds = useMemo<ReadonlySet<string>>(
    () => new Set<string>([FOCUS_ID, "ryan-doyle", "mei-sato", "marcus-pellish"]),
    [],
  );

  // Camera target derives from the lobby state for the selection workflow
  // OR from the flythrough layer when the player has scrolled past layer 0.
  // Layer-0 framing defers to the LobbyState camera so existing focus /
  // partner / committed framings still feel anchored.
  const cameraTarget =
    currentLayer === 0 && state !== "idle"
      ? computeCameraTarget(state, focusStar)
      : computeFlythroughCameraTarget(currentLayer, focusStar);
  const reducedMotion = useReducedMotion() === true;

  const showFocusChip = state !== "idle" && state !== "callout_heavy" && focusStar !== undefined;
  const showPartnerChip =
    (state === "partner_selected" || state === "committed_pair" || state === "scenario_chosen") &&
    partnerStar !== undefined;
  // Scenarios-as-3D land on layer 3, regardless of the booking state — the
  // player is exploring the scenarios layer. The legacy floating ScenarioPanel
  // still shows once a pair is committed, but only while the player is back
  // on a member layer (so the floating UI doesn't double the in-canvas grid).
  const showFloatingScenario =
    (state === "committed_pair" || state === "scenario_chosen") && currentLayer !== 3;
  const scenarioLocked = state === "scenario_chosen";

  const handleScenarioClick = useCallback((scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07041a] text-aura-paper">
      <div className="absolute inset-0">
        <Canvas
          dpr={[1, 1.6]}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            powerPreference: "high-performance",
          }}
          camera={{ position: [0, 0, 17], fov: 38, near: 0.1, far: 80 }}
        >
          <Suspense fallback={null}>
            <Scene
              state={state}
              stars={stars}
              focusStar={focusStar}
              partnerStar={partnerStar}
              cameraTarget={cameraTarget}
              showAuras={showAuras}
              showParallax={showParallax}
              reducedMotion={reducedMotion}
              currentLayer={currentLayer}
              onLayerChange={setCurrentLayer}
              focusedIds={focusedIds}
              flythroughScenarios={MOCK_SCENARIOS}
              selectedScenarioId={selectedScenarioId}
              onScenarioClick={handleScenarioClick}
            />
          </Suspense>
        </Canvas>
      </div>

      <TopBar state={state} />
      <SideRail
        state={state}
        focus={showFocusChip ? focusStar : undefined}
        partner={showPartnerChip ? partnerStar : undefined}
      />
      <BottomDock
        state={state}
        focus={focusStar}
        partner={partnerStar}
        selectedScenarioId={scenarioLocked ? "lakeside-walk" : selectedScenarioId}
      />

      <AnimatePresence>
        {showFloatingScenario ? (
          <ScenarioPanel
            key="scenario"
            scenarios={MOCK_SCENARIOS}
            selectedId={scenarioLocked ? "lakeside-walk" : null}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {state === "callout_heavy" ? <CalloutCluster key="cluster" /> : null}
      </AnimatePresence>

      <LayerIndicator currentLayer={currentLayer} onLayerSelect={setCurrentLayer} />

      <SpikeControls
        state={state}
        onState={setState}
        showAuras={showAuras}
        onShowAuras={setShowAuras}
        showParallax={showParallax}
        onShowParallax={setShowParallax}
      />
    </div>
  );
}

/* ============================================================================
 * 3D scene root. All R3F primitives live below this. We preload the avatar
 * textures once via Suspense, then hand them down to each StarSprite.
 * ========================================================================== */

/**
 * Optional render-prop the production lobby uses to inject a knowledge-gated
 * HoverDetailCard with real save state (focus handlers, swap penalty, sealed
 * counts). The spike falls back to a vanilla card when this prop is absent.
 */
export type RenderHoverCard = (args: {
  star: StarMark;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => ReactNode;

/**
 * Optional callbacks the production lobby uses to drive focus picking, swap
 * targeting, reselect-mode toggling, and case-file zoom from star pointer
 * events. The spike does not need any of these (it cycles state via the
 * R&D SpikeControls panel).
 */
export type StarClickHandlers = {
  onStarClick?: (star: StarMark, event: ThreeEvent<MouseEvent>) => void;
  onStarDoubleClick?: (star: StarMark, event: ThreeEvent<MouseEvent>) => void;
  /** When provided, overrides the default ELIGIBLE_PARTNER_IDS set. */
  eligiblePartnerIds?: ReadonlySet<string>;
  /** Stars not in this set get extra dimming. Used by the lens filter. */
  filterMatchedIds?: ReadonlySet<string>;
};

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
  currentLayer,
  onLayerChange,
  focusedIds,
  flythroughScenarios,
  selectedScenarioId,
  onScenarioClick,
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
   * Discrete depth slab the player has scrolled into. When provided, Scene
   * mounts a wheel handler that advances the layer per scroll tick instead
   * of the previous cycle-focus behavior, and overlays per-layer slab
   * activity (active layer pulled forward, others receded) on top of the
   * existing role-driven star treatment.
   */
  currentLayer?: FlythroughLayer;
  onLayerChange?: (next: FlythroughLayer) => void;
  /**
   * Member ids that live on layer 0 (focus slab). Layer 1 is eligible
   * partners (derived from eligiblePartnerIds in starClickHandlers, with
   * fallback to the spike's default ELIGIBLE_PARTNER_IDS); layer 2 is
   * everyone else. Required for the layer-flythrough overlay; when
   * undefined, the Scene falls back to no slab treatment.
   */
  focusedIds?: ReadonlySet<string>;
  /**
   * Scenarios rendered as 3D card meshes on layer 3. When undefined, the
   * Scene skips the scenarios-layer treatment entirely.
   */
  flythroughScenarios?: LobbyScenario[];
  selectedScenarioId?: string | null;
  onScenarioClick?: (scenarioId: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dismissTimerRef = useRef<number | null>(null);

  // R&D debug hook: `?hover=<memberId>` pins a hover state on mount so the
  // detail card can be verified without a real pointer. Safe to keep through
  // the spike — the param is opt-in and only seeds initial state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const debugHover = params.get("hover");
    if (debugHover !== null && debugHover.length > 0) {
      setHoveredId(debugHover);
    }
  }, []);

  const setHoverWithGrace = useCallback((id: string | null) => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (id === null) {
      dismissTimerRef.current = window.setTimeout(() => {
        setHoveredId(null);
        dismissTimerRef.current = null;
      }, 160);
    } else {
      setHoveredId(id);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, []);

  // Layer-flythrough scroll handler. Each wheel tick advances `currentLayer`
  // by one step in the scroll direction, throttled so a single mouse-wheel
  // motion advances one layer rather than several. Disabled when the parent
  // didn't wire `onLayerChange` — the spike's old cycle-hover-through-eligibles
  // behavior is gone; the parent owns layer state.
  const currentLayerRef = useRef<FlythroughLayer | undefined>(currentLayer);
  useEffect(() => {
    currentLayerRef.current = currentLayer;
  }, [currentLayer]);

  useEffect(() => {
    if (onLayerChange === undefined) return;
    const lastAdvanceRef = { current: 0 };
    const handleWheel = (event: WheelEvent) => {
      const dominantDelta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(dominantDelta) < 4) return;
      const now = performance.now();
      // 220ms throttle — a normal mouse-wheel motion advances one layer per
      // tick instead of zipping through all four. Trackpad inertia still
      // produces multiple events per gesture but is similarly clamped.
      if (now - lastAdvanceRef.current < 220) {
        event.preventDefault();
        return;
      }
      lastAdvanceRef.current = now;
      event.preventDefault();
      const dir: 1 | -1 = dominantDelta > 0 ? 1 : -1;
      const next = advanceFlythroughLayer(currentLayerRef.current ?? 0, dir);
      if (next !== currentLayerRef.current) {
        onLayerChange(next);
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [onLayerChange]);

  const sources = useMemo(
    () =>
      Object.fromEntries(
        stars.map((s) => [s.member.id, `/assets/portraits/${s.member.id}/avatar-256.png`]),
      ),
    [stars],
  );
  const textures = useTexture(sources) as Record<string, THREE.Texture>;

  useEffect(() => {
    // Per-texture aspect-ratio compensation. The avatar PNGs are not all
    // square — many are 256x320, 256x384, 256x171, etc. — and a uniform UV
    // transform stretches the non-square ones across the disc. Sample a
    // square pixel region from each texture, biased toward the upper portion
    // where the head sits.
    Object.values(textures).forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      const img = t.image as { width?: number; height?: number } | undefined;
      const w = img?.width ?? 256;
      const h = img?.height ?? 256;
      const aspect = w / h;
      const baseCrop = 0.82;
      if (aspect >= 1) {
        // Wide / square texture: head is roughly centered. Sample a square
        // region matching the height, cropped by baseCrop, centered with a
        // slight upward bias.
        t.repeat.set(baseCrop / aspect, baseCrop);
        t.center.set(0.5, 0.55);
      } else {
        // Tall texture: head is at the top. Sample a square region matching
        // the width, cropped by baseCrop, with the sample anchored near the
        // top of the texture so we keep the face and clip the body.
        const repeatY = baseCrop * aspect;
        t.repeat.set(baseCrop, repeatY);
        // Place the sample so its top edge sits just below V=1.0 — gives a
        // small margin for forehead/hair without missing the top of the head.
        t.center.set(0.5, 1.0 - 0.04 - repeatY / 2);
      }
      t.needsUpdate = true;
    });
  }, [textures]);

  const flareTexture = useMemo(() => buildFlareTexture(), []);

  const focusPos = focusStar ? starWorldPosition(focusStar) : null;
  const partnerNatural = partnerStar ? starWorldPosition(partnerStar) : null;
  const partnerCompressed = focusStar ? pairPartnerPosition(focusStar) : null;
  // stars.find returns `undefined`, not `null`, so we normalize to a single
  // `undefined` sentinel — the JSX `!== undefined` guard then narrows
  // hoveredStar to a real StarMark for the children.
  const hoveredStar =
    hoveredId === null ? undefined : (stars.find((s) => s.member.id === hoveredId) ?? undefined);
  const hoveredPos = hoveredStar ? starWorldPosition(hoveredStar) : null;

  const pairConnectorEndpoint =
    state === "committed_pair" || state === "scenario_chosen"
      ? partnerCompressed
      : state === "partner_selected"
        ? partnerNatural
        : null;

  const eligiblePartnerSet = starClickHandlers?.eligiblePartnerIds ?? ELIGIBLE_PARTNER_IDS;
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

  return (
    <>
      <CameraRig target={cameraTarget} parallax={showParallax} reducedMotion={reducedMotion} />
      <SceneBackground />
      <fog attach="fog" args={["#0d061f", 16, 44]} />

      <Lights state={state} focusStar={focusStar} partnerStar={partnerStar} />

      <ParticleField count={620} />

      {stars.map((star) => {
        const role = roleForStar(star, {
          state,
          focusId,
          partnerId,
          eligiblePartnerIds: eligiblePartnerSet,
        });
        const overridePos = role === "partner" && focusStar ? pairPartnerPosition(focusStar) : null;
        const layerZOffset = computeLayerZOffset(role, state);
        const filteredOut =
          starClickHandlers?.filterMatchedIds !== undefined &&
          !starClickHandlers.filterMatchedIds.has(star.member.id);
        // Flythrough slab membership. Each star lives on exactly one of the
        // three member layers (0 focus, 1 eligible, 2 off-tonight). We
        // compute it here so StarSprite can lerp to the slab Z and pick up
        // the active-layer scale/opacity multipliers in its useFrame.
        const flythroughLayer: StarFlythroughLayer | undefined =
          focusedIds === undefined
            ? undefined
            : computeStarFlythroughLayer(star.member.id, {
                focusedIds,
                eligibleIds: eligiblePartnerSet,
              });
        const slabActivity =
          flythroughLayer === undefined || currentLayer === undefined
            ? undefined
            : flythroughMemberSlabActivity(flythroughLayer, currentLayer);
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
            showAura={showAuras}
            reducedMotion={reducedMotion}
            filteredOut={filteredOut}
            hovered={hoveredId === star.member.id}
            flythroughLayer={flythroughLayer}
            slabActivity={slabActivity}
            onHoverEnter={() => setHoverWithGrace(star.member.id)}
            onHoverLeave={() => setHoverWithGrace(null)}
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

      {flythroughScenarios !== undefined && flythroughScenarios.length > 0 ? (
        <ScenarioCardField3D
          scenarios={flythroughScenarios}
          currentLayer={currentLayer ?? 0}
          selectedScenarioId={selectedScenarioId ?? null}
          onScenarioClick={onScenarioClick}
          reducedMotion={reducedMotion}
        />
      ) : null}

      {pairConnectorEndpoint !== null && focusPos !== null ? (
        <PairConnector3D from={focusPos} to={pairConnectorEndpoint} />
      ) : null}

      {showHoverConnector && focusPos !== null && hoveredPos !== null ? (
        <HoverConnector from={focusPos} to={hoveredPos} />
      ) : null}

      <AnimatePresence>
        {hoveredStar !== undefined &&
        hoveredPos !== null &&
        hoveredId !== focusId &&
        hoveredId !== partnerId ? (
          <Html
            key={hoveredStar.member.id}
            position={[hoveredPos.x, hoveredPos.y, hoveredPos.z]}
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
                renderHoverCard({
                  star: hoveredStar,
                  onMouseEnter: () => setHoverWithGrace(hoveredStar.member.id),
                  onMouseLeave: () => setHoverWithGrace(null),
                })
              ) : (
                <HoverDetailCard
                  star={hoveredStar}
                  onMouseEnter={() => setHoverWithGrace(hoveredStar.member.id)}
                  onMouseLeave={() => setHoverWithGrace(null)}
                />
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

export function CameraRig({
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

export function Lights({
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
 * Scene background. We paint a soft dusk-gradient on a canvas once and assign
 * it as scene.background so it always sits behind the fog/particles without
 * being affected by camera distance.
 * ========================================================================== */

export function SceneBackground() {
  const texture = useMemo(() => buildBackdropTexture(), []);
  return <primitive attach="background" object={texture} />;
}

function buildBackdropTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1152;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return new THREE.CanvasTexture(canvas);
  }

  const baseGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  baseGradient.addColorStop(0, "#07041a");
  baseGradient.addColorStop(0.36, "#0d061f");
  baseGradient.addColorStop(0.7, "#150828");
  baseGradient.addColorStop(1, "#1d0a2a");
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const warm = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.62,
    0,
    canvas.width * 0.5,
    canvas.height * 0.62,
    canvas.width * 0.45,
  );
  warm.addColorStop(0, "rgba(245, 158, 11, 0.45)");
  warm.addColorStop(0.5, "rgba(244, 63, 94, 0.32)");
  warm.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tl = ctx.createRadialGradient(
    canvas.width * 0.12,
    canvas.height * 0.08,
    0,
    canvas.width * 0.12,
    canvas.height * 0.08,
    canvas.width * 0.55,
  );
  tl.addColorStop(0, "rgba(167, 139, 250, 0.48)");
  tl.addColorStop(0.5, "rgba(167, 139, 250, 0.16)");
  tl.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = tl;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tr = ctx.createRadialGradient(
    canvas.width * 0.9,
    canvas.height * 0.12,
    0,
    canvas.width * 0.9,
    canvas.height * 0.12,
    canvas.width * 0.45,
  );
  tr.addColorStop(0, "rgba(217, 70, 239, 0.36)");
  tr.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = tr;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const vignette = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.height * 0.35,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.height * 0.85,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(7, 4, 26, 0.7)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ============================================================================
 * Lens-flare cross. Bright center + four long thin arms + a softer cross at
 * 45°. Composited additively over stars, this is what turns "lit avatar" into
 * "actually feels like a star."
 * ========================================================================== */

function buildFlareTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 512, 512);

  // Small soft inner bloom — kept tight so the flare reads as a sharp star
  // glint sitting on the bubble rather than a blob smeared across the face.
  const halo = ctx.createRadialGradient(256, 256, 0, 256, 256, 42);
  halo.addColorStop(0, "rgba(255, 246, 222, 0.9)");
  halo.addColorStop(0.5, "rgba(255, 238, 200, 0.25)");
  halo.addColorStop(1, "rgba(255, 232, 188, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 512, 512);

  // Cross arms — long horizontal/vertical streaks built from gradients so they
  // taper rather than ending in hard edges. Thinner than v6.2 so the arms read
  // as a glint, not a glare.
  const drawArm = (angleDeg: number, len: number, width: number, alpha: number) => {
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate((angleDeg * Math.PI) / 180);
    const grad = ctx.createLinearGradient(-len, 0, len, 0);
    grad.addColorStop(0, "rgba(255, 244, 220, 0)");
    grad.addColorStop(0.45, `rgba(255, 244, 220, ${alpha * 0.7})`);
    grad.addColorStop(0.5, `rgba(255, 252, 240, ${alpha})`);
    grad.addColorStop(0.55, `rgba(255, 244, 220, ${alpha * 0.7})`);
    grad.addColorStop(1, "rgba(255, 244, 220, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(0, -width);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawArm(0, 240, 1.6, 0.9);
  drawArm(90, 240, 1.6, 0.9);
  drawArm(45, 150, 1.0, 0.42);
  drawArm(-45, 150, 1.0, 0.42);

  // Tight bright nucleus — small so the cross arms read clearly without a
  // wide bright blob in the center.
  const core = ctx.createRadialGradient(256, 256, 0, 256, 256, 14);
  core.addColorStop(0, "rgba(255, 255, 255, 1)");
  core.addColorStop(0.6, "rgba(255, 252, 240, 0.5)");
  core.addColorStop(1, "rgba(255, 248, 224, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ============================================================================
 * Particle field. Seeded dust at varied depths. Catches fog and bloom, gives
 * the field its sense of volume between camera and backdrop.
 * ========================================================================== */

export function ParticleField({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const nearRef = useRef<THREE.Points>(null);

  const deep = useMemo(() => {
    const rng = createSeededRandom("constellation-spike.v6.dust.deep");
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3 + 0] = (rng() - 0.5) * 48;
      pos[i * 3 + 1] = (rng() - 0.5) * 30;
      pos[i * 3 + 2] = -6 - rng() * 18;
    }
    return pos;
  }, [count]);

  // Near-camera layer — fewer, larger motes that drift in front of the stars.
  // This is the layer that visibly screams "we are inside a volume," not in
  // front of a flat backdrop, because the cursor lead-ahead moves these motes
  // way more than the stars behind.
  const nearCount = Math.floor(count * 0.18);
  const near = useMemo(() => {
    const rng = createSeededRandom("constellation-spike.v6.dust.near");
    const pos = new Float32Array(nearCount * 3);
    for (let i = 0; i < nearCount; i += 1) {
      pos[i * 3 + 0] = (rng() - 0.5) * 26;
      pos[i * 3 + 1] = (rng() - 0.5) * 16;
      pos[i * 3 + 2] = 2 + rng() * 7;
    }
    return pos;
  }, [nearCount]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ref.current !== null) ref.current.rotation.z = t * 0.006;
    if (nearRef.current !== null) nearRef.current.rotation.z = -t * 0.014;
  });

  return (
    <>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[deep, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          sizeAttenuation
          color="#ffe6c8"
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={nearRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[near, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          sizeAttenuation
          color="#ffe2c4"
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

/* ============================================================================
 * Star sprite. Billboard group containing: additive halo behind, lit avatar
 * plane center, ring frame on top. Position + scale + opacity are damped each
 * frame so role transitions feel mechanical free.
 * ========================================================================== */

/**
 * Build a star polygon as a flat ShapeGeometry — `points` outer spikes alternating
 * with `points` inner notches around (0, 0). The inner notch radius is set to the
 * avatar circle's outer edge so the inner vertices tuck behind the circle and only
 * the outer spike tips poke through; the result reads as a circle wearing star
 * points along its border rather than a separate star next to a circle.
 */
function makeStarPointsGeometry(
  outerRadius: number,
  innerRadius: number,
  points = 5,
): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const angleStep = Math.PI / points;
  for (let i = 0; i < points * 2; i += 1) {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 1);
}

export function StarSprite({
  star,
  role,
  state,
  overridePos,
  layerZOffset,
  texture,
  flareTexture,
  showAura,
  reducedMotion,
  filteredOut = false,
  hovered = false,
  flythroughLayer,
  slabActivity,
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
  showAura: boolean;
  reducedMotion: boolean;
  /** Lens-filter excluded this star — gets extra dimming + lower opacity. */
  filteredOut?: boolean;
  /**
   * The HoverDetailCard is morphing out of this star — hide the 3D mesh so
   * the card reads as the same element (i.e. the star itself becoming the
   * card) instead of doubling-up over the avatar mesh that's still rendered
   * underneath.
   */
  hovered?: boolean;
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
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onDoubleClick?: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const avatarMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const innerRimMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const flareMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const flareMeshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);

  const natural = useMemo(() => starWorldPosition(star), [star]);
  const sizing = useMemo(() => sizeForStar3D(star.tier, role, state), [star.tier, role, state]);
  const ringColor = useMemo(
    () => ringColorForRole(role, state, star.palette),
    [role, state, star.palette],
  );
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
  // Pixel-rain tint + density derived per role: focus/partner cascade heavy
  // with the active-pair color, eligibles cascade in their aura color, dim
  // stars get a sparse trickle, closed stars get nothing so the closed-case
  // glyph reads cleanly. See app/components/constellation-lobby/math.ts.
  const rainColor = useMemo(
    () => rainColorForStar(role, star.palette, star.aura),
    [role, star.palette, star.aura],
  );
  const rainCount = useMemo(
    () => rainDensityForStar(role, star.tier, state),
    [role, star.tier, state],
  );
  // Shimmer pixels sit AT the star, not below. Reserved for active roles so
  // we don't fight the dim field for attention.
  const shimmerCount = role === "focus" ? 7 : role === "partner" ? 6 : role === "eligible" ? 4 : 0;
  // Star-points geometry — five spikes radiating from the circle border so
  // the bubble reads as an actual star. Inner notch matches the avatar's
  // outer edge so the inner vertices tuck behind the circle and only the
  // outer tips show through. Spike protrusion grows with role weight so the
  // focus pair gets the most dramatic star silhouette.
  const starPointsGeometry = useMemo(() => {
    const protrusion =
      role === "focus" || role === "partner"
        ? 1.34
        : role === "eligible"
          ? 1.26
          : role === "ineligible_cooling"
            ? 1.2
            : 1.18;
    return makeStarPointsGeometry(sizing.avatarRadius * protrusion, sizing.avatarRadius * 0.92, 5);
  }, [role, sizing.avatarRadius]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;

    if (groupRef.current !== null) {
      const driftAmp = role === "focus" || role === "partner" ? 0.045 : 0.075;
      const driftX = Math.sin(t * 0.28 + star.phase) * driftAmp;
      const driftY = Math.cos(t * 0.21 + star.phase * 1.43) * driftAmp;

      const targetX = (overridePos?.x ?? natural.x) + driftX;
      const targetY = (overridePos?.y ?? natural.y) + driftY;
      // Flythrough overrides the legacy role-driven Z stack: when a slab is
      // assigned, the star lerps to the slab's absolute Z (with a small jitter
      // pulled from the seeded natural Z so the slab has internal depth).
      const flythroughZ =
        flythroughLayer === undefined ? null : flythroughStarZ(flythroughLayer) + natural.z * 0.18;
      const targetZ =
        flythroughZ !== null ? flythroughZ : (overridePos?.z ?? natural.z) + layerZOffset;

      const moveLerp = reducedMotion ? 1 : 1 - Math.pow(0.0008, delta);
      const pos = groupRef.current.position;
      pos.x = THREE.MathUtils.lerp(pos.x, targetX, moveLerp);
      pos.y = THREE.MathUtils.lerp(pos.y, targetY, moveLerp);
      pos.z = THREE.MathUtils.lerp(pos.z, targetZ, moveLerp);

      const scaleLerp = reducedMotion ? 1 : 1 - Math.pow(0.002, delta);
      const slabScale = slabActivity?.scaleMultiplier ?? 1;
      scaleRef.current = THREE.MathUtils.lerp(
        scaleRef.current,
        sizing.scale * slabScale,
        scaleLerp,
      );
      groupRef.current.scale.setScalar(scaleRef.current);
    }

    // Slab activity multiplier from the flythrough layer state. Same value
    // applies to avatar opacity, halo, ring, and flare so the entire star
    // dims/sharps together when the player scrolls between layers. The
    // hovered-card grace and lens-filter dim still composes on top.
    const slabIntensity = slabActivity?.intensityMultiplier ?? 1;

    if (avatarMatRef.current !== null) {
      // filteredOut multiplies intensity by 0.32 so non-matching cases dim
      // visibly without disappearing — the field stays a constellation, the
      // lens just spotlights what matches.
      const filterMultiplier = filteredOut ? 0.32 : 1;
      avatarMatRef.current.opacity = THREE.MathUtils.lerp(
        avatarMatRef.current.opacity,
        intensity * filterMultiplier * slabIntensity,
        Math.min(1, delta * 5),
      );
      const desat = role === "ineligible_off_shift" || role === "ineligible_closed" || filteredOut;
      const cool = role === "ineligible_cooling";
      avatarMatRef.current.color.setRGB(
        desat ? 0.5 : cool ? 0.92 : 1,
        desat ? 0.5 : cool ? 0.85 : 1,
        desat ? 0.55 : cool ? 0.88 : 1,
      );
    }
    // Halo + flare both ride the slow sin pulse so each star has a distinct
    // alive cadence instead of a synchronized strobe. The slow component
    // drives the bubble's breathing, computed before the materials so any
    // dependent value (haloPulse, flare base) can multiply against it.
    const slow = Math.sin(t * 1.4 + star.phase) * 0.5 + 0.5;
    // Halo pulse — modulate around the role target so the bubble visibly
    // breathes. Active roles get a deeper pulse so the player can feel the
    // focus/partner draw attention; dim stars get a shallower pulse so they
    // don't twitch in the background. Bloom multiplies any overshoot, so we
    // keep the modulation amplitude conservative.
    const haloPulse = reducedMotion ? 1 : 0.78 + slow * 0.34;

    if (haloMatRef.current !== null) {
      // Bumped role targets from v6.2 so the rim glow reads as "this is a
      // star" rather than "this is a coin in a velvet pocket". Bloom in the
      // post pass amplifies it further once the value crosses the luminance
      // threshold, so we don't have to push these all the way to 1.
      const baseTarget =
        role === "focus" ? 0.72 : role === "partner" ? 0.58 : role === "eligible" ? 0.32 : 0.06;
      const target = baseTarget * haloPulse * slabIntensity;
      haloMatRef.current.opacity = THREE.MathUtils.lerp(
        haloMatRef.current.opacity,
        showAura ? target : target * 0.4,
        Math.min(1, delta * 5),
      );
    }
    if (ringMatRef.current !== null) {
      const target =
        role === "focus" ? 1 : role === "partner" ? 0.95 : role === "eligible" ? 0.75 : 0.3;
      ringMatRef.current.opacity = THREE.MathUtils.lerp(
        ringMatRef.current.opacity,
        target * intensity * slabIntensity,
        Math.min(1, delta * 5),
      );
    }
    if (innerRimMatRef.current !== null) {
      // Glass-rim opacity tuned per role. Brighter on the active pair so the
      // bubble reads as glass rather than a flat outline; subtle on eligibles.
      const target =
        role === "focus" ? 0.34 : role === "partner" ? 0.28 : role === "eligible" ? 0.14 : 0;
      innerRimMatRef.current.opacity = THREE.MathUtils.lerp(
        innerRimMatRef.current.opacity,
        target * slabIntensity,
        Math.min(1, delta * 5),
      );
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
  // multiplier so cases the lens filtered out cascade visibly dimmer instead
  // of disappearing. Pushed brighter than the v6 baseline so the rain reads
  // distinctly against the ambient ParticleField dust (warm-cream additive
  // dots) — at this intensity each rain particle's RGB clamps high enough
  // that Bloom amplifies it past the dust into a visible cascade.
  const rainIntensity =
    (filteredOut ? 0.42 : 1) * (role === "focus" || role === "partner" ? 2.2 : 1.65);
  // Rain spawn span scales with the halo. Active roles narrow the column so
  // the cascade reads as a vertical stream (Matrix-rain shape) rather than a
  // wide cone — wider drives the wider field stars where presence matters
  // more than read.
  const rainSpawnRadius =
    sizing.haloRadius * (role === "focus" || role === "partner" ? 0.85 : 0.95);
  const rainFallHeight =
    sizing.haloRadius *
    (role === "focus" ? 7 : role === "partner" ? 6 : role === "eligible" ? 4.6 : 3);
  const rainFallSpeed = sizing.haloRadius * (role === "focus" || role === "partner" ? 2.4 : 1.8);
  // Particle size in world units. PointsMaterial with sizeAttenuation maps
  // these to screen pixels through the standard perspective formula — at the
  // camera's default 17-unit distance with role pulled to z~3, focus stars
  // are ~14 world units away. Pushed up from v6 so each rain particle reads
  // as a chunky pixel rather than a faint dust dot that blends with the
  // ParticleField behind it.
  const rainParticleSize =
    sizing.haloRadius *
    (role === "focus" || role === "partner" ? 0.42 : role === "eligible" ? 0.34 : 0.24);

  return (
    <group ref={groupRef} position={[natural.x, natural.y, natural.z]} visible={!hovered}>
      {/* Pixel-rain trail — lives OUTSIDE the Billboard so the cascade falls
          along world -Y instead of rotating with the avatar plane. Parented
          to the group so it inherits position + scale. Sized off the halo
          radius so each star's rain reads in proportion to its bubble. */}
      <PixelRainTrail
        count={rainCount}
        spawnRadius={rainSpawnRadius}
        fallHeight={rainFallHeight}
        fallSpeed={rainFallSpeed}
        color={rainColor}
        intensity={rainIntensity}
        seed={star.member.id}
        reducedMotion={reducedMotion}
        size={rainParticleSize}
      />
      <Billboard>
        {/* Star spikes — a 5-point star polygon sitting just behind the halo
            so the inner notches hide behind the avatar circle and only the
            outer tips poke past the ring. Additive blending lets the spike
            tips bloom with the same palette tint as the halo, so the bubble
            reads as "a star" rather than "a portrait disk". */}
        <mesh position={[0, 0, -0.052]} geometry={starPointsGeometry}>
          <meshBasicMaterial
            color={haloColor}
            transparent
            opacity={
              role === "focus" || role === "partner" ? 0.7 : role === "eligible" ? 0.55 : 0.32
            }
            depthWrite={false}
            fog={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        {/* Soft additive halo */}
        <mesh position={[0, 0, -0.05]}>
          <circleGeometry args={[sizing.haloRadius, 48]} />
          <meshBasicMaterial
            ref={haloMatRef}
            color={haloColor}
            transparent
            opacity={0.001}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>

        {/* Shimmer pixels — additive dots that twinkle AT the star (not falling)
            for the "data energy" pop-glow on active roles. Inside Billboard so
            the cluster always faces the camera; arranged off-center via the
            ShimmerPixels seeded offsets so they ring the avatar rather than
            covering the face. */}
        {shimmerCount > 0 ? (
          <ShimmerPixels
            count={shimmerCount}
            radius={sizing.haloRadius * 0.78}
            color={rainColor}
            intensity={role === "focus" ? 1 : role === "partner" ? 0.9 : 0.7}
            seed={star.member.id}
            reducedMotion={reducedMotion}
            size={sizing.haloRadius * 0.16}
          />
        ) : null}

        {/* Avatar (lit) — circleGeometry clips the cutout PNG to a disc so the
            shoulders / body of the original image cannot bleed past the ring
            frame. The disc radius matches the ring's inner radius so the avatar
            fills exactly inside the frame. */}
        <mesh
          onPointerOver={handlePointerEnter}
          onPointerOut={handlePointerLeave}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <circleGeometry args={[sizing.avatarRadius * 0.92, 96]} />
          <meshStandardMaterial
            ref={avatarMatRef}
            map={texture}
            transparent
            alphaTest={0.08}
            roughness={0.65}
            metalness={0.05}
            depthWrite={false}
            toneMapped
          />
        </mesh>

        {/* Inner glass rim — a thin additive highlight just inside the frame
            so the bubble reads as glass rather than a flat outline. */}
        <mesh position={[0, 0, 0.0008]}>
          <ringGeometry args={[sizing.avatarRadius * 0.86, sizing.avatarRadius * 0.92, 64]} />
          <meshBasicMaterial
            ref={innerRimMatRef}
            color={ringColor}
            transparent
            opacity={0.001}
            depthWrite={false}
            fog={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        {/* Ring frame — thicker band than v6.2 so the bubble has more presence
            against the busy field. */}
        <mesh position={[0, 0, 0.0015]}>
          <ringGeometry args={[sizing.avatarRadius * 0.92, sizing.avatarRadius * 1.0, 96]} />
          <meshBasicMaterial
            ref={ringMatRef}
            color={ringColor}
            transparent
            opacity={0.001}
            depthWrite={false}
            fog={false}
            side={THREE.DoubleSide}
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

        {/* Lens-flare cross — only on the active pair and eligible partners. */}
        {showFlare && flareTexture !== null ? (
          <mesh ref={flareMeshRef} position={[0, 0, 0.035]}>
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
      </Billboard>
    </group>
  );
}

/* ============================================================================
 * Connectors. Hover connector (focus -> hovered eligible) is a faint dashed
 * line that fades in. PairConnector3D is the locked-in line for the committed
 * pair, slightly thicker with rose->violet color blend.
 * ========================================================================== */

export function HoverConnector({ from, to }: { from: Vec3; to: Vec3 }) {
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

export function PairConnector3D({ from, to }: { from: Vec3; to: Vec3 }) {
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

/* ============================================================================
 * HUD: top bar. Flat glass pill rail. UI element reconsideration will hit this
 * next pass; for v6 it stays as-is so we can judge the 3D scene by itself.
 *
 * StatusShards is parameterized so the production lobby can drive the shards
 * from real save state (deck slots, budget over_budget rose tone, axis pip
 * indicators, pressure pip). NavShards likewise accepts active+onClick so the
 * lobby can wire the Date book toggle to its scenario mode switch.
 * ========================================================================== */

export type AxisLevel = "low" | "medium" | "high";

export type AxisPipState = { risk: AxisLevel; intimacy: AxisLevel; chaos: AxisLevel };
export type PressurePipState = { lowPressure: number; highPressure: number };

export type StatusShardSpec =
  | { kind: "label"; eyebrow: string; value: string; tone?: "rose" | "amber" | "emerald" }
  | { kind: "axes"; axes: AxisPipState }
  | { kind: "pressure"; pressure: PressurePipState };

export type NavShardSpec = {
  label: string;
  tone?: "primary";
  hot?: boolean;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

export function TopBar({
  state,
  shifts,
  status,
  navs,
}: {
  state: LobbyState;
  shifts?: { label: string };
  status?: StatusShardSpec[];
  navs?: NavShardSpec[];
}) {
  const resolvedStatus = status ?? defaultStatusShards(state);
  const resolvedNavs = navs ?? defaultNavShards(state);
  const shiftLabel = shifts?.label ?? "shift 12 · live";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 px-6 pt-5">
      <div className="pointer-events-auto aura-liquid-glass rounded-full px-4 py-2 inline-flex items-center gap-2">
        <span className="aura-pulse h-2 w-2 rounded-full bg-aura-rose" />
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-paper">
          {shiftLabel}
        </span>
      </div>
      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        {resolvedStatus.map((spec, idx) => (
          <StatusShard key={statusShardKey(spec, idx)} spec={spec} />
        ))}
        {resolvedNavs.map((nav) => (
          <NavShard key={nav.label} {...nav} />
        ))}
      </div>
    </div>
  );
}

function defaultStatusShards(state: LobbyState): StatusShardSpec[] {
  return [
    { kind: "label", eyebrow: "slots", value: "2 / 3", tone: "rose" },
    { kind: "label", eyebrow: "budget", value: "$184" },
    {
      kind: "label",
      eyebrow: "ai",
      value: state === "callout_heavy" ? "needs setup" : "ollama",
      tone: state === "callout_heavy" ? "amber" : "emerald",
    },
  ];
}

function defaultNavShards(state: LobbyState): NavShardSpec[] {
  return [
    { label: "Roster" },
    { label: "Date book", hot: state === "callout_heavy" },
    { label: "Notes" },
    { label: "File shift", tone: "primary" },
  ];
}

function statusShardKey(spec: StatusShardSpec, idx: number): string {
  if (spec.kind === "label") return `label-${spec.eyebrow}`;
  return `${spec.kind}-${idx}`;
}

function StatusShard({ spec }: { spec: StatusShardSpec }) {
  if (spec.kind === "axes") return <AxesShard axes={spec.axes} />;
  if (spec.kind === "pressure") return <PressureShard pressure={spec.pressure} />;

  const { eyebrow, value, tone } = spec;
  const toneShardClass =
    tone === "rose" ? "aura-liquid-glass-rose" : tone === "amber" ? "aura-liquid-glass-amber" : "";
  const valueClass =
    tone === "rose"
      ? "text-aura-rose"
      : tone === "amber"
        ? "text-aura-amber"
        : tone === "emerald"
          ? "text-aura-emerald"
          : "text-aura-paper";
  return (
    <div className={`aura-liquid-glass ${toneShardClass} rounded-card px-3.5 py-1.5 leading-tight`}>
      <div className="font-mono text-micro uppercase tracking-[0.2em] text-white/55">{eyebrow}</div>
      <div className={`font-display text-label ${valueClass}`}>{value}</div>
    </div>
  );
}

function AxesShard({ axes }: { axes: AxisPipState }) {
  return (
    <div className="aura-liquid-glass rounded-card px-3.5 py-1.5 leading-tight">
      <div className="font-mono text-micro uppercase tracking-[0.2em] text-white/55">axes</div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <AxisPipMicro label="R" level={axes.risk} />
        <AxisPipMicro label="I" level={axes.intimacy} />
        <AxisPipMicro label="C" level={axes.chaos} />
      </div>
    </div>
  );
}

function PressureShard({ pressure }: { pressure: PressurePipState }) {
  return (
    <div className="aura-liquid-glass rounded-card px-3.5 py-1.5 leading-tight">
      <div className="font-mono text-micro uppercase tracking-[0.2em] text-white/55">pressure</div>
      <div className="font-display text-label text-aura-paper">
        {pressure.lowPressure} <span className="text-white/45 text-sm">low</span> ·{" "}
        {pressure.highPressure} <span className="text-white/45 text-sm">high</span>
      </div>
    </div>
  );
}

function AxisPipMicro({ label, level }: { label: string; level: AxisLevel }) {
  const color =
    level === "high"
      ? "text-aura-rose"
      : level === "medium"
        ? "text-aura-amber"
        : "text-aura-emerald";
  const dotColor =
    level === "high" ? "bg-aura-rose" : level === "medium" ? "bg-aura-amber" : "bg-aura-emerald";
  return (
    <span className={`inline-flex items-center gap-1 font-display text-label ${color}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}

function NavShard({ label, tone, hot, active, onClick, disabled }: NavShardSpec) {
  if (tone === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="cursor-pointer aura-liquid-cta rounded-full px-4 py-1.5 font-display text-label disabled:cursor-not-allowed disabled:opacity-55"
      >
        {label}
      </button>
    );
  }
  const activeClass = active === true ? "aura-liquid-glass-rose" : "";
  const hotClass = hot === true && active !== true ? "aura-liquid-glass-amber" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer aura-liquid-glass ${activeClass} ${hotClass} aura-liquid-glass-hover rounded-full px-4 py-1.5 font-display text-label text-aura-paper disabled:cursor-not-allowed disabled:opacity-55`}
    >
      {label}
    </button>
  );
}

/* ============================================================================
 * HUD: side rail. AnimatePresence-wrapped focus/partner chips for crossfade.
 * ========================================================================== */

export function SideRail({
  state,
  focus,
  partner,
  pairDossierSlot,
}: {
  state: LobbyState;
  focus: StarMark | undefined;
  partner: StarMark | undefined;
  /**
   * Optional pair-dossier glass shard rendered below focus / partner cards.
   * Production lobby pipes the dossier in via PairDossierShard
   * (app/components/constellation-lobby/pair-dossier-shard.tsx) when a pair is
   * selected or an edge is being hovered. The spike renders without it.
   */
  pairDossierSlot?: ReactNode;
}) {
  return (
    <div className="pointer-events-none absolute right-6 top-[88px] z-30 flex flex-col gap-3 w-[280px]">
      <AnimatePresence>
        {focus !== undefined ? (
          <motion.div
            key="focus-card"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.32, ease: [0.22, 0.8, 0.2, 1] }}
            className="pointer-events-auto aura-liquid-glass aura-liquid-glass-rose aura-liquid-glass-hover rounded-card px-4 py-3"
          >
            <RoleHeader role="focus" />
            <MemberRow member={focus.member} palette={focus.palette} accent="#fb7185" />
          </motion.div>
        ) : null}
        {partner !== undefined ? (
          <motion.div
            key="partner-card"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.32, ease: [0.22, 0.8, 0.2, 1] }}
            className="pointer-events-auto aura-liquid-glass aura-liquid-glass-violet aura-liquid-glass-hover rounded-card px-4 py-3"
          >
            <RoleHeader role="partner" />
            <MemberRow member={partner.member} palette={partner.palette} accent="#c4b5fd" />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {pairDossierSlot}
      <div className="pointer-events-auto aura-liquid-glass aura-liquid-glass-hover rounded-card px-4 py-3">
        <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
          shift brief
        </div>
        <div className="mt-2 space-y-2">
          <BriefRow label="Goal" value="Two repeat-dater outcomes" status="open" />
          <BriefRow
            label="Closure"
            value="Marcus + Mei"
            status={state === "callout_heavy" ? "alert" : "open"}
          />
          <BriefRow label="Follow-up" value="Jenna · diner" status="met" />
        </div>
      </div>
      <div className="pointer-events-auto aura-liquid-glass aura-liquid-glass-hover rounded-card px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
            off tonight
          </span>
          <span className="font-mono text-micro text-white/55">{OFF_SHIFT_IDS.size}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from(OFF_SHIFT_IDS).map((id) => {
            const member = starterMembers.find((m) => m.id === id);
            return member === undefined ? null : (
              <span
                key={id}
                className="rounded-full border border-white/15 bg-white/8 px-2 py-0.5 font-mono text-micro text-white/65"
              >
                {member.firstName}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoleHeader({ role }: { role: "focus" | "partner" }) {
  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.22em] ${role === "focus" ? "text-aura-rose" : "text-aura-violet"}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: role === "focus" ? "#fb7185" : "#c4b5fd" }}
      />
      {role === "focus" ? "focus case" : "partner"}
    </div>
  );
}

function MemberRow({
  member,
  palette,
  accent,
}: {
  member: Member;
  palette: PortraitPalette;
  accent: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <PortraitChip member={member} palette={palette} accent={accent} />
      <div className="leading-tight min-w-0">
        <div className="font-display text-display-sm truncate text-aura-paper">
          {member.firstName}
        </div>
        <div className="font-mono text-micro uppercase tracking-[0.16em] text-white/55 truncate">
          {member.origin}
        </div>
      </div>
    </div>
  );
}

export function PortraitChip({
  member,
  palette,
  accent,
  size = 48,
}: {
  member: Member;
  palette: PortraitPalette;
  accent: string;
  /** Pixel size for the portrait chip. Defaults to 48 (matching side-rail). */
  size?: number;
}) {
  const srcset = avatarSrcsetFor(member.id);
  return (
    <div
      className="relative overflow-hidden rounded-full shrink-0"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `linear-gradient(160deg, ${palette.from}, ${palette.to})`,
        boxShadow: `0 0 0 1.5px ${accent}, 0 0 18px ${withAlpha(accent, 0.5)}`,
      }}
    >
      <img
        src={srcset.src}
        srcSet={srcset.srcset}
        sizes={`${size}px`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top"
        loading="lazy"
      />
    </div>
  );
}

function BriefRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "met" | "open" | "alert";
}) {
  const dotClass =
    status === "met" ? "bg-aura-emerald" : status === "alert" ? "bg-aura-rose" : "bg-aura-amber";
  return (
    <div className="flex items-start gap-2 text-label">
      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <div className="leading-tight">
        <div className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
          {label}
        </div>
        <div className="text-aura-paper">{value}</div>
      </div>
    </div>
  );
}

/* ============================================================================
 * HUD: bottom dock. Status breadcrumb + begin CTA. Unchanged for v6.
 * ========================================================================== */

export function BottomDock({
  state,
  focus,
  partner,
  selectedScenarioId,
  selectedScenarioTitle,
  onBeginDate,
  onCancelPair,
  onResetFocus,
  beginDisabled,
}: {
  state: LobbyState;
  focus: StarMark | undefined;
  partner: StarMark | undefined;
  selectedScenarioId: string | null;
  selectedScenarioTitle?: string;
  onBeginDate?: () => void;
  onCancelPair?: () => void;
  onResetFocus?: () => void;
  beginDisabled?: boolean;
}) {
  const breadcrumb = breadcrumbFor(
    state,
    focus,
    partner,
    selectedScenarioId,
    selectedScenarioTitle,
  );
  const canBegin = state === "scenario_chosen" && beginDisabled !== true;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-4 px-6 pb-6">
      <div className="pointer-events-auto aura-liquid-glass rounded-card px-5 py-3 leading-tight min-w-0">
        <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
          {breadcrumb.eyebrow}
        </div>
        <div className="font-display text-display-sm text-aura-paper">{breadcrumb.line}</div>
      </div>

      <div className="pointer-events-auto flex items-center gap-3">
        {state === "focus_selected" || state === "partner_selected" ? (
          <ShardButton label="Reset focus" onClick={onResetFocus} />
        ) : null}
        {state === "committed_pair" || state === "scenario_chosen" ? (
          <ShardButton label="Cancel pair" onClick={onCancelPair} />
        ) : null}
        <button
          type="button"
          disabled={!canBegin}
          onClick={onBeginDate}
          className="cursor-pointer disabled:cursor-not-allowed aura-liquid-cta rounded-full px-7 py-3 font-display text-display-sm"
        >
          Begin date
        </button>
      </div>
    </div>
  );
}

function ShardButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-5 py-2.5 font-display text-label text-aura-paper"
    >
      {label}
    </button>
  );
}

function breadcrumbFor(
  state: LobbyState,
  focus: StarMark | undefined,
  partner: StarMark | undefined,
  selectedScenarioId: string | null,
  selectedScenarioTitle?: string,
): { eyebrow: string; line: string } {
  if (state === "callout_heavy") {
    return { eyebrow: "shift requires attention", line: "Closure pending · 2 callouts" };
  }
  if (state === "idle") {
    return { eyebrow: "step 1 of 4", line: "Pick a lead case to open the field" };
  }
  if (state === "focus_selected") {
    return {
      eyebrow: "step 2 of 4 · focus locked",
      line: `Pick a partner near ${focus?.member.firstName ?? "the focus"}`,
    };
  }
  if (state === "partner_selected") {
    return {
      eyebrow: "step 3 of 4 · partner queued",
      line: `Commit ${focus?.member.firstName ?? ""} + ${partner?.member.firstName ?? ""}`,
    };
  }
  if (state === "committed_pair") {
    return { eyebrow: "step 4 of 4 · pair live", line: "Pick a date plan from the scenario deck" };
  }
  if (state === "scenario_chosen") {
    const fallbackTitle = MOCK_SCENARIOS.find((s) => s.id === selectedScenarioId)?.title;
    const title = selectedScenarioTitle ?? fallbackTitle;
    return {
      eyebrow: "ready · ai ollama · 1660 tokens",
      line: title !== undefined ? `Begin · ${title}` : "Begin date",
    };
  }
  return { eyebrow: "", line: "" };
}

/* ============================================================================
 * Scenario panel. Three flat-glass cards in the default "auto" mode (the
 * scenarios drawn for the committed pair). When mode === "deck" the panel
 * swaps in the full deck composition view; when mode === "library" it swaps
 * in the unlocked library browser. Both deck and library subpanels are
 * authored as separate components under app/components/constellation-lobby/
 * so the spike file stays focused on the scenic shape; this file owns only
 * the framing motion and the auto-mode 3-card grid.
 * ========================================================================== */

export type ScenarioPanelMode = "auto" | "deck" | "library";

export function ScenarioPanel({
  scenarios,
  selectedId,
  mode = "auto",
  header,
  deckPanel,
  libraryPanel,
  onScenarioClick,
}: {
  scenarios: LobbyScenario[];
  selectedId: string | null;
  mode?: ScenarioPanelMode;
  header?: string;
  deckPanel?: ReactNode;
  libraryPanel?: ReactNode;
  onScenarioClick?: (scenarioId: string) => void;
}) {
  if (mode === "deck") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.36, ease: [0.22, 0.8, 0.2, 1] }}
        className="pointer-events-none absolute inset-x-0 bottom-[110px] z-20 px-6"
      >
        <div className="pointer-events-auto mx-auto max-w-[1280px]">{deckPanel}</div>
      </motion.div>
    );
  }

  if (mode === "library") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.36, ease: [0.22, 0.8, 0.2, 1] }}
        className="pointer-events-none absolute inset-x-0 bottom-[110px] z-20 px-6"
      >
        <div className="pointer-events-auto mx-auto max-w-[1280px]">{libraryPanel}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.4, ease: [0.22, 0.8, 0.2, 1] }}
      className="pointer-events-none absolute inset-x-0 bottom-[110px] z-20 px-6"
    >
      <div className="pointer-events-auto mx-auto max-w-[1100px]">
        <div className="mb-4 flex items-center justify-center">
          <span className="font-mono text-micro uppercase tracking-[0.32em] text-white/55">
            {header ?? "date plan"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {scenarios.map((scenario) => (
            <LobbyScenarioCard
              key={scenario.id}
              scenario={scenario}
              selected={selectedId === scenario.id}
              dimmed={selectedId !== null && selectedId !== scenario.id}
              onClick={
                onScenarioClick === undefined ? undefined : () => onScenarioClick(scenario.id)
              }
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function LobbyScenarioCard({
  scenario,
  selected,
  dimmed,
  slotLabel,
  onClick,
}: {
  scenario: LobbyScenario;
  selected: boolean;
  dimmed: boolean;
  slotLabel?: string;
  onClick?: () => void;
}) {
  const roomReadTone =
    scenario.roomRead === "steady"
      ? "text-aura-emerald"
      : scenario.roomRead === "promising"
        ? "text-aura-amber"
        : "text-aura-rose";
  const toneClass = selected ? "aura-liquid-glass-rose" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden rounded-card text-left aura-liquid-glass aura-liquid-glass-hover ${toneClass} ${dimmed ? "opacity-50" : "opacity-100"}`}
    >
      <div className="relative px-5 py-4">
        {slotLabel === undefined ? null : (
          <span className="absolute right-3 top-3 font-mono text-micro uppercase tracking-[0.18em] text-white/45">
            {slotLabel}
          </span>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
            {scenario.venue}
          </span>
          <span className={`font-mono text-micro uppercase tracking-[0.18em] ${roomReadTone}`}>
            {scenario.roomRead}
          </span>
        </div>
        <div className="mt-1 font-display text-display-sm text-aura-paper">{scenario.title}</div>
        <div className="mt-3 flex items-center justify-between text-label">
          <div className="flex gap-2">
            <AxisChip label="risk" value={scenario.axes.risk} />
            <AxisChip label="warmth" value={scenario.axes.intimacy} />
            <AxisChip label="chaos" value={scenario.axes.chaos} />
          </div>
          <span className="font-display text-label text-aura-paper">${scenario.cost}</span>
        </div>
      </div>
    </button>
  );
}

export function AxisChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/8 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.14em] text-white/60">
      <span>{label}</span>
      <span className="font-display text-aura-paper">{value}</span>
    </span>
  );
}

/* ============================================================================
 * Callouts cluster. Parameterized so the production lobby (and the Files
 * agent's follow-up routing) can compose the cluster from real state.
 *
 * Prop shape:
 *   callouts: Array<{
 *     id: string;                          // stable React key
 *     tone: "rose" | "amber" | "neutral";  // surface tint (rose=blocking,
 *                                          // amber=soft, neutral=info)
 *     eyebrow: string;                     // small uppercase label
 *     title: string;                       // primary line
 *     body?: string;                       // optional descriptive paragraph
 *     action?: { label: string; onClick: () => void };  // optional CTA
 *   }>
 *
 * If `callouts` is omitted, the cluster renders the spike's mock entries so
 * the spike route still demonstrates the surface.
 * ========================================================================== */

export type CalloutTone = "rose" | "amber" | "neutral";

export type Callout = {
  id: string;
  tone: CalloutTone;
  eyebrow: string;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
};

const SPIKE_MOCK_CALLOUTS: Callout[] = [
  {
    id: "mock-closure",
    tone: "rose",
    eyebrow: "closure pending",
    title: "Marcus + Mei · final exchange ready",
    body: "Their fourth date asked for an honest close. Open the date book to file it.",
    action: { label: "Open closure", onClick: () => {} },
  },
  {
    id: "mock-repair",
    tone: "amber",
    eyebrow: "deck needs repair",
    title: "Only 2 cards staged for tomorrow",
    body: "Draw three scenarios before filing the shift.",
  },
];

export function CalloutCluster({ callouts }: { callouts?: Callout[] }) {
  const resolved = callouts ?? SPIKE_MOCK_CALLOUTS;
  if (resolved.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.36, ease: [0.22, 0.8, 0.2, 1] }}
      className="pointer-events-none absolute left-6 bottom-[120px] z-30 flex flex-col gap-3 w-[360px]"
    >
      {resolved.map((callout) => (
        <CalloutCard key={callout.id} callout={callout} />
      ))}
    </motion.div>
  );
}

function CalloutCard({ callout }: { callout: Callout }) {
  const toneSurface =
    callout.tone === "rose"
      ? "aura-liquid-glass-rose"
      : callout.tone === "amber"
        ? "aura-liquid-glass-amber"
        : "";
  const toneEyebrow =
    callout.tone === "rose"
      ? "text-aura-rose"
      : callout.tone === "amber"
        ? "text-aura-amber"
        : "text-white/65";
  return (
    <div
      className={`pointer-events-auto aura-liquid-glass ${toneSurface} aura-liquid-glass-hover rounded-card px-5 py-4`}
    >
      <div className={`font-mono text-micro uppercase tracking-[0.18em] ${toneEyebrow}`}>
        {callout.eyebrow}
      </div>
      <div className="mt-1 font-display text-display-sm text-aura-paper">{callout.title}</div>
      {callout.body === undefined ? null : (
        <div className="mt-1 font-sans text-label text-white/70">{callout.body}</div>
      )}
      {callout.action === undefined ? null : (
        <button
          type="button"
          onClick={callout.action.onClick}
          className="mt-3 cursor-pointer aura-liquid-glass aura-liquid-glass-ink aura-liquid-glass-hover rounded-full px-4 py-1.5 font-display text-label"
        >
          {callout.action.label}
        </button>
      )}
    </div>
  );
}

/* ============================================================================
 * Hover detail card. Rendered via drei <Html> at the hovered star's projected
 * screen position. Morphs in from the star with a small scale + slide, slides
 * out on hover end. Pointer-events on the card itself so the user can move
 * their cursor onto the card to read it without losing the hover state (the
 * Scene's grace-period hover timer bridges the brief star→card transition).
 * ========================================================================== */

/**
 * Hover detail card variants reflect the case's relationship to the active
 * focus rack:
 *
 * - "make_focus" — slots have room, primary CTA adds the case to focus.
 * - "swap_into_focus" — focus slots are full, primary CTA opens a swap with
 *   a one-line retention penalty preview.
 * - "view_case" — the case is already focused (or closed/quit), so the
 *   primary CTA just opens the case file.
 */
export type HoverDetailCtaVariant = "make_focus" | "swap_into_focus" | "view_case";

export type HoverDetailCardProps = {
  star: StarMark;
  /**
   * Optional override for the profile snippet. The production lobby passes a
   * knowledge-gated `publicFragments[0]` here so unrevealed copy stays
   * sealed; the spike falls back to the raw `datingProfile`.
   */
  snippet?: string;
  /**
   * Case file number ("F-1234"). Spike falls back to deriving it from the
   * member id so the card renders standalone.
   */
  fileNumber?: string;
  /** Height in inches, shown as a `HeightChip`-style mono pill. */
  heightInInches?: number;
  /** Counts of redacted (sealed) and filed (known) intel blocks. */
  sealedCount?: number;
  knownCount?: number;
  /** Member-state pill — closed reads "case closed", quit reads "membership cancelled". */
  statusBadge?: "active" | "focus" | "closed" | "quit";
  /** Penalty preview shown under the "Swap into focus" CTA. */
  swapPenalty?: number;
  /**
   * Which primary CTA to show. Defaults to "make_focus" so the spike's old
   * call sites keep working.
   */
  ctaVariant?: HoverDetailCtaVariant;
  /** Triggered when the player clicks the primary CTA. */
  onPrimaryAction?: () => void;
  /** Triggered when the player clicks "View case" / "Open case". */
  onOpenCase?: () => void;
  /**
   * Optional slot for recent player-visible notes. Production lobby pipes
   * 1-2 most-recent memories filtered through scrubPlayerSafeCopy via
   * RecentNotesSlot (see app/components/constellation-lobby/recent-notes-slot.tsx).
   * Roster's renderHoverCard render-prop can opt into the same slot.
   */
  recentNotesSlot?: ReactNode;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

/**
 * Approach (same-element morph): when the star is hovered, `StarSprite`
 * receives `hovered=true` and the 3D group goes invisible so the only thing
 * the player sees at that position is the morphing card. The card mounts at
 * the star's projected screen coords via Drei's `<Html>` (which does the
 * world→screen math), starts as a small "ghost portrait" disc sized to match
 * the avatar, and springs outward into the full rounded-rectangle card. The
 * effect reads as the star itself transforming into the card rather than a
 * popup appearing next to it.
 *
 * As the card expands the ghost portrait shrinks into the upper-left chip
 * slot and the rest of the content (filename, name, tags, snippet, buttons)
 * cross-fades in after the layout has mostly settled.
 *
 * Reduced-motion mode snaps the card to its final layout with a plain
 * opacity fade, skipping the spring entirely.
 */

// Star avatar disc, projected to screen pixels at the typical field distance.
// We anchor the morph circle at this diameter so the card "blooms" from a
// shape the eye reads as the star itself, not an arbitrary popup.
const MORPH_START_DIAMETER_PX = 56;
const MORPH_FINAL_WIDTH_PX = 340;
// Card stays anchored at the star center — the avatar chip in the card's
// upper-left lands roughly where the original avatar disc was, so the eye
// reads the card as the star itself unfolding outward instead of sliding
// to one side.
const MORPH_FINAL_OFFSET_X_PX = -32;

export function HoverDetailCard({
  star,
  snippet,
  fileNumber,
  heightInInches,
  sealedCount,
  knownCount,
  statusBadge,
  swapPenalty,
  ctaVariant = "make_focus",
  onPrimaryAction,
  onOpenCase,
  recentNotesSlot,
  onMouseEnter,
  onMouseLeave,
}: HoverDetailCardProps) {
  const { member, palette } = star;
  const resolvedSnippet = snippet ?? profileSnippetFor(member);
  const resolvedFileNumber = fileNumber ?? caseFileNumber(member.id);
  const resolvedHeight = heightInInches ?? member.characterHeightInInches;
  const reducedMotion = useReducedMotion() === true;

  const statusLabel = (() => {
    if (statusBadge === "closed") return "case closed";
    if (statusBadge === "quit") return "membership cancelled";
    if (statusBadge === "focus") return "focus case";
    return null;
  })();
  const statusPillClass = (() => {
    if (statusBadge === "closed") return "bg-emerald-500/15 text-emerald-200 ring-emerald-300/30";
    if (statusBadge === "quit") return "bg-rose-500/15 text-rose-200 ring-rose-300/30";
    if (statusBadge === "focus") return "bg-aura-rose/20 text-aura-rose ring-aura-rose/30";
    return "";
  })();

  const primaryLabel = (() => {
    if (ctaVariant === "view_case") return "View case";
    if (ctaVariant === "swap_into_focus") return "Swap into focus";
    return "Make focus";
  })();
  const primaryToneClass =
    ctaVariant === "view_case"
      ? "aura-liquid-glass aura-liquid-glass-hover"
      : "aura-liquid-glass aura-liquid-glass-rose aura-liquid-glass-hover";

  const srcset = avatarSrcsetFor(member.id);

  // Tween shape. A snappy spring on layout (width/height/border-radius/x/y)
  // sells the bloom; the content cross-fade lags slightly so the text doesn't
  // pop in before the box has room for it. Reduced motion collapses both into
  // an instant opacity swap with no transform interpolation.
  const layoutTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.7 };
  const contentTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.22, delay: 0.12, ease: [0.22, 0.8, 0.2, 1] as const };
  const portraitTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 360, damping: 30, mass: 0.6 };

  const portraitFinalSize = 48;
  const portraitAccent = palette.accent;

  return (
    <motion.div
      // The card mounts at the star's center as a small circle. `top` and
      // `left` are 50% so the circle is centered on the anchor; `x` and `y`
      // shift away from center as the card grows so the morph "opens to the
      // right" with the avatar at its left edge.
      initial={
        reducedMotion
          ? {
              opacity: 0,
              width: MORPH_FINAL_WIDTH_PX,
              height: "auto",
              borderRadius: 16,
              x: MORPH_FINAL_OFFSET_X_PX,
              y: "-50%",
            }
          : {
              opacity: 0.85,
              width: MORPH_START_DIAMETER_PX,
              height: MORPH_START_DIAMETER_PX,
              borderRadius: MORPH_START_DIAMETER_PX / 2,
              x: -MORPH_START_DIAMETER_PX / 2,
              y: -MORPH_START_DIAMETER_PX / 2,
            }
      }
      animate={{
        opacity: 1,
        width: MORPH_FINAL_WIDTH_PX,
        height: "auto",
        borderRadius: 16,
        x: MORPH_FINAL_OFFSET_X_PX,
        y: "-50%",
      }}
      exit={
        reducedMotion
          ? { opacity: 0, transition: { duration: 0.12 } }
          : {
              opacity: 0,
              width: MORPH_START_DIAMETER_PX,
              height: MORPH_START_DIAMETER_PX,
              borderRadius: MORPH_START_DIAMETER_PX / 2,
              x: -MORPH_START_DIAMETER_PX / 2,
              y: -MORPH_START_DIAMETER_PX / 2,
              transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const },
            }
      }
      transition={layoutTransition}
      style={{ position: "absolute", top: 0, left: 0, overflow: "hidden" }}
      className="aura-liquid-glass pointer-events-auto p-4"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-start gap-3">
        {/*
         * Ghost portrait. Anchored to the same top-left corner as the card
         * but absolutely positioned so it can shrink from "fills the
         * pop-out circle" to "sits in the chip slot" independently of the
         * card layout. Once the card has opened, this image's bounds
         * coincide with the PortraitChip that the chip slot reserves.
         */}
        <motion.div
          initial={
            reducedMotion
              ? {
                  width: portraitFinalSize,
                  height: portraitFinalSize,
                  x: 0,
                  y: 0,
                  borderRadius: portraitFinalSize / 2,
                  boxShadow: `0 0 0 1.5px ${portraitAccent}, 0 0 18px ${withAlpha(portraitAccent, 0.5)}`,
                }
              : {
                  width: MORPH_START_DIAMETER_PX,
                  height: MORPH_START_DIAMETER_PX,
                  x: 0,
                  y: 0,
                  borderRadius: MORPH_START_DIAMETER_PX / 2,
                  boxShadow: `0 0 0 1.5px ${portraitAccent}, 0 0 26px ${withAlpha(portraitAccent, 0.7)}`,
                }
          }
          animate={{
            width: portraitFinalSize,
            height: portraitFinalSize,
            x: 0,
            y: 0,
            borderRadius: portraitFinalSize / 2,
            boxShadow: `0 0 0 1.5px ${portraitAccent}, 0 0 18px ${withAlpha(portraitAccent, 0.5)}`,
          }}
          transition={portraitTransition}
          style={{
            position: "relative",
            flexShrink: 0,
            background: `linear-gradient(160deg, ${palette.from}, ${palette.to})`,
            overflow: "hidden",
          }}
        >
          <img
            src={srcset.src}
            srcSet={srcset.srcset}
            sizes={`${portraitFinalSize}px`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="lazy"
          />
        </motion.div>
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.1 } }}
          transition={contentTransition}
          className="min-w-0 leading-tight flex-1"
        >
          <div className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose/85">
            // {resolvedFileNumber.toLowerCase()}
          </div>
          <div className="mt-0.5 font-display text-display-sm text-aura-paper truncate">
            {member.firstName}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-white/70 ring-1 ring-white/15">
              {formatHeightShort(resolvedHeight)}
            </span>
            {statusLabel === null ? null : (
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] ring-1 ${statusPillClass}`}
              >
                {statusLabel}
              </span>
            )}
            {sealedCount === undefined && knownCount === undefined ? null : (
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-white/70 ring-1 ring-white/15">
                {knownCount ?? 0} read · {sealedCount ?? 0} sealed
              </span>
            )}
          </div>
        </motion.div>
      </div>
      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.1 } }}
        transition={contentTransition}
      >
        <p className="mt-3 font-sans text-label text-white/85 line-clamp-3">{resolvedSnippet}</p>
        {recentNotesSlot}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCase}
            className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3.5 py-1.5 font-display text-label text-aura-paper"
          >
            Open case
          </button>
          <button
            type="button"
            onClick={onPrimaryAction}
            disabled={onPrimaryAction === undefined}
            className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 rounded-full px-3.5 py-1.5 font-display text-label ${primaryToneClass}`}
          >
            {primaryLabel}
          </button>
        </div>
        {ctaVariant === "swap_into_focus" && swapPenalty !== undefined ? (
          <p className="mt-2 font-mono text-micro uppercase tracking-[0.18em] text-aura-rose/85">
            Dropped case loses {swapPenalty} retention
          </p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

function profileSnippetFor(member: Member): string {
  const profile = member.datingProfile;
  if (typeof profile === "string" && profile.trim().length > 0) {
    return profile.length > 220 ? `${profile.slice(0, 220).trimEnd()}…` : profile;
  }
  return "Profile reads on file.";
}

function formatHeightShort(heightInInches: number): string {
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches - feet * 12;
  return `${feet}'${inches}"`;
}

/* ============================================================================
 * Layer indicator HUD. Four vertical glass dots on the left edge; active one
 * filled with rose tint, others muted. Each dot is clickable so the player
 * can jump layers without scrolling. Layer labels surface on hover and the
 * active layer name always reads under the dot stack.
 * ========================================================================== */

const FLYTHROUGH_LAYER_LABELS: Record<FlythroughLayer, string> = {
  0: "Focused cases",
  1: "Tonight's eligibles",
  2: "Off tonight",
  3: "Date scenarios",
};

export function LayerIndicator({
  currentLayer,
  onLayerSelect,
}: {
  currentLayer: FlythroughLayer;
  onLayerSelect: (layer: FlythroughLayer) => void;
}) {
  const layers: FlythroughLayer[] = [0, 1, 2, 3];
  return (
    <div className="pointer-events-none absolute left-6 top-1/2 z-30 flex -translate-y-1/2 flex-col items-start gap-3">
      <div className="pointer-events-auto aura-liquid-glass aura-liquid-glass-ink rounded-full px-3 py-4 flex flex-col items-center gap-3">
        {layers.map((layer) => {
          const active = layer === currentLayer;
          const label = FLYTHROUGH_LAYER_LABELS[layer];
          return (
            <button
              key={layer}
              type="button"
              onClick={() => onLayerSelect(layer)}
              aria-label={`Jump to layer ${layer + 1}: ${label}`}
              className={`group relative cursor-pointer h-3 w-3 rounded-full transition-all ${
                active
                  ? "bg-aura-rose ring-2 ring-aura-rose/40 ring-offset-2 ring-offset-[#07041a]"
                  : "bg-white/25 hover:bg-white/55"
              }`}
            >
              <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full aura-liquid-glass-ink px-3 py-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper opacity-0 transition-opacity group-hover:opacity-100">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="pointer-events-none aura-liquid-glass aura-liquid-glass-ink rounded-card px-3 py-2 leading-tight">
        <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
          layer {currentLayer + 1} / 4
        </div>
        <div className="font-display text-label text-aura-paper">
          {FLYTHROUGH_LAYER_LABELS[currentLayer]}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * Scenarios as 3D card meshes. Each scenario renders as a Drei <Html transform>
 * mounted at its world-space position so the card text reads sharp (DOM, not
 * canvas pixels) but the whole element scales + perspectives as a 3D object
 * — turning with the camera, fading with the slab activity multiplier the
 * same way stars do.
 *
 * The cards sit on a 3-card horizontal rail centered at (0, 0, -1) — directly
 * in front of the camera's layer-3 position (z=4) — with the outer cards
 * splayed slightly back in Z so the rail reads as a curved holographic shelf
 * rather than three flat planes pasted on a wall.
 * ========================================================================== */

export function ScenarioCardField3D({
  scenarios,
  currentLayer,
  selectedScenarioId,
  onScenarioClick,
  reducedMotion,
}: {
  scenarios: LobbyScenario[];
  currentLayer: FlythroughLayer;
  selectedScenarioId: string | null;
  onScenarioClick?: (scenarioId: string) => void;
  reducedMotion: boolean;
}) {
  const active = currentLayer === 3;
  // Activity opacity for the whole field — on layer 3 it's full, on layers
  // 0/1/2 the cards fade back so they read as the next stop further down
  // rather than UI overlaid on the member field.
  const fieldOpacity = active ? 1 : 0.0;
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);

  useFrame((_, delta) => {
    if (groupRef.current === null) return;
    const moveLerp = reducedMotion ? 1 : 1 - Math.pow(0.0008, delta);
    // Park the field a step further back when not active so it doesn't punch
    // through stars on the layer-2 slab (which sits at z=-4).
    const targetZ = active ? -1 : -8;
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      moveLerp,
    );
    opacityRef.current = THREE.MathUtils.lerp(
      opacityRef.current,
      fieldOpacity,
      Math.min(1, delta * 4),
    );
  });

  return (
    <group ref={groupRef} position={[0, 0, -1]}>
      {scenarios.map((scenario, idx) => {
        const total = scenarios.length;
        // Horizontal rail spread — wider when there are more cards, but
        // capped so the outer cards don't drift off-frame at layer-3 camera
        // distance.
        const spread = total === 1 ? 0 : 3.4;
        const offsetX = total === 1 ? 0 : (idx - (total - 1) / 2) * spread;
        // Outer cards bend back so the rail reads as a curved shelf rather
        // than a flat triptych.
        const offsetZ = total === 1 ? 0 : -Math.abs(idx - (total - 1) / 2) * 0.4;
        const rotY = total === 1 ? 0 : -(idx - (total - 1) / 2) * 0.18;
        return (
          <Scenario3DCard
            key={scenario.id}
            scenario={scenario}
            position={[offsetX, 0, offsetZ]}
            rotationY={rotY}
            opacityRef={opacityRef}
            selected={selectedScenarioId === scenario.id}
            dimmed={selectedScenarioId !== null && selectedScenarioId !== scenario.id}
            onClick={onScenarioClick === undefined ? undefined : () => onScenarioClick(scenario.id)}
          />
        );
      })}
    </group>
  );
}

function Scenario3DCard({
  scenario,
  position,
  rotationY,
  opacityRef,
  selected,
  dimmed,
  onClick,
}: {
  scenario: LobbyScenario;
  position: [number, number, number];
  rotationY: number;
  opacityRef: MutableRefObject<number>;
  selected: boolean;
  dimmed: boolean;
  onClick?: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // The card's opacity tracks the scenarios-field activity ref so the cards
  // fade in/out together with the layer. Direct DOM mutation avoids a per-
  // frame React re-render that would burn the avatar textures' lazy load.
  useFrame(() => {
    if (wrapperRef.current === null) return;
    const op = opacityRef.current ?? 0;
    wrapperRef.current.style.opacity = op.toFixed(3);
    // Disable pointer events when the field is mostly faded so the cards
    // don't catch clicks while the player is still on a member layer.
    wrapperRef.current.style.pointerEvents = op > 0.6 ? "auto" : "none";
  });

  const roomReadTone =
    scenario.roomRead === "steady"
      ? "text-aura-emerald"
      : scenario.roomRead === "promising"
        ? "text-aura-amber"
        : "text-aura-rose";
  const selectedTone = selected ? "aura-liquid-glass-rose" : "";

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Html
        transform
        distanceFactor={6}
        zIndexRange={[20, 0]}
        style={{ width: "320px", pointerEvents: "none" }}
      >
        <div
          ref={wrapperRef}
          className={`aura-liquid-glass ${selectedTone} aura-liquid-glass-hover rounded-card overflow-hidden ${
            dimmed ? "opacity-50" : ""
          }`}
          style={{ opacity: 0 }}
        >
          <button
            type="button"
            onClick={onClick}
            className="cursor-pointer block w-full text-left px-5 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
                {scenario.venue}
              </span>
              <span className={`font-mono text-micro uppercase tracking-[0.18em] ${roomReadTone}`}>
                {scenario.roomRead}
              </span>
            </div>
            <div className="mt-1 font-display text-display-sm text-aura-paper">
              {scenario.title}
            </div>
            <div className="mt-3 flex items-center justify-between text-label">
              <div className="flex gap-2">
                <AxisChip label="risk" value={scenario.axes.risk} />
                <AxisChip label="warmth" value={scenario.axes.intimacy} />
                <AxisChip label="chaos" value={scenario.axes.chaos} />
              </div>
              <span className="font-display text-label text-aura-paper">${scenario.cost}</span>
            </div>
          </button>
        </div>
      </Html>
    </group>
  );
}

/* ============================================================================
 * Spike controls panel. State sweep + a couple of toggles. Marked R&D so it's
 * clear this lives only in the spike.
 * ========================================================================== */

function SpikeControls({
  state,
  onState,
  showAuras,
  onShowAuras,
  showParallax,
  onShowParallax,
}: {
  state: LobbyState;
  onState: (next: LobbyState) => void;
  showAuras: boolean;
  onShowAuras: (next: boolean) => void;
  showParallax: boolean;
  onShowParallax: (next: boolean) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-[110px] right-6 z-40 flex flex-col gap-2 w-[280px]">
      <div className="pointer-events-auto aura-liquid-glass aura-liquid-glass-ink rounded-card px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-white/60">
            spike controls
          </span>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
            R&D
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {(
            [
              ["idle", "Idle"],
              ["focus_selected", "Focus"],
              ["partner_selected", "Partner"],
              ["committed_pair", "Committed"],
              ["scenario_chosen", "Scenario"],
              ["callout_heavy", "Callouts"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onState(key)}
              className={`cursor-pointer rounded-full px-3 py-1.5 font-display text-label transition-colors ${
                state === key
                  ? "bg-aura-rose text-white"
                  : "bg-white/8 text-white/80 hover:bg-white/16"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/60">
              Auras
            </span>
            <SpikeBoolean value={showAuras} onChange={onShowAuras} />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/60">
              Lead-ahead
            </span>
            <SpikeBoolean value={showParallax} onChange={onShowParallax} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SpikeBoolean({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`cursor-pointer rounded-full px-3 py-1 font-display text-label ${
        value ? "bg-aura-rose text-white" : "bg-white/8 text-white/70"
      }`}
    >
      {value ? "On" : "Off"}
    </button>
  );
}

/* ============================================================================
 * Helpers
 * ========================================================================== */

function buildStars(members: readonly Member[]): StarMark[] {
  const rng = createSeededRandom(FIELD_SEED);
  const placements: Array<{ x: number; y: number }> = [];
  const stars: StarMark[] = [];

  const focusIndex = members.findIndex((m) => m.id === FOCUS_ID);
  const partnerIndex = members.findIndex((m) => m.id === PARTNER_ID);
  const order = members.map((_, idx) => idx);
  if (focusIndex !== -1 && partnerIndex !== -1) {
    order.splice(order.indexOf(focusIndex), 1);
    order.splice(order.indexOf(partnerIndex), 1);
    order.unshift(focusIndex, partnerIndex);
  }

  for (const idx of order) {
    const member = members[idx];
    if (member === undefined) continue;
    let placed: { x: number; y: number } | null = null;
    for (let attempt = 0; attempt < 220; attempt += 1) {
      const candidateX = FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2);
      const candidateY = FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2);
      const tooClose = placements.some(
        (p) =>
          (p.x - candidateX) * (p.x - candidateX) + (p.y - candidateY) * (p.y - candidateY) <
          FIELD_MIN_SPACING * FIELD_MIN_SPACING,
      );
      if (!tooClose) {
        placed = { x: candidateX, y: candidateY };
        break;
      }
    }
    if (placed === null) {
      placed = {
        x: FIELD_PADDING_X + rng() * (100 - FIELD_PADDING_X * 2),
        y: FIELD_PADDING_Y + rng() * (100 - FIELD_PADDING_Y * 2),
      };
    }
    placements.push(placed);

    const tierRoll = rng();
    let tier: StarTier;
    let z: number;
    if (member.id === FOCUS_ID || member.id === PARTNER_ID) {
      tier = "foreground";
      z = 50;
    } else if (tierRoll > 0.6) {
      tier = "foreground";
      z = 10 + rng() * 40;
    } else if (tierRoll > 0.28) {
      tier = "mid";
      z = -50 + rng() * 50;
    } else {
      tier = "background";
      z = -180 + rng() * 110;
    }

    stars.push({
      member,
      palette: resolvePortraitPalette(member),
      aura: getMemberAuraConfig(member.id),
      x: placed.x,
      y: placed.y,
      z,
      tier,
      availability: availabilityFor(member.id),
      phase: rng() * Math.PI * 2,
    });
  }

  return stars;
}

function availabilityFor(id: string): StarAvailability {
  if (CLOSED_IDS.has(id)) return "closed";
  if (OFF_SHIFT_IDS.has(id)) return "off_shift";
  if (COOLING_IDS.has(id)) return "cooling";
  return "ready";
}

function roleForStar(
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

function availabilityRole(availability: StarAvailability): StarRole {
  if (availability === "cooling") return "ineligible_cooling";
  if (availability === "off_shift") return "ineligible_off_shift";
  if (availability === "closed") return "ineligible_closed";
  return "dim";
}

/**
 * Layered zoom Z offset. Once the player picks a focus, the foreground layer
 * (focus + partner + eligible candidates) pulls forward in world Z so it lands
 * sharper after the camera dolly; off-tonight / cooling / closed members
 * recede so they read as context behind the active layer. Stars lerp into
 * these offsets each frame via the StarSprite useFrame, so transitions feel
 * like depth re-layering rather than teleports.
 */
function computeLayerZOffset(role: StarRole, state: LobbyState): number {
  if (state === "idle" || state === "callout_heavy") return 0;
  if (role === "focus" || role === "partner") return 1.4;
  if (role === "eligible") return 2.4;
  if (role === "ineligible_cooling") return -3;
  if (role === "ineligible_off_shift") return -5;
  if (role === "ineligible_closed") return -6;
  return -1.5;
}

function starWorldPosition(star: StarMark): Vec3 {
  return {
    x: (star.x - 50) * WORLD_X_SCALE,
    y: (star.y - 50) * WORLD_Y_SCALE,
    z: star.z * WORLD_Z_SCALE,
  };
}

function pairPartnerPosition(focus: StarMark): Vec3 {
  const px = focus.x + 14;
  const py = focus.y + 2;
  return {
    x: (px - 50) * WORLD_X_SCALE,
    y: (py - 50) * WORLD_Y_SCALE,
    z: focus.z * WORLD_Z_SCALE,
  };
}

function computeCameraTarget(state: LobbyState, focus: StarMark | undefined): CameraTarget {
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
  // partner_selected, committed_pair, scenario_chosen — frame the pair
  const anchorX = fp.x + 1.4;
  const anchorY = fp.y + 0.2;
  return {
    position: [anchorX * 0.55, anchorY * 0.45, 6.5],
    lookAt: [anchorX * 0.85, anchorY * 0.8, fp.z + 0.3],
    bokehScale: 1.5,
  };
}

type StarSizing = {
  avatarRadius: number;
  haloRadius: number;
  sparkRadius: number;
  flareSize: number;
  scale: number;
};

function sizeForStar3D(tier: StarTier, role: StarRole, state: LobbyState): StarSizing {
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

function intensityForRole(role: StarRole, tier: StarTier, state: LobbyState): number {
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

function ringColorForRole(role: StarRole, state: LobbyState, palette: PortraitPalette): string {
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
