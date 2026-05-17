import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GeneratedTextResult } from "./ai/model-service";

const modelServiceMocks = vi.hoisted(() => ({
  generateCharacterTurn: vi.fn(),
}));

vi.mock("./ai/model-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ai/model-service")>();
  return {
    ...actual,
    generateCharacterTurn: modelServiceMocks.generateCharacterTurn,
  };
});

import {
  appendCupidNote,
  appendDirectorEvent,
  dropLastFocusMemberReply,
  appendPartnerLine,
  createTuneSession,
  DEFAULT_TUNE_PARTNER_ID,
  DEFAULT_TUNE_SCENARIO_ID,
  formatTranscriptForReading,
  generateFocusMemberReply,
  previewMemberTurnPacket,
} from "./tune-member";

const SAMPLE_FOCUS_ID = "cassie-conners";
const SAMPLE_PARTNER_ID = "alex-yoon";
const SAMPLE_SCENARIO_ID = "diner-eleven-pm";

function generatedText(text: string): GeneratedTextResult {
  return {
    text,
    providerMode: "ollama",
    model: "fake-tune-model",
    stepCount: 1,
    toolCallCount: 0,
    toolResultCount: 0,
  };
}

function newSession(overrides?: Partial<{ scenarioId: string; partnerMemberId: string }>) {
  return createTuneSession({
    focusMemberId: SAMPLE_FOCUS_ID,
    partnerMemberId: overrides?.partnerMemberId ?? SAMPLE_PARTNER_ID,
    scenarioId: overrides?.scenarioId ?? SAMPLE_SCENARIO_ID,
    now: new Date("2026-05-16T12:00:00Z"),
  });
}

beforeEach(() => {
  modelServiceMocks.generateCharacterTurn.mockReset();
});

describe("createTuneSession", () => {
  it("returns a session with defaults applied", () => {
    const session = createTuneSession({
      focusMemberId: SAMPLE_FOCUS_ID,
      now: new Date("2026-05-16T12:00:00Z"),
    });
    expect(session.focusMemberId).toBe(SAMPLE_FOCUS_ID);
    expect(session.partnerMemberId).toBe(DEFAULT_TUNE_PARTNER_ID);
    expect(session.scenarioId).toBe(DEFAULT_TUNE_SCENARIO_ID);
    expect(session.openerSide).toBe("partner");
    expect(session.messages).toEqual([]);
    expect(session.schemaVersion).toBe(1);
  });

  it("rejects an unknown member id", () => {
    expect(() => createTuneSession({ focusMemberId: "nobody" })).toThrow(/Unknown focus/);
  });

  it("rejects the same member on both sides", () => {
    expect(() =>
      createTuneSession({ focusMemberId: SAMPLE_FOCUS_ID, partnerMemberId: SAMPLE_FOCUS_ID }),
    ).toThrow(/cannot be the same/);
  });

  it("rejects an unknown scenario id", () => {
    expect(() =>
      createTuneSession({ focusMemberId: SAMPLE_FOCUS_ID, scenarioId: "made-up-place" }),
    ).toThrow(/Unknown scenario/);
  });
});

describe("transcript builders", () => {
  it("appends a partner line as a character message", () => {
    const session = newSession();
    const next = appendPartnerLine(session, "  hey, you actually came  ");
    expect(next.messages).toHaveLength(1);
    const message = next.messages[0];
    expect(message.kind).toBe("character");
    if (message.kind === "character") {
      expect(message.speakerId).toBe(SAMPLE_PARTNER_ID);
      expect(message.text).toBe("hey, you actually came");
    }
  });

  it("rejects empty partner text", () => {
    const session = newSession();
    expect(() => appendPartnerLine(session, "   ")).toThrow(/cannot be empty/);
  });

  it("rejects two consecutive partner lines", () => {
    const session = appendPartnerLine(newSession(), "hey there");
    expect(() => appendPartnerLine(session, "one more thing")).toThrow(/consecutive turns/);
  });

  it("appends a director event as a scenario message", () => {
    const session = newSession();
    const next = appendDirectorEvent(session, "waiter drops a glass behind us");
    expect(next.messages[0].kind).toBe("scenario");
    if (next.messages[0].kind === "scenario") {
      expect(next.messages[0].text).toBe("waiter drops a glass behind us");
    }
  });

  it("appends a cupid note targeting the focus member", () => {
    const session = newSession();
    const next = appendCupidNote(session, "ask about her job");
    expect(next.messages[0].kind).toBe("cupid");
    if (next.messages[0].kind === "cupid") {
      expect(next.messages[0].targetMemberId).toBe(SAMPLE_FOCUS_ID);
      expect(next.messages[0].text).toBe("ask about her job");
    }
  });

  it("rejects a cupid note longer than the schema allows", () => {
    const session = newSession();
    const tooLong = "x".repeat(241);
    expect(() => appendCupidNote(session, tooLong)).toThrow(/characters or fewer/);
  });
});

describe("dropLastFocusMemberReply", () => {
  it("removes the last generated focus reply so fixture edits can be retried", () => {
    const session = newSession();
    const withPartner = appendPartnerLine(session, "hey there");
    const withFocusReply = {
      ...withPartner,
      lastPromptSystem: "previous system prompt",
      messages: [
        ...withPartner.messages,
        {
          kind: "character" as const,
          speakerId: SAMPLE_FOCUS_ID,
          text: "I brought a spreadsheet and a defensive pastry.",
          createdAt: "2026-05-16T12:01:00.000Z",
        },
      ],
    };

    const next = dropLastFocusMemberReply(withFocusReply);

    expect(next.messages).toEqual(withPartner.messages);
    expect(next.lastPromptSystem).toBeUndefined();
  });

  it("rejects retry when the latest message is still the partner", () => {
    const session = appendPartnerLine(newSession(), "hey there");
    expect(() => dropLastFocusMemberReply(session)).toThrow(/not a focus member reply/);
  });
});

