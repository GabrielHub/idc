import { describe, expect, it } from "vitest";

import type { Member, PlayerKnowledgeRecord } from "../domain/game";
import { starterMembers } from "../fixtures";
import {
  applyMemberRosterFilters,
  DEFAULT_MEMBER_ROSTER_FILTER_STATE,
  matchesAttentionFilter,
  matchesAvailabilityFilter,
  matchesClosureFilter,
  matchesFocusFilter,
  matchesSearch,
  matchesStatusFilter,
} from "./member-roster-filter";

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

  it("keeps internal member fields out of search even in dev preview", () => {
    const member = requireMember("jenna-pike");

    expect(matchesSearch(member, "East Rainfield", { revealAllMemberDetails: true })).toBe(false);
    expect(
      matchesSearch(member, "Ordinary, pending review", { revealAllMemberDetails: true }),
    ).toBe(false);
  });
});

describe("member roster focus filter", () => {
  const member = requireMember("alex-yoon");

  it("passes every member when set to all", () => {
    expect(matchesFocusFilter(member, "all", undefined)).toBe(true);
    expect(matchesFocusFilter(member, "all", [])).toBe(true);
  });

  it("keeps focused members only when set to focused", () => {
    expect(matchesFocusFilter(member, "focused", [member.id])).toBe(true);
    expect(matchesFocusFilter(member, "focused", [])).toBe(false);
    expect(matchesFocusFilter(member, "focused", undefined)).toBe(false);
  });

  it("keeps non-focused members only when set to not-focused", () => {
    expect(matchesFocusFilter(member, "not-focused", [member.id])).toBe(false);
    expect(matchesFocusFilter(member, "not-focused", [])).toBe(true);
    expect(matchesFocusFilter(member, "not-focused", undefined)).toBe(true);
  });
});

describe("member roster availability filter", () => {
  const baseMember = requireMember("alex-yoon");

  it("passes every member when set to all", () => {
    expect(matchesAvailabilityFilter(baseMember, "all", undefined)).toBe(true);
    expect(matchesAvailabilityFilter(baseMember, "all", 3)).toBe(true);
  });

  it("treats members on cooldown when last date is this or previous shift", () => {
    const cooldownMember = withState(baseMember, { status: "active", lastDateShift: 3 });

    expect(matchesAvailabilityFilter(cooldownMember, "cooldown", 3)).toBe(true);
    expect(matchesAvailabilityFilter(cooldownMember, "cooldown", 4)).toBe(true);
    expect(matchesAvailabilityFilter(cooldownMember, "cooldown", 5)).toBe(false);
  });

  it("treats members as bookable when they are active and not on cooldown", () => {
    const freshMember = withState(baseMember, { status: "active", lastDateShift: undefined });
    const recentMember = withState(baseMember, { status: "active", lastDateShift: 3 });

    expect(matchesAvailabilityFilter(freshMember, "bookable", 3)).toBe(true);
    expect(matchesAvailabilityFilter(recentMember, "bookable", 3)).toBe(false);
    expect(matchesAvailabilityFilter(recentMember, "bookable", 5)).toBe(true);
  });

  it("excludes closed and cancelled members from bookable and cooldown", () => {
    const closed = withState(baseMember, { status: "closed" });
    const quit = withState(baseMember, { status: "quit" });

    expect(matchesAvailabilityFilter(closed, "bookable", 3)).toBe(false);
    expect(matchesAvailabilityFilter(closed, "cooldown", 3)).toBe(false);
    expect(matchesAvailabilityFilter(quit, "bookable", 3)).toBe(false);
    expect(matchesAvailabilityFilter(quit, "cooldown", 3)).toBe(false);
  });

  it("rejects non-all filters when no active shift number is provided", () => {
    expect(matchesAvailabilityFilter(baseMember, "bookable", undefined)).toBe(false);
    expect(matchesAvailabilityFilter(baseMember, "cooldown", undefined)).toBe(false);
  });
});

