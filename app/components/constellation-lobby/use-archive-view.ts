import { useMemo } from "react";

import type { GameSave } from "../../domain/game";
import {
  derivePairArchiveGraph,
  type PairArchiveEdge,
  type PairArchiveGraph,
} from "../../services/pair-archive-graph";
import { buildArchiveEdgeSpecs, computeArchiveStarPosition } from "./archive-layout";
import { applyImportanceBudget } from "./edge-lod";
import {
  computeArchiveCameraTarget,
  computeArchiveFitCamera,
  computeFlythroughCameraTarget,
} from "./math";
import type { ArchiveSelection, FlythroughLayer, StarMark, Vec3, ViewMode } from "./types";

// Sentinel returned when viewMode !== "archive" so the derived memos below
// don't churn on every unrelated save mutation. Same reference each render.
const EMPTY_PAIR_GRAPH: PairArchiveGraph = {
  nodes: [],
  edges: [],
  nodeById: new Map(),
  edgeById: new Map(),
  notesByPair: new Map(),
  incidentEdgesByNode: new Map(),
  nodeNoteSummaryByNode: new Map(),
  meta: { filedPairs: 0, isolatedMembers: [] },
};

export function useArchiveView({
  save,
  viewMode,
  archiveSelection,
  currentLayer,
  focusStar,
}: {
  save: GameSave;
  viewMode: ViewMode;
  archiveSelection: ArchiveSelection;
  currentLayer: FlythroughLayer;
  focusStar: StarMark | undefined;
}): {
  archivePositions: ReadonlyMap<string, Vec3>;
  archiveEdges: ReturnType<typeof buildArchiveEdgeSpecs>;
  archiveIsolation: { focusMemberId: string; includedMemberIds: ReadonlySet<string> } | undefined;
  cameraTarget: ReturnType<typeof computeFlythroughCameraTarget>;
  /** Per-member incident edges. Forwarded to the dossier slot. */
  incidentEdgesByNode: ReadonlyMap<string, readonly PairArchiveEdge[]>;
} {
  // Only derive the pair graph when the player is actually in archive view —
  // otherwise every save persist (intent file, scenario pick, knowledge gain)
  // recomputed it and produced a fresh `cameraTarget` reference even though
  // the tonight branch of the memo never reads the graph.
  const archiveGraph = useMemo(
    () =>
      viewMode === "archive"
        ? derivePairArchiveGraph(save.members, save.pairStates, save.memories, { minDegree: 1 })
        : EMPTY_PAIR_GRAPH,
    [viewMode, save.members, save.pairStates, save.memories],
  );

  // Only paired members (those in archiveGraph.nodes) get an archive position.
  // Members without any filed-note pair are excluded entirely so the archive
  // reads as a constellation of pairs, not a roll-call of the roster. The
  // Scene loop treats a missing position as "skip this star" in archive mode.
  const archivePositions = useMemo(() => {
    const positions = new Map<string, Vec3>();
    for (const node of archiveGraph.nodes) {
      positions.set(node.member.id, computeArchiveStarPosition(node.member.id, archiveGraph, null));
    }
    return positions;
  }, [archiveGraph]);

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
      return computeFlythroughCameraTarget(currentLayer, focusStar);
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
    // No selection — fit the camera to the bounding box of paired stars so
    // a small archive (a single pair, a handful of pairs) reads tight and
    // legible rather than as specks against the pulled-back overhead.
    return computeArchiveFitCamera([...archivePositions.values()]);
  }, [viewMode, archiveSelection, archiveGraph, archivePositions, currentLayer, focusStar]);

  return {
    archivePositions,
    archiveEdges,
    archiveIsolation,
    cameraTarget,
    incidentEdgesByNode: archiveGraph.incidentEdgesByNode,
  };
}
