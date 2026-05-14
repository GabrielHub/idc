import { describe, expect, it } from "vitest";

import type { CharacterPromptPacket } from "../date-prompts";
import {
  DEFAULT_DATE_PLAYGROUND_SETTINGS,
  DEFAULT_FEATURE_BENCH_SETTINGS,
  DEFAULT_MEMBER_CHAT_SETTINGS,
  runPlaygroundFeatureBench,
  runPlaygroundDateConversation,
  runPlaygroundMemberChat,
  type DatePlaygroundGenerationRuntime,
  type DatePlaygroundInput,
  type FeatureBenchGenerationRuntime,
  type FeatureBenchPlaygroundInput,
  type MemberChatGenerationRuntime,
  type MemberChatPlaygroundInput,
} from "./playground";
import type { AiGenerationOptions, AiRuntimeConfig, GeneratedTextResult } from "./model-service";
import { SAVE_SCHEMA_VERSION } from "../../domain/game";
import { PLAYGROUND_SEED_PACKS } from "./playground-seeds";

type DatePlaygroundRuntimeInput = Parameters<
  DatePlaygroundGenerationRuntime["generateCharacterTurn"]
>[0];
type MemberChatRuntimeInput = Parameters<MemberChatGenerationRuntime["generateCharacterTurn"]>[0];
type FeatureBenchRuntimeInput = Parameters<
  FeatureBenchGenerationRuntime["generateCharacterTurn"]
>[0];

class QueuedDatePlaygroundRuntime implements DatePlaygroundGenerationRuntime {
  readonly calls: DatePlaygroundRuntimeInput[] = [];

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

class QueuedFeatureBenchRuntime implements FeatureBenchGenerationRuntime {
  readonly calls: FeatureBenchRuntimeInput[] = [];

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

function dateSettings(overrides: Partial<DatePlaygroundInput> = {}): DatePlaygroundInput {
  return {
    ...DEFAULT_DATE_PLAYGROUND_SETTINGS,
    provider: "ollama",
    model: "fake-date-chat",
    transcriptText: "",
    turnCount: 1,
    maxOutputTokens: 160,
    ...overrides,
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

function featureBenchSettings(
  overrides: Partial<FeatureBenchPlaygroundInput> = {},
): FeatureBenchPlaygroundInput {
  return {
    ...DEFAULT_FEATURE_BENCH_SETTINGS,
    provider: "ollama",
    model: "fake-feature-bench",
    ...overrides,
  };
}

describe("date conversation playground retry pipeline", () => {
  it("retries an empty date line with a visible reply guard", async () => {
    const recoveredLine = "I can work with polite inventory if the cup stops reversing.";
    const runtime = new QueuedDatePlaygroundRuntime(["", recoveredLine]);

    const result = await runPlaygroundDateConversation(dateSettings(), runtime);

    expect(result.turns).toEqual([
      {
        speakerId: "jenna-pike",
        speakerName: "Jenna Pike",
        text: recoveredLine,
      },
    ]);
    expect(runtime.calls).toHaveLength(2);
    expect(runtime.calls[1]?.packet.prompt).toContain("no usable spoken line");
    expect(runtime.calls[1]?.options?.maxOutputTokens).toBe(512);
    expect(result.prompt).toContain("no usable spoken line");
  });
});

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

describe("feature bench playground", () => {
  const authoredFeatureSeedIds = [
    "anansi-mei-story-craft",
    "imani-sienna-bright-booth",
    "nawal-maeve-closed-questions",
  ];

  it("keeps curated seeds on the active save schema", () => {
    expect(PLAYGROUND_SEED_PACKS.length).toBeGreaterThan(0);
    for (const seed of PLAYGROUND_SEED_PACKS) {
      expect(seed.saveSchemaVersion).toBe(SAVE_SCHEMA_VERSION);
      expect(seed.seedSchemaVersion).toBe(1);
      expect(seed.memberId).not.toBe(seed.partnerId);
      expect(seed.transcriptText.length).toBeGreaterThan(20);
    }
  });

  it("keeps authored feature seeds explicit and focused", () => {
    const authoredSeeds = PLAYGROUND_SEED_PACKS.filter(
      (seed) => (seed.expected.matchRuleHits ?? []).length > 0,
    );

    expect(authoredSeeds.map((seed) => seed.id)).toEqual(authoredFeatureSeedIds);
    for (const seed of authoredSeeds) {
      expect(seed.expected.agreements).toHaveLength(1);
      expect(seed.expected.openLoops).toHaveLength(1);
      expect(seed.expected.matchRuleHits?.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps authored match-fit rules wired into feature seed previews", async () => {
    const authoredSeeds = PLAYGROUND_SEED_PACKS.filter((seed) =>
      authoredFeatureSeedIds.includes(seed.id),
    );

    for (const seed of authoredSeeds) {
      const result = await runPlaygroundFeatureBench(
        featureBenchSettings({
          action: "preview",
          mode: "judgeBench",
          seedId: seed.id,
        }),
        new QueuedFeatureBenchRuntime([]),
      );
      const ruleHits = result.matchFit?.internalRuleHits ?? [];

      for (const expectedRuleHit of seed.expected.matchRuleHits ?? []) {
        expect(ruleHits).toContain(expectedRuleHit);
      }
      for (const agreement of seed.expected.agreements) {
        expect(result.prompt).toContain(agreement);
      }
      for (const openLoop of seed.expected.openLoops) {
        expect(result.prompt).toContain(openLoop);
      }
    }
  });

  it.each([
    { mode: "extractorBench" as const, expected: "agreementCandidates" },
    { mode: "judgeBench" as const, expected: "openLoopUpdates" },
    { mode: "followUpBench" as const, expected: "Computed preview" },
  ])("previews the $mode seed prompt", async ({ mode, expected }) => {
    const firstSeed = PLAYGROUND_SEED_PACKS[0];

    if (firstSeed === undefined) {
      throw new Error("Expected at least one playground seed.");
    }

    const result = await runPlaygroundFeatureBench(
      featureBenchSettings({
        action: "preview",
        mode,
        seedId: firstSeed.id,
      }),
      new QueuedFeatureBenchRuntime([]),
    );

    expect(result.mode).toBe(mode);
    expect(result.seed?.saveSchemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(`${result.system}\n${result.prompt}`).toContain(expected);
    expect(`${result.system}\n${result.prompt}`).toContain("No filming at the table");
  });

  it("runs a feature bench through the model runtime", async () => {
    const runtime = new QueuedFeatureBenchRuntime([
      '{"agreementCandidates":[{"text":"No filming at the table."}],"openLoopCandidates":[],"notes":[]}',
    ]);
    const result = await runPlaygroundFeatureBench(featureBenchSettings(), runtime);

    expect(runtime.calls).toHaveLength(1);
    expect(result.text).toContain("agreementCandidates");
    expect(result.turns[0]?.speakerName).toBe("Extractor Bench");
  });
});
