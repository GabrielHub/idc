import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type DateFinalReport,
  type DateMessage,
  type DateScenario,
  type DateSession,
  type FollowUpAction,
  type JudgeSnapshot,
  type Member,
  type MemoryRecord,
  type PairState,
  type PlayerKnowledgeRecord,
  type PortraitMood,
  type ScenarioEvent,
  type ScenarioEventKind,
  type ShiftReport,
  type ShiftState,
} from "../domain/game";
import {
  canAddCupidIntervention,
  EVENT_DRAFT_PICKED,
  exchangeIndexForTurn,
  findScenarioEventById,
  formatCupidInterventionText,
  MAX_NUDGES_PER_DATE,
} from "../services/date-engine";
import { collectRecentSpeakerLines, hasNearDuplicateRecentLine } from "../services/date-prompts";
import { PAIR_CLOSURE_TAG } from "../services/closures";
import { clampScore } from "../services/utils";
import {
  EASE_OUT_QUART,
  Eyebrow,
  GhostButton,
  LiveDot,
  pad2,
  Portrait,
  PrimaryButton,
  scoreWidthClass,
  SelectInput,
  Tooltip,
} from "./dashboard-atoms";
import {
  DaterStandee,
  type ReactionIntensity,
  type ReactionKind,
  type ReactionSignal,
} from "./date-reactions";
import { selectPortraitMood } from "./date-presentation-signals";
import {
  HOUSE_BUBBLE_LEFT_CLASS,
  HOUSE_BUBBLE_NAME_CLASS,
  resolveMemberChatBubbleStyle,
} from "./member-chat-bubble-style";
import { PairBoard } from "./pair-board";
import { PairMemoryInspector } from "./pair-memory-inspector";
import { ScenarioBackdropLayer } from "./scenario-backdrop";
import type { SfxCue } from "./sfx-provider";

const FOLLOW_UP_LABELS: Record<FollowUpAction, string> = {
  encourage: "Encourage",
  cool_down: "Cool Down",
  repair: "Repair",
  mark_bad_fit: "Mark Bad Fit",
};

const FOLLOW_UP_PROJECTIONS: Record<FollowUpAction, string> = {
  encourage: "Tell Cupid to pursue the opening while the file is warm.",
  cool_down: "Give the pair room before the next booking.",
  repair: "Send a careful follow-up before rebooking pressure returns.",
  mark_bad_fit: "Close the romantic lane and keep the operational note.",
};

export type PendingDateAction = "advanceExchange";
export type PlaybackIntent = "playing" | "paused";

type DatePlaybackUiState = {
  isPlaying: boolean;
  isPaused: boolean;
  isStreaming: boolean;
  pauseRequested: boolean;
  playbackBusy: boolean;
};

export function resolveDatePlaybackUiState({
  playbackState,
  pendingDateAction,
  queuedPlaybackIntent,
}: {
  playbackState: DateSession["playbackState"];
  pendingDateAction: PendingDateAction | null;
  queuedPlaybackIntent: PlaybackIntent | null;
}): DatePlaybackUiState {
  const isStreaming = pendingDateAction !== null;
  const pauseRequested = playbackState === "playing" && queuedPlaybackIntent === "paused";
  const playRequested = playbackState === "paused" && queuedPlaybackIntent === "playing";
  const isPlaying = (playbackState === "playing" || playRequested) && !pauseRequested;
  const isPaused = (playbackState === "paused" || pauseRequested) && !playRequested;
  const playbackBusy = isStreaming && (playbackState === "paused" || queuedPlaybackIntent !== null);

  return {
    isPlaying,
    isPaused,
    isStreaming,
    pauseRequested,
    playbackBusy,
  };
}

function SectionHeader({
  eyebrow,
  title,
  meta,
  tooltip,
}: {
  eyebrow: string;
  title: string;
  meta: string;
  tooltip: React.ReactNode;
}) {
  return (
    <header className="border-b border-aura-hairline pb-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="group relative">
          <h2
            tabIndex={0}
            className="cursor-help font-display text-display-lg font-semibold leading-[0.92] tracking-tight text-aura-ink outline-none focus-visible:text-aura-rose"
          >
            {title}
          </h2>
          <div
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-max max-w-md translate-y-1 rounded-card border border-aura-hairline bg-white/95 px-4 py-2.5 opacity-0 shadow-card backdrop-blur-sm transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            <p className="aura-accent text-lead leading-snug text-aura-muted">
              &ldquo;{tooltip}&rdquo;
            </p>
          </div>
        </div>
        <p className="flex items-baseline gap-2 font-mono text-micro font-semibold uppercase tracking-[0.28em]">
          <span className="text-aura-rose">{eyebrow}</span>
          <span aria-hidden className="text-aura-faint/60">
            ·
          </span>
          <span className="text-aura-faint">{meta}</span>
        </p>
      </div>
    </header>
  );
}

function ModalCloseButton({
  onClose,
  label,
  sfx,
}: {
  onClose: () => void;
  label: string;
  sfx?: SfxCue;
}) {
  return (
    <button
      type="button"
      data-sfx={sfx}
      onClick={onClose}
      aria-label={label}
      className="absolute right-4 top-4 z-10 grid size-8 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
        <path
          d="M3 3L13 13M13 3L3 13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

/* ================================================================== */
/* Date                                                               */
/* ================================================================== */

export type DateProps = {
  session: DateSession;
  scenario: DateScenario | undefined;
  members: Member[];
  pairState: PairState | undefined;
  playerKnowledge: PlayerKnowledgeRecord[];
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

export type StreamingDraftMessage = {
  id: string;
  speakerId: string;
  speakerName: string;
  sequenceIndex: number;
  turnIndex: number;
  text: string;
  status: "streaming" | "done";
};

export function DateView({
  session,
  scenario,
  members,
  pairState,
  playerKnowledge,
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
  const displayedCurrentTurn = useMemo(() => {
    let highest = session.currentTurn;
    for (const draft of streamingDrafts) {
      if (draft.turnIndex > highest) {
        highest = draft.turnIndex;
      }
    }
    return highest;
  }, [session.currentTurn, streamingDrafts]);
  const participants = useMemo(
    () =>
      session.participants
        .map((id) => members.find((m) => m.id === id))
        .filter((m): m is Member => Boolean(m)),
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
            onFollowUp={onFollowUp}
          />
        )}

        <PairMemoryInspector pairState={pairState} members={members} />
      </motion.div>
    </>
  );
}

const STATUS_TONE_TEXT = {
  rose: "text-aura-rose",
  amber: "text-amber-600",
  emerald: "text-emerald-600",
} as const;

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
  const statusLabel =
    session.status === "ended_early"
      ? "ended early"
      : session.status === "completed"
        ? "wrapped"
        : session.playbackState === "drafting"
          ? "drafting"
          : session.playbackState === "playing"
            ? "live"
            : "paused";
  const statusTone: keyof typeof STATUS_TONE_TEXT =
    session.status === "ended_early"
      ? "amber"
      : session.status === "completed"
        ? "emerald"
        : session.playbackState === "playing"
          ? "rose"
          : "amber";
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

type TranscriptItem = {
  id: string;
  order: number;
  label: string;
  text: string;
  tone: "member" | "scenario" | "cupid" | "system" | "judge";
  reveals?: PlayerKnowledgeRecord[];
  member?: Member;
  targetName?: string;
  isDraft?: boolean;
  isStreaming?: boolean;
};

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

type ChatStreamAnimation = {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; ease: typeof EASE_OUT_QUART; delay: number };
};

function ChatStream({
  items,
  session,
  leftMemberId,
  pendingDateAction,
  isJudgePending,
  playbackUiState,
}: {
  items: TranscriptItem[];
  session: DateSession;
  leftMemberId: string | undefined;
  pendingDateAction: PendingDateAction | null;
  isJudgePending: boolean;
  playbackUiState: DatePlaybackUiState;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const tailRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const previousItemCountRef = useRef(items.length);
  const latestText = items.at(-1)?.text ?? "";

  useEffect(() => {
    const itemCountIncreased = items.length > previousItemCountRef.current;
    previousItemCountRef.current = items.length;
    const behavior: ScrollBehavior = itemCountIncreased ? "smooth" : "auto";
    const resolveStickyEl = (current: HTMLElement | null, selector: string): HTMLElement | null => {
      if (current !== null && document.contains(current)) {
        return current;
      }
      return document.querySelector<HTMLElement>(selector);
    };
    const scroll = () => {
      headerRef.current = resolveStickyEl(headerRef.current, "[data-date-header]");
      footerRef.current = resolveStickyEl(footerRef.current, "[data-date-footer]");
      scrollLatestTranscriptItemIntoClearance(
        listRef.current,
        tailRef.current,
        headerRef.current,
        footerRef.current,
        behavior,
      );
    };
    const animationFrame = window.requestAnimationFrame(scroll);
    const retryTimeout = itemCountIncreased === true ? window.setTimeout(scroll, 180) : undefined;

    return () => {
      window.cancelAnimationFrame(animationFrame);

      if (retryTimeout !== undefined) {
        window.clearTimeout(retryTimeout);
      }
    };
  }, [items.length, latestText]);

  const statusCue =
    session.status === "active" ? (
      <DateStatusCue
        pendingDateAction={pendingDateAction}
        isJudgePending={isJudgePending}
        pauseRequested={playbackUiState.pauseRequested}
      />
    ) : null;

  if (items.length === 0) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          // awaiting first exchange
        </p>
        <p className="max-w-sm text-label text-aura-muted">
          Cupid does not record silence. Advance the exchange to begin the transcript.
        </p>
        {statusCue === null ? null : <div className="mt-3">{statusCue}</div>}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ol ref={listRef} className="space-y-4">
        {items.map((item, index) => {
          const previous = items[index - 1];
          return (
            <ChatStreamItem
              key={item.id}
              item={item}
              previous={previous}
              index={index}
              leftMemberId={leftMemberId}
            />
          );
        })}
      </ol>

      {statusCue === null ? null : (
        <div ref={tailRef} className="mt-5 flex justify-start">
          {statusCue}
        </div>
      )}
    </div>
  );
}

function scrollLatestTranscriptItemIntoClearance(
  listElement: HTMLOListElement | null,
  tailElement: HTMLDivElement | null,
  headerElement: HTMLElement | null,
  footerElement: HTMLElement | null,
  behavior: ScrollBehavior,
): void {
  const latestItem = listElement?.lastElementChild;

  if (!(latestItem instanceof HTMLElement)) {
    return;
  }

  const headerBottom = headerElement?.getBoundingClientRect().bottom ?? 0;
  const footerTop = footerElement?.getBoundingClientRect().top ?? window.innerHeight;
  const topLimit = headerBottom + 16;
  const bottomLimit = footerTop - 20;

  if (bottomLimit <= topLimit) {
    latestItem.scrollIntoView({ behavior, block: "nearest" });
    return;
  }

  const itemRect = latestItem.getBoundingClientRect();
  const tailRect = tailElement?.getBoundingClientRect() ?? itemRect;
  const neededDownScroll = Math.max(0, tailRect.bottom - bottomLimit);
  const allowedDownScroll = Math.max(0, itemRect.top - topLimit);
  const downScroll = Math.min(neededDownScroll, allowedDownScroll);

  if (downScroll > 0) {
    window.scrollBy({ top: downScroll, behavior });
    return;
  }

  if (itemRect.top < topLimit) {
    window.scrollBy({ top: itemRect.top - topLimit, behavior });
  }
}

function ChatStreamItem({
  item,
  previous,
  index,
  leftMemberId,
}: {
  item: TranscriptItem;
  previous: TranscriptItem | undefined;
  index: number;
  leftMemberId: string | undefined;
}) {
  const animation: ChatStreamAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE_OUT_QUART, delay: Math.min(index * 0.04, 0.5) },
  };

  if (item.tone === "member" && item.member !== undefined) {
    const isLeft = item.member.id === leftMemberId;
    const previousIsSameSpeaker =
      previous?.tone === "member" && previous.member?.id === item.member.id;
    return (
      <ChatBubble
        item={item}
        member={item.member}
        side={isLeft ? "left" : "right"}
        showName={!previousIsSameSpeaker}
        tight={previousIsSameSpeaker}
        animation={animation}
      />
    );
  }

  if (item.tone === "scenario") {
    return <NarratorBeat item={item} animation={animation} />;
  }

  if (item.tone === "cupid") {
    return <CupidPin item={item} animation={animation} />;
  }

  if (item.tone === "judge") {
    return <JudgeNote item={item} animation={animation} />;
  }

  return <SystemNote item={item} animation={animation} />;
}

