import type { GameSave, Member, MemberRequest, PairState, ShiftState } from "../../domain/game";
import { memberRequests } from "../../fixtures";
import { makePairId } from "../../services/game-seed";
import { selectHotRequestId } from "../../services/shift-planning";

export type PairCardDetail =
  | {
      kind: "request";
      label: "Lead ask" | "Queue ask";
      summary: string;
      fullText: string;
    }
  | {
      kind: "text";
      text: string;
    };

export type PairCardDetails = {
  focusDetail?: PairCardDetail;
  partnerDetail?: PairCardDetail;
};

export function buildPairCardDetails({
  save,
  shift,
  focusId,
  partnerId,
  readyClosurePairIds,
}: {
  save: GameSave;
  shift: ShiftState;
  focusId: string | null;
  partnerId: string | null;
  readyClosurePairIds: ReadonlySet<string>;
}): PairCardDetails {
  const focusMember = focusId === null ? undefined : save.members.find((m) => m.id === focusId);
  const partnerPairId =
    focusId === null || partnerId === null ? undefined : makePairId(focusId, partnerId);
  const pairState =
    partnerPairId === undefined
      ? undefined
      : save.pairStates.find((candidate) => candidate.id === partnerPairId);

  return {
    focusDetail: focusMember === undefined ? undefined : buildFocusDetail(focusMember, shift),
    partnerDetail:
      partnerPairId === undefined
        ? undefined
        : buildPartnerDetail({
            pairId: partnerPairId,
            pairState,
            readyClosurePairIds,
          }),
  };
}

function buildFocusDetail(member: Member, shift: ShiftState): PairCardDetail {
  const request = memberRequests.find(
    (candidate) =>
      candidate.memberId === member.id && shift.memberRequestIds.includes(candidate.id),
  );
  if (request === undefined) return { kind: "text", text: "Case selected" };

  const leadRequestId = selectHotRequestId({
    memberRequestIds: shift.memberRequestIds,
    shiftNumber: shift.shiftNumber,
  });
  const label = request.id === leadRequestId ? "Lead ask" : "Queue ask";
  return {
    kind: "request",
    label,
    summary: "Has a request",
    fullText: shortAskText(member, request),
  };
}

function shortAskText(member: Member, request: MemberRequest): string {
  const trimmed = request.text.trim().replace(/[.!?]\s*$/, "");
  const wantsPrefix = `${member.firstName} wants `;
  if (startsWithCaseInsensitive(trimmed, wantsPrefix)) {
    return `wants ${trimmed.slice(wantsPrefix.length).trimStart()}`;
  }
  return trimmed;
}

function startsWithCaseInsensitive(value: string, prefix: string): boolean {
  return value.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase();
}

function buildPartnerDetail({
  pairId,
  pairState,
  readyClosurePairIds,
}: {
  pairId: string;
  pairState: PairState | undefined;
  readyClosurePairIds: ReadonlySet<string>;
}): PairCardDetail {
  if (readyClosurePairIds.has(pairId)) {
    return {
      kind: "text",
      text:
        pairState === undefined
          ? "Closure ready"
          : `Closure ready · ${filedDateCountLabel(pairState.completedDateIds.length)}`,
    };
  }
  if (pairState === undefined || pairState.completedDateIds.length === 0) {
    return { kind: "text", text: "First date together" };
  }
  if (pairState.laneStatus === "closed") {
    return { kind: "text", text: "Romantic lane closed" };
  }

  const dateLabel = filedDateCountLabel(pairState.completedDateIds.length);
  const hasOpenLoop = pairState.openLoops.some((loop) => loop.status === "open");
  if (hasOpenLoop) return { kind: "text", text: `${dateLabel} · open loop` };

  const hasActiveAgreement = pairState.agreements.some(
    (agreement) => agreement.status === "active",
  );
  if (hasActiveAgreement) return { kind: "text", text: `${dateLabel} · agreement` };

  return { kind: "text", text: dateLabel };
}

function filedDateCountLabel(count: number): string {
  return `${count} ${count === 1 ? "date" : "dates"} filed`;
}
