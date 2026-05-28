/**
 * Member-archive side-rail shard. Surfaces a focused member's filed pair
 * history: portrait + name, total count, and a list of incident pair edges
 * sorted by recency. Clicking an edge row switches archiveSelection to that
 * pair so the camera bisects it and the existing PairDossierShard takes
 * over the slot.
 *
 * Mounts in SideRail.pairDossierSlot only when viewMode === "archive" and
 * archiveSelection.kind === "member". Returns null when the member has no
 * filed pairs so the side rail collapses naturally.
 */

import { motion } from "motion/react";

import type { Member } from "../../domain/game";
import type { PairArchiveEdge } from "../../services/pair-archive-graph";
import { describeRecency } from "../../services/pair-archive-graph";
import { AuraButton } from "../aura-button";
import { avatarSrcsetFor } from "./math";

export type MemberArchiveShardProps = {
  focusMember: Member;
  /** Incident filed-pair edges in newest-first order. */
  incidentEdges: readonly PairArchiveEdge[];
  memberById: ReadonlyMap<string, Member>;
  onSelectPair: (pairId: string) => void;
};

export function MemberArchiveShard({
  focusMember,
  incidentEdges,
  memberById,
  onSelectPair,
}: MemberArchiveShardProps) {
  const now = Date.now();
  const portrait = avatarSrcsetFor(focusMember.id);
  return (
    <motion.div
      key="member-archive-shard"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.32, ease: [0.22, 0.8, 0.2, 1] }}
      className="pointer-events-auto aura-liquid-glass aura-liquid-glass-violet rounded-card px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-aura-violet/15 ring-2 ring-aura-violet/60">
          <img
            src={portrait.src}
            srcSet={portrait.srcset}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="font-mono text-micro uppercase tracking-[0.22em] text-aura-violet">
            focus · archive
          </div>
          <div className="mt-0.5 font-display text-display-sm truncate text-aura-paper">
            {focusMember.firstName}
          </div>
          <div className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
            {incidentEdges.length === 0
              ? "no pairs filed"
              : `${incidentEdges.length} ${incidentEdges.length === 1 ? "pair" : "pairs"} filed`}
          </div>
        </div>
      </div>

      {incidentEdges.length === 0 ? (
        <div className="mt-3 font-mono text-micro uppercase tracking-[0.18em] text-white/45">
          file a date with this member to draw a line.
        </div>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {incidentEdges.map((edge) => {
            const partnerId = edge.a === focusMember.id ? edge.b : edge.a;
            const partner = memberById.get(partnerId);
            if (partner === undefined) return null;
            return (
              <li key={edge.pairId}>
                <AuraButton
                  tooltip={`Open pair archive for ${partner.firstName}`}
                  tooltipPlacement="right"
                  tooltipAlign="block"
                  tooltipClassName="block w-full"
                  onClick={() => onSelectPair(edge.pairId)}
                  className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-tile bg-white/[0.04] px-3 py-2 text-left hover:bg-white/[0.09] transition"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-display text-label text-aura-paper">
                      {partner.firstName}
                    </span>
                    <span className="block truncate font-mono text-micro uppercase tracking-[0.18em] text-white/55">
                      {describeRecency(edge.latestNoteAt, now)} · {edge.noteCount}{" "}
                      {edge.noteCount === 1 ? "note" : "notes"}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="font-mono text-micro uppercase tracking-[0.18em] text-white/40 group-hover:text-aura-rose transition"
                  >
                    open
                  </span>
                </AuraButton>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
