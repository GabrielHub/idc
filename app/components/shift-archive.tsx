import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

import { type Member, type ShiftState } from "../domain/game";
import {
  BudgetReviewBlock,
  DeckCoverageBlock,
  ShiftGoalResultsBlock,
  ShiftHrNoteBlock,
} from "./dashboard-views";
import { EASE_OUT_QUART, Eyebrow, pad2 } from "./dashboard-atoms";
import { formatNoteTimestamp } from "./notes-format";

export type ShiftArchiveProps = {
  shifts: ShiftState[];
  members: Member[];
};

export function selectArchivedShiftReports(shifts: readonly ShiftState[]): ShiftState[] {
  return shifts
    .filter((shift) => shift.status === "completed" && shift.report !== undefined)
    .sort((first, second) => {
      const firstAt = first.report?.completedAt ?? "";
      const secondAt = second.report?.completedAt ?? "";
      if (firstAt === secondAt) {
        return second.shiftNumber - first.shiftNumber;
      }
      return firstAt < secondAt ? 1 : -1;
    });
}

export function ShiftArchive({ shifts, members }: ShiftArchiveProps) {
  const archived = useMemo(() => selectArchivedShiftReports(shifts), [shifts]);

  if (archived.length === 0) {
    return <ShiftArchiveEmpty />;
  }

  return (
    <ul className="grid gap-6">
      <AnimatePresence initial={false}>
        {archived.map((shift, index) => (
          <ArchivedShiftCard key={shift.id} shift={shift} members={members} index={index} />
        ))}
      </AnimatePresence>
    </ul>
  );
}

function ArchivedShiftCard({
  shift,
  members,
  index,
}: {
  shift: ShiftState;
  members: Member[];
  index: number;
}) {
  const report = shift.report;
  if (report === undefined) {
    return null;
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.36, delay: Math.min(index, 6) * 0.04, ease: EASE_OUT_QUART }}
      className="list-none"
    >
      <article className="aura-liquid-glass relative overflow-hidden rounded-card">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-aura-violet via-aura-fuchsia to-aura-rose opacity-75"
        />
        <div className="relative z-10 flex flex-col gap-5 px-6 py-7 pl-9 lg:px-8 lg:pl-12">
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <div className="space-y-1">
              <Eyebrow>{`// shift.${pad2(shift.shiftNumber)} closed`}</Eyebrow>
              <h4 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-paper">
                Shift {pad2(shift.shiftNumber)} filed
              </h4>
            </div>
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-white/55">
              Closed {formatNoteTimestamp(report.completedAt)}
            </p>
          </header>

          <p className="text-lead leading-snug text-white/75">{report.summary}</p>

          <ShiftGoalResultsBlock tone="dark" results={report.goalResults} />

          {report.budgetReview === undefined ? null : (
            <BudgetReviewBlock tone="dark" review={report.budgetReview} />
          )}

          {report.deckCoverage.length === 0 ? null : (
            <DeckCoverageBlock tone="dark" coverage={report.deckCoverage} members={members} />
          )}

          {report.hrNote === undefined ? null : (
            <ShiftHrNoteBlock tone="dark" note={report.hrNote} />
          )}

          <footer className="mt-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-white/12 pt-4">
            <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <ArchiveStat label="dates filed" value={pad2(report.completedDates)} />
              <ArchiveStat label="ended early" value={pad2(report.earlyEndedDates)} />
            </ul>
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-white/70">
              ref · S-{pad2(shift.shiftNumber)}
            </p>
          </footer>
        </div>
      </article>
    </motion.li>
  );
}

function ArchiveStat({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="font-display text-display-sm font-semibold tracking-tight text-aura-paper">
        {value}
      </span>
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-white/55">
        {label}
      </span>
    </li>
  );
}

function ShiftArchiveEmpty() {
  return (
    <div className="aura-liquid-glass grid place-items-center rounded-card px-6 py-12 text-center">
      <div className="max-w-md space-y-3">
        <Eyebrow>// archive.empty</Eyebrow>
        <h4 className="font-display text-display-sm font-semibold tracking-tight text-aura-paper">
          No shifts on file yet
        </h4>
        <p className="text-label text-white/70">
          Cupid files a shift report once you close one. Run a shift, file it, then come back.
        </p>
      </div>
    </div>
  );
}
