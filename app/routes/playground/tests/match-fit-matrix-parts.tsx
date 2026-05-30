import type { ReactNode } from "react";

import {
  pairStateSchema,
  type DateScenario,
  type Member,
  type MemberRequest,
  type PairState,
} from "../../../domain/game";
import { CupidMark, Portrait } from "../../../components/dashboard-atoms";
import { starterMembers, starterScenarios } from "../../../fixtures";
import { makePairId, sortMemberIds } from "../../../services/game-seed";
import {
  evaluateMatchFit,
  scenarioRoomReadFromMatchFit,
  type MatchAskSignal,
  type MatchPressureLevel,
  type ScenarioRoomRead,
} from "../../../services/match-fit";
import { derivePairStats } from "../../../services/pair-stats";
import {
  DeltaValue,
  EmptyState,
  LabPanel,
  MetricPill,
  StatBar,
  toneForDelta,
} from "./gameplay-lab-shared";
import { currentRequestFor } from "./gameplay-loop-lab-common";

export type HistoryPreset = "fresh" | "warm" | "brittle";
export type CellMarker = "none" | "recommended" | "ceiling";
export type MatrixCell = {
  partner: Member;
  scenario: DateScenario;
  request: MemberRequest | undefined;
  pairState: PairState;
  fit: ReturnType<typeof evaluateMatchFit>;
  roomRead: ScenarioRoomRead;
};
export type BoardSummary = {
  promising: number;
  steady: number;
  volatile: number;
  dealbreakers: number;
};
type TraitLevel = "low" | "medium" | "high";

export const MATRIX_SCENARIO_IDS = [
  "diner-eleven-pm",
  "soft-launch-photo-wall",
  "museum-exhibit-mixup",
  "prophecy-karaoke",
  "memory-course-dinner",
  "temporal-coffee-shop",
] as const;

export const MATRIX_PARTNER_IDS = [
  "kade-sumner",
  "mei-sato",
  "sienna-bae",
  "naia-velorae",
  "calvin-hewes",
  "ryan-doyle",
  "nawal-marrash",
  "maeve",
  "vhool",
  "anansi",
] as const;

const ROOM_READ_FILL: Record<ScenarioRoomRead, string> = {
  promising: "bg-emerald-50/70 text-emerald-900 hover:bg-emerald-50/95",
  steady: "bg-white/65 text-aura-ink hover:bg-white/90",
  volatile: "bg-rose-50/70 text-rose-900 hover:bg-rose-50/95",
};

const ROOM_READ_RING: Record<ScenarioRoomRead, string> = {
  promising: "ring-emerald-200/80",
  steady: "ring-aura-hairline",
  volatile: "ring-rose-200/80",
};

const ROOM_READ_GLOW: Record<ScenarioRoomRead, string> = {
  promising: "shadow-[0_18px_40px_-30px_rgba(16,185,129,0.8)]",
  steady: "shadow-none",
  volatile: "shadow-[0_18px_40px_-30px_rgba(244,63,94,0.7)]",
};

export const ROOM_READ_DOT: Record<ScenarioRoomRead, string> = {
  promising: "bg-aura-emerald",
  steady: "bg-aura-faint",
  volatile: "bg-aura-rose",
};

const TRAIT_DOT: Record<TraitLevel, string> = {
  low: "bg-emerald-400/80",
  medium: "bg-amber-400",
  high: "bg-rose-400",
};

const TRAIT_NAME: Record<string, string> = { R: "risk", I: "intimacy", C: "chaos" };

const ASK_BADGE_TONE: Record<Exclude<MatchAskSignal, "none">, string> = {
  covered: "bg-emerald-100 text-emerald-700",
  uncertain: "bg-amber-100 text-amber-700",
  blocked: "bg-rose-100 text-aura-rose",
};

