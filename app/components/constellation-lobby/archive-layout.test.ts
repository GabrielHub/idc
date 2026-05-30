import { describe, expect, it } from "vitest";

import { memoryRecordSchema, type MemoryRecord } from "../../domain/game";
import type { PairArchiveEdge } from "../../services/pair-archive-graph";
import { archiveEgoLayout, buildArchiveEdgeSpecs } from "./archive-layout";
import { archiveEdgeEndpointInset, computeArchiveEgoCameraTarget } from "./math";
import type { Vec3 } from "./types";

function makeMemory(pairId: string): MemoryRecord {
  return memoryRecordSchema.parse({
    id: `mem-${pairId}`,
    scope: "pair",
    visibility: "public",
    subjectIds: pairId.split("::"),
    pairId,
    scenarioId: "park-loop-with-a-dog",
    dateSessionId: `session-${pairId}`,
    text: "A filed exchange.",
    tags: ["date_summary"],
    importance: 3,
    createdAt: "2026-05-15T18:00:00.000Z",
  });
}

function makeEdge(a: string, b: string, curvature: number): PairArchiveEdge {
  const pairId = `${a}::${b}`;
  return {
    pairId,
    a,
    b,
    noteCount: 1,
    topImportance: 3,
    latestNote: makeMemory(pairId),
    latestNoteAt: 0,
    health: 60,
    closureProgress: 50,
    chemistry: 60,
    trust: 60,
    datesCompleted: 1,
    datesNeeded: 3,
    closureBlockers: [],
    curvature,
  };
}

/** Perpendicular distance from `control` to the chord through `from`→`to`. */
function bowHeight(from: Vec3, to: Vec3, control: Vec3): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  // 2D cross product of the chord direction with (control - from).
  return Math.abs(((control.x - from.x) * dy - (control.y - from.y) * dx) / length);
}

describe("archiveEgoLayout", () => {
  const basePositions = new Map<string, Vec3>([
    ["focus", { x: 3, y: -2, z: 1.5 }],
    ["alpha", { x: -5, y: 4, z: 0 }],
    ["beta", { x: 6, y: 6, z: -1.5 }],
    ["stranger", { x: -8, y: -3, z: 0 }],
  ]);

  it("pins the focused member at the world origin, pulled forward in Z", () => {
    const { positions } = archiveEgoLayout({
      focusMemberId: "focus",
      partnerIds: ["alpha", "beta"],
      basePositions,
    });
    const focus = positions.get("focus");
    expect(focus?.x).toBe(0);
    expect(focus?.y).toBe(0);
    expect(focus?.z).toBeGreaterThan(0);
  });

  it("rings partners around the focus, newest at twelve o'clock walking clockwise", () => {
    const { positions, ringRadiusX, ringRadiusY } = archiveEgoLayout({
      focusMemberId: "focus",
      partnerIds: ["alpha", "beta", "gamma", "delta"],
      basePositions,
    });
    const first = positions.get("alpha");
    // Twelve o'clock: centered horizontally, at the top of the ring (world +Y up).
    expect(first?.x).toBeCloseTo(0);
    expect(first?.y).toBeCloseTo(ringRadiusY);
    // Quarter turn clockwise lands the second partner at three o'clock.
    const second = positions.get("beta");
    expect(second?.x).toBeCloseTo(ringRadiusX);
    expect(second?.y).toBeCloseTo(0);
  });

  it("pushes non-incident members out past the partner ring and drops them back in Z", () => {
    const { positions, ringRadiusX, ringRadiusY } = archiveEgoLayout({
      focusMemberId: "focus",
      partnerIds: ["alpha", "beta"],
      basePositions,
    });
    const stranger = positions.get("stranger");
    expect(stranger).toBeDefined();
    const radius = Math.hypot((stranger?.x ?? 0) / ringRadiusX, (stranger?.y ?? 0) / ringRadiusY);
    // Normalized to the ring ellipse, the stranger sits beyond it.
    expect(radius).toBeGreaterThan(1);
    expect(stranger?.z).toBeLessThan(0);
  });

  it("widens the ring as more partners need to fit around the focus", () => {
    const few = archiveEgoLayout({ focusMemberId: "focus", partnerIds: ["a"], basePositions });
    const many = archiveEgoLayout({
      focusMemberId: "focus",
      partnerIds: Array.from({ length: 8 }, (_, i) => `p${i}`),
      basePositions,
    });
    expect(many.ringRadiusX).toBeGreaterThan(few.ringRadiusX);
  });
});

describe("archiveEdgeEndpointInset", () => {
  it("stays positive so every edge clears its discs", () => {
    expect(archiveEdgeEndpointInset(2)).toBeGreaterThan(0);
    expect(archiveEdgeEndpointInset(40)).toBeGreaterThan(0);
  });

  it("shrinks as the graph grows, tracking the shrinking avatars", () => {
    expect(archiveEdgeEndpointInset(20)).toBeLessThan(archiveEdgeEndpointInset(4));
  });

  it("scales down with the canvas so smaller portraits keep a proportional gap", () => {
    expect(archiveEdgeEndpointInset(8, 0.75)).toBeLessThan(archiveEdgeEndpointInset(8, 1.1));
  });
});

describe("computeArchiveEgoCameraTarget", () => {
  it("centers the frame on the world origin where the ego is pinned", () => {
    const target = computeArchiveEgoCameraTarget({ ringRadiusX: 5, ringRadiusY: 3.5 });
    expect(target.position[0]).toBe(0);
    expect(target.position[1]).toBe(0);
    expect(target.lookAt).toEqual([0, 0, 0]);
  });

  it("dollies farther back as the partner ring grows", () => {
    const tight = computeArchiveEgoCameraTarget({ ringRadiusX: 4, ringRadiusY: 3 });
    const wide = computeArchiveEgoCameraTarget({ ringRadiusX: 8, ringRadiusY: 5 });
    expect(wide.position[2]).toBeGreaterThan(tight.position[2]);
  });
});

describe("buildArchiveEdgeSpecs curve bow", () => {
  const positions = new Map<string, Vec3>([
    ["a", { x: 0, y: 0, z: 0 }],
    ["b", { x: 2, y: 0, z: 0 }],
    ["c", { x: 0, y: 0, z: 0 }],
    ["d", { x: 16, y: 0, z: 0 }],
  ]);

  it("bows a long edge more than a short edge at equal curvature", () => {
    const [shortSpec, longSpec] = buildArchiveEdgeSpecs(
      [makeEdge("a", "b", 1), makeEdge("c", "d", 1)],
      positions,
    );
    const shortBow = bowHeight(shortSpec!.from, shortSpec!.to, shortSpec!.control);
    const longBow = bowHeight(longSpec!.from, longSpec!.to, longSpec!.control);
    expect(longBow).toBeGreaterThan(shortBow);
  });

  it("splits parallel pairs apart by bowing opposite-signed curvatures to opposite sides", () => {
    const [up, down] = buildArchiveEdgeSpecs(
      [makeEdge("a", "d", 0.8), makeEdge("a", "d", -0.8)],
      positions,
    );
    // Same chord (a→d on the x-axis); opposite curvature signs put the control
    // points on opposite sides of the chord.
    expect(Math.sign(up!.control.y)).toBe(-Math.sign(down!.control.y));
  });
});
