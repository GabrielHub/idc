import { useMemo, useState } from "react";

import {
  dateFinalReportSchema,
  dateSessionSchema,
  gameSaveSchema,
  pairStateSchema,
  playerKnowledgeRecordSchema,
  type ActiveDateBooking,
  type DateFinalReport,
  type DateSession,
  type FollowUpAction,
  type GameSave,
  type Member,
  type PairState,
  type PlayerKnowledgeRecord,
} from "../../../domain/game";
import { buildDateImpactReceipt } from "../../../services/date-impact";
import { commitDateBooking, requirePairState } from "../../../services/date-engine";
import {
  attachClosureCardOffer,
  attachDateCardOffer,
  deckIsRepairBlocked,
  planCardOfferResolution,
  resolveCardOffer,
  shuffleCardOffer,
} from "../../../services/deck";
import {
  activeBudgetDiscountOffers,
  computeEffectiveCosts,
  currentDeckSpend,
  deriveDeckBudgetStatus,
} from "../../../services/budget";
import { starterScenarios } from "../../../fixtures";
import {
  DeltaValue,
  EmptyState,
  LabPanel,
  MetricPill,
  StatBar,
  toneForDelta,
} from "./gameplay-lab-shared";
import {
  PairPlate,
  PresetRail,
  ScenarioCardRow,
  StateReceipt,
  WorkshopShell,
  WORKSHOP_NOW,
  createFocusedWorkshopSave,
  firstAvailablePartnerId,
  makeJudgeSnapshot,
  memberFromSave,
  pickEventsIfNeeded,
  scenarioById,
  startWorkshopDate,
  type PresetOption,
  workshopDate,
} from "./gameplay-loop-lab-common";

type FinalReportPresetId =
  | "second-date"
  | "mixed"
  | "cool-down"
  | "bad-fit"
  | "early-end"
  | "closure-ready"
  | "follow-up-filed";

const FINAL_REPORT_PRESETS: readonly PresetOption<FinalReportPresetId>[] = [
  {
    id: "second-date",
    label: "win",
    title: "Second date",
    detail: "Positive report with clean progress.",
  },
  {
    id: "mixed",
    label: "flat",
    title: "Mixed file",
    detail: "Useful notes without major movement.",
  },
  {
    id: "cool-down",
    label: "risk",
    title: "Cool down",
    detail: "The safest next action is to pause.",
  },
  {
    id: "bad-fit",
    label: "lane",
    title: "Bad fit",
    detail: "The pairing is low-value.",
  },
  {
    id: "early-end",
    label: "hard",
    title: "Ended early",
    detail: "Cupid filed pressure before the wrap.",
  },
  {
    id: "closure-ready",
    label: "close",
    title: "Closure ready",
    detail: "The pair can leave Cupid together.",
  },
  {
    id: "follow-up-filed",
    label: "done",
    title: "Follow-up filed",
    detail: "The follow-up action is already stored.",
  },
];

type FinalReportLabModel = {
  save: GameSave;
  session: DateSession;
  report: DateFinalReport;
  impact: ReturnType<typeof buildDateImpactReceipt>;
  members: readonly Member[];
  pairState: PairState;
  reads: readonly PlayerKnowledgeRecord[];
};

