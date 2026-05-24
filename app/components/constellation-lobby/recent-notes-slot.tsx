/**
 * Recent-notes slot for the constellation lobby's HoverDetailCard. Surfaces
 * the 1-2 most recent player-visible memories that mention this member, with
 * scope palette ribbon, a clamped lead sentence, filed-on date, and the
 * standard importance dots. Pipes through scrubPlayerSafeCopy so no private
 * filing text reaches the hover card.
 *
 * Pulled into HoverDetailCard via its `recentNotesSlot?: ReactNode` prop.
 * Returns null when no visible memories mention the member so the slot stays
 * invisible on members with no filed history.
 */

import { useMemo } from "react";

import type { MemoryRecord } from "../../domain/game";
import { scrubPlayerSafeCopy } from "../../services/player-safe-copy";
import { formatNoteTimestamp, isPlayerVisibleNote, sortMemoriesNewestFirst } from "../notes-format";
import { paletteForMemory } from "../notes-palette";
import { splitLead } from "../../services/pair-archive-graph";

const MAX_VISIBLE_NOTES = 2;

export type RecentNotesSlotProps = {
  memberId: string;
  memories: readonly MemoryRecord[];
};

export function RecentNotesSlot({ memberId, memories }: RecentNotesSlotProps) {
  const recentNotes = useMemo(() => {
    return memories
      .filter(isPlayerVisibleNote)
      .filter((memory) => memory.subjectIds.includes(memberId))
      .sort(sortMemoriesNewestFirst)
      .slice(0, MAX_VISIBLE_NOTES);
  }, [memories, memberId]);

  if (recentNotes.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">
        recent notes
      </div>
      <ul className="space-y-2">
        {recentNotes.map((memory) => (
          <RecentNoteEntry key={memory.id} memory={memory} />
        ))}
      </ul>
    </div>
  );
}

function RecentNoteEntry({ memory }: { memory: MemoryRecord }) {
  const palette = paletteForMemory(memory);
  const { lead } = splitLead(scrubPlayerSafeCopy(memory.text));
  const importance = Math.max(0, Math.min(5, Math.round(memory.importance)));
  return (
    <li className="rounded-card border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] shadow-quiet ${palette.ribbon}`}
        >
          <span aria-hidden className="size-1 rounded-full bg-white/85" />
          {palette.label}
        </span>
        <span className="font-mono text-micro uppercase tracking-[0.2em] text-white/55">
          {formatNoteTimestamp(memory.createdAt)}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 font-sans text-label leading-snug text-white/85">{lead}</p>
      <div className="mt-2 flex items-center gap-1" aria-label={`Importance ${importance} of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className={`size-1 rounded-full ${i < importance ? "bg-aura-rose" : "bg-white/15"}`}
          />
        ))}
      </div>
    </li>
  );
}