export function MatrixCellButton({
  cell,
  selected,
  marker,
  onSelect,
}: {
  cell: MatrixCell;
  selected: boolean;
  marker: CellMarker;
  onSelect: () => void;
}) {
  const { roomRead, fit } = cell;
  const delta = fit.startingDateHealthDelta;
  const boundary = fit.boundaryRisk !== null;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={cellAriaLabel(cell, selected, marker)}
      onClick={onSelect}
      className={cellClass(roomRead, selected, marker)}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          className={`font-mono text-micro font-semibold uppercase tracking-[0.16em] ${roomReadLabelClass(
            roomRead,
            selected,
          )}`}
        >
          {roomRead}
        </span>
        <span className="flex items-center gap-1">
          {boundary ? <BoundaryMarker selected={selected} /> : null}
          {marker === "recommended" ? <RecommendedStar selected={selected} /> : null}
          {marker === "ceiling" ? <CeilingMarker selected={selected} /> : null}
        </span>
      </span>

      <span className="mt-1 block">
        <span
          className={`font-display text-[2rem] font-semibold leading-none tabular-nums ${deltaToneClass(
            delta,
            selected,
          )}`}
        >
          {formatDelta(delta)}
        </span>
      </span>

      <span className="mt-2 flex items-center justify-between gap-2">
        <PressurePips level={fit.pressureLevel} selected={selected} />
        <AskBadge signal={fit.askSignal} selected={selected} />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Selected read, the drill-down on the clicked booking               */
/* ------------------------------------------------------------------ */

export function SelectedRead({
  focusMember,
  partner,
  scenario,
  cell,
  riskNotes,
}: {
  focusMember: Member;
  partner: Member;
  scenario: DateScenario;
  cell: MatrixCell;
  riskNotes: readonly string[];
}) {
  const { fit, roomRead } = cell;

  return (
    <LabPanel label="selected read" title={`${partner.firstName} in ${scenario.title}`}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-4">
          <PairingStrip focusMember={focusMember} partner={partner} scenario={scenario} />

          <div className="flex flex-wrap gap-2">
            <MetricPill label="room read" value={roomRead} tone={roomReadTone(roomRead)} />
            <MetricPill
              label="fit"
              value={fit.fitLevel}
              tone={
                fit.fitLevel === "strong" ? "good" : fit.fitLevel === "risky" ? "bad" : "neutral"
              }
            />
            <MetricPill
              label="pressure"
              value={fit.pressureLevel}
              tone={
                fit.pressureLevel === "high"
                  ? "bad"
                  : fit.pressureLevel === "medium"
                    ? "warn"
                    : "good"
              }
            />
            <MetricPill
              label="ask"
              value={fit.askSignal}
              tone={
                fit.askSignal === "covered"
                  ? "good"
                  : fit.askSignal === "blocked"
                    ? "bad"
                    : fit.askSignal === "uncertain"
                      ? "warn"
                      : "neutral"
              }
            />
            <MetricPill
              label="date health"
              value={<DeltaValue value={fit.startingDateHealthDelta} />}
              tone={toneForDelta(fit.startingDateHealthDelta)}
            />
          </div>

          <div className="space-y-3 rounded-card bg-white/45 p-4 ring-1 ring-aura-hairline">
            <StatBar label="chemistry" value={cell.pairState.stats.chemistry} />
            <StatBar label="trust" value={cell.pairState.stats.trust} />
            <StatBar label="strain" value={cell.pairState.stats.strain} />
          </div>
        </div>

        <div className="space-y-3">
          <DetailGroup label="public risk notes" empty="No filed booking warnings.">
            {riskNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </DetailGroup>
          <DetailGroup label="internal rule hits" empty="No private rule hits.">
            {fit.internalRuleHits.map((hit) => (
              <li key={hit}>{hit}</li>
            ))}
          </DetailGroup>
        </div>
      </div>
    </LabPanel>
  );
}

function PairingStrip({
  focusMember,
  partner,
  scenario,
}: {
  focusMember: Member;
  partner: Member;
  scenario: DateScenario;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-white/55 px-4 py-3 ring-1 ring-aura-hairline">
      <PairPortrait member={focusMember} tone="rose" label="focus" />
      <CupidMark variant="glyph" className="size-7 shrink-0" />
      <PairPortrait member={partner} tone="violet" label="partner" />
      <div className="ml-auto flex flex-col items-end gap-1.5 text-right">
        <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
          cost {scenario.card.cost}
        </span>
        <ScenarioTraits card={scenario.card} />
      </div>
    </div>
  );
}

function PairPortrait({
  member,
  tone,
  label,
}: {
  member: Member;
  tone: "rose" | "violet";
  label: string;
}) {
  const ring = tone === "rose" ? "ring-aura-rose/45" : "ring-aura-violet/55";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className={`rounded-full ring-2 ${ring}`}>
        <Portrait member={member} variant="thumb" />
      </div>
      <div className="min-w-0">
        <span className="block font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
          {label}
        </span>
        <span className="block truncate font-display text-body font-semibold text-aura-ink">
          {member.firstName}
        </span>
      </div>
    </div>
  );
}

function DetailGroup({
  label,
  empty,
  children,
}: {
  label: string;
  empty: string;
  children: ReactNode;
}) {
  const list = Array.isArray(children) ? children : [children];
  const hasItems = list.some(Boolean);

  return (
    <section>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </p>
      {!hasItems ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <ul className="mt-2 space-y-2 rounded-card bg-white/55 p-3 text-sm leading-relaxed text-aura-muted ring-1 ring-aura-hairline">
          {children}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Glyphs and small readouts                                          */
/* ------------------------------------------------------------------ */

export function ScenarioTraits({ card }: { card: DateScenario["card"] }) {
  const items: readonly [string, TraitLevel][] = [
    ["R", card.risk],
    ["I", card.intimacy],
    ["C", card.chaos],
  ];
  return (
    <span className="inline-flex items-center gap-2.5">
      {items.map(([letter, level]) => (
        <span
          key={letter}
          className="inline-flex items-center gap-1"
          title={`${TRAIT_NAME[letter]} ${level}`}
        >
          <span className={`size-1.5 rounded-full ${TRAIT_DOT[level]}`} />
          <span className="font-mono text-micro font-semibold text-aura-faint">{letter}</span>
        </span>
      ))}
    </span>
  );
}

export function PressurePips({
  level,
  selected,
}: {
  level: MatchPressureLevel;
  selected: boolean;
}) {
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  const active = selected
    ? "bg-white"
    : level === "high"
      ? "bg-aura-rose"
      : level === "medium"
        ? "bg-amber-500"
        : "bg-emerald-500";
  const idle = selected ? "bg-white/25" : "bg-aura-ink/12";

  return (
    <span aria-hidden className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`h-1.5 w-3.5 rounded-pill ${index < filled ? active : idle}`}
        />
      ))}
    </span>
  );
}

