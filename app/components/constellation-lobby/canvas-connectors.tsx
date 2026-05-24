import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";

import { colorForHealth } from "./pair-edge-mesh";
import type { Vec3 } from "./types";

// Inset distances trim the line endpoints past each star's halo so the spoke
// does not draw over the portraits.
const SPOKE_FOCUS_INSET = 1.05;
const SPOKE_PARTNER_INSET = 0.85;
const SPOKE_ARC_AMOUNT = 0.06;
const SPOKE_SEGMENTS = 32;
const SPOKE_FADE_SPAN = 0.18;

export function PartnerSpoke({
  from,
  to,
  health,
  highlighted,
}: {
  from: Vec3;
  to: Vec3;
  health: number;
  highlighted: boolean;
}) {
  const { points, vertexColors } = useMemo(() => {
    const fromVec = new THREE.Vector3(from.x, from.y, from.z);
    const toVec = new THREE.Vector3(to.x, to.y, to.z);
    const span = toVec.clone().sub(fromVec);
    const totalLength = span.length();
    const dir = span.clone().normalize();
    const start = fromVec.clone().add(dir.clone().multiplyScalar(SPOKE_FOCUS_INSET));
    const end = toVec.clone().sub(dir.clone().multiplyScalar(SPOKE_PARTNER_INSET));
    const visibleLength = Math.max(0.001, totalLength - SPOKE_FOCUS_INSET - SPOKE_PARTNER_INSET);
    const perp = new THREE.Vector3(-dir.y, dir.x, 0);
    if (perp.lengthSq() < 1e-4) perp.set(0, 1, 0);
    perp.normalize().multiplyScalar(visibleLength * SPOKE_ARC_AMOUNT);
    const mid = start.clone().lerp(end, 0.5).add(perp);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const sampled: THREE.Vector3[] = [];
    const colors: Array<[number, number, number]> = [];
    const base = new THREE.Color(colorForHealth(health, highlighted));
    for (let i = 0; i <= SPOKE_SEGMENTS; i += 1) {
      const t = i / SPOKE_SEGMENTS;
      sampled.push(curve.getPoint(t));
      const headFade = Math.min(t / SPOKE_FADE_SPAN, 1);
      const tailFade = Math.min((1 - t) / SPOKE_FADE_SPAN, 1);
      const fade = Math.min(headFade, tailFade);
      const eased = fade * fade * (3 - 2 * fade);
      colors.push([base.r * eased, base.g * eased, base.b * eased]);
    }
    return { points: sampled, vertexColors: colors };
  }, [from.x, from.y, from.z, to.x, to.y, to.z, health, highlighted]);

  return (
    <Line
      points={points}
      vertexColors={vertexColors}
      lineWidth={highlighted ? 4.6 : 2.8}
      transparent
      opacity={highlighted ? 0.95 : 0.7}
      depthWrite={false}
      toneMapped={false}
      blending={THREE.AdditiveBlending}
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

const PLANNING_EDGE_SEGMENTS = 28;
const PLANNING_EDGE_BASE_OPACITY = 0.22;
const PLANNING_EDGE_LINE_WIDTH = 1.3;
const PLANNING_EDGE_ARC_AMOUNT = 0.08;

export function PlanningPairEdge({
  from,
  to,
  health,
  highlighted,
}: {
  from: Vec3;
  to: Vec3;
  health: number;
  highlighted: boolean;
}) {
  const { points, color } = useMemo(() => {
    const fromVec = new THREE.Vector3(from.x, from.y, from.z);
    const toVec = new THREE.Vector3(to.x, to.y, to.z);
    const span = toVec.clone().sub(fromVec);
    const length = Math.max(0.001, span.length());
    const dir = span.clone().normalize();
    const perp = new THREE.Vector3(-dir.y, dir.x, 0);
    if (perp.lengthSq() < 1e-4) perp.set(0, 1, 0);
    perp.normalize().multiplyScalar(length * PLANNING_EDGE_ARC_AMOUNT);
    const mid = fromVec.clone().lerp(toVec, 0.5).add(perp);
    const curve = new THREE.QuadraticBezierCurve3(fromVec, mid, toVec);
    const sampled: THREE.Vector3[] = [];
    for (let i = 0; i <= PLANNING_EDGE_SEGMENTS; i += 1) {
      sampled.push(curve.getPoint(i / PLANNING_EDGE_SEGMENTS));
    }
    return { points: sampled, color: colorForHealth(health, highlighted) };
  }, [from.x, from.y, from.z, to.x, to.y, to.z, health, highlighted]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={highlighted ? PLANNING_EDGE_LINE_WIDTH * 1.8 : PLANNING_EDGE_LINE_WIDTH}
      transparent
      opacity={highlighted ? 0.65 : PLANNING_EDGE_BASE_OPACITY}
      depthWrite={false}
      toneMapped={false}
      blending={THREE.AdditiveBlending}
    />
  );
}
