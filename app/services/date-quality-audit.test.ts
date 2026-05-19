import { describe, expect, it } from "vitest";

import {
  dateMessageSchema,
  judgeSnapshotSchema,
  memberSchema,
  type DateMessage,
  type DateScenario,
  type JudgeSnapshot,
  type Member,
} from "../domain/game";
import { starterMembers, starterScenarios } from "../fixtures";
import {
  detectJudgeFindings,
  detectTranscriptFindings,
  formatAuditReportAsMarkdown,
  type AuditFinding,
  type AuditRunReport,
} from "./date-quality-audit";
import {
  buildAuditCases,
  buildAuditCasesByIds,
  listKnownPairIds,
} from "./date-quality-audit-cases";
import { extractDistinctiveTriGram } from "./hidden-info-guard";

const SCENARIO = requireScenario("temporal-coffee-shop");
const JENNA = requireMember("jenna-pike");
const VHOOL = requireMember("vhool");

const BASE_TIMESTAMP = "2026-05-15T12:00:00.000Z";

function requireScenario(id: string): DateScenario {
  const scenario = starterScenarios.find((entry) => entry.id === id);
  if (scenario === undefined) throw new Error(`missing scenario ${id}`);
  return scenario;
}

function requireMember(id: string): Member {
  const member = starterMembers.find((entry) => entry.id === id);
  if (member === undefined) throw new Error(`missing member ${id}`);
  return memberSchema.parse(member);
}

type MessageInput = {
  speaker: Member;
  text: string;
  turnIndex: number;
  sequenceIndex: number;
};

function makeMessage(input: MessageInput): DateMessage {
  return dateMessageSchema.parse({
    id: `audit-test-${input.sequenceIndex}`,
    dateSessionId: "audit-test-session",
    kind: "character",
    speakerId: input.speaker.id,
    turnIndex: input.turnIndex,
    sequenceIndex: input.sequenceIndex,
    text: input.text,
    createdAt: BASE_TIMESTAMP,
  });
}

function buildTranscript(
  entries: ReadonlyArray<Omit<MessageInput, "sequenceIndex">>,
): DateMessage[] {
  return entries.map((entry, index) => makeMessage({ ...entry, sequenceIndex: index }));
}

function runDetectors(transcript: DateMessage[]): AuditFinding[] {
  return detectTranscriptFindings({
    transcript,
    scenario: SCENARIO,
    focusMember: JENNA,
    partnerMember: VHOOL,
  });
}

function makeJudge(input: {
  exchangeIndex: number;
  playerSummary: string;
  notableMoments?: string[];
}): JudgeSnapshot {
  return judgeSnapshotSchema.parse({
    id: `judge-audit-test-${input.exchangeIndex}`,
    dateSessionId: "audit-test-session",
    exchangeIndex: input.exchangeIndex,
    dateHealthDelta: 0,
    statDeltas: {},
    memberMoodDeltas: {},
    shouldEndEarly: false,
    endSentiment: null,
    notableMoments: input.notableMoments ?? ["A small concrete moment."],
    playerSummary: input.playerSummary,
    memoryCandidates: [],
    usedEvidenceIds: [],
    agreementCandidates: [],
    agreementUpdates: [],
    openLoopCandidates: [],
    openLoopUpdates: [],
  });
}

