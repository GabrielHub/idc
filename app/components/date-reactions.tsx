import { AnimatePresence, motion } from "motion/react";

import type { Member, PortraitMood } from "../domain/game";
import { hashSeedUint32 } from "../services/utils";
import { EASE_OUT_QUART, Portrait } from "./dashboard-atoms";

/* ------------------------------------------------------------------ */
/* Reaction types                                                     */
/* ------------------------------------------------------------------ */

export type ReactionKind = "spark" | "love" | "laugh" | "anger" | "cry" | "warning";

export type ReactionIntensity = 1 | 2 | 3;

export type ReactionPlacement = "bottom-left" | "bottom-right";

export type ReactionSignal = {
  id: string;
  side: "left" | "right";
  kind: ReactionKind;
  intensity: ReactionIntensity;
};

export const REACTION_KINDS: readonly ReactionKind[] = [
  "spark",
  "love",
  "laugh",
  "anger",
  "cry",
  "warning",
] as const;

export const REACTION_ICON: Record<ReactionKind, string> = {
  spark: "✨",
  love: "💗",
  laugh: "😂",
  anger: "😡",
  cry: "😢",
  warning: "‼️",
};

export const REACTION_LABEL: Record<ReactionKind, string> = {
  spark: "Spark",
  love: "Love",
  laugh: "Laugh",
  anger: "Anger",
  cry: "Cry",
  warning: "Warning",
};

export const REACTION_STREAM_LIMIT = 4;

export type StandeeHeightScale = {
  className: string;
  value: number;
};

type StandeeHeightScaleBucket = StandeeHeightScale & {
  maxHeightInInches: number;
};

const STANDEE_HEIGHT_SCALE_BUCKETS: readonly StandeeHeightScaleBucket[] = [
  { maxHeightInInches: 53, className: "scale-[0.78]", value: 0.78 },
  { maxHeightInInches: 54, className: "scale-[0.79]", value: 0.79 },
  { maxHeightInInches: 55, className: "scale-[0.81]", value: 0.81 },
  { maxHeightInInches: 56, className: "scale-[0.82]", value: 0.82 },
  { maxHeightInInches: 57, className: "scale-[0.84]", value: 0.84 },
  { maxHeightInInches: 58, className: "scale-[0.85]", value: 0.85 },
  { maxHeightInInches: 59, className: "scale-[0.87]", value: 0.87 },
  { maxHeightInInches: 60, className: "scale-[0.88]", value: 0.88 },
  { maxHeightInInches: 61, className: "scale-[0.9]", value: 0.9 },
  { maxHeightInInches: 62, className: "scale-[0.91]", value: 0.91 },
  { maxHeightInInches: 63, className: "scale-[0.93]", value: 0.93 },
  { maxHeightInInches: 64, className: "scale-[0.94]", value: 0.94 },
  { maxHeightInInches: 65, className: "scale-[0.96]", value: 0.96 },
  { maxHeightInInches: 66, className: "scale-[0.97]", value: 0.97 },
  { maxHeightInInches: 67, className: "scale-[0.99]", value: 0.99 },
  { maxHeightInInches: 68, className: "scale-100", value: 1 },
  { maxHeightInInches: 69, className: "scale-[1.01]", value: 1.01 },
  { maxHeightInInches: 70, className: "scale-[1.03]", value: 1.03 },
  { maxHeightInInches: 71, className: "scale-[1.04]", value: 1.04 },
  { maxHeightInInches: 72, className: "scale-[1.06]", value: 1.06 },
  { maxHeightInInches: 73, className: "scale-[1.07]", value: 1.07 },
  { maxHeightInInches: 74, className: "scale-[1.09]", value: 1.09 },
  { maxHeightInInches: 75, className: "scale-110", value: 1.1 },
  { maxHeightInInches: 76, className: "scale-[1.12]", value: 1.12 },
  { maxHeightInInches: 77, className: "scale-[1.13]", value: 1.13 },
  { maxHeightInInches: 78, className: "scale-[1.15]", value: 1.15 },
  { maxHeightInInches: 79, className: "scale-[1.16]", value: 1.16 },
  { maxHeightInInches: 80, className: "scale-[1.18]", value: 1.18 },
  { maxHeightInInches: 81, className: "scale-[1.19]", value: 1.19 },
  { maxHeightInInches: 82, className: "scale-[1.21]", value: 1.21 },
  { maxHeightInInches: 83, className: "scale-[1.22]", value: 1.22 },
  { maxHeightInInches: Number.POSITIVE_INFINITY, className: "scale-[1.24]", value: 1.24 },
];

