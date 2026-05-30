import { useEffect, useMemo, useState } from "react";
import { Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

type FlatPillTone = "label" | "labelActive";
type ButtonTone = "glass" | "rose" | "amber";

export type SceneGlyphKind = "swap" | "case" | "check" | "clear" | "heart" | "x";

const PAPER = "#fffdf9";
const INK = "#0f172a";
const ROSE = "#f43f5e";
const FUCHSIA = "#d946ef";
const AMBER = "#f59e0b";
const EMERALD = "#10b981";

/** Per-character advance ratio for scene `Text` width estimates (one fixed face). */
const SCENE_TEXT_ADVANCE_RATIO = 0.58;

/**
 * Rough advance-width of a single drei `Text` line, in the same local units as
 * `fontSizePx`. Scene labels use one fixed face at a constant size, so a single
 * per-character ratio tracks the rendered width closely enough to size pill
 * backplates and clamp `maxWidth`. Centralized here so the quick-action rail and
 * focus marker estimate identically (they previously drifted: 0.58 vs 0.6).
 */
export function estimateSceneTextWidth(text: string, fontSizePx: number): number {
  return text.length * fontSizePx * SCENE_TEXT_ADVANCE_RATIO;
}

/**
 * Apply a Billboard-local pixel scale to a scene-UI root group. Floors at a tiny
 * positive value so a degenerate (zero / negative) projection can't collapse the
 * group to scale 0 and hide it permanently once it recovers.
 */
export function applyScenePixelScale(group: THREE.Group, pixelScale: number): void {
  group.scale.setScalar(pixelScale > 0 ? pixelScale : 0.0001);
}

function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

function heartShape(size: number): THREE.Shape {
  const s = size;
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.38 * s);
  shape.bezierCurveTo(-0.52 * s, -0.08 * s, -0.55 * s, 0.28 * s, -0.28 * s, 0.38 * s);
  shape.bezierCurveTo(-0.11 * s, 0.45 * s, 0, 0.33 * s, 0, 0.2 * s);
  shape.bezierCurveTo(0, 0.33 * s, 0.11 * s, 0.45 * s, 0.28 * s, 0.38 * s);
  shape.bezierCurveTo(0.55 * s, 0.28 * s, 0.52 * s, -0.08 * s, 0, -0.38 * s);
  return shape;
}

function RoundedRectMesh({
  width,
  height,
  radius,
  color,
  opacity,
  position,
  blending,
}: {
  width: number;
  height: number;
  radius: number;
  color: string;
  opacity: number;
  position?: [number, number, number];
  blending?: THREE.Blending;
}) {
  const shape = useMemo(() => roundedRectShape(width, height, radius), [height, radius, width]);
  return (
    <mesh raycast={() => null} position={position}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        fog={false}
        blending={blending}
        toneMapped={false}
      />
    </mesh>
  );
}

export function SceneFlatPill({
  width,
  height,
  radius = height * 0.34,
  tone = "label",
}: {
  width: number;
  height: number;
  radius?: number;
  tone?: FlatPillTone;
}) {
  const tokens = flatPillToneTokens(tone);
  return (
    <group>
      <RoundedRectMesh
        width={width + height * 0.08}
        height={height + height * 0.08}
        radius={radius + height * 0.04}
        color={tokens.border}
        opacity={tokens.borderOpacity}
        position={[0, 0, -0.012]}
      />
      <RoundedRectMesh
        width={width}
        height={height}
        radius={radius}
        color={tokens.fill}
        opacity={tokens.fillOpacity}
        position={[0, 0, -0.006]}
      />
    </group>
  );
}

export function SceneText({
  children,
  fontSize,
  color = PAPER,
  maxWidth,
  position,
  anchorX = "center",
  anchorY = "middle",
  whiteSpace = "nowrap",
  lineHeight,
  outlineWidth,
}: {
  children: string;
  fontSize: number;
  color?: string;
  maxWidth?: number;
  position?: [number, number, number];
  anchorX?: "center" | "left" | "right";
  anchorY?: "middle" | "top" | "bottom";
  whiteSpace?: "normal" | "overflowWrap" | "nowrap";
  lineHeight?: number;
  outlineWidth?: number;
}) {
  return (
    <Text
      raycast={() => null}
      fontSize={fontSize}
      color={color}
      maxWidth={maxWidth}
      anchorX={anchorX}
      anchorY={anchorY}
      textAlign={anchorX === "center" ? "center" : anchorX}
      whiteSpace={whiteSpace}
      lineHeight={lineHeight}
      outlineColor="rgba(0, 0, 0, 0.45)"
      outlineWidth={outlineWidth ?? fontSize * 0.045}
      position={position}
    >
      {children}
    </Text>
  );
}

