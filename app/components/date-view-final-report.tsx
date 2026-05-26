import { motion } from "motion/react";
import { useRef } from "react";

import type {
  DateFinalReport,
  DateSession,
  FollowUpAction,
  GameSave,
  PlayerKnowledgeRecord,
} from "../domain/game";
import {
  buildDateImpactReceipt,
  type DateImpactReceipt,
  type DateImpactVerdict,
} from "../services/date-impact";
import { useTutorialStep } from "../services/tutorial";
import { EASE_OUT_QUART, Eyebrow } from "./dashboard-atoms";
import { readKindLabel } from "./date-view-transcript";
import { TutorialCoachMark, TutorialSpotlight } from "./tutorial";

const FOLLOW_UP_LABELS: Record<FollowUpAction, string> = {
  pursue: "Pursue",
  cool_down: "Cool Down",
  close: "Close",
};

type FollowUpCopy = {
  headline: string;
  detail: string;
  flag?: string;
};

const FOLLOW_UP_COPY: Record<FollowUpAction, FollowUpCopy> = {
  pursue: {
    headline: "Lock in a follow-up booking with this partner.",
    detail:
      "Cupid lets this pair skip the cooldown on the next shift, so you can rebook them while the file is still warm.",
  },
  cool_down: {
    headline: "Pause this pair without closing the lane.",
    detail:
      "They return to the normal rotation. Cooldown applies, and Cupid stops nudging toward a follow-up booking.",
  },
  close: {
    headline: "Close the romantic lane between this pair.",
    detail:
      "Active agreements retire and open loops drop. Cupid stops surfacing them as a match in future shifts.",
    flag: "permanent",
  },
};

const FOLLOW_UP_ORDER: readonly FollowUpAction[] = ["pursue", "cool_down", "close"];

const IMPACT_TONE: Record<DateImpactVerdict, { pill: string; dot: string }> = {
  ready_to_close: {
    pill: "bg-emerald-50/90 text-emerald-700 ring-1 ring-emerald-500/35",
    dot: "bg-aura-emerald",
  },
  closer_to_win: {
    pill: "bg-emerald-50/85 text-emerald-700 ring-1 ring-emerald-500/30",
    dot: "bg-aura-emerald",
  },
  no_real_progress: {
    pill: "bg-white/70 text-aura-muted ring-1 ring-aura-hairline",
    dot: "bg-aura-faint",
  },
  closer_to_loss: {
    pill: "bg-amber-50/85 text-aura-amber ring-1 ring-amber-500/30",
    dot: "bg-aura-amber",
  },
  bad_fit: {
    pill: "bg-rose-50/85 text-aura-rose ring-1 ring-rose-500/30",
    dot: "bg-aura-rose",
  },
};

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
  onBack,
}: {
  report: DateFinalReport;
  session: DateSession;
  playerKnowledge: PlayerKnowledgeRecord[];
  isActionPending: boolean;
  save: GameSave;
  onTutorialUpdate: (next: GameSave) => void;
  onFollowUp: (action: FollowUpAction) => void;
  onBack: () => void;
}) {
  const sentimentBadge = describeEndSentiment(session);
  const revealedThisDate = playerKnowledge.filter((record) => record.dateSessionId === session.id);
  const filed = report.appliedFollowUp;
  const actionColumnRef = useRef<HTMLElement | null>(null);
  const impact = buildDateImpactReceipt({
    report,
    session,
    save,
    filedReadCount: revealedThisDate.length,
  });
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
      <div className="relative mx-auto w-full max-w-3xl">
        <div className="aura-liquid-glass pointer-events-auto flex w-full flex-col gap-4 rounded-card px-5 py-5 text-aura-ink lg:gap-5 lg:px-7 lg:py-6">
          <FinalReportHeaderRow sentimentBadge={sentimentBadge} />
          <FinalReportImpactSection impact={impact} report={report} />
          {revealedThisDate.length === 0 ? null : <FinalReportReadsRow reads={revealedThisDate} />}
          <FinalReportActionColumn
            sectionRef={actionColumnRef}
            recommended={report.recommendedFollowUp}
            filed={filed}
            isActionPending={isActionPending}
            onFollowUp={(action) => {
              if (followUpStep.active) followUpStep.complete();
              onFollowUp(action);
            }}
            onBack={onBack}
          />
        </div>
      </div>

      {followUpStep.active ? (
        <>
          <TutorialSpotlight target={actionColumnRef} />
          <TutorialCoachMark
            target={actionColumnRef}
            placement="top"
            title="File one follow-up"
            body="Pursue keeps this pair warm and bypasses their next-shift cooldown. Cool Down pauses without closing the lane. Close retires the romantic lane permanently. Pick one to close the shift."
            dismissLabel="Skip tour"
            onDismiss={followUpStep.dismiss}
            textTone="dark"
          />
        </>
      ) : null}
    </motion.footer>
  );
}

