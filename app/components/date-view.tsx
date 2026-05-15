import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import {
  type DateScenario,
  type DateSession,
  type FollowUpAction,
  type GameSave,
  type Member,
  type PairState,
  type PlayerKnowledgeRecord,
  type PortraitMood,
} from "../domain/game";
import { useTutorialStep } from "../services/tutorial";
import { EASE_OUT_QUART, LiveDot, pad2 } from "./dashboard-atoms";
import { ChatStream } from "./date-view-chat-stream";
import { DraftScreen } from "./date-view-draft-screen";
import { FinalReportFooter } from "./date-view-final-report";
import { DateFooter } from "./date-view-footer";
import { selectPortraitMood } from "./date-presentation-signals";
import { DaterStandee, type ReactionSignal } from "./date-reactions";
import {
  resolveDatePlaybackUiState,
  type PendingDateAction,
  type PlaybackIntent,
} from "./date-view-shared";
import {
  buildTranscriptItems,
  buildNudgeSuggestions,
  buildReactionSignals,
  type StreamingDraftMessage,
} from "./date-view-transcript";
import { PairMemoryInspector } from "./pair-memory-inspector";
import { ScenarioBackdropLayer } from "./scenario-backdrop";
import { TutorialCoachMark, TutorialSpotlight } from "./tutorial";

export type { PendingDateAction, PlaybackIntent } from "./date-view-shared";
export { resolveDatePlaybackUiState } from "./date-view-shared";
export { buildTranscriptItems, type StreamingDraftMessage } from "./date-view-transcript";

const STATUS_TONE_TEXT = {
  rose: "text-aura-rose",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
} as const;

type StatusTone = keyof typeof STATUS_TONE_TEXT;

function resolveDateHeaderStatus(session: DateSession): { label: string; tone: StatusTone } {
  if (session.status === "ended_early") {
    return { label: "ended early", tone: "amber" };
  }
  if (session.status === "completed") {
    return { label: "wrapped", tone: "emerald" };
  }
  if (session.playbackState === "drafting") {
    return { label: "drafting", tone: "amber" };
  }
  if (session.playbackState === "playing") {
    return { label: "live", tone: "rose" };
  }
  return { label: "paused", tone: "amber" };
}

type DateProps = {
  session: DateSession;
  scenario: DateScenario | undefined;
  members: Member[];
  pairState: PairState | undefined;
  playerKnowledge: PlayerKnowledgeRecord[];
  save: GameSave;
  onTutorialUpdate: (next: GameSave) => void;
  interventionText: string;
  interventionTargetMemberId: string;
  canAdvance: boolean;
  canIntervene: boolean;
  isActionPending: boolean;
  pendingDateAction: PendingDateAction | null;
  isJudgePending: boolean;
  queuedPlaybackIntent: PlaybackIntent | null;
  streamingDrafts: StreamingDraftMessage[];
  onInterventionTextChange: (text: string) => void;
  onInterventionTargetChange: (memberId: string) => void;
  onAdvance: (turnCount: 1 | 2) => void;
  onCancel: () => void;
  onIntervene: () => void;
  onFollowUp: (action: FollowUpAction) => void;
  onPickEvents: (eventIds: string[]) => void;
  onTriggerEvent: (eventId: string) => void;
  onTogglePlayback: (next: PlaybackIntent) => void;
  onBack: () => void;
};

