import type { Member } from "../../domain/game";
import { describeRecency, type PairArchiveEdge } from "../../services/pair-archive-graph";
import { CLOSURE_THRESHOLD } from "../../services/closures";

export function ArchiveEdgeTooltip({
  edge,
  memberById,
}: {
  edge: PairArchiveEdge;
  memberById: ReadonlyMap<string, Member>;
}) {
  const a = memberById.get(edge.a);
  const b = memberById.get(edge.b);
  if (a === undefined || b === undefined) return null;
  const recency = describeRecency(edge.latestNoteAt, Date.now());
  const blockerSet = new Set(edge.closureBlockers);
  const axes: Array<{ label: string; value: number; threshold: number; key: string }> = [
    {
      label: "Chem",
      value: edge.chemistry,
      threshold: CLOSURE_THRESHOLD.chemistry,
      key: "chemistry",
    },
    { label: "Trust", value: edge.trust, threshold: CLOSURE_THRESHOLD.trust, key: "trust" },
    {
      label: "Health",
      value: edge.health,
      threshold: CLOSURE_THRESHOLD.relationshipHealth,
      key: "health",
    },
  ];
  const ready = edge.closureProgress >= 100 && edge.closureBlockers.length === 0;
  return (
    <div className="pointer-events-none absolute left-3 top-3 aura-liquid-glass min-w-[180px] max-w-[260px] rounded-card px-3 py-2 leading-tight">
      <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
        constellation
      </div>
      <div className="mt-1 font-display text-label text-aura-paper">
        {a.firstName} <span className="text-white/45">·</span> {b.firstName}
      </div>
      <div className="mt-1 font-mono text-micro uppercase tracking-[0.18em] text-white/55">
        {recency} · {edge.noteCount} {edge.noteCount === 1 ? "note" : "notes"}
      </div>
      <div className="mt-2 border-t border-white/15 pt-2">
        <div className="flex items-center justify-between font-mono text-micro uppercase tracking-[0.18em] text-white/65">
          <span>{ready ? "closure ready" : "closure progress"}</span>
          <span className={`tabular-nums ${ready ? "text-emerald-200" : "text-white/80"}`}>
            {edge.closureProgress}%
          </span>
        </div>
        <ul className="mt-1.5 flex flex-col gap-0.5 font-mono text-micro text-white/85">
          {axes.map((axis) => {
            const met = axis.value >= axis.threshold;
            const tone = met
              ? "text-emerald-200"
              : blockerSet.has(axis.key)
                ? "text-rose-200"
                : "text-white/85";
            return (
              <li key={axis.key} className="flex items-center justify-between">
                <span className="text-white/70">{axis.label}</span>
                <span className={`tabular-nums ${tone}`}>
                  {axis.value} / {axis.threshold}
                </span>
              </li>
            );
          })}
          <li className="flex items-center justify-between">
            <span className="text-white/70">Dates</span>
            <span
              className={`tabular-nums ${
                edge.datesCompleted >= edge.datesNeeded ? "text-emerald-200" : "text-white/85"
              }`}
            >
              {edge.datesCompleted} / {edge.datesNeeded}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
