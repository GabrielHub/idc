import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { EASE_OUT_QUART, MutedLabel } from "../../../components/dashboard-atoms";
import { NotesView } from "../../../components/notes-view";
import {
  type Member,
  type MemoryRecord,
  type PairState,
  type ShiftState,
} from "../../../domain/game";
import { starterMembers, starterScenarios } from "../../../fixtures";
import {
  bradyStrait,
  eleanorAsh,
  jennaPike,
  marcusPellish,
  meiSato,
  vhool,
} from "../../../fixtures/members";
import { makePairId, sortMemberIds } from "../../../services/game-seed";
import { NotesShiftStepper, TestHeader, buildBoardPairState } from "../shared";

type NotesPreviewState = "full" | "single" | "pairs-only" | "scenarios-only" | "empty";

const NOTES_PREVIEW_STATES: {
  id: NotesPreviewState;
  label: string;
  hint: string;
}[] = [
  { id: "full", label: "full archive", hint: "Many notes across pair, date, and scenario scopes" },
  { id: "single", label: "single lead", hint: "One filed note (only the featured card renders)" },
  { id: "pairs-only", label: "pairs only", hint: "Pair and date scope notes only" },
  { id: "scenarios-only", label: "scenarios only", hint: "Scenario scope notes only" },
  { id: "empty", label: "empty", hint: "No public notes filed yet" },
];

