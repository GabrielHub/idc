import { motion } from "motion/react";

import {
  type DateSession,
  type FollowUpAction,
  type Member,
  type PairState,
} from "../../../domain/game";
import { EASE_OUT_QUART, Portrait, scoreWidthClass } from "../../../components/dashboard-atoms";
import { previewFollowUpEffects } from "../../../services/date-engine";
import type { OutcomeStateDeltas } from "../../../services/date-outcome-state";
import {
  applyFollowUpPairMemoryEffects,
  selectPairSpotlightItem,
} from "../../../services/pair-memory";
import type { PrimaryRelationshipStat } from "../../../services/pair-stats";
import { LAB_NOW, MetricPill } from "./gameplay-lab-shared";

const FOLLOW_UP_VISUAL: Record<
  FollowUpAction,
  { label: string; caption: string; band: string; accentText: string; recommendRing: string }
> = {
  pursue: {
    label: "Pursue",
    caption: "chase the next booking",
    band: "from-rose-400 via-aura-rose to-aura-fuchsia",
    accentText: "text-aura-rose",
    recommendRing: "ring-aura-rose/45",
  },
  cool_down: {
    label: "Cool down",
    caption: "let the file rest",
    band: "from-amber-300 via-aura-amber to-amber-500",
    accentText: "text-amber-600",
    recommendRing: "ring-amber-300/55",
  },
  close: {
    label: "Close",
    caption: "shut the lane",
    band: "from-slate-500 via-aura-ink to-slate-600",
    accentText: "text-aura-ink",
    recommendRing: "ring-aura-ink/30",
  },
};

const PAIR_STAT_ROWS: readonly PrimaryRelationshipStat[] = [
  "chemistry",
  "trust",
  "stability",
  "conflict",
  "spark",
];
const MEMBER_STAT_ROWS: readonly { key: keyof OutcomeStateDeltas; label: string }[] = [
  { key: "mood", label: "mood" },
  { key: "retention", label: "retention" },
  { key: "burnout", label: "burnout" },
];

// Diverging-bar full-scale magnitude. Follow-up stat deltas land within roughly
// +/-10, so a delta of this size fills its half of the track.
const MAX_DELTA = 10;
const BAR_MOTION = "transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]";

export function PairTag({ focus, partner }: { focus: Member; partner: Member }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-pill bg-white/55 px-3 py-2 ring-1 ring-aura-hairline">
      <div className="flex -space-x-2">
        <Portrait member={focus} variant="chip" />
        <Portrait member={partner} variant="chip" />
      </div>
      <div className="pr-1">
        <p className="font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">pair file</p>
        <p className="font-display text-sm font-semibold text-aura-ink">
          {focus.firstName} <span className="text-aura-faint">×</span> {partner.firstName}
        </p>
      </div>
    </div>
  );
}

