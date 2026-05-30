import { useMemo, useState } from "react";

import {
  dateFinalReportSchema,
  dateSessionSchema,
  gameSaveSchema,
  pairStateSchema,
  shiftStateSchema,
  type DateSession,
  type GameSave,
  type Member,
  type PairState,
  type ShiftFollowUpReservation,
  type ShiftState,
} from "../../../domain/game";
import { Portrait } from "../../../components/dashboard-atoms";
import { commitDateBooking, isCampaignLost } from "../../../services/date-engine";
import {
  closePair,
  clientLossLimit,
  evaluateClosureReadiness,
  getReadyClosurePairs,
  shouldShowSoftWin,
} from "../../../services/closures";
import {
  canBeFocusCase,
  previewReselectDrops,
  removeFocusCase,
  swapFocusCase,
} from "../../../services/focus-cases";
import { getActiveShift, makePairId, sortMemberIds } from "../../../services/game-seed";
import {
  classifyShiftPartners,
  followUpPartnerMemberIds,
  type ShiftPartnerUnavailableReason,
} from "../../../services/shift-availability";
import {
  buildShiftAskDeskEntries,
  deriveHotRequestId,
} from "../../../services/shift-request-assessment";
import { LabPanel, MetricPill, StatBar } from "./gameplay-lab-shared";
import {
  DetailList,
  PairPlate,
  PresetRail,
  StateReceipt,
  WorkshopShell,
  WORKSHOP_FOCUS_IDS,
  WORKSHOP_NOW,
  WORKSHOP_SCENARIO_ID,
  createFocusedWorkshopSave,
  currentRequestFor,
  firstAvailablePartnerId,
  makeJudgeSnapshot,
  memberFromSave,
  replaceById,
  scenarioById,
  type PresetOption,
  workshopDate,
} from "./gameplay-loop-lab-common";

type ShiftPlanningPresetId = "fresh" | "cooldown" | "reservation" | "booking";

const SHIFT_PLANNING_PRESETS: readonly PresetOption<ShiftPlanningPresetId>[] = [
  {
    id: "fresh",
    label: "base",
    title: "Fresh board",
    detail: "Focus cases, available partners, and a lead ask.",
  },
  {
    id: "cooldown",
    label: "cool",
    title: "Cooldown blocker",
    detail: "A roster member is unavailable after dating.",
  },
  {
    id: "reservation",
    label: "hold",
    title: "Follow-up reserved",
    detail: "Pursue pins a partner through cooldown.",
  },
  {
    id: "booking",
    label: "live",
    title: "Active booking",
    detail: "The pair is committed and the hand is locked.",
  },
];

type ShiftPlanningModel = {
  save: GameSave;
  shift: ShiftState;
  classification: ReturnType<typeof classifyShiftPartners>;
  leadRequestId: string | undefined;
  askEntries: ReturnType<typeof buildShiftAskDeskEntries>;
  focusMembers: readonly Member[];
  reservedPartnerIds: readonly string[];
};

