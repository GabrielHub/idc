import {
  type AiProvider,
  type DateMessage,
  type DateScenario,
  type DateSession,
  type DateSessionStatus,
  type GameSave,
  type JudgeSnapshot,
  type Member,
} from "../domain/game";
import { LocalGameRepository } from "../repositories/local-game-repository";
import { MemorySaveStore } from "../repositories/memory-save-store";
import { starterScenarios } from "../fixtures";
import {
  advanceDateExchangeWithLocalAi,
  type CharacterAiTelemetry,
  type LocalAiDateRuntime,
} from "./ai-date-engine";
import {
  type AiReadiness,
  type AiRuntimeConfig,
  type GeneratedTextResult,
  type OllamaModelInventory,
  checkAiReadiness,
  embedMemoryText,
  generateCharacterTurn,
  judgeDateExchange,
  listOllamaModelInventory,
  setJsonRepairListener,
  streamCharacterTurn as streamCharacterTurnWithLocalAi,
  summarizeDateMemories,
} from "./ai/model-service";
import {
  CUPID_COPY_BANNED_PHRASES,
  checkCupidCorporateCopy,
  hasNearDuplicateRecentLine,
  hasRepeatedApprovalPhrase,
} from "./date-prompts";
import { createSeedGameSave } from "./game-seed";
import { startAndDraftDateSession, withFeaturedMembers } from "./test-helpers";
import { errorToMessage, escapeRegex, isRecord } from "./utils";

const CHARACTER_MESSAGE_MAX_LENGTH = 260;
const TRUNCATION_SUFFIX = "...";
const MIN_LEAK_NGRAM_TOKENS = 3;
const MIN_LEAK_TOKEN_LENGTH = 4;
const MAX_LEAK_EVIDENCE_LENGTH = 200;
const VENUE_MONOLOGUE_NGRAM_TOKENS = 4;

const BANNED_PHRASE_PATTERNS = CUPID_COPY_BANNED_PHRASES.map((phrase) => ({
  phrase,
  pattern: new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i"),
}));

export type AuditCategory =
  | "repetition"
  | "approval_phrase"
  | "info_leak"
  | "venue_monologue"
  | "json_repair"
  | "weak_judge_summary"
  | "overlong_turn"
  | "engine_error";

export type AuditSeverity = "warn" | "fail";

export type AuditFinding = {
  category: AuditCategory;
  severity: AuditSeverity;
  message: string;
  turnIndex?: number;
  exchangeIndex?: number;
  speakerId?: string;
  evidence?: string;
};

export type AuditCase = {
  pairId: string;
  scenarioId: string;
  focusMemberId: string;
  partnerMemberId: string;
  label?: string;
  notes?: string;
};

export type AuditRunCaseReport = {
  case: AuditCase;
  sessionId: string | null;
  finalStatus: DateSessionStatus | "errored";
  turnCount: number;
  exchangeCount: number;
  findings: AuditFinding[];
  warningMessages: string[];
  jsonRepairCount: number;
  jsonDirectCount: number;
  jsonFailedCount: number;
  durationMs: number;
  aiTelemetry: CharacterAiTelemetry;
  transcript: DateMessage[];
  judgeSnapshots: JudgeSnapshot[];
};

export type AuditRunReport = {
  startedAt: string;
  endedAt: string;
  durationMs: number;
  config: {
    aiProvider: AiProvider;
    chatModel: string;
    embeddingModel: string;
    ollamaBaseURL: string;
    gatewayBaseURL: string;
  };
  totals: AuditTotals;
  cases: AuditRunCaseReport[];
};

export type AuditTotals = {
  caseCount: number;
  errorCount: number;
  findingCount: number;
  findingsByCategory: Record<AuditCategory, number>;
  failCount: number;
  warnCount: number;
};

const EMPTY_FINDING_COUNTS: Record<AuditCategory, number> = {
  repetition: 0,
  approval_phrase: 0,
  info_leak: 0,
  venue_monologue: 0,
  json_repair: 0,
  weak_judge_summary: 0,
  overlong_turn: 0,
  engine_error: 0,
};

export const AUDIT_CATEGORIES: readonly AuditCategory[] = Object.keys(
  EMPTY_FINDING_COUNTS,
) as AuditCategory[];

export type AuditRunOptions = {
  cases: readonly AuditCase[];
  config: Partial<AiRuntimeConfig>;
  now?: () => Date;
  onCaseStart?: (auditCase: AuditCase, index: number, total: number) => void;
  onCaseComplete?: (report: AuditRunCaseReport, index: number, total: number) => void;
};

/**
 * Runs each fixed pair-scenario case through the live AI date engine, then
 * applies the audit detectors. Returns a report ready for serialization.
 */
