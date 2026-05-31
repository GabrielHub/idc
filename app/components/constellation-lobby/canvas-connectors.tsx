import { useMemo, useRef, type ComponentRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

import { colorForHealth, threadFlowForHealth } from "./pair-edge-mesh";
import type { Vec3 } from "./types";

type SpokeLine = ComponentRef<typeof Line>;

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
  const coreRef = useRef<SpokeLine | null>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const flow = threadFlowForHealth(health);
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

  useFrame((s) => {
    if (reducedMotion || coreRef.current === null) return;
    const t = s.clock.elapsedTime;
    const jitter = flow.jitter > 0 ? Math.sin(t * 23) * flow.jitter : 0;
    coreRef.current.material.dashOffset = -t * flow.flowSpeed + jitter;
  });

  return (
    <group>
      {/* Soft bloom underlay — wide, dim, additive — gives the ribbon its lens glow. */}
      <Line
        points={points}
        vertexColors={vertexColors}
        lineWidth={highlighted ? 12 : 7}
        transparent
        opacity={highlighted ? 0.3 : 0.18}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
      {/* Flowing dashed core — continuity and flow keyed to pair health. */}
      <Line
        ref={coreRef}
        points={points}
        vertexColors={vertexColors}
        lineWidth={highlighted ? 4.6 : 2.8}
        transparent
        opacity={highlighted ? 0.95 : 0.7}
        dashed
        dashSize={flow.dashSize}
        gapSize={flow.gapSize}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </group>
  );
}
