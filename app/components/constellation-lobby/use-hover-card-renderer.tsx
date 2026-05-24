import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { ActiveDateBooking, GameSave } from "../../domain/game";
import { FOCUS_CASE_LIMIT, FOCUS_SWAP_RETENTION_PENALTY } from "../../services/focus-cases";
import { resolveFocusSelectionAffordance } from "../../services/focus-selection-affordance";
import { buildVisibleMemberProfile } from "../../services/player-knowledge";
import type { ShiftPartnerUnavailableReason } from "../../services/shift-availability";
import type { TutorialStepHandle } from "../../services/tutorial";
import { caseFileNumber } from "../member-card-atoms";
import { HoverDetailCard, type HoverDetailCtaVariant } from "./hover-detail-card";
import { RecentNotesSlot } from "./recent-notes-slot";
import type { StarMark } from "./types";

export function useHoverCardRenderer({
  save,
  focusedSet,
  revealAllMemberDetails,
  focusId,
  partnerId,
  activeBooking,
  eligiblePartnerIds,
  unavailabilityReasonById,
  shiftNumber,
  focusStep,
  partnerStep,
  onAddFocus,
  openCaseAndDismiss,
  setFocusId,
  setPartnerId,
  setActiveStarId,
}: {
  save: GameSave;
  focusedSet: ReadonlySet<string>;
  revealAllMemberDetails: boolean;
  focusId: string | null;
  partnerId: string | null;
  activeBooking: ActiveDateBooking | null;
  eligiblePartnerIds: ReadonlySet<string>;
  /**
   * Per-member unavailability reason from `classifyShiftPartners` /
   * `shiftPartnerUnavailableReason`. Surfaced on off-tonight stars so the
   * hover card explains *why* the partner is unbookable (career-locked,
   * off-rotation, cooldown, etc.) without reopening a separate roster rail.
   */
  unavailabilityReasonById: ReadonlyMap<string, ShiftPartnerUnavailableReason>;
  /**
   * Active shift number, used to evaluate `isMemberInCooldown(member, …)`.
   * Cooldown blocks Make-lead / Make-focus from the card so the engine's
   * post-commit throw at `commitDateBooking` never has to be the first
   * signal the player sees.
   */
  shiftNumber: number;
  focusStep: TutorialStepHandle;
  partnerStep: TutorialStepHandle;
  onAddFocus: ((memberId: string) => void) | undefined;
  openCaseAndDismiss: (memberId: string) => void;
  setFocusId: Dispatch<SetStateAction<string | null>>;
  setPartnerId: Dispatch<SetStateAction<string | null>>;
  setActiveStarId: Dispatch<SetStateAction<string | null>>;
}) {
  // useTutorialStep returns a fresh `{ active, complete, … }` object every
  // render; passing the whole handle into deps defeats this memo and rebuilds
  // renderHoverCard on every parent render. Destructure to primitives /
  // stable callbacks so the deps array can compare with Object.is.
  const focusStepActive = focusStep.active;
  const focusStepComplete = focusStep.complete;
  const partnerStepActive = partnerStep.active;
  const partnerStepComplete = partnerStep.complete;
  return useCallback(
    ({ star }: { star: StarMark }) => {
      const member = star.member;
      const profile = buildVisibleMemberProfile(member, save.playerKnowledge, {
        visibilityMode: revealAllMemberDetails ? "dev_unveiled" : "earned",
      });
      const isFocused = focusedSet.has(member.id);
      const status = member.state.status;
      const slotsFull = save.focusedMemberIds.length >= FOCUS_CASE_LIMIT;
      const focusAffordance = resolveFocusSelectionAffordance({
        member,
        focused: isFocused,
        focusId,
        partnerId,
        activeBooking,
        shiftNumber,
      });
      const isPartnerCandidate =
        focusId !== null &&
        partnerId === null &&
        member.id !== focusId &&
        status === "active" &&
        eligiblePartnerIds.has(member.id);

      let ctaVariant: HoverDetailCtaVariant = "view_case";
      let onPrimaryAction: (() => void) | undefined = undefined;

      if (focusAffordance.canMakeLead) {
        ctaVariant = "make_lead";
        onPrimaryAction = () => {
          if (focusStepActive) focusStepComplete();
          setFocusId(member.id);
          setActiveStarId(null);
        };
      } else if (status !== "active" || isFocused) {
        ctaVariant = "view_case";
        onPrimaryAction = () => openCaseAndDismiss(member.id);
      } else if (isPartnerCandidate) {
        ctaVariant = "make_partner";
        onPrimaryAction = () => {
          if (partnerStepActive) partnerStepComplete();
          setPartnerId(member.id);
          setActiveStarId(null);
        };
      } else if (!focusAffordance.eligibleForFocus) {
        ctaVariant = "view_case";
        onPrimaryAction = () => openCaseAndDismiss(member.id);
      } else if (focusAffordance.inCooldown) {
        // Roster star whose member is cooling. Don't offer Make focus — view
        // the file instead. The block reason copy below explains the gate.
        ctaVariant = "view_case";
        onPrimaryAction = () => openCaseAndDismiss(member.id);
      } else if (slotsFull) {
        ctaVariant = "swap_into_focus";
        onPrimaryAction = () => openCaseAndDismiss(member.id);
      } else {
        ctaVariant = "make_focus";
        onPrimaryAction =
          onAddFocus === undefined
            ? undefined
            : () => {
                if (focusStepActive) focusStepComplete();
                onAddFocus(member.id);
                setFocusId((current) => current ?? member.id);
                setActiveStarId(null);
              };
      }

      // Resolve a single blockReason string, preferring the affordance reason
      // (in-flight cooldown copy is more specific) and falling back to the
      // shift-availability reason so the player sees *why* an off-tonight or
      // career-locked partner is unbookable.
      const unavailabilityReason = unavailabilityReasonById.get(member.id);
      const blockReason =
        focusAffordance.blockReason ??
        (unavailabilityReason === undefined
          ? undefined
          : unavailabilityReasonCopy(unavailabilityReason));

      return (
        <HoverDetailCard
          star={star}
          snippet={profile.publicFragments[0] ?? "Profile reads on file."}
          fileNumber={caseFileNumber(member.id)}
          heightInInches={member.characterHeightInInches}
          statusBadge={focusAffordance.statusBadge}
          swapPenalty={ctaVariant === "swap_into_focus" ? FOCUS_SWAP_RETENTION_PENALTY : undefined}
          ctaVariant={ctaVariant}
          onPrimaryAction={onPrimaryAction}
          onOpenCase={() => openCaseAndDismiss(member.id)}
          recentNotesSlot={<RecentNotesSlot memberId={member.id} memories={save.memories} />}
          blockReason={blockReason}
        />
      );
    },
    [
      save.playerKnowledge,
      save.focusedMemberIds.length,
      save.memories,
      focusedSet,
      revealAllMemberDetails,
      onAddFocus,
      focusId,
      partnerId,
      activeBooking,
      eligiblePartnerIds,
      unavailabilityReasonById,
      shiftNumber,
      openCaseAndDismiss,
      focusStepActive,
      focusStepComplete,
      partnerStepActive,
      partnerStepComplete,
      setFocusId,
      setPartnerId,
      setActiveStarId,
    ],
  );
}

function unavailabilityReasonCopy(reason: ShiftPartnerUnavailableReason): string {
  switch (reason) {
    case "focus_case":
      return "Currently a focus case";
    case "cooldown":
      return "In cooldown until next shift";
    case "closed":
      return "File is closed";
    case "quit":
      return "Quit the program";
    case "off_shift":
      return "Off-rotation this shift";
  }
}