export function DateView({
  session,
  scenario,
  members,
  pairState,
  playerKnowledge,
  save,
  onTutorialUpdate,
  interventionText,
  interventionTargetMemberId,
  canAdvance,
  canIntervene,
  isActionPending,
  pendingDateAction,
  isJudgePending,
  queuedPlaybackIntent,
  streamingDrafts,
  onInterventionTextChange,
  onInterventionTargetChange,
  onAdvance,
  onCancel,
  onIntervene,
  onFollowUp,
  onPickEvents,
  onTriggerEvent,
  onTogglePlayback,
  onBack,
}: DateProps) {
  const transcript = useMemo(
    () => buildTranscriptItems(session, members, scenario, streamingDrafts, playerKnowledge),
    [session, members, scenario, streamingDrafts, playerKnowledge],
  );
  const displayedCurrentTurn = useMemo(
    () => Math.max(session.currentTurn, ...streamingDrafts.map((draft) => draft.turnIndex)),
    [session.currentTurn, streamingDrafts],
  );
  const participants = useMemo(
    () =>
      session.participants
        .map((id) => members.find((m) => m.id === id))
        .filter((m): m is Member => m !== undefined),
    [session.participants, members],
  );
  const [leftMember, rightMember] = participants;
  const reactionSignals = useMemo(
    () =>
      leftMember === undefined || rightMember === undefined
        ? []
        : buildReactionSignals(session.judgeSnapshots, leftMember.id, rightMember.id),
    [session.judgeSnapshots, leftMember, rightMember],
  );
  const nudgeSuggestions = useMemo(
    () => buildNudgeSuggestions(session.judgeSnapshots),
    [session.judgeSnapshots],
  );
  const latestJudge = session.judgeSnapshots.at(-1);
  const leftMood =
    leftMember === undefined ? "neutral" : selectPortraitMood(leftMember.id, latestJudge);
  const rightMood =
    rightMember === undefined ? "neutral" : selectPortraitMood(rightMember.id, latestJudge);
  const playbackUiState = resolveDatePlaybackUiState({
    playbackState: session.playbackState,
    pendingDateAction,
    queuedPlaybackIntent,
  });
  const draftEventsAutoStep = useTutorialStep(save, "date.draft-events", false, onTutorialUpdate);
  useEffect(() => {
    if (session.playbackState !== "drafting" && !draftEventsAutoStep.done) {
      draftEventsAutoStep.complete();
    }
  }, [session.playbackState, draftEventsAutoStep]);

  const judgeNoteGate = session.judgeSnapshots.length > 0;
  const judgeNoteStep = useTutorialStep(save, "date.judge-note", judgeNoteGate, onTutorialUpdate);
  const [judgeNoteAnchor, setJudgeNoteAnchor] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!judgeNoteStep.active) {
      setJudgeNoteAnchor((prev) => (prev === null ? prev : null));
      return;
    }
    const found = document.querySelector<HTMLElement>("[data-judge-note-anchor]");
    setJudgeNoteAnchor((prev) => (prev === found ? prev : found));
  }, [judgeNoteStep.active, session.judgeSnapshots.length]);

  return (
    <>
      <ScenarioBackdropLayer scenarioId={scenario?.id} microMotion="drift-pointer" />
      {leftMember !== undefined && rightMember !== undefined ? (
        <DateStandeeFrame
          leftMember={leftMember}
          rightMember={rightMember}
          leftMood={leftMood}
          rightMood={rightMood}
          reactions={reactionSignals}
        />
      ) : null}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
        className="relative w-full"
      >
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_50rem_46rem_at_50%_44%,rgba(255,253,249,0.72)_0%,rgba(255,253,249,0.48)_30%,rgba(255,253,249,0.22)_60%,rgba(255,253,249,0)_88%)]"
        />
        <DateHeader
          scenario={scenario}
          session={session}
          participants={participants}
          onBack={onBack}
        />

        <div
          className={`relative z-10 mx-auto w-full px-6 pt-6 pb-40 lg:px-10 lg:pb-44 ${
            session.playbackState === "drafting" ? "max-w-2xl 2xl:max-w-6xl" : "max-w-3xl"
          }`}
        >
          {session.playbackState === "drafting" && scenario !== undefined ? (
            <DraftScreen
              scenario={scenario}
              session={session}
              isActionPending={isActionPending}
              save={save}
              onTutorialUpdate={onTutorialUpdate}
              onPickEvents={onPickEvents}
            />
          ) : (
            <ChatStream
              items={transcript}
              session={session}
              leftMemberId={leftMember?.id}
              pendingDateAction={pendingDateAction}
              isJudgePending={isJudgePending}
              playbackUiState={playbackUiState}
            />
          )}
        </div>

        {session.status === "active" && session.playbackState !== "drafting" ? (
          <DateFooter
            session={session}
            scenario={scenario}
            interventionText={interventionText}
            interventionTargetMemberId={interventionTargetMemberId}
            participants={participants}
            displayedCurrentTurn={displayedCurrentTurn}
            canAdvance={canAdvance}
            canIntervene={canIntervene}
            pendingDateAction={pendingDateAction}
            playbackUiState={playbackUiState}
            nudgeSuggestions={nudgeSuggestions}
            save={save}
            onTutorialUpdate={onTutorialUpdate}
            onInterventionTextChange={onInterventionTextChange}
            onInterventionTargetChange={onInterventionTargetChange}
            onAdvance={onAdvance}
            onCancel={onCancel}
            onIntervene={onIntervene}
            onTriggerEvent={onTriggerEvent}
            onTogglePlayback={onTogglePlayback}
          />
        ) : null}

        {session.finalReport === undefined ? null : (
          <FinalReportFooter
            report={session.finalReport}
            session={session}
            playerKnowledge={playerKnowledge}
            isActionPending={isActionPending}
            save={save}
            onTutorialUpdate={onTutorialUpdate}
            onFollowUp={onFollowUp}
          />
        )}

        <PairMemoryInspector
          pairState={pairState}
          members={members}
          save={save}
          onTutorialUpdate={onTutorialUpdate}
        />
      </motion.div>

      {judgeNoteStep.active && judgeNoteAnchor !== null ? (
        <>
          <TutorialSpotlight target={judgeNoteAnchor} />
          <TutorialCoachMark
            target={judgeNoteAnchor}
            placement="top"
            title="Six turns, one snapshot"
            body="The Judge reads every sixth turn and at the wrap. Health changes here, not in the booking room. Evidence first. Paperwork second."
            primaryLabel="Got it"
            onPrimary={judgeNoteStep.complete}
            dismissLabel="Skip tour"
            onDismiss={judgeNoteStep.dismiss}
          />
        </>
      ) : null}
    </>
  );
}

