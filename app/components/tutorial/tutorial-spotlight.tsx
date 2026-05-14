import { motion } from "motion/react";
import { useId } from "react";

import { EASE_OUT_QUART } from "../dashboard-atoms";
import { expandRect, useTargetRect, type TutorialTarget } from "./use-target-rect";

export type TutorialSpotlightProps = {
  target: TutorialTarget;
  padding?: number;
  radius?: number;
  scrimOpacity?: number;
  onDismiss?: () => void;
};

export function TutorialSpotlight({
  target,
  padding = 12,
  radius = 18,
  scrimOpacity = 0.62,
  onDismiss,
}: TutorialSpotlightProps) {
  const rect = useTargetRect(target);
  const maskId = useId();

  if (rect === null) {
    return (
      <motion.div
        key="tutorial-spotlight-fallback"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
        onClick={onDismiss}
        className="fixed inset-0 z-40 cursor-pointer bg-aura-ink/55 backdrop-blur-sm"
      />
    );
  }

  const hole = expandRect(rect, padding);

  return (
    <motion.div
      key="tutorial-spotlight"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT_QUART }}
      onClick={onDismiss}
      className="fixed inset-0 z-40 cursor-pointer"
      aria-hidden
    >
      <svg className="absolute inset-0 size-full" preserveAspectRatio="none">
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <motion.rect
              initial={false}
              animate={{
                x: hole.left,
                y: hole.top,
                width: hole.width,
                height: hole.height,
              }}
              transition={{ duration: 0.34, ease: EASE_OUT_QUART }}
              rx={radius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`rgba(15, 23, 42, ${scrimOpacity})`}
          mask={`url(#${maskId})`}
        />
      </svg>

      <motion.div
        initial={false}
        animate={{
          top: hole.top - 1,
          left: hole.left - 1,
          width: hole.width + 2,
          height: hole.height + 2,
        }}
        transition={{ duration: 0.34, ease: EASE_OUT_QUART }}
        className="pointer-events-none absolute"
        style={{
          borderRadius: radius + 1,
          boxShadow:
            "0 0 0 1px rgba(255, 255, 255, 0.6), 0 0 28px 6px rgba(244, 63, 94, 0.32), 0 0 80px 12px rgba(167, 139, 250, 0.22)",
        }}
      />
    </motion.div>
  );
}
