import { describe, expect, it } from "vitest";

import {
  memberSchema,
  type GameSave,
  type Member,
  type ShiftAvailabilityProfile,
} from "../domain/game";
import { starterMembers } from "../fixtures";
import { selectInitialFocusCases } from "./focus-cases";
import { createSeedGameSave, getActiveShift } from "./game-seed";
import {
  availabilityProfileForMember,
  hydrateAvailablePartnerMemberIds,
  isMemberOnTonightBoard,
  selectShiftPartnerMemberIds,
  shiftPartnerUnavailableReason,
  SHIFT_PARTNER_SLATE_SIZE,
} from "./shift-availability";

const FOCUS_IDS = ["jenna-pike", "vhool", "sienna-bae", "kade-sumner"] as const;
const EXPECTED_PROFILE_IDS = {
  steady: [],
  busy_public: ["cassie-conners", "sienna-bae", "mira-park", "venus", "epsy", "kade-sumner"],
  career_locked: [
    "mei-sato",
    "noah-kim",
    "tasha-rell",
    "anubis",
    "sera-vohn",
    "meridian-vale",
    "calvin-hewes",
    "mr-whiskers",
  ],
  soft_schedule: [
    "aegis",
    "jenna-pike",
    "opal-sunday",
    "sana-karim",
    "marcus-pellish",
    "derek-halsey",
    "gabriel-tan",
    "maeve",
    "nawal-marrash",
    "toby-wenz",
    "fred-stavropoulos",
  ],
  formal_calendar: [
    "aldric-vale-marsh",
    "bai-wenshu",
    "decimus-marius-tullio",
    "eleanor-ash",
    "john-pork",
    "reaver",
    "vhool",
    "naia-velorae",
  ],
  weird_erratic: [],
} satisfies Record<ShiftAvailabilityProfile, readonly string[]>;

