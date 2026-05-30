import { motion } from "motion/react";
import { useId, useMemo, useState } from "react";

import {
  dateFinalReportSchema,
  dateSessionSchema,
  judgeSnapshotSchema,
  pairStateSchema,
  shiftStateSchema,
  type DateFinalReport,
  type DateSession,
  type FollowUpAction,
  type JudgeSnapshot,
  type Member,
  type MemberRequest,
  type PairState,
  type ShiftRequestAskOutcome,
  type ShiftState,
} from "../../../domain/game";
import {
  EASE_OUT_QUART,
  LiveDot,
  MutedLabel,
  pad2,
  Portrait,
} from "../../../components/dashboard-atoms";
import { starterMembers, starterScenarios, memberRequests } from "../../../fixtures";
import { makePairId, sortMemberIds } from "../../../services/game-seed";
import { derivePairStats } from "../../../services/pair-stats";
import { buildAskEvidenceId } from "../../../services/player-knowledge";
import {
  assessShiftRequests,
  deriveHotRequestId,
} from "../../../services/shift-request-assessment";
import { selectFeaturedMemberRequestIds } from "../../../services/shift-planning";
import { TestHeader, NotesShiftStepper } from "../shared";
import { LabEntrance, LAB_NOW } from "./gameplay-lab-shared";
import { PairTag, RouteCard } from "./shift-follow-up-route-cards";

type AskOutcomeMode = ShiftRequestAskOutcome;
type FollowUpPressurePreset = "warm" | "boundary" | "broken";
type SegmentTone = "good" | "warn" | "bad" | "neutral";
type AskGlyph = "check" | "raise" | "miss" | "ignore";
type RequestEntry = { member: Member; request: MemberRequest };

const FOCUS_MEMBER_IDS = ["jenna-pike", "junie-marrow", "calvin-hewes", "sienna-bae"] as const;

const ASK_OUTCOME_MODES: readonly {
  id: AskOutcomeMode;
  label: string;
  hint: string;
  tone: SegmentTone;
}[] = [
  {
    id: "covered",
    label: "Covered",
    tone: "good",
    hint: "Booked the lead ask and the judge filed ask-covered evidence.",
  },
  {
    id: "raised",
    label: "Raised",
    tone: "warn",
    hint: "Booked the lead ask and the judge filed ask-blocked evidence.",
  },
  {
    id: "missed",
    label: "Missed",
    tone: "warn",
    hint: "Booked the lead ask, but no ask evidence landed.",
  },
  {
    id: "ignored",
    label: "Ignored",
    tone: "bad",
    hint: "No date booked for the lead ask this shift.",
  },
];

const ASK_OUTCOME_VISUAL: Record<
  AskOutcomeMode,
  {
    label: string;
    caption: string;
    tone: SegmentTone;
    text: string;
    chipBg: string;
    ring: string;
    iconBg: string;
    glyph: AskGlyph;
  }
> = {
  covered: {
    label: "Covered",
    caption: "Ask landed, evidence filed",
    tone: "good",
    text: "text-emerald-700",
    chipBg: "bg-emerald-50",
    ring: "ring-emerald-200/70",
    iconBg: "bg-emerald-100",
    glyph: "check",
  },
  raised: {
    label: "Raised",
    caption: "Room blocked the ask",
    tone: "warn",
    text: "text-amber-700",
    chipBg: "bg-amber-50",
    ring: "ring-amber-200/70",
    iconBg: "bg-amber-100",
    glyph: "raise",
  },
  missed: {
    label: "Missed",
    caption: "Booked, then drifted",
    tone: "warn",
    text: "text-amber-700",
    chipBg: "bg-amber-50",
    ring: "ring-amber-200/70",
    iconBg: "bg-amber-100",
    glyph: "miss",
  },
  ignored: {
    label: "Ignored",
    caption: "No date booked",
    tone: "bad",
    text: "text-aura-rose",
    chipBg: "bg-rose-50",
    ring: "ring-rose-200/70",
    iconBg: "bg-rose-100",
    glyph: "ignore",
  },
};

const FOLLOW_UP_ACTIONS: readonly FollowUpAction[] = ["pursue", "cool_down", "close"];

