import { useEffect, useMemo, useState } from "react";

import {
  type CompanyGoal,
  type DateFinalReport,
  type DateMessage,
  type DateRuntimeMode,
  type DateScenario,
  type DateSession,
  type FollowUpAction,
  type GameSave,
  type JudgeSnapshot,
  type Member,
  type MemberRequest,
  type PairState,
  type PortraitAsset,
  type ShiftReport,
  type ShiftState,
} from "../domain/game";
import { companyGoals, memberRequests, starterScenarios } from "../fixtures";
import {
  createBrowserStorageDriver,
  LocalGameRepository,
} from "../repositories/local-game-repository";
import {
  addCupidIntervention,
  advanceDateExchange,
  applyFollowUpAction,
  completeDateSession,
  completeShift,
  startDateSession,
} from "../services/date-engine";
import { getActiveShift, makePairId } from "../services/game-seed";
import {
  gameActionResponseSchema,
  gameApiErrorSchema,
  toDeterministicResponse,
  type GameAction,
  type GameActionResponse,
} from "../services/game-api-contracts";

type PairPreview = {
  pairState: PairState | null;
  note: string;
};

type TranscriptDisplayItem = {
  id: string;
  order: number;
  label: string;
  text: string;
  tone: "member" | "scenario" | "cupid" | "system" | "judge";
  member?: Member;
};

const FOLLOW_UP_LABELS: Record<FollowUpAction, string> = {
  encourage: "Encourage",
  cool_down: "Cool Down",
  repair: "Repair",
  mark_bad_fit: "Mark Bad Fit",
};

type RuntimeMode = DateRuntimeMode;
type ShiftStatus = ShiftState["status"];

const GAME_API_TIMEOUT_MS = 120_000;

