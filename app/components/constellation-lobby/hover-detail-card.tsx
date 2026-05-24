import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { caseFileNumber } from "../member-card-atoms";
import { avatarSrcsetFor, formatHeightShort, profileSnippetFor, withAlpha } from "./math";
import type { StarMark } from "./types";

export type HoverDetailCtaVariant =
  | "make_focus"
  | "make_lead"
  | "make_partner"
  | "swap_into_focus"
  | "view_case";

export type HoverDetailCardProps = {
  star: StarMark;
  snippet?: string;
  fileNumber?: string;
  heightInInches?: number;
  statusBadge?: "active" | "focus" | "closed" | "quit";
  swapPenalty?: number;
  ctaVariant?: HoverDetailCtaVariant;
  onPrimaryAction?: () => void;
  onOpenCase?: () => void;
  recentNotesSlot?: ReactNode;
};

const MORPH_PORTRAIT_FINAL_SIZE_PX = 48;
const MORPH_START_DIAMETER_PX = MORPH_PORTRAIT_FINAL_SIZE_PX;
const MORPH_FINAL_WIDTH_PX = 340;
const MORPH_FINAL_PADDING_PX = 16;
// Pop the portrait above the card edge by half its height so the card body
// doesn't have to budget vertical space for the full 48px avatar.
const MORPH_PORTRAIT_POP_PX = MORPH_PORTRAIT_FINAL_SIZE_PX / 2;
const MORPH_FINAL_OFFSET_X_PX = -(MORPH_FINAL_WIDTH_PX / 2);
// Final card top sits at the star anchor; the portrait straddles the edge so
// its center stays on the star while the card extends only downward.
const MORPH_FINAL_OFFSET_Y_PX = 0;

