import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { EASE_OUT_QUART, MutedLabel } from "../../../components/dashboard-atoms";
import { PairBoard } from "../../../components/pair-board";
import { type Member, type MemoryRecord, type PairState } from "../../../domain/game";
import { starterMembers, starterScenarios } from "../../../fixtures";
import {
  bradyStrait,
  chaYusung,
  eleanorAsh,
  gideonGlass,
  jennaPike,
  marcusPellish,
  meiSato,
  miraPark,
  naiaVelorae,
  opalSunday,
  reaver,
  seraVohn,
  tashaRell,
  vhool,
} from "../../../fixtures/members";
import { makePairId, sortMemberIds } from "../../../services/game-seed";
import { NotesShiftStepper, TestHeader, buildBoardPairState } from "../shared";

type PairBoardPreviewState = "dense" | "sparse" | "single-hub" | "unfiled" | "empty";

const PAIR_BOARD_PREVIEW_STATES: {
  id: PairBoardPreviewState;
  label: string;
  hint: string;
}[] = [
  {
    id: "dense",
    label: "dense graph",
    hint: "Many cross-pairs across the roster, multiple hubs",
  },
  {
    id: "sparse",
    label: "sparse graph",
    hint: "A handful of pairs, mostly single connections",
  },
  {
    id: "single-hub",
    label: "single hub",
    hint: "One central member connected to several spokes",
  },
  {
    id: "unfiled",
    label: "unfiled states",
    hint: "Pair states exist but no notes filed yet",
  },
  {
    id: "empty",
    label: "empty",
    hint: "No pair states at all",
  },
];

