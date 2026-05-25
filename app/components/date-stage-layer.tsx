import { useReducedMotion } from "motion/react";

import { useParallaxPointer } from "./use-parallax-pointer";

/**
 * Foreground stage plates that sit between the scenario backdrop and the
 * portraits. Each plate parallaxes at a different rate so the date scene reads
 * as depth instead of a flat photo: the floor anchors to the portraits and
 * shifts most, the warm wash above breathes mid-range, and a soft ceiling
 * vignette barely moves so the eye registers a near/far gradient.
 */
export function DateStageLayer() {
  const reducedMotion = useReducedMotion();
  const parallaxActive = reducedMotion !== true;
  useParallaxPointer(parallaxActive);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className={`date-stage-ceiling absolute inset-x-0 top-0 h-[42%] ${
          parallaxActive ? "date-stage-parallax will-change-transform" : ""
        }`}
      />
      <div
        className={`date-stage-warm-wash absolute inset-0 ${
          parallaxActive ? "date-stage-parallax will-change-transform" : ""
        }`}
      />
      <div
        className={`date-stage-floor-glow absolute inset-x-0 bottom-0 h-[62%] ${
          parallaxActive ? "date-stage-parallax will-change-transform" : ""
        }`}
      />
      <div
        className={`date-stage-footlight absolute inset-x-0 bottom-0 h-[26%] ${
          parallaxActive ? "date-stage-parallax will-change-transform" : ""
        }`}
      />
    </div>
  );
}
