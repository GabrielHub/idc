import { useMemo, useState } from "react";

import {
  dateFinalReportSchema,
  dateSessionSchema,
  judgeSnapshotSchema,
  pairAgreementSchema,
  pairStateSchema,
  type DateSession,
  type JudgeSnapshot,
  type MemoryRecord,
  type OpenLoop,
  type PairAgreement,
  type PairState,
} from "../../../domain/game";
import { starterMembers, starterScenarios } from "../../../fixtures";
import { buildPairMemoryTimeline } from "../../../components/pair-memory-inspector";
import { MutedLabel, Portrait } from "../../../components/dashboard-atoms";
import { makePairId, sortMemberIds } from "../../../services/game-seed";
import {
  applyCompletedDatePairMemoryEffects,
  applyFollowUpPairMemoryEffects,
  applyJudgePairMemoryEffects,
  selectPairSpotlightItem,
} from "../../../services/pair-memory";
import { derivePairStats } from "../../../services/pair-stats";
import { derivePairTrajectory } from "../../../services/pair-trajectory";
import { TestHeader } from "../shared";
import {
  EmptyState,
  LabButton,
  LabEntrance,
  LabPanel,
  LAB_NOW,
  MetricPill,
} from "./gameplay-lab-shared";

type MemoryLabScenarioId =
  | "judge-created"
  | "completion-aging"
  | "early-end-strain"
  | "follow-up-close";

type MemoryLabScenario = {
  id: MemoryLabScenarioId;
  label: string;
  hint: string;
};

const MEMORY_SCENARIOS: readonly MemoryLabScenario[] = [
  {
    id: "judge-created",
    label: "Judge files",
    hint: "Cupid analysis accepts one agreement and one open loop from a fresh exchange.",
  },
  {
    id: "completion-aging",
    label: "Completed date",
    hint: "A later completed date honors an old agreement and drops an old loop.",
  },
  {
    id: "early-end-strain",
    label: "Early end",
    hint: "The same old items strain instead of resolving because the date ended early.",
  },
  {
    id: "follow-up-close",
    label: "Close follow-up",
    hint: "A close follow-up retires active agreements and drops unresolved loops.",
  },
];

type MemoryLabModel = {
  scenario: MemoryLabScenario;
  before: PairState;
  after: PairState;
  session: DateSession;
  memories: MemoryRecord[];
};