describe("member roster attention filter", () => {
  const baseMember = requireMember("alex-yoon");

  it("passes every member when set to all", () => {
    expect(matchesAttentionFilter(baseMember, "all")).toBe(true);
  });

  it("flags confidence-low when retention is between low and stable floors", () => {
    const lowRetention = withState(baseMember, { status: "active", retention: 40 });
    const stable = withState(baseMember, { status: "active", retention: 80 });

    expect(matchesAttentionFilter(lowRetention, "confidence-low")).toBe(true);
    expect(matchesAttentionFilter(stable, "confidence-low")).toBe(false);
  });

  it("flags closed-file-risk when retention sits under the low floor", () => {
    const atRisk = withState(baseMember, { status: "active", retention: 15 });
    const lowConfidence = withState(baseMember, { status: "active", retention: 40 });

    expect(matchesAttentionFilter(atRisk, "closed-file-risk")).toBe(true);
    expect(matchesAttentionFilter(lowConfidence, "closed-file-risk")).toBe(false);
  });

  it("ignores non-active members", () => {
    const closedLow = withState(baseMember, { status: "closed", retention: 40 });
    expect(matchesAttentionFilter(closedLow, "confidence-low")).toBe(false);
    expect(matchesAttentionFilter(closedLow, "closed-file-risk")).toBe(false);
  });
});

describe("member roster closure filter", () => {
  const member = requireMember("alex-yoon");

  it("passes every member when set to all", () => {
    expect(matchesClosureFilter(member, "all", undefined)).toBe(true);
  });

  it("keeps only members in the ready closure set", () => {
    const readyIds = new Set([member.id]);
    expect(matchesClosureFilter(member, "ready", readyIds)).toBe(true);
    expect(matchesClosureFilter(member, "ready", new Set())).toBe(false);
    expect(matchesClosureFilter(member, "ready", undefined)).toBe(false);
  });
});

describe("member roster status filter", () => {
  const member = requireMember("alex-yoon");

  it("keeps the active status filter behavior intact", () => {
    expect(matchesStatusFilter(member, "all")).toBe(true);
    expect(matchesStatusFilter(member, "active")).toBe(true);
    expect(matchesStatusFilter(withState(member, { status: "closed" }), "active")).toBe(false);
    expect(matchesStatusFilter(withState(member, { status: "closed" }), "closed")).toBe(true);
    expect(matchesStatusFilter(withState(member, { status: "quit" }), "quit")).toBe(true);
  });
});

describe("applyMemberRosterFilters", () => {
  const base = requireMember("alex-yoon");
  const second = requireMember("vhool");

  it("combines focus, availability, attention, closure, and status with context", () => {
    const focused = withState(base, { status: "active", retention: 40, lastDateShift: 1 });
    const offFocus = withState(second, {
      status: "active",
      retention: 80,
      lastDateShift: undefined,
    });

    const result = applyMemberRosterFilters(
      [focused, offFocus],
      {
        ...DEFAULT_MEMBER_ROSTER_FILTER_STATE,
        focus: "focused",
      },
      {
        focusedMemberIds: [focused.id],
      },
    );

    expect(result.map((member) => member.id)).toEqual([focused.id]);
  });

  it("only returns bookable active members when filtering by bookable availability", () => {
    const ready = withState(base, { status: "active", lastDateShift: undefined });
    const cooling = withState(second, { status: "active", lastDateShift: 4 });

    const result = applyMemberRosterFilters(
      [ready, cooling],
      {
        ...DEFAULT_MEMBER_ROSTER_FILTER_STATE,
        availability: "bookable",
      },
      {
        activeShiftNumber: 5,
      },
    );

    expect(result.map((member) => member.id)).toEqual([ready.id]);
  });

  it("only returns members in the ready closure set when filtering closure ready", () => {
    const readyMember = withState(base, { status: "active" });
    const other = withState(second, { status: "active" });

    const result = applyMemberRosterFilters(
      [readyMember, other],
      {
        ...DEFAULT_MEMBER_ROSTER_FILTER_STATE,
        closure: "ready",
      },
      {
        readyClosureMemberIds: new Set([readyMember.id]),
      },
    );

    expect(result.map((member) => member.id)).toEqual([readyMember.id]);
  });
});

function requireMember(memberId: string): Member {
  const member = starterMembers.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Missing test member ${memberId}.`);
  }
  return member;
}

function withState(member: Member, patch: Partial<Member["state"]>): Member {
  return {
    ...member,
    state: {
      ...member.state,
      ...patch,
    },
  };
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
