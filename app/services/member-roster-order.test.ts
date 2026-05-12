import { describe, expect, it } from "vitest";

import type { Member } from "../domain/game";
import { starterMembers } from "../fixtures";
import {
  CURATED_MEMBER_ROSTER_ORDER,
  moveSuggestedMemberFirst,
  sortMembersByCuratedRosterOrder,
  sortMembersForRoster,
} from "./member-roster-order";

describe("member roster order", () => {
  it("accounts for every starter member exactly once", () => {
    const starterIds = starterMembers.map((member) => member.id).sort();
    const curatedIds = [...CURATED_MEMBER_ROSTER_ORDER].sort();

    expect(new Set(CURATED_MEMBER_ROSTER_ORDER).size).toBe(CURATED_MEMBER_ROSTER_ORDER.length);
    expect(curatedIds).toEqual(starterIds);
  });

  it("puts a varied first screen on onboarding", () => {
    const orderedIds = sortMembersByCuratedRosterOrder(starterMembers).map((member) => member.id);

    expect(orderedIds.slice(0, 7)).toEqual([
      "jenna-pike",
      "vhool",
      "kade-sumner",
      "mr-whiskers",
      "opal-sunday",
      "venus",
      "gideon-glass",
    ]);
  });

  it("groups the full roster by operational state before curated order", () => {
    const sampleMembers: Member[] = [
      withStatus(requireMember("vhool"), "quit"),
      withStatus(requireMember("meridian-vale"), "active"),
      withStatus(requireMember("mr-whiskers"), "closed"),
      withStatus(requireMember("jenna-pike"), "active"),
      withStatus(requireMember("kade-sumner"), "active"),
    ];

    const orderedIds = sortMembersForRoster(sampleMembers, ["kade-sumner"]).map(
      (member) => member.id,
    );

    expect(orderedIds).toEqual([
      "kade-sumner",
      "jenna-pike",
      "meridian-vale",
      "mr-whiskers",
      "vhool",
    ]);
  });

  it("moves the suggested partner first without losing curated order", () => {
    const sampleMembers = [
      requireMember("kade-sumner"),
      requireMember("vhool"),
      requireMember("jenna-pike"),
    ];

    const orderedIds = moveSuggestedMemberFirst(sampleMembers, "vhool").map((member) => member.id);

    expect(orderedIds).toEqual(["vhool", "jenna-pike", "kade-sumner"]);
  });
});

function requireMember(memberId: string): Member {
  const member = starterMembers.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Missing test member ${memberId}.`);
  }
  return member;
}

function withStatus(member: Member, status: Member["state"]["status"]): Member {
  return {
    ...member,
    state: {
      ...member.state,
      status,
    },
  };
}
