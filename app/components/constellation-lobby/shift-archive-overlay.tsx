/**
 * Glass overlay that surfaces the ShiftArchive when the user kicks off the
 * "File shift" flow from the constellation lobby's TopBar. Wraps the existing
 * ShiftArchive component so past-shift reports stay one click away during
 * file-shift planning. The standalone Files room used to anchor this surface;
 * after the fold, it lives on its own here.
 *
 * Escape / scrim click close. Mounting policy is controlled by the parent
 * (constellation lobby), which keys the overlay to the file-shift NavShard.
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

import type { Member, ShiftState } from "../../domain/game";
import { EASE_OUT_QUART } from "../dashboard-atoms";
import { ShiftArchive } from "../shift-archive";

export type ShiftArchiveOverlayProps = {
  open: boolean;
  shifts: readonly ShiftState[];
  members: readonly Member[];
  onClose: () => void;
};

export function ShiftArchiveOverlay({ open, shifts, members, onClose }: ShiftArchiveOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="shift-archive-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Shift archive"
        >
          <button
            type="button"
            aria-label="Close shift archive"
            onClick={onClose}
            className="absolute inset-0 cursor-pointer bg-aura-ink/55 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="absolute inset-x-6 inset-y-6 lg:inset-x-12 lg:inset-y-10 flex flex-col overflow-hidden rounded-card aura-liquid-glass"
          >
            <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
              <div>
                <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
                  // archive.shifts
                </div>
                <h2 className="font-display text-display-md font-semibold leading-tight tracking-tight text-aura-paper">
                  Shift reports
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-4 py-1.5 font-display text-label text-aura-paper"
                aria-label="Close shift archive"
              >
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto bg-aura-paper px-6 py-6 lg:px-10 lg:py-8">
              <ShiftArchive shifts={shifts.slice()} members={members.slice()} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
