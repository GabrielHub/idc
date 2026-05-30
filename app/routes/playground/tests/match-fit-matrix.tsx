import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { type DateScenario, type Member, type MemberRequest } from "../../../domain/game";
import {
  CupidMark,
  EASE_OUT_QUART,
  Hairline,
  MutedLabel,
  Portrait,
} from "../../../components/dashboard-atoms";
import { starterMembers } from "../../../fixtures";
import { buildPublicRiskNotes, chooseRecommendedMatchCandidate } from "../../../services/match-fit";
import { TestHeader } from "../shared";
import { LabButton, LabEntrance, LabPanel } from "./gameplay-lab-shared";
import { currentRequestFor } from "./gameplay-loop-lab-common";
import {
  AskBadge,
  BoundaryMarker,
  CeilingMarker,
  ChevronUpGlyph,
  MATRIX_PARTNER_IDS,
  MATRIX_SCENARIO_IDS,
  MatrixCellButton,
  PressurePips,
  ROOM_READ_DOT,
  RecommendedStar,
  ScenarioTraits,
  SelectedRead,
  StarGlyph,
  buildCell,
  cellKey,
  deltaToneClass,
  formatDelta,
  matrixPartners,
  matrixScenarios,
  requireMember,
  requireScenario,
  strongestPositiveCell,
  summarize,
  type BoardSummary,
  type CellMarker,
  type HistoryPreset,
  type MatrixCell,
} from "./match-fit-matrix-parts";

type SummaryTone = "good" | "neutral" | "bad" | "warn";

const HISTORY_PRESETS: readonly { id: HistoryPreset; label: string; hint: string }[] = [
  { id: "fresh", label: "Fresh", hint: "No pair history beyond member fixture pressure." },
  { id: "warm", label: "Warm", hint: "Useful history, lower conflict, prior successful room." },
  { id: "brittle", label: "Brittle", hint: "Broken agreement, open loop, repeat-room pressure." },
];

const SUMMARY_TONE: Record<SummaryTone, string> = {
  good: "bg-emerald-50/70 text-emerald-700 ring-emerald-200/70",
  neutral: "bg-white/60 text-aura-muted ring-aura-hairline",
  bad: "bg-rose-50/70 text-aura-rose ring-rose-200/70",
  warn: "bg-amber-50/70 text-amber-700 ring-amber-200/70",
};