export async function runDateQualityAudit(options: AuditRunOptions): Promise<AuditRunReport> {
  const now = options.now ?? (() => new Date());
  const startedAt = now();
  const caseReports: AuditRunCaseReport[] = [];

  for (let index = 0; index < options.cases.length; index += 1) {
    const auditCase = options.cases[index];
    options.onCaseStart?.(auditCase, index, options.cases.length);
    const report = await runSingleAuditCase(auditCase, options.config, now);
    caseReports.push(report);
    options.onCaseComplete?.(report, index, options.cases.length);
  }

  const endedAt = now();
  const fullConfig = resolveAuditConfig(options.config);

  return {
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationMs: endedAt.getTime() - startedAt.getTime(),
    config: {
      aiProvider: fullConfig.aiProvider,
      chatModel: fullConfig.chatModel,
      embeddingModel: fullConfig.embeddingModel,
      ollamaBaseURL: fullConfig.ollamaBaseURL,
      gatewayBaseURL: fullConfig.gatewayBaseURL,
    },
    totals: summarizeTotals(caseReports),
    cases: caseReports,
  };
}

function resolveAuditConfig(config: Partial<AiRuntimeConfig>): {
  aiProvider: AiProvider;
  chatModel: string;
  embeddingModel: string;
  ollamaBaseURL: string;
  gatewayBaseURL: string;
} {
  const seed = createSeedGameSave().config;
  return {
    aiProvider: config.aiProvider ?? seed.aiProvider,
    chatModel: config.chatModel ?? seed.chatModel,
    embeddingModel: config.embeddingModel ?? seed.embeddingModel,
    ollamaBaseURL: config.ollamaBaseURL ?? seed.ollamaBaseURL,
    gatewayBaseURL: config.gatewayBaseURL ?? seed.gatewayBaseURL,
  };
}

async function runSingleAuditCase(
  auditCase: AuditCase,
  config: Partial<AiRuntimeConfig>,
  now: () => Date,
): Promise<AuditRunCaseReport> {
  const start = now();
  const repository = new LocalGameRepository(new MemorySaveStore(), `audit-${auditCase.pairId}`);
  const seedSave = withFeaturedMembers(createSeedGameSave(start), [auditCase.focusMemberId]);
  let save: GameSave = seedSave;
  const findings: AuditFinding[] = [];
  const warningMessages: string[] = [];
  const aiTelemetry: CharacterAiTelemetry = {
    characterGenerationCount: 0,
    characterToolCallCount: 0,
    characterToolResultCount: 0,
    characterPromptCharacters: 0,
    characterEstimatedPromptTokens: 0,
    characterInputTokens: 0,
    characterOutputTokens: 0,
    characterTotalTokens: 0,
    providerWarningCount: 0,
  };

  let started;
  try {
    started = startAndDraftDateSession(save, {
      focusMemberId: auditCase.focusMemberId,
      firstMemberId: auditCase.focusMemberId,
      secondMemberId: auditCase.partnerMemberId,
      scenarioId: auditCase.scenarioId,
      now: start,
    });
    save = started.save;
    await repository.saveGame(save);
  } catch (error) {
    findings.push({
      category: "engine_error",
      severity: "fail",
      message: `Could not start date session: ${errorToMessage(error)}`,
    });
    return {
      case: auditCase,
      sessionId: null,
      finalStatus: "errored",
      turnCount: 0,
      exchangeCount: 0,
      findings,
      warningMessages,
      jsonRepairCount: 0,
      jsonDirectCount: 0,
      jsonFailedCount: 0,
      durationMs: now().getTime() - start.getTime(),
      aiTelemetry,
      transcript: [],
      judgeSnapshots: [],
    };
  }

  const sessionId = started.session.id;
  const scenario = requireScenarioById(auditCase.scenarioId);
  const focusMember = requireMemberById(save, auditCase.focusMemberId);
  const partnerMember = requireMemberById(save, auditCase.partnerMemberId);
  const overlongRaw: { rawLength: number; preview: string }[] = [];
  const runtime = createAuditRuntime({ overlongRaw });

  let jsonDirectCount = 0;
  let jsonRepairCount = 0;
  let jsonFailedCount = 0;
  setJsonRepairListener((event) => {
    if (event.scope !== "judge") {
      return;
    }

    if (event.kind === "direct") {
      jsonDirectCount += 1;
      return;
    }
    if (event.kind === "recovered") {
      jsonRepairCount += 1;
      findings.push({
        category: "json_repair",
        severity: "warn",
        message: "Judge JSON needed brace extraction to parse cleanly.",
        evidence: truncateEvidence(event.rawText),
      });
      return;
    }
    jsonFailedCount += 1;
    findings.push({
      category: "json_repair",
      severity: "fail",
      message: `Judge JSON could not be parsed even after brace extraction: ${event.reason}`,
      evidence: truncateEvidence(event.rawText),
    });
  });

  let finalSession: DateSession = started.session;
  let errored = false;
  try {
    // Loop the engine until the session ends. This mirrors completeDateSessionWithLocalAi
    // but lets us track turn growth and abort if the engine stalls.
    let safetyCounter = 0;
    while (finalSession.status === "active") {
      const previousTurn = finalSession.currentTurn;
      const result = await advanceDateExchangeWithLocalAi(save, repository, {
        dateSessionId: sessionId,
        runtime,
        config,
        now: now(),
      });
      save = result.save;
      finalSession = result.session;
      warningMessages.push(...result.warningMessages);
      mergeTelemetry(aiTelemetry, result.aiTelemetry);

      if (finalSession.currentTurn === previousTurn) {
        // Engine did not advance; bail to avoid an infinite loop.
        break;
      }

      safetyCounter += 1;
      if (safetyCounter > finalSession.turnLimit + 4) {
        findings.push({
          category: "engine_error",
          severity: "fail",
          message: "Audit aborted: engine produced more turns than turnLimit allows.",
        });
        break;
      }
    }
  } catch (error) {
    errored = true;
    findings.push({
      category: "engine_error",
      severity: "fail",
      message: `Date session crashed: ${errorToMessage(error)}`,
    });
  } finally {
    setJsonRepairListener(undefined);
  }

  for (const overlong of overlongRaw) {
    findings.push({
      category: "overlong_turn",
      severity: overlong.rawLength > CHARACTER_MESSAGE_MAX_LENGTH * 1.5 ? "fail" : "warn",
      message: `AI generation produced a ${overlong.rawLength}-char line; engine cap is ${CHARACTER_MESSAGE_MAX_LENGTH}.`,
      evidence: truncateEvidence(overlong.preview),
    });
  }

  findings.push(
    ...detectTranscriptFindings({
      transcript: finalSession.transcript,
      scenario,
      focusMember,
      partnerMember,
    }),
  );
  findings.push(
    ...detectJudgeFindings({
      judgeSnapshots: finalSession.judgeSnapshots,
    }),
  );

  return {
    case: auditCase,
    sessionId,
    finalStatus: errored ? "errored" : finalSession.status,
    turnCount: finalSession.currentTurn,
    exchangeCount: finalSession.judgeSnapshots.length,
    findings,
    warningMessages,
    jsonRepairCount,
    jsonDirectCount,
    jsonFailedCount,
    durationMs: now().getTime() - start.getTime(),
    aiTelemetry,
    transcript: finalSession.transcript,
    judgeSnapshots: finalSession.judgeSnapshots,
  };
}