export function ShiftPlanningLabTest() {
  const [presetId, setPresetId] = useState<ShiftPlanningPresetId>("fresh");
  const model = useMemo(() => buildShiftPlanningModel(presetId), [presetId]);
  const booking = model.shift.activeBooking;
  return (
    <WorkshopShell
      title="Shift planning lab"
      description="Inspect partner logistics, lead asks, cooldown, reservations, and booking locks."
    >
      <PresetRail options={SHIFT_PLANNING_PRESETS} value={presetId} onChange={setPresetId} />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr_0.85fr]">
        <LabPanel label="case desk" title="Focus cases">
          <div className="space-y-3">
            {model.focusMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-card bg-white/55 px-4 py-3 ring-1 ring-aura-hairline"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Portrait member={member} variant="chip" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-aura-ink">{member.name}</p>
                    <p className="truncate text-sm text-aura-muted">
                      {currentRequestFor(member)?.text ?? "No active ask"}
                    </p>
                  </div>
                </div>
                <MetricPill
                  label="lead"
                  value={currentRequestFor(member)?.id === model.leadRequestId ? "yes" : "no"}
                  tone={currentRequestFor(member)?.id === model.leadRequestId ? "good" : "neutral"}
                />
              </div>
            ))}
          </div>
        </LabPanel>
        <LabPanel
          label="tonight's roster"
          title={`${model.classification.available.length} available`}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {model.classification.available.slice(0, 8).map((member) => (
              <StateReceipt
                key={member.id}
                title={model.reservedPartnerIds.includes(member.id) ? "reserved" : "available"}
                tone={model.reservedPartnerIds.includes(member.id) ? "good" : "neutral"}
              >
                {member.name}
              </StateReceipt>
            ))}
          </div>
        </LabPanel>
        <LabPanel label="off tonight" title="Blocker mix">
          <div className="space-y-3">
            {booking === undefined ? null : (
              <StateReceipt title="active booking" tone="ink">
                <p>
                  {memberFromSave(model.save, booking.focusMemberId).firstName} has a committed
                  pair.
                </p>
                <p className="mt-1 text-white/70">
                  {booking.drawnScenarioIds.length} rooms are locked.
                </p>
              </StateReceipt>
            )}
            <ReasonCounts classification={model.classification} />
            <DetailList
              items={model.askEntries.map((entry) => ({
                label: entry.memberName,
                value: entry.outcomeLabel,
              }))}
            />
          </div>
        </LabPanel>
      </div>
    </WorkshopShell>
  );
}

function ReasonCounts({
  classification,
}: {
  classification: ReturnType<typeof classifyShiftPartners>;
}) {
  const counts = new Map<ShiftPartnerUnavailableReason, number>();
  for (const entry of classification.unavailable) {
    counts.set(entry.reason, (counts.get(entry.reason) ?? 0) + 1);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from(counts.entries()).map(([reason, count]) => (
        <MetricPill key={reason} label={reasonLabel(reason)} value={count} />
      ))}
    </div>
  );
}

function buildShiftPlanningModel(presetId: ShiftPlanningPresetId): ShiftPlanningModel {
  let save = createFocusedWorkshopSave();
  const activeShift = getActiveShift(save);
  const partnerId = firstAvailablePartnerId(save);
  if (presetId === "cooldown") {
    save = gameSaveSchema.parse({
      ...save,
      members: save.members.map((member) =>
        member.id === partnerId
          ? { ...member, state: { ...member.state, lastDateShift: activeShift.shiftNumber } }
          : member,
      ),
    });
  }
  if (presetId === "reservation") {
    const reservation: ShiftFollowUpReservation = {
      focusMemberId: save.focusedMemberIds[0],
      partnerMemberId: partnerId,
      sourceDateSessionId: "date-shift-planning-prior",
    };
    const nextShift = shiftStateSchema.parse({
      ...activeShift,
      followUpReservations: [reservation],
      availablePartnerMemberIds: [
        partnerId,
        ...activeShift.availablePartnerMemberIds.filter((id) => id !== partnerId),
      ],
    });
    save = gameSaveSchema.parse({ ...save, shifts: replaceById(save.shifts, nextShift) });
  }
  if (presetId === "booking") {
    save = commitDateBooking(save, {
      focusMemberId: save.focusedMemberIds[0],
      partnerMemberId: partnerId,
      matchmakingIntent: "repair",
      now: workshopDate(),
    }).save;
  }
  const shift = getActiveShift(save);
  const reservedPartnerIds = followUpPartnerMemberIds(shift.followUpReservations);
  const classification = classifyShiftPartners({
    members: save.members,
    shiftNumber: shift.shiftNumber,
    focusedMemberIds: save.focusedMemberIds,
    availablePartnerMemberIds: shift.availablePartnerMemberIds,
    cooldownExemptMemberIds: reservedPartnerIds,
    pairStates: save.pairStates,
  });
  return {
    save,
    shift,
    classification,
    leadRequestId: deriveHotRequestId(shift),
    askEntries: buildShiftAskDeskEntries({ shift, members: save.members }),
    focusMembers: save.focusedMemberIds.map((id) => memberFromSave(save, id)),
    reservedPartnerIds,
  };
}

