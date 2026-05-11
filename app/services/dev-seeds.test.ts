import { describe, expect, it } from "vitest";

import { seedClosedAndQuitMembers } from "./dev-seeds";
import { createSeedGameSave } from "./game-seed";
import { PAIR_CLOSURE_TAG } from "./closures";

describe("dev seeds", () => {
  it("seeds two closed members and one quit member", () => {
    const save = createSeedGameSave(new Date("2026-05-11T12:00:00.000Z"));
    const seeded = seedClosedAndQuitMembers(save, {
      now: new Date("2026-05-11T12:30:00.000Z"),
    });

    const closed = seeded.members.filter((member) => member.state.status === "closed");
    const quit = seeded.members.filter((member) => member.state.status === "quit");
    expect(closed).toHaveLength(2);
    expect(quit).toHaveLength(1);
    expect(seeded.closureCount).toBe(save.closureCount + 1);
  });

  it("attaches a pair closure memory and clears focus slots for the seeded members", () => {
    const save = createSeedGameSave(new Date("2026-05-11T12:00:00.000Z"));
    const focused = save.members.slice(0, 4).map((member) => member.id);
    const baseSave = {
      ...save,
      focusedMemberIds: focused,
    };
    const seeded = seedClosedAndQuitMembers(baseSave);

    const closureMemory = seeded.memories.find((memory) => memory.tags.includes(PAIR_CLOSURE_TAG));
    expect(closureMemory).toBeDefined();
    expect(closureMemory?.tags).toContain("dev_seed");

    for (const member of seeded.members) {
      if (member.state.status !== "active") {
        expect(seeded.focusedMemberIds).not.toContain(member.id);
      }
    }
  });

  it("respects explicit member ids when provided", () => {
    const save = createSeedGameSave(new Date("2026-05-11T12:00:00.000Z"));
    const [first, second, third] = save.members;
    if (first === undefined || second === undefined || third === undefined) {
      throw new Error("Expected seed roster to expose three members.");
    }
    const seeded = seedClosedAndQuitMembers(save, {
      closedMemberId: first.id,
      closedPartnerId: second.id,
      quitMemberId: third.id,
    });

    expect(seeded.members.find((m) => m.id === first.id)?.state.status).toBe("closed");
    expect(seeded.members.find((m) => m.id === second.id)?.state.status).toBe("closed");
    expect(seeded.members.find((m) => m.id === third.id)?.state.status).toBe("quit");
    expect(seeded.members.find((m) => m.id === third.id)?.state.retention).toBe(0);
  });
});
