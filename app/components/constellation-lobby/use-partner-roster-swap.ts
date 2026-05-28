import { useCallback, useMemo, useState, type Dispatch } from "react";

import type { ShiftState } from "../../domain/game";
import type { LayerNavigationMode } from "./layer-access";
import type { LobbyAction } from "./lobby-reducer";
import {
  flythroughLayerForRosterSubview,
  OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER,
  type RosterSubview,
} from "./types";

export function usePartnerRosterSwap({
  activeBooking,
  dispatch,
  eligiblePartnerIds,
  layerNavigationMode,
  onSwapShiftPartner,
  setActiveStarId,
  setRosterSubview,
  shift,
}: {
  activeBooking: NonNullable<ShiftState["activeBooking"]> | null;
  dispatch: Dispatch<LobbyAction>;
  eligiblePartnerIds: ReadonlySet<string>;
  layerNavigationMode: LayerNavigationMode;
  onSwapShiftPartner:
    | ((input: {
        outgoingPartnerMemberId: string;
        incomingPartnerMemberId: string;
      }) => Promise<boolean>)
    | undefined;
  setActiveStarId: (memberId: string | null) => void;
  setRosterSubview: (subview: RosterSubview) => void;
  shift: ShiftState;
}) {
  const [partnerSwapSourceId, setPartnerSwapSourceId] = useState<string | null>(null);

  const activePartnerSwapSourceId = useMemo<string | null>(() => {
    if (partnerSwapSourceId === null) return null;
    if (activeBooking !== null) return null;
    if (shift.partnerSwap !== undefined) return null;
    if (!eligiblePartnerIds.has(partnerSwapSourceId)) return null;
    return partnerSwapSourceId;
  }, [partnerSwapSourceId, activeBooking, shift.partnerSwap, eligiblePartnerIds]);

  const startPartnerSwap = useCallback(
    (memberId: string) => {
      setPartnerSwapSourceId(memberId);
      setActiveStarId(null);
      setRosterSubview("off_tonight");
      dispatch({
        type: "selectLayer",
        layer: OFF_TONIGHT_ROSTER_FLYTHROUGH_LAYER,
        navigationMode: layerNavigationMode,
      });
    },
    [dispatch, layerNavigationMode, setActiveStarId, setRosterSubview],
  );

  const swapInPartner = useCallback(
    async (incomingPartnerMemberId: string) => {
      if (activePartnerSwapSourceId === null || onSwapShiftPartner === undefined) return;
      const swapped = await onSwapShiftPartner({
        outgoingPartnerMemberId: activePartnerSwapSourceId,
        incomingPartnerMemberId,
      });
      if (!swapped) return;

      setPartnerSwapSourceId(null);
      setActiveStarId(null);
      setRosterSubview("eligibles");
      dispatch({ type: "selectPartner", memberId: incomingPartnerMemberId });
      dispatch({
        type: "selectLayer",
        layer: flythroughLayerForRosterSubview("eligibles"),
        navigationMode: layerNavigationMode,
      });
    },
    [
      activePartnerSwapSourceId,
      dispatch,
      layerNavigationMode,
      onSwapShiftPartner,
      setActiveStarId,
      setRosterSubview,
    ],
  );

  return {
    activePartnerSwapSourceId,
    startPartnerSwap,
    swapInPartner,
  };
}
