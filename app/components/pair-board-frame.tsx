import { motion } from "motion/react";
import { useId } from "react";

import type { Member } from "../domain/game";
import { pad2, Portrait } from "./dashboard-atoms";
import type { PairBoardGraph } from "./pair-board-layout";

export function PairBoardLegend({
  graph,
  shiftCount,
  minDegree,
  onMinDegreeChange,
}: {
  graph: PairBoardGraph;
  shiftCount: number;
  minDegree: number;
  onMinDegreeChange: (next: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-aura-hairline px-6 py-4 lg:px-8">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          // pair-board.network · shift {pad2(shiftCount)}
        </span>
        <h2 className="font-display text-display-md font-semibold leading-none tracking-tight text-aura-ink">
          Pair board
        </h2>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-2">
        <LegendStat label="nodes" value={graph.nodes.length} accent="rose" />
        <LegendStat label="filed" value={graph.meta.filedPairs} accent="fuchsia" />

        <DegreeFilter value={minDegree} onChange={onMinDegreeChange} />
      </div>
    </div>
  );
}

function LegendStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "rose" | "fuchsia";
}) {
  const dot = accent === "rose" ? "bg-aura-rose" : "bg-aura-fuchsia";
  return (
    <span className="inline-flex items-center gap-2 rounded-pill bg-white/55 px-3 py-1.5 ring-1 ring-aura-hairline">
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
        {label}
      </span>
      <span className="font-mono text-micro font-semibold tabular-nums text-aura-ink">
        {pad2(value)}
      </span>
    </span>
  );
}

function DegreeFilter({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const options: { id: number; label: string; hint: string }[] = [
    { id: 1, label: "all", hint: "Show every paired member" },
    { id: 2, label: "≥2", hint: "Members in at least two pairs" },
    { id: 3, label: "hubs", hint: "Members in three or more pairs" },
  ];
  return (
    <div className="inline-flex items-center gap-2 rounded-pill bg-white/55 p-1 ring-1 ring-aura-hairline">
      <span className="px-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        connections
      </span>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            data-sfx="click"
            aria-pressed={active}
            title={option.hint}
            onClick={() => onChange(option.id)}
            className={`cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
              active ? "bg-aura-ink text-white shadow-quiet" : "text-aura-muted hover:text-aura-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function PairBoardBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(244,63,94,0.06)_0%,rgba(244,63,94,0)_55%),radial-gradient(circle_at_75%_70%,rgba(217,70,239,0.05)_0%,rgba(217,70,239,0)_60%),radial-gradient(circle_at_22%_72%,rgba(167,139,250,0.05)_0%,rgba(167,139,250,0)_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_calc(100%-1px),rgba(15,23,42,0.04)_0),linear-gradient(90deg,transparent_calc(100%-1px),rgba(15,23,42,0.035)_0)] bg-[length:32px_32px] opacity-70" />
      <FieldRingsOverlay />
      {reduceMotion ? null : <RadarSweep />}
    </div>
  );
}

function FieldRingsOverlay() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full opacity-60"
    >
      {[14, 28, 40].map((radius) => (
        <circle
          key={radius}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(15, 23, 42, 0.06)"
          strokeWidth="0.18"
          strokeDasharray="0.6 1.2"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <circle
        cx="50"
        cy="50"
        r="0.6"
        fill="rgba(244, 63, 94, 0.45)"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function RadarSweep() {
  return (
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 size-[180%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.10)_0%,rgba(244,63,94,0)_45%)]"
      animate={{ scale: [0.6, 1.1, 0.6], opacity: [0, 0.6, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function PairBoardEmpty() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="aura-glass-strong relative max-w-md space-y-3 rounded-card px-6 py-7 text-center ring-1 ring-aura-hairline">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          // pair-board · empty
        </p>
        <h3 className="font-display text-display-sm font-semibold leading-tight text-aura-ink">
          No pair connections filed yet.
        </h3>
        <p className="text-body leading-relaxed text-aura-muted">
          Cupid files a pair note when a date wraps. The board fills in as connections form.
        </p>
      </div>
    </div>
  );
}

export function PairBoardOffField({ isolated }: { isolated: Member[] }) {
  if (isolated.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-aura-hairline px-6 py-3 lg:px-8">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        off the board · {pad2(isolated.length)}
      </span>
      <ul className="flex flex-wrap items-center gap-1.5">
        {isolated.slice(0, 12).map((member) => (
          <li
            key={member.id}
            className="inline-flex items-center gap-1.5 rounded-pill bg-white/55 px-2 py-1 ring-1 ring-aura-hairline"
            title={`${member.firstName} is not shown on the current board`}
          >
            <span aria-hidden className="rounded-full border border-white bg-white">
              <Portrait member={member} variant="thumb" />
            </span>
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
              {member.firstName}
            </span>
          </li>
        ))}
        {isolated.length > 12 ? (
          <li className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
            +{isolated.length - 12} more
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function PairBoardKeyboardMirror({
  graph,
  memberById,
  onSelectEdge,
  onSelectNode,
}: {
  graph: PairBoardGraph;
  memberById: Map<string, Member>;
  onSelectEdge: (pairId: string) => void;
  onSelectNode: (memberId: string) => void;
}) {
  const id = useId();
  return (
    <div className="sr-only" aria-label="Pair board keyboard list">
      <h3 id={`${id}-nodes`}>Members</h3>
      <ul aria-labelledby={`${id}-nodes`}>
        {graph.nodes.map((node) => (
          <li key={node.member.id}>
            <button type="button" onClick={() => onSelectNode(node.member.id)}>
              {node.member.firstName}, {node.degree}{" "}
              {node.degree === 1 ? "pair filed" : "pairs filed"}
            </button>
          </li>
        ))}
      </ul>
      <h3 id={`${id}-edges`}>Pair connections</h3>
      <ul aria-labelledby={`${id}-edges`}>
        {graph.edges.map((edge) => {
          const a = memberById.get(edge.a)?.firstName ?? edge.a;
          const b = memberById.get(edge.b)?.firstName ?? edge.b;
          return (
            <li key={edge.pairId}>
              <button type="button" onClick={() => onSelectEdge(edge.pairId)}>
                {a} and {b}, {edge.noteCount} notes filed
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