export function SceneCircleButton({
  radius,
  tone,
  disabled = false,
  position,
  glyph,
  label,
  onPress,
  onHoverChange,
}: {
  radius: number;
  tone: ButtonTone;
  disabled?: boolean;
  /** Local offset. Omit when a parent group already positions the button. */
  position?: [number, number, number];
  glyph: SceneGlyphKind;
  label: string;
  onPress: () => void | Promise<void>;
  onHoverChange: (hovered: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const active = hovered && !disabled;
  const tokens = buttonToneTokens(tone, disabled, active);
  useEffect(
    () => () => {
      if (typeof document !== "undefined") document.body.style.cursor = "";
    },
    [],
  );
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    if (typeof document !== "undefined") {
      document.body.style.cursor = disabled ? "not-allowed" : "pointer";
    }
    onHoverChange(true);
  };
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
    if (typeof document !== "undefined") {
      document.body.style.cursor = disabled ? "not-allowed" : "pointer";
    }
    onHoverChange(true);
  };
  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(false);
    if (typeof document !== "undefined") document.body.style.cursor = "";
    onHoverChange(false);
  };
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (disabled) return;
    void onPress();
  };

  return (
    <group position={position} name={label}>
      <mesh raycast={() => null} position={[0, 0, -0.018]}>
        <circleGeometry args={[radius * (active ? 1.16 : 1.08), 44]} />
        <meshBasicMaterial
          color={tokens.ring}
          transparent
          opacity={tokens.ringOpacity}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      <mesh raycast={() => null} position={[0, 0, -0.006]}>
        <circleGeometry args={[radius, 44]} />
        <meshBasicMaterial
          color={tokens.fill}
          transparent
          opacity={tokens.fillOpacity}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[0, 0, 0.012]}
        onPointerOver={handlePointerOver}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <circleGeometry args={[radius * 1.22, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <SceneGlyph
        glyph={glyph}
        size={radius * 0.9}
        color={tokens.icon}
        opacity={tokens.iconOpacity}
      />
    </group>
  );
}

export function SceneGlyph({
  glyph,
  size,
  color,
  opacity = 1,
}: {
  glyph: SceneGlyphKind;
  size: number;
  color: string;
  opacity?: number;
}) {
  switch (glyph) {
    case "swap":
      return <SwapGlyph size={size} color={color} opacity={opacity} />;
    case "case":
      return <CaseGlyph size={size} color={color} opacity={opacity} />;
    case "check":
      return <CheckGlyph size={size} color={color} opacity={opacity} />;
    case "clear":
      return <ClearGlyph size={size} color={color} opacity={opacity} />;
    case "heart":
      return <HeartGlyph size={size} color={color} opacity={opacity} />;
    case "x":
      return <ClearGlyph size={size * 0.95} color={color} opacity={opacity} />;
  }
}

export function SceneClosureBadge({
  glyph,
  radius,
  position,
}: {
  glyph: "heart" | "x";
  radius: number;
  position: [number, number, number];
}) {
  const fill = glyph === "heart" ? EMERALD : ROSE;
  return (
    <group position={position}>
      <mesh raycast={() => null} position={[0, 0, -0.012]}>
        <circleGeometry args={[radius * 1.18, 40]} />
        <meshBasicMaterial
          color="#07041a"
          transparent
          opacity={0.74}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      <mesh raycast={() => null} position={[0, 0, -0.006]}>
        <circleGeometry args={[radius, 40]} />
        <meshBasicMaterial
          color={fill}
          transparent
          opacity={0.95}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
      <SceneGlyph glyph={glyph} size={radius * 0.96} color="#07041a" />
    </group>
  );
}

