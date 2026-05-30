import type { Dispatch, SetStateAction } from "react";
import type { Texture } from "three";

import {
  archiveAvatarScaleForNodeCount,
  computeLayerZOffset,
  computeRosterCohort,
  computeStarFlythroughLayer,
  FOCUS_MARKER_SCALE,
  pairPartnerPosition,
  resolveClusterPosition,
  resolveFlythroughStarPresentation,
  roleForStar,
  type RosterClusterBounds,
} from "./math";
import { buildFocusMarkerOverlay, StarSprite } from "./star-sprite";
import {
  isRosterFlythroughLayer,
  type FlythroughLayer,
  type LobbyState,
  type RosterSubview,
  type StarFlythroughLayer,
  type StarClickHandlers,
  type StarMark,
  type Vec3,
  type ViewMode,
} from "./types";

const EMPTY_OFF_TONIGHT_IDS: ReadonlySet<string> = new Set();

export function StarField({
  state,
  stars,
  focusStar,
  focusId,
  partnerId,
  eligiblePartnerSet,
  viewMode,
  archivePositions,
  archiveIsolation,
  starClickHandlers,
  focusedIds,
  currentLayer,
  focusOrder,
  rosterLeadOrder,
  rosterClusterBounds,
  partnerRingBounds,
  rosterSubview,
  offTonightSet,
  textures,
  flareTexture,
  haloTexture,
  rimLightTexture,
  showAuras,
  reducedMotion,
  canvasScale,
  hoveredId,
  activeStarId,
  onHoveredIdChange,
  onHudOverlayHoveredChange,
}: {
  state: LobbyState;
  stars: readonly StarMark[];
  focusStar: StarMark | undefined;
  focusId: string | undefined;
  partnerId: string | undefined;
  eligiblePartnerSet: ReadonlySet<string>;
  viewMode: ViewMode;
  archivePositions?: ReadonlyMap<string, Vec3>;
  archiveIsolation?: {
    focusMemberId: string;
    includedMemberIds: ReadonlySet<string>;
  };
  starClickHandlers?: StarClickHandlers;
  focusedIds?: ReadonlySet<string>;
  currentLayer?: FlythroughLayer;
  focusOrder: readonly string[];
  rosterLeadOrder: readonly string[];
  rosterClusterBounds: RosterClusterBounds;
  partnerRingBounds: RosterClusterBounds;
  rosterSubview?: RosterSubview;
  offTonightSet?: ReadonlySet<string>;
  textures: Record<string, Texture>;
  flareTexture: Texture | null;
  haloTexture: Texture | null;
  rimLightTexture: Texture | null;
  showAuras: boolean;
  reducedMotion: boolean;
  canvasScale: number;
  hoveredId: string | null;
  activeStarId: string | null;
  onHoveredIdChange: Dispatch<SetStateAction<string | null>>;
  onHudOverlayHoveredChange: (hovered: boolean) => void;
}) {
  const archiveNodeCount = viewMode === "archive" ? (archivePositions?.size ?? 0) : 0;
  const archiveAvatarScale = archiveAvatarScaleForNodeCount(archiveNodeCount);

  return (
    <>
      {stars.map((star) => {
        const role = roleForStar(star, {
          state,
          focusId,
          partnerId,
          eligiblePartnerIds: eligiblePartnerSet,
        });
        const inArchive = viewMode === "archive";
        const archivePos = inArchive ? (archivePositions?.get(star.member.id) ?? null) : null;
        if (inArchive && archivePos === null) return null;

        const overridePos = inArchive
          ? archivePos
          : role === "partner" && focusStar
            ? pairPartnerPosition(focusStar)
            : null;
        const flythroughLayer: StarFlythroughLayer | undefined = inArchive
          ? undefined
          : focusedIds === undefined
            ? undefined
            : computeStarFlythroughLayer(star.member.id, { focusedIds });
        const cohort =
          !inArchive && flythroughLayer === 1
            ? computeRosterCohort(star.member.id, {
                eligibleIds: eligiblePartnerSet,
                offTonightIds: offTonightSet ?? EMPTY_OFF_TONIGHT_IDS,
              })
            : undefined;
        const isFocusMarker =
          !inArchive &&
          role === "focus" &&
          state === "focus_selected" &&
          isRosterFlythroughLayer(currentLayer) &&
          rosterSubview === "eligibles";
        const lensFilteredOut =
          starClickHandlers?.filterMatchedIds !== undefined &&
          !starClickHandlers.filterMatchedIds.has(star.member.id);
        const archiveIsolated =
          inArchive &&
          archiveIsolation !== undefined &&
          !archiveIsolation.includedMemberIds.has(star.member.id);
        const clusterPosition = resolveClusterPosition({
          memberId: star.member.id,
          role,
          state,
          flythroughLayer,
          currentLayer,
          focusOrder,
          rosterLeadOrder,
          rosterClusterBounds,
          partnerRingBounds,
          inArchive,
          rosterSubview,
        });
        // The ego-selected member sits at world center; size it up so the hub
        // of the spoke diagram reads as the subject, not just another partner.
        const isArchiveEgoFocus = inArchive && archiveIsolation?.focusMemberId === star.member.id;
        const archiveSlabActivity = inArchive
          ? {
              intensityMultiplier: archiveIsolated ? 0.36 : 1.08,
              scaleMultiplier: isArchiveEgoFocus
                ? archiveAvatarScale * 1.42
                : archiveIsolated
                  ? Math.max(0.74, archiveAvatarScale * 0.74)
                  : archiveAvatarScale,
            }
          : undefined;
        const flythroughPresentation = inArchive
          ? null
          : resolveFlythroughStarPresentation({
              role,
              flythroughLayer,
              currentLayer,
              cohort,
              rosterSubview,
              activeLeadCount: rosterLeadOrder.length,
              isFocusMarker,
              focusMarkerScale: FOCUS_MARKER_SCALE,
              clustered: clusterPosition !== null,
            });
        if (!inArchive && flythroughPresentation === null) return null;
        const slabActivity = inArchive ? archiveSlabActivity : flythroughPresentation?.slabActivity;
        const sizingRole = inArchive ? "eligible" : (flythroughPresentation?.sizingRole ?? role);

        return (
          <StarSprite
            key={star.member.id}
            star={star}
            role={role}
            sizingRole={sizingRole}
            state={state}
            overridePos={overridePos}
            layerZOffset={inArchive ? 0 : computeLayerZOffset(role, state)}
            texture={textures[star.member.id]}
            flareTexture={flareTexture}
            haloTexture={haloTexture}
            rimLightTexture={rimLightTexture}
            showAura={showAuras}
            reducedMotion={reducedMotion}
            canvasScale={canvasScale}
            filteredOut={lensFilteredOut || archiveIsolated}
            hovered={hoveredId === star.member.id}
            cardOpen={activeStarId === star.member.id}
            flythroughLayer={flythroughLayer}
            slabActivity={slabActivity}
            forceAvatar={inArchive}
            clusterPosition={clusterPosition}
            renderOverlay={buildFocusMarkerOverlay({
              role,
              state,
              star,
              onClearFocus: starClickHandlers?.onClearFocus,
              onHoverChange: (hovered) => {
                onHudOverlayHoveredChange(hovered);
                onHoveredIdChange((current) =>
                  hovered ? star.member.id : current === star.member.id ? null : current,
                );
              },
            })}
            quickActions={starClickHandlers?.quickActionsForStar?.(star)}
            onQuickActionsHoverChange={(hovered) => {
              onHudOverlayHoveredChange(hovered);
              onHoveredIdChange((current) =>
                hovered ? star.member.id : current === star.member.id ? null : current,
              );
            }}
            onHoverEnter={() => onHoveredIdChange(star.member.id)}
            onHoverLeave={() => onHoveredIdChange(null)}
            onClick={
              starClickHandlers?.onStarClick === undefined
                ? undefined
                : (event) => starClickHandlers.onStarClick?.(star, event)
            }
            onDoubleClick={
              starClickHandlers?.onStarDoubleClick === undefined
                ? undefined
                : (event) => starClickHandlers.onStarDoubleClick?.(star, event)
            }
          />
        );
      })}
    </>
  );
}
