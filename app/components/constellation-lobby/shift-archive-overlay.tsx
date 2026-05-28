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
import { useEffect, useMemo } from "react";

import type { Member, ShiftState } from "../../domain/game";
import { AmbientMesh } from "../ambient-mesh";
import { AuraButton } from "../aura-button";
import { EASE_OUT_QUART, pad2 } from "../dashboard-atoms";
import { selectArchivedShiftReports, ShiftArchive } from "../shift-archive";

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

  const archivedCount = useMemo(() => selectArchivedShiftReports(shifts).length, [shifts]);

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
          <AuraButton
            tooltip="Close shift archive"
            tooltipAlign="block"
            tooltipClassName="absolute inset-0"
            onClick={onClose}
            className="h-full w-full cursor-pointer bg-[#07041a]/65 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="absolute inset-x-6 inset-y-6 isolate flex flex-col overflow-hidden rounded-card bg-[#07041a] text-aura-paper lg:inset-x-12 lg:inset-y-10"
          >
            <AmbientMesh containment="absolute" />

            <AuraButton
              tooltip="Close shift archive"
              tooltipPlacement="left"
              tooltipClassName="absolute right-5 top-5 z-20"
              onClick={onClose}
              className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-4 py-1.5 font-display text-label text-aura-paper"
            >
              Close
            </AuraButton>

            <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-16 pt-14 lg:px-12 lg:pt-16">
              <header className="mx-auto max-w-[88rem] text-center">
                <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
                  // archive.shifts
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-aura-paper lg:text-display-md">
                  Shift reports
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-body text-white/70">
                  Cupid files a shift report each time you close one. Skim the receipts to see how
                  prior shifts wrapped before opening the next one.
                </p>
                <p className="mt-3 font-mono text-micro uppercase tracking-[0.28em] text-white/45">
                  {pad2(archivedCount)} on file
                </p>
              </header>

              <div className="mx-auto mt-10 max-w-[88rem]">
                <ShiftArchive shifts={shifts.slice()} members={members.slice()} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
