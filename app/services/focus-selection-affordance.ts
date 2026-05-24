import type { ActiveDateBooking, Member } from "../domain/game";
import { canBeFocusCase } from "./focus-cases";
import { isMemberInCooldown } from "./shift-planning";

export type FocusSelectionStatusBadge = "active" | "focus" | "closed" | "quit" | "cooling";

export type FocusSelectionAffordance = {
  eligibleForFocus: boolean;
  inCooldown: boolean;
  canMakeLead: boolean;
  statusBadge: FocusSelectionStatusBadge;
  blockReason?: string;
};

export function resolveFocusSelectionAffordance({
  member,
  focused,
  focusId,
  partnerId,
  activeBooking,
  shiftNumber,
}: {
  member: Member;
  focused: boolean;
  focusId: string | null;
  partnerId: string | null;
  activeBooking: ActiveDateBooking | null;
  shiftNumber: number;
}): FocusSelectionAffordance {
  const status = member.state.status;
  const eligibleForFocus = canBeFocusCase(member);
  const inCooldown = status === "active" && isMemberInCooldown(member, shiftNumber);
  const canMakeLead =
    focused &&
    status === "active" &&
    member.id !== focusId &&
    partnerId === null &&
    activeBooking === null &&
    !inCooldown;
  const statusBadge: FocusSelectionStatusBadge =
    status === "closed"
      ? "closed"
      : status === "quit"
        ? "quit"
        : inCooldown
          ? "cooling"
          : focused
            ? "focus"
            : "active";

  return {
    eligibleForFocus,
    inCooldown,
    canMakeLead,
    statusBadge,
    blockReason: inCooldown ? "In cooldown until next shift" : undefined,
  };
}
