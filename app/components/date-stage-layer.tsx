import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { PortraitMood } from "../domain/game";
import { EASE_OUT_QUART } from "./dashboard-atoms";
import { selectStageHealthBand, type StageHealthBand } from "./date-presentation-signals";
import { useParallaxPointer } from "./use-parallax-pointer";

/**
 * Room-wide emotional lighting washes, keyed to the dominant judge mood. Kept
 * very low amplitude and bottom/edge weighted so the center transcript lane
 * stays readable: flirty warms the footlights, confused hazes the edges violet,
 * angry tightens to a hot edge falloff. Neutral renders nothing.
 */
const STAGE_MOOD_WASH: Record<PortraitMood, string> = {
  neutral: "",
  flirty:
    "bg-[radial-gradient(ellipse_120%_70%_at_50%_104%,rgba(244,63,94,0.16),rgba(251,113,133,0.06)_42%,transparent_72%)]",
  confused:
    "bg-[radial-gradient(ellipse_130%_96%_at_50%_50%,transparent_44%,rgba(139,92,246,0.13)_82%,rgba(99,102,241,0.05)_100%)]",
  angry:
    "bg-[radial-gradient(ellipse_120%_90%_at_50%_58%,transparent_38%,rgba(190,18,60,0.2)_100%)]",
};

const STAGE_HEALTH_VIGNETTE: Record<StageHealthBand, string> = {
  warm: "bg-[radial-gradient(ellipse_92%_88%_at_50%_56%,transparent_62%,rgba(255,214,170,0.12)_100%)]",
  steady:
    "bg-[radial-gradient(ellipse_88%_84%_at_50%_54%,transparent_55%,rgba(60,40,80,0.1)_100%)]",
  strained:
    "bg-[radial-gradient(ellipse_80%_78%_at_50%_52%,transparent_44%,rgba(30,27,75,0.26)_100%)]",
};

/**
 * Foreground stage plates that sit between the scenario backdrop and the
 * portraits. Each plate parallaxes at a different rate so the date scene reads
 * as depth instead of a flat photo: the floor anchors to the portraits and
 * shifts most, the warm wash above breathes mid-range, and a soft ceiling
 * vignette barely moves so the eye registers a near/far gradient.
 */
export function DateStageLayer({
  mood = "neutral",
  dateHealth = 50,
}: {
  mood?: PortraitMood;
  dateHealth?: number;
}) {
  const reducedMotion = useReducedMotion();
  const parallaxActive = reducedMotion !== true;
  useParallaxPointer(parallaxActive);
  const moodWash = STAGE_MOOD_WASH[mood];
  const healthBand = selectStageHealthBand(dateHealth);

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
      {/*
       * Emotional lighting. The health vignette and mood wash cross-fade on
       * change via opacity only, so they read as the room settling rather than
       * as motion. No continuous loop runs here, so this stays calm under
       * reduced motion without a separate code path.
       */}
      <AnimatePresence mode="sync">
        <motion.div
          key={healthBand}
          className={`absolute inset-0 ${STAGE_HEALTH_VIGNETTE[healthBand]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: EASE_OUT_QUART }}
        />
      </AnimatePresence>
      <AnimatePresence mode="sync">
        {moodWash === "" ? null : (
          <motion.div
            key={mood}
            className={`absolute inset-0 ${moodWash}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_QUART }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
