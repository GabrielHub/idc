import { describe, expect, it } from "vitest";

import { DEFAULT_TUTORIAL_STATE, gameSaveSchema } from "../domain/game";
import { createSeedGameSave } from "./game-seed";
import {
  isStepComplete,
  readTutorialState,
  withOrientationReset,
  withStepCompleted,
  withTourDismissed,
} from "./tutorial";

describe("tutorial state", () => {
  it("seeds tutorial state and defaults it on parsed saves", () => {
    const save = createSeedGameSave(new Date("2026-05-14T12:00:00.000Z"));
    expect(readTutorialState(save)).toEqual(DEFAULT_TUTORIAL_STATE);

    const { tutorial: _tutorial, ...withoutTutorial } = save;
    expect(gameSaveSchema.parse(withoutTutorial).tutorial).toEqual(DEFAULT_TUTORIAL_STATE);
  });

  it("completes steps once", () => {
    const save = createSeedGameSave(new Date("2026-05-14T12:00:00.000Z"));
    const completed = withStepCompleted(save, "planning.commit");
    const completedAgain = withStepCompleted(completed, "planning.commit");

    expect(isStepComplete(completed.tutorial, "planning.commit")).toBe(true);
    expect(completedAgain.tutorial.completedStepIds).toEqual(["planning.commit"]);
  });

  it("dismisses and resets orientation", () => {
    const save = createSeedGameSave(new Date("2026-05-14T12:00:00.000Z"));
    const completed = withStepCompleted(save, "date.footer.health");
    const dismissed = withTourDismissed(completed, new Date("2026-05-14T12:10:00.000Z"));

    expect(dismissed.tutorial).toEqual({
      enabled: false,
      completedStepIds: ["date.footer.health"],
      dismissedAt: "2026-05-14T12:10:00.000Z",
    });

    expect(withOrientationReset(dismissed).tutorial).toEqual(DEFAULT_TUTORIAL_STATE);
  });
});
