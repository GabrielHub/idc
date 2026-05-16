import { AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
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
  getQuitMembers,
  type GoalProgressSnapshot,
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
import { useTutorialStep } from "../services/tutorial";
import { Hairline } from "./dashboard-atoms";
import { MemberDetailsModal } from "./member-card";
import { ScenarioDetailsModal } from "./scenario-details-modal";
import { TutorialCoachMark, TutorialPulseRing, TutorialSpotlight } from "./tutorial";

import { ClosureCallout, DeckRepairCallout } from "./pre-date-canvas-callouts";
import { BeginDateDock } from "./pre-date-canvas-dock";
import { PreDateHeader } from "./pre-date-canvas-header";
import { ShiftBriefDock } from "./pre-date-canvas-shift-brief";
import { FocusStep, PartnerStep, ScenarioStep } from "./pre-date-canvas-steps";

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
  onTutorialUpdate: (next: GameSave) => void;
  onCommitPair: (input: { focusMemberId: string; partnerMemberId: string }) => void;
  onStartDate: (input: { scenarioId: string }) => void;
  onCancelBooking: () => void;
  onConfirmClosure: (pairId: string) => void;
  onDismissClosureError: () => void;
  onOpenDateBook: () => void;
  onOpenRoster: () => void;
  onOpenPairFile?: (pairId: string) => void;
  onOpenAiSetup: () => void;
  onCloseShift: () => void;
  onStartNextShift: () => void;
  onDeckOverBudgetBlocked?: (surfaceKey: string) => void;
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
  onTutorialUpdate,
  onCommitPair,
  onStartDate,
  onCancelBooking,
  onConfirmClosure,
  onDismissClosureError,
  onOpenDateBook,
  onOpenRoster,
  onOpenPairFile,
  onOpenAiSetup,
  onCloseShift,
  onStartNextShift,
  onDeckOverBudgetBlocked,
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
  const postDateReturn = useMemo(
    () =>
      save.dateSessions.some(
        (session) => session.status === "completed" || session.status === "ended_early",
      ),
    [save.dateSessions],
  );
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
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [openScenarioId, setOpenScenarioId] = useState<string | null>(null);
  const focusSectionRef = useRef<HTMLElement | null>(null);
  const partnerSectionRef = useRef<HTMLElement | null>(null);
  const dateSectionRef = useRef<HTMLElement | null>(null);
  const selectedDateCardRef = useRef<HTMLDivElement | null>(null);
  const selectedFocusCardRef = useRef<HTMLLIElement | null>(null);
  const selectedPartnerCardRef = useRef<HTMLLIElement | null>(null);
  const commitCtaRef = useRef<HTMLButtonElement | null>(null);
  const beginCtaRef = useRef<HTMLButtonElement | null>(null);
  const fileShiftCtaRef = useRef<HTMLButtonElement | null>(null);

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
    setScenarioId(null);
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

  const planningGate = !isCommitted && !shiftClosed && activeFocus !== null;
  const partnerGate = planningGate && candidatePartners.length > 0;
  const scenarioGate = isCommitted && drawnScenarios.length > 0 && selectedScenario === null;
  const fileShiftGate = postDateReturn && !shiftClosed && !isCommitted;
  const closureReadyGate = focusedClosurePairs.length > 0 && !isCommitted;
  const cooldownBlockGate =
    !isCommitted &&
    !shiftClosed &&
    focusedMembers.length > 0 &&
    eligibleFocus.length < focusedMembers.length;

  const planningFocusStep = useTutorialStep(save, "planning.focus", planningGate, onTutorialUpdate);
  const planningPartnerStep = useTutorialStep(
    save,
    "planning.partner",
    partnerGate && planningFocusStep.done,
    onTutorialUpdate,
  );
  const planningCommitStep = useTutorialStep(
    save,
    "planning.commit",
    canCommit && planningPartnerStep.done,
    onTutorialUpdate,
  );
  const planningScenarioStep = useTutorialStep(
    save,
    "planning.scenario",
    scenarioGate,
    onTutorialUpdate,
  );
  const planningBeginStep = useTutorialStep(
    save,
    "planning.begin",
    canStart && planningScenarioStep.done,
    onTutorialUpdate,
  );
  const fileShiftStep = useTutorialStep(
    save,
    "planning.file-shift",
    fileShiftGate,
    onTutorialUpdate,
  );
  const closureReadyStep = useTutorialStep(
    save,
    "lazy.closure-ready",
    closureReadyGate && !planningFocusStep.active && !planningPartnerStep.active,
    onTutorialUpdate,
  );
  const cooldownBlockStep = useTutorialStep(
    save,
    "lazy.cooldown-block",
    cooldownBlockGate && !planningFocusStep.active && !planningPartnerStep.active,
    onTutorialUpdate,
  );
  const closureCalloutRef = useRef<HTMLDivElement | null>(null);
  const lastDeckBlockedSurfaceRef = useRef<string | null>(null);
  useEffect(() => {
    if (onDeckOverBudgetBlocked === undefined) return;
    if (!deckRepairBlocked || isCommitted) {
      lastDeckBlockedSurfaceRef.current = null;
      return;
    }
    const surfaceKey = `${shift.id}-${shift.shiftNumber}`;
    if (lastDeckBlockedSurfaceRef.current === surfaceKey) return;
    lastDeckBlockedSurfaceRef.current = surfaceKey;
    onDeckOverBudgetBlocked(surfaceKey);
  }, [deckRepairBlocked, isCommitted, onDeckOverBudgetBlocked, shift.id, shift.shiftNumber]);

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
        fileShiftButtonRef={fileShiftCtaRef}
        onCloseShift={() => {
          if (fileShiftStep.active) fileShiftStep.complete();
          onCloseShift();
        }}
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
        <div ref={closureCalloutRef}>
          <ClosureCallout
            entries={focusedClosurePairs}
            closingPairId={closingPairId}
            closureError={closureError}
            isActionPending={isActionPending}
            onConfirm={onConfirmClosure}
            onDismissError={onDismissClosureError}
          />
        </div>
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
        onSelect={(id) => {
          setActiveFocusId(id);
          if (planningFocusStep.active) planningFocusStep.complete();
        }}
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
        onSelect={(id) => {
          setPartnerId(id);
          if (planningPartnerStep.active) planningPartnerStep.complete();
        }}
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
        onSelect={(id) => {
          setScenarioId(id);
          if (planningScenarioStep.active) planningScenarioStep.complete();
        }}
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
        commitButtonRef={commitCtaRef}
        beginButtonRef={beginCtaRef}
        onOpenAiSetup={onOpenAiSetup}
        onOpenPairFile={onOpenPairFile}
        onScrollTo={(step) => {
          const target =
            step === "focus"
              ? (selectedFocusCardRef.current ?? focusSectionRef.current)
              : step === "partner"
                ? (selectedPartnerCardRef.current ?? partnerSectionRef.current)
                : (selectedDateCardRef.current ?? dateSectionRef.current);
          scrollCardIntoView(target);
        }}
        onCommit={() => {
          if (activeFocus !== null && effectivePartner !== null && !isCommitted) {
            if (planningCommitStep.active) planningCommitStep.complete();
            onCommitPair({
              focusMemberId: activeFocus.id,
              partnerMemberId: effectivePartner.id,
            });
          }
        }}
        onStart={() => {
          if (selectedScenario !== null && isCommitted) {
            if (planningBeginStep.active) planningBeginStep.complete();
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
          save={save}
          onTutorialUpdate={onTutorialUpdate}
          onClose={() => setOpenMemberId(null)}
        />
      )}

      <AnimatePresence>
        {openScenario === null ? null : (
          <ScenarioDetailsModal
            scenario={openScenario}
            eyebrow="// date plan"
            save={save}
            onTutorialUpdate={onTutorialUpdate}
            onClose={() => setOpenScenarioId(null)}
          />
        )}
      </AnimatePresence>

      {planningFocusStep.active ? (
        <TutorialCoachMark
          target={[selectedFocusCardRef, focusSectionRef]}
          placement="right"
          title="Pick a focus case"
          body="Tonight runs on one focus case and one different partner. Tap the case Cupid opened to confirm it, or pick another from your four."
          stepIndex={0}
          stepCount={3}
          dismissLabel="Skip tour"
          onDismiss={planningFocusStep.dismiss}
        />
      ) : null}

      {planningPartnerStep.active ? (
        <>
          <TutorialSpotlight target={[selectedPartnerCardRef, partnerSectionRef]} />
          <TutorialCoachMark
            target={[selectedPartnerCardRef, partnerSectionRef]}
            placement="right"
            title="Pick one partner"
            body="Tonight needs two different members. Tap a partner card to lock the choice. Cupid may recommend one, and you may overrule the machine."
            stepIndex={1}
            stepCount={3}
            dismissLabel="Skip tour"
            onDismiss={planningPartnerStep.dismiss}
          />
        </>
      ) : null}

      {planningCommitStep.active ? (
        <>
          <TutorialPulseRing target={commitCtaRef} padding={6} radius={28} />
          <TutorialCoachMark
            target={commitCtaRef}
            placement="top"
            title="Commit the pair"
            body="Commit locks the two members, reserves this shift's date, snapshots the Date Book, and draws three scenario cards. Procurement hates surprises."
            stepIndex={2}
            stepCount={3}
            dismissLabel="Skip tour"
            onDismiss={planningCommitStep.dismiss}
          />
        </>
      ) : null}

      {planningScenarioStep.active ? (
        <>
          <TutorialSpotlight target={[selectedDateCardRef, dateSectionRef]} />
          <TutorialCoachMark
            target={[selectedDateCardRef, dateSectionRef]}
            placement="top"
            title="Pick one room"
            body="These three came from your Date Book. Room Read is a warning, not a verdict. The Judge still waits for transcript evidence."
            dismissLabel="Skip tour"
            onDismiss={planningScenarioStep.dismiss}
          />
        </>
      ) : null}

      {planningBeginStep.active ? (
        <>
          <TutorialPulseRing target={beginCtaRef} padding={6} radius={28} />
          <TutorialCoachMark
            target={beginCtaRef}
            placement="top"
            title="Begin the date"
            body="Cupid opens the room. Once the date starts, the deck is locked and the pair stays committed until the file resolves."
            primaryLabel="Begin"
            onPrimary={() => {
              planningBeginStep.complete();
              if (selectedScenario !== null && isCommitted) {
                onStartDate({ scenarioId: selectedScenario.id });
              }
            }}
            dismissLabel="Skip tour"
            onDismiss={planningBeginStep.dismiss}
          />
        </>
      ) : null}

      {fileShiftStep.active ? (
        <>
          <TutorialPulseRing target={fileShiftCtaRef} padding={6} radius={28} />
          <TutorialCoachMark
            target={fileShiftCtaRef}
            placement="bottom"
            title="File the shift"
            body="One shift, one date. File it when the date is settled. Cupid will score goals, rotate pressure, and pretend this was a normal evening."
            dismissLabel="Skip tour"
            onDismiss={fileShiftStep.dismiss}
          />
        </>
      ) : null}

      {closureReadyStep.active ? (
        <TutorialCoachMark
          target={closureCalloutRef}
          placement="bottom"
          title="Closure is permanent"
          body="A pair is ready to delete the app. Close their case to free two focus slots, raise the client cap by one, and file a permanent pair memory. There is no rebooking after closure."
          primaryLabel="Got it"
          onPrimary={closureReadyStep.complete}
          dismissLabel="Skip tour"
          onDismiss={closureReadyStep.dismiss}
        />
      ) : null}

      {!closureReadyStep.active && cooldownBlockStep.active ? (
        <TutorialCoachMark
          target={focusSectionRef}
          placement="right"
          title="One of these is in cooldown"
          body="A focus card greys out when the member needs space after their last date. Cooldowns end on the next shift. The roster shows their status."
          primaryLabel="Got it"
          onPrimary={cooldownBlockStep.complete}
          dismissLabel="Skip tour"
          onDismiss={cooldownBlockStep.dismiss}
        />
      ) : null}
    </section>
  );
}

function scrollCardIntoView(target: HTMLElement | null) {
  target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}
