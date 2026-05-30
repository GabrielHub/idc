import type { Member } from "../../domain/game";
import { describeRecency, type PairArchiveEdge } from "../../services/pair-archive-graph";
import type { EdgeClosureDetail } from "../../services/edge-closure-detail";
import type { PairTrajectoryState } from "../../services/pair-trajectory";

const TRAJECTORY_COPY: Record<PairTrajectoryState, { label: string; tone: string }> = {
  closure_runway: { label: "On track to close", tone: "text-emerald-200" },
  warming: { label: "Warming up", tone: "text-emerald-200" },
  recovering: { label: "Recovering", tone: "text-amber-200" },
  steady: { label: "Holding steady", tone: "text-white/75" },
  stuck: { label: "Circling", tone: "text-amber-200" },
  brittle: { label: "Fragile", tone: "text-rose-200" },
};

/**
 * Hover glance for a constellation edge. This is the *peek*, not the read: the
 * two names, a one-line trajectory headline, and a thin closure bar tell the
 * player what this pair is and where it's heading at a glance. Clicking the
 * edge opens the full PairDossierShard with the per-axis breakdown, so the
 * tooltip deliberately omits the chem / trust / health / dates grid that used
 * to duplicate the dossier here.
 */
export function ArchiveEdgeTooltip({
  edge,
  memberById,
  detail,
}: {
  edge: PairArchiveEdge;
  memberById: ReadonlyMap<string, Member>;
  detail?: EdgeClosureDetail;
}) {
  const a = memberById.get(edge.a);
  const b = memberById.get(edge.b);
  if (a === undefined || b === undefined) return null;
  const recency = describeRecency(edge.latestNoteAt, Date.now());
  const ready = edge.closureProgress >= 100 && edge.closureBlockers.length === 0;
  const headline = resolveHeadline(edge, detail, ready);
  const progress = Math.max(0, Math.min(100, edge.closureProgress));

  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 w-[212px] -translate-x-1/2 aura-liquid-glass rounded-card px-3 py-2.5 leading-tight">
      <div className="font-display text-label text-aura-paper">
        {a.firstName} <span className="text-white/40">·</span> {b.firstName}
      </div>
      <div className={`mt-1 font-mono text-micro uppercase tracking-[0.18em] ${headline.tone}`}>
        {headline.label}
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between font-mono text-micro uppercase tracking-[0.18em] text-white/55">
          <span>{ready ? "closure ready" : "to closure"}</span>
          <span className={`tabular-nums ${ready ? "text-emerald-200" : "text-white/80"}`}>
            {progress}%
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/15">
          <div
            className={`h-full ${ready ? "bg-emerald-300/95" : "bg-aura-rose/85"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="mt-2 font-mono text-micro uppercase tracking-[0.16em] text-white/45">
        {recency} <span className="text-white/30">·</span> click to open
      </div>
    </div>
  );
}

/**
 * Trajectory headline. Uses the derived pair trajectory when the pair has
 * completed dates; otherwise falls back to a health-banded read so an edge
 * always carries a one-line "where it's heading" even before the detail rollup
 * exists.
 */
function resolveHeadline(
  edge: PairArchiveEdge,
  detail: EdgeClosureDetail | undefined,
  ready: boolean,
): { label: string; tone: string } {
  if (detail !== undefined) return TRAJECTORY_COPY[detail.trajectory];
  if (ready) return TRAJECTORY_COPY.closure_runway;
  if (edge.health >= 65) return TRAJECTORY_COPY.steady;
  if (edge.health >= 40) return TRAJECTORY_COPY.stuck;
  return TRAJECTORY_COPY.brittle;
}
