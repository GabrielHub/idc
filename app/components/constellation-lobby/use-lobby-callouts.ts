import { useMemo } from "react";

import type { GameSave, ShiftState } from "../../domain/game";
import { pendingFollowUpSessionsForShift } from "../../services/date-engine";
import type { Callout } from "./lobby-hud";

export function useLobbyCallouts({
  deckRepairBlocked,
  readyClosurePairCount,
  pendingFollowUpCount,
  save,
  shift,
  onOpenDateSession,
  onOpenClosures,
  onOpenFollowUps,
  onOpenDeck,
}: {
  deckRepairBlocked: boolean;
  readyClosurePairCount: number;
  pendingFollowUpCount: number;
  save: GameSave;
  shift: ShiftState;
  onOpenDateSession: ((dateSessionId: string) => void) | undefined;
  onOpenClosures: () => void;
  onOpenFollowUps: () => void;
  onOpenDeck: () => void;
}): Callout[] {
  return useMemo(() => {
    const items: Callout[] = [];
    if (deckRepairBlocked) {
      items.push({
        id: "deck-repair",
        tone: "rose",
        eyebrow: "deck needs repair",
        title: "Deck is over budget",
        body: "Drop cards from the deck until spend is under the cap before booking the next pair.",
        action: { label: "Open deck", onClick: onOpenDeck },
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
        body: "File a placeholder closure summary before the next shift.",
        action: { label: "File closure", onClick: onOpenClosures },
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
    onOpenDateSession,
    onOpenClosures,
    onOpenFollowUps,
    onOpenDeck,
  ]);
}
