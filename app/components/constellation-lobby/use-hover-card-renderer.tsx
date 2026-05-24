import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { GameSave, ShiftState } from "../../domain/game";
import { FOCUS_CASE_LIMIT, FOCUS_SWAP_RETENTION_PENALTY } from "../../services/focus-cases";
import { resolveFocusSelectionAffordance } from "../../services/focus-selection-affordance";
import { buildVisibleMemberProfile } from "../../services/player-knowledge";
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
  activeBooking: ShiftState["activeBooking"] | null;
  eligiblePartnerIds: ReadonlySet<string>;
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
          if (focusStep.active) focusStep.complete();
          setFocusId(member.id);
          setActiveStarId(null);
        };
      } else if (status !== "active" || isFocused) {
        ctaVariant = "view_case";
        onPrimaryAction = () => openCaseAndDismiss(member.id);
      } else if (isPartnerCandidate) {
        ctaVariant = "make_partner";
        onPrimaryAction = () => {
          if (partnerStep.active) partnerStep.complete();
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
                if (focusStep.active) focusStep.complete();
                onAddFocus(member.id);
                setFocusId((current) => current ?? member.id);
                setActiveStarId(null);
              };
      }

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
          blockReason={focusAffordance.blockReason}
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
      shiftNumber,
      openCaseAndDismiss,
      focusStep,
      partnerStep,
      setFocusId,
      setPartnerId,
      setActiveStarId,
    ],
  );
}