function createAuditRuntime({
  overlongRaw,
}: {
  overlongRaw: { rawLength: number; preview: string }[];
}): LocalAiDateRuntime {
  return {
    generateCharacterTurn: async ({ packet, config, tools }) => {
      const result = await generateCharacterTurn({ packet, config, tools });
      trackRawLength(result, overlongRaw);
      return result;
    },
    streamCharacterTurn: async ({ packet, config, tools, abortSignal, onTextDelta }) => {
      const result = await streamCharacterTurnWithLocalAi({
        packet,
        config,
        tools,
        abortSignal,
        onTextDelta,
      });
      trackRawLength(result, overlongRaw);
      return result;
    },
    judgeDateExchange: ({ packet, dateSessionId, exchangeIndex, config }) =>
      judgeDateExchange({ packet, dateSessionId, exchangeIndex, config }),
    summarizeDateMemories: ({ packet, config }) => summarizeDateMemories(packet, config),
    embedMemoryText: ({ text, config }) => embedMemoryText(text, config),
  };
}

function trackRawLength(
  result: GeneratedTextResult,
  collector: { rawLength: number; preview: string }[],
): void {
  if (result.text.length <= CHARACTER_MESSAGE_MAX_LENGTH) {
    return;
  }
  collector.push({
    rawLength: result.text.length,
    preview: result.text.slice(0, CHARACTER_MESSAGE_MAX_LENGTH),
  });
}

function mergeTelemetry(into: CharacterAiTelemetry, from: CharacterAiTelemetry): void {
  for (const key of Object.keys(into) as Array<keyof CharacterAiTelemetry>) {
    into[key] += from[key];
  }
}

function requireScenarioById(scenarioId: string): DateScenario {
  const scenario = starterScenarios.find((candidate) => candidate.id === scenarioId);
  if (scenario === undefined) {
    throw new Error(`Audit case references unknown scenario: ${scenarioId}`);
  }
  return scenario;
}

function requireMemberById(save: GameSave, memberId: string): Member {
  const member = save.members.find((candidate) => candidate.id === memberId);
  if (member === undefined) {
    throw new Error(`Audit case references unknown member: ${memberId}`);
  }
  return member;
}

// === Transcript detectors ===

