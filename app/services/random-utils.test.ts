import { describe, expect, it } from "vitest";

import {
  buildRandomSeed,
  createNamespacedRandom,
  createSeededRandom,
  randomIndex,
  selectFreshItems,
  shuffledBySeed,
} from "./utils";

describe("random utilities", () => {
  it("replays the same sequence for the same seed", () => {
    const first = createSeededRandom("shift-7:coffee");
    const second = createSeededRandom("shift-7:coffee");

    expect([first(), first(), first(), first()]).toEqual([second(), second(), second(), second()]);
  });

  it("separates namespaces and seed part boundaries", () => {
    const firstSeed = buildRandomSeed("scenario-event-draft", ["a:b", "c"]);
    const secondSeed = buildRandomSeed("scenario-event-draft", ["a", "b:c"]);
    const first = createSeededRandom(firstSeed);
    const second = createSeededRandom(secondSeed);
    const otherNamespace = createNamespacedRandom("manager-quip", ["a:b", "c"]);

    expect(firstSeed).not.toBe(secondSeed);
    expect(first()).not.toBe(second());
    expect(createSeededRandom(firstSeed)()).not.toBe(otherNamespace());
  });

  it("clamps index selection to collection bounds", () => {
    expect(randomIndex(4, () => 1)).toBe(3);
    expect(randomIndex(4, () => Number.POSITIVE_INFINITY)).toBe(0);
    expect(() => randomIndex(0, () => 0)).toThrow(/empty collection/);
  });

  it("shuffles reproducibly without mutating the caller collection", () => {
    const original = ["a", "b", "c", "d", "e"];
    const seed = buildRandomSeed("test-shuffle", [42]);
    const first = shuffledBySeed(original, seed);
    const second = shuffledBySeed(original, seed);

    expect(first).toEqual(second);
    expect(original).toEqual(["a", "b", "c", "d", "e"]);
    expect(new Set(first)).toEqual(new Set(original));
  });

  it("penalizes stale candidates while preserving deterministic tie breaking", () => {
    const candidates = ["fresh-a", "stale", "fresh-b"].map((id) => ({ id, item: id }));
    const first = selectFreshItems({
      candidates,
      count: 2,
      random: createSeededRandom("freshness-test"),
      freshnessPenalties: [{ id: "stale", penalty: 10 }],
    });
    const second = selectFreshItems({
      candidates,
      count: 2,
      random: createSeededRandom("freshness-test"),
      freshnessPenalties: [{ id: "stale", penalty: 10 }],
    });

    expect(first).toEqual(second);
    expect(first).toEqual(["fresh-a", "fresh-b"]);
  });
});
