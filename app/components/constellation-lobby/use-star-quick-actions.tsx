import type { ShiftState } from "../../domain/game";
import type { ShiftPartnerUnavailableReason } from "../../services/shift-availability";
import type { TutorialStepHandle } from "../../services/tutorial";
import { CaseFileIcon, ClearIcon, SelectIcon, SwapIcon } from "./star-quick-action-icons";
import type { StarMark, StarQuickAction, ViewMode } from "./types";

/**
 * Policy: who can be made the lead vs the partner, and what the inline
 * select / clear quick action says.
 */
export type StarSelectionPolicy = {
  focusId: string | null;
  partnerId: string | null;
  focusedSet: ReadonlySet<string>;
  eligiblePartnerIds: ReadonlySet<string>;
  focusStep: TutorialStepHandle;
  partnerStep: TutorialStepHandle;
  onClearFocus: () => void;
  onClearPartner: () => void;
  onMakeLead: (memberId: string) => void;
  onMakePartner: (memberId: string) => void;
};

/**
 * Policy: when partner roster swaps are allowed, and which member is the
 * source vs destination. Bookkeeping flags (planningLocked, partnerSwapUsed,
 * followUpPinned) live here so the menu can render an explanatory tooltip
 * on disabled swap actions.
 */
export type StarSwapPolicy = {
  shift: ShiftState;
  activeBooking: NonNullable<ShiftState["activeBooking"]> | null;
  activePartnerSwapSourceId: string | null;
  focusedSet: ReadonlySet<string>;
  eligiblePartnerIds: ReadonlySet<string>;
  offTonightIds: ReadonlySet<string>;
  followUpPartnerIds: ReadonlySet<string>;
  unavailabilityReasonById: ReadonlyMap<string, ShiftPartnerUnavailableReason>;
  onReselectFocus: ((nextFocusIds: string[]) => void) | undefined;
  onSwapShiftPartner:
    | ((input: {
        outgoingPartnerMemberId: string;
        incomingPartnerMemberId: string;
      }) => Promise<boolean>)
    | undefined;
  requestReselectDroppingFocus: (focusMemberId: string) => void;
  startPartnerSwap: (memberId: string) => void;
  swapInPartner: (incomingPartnerMemberId: string) => void | Promise<void>;
};

/**
 * Builds the inline quick-action rail for a star. Returns at most three
 * actions ordered swap → case → select; archive view skips swap/select.
 */
export function useStarQuickActions({
  viewMode,
  openCaseAndDismiss,
  selectionPolicy,
  swapPolicy,
}: {
  viewMode: ViewMode;
  openCaseAndDismiss: (memberId: string) => void;
  selectionPolicy: StarSelectionPolicy;
  swapPolicy: StarSwapPolicy;
}) {
  function quickActionsForStar(star: StarMark): readonly StarQuickAction[] {
    if (viewMode !== "tonight") {
      return [buildCaseAction(star, openCaseAndDismiss)];
    }

    const actions: StarQuickAction[] = [];
    const swap = buildSwapAction(star, swapPolicy);
    if (swap !== undefined) actions.push(swap);
    actions.push(buildCaseAction(star, openCaseAndDismiss));
    const select = buildSelectAction(star, selectionPolicy, swapPolicy.activeBooking !== null);
    if (select !== undefined) actions.push(select);

    return actions.slice(0, 3);
  }

  return { quickActionsForStar };
}

function buildCaseAction(
  star: StarMark,
  openCaseAndDismiss: (memberId: string) => void,
): StarQuickAction {
  return {
    id: "case",
    label: `View ${star.member.firstName}'s case`,
    icon: <CaseFileIcon />,
    onSelect: () => openCaseAndDismiss(star.member.id),
  };
}

