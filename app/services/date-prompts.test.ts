import { describe, expect, it } from "vitest";

import {
  pairStateSchema,
  type DateMessage,
  type DateSession,
  type ScenarioEventKind,
} from "../domain/game";
import { memberRequests, starterScenarios } from "../fixtures";
import { addCupidIntervention, advanceDateExchange, triggerScenarioEvent } from "./date-engine";
import {
  buildCharacterPromptPacket,
  buildJudgePromptPacket,
  buildSummarizerPromptPacket,
  checkCupidCorporateCopy,
  formatDirectorInstructionWithKindSuffix,
  hasNearDuplicateRecentLine,
  pickSamplesForTurn,
  SCENARIO_EVENT_KIND_SUFFIXES,
  withCharacterVisibilityRetryGuard,
  type CharacterPromptImageAttachment,
} from "./date-prompts";
import { createSeedGameSave, makePairId } from "./game-seed";
import { evaluateMatchFit } from "./match-fit";
import { buildRevealCandidates, buildVisibleMemberProfile } from "./player-knowledge";
import { getPairProjectionFromSave } from "./relationship-index";
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
    const pairState = getPairProjectionFromSave(started.save, makePairId("jenna-pike", "vhool"));

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

    expect(ownerPacket.prompt).toContain(
      `<focus>What you most want to come out of tonight: ${request.text}</focus>`,
    );
    expect(ownerPacket.prompt).toContain(
      "<role>You are Jenna Pike. People who know you call you Jenna.</role>",
    );
    expect(ownerPacket.prompt).toContain(
      "You signed up for Cupid, a dating app. The platform crosses dimensions:",
    );
    expect(ownerPacket.prompt).toContain(
      "Your Cupid dating manager set this date up: she paired you with your partner, and Cupid picked the venue and the time.",
    );
    expect(ownerPacket.prompt).toContain("Neither of you chose this place or each other.");
    expect(ownerPacket.prompt).toContain(
      "During the date the dating manager may send private in-app notes meant as coaching, not conversation.",
    );
    expect(ownerPacket.prompt).toContain("This is your first date with Vhool through Cupid.");
    expect(ownerPacket.prompt).toContain("- Keep the scene readable even when time glitches.");
    expect(ownerPacket.prompt).toContain(
      "- Loops happen at the table. Do not pull the pair out of the chair or skip ahead in the day.",
    );
    expect(ownerPacket.prompt).toContain("<format>");
    expect(ownerPacket.prompt).toContain("One message per turn. You are texting from the table.");
    expect(ownerPacket.prompt).toContain(
      `Acknowledge what Vhool just said in your own words before you move the conversation.`,
    );
    expect(ownerPacket.prompt).not.toContain("Character card:");
    expect(ownerPacket.prompt).not.toContain("Personality in conversation:");
    expect(ownerPacket.prompt).not.toContain("Output contract:");
    expect(ownerPacket.prompt).not.toContain("Conversation target:");
    expect(ownerPacket.prompt).not.toContain("Reply rhythm for this line:");
    expect(ownerPacket.prompt).not.toContain("Latest incoming line to answer:");
    expect(ownerPacket.prompt).not.toContain("Live room event:");
    expect(ownerPacket.prompt).not.toContain("plain white background");
    expect(`${ownerPacket.system}\n${ownerPacket.prompt}`).not.toMatch(
      /\b(Date Health|gameplay|transcript)\b/i,
    );
    expect(partnerPacket.prompt).not.toContain(request.text);
  });

  it("includes active agreements and unresolved loops without archived transcript dependence", () => {
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
    const basePairState = getPairProjectionFromSave(
      started.save,
      makePairId("jenna-pike", "vhool"),
    );

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      basePairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const pairState = pairStateSchema.parse({
      ...basePairState,
      agreements: [
        {
          id: "agreement-no-filming",
          text: "No filming at the table.",
          status: "active",
          sourceDateSessionId: "archived-session",
          createdAt: "2026-05-05T11:00:00.000Z",
        },
        {
          id: "agreement-old",
          text: "Archive the soup receipt.",
          status: "retired",
          sourceDateSessionId: "archived-session",
          createdAt: "2026-05-05T10:00:00.000Z",
          resolvedAt: "2026-05-05T11:00:00.000Z",
        },
      ],
      openLoops: [
        {
          id: "loop-receipt",
          text: "Whether Vhool can return the receipt without ceremony.",
          status: "open",
          sourceDateSessionId: "archived-session",
          createdAt: "2026-05-05T11:05:00.000Z",
        },
        {
          id: "loop-resolved",
          text: "Whether the spoon was haunted.",
          status: "resolved",
          sourceDateSessionId: "archived-session",
          createdAt: "2026-05-05T10:05:00.000Z",
          resolvedAt: "2026-05-05T11:05:00.000Z",
        },
      ],
    });
    const packet = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: started.session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: [],
      },
    });

    expect(packet.prompt).toContain("Things you and Vhool have already agreed on:");
    expect(packet.prompt).toContain("- No filming at the table.");
    expect(packet.prompt).toContain("Things still hanging between you and Vhool:");
    expect(packet.prompt).toContain("- Whether Vhool can return the receipt without ceremony.");
    expect(packet.prompt).toContain(
      "The one thing still hanging that could move tonight: Whether Vhool can return the receipt without ceremony.",
    );
    expect(packet.prompt).not.toContain("Archive the soup receipt.");
    expect(packet.prompt).not.toContain("Whether the spoon was haunted.");
    expect(packet.prompt).not.toContain("archived-session");
    expect(packet.prompt).not.toContain("Pair file guidance:");
    expect(packet.prompt).not.toContain("Pair file subtext:");
  });

  it("feeds live per-character date state into performer prompts", () => {
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
    const pairState = getPairProjectionFromSave(started.save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const session: DateSession = {
      ...started.session,
      privateStateByCharacter: {
        ...started.session.privateStateByCharacter,
        [jenna.id]: {
          mood: 24,
          comfort: 26,
          intent: "protect the boundary",
        },
      },
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
        recentTranscript: [],
      },
    });

    expect(packet.prompt).toContain("mood is rough");
    expect(packet.prompt).toContain("comfort with this date is bad");
    expect(packet.prompt).toContain("current intent is protect the boundary");
  });

  it("labels first turn visual attachments in the final user message", () => {
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
    const pairState = getPairProjectionFromSave(started.save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const imageAttachments: CharacterPromptImageAttachment[] = [
      {
        description: "Vhool's full-body date portrait",
        image: new Uint8Array([1, 2, 3]),
        mediaType: "image/png",
      },
      {
        description: "Cart Before The Horse, the date backdrop",
        image: new Uint8Array([4, 5, 6]),
        mediaType: "image/webp",
      },
    ];
    const packet = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: started.session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: started.session.transcript,
      },
      imageAttachments,
    });

    expect(packet.prompt).toContain("Photos are attached for visual grounding.");
    expect(packet.prompt).toContain("Vhool's full-body date portrait");
    expect(packet.prompt).toContain("Cart Before The Horse, the date backdrop");
    expect(packet.prompt).toContain("[attached image: image/png]");
    expect(packet.prompt).toContain("[attached image: image/webp]");
    expect(packet.prompt).not.toContain("1,2,3");

    const finalMessage = packet.messages?.at(-1);

    if (finalMessage?.role !== "user" || !Array.isArray(finalMessage.content)) {
      throw new Error("Expected final user message with image parts.");
    }

    const [textPart, firstImage, secondImage] = finalMessage.content;

    if (textPart?.type !== "text") {
      throw new Error("Expected attachment labels in a text part.");
    }

    expect(textPart.text).toContain("Vhool's full-body date portrait");
    expect(textPart.text).toContain("Cart Before The Horse, the date backdrop");
    expect(firstImage?.type).toBe("image");
    expect(secondImage?.type).toBe("image");
  });

  it("gives performers only the player-visible partner profile and no private partner facts", () => {
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
    const pairState = getPairProjectionFromSave(started.save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const packet = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: started.session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: started.session.transcript,
      },
    });

    const visiblePartnerProfile = buildVisibleMemberProfile(vhool, []);
    const publicProfileText = visiblePartnerProfile.publicFragments.join(" ");
    const hiddenProfileText = vhool.datingProfile.slice(publicProfileText.length).trim();
    expect(publicProfileText.length).toBeGreaterThan(0);
    expect(hiddenProfileText.length).toBeGreaterThan(0);
    expect(packet.prompt).toContain(publicProfileText);
    expect(packet.prompt).not.toContain(hiddenProfileText);
    expect(packet.prompt).toContain(vhool.visualDescription);
    expect(packet.prompt).toContain(
      `Listed height: ${Math.floor(vhool.characterHeightInInches / 12)} ft ${vhool.characterHeightInInches % 12} in. Yours: 5 ft 0 in.`,
    );
    expect(packet.prompt).not.toContain(vhool.bio);
    expect(packet.prompt).not.toContain(vhool.species);
    expect(packet.prompt).not.toContain(vhool.origin);
    expect(packet.prompt).not.toContain(vhool.dimension);
    expect(packet.prompt).not.toContain(vhool.realityStatus);
    expect(packet.prompt).toContain(jenna.bio);
  });

  it("exposes the rest of the partner profile once a profile read is filed", () => {
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
    const pairState = getPairProjectionFromSave(started.save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const packet = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: started.session,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: started.session.transcript,
      },
      partnerKnowledge: [
        {
          id: "member:vhool:profile:expand:test-1",
          subjectKind: "member",
          subjectId: vhool.id,
          readKind: "profile",
          readId: `member:${vhool.id}:profile:expand`,
          readText: "Profile expanded.",
          confidence: "filed",
          source: "judge",
          dateSessionId: started.session.id,
          revealedAt: "2026-05-05T12:01:00.000Z",
        },
      ],
    });

    expect(packet.prompt).toContain(vhool.datingProfile);
  });

  it("does not keep feeding greeting samples after a speaker has joined the date", () => {
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
    const pairState = getPairProjectionFromSave(started.save, makePairId("venus", "vhool"));

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

    expect(packet.prompt).toContain("What must be perfect on this menu?");
    expect(packet.prompt).toContain("I am choosing the table. The mirror knows why.");
    expect(packet.prompt).not.toContain(
      "Venus. Sit, darling. The lighting at this table was negotiated.",
    );
    expect(packet.prompt).not.toContain("<greeting_examples>");

    const threadAssistantMessages =
      packet.messages?.filter((message) => message.role === "assistant") ?? [];
    expect(threadAssistantMessages.map((message) => message.content)).toContain(
      "I am choosing the table. The mirror knows why.",
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
    const pairState = getPairProjectionFromSave(started.save, makePairId("jenna-pike", "vhool"));

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

    expect(packet.prompt).toContain(`This just happened: ${event.characterVisibleText}`);
    expect(packet.prompt).not.toContain(event.directorInstruction);
    expect(packet.prompt).not.toContain(SCENARIO_EVENT_KIND_SUFFIXES[event.kind]);
    expect(packet.prompt).not.toContain("Live room event:");
    expect(packet.prompt).not.toContain("Live room pressure:");
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
    const pairState = getPairProjectionFromSave(started.save, makePairId("jenna-pike", "vhool"));

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

    expect(packet.prompt).toContain("Would a polite inventory accept soup?");
    expect(packet.prompt).toContain(
      "This just happened: The espresso machine makes a legal argument.",
    );
    expect(packet.prompt).not.toContain("Latest incoming line to answer:");
    expect(packet.prompt).not.toContain("Room: The espresso machine makes a legal argument.");
    expect(packet.prompt).not.toContain("Private Cupid nudge");

    const finalMessage = packet.messages?.at(-1);
    if (finalMessage?.role !== "user" || typeof finalMessage.content !== "string") {
      throw new Error("Expected the final user message to carry batched text.");
    }

    expect(finalMessage.content).toContain("Would a polite inventory accept soup?");
    expect(finalMessage.content).toContain(
      "This just happened: The espresso machine makes a legal argument.",
    );

    const userMessageCount = (packet.messages ?? []).filter(
      (message) => message.role === "user",
    ).length;
    const assistantMessageCount = (packet.messages ?? []).filter(
      (message) => message.role === "assistant",
    ).length;
    expect(userMessageCount).toBe(2);
    expect(assistantMessageCount).toBe(1);
  });

  it("batches a scene event and a fresh Cupid nudge with the partner's reply into one user message", () => {
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
    const pairState = getPairProjectionFromSave(started.save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const nudged = addCupidIntervention(started.save, {
      dateSessionId: started.session.id,
      targetMemberId: jenna.id,
      text: "Ask about the receipt without recruiting anyone.",
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    const sessionWithLeadIn = {
      ...nudged.session,
      currentTurn: 2,
      transcript: [
        ...nudged.session.transcript,
        {
          id: `${nudged.session.id}-msg-scene`,
          dateSessionId: nudged.session.id,
          kind: "scenario" as const,
          turnIndex: 2,
          sequenceIndex: nudged.session.transcript.length,
          text: "The espresso machine makes a legal argument.",
          createdAt: "2026-05-05T12:03:00.000Z",
        },
        {
          id: `${nudged.session.id}-msg-vhool`,
          dateSessionId: nudged.session.id,
          kind: "character" as const,
          speakerId: vhool.id,
          turnIndex: 2,
          sequenceIndex: nudged.session.transcript.length + 1,
          text: "Would a polite inventory accept soup?",
          createdAt: "2026-05-05T12:04:00.000Z",
        },
      ],
    };

    const packet = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: sessionWithLeadIn,
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: sessionWithLeadIn.transcript,
      },
    });

    const finalMessage = packet.messages?.at(-1);
    if (finalMessage?.role !== "user" || typeof finalMessage.content !== "string") {
      throw new Error("Expected the final user message to carry batched text.");
    }

    expect(finalMessage.content).toContain(
      `Private Cupid coaching note, not spoken at the table and not a message to answer: "Ask about the receipt without recruiting anyone."`,
    );
    expect(finalMessage.content).toContain(
      "This just happened: The espresso machine makes a legal argument.",
    );
    expect(finalMessage.content).toContain("Would a polite inventory accept soup?");

    const userMessages = (packet.messages ?? []).filter((message) => message.role === "user");
    expect(userMessages).toHaveLength(1);
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
    const pairState = getPairProjectionFromSave(nudged.save, makePairId("jenna-pike", "vhool"));

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

    expect(vhoolPacket.prompt).toContain(
      `Private Cupid coaching note, not spoken at the table and not a message to answer: "Ask about the receipt without recruiting anyone."`,
    );
    expect(vhoolPacket.prompt).toContain("Your reply is the spoken line to your date");
    expect(vhoolPacket.prompt).not.toContain("Cupid suggests");
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
    expect(expiredPacket.prompt).not.toContain("Private Cupid coaching note");
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
    const pairState = getPairProjectionFromSave(
      secondNudge.save,
      makePairId("jenna-pike", "vhool"),
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
    const { greetings, voiceFlavor } = pickSamplesForTurn({
      sampleMessages: {
        greeting: ["greeting 1", "greeting 2", "greeting 3", "greeting 4"],
        hingeBits: ["hinge 1", "hinge 2", "hinge 3", "hinge 4"],
        warming: ["warming 1", "warming 2", "warming 3", "warming 4"],
        cooling: ["cooling 1", "cooling 2", "cooling 3", "cooling 4"],
        crashingOut: ["crash 1", "crash 2", "crash 3"],
      },
      dateHealth: 70,
      isOpeningTurn: true,
      seed: "date-1-1-aldric-vale-marsh__calvin-hewes-pottery-studio-drop-in:3:calvin-hewes",
    });

    expect(greetings).toHaveLength(2);
    expect(new Set(greetings).size).toBe(2);
    expect(voiceFlavor).toHaveLength(2);
    expect(new Set(voiceFlavor).size).toBe(2);
    expect(voiceFlavor.filter((sample) => sample.startsWith("hinge"))).toHaveLength(1);
    expect(voiceFlavor.filter((sample) => sample.startsWith("warming"))).toHaveLength(1);
  });

  it("uses in-date examples instead of greeting examples after the speaker has spoken", () => {
    const { greetings, voiceFlavor } = pickSamplesForTurn({
      sampleMessages: {
        greeting: ["greeting 1", "greeting 2", "greeting 3", "greeting 4"],
        hingeBits: ["hinge 1", "hinge 2", "hinge 3", "hinge 4"],
        warming: ["warming 1", "warming 2", "warming 3", "warming 4"],
        cooling: ["cooling 1", "cooling 2", "cooling 3", "cooling 4"],
        crashingOut: ["crash 1", "crash 2", "crash 3"],
      },
      dateHealth: 70,
      isOpeningTurn: false,
      seed: "date-1:5:venus",
    });

    expect(greetings).toHaveLength(0);
    expect(voiceFlavor).toHaveLength(4);
    expect(voiceFlavor.filter((sample) => sample.startsWith("hinge"))).toHaveLength(1);
    expect(voiceFlavor.filter((sample) => sample.startsWith("warming"))).toHaveLength(2);
    expect(voiceFlavor.filter((sample) => sample.startsWith("cooling"))).toHaveLength(1);
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
      "Favor memories that help the pair continue a later conversation",
    );
  });
});

