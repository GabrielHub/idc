import { motion } from "motion/react";
import { useState } from "react";

import type { DateScenario } from "../domain/game";
import { scenarioBackdropPath } from "./scenario-backdrop";

export const RISK_DOT_TONE = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-aura-rose",
} as const;

export const RISK_TEXT_TONE = {
  low: "text-emerald-700",
  medium: "text-amber-700",
  high: "text-aura-rose",
} as const;

export const RISK_SHORT = {
  low: "LOW",
  medium: "MED",
  high: "HIGH",
} as const;

const AXIS_SHORT_LABEL = {
  risk: "Risk",
  intimacy: "Intim",
  chaos: "Chaos",
} as const;

const AXIS_FULL_LABEL = {
  risk: "Risk",
  intimacy: "Intimacy",
  chaos: "Chaos",
} as const;

export type ScenarioCardState = "default" | "selected" | "disabled" | "retired";
export type ScenarioCardSize = "tile" | "compact" | "full";

export type ScenarioCardProps = {
  scenario: DateScenario;
  state?: ScenarioCardState;
  size?: ScenarioCardSize;
  inHand?: boolean;
  availableOnShift?: number | null;
  currentShift?: number;
  onClick?: () => void;
  onExpand?: () => void;
  layoutId?: string;
};

export function ScenarioCard({
  scenario,
  state = "default",
  size = "full",
  inHand = false,
  availableOnShift,
  currentShift,
  onClick,
  onExpand,
  layoutId,
}: ScenarioCardProps) {
  const isRetired = state === "retired";
  const isDisabled = state === "disabled" || isRetired;
  const isSelected = state === "selected";
  const interactive = !isDisabled && onClick !== undefined;
  const isTile = size === "tile";
  const isCompact = size === "compact";

  const shellClass = [
    "scenario-card relative isolate flex w-full flex-col overflow-hidden text-left",
    "transition-[box-shadow,transform] duration-300 ease-out",
    isTile
      ? "aspect-[4/5] min-h-[140px] rounded-[12px]"
      : isCompact
        ? "min-h-[168px] rounded-[14px]"
        : "aspect-[4/5] min-h-[260px] rounded-[16px]",
    shellShadowClass(state, inHand, isTile),
    interactive ? "cursor-pointer" : isDisabled ? "cursor-not-allowed" : "cursor-default",
  ].join(" ");

  return (
    <motion.article
      layoutId={layoutId}
      whileHover={interactive ? { y: -3, rotate: -0.5 } : undefined}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className={shellClass}
    >
      <button
        type="button"
        onClick={interactive ? onClick : undefined}
        disabled={!interactive}
        aria-pressed={isSelected || undefined}
        aria-label={`${scenario.title} · ${scenario.card.risk} risk date plan`}
        data-sfx={interactive ? "click" : undefined}
        className="absolute inset-0 z-30 cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-100"
      >
        <span className="sr-only">Select {scenario.title}</span>
      </button>
      <CardArtLayer
        scenarioId={scenario.id}
        dimmed={isRetired || state === "disabled"}
        isTile={isTile}
      />
      <CardEdgeFrame
        selected={isSelected}
        inHand={inHand}
        radius={isTile ? "rounded-[12px]" : isCompact ? "rounded-[14px]" : "rounded-[16px]"}
      />

      <header
        className={`pointer-events-none relative z-40 flex items-start justify-between gap-1.5 ${
          isTile ? "px-2 pt-2" : isCompact ? "px-2.5 pt-2.5" : "px-3 pt-3"
        }`}
      >
        <RiskBadge risk={scenario.card.risk} isTile={isTile} />
        <div className="flex items-center justify-end gap-1.5">
          <CornerStatus selected={isSelected} inHand={inHand} isTile={isTile} />
          {onExpand !== undefined ? (
            <ScenarioExpandButton scenarioTitle={scenario.title} onExpand={onExpand} />
          ) : null}
        </div>
      </header>

      {isTile ? (
        <TileNamePlate title={scenario.title} />
      ) : isCompact ? (
        <CompactNamePlate scenario={scenario} />
      ) : (
        <FullNamePlate
          scenario={scenario}
          retiredFootnote={
            isRetired && availableOnShift !== null && availableOnShift !== undefined
              ? formatRetiredFootnote(availableOnShift, currentShift)
              : null
          }
        />
      )}
    </motion.article>
  );
}

