import { motion } from "motion/react";

import {
  type Member,
  type ShiftReport,
  type ShiftRequestAskOutcome,
  type ShiftState,
} from "../domain/game";
import { buildShiftAskDeskEntries } from "../services/shift-request-assessment";
import { EASE_OUT_QUART, Eyebrow, LiveDot, pad2, PrimaryButton } from "./dashboard-atoms";

/* ================================================================== */
/* Shift report overlay                                               */
/* ================================================================== */

export function ShiftReportPanel({
  shift,
  members,
  isActionPending,
  onOpenNextShift,
}: {
  shift: ShiftState;
  members: Member[];
  isActionPending: boolean;
  onOpenNextShift: () => void;
}) {
  const report = shift.report;
  if (shift.status !== "completed" || report === undefined) {
    return null;
  }

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/60 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_QUART }}
        className="aura-glass-strong mx-6 w-full max-w-4xl rounded-card p-10"
      >
        <Eyebrow>{`// shift.${pad2(shift.shiftNumber)} closed`}</Eyebrow>
        <h2 className="mt-3 font-display text-display-lg font-semibold tracking-tight text-aura-ink">
          Shift filed
        </h2>
        <p className="mt-3 text-lead text-aura-muted">{report.summary}</p>

        <ShiftGoalResultsBlock results={report.goalResults} className="mt-8" />

        {report.budgetReview === undefined ? null : (
          <BudgetReviewBlock review={report.budgetReview} className="mt-8" />
        )}

        <ShiftAskDeskBlock shift={shift} members={members} className="mt-8" />

        {report.deckCoverage.length === 0 ? null : (
          <DeckCoverageBlock coverage={report.deckCoverage} members={members} className="mt-4" />
        )}

        {report.hrNote === undefined ? null : (
          <ShiftHrNoteBlock note={report.hrNote} className="mt-8" />
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-label text-aura-muted">
            {members.length} members on file. Cupid keeps the receipts.
          </p>
          <PrimaryButton disabled={isActionPending} onClick={onOpenNextShift}>
            Open next shift
          </PrimaryButton>
        </div>
      </motion.div>
    </motion.aside>
  );
}

