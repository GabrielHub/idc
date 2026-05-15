import { motion } from "motion/react";
import { useMemo } from "react";

import type { DateScenario, Member } from "../domain/game";
import { EASE_OUT_QUART, Portrait } from "./dashboard-atoms";
import {
  bezierPathD,
  edgeBaseOpacity,
  edgeStrokeWidth,
  nodeBaseRadius,
  nodePortraitVariant,
  type PairBoardEdge,
  type PairBoardGraph,
  type PairBoardNode,
} from "./pair-board-layout";
import {
  FALLBACK_EDGE_COLOR_A,
  FALLBACK_EDGE_COLOR_B,
  type AdjacencyMap,
  type ElementSize,
  type FieldHover,
  type PairBoardSelection,
  type PairNodeStyle,
  type ResolvedEdge,
} from "./pair-board-shared";
import { PairBoardTooltip } from "./pair-board-tooltip";

// Drift amplitudes must stay inside the bubble's outer halo (about 6px)
// so edges anchored to base positions never visibly disconnect.
const DRIFT_AMPLITUDE_X = 4.5;
const DRIFT_AMPLITUDE_Y = 3.5;
const DRIFT_PERIOD_X_BASE = 8.4;
const DRIFT_PERIOD_X_VARIANCE = 2.6;
const DRIFT_PERIOD_Y_BASE = 10.2;
const DRIFT_PERIOD_Y_VARIANCE = 2.2;

