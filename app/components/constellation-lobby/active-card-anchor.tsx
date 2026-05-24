import { cloneElement, useEffect, useState, type ReactElement } from "react";
import { Html } from "@react-three/drei";
import { AnimatePresence } from "motion/react";

import { HoverDetailCard } from "./hover-detail-card";
import type { StarMark, Vec3 } from "./types";

/**
 * Optional render-prop the production lobby uses to inject a knowledge-gated
 * HoverDetailCard with real save state (focus handlers, swap penalty, sealed
 * counts). The spike falls back to a vanilla card when this prop is absent.
 * Returns a ReactElement (not bare ReactNode) so `ActiveCardAnchor` can clone
 * it with the per-member key that AnimatePresence needs to detect swaps.
 */
export type RenderHoverCard = (args: { star: StarMark }) => ReactElement;

/**
 * Owns the <Html> portal that mounts the morphing detail card. We can't just
 * wrap drei's <Html> in <AnimatePresence>: when the conditional flips to null,
 * the Html portal tears down before the inner motion.div can play its exit. So
 * this keeps <Html> mounted at the last active star's position and lets
 * <AnimatePresence> drive the exit on the card itself.
 */
export function ActiveCardAnchor({
  activeStar,
  activePos,
  renderHoverCard,
}: {
  activeStar: StarMark | undefined;
  activePos: Vec3 | null;
  renderHoverCard?: RenderHoverCard;
}) {
  const [renderedStar, setRenderedStar] = useState<StarMark | null>(null);
  const [renderedPos, setRenderedPos] = useState<Vec3 | null>(null);

  // Depend on primitive coordinates so a fresh `activePos` object with
  // identical x/y/z does not restart the in-flight morph.
  const activePosX = activePos?.x;
  const activePosY = activePos?.y;
  const activePosZ = activePos?.z;
  useEffect(() => {
    if (activeStar === undefined || activePosX === undefined) return;
    if (renderedStar !== null && renderedStar.member.id !== activeStar.member.id) {
      // Different star is already mounted. Wait for onExitComplete to clear
      // `renderedStar` so the prior exit finishes at its own position.
      return;
    }
    setRenderedStar(activeStar);
    const nextY = activePosY ?? 0;
    const nextZ = activePosZ ?? 0;
    // Skip the setRenderedPos call when coords haven't moved. The setter
    // would otherwise allocate a fresh {x,y,z} object identity each pass,
    // causing one extra commit of the entire portal subtree per
    // activeStar change (the effect re-runs because renderedStar is in
    // deps, then the equality-but-not-identity check on the new object
    // schedules a no-op render).
    setRenderedPos((current) => {
      if (
        current !== null &&
        current.x === activePosX &&
        current.y === nextY &&
        current.z === nextZ
      ) {
        return current;
      }
      return { x: activePosX, y: nextY, z: nextZ };
    });
  }, [activeStar, activePosX, activePosY, activePosZ, renderedStar]);

  if (renderedStar === null || renderedPos === null) return null;

  const showCard = activeStar !== undefined && activeStar.member.id === renderedStar.member.id;
  const cardKey = `card-${renderedStar.member.id}`;
  const cardElement = showCard ? (
    renderHoverCard !== undefined ? (
      cloneElement(renderHoverCard({ star: renderedStar }), { key: cardKey })
    ) : (
      <HoverDetailCard key={cardKey} star={renderedStar} />
    )
  ) : null;

  return (
    <Html
      position={[renderedPos.x, renderedPos.y, renderedPos.z]}
      zIndexRange={[60, 0]}
      className="pointer-events-none"
    >
      <div className="relative h-0 w-0">
        <AnimatePresence
          onExitComplete={() => {
            setRenderedStar(null);
            setRenderedPos(null);
          }}
        >
          {cardElement}
        </AnimatePresence>
      </div>
    </Html>
  );
}
