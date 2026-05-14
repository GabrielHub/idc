import { AnimatePresence, motion } from "motion/react";
import { type Ref, useEffect, useMemo, useRef, useState } from "react";

import type {
  ActiveDateBooking,
  CompanyGoal,
  DateScenario,
  GameSave,
  Member,
  MemberRequest,
  PairState,
  ShiftState,
} from "../domain/game";
import { activeBudgetDiscountOffers, computeEffectiveCosts } from "../services/budget";
import { clientLossLimit, type ReadyClosurePair } from "../services/closures";
import {
  buildGoalProgressSnapshots,
  buildShiftGoalMetrics,
  fallbackGoalProgress,
  getMemberQuitRiskStatus,
  getQuitMembers,
  type GoalProgressSnapshot,
  MEMBER_QUIT_RISK_LABEL,
} from "../services/date-engine";
import { companyGoals } from "../fixtures";
import {
  chooseScenarioFreeRecommendation,
  evaluateMatchFit,
  evaluateScenarioFreePairSignal,
  scenarioRoomReadFromMatchFit,
  type ScenarioFreeRecommendationCandidate,
  type ScenarioRoomRead,
} from "../services/match-fit";
import { makePairId } from "../services/game-seed";
import {
  moveSuggestedMemberFirst,
  sortMembersByCuratedRosterOrder,
} from "../services/member-roster-order";
import { visibleReadsForPair } from "../services/player-knowledge";
import { isMemberInCooldown } from "../services/shift-planning";
import { GhostButton, Hairline, pad2, Portrait, PrimaryButton, Tooltip } from "./dashboard-atoms";
import {
  MemberCard,
  MemberDetailsModal,
  PendingMemberCard,
  rosterGridFillerClasses,
  type MemberCardPill,
  type MemberCardState,
} from "./member-card";
import { scenarioBackdropPath } from "./scenario-backdrop";
import { ScenarioCard } from "./scenario-card";
import { ScenarioDetailsModal } from "./scenario-details-modal";

type BookingStep = "focus" | "partner" | "date";

export type PreDateCanvasProps = {
  save: GameSave;
  shift: ShiftState;
  focusedMembers: Member[];
  drawnScenarios: DateScenario[];
  memberRequests: readonly MemberRequest[];
  pairStates: readonly PairState[];
  isActionPending: boolean;
  aiReady: boolean;
  readyClosurePairs: ReadyClosurePair[];
  closingPairId: string | null;
  closureError: { pairId: string; message: string } | null;
  revealAllMemberDetails: boolean;
  deckRepairBlocked: boolean;
  onCommitPair: (input: { focusMemberId: string; partnerMemberId: string }) => void;
  onStartDate: (input: { scenarioId: string }) => void;
  onCancelBooking: () => void;
  onConfirmClosure: (pairId: string) => void;
  onDismissClosureError: () => void;
  onOpenDateBook: () => void;
  onOpenRoster: () => void;
  onCloseShift: () => void;
  onStartNextShift: () => void;
};

