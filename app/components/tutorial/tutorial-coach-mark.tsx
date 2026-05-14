import { motion } from "motion/react";
import type { ReactNode } from "react";

import { clamp } from "../../services/utils";
import { EASE_OUT_QUART } from "../dashboard-atoms";
import { TutorialProgressDots } from "./tutorial-progress-dots";
import { useTargetRect, type TutorialTarget } from "./use-target-rect";

export type CoachMarkPlacement = "top" | "bottom" | "left" | "right";

export type TutorialCoachMarkProps = {
  target: TutorialTarget;
  placement?: CoachMarkPlacement;
  eyebrow: string;
  title: string;
  body: ReactNode;
  stepIndex?: number;
  stepCount?: number;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  dismissLabel?: string;
  onDismiss?: () => void;
  width?: number;
  offset?: number;
};

const ARROW_SIZE = 14;

export function TutorialCoachMark({
  target,
  placement = "bottom",
  eyebrow,
  title,
  body,
  stepIndex,
  stepCount,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  dismissLabel = "Skip tour",
  onDismiss,
  width = 340,
  offset = 18,
}: TutorialCoachMarkProps) {
  const rect = useTargetRect(target);
  if (rect === null) return null;

  const position = computePosition(rect, placement, offset, width);
  const showProgress = typeof stepIndex === "number" && typeof stepCount === "number";

  return (
    <motion.div
      key="tutorial-coach-mark"
      initial={{ opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
      role="dialog"
      aria-modal="false"
      aria-label={`${eyebrow}: ${title}`}
      className="aura-glass-strong fixed z-50 rounded-card p-5 shadow-card"
      style={{
        top: position.top,
        left: position.left,
        width,
      }}
    >
      <CoachMarkArrow placement={placement} arrowOffset={position.arrowOffset} />

      <header>
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          {eyebrow}
        </p>
        <h3 className="mt-2 font-display text-display-sm font-semibold leading-tight text-aura-ink">
          {title}
        </h3>
      </header>

      <div className="mt-3 text-label leading-relaxed text-aura-muted">{body}</div>

      <footer className="mt-5 flex items-center gap-3">
        {showProgress ? (
          <div className="mr-auto">
            <TutorialProgressDots count={stepCount} active={stepIndex} />
          </div>
        ) : (
          <span className="mr-auto" />
        )}

        {onDismiss === undefined ? null : (
          <button
            type="button"
            data-sfx="click"
            onClick={onDismiss}
            className="cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint transition hover:text-aura-rose"
          >
            {dismissLabel}
          </button>
        )}

        {secondaryLabel === undefined || onSecondary === undefined ? null : (
          <button
            type="button"
            data-sfx="click"
            onClick={onSecondary}
            className="cursor-pointer rounded-pill border border-transparent bg-white/40 px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/70 hover:text-aura-ink"
          >
            {secondaryLabel}
          </button>
        )}

        {primaryLabel === undefined || onPrimary === undefined ? null : (
          <button
            type="button"
            data-sfx="primary"
            onClick={onPrimary}
            className="cursor-pointer rounded-pill bg-aura-ink px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta transition hover:bg-aura-rose"
          >
            {primaryLabel}
          </button>
        )}
      </footer>
    </motion.div>
  );
}

function CoachMarkArrow({
  placement,
  arrowOffset,
}: {
  placement: CoachMarkPlacement;
  arrowOffset: number;
}) {
  const baseStyle: React.CSSProperties = {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,253,249,0.78))",
    borderTop: "1px solid rgba(255, 255, 255, 0.78)",
    borderLeft: "1px solid rgba(255, 255, 255, 0.78)",
  };

  if (placement === "bottom") {
    return (
      <span
        aria-hidden
        className="absolute"
        style={{
          ...baseStyle,
          top: -ARROW_SIZE / 2,
          left: arrowOffset,
          transform: "rotate(45deg)",
        }}
      />
    );
  }
  if (placement === "top") {
    return (
      <span
        aria-hidden
        className="absolute"
        style={{
          ...baseStyle,
          bottom: -ARROW_SIZE / 2,
          left: arrowOffset,
          transform: "rotate(225deg)",
        }}
      />
    );
  }
  if (placement === "right") {
    return (
      <span
        aria-hidden
        className="absolute"
        style={{
          ...baseStyle,
          top: arrowOffset,
          left: -ARROW_SIZE / 2,
          transform: "rotate(-45deg)",
        }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="absolute"
      style={{
        ...baseStyle,
        top: arrowOffset,
        right: -ARROW_SIZE / 2,
        transform: "rotate(135deg)",
      }}
    />
  );
}

function computePosition(
  rect: { top: number; left: number; width: number; height: number },
  placement: CoachMarkPlacement,
  offset: number,
  width: number,
): { top: number; left: number; arrowOffset: number } {
  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;

  if (placement === "bottom") {
    const top = rect.top + rect.height + offset;
    const left = clamp(targetCenterX - width / 2, 16, window.innerWidth - width - 16);
    const arrowOffset = clamp(targetCenterX - left - ARROW_SIZE / 2, 18, width - 32);
    return { top, left, arrowOffset };
  }
  if (placement === "top") {
    const left = clamp(targetCenterX - width / 2, 16, window.innerWidth - width - 16);
    const arrowOffset = clamp(targetCenterX - left - ARROW_SIZE / 2, 18, width - 32);
    return { top: rect.top - offset - 200, left, arrowOffset };
  }
  if (placement === "right") {
    const left = rect.left + rect.width + offset;
    const top = clamp(targetCenterY - 80, 16, window.innerHeight - 200);
    const arrowOffset = clamp(targetCenterY - top - ARROW_SIZE / 2, 18, 160);
    return { top, left, arrowOffset };
  }
  const left = rect.left - offset - width;
  const top = clamp(targetCenterY - 80, 16, window.innerHeight - 200);
  const arrowOffset = clamp(targetCenterY - top - ARROW_SIZE / 2, 18, 160);
  return { top, left, arrowOffset };
}