function FinalReportHeaderRow({ sentimentBadge }: { sentimentBadge: EndSentimentBadge }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Eyebrow>// final report</Eyebrow>
      <span
        className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${sentimentBadge.tone}`}
      >
        <span aria-hidden className={`size-1.5 rounded-full ${sentimentBadge.dot}`} />
        {sentimentBadge.label}
      </span>
    </div>
  );
}

function FinalReportImpactSection({
  impact,
  report,
}: {
  impact: DateImpactReceipt;
  report: DateFinalReport;
}) {
  const tone = IMPACT_TONE[impact.verdict];

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.2em] ${tone.pill}`}
        >
          <span aria-hidden className={`size-1.5 rounded-full ${tone.dot}`} />
          {impact.verdictLabel}
        </span>
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-faint">
          Next: <span className="text-aura-rose">{impact.nextAction}</span>
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold leading-snug text-aura-ink">
          {impact.campaignMeaning}
        </p>
        <p className="text-sm leading-snug text-aura-muted">{impact.reason}</p>
      </div>

      <ul className="grid gap-1.5 sm:grid-cols-3">
        {impact.consequences.map((consequence) => (
          <li
            key={consequence}
            className="min-w-0 rounded-chip bg-white/50 px-2.5 py-1.5 text-sm leading-snug text-aura-ink/85 ring-1 ring-aura-hairline"
          >
            {consequence}
          </li>
        ))}
      </ul>

      <div className="border-t border-aura-hairline/70 pt-3">
        <Eyebrow>// case note</Eyebrow>
        <p className="mt-1 text-sm leading-snug text-aura-muted">{report.summary}</p>
        <p className="mt-1 text-sm leading-snug text-aura-muted">{report.statSummary}</p>
      </div>
    </section>
  );
}

function FinalReportReadsRow({ reads }: { reads: readonly PlayerKnowledgeRecord[] }) {
  return (
    <section className="flex min-w-0 flex-col gap-2 border-t border-aura-hairline/70 pt-3">
      <Eyebrow>// filed reads</Eyebrow>
      <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}

function FinalReportActionColumn({
  sectionRef,
  recommended,
  filed,
  isActionPending,
  onFollowUp,
  onBack,
}: {
  sectionRef?: React.Ref<HTMLElement>;
  recommended: FollowUpAction;
  filed: FollowUpAction | undefined;
  isActionPending: boolean;
  onFollowUp: (action: FollowUpAction) => void;
  onBack: () => void;
}) {
  return (
    <section
      ref={sectionRef}
      className="flex min-w-0 flex-col gap-3 border-t border-aura-hairline/70 pt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>// file the follow-up</Eyebrow>
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
        <div className="flex flex-col gap-2">
          {FOLLOW_UP_ORDER.map((action) => (
            <FollowUpActionCard
              key={action}
              action={action}
              isRecommended={action === recommended}
              disabled={isActionPending}
              onSelect={() => onFollowUp(action)}
            />
          ))}
        </div>
      ) : (
        <button
          type="button"
          data-sfx="click"
          onClick={onBack}
          disabled={isActionPending}
          className="aura-liquid-cta mt-2 w-full cursor-pointer rounded-pill px-5 py-3 font-display text-sm disabled:cursor-not-allowed disabled:opacity-55"
        >
          Return to dispatch
        </button>
      )}
    </section>
  );
}

function FollowUpActionCard({
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
  const copy = FOLLOW_UP_COPY[action];
  const toneClass = isRecommended
    ? "bg-gradient-to-br from-aura-rose/10 via-aura-fuchsia/8 to-aura-violet/10 ring-aura-rose/45 hover:ring-aura-rose/70 hover:shadow-cta"
    : "aura-liquid-glass hover:ring-aura-ink/20";

  return (
    <button
      type="button"
      data-sfx="click"
      disabled={disabled}
      onClick={onSelect}
      aria-label={`${label}. ${copy.headline} ${copy.detail}`}
      className={`group relative flex w-full cursor-pointer flex-col gap-1 rounded-card px-4 py-3 text-left ring-1 transition disabled:cursor-not-allowed disabled:opacity-45 ${toneClass}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-base font-semibold text-aura-ink">{label}</span>
        {isRecommended ? (
          <span className="inline-flex items-center gap-1 rounded-pill bg-aura-rose/15 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
            <svg viewBox="0 0 12 12" className="size-2.5 shrink-0" aria-hidden>
              <path
                d="M6 1.4 L7.4 4.6 L10.8 5 L8.3 7.3 L8.9 10.6 L6 9 L3.1 10.6 L3.7 7.3 L1.2 5 L4.6 4.6 Z"
                fill="currentColor"
              />
            </svg>
            Recommended
          </span>
        ) : null}
        {copy.flag === undefined ? null : (
          <span className="rounded-pill bg-rose-50/80 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose ring-1 ring-rose-500/30">
            {copy.flag}
          </span>
        )}
      </div>
      <p className="text-sm leading-snug text-aura-ink/85">{copy.headline}</p>
      <p className="text-sm leading-snug text-aura-muted">{copy.detail}</p>
    </button>
  );
}