export function detectTranscriptFindings({
  transcript,
  scenario,
  focusMember,
  partnerMember,
}: {
  transcript: readonly DateMessage[];
  scenario: DateScenario;
  focusMember: Member;
  partnerMember: Member;
}): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const venueProfile = buildVenueProfile(scenario);
  const focusLeakProfile = buildLeakProfile(focusMember);
  const partnerLeakProfile = buildLeakProfile(partnerMember);

  const focusSpeakerMessages: DateMessage[] = [];
  const partnerSpeakerMessages: DateMessage[] = [];

  for (let index = 0; index < transcript.length; index += 1) {
    const message = transcript[index];
    if (message.kind !== "character") continue;
    const isFocusSpeaker = message.speakerId === focusMember.id;
    const partner = isFocusSpeaker ? partnerMember : focusMember;
    const partnerLeakProfileForSpeaker = isFocusSpeaker ? partnerLeakProfile : focusLeakProfile;

    if (isFocusSpeaker) {
      focusSpeakerMessages.push(message);
    } else {
      partnerSpeakerMessages.push(message);
    }

    findings.push(...detectOverlongFromTruncation(message));
    findings.push(...detectVenueMonologue(message, scenario, venueProfile));
    findings.push(...detectInfoLeak(message, partner, partnerLeakProfileForSpeaker));
  }

  findings.push(...detectRepetitionAmongSpeakerMessages(focusSpeakerMessages, focusMember.id));
  findings.push(...detectRepetitionAmongSpeakerMessages(partnerSpeakerMessages, partnerMember.id));
  findings.push(...detectApprovalPhraseAmongSpeakerMessages(focusSpeakerMessages, focusMember.id));
  findings.push(
    ...detectApprovalPhraseAmongSpeakerMessages(partnerSpeakerMessages, partnerMember.id),
  );

  // Sort by turn for stable reports.
  findings.sort((a, b) => (a.turnIndex ?? 0) - (b.turnIndex ?? 0));

  return findings;
}

function detectOverlongFromTruncation(message: DateMessage): AuditFinding[] {
  if (!message.text.endsWith(TRUNCATION_SUFFIX)) {
    return [];
  }
  if (message.text.length < CHARACTER_MESSAGE_MAX_LENGTH - 3) {
    return [];
  }
  return [
    {
      category: "overlong_turn",
      severity: "warn",
      message: `Speaker line hit the ${CHARACTER_MESSAGE_MAX_LENGTH}-char cap and was truncated by the engine.`,
      turnIndex: message.turnIndex,
      speakerId: message.speakerId,
      evidence: truncateEvidence(message.text),
    },
  ];
}

function detectRepetitionAmongSpeakerMessages(
  speakerMessages: readonly DateMessage[],
  speakerId: string,
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (let index = 0; index < speakerMessages.length; index += 1) {
    const message = speakerMessages[index];
    const priorLines = speakerMessages
      .slice(Math.max(0, index - 3), index)
      .map((entry) => entry.text);
    const dup = hasNearDuplicateRecentLine({
      text: message.text,
      recentLines: priorLines,
    });
    if (dup !== null) {
      findings.push({
        category: "repetition",
        severity: "warn",
        message: "Speaker repeated a near-duplicate of a recent line.",
        turnIndex: message.turnIndex,
        speakerId,
        evidence: `${truncateEvidence(message.text)} | vs | ${truncateEvidence(dup.repeatedLine)}`,
      });
    }
  }
  return findings;
}

function detectApprovalPhraseAmongSpeakerMessages(
  speakerMessages: readonly DateMessage[],
  speakerId: string,
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (let index = 0; index < speakerMessages.length; index += 1) {
    const message = speakerMessages[index];
    const recent = speakerMessages.slice(Math.max(0, index - 3), index).map((entry) => entry.text);
    const repeated = hasRepeatedApprovalPhrase({
      text: message.text,
      recentLines: recent,
    });
    if (repeated !== null) {
      findings.push({
        category: "approval_phrase",
        severity: "warn",
        message: `Speaker reused approval opener "${repeated.repeatedPhrase}".`,
        turnIndex: message.turnIndex,
        speakerId,
        evidence: `${truncateEvidence(message.text)} | vs | ${truncateEvidence(repeated.recentLine)}`,
      });
    }
  }
  return findings;
}

// === Venue monologue ===

type VenueProfile = {
  ngrams: Set<string>;
  source: string;
};

function buildVenueProfile(scenario: DateScenario): VenueProfile {
  const source = [
    scenario.publicBrief.location,
    scenario.publicBrief.premise,
    scenario.publicBrief.whatBothCharactersKnow,
    scenario.publicBrief.openingSituation,
    scenario.director.tone,
    ...scenario.director.rules,
  ].join(" \n ");
  return {
    ngrams: ngramSet(source, VENUE_MONOLOGUE_NGRAM_TOKENS),
    source,
  };
}

