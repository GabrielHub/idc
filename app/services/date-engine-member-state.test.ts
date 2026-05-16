import { describe, expect, it } from "vitest";

import { dateSessionSchema, type DateMessage } from "../domain/game";
import { starterScenarios } from "../fixtures";
import { applyJudgeToPrivateDateState, judgeExchangeDeterministically } from "./date-engine";
import { createSeedGameSave, makePairId } from "./game-seed";
import { getPairProjectionFromSave } from "./relationship-index";

describe("date engine member state", () => {
  it("can produce asymmetric member mood deltas from deterministic evidence", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const mira = save.members.find((member) => member.id === "mira-park");
    const calvin = save.members.find((member) => member.id === "calvin-hewes");
    const scenario = starterScenarios.find(
      (candidate) => candidate.id === "soft-launch-photo-wall",
    );
    const pairState = getPairProjectionFromSave(save, makePairId("calvin-hewes", "mira-park"));

    if (
      mira === undefined ||
      calvin === undefined ||
      scenario === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected member state fixture setup.");
    }

    const participants: [string, string] = [mira.id, calvin.id];
    const session = dateSessionSchema.parse({
      id: "date-member-state-test",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 24,
      currentTurn: 6,
      dateHealth: 64,
      status: "active",
      runtimeMode: "local_ai",
      participants,
      transcript: [],
      privateStateByCharacter: {
        [mira.id]: { mood: mira.state.mood, comfort: 64, intent: "trying" },
        [calvin.id]: { mood: calvin.state.mood, comfort: 64, intent: "trying" },
      },
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: [] },
      eventsTriggered: [],
      playbackState: "playing",
      endSentiment: null,
      interventions: [
        {
          id: "intervention-mira",
          text: "Keep the brand pitch human.",
          targetMemberId: mira.id,
          usedAtTurn: 1,
        },
      ],
    });
    const exchangeMessages: DateMessage[] = [
      {
        id: "msg-2",
        dateSessionId: session.id,
        kind: "character",
        speakerId: mira.id,
        turnIndex: 2,
        sequenceIndex: 2,
        text: "Mira Park keeps the pitch human and asks Calvin Hewes what consent would look like.",
        createdAt: "2026-05-05T12:02:00.000Z",
      },
      {
        id: "msg-3",
        dateSessionId: session.id,
        kind: "character",
        speakerId: calvin.id,
        turnIndex: 3,
        sequenceIndex: 3,
        text: "Calvin Hewes says the release form is the third most cursed item on the table.",
        createdAt: "2026-05-05T12:03:00.000Z",
      },
    ];

    const snapshot = judgeExchangeDeterministically({
      session,
      pairState,
      members: [mira, calvin],
      scenario,
      exchangeMessages,
      exchangeIndex: 0,
    });

    expect(snapshot.memberMoodDeltas[mira.id]).toBeGreaterThan(0);
    expect(snapshot.memberMoodDeltas[calvin.id]).toBeLessThan(0);
  });

  it("applies judge mood deltas to per-character private date state", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const jenna = save.members.find((member) => member.id === "jenna-pike");
    const vhool = save.members.find((member) => member.id === "vhool");
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const pairState = getPairProjectionFromSave(save, makePairId("jenna-pike", "vhool"));

    if (
      jenna === undefined ||
      vhool === undefined ||
      scenario === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected private date state fixture setup.");
    }

    const session = dateSessionSchema.parse({
      id: "date-private-state-test",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 24,
      currentTurn: 6,
      dateHealth: 60,
      status: "active",
      runtimeMode: "local_ai",
      participants: [jenna.id, vhool.id],
      transcript: [],
      privateStateByCharacter: {
        [jenna.id]: { mood: 60, comfort: 60, intent: "trying" },
        [vhool.id]: { mood: 60, comfort: 60, intent: "trying" },
      },
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: [] },
      eventsTriggered: [],
      playbackState: "playing",
      endSentiment: null,
      interventions: [],
    });
    const snapshot = judgeExchangeDeterministically({
      session,
      pairState,
      members: [jenna, vhool],
      scenario,
      exchangeMessages: [],
      exchangeIndex: 0,
    });
    const nextState = applyJudgeToPrivateDateState(
      session,
      {
        ...snapshot,
        memberMoodDeltas: {
          [jenna.id]: 3,
          [vhool.id]: -4,
        },
        statDeltas: {
          ...snapshot.statDeltas,
          spark: 3,
          strain: 4,
        },
      },
      61,
    );

    expect(nextState[jenna.id]?.mood).toBe(63);
    expect(nextState[jenna.id]?.intent).toBe("lean into the attraction");
    expect(nextState[vhool.id]?.mood).toBe(56);
    expect(nextState[vhool.id]?.intent).toBe("protect the boundary");
  });
});
