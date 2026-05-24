import { useCallback, useMemo, useState } from "react";

import { ConstellationLobby } from "../../../components/constellation-lobby";
import { MutedLabel } from "../../../components/dashboard-atoms";
import {
  gameSaveSchema,
  memoryRecordSchema,
  pairStateSchema,
  shiftStateSchema,
  type DateScenario,
  type GameSave,
  type MemoryRecord,
  type Member,
  type PairState,
} from "../../../domain/game";
import { starterScenarios } from "../../../fixtures";
import { getReadyClosurePairs } from "../../../services/closures";
import { commitDateBooking } from "../../../services/date-engine";
import { drawHand } from "../../../services/deck";
import { getFocusedMembers, syncActiveShiftFocusCases } from "../../../services/focus-cases";
import {
  createSeedGameSave,
  getActiveShift,
  makePairId,
  sortMemberIds,
} from "../../../services/game-seed";
import { derivePairStats } from "../../../services/pair-stats";

type LobbyStage = "empty" | "few-pairs" | "mid-game" | "end-game";

const STAGES: ReadonlyArray<{ id: LobbyStage; label: string; hint: string }> = [
  {
    id: "empty",
    label: "Empty",
    hint: "Fresh save. No focus cases, no pairs, shift 1.",
  },
  {
    id: "few-pairs",
    label: "A couple pairs",
    hint: "2 focus cases, 2 pair edges with notes, shift 2.",
  },
  {
    id: "mid-game",
    label: "Mid game",
    hint: "4 focus cases, ~10 pair edges, dense notes, shift 5, 2 closures.",
  },
  {
    id: "end-game",
    label: "End game",
    hint: "4 focus cases, ~16 pair edges, very dense notes, shift 9, 4 closures.",
  },
];

const SEED_NOW = new Date("2026-05-23T18:00:00.000Z");

export function ConstellationLobbyTest({ onExit }: { onExit?: () => void }) {
  const [stage, setStage] = useState<LobbyStage>("few-pairs");
  const [save, setSave] = useState<GameSave>(() => buildStageSave(stage));

  const onPickStage = useCallback((next: LobbyStage) => {
    setStage(next);
    setSave(buildStageSave(next));
  }, []);

  const focusedMembers = useMemo(() => getFocusedMembers(save), [save]);
  const activeShift = useMemo(() => getActiveShift(save), [save]);
  const readyClosurePairs = useMemo(() => getReadyClosurePairs(save), [save]);
  const readyClosurePairIds = useMemo(
    () => new Set(readyClosurePairs.map((entry) => entry.pairState.id)),
    [readyClosurePairs],
  );
  const readyClosureMemberIds = useMemo(() => {
    const ids = new Set<string>();
    for (const ready of readyClosurePairs) {
      ids.add(ready.participants[0].id);
      ids.add(ready.participants[1].id);
    }
    return ids;
  }, [readyClosurePairs]);
  const drawnScenarios = useMemo<DateScenario[]>(
    () =>
      activeShift.drawnScenarioIds
        .map((id) => starterScenarios.find((scenario) => scenario.id === id))
        .filter((scenario): scenario is DateScenario => scenario !== undefined),
    [activeShift],
  );

  return (
    <div className="fixed inset-0 z-50 bg-aura-bg">
      <div className="absolute inset-0">
        <ConstellationLobby
          save={save}
          shift={activeShift}
          focusedMembers={focusedMembers}
          drawnScenarios={drawnScenarios}
          isActionPending={false}
          bookingLocked={activeShift.activeBooking !== undefined}
          aiReady={true}
          readyClosurePairCount={readyClosurePairs.length}
          readyClosurePairs={readyClosurePairs}
          readyClosurePairIds={readyClosurePairIds}
          readyClosureMemberIds={readyClosureMemberIds}
          pendingFollowUpCount={0}
          revealAllMemberDetails={false}
          disableScrollLayerNav={true}
          onTutorialUpdate={setSave}
          onBeginDate={(input) => {
            // eslint-disable-next-line no-console
            console.info("[playground] onBeginDate", input);
          }}
          onCommitPair={(input) => {
            setSave((current) => commitDateBooking(current, input).save);
          }}
          onCancelBooking={() => {
            setSave((current) => {
              const shift = getActiveShift(current);
              if (shift.activeBooking === undefined) return current;
              const nextShift = shiftStateSchema.parse({ ...shift, activeBooking: undefined });
              return gameSaveSchema.parse({
                ...current,
                shifts: current.shifts.map((entry) =>
                  entry.id === nextShift.id ? nextShift : entry,
                ),
              });
            });
          }}
          onAddDeckCard={(cardId) => {
            setSave((current) => {
              if (current.scenarioDeck.cardIds.includes(cardId)) return current;
              return gameSaveSchema.parse({
                ...current,
                scenarioDeck: {
                  ...current.scenarioDeck,
                  cardIds: [...current.scenarioDeck.cardIds, cardId],
                },
              });
            });
          }}
          onRemoveDeckCard={(cardId) => {
            setSave((current) =>
              gameSaveSchema.parse({
                ...current,
                scenarioDeck: {
                  ...current.scenarioDeck,
                  cardIds: current.scenarioDeck.cardIds.filter((id) => id !== cardId),
                },
              }),
            );
          }}
          onClosePair={(input) => {
            // eslint-disable-next-line no-console
            console.info("[playground] onClosePair", input);
            return Promise.resolve(false);
          }}
          onCompleteShift={() => {
            // eslint-disable-next-line no-console
            console.info("[playground] onCompleteShift");
          }}
          onOpenDateSession={(dateSessionId) => {
            // eslint-disable-next-line no-console
            console.info("[playground] onOpenDateSession", dateSessionId);
          }}
          onAddFocus={(memberId) => {
            setSave((current) => {
              if (current.focusedMemberIds.includes(memberId)) return current;
              if (current.focusedMemberIds.length >= 4) return current;
              return syncActiveShiftFocusCases({
                ...current,
                focusedMemberIds: [...current.focusedMemberIds, memberId],
              });
            });
          }}
          onRemoveFocus={(memberId) => {
            setSave((current) => {
              if (!current.focusedMemberIds.includes(memberId)) return current;
              return syncActiveShiftFocusCases({
                ...current,
                focusedMemberIds: current.focusedMemberIds.filter((id) => id !== memberId),
              });
            });
          }}
          onReselectFocus={(nextFocusIds) => {
            setSave((current) =>
              syncActiveShiftFocusCases({
                ...current,
                focusedMemberIds: Array.from(new Set(nextFocusIds)).slice(0, 4),
              }),
            );
          }}
        />
      </div>

      <PlaygroundChrome
        stage={stage}
        onPickStage={onPickStage}
        save={save}
        focusedCount={focusedMembers.length}
        activeShiftNumber={activeShift.shiftNumber}
        onExit={onExit}
      />
    </div>
  );
}