const FOLLOW_UP_OUTCOME_OPTIONS: ReadonlyArray<{
  value: DateFinalReport["outcome"];
  label: string;
  tone: SegmentTone;
}> = [
  { value: "second_date", label: "Second date", tone: "good" },
  { value: "mixed", label: "Mixed", tone: "warn" },
  { value: "cool_down", label: "Cool down", tone: "warn" },
  { value: "bad_fit", label: "Bad fit", tone: "bad" },
  { value: "early_end", label: "Early end", tone: "bad" },
];

const PRESSURE_PRESETS: readonly {
  id: FollowUpPressurePreset;
  label: string;
  hint: string;
  tone: SegmentTone;
}[] = [
  { id: "warm", label: "Warm", tone: "good", hint: "Low conflict and no hard-stop pressure." },
  {
    id: "boundary",
    label: "Boundary",
    tone: "warn",
    hint: "Recent boundary evidence and high strain.",
  },
  { id: "broken", label: "Broken", tone: "bad", hint: "A broken agreement is shaping the file." },
];

const DOT_CLASS: Record<SegmentTone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-aura-rose",
  neutral: "bg-aura-faint",
};

export function ShiftFollowUpSimulatorTest() {
  const [shiftNumber, setShiftNumber] = useState(5);
  const [askOutcomeMode, setAskOutcomeMode] = useState<AskOutcomeMode>("covered");
  const [followUpOutcome, setFollowUpOutcome] = useState<DateFinalReport["outcome"]>("second_date");
  const [pressurePreset, setPressurePreset] = useState<FollowUpPressurePreset>("warm");

  const shiftModel = useMemo(
    () => buildShiftModel(shiftNumber, askOutcomeMode),
    [shiftNumber, askOutcomeMode],
  );
  const followUpModel = useMemo(
    () => buildFollowUpModel(followUpOutcome, pressurePreset),
    [followUpOutcome, pressurePreset],
  );

  return (
    <LabEntrance className="space-y-6">
      <TestHeader
        title="Shift and follow-up simulator"
        description="Tune lead-ask pressure and follow-up consequences without playing through a full shift."
      />

      <ShiftPressureConsole
        shiftNumber={shiftNumber}
        onShiftChange={(next) => setShiftNumber(Math.max(1, next))}
        askOutcomeMode={askOutcomeMode}
        onAskOutcomeChange={setAskOutcomeMode}
        model={shiftModel}
      />

      <FollowUpRouterConsole
        outcome={followUpOutcome}
        onOutcomeChange={setFollowUpOutcome}
        pressurePreset={pressurePreset}
        onPressureChange={setPressurePreset}
        model={followUpModel}
      />
    </LabEntrance>
  );
}

/* ================================================================== */
/* Console shell                                                       */
/* ================================================================== */

function ConsoleShell({
  index,
  eyebrow,
  title,
  adornment,
  children,
}: {
  index: number;
  eyebrow: string;
  title: string;
  adornment: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.1 + index * 0.08 }}
      className="aura-glass relative overflow-hidden rounded-card p-6 lg:p-7"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aura-rose/55 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-28 size-64 rounded-full bg-aura-mesh-rose/25 blur-3xl"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <MutedLabel>{eyebrow}</MutedLabel>
          <h3 className="font-display text-xl font-semibold leading-tight tracking-tight text-aura-ink">
            {title}
          </h3>
        </div>
        {adornment}
      </header>
      <div className="relative mt-6">{children}</div>
    </motion.section>
  );
}

/* ================================================================== */
/* Shift pressure console                                              */
/* ================================================================== */

