import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";

import { AuraButton } from "../aura-button";
import { AuraTooltip } from "../aura-tooltip";
import { EASE_OUT_QUART } from "../dashboard-atoms";

export type ShiftBriefStatus = "met" | "open" | "alert";

type ShiftBriefGate = {
  value: string;
  status: ShiftBriefStatus;
};

export type ShiftBriefGoalItem = {
  id: string;
  title: string;
  description: string;
  progress: string;
  status: ShiftBriefStatus;
};

export type ShiftBriefData = {
  leadAsk: { kind: "queued"; memberName: string; text: string } | { kind: "empty" };
  goals: {
    summary: string;
    summaryStatus: ShiftBriefStatus;
    items: readonly ShiftBriefGoalItem[];
  };
  gates: {
    closure: ShiftBriefGate;
    followUp: ShiftBriefGate;
    fileShift: ShiftBriefGate;
  };
};

const LEAD_ASK_TOOLTIP =
  "The member request grading this shift. Cast a partner who fits the ask — ignoring it hurts member mood.";
const GOALS_TOOLTIP =
  "Cupid's shift-level targets. Meet enough goals to keep the campaign solvent.";
const STATUS_TOOLTIP =
  "Where this shift stands in the loop: pairs ready to close, follow-ups still due, and whether the shift can be filed.";
const CLOSURE_TOOLTIP =
  "Pairs that have crossed the closure threshold. File them to lock the match in and free a roster slot.";
const FOLLOW_UP_TOOLTIP =
  "Completed dates waiting on a follow-up call (Pursue, Pause, Close) before the shift can file.";
const FILE_SHIFT_TOOLTIP =
  "Submit this shift's outcomes and start the next one. Blocked while a date is unresolved.";