function PlaygroundChrome({
  stage,
  onPickStage,
  save,
  focusedCount,
  activeShiftNumber,
  onExit,
}: {
  stage: LobbyStage;
  onPickStage: (next: LobbyStage) => void;
  save: GameSave;
  focusedCount: number;
  activeShiftNumber: number;
  onExit: (() => void) | undefined;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-40 flex justify-center px-4">
      <div className="aura-glass-strong pointer-events-auto flex flex-wrap items-center gap-x-5 gap-y-3 rounded-pill px-4 py-2.5 shadow-card">
        {onExit !== undefined ? (
          <button
            type="button"
            onClick={onExit}
            data-sfx="click"
            aria-label="Exit bench"
            title="Exit bench"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-muted transition hover:text-aura-rose"
          >
            <ExitGlyph />
            <span>exit</span>
          </button>
        ) : null}

        <span aria-hidden className="h-4 w-px bg-aura-hairline" />

        <div className="flex items-center gap-2">
          <MutedLabel>stage</MutedLabel>
          <div className="inline-flex items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
            {STAGES.map((option) => {
              const active = option.id === stage;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-sfx="click"
                  aria-pressed={active}
                  title={option.hint}
                  onClick={() => onPickStage(option.id)}
                  className={`cursor-pointer rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                    active
                      ? "bg-aura-ink text-white shadow-quiet"
                      : "text-aura-muted hover:text-aura-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <span aria-hidden className="h-4 w-px bg-aura-hairline" />

        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          shift <span className="text-aura-ink tabular-nums">{activeShiftNumber}</span>
          <span aria-hidden> · </span>
          <span className="text-aura-ink tabular-nums">{focusedCount}</span> focus
          <span aria-hidden> · </span>
          <span className="text-aura-ink tabular-nums">{save.pairStates.length}</span> pair
          {save.pairStates.length === 1 ? "" : "s"}
          <span aria-hidden> · </span>
          <span className="text-aura-ink tabular-nums">{save.closureCount}</span> closure
          {save.closureCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function ExitGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden>
      <path
        d="M19 12H5M11 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================================================== */
/* Stage builders                                                     */
/* ================================================================== */

function buildStageSave(stage: LobbyStage): GameSave {
  const seedSave = createSeedGameSave(SEED_NOW);
  const seedWithDrawnHand = withDrawnHand(seedSave, 1);

  if (stage === "empty") {
    return withDisabledTutorial(seedWithDrawnHand);
  }

  if (stage === "few-pairs") {
    return buildFewPairsSave(seedWithDrawnHand);
  }

  if (stage === "mid-game") {
    return buildMidGameSave(seedWithDrawnHand);
  }

  return buildEndGameSave(seedWithDrawnHand);
}

const PAIR_BLUEPRINTS: ReadonlyArray<{
  a: string;
  b: string;
  health: number;
  scenarioId: string;
  noteCount: 1 | 2 | 3;
  topImportance: 1 | 2 | 3 | 4 | 5;
}> = [
  {
    a: "jenna-pike",
    b: "vhool",
    health: 72,
    scenarioId: "temporal-coffee-shop",
    noteCount: 2,
    topImportance: 4,
  },
  {
    a: "jenna-pike",
    b: "brady-strait",
    health: 58,
    scenarioId: "executive-lunch-one-agenda-item",
    noteCount: 1,
    topImportance: 3,
  },
  {
    a: "jenna-pike",
    b: "opal-sunday",
    health: 64,
    scenarioId: "open-house-sunday",
    noteCount: 2,
    topImportance: 4,
  },
  {
    a: "mei-sato",
    b: "brady-strait",
    health: 81,
    scenarioId: "volcano-hot-spring",
    noteCount: 3,
    topImportance: 5,
  },
  {
    a: "mei-sato",
    b: "gideon-glass",
    health: 47,
    scenarioId: "underworld-department-mixer",
    noteCount: 1,
    topImportance: 3,
  },
  {
    a: "mei-sato",
    b: "cha-yusung",
    health: 69,
    scenarioId: "world-sim-operator-booth",
    noteCount: 2,
    topImportance: 4,
  },
  {
    a: "eleanor-ash",
    b: "marcus-pellish",
    health: 76,
    scenarioId: "listening-booth-after-close",
    noteCount: 2,
    topImportance: 4,
  },
  {
    a: "eleanor-ash",
    b: "gideon-glass",
    health: 52,
    scenarioId: "memory-course-dinner",
    noteCount: 1,
    topImportance: 3,
  },
  {
    a: "mira-park",
    b: "cha-yusung",
    health: 60,
    scenarioId: "park-loop-with-a-dog",
    noteCount: 2,
    topImportance: 3,
  },
  {
    a: "mira-park",
    b: "tasha-rell",
    health: 66,
    scenarioId: "bowling-league-night",
    noteCount: 1,
    topImportance: 3,
  },
  {
    a: "sera-vohn",
    b: "reaver",
    health: 41,
    scenarioId: "phantom-doorbell-suite",
    noteCount: 3,
    topImportance: 5,
  },
  {
    a: "sera-vohn",
    b: "vhool",
    health: 55,
    scenarioId: "midnight-notary-two-clean-promises",
    noteCount: 2,
    topImportance: 4,
  },
  {
    a: "naia-velorae",
    b: "opal-sunday",
    health: 63,
    scenarioId: "moon-picnic",
    noteCount: 2,
    topImportance: 4,
  },
  {
    a: "tasha-rell",
    b: "gideon-glass",
    health: 49,
    scenarioId: "hardware-store-one-project",
    noteCount: 1,
    topImportance: 2,
  },
  {
    a: "eleanor-ash",
    b: "brady-strait",
    health: 70,
    scenarioId: "diner-eleven-pm",
    noteCount: 2,
    topImportance: 4,
  },
  {
    a: "mira-park",
    b: "marcus-pellish",
    health: 54,
    scenarioId: "chain-restaurant-tuesday",
    noteCount: 1,
    topImportance: 3,
  },
];

function buildFewPairsSave(base: GameSave): GameSave {
  const focusIds = ["jenna-pike", "mei-sato"];
  const blueprints = PAIR_BLUEPRINTS.slice(0, 2);
  return finalize(base, {
    focusIds,
    blueprints,
    closureCount: 0,
    shiftNumber: 2,
  });
}

function buildMidGameSave(base: GameSave): GameSave {
  const focusIds = ["jenna-pike", "mei-sato", "eleanor-ash", "mira-park"];
  const blueprints = PAIR_BLUEPRINTS.slice(0, 10);
  return finalize(base, {
    focusIds,
    blueprints,
    closureCount: 2,
    shiftNumber: 5,
  });
}

function buildEndGameSave(base: GameSave): GameSave {
  const focusIds = ["jenna-pike", "mei-sato", "eleanor-ash", "sera-vohn"];
  const blueprints = PAIR_BLUEPRINTS;
  return finalize(base, {
    focusIds,
    blueprints,
    closureCount: 4,
    shiftNumber: 9,
  });
}

/* ================================================================== */
/* Shared assembly                                                    */
/* ================================================================== */

function finalize(
  base: GameSave,
  input: {
    focusIds: readonly string[];
    blueprints: ReadonlyArray<(typeof PAIR_BLUEPRINTS)[number]>;
    closureCount: number;
    shiftNumber: number;
  },
): GameSave {
  const memberIds = new Set(base.members.map((member) => member.id));
  const usableFocus = input.focusIds.filter((id) => memberIds.has(id));
  const usableBlueprints = input.blueprints.filter(
    (entry) => memberIds.has(entry.a) && memberIds.has(entry.b),
  );

  const pairStates = usableBlueprints.map((entry) =>
    buildPairState(entry.a, entry.b, entry.health),
  );
  const memories = usableBlueprints.flatMap((entry) => buildMemoriesFor(entry, base.members));

  const stagedShifts = base.shifts.map((shift) => {
    if (shift.id !== base.activeShiftId) return shift;
    return shiftStateSchema.parse({ ...shift, shiftNumber: input.shiftNumber });
  });

  const staged = gameSaveSchema.parse({
    ...base,
    focusedMemberIds: usableFocus,
    pairStates,
    memories: [...base.memories, ...memories],
    closureCount: input.closureCount,
    shifts: stagedShifts,
  });

  return withDisabledTutorial(syncActiveShiftFocusCases(staged));
}

function buildPairState(aId: string, bId: string, health: number): PairState {
  const participants = sortMemberIds(aId, bId);
  return pairStateSchema.parse({
    id: makePairId(aId, bId),
    participantIds: participants,
    stats: derivePairStats({
      chemistry: clampStat(health + 5),
      trust: clampStat(health - 5),
      stability: clampStat(health),
      conflict: clampStat(100 - health),
      weirdnessTolerance: 70,
      spark: clampStat(health + 8),
      strain: 0,
      relationshipHealth: 0,
    }),
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
  });
}

function clampStat(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function buildMemoriesFor(
  blueprint: (typeof PAIR_BLUEPRINTS)[number],
  members: readonly Member[],
): MemoryRecord[] {
  const [firstId, secondId] = sortMemberIds(blueprint.a, blueprint.b);
  const first = members.find((member) => member.id === firstId);
  const second = members.find((member) => member.id === secondId);
  if (first === undefined || second === undefined) return [];

  const pairId = makePairId(firstId, secondId);
  const baseDate = Date.parse("2026-05-15T18:00:00.000Z");
  const dayMs = 24 * 60 * 60 * 1000;
  const notes: MemoryRecord[] = [];

  for (let index = 0; index < blueprint.noteCount; index += 1) {
    const importance =
      index === 0
        ? blueprint.topImportance
        : (Math.max(1, blueprint.topImportance - index) as 1 | 2 | 3 | 4 | 5);
    const createdAt = new Date(baseDate - index * dayMs).toISOString();
    notes.push(
      memoryRecordSchema.parse({
        id: `playground-pair-${pairId}-${index}`,
        scope: "pair",
        visibility: "public",
        subjectIds: [firstId, secondId],
        pairId,
        scenarioId: blueprint.scenarioId,
        dateSessionId: `playground-session-${pairId}-${index}`,
        text: buildMemoryText(first, second, index),
        tags: index === 0 ? ["date_summary", noteTag(blueprint.topImportance)] : ["date_summary"],
        importance,
        createdAt,
      }),
    );
  }

  return notes;
}

function buildMemoryText(first: Member, second: Member, index: number): string {
  if (index === 0) {
    return `${first.firstName} and ${second.firstName} filed a focused exchange. Stats moved the way Cupid expected and neither pushed past the room's boundaries.`;
  }
  if (index === 1) {
    return `${first.firstName} and ${second.firstName} kept a steady tempo on a return visit. The room reset to a softer baseline.`;
  }
  return `${first.firstName} and ${second.firstName} logged a quieter third pass. Cupid filed a fallback summary so the thread stays warm.`;
}

function noteTag(importance: 1 | 2 | 3 | 4 | 5): string {
  if (importance >= 5) return "high";
  if (importance >= 3) return "medium";
  return "low";
}

function withDrawnHand(save: GameSave, shiftNumber: number): GameSave {
  const drawn = drawHand(save.scenarioDeck, `playground:${shiftNumber}`);
  const updatedShifts = save.shifts.map((shift) => {
    if (shift.id !== save.activeShiftId) return shift;
    return shiftStateSchema.parse({ ...shift, drawnScenarioIds: drawn });
  });
  return gameSaveSchema.parse({ ...save, shifts: updatedShifts });
}

function withDisabledTutorial(save: GameSave): GameSave {
  if (!save.tutorial.enabled) return save;
  return gameSaveSchema.parse({
    ...save,
    tutorial: { ...save.tutorial, enabled: false },
  });
}