export function MatchFitMatrixTest() {
  const [focusMemberId, setFocusMemberId] = useState<string>("jenna-pike");
  const [historyPreset, setHistoryPreset] = useState<HistoryPreset>("fresh");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(MATRIX_PARTNER_IDS[0]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(MATRIX_SCENARIO_IDS[0]);

  const focusMember = requireMember(focusMemberId);
  const focusCandidates = useMemo(
    () => starterMembers.filter((member) => member.state.status === "active"),
    [],
  );
  const scenarios = useMemo(() => matrixScenarios(), []);
  const partners = useMemo(() => matrixPartners(focusMember.id), [focusMember.id]);
  const focusRequest = currentRequestFor(focusMember);

  const cells = useMemo(
    () =>
      partners.map((partner) =>
        scenarios.map((scenario) => buildCell({ focusMember, partner, scenario, historyPreset })),
      ),
    [focusMember, historyPreset, partners, scenarios],
  );
  const flatCells = useMemo(() => cells.flat(), [cells]);
  const recommended = useMemo(
    () =>
      chooseRecommendedMatchCandidate(
        flatCells.map((cell) => ({ candidate: cell, fit: cell.fit })),
      ),
    [flatCells],
  );
  const recommendedKey = recommended === null ? null : cellKey(recommended);
  const topCell = useMemo(() => strongestPositiveCell(flatCells), [flatCells]);
  // The board always carries one best-booking anchor: the formal recommendation
  // when there is a clear winner, otherwise the strongest net-positive read.
  const ceilingKey = recommended === null && topCell !== null ? cellKey(topCell) : null;
  const summary = useMemo(() => summarize(flatCells), [flatCells]);

  const selectedPartner =
    partners.find((partner) => partner.id === selectedPartnerId) ??
    partners[0] ??
    requireMember("kade-sumner");
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ??
    scenarios[0] ??
    requireScenario("diner-eleven-pm");
  const selectedCell = buildCell({
    focusMember,
    partner: selectedPartner,
    scenario: selectedScenario,
    historyPreset,
  });
  const selectedKey = cellKey(selectedCell);
  const riskNotes = buildPublicRiskNotes({
    members: [focusMember, selectedPartner],
    scenario: selectedScenario,
    scenarioRepeatCount: selectedCell.pairState.scenarioUseCounts[selectedScenario.id] ?? 0,
    fitSignal: selectedCell.fit,
    focusRequests: selectedCell.request === undefined ? [] : [selectedCell.request],
  });

  function handleSelectCell(partnerId: string, scenarioId: string) {
    setSelectedPartnerId(partnerId);
    setSelectedScenarioId(scenarioId);
  }

  return (
    <LabEntrance className="space-y-6">
      <TestHeader
        title="Match fit matrix"
        description="Compare deterministic booking pressure across partners and rooms. Each tile glows with the filed room read and carries the hidden starting Date Health nudge."
      />

      <div className="grid gap-5 xl:grid-cols-[15.5rem_minmax(0,1fr)]">
        <FocusRail
          focusCandidates={focusCandidates}
          focusMemberId={focusMember.id}
          onSelectFocus={setFocusMemberId}
          historyPreset={historyPreset}
          onSelectHistory={setHistoryPreset}
        />

        <div className="min-w-0 space-y-5">
          <FocusHero
            focusMember={focusMember}
            request={focusRequest}
            summary={summary}
            recommended={recommended}
            topCell={topCell}
          />

          <LabPanel label="booking surface" title={`${focusMember.firstName} × every room`}>
            <p className="text-sm leading-relaxed text-aura-muted">
              Glow is the filed room read. The number is the hidden Date Health nudge. Pressure pips
              and the ask glyph ride the base of each tile; the gold star marks the recommended
              booking, the chevron marks the strongest read when no room clearly wins.
            </p>
            <BookingBoard
              focusMember={focusMember}
              scenarios={scenarios}
              partners={partners}
              cells={cells}
              recommendedKey={recommendedKey}
              ceilingKey={ceilingKey}
              selectedKey={selectedKey}
              onSelect={handleSelectCell}
            />
          </LabPanel>

          <SelectedRead
            focusMember={focusMember}
            partner={selectedPartner}
            scenario={selectedScenario}
            cell={selectedCell}
            riskNotes={riskNotes}
          />
        </div>
      </div>
    </LabEntrance>
  );
}

/* ------------------------------------------------------------------ */
/* Focus rail, the case switcher + presets + legend                   */
/* ------------------------------------------------------------------ */

function FocusRail({
  focusCandidates,
  focusMemberId,
  onSelectFocus,
  historyPreset,
  onSelectHistory,
}: {
  focusCandidates: readonly Member[];
  focusMemberId: string;
  onSelectFocus: (memberId: string) => void;
  historyPreset: HistoryPreset;
  onSelectHistory: (preset: HistoryPreset) => void;
}) {
  return (
    <aside className="aura-glass h-fit rounded-card p-4 xl:sticky xl:top-6 xl:self-start">
      <div className="flex items-center justify-between gap-3">
        <MutedLabel>focus case</MutedLabel>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {focusCandidates.length}
        </span>
      </div>

      <div className="mt-3 max-h-[19rem] space-y-1.5 overflow-y-auto pr-1">
        {focusCandidates.map((member) => {
          const active = member.id === focusMemberId;
          return (
            <button
              key={member.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectFocus(member.id)}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-tile px-2 py-1.5 text-left ring-1 transition ${
                active
                  ? "bg-aura-ink text-white ring-aura-ink shadow-[0_12px_26px_-20px_rgba(15,23,42,0.8)]"
                  : "bg-white/55 text-aura-ink ring-aura-hairline hover:bg-white/85"
              }`}
            >
              <Portrait member={member} variant="thumb" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-body font-semibold leading-tight">
                  {member.firstName}
                </span>
                <span
                  className={`block truncate font-mono text-micro uppercase tracking-[0.16em] ${
                    active ? "text-white/65" : "text-aura-faint"
                  }`}
                >
                  {member.id}
                </span>
              </span>
              {active ? (
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full bg-aura-rose aura-pulse"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <Hairline className="my-4" />

      <MutedLabel>pair history</MutedLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        {HISTORY_PRESETS.map((preset) => (
          <LabButton
            key={preset.id}
            label={preset.label}
            value={preset.id}
            activeValue={historyPreset}
            onSelect={onSelectHistory}
          />
        ))}
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-aura-muted">
        {HISTORY_PRESETS.find((preset) => preset.id === historyPreset)?.hint}
      </p>

      <Hairline className="my-4" />

      <Legend />
    </aside>
  );
}

function Legend() {
  return (
    <div className="space-y-3">
      <MutedLabel>legend</MutedLabel>

      <LegendBlock title="room read">
        <LegendRow
          swatch={<span className={`size-2.5 rounded-full ${ROOM_READ_DOT.promising}`} />}
          label="promising"
        />
        <LegendRow
          swatch={<span className={`size-2.5 rounded-full ${ROOM_READ_DOT.steady}`} />}
          label="steady"
        />
        <LegendRow
          swatch={<span className={`size-2.5 rounded-full ${ROOM_READ_DOT.volatile}`} />}
          label="volatile"
        />
      </LegendBlock>

      <LegendBlock title="markers">
        <LegendRow swatch={<RecommendedStar selected={false} />} label="recommended booking" />
        <LegendRow swatch={<CeilingMarker selected={false} />} label="strongest read" />
        <LegendRow swatch={<BoundaryMarker selected={false} />} label="dealbreaker risk" />
      </LegendBlock>

      <LegendBlock title="ask signal">
        <LegendRow swatch={<AskBadge signal="covered" selected={false} />} label="covered" />
        <LegendRow swatch={<AskBadge signal="uncertain" selected={false} />} label="uncertain" />
        <LegendRow swatch={<AskBadge signal="blocked" selected={false} />} label="blocked" />
      </LegendBlock>

      <LegendBlock title="pressure / room">
        <LegendRow
          swatch={<PressurePips level="medium" selected={false} />}
          label="low to high pips"
        />
        <LegendRow
          swatch={<span className="font-mono text-micro font-semibold text-aura-faint">R I C</span>}
          label="risk · intimacy · chaos"
        />
      </LegendBlock>
    </div>
  );
}

function LegendBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint/80">
        {title}
      </p>
      <div className="mt-1.5 space-y-1.5">{children}</div>
    </div>
  );
}

function LegendRow({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-5 shrink-0 place-items-center">{swatch}</span>
      <span className="text-sm text-aura-muted">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Focus hero, portrait + ask + glanceable booking summary            */
/* ------------------------------------------------------------------ */

function FocusHero({
  focusMember,
  request,
  summary,
  recommended,
  topCell,
}: {
  focusMember: Member;
  request: MemberRequest | undefined;
  summary: BoardSummary;
  recommended: MatrixCell | null;
  topCell: MatrixCell | null;
}) {
  return (
    <section className="aura-glass rounded-card p-5 sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-5">
          <div className="relative shrink-0">
            <span
              aria-hidden
              className="absolute -inset-2 rounded-full bg-gradient-to-br from-aura-mesh-rose/70 to-aura-mesh-violet/55 opacity-70 blur-xl"
            />
            <div className="relative">
              <Portrait member={focusMember} variant="card" priority />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
              focus case
            </p>
            <h3 className="mt-1 font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
              {focusMember.name}
            </h3>
            <p className="mt-1 text-sm text-aura-muted">
              {focusMember.species} · {focusMember.origin}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {focusMember.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </div>
            <AskCard request={request} />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 xl:max-w-[30rem]">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <SummaryStat label="promising" value={summary.promising} tone="good" />
            <SummaryStat label="steady" value={summary.steady} tone="neutral" />
            <SummaryStat label="volatile" value={summary.volatile} tone="bad" />
            <SummaryStat label="dealbreakers" value={summary.dealbreakers} tone="warn" />
          </div>
          <RecommendedCallout recommended={recommended} topCell={topCell} />
        </div>
      </div>
    </section>
  );
}

function TagChip({ tag }: { tag: string }) {
  return (
    <span className="rounded-pill bg-white/60 px-2.5 py-0.5 font-mono text-micro font-medium uppercase tracking-[0.14em] text-aura-muted ring-1 ring-aura-hairline">
      {tag.replace(/_/g, " ")}
    </span>
  );
}

function AskCard({ request }: { request: MemberRequest | undefined }) {
  return (
    <div className="mt-3 rounded-tile bg-aura-rose/[0.05] px-3.5 py-2.5 ring-1 ring-rose-200/60">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-rose">
        current ask
      </p>
      <p className="mt-1 text-sm leading-relaxed text-aura-ink">
        {request === undefined ? "No active ask on file." : request.text}
      </p>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: SummaryTone }) {
  return (
    <div className={`rounded-tile px-3 py-2.5 ring-1 ${SUMMARY_TONE[tone]}`}>
      <p className="font-display text-2xl font-semibold leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 font-mono text-micro font-semibold uppercase tracking-[0.16em]">
        {label}
      </p>
    </div>
  );
}

function RecommendedCallout({
  recommended,
  topCell,
}: {
  recommended: MatrixCell | null;
  topCell: MatrixCell | null;
}) {
  if (recommended !== null) {
    return (
      <BestBookingCallout
        tone="gold"
        icon={<StarGlyph className="size-4 text-amber-500" />}
        eyebrow="recommended booking"
        cell={recommended}
      />
    );
  }

  if (topCell !== null) {
    return (
      <BestBookingCallout
        tone="neutral"
        icon={<ChevronUpGlyph className="size-4 text-aura-muted" />}
        eyebrow="strongest read · no clear winner"
        cell={topCell}
      />
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-tile border border-dashed border-aura-hairline-strong bg-white/40 px-4 py-3">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-white/70 ring-1 ring-aura-hairline"
      >
        <CupidMark variant="glyph" className="size-5" />
      </span>
      <div>
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-faint">
          best booking
        </p>
        <p className="mt-0.5 text-sm text-aura-muted">
          No room reads positive. Every booking here starts underwater.
        </p>
      </div>
    </div>
  );
}

function BestBookingCallout({
  tone,
  icon,
  eyebrow,
  cell,
}: {
  tone: "gold" | "neutral";
  icon: React.ReactNode;
  eyebrow: string;
  cell: MatrixCell;
}) {
  const shell =
    tone === "gold"
      ? "bg-gradient-to-r from-amber-50 to-amber-50/30 ring-amber-200/80"
      : "bg-white/55 ring-aura-hairline";
  const badge = tone === "gold" ? "bg-amber-100" : "bg-aura-ink/[0.06]";
  const eyebrowTone = tone === "gold" ? "text-amber-700" : "text-aura-faint";

  return (
    <div className={`flex items-center gap-3 rounded-tile px-4 py-3 ring-1 ${shell}`}>
      <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-full ${badge}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`font-mono text-micro font-semibold uppercase tracking-[0.2em] ${eyebrowTone}`}
        >
          {eyebrow}
        </p>
        <p className="mt-0.5 truncate font-display text-body font-semibold text-aura-ink">
          {cell.partner.firstName} · {cell.scenario.title}
        </p>
      </div>
      <span
        className={`shrink-0 font-display text-2xl font-semibold tabular-nums ${deltaToneClass(
          cell.fit.startingDateHealthDelta,
          false,
        )}`}
      >
        {formatDelta(cell.fit.startingDateHealthDelta)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The board, partner rows × scenario columns of luminous tiles       */
/* ------------------------------------------------------------------ */

function BookingBoard({
  focusMember,
  scenarios,
  partners,
  cells,
  recommendedKey,
  ceilingKey,
  selectedKey,
  onSelect,
}: {
  focusMember: Member;
  scenarios: readonly DateScenario[];
  partners: readonly Member[];
  cells: readonly (readonly MatrixCell[])[];
  recommendedKey: string | null;
  ceilingKey: string | null;
  selectedKey: string;
  onSelect: (partnerId: string, scenarioId: string) => void;
}) {
  return (
    <div className="mt-4 overflow-x-auto pb-1">
      <table
        aria-label={`Booking surface for ${focusMember.firstName}`}
        className="w-full min-w-[62rem] table-fixed border-separate border-spacing-2"
      >
        <colgroup>
          <col className="w-[12.5rem]" />
          {scenarios.map((scenario) => (
            <col key={scenario.id} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="px-1 pb-2 text-left align-bottom">
              <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                partner
              </span>
            </th>
            {scenarios.map((scenario) => (
              <th key={scenario.id} className="px-1 pb-2 text-left align-bottom">
                <span className="block font-mono text-micro font-semibold uppercase leading-[1.2] tracking-[0.12em] text-aura-faint">
                  {scenario.title}
                </span>
                <span className="mt-1.5 block">
                  <ScenarioTraits card={scenario.card} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {partners.map((partner, rowIndex) => {
            const rowCells = cells[rowIndex] ?? [];
            return (
              <motion.tr
                key={partner.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(rowIndex * 0.03, 0.28),
                  duration: 0.4,
                  ease: EASE_OUT_QUART,
                }}
              >
                <th
                  scope="row"
                  className="rounded-tile bg-white/55 px-2.5 py-2.5 text-left align-middle ring-1 ring-aura-hairline"
                >
                  <div className="flex items-center gap-2.5">
                    <Portrait member={partner} variant="thumb" />
                    <div className="min-w-0">
                      <span className="block truncate font-display text-body font-semibold leading-tight text-aura-ink">
                        {partner.firstName}
                      </span>
                      <span className="block truncate font-mono text-micro uppercase tracking-[0.16em] text-aura-faint">
                        {partner.id}
                      </span>
                    </div>
                  </div>
                </th>
                {rowCells.map((cell) => {
                  const key = cellKey(cell);
                  const marker: CellMarker =
                    key === recommendedKey
                      ? "recommended"
                      : key === ceilingKey
                        ? "ceiling"
                        : "none";
                  return (
                    <td key={key} className="align-stretch">
                      <MatrixCellButton
                        cell={cell}
                        selected={key === selectedKey}
                        marker={marker}
                        onSelect={() => onSelect(cell.partner.id, cell.scenario.id)}
                      />
                    </td>
                  );
                })}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
