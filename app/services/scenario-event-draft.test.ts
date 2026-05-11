import { describe, expect, it } from "vitest";

import { SCENARIO_EVENT_KINDS, type ScenarioEventKind } from "../domain/game";
import { starterScenarios } from "../fixtures";
import {
  drawScenarioEventOffer,
  EVENT_DRAFT_OFFERED,
  EVENT_DRAFT_OFFERED_PER_KIND,
  EVENT_DRAFT_PICKED,
  pickScenarioEvents,
  startDateSession,
} from "./date-engine";
import { createSeedGameSave } from "./game-seed";
import { withFeaturedMembers } from "./test-helpers";
import { mulberry32 } from "./utils";

function zeroCountsByKind(): Record<ScenarioEventKind, number> {
  return Object.fromEntries(SCENARIO_EVENT_KINDS.map((kind) => [kind, 0])) as Record<
    ScenarioEventKind,
    number
  >;
}

describe("scenario event draft", () => {
  it("offers two events per kind and picks three total", () => {
    expect(EVENT_DRAFT_OFFERED).toBe(EVENT_DRAFT_OFFERED_PER_KIND * SCENARIO_EVENT_KINDS.length);
    expect(EVENT_DRAFT_PICKED).toBe(3);
  });

  it("deals exactly two events of each kind across many seeds", () => {
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");

    if (scenario === undefined) {
      throw new Error("Expected the temporal-coffee-shop scenario to exist.");
    }

    const eventKindById = new Map(
      scenario.director.events.map((event) => [event.id, event.kind] as const),
    );

    for (let seed = 1; seed <= 100; seed += 1) {
      const random = mulberry32(seed);
      const draft = drawScenarioEventOffer(scenario, random);

      expect(draft.picked).toBeNull();
      expect(draft.offered).toHaveLength(EVENT_DRAFT_OFFERED);
      expect(new Set(draft.offered).size).toBe(draft.offered.length);

      const counts = zeroCountsByKind();

      for (const offeredId of draft.offered) {
        const kind = eventKindById.get(offeredId);

        if (kind === undefined) {
          throw new Error(`Offered event id ${offeredId} did not appear in the scenario.`);
        }

        counts[kind] += 1;
      }

      for (const kind of SCENARIO_EVENT_KINDS) {
        expect(counts[kind]).toBe(EVENT_DRAFT_OFFERED_PER_KIND);
      }
    }
  });

  it("clamps random values at the high end so callers cannot index past the bucket", () => {
    const scenario = starterScenarios[0];

    if (scenario === undefined) {
      throw new Error("Expected at least one starter scenario.");
    }

    const draft = drawScenarioEventOffer(scenario, () => 1);
    expect(draft.offered).toHaveLength(EVENT_DRAFT_OFFERED);

    const ids = new Set(scenario.director.events.map((event) => event.id));
    for (const offeredId of draft.offered) {
      expect(ids.has(offeredId)).toBe(true);
    }
  });

  it("requires picks to be drawn from the offered set under the new pool size", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });

    const offered = started.session.eventDraft.offered;
    expect(offered).toHaveLength(EVENT_DRAFT_OFFERED);

    const validPicks = offered.slice(0, EVENT_DRAFT_PICKED);
    const picked = pickScenarioEvents(started.save, {
      dateSessionId: started.session.id,
      pickedEventIds: validPicks,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });
    expect(picked.session.eventDraft.picked).toEqual(validPicks);

    expect(() =>
      pickScenarioEvents(started.save, {
        dateSessionId: started.session.id,
        pickedEventIds: ["does-not-exist", offered[0] ?? "", offered[1] ?? ""],
        now: new Date("2026-05-05T12:02:00.000Z"),
      }),
    ).toThrow();

    expect(() =>
      pickScenarioEvents(started.save, {
        dateSessionId: started.session.id,
        pickedEventIds: validPicks.slice(0, 2),
        now: new Date("2026-05-05T12:02:00.000Z"),
      }),
    ).toThrow();
  });
});