export function FinalReportLabTest() {
  const [presetId, setPresetId] = useState<FinalReportPresetId>("closure-ready");
  const model = useMemo(() => buildFinalReportLabModel(presetId), [presetId]);
  const report = model.report;
  return (
    <WorkshopShell
      title="Final report lab"
      description="Review outcome receipts, filed reads, stat deltas, and follow-up states directly."
    >
      <PresetRail options={FINAL_REPORT_PRESETS} value={presetId} onChange={setPresetId} />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.2fr_0.8fr]">
        <LabPanel label="receipt" title={model.impact.verdictLabel}>
          <div className="space-y-4">
            <PairPlate
              members={model.members}
              scenario={scenarioById(model.session.scenarioId)}
              eyebrow="reported pair"
            />
            <StateReceipt title="campaign meaning" tone={report.readyToClose ? "good" : "neutral"}>
              <p className="font-semibold text-aura-ink">{model.impact.campaignMeaning}</p>
              <p className="mt-1 text-aura-muted">{model.impact.reason}</p>
            </StateReceipt>
            {model.impact.consequences.map((consequence) => (
              <StateReceipt key={consequence} title="consequence">
                {consequence}
              </StateReceipt>
            ))}
          </div>
        </LabPanel>
        <LabPanel label="stat movement" title={report.outcome.replace("_", " ")}>
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <MetricPill label="follow-up" value={report.recommendedFollowUp} tone="ink" />
              <MetricPill label="applied" value={report.appliedFollowUp ?? "pending"} />
              <MetricPill
                label="ready"
                value={report.readyToClose ? "yes" : "no"}
                tone={report.readyToClose ? "good" : "neutral"}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(report.statChange?.pair ?? {}).map(([stat, value]) => (
                <StateReceipt key={stat} title={stat} tone={toneForDelta(value)}>
                  <DeltaValue value={value} />
                </StateReceipt>
              ))}
            </div>
            <StatBar label="chemistry" value={model.pairState.stats.chemistry} />
            <StatBar label="trust" value={model.pairState.stats.trust} />
            <StatBar label="relationship health" value={model.pairState.stats.relationshipHealth} />
            <StatBar label="strain" value={model.pairState.stats.strain} />
          </div>
        </LabPanel>
        <LabPanel label="filed reads" title={`${model.reads.length} records`}>
          {model.reads.length === 0 ? (
            <EmptyState>No player knowledge records were filed for this report.</EmptyState>
          ) : (
            <div className="space-y-3">
              {model.reads.map((read) => (
                <StateReceipt key={read.id} title={read.readKind} tone="good">
                  {read.readText}
                </StateReceipt>
              ))}
            </div>
          )}
        </LabPanel>
      </div>
    </WorkshopShell>
  );
}

function buildFinalReportLabModel(presetId: FinalReportPresetId): FinalReportLabModel {
  const { save: startedSave, session: startedSession } = startWorkshopDate();
  const { save: saveAfterDraft, session } = pickEventsIfNeeded(startedSave, startedSession);
  const members = session.participants.map((id) => memberFromSave(saveAfterDraft, id));
  const pairState = pairStateSchema.parse({
    ...requirePairState(saveAfterDraft, session.pairId),
    stats: finalReportPairStats(presetId),
    completedDateIds: ["date-report-prior-1", "date-report-prior-2", session.id],
    agreements: [],
    openLoops: [],
  });
  const outcome = finalReportOutcome(presetId);
  const readyToClose = presetId === "closure-ready";
  const report = dateFinalReportSchema.parse({
    id: `final-report-lab-${presetId}`,
    dateSessionId: session.id,
    completedAt: WORKSHOP_NOW,
    outcome,
    summary: finalReportSummary(outcome, members),
    statSummary: readyToClose
      ? "Case read: this pair can close cleanly."
      : "Case read: the file still needs another useful decision.",
    matchmakingIntent: "comfort",
    intentOutcome:
      outcome === "second_date" ? "supported" : outcome === "mixed" ? "mixed" : "unsupported",
    recommendedFollowUp: finalReportFollowUp(outcome),
    appliedFollowUp: presetId === "follow-up-filed" ? "pursue" : undefined,
    memoryRecordIds: [],
    readyToClose,
    statChange: {
      pair: finalReportPairDeltas(outcome),
      members: Object.fromEntries(
        members.map((member) => [
          member.id,
          {
            mood: outcome === "second_date" ? 3 : outcome === "early_end" ? -9 : -2,
            retention: outcome === "second_date" ? 2 : outcome === "bad_fit" ? -14 : -3,
            burnout: outcome === "second_date" ? -2 : outcome === "early_end" ? 8 : 2,
          },
        ]),
      ),
    },
  });
  const judge = makeJudgeSnapshot({
    session,
    dateHealthDelta: outcome === "second_date" ? 12 : outcome === "early_end" ? -22 : -5,
    shouldEndEarly: outcome === "early_end",
    members,
  });
  const reportedSession = dateSessionSchema.parse({
    ...session,
    currentTurn: session.turnLimit,
    dateHealth:
      outcome === "second_date"
        ? 78
        : outcome === "bad_fit"
          ? 22
          : outcome === "early_end"
            ? 8
            : 52,
    status: outcome === "early_end" ? "ended_early" : "completed",
    playbackState: "ended",
    endSentiment:
      outcome === "second_date" ? "positive" : outcome === "early_end" ? "negative" : "positive",
    endReason: outcome === "early_end" ? "judge_early_end" : "natural_wrap",
    judgeSnapshots: [judge],
    finalReport: report,
  });
  const reads =
    presetId === "mixed" || presetId === "closure-ready" ? makeFiledReads(reportedSession) : [];
  const save = gameSaveSchema.parse({
    ...saveAfterDraft,
    pairStates: [pairState],
    dateSessions: [reportedSession],
    playerKnowledge: reads,
  });
  const impact = buildDateImpactReceipt({
    report,
    session: reportedSession,
    save,
    filedReadCount: reads.length,
  });
  return { save, session: reportedSession, report, impact, members, pairState, reads };
}