export function resolveStandeeHeightScale(heightInInches: number): StandeeHeightScale {
  const bucket =
    STANDEE_HEIGHT_SCALE_BUCKETS.find(
      (candidate) => heightInInches <= candidate.maxHeightInInches,
    ) ?? STANDEE_HEIGHT_SCALE_BUCKETS[STANDEE_HEIGHT_SCALE_BUCKETS.length - 1];

  return {
    className: bucket.className,
    value: bucket.value,
  };
}

export function formatMemberHeightLabel(heightInInches: number): string {
  const normalizedHeight = Math.max(0, Math.round(heightInInches));
  const feet = Math.floor(normalizedHeight / 12);
  const inches = normalizedHeight % 12;

  return `${feet} ft ${inches} in`;
}

export function formatMemberHeightShort(heightInInches: number): string {
  const normalizedHeight = Math.max(0, Math.round(heightInInches));
  const feet = Math.floor(normalizedHeight / 12);
  const inches = normalizedHeight % 12;

  return `${feet}'${inches}`;
}

export function pushReactionSignal(
  current: readonly ReactionSignal[],
  next: ReactionSignal,
): ReactionSignal[] {
  const filtered = current.filter((signal) => signal.kind !== next.kind);
  return [...filtered, next].slice(-REACTION_STREAM_LIMIT);
}

/* ------------------------------------------------------------------ */
/* Bubble visual buckets                                              */
/* ------------------------------------------------------------------ */

const REACTION_BUBBLE_FILL: Record<ReactionKind, string> = {
  spark:
    "border border-violet-200/70 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.95),rgba(221,214,254,0.62)_42%,rgba(167,139,250,0.42)_82%)] shadow-[0_18px_30px_-14px_rgba(124,58,237,0.55),inset_0_1px_0_0_rgba(255,255,255,0.85)]",
  love: "border border-rose-200/70 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.95),rgba(254,205,211,0.62)_42%,rgba(244,63,94,0.45)_82%)] shadow-[0_18px_30px_-14px_rgba(244,63,94,0.55),inset_0_1px_0_0_rgba(255,255,255,0.85)]",
  laugh:
    "border border-amber-200/80 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.95),rgba(254,243,199,0.7)_42%,rgba(245,158,11,0.45)_82%)] shadow-[0_18px_30px_-14px_rgba(245,158,11,0.5),inset_0_1px_0_0_rgba(255,255,255,0.85)]",
  anger:
    "border border-rose-300/75 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.92),rgba(254,205,211,0.55)_40%,rgba(190,18,60,0.5)_82%)] shadow-[0_20px_32px_-14px_rgba(190,18,60,0.6),inset_0_1px_0_0_rgba(255,255,255,0.8)]",
  cry: "border border-sky-200/80 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.95),rgba(186,230,253,0.62)_42%,rgba(14,165,233,0.45)_82%)] shadow-[0_18px_30px_-14px_rgba(14,165,233,0.5),inset_0_1px_0_0_rgba(255,255,255,0.85)]",
  warning:
    "border border-amber-300/75 bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.95),rgba(254,243,199,0.7)_42%,rgba(217,119,6,0.42)_82%)] shadow-[0_18px_30px_-14px_rgba(245,158,11,0.55),inset_0_1px_0_0_rgba(255,255,255,0.85)]",
};

const BUBBLE_SIZE_CLASS = [
  "size-7",
  "size-8",
  "size-9",
  "size-10",
  "size-11",
  "size-12",
  "size-14",
] as const;

const BUBBLE_EMOJI_CLASS = [
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-2xl",
  "text-3xl",
  "text-3xl",
] as const;

const SWARM_COUNT: Record<ReactionIntensity, number> = {
  1: 3,
  2: 5,
  3: 7,
};

