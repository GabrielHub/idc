/**
 * 3D constellation edge — a single curved line in world space between two
 * paired stars, plus an invisible tube sleeve for hover hit-testing, plus an
 * optional drei `<Html>` anchor at the bezier midpoint for the hover note
 * preview. Color reads off the pair's relationship health, width off the
 * top note importance, opacity off the player-visible note count.
 *
 * The line is trimmed at both ends by a world-space inset so it meets each
 * portrait disc's edge with a small, even gap instead of stabbing into the
 * face. The core flows as health-driven dashes over a steady soft glow: warm
 * pairs read near-solid and drift slowly, volatile pairs fray into short, fast,
 * jittery segments. The only midpoint ornament is a soft pip that fades in when
 * the edge is hovered or selected.
 *
 * Each edge owns its own useFrame loop that classifies the current LOD band
 * from camera distance to midpoint and mutates the line material props
 * directly — no React re-render per frame.
 */

import { Billboard, Html, Line } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

import type { PairArchiveEdge } from "../../services/pair-archive-graph";
import { edgeBaseOpacity, edgeStrokeWidth } from "../../services/pair-archive-graph";
import { classifyEdgeLod, type EdgeLodSpec } from "./edge-lod";
import type { Vec3 } from "./types";

type EdgeLine = ComponentRef<typeof Line>;

export type PairEdgeMeshProps = {
  edge: PairArchiveEdge;
  from: Vec3;
  to: Vec3;
  control: Vec3;
  /**
   * World-space distance to stop the drawn line short of each endpoint so it
   * meets the portrait disc's edge with a small gap. Falls back to a constant
   * when the caller can't supply the live avatar size.
   */
  endpointInset?: number;
  isHovered: boolean;
  isSelected: boolean;
  /**
   * Edge is outside the active isolation scope (a star is selected and this
   * edge isn't incident to it). Multiplies opacity by a low constant so the
   * connection still reads but recedes from the focused subgraph.
   */
  isFaded?: boolean;
  /**
   * Hover handlers fire from the invisible tube sleeve so the hit area
   * isn't the few-pixel line itself. Click handler opens the dossier.
   */
  onHoverEnter: (event: ThreeEvent<PointerEvent>) => void;
  onHoverLeave: (event: ThreeEvent<PointerEvent>) => void;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  /**
   * Optional hover-tooltip content. Mounted in a drei <Html> at the bezier
   * midpoint when the LOD spec allows (near band) and the edge is hovered.
   */
  hoverTooltip?: ReactNode;
};

const FADED_OPACITY_MULTIPLIER = 0.18;
const DEFAULT_ENDPOINT_INSET = 0.6;
const EDGE_GLOW_WIDTH_MULTIPLIER = 3.4;
const EDGE_GLOW_OPACITY_MULTIPLIER = 0.36;
// Midpoint pip — a soft dot that anchors the eye (and the tooltip) only while
// the edge is highlighted. Small and static; the line carries the resting read.
const PIP_CORE_RADIUS = 0.05;
const PIP_GLOW_RADIUS = 0.15;