function ShiftAskDeskBlock({
  shift,
  members,
  className = "",
}: {
  shift: ShiftState;
  members: Member[];
  className?: string;
}) {
  const entries = buildShiftAskDeskEntries({ shift, members });
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={`aura-glass rounded-card p-5 ${className}`.trim()}>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        // ask desk
      </p>
      <ul className="mt-3 space-y-3">
        {entries.map((entry) => (
          <li key={entry.requestId} className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-display text-sm font-semibold tracking-tight text-aura-ink">
                {entry.memberName}
              </span>
              <span
                className={`font-mono text-micro font-semibold uppercase tracking-[0.18em] ${SHIFT_ASK_OUTCOME_CLASS[entry.outcome]}`}
              >
                {entry.bucketLabel} · {entry.outcomeLabel}
              </span>
            </div>
            <p className="mt-1 text-sm leading-snug text-aura-muted">{entry.requestText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SHIFT_ASK_OUTCOME_CLASS: Record<ShiftRequestAskOutcome, string> = {
  covered: "text-emerald-700",
  raised: "text-aura-amber",
  missed: "text-aura-amber",
  ignored: "text-aura-faint",
};

export type ShiftReportBlockTone = "light" | "dark";

type ShiftBlockToneTokens = {
  surface: string;
  eyebrow: string;
  label: string;
  body: string;
  divider: string;
  metricFaint: string;
  metricPositive: string;
};

const SHIFT_BLOCK_TONE: Record<ShiftReportBlockTone, ShiftBlockToneTokens> = {
  light: {
    surface: "aura-glass",
    eyebrow: "text-aura-faint",
    label: "text-aura-faint",
    body: "text-aura-ink",
    divider: "border-aura-hairline",
    metricFaint: "text-aura-faint",
    metricPositive: "text-emerald-700",
  },
  dark: {
    surface: "aura-liquid-glass",
    eyebrow: "text-white/55",
    label: "text-white/65",
    body: "text-aura-paper",
    divider: "border-white/12",
    metricFaint: "text-white/55",
    metricPositive: "text-emerald-300",
  },
};

export function ShiftGoalResultsBlock({
  results,
  className = "",
  tone = "light",
}: {
  results: ShiftReport["goalResults"];
  className?: string;
  tone?: ShiftReportBlockTone;
}) {
  if (results.length === 0) {
    return null;
  }
  const tokens = SHIFT_BLOCK_TONE[tone];
  return (
    <ul className={`space-y-3 ${className}`.trim()}>
      {results.map((result) => (
        <li key={result.goalId} className="flex items-baseline justify-between gap-4">
          <span className={`font-mono text-label uppercase tracking-[0.18em] ${tokens.label}`}>
            {result.summary}
          </span>
          <span
            className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${
              result.status === "met" ? tokens.metricPositive : "text-aura-rose"
            }`}
          >
            {result.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ShiftHrNoteBlock({
  note,
  className = "",
  tone = "light",
}: {
  note: string;
  className?: string;
  tone?: ShiftReportBlockTone;
}) {
  const tokens = SHIFT_BLOCK_TONE[tone];
  const surface =
    tone === "dark"
      ? "aura-liquid-glass rounded-card p-5"
      : "rounded-card border border-aura-hairline bg-white/45 p-5";
  return (
    <div className={`${surface} ${className}`.trim()}>
      <p
        className={`font-mono text-micro font-semibold uppercase tracking-[0.24em] ${tokens.eyebrow}`}
      >
        // hr.note
      </p>
      <p className={`mt-2 text-body ${tokens.body}`}>{note}</p>
    </div>
  );
}

export function BudgetReviewBlock({
  review,
  className = "",
  tone = "light",
}: {
  review: NonNullable<ShiftReport["budgetReview"]>;
  className?: string;
  tone?: ShiftReportBlockTone;
}) {
  const tokens = SHIFT_BLOCK_TONE[tone];
  const direction =
    review.newCap > review.previousCap
      ? { tone: tokens.metricPositive, arrow: "▲" }
      : review.newCap < review.previousCap
        ? { tone: "text-aura-rose", arrow: "▼" }
        : { tone: tokens.metricFaint, arrow: "·" };
  const sortedReasons = [...review.reasons].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return (
    <div className={`${tokens.surface} rounded-card p-5 ${className}`.trim()}>
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={`font-mono text-micro font-semibold uppercase tracking-[0.24em] ${tokens.eyebrow}`}
        >
          // performance review
        </p>
        <p
          className={`font-mono text-micro font-semibold uppercase tracking-[0.18em] ${direction.tone}`}
        >
          {direction.arrow} new cap {review.newCap} (was {review.previousCap})
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {sortedReasons.map((reason, index) => (
          <li
            key={`${reason.kind}-${index}`}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className={tokens.body}>{reason.label}</span>
            <span
              className={`font-mono text-micro font-semibold uppercase tracking-[0.18em] ${
                reason.delta > 0
                  ? tokens.metricPositive
                  : reason.delta < 0
                    ? "text-aura-rose"
                    : tokens.metricFaint
              }`}
            >
              {reason.delta > 0 ? `+${reason.delta}` : `${reason.delta}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeckCoverageBlock({
  coverage,
  members,
  className = "",
  tone = "light",
}: {
  coverage: ShiftReport["deckCoverage"];
  members: Member[];
  className?: string;
  tone?: ShiftReportBlockTone;
}) {
  const tokens = SHIFT_BLOCK_TONE[tone];
  const memberById = new Map(members.map((member) => [member.id, member] as const));
  return (
    <div className={`${tokens.surface} rounded-card p-5 ${className}`.trim()}>
      <p
        className={`font-mono text-micro font-semibold uppercase tracking-[0.24em] ${tokens.eyebrow}`}
      >
        // deck coverage
      </p>
      <ul className="mt-3 space-y-2">
        {coverage.map((entry) => {
          const member = memberById.get(entry.focusMemberId);
          const statusTone =
            entry.status === "served"
              ? tokens.metricPositive
              : entry.status === "missed"
                ? "text-aura-rose"
                : tokens.metricFaint;
          return (
            <li
              key={entry.focusMemberId}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className={tokens.body}>{member?.firstName ?? entry.focusMemberId}</span>
              <span className={`font-mono text-micro uppercase tracking-[0.18em] ${statusTone}`}>
                {entry.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ================================================================== */
/* Loading                                                            */
/* ================================================================== */

export function DashboardLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-aura-bg text-aura-ink">
      <div className="flex flex-col items-center gap-3">
        <LiveDot />
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          Cupid Operations
        </p>
        <p className="text-body text-aura-muted">Reaching across timelines. One moment.</p>
      </div>
    </div>
  );
}
