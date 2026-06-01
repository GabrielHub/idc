import { motion } from "motion/react";
import type { ReactNode } from "react";

import {
  judgeSnapshotSchema,
  type ActiveDateBooking,
  type DateScenario,
  type DateSession,
  type GameSave,
  type JudgeSnapshot,
  type Member,
} from "../../../domain/game";
import { Portrait } from "../../../components/dashboard-atoms";
import {
  advanceDateExchange,
  EVENT_DRAFT_PICKED,
  pickScenarioEvents,
  startDateSession,
} from "../../../services/date-engine";
import { selectInitialFocusCases } from "../../../services/focus-cases";
import { createSeedGameSave, getActiveShift } from "../../../services/game-seed";
import { memberRequests, starterScenarios } from "../../../fixtures";
import { TestHeader } from "../shared";
import { LabEntrance } from "./gameplay-lab-shared";

export const WORKSHOP_NOW = "2026-05-23T18:00:00.000Z";
export const WORKSHOP_FOCUS_IDS = ["jenna-pike", "mei-sato", "calvin-hewes", "sienna-bae"] as const;
export const WORKSHOP_SCENARIO_ID = "county-fair-friday";

export type PresetOption<TId extends string> = {
  id: TId;
  label: string;
  title: string;
  detail: string;
};

export type Tone = "neutral" | "good" | "warn" | "bad" | "ink";

export function WorkshopShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <LabEntrance className="space-y-8">
      <TestHeader title={title} description={description} />
      {children}
    </LabEntrance>
  );
}

