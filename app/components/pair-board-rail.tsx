import { motion } from "motion/react";
import { useEffect, useState } from "react";

import type { DateScenario, MemoryRecord, Member } from "../domain/game";
import { EASE_OUT_QUART, pad2, Portrait } from "./dashboard-atoms";
import { describeRecency, type PairBoardGraph } from "./pair-board-layout";
import {
  FALLBACK_EDGE_COLOR_A,
  FALLBACK_EDGE_COLOR_B,
  ImportanceDots,
  splitLead,
  type ActivePairBoardSelection,
} from "./pair-board-shared";

export function PairBoardRail({
  selection,
  graph,
  memberById,
  scenarioById,
  onClose,
  onSelectEdge,
  onSelectNode,
}: {
  selection: ActivePairBoardSelection;
  graph: PairBoardGraph;
  memberById: Map<string, Member>;
  scenarioById: Map<string, DateScenario>;
  onClose: () => void;
  onSelectEdge: (pairId: string) => void;
  onSelectNode: (memberId: string) => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const now = Date.now();

  return (
    <motion.aside
      className="aura-glass-strong absolute right-3 top-3 bottom-3 z-40 flex w-[clamp(320px,40%,420px)] flex-col overflow-hidden rounded-card shadow-quiet ring-1 ring-aura-hairline"
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.28, ease: EASE_OUT_QUART }}
      role="dialog"
      aria-modal={false}
      aria-label={selection.kind === "node" ? "Member connections" : "Pair file"}
      data-pair-board-interactive="rail"
    >
      <header className="flex items-start justify-between gap-3 border-b border-aura-hairline px-5 py-4">
        <div className="space-y-1">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
            {selection.kind === "node" ? "// member · connections" : "// pair · file"}
          </p>
          <p className="font-display text-display-sm font-semibold leading-tight text-aura-ink">
            {selection.kind === "node"
              ? (memberById.get(selection.memberId)?.firstName ?? "?")
              : pairTitleFor(selection.pairId, graph, memberById)}
          </p>
        </div>
        <button
          type="button"
          data-sfx="click"
          onClick={onClose}
          aria-label="Close detail panel"
          className="cursor-pointer rounded-pill bg-white/60 px-2.5 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted ring-1 ring-aura-hairline transition hover:text-aura-ink"
        >
          close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {selection.kind === "node" ? (
          <NodeDetailBody
            memberId={selection.memberId}
            graph={graph}
            memberById={memberById}
            now={now}
            onSelectEdge={onSelectEdge}
          />
        ) : (
          <EdgeDetailBody
            pairId={selection.pairId}
            graph={graph}
            memberById={memberById}
            scenarioById={scenarioById}
            now={now}
            onSelectNode={onSelectNode}
          />
        )}
      </div>
    </motion.aside>
  );
}

