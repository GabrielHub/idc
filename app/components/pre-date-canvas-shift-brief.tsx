import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import type { CompanyGoal, Member, MemberRequest } from "../domain/game";
import { fallbackGoalProgress, type GoalProgressSnapshot } from "../services/date-engine";

export function ShiftBriefDock({
  goals,
  progressByGoalId,
  activeFocus,
  activeFocusRequest,
  shiftClosed,
}: {
  goals: readonly CompanyGoal[];
  progressByGoalId: ReadonlyMap<string, GoalProgressSnapshot>;
  activeFocus: Member | null;
  activeFocusRequest: MemberRequest | undefined;
  shiftClosed: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (goals.length === 0 && activeFocusRequest === undefined) {
    return null;
  }

  const metGoalCount = goals.filter(
    (goal) => (progressByGoalId.get(goal.id) ?? fallbackGoalProgress(goal)).status === "met",
  ).length;
  const goalSummary = goals.length === 0 ? "case ask" : `${metGoalCount} / ${goals.length} clear`;
  const requestSummary =
    activeFocus === null
      ? "No focus case"
      : activeFocusRequest === undefined
        ? `${activeFocus.firstName} has no active ask on file.`
        : activeFocusRequest.text;

  return (
    <div className="mt-5 flex justify-end xl:fixed xl:right-6 xl:top-20 xl:z-40 xl:mt-0 xl:block xl:w-96">
      <motion.aside
        className="aura-glass w-full max-w-[34rem] overflow-hidden rounded-card shadow-aura-soft xl:max-w-none"
        aria-label="Shift brief"
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            data-sfx="menu"
            aria-expanded={isOpen}
            aria-controls="shift-brief-dock-body"
            onClick={() => setIsOpen((current) => !current)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-pill px-2 py-1.5 text-left transition hover:bg-white/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/45"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-aura-rose/10 text-aura-rose">
              <ShiftBriefGlyph />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-rose">
                // goals
              </span>
              <span className="mt-0.5 flex min-w-0 items-baseline gap-2">
                <span className="truncate font-display text-sm font-semibold tracking-tight text-aura-ink">
                  Shift brief
                </span>
                <span className="shrink-0 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint">
                  {goalSummary}
                </span>
              </span>
            </span>
          </button>

          <ShiftBriefIconButton
            label={isOpen ? "Collapse shift brief" : "Expand shift brief"}
            onClick={() => setIsOpen((current) => !current)}
          >
            <BriefChevronIcon open={isOpen} />
          </ShiftBriefIconButton>
        </div>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              id="shift-brief-dock-body"
              key="shift-brief-dock-body"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="border-t border-aura-hairline px-4 pb-4 pt-3">
                {goals.length > 0 ? (
                  <ul className="space-y-2.5">
                    {goals.map((goal) => (
                      <ShiftGoalItem
                        key={goal.id}
                        goal={goal}
                        progress={progressByGoalId.get(goal.id) ?? fallbackGoalProgress(goal)}
                      />
                    ))}
                  </ul>
                ) : null}

                <div
                  className={
                    goals.length > 0 ? "mt-3 border-t border-aura-hairline pt-3" : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
                      case ask
                    </p>
                    {shiftClosed ? (
                      <span className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint">
                        filed
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-normal break-words text-label leading-snug text-aura-ink">
                    {requestSummary}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}

function ShiftGoalItem({ goal, progress }: { goal: CompanyGoal; progress: GoalProgressSnapshot }) {
  const showStatus = progress.status !== "open";

  return (
    <li className="min-w-0 rounded-chip px-2 py-1.5" title={goal.description}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          {progress.label}
        </span>
        {showStatus ? (
          <span
            className={`shrink-0 rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] ${goalStatusClass(
              progress.status,
            )}`}
          >
            {progress.status}
          </span>
        ) : null}
      </div>
      <p className="mt-1 whitespace-normal break-words text-sm font-semibold leading-snug text-aura-ink">
        {goal.title}
      </p>
    </li>
  );
}

function goalStatusClass(status: GoalProgressSnapshot["status"]): string {
  if (status === "met") {
    return "bg-aura-emerald/10 text-aura-emerald";
  }

  if (status === "missed") {
    return "bg-aura-rose/10 text-aura-rose";
  }

  return "bg-white/70 text-aura-muted";
}

function ShiftBriefIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-sfx="click"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:bg-white/55 hover:text-aura-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/45"
    >
      {children}
    </button>
  );
}

function ShiftBriefGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4">
      <path
        d="M4 4.5H12M4 8H10M4 11.5H11"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function BriefChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`size-4 transition ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4 6.5L8 10.5L12 6.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}
