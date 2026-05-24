import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MatchmakingIntent, GameSave, ShiftState } from "../../domain/game";
import { makePairId } from "../../services/game-seed";
import type { LobbyState, StarMark } from "./types";

type ActiveBooking = NonNullable<ShiftState["activeBooking"]>;

export function useLobbyPlanningState({
  save,
  activeBooking,
  stars,
  onCancelBooking,
}: {
  save: GameSave;
  activeBooking: ActiveBooking | null;
  stars: readonly StarMark[];
  onCancelBooking: () => void;
}) {
  const [focusId, setFocusId] = useState<string | null>(activeBooking?.focusMemberId ?? null);
  const [partnerId, setPartnerId] = useState<string | null>(
    activeBooking?.participantIds[1] ?? null,
  );
  const [matchmakingIntent, setMatchmakingIntent] = useState<MatchmakingIntent | null>(
    activeBooking?.matchmakingIntent ?? null,
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const previousPairSelectionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setFocusId((current) => {
      if (activeBooking?.focusMemberId !== undefined) return activeBooking.focusMemberId;
      if (current !== null && save.focusedMemberIds.includes(current)) return current;
      return null;
    });
  }, [activeBooking, save.focusedMemberIds]);

  useEffect(() => {
    if (activeBooking !== null) {
      setPartnerId(activeBooking.participantIds[1]);
      setMatchmakingIntent(activeBooking.matchmakingIntent ?? null);
    }
  }, [activeBooking]);

  useEffect(() => {
    if (activeBooking !== null) return;
    const nextKey = focusId === null || partnerId === null ? null : makePairId(focusId, partnerId);
    const previousKey = previousPairSelectionKeyRef.current;
    previousPairSelectionKeyRef.current = nextKey;
    if (previousKey !== null && previousKey !== nextKey) {
      setMatchmakingIntent(null);
      setSelectedScenarioId(null);
    }
  }, [activeBooking, focusId, partnerId]);

  const lobbyState = useMemo<LobbyState>(() => {
    if (focusId === null) return "idle";
    if (partnerId === null) return "focus_selected";
    if (activeBooking === null) return "partner_selected";
    if (selectedScenarioId === null) return "committed_pair";
    return "scenario_chosen";
  }, [focusId, partnerId, activeBooking, selectedScenarioId]);

  const focusStar = useMemo(
    () => (focusId === null ? undefined : stars.find((star) => star.member.id === focusId)),
    [stars, focusId],
  );
  const partnerStar = useMemo(
    () => (partnerId === null ? undefined : stars.find((star) => star.member.id === partnerId)),
    [stars, partnerId],
  );
  const committedPairId = useMemo<string | null>(() => {
    if (activeBooking !== null) return activeBooking.pairId;
    return null;
  }, [activeBooking]);

  const resetBookingSelection = useCallback(
    ({ dropFocus = false }: { dropFocus?: boolean } = {}) => {
      if (dropFocus) setFocusId(null);
      setPartnerId(null);
      setMatchmakingIntent(null);
      setSelectedScenarioId(null);
      if (activeBooking !== null) onCancelBooking();
    },
    [activeBooking, onCancelBooking],
  );

  return {
    focusId,
    setFocusId,
    partnerId,
    setPartnerId,
    matchmakingIntent,
    setMatchmakingIntent,
    selectedScenarioId,
    setSelectedScenarioId,
    lobbyState,
    focusStar,
    partnerStar,
    committedPairId,
    resetBookingSelection,
  };
}
