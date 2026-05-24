import { useCallback, useMemo, useState } from "react";

export type NotesOverlayState = {
  open: boolean;
  pairFocusId: string | null;
};

export function useLobbyOverlays() {
  const [notesOverlay, setNotesOverlay] = useState<NotesOverlayState>({
    open: false,
    pairFocusId: null,
  });
  const [isShiftArchiveOpen, setIsShiftArchiveOpen] = useState(false);
  const [closurePairId, setClosurePairId] = useState<string | null>(null);
  const [isLensOpen, setIsLensOpen] = useState(false);
  const [skipShiftConfirmOpen, setSkipShiftConfirmOpen] = useState(false);

  const openNotesOverlay = useCallback((pairFocusId: string | null) => {
    setNotesOverlay({ open: true, pairFocusId });
  }, []);

  const closeNotesOverlay = useCallback(() => {
    setNotesOverlay({ open: false, pairFocusId: null });
  }, []);

  const openClosurePanel = useCallback((pairId: string) => {
    setClosurePairId(pairId);
  }, []);

  const isOverlayOpen = useMemo(
    () =>
      notesOverlay.open ||
      isShiftArchiveOpen ||
      closurePairId !== null ||
      isLensOpen ||
      skipShiftConfirmOpen,
    [closurePairId, isLensOpen, isShiftArchiveOpen, notesOverlay.open, skipShiftConfirmOpen],
  );

  return {
    notesOverlay,
    isShiftArchiveOpen,
    closurePairId,
    isLensOpen,
    skipShiftConfirmOpen,
    isOverlayOpen,
    openNotesOverlay,
    closeNotesOverlay,
    openClosurePanel,
    setIsShiftArchiveOpen,
    setClosurePairId,
    setIsLensOpen,
    setSkipShiftConfirmOpen,
  };
}