function ShiftPressureConsole({
  shiftNumber,
  onShiftChange,
  askOutcomeMode,
  onAskOutcomeChange,
  model,
}: {
  shiftNumber: number;
  onShiftChange: (next: number) => void;
  askOutcomeMode: AskOutcomeMode;
  onAskOutcomeChange: (value: AskOutcomeMode) => void;
  model: ShiftModel;
}) {
  const leadEntry = model.requests.find(
    (entry) => entry.request.id === model.assessment.leadRequestId,
  );
  const queueEntries = model.requests.filter(
    (entry) => entry.request.id !== model.assessment.leadRequestId,
  );
  const leadOutcome = model.assessment.leadOutcome ?? "ignored";
  const hint = ASK_OUTCOME_MODES.find((mode) => mode.id === askOutcomeMode)?.hint ?? "";

  return (
    <ConsoleShell
      index={0}
      eyebrow="shift pressure"
      title="Lead ask classifier"
      adornment={<ShiftBadge shiftNumber={shiftNumber} />}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <NotesShiftStepper value={shiftNumber} onChange={onShiftChange} />
          <div className="space-y-2">
            <MutedLabel>lead ask result</MutedLabel>
            <Segmented
              ariaLabel="Lead ask result"
              options={ASK_OUTCOME_MODES.map((mode) => ({
                id: mode.id,
                label: mode.label,
                tone: mode.tone,
              }))}
              value={askOutcomeMode}
              onChange={onAskOutcomeChange}
            />
          </div>
        </div>
        <p className="max-w-[40ch] text-sm leading-relaxed text-aura-muted">{hint}</p>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1fr)]">
        <LeadAskHero entry={leadEntry} outcome={leadOutcome} />
        <FulfillmentGauge score={model.assessment.fulfillmentScore} />
        <QueueLedger entries={queueEntries} outcomes={model.assessment.outcomes} />
      </div>
    </ConsoleShell>
  );
}

function ShiftBadge({ shiftNumber }: { shiftNumber: number }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-tile bg-aura-ink px-4 py-2.5 text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.8)]">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-white/55">
        shift
      </span>
      <span className="font-display text-2xl font-semibold leading-none tabular-nums">
        {pad2(shiftNumber)}
      </span>
    </div>
  );
}

function LeadAskHero({
  entry,
  outcome,
}: {
  entry: RequestEntry | undefined;
  outcome: ShiftRequestAskOutcome;
}) {
  if (entry === undefined) {
    return (
      <div className="grid place-items-center rounded-card bg-white/45 p-6 text-center ring-1 ring-aura-hairline">
        <p className="text-sm text-aura-muted">No hot ask derived for this shift.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-card bg-gradient-to-br from-white/75 to-white/40 p-5 ring-1 ring-aura-hairline">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
          <LiveDot /> lead ask
        </span>
        <OutcomeChip outcome={outcome} />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Portrait member={entry.member} variant="row" />
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold leading-tight tracking-tight text-aura-ink">
            {entry.member.name}
          </p>
          <p className="mt-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
            hot ask · {entry.member.id}
          </p>
        </div>
      </div>

      <p className="mt-4 flex-1 text-body leading-relaxed text-aura-ink/85">{entry.request.text}</p>

      <div className="mt-5">
        <OutcomeVerdict outcome={outcome} />
      </div>
    </div>
  );
}

function FulfillmentGauge({ score }: { score: { asked: number; weighted: number } }) {
  const pct = score.asked === 0 ? 0 : Math.round((score.weighted / score.asked) * 100);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card bg-white/55 px-6 py-5 ring-1 ring-aura-hairline">
      <MutedLabel>fulfillment</MutedLabel>
      <FulfillmentRing pct={pct} />
      <div className="text-center">
        <p className="font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
          weighted score
        </p>
        <p className="font-display text-base font-semibold text-aura-ink tabular-nums">
          {Math.round(score.weighted * 100)} / {score.asked * 100}
        </p>
      </div>
    </div>
  );
}