export function PresetRail<TId extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly PresetOption<TId>[];
  value: TId;
  onChange: (next: TId) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {options.map((option, index) => {
        const active = option.id === value;
        return (
          <motion.button
            key={option.id}
            type="button"
            aria-pressed={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.025 }}
            onClick={() => onChange(option.id)}
            className={`min-h-28 cursor-pointer rounded-card px-4 py-4 text-left transition ${
              active
                ? "bg-aura-ink text-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.85)]"
                : "aura-glass text-aura-ink hover:-translate-y-0.5 hover:shadow-card"
            }`}
          >
            <span
              className={`font-mono text-micro font-semibold uppercase tracking-[0.28em] ${
                active ? "text-white/55" : "text-aura-faint"
              }`}
            >
              {option.label}
            </span>
            <span className="mt-2 block font-display text-xl font-semibold leading-tight tracking-tight">
              {option.title}
            </span>
            <span
              className={`mt-1 block text-sm leading-snug ${active ? "text-white/70" : "text-aura-muted"}`}
            >
              {option.detail}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function PairPlate({
  members,
  scenario,
  eyebrow,
}: {
  members: readonly Member[];
  scenario?: DateScenario;
  eyebrow: string;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white/60 ring-1 ring-aura-hairline">
      <div className="flex items-center justify-between gap-4 border-b border-aura-hairline px-4 py-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
          {eyebrow}
        </span>
        {scenario === undefined ? null : (
          <span className="max-w-[28ch] truncate text-sm font-semibold text-aura-muted">
            {scenario.title}
          </span>
        )}
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {members.map((member) => (
          <div key={member.id} className="flex min-w-0 items-center gap-3">
            <Portrait member={member} variant="thumb" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-tight text-aura-ink">
                {member.name}
              </p>
              <p className="truncate text-sm text-aura-muted">{member.species}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StateReceipt({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: ReactNode;
  tone?: Tone;
}) {
  const toneClass = {
    neutral: "border-aura-hairline bg-white/50",
    good: "border-emerald-200 bg-emerald-50/70",
    warn: "border-amber-200 bg-amber-50/70",
    bad: "border-rose-200 bg-rose-50/70",
    ink: "border-aura-ink bg-aura-ink text-white",
  }[tone];

  return (
    <div className={`rounded-card border px-4 py-3 ${toneClass}`}>
      <p
        className={`font-mono text-micro font-semibold uppercase tracking-[0.24em] ${
          tone === "ink" ? "text-white/55" : "text-aura-faint"
        }`}
      >
        {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function TimelineList({
  items,
}: {
  items: readonly { label: string; active: boolean; done: boolean }[];
}) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li key={item.label} className="grid grid-cols-[2rem_1fr] gap-3">
          <span
            className={`flex size-8 items-center justify-center rounded-full font-mono text-micro font-semibold tabular-nums ${
              item.active
                ? "bg-aura-rose text-white"
                : item.done
                  ? "bg-aura-ink text-white"
                  : "bg-white/70 text-aura-faint ring-1 ring-aura-hairline"
            }`}
          >
            {index + 1}
          </span>
          <span className="pt-1.5 text-sm font-semibold text-aura-ink">{item.label}</span>
        </li>
      ))}
    </ol>
  );
}

export function DetailList({ items }: { items: readonly { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-aura-hairline rounded-card bg-white/45 ring-1 ring-aura-hairline">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
            {item.label}
          </dt>
          <dd className="min-w-0 text-sm leading-relaxed text-aura-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ScenarioCardRow({ cardIds }: { cardIds: readonly string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cardIds.map((cardId) => {
        const scenario = scenarioById(cardId);
        return (
          <div key={cardId} className="rounded-card bg-white/55 p-4 ring-1 ring-aura-hairline">
            <p className="font-display text-lg font-semibold leading-tight text-aura-ink">
              {scenario.title}
            </p>
            <p className="mt-1 text-sm leading-snug text-aura-muted">
              {scenario.director.flow} / {scenario.card.risk} risk / cost {scenario.card.cost}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function createFocusedWorkshopSave(): GameSave {
  return selectInitialFocusCases(createSeedGameSave(workshopDate()), WORKSHOP_FOCUS_IDS);
}

export function workshopDate(): Date {
  return new Date(WORKSHOP_NOW);
}

export function firstAvailablePartnerId(save: GameSave): string {
  const shift = getActiveShift(save);
  const partnerId = shift.availablePartnerMemberIds.find(
    (id) => !save.focusedMemberIds.includes(id),
  );
  if (partnerId === undefined) {
    throw new Error("Workshop save has no available partner.");
  }
  return partnerId;
}

export function startWorkshopDate(): { save: GameSave; session: DateSession } {
  const save = createFocusedWorkshopSave();
  return startDateSession(save, {
    focusMemberId: save.focusedMemberIds[0],
    firstMemberId: save.focusedMemberIds[0],
    secondMemberId: firstAvailablePartnerId(save),
    scenarioId: WORKSHOP_SCENARIO_ID,
    now: workshopDate(),
  });
}

export function pickEventsIfNeeded(
  save: GameSave,
  session: DateSession,
): { save: GameSave; session: DateSession } {
  if (session.playbackState !== "drafting") return { save, session };
  return pickScenarioEvents(save, {
    dateSessionId: session.id,
    pickedEventIds: session.eventDraft.offered.slice(0, EVENT_DRAFT_PICKED),
    now: workshopDate(),
  });
}

export function advanceToJudgeCount(
  startSave: GameSave,
  startSession: DateSession,
  targetJudgeCount: number,
): { save: GameSave; session: DateSession } {
  let save = startSave;
  let session = startSession;
  let guard = 0;
  while (
    session.status === "active" &&
    session.judgeSnapshots.length < targetJudgeCount &&
    guard < 8
  ) {
    ({ save, session } = advanceDateExchange(save, {
      dateSessionId: session.id,
      now: workshopDate(),
    }));
    guard += 1;
  }
  return { save, session };
}

export function requireActiveBooking(save: GameSave): ActiveDateBooking {
  const booking = getActiveShift(save).activeBooking;
  if (booking === undefined) throw new Error("Workshop active booking missing.");
  return booking;
}

export function scenarioById(scenarioId: string): DateScenario {
  const scenario = starterScenarios.find((candidate) => candidate.id === scenarioId);
  if (scenario === undefined) throw new Error(`Missing workshop scenario ${scenarioId}`);
  return scenario;
}

export function memberFromSave(save: GameSave, memberId: string): Member {
  const member = save.members.find((candidate) => candidate.id === memberId);
  if (member === undefined) throw new Error(`Missing workshop member ${memberId}`);
  return member;
}

export function currentRequestFor(member: Member) {
  return (
    memberRequests.find((request) => request.id === member.state.currentRequestId) ??
    memberRequests.find((request) => request.memberId === member.id)
  );
}

export function replaceById<T extends { id: string }>(items: readonly T[], replacement: T): T[] {
  let replaced = false;
  const next = items.map((item) => {
    if (item.id !== replacement.id) return item;
    replaced = true;
    return replacement;
  });
  return replaced ? next : [...next, replacement];
}

export function makeJudgeSnapshot({
  session,
  dateHealthDelta,
  shouldEndEarly,
  members,
}: {
  session: DateSession;
  dateHealthDelta: number;
  shouldEndEarly: boolean;
  members: readonly Member[];
}): JudgeSnapshot {
  return judgeSnapshotSchema.parse({
    id: `judge-${session.id}-workshop`,
    dateSessionId: session.id,
    exchangeIndex: 1,
    dateHealthDelta,
    statDeltas: {
      chemistry: Math.round(dateHealthDelta / 2),
      trust: Math.round(dateHealthDelta / 3),
      relationshipHealth: Math.round(dateHealthDelta / 2),
      strain: dateHealthDelta < 0 ? Math.abs(Math.round(dateHealthDelta / 2)) : -2,
    },
    memberMoodDeltas: Object.fromEntries(
      members.map((member) => [
        member.id,
        Math.max(-9, Math.min(6, Math.round(dateHealthDelta / 4))),
      ]),
    ),
    shouldEndEarly,
    earlyEndReason: shouldEndEarly ? "Pressure crossed the workshop boundary." : undefined,
    endSentiment: shouldEndEarly ? "negative" : "positive",
    notableMoments: ["Workshop snapshot filed a controlled outcome."],
    playerSummary: "Cupid filed a workshop read for this outcome.",
    memoryCandidates: [],
    usedEvidenceIds: [],
    agreementCandidates: shouldEndEarly ? [] : [{ text: "Keep the next plan simple and visible." }],
    agreementUpdates: [],
    openLoopCandidates: shouldEndEarly
      ? [{ text: "Whether the pair can repair the pressured beat." }]
      : [],
    openLoopUpdates: [],
  });
}
