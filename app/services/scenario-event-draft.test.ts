import { describe, expect, it } from "vitest";

import { SCENARIO_EVENT_KINDS, type DateSession, type ScenarioEventKind } from "../domain/game";
import { starterScenarios } from "../fixtures";
import {
  drawScenarioEventOffer,
  EVENT_DRAFT_OFFERED,
  EVENT_DRAFT_OFFERED_PER_KIND,
  EVENT_DRAFT_PICKED,
  pickScenarioEvents,
  startDateSession,
} from "./date-engine";
import { createSeedGameSave, makePairId } from "./game-seed";
import { getPairProjectionFromSave } from "./relationship-index";
import { ensureScenarioInHand, withFeaturedMembers } from "./test-helpers";
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
    const save = ensureScenarioInHand(
      withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), ["jenna-pike"]),
      "temporal-coffee-shop",
    );
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

  it("preserves offer counts while ranking events with pair context", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const [firstMember, secondMember] = save.members;
    if (firstMember === undefined || secondMember === undefined) {
      throw new Error("Expected a seed roster with at least two members.");
    }
    const pairState = getPairProjectionFromSave(save, makePairId(firstMember.id, secondMember.id));

    if (scenario === undefined || pairState === undefined) {
      throw new Error("Expected temporal coffee shop and a seed pair projection.");
    }

    const stuckPairState = {
      ...pairState,
      openLoops: [
        {
          id: "loop-choice",
          text: "Whether Vhool can answer one question without auditing the cup.",
          status: "open" as const,
          sourceDateSessionId: "date-session-1",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
        {
          id: "loop-plan",
          text: "Whether Jenna names a plan before the loop resets.",
          status: "open" as const,
          sourceDateSessionId: "date-session-1",
          createdAt: "2026-05-05T11:05:00.000Z",
        },
      ],
    };
    const draft = drawScenarioEventOffer(scenario, () => 0.42, { pairState: stuckPairState });
    const eventKindById = new Map(
      scenario.director.events.map((event) => [event.id, event.kind] as const),
    );
    const counts = zeroCountsByKind();

    for (const offeredId of draft.offered) {
      const kind = eventKindById.get(offeredId);
      if (kind === undefined) throw new Error(`Unknown event ${offeredId}.`);
      counts[kind] += 1;
    }

    expect(draft.offered).toHaveLength(EVENT_DRAFT_OFFERED);
    for (const kind of SCENARIO_EVENT_KINDS) {
      expect(counts[kind]).toBe(EVENT_DRAFT_OFFERED_PER_KIND);
    }
  });

  it("penalizes recently offered scenario events when drafting a repeat scenario", () => {
    const save = ensureScenarioInHand(
      withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), ["jenna-pike"]),
      "temporal-coffee-shop",
    );
    const started = startDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
      random: () => 0.42,
    });
    const staleEventId = started.session.eventDraft.offered[0];
    const staleKind = starterScenarios
      .find((scenario) => scenario.id === started.session.scenarioId)
      ?.director.events.find((event) => event.id === staleEventId)?.kind;

    if (staleEventId === undefined || staleKind === undefined) {
      throw new Error("Expected the started date to offer at least one event.");
    }

    const completedSession: DateSession = {
      ...started.session,
      status: "completed",
      eventDraft: { offered: [staleEventId], picked: [staleEventId] },
      eventsTriggered: [staleEventId],
      playbackState: "ended",
    };
    const scenario = starterScenarios.find(
      (candidate) => candidate.id === started.session.scenarioId,
    );

    if (scenario === undefined) {
      throw new Error("Expected the started scenario to exist.");
    }

    const alternatives = scenario.director.events.filter(
      (event) => event.kind === staleKind && event.id !== staleEventId,
    );

    if (alternatives.length < EVENT_DRAFT_OFFERED_PER_KIND) {
      throw new Error("Expected enough same-kind alternatives for freshness selection.");
    }

    const nextDraft = drawScenarioEventOffer(scenario, () => 0.42, {
      completedSessions: [completedSession],
    });

    expect(nextDraft.offered).not.toContain(staleEventId);
  });
});
