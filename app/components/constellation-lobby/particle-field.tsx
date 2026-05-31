import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";

import { createSeededRandom } from "../../services/utils";

function buildStarPointTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return new THREE.CanvasTexture(canvas);

  const cx = size / 2;
  const cy = size / 2;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  glow.addColorStop(0, "rgba(255, 255, 255, 1)");
  glow.addColorStop(0.18, "rgba(255, 246, 226, 0.85)");
  glow.addColorStop(0.45, "rgba(255, 226, 196, 0.32)");
  glow.addColorStop(1, "rgba(255, 200, 170, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const STAR_POINT_VERTEX_SHADER = /* glsl */ `
  attribute float aPhase;
  attribute float aScale;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uTwinkleAmount;
  uniform float uZNear;
  uniform float uZFar;
  varying float vTwinkle;
  varying float vDepth;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // 0 at the layer's nearest dust, 1 at its farthest, used to tint and
    // scintillate by distance.
    vDepth = clamp((uZNear - position.z) / (uZNear - uZFar), 0.0, 1.0);
    float w = 1.1 + fract(aPhase * 3.71) * 0.9;
    float pulse = sin(uTime * w + aPhase) * 0.5 + 0.5;
    float twinkleAmt = uTwinkleAmount * mix(0.75, 1.25, vDepth);
    vTwinkle = mix(1.0 - twinkleAmt, 1.0, pulse);
    gl_PointSize = uSize * aScale * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_POINT_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec3 uColorNear;
  uniform vec3 uColorFar;
  uniform float uOpacity;
  varying float vTwinkle;
  varying float vDepth;

  void main() {
    vec4 tex = texture2D(uTexture, gl_PointCoord);
    if (tex.a < 0.01) discard;
    vec3 col = mix(uColorNear, uColorFar, vDepth);
    gl_FragColor = vec4(col * tex.rgb * vTwinkle, tex.a * uOpacity * vTwinkle);
  }
`;

export function ParticleField({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const nearRef = useRef<THREE.Points>(null);
  const deepMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const nearMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const pointTexture = useMemo(() => buildStarPointTexture(), []);
  const pixelRatio = useMemo(
    () => (typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio ?? 1, 2)),
    [],
  );

  const deep = useMemo(() => {
    const rng = createSeededRandom("constellation-spike.v6.dust.deep");
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const scale = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3 + 0] = (rng() - 0.5) * 48;
      pos[i * 3 + 1] = (rng() - 0.5) * 30;
      pos[i * 3 + 2] = -6 - rng() * 18;
      phase[i] = rng() * Math.PI * 2;
      scale[i] = 0.6 + rng() * 0.8;
    }
    return { pos, phase, scale };
  }, [count]);

  const nearCount = Math.floor(count * 0.18);
  const near = useMemo(() => {
    const rng = createSeededRandom("constellation-spike.v6.dust.near");
    const pos = new Float32Array(nearCount * 3);
    const phase = new Float32Array(nearCount);
    const scale = new Float32Array(nearCount);
    for (let i = 0; i < nearCount; i += 1) {
      pos[i * 3 + 0] = (rng() - 0.5) * 26;
      pos[i * 3 + 1] = (rng() - 0.5) * 16;
      pos[i * 3 + 2] = 2 + rng() * 7;
      phase[i] = rng() * Math.PI * 2;
      scale[i] = 0.7 + rng() * 0.8;
    }
    return { pos, phase, scale };
  }, [nearCount]);

  const deepUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 0.5 },
      uPixelRatio: { value: pixelRatio },
      uTexture: { value: pointTexture },
      // Deep dust trends cool with distance: warm cream up close, soft
      // periwinkle at the far plane, so the field reads as real depth.
      uColorNear: { value: new THREE.Color("#ffe0c0") },
      uColorFar: { value: new THREE.Color("#b9c8f2") },
      uZNear: { value: -6 },
      uZFar: { value: -24 },
      uOpacity: { value: 0.55 },
      uTwinkleAmount: { value: reducedMotion ? 0 : 0.6 },
    }),
    [pixelRatio, pointTexture, reducedMotion],
  );

  const nearUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 0.85 },
      uPixelRatio: { value: pixelRatio },
      uTexture: { value: pointTexture },
      // Near dust stays warm both ends, a touch warmer at the front edge.
      uColorNear: { value: new THREE.Color("#fff2dc") },
      uColorFar: { value: new THREE.Color("#ffdcb6") },
      uZNear: { value: 9 },
      uZFar: { value: 2 },
      uOpacity: { value: 0.75 },
      uTwinkleAmount: { value: reducedMotion ? 0 : 0.35 },
    }),
    [pixelRatio, pointTexture, reducedMotion],
  );

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ref.current !== null) ref.current.rotation.z = t * 0.006;
    if (nearRef.current !== null) nearRef.current.rotation.z = -t * 0.014;
    if (deepMaterialRef.current !== null) {
      deepMaterialRef.current.uniforms.uTime.value = t;
    }
    if (nearMaterialRef.current !== null) {
      nearMaterialRef.current.uniforms.uTime.value = t;
    }
  });

  return (
    <>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[deep.pos, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[deep.phase, 1]} />
          <bufferAttribute attach="attributes-aScale" args={[deep.scale, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={deepMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={STAR_POINT_VERTEX_SHADER}
          fragmentShader={STAR_POINT_FRAGMENT_SHADER}
          uniforms={deepUniforms}
        />
      </points>
      <points ref={nearRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[near.pos, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[near.phase, 1]} />
          <bufferAttribute attach="attributes-aScale" args={[near.scale, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={nearMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={STAR_POINT_VERTEX_SHADER}
          fragmentShader={STAR_POINT_FRAGMENT_SHADER}
          uniforms={nearUniforms}
        />
      </points>
    </>
  );
}