type ClosurePresetId =
  | "not-ready"
  | "near-miss"
  | "ready"
  | "closed"
  | "soft-win"
  | "campaign-loss";

const CLOSURE_PRESETS: readonly PresetOption<ClosurePresetId>[] = [
  {
    id: "not-ready",
    label: "open",
    title: "Below threshold",
    detail: "Stats or date count are not high enough.",
  },
  {
    id: "near-miss",
    label: "block",
    title: "Near miss",
    detail: "Strong stats, but an open loop blocks closure.",
  },
  {
    id: "ready",
    label: "ready",
    title: "Ready pair",
    detail: "Meets the threshold and should surface.",
  },
  {
    id: "closed",
    label: "filed",
    title: "Closed pair",
    detail: "closePair side effects after confirmation.",
  },
  {
    id: "soft-win",
    label: "promo",
    title: "Soft win",
    detail: "Five closures can fire the promotion.",
  },
  {
    id: "campaign-loss",
    label: "loss",
    title: "Campaign loss",
    detail: "Enough clients quit to hit the cap.",
  },
];

type ClosureModel = {
  save: GameSave;
  pairState: PairState;
  session: DateSession;
  members: readonly Member[];
  readiness: boolean;
  readyPairs: ReturnType<typeof getReadyClosurePairs>;
  closedSave: GameSave | undefined;
};

export function ClosureCampaignLabTest() {
  const [presetId, setPresetId] = useState<ClosurePresetId>("ready");
  const model = useMemo(() => buildClosureModel(presetId), [presetId]);
  const activeSave = model.closedSave ?? model.save;
  return (
    <WorkshopShell
      title="Closure campaign lab"
      description="Exercise closure thresholds, near misses, close-pair side effects, soft win, and loss states."
    >
      <PresetRail options={CLOSURE_PRESETS} value={presetId} onChange={setPresetId} />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr_0.85fr]">
        <LabPanel label="closure read" title={model.readiness ? "Ready" : "Still open"}>
          <div className="space-y-4">
            <PairPlate
              members={model.members}
              scenario={scenarioById(model.session.scenarioId)}
              eyebrow="closure lane"
            />
            <StatBar label="chemistry" value={model.pairState.stats.chemistry} />
            <StatBar label="trust" value={model.pairState.stats.trust} />
            <StatBar label="relationship health" value={model.pairState.stats.relationshipHealth} />
            <StatBar label="strain" value={model.pairState.stats.strain} />
            <StatBar label="conflict" value={model.pairState.stats.conflict} />
          </div>
        </LabPanel>
        <LabPanel label="side effects" title={`${activeSave.closureCount} closures`}>
          <div className="grid gap-3">
            <StateReceipt
              title="ready pairs"
              tone={model.readyPairs.length > 0 ? "good" : "neutral"}
            >
              {model.readyPairs.length} pair{model.readyPairs.length === 1 ? "" : "s"} can be closed
              now.
            </StateReceipt>
            <StateReceipt
              title="soft win"
              tone={shouldShowSoftWin(activeSave) ? "good" : "neutral"}
            >
              {shouldShowSoftWin(activeSave)
                ? "Promotion cutscene available."
                : "Soft-win threshold not firing."}
            </StateReceipt>
            <StateReceipt
              title="campaign loss"
              tone={isCampaignLost(activeSave) ? "bad" : "neutral"}
            >
              {quitCount(activeSave)} quits / cap {clientLossLimit(activeSave)}
            </StateReceipt>
            <DetailList
              items={model.members.map((member) => {
                const after =
                  activeSave.members.find((candidate) => candidate.id === member.id) ?? member;
                return {
                  label: member.firstName,
                  value: `${after.state.status} / retention ${after.state.retention}`,
                };
              })}
            />
          </div>
        </LabPanel>
        <LabPanel label="file evidence" title="Blocking facts">
          <div className="space-y-3">
            <MetricPill label="completed" value={model.pairState.completedDateIds.length} />
            <MetricPill label="agreements" value={model.pairState.agreements.length} />
            <MetricPill
              label="open loops"
              value={model.pairState.openLoops.filter((loop) => loop.status === "open").length}
              tone={
                model.pairState.openLoops.some((loop) => loop.status === "open") ? "warn" : "good"
              }
            />
            <StateReceipt
              title="latest report"
              tone={model.session.finalReport?.readyToClose ? "good" : "neutral"}
            >
              {model.session.finalReport?.summary ?? "No final report."}
            </StateReceipt>
          </div>
        </LabPanel>
      </div>
    </WorkshopShell>
  );
}

