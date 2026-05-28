import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { LobbyAction } from "./lobby-reducer";

/**
 * Policy: what "make lead / make partner / add focus" do to lobby + save
 * state. The dispatch path mutates the planning reducer; onAddFocus is the
 * parent-owned path that also adopts a new focus case on the save. All three
 * dismiss the inline quick-action rail after firing.
 */
export function useStarSelectionHandlers({
  dispatch,
  focusId,
  onAddFocus,
  setActiveStarId,
}: {
  dispatch: Dispatch<LobbyAction>;
  focusId: string | null;
  onAddFocus: ((memberId: string) => void) | undefined;
  setActiveStarId: Dispatch<SetStateAction<string | null>>;
}) {
  const handleMakeLead = useCallback(
    (memberId: string) => {
      dispatch({ type: "selectFocus", memberId });
      setActiveStarId(null);
    },
    [dispatch, setActiveStarId],
  );

  const handleMakePartner = useCallback(
    (memberId: string) => {
      dispatch({ type: "selectPartner", memberId });
      setActiveStarId(null);
    },
    [dispatch, setActiveStarId],
  );

  const handleMakeFocus =
    onAddFocus === undefined
      ? undefined
      : (memberId: string) => {
          onAddFocus(memberId);
          if (focusId === null) dispatch({ type: "selectFocus", memberId });
          setActiveStarId(null);
        };

  return { handleMakeFocus, handleMakeLead, handleMakePartner };
}
