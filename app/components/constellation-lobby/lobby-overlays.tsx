import type { ComponentProps } from "react";

import type { GameSave, Member } from "../../domain/game";
import { starterScenarios } from "../../fixtures";
import type { ReadyClosurePair } from "../../services/closures";
import { CaseFilePanel, type CaseFilePanelProps } from "./case-file-panel";
import { CathedralScenarioDetail } from "./cathedral-scenario-detail";
import { ClosurePanel } from "./closure-panel";
import { LensPanel, type LensPanelProps } from "./lens-panel";
import { NotesOverlay } from "./notes-overlay";
import type { PlanningTutorialRefs, PlanningTutorialSteps } from "./planning-tutorial";
import { PlanningTutorialOverlays } from "./planning-tutorial";
import { ShiftArchiveOverlay } from "./shift-archive-overlay";
import { ShiftSkipConfirm } from "./shift-skip-confirm";
import type { ViewMode } from "./types";

type NotesOverlayState = {
  open: boolean;
  pairFocusId: string | null;
};

export function LobbyOverlays({
  save,
  notesOverlay,
  readyClosurePairIds,
  closeNotesOverlay,
  isShiftArchiveOpen,
  setIsShiftArchiveOpen,
  closure,
  planning,
  viewMode,
  lens,
  openCaseMember,
  caseFilePrimaryAction,
  revealAllMemberDetails,
  focusedSet,
  closeCaseFile,
  skipShiftConfirmOpen,
  setSkipShiftConfirmOpen,
  shiftNumber,
  isActionPending,
  onCompleteShift,
  onFileShiftTutorialComplete,
  scenarioDetail,
}: {
  save: GameSave;
  notesOverlay: NotesOverlayState;
  readyClosurePairIds: ReadonlySet<string>;
  closeNotesOverlay: () => void;
  isShiftArchiveOpen: boolean;
  setIsShiftArchiveOpen: (open: boolean) => void;
  closure: {
    readyPair: ReadyClosurePair | null;
    errorMessage: string | null;
    queuePosition?: number;
    queueTotal?: number;
    onPrevious?: () => void;
    onNext?: () => void;
    onClose: () => void;
    onConfirm: ComponentProps<typeof ClosurePanel>["onConfirm"];
  };
  planning: {
    steps: PlanningTutorialSteps;
    refs: PlanningTutorialRefs;
  };
  viewMode: ViewMode;
  lens: Pick<
    LensPanelProps,
    "isOpen" | "filterState" | "matchCount" | "totalCount" | "onChange"
  > & {
    onClose: () => void;
  };
  openCaseMember: Member | null;
  caseFilePrimaryAction: CaseFilePanelProps["primaryAction"];
  revealAllMemberDetails: boolean;
  focusedSet: ReadonlySet<string>;
  closeCaseFile: () => void;
  skipShiftConfirmOpen: boolean;
  setSkipShiftConfirmOpen: (open: boolean) => void;
  shiftNumber: number;
  isActionPending: boolean;
  onCompleteShift?: () => void;
  onFileShiftTutorialComplete: () => void;
  scenarioDetail: ComponentProps<typeof CathedralScenarioDetail>;
}) {
  return (
    <>
      <CathedralScenarioDetail {...scenarioDetail} />
      <NotesOverlay
        open={notesOverlay.open}
        memories={save.memories}
        members={save.members}
        pairEdges={save.pairStates}
        scenarios={starterScenarios}
        playerKnowledge={save.playerKnowledge}
        readyClosurePairIds={readyClosurePairIds}
        initialPairFocusId={notesOverlay.pairFocusId}
        onClose={closeNotesOverlay}
      />
      <ShiftArchiveOverlay
        open={isShiftArchiveOpen}
        shifts={save.shifts}
        members={save.members}
        onClose={() => setIsShiftArchiveOpen(false)}
      />
      <ClosurePanel
        readyPair={closure.readyPair}
        isActionPending={isActionPending}
        errorMessage={closure.errorMessage}
        queuePosition={closure.queuePosition}
        queueTotal={closure.queueTotal}
        onPrevious={closure.onPrevious}
        onNext={closure.onNext}
        onClose={closure.onClose}
        onConfirm={closure.onConfirm}
      />
      <PlanningTutorialOverlays steps={planning.steps} refs={planning.refs} viewMode={viewMode} />
      <LensPanel {...lens} />
      {openCaseMember === null ? null : (
        <CaseFilePanel
          member={openCaseMember}
          playerKnowledge={save.playerKnowledge}
          revealAllDetails={revealAllMemberDetails}
          save={save}
          isFocused={focusedSet.has(openCaseMember.id)}
          status={
            openCaseMember.state.status === "closed"
              ? "closed"
              : openCaseMember.state.status === "quit"
                ? "quit"
                : "active"
          }
          primaryAction={caseFilePrimaryAction}
          onClose={closeCaseFile}
        />
      )}
      <ShiftSkipConfirm
        open={skipShiftConfirmOpen}
        shiftNumber={shiftNumber}
        isActionPending={isActionPending}
        onCancel={() => setSkipShiftConfirmOpen(false)}
        onConfirm={() => {
          setSkipShiftConfirmOpen(false);
          onFileShiftTutorialComplete();
          onCompleteShift?.();
        }}
      />
    </>
  );
}
