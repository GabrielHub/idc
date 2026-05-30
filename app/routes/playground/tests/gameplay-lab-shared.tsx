import { motion } from "motion/react";
import type { ReactNode } from "react";

import { EASE_OUT_QUART, MutedLabel, scoreWidthClass } from "../../../components/dashboard-atoms";

export const LAB_NOW = "2026-05-23T18:00:00.000Z";

export function LabEntrance({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function LabPanel({
  label,
  title,
  children,
  className = "",
}: {
  label: string;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`aura-glass rounded-card p-5 ${className}`}>
      <MutedLabel>{label}</MutedLabel>
      {title === undefined ? null : (
        <h3 className="mt-2 font-display text-xl font-semibold leading-tight tracking-tight text-aura-ink">
          {title}
        </h3>
      )}
      <div className={title === undefined ? "mt-3" : "mt-4"}>{children}</div>
    </section>
  );
}

export function MetricPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "ink";
}) {
  const toneClass = {
    neutral: "bg-white/65 text-aura-muted ring-aura-hairline",
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    warn: "bg-amber-50 text-amber-700 ring-amber-200/70",
    bad: "bg-rose-50 text-aura-rose ring-rose-200/70",
    ink: "bg-aura-ink text-white ring-aura-ink",
  }[tone];

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-2 rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] ring-1 ${toneClass}`}
    >
      <span className={tone === "ink" ? "text-white/55" : "text-aura-faint"}>{label}</span>
      <span>{value}</span>
    </span>
  );
}

export function LabButton<TValue extends string>({
  label,
  value,
  activeValue,
  onSelect,
}: {
  label: string;
  value: TValue;
  activeValue: TValue;
  onSelect: (value: TValue) => void;
}) {
  const active = value === activeValue;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(value)}
      className={`cursor-pointer rounded-pill px-3.5 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
        active
          ? "bg-aura-ink text-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.7)]"
          : "bg-white/65 text-aura-muted ring-1 ring-aura-hairline hover:text-aura-ink"
      }`}
    >
      {label}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card border border-dashed border-aura-hairline bg-white/45 px-4 py-3 text-sm leading-relaxed text-aura-muted">
      {children}
    </p>
  );
}

export function StatBar({ label, value }: { label: string; value: number }) {
  const bounded = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          {label}
        </span>
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink tabular-nums">
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-white/60 ring-1 ring-aura-hairline">
        <div className={`h-full rounded-pill bg-aura-rose ${scoreWidthClass(bounded)}`} />
      </div>
    </div>
  );
}

export function DeltaValue({ value }: { value: number }) {
  const tone = value > 0 ? "text-emerald-700" : value < 0 ? "text-aura-rose" : "text-aura-muted";
  const prefix = value > 0 ? "+" : "";

  return <span className={`font-mono tabular-nums ${tone}`}>{`${prefix}${value}`}</span>;
}

export function toneForDelta(delta: number): "good" | "warn" | "bad" | "neutral" {
  if (delta > 3) return "good";
  if (delta < -3) return "bad";
  if (delta !== 0) return "warn";
  return "neutral";
}
