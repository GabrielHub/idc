import { motion } from "motion/react";

import type { DateScenario } from "../domain/game";

const RISK_DOT_TONE = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-aura-rose",
} as const;

const RISK_TEXT_TONE = {
  low: "text-emerald-600",
  medium: "text-amber-700",
  high: "text-aura-rose",
} as const;

export type ScenarioCardProps = {
  scenario: DateScenario;
  state?: "default" | "selected" | "disabled" | "retired" | "open-slot";
  availableOnShift?: number | null;
  currentShift?: number;
  onClick?: () => void;
  layoutId?: string;
};

export function ScenarioCard({
  scenario,
  state = "default",
  availableOnShift,
  currentShift,
  onClick,
  layoutId,
}: ScenarioCardProps) {
  const baseClass =
    "relative flex flex-col gap-3 rounded-2xl border bg-aura-cream-soft px-4 py-3 text-left text-aura-ink transition";
  const stateClass = {
    default: "border-aura-hairline hover:border-aura-rose/40 hover:shadow-aura-soft cursor-pointer",
    selected: "border-aura-rose/60 ring-2 ring-aura-rose/30 shadow-aura-soft cursor-pointer",
    disabled: "border-aura-hairline opacity-60 cursor-not-allowed",
    retired: "border-aura-hairline bg-aura-cream/60 opacity-70 cursor-not-allowed",
    "open-slot":
      "border-dashed border-aura-rose/40 bg-aura-cream/40 text-aura-muted italic cursor-pointer",
  }[state];

  return (
    <motion.button
      layoutId={layoutId}
      type="button"
      onClick={state === "disabled" || state === "retired" ? undefined : onClick}
      disabled={state === "disabled" || state === "retired"}
      className={`${baseClass} ${stateClass}`}
      whileHover={
        state === "default" || state === "selected" || state === "open-slot" ? { y: -2 } : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-sm font-semibold tracking-tight">{scenario.title}</h3>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-micro font-mono uppercase tracking-[0.24em] ${RISK_TEXT_TONE[scenario.card.risk]}`}
          >
            {scenario.card.risk}
          </span>
          <div className="flex gap-1">
            <RiskDot tone={scenario.card.risk} title={`Risk: ${scenario.card.risk}`} />
            <RiskDot tone={scenario.card.intimacy} title={`Intimacy: ${scenario.card.intimacy}`} />
            <RiskDot tone={scenario.card.chaos} title={`Chaos: ${scenario.card.chaos}`} />
          </div>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-aura-muted">{scenario.card.summary}</p>
      {state === "retired" && availableOnShift !== null && availableOnShift !== undefined ? (
        <p className="text-micro font-mono uppercase tracking-[0.18em] text-aura-faint">
          retired: returns shift {availableOnShift}
          {currentShift !== undefined ? ` (in ${availableOnShift - currentShift})` : ""}
        </p>
      ) : null}
    </motion.button>
  );
}

function RiskDot({ tone, title }: { tone: "low" | "medium" | "high"; title: string }) {
  return (
    <span
      className={`inline-block size-2 rounded-full ${RISK_DOT_TONE[tone]}`}
      title={title}
      aria-label={title}
    />
  );
}