function ChatBubble({
  item,
  member,
  side,
  showName,
  tight,
  animation,
}: {
  item: TranscriptItem;
  member: Member;
  side: "left" | "right";
  showName: boolean;
  tight: boolean;
  animation: ChatStreamAnimation;
}) {
  const isLeft = side === "left";
  const justify = isLeft ? "justify-start" : "justify-end";
  const tightClass = tight ? "!mt-1" : "";
  const itemsAlign = isLeft ? "items-start" : "items-end";
  const customBubble =
    isLeft && member.chatBubble ? resolveMemberChatBubbleStyle(member.chatBubble) : null;
  const nameAlign = customBubble
    ? "text-left text-[color:var(--member-bubble-accent)] opacity-80"
    : isLeft
      ? `text-left ${HOUSE_BUBBLE_NAME_CLASS}`
      : "text-right text-aura-faint";
  const accentStyle = customBubble?.accentStyle;
  const defaultRightClass =
    "rounded-[22px] rounded-br-md bg-white/85 px-4 py-2.5 shadow-quiet ring-1 ring-aura-hairline backdrop-blur-md";
  const bubbleClass = customBubble
    ? customBubble.className
    : isLeft
      ? HOUSE_BUBBLE_LEFT_CLASS
      : defaultRightClass;
  const bubbleStyle = customBubble?.style;
  const textColorClass = customBubble ? "" : isLeft ? "text-white" : "text-aura-ink";
  const caretColor = customBubble
    ? customBubble.caretClass
    : isLeft
      ? "bg-white/85"
      : "bg-aura-rose/70";
  const isStreamingText = item.isStreaming === true;
  const draftClass = item.isDraft === true ? "opacity-95" : "";

  return (
    <motion.li {...animation} className={`flex ${justify} ${tightClass}`}>
      <div className={`flex max-w-[78%] flex-col gap-2 ${itemsAlign}`} style={accentStyle}>
        {showName ? (
          <span
            className={`relative z-20 px-3 font-mono text-micro font-semibold uppercase tracking-[0.24em] ${nameAlign}`}
          >
            {member.firstName}
          </span>
        ) : null}
        <div className={`${bubbleClass} ${draftClass}`} style={bubbleStyle}>
          <p className={`text-body leading-relaxed ${textColorClass}`}>
            {item.text}
            {isStreamingText ? (
              <span
                aria-hidden
                className={`ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full ${caretColor}`}
              />
            ) : null}
          </p>
        </div>
      </div>
    </motion.li>
  );
}

function NarratorBeat({
  item,
  animation,
}: {
  item: TranscriptItem;
  animation: ChatStreamAnimation;
}) {
  return (
    <motion.li {...animation} className="!my-7">
      <div className="flex flex-col items-center gap-2 px-2 text-center">
        <div className="flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-aura-violet/40 to-transparent" />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-violet">
            {item.label}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-aura-violet/40 via-transparent to-transparent" />
        </div>
        <p className="aura-accent max-w-md text-lead leading-snug text-aura-muted">
          &ldquo;{item.text}&rdquo;
        </p>
      </div>
    </motion.li>
  );
}

