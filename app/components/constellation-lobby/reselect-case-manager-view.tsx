import type { ReactNode } from "react";

import type { GameSave } from "../../domain/game";
import { CaseManagerScreen } from "../case-manager-screen";

export function ReselectCaseManagerView({
  chromeSlot,
  save,
  draftIds,
  baselineFocusedIds,
  isActionPending,
  revealAllMemberDetails,
  onTutorialUpdate,
  onToggleMember,
  onCancel,
  onConfirm,
}: {
  chromeSlot?: ReactNode;
  save: GameSave;
  draftIds: readonly string[];
  baselineFocusedIds: readonly string[];
  isActionPending: boolean;
  revealAllMemberDetails: boolean;
  onTutorialUpdate: (next: GameSave) => void;
  onToggleMember: (memberId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="relative min-h-screen w-full text-aura-paper">
      {chromeSlot === undefined ? null : (
        <div className="pointer-events-none absolute left-6 top-5 z-50 flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-2">{chromeSlot}</div>
        </div>
      )}
      <CaseManagerScreen
        members={save.members}
        save={save}
        draftIds={draftIds}
        baselineFocusedIds={baselineFocusedIds}
        playerKnowledge={save.playerKnowledge}
        isActionPending={isActionPending}
        revealAllMemberDetails={revealAllMemberDetails}
        onTutorialUpdate={onTutorialUpdate}
        onToggleMember={onToggleMember}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </div>
  );
}
