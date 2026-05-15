import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { DateScenario, DateSession, GameSave, Member } from "../domain/game";
import {
  canAddCupidIntervention,
  findScenarioEventById,
  MAX_NUDGES_PER_DATE,
} from "../services/date-engine";
import { useTutorialStep } from "../services/tutorial";
import { EASE_OUT_QUART } from "./dashboard-atoms";
import { StatusGauges } from "./date-view-gauges";
import { NudgeComposerModal, SceneConfirmModal } from "./date-view-modals";
import type { DatePlaybackUiState, PendingDateAction, PlaybackIntent } from "./date-view-shared";
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
  pendingDateAction,
  playbackUiState,
  nudgeSuggestions,
  save,
  onTutorialUpdate,
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
  save: GameSave;
  onTutorialUpdate: (next: GameSave) => void;
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

  const statusGaugesRef = useRef<HTMLDivElement | null>(null);
  const transportClusterRef = useRef<HTMLDivElement | null>(null);
  const nudgeButtonRef = useRef<HTMLButtonElement | null>(null);

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

  // Conditions can flip from parent state, so close the composer when it stops being valid.
  useEffect(() => {
    if (composerOpen && !nudgeButtonEnabled) {
      setComposerOpen(false);
    }
  }, [composerOpen, nudgeButtonEnabled]);

  // Same idea for the scene preview: drops can disable or the scene can fire from elsewhere.
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
              pendingDateAction={pendingDateAction}
              containerRef={transportClusterRef}
              onAdvance={(count) => {
                if (footerTransportStep.active) footerTransportStep.complete();
                onAdvance(count);
              }}
              onCancel={onCancel}
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

      {footerHealthStep.active ? (
        <>
          <TutorialSpotlight target={statusGaugesRef} />
          <TutorialCoachMark
            target={statusGaugesRef}
            placement="top"
            title="Health, Turn, Judge, Nudges"
            body="Health is the date. Turn counts toward the wrap. Judge fires every sixth. Nudges are your three whispers. Scenes appear once you draft them."
            stepIndex={0}
            stepCount={2}
            primaryLabel="Got it"
            onPrimary={footerHealthStep.complete}
            dismissLabel="Skip tour"
            onDismiss={footerHealthStep.dismiss}
          />
        </>
      ) : null}

      {!footerHealthStep.active && footerTransportStep.active ? (
        <>
          <TutorialPulseRing target={transportClusterRef} padding={6} radius={22} />
          <TutorialCoachMark
            target={transportClusterRef}
            placement="top"
            title="Run the date"
            body="Tap play for autoplay, or advance one beat at a time. Pause whenever you want to whisper a nudge or drop a scene. Space toggles play."
            stepIndex={1}
            stepCount={2}
            dismissLabel="Skip tour"
            onDismiss={footerTransportStep.dismiss}
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
            body="Pause the date, pick one member, write one sentence. They hear it as a private prod from the room. Use all three and Cupid starts making eye contact."
            primaryLabel="Open composer"
            onPrimary={() => {
              nudgeComposeStep.complete();
              openComposer();
            }}
            dismissLabel="Skip tour"
            onDismiss={nudgeComposeStep.dismiss}
          />
        </>
      ) : null}
    </>
  );
}

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

function TransportCluster({
  isPlaying,
  isPaused,
  isStreaming,
  pauseRequested,
  playbackBusy,
  canAdvance,
  pendingDateAction,
  containerRef,
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
  containerRef?: React.Ref<HTMLDivElement>;
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
    <div ref={containerRef} className="flex shrink-0 items-center gap-1.5">
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
