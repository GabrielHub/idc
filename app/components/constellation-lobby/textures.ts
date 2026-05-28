/**
 * Canvas-built THREE textures for the constellation lobby scene. These run
 * once per scene mount inside `useMemo` and feed the lit backdrop, lens-flare
 * sprites, sparkle halos, and rim-light bleed that wraps each portrait.
 *
 * All helpers are SSR-safe — they return `null` when `document` is undefined
 * so the caller can fall back to a no-texture path. `featherAvatarShader` is
 * an `onBeforeCompile` patch for the avatar's MeshStandardMaterial; it adds a
 * radial alpha falloff so the disc edge feathers into the halo glow.
 */

import * as THREE from "three";

/**
 * Soft dawn-gradient backdrop. Painted once on a 2048×1152 canvas and assigned
 * to scene.background so it always sits behind the fog / particles without
 * being affected by camera distance.
 */
export function buildBackdropTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1152;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return new THREE.CanvasTexture(canvas);
  }

  const baseGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  baseGradient.addColorStop(0, "#1a0f2e");
  baseGradient.addColorStop(0.36, "#2a1a3f");
  baseGradient.addColorStop(0.7, "#48294f");
  baseGradient.addColorStop(1, "#6b3d5a");
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const warm = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.62,
    0,
    canvas.width * 0.5,
    canvas.height * 0.62,
    canvas.width * 0.45,
  );
  warm.addColorStop(0, "rgba(255, 180, 100, 0.55)");
  warm.addColorStop(0.5, "rgba(255, 140, 130, 0.42)");
  warm.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tl = ctx.createRadialGradient(
    canvas.width * 0.12,
    canvas.height * 0.08,
    0,
    canvas.width * 0.12,
    canvas.height * 0.08,
    canvas.width * 0.55,
  );
  tl.addColorStop(0, "rgba(196, 168, 255, 0.45)");
  tl.addColorStop(0.5, "rgba(196, 168, 255, 0.16)");
  tl.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = tl;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tr = ctx.createRadialGradient(
    canvas.width * 0.9,
    canvas.height * 0.12,
    0,
    canvas.width * 0.9,
    canvas.height * 0.12,
    canvas.width * 0.45,
  );
  tr.addColorStop(0, "rgba(255, 145, 200, 0.4)");
  tr.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = tr;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const vignette = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.height * 0.35,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.height * 0.85,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(255, 200, 180, 0.18)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Lens-flare cross. Bright center + four long thin arms + a softer cross at
 * 45°. Composited additively over stars, this is what turns "lit avatar" into
 * "actually feels like a star."
 */
