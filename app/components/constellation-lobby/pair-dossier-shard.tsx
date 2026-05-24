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

import type {
  Member,
  MemoryRecord,
  OpenLoop,
  PairAgreement,
  PairState,
  PlayerKnowledgeRecord,
} from "../../domain/game";
import { starterScenarios } from "../../fixtures";
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
  health: number;
  datesCompleted: number;
  lastScenarioTitle: string | null;
  activeAgreements: PairAgreement[];
  openLoops: OpenLoop[];
};

const SCENARIO_TITLE_BY_ID: ReadonlyMap<string, string> = new Map(
  starterScenarios.map((scenario) => [scenario.id, scenario.title]),
);

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
    const lastScenarioId = publicPairNotes[0]?.scenarioId ?? pickTopScenarioId(pairState);
    const lastScenarioTitle =
      lastScenarioId === undefined ? null : (SCENARIO_TITLE_BY_ID.get(lastScenarioId) ?? null);
    const activeAgreements = pairState.agreements
      .filter((agreement) => agreement.status === "active")
      .slice(0, 2);
    const openLoops = pairState.openLoops.filter((loop) => loop.status === "open").slice(0, 2);
    return {
      pairId,
      participants: [first, second],
      publicPairNotes,
      pairReads,
      closureReady: readyClosurePairIds.has(pairId),
      health: pairState.stats.relationshipHealth,
      datesCompleted: pairState.completedDateIds.length,
      lastScenarioTitle,
      activeAgreements,
      openLoops,
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
      <DossierStatsStrip
        health={data.health}
        datesCompleted={data.datesCompleted}
        lastScenarioTitle={data.lastScenarioTitle}
      />
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
      {data.activeAgreements.length === 0 ? null : (
        <DossierSection label="agreements">
          <ul className="mt-1 space-y-1">
            {data.activeAgreements.map((agreement) => (
              <li
                key={agreement.id}
                className="line-clamp-2 font-sans text-label leading-snug text-white/75"
              >
                <span aria-hidden className="mr-1.5 text-aura-rose">
                  &middot;
                </span>
                {agreement.text}
              </li>
            ))}
          </ul>
        </DossierSection>
      )}
      {data.openLoops.length === 0 ? null : (
        <DossierSection label="open loops">
          <ul className="mt-1 space-y-1">
            {data.openLoops.map((loop) => (
              <li
                key={loop.id}
                className="line-clamp-2 font-sans text-label leading-snug text-white/75"
              >
                <span aria-hidden className="mr-1.5 text-aura-amber">
                  &middot;
                </span>
                {loop.text}
              </li>
            ))}
          </ul>
        </DossierSection>
      )}
      {data.pairReads.length === 0 ? null : (
        <DossierSection label="pair reads">
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
        </DossierSection>
      )}
    </motion.button>
  );
}

function DossierStatsStrip({
  health,
  datesCompleted,
  lastScenarioTitle,
}: {
  health: number;
  datesCompleted: number;
  lastScenarioTitle: string | null;
}) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      <DossierStat
        label="health"
        value={`${health}`}
        tone={
          health >= 70 ? "text-aura-rose" : health >= 40 ? "text-aura-violet" : "text-aura-amber"
        }
      />
      <DossierStat label={datesCompleted === 1 ? "date" : "dates"} value={`${datesCompleted}`} />
      <DossierStat label="last" value={lastScenarioTitle ?? "—"} />
    </div>
  );
}

function DossierStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-tile bg-white/[0.06] px-2 py-1.5">
      <div className="font-mono text-micro uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div
        className={`mt-0.5 truncate font-display text-label leading-tight ${tone ?? "text-aura-paper"}`}
      >
        {value}
      </div>
    </div>
  );
}

function DossierSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/55">{label}</div>
      {children}
    </div>
  );
}

function pickTopScenarioId(pairState: PairState): string | undefined {
  let topId: string | undefined;
  let topCount = 0;
  for (const [scenarioId, count] of Object.entries(pairState.scenarioUseCounts)) {
    if (count > topCount) {
      topCount = count;
      topId = scenarioId;
    }
  }
  return topId;
}