function SceneStroke({
  width,
  height,
  color,
  opacity,
  position,
  rotationZ = 0,
}: {
  width: number;
  height: number;
  color: string;
  opacity: number;
  position: [number, number, number];
  rotationZ?: number;
}) {
  return (
    <mesh raycast={() => null} position={position} rotation={[0, 0, rotationZ]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function SwapGlyph({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  const h = size * 0.12;
  return (
    <group position={[0, 0, 0.035]}>
      <SceneStroke
        width={size * 0.82}
        height={h}
        color={color}
        opacity={opacity}
        position={[0, size * 0.2, 0]}
      />
      <SceneStroke
        width={size * 0.32}
        height={h}
        color={color}
        opacity={opacity}
        position={[size * 0.32, size * 0.31, 0.001]}
        rotationZ={Math.PI / 4}
      />
      <SceneStroke
        width={size * 0.32}
        height={h}
        color={color}
        opacity={opacity}
        position={[size * 0.32, size * 0.09, 0.001]}
        rotationZ={-Math.PI / 4}
      />
      <SceneStroke
        width={size * 0.82}
        height={h}
        color={color}
        opacity={opacity}
        position={[0, -size * 0.2, 0]}
      />
      <SceneStroke
        width={size * 0.32}
        height={h}
        color={color}
        opacity={opacity}
        position={[-size * 0.32, -size * 0.31, 0.001]}
        rotationZ={Math.PI / 4}
      />
      <SceneStroke
        width={size * 0.32}
        height={h}
        color={color}
        opacity={opacity}
        position={[-size * 0.32, -size * 0.09, 0.001]}
        rotationZ={-Math.PI / 4}
      />
    </group>
  );
}

function CaseGlyph({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  const h = size * 0.095;
  return (
    <group position={[0, -size * 0.02, 0.035]}>
      <SceneStroke
        width={size * 0.72}
        height={h}
        color={color}
        opacity={opacity}
        position={[0, -size * 0.27, 0]}
      />
      <SceneStroke
        width={size * 0.72}
        height={h}
        color={color}
        opacity={opacity}
        position={[0, size * 0.1, 0]}
      />
      <SceneStroke
        width={h}
        height={size * 0.42}
        color={color}
        opacity={opacity}
        position={[-size * 0.36, -size * 0.08, 0]}
      />
      <SceneStroke
        width={h}
        height={size * 0.42}
        color={color}
        opacity={opacity}
        position={[size * 0.36, -size * 0.08, 0]}
      />
      <SceneStroke
        width={size * 0.28}
        height={h}
        color={color}
        opacity={opacity}
        position={[0, size * 0.32, 0.001]}
      />
      <SceneStroke
        width={h}
        height={size * 0.18}
        color={color}
        opacity={opacity}
        position={[-size * 0.14, size * 0.23, 0.001]}
      />
      <SceneStroke
        width={h}
        height={size * 0.18}
        color={color}
        opacity={opacity}
        position={[size * 0.14, size * 0.23, 0.001]}
      />
    </group>
  );
}

function CheckGlyph({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  const h = size * 0.13;
  return (
    <group position={[0, size * 0.01, 0.035]}>
      <SceneStroke
        width={size * 0.36}
        height={h}
        color={color}
        opacity={opacity}
        position={[-size * 0.18, -size * 0.1, 0]}
        rotationZ={-Math.PI / 4}
      />
      <SceneStroke
        width={size * 0.72}
        height={h}
        color={color}
        opacity={opacity}
        position={[size * 0.14, size * 0.07, 0.001]}
        rotationZ={Math.PI / 4}
      />
    </group>
  );
}

function ClearGlyph({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  const h = size * 0.13;
  return (
    <group position={[0, 0, 0.035]}>
      <SceneStroke
        width={size * 0.85}
        height={h}
        color={color}
        opacity={opacity}
        position={[0, 0, 0]}
        rotationZ={Math.PI / 4}
      />
      <SceneStroke
        width={size * 0.85}
        height={h}
        color={color}
        opacity={opacity}
        position={[0, 0, 0.001]}
        rotationZ={-Math.PI / 4}
      />
    </group>
  );
}

function HeartGlyph({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  const shape = useMemo(() => heartShape(size), [size]);
  return (
    <mesh raycast={() => null} position={[0, -size * 0.02, 0.035]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function flatPillToneTokens(tone: FlatPillTone): {
  fill: string;
  fillOpacity: number;
  border: string;
  borderOpacity: number;
} {
  if (tone === "labelActive") {
    return {
      fill: INK,
      fillOpacity: 0.74,
      border: ROSE,
      borderOpacity: 0.42,
    };
  }
  return {
    fill: INK,
    fillOpacity: 0.58,
    border: "#ffffff",
    borderOpacity: 0.2,
  };
}

function buttonToneTokens(
  tone: ButtonTone,
  disabled: boolean,
  hovered: boolean,
): {
  fill: string;
  fillOpacity: number;
  ring: string;
  ringOpacity: number;
  icon: string;
  iconOpacity: number;
} {
  const disabledMultiplier = disabled ? 0.45 : 1;
  if (tone === "rose") {
    return {
      fill: ROSE,
      fillOpacity: (hovered ? 1 : 0.94) * disabledMultiplier,
      ring: hovered ? PAPER : "#ffe4e6",
      ringOpacity: (hovered ? 0.78 : 0.36) * disabledMultiplier,
      icon: PAPER,
      iconOpacity: disabled ? 0.62 : 1,
    };
  }
  if (tone === "amber") {
    return {
      fill: AMBER,
      fillOpacity: (hovered ? 0.98 : 0.92) * disabledMultiplier,
      ring: hovered ? PAPER : "#ffedd5",
      ringOpacity: (hovered ? 0.74 : 0.38) * disabledMultiplier,
      icon: "#1a0f2e",
      iconOpacity: disabled ? 0.6 : 1,
    };
  }
  return {
    fill: "#fff8fa",
    fillOpacity: (hovered ? 0.9 : 0.74) * disabledMultiplier,
    ring: hovered ? FUCHSIA : "#ffffff",
    ringOpacity: (hovered ? 0.72 : 0.3) * disabledMultiplier,
    icon: INK,
    iconOpacity: disabled ? 0.58 : 0.96,
  };
}
