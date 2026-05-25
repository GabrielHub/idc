import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { EASE_OUT_QUART } from "../dashboard-atoms";

type BriefStatus = "met" | "open" | "alert";

export type ShiftBriefRowData = {
  id: string;
  label: string;
  value: string;
  status: BriefStatus;
};

export function ShiftBriefDock({ rows }: { rows: readonly ShiftBriefRowData[] }) {
  const [expanded, setExpanded] = useState(false);

  const hasAlert = rows.some((row) => row.status === "alert");

  return (
    // The dock is slotted into BottomDock's flex row so it sits alongside the
    // Begin / Cancel CTAs at the bottom-right instead of stacking on top of
    // them. Positioning lives on the parent; this component only owns the
    // pill chrome and its expand/collapse animation.
    <motion.div
      layout
      initial={false}
      animate={{ borderRadius: expanded ? 18 : 9999 }}
      transition={{
        layout: { duration: 0.32, ease: EASE_OUT_QUART },
        borderRadius: { duration: 0.32, ease: EASE_OUT_QUART },
      }}
      className="pointer-events-auto w-fit overflow-hidden aura-liquid-glass aura-liquid-glass-hover"
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse goals" : "Expand goals"}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-paper"
      >
        {hasAlert && !expanded ? (
          <span className="h-1.5 w-1.5 rounded-full bg-aura-rose" aria-hidden />
        ) : null}
        <span className="flex-1 text-left text-white/55">goals</span>
        <ChevronGlyph open={expanded} />
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="rows"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="w-[260px] overflow-hidden"
          >
            <div className="space-y-2 px-4 pt-1 pb-3">
              {rows.map((row) => (
                <BriefRow key={row.id} {...row} />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function BriefRow({ label, value, status }: ShiftBriefRowData) {
  const dotClass =
    status === "met" ? "bg-aura-emerald" : status === "alert" ? "bg-aura-rose" : "bg-aura-amber";
  return (
    <div className="flex items-start gap-2 text-label">
      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <div className="leading-tight">
        <div className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
          {label}
        </div>
        <div className="text-aura-paper">{value}</div>
      </div>
    </div>
  );
}

function ChevronGlyph({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      fill="none"
      className={`size-3 shrink-0 text-aura-paper/75 transition ${open ? "" : "rotate-180"}`}
    >
      <path
        d="M3.5 5.5L7 9L10.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
