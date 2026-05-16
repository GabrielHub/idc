import { describe, expect, it } from "vitest";

import {
  shiftReportSchema,
  shiftStateSchema,
  type ShiftReport,
  type ShiftState,
} from "../domain/game";
import { selectArchivedShiftReports } from "./shift-archive";

function makeReport(overrides: Partial<ShiftReport> = {}): ShiftReport {
  return shiftReportSchema.parse({
    id: overrides.id ?? "report-1",
    shiftId: overrides.shiftId ?? "shift-1",
    completedAt: overrides.completedAt ?? "2026-05-05T12:00:00.000Z",
    completedDates: overrides.completedDates ?? 1,
    earlyEndedDates: overrides.earlyEndedDates ?? 0,
    ordinaryNonHumanDates: overrides.ordinaryNonHumanDates ?? 0,
    memberMoodDelta: overrides.memberMoodDelta ?? 0,
    goalResults: overrides.goalResults ?? [],
    ignoredRequestIds: overrides.ignoredRequestIds ?? [],
    offeredScenarioIds: overrides.offeredScenarioIds ?? [],
    summary: overrides.summary ?? "1 date completed.",
    hrNote: overrides.hrNote,
    budgetReview: overrides.budgetReview,
    deckCoverage: overrides.deckCoverage ?? [],
  });
}

function makeShift(overrides: Partial<ShiftState> = {}): ShiftState {
  return shiftStateSchema.parse({
    id: overrides.id ?? "shift-1",
    shiftNumber: overrides.shiftNumber ?? 1,
    status: overrides.status ?? "active",
    dateSlotsTotal: overrides.dateSlotsTotal ?? 1,
    dateSlotsUsed: overrides.dateSlotsUsed ?? 0,
    featuredMemberIds: overrides.featuredMemberIds ?? [],
    drawnScenarioIds: overrides.drawnScenarioIds ?? [],
    companyGoalIds: overrides.companyGoalIds ?? [],
    memberRequestIds: overrides.memberRequestIds ?? [],
    startedAt: overrides.startedAt ?? "2026-05-05T11:00:00.000Z",
    completedAt: overrides.completedAt,
    report: overrides.report,
    activeBooking: overrides.activeBooking,
  });
}

describe("selectArchivedShiftReports", () => {
  it("returns an empty list when there are no shifts", () => {
    expect(selectArchivedShiftReports([])).toEqual([]);
  });

  it("excludes active shifts", () => {
    const active = makeShift({ id: "shift-1", shiftNumber: 1, status: "active" });
    expect(selectArchivedShiftReports([active])).toEqual([]);
  });

  it("excludes completed shifts that are missing a report", () => {
    const completedWithoutReport = makeShift({
      id: "shift-1",
      shiftNumber: 1,
      status: "completed",
      completedAt: "2026-05-05T12:00:00.000Z",
    });
    expect(selectArchivedShiftReports([completedWithoutReport])).toEqual([]);
  });

  it("returns completed shifts with reports newest first by completedAt", () => {
    const earlier = makeShift({
      id: "shift-1",
      shiftNumber: 1,
      status: "completed",
      completedAt: "2026-05-05T12:00:00.000Z",
      report: makeReport({
        id: "report-1",
        shiftId: "shift-1",
        completedAt: "2026-05-05T12:00:00.000Z",
        summary: "First shift filed.",
      }),
    });
    const middle = makeShift({
      id: "shift-2",
      shiftNumber: 2,
      status: "completed",
      completedAt: "2026-05-06T12:00:00.000Z",
      report: makeReport({
        id: "report-2",
        shiftId: "shift-2",
        completedAt: "2026-05-06T12:00:00.000Z",
        summary: "Second shift filed.",
      }),
    });
    const latest = makeShift({
      id: "shift-3",
      shiftNumber: 3,
      status: "completed",
      completedAt: "2026-05-07T12:00:00.000Z",
      report: makeReport({
        id: "report-3",
        shiftId: "shift-3",
        completedAt: "2026-05-07T12:00:00.000Z",
        summary: "Third shift filed.",
      }),
    });

    const ordered = selectArchivedShiftReports([earlier, latest, middle]);

    expect(ordered.map((shift) => shift.id)).toEqual(["shift-3", "shift-2", "shift-1"]);
  });

  it("breaks ties by shift number descending when completedAt matches", () => {
    const sameTimestamp = "2026-05-05T12:00:00.000Z";
    const lower = makeShift({
      id: "shift-2",
      shiftNumber: 2,
      status: "completed",
      completedAt: sameTimestamp,
      report: makeReport({ id: "report-2", shiftId: "shift-2", completedAt: sameTimestamp }),
    });
    const higher = makeShift({
      id: "shift-3",
      shiftNumber: 3,
      status: "completed",
      completedAt: sameTimestamp,
      report: makeReport({ id: "report-3", shiftId: "shift-3", completedAt: sameTimestamp }),
    });

    const ordered = selectArchivedShiftReports([lower, higher]);

    expect(ordered.map((shift) => shift.shiftNumber)).toEqual([3, 2]);
  });

  it("does not mutate the input array order", () => {
    const completed = makeShift({
      id: "shift-1",
      shiftNumber: 1,
      status: "completed",
      completedAt: "2026-05-05T12:00:00.000Z",
      report: makeReport({ completedAt: "2026-05-05T12:00:00.000Z" }),
    });
    const active = makeShift({ id: "shift-2", shiftNumber: 2, status: "active" });
    const input: ShiftState[] = [completed, active];
    const inputCopy = [...input];

    selectArchivedShiftReports(input);

    expect(input).toEqual(inputCopy);
  });
});
