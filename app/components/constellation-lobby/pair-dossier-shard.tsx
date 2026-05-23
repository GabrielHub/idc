/**
 * Compact pair-dossier shard rendered in the constellation lobby's SideRail
 * when a focus + partner pair is committed or an edge is being hovered.
 *
 * Surfaces:
 *   - participant portraits + names
 *   - Closure-ready pill when readyClosurePairIds carries this pair
 *   - top 3 public pair notes (scrubbed via scrubPlayerSafeCopy)
 *   - visible pair reads
 *
 * Reuses buildPairDossier from notes-view-helpers when the dossier path
 * applies (no board edge). For pairs that already have board edges,
 * derives the equivalent shape inline so the shard still surfaces info.
 * Clicking fires closure when the pair is ready, otherwise opens the Notes
 * glass overlay scoped to this pair.
 */

import { motion } from "motion/react";
import { useMemo } from "react";

import type { Member, MemoryRecord, PairState, PlayerKnowledgeRecord } from "../../domain/game";
import { scrubPlayerSafeCopy } from "../../services/player-safe-copy";
import { joinPairFirstNames } from "../notes-format";

export type PairDossierShardProps = {
  pairId: string;
  pairState: PairState | undefined;
  members: readonly Member[];
  memories: readonly MemoryRecord[];
  playerKnowledge: readonly PlayerKnowledgeRecord[];
  readyClosurePairIds: ReadonlySet<string>;
  onOpenNotes: (pairId: string) => void;
  onOpenClosure?: (pairId: string) => void;
};

type DossierShardData = {
  pairId: string;
  participants: [Member, Member];
  publicPairNotes: MemoryRecord[];
  pairReads: PlayerKnowledgeRecord[];
  closureReady: boolean;
};

export function PairDossierShard({
  pairId,
  pairState,
  members,
  memories,
  playerKnowledge,
  readyClosurePairIds,
  onOpenNotes,
  onOpenClosure,
}: PairDossierShardProps) {
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const data = useMemo<DossierShardData | null>(() => {
    if (pairState === undefined) return null;
    const first = memberById.get(pairState.participantIds[0]);
    const second = memberById.get(pairState.participantIds[1]);
    if (first === undefined || second === undefined) return null;
    const publicPairNotes: MemoryRecord[] = [];
    for (const memory of memories) {
      if (memory.pairId !== pairId) continue;
      if (memory.visibility !== "public") continue;
      if (memory.scope !== "pair" && memory.scope !== "date") continue;
      publicPairNotes.push(memory);
    }
    publicPairNotes.sort((left, right) => (left.createdAt < right.createdAt ? 1 : -1));
    const pairReads = playerKnowledge.filter(
      (record) => record.subjectKind === "pair" && record.subjectId === pairId,
    );
    return {
      pairId,
      participants: [first, second],
      publicPairNotes,
      pairReads,
      closureReady: readyClosurePairIds.has(pairId),
    };
  }, [pairId, pairState, memberById, memories, playerKnowledge, readyClosurePairIds]);

  if (data === null) return null;
  const [first, second] = data.participants;
  const title = joinPairFirstNames([first.firstName, second.firstName]) ?? first.firstName;
  const actionLabel =
    data.closureReady && onOpenClosure !== undefined
      ? `File closure for ${title}`
      : `Open notes for ${title}`;

  return (
    <motion.button
      type="button"
      onClick={() => {
        if (data.closureReady && onOpenClosure !== undefined) {
          onOpenClosure(pairId);
          return;
        }
        onOpenNotes(pairId);
      }}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.32, ease: [0.22, 0.8, 0.2, 1] }}
      className="pointer-events-auto cursor-pointer text-left aura-liquid-glass aura-liquid-glass-hover rounded-card px-4 py-3"
      aria-label={actionLabel}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
          pair dossier
        </div>
        {data.closureReady ? (
          <span className="inline-flex items-center gap-1 rounded-pill bg-aura-rose/95 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white">
            <span aria-hidden className="size-1 rounded-full bg-white/85" />
            closure ready
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 font-display text-display-sm text-aura-paper truncate">{title}</div>
      {data.publicPairNotes.length === 0 ? (
        <p className="mt-2 font-sans text-label text-white/65">
          No public pair notes yet. Tap to open the notes archive.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {data.publicPairNotes.slice(0, 3).map((note) => (
            <li
              key={note.id}
              className="line-clamp-2 font-sans text-label leading-snug text-white/80"
            >
              {scrubPlayerSafeCopy(note.text)}
            </li>
          ))}
        </ul>
      )}
      {data.pairReads.length === 0 ? null : (
        <div className="mt-3 border-t border-white/10 pt-2">
          <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
            pair reads
          </div>
          <ul className="mt-1 space-y-1">
            {data.pairReads.slice(0, 2).map((read) => (
              <li
                key={read.id}
                className="line-clamp-2 font-sans text-label leading-snug text-white/75"
              >
                {read.readText}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.button>
  );
}
