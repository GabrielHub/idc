import { useMemo, type Dispatch, type SetStateAction } from "react";

import type { GameSave, Member } from "../../domain/game";
import { canBeFocusCase, FOCUS_CASE_LIMIT } from "../../services/focus-cases";

type CaseFilePrimaryAction = { label: string; onClick: () => void; disabled?: boolean };

export function useCaseFileAction({
  save,
  openCaseMemberId,
  focusedSet,
  onAddFocus,
  onRemoveFocus,
  onReselectFocus,
  setOpenCaseMemberId,
  setReselectBaseline,
  setReselectDraft,
  setLobbyMode,
}: {
  save: GameSave;
  openCaseMemberId: string | null;
  focusedSet: ReadonlySet<string>;
  onAddFocus: ((memberId: string) => void) | undefined;
  onRemoveFocus: ((memberId: string) => void) | undefined;
  onReselectFocus: ((nextFocusIds: string[]) => void) | undefined;
  setOpenCaseMemberId: Dispatch<SetStateAction<string | null>>;
  setReselectBaseline: Dispatch<SetStateAction<readonly string[] | null>>;
  setReselectDraft: Dispatch<SetStateAction<readonly string[] | null>>;
  setLobbyMode: Dispatch<SetStateAction<"browse" | "reselect">>;
}): { openCaseMember: Member | null; caseFilePrimaryAction: CaseFilePrimaryAction | undefined } {
  const openCaseMember = useMemo(
    () =>
      openCaseMemberId === null
        ? null
        : (save.members.find((member) => member.id === openCaseMemberId) ?? null),
    [openCaseMemberId, save.members],
  );

  const caseFilePrimaryAction = useMemo(() => {
    if (openCaseMember === null) return undefined;
    if (openCaseMember.state.status !== "active") return undefined;
    const isFocused = focusedSet.has(openCaseMember.id);
    const slotsFull = save.focusedMemberIds.length >= FOCUS_CASE_LIMIT;
    if (isFocused) {
      if (onRemoveFocus === undefined) return undefined;
      return {
        label: "Drop from focus",
        onClick: () => {
          onRemoveFocus(openCaseMember.id);
          setOpenCaseMemberId(null);
        },
      };
    }
    if (!canBeFocusCase(openCaseMember)) return undefined;
    if (slotsFull) {
      if (onReselectFocus === undefined) return undefined;
      const candidateId = openCaseMember.id;
      const baseline = save.focusedMemberIds.filter((id) => {
        const member = save.members.find((candidate) => candidate.id === id);
        return member !== undefined && member.state.status === "active";
      });
      return {
        label: "Swap into focus  ·  Manage cases →",
        onClick: () => {
          setReselectBaseline(baseline);
          setReselectDraft(baseline.includes(candidateId) ? baseline : [...baseline, candidateId]);
          setLobbyMode("reselect");
          setOpenCaseMemberId(null);
        },
      };
    }
    if (onAddFocus === undefined) return undefined;
    return {
      label: "Add as focus case",
      onClick: () => {
        onAddFocus(openCaseMember.id);
        setOpenCaseMemberId(null);
      },
    };
  }, [
    openCaseMember,
    focusedSet,
    save.focusedMemberIds,
    save.members,
    onAddFocus,
    onRemoveFocus,
    onReselectFocus,
    setOpenCaseMemberId,
    setReselectBaseline,
    setReselectDraft,
    setLobbyMode,
  ]);

  return { openCaseMember, caseFilePrimaryAction };
}
