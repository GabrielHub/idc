import { describe, expect, it } from "vitest";

import type { Member, PlayerKnowledgeRecord } from "../domain/game";
import { starterMembers } from "../fixtures";
import { matchesSearch } from "./member-roster-filter";

describe("member roster search", () => {
  it("matches member names and visible dating profile text", () => {
    const member = requireMember("alex-yoon");

    expect(matchesSearch(member, "Alex Yoon")).toBe(true);
    expect(matchesSearch(member, "social strat")).toBe(true);
  });

  it("keeps gated dating profile text out of search until it is visible", () => {
    const member = requireMember("alex-yoon");

    expect(matchesSearch(member, "lakers")).toBe(false);
    expect(matchesSearch(member, "lakers", { playerKnowledge: [profileReadFor(member)] })).toBe(
      true,
    );
    expect(matchesSearch(member, "lakers", { revealAllMemberDetails: true })).toBe(true);
  });
});

function requireMember(memberId: string): Member {
  const member = starterMembers.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Missing test member ${memberId}.`);
  }
  return member;
}

function profileReadFor(member: Member): PlayerKnowledgeRecord {
  return {
    id: `test-profile-read:${member.id}`,
    subjectKind: "member",
    subjectId: member.id,
    readKind: "profile",
    readId: `member:${member.id}:profile:test`,
    readText: `${member.firstName}'s full profile is filed.`,
    confidence: "filed",
    source: "judge",
    revealedAt: "2026-05-13T12:00:00.000Z",
  };
}
