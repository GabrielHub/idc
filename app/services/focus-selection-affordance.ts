import type { ActiveDateBooking, Member } from "../domain/game";
import { canBeFocusCase, FOCUS_CASE_LIMIT } from "./focus-cases";
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

/**
 * Discriminated decision the hover card renders when the player clicks an
 * eligible star. The `kind` selects the CTA variant; the renderer reads
 * `blockReason` for the under-button explanatory text (e.g. cooldown copy).
 */
export type HoverCardCta =
  | { kind: "make_lead" }
  | { kind: "make_partner" }
  | { kind: "make_focus" }
  | { kind: "swap_into_focus"; penalty: number }
  | { kind: "view_case" };

/**
 * Decides which CTA the hover card surfaces for a given star. Centralizes the
 * focus / partner / cooldown / slots-full decision tree that the renderer used
 * to walk inline. Pure — no React, no member fetches.
 */
export function resolveHoverCardCta({
  affordance,
  isFocused,
  isPartnerCandidate,
  status,
  focusedCount,
  swapPenalty,
}: {
  affordance: FocusSelectionAffordance;
  isFocused: boolean;
  isPartnerCandidate: boolean;
  status: Member["state"]["status"];
  focusedCount: number;
  swapPenalty: number;
}): HoverCardCta {
  if (affordance.canMakeLead) return { kind: "make_lead" };
  if (status !== "active" || isFocused) return { kind: "view_case" };
  if (isPartnerCandidate) return { kind: "make_partner" };
  if (!affordance.eligibleForFocus) return { kind: "view_case" };
  if (affordance.inCooldown) return { kind: "view_case" };
  if (focusedCount >= FOCUS_CASE_LIMIT) return { kind: "swap_into_focus", penalty: swapPenalty };
  return { kind: "make_focus" };
}
