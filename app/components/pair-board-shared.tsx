import type { CSSProperties } from "react";

import type { PairBoardEdge, PairBoardPoint } from "./pair-board-layout";

export const FALLBACK_EDGE_COLOR_A = "#f43f5e";
export const FALLBACK_EDGE_COLOR_B = "#d946ef";

export type ActivePairBoardSelection =
  | { kind: "node"; memberId: string }
  | { kind: "edge"; pairId: string };

export type PairBoardSelection = ActivePairBoardSelection | { kind: "none" };

export type FieldHover =
  | { kind: "none" }
  | { kind: "node"; memberId: string }
  | { kind: "edge"; pairId: string };

export type ElementSize = { width: number; height: number };

export type PairNodeStyle = CSSProperties & { "--node-ring-color": string };

export type AdjacencyMap = Map<string, Set<string>>;

export type ResolvedEdge = {
  edge: PairBoardEdge;
  a: PairBoardPoint;
  b: PairBoardPoint;
  d: string;
};

export function ImportanceDots({ value }: { value: number }) {
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

export function splitLead(text: string): { lead: string; tail: string } {
  const trimmed = text.trim();
  const breaks = [". ", "? ", "! "]
    .map((token) => trimmed.indexOf(token))
    .filter((index) => index > 0);
  if (breaks.length === 0) return { lead: trimmed, tail: "" };
  const cut = Math.min(...breaks);
  return { lead: trimmed.slice(0, cut + 1), tail: trimmed.slice(cut + 2).trim() };
}