export function AskBadge({ signal, selected }: { signal: MatchAskSignal; selected: boolean }) {
  if (signal === "none") {
    return (
      <span
        aria-hidden
        className={`size-2 rounded-full ${selected ? "bg-white/30" : "bg-aura-ink/15"}`}
      />
    );
  }

  const tone = selected ? "bg-white/15 text-white" : ASK_BADGE_TONE[signal];
  return (
    <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full ${tone}`}>
      <AskIcon signal={signal} />
    </span>
  );
}

function AskIcon({ signal }: { signal: Exclude<MatchAskSignal, "none"> }) {
  if (signal === "covered") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l4 4 10-10" />
      </svg>
    );
  }

  if (signal === "blocked") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="size-2.5" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}

export function BoundaryMarker({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-5 place-items-center rounded-full ${
        selected ? "bg-white/15 text-rose-200" : "bg-rose-100 text-aura-rose"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3.5l8.5 15h-17z" />
        <path d="M12 10v4" />
        <path d="M12 17.4v.01" />
      </svg>
    </span>
  );
}

export function RecommendedStar({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-5 place-items-center rounded-full ${
        selected ? "bg-white/15" : "bg-amber-100"
      }`}
    >
      <StarGlyph className={`size-3 ${selected ? "text-amber-200" : "text-amber-500"}`} />
    </span>
  );
}

