import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

import { EASE_OUT_QUART } from "../dashboard-atoms";

export type ShiftSkipConfirmProps = {
  open: boolean;
  shiftNumber: number;
  isActionPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ShiftSkipConfirm({
  open,
  shiftNumber,
  isActionPending = false,
  onCancel,
  onConfirm,
}: ShiftSkipConfirmProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="shift-skip-confirm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
          className="fixed inset-0 z-[70] grid place-items-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Confirm filing shift ${shiftNumber} without a date`}
        >
          <button
            type="button"
            aria-label="Cancel filing shift"
            onClick={onCancel}
            className="absolute inset-0 cursor-pointer bg-aura-ink/55 backdrop-blur-sm"
          />

          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="aura-liquid-glass relative flex w-full max-w-[34rem] flex-col overflow-hidden rounded-card"
          >
            <header className="border-b border-white/10 px-6 py-5">
              <div className="font-mono text-sm uppercase tracking-[0.22em] text-aura-amber">
                // shift.skip
              </div>
              <h2 className="mt-1 font-display text-display-md font-semibold leading-tight text-aura-paper">
                File shift {shiftNumber} without a date?
              </h2>
            </header>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-white/75">
                This shift went empty. Filing closes it as-is and rolls the clock forward. No
                reruns.
              </p>
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isActionPending}
                className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-4 py-2 font-display text-sm text-aura-paper disabled:cursor-not-allowed disabled:opacity-55"
              >
                Keep planning
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isActionPending}
                className="aura-liquid-cta cursor-pointer rounded-full px-5 py-2 font-display text-sm disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isActionPending ? "Filing..." : "File anyway"}
              </button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
