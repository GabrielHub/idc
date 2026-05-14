import { motion } from "motion/react";

import { EASE_OUT_QUART } from "../dashboard-atoms";
import { expandRect, useTargetRect, type TutorialTarget } from "./use-target-rect";

export type TutorialPulseRingProps = {
  target: TutorialTarget;
  padding?: number;
  radius?: number;
  tone?: "rose" | "violet" | "amber" | "emerald";
};

const TONE_STYLES: Record<
  NonNullable<TutorialPulseRingProps["tone"]>,
  { ring: string; halo: string; glow: string }
> = {
  rose: {
    ring: "rgba(244, 63, 94, 0.85)",
    halo: "rgba(244, 63, 94, 0.32)",
    glow: "0 0 18px 4px rgba(244, 63, 94, 0.45)",
  },
  violet: {
    ring: "rgba(167, 139, 250, 0.9)",
    halo: "rgba(167, 139, 250, 0.32)",
    glow: "0 0 22px 4px rgba(167, 139, 250, 0.5)",
  },
  amber: {
    ring: "rgba(245, 158, 11, 0.9)",
    halo: "rgba(245, 158, 11, 0.32)",
    glow: "0 0 18px 4px rgba(245, 158, 11, 0.45)",
  },
  emerald: {
    ring: "rgba(16, 185, 129, 0.9)",
    halo: "rgba(16, 185, 129, 0.3)",
    glow: "0 0 18px 4px rgba(16, 185, 129, 0.4)",
  },
};

export function TutorialPulseRing({
  target,
  padding = 6,
  radius = 16,
  tone = "rose",
}: TutorialPulseRingProps) {
  const rect = useTargetRect(target);
  if (rect === null) return null;

  const ring = expandRect(rect, padding);
  const styles = TONE_STYLES[tone];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-40"
      style={{
        top: ring.top,
        left: ring.left,
        width: ring.width,
        height: ring.height,
      }}
    >
      <motion.span
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          boxShadow: `inset 0 0 0 1.5px ${styles.ring}, ${styles.glow}`,
        }}
        animate={{ opacity: [0.95, 0.7, 0.95] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute"
        style={{
          inset: -6,
          borderRadius: radius + 6,
          border: `1.5px solid ${styles.halo}`,
        }}
        initial={{ opacity: 0.6, scale: 0.96 }}
        animate={{ opacity: [0.6, 0, 0.6], scale: [0.96, 1.08, 0.96] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: EASE_OUT_QUART }}
      />
    </div>
  );
}
