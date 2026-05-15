import { motion } from "motion/react";
import { useEffect, useState } from "react";

import type { GameSave, Member, PlayerKnowledgeRecord } from "../../domain/game";
import { miraPark, mrWhiskers, starterMembers, vhool } from "../../fixtures/members";
import { buildVisibleMemberProfile } from "../../services/player-knowledge";
import { EASE_OUT_QUART, LiveDot, Portrait, pad2 } from "../dashboard-atoms";
import { PunchCard } from "./punch-card";

const RIFFLE_FADE_IN_DELAY_MS = 180;
const RIFFLE_PER_CARD_DELAY_MS = 240;
const RIFFLE_FADE_IN_DURATION_S = 0.45;
const RIFFLE_LINGER_MS = 900;
const RIFFLE_SETTLE_DURATION_S = 1;

type RiffleCardData = {
  member: Member;
  queueIndex: string;
};

const RIFFLE_CARDS: RiffleCardData[] = [
  { member: miraPark, queueIndex: "01" },
  { member: vhool, queueIndex: "09" },
  { member: mrWhiskers, queueIndex: "17" },
];

const RIFFLE_QUEUE_TOTAL = pad2(starterMembers.length);

const EMPTY_KNOWLEDGE: readonly PlayerKnowledgeRecord[] = [];

/**
 * Per-card layout keyframes for the boot riffle. Each card sits at its peek
 * position behind the punch card (offset far enough to show avatar or right
 * column details past the badge edges), then slowly shifts back into the
 * paper stack. Cards always render below the punch card on z-axis so the
 * peek reads as paper sticking out from behind a deck, never as a card on
 * top of the badge.
 */
type RiffleLayout = {
  peekX: number;
  peekY: number;
  peekRotate: number;
  tuckX: number;
  tuckY: number;
  tuckRotate: number;
  tuckOpacity: number;
};

const RIFFLE_LAYOUTS: RiffleLayout[] = [
  {
    peekX: 138,
    peekY: -46,
    peekRotate: 7.4,
    tuckX: 40,
    tuckY: 26,
    tuckRotate: 5.2,
    tuckOpacity: 0.72,
  },
  {
    peekX: -146,
    peekY: -34,
    peekRotate: -7.6,
    tuckX: -40,
    tuckY: 28,
    tuckRotate: -4.8,
    tuckOpacity: 0.66,
  },
  {
    peekX: 6,
    peekY: -158,
    peekRotate: 1.8,
    tuckX: 4,
    tuckY: 36,
    tuckRotate: 1.6,
    tuckOpacity: 0.58,
  },
];

/**
 * Punch card is interactive from t=0. Riffle cards animate around it as
 * decoration: each fades in already peeked out behind the punch card so
 * the avatar and dossier details show, lingers for a beat, then slowly
 * shifts back into the paper stack. Cards stay below the punch card in
 * z-order the entire animation so the peek always reads as paper from
 * behind a deck, never as a card on top of the badge.
 */
export function RiffleStack({
  save,
  showVoidStamp,
}: {
  save: GameSave | null;
  showVoidStamp: boolean;
}) {
  return (
    <div className="relative grid [perspective:1400px]">
      {RIFFLE_CARDS.map((card, index) => {
        const layout = RIFFLE_LAYOUTS[index] ?? RIFFLE_LAYOUTS[0];
        const fadeInDelayMs = RIFFLE_FADE_IN_DELAY_MS + index * RIFFLE_PER_CARD_DELAY_MS;
        return (
          <RiffleCard
            key={card.member.id}
            data={card}
            layout={layout}
            fadeInDelayMs={fadeInDelayMs}
          />
        );
      })}

      <motion.div
        className="relative z-30 [grid-area:1/1]"
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      >
        <PunchCard save={save} showVoidStamp={showVoidStamp} />
      </motion.div>
    </div>
  );
}

type RifflePhase = "hidden" | "peek" | "tucked";