export function PairEdgeMesh({
  edge,
  from,
  to,
  control,
  endpointInset = DEFAULT_ENDPOINT_INSET,
  isHovered,
  isSelected,
  isFaded = false,
  onHoverEnter,
  onHoverLeave,
  onClick,
  hoverTooltip,
}: PairEdgeMeshProps) {
  const lineRef = useRef<EdgeLine | null>(null);
  const glowLineRef = useRef<EdgeLine | null>(null);
  const [currentLod, setCurrentLod] = useState<EdgeLodSpec | null>(() => ({
    band: "near",
    segmentCount: 16,
    widthScale: 1,
    opacityScale: 1,
    mountHtml: false,
    mountHitSleeve: true,
  }));

  const progressRatio = Math.min(1, Math.max(0, edge.closureProgress / 100));
  // Re-centered around the prior 1.0 multiplier so steady-progress edges keep
  // their old thickness; early-progress edges dim slightly, ready edges bolden
  // slightly. Edges that still carry closure blockers cap below the ready boost
  // so the constellation reads "not yet ready" before the dossier confirms it.
  const blockerPenalty = edge.closureBlockers.length > 0 ? 0.92 : 1.0;
  const progressBoost = 0.85 + progressRatio * 0.3;
  const baseWidth = edgeStrokeWidth(edge) * 0.6 * progressBoost * blockerPenalty;
  const baseOpacity = edgeBaseOpacity(edge);
  const highlighted = isHovered || isSelected;
  const color = colorForHealth(edge.health, highlighted);
  const reducedMotion = useReducedMotion() ?? false;
  const flow = threadFlowForHealth(edge.health);

  // Sample the bezier curve at the segment count the current LOD specifies,
  // trimmed at both ends by a world-space inset converted to a curve parameter
  // via the chord-plus-arms length estimate. Trimming in world units (not a
  // fixed parameter fraction) keeps the disc gap even across short and long
  // edges. useMemo keeps the buffer stable until inputs change — no per-frame
  // reallocation.
  const points = useMemo(() => {
    const count = currentLod?.segmentCount ?? 16;
    const approxLength =
      (vecDistance(from, control) + vecDistance(control, to) + vecDistance(from, to)) / 2;
    const tInset = approxLength > 0 ? Math.min(0.45, Math.max(0, endpointInset / approxLength)) : 0;
    const span = 1 - tInset * 2;
    const out: THREE.Vector3[] = [];
    for (let i = 0; i <= count; i += 1) {
      const t = tInset + (i / count) * span;
      out.push(quadraticBezierPoint(from, control, to, t));
    }
    return out;
  }, [
    from.x,
    from.y,
    from.z,
    control.x,
    control.y,
    control.z,
    to.x,
    to.y,
    to.z,
    currentLod?.segmentCount,
    endpointInset,
  ]);

  // Tube curve for the invisible hit sleeve.
  const tubeCurve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(from.x, from.y, from.z),
        new THREE.Vector3(control.x, control.y, control.z),
        new THREE.Vector3(to.x, to.y, to.z),
      ),
    [from.x, from.y, from.z, control.x, control.y, control.z, to.x, to.y, to.z],
  );

  const midpoint = useMemo(
    () => quadraticBezierPoint(from, control, to, 0.5),
    [from.x, from.y, from.z, control.x, control.y, control.z, to.x, to.y, to.z],
  );

  useFrame((sceneState) => {
    const dist = sceneState.camera.position.distanceTo(midpoint);
    const next = classifyEdgeLod(edge, dist, isHovered, isSelected);
    if ((next?.band ?? null) !== (currentLod?.band ?? null)) {
      setCurrentLod(next);
    }
    if (next !== null && lineRef.current !== null) {
      // Material mutation per-frame — no React re-render. Hovered/selected
      // edges short-circuit the fade so the player can still pull a faded
      // edge back into focus by pointing at it.
      const fadeFactor = isFaded && !isHovered && !isSelected ? FADED_OPACITY_MULTIPLIER : 1;
      const opacity = baseOpacity * next.opacityScale * fadeFactor;
      applyLineMaterial(lineRef.current, baseWidth * next.widthScale, opacity);
      applyLineMaterial(
        glowLineRef.current,
        baseWidth * next.widthScale * EDGE_GLOW_WIDTH_MULTIPLIER,
        Math.min(0.68, opacity * EDGE_GLOW_OPACITY_MULTIPLIER + (highlighted ? 0.12 : 0)),
      );
      // Flow the dashed core toward the partner. Volatile threads add a small
      // stutter so they read as tense. Static under reduced motion.
      if (!reducedMotion) {
        const t = sceneState.clock.elapsedTime;
        const jitter = flow.jitter > 0 ? Math.sin(t * 23 + midpoint.x * 2) * flow.jitter : 0;
        lineRef.current.material.dashOffset = -t * flow.flowSpeed + jitter;
      }
    }
  });

  if (currentLod === null) return null;

  const fadeFactor = isFaded && !isHovered && !isSelected ? FADED_OPACITY_MULTIPLIER : 1;
  const visibleOpacity = baseOpacity * currentLod.opacityScale * fadeFactor;
  const glowOpacity = Math.min(
    0.68,
    visibleOpacity * EDGE_GLOW_OPACITY_MULTIPLIER + (highlighted ? 0.12 : 0),
  );
  const pipGlowOpacity = Math.min(0.5, visibleOpacity * 0.5 + 0.12);
  const pipCoreOpacity = Math.min(0.95, visibleOpacity + 0.2);
  const showHtml = currentLod.mountHtml && highlighted && hoverTooltip !== undefined;
  const showSleeve = currentLod.mountHitSleeve;

  return (
    <group>
      <Line
        ref={glowLineRef}
        points={points}
        color={color}
        lineWidth={baseWidth * currentLod.widthScale * EDGE_GLOW_WIDTH_MULTIPLIER}
        transparent
        opacity={glowOpacity}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
      <Line
        ref={lineRef}
        points={points}
        color={color}
        lineWidth={baseWidth * currentLod.widthScale}
        transparent
        opacity={visibleOpacity}
        dashed
        dashSize={flow.dashSize}
        gapSize={flow.gapSize}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
      {highlighted ? (
        <Billboard position={[midpoint.x, midpoint.y, midpoint.z + 0.015]}>
          <mesh raycast={() => null}>
            <circleGeometry args={[PIP_GLOW_RADIUS, 24]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={pipGlowOpacity}
              depthWrite={false}
              depthTest={false}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh raycast={() => null} position={[0, 0, 0.01]}>
            <circleGeometry args={[PIP_CORE_RADIUS, 20]} />
            <meshBasicMaterial
              color="#fff7ed"
              transparent
              opacity={pipCoreOpacity}
              depthWrite={false}
              depthTest={false}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </Billboard>
      ) : null}
      {showSleeve ? (
        <mesh onPointerOver={onHoverEnter} onPointerOut={onHoverLeave} onClick={onClick}>
          <tubeGeometry
            args={[tubeCurve, Math.max(8, currentLod.segmentCount / 2), 0.18, 6, false]}
          />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} color="#ffffff" />
        </mesh>
      ) : null}
      {showHtml ? (
        <Html
          position={[midpoint.x, midpoint.y, midpoint.z]}
          zIndexRange={[55, 0]}
          className="pointer-events-none"
        >
          <div className="relative h-0 w-0">{hoverTooltip}</div>
        </Html>
      ) : null}
    </group>
  );
}