function buildClosureModel(presetId: ClosurePresetId): ClosureModel {
  if (presetId === "campaign-loss") {
    const seeded = seedCampaignLossWorkshopSave();
    const first = memberFromSave(seeded, WORKSHOP_FOCUS_IDS[0]);
    const second = memberFromSave(seeded, firstAvailablePartnerId(seeded));
    const pairState = buildClosurePairState(first, second, "not-ready", "date-closure-loss");
    const session = buildClosureSession(pairState, first, second, false);
    return {
      save: seeded,
      pairState,
      session,
      members: [first, second],
      readiness: evaluateClosureReadiness({
        pairState,
        outcome: session.finalReport?.outcome ?? "mixed",
        completedDateCount: pairState.completedDateIds.length,
        members: [first, second],
      }),
      readyPairs: getReadyClosurePairs(seeded),
      closedSave: undefined,
    };
  }
  let save = createFocusedWorkshopSave();
  const first = memberFromSave(save, save.focusedMemberIds[0]);
  const second = memberFromSave(save, firstAvailablePartnerId(save));
  const stateKind =
    presetId === "near-miss" ? "near-miss" : presetId === "not-ready" ? "not-ready" : "ready";
  const pairState = buildClosurePairState(first, second, stateKind, "date-closure-lab");
  const session = buildClosureSession(pairState, first, second, stateKind === "ready");
  save = gameSaveSchema.parse({ ...save, pairStates: [pairState], dateSessions: [session] });
  if (presetId === "soft-win") {
    save = gameSaveSchema.parse({ ...save, closureCount: 5, softWinSeen: false });
  }
  const closedSave =
    presetId === "closed"
      ? closePair({
          save,
          pairId: pairState.id,
          summary: `${first.firstName} and ${second.firstName} closed the file together after three clean dates.`,
          now: workshopDate(),
        })
      : undefined;
  return {
    save,
    pairState,
    session,
    members: [first, second],
    readiness: evaluateClosureReadiness({
      pairState,
      outcome: session.finalReport?.outcome ?? "mixed",
      completedDateCount: pairState.completedDateIds.length,
      members: [first, second],
    }),
    readyPairs: getReadyClosurePairs(save),
    closedSave,
  };
}

type FocusEconomyPresetId = "baseline" | "swap" | "drop" | "quit-cut";

const FOCUS_ECONOMY_PRESETS: readonly PresetOption<FocusEconomyPresetId>[] = [
  {
    id: "baseline",
    label: "desk",
    title: "Current case board",
    detail: "Four focused members and untouched state.",
  },
  {
    id: "swap",
    label: "swap",
    title: "Swap penalty",
    detail: "Replacing a focus case costs retention.",
  },
  {
    id: "drop",
    label: "drop",
    title: "Drop from focus",
    detail: "A punitive drop frees the slot.",
  },
  {
    id: "quit-cut",
    label: "quit",
    title: "Quit and budget cut",
    detail: "Low retention can close a file.",
  },
];

type FocusEconomyModel = {
  before: GameSave;
  after: GameSave;
  droppedMembers: readonly Member[];
  incomingMember: Member | undefined;
  actionLabel: string;
};