export function HoverDetailCard({
  star,
  snippet,
  fileNumber,
  heightInInches,
  statusBadge,
  swapPenalty,
  ctaVariant = "make_focus",
  onPrimaryAction,
  onOpenCase,
  recentNotesSlot,
}: HoverDetailCardProps) {
  const { member, palette } = star;
  const resolvedSnippet = snippet ?? profileSnippetFor(member);
  const resolvedFileNumber = fileNumber ?? caseFileNumber(member.id);
  const resolvedHeight = heightInInches ?? member.characterHeightInInches;
  const reducedMotion = useReducedMotion() === true;

  const statusLabel = (() => {
    if (statusBadge === "closed") return "case closed";
    if (statusBadge === "quit") return "membership cancelled";
    if (statusBadge === "focus") return "focus case";
    return null;
  })();
  const statusPillClass = (() => {
    if (statusBadge === "closed") return "bg-emerald-500/15 text-emerald-200 ring-emerald-300/30";
    if (statusBadge === "quit") return "bg-rose-500/15 text-rose-200 ring-rose-300/30";
    if (statusBadge === "focus") return "bg-aura-rose/85 text-aura-paper ring-aura-rose/40";
    return "";
  })();

  const primaryLabel = (() => {
    if (ctaVariant === "view_case") return "View case";
    if (ctaVariant === "swap_into_focus") return "Swap into focus";
    if (ctaVariant === "make_partner") return "Make partner";
    if (ctaVariant === "make_lead") return "Make lead";
    return "Make focus";
  })();
  const primaryToneClass =
    ctaVariant === "view_case"
      ? "aura-liquid-glass aura-liquid-glass-hover"
      : "aura-liquid-glass aura-liquid-glass-rose aura-liquid-glass-hover";

  const srcset = avatarSrcsetFor(member.id);
  const layoutTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.7 };
  const contentTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.22, delay: 0.12, ease: [0.22, 0.8, 0.2, 1] as const };
  const portraitAccent = palette.accent;

  return (
    <motion.div
      layoutId={`constellation-case-card-${member.id}`}
      initial={
        reducedMotion
          ? {
              opacity: 0,
              width: MORPH_FINAL_WIDTH_PX,
              height: "auto",
              borderRadius: 16,
              paddingTop: 0,
              paddingRight: MORPH_FINAL_PADDING_PX,
              paddingBottom: MORPH_FINAL_PADDING_PX,
              paddingLeft: MORPH_FINAL_PADDING_PX,
              x: MORPH_FINAL_OFFSET_X_PX,
              y: MORPH_FINAL_OFFSET_Y_PX,
            }
          : {
              opacity: 0.85,
              width: MORPH_START_DIAMETER_PX,
              height: MORPH_START_DIAMETER_PX,
              borderRadius: MORPH_START_DIAMETER_PX / 2,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              x: -MORPH_START_DIAMETER_PX / 2,
              y: -MORPH_START_DIAMETER_PX / 2,
            }
      }
      animate={{
        opacity: 1,
        width: MORPH_FINAL_WIDTH_PX,
        height: "auto",
        borderRadius: 16,
        paddingTop: 0,
        paddingRight: MORPH_FINAL_PADDING_PX,
        paddingBottom: MORPH_FINAL_PADDING_PX,
        paddingLeft: MORPH_FINAL_PADDING_PX,
        x: MORPH_FINAL_OFFSET_X_PX,
        y: MORPH_FINAL_OFFSET_Y_PX,
      }}
      exit={
        reducedMotion
          ? { opacity: 0, transition: { duration: 0.12 } }
          : {
              width: MORPH_START_DIAMETER_PX,
              height: MORPH_START_DIAMETER_PX,
              borderRadius: MORPH_START_DIAMETER_PX / 2,
              paddingTop: 0,
              paddingRight: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              x: -MORPH_START_DIAMETER_PX / 2,
              y: -MORPH_START_DIAMETER_PX / 2,
              transition: layoutTransition,
            }
      }
      transition={layoutTransition}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      className="pointer-events-auto aura-liquid-glass"
    >
      <div
        style={{
          width: MORPH_FINAL_WIDTH_PX - 2 * MORPH_FINAL_PADDING_PX,
          flexShrink: 0,
        }}
      >
        <div className="flex flex-col items-center">
          <motion.div
            initial={{
              boxShadow: reducedMotion
                ? `0 0 0 1.5px ${portraitAccent}, 0 0 18px ${withAlpha(portraitAccent, 0.5)}`
                : `0 0 0 1.5px ${portraitAccent}, 0 0 26px ${withAlpha(portraitAccent, 0.7)}`,
              marginTop: reducedMotion ? -MORPH_PORTRAIT_POP_PX : 0,
            }}
            animate={{
              boxShadow: `0 0 0 1.5px ${portraitAccent}, 0 0 18px ${withAlpha(portraitAccent, 0.5)}`,
              marginTop: -MORPH_PORTRAIT_POP_PX,
            }}
            exit={
              reducedMotion
                ? undefined
                : {
                    boxShadow: `0 0 0 1.5px ${portraitAccent}, 0 0 26px ${withAlpha(portraitAccent, 0.7)}`,
                    marginTop: 0,
                    transition: layoutTransition,
                  }
            }
            transition={layoutTransition}
            style={{
              width: MORPH_PORTRAIT_FINAL_SIZE_PX,
              height: MORPH_PORTRAIT_FINAL_SIZE_PX,
              borderRadius: MORPH_PORTRAIT_FINAL_SIZE_PX / 2,
              position: "relative",
              flexShrink: 0,
              background: `linear-gradient(160deg, ${palette.from}, ${palette.to})`,
              overflow: "hidden",
            }}
          >
            <img
              src={srcset.src}
              srcSet={srcset.srcset}
              sizes={`${MORPH_PORTRAIT_FINAL_SIZE_PX}px`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top"
              loading="lazy"
            />
          </motion.div>
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.1 } }}
            transition={contentTransition}
            className="mt-3 w-full min-w-0 text-center leading-tight"
          >
            <div className="font-mono text-micro uppercase tracking-[0.22em] text-rose-100/95">
              // {resolvedFileNumber.toLowerCase()}
            </div>
            <div className="mt-0.5 truncate font-display text-display-sm text-aura-paper">
              {member.firstName}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-white/70 ring-1 ring-white/15">
                {formatHeightShort(resolvedHeight)}
              </span>
              {statusLabel === null ? null : (
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] ring-1 ${statusPillClass}`}
                >
                  {statusLabel}
                </span>
              )}
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.1 } }}
          transition={contentTransition}
        >
          <p className="mt-3 line-clamp-3 font-sans text-label text-white/85">{resolvedSnippet}</p>
          {recentNotesSlot}
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onOpenCase}
              className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-3.5 py-1.5 font-display text-label text-aura-paper"
            >
              View case
            </button>
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={onPrimaryAction === undefined}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 font-display text-label disabled:cursor-not-allowed disabled:opacity-50 ${primaryToneClass}`}
            >
              {primaryLabel}
            </button>
          </div>
          {ctaVariant === "swap_into_focus" && swapPenalty !== undefined ? (
            <p className="mt-2 text-center font-mono text-micro uppercase tracking-[0.18em] text-rose-200">
              Dropped case loses {swapPenalty} retention
            </p>
          ) : null}
        </motion.div>
      </div>
    </motion.div>
  );
}
