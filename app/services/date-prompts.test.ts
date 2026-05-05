import { describe, expect, it } from "vitest";

import { memberRequests, starterScenarios } from "../fixtures";
import { startDateSession } from "./date-engine";
import { buildCharacterPromptPacket, pickSamplesForTurn } from "./date-prompts";
import { createSeedGameSave, makePairId } from "./game-seed";
import { withFeaturedMembers } from "./test-helpers";

describe("date prompt assembly", () => {
  it("only gives the focused member their own ask", () => {
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
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const request = memberRequests.find(
      (candidate) => candidate.id === "request-jenna-normal-date",
    );
    const jenna = started.save.members.find((member) => member.id === "jenna-pike");
    const vhool = started.save.members.find((member) => member.id === "vhool");
    const pairState = started.save.pairStates.find(
      (candidate) => candidate.id === makePairId("jenna-pike", "vhool"),
    );

    if (
      scenario === undefined ||
      request === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const memoryPack = {
      self: [],
      pair: [],
      scenario: [],
      recentTranscript: started.session.transcript,
    };
    const ownerPacket = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: started.session,
      pairState,
      memoryPack,
      focusRequest: request,
    });
    const partnerPacket = buildCharacterPromptPacket({
      member: vhool,
      partner: jenna,
      scenario,
      session: started.session,
      pairState,
      memoryPack,
      focusRequest: request,
    });

    expect(ownerPacket.prompt).toContain(`Your ask today: "${request.text}".`);
    expect(partnerPacket.prompt).not.toContain(request.text);
  });

  it("selects samples without looping on known collision seeds", () => {
    const samples = pickSamplesForTurn({
      sampleMessages: {
        opener: ["opener 1", "opener 2", "opener 3", "opener 4"],
        warming: ["warming 1", "warming 2", "warming 3", "warming 4"],
        cooling: ["cooling 1", "cooling 2", "cooling 3", "cooling 4"],
        crashingOut: ["crash 1", "crash 2", "crash 3"],
      },
      dateHealth: 70,
      seed: "date-1-1-aldric-vale-marsh__calvin-hewes-pottery-studio-drop-in:3:calvin-hewes",
    });

    expect(samples).toHaveLength(4);
    expect(new Set(samples).size).toBe(4);
    expect(samples.filter((sample) => sample.startsWith("warming"))).toHaveLength(2);
  });
});