function CupidPin({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="!my-6 flex justify-center">
      <div className="aura-glass-rose relative max-w-md rounded-card px-5 pt-5 pb-3.5 text-center">
        <span
          aria-hidden
          className="absolute -top-1.5 left-1/2 grid size-3.5 -translate-x-1/2 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-rose shadow-[0_3px_8px_rgba(244,63,94,0.45)] ring-2 ring-white/85"
        >
          <span className="size-1 rounded-full bg-white/90" />
        </span>
        <div className="flex items-center justify-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          <span>// {item.label}</span>
          {item.targetName === undefined ? null : (
            <span className="rounded-full bg-aura-rose/15 px-2 py-0.5 tracking-[0.24em] text-aura-rose">
              → {item.targetName}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-label leading-snug text-aura-ink/85">{item.text}</p>
      </div>
    </motion.li>
  );
}

function JudgeNote({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  const reveals = item.reveals ?? [];
  const hasReveals = reveals.length > 0;

  return (
    <motion.li {...animation} className="!my-5 flex justify-center">
      <div className="aura-glass relative w-full rounded-card px-5 pt-3.5 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-5 shrink-0 place-items-center rounded-full bg-aura-ink/[0.08] font-serif text-sm font-semibold italic leading-none text-aura-ink/60"
          >
            §
          </span>
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.3em] text-aura-ink/70">
            // {item.label}
          </span>
          <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
        </div>

        <p className="mt-2.5 text-label leading-relaxed text-aura-ink/85">{item.text}</p>

        {hasReveals ? (
          <ul className="mt-3 space-y-2 border-t border-aura-hairline pt-2.5">
            {reveals.map((read) => (
              <li key={read.id}>
                <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                  {readKindLabel(read)}
                </p>
                <p className="mt-0.5 text-label leading-snug text-aura-ink/80">{read.readText}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </motion.li>
  );
}

function SystemNote({ item, animation }: { item: TranscriptItem; animation: ChatStreamAnimation }) {
  return (
    <motion.li {...animation} className="flex justify-center">
      <p className="max-w-md text-center font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        {item.text}
      </p>
    </motion.li>
  );
}

function readKindLabel(read: PlayerKnowledgeRecord): string {
  if (read.readKind === "pair_dynamic") {
    return read.confidence === "confirmed" ? "confirmed pair read" : "filed pair read";
  }

  if (read.readKind === "scenario_pressure") {
    return read.confidence === "confirmed" ? "confirmed room read" : "filed room read";
  }

  return read.confidence === "confirmed" ? `confirmed ${read.readKind}` : `filed ${read.readKind}`;
}

function DateStatusCue({
  pendingDateAction,
  isJudgePending,
  pauseRequested,
}: {
  pendingDateAction: PendingDateAction | null;
  isJudgePending: boolean;
  pauseRequested: boolean;
}) {
  if (pauseRequested) {
    return (
      <CupidStatusPill
        label="Pause filed"
        leading={<span aria-hidden className="size-1.5 rounded-full bg-aura-amber" />}
      />
    );
  }

  if (pendingDateAction === null) {
    return (
      <CupidStatusPill
        label="Next exchange ready"
        leading={<span aria-hidden className="size-1.5 rounded-full bg-aura-emerald" />}
      />
    );
  }

  if (!isJudgePending) {
    return null;
  }

  return (
    <CupidStatusPill
      label="Cupid is listening"
      leading={
        <span aria-hidden className="flex items-center gap-1">
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/55 [animation-delay:0ms]" />
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/65 [animation-delay:180ms]" />
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-rose/75 [animation-delay:360ms]" />
        </span>
      }
    />
  );
}

function CupidStatusPill({ label, leading }: { label: string; leading: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-[22px] rounded-bl-md bg-white/70 px-4 py-2.5 shadow-quiet ring-1 ring-aura-hairline backdrop-blur-md">
      {leading}
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
    </div>
  );
}

const FOLLOW_UP_ORDER: readonly FollowUpAction[] = [
  "encourage",
  "cool_down",
  "repair",
  "mark_bad_fit",
];

function FinalReportFooter({
  report,
  session,
  playerKnowledge,
  isActionPending,
  onFollowUp,
}: {
  report: DateFinalReport;
  session: DateSession;
  playerKnowledge: PlayerKnowledgeRecord[];
  isActionPending: boolean;
  onFollowUp: (action: FollowUpAction) => void;
}) {
  const sentimentBadge = describeEndSentiment(session);
  const revealedThisDate = playerKnowledge.filter((record) => record.dateSessionId === session.id);
  const filed = report.appliedFollowUp;

  return (
    <motion.footer
      data-final-report-footer
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
      className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 lg:bottom-6 lg:px-8"
    >
      <div className="relative mx-auto w-full max-w-5xl">
        <div className="aura-glass-strong pointer-events-auto grid w-full gap-4 rounded-card px-4 py-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-5 lg:px-6 lg:py-5">
          <FinalReportSummarySection report={report} sentimentBadge={sentimentBadge} />
          <span aria-hidden className="hidden w-px self-stretch bg-aura-hairline/70 lg:block" />
          <FinalReportReadsSection reads={revealedThisDate} />
          <span aria-hidden className="hidden w-px self-stretch bg-aura-hairline/70 lg:block" />
          <FinalReportFollowUpSection
            recommended={report.recommendedFollowUp}
            filed={filed}
            isActionPending={isActionPending}
            onFollowUp={onFollowUp}
          />
        </div>
      </div>
    </motion.footer>
  );
}

function FinalReportSummarySection({
  report,
  sentimentBadge,
}: {
  report: DateFinalReport;
  sentimentBadge: { label: string; tone: string; dot: string };
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow>// final report</Eyebrow>
        <span
          className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${sentimentBadge.tone}`}
        >
          <span aria-hidden className={`size-1.5 rounded-full ${sentimentBadge.dot}`} />
          {sentimentBadge.label}
        </span>
      </div>
      <p className="text-label leading-snug text-aura-ink">{report.summary}</p>
      <p className="text-label leading-snug text-aura-muted">{report.statSummary}</p>
    </section>
  );
}

function FinalReportReadsSection({ reads }: { reads: readonly PlayerKnowledgeRecord[] }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <Eyebrow>// filed reads</Eyebrow>
      {reads.length === 0 ? (
        <p className="text-label text-aura-muted">No new reads filed from this date.</p>
      ) : (
        <ul className="flex max-h-32 flex-col gap-1.5 overflow-y-auto pr-1">
          {reads.map((read) => (
            <li
              key={read.id}
              className="rounded-chip bg-white/55 px-2.5 py-1.5 ring-1 ring-aura-hairline"
            >
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                {readKindLabel(read)}
              </p>
              <p className="mt-0.5 text-label leading-snug text-aura-ink/85">{read.readText}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FinalReportFollowUpSection({
  recommended,
  filed,
  isActionPending,
  onFollowUp,
}: {
  recommended: FollowUpAction;
  filed: FollowUpAction | undefined;
  isActionPending: boolean;
  onFollowUp: (action: FollowUpAction) => void;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>// follow-up</Eyebrow>
        {filed === undefined ? (
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            Recommended: <span className="text-aura-rose">{FOLLOW_UP_LABELS[recommended]}</span>
          </span>
        ) : (
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Filed: {FOLLOW_UP_LABELS[filed]}
          </span>
        )}
      </div>
      {filed === undefined ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {FOLLOW_UP_ORDER.map((action) => (
            <FollowUpActionButton
              key={action}
              action={action}
              isRecommended={action === recommended}
              disabled={isActionPending}
              onSelect={() => onFollowUp(action)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FollowUpActionButton({
  action,
  isRecommended,
  disabled,
  onSelect,
}: {
  action: FollowUpAction;
  isRecommended: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const label = FOLLOW_UP_LABELS[action];
  const projection = FOLLOW_UP_PROJECTIONS[action];
  const baseClass =
    "relative flex h-full w-full cursor-pointer items-center justify-center gap-1.5 rounded-pill px-2.5 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-40";
  const toneClass = isRecommended
    ? "bg-gradient-to-r from-aura-rose/15 via-aura-fuchsia/12 to-aura-violet/15 text-aura-rose ring-1 ring-aura-rose/45 hover:ring-aura-rose/70 hover:shadow-cta"
    : "aura-glass text-aura-muted hover:text-aura-ink";

  return (
    <Tooltip message={projection} placement="top-center" className="w-full">
      <button
        type="button"
        data-sfx="click"
        disabled={disabled}
        onClick={onSelect}
        aria-label={`${label}. ${projection}`}
        className={`${baseClass} ${toneClass}`}
      >
        {isRecommended ? (
          <svg viewBox="0 0 12 12" className="size-3 text-aura-rose" aria-hidden>
            <path
              d="M6 1.4 L7.4 4.6 L10.8 5 L8.3 7.3 L8.9 10.6 L6 9 L3.1 10.6 L3.7 7.3 L1.2 5 L4.6 4.6 Z"
              fill="currentColor"
            />
          </svg>
        ) : null}
        <span>{label}</span>
      </button>
    </Tooltip>
  );
}

const SCENARIO_EVENT_KIND_CHIP_CLASS: Record<ScenarioEventKind, string> = {
  ambient: "bg-aura-violet/12 text-black ring-1 ring-aura-violet/30",
  provocation: "bg-aura-rose/15 text-black ring-1 ring-aura-rose/35",
  reveal: "bg-aura-emerald/15 text-black ring-1 ring-aura-emerald/35",
};

const SCENARIO_EVENT_KIND_COLUMN_ORDER: readonly ScenarioEventKind[] = [
  "ambient",
  "provocation",
  "reveal",
];

const SCENARIO_EVENT_KIND_COLUMN_META: Record<ScenarioEventKind, { label: string; blurb: string }> =
  {
    ambient: {
      label: "ambient",
      blurb: "Environmental texture. Easy to notice or skip.",
    },
    provocation: {
      label: "provocation",
      blurb: "Physical interruptions. Demand a reaction.",
    },
    reveal: {
      label: "reveal",
      blurb: "Honest beats drawn from what's on file.",
    },
  };

function DraftScreen({
  scenario,
  session,
  isActionPending,
  onPickEvents,
}: {
  scenario: DateScenario;
  session: DateSession;
  isActionPending: boolean;
  onPickEvents: (eventIds: string[]) => void;
}) {
  const offered = session.eventDraft.offered;
  const offeredEvents = useMemo(
    () =>
      offered
        .map((id) => findScenarioEventById(scenario, id))
        .filter((event): event is ScenarioEvent => event !== undefined),
    [offered, scenario],
  );
  const targetCount = Math.min(EVENT_DRAFT_PICKED, offeredEvents.length);
  const [picks, setPicks] = useState<string[]>([]);
  const canLockIn = picks.length === targetCount;

  const offeredEventsByKind = useMemo(() => {
    const groups: Record<ScenarioEventKind, Array<{ event: ScenarioEvent; sceneIndex: number }>> = {
      ambient: [],
      provocation: [],
      reveal: [],
    };
    offeredEvents.forEach((event, sceneIndex) => {
      groups[event.kind].push({ event, sceneIndex });
    });
    return groups;
  }, [offeredEvents]);

  function togglePick(eventId: string) {
    setPicks((current) => {
      if (current.includes(eventId)) {
        return current.filter((id) => id !== eventId);
      }

      if (current.length >= targetCount) {
        return current;
      }

      return [...current, eventId];
    });
  }

  return (
    <motion.section
      key="draft-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      className="mt-10"
    >
      <div className="space-y-3 text-center">
        <Eyebrow>// scene draft</Eyebrow>
        <h2 className="font-display text-display-md font-semibold leading-tight tracking-tight text-black lg:text-display-lg">
          Pick three <span className="aura-accent text-aura-rose">scene cards</span>
        </h2>
        <p className="mx-auto max-w-xl text-label text-black">
          Cupid deals two of each scene kind for {scenario.title}. Pick any three to drop into the
          date.
        </p>
      </div>

      <div className="mt-9 grid gap-6 2xl:grid-cols-3">
        {SCENARIO_EVENT_KIND_COLUMN_ORDER.map((kind, columnIndex) => {
          const meta = SCENARIO_EVENT_KIND_COLUMN_META[kind];
          const chipClass = SCENARIO_EVENT_KIND_CHIP_CLASS[kind];
          const items = offeredEventsByKind[kind];
          return (
            <section key={kind} className="flex flex-col gap-3">
              <header className="flex items-baseline justify-between gap-3 px-1">
                <Tooltip
                  message={meta.blurb}
                  placement="bottom-start"
                  messageClassName="text-black"
                >
                  <span
                    tabIndex={0}
                    data-event-kind={kind}
                    className={`cursor-help rounded-full px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.28em] outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/40 ${chipClass}`}
                  >
                    {meta.label}
                  </span>
                </Tooltip>
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-black">
                  {items.length} dealt
                </span>
              </header>
              <ol className="flex flex-col gap-3">
                {items.map(({ event, sceneIndex }, indexInColumn) => {
                  const pickIndex = picks.indexOf(event.id);
                  const selected = pickIndex >= 0;
                  return (
                    <motion.li
                      key={event.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.32,
                        ease: EASE_OUT_QUART,
                        delay: 0.08 + columnIndex * 0.06 + indexInColumn * 0.04,
                      }}
                    >
                      <Tooltip
                        message={meta.blurb}
                        placement="top-center"
                        className="w-full"
                        messageClassName="text-black"
                      >
                        <button
                          type="button"
                          data-sfx="click"
                          aria-pressed={selected}
                          disabled={isActionPending}
                          onClick={() => togglePick(event.id)}
                          className={`aura-glass-lift flex h-40 w-full flex-col gap-3 overflow-hidden rounded-card px-5 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            selected
                              ? "aura-glass-strong cursor-pointer ring-2 ring-aura-rose/55 shadow-cta"
                              : "aura-glass cursor-pointer shadow-card hover:ring-1 hover:ring-aura-violet/30"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-black">
                              // scene {pad2(sceneIndex + 1)}
                            </span>
                            <DraftPickPip selected={selected} pickIndex={pickIndex} />
                          </div>
                          <h3 className="line-clamp-2 font-display text-display-sm font-semibold leading-tight text-black">
                            {event.title}
                          </h3>
                          <p className="line-clamp-2 text-label leading-relaxed text-black">
                            {event.event}
                          </p>
                        </button>
                      </Tooltip>
                    </motion.li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <div className="mt-9 flex flex-col items-center gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-black">
          {picks.length} of {targetCount} drafted
        </span>
        <PrimaryButton disabled={!canLockIn || isActionPending} onClick={() => onPickEvents(picks)}>
          {canLockIn ? "Lock the lineup" : `Pick ${targetCount - picks.length} more to begin`}
        </PrimaryButton>
        <p className="max-w-sm text-center text-label text-black">
          You can drop these three scenes anytime the date is paused. Cupid never auto-fires them.
        </p>
      </div>
    </motion.section>
  );
}

function DraftPickPip({ selected, pickIndex }: { selected: boolean; pickIndex: number }) {
  if (!selected) {
    return (
      <span
        aria-hidden
        className="grid size-5 place-items-center rounded-full border border-dashed border-black/50 text-black"
      >
        <span className="size-1.5 rounded-full bg-black/45" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-5 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet font-mono text-xs font-semibold leading-none text-white shadow-cta"
    >
      {pickIndex + 1}
    </span>
  );
}

const END_SENTIMENT_BADGES: Record<string, { label: string; tone: string; dot: string }> = {
  positive: {
    label: "positive end",
    tone: "bg-emerald-50/85 text-emerald-700 ring-1 ring-emerald-500/30",
    dot: "bg-aura-emerald",
  },
  negative: {
    label: "shut it down",
    tone: "bg-rose-50/85 text-aura-rose ring-1 ring-rose-500/30",
    dot: "bg-aura-rose",
  },
  natural: {
    label: "ran the clock",
    tone: "bg-violet-50/85 text-aura-violet ring-1 ring-violet-500/30",
    dot: "bg-aura-violet",
  },
};

function describeEndSentiment(session: DateSession): {
  label: string;
  tone: string;
  dot: string;
} {
  if (session.status === "completed") {
    if (session.endSentiment === "positive") {
      return END_SENTIMENT_BADGES.positive;
    }

    return END_SENTIMENT_BADGES.natural;
  }

  if (session.status === "ended_early") {
    return session.endSentiment === "positive"
      ? END_SENTIMENT_BADGES.positive
      : END_SENTIMENT_BADGES.negative;
  }

  return END_SENTIMENT_BADGES.natural;
}

function DateFooter({
  session,
  scenario,
  interventionText,
  interventionTargetMemberId,
  participants,
  displayedCurrentTurn,
  canAdvance,
  canIntervene,
  pendingDateAction,
  playbackUiState,
  nudgeSuggestions,
  onInterventionTextChange,
  onInterventionTargetChange,
  onAdvance,
  onCancel,
  onIntervene,
  onTriggerEvent,
  onTogglePlayback,
}: {
  session: DateSession;
  scenario: DateScenario | undefined;
  interventionText: string;
  interventionTargetMemberId: string;
  participants: Member[];
  displayedCurrentTurn: number;
  canAdvance: boolean;
  canIntervene: boolean;
  pendingDateAction: PendingDateAction | null;
  playbackUiState: DatePlaybackUiState;
  nudgeSuggestions: string[];
  onInterventionTextChange: (text: string) => void;
  onInterventionTargetChange: (memberId: string) => void;
  onAdvance: (turnCount: 1 | 2) => void;
  onCancel: () => void;
  onIntervene: () => void;
  onTriggerEvent: (eventId: string) => void;
  onTogglePlayback: (next: PlaybackIntent) => void;
}) {
  const { isPlaying, isPaused, isStreaming, pauseRequested, playbackBusy } = playbackUiState;
  const interventionSlotAvailable = canAddCupidIntervention(session);
  const interventionDisabled = !canAdvance || !interventionSlotAvailable;
  const nudgeButtonEnabled = session.playbackState === "paused" && !interventionDisabled;
  const togglePlayback = () => onTogglePlayback(isPlaying ? "paused" : "playing");
  const nudgesUsed = session.interventions.length;
  const nudgesRemaining = Math.max(0, MAX_NUDGES_PER_DATE - nudgesUsed);
  const picks = session.eventDraft.picked ?? [];
  const dropsEnabled =
    session.playbackState === "paused" &&
    canAdvance &&
    scenario !== undefined &&
    picks.some((eventId) => !session.eventsTriggered.includes(eventId));

  const [composerOpen, setComposerOpen] = useState(false);
  const [sceneConfirmId, setSceneConfirmId] = useState<string | null>(null);

  // Auto-close the composer if conditions change out from under it.
  useEffect(() => {
    if (composerOpen && !nudgeButtonEnabled) {
      setComposerOpen(false);
    }
  }, [composerOpen, nudgeButtonEnabled]);

  // Auto-close the scene preview if drops get disabled or the scene already fired.
  useEffect(() => {
    if (sceneConfirmId === null) return;
    if (!dropsEnabled || session.eventsTriggered.includes(sceneConfirmId)) {
      setSceneConfirmId(null);
    }
  }, [sceneConfirmId, dropsEnabled, session.eventsTriggered]);

  const pendingSceneEvent = useMemo(() => {
    if (sceneConfirmId === null || scenario === undefined) return undefined;
    return findScenarioEventById(scenario, sceneConfirmId);
  }, [sceneConfirmId, scenario]);

  const pendingScenePickIndex = sceneConfirmId === null ? -1 : picks.indexOf(sceneConfirmId);

  const openComposer = () => {
    if (!nudgeButtonEnabled) return;
    setComposerOpen(true);
  };
  const closeComposer = () => setComposerOpen(false);
  const fileNudge = () => {
    onIntervene();
    setComposerOpen(false);
  };

  const openSceneConfirm = (eventId: string) => {
    if (!dropsEnabled) return;
    if (session.eventsTriggered.includes(eventId)) return;
    setSceneConfirmId(eventId);
  };
  const closeSceneConfirm = () => setSceneConfirmId(null);
  const confirmSceneDrop = () => {
    if (sceneConfirmId === null) return;
    onTriggerEvent(sceneConfirmId);
    setSceneConfirmId(null);
  };

  // Space bar toggles playback when no input is focused. Director's instinct beats clicking.
  const playbackHandlerRef = useRef<() => void>(() => undefined);
  playbackHandlerRef.current = () => {
    if (playbackBusy) return;
    togglePlayback();
  };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable === true
      ) {
        return;
      }
      event.preventDefault();
      playbackHandlerRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <motion.footer
        data-date-footer
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
        className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 lg:bottom-6 lg:px-8"
      >
        <div className="relative mx-auto w-full max-w-3xl">
          <div className="peer aura-glass-strong pointer-events-auto flex w-full items-stretch gap-3 rounded-card px-3 py-2.5 lg:gap-5 lg:px-5 lg:py-3">
            <StatusGauges
              dateHealth={session.dateHealth}
              displayedCurrentTurn={displayedCurrentTurn}
              turnLimit={session.turnLimit}
              judgePasses={session.judgeSnapshots.length}
              nudgesRemaining={nudgesRemaining}
              nudgeButtonEnabled={nudgeButtonEnabled}
              onComposeNudge={openComposer}
              picks={picks}
              eventsTriggered={session.eventsTriggered}
              scenario={scenario}
              dropsEnabled={dropsEnabled}
              onTriggerEvent={openSceneConfirm}
            />
            <span aria-hidden className="flex-1" />
            <span aria-hidden className="w-px self-stretch bg-aura-hairline" />
            <TransportCluster
              isPlaying={isPlaying}
              isPaused={isPaused}
              isStreaming={isStreaming}
              pauseRequested={pauseRequested}
              playbackBusy={playbackBusy}
              canAdvance={canAdvance}
              pendingDateAction={pendingDateAction}
              onAdvance={onAdvance}
              onCancel={onCancel}
              onTogglePlayback={togglePlayback}
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-full mb-2 flex translate-y-1 justify-center opacity-0 transition duration-200 ease-out peer-hover:translate-y-0 peer-hover:opacity-100 peer-focus-within:translate-y-0 peer-focus-within:opacity-100">
            <DirectorSlate
              isPaused={isPaused}
              pauseRequested={pauseRequested}
              interventionSlotAvailable={interventionSlotAvailable}
              dropsEnabled={dropsEnabled}
              pendingDateAction={pendingDateAction}
            />
          </div>
        </div>
      </motion.footer>
      <AnimatePresence>
        {composerOpen ? (
          <NudgeComposerModal
            key="nudge-composer-modal"
            participants={participants}
            recipientId={interventionTargetMemberId}
            text={interventionText}
            suggestions={nudgeSuggestions}
            nudgesRemaining={nudgesRemaining}
            canIntervene={canIntervene}
            onTextChange={onInterventionTextChange}
            onRecipientChange={onInterventionTargetChange}
            onFile={fileNudge}
            onClose={closeComposer}
          />
        ) : null}
        {pendingSceneEvent !== undefined ? (
          <SceneConfirmModal
            key="scene-confirm-modal"
            event={pendingSceneEvent}
            pickIndex={pendingScenePickIndex}
            canDrop={dropsEnabled}
            onConfirm={confirmSceneDrop}
            onClose={closeSceneConfirm}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: status gauges                                    */
/* ------------------------------------------------------------------ */

function StatusGauges({
  dateHealth,
  displayedCurrentTurn,
  turnLimit,
  judgePasses,
  nudgesRemaining,
  nudgeButtonEnabled,
  onComposeNudge,
  picks,
  eventsTriggered,
  scenario,
  dropsEnabled,
  onTriggerEvent,
}: {
  dateHealth: number;
  displayedCurrentTurn: number;
  turnLimit: number;
  judgePasses: number;
  nudgesRemaining: number;
  nudgeButtonEnabled: boolean;
  onComposeNudge: () => void;
  picks: string[];
  eventsTriggered: string[];
  scenario: DateScenario | undefined;
  dropsEnabled: boolean;
  onTriggerEvent: (eventId: string) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 px-1 lg:gap-4 lg:px-2">
      <HealthGauge value={dateHealth} />
      <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
      <TurnGauge current={displayedCurrentTurn} total={turnLimit} />
      <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
      <JudgeGauge passes={judgePasses} />
      <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
      <NudgeGauge
        remaining={nudgesRemaining}
        enabled={nudgeButtonEnabled}
        onCompose={onComposeNudge}
      />
      {picks.length > 0 ? (
        <>
          <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
          <ScenesGauge
            picks={picks}
            eventsTriggered={eventsTriggered}
            scenario={scenario}
            enabled={dropsEnabled}
            onTriggerEvent={onTriggerEvent}
          />
        </>
      ) : null}
    </div>
  );
}

function GaugeLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-micro font-semibold uppercase leading-none tracking-[0.22em] text-aura-faint">
      {children}
    </span>
  );
}

function GaugeColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-start gap-1.5">{children}</div>;
}

function HealthGauge({ value }: { value: number }) {
  const safeValue = clampScore(Math.round(value));
  const ariaLabel = `Date health: ${safeValue} of 100. Drops with conflict, lifts with chemistry.`;

  return (
    <GaugeColumn>
      <GaugeLabel>Health</GaugeLabel>
      <span className="inline-flex items-center gap-2" aria-label={ariaLabel}>
        <span className="font-mono text-label font-semibold tabular-nums leading-none text-aura-ink">
          {safeValue}
        </span>
        <span aria-hidden className="block h-1 w-12 overflow-hidden rounded-pill bg-aura-hairline">
          <span
            className={`block h-full rounded-pill bg-gradient-to-r from-aura-emerald via-aura-rose to-aura-violet ${scoreWidthClass(safeValue)}`}
          />
        </span>
      </span>
    </GaugeColumn>
  );
}

function TurnGauge({ current, total }: { current: number; total: number }) {
  const ariaLabel = `Turn ${current} of ${total}. Judges sweep at every sixth turn.`;
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));

  return (
    <GaugeColumn>
      <GaugeLabel>Turn</GaugeLabel>
      <span className="inline-flex items-center gap-2" aria-label={ariaLabel}>
        <span className="font-mono text-label font-semibold tabular-nums leading-none text-aura-ink">
          {current}
          <span className="text-aura-faint">/{total}</span>
        </span>
        <span aria-hidden className="block h-1 w-12 overflow-hidden rounded-pill bg-aura-hairline">
          <span className={`block h-full rounded-pill bg-aura-violet/80 ${scoreWidthClass(pct)}`} />
        </span>
      </span>
    </GaugeColumn>
  );
}

function JudgeGauge({ passes }: { passes: number }) {
  const ariaLabel = `${passes} judge ${passes === 1 ? "pass" : "passes"} on file. Each pass logs how the date is reading.`;

  return (
    <GaugeColumn>
      <GaugeLabel>Judge</GaugeLabel>
      <span
        className="inline-flex items-center gap-1.5 font-mono text-label font-semibold tabular-nums leading-none text-aura-violet"
        aria-label={ariaLabel}
      >
        <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
          <path
            d="M6 1.5 L7.4 4.6 L10.7 5 L8.3 7.3 L8.9 10.6 L6 9 L3.1 10.6 L3.7 7.3 L1.3 5 L4.6 4.6 Z"
            fill="currentColor"
          />
        </svg>
        {passes}
      </span>
    </GaugeColumn>
  );
}

function NudgeGauge({
  remaining,
  enabled,
  onCompose,
}: {
  remaining: number;
  enabled: boolean;
  onCompose: () => void;
}) {
  const total = MAX_NUDGES_PER_DATE;
  const ariaLabel = enabled
    ? `Whisper a nudge. ${remaining} of ${total} left.`
    : remaining === 0
      ? "Every nudge filed."
      : `${remaining} of ${total} ${remaining === 1 ? "nudge" : "nudges"} left. Pause to whisper.`;

  return (
    <button
      type="button"
      data-sfx={enabled ? "click" : undefined}
      disabled={!enabled}
      onClick={onCompose}
      aria-label={ariaLabel}
      className="group -mx-1.5 -my-1 flex cursor-pointer flex-col items-start gap-1.5 rounded-chip px-1.5 py-1 transition disabled:cursor-not-allowed enabled:hover:bg-white/55 enabled:hover:shadow-quiet"
    >
      <GaugeLabel>
        <span className="inline-flex items-center gap-1">
          <span>Nudges</span>
          <svg
            viewBox="0 0 8 8"
            aria-hidden
            className="size-2 text-aura-rose/60 opacity-0 transition group-enabled:group-hover:opacity-100"
          >
            <path
              d="M1.5 4 H6 M4.2 1.8 L6.4 4 L4.2 6.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </GaugeLabel>
      <span className="inline-flex items-center gap-1">
        {Array.from({ length: total }).map((_, index) => {
          const filled = index < remaining;
          return (
            <svg
              key={`nudge-pip-${index}`}
              viewBox="0 0 12 12"
              aria-hidden
              className={`size-3 transition ${filled ? "text-aura-rose group-enabled:group-hover:scale-110" : "text-aura-rose/25"}`}
            >
              <path
                d="M6 10.4 C6 10.4 1.4 7.7 1.4 4.6 C1.4 3.1 2.55 1.95 4.05 1.95 C4.95 1.95 5.65 2.45 6 3.2 C6.35 2.45 7.05 1.95 7.95 1.95 C9.45 1.95 10.6 3.1 10.6 4.6 C10.6 7.7 6 10.4 6 10.4 Z"
                fill="currentColor"
              />
            </svg>
          );
        })}
      </span>
    </button>
  );
}

function ScenesGauge({
  picks,
  eventsTriggered,
  scenario,
  enabled,
  onTriggerEvent,
}: {
  picks: string[];
  eventsTriggered: string[];
  scenario: DateScenario | undefined;
  enabled: boolean;
  onTriggerEvent: (eventId: string) => void;
}) {
  const droppedSet = useMemo(() => new Set(eventsTriggered), [eventsTriggered]);
  const eventById = useMemo(() => {
    if (scenario === undefined) {
      return new Map<string, ScenarioEvent>();
    }
    return new Map(scenario.director.events.map((event) => [event.id, event]));
  }, [scenario]);

  return (
    <GaugeColumn>
      <GaugeLabel>Scenes</GaugeLabel>
      <span className="inline-flex items-center gap-1">
        {picks.map((eventId) => {
          const event = eventById.get(eventId);
          const dropped = droppedSet.has(eventId);
          const interactive = enabled && !dropped && event !== undefined;
          const title = event?.title ?? "Scene";
          const ariaLabel = dropped
            ? `${title} dropped.`
            : interactive
              ? `Preview scene: ${title}.`
              : `${title}. Pause and stop streaming to drop.`;
          return (
            <button
              key={eventId}
              type="button"
              data-sfx={interactive ? "click" : undefined}
              disabled={!interactive}
              onClick={() => {
                if (!interactive) return;
                onTriggerEvent(eventId);
              }}
              aria-label={ariaLabel}
              title={title}
              className={`grid size-5 cursor-pointer place-items-center rounded transition disabled:cursor-not-allowed ${
                dropped
                  ? "text-aura-emerald/80"
                  : interactive
                    ? "text-aura-violet hover:scale-110 hover:text-aura-fuchsia"
                    : "text-aura-violet/40"
              }`}
            >
              {dropped ? (
                <svg viewBox="0 0 12 12" className="size-full" aria-hidden>
                  <path
                    d="M2.5 6.5 L5 9 L9.5 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 12 12" className="size-full" aria-hidden>
                  <path d="M6 1.2 L10.8 6 L6 10.8 L1.2 6 Z" fill="currentColor" />
                </svg>
              )}
            </button>
          );
        })}
      </span>
    </GaugeColumn>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: nudge composer modal                             */
/* ------------------------------------------------------------------ */

const NUDGE_MAX_CHARS = 240;

function NudgeComposerModal({
  participants,
  recipientId,
  text,
  suggestions,
  nudgesRemaining,
  canIntervene,
  onTextChange,
  onRecipientChange,
  onFile,
  onClose,
}: {
  participants: Member[];
  recipientId: string;
  text: string;
  suggestions: string[];
  nudgesRemaining: number;
  canIntervene: boolean;
  onTextChange: (text: string) => void;
  onRecipientChange: (memberId: string) => void;
  onFile: () => void;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fallbackRecipient = participants[0];
  const recipient =
    participants.find((member) => member.id === recipientId) ?? fallbackRecipient ?? null;
  const effectiveRecipientId = recipient?.id ?? "";
  const recipientName = recipient?.firstName ?? "one";
  const sendDisabled = !canIntervene || text.trim().length === 0;
  const swapEnabled = participants.length >= 2;
  const totalSlots = MAX_NUDGES_PER_DATE;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Autofocus and place the cursor at the end of any prior draft.
  useEffect(() => {
    const node = textareaRef.current;
    if (node === null) return;
    node.focus();
    const length = node.value.length;
    node.setSelectionRange(length, length);
  }, []);

  const swapRecipient = () => {
    if (!swapEnabled) return;
    const next = participants.find((member) => member.id !== effectiveRecipientId);
    if (next === undefined) return;
    onRecipientChange(next.id);
  };

  const fileNudge = () => {
    if (sendDisabled) return;
    onFile();
  };

  return (
    <motion.aside
      key="nudge-composer-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
      onClick={onClose}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/55 px-4 py-10 backdrop-blur-xl"
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Whisper a nudge to ${recipientName}`}
        className="aura-glass-strong relative w-full max-w-5xl overflow-hidden rounded-card"
      >
        <ModalCloseButton onClose={onClose} label="Close nudge composer" sfx="dismiss" />
        <div className="relative flex flex-col gap-6 px-7 py-7 lg:px-9 lg:py-8">
          <header className="flex flex-col gap-3">
            <Eyebrow>{"// nudge.compose"}</Eyebrow>
            <h2 className="font-display text-display-sm font-semibold tracking-tight text-aura-ink lg:text-display-md">
              Whisper to {recipientName}
            </h2>
            <p className="aura-accent text-lead text-aura-muted">
              One slip, then they hear it. They will not know it came from you.
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
              to
            </span>
            <button
              type="button"
              data-sfx="toggle"
              onClick={swapRecipient}
              disabled={!swapEnabled}
              aria-label={`Whisper recipient: ${recipientName}. ${swapEnabled ? "Click to swap." : ""}`}
              title={swapEnabled ? "Swap recipient" : undefined}
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill bg-aura-rose py-1.5 pr-4 pl-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-quiet transition hover:bg-aura-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {recipient !== null ? <Portrait member={recipient} variant="chip" /> : null}
              <span>{recipientName}</span>
              {swapEnabled ? (
                <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
                  <path
                    d="M2 4 L10 4 M7 1 L10 4 L7 7 M10 8 L2 8 M5 11 L2 8 L5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
            <span aria-hidden className="h-3 w-px bg-aura-hairline-strong/50" />
            <NudgeSlotMeter remaining={nudgesRemaining} total={totalSlots} />
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              maxLength={NUDGE_MAX_CHARS}
              rows={4}
              onChange={(event) => onTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  fileNudge();
                }
              }}
              placeholder={`What should ${recipientName} do next?`}
              aria-label={`Nudge for ${recipientName}`}
              className="block min-h-[7.5rem] w-full resize-none rounded-card border border-aura-hairline bg-white/70 px-5 py-4 font-sans text-body text-aura-ink shadow-quiet outline-none transition placeholder:text-aura-faint focus:border-aura-rose/55 focus:bg-white focus:shadow-card"
            />
            <span className="pointer-events-none absolute bottom-3 right-4 font-mono text-micro tabular-nums text-aura-faint">
              {text.length} / {NUDGE_MAX_CHARS}
            </span>
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>{"// quick nudges"}</Eyebrow>
              <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
                tap to draft
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {suggestions.map((suggestion) => {
                const isActive = text.trim() === suggestion.trim();
                return (
                  <button
                    key={suggestion}
                    type="button"
                    data-sfx="click"
                    onClick={() => {
                      onTextChange(suggestion);
                      const node = textareaRef.current;
                      if (node !== null) {
                        node.focus();
                        const length = suggestion.length;
                        node.setSelectionRange(length, length);
                      }
                    }}
                    aria-pressed={isActive}
                    className={`group flex h-full cursor-pointer flex-col items-start gap-2 rounded-chip border px-3.5 py-3 text-left transition ${
                      isActive
                        ? "border-aura-rose/60 bg-aura-rose/10 shadow-quiet"
                        : "border-aura-hairline bg-white/60 hover:-translate-y-px hover:border-aura-rose/40 hover:bg-white hover:shadow-quiet"
                    }`}
                  >
                    <span
                      className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                        isActive ? "text-aura-rose" : "text-aura-faint group-hover:text-aura-rose"
                      }`}
                    >
                      {suggestionLabel(suggestion)}
                    </span>
                    <span className="text-label leading-snug text-aura-ink/85">{suggestion}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-aura-hairline bg-white/40 px-7 py-4 lg:flex-nowrap lg:px-9 lg:py-5">
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint lg:whitespace-nowrap">
            <span className="text-aura-muted">Enter</span> to file ·{" "}
            <span className="text-aura-muted">Shift+Enter</span> for line break ·{" "}
            <span className="text-aura-muted">Esc</span> to close
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <button
              type="button"
              data-sfx="primary"
              onClick={fileNudge}
              disabled={sendDisabled}
              aria-label="File whisper"
              className="aura-cta inline-flex cursor-pointer items-center gap-2 rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta ring-1 ring-white/40 ring-inset transition hover:-translate-y-px hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <span>File whisper</span>
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                <path d="M2 8 L14 2 L11 14 L7.5 9 L2 8 Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
}

function NudgeSlotMeter({ remaining, total }: { remaining: number; total: number }) {
  const usedLabel = total - remaining;
  const message =
    remaining === 0
      ? "every nudge filed"
      : `${remaining} of ${total} ${remaining === 1 ? "nudge" : "nudges"} left`;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1">
        {Array.from({ length: total }).map((_, index) => {
          const filled = index < remaining;
          return (
            <svg
              key={`composer-pip-${index}`}
              viewBox="0 0 12 12"
              aria-hidden
              className={`size-3 transition ${filled ? "text-aura-rose" : "text-aura-rose/25"}`}
            >
              <path
                d="M6 10.4 C6 10.4 1.4 7.7 1.4 4.6 C1.4 3.1 2.55 1.95 4.05 1.95 C4.95 1.95 5.65 2.45 6 3.2 C6.35 2.45 7.05 1.95 7.95 1.95 C9.45 1.95 10.6 3.1 10.6 4.6 C10.6 7.7 6 10.4 6 10.4 Z"
                fill="currentColor"
              />
            </svg>
          );
        })}
      </span>
      <span
        className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint"
        aria-label={`${usedLabel} of ${total} nudges used. ${message}.`}
      >
        {message}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: scene drop confirmation modal                    */
/* ------------------------------------------------------------------ */

function SceneConfirmModal({
  event,
  pickIndex,
  canDrop,
  onConfirm,
  onClose,
}: {
  event: ScenarioEvent;
  pickIndex: number;
  canDrop: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        onClose();
        return;
      }
      if (keyEvent.key === "Enter" && canDrop) {
        const target = keyEvent.target as HTMLElement | null;
        if (
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable === true
        ) {
          return;
        }
        keyEvent.preventDefault();
        onConfirm();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onConfirm, canDrop]);

  const meta = SCENARIO_EVENT_KIND_COLUMN_META[event.kind];
  const chipClass = SCENARIO_EVENT_KIND_CHIP_CLASS[event.kind];
  const slotLabel = pickIndex >= 0 ? `scene ${pad2(pickIndex + 1)} of 03` : "scene preview";

  return (
    <motion.aside
      key="scene-confirm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
      onClick={onClose}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/55 px-4 py-10 backdrop-blur-xl"
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Drop scene: ${event.title}`}
        className="aura-glass-strong relative w-full max-w-2xl overflow-hidden rounded-card"
      >
        <ModalCloseButton onClose={onClose} label="Close scene preview" sfx="dismiss" />
        <div className="relative flex flex-col gap-6 px-7 py-7 lg:px-9 lg:py-8">
          <header className="flex flex-col gap-3">
            <Eyebrow>{`// ${slotLabel}`}</Eyebrow>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.28em] ${chipClass}`}
              >
                {meta.label}
              </span>
              <span className="text-label text-aura-muted">{meta.blurb}</span>
            </div>
            <h2 className="font-display text-display-sm font-semibold tracking-tight text-aura-ink lg:text-display-md">
              {event.title}
            </h2>
          </header>

          <section className="flex flex-col gap-2">
            <Eyebrow>{"// the beat"}</Eyebrow>
            <p className="text-body leading-relaxed text-aura-ink">{event.event}</p>
          </section>

          <section className="flex flex-col gap-2">
            <Eyebrow>{"// what they see"}</Eyebrow>
            <p className="text-body leading-relaxed text-aura-ink/85">
              {event.characterVisibleText}
            </p>
          </section>

          {!canDrop ? (
            <p
              role="status"
              className="rounded-chip border border-aura-amber/40 bg-aura-amber/10 px-3 py-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-amber"
            >
              Pause the date to drop this scene.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-aura-hairline bg-white/40 px-7 py-4 lg:flex-nowrap lg:px-9 lg:py-5">
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint lg:whitespace-nowrap">
            <span className="text-aura-muted">Enter</span> to drop ·{" "}
            <span className="text-aura-muted">Esc</span> to close
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <button
              type="button"
              data-sfx="primary"
              onClick={onConfirm}
              disabled={!canDrop}
              aria-label={`Drop scene ${event.title}`}
              className="aura-cta inline-flex cursor-pointer items-center gap-2 rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta ring-1 ring-white/40 ring-inset transition hover:-translate-y-px hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <span>Drop scene</span>
              <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden>
                <path d="M6 1.2 L10.8 6 L6 10.8 L1.2 6 Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: hover-revealed advisory above the date dock      */
/* ------------------------------------------------------------------ */

function DirectorSlate({
  isPaused,
  pauseRequested,
  interventionSlotAvailable,
  dropsEnabled,
  pendingDateAction,
}: {
  isPaused: boolean;
  pauseRequested: boolean;
  interventionSlotAvailable: boolean;
  dropsEnabled: boolean;
  pendingDateAction: PendingDateAction | null;
}) {
  if (pauseRequested) {
    return (
      <div
        role="status"
        aria-label="Pause filed. Finishing this beat."
        className="aura-glass-strong inline-flex items-center gap-2 rounded-pill border border-aura-amber/35 px-3.5 py-1.5"
      >
        <span aria-hidden className="inline-flex items-center gap-1">
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-amber/55 [animation-delay:0ms]" />
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-amber/65 [animation-delay:180ms]" />
          <span className="aura-typing-dot size-1.5 rounded-full bg-aura-amber/75 [animation-delay:360ms]" />
        </span>
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-amber">
          Pause filed. Finishing this beat.
        </span>
      </div>
    );
  }

  if (isPaused) {
    return (
      <div
        role="status"
        aria-label="Held. Paused for direction."
        className="aura-glass-rose inline-flex items-center gap-2.5 rounded-pill px-3.5 py-1.5"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="aura-pulse size-1.5 rounded-full bg-aura-rose" />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
            Held
          </span>
        </span>
        <span aria-hidden className="h-3 w-px bg-aura-rose/30" />
        <span className="inline-flex items-center gap-1.5">
          <SlateActionChip kind="whisper" enabled={interventionSlotAvailable} label="Whisper" />
          <SlateActionChip kind="scene" enabled={dropsEnabled} label="Drop scene" />
          <SlateActionChip kind="advance" enabled label="Advance beat" />
        </span>
      </div>
    );
  }

  const rollingCopy =
    pendingDateAction === "advanceExchange"
      ? "Date in motion · pause to direct"
      : "Autoplay rolling · pause to direct";

  return (
    <div
      role="status"
      aria-label={rollingCopy}
      className="aura-glass-strong inline-flex items-center gap-2 rounded-pill border border-aura-violet/25 px-3.5 py-1.5"
    >
      <span aria-hidden className="inline-flex items-center gap-1">
        <span className="aura-typing-dot size-1.5 rounded-full bg-aura-violet/55 [animation-delay:0ms]" />
        <span className="aura-typing-dot size-1.5 rounded-full bg-aura-violet/65 [animation-delay:180ms]" />
        <span className="aura-typing-dot size-1.5 rounded-full bg-aura-violet/75 [animation-delay:360ms]" />
      </span>
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-violet">
        {rollingCopy}
      </span>
    </div>
  );
}

function SlateActionChip({
  kind,
  enabled,
  label,
}: {
  kind: "whisper" | "scene" | "advance";
  enabled: boolean;
  label: string;
}) {
  const tone = !enabled
    ? "border-aura-hairline-strong/50 bg-white/40 text-aura-faint"
    : kind === "whisper"
      ? "border-aura-rose/35 bg-aura-rose/10 text-aura-rose"
      : "border-aura-violet/35 bg-aura-violet/10 text-aura-violet";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] ${tone}`}
    >
      <SlateChipIcon kind={kind} />
      <span>{label}</span>
    </span>
  );
}

function SlateChipIcon({ kind }: { kind: "whisper" | "scene" | "advance" }) {
  if (kind === "whisper") {
    return (
      <svg viewBox="0 0 12 12" aria-hidden className="size-2.5">
        <path
          d="M6 10.4 C6 10.4 1.4 7.7 1.4 4.6 C1.4 3.1 2.55 1.95 4.05 1.95 C4.95 1.95 5.65 2.45 6 3.2 C6.35 2.45 7.05 1.95 7.95 1.95 C9.45 1.95 10.6 3.1 10.6 4.6 C10.6 7.7 6 10.4 6 10.4 Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (kind === "scene") {
    return (
      <svg viewBox="0 0 12 12" aria-hidden className="size-2.5">
        <path d="M6 1.2 L10.8 6 L6 10.8 L1.2 6 Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 14 14" aria-hidden className="size-2.5">
      <path d="M2.5 2.5 L9 7 L2.5 11.5 Z" fill="currentColor" />
      <rect x="9.6" y="2.5" width="1.7" height="9" rx="0.7" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Director's slate: transport cluster                                */
/* ------------------------------------------------------------------ */

function TransportCluster({
  isPlaying,
  isPaused,
  isStreaming,
  pauseRequested,
  playbackBusy,
  canAdvance,
  pendingDateAction,
  onAdvance,
  onCancel,
  onTogglePlayback,
}: {
  isPlaying: boolean;
  isPaused: boolean;
  isStreaming: boolean;
  pauseRequested: boolean;
  playbackBusy: boolean;
  canAdvance: boolean;
  pendingDateAction: PendingDateAction | null;
  onAdvance: (turnCount: 1 | 2) => void;
  onCancel: () => void;
  onTogglePlayback: () => void;
}) {
  const advanceTip =
    pendingDateAction === "advanceExchange" ? "Streaming next beat..." : "Advance one beat";
  const playTip = pauseRequested
    ? "Pause filed"
    : isPlaying
      ? "Pause autoplay (space)"
      : "Start autoplay (space)";
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {isPaused && !pauseRequested ? (
        <TransportButton
          kind="ghost"
          disabled={!canAdvance}
          onClick={() => onAdvance(2)}
          ariaLabel={advanceTip}
        >
          <AdvanceIcon />
        </TransportButton>
      ) : null}
      {isPaused && isStreaming ? (
        <TransportButton kind="stop" disabled={false} onClick={onCancel} ariaLabel="Stop streaming">
          <StopIcon />
        </TransportButton>
      ) : null}
      <TransportButton
        kind={isPlaying && !pauseRequested ? "ghost-active" : "primary"}
        disabled={playbackBusy}
        onClick={onTogglePlayback}
        ariaLabel={playTip}
      >
        {isPlaying && !pauseRequested ? <PauseIcon /> : <PlayIcon />}
      </TransportButton>
    </div>
  );
}

function TransportButton({
  kind,
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  kind: "ghost" | "ghost-active" | "primary" | "stop";
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  const baseClass =
    "relative grid size-10 cursor-pointer place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40";
  const toneClass =
    kind === "primary"
      ? "aura-cta bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet text-white shadow-cta ring-1 ring-white/40 ring-inset hover:-translate-y-px hover:shadow-cta-hover"
      : kind === "ghost-active"
        ? "bg-white/85 text-aura-violet ring-1 ring-aura-violet/40 hover:bg-white"
        : kind === "stop"
          ? "bg-aura-rose/15 text-aura-rose ring-1 ring-aura-rose/40 hover:bg-aura-rose hover:text-white"
          : "text-aura-muted ring-1 ring-aura-hairline hover:bg-white/55 hover:text-aura-ink";
  const sfxCue: SfxCue = kind === "primary" ? "primary" : kind === "stop" ? "dismiss" : "click";
  return (
    <button
      type="button"
      data-sfx={sfxCue}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseClass} ${toneClass}`}
    >
      {kind === "ghost-active" ? (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-aura-violet/20 aura-pulse"
        />
      ) : null}
      {children}
    </button>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <path d="M3.8 2.4 L11.6 7 L3.8 11.6 Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <rect x="3" y="2.5" width="2.6" height="9" rx="0.7" fill="currentColor" />
      <rect x="8.4" y="2.5" width="2.6" height="9" rx="0.7" fill="currentColor" />
    </svg>
  );
}

function AdvanceIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <path d="M2.5 2.5 L9 7 L2.5 11.5 Z" fill="currentColor" />
      <rect x="9.6" y="2.5" width="1.7" height="9" rx="0.7" fill="currentColor" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <path
        d="M3 3 L11 11 M11 3 L3 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function suggestionLabel(suggestion: string): string {
  if (suggestion.includes("boundary")) {
    return "Name boundary";
  }

  if (suggestion.includes("logistics")) {
    return "Move past logistics";
  }

  if (suggestion.includes("follow-up")) {
    return "Ask follow-up";
  }

  return "Ground it";
}

/* ================================================================== */
/* Notes                                                              */
/* ================================================================== */

export type NotesProps = {
  memories: MemoryRecord[];
  members: Member[];
  pairStates: PairState[];
  scenarios: DateScenario[];
  shiftCount: number;
};

type NotesScopeFilter = "all" | "pairs" | "scenarios";

const NOTES_SCOPE_FILTERS: { id: NotesScopeFilter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "pairs", label: "pairs" },
  { id: "scenarios", label: "scenarios" },
];

const PAIR_NOTE_SCOPES = new Set<MemoryRecord["scope"]>(["pair", "date"]);

export function NotesView({ memories, members, pairStates, scenarios, shiftCount }: NotesProps) {
  const [scopeFilter, setScopeFilter] = useState<NotesScopeFilter>("all");
  const [selectedPairId, setSelectedPairId] = useState<string | "any">("any");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | "any">("any");

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const pairStateById = useMemo(
    () => new Map(pairStates.map((pair) => [pair.id, pair])),
    [pairStates],
  );
  const scenarioById = useMemo(
    () => new Map(scenarios.map((scenario) => [scenario.id, scenario])),
    [scenarios],
  );

  const visibleMemories = useMemo(
    () => memories.filter(isPlayerVisibleNote).sort(sortMemoriesNewestFirst),
    [memories],
  );

  const pairOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const memory of visibleMemories) {
      if (!PAIR_NOTE_SCOPES.has(memory.scope) || memory.pairId === undefined) continue;
      if (seen.has(memory.pairId)) continue;
      seen.set(memory.pairId, {
        id: memory.pairId,
        label: pairLabel(memory.pairId, memberById, pairStateById),
      });
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleMemories, memberById, pairStateById]);

  const scenarioOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const memory of visibleMemories) {
      if (memory.scope !== "scenario" || memory.scenarioId === undefined) continue;
      if (seen.has(memory.scenarioId)) continue;
      const scenario = scenarioById.get(memory.scenarioId);
      seen.set(memory.scenarioId, {
        id: memory.scenarioId,
        label: scenario?.title ?? memory.scenarioId,
      });
    }
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleMemories, scenarioById]);

  const filteredMemories = useMemo(() => {
    return visibleMemories.filter((memory) => {
      if (scopeFilter === "pairs" && !PAIR_NOTE_SCOPES.has(memory.scope)) return false;
      if (scopeFilter === "scenarios" && memory.scope !== "scenario") return false;
      if (selectedPairId !== "any" && memory.pairId !== selectedPairId) return false;
      if (selectedScenarioId !== "any" && memory.scenarioId !== selectedScenarioId) return false;
      return true;
    });
  }, [visibleMemories, scopeFilter, selectedPairId, selectedScenarioId]);

  const totalCount = visibleMemories.length;
  const shownCount = filteredMemories.length;
  const hasFilters =
    scopeFilter !== "all" || selectedPairId !== "any" || selectedScenarioId !== "any";

  function clearNotesFilters() {
    setScopeFilter("all");
    setSelectedPairId("any");
    setSelectedScenarioId("any");
  }

  return (
    <ViewFrame wide>
      <SectionHeader
        eyebrow={`// notes.${pad2(shiftCount)}`}
        title="Case notes"
        meta={`${pad2(totalCount)} on file`}
        tooltip="Public pair and scenario memories Cupid can share. Private member files and judge-only records stay sealed."
      />

      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(44rem,1fr)_minmax(26rem,34rem)]">
        <div className="min-w-0 xl:sticky xl:top-6">
          <PairBoard
            members={members}
            pairStates={pairStates}
            memories={memories}
            scenarios={scenarios}
            shiftCount={shiftCount}
          />
        </div>

        <section className="min-w-0 xl:sticky xl:top-6 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2">
          <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-aura-hairline pb-3">
            <div className="space-y-1">
              <Eyebrow>// archive.notes</Eyebrow>
              <h3 className="font-display text-display-md font-semibold leading-tight tracking-tight text-aura-ink">
                Filed notes
              </h3>
            </div>
            <p className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
              date and scenario cards
            </p>
          </header>

          <NotesFilterRail
            scopeFilter={scopeFilter}
            onScopeFilterChange={(next) => {
              setScopeFilter(next);
              if (next === "pairs") setSelectedScenarioId("any");
              if (next === "scenarios") setSelectedPairId("any");
            }}
            pairOptions={pairOptions}
            selectedPairId={selectedPairId}
            onSelectedPairChange={setSelectedPairId}
            scenarioOptions={scenarioOptions}
            selectedScenarioId={selectedScenarioId}
            onSelectedScenarioChange={setSelectedScenarioId}
            totalCount={totalCount}
            shownCount={shownCount}
            hasFilters={hasFilters}
            onClearFilters={clearNotesFilters}
          />

          {totalCount === 0 ? (
            <NotesEmptyTile
              title="No public notes yet"
              subhead="Cupid files pair and scenario memories after dates wrap. Run a shift to start the archive."
            />
          ) : filteredMemories.length === 0 ? (
            <NotesEmptyTile
              title="No notes match this filter"
              subhead="Loosen the filter to see more of the case archive."
              action={<GhostButton onClick={clearNotesFilters}>Reset filters</GhostButton>}
            />
          ) : (
            <NotesArchive
              memories={filteredMemories}
              memberById={memberById}
              pairStateById={pairStateById}
              scenarioById={scenarioById}
            />
          )}
        </section>
      </div>
    </ViewFrame>
  );
}

