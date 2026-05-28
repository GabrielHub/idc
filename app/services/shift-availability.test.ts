import { describe, expect, it } from "vitest";

import {
  dateSessionSchema,
  memberSchema,
  pairStateSchema,
  type GameSave,
  type Member,
  type PairState,
  type ShiftAvailabilityProfile,
} from "../domain/game";
import { starterMembers } from "../fixtures";
import { selectInitialFocusCases } from "./focus-cases";
import { createSeedGameSave, getActiveShift } from "./game-seed";
import {
  availabilityProfileForMember,
  hydrateAvailablePartnerMemberIds,
  isMemberOnTonightBoard,
  selectShiftFollowUpReservations,
  selectShiftPartnerMemberIds,
  shiftPartnerUnavailableReason,
  SHIFT_PARTNER_SLATE_SIZE,
} from "./shift-availability";
import { swapShiftPartner } from "./shift-partner-actions";

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
    "marlee-hines",
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
    "ruby",
    "toby-wenz",
    "fred-stavropoulos",
    "daiven-patel",
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
    "toastimus-crouton-vance",
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

  it("reserves priority partners ahead of the logistics slate", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const baseline = selectShiftPartnerMemberIds({
      members: save.members,
      focusedMemberIds: save.focusedMemberIds,
      shiftNumber: 1,
    });
    const priorityPartner = save.members.find(
      (member) =>
        member.state.status === "active" &&
        !save.focusedMemberIds.includes(member.id) &&
        !baseline.includes(member.id),
    );

    if (priorityPartner === undefined) {
      throw new Error("Expected an off-slate active partner.");
    }

    const slate = selectShiftPartnerMemberIds({
      members: save.members,
      focusedMemberIds: save.focusedMemberIds,
      shiftNumber: 1,
      priorityPartnerMemberIds: [priorityPartner.id],
    });

    expect(slate).toHaveLength(SHIFT_PARTNER_SLATE_SIZE);
    expect(slate[0]).toBe(priorityPartner.id);
  });

  it("keeps priority partners when repairing a full persisted slate", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const baseline = selectShiftPartnerMemberIds({
      members: save.members,
      focusedMemberIds: save.focusedMemberIds,
      shiftNumber: 1,
    });
    const priorityPartner = save.members.find(
      (member) =>
        member.state.status === "active" &&
        !save.focusedMemberIds.includes(member.id) &&
        !baseline.includes(member.id),
    );

    if (priorityPartner === undefined) {
      throw new Error("Expected an off-slate active partner.");
    }

    const hydrated = hydrateAvailablePartnerMemberIds({
      shift: {
        ...getActiveShift(save),
        availablePartnerMemberIds: baseline,
      },
      members: save.members,
      focusedMemberIds: save.focusedMemberIds,
      priorityPartnerMemberIds: [priorityPartner.id],
    });

    expect(hydrated).toHaveLength(SHIFT_PARTNER_SLATE_SIZE);
    expect(hydrated[0]).toBe(priorityPartner.id);
    expect(hydrated).toContain(priorityPartner.id);
  });

  it("selects each focus case's latest pursue partner within the ripeness window even while cooling", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), [
      "noah-kim",
      "vhool",
      "sienna-bae",
      "kade-sumner",
    ]);
    const members = save.members.map((member) =>
      member.id === "noah-kim" || member.id === "jenna-pike"
        ? withState(member, { lastDateShift: 1 })
        : member,
    );
    const session = dateSession({
      participants: ["noah-kim", "jenna-pike"],
      appliedFollowUp: "pursue",
    });

    expect(
      selectShiftFollowUpReservations({
        members,
        focusedMemberIds: save.focusedMemberIds,
        dateSessions: [session],
        shiftNumber: 2,
      }).map((reservation) => reservation.partnerMemberId),
    ).toEqual(["jenna-pike"]);
    expect(
      selectShiftFollowUpReservations({
        members,
        focusedMemberIds: save.focusedMemberIds,
        dateSessions: [session],
        shiftNumber: 3,
      }).map((reservation) => reservation.partnerMemberId),
    ).toEqual(["jenna-pike"]);
  });

  it("does not reserve pairs whose follow-up closed the romantic lane", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), [
      "noah-kim",
      "vhool",
      "sienna-bae",
      "kade-sumner",
    ]);
    const session = dateSession({
      participants: ["noah-kim", "jenna-pike"],
      appliedFollowUp: "close",
    });

    expect(
      selectShiftFollowUpReservations({
        members: save.members,
        focusedMemberIds: save.focusedMemberIds,
        dateSessions: [session],
        shiftNumber: 3,
      }),
    ).toEqual([]);
  });

  it("does not surface a partner whose lane is closed with an active focus case", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), [
      "noah-kim",
      "vhool",
      "sienna-bae",
      "kade-sumner",
    ]);
    const closedPair = pairState({
      participantIds: ["noah-kim", "jenna-pike"],
      laneStatus: "closed",
    });

    const slate = selectShiftPartnerMemberIds({
      members: save.members,
      focusedMemberIds: save.focusedMemberIds,
      shiftNumber: 3,
      pairStates: [closedPair],
      priorityPartnerMemberIds: ["jenna-pike"],
    });

    expect(slate).not.toContain("jenna-pike");
    expect(
      shiftPartnerUnavailableReason({
        member: requireMember(save, "jenna-pike"),
        shiftNumber: 3,
        focusedMemberIds: save.focusedMemberIds,
        availablePartnerMemberIds: slate,
        pairStates: [closedPair],
      }),
    ).toBe("closed_lane");
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

  it("swaps one tonight partner with an off-shift active member and records the shift audit", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const activeShift = getActiveShift(save);
    const outgoingPartnerMemberId = activeShift.availablePartnerMemberIds[0];
    const incoming = findOffShiftMember(save);

    if (outgoingPartnerMemberId === undefined) {
      throw new Error("Expected a partner to swap out.");
    }

    const swapped = swapShiftPartner(save, {
      outgoingPartnerMemberId,
      incomingPartnerMemberId: incoming.id,
      swappedAt: "2026-05-05T12:30:00.000Z",
    });
    const swappedShift = getActiveShift(swapped);

    expect(swappedShift.availablePartnerMemberIds).toContain(incoming.id);
    expect(swappedShift.availablePartnerMemberIds).not.toContain(outgoingPartnerMemberId);
    expect(swappedShift.availablePartnerMemberIds).toHaveLength(
      activeShift.availablePartnerMemberIds.length,
    );
    expect(swappedShift.partnerSwap).toEqual({
      outgoingPartnerMemberId,
      incomingPartnerMemberId: incoming.id,
      swappedAt: "2026-05-05T12:30:00.000Z",
    });
  });

  it("allows only one partner roster swap per active shift", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const activeShift = getActiveShift(save);
    const firstOutgoing = activeShift.availablePartnerMemberIds[0];
    const firstIncoming = findOffShiftMember(save);

    if (firstOutgoing === undefined) {
      throw new Error("Expected a partner to swap out.");
    }

    const swapped = swapShiftPartner(save, {
      outgoingPartnerMemberId: firstOutgoing,
      incomingPartnerMemberId: firstIncoming.id,
      swappedAt: "2026-05-05T12:30:00.000Z",
    });
    const swappedShift = getActiveShift(swapped);
    const secondOutgoing = swappedShift.availablePartnerMemberIds[1];
    const secondIncoming = findOffShiftMember(swapped);

    if (secondOutgoing === undefined) {
      throw new Error("Expected a second partner to swap out.");
    }

    expect(() =>
      swapShiftPartner(swapped, {
        outgoingPartnerMemberId: secondOutgoing,
        incomingPartnerMemberId: secondIncoming.id,
      }),
    ).toThrow("one partner roster swap per shift");
  });

  it("rejects partner swaps into cooldown, focus, closed, quit, or closed-lane members", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), FOCUS_IDS);
    const activeShift = getActiveShift(save);
    const outgoingPartnerMemberId = activeShift.availablePartnerMemberIds[0];

    if (outgoingPartnerMemberId === undefined) {
      throw new Error("Expected a partner to swap out.");
    }

    const offShift = findOffShiftMember(save);
    const closedLaneTarget = findOffShiftMember(save);
    const closedLaneSave = {
      ...save,
      pairStates: [
        ...save.pairStates,
        pairState({ participantIds: [FOCUS_IDS[0], closedLaneTarget.id], laneStatus: "closed" }),
      ],
    };

    const invalidCases: Array<{ source: GameSave; incomingPartnerMemberId: string }> = [
      { source: save, incomingPartnerMemberId: FOCUS_IDS[0] },
      {
        source: withPatchedMember(save, offShift.id, { lastDateShift: activeShift.shiftNumber }),
        incomingPartnerMemberId: offShift.id,
      },
      {
        source: withPatchedMember(save, offShift.id, { status: "closed" }),
        incomingPartnerMemberId: offShift.id,
      },
      {
        source: withPatchedMember(save, offShift.id, { status: "quit" }),
        incomingPartnerMemberId: offShift.id,
      },
      { source: closedLaneSave, incomingPartnerMemberId: closedLaneTarget.id },
    ];

    for (const { source, incomingPartnerMemberId } of invalidCases) {
      expect(() =>
        swapShiftPartner(source, {
          outgoingPartnerMemberId,
          incomingPartnerMemberId,
        }),
      ).toThrow("Only off-shift active members");
    }
  });

  it("keeps follow-up reservation partners pinned out of partner swaps", () => {
    const save = selectInitialFocusCases(createSeedGameSave(), [
      "noah-kim",
      "vhool",
      "sienna-bae",
      "kade-sumner",
    ]);
    const activeShift = getActiveShift(save);
    const reservedPartner = findOffShiftMember(save);
    const pinnedShift = {
      ...activeShift,
      availablePartnerMemberIds: [
        reservedPartner.id,
        ...activeShift.availablePartnerMemberIds.filter((id) => id !== reservedPartner.id),
      ],
      followUpReservations: [
        {
          focusMemberId: "noah-kim",
          partnerMemberId: reservedPartner.id,
          sourceDateSessionId: "date-follow-up",
        },
      ],
    };
    const pinnedSave = {
      ...save,
      shifts: save.shifts.map((shift) => (shift.id === pinnedShift.id ? pinnedShift : shift)),
    };
    const incoming = findOffShiftMember(pinnedSave);

    expect(() =>
      swapShiftPartner(pinnedSave, {
        outgoingPartnerMemberId: reservedPartner.id,
        incomingPartnerMemberId: incoming.id,
      }),
    ).toThrow("Follow-up reservations are pinned");
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

function findOffShiftMember(save: GameSave): Member {
  const activeShift = getActiveShift(save);
  const member = save.members.find(
    (candidate) =>
      shiftPartnerUnavailableReason({
        member: candidate,
        shiftNumber: activeShift.shiftNumber,
        focusedMemberIds: save.focusedMemberIds,
        availablePartnerMemberIds: activeShift.availablePartnerMemberIds,
        pairStates: save.pairStates,
      }) === "off_shift",
  );

  if (member === undefined) {
    throw new Error("Expected an off-shift member.");
  }

  return member;
}

function withPatchedMember(
  save: GameSave,
  memberId: string,
  state: Partial<Member["state"]>,
): GameSave {
  return {
    ...save,
    members: save.members.map((member) =>
      member.id === memberId ? withState(member, state) : member,
    ),
  };
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

function dateSession({
  participants,
  appliedFollowUp,
}: {
  participants: [string, string];
  appliedFollowUp: "pursue" | "close";
}) {
  return dateSessionSchema.parse({
    id: `date-1-1-pair-${participants[0]}-${participants[1]}-temporal-coffee-shop`,
    pairId: `pair-${participants[0]}-${participants[1]}`,
    scenarioId: "temporal-coffee-shop",
    turnLimit: 12,
    currentTurn: 12,
    dateHealth: 70,
    status: "completed" as const,
    runtimeMode: "local_ai" as const,
    participants,
    transcript: [],
    privateStateByCharacter: {},
    judgeSnapshots: [],
    eventDraft: { offered: [], picked: [] },
    eventsTriggered: [],
    playbackState: "ended" as const,
    endSentiment: null,
    interventions: [],
    finalReport: {
      id: `final-${participants[0]}-${participants[1]}`,
      dateSessionId: `date-1-1-pair-${participants[0]}-${participants[1]}-temporal-coffee-shop`,
      completedAt: "2026-05-05T12:30:00.000Z",
      outcome: "second_date" as const,
      summary: "Cupid filed a follow-up booking test.",
      statSummary: "Case read: follow-up booking test.",
      recommendedFollowUp: "pursue" as const,
      appliedFollowUp,
      memoryRecordIds: [],
      readyToClose: false,
    },
  });
}

function pairState({
  participantIds,
  laneStatus = "open",
}: {
  participantIds: [string, string];
  laneStatus?: PairState["laneStatus"];
}): PairState {
  return pairStateSchema.parse({
    id: `pair-${participantIds[0]}-${participantIds[1]}`,
    participantIds,
    laneStatus,
    stats: {
      chemistry: 50,
      trust: 50,
      stability: 50,
      conflict: 50,
      weirdnessTolerance: 50,
      spark: 50,
      strain: 50,
      relationshipHealth: 50,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
  });
}
