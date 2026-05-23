import { useMemo } from "react";

import type { GameSave } from "../../domain/game";
import { derivePairGraph } from "../pair-board-layout";
import { buildArchiveEdgeSpecs, computeArchiveStarPosition } from "./archive-layout";
import { applyImportanceBudget } from "./edge-lod";
import {
  computeArchiveCameraTarget,
  computeCameraTarget,
  computeFlythroughCameraTarget,
} from "./math";
import type {
  ArchiveSelection,
  FlythroughLayer,
  LobbyState,
  StarMark,
  Vec3,
  ViewMode,
} from "./types";

export function useArchiveView({
  save,
  stars,
  viewMode,
  archiveSelection,
  currentLayer,
  lobbyState,
  focusStar,
}: {
  save: GameSave;
  stars: readonly StarMark[];
  viewMode: ViewMode;
  archiveSelection: ArchiveSelection;
  currentLayer: FlythroughLayer;
  lobbyState: LobbyState;
  focusStar: StarMark | undefined;
}) {
  const archiveGraph = useMemo(
    () => derivePairGraph(save.members, save.pairStates, save.memories, { minDegree: 1 }),
    [save.members, save.pairStates, save.memories],
  );

  const archivePositions = useMemo(() => {
    const positions = new Map<string, Vec3>();
    const isolatedIndexById = new Map<string, number>();
    archiveGraph.meta.isolatedMembers.forEach((member, index) => {
      isolatedIndexById.set(member.id, index);
    });
    for (const star of stars) {
      const isolated = isolatedIndexById.get(star.member.id) ?? null;
      positions.set(
        star.member.id,
        computeArchiveStarPosition(star.member.id, archiveGraph, isolated),
      );
    }
    return positions;
  }, [archiveGraph, stars]);

  const archiveEdges = useMemo(
    () => buildArchiveEdgeSpecs(applyImportanceBudget(archiveGraph.edges), archivePositions),
    [archiveGraph.edges, archivePositions],
  );

  const archiveIsolation = useMemo<
    { focusMemberId: string; includedMemberIds: ReadonlySet<string> } | undefined
  >(() => {
    if (viewMode !== "archive") return undefined;
    if (archiveSelection?.kind !== "member") return undefined;
    const focusMemberId = archiveSelection.memberId;
    const included = new Set<string>([focusMemberId]);
    const incident = archiveGraph.incidentEdgesByNode.get(focusMemberId) ?? [];
    for (const edge of incident) {
      included.add(edge.a);
      included.add(edge.b);
    }
    return { focusMemberId, includedMemberIds: included };
  }, [viewMode, archiveSelection, archiveGraph.incidentEdgesByNode]);

  const cameraTarget = useMemo(() => {
    if (viewMode !== "archive") {
      return currentLayer === 0 && lobbyState !== "idle"
        ? computeCameraTarget(lobbyState, focusStar)
        : computeFlythroughCameraTarget(currentLayer, focusStar);
    }
    if (archiveSelection?.kind === "pair") {
      const edge = archiveGraph.edgeById.get(archiveSelection.pairId);
      if (edge !== undefined) {
        const a = archivePositions.get(edge.a);
        const b = archivePositions.get(edge.b);
        if (a !== undefined && b !== undefined) {
          return computeArchiveCameraTarget({
            pairMidpoint: {
              x: (a.x + b.x) * 0.5,
              y: (a.y + b.y) * 0.5,
              z: (a.z + b.z) * 0.5,
            },
          });
        }
      }
    }
    if (archiveSelection?.kind === "member") {
      const pos = archivePositions.get(archiveSelection.memberId);
      if (pos !== undefined) return computeArchiveCameraTarget({ focusedStar: pos });
    }
    return computeArchiveCameraTarget({});
  }, [
    viewMode,
    archiveSelection,
    archiveGraph,
    archivePositions,
    currentLayer,
    lobbyState,
    focusStar,
  ]);

  return { archiveGraph, archivePositions, archiveEdges, archiveIsolation, cameraTarget };
}