function NotesArchive({
  memories,
  memberById,
  pairStateById,
  scenarioById,
}: {
  memories: MemoryRecord[];
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
}) {
  const [featured, ...rest] = memories;

  return (
    <div className="relative mt-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-3 top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-aura-rose/45 via-aura-hairline-strong to-transparent lg:block"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[14px] top-3 hidden size-2 rounded-full bg-aura-rose/70 shadow-[0_0_0_4px_rgba(255,253,249,0.85)] lg:block"
      />

      {featured === undefined ? null : (
        <FeaturedNoteCard
          memory={featured}
          memberById={memberById}
          pairStateById={pairStateById}
          scenarioById={scenarioById}
          rank={memories.length}
        />
      )}

      {rest.length === 0 ? null : (
        <ul className="mt-6 grid gap-5">
          <AnimatePresence initial={false}>
            {rest.map((memory, index) => (
              <NoteCard
                key={memory.id}
                memory={memory}
                index={index}
                memberById={memberById}
                pairStateById={pairStateById}
                scenarioById={scenarioById}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function NotesFilterRail({
  scopeFilter,
  onScopeFilterChange,
  pairOptions,
  selectedPairId,
  onSelectedPairChange,
  scenarioOptions,
  selectedScenarioId,
  onSelectedScenarioChange,
  totalCount,
  shownCount,
  hasFilters,
  onClearFilters,
}: {
  scopeFilter: NotesScopeFilter;
  onScopeFilterChange: (next: NotesScopeFilter) => void;
  pairOptions: { id: string; label: string }[];
  selectedPairId: string | "any";
  onSelectedPairChange: (id: string | "any") => void;
  scenarioOptions: { id: string; label: string }[];
  selectedScenarioId: string | "any";
  onSelectedScenarioChange: (id: string | "any") => void;
  totalCount: number;
  shownCount: number;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  const showPairPicker = scopeFilter !== "scenarios" && pairOptions.length > 0;
  const showScenarioPicker = scopeFilter !== "pairs" && scenarioOptions.length > 0;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="inline-flex items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
        {NOTES_SCOPE_FILTERS.map((filter) => {
          const active = scopeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              data-sfx="click"
              onClick={() => onScopeFilterChange(filter.id)}
              aria-pressed={active}
              className={`cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                active
                  ? "bg-aura-ink text-white shadow-quiet"
                  : "text-aura-muted hover:text-aura-ink"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {showPairPicker ? (
        <NotesScopePicker
          label="Pair"
          value={selectedPairId}
          options={pairOptions}
          onChange={onSelectedPairChange}
        />
      ) : null}

      {showScenarioPicker ? (
        <NotesScopePicker
          label="Date plan"
          value={selectedScenarioId}
          options={scenarioOptions}
          onChange={onSelectedScenarioChange}
        />
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {pad2(shownCount)} of {pad2(totalCount)} shown
        </span>
        {hasFilters ? <GhostButton onClick={onClearFilters}>Reset filters</GhostButton> : null}
      </div>
    </div>
  );
}

function NotesScopePicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | "any";
  options: { id: string; label: string }[];
  onChange: (id: string | "any") => void;
}) {
  const selectOptions = [
    { value: "any", label: "any" },
    ...options.map((option) => ({ value: option.id, label: option.label })),
  ];

  return (
    <SelectInput
      label={label}
      value={value}
      options={selectOptions}
      layout="inline"
      onChange={onChange}
    />
  );
}

type NoteScopeKey = "pair" | "date" | "scenario" | "closure";

type ScopePalette = {
  label: string;
  ribbon: string;
  rail: string;
  watermark: string;
  glyphRing: string;
  glyphFill: string;
  caseDot: string;
};

const NOTE_SCOPE_PALETTE: Record<NoteScopeKey, ScopePalette> = {
  pair: {
    label: "PAIR FILE",
    ribbon: "bg-aura-rose/95 text-white",
    rail: "bg-aura-rose",
    watermark: "text-aura-rose",
    glyphRing: "ring-aura-rose/35",
    glyphFill: "from-rose-100 via-aura-paper to-fuchsia-50",
    caseDot: "bg-aura-rose",
  },
  date: {
    label: "DATE FILE",
    ribbon: "bg-aura-fuchsia/95 text-white",
    rail: "bg-aura-fuchsia",
    watermark: "text-aura-fuchsia",
    glyphRing: "ring-aura-fuchsia/35",
    glyphFill: "from-fuchsia-100 via-aura-paper to-violet-50",
    caseDot: "bg-aura-fuchsia",
  },
  scenario: {
    label: "SCENARIO FILE",
    ribbon: "bg-aura-amber/95 text-white",
    rail: "bg-aura-amber",
    watermark: "text-aura-amber",
    glyphRing: "ring-aura-amber/40",
    glyphFill: "from-amber-100 via-aura-paper to-rose-50",
    caseDot: "bg-aura-amber",
  },
  closure: {
    label: "CASE CLOSED",
    ribbon: "bg-aura-ink text-white",
    rail: "bg-gradient-to-b from-aura-rose via-aura-fuchsia to-aura-amber",
    watermark: "text-aura-rose",
    glyphRing: "ring-aura-rose/50",
    glyphFill: "from-aura-cream via-rose-50 to-fuchsia-100",
    caseDot: "bg-aura-ink",
  },
};

function isPairClosureMemory(memory: MemoryRecord): boolean {
  return memory.scope === "pair" && memory.tags.includes(PAIR_CLOSURE_TAG);
}

function paletteForMemory(memory: MemoryRecord): ScopePalette {
  if (isPairClosureMemory(memory)) {
    return NOTE_SCOPE_PALETTE.closure;
  }
  return paletteForScope(memory.scope);
}

function paletteForScope(scope: MemoryRecord["scope"]): ScopePalette {
  if (scope === "pair" || scope === "date" || scope === "scenario") {
    return NOTE_SCOPE_PALETTE[scope];
  }
  return NOTE_SCOPE_PALETTE.pair;
}

function caseNumberFor(memory: MemoryRecord): string {
  if (isPairClosureMemory(memory)) {
    const cleaned = memory.id.replace(/[^0-9a-zA-Z]/g, "");
    const tail = cleaned.slice(-4).toUpperCase().padStart(4, "0");
    return `C-CL-${tail}`;
  }
  const prefix = memory.scope === "pair" ? "PR" : memory.scope === "date" ? "DT" : "SC";
  const cleaned = memory.id.replace(/[^0-9a-zA-Z]/g, "");
  const tail = cleaned.slice(-4).toUpperCase().padStart(4, "0");
  return `C-${prefix}-${tail}`;
}

function splitNoteLead(text: string): { lead: string; tail: string } {
  const trimmed = text.trim();
  const breaks = [". ", "? ", "! "]
    .map((token) => trimmed.indexOf(token))
    .filter((index) => index > 0);
  if (breaks.length === 0) {
    return { lead: trimmed, tail: "" };
  }
  const cut = Math.min(...breaks);
  return { lead: trimmed.slice(0, cut + 1), tail: trimmed.slice(cut + 2) };
}

function FeaturedNoteCard({
  memory,
  memberById,
  pairStateById,
  scenarioById,
  rank,
}: {
  memory: MemoryRecord;
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
  rank: number;
}) {
  const palette = paletteForMemory(memory);
  const pairMembers =
    memory.pairId === undefined
      ? []
      : (pairStateById.get(memory.pairId)?.participantIds ?? [])
          .map((id) => memberById.get(id))
          .filter((m): m is Member => Boolean(m));
  const scenario =
    memory.scenarioId === undefined ? undefined : scenarioById.get(memory.scenarioId);
  const title = noteCardTitle(memory, pairMembers, scenario);
  const subhead = noteCardSubhead(memory, scenario);
  const { lead, tail } = splitNoteLead(playerSafeMemoryText(memory.text));
  const caseNumber = caseNumberFor(memory);
  const tagLabels = visibleMemoryTagLabels(memory);

  return (
    <motion.article
      key={memory.id}
      layout
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.46, ease: EASE_OUT_QUART }}
      className={`aura-glass-strong relative overflow-hidden rounded-card ring-1 ${palette.glyphRing}`}
    >
      <NoteCardWatermark palette={palette} scope={memory.scope} large />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-1.5 ${palette.rail} opacity-60`}
      />
      <ImportanceRail value={memory.importance} palette={palette} large />

      <div className="relative z-10 px-6 pb-8 pl-11 pt-0">
        <div className="-mt-px flex items-start justify-between gap-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-b-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.26em] shadow-quiet ${palette.ribbon}`}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-white/85" />
            {palette.label}
          </span>
          <FiledStamp date={memory.createdAt} />
        </div>

        <div className="mt-6 grid gap-6">
          <div className="flex flex-col items-start gap-3">
            {pairMembers.length > 0 ? (
              <div className="flex -space-x-5">
                {pairMembers.map((member, idx) => (
                  <span
                    key={member.id}
                    className={`rounded-full border-[3px] border-white/90 bg-white shadow-quiet ${idx === 0 ? "rotate-[-3deg]" : "rotate-[2deg]"}`}
                  >
                    <Portrait member={member} variant="card" />
                  </span>
                ))}
              </div>
            ) : (
              <ScenarioGlyph
                title={scenario?.title ?? memory.scenarioId ?? "S"}
                palette={palette}
                large
              />
            )}
            <div className="space-y-1">
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
                Filed {formatNoteTimestamp(memory.createdAt)}
              </p>
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-muted">
                Lead case · {pad2(rank)} on file
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="font-display text-display-md font-semibold leading-tight tracking-tight text-aura-ink">
              {title}
            </h3>
            {subhead === null ? null : (
              <p className="mt-2 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-rose">
                {subhead}
              </p>
            )}
            <p className="aura-accent mt-5 text-lead leading-snug text-aura-ink/90">{lead}</p>
            {tail === "" ? null : (
              <p className="mt-4 max-w-prose text-body leading-relaxed text-aura-ink/80">{tail}</p>
            )}
            {tagLabels.length === 0 ? null : (
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {tagLabels.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill bg-white/70 px-2.5 py-1 ring-1 ring-aura-hairline"
                  >
                    <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4 border-t border-aura-hairline pt-4">
          <p className="flex items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
            <span aria-hidden className={`size-1.5 rounded-full ${palette.caseDot}`} />
            Reviewed by Cupid
          </p>
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted">
            ref · {caseNumber}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function NoteCard({
  memory,
  index,
  memberById,
  pairStateById,
  scenarioById,
}: {
  memory: MemoryRecord;
  index: number;
  memberById: Map<string, Member>;
  pairStateById: Map<string, PairState>;
  scenarioById: Map<string, DateScenario>;
}) {
  const palette = paletteForMemory(memory);
  const pairMembers =
    memory.pairId === undefined
      ? []
      : (pairStateById.get(memory.pairId)?.participantIds ?? [])
          .map((id) => memberById.get(id))
          .filter((m): m is Member => Boolean(m));
  const scenario =
    memory.scenarioId === undefined ? undefined : scenarioById.get(memory.scenarioId);
  const title = noteCardTitle(memory, pairMembers, scenario);
  const subhead = noteCardSubhead(memory, scenario);
  const { lead, tail } = splitNoteLead(playerSafeMemoryText(memory.text));
  const caseNumber = caseNumberFor(memory);
  const tagLabels = visibleMemoryTagLabels(memory);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.34, delay: Math.min(index, 6) * 0.04, ease: EASE_OUT_QUART }}
      className="list-none"
    >
      <article
        className={`aura-glass aura-glass-lift relative h-full overflow-hidden rounded-card ring-1 ${palette.glyphRing}`}
      >
        <NoteCardWatermark palette={palette} scope={memory.scope} />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${palette.rail} opacity-55`}
        />
        <ImportanceRail value={memory.importance} palette={palette} />

        <div className="relative z-10 flex h-full min-h-full flex-col gap-4 px-5 pb-5 pl-9 pt-0 lg:px-6 lg:pl-11">
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-b-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.24em] shadow-quiet ${palette.ribbon}`}
            >
              <span aria-hidden className="size-1 rounded-full bg-white/85" />
              {palette.label}
            </span>
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
              {caseNumber}
            </span>
          </div>

          <div className="flex items-start gap-4">
            {pairMembers.length > 0 ? (
              <div className="flex shrink-0 -space-x-3">
                {pairMembers.map((member, idx) => (
                  <span
                    key={member.id}
                    className={`rounded-full border-2 border-white/90 bg-white shadow-quiet ${idx === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"}`}
                  >
                    <Portrait member={member} variant="thumb" />
                  </span>
                ))}
              </div>
            ) : (
              <ScenarioGlyph
                title={scenario?.title ?? memory.scenarioId ?? "S"}
                palette={palette}
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 font-display text-display-sm font-semibold leading-[1.05] tracking-tight text-aura-ink">
                {title}
              </h3>
              {subhead === null ? null : (
                <p className="mt-1 line-clamp-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
                  {subhead}
                </p>
              )}
              <p className="mt-1 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
                Filed {formatNoteTimestamp(memory.createdAt)}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <p className="aura-accent line-clamp-2 text-lead leading-snug text-aura-ink/90">
              {lead}
            </p>
            {tail === "" ? null : (
              <p className="mt-2 line-clamp-2 text-body leading-relaxed text-aura-ink/75">{tail}</p>
            )}
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-aura-hairline pt-3">
            {tagLabels.length === 0 ? (
              <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
                no tags filed
              </span>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {tagLabels.slice(0, 3).map((tag) => (
                  <li
                    key={tag}
                    className="rounded-pill bg-white/70 px-2 py-0.5 ring-1 ring-aura-hairline"
                  >
                    <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-muted">
                      {tag}
                    </span>
                  </li>
                ))}
                {tagLabels.length > 3 ? (
                  <li className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                    +{tagLabels.length - 3}
                  </li>
                ) : null}
              </ul>
            )}
            <span className="flex items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
              <span aria-hidden className={`size-1 rounded-full ${palette.caseDot}`} />
              {pad2(memory.importance)}/05
            </span>
          </div>
        </div>
      </article>
    </motion.li>
  );
}

function ImportanceRail({
  value,
  palette,
  large = false,
}: {
  value: number;
  palette: ScopePalette;
  large?: boolean;
}) {
  const filled = Math.max(1, Math.min(5, value));
  return (
    <div
      aria-label={`Importance ${filled} of 5`}
      title={`Importance ${filled} of 5`}
      className={`pointer-events-none absolute left-3 flex flex-col gap-1 ${large ? "inset-y-9 w-[3px]" : "inset-y-7 w-[2.5px]"}`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const isLit = 5 - i <= filled;
        return (
          <span
            key={i}
            aria-hidden
            className={`flex-1 rounded-full ${isLit ? palette.rail : "bg-aura-hairline"}`}
          />
        );
      })}
    </div>
  );
}

function FiledStamp({ date }: { date: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none inline-flex -rotate-[7deg] flex-col items-center justify-center gap-0.5 rounded-md border-2 border-aura-rose/45 px-3 py-1.5 font-mono font-semibold uppercase tracking-[0.32em] text-aura-rose/65"
    >
      <span className="text-micro leading-none">Filed</span>
      <span className="text-micro leading-none tracking-[0.18em] text-aura-rose/55">
        {formatStampDate(date)}
      </span>
    </span>
  );
}

function formatStampDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  const day = parsed.toLocaleDateString(undefined, { day: "2-digit" });
  const month = parsed.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  return `${day} ${month}`;
}

function NoteCardWatermark({
  palette,
  scope,
  large = false,
}: {
  palette: ScopePalette;
  scope: MemoryRecord["scope"];
  large?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute opacity-[0.07] ${large ? "-bottom-12 -right-10 size-64" : "-bottom-10 -right-8 size-44"}`}
    >
      <svg viewBox="0 0 100 100" className={`size-full ${palette.watermark}`} fill="currentColor">
        {scope === "scenario" ? (
          <path d="M50 8 L60 38 L92 40 L66 60 L74 92 L50 74 L26 92 L34 60 L8 40 L40 38 Z" />
        ) : (
          <path d="M50 86 C22 64 12 48 12 33 C12 22 22 14 32 14 C40 14 47 19 50 26 C53 19 60 14 68 14 C78 14 88 22 88 33 C88 48 78 64 50 86 Z" />
        )}
      </svg>
    </div>
  );
}

function ScenarioGlyph({
  title,
  palette,
  large = false,
}: {
  title: string;
  palette: ScopePalette;
  large?: boolean;
}) {
  const initials =
    title
      .split(/\s+/)
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part.replace(/[^a-zA-Z0-9]/g, "").charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "S";

  return (
    <div
      aria-hidden
      className={`relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br ring-2 ${palette.glyphFill} ${palette.glyphRing} ${large ? "size-28 shadow-quiet" : "size-12"}`}
    >
      <span aria-hidden className="absolute inset-1 rounded-full ring-1 ring-white/60" />
      <span aria-hidden className="absolute inset-2.5 rounded-full ring-1 ring-aura-hairline" />
      <span
        className={`relative font-display font-semibold tracking-tight text-aura-ink/85 ${large ? "text-display-md" : "text-base"}`}
      >
        {initials}
      </span>
    </div>
  );
}

function NotesEmptyTile({
  title,
  subhead,
  action,
}: {
  title: string;
  subhead: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-10 grid place-items-center rounded-card border border-dashed border-aura-hairline bg-white/40 px-6 py-12 text-center">
      <div className="max-w-md space-y-3">
        <Eyebrow>// archive.empty</Eyebrow>
        <h3 className="font-display text-display-md font-semibold tracking-tight text-aura-ink">
          {title}
        </h3>
        <p className="text-label text-aura-muted">{subhead}</p>
        {action === undefined ? null : <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}

function isPlayerVisibleNote(memory: MemoryRecord): boolean {
  if (memory.visibility !== "public") return false;
  return memory.scope === "pair" || memory.scope === "date" || memory.scope === "scenario";
}

const MEMORY_TAG_LABELS: Record<string, string> = {
  date: "date",
  date_summary: "date summary",
  ai_summary: "AI filing",
  fallback_summary: "fallback filing",
  scenario_repeat: "repeat room",
  pair_closure: "closure",
  low: "low risk",
  medium: "medium risk",
  high: "high risk",
};

function visibleMemoryTagLabels(memory: MemoryRecord): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const tag of memory.tags) {
    const label = MEMORY_TAG_LABELS[tag];

    if (label === undefined || seen.has(label)) {
      continue;
    }

    seen.add(label);
    labels.push(label);
  }

  return labels;
}

function playerSafeMemoryText(text: string): string {
  return text
    .replace(/\bFinal Date Health was \d+\.?/giu, "Cupid filed a nonnumeric comfort note.")
    .replace(/\bwith Date Health delta [-+]?\d+\.?/giu, "with a filed comfort movement.")
    .replace(/\bSpark \d+\.?\s*/giu, "")
    .replace(/\bStrain \d+\.?\s*/giu, "")
    .replace(/\bHealth \d+\.?\s*/giu, "");
}

function sortMemoriesNewestFirst(first: MemoryRecord, second: MemoryRecord): number {
  const firstIsClosure = isPairClosureMemory(first);
  const secondIsClosure = isPairClosureMemory(second);
  if (firstIsClosure !== secondIsClosure) {
    return firstIsClosure ? -1 : 1;
  }
  if (first.createdAt === second.createdAt) {
    return second.importance - first.importance;
  }
  return first.createdAt < second.createdAt ? 1 : -1;
}

function noteCardTitle(
  memory: MemoryRecord,
  pairMembers: Member[],
  scenario: DateScenario | undefined,
): string {
  if (memory.scope === "scenario") {
    return scenario?.title ?? memory.scenarioId ?? "Date plan file";
  }
  return (
    joinPairFirstNames(pairMembers.map((member) => member.firstName)) ??
    memory.pairId ??
    "Pair file"
  );
}

function noteCardSubhead(memory: MemoryRecord, scenario: DateScenario | undefined): string | null {
  if (memory.scope === "scenario") {
    return null;
  }
  if (scenario === undefined) {
    return null;
  }
  return scenario.title;
}

function pairLabel(
  pairId: string,
  memberById: Map<string, Member>,
  pairStateById: Map<string, PairState>,
): string {
  const participantIds = pairStateById.get(pairId)?.participantIds ?? [];
  const names = participantIds
    .map((id) => memberById.get(id)?.firstName)
    .filter((name): name is string => name !== undefined);
  return joinPairFirstNames(names) ?? pairId;
}

function joinPairFirstNames(names: readonly string[]): string | null {
  if (names.length >= 2) return `${names[0]} & ${names[1]}`;
  if (names.length === 1) return names[0];
  return null;
}

function formatNoteTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ================================================================== */
/* Shared pieces                                                      */
/* ================================================================== */

export function ViewFrame({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
      className={`mx-auto w-full pb-40 pt-6 ${
        wide ? "max-w-canvas px-0" : "max-w-4xl px-6 lg:px-10"
      }`}
    >
      {children}
    </motion.div>
  );
}

/* ================================================================== */
/* Shift report overlay                                               */
/* ================================================================== */

export function ShiftReportPanel({
  shift,
  members,
  isActionPending,
  onOpenNextShift,
}: {
  shift: ShiftState;
  members: Member[];
  isActionPending: boolean;
  onOpenNextShift: () => void;
}) {
  const report = shift.report;
  if (shift.status !== "completed" || report === undefined) {
    return null;
  }

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/60 backdrop-blur-xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_QUART }}
        className="aura-glass-strong mx-6 w-full max-w-2xl rounded-card p-10"
      >
        <Eyebrow>{`// shift.${pad2(shift.shiftNumber)} closed`}</Eyebrow>
        <h2 className="mt-3 font-display text-display-lg font-semibold tracking-tight text-aura-ink">
          Shift filed
        </h2>
        <p className="mt-3 text-lead text-aura-muted">{report.summary}</p>

        <ul className="mt-8 space-y-3">
          {report.goalResults.map((result) => (
            <li key={result.goalId} className="flex items-baseline justify-between gap-4">
              <span className="font-mono text-label uppercase tracking-[0.18em] text-aura-faint">
                {result.summary}
              </span>
              <span
                className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${
                  result.status === "met" ? "text-emerald-600" : "text-aura-rose"
                }`}
              >
                {result.status}
              </span>
            </li>
          ))}
        </ul>

        {report.budgetReview === undefined ? null : (
          <BudgetReviewBlock review={report.budgetReview} />
        )}

        {report.deckCoverage.length === 0 ? null : (
          <DeckCoverageBlock coverage={report.deckCoverage} members={members} />
        )}

        {report.hrNote === undefined ? null : (
          <div className="mt-8 rounded-card border border-aura-hairline bg-white/45 p-5">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
              // hr.note
            </p>
            <p className="mt-2 text-body text-aura-ink">{report.hrNote}</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-label text-aura-muted">
            {members.length} members on file. Cupid keeps the receipts.
          </p>
          <PrimaryButton disabled={isActionPending} onClick={onOpenNextShift}>
            Open next shift
          </PrimaryButton>
        </div>
      </motion.div>
    </motion.aside>
  );
}

function BudgetReviewBlock({ review }: { review: NonNullable<ShiftReport["budgetReview"]> }) {
  const direction =
    review.newCap > review.previousCap
      ? { tone: "text-emerald-700", arrow: "▲" }
      : review.newCap < review.previousCap
        ? { tone: "text-aura-rose", arrow: "▼" }
        : { tone: "text-aura-faint", arrow: "·" };
  const sortedReasons = [...review.reasons].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return (
    <div className="aura-glass mt-8 rounded-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
          // performance review
        </p>
        <p
          className={`font-mono text-micro font-semibold uppercase tracking-[0.18em] ${direction.tone}`}
        >
          {direction.arrow} new cap {review.newCap} (was {review.previousCap})
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {sortedReasons.map((reason, index) => (
          <li
            key={`${reason.kind}-${index}`}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="text-aura-ink">{reason.label}</span>
            <span
              className={`font-mono text-micro font-semibold uppercase tracking-[0.18em] ${
                reason.delta > 0
                  ? "text-emerald-700"
                  : reason.delta < 0
                    ? "text-aura-rose"
                    : "text-aura-faint"
              }`}
            >
              {reason.delta > 0 ? `+${reason.delta}` : `${reason.delta}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeckCoverageBlock({
  coverage,
  members,
}: {
  coverage: ShiftReport["deckCoverage"];
  members: Member[];
}) {
  const memberById = new Map(members.map((member) => [member.id, member] as const));
  return (
    <div className="aura-glass mt-4 rounded-card p-5">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        // deck coverage
      </p>
      <ul className="mt-3 space-y-2">
        {coverage.map((entry) => {
          const member = memberById.get(entry.focusMemberId);
          const tone =
            entry.status === "served"
              ? "text-emerald-700"
              : entry.status === "missed"
                ? "text-aura-rose"
                : "text-aura-faint";
          return (
            <li
              key={entry.focusMemberId}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="text-aura-ink">{member?.firstName ?? entry.focusMemberId}</span>
              <span className={`font-mono text-micro uppercase tracking-[0.18em] ${tone}`}>
                {entry.status} · {entry.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ================================================================== */
/* Loading                                                            */
/* ================================================================== */

export function DashboardLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-aura-bg text-aura-ink">
      <div className="flex flex-col items-center gap-3">
        <LiveDot />
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          Cupid Operations
        </p>
        <p className="text-body text-aura-muted">Reaching across timelines. One moment.</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

export function buildTranscriptItems(
  session: DateSession,
  members: Member[],
  scenario: DateScenario | undefined,
  streamingDrafts: StreamingDraftMessage[],
  playerKnowledge: PlayerKnowledgeRecord[] = [],
): TranscriptItem[] {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const messageItems: TranscriptItem[] = session.transcript.map((message) => {
    if (message.kind === "character") {
      const member = memberById.get(message.speakerId);
      return {
        id: `turn-${message.sequenceIndex}`,
        order: message.sequenceIndex * 10,
        label: member?.firstName ?? "Member",
        tone: "member",
        text: message.text,
        member,
      };
    }

    return {
      id: `turn-${message.sequenceIndex}`,
      order: message.sequenceIndex * 10,
      ...buildNonCharacterLabel(message, session, members, scenario),
      tone: message.kind,
      text: message.text,
    };
  });
  const lastSequenceByExchange = new Map<number, number>();
  for (const message of session.transcript) {
    if (message.kind !== "character") {
      continue;
    }
    const exchangeIndex = exchangeIndexForTurn(message.turnIndex);
    const previous = lastSequenceByExchange.get(exchangeIndex) ?? 0;
    if (message.sequenceIndex > previous) {
      lastSequenceByExchange.set(exchangeIndex, message.sequenceIndex);
    }
  }
  const judgeItems: TranscriptItem[] = session.judgeSnapshots.map((snapshot) => {
    const reveals = playerKnowledge.filter((record) => record.judgeSnapshotId === snapshot.id);

    return {
      id: `turn-judge-${snapshot.exchangeIndex}`,
      order: (lastSequenceByExchange.get(snapshot.exchangeIndex) ?? 0) * 10 + 5,
      label: "Judge note",
      tone: "judge",
      text: snapshot.playerSummary,
      reveals,
    };
  });
  const committedSequenceIndexes = new Set(
    session.transcript.map((message) => message.sequenceIndex),
  );
  const draftItems: TranscriptItem[] = streamingDrafts
    .filter((draft) => !committedSequenceIndexes.has(draft.sequenceIndex))
    .flatMap((draft) => {
      const member = memberById.get(draft.speakerId);
      const visibleText = visibleStreamingDraftText(session, draft);
      const isStreaming = draft.status === "streaming";

      if (visibleText.trim().length === 0) {
        return [];
      }

      return [
        {
          id: draft.id,
          order: draft.sequenceIndex * 10,
          label: member?.firstName ?? draft.speakerName,
          tone: "member",
          text: visibleText,
          member,
          isDraft: true,
          isStreaming,
        },
      ];
    });

  return [...messageItems, ...draftItems, ...judgeItems].sort(
    (first, second) => first.order - second.order,
  );
}

const STREAMING_ECHO_GUARD_COUNT = 3;
const STREAMING_ECHO_PREFIX_MIN_LENGTH = 8;
const STREAMING_ECHO_JACCARD_THRESHOLD = 0.6;

function visibleStreamingDraftText(session: DateSession, draft: StreamingDraftMessage): string {
  if (draft.status !== "streaming" || draft.text.trim().length === 0) {
    return draft.text;
  }

  const recentLines = collectRecentSpeakerLines(
    session.transcript,
    draft.speakerId,
    STREAMING_ECHO_GUARD_COUNT,
  );

  if (recentLines.some((line) => isStreamingEchoOfRecentLine(draft.text, line))) {
    return "";
  }

  return draft.text;
}

function isStreamingEchoOfRecentLine(draftText: string, recentLine: string): boolean {
  const draft = normalizeStreamingEchoText(draftText);
  const recent = normalizeStreamingEchoText(recentLine);

  if (draft.length === 0 || recent.length === 0) {
    return false;
  }

  if (draft.length >= STREAMING_ECHO_PREFIX_MIN_LENGTH && recent.startsWith(draft)) {
    return true;
  }

  return (
    hasNearDuplicateRecentLine({
      text: draftText,
      recentLines: [recentLine],
      jaccardThreshold: STREAMING_ECHO_JACCARD_THRESHOLD,
    }) !== null
  );
}

function normalizeStreamingEchoText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildNonCharacterLabel(
  message: Extract<DateMessage, { kind: "scenario" | "cupid" | "system" }>,
  session: DateSession,
  members: Member[],
  scenario: DateScenario | undefined,
): { label: string; targetName?: string } {
  if (message.kind === "scenario") {
    return { label: scenario?.title ?? "Date plan" };
  }

  if (message.kind === "cupid") {
    const matchingIntervention = session.interventions.find(
      (intervention) =>
        message.turnIndex === intervention.usedAtTurn &&
        message.text === formatCupidInterventionText(intervention.text),
    );
    const targetId = message.targetMemberId ?? matchingIntervention?.targetMemberId;
    const target =
      targetId === undefined ? undefined : members.find((member) => member.id === targetId);

    return { label: "private nudge", targetName: target?.firstName };
  }

  return { label: "System" };
}

function buildReactionSignals(
  judgeSnapshots: readonly JudgeSnapshot[],
  leftMemberId: string,
  rightMemberId: string,
): ReactionSignal[] {
  const latestJudge = judgeSnapshots.at(-1);

  if (latestJudge === undefined) {
    return [];
  }

  const signals: ReactionSignal[] = [];
  const participants = [
    { memberId: leftMemberId, side: "left" as const },
    { memberId: rightMemberId, side: "right" as const },
  ];
  const dateDelta = latestJudge.dateHealthDelta;
  const sparkDelta = latestJudge.statDeltas.spark ?? 0;
  const chemistryDelta = latestJudge.statDeltas.chemistry ?? 0;
  const trustDelta = latestJudge.statDeltas.trust ?? 0;
  const stabilityDelta = latestJudge.statDeltas.stability ?? 0;
  const relationshipDelta = latestJudge.statDeltas.relationshipHealth ?? 0;
  const strainDelta = latestJudge.statDeltas.strain ?? 0;
  const conflictDelta = latestJudge.statDeltas.conflict ?? 0;
  const textSignal = [latestJudge.playerSummary, ...latestJudge.notableMoments]
    .join(" ")
    .toLowerCase();
  const sharedPositive = Math.max(dateDelta, sparkDelta, chemistryDelta, relationshipDelta);
  const sharedCare = Math.max(trustDelta, stabilityDelta);
  const sharedTrouble = Math.max(-dateDelta, strainDelta, conflictDelta);

  for (const participant of participants) {
    const moodDelta = latestJudge.memberMoodDeltas[participant.memberId] ?? 0;

    if (sharedPositive > 0 || moodDelta > 0) {
      pushReaction(
        signals,
        latestJudge,
        participant.side,
        "spark",
        Math.max(sharedPositive, moodDelta),
      );
    }

    if (sparkDelta >= 3 || chemistryDelta >= 3 || moodDelta >= 3) {
      pushReaction(
        signals,
        latestJudge,
        participant.side,
        "love",
        Math.max(sparkDelta, chemistryDelta, moodDelta),
      );
    }

    if (sharedCare >= 3) {
      pushReaction(signals, latestJudge, participant.side, "love", sharedCare);
    }

    if (
      textSignal.includes("laugh") ||
      textSignal.includes("joke") ||
      textSignal.includes("funny")
    ) {
      pushReaction(signals, latestJudge, participant.side, "laugh", 3);
    }

    if (sharedTrouble >= 4 || latestJudge.shouldEndEarly) {
      pushReaction(signals, latestJudge, participant.side, "anger", sharedTrouble);
    } else if (sharedTrouble > 0) {
      pushReaction(signals, latestJudge, participant.side, "warning", sharedTrouble);
    }

    if (moodDelta <= -3) {
      pushReaction(signals, latestJudge, participant.side, "cry", Math.abs(moodDelta));
    }
  }

  return signals;
}

function buildNudgeSuggestions(judgeSnapshots: readonly JudgeSnapshot[]): string[] {
  const latestJudge = judgeSnapshots.at(-1);
  const baseSuggestions = [
    "Ask one specific follow-up before changing topic.",
    "Move past logistics and name one honest feeling.",
    "Ground the room in a practical choice both people can answer.",
  ];

  if (latestJudge === undefined) {
    return baseSuggestions;
  }

  const strainDelta = latestJudge.statDeltas.strain ?? 0;
  const conflictDelta = latestJudge.statDeltas.conflict ?? 0;
  const sparkDelta = latestJudge.statDeltas.spark ?? 0;
  const trustDelta = latestJudge.statDeltas.trust ?? 0;

  if (latestJudge.shouldEndEarly || strainDelta >= 4 || conflictDelta >= 4) {
    return [
      "Name the boundary and offer a clean exit.",
      "Ask one specific follow-up before changing topic.",
      "Ground the room in a practical choice both people can answer.",
    ];
  }

  if (sparkDelta <= 0 && trustDelta <= 0) {
    return [
      "Ask one specific follow-up before changing topic.",
      "Move past logistics and name one honest feeling.",
      "Let the partner choose the next small plan.",
    ];
  }

  return baseSuggestions;
}

function pushReaction(
  signals: ReactionSignal[],
  judgeSnapshot: JudgeSnapshot,
  side: ReactionSignal["side"],
  kind: ReactionKind,
  value: number,
) {
  const sideCount = signals.filter((signal) => signal.side === side).length;

  if (sideCount >= 4 || signals.some((signal) => signal.side === side && signal.kind === kind)) {
    return;
  }

  signals.push({
    id: `${judgeSnapshot.id}-${side}-${kind}`,
    side,
    kind,
    intensity: reactionIntensity(value),
  });
}

function reactionIntensity(value: number): ReactionIntensity {
  const magnitude = Math.abs(value);

  if (magnitude >= 6) {
    return 3;
  }

  if (magnitude >= 3) {
    return 2;
  }

  return 1;
}