function buildSwapAction(star: StarMark, policy: StarSwapPolicy): StarQuickAction | undefined {
  const memberId = star.member.id;
  const isFocused = policy.focusedSet.has(memberId);
  const isEligiblePartner = policy.eligiblePartnerIds.has(memberId);
  const isOffTonight = policy.offTonightIds.has(memberId);
  const isSwappableOffTonight =
    isOffTonight && policy.unavailabilityReasonById.get(memberId) === "off_shift";
  const partnerSwapUsed = policy.shift.partnerSwap !== undefined;
  const followUpPinned = policy.followUpPartnerIds.has(memberId);
  const planningLocked = policy.activeBooking !== null;

  if (isFocused && policy.onReselectFocus !== undefined) {
    return {
      id: "swap",
      label: `Swap ${star.member.firstName} out of focus`,
      title: planningLocked
        ? "Cancel the committed pair before swapping focus"
        : "Open the focus swap manager",
      disabled: planningLocked,
      tone: "rose",
      icon: <SwapIcon />,
      onSelect: () => policy.requestReselectDroppingFocus(memberId),
    };
  }

  if (isEligiblePartner && policy.onSwapShiftPartner !== undefined) {
    const disabled = planningLocked || partnerSwapUsed || followUpPinned;
    return {
      id: "swap",
      label: `Swap ${star.member.firstName} off tonight's roster`,
      title: planningLocked
        ? "Cancel the committed pair before swapping partners"
        : partnerSwapUsed
          ? "Partner roster swap already used this shift"
          : followUpPinned
            ? "Follow-up reservations are pinned for this shift"
            : "Pick an off-shift member to swap in",
      disabled,
      tone: "rose",
      icon: <SwapIcon />,
      onSelect: () => policy.startPartnerSwap(memberId),
    };
  }

  if (
    isSwappableOffTonight &&
    policy.activePartnerSwapSourceId !== null &&
    policy.onSwapShiftPartner !== undefined
  ) {
    return {
      id: "swap",
      label: `Swap ${star.member.firstName} onto tonight's roster`,
      title: partnerSwapUsed
        ? "Partner roster swap already used this shift"
        : "Use this member as tonight's partner roster replacement",
      disabled: planningLocked || partnerSwapUsed,
      tone: "rose",
      icon: <SwapIcon />,
      onSelect: () => policy.swapInPartner(memberId),
    };
  }

  return undefined;
}

function buildSelectAction(
  star: StarMark,
  policy: StarSelectionPolicy,
  planningLocked: boolean,
): StarQuickAction | undefined {
  const memberId = star.member.id;
  const isFocused = policy.focusedSet.has(memberId);
  const isEligiblePartner = policy.eligiblePartnerIds.has(memberId);

  if (isFocused) {
    return {
      id: "select",
      label:
        policy.focusId === memberId
          ? `Clear ${star.member.firstName} as lead`
          : `Make ${star.member.firstName} lead`,
      title: planningLocked ? "Cancel the committed pair before changing the lead" : undefined,
      disabled: planningLocked,
      icon: policy.focusId === memberId ? <ClearIcon /> : <SelectIcon />,
      onSelect: () => {
        if (policy.focusId === memberId) {
          policy.onClearFocus();
        } else {
          if (policy.focusStep.active) policy.focusStep.complete();
          policy.onMakeLead(memberId);
        }
      },
    };
  }

  if (isEligiblePartner && policy.focusId !== null) {
    return {
      id: "select",
      label:
        policy.partnerId === memberId
          ? `Clear ${star.member.firstName} as partner`
          : `Make ${star.member.firstName} partner`,
      title: planningLocked ? "Cancel the committed pair before changing the partner" : undefined,
      disabled: planningLocked,
      icon: policy.partnerId === memberId ? <ClearIcon /> : <SelectIcon />,
      onSelect: () => {
        if (policy.partnerId === memberId) {
          policy.onClearPartner();
        } else {
          if (policy.partnerStep.active) policy.partnerStep.complete();
          policy.onMakePartner(memberId);
        }
      },
    };
  }

  return undefined;
}
