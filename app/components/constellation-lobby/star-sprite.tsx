import { useMemo, useRef, type ReactNode } from "react";
import { Billboard, Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import {
  haloColorForStar,
  intensityForRole,
  resolveStarRenderTarget,
  sizeForStar3D,
  starWorldPosition,
} from "./math";
import { FocusSelectionMarker } from "./focus-selection-marker";
import { featherAvatarShader } from "./textures";
import type { LobbyState, StarFlythroughLayer, StarMark, StarRole, Vec3 } from "./types";

type StarOverlayMetrics = {
  avatarRadius: number;
  haloSize: number;
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

  return ({ avatarRadius }) => (
    <FocusSelectionMarker
      member={star.member}
      avatarRadius={avatarRadius}
      onClearFocus={onClearFocus}
      onHoverChange={onHoverChange}
    />
  );
}

export function StarSprite({
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
  slabActivity?: { intensityMultiplier: number; scaleMultiplier: number };
  /**
   * Layer picker override. When non-null, the star lerps to this position.
   */
  clusterPosition?: Vec3 | null;
  /**
   * Optional world-anchored HTML overlay rendered inside the billboard.
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
  const avatarSubgroupRef = useRef<THREE.Group>(null);
  const avatarSubgroupScaleRef = useRef(0.38);

  const natural = useMemo(() => starWorldPosition(star), [star]);
  const sizing = useMemo(() => sizeForStar3D(star.tier, role, state), [star.tier, role, state]);
  const haloColor = useMemo(
    () => haloColorForStar(role, star.palette, star.aura),
    [role, star.palette, star.aura],
  );
  const flareColor = useMemo(() => (role === "focus" ? "#ffd5a3" : "#dec8ff"), [role]);
  const intensity = useMemo(
    () => intensityForRole(role, star.tier, state),
    [role, star.tier, state],
  );
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

    const slabIntensity = slabActivity?.intensityMultiplier ?? 1;
    const inCluster = clusterPosition !== null;
    const isProminent = inCluster || slabIntensity >= 0.9;

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
      const haloMix = reducedMotion ? 1 : 0.78 + slow * 0.22 + twinkle * 0.32;
      const hoverIgnite = hovered ? 1.25 : 1;
      const auraGate = showAura ? 1 : 0.4;
      haloMatRef.current.opacity = THREE.MathUtils.lerp(
        haloMatRef.current.opacity,
        haloBase * haloMix * auraGate * slabIntensity * hoverIgnite,
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
          rimBase * haloMix * auraGate * slabIntensity * hoverIgnite,
          Math.min(1, delta * 5),
        );
      }
    }

    if (flareMatRef.current !== null) {
      const flareBase = role === "eligible" ? 0.22 : 0;
      flareMatRef.current.opacity = THREE.MathUtils.lerp(
        flareMatRef.current.opacity,
        flareBase * (0.85 + slow * 0.3) * slabIntensity,
        Math.min(1, delta * 5),
      );
    }
    if (flareMeshRef.current !== null) {
      const rot = reducedMotion ? 0 : Math.sin(t * 0.3 + star.phase) * 0.06;
      flareMeshRef.current.rotation.z = rot;
    }

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
          onPointerOut={handlePointerLeave}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <circleGeometry args={[sizing.avatarRadius, 24]} />
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

        {hovered && !cardOpen && renderOverlay === undefined ? (
          <Html
            position={[0, -sizing.avatarRadius, 0.12]}
            zIndexRange={[50, 0]}
            className="pointer-events-none"
          >
            <span className="aura-liquid-glass aura-liquid-glass-ink inline-block -translate-x-1/2 -translate-y-1/2 rounded-pill px-3 py-1 font-display text-label leading-none text-aura-paper whitespace-nowrap shadow-cta">
              {star.member.firstName}
            </span>
          </Html>
        ) : null}
        {renderOverlay?.({ avatarRadius: sizing.avatarRadius, haloSize })}
      </Billboard>
    </group>
  );
}