export function RouteCard({
  action,
  index,
  pairState,
  session,
  recommended,
}: {
  action: FollowUpAction;
  index: number;
  pairState: PairState;
  session: DateSession;
  recommended: boolean;
}) {
  const preview = previewFollowUpEffects(pairState, session, action);
  const memoryResult = applyFollowUpPairMemoryEffects({
    pairState,
    session,
    action,
    timestamp: LAB_NOW,
  });
  const spotlight = selectPairSpotlightItem(memoryResult.pairState);
  const laneStatus = action === "close" ? "closed" : memoryResult.pairState.laneStatus;
  const visual = FOLLOW_UP_VISUAL[action];
  const trustDelta = preview.nextStats.trust - pairState.stats.trust;
  const strainDelta = preview.nextStats.strain - pairState.stats.strain;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT_QUART, delay: 0.15 + index * 0.08 }}
      className={`relative flex flex-col overflow-hidden rounded-card bg-white/60 ring-1 ${
        recommended
          ? `${visual.recommendRing} shadow-[0_26px_60px_-32px_rgba(244,63,94,0.4)]`
          : "ring-aura-hairline"
      }`}
    >
      <span aria-hidden className={`h-1.5 w-full bg-gradient-to-r ${visual.band}`} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <RouteGlyph action={action} className={visual.accentText} />
            <div>
              <h4 className="font-display text-lg font-semibold leading-tight text-aura-ink">
                {visual.label}
              </h4>
              <p className="font-mono text-micro uppercase tracking-[0.16em] text-aura-faint">
                {visual.caption}
              </p>
            </div>
          </div>
          <LaneChip status={laneStatus} />
        </div>

        {recommended ? <RecommendedFlag className={visual.accentText} /> : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <OutcomeGauge
            label="next trust"
            value={preview.nextStats.trust}
            delta={trustDelta}
            variant="trust"
          />
          <OutcomeGauge
            label="next strain"
            value={preview.nextStats.strain}
            delta={strainDelta}
            variant="strain"
          />
        </div>

        <div className="mt-5">
          <RowLabel>relationship shift</RowLabel>
          <div className="mt-2.5 space-y-1.5">
            {PAIR_STAT_ROWS.map((stat) => (
              <DeltaBar key={stat} label={stat} delta={preview.statDeltas[stat]} />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <RowLabel>member state</RowLabel>
          <div className="mt-2.5 space-y-1.5">
            {MEMBER_STAT_ROWS.map((row) => (
              <DeltaBar key={row.key} label={row.label} delta={preview.memberDeltas[row.key]} />
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-aura-hairline pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {preview.reasons.map((reason) => (
              <ReasonTag key={reason} reason={reason} />
            ))}
            <MetricPill label="memories" value={memoryResult.memories.length} tone="ink" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-aura-muted">
            {spotlight === null
              ? "No active spotlight remains after this follow-up."
              : spotlight.guidance}
          </p>
        </div>
      </div>
    </motion.section>
  );
}

function OutcomeGauge({
  label,
  value,
  delta,
  variant,
}: {
  label: string;
  value: number;
  delta: number;
  variant: "trust" | "strain";
}) {
  const bounded = Math.max(0, Math.min(100, value));
  const fill =
    variant === "trust"
      ? "bg-gradient-to-r from-aura-rose to-aura-fuchsia"
      : "bg-gradient-to-r from-amber-400 to-aura-amber";

  return (
    <div className="rounded-tile bg-white/55 p-3 ring-1 ring-aura-hairline">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-micro uppercase tracking-[0.16em] text-aura-faint">
          {label}
        </span>
        <DeltaTag delta={delta} />
      </div>
      <p className="mt-1.5 font-display text-2xl font-semibold leading-none text-aura-ink tabular-nums">
        {value}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-white/70 ring-1 ring-aura-hairline">
        <span
          className={`block h-full rounded-pill ${fill} ${scoreWidthClass(bounded)} ${BAR_MOTION}`}
        />
      </div>
    </div>
  );
}

function DeltaBar({ label, delta }: { label: string; delta: number | undefined }) {
  const value = delta ?? 0;
  const magnitude = Math.min(100, (Math.abs(value) / MAX_DELTA) * 100);
  const widthClass = scoreWidthClass(magnitude);

  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[4.5rem] shrink-0 truncate font-mono text-micro uppercase tracking-[0.12em] text-aura-muted">
        {label}
      </span>
      <div className="flex h-2.5 flex-1 items-stretch">
        <div className="flex flex-1 justify-end overflow-hidden rounded-l-pill bg-white/55 ring-1 ring-aura-hairline">
          {value < 0 ? (
            <span className={`rounded-l-pill bg-aura-rose/80 ${widthClass} ${BAR_MOTION}`} />
          ) : null}
        </div>
        <span aria-hidden className="z-10 -mx-px w-px bg-aura-hairline-strong" />
        <div className="flex flex-1 justify-start overflow-hidden rounded-r-pill bg-white/55 ring-1 ring-aura-hairline">
          {value > 0 ? (
            <span className={`rounded-r-pill bg-emerald-500/80 ${widthClass} ${BAR_MOTION}`} />
          ) : null}
        </div>
      </div>
      <span
        className={`w-9 shrink-0 text-right font-mono text-micro font-semibold tabular-nums ${
          value > 0 ? "text-emerald-700" : value < 0 ? "text-aura-rose" : "text-aura-faint"
        }`}
      >
        {value > 0 ? `+${value}` : value < 0 ? value : "·"}
      </span>
    </div>
  );
}

function DeltaTag({ delta }: { delta: number }) {
  const tone =
    delta > 0
      ? "bg-emerald-50 text-emerald-700"
      : delta < 0
        ? "bg-rose-50 text-aura-rose"
        : "bg-white/65 text-aura-faint";
  const label = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "0";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 font-mono text-micro font-semibold tabular-nums ${tone}`}
    >
      <DeltaArrow delta={delta} />
      {label}
    </span>
  );
}

function LaneChip({ status }: { status: string }) {
  const closed = status === "closed";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.14em] ring-1 ${
        closed
          ? "bg-rose-50 text-aura-rose ring-rose-200/70"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200/70"
      }`}
    >
      <span className={`size-1.5 rounded-full ${closed ? "bg-aura-rose" : "bg-emerald-500"}`} />
      lane {status}
    </span>
  );
}

function ReasonTag({ reason }: { reason: string }) {
  return (
    <span className="inline-flex items-center rounded-pill bg-white/70 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.12em] text-aura-muted ring-1 ring-aura-hairline">
      {reason}
    </span>
  );
}

function RecommendedFlag({ className }: { className: string }) {
  return (
    <div
      className={`mt-3 inline-flex items-center gap-1.5 self-start rounded-pill bg-white/75 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] ring-1 ring-aura-hairline ${className}`}
    >
      <StarGlyph />
      report pick
    </div>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-faint">
      {children}
    </p>
  );
}

function RouteGlyph({ action, className = "" }: { action: FollowUpAction; className?: string }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-full bg-white/70 ring-1 ring-aura-hairline ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {action === "pursue" ? (
          <>
            <path d="M5 12h13" />
            <path d="M13 6l6 6-6 6" />
          </>
        ) : action === "cool_down" ? (
          <>
            <path d="M9 7v10" />
            <path d="M15 7v10" />
          </>
        ) : (
          <>
            <path d="M7 7l10 10" />
            <path d="M17 7L7 17" />
          </>
        )}
      </svg>
    </span>
  );
}

function DeltaArrow({ delta }: { delta: number }) {
  if (delta === 0) {
    return null;
  }
  return (
    <svg viewBox="0 0 12 12" className="size-2.5" fill="currentColor" aria-hidden>
      {delta > 0 ? <path d="M6 2l4 6H2z" /> : <path d="M6 10L2 4h8z" />}
    </svg>
  );
}

function StarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden>
      <path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" />
    </svg>
  );
}