describe("generateFocusMemberReply", () => {
  it("rejects two consecutive focus replies before calling the model", async () => {
    const session = {
      ...newSession(),
      messages: [
        {
          kind: "character" as const,
          speakerId: SAMPLE_PARTNER_ID,
          text: "hey there",
          createdAt: "2026-05-16T12:01:00.000Z",
        },
        {
          kind: "character" as const,
          speakerId: SAMPLE_FOCUS_ID,
          text: "I am already talking.",
          createdAt: "2026-05-16T12:02:00.000Z",
        },
      ],
    };

    await expect(generateFocusMemberReply(session)).rejects.toThrow(/consecutive turns/);
  });

  it("retries an empty focus reply with the visibility guard", async () => {
    modelServiceMocks.generateCharacterTurn
      .mockResolvedValueOnce(generatedText("smiles."))
      .mockResolvedValueOnce(generatedText("i can answer that without narrating the chair."));
    const session = appendPartnerLine(newSession(), "hey there");

    const result = await generateFocusMemberReply(session, {
      now: new Date("2026-05-16T12:02:00.000Z"),
    });

    expect(modelServiceMocks.generateCharacterTurn).toHaveBeenCalledTimes(2);
    const secondCall = modelServiceMocks.generateCharacterTurn.mock.calls[1]?.[0];
    expect(secondCall?.packet.prompt).toContain("previous attempt produced no usable spoken line");
    expect(result.replyText).toBe("i can answer that without narrating the chair.");
    expect(result.retried).toBe(true);
    expect(result.retryReason).toBe("visibility");
  });
});

describe("previewMemberTurnPacket", () => {
  it("builds a packet that addresses the focus member by name", () => {
    const session = newSession();
    const opened = appendPartnerLine(session, "hey, how was your day");
    const preview = previewMemberTurnPacket(opened);

    expect(preview.focusMember.id).toBe(SAMPLE_FOCUS_ID);
    expect(preview.partnerMember.id).toBe(SAMPLE_PARTNER_ID);
    expect(preview.scenario.id).toBe(SAMPLE_SCENARIO_ID);
    expect(preview.dateSession.currentTurn).toBe(1);

    expect(preview.packet.system).toContain(preview.focusMember.firstName);
    expect(preview.packet.system).toContain(preview.partnerMember.firstName);
    expect(preview.packet.system).toContain(preview.scenario.publicBrief.location);
  });

  it("threads a cupid note into the prompt as a private coaching note", () => {
    const session = newSession();
    const withPartner = appendPartnerLine(session, "what do you usually order");
    const nudge = "redirect to her, you're talking about yourself too much";
    const withNudge = appendCupidNote(withPartner, nudge);
    const preview = previewMemberTurnPacket(withNudge);

    expect(preview.dateSession.interventions).toHaveLength(1);
    expect(preview.dateSession.interventions[0].text).toBe(nudge);
    expect(preview.packet.prompt).toContain(nudge);
  });

  it("expires a cupid note after the focus member answers it", () => {
    const session = newSession();
    const withPartner = appendPartnerLine(session, "what do you usually order");
    const nudge = "redirect to her, you are talking about yourself too much";
    const withNudge = appendCupidNote(withPartner, nudge);
    const withFocusReply = {
      ...withNudge,
      messages: [
        ...withNudge.messages,
        {
          kind: "character" as const,
          speakerId: SAMPLE_FOCUS_ID,
          text: "probably pancakes. what about you?",
          createdAt: "2026-05-16T12:01:30.000Z",
        },
      ],
    };
    const withNextPartner = appendPartnerLine(
      withFocusReply,
      "coffee, usually. i panic-order it.",
      new Date("2026-05-16T12:02:00.000Z"),
    );
    const preview = previewMemberTurnPacket(withNextPartner);

    expect(preview.dateSession.interventions[0]?.usedAtTurn).toBe(1);
    expect(preview.packet.prompt).not.toContain(nudge);
  });

  it("threads a director event as a scenario beat the member sees", () => {
    const session = newSession();
    const withPartner = appendPartnerLine(session, "wait, your phone's ringing");
    const eventText = "phone buzzes loudly on the table";
    const withEvent = appendDirectorEvent(withPartner, eventText);
    const preview = previewMemberTurnPacket(withEvent);

    expect(preview.packet.prompt).toContain(eventText);
  });

  it("treats the partner as a first-time match by default", () => {
    const session = newSession();
    const preview = previewMemberTurnPacket(session);
    expect(preview.dateSession.participants).toContain(SAMPLE_FOCUS_ID);
    expect(preview.dateSession.participants).toContain(SAMPLE_PARTNER_ID);
    expect(preview.pairState.completedDateIds).toEqual([]);
    expect(preview.packet.system).toContain("first");
  });
});

describe("formatTranscriptForReading", () => {
  it("labels speakers and event kinds clearly", () => {
    const session = appendCupidNote(
      appendDirectorEvent(appendPartnerLine(newSession(), "hey there"), "phone buzzes"),
      "ask about her week",
    );
    const text = formatTranscriptForReading(session, {
      focusName: "Cassie",
      partnerName: "Alex",
    });
    expect(text).toContain("Alex (you): hey there");
    expect(text).toContain("[event] phone buzzes");
    expect(text).toContain("[cupid to Cassie] ask about her week");
  });

  it("returns a placeholder when empty", () => {
    const text = formatTranscriptForReading(newSession(), {
      focusName: "Cassie",
      partnerName: "Alex",
    });
    expect(text).toBe("(no messages yet)");
  });
});
