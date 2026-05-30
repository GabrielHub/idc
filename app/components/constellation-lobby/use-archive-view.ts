import { useMemo } from "react";

import type { GameSave } from "../../domain/game";
import {
  derivePairArchiveGraph,
  type PairArchiveEdge,
  type PairArchiveGraph,
} from "../../services/pair-archive-graph";
import {
  archiveEgoLayout,
  buildArchiveEdgeSpecs,
  computeArchiveStarPosition,
  type ArchiveEgoLayout,
} from "./archive-layout";
import { applyImportanceBudget } from "./edge-lod";
import {
  computeArchiveCameraTarget,
  computeArchiveEgoCameraTarget,
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
  // This is the resting "constellation" layout — radial by pairing degree.
  const radialPositions = useMemo(() => {
    const positions = new Map<string, Vec3>();
    for (const node of archiveGraph.nodes) {
      positions.set(node.member.id, computeArchiveStarPosition(node.member.id, archiveGraph, null));
    }
    return positions;
  }, [archiveGraph]);

  // Selecting a member reflows the field into an ego layout: the member centers
  // and its filed partners ring around it (newest pairing at twelve o'clock,
  // walking clockwise), with everyone else pushed out past the ring. Built off
  // the radial positions so the background push preserves each star's bearing,
  // which keeps the constellation→ego transition reading as a pull-to-center
  // rather than a random scatter.
  const egoLayout = useMemo<ArchiveEgoLayout | null>(() => {
    if (viewMode !== "archive") return null;
    if (archiveSelection?.kind !== "member") return null;
    const focusMemberId = archiveSelection.memberId;
    if (!radialPositions.has(focusMemberId)) return null;
    const incident = archiveGraph.incidentEdgesByNode.get(focusMemberId) ?? [];
    const partnerIds = [...incident]
      .sort((a, b) => b.latestNoteAt - a.latestNoteAt)
      .map((edge) => (edge.a === focusMemberId ? edge.b : edge.a));
    return archiveEgoLayout({ focusMemberId, partnerIds, basePositions: radialPositions });
  }, [viewMode, archiveSelection, radialPositions, archiveGraph.incidentEdgesByNode]);

  const archivePositions = egoLayout?.positions ?? radialPositions;

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
    if (archiveSelection?.kind === "member" && egoLayout !== null) {
      // Center the ego: the focused star is pinned at the origin, so frame the
      // origin and bracket the partner ring rather than bias-tracking a graph
      // position the reflow just moved.
      return computeArchiveEgoCameraTarget({
        ringRadiusX: egoLayout.ringRadiusX,
        ringRadiusY: egoLayout.ringRadiusY,
      });
    }
    // No selection — fit the camera to the bounding box of paired stars so
    // a small archive (a single pair, a handful of pairs) reads tight and
    // legible rather than as specks against the pulled-back overhead.
    return computeArchiveFitCamera([...radialPositions.values()]);
  }, [
    viewMode,
    archiveSelection,
    archiveGraph,
    archivePositions,
    radialPositions,
    egoLayout,
    currentLayer,
    focusStar,
  ]);

  return {
    archivePositions,
    archiveEdges,
    archiveIsolation,
    cameraTarget,
    incidentEdgesByNode: archiveGraph.incidentEdgesByNode,
  };
}
