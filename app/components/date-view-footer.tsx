import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

import type { DateScenario, DateSession, GameSave, Member } from "../domain/game";
import {
  canAddCupidIntervention,
  findScenarioEventById,
  MIN_JUDGE_READS_BEFORE_CUT_SHORT,
  MAX_NUDGES_PER_DATE,
} from "../services/date-engine";
import { useTutorialStep } from "../services/tutorial";
import { tutorialCopy } from "../services/tutorial-copy";
import { EASE_OUT_QUART } from "./dashboard-atoms";
import { StatusGauges } from "./date-view-gauges";
import {
  CutShortConfirmModal,
  CutShortIcon,
  type FileDateModalCopy,
  NudgeComposerModal,
  SceneConfirmModal,
} from "./date-view-modals";
import type { DatePlaybackUiState, PendingDateAction, PlaybackIntent } from "./date-view-shared";
import type { LeadAskStatus } from "./date-view-transcript";
import type { SfxCue } from "./sfx-provider";
import { TutorialCoachMark, TutorialPulseRing, TutorialSpotlight } from "./tutorial";

export function DateFooter({
  session,
  scenario,
  interventionText,
  interventionTargetMemberId,
  participants,
  displayedCurrentTurn,
  canAdvance,
  canIntervene,
  canCutShort,
  pendingDateAction,
  playbackUiState,
  nudgeSuggestions,
  leadAskStatus,
  nudgeComposerOpen,
  sceneConfirmId,
  cutShortConfirmOpen,
  save,
  onTutorialUpdate,
  onNudgeComposerOpenChange,
  onSceneConfirmIdChange,
  onCutShortConfirmOpenChange,
  onInterventionTextChange,
  onInterventionTargetChange,
  onAdvance,
  onCancel,
  onCutShort,
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
  canCutShort: boolean;
  pendingDateAction: PendingDateAction | null;
  playbackUiState: DatePlaybackUiState;
  nudgeSuggestions: string[];
  leadAskStatus: LeadAskStatus | null;
  nudgeComposerOpen: boolean;
  sceneConfirmId: string | null;
  cutShortConfirmOpen: boolean;
  save: GameSave;
  onTutorialUpdate: (next: GameSave) => void;
  onNudgeComposerOpenChange: (open: boolean) => void;
  onSceneConfirmIdChange: (eventId: string | null) => void;
  onCutShortConfirmOpenChange: (open: boolean) => void;
  onInterventionTextChange: (text: string) => void;
  onInterventionTargetChange: (memberId: string) => void;
  onAdvance: (turnCount: 1 | 2) => void;
  onCancel: () => void;
  onCutShort: () => void;
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

  const statusGaugesRef = useRef<HTMLDivElement | null>(null);
  const transportClusterRef = useRef<HTMLDivElement | null>(null);
  const nudgeButtonRef = useRef<HTMLButtonElement | null>(null);
  const cutShortButtonRef = useRef<HTMLButtonElement | null>(null);

  const footerHealthStep = useTutorialStep(save, "date.footer.health", true, onTutorialUpdate);
  const footerTransportStep = useTutorialStep(
    save,
    "date.footer.transport",
    footerHealthStep.done && !isStreaming,
    onTutorialUpdate,
  );
  const nudgeComposeStep = useTutorialStep(
    save,
    "date.nudge.compose",
    nudgeButtonEnabled && nudgesUsed === 0,
    onTutorialUpdate,
  );
  const cutShortStatus = resolveCutShortStatus({
    session,
    isPaused,
    canCutShort,
    playbackBusy,
    pauseRequested,
  });
  const fileDateCopy = resolveFileDateCopy(session);
  const cutShortButtonEnabled = cutShortStatus.enabled;
  const cutShortStep = useTutorialStep(
    save,
    "lazy.cut-short",
    cutShortStatus.kind === "ready",
    onTutorialUpdate,
  );
  const footerHealthCopy = tutorialCopy("date.footer.health");
  const footerTransportCopy = tutorialCopy("date.footer.transport");
  const cutShortCopy = tutorialCopy("lazy.cut-short");

  // Conditions can flip from parent state, so close the composer when it stops being valid.
  useEffect(() => {
    if (nudgeComposerOpen && !nudgeButtonEnabled) {
      onNudgeComposerOpenChange(false);
    }
  }, [nudgeComposerOpen, nudgeButtonEnabled, onNudgeComposerOpenChange]);

  // Same idea for the scene preview: drops can disable or the scene can fire from elsewhere.
  useEffect(() => {
    if (sceneConfirmId === null) return;
    if (!dropsEnabled || session.eventsTriggered.includes(sceneConfirmId)) {
      onSceneConfirmIdChange(null);
    }
  }, [sceneConfirmId, dropsEnabled, session.eventsTriggered, onSceneConfirmIdChange]);

  useEffect(() => {
    if (cutShortConfirmOpen && !cutShortButtonEnabled) {
      onCutShortConfirmOpenChange(false);
    }
  }, [cutShortButtonEnabled, cutShortConfirmOpen, onCutShortConfirmOpenChange]);

  const pendingSceneEvent = useMemo(() => {
    if (sceneConfirmId === null || scenario === undefined) return undefined;
    return findScenarioEventById(scenario, sceneConfirmId);
  }, [sceneConfirmId, scenario]);

  const pendingScenePickIndex = sceneConfirmId === null ? -1 : picks.indexOf(sceneConfirmId);

  const openComposer = () => {
    if (!nudgeButtonEnabled) return;
    onNudgeComposerOpenChange(true);
  };
  const closeComposer = () => onNudgeComposerOpenChange(false);
  const fileNudge = () => {
    onIntervene();
    onNudgeComposerOpenChange(false);
  };

  const openSceneConfirm = (eventId: string) => {
    if (!dropsEnabled) return;
    if (session.eventsTriggered.includes(eventId)) return;
    onSceneConfirmIdChange(eventId);
  };
  const closeSceneConfirm = () => onSceneConfirmIdChange(null);
  const confirmSceneDrop = () => {
    if (sceneConfirmId === null) return;
    onTriggerEvent(sceneConfirmId);
    onSceneConfirmIdChange(null);
  };
  const openCutShortConfirm = () => {
    if (!cutShortButtonEnabled) return;
    onCutShortConfirmOpenChange(true);
  };
  const closeCutShortConfirm = () => onCutShortConfirmOpenChange(false);
  const confirmCutShort = () => {
    if (!cutShortButtonEnabled) return;
    onCutShort();
    onCutShortConfirmOpenChange(false);
  };

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
          <div className="peer aura-liquid-glass pointer-events-auto flex w-full items-stretch gap-3 rounded-pill px-3 py-2.5 text-aura-ink lg:gap-5 lg:px-5 lg:py-3">
            <StatusGauges
              dateHealth={session.dateHealth}
              displayedCurrentTurn={displayedCurrentTurn}
              turnLimit={session.turnLimit}
              judgePasses={session.judgeSnapshots.length}
              nudgesRemaining={nudgesRemaining}
              nudgeButtonEnabled={nudgeButtonEnabled}
              onComposeNudge={() => {
                if (nudgeComposeStep.active) nudgeComposeStep.complete();
                openComposer();
              }}
              picks={picks}
              eventsTriggered={session.eventsTriggered}
              scenario={scenario}
              dropsEnabled={dropsEnabled}
              containerRef={statusGaugesRef}
              nudgeRef={nudgeButtonRef}
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
              cutShortStatus={cutShortStatus}
              pendingDateAction={pendingDateAction}
              containerRef={transportClusterRef}
              cutButtonRef={cutShortButtonRef}
              onAdvance={(count) => {
                if (footerTransportStep.active) footerTransportStep.complete();
                onAdvance(count);
              }}
              onCancel={onCancel}
              onCutShort={() => {
                if (cutShortStep.active) cutShortStep.complete();
                openCutShortConfirm();
              }}
              onTogglePlayback={() => {
                if (footerTransportStep.active) footerTransportStep.complete();
                togglePlayback();
              }}
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-full mb-2 flex translate-y-1 justify-center opacity-0 transition duration-200 ease-out peer-hover:translate-y-0 peer-hover:opacity-100 peer-focus-within:translate-y-0 peer-focus-within:opacity-100">
            <DirectorSlate
              isPaused={isPaused}
              pauseRequested={pauseRequested}
              interventionSlotAvailable={interventionSlotAvailable}
              dropsEnabled={dropsEnabled}
              cutShortStatus={cutShortStatus}
              leadAskStatus={leadAskStatus}
              pendingDateAction={pendingDateAction}
            />
          </div>
        </div>
      </motion.footer>
      <AnimatePresence>
        {nudgeComposerOpen ? (
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
        {cutShortConfirmOpen ? (
          <CutShortConfirmModal
            key="cut-short-confirm-modal"
            participants={participants}
            copy={fileDateCopy}
            canCutShort={cutShortButtonEnabled}
            onConfirm={confirmCutShort}
            onClose={closeCutShortConfirm}
          />
        ) : null}
      </AnimatePresence>

      {footerHealthStep.active ? (
        <>
          <TutorialSpotlight target={statusGaugesRef} />
          <TutorialCoachMark
            target={statusGaugesRef}
            placement="top"
            title={footerHealthCopy.title}
            body={footerHealthCopy.body}
            stepIndex={footerHealthCopy.stepIndex}
            stepCount={footerHealthCopy.stepCount}
            primaryLabel={footerHealthCopy.primaryLabel}
            onPrimary={footerHealthStep.complete}
            dismissLabel="Skip tour"
            onDismiss={footerHealthStep.dismiss}
            textTone="dark"
          />
        </>
      ) : null}

      {!footerHealthStep.active && footerTransportStep.active ? (
        <>
          <TutorialPulseRing target={transportClusterRef} padding={6} radius={22} />
          <TutorialCoachMark
            target={transportClusterRef}
            placement="top"
            title={footerTransportCopy.title}
            body={footerTransportCopy.body}
            stepIndex={footerTransportCopy.stepIndex}
            stepCount={footerTransportCopy.stepCount}
            dismissLabel="Skip tour"
            onDismiss={footerTransportStep.dismiss}
            textTone="dark"
          />
        </>
      ) : null}

      {!footerHealthStep.active && !footerTransportStep.active && nudgeComposeStep.active ? (
        <>
          <TutorialPulseRing target={nudgeButtonRef} padding={6} radius={18} />
          <TutorialCoachMark
            target={nudgeButtonRef}
            placement="top"
            title="One nudge, one whisper"
            body="Pause, pick one member, write one sentence. Steer them somewhere or pull a thread you want exposed. They hear it as a private prod from the room. Spend all three and Cupid starts making eye contact."
            primaryLabel="Open composer"
            onPrimary={() => {
              nudgeComposeStep.complete();
              openComposer();
            }}
            dismissLabel="Skip tour"
            onDismiss={nudgeComposeStep.dismiss}
            textTone="dark"
          />
        </>
      ) : null}

      {!footerHealthStep.active &&
      !footerTransportStep.active &&
      !nudgeComposeStep.active &&
      cutShortStep.active ? (
        <>
          <TutorialPulseRing target={cutShortButtonRef} padding={6} radius={18} tone="amber" />
          <TutorialCoachMark
            target={cutShortButtonRef}
            placement="top"
            title={cutShortCopy.title}
            body={cutShortCopy.body}
            primaryLabel={cutShortCopy.primaryLabel}
            onPrimary={cutShortStep.complete}
            dismissLabel="Skip tour"
            onDismiss={cutShortStep.dismiss}
            textTone="dark"
          />
        </>
      ) : null}
    </>
  );
}

type CutShortStatusKind = "busy" | "locked" | "needs-pause" | "ready";

type CutShortStatus = {
  kind: CutShortStatusKind;
  enabled: boolean;
  buttonAriaLabel: string;
  chipProgress?: string;
};

function resolveCutShortStatus({
  session,
  isPaused,
  canCutShort,
  playbackBusy,
  pauseRequested,
}: {
  session: DateSession;
  isPaused: boolean;
  canCutShort: boolean;
  playbackBusy: boolean;
  pauseRequested: boolean;
}): CutShortStatus {
  const filedReads = session.judgeSnapshots.length;
  const requiredReads = MIN_JUDGE_READS_BEFORE_CUT_SHORT;
  const readProgress = `${Math.min(filedReads, requiredReads)}/${requiredReads}`;
  const readGateMet = session.status === "active" && filedReads >= requiredReads;

  if (!readGateMet) {
    return {
      kind: "locked",
      enabled: false,
      buttonAriaLabel: `File date locked. File date unlocks after ${requiredReads} Cupid reads. Filed so far: ${readProgress}.`,
      chipProgress: readProgress,
    };
  }

  if (playbackBusy || pauseRequested) {
    return {
      kind: "busy",
      enabled: false,
      buttonAriaLabel: "File date waits for the current beat to finish.",
    };
  }

  if (!isPaused) {
    return {
      kind: "needs-pause",
      enabled: false,
      buttonAriaLabel: "Pause the date before filing it.",
    };
  }

  if (!canCutShort) {
    return {
      kind: "busy",
      enabled: false,
      buttonAriaLabel: "File date waits for the current beat to finish.",
    };
  }

  return {
    kind: "ready",
    enabled: true,
    buttonAriaLabel: `${resolveFileDateCopy(session).ctaLabel}. Cupid files one final read and sends both members to cooldown.`,
  };
}

function resolveFileDateCopy(session: DateSession): FileDateModalCopy {
  const latestJudge = session.judgeSnapshots.at(-1);
  const strainDelta = latestJudge?.statDeltas.strain ?? 0;
  const conflictDelta = latestJudge?.statDeltas.conflict ?? 0;
  const sparkDelta = latestJudge?.statDeltas.spark ?? 0;
  const chemistryDelta = latestJudge?.statDeltas.chemistry ?? 0;
  const trustDelta = latestJudge?.statDeltas.trust ?? 0;
  const dateDelta = latestJudge?.dateHealthDelta ?? 0;
  const trouble =
    latestJudge?.shouldEndEarly === true ||
    dateDelta <= -4 ||
    strainDelta >= 4 ||
    conflictDelta >= 4;
  const warm = dateDelta >= 4 || sparkDelta >= 3 || chemistryDelta >= 3 || trustDelta >= 3;

  if (trouble) {
    return {
      title: "File protected exit",
      body: "Cupid files one final read while the room is still legible.",
      consequence:
        "A protected exit can soften a bad room. If the transcript already crossed a line, Cupid still lets the final read name it.",
      ctaLabel: "File exit",
    };
  }

  if (warm) {
    return {
      title: "File promising read",
      body: "Cupid files one final read before a warm thread gets overworked.",
      consequence:
        "A clean early filing can preserve momentum. If someone feels interrupted, the final read will say so.",
      ctaLabel: "File promise",
    };
  }

  return {
    title: "File the date",
    body: "Cupid files one final read from the evidence on screen.",
    consequence:
      "A protected exit can soften a bad room. An interrupted warm room can still sting. Cupid lets the final read decide which filing cabinet gets louder.",
    ctaLabel: "File date",
  };
}

function DirectorSlate({
  isPaused,
  pauseRequested,
  interventionSlotAvailable,
  dropsEnabled,
  cutShortStatus,
  leadAskStatus,
  pendingDateAction,
}: {
  isPaused: boolean;
  pauseRequested: boolean;
  interventionSlotAvailable: boolean;
  dropsEnabled: boolean;
  cutShortStatus: CutShortStatus;
  leadAskStatus: LeadAskStatus | null;
  pendingDateAction: PendingDateAction | null;
}) {
  if (pauseRequested) {
    return (
      <div
        role="status"
        aria-label="Pause filed. Finishing this beat."
        className="aura-liquid-glass aura-liquid-glass-amber inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5"
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
        className="aura-liquid-glass aura-liquid-glass-rose inline-flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-2.5 rounded-pill px-3.5 py-1.5 lg:max-w-3xl"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="aura-pulse size-1.5 rounded-full bg-aura-rose" />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
            Held
          </span>
        </span>
        <span aria-hidden className="h-3 w-px bg-aura-rose/30" />
        {leadAskStatus !== null ? (
          <>
            <LeadAskSlateChip status={leadAskStatus} />
            <span aria-hidden className="h-3 w-px bg-aura-rose/30" />
          </>
        ) : null}
        <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
          <SlateActionChip kind="whisper" enabled={interventionSlotAvailable} label="Whisper" />
          <SlateActionChip kind="scene" enabled={dropsEnabled} label="Drop scene" />
          <SlateActionChip
            kind="cut"
            enabled={cutShortStatus.enabled}
            label="File date"
            progress={cutShortStatus.chipProgress}
          />
          <SlateActionChip kind="advance" enabled label="Advance beat" />
        </span>
      </div>
    );
  }

  const rollingCopy =
    pendingDateAction === "advanceExchange"
      ? "Date in motion · pause to direct"
      : "Autoplay rolling · pauses at reads";

  return (
    <div
      role="status"
      aria-label={rollingCopy}
      className="aura-liquid-glass aura-liquid-glass-violet inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5"
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

function LeadAskSlateChip({ status }: { status: LeadAskStatus }) {
  const tone =
    status.kind === "covered"
      ? "border-aura-emerald/35 bg-aura-emerald/10 text-aura-emerald"
      : status.kind === "raised"
        ? "border-aura-amber/45 bg-aura-amber/10 text-aura-amber"
        : status.kind === "drifting"
          ? "border-aura-rose/35 bg-aura-rose/10 text-aura-rose"
          : "border-aura-violet/35 bg-aura-violet/10 text-aura-violet";

  return (
    <span
      title={status.detail}
      className={`inline-flex max-w-[22rem] items-center gap-1.5 truncate rounded-pill border px-2 py-0.5 font-mono text-label font-semibold uppercase tracking-[0.16em] ${tone}`}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      <span className="truncate">{status.label}</span>
    </span>
  );
}

function SlateActionChip({
  kind,
  enabled,
  label,
  progress,
}: {
  kind: "whisper" | "scene" | "advance" | "cut";
  enabled: boolean;
  label: string;
  progress?: string;
}) {
  const tone = !enabled
    ? "border-aura-hairline-strong/50 bg-white/40 text-aura-faint"
    : kind === "whisper"
      ? "border-aura-rose/35 bg-aura-rose/10 text-aura-rose"
      : kind === "cut"
        ? "border-aura-amber/40 bg-aura-amber/10 text-aura-amber"
        : "border-aura-violet/35 bg-aura-violet/10 text-aura-violet";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] ${tone}`}
    >
      <SlateChipIcon kind={kind} />
      <span>{label}</span>
      {progress ? <span className="opacity-70">{progress}</span> : null}
    </span>
  );
}

function SlateChipIcon({ kind }: { kind: "whisper" | "scene" | "advance" | "cut" }) {
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
  if (kind === "cut") {
    return (
      <svg viewBox="0 0 12 12" aria-hidden className="size-2.5">
        <path
          d="M2 6.2 L7.7 1.8 M2.4 2.4 L9.6 9.6 M4.3 10.2 L10 5.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
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

function TransportCluster({
  isPlaying,
  isPaused,
  isStreaming,
  pauseRequested,
  playbackBusy,
  canAdvance,
  cutShortStatus,
  pendingDateAction,
  containerRef,
  cutButtonRef,
  onAdvance,
  onCancel,
  onCutShort,
  onTogglePlayback,
}: {
  isPlaying: boolean;
  isPaused: boolean;
  isStreaming: boolean;
  pauseRequested: boolean;
  playbackBusy: boolean;
  canAdvance: boolean;
  cutShortStatus: CutShortStatus;
  pendingDateAction: PendingDateAction | null;
  containerRef?: React.Ref<HTMLDivElement>;
  cutButtonRef?: React.Ref<HTMLButtonElement>;
  onAdvance: (turnCount: 1 | 2) => void;
  onCancel: () => void;
  onCutShort: () => void;
  onTogglePlayback: () => void;
}) {
  const advanceTip =
    pendingDateAction === "advanceExchange" ? "Streaming next beat..." : "Advance one beat";
  const cutShortBusy = pendingDateAction === "cutShort";
  const playTip = pauseRequested
    ? "Pause filed"
    : isPlaying
      ? "Pause autoplay (space)"
      : "Start autoplay (space)";
  return (
    <div ref={containerRef} className="flex shrink-0 items-center gap-1.5">
      {isPaused && !pauseRequested ? (
        <>
          <TransportButton
            kind="cut"
            disabled={!cutShortStatus.enabled || cutShortBusy}
            onClick={onCutShort}
            ariaLabel={cutShortStatus.buttonAriaLabel}
            buttonRef={cutButtonRef}
          >
            <CutShortIcon />
          </TransportButton>
          <TransportButton
            kind="ghost"
            disabled={!canAdvance}
            onClick={() => onAdvance(2)}
            ariaLabel={advanceTip}
          >
            <AdvanceIcon />
          </TransportButton>
        </>
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

type TransportButtonKind = "cut" | "ghost" | "ghost-active" | "primary" | "stop";

const TRANSPORT_BUTTON_TONE: Record<TransportButtonKind, string> = {
  primary:
    "aura-cta bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet text-white shadow-cta ring-1 ring-white/40 ring-inset hover:-translate-y-px hover:shadow-cta-hover",
  "ghost-active": "bg-white/85 text-aura-violet ring-1 ring-aura-violet/40 hover:bg-white",
  cut: "bg-aura-amber/12 text-aura-amber ring-1 ring-aura-amber/40 hover:bg-aura-amber hover:text-white",
  stop: "bg-aura-rose/15 text-aura-rose ring-1 ring-aura-rose/40 hover:bg-aura-rose hover:text-white",
  ghost: "text-aura-muted ring-1 ring-aura-hairline hover:bg-white/55 hover:text-aura-ink",
};

const TRANSPORT_BUTTON_SFX: Record<TransportButtonKind, SfxCue> = {
  primary: "primary",
  cut: "dismiss",
  stop: "dismiss",
  ghost: "click",
  "ghost-active": "click",
};

function TransportButton({
  kind,
  children,
  onClick,
  disabled,
  ariaLabel,
  buttonRef,
}: {
  kind: TransportButtonKind;
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  const baseClass =
    "relative grid size-10 cursor-pointer place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40";
  const toneClass = TRANSPORT_BUTTON_TONE[kind];
  const sfxCue = TRANSPORT_BUTTON_SFX[kind];
  return (
    <button
      ref={buttonRef}
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
