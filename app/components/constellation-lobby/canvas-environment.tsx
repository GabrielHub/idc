import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { pairPartnerPosition, starWorldPosition } from "./math";
import { buildBackdropTexture } from "./textures";
import type { CameraTarget, LobbyState, StarMark } from "./types";

export function CameraRig({
  target,
  parallax,
  freezeParallax = false,
  reducedMotion,
}: {
  target: CameraTarget;
  parallax: boolean;
  /**
   * When true, the camera holds the most recent on-canvas pointer values
   * instead of either tracking the live pointer or snapping them to zero.
   */
  freezeParallax?: boolean;
  reducedMotion: boolean;
}) {
  const lookAt = useRef(new THREE.Vector3(target.lookAt[0], target.lookAt[1], target.lookAt[2]));
  const frozenPointer = useRef<{ x: number; y: number } | null>(null);

  useFrame((sceneState, delta) => {
    const camera = sceneState.camera;
    const t = sceneState.clock.elapsedTime;
    let px = 0;
    let py = 0;
    if (parallax) {
      if (freezeParallax) {
        if (frozenPointer.current === null) {
          frozenPointer.current = { x: sceneState.pointer.x, y: sceneState.pointer.y };
        }
        px = frozenPointer.current.x;
        py = frozenPointer.current.y;
      } else {
        frozenPointer.current = null;
        px = sceneState.pointer.x;
        py = sceneState.pointer.y;
      }
    } else {
      frozenPointer.current = null;
    }

    // Continuous idle orbital sway on top of the per-state target.
    const swayX = reducedMotion ? 0 : Math.sin(t * 0.09) * 0.55 + Math.sin(t * 0.21) * 0.18;
    const swayY = reducedMotion ? 0 : Math.cos(t * 0.075) * 0.32 + Math.sin(t * 0.17) * 0.1;

    const desiredX = target.position[0] + px * 1.7 + swayX;
    const desiredY = target.position[1] + py * 1.0 + swayY;
    const desiredZ = target.position[2];

    const lerpAmount = reducedMotion ? 1 : 1 - Math.pow(0.0009, delta);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, desiredX, lerpAmount);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, lerpAmount);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, desiredZ, lerpAmount);

    const desiredLookX = target.lookAt[0] + px * 0.55 + swayX * 0.35;
    const desiredLookY = target.lookAt[1] + py * 0.4 + swayY * 0.3;
    const desiredLookZ = target.lookAt[2];

    lookAt.current.x = THREE.MathUtils.lerp(lookAt.current.x, desiredLookX, lerpAmount);
    lookAt.current.y = THREE.MathUtils.lerp(lookAt.current.y, desiredLookY, lerpAmount);
    lookAt.current.z = THREE.MathUtils.lerp(lookAt.current.z, desiredLookZ, lerpAmount);

    camera.lookAt(lookAt.current);
  });

  return null;
}

export function Lights({
  state,
  focusStar,
  partnerStar,
}: {
  state: LobbyState;
  focusStar: StarMark | undefined;
  partnerStar: StarMark | undefined;
}) {
  const focusActive = state !== "idle" && state !== "callout_heavy" && focusStar !== undefined;
  const partnerActive =
    (state === "partner_selected" || state === "committed_pair" || state === "scenario_chosen") &&
    partnerStar !== undefined;

  const focusPos = focusStar ? starWorldPosition(focusStar) : { x: 0, y: 0, z: 0 };
  const partnerPos = focusStar ? pairPartnerPosition(focusStar) : { x: 0, y: 0, z: 0 };

  return (
    <>
      <ambientLight intensity={0.55} color="#322048" />
      <directionalLight position={[6, 8, 6]} intensity={0.85} color="#fff5e0" />
      <directionalLight position={[-6, -2, 4]} intensity={0.32} color="#a78bfa" />
      <pointLight position={[0, -2, -8]} intensity={1.6} color="#f97373" distance={26} decay={2} />
      <pointLight
        position={[-15, 9, -11]}
        intensity={2.4}
        color="#a78bfa"
        distance={32}
        decay={2}
      />
      <pointLight position={[15, 9, -11]} intensity={2.0} color="#d946ef" distance={30} decay={2} />
      {focusActive ? (
        <pointLight
          position={[focusPos.x, focusPos.y + 0.2, focusPos.z + 1.4]}
          intensity={5.2}
          color="#fb7185"
          distance={5}
          decay={2}
        />
      ) : null}
      {partnerActive ? (
        <pointLight
          position={[partnerPos.x, partnerPos.y + 0.2, partnerPos.z + 1.4]}
          intensity={4.4}
          color="#c4b5fd"
          distance={5}
          decay={2}
        />
      ) : null}
    </>
  );
}

export function SceneBackground() {
  const texture = useMemo(() => buildBackdropTexture(), []);
  if (texture === null) return null;
  return <primitive attach="background" object={texture} />;
}
