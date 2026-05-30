import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import type { Member } from "../../domain/game";
import { clamp } from "../../services/utils";
import {
  applyScenePixelScale,
  estimateSceneTextWidth,
  SceneCircleButton,
  SceneFlatPill,
  SceneText,
} from "./star-scene-ui-primitives";

/*
 * The pinned-focus pill shares the quick-action rail's screen-pixel model: its
 * root group is counter-scaled by StarSprite every frame so the chip stays the
 * same readable size on every layer, and it hangs a fixed gap under the avatar
 * disc's projected bottom edge (`avatarRadiusPxRef`) rather than the texture.
 */

const HEIGHT_PX = 24;
const FONT_PX = 15;
const CLEAR_RADIUS_PX = 11;
const GAP_PX = 9;
const MARKER_Z_LIFT = 0.16;

export function FocusSelectionMarker({
  member,
  pixelScaleRef,
  avatarRadiusPxRef,
  onClearFocus,
  onHoverChange,
}: {
  member: Member;
  /** Billboard-local units per screen pixel — set per frame by StarSprite. */
  pixelScaleRef: MutableRefObject<number>;
  /** Avatar disc projected radius in px — set per frame by StarSprite. */
  avatarRadiusPxRef: MutableRefObject<number>;
  onClearFocus: () => void;
  onHoverChange?: (hovered: boolean) => void;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const rowRef = useRef<THREE.Group>(null);
  const label = `Focus · ${member.firstName}`;
  const width = clamp(
    estimateSceneTextWidth(label, FONT_PX) + HEIGHT_PX * 0.9 + CLEAR_RADIUS_PX * 2.5,
    112,
    320,
  );

  useFrame(() => {
    const root = rootRef.current;
    if (root === null) return;
    applyScenePixelScale(root, pixelScaleRef.current);
    if (rowRef.current !== null) {
      rowRef.current.position.y = -(avatarRadiusPxRef.current + GAP_PX + HEIGHT_PX / 2);
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHoverChange?.(true);
  };
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHoverChange?.(true);
  };
  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHoverChange?.(false);
  };

  return (
    <group ref={rootRef} position={[0, 0, MARKER_Z_LIFT]}>
      <group ref={rowRef}>
        <SceneFlatPill width={width} height={HEIGHT_PX} tone="labelActive" />
        <mesh
          position={[0, 0, 0.02]}
          onPointerOver={handlePointerOver}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        >
          <planeGeometry args={[width, HEIGHT_PX]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <SceneText
          fontSize={FONT_PX}
          maxWidth={width - CLEAR_RADIUS_PX * 3.1}
          position={[-CLEAR_RADIUS_PX * 0.5, 0, 0.04]}
          outlineWidth={0}
        >
          {label}
        </SceneText>
        <SceneCircleButton
          radius={CLEAR_RADIUS_PX}
          tone="glass"
          position={[width / 2 - HEIGHT_PX * 0.62, 0, 0.05]}
          glyph="clear"
          label={`Drop ${member.firstName} as focus selection`}
          onPress={onClearFocus}
          onHoverChange={(hovered) => onHoverChange?.(hovered)}
        />
      </group>
    </group>
  );
}