export function PreDateCanvas({
  save,
  shift,
  focusedMembers,
  drawnScenarios,
  memberRequests: requests,
  pairStates,
  isActionPending,
  aiReady,
  readyClosurePairs,
  closingPairId,
  closureError,
  revealAllMemberDetails,
  deckRepairBlocked,
  onCommitPair,
  onStartDate,
  onCancelBooking,
  onConfirmClosure,
  onDismissClosureError,
  onOpenDateBook,
  onOpenRoster,
  onCloseShift,
  onStartNextShift,
}: PreDateCanvasProps) {
  const focusedIds = useMemo(
    () => new Set(focusedMembers.map((member) => member.id)),
    [focusedMembers],
  );
  const focusedClosurePairs = useMemo(
    () =>
      readyClosurePairs.filter((entry) =>
        entry.participants.some((participant) => focusedIds.has(participant.id)),
      ),
    [readyClosurePairs, focusedIds],
  );
  const lossLimit = clientLossLimit(save);
  const quitCount = useMemo(() => getQuitMembers(save.members).length, [save.members]);
  const quitsRemaining = Math.max(0, lossLimit - quitCount);
  const eligibleFocus = useMemo(
    () =>
      focusedMembers.filter(
        (member) =>
          member.state.status === "active" && !isMemberInCooldown(member, shift.shiftNumber),
      ),
    [focusedMembers, shift.shiftNumber],
  );

  const activeBooking = shift.activeBooking ?? null;
  const isCommitted = activeBooking !== null;

  const [activeFocusId, setActiveFocusId] = useState<string | null>(
    activeBooking?.focusMemberId ?? eligibleFocus[0]?.id ?? null,
  );
  const [partnerId, setPartnerId] = useState<string | null>(() => {
    if (activeBooking !== null) {
      const partner = activeBooking.participantIds.find((id) => id !== activeBooking.focusMemberId);
      return partner ?? null;
    }
    return null;
  });
  const [scenarioId, setScenarioId] = useState<string | null>(drawnScenarios[0]?.id ?? null);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [openScenarioId, setOpenScenarioId] = useState<string | null>(null);
  const focusSectionRef = useRef<HTMLElement | null>(null);
  const partnerSectionRef = useRef<HTMLElement | null>(null);
  const dateSectionRef = useRef<HTMLElement | null>(null);
  const selectedDateCardRef = useRef<HTMLDivElement | null>(null);
  const selectedFocusCardRef = useRef<HTMLLIElement | null>(null);
  const selectedPartnerCardRef = useRef<HTMLLIElement | null>(null);

  const requestsById = useMemo(() => {
    const map = new Map<string, MemberRequest>();
    for (const request of requests) map.set(request.id, request);
    return map;
  }, [requests]);
  const requestForMember = (member: Member): MemberRequest | undefined => {
    if (member.state.currentRequestId === undefined) return undefined;
    return requestsById.get(member.state.currentRequestId);
  };

  useEffect(() => {
    if (activeBooking !== null) {
      setActiveFocusId(activeBooking.focusMemberId);
      const partner = activeBooking.participantIds.find((id) => id !== activeBooking.focusMemberId);
      setPartnerId(partner ?? null);
      return;
    }
    if (activeFocusId !== null && eligibleFocus.some((member) => member.id === activeFocusId)) {
      return;
    }
    setActiveFocusId(eligibleFocus[0]?.id ?? null);
  }, [activeBooking, activeFocusId, eligibleFocus]);

  useEffect(() => {
    if (scenarioId !== null && drawnScenarios.some((scenario) => scenario.id === scenarioId)) {
      return;
    }
    setScenarioId(drawnScenarios[0]?.id ?? null);
  }, [scenarioId, drawnScenarios]);

  const activeFocus = useMemo(
    () => save.members.find((member) => member.id === activeFocusId) ?? null,
    [save.members, activeFocusId],
  );

  const candidatePartners = useMemo(() => {
    if (activeFocus === null) return [];
    if (activeBooking !== null) {
      const partnerIdFromBooking = activeBooking.participantIds.find(
        (id) => id !== activeBooking.focusMemberId,
      );
      const partner = save.members.find((member) => member.id === partnerIdFromBooking);
      return partner === undefined ? [] : [partner];
    }
    return sortMembersByCuratedRosterOrder(
      save.members.filter(
        (member) =>
          member.id !== activeFocus.id &&
          member.state.status === "active" &&
          !isMemberInCooldown(member, shift.shiftNumber),
      ),
    );
  }, [save.members, activeFocus, shift.shiftNumber, activeBooking]);

  useEffect(() => {
    if (activeBooking !== null) return;
    if (partnerId === null) return;
    const stillEligible = candidatePartners.some((member) => member.id === partnerId);
    if (!stillEligible) {
      setPartnerId(null);
    }
  }, [candidatePartners, partnerId, activeBooking]);

  const selectedScenario = useMemo(
    () => drawnScenarios.find((scenario) => scenario.id === scenarioId) ?? null,
    [drawnScenarios, scenarioId],
  );
  const openScenario = useMemo(
    () => drawnScenarios.find((scenario) => scenario.id === openScenarioId) ?? null,
    [drawnScenarios, openScenarioId],
  );

  const pairStateById = useMemo(
    () => new Map(pairStates.map((state) => [state.id, state])),
    [pairStates],
  );
  const activeFocusRequest = useMemo(() => {
    if (activeFocus === null) return undefined;

    for (const requestId of shift.memberRequestIds) {
      const request = requestsById.get(requestId);
      if (request?.memberId === activeFocus.id) {
        return request;
      }
    }

    return undefined;
  }, [activeFocus, requestsById, shift.memberRequestIds]);
  const shiftGoals = useMemo(
    () =>
      shift.companyGoalIds
        .map((goalId) => companyGoals.find((goal) => goal.id === goalId))
        .filter((goal): goal is CompanyGoal => goal !== undefined),
    [shift.companyGoalIds],
  );
  const goalProgressById = useMemo(() => {
    if (shiftGoals.length === 0) {
      return new Map<string, GoalProgressSnapshot>();
    }

    const metrics = buildShiftGoalMetrics({
      shift,
      dateSessions: save.dateSessions,
      members: save.members,
    });
    const snapshots = buildGoalProgressSnapshots({
      goals: shiftGoals,
      shiftStatus: shift.status,
      metrics,
      shiftReport: shift.report,
    });

    return new Map(snapshots.map((snapshot) => [snapshot.goalId, snapshot] as const));
  }, [save.dateSessions, save.members, shift, shiftGoals]);

  const suggestedPartner = useMemo(() => {
    if (activeFocus === null || activeBooking !== null) return null;
    const candidates: ScenarioFreeRecommendationCandidate<Member>[] = [];
    for (const candidate of candidatePartners) {
      const pairState = pairStateById.get(makePairId(activeFocus.id, candidate.id));
      if (pairState === undefined) continue;
      try {
        const signal = evaluateScenarioFreePairSignal({
          members: [activeFocus, candidate],
          pairState,
          activeRequests: activeFocusRequest === undefined ? [] : [activeFocusRequest],
          knownPairReads: visibleReadsForPair(save, pairState.id),
        });
        candidates.push({ candidate, signal });
      } catch {
        continue;
      }
    }
    return chooseScenarioFreeRecommendation(candidates);
  }, [activeFocus, activeFocusRequest, candidatePartners, save, pairStateById, activeBooking]);

  const orderedCandidatePartners = useMemo(
    () => moveSuggestedMemberFirst(candidatePartners, suggestedPartner?.id ?? null),
    [candidatePartners, suggestedPartner?.id],
  );

  const effectivePartner = useMemo(
    () =>
      partnerId === null
        ? suggestedPartner
        : (save.members.find((member) => member.id === partnerId) ?? null),
    [partnerId, suggestedPartner, save.members],
  );

  const offers = useMemo(() => activeBudgetDiscountOffers(save), [save]);
  const effectiveCostsByScenarioId = useMemo(
    () => computeEffectiveCosts(drawnScenarios, offers),
    [drawnScenarios, offers],
  );

  const roomReadByScenarioId = useMemo(() => {
    if (activeBooking === null) {
      return new Map<string, ScenarioRoomRead>();
    }
    const pairState = pairStateById.get(activeBooking.pairId);
    const focus = save.members.find((member) => member.id === activeBooking.focusMemberId);
    const partner = save.members.find(
      (member) =>
        member.id !== activeBooking.focusMemberId &&
        activeBooking.participantIds.includes(member.id),
    );
    if (pairState === undefined || focus === undefined || partner === undefined) {
      return new Map<string, ScenarioRoomRead>();
    }
    const map = new Map<string, ScenarioRoomRead>();
    for (const scenario of drawnScenarios) {
      try {
        const fit = evaluateMatchFit({
          members: [focus, partner],
          scenario,
          pairState,
          activeRequests: activeFocusRequest === undefined ? [] : [activeFocusRequest],
          knownPairReads: visibleReadsForPair(save, pairState.id),
        });
        map.set(scenario.id, scenarioRoomReadFromMatchFit(fit));
      } catch {
        continue;
      }
    }
    return map;
  }, [activeBooking, pairStateById, save, drawnScenarios, activeFocusRequest]);

  const shiftClosed = shift.status === "completed";
  const shiftDateAvailable = shift.dateSlotsUsed < shift.dateSlotsTotal;

  const canCommit =
    aiReady &&
    !isActionPending &&
    !isCommitted &&
    !shiftClosed &&
    !deckRepairBlocked &&
    shiftDateAvailable &&
    activeFocus !== null &&
    effectivePartner !== null &&
    activeFocus.state.status === "active" &&
    effectivePartner.state.status === "active";

  const canStart =
    aiReady && !isActionPending && isCommitted && !shiftClosed && selectedScenario !== null;

  const openMember = useMemo(
    () => save.members.find((member) => member.id === openMemberId) ?? null,
    [save.members, openMemberId],
  );
  const openMemberRequest = openMember === null ? undefined : requestForMember(openMember);

  return (
    <section className="relative mx-auto w-full max-w-canvas px-6 pb-44 pt-12 lg:px-12">
      <PreDateHeader
        shiftNumber={shift.shiftNumber}
        shiftDateAvailable={shiftDateAvailable}
        eligibleFocusCount={eligibleFocus.length}
        focusedTotal={focusedMembers.length}
        quitsRemaining={quitsRemaining}
        lossLimit={lossLimit}
        closureCount={save.closureCount}
        shiftClosed={shiftClosed}
        activeBookingLocked={isCommitted}
        isActionPending={isActionPending}
        onCloseShift={onCloseShift}
        onStartNextShift={onStartNextShift}
      />

      <ShiftBriefDock
        goals={shiftGoals}
        progressByGoalId={goalProgressById}
        activeFocus={activeFocus}
        activeFocusRequest={activeFocusRequest}
        shiftClosed={shiftClosed}
      />

      {focusedClosurePairs.length > 0 ? (
        <ClosureCallout
          entries={focusedClosurePairs}
          closingPairId={closingPairId}
          closureError={closureError}
          isActionPending={isActionPending}
          onConfirm={onConfirmClosure}
          onDismissError={onDismissClosureError}
        />
      ) : null}

      {deckRepairBlocked && !isCommitted ? (
        <DeckRepairCallout onOpenDateBook={onOpenDateBook} />
      ) : null}

      <Hairline className="mt-2" />

      <FocusStep
        sectionRef={focusSectionRef}
        selectedCardRef={selectedFocusCardRef}
        focusedMembers={focusedMembers}
        activeFocusId={activeFocusId}
        playerKnowledge={save.playerKnowledge}
        shiftNumber={shift.shiftNumber}
        requestForMember={requestForMember}
        revealAllMemberDetails={revealAllMemberDetails}
        locked={isCommitted}
        onSelect={setActiveFocusId}
        onOpenRoster={onOpenRoster}
        onExpand={(id) => setOpenMemberId(id)}
      />

      <Hairline className="mt-12" />

      <PartnerStep
        sectionRef={partnerSectionRef}
        selectedCardRef={selectedPartnerCardRef}
        activeFocus={activeFocus}
        candidatePartners={orderedCandidatePartners}
        partnerId={partnerId}
        suggestedPartnerId={suggestedPartner?.id ?? null}
        playerKnowledge={save.playerKnowledge}
        revealAllMemberDetails={revealAllMemberDetails}
        locked={isCommitted}
        onOpenRoster={onOpenRoster}
        onSelect={(id) => setPartnerId(id)}
        onExpand={(id) => setOpenMemberId(id)}
      />

      <Hairline className="mt-12" />

      <ScenarioStep
        sectionRef={dateSectionRef}
        selectedCardRef={selectedDateCardRef}
        drawnScenarios={drawnScenarios}
        selectedId={selectedScenario?.id ?? null}
        committed={isCommitted}
        effectiveCostsByScenarioId={effectiveCostsByScenarioId}
        roomReadByScenarioId={roomReadByScenarioId}
        onSelect={setScenarioId}
        onExpand={setOpenScenarioId}
        onOpenDateBook={onOpenDateBook}
      />

      <BeginDateDock
        focus={activeFocus}
        partner={effectivePartner}
        scenario={selectedScenario}
        canCommit={canCommit}
        canStart={canStart}
        isCommitted={isCommitted}
        aiReady={aiReady}
        deckRepairBlocked={deckRepairBlocked}
        shiftDateAvailable={shiftDateAvailable}
        shiftClosed={shiftClosed}
        onScrollTo={(step) => {
          const target: Record<BookingStep, () => HTMLElement | null> = {
            focus: () => selectedFocusCardRef.current ?? focusSectionRef.current,
            partner: () => selectedPartnerCardRef.current ?? partnerSectionRef.current,
            date: () => selectedDateCardRef.current ?? dateSectionRef.current,
          };
          scrollCardIntoView(target[step]());
        }}
        onCommit={() => {
          if (activeFocus !== null && effectivePartner !== null && !isCommitted) {
            onCommitPair({
              focusMemberId: activeFocus.id,
              partnerMemberId: effectivePartner.id,
            });
          }
        }}
        onStart={() => {
          if (selectedScenario !== null && isCommitted) {
            onStartDate({ scenarioId: selectedScenario.id });
          }
        }}
        onCancel={onCancelBooking}
      />

      {openMember === null ? null : (
        <MemberDetailsModal
          member={openMember}
          playerKnowledge={save.playerKnowledge}
          request={openMemberRequest}
          isFocused={focusedMembers.some((focus) => focus.id === openMember.id)}
          revealAllDetails={revealAllMemberDetails}
          onClose={() => setOpenMemberId(null)}
        />
      )}

      <AnimatePresence>
        {openScenario === null ? null : (
          <ScenarioDetailsModal
            scenario={openScenario}
            eyebrow="// date plan"
            onClose={() => setOpenScenarioId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function scrollCardIntoView(target: HTMLElement | null) {
  target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function DeckRepairCallout({ onOpenDateBook }: { onOpenDateBook: () => void }) {
  return (
    <div className="mt-6 rounded-card border border-amber-300/70 bg-amber-50/80 p-4 text-amber-900">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em]">
        // date book over budget
      </p>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          A budget cut put the deck above the cap. Drop cards in the Date Book before committing a
          new pair.
        </p>
        <GhostButton onClick={onOpenDateBook}>Open the date book →</GhostButton>
      </div>
    </div>
  );
}

function ShiftBriefDock({
  goals,
  progressByGoalId,
  activeFocus,
  activeFocusRequest,
  shiftClosed,
}: {
  goals: readonly CompanyGoal[];
  progressByGoalId: ReadonlyMap<string, GoalProgressSnapshot>;
  activeFocus: Member | null;
  activeFocusRequest: MemberRequest | undefined;
  shiftClosed: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (goals.length === 0 && activeFocusRequest === undefined) {
    return null;
  }

  const metGoalCount = goals.filter(
    (goal) => (progressByGoalId.get(goal.id) ?? fallbackGoalProgress(goal)).status === "met",
  ).length;
  const goalSummary = goals.length === 0 ? "case ask" : `${metGoalCount} / ${goals.length} clear`;
  const requestSummary =
    activeFocus === null
      ? "No focus case"
      : activeFocusRequest === undefined
        ? `${activeFocus.firstName} has no active ask on file.`
        : activeFocusRequest.text;

  return (
    <div className="mt-5 flex justify-end xl:fixed xl:right-6 xl:top-20 xl:z-40 xl:mt-0 xl:block xl:w-96">
      <motion.aside
        className="aura-glass w-full max-w-[34rem] overflow-hidden rounded-card shadow-aura-soft xl:max-w-none"
        aria-label="Shift brief"
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            data-sfx="menu"
            aria-expanded={isOpen}
            aria-controls="shift-brief-dock-body"
            onClick={() => setIsOpen((current) => !current)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-pill px-2 py-1.5 text-left transition hover:bg-white/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/45"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-aura-rose/10 text-aura-rose">
              <ShiftBriefGlyph />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-rose">
                // goals
              </span>
              <span className="mt-0.5 flex min-w-0 items-baseline gap-2">
                <span className="truncate font-display text-sm font-semibold tracking-tight text-aura-ink">
                  Shift brief
                </span>
                <span className="shrink-0 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint">
                  {goalSummary}
                </span>
              </span>
            </span>
          </button>

          <ShiftBriefIconButton
            label={isOpen ? "Collapse shift brief" : "Expand shift brief"}
            onClick={() => setIsOpen((current) => !current)}
          >
            <BriefChevronIcon open={isOpen} />
          </ShiftBriefIconButton>
        </div>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              id="shift-brief-dock-body"
              key="shift-brief-dock-body"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="border-t border-aura-hairline px-4 pb-4 pt-3">
                {goals.length > 0 ? (
                  <ul className="space-y-2.5">
                    {goals.map((goal) => (
                      <ShiftGoalItem
                        key={goal.id}
                        goal={goal}
                        progress={progressByGoalId.get(goal.id) ?? fallbackGoalProgress(goal)}
                      />
                    ))}
                  </ul>
                ) : null}

                <div
                  className={
                    goals.length > 0 ? "mt-3 border-t border-aura-hairline pt-3" : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
                      case ask
                    </p>
                    {shiftClosed ? (
                      <span className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint">
                        filed
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-normal break-words text-label leading-snug text-aura-ink">
                    {requestSummary}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.aside>
    </div>
  );
}

function ShiftGoalItem({ goal, progress }: { goal: CompanyGoal; progress: GoalProgressSnapshot }) {
  const showStatus = progress.status !== "open";

  return (
    <li className="min-w-0 rounded-chip px-2 py-1.5" title={goal.description}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          {progress.label}
        </span>
        {showStatus ? (
          <span
            className={`shrink-0 rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] ${goalStatusClass(
              progress.status,
            )}`}
          >
            {progress.status}
          </span>
        ) : null}
      </div>
      <p className="mt-1 whitespace-normal break-words text-sm font-semibold leading-snug text-aura-ink">
        {goal.title}
      </p>
    </li>
  );
}

function goalStatusClass(status: GoalProgressSnapshot["status"]): string {
  if (status === "met") {
    return "bg-aura-emerald/10 text-aura-emerald";
  }

  if (status === "missed") {
    return "bg-aura-rose/10 text-aura-rose";
  }

  return "bg-white/70 text-aura-muted";
}

function ShiftBriefIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-sfx="click"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:bg-white/55 hover:text-aura-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/45"
    >
      {children}
    </button>
  );
}

function ShiftBriefGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4">
      <path
        d="M4 4.5H12M4 8H10M4 11.5H11"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function BriefChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`size-4 transition ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4 6.5L8 10.5L12 6.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function PreDateHeader({
  shiftNumber,
  shiftDateAvailable,
  eligibleFocusCount,
  focusedTotal,
  quitsRemaining,
  lossLimit,
  closureCount,
  shiftClosed,
  activeBookingLocked,
  isActionPending,
  onCloseShift,
  onStartNextShift,
}: {
  shiftNumber: number;
  shiftDateAvailable: boolean;
  eligibleFocusCount: number;
  focusedTotal: number;
  quitsRemaining: number;
  lossLimit: number;
  closureCount: number;
  shiftClosed: boolean;
  activeBookingLocked: boolean;
  isActionPending: boolean;
  onCloseShift: () => void;
  onStartNextShift: () => void;
}) {
  const quitsTone =
    quitsRemaining <= 1
      ? "text-aura-rose"
      : quitsRemaining <= 2
        ? "text-aura-amber"
        : "text-aura-faint";

  return (
    <header className="mb-8">
      <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
        // livedate.shift.{pad2(shiftNumber)}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-aura-ink lg:text-4xl">
            Tonight's date
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-aura-muted">
            Pick a focus case, pick their partner, commit, then read the room. Cupid drafts the
            scenarios from your Date Book.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            <span>
              {shiftClosed
                ? "shift closed"
                : activeBookingLocked
                  ? "booking committed"
                  : shiftDateAvailable
                    ? "date open"
                    : "date booked"}
            </span>
            <span aria-hidden>•</span>
            <span>
              {eligibleFocusCount} ready / {focusedTotal} on file
            </span>
            <span aria-hidden>•</span>
            <span
              className={quitsTone}
              title={`Cap rises by 1 with each closed pair. ${closureCount} closure${closureCount === 1 ? "" : "s"} on file.`}
            >
              quits remaining: {quitsRemaining} / {lossLimit}
            </span>
          </div>
          {shiftClosed ? (
            <PrimaryButton onClick={onStartNextShift} disabled={isActionPending}>
              Open next shift →
            </PrimaryButton>
          ) : activeBookingLocked ? (
            <Tooltip
              message="Start or cancel the committed booking before filing this shift."
              placement="bottom-end"
            >
              <GhostButton disabled>Resolve booking first</GhostButton>
            </Tooltip>
          ) : shiftDateAvailable ? (
            <Tooltip
              message="End this shift without booking a date. Cupid files the day, applies any ignored request fallout, and lets you open the next shift."
              placement="bottom-end"
            >
              <GhostButton onClick={onCloseShift} disabled={isActionPending}>
                File the shift
              </GhostButton>
            </Tooltip>
          ) : (
            <PrimaryButton onClick={onCloseShift} disabled={isActionPending}>
              Close the shift →
            </PrimaryButton>
          )}
        </div>
      </div>
    </header>
  );
}

function StepHeader({
  index,
  eyebrow,
  title,
  hint,
  rightSlot,
}: {
  index: number;
  eyebrow: string;
  title: string;
  hint: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-full border border-aura-rose/30 bg-white font-display text-base font-semibold text-aura-rose shadow-quiet">
          {index}
        </span>
        <div>
          <p className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-aura-ink">
            {title}
          </h2>
          <p className="mt-1 max-w-xl text-xs text-aura-muted">{hint}</p>
        </div>
      </div>
      {rightSlot === undefined ? null : <div className="flex items-center gap-2">{rightSlot}</div>}
    </header>
  );
}

function FocusStep({
  sectionRef,
  selectedCardRef,
  focusedMembers,
  activeFocusId,
  playerKnowledge,
  shiftNumber,
  requestForMember,
  revealAllMemberDetails,
  locked,
  onSelect,
  onOpenRoster,
  onExpand,
}: {
  sectionRef: Ref<HTMLElement>;
  selectedCardRef: Ref<HTMLLIElement>;
  focusedMembers: Member[];
  activeFocusId: string | null;
  playerKnowledge: GameSave["playerKnowledge"];
  shiftNumber: number;
  requestForMember: (member: Member) => MemberRequest | undefined;
  revealAllMemberDetails: boolean;
  locked: boolean;
  onSelect: (id: string) => void;
  onOpenRoster: () => void;
  onExpand: (id: string) => void;
}) {
  return (
    <section ref={sectionRef} className="mt-10">
      <StepHeader
        index={1}
        eyebrow="// step.01.focus"
        title={locked ? "Focus case (locked)" : "Focus case"}
        hint={
          locked
            ? "Pair is committed. Resolve or cancel the booking to reassign focus."
            : "Pick which case you're working tonight. Cooldowns and closed files cannot be picked."
        }
        rightSlot={<GhostButton onClick={onOpenRoster}>Manage roster</GhostButton>}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {focusedMembers.map((member, index) => {
          const isActive = member.id === activeFocusId;
          const isInCooldown = isMemberInCooldown(member, shiftNumber);
          const askPreview =
            member.state.status === "active" ? requestForMember(member)?.text : undefined;
          const cardState: MemberCardState =
            member.state.status === "closed"
              ? "closed"
              : member.state.status === "quit"
                ? "quit"
                : isActive
                  ? "focused"
                  : "default";
          return (
            <MemberCard
              key={member.id}
              member={member}
              state={cardState}
              density="compact"
              playerKnowledge={playerKnowledge}
              revealAllDetails={revealAllMemberDetails}
              index={index}
              cardRef={isActive ? selectedCardRef : undefined}
              statusPill={buildFocusPill(member, isInCooldown)}
              askPreview={askPreview}
              disabled={locked || member.state.status !== "active" || isInCooldown}
              onClick={() => {
                if (locked) return;
                if (member.state.status === "active" && !isInCooldown) onSelect(member.id);
              }}
              onExpand={() => onExpand(member.id)}
            />
          );
        })}
        {!locked && focusedMembers.length < 4 ? (
          <li className="list-none">
            <button
              type="button"
              onClick={onOpenRoster}
              data-sfx="click"
              className="flex h-full min-h-[5.5rem] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-aura-rose/40 bg-white/40 px-4 py-6 font-mono text-micro uppercase tracking-[0.24em] text-aura-rose transition hover:bg-white/60"
            >
              + add focus case
            </button>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function PartnerStep({
  sectionRef,
  selectedCardRef,
  activeFocus,
  candidatePartners,
  partnerId,
  suggestedPartnerId,
  playerKnowledge,
  revealAllMemberDetails,
  locked,
  onOpenRoster,
  onSelect,
  onExpand,
}: {
  sectionRef: Ref<HTMLElement>;
  selectedCardRef: Ref<HTMLLIElement>;
  activeFocus: Member | null;
  candidatePartners: Member[];
  partnerId: string | null;
  suggestedPartnerId: string | null;
  playerKnowledge: GameSave["playerKnowledge"];
  revealAllMemberDetails: boolean;
  locked: boolean;
  onOpenRoster: () => void;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
}) {
  if (activeFocus === null) {
    return (
      <section ref={sectionRef} className="mt-10">
        <StepHeader
          index={2}
          eyebrow="// step.02.partner"
          title="Partner"
          hint="Pick a focus case first."
        />
      </section>
    );
  }

  if (candidatePartners.length === 0) {
    return (
      <section ref={sectionRef} className="mt-10">
        <StepHeader
          index={2}
          eyebrow="// step.02.partner"
          title={`Partner for ${activeFocus.firstName}`}
          hint="No eligible partners on file. Open the roster to add a focus case or wait out a cooldown."
          rightSlot={<GhostButton onClick={onOpenRoster}>Open roster</GhostButton>}
        />
      </section>
    );
  }

  const effectivePartnerId = partnerId ?? suggestedPartnerId;

  return (
    <section ref={sectionRef} className="mt-10">
      <StepHeader
        index={2}
        eyebrow="// step.02.partner"
        title={
          locked
            ? `Partner for ${activeFocus.firstName} (locked)`
            : `Partner for ${activeFocus.firstName}`
        }
        hint={
          locked
            ? "Pair is committed. The Date Book and partner are locked until the date resolves."
            : suggestedPartnerId === null
              ? "No clear recommendation on file. Pick any active member."
              : "Cupid found one clear booking recommendation. Tap any active member to override."
        }
        rightSlot={<GhostButton onClick={onOpenRoster}>Manage roster</GhostButton>}
      />
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {candidatePartners.map((member, index) => {
          const isPicked = member.id === effectivePartnerId;
          const isSuggested = member.id === suggestedPartnerId;
          const cardState: MemberCardState = isPicked ? "selected" : "default";
          const statusPill: MemberCardPill | undefined =
            isPicked && partnerId === null && isSuggested
              ? { tone: "ink", label: "recommended" }
              : isPicked
                ? { tone: "rose", label: "your pick" }
                : isSuggested
                  ? { tone: "ink", label: "recommended" }
                  : undefined;
          return (
            <MemberCard
              key={member.id}
              member={member}
              state={cardState}
              density="standard"
              playerKnowledge={playerKnowledge}
              revealAllDetails={revealAllMemberDetails}
              index={index}
              cardRef={isPicked ? selectedCardRef : undefined}
              statusPill={statusPill}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                onSelect(member.id);
              }}
              onExpand={() => onExpand(member.id)}
            />
          );
        })}
        {rosterGridFillerClasses(candidatePartners.length).map((fillerClass, fillerIndex) => (
          <PendingMemberCard key={`pending-${fillerIndex}`} className={fillerClass} />
        ))}
      </ul>
    </section>
  );
}

function ScenarioStep({
  sectionRef,
  selectedCardRef,
  drawnScenarios,
  selectedId,
  committed,
  effectiveCostsByScenarioId,
  roomReadByScenarioId,
  onSelect,
  onExpand,
  onOpenDateBook,
}: {
  sectionRef: Ref<HTMLElement>;
  selectedCardRef: Ref<HTMLDivElement>;
  drawnScenarios: DateScenario[];
  selectedId: string | null;
  committed: boolean;
  effectiveCostsByScenarioId: Record<string, number>;
  roomReadByScenarioId: ReadonlyMap<string, ScenarioRoomRead>;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  onOpenDateBook: () => void;
}) {
  return (
    <section ref={sectionRef} className="mt-10">
      <StepHeader
        index={3}
        eyebrow="// step.03.date"
        title={committed ? "Date plan" : "Date plan (locked until commit)"}
        hint={
          committed
            ? "Three cards drawn from your Date Book for this pair. Pick one to start the date."
            : "Commit the pair to draw three cards. Adjust the Date Book first if needed."
        }
        rightSlot={<GhostButton onClick={onOpenDateBook}>Open the date book</GhostButton>}
      />
      {!committed ? (
        <p className="text-sm text-aura-muted">
          Commit a focus and partner to draw three scenarios for this pair.
        </p>
      ) : drawnScenarios.length === 0 ? (
        <p className="text-sm text-aura-muted">
          No drawn hand yet. Cupid is waiting for the booking to settle.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {drawnScenarios.map((scenario) => (
            <div
              key={scenario.id}
              ref={selectedId === scenario.id ? selectedCardRef : undefined}
              className="min-w-0"
            >
              <ScenarioCard
                scenario={scenario}
                size="compact"
                state={selectedId === scenario.id ? "selected" : "default"}
                effectiveCost={effectiveCostsByScenarioId[scenario.id] ?? scenario.card.cost}
                roomRead={roomReadByScenarioId.get(scenario.id)}
                onClick={() => onSelect(scenario.id)}
                onExpand={() => onExpand(scenario.id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BeginDateDock({
  focus,
  partner,
  scenario,
  canCommit,
  canStart,
  isCommitted,
  aiReady,
  deckRepairBlocked,
  shiftDateAvailable,
  shiftClosed,
  onScrollTo,
  onCommit,
  onStart,
  onCancel,
}: {
  focus: Member | null;
  partner: Member | null;
  scenario: DateScenario | null;
  canCommit: boolean;
  canStart: boolean;
  isCommitted: boolean;
  aiReady: boolean;
  deckRepairBlocked: boolean;
  shiftDateAvailable: boolean;
  shiftClosed: boolean;
  onScrollTo: (step: BookingStep) => void;
  onCommit: () => void;
  onStart: () => void;
  onCancel: () => void;
}) {
  const status = !aiReady
    ? "ai not ready"
    : shiftClosed
      ? "shift filed, open the next one to book"
      : deckRepairBlocked && !isCommitted
        ? "date book is over budget, open it to repair"
        : !shiftDateAvailable && !isCommitted
          ? "this shift's date is already booked"
          : focus === null
            ? "pick a focus case"
            : partner === null
              ? "pick a partner"
              : isCommitted && scenario === null
                ? "pick a date plan"
                : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-6">
      <div className="aura-glass-strong pointer-events-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-pill px-5 py-2.5 shadow-aura-soft">
        <DockSummary focus={focus} partner={partner} scenario={scenario} onScrollTo={onScrollTo} />
        <div className="flex items-center gap-3">
          {status !== null ? (
            <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
              {status}
            </span>
          ) : null}
          {isCommitted ? (
            <>
              <GhostButton onClick={onCancel}>Cancel booking</GhostButton>
              <PrimaryButton onClick={onStart} disabled={!canStart}>
                Begin date →
              </PrimaryButton>
            </>
          ) : (
            <Tooltip
              message="Committing the pair starts the live date process. The hand is drawn, the Date Book locks, and you cannot switch members until the date resolves."
              placement="top-center"
            >
              <PrimaryButton onClick={onCommit} disabled={!canCommit}>
                Commit pair →
              </PrimaryButton>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function DockSummary({
  focus,
  partner,
  scenario,
  onScrollTo,
}: {
  focus: Member | null;
  partner: Member | null;
  scenario: DateScenario | null;
  onScrollTo: (step: BookingStep) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <DockChip label="focus" onClick={() => onScrollTo("focus")}>
        {focus === null ? (
          <span className="text-aura-faint">··</span>
        ) : (
          <span className="flex min-w-0 items-center gap-2">
            <Portrait member={focus} variant="transcript" />
            <span className="truncate font-display text-sm font-semibold tracking-tight">
              {focus.firstName}
            </span>
          </span>
        )}
      </DockChip>
      <DockDivider />
      <DockChip label="partner" onClick={() => onScrollTo("partner")}>
        {partner === null ? (
          <span className="text-aura-faint">··</span>
        ) : (
          <span className="flex min-w-0 items-center gap-2">
            <Portrait member={partner} variant="transcript" />
            <span className="truncate font-display text-sm font-semibold tracking-tight">
              {partner.firstName}
            </span>
          </span>
        )}
      </DockChip>
      <DockDivider />
      <DockChip label="date" onClick={() => onScrollTo("date")}>
        {scenario === null ? (
          <span className="text-aura-faint">··</span>
        ) : (
          <span className="flex min-w-0 items-center gap-2">
            <ScenarioDockAvatar scenario={scenario} />
            <span className="truncate font-display text-sm font-semibold tracking-tight">
              {scenario.title}
            </span>
          </span>
        )}
      </DockChip>
    </div>
  );
}

function ScenarioDockAvatar({ scenario }: { scenario: DateScenario }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [scenario.id]);

  return (
    <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/80 bg-[radial-gradient(circle_at_28%_24%,rgba(254,205,211,0.62)_0%,rgba(221,214,254,0.4)_52%,rgba(186,230,253,0.3)_100%)] shadow-quiet">
      {failed ? null : (
        <img
          src={scenarioBackdropPath(scenario.id)}
          alt=""
          decoding="async"
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full scale-110 object-cover object-center saturate-[1.12]"
        />
      )}
      <span aria-hidden className="absolute inset-0 bg-[rgba(255,253,249,0.18)]" />
      <span aria-hidden className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/65" />
    </span>
  );
}

function DockChip({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-sfx="click"
      aria-label={`Scroll to ${label}`}
      className="-mx-2 flex min-w-0 cursor-pointer flex-col rounded-2xl px-2 py-1 text-left transition hover:bg-white/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/45"
    >
      <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <span className="mt-1 flex min-w-0 items-center text-sm text-aura-ink">{children}</span>
    </button>
  );
}

function DockDivider() {
  return <span aria-hidden className="h-7 w-px bg-aura-hairline" />;
}

function buildFocusPill(member: Member, isInCooldown: boolean): MemberCardPill {
  if (member.state.status !== "active") {
    return { tone: "neutral", label: MEMBER_QUIT_RISK_LABEL[getMemberQuitRiskStatus(member)] };
  }
  if (isInCooldown) {
    return { tone: "amber", label: "cooldown" };
  }
  const status = getMemberQuitRiskStatus(member);
  if (status === "client_confidence_low" || status === "closed_file_risk") {
    return { tone: "rose", label: MEMBER_QUIT_RISK_LABEL[status] };
  }
  return { tone: "emerald", label: "ready" };
}

function ClosureCallout({
  entries,
  closingPairId,
  closureError,
  isActionPending,
  onConfirm,
  onDismissError,
}: {
  entries: ReadyClosurePair[];
  closingPairId: string | null;
  closureError: { pairId: string; message: string } | null;
  isActionPending: boolean;
  onConfirm: (pairId: string) => void;
  onDismissError: () => void;
}) {
  return (
    <section className="mb-6 mt-2 space-y-3">
      {entries.map((entry) => {
        const [first, second] = entry.participants;
        const isClosing = closingPairId === entry.pairState.id;
        const errorForEntry =
          closureError !== null && closureError.pairId === entry.pairState.id
            ? closureError.message
            : null;
        return (
          <article
            key={entry.pairState.id}
            className="aura-glass-strong relative flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-aura-rose/40 bg-white/80 p-4 shadow-aura-soft"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
                  <Portrait member={first} variant="card" />
                </span>
                <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
                  <Portrait member={second} variant="card" />
                </span>
              </div>
              <div>
                <p className="font-mono text-micro uppercase tracking-[0.26em] text-aura-rose">
                  // closure.ready
                </p>
                <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">
                  {first.firstName} and {second.firstName} are ready to delete the app.
                </h2>
                <p className="mt-1 text-xs text-aura-muted">
                  Close their case to file a pair memory, free their focus slots, and raise the
                  client cap by one.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PrimaryButton
                onClick={() => onConfirm(entry.pairState.id)}
                disabled={isActionPending || isClosing}
              >
                {isClosing ? "Filing closure…" : "Close their case →"}
              </PrimaryButton>
            </div>
            {errorForEntry !== null ? (
              <div className="basis-full rounded-2xl border border-aura-rose/30 bg-aura-rose/5 px-4 py-2 text-xs text-aura-rose">
                <div className="flex items-center justify-between gap-2">
                  <span>{errorForEntry}</span>
                  <button
                    type="button"
                    onClick={onDismissError}
                    data-sfx="click"
                    className="cursor-pointer rounded-pill border border-aura-rose/40 px-3 py-1 font-mono text-micro uppercase tracking-[0.18em]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

export type _ActiveDateBookingTypeAlias = ActiveDateBooking;
