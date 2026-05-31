/**
 * Archive memory nebula — a faint billboarded dust cloud that blooms behind a
 * focused pair in archive mode. Density rises with the pair's filed-note count;
 * unresolved closure blockers carve low-frequency gaps so the cloud reads as
 * "memory with holes" without ever exposing a raw number. Color is shared with
 * the connection thread palette. The cloud drifts very slowly and holds a soft
 * opacity floor; under reduced motion it renders static.
 */

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { Vec3 } from "./types";

const NEBULA_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uGaps;
  uniform float uOpacity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i += 1) {
      v += a * valueNoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Soft elliptical falloff so the plane edges never show as a hard rectangle.
    vec2 centered = vUv - 0.5;
    float fall = smoothstep(0.5, 0.0, length(centered * vec2(1.6, 2.2)));
    if (fall <= 0.0) discard;

    vec2 p = vUv * 3.0 + vec2(uTime * 0.012, uTime * -0.008);
    float cloud = fbm(p);
    float gapMask = uGaps > 0.0 ? smoothstep(0.35, 0.65, fbm(vUv * 1.5 + 11.0)) * uGaps : 0.0;
    float dust = clamp(cloud * (0.5 + uDensity) - 0.25 - gapMask, 0.0, 1.0);
    float alpha = dust * fall * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uColor * alpha, alpha);
  }
`;

export function NebulaCloud({
  midpoint,
  span,
  noteCount,
  blockerCount,
  color,
  intensity,
}: {
  midpoint: Vec3;
  span: number;
  noteCount: number;
  blockerCount: number;
  color: string;
  intensity: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const targetColor = useMemo(() => new THREE.Color(color), [color]);

  // Uniform objects stay stable so hover/select changes do not reset the drift
  // clock. Live props are copied into those uniforms in useFrame.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#ffffff") },
      uDensity: { value: 0 },
      uGaps: { value: 0 },
      uOpacity: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    if (materialRef.current === null) return;
    const { uniforms: materialUniforms } = materialRef.current;
    materialUniforms.uColor.value.copy(targetColor);
    materialUniforms.uDensity.value = Math.min(1, noteCount / 6);
    materialUniforms.uGaps.value = Math.min(0.6, blockerCount * 0.2);
    materialUniforms.uOpacity.value = intensity;
    if (!reducedMotion) {
      materialUniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const width = Math.max(2.2, span * 0.95);
  const height = Math.max(1.5, span * 0.6);

  return (
    <Billboard position={[midpoint.x, midpoint.y, midpoint.z - 0.6]}>
      <mesh raycast={() => null}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={NEBULA_VERTEX_SHADER}
          fragmentShader={NEBULA_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      </mesh>
    </Billboard>
  );
}
