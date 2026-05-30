import { describe, expect, it } from "vitest";

import { gameSaveSchema, pairStateSchema } from "../../domain/game";
import { memberRequests } from "../../fixtures";
import { selectInitialFocusCases } from "../../services/focus-cases";
import { createSeedGameSave, getActiveShift, makePairId } from "../../services/game-seed";
import { selectHotRequestId } from "../../services/shift-planning";
import { buildPairCardDetails } from "./pair-card-details";

const SEED_DATE = new Date("2026-05-05T12:00:00.000Z");
const FOCUS_IDS = ["jenna-pike", "meridian-vale", "vhool", "alex-yoon"];

describe("buildPairCardDetails", () => {
  it("surfaces the selected focus member's lead ask without repeating their name", () => {
    const save = selectInitialFocusCases(createSeedGameSave(SEED_DATE), FOCUS_IDS);
    const shift = getActiveShift(save);
    const leadRequestId = selectHotRequestId({
      memberRequestIds: shift.memberRequestIds,
      shiftNumber: shift.shiftNumber,
    });
    const leadRequest = memberRequests.find((request) => request.id === leadRequestId);
    expect(leadRequest).toBeDefined();
    const leadMember = save.members.find((member) => member.id === leadRequest?.memberId);
    expect(leadMember).toBeDefined();

    const details = buildPairCardDetails({
      save,
      shift,
      focusId: leadRequest!.memberId,
      partnerId: null,
      readyClosurePairIds: new Set(),
    });

    if (details.focusDetail?.kind !== "request") {
      throw new Error("Expected a request detail.");
    }

    expect(details.focusDetail.label).toBe("Lead ask");
    expect(details.focusDetail.summary).toBe("Has a request");
    expect(details.focusDetail.fullText).toMatch(/^wants /);
    expect(details.focusDetail.fullText).not.toContain(`${leadMember!.firstName} wants`);
  });

  it("marks non-lead selected focus requests as queue asks", () => {
    const save = selectInitialFocusCases(createSeedGameSave(SEED_DATE), FOCUS_IDS);
    const shift = getActiveShift(save);
    const leadRequestId = selectHotRequestId({
      memberRequestIds: shift.memberRequestIds,
      shiftNumber: shift.shiftNumber,
    });
    const queueRequest = shift.memberRequestIds
      .map((requestId) => memberRequests.find((request) => request.id === requestId))
      .find((request) => request !== undefined && request.id !== leadRequestId);
    expect(queueRequest).toBeDefined();

    const details = buildPairCardDetails({
      save,
      shift,
      focusId: queueRequest!.memberId,
      partnerId: null,
      readyClosurePairIds: new Set(),
    });

    if (details.focusDetail?.kind !== "request") {
      throw new Error("Expected a request detail.");
    }

    expect(details.focusDetail.label).toBe("Queue ask");
    expect(details.focusDetail.summary).toBe("Has a request");
    expect(details.focusDetail.fullText).toMatch(/^wants /);
  });

  it("surfaces partner pair history instead of member origin", () => {
    const seed = selectInitialFocusCases(createSeedGameSave(SEED_DATE), FOCUS_IDS);
    const shift = getActiveShift(seed);
    const focusId = FOCUS_IDS[0]!;
    const partnerId = shift.availablePartnerMemberIds[0]!;
    const pairId = makePairId(focusId, partnerId);
    const pairState = pairStateSchema.parse({
      id: pairId,
      participantIds: [focusId, partnerId],
      stats: {
        chemistry: 52,
        trust: 58,
        stability: 50,
        conflict: 18,
        weirdnessTolerance: 55,
        spark: 57,
        strain: 20,
        relationshipHealth: 61,
      },
      completedDateIds: ["date-1", "date-2"],
      scenarioUseCounts: {},
      openLoops: [
        {
          id: "loop-1",
          text: "They still need to decide whether the next date should stay low pressure.",
          status: "open",
          createdAt: SEED_DATE.toISOString(),
        },
      ],
    });
    const save = gameSaveSchema.parse({ ...seed, pairStates: [pairState] });

    const details = buildPairCardDetails({
      save,
      shift,
      focusId,
      partnerId,
      readyClosurePairIds: new Set(),
    });

    if (details.partnerDetail?.kind !== "text") {
      throw new Error("Expected a text detail.");
    }

    expect(details.partnerDetail.text).toBe("2 dates filed · open loop");
    expect(details.partnerDetail.text).not.toContain(
      save.members.find((member) => member.id === partnerId)?.origin,
    );
  });

  it("prioritizes closure readiness for a selected pair", () => {
    const seed = selectInitialFocusCases(createSeedGameSave(SEED_DATE), FOCUS_IDS);
    const shift = getActiveShift(seed);
    const focusId = FOCUS_IDS[0]!;
    const partnerId = shift.availablePartnerMemberIds[0]!;
    const pairId = makePairId(focusId, partnerId);

    const details = buildPairCardDetails({
      save: seed,
      shift,
      focusId,
      partnerId,
      readyClosurePairIds: new Set([pairId]),
    });

    expect(details.partnerDetail).toEqual({ kind: "text", text: "Closure ready" });
  });
});