function RiffleCard({
  data,
  layout,
  fadeInDelayMs,
}: {
  data: RiffleCardData;
  layout: RiffleLayout;
  fadeInDelayMs: number;
}) {
  const [phase, setPhase] = useState<RifflePhase>("hidden");

  useEffect(() => {
    const peekTimer = window.setTimeout(() => setPhase("peek"), fadeInDelayMs);
    const tuckTimer = window.setTimeout(
      () => setPhase("tucked"),
      fadeInDelayMs + RIFFLE_FADE_IN_DURATION_S * 1000 + RIFFLE_LINGER_MS,
    );
    return () => {
      window.clearTimeout(peekTimer);
      window.clearTimeout(tuckTimer);
    };
  }, [fadeInDelayMs]);

  const target =
    phase === "tucked"
      ? {
          x: layout.tuckX,
          y: layout.tuckY,
          rotate: layout.tuckRotate,
          scale: 0.97,
          opacity: layout.tuckOpacity,
        }
      : phase === "peek"
        ? {
            x: layout.peekX,
            y: layout.peekY,
            rotate: layout.peekRotate,
            scale: 1,
            opacity: 1,
          }
        : {
            x: layout.peekX,
            y: layout.peekY,
            rotate: layout.peekRotate,
            scale: 0.96,
            opacity: 0,
          };

  const transitionDuration =
    phase === "tucked" ? RIFFLE_SETTLE_DURATION_S : RIFFLE_FADE_IN_DURATION_S;

  return (
    <motion.div
      initial={{
        x: layout.peekX,
        y: layout.peekY,
        rotate: layout.peekRotate,
        scale: 0.96,
        opacity: 0,
      }}
      animate={target}
      transition={{ duration: transitionDuration, ease: EASE_OUT_QUART }}
      className="pointer-events-none relative z-[5] will-change-transform [grid-area:1/1]"
      aria-hidden
    >
      <RiffleCardSlot data={data} />
    </motion.div>
  );
}

function RiffleCardSlot({ data }: { data: RiffleCardData }) {
  const visibleProfile = buildVisibleMemberProfile(data.member, EMPTY_KNOWLEDGE);
  const publicFragment =
    visibleProfile.publicFragments[0] ??
    "A hopeful file with several pages, one signature, and a suspiciously warm paperclip.";
  const visibleSeals = visibleProfile.redactedBlocks.slice(0, 3);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-2 -z-10 rounded-[36px] bg-gradient-to-br from-aura-mesh-rose/45 via-aura-mesh-violet/40 to-aura-mesh-amber/40 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 -translate-x-2 translate-y-2 rotate-[-2.4deg] rounded-[28px] aura-glass-rose"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 translate-x-3 translate-y-4 rotate-[2.1deg] rounded-[28px] aura-glass-strong opacity-60"
      />

      <article className="aura-glass-strong relative overflow-hidden rounded-[28px] p-6 lg:p-7">
        <div className="relative z-10 flex items-baseline justify-between gap-3">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.34em] text-aura-rose">
            Cupid // hopeful.{data.queueIndex}
          </p>
          <p className="inline-flex items-center gap-2 font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
            <LiveDot tone="amber" />
            queue {data.queueIndex} / {RIFFLE_QUEUE_TOTAL}
          </p>
        </div>

        <div className="relative z-10 mt-5 flex items-end gap-5">
          <Portrait member={data.member} variant="card" asset="avatar" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-faint">
              hopeful
            </p>
            <h2 className="truncate font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
              {data.member.firstName}
            </h2>
            <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
              hopeful file
              <span className="mx-2 text-aura-faint">·</span>
              intake queued
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-5">
          <p className="aura-accent line-clamp-2 text-lead leading-snug text-aura-ink/85">
            {publicFragment}
          </p>
        </div>

        <dl className="relative z-10 mt-5 grid grid-cols-3 gap-x-3 gap-y-2">
          {visibleSeals.map((seal) => (
            <RiffleSeal key={seal.id} label={seal.label} lineCount={seal.lineCount} />
          ))}
        </dl>

        <div className="relative z-10 mt-5 flex items-center justify-between gap-3 font-mono text-micro uppercase tracking-[0.24em]">
          <span className="text-aura-faint">// dossier preview</span>
          <span className="text-aura-rose">sealed</span>
        </div>
      </article>
    </div>
  );
}

function RiffleSeal({ label, lineCount }: { label: string; lineCount: number }) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">{label}</dt>
      <dd className="flex items-center gap-1.5">
        {Array.from({ length: lineCount }).map((_, index) => (
          <span
            aria-hidden
            className="block h-1.5 w-5 rounded-full bg-aura-ink/20"
            key={`${label}-${index}`}
          />
        ))}
        <span className="sr-only">sealed</span>
      </dd>
    </div>
  );
}
