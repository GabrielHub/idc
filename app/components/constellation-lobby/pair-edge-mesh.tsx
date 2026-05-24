/**
 * 3D constellation edge — a single curved line in world space between two
 * paired stars, plus an invisible tube sleeve for hover hit-testing, plus an
 * optional drei `<Html>` anchor at the bezier midpoint for the hover note
 * preview. Color reads off the pair's relationship health, width off the
 * top note importance, opacity off the player-visible note count.
 *
 * Each edge owns its own useFrame loop that classifies the current LOD band
 * from camera distance to midpoint and mutates the line material props
 * directly — no React re-render per frame.
 */

import { Html, Line } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import type { PairArchiveEdge } from "../../services/pair-archive-graph";
import { edgeBaseOpacity, edgeStrokeWidth } from "../../services/pair-archive-graph";
import { classifyEdgeLod, type EdgeLodSpec } from "./edge-lod";
import type { Vec3 } from "./types";

type Line2 = {
  material: { linewidth: number; opacity: number; transparent: boolean };
};

export type PairEdgeMeshProps = {
  edge: PairArchiveEdge;
  from: Vec3;
  to: Vec3;
  control: Vec3;
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

export function PairEdgeMesh({
  edge,
  from,
  to,
  control,
  isHovered,
  isSelected,
  isFaded = false,
  onHoverEnter,
  onHoverLeave,
  onClick,
  hoverTooltip,
}: PairEdgeMeshProps) {
  const lineRef = useRef<Line2 | null>(null);
  const [currentLod, setCurrentLod] = useState<EdgeLodSpec | null>(() => ({
    band: "near",
    segmentCount: 16,
    widthScale: 1,
    opacityScale: 1,
    mountHtml: false,
    mountHitSleeve: true,
  }));

  const baseWidth = edgeStrokeWidth(edge) * 0.6;
  const baseOpacity = edgeBaseOpacity(edge);
  const color = colorForHealth(edge.health, isHovered || isSelected);

  // Sample bezier curve at the segment count the current LOD specifies.
  // useMemo over the points list keeps the buffer stable until the band
  // (segment count) actually changes — avoids reallocating per frame.
  const points = useMemo(() => {
    const count = currentLod?.segmentCount ?? 16;
    const out: THREE.Vector3[] = [];
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
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
      const mat = lineRef.current.material;
      mat.linewidth = baseWidth * next.widthScale;
      mat.opacity = baseOpacity * next.opacityScale * fadeFactor;
      mat.transparent = true;
    }
  });

  if (currentLod === null) return null;

  const showHtml = currentLod.mountHtml && isHovered && hoverTooltip !== undefined;
  const showSleeve = currentLod.mountHitSleeve;

  return (
    <group>
      <Line
        ref={lineRef as never}
        points={points}
        color={color}
        lineWidth={baseWidth * currentLod.widthScale}
        transparent
        opacity={baseOpacity * currentLod.opacityScale}
      />
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

function quadraticBezierPoint(p0: Vec3, p1: Vec3, p2: Vec3, t: number): THREE.Vector3 {
  const oneMinusT = 1 - t;
  return new THREE.Vector3(
    oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
    oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
    oneMinusT * oneMinusT * p0.z + 2 * oneMinusT * t * p1.z + t * t * p2.z,
  );
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