function NodeDetailBody({
  memberId,
  graph,
  memberById,
  now,
  onSelectEdge,
}: {
  memberId: string;
  graph: PairBoardGraph;
  memberById: Map<string, Member>;
  now: number;
  onSelectEdge: (pairId: string) => void;
}) {
  const member = memberById.get(memberId);
  if (member === undefined) return null;
  const incidentSource = graph.incidentEdgesByNode.get(memberId) ?? [];
  const incident = [...incidentSource].sort(
    (left, right) => right.latestNoteAt - left.latestNoteAt,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="rounded-full border-2 border-white/90 bg-white shadow-quiet"
          style={{
            boxShadow: `0 0 0 3px ${member.chatBubble?.accentColor ?? FALLBACK_EDGE_COLOR_A}55`,
          }}
        >
          <Portrait member={member} variant="card" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
            member file
          </p>
          <p className="mt-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
            {pad2(incident.length)}{" "}
            {incident.length === 1 ? "filed connection" : "filed connections"}
          </p>
        </div>
      </div>

      {incident.length === 0 ? (
        <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          No filed connections yet.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {incident.map((edge) => {
            const partnerId = edge.a === memberId ? edge.b : edge.a;
            const partner = memberById.get(partnerId);
            if (partner === undefined) return null;
            const noteCount = (graph.notesByPair.get(edge.pairId) ?? []).length;
            return (
              <li key={edge.pairId}>
                <button
                  type="button"
                  data-sfx="click"
                  onClick={() => onSelectEdge(edge.pairId)}
                  className="aura-glass aura-glass-lift group flex w-full cursor-pointer items-center gap-3 rounded-card px-3 py-2.5 text-left ring-1 ring-aura-hairline transition"
                >
                  <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
                    <Portrait member={partner} variant="thumb" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lead font-semibold text-aura-ink">
                      with {partner.firstName}
                    </span>
                    <span className="mt-0.5 block font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
                      {pad2(noteCount)} {noteCount === 1 ? "note" : "notes"} ·{" "}
                      {describeRecency(edge.latestNoteAt, now)}
                    </span>
                  </span>
                  <ImportanceDots value={edge.topImportance} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EdgeDetailBody({
  pairId,
  graph,
  memberById,
  scenarioById,
  now,
  onSelectNode,
}: {
  pairId: string;
  graph: PairBoardGraph;
  memberById: Map<string, Member>;
  scenarioById: Map<string, DateScenario>;
  now: number;
  onSelectNode: (memberId: string) => void;
}) {
  const edge = graph.edgeById.get(pairId);
  if (edge === undefined) return null;
  const memberA = memberById.get(edge.a);
  const memberB = memberById.get(edge.b);
  if (memberA === undefined || memberB === undefined) return null;
  const notes = sortNotesByCreatedDesc(graph.notesByPair.get(pairId) ?? []);

  return (
    <div className="space-y-5">
      <div className="flex items-stretch gap-3">
        <PairFaceCard
          member={memberA}
          accent={memberA.chatBubble?.accentColor ?? FALLBACK_EDGE_COLOR_A}
          onSelect={() => onSelectNode(memberA.id)}
        />
        <ConnectionThread />
        <PairFaceCard
          member={memberB}
          accent={memberB.chatBubble?.accentColor ?? FALLBACK_EDGE_COLOR_B}
          onSelect={() => onSelectNode(memberB.id)}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <RailMini label="notes" value={pad2(edge.noteCount)} />
        <RailMini label="top note" value={`${edge.topImportance}/05`} />
        <RailMini label="latest" value={describeRecency(edge.latestNoteAt, now)} />
      </div>

      {notes.length === 0 ? (
        <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          No filed notes yet.
        </p>
      ) : (
        <NoteThread notes={notes} scenarioById={scenarioById} />
      )}
    </div>
  );
}

function PairFaceCard({
  member,
  accent,
  onSelect,
}: {
  member: Member;
  accent: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-sfx="click"
      onClick={onSelect}
      className="aura-glass aura-glass-lift group relative flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-card px-2 py-3 text-center ring-1 ring-aura-hairline transition focus:outline-none"
      style={{ boxShadow: `inset 0 0 0 1px ${accent}33` }}
    >
      <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
        <Portrait member={member} variant="card" />
      </span>
      <span className="font-display text-lead font-semibold leading-tight text-aura-ink">
        {member.firstName}
      </span>
      <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
        focus member
      </span>
      <span
        aria-hidden
        className="absolute inset-x-3 bottom-0 h-0.5 rounded-pill"
        style={{ background: accent }}
      />
    </button>
  );
}

function ConnectionThread() {
  return (
    <div aria-hidden className="flex w-12 flex-col items-center justify-center gap-1.5">
      <span className="size-1.5 rounded-full bg-aura-rose" />
      <span className="h-12 w-px bg-gradient-to-b from-aura-rose via-aura-fuchsia to-aura-violet" />
      <span className="size-1.5 rounded-full bg-aura-violet" />
    </div>
  );
}

function RailMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="aura-glass rounded-card px-2.5 py-2 text-center ring-1 ring-aura-hairline">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        {label}
      </p>
      <p className="mt-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink">
        {value}
      </p>
    </div>
  );
}

function NoteThread({
  notes,
  scenarioById,
}: {
  notes: MemoryRecord[];
  scenarioById: Map<string, DateScenario>;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    notes[0] ? new Set([notes[0].id]) : new Set(),
  );

  return (
    <ol className="relative space-y-3 pl-4">
      <span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 w-px bg-gradient-to-b from-aura-rose/45 via-aura-hairline-strong to-transparent"
      />
      {notes.map((note) => {
        const isOpen = expanded.has(note.id);
        const scenario =
          note.scenarioId === undefined ? undefined : scenarioById.get(note.scenarioId);
        const dateLabel = formatRailTimestamp(note.createdAt);
        const { lead, tail } = splitLead(note.text);
        return (
          <li key={note.id} className="relative">
            <span
              aria-hidden
              className="absolute left-[-13px] top-2.5 size-2.5 rounded-full bg-aura-rose ring-4 ring-aura-paper"
            />
            <button
              type="button"
              data-sfx="click"
              onClick={() => {
                setExpanded((current) => {
                  const next = new Set(current);
                  if (next.has(note.id)) next.delete(note.id);
                  else next.add(note.id);
                  return next;
                });
              }}
              aria-expanded={isOpen}
              className="aura-glass group flex w-full cursor-pointer flex-col gap-1.5 rounded-card px-3.5 py-3 text-left ring-1 ring-aura-hairline transition hover:ring-aura-rose/35"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                  {dateLabel}
                </span>
                <ImportanceDots value={note.importance} />
              </div>
              {scenario === undefined ? null : (
                <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
                  {scenario.title}
                </span>
              )}
              <p
                className={`aura-accent text-body leading-snug text-aura-ink/90 ${isOpen ? "" : "line-clamp-2"}`}
              >
                {lead}
              </p>
              {isOpen && tail.length > 0 ? (
                <p className="text-body leading-relaxed text-aura-ink/80">{tail}</p>
              ) : null}
              {note.tags.length === 0 || !isOpen ? null : (
                <ul className="mt-1 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-pill bg-white/65 px-2 py-0.5 ring-1 ring-aura-hairline"
                    >
                      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
                        {tag}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
                {isOpen ? "collapse" : "expand"}
                <span aria-hidden>{isOpen ? "↑" : "↓"}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function pairTitleFor(
  pairId: string,
  graph: PairBoardGraph,
  memberById: Map<string, Member>,
): string {
  const edge = graph.edgeById.get(pairId);
  if (edge === undefined) return pairId;
  const a = memberById.get(edge.a)?.firstName ?? edge.a;
  const b = memberById.get(edge.b)?.firstName ?? edge.b;
  return `${a} & ${b}`;
}

function sortNotesByCreatedDesc(notes: readonly MemoryRecord[]): MemoryRecord[] {
  return notes
    .map((note) => ({ note, t: Date.parse(note.createdAt) }))
    .sort((left, right) => right.t - left.t)
    .map(({ note }) => note);
}

function formatRailTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
