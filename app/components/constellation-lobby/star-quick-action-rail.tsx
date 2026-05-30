import { useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { clamp } from "../../services/utils";
import {
  applyScenePixelScale,
  estimateSceneTextWidth,
  SceneCircleButton,
  SceneFlatPill,
  SceneGlassPill,
  SceneText,
  type SceneGlyphKind,
} from "./star-scene-ui-primitives";
import type { StarQuickAction } from "./types";

/*
 * Star controls authored in SCREEN PIXELS, not world units. The rail roots in a
 * group that StarSprite counter-scales every frame (`pixelScaleRef`) so 1 local
 * unit == 1 on-screen pixel regardless of the star's flythrough depth or world
 * scale — the buttons and name pill stay the same readable size on every layer.
 * Positions hug the star instead of the avatar texture: `avatarRadiusPxRef`
 * carries the avatar disc's *projected* radius in pixels, so the label sits just
 * under the disc and the buttons orbit just outside its edge, with a floor that
 * keeps three buttons clear of each other on small avatars.
 */

const DEG = Math.PI / 180;

/** Button disc radius (px). Constant across layers — the rail counter-scales. */
export const BUTTON_RADIUS_PX = 20;
/** Clear gap (px) between the avatar disc edge and the nearest button edge. */
const BUTTON_GAP_PX = 10;
/** Orbit floor so a 3-button arc never overlaps around a tiny avatar. */
const MIN_ORBIT_PX = BUTTON_RADIUS_PX * 2.7;

const LABEL_HEIGHT_PX = 24;
const LABEL_FONT_PX = 15;
/** Gap (px) between the avatar disc bottom and the name pill top edge. */
const LABEL_GAP_PX = 9;
const LABEL_MIN_WIDTH_PX = 58;
const LABEL_MAX_WIDTH_PX = 210;

/** Lifts the whole rail just in front of the avatar plane (Billboard-local). */
const RAIL_Z_LIFT = 0.14;

/**
 * Right-side fan angles (radians) for the action buttons, walking top → bottom.
 * One action sits at 3 o'clock; more spread across a shallow arc hugging the
 * avatar's right edge.
 */
export function quickActionArcAngles(count: number): number[] {
  const n = Math.max(1, count);
  const arcDegrees = n === 1 ? 0 : n === 2 ? 54 : 88;
  const stepDegrees = n === 1 ? 0 : arcDegrees / (n - 1);
  return Array.from({ length: n }, (_, index) => (arcDegrees / 2 - stepDegrees * index) * DEG);
}

/** Orbit radius (px) of the action arc — hugs the avatar edge, floored apart. */
export function quickActionOrbitRadiusPx(avatarRadiusPx: number): number {
  return Math.max(avatarRadiusPx + BUTTON_GAP_PX + BUTTON_RADIUS_PX, MIN_ORBIT_PX);
}

function glyphForAction(action: StarQuickAction): SceneGlyphKind {
  if (action.id === "swap") return "swap";
  if (action.id === "case") return "case";
  return action.label.startsWith("Clear") ? "clear" : "check";
}

export function StarQuickActionRail({
  actions,
  memberName,
  showActions,
  active,
  pixelScaleRef,
  avatarRadiusPxRef,
  onHoverChange,
}: {
  actions: readonly StarQuickAction[];
  memberName: string;
  showActions: boolean;
  active: boolean;
  /** Billboard-local units per screen pixel — set per frame by StarSprite. */
  pixelScaleRef: MutableRefObject<number>;
  /** Avatar disc projected radius in px — set per frame by StarSprite. */
  avatarRadiusPxRef: MutableRefObject<number>;
  onHoverChange: (hovered: boolean) => void;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const labelRef = useRef<THREE.Group>(null);
  const buttonGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const [hoveredActionKey, setHoveredActionKey] = useState<string | null>(null);

  const angles = useMemo(() => quickActionArcAngles(actions.length), [actions.length]);
  const labelWidth = clamp(
    estimateSceneTextWidth(memberName, LABEL_FONT_PX) + LABEL_HEIGHT_PX * 0.9,
    LABEL_MIN_WIDTH_PX,
    LABEL_MAX_WIDTH_PX,
  );

  useFrame(() => {
    const root = rootRef.current;
    if (root === null) return;
    applyScenePixelScale(root, pixelScaleRef.current);

    const avatarRadiusPx = avatarRadiusPxRef.current;
    if (labelRef.current !== null) {
      labelRef.current.position.y = -(avatarRadiusPx + LABEL_GAP_PX + LABEL_HEIGHT_PX / 2);
    }
    const orbit = quickActionOrbitRadiusPx(avatarRadiusPx);
    for (let index = 0; index < buttonGroupRefs.current.length; index += 1) {
      const group = buttonGroupRefs.current[index];
      const angle = angles[index];
      if (group === null || group === undefined || angle === undefined) continue;
      group.position.x = Math.cos(angle) * orbit;
      group.position.y = Math.sin(angle) * orbit;
    }
  });

  return (
    <group ref={rootRef} position={[0, 0, RAIL_Z_LIFT]}>
      <group ref={labelRef}>
        <SceneFlatPill
          width={labelWidth}
          height={LABEL_HEIGHT_PX}
          tone={active ? "labelActive" : "label"}
        />
        <SceneText
          fontSize={LABEL_FONT_PX}
          maxWidth={labelWidth - LABEL_HEIGHT_PX * 0.7}
          position={[0, 0, 0.01]}
          outlineWidth={0}
        >
          {memberName}
        </SceneText>
      </group>

      {showActions
        ? actions.map((action, index) => {
            const actionKey = `${action.id}-${index}`;
            return (
              <group
                key={actionKey}
                position={[0, 0, 0.04]}
                ref={(element) => {
                  buttonGroupRefs.current[index] = element;
                }}
              >
                <SceneCircleButton
                  radius={BUTTON_RADIUS_PX}
                  tone={action.tone ?? "glass"}
                  disabled={action.disabled}
                  glyph={glyphForAction(action)}
                  label={action.label}
                  onPress={action.onSelect}
                  onHoverChange={(hovered) => {
                    setHoveredActionKey(hovered ? actionKey : null);
                    onHoverChange(hovered);
                  }}
                />
                {hoveredActionKey === actionKey ? (
                  <ActionTooltip label={action.title ?? action.label} />
                ) : null}
              </group>
            );
          })
        : null}
    </group>
  );
}

const TOOLTIP_FONT_PX = 14;

function ActionTooltip({ label }: { label: string }) {
  const height = TOOLTIP_FONT_PX * 2.1;
  const width = clamp(
    estimateSceneTextWidth(label, TOOLTIP_FONT_PX) + height * 1.2,
    height * 2.4,
    260,
  );
  return (
    <group position={[BUTTON_RADIUS_PX + 8 + width / 2, 0, 0.06]}>
      <SceneGlassPill width={width} height={height} tone="ink" />
      <SceneText fontSize={TOOLTIP_FONT_PX} maxWidth={width - height * 0.7} position={[0, 0, 0.01]}>
        {label}
      </SceneText>
    </group>
  );
}
