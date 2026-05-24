import type { ReactNode } from "react";

import type {
  DateScenario,
  GameSave,
  MatchmakingIntent,
  Member,
  ShiftState,
} from "../../domain/game";
import type { ReadyClosurePair } from "../../services/closures";

export type ConstellationLobbyProps = {
  save: GameSave;
  shift: ShiftState;
  focusedMembers: Member[];
  drawnScenarios: DateScenario[];
  isActionPending: boolean;
  bookingLocked: boolean;
  /**
   * True when both `save.config.aiSetupComplete` and the runtime AI status
   * report ready. Gates Begin so the player never reaches the date engine's
   * post-click AI setup failure.
   */
  aiReady: boolean;
  readyClosurePairCount?: number;
  readyClosurePairs?: readonly ReadyClosurePair[];
  pendingFollowUpCount?: number;
  readyClosurePairIds?: ReadonlySet<string>;
  onBeginDate: (input: {
    focusMemberId: string;
    partnerMemberId: string;
    scenarioId: string;
    matchmakingIntent?: MatchmakingIntent;
  }) => void;
  onCommitPair: (input: {
    focusMemberId: string;
    partnerMemberId: string;
    matchmakingIntent?: MatchmakingIntent;
  }) => void;
  onCancelBooking: () => void;
  onAddDeckCard: (cardId: string) => void;
  onRemoveDeckCard: (cardId: string) => void;
  onClosePair?: (input: { pairId: string; ready: ReadyClosurePair }) => Promise<boolean>;
  closureErrorMessage?: string | null;
  onDismissClosureError?: () => void;
  onCompleteShift?: () => void;
  onOpenClosures?: () => void;
  onOpenFollowUps?: () => void;
  onOpenDateSession?: (dateSessionId: string) => void;
  readyClosureMemberIds?: ReadonlySet<string>;
  revealAllMemberDetails?: boolean;
  onTutorialUpdate: (next: GameSave) => void;
  onAddFocus?: (memberId: string) => void;
  onRemoveFocus?: (memberId: string) => void;
  onReselectFocus?: (nextFocusIds: string[]) => void;
  chromeSlot?: ReactNode;
  onDeckOverBudgetBlocked?: () => void;
  /**
   * Playground escape hatch. When true, Scene does not register global
   * wheel/keyboard layer navigation.
   */
  disableScrollLayerNav?: boolean;
};

export const EMPTY_READY_CLOSURE_IDS: ReadonlySet<string> = new Set();