describe("date quality audit detectors", () => {
  describe("repetition", () => {
    it("flags near-duplicate consecutive lines by the same speaker", () => {
      const transcript = buildTranscript([
        {
          speaker: JENNA,
          text: "Soup honest contract receipt sincere planning document tonight.",
          turnIndex: 1,
        },
        { speaker: VHOOL, text: "I accept the soup. I file the soup.", turnIndex: 2 },
        {
          speaker: JENNA,
          text: "Soup honest contract receipt sincere planning document, tonight.",
          turnIndex: 3,
        },
      ]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "repetition")).toBe(true);
    });

    it("does not flag distinct consecutive lines", () => {
      const transcript = buildTranscript([
        { speaker: JENNA, text: "Soup is the most honest contract in this room.", turnIndex: 1 },
        { speaker: VHOOL, text: "I file the soup. I will not eat it tonight.", turnIndex: 2 },
        {
          speaker: JENNA,
          text: "Skip the soup if you want. The receipt is the thing.",
          turnIndex: 3,
        },
      ]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "repetition")).toBe(false);
    });
  });

  describe("approval phrase", () => {
    it("flags reused approval openers across recent lines", () => {
      const transcript = buildTranscript([
        { speaker: JENNA, text: "For sure, the soup belongs on the table.", turnIndex: 1 },
        {
          speaker: VHOOL,
          text: "I will allow the soup as a sincere planning document.",
          turnIndex: 2,
        },
        { speaker: JENNA, text: "For sure, that is the calmest read of the night.", turnIndex: 3 },
      ]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "approval_phrase")).toBe(true);
    });
  });

  describe("info leak", () => {
    it("flags speaker echoing a hidden-tier ngram from the partner bio", () => {
      // Vhool's hidden bio mentions specific institutional concepts not present
      // in the public datingProfile or visualDescription.
      const bioFragment = extractDistinctiveTriGram(VHOOL.bio);
      const transcript = buildTranscript([
        { speaker: VHOOL, text: "I want a sincere receipt.", turnIndex: 1 },
        { speaker: JENNA, text: `So you ${bioFragment} the receipt then.`, turnIndex: 2 },
      ]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "info_leak")).toBe(true);
    });

    it("flags speaker echoing their own raw hidden fixture text", () => {
      const bioFragment = extractDistinctiveTriGram(JENNA.bio);
      const transcript = buildTranscript([
        { speaker: JENNA, text: `The file says ${bioFragment} and I hate that.`, turnIndex: 1 },
        { speaker: VHOOL, text: "I will pretend that was a normal receipt.", turnIndex: 2 },
      ]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "info_leak")).toBe(true);
    });

    it("does not flag lines that stick to public dating profile vocabulary", () => {
      const profileSnippet = JENNA.datingProfile.split(/\s+/).slice(0, 6).join(" ");
      const transcript = buildTranscript([
        { speaker: JENNA, text: profileSnippet, turnIndex: 1 },
        { speaker: VHOOL, text: "That sounds like the calmest read of the night.", turnIndex: 2 },
      ]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "info_leak")).toBe(false);
    });
  });

  describe("venue monologue", () => {
    it("flags a line that echoes the scenario brief verbatim", () => {
      const monologue = SCENARIO.publicBrief.openingSituation.slice(0, 200);
      const transcript = buildTranscript([
        { speaker: JENNA, text: monologue, turnIndex: 1 },
        { speaker: VHOOL, text: "I accept the table.", turnIndex: 2 },
      ]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "venue_monologue")).toBe(true);
    });

    it("does not flag a line that only mentions one shared phrase", () => {
      const transcript = buildTranscript([
        { speaker: JENNA, text: "We could sit at the table by the window.", turnIndex: 1 },
        { speaker: VHOOL, text: "I will allow the table.", turnIndex: 2 },
      ]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "venue_monologue")).toBe(false);
    });
  });

  describe("overlong turn reporting", () => {
    it("does not infer raw model length from a saved transcript message", () => {
      const oldCapShape = `${"a".repeat(257)}...`;
      const transcript = buildTranscript([{ speaker: JENNA, text: oldCapShape, turnIndex: 1 }]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "overlong_turn")).toBe(false);
    });

    it("does not flag a line that simply ends with an ellipsis under the target", () => {
      const transcript = buildTranscript([
        { speaker: JENNA, text: "I will hold the thought right there...", turnIndex: 1 },
      ]);

      const findings = runDetectors(transcript);

      expect(findings.some((finding) => finding.category === "overlong_turn")).toBe(false);
    });
  });
});