function shellShadowClass(state: ScenarioCardState, inHand: boolean, isTile: boolean): string {
  if (state === "selected") {
    return "shadow-[0_30px_60px_-22px_rgba(244,63,94,0.5),0_0_0_2px_rgba(244,63,94,0.55),inset_0_1px_0_0_rgba(255,255,255,0.9)]";
  }
  if (state === "retired") {
    return "shadow-quiet opacity-65 saturate-[0.45]";
  }
  if (state === "disabled") {
    return "shadow-quiet opacity-55";
  }
  if (inHand) {
    return "shadow-[0_14px_36px_-18px_rgba(244,63,94,0.45),0_0_0_1.5px_rgba(244,63,94,0.4),inset_0_1px_0_0_rgba(255,255,255,0.9)] hover:shadow-[0_20px_46px_-16px_rgba(244,63,94,0.55),0_0_0_1.5px_rgba(244,63,94,0.55),inset_0_1px_0_0_rgba(255,255,255,0.95)]";
  }
  if (isTile) {
    return "shadow-[0_8px_22px_-14px_rgba(244,63,94,0.22),inset_0_1px_0_0_rgba(255,255,255,0.75)] hover:shadow-[0_14px_28px_-12px_rgba(244,63,94,0.3),inset_0_1px_0_0_rgba(255,255,255,0.85)]";
  }
  return "shadow-[0_18px_44px_-24px_rgba(244,63,94,0.32),inset_0_1px_0_0_rgba(255,255,255,0.8)] hover:shadow-[0_28px_56px_-22px_rgba(244,63,94,0.42),inset_0_1px_0_0_rgba(255,255,255,0.9)]";
}

function CardArtLayer({
  scenarioId,
  dimmed,
  isTile,
}: {
  scenarioId: string;
  dimmed: boolean;
  isTile: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {failed ? (
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(254,205,211,0.45)_0%,rgba(221,214,254,0.3)_48%,rgba(186,230,253,0.22)_100%)]"
        />
      ) : (
        <img
          src={scenarioBackdropPath(scenarioId)}
          alt=""
          decoding="async"
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className={`absolute inset-0 size-full scale-105 object-cover object-center saturate-[1.1] transition-opacity duration-500 ${
            isTile ? "blur-[1px]" : "blur-[2px]"
          } ${dimmed ? "opacity-25" : "opacity-45"}`}
        />
      )}
      <span aria-hidden className="absolute inset-0 bg-[rgba(255,253,249,0.42)]" />
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_72%,rgba(255,253,249,0.22)_100%)]"
      />
    </div>
  );
}

function CardEdgeFrame({
  selected,
  inHand,
  radius,
}: {
  selected: boolean;
  inHand: boolean;
  radius: string;
}) {
  const ringColor = selected
    ? "ring-aura-rose/35"
    : inHand
      ? "ring-aura-rose/30"
      : "ring-aura-hairline";
  return (
    <>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-10 ${radius} ring-1 ring-inset transition-colors duration-300 ${ringColor}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-3 top-0 z-10 h-px bg-gradient-to-r from-transparent to-transparent ${
          inHand || selected ? "via-aura-rose/55" : "via-white/75"
        }`}
      />
    </>
  );
}

function RiskBadge({ risk, isTile }: { risk: "low" | "medium" | "high"; isTile: boolean }) {
  return (
    <span
      className={`aura-glass-strong inline-flex items-center gap-1.5 rounded-full font-mono text-micro font-semibold uppercase tracking-[0.22em] ${
        RISK_TEXT_TONE[risk]
      } ${isTile ? "px-1.5 py-0.5" : "px-2 py-0.5"}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${RISK_DOT_TONE[risk]}`} />
      {RISK_SHORT[risk]}
    </span>
  );
}

function CornerStatus({
  selected,
  inHand,
  isTile,
}: {
  selected: boolean;
  inHand: boolean;
  isTile: boolean;
}) {
  if (selected) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-aura-rose font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-[0_8px_20px_-8px_rgba(244,63,94,0.6)] ${
          isTile ? "px-1.5 py-0.5" : "px-2 py-0.5"
        }`}
      >
        <span aria-hidden className="size-1 rounded-full bg-white" />
        picked
      </span>
    );
  }
  if (inHand) {
    return (
      <span
        className={`aura-glass-strong inline-flex items-center gap-1 rounded-full font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose ${
          isTile ? "px-1.5 py-0.5" : "px-2 py-0.5"
        }`}
      >
        <span aria-hidden className="size-1 rounded-full bg-aura-rose" />
        today
      </span>
    );
  }
  return null;
}