type DeckPresetId =
  | "hand"
  | "date-offer"
  | "closure-offer"
  | "shuffle"
  | "over-budget"
  | "resolved";

const DECK_PRESETS: readonly PresetOption<DeckPresetId>[] = [
  {
    id: "hand",
    label: "draw",
    title: "Booking hand",
    detail: "The three rooms drawn after pair commit.",
  },
  {
    id: "date-offer",
    label: "3x1",
    title: "Post-date offer",
    detail: "Three cards from the pile, take one.",
  },
  {
    id: "closure-offer",
    label: "5x2",
    title: "Closure offer",
    detail: "Five cards, take two, shuffle once.",
  },
  {
    id: "shuffle",
    label: "reroll",
    title: "Closure shuffle",
    detail: "The closure offer after its reshuffle.",
  },
  {
    id: "over-budget",
    label: "cap",
    title: "Budget pressure",
    detail: "A take that needs a drop to resolve.",
  },
  {
    id: "resolved",
    label: "filed",
    title: "Resolved offer",
    detail: "Taken room cards enter the Date Book.",
  },
];

type DeckLabModel = {
  save: GameSave;
  committedBooking: ActiveDateBooking | undefined;
  plan: ReturnType<typeof planCardOfferResolution> | undefined;
  repairPlan: ReturnType<typeof planCardOfferResolution> | undefined;
  repairBlocked: boolean;
};

