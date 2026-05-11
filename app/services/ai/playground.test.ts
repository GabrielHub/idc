import { describe, expect, it } from "vitest";

import type { CharacterPromptPacket } from "../date-prompts";
import {
  DEFAULT_MEMBER_CHAT_SETTINGS,
  runPlaygroundMemberChat,
  type MemberChatGenerationRuntime,
  type MemberChatPlaygroundInput,
} from "./playground";
import type { AiGenerationOptions, AiRuntimeConfig, GeneratedTextResult } from "./model-service";

type MemberChatRuntimeInput = Parameters<MemberChatGenerationRuntime["generateCharacterTurn"]>[0];

class QueuedMemberChatRuntime implements MemberChatGenerationRuntime {
  readonly calls: MemberChatRuntimeInput[] = [];

  constructor(private readonly replies: readonly string[]) {}

  async generateCharacterTurn(input: {
    packet: CharacterPromptPacket;
    config?: Partial<AiRuntimeConfig>;
    options?: AiGenerationOptions;
  }): Promise<GeneratedTextResult> {
    this.calls.push(input);
    const text = this.replies[this.calls.length - 1] ?? "";

    return generatedText(text);
  }
}

function generatedText(text: string): GeneratedTextResult {
  return {
    text,
    providerMode: "ollama",
    model: "fake-member-chat",
    stepCount: 1,
    toolCallCount: 0,
    toolResultCount: 0,
  };
}

function memberChatSettings(
  overrides: Partial<MemberChatPlaygroundInput> = {},
): MemberChatPlaygroundInput {
  return {
    ...DEFAULT_MEMBER_CHAT_SETTINGS,
    provider: "ollama",
    model: "fake-member-chat",
    testerMessage: "What would make a date feel normal enough to trust?",
    ...overrides,
  };
}

describe("member chat playground retry pipeline", () => {
  const cleanReply = "Normal works if the table is quiet and nobody makes the soup political.";

  const retryCases: ReadonlyArray<{
    name: string;
    firstReply: string;
    retryReason: string;
  }> = [
    {
      name: "empty",
      firstReply: "Jenna Pike:",
      retryReason: "no visible chat message",
    },
    {
      name: "clipped",
      firstReply: "I could trust a plan if it had chairs...",
      retryReason: "cut off",
    },
    {
      name: "fragmentary",
      firstReply: "I could trust that if",
      retryReason: "fragment",
    },
    {
      name: "presentation markup",
      firstReply: "<p>I can do Thursday if the soup keeps its opinions private.</p>",
      retryReason: "markup",
    },
    {
      name: "role label",
      firstReply: "Jenna: I can do Thursday if the soup keeps its opinions private.",
      retryReason: "markup",
    },
  ];

  for (const retryCase of retryCases) {
    it(`recovers from ${retryCase.name} replies on retry`, async () => {
      const runtime = new QueuedMemberChatRuntime([retryCase.firstReply, cleanReply]);

      const result = await runPlaygroundMemberChat(memberChatSettings(), runtime);

      expect(result.text).toBe(cleanReply);
      expect(result.chatMessages).toEqual([
        {
          role: "tester",
          text: "What would make a date feel normal enough to trust?",
        },
        {
          role: "member",
          text: cleanReply,
        },
      ]);
      expect(runtime.calls).toHaveLength(2);
      expect(runtime.calls[1]?.packet.prompt).toContain(retryCase.retryReason);
      expect(runtime.calls[1]?.packet.prompt).toContain("Rewrite the reply as plain chat.");
    });
  }

  it("falls back after final retry also fails inspection", async () => {
    const runtime = new QueuedMemberChatRuntime(["Jenna Pike:", "[waves]", "I can answer if"]);

    const result = await runPlaygroundMemberChat(memberChatSettings(), runtime);

    expect(result.text).toBe(
      "A clear time, a quiet table, and no surprise audience. I can work with that.",
    );
    expect(runtime.calls).toHaveLength(3);
    expect(runtime.calls[2]?.packet.prompt).toContain("Final retry.");
    expect(runtime.calls[2]?.options?.temperature).toBe(0.4);
    expect(runtime.calls[2]?.options?.maxOutputTokens).toBe(96);
  });

  it("keeps the member chat prompt out of old QA framing", async () => {
    const result = await runPlaygroundMemberChat(
      memberChatSettings({ action: "preview" }),
      new QueuedMemberChatRuntime([]),
    );
    const previewText = `${result.system}\n${result.prompt}`;

    expect(previewText).toContain("Cupid is routing a private chat before a date.");
    expect(previewText).not.toMatch(/\b(QA|tester|playground|simulator|simulation|transcript)\b/i);
  });
});