describe("shift partner availability", () => {
  it("selects a deterministic 8-member partner slate for the same shift", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const first = selectShiftPartnerMemberIds({
      members: save.members,
      focusedMemberIds: save.focusedMemberIds,
      shiftNumber: 1,
    });
    const second = selectShiftPartnerMemberIds({
      members: save.members,
      focusedMemberIds: save.focusedMemberIds,
      shiftNumber: 1,
    });

    expect(first).toEqual(second);
    expect(first).toHaveLength(SHIFT_PARTNER_SLATE_SIZE);
  });

  it("excludes focused, cooling, closed, and cancelled members from partner availability", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const members = save.members.map((member) => {
      if (member.id === "opal-sunday") {
        return withState(member, { lastDateShift: 1 });
      }
      if (member.id === "anansi") {
        return withState(member, { status: "closed" });
      }
      if (member.id === "venus") {
        return withState(member, { status: "quit" });
      }
      return member;
    });

    const slate = selectShiftPartnerMemberIds({
      members,
      focusedMemberIds: save.focusedMemberIds,
      shiftNumber: 2,
    });

    for (const focusId of FOCUS_IDS) {
      expect(slate).not.toContain(focusId);
    }
    expect(slate).not.toContain("opal-sunday");
    expect(slate).not.toContain("anansi");
    expect(slate).not.toContain("venus");
  });

  it("hydrates a missing or stale active-shift slate from current save facts", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const activeShift = getActiveShift(save);
    const persistedPartnerId = activeShift.availablePartnerMemberIds[0];
    if (persistedPartnerId === undefined) {
      throw new Error("Expected persisted partner.");
    }
    const hydrated = hydrateAvailablePartnerMemberIds({
      shift: {
        ...activeShift,
        availablePartnerMemberIds: [persistedPartnerId, FOCUS_IDS[0], "missing-member"],
      },
      members: save.members,
      focusedMemberIds: save.focusedMemberIds,
    });

    expect(hydrated).toHaveLength(SHIFT_PARTNER_SLATE_SIZE);
    expect(hydrated[0]).toBe(persistedPartnerId);
    expect(hydrated).not.toContain(FOCUS_IDS[0]);
    expect(hydrated).not.toContain("missing-member");
  });

  it("reports partner unavailability reasons in player-facing buckets", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const activeShift = getActiveShift(save);
    const focused = requireMember(save, FOCUS_IDS[0]);
    const cooling = withState(requireMember(save, "opal-sunday"), { lastDateShift: 1 });
    const closed = withState(requireMember(save, "anansi"), { status: "closed" });
    const quit = withState(requireMember(save, "venus"), { status: "quit" });
    const offShift = save.members.find(
      (member) =>
        member.state.status === "active" &&
        !save.focusedMemberIds.includes(member.id) &&
        !activeShift.availablePartnerMemberIds.includes(member.id),
    );

    if (offShift === undefined) {
      throw new Error("Expected at least one active member off tonight's roster.");
    }

    expect(reasonFor(save, activeShift.availablePartnerMemberIds, focused)).toBe("focus_case");
    expect(reasonFor(save, activeShift.availablePartnerMemberIds, cooling, 2)).toBe("cooldown");
    expect(reasonFor(save, activeShift.availablePartnerMemberIds, closed)).toBe("closed");
    expect(reasonFor(save, activeShift.availablePartnerMemberIds, quit)).toBe("quit");
    expect(reasonFor(save, activeShift.availablePartnerMemberIds, offShift)).toBe("off_shift");
  });

  it("treats focus cases and persisted partners as on tonight's board", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const activeShift = getActiveShift(save);
    const focusMember = requireMember(save, FOCUS_IDS[0]);
    const partnerMember = requireMember(save, activeShift.availablePartnerMemberIds[0] ?? "");
    const offShift = save.members.find(
      (member) =>
        member.state.status === "active" &&
        !save.focusedMemberIds.includes(member.id) &&
        !activeShift.availablePartnerMemberIds.includes(member.id),
    );

    if (offShift === undefined) {
      throw new Error("Expected an off-shift member.");
    }

    expect(
      isMemberOnTonightBoard({
        member: focusMember,
        shiftNumber: activeShift.shiftNumber,
        focusedMemberIds: save.focusedMemberIds,
        availablePartnerMemberIds: activeShift.availablePartnerMemberIds,
      }),
    ).toBe(true);
    expect(
      isMemberOnTonightBoard({
        member: partnerMember,
        shiftNumber: activeShift.shiftNumber,
        focusedMemberIds: save.focusedMemberIds,
        availablePartnerMemberIds: activeShift.availablePartnerMemberIds,
      }),
    ).toBe(true);
    expect(
      isMemberOnTonightBoard({
        member: offShift,
        shiftNumber: activeShift.shiftNumber,
        focusedMemberIds: save.focusedMemberIds,
        availablePartnerMemberIds: activeShift.availablePartnerMemberIds,
      }),
    ).toBe(false);
  });

  it("resolves an availability profile for every starter member", () => {
    const profiles = starterMembers.map((member) => availabilityProfileForMember(member));

    expect(profiles).toHaveLength(starterMembers.length);
    expect(profiles.every((profile) => profile.length > 0)).toBe(true);
  });

  it("honors the fixture-owned profile assignment for each starter", () => {
    const membersById = new Map(starterMembers.map((member) => [member.id, member] as const));
    const explicitlyProfiledIds = new Set<string>();

    for (const [profile, memberIds] of Object.entries(EXPECTED_PROFILE_IDS)) {
      if (profile === "steady" || profile === "weird_erratic") continue;
      for (const memberId of memberIds) {
        const member = membersById.get(memberId);
        if (member === undefined) {
          throw new Error(`Expected starter member ${memberId}.`);
        }
        explicitlyProfiledIds.add(memberId);
        expect(availabilityProfileForMember(member)).toBe(profile);
      }
    }

    for (const member of starterMembers) {
      if (member.state.status !== "active" || explicitlyProfiledIds.has(member.id)) continue;
      expect(availabilityProfileForMember(member)).toBe("weird_erratic");
    }
  });
});

function reasonFor(
  save: GameSave,
  availablePartnerMemberIds: readonly string[],
  member: Member,
  shiftNumber = 1,
) {
  return shiftPartnerUnavailableReason({
    member,
    shiftNumber,
    focusedMemberIds: save.focusedMemberIds,
    availablePartnerMemberIds,
  });
}

function requireMember(save: GameSave, memberId: string): Member {
  const member = save.members.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Missing member ${memberId}`);
  }
  return member;
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