export function PairBoardField({
  graph,
  adjacency,
  size,
  hover,
  selection,
  reduceMotion,
  onHoverChange,
  onSelectNode,
  onSelectEdge,
  onClearSelection,
  memberById,
  scenarioById,
}: {
  graph: PairBoardGraph;
  adjacency: AdjacencyMap;
  size: ElementSize;
  hover: FieldHover;
  selection: PairBoardSelection;
  reduceMotion: boolean;
  onHoverChange: (next: FieldHover) => void;
  onSelectNode: (memberId: string) => void;
  onSelectEdge: (pairId: string) => void;
  onClearSelection: () => void;
  memberById: Map<string, Member>;
  scenarioById: Map<string, DateScenario>;
}) {
  const resolvedEdges = useMemo<ResolvedEdge[]>(() => {
    const items: ResolvedEdge[] = [];
    for (const edge of graph.edges) {
      const a = graph.nodeById.get(edge.a)?.basePosition;
      const b = graph.nodeById.get(edge.b)?.basePosition;
      if (a === undefined || b === undefined) continue;
      items.push({
        edge,
        a,
        b,
        d: bezierPathD(a, b, edge.curvature, size.width, size.height),
      });
    }
    return items;
  }, [graph.edges, graph.nodeById, size.width, size.height]);

  return (
    <div
      className="absolute inset-0"
      data-clear-target
      onClick={(event) => {
        const target = event.target as HTMLElement | SVGElement;
        if (target.closest("[data-pair-board-interactive]") !== null) return;
        onClearSelection();
      }}
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${size.width} ${size.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          {resolvedEdges.map((entry) => (
            <EdgeGradient
              key={entry.edge.pairId}
              entry={entry}
              size={size}
              memberById={memberById}
            />
          ))}
        </defs>

        {resolvedEdges.map((entry) => (
          <PairEdgeBack key={entry.edge.pairId} entry={entry} />
        ))}
        {resolvedEdges.map((entry, index) => (
          <PairEdge
            key={entry.edge.pairId}
            entry={entry}
            index={index}
            adjacency={adjacency}
            hover={hover}
            selection={selection}
            reduceMotion={reduceMotion}
            onHoverChange={onHoverChange}
            onSelect={onSelectEdge}
          />
        ))}
      </svg>

      <div className="absolute inset-0">
        {graph.nodes.map((node, index) => (
          <PairNode
            key={node.member.id}
            node={node}
            size={size}
            index={index}
            adjacency={adjacency}
            hover={hover}
            selection={selection}
            reduceMotion={reduceMotion}
            onHoverChange={onHoverChange}
            onSelect={onSelectNode}
          />
        ))}
      </div>

      <PairBoardTooltip
        target={hover}
        graph={graph}
        size={size}
        memberById={memberById}
        scenarioById={scenarioById}
      />
    </div>
  );
}

function EdgeGradient({
  entry,
  size,
  memberById,
}: {
  entry: ResolvedEdge;
  size: ElementSize;
  memberById: Map<string, Member>;
}) {
  const { edge, a, b } = entry;
  const colorA = memberById.get(edge.a)?.chatBubble?.accentColor ?? FALLBACK_EDGE_COLOR_A;
  const colorB = memberById.get(edge.b)?.chatBubble?.accentColor ?? FALLBACK_EDGE_COLOR_B;
  return (
    <linearGradient
      id={`pair-edge-grad-${edge.pairId}`}
      gradientUnits="userSpaceOnUse"
      x1={a.x * size.width}
      y1={a.y * size.height}
      x2={b.x * size.width}
      y2={b.y * size.height}
    >
      <stop offset="0%" stopColor={colorA} />
      <stop offset="100%" stopColor={colorB} />
    </linearGradient>
  );
}

function PairEdgeBack({ entry }: { entry: ResolvedEdge }) {
  const { edge, d } = entry;
  const width = edgeStrokeWidth(edge) * 2.4;
  return (
    <path
      d={d}
      fill="none"
      stroke="rgba(255, 253, 249, 0.85)"
      strokeWidth={width}
      strokeLinecap="round"
      pointerEvents="none"
      opacity={0.6}
    />
  );
}

function PairEdge({
  entry,
  index,
  adjacency,
  hover,
  selection,
  reduceMotion,
  onHoverChange,
  onSelect,
}: {
  entry: ResolvedEdge;
  index: number;
  adjacency: AdjacencyMap;
  hover: FieldHover;
  selection: PairBoardSelection;
  reduceMotion: boolean;
  onHoverChange: (next: FieldHover) => void;
  onSelect: (pairId: string) => void;
}) {
  const { edge, d } = entry;
  const baseWidth = edgeStrokeWidth(edge);
  const baseOpacity = edgeBaseOpacity(edge);

  const emphasis = computeEdgeEmphasis(edge, hover, selection, adjacency);

  const strokeWidth = baseWidth * emphasis.widthMul;
  const opacity = baseOpacity * emphasis.opacityMul;

  const showBead = emphasis.isActive && !reduceMotion;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index, 14) * 0.02,
        ease: EASE_OUT_QUART,
      }}
    >
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(20, baseWidth * 5)}
        strokeLinecap="round"
        pointerEvents="stroke"
        className="cursor-pointer"
        onMouseEnter={() => onHoverChange({ kind: "edge", pairId: edge.pairId })}
        onMouseLeave={() => onHoverChange({ kind: "none" })}
        onClick={() => onSelect(edge.pairId)}
        role="button"
        tabIndex={-1}
        aria-label={`Pair connection ${edge.pairId}`}
        data-pair-board-interactive="edge"
      />
      <motion.path
        d={d}
        fill="none"
        stroke={`url(#pair-edge-grad-${edge.pairId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        animate={{ opacity, strokeWidth }}
        transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
        pointerEvents="none"
      />
      {showBead ? <PairEdgeBead entry={entry} /> : null}
    </motion.g>
  );
}

function PairEdgeBead({ entry }: { entry: ResolvedEdge }) {
  const { edge, d } = entry;
  return (
    <g>
      <circle r={3.6} fill="#fff" opacity={0.9}>
        <animateMotion dur="1.6s" repeatCount="indefinite" rotate="auto" path={d} />
      </circle>
      <circle r={6.4} fill={`url(#pair-edge-grad-${edge.pairId})`} opacity={0.55}>
        <animateMotion dur="1.6s" repeatCount="indefinite" rotate="auto" path={d} />
      </circle>
    </g>
  );
}