export function buildFlareTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 512, 512);

  // Small soft inner bloom — kept tight so the flare reads as a sharp star
  // glint sitting on the bubble rather than a blob smeared across the face.
  const halo = ctx.createRadialGradient(256, 256, 0, 256, 256, 42);
  halo.addColorStop(0, "rgba(255, 246, 222, 0.9)");
  halo.addColorStop(0.5, "rgba(255, 238, 200, 0.25)");
  halo.addColorStop(1, "rgba(255, 232, 188, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, 512, 512);

  // Cross arms — long horizontal/vertical streaks built from gradients so they
  // taper rather than ending in hard edges. Thinner than v6.2 so the arms read
  // as a glint, not a glare.
  const drawArm = (angleDeg: number, len: number, width: number, alpha: number) => {
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate((angleDeg * Math.PI) / 180);
    const grad = ctx.createLinearGradient(-len, 0, len, 0);
    grad.addColorStop(0, "rgba(255, 244, 220, 0)");
    grad.addColorStop(0.45, `rgba(255, 244, 220, ${alpha * 0.7})`);
    grad.addColorStop(0.5, `rgba(255, 252, 240, ${alpha})`);
    grad.addColorStop(0.55, `rgba(255, 244, 220, ${alpha * 0.7})`);
    grad.addColorStop(1, "rgba(255, 244, 220, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(0, -width);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawArm(0, 240, 1.6, 0.9);
  drawArm(90, 240, 1.6, 0.9);
  drawArm(45, 150, 1.0, 0.42);
  drawArm(-45, 150, 1.0, 0.42);

  // Tight bright nucleus — small so the cross arms read clearly without a
  // wide bright blob in the center.
  const core = ctx.createRadialGradient(256, 256, 0, 256, 256, 14);
  core.addColorStop(0, "rgba(255, 255, 255, 1)");
  core.addColorStop(0.6, "rgba(255, 252, 240, 0.5)");
  core.addColorStop(1, "rgba(255, 248, 224, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Soft sparkle. The 4-point ✦ silhouette drawn with heavy Gaussian blur so
 * the rays read as a glow that keeps the sparkle SHAPE rather than a hard
 * cross. Layered passes from wide+soft to tight+sharper give the glow a
 * smooth falloff, capped with a bright nucleus for the bubble's core.
 * Tinted at runtime via meshBasicMaterial.color and composited additively.
 */
export function buildSoftSparkleTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return new THREE.CanvasTexture(canvas);

  const cx = 256;
  const cy = 256;
  // Long slender spikes so the four points read past the blur and the
  // silhouette reads as a sparkle ✦ rather than a soft circular halo.
  const spikeLength = 248;
  // Deep pinch keeps the four rays slender. Smaller pinch → thinner spike
  // bases → clearer sparkle silhouette once the heavy blur is applied.
  const pinch = 0.16;

  const drawSparkle = (alpha: number, blur: number) => {
    ctx.save();
    ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    const startAngle = -Math.PI / 2;
    const angleStep = Math.PI / 2;
    ctx.moveTo(cx + Math.cos(startAngle) * spikeLength, cy + Math.sin(startAngle) * spikeLength);
    for (let i = 0; i < 4; i += 1) {
      const curr = startAngle + i * angleStep;
      const next = startAngle + (i + 1) * angleStep;
      const c1x = cx + Math.cos(curr) * spikeLength * pinch;
      const c1y = cy + Math.sin(curr) * spikeLength * pinch;
      const c2x = cx + Math.cos(next) * spikeLength * pinch;
      const c2y = cy + Math.sin(next) * spikeLength * pinch;
      const nx = cx + Math.cos(next) * spikeLength;
      const ny = cy + Math.sin(next) * spikeLength;
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, nx, ny);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Three blur passes — wide+soft, mid, then tighter+sharper — composite
  // into a glow that keeps the sparkle silhouette legible. The tightest
  // pass is intentionally low-blur so the four spikes still read as rays,
  // not a uniformly round halo.
  drawSparkle(0.42, 28);
  drawSparkle(0.5, 12);
  drawSparkle(0.55, 4);

  // Soft circular bloom — fills the area around where the avatar disc sits
  // so the portrait reads as embedded INSIDE the star's glow rather than
  // floating at the sparkle's geometric center. Wider + brighter than v6.x:
  // the disc covers the inner-most band and additive blending of the bloom
  // pads the silhouette so the star feels like one cohesive shape.
  ctx.filter = "none";
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, 210);
  bloom.addColorStop(0, "rgba(255, 255, 255, 0.55)");
  bloom.addColorStop(0.22, "rgba(255, 255, 255, 0.4)");
  bloom.addColorStop(0.55, "rgba(255, 255, 255, 0.16)");
  bloom.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Avatar fragment-shader patch. Injects a soft radial alpha falloff across
 * the outer band of the disc so the portrait edge feathers into the halo
 * glow instead of cutting a hard circle through it. circleGeometry's uv has
 * the disc center at (0.5, 0.5) and the edge at distance 0.5, so multiplying
 * the centered length by 2.0 gives 0 at center and 1.0 at the visual edge;
 * smoothstep(0.74, 1.0, dist) is the feather ramp. We thread a custom
 * `vDiscUv` varying through the vertex shader because the basic material's
 * `vMapUv` is post-transform — the texture has `repeat` / `center` baked in
 * for portrait crop, which would skew the radial mask.
 */
export function featherAvatarShader(shader: {
  vertexShader: string;
  fragmentShader: string;
}): void {
  shader.vertexShader = shader.vertexShader
    .replace("void main() {", "varying vec2 vDiscUv;\nvoid main() {")
    .replace("#include <uv_vertex>", "#include <uv_vertex>\n\tvDiscUv = uv;");
  shader.fragmentShader = shader.fragmentShader
    .replace("void main() {", "varying vec2 vDiscUv;\nvoid main() {")
    .replace(
      "#include <map_fragment>",
      `#include <map_fragment>
\t{
\t\tvec2 centered = vDiscUv - vec2(0.5);
\t\tfloat dist = length(centered) * 2.0;
\t\tfloat feather = 1.0 - smoothstep(0.74, 1.0, dist);
\t\tdiffuseColor.a *= feather;
\t}`,
    );
}

/**
 * Rim-light bleed. A soft ring gradient that's transparent at center, peaks
 * just inside the texture's outer band, then falls off to transparent at the
 * edge. Tinted with the per-star halo color and composited additively in
 * front of the avatar disc — so the star's glow visually wraps around the
 * portrait silhouette, painting the feathered avatar edge with the halo
 * tint and bleeding outward into the surrounding sparkle. This is the bridge
 * shape that stops the portrait from reading as a sticker on top of the glow.
 */
export function buildRimLightTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return new THREE.CanvasTexture(canvas);

  // Additive blending: the black background becomes transparent at composite
  // time, so the ring's brightness is the only thing that contributes.
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  // Transparent through the inner portrait disc — the portrait itself owns
  // that area and we don't want to brighten the face uniformly.
  grad.addColorStop(0.0, "rgba(255, 255, 255, 0)");
  grad.addColorStop(0.5, "rgba(255, 255, 255, 0)");
  // Soft ramp into the rim — overlaps with the avatar's feathered alpha
  // falloff, so the halo color bleeds through the portrait's outer band.
  grad.addColorStop(0.66, "rgba(255, 255, 255, 0.55)");
  // Brightest right around where the avatar disc edge falls in world space.
  grad.addColorStop(0.78, "rgba(255, 255, 255, 0.88)");
  // Outward falloff — the glow extends a touch past the portrait then merges
  // into the larger sparkle halo behind.
  grad.addColorStop(0.9, "rgba(255, 255, 255, 0.32)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
