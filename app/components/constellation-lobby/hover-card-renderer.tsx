import type { ReactElement } from "react";

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

export type HoverCardContext = {
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
  openCaseAndDismiss: (memberId: string) => void;
  /** Promote an already-focused member to the current shift's lead. */
  onMakeLead: (memberId: string) => void;
  /** Make an eligible partner candidate the partner for this shift. */
  onMakePartner: (memberId: string) => void;
  /**
   * Add a member to the focused set. If there's no current lead, also set
   * this member as the lead. Returns undefined when adding a focus is
   * unsupported (e.g. when the parent didn't provide an add-focus handler).
   */
  onMakeFocus: ((memberId: string) => void) | undefined;
};

/**
 * Render the knowledge-gated HoverDetailCard for a star. Pure render function:
 * recreate per parent render; the rendered card is small and downstream
 * consumers don't memoize on the function reference.
 */
export function renderLobbyHoverCard(ctx: HoverCardContext, star: StarMark): ReactElement {
  const {
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
    openCaseAndDismiss,
    onMakeLead,
    onMakePartner,
    onMakeFocus,
  } = ctx;
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
      onMakeLead(member.id);
    };
  } else if (status !== "active" || isFocused) {
    ctaVariant = "view_case";
    onPrimaryAction = () => openCaseAndDismiss(member.id);
  } else if (isPartnerCandidate) {
    ctaVariant = "make_partner";
    onPrimaryAction = () => {
      if (partnerStep.active) partnerStep.complete();
      onMakePartner(member.id);
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
      onMakeFocus === undefined
        ? undefined
        : () => {
            if (focusStep.active) focusStep.complete();
            onMakeFocus(member.id);
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