function DateHeader({
  scenario,
  session,
  participants,
  onBack,
}: {
  scenario: DateScenario | undefined;
  session: DateSession;
  participants: Member[];
  onBack: () => void;
}) {
  const { label: statusLabel, tone: statusTone } = resolveDateHeaderStatus(session);
  const isDrafting = session.playbackState === "drafting";
  const canLeaveStage = session.status !== "active";
  const positionClass = isDrafting
    ? "relative mb-6 flex justify-center px-6 lg:px-10"
    : "sticky top-3 mb-2 flex justify-center px-6 lg:top-4 lg:mb-3 lg:px-10";
  const memberLine = participants.map((m) => m.firstName).join(" / ");
  const locationLine = scenario?.publicBrief.location;
  const detailLine = locationLine === undefined ? memberLine : `${memberLine} / ${locationLine}`;

  return (
    <header data-date-header className={`${positionClass} z-20`}>
      <div className="group aura-glass pointer-events-auto flex max-w-full items-center gap-2.5 rounded-pill px-2 py-1.5 transition-[gap,padding] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:gap-3 hover:px-3 lg:gap-3 lg:py-2 lg:hover:gap-4 lg:hover:px-4">
        {canLeaveStage ? (
          <>
            <button
              type="button"
              data-sfx="click"
              onClick={onBack}
              aria-label="Back to Live Date"
              title="Back to Live Date"
              className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                <path
                  d="M9.5 3 L4.5 8 L9.5 13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span aria-hidden className="h-3 w-px shrink-0 bg-aura-hairline" />
          </>
        ) : null}
        <span className="shrink-0 font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          // {pad2(session.currentTurn)}
        </span>
        <h1 className="min-w-0 shrink truncate font-display text-base font-semibold tracking-tight text-aura-ink lg:text-lead">
          {scenario?.title ?? "Date in session"}
        </h1>
        <div className="hidden grid-cols-[0fr] transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:grid-cols-[1fr] lg:grid">
          <div className="flex min-w-0 items-center gap-3 overflow-hidden lg:gap-4">
            <span aria-hidden className="ml-1 h-3 w-px shrink-0 bg-aura-hairline" />
            <p className="whitespace-nowrap font-mono text-micro font-semibold uppercase tracking-[0.24em] text-black">
              {detailLine}
            </p>
          </div>
        </div>
        <span aria-hidden className="h-3 w-px shrink-0 bg-aura-hairline" />
        <span className="inline-flex shrink-0 items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.24em]">
          <LiveDot tone={statusTone} />
          <span className={STATUS_TONE_TEXT[statusTone]}>{statusLabel}</span>
        </span>
      </div>
    </header>
  );
}

function DateStandeeFrame({
  leftMember,
  rightMember,
  leftMood,
  rightMood,
  reactions,
}: {
  leftMember: Member;
  rightMember: Member;
  leftMood: PortraitMood;
  rightMood: PortraitMood;
  reactions: ReactionSignal[];
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden xl:block"
    >
      <DaterStandee
        member={leftMember}
        placement="bottom-left"
        mood={leftMood}
        reactions={reactions.filter((reaction) => reaction.side === "left")}
        className="absolute bottom-0 left-0 h-[92vh] w-72 2xl:w-96"
      />
      <DaterStandee
        member={rightMember}
        placement="bottom-right"
        mood={rightMood}
        reactions={reactions.filter((reaction) => reaction.side === "right")}
        className="absolute bottom-0 right-0 h-[92vh] w-72 2xl:w-96"
      />
    </div>
  );
}