function detectVenueMonologue(
  message: DateMessage,
  scenario: DateScenario,
  profile: VenueProfile,
): AuditFinding[] {
  const messageNgrams = ngramSet(message.text, VENUE_MONOLOGUE_NGRAM_TOKENS);
  if (messageNgrams.size === 0) return [];
  const matches: string[] = [];
  for (const ngram of messageNgrams) {
    if (profile.ngrams.has(ngram)) {
      matches.push(ngram);
      if (matches.length >= 3) break;
    }
  }
  if (matches.length === 0) {
    return [];
  }
  return [
    {
      category: "venue_monologue",
      severity: matches.length >= 2 ? "fail" : "warn",
      message: `Speaker line echoes scenario "${scenario.title}" brief (${matches.length} matching ${VENUE_MONOLOGUE_NGRAM_TOKENS}-grams).`,
      turnIndex: message.turnIndex,
      speakerId: message.speakerId,
      evidence: `match: "${matches[0]}" | line: ${truncateEvidence(message.text)}`,
    },
  ];
}

// === Hidden info leak ===

type LeakProfile = {
  // Distinctive n-grams that should not appear in the partner's spoken lines.
  ngrams: Map<string, string>;
  // Single distinctive proper nouns or hidden-tier labels that should never appear.
  hiddenLabels: Map<string, string>;
};

function buildLeakProfile(member: Member): LeakProfile {
  const publicCorpus = [member.datingProfile, member.visualDescription, member.name].join(" \n ");
  const publicTokens = wordSet(publicCorpus);

  const hiddenSources: { source: string; label: string }[] = [
    { source: member.bio, label: "bio" },
    ...member.secrets.map((secret) => ({ source: secret, label: "secret" })),
    { source: member.species, label: "species" },
    { source: member.dimension, label: "dimension" },
    { source: member.realityStatus, label: "reality_status" },
    { source: member.origin, label: "origin" },
  ];

  const ngrams = new Map<string, string>();
  for (const entry of hiddenSources) {
    const fieldNgrams = ngramSet(entry.source, MIN_LEAK_NGRAM_TOKENS);
    for (const ngram of fieldNgrams) {
      if (containsOnlyCommonTokens(ngram)) continue;
      // Skip n-grams already present in public data; those are not leaks.
      if (publicTokens.has(firstUsefulToken(ngram))) continue;
      if (!ngrams.has(ngram)) {
        ngrams.set(ngram, entry.label);
      }
    }
  }

  const hiddenLabels = new Map<string, string>();
  // Distinctive single-word hidden labels: species/dimension/realityStatus/origin
  // when those words do not appear anywhere in the public-facing data.
  for (const entry of [
    { source: member.species, label: "species" },
    { source: member.dimension, label: "dimension" },
    { source: member.realityStatus, label: "reality_status" },
    { source: member.origin, label: "origin" },
  ]) {
    for (const token of wordSet(entry.source)) {
      if (token.length < MIN_LEAK_TOKEN_LENGTH) continue;
      if (COMMON_TOKENS.has(token)) continue;
      if (publicTokens.has(token)) continue;
      hiddenLabels.set(token, entry.label);
    }
  }

  return { ngrams, hiddenLabels };
}

function detectInfoLeak(
  message: DateMessage,
  partner: Member,
  partnerProfile: LeakProfile,
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const messageNgrams = ngramSet(message.text, MIN_LEAK_NGRAM_TOKENS);
  for (const ngram of messageNgrams) {
    const label = partnerProfile.ngrams.get(ngram);
    if (label !== undefined) {
      findings.push({
        category: "info_leak",
        severity: "fail",
        message: `Speaker echoed a ${MIN_LEAK_NGRAM_TOKENS}-gram from ${partner.firstName}'s hidden ${label}.`,
        turnIndex: message.turnIndex,
        speakerId: message.speakerId,
        evidence: `leak: "${ngram}" | line: ${truncateEvidence(message.text)}`,
      });
      // One ngram finding is enough per message to avoid spam.
      return findings;
    }
  }
  const tokens = wordSet(message.text);
  for (const token of tokens) {
    const label = partnerProfile.hiddenLabels.get(token);
    if (label !== undefined) {
      findings.push({
        category: "info_leak",
        severity: "fail",
        message: `Speaker used the word "${token}" which leaks ${partner.firstName}'s hidden ${label}.`,
        turnIndex: message.turnIndex,
        speakerId: message.speakerId,
        evidence: `line: ${truncateEvidence(message.text)}`,
      });
      return findings;
    }
  }
  return findings;
}

// === Judge findings ===

export function detectJudgeFindings({
  judgeSnapshots,
}: {
  judgeSnapshots: readonly JudgeSnapshot[];
}): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const snapshot of judgeSnapshots) {
    findings.push(...detectWeakJudgeSummary(snapshot));
  }
  return findings;
}

