import { cloneElement, useEffect, useState, type ReactElement } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { AnimatePresence } from "motion/react";

import { HoverDetailCard } from "./hover-detail-card";
import { fitRectOffset } from "./viewport-fit";
import type { StarMark, Vec3 } from "./types";

/**
 * Optional render-prop the production lobby uses to inject a knowledge-gated
 * HoverDetailCard with real save state (focus handlers, swap penalty, sealed
 * counts). The spike falls back to a vanilla card when this prop is absent.
 * Returns a ReactElement (not bare ReactNode) so `ActiveCardAnchor` can clone
 * it with the per-member key that AnimatePresence needs to detect swaps.
 */
export type RenderHoverCard = (args: { star: StarMark }) => ReactElement;

/** Inset from the canvas edges the fitted card is kept clear of. */
const VIEWPORT_FIT_MARGIN_PX = 16;

/**
 * Keep the morphing detail card fully inside the canvas. The card anchors to
 * its star's projected screen point and opens downward at a fixed width, so a
 * star near an edge — most visibly the bottom roster row — would otherwise clip
 * the card. We translate the whole card by the minimum offset that keeps its
 * bounding box within `VIEWPORT_FIT_MARGIN_PX` of every canvas edge, recomputing
 * as the entrance morph grows it and on canvas resize. The correction is written
 * imperatively to the anchor element so it neither re-renders the portal
 * subtree nor competes with Motion's `layoutId` animation on the card itself.
 * The camera is frozen while a card is open (parallax is gated on
 * `activeStarId === null`), so the anchor's screen point is stable and only the
 * card's own growth / resize needs tracking.
 *
 * `anchor` arrives via a callback ref stored in state rather than a `useRef`:
 * the anchor lives inside drei's `<Html>` portal, which attaches its DOM a beat
 * after this component commits, so a ref would still read `null` on first run.
 * Threading the live node through state re-runs the effect once it mounts.
 */
function useKeepCardInView({
  anchor,
  canvasEl,
  memberId,
  active,
}: {
  anchor: HTMLDivElement | null;
  canvasEl: HTMLElement | null;
  memberId: string | null;
  active: boolean;
}): void {
  useEffect(() => {
    if (anchor === null) return;
    anchor.style.willChange = "transform";

    if (canvasEl === null || memberId === null || !active) {
      // Card is exiting (or absent): ease the correction back to zero so the
      // shrink-to-star morph lands on the star instead of the nudged position.
      // Framer snapshots the source box for the case-file `layoutId` morph at
      // exit start, so easing afterward doesn't disturb that transition.
      anchor.style.transition = "transform 200ms ease-out";
      anchor.style.transform = "translate(0px, 0px)";
      return;
    }

    // Track instantly (no CSS transition): each pass reads the live, fully
    // applied transform off the DOM, so an in-flight transition would feed back
    // mid-animation positions and overshoot. The entrance morph supplies the
    // motion; we only nudge it to stay on screen.
    anchor.style.transition = "none";
    anchor.style.transform = "translate(0px, 0px)";
    let applied = { x: 0, y: 0 };

    const recompute = () => {
      const card = anchor.firstElementChild;
      if (!(card instanceof HTMLElement)) return;
      const delta = fitRectOffset(
        card.getBoundingClientRect(),
        canvasEl.getBoundingClientRect(),
        VIEWPORT_FIT_MARGIN_PX,
      );
      if (Math.abs(delta.x) < 0.5 && Math.abs(delta.y) < 0.5) return;
      applied = { x: applied.x + delta.x, y: applied.y + delta.y };
      anchor.style.transform = `translate(${applied.x}px, ${applied.y}px)`;
    };

    const frame = requestAnimationFrame(recompute);
    const observer = new ResizeObserver(recompute);
    if (anchor.firstElementChild instanceof HTMLElement) {
      observer.observe(anchor.firstElementChild);
    }
    observer.observe(canvasEl);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [anchor, canvasEl, memberId, active]);
}

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
  // Stored in state (not a ref) so the fit effect re-runs once drei's <Html>
  // portal attaches the anchor node — see useKeepCardInView.
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  const canvasEl = useThree((state) => state.gl.domElement);

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

  // Derived before the early return so the fit hook's deps stay unconditional.
  const showCard =
    activeStar !== undefined &&
    renderedStar !== null &&
    activeStar.member.id === renderedStar.member.id;
  useKeepCardInView({
    anchor,
    canvasEl,
    memberId: renderedStar?.member.id ?? null,
    active: showCard,
  });

  if (renderedStar === null || renderedPos === null) return null;

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
      <div ref={setAnchor} className="relative h-0 w-0">
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
