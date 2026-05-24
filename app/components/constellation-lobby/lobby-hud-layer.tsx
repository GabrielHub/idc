import { type ReactNode } from "react";

import {
  isMemberRosterFilterActive,
  type MemberRosterFilterState,
} from "../../services/member-roster-filter";
import { ContextualPillRail } from "./contextual-pill-rail";
import { LayerIndicator } from "./layer-indicator";
import { BottomDock, CalloutCluster, SideRail, type Callout } from "./lobby-hud";
import type { PlanningTutorialRefs } from "./planning-tutorial";
import { ShiftBriefDock, type ShiftBriefRowData } from "./shift-brief-dock";
import type { CathedralMode } from "./cathedral";
import type { FlythroughLayer, LobbyState, RosterSubview, StarMark, ViewMode } from "./types";

export function LobbyHudLayer({
  chromeSlot,
  viewMode,
  currentLayer,
  refs,
  focus,
  partner,
  intentSlot,
  pairDossierSlot,
  callouts,
  lobbyState,
  selectedScenarioId,
  isActionPending,
  shiftBriefRows,
  scenarioMode,
  bookingLocked,
  dateBookDisabledReason,
  deckRepairBlocked,
  rosterSubview,
  filterState,
  canReselect,
  archiveEdgeCount,
  fileShiftBlockedReason,
  archiveSelectionActive,
  onLayerSelect,
  onClearFocus,
  onClearPartner,
  onBeginDate,
  onCancelPair,
  onCompleteShift,
  onOpenNotes,
  onOpenShiftArchive,
  onToggleDateBook,
  onOpenLens,
  onToggleReselect,
  onRosterSubviewChange,
  onToggleArchive,
  onClearArchiveSelection,
}: {
  chromeSlot?: ReactNode;
  viewMode: ViewMode;
  currentLayer: FlythroughLayer;
  refs: Pick<
    PlanningTutorialRefs,
    | "layerIndicatorRef"
    | "layerFocusRef"
    | "layerRosterRef"
    | "layerCathedralRef"
    | "sideRailRef"
    | "beginButtonRef"
    | "fileShiftButtonRef"
  >;
  focus: StarMark | undefined;
  partner: StarMark | undefined;
  intentSlot?: ReactNode;
  pairDossierSlot?: ReactNode;
  callouts: readonly Callout[];
  lobbyState: LobbyState;
  selectedScenarioId: string | null;
  isActionPending: boolean;
  shiftBriefRows: readonly ShiftBriefRowData[];
  scenarioMode: CathedralMode;
  bookingLocked: boolean;
  dateBookDisabledReason?: string;
  deckRepairBlocked: boolean;
  rosterSubview: RosterSubview;
  filterState: MemberRosterFilterState;
  canReselect: boolean;
  archiveEdgeCount: number;
  fileShiftBlockedReason?: string;
  archiveSelectionActive: boolean;
  onLayerSelect: (layer: FlythroughLayer) => void;
  onClearFocus: () => void;
  onClearPartner: () => void;
  onBeginDate: () => void;
  onCancelPair: () => void;
  onCompleteShift: () => void;
  onOpenNotes: () => void;
  onOpenShiftArchive: () => void;
  onToggleDateBook: () => void;
  onOpenLens: () => void;
  onToggleReselect: () => void;
  onRosterSubviewChange: (subview: RosterSubview) => void;
  onToggleArchive: () => void;
  onClearArchiveSelection?: () => void;
}) {
  return (
    <>
      {chromeSlot === undefined ? null : (
        <div className="pointer-events-none absolute left-6 top-5 z-30 flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-2">{chromeSlot}</div>
        </div>
      )}
      {viewMode === "tonight" ? (
        <LayerIndicator
          currentLayer={currentLayer}
          onLayerSelect={onLayerSelect}
          containerRef={refs.layerIndicatorRef}
          layerRefs={{
            0: refs.layerFocusRef,
            1: refs.layerRosterRef,
            2: refs.layerCathedralRef,
          }}
        />
      ) : null}
      <SideRail
        focus={focus}
        partner={partner}
        intentSlot={intentSlot}
        pairDossierSlot={pairDossierSlot}
        containerRef={refs.sideRailRef}
        onClearFocus={onClearFocus}
        onClearPartner={onClearPartner}
      />
      <CalloutCluster callouts={[...callouts]} />
      <BottomDock
        state={lobbyState}
        selectedScenarioId={selectedScenarioId}
        beginDisabled={isActionPending}
        onBeginDate={onBeginDate}
        onCancelPair={onCancelPair}
        beginButtonRef={refs.beginButtonRef}
        briefSlot={<ShiftBriefDock rows={shiftBriefRows} />}
      />
      <ContextualPillRail
        scenarioMode={scenarioMode}
        bookingLocked={bookingLocked}
        dateBookDisabledReason={dateBookDisabledReason}
        deckRepairBlocked={deckRepairBlocked}
        currentLayer={currentLayer}
        rosterSubview={rosterSubview}
        filterActive={isMemberRosterFilterActive(filterState)}
        canReselect={canReselect}
        viewMode={viewMode}
        archiveEdgeCount={archiveEdgeCount}
        fileShiftBlockedReason={fileShiftBlockedReason}
        onCompleteShift={onCompleteShift}
        onOpenNotes={onOpenNotes}
        onOpenShiftArchive={onOpenShiftArchive}
        onToggleDateBook={onToggleDateBook}
        onOpenLens={onOpenLens}
        onToggleReselect={onToggleReselect}
        onRosterSubviewChange={onRosterSubviewChange}
        onToggleArchive={onToggleArchive}
        onClearArchiveSelection={onClearArchiveSelection}
        archiveSelectionActive={archiveSelectionActive}
        fileShiftButtonRef={refs.fileShiftButtonRef}
      />
    </>
  );
}
