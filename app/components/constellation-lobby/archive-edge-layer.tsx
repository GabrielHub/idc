import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { PairArchiveEdge } from "../../services/pair-archive-graph";
import { NebulaCloud } from "./archive-nebula";
import type { PairEdgeRenderSpec } from "./archive-layout";
import { colorForHealth, PairEdgeMesh } from "./pair-edge-mesh";
import type { ArchiveSelection } from "./types";

export function ArchiveEdgeLayer({
  edges,
  archiveSelection,
  archiveIsolation,
  endpointInset,
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
  /** World-space distance each edge stops short of its paired stars' discs. */
  endpointInset?: number;
  hoveredStarId: string | null;
  hoveredEdgeId: string | null;
  onHoveredEdgeChange: Dispatch<SetStateAction<string | null>>;
  onArchiveEdgeHover?: (pairId: string | null) => void;
  onArchiveEdgeClick?: (pairId: string) => void;
  renderArchiveEdgeTooltip?: (edge: PairArchiveEdge) => ReactNode;
}) {
  // While a pair or member is selected, the side-rail dossier owns the detailed
  // read. Suppressing the floating midpoint tooltip in that case stops the two
  // cards from stacking over the field — the source of the "two cards at once"
  // clutter. Hover peeks return as soon as the selection clears.
  const tooltipsEnabled = archiveSelection === null;
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
        const highlighted = isHovered || isSelected;
        // Memory nebula blooms only around a focused pair (selected, hovered,
        // or an isolation-focus's incident edges) so the resting field stays
        // clean and the per-pair fbm shaders stay few.
        const showNebula = isSelected || isHovered || (archiveIsolation !== undefined && !isFaded);
        const nebulaIntensity = isSelected ? 0.3 : isHovered ? 0.2 : 0.14;
        return (
          <group key={pairId}>
            {showNebula ? (
              <NebulaCloud
                midpoint={{
                  x: (spec.from.x + spec.to.x) * 0.5,
                  y: (spec.from.y + spec.to.y) * 0.5,
                  z: (spec.from.z + spec.to.z) * 0.5,
                }}
                span={Math.hypot(
                  spec.to.x - spec.from.x,
                  spec.to.y - spec.from.y,
                  spec.to.z - spec.from.z,
                )}
                noteCount={spec.edge.noteCount}
                blockerCount={spec.edge.closureBlockers.length}
                color={colorForHealth(spec.edge.health, highlighted)}
                intensity={nebulaIntensity}
              />
            ) : null}
            <PairEdgeMesh
              edge={spec.edge}
              from={spec.from}
              to={spec.to}
              control={spec.control}
              endpointInset={endpointInset}
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
              hoverTooltip={tooltipsEnabled ? renderArchiveEdgeTooltip?.(spec.edge) : undefined}
            />
          </group>
        );
      })}
    </>
  );
}
