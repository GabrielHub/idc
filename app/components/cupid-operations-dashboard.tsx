import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type DateScenario,
  type FollowUpAction,
  type GameSave,
  type Member,
  type MemberRequest,
  type PairState,
  type ShiftState,
} from "../domain/game";
import { companyGoals, memberRequests, starterScenarios } from "../fixtures";
import {
  createBrowserStorageDriver,
  LocalGameRepository,
} from "../repositories/local-game-repository";
import {
  addCupidIntervention,
  applyFollowUpAction,
  completeShift,
  startDateSession,
  startNextShift,
} from "../services/date-engine";
import { getActiveShift, makePairId } from "../services/game-seed";
import { evaluateMatchFit, type MatchFitPublicSignal } from "../services/match-fit";
import {
  gameApiErrorSchema,
  gameStreamEventSchema,
  localAiStatusResponseSchema,
  type GameAction,
  type GameActionResponse,
  type GameStreamEvent,
  type LocalAiStatusResponse,
} from "../services/game-api-contracts";
import { ChromeButton, GhostButton, LiveDot } from "./dashboard-atoms";
import {
  BriefView,
  DashboardLoading,
  DateView,
  RosterView,
  ShiftReportPanel,
  type StreamingDraftMessage,
  pad2,
} from "./dashboard-views";
import { useSfx } from "./sfx-provider";

type ViewKey = "roster" | "brief" | "date";

const GAME_API_TIMEOUT_MS = 120_000;
const LOCAL_AI_STATUS_URL = "/api/game?intent=local-ai-status";
const GAME_API_STREAM_URL = "/api/game?intent=stream";

type LocalAiClientStatus = {
  status: "checking" | LocalAiStatusResponse["status"];
  message: string;
  details: string[];
  checkedAt?: string;
};

const CHECKING_LOCAL_AI_STATUS: LocalAiClientStatus = {
  status: "checking",
  message: "Checking local AI. Cupid is holding the clipboard very still.",
  details: [],
};

type CupidOperationsDashboardProps = {
  onPunchOut: () => void;
};

