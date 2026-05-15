import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

import type { GameSave, ShiftState } from "../../domain/game";
import { getActiveShift } from "../../services/game-seed";
import { CupidMark, EASE_OUT_QUART, pad2 } from "../dashboard-atoms";
import { formatTimestamp, useTickingRelative } from "./shared";

const BADGE_SEAL = "0231-AC";
const AGENT_CODE = "OP-0231";
const ROLE_TITLE = "Interdimensional Dating Coach";

export function PunchCard({
  save,
  showVoidStamp,
}: {
  save: GameSave | null;
  showVoidStamp: boolean;
}) {
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

      <article className="aura-glass-strong relative overflow-hidden rounded-[28px] p-6 lg:p-7">
        <PunchCardHeader />

        <div className="relative z-10 mt-5 flex items-center gap-4">
          <BadgeChip />
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
              {ROLE_TITLE}
            </h2>
            <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
              pair operations
              <span className="mx-2 text-aura-faint">·</span>
              clearance interdimensional
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-5">
          <MagneticStripe />
        </div>

        <div className="relative z-10 mt-5">
          {save === null ? <EmptyTerminalGrid /> : <SaveStatGrid save={save} />}
        </div>

        <div className="relative z-10 mt-5 flex items-center justify-between gap-3 font-mono text-micro uppercase tracking-[0.24em]">
          <span className="text-aura-faint">// authorization</span>
          <span className="text-aura-ink">{save === null ? "PENDING" : "CLEARED"}</span>
        </div>

        <AnimatePresence>
          {save !== null && !showVoidStamp ? <ActiveStamp key="active" /> : null}
          {showVoidStamp ? <VoidStamp key="void" /> : null}
        </AnimatePresence>
      </article>
    </div>
  );
}

function PunchCardHeader() {
  return (
    <div className="relative z-10 flex items-baseline justify-between gap-3">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.34em] text-aura-rose">
        Cupid // employee.badge
      </p>
      <p className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
        seal {BADGE_SEAL}
      </p>
    </div>
  );
}

function BadgeChip() {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-[18px] shadow-quiet ring-1 ring-white/70">
      <CupidMark variant="tile" className="size-20" />
    </div>
  );
}

function MagneticStripe() {
  return (
    <div className="relative h-9 overflow-hidden rounded-[10px] border border-aura-hairline bg-gradient-to-b from-slate-900 to-slate-800">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 right-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_2px,transparent_2px,transparent_6px)]"
      />
      <div aria-hidden className="absolute inset-x-2 top-1.5 h-1.5 rounded-full bg-white/15" />
      <div aria-hidden className="absolute inset-x-12 bottom-1.5 h-1 rounded-full bg-white/10" />
      <div
        aria-hidden
        className="splash-stripe-scan pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-micro font-semibold uppercase tracking-[0.42em] text-white/60">
        {AGENT_CODE} // CUPID PAIR OPS
      </span>
    </div>
  );
}

function SaveStatGrid({ save }: { save: GameSave }) {
  const activeShift = useMemo<ShiftState>(() => getActiveShift(save), [save]);
  const memberCount = save.members.length;
  const dateCount = save.dateSessions.length;
  const updatedRelative = useTickingRelative(save.updatedAt);
  const createdAbsolute = useMemo(() => formatTimestamp(save.createdAt), [save.createdAt]);

  const shiftStatusLabel = activeShift.status === "active" ? "open" : "closed";
  const shiftDateLabel =
    activeShift.dateSlotsUsed > 0
      ? "booked"
      : activeShift.status === "completed"
        ? "skipped"
        : "open";
  const shiftDateSub = activeShift.status === "active" ? "one per shift" : "filed";
  const lifetimeLabel = dateCount === 0 ? "none yet" : `${dateCount} logged`;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-5 gap-y-2">
        <FeaturedStat label="hopefuls" value={`${memberCount}`} sub="on file" />
        <FeaturedStat label="shift date" value={shiftDateLabel} sub={shiftDateSub} />
      </dl>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-2 border-t border-aura-hairline pt-3">
        <Stat label="last in" value={updatedRelative} accent />
        <Stat label="lifetime dates" value={lifetimeLabel} />
      </dl>
      <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        shift {pad2(activeShift.shiftNumber)} // {shiftStatusLabel}
        <span className="mx-2 text-aura-faint">·</span>
        hired {createdAbsolute}
      </p>
    </div>
  );
}

function EmptyTerminalGrid() {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-5 gap-y-2">
        <FeaturedStat label="hopefuls" value="0" sub="awaiting brief" />
        <FeaturedStat label="shift date" value="pending" sub="one per shift" />
      </dl>
      <p className="border-t border-aura-hairline pt-3 text-label text-aura-muted">
        Punch in to seed the roster, prep the Date Book, and have HR run a prophecy check on your
        behalf.
      </p>
    </div>
  );
}

function FeaturedStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">{label}</dt>
      <dd className="font-display text-display-sm font-semibold leading-tight tracking-tight tabular-nums text-aura-ink">
        {value}
      </dd>
      <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">{sub}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">{label}</dt>
      <dd
        className={`truncate font-display text-lead font-semibold tracking-tight ${accent ? "text-aura-rose" : "text-aura-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function ActiveStamp() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: 6 }}
      animate={{ opacity: 1, scale: 1, rotate: 14 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.6 }}
      className="pointer-events-none absolute right-7 top-1/2 z-10 select-none -translate-y-2"
      aria-hidden
    >
      <div className="rounded-md border-[3px] border-aura-emerald/70 bg-emerald-50/40 px-3 py-1.5 font-mono text-label font-bold uppercase tracking-[0.32em] text-aura-emerald shadow-quiet">
        Active
      </div>
    </motion.div>
  );
}

function VoidStamp() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.2, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: -10 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
      className="pointer-events-none absolute inset-0 z-20 grid select-none place-items-center"
      aria-hidden
    >
      <div className="rounded-md border-[6px] border-aura-rose/80 px-6 py-2 font-mono text-display-sm font-bold uppercase tracking-[0.4em] text-aura-rose/85 shadow-cta">
        VOID
      </div>
    </motion.div>
  );
}