export function FocusEconomyLabTest() {
  const [presetId, setPresetId] = useState<FocusEconomyPresetId>("swap");
  const model = useMemo(() => buildFocusEconomyModel(presetId), [presetId]);
  return (
    <WorkshopShell
      title="Focus economy lab"
      description="Test focus slots, drop penalties, quit risk, and budget consequences directly."
    >
      <PresetRail options={FOCUS_ECONOMY_PRESETS} value={presetId} onChange={setPresetId} />
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.85fr]">
        <LabPanel label="before" title="Case board">
          <FocusMemberRows save={model.before} />
        </LabPanel>
        <LabPanel label="after" title={model.actionLabel}>
          <FocusMemberRows save={model.after} />
        </LabPanel>
        <LabPanel label="economy receipt" title="State deltas">
          <div className="space-y-3">
            <StateReceipt
              title="budget cap"
              tone={model.after.budgetCap < model.before.budgetCap ? "bad" : "neutral"}
            >
              <span className="font-mono tabular-nums">
                {model.before.budgetCap} to {model.after.budgetCap}
              </span>
            </StateReceipt>
            {model.incomingMember === undefined ? null : (
              <StateReceipt title="incoming" tone="good">
                {model.incomingMember.name}
              </StateReceipt>
            )}
            {model.droppedMembers.map((member) => {
              const after = memberFromSave(model.after, member.id);
              return (
                <StateReceipt
                  key={member.id}
                  title={member.firstName}
                  tone={after.state.status === "quit" ? "bad" : "warn"}
                >
                  retention {member.state.retention} to {after.state.retention}; status{" "}
                  {after.state.status}
                </StateReceipt>
              );
            })}
            <MetricPill
              label="preview drops"
              value={previewReselectDrops(model.before, model.after.focusedMemberIds).length}
            />
          </div>
        </LabPanel>
      </div>
    </WorkshopShell>
  );
}

