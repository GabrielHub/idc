import { describe, expect, it } from "vitest";

import { memberRequests, starterScenarios } from "../fixtures";
import { addCupidIntervention, advanceDateExchange, triggerScenarioEvent } from "./date-engine";
import {
  buildCharacterPromptPacket,
  buildSummarizerPromptPacket,
  pickSamplesForTurn,
} from "./date-prompts";
import { createSeedGameSave, makePairId } from "./game-seed";
import { startAndDraftDateSession, withFeaturedMembers } from "./test-helpers";

describe("date prompt assembly", () => {
  it("only gives the focused member their own ask", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(save, {
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
    expect(ownerPacket.prompt).toContain("Character card:");
    expect(ownerPacket.prompt).toContain("Personality in conversation:");
    expect(ownerPacket.prompt).toContain("Current date:");
    expect(ownerPacket.prompt).toContain("What you can see of Vhool:");
    expect(ownerPacket.prompt).toContain("Current date facts are the floor, not the ceiling.");
    expect(ownerPacket.prompt).toContain(
      "Treat profile details as app context from before this date",
    );
    expect(ownerPacket.prompt).toContain(
      "Soft improv can include a drink, a snack, a nearby object",
    );
    expect(ownerPacket.prompt).toContain("These are voice examples only.");
    expect(ownerPacket.prompt).toContain(
      "If this is your first message in the date, start from the live moment",
    );
    expect(ownerPacket.prompt).toContain("Where the date is: opener.");
    expect(ownerPacket.prompt).toContain("Live room event:");
    expect(ownerPacket.prompt).toContain(
      "Latest incoming line to answer: The date with Vhool is starting.",
    );
    expect(ownerPacket.prompt).toContain("Your last line, do not repeat: None yet.");
    expect(ownerPacket.prompt).not.toContain("plain white background");
    expect(ownerPacket.prompt).not.toContain("Do not invent objects from preferences");
    expect(ownerPacket.prompt).not.toContain("Patterns you use:");
    expect(ownerPacket.prompt).not.toContain("Patterns they use:");
    expect(`${ownerPacket.system}\n${ownerPacket.prompt}`).not.toMatch(
      /\b(scenario|director|Date Health|gameplay|transcript|turn)\b/i,
    );
    expect(partnerPacket.prompt).not.toContain(request.text);
  });

  it("does not keep feeding opener samples after a speaker has joined the date", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "venus",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "venus",
      firstMemberId: "venus",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const venus = started.save.members.find((member) => member.id === "venus");
    const vhool = started.save.members.find((member) => member.id === "vhool");
    const pairState = started.save.pairStates.find(
      (candidate) => candidate.id === makePairId("venus", "vhool"),
    );

    if (
      scenario === undefined ||
      venus === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const session = {
      ...started.session,
      currentTurn: 2,
      transcript: [
        ...started.session.transcript,
        {
          id: `${started.session.id}-msg-1`,
          dateSessionId: started.session.id,
          kind: "character" as const,
          speakerId: venus.id,
          turnIndex: 1,
          sequenceIndex: 1,
          text: "I am choosing the table. The mirror knows why.",
          createdAt: "2026-05-05T12:02:00.000Z",
        },
        {
          id: `${started.session.id}-msg-2`,
          dateSessionId: started.session.id,
          kind: "character" as const,
          speakerId: vhool.id,
          turnIndex: 2,
          sequenceIndex: 2,
          text: "What must be perfect on this menu?",
          createdAt: "2026-05-05T12:03:00.000Z",
        },
      ],
    };
    const packet = buildCharacterPromptPacket({
      member: venus,
      partner: vhool,
      scenario,
      session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: session.transcript,
      },
    });

    expect(packet.prompt).toContain(
      "Latest incoming line to answer: Vhool: What must be perfect on this menu?",
    );
    expect(packet.prompt).toContain(
      "Your last line, do not repeat: I am choosing the table. The mirror knows why.",
    );
    expect(packet.prompt).toContain("Do not copy opener scaffolds after your first message.");
    expect(packet.prompt).toContain("Do not reuse a full sentence from the date conversation.");
    expect(packet.prompt).toContain("Do not repeat the same named plan, time, object, or promise");
    expect(packet.prompt).not.toContain(
      "As the goddess of love I am uniquely qualified to assess your profile.",
    );
  });

  it("includes the hidden pressure for the live room event", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const eventId = started.session.eventDraft.picked?.[0];
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = started.save.members.find((member) => member.id === "jenna-pike");
    const vhool = started.save.members.find((member) => member.id === "vhool");
    const pairState = started.save.pairStates.find(
      (candidate) => candidate.id === makePairId("jenna-pike", "vhool"),
    );

    if (
      eventId === undefined ||
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected live event prompt fixture setup.");
    }

    const event = scenario.director.events.find((candidate) => candidate.id === eventId);
    const triggered = triggerScenarioEvent(started.save, {
      dateSessionId: started.session.id,
      eventId,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    if (event === undefined) {
      throw new Error("Expected drafted event fixture.");
    }

    const packet = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: triggered.session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: triggered.session.transcript,
      },
    });

    expect(packet.prompt).toContain(`Live room event: ${event.characterVisibleText}`);
    expect(packet.prompt).toContain(`Live room pressure: ${event.directorInstruction}`);
  });

  it("keeps scenario and Cupid notes out of the latest line to answer", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = started.save.members.find((member) => member.id === "jenna-pike");
    const vhool = started.save.members.find((member) => member.id === "vhool");
    const pairState = started.save.pairStates.find(
      (candidate) => candidate.id === makePairId("jenna-pike", "vhool"),
    );

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const session = {
      ...started.session,
      currentTurn: 2,
      transcript: [
        ...started.session.transcript,
        {
          id: `${started.session.id}-msg-1`,
          dateSessionId: started.session.id,
          kind: "character" as const,
          speakerId: jenna.id,
          turnIndex: 1,
          sequenceIndex: 1,
          text: "I can work with inventory if it stays polite.",
          createdAt: "2026-05-05T12:02:00.000Z",
        },
        {
          id: `${started.session.id}-msg-2`,
          dateSessionId: started.session.id,
          kind: "character" as const,
          speakerId: vhool.id,
          turnIndex: 2,
          sequenceIndex: 2,
          text: "Would a polite inventory accept soup?",
          createdAt: "2026-05-05T12:03:00.000Z",
        },
        {
          id: `${started.session.id}-msg-3`,
          dateSessionId: started.session.id,
          kind: "scenario" as const,
          turnIndex: 2,
          sequenceIndex: 3,
          text: "The espresso machine makes a legal argument.",
          createdAt: "2026-05-05T12:04:00.000Z",
        },
        {
          id: `${started.session.id}-msg-4`,
          dateSessionId: started.session.id,
          kind: "cupid" as const,
          turnIndex: 2,
          sequenceIndex: 4,
          text: "Ask about the soup without joining anything.",
          createdAt: "2026-05-05T12:05:00.000Z",
        },
      ],
    };
    const packet = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: session.transcript,
      },
    });

    expect(packet.prompt).toContain(
      "Latest incoming line to answer: Vhool: Would a polite inventory accept soup?",
    );
    expect(packet.prompt).not.toContain(
      "Latest incoming line to answer: Room: The espresso machine makes a legal argument.",
    );
    expect(packet.prompt).not.toContain("Latest incoming line to answer: Private Cupid nudge");
  });

  it("shows targeted Cupid nudges only to the targeted performer", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const nudged = addCupidIntervention(started.save, {
      dateSessionId: started.session.id,
      targetMemberId: "vhool",
      text: "Ask about the receipt without recruiting anyone.",
      now: new Date("2026-05-05T12:02:00.000Z"),
    });
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = nudged.save.members.find((member) => member.id === "jenna-pike");
    const vhool = nudged.save.members.find((member) => member.id === "vhool");
    const pairState = nudged.save.pairStates.find(
      (candidate) => candidate.id === makePairId("jenna-pike", "vhool"),
    );

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const vhoolPacket = buildCharacterPromptPacket({
      member: vhool,
      partner: jenna,
      scenario,
      session: nudged.session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: nudged.session.transcript,
      },
    });
    const jennaPacket = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: nudged.session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: nudged.session.transcript,
      },
    });

    expect(vhoolPacket.prompt).toContain("Cupid suggests");
    expect(vhoolPacket.prompt).toContain("Ask about the receipt without recruiting anyone.");
    expect(jennaPacket.prompt).not.toContain("Ask about the receipt without recruiting anyone.");

    const answeredSession = {
      ...nudged.session,
      currentTurn: 2,
      transcript: [
        ...nudged.session.transcript,
        {
          id: `${nudged.session.id}-msg-2`,
          dateSessionId: nudged.session.id,
          kind: "character" as const,
          speakerId: "jenna-pike",
          turnIndex: 1,
          sequenceIndex: 2,
          text: "The receipt is making eye contact with me.",
          createdAt: "2026-05-05T12:03:00.000Z",
        },
        {
          id: `${nudged.session.id}-msg-3`,
          dateSessionId: nudged.session.id,
          kind: "character" as const,
          speakerId: "vhool",
          turnIndex: 2,
          sequenceIndex: 3,
          text: "I can ask the receipt a small civil question.",
          createdAt: "2026-05-05T12:04:00.000Z",
        },
      ],
    };
    const expiredPacket = buildCharacterPromptPacket({
      member: vhool,
      partner: jenna,
      scenario,
      session: answeredSession,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: answeredSession.transcript,
      },
    });

    expect(expiredPacket.prompt).not.toContain("Ask about the receipt without recruiting anyone.");
    expect(expiredPacket.prompt).not.toContain("Private Cupid nudge");
  });

  it("keeps old Cupid nudges out of later performer prompts", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const firstNudge = addCupidIntervention(started.save, {
      dateSessionId: started.session.id,
      targetMemberId: "vhool",
      text: "Ask about the receipt without recruiting anyone.",
      now: new Date("2026-05-05T12:02:00.000Z"),
    });
    const judged = advanceDateExchange(firstNudge.save, {
      dateSessionId: started.session.id,
      now: new Date("2026-05-05T12:03:00.000Z"),
    });
    const secondNudge = addCupidIntervention(judged.save, {
      dateSessionId: started.session.id,
      targetMemberId: "jenna-pike",
      text: "Name one normal coffee fact before the receipt escalates.",
      now: new Date("2026-05-05T12:04:00.000Z"),
    });
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = secondNudge.save.members.find((member) => member.id === "jenna-pike");
    const vhool = secondNudge.save.members.find((member) => member.id === "vhool");
    const pairState = secondNudge.save.pairStates.find(
      (candidate) => candidate.id === makePairId("jenna-pike", "vhool"),
    );

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const jennaPacket = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: secondNudge.session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: secondNudge.session.transcript,
      },
    });
    const vhoolPacket = buildCharacterPromptPacket({
      member: vhool,
      partner: jenna,
      scenario,
      session: secondNudge.session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: secondNudge.session.transcript,
      },
    });

    expect(jennaPacket.prompt).toContain(
      "Name one normal coffee fact before the receipt escalates.",
    );
    expect(jennaPacket.prompt).not.toContain("Ask about the receipt without recruiting anyone.");
    expect(vhoolPacket.prompt).not.toContain(
      "Name one normal coffee fact before the receipt escalates.",
    );
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
      isOpeningTurn: true,
      seed: "date-1-1-aldric-vale-marsh__calvin-hewes-pottery-studio-drop-in:3:calvin-hewes",
    });

    expect(samples).toHaveLength(4);
    expect(new Set(samples).size).toBe(4);
    expect(samples.filter((sample) => sample.startsWith("warming"))).toHaveLength(2);
  });

  it("uses in-date examples instead of opener examples after the speaker has spoken", () => {
    const samples = pickSamplesForTurn({
      sampleMessages: {
        opener: ["opener 1", "opener 2", "opener 3", "opener 4"],
        warming: ["warming 1", "warming 2", "warming 3", "warming 4"],
        cooling: ["cooling 1", "cooling 2", "cooling 3", "cooling 4"],
        crashingOut: ["crash 1", "crash 2", "crash 3"],
      },
      dateHealth: 70,
      isOpeningTurn: false,
      seed: "date-1:5:venus",
    });

    expect(samples).toHaveLength(4);
    expect(samples.every((sample) => sample.startsWith("warming"))).toBe(true);
  });

  it("asks the summarizer to preserve accepted soft canon", () => {
    const save = withFeaturedMembers(createSeedGameSave(new Date("2026-05-05T12:00:00.000Z")), [
      "jenna-pike",
    ]);
    const started = startAndDraftDateSession(save, {
      focusMemberId: "jenna-pike",
      firstMemberId: "jenna-pike",
      secondMemberId: "vhool",
      scenarioId: "temporal-coffee-shop",
      now: new Date("2026-05-05T12:01:00.000Z"),
    });
    const members = started.save.members.filter((member) =>
      started.session.participants.includes(member.id),
    );

    if (members.length !== 2) {
      throw new Error("Expected two prompt fixture members.");
    }

    const packet = buildSummarizerPromptPacket({
      session: started.session,
      members,
      finalJudgeSnapshot: undefined,
    });

    expect(packet.prompt).toContain("Preserve soft canon that mattered");
    expect(packet.prompt).toContain("improvised objects, orders, invented same-day anecdotes");
    expect(packet.prompt).toContain(
      "Prefer memories that help the pair continue a later conversation",
    );
  });
});