function detectWeakJudgeSummary(snapshot: JudgeSnapshot): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const summaryCheck = checkCupidCorporateCopy(snapshot.playerSummary, { maxLength: 320 });
  if (!summaryCheck.ok) {
    findings.push({
      category: "weak_judge_summary",
      severity: summaryCheck.reason === "empty" ? "fail" : "warn",
      message: `Judge playerSummary failed copy check (${summaryCheck.reason}${summaryCheck.offender === undefined ? "" : `: ${summaryCheck.offender}`}).`,
      exchangeIndex: snapshot.exchangeIndex,
      evidence: truncateEvidence(snapshot.playerSummary),
    });
  }
  for (const moment of snapshot.notableMoments) {
    for (const { phrase, pattern } of BANNED_PHRASE_PATTERNS) {
      if (pattern.test(moment)) {
        findings.push({
          category: "weak_judge_summary",
          severity: "warn",
          message: `Judge notableMoment contains banned phrase "${phrase}".`,
          exchangeIndex: snapshot.exchangeIndex,
          evidence: truncateEvidence(moment),
        });
        break;
      }
    }
  }
  return findings;
}

// === Tokenization helpers ===

const WORD_PATTERN = /[a-z0-9'-]+/gi;
const COMMON_TOKENS = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "you",
  "your",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "they",
  "them",
  "their",
  "from",
  "into",
  "but",
  "not",
  "any",
  "all",
  "out",
  "what",
  "when",
  "where",
  "who",
  "why",
  "how",
  "will",
  "would",
  "could",
  "should",
  "about",
  "after",
  "before",
  "very",
  "just",
  "more",
  "most",
  "less",
  "than",
  "then",
  "some",
  "still",
  "even",
  "ever",
  "never",
  "always",
  "much",
  "many",
  "few",
  "one",
  "two",
  "three",
  "four",
  "five",
  "first",
  "second",
  "third",
  "really",
  "actually",
  "kind",
  "sort",
  "type",
  "thing",
  "things",
  "people",
  "person",
  "place",
  "places",
  "time",
  "times",
  "day",
  "night",
  "week",
  "year",
  "years",
  "today",
  "tonight",
  "table",
]);

function ngramSet(text: string, size: number): Set<string> {
  const tokens = normalizeTokens(text);
  if (tokens.length < size) return new Set();
  const result = new Set<string>();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(" "));
  }
  return result;
}

function wordSet(text: string): Set<string> {
  return new Set(normalizeTokens(text));
}

function normalizeTokens(text: string): string[] {
  const matches = text.toLowerCase().match(WORD_PATTERN);
  return matches === null ? [] : matches.filter((token) => token.length >= 2);
}

function containsOnlyCommonTokens(ngram: string): boolean {
  const tokens = ngram.split(" ");
  return tokens.every((token) => COMMON_TOKENS.has(token) || token.length < MIN_LEAK_TOKEN_LENGTH);
}

function firstUsefulToken(ngram: string): string {
  for (const token of ngram.split(" ")) {
    if (!COMMON_TOKENS.has(token) && token.length >= MIN_LEAK_TOKEN_LENGTH) {
      return token;
    }
  }
  return ngram;
}

function truncateEvidence(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_LEAK_EVIDENCE_LENGTH) return collapsed;
  return `${collapsed.slice(0, MAX_LEAK_EVIDENCE_LENGTH - 3)}...`;
}

// === Summary ===

function summarizeTotals(reports: readonly AuditRunCaseReport[]): AuditTotals {
  const findingsByCategory = { ...EMPTY_FINDING_COUNTS };
  let findingCount = 0;
  let failCount = 0;
  let warnCount = 0;
  let errorCount = 0;
  for (const report of reports) {
    if (report.finalStatus === "errored") errorCount += 1;
    for (const finding of report.findings) {
      findingsByCategory[finding.category] += 1;
      findingCount += 1;
      if (finding.severity === "fail") failCount += 1;
      else warnCount += 1;
    }
  }
  return {
    caseCount: reports.length,
    errorCount,
    findingCount,
    findingsByCategory,
    failCount,
    warnCount,
  };
}

// === Report serializers ===

/**
 * Renders a human-readable markdown summary of the audit run. The format is
 * stable and parseable by simple scripts; the JSON report is the canonical
 * machine artifact.
 */
