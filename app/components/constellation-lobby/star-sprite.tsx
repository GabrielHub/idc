import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { Billboard } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import {
  haloColorForStar,
  intensityForRole,
  resolveStarRenderTarget,
  resolveStarPresentation,
  sizeForStar3D,
  starHitRadiusFloorForCanvasScale,
  starWorldPosition,
  worldPerScreenPixel,
  type HaloRiskTone,
  type StarSlabActivity,
} from "./math";
import { FocusSelectionMarker } from "./focus-selection-marker";
import { isMemberActive } from "../../services/date-engine";
import { riskZoneForMember } from "../../services/member-feedback";
import { StarQuickActionRail } from "./star-quick-action-rail";
import { shouldShowStarQuickActions } from "./star-quick-action-visibility";
import { SceneClosureBadge } from "./star-scene-ui-primitives";
import { featherAvatarShader } from "./textures";
import type {
  LobbyState,
  StarFlythroughLayer,
  StarMark,
  StarQuickAction,
  StarRole,
  Vec3,
} from "./types";

type StarOverlayMetrics = {
  avatarRadius: number;
  haloSize: number;
  /** Billboard-local units per screen pixel — for constant-size scene UI. */
  pixelScaleRef: MutableRefObject<number>;
  /** Avatar disc projected radius in px — for hugging the disc edge. */
  avatarRadiusPxRef: MutableRefObject<number>;
};

type StarOverlayRenderer = (metrics: StarOverlayMetrics) => ReactNode;