describe("judge finding detectors", () => {
  it("flags player summaries that hit banned phrases", () => {
    const judges = [
      makeJudge({
        exchangeIndex: 0,
        playerSummary: "The pair built a deeper connection and unlocked potential.",
      }),
    ];

    const findings = detectJudgeFindings({ judgeSnapshots: judges });

    expect(findings.some((finding) => finding.category === "weak_judge_summary")).toBe(true);
  });

  it("flags notable moments that contain banned phrases", () => {
    const judges = [
      makeJudge({
        exchangeIndex: 0,
        playerSummary: "Cupid filed the soup question.",
        notableMoments: ["They navigated tension over the receipt."],
      }),
    ];

    const findings = detectJudgeFindings({ judgeSnapshots: judges });

    expect(findings.some((finding) => finding.category === "weak_judge_summary")).toBe(true);
  });

  it("accepts concrete corporate-voice summaries", () => {
    const judges = [
      makeJudge({
        exchangeIndex: 0,
        playerSummary: "Vhool conceded the receipt. Trust is up, recruiting talk is off the table.",
        notableMoments: ["Vhool offered the receipt."],
      }),
    ];

    const findings = detectJudgeFindings({ judgeSnapshots: judges });

    expect(findings).toHaveLength(0);
  });
});

describe("audit case fixtures", () => {
  it("produces 9 default cases by crossing built-in pairs and scenarios", () => {
    const known = listKnownPairIds();
    const scenarioIds = ["temporal-coffee-shop", "park-loop-with-a-dog", "prophecy-karaoke"];
    const cases = buildAuditCasesByIds(known, scenarioIds);

    expect(known.length).toBe(3);
    expect(cases.length).toBe(known.length * scenarioIds.length);
    expect(cases.every((auditCase) => auditCase.pairId.length > 0)).toBe(true);
  });

  it("rejects unknown member ids", () => {
    expect(() =>
      buildAuditCases(
        [{ focusMemberId: "nope", partnerMemberId: "vhool" }],
        ["temporal-coffee-shop"],
      ),
    ).toThrow(/Unknown member id/);
  });

  it("rejects unknown scenario ids", () => {
    expect(() =>
      buildAuditCases(
        [{ focusMemberId: "jenna-pike", partnerMemberId: "vhool" }],
        ["does-not-exist"],
      ),
    ).toThrow(/Unknown scenario id/);
  });
});

describe("audit report serialization", () => {
  it("renders a markdown report with totals and per-case sections", () => {
    const report: AuditRunReport = {
      startedAt: BASE_TIMESTAMP,
      endedAt: BASE_TIMESTAMP,
      durationMs: 1234,
      config: {
        aiProvider: "ollama",
        chatModel: "fake-chat",
        embeddingModel: "fake-embedding",
        ollamaBaseURL: "http://localhost:11434",
        gatewayBaseURL: "https://gateway.example",
      },
      totals: {
        caseCount: 1,
        errorCount: 0,
        findingCount: 1,
        findingsByCategory: {
          repetition: 1,
          approval_phrase: 0,
          info_leak: 0,
          venue_monologue: 0,
          json_repair: 0,
          weak_judge_summary: 0,
          overlong_turn: 0,
          engine_error: 0,
        },
        failCount: 0,
        warnCount: 1,
      },
      cases: [
        {
          case: {
            pairId: "jenna-pike__vhool",
            scenarioId: "temporal-coffee-shop",
            focusMemberId: "jenna-pike",
            partnerMemberId: "vhool",
            label: "Jenna x Vhool",
          },
          sessionId: "fake-session",
          finalStatus: "completed",
          turnCount: 2,
          exchangeCount: 1,
          findings: [
            {
              category: "repetition",
              severity: "warn",
              message: "Speaker repeated a near-duplicate of a recent line.",
              turnIndex: 3,
              speakerId: "jenna-pike",
            },
          ],
          warningMessages: [],
          jsonRepairCount: 0,
          jsonDirectCount: 1,
          jsonFailedCount: 0,
          durationMs: 1234,
          aiTelemetry: {
            characterGenerationCount: 2,
            characterToolCallCount: 0,
            characterToolResultCount: 0,
            characterPromptCharacters: 0,
            characterEstimatedPromptTokens: 0,
            characterInputTokens: 0,
            characterOutputTokens: 0,
            characterTotalTokens: 0,
            providerWarningCount: 0,
          },
          transcript: [],
          judgeSnapshots: [],
        },
      ],
    };

    const markdown = formatAuditReportAsMarkdown(report);

    expect(markdown).toContain("# Date quality audit");
    expect(markdown).toContain("Jenna x Vhool on temporal-coffee-shop");
    expect(markdown).toContain("repetition: 1");
    expect(markdown).toContain("warn");
  });
});
