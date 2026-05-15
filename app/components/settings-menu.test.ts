import { describe, expect, it } from "vitest";

import { startAndDraftDateSession, withFeaturedMembers } from "../services/test-helpers";
import { createSeedGameSave, getActiveShift } from "../services/game-seed";
import { buildDiagnosticsSnapshot } from "./settings-menu";

describe("settings diagnostics", () => {
  it("summarizes save, active shift, active date, and transient shell state", () => {
    let save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    save = started.save;
    const activeShift = getActiveShift(save);

    const snapshot = buildDiagnosticsSnapshot({
      config: save.config,
      localAiStatus: {
        status: "ready",
        message: "AI provider ready.",
        details: [],
        checkedAt: "2026-05-05T12:02:00.000Z",
      },
      save,
      currentShift: activeShift,
      activeDateSession: started.session,
      currentRoom: "livedate",
      pendingAction: "advanceExchange",
      queuedPlaybackIntent: "paused",
      streamingDraftCount: 1,
      isJudgePending: true,
      lastErrorMessage: "provider stalled",
      noticeMessage: "retry queued",
    });

    expect(snapshot.save.loaded).toBe(true);
    expect(snapshot.save.focusedCaseCount).toBeGreaterThan(0);
    expect(snapshot.currentShift?.id).toBe(activeShift.id);
    expect(snapshot.currentShift?.hasActiveBooking).toBe(true);
    expect(snapshot.activeDate?.id).toBe(started.session.id);
    expect(snapshot.activeDate?.participantIds).toEqual(["jenna-pike", "vhool"]);
    expect(snapshot.shell).toMatchObject({
      currentRoom: "livedate",
      pendingAction: "advanceExchange",
      queuedPlaybackIntent: "paused",
      streamingDraftCount: 1,
      isJudgePending: true,
      lastErrorMessage: "provider stalled",
      noticeMessage: "retry queued",
    });
  });
});