export function CupidOperationsDashboard() {
  const repository = useMemo(() => new LocalGameRepository(createBrowserStorageDriver()), []);
  const [save, setSave] = useState<GameSave | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [activeDateSessionId, setActiveDateSessionId] = useState<string | null>(null);
  const [interventionText, setInterventionText] = useState("");
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>("deterministic");
  const [isActionPending, setIsActionPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage(
        recoveredOutdatedSave
          ? "Cupid reset an outdated local save. The old file did not match the current shift schema."
          : null,
      );
      const restoredSession =
        nextSave.dateSessions.find((session) => session.status === "active") ??
        nextSave.dateSessions.at(-1) ??
        null;
      setSelectedScenarioId(getActiveShift(nextSave).drawnScenarioIds[0] ?? "");
      setSelectedMemberIds(defaultMemberSelection(nextSave));
      setRuntimeMode(restoredSession?.runtimeMode ?? "deterministic");
      setActiveDateSessionId(restoredSession?.id ?? null);
    }

    void loadSave();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  const activeShift = save === null ? null : getActiveShift(save);
  const drawnScenarios = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.drawnScenarioIds
            .map((scenarioId) => starterScenarios.find((scenario) => scenario.id === scenarioId))
            .filter(isScenario),
    [activeShift],
  );
  const pinnedGoals = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.companyGoalIds
            .map((goalId) => companyGoals.find((goal) => goal.id === goalId))
            .filter(isCompanyGoal),
    [activeShift],
  );
  const pinnedRequests = useMemo(
    () =>
      activeShift === null
        ? []
        : activeShift.memberRequestIds
            .map((requestId) => memberRequests.find((request) => request.id === requestId))
            .filter(isMemberRequest),
    [activeShift],
  );
  const selectedMembers = useMemo(
    () =>
      save === null
        ? []
        : selectedMemberIds
            .map((memberId) => save.members.find((member) => member.id === memberId))
            .filter(isMember),
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
    () => buildPairPreview(save, selectedMembers),
    [save, selectedMembers],
  );
  const transcriptItems = useMemo(
    () => buildTranscriptItems(activeSession, save?.members ?? [], selectedScenario),
    [activeSession, save?.members, selectedScenario],
  );

  async function persist(nextSave: GameSave) {
    await repository.saveGame(nextSave);
    setSave(nextSave);
  }

  function toggleMember(memberId: string) {
    setSelectedMemberIds((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }

      if (current.length >= 2) {
        return [current[1], memberId].filter(isString);
      }

      return [...current, memberId];
    });
  }

  async function handleStartDate() {
    if (save === null || selectedMembers.length !== 2 || selectedScenario === undefined) {
      return;
    }

    tryAction(async () => {
      const result = startDateSession(save, {
        firstMemberId: selectedMembers[0].id,
        secondMemberId: selectedMembers[1].id,
        scenarioId: selectedScenario.id,
        runtimeMode,
      });
      await persist(result.save);
      setActiveDateSessionId(result.session.id);
      setRuntimeMode(result.session.runtimeMode);
      setInterventionText("");
    });
  }

  async function handleAdvanceExchange() {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction(async () => {
      const activeRuntimeMode = activeSession.runtimeMode;
      const result =
        activeRuntimeMode === "local_ai"
          ? await runGameApiAction({
              type: "advanceExchange",
              runtimeMode: activeRuntimeMode,
              save,
              dateSessionId: activeSession.id,
            })
          : toDeterministicResponse(
              advanceDateExchange(save, {
                dateSessionId: activeSession.id,
              }),
            );
      await persist(result.save);
      setActiveDateSessionId(result.session.id);
      setRuntimeMode(result.session.runtimeMode);
      setRuntimeWarnings(result);
    });
  }

  async function handleCompleteDate() {
    if (save === null || activeSession === null) {
      return;
    }

    tryAction(async () => {
      const activeRuntimeMode = activeSession.runtimeMode;
      const result =
        activeRuntimeMode === "local_ai"
          ? await runGameApiAction({
              type: "completeDate",
              runtimeMode: activeRuntimeMode,
              save,
              dateSessionId: activeSession.id,
            })
          : toDeterministicResponse(completeDateSession(save, activeSession.id));
      await persist(result.save);
      setActiveDateSessionId(result.session.id);
      setRuntimeMode(result.session.runtimeMode);
      setRuntimeWarnings(result);
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
    });
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
      setErrorMessage(
        error instanceof Error ? error.message : "Cupid could not process that action.",
      );
    } finally {
      setIsActionPending(false);
    }
  }

  if (save === null || activeShift === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-aura-bg text-aura-ink">
        <div className="rounded-card border border-white/70 bg-aura-card p-6 shadow-card">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
            Cupid Operations
          </p>
          <p className="mt-2 text-body text-aura-muted">
            Cupid is reaching across timelines. One moment.
          </p>
        </div>
      </div>
    );
  }

  const dateSlotsRemaining = Math.max(0, activeShift.dateSlotsTotal - activeShift.dateSlotsUsed);
  const canStartDate =
    activeShift.status === "active" &&
    !isActionPending &&
    dateSlotsRemaining > 0 &&
    (activeSession === null || activeSession.status !== "active") &&
    selectedMembers.length === 2 &&
    selectedScenario !== undefined;
  const canAdvanceDate =
    activeSession !== null && activeSession.status === "active" && !isActionPending;
  const runtimeModeDisabled = isActionPending || activeSession?.status === "active";
  const canIntervene =
    canAdvanceDate &&
    activeSession?.intervention === undefined &&
    interventionText.trim().length > 0;

  return (
    <div className="min-h-screen bg-aura-bg text-aura-ink">
      <DashboardHeader
        save={save}
        activeShiftStatus={activeShift.status}
        dateSlotsUsed={activeShift.dateSlotsUsed}
        dateSlotsTotal={activeShift.dateSlotsTotal}
        runtimeMode={runtimeMode}
        isActionPending={isActionPending}
        onReset={handleReset}
      />
      <main className="mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-5 px-5 py-5 xl:grid-cols-[285px_minmax(0,1fr)_420px] 2xl:grid-cols-[310px_minmax(0,1fr)_460px] 2xl:px-7">
        <aside className="space-y-5">
          <ShiftStatus
            activeShiftStatus={activeShift.status}
            dateSlotsUsed={activeShift.dateSlotsUsed}
            dateSlotsTotal={activeShift.dateSlotsTotal}
            scenarioCount={drawnScenarios.length}
            onEndShift={handleEndShift}
            isActionPending={isActionPending}
            report={activeShift.report}
          />
          <PinnedGoals goals={pinnedGoals} report={activeShift.report} />
          <PinnedRequests
            requests={pinnedRequests}
            members={save.members}
            report={activeShift.report}
          />
        </aside>

        <section className="space-y-5">
          {errorMessage === null ? null : <ErrorNotice message={errorMessage} />}
          <MemberBoard
            members={save.members}
            selectedMemberIds={selectedMemberIds}
            disabled={isActionPending}
            onToggleMember={toggleMember}
          />
          <ScenarioHand
            scenarios={drawnScenarios}
            selectedScenarioId={selectedScenarioId}
            disabled={isActionPending}
            onSelectScenario={setSelectedScenarioId}
          />
          <ActiveDateControls
            session={activeSession}
            interventionText={interventionText}
            canAdvanceDate={canAdvanceDate}
            canIntervene={canIntervene}
            isActionPending={isActionPending}
            runtimeMode={runtimeMode}
            runtimeModeDisabled={runtimeModeDisabled}
            onInterventionTextChange={setInterventionText}
            onRuntimeModeChange={setRuntimeMode}
            onAdvanceExchange={handleAdvanceExchange}
            onCompleteDate={handleCompleteDate}
            onSendIntervention={handleIntervention}
            onFollowUp={handleFollowUp}
          />
        </section>

        <aside className="space-y-5">
          <SelectedMatchPanel
            selectedMembers={selectedMembers}
            selectedScenario={selectedScenario}
            pairPreview={pairPreview}
            activeSession={activeSession}
            canStartDate={canStartDate}
            isActionPending={isActionPending}
            onStartDate={handleStartDate}
          />
          <TranscriptPanel
            items={transcriptItems}
            session={activeSession}
            report={activeSession?.finalReport}
          />
        </aside>
      </main>
    </div>
  );
}