function FulfillmentRing({ pct }: { pct: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const bounded = Math.max(0, Math.min(100, pct));
  const offset = circumference - (bounded / 100) * circumference;

  return (
    <div className="relative grid size-28 place-items-center">
      <svg viewBox="0 0 100 100" className="size-28 -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(15,23,42,0.08)"
          strokeWidth="9"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#fulfillment-grad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        />
        <defs>
          <linearGradient id="fulfillment-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f43f5e" />
            <stop offset="0.5" stopColor="#d946ef" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-2xl font-semibold text-aura-ink tabular-nums">
          {bounded}
          <span className="text-base text-aura-faint">%</span>
        </span>
      </div>
    </div>
  );
}

function QueueLedger({
  entries,
  outcomes,
}: {
  entries: readonly RequestEntry[];
  outcomes: ReadonlyMap<string, ShiftRequestAskOutcome>;
}) {
  return (
    <div className="flex flex-col rounded-card bg-white/45 p-4 ring-1 ring-aura-hairline">
      <div className="flex items-center justify-between">
        <MutedLabel>queue</MutedLabel>
        <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-faint tabular-nums">
          {entries.length} waiting
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {entries.map((entry, index) => (
          <QueueRow
            key={entry.request.id}
            entry={entry}
            outcome={outcomes.get(entry.request.id) ?? "ignored"}
            index={index}
          />
        ))}
      </ul>
    </div>
  );
}

function QueueRow({
  entry,
  outcome,
  index,
}: {
  entry: RequestEntry;
  outcome: ShiftRequestAskOutcome;
  index: number;
}) {
  const visual = ASK_OUTCOME_VISUAL[outcome];

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_QUART, delay: 0.2 + index * 0.06 }}
      className="flex items-center gap-3 rounded-tile bg-white/60 px-3 py-2 ring-1 ring-aura-hairline"
    >
      <Portrait member={entry.member} variant="chip" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold text-aura-ink">
          {entry.member.firstName}
        </p>
        <p className="truncate text-sm text-aura-muted">{entry.request.text}</p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-micro uppercase tracking-[0.16em] ring-1 ${visual.chipBg} ${visual.text} ${visual.ring}`}
      >
        <span className={`size-1.5 rounded-full ${DOT_CLASS[visual.tone]}`} />
        {outcome}
      </span>
    </motion.li>
  );
}

function OutcomeChip({ outcome }: { outcome: ShiftRequestAskOutcome }) {
  const visual = ASK_OUTCOME_VISUAL[outcome];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] ring-1 ${visual.chipBg} ${visual.text} ${visual.ring}`}
    >
      <span className={`size-1.5 rounded-full ${DOT_CLASS[visual.tone]}`} />
      {outcome}
    </span>
  );
}