export function DeckWorkshopTest() {
  const [presetId, setPresetId] = useState<DeckPresetId>("closure-offer");
  const model = useMemo(() => buildDeckLabModel(presetId), [presetId]);
  const offer = model.save.pendingCardOffer;
  const costs = computeEffectiveCosts(starterScenarios, activeBudgetDiscountOffers(model.save));
  const spend = currentDeckSpend(model.save.scenarioDeck.cardIds, costs);
  const budget = deriveDeckBudgetStatus({
    cardIds: model.save.scenarioDeck.cardIds,
    effectiveCosts: costs,
    budgetCap: model.save.budgetCap,
  });

  return (
    <WorkshopShell
      title="Date Book lab"
      description="Balance hands, offers, shuffles, budget drops, and repair gates directly."
    >
      <PresetRail options={DECK_PRESETS} value={presetId} onChange={setPresetId} />
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.2fr_0.8fr]">
        <LabPanel
          label="Date Book"
          title={`${model.save.scenarioDeck.cardIds.length} room cards / ${spend} spend`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <MetricPill label="cap" value={model.save.budgetCap} tone="ink" />
              <MetricPill
                label="status"
                value={budget.status}
                tone={budget.status === "within_budget" ? "good" : "bad"}
              />
              <MetricPill
                label="repair"
                value={model.repairBlocked ? "blocked" : "open"}
                tone={model.repairBlocked ? "bad" : "good"}
              />
            </div>
            <ScenarioCardRow cardIds={model.save.scenarioDeck.cardIds.slice(0, 6)} />
          </div>
        </LabPanel>
        <LabPanel
          label="offer surface"
          title={offer === null ? "No pending offer" : `${offer.kind} offer`}
        >
          {model.committedBooking !== undefined ? (
            <ScenarioCardRow cardIds={model.committedBooking.drawnScenarioIds} />
          ) : offer === null ? (
            <EmptyState>This preset has no pending offer.</EmptyState>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <MetricPill label="take" value={offer.takeLimit} tone="ink" />
                <MetricPill label="shuffle" value={offer.canShuffle ? "available" : "spent"} />
              </div>
              <ScenarioCardRow cardIds={offer.cardIds} />
            </div>
          )}
        </LabPanel>
        <LabPanel label="resolution" title="Plan verdict">
          <div className="space-y-3">
            {model.plan === undefined ? (
              <EmptyState>Pick an offer preset to inspect take/drop legality.</EmptyState>
            ) : (
              <OfferPlanReceipt title="current plan" plan={model.plan} />
            )}
            {model.repairPlan === undefined ? null : (
              <OfferPlanReceipt title="with one drop" plan={model.repairPlan} />
            )}
          </div>
        </LabPanel>
      </div>
    </WorkshopShell>
  );
}

function OfferPlanReceipt({
  title,
  plan,
}: {
  title: string;
  plan: ReturnType<typeof planCardOfferResolution>;
}) {
  return (
    <StateReceipt title={title} tone={plan.legal ? "good" : "bad"}>
      <div className="space-y-2">
        <p>{plan.message ?? "Legal. The offer can be filed."}</p>
        <div className="flex flex-wrap gap-2">
          <MetricPill
            label="size"
            value={plan.finalSize}
            tone={plan.overSlotCap || plan.underSlotMin ? "bad" : "neutral"}
          />
          <MetricPill
            label="spend"
            value={plan.finalSpend}
            tone={plan.overBudget ? "bad" : "neutral"}
          />
          <MetricPill label="dropped" value={plan.dropped.length} />
          <MetricPill label="declined" value={plan.declined.length} />
        </div>
      </div>
    </StateReceipt>
  );
}

function buildDeckLabModel(presetId: DeckPresetId): DeckLabModel {
  const base = createFocusedWorkshopSave();
  const repairBlocked = deckIsRepairBlocked(base, starterScenarios);
  if (presetId === "hand") {
    const committed = commitDateBooking(base, {
      focusMemberId: base.focusedMemberIds[0],
      partnerMemberId: firstAvailablePartnerId(base),
      matchmakingIntent: "spark",
      now: workshopDate(),
    });
    return {
      save: committed.save,
      committedBooking: committed.booking,
      plan: undefined,
      repairPlan: undefined,
      repairBlocked,
    };
  }
  const withOffer =
    presetId === "closure-offer" || presetId === "shuffle"
      ? attachClosureCardOffer(base)
      : attachDateCardOffer(base);
  const saveWithOffer =
    presetId === "shuffle" ? shuffleCardOffer(withOffer, "workshop-closure-shuffle") : withOffer;
  const offer = saveWithOffer.pendingCardOffer;
  if (offer === null) {
    return {
      save: saveWithOffer,
      committedBooking: undefined,
      plan: undefined,
      repairPlan: undefined,
      repairBlocked,
    };
  }
  const takenIds = offer.cardIds.slice(0, offer.takeLimit);
  const pressuredSave =
    presetId === "over-budget"
      ? gameSaveSchema.parse({ ...saveWithOffer, budgetCap: 60 })
      : saveWithOffer;
  const dropIds = presetId === "resolved" ? [pressuredSave.scenarioDeck.cardIds[0]] : [];
  const plan = planCardOfferResolution(pressuredSave, starterScenarios, {
    takenIds,
    droppedIds: dropIds,
  });
  const repairPlan =
    presetId === "over-budget"
      ? planCardOfferResolution(pressuredSave, starterScenarios, {
          takenIds,
          droppedIds: pressuredSave.scenarioDeck.cardIds.slice(0, 2),
        })
      : undefined;
  const resolvedSave =
    presetId === "resolved" && plan.legal
      ? resolveCardOffer(pressuredSave, starterScenarios, { takenIds, droppedIds: dropIds })
      : pressuredSave;
  return {
    save: resolvedSave,
    committedBooking: undefined,
    plan,
    repairPlan,
    repairBlocked: deckIsRepairBlocked(resolvedSave, starterScenarios),
  };
}