describe("buildJudgePromptPacket reveal candidates", () => {
  it("gives the Judge early end triggers and dynamic scoring bands", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = save.members.find((member) => member.id === "jenna-pike");
    const vhool = save.members.find((member) => member.id === "vhool");
    const pairState = getPairProjectionFromSave(save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected fixture setup.");
    }

    const session = {
      id: "test-session",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 30,
      currentTurn: 0,
      dateHealth: 60,
      status: "active" as const,
      runtimeMode: "local_ai" as const,
      participants: pairState.participantIds,
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing" as const,
      endSentiment: null,
      interventions: [],
    };
    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages: [],
      members: [jenna, vhool],
      revealCandidates: [],
    });

    expect(packet.prompt).toContain("dateHealthDelta must be an integer from -18 to 14.");
    expect(packet.prompt).toContain("<scoring_guidance>");
    expect(packet.prompt).toContain("Use -1 to -3 for mild drift");
    expect(packet.prompt).toContain("Scenario pressure: risk");
    expect(packet.prompt).toContain("Early end triggers:");
    for (const trigger of scenario.director.earlyEndTriggers) {
      expect(packet.prompt).toContain(trigger);
    }
  });

  it("puts agency evidence rules next to shared task exchanges", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find(
      (candidate) => candidate.id === "dinosaur-bbq-all-you-can-eat",
    );
    const ryan = save.members.find((member) => member.id === "ryan-doyle");
    const junie = save.members.find((member) => member.id === "junie-marrow");
    const pairState = getPairProjectionFromSave(save, makePairId("ryan-doyle", "junie-marrow"));

    if (
      scenario === undefined ||
      ryan === undefined ||
      junie === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected fixture setup.");
    }

    const session: DateSession = {
      id: "grill-session",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 30,
      currentTurn: 3,
      dateHealth: 60,
      status: "active",
      runtimeMode: "local_ai",
      participants: pairState.participantIds,
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing",
      endSentiment: null,
      interventions: [],
    };
    const exchangeMessages: DateMessage[] = [
      {
        id: "scene-menu",
        dateSessionId: session.id,
        kind: "scenario",
        turnIndex: 0,
        sequenceIndex: 0,
        text: "The tablet shows the menu. The first sampler plate is already on the wall track.",
        createdAt: "2026-05-05T12:01:00.000Z",
      },
      {
        id: "ryan-dibs",
        dateSessionId: session.id,
        kind: "character",
        speakerId: ryan.id,
        turnIndex: 1,
        sequenceIndex: 1,
        text: "Fair enough, I'll take strong start. You want first dibs on the grill or should I just send it?",
        createdAt: "2026-05-05T12:01:30.000Z",
      },
      {
        id: "junie-send-it",
        dateSessionId: session.id,
        kind: "character",
        speakerId: junie.id,
        turnIndex: 2,
        sequenceIndex: 2,
        text: "You send it. I'll just stand here and be picky about doneness like it's my job.",
        createdAt: "2026-05-05T12:02:00.000Z",
      },
      {
        id: "ryan-order",
        dateSessionId: session.id,
        kind: "character",
        speakerId: ryan.id,
        turnIndex: 3,
        sequenceIndex: 3,
        text: "Yeee, chef mode activated. I'll send a round of brisket point and maybe that fatty pork belly, keep the critique coming.",
        createdAt: "2026-05-05T12:02:30.000Z",
      },
    ];

    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages,
      members: [ryan, junie],
      revealCandidates: [],
    });

    expect(packet.prompt).toContain("<evidence_rules>");
    expect(packet.prompt).toContain(
      "Asking the partner whether they want a turn, then acting after they answer, is checking preference, not deferring control.",
    );
    expect(packet.prompt).toContain(
      "When the role read is ambiguous, write the visible move instead: Alex asked Sam about first dibs, Sam told Alex to send it, Alex ordered the meat.",
    );
    expect(packet.prompt).toContain(
      "Ryan Doyle: Fair enough, I'll take strong start. You want first dibs on the grill or should I just send it?",
    );
    expect(packet.prompt).toContain(
      "Junie Marrow: You send it. I'll just stand here and be picky about doneness like it's my job.",
    );
    expect(packet.prompt).toContain(
      "Ryan Doyle: Yeee, chef mode activated. I'll send a round of brisket point and maybe that fatty pork belly, keep the critique coming.",
    );
  });

  it("includes reveal candidate ids and display reads", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find((candidate) => candidate.id === "prophecy-karaoke");
    const opal = save.members.find((member) => member.id === "opal-sunday");
    const bai = save.members.find((member) => member.id === "bai-wenshu");
    const pairState = getPairProjectionFromSave(save, makePairId("opal-sunday", "bai-wenshu"));

    if (
      scenario === undefined ||
      opal === undefined ||
      bai === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected fixture setup.");
    }

    const members = [opal, bai];
    const matchFit = evaluateMatchFit({
      members,
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members,
      scenario,
      pairState,
      matchFit,
    });
    const session = {
      id: "test-session",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 30,
      currentTurn: 0,
      dateHealth: 60,
      status: "active" as const,
      runtimeMode: "local_ai" as const,
      participants: pairState.participantIds,
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing" as const,
      endSentiment: null,
      interventions: [],
    };
    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages: [],
      members,
      revealCandidates: candidates,
    });

    expect(packet.prompt).toContain("<reveal_candidates>");
    expect(packet.prompt).toContain("usedEvidenceIds");
    expect(packet.prompt).toContain("It is valid to return an empty array.");

    expect(candidates.length).toBeGreaterThan(0);
    const sample = candidates[0];
    expect(packet.prompt).toContain(`id: ${sample.id}`);
    expect(packet.prompt).toContain(`read: ${sample.readText}`);
    expect(packet.prompt).toContain(`evidence: ${sample.evidenceText}`);
  });

  it("includes compact member briefs without secrets or raw state numbers", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = save.members.find((member) => member.id === "jenna-pike");
    const vhool = save.members.find((member) => member.id === "vhool");
    const pairState = getPairProjectionFromSave(save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected fixture setup.");
    }

    const members = [jenna, vhool];
    const session = {
      id: "test-session",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 30,
      currentTurn: 0,
      dateHealth: 60,
      status: "active" as const,
      runtimeMode: "local_ai" as const,
      participants: pairState.participantIds,
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing" as const,
      endSentiment: null,
      interventions: [],
    };
    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages: [],
      members,
      revealCandidates: [],
    });
    const fullPrompt = `${packet.system}\n${packet.prompt}`;

    expect(packet.prompt).toContain("<member_briefs>");
    expect(packet.prompt).toContain("Private scoring context only.");
    expect(packet.prompt).toContain(
      "memberMoodDeltas must include exactly these member ids: jenna-pike, vhool.",
    );
    expect(packet.prompt).toContain(
      "Each memberMoodDelta describes that specific member's visible affect, scored independently.",
    );
    expect(packet.prompt).toContain(
      "One member can be warmed while the other is guarded; the two scores can diverge.",
    );
    expect(packet.prompt).toContain("- jenna-pike (Jenna Pike)");
    expect(packet.prompt).toContain(
      "identity: Human; Ordinary, pending review; origin: East Rainfield, Ohio; dimension: Prime adjacent.",
    );
    expect(packet.prompt).toContain("wants: A date that feels normal by human standards");
    expect(packet.prompt).toContain("guarded around: cruelty; being recruited");
    expect(packet.prompt).toContain("current pressure: mood steady, openness open, burnout low");
    expect(packet.prompt).toContain("- vhool (Vhool)");
    expect(fullPrompt).not.toContain(jenna.secrets[0]);
    expect(fullPrompt).not.toContain(vhool.secrets[0]);
    expect(fullPrompt).not.toContain("mood 68");
    expect(fullPrompt).not.toContain("openness 72");
    expect(fullPrompt).not.toContain("burnout 38");
    expect(fullPrompt).not.toContain("retention 100");
  });

  it("does not contain raw member tag enum names or rule hit strings", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find((candidate) => candidate.id === "prophecy-karaoke");
    const opal = save.members.find((member) => member.id === "opal-sunday");
    const bai = save.members.find((member) => member.id === "bai-wenshu");
    const pairState = getPairProjectionFromSave(save, makePairId("opal-sunday", "bai-wenshu"));

    if (
      scenario === undefined ||
      opal === undefined ||
      bai === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected fixture setup.");
    }

    const members = [opal, bai];
    const matchFit = evaluateMatchFit({
      members,
      scenario,
      pairState,
    });
    const candidates = buildRevealCandidates({
      members,
      scenario,
      pairState,
      matchFit,
    });
    const session = {
      id: "test-session",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 30,
      currentTurn: 0,
      dateHealth: 60,
      status: "active" as const,
      runtimeMode: "local_ai" as const,
      participants: pairState.participantIds,
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing" as const,
      endSentiment: null,
      interventions: [],
    };
    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages: [],
      members,
      revealCandidates: candidates,
    });
    const fullPrompt = `${packet.system}\n${packet.prompt}`;

    expect(fullPrompt).not.toMatch(/prophecy_averse/);
    expect(fullPrompt).not.toMatch(/privacy_sensitive/);
    expect(fullPrompt).not.toMatch(/grief_sensitive/);
    expect(fullPrompt).not.toMatch(/memory_sensitive/);
    expect(fullPrompt).not.toMatch(/sincerity_vs_performance/);
  });

  it("instructs an empty array when no candidates are eligible", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = save.members.find((member) => member.id === "jenna-pike");
    const vhool = save.members.find((member) => member.id === "vhool");
    const pairState = getPairProjectionFromSave(save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected fixture setup.");
    }

    const members = [jenna, vhool];
    const session = {
      id: "test-session",
      pairId: pairState.id,
      scenarioId: scenario.id,
      turnLimit: 30,
      currentTurn: 0,
      dateHealth: 60,
      status: "active" as const,
      runtimeMode: "local_ai" as const,
      participants: pairState.participantIds,
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing" as const,
      endSentiment: null,
      interventions: [],
    };
    const packet = buildJudgePromptPacket({
      scenario,
      session,
      pairState,
      exchangeMessages: [],
      members,
      revealCandidates: [],
    });

    expect(packet.prompt).toContain("<reveal_candidates>");
    expect(packet.prompt).toContain("None for this exchange. Return usedEvidenceIds as [].");
  });
});