async function runGameApiAction(input: GameAction): Promise<GameActionResponse> {
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => abortController.abort(), GAME_API_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch("/api/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: abortController.signal,
    });
  } catch (error) {
    if (abortController.signal.aborted) {
      throw new Error("Local AI timed out. Confirm Ollama is running, then retry the exchange.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    const parsedError = gameApiErrorSchema.safeParse(payload);
    throw new Error(
      parsedError.success ? parsedError.data.error : "Cupid API rejected the date action.",
    );
  }

  const parsedResponse = gameActionResponseSchema.safeParse(payload);

  if (!parsedResponse.success) {
    throw new Error("Cupid API returned an invalid date update.");
  }

  return parsedResponse.data;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function DashboardHeader({
  save,
  activeShiftStatus,
  dateSlotsUsed,
  dateSlotsTotal,
  runtimeMode,
  isActionPending,
  onReset,
}: {
  save: GameSave;
  activeShiftStatus: ShiftStatus;
  dateSlotsUsed: number;
  dateSlotsTotal: number;
  runtimeMode: RuntimeMode;
  isActionPending: boolean;
  onReset: () => void;
}) {
  return (
    <header className="border-b border-aura-hairline bg-white/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-4 px-5 py-4 2xl:px-7">
        <div>
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
            Cupid Operations
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-normal text-aura-ink">
            Interdimensional Dating Coach
          </h1>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <StatusChip label="Local model" value={save.config.performerModel} tone="rose" />
          <StatusChip label="Runtime" value={RUNTIME_MODE_LABELS[runtimeMode]} tone="violet" />
          <StatusChip label="Shift" value={activeShiftStatus} tone="violet" />
          <StatusChip
            label="Date slots"
            value={`${dateSlotsUsed} / ${dateSlotsTotal}`}
            tone="emerald"
          />
          <button
            type="button"
            onClick={onReset}
            disabled={isActionPending}
            className="cursor-pointer rounded-pill border border-aura-hairline bg-white/70 px-3 py-2 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-muted transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Reset save
          </button>
        </div>
      </div>
    </header>
  );
}

const STATUS_CHIP_TONE = {
  rose: "border-aura-rose/20 bg-rose-50 text-aura-rose",
  violet: "border-aura-violet/20 bg-violet-50 text-violet-700",
  emerald: "border-aura-emerald/20 bg-emerald-50 text-emerald-700",
} as const;

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: keyof typeof STATUS_CHIP_TONE;
}) {
  return (
    <div
      className={`rounded-pill border px-3 py-2 font-mono text-micro uppercase tracking-[0.18em] ${STATUS_CHIP_TONE[tone]}`}
    >
      <span className="text-aura-muted">{label}</span>
      <span className="ml-2 font-semibold">{value}</span>
    </div>
  );
}

const RUNTIME_MODE_LABELS: Record<RuntimeMode, string> = {
  deterministic: "Scripted",
  local_ai: "Local AI",
};