export function buildFocusMarkerOverlay({
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

  return ({ pixelScaleRef, avatarRadiusPxRef }) => (
    <FocusSelectionMarker
      member={star.member}
      pixelScaleRef={pixelScaleRef}
      avatarRadiusPxRef={avatarRadiusPxRef}
      onClearFocus={onClearFocus}
      onHoverChange={onHoverChange}
    />
  );
}

export function StarSprite({
  star,
  role,
  sizingRole = role,
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
  forceAvatar = false,
  canvasScale = 1,
  clusterPosition = null,
  renderOverlay,
  quickActions,
  onQuickActionsHoverChange,
  onHoverEnter,
  onHoverLeave,
  onClick,
  onDoubleClick,
}: {
  star: StarMark;
  role: StarRole;
  sizingRole?: StarRole;
  state: LobbyState;
  overridePos: Vec3 | null;
  layerZOffset: number;
  texture: THREE.Texture | undefined;
  flareTexture: THREE.Texture | null;
  /** Soft radial halo behind every avatar — replaces the old sparkle cross. */
  haloTexture: THREE.Texture | null;
  /**
   * Tinted ring gradient composited in front of the avatar disc. Bridges the
   * portrait silhouette into the surrounding sparkle halo.
   */
  rimLightTexture: THREE.Texture | null;
  showAura: boolean;
  reducedMotion: boolean;
  /** Lens-filter excluded this star — gets extra dimming + lower opacity. */
  filteredOut?: boolean;
  /** Pointer is over the star — bump scale to telegraph "you can click me". */
  hovered?: boolean;
  /** Hide the 3D mesh while the detail card is morphing out of this star. */
  cardOpen?: boolean;
  /**
   * Flythrough slab the star lives on. Undefined means no slab treatment.
   */
  flythroughLayer?: StarFlythroughLayer;
  /**
   * Per-star multipliers driven by the currentLayer vs this star's slab.
   */
  slabActivity?: StarSlabActivity;
  /**
   * Presentation override for graph modes where dim-role members should still
   * render as readable portraits instead of dormant field dots.
   */
  forceAvatar?: boolean;
  /** Canvas-derived multiplier for world-space avatar and halo geometry. */
  canvasScale?: number;
  /**
   * Layer picker override. When non-null, the star lerps to this position.
   */
  clusterPosition?: Vec3 | null;
  /**
   * Optional world-anchored scene UI rendered inside the billboard.
   */
  renderOverlay?: StarOverlayRenderer;
  quickActions?: readonly StarQuickAction[];
  onQuickActionsHoverChange: (hovered: boolean) => void;
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
  const avatarSubgroupRef = useRef<THREE.Group>(null);
  const avatarSubgroupScaleRef = useRef(0.38);
  const screenHoverRef = useRef(false);
  const projectedCenterRef = useRef(new THREE.Vector3());
  const projectedEdgeRef = useRef(new THREE.Vector3());
  const worldCenterRef = useRef(new THREE.Vector3());
  const worldScaleRef = useRef(new THREE.Vector3());
  const cameraRightRef = useRef(new THREE.Vector3());
  const cameraForwardRef = useRef(new THREE.Vector3());
  const toStarRef = useRef(new THREE.Vector3());
  // Constant-screen-size scene UI: Billboard-local units per screen pixel, and
  // the avatar disc's projected radius in px. Written each frame, read by the
  // quick-action rail and focus marker so they stay the same size on every layer.
  const uiPixelScaleRef = useRef(0.003);
  const avatarRadiusPxRef = useRef(60);

  // Latched hover for the quick-action rail: keep the rail mounted while either
  // the avatar hit plane or an in-scene control owns hover, with a short grace
  // period for tiny gaps between raycast targets.
  const [quickActionsHovered, setQuickActionsHovered] = useState(false);
  const [quickActionsLatched, setQuickActionsLatched] = useState(false);
  useEffect(() => {
    if (hovered || quickActionsHovered) {
      setQuickActionsLatched(true);
      return;
    }
    const timer = window.setTimeout(() => setQuickActionsLatched(false), 360);
    return () => window.clearTimeout(timer);
  }, [hovered, quickActionsHovered]);
  useEffect(
    () => () => {
      if (typeof document !== "undefined") document.body.style.cursor = "";
    },
    [],
  );

  const natural = useMemo(() => starWorldPosition(star), [star]);
  const sizing = useMemo(
    () => sizeForStar3D(star.tier, sizingRole, state, canvasScale),
    [canvasScale, star.tier, sizingRole, state],
  );
  const riskTone: HaloRiskTone = useMemo(() => {
    if (!isMemberActive(star.member)) return "steady";
    return riskZoneForMember(star.member).zone;
  }, [star.member]);
  const haloColor = useMemo(
    () => haloColorForStar(role, star.palette, star.aura, riskTone),
    [role, star.palette, star.aura, riskTone],
  );
  const flareColor = useMemo(() => (role === "focus" ? "#ffd5a3" : "#dec8ff"), [role]);
  const intensity = useMemo(
    () => intensityForRole(role, star.tier, state),
    [role, star.tier, state],
  );
  const presentation = useMemo(
    () =>
      resolveStarPresentation({
        tier: star.tier,
        role,
        clustered: clusterPosition !== null,
        hovered,
        slabActivity,
        baseIntensity: intensity,
        filteredOut,
        avatarRadius: sizing.avatarRadius,
        forceAvatar,
        hitRadiusFloor: starHitRadiusFloorForCanvasScale(canvasScale),
      }),
    [
      clusterPosition,
      filteredOut,
      hovered,
      intensity,
      forceAvatar,
      role,
      sizing.avatarRadius,
      canvasScale,
      slabActivity,
      star.tier,
    ],
  );
  const haloSize = useMemo(() => {
    const reach =
      sizingRole === "focus" || sizingRole === "partner"
        ? 1.9
        : sizingRole === "eligible"
          ? 2.2
          : sizingRole === "ineligible_cooling"
            ? 1.85
            : 1.95;
    return sizing.avatarRadius * reach;
  }, [sizingRole, sizing.avatarRadius]);
  const showQuickActions = shouldShowStarQuickActions({
    tier: star.tier,
    clustered: clusterPosition !== null,
    actions: quickActions,
  });
  const visibleQuickActions = showQuickActions ? quickActions : undefined;
  const interactionRadius = Math.max(presentation.hitRadius, sizing.avatarRadius * 1.65);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    const inCluster = clusterPosition !== null;

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
      const targetZ = target.z + presentation.zLift;
      // zLift dollies a hovered background star toward the camera. Without
      // compensation, perspective projection drags the star outward from the
      // camera's view axis — the avatar slides away from the cursor and the
      // hit plane shifts past it, causing hover flicker. Scale the camera
      // offset by the distance ratio so the projected screen position is
      // preserved across the lift.
      const distZOld = s.camera.position.z - target.z;
      const distZNew = s.camera.position.z - targetZ;
      const xyCompensation =
        presentation.zLift === 0 || distZOld <= 0 || distZNew <= 0 ? 1 : distZNew / distZOld;
      const compensatedX = s.camera.position.x + (target.x - s.camera.position.x) * xyCompensation;
      const compensatedY = s.camera.position.y + (target.y - s.camera.position.y) * xyCompensation;
      const targetX = compensatedX + driftX;
      const targetY = compensatedY + driftY;

      const moveLerp = reducedMotion ? 1 : 1 - Math.pow(0.0008, delta);
      const pos = groupRef.current.position;
      pos.x = THREE.MathUtils.lerp(pos.x, targetX, moveLerp);
      pos.y = THREE.MathUtils.lerp(pos.y, targetY, moveLerp);
      pos.z = THREE.MathUtils.lerp(pos.z, targetZ, moveLerp);

      const scaleLerp = reducedMotion ? 1 : 1 - Math.pow(0.002, delta);
      const hoverBoost = hovered ? 1.25 : 1;
      scaleRef.current = THREE.MathUtils.lerp(
        scaleRef.current,
        sizing.scale * presentation.slabScale * hoverBoost,
        scaleLerp,
      );
      groupRef.current.scale.setScalar(scaleRef.current);
    }

    const avatarSubgroupLerp = reducedMotion ? 1 : 1 - Math.pow(0.0018, delta);
    avatarSubgroupScaleRef.current = THREE.MathUtils.lerp(
      avatarSubgroupScaleRef.current,
      presentation.avatarScale,
      avatarSubgroupLerp,
    );
    if (avatarSubgroupRef.current !== null) {
      avatarSubgroupRef.current.scale.setScalar(avatarSubgroupScaleRef.current);
    }

    if (avatarMatRef.current !== null) {
      avatarMatRef.current.opacity = THREE.MathUtils.lerp(
        avatarMatRef.current.opacity,
        presentation.avatarOpacity,
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

    const slow = Math.sin(t * 1.4 + star.phase) * 0.5 + 0.5;
    const twinkleRaw = Math.sin(t * 3.6 + star.phase * 2.3) * 0.5 + 0.5;
    const twinkle = twinkleRaw * twinkleRaw * twinkleRaw;

    if (haloMatRef.current !== null) {
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
      const haloMix = reducedMotion
        ? 1
        : riskTone === "at-risk"
          ? 0.5 + slow * 0.5 + twinkle * 0.32
          : 0.78 + slow * 0.22 + twinkle * 0.32;
      const hoverIgnite = hovered ? 1.25 : 1;
      const auraGate = showAura ? 1 : 0.4;
      haloMatRef.current.opacity = THREE.MathUtils.lerp(
        haloMatRef.current.opacity,
        haloBase * haloMix * auraGate * presentation.slabIntensity * hoverIgnite,
        Math.min(1, delta * 5),
      );

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
          rimBase * haloMix * auraGate * presentation.slabIntensity * hoverIgnite,
          Math.min(1, delta * 5),
        );
      }
    }

    if (flareMatRef.current !== null) {
      const flareBase = role === "eligible" ? 0.22 : 0;
      flareMatRef.current.opacity = THREE.MathUtils.lerp(
        flareMatRef.current.opacity,
        flareBase * (0.85 + slow * 0.3) * presentation.slabIntensity,
        Math.min(1, delta * 5),
      );
    }
    if (flareMeshRef.current !== null) {
      const rot = reducedMotion ? 0 : Math.sin(t * 0.3 + star.phase) * 0.06;
      flareMeshRef.current.rotation.z = rot;
    }

    if (groupRef.current !== null) {
      const avatarOpacity = avatarMatRef.current?.opacity ?? 0;
      const haloOpacity = haloMatRef.current?.opacity ?? 0;
      // Halo alone keeps a dormant background dot visible — without this gate
      // the whole sprite culls once the avatar fades out.
      const shouldRender = !cardOpen && (avatarOpacity > 0.01 || haloOpacity > 0.01);
      if (groupRef.current.visible !== shouldRender) {
        groupRef.current.visible = shouldRender;
      }
    }

    if (groupRef.current !== null && groupRef.current.visible && !cardOpen) {
      groupRef.current.getWorldPosition(worldCenterRef.current);
      projectedCenterRef.current.copy(worldCenterRef.current).project(s.camera);
      cameraRightRef.current.setFromMatrixColumn(s.camera.matrixWorld, 0).normalize();
      const worldScale = groupRef.current.getWorldScale(worldScaleRef.current).x;

      // Constant-screen-size scene UI. The name pill / quick-action rail / focus
      // marker live in this billboard but must read the same on every layer, so
      // each frame we convert their pixel design into Billboard-local units:
      // cancel the perspective foreshortening (worldPerScreenPixel at this view
      // depth) and the group's world scale. avatarRadiusPx is the disc's true
      // projected radius, so the UI hugs the disc edge, never the avatar texture.
      const camera = s.camera as THREE.PerspectiveCamera;
      camera.getWorldDirection(cameraForwardRef.current);
      const viewDepth = toStarRef.current
        .subVectors(worldCenterRef.current, camera.position)
        .dot(cameraForwardRef.current);
      const worldPerPixel = worldPerScreenPixel(
        viewDepth,
        Math.tan((camera.fov * Math.PI) / 180 / 2),
        s.size.height,
      );
      if (worldPerPixel > 0 && worldScale > 0) {
        uiPixelScaleRef.current = worldPerPixel / worldScale;
        avatarRadiusPxRef.current =
          (sizing.avatarRadius * avatarSubgroupScaleRef.current * worldScale) / worldPerPixel;
      }

      projectedEdgeRef.current
        .copy(worldCenterRef.current)
        .addScaledVector(cameraRightRef.current, interactionRadius * worldScale)
        .project(s.camera);

      const radius =
        Math.abs(projectedEdgeRef.current.x - projectedCenterRef.current.x) *
        (screenHoverRef.current ? 1.28 : 1);
      const dx = s.pointer.x - projectedCenterRef.current.x;
      const dy = s.pointer.y - projectedCenterRef.current.y;
      const insideProjectedHit = dx * dx + dy * dy <= radius * radius;

      if (insideProjectedHit && !screenHoverRef.current) {
        screenHoverRef.current = true;
        if (typeof document !== "undefined") document.body.style.cursor = "pointer";
        onHoverEnter();
      } else if (!insideProjectedHit && screenHoverRef.current) {
        screenHoverRef.current = false;
        if (typeof document !== "undefined") document.body.style.cursor = "";
        onHoverLeave();
      }
    } else if (screenHoverRef.current) {
      screenHoverRef.current = false;
      if (typeof document !== "undefined") document.body.style.cursor = "";
      onHoverLeave();
    }
  });

  const handlePointerEnter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (typeof document !== "undefined") document.body.style.cursor = "pointer";
    onHoverEnter();
  };
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (typeof document !== "undefined") document.body.style.cursor = "pointer";
    if (!hovered) onHoverEnter();
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
  const closureGlyph: "heart" | "x" | null =
    star.member.state.status === "closed"
      ? "heart"
      : star.member.state.status === "quit"
        ? "x"
        : null;

  return (
    <group ref={groupRef} position={[natural.x, natural.y, natural.z]}>
      <Billboard>
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

        <mesh
          position={[0, 0, 0.08]}
          onPointerOver={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerLeave}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <circleGeometry args={[interactionRadius, 32]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <group ref={avatarSubgroupRef}>
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

          {closureGlyph !== null ? (
            <SceneClosureBadge
              glyph={closureGlyph}
              radius={sizing.avatarRadius * 0.17}
              position={[sizing.avatarRadius * 0.85, sizing.avatarRadius * 0.85, 0.05]}
            />
          ) : null}
        </group>

        {(hovered || quickActionsLatched) && !cardOpen && renderOverlay === undefined ? (
          <StarQuickActionRail
            actions={visibleQuickActions ?? []}
            memberName={star.member.firstName}
            showActions={quickActionsLatched && visibleQuickActions !== undefined}
            active={hovered || quickActionsHovered}
            pixelScaleRef={uiPixelScaleRef}
            avatarRadiusPxRef={avatarRadiusPxRef}
            onHoverChange={(nextHovered) => {
              setQuickActionsHovered(nextHovered);
              onQuickActionsHoverChange(nextHovered);
              if (nextHovered) onHoverEnter();
            }}
          />
        ) : null}

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
        {renderOverlay?.({
          avatarRadius: sizing.avatarRadius,
          haloSize,
          pixelScaleRef: uiPixelScaleRef,
          avatarRadiusPxRef,
        })}
      </Billboard>
    </group>
  );
}
