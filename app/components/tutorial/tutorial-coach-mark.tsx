import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { clamp } from "../../services/utils";
import { AuraButton } from "../aura-button";
import { EASE_OUT_QUART } from "../dashboard-atoms";
import {
  TutorialManagerAvatarPeek,
  TutorialManagerPortraitOver,
} from "./tutorial-manager-portrait";
import { TutorialProgressDots } from "./tutorial-progress-dots";
import { useTargetRect, type TutorialTarget } from "./use-target-rect";

export type CoachMarkPlacement = "top" | "bottom" | "left" | "right";

export type CoachMarkPortraitMode = "avatar" | "portrait" | "none";

export type CoachMarkTextTone = "light" | "dark";

/**
 * Pixel offsets from the viewport edge. When supplied, the coach mark pins
 * itself to the matching corner instead of computing position from `target`
 * + `placement`. Use this on steps whose anchor target sits inside a busy
 * surface (e.g. the constellation field) so the popup can float in a clear
 * corner while the pulse ring still highlights the real target.
 */
export type CoachMarkFixedPosition = {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
};

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
  fixedPosition?: CoachMarkFixedPosition;
  textTone?: CoachMarkTextTone;
  dismissRequiresConfirmation?: boolean;
  dismissConfirmLabel?: string;
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
  dismissLabel = "End tour",
  onDismiss,
  width = 380,
  offset = 24,
  portrait = "avatar",
  fixedPosition,
  textTone = "light",
  dismissRequiresConfirmation = false,
  dismissConfirmLabel = "Confirm end",
}: TutorialCoachMarkProps) {
  const rect = useTargetRect(target);
  const [dismissConfirming, setDismissConfirming] = useState(false);

  useEffect(() => {
    setDismissConfirming(false);
  }, [title, dismissLabel]);

  if (rect === null) return null;

  const usePortrait = portrait === "portrait";
  const useAvatar = portrait === "avatar";
  const extraTop = usePortrait ? 20 : 0;
  const estimatedHeight = usePortrait ? 320 : 260;
  const viewportW = typeof window === "undefined" ? 1920 : window.innerWidth;
  const effectiveWidth = Math.max(280, Math.min(width, viewportW - 32));
  const effectivePlacement = resolvePlacement(rect, placement, offset + extraTop, estimatedHeight);
  const position = computePosition(
    rect,
    effectivePlacement,
    offset + extraTop,
    effectiveWidth,
    estimatedHeight,
  );

  const fixed = fixedPosition;
  const animateProps =
    fixed === undefined
      ? {
          top: position.top,
          left: position.left,
          width: effectiveWidth,
          y: effectivePlacement === "top" ? "-100%" : "0%",
        }
      : {
          top: fixed.top,
          left: fixed.left,
          right: fixed.right,
          bottom: fixed.bottom,
          width: effectiveWidth,
          y: "0%",
        };
  const toneClasses = textToneClasses();
  const visibleDismissLabel =
    dismissRequiresConfirmation && dismissConfirming ? dismissConfirmLabel : dismissLabel;

  function handleDismiss() {
    if (onDismiss === undefined) return;
    if (dismissRequiresConfirmation && !dismissConfirming) {
      setDismissConfirming(true);
      return;
    }
    onDismiss();
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className="fixed z-50 max-w-[calc(100vw-2rem)]"
      initial={false}
      animate={animateProps}
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
        <div data-aura-glass-tone={textTone} className="aura-liquid-glass relative rounded-card">
          <GlassWatermark />
          <RegistrationCorners />

          {useAvatar ? <TutorialManagerAvatarPeek /> : null}
          {usePortrait ? <TutorialManagerPortraitOver loading="eager" /> : null}

          <div className={`relative px-5 pb-4 pt-5${usePortrait ? " pr-20" : ""}`}>
            <header className={`min-w-0${useAvatar ? " pl-14" : ""}`}>
              <h3
                className={`font-display text-lead font-semibold leading-snug tracking-tight ${toneClasses.title}`}
              >
                {title}
              </h3>
              <span
                aria-hidden
                className="mt-2 block h-px w-12 bg-gradient-to-r from-aura-rose/70 to-aura-rose/0"
              />
            </header>

            <div className={`mt-2.5 font-sans text-label leading-relaxed ${toneClasses.body}`}>
              {body}
            </div>

            <footer className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-3">
              <span className="mr-auto inline-flex min-w-0">
                {typeof stepIndex === "number" && typeof stepCount === "number" ? (
                  <TutorialProgressDots count={stepCount} active={stepIndex} />
                ) : null}
              </span>

              <span className="ml-auto inline-flex shrink-0 items-center gap-3">
                {onDismiss === undefined ? null : (
                  <AuraButton
                    tooltip={
                      dismissRequiresConfirmation
                        ? dismissConfirming
                          ? "End the tutorial now"
                          : "End the full tutorial"
                        : visibleDismissLabel
                    }
                    data-sfx="click"
                    onClick={handleDismiss}
                    className={`shrink-0 cursor-pointer whitespace-nowrap font-mono text-micro font-semibold uppercase tracking-[0.16em] transition hover:text-aura-rose ${toneClasses.dismiss}`}
                  >
                    {visibleDismissLabel}
                  </AuraButton>
                )}

                {primaryLabel === undefined || onPrimary === undefined ? null : (
                  <AuraButton
                    tooltip={primaryLabel}
                    data-sfx="primary"
                    onClick={onPrimary}
                    className="group/cta relative shrink-0 cursor-pointer overflow-hidden whitespace-nowrap rounded-pill bg-[linear-gradient(135deg,#0f172a_0%,#1e1b4b_55%,#831843_100%)] px-4 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-white shadow-cta transition"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 -left-8 w-8 -skew-x-[18deg] bg-white/35 transition duration-[650ms] group-hover/cta:translate-x-[150%]"
                    />
                    <span className="relative">{primaryLabel}</span>
                  </AuraButton>
                )}
              </span>
            </footer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function textToneClasses(): {
  title: string;
  body: string;
  dismiss: string;
} {
  return {
    title: "text-[color:var(--aura-glass-text)]",
    body: "text-[color:var(--aura-glass-text-muted)]",
    dismiss: "text-[color:var(--aura-glass-text-faint)]",
  };
}

function GlassWatermark() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-card bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0)_0_22px,var(--aura-glass-watermark-line)_22px_23px),radial-gradient(120%_80%_at_100%_0%,var(--aura-glass-watermark-glow),rgba(255,255,255,0)_60%)]"
    />
  );
}

function RegistrationCorners() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute left-2 top-2 size-2.5 border-l border-t border-[color:var(--aura-glass-registration)]" />
      <span className="absolute right-2 top-2 size-2.5 border-r border-t border-[color:var(--aura-glass-registration)]" />
      <span className="absolute bottom-2 left-2 size-2.5 border-b border-l border-[color:var(--aura-glass-registration)]" />
      <span className="absolute bottom-2 right-2 size-2.5 border-b border-r border-[color:var(--aura-glass-registration)]" />
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
