// Layout math lives in pair-board-layout.ts. This file owns presentation,
// motion, and interaction.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import type { DateScenario, MemoryRecord, Member, PairState } from "../domain/game";
import { EASE_OUT_QUART, pad2, Portrait } from "./dashboard-atoms";
import {
  bezierMidpoint,
  bezierPathD,
  derivePairGraph,
  describeRecency,
  edgeBaseOpacity,
  edgeStrokeWidth,
  nodeBaseRadius,
  nodePortraitVariant,
  type PairBoardEdge,
  type PairBoardGraph,
  type PairBoardNode,
  type PairBoardPoint,
} from "./pair-board-layout";

const FIELD_ASPECT_RATIO = 1.6;
const FIELD_MIN_HEIGHT = 480;
const FIELD_MAX_HEIGHT = 760;

const FALLBACK_EDGE_COLOR_A = "#f43f5e";
const FALLBACK_EDGE_COLOR_B = "#d946ef";

// Drift amplitudes must stay inside the bubble's outer halo (about 6px)
// so edges anchored to base positions never visibly disconnect.
const DRIFT_AMPLITUDE_X = 4.5;
const DRIFT_AMPLITUDE_Y = 3.5;
const DRIFT_PERIOD_X_BASE = 8.4;
const DRIFT_PERIOD_X_VARIANCE = 2.6;
const DRIFT_PERIOD_Y_BASE = 10.2;
const DRIFT_PERIOD_Y_VARIANCE = 2.2;

type ActivePairBoardSelection =
  | { kind: "node"; memberId: string }
  | { kind: "edge"; pairId: string };

type PairBoardSelection = ActivePairBoardSelection | { kind: "none" };

type FieldHover =
  | { kind: "none" }
  | { kind: "node"; memberId: string }
  | { kind: "edge"; pairId: string };

type PairNodeStyle = CSSProperties & { "--node-ring-color": string };

type ResolvedEdge = {
  edge: PairBoardEdge;
  a: PairBoardPoint;
  b: PairBoardPoint;
  d: string;
};

export type PairBoardProps = {
  members: Member[];
  pairStates: PairState[];
  memories: MemoryRecord[];
  scenarios: DateScenario[];
  shiftCount: number;
};