export function ShiftBriefDock({ data }: { data: ShiftBriefData }) {
  const [expanded, setExpanded] = useState(true);

  const hasAlert =
    data.goals.summaryStatus === "alert" ||
    data.gates.closure.status === "alert" ||
    data.gates.followUp.status === "alert" ||
    data.gates.fileShift.status !== "met";

  return (
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
      <AuraButton
        tooltip={expanded ? "Collapse shift brief" : "Expand shift brief"}
        tooltipAlign="block"
        tooltipClassName="block w-full"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-paper"
      >
        {hasAlert && !expanded ? (
          <span className="h-1.5 w-1.5 rounded-full bg-aura-rose" aria-hidden />
        ) : null}
        <span className="flex-1 text-left text-white/55">shift brief</span>
        <ChevronGlyph open={expanded} />
      </AuraButton>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="w-[340px] overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-4 pt-1 pb-4">
              <LeadAskSection leadAsk={data.leadAsk} />
              <SectionDivider />
              <GoalsSection goals={data.goals} />
              <SectionDivider />
              <StatusSection gates={data.gates} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionDivider() {
  return <div className="h-px bg-white/10" aria-hidden />;
}

function SectionEyebrow({
  label,
  tooltip,
  trailing,
}: {
  label: string;
  tooltip: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <BriefHint label={tooltip} className="items-center gap-1">
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
          {label}
        </span>
        <InfoGlyph />
      </BriefHint>
      {trailing === undefined ? null : <span className="ml-auto">{trailing}</span>}
    </div>
  );
}

function LeadAskSection({ leadAsk }: { leadAsk: ShiftBriefData["leadAsk"] }) {
  return (
    <section className="flex flex-col gap-2">
      <SectionEyebrow
        label="Lead ask"
        tooltip={LEAD_ASK_TOOLTIP}
        trailing={
          leadAsk.kind === "queued" ? (
            <span className="font-display text-label font-semibold tracking-tight text-aura-paper">
              {leadAsk.memberName}
            </span>
          ) : null
        }
      />
      {leadAsk.kind === "queued" ? (
        <p className="border-l-2 border-aura-rose/60 pl-3 text-label leading-snug text-aura-paper/95">
          {leadAsk.text}
        </p>
      ) : (
        <p className="text-label text-white/55">None queued</p>
      )}
    </section>
  );
}

function GoalsSection({ goals }: { goals: ShiftBriefData["goals"] }) {
  return (
    <section className="flex flex-col gap-2">
      <SectionEyebrow
        label="Goals"
        tooltip={GOALS_TOOLTIP}
        trailing={
          <span
            className={`font-mono text-micro font-semibold uppercase tracking-[0.18em] ${summaryColor(goals.summaryStatus)}`}
          >
            {goals.summary}
          </span>
        }
      />
      {goals.items.length === 0 ? (
        <p className="text-label text-white/55">None assigned</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {goals.items.map((item) => (
            <GoalRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function GoalRow({ item }: { item: ShiftBriefGoalItem }) {
  return (
    <li>
      <BriefHint label={item.description} className="w-full">
        <span className="flex w-full items-start gap-2.5">
          <StatusDot status={item.status} />
          <span className="min-w-0 flex-1 leading-snug">
            <span className={`block text-label font-semibold ${progressColor(item.status)}`}>
              {item.progress}
            </span>
            <span className="block text-micro text-white/55">{item.title}</span>
          </span>
        </span>
      </BriefHint>
    </li>
  );
}

function StatusSection({ gates }: { gates: ShiftBriefData["gates"] }) {
  return (
    <section className="flex flex-col gap-2">
      <SectionEyebrow label="Status" tooltip={STATUS_TOOLTIP} />
      <ul className="flex flex-col gap-1.5">
        <GateRow label="Closure" gate={gates.closure} tooltip={CLOSURE_TOOLTIP} />
        <GateRow label="Follow-up" gate={gates.followUp} tooltip={FOLLOW_UP_TOOLTIP} />
        <GateRow label="File shift" gate={gates.fileShift} tooltip={FILE_SHIFT_TOOLTIP} />
      </ul>
    </section>
  );
}

function GateRow({
  label,
  gate,
  tooltip,
}: {
  label: string;
  gate: ShiftBriefGate;
  tooltip: string;
}) {
  return (
    <li>
      <BriefHint label={tooltip} className="w-full">
        <span className="flex w-full items-center gap-2.5">
          <StatusDot status={gate.status} compact />
          <span className="text-label text-white/70">{label}</span>
          <span className={`ml-auto text-label font-semibold ${gateValueColor(gate.status)}`}>
            {gate.value}
          </span>
        </span>
      </BriefHint>
    </li>
  );
}

function StatusDot({ status, compact = false }: { status: ShiftBriefStatus; compact?: boolean }) {
  const tone =
    status === "met" ? "bg-aura-emerald" : status === "alert" ? "bg-aura-rose" : "bg-aura-amber";
  const margin = compact ? "" : "mt-1.5";
  return <span className={`${margin} size-2 shrink-0 rounded-full ${tone}`} aria-hidden />;
}

function summaryColor(status: ShiftBriefStatus): string {
  return status === "alert"
    ? "text-aura-rose"
    : status === "met"
      ? "text-aura-emerald"
      : "text-aura-amber";
}

function progressColor(status: ShiftBriefStatus): string {
  return status === "alert"
    ? "text-aura-rose"
    : status === "met"
      ? "text-aura-emerald"
      : "text-aura-paper";
}

function gateValueColor(status: ShiftBriefStatus): string {
  return status === "alert"
    ? "text-aura-rose"
    : status === "open"
      ? "text-aura-amber"
      : "text-aura-paper";
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

function InfoGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 14 14" fill="none" className="size-3 shrink-0 text-white/45">
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 6.25v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7" cy="4.4" r="0.7" fill="currentColor" />
    </svg>
  );
}

function BriefHint({
  label,
  children,
  className = "",
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AuraTooltip label={label} placement="right" className={`cursor-help ${className}`}>
      {children}
    </AuraTooltip>
  );
}