describe("Cupid corporate copy check", () => {
  it("accepts concrete operational notes", () => {
    expect(checkCupidCorporateCopy("Cupid filed the receipt. Trust is up.").ok).toBe(true);
    expect(checkCupidCorporateCopy("Coffee escalated. Jenna held the room. Spark filed.").ok).toBe(
      true,
    );
  });

  it("rejects banned AI slop verbs and consulting jargon", () => {
    const slop = checkCupidCorporateCopy("Cupid helped the pair leverage their synergies.");
    expect(slop.ok).toBe(false);
    if (slop.ok === false) {
      expect(slop.reason).toBe("banned_phrase");
    }

    const navigate = checkCupidCorporateCopy("The pair navigated their differences with grace.");
    expect(navigate.ok).toBe(false);
  });

  it("rejects therapy-speak generic compatibility phrasing", () => {
    const generic = checkCupidCorporateCopy("Jenna and Vhool found common ground over coffee.");
    expect(generic.ok).toBe(false);
    if (generic.ok === false) {
      expect(generic.reason).toBe("generic_phrase");
    }

    const opened = checkCupidCorporateCopy("Jenna and Vhool opened up to each other over coffee.");
    expect(opened.ok).toBe(false);
    if (opened.ok === false) {
      expect(opened.reason).toBe("generic_phrase");
    }
  });

  it("rejects empty or overlong copy", () => {
    expect(checkCupidCorporateCopy("   ").ok).toBe(false);

    const long = checkCupidCorporateCopy("x".repeat(400), { maxLength: 100 });
    expect(long.ok).toBe(false);
    if (long.ok === false) {
      expect(long.reason).toBe("too_long");
    }
  });
});

