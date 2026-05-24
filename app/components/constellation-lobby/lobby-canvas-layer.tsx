import { Suspense, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import type { Member } from "../../domain/game";
import { ArchiveEdgeTooltip } from "./archive-edge-tooltip";
import { Scene, type RenderHoverCard } from "./canvas-convention";
import type { PairEdgeRenderSpec } from "./archive-layout";
import type { LayerNavigationMode } from "./layer-access";
import type {
  ArchiveSelection,
  CameraTarget,
  FlythroughLayer,
  LobbyState,
  RosterSubview,
  StarClickHandlers,
  StarMark,
  Vec3,
  ViewMode,
} from "./types";

export function LobbyCanvasLayer({
  lobbyState,
  stars,
  focusStar,
  partnerStar,
  cameraTarget,
  reducedMotion,
  renderHoverCard,
  starClickHandlers,
  activeStarId,
  onActiveStarChange,
  currentLayer,
  onLayerChange,
  layerNavigationMode,
  cathedralScrollRef,
  focusedIds,
  offTonightSet,
  rosterSubview,
  pairMoodByPartnerId,
  viewMode,
  archiveData,
  archiveSelection,
  archiveIsolation,
  memberById,
  onArchivePairSelect,
  onPointerMissed,
  disableScrollLayerNav = false,
}: {
  lobbyState: LobbyState;
  stars: StarMark[];
  focusStar: StarMark | undefined;
  partnerStar: StarMark | undefined;
  cameraTarget: CameraTarget;
  reducedMotion: boolean;
  renderHoverCard: RenderHoverCard;
  starClickHandlers: StarClickHandlers;
  activeStarId: string | null;
  onActiveStarChange: (id: string | null) => void;
  currentLayer: FlythroughLayer;
  onLayerChange: (layer: FlythroughLayer) => void;
  layerNavigationMode?: LayerNavigationMode;
  cathedralScrollRef?: RefObject<HTMLDivElement | null>;
  focusedIds: ReadonlySet<string>;
  offTonightSet: ReadonlySet<string>;
  rosterSubview: RosterSubview;
  /**
   * Per-eligible-partner pair mood (relationshipHealth, 0..100) keyed by
   * partner member id. Drives the constellation spokes from the focus to
   * each ringed eligible. Optional — undefined falls back to neutral colors.
   */
  pairMoodByPartnerId?: ReadonlyMap<string, number>;
  viewMode: ViewMode;
  archiveData?: {
    positions: ReadonlyMap<string, Vec3>;
    edges: readonly PairEdgeRenderSpec[];
  };
  archiveSelection: ArchiveSelection;
  archiveIsolation?: {
    focusMemberId: string;
    includedMemberIds: ReadonlySet<string>;
  };
  memberById: ReadonlyMap<string, Member>;
  onArchivePairSelect: (pairId: string) => void;
  onPointerMissed: () => void;
  /**
   * Playground escape hatch. When true, Scene does not register the
   * window-level wheel/keyboard layer-advance handlers and does not lock
   * `body { overflow: hidden }`. The LayerIndicator buttons remain wired
   * through the HUD layer, so layer navigation still works.
   */
  disableScrollLayerNav?: boolean;
}) {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.6]}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 17], fov: 38, near: 0.1, far: 80 }}
        onPointerMissed={onPointerMissed}
      >
        <Suspense fallback={null}>
          <Scene
            state={lobbyState}
            stars={stars}
            focusStar={focusStar}
            partnerStar={partnerStar}
            cameraTarget={cameraTarget}
            showAuras={true}
            showParallax={true}
            reducedMotion={reducedMotion}
            renderHoverCard={renderHoverCard}
            starClickHandlers={starClickHandlers}
            activeStarId={activeStarId}
            onActiveStarChange={onActiveStarChange}
            currentLayer={currentLayer}
            onLayerChange={disableScrollLayerNav ? undefined : onLayerChange}
            layerNavigationMode={layerNavigationMode}
            cathedralScrollRef={cathedralScrollRef}
            focusedIds={focusedIds}
            offTonightSet={offTonightSet}
            rosterSubview={rosterSubview}
            pairMoodByPartnerId={pairMoodByPartnerId}
            viewMode={viewMode}
            archiveData={archiveData}
            archiveSelection={archiveSelection}
            archiveIsolation={archiveIsolation}
            onArchiveEdgeClick={onArchivePairSelect}
            renderArchiveEdgeTooltip={(edge) => (
              <ArchiveEdgeTooltip edge={edge} memberById={memberById} />
            )}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
