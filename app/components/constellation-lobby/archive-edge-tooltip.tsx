import type { Member } from "../../domain/game";
import { describeRecency, type PairBoardEdge } from "../pair-board-layout";

export function ArchiveEdgeTooltip({
  edge,
  memberById,
}: {
  edge: PairBoardEdge;
  memberById: ReadonlyMap<string, Member>;
}) {
  const a = memberById.get(edge.a);
  const b = memberById.get(edge.b);
  if (a === undefined || b === undefined) return null;
  const recency = describeRecency(edge.latestNoteAt, Date.now());
  return (
    <div className="pointer-events-none absolute left-3 top-3 min-w-[160px] max-w-[220px] aura-liquid-glass rounded-card px-3 py-2 leading-tight">
      <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
        constellation
      </div>
      <div className="mt-1 font-display text-label text-aura-paper">
        {a.firstName} <span className="text-white/45">·</span> {b.firstName}
      </div>
      <div className="mt-1 font-mono text-micro uppercase tracking-[0.18em] text-white/55">
        {recency} · {edge.noteCount} {edge.noteCount === 1 ? "note" : "notes"}
      </div>
    </div>
  );
}