export function formatAuditReportAsMarkdown(report: AuditRunReport): string {
  const lines: string[] = [];
  lines.push("# Date quality audit");
  lines.push("");
  lines.push(
    `Run started ${report.startedAt}, ended ${report.endedAt} (${formatDuration(report.durationMs)}).`,
  );
  lines.push(
    `Provider: \`${report.config.aiProvider}\`. Chat model: \`${report.config.chatModel}\`. Embedding model: \`${report.config.embeddingModel}\`.`,
  );
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push(`- Cases: ${report.totals.caseCount}`);
  lines.push(`- Engine errors: ${report.totals.errorCount}`);
  lines.push(
    `- Findings: ${report.totals.findingCount} (${report.totals.failCount} fail, ${report.totals.warnCount} warn)`,
  );
  for (const category of AUDIT_CATEGORIES) {
    const count = report.totals.findingsByCategory[category];
    if (count > 0) {
      lines.push(`  - ${category}: ${count}`);
    }
  }
  lines.push("");
  lines.push("## Cases");
  for (const caseReport of report.cases) {
    lines.push("");
    lines.push(
      `### ${caseReport.case.label ?? caseReport.case.pairId} on ${caseReport.case.scenarioId}`,
    );
    lines.push("");
    lines.push(`- Status: ${caseReport.finalStatus}`);
    lines.push(`- Turns: ${caseReport.turnCount}, Exchanges: ${caseReport.exchangeCount}`);
    lines.push(`- Duration: ${formatDuration(caseReport.durationMs)}`);
    lines.push(
      `- JSON: ${caseReport.jsonDirectCount} direct, ${caseReport.jsonRepairCount} recovered, ${caseReport.jsonFailedCount} failed`,
    );
    if (caseReport.findings.length === 0) {
      lines.push("- No findings.");
      continue;
    }
    lines.push("- Findings:");
    for (const finding of caseReport.findings) {
      const turn = finding.turnIndex === undefined ? "" : ` (turn ${finding.turnIndex})`;
      const exchange =
        finding.exchangeIndex === undefined ? "" : ` (exchange ${finding.exchangeIndex})`;
      const evidence = finding.evidence === undefined ? "" : `. Evidence: ${finding.evidence}`;
      lines.push(
        `  - **${finding.severity}** \`${finding.category}\`${turn}${exchange}: ${finding.message}${evidence}`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}m ${remainder.toFixed(0)}s`;
}

// === Provider setup helpers ===

export type AuditPreflightResult =
  | {
      ok: true;
      provider: AiProvider;
      chatModel: string;
      embeddingModel: string;
      embeddingDimensions: number;
    }
  | {
      ok: false;
      provider: AiProvider;
      chatModel: string;
      embeddingModel: string;
      reason: AuditPreflightFailureReason;
      detail: string;
      remediation: string[];
    };

export type AuditPreflightFailureReason =
  | "ollama_unreachable"
  | "ollama_model_missing"
  | "gateway_key_missing"
  | "gateway_unreachable"
  | "model_invalid"
  | "unknown";

/**
 * Runs a one-shot readiness probe against the configured AI provider. Returns
 * a structured result with an actionable remediation list when something is
 * misconfigured. Agents can call this before kicking off a full audit to fail
 * fast and self-correct.
 */
export async function preflightAuditProvider(
  config: Partial<AiRuntimeConfig>,
): Promise<AuditPreflightResult> {
  const resolved = resolveAuditConfig(config);

  if (resolved.aiProvider === "gateway" && normalizeKey(config.gatewayApiKey) === undefined) {
    return {
      ok: false,
      provider: resolved.aiProvider,
      chatModel: resolved.chatModel,
      embeddingModel: resolved.embeddingModel,
      reason: "gateway_key_missing",
      detail: "No gateway API key was supplied.",
      remediation: [
        "Pass --gateway-key <key> or set AI_GATEWAY_API_KEY in the environment.",
        "Or set --provider ollama to run against a local model instead.",
      ],
    };
  }

  try {
    const readiness = await checkAiReadiness(config);
    return {
      ok: true,
      provider: resolved.aiProvider,
      chatModel: readiness.languageModels[0] ?? resolved.chatModel,
      embeddingModel: readiness.embeddingModel,
      embeddingDimensions: readiness.embeddingDimensions,
    };
  } catch (error) {
    return classifyPreflightError(error, resolved);
  }
}

function classifyPreflightError(
  error: unknown,
  resolved: {
    aiProvider: AiProvider;
    chatModel: string;
    embeddingModel: string;
    ollamaBaseURL: string;
    gatewayBaseURL: string;
  },
): AuditPreflightResult {
  const detail = errorToMessage(error);
  // The model service wraps Ollama failures with a generic "running and ...
  // pulled" message regardless of whether the host is unreachable or the
  // model is missing. The underlying causeMessage is what actually
  // distinguishes the two, so we inspect both.
  const causeText = extractCauseMessage(error).toLowerCase();
  const wrapperText = detail.toLowerCase();

  if (resolved.aiProvider === "ollama") {
    if (looksLikeNetworkFailure(causeText) || looksLikeNetworkFailure(wrapperText)) {
      return {
        ok: false,
        provider: resolved.aiProvider,
        chatModel: resolved.chatModel,
        embeddingModel: resolved.embeddingModel,
        reason: "ollama_unreachable",
        detail,
        remediation: [
          `Ollama is not reachable at ${resolved.ollamaBaseURL}.`,
          "Start it with `ollama serve` (or install from https://ollama.com).",
          `Then pull the chat model: \`ollama pull ${resolved.chatModel}\`.`,
          `And the embedding model: \`ollama pull ${resolved.embeddingModel}\`.`,
        ],
      };
    }
    if (
      causeText.includes("not found") ||
      causeText.includes("404") ||
      causeText.includes("pull") ||
      causeText.includes("no such model") ||
      // Fall back to the wrapper when cause is empty.
      (causeText.length === 0 && wrapperText.includes("pull"))
    ) {
      return {
        ok: false,
        provider: resolved.aiProvider,
        chatModel: resolved.chatModel,
        embeddingModel: resolved.embeddingModel,
        reason: "ollama_model_missing",
        detail,
        remediation: [
          `The requested model is not pulled. Run \`ollama pull ${resolved.chatModel}\`.`,
          `Also confirm the embedding model: \`ollama pull ${resolved.embeddingModel}\`.`,
          "Use --list-models to see what is installed locally.",
        ],
      };
    }
  }

  if (resolved.aiProvider === "gateway") {
    if (
      causeText.includes("401") ||
      causeText.includes("unauthor") ||
      causeText.includes("forbidden") ||
      wrapperText.includes("unauthor")
    ) {
      return {
        ok: false,
        provider: resolved.aiProvider,
        chatModel: resolved.chatModel,
        embeddingModel: resolved.embeddingModel,
        reason: "gateway_key_missing",
        detail,
        remediation: [
          "Gateway rejected the API key.",
          "Refresh AI_GATEWAY_API_KEY or pass --gateway-key with a valid key.",
        ],
      };
    }
    if (looksLikeNetworkFailure(causeText) || looksLikeNetworkFailure(wrapperText)) {
      return {
        ok: false,
        provider: resolved.aiProvider,
        chatModel: resolved.chatModel,
        embeddingModel: resolved.embeddingModel,
        reason: "gateway_unreachable",
        detail,
        remediation: [
          `Gateway at ${resolved.gatewayBaseURL} is unreachable.`,
          "Check the URL and your outbound network.",
          "Falling back to --provider ollama is a faster local option.",
        ],
      };
    }
  }

  return {
    ok: false,
    provider: resolved.aiProvider,
    chatModel: resolved.chatModel,
    embeddingModel: resolved.embeddingModel,
    reason: "unknown",
    detail,
    remediation: [
      `Provider ${resolved.aiProvider} returned an error during readiness check.`,
      "Run --check again with --chat-model <id> if the configured model is unsupported.",
    ],
  };
}

