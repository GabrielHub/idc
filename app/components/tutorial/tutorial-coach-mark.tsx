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
  eyebrow?: string;
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
  eyebrow,
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
  const position = computePosition(rect, placement, offset + extraTop, width);

  return (
    <motion.div
      key="tutorial-coach-mark"
      initial={{ opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.97, rotate: -0.4 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className="fixed z-50"
      style={{
        top: position.top,
        left: position.left,
        width,
      }}
    >
      {eyebrow === undefined ? null : (
        <ManilaTab text={eyebrow} side={useAvatar ? "right" : "left"} />
      )}

      <div
        className="relative rounded-card"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 248, 240, 0.78) 100%)",
          backdropFilter: "blur(36px) saturate(180%)",
          WebkitBackdropFilter: "blur(36px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.82)",
          boxShadow: [
            "inset 0 1px 0 0 rgba(255, 255, 255, 0.95)",
            "inset 0 0 0 1px rgba(244, 63, 94, 0.06)",
            "0 4px 14px -4px rgba(15, 23, 42, 0.08)",
            "0 30px 70px -22px rgba(244, 63, 94, 0.32)",
          ].join(", "),
        }}
      >
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
              className="mt-2 block h-px w-12"
              style={{
                background:
                  "linear-gradient(90deg, rgba(244, 63, 94, 0.7) 0%, rgba(244, 63, 94, 0) 100%)",
              }}
            />
          </header>

          <div
            className="mt-2.5 font-serif text-label italic leading-relaxed text-aura-muted"
            style={{ fontWeight: 400, letterSpacing: "-0.005em" }}
          >
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
                className="group/cta relative cursor-pointer overflow-hidden rounded-pill px-4 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta transition"
                style={{
                  backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #831843 100%)",
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 -left-8 w-8 -skew-x-[18deg] bg-white/35 transition group-hover/cta:translate-x-[150%]"
                  style={{ transitionDuration: "650ms" }}
                />
                <span className="relative">{primaryLabel}</span>
              </button>
            )}
          </footer>
        </div>
      </div>
    </motion.div>
  );
}

function ManilaTab({ text, side }: { text: string; side: "left" | "right" }) {
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.36, ease: EASE_OUT_QUART, delay: 0.06 }}
      className="pointer-events-none absolute z-10 select-none"
      style={{
        top: -14,
        ...(side === "left" ? { left: 18 } : { right: 18 }),
      }}
    >
      <span
        className="relative inline-flex items-center gap-1.5 px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255, 244, 230, 0.96) 0%, rgba(255, 226, 209, 0.88) 100%)",
          borderRadius: "10px 10px 4px 4px",
          border: "1px solid rgba(244, 63, 94, 0.22)",
          borderBottom: "none",
          boxShadow:
            "inset 0 1px 0 0 rgba(255, 255, 255, 0.85), 0 -2px 6px -2px rgba(244, 63, 94, 0.16)",
        }}
      >
        <span
          aria-hidden
          className="size-1 rounded-full"
          style={{ background: "rgba(244, 63, 94, 0.85)" }}
        />
        {text}
      </span>
    </motion.div>
  );
}

function PaperWatermark() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-card"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(15, 23, 42, 0) 0 22px, rgba(15, 23, 42, 0.012) 22px 23px), radial-gradient(120% 80% at 100% 0%, rgba(244, 63, 94, 0.06), rgba(244, 63, 94, 0) 60%)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

function RegistrationCorners() {
  const stroke = "rgba(15, 23, 42, 0.18)";
  const reach = 10;
  const inset = 8;
  const corners: Array<{
    key: string;
    style: React.CSSProperties;
    borders: React.CSSProperties;
  }> = [
    {
      key: "tl",
      style: { top: inset, left: inset },
      borders: { borderTop: `1px solid ${stroke}`, borderLeft: `1px solid ${stroke}` },
    },
    {
      key: "tr",
      style: { top: inset, right: inset },
      borders: { borderTop: `1px solid ${stroke}`, borderRight: `1px solid ${stroke}` },
    },
    {
      key: "bl",
      style: { bottom: inset, left: inset },
      borders: { borderBottom: `1px solid ${stroke}`, borderLeft: `1px solid ${stroke}` },
    },
    {
      key: "br",
      style: { bottom: inset, right: inset },
      borders: { borderBottom: `1px solid ${stroke}`, borderRight: `1px solid ${stroke}` },
    },
  ];

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {corners.map((corner) => (
        <span
          key={corner.key}
          className="absolute"
          style={{
            width: reach,
            height: reach,
            ...corner.style,
            ...corner.borders,
          }}
        />
      ))}
    </span>
  );
}

function computePosition(
  rect: { top: number; left: number; width: number; height: number },
  placement: CoachMarkPlacement,
  offset: number,
  width: number,
): { top: number; left: number } {
  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;
  const margin = 16;
  const viewportW = typeof window === "undefined" ? 1920 : window.innerWidth;
  const viewportH = typeof window === "undefined" ? 1080 : window.innerHeight;

  if (placement === "bottom") {
    return {
      top: rect.top + rect.height + offset,
      left: clamp(targetCenterX - width / 2, margin, viewportW - width - margin),
    };
  }
  if (placement === "top") {
    return {
      top: rect.top - offset - 200,
      left: clamp(targetCenterX - width / 2, margin, viewportW - width - margin),
    };
  }
  if (placement === "right") {
    return {
      top: clamp(targetCenterY - 90, margin, viewportH - 220),
      left: rect.left + rect.width + offset,
    };
  }
  return {
    top: clamp(targetCenterY - 90, margin, viewportH - 220),
    left: rect.left - offset - width,
  };
}