export function MemoryLabTest() {
  const [scenarioId, setScenarioId] = useState<MemoryLabScenarioId>("judge-created");
  const model = useMemo(() => buildMemoryLabModel(scenarioId), [scenarioId]);
  const [firstMember, secondMember] = model.after.participantIds.map(requireMember);
  const timeline = buildPairMemoryTimeline(model.after);
  const spotlight = selectPairSpotlightItem(model.after);
  const trajectory = derivePairTrajectory({
    pairState: model.after,
    currentSession: model.session,
    completedSessions: [model.session],
  });
  const activeAgreements = model.after.agreements.filter(
    (agreement) => agreement.status === "active",
  );
  const openLoops = model.after.openLoops.filter((loop) => loop.status === "open");

  return (
    <LabEntrance className="space-y-6">
      <TestHeader
        title="Memory lab"
        description="Seed pair memory states that are painful to reach through normal play: judge-created continuity, aging, early-end strain, and follow-up cleanup."
      />

      <div className="flex flex-wrap gap-2">
        {MEMORY_SCENARIOS.map((scenario) => (
          <LabButton
            key={scenario.id}
            label={scenario.label}
            value={scenario.id}
            activeValue={scenarioId}
            onSelect={setScenarioId}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
        <LabPanel label="pair file" title={`${firstMember.firstName} + ${secondMember.firstName}`}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex -space-x-3">
              {[firstMember, secondMember].map((member, index) => (
                <span
                  key={member.id}
                  className={`rounded-full border-2 border-white/85 bg-white shadow-quiet ${
                    index === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"
                  }`}
                >
                  <Portrait member={member} variant="thumb" />
                </span>
              ))}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body text-aura-muted">{model.scenario.hint}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <MetricPill label="active agreements" value={activeAgreements.length} />
                <MetricPill label="open loops" value={openLoops.length} />
                <MetricPill label="new memories" value={model.memories.length} tone="ink" />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <MemoryBucket title="Before" pairState={model.before} />
            <MemoryBucket title="After" pairState={model.after} />
          </div>
        </LabPanel>

        <LabPanel label="prompt pressure" title={trajectory.state.replaceAll("_", " ")}>
          <div className="space-y-4">
            <p className="text-body leading-relaxed text-aura-muted">
              {trajectory.performerGuidance}
            </p>
            <div className="rounded-card bg-white/60 p-4 ring-1 ring-aura-hairline">
              <MutedLabel>spotlight</MutedLabel>
              {spotlight === null ? (
                <p className="mt-2 text-sm text-aura-muted">No active spotlight after this pass.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <MetricPill
                      label={spotlight.kind === "agreement" ? "agreement" : "loop"}
                      value={spotlight.priority}
                    />
                  </div>
                  <p className="text-body leading-relaxed text-aura-ink/85">{spotlight.guidance}</p>
                </div>
              )}
            </div>

            {trajectory.subnotes.length === 0 ? null : (
              <ul className="space-y-2">
                {trajectory.subnotes.map((note) => (
                  <li
                    key={note}
                    className="rounded-tile bg-white/55 px-3 py-2 text-sm text-aura-muted"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </LabPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <LabPanel label="generated memories" title="Mirror records">
          {model.memories.length === 0 ? (
            <EmptyState>No public mirror memories were generated for this pass.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {model.memories.map((memory) => (
                <li
                  key={memory.id}
                  className="rounded-card bg-white/60 p-4 ring-1 ring-aura-hairline"
                >
                  <p className="text-body leading-relaxed text-aura-ink/85">{memory.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {memory.tags.map((tag) => (
                      <MetricPill key={tag} label="tag" value={tag} />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </LabPanel>

        <LabPanel label="archive timeline" title="Recent pair changes">
          {timeline.length === 0 ? (
            <EmptyState>No timeline entries yet.</EmptyState>
          ) : (
            <ol className="space-y-3">
              {timeline.map((entry) => (
                <li
                  key={entry.id}
                  className="relative rounded-card bg-white/60 p-4 ring-1 ring-aura-hairline"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
                      {entry.kind.replaceAll("_", " ")}
                    </span>
                    <span className="font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
                      {new Date(entry.occurredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-body leading-relaxed text-aura-ink/85">{entry.text}</p>
                </li>
              ))}
            </ol>
          )}
        </LabPanel>
      </div>
    </LabEntrance>
  );
}

function MemoryBucket({ title, pairState }: { title: string; pairState: PairState }) {
  return (
    <section className="rounded-card bg-white/55 p-4 ring-1 ring-aura-hairline">
      <h4 className="font-display text-lg font-semibold leading-tight text-aura-ink">{title}</h4>
      <div className="mt-4 space-y-4">
        <MemoryList
          label="agreements"
          items={pairState.agreements}
          getTone={(item) => item.status}
          getLine={(item) => item.text}
        />
        <MemoryList
          label="open loops"
          items={pairState.openLoops}
          getTone={(item) => item.status}
          getLine={(item) => item.text}
        />
      </div>
    </section>
  );
}

function MemoryList<TItem extends { id: string }>({
  label,
  items,
  getTone,
  getLine,
}: {
  label: string;
  items: readonly TItem[];
  getTone: (item: TItem) => string;
  getLine: (item: TItem) => string;
}) {
  return (
    <div>
      <MutedLabel>{label}</MutedLabel>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-aura-muted">None filed.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-tile bg-white/70 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm leading-relaxed text-aura-ink">{getLine(item)}</p>
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                  {getTone(item)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildMemoryLabModel(scenarioId: MemoryLabScenarioId): MemoryLabModel {
  const scenario = MEMORY_SCENARIOS.find((entry) => entry.id === scenarioId) ?? MEMORY_SCENARIOS[0];
  const pairState = scenarioId === "judge-created" ? buildFreshPairState() : buildLoadedPairState();

  if (scenarioId === "judge-created") {
    const snapshot = makeJudgeSnapshot({
      dateSessionId: "date-memory-lab-judge",
      agreementCandidates: [{ text: "No filming Otis or the table without a clear yes." }],
      openLoopCandidates: [{ text: "Whether Kade can make a memory without uploading it." }],
    });
    const result = applyJudgePairMemoryEffects({
      pairState,
      judgeSnapshot: snapshot,
      timestamp: LAB_NOW,
    });
    return {
      scenario,
      before: pairState,
      after: result.pairState,
      session: makeSession({
        id: snapshot.dateSessionId,
        status: "completed",
        outcome: "mixed",
        judgeSnapshots: [snapshot],
      }),
      memories: result.memories,
    };
  }

  if (scenarioId === "completion-aging") {
    const session = makeSession({
      id: "date-memory-lab-completed",
      status: "completed",
      outcome: "second_date",
    });
    const result = applyCompletedDatePairMemoryEffects({
      pairState,
      session,
      timestamp: LAB_NOW,
    });
    return {
      scenario,
      before: pairState,
      after: result.pairState,
      session,
      memories: result.memories,
    };
  }

  if (scenarioId === "early-end-strain") {
    const session = makeSession({
      id: "date-memory-lab-early-end",
      status: "ended_early",
      outcome: "early_end",
      shouldEndEarly: true,
    });
    const result = applyCompletedDatePairMemoryEffects({
      pairState,
      session,
      timestamp: LAB_NOW,
    });
    return {
      scenario,
      before: pairState,
      after: result.pairState,
      session,
      memories: result.memories,
    };
  }

  const session = makeSession({
    id: "date-memory-lab-follow-up",
    status: "completed",
    outcome: "mixed",
  });
  const result = applyFollowUpPairMemoryEffects({
    pairState,
    session,
    action: "close",
    timestamp: LAB_NOW,
  });
  return {
    scenario,
    before: pairState,
    after: result.pairState,
    session,
    memories: result.memories,
  };
}

function buildFreshPairState(): PairState {
  const [first, second] = pairMembers();
  return buildPairState({
    firstMemberId: first.id,
    secondMemberId: second.id,
    completedDateIds: [],
    agreements: [],
    openLoops: [],
  });
}

function buildLoadedPairState(): PairState {
  const [first, second] = pairMembers();
  const agreements: PairAgreement[] = [
    pairAgreementSchema.parse({
      id: "agreement-memory-lab-phone",
      text: "No filming Otis or the table without a clear yes.",
      status: "active",
      sourceDateSessionId: "date-memory-lab-source",
      sourceJudgeSnapshotId: "judge-memory-lab-source",
      createdAt: "2026-05-18T18:00:00.000Z",
    }),
    pairAgreementSchema.parse({
      id: "agreement-memory-lab-call",
      text: "Call the question plainly before making it content.",
      status: "broken",
      sourceDateSessionId: "date-memory-lab-2",
      sourceJudgeSnapshotId: "judge-memory-lab-2",
      createdAt: "2026-05-19T18:00:00.000Z",
      resolvedAt: "2026-05-20T18:00:00.000Z",
    }),
  ];
  const openLoops: OpenLoop[] = [
    {
      id: "open-loop-memory-lab-upload",
      text: "Whether Kade can make a memory without uploading it.",
      status: "open",
      sourceDateSessionId: "date-memory-lab-source",
      sourceJudgeSnapshotId: "judge-memory-lab-source",
      createdAt: "2026-05-18T18:00:00.000Z",
    },
    {
      id: "open-loop-memory-lab-release",
      text: "Whether Junie asks for an actual release form next time.",
      status: "resolved",
      sourceDateSessionId: "date-memory-lab-2",
      sourceJudgeSnapshotId: "judge-memory-lab-2",
      createdAt: "2026-05-19T18:00:00.000Z",
      resolvedAt: "2026-05-21T18:00:00.000Z",
    },
  ];

  return buildPairState({
    firstMemberId: first.id,
    secondMemberId: second.id,
    completedDateIds: [
      "date-memory-lab-source",
      "date-memory-lab-2",
      "date-memory-lab-3",
      "date-memory-lab-4",
      "date-memory-lab-5",
    ],
    agreements,
    openLoops,
  });
}

function buildPairState({
  firstMemberId,
  secondMemberId,
  completedDateIds,
  agreements,
  openLoops,
}: {
  firstMemberId: string;
  secondMemberId: string;
  completedDateIds: string[];
  agreements: PairAgreement[];
  openLoops: OpenLoop[];
}): PairState {
  return pairStateSchema.parse({
    id: makePairId(firstMemberId, secondMemberId),
    participantIds: sortMemberIds(firstMemberId, secondMemberId),
    laneStatus: "open",
    stats: derivePairStats({
      chemistry: 63,
      trust: 49,
      stability: 46,
      conflict: 42,
      weirdnessTolerance: 72,
      spark: 62,
      strain: 0,
      relationshipHealth: 0,
    }),
    completedDateIds,
    scenarioUseCounts: { "soft-launch-photo-wall": 1 },
    agreements,
    openLoops,
  });
}

function makeJudgeSnapshot({
  dateSessionId,
  agreementCandidates = [],
  openLoopCandidates = [],
  shouldEndEarly = false,
}: {
  dateSessionId: string;
  agreementCandidates?: JudgeSnapshot["agreementCandidates"];
  openLoopCandidates?: JudgeSnapshot["openLoopCandidates"];
  shouldEndEarly?: boolean;
}): JudgeSnapshot {
  const [first, second] = pairMembers();
  return judgeSnapshotSchema.parse({
    id: `judge-${dateSessionId}`,
    dateSessionId,
    exchangeIndex: 1,
    dateHealthDelta: shouldEndEarly ? -8 : 4,
    statDeltas: shouldEndEarly ? { conflict: 6, trust: -4 } : { trust: 3, spark: 2 },
    memberMoodDeltas: { [first.id]: shouldEndEarly ? -4 : 2, [second.id]: shouldEndEarly ? -3 : 2 },
    shouldEndEarly,
    earlyEndReason: shouldEndEarly ? "Boundary crossed before the pair could repair." : undefined,
    endSentiment: shouldEndEarly ? "negative" : null,
    notableMoments: ["The pair named a concrete continuity item."],
    playerSummary: shouldEndEarly
      ? "The date strained unresolved pair material."
      : "Cupid found usable continuity material.",
    memoryCandidates: [],
    usedEvidenceIds: [],
    agreementCandidates,
    agreementUpdates: [],
    openLoopCandidates,
    openLoopUpdates: [],
  });
}

function makeSession({
  id,
  status,
  outcome,
  judgeSnapshots = [],
  shouldEndEarly = false,
}: {
  id: string;
  status: DateSession["status"];
  outcome: NonNullable<DateSession["finalReport"]>["outcome"];
  judgeSnapshots?: JudgeSnapshot[];
  shouldEndEarly?: boolean;
}): DateSession {
  const [first, second] = pairMembers();
  const scenario =
    starterScenarios.find((candidate) => candidate.id === "soft-launch-photo-wall") ??
    starterScenarios[0];
  const finalReport = dateFinalReportSchema.parse({
    id: `report-${id}`,
    dateSessionId: id,
    completedAt: LAB_NOW,
    outcome,
    summary: "Memory lab final report.",
    statSummary: "The file moved because concrete pair memory changed.",
    recommendedFollowUp: outcome === "early_end" ? "cool_down" : "pursue",
    memoryRecordIds: [],
  });

  return dateSessionSchema.parse({
    id,
    pairId: makePairId(first.id, second.id),
    shiftNumber: 6,
    scenarioId: scenario.id,
    focusMemberId: first.id,
    focusRequestId: first.state.currentRequestId,
    currentTurn: 6,
    dateHealth: shouldEndEarly ? 22 : 64,
    status,
    runtimeMode: "local_ai",
    participants: sortMemberIds(first.id, second.id),
    transcript: [],
    privateStateByCharacter: {
      [first.id]: { mood: 58, comfort: 52, intent: "testing pair memory" },
      [second.id]: { mood: 62, comfort: 49, intent: "testing pair memory" },
    },
    judgeSnapshots:
      judgeSnapshots.length > 0
        ? judgeSnapshots
        : [makeJudgeSnapshot({ dateSessionId: id, shouldEndEarly })],
    eventDraft: { offered: [], picked: null },
    eventsTriggered: [],
    playbackState: "ended",
    endSentiment: shouldEndEarly ? "negative" : "positive",
    endReason: shouldEndEarly ? "judge_early_end" : "natural_wrap",
    interventions: [],
    finalReport,
  });
}

function pairMembers() {
  return [requireMember("junie-marrow"), requireMember("kade-sumner")] as const;
}

function requireMember(memberId: string) {
  const member = starterMembers.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Missing playground member ${memberId}`);
  }
  return member;
}
