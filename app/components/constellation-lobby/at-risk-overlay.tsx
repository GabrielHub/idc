import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

import type { Member } from "../../domain/game";
import { riskZoneForMember } from "../../services/member-feedback";
import { AuraButton } from "../aura-button";
import { EASE_OUT_QUART } from "../dashboard-atoms";

export type AtRiskOverlayProps = {
  open: boolean;
  members: readonly Member[];
  onClose: () => void;
};

/**
 * Click-through list behind the "cases at risk" callout. Reuses the lightweight
 * confirm-modal pattern (backdrop button + glass section) rather than inventing
 * a new dialog. Lists each at-risk member with their current confidence and the
 * recovery rationale from the shared risk-zone helper.
 */
export function AtRiskOverlay({ open, members, onClose }: AtRiskOverlayProps) {
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
      {open && members.length > 0 ? (
        <motion.div
          key="at-risk-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
          className="fixed inset-0 z-[70] grid place-items-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="Cases at risk"
        >
          <AuraButton
            tooltip="Close at-risk list"
            tooltipAlign="block"
            tooltipClassName="absolute inset-0"
            onClick={onClose}
            className="h-full w-full cursor-pointer bg-aura-ink/55 backdrop-blur-sm"
          />

          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="aura-liquid-glass relative flex w-full max-w-[34rem] flex-col overflow-hidden rounded-card"
          >
            <header className="border-b border-white/10 px-6 py-5">
              <div className="font-mono text-sm uppercase tracking-[0.22em] text-aura-rose">
                // cases.at-risk
              </div>
              <h2 className="mt-1 font-display text-display-md font-semibold leading-tight text-aura-paper">
                {members.length === 1
                  ? "1 case may quit the app"
                  : `${members.length} cases may quit the app`}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                Confidence has fallen into the at-risk band. Cover their lead ask and avoid focus
                swaps to pull them back before they leave.
              </p>
            </header>

            <ul className="flex flex-col divide-y divide-white/10 px-6 py-1">
              {members.map((member) => {
                const risk = riskZoneForMember(member);
                return (
                  <li key={member.id} className="flex items-start gap-3 py-3">
                    <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-pill bg-rose-500/15 px-2 py-0.5 font-mono text-sm tabular-nums text-rose-200 ring-1 ring-rose-300/30">
                      <span aria-hidden className="size-1 rounded-full bg-rose-300" />
                      {member.state.retention}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-label text-aura-paper">
                        {member.firstName}
                      </div>
                      <p className="mt-0.5 text-sm leading-snug text-white/70">{risk.rationale}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="flex items-center justify-end border-t border-white/10 px-6 py-4">
              <AuraButton
                tooltip="Close at-risk list"
                onClick={onClose}
                className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-4 py-2 font-display text-sm text-aura-paper"
              >
                Close
              </AuraButton>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