function applyLineMaterial(line: EdgeLine | null, lineWidth: number, opacity: number): void {
  if (line === null) return;
  const mat = line.material;
  mat.linewidth = lineWidth;
  mat.opacity = opacity;
  mat.transparent = true;
  mat.depthWrite = false;
  mat.depthTest = false;
  mat.toneMapped = false;
  mat.blending = THREE.AdditiveBlending;
}

function vecDistance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function quadraticBezierPoint(p0: Vec3, p1: Vec3, p2: Vec3, t: number): THREE.Vector3 {
  const oneMinusT = 1 - t;
  return new THREE.Vector3(
    oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
    oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
    oneMinusT * oneMinusT * p0.z + 2 * oneMinusT * t * p1.z + t * t * p2.z,
  );
}

export type ThreadFlow = {
  dashSize: number;
  gapSize: number;
  flowSpeed: number;
  jitter: number;
};

/**
 * Health-driven dash rhythm for the connection thread. Warm pairs read as a
 * long, near-solid line drifting slowly; steady pairs get a calm dash cadence;
 * volatile pairs fray into short, gappy segments that flow fast with a stutter.
 * Bands match colorForHealth so dash continuity and color tell the same story.
 * Shared with the lobby's focus-partner spoke so both read identically.
 */
export function threadFlowForHealth(health: number): ThreadFlow {
  if (health >= 70) {
    return { dashSize: 1.6, gapSize: 0.14, flowSpeed: 0.22, jitter: 0 };
  }
  if (health >= 40) {
    return { dashSize: 0.95, gapSize: 0.28, flowSpeed: 0.4, jitter: 0 };
  }
  return { dashSize: 0.42, gapSize: 0.46, flowSpeed: 0.85, jitter: 0.06 };
}

/**
 * Health-driven color. relationshipHealth is roughly 0..100. Above 70 reads
 * warm (rose, stable), 40-70 violet (steady), below 40 amber (volatile).
 * Hovered/selected edges shift slightly brighter. Exported so the lobby's
 * focus-partner spoke renderer can share the same palette as archive edges.
 */
export function colorForHealth(health: number, highlighted: boolean): string {
  if (health >= 70) return highlighted ? "#fda4af" : "#fb7185";
  if (health >= 40) return highlighted ? "#ddd6fe" : "#c4b5fd";
  return highlighted ? "#fcd34d" : "#f59e0b";
}
