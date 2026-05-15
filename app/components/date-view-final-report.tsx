import { motion } from "motion/react";
import { useRef } from "react";

import type {
  DateFinalReport,
  DateSession,
  FollowUpAction,
  GameSave,
  PlayerKnowledgeRecord,
} from "../domain/game";
import { useTutorialStep } from "../services/tutorial";
import { EASE_OUT_QUART, Eyebrow, Tooltip } from "./dashboard-atoms";
import { readKindLabel } from "./date-view-transcript";
import { TutorialCoachMark, TutorialSpotlight } from "./tutorial";

const FOLLOW_UP_LABELS: Record<FollowUpAction, string> = {
  encourage: "Encourage",
  cool_down: "Cool Down",
  repair: "Repair",
  mark_bad_fit: "Mark Bad Fit",
};

const FOLLOW_UP_PROJECTIONS: Record<FollowUpAction, string> = {
  encourage: "Tell Cupid to pursue the opening while the file is warm.",
  cool_down: "Give the pair room before the next booking.",
  repair: "Send a careful follow-up before rebooking pressure returns.",
  mark_bad_fit: "Close the romantic lane and keep the operational note.",
};

const FOLLOW_UP_ORDER: readonly FollowUpAction[] = [
  "encourage",
  "cool_down",
  "repair",
  "mark_bad_fit",
];

type EndSentimentBadge = { label: string; tone: string; dot: string };

const END_SENTIMENT_BADGES: Record<"positive" | "negative" | "natural", EndSentimentBadge> = {
  positive: {
    label: "positive end",
    tone: "bg-emerald-50/85 text-emerald-700 ring-1 ring-emerald-500/30",
    dot: "bg-aura-emerald",
  },
  negative: {
    label: "shut it down",
    tone: "bg-rose-50/85 text-aura-rose ring-1 ring-rose-500/30",
    dot: "bg-aura-rose",
  },
  natural: {
    label: "ran the clock",
    tone: "bg-violet-50/85 text-aura-violet ring-1 ring-violet-500/30",
    dot: "bg-aura-violet",
  },
};

function describeEndSentiment(session: DateSession): EndSentimentBadge {
  if (session.status === "completed") {
    if (session.endSentiment === "positive") {
      return END_SENTIMENT_BADGES.positive;
    }

    return END_SENTIMENT_BADGES.natural;
  }

  if (session.status === "ended_early") {
    return session.endSentiment === "positive"
      ? END_SENTIMENT_BADGES.positive
      : END_SENTIMENT_BADGES.negative;
  }

  return END_SENTIMENT_BADGES.natural;
}

export function FinalReportFooter({
  report,
  session,
  playerKnowledge,
  isActionPending,
  save,
  onTutorialUpdate,
  onFollowUp,
}: {
  report: DateFinalReport;
  session: DateSession;
  playerKnowledge: PlayerKnowledgeRecord[];
  isActionPending: boolean;
  save: GameSave;
  onTutorialUpdate: (next: GameSave) => void;
  onFollowUp: (action: FollowUpAction) => void;
}) {
  const sentimentBadge = describeEndSentiment(session);
  const revealedThisDate = playerKnowledge.filter((record) => record.dateSessionId === session.id);
  const filed = report.appliedFollowUp;
  const followUpSectionRef = useRef<HTMLElement | null>(null);
  const followUpStep = useTutorialStep(
    save,
    "date.followup",
    filed === undefined,
    onTutorialUpdate,
  );

  return (
    <motion.footer
      data-final-report-footer
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
      className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 lg:bottom-6 lg:px-8"
    >
      <div className="relative mx-auto w-full max-w-5xl">
        <div className="aura-glass-strong pointer-events-auto grid w-full gap-4 rounded-card px-4 py-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-5 lg:px-6 lg:py-5">
          <FinalReportSummarySection report={report} sentimentBadge={sentimentBadge} />
          <span aria-hidden className="hidden w-px self-stretch bg-aura-hairline/70 lg:block" />
          <FinalReportReadsSection reads={revealedThisDate} />
          <span aria-hidden className="hidden w-px self-stretch bg-aura-hairline/70 lg:block" />
          <FinalReportFollowUpSection
            recommended={report.recommendedFollowUp}
            filed={filed}
            isActionPending={isActionPending}
            sectionRef={followUpSectionRef}
            onFollowUp={(action) => {
              if (followUpStep.active) followUpStep.complete();
              onFollowUp(action);
            }}
          />
        </div>
      </div>

      {followUpStep.active ? (
        <>
          <TutorialSpotlight target={followUpSectionRef} />
          <TutorialCoachMark
            target={followUpSectionRef}
            placement="top"
            title="File one follow-up"
            body="Encourage if the file is warm. Cool Down if the room ran hot. Repair after a breach. Mark Bad Fit when the pair needs professional distance."
            dismissLabel="Skip tour"
            onDismiss={followUpStep.dismiss}
          />
        </>
      ) : null}
    </motion.footer>
  );
}

