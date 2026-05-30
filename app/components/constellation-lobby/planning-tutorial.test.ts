import { describe, expect, it } from "vitest";

import type { TutorialStepHandle } from "../../services/tutorial";
import { selectPlanningTutorialOverlayIds, type PlanningTutorialSteps } from "./planning-tutorial";

type PlanningStepId = keyof PlanningTutorialSteps;

describe("planning tutorial overlay selection", () => {
  it("shows the first active lazy step instead of stacking multiple lazy coach marks", () => {
    const steps = buildSteps(["lazy.date-book", "lazy.cooldown-block"]);

    expect(selectPlanningTutorialOverlayIds({ steps, viewMode: "tonight" })).toEqual([
      "lazy.date-book",
    ]);
  });

  it("lets required steps suppress lazy steps", () => {
    const steps = buildSteps(["planning.focus", "lazy.date-book"]);

    expect(selectPlanningTutorialOverlayIds({ steps, viewMode: "tonight" })).toEqual([
      "planning.focus",
    ]);
  });

  it("shows the shift brief before the focus pick when both gates are open", () => {
    const steps = buildSteps(["planning.shift-brief", "planning.focus"]);

    expect(selectPlanningTutorialOverlayIds({ steps, viewMode: "tonight" })).toEqual([
      "planning.shift-brief",
    ]);
  });

  it("keeps ordinary lazy steps off archive view", () => {
    const steps = buildSteps(["lazy.date-book"]);

    expect(selectPlanningTutorialOverlayIds({ steps, viewMode: "archive" })).toEqual([]);
  });
});

function buildSteps(activeIds: readonly PlanningStepId[]): PlanningTutorialSteps {
  const activeIdSet = new Set(activeIds);
  return {
    "planning.layer-nav": step(activeIdSet.has("planning.layer-nav")),
    "planning.shift-brief": step(activeIdSet.has("planning.shift-brief")),
    "planning.focus": step(activeIdSet.has("planning.focus")),
    "planning.partner": step(activeIdSet.has("planning.partner")),
    "planning.intent": step(activeIdSet.has("planning.intent")),
    "planning.commit": step(activeIdSet.has("planning.commit")),
    "planning.scenario": step(activeIdSet.has("planning.scenario")),
    "planning.begin": step(activeIdSet.has("planning.begin")),
    "planning.file-shift": step(activeIdSet.has("planning.file-shift")),
    "lazy.contextual-rail": step(activeIdSet.has("lazy.contextual-rail")),
    "lazy.date-book": step(activeIdSet.has("lazy.date-book")),
    "lazy.cooldown-block": step(activeIdSet.has("lazy.cooldown-block")),
    "lazy.closure-ready": step(activeIdSet.has("lazy.closure-ready")),
    "lazy.datebook.repair": step(activeIdSet.has("lazy.datebook.repair")),
    "lazy.datebook.locked": step(activeIdSet.has("lazy.datebook.locked")),
  };
}

function step(active: boolean): TutorialStepHandle {
  return {
    active,
    done: false,
    complete: () => undefined,
    dismiss: () => undefined,
  };
}
