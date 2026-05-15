import { motion } from "motion/react";
import type { ReactNode } from "react";

import { clamp } from "../../services/utils";
import { EASE_OUT_QUART } from "../dashboard-atoms";
import {
  TutorialManagerAvatarPeek,
  TutorialManagerPortraitOver,
} from "./tutorial-manager-portrait";
import { TutorialProgressDots } from "./tutorial-progress-dots";
import { useTargetRect, type TutorialTarget } from "./use-target-rect";

export type CoachMarkPlacement = "top" | "bottom" | "left" | "right";

export type CoachMarkPortraitMode = "avatar" | "portrait" | "none";

export type TutorialCoachMarkProps = {
  target: TutorialTarget;
  placement?: CoachMarkPlacement;
  title: string;
  body: ReactNode;
  stepIndex?: number;
  stepCount?: number;
  primaryLabel?: string;
  onPrimary?: () => void;
  dismissLabel?: string;
  onDismiss?: () => void;
  width?: number;
  offset?: number;
  portrait?: CoachMarkPortraitMode;
};

export function TutorialCoachMark({
  target,
  placement = "bottom",
  title,
  body,
  stepIndex,
  stepCount,
  primaryLabel,
  onPrimary,
  dismissLabel = "Skip tour",
  onDismiss,
  width = 340,
  offset = 24,
  portrait = "avatar",
}: TutorialCoachMarkProps) {
  const rect = useTargetRect(target);
  if (rect === null) return null;

  const usePortrait = portrait === "portrait";
  const useAvatar = portrait === "avatar";
  const extraTop = usePortrait ? 20 : 0;
  const estimatedHeight = usePortrait ? 280 : 220;
  const effectivePlacement = resolvePlacement(rect, placement, offset + extraTop, estimatedHeight);
  const position = computePosition(
    rect,
    effectivePlacement,
    offset + extraTop,
    width,
    estimatedHeight,
  );

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className="fixed z-50"
      initial={false}
      animate={{
        top: position.top,
        left: position.left,
        width,
        y: effectivePlacement === "top" ? "-100%" : "0%",
      }}
      transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.7 }}
    >
      <motion.div
        key="tutorial-coach-mark"
        initial={{
          opacity: 0,
          y: effectivePlacement === "top" ? 6 : -6,
          scale: 0.97,
          rotate: -0.4,
        }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
        className="relative"
      >
        <div className="relative rounded-card border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,248,240,0.78)_100%)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),inset_0_0_0_1px_rgba(244,63,94,0.06),0_4px_14px_-4px_rgba(15,23,42,0.08),0_30px_70px_-22px_rgba(244,63,94,0.32)] backdrop-blur-[36px] backdrop-saturate-[180%]">
          <PaperWatermark />
          <RegistrationCorners />

          {useAvatar ? <TutorialManagerAvatarPeek /> : null}
          {usePortrait ? <TutorialManagerPortraitOver loading="eager" /> : null}

          <div className={`relative px-5 pb-4 pt-5${usePortrait ? " pr-20" : ""}`}>
            <header className={`min-w-0${useAvatar ? " pl-14" : ""}`}>
              <h3 className="font-display text-lead font-semibold leading-snug tracking-tight text-aura-ink">
                {title}
              </h3>
              <span
                aria-hidden
                className="mt-2 block h-px w-12 bg-gradient-to-r from-aura-rose/70 to-aura-rose/0"
              />
            </header>

            <div className="mt-2.5 font-sans text-label leading-relaxed text-aura-muted">
              {body}
            </div>

            <footer className="mt-4 flex items-center gap-3">
              <span className="mr-auto inline-flex">
                {typeof stepIndex === "number" && typeof stepCount === "number" ? (
                  <TutorialProgressDots count={stepCount} active={stepIndex} />
                ) : null}
              </span>

              {onDismiss === undefined ? null : (
                <button
                  type="button"
                  data-sfx="click"
                  onClick={onDismiss}
                  className="cursor-pointer font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint transition hover:text-aura-rose"
                >
                  {dismissLabel}
                </button>
              )}

              {primaryLabel === undefined || onPrimary === undefined ? null : (
                <button
                  type="button"
                  data-sfx="primary"
                  onClick={onPrimary}
                  className="group/cta relative cursor-pointer overflow-hidden rounded-pill bg-[linear-gradient(135deg,#0f172a_0%,#1e1b4b_55%,#831843_100%)] px-4 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta transition"
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 -left-8 w-8 -skew-x-[18deg] bg-white/35 transition duration-[650ms] group-hover/cta:translate-x-[150%]"
                  />
                  <span className="relative">{primaryLabel}</span>
                </button>
              )}
            </footer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PaperWatermark() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-card bg-[repeating-linear-gradient(0deg,rgba(15,23,42,0)_0_22px,rgba(15,23,42,0.012)_22px_23px),radial-gradient(120%_80%_at_100%_0%,rgba(244,63,94,0.06),rgba(244,63,94,0)_60%)] mix-blend-multiply"
    />
  );
}

function RegistrationCorners() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute left-2 top-2 size-2.5 border-l border-t border-aura-ink/20" />
      <span className="absolute right-2 top-2 size-2.5 border-r border-t border-aura-ink/20" />
      <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-aura-ink/20" />
      <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-aura-ink/20" />
    </span>
  );
}

function computePosition(
  rect: { top: number; left: number; width: number; height: number },
  placement: CoachMarkPlacement,
  offset: number,
  width: number,
  estimatedHeight: number,
): { top: number; left: number } {
  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;
  const margin = 16;
  const viewportW = typeof window === "undefined" ? 1920 : window.innerWidth;
  const viewportH = typeof window === "undefined" ? 1080 : window.innerHeight;

  if (placement === "bottom") {
    return {
      top: clamp(rect.top + rect.height + offset, margin, viewportH - estimatedHeight - margin),
      left: clamp(targetCenterX - width / 2, margin, viewportW - width - margin),
    };
  }
  if (placement === "top") {
    return {
      top: clamp(rect.top - offset, margin + estimatedHeight, viewportH - margin),
      left: clamp(targetCenterX - width / 2, margin, viewportW - width - margin),
    };
  }
  if (placement === "right") {
    return {
      top: clamp(targetCenterY - estimatedHeight / 2, margin, viewportH - estimatedHeight - margin),
      left: clamp(rect.left + rect.width + offset, margin, viewportW - width - margin),
    };
  }
  return {
    top: clamp(targetCenterY - estimatedHeight / 2, margin, viewportH - estimatedHeight - margin),
    left: clamp(rect.left - offset - width, margin, viewportW - width - margin),
  };
}

function resolvePlacement(
  rect: { top: number; height: number },
  placement: CoachMarkPlacement,
  offset: number,
  estimatedHeight: number,
): CoachMarkPlacement {
  if (placement !== "top" && placement !== "bottom") return placement;
  const margin = 16;
  const viewportH = typeof window === "undefined" ? 1080 : window.innerHeight;
  const topSpace = rect.top - offset - margin;
  const bottomSpace = viewportH - (rect.top + rect.height + offset) - margin;
  const needsHeight = estimatedHeight + margin;

  if (placement === "top" && topSpace < needsHeight && bottomSpace >= needsHeight) {
    return "bottom";
  }
  if (placement === "bottom" && bottomSpace < needsHeight && topSpace >= needsHeight) {
    return "top";
  }
  return placement;
}
