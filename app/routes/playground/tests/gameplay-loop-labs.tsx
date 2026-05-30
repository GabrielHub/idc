import { useMemo, useState } from "react";

import {
  type ActiveDateBooking,
  type DateMessage,
  type DateScenario,
  type DateSession,
  type GameSave,
  type Member,
  type PairState,
} from "../../../domain/game";
import {
  canCutDateShort,
  commitDateBooking,
  completeDateSession,
  requirePairState,
  triggerScenarioEvent,
} from "../../../services/date-engine";
import { EmptyState, LabPanel, MetricPill, StatBar } from "./gameplay-lab-shared";
import {
  DetailList,
  PairPlate,
  PresetRail,
  ScenarioCardRow,
  StateReceipt,
  TimelineList,
  WorkshopShell,
  advanceToJudgeCount,
  createFocusedWorkshopSave,
  firstAvailablePartnerId,
  memberFromSave,
  pickEventsIfNeeded,
  requireActiveBooking,
  scenarioById,
  startWorkshopDate,
  type PresetOption,
  workshopDate,
} from "./gameplay-loop-lab-common";

export { DeckWorkshopTest, FinalReportLabTest } from "./gameplay-loop-report-deck-labs";
export {
  ClosureCampaignLabTest,
  FocusEconomyLabTest,
  ShiftPlanningLabTest,
} from "./gameplay-loop-campaign-labs";

type DateSessionPresetId =
  | "booking"
  | "draft"
  | "picked"
  | "mid-read"
  | "scene-dropped"
  | "cut-short"
  | "completed";

const DATE_SESSION_PRESETS: readonly PresetOption<DateSessionPresetId>[] = [
  {
    id: "booking",
    label: "01",
    title: "Committed booking",
    detail: "A pair is locked and the room hand is drawn.",
  },
  {
    id: "draft",
    label: "02",
    title: "Scene draft",
    detail: "The date is waiting on event picks.",
  },
  {
    id: "picked",
    label: "03",
    title: "Ready to play",
    detail: "Events are drafted and the transcript can advance.",
  },
  {
    id: "mid-read",
    label: "04",
    title: "Cupid checkpoint",
    detail: "The first judge snapshot has landed.",
  },
  {
    id: "scene-dropped",
    label: "05",
    title: "Scene dropped",
    detail: "One drafted event has entered the transcript.",
  },
  {
    id: "cut-short",
    label: "06",
    title: "Cut-short gate",
    detail: "Two Cupid reads make early filing available.",
  },
  {
    id: "completed",
    label: "07",
    title: "Finalized",
    detail: "The report and post-date offer are attached.",
  },
];

type DateSessionLabModel = {
  save: GameSave;
  booking: ActiveDateBooking | undefined;
  session: DateSession | undefined;
  scenario: DateScenario | undefined;
  members: readonly Member[];
  pairState: PairState | undefined;
  transcriptTail: readonly DateMessage[];
  controls: readonly { label: string; enabled: boolean }[];
};

export function DateSessionLabTest() {
  const [presetId, setPresetId] = useState<DateSessionPresetId>("mid-read");
  const model = useMemo(() => buildDateSessionLabModel(presetId), [presetId]);
  const session = model.session;
  const booking = model.booking;

  return (
    <WorkshopShell
      title="Date session lab"
      description="Jump to booking, drafting, Cupid reads, scene drops, cut-short gates, and wrap states."
    >
      <PresetRail options={DATE_SESSION_PRESETS} value={presetId} onChange={setPresetId} />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr_0.9fr]">
        <LabPanel label="state path" title="Loop checkpoints">
          <TimelineList
            items={[
              { label: "Commit pair", done: booking !== undefined, active: presetId === "booking" },
              {
                label: "Start date",
                done: session !== undefined,
                active: session?.playbackState === "drafting",
              },
              {
                label: "Draft scenes",
                done: (session?.eventDraft.picked ?? null) !== null,
                active: presetId === "picked",
              },
              {
                label: "Cupid reads exchange",
                done: (session?.judgeSnapshots.length ?? 0) > 0,
                active: presetId === "mid-read",
              },
              {
                label: "Cut-short allowed",
                done: session === undefined ? false : canCutDateShort(session),
                active: presetId === "cut-short",
              },
              {
                label: "Final report",
                done: session?.finalReport !== undefined,
                active: presetId === "completed",
              },
            ]}
          />
        </LabPanel>

        <LabPanel label="session console" title={model.scenario?.title ?? "Booking hand"}>
          <div className="space-y-5">
            <PairPlate members={model.members} scenario={model.scenario} eyebrow="pair file" />
            {session === undefined ? (
              <ScenarioCardRow cardIds={booking?.drawnScenarioIds ?? []} />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatBar label="date health" value={session.dateHealth} />
                  <StateReceipt title="turn" tone="ink">
                    <span className="font-mono text-lg tabular-nums">
                      {session.currentTurn} / {session.turnLimit}
                    </span>
                  </StateReceipt>
                  <StateReceipt
                    title="reads"
                    tone={session.judgeSnapshots.length > 0 ? "good" : "neutral"}
                  >
                    <span className="font-mono text-lg tabular-nums">
                      {session.judgeSnapshots.length}
                    </span>
                  </StateReceipt>
                </div>
                <TranscriptTail messages={model.transcriptTail} members={model.members} />
              </>
            )}
          </div>
        </LabPanel>

        <LabPanel label="decision surface" title="Unlocked actions">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {model.controls.map((control) => (
                <MetricPill
                  key={control.label}
                  label={control.label}
                  value={control.enabled ? "on" : "off"}
                  tone={control.enabled ? "good" : "neutral"}
                />
              ))}
            </div>
            <DetailList
              items={[
                {
                  label: "playback",
                  value: session?.playbackState ?? booking?.status ?? "unbooked",
                },
                { label: "events picked", value: `${session?.eventDraft.picked?.length ?? 0}` },
                { label: "events dropped", value: `${session?.eventsTriggered.length ?? 0}` },
                { label: "final outcome", value: session?.finalReport?.outcome ?? "not filed" },
              ]}
            />
            {model.pairState === undefined ? null : (
              <div className="grid gap-3">
                <StatBar label="chemistry" value={model.pairState.stats.chemistry} />
                <StatBar label="trust" value={model.pairState.stats.trust} />
                <StatBar label="strain" value={model.pairState.stats.strain} />
              </div>
            )}
          </div>
        </LabPanel>
      </div>
    </WorkshopShell>
  );
}