function finalReportOutcome(presetId: FinalReportPresetId): DateFinalReport["outcome"] {
  if (presetId === "cool-down") return "cool_down";
  if (presetId === "bad-fit") return "bad_fit";
  if (presetId === "early-end") return "early_end";
  if (presetId === "mixed") return "mixed";
  return "second_date";
}

function finalReportFollowUp(outcome: DateFinalReport["outcome"]): FollowUpAction {
  if (outcome === "second_date") return "pursue";
  if (outcome === "bad_fit") return "close";
  return "cool_down";
}

function finalReportSummary(
  outcome: DateFinalReport["outcome"],
  members: readonly Member[],
): string {
  const [first, second] = members;
  const names = `${first?.firstName ?? "One member"} and ${second?.firstName ?? "the partner"}`;
  if (outcome === "second_date") return `${names} left with clean momentum and a usable next step.`;
  if (outcome === "bad_fit")
    return `${names} confirmed this lane is unlikely to produce a closure.`;
  if (outcome === "early_end") return `${names} ended early after pressure became the date.`;
  if (outcome === "cool_down")
    return `${names} finished, but Cupid recommends space before rebooking.`;
  return `${names} filed useful notes without clear closure movement.`;
}

function finalReportPairStats(presetId: FinalReportPresetId): PairState["stats"] {
  const ready = presetId === "closure-ready";
  return {
    chemistry: ready ? 82 : presetId === "bad-fit" ? 28 : 63,
    trust: ready ? 80 : presetId === "early-end" ? 44 : 61,
    stability: ready ? 78 : 55,
    conflict: ready ? 16 : presetId === "bad-fit" ? 72 : 35,
    weirdnessTolerance: 68,
    spark: ready ? 78 : 58,
    strain: ready ? 18 : presetId === "early-end" ? 70 : 38,
    relationshipHealth: ready ? 82 : presetId === "bad-fit" ? 24 : 60,
  };
}

function finalReportPairDeltas(
  outcome: DateFinalReport["outcome"],
): Partial<Record<keyof PairState["stats"], number>> {
  if (outcome === "second_date")
    return { chemistry: 8, trust: 6, relationshipHealth: 9, strain: -4 };
  if (outcome === "bad_fit")
    return { chemistry: -10, conflict: 12, relationshipHealth: -14, strain: 9 };
  if (outcome === "early_end")
    return { trust: -8, conflict: 8, relationshipHealth: -12, strain: 14 };
  if (outcome === "cool_down")
    return { chemistry: -2, conflict: 5, relationshipHealth: -5, strain: 6 };
  return { chemistry: 1, trust: 1, relationshipHealth: 0, strain: 1 };
}

function makeFiledReads(session: DateSession): PlayerKnowledgeRecord[] {
  return [
    playerKnowledgeRecordSchema.parse({
      id: `knowledge-${session.id}-boundary`,
      subjectKind: "pair",
      subjectId: session.pairId,
      readKind: "pair_dynamic",
      readId: "workshop-pair-dynamic",
      readText: "This pair responds better when the room gives them one concrete next step.",
      confidence: "filed",
      source: "judge",
      dateSessionId: session.id,
      judgeSnapshotId: session.judgeSnapshots[0]?.id,
      evidenceText: "The transcript included a clear next-step repair.",
      revealedAt: WORKSHOP_NOW,
    }),
  ];
}
