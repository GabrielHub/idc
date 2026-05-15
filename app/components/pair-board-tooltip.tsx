import { AnimatePresence, motion } from "motion/react";

import type { DateScenario, Member } from "../domain/game";
import { EASE_OUT_QUART, pad2, Portrait } from "./dashboard-atoms";
import {
  bezierMidpoint,
  describeRecency,
  nodeBaseRadius,
  type PairBoardGraph,
  type PairBoardPoint,
} from "./pair-board-layout";
import { ImportanceDots, splitLead, type ElementSize, type FieldHover } from "./pair-board-shared";

export function PairBoardTooltip({
  target,
  graph,
  size,
  memberById,
  scenarioById,
}: {
  target: FieldHover;
  graph: PairBoardGraph;
  size: ElementSize;
  memberById: Map<string, Member>;
  scenarioById: Map<string, DateScenario>;
}) {
  const now = Date.now();
  return (
    <AnimatePresence>
      {target.kind === "node" ? (
        <NodeTooltip
          key={`node-${target.memberId}`}
          memberId={target.memberId}
          graph={graph}
          size={size}
          now={now}
        />
      ) : target.kind === "edge" ? (
        <EdgeTooltip
          key={`edge-${target.pairId}`}
          pairId={target.pairId}
          graph={graph}
          size={size}
          memberById={memberById}
          scenarioById={scenarioById}
          now={now}
        />
      ) : null}
    </AnimatePresence>
  );
}

function NodeTooltip({
  memberId,
  graph,
  size,
  now,
}: {
  memberId: string;
  graph: PairBoardGraph;
  size: ElementSize;
  now: number;
}) {
  const node = graph.nodeById.get(memberId);
  if (node === undefined) return null;
  const noteSummary = graph.nodeNoteSummaryByNode.get(memberId);
  const latestNoteAt = noteSummary?.latestNoteAt ?? 0;
  const topImportance = noteSummary?.topImportance ?? 0;
  const recency = describeRecency(latestNoteAt, now);
  const radius = nodeBaseRadius(node.degree);
  const x = node.basePosition.x * size.width;
  const y = node.basePosition.y * size.height;
  const sideRight = x < size.width * 0.6;
  const offsetX = sideRight ? radius + 14 : -(radius + 14);
  const tooltipX = sideRight ? x + offsetX : x + offsetX - 248;
  const tooltipY = Math.max(8, y - 40);

  return (
    <motion.div
      className="aura-glass-strong pointer-events-none absolute z-30 w-[248px] rounded-card px-4 py-3 shadow-quiet ring-1 ring-aura-hairline"
      style={{ left: tooltipX, top: tooltipY }}
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 4 }}
      transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
      role="status"
    >
      <p className="font-display text-display-sm font-semibold leading-tight text-aura-ink">
        {node.member.firstName}
      </p>
      <p className="mt-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
        member file
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full"
          style={{ background: node.ringColor }}
        />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          {pad2(node.degree)} {node.degree === 1 ? "pair filed" : "pairs filed"} · {recency}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          top note
        </span>
        <ImportanceDots value={topImportance} />
      </div>
      <p className="mt-3 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
        click to open · esc closes
      </p>
    </motion.div>
  );
}

function EdgeTooltip({
  pairId,
  graph,
  size,
  memberById,
  scenarioById,
  now,
}: {
  pairId: string;
  graph: PairBoardGraph;
  size: ElementSize;
  memberById: Map<string, Member>;
  scenarioById: Map<string, DateScenario>;
  now: number;
}) {
  const edge = graph.edgeById.get(pairId);
  if (edge === undefined) return null;
  const a = resolvePosition(edge.a, graph);
  const b = resolvePosition(edge.b, graph);
  if (a === undefined || b === undefined) return null;
  const mid = bezierMidpoint(a, b, edge.curvature);
  const x = mid.x * size.width;
  const y = mid.y * size.height;
  const memberA = memberById.get(edge.a);
  const memberB = memberById.get(edge.b);
  if (memberA === undefined || memberB === undefined) return null;
  const recency = describeRecency(edge.latestNoteAt, now);
  const lead = splitLead(edge.latestNote.text).lead;
  const scenario =
    edge.latestNote.scenarioId === undefined
      ? undefined
      : scenarioById.get(edge.latestNote.scenarioId);

  const sideRight = x < size.width * 0.55;
  const tooltipX = sideRight ? x + 18 : x - 268;
  const tooltipY = Math.max(8, y - 36);

  return (
    <motion.div
      className="aura-glass-strong pointer-events-none absolute z-30 w-[260px] rounded-card px-4 py-3 shadow-quiet ring-1 ring-aura-hairline"
      style={{ left: tooltipX, top: tooltipY }}
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 4 }}
      transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
      role="status"
    >
      <div className="flex items-center gap-3">
        <div className="flex -space-x-3">
          <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
            <Portrait member={memberA} variant="thumb" />
          </span>
          <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
            <Portrait member={memberB} variant="thumb" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-display-sm font-semibold leading-tight text-aura-ink">
            {memberA.firstName} & {memberB.firstName}
          </p>
          <p className="mt-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
            {pad2(edge.noteCount)} {edge.noteCount === 1 ? "note" : "notes"} · {recency}
          </p>
        </div>
      </div>
      <p className="aura-accent mt-3 line-clamp-2 text-body leading-snug text-aura-ink/90">
        {lead}
      </p>
      {scenario === undefined ? null : (
        <p className="mt-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
          {scenario.title}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <ImportanceDots value={edge.topImportance} />
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          click to open
        </span>
      </div>
    </motion.div>
  );
}

function resolvePosition(memberId: string, graph: PairBoardGraph): PairBoardPoint | undefined {
  return graph.nodeById.get(memberId)?.basePosition;
}