export function NotesArchiveTest() {
  const [previewState, setPreviewState] = useState<NotesPreviewState>("full");
  const [shiftCount, setShiftCount] = useState(3);

  const dataset = useMemo(() => buildNotesPreviewDataset(previewState), [previewState]);
  const previewShifts = useMemo(() => buildPreviewShiftPlaceholders(shiftCount), [shiftCount]);
  const activeOption =
    NOTES_PREVIEW_STATES.find((option) => option.id === previewState) ?? NOTES_PREVIEW_STATES[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Notes archive"
        description="Mounts the live Notes view with mock public memories so we can preview the filter rail, empty states, and card layouts without playing through to a date wrap. The featured lead card, paired-portrait stack, scenario glyph, and importance rail all render against the same code path the dashboard uses."
      />

      <div className="aura-glass flex flex-wrap items-end gap-x-6 gap-y-4 rounded-card px-5 py-4">
        <div className="space-y-2">
          <MutedLabel>preview state</MutedLabel>
          <div className="inline-flex flex-wrap items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
            {NOTES_PREVIEW_STATES.map((option) => {
              const active = option.id === previewState;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-sfx="click"
                  aria-pressed={active}
                  title={option.hint}
                  onClick={() => setPreviewState(option.id)}
                  className={`cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
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

        <NotesShiftStepper value={shiftCount} onChange={setShiftCount} />

        <div className="ml-auto flex flex-col items-end gap-1">
          <MutedLabel>records loaded</MutedLabel>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            <span className="text-aura-ink tabular-nums">{dataset.memories.length}</span> on file
            <span aria-hidden> · </span>
            <span className="text-aura-ink">{activeOption.label}</span>
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-card bg-white/45 ring-1 ring-aura-hairline">
        <NotesView
          memories={dataset.memories}
          members={dataset.members}
          pairEdges={dataset.pairStates}
          scenarios={dataset.scenarios}
          shifts={previewShifts}
        />
      </div>
    </motion.section>
  );
}

type NotesPreviewDataset = {
  members: Member[];
  pairStates: PairState[];
  scenarios: typeof starterScenarios;
  memories: MemoryRecord[];
};

function buildPreviewShiftPlaceholders(count: number): ShiftState[] {
  return Array.from({ length: count }, (_value, index) => ({
    id: `preview-shift-${index + 1}`,
    shiftNumber: index + 1,
    status: "active" as const,
    dateSlotsTotal: 0,
    dateSlotsUsed: 0,
    featuredMemberIds: [],
    drawnScenarioIds: [],
    companyGoalIds: [],
    memberRequestIds: [],
    startedAt: new Date(0).toISOString(),
  }));
}

function buildNotesPreviewDataset(state: NotesPreviewState): NotesPreviewDataset {
  const couples: { a: Member; b: Member }[] = [
    { a: jennaPike, b: vhool },
    { a: meiSato, b: bradyStrait },
    { a: eleanorAsh, b: marcusPellish },
  ];

  const pairStates = couples.map(({ a, b }) => buildBoardPairState(a, b, 64));
  const scenarios = starterScenarios;
  const members = starterMembers;

  if (state === "empty") {
    return { members, pairStates, scenarios, memories: [] };
  }

  const all = buildPreviewMemories();

  if (state === "single") {
    return { members, pairStates, scenarios, memories: all.slice(0, 1) };
  }
  if (state === "pairs-only") {
    return {
      members,
      pairStates,
      scenarios,
      memories: all.filter((memory) => memory.scope === "pair" || memory.scope === "date"),
    };
  }
  if (state === "scenarios-only") {
    return {
      members,
      pairStates,
      scenarios,
      memories: all.filter((memory) => memory.scope === "scenario"),
    };
  }

  return { members, pairStates, scenarios, memories: all };
}

function buildPreviewMemories(): MemoryRecord[] {
  const jennaVhool = makePairId(jennaPike.id, vhool.id);
  const meiBrady = makePairId(meiSato.id, bradyStrait.id);
  const eleanorMarcus = makePairId(eleanorAsh.id, marcusPellish.id);

  const records: MemoryRecord[] = [
    {
      id: "preview-pair-jenna-vhool-temporal",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(jennaPike.id, vhool.id),
      pairId: jennaVhool,
      scenarioId: "temporal-coffee-shop",
      dateSessionId: "preview-session-jenna-vhool-1",
      text: "Jenna and Vhool produced a steady warm-up exchange at Cart Before The Horse. Vhool kept the questions concrete after Cupid flagged it, and Jenna stopped editing her schedule mid-sentence by exchange three.",
      tags: ["date_summary", "low"],
      importance: 4,
      createdAt: "2026-05-08T19:24:00.000Z",
    },
    {
      id: "preview-date-mei-brady-volcano",
      scope: "date",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: meiBrady,
      scenarioId: "volcano-hot-spring",
      dateSessionId: "preview-session-mei-brady-1",
      text: "Mei and Brady cleared a tense exchange at Hot Spring Inside The Volcano. Brady asked a follow-up about the lab schedule instead of pivoting to himself, and Mei filed a comfort movement upward.",
      tags: ["ai_summary", "high"],
      importance: 5,
      createdAt: "2026-05-08T22:11:00.000Z",
    },
    {
      id: "preview-scenario-temporal-repeat",
      scope: "scenario",
      visibility: "public",
      subjectIds: sortMemberIds(jennaPike.id, vhool.id),
      pairId: jennaVhool,
      scenarioId: "temporal-coffee-shop",
      dateSessionId: "preview-session-jenna-vhool-1",
      text: "Jenna and Vhool have used Cart Before The Horse. Repeat bookings should mention that Cupid has a file and that the espresso machine eats one minute every third pull.",
      tags: ["scenario_repeat"],
      importance: 3,
      createdAt: "2026-05-08T19:25:00.000Z",
    },
    {
      id: "preview-pair-eleanor-marcus-listening",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(eleanorAsh.id, marcusPellish.id),
      pairId: eleanorMarcus,
      scenarioId: "listening-booth-after-close",
      dateSessionId: "preview-session-eleanor-marcus-1",
      text: "Eleanor and Marcus filed a clean exchange at Mum's The Word. They agreed on a second meeting before Cupid had to suggest one, which is rare on a first booking.",
      tags: ["date_summary", "medium"],
      importance: 3,
      createdAt: "2026-05-07T23:48:00.000Z",
    },
    {
      id: "preview-scenario-diner-cupid-note",
      scope: "scenario",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: meiBrady,
      scenarioId: "diner-eleven-pm",
      dateSessionId: "preview-session-mei-brady-2",
      text: "Diner At Eleven keeps producing comfort movements when Cupid sets a clear closing time. Hold the booth at the back and let the first soda land before the first hard question.",
      tags: ["scenario_repeat", "low"],
      importance: 2,
      createdAt: "2026-05-07T03:02:00.000Z",
    },
    {
      id: "preview-date-jenna-vhool-diner",
      scope: "date",
      visibility: "public",
      subjectIds: sortMemberIds(jennaPike.id, vhool.id),
      pairId: jennaVhool,
      scenarioId: "diner-eleven-pm",
      dateSessionId: "preview-session-jenna-vhool-2",
      text: "Jenna and Vhool kept a steady tempo at Diner At Eleven. Vhool ordered the pancakes a second time without explanation and Jenna let it go, which Cupid is filing as progress.",
      tags: ["ai_summary", "low"],
      importance: 3,
      createdAt: "2026-05-06T04:18:00.000Z",
    },
    {
      id: "preview-pair-mei-brady-temporal",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: meiBrady,
      scenarioId: "temporal-coffee-shop",
      dateSessionId: "preview-session-mei-brady-3",
      text: "Mei and Brady filed a flat second exchange at Cart Before The Horse. Cupid logged a fallback filing because AI analysis timed out. Hold the room from the rotation until next shift.",
      tags: ["fallback_summary", "medium"],
      importance: 2,
      createdAt: "2026-05-05T18:33:00.000Z",
    },
    {
      id: "preview-scenario-volcano-room-note",
      scope: "scenario",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: meiBrady,
      scenarioId: "volcano-hot-spring",
      dateSessionId: "preview-session-mei-brady-1",
      text: "Hot Spring Inside The Volcano runs hot for first dates and cool for confessions. Two pairs have reported the temperature ladder cleared a held topic without an intervention.",
      tags: ["scenario_repeat", "high"],
      importance: 4,
      createdAt: "2026-05-05T20:08:00.000Z",
    },
  ];

  return records;
}
