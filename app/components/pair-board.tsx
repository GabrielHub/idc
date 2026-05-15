import { AnimatePresence, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { DateScenario, MemoryRecord, Member, PairState } from "../domain/game";
import { derivePairGraph, type PairBoardEdge } from "./pair-board-layout";
import { PairBoardField } from "./pair-board-field";
import {
  PairBoardBackdrop,
  PairBoardEmpty,
  PairBoardKeyboardMirror,
  PairBoardLegend,
  PairBoardOffField,
} from "./pair-board-frame";
import { PairBoardRail } from "./pair-board-rail";
import type {
  AdjacencyMap,
  ElementSize,
  FieldHover,
  PairBoardSelection,
} from "./pair-board-shared";

const FIELD_ASPECT_RATIO = 1.6;
const FIELD_MIN_HEIGHT = 480;
const FIELD_MAX_HEIGHT = 760;

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
    () => derivePairGraph(members, pairStates, memories, { minDegree }),
    [members, pairStates, memories, minDegree],
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
          <PairBoardEmpty />
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

function selectionKey(selection: PairBoardSelection): string {
  if (selection.kind === "node") return `node-${selection.memberId}`;
  if (selection.kind === "edge") return `edge-${selection.pairId}`;
  return "none";
}

function computeFieldHeight(width: number): number {
  const target = width / FIELD_ASPECT_RATIO;
  return Math.max(FIELD_MIN_HEIGHT, Math.min(FIELD_MAX_HEIGHT, target));
}
