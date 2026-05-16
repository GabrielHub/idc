import { motion } from "motion/react";
import { useEffect, useMemo } from "react";

import type { GameSave, Member, MemoryRecord, PairState } from "../domain/game";
import { isPairClosureMemory } from "../services/closures";
import { Eyebrow, Hairline, Portrait, PrimaryButton } from "./dashboard-atoms";
import { useSfx } from "./sfx-provider";

export type SoftWinCutsceneProps = {
  save: GameSave;
  isActionPending: boolean;
  onContinue: () => void;
};

type ClosureEntry = {
  memory: MemoryRecord;
  pairState: PairState;
  participants: [Member, Member];
};

export function SoftWinCutscene({ save, isActionPending, onContinue }: SoftWinCutsceneProps) {
  const { play } = useSfx();
  const entries = useMemo(() => collectClosureEntries(save), [save]);
  const closureCount = save.closureCount;

  useEffect(() => {
    play("triumph");
  }, [play]);

  return (
    <motion.div
      role="dialog"
      aria-label="Cupid received a promotion"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-aura-ink/85 px-6 py-12 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        className="aura-glass-strong w-full max-w-4xl rounded-card bg-white p-10 shadow-aura-soft"
      >
        <Eyebrow>// internal.bulletin</Eyebrow>
        <h1 className="mt-3 font-display text-display-lg font-semibold leading-tight tracking-tight text-aura-ink">
          Cupid received a promotion.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-aura-muted">
          Five pairs closed their files this quarter. HR forwarded the news with a new title and the
          same desk. The office continues.
        </p>

        <Hairline className="my-8" />

        <ul className="space-y-6">
          {entries.slice(0, 5).map((entry) => (
            <li
              key={entry.memory.id}
              className="rounded-card border border-aura-hairline bg-aura-cream-soft p-5 shadow-quiet"
            >
              <div className="flex items-start gap-4">
                <div className="flex -space-x-4">
                  {entry.participants.map((member, index) => (
                    <span
                      key={member.id}
                      className={`rounded-full border-2 border-white/90 bg-white shadow-quiet ${
                        index === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"
                      }`}
                    >
                      <Portrait member={member} variant="card" />
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-rose">
                    Case closed
                  </p>
                  <h2 className="mt-1 font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
                    {entry.participants[0].firstName} and {entry.participants[1].firstName}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-aura-ink/85">
                    {entry.memory.text}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            {closureCount} closure{closureCount === 1 ? "" : "s"} on file. The office continues.
          </p>
          <PrimaryButton onClick={onContinue} disabled={isActionPending}>
            Continue →
          </PrimaryButton>
        </div>
      </motion.section>
    </motion.div>
  );
}

function collectClosureEntries(save: GameSave): ClosureEntry[] {
  const pairStateById = new Map(save.pairStates.map((pair) => [pair.id, pair] as const));
  const memberById = new Map(save.members.map((member) => [member.id, member] as const));
  const entries: ClosureEntry[] = [];

  for (const memory of save.memories) {
    if (!isPairClosureMemory(memory)) continue;
    if (memory.pairId === undefined) continue;
    const pairState = pairStateById.get(memory.pairId);
    if (pairState === undefined) continue;
    const [firstId, secondId] = pairState.participantIds;
    const first = memberById.get(firstId);
    const second = memberById.get(secondId);
    if (first === undefined || second === undefined) continue;
    entries.push({ memory, pairState, participants: [first, second] });
  }

  return entries.sort((a, b) =>
    a.memory.createdAt === b.memory.createdAt
      ? 0
      : a.memory.createdAt < b.memory.createdAt
        ? -1
        : 1,
  );
}