function FinalReportSummarySection({
  report,
  sentimentBadge,
}: {
  report: DateFinalReport;
  sentimentBadge: EndSentimentBadge;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow>// final report</Eyebrow>
        <span
          className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${sentimentBadge.tone}`}
        >
          <span aria-hidden className={`size-1.5 rounded-full ${sentimentBadge.dot}`} />
          {sentimentBadge.label}
        </span>
      </div>
      <p className="text-label leading-snug text-aura-ink">{report.summary}</p>
      <p className="text-label leading-snug text-aura-muted">{report.statSummary}</p>
    </section>
  );
}

function FinalReportReadsSection({ reads }: { reads: readonly PlayerKnowledgeRecord[] }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <Eyebrow>// filed reads</Eyebrow>
      {reads.length === 0 ? (
        <p className="text-label text-aura-muted">
          Cupid filed the exchange. Nothing new on this pair yet.
        </p>
      ) : (
        <ul className="flex max-h-32 flex-col gap-1.5 overflow-y-auto pr-1">
          {reads.map((read) => (
            <li
              key={read.id}
              className="rounded-chip bg-white/55 px-2.5 py-1.5 ring-1 ring-aura-hairline"
            >
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                {readKindLabel(read)}
              </p>
              <p className="mt-0.5 text-label leading-snug text-aura-ink/85">{read.readText}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FinalReportFollowUpSection({
  recommended,
  filed,
  isActionPending,
  sectionRef,
  onFollowUp,
}: {
  recommended: FollowUpAction;
  filed: FollowUpAction | undefined;
  isActionPending: boolean;
  sectionRef?: React.Ref<HTMLElement>;
  onFollowUp: (action: FollowUpAction) => void;
}) {
  return (
    <section ref={sectionRef} className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>// follow-up</Eyebrow>
        {filed === undefined ? (
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            Recommended: <span className="text-aura-rose">{FOLLOW_UP_LABELS[recommended]}</span>
          </span>
        ) : (
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Filed: {FOLLOW_UP_LABELS[filed]}
          </span>
        )}
      </div>
      {filed === undefined ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {FOLLOW_UP_ORDER.map((action) => (
            <FollowUpActionButton
              key={action}
              action={action}
              isRecommended={action === recommended}
              disabled={isActionPending}
              onSelect={() => onFollowUp(action)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FollowUpActionButton({
  action,
  isRecommended,
  disabled,
  onSelect,
}: {
  action: FollowUpAction;
  isRecommended: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const label = FOLLOW_UP_LABELS[action];
  const projection = FOLLOW_UP_PROJECTIONS[action];
  const baseClass =
    "relative flex h-full w-full cursor-pointer items-center justify-center gap-1.5 rounded-pill px-2.5 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-40";
  const toneClass = isRecommended
    ? "bg-gradient-to-r from-aura-rose/15 via-aura-fuchsia/12 to-aura-violet/15 text-aura-rose ring-1 ring-aura-rose/45 hover:ring-aura-rose/70 hover:shadow-cta"
    : "aura-glass text-aura-muted hover:text-aura-ink";

  return (
    <Tooltip message={projection} placement="top-center" className="w-full">
      <button
        type="button"
        data-sfx="click"
        disabled={disabled}
        onClick={onSelect}
        aria-label={`${label}. ${projection}`}
        className={`${baseClass} ${toneClass}`}
      >
        {isRecommended ? (
          <svg viewBox="0 0 12 12" className="size-3 text-aura-rose" aria-hidden>
            <path
              d="M6 1.4 L7.4 4.6 L10.8 5 L8.3 7.3 L8.9 10.6 L6 9 L3.1 10.6 L3.7 7.3 L1.2 5 L4.6 4.6 Z"
              fill="currentColor"
            />
          </svg>
        ) : null}
        <span>{label}</span>
      </button>
    </Tooltip>
  );
}