export function DaterStandee({
  member,
  placement,
  reactions,
  mood = "neutral",
  speaking = false,
  listening = false,
  reasoningText = "",
  className = "",
}: {
  member: Member;
  placement: ReactionPlacement;
  reactions: ReactionSignal[];
  mood?: PortraitMood;
  speaking?: boolean;
  listening?: boolean;
  reasoningText?: string;
  className?: string;
}) {
  const isFocus = placement === "bottom-left";
  const heightScale = resolveStandeeHeightScale(member.standeeRenderHeightInInches);
  const baseGlow = isFocus
    ? "pointer-events-none absolute -inset-x-28 -inset-y-36 -z-10 bg-[radial-gradient(ellipse_at_50%_66%,rgba(244,63,94,0.3)_0%,rgba(217,70,239,0.09)_42%,transparent_74%)]"
    : "pointer-events-none absolute -inset-x-28 -inset-y-36 -z-10 bg-[radial-gradient(ellipse_at_50%_66%,rgba(167,139,250,0.26)_0%,rgba(217,70,239,0.08)_42%,transparent_74%)]";
  const shadowClass = isFocus
    ? "drop-shadow-[0_30px_42px_rgba(244,63,94,0.22)]"
    : "drop-shadow-[0_30px_42px_rgba(167,139,250,0.22)]";

  return (
    <div className={className}>
      <span aria-hidden className={baseGlow} />
      <MoodAmbientGlow mood={mood} />
      <div className={`relative size-full ${shadowClass}`}>
        <div
          className={`absolute inset-x-0 bottom-0 aspect-[887/1774] origin-bottom ${heightScale.className} transition-transform duration-[420ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]`}
        >
          <Portrait member={member} variant="standee-bottom" asset="portrait" mood={mood} />
          <SpeakingBubble
            speaking={speaking}
            listening={listening}
            reasoningText={reasoningText}
            mood={mood}
          />
        </div>
        <ReactionStream reactions={reactions} placement={placement} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mood ambient glow, sits behind the standee                         */
/* ------------------------------------------------------------------ */

const MOOD_AMBIENT_GLOW: Record<PortraitMood, string> = {
  neutral: "",
  flirty:
    "bg-[radial-gradient(ellipse_at_50%_72%,rgba(244,63,94,0.32),rgba(244,63,94,0.06)_50%,transparent_70%)]",
  confused:
    "bg-[radial-gradient(ellipse_at_50%_72%,rgba(99,102,241,0.26),rgba(99,102,241,0.05)_50%,transparent_70%)]",
  angry:
    "bg-[radial-gradient(ellipse_at_50%_72%,rgba(220,38,38,0.34),rgba(220,38,38,0.06)_45%,transparent_65%)]",
};

function MoodAmbientGlow({ mood }: { mood: PortraitMood }) {
  const glowClass = MOOD_AMBIENT_GLOW[mood];

  return (
    <AnimatePresence mode="sync">
      {glowClass !== "" ? (
        <motion.span
          key={mood}
          aria-hidden
          className={`pointer-events-none absolute inset-0 -z-10 ${glowClass}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT_QUART }}
        />
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Thought bubble, surfaces a member's streaming inner reasoning      */
/* ------------------------------------------------------------------ */

const MOOD_BUBBLE_TINT: Record<
  PortraitMood,
  {
    surface: string;
    ring: string;
    rule: string;
    pulseDot: string;
    label: string;
  }
> = {
  neutral: {
    surface: "from-white/0 via-white/0 to-transparent",
    ring: "ring-white/55",
    rule: "via-aura-hairline-strong/60",
    pulseDot: "bg-aura-rose",
    label: "text-aura-faint",
  },
  flirty: {
    surface: "from-rose-200/45 via-rose-100/12 to-transparent",
    ring: "ring-rose-200/60",
    rule: "via-rose-300/55",
    pulseDot: "bg-aura-rose",
    label: "text-rose-500/75",
  },
  confused: {
    surface: "from-indigo-200/40 via-indigo-100/12 to-transparent",
    ring: "ring-indigo-200/60",
    rule: "via-indigo-300/50",
    pulseDot: "bg-aura-violet",
    label: "text-indigo-500/75",
  },
  angry: {
    surface: "from-rose-400/40 via-rose-300/14 to-transparent",
    ring: "ring-rose-300/60",
    rule: "via-rose-400/55",
    pulseDot: "bg-rose-500",
    label: "text-rose-600/75",
  },
};

function SpeakingBubble({
  speaking,
  listening,
  reasoningText,
  mood,
}: {
  speaking: boolean;
  listening: boolean;
  reasoningText: string;
  mood: PortraitMood;
}) {
  const normalizedReasoningText = compactReasoningText(reasoningText);
  const hasReasoningText = speaking && normalizedReasoningText.length > 0;
  const tint = MOOD_BUBBLE_TINT[mood];
  const anchorClass = "absolute left-1/2 bottom-[96%] -translate-x-1/2 origin-bottom";
  const tailSideClass = "left-1/2 -translate-x-1/2";
  const visible = speaking || listening;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          aria-hidden
          className={`${anchorClass} pointer-events-none z-30`}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 6 }}
          transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
        >
          <motion.div
            layout
            transition={{ duration: 0.34, ease: EASE_OUT_QUART }}
            className={`relative max-w-56 min-w-[9.5rem] overflow-hidden rounded-[26px] bg-white/82 shadow-quiet ring-1 ring-inset backdrop-blur-md ${tint.ring}`}
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${tint.surface}`}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/85 to-transparent"
            />

            <div className="relative flex items-center gap-1.5 px-4 pt-2.5 pb-1.5">
              <motion.span
                className={`size-1.5 rounded-full ${tint.pulseDot}`}
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.06, 0.85] }}
                transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
              />
              <span
                className={`font-mono text-micro font-semibold uppercase tracking-[0.3em] ${tint.label}`}
              >
                // thinking
              </span>
            </div>

            <span
              aria-hidden
              className={`mx-4 block h-px bg-gradient-to-r from-transparent ${tint.rule} to-transparent`}
            />

            <div className="relative px-4 pt-2 pb-3">
              <AnimatePresence initial={false}>
                {hasReasoningText ? (
                  <motion.p
                    key="reasoning"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
                    className="max-h-24 overflow-hidden text-xs leading-snug text-aura-ink/80"
                  >
                    {normalizedReasoningText}
                  </motion.p>
                ) : (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex h-5 items-center gap-1.5"
                  >
                    <TypingDots />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <ThoughtTail sideClass={tailSideClass} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const TAIL_DOTS = [
  { sizeClass: "size-2", baseOpacity: 0.92, delay: 0 },
  { sizeClass: "size-1.5", baseOpacity: 0.85, delay: 0.2 },
  { sizeClass: "size-1", baseOpacity: 0.78, delay: 0.4 },
] as const;

function ThoughtTail({ sideClass }: { sideClass: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -bottom-2.5 ${sideClass} flex flex-col items-center gap-[3px]`}
    >
      {TAIL_DOTS.map((dot, index) => (
        <motion.span
          key={index}
          className={`${dot.sizeClass} rounded-full bg-white/82 shadow-quiet ring-1 ring-inset ring-white/60 backdrop-blur-md`}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [dot.baseOpacity * 0.78, dot.baseOpacity, dot.baseOpacity * 0.78],
          }}
          transition={{
            duration: 2.4,
            ease: "easeInOut",
            repeat: Infinity,
            delay: dot.delay,
          }}
        />
      ))}
    </div>
  );
}

const TYPING_DOT_COLORS = ["bg-aura-rose", "bg-aura-fuchsia", "bg-aura-violet"] as const;

function TypingDots() {
  return (
    <>
      {TYPING_DOT_COLORS.map((color, dotIndex) => (
        <motion.span
          key={dotIndex}
          className={`size-1.5 rounded-full ${color}`}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.06, 0.7] }}
          transition={{
            duration: 1.05,
            ease: "easeInOut",
            repeat: Infinity,
            delay: dotIndex * 0.16,
          }}
        />
      ))}
    </>
  );
}

function compactReasoningText(reasoningText: string): string {
  const compactedText = reasoningText.replace(/\s+/g, " ").trim();
  const maxLength = 220;

  if (compactedText.length <= maxLength) {
    return compactedText;
  }

  return `...${compactedText.slice(compactedText.length - maxLength)}`;
}

export function ReactionStream({
  reactions,
  placement,
}: {
  reactions: ReactionSignal[];
  placement: ReactionPlacement;
}) {
  if (reactions.length === 0) {
    return null;
  }

  const anchorClass =
    placement === "bottom-left"
      ? "absolute left-1/2 bottom-[28%]"
      : "absolute right-1/2 bottom-[28%]";

  return (
    <div aria-hidden className={`${anchorClass} pointer-events-none z-20`}>
      {reactions.slice(0, REACTION_STREAM_LIMIT).map((reaction, swarmIndex) => (
        <ReactionSwarm
          key={reaction.id}
          reaction={reaction}
          swarmIndex={swarmIndex}
          placement={placement}
        />
      ))}
    </div>
  );
}

function ReactionSwarm({
  reaction,
  swarmIndex,
  placement,
}: {
  reaction: ReactionSignal;
  swarmIndex: number;
  placement: ReactionPlacement;
}) {
  const count = SWARM_COUNT[reaction.intensity];
  const swarmDelay = swarmIndex * 0.32;
  const swarmAnchorOffset = (swarmIndex - 1.5) * 18;

  return (
    <>
      {Array.from({ length: count }, (_, bubbleIndex) => (
        <ReactionBubble
          key={`${reaction.id}-${bubbleIndex}`}
          reaction={reaction}
          bubbleIndex={bubbleIndex}
          swarmDelay={swarmDelay}
          swarmAnchorOffset={swarmAnchorOffset}
          placement={placement}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* ReactionBubble, a single rising bubble                             */
/* ------------------------------------------------------------------ */

function ReactionBubble({
  reaction,
  bubbleIndex,
  swarmDelay,
  swarmAnchorOffset,
  placement,
}: {
  reaction: ReactionSignal;
  bubbleIndex: number;
  swarmDelay: number;
  swarmAnchorOffset: number;
  placement: ReactionPlacement;
}) {
  // Deterministic per-bubble seed keeps SSR and client renders in sync.
  const seed = hashSeedUint32(`${reaction.kind}:${bubbleIndex}`);

  const baseIdx = reaction.intensity === 3 ? 3 : reaction.intensity === 2 ? 1 : 0;
  const slot = bubbleIndex % 3;
  const sizeIdx = Math.min(baseIdx + slot, BUBBLE_SIZE_CLASS.length - 1);
  const sizeClass = BUBBLE_SIZE_CLASS[sizeIdx];
  const emojiClass = BUBBLE_EMOJI_CLASS[sizeIdx];

  const wobbleAmp = 12 + (seed % 9);
  const sideMul = placement === "bottom-left" ? 1 : -1;
  const startX = swarmAnchorOffset + (((seed * 5) % 9) - 4) * 3;
  const riseDistance = reaction.kind === "cry" ? 110 + (seed % 30) : 160 + (seed % 50);
  const riseDuration = 3.0 + ((seed * 7) % 6) * 0.12;
  const startSpread = bubbleIndex * 0.18 + ((seed * 3) % 4) * 0.06;
  const restDuration = 4.4 + ((seed * 11) % 5) * 0.4;

  // cry bubbles linger lower with a heavier droop than other kinds.
  const yArc =
    reaction.kind === "cry"
      ? [0, -riseDistance * 0.18, -riseDistance * 0.42, -riseDistance * 0.7, -riseDistance]
      : [0, -riseDistance * 0.22, -riseDistance * 0.55, -riseDistance * 0.82, -riseDistance];

  const xArc = [
    startX,
    startX + wobbleAmp * sideMul * 0.7,
    startX - wobbleAmp * sideMul * 0.4,
    startX + wobbleAmp * sideMul * 0.5,
    startX - wobbleAmp * sideMul * 0.2,
  ];

  // spark and laugh use a snappier overshoot than the gentler love/anger/cry/warning arc.
  const isSnappy = reaction.kind === "spark" || reaction.kind === "laugh";
  const scaleArc = isSnappy ? [0.2, 1.05, 1, 0.95, 0.7] : [0.32, 1, 1.06, 1.0, 0.78];

  const opacityArc = [0, 1, 1, 0.88, 0];

  return (
    <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
      <motion.span
        className={`grid place-items-center rounded-full backdrop-blur-md ${sizeClass} ${REACTION_BUBBLE_FILL[reaction.kind]}`}
        initial={{ opacity: 0, scale: 0.2, x: startX, y: 0 }}
        animate={{
          opacity: opacityArc,
          scale: scaleArc,
          x: xArc,
          y: yArc,
        }}
        transition={{
          duration: riseDuration,
          delay: swarmDelay + startSpread,
          repeat: Infinity,
          repeatDelay: restDuration,
          ease: EASE_OUT_QUART,
          times: [0, 0.18, 0.5, 0.78, 1],
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-[20%] top-[16%] h-[26%] w-[26%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95),transparent_70%)] blur-[1px]"
        />
        <span className={`relative select-none leading-none ${emojiClass}`}>
          {REACTION_ICON[reaction.kind]}
        </span>
      </motion.span>
    </div>
  );
}
