import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { EASE_OUT_QUART } from "../dashboard-atoms";

type BriefStatus = "met" | "open" | "alert";

export type ShiftBriefRowData = {
  label: string;
  value: string;
  status: BriefStatus;
};

export function ShiftBriefDock({ rows }: { rows: readonly ShiftBriefRowData[] }) {
  const [expanded, setExpanded] = useState(false);

  const hasAlert = rows.some((row) => row.status === "alert");

  return (
    // Position lives on the wrapper because `aura-liquid-glass` declares
    // `position: relative` outside of a CSS layer — that wins the cascade
    // against Tailwind's layered `.absolute` utility, so applying both on the
    // same element collapses the dock into a full-width strip pinned to the
    // top of the canvas.
    <div className="pointer-events-none absolute bottom-6 right-6 z-30">
      <motion.div
        layout
        transition={{ layout: { duration: 0.34, ease: EASE_OUT_QUART } }}
        animate={{ borderRadius: expanded ? 18 : 9999 }}
        className={`pointer-events-auto overflow-hidden aura-liquid-glass aura-liquid-glass-hover ${
          expanded ? "aura-liquid-glass-rose w-[260px]" : "w-fit"
        }`}
      >
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse shift brief" : "Expand shift brief"}
          className={`flex w-full cursor-pointer items-center gap-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-paper ${
            expanded ? "px-4 pt-3 pb-2" : "px-4 py-2"
          }`}
        >
          {hasAlert && !expanded ? (
            <span className="h-1.5 w-1.5 rounded-full bg-aura-rose" aria-hidden />
          ) : null}
          <span className="flex-1 text-left text-white/55">shift brief</span>
          <ChevronGlyph open={expanded} />
        </button>
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="rows"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
              className="space-y-2 px-4 pb-3"
            >
              {rows.map((row) => (
                <BriefRow key={row.label} {...row} />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
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
