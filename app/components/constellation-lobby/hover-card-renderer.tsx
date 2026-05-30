import type { ReactElement } from "react";

import type { ActiveDateBooking, GameSave, ShiftState } from "../../domain/game";
import { sessionBelongsToShift } from "../../services/date-engine";
import { FOCUS_SWAP_RETENTION_PENALTY } from "../../services/focus-cases";
import {
  resolveFocusSelectionAffordance,
  resolveHoverCardCta,
  type HoverCardCta,
} from "../../services/focus-selection-affordance";
import { collectMemberOpenLoops } from "../../services/member-feedback";
import { buildVisibleMemberProfile } from "../../services/player-knowledge";
import { collectMemberUnmetAsks } from "../../services/shift-request-assessment";
import type { ShiftPartnerUnavailableReason } from "../../services/shift-availability";
import type { TutorialStepHandle } from "../../services/tutorial";
import { caseFileNumber } from "../member-card-atoms";
import { HoverDetailCard, type HoverDetailCtaVariant } from "./hover-detail-card";
import { RecentNotesSlot } from "./recent-notes-slot";
import type { StarMark } from "./types";

export type HoverCardContext = {
  save: GameSave;
  /** Active shift, used to surface the member's still-open asks on the card. */
  shift: ShiftState;
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
   * Members surfaced as follow-up partners for this shift. Used to show a
   * "follow-up" badge on the hover card so the player knows the cooldown is
   * being bypassed because they filed Pursue on a recent date.
   */
  followUpPartnerIds: ReadonlySet<string>;
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
    shift,
    focusedSet,
    revealAllMemberDetails,
    focusId,
    partnerId,
    activeBooking,
    eligiblePartnerIds,
    unavailabilityReasonById,
    followUpPartnerIds,
    shiftNumber,
    focusStep,
    partnerStep,
    openCaseAndDismiss,
    onMakeLead,
    onMakePartner,
    onMakeFocus,
  } = ctx;
  const member = star.member;
  const isActive = member.state.status === "active";
  const openLoops = isActive ? collectMemberOpenLoops(member.id, save.pairStates) : [];
  const unmetAsks = isActive
    ? collectMemberUnmetAsks({
        memberId: member.id,
        shift,
        completedDates: save.dateSessions.filter(
          (session) =>
            sessionBelongsToShift(session, shift.shiftNumber) && session.status !== "active",
        ),
      })
    : [];
  const profile = buildVisibleMemberProfile(member, save.playerKnowledge, {
    visibilityMode: revealAllMemberDetails ? "dev_unveiled" : "earned",
  });
  const isFocused = focusedSet.has(member.id);
  const status = member.state.status;
  const affordance = resolveFocusSelectionAffordance({
    member,
    focused: isFocused,
    focusId,
    partnerId,
    activeBooking,
    shiftNumber,
    followUpExempt: followUpPartnerIds.has(member.id),
  });
  const isPartnerCandidate =
    focusId !== null &&
    partnerId === null &&
    member.id !== focusId &&
    status === "active" &&
    eligiblePartnerIds.has(member.id);

  const cta = resolveHoverCardCta({
    affordance,
    isFocused,
    isPartnerCandidate,
    status,
    focusedCount: save.focusedMemberIds.length,
    swapPenalty: FOCUS_SWAP_RETENTION_PENALTY,
  });
  const { ctaVariant, onPrimaryAction, swapPenalty } = resolveCtaRender(cta, {
    memberId: member.id,
    focusStep,
    partnerStep,
    openCaseAndDismiss,
    onMakeLead,
    onMakePartner,
    onMakeFocus,
  });

  // Resolve a single blockReason string, preferring the affordance reason
  // (in-flight cooldown copy is more specific) and falling back to the
  // shift-availability reason so the player sees *why* an off-tonight or
  // career-locked partner is unbookable.
  const unavailabilityReason = unavailabilityReasonById.get(member.id);
  const blockReason =
    affordance.blockReason ??
    (unavailabilityReason === undefined
      ? undefined
      : unavailabilityReasonCopy(unavailabilityReason));

  // Follow-up partners win the badge over the affordance default so the
  // player sees *why* a member who would normally be in cooldown is bookable.
  const statusBadge = followUpPartnerIds.has(member.id) ? "follow_up" : affordance.statusBadge;

  return (
    <HoverDetailCard
      star={star}
      snippet={profile.publicFragments[0] ?? "Profile reads on file."}
      fileNumber={caseFileNumber(member.id)}
      heightInInches={member.characterHeightInInches}
      statusBadge={statusBadge}
      swapPenalty={swapPenalty}
      ctaVariant={ctaVariant}
      onPrimaryAction={onPrimaryAction}
      onOpenCase={() => openCaseAndDismiss(member.id)}
      recentNotesSlot={<RecentNotesSlot memberId={member.id} memories={save.memories} />}
      blockReason={blockReason}
      openLoops={openLoops}
      unmetAsks={unmetAsks}
    />
  );
}

/**
 * Map the typed CTA decision to the render-shape the HoverDetailCard expects.
 * Wraps `onMakeFocus` in the optional-handler check that's specific to the
 * production lobby (the spike doesn't pass one).
 */
function resolveCtaRender(
  cta: HoverCardCta,
  handlers: {
    memberId: string;
    focusStep: TutorialStepHandle;
    partnerStep: TutorialStepHandle;
    openCaseAndDismiss: (memberId: string) => void;
    onMakeLead: (memberId: string) => void;
    onMakePartner: (memberId: string) => void;
    onMakeFocus: ((memberId: string) => void) | undefined;
  },
): {
  ctaVariant: HoverDetailCtaVariant;
  onPrimaryAction: (() => void) | undefined;
  swapPenalty: number | undefined;
} {
  const { memberId, focusStep, partnerStep, openCaseAndDismiss } = handlers;
  switch (cta.kind) {
    case "make_lead":
      return {
        ctaVariant: "make_lead",
        onPrimaryAction: () => {
          if (focusStep.active) focusStep.complete();
          handlers.onMakeLead(memberId);
        },
        swapPenalty: undefined,
      };
    case "make_partner":
      return {
        ctaVariant: "make_partner",
        onPrimaryAction: () => {
          if (partnerStep.active) partnerStep.complete();
          handlers.onMakePartner(memberId);
        },
        swapPenalty: undefined,
      };
    case "make_focus":
      return {
        ctaVariant: "make_focus",
        onPrimaryAction:
          handlers.onMakeFocus === undefined
            ? undefined
            : () => {
                if (focusStep.active) focusStep.complete();
                handlers.onMakeFocus?.(memberId);
              },
        swapPenalty: undefined,
      };
    case "swap_into_focus":
      return {
        ctaVariant: "swap_into_focus",
        onPrimaryAction: () => openCaseAndDismiss(memberId),
        swapPenalty: cta.penalty,
      };
    case "view_case":
      return {
        ctaVariant: "view_case",
        onPrimaryAction: () => openCaseAndDismiss(memberId),
        swapPenalty: undefined,
      };
  }
}

function unavailabilityReasonCopy(reason: ShiftPartnerUnavailableReason): string {
  switch (reason) {
    case "focus_case":
      return "Currently a focus case";
    case "cooldown":
      return "In cooldown until next shift";
    case "closed":
      return "File is closed";
    case "closed_lane":
      return "Romantic lane closed";
    case "quit":
      return "Quit the program";
    case "off_shift":
      return "Off-rotation this shift";
  }
}