export function CeilingMarker({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-5 place-items-center rounded-full ${
        selected ? "bg-white/15 text-white/80" : "bg-aura-ink/[0.07] text-aura-muted"
      }`}
    >
      <ChevronUpGlyph className="size-3" />
    </span>
  );
}

export function StarGlyph({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.2l2.9 6.1 6.7.7-5 4.5 1.4 6.6L12 17.6 6 20.1l1.4-6.6-5-4.5 6.7-.7z" />
    </svg>
  );
}

export function ChevronUpGlyph({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Visual class helpers                                               */
/* ------------------------------------------------------------------ */

export function cellClass(
  roomRead: ScenarioRoomRead,
  selected: boolean,
  marker: CellMarker,
): string {
  const base =
    "flex h-full min-h-28 w-full cursor-pointer flex-col justify-between rounded-tile px-3.5 py-3 text-left transition duration-200";

  if (selected) {
    return `${base} bg-aura-ink text-white ring-1 ring-aura-ink shadow-[0_24px_48px_-26px_rgba(15,23,42,0.85)]`;
  }

  const recommended = marker === "recommended";
  const ring = recommended ? "ring-2 ring-amber-300" : `ring-1 ${ROOM_READ_RING[roomRead]}`;
  const glow = recommended
    ? "shadow-[0_20px_46px_-26px_rgba(245,158,11,0.7)]"
    : ROOM_READ_GLOW[roomRead];

  return `${base} ${ROOM_READ_FILL[roomRead]} ${ring} ${glow} hover:-translate-y-0.5`;
}

export function roomReadLabelClass(roomRead: ScenarioRoomRead, selected: boolean): string {
  if (selected) {
    return "text-white/70";
  }
  return {
    promising: "text-emerald-700",
    steady: "text-aura-faint",
    volatile: "text-rose-700",
  }[roomRead];
}

export function deltaToneClass(value: number, selected: boolean): string {
  if (selected) {
    return value > 0 ? "text-emerald-300" : value < 0 ? "text-rose-300" : "text-white/70";
  }
  return value > 0 ? "text-emerald-600" : value < 0 ? "text-aura-rose" : "text-aura-faint";
}

export function roomReadTone(roomRead: ScenarioRoomRead): "good" | "warn" | "bad" | "neutral" {
  if (roomRead === "promising") return "good";
  if (roomRead === "volatile") return "bad";
  return "neutral";
}

/* ------------------------------------------------------------------ */
/* Data + utilities                                                   */
/* ------------------------------------------------------------------ */

export function cellKey(cell: MatrixCell): string {
  return `${cell.partner.id}:${cell.scenario.id}`;
}

export function formatDelta(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}

export function cellAriaLabel(cell: MatrixCell, selected: boolean, marker: CellMarker): string {
  const parts = [
    `${cell.partner.firstName} in ${cell.scenario.title}`,
    `${cell.roomRead} room`,
    `fit ${cell.fit.fitLevel}`,
    `pressure ${cell.fit.pressureLevel}`,
    `ask ${cell.fit.askSignal}`,
    `date health ${formatDelta(cell.fit.startingDateHealthDelta)}`,
  ];
  if (cell.fit.boundaryRisk !== null) parts.push("dealbreaker risk");
  if (marker === "recommended") parts.push("recommended booking");
  else if (marker === "ceiling") parts.push("strongest read");
  if (selected) parts.push("selected");
  return parts.join(", ");
}

export function summarize(cells: readonly MatrixCell[]): BoardSummary {
  let promising = 0;
  let steady = 0;
  let volatile = 0;
  let dealbreakers = 0;

  for (const cell of cells) {
    if (cell.roomRead === "promising") {
      promising += 1;
    } else if (cell.roomRead === "volatile") {
      volatile += 1;
    } else {
      steady += 1;
    }
    if (cell.fit.boundaryRisk !== null) {
      dealbreakers += 1;
    }
  }

  return { promising, steady, volatile, dealbreakers };
}

export function strongestPositiveCell(cells: readonly MatrixCell[]): MatrixCell | null {
  let best: MatrixCell | null = null;
  for (const cell of cells) {
    if (cell.fit.startingDateHealthDelta <= 0) {
      continue;
    }
    if (best === null || cell.fit.startingDateHealthDelta > best.fit.startingDateHealthDelta) {
      best = cell;
    }
  }
  return best;
}

export function buildCell({
  focusMember,
  partner,
  scenario,
  historyPreset,
}: {
  focusMember: Member;
  partner: Member;
  scenario: DateScenario;
  historyPreset: HistoryPreset;
}): MatrixCell {
  const request = currentRequestFor(focusMember);
  const pairState = buildPairState(focusMember, partner, scenario, historyPreset);
  const fit = evaluateMatchFit({
    members: [focusMember, partner],
    scenario,
    pairState,
    activeRequests: request === undefined ? [] : [request],
    knownPairReads: [],
  });

  return {
    partner,
    scenario,
    request,
    pairState,
    fit,
    roomRead: scenarioRoomReadFromMatchFit(fit),
  };
}

export function buildPairState(
  first: Member,
  second: Member,
  scenario: DateScenario,
  historyPreset: HistoryPreset,
): PairState {
  const warm = historyPreset === "warm";
  const brittle = historyPreset === "brittle";
  return pairStateSchema.parse({
    id: makePairId(first.id, second.id),
    participantIds: sortMemberIds(first.id, second.id),
    laneStatus: "open",
    stats: derivePairStats({
      chemistry: warm ? 76 : brittle ? 46 : 58,
      trust: warm ? 74 : brittle ? 38 : 55,
      stability: warm ? 72 : brittle ? 34 : 54,
      conflict: warm ? 18 : brittle ? 68 : 32,
      weirdnessTolerance: warm ? 78 : brittle ? 45 : 60,
      spark: warm ? 72 : brittle ? 42 : 56,
      strain: 0,
      relationshipHealth: 0,
    }),
    completedDateIds: warm || brittle ? ["date-match-fit-prior"] : [],
    scenarioUseCounts: brittle ? { [scenario.id]: 1 } : {},
    agreements: brittle
      ? [
          {
            id: "agreement-match-fit-broken",
            text: "No public archive questions.",
            status: "broken",
            sourceDateSessionId: "date-match-fit-prior",
            createdAt: "2026-05-22T18:00:00.000Z",
            resolvedAt: "2026-05-23T18:00:00.000Z",
          },
        ]
      : [],
    openLoops: brittle
      ? [
          {
            id: "open-loop-match-fit-repair",
            text: "Whether the pair can return without reopening the same public pressure.",
            status: "open",
            sourceDateSessionId: "date-match-fit-prior",
            createdAt: "2026-05-22T18:00:00.000Z",
          },
        ]
      : [],
  });
}

export function matrixScenarios(): DateScenario[] {
  const byId = new Map(starterScenarios.map((scenario) => [scenario.id, scenario] as const));
  const selected = MATRIX_SCENARIO_IDS.map((id) => byId.get(id)).filter(
    (scenario): scenario is DateScenario => scenario !== undefined,
  );
  return selected.length > 0 ? selected : starterScenarios.slice(0, 6);
}

export function matrixPartners(focusMemberId: string): Member[] {
  const byId = new Map(starterMembers.map((member) => [member.id, member] as const));
  const selected = MATRIX_PARTNER_IDS.map((id) => byId.get(id)).filter(
    (member): member is Member => member !== undefined && member.id !== focusMemberId,
  );
  if (selected.length >= 8) return selected;
  const fill = starterMembers
    .filter(
      (member) =>
        member.id !== focusMemberId &&
        member.state.status === "active" &&
        selected.every((entry) => entry.id !== member.id),
    )
    .slice(0, 8 - selected.length);
  return [...selected, ...fill];
}

export function requireMember(memberId: string): Member {
  const member = starterMembers.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Missing playground member ${memberId}`);
  }
  return member;
}

export function requireScenario(scenarioId: string): DateScenario {
  const scenario =
    starterScenarios.find((candidate) => candidate.id === scenarioId) ?? starterScenarios[0];
  if (scenario === undefined) {
    throw new Error(`Missing playground scenario ${scenarioId}`);
  }
  return scenario;
}
