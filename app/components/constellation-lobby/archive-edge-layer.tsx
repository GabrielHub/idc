import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { PairArchiveEdge } from "../../services/pair-archive-graph";
import type { PairEdgeRenderSpec } from "./archive-layout";
import { PairEdgeMesh } from "./pair-edge-mesh";
import type { ArchiveSelection } from "./types";

export function ArchiveEdgeLayer({
  edges,
  archiveSelection,
  archiveIsolation,
  hoveredStarId,
  hoveredEdgeId,
  onHoveredEdgeChange,
  onArchiveEdgeHover,
  onArchiveEdgeClick,
  renderArchiveEdgeTooltip,
}: {
  edges: readonly PairEdgeRenderSpec[];
  archiveSelection: ArchiveSelection;
  archiveIsolation?: {
    focusMemberId: string;
    includedMemberIds: ReadonlySet<string>;
  };
  hoveredStarId: string | null;
  hoveredEdgeId: string | null;
  onHoveredEdgeChange: Dispatch<SetStateAction<string | null>>;
  onArchiveEdgeHover?: (pairId: string | null) => void;
  onArchiveEdgeClick?: (pairId: string) => void;
  renderArchiveEdgeTooltip?: (edge: PairArchiveEdge) => ReactNode;
}) {
  return (
    <>
      {edges.map((spec) => {
        const pairId = spec.edge.pairId;
        const isSelected =
          archiveSelection !== null &&
          archiveSelection.kind === "pair" &&
          archiveSelection.pairId === pairId;
        const incidentToHoveredStar =
          hoveredStarId !== null &&
          (spec.edge.a === hoveredStarId || spec.edge.b === hoveredStarId);
        const isHovered = hoveredEdgeId === pairId || incidentToHoveredStar;
        const isFaded =
          archiveIsolation !== undefined &&
          spec.edge.a !== archiveIsolation.focusMemberId &&
          spec.edge.b !== archiveIsolation.focusMemberId;
        return (
          <PairEdgeMesh
            key={pairId}
            edge={spec.edge}
            from={spec.from}
            to={spec.to}
            control={spec.control}
            isHovered={isHovered}
            isSelected={isSelected}
            isFaded={isFaded}
            onHoverEnter={() => {
              onHoveredEdgeChange(pairId);
              onArchiveEdgeHover?.(pairId);
            }}
            onHoverLeave={() => {
              onHoveredEdgeChange((current) => (current === pairId ? null : current));
              onArchiveEdgeHover?.(null);
            }}
            onClick={(event) => {
              event.stopPropagation();
              onArchiveEdgeClick?.(pairId);
            }}
            hoverTooltip={renderArchiveEdgeTooltip?.(spec.edge)}
          />
        );
      })}
    </>
  );
}
