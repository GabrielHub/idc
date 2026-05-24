import { createElement, type ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { gameSaveSchema, memberSchema, type GameSave, type Member } from "../../domain/game";
import { createSeedGameSave, getActiveShift } from "../../services/game-seed";
import type { TutorialStepHandle } from "../../services/tutorial";
import { resolvePortraitPalette } from "../portrait-palette";
import type { StarMark } from "./types";
import { useHoverCardRenderer } from "./use-hover-card-renderer";

// Regression for the playtest bug where a focused member in cooldown was still
// selectable as lead from the hover card; the engine then threw "One of the
// members is still in cooldown from a recent date." only at Begin date. The
// card must surface the gate up-front: cooling badge + view-case CTA, never
// make-lead.
describe("useHoverCardRenderer cooldown gating", () => {
  it("blocks make-lead and shows the cooling badge when the focused member is in cooldown", () => {
    const { save, shift } = buildSaveWithCoolingFocus();
    const jenna = save.members.find((member) => member.id === "jenna-pike");
    expect(jenna).toBeDefined();

    const html = renderHoverCardFor({ save, shift, member: jenna! });

    expect(html).toContain("in cooldown");
    expect(html).toContain("In cooldown until next shift");
    expect(html).toContain("View case");
    expect(html).not.toContain("Make lead");
  });

  it("offers Make lead when the focused member is no longer cooling", () => {
    const { save, shift } = buildSaveWithFocusedJenna({ cooling: false });
    const jenna = save.members.find((member) => member.id === "jenna-pike");
    expect(jenna).toBeDefined();

    const html = renderHoverCardFor({ save, shift, member: jenna! });

    expect(html).toContain("Make lead");
    expect(html).not.toContain("in cooldown");
    expect(html).not.toContain("In cooldown until next shift");
  });
});

function buildSaveWithCoolingFocus(): {
  save: GameSave;
  shift: ReturnType<typeof getActiveShift>;
} {
  return buildSaveWithFocusedJenna({ cooling: true });
}

function buildSaveWithFocusedJenna({ cooling }: { cooling: boolean }): {
  save: GameSave;
  shift: ReturnType<typeof getActiveShift>;
} {
  const seed = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
  // Bump the active shift so isMemberInCooldown(lastDateShift=1, shift=2) is
  // true; the gate is `lastDateShift >= shiftNumber - 1`. The non-cooling
  // path drops lastDateShift entirely so the cooldown predicate short-circuits
  // on the `undefined` branch.
  const shift = { ...getActiveShift(seed), shiftNumber: 2 };
  const save = gameSaveSchema.parse({
    ...seed,
    focusedMemberIds: ["jenna-pike", "vhool", "sienna-bae", "kade-sumner"],
    members: seed.members.map((member) => {
      if (member.id !== "jenna-pike") return member;
      const baseState = { ...member.state, status: "active" as const };
      if (cooling) {
        return memberSchema.parse({
          ...member,
          state: { ...baseState, lastDateShift: 1 },
        });
      }
      // Drop lastDateShift completely so isMemberInCooldown returns false.
      const { lastDateShift: _drop, ...stateWithoutLastDate } = baseState;
      return memberSchema.parse({
        ...member,
        state: stateWithoutLastDate,
      });
    }),
    shifts: seed.shifts.map((candidate) => (candidate.id === shift.id ? shift : candidate)),
  });
  return { save, shift: getActiveShift(save) };
}

function renderHoverCardFor({
  save,
  shift,
  member,
}: {
  save: GameSave;
  shift: ReturnType<typeof getActiveShift>;
  member: Member;
}): string {
  let rendered: ReactElement | null = null;

  function Probe() {
    const render = useHoverCardRenderer({
      save,
      focusedSet: new Set(save.focusedMemberIds),
      revealAllMemberDetails: false,
      // No focus committed yet — the four focus stars are pickable. This is
      // the state where the playtest bug fired: Jenna sits in the focus
      // picker on layer 1, and the player can click her star to make her
      // lead even though she's cooling from last shift's date.
      focusId: null,
      partnerId: null,
      activeBooking: null,
      eligiblePartnerIds: new Set(),
      shiftNumber: shift.shiftNumber,
      focusStep: noopStep,
      partnerStep: noopStep,
      onAddFocus: undefined,
      openCaseAndDismiss: () => {},
      setFocusId: () => {},
      setPartnerId: () => {},
      setActiveStarId: () => {},
    });
    rendered = render({ star: buildStarFor(member) });
    return null;
  }

  renderToString(createElement(Probe));

  if (rendered === null) {
    throw new Error("Expected hover card render to produce an element.");
  }

  return renderToString(rendered);
}

function buildStarFor(member: Member): StarMark {
  return {
    member,
    palette: resolvePortraitPalette(member),
    aura: undefined,
    x: 0,
    y: 0,
    z: 0,
    tier: "foreground",
    availability: "ready",
    phase: 0,
  };
}

const noopStep: TutorialStepHandle = {
  active: false,
  done: false,
  complete: () => {},
  dismiss: () => {},
};