export function PairBoardTest() {
  const [previewState, setPreviewState] = useState<PairBoardPreviewState>("dense");
  const [shiftCount, setShiftCount] = useState(7);

  const dataset = useMemo(() => buildPairBoardPreviewDataset(previewState), [previewState]);
  const activeOption =
    PAIR_BOARD_PREVIEW_STATES.find((option) => option.id === previewState) ??
    PAIR_BOARD_PREVIEW_STATES[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.15 }}
      className="space-y-6"
    >
      <TestHeader
        title="Pair board"
        description="Standalone graph view of filed pair connections. Each member is a node bubble, each filed pair is a curved thread between two nodes. Hover a node to highlight its connections, hover a thread to preview the latest pair note, click anywhere to expand the bespoke detail rail."
      />

      <div className="aura-glass flex flex-wrap items-end gap-x-6 gap-y-4 rounded-card px-5 py-4">
        <div className="space-y-2">
          <MutedLabel>preview state</MutedLabel>
          <div className="inline-flex flex-wrap items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
            {PAIR_BOARD_PREVIEW_STATES.map((option) => {
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
          <MutedLabel>graph contents</MutedLabel>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            <span className="text-aura-ink tabular-nums">{dataset.pairStates.length}</span> pair
            {dataset.pairStates.length === 1 ? "" : "s"}
            <span aria-hidden> · </span>
            <span className="text-aura-ink tabular-nums">{dataset.memories.length}</span> note
            {dataset.memories.length === 1 ? "" : "s"}
            <span aria-hidden> · </span>
            <span className="text-aura-ink">{activeOption.label}</span>
          </span>
        </div>
      </div>

      <PairBoard
        members={dataset.members}
        pairEdges={dataset.pairStates}
        memories={dataset.memories}
        scenarios={starterScenarios}
        shiftCount={shiftCount}
      />
    </motion.section>
  );
}

type PairBoardPreviewDataset = {
  members: Member[];
  pairStates: PairState[];
  memories: MemoryRecord[];
};

function buildPairBoardPreviewDataset(state: PairBoardPreviewState): PairBoardPreviewDataset {
  if (state === "empty") {
    return { members: starterMembers, pairStates: [], memories: [] };
  }

  if (state === "single-hub") {
    return buildSingleHubDataset();
  }

  if (state === "sparse") {
    return buildSparseDataset();
  }

  if (state === "unfiled") {
    return buildUnfiledDataset();
  }

  return buildDenseDataset();
}

function buildDenseDataset(): PairBoardPreviewDataset {
  const couples: { a: Member; b: Member; health: number }[] = [
    { a: jennaPike, b: vhool, health: 72 },
    { a: jennaPike, b: bradyStrait, health: 58 },
    { a: jennaPike, b: opalSunday, health: 64 },
    { a: meiSato, b: bradyStrait, health: 81 },
    { a: meiSato, b: gideonGlass, health: 47 },
    { a: meiSato, b: chaYusung, health: 69 },
    { a: eleanorAsh, b: marcusPellish, health: 76 },
    { a: eleanorAsh, b: gideonGlass, health: 52 },
    { a: miraPark, b: chaYusung, health: 60 },
    { a: miraPark, b: tashaRell, health: 66 },
    { a: seraVohn, b: reaver, health: 41 },
    { a: seraVohn, b: vhool, health: 55 },
    { a: naiaVelorae, b: opalSunday, health: 63 },
    { a: tashaRell, b: gideonGlass, health: 49 },
  ];

  const pairStates = couples.map(({ a, b, health }) => buildBoardPairState(a, b, health));
  const memories = buildDenseMemories();
  const members = collectMembers(couples);
  return { members, pairStates, memories };
}

function buildSparseDataset(): PairBoardPreviewDataset {
  const couples: { a: Member; b: Member; health: number }[] = [
    { a: jennaPike, b: vhool, health: 64 },
    { a: meiSato, b: bradyStrait, health: 70 },
    { a: eleanorAsh, b: marcusPellish, health: 55 },
    { a: miraPark, b: chaYusung, health: 48 },
  ];
  const pairStates = couples.map(({ a, b, health }) => buildBoardPairState(a, b, health));
  const members = collectMembers(couples);
  const memories: MemoryRecord[] = [
    {
      id: "preview-pair-jenna-vhool-sparse-1",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(jennaPike.id, vhool.id),
      pairId: makePairId(jennaPike.id, vhool.id),
      scenarioId: "temporal-coffee-shop",
      dateSessionId: "preview-sparse-1",
      text: "Jenna and Vhool produced a steady warm-up exchange at Cart Before The Horse. Vhool kept the questions concrete after Cupid flagged it.",
      tags: ["date_summary", "low"],
      importance: 3,
      createdAt: "2026-05-09T18:20:00.000Z",
    },
    {
      id: "preview-pair-mei-brady-sparse-1",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(meiSato.id, bradyStrait.id),
      pairId: makePairId(meiSato.id, bradyStrait.id),
      scenarioId: "volcano-hot-spring",
      dateSessionId: "preview-sparse-2",
      text: "Mei and Brady cleared a tense exchange at Hot Spring Inside The Volcano. Brady asked a follow-up about the lab schedule instead of pivoting to himself.",
      tags: ["date_summary", "high"],
      importance: 5,
      createdAt: "2026-05-08T22:11:00.000Z",
    },
    {
      id: "preview-pair-eleanor-marcus-sparse-1",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(eleanorAsh.id, marcusPellish.id),
      pairId: makePairId(eleanorAsh.id, marcusPellish.id),
      scenarioId: "listening-booth-after-close",
      dateSessionId: "preview-sparse-3",
      text: "Eleanor and Marcus filed a clean exchange at Mum's The Word. They agreed on a second meeting before Cupid had to suggest one.",
      tags: ["date_summary", "medium"],
      importance: 3,
      createdAt: "2026-05-07T23:48:00.000Z",
    },
    {
      id: "preview-pair-mira-cha-sparse-1",
      scope: "pair",
      visibility: "public",
      subjectIds: sortMemberIds(miraPark.id, chaYusung.id),
      pairId: makePairId(miraPark.id, chaYusung.id),
      scenarioId: "world-sim-operator-booth",
      dateSessionId: "preview-sparse-4",
      text: "Mira and Cha kept a quiet bench at Step-Away Button. Neither pushed for an answer and the room let it be.",
      tags: ["date_summary", "low"],
      importance: 2,
      createdAt: "2026-05-06T21:02:00.000Z",
    },
  ];
  return { members, pairStates, memories };
}

function buildSingleHubDataset(): PairBoardPreviewDataset {
  const hub = meiSato;
  const spokes: {
    partner: Member;
    health: number;
    importance: 1 | 2 | 3 | 4 | 5;
    scenario: string;
    text: string;
    createdAt: string;
  }[] = [
    {
      partner: bradyStrait,
      health: 78,
      importance: 5,
      scenario: "volcano-hot-spring",
      text: "Mei and Brady cleared a tense exchange at Hot Spring Inside The Volcano. Brady asked a follow-up about the lab schedule instead of pivoting to himself.",
      createdAt: "2026-05-09T22:11:00.000Z",
    },
    {
      partner: gideonGlass,
      health: 51,
      importance: 3,
      scenario: "underworld-department-mixer",
      text: "Mei and Gideon held a flat first exchange at Name Tag: Emotional Availability. Gideon read the room and shifted the topic before the second round.",
      createdAt: "2026-05-08T20:14:00.000Z",
    },
    {
      partner: chaYusung,
      health: 65,
      importance: 4,
      scenario: "world-sim-operator-booth",
      text: "Mei and Cha shared a steady debrief at Step-Away Button. Cha drew a workplace boundary cleanly and Mei did not push.",
      createdAt: "2026-05-07T19:33:00.000Z",
    },
    {
      partner: jennaPike,
      health: 60,
      importance: 3,
      scenario: "temporal-coffee-shop",
      text: "Mei and Jenna kept a warm pace at Cart Before The Horse. Jenna stopped editing her schedule by exchange three.",
      createdAt: "2026-05-06T17:48:00.000Z",
    },
    {
      partner: opalSunday,
      health: 44,
      importance: 2,
      scenario: "diner-eleven-pm",
      text: "Mei and Opal logged a quiet round at Diner At Eleven. Cupid filed a fallback summary because the judge timed out.",
      createdAt: "2026-05-05T03:18:00.000Z",
    },
  ];

  const couples = spokes.map((s) => ({ a: hub, b: s.partner, health: s.health }));
  const pairStates = couples.map(({ a, b, health }) => buildBoardPairState(a, b, health));
  const members = collectMembers(couples);
  const memories: MemoryRecord[] = spokes.map((spoke, index) => ({
    id: `preview-hub-${spoke.partner.id}-${index}`,
    scope: "pair",
    visibility: "public",
    subjectIds: sortMemberIds(hub.id, spoke.partner.id),
    pairId: makePairId(hub.id, spoke.partner.id),
    scenarioId: spoke.scenario,
    dateSessionId: `preview-hub-${index}`,
    text: spoke.text,
    tags: ["date_summary"],
    importance: spoke.importance,
    createdAt: spoke.createdAt,
  }));
  return { members, pairStates, memories };
}

function buildUnfiledDataset(): PairBoardPreviewDataset {
  const couples: { a: Member; b: Member; health: number }[] = [
    { a: jennaPike, b: vhool, health: 60 },
    { a: meiSato, b: bradyStrait, health: 60 },
    { a: eleanorAsh, b: marcusPellish, health: 60 },
    { a: miraPark, b: chaYusung, health: 60 },
    { a: seraVohn, b: reaver, health: 60 },
    { a: gideonGlass, b: tashaRell, health: 60 },
  ];
  const pairStates = couples.map(({ a, b, health }) => buildBoardPairState(a, b, health));
  const members = collectMembers(couples);
  return { members, pairStates, memories: [] };
}

function buildDenseMemories(): MemoryRecord[] {
  const items: {
    a: Member;
    b: Member;
    scenario: string;
    text: string;
    tags: string[];
    importance: 1 | 2 | 3 | 4 | 5;
    iso: string;
    idTag: string;
  }[] = [
    {
      a: jennaPike,
      b: vhool,
      scenario: "temporal-coffee-shop",
      text: "Jenna and Vhool produced a steady warm-up exchange at Cart Before The Horse. Vhool kept the questions concrete after Cupid flagged it, and Jenna stopped editing her schedule by exchange three.",
      tags: ["date_summary", "low"],
      importance: 4,
      iso: "2026-05-09T18:24:00.000Z",
      idTag: "jenna-vhool-temporal",
    },
    {
      a: jennaPike,
      b: vhool,
      scenario: "diner-eleven-pm",
      text: "Jenna and Vhool kept a steady tempo at Diner At Eleven. Vhool ordered the pancakes a second time without explanation and Jenna let it go.",
      tags: ["date_summary", "low"],
      importance: 3,
      iso: "2026-05-07T04:18:00.000Z",
      idTag: "jenna-vhool-diner",
    },
    {
      a: jennaPike,
      b: bradyStrait,
      scenario: "executive-lunch-one-agenda-item",
      text: "Jenna and Brady held a clipped exchange at Executive Lunch One Agenda Item. Brady tried a single agenda item and Jenna gave it back to him cleaner.",
      tags: ["date_summary", "medium"],
      importance: 3,
      iso: "2026-05-08T13:02:00.000Z",
      idTag: "jenna-brady-exec",
    },
    {
      a: jennaPike,
      b: opalSunday,
      scenario: "open-house-sunday",
      text: "Jenna and Opal toured Open House Sunday and filed a pleasant first exchange. Opal asked for a follow-up before Cupid prompted.",
      tags: ["date_summary", "medium"],
      importance: 4,
      iso: "2026-05-09T15:11:00.000Z",
      idTag: "jenna-opal-open",
    },
    {
      a: meiSato,
      b: bradyStrait,
      scenario: "volcano-hot-spring",
      text: "Mei and Brady cleared a tense exchange at Hot Spring Inside The Volcano. Brady asked a follow-up about the lab schedule instead of pivoting to himself, and Mei filed a comfort movement upward.",
      tags: ["date_summary", "high"],
      importance: 5,
      iso: "2026-05-09T22:11:00.000Z",
      idTag: "mei-brady-volcano",
    },
    {
      a: meiSato,
      b: bradyStrait,
      scenario: "temporal-coffee-shop",
      text: "Mei and Brady filed a flat second exchange at Cart Before The Horse. Cupid logged a fallback filing because the AI judge timed out.",
      tags: ["fallback_summary", "medium"],
      importance: 2,
      iso: "2026-05-05T18:33:00.000Z",
      idTag: "mei-brady-temporal",
    },
    {
      a: meiSato,
      b: gideonGlass,
      scenario: "underworld-department-mixer",
      text: "Mei and Gideon held a flat first exchange at Name Tag: Emotional Availability. Gideon read the room and shifted the topic before the second round.",
      tags: ["date_summary", "low"],
      importance: 3,
      iso: "2026-05-08T20:14:00.000Z",
      idTag: "mei-gideon-underworld",
    },
    {
      a: meiSato,
      b: chaYusung,
      scenario: "world-sim-operator-booth",
      text: "Mei and Cha shared a steady debrief at Step-Away Button. Cha drew a workplace boundary cleanly and Mei did not push.",
      tags: ["date_summary", "medium"],
      importance: 4,
      iso: "2026-05-07T19:33:00.000Z",
      idTag: "mei-cha-worldsim",
    },
    {
      a: eleanorAsh,
      b: marcusPellish,
      scenario: "listening-booth-after-close",
      text: "Eleanor and Marcus filed a clean exchange at Mum's The Word. They agreed on a second meeting before Cupid had to suggest one, which is rare on a first booking.",
      tags: ["date_summary", "medium"],
      importance: 4,
      iso: "2026-05-08T23:48:00.000Z",
      idTag: "eleanor-marcus-listening",
    },
    {
      a: eleanorAsh,
      b: gideonGlass,
      scenario: "memory-course-dinner",
      text: "Eleanor and Gideon ran cool through Food For Thought. Gideon paced his stories and Eleanor matched him for a clean exit.",
      tags: ["date_summary", "low"],
      importance: 3,
      iso: "2026-05-06T20:22:00.000Z",
      idTag: "eleanor-gideon-memory",
    },
    {
      a: miraPark,
      b: chaYusung,
      scenario: "park-loop-with-a-dog",
      text: "Mira and Cha walked Park Loop With A Dog and kept the pace easy. Mira deferred to Cha on a tense neighbor and Cha noticed.",
      tags: ["date_summary", "medium"],
      importance: 3,
      iso: "2026-05-09T16:54:00.000Z",
      idTag: "mira-cha-park",
    },
    {
      a: miraPark,
      b: tashaRell,
      scenario: "bowling-league-night",
      text: "Mira and Tasha closed Bowling League Night without a hard topic. Tasha telegraphed her interest before the score reset and Mira rolled with it.",
      tags: ["date_summary", "low"],
      importance: 3,
      iso: "2026-05-08T22:39:00.000Z",
      idTag: "mira-tasha-bowling",
    },
    {
      a: seraVohn,
      b: reaver,
      scenario: "phantom-doorbell-suite",
      text: "Sera and Reaver filed a tense pass through Phantom Doorbell Suite. Reaver tested an entry early and Sera held the line without escalating.",
      tags: ["date_summary", "high"],
      importance: 5,
      iso: "2026-05-09T01:02:00.000Z",
      idTag: "sera-reaver-phantom",
    },
    {
      a: seraVohn,
      b: vhool,
      scenario: "midnight-notary-two-clean-promises",
      text: "Sera and Vhool walked Stamp Of Approval clean. Vhool signed both promises without an edit and Sera kept the silence after.",
      tags: ["date_summary", "high"],
      importance: 4,
      iso: "2026-05-08T04:18:00.000Z",
      idTag: "sera-vhool-notary",
    },
    {
      a: naiaVelorae,
      b: opalSunday,
      scenario: "moon-picnic",
      text: "Naia and Opal kept Moon Picnic still and unhurried. Naia named what was on her mind and Opal answered without filling.",
      tags: ["date_summary", "medium"],
      importance: 4,
      iso: "2026-05-09T03:14:00.000Z",
      idTag: "naia-opal-moon",
    },
    {
      a: tashaRell,
      b: gideonGlass,
      scenario: "hardware-store-one-project",
      text: "Tasha and Gideon split Nuts And Bolts into halves. Gideon picked his half first and Tasha did not negotiate.",
      tags: ["date_summary", "low"],
      importance: 2,
      iso: "2026-05-06T17:09:00.000Z",
      idTag: "tasha-gideon-hardware",
    },
  ];

  return items.map((entry, index) => ({
    id: `preview-board-${entry.idTag}-${index}`,
    scope: "pair" as const,
    visibility: "public" as const,
    subjectIds: sortMemberIds(entry.a.id, entry.b.id),
    pairId: makePairId(entry.a.id, entry.b.id),
    scenarioId: entry.scenario,
    dateSessionId: `preview-board-session-${index}`,
    text: entry.text,
    tags: entry.tags,
    importance: entry.importance,
    createdAt: entry.iso,
  }));
}

function collectMembers(couples: { a: Member; b: Member }[]): Member[] {
  const seen = new Set<string>();
  const ordered: Member[] = [];
  for (const { a, b } of couples) {
    if (!seen.has(a.id)) {
      ordered.push(a);
      seen.add(a.id);
    }
    if (!seen.has(b.id)) {
      ordered.push(b);
      seen.add(b.id);
    }
  }
  // Pad with a few un-paired starter members so the off-the-board chip strip
  // has content to render and we can validate the empty-degree case.
  for (const member of starterMembers) {
    if (ordered.length >= 18) break;
    if (seen.has(member.id)) continue;
    ordered.push(member);
    seen.add(member.id);
  }
  return ordered;
}