function RuntimeModeControl({
  runtimeMode,
  disabled,
  onRuntimeModeChange,
}: {
  runtimeMode: RuntimeMode;
  disabled: boolean;
  onRuntimeModeChange: (mode: RuntimeMode) => void;
}) {
  const modes: RuntimeMode[] = ["deterministic", "local_ai"];

  return (
    <div className="inline-flex rounded-pill border border-aura-hairline bg-white/70 p-1">
      {modes.map((mode) => {
        const isSelected = mode === runtimeMode;

        return (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onRuntimeModeChange(mode)}
            className={`cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-45 ${
              isSelected ? "bg-aura-ink text-white" : "text-aura-muted hover:bg-white"
            }`}
          >
            {RUNTIME_MODE_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}

function ShiftStatus({
  activeShiftStatus,
  dateSlotsUsed,
  dateSlotsTotal,
  scenarioCount,
  onEndShift,
  isActionPending,
  report,
}: {
  activeShiftStatus: ShiftStatus;
  dateSlotsUsed: number;
  dateSlotsTotal: number;
  scenarioCount: number;
  onEndShift: () => void;
  isActionPending: boolean;
  report: ShiftReport | undefined;
}) {
  return (
    <section className="rounded-card border border-white/70 bg-aura-card p-5 shadow-card backdrop-blur-xl">
      <SectionLabel eyebrow="// shift.01" title="Status" />
      <div className="mt-4 space-y-4">
        <MetricRow label="Shift state" value={activeShiftStatus} />
        <MetricRow label="Date slots used" value={`${dateSlotsUsed} / ${dateSlotsTotal}`} />
        <MetricRow label="Scenario hand" value={`${scenarioCount} drawn`} />
        <MetricRow label="Interventions" value="1 per date" />
      </div>
      <button
        type="button"
        onClick={onEndShift}
        disabled={activeShiftStatus !== "active" || isActionPending}
        className="mt-5 w-full cursor-pointer rounded-pill border border-aura-rose/20 bg-rose-50 px-4 py-2.5 text-body font-bold text-aura-rose transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
      >
        End shift
      </button>
      {report === undefined ? (
        <p className="mt-4 rounded-tile border border-aura-hairline bg-white/60 p-3 text-label text-aura-muted">
          Cupid is tracking goals, requests, repeat scenarios, and incident paperwork.
        </p>
      ) : (
        <p className="mt-4 rounded-tile border border-aura-hairline bg-white/70 p-3 text-label text-aura-ink">
          {report.summary}
        </p>
      )}
    </section>
  );
}

function PinnedGoals({ goals, report }: { goals: CompanyGoal[]; report: ShiftReport | undefined }) {
  return (
    <section>
      <SectionLabel eyebrow="// corporate" title="Pinned goals" />
      <div className="mt-3 space-y-3">
        {goals.map((goal) => {
          const result = report?.goalResults.find((item) => item.goalId === goal.id);

          return (
            <div key={goal.id} className="rounded-tile border border-aura-hairline bg-white/65 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-body font-bold text-aura-ink">{goal.title}</h2>
                <span className="rounded-pill bg-rose-50 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-rose">
                  {result?.status ?? goal.target}
                </span>
              </div>
              <p className="mt-2 text-label text-aura-muted">
                {result?.summary ?? goal.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PinnedRequests({
  requests,
  members,
  report,
}: {
  requests: MemberRequest[];
  members: Member[];
  report: ShiftReport | undefined;
}) {
  return (
    <section>
      <SectionLabel eyebrow="// members" title="Pinned requests" />
      <div className="mt-3 space-y-3">
        {requests.map((request) => {
          const member = members.find((candidate) => candidate.id === request.memberId);
          const wasIgnored = report?.ignoredRequestIds.includes(request.id) ?? false;

          return (
            <div
              key={request.id}
              className="rounded-tile border border-aura-hairline bg-white/65 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
                  {member?.name ?? "Member"}
                </p>
                <span
                  className={`rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] ${wasIgnored ? "bg-amber-50 text-amber-700" : "bg-white/80 text-aura-rose"}`}
                >
                  {report === undefined ? "pinned" : wasIgnored ? "ignored" : "handled"}
                </span>
              </div>
              <p className="mt-2 text-label text-aura-ink">{request.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MemberBoard({
  members,
  selectedMemberIds,
  disabled,
  onToggleMember,
}: {
  members: Member[];
  selectedMemberIds: string[];
  disabled: boolean;
  onToggleMember: (memberId: string) => void;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionLabel eyebrow="// pool" title="Member board" />
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
          Select 2 members
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {members.map((member) => {
          const isSelected = selectedMemberIds.includes(member.id);
          const request = memberRequests.find((item) => item.id === member.state.currentRequestId);

          return (
            <button
              key={member.id}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onToggleMember(member.id)}
              className={`group cursor-pointer rounded-card border p-4 text-left shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-55 ${
                isSelected
                  ? "border-aura-rose/45 bg-white/80 ring-2 ring-aura-rose/20"
                  : "border-white/70 bg-aura-card"
              }`}
            >
              <div className="flex gap-4">
                <Portrait member={member} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-bold tracking-normal text-aura-ink">
                        {member.name}
                      </h2>
                      <p className="mt-1 text-label font-semibold text-aura-muted">
                        {member.species} | {member.origin}
                      </p>
                    </div>
                    <span className="rounded-pill bg-white/80 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-rose">
                      {member.state.mood}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-body text-aura-ink">
                    {member.datingProfile}
                  </p>

                  <div className="mt-4">
                    <Meter label="Mood" value={member.state.mood} />
                    <Meter label="Openness" value={member.state.openness} />
                  </div>
                </div>
              </div>

              {request === undefined ? null : (
                <p className="mt-4 rounded-tile border border-aura-hairline bg-white/60 p-3 text-label text-aura-muted">
                  {request.text}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Portrait({ member }: { member: Member }) {
  return (
    <PortraitFrame
      imagePath={readyPortraitPath(member.portraits.neutral.avatar)}
      member={member}
      variant="avatar"
    />
  );
}

function MatchPortrait({ member }: { member: Member }) {
  return (
    <PortraitFrame
      imagePath={readyPortraitPath(member.portraits.neutral.portrait)}
      member={member}
      variant="portrait"
    />
  );
}

type PortraitFrameVariant = "avatar" | "portrait" | "transcript";

const PORTRAIT_FRAME_CLASS: Record<PortraitFrameVariant, string> = {
  avatar:
    "grid size-24 shrink-0 place-items-center overflow-hidden rounded-card border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-100 to-violet-100 shadow-card",
  portrait:
    "grid h-28 w-20 shrink-0 place-items-center overflow-hidden rounded-tile border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-100 to-violet-100 shadow-card",
  transcript:
    "grid size-12 shrink-0 place-items-center overflow-hidden rounded-tile border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-100 to-violet-100 shadow-card",
};

const PORTRAIT_IMAGE_CLASS: Record<PortraitFrameVariant, string> = {
  avatar: "size-full object-contain object-center p-1",
  portrait: "size-full object-contain object-bottom p-1",
  transcript: "size-full object-contain object-center p-0.5",
};

const PORTRAIT_INITIALS_CLASS: Record<PortraitFrameVariant, string> = {
  avatar: "font-display text-3xl font-bold tracking-normal text-aura-rose",
  portrait: "font-display text-xl font-bold tracking-normal text-aura-rose",
  transcript: "font-display text-base font-bold tracking-normal text-aura-rose",
};

const PORTRAIT_ALT_LABEL: Record<PortraitFrameVariant, string> = {
  avatar: "avatar",
  portrait: "portrait",
  transcript: "avatar",
};

function PortraitFrame({
  imagePath,
  member,
  variant,
}: {
  imagePath: string | undefined;
  member: Member;
  variant: PortraitFrameVariant;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={PORTRAIT_FRAME_CLASS[variant]}>
      {imagePath === undefined || imageFailed ? (
        <p className={PORTRAIT_INITIALS_CLASS[variant]}>{initialsFor(member.name)}</p>
      ) : (
        <img
          alt={`${member.name} ${PORTRAIT_ALT_LABEL[variant]}`}
          className={PORTRAIT_IMAGE_CLASS[variant]}
          onError={() => setImageFailed(true)}
          src={imagePath}
        />
      )}
    </div>
  );
}

function readyPortraitPath(asset: PortraitAsset) {
  return asset.model === "pending" ? undefined : asset.cutoutPath;
}

function ScenarioHand({
  scenarios,
  selectedScenarioId,
  disabled,
  onSelectScenario,
}: {
  scenarios: DateScenario[];
  selectedScenarioId: string;
  disabled: boolean;
  onSelectScenario: (scenarioId: string) => void;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionLabel eyebrow="// today" title="Scenario hand" />
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
          Reusable deck cards
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === selectedScenarioId;

          return (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onSelectScenario(scenario.id)}
              className={`cursor-pointer rounded-card border p-4 text-left shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-55 ${
                isSelected
                  ? "border-aura-fuchsia/45 bg-white/85 ring-2 ring-aura-fuchsia/20"
                  : "border-white/70 bg-aura-card"
              }`}
            >
              <div className="space-y-3">
                <RiskPill risk={scenario.card.risk} />
                <h2 className="font-display text-2xl font-bold tracking-normal text-aura-ink">
                  {scenario.title}
                </h2>
              </div>
              <p className="mt-3 text-body text-aura-muted">{scenario.card.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {scenario.card.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-pill border border-aura-hairline bg-white/65 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-muted"
                  >
                    {tag.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SelectedMatchPanel({
  selectedMembers,
  selectedScenario,
  pairPreview,
  activeSession,
  canStartDate,
  isActionPending,
  onStartDate,
}: {
  selectedMembers: Member[];
  selectedScenario: DateScenario | undefined;
  pairPreview: PairPreview | null;
  activeSession: DateSession | null;
  canStartDate: boolean;
  isActionPending: boolean;
  onStartDate: () => void;
}) {
  return (
    <section className="rounded-card border border-white/70 bg-aura-card p-5 shadow-card backdrop-blur-xl">
      <SectionLabel eyebrow="// match" title="Selected match" />
      <div className="mt-4 space-y-4">
        <div className="rounded-tile border border-aura-hairline bg-white/65 p-4">
          {selectedMembers.length === 0 ? (
            <p className="text-body text-aura-muted">
              Select two member cards to build a match preview.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <MatchPortrait member={member} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-aura-ink">{member.name}</p>
                      <p className="text-label text-aura-muted">{member.realityStatus}</p>
                    </div>
                  </div>
                  <span className="rounded-pill bg-white/80 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-rose">
                    mood {member.state.mood}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {pairPreview?.pairState === null || pairPreview === null ? null : (
          <div className="space-y-3">
            <Meter label="Spark" value={pairPreview.pairState.stats.spark} />
            <Meter label="Strain" value={pairPreview.pairState.stats.strain} />
            <Meter
              label="Relationship health"
              value={pairPreview.pairState.stats.relationshipHealth}
            />
            <p className="rounded-tile border border-aura-hairline bg-white/65 p-3 text-label text-aura-muted">
              {pairPreview.note}
            </p>
          </div>
        )}

        <div className="rounded-tile border border-aura-hairline bg-white/65 p-4">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
            Scenario
          </p>
          <p className="mt-2 text-body font-semibold text-aura-ink">
            {selectedScenario?.title ?? "No scenario selected"}
          </p>
          <p className="mt-1 text-label text-aura-muted">
            {selectedScenario?.publicBrief.location ?? "Choose a scenario from today's hand."}
          </p>
        </div>

        <button
          type="button"
          disabled={!canStartDate}
          onClick={onStartDate}
          className="w-full cursor-pointer rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-5 py-3.5 text-body font-bold text-white shadow-cta transition hover:-translate-y-0.5 hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isActionPending
            ? "Processing"
            : activeSession?.status === "active"
              ? "Date in progress"
              : "Start date"}
        </button>
      </div>
    </section>
  );
}

function ActiveDateControls({
  session,
  interventionText,
  canAdvanceDate,
  canIntervene,
  isActionPending,
  runtimeMode,
  runtimeModeDisabled,
  onInterventionTextChange,
  onRuntimeModeChange,
  onAdvanceExchange,
  onCompleteDate,
  onSendIntervention,
  onFollowUp,
}: {
  session: DateSession | null;
  interventionText: string;
  canAdvanceDate: boolean;
  canIntervene: boolean;
  isActionPending: boolean;
  runtimeMode: RuntimeMode;
  runtimeModeDisabled: boolean;
  onInterventionTextChange: (text: string) => void;
  onRuntimeModeChange: (mode: RuntimeMode) => void;
  onAdvanceExchange: () => void;
  onCompleteDate: () => void;
  onSendIntervention: () => void;
  onFollowUp: (action: FollowUpAction) => void;
}) {
  if (session === null) {
    return (
      <section className="rounded-card border border-white/70 bg-aura-card p-5 shadow-card backdrop-blur-xl">
        <SectionLabel eyebrow="// date" title="Active date" />
        <p className="mt-4 text-body text-aura-muted">
          Start a match to open the transcript and intervention console.
        </p>
        <div className="mt-4">
          <RuntimeModeControl
            runtimeMode={runtimeMode}
            disabled={runtimeModeDisabled}
            onRuntimeModeChange={onRuntimeModeChange}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-white/70 bg-aura-card p-5 shadow-card backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionLabel eyebrow="// date" title="Active date" />
        <div className="flex flex-wrap items-center gap-2">
          <RuntimeModeControl
            runtimeMode={runtimeMode}
            disabled={runtimeModeDisabled}
            onRuntimeModeChange={onRuntimeModeChange}
          />
          <span className="rounded-pill bg-white/80 px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-rose">
            {session.status}
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <Meter label="Date Health" value={session.dateHealth} />
        <MetricRow label="Turns" value={`${session.currentTurn} / ${session.turnLimit}`} />
        <MetricRow label="Judge passes" value={String(session.judgeSnapshots.length)} />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={interventionText}
          maxLength={240}
          disabled={!canAdvanceDate || session.intervention !== undefined}
          onChange={(event) => onInterventionTextChange(event.target.value)}
          placeholder={
            session.intervention === undefined
              ? "Cupid suggests..."
              : "Intervention already used for this date"
          }
          className="min-h-12 rounded-pill border border-aura-hairline bg-white/80 px-4 text-body text-aura-ink outline-none transition placeholder:text-aura-faint focus:border-aura-rose/40 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          disabled={!canIntervene}
          onClick={onSendIntervention}
          className="cursor-pointer rounded-pill border border-aura-rose/20 bg-rose-50 px-4 py-3 text-body font-bold text-aura-rose transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isActionPending ? "Processing" : "Send nudge"}
        </button>
        <button
          type="button"
          disabled={!canAdvanceDate}
          onClick={onAdvanceExchange}
          className="cursor-pointer rounded-pill bg-aura-ink px-4 py-3 text-body font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isActionPending ? "Processing" : "Advance exchange"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canAdvanceDate}
          onClick={onCompleteDate}
          className="cursor-pointer rounded-pill border border-aura-hairline bg-white/70 px-4 py-2.5 text-label font-bold text-aura-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isActionPending ? "Processing" : "Resolve date"}
        </button>
        {session.finalReport === undefined || session.finalReport.appliedFollowUp !== undefined
          ? null
          : (Object.keys(FOLLOW_UP_LABELS) as FollowUpAction[]).map((action) => (
              <button
                key={action}
                type="button"
                disabled={isActionPending}
                onClick={() => onFollowUp(action)}
                className="cursor-pointer rounded-pill border border-aura-hairline bg-white/70 px-4 py-2.5 text-label font-bold text-aura-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {FOLLOW_UP_LABELS[action]}
              </button>
            ))}
      </div>
    </section>
  );
}

function TranscriptPanel({
  items,
  session,
  report,
}: {
  items: TranscriptDisplayItem[];
  session: DateSession | null;
  report: DateFinalReport | undefined;
}) {
  return (
    <section className="rounded-card border border-white/70 bg-aura-card p-5 shadow-card backdrop-blur-xl">
      <SectionLabel eyebrow="// transcript" title="Date transcript" />
      <div className="mt-4 max-h-[760px] space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <MessageBubble key={item.id} item={item} />
        ))}
      </div>
      {session === null ? (
        <p className="mt-4 text-label text-aura-muted">
          No date session selected. Cupid is not recording silence today.
        </p>
      ) : null}
      {report === undefined ? null : <FinalReport report={report} />}
    </section>
  );
}

const MESSAGE_BUBBLE_TONE: Record<TranscriptDisplayItem["tone"], string> = {
  cupid: "border-aura-rose/25 bg-rose-50 text-aura-ink",
  scenario: "border-aura-violet/25 bg-violet-50 text-aura-ink",
  judge: "border-aura-emerald/25 bg-emerald-50 text-aura-ink",
  member: "border-aura-hairline bg-white/75 text-aura-ink",
  system: "border-aura-hairline bg-white/60 text-aura-muted",
};

function MessageBubble({ item }: { item: TranscriptDisplayItem }) {
  const portraitMember = item.tone === "member" ? item.member : undefined;

  return (
    <article
      className={`rounded-tile border p-3 ${portraitMember !== undefined ? "flex gap-3" : ""} ${MESSAGE_BUBBLE_TONE[item.tone]}`}
    >
      {portraitMember !== undefined ? (
        <PortraitFrame
          imagePath={readyPortraitPath(portraitMember.portraits.neutral.avatar)}
          member={portraitMember}
          variant="transcript"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-muted">
          {item.label}
        </p>
        <p className="mt-2 text-body leading-relaxed">{item.text}</p>
      </div>
    </article>
  );
}

function FinalReport({ report }: { report: DateFinalReport }) {
  return (
    <div className="mt-5 rounded-tile border border-aura-emerald/25 bg-emerald-50 p-4">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-emerald-700">
        Final report
      </p>
      <p className="mt-2 text-body font-semibold text-aura-ink">{report.summary}</p>
      <p className="mt-2 text-label text-aura-muted">{report.statSummary}</p>
      <p className="mt-2 text-label font-semibold text-aura-ink">
        Recommended follow-up: {FOLLOW_UP_LABELS[report.recommendedFollowUp]}
      </p>
      {report.appliedFollowUp === undefined ? null : (
        <p className="mt-1 text-label text-aura-muted">
          Applied follow-up: {FOLLOW_UP_LABELS[report.appliedFollowUp]}
        </p>
      )}
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-rose-200 bg-rose-50 p-4 text-body text-aura-rose">
      {message}
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-muted">
          {label}
        </span>
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.16em] text-aura-faint">
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-pill bg-white/70">
        <div
          className={`h-full rounded-pill bg-gradient-to-r from-aura-rose to-aura-fuchsia ${scoreWidthClass(value)}`}
        />
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-aura-hairline pb-3 last:border-b-0 last:pb-0">
      <span className="text-label font-semibold text-aura-muted">{label}</span>
      <span className="font-mono text-label font-semibold text-aura-ink">{value}</span>
    </div>
  );
}

function SectionLabel({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-2xl font-bold tracking-normal text-aura-ink">
        {title}
      </h2>
    </div>
  );
}

const RISK_PILL_TONE: Record<DateScenario["card"]["risk"], string> = {
  high: "bg-rose-50 text-aura-rose",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-emerald-50 text-emerald-700",
};

function RiskPill({ risk }: { risk: DateScenario["card"]["risk"] }) {
  return (
    <span
      className={`rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.16em] ${RISK_PILL_TONE[risk]}`}
    >
      {risk}
    </span>
  );
}

function buildPairPreview(save: GameSave | null, members: Member[]): PairPreview | null {
  if (save === null || members.length !== 2) {
    return null;
  }

  const pairId = makePairId(members[0].id, members[1].id);
  const pairState = save.pairStates.find((candidate) => candidate.id === pairId) ?? null;
  const hasRealityGap = members[0].species !== members[1].species;
  const note = hasRealityGap
    ? "Cross-reality match. Cupid expects paperwork and useful data."
    : "Same-species match. Cupid still expects paperwork.";

  return { pairState, note };
}

function buildTranscriptItems(
  session: DateSession | null,
  members: Member[],
  selectedScenario: DateScenario | undefined,
): TranscriptDisplayItem[] {
  if (session === null) {
    return [
      {
        id: "msg-empty",
        order: 0,
        label: "Cupid",
        tone: "cupid",
        text: "Select two members and one scenario to start the date surface.",
      },
    ];
  }

  const scenario =
    starterScenarios.find((candidate) => candidate.id === session.scenarioId) ?? selectedScenario;
  const messageItems = session.transcript.map((message) =>
    buildMessageItem(message, members, scenario),
  );
  const judgeItems = session.judgeSnapshots.map((snapshot) =>
    buildJudgeItem(snapshot, session.transcript),
  );

  return [...messageItems, ...judgeItems].sort((first, second) => first.order - second.order);
}

function buildMessageItem(
  message: DateMessage,
  members: Member[],
  scenario: DateScenario | undefined,
): TranscriptDisplayItem {
  if (message.kind === "character") {
    const member = members.find((candidate) => candidate.id === message.speakerId);

    return {
      id: `turn-${message.sequenceIndex}`,
      order: message.sequenceIndex * 10,
      label: member?.name ?? "Member",
      tone: "member",
      text: message.text,
      member,
    };
  }

  return {
    id: `turn-${message.sequenceIndex}`,
    order: message.sequenceIndex * 10,
    label:
      message.kind === "scenario"
        ? (scenario?.title ?? "Scenario")
        : message.kind === "cupid"
          ? "Cupid intervention"
          : "System",
    tone: message.kind,
    text: message.text,
  };
}

function buildJudgeItem(snapshot: JudgeSnapshot, transcript: DateMessage[]): TranscriptDisplayItem {
  const exchangeStartTurn = snapshot.exchangeIndex * 2 + 1;
  const exchangeEndTurn = exchangeStartTurn + 1;
  const lastSequenceIndex = transcript.reduce((max, message) => {
    if (
      message.kind === "character" &&
      message.turnIndex >= exchangeStartTurn &&
      message.turnIndex <= exchangeEndTurn
    ) {
      return Math.max(max, message.sequenceIndex);
    }
    return max;
  }, 0);

  return {
    id: `turn-judge-${snapshot.exchangeIndex}`,
    order: lastSequenceIndex * 10 + 5,
    label: "Judge update",
    tone: "judge",
    text: snapshot.playerSummary,
  };
}

function defaultMemberSelection(save: GameSave): string[] {
  return save.members.slice(0, 2).map((member) => member.id);
}

function isMember(member: Member | undefined): member is Member {
  return member !== undefined;
}

function isCompanyGoal(goal: CompanyGoal | undefined): goal is CompanyGoal {
  return goal !== undefined;
}

function isMemberRequest(request: MemberRequest | undefined): request is MemberRequest {
  return request !== undefined;
}

function isScenario(scenario: DateScenario | undefined): scenario is DateScenario {
  return scenario !== undefined;
}

function isString(value: string | undefined): value is string {
  return value !== undefined;
}

const SCORE_WIDTH_CLASSES: Array<readonly [number, string]> = [
  [81, "w-full"],
  [61, "w-4/5"],
  [41, "w-3/5"],
  [21, "w-2/5"],
  [1, "w-1/5"],
];

function scoreWidthClass(value: number) {
  return SCORE_WIDTH_CLASSES.find(([threshold]) => value >= threshold)?.[1] ?? "w-0";
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part.at(0) ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