function ScenarioExpandButton({
  scenarioTitle,
  onExpand,
}: {
  scenarioTitle: string;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onExpand();
      }}
      aria-label={`Open ${scenarioTitle} details`}
      title="Open details"
      data-sfx="click"
      className="pointer-events-auto relative z-40 grid size-8 cursor-pointer place-items-center rounded-full bg-white/85 text-aura-muted shadow-quiet ring-1 ring-white/60 backdrop-blur-sm transition hover:bg-white hover:text-aura-rose"
    >
      <ScenarioExpandGlyph />
    </button>
  );
}

function ScenarioExpandGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
      <path
        d="M6 4H12V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TileNamePlate({ title }: { title: string }) {
  return (
    <div className="relative z-20 mt-auto px-2.5 pb-2.5 pt-1">
      <h3 className="pr-7 font-display text-[13px] font-semibold leading-[1.15] tracking-tight text-aura-ink line-clamp-2">
        {title}
      </h3>
    </div>
  );
}

function CompactNamePlate({ scenario }: { scenario: DateScenario }) {
  return (
    <div className="relative z-20 flex flex-1 flex-col gap-1 px-3 pb-3 pt-1">
      <p className="font-mono text-micro uppercase tracking-[0.2em] text-aura-muted line-clamp-1">
        {scenario.publicBrief.location}
      </p>
      <h3 className="font-display text-[15px] font-semibold leading-[1.15] tracking-tight text-aura-ink line-clamp-1">
        {scenario.title}
      </h3>
      <p className="text-xs leading-[1.4] text-aura-muted line-clamp-2">{scenario.card.summary}</p>
      <div className="mt-auto pt-1">
        <MeterRow card={scenario.card} />
      </div>
    </div>
  );
}

function FullNamePlate({
  scenario,
  retiredFootnote,
}: {
  scenario: DateScenario;
  retiredFootnote: string | null;
}) {
  return (
    <div className="relative z-20 flex flex-1 flex-col gap-1.5 px-3.5 pb-3.5 pt-1.5">
      <p className="font-mono text-micro uppercase tracking-[0.2em] text-aura-muted line-clamp-1">
        {scenario.publicBrief.location}
      </p>
      <h3 className="font-display text-[17px] font-semibold leading-[1.15] tracking-tight text-aura-ink line-clamp-2">
        {scenario.title}
      </h3>
      <p className="text-xs leading-[1.45] text-aura-muted line-clamp-3">{scenario.card.summary}</p>
      <div className="mt-auto">
        <MeterRow card={scenario.card} />
      </div>
      {retiredFootnote !== null ? (
        <p className="font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
          {retiredFootnote}
        </p>
      ) : null}
    </div>
  );
}

function MeterRow({
  card,
}: {
  card: {
    risk: "low" | "medium" | "high";
    intimacy: "low" | "medium" | "high";
    chaos: "low" | "medium" | "high";
  };
}) {
  const items = [
    { key: "risk" as const, tone: card.risk },
    { key: "intimacy" as const, tone: card.intimacy },
    { key: "chaos" as const, tone: card.chaos },
  ];
  return (
    <div className="flex items-stretch gap-1.5">
      {items.map((item) => (
        <span
          key={item.key}
          className="flex flex-1 flex-col items-center gap-1 rounded-[10px] border border-aura-hairline/70 bg-white/80 px-1.5 py-1.5 font-mono text-micro uppercase leading-none tracking-[0.14em] shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)]"
          title={`${AXIS_FULL_LABEL[item.key]}: ${RISK_SHORT[item.tone]}`}
        >
          <span className="text-aura-faint">{AXIS_SHORT_LABEL[item.key]}</span>
          <span
            className={`inline-flex items-center gap-1 font-semibold ${RISK_TEXT_TONE[item.tone]}`}
          >
            <span aria-hidden className={`size-1.5 rounded-full ${RISK_DOT_TONE[item.tone]}`} />
            {RISK_SHORT[item.tone]}
          </span>
        </span>
      ))}
    </div>
  );
}

function formatRetiredFootnote(availableOnShift: number, currentShift?: number): string {
  const base = `retired · returns shift ${availableOnShift}`;
  if (currentShift === undefined) return base;
  const lockedShiftsAfterCurrent = Math.max(0, availableOnShift - currentShift - 1);
  if (lockedShiftsAfterCurrent === 0) return `${base} · current only`;
  if (lockedShiftsAfterCurrent === 1) return `${base} · 1 locked`;
  return `${base} · ${lockedShiftsAfterCurrent} locked`;
}
