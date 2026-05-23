/**
 * Per-star pixel-rain trail. A small THREE.Points cluster parented under the
 * StarSprite's group so it inherits the star's world position + scale. Each
 * particle:
 *
 *   - spawns near (0, 0, 0) with a seeded x/z jitter
 *   - falls along negative local Y at a per-particle speed
 *   - fades by ramping its color toward black as it travels down — additive
 *     blending makes color = 0 equivalent to alpha = 0 visually, so we can do
 *     per-particle fade through the color attribute alone (PointsMaterial
 *     supports vertexColors RGB but not per-vertex alpha)
 *   - recycles to the top once it passes a lifetime threshold
 *
 * Why per-star rather than one shared field: each star's spawn origin moves
 * (focus/partner override into a compressed pair position; the focus point
 * light dances; the camera pulls forward), and parenting under the group is
 * the cleanest way to keep the rain tied to the star without re-deriving each
 * particle's origin every frame. Total particle budget across 48 stars stays
 * around ~300, so the extra draw calls are not a bottleneck.
 *
 * Math.random is forbidden — see CLAUDE.md "Randomness". All per-particle
 * jitter and phase come from createSeededRandom keyed off the member id, so
 * a given star's rain pattern is stable across reloads.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { createSeededRandom } from "../../services/utils";

export type PixelRainTrailProps = {
  /** Number of particles in the column. Driven by rainDensityForStar(role). */
  count: number;
  /** Half-width of the spawn band in local units (matches halo radius). */
  spawnRadius: number;
  /** Distance the rain falls before recycling, in local units. */
  fallHeight: number;
  /** Average fall speed in local units per second. */
  fallSpeed: number;
  /** Normalized 0–1 RGB tint applied to every particle (additive blending). */
  color: { r: number; g: number; b: number };
  /** 0–1 multiplier on color brightness; lets the star dim its rain with role. */
  intensity: number;
  /** Stable seed source so each star gets the same jitter on every render. */
  seed: string;
  /** When true the rain holds in place — no fall update. */
  reducedMotion: boolean;
  /** Particle size in local units. PointsMaterial sizeAttenuates. */
  size?: number;
};