export function CupidOperationsDashboard({ onPunchOut }: CupidOperationsDashboardProps) {
  const repository = useMemo(() => new LocalGameRepository(createBrowserStorageDriver()), []);
  const { play } = useSfx();
  const [save, setSave] = useState<GameSave | null>(null);
  const [view, setView] = useState<ViewKey>("roster");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [activeDateSessionId, setActiveDateSessionId] = useState<string | null>(null);
  const [interventionText, setInterventionText] = useState("");
  const [localAiStatus, setLocalAiStatus] = useState<LocalAiClientStatus>(CHECKING_LOCAL_AI_STATUS);
  const [isActionPending, setIsActionPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamingDrafts, setStreamingDrafts] = useState<StreamingDraftMessage[]>([]);
  const lastErrorMessageRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSave() {
      let recoveredOutdatedSave = false;
      let existingSave: GameSave | null = null;

      try {
        existingSave = await repository.loadGame();
      } catch {
        recoveredOutdatedSave = true;
      }

      const nextSave = existingSave ?? (await repository.resetGame());

      if (!isMounted) {
        return;
      }

      setSave(nextSave);
      if (recoveredOutdatedSave) {
        setErrorMessage(
          "Cupid reset an outdated local save. The previous file failed schema review.",
        );
      }
      const restoredSession =
        nextSave.dateSessions.find((session) => session.status === "active") ??
        nextSave.dateSessions.at(-1) ??
        null;
      setSelectedScenarioId(getActiveShift(nextSave).drawnScenarioIds[0] ?? "");
      setSelectedMemberIds(defaultMemberSelection(nextSave));
      setActiveDateSessionId(restoredSession?.id ?? null);
      if (restoredSession !== null && restoredSession.status === "active") {
        setView("date");
      }
    }

    void loadSave();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  useEffect(() => {
    let isMounted = true;

    async function loadLocalAiStatus() {
      setLocalAiStatus(CHECKING_LOCAL_AI_STATUS);
      const status = await requestLocalAiStatus();

      if (!isMounted) {
        return;
      }

      setLocalAiStatus(status);

      if (status.status === "unavailable") {
        setErrorMessage(status.message);
      }
    }

    void loadLocalAiStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (errorMessage === null) {
      lastErrorMessageRef.current = null;
      return;
    }

    if (lastErrorMessageRef.current === errorMessage) {
      return;
    }

    lastErrorMessageRef.current = errorMessage;
    play("alert");
  }, [errorMessage, play]);

  const activeShift = save === null ? null : getActiveShift(save);
  const featuredMembers = useMemo(
    () =>
      save === null || activeShift === null
        ? []
        : activeShift.featuredMemberIds
            .map((memberId) => save.members.find((member) => member.id === memberId))
            .filter(isDefined),
    [activeShift, save],
  );
  const drawnScenarios = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.drawnScenarioIds
            .map((scenarioId) => starterScenarios.find((scenario) => scenario.id === scenarioId))
            .filter(isDefined),
    [activeShift],
  );
  const pinnedGoals = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.companyGoalIds
            .map((goalId) => companyGoals.find((goal) => goal.id === goalId))
            .filter(isDefined),
    [activeShift],
  );
  const pinnedRequests = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.memberRequestIds
            .map((requestId) => memberRequests.find((request) => request.id === requestId))
            .filter(isDefined),
    [activeShift],
  );
  const selectedMembers = useMemo(
    () =>
      save === null
        ? []
        : selectedMemberIds
            .map((memberId) => save.members.find((member) => member.id === memberId))
            .filter(isDefined),
    [save, selectedMemberIds],
  );
  const selectedScenario = useMemo(
    () => drawnScenarios.find((scenario) => scenario.id === selectedScenarioId),
    [drawnScenarios, selectedScenarioId],
  );
  const activeSession = useMemo(
    () =>
      save === null || activeDateSessionId === null
        ? null
        : (save.dateSessions.find((session) => session.id === activeDateSessionId) ?? null),
    [save, activeDateSessionId],
  );
  const pairPreview = useMemo(
    () => buildPairPreview(save, selectedMembers, selectedScenario, pinnedRequests),
    [save, selectedMembers, selectedScenario, pinnedRequests],
  );

  async function persist(nextSave: GameSave) {
    await repository.saveGame(nextSave);
    setSave(nextSave);
  }

  function selectFocusMember(memberId: string) {
    setSelectedMemberIds((current) => {
      const partnerMemberId = current[1] === memberId ? undefined : current[1];
      return [memberId, partnerMemberId].filter(isDefined);
    });
  }

  function selectPartnerMember(memberId: string) {
    setSelectedMemberIds((current) => {
      const focusMemberId = current[0];

      if (focusMemberId === undefined || focusMemberId === memberId) {
        return current;
      }

      return [focusMemberId, memberId];
    });
  }

  async function refreshLocalAiStatus(): Promise<LocalAiClientStatus> {
    setLocalAiStatus(CHECKING_LOCAL_AI_STATUS);
    const status = await requestLocalAiStatus();
    setLocalAiStatus(status);

    if (status.status === "unavailable") {
      setErrorMessage(status.message);
    }

    return status;
  }

  async function handleStartDate() {
    if (save === null || selectedMembers.length !== 2 || selectedScenario === undefined) {
      return;
    }

    tryAction(async () => {
      const status = await refreshLocalAiStatus();

      if (status.status !== "ready") {
        throw new Error(status.message);
      }

      const result = startDateSession(save, {
        focusMemberId: selectedMembers[0].id,
        firstMemberId: selectedMembers[0].id,
        secondMemberId: selectedMembers[1].id,
        scenarioId: selectedScenario.id,
      });
      await persist(result.save);
      setActiveDateSessionId(result.session.id);
      setInterventionText("");
      setView("date");
    });
  }

  async function handleAdvanceExchange() {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction(async () => {
      setStreamingDrafts([]);
      try {
        const result = await runGameApiStreamAction(
          {
            type: "advanceExchange",
            save,
            dateSessionId: activeSession.id,
          },
          applyGameStreamEvent,
        );
        await persist(result.save);
        setActiveDateSessionId(result.session.id);
        setRuntimeWarnings(result);
      } finally {
        setStreamingDrafts([]);
      }
    });
  }

  async function handleCompleteDate() {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction(async () => {
      setStreamingDrafts([]);
      try {
        const result = await runGameApiStreamAction(
          {
            type: "completeDate",
            save,
            dateSessionId: activeSession.id,
          },
          applyGameStreamEvent,
        );
        await persist(result.save);
        setActiveDateSessionId(result.session.id);
        setRuntimeWarnings(result);
      } finally {
        setStreamingDrafts([]);
      }
    });
  }

  async function handleIntervention() {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction(async () => {
      const result = addCupidIntervention(save, {
        dateSessionId: activeSession.id,
        text: interventionText,
      });
      await persist(result.save);
      setInterventionText("");
    });
  }

  async function handleFollowUp(action: FollowUpAction) {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction(async () => {
      const result = applyFollowUpAction(save, {
        dateSessionId: activeSession.id,
        action,
      });
      await persist(result.save);
    });
  }

  async function handleEndShift() {
    if (save === null) {
      return;
    }

    tryAction(async () => {
      const result = completeShift(save);
      await persist(result.save);
    });
  }

  async function handleReset() {
    tryAction(async () => {
      const nextSave = await repository.resetGame();
      setSave(nextSave);
      setSelectedMemberIds(defaultMemberSelection(nextSave));
      setSelectedScenarioId(getActiveShift(nextSave).drawnScenarioIds[0] ?? "");
      setActiveDateSessionId(null);
      setInterventionText("");
      setStreamingDrafts([]);
      setView("roster");
    });
  }

  async function handleOpenNextShift() {
    if (save === null) {
      return;
    }

    tryAction(async () => {
      const result = startNextShift(save);
      await persist(result.save);
      setSelectedMemberIds(defaultMemberSelection(result.save));
      setSelectedScenarioId(result.shift.drawnScenarioIds[0] ?? "");
      setActiveDateSessionId(null);
      setInterventionText("");
      setStreamingDrafts([]);
      setView("roster");
    });
  }

  function applyGameStreamEvent(event: GameStreamEvent) {
    if (event.type === "characterStart") {
      play("message");
      setStreamingDrafts((current) => {
        const existingDraft = current.find((draft) => draft.sequenceIndex === event.sequenceIndex);

        if (existingDraft !== undefined) {
          return current;
        }

        return [
          ...current,
          {
            id: `stream-${event.sequenceIndex}`,
            speakerId: event.speakerId,
            speakerName: event.speakerName,
            sequenceIndex: event.sequenceIndex,
            turnIndex: event.turnIndex,
            text: "",
            status: "streaming",
          },
        ];
      });
      return;
    }

    if (event.type === "characterDelta") {
      setStreamingDrafts((current) =>
        current.map((draft) =>
          draft.sequenceIndex === event.sequenceIndex
            ? {
                ...draft,
                text: `${draft.text}${event.textDelta}`,
              }
            : draft,
        ),
      );
      return;
    }

    if (event.type === "characterDone") {
      setStreamingDrafts((current) =>
        current.map((draft) =>
          draft.sequenceIndex === event.sequenceIndex
            ? {
                ...draft,
                text: event.text,
                status: "done",
              }
            : draft,
        ),
      );
    }
  }

  function setRuntimeWarnings(result: GameActionResponse) {
    if (result.warningMessages.length === 0) {
      return;
    }

    setErrorMessage(result.warningMessages.slice(0, 3).join(" "));
  }

  async function tryAction(action: () => Promise<void>) {
    if (isActionPending) {
      return;
    }

    try {
      setIsActionPending(true);
      setErrorMessage(null);
      await action();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Cupid could not file that action.");
    } finally {
      setIsActionPending(false);
    }
  }

  if (save === null || activeShift === null) {
    return <DashboardLoading />;
  }

  const dateSlotsRemaining = Math.max(0, activeShift.dateSlotsTotal - activeShift.dateSlotsUsed);
  const canStartDate =
    activeShift.status === "active" &&
    !isActionPending &&
    dateSlotsRemaining > 0 &&
    (activeSession === null || activeSession.status !== "active") &&
    selectedMembers.length === 2 &&
    selectedScenario !== undefined &&
    localAiStatus.status === "ready";
  const canAdvanceDate =
    activeSession !== null && activeSession.status === "active" && !isActionPending;
  const canIntervene =
    canAdvanceDate &&
    activeSession?.intervention === undefined &&
    interventionText.trim().length > 0;
  const dateAvailable = activeSession !== null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-aura-bg text-aura-ink">
      <AmbientMesh />

      <DashboardChrome
        activeShift={activeShift}
        featuredMemberCount={featuredMembers.length}
        localAiStatus={localAiStatus}
        view={view}
        dateAvailable={dateAvailable}
        isActionPending={isActionPending}
        onSelectView={setView}
        onRetryLocalAi={refreshLocalAiStatus}
        onEndShift={handleEndShift}
        onReset={handleReset}
        onPunchOut={onPunchOut}
      />

      <main className="relative z-10 pt-24 lg:pt-28">
        {errorMessage === null ? null : (
          <ErrorNotice message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        )}

        <AnimatePresence mode="wait">
          {view === "roster" ? (
            <RosterView
              key="roster"
              members={save.members}
              featuredMembers={featuredMembers}
              featuredRequests={pinnedRequests}
              selectedMemberIds={selectedMemberIds}
              disabled={isActionPending}
              onSelectFocusMember={selectFocusMember}
              onSelectPartnerMember={selectPartnerMember}
              onContinue={() => setView("brief")}
            />
          ) : view === "brief" ? (
            <BriefView
              key="brief"
              shift={activeShift}
              selectedMembers={selectedMembers}
              scenarios={drawnScenarios}
              selectedScenario={selectedScenario}
              pairState={pairPreview?.pairState ?? null}
              pairNote={pairPreview?.note ?? null}
              fitSignal={pairPreview?.fitSignal ?? null}
              goals={pinnedGoals}
              requests={pinnedRequests}
              members={save.members}
              shiftReport={activeShift.report}
              canStart={canStartDate}
              localAiStatus={localAiStatus}
              isActionPending={isActionPending}
              onSelectScenario={setSelectedScenarioId}
              onStart={handleStartDate}
              onRetryLocalAi={refreshLocalAiStatus}
              onBack={() => setView("roster")}
            />
          ) : activeSession !== null ? (
            <DateView
              key="date"
              session={activeSession}
              scenario={
                drawnScenarios.find((scenario) => scenario.id === activeSession.scenarioId) ??
                starterScenarios.find((scenario) => scenario.id === activeSession.scenarioId)
              }
              members={save.members}
              interventionText={interventionText}
              canAdvance={canAdvanceDate}
              canIntervene={canIntervene}
              isActionPending={isActionPending}
              streamingDrafts={streamingDrafts}
              onInterventionTextChange={setInterventionText}
              onAdvance={handleAdvanceExchange}
              onComplete={handleCompleteDate}
              onIntervene={handleIntervention}
              onFollowUp={handleFollowUp}
              onBack={() => setView("brief")}
            />
          ) : (
            <DateEmpty key="date-empty" onBack={() => setView("brief")} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeShift.status === "completed" && activeShift.report !== undefined ? (
            <ShiftReportPanel
              key="shift-report"
              shift={activeShift}
              members={save.members}
              isActionPending={isActionPending}
              onOpenNextShift={handleOpenNextShift}
            />
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ================================================================== */
/* Chrome                                                             */
/* ================================================================== */

function DashboardChrome({
  activeShift,
  featuredMemberCount,
  localAiStatus,
  view,
  dateAvailable,
  isActionPending,
  onSelectView,
  onRetryLocalAi,
  onEndShift,
  onReset,
  onPunchOut,
}: {
  activeShift: ShiftState;
  featuredMemberCount: number;
  localAiStatus: LocalAiClientStatus;
  view: ViewKey;
  dateAvailable: boolean;
  isActionPending: boolean;
  onSelectView: (view: ViewKey) => void;
  onRetryLocalAi: () => void;
  onEndShift: () => void;
  onReset: () => void;
  onPunchOut: () => void;
}) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="flex w-full items-center justify-between gap-2 px-4 pt-4 lg:px-6 lg:pt-5 xl:gap-3 xl:px-8 xl:pt-6">
        <BrandPill
          shiftNumber={activeShift.shiftNumber}
          localAiStatus={localAiStatus}
          isActionPending={isActionPending}
          onRetryLocalAi={onRetryLocalAi}
        />

        <ViewTabs
          view={view}
          memberCount={featuredMemberCount}
          dateAvailable={dateAvailable}
          onSelect={onSelectView}
        />

        <ChromeActions
          shiftActive={activeShift.status === "active"}
          isActionPending={isActionPending}
          onEndShift={onEndShift}
          onReset={onReset}
          onPunchOut={onPunchOut}
        />
      </div>
    </header>
  );
}

function BrandPill({
  shiftNumber,
  localAiStatus,
  isActionPending,
  onRetryLocalAi,
}: {
  shiftNumber: number;
  localAiStatus: LocalAiClientStatus;
  isActionPending: boolean;
  onRetryLocalAi: () => void;
}) {
  const tone =
    localAiStatus.status === "ready"
      ? "emerald"
      : localAiStatus.status === "checking"
        ? "amber"
        : "rose";
  const aiLabel =
    localAiStatus.status === "ready"
      ? "Local AI online. Click to recheck."
      : localAiStatus.status === "checking"
        ? "Local AI checking. Hold tight."
        : "Local AI offline. Click to recheck.";
  const aiDisabled = isActionPending || localAiStatus.status === "checking";

  return (
    <div className="aura-glass pointer-events-auto flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5 lg:gap-2.5 lg:px-5">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
        Cupid
      </span>
      <span className="hidden font-display text-base font-semibold tracking-tight text-aura-ink lg:inline">
        Operations
      </span>
      <span aria-hidden className="hidden h-3 w-px bg-aura-hairline lg:inline-block" />
      <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        shift.{pad2(shiftNumber)}
      </span>
      <span aria-hidden className="h-3 w-px bg-aura-hairline" />
      <button
        type="button"
        data-sfx="click"
        disabled={aiDisabled}
        onClick={onRetryLocalAi}
        title={localAiStatus.message}
        aria-label={aiLabel}
        className="-mx-1 inline-flex cursor-pointer items-center justify-center rounded-full p-1 transition hover:bg-white/55 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LiveDot tone={tone} />
      </button>
    </div>
  );
}

function ViewTabs({
  view,
  memberCount,
  dateAvailable,
  onSelect,
}: {
  view: ViewKey;
  memberCount: number;
  dateAvailable: boolean;
  onSelect: (view: ViewKey) => void;
}) {
  const tabs: Array<{ key: ViewKey; label: string; tag: string; live?: boolean }> = [
    { key: "roster", label: "Roster", tag: `${memberCount} cases` },
    { key: "brief", label: "Brief", tag: "staff the date" },
    {
      key: "date",
      label: "Date",
      tag: dateAvailable ? "live" : "no booking",
      live: dateAvailable,
    },
  ];

  return (
    <nav className="aura-glass pointer-events-auto relative inline-flex items-center gap-0.5 rounded-pill p-1.5">
      {tabs.map((tab) => {
        const isActive = view === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            className="relative cursor-pointer rounded-pill px-3 py-2 transition lg:px-4"
          >
            {isActive ? (
              <motion.span
                layoutId="dashboard-active-tab"
                aria-hidden
                className="absolute inset-0 -z-0 rounded-pill aura-glass-ink"
                transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
              />
            ) : null}
            <span
              className={`relative z-10 flex items-baseline gap-2 whitespace-nowrap ${isActive ? "text-white" : "text-aura-muted hover:text-aura-ink"}`}
            >
              <span className="font-display text-base font-semibold tracking-tight">
                {tab.label}
              </span>
              <span
                className={`hidden items-baseline font-mono text-micro uppercase tracking-[0.22em] xl:inline-flex ${isActive ? "text-white/70" : "text-aura-faint"}`}
              >
                {tab.live ? <LiveDot tone="rose" /> : null}
                {tab.live ? <span className="ml-1">{tab.tag}</span> : tab.tag}
              </span>
              {tab.live ? (
                <span className="inline-flex xl:hidden" aria-hidden>
                  <LiveDot tone="rose" />
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function ChromeActions({
  shiftActive,
  isActionPending,
  onEndShift,
  onReset,
  onPunchOut,
}: {
  shiftActive: boolean;
  isActionPending: boolean;
  onEndShift: () => void;
  onReset: () => void;
  onPunchOut: () => void;
}) {
  return (
    <div className="aura-glass pointer-events-auto inline-flex items-center gap-0.5 rounded-pill p-1">
      {shiftActive ? (
        <ChromeButton onClick={onEndShift} disabled={isActionPending}>
          End shift
        </ChromeButton>
      ) : null}
      <SettingsMenu isActionPending={isActionPending} onReset={onReset} onPunchOut={onPunchOut} />
    </div>
  );
}

function SettingsMenu({
  isActionPending,
  onReset,
  onPunchOut,
}: {
  isActionPending: boolean;
  onReset: () => void;
  onPunchOut: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isEnabled: sfxEnabled, setEnabled: setSfxEnabled } = useSfx();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current === null) {
        return;
      }
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  function handleReset() {
    setIsOpen(false);
    onReset();
  }

  function handlePunchOut() {
    setIsOpen(false);
    onPunchOut();
  }

  function handleToggleSfx() {
    setSfxEnabled(!sfxEnabled);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        data-sfx="menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Settings"
        title="Settings"
        onClick={() => setIsOpen((open) => !open)}
        className="flex cursor-pointer items-center justify-center rounded-pill px-2.5 py-1.5 text-aura-muted transition hover:bg-white/55 hover:text-aura-ink aria-expanded:bg-white/55 aria-expanded:text-aura-ink"
      >
        <SettingsIcon />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="settings-menu"
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="aura-glass-strong absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-card p-1.5"
          >
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={sfxEnabled}
              data-sfx="toggle"
              onClick={handleToggleSfx}
              className="block w-full cursor-pointer rounded-chip px-3 py-2 text-left font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
            >
              SFX {sfxEnabled ? "on" : "off"}
            </button>
            <button
              type="button"
              role="menuitem"
              data-sfx="menu"
              onClick={handlePunchOut}
              disabled={isActionPending}
              className="block w-full cursor-pointer rounded-chip px-3 py-2 text-left font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Punch out
            </button>
            <button
              type="button"
              role="menuitem"
              data-sfx="danger"
              onClick={handleReset}
              disabled={isActionPending}
              className="block w-full cursor-pointer rounded-chip px-3 py-2 text-left font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-aura-rose/10 hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset save
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H7a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/* ================================================================== */
/* Mesh + ambient                                                     */
/* ================================================================== */

function AmbientMesh() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[640px] w-[640px] rounded-full bg-aura-mesh-rose/55 blur-[140px] aura-blob-1" />
      <div className="absolute top-10 -right-32 h-[560px] w-[560px] rounded-full bg-aura-mesh-violet/55 blur-[140px] aura-blob-2" />
      <div className="absolute -bottom-40 left-1/3 h-[700px] w-[700px] rounded-full bg-aura-mesh-amber/45 blur-[140px] aura-blob-3" />
      <div className="absolute bottom-20 -right-20 h-[520px] w-[520px] rounded-full bg-aura-mesh-sky/45 blur-[140px] aura-blob-4" />
    </div>
  );
}

/* ================================================================== */
/* Empty / error                                                      */
/* ================================================================== */

function DateEmpty({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-6 text-center">
      <div className="space-y-5">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          // date.idle
        </p>
        <h1 className="font-display text-display-lg font-semibold tracking-tight text-aura-ink">
          No active date.
        </h1>
        <p className="text-lead text-aura-muted">
          The transcript fills in once you book a table. Cupid does not record silence.
        </p>
        <GhostButton onClick={onBack}>← Brief</GhostButton>
      </div>
    </div>
  );
}

function ErrorNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="aura-glass-rose relative z-10 mx-auto mt-2 flex w-full max-w-4xl items-start justify-between gap-4 rounded-card px-5 py-4 text-aura-rose lg:max-w-5xl">
      <p className="text-label leading-relaxed">{message}</p>
      <button
        type="button"
        data-sfx="dismiss"
        onClick={onDismiss}
        className="cursor-pointer font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/80 hover:text-aura-rose"
      >
        Dismiss
      </button>
    </div>
  );
}

/* ================================================================== */
/* API helpers                                                        */
/* ================================================================== */

async function runGameApiStreamAction(
  input: GameAction,
  onEvent: (event: GameStreamEvent) => void,
): Promise<GameActionResponse> {
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => abortController.abort(), GAME_API_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(GAME_API_STREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: abortController.signal,
    });
  } catch (error) {
    if (abortController.signal.aborted) {
      throw new Error(
        "Local AI did not return in time. Confirm Ollama is running, then retry the exchange.",
      );
    }

    throw error;
  }

  try {
    if (!response.ok) {
      const payload = await readJsonResponse(response);
      const parsedError = gameApiErrorSchema.safeParse(payload);

      throw new Error(
        parsedError.success ? parsedError.data.error : "Cupid API rejected the streamed action.",
      );
    }

    if (response.body === null) {
      throw new Error("Cupid API returned an empty stream.");
    }

    return await readGameStreamResponse(response.body, onEvent);
  } catch (error) {
    if (abortController.signal.aborted) {
      throw new Error(
        "Local AI did not return in time. Confirm Ollama is running, then retry the exchange.",
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function readGameStreamResponse(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: GameStreamEvent) => void,
): Promise<GameActionResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completeResponse: GameActionResponse | null = null;

  function processLine(line: string) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      return;
    }

    let payload: unknown;

    try {
      payload = JSON.parse(trimmedLine);
    } catch {
      throw new Error("Cupid API sent an unreadable stream event.");
    }

    const parsedEvent = gameStreamEventSchema.safeParse(payload);

    if (!parsedEvent.success) {
      throw new Error("Cupid API sent an unreadable stream event.");
    }

    const event = parsedEvent.data;

    if (event.type === "error") {
      throw new Error(event.message);
    }

    if (event.type === "complete") {
      completeResponse = event.response;
      return;
    }

    onEvent(event);
  }

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      processLine(line);
    }
  }

  buffer += decoder.decode();
  processLine(buffer);

  if (completeResponse === null) {
    throw new Error("Cupid API ended the stream before filing the date update.");
  }

  return completeResponse;
}

async function requestLocalAiStatus(): Promise<LocalAiClientStatus> {
  let response: Response;

  try {
    response = await fetch(LOCAL_AI_STATUS_URL);
  } catch (error) {
    return {
      status: "unavailable",
      message:
        error instanceof Error
          ? `Local AI status check failed. ${error.message}`
          : "Local AI status check failed.",
      details: [],
      checkedAt: new Date().toISOString(),
    };
  }

  const payload = await readJsonResponse(response);
  const parsedStatus = localAiStatusResponseSchema.safeParse(payload);

  if (parsedStatus.success) {
    return toLocalAiClientStatus(parsedStatus.data);
  }

  if (!response.ok) {
    const parsedError = gameApiErrorSchema.safeParse(payload);

    return {
      status: "unavailable",
      message: parsedError.success ? parsedError.data.error : "Local AI status check failed.",
      details: [],
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    status: "unavailable",
    message: "Local AI status response was unreadable.",
    details: [],
    checkedAt: new Date().toISOString(),
  };
}

function toLocalAiClientStatus(response: LocalAiStatusResponse): LocalAiClientStatus {
  return {
    status: response.status,
    message: response.message,
    details: response.details,
    checkedAt: response.checkedAt,
  };
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

type PairPreview = {
  pairState: PairState | null;
  note: string;
  fitSignal: MatchFitPublicSignal | null;
};

function buildPairPreview(
  save: GameSave | null,
  members: Member[],
  selectedScenario: DateScenario | undefined,
  activeRequests: MemberRequest[],
): PairPreview | null {
  if (save === null || members.length !== 2) {
    return null;
  }

  const pairId = makePairId(members[0].id, members[1].id);
  const pairState = save.pairStates.find((candidate) => candidate.id === pairId) ?? null;
  const hasRealityGap = members[0].species !== members[1].species;
  const note = hasRealityGap
    ? "Cross-reality pair. Cupid expects paperwork and useful data."
    : "Same-species pair. Cupid still expects paperwork.";
  const focusRequests = activeRequests.filter((request) => request.memberId === members[0].id);
  const fitSignal: MatchFitPublicSignal | null =
    pairState === null || selectedScenario === undefined
      ? null
      : toPublicFitSignal(
          evaluateMatchFit({
            members,
            scenario: selectedScenario,
            pairState,
            activeRequests: focusRequests,
          }),
        );

  return { pairState, note, fitSignal };
}

function toPublicFitSignal(fit: {
  fitLevel: MatchFitPublicSignal["fitLevel"];
  pressureLevel: MatchFitPublicSignal["pressureLevel"];
  askSignal: MatchFitPublicSignal["askSignal"];
}): MatchFitPublicSignal {
  return { fitLevel: fit.fitLevel, pressureLevel: fit.pressureLevel, askSignal: fit.askSignal };
}

function defaultMemberSelection(save: GameSave): string[] {
  const activeShift = getActiveShift(save);
  const focusMemberId = activeShift.featuredMemberIds.find((memberId) =>
    save.members.some((member) => member.id === memberId),
  );

  if (focusMemberId !== undefined) {
    const partnerMember = save.members.find((member) => member.id !== focusMemberId);
    return [focusMemberId, partnerMember?.id].filter(isDefined);
  }

  return save.members.slice(0, 2).map((member) => member.id);
}

function isDefined<TValue>(value: TValue | undefined): value is TValue {
  return value !== undefined;
}