function OutcomeVerdict({ outcome }: { outcome: ShiftRequestAskOutcome }) {
  const visual = ASK_OUTCOME_VISUAL[outcome];
  return (
    <div
      className={`flex items-center gap-3 rounded-tile px-4 py-3 ring-1 ${visual.chipBg} ${visual.ring}`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full ${visual.iconBg} ${visual.text}`}
      >
        <OutcomeGlyph kind={visual.glyph} />
      </span>
      <div className="min-w-0">
        <p className={`font-display text-base font-semibold leading-tight ${visual.text}`}>
          {visual.label}
        </p>
        <p className="truncate font-mono text-micro uppercase tracking-[0.16em] text-aura-faint">
          {visual.caption}
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Follow-up router console                                            */
/* ================================================================== */

function FollowUpRouterConsole({
  outcome,
  onOutcomeChange,
  pressurePreset,
  onPressureChange,
  model,
}: {
  outcome: DateFinalReport["outcome"];
  onOutcomeChange: (value: DateFinalReport["outcome"]) => void;
  pressurePreset: FollowUpPressurePreset;
  onPressureChange: (value: FollowUpPressurePreset) => void;
  model: FollowUpModel;
}) {
  const recommended = model.session.finalReport?.recommendedFollowUp;
  const hint = PRESSURE_PRESETS.find((preset) => preset.id === pressurePreset)?.hint ?? "";

  return (
    <ConsoleShell
      index={1}
      eyebrow="follow-up resolver"
      title="Outcome-aware effects"
      adornment={<PairTag focus={model.focusMember} partner={model.partner} />}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="space-y-2">
            <MutedLabel>final outcome</MutedLabel>
            <Segmented
              ariaLabel="Final outcome"
              options={FOLLOW_UP_OUTCOME_OPTIONS.map((option) => ({
                id: option.value,
                label: option.label,
                tone: option.tone,
              }))}
              value={outcome}
              onChange={onOutcomeChange}
            />
          </div>
          <div className="space-y-2">
            <MutedLabel>pressure preset</MutedLabel>
            <Segmented
              ariaLabel="Pressure preset"
              options={PRESSURE_PRESETS.map((preset) => ({
                id: preset.id,
                label: preset.label,
                tone: preset.tone,
              }))}
              value={pressurePreset}
              onChange={onPressureChange}
            />
          </div>
        </div>
        <p className="max-w-[36ch] text-sm leading-relaxed text-aura-muted">{hint}</p>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {FOLLOW_UP_ACTIONS.map((action, index) => (
          <RouteCard
            key={action}
            action={action}
            index={index}
            pairState={model.pairState}
            session={model.session}
            recommended={recommended === action}
          />
        ))}
      </div>
    </ConsoleShell>
  );
}

/* ================================================================== */
/* Segmented control                                                   */
/* ================================================================== */

function Segmented<TValue extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: ReadonlyArray<{ id: TValue; label: string; tone: SegmentTone }>;
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel: string;
}) {
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-1 rounded-pill bg-white/55 p-1 ring-1 ring-aura-hairline"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className="relative cursor-pointer rounded-pill px-3.5 py-2 outline-none transition focus-visible:ring-2 focus-visible:ring-aura-rose/40"
          >
            {active ? (
              <motion.span
                aria-hidden
                layoutId={`${groupId}-thumb`}
                transition={{ type: "spring", stiffness: 440, damping: 36 }}
                className="absolute inset-0 rounded-pill bg-aura-ink shadow-[0_10px_22px_-14px_rgba(15,23,42,0.85)]"
              />
            ) : null}
            <span
              className={`relative z-10 inline-flex items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.2em] transition-colors ${
                active ? "text-white" : "text-aura-muted"
              }`}
            >
              <span className={`size-1.5 rounded-full ${DOT_CLASS[option.tone]}`} />
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* Glyphs                                                              */
/* ================================================================== */

function OutcomeGlyph({ kind, className = "" }: { kind: AskGlyph; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {kind === "check" ? (
        <path d="M5 12.5l4.5 4.5L19 7" />
      ) : kind === "raise" ? (
        <>
          <path d="M12 19V7" />
          <path d="M6 11l6-6 6 6" />
        </>
      ) : kind === "miss" ? (
        <path d="M5 12h14" />
      ) : (
        <circle cx="12" cy="12" r="7" />
      )}
    </svg>
  );
}

/* ================================================================== */
/* Models                                                              */
/* ================================================================== */

type ShiftModel = {
  shift: ShiftState;
  requests: RequestEntry[];
  completedDates: DateSession[];
  leadRequest: MemberRequest | undefined;
  assessment: ReturnType<typeof assessShiftRequests>;
};

type FollowUpModel = {
  pairState: PairState;
  session: DateSession;
  focusMember: Member;
  partner: Member;
};

function buildShiftModel(shiftNumber: number, outcomeMode: AskOutcomeMode): ShiftModel {
  const focusedMembers = FOCUS_MEMBER_IDS.map(requireMember);
  const memberRequestIds = selectFeaturedMemberRequestIds({
    members: starterMembers,
    featuredMemberIds: focusedMembers.map((member) => member.id),
    shiftNumber,
  });
  const shift = shiftStateSchema.parse({
    id: `shift-lab-${shiftNumber}`,
    shiftNumber,
    status: "active",
    dateSlotsTotal: 1,
    dateSlotsUsed: outcomeMode === "ignored" ? 0 : 1,
    featuredMemberIds: focusedMembers.map((member) => member.id),
    availablePartnerMemberIds: ["kade-sumner", "mei-sato", "naia-velorae", "vhool"],
    followUpReservations: [],
    drawnScenarioIds: [],
    companyGoalIds: [],
    memberRequestIds,
    startedAt: LAB_NOW,
  });
  const leadRequestId = deriveHotRequestId(shift);
  const leadRequest =
    leadRequestId === undefined
      ? undefined
      : memberRequests.find((request) => request.id === leadRequestId);
  const completedDates =
    outcomeMode === "ignored" || leadRequest === undefined
      ? []
      : [makeAskSession(shift, leadRequest, outcomeMode)];
  const assessment = assessShiftRequests({ shift, completedDates });

  return {
    shift,
    requests: memberRequestIds
      .map((requestId) => {
        const request = memberRequests.find((candidate) => candidate.id === requestId);
        const member =
          request === undefined
            ? undefined
            : starterMembers.find((candidate) => candidate.id === request.memberId);
        if (request === undefined || member === undefined) return undefined;
        return { member, request };
      })
      .filter((entry): entry is RequestEntry => entry !== undefined),
    completedDates,
    leadRequest,
    assessment,
  };
}

function makeAskSession(
  shift: ShiftState,
  request: MemberRequest,
  outcomeMode: Exclude<AskOutcomeMode, "ignored">,
): DateSession {
  const focusMember = requireMember(request.memberId);
  const partner = requireMember("kade-sumner");
  const sessionId = `date-${shift.shiftNumber}-${focusMember.id}-lab`;
  const usedEvidenceIds =
    outcomeMode === "covered"
      ? [buildAskEvidenceId(focusMember.id, request.id, "covered")]
      : outcomeMode === "raised"
        ? [buildAskEvidenceId(focusMember.id, request.id, "blocked")]
        : [];
  const judgeSnapshot = makeJudgeSnapshot({
    id: `judge-${sessionId}`,
    dateSessionId: sessionId,
    usedEvidenceIds,
    dateHealthDelta: outcomeMode === "covered" ? 6 : outcomeMode === "raised" ? -2 : 0,
  });

  return makeSession({
    id: sessionId,
    focusMember,
    partner,
    outcome: outcomeMode === "covered" ? "second_date" : "mixed",
    status: "completed",
    judgeSnapshots: [judgeSnapshot],
    focusRequestId: request.id,
    shiftNumber: shift.shiftNumber,
  });
}

function buildFollowUpModel(
  outcome: DateFinalReport["outcome"],
  pressurePreset: FollowUpPressurePreset,
): FollowUpModel {
  const focusMember = requireMember("calvin-hewes");
  const partner = requireMember("ryan-doyle");
  const pairState = pairStateSchema.parse({
    id: makePairId(focusMember.id, partner.id),
    participantIds: sortMemberIds(focusMember.id, partner.id),
    laneStatus: "open",
    stats: derivePairStats({
      chemistry: pressurePreset === "warm" ? 74 : 45,
      trust: pressurePreset === "broken" ? 36 : pressurePreset === "boundary" ? 42 : 71,
      stability: pressurePreset === "warm" ? 70 : 38,
      conflict: pressurePreset === "warm" ? 22 : 72,
      weirdnessTolerance: 55,
      spark: pressurePreset === "warm" ? 68 : 38,
      strain: 0,
      relationshipHealth: 0,
    }),
    completedDateIds: ["date-follow-up-lab-prior"],
    scenarioUseCounts: { "museum-exhibit-mixup": 1 },
    agreements:
      pressurePreset === "broken"
        ? [
            {
              id: "agreement-follow-up-lab-broken",
              text: "No public archive questions.",
              status: "broken",
              sourceDateSessionId: "date-follow-up-lab-prior",
              createdAt: "2026-05-22T18:00:00.000Z",
              resolvedAt: LAB_NOW,
            },
          ]
        : [
            {
              id: "agreement-follow-up-lab-active",
              text: "Walk out before the exhibit turns into a trial.",
              status: "active",
              sourceDateSessionId: "date-follow-up-lab-prior",
              createdAt: "2026-05-22T18:00:00.000Z",
            },
          ],
    openLoops: [
      {
        id: "open-loop-follow-up-lab",
        text: "Whether Ryan can repair without explaining Calvin back to himself.",
        status: "open",
        sourceDateSessionId: "date-follow-up-lab-prior",
        createdAt: "2026-05-22T18:00:00.000Z",
      },
    ],
  });
  const shouldEndEarly = pressurePreset === "boundary" || outcome === "early_end";
  const judgeSnapshot = makeJudgeSnapshot({
    id: "judge-follow-up-lab",
    dateSessionId: "date-follow-up-lab",
    usedEvidenceIds: shouldEndEarly ? ["member:calvin-hewes:boundary:public-exposure"] : [],
    dateHealthDelta: shouldEndEarly ? -9 : outcome === "second_date" ? 7 : -1,
    shouldEndEarly,
  });

  return {
    pairState,
    focusMember,
    partner,
    session: makeSession({
      id: "date-follow-up-lab",
      focusMember,
      partner,
      outcome,
      status: outcome === "early_end" ? "ended_early" : "completed",
      judgeSnapshots: [judgeSnapshot],
      focusRequestId: focusMember.state.currentRequestId,
      shiftNumber: 5,
    }),
  };
}

function makeSession({
  id,
  focusMember,
  partner,
  outcome,
  status,
  judgeSnapshots,
  focusRequestId,
  shiftNumber,
}: {
  id: string;
  focusMember: Member;
  partner: Member;
  outcome: DateFinalReport["outcome"];
  status: DateSession["status"];
  judgeSnapshots: JudgeSnapshot[];
  focusRequestId: string | undefined;
  shiftNumber: number;
}): DateSession {
  const scenario =
    starterScenarios.find((candidate) => candidate.id === "museum-exhibit-mixup") ??
    starterScenarios[0];
  if (scenario === undefined) {
    throw new Error("Missing playground scenario.");
  }
  const finalReport = dateFinalReportSchema.parse({
    id: `report-${id}`,
    dateSessionId: id,
    completedAt: LAB_NOW,
    outcome,
    summary: "Follow-up lab report.",
    statSummary: "The file needs a follow-up decision.",
    recommendedFollowUp:
      outcome === "second_date" ? "pursue" : outcome === "bad_fit" ? "close" : "cool_down",
    memoryRecordIds: [],
  });

  return dateSessionSchema.parse({
    id,
    pairId: makePairId(focusMember.id, partner.id),
    shiftNumber,
    scenarioId: scenario.id,
    focusMemberId: focusMember.id,
    focusRequestId,
    currentTurn: 6,
    dateHealth: outcome === "early_end" ? 18 : outcome === "second_date" ? 74 : 50,
    status,
    runtimeMode: "local_ai",
    participants: sortMemberIds(focusMember.id, partner.id),
    transcript: [],
    privateStateByCharacter: {
      [focusMember.id]: { mood: 52, comfort: 45, intent: "follow-up lab" },
      [partner.id]: { mood: 58, comfort: 48, intent: "follow-up lab" },
    },
    judgeSnapshots,
    eventDraft: { offered: [], picked: null },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: outcome === "early_end" || outcome === "bad_fit" ? "negative" : "positive",
    endReason: outcome === "early_end" ? "judge_early_end" : "natural_wrap",
    interventions: [],
    finalReport,
  });
}

function makeJudgeSnapshot({
  id,
  dateSessionId,
  usedEvidenceIds,
  dateHealthDelta,
  shouldEndEarly = false,
}: {
  id: string;
  dateSessionId: string;
  usedEvidenceIds: string[];
  dateHealthDelta: number;
  shouldEndEarly?: boolean;
}): JudgeSnapshot {
  return judgeSnapshotSchema.parse({
    id,
    dateSessionId,
    exchangeIndex: 1,
    dateHealthDelta,
    statDeltas: shouldEndEarly ? { conflict: 6, strain: 8, trust: -4 } : { trust: 3, spark: 2 },
    memberMoodDeltas: {
      "calvin-hewes": dateHealthDelta,
      "ryan-doyle": Math.round(dateHealthDelta / 2),
    },
    shouldEndEarly,
    earlyEndReason: shouldEndEarly ? "Public pressure crossed the file boundary." : undefined,
    endSentiment: shouldEndEarly ? "negative" : null,
    notableMoments: ["The date produced a shift/follow-up lab event."],
    playerSummary: shouldEndEarly
      ? "Boundary pressure ended the date early."
      : "Cupid found enough evidence to file the exchange.",
    memoryCandidates: [],
    usedEvidenceIds,
    agreementCandidates: [],
    agreementUpdates: [],
    openLoopCandidates: [],
    openLoopUpdates: [],
  });
}

function requireMember(memberId: string): Member {
  const member = starterMembers.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Missing playground member ${memberId}`);
  }
  return member;
}