function FocusMemberRows({ save }: { save: GameSave }) {
  return (
    <div className="space-y-3">
      {save.focusedMemberIds.map((memberId) => {
        const member = memberFromSave(save, memberId);
        return (
          <div
            key={member.id}
            className="grid gap-3 rounded-card bg-white/55 px-4 py-3 ring-1 ring-aura-hairline sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Portrait member={member} variant="chip" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-aura-ink">{member.name}</p>
                <p className="truncate text-sm text-aura-muted">
                  {currentRequestFor(member)?.text ?? "No active ask"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <MetricPill
                label="ret"
                value={member.state.retention}
                tone={member.state.retention < 25 ? "bad" : "neutral"}
              />
              <MetricPill label="mood" value={member.state.mood} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildFocusEconomyModel(presetId: FocusEconomyPresetId): FocusEconomyModel {
  let before = createFocusedWorkshopSave();
  const outgoingId = before.focusedMemberIds[1];
  const incoming = before.members.find(
    (member) => !before.focusedMemberIds.includes(member.id) && canBeFocusCase(member),
  );
  if (presetId === "baseline" || incoming === undefined) {
    return {
      before,
      after: before,
      droppedMembers: [],
      incomingMember: undefined,
      actionLabel: "No mutation",
    };
  }
  if (presetId === "swap") {
    const after = swapFocusCase(before, outgoingId, incoming.id);
    return {
      before,
      after,
      droppedMembers: [memberFromSave(before, outgoingId)],
      incomingMember: incoming,
      actionLabel: "Swap applied",
    };
  }
  if (presetId === "quit-cut") {
    before = gameSaveSchema.parse({
      ...before,
      members: before.members.map((member) =>
        member.id === outgoingId
          ? { ...member, state: { ...member.state, retention: 20 } }
          : member,
      ),
    });
  }
  const after = removeFocusCase(before, outgoingId);
  return {
    before,
    after,
    droppedMembers: [memberFromSave(before, outgoingId)],
    incomingMember: undefined,
    actionLabel: presetId === "quit-cut" ? "Drop triggered quit risk" : "Drop applied",
  };
}

function buildClosurePairState(
  first: Member,
  second: Member,
  kind: "not-ready" | "near-miss" | "ready",
  sessionId: string,
): PairState {
  const readyStats = {
    chemistry: 82,
    trust: 80,
    stability: 78,
    conflict: 14,
    weirdnessTolerance: 74,
    spark: 79,
    strain: 18,
    relationshipHealth: 83,
  };
  return pairStateSchema.parse({
    id: makePairId(first.id, second.id),
    participantIds: sortMemberIds(first.id, second.id),
    laneStatus: "open",
    stats:
      kind === "not-ready"
        ? { ...readyStats, chemistry: 62, relationshipHealth: 58, trust: 61 }
        : readyStats,
    completedDateIds:
      kind === "not-ready"
        ? [sessionId]
        : ["date-closure-prior-1", "date-closure-prior-2", sessionId],
    scenarioUseCounts: { [WORKSHOP_SCENARIO_ID]: 2 },
    agreements: [],
    openLoops:
      kind === "near-miss"
        ? [
            {
              id: "open-loop-closure-workshop",
              text: "Whether they can discuss the next family introduction without dodging it.",
              status: "open",
              createdAt: WORKSHOP_NOW,
              sourceDateSessionId: sessionId,
              sourceJudgeSnapshotId: "judge-closure-workshop",
            },
          ]
        : [],
  });
}

function buildClosureSession(
  pairState: PairState,
  first: Member,
  second: Member,
  readyToClose: boolean,
): DateSession {
  const report = dateFinalReportSchema.parse({
    id: "final-date-closure-lab",
    dateSessionId: "date-closure-lab",
    completedAt: WORKSHOP_NOW,
    outcome: "second_date",
    summary: `${first.firstName} and ${second.firstName} completed a clean return date.`,
    statSummary: readyToClose
      ? "Case read: threshold cleared."
      : "Case read: the pair is close, but a blocker remains.",
    recommendedFollowUp: "pursue",
    memoryRecordIds: [],
    readyToClose,
  });
  const seedSession = dateSessionSchema.parse({
    id: "date-closure-lab",
    pairId: pairState.id,
    scenarioId: WORKSHOP_SCENARIO_ID,
    currentTurn: 0,
    dateHealth: 70,
    status: "active",
    runtimeMode: "local_ai",
    participants: [first.id, second.id],
    transcript: [],
    privateStateByCharacter: {},
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "paused",
    endSentiment: null,
    interventions: [],
  });
  return dateSessionSchema.parse({
    ...seedSession,
    shiftNumber: 5,
    currentTurn: 14,
    turnLimit: 14,
    judgeTurnInterval: 4,
    dateHealth: 82,
    status: "completed",
    transcript: [
      {
        id: "date-closure-lab-msg-0",
        dateSessionId: "date-closure-lab",
        kind: "scenario",
        turnIndex: 0,
        sequenceIndex: 0,
        text: "The pair returned to the same room and treated it like a real second pass.",
        createdAt: WORKSHOP_NOW,
      },
    ],
    privateStateByCharacter: {
      [first.id]: { mood: 74, comfort: 80, intent: "leaving together" },
      [second.id]: { mood: 72, comfort: 78, intent: "leaving together" },
    },
    judgeSnapshots: [
      makeJudgeSnapshot({
        session: seedSession,
        dateHealthDelta: 10,
        shouldEndEarly: false,
        members: [first, second],
      }),
    ],
    playbackState: "ended",
    endSentiment: "positive",
    endReason: "natural_wrap",
    finalReport: report,
  });
}

function seedCampaignLossWorkshopSave(): GameSave {
  const save = createFocusedWorkshopSave();
  const quitIds = save.members
    .filter((member) => member.state.status === "active")
    .slice(0, clientLossLimit(save))
    .map((member) => member.id);
  return gameSaveSchema.parse({
    ...save,
    members: save.members.map((member) =>
      quitIds.includes(member.id)
        ? { ...member, state: { ...member.state, retention: 0, status: "quit" } }
        : member,
    ),
  });
}

function quitCount(save: Pick<GameSave, "members">): number {
  return save.members.filter((member) => member.state.status === "quit").length;
}

function reasonLabel(reason: ShiftPartnerUnavailableReason): string {
  if (reason === "focus_case") return "focus";
  if (reason === "closed_lane") return "lane";
  if (reason === "off_shift") return "off";
  return reason;
}