describe("character prompt repetition guard", () => {
  it("includes the speaker's last lines and the partner's last lines", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = save.members.find((member) => member.id === "jenna-pike");
    const vhool = save.members.find((member) => member.id === "vhool");
    const pairState = getPairProjectionFromSave(save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const baseSession = {
      id: "date-session-repeat-guard",
      pairId: pairState.id,
      scenarioId: scenario.id,
      focusMemberId: jenna.id,
      turnLimit: 30,
      currentTurn: 4,
      dateHealth: 65,
      status: "active" as const,
      runtimeMode: "local_ai" as const,
      participants: pairState.participantIds,
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing" as const,
      endSentiment: null,
      interventions: [],
    };
    const transcript = [
      {
        id: "msg-jenna-1",
        dateSessionId: baseSession.id,
        kind: "character" as const,
        speakerId: jenna.id,
        turnIndex: 1,
        sequenceIndex: 1,
        text: "Jenna brought up the lemon tart at the back booth.",
        createdAt: "2026-05-05T12:01:00.000Z",
      },
      {
        id: "msg-vhool-1",
        dateSessionId: baseSession.id,
        kind: "character" as const,
        speakerId: vhool.id,
        turnIndex: 2,
        sequenceIndex: 2,
        text: "Vhool counted the brass receipts on the saucer.",
        createdAt: "2026-05-05T12:01:30.000Z",
      },
      {
        id: "msg-jenna-2",
        dateSessionId: baseSession.id,
        kind: "character" as const,
        speakerId: jenna.id,
        turnIndex: 3,
        sequenceIndex: 3,
        text: "Jenna mentioned the rain pinging the window.",
        createdAt: "2026-05-05T12:02:00.000Z",
      },
      {
        id: "msg-vhool-2",
        dateSessionId: baseSession.id,
        kind: "character" as const,
        speakerId: vhool.id,
        turnIndex: 4,
        sequenceIndex: 4,
        text: "Vhool offered to share the saucer with the receipts.",
        createdAt: "2026-05-05T12:02:30.000Z",
      },
    ];
    const session = {
      ...baseSession,
      transcript,
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
        recentTranscript: transcript,
      },
    });

    expect(packet.prompt).toContain("<recent>");
    expect(packet.prompt).toContain("Your last lines. Do not repeat or lightly reword them:");
    expect(packet.prompt).toContain("Jenna brought up the lemon tart at the back booth.");
    expect(packet.prompt).toContain("Jenna mentioned the rain pinging the window.");
    expect(packet.prompt).toContain("Vhool's last lines. Do not echo verbatim:");
    expect(packet.prompt).toContain("Vhool counted the brass receipts on the saucer.");
    expect(packet.prompt).toContain("Vhool offered to share the saucer with the receipts.");
    expect(packet.prompt).not.toContain("<retry_guard>");
  });

  it("adds a retry guard block when repetition feedback is supplied", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = save.members.find((member) => member.id === "jenna-pike");
    const vhool = save.members.find((member) => member.id === "vhool");
    const pairState = getPairProjectionFromSave(save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const repeatedLine = "Jenna keeps circling the same pizza place.";
    const session = {
      id: "date-session-retry",
      pairId: pairState.id,
      scenarioId: scenario.id,
      focusMemberId: jenna.id,
      turnLimit: 30,
      currentTurn: 1,
      dateHealth: 65,
      status: "active" as const,
      runtimeMode: "local_ai" as const,
      participants: pairState.participantIds,
      transcript: [],
      privateStateByCharacter: {},
      judgeSnapshots: [],
      eventDraft: { offered: [], picked: null },
      eventsTriggered: [],
      playbackState: "playing" as const,
      endSentiment: null,
      interventions: [],
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
        recentTranscript: [],
      },
      repetitionRetry: { repeatedLine },
    });

    expect(packet.prompt).toContain("<retry_guard>");
    expect(packet.prompt).toContain(repeatedLine);
    expect(packet.prompt).toContain("Make a different conversational move.");
  });

  it("adds a visibility retry guard after an empty performer line", () => {
    const packet = withCharacterVisibilityRetryGuard({
      system: "Act as Jenna Pike.",
      prompt: "Latest incoming line to answer: The soup blinked.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Latest incoming line: The soup blinked.",
            },
          ],
        },
      ],
    });
    const finalMessage = packet.messages?.at(-1);

    expect(packet.system).toBe("Act as Jenna Pike.");
    expect(packet.prompt).toContain("previous attempt produced no usable spoken line");
    expect(packet.prompt).toContain(
      "Do not narrate an action, gesture, facial expression, or object movement.",
    );
    expect(packet.prompt).toContain("Write exactly one complete spoken reply now.");
    expect(packet.prompt).toContain("No setup text, labels, notes, analysis, or empty response.");
    expect(finalMessage?.role).toBe("user");

    if (!Array.isArray(finalMessage?.content)) {
      throw new Error("Expected retry guard to stay inside structured user message.");
    }

    const textPart = finalMessage.content.find((part) => part.type === "text");
    expect(textPart?.type === "text" ? textPart.text : "").toContain(
      "previous attempt produced no usable spoken line",
    );
  });

  it("adds a rhythm retry guard after a repeated approval phrase", () => {
    const save = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const scenario = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const jenna = save.members.find((member) => member.id === "jenna-pike");
    const vhool = save.members.find((member) => member.id === "vhool");
    const pairState = getPairProjectionFromSave(save, makePairId("jenna-pike", "vhool"));

    if (
      scenario === undefined ||
      jenna === undefined ||
      vhool === undefined ||
      pairState === undefined
    ) {
      throw new Error("Expected prompt fixture setup.");
    }

    const packet = buildCharacterPromptPacket({
      member: jenna,
      partner: vhool,
      scenario,
      session: {
        id: "date-session-rhythm-retry",
        pairId: pairState.id,
        scenarioId: scenario.id,
        focusMemberId: jenna.id,
        turnLimit: 30,
        currentTurn: 2,
        dateHealth: 65,
        status: "active",
        runtimeMode: "local_ai",
        participants: pairState.participantIds,
        transcript: [],
        privateStateByCharacter: {},
        judgeSnapshots: [],
        eventDraft: { offered: [], picked: null },
        eventsTriggered: [],
        playbackState: "playing",
        endSentiment: null,
        interventions: [],
      },
      pairState,
      memoryPack: {
        self: [],
        pair: [],
        scenario: [],
        recentTranscript: [],
      },
      rhythmRetry: {
        repeatedPhrase: "I respect",
        recentLine: "i respect the soup planning, honestly.",
      },
    });

    expect(packet.prompt).toContain("<retry_guard>");
    expect(packet.prompt).toContain('reused the approval phrase "I respect"');
    expect(packet.prompt).toContain("Rewrite with a different sentence shape");
  });

  it("detects near duplicate lines via Jaccard overlap", () => {
    const match = hasNearDuplicateRecentLine({
      text: "Jenna keeps circling the same pizza place again across the street with the neon sign.",
      recentLines: ["Jenna circled the same pizza place across the street with the new neon sign."],
    });

    expect(match).not.toBeNull();
    if (match !== null) {
      expect(match.repeatedLine).toContain("pizza place");
    }
  });

  it("does not flag a short prompt against a different short prompt", () => {
    const match = hasNearDuplicateRecentLine({
      text: "line 3 response",
      recentLines: ["line 1 response"],
    });

    expect(match).toBeNull();
  });
});