function PairNode({
  node,
  size,
  index,
  adjacency,
  hover,
  selection,
  reduceMotion,
  onHoverChange,
  onSelect,
}: {
  node: PairBoardNode;
  size: ElementSize;
  index: number;
  adjacency: AdjacencyMap;
  hover: FieldHover;
  selection: PairBoardSelection;
  reduceMotion: boolean;
  onHoverChange: (next: FieldHover) => void;
  onSelect: (memberId: string) => void;
}) {
  const radius = nodeBaseRadius(node.degree);
  const portraitVariant = nodePortraitVariant(node.degree);
  const x = node.basePosition.x * size.width;
  const y = node.basePosition.y * size.height;

  const emphasis = computeNodeEmphasis(node, hover, selection, adjacency);

  const ringColor = node.ringColor;
  const isFocused = selection.kind === "node" && selection.memberId === node.member.id;

  const driftPeriodX = DRIFT_PERIOD_X_BASE + node.driftSeed * DRIFT_PERIOD_X_VARIANCE;
  const driftPeriodY = DRIFT_PERIOD_Y_BASE + (1 - node.driftSeed) * DRIFT_PERIOD_Y_VARIANCE;
  const driftDelayX = -node.driftSeed * driftPeriodX;
  const driftDelayY = -node.driftSeed * 0.7 * driftPeriodY;

  const driftAnimate = reduceMotion
    ? { x: 0, y: 0 }
    : {
        x: [-DRIFT_AMPLITUDE_X, DRIFT_AMPLITUDE_X, -DRIFT_AMPLITUDE_X],
        y: [-DRIFT_AMPLITUDE_Y, DRIFT_AMPLITUDE_Y, -DRIFT_AMPLITUDE_Y],
      };

  const driftTransition = reduceMotion
    ? undefined
    : {
        x: {
          duration: driftPeriodX,
          repeat: Infinity,
          ease: "easeInOut" as const,
          delay: driftDelayX,
        },
        y: {
          duration: driftPeriodY,
          repeat: Infinity,
          ease: "easeInOut" as const,
          delay: driftDelayY,
        },
      };

  const breath = reduceMotion
    ? undefined
    : {
        scale: [1, 1.025, 1],
        transition: {
          duration: 4 + node.driftSeed * 2,
          repeat: Infinity,
          ease: "easeInOut" as const,
          delay: node.driftSeed * 1.2,
        },
      };

  const nodeStyle: PairNodeStyle = {
    left: x - radius,
    top: y - radius,
    width: radius * 2,
    height: radius * 2,
    "--node-ring-color": ringColor,
  };

  return (
    <div className="absolute" style={nodeStyle}>
      <motion.div className="size-full" animate={driftAnimate} transition={driftTransition}>
        <motion.div
          className="size-full"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: emphasis.opacity,
            scale: emphasis.scale,
          }}
          transition={{
            duration: 0.36,
            delay: Math.min(index, 14) * 0.03,
            ease: EASE_OUT_QUART,
          }}
        >
          <motion.div className="size-full" animate={breath}>
            <button
              type="button"
              data-sfx="click"
              aria-pressed={isFocused}
              aria-label={nodeAriaLabel(node)}
              onMouseEnter={() => onHoverChange({ kind: "node", memberId: node.member.id })}
              onMouseLeave={() => onHoverChange({ kind: "none" })}
              onFocus={() => onHoverChange({ kind: "node", memberId: node.member.id })}
              onBlur={() => onHoverChange({ kind: "none" })}
              onClick={() => onSelect(node.member.id)}
              className="group relative grid size-full cursor-pointer place-items-center rounded-full focus:outline-none"
              data-pair-board-interactive="node"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow:
                    "0 0 0 2px var(--node-ring-color), 0 0 0 6px rgba(255, 253, 249, 0.85), 0 18px 28px -16px var(--node-ring-color)",
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-[-10px] rounded-full opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{
                  background: "radial-gradient(circle, var(--node-ring-color) 0%, transparent 65%)",
                  filter: "blur(12px)",
                  opacity: emphasis.haloOpacity,
                }}
              />

              <span className="relative grid size-full place-items-center overflow-hidden rounded-full bg-white">
                <Portrait member={node.member} variant={portraitVariant} />
              </span>

              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-1 -right-1 inline-flex size-5 items-center justify-center rounded-full bg-aura-ink text-white shadow-quiet"
                style={{
                  opacity: emphasis.degreeBadgeOpacity,
                }}
              >
                <span className="font-mono text-micro font-semibold tabular-nums leading-none">
                  {node.degree}
                </span>
              </span>
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 mt-1.5 -translate-x-1/2 whitespace-nowrap font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted"
        style={{ top: "100%", opacity: emphasis.labelOpacity }}
      >
        {node.member.firstName}
      </span>
    </div>
  );
}

