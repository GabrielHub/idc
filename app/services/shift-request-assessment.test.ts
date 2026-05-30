import { describe, expect, it } from "vitest";

import { memberRequests } from "../fixtures";
import { shiftStateSchema, type ShiftState } from "../domain/game";
import { collectMemberUnmetAsks } from "./shift-request-assessment";

function makeShift(requestIds: string[]): ShiftState {
  return shiftStateSchema.parse({
    id: "shift-1",
    shiftNumber: 1,
    status: "active",
    dateSlotsTotal: 1,
    dateSlotsUsed: 0,
    featuredMemberIds: [],
    drawnScenarioIds: [],
    companyGoalIds: [],
    startedAt: "2026-05-21T12:00:00.000Z",
    memberRequestIds: requestIds,
  });
}

describe("collectMemberUnmetAsks", () => {
  const request = memberRequests[0];

  it("returns the member's queued request when no completed date has covered it", () => {
    const asks = collectMemberUnmetAsks({
      memberId: request.memberId,
      shift: makeShift([request.id]),
      completedDates: [],
    });
    expect(asks).toEqual([{ id: request.id, text: request.text }]);
  });

  it("excludes requests owned by a different member", () => {
    const asks = collectMemberUnmetAsks({
      memberId: "someone-else-entirely",
      shift: makeShift([request.id]),
      completedDates: [],
    });
    expect(asks).toEqual([]);
  });

  it("returns nothing when the shift has no queued requests", () => {
    const asks = collectMemberUnmetAsks({
      memberId: request.memberId,
      shift: makeShift([]),
      completedDates: [],
    });
    expect(asks).toEqual([]);
  });
});
