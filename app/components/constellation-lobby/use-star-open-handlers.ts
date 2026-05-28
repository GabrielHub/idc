import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { ArchiveSelection, StarMark, ViewMode } from "./types";

/**
 * Policy: what a single click or double click does to a star. Archive mode
 * toggles the archive selection card; tonight mode toggles the inline
 * quick-action rail. Double click always opens the case file.
 */
export function useStarOpenHandlers({
  viewMode,
  setActiveStarId,
  setArchiveSelection,
  setOpenCaseMemberId,
}: {
  viewMode: ViewMode;
  setActiveStarId: Dispatch<SetStateAction<string | null>>;
  setArchiveSelection: Dispatch<SetStateAction<ArchiveSelection>>;
  setOpenCaseMemberId: Dispatch<SetStateAction<string | null>>;
}) {
  const openCaseAndDismiss = useCallback(
    (memberId: string) => {
      setActiveStarId(null);
      setOpenCaseMemberId(memberId);
    },
    [setActiveStarId, setOpenCaseMemberId],
  );

  const handleStarClick = useCallback(
    (star: StarMark) => {
      if (viewMode === "archive") {
        setActiveStarId(null);
        setArchiveSelection((current) =>
          current?.kind === "member" && current.memberId === star.member.id
            ? null
            : { kind: "member", memberId: star.member.id },
        );
        return;
      }
      setActiveStarId((prev) => (prev === star.member.id ? null : star.member.id));
    },
    [setActiveStarId, setArchiveSelection, viewMode],
  );

  const handleStarDoubleClick = useCallback(
    (star: StarMark) => {
      openCaseAndDismiss(star.member.id);
    },
    [openCaseAndDismiss],
  );

  return { handleStarClick, handleStarDoubleClick, openCaseAndDismiss };
}
