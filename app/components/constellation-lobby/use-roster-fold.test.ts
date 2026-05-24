import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { gameSaveSchema, memberSchema, type Member } from "../../domain/game";
import { DEFAULT_MEMBER_ROSTER_FILTER_STATE } from "../../services/member-roster-filter";
import { createSeedGameSave, getActiveShift } from "../../services/game-seed";
import { useRosterFold } from "./use-roster-fold";

describe("useRosterFold", () => {
  it("limits eligible partners to active, non-focused, non-cooling members on the shift slate", () => {
    const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const shift = {
      ...getActiveShift(seed),
      shiftNumber: 3,
      availablePartnerMemberIds: ["alex-yoon", "opal-sunday", "vhool", "anansi", "venus"],
    };
    const save = gameSaveSchema.parse({
      ...seed,
      focusedMemberIds: ["vhool"],
      members: seed.members.map((member) => {
        if (member.id === "alex-yoon") return withState(member, { status: "active" });
        if (member.id === "sienna-bae") {
          return withState(member, { status: "active", lastDateShift: undefined });
        }
        if (member.id === "opal-sunday") {
          return withState(member, { status: "active", lastDateShift: 2 });
        }
        if (member.id === "vhool") return withState(member, { status: "active" });
        if (member.id === "anansi") return withState(member, { status: "closed" });
        if (member.id === "venus") return withState(member, { status: "quit" });
        return member;
      }),
      shifts: seed.shifts.map((candidate) => (candidate.id === shift.id ? shift : candidate)),
    });

    const fold = renderRosterFold({ save, shift: getActiveShift(save) });

    expect([...fold.eligiblePartnerIds]).toEqual(["alex-yoon"]);
    expect(fold.eligiblePartnerIds.has("sienna-bae")).toBe(false);
    expect(fold.eligiblePartnerIds.has("opal-sunday")).toBe(false);
    expect(fold.eligiblePartnerIds.has("vhool")).toBe(false);
    expect(fold.eligiblePartnerIds.has("anansi")).toBe(false);
    expect(fold.eligiblePartnerIds.has("venus")).toBe(false);
  });
});

function renderRosterFold(
  overrides: Pick<Parameters<typeof useRosterFold>[0], "save" | "shift">,
): ReturnType<typeof useRosterFold> {
  let fold: ReturnType<typeof useRosterFold> | undefined;

  function Probe() {
    fold = useRosterFold({
      ...overrides,
      filterState: DEFAULT_MEMBER_ROSTER_FILTER_STATE,
      revealAllMemberDetails: false,
      readyClosureMemberIds: undefined,
    });
    return null;
  }

  renderToString(createElement(Probe));

  if (fold === undefined) {
    throw new Error("Expected roster fold to render.");
  }

  return fold;
}

function withState(member: Member, state: Partial<Member["state"]>): Member {
  return memberSchema.parse({
    ...member,
    state: {
      ...member.state,
      ...state,
    },
  });
}