export function PixelRainTrail({
  count,
  spawnRadius,
  fallHeight,
  fallSpeed,
  color,
  intensity,
  seed,
  reducedMotion,
  size = 0.045,
}: PixelRainTrailProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const positionAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const colorAttrRef = useRef<THREE.BufferAttribute | null>(null);

  // Build the initial buffers. Per-particle properties live in plain arrays
  // (jitterX, jitterZ, speed, lifeOffset) so the useFrame loop can recompute
  // each particle's current Y / color from elapsed time without reseeding.
  // count appears in the key so React unmounts/remounts the geometry when the
  // role changes density tier — we don't try to grow/shrink in-place.
  const buffers = useMemo(() => {
    const rng = createSeededRandom(`constellation-lobby.rain.${seed}`);
    const positions = new Float32Array(Math.max(count, 1) * 3);
    const colors = new Float32Array(Math.max(count, 1) * 3);
    const jitterX = new Float32Array(Math.max(count, 1));
    const jitterZ = new Float32Array(Math.max(count, 1));
    const speedMul = new Float32Array(Math.max(count, 1));
    const lifeOffset = new Float32Array(Math.max(count, 1));
    for (let i = 0; i < count; i += 1) {
      jitterX[i] = (rng() - 0.5) * spawnRadius * 1.6;
      jitterZ[i] = (rng() - 0.5) * spawnRadius * 0.4;
      // Speed jitter 0.7..1.3 so the cascade reads as varied digits, not a
      // synchronized waterfall.
      speedMul[i] = 0.7 + rng() * 0.6;
      // Lifetime phase offset 0..1 so particles are pre-distributed along the
      // fall column on mount instead of all spawning at the top at t=0.
      lifeOffset[i] = rng();
      positions[i * 3 + 0] = jitterX[i];
      positions[i * 3 + 1] = spawnRadius * 0.6 - lifeOffset[i] * fallHeight;
      positions[i * 3 + 2] = jitterZ[i];
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors, jitterX, jitterZ, speedMul, lifeOffset };
  }, [count, spawnRadius, fallHeight, color.r, color.g, color.b, seed]);

  // Hand the JS arrays into BufferAttribute refs once on mount so the
  // useFrame loop can `.array` and `needsUpdate=true` cheaply each frame.
  useEffect(() => {
    if (pointsRef.current === null) return;
    const geom = pointsRef.current.geometry;
    positionAttrRef.current = geom.getAttribute("position") as THREE.BufferAttribute;
    colorAttrRef.current = geom.getAttribute("color") as THREE.BufferAttribute;
  }, [buffers]);

  useFrame((s) => {
    if (count === 0) return;
    if (positionAttrRef.current === null || colorAttrRef.current === null) return;
    const t = reducedMotion ? 0 : s.clock.elapsedTime;
    const positions = positionAttrRef.current.array as Float32Array;
    const colors = colorAttrRef.current.array as Float32Array;
    const topY = spawnRadius * 0.6;
    const bottomY = topY - fallHeight;
    for (let i = 0; i < count; i += 1) {
      // Lifetime t in [0, 1) — wrap so the column loops seamlessly. Each
      // particle uses its own seeded speedMul + lifeOffset so the recycle
      // moments stagger rather than fire as a strobe.
      const cyclePeriod = fallHeight / (fallSpeed * buffers.speedMul[i]!);
      const life = (((t / cyclePeriod + buffers.lifeOffset[i]!) % 1) + 1) % 1;
      const y = topY - life * fallHeight;
      positions[i * 3 + 0] =
        buffers.jitterX[i]! + Math.sin(t * 0.9 + i * 1.71) * spawnRadius * 0.08;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = buffers.jitterZ[i]!;
      // Per-particle alpha ramp via color modulation (additive blending makes
      // RGB-toward-black read as transparent). Brightest in the upper third
      // where the particle is freshest; fades to almost nothing by the time
      // it nears bottomY.
      const norm = (y - bottomY) / Math.max(0.0001, topY - bottomY);
      // Two-stage curve: short fade-in at top (so spawn doesn't pop), long
      // fade-out across the rest of the column.
      const ramp = norm < 0.88 ? Math.pow(norm / 0.88, 1.2) : 1 - (norm - 0.88) / 0.12;
      const brightness = Math.max(0, Math.min(1, ramp)) * intensity;
      colors[i * 3 + 0] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;
    }
    positionAttrRef.current.needsUpdate = true;
    colorAttrRef.current.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[buffers.positions, 3]}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[buffers.colors, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        sizeAttenuation
        transparent
        vertexColors
        depthWrite={false}
        fog={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/**
 * Shimmer pixels — a small cluster of additive dots that stay AT the star
 * position and twinkle in/out at staggered phases. Lives alongside the rain
 * trail to give the star a "data energy" pop-glow at the core; reserved for
 * roles that already get the heavier rain treatment (focus / partner /
 * eligible) so the dim and ineligible field doesn't get crowded.
 */
export type ShimmerPixelsProps = {
  count: number;
  radius: number;
  color: { r: number; g: number; b: number };
  intensity: number;
  seed: string;
  reducedMotion: boolean;
  size?: number;
};

export function ShimmerPixels({
  count,
  radius,
  color,
  intensity,
  seed,
  reducedMotion,
  size = 0.05,
}: ShimmerPixelsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const positionAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const colorAttrRef = useRef<THREE.BufferAttribute | null>(null);

  const buffers = useMemo(() => {
    const rng = createSeededRandom(`constellation-lobby.shimmer.${seed}`);
    const positions = new Float32Array(Math.max(count, 1) * 3);
    const colors = new Float32Array(Math.max(count, 1) * 3);
    const offsetX = new Float32Array(Math.max(count, 1));
    const offsetY = new Float32Array(Math.max(count, 1));
    const phaseSeeds = new Float32Array(Math.max(count, 1));
    for (let i = 0; i < count; i += 1) {
      // Distribute the shimmer dots around the avatar disc, biased outward
      // so they read as a ring of sparks rather than smudging the face.
      const angle = rng() * Math.PI * 2;
      const dist = radius * (0.55 + rng() * 0.55);
      offsetX[i] = Math.cos(angle) * dist;
      offsetY[i] = Math.sin(angle) * dist;
      phaseSeeds[i] = rng() * Math.PI * 2;
      positions[i * 3 + 0] = offsetX[i]!;
      positions[i * 3 + 1] = offsetY[i]!;
      positions[i * 3 + 2] = 0.06;
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { positions, colors, offsetX, offsetY, phaseSeeds };
  }, [count, radius, color.r, color.g, color.b, seed]);

  useEffect(() => {
    if (pointsRef.current === null) return;
    const geom = pointsRef.current.geometry;
    positionAttrRef.current = geom.getAttribute("position") as THREE.BufferAttribute;
    colorAttrRef.current = geom.getAttribute("color") as THREE.BufferAttribute;
  }, [buffers]);

  useFrame((s) => {
    if (count === 0) return;
    if (positionAttrRef.current === null || colorAttrRef.current === null) return;
    const t = reducedMotion ? 0 : s.clock.elapsedTime;
    const colors = colorAttrRef.current.array as Float32Array;
    for (let i = 0; i < count; i += 1) {
      // Two-frequency twinkle so each shimmer has its own cadence and the
      // cluster never strobes in unison. The Math.pow(.., 2) makes the
      // bright spike narrower than the dim trough — reads as a flash rather
      // than a sine wash.
      const slow = Math.sin(t * 1.8 + buffers.phaseSeeds[i]!) * 0.5 + 0.5;
      const fast = Math.sin(t * 4.7 + buffers.phaseSeeds[i]! * 2.13) * 0.5 + 0.5;
      const twinkle = Math.pow(slow * 0.7 + fast * 0.3, 1.8);
      const brightness = (reducedMotion ? 0.55 : twinkle) * intensity;
      colors[i * 3 + 0] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;
    }
    colorAttrRef.current.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[buffers.positions, 3]}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[buffers.colors, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        sizeAttenuation
        transparent
        vertexColors
        depthWrite={false}
        fog={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
