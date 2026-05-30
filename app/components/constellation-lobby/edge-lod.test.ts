import { describe, expect, it } from "vitest";

import type { MemoryRecord } from "../../domain/game";
import type { PairArchiveEdge } from "../../services/pair-archive-graph";
import { classifyEdgeLod } from "./edge-lod";

const latestNote: MemoryRecord = {
  id: "memory-test-pair",
  scope: "pair",
  visibility: "public",
  subjectIds: ["member-a", "member-b"],
  pairId: "member-a__member-b",
  text: "A filed pair note.",
  tags: ["date_summary"],
  importance: 1,
  createdAt: "2026-05-01T12:00:00.000Z",
};

function buildEdge(overrides: Partial<PairArchiveEdge> = {}): PairArchiveEdge {
  return {
    pairId: "member-a__member-b",
    a: "member-a",
    b: "member-b",
    noteCount: 1,
    topImportance: 1,
    latestNote,
    latestNoteAt: Date.parse(latestNote.createdAt),
    health: 52,
    closureProgress: 24,
    chemistry: 42,
    trust: 38,
    datesCompleted: 1,
    datesNeeded: 2,
    closureBlockers: ["trust"],
    curvature: 0,
    ...overrides,
  };
}

describe("classifyEdgeLod", () => {
  it("keeps low-importance far-band edges visible and hoverable", () => {
    const lod = classifyEdgeLod(buildEdge({ topImportance: 1 }), 40, false, false);

    expect(lod).not.toBeNull();
    expect(lod?.band).toBe("far");
    expect(lod?.opacityScale).toBeGreaterThan(0);
    expect(lod?.mountHitSleeve).toBe(true);
    expect(lod?.mountHtml).toBe(false);
  });

  it("boosts hovered far-band edges to near detail", () => {
    const lod = classifyEdgeLod(buildEdge({ topImportance: 1 }), 40, true, false);

    expect(lod).toMatchObject({
      band: "near",
      mountHitSleeve: true,
      mountHtml: true,
    });
  });
});
