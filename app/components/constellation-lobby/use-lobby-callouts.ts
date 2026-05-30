import { useMemo } from "react";

import {
  MEMBER_RETENTION_WARNING_THRESHOLD,
  type GameSave,
  type Member,
  type ShiftState,
} from "../../domain/game";
import { pendingFollowUpSessionsForShift } from "../../services/date-engine";
import type { Callout } from "./lobby-hud";

export function useLobbyCallouts({
  deckRepairBlocked,
  readyClosurePairCount,
  pendingFollowUpCount,
  save,
  shift,
  atRiskMembers,
  onOpenDateSession,
  onOpenClosures,
  onOpenFollowUps,
  onOpenDeck,
  onOpenAtRisk,
}: {
  deckRepairBlocked: boolean;
  readyClosurePairCount: number;
  pendingFollowUpCount: number;
  save: GameSave;
  shift: ShiftState;
  atRiskMembers: readonly Member[];
  onOpenDateSession: ((dateSessionId: string) => void) | undefined;
  onOpenClosures: () => void;
  onOpenFollowUps: () => void;
  onOpenDeck: () => void;
  onOpenAtRisk: () => void;
}): Callout[] {
  return useMemo(() => {
    const items: Callout[] = [];
    if (deckRepairBlocked) {
      items.push({
        id: "deck-repair",
        tone: "rose",
        eyebrow: "Date Book review",
        title: "Date Book is over budget",
        body: "Drop room cards until spend is under the cap before booking the next pair.",
        action: { label: "Open Date Book", onClick: onOpenDeck },
      });
    }
    if (readyClosurePairCount > 0) {
      items.push({
        id: "closures-ready",
        tone: "rose",
        eyebrow: "closure pending",
        title:
          readyClosurePairCount === 1
            ? "One pair is ready to close"
            : `${readyClosurePairCount} pairs are ready to close`,
        body: "Generate and file the closure summary before the next shift.",
        action: { label: "File closure", onClick: onOpenClosures },
      });
    }
    if (atRiskMembers.length > 0) {
      const names = atRiskMembers
        .slice(0, 3)
        .map((member) => member.firstName)
        .join(", ");
      const extra = atRiskMembers.length > 3 ? ` and ${atRiskMembers.length - 3} more` : "";
      items.push({
        id: "cases-at-risk",
        tone: "rose",
        eyebrow: "cases at risk",
        title:
          atRiskMembers.length === 1
            ? `${atRiskMembers[0].firstName} may quit the app`
            : `${atRiskMembers.length} cases may quit the app`,
        body: `Confidence below ${MEMBER_RETENTION_WARNING_THRESHOLD} for ${names}${extra}. Cover their lead ask and avoid focus swaps to recover.`,
        action: { label: "Review cases", onClick: onOpenAtRisk },
      });
    }
    if (onOpenDateSession !== undefined) {
      const memberById = new Map(save.members.map((member) => [member.id, member] as const));
      const sessions = pendingFollowUpSessionsForShift(save, shift.shiftNumber);
      for (const session of sessions) {
        const [firstId, secondId] = session.participants;
        const first = memberById.get(firstId);
        const second = memberById.get(secondId);
        if (first === undefined || second === undefined) continue;
        const sessionId = session.id;
        items.push({
          id: `follow-up-${session.id}`,
          tone: "rose",
          eyebrow: "follow-up due",
          title: `${first.firstName} + ${second.firstName}`,
          body: "File a follow-up before the shift closes.",
          action: { label: "Open date", onClick: () => onOpenDateSession(sessionId) },
        });
      }
    } else if (pendingFollowUpCount > 0) {
      items.push({
        id: "follow-ups",
        tone: "amber",
        eyebrow: "follow-ups",
        title:
          pendingFollowUpCount === 1
            ? "One follow-up needs a response"
            : `${pendingFollowUpCount} follow-ups need a response`,
        action: { label: "Open notes", onClick: onOpenFollowUps },
      });
    }
    return items;
  }, [
    deckRepairBlocked,
    readyClosurePairCount,
    pendingFollowUpCount,
    save,
    shift.shiftNumber,
    atRiskMembers,
    onOpenDateSession,
    onOpenClosures,
    onOpenFollowUps,
    onOpenDeck,
    onOpenAtRisk,
  ]);
}
