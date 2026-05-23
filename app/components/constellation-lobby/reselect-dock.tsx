/**
 * Reselect mode bottom dock — shown when the lobby is in `reselect` mode.
 * Mirrors the Roster room's `ReselectDock` shape (tally / dropped names /
 * confirm / cancel) but rendered against the lobby's glass surface so the
 * dock reads as part of the constellation field rather than a card grid.
 *
 * Tally: 4 pips, one per focus slot. Drops: listed with retention penalty.
 * Confirm CTA is disabled until the draft has exactly FOCUS_CASE_LIMIT picks.
 */

import { motion } from "motion/react";

import { FOCUS_CASE_LIMIT, FOCUS_SWAP_RETENTION_PENALTY } from "../../services/focus-cases";
import type { Member } from "../../domain/game";

export type ReselectDockProps = {
  draftCount: number;
  drops: Member[];
  totalDropCost: number;
  draftFull: boolean;
  isActionPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ReselectDock({
  draftCount,
  drops,
  totalDropCost,
  draftFull,
  isActionPending,
  onCancel,
  onConfirm,
}: ReselectDockProps) {
  const canConfirm = !isActionPending && draftCount === FOCUS_CASE_LIMIT;
  const droppedNames = drops.map((m) => m.firstName).join(", ");
  // Silence unused-vars: draftFull is exposed so future styles can echo it.
  void draftFull;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.32, ease: [0.22, 0.8, 0.2, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center px-6"
    >
      <div className="pointer-events-auto aura-liquid-glass aura-liquid-glass-rose flex flex-wrap items-center justify-center gap-4 rounded-pill px-5 py-3">
        <ReselectTally count={draftCount} />
        {drops.length > 0 ? (
          <>
            <Divider />
            <div className="flex items-center gap-2 font-mono text-micro uppercase tracking-[0.22em]">
              <span aria-hidden className="size-1.5 rounded-full bg-aura-rose" />
              <span className="text-white/55">Dropping</span>
              <span className="text-aura-rose">{droppedNames}</span>
              <span aria-hidden className="text-white/45 opacity-80">
                ·
              </span>
              <span className="text-aura-rose">−{totalDropCost} retention</span>
            </div>
          </>
        ) : null}
        <Divider />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-4 py-1.5 font-display text-label text-aura-paper"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 aura-liquid-cta rounded-full px-5 py-1.5 font-display text-label"
          >
            Confirm reselect
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ReselectTally({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: FOCUS_CASE_LIMIT }).map((_, index) => {
          const filled = index < count;
          return (
            <span
              key={index}
              className={`block h-1.5 w-8 rounded-pill transition-colors duration-300 ${
                filled ? "bg-gradient-to-r from-aura-rose to-aura-fuchsia" : "bg-white/15"
              }`}
            />
          );
        })}
      </div>
      <p className="font-mono text-micro uppercase tracking-[0.24em] text-white/55">
        <span
          className={
            count === FOCUS_CASE_LIMIT
              ? "text-aura-rose"
              : count > 0
                ? "text-aura-paper"
                : "text-white/55"
          }
        >
          {count}
        </span>
        <span className="mx-1">/</span>
        {FOCUS_CASE_LIMIT} selected
      </p>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="h-5 w-px bg-white/15" />;
}

// Re-export the swap penalty so consumers can show the value next to drops
// without re-importing from focus-cases.
export { FOCUS_SWAP_RETENTION_PENALTY };
