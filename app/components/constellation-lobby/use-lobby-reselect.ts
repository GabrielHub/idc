import { useCallback, useState } from "react";

import type { GameSave } from "../../domain/game";
import { FOCUS_CASE_LIMIT } from "../../services/focus-cases";

export type LobbyMode = "browse" | "reselect";

function activeFocusedIds(save: GameSave): string[] {
  const membersById = new Map(save.members.map((member) => [member.id, member] as const));
  return save.focusedMemberIds.filter((id) => {
    const member = membersById.get(id);
    return member !== undefined && member.state.status === "active";
  });
}

export function useLobbyReselect({
  save,
  onReselectFocus,
  onCaseFileClose,
}: {
  save: GameSave;
  onReselectFocus: ((nextFocusIds: string[]) => void) | undefined;
  onCaseFileClose: () => void;
}) {
  const [lobbyMode, setLobbyMode] = useState<LobbyMode>("browse");
  const [reselectDraft, setReselectDraft] = useState<readonly string[] | null>(null);
  const [reselectBaseline, setReselectBaseline] = useState<readonly string[] | null>(null);

  const enterReselect = useCallback(() => {
    if (lobbyMode === "reselect") return;
    const baseline = activeFocusedIds(save);
    setReselectBaseline(baseline);
    setReselectDraft(baseline);
    setLobbyMode("reselect");
    onCaseFileClose();
  }, [lobbyMode, onCaseFileClose, save]);

  const cancelReselect = useCallback(() => {
    setReselectDraft(null);
    setReselectBaseline(null);
    setLobbyMode("browse");
  }, []);

  const toggleReselectMember = useCallback((memberId: string) => {
    setReselectDraft((current) => {
      if (current === null) return current;
      if (current.includes(memberId)) return current.filter((id) => id !== memberId);
      if (current.length >= FOCUS_CASE_LIMIT) return current;
      return [...current, memberId];
    });
  }, []);

  const confirmReselect = useCallback(() => {
    if (reselectDraft === null || reselectDraft.length !== FOCUS_CASE_LIMIT) return;
    onReselectFocus?.([...reselectDraft]);
    setReselectDraft(null);
    setReselectBaseline(null);
    setLobbyMode("browse");
  }, [onReselectFocus, reselectDraft]);

  return {
    lobbyMode,
    reselectDraft,
    reselectBaseline,
    enterReselect,
    cancelReselect,
    toggleReselectMember,
    confirmReselect,
    setReselectBaseline,
    setReselectDraft,
    setLobbyMode,
  };
}
