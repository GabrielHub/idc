import { motion } from "motion/react";

import { EASE_OUT_QUART } from "../dashboard-atoms";
import { expandRect, useTargetRect, type TutorialTarget } from "./use-target-rect";

export type TutorialPulseRingProps = {
  target: TutorialTarget;
  padding?: number;
  radius?: number;
  tone?: "rose" | "violet" | "amber" | "emerald";
};

type ToneStyles = {
  ring: string;
  halo: string;
  ink: string;
  glow: string;
};

const TONE_STYLES: Record<NonNullable<TutorialPulseRingProps["tone"]>, ToneStyles> = {
  rose: {
    ring: "rgba(244, 63, 94, 0.92)",
    halo: "rgba(244, 63, 94, 0.32)",
    ink: "rgba(190, 18, 60, 0.55)",
    glow: "0 0 18px 4px rgba(244, 63, 94, 0.45)",
  },
  violet: {
    ring: "rgba(167, 139, 250, 0.95)",
    halo: "rgba(167, 139, 250, 0.32)",
    ink: "rgba(91, 33, 182, 0.55)",
    glow: "0 0 22px 4px rgba(167, 139, 250, 0.5)",
  },
  amber: {
    ring: "rgba(245, 158, 11, 0.92)",
    halo: "rgba(245, 158, 11, 0.32)",
    ink: "rgba(146, 64, 14, 0.55)",
    glow: "0 0 18px 4px rgba(245, 158, 11, 0.45)",
  },
  emerald: {
    ring: "rgba(16, 185, 129, 0.92)",
    halo: "rgba(16, 185, 129, 0.3)",
    ink: "rgba(6, 95, 70, 0.5)",
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
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-40"
      initial={false}
      animate={{
        top: ring.top,
        left: ring.left,
        width: ring.width,
        height: ring.height,
      }}
      transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.7 }}
    >
      <motion.span
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          boxShadow: `inset 0 0 0 1.5px ${styles.ring}, ${styles.glow}`,
        }}
        initial={{ opacity: 0, scale: 1.18 }}
        animate={{
          opacity: [0, 1, 1, 0.85, 1, 0.9, 1],
          scale: [1.18, 1, 1.06, 1, 1.04, 1, 1.02],
        }}
        transition={{
          duration: 1.4,
          times: [0, 0.18, 0.38, 0.5, 0.7, 0.82, 1],
          ease: EASE_OUT_QUART,
        }}
      />

      <motion.span
        className="absolute"
        style={{
          inset: -7,
          borderRadius: radius + 7,
          border: `1.5px solid ${styles.halo}`,
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: [0, 0.55, 0, 0.55, 0, 0.45, 0],
          scale: [0.92, 1.12, 0.98, 1.16, 1, 1.18, 1.05],
        }}
        transition={{
          duration: 1.4,
          times: [0, 0.2, 0.4, 0.55, 0.7, 0.85, 1],
          ease: EASE_OUT_QUART,
        }}
      />

      <motion.span
        className="absolute"
        style={{
          inset: -3,
          borderRadius: radius + 3,
          border: `1px dashed ${styles.ink}`,
        }}
        animate={{ opacity: [0.45, 0.72, 0.45] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.span
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          boxShadow: `inset 0 0 0 1.5px ${styles.ring}, ${styles.glow}`,
        }}
        animate={{ opacity: [0.65, 0.95, 0.65] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
      />

      <CornerBrackets tone={styles.ink} />
    </motion.div>
  );
}

function CornerBrackets({ tone }: { tone: string }) {
  const reach = 6;
  const gap = 4;
  const stroke: React.CSSProperties = {
    position: "absolute",
    width: reach,
    height: reach,
  };
  return (
    <span aria-hidden className="pointer-events-none absolute" style={{ inset: -gap }}>
      <span
        style={{
          ...stroke,
          top: 0,
          left: 0,
          borderTop: `1.2px solid ${tone}`,
          borderLeft: `1.2px solid ${tone}`,
        }}
      />
      <span
        style={{
          ...stroke,
          top: 0,
          right: 0,
          borderTop: `1.2px solid ${tone}`,
          borderRight: `1.2px solid ${tone}`,
        }}
      />
      <span
        style={{
          ...stroke,
          bottom: 0,
          left: 0,
          borderBottom: `1.2px solid ${tone}`,
          borderLeft: `1.2px solid ${tone}`,
        }}
      />
      <span
        style={{
          ...stroke,
          bottom: 0,
          right: 0,
          borderBottom: `1.2px solid ${tone}`,
          borderRight: `1.2px solid ${tone}`,
        }}
      />
    </span>
  );
}
