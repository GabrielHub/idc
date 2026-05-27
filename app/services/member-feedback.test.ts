import { describe, expect, it } from "vitest";

import { memberSchema, pairStateSchema, type Member } from "../domain/game";
import { createSeedGameSave } from "./game-seed";
import { closureProgressForPair, riskZoneForMember } from "./member-feedback";

function memberWithRetention(retention: number): Member {
  const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
  const base = seed.members[0];
  return memberSchema.parse({
    ...base,
    state: {
      ...base.state,
      retention,
      status: "active" as const,
    },
  });
}

function buildPair(
  stats: Partial<{
    chemistry: number;
    trust: number;
    relationshipHealth: number;
    strain: number;
    conflict: number;
  }> = {},
  completedDateIds: string[] = [],
) {
  return pairStateSchema.parse({
    id: "pair-test",
    participantIds: ["a", "b"],
    stats: {
      chemistry: stats.chemistry ?? 40,
      trust: stats.trust ?? 40,
      stability: 50,
      conflict: stats.conflict ?? 20,
      weirdnessTolerance: 50,
      spark: 50,
      strain: stats.strain ?? 20,
      relationshipHealth: stats.relationshipHealth ?? 40,
    },
    completedDateIds,
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
  });
}

describe("riskZoneForMember", () => {
  it("treats high retention as steady", () => {
    expect(riskZoneForMember(memberWithRetention(95)).zone).toBe("steady");
    expect(riskZoneForMember(memberWithRetention(60)).zone).toBe("steady");
  });

  it("treats mid retention as cooling", () => {
    expect(riskZoneForMember(memberWithRetention(59)).zone).toBe("cooling");
    expect(riskZoneForMember(memberWithRetention(40)).zone).toBe("cooling");
    expect(riskZoneForMember(memberWithRetention(25)).zone).toBe("cooling");
  });

  it("treats low retention as at-risk and aligns with the manager warning threshold", () => {
    expect(riskZoneForMember(memberWithRetention(24)).zone).toBe("at-risk");
    expect(riskZoneForMember(memberWithRetention(10)).zone).toBe("at-risk");
    expect(riskZoneForMember(memberWithRetention(0)).zone).toBe("at-risk");
  });

  it("returns matching tone tokens for each zone", () => {
    expect(riskZoneForMember(memberWithRetention(80)).tone).toBe("emerald");
    expect(riskZoneForMember(memberWithRetention(40)).tone).toBe("amber");
    expect(riskZoneForMember(memberWithRetention(10)).tone).toBe("rose");
  });
});

describe("closureProgressForPair", () => {
  it("reports 100% with all axes met and enough dates", () => {
    const pair = buildPair(
      { chemistry: 80, trust: 80, relationshipHealth: 80, strain: 10, conflict: 10 },
      ["d1", "d2", "d3"],
    );
    const progress = closureProgressForPair(pair);
    expect(progress.overall).toBe(100);
    expect(progress.blockers).toEqual([]);
    expect(progress.axes.chemistry.met).toBe(true);
    expect(progress.axes.trust.met).toBe(true);
    expect(progress.axes.relationshipHealth.met).toBe(true);
  });

  it("is gated by the lowest axis ratio", () => {
    const pair = buildPair(
      { chemistry: 75, trust: 75, relationshipHealth: 30, strain: 10, conflict: 10 },
      ["d1", "d2", "d3"],
    );
    const progress = closureProgressForPair(pair);
    expect(progress.overall).toBe(40);
    expect(progress.blockers).toContain("health");
  });

  it("counts strain and conflict in the blockers list when they exceed the cap", () => {
    const pair = buildPair(
      { chemistry: 80, trust: 80, relationshipHealth: 80, strain: 50, conflict: 50 },
      ["d1", "d2", "d3"],
    );
    const progress = closureProgressForPair(pair);
    expect(progress.overall).toBeLessThan(100);
    expect(progress.blockers).toContain("strain");
    expect(progress.blockers).toContain("conflict");
  });

  it("treats not-enough-dates as a closure blocker", () => {
    const pair = buildPair(
      { chemistry: 80, trust: 80, relationshipHealth: 80, strain: 10, conflict: 10 },
      ["d1"],
    );
    const progress = closureProgressForPair(pair);
    expect(progress.blockers).toContain("dates");
    expect(progress.datesCompleted).toBe(1);
    expect(progress.datesNeeded).toBe(3);
  });
});