describe("scenario event kind suffixes", () => {
  const expectedSuffixes: Record<ScenarioEventKind, string> = {
    ambient: "Treat this as ambient texture",
    provocation: "This is a physical interruption",
    reveal: "This puts something honest into the open",
  };

  it.each(Object.entries(expectedSuffixes))(
    "returns the documented suffix for kind %s",
    (kind, fragment) => {
      expect(SCENARIO_EVENT_KIND_SUFFIXES[kind as ScenarioEventKind]).toContain(fragment);
    },
  );

  it("appends the suffix without trailing punctuation creating doubles", () => {
    const formatted = formatDirectorInstructionWithKindSuffix(
      "Push for a clean answer",
      "provocation",
    );

    expect(formatted.startsWith("Push for a clean answer.")).toBe(true);
    expect(formatted).toContain("This is a physical interruption.");
  });

  it("does not mutate director instructions that already end with punctuation", () => {
    const original = "Push for a clean answer.";
    const formatted = formatDirectorInstructionWithKindSuffix(original, "provocation");

    expect(formatted).toContain("Push for a clean answer. ");
    expect(formatted.split(".. ").length).toBe(1);
  });

  it("does not mutate the underlying scenario fixture when triggered", () => {
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

    if (eventId === undefined || scenario === undefined) {
      throw new Error("Expected fixture setup for kind suffix non-mutation test.");
    }

    const event = scenario.director.events.find((candidate) => candidate.id === eventId);

    if (event === undefined) {
      throw new Error("Expected drafted event to exist on the fixture.");
    }

    const originalInstruction = event.directorInstruction;
    const triggered = triggerScenarioEvent(started.save, {
      dateSessionId: started.session.id,
      eventId,
      now: new Date("2026-05-05T12:02:00.000Z"),
    });

    const refreshed = starterScenarios.find((candidate) => candidate.id === "temporal-coffee-shop");
    const refreshedEvent = refreshed?.director.events.find((candidate) => candidate.id === eventId);

    expect(refreshedEvent?.directorInstruction).toBe(originalInstruction);

    const sessionFromSave = triggered.save.dateSessions.find(
      (candidate) => candidate.id === started.session.id,
    );

    expect(sessionFromSave?.eventsTriggered).toContain(eventId);
  });
});