export function PairBoard({
  members,
  pairStates,
  memories,
  scenarios,
  shiftCount,
}: PairBoardProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [showGhostPairs, setShowGhostPairs] = useState(false);
  const [minDegree, setMinDegree] = useState(1);
  const [selection, setSelection] = useState<PairBoardSelection>({ kind: "none" });
  const [hover, setHover] = useState<FieldHover>({ kind: "none" });

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );
  const scenarioById = useMemo(
    () => new Map(scenarios.map((scenario) => [scenario.id, scenario])),
    [scenarios],
  );

  const graph = useMemo(
    () => derivePairGraph(members, pairStates, memories, { showGhostPairs, minDegree }),
    [members, pairStates, memories, showGhostPairs, minDegree],
  );

  const adjacency = useMemo(() => buildAdjacency(graph.edges), [graph.edges]);

  useEffect(() => {
    if (selection.kind === "node" && graph.nodeById.get(selection.memberId) === undefined) {
      setSelection({ kind: "none" });
    } else if (selection.kind === "edge" && graph.edgeById.get(selection.pairId) === undefined) {
      setSelection({ kind: "none" });
    }
  }, [selection, graph]);

  const fieldRef = useRef<HTMLDivElement>(null);
  const size = useElementSize(fieldRef);

  const closeRail = useCallback(() => {
    setSelection({ kind: "none" });
  }, []);

  const handleNodeActivate = useCallback((memberId: string) => {
    setSelection({ kind: "node", memberId });
  }, []);

  const handleEdgeActivate = useCallback((pairId: string) => {
    setSelection({ kind: "edge", pairId });
  }, []);

  const isEmpty = graph.nodes.length === 0;

  return (
    <div className="aura-glass relative overflow-hidden rounded-card ring-1 ring-aura-hairline">
      <PairBoardLegend
        graph={graph}
        shiftCount={shiftCount}
        showGhostPairs={showGhostPairs}
        onToggleGhostPairs={() => setShowGhostPairs((current) => !current)}
        minDegree={minDegree}
        onMinDegreeChange={setMinDegree}
      />

      <div
        ref={fieldRef}
        className="relative w-full"
        style={{ height: computeFieldHeight(size.width) }}
        role="group"
        aria-label="Pair connection board"
      >
        <PairBoardBackdrop reduceMotion={reduceMotion} />

        {isEmpty ? (
          <PairBoardEmpty
            showGhostPairs={showGhostPairs}
            ghostPairCount={graph.meta.ghostPairs}
            onShowGhost={() => setShowGhostPairs(true)}
          />
        ) : (
          <PairBoardField
            graph={graph}
            adjacency={adjacency}
            size={size}
            hover={hover}
            selection={selection}
            reduceMotion={reduceMotion}
            onHoverChange={setHover}
            onSelectNode={handleNodeActivate}
            onSelectEdge={handleEdgeActivate}
            onClearSelection={closeRail}
            memberById={memberById}
            scenarioById={scenarioById}
          />
        )}

        <AnimatePresence>
          {selection.kind !== "none" ? (
            <PairBoardRail
              key={selectionKey(selection)}
              selection={selection}
              graph={graph}
              memberById={memberById}
              scenarioById={scenarioById}
              onClose={closeRail}
              onSelectEdge={handleEdgeActivate}
              onSelectNode={handleNodeActivate}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <PairBoardOffField isolated={graph.meta.isolatedMembers} />

      <PairBoardKeyboardMirror
        graph={graph}
        memberById={memberById}
        onSelectEdge={handleEdgeActivate}
        onSelectNode={handleNodeActivate}
      />
    </div>
  );
}

/* ================================================================== */
/* Hooks                                                              */
/* ================================================================== */

type ElementSize = { width: number; height: number };

function useElementSize(ref: React.RefObject<HTMLElement | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 960, height: 600 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (node === null) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const width = rect.width;
      const height = computeFieldHeight(width);
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

/* ================================================================== */
/* Legend ribbon                                                      */
/* ================================================================== */

function PairBoardLegend({
  graph,
  shiftCount,
  showGhostPairs,
  onToggleGhostPairs,
  minDegree,
  onMinDegreeChange,
}: {
  graph: PairBoardGraph;
  shiftCount: number;
  showGhostPairs: boolean;
  onToggleGhostPairs: () => void;
  minDegree: number;
  onMinDegreeChange: (next: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-aura-hairline px-6 py-4 lg:px-8">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          // pair-board.network · shift {pad2(shiftCount)}
        </span>
        <h2 className="font-display text-display-md font-semibold leading-none tracking-tight text-aura-ink">
          Pair board
        </h2>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-2">
        <LegendStat label="nodes" value={graph.nodes.length} accent="rose" />
        <LegendStat label="filed" value={graph.meta.filedPairs} accent="fuchsia" />
        <LegendStat label="ghost" value={graph.meta.ghostPairs} accent="violet" muted />

        <DegreeFilter value={minDegree} onChange={onMinDegreeChange} />

        <button
          type="button"
          data-sfx="click"
          aria-pressed={showGhostPairs}
          onClick={onToggleGhostPairs}
          className={`group inline-flex cursor-pointer items-center gap-2 rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ring-1 transition ${
            showGhostPairs
              ? "bg-aura-violet/15 text-aura-ink ring-aura-violet/40"
              : "bg-white/55 text-aura-muted ring-aura-hairline hover:text-aura-ink"
          }`}
        >
          <span
            aria-hidden
            className={`inline-block size-2 rounded-full transition ${
              showGhostPairs ? "bg-aura-violet" : "bg-aura-hairline-strong"
            }`}
          />
          ghost pairs
        </button>
      </div>
    </div>
  );
}

function LegendStat({
  label,
  value,
  accent,
  muted = false,
}: {
  label: string;
  value: number;
  accent: "rose" | "fuchsia" | "violet";
  muted?: boolean;
}) {
  const dot =
    accent === "rose"
      ? "bg-aura-rose"
      : accent === "fuchsia"
        ? "bg-aura-fuchsia"
        : "bg-aura-violet";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill bg-white/55 px-3 py-1.5 ring-1 ring-aura-hairline ${
        muted ? "opacity-70" : ""
      }`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
        {label}
      </span>
      <span className="font-mono text-micro font-semibold tabular-nums text-aura-ink">
        {pad2(value)}
      </span>
    </span>
  );
}

function DegreeFilter({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const options: { id: number; label: string; hint: string }[] = [
    { id: 1, label: "all", hint: "Show every paired member" },
    { id: 2, label: "≥2", hint: "Members in at least two pairs" },
    { id: 3, label: "hubs", hint: "Members in three or more pairs" },
  ];
  return (
    <div className="inline-flex items-center gap-2 rounded-pill bg-white/55 p-1 ring-1 ring-aura-hairline">
      <span className="px-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        connections
      </span>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            data-sfx="click"
            aria-pressed={active}
            title={option.hint}
            onClick={() => onChange(option.id)}
            className={`cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
              active ? "bg-aura-ink text-white shadow-quiet" : "text-aura-muted hover:text-aura-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* Backdrop and field                                                 */
/* ================================================================== */

function PairBoardBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(244,63,94,0.06)_0%,rgba(244,63,94,0)_55%),radial-gradient(circle_at_75%_70%,rgba(217,70,239,0.05)_0%,rgba(217,70,239,0)_60%),radial-gradient(circle_at_22%_72%,rgba(167,139,250,0.05)_0%,rgba(167,139,250,0)_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_calc(100%-1px),rgba(15,23,42,0.04)_0),linear-gradient(90deg,transparent_calc(100%-1px),rgba(15,23,42,0.035)_0)] bg-[length:32px_32px] opacity-70" />
      <FieldRingsOverlay />
      {reduceMotion ? null : <RadarSweep />}
    </div>
  );
}