function looksLikeNetworkFailure(text: string): boolean {
  return (
    text.includes("econnrefused") ||
    text.includes("enotfound") ||
    text.includes("etimedout") ||
    text.includes("fetch failed") ||
    text.includes("connection refused") ||
    text.includes("network error") ||
    text.includes("getaddrinfo")
  );
}

function extractCauseMessage(error: unknown): string {
  if (isRecord(error)) {
    const candidate = error.causeMessage;
    if (typeof candidate === "string") return candidate;
  }
  return "";
}

function normalizeKey(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export type AuditOllamaInventoryResult =
  | { ok: true; inventory: OllamaModelInventory; baseURL: string }
  | { ok: false; reason: "ollama_unreachable"; detail: string; baseURL: string };

/**
 * Lists installed Ollama models with recommended-status flags. Probes the
 * /api/tags endpoint first so the CLI can distinguish an empty model list
 * (Ollama reachable, no models pulled) from an unreachable Ollama (so the
 * agent knows whether to `ollama serve` or `ollama pull`).
 */
export async function listAuditOllamaModels(
  config: Partial<AiRuntimeConfig>,
): Promise<AuditOllamaInventoryResult> {
  const resolved = resolveAuditConfig(config);
  const baseURL = config.ollamaBaseURL ?? resolved.ollamaBaseURL;
  const reachableResult = await probeOllamaReachable(baseURL, config.requestTimeoutMs ?? 5_000);

  if (!reachableResult.reachable) {
    return {
      ok: false,
      reason: "ollama_unreachable",
      detail: reachableResult.detail,
      baseURL,
    };
  }

  const inventory = await listOllamaModelInventory({
    ollamaBaseURL: config.ollamaBaseURL,
    requestTimeoutMs: config.requestTimeoutMs,
  });

  return { ok: true, inventory, baseURL };
}

async function probeOllamaReachable(
  baseURL: string,
  timeoutMs: number,
): Promise<{ reachable: boolean; detail: string }> {
  try {
    const response = await globalThis.fetch(`${baseURL.replace(/\/$/, "")}/api/tags`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      return { reachable: false, detail: `HTTP ${response.status} from ${baseURL}/api/tags` };
    }
    return { reachable: true, detail: "ok" };
  } catch (error) {
    return { reachable: false, detail: errorToMessage(error) };
  }
}

export type { AiReadiness };
