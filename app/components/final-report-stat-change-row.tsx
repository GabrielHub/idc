import {
  MEMBER_RETENTION_WARNING_THRESHOLD,
  type DateSession,
  type GameSave,
} from "../domain/game";
import type { DateStatChange, MemberStateDelta } from "../services/date-stat-change";
import { AuraTooltip } from "./aura-tooltip";
import { Eyebrow } from "./dashboard-atoms";

const PAIR_STAT_LABEL: Partial<Record<string, string>> = {
  chemistry: "Chem",
  trust: "Trust",
  relationshipHealth: "Health",
  strain: "Strain",
  conflict: "Conflict",
  stability: "Stability",
  spark: "Spark",
  weirdnessTolerance: "Tol",
};

const PAIR_STAT_ORDER: readonly string[] = [
  "chemistry",
  "trust",
  "relationshipHealth",
  "strain",
  "conflict",
  "spark",
  "stability",
  "weirdnessTolerance",
];

export function FinalReportStatChangeRow({
  statChange,
  session,
  save,
}: {
  statChange: DateStatChange | undefined;
  session: DateSession;
  save: GameSave;
}) {
  if (statChange === undefined) return null;
  const pairDeltas = PAIR_STAT_ORDER.flatMap((key) => {
    const delta = statChange.pair[key as keyof typeof statChange.pair];
    if (delta === undefined || delta === 0) return [];
    return [{ key, label: PAIR_STAT_LABEL[key] ?? key, delta }];
  });

  const memberRows = session.participants.flatMap((memberId) => {
    const delta = statChange.members[memberId];
    const member = save.members.find((candidate) => candidate.id === memberId);
    if (delta === undefined || member === undefined) return [];
    if (delta.mood === 0 && delta.retention === 0 && delta.burnout === 0) return [];
    return [{ memberId, name: member.firstName, delta, retentionAfter: member.state.retention }];
  });

  if (pairDeltas.length === 0 && memberRows.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-col gap-2 border-t border-aura-hairline/70 pt-3">
      <Eyebrow>// stat changes</Eyebrow>
      {pairDeltas.length === 0 ? null : (
        <AuraTooltip
          placement="top"
          label="Pair stat deltas earned across the date's turns. Positive values move toward closure; conflict and strain are inverted (positive means worse)."
        >
          <div className="flex cursor-help flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-aura-ink/85">
            {pairDeltas.map((row, index) => (
              <span key={row.key} className="inline-flex items-center gap-1">
                <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
                  {row.label}
                </span>
                <DeltaPill
                  value={row.delta}
                  invert={row.key === "strain" || row.key === "conflict"}
                />
                {index < pairDeltas.length - 1 ? (
                  <span aria-hidden className="text-aura-hairline">
                    ·
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </AuraTooltip>
      )}
      {memberRows.length === 0 ? null : (
        <div className="flex flex-col gap-1">
          {memberRows.map((row) => (
            <MemberDeltaRow
              key={row.memberId}
              name={row.name}
              delta={row.delta}
              retentionAfter={row.retentionAfter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeltaPill({ value, invert = false }: { value: number; invert?: boolean }) {
  const isGood = invert ? value < 0 : value > 0;
  const isBad = invert ? value > 0 : value < 0;
  const tone = isGood ? "text-emerald-700" : isBad ? "text-rose-700" : "text-aura-muted";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`font-mono text-sm font-semibold ${tone}`}>
      {sign}
      {value}
    </span>
  );
}

function MemberDeltaRow({
  name,
  delta,
  retentionAfter,
}: {
  name: string;
  delta: MemberStateDelta;
  retentionAfter: number;
}) {
  const endedAtRisk = retentionAfter < MEMBER_RETENTION_WARNING_THRESHOLD && delta.retention < 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-aura-ink/85">
      <span className="min-w-[64px] font-display text-sm font-semibold text-aura-ink">{name}</span>
      <span className="inline-flex items-center gap-1">
        <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
          Mood
        </span>
        <DeltaPill value={delta.mood} />
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
          Confidence
        </span>
        <DeltaPill value={delta.retention} />
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
          Burnout
        </span>
        <DeltaPill value={delta.burnout} invert />
      </span>
      {endedAtRisk ? (
        <AuraTooltip
          placement="top"
          label={`${name}'s confidence dropped below ${MEMBER_RETENTION_WARNING_THRESHOLD}. Another rough date or missed ask will push them off the app. Cover their lead ask and book matches with healthy pair stats to recover.`}
        >
          <span className="inline-flex cursor-help items-center gap-1 rounded-pill bg-rose-100 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-rose-700 ring-1 ring-rose-300">
            <span aria-hidden className="size-1 rounded-full bg-rose-500" />
            at risk
          </span>
        </AuraTooltip>
      ) : null}
    </div>
  );
}