function TranscriptTail({
  messages,
  members,
}: {
  messages: readonly DateMessage[];
  members: readonly Member[];
}) {
  if (messages.length === 0) {
    return <EmptyState>No transcript lines are visible yet.</EmptyState>;
  }
  return (
    <ol className="space-y-3">
      {messages.map((message) => {
        const speaker =
          message.kind === "character"
            ? members.find((member) => member.id === message.speakerId)?.firstName
            : message.kind;
        return (
          <li
            key={message.id}
            className="rounded-card bg-white/55 px-4 py-3 ring-1 ring-aura-hairline"
          >
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
              {speaker}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-aura-ink">{message.text}</p>
          </li>
        );
      })}
    </ol>
  );
}

function buildDateSessionLabModel(presetId: DateSessionPresetId): DateSessionLabModel {
  if (presetId === "booking") {
    const base = createFocusedWorkshopSave();
    const committed = commitDateBooking(base, {
      focusMemberId: base.focusedMemberIds[0],
      partnerMemberId: firstAvailablePartnerId(base),
      matchmakingIntent: "comfort",
      now: workshopDate(),
    });
    const booking = requireActiveBooking(committed.save);
    const members = booking.participantIds.map((id) => memberFromSave(committed.save, id));
    return {
      save: committed.save,
      booking,
      session: undefined,
      scenario: undefined,
      members,
      pairState: requirePairState(committed.save, booking.pairId),
      transcriptTail: [],
      controls: [
        { label: "draw", enabled: true },
        { label: "advance", enabled: false },
        { label: "follow-up", enabled: false },
      ],
    };
  }

  let { save, session } = startWorkshopDate();
  let booking = requireActiveBooking(save);
  if (presetId === "draft") return dateModelFrom(save, booking, session);

  ({ save, session } = pickEventsIfNeeded(save, session));
  booking = requireActiveBooking(save);
  if (presetId === "picked") return dateModelFrom(save, booking, session);

  if (presetId === "scene-dropped") {
    const eventId = session.eventDraft.picked?.[0];
    if (eventId !== undefined) {
      ({ save, session } = triggerScenarioEvent(save, {
        dateSessionId: session.id,
        eventId,
        now: workshopDate(),
      }));
    }
    return dateModelFrom(save, booking, session);
  }

  ({ save, session } = advanceToJudgeCount(save, session, presetId === "cut-short" ? 2 : 1));
  if (presetId === "completed") {
    ({ save, session } = completeDateSession(save, session.id, workshopDate()));
  }
  return dateModelFrom(save, booking, session);
}

function dateModelFrom(
  save: GameSave,
  booking: ActiveDateBooking,
  session: DateSession,
): DateSessionLabModel {
  const members = session.participants.map((id) => memberFromSave(save, id));
  const picked = session.eventDraft.picked ?? [];
  const nextEventId = picked.find((eventId) => !session.eventsTriggered.includes(eventId));
  return {
    save,
    booking,
    session,
    scenario: scenarioById(session.scenarioId),
    members,
    pairState: requirePairState(save, session.pairId),
    transcriptTail: session.transcript.slice(-5),
    controls: [
      {
        label: "advance",
        enabled: session.status === "active" && session.playbackState === "paused",
      },
      { label: "drop scene", enabled: session.status === "active" && nextEventId !== undefined },
      { label: "cut short", enabled: canCutDateShort(session) },
      { label: "follow-up", enabled: session.finalReport !== undefined },
    ],
  };
}
