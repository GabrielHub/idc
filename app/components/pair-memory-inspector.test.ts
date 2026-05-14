import { describe, expect, it } from "vitest";

import { pairStateSchema, type PairState } from "../domain/game";
import { buildPairMemoryTimeline } from "./pair-memory-inspector";

function basePair(overrides: Partial<PairState> = {}): PairState {
  return pairStateSchema.parse({
    id: "pair-jenna-pike__vhool",
    participantIds: ["jenna-pike", "vhool"],
    stats: {
      chemistry: 50,
      trust: 50,
      stability: 50,
      conflict: 20,
      weirdnessTolerance: 50,
      spark: 50,
      strain: 20,
      relationshipHealth: 50,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
    ...overrides,
  });
}

describe("buildPairMemoryTimeline", () => {
  it("returns no entries for an empty pair state", () => {
    expect(buildPairMemoryTimeline(basePair())).toEqual([]);
  });

  it("emits a filed entry for each active agreement", () => {
    const pair = basePair({
      agreements: [
        {
          id: "agreement-1",
          text: "No filming at the table.",
          status: "active",
          createdAt: "2026-05-05T12:00:00.000Z",
        },
      ],
    });

    const timeline = buildPairMemoryTimeline(pair);

    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toMatchObject({
      kind: "agreement_filed",
      text: "No filming at the table.",
      occurredAt: "2026-05-05T12:00:00.000Z",
    });
  });

  it("emits filed plus resolution entries for honored, broken, retired agreements", () => {
    const pair = basePair({
      agreements: [
        {
          id: "agreement-honored",
          text: "Plan one quiet evening.",
          status: "honored",
          createdAt: "2026-05-05T12:00:00.000Z",
          resolvedAt: "2026-05-05T12:30:00.000Z",
        },
        {
          id: "agreement-broken",
          text: "No filming at the table.",
          status: "broken",
          createdAt: "2026-05-05T12:05:00.000Z",
          resolvedAt: "2026-05-05T12:40:00.000Z",
        },
        {
          id: "agreement-retired",
          text: "Revisit boundary next month.",
          status: "retired",
          createdAt: "2026-05-05T12:10:00.000Z",
          resolvedAt: "2026-05-05T12:35:00.000Z",
        },
      ],
    });

    const kinds = buildPairMemoryTimeline(pair).map((entry) => entry.kind);

    expect(kinds).toContain("agreement_filed");
    expect(kinds).toContain("agreement_honored");
    expect(kinds).toContain("agreement_broken");
    expect(kinds).toContain("agreement_retired");
    expect(kinds.filter((k) => k === "agreement_filed")).toHaveLength(3);
  });

  it("emits resolution entries for resolved and dropped open loops only", () => {
    const pair = basePair({
      openLoops: [
        {
          id: "loop-open",
          text: "Whether Kade can make a memory without uploading it.",
          status: "open",
          createdAt: "2026-05-05T12:00:00.000Z",
        },
        {
          id: "loop-resolved",
          text: "Plan a second cook night.",
          status: "resolved",
          createdAt: "2026-05-05T12:05:00.000Z",
          resolvedAt: "2026-05-05T12:25:00.000Z",
        },
        {
          id: "loop-dropped",
          text: "Move in question.",
          status: "dropped",
          createdAt: "2026-05-05T12:10:00.000Z",
          resolvedAt: "2026-05-05T12:30:00.000Z",
        },
      ],
    });

    const kinds = buildPairMemoryTimeline(pair).map((entry) => entry.kind);

    expect(kinds.filter((k) => k === "open_loop_filed")).toHaveLength(3);
    expect(kinds).toContain("open_loop_resolved");
    expect(kinds).toContain("open_loop_dropped");
    expect(kinds).not.toContain("open_loop_open");
  });

  it("sorts entries by occurredAt descending so the latest change is first", () => {
    const pair = basePair({
      agreements: [
        {
          id: "agreement-broken",
          text: "No filming at the table.",
          status: "broken",
          createdAt: "2026-05-05T12:00:00.000Z",
          resolvedAt: "2026-05-05T12:40:00.000Z",
        },
      ],
      openLoops: [
        {
          id: "loop-open",
          text: "Whether Kade can make a memory.",
          status: "open",
          createdAt: "2026-05-05T12:10:00.000Z",
        },
        {
          id: "loop-resolved",
          text: "Plan a second cook night.",
          status: "resolved",
          createdAt: "2026-05-05T12:05:00.000Z",
          resolvedAt: "2026-05-05T12:20:00.000Z",
        },
      ],
    });

    const timeline = buildPairMemoryTimeline(pair);
    const occurredAt = timeline.map((entry) => entry.occurredAt);

    expect(occurredAt).toEqual([...occurredAt].sort((a, b) => b.localeCompare(a)));
    expect(timeline[0]?.kind).toBe("agreement_broken");
  });

  it("carries source session and judge snapshot ids onto every entry", () => {
    const pair = basePair({
      agreements: [
        {
          id: "agreement-1",
          text: "No filming at the table.",
          status: "honored",
          createdAt: "2026-05-05T12:00:00.000Z",
          resolvedAt: "2026-05-05T12:30:00.000Z",
          sourceDateSessionId: "date-session-1",
          sourceJudgeSnapshotId: "judge-1",
        },
      ],
    });

    const timeline = buildPairMemoryTimeline(pair);

    expect(timeline.every((entry) => entry.sourceDateSessionId === "date-session-1")).toBe(true);
    expect(timeline.every((entry) => entry.sourceJudgeSnapshotId === "judge-1")).toBe(true);
  });

  it("skips resolution entries for active or open items without a resolvedAt timestamp", () => {
    const pair = basePair({
      agreements: [
        {
          id: "agreement-active",
          text: "No filming at the table.",
          status: "active",
          createdAt: "2026-05-05T12:00:00.000Z",
        },
      ],
      openLoops: [
        {
          id: "loop-open",
          text: "Whether Kade can make a memory.",
          status: "open",
          createdAt: "2026-05-05T12:00:00.000Z",
        },
      ],
    });

    const timeline = buildPairMemoryTimeline(pair);

    expect(timeline.map((entry) => entry.kind)).toEqual(["agreement_filed", "open_loop_filed"]);
  });
});