function FieldRingsOverlay() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full opacity-60"
    >
      {[14, 28, 40].map((radius) => (
        <circle
          key={radius}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(15, 23, 42, 0.06)"
          strokeWidth="0.18"
          strokeDasharray="0.6 1.2"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <circle
        cx="50"
        cy="50"
        r="0.6"
        fill="rgba(244, 63, 94, 0.45)"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function RadarSweep() {
  return (
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 size-[180%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.10)_0%,rgba(244,63,94,0)_45%)]"
      animate={{ scale: [0.6, 1.1, 0.6], opacity: [0, 0.6, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function PairBoardField({
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
  const tooltipTarget: FieldHover = hover;

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
        target={tooltipTarget}
        graph={graph}
        size={size}
        memberById={memberById}
        scenarioById={scenarioById}
      />
    </div>
  );
}

/* ================================================================== */
/* Edges                                                              */
/* ================================================================== */

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
      opacity={edge.isGhost ? 0.3 : 0.6}
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

  const dashAttr = edge.isGhost ? "4 6" : undefined;

  const isActive = emphasis.isActive;
  const showBead = isActive && !reduceMotion;

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
        style={cursorPointerStyle}
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
        strokeDasharray={dashAttr}
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

/* ================================================================== */
/* Nodes                                                              */
/* ================================================================== */

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
                  boxShadow: `0 0 0 2px var(--node-ring-color), 0 0 0 6px rgba(255, 253, 249, 0.85), 0 18px 28px -16px var(--node-ring-color)`,
                }}
              />
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-[-10px] rounded-full opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100`}
                style={{
                  background: `radial-gradient(circle, var(--node-ring-color) 0%, transparent 65%)`,
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

/* ================================================================== */
/* Tooltip                                                            */
/* ================================================================== */

function PairBoardTooltip({
  target,
  graph,
  size,
  memberById,
  scenarioById,
}: {
  target: FieldHover;
  graph: PairBoardGraph;
  size: ElementSize;
  memberById: Map<string, Member>;
  scenarioById: Map<string, DateScenario>;
}) {
  const now = Date.now();
  return (
    <AnimatePresence>
      {target.kind === "node" ? (
        <NodeTooltip
          key={`node-${target.memberId}`}
          memberId={target.memberId}
          graph={graph}
          size={size}
          now={now}
        />
      ) : target.kind === "edge" ? (
        <EdgeTooltip
          key={`edge-${target.pairId}`}
          pairId={target.pairId}
          graph={graph}
          size={size}
          memberById={memberById}
          scenarioById={scenarioById}
          now={now}
        />
      ) : null}
    </AnimatePresence>
  );
}

function NodeTooltip({
  memberId,
  graph,
  size,
  now,
}: {
  memberId: string;
  graph: PairBoardGraph;
  size: ElementSize;
  now: number;
}) {
  const node = graph.nodeById.get(memberId);
  if (node === undefined) return null;
  const incident = graph.edges.filter((edge) => edge.a === memberId || edge.b === memberId);
  const latestNoteAt = incident.reduce((acc, edge) => Math.max(acc, edge.latestNoteAt), 0);
  const recency = describeRecency(latestNoteAt, now);
  const radius = nodeBaseRadius(node.degree);
  const x = node.basePosition.x * size.width;
  const y = node.basePosition.y * size.height;
  const sideRight = x < size.width * 0.6;
  const offsetX = sideRight ? radius + 14 : -(radius + 14);
  const tooltipX = sideRight ? x + offsetX : x + offsetX - 248;
  const tooltipY = Math.max(8, y - 40);

  return (
    <motion.div
      className="aura-glass-strong pointer-events-none absolute z-30 w-[248px] rounded-card px-4 py-3 shadow-quiet ring-1 ring-aura-hairline"
      style={{ left: tooltipX, top: tooltipY }}
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 4 }}
      transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
      role="status"
    >
      <p className="font-display text-display-sm font-semibold leading-tight text-aura-ink">
        {node.member.firstName}
      </p>
      <p className="mt-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
        {node.member.species.toLowerCase()}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full"
          style={{ background: node.ringColor }}
        />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          {pad2(node.degree)} {node.degree === 1 ? "pair filed" : "pairs filed"} · {recency}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          top note
        </span>
        <ImportanceDots
          value={incident.reduce((acc, edge) => Math.max(acc, edge.topImportance), 0)}
        />
      </div>
      <p className="mt-3 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
        click to open · esc closes
      </p>
    </motion.div>
  );
}

function EdgeTooltip({
  pairId,
  graph,
  size,
  memberById,
  scenarioById,
  now,
}: {
  pairId: string;
  graph: PairBoardGraph;
  size: ElementSize;
  memberById: Map<string, Member>;
  scenarioById: Map<string, DateScenario>;
  now: number;
}) {
  const edge = graph.edgeById.get(pairId);
  if (edge === undefined) return null;
  const a = resolvePosition(edge.a, graph);
  const b = resolvePosition(edge.b, graph);
  if (a === undefined || b === undefined) return null;
  const mid = bezierMidpoint(a, b, edge.curvature);
  const x = mid.x * size.width;
  const y = mid.y * size.height;
  const memberA = memberById.get(edge.a);
  const memberB = memberById.get(edge.b);
  if (memberA === undefined || memberB === undefined) return null;
  const recency = describeRecency(edge.latestNoteAt, now);
  const lead = edge.latestNote === undefined ? null : splitLead(edge.latestNote.text).lead;
  const scenario =
    edge.latestNote?.scenarioId === undefined
      ? undefined
      : scenarioById.get(edge.latestNote.scenarioId);

  const sideRight = x < size.width * 0.55;
  const tooltipX = sideRight ? x + 18 : x - 268;
  const tooltipY = Math.max(8, y - 36);

  return (
    <motion.div
      className="aura-glass-strong pointer-events-none absolute z-30 w-[260px] rounded-card px-4 py-3 shadow-quiet ring-1 ring-aura-hairline"
      style={{ left: tooltipX, top: tooltipY }}
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 4 }}
      transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
      role="status"
    >
      <div className="flex items-center gap-3">
        <div className="flex -space-x-3">
          <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
            <Portrait member={memberA} variant="thumb" />
          </span>
          <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
            <Portrait member={memberB} variant="thumb" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-display-sm font-semibold leading-tight text-aura-ink">
            {memberA.firstName} & {memberB.firstName}
          </p>
          <p className="mt-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
            {pad2(edge.noteCount)} {edge.noteCount === 1 ? "note" : "notes"} · {recency}
          </p>
        </div>
      </div>
      {lead === null ? (
        <p className="mt-3 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          ghost pair · no notes filed
        </p>
      ) : (
        <p className="aura-accent mt-3 line-clamp-2 text-body leading-snug text-aura-ink/90">
          {lead}
        </p>
      )}
      {scenario === undefined ? null : (
        <p className="mt-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/85">
          {scenario.title}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <ImportanceDots value={edge.topImportance} />
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          click to open
        </span>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/* Detail rail                                                        */
/* ================================================================== */

function PairBoardRail({
  selection,
  graph,
  memberById,
  scenarioById,
  onClose,
  onSelectEdge,
  onSelectNode,
}: {
  selection: ActivePairBoardSelection;
  graph: PairBoardGraph;
  memberById: Map<string, Member>;
  scenarioById: Map<string, DateScenario>;
  onClose: () => void;
  onSelectEdge: (pairId: string) => void;
  onSelectNode: (memberId: string) => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const now = Date.now();

  return (
    <motion.aside
      className="aura-glass-strong absolute right-3 top-3 bottom-3 z-40 flex w-[clamp(320px,40%,420px)] flex-col overflow-hidden rounded-card shadow-quiet ring-1 ring-aura-hairline"
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.28, ease: EASE_OUT_QUART }}
      role="dialog"
      aria-modal={false}
      aria-label={selection.kind === "node" ? "Member connections" : "Pair file"}
      data-pair-board-interactive="rail"
    >
      <header className="flex items-start justify-between gap-3 border-b border-aura-hairline px-5 py-4">
        <div className="space-y-1">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
            {selection.kind === "node" ? "// member · connections" : "// pair · file"}
          </p>
          <p className="font-display text-display-sm font-semibold leading-tight text-aura-ink">
            {selection.kind === "node"
              ? (memberById.get(selection.memberId)?.firstName ?? "?")
              : pairTitleFor(selection.pairId, graph, memberById)}
          </p>
        </div>
        <button
          type="button"
          data-sfx="click"
          onClick={onClose}
          aria-label="Close detail panel"
          className="cursor-pointer rounded-pill bg-white/60 px-2.5 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted ring-1 ring-aura-hairline transition hover:text-aura-ink"
        >
          close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {selection.kind === "node" ? (
          <NodeDetailBody
            memberId={selection.memberId}
            graph={graph}
            memberById={memberById}
            now={now}
            onSelectEdge={onSelectEdge}
          />
        ) : (
          <EdgeDetailBody
            pairId={selection.pairId}
            graph={graph}
            memberById={memberById}
            scenarioById={scenarioById}
            now={now}
            onSelectNode={onSelectNode}
          />
        )}
      </div>
    </motion.aside>
  );
}

function NodeDetailBody({
  memberId,
  graph,
  memberById,
  now,
  onSelectEdge,
}: {
  memberId: string;
  graph: PairBoardGraph;
  memberById: Map<string, Member>;
  now: number;
  onSelectEdge: (pairId: string) => void;
}) {
  const member = memberById.get(memberId);
  if (member === undefined) return null;
  const incident = graph.edges
    .filter((edge) => edge.a === memberId || edge.b === memberId)
    .sort((left, right) => right.latestNoteAt - left.latestNoteAt);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="rounded-full border-2 border-white/90 bg-white shadow-quiet"
          style={{
            boxShadow: `0 0 0 3px ${member.chatBubble?.accentColor ?? FALLBACK_EDGE_COLOR_A}55`,
          }}
        >
          <Portrait member={member} variant="card" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
            {member.species}
          </p>
          <p className="mt-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
            {pad2(incident.length)}{" "}
            {incident.length === 1 ? "filed connection" : "filed connections"}
          </p>
        </div>
      </div>

      {incident.length === 0 ? (
        <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          No filed connections yet.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {incident.map((edge) => {
            const partnerId = edge.a === memberId ? edge.b : edge.a;
            const partner = memberById.get(partnerId);
            if (partner === undefined) return null;
            const noteCount = (graph.notesByPair.get(edge.pairId) ?? []).length;
            return (
              <li key={edge.pairId}>
                <button
                  type="button"
                  data-sfx="click"
                  onClick={() => onSelectEdge(edge.pairId)}
                  className="aura-glass aura-glass-lift group flex w-full cursor-pointer items-center gap-3 rounded-card px-3 py-2.5 text-left ring-1 ring-aura-hairline transition"
                >
                  <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
                    <Portrait member={partner} variant="thumb" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lead font-semibold text-aura-ink">
                      with {partner.firstName}
                    </span>
                    <span className="mt-0.5 block font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
                      {pad2(noteCount)} {noteCount === 1 ? "note" : "notes"} ·{" "}
                      {describeRecency(edge.latestNoteAt, now)}
                    </span>
                  </span>
                  <ImportanceDots value={edge.topImportance} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EdgeDetailBody({
  pairId,
  graph,
  memberById,
  scenarioById,
  now,
  onSelectNode,
}: {
  pairId: string;
  graph: PairBoardGraph;
  memberById: Map<string, Member>;
  scenarioById: Map<string, DateScenario>;
  now: number;
  onSelectNode: (memberId: string) => void;
}) {
  const edge = graph.edgeById.get(pairId);
  if (edge === undefined) return null;
  const memberA = memberById.get(edge.a);
  const memberB = memberById.get(edge.b);
  if (memberA === undefined || memberB === undefined) return null;
  const notes = sortNotesByCreatedDesc(graph.notesByPair.get(pairId) ?? []);

  return (
    <div className="space-y-5">
      <div className="flex items-stretch gap-3">
        <PairFaceCard
          member={memberA}
          accent={memberA.chatBubble?.accentColor ?? FALLBACK_EDGE_COLOR_A}
          onSelect={() => onSelectNode(memberA.id)}
        />
        <ConnectionThread />
        <PairFaceCard
          member={memberB}
          accent={memberB.chatBubble?.accentColor ?? FALLBACK_EDGE_COLOR_B}
          onSelect={() => onSelectNode(memberB.id)}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <RailMini label="notes" value={pad2(edge.noteCount)} />
        <RailMini label="top note" value={`${edge.topImportance}/05`} />
        <RailMini label="latest" value={describeRecency(edge.latestNoteAt, now)} />
      </div>

      {notes.length === 0 ? (
        <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          Ghost pair. Nothing filed yet.
        </p>
      ) : (
        <NoteThread notes={notes} scenarioById={scenarioById} />
      )}
    </div>
  );
}

function PairFaceCard({
  member,
  accent,
  onSelect,
}: {
  member: Member;
  accent: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-sfx="click"
      onClick={onSelect}
      className="aura-glass aura-glass-lift group relative flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-card px-2 py-3 text-center ring-1 ring-aura-hairline transition focus:outline-none"
      style={{ boxShadow: `inset 0 0 0 1px ${accent}33` }}
    >
      <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
        <Portrait member={member} variant="card" />
      </span>
      <span className="font-display text-lead font-semibold leading-tight text-aura-ink">
        {member.firstName}
      </span>
      <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
        focus member
      </span>
      <span
        aria-hidden
        className="absolute inset-x-3 bottom-0 h-0.5 rounded-pill"
        style={{ background: accent }}
      />
    </button>
  );
}

function ConnectionThread() {
  return (
    <div aria-hidden className="flex w-12 flex-col items-center justify-center gap-1.5">
      <span className="size-1.5 rounded-full bg-aura-rose" />
      <span className="h-12 w-px bg-gradient-to-b from-aura-rose via-aura-fuchsia to-aura-violet" />
      <span className="size-1.5 rounded-full bg-aura-violet" />
    </div>
  );
}

function RailMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="aura-glass rounded-card px-2.5 py-2 text-center ring-1 ring-aura-hairline">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        {label}
      </p>
      <p className="mt-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink">
        {value}
      </p>
    </div>
  );
}

function NoteThread({
  notes,
  scenarioById,
}: {
  notes: MemoryRecord[];
  scenarioById: Map<string, DateScenario>;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([notes[0]?.id].filter((id): id is string => Boolean(id))),
  );

  return (
    <ol className="relative space-y-3 pl-4">
      <span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 w-px bg-gradient-to-b from-aura-rose/45 via-aura-hairline-strong to-transparent"
      />
      {notes.map((note) => {
        const isOpen = expanded.has(note.id);
        const scenario =
          note.scenarioId === undefined ? undefined : scenarioById.get(note.scenarioId);
        const dateLabel = formatRailTimestamp(note.createdAt);
        const { lead, tail } = splitLead(note.text);
        return (
          <li key={note.id} className="relative">
            <span
              aria-hidden
              className="absolute left-[-13px] top-2.5 size-2.5 rounded-full bg-aura-rose ring-4 ring-aura-paper"
            />
            <button
              type="button"
              data-sfx="click"
              onClick={() => {
                setExpanded((current) => {
                  const next = new Set(current);
                  if (next.has(note.id)) next.delete(note.id);
                  else next.add(note.id);
                  return next;
                });
              }}
              aria-expanded={isOpen}
              className="aura-glass group flex w-full cursor-pointer flex-col gap-1.5 rounded-card px-3.5 py-3 text-left ring-1 ring-aura-hairline transition hover:ring-aura-rose/35"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                  {dateLabel}
                </span>
                <ImportanceDots value={note.importance} />
              </div>
              {scenario === undefined ? null : (
                <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-muted">
                  {scenario.title}
                </span>
              )}
              <p
                className={`aura-accent text-body leading-snug text-aura-ink/90 ${isOpen ? "" : "line-clamp-2"}`}
              >
                {lead}
              </p>
              {isOpen && tail.length > 0 ? (
                <p className="text-body leading-relaxed text-aura-ink/80">{tail}</p>
              ) : null}
              {note.tags.length === 0 || !isOpen ? null : (
                <ul className="mt-1 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-pill bg-white/65 px-2 py-0.5 ring-1 ring-aura-hairline"
                    >
                      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
                        {tag}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
                {isOpen ? "collapse" : "expand"}
                <span aria-hidden>{isOpen ? "↑" : "↓"}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ================================================================== */
/* Empty + isolated members                                           */
/* ================================================================== */

function PairBoardEmpty({
  showGhostPairs,
  ghostPairCount,
  onShowGhost,
}: {
  showGhostPairs: boolean;
  ghostPairCount: number;
  onShowGhost: () => void;
}) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="aura-glass-strong relative max-w-md space-y-3 rounded-card px-6 py-7 text-center ring-1 ring-aura-hairline">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
          // pair-board · empty
        </p>
        <h3 className="font-display text-display-sm font-semibold leading-tight text-aura-ink">
          No pair connections filed yet.
        </h3>
        <p className="text-body leading-relaxed text-aura-muted">
          Cupid files a pair note when a date wraps. The board fills in as connections form.
        </p>
        {!showGhostPairs && ghostPairCount > 0 ? (
          <button
            type="button"
            data-sfx="click"
            onClick={onShowGhost}
            className="cursor-pointer rounded-pill bg-aura-ink px-4 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-quiet"
          >
            show {pad2(ghostPairCount)} unfiled pairs
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PairBoardOffField({ isolated }: { isolated: Member[] }) {
  if (isolated.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-aura-hairline px-6 py-3 lg:px-8">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
        off the board · {pad2(isolated.length)}
      </span>
      <ul className="flex flex-wrap items-center gap-1.5">
        {isolated.slice(0, 12).map((member) => (
          <li
            key={member.id}
            className="inline-flex items-center gap-1.5 rounded-pill bg-white/55 px-2 py-1 ring-1 ring-aura-hairline"
            title={`${member.firstName} is not shown on the current board`}
          >
            <span aria-hidden className="rounded-full border border-white bg-white">
              <Portrait member={member} variant="thumb" />
            </span>
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
              {member.firstName}
            </span>
          </li>
        ))}
        {isolated.length > 12 ? (
          <li className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
            +{isolated.length - 12} more
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function PairBoardKeyboardMirror({
  graph,
  memberById,
  onSelectEdge,
  onSelectNode,
}: {
  graph: PairBoardGraph;
  memberById: Map<string, Member>;
  onSelectEdge: (pairId: string) => void;
  onSelectNode: (memberId: string) => void;
}) {
  const id = useId();
  return (
    <div className="sr-only" aria-label="Pair board keyboard list">
      <h3 id={`${id}-nodes`}>Members</h3>
      <ul aria-labelledby={`${id}-nodes`}>
        {graph.nodes.map((node) => (
          <li key={node.member.id}>
            <button type="button" onClick={() => onSelectNode(node.member.id)}>
              {node.member.firstName}, {node.degree}{" "}
              {node.degree === 1 ? "pair filed" : "pairs filed"}
            </button>
          </li>
        ))}
      </ul>
      <h3 id={`${id}-edges`}>Pair connections</h3>
      <ul aria-labelledby={`${id}-edges`}>
        {graph.edges.map((edge) => {
          const a = memberById.get(edge.a)?.firstName ?? edge.a;
          const b = memberById.get(edge.b)?.firstName ?? edge.b;
          return (
            <li key={edge.pairId}>
              <button type="button" onClick={() => onSelectEdge(edge.pairId)}>
                {a} and {b}, {edge.noteCount} notes filed
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

type AdjacencyMap = Map<string, Set<string>>;

function buildAdjacency(edges: readonly PairBoardEdge[]): AdjacencyMap {
  const map: AdjacencyMap = new Map();
  for (const edge of edges) {
    const aSet = map.get(edge.a) ?? new Set<string>();
    aSet.add(edge.pairId);
    map.set(edge.a, aSet);
    const bSet = map.get(edge.b) ?? new Set<string>();
    bSet.add(edge.pairId);
    map.set(edge.b, bSet);
  }
  return map;
}

function resolvePosition(memberId: string, graph: PairBoardGraph): PairBoardPoint | undefined {
  return graph.nodeById.get(memberId)?.basePosition;
}

function sortNotesByCreatedDesc(notes: readonly MemoryRecord[]): MemoryRecord[] {
  return notes
    .map((note) => ({ note, t: Date.parse(note.createdAt) }))
    .sort((left, right) => right.t - left.t)
    .map(({ note }) => note);
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

  const isAnyHover = hover.kind !== "none";
  const isAnySelection = selection.kind !== "none";
  const isAnyFocus = isAnyHover || isAnySelection;

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

function pairTitleFor(
  pairId: string,
  graph: PairBoardGraph,
  memberById: Map<string, Member>,
): string {
  const edge = graph.edgeById.get(pairId);
  if (edge === undefined) return pairId;
  const a = memberById.get(edge.a)?.firstName ?? edge.a;
  const b = memberById.get(edge.b)?.firstName ?? edge.b;
  return `${a} & ${b}`;
}

function splitLead(text: string): { lead: string; tail: string } {
  const trimmed = text.trim();
  const breaks = [". ", "? ", "! "]
    .map((token) => trimmed.indexOf(token))
    .filter((index) => index > 0);
  if (breaks.length === 0) return { lead: trimmed, tail: "" };
  const cut = Math.min(...breaks);
  return { lead: trimmed.slice(0, cut + 1), tail: trimmed.slice(cut + 2).trim() };
}

function ImportanceDots({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span
      aria-label={`Importance ${filled} of 5`}
      title={`Importance ${filled} of 5`}
      className="inline-flex items-center gap-0.5"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`size-1.5 rounded-full ${i < filled ? "bg-aura-rose" : "bg-aura-hairline-strong"}`}
        />
      ))}
    </span>
  );
}

function selectionKey(selection: PairBoardSelection): string {
  if (selection.kind === "node") return `node-${selection.memberId}`;
  if (selection.kind === "edge") return `edge-${selection.pairId}`;
  return "none";
}

function formatRailTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function computeFieldHeight(width: number): number {
  const target = width / FIELD_ASPECT_RATIO;
  return Math.max(FIELD_MIN_HEIGHT, Math.min(FIELD_MAX_HEIGHT, target));
}

const cursorPointerStyle: CSSProperties = { cursor: "pointer" };