function nodeAriaLabel(node: PairBoardNode): string {
  const noun = node.degree === 1 ? "pair filed" : "pairs filed";
  return `${node.member.firstName}, ${node.degree} ${noun}. Press Enter to expand.`;
}

type EdgeEmphasis = {
  widthMul: number;
  opacityMul: number;
  isActive: boolean;
};

function computeEdgeEmphasis(
  edge: PairBoardEdge,
  hover: FieldHover,
  selection: PairBoardSelection,
  adjacency: AdjacencyMap,
): EdgeEmphasis {
  const isHoveredEdge = hover.kind === "edge" && hover.pairId === edge.pairId;
  const isSelectedEdge = selection.kind === "edge" && selection.pairId === edge.pairId;
  const isHoveredNodeIncident =
    hover.kind === "node" && (adjacency.get(hover.memberId)?.has(edge.pairId) ?? false);
  const isSelectedNodeIncident =
    selection.kind === "node" && (adjacency.get(selection.memberId)?.has(edge.pairId) ?? false);

  const isActive =
    isHoveredEdge || isSelectedEdge || isHoveredNodeIncident || isSelectedNodeIncident;

  const isAnyFocus = hover.kind !== "none" || selection.kind !== "none";

  if (isActive) {
    return { widthMul: 1.4, opacityMul: 1.1, isActive: true };
  }
  if (isAnyFocus) {
    return { widthMul: 0.95, opacityMul: 0.32, isActive: false };
  }
  return { widthMul: 1, opacityMul: 1, isActive: false };
}

type NodeEmphasis = {
  opacity: number;
  scale: number;
  haloOpacity: number;
  labelOpacity: number;
  degreeBadgeOpacity: number;
};

function computeNodeEmphasis(
  node: PairBoardNode,
  hover: FieldHover,
  selection: PairBoardSelection,
  adjacency: AdjacencyMap,
): NodeEmphasis {
  const isHovered = hover.kind === "node" && hover.memberId === node.member.id;
  const isSelected = selection.kind === "node" && selection.memberId === node.member.id;

  const hoveredEdgeIncident =
    hover.kind === "edge" && (adjacency.get(node.member.id)?.has(hover.pairId) ?? false);
  const selectedEdgeIncident =
    selection.kind === "edge" && (adjacency.get(node.member.id)?.has(selection.pairId) ?? false);

  const hoveredNodeNeighbor =
    hover.kind === "node" && isAdjacentNode(node.member.id, hover.memberId, adjacency);
  const selectedNodeNeighbor =
    selection.kind === "node" && isAdjacentNode(node.member.id, selection.memberId, adjacency);

  const isActive =
    isHovered ||
    isSelected ||
    hoveredEdgeIncident ||
    selectedEdgeIncident ||
    hoveredNodeNeighbor ||
    selectedNodeNeighbor;

  const isAnyFocus = hover.kind !== "none" || selection.kind !== "none";

  if (isHovered || isSelected) {
    return { opacity: 1, scale: 1.08, haloOpacity: 0.55, labelOpacity: 1, degreeBadgeOpacity: 1 };
  }
  if (isActive) {
    return { opacity: 1, scale: 1.02, haloOpacity: 0.3, labelOpacity: 1, degreeBadgeOpacity: 0.9 };
  }
  if (isAnyFocus) {
    return {
      opacity: 0.4,
      scale: 0.96,
      haloOpacity: 0,
      labelOpacity: 0.5,
      degreeBadgeOpacity: 0.5,
    };
  }
  return { opacity: 1, scale: 1, haloOpacity: 0, labelOpacity: 0.85, degreeBadgeOpacity: 0.75 };
}

function isAdjacentNode(selfId: string, otherId: string, adjacency: AdjacencyMap): boolean {
  if (selfId === otherId) return true;
  const selfPairs = adjacency.get(selfId);
  const otherPairs = adjacency.get(otherId);
  if (selfPairs === undefined || otherPairs === undefined) return false;
  for (const pair of selfPairs) {
    if (otherPairs.has(pair)) return true;
  }
  return false;
}
