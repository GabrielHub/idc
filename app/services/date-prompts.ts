import type { ImagePart, ModelMessage, TextPart, UserModelMessage } from "ai";

import { formatMemberHeightLabel } from "../components/date-reactions";
import type {
  DateMessage,
  DateScenario,
  DateSession,
  JudgeSnapshot,
  Member,
  MemberRequest,
  MemberSampleMessages,
  PairState,
  ScenarioEventKind,
} from "../domain/game";
import type { MemoryPack } from "./cupid-memory";
import {
  exchangeIndexForPendingTurn,
  isCurrentInterventionMessage,
  isInterventionActiveForMember,
} from "./date-engine";
import {
  rankActiveAgreements,
  rankActiveOpenLoops,
  selectPairSpotlightItem,
  type PairSpotlightItem,
} from "./pair-memory";
import { derivePairTrajectory } from "./pair-trajectory";
import { cleanMemberFacingText } from "./player-safe-copy";
import type { RevealCandidate } from "./player-knowledge";

export type CharacterPromptPacket = {
  system: string;
  prompt: string;
  messages?: ModelMessage[];
};

export function withCharacterVisibilityRetryGuard(
  packet: CharacterPromptPacket,
): CharacterPromptPacket {
  const retryText = CHARACTER_VISIBILITY_RETRY_GUARD_LINES.join("\n");

  return {
    ...packet,
    prompt: [packet.prompt, "", retryText].join("\n"),
    messages:
      packet.messages === undefined
        ? undefined
        : appendRetryTextToLastUserMessage(packet.messages, retryText),
  };
}

const CHARACTER_VISIBILITY_RETRY_GUARD_LINES = [
  "Retry guard: the previous attempt produced no usable spoken line after cleanup.",
  "Do not narrate an action, gesture, facial expression, or object movement.",
  "Write exactly one complete spoken reply now. Start with words the character says to the partner.",
  "No setup text, labels, notes, analysis, or empty response.",
] as const;

function appendRetryTextToLastUserMessage(
  messages: readonly ModelMessage[],
  retryText: string,
): ModelMessage[] {
  const lastUserIndex = findLastUserMessageIndex(messages);

  if (lastUserIndex === -1) {
    return [...messages, { role: "user", content: retryText }];
  }

  return messages.map((message, index) =>
    index === lastUserIndex && message.role === "user"
      ? appendRetryTextToUserMessage(message, retryText)
      : message,
  );
}

function findLastUserMessageIndex(messages: readonly ModelMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return index;
    }
  }

  return -1;
}

function appendRetryTextToUserMessage(
  message: UserModelMessage,
  retryText: string,
): UserModelMessage {
  return {
    ...message,
    content: appendRetryTextToContent(message.content, retryText),
  };
}

function appendRetryTextToContent(
  content: UserModelMessage["content"],
  retryText: string,
): UserModelMessage["content"] {
  if (typeof content === "string") {
    return [content, "", retryText].join("\n");
  }

  const textPartIndex = content.findIndex((part) => part.type === "text");

  if (textPartIndex === -1) {
    return [{ type: "text", text: retryText }, ...content];
  }

  return content.map((part, index) =>
    index === textPartIndex && part.type === "text"
      ? { ...part, text: [part.text, "", retryText].join("\n") }
      : part,
  );
}

export type CharacterPromptImageAttachment = {
  description: string;
  image: Uint8Array;
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
};

export type JudgePromptPacket = {
  system: string;
  prompt: string;
  messages?: ModelMessage[];
};

export type SummarizerPromptPacket = {
  system: string;
  prompt: string;
};

export type ClosureSummaryPromptPacket = {
  system: string;
  prompt: string;
};

export const RECENT_LINE_GUARD_COUNT = 3;

/**
 * Words that flag corporate consulting voice, therapy-speak, or AI slop in
 * Cupid corporate copy. Anything containing one of these in any case fails the
 * copy check and gets replaced with a deterministic fallback.
 */
export const CUPID_COPY_BANNED_PHRASES: readonly string[] = [
  "tapestry",
  "intricate",
  "myriad",
  "plethora",
  "unleash",
  "leverage",
  "harness",
  "elevate",
  "delve",
  "navigate",
  "navigating",
  "navigated",
  "journey",
  "chapter",
  "moreover",
  "in essence",
  "it is worth noting",
  "synergy",
  "synergies",
  "unlock potential",
  "unlocked potential",
  "unlocking potential",
  "deeper connection",
  "deep connection",
  "explored their feelings",
  "explored feelings",
  "navigated tension",
  "emotional landscape",
  "robust connection",
];

const REGEX_META_PATTERN = /[\\^$.*+?()[\]{}|]/g;
const CUPID_COPY_BANNED_PHRASE_PATTERNS: readonly RegExp[] = CUPID_COPY_BANNED_PHRASES.map(
  (phrase) => new RegExp(`\\b${phrase.replace(REGEX_META_PATTERN, "\\$&")}\\b`, "i"),
);

/**
 * Phrases that signal abstract, generic compatibility talk. They are not
 * universally banned, but if a summary contains one without naming any concrete
 * scene noun, it fails the copy check.
 */
export const CUPID_COPY_GENERIC_PATTERNS: readonly RegExp[] = [
  /\b(deep|deeper|profound|meaningful)\s+(connection|bond|level|understanding)\b/i,
  /\bgenuine\s+(connection|chemistry|spark)\b/i,
  /\b(common|shared)\s+ground\b/i,
  /\bbuilt\s+rapport\b/i,
  /\bfostered\s+\w+/i,
  /\bopen(ed)?\s+up\s+to\s+each\s+other\b/i,
  /\bemotional\s+(rollercoaster|journey)\b/i,
];

export type CupidCopyCheckResult =
  | { ok: true }
  | {
      ok: false;
      reason: "banned_phrase" | "generic_phrase" | "empty" | "too_long";
      offender?: string;
    };

/**
 * Checks Cupid corporate copy for banned phrases, generic abstractions, or
 * empty/overlong output. Returns the first reason for rejection.
 */
export function checkCupidCorporateCopy(
  text: string,
  options: { maxLength?: number } = {},
): CupidCopyCheckResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: "empty" };
  }

  const maxLength = options.maxLength ?? 320;

  if (trimmed.length > maxLength) {
    return { ok: false, reason: "too_long" };
  }

  for (let index = 0; index < CUPID_COPY_BANNED_PHRASE_PATTERNS.length; index += 1) {
    if (CUPID_COPY_BANNED_PHRASE_PATTERNS[index].test(trimmed)) {
      return { ok: false, reason: "banned_phrase", offender: CUPID_COPY_BANNED_PHRASES[index] };
    }
  }

  for (const pattern of CUPID_COPY_GENERIC_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: "generic_phrase", offender: pattern.source };
    }
  }

  return { ok: true };
}

export type CharacterPromptInput = {
  member: Member;
  partner: Member;
  scenario: DateScenario;
  session: DateSession;
  pairState: PairState;
  memoryPack: MemoryPack;
  focusRequest?: MemberRequest;
  memorySearchAvailable?: boolean;
  repetitionRetry?: { repeatedLine: string };
  rhythmRetry?: { repeatedPhrase: string; recentLine: string };
  imageAttachments?: readonly CharacterPromptImageAttachment[];
};

export function buildCharacterPromptPacket(input: CharacterPromptInput): CharacterPromptPacket {
  const { member, partner, scenario, session, pairState, memoryPack } = input;
  const visibleTranscript = filterCharacterVisibleTranscript({
    transcript: memoryPack.recentTranscript,
    session,
    member,
  });
  const isSpeakerOpeningTurn = !session.transcript.some(
    (message) => message.kind === "character" && message.speakerId === member.id,
  );
  const samples = pickSamplesForTurn({
    sampleMessages: member.voice.sampleMessages,
    dateHealth: session.dateHealth,
    isOpeningTurn: isSpeakerOpeningTurn,
    seed: `${session.id}:${session.currentTurn}:${member.id}`,
  });
  const recentSpeakerLines = collectRecentSpeakerLines(
    visibleTranscript,
    member.id,
    RECENT_LINE_GUARD_COUNT,
  );
  const recentPartnerLines = collectRecentSpeakerLines(
    visibleTranscript,
    partner.id,
    RECENT_LINE_GUARD_COUNT,
  );
  const pairTrajectory = derivePairTrajectory({ pairState, currentSession: session });
  const pairSpotlight = selectPairSpotlightItem(pairState);
  const dateNumber = pairState.completedDateIds.length + 1;
  const askLine =
    input.focusRequest === undefined || input.focusRequest.memberId !== member.id
      ? null
      : `What you most want to come out of tonight: ${input.focusRequest.text}`;
  const attachments = input.imageAttachments ?? [];

  const system = [
    `You are ${member.name}. People who know you call you ${member.firstName}.`,
    "",
    member.bio,
    "",
    "How you sound when you are fully you, for reference only, not lines to copy:",
    formatBulletList(samples),
    `Your voice comes across as ${member.voice.register}. Habits that may surface when they fit: ${joinAsSentence(member.voice.tics)} Habits are seasoning, not a script. Drop one the second it would sound forced or rehearsed.`,
    "",
    `What you want from tonight: ${joinAsSentence(member.relationshipNeeds)}`,
    `What relaxes you: ${joinAsSentence(member.preferences)}`,
    `What guards you up: ${joinAsSentence(member.dealbreakers)}`,
    `Private pressure that colors your tone but never gets said out loud: ${joinAsSentence(member.secrets)}`,
    ...(askLine === null ? [] : [askLine]),
    `How you are feeling tonight: mood is ${moodPhrase(member.state.mood)}, openness is ${opennessPhrase(member.state.openness)}, burnout is ${burnoutPhrase(member.state.burnout)}.`,
    "",
    "You signed up for Cupid, a dating app. The platform crosses dimensions, which means the person across from you tonight could be from another species, another reality, another timeline, or just a regular human. You will not always know which until you talk to them.",
    "A Cupid dating manager set this date up and can text you privately during it. Her notes come in like text messages. You can take her advice, push back on it, or ignore it. Your call.",
    `This is your ${ordinal(dateNumber)} date with ${partner.firstName} through Cupid.`,
    "",
    `You are at ${scenario.publicBrief.location}. ${scenario.publicBrief.whatBothCharactersKnow} The place feels like this: ${scenario.director.tone}.`,
    ...scenario.director.rules.map((rule) => `Worth remembering about this place: ${rule}`),
    "",
    `From ${partner.firstName}'s Cupid profile, which you read before tonight: ${truncateForPrompt(partner.datingProfile, 520)}`,
    `Their profile photo shows: ${partner.visualDescription}`,
    `Their listed height is ${formatMemberHeightLabel(partner.characterHeightInInches)}. Yours is ${formatMemberHeightLabel(member.characterHeightInInches)}.`,
    `You do not know ${partner.firstName}'s private biography, what they really are, or what they are hiding. You will find that out by talking to them.`,
    ...formatCharacterMemorySection(memoryPack, partner),
    ...formatCharacterPairContextSection(pairState, pairTrajectory, pairSpotlight, partner),
    "",
    "How you write:",
    "You are texting from the table. One short message at a time, usually one sentence, sometimes two. Plain text. No stage directions, no narration of your own actions, no speaker labels, no markdown, no bracketed asides, no em dashes, no en dashes.",
    `Reply to ${partner.firstName} like a person on a date, not like a stage actor. Do not summarize what ${partner.firstName} just said back at them. Do not try to close, seal, or wrap the date in one line.`,
    "Do not reuse the same sentence shape, opener, or approval phrase you just used. Do not echo your own earlier line.",
    "If the moment touches a dealbreaker or your private pressure, let that show before you try to be charming.",
    ...buildRepetitionRetryNotice(input.repetitionRetry),
    ...buildRhythmRetryNotice(input.rhythmRetry),
    ...buildRecentLineNotices({
      recentSpeakerLines,
      recentPartnerLines,
      partnerFirstName: partner.firstName,
    }),
    ...buildAttachmentSystemNotice(attachments, partner),
  ].join("\n");

  const threadMessages = buildCharacterThreadMessages({
    transcript: visibleTranscript,
    member,
    partner,
  });
  const messages = attachImagesToFinalUserMessage(threadMessages, attachments);

  return {
    system,
    prompt: formatPromptPreview([{ role: "system", content: system }, ...messages]),
    messages,
  };
}

function buildRecentLineNotices({
  recentSpeakerLines,
  recentPartnerLines,
  partnerFirstName,
}: {
  recentSpeakerLines: readonly string[];
  recentPartnerLines: readonly string[];
  partnerFirstName: string;
}): string[] {
  const notices: string[] = [];

  if (recentSpeakerLines.length > 0) {
    notices.push(
      "",
      "Your last lines, do not repeat or lightly reword:",
      formatRecentLinesBlock(recentSpeakerLines),
    );
  }

  if (recentPartnerLines.length > 0) {
    notices.push(
      `${partnerFirstName}'s last lines, do not echo verbatim:`,
      formatRecentLinesBlock(recentPartnerLines),
    );
  }

  return notices;
}

function buildAttachmentSystemNotice(
  attachments: readonly CharacterPromptImageAttachment[],
  partner: Member,
): string[] {
  if (attachments.length === 0) {
    return [];
  }

  return [
    "",
    `Photos are attached for visual grounding. They show ${partner.firstName} and the place. Do not mention the photos out loud.`,
  ];
}

function attachImagesToFinalUserMessage(
  messages: readonly ModelMessage[],
  attachments: readonly CharacterPromptImageAttachment[],
): ModelMessage[] {
  if (attachments.length === 0) {
    return [...messages];
  }

  const imageParts = attachments.map(
    (attachment): ImagePart => ({
      type: "image",
      image: attachment.image,
      mediaType: attachment.mediaType,
    }),
  );
  const noteText = `(Reference photos attached: ${attachments
    .map((attachment) => attachment.description)
    .join("; ")}.)`;
  const lastUserIndex = findLastUserIndex(messages);

  if (lastUserIndex === -1) {
    return [
      ...messages,
      {
        role: "user",
        content: [{ type: "text", text: noteText }, ...imageParts],
      },
    ];
  }

  const updated = [...messages];
  const lastUserMessage = updated[lastUserIndex];

  if (lastUserMessage === undefined || lastUserMessage.role !== "user") {
    return updated;
  }

  const existingText =
    typeof lastUserMessage.content === "string"
      ? lastUserMessage.content
      : (lastUserMessage.content.find((part): part is TextPart => part.type === "text")?.text ??
        "");
  const mergedText = `${existingText}\n\n${noteText}`;
  const textPart: TextPart = { type: "text", text: mergedText };

  updated[lastUserIndex] = {
    role: "user",
    content: [textPart, ...imageParts],
  };

  return updated;
}

function findLastUserIndex(messages: readonly ModelMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return index;
    }
  }

  return -1;
}

function formatCharacterMemorySection(memoryPack: MemoryPack, partner: Member): string[] {
  const lines: string[] = [];
  const selfMemories = memoryPack.self.filter((memory) => memory.text.trim().length > 0);
  const pairMemories = memoryPack.pair.filter((memory) => memory.text.trim().length > 0);
  const placeMemories = memoryPack.scenario.filter((memory) => memory.text.trim().length > 0);

  if (selfMemories.length > 0) {
    lines.push("", "What you remember about yourself that may matter tonight:");
    lines.push(formatCharacterMemoryList(selfMemories));
  }

  if (pairMemories.length > 0) {
    lines.push(`What you remember about ${partner.firstName} from earlier with them:`);
    lines.push(formatCharacterMemoryList(pairMemories));
  }

  if (placeMemories.length > 0) {
    lines.push("What you remember about this place:");
    lines.push(formatCharacterMemoryList(placeMemories));
  }

  return lines;
}

function formatCharacterPairContextSection(
  pairState: PairState,
  pairTrajectory: ReturnType<typeof derivePairTrajectory>,
  pairSpotlight: PairSpotlightItem | null,
  partner: Member,
): string[] {
  const lines: string[] = [];
  const activeAgreements = rankActiveAgreements(pairState);
  const openLoops = rankActiveOpenLoops(pairState);

  if (activeAgreements.length > 0) {
    lines.push(
      "",
      `Things you and ${partner.firstName} have already agreed on: ${activeAgreements
        .slice(0, 3)
        .map((agreement) => agreement.text)
        .join("; ")}`,
    );
  }

  if (openLoops.length > 0) {
    lines.push(
      `Things still hanging between you and ${partner.firstName}: ${openLoops
        .slice(0, 3)
        .map((loop) => loop.text)
        .join("; ")}`,
    );
  }

  const trajectoryLine = trajectoryAsCharacterVoice(pairTrajectory.state);

  if (trajectoryLine !== null) {
    lines.push(trajectoryLine);
  }

  const spotlightLine = spotlightAsCharacterVoice(pairSpotlight);

  if (spotlightLine !== null) {
    lines.push(spotlightLine);
  }

  return lines;
}

function trajectoryAsCharacterVoice(
  state: ReturnType<typeof derivePairTrajectory>["state"],
): string | null {
  switch (state) {
    case "closure_runway":
      return "How things have been between you two: close enough that something real could land tonight if neither of you forces it.";
    case "brittle":
      return "How things have been between you two: fragile. Whatever is unresolved should not have to carry the whole night.";
    case "recovering":
      return "How things have been between you two: there is repair on the table from earlier. Follow through counts more than fresh charm.";
    case "stuck":
      return "How things have been between you two: you have been circling. Picking up one unresolved thing matters more than starting something new.";
    case "warming":
      return "How things have been between you two: there is real warmth to work with. Let it get specific.";
    case "steady":
      return null;
    default:
      return null;
  }
}

function spotlightAsCharacterVoice(spotlight: PairSpotlightItem | null): string | null {
  if (spotlight === null) {
    return null;
  }

  if (spotlight.kind === "agreement") {
    return `The one thing to keep present as table stakes: ${spotlight.text}`;
  }

  return `The one thing still hanging that could move tonight: ${spotlight.text}`;
}

function formatCharacterMemoryList(memories: readonly { text: string }[]): string {
  return memories
    .map((memory) => `  - ${truncateForPrompt(cleanMemberFacingText(memory.text))}`)
    .join("\n");
}

function moodPhrase(value: number): string {
  if (value >= 70) return "good";
  if (value >= 50) return "steady";
  if (value >= 30) return "low";
  return "rough";
}

function opennessPhrase(value: number): string {
  if (value >= 65) return "open";
  if (value >= 40) return "measured";
  return "guarded";
}

function burnoutPhrase(value: number): string {
  if (value >= 65) return "high";
  if (value >= 35) return "present";
  return "low";
}

const ORDINAL_NAMES: readonly string[] = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
];

function ordinal(n: number): string {
  if (n >= 1 && n <= ORDINAL_NAMES.length) {
    return ORDINAL_NAMES[n - 1];
  }

  const lastTwo = n % 100;
  const lastOne = n % 10;

  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${n}th`;
  }

  if (lastOne === 1) return `${n}st`;
  if (lastOne === 2) return `${n}nd`;
  if (lastOne === 3) return `${n}rd`;

  return `${n}th`;
}

function filterCharacterVisibleTranscript({
  transcript,
  session,
  member,
}: {
  transcript: DateMessage[];
  session: DateSession;
  member: Member;
}): DateMessage[] {
  const interventionActive = isInterventionActiveForMember(session, member.id);
  return transcript.filter(
    (message) =>
      message.kind !== "cupid" ||
      (interventionActive && isCurrentInterventionMessage(session, message, member.id)),
  );
}

export const SCENARIO_EVENT_KIND_SUFFIXES: Record<ScenarioEventKind, string> = {
  ambient: "Treat this as ambient texture. The character may notice it or move on as feels true.",
  provocation:
    "This is a physical interruption. The character must register and react before resuming.",
  reveal:
    "This puts something honest into the open. The character chooses how to be seen, drawing only on their own brief, filed reads, or pair history.",
};

export function formatDirectorInstructionWithKindSuffix(
  directorInstruction: string,
  kind: ScenarioEventKind,
): string {
  const trimmed = directorInstruction.trimEnd();
  const needsTerminator = !/[.!?]$/.test(trimmed);
  const punctuated = needsTerminator ? `${trimmed}.` : trimmed;
  return `${punctuated} ${SCENARIO_EVENT_KIND_SUFFIXES[kind]}`;
}

export function buildJudgePromptPacket({
  scenario,
  session,
  pairState,
  exchangeMessages,
  members,
  revealCandidates,
}: {
  scenario: DateScenario;
  session: DateSession;
  pairState: PairState;
  exchangeMessages: DateMessage[];
  members: Member[];
  revealCandidates?: readonly RevealCandidate[];
}): JudgePromptPacket {
  const system = [
    "You are the IDC Judge.",
    "Score the exchange with structured output only.",
    "Validate game state consequences. Do not perform characters.",
    "Player-facing summaries use Cupid corporate voice: dry, procedural, specific, never therapy-speak.",
    "Accepted playerSummary examples:",
    '- "Vhool conceded the receipt. Trust is up, recruiting talk is off the table."',
    '- "Coffee escalated. Jenna held the room. Spark filed."',
    '- "Pair stalled on the same plan twice. Cupid recommends a sharper next ask."',
    "Rejected playerSummary patterns:",
    "- generic compatibility statements like the pair connected on a deeper level",
    "- therapy-speak like they explored their feelings or navigated tension",
    "- corporate consulting voice like leveraging synergies or unlocking potential",
    "- AI slop verbs: delve, navigate, leverage, harness, unleash, elevate",
    "- action ownership claims that invert speaker roles, such as saying someone deferred control after they asked and then acted",
    'Accepted notableMoments examples: "Vhool offered the receipt."; "Coffee unspilled at turn 4."; "Jenna refused to recruit."',
  ].join("\n");
  const candidates = revealCandidates ?? [];
  const candidateLines = formatRevealCandidatesForPrompt(candidates);
  const pairTrajectory = derivePairTrajectory({ pairState, currentSession: session });
  const pairSpotlight = selectPairSpotlightItem(pairState);
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        "Structured output contract:",
        "Return JSON only. No Markdown, comments, or prose outside JSON.",
        "dateHealthDelta must be an integer from -18 to 14.",
        "statDeltas may include chemistry, trust, stability, conflict, weirdnessTolerance, spark, strain, and relationshipHealth. Each value must be an integer from -8 to 8.",
        `memberMoodDeltas must use only these member ids: ${session.participants.join(", ")}. Each value must be an integer from -8 to 8.`,
        "shouldEndEarly is true only when the exchange requires the date to stop now.",
        "Omit earlyEndReason unless shouldEndEarly is true.",
        'endSentiment must be "positive" when the pair is leaving together (escalation, going home together, sealed connection), "negative" when they are storming out or shutting it down, or null when shouldEndEarly is false.',
        "notableMoments must contain 1 to 3 short strings, each anchored in a concrete scene detail.",
        "playerSummary must be one short Cupid corporate sentence. Name a concrete pair detail or move. Skip therapy-speak, consulting jargon, and AI slop.",
        "Evidence discipline:",
        "Base playerSummary and notableMoments on visible actions in this exchange. Do not convert tone, confidence, or approval into a role claim by itself.",
        "Use agency verbs only when the transcript proves the actor. Agency verbs include led, deferred, offered, accepted, refused, took over, dominated, yielded, shared, managed, handled, sent, chose, split, gave, and asked.",
        "Do not say a member deferred, yielded, led, took over, or handed off unless that member's own line or a scene line explicitly shows that move.",
        "Asking the partner whether they want a turn, then acting after they answer, is checking preference, not deferring control.",
        "If the role read is ambiguous, write the visible move instead: Alex asked Sam about first dibs, Sam told Alex to send it, Alex ordered the meat.",
        "memoryCandidates must be an empty array.",
        "usedEvidenceIds must be an array of 0 to 3 ids drawn only from the reveal candidate list below. Do not invent ids. Do not paraphrase ids. Return an empty array if the exchange did not make any candidate matter.",
        "agreementCandidates may contain at most 2 concrete pair agreements newly made in this exchange. Use only plain player-safe text. Do not include stat numbers or hidden labels.",
        "agreementUpdates may contain active agreement ids only when this exchange clearly honored, broke, or retired that agreement.",
        "openLoopCandidates may contain at most 2 unresolved hooks created by the exchange: a dodged question, promise, named preference, or unfinished plan.",
        "openLoopUpdates may contain active open loop ids only when this exchange clearly resolved or dropped that item.",
        "Dynamic scoring guidance:",
        "Use positive Date Health only when the exchange creates evidence of warmth, trust, repair, or useful attraction.",
        "Use negative Date Health when a member dodges a direct answer, repeats logistics, crosses a boundary, performs at the partner, makes the partner manage them, or lets the room become the whole relationship.",
        "Use -1 to -3 for mild drift, -4 to -7 for visible confusion or cooling, and -8 to -18 for boundary pressure, contempt, panic, hard mismatch, or a failed repair.",
        "Use negative memberMoodDeltas for the member who is confused, guarded, embarrassed, angry, or overloaded.",
        "Raise conflict or strain when the exchange creates irritation, pressure, public discomfort, or a boundary crossing.",
        "If an early end trigger is visibly met, set shouldEndEarly true even when Date Health remains above zero.",
        "Do not use em dashes or en dashes in any string.",
        `Shape: {"dateHealthDelta":0,"statDeltas":{"spark":0,"strain":0,"relationshipHealth":0},"memberMoodDeltas":{"${session.participants[0]}":0,"${session.participants[1]}":0},"shouldEndEarly":false,"endSentiment":null,"notableMoments":["short note"],"playerSummary":"Cupid filed the exchange.","memoryCandidates":[],"usedEvidenceIds":[],"agreementCandidates":[],"agreementUpdates":[],"openLoopCandidates":[],"openLoopUpdates":[]}`,
        "",
        `Scenario: ${scenario.title}.`,
        `Scenario pressure: risk ${scenario.card.risk}, intimacy ${scenario.card.intimacy}, chaos ${scenario.card.chaos}.`,
        `Participants: ${formatParticipants(members)}.`,
        "Member briefs, private scoring context only. Use these notes to interpret behavior. Do not reveal fixture notes in playerSummary unless the exchange made the detail explicit.",
        "Do not expose species, origin, dimension, reality status, bio, or exact member state as case-file labels in playerSummary or notableMoments.",
        formatJudgeMemberBriefs(members),
        `Rubric success signals: ${scenario.judgeRubric.successSignals.join("; ")}.`,
        `Rubric failure signals: ${scenario.judgeRubric.failureSignals.join("; ")}.`,
        `Early end triggers: ${scenario.director.earlyEndTriggers.join("; ")}.`,
        `Current Date Health: ${session.dateHealth}.`,
        `Current pair stats: ${JSON.stringify(pairState.stats)}.`,
        `Active pair agreements: ${formatActiveAgreementIds(pairState)}.`,
        `Open pair loops: ${formatOpenLoopIds(pairState)}.`,
        `Pair file guidance: ${pairTrajectory.judgeGuidance}`,
        `Pair file subtext: ${formatPairTrajectorySubnotes(pairTrajectory.subnotes)}`,
        `Pair spotlight: ${formatPairSpotlight(pairSpotlight)}`,
        "Prior judge filings follow as assistant messages. Treat them as your own previous rulings, not as new gameplay authority.",
        ...candidateLines,
      ].join("\n"),
    },
    ...buildJudgeThreadMessages(session.judgeSnapshots),
    {
      role: "user",
      content: [
        `Current exchange index: ${exchangeIndexForPendingTurn(exchangeMessages, session.judgeSnapshots.length)}.`,
        "Judge only this pending exchange while respecting prior filings and current deterministic state.",
        `Exchange:\n${formatLabeledTranscript(exchangeMessages, members)}`,
      ].join("\n"),
    },
  ];

  return {
    system,
    prompt: formatPromptPreview(messages),
    messages,
  };
}

function formatRevealCandidatesForPrompt(candidates: readonly RevealCandidate[]): string[] {
  if (candidates.length === 0) {
    return ["", "Reveal candidates: none for this exchange. Return usedEvidenceIds as []."];
  }

  const lines = [
    "",
    "Reveal candidates:",
    "Use these ids only if the exchange made the evidence matter. Hard stops always count.",
    "Return at most 3 usedEvidenceIds. Do not invent ids. It is valid to return an empty array.",
  ];

  for (const candidate of candidates) {
    lines.push(`- id: ${candidate.id}`);
    lines.push(`  read: ${candidate.readText}`);
    lines.push(`  evidence: ${candidate.evidenceText}`);
  }

  return lines;
}

export function buildSummarizerPromptPacket({
  session,
  members,
  finalJudgeSnapshot,
}: {
  session: DateSession;
  members: Member[];
  finalJudgeSnapshot: JudgeSnapshot | undefined;
}): SummarizerPromptPacket {
  return {
    system: [
      "Summarize completed IDC dates into compact memory records.",
      "Memory text is plain prose used for retrieval.",
      "Anchor each memory in a concrete object, place, or move from the date. Skip generic vibes.",
      "Do not store full transcript chunks.",
      "Avoid AI slop: tapestry, intricate, myriad, plethora, unleash, leverage, harness, elevate, delve, navigate, journey, chapter.",
    ].join("\n"),
    prompt: [
      "Structured output contract:",
      "Return a JSON array only. No Markdown, comments, or prose outside JSON.",
      "Return 2 to 5 memory objects when the transcript has more than one exchange. Return 1 to 3 only for very short dates.",
      `Each object must use "scope":"pair", "visibility":"public", "subjectIds":["${session.participants[0]}","${session.participants[1]}"], "pairId":"${session.pairId}", "scenarioId":"${session.scenarioId}", "dateSessionId":"${session.id}", and importance from 1 to 5.`,
      "Use tags with short snake_case strings. Include date_summary plus one of interaction, revealed_info, feeling, callback, or commitment.",
      "Each memory must be one discrete searchable fact from the date, not a compressed recap of the whole conversation.",
      "Memory text must be one faithful sentence anchored in a named object, room beat, revealed profile detail, changed feeling, question, answer, or commitment, and must not copy the full transcript.",
      "Preserve soft canon that mattered: improvised objects, orders, invented same-day anecdotes, callbacks, and small commitments when a partner accepted or reacted to them.",
      "Preserve revealed information that later performers need because they do not receive the partner's private file.",
      "Store how the pair treated each other only when the transcript shows the move: who asked, refused, trusted, dodged, softened, or followed up.",
      "Do not preserve obvious contradictions, one-off non sequiturs, hidden secrets stated as fact, future events, or gameplay effects unless deterministic state already confirmed them.",
      "Do not include exact Date Health, Spark, Strain, Health, stat values, or stat deltas in memory text.",
      "Prefer memories that help the pair continue a later conversation over generic compatibility summaries.",
      "Do not use em dashes or en dashes in any string.",
      "Reject phrases like deeper connection, explored their feelings, navigated tension, or unlocked potential. Use plain operational nouns instead.",
      `Shape: [{"scope":"pair","visibility":"public","subjectIds":["${session.participants[0]}","${session.participants[1]}"],"pairId":"${session.pairId}","scenarioId":"${session.scenarioId}","dateSessionId":"${session.id}","text":"One faithful sentence about a searchable interaction or reveal.","tags":["date_summary","interaction"],"importance":3}]`,
      "",
      `Date session: ${session.id}. Pair: ${session.pairId}. Scenario: ${session.scenarioId}.`,
      `Participants: ${formatParticipants(members)}.`,
      `Final judge summary: ${finalJudgeSnapshot?.playerSummary ?? "No judge summary."}`,
      `Transcript:\n${formatLabeledTranscript(session.transcript, members)}`,
    ].join("\n"),
  };
}

export function buildClosureSummaryPromptPacket({
  members,
  pairId,
  pairMemories,
  lastFinalReport,
  lastSessionScenarioTitle,
}: {
  members: [Member, Member];
  pairId: string;
  pairMemories: readonly { text: string; tags: readonly string[]; importance: number }[];
  lastFinalReport: {
    outcome: string;
    summary: string;
    statSummary: string;
  };
  lastSessionScenarioTitle: string;
}): ClosureSummaryPromptPacket {
  const [first, second] = members;
  const sharedHistory = pairMemories
    .slice(-8)
    .map(
      (memory, index) =>
        `${index + 1}. ${truncateForPrompt(cleanMemberFacingText(memory.text))} (tags: ${memory.tags.join(", ") || "none"})`,
    )
    .join("\n");

  return {
    system: [
      "You are filing a single warm closure note for an IDC pair that is leaving together.",
      "Voice: workplace-comedy professional, warm, specific, short.",
      "Anchor the note in 1 to 3 concrete shared moments from the supplied history.",
      "Never editorialize about Cupid, the company, the app, or the agency.",
      "Never include exact stat numbers, Date Health values, Spark, Strain, or percentages.",
      "Never use em dashes or en dashes. Use commas, periods, colons, or separate sentences.",
      "Avoid AI-slop filler such as `tapestry`, `intricate`, `myriad`, `unleash`, `leverage`, `elevate`.",
      "Death and serious-injury copy is never funny.",
      "Return plain prose only. No Markdown, no JSON, no preface.",
    ].join("\n"),
    prompt: [
      `Pair: ${pairId}. Members: ${first.firstName} (${first.name}) and ${second.firstName} (${second.name}).`,
      `Final date: ${lastSessionScenarioTitle}. Outcome filed: ${lastFinalReport.outcome}.`,
      `Last final report summary: ${cleanMemberFacingText(lastFinalReport.summary)}`,
      `Case read: ${cleanMemberFacingText(lastFinalReport.statSummary)}`,
      "",
      "Shared history notes (most recent last):",
      sharedHistory.length > 0 ? sharedHistory : "No prior pair notes on file.",
      "",
      "Write 2 to 4 sentences. The first sentence should anchor the pair in a specific shared moment.",
      "The closing sentence should land soft and forward looking, without naming Cupid or the app.",
      `Use ${first.firstName} and ${second.firstName}, not generic pronouns.`,
      "Plain text only.",
    ].join("\n"),
  };
}

export function pickSamplesForTurn({
  sampleMessages,
  dateHealth,
  isOpeningTurn,
  seed,
}: {
  sampleMessages: MemberSampleMessages;
  dateHealth: number;
  isOpeningTurn: boolean;
  seed: string;
}): string[] {
  const weights = bucketWeights(dateHealth, isOpeningTurn);
  const buckets: Array<{ items: readonly string[]; count: number; key: string }> = [
    { items: sampleMessages.opener, count: weights.opener, key: "opener" },
    { items: sampleMessages.warming, count: weights.warming, key: "warming" },
    { items: sampleMessages.cooling, count: weights.cooling, key: "cooling" },
    { items: sampleMessages.crashingOut, count: weights.crashingOut, key: "crashingOut" },
  ];
  const picks: string[] = [];

  for (const bucket of buckets) {
    if (bucket.count === 0) {
      continue;
    }

    picks.push(...deterministicPick(bucket.items, `${seed}:${bucket.key}`, bucket.count));
  }

  return picks;
}

function bucketWeights(
  dateHealth: number,
  isOpeningTurn: boolean,
): {
  opener: number;
  warming: number;
  cooling: number;
  crashingOut: number;
} {
  if (!isOpeningTurn) {
    if (dateHealth >= 65) {
      return { opener: 0, warming: 3, cooling: 1, crashingOut: 0 };
    }

    if (dateHealth >= 40) {
      return { opener: 0, warming: 2, cooling: 2, crashingOut: 0 };
    }

    if (dateHealth >= 15) {
      return { opener: 0, warming: 1, cooling: 2, crashingOut: 1 };
    }

    return { opener: 0, warming: 0, cooling: 2, crashingOut: 2 };
  }

  if (dateHealth >= 65) {
    return { opener: 2, warming: 1, cooling: 1, crashingOut: 0 };
  }

  if (dateHealth >= 40) {
    return { opener: 1, warming: 2, cooling: 1, crashingOut: 0 };
  }

  if (dateHealth >= 15) {
    return { opener: 0, warming: 1, cooling: 2, crashingOut: 1 };
  }

  return { opener: 0, warming: 1, cooling: 1, crashingOut: 2 };
}

function deterministicPick<T>(items: readonly T[], seed: string, count: number): T[] {
  if (items.length === 0 || count <= 0) {
    return [];
  }

  if (items.length <= count) {
    return [...items];
  }

  return items
    .map((item, index) => ({
      item,
      index,
      score: hashSeed(`${seed}:${index}`),
    }))
    .sort((first, second) => first.score - second.score || first.index - second.index)
    .slice(0, count)
    .map((entry) => entry.item);
}

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function buildCharacterThreadMessages({
  transcript,
  member,
  partner,
}: {
  transcript: DateMessage[];
  member: Member;
  partner: Member;
}): ModelMessage[] {
  if (transcript.length === 0) {
    return [
      {
        role: "user",
        content: `You and ${partner.firstName} have just sat down. Open the conversation.`,
      },
    ];
  }

  const messages: ModelMessage[] = [];
  let batch: string[] = [];

  const flushBatch = () => {
    if (batch.length === 0) {
      return;
    }

    messages.push({ role: "user", content: batch.join("\n\n") });
    batch = [];
  };

  for (const message of transcript) {
    if (message.kind === "character" && message.speakerId === member.id) {
      flushBatch();
      messages.push({ role: "assistant", content: message.text });
      continue;
    }

    batch.push(formatIncomingThreadMessage(message));
  }

  flushBatch();

  return messages;
}

function formatIncomingThreadMessage(message: DateMessage): string {
  if (message.kind === "character") {
    return message.text;
  }

  if (message.kind === "scenario") {
    return `This just happened: ${message.text}`;
  }

  if (message.kind === "cupid") {
    return `Your dating manager just texted you: "${stripCupidNudgePrefix(message.text)}"`;
  }

  return message.text;
}

function stripCupidNudgePrefix(text: string): string {
  const cupidPrefix = "Cupid suggests:";
  const trimmed = text.trimStart();

  if (trimmed.toLowerCase().startsWith(cupidPrefix.toLowerCase())) {
    return trimmed.slice(cupidPrefix.length).trimStart();
  }

  return trimmed;
}

function formatPromptPreview(messages: ModelMessage[]): string {
  return messages
    .map(
      (message) => `${message.role.toUpperCase()}:\n${formatPromptPreviewContent(message.content)}`,
    )
    .join("\n\n");
}

function formatPromptPreviewContent(content: ModelMessage["content"]): string {
  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) => {
      if (part.type === "text") {
        return part.text;
      }

      if (part.type === "image") {
        return `[attached image: ${part.mediaType ?? "auto"}]`;
      }

      if (part.type === "file") {
        return `[attached file: ${part.filename ?? part.mediaType}]`;
      }

      return JSON.stringify(part);
    })
    .join("\n");
}

function formatBulletList(items: readonly string[]): string {
  if (items.length === 0) {
    return "  None.";
  }

  return items.map((item) => `  - ${item}`).join("\n");
}

function joinAsSentence(items: readonly string[]): string {
  if (items.length === 0) {
    return "None listed.";
  }

  const text = items.join("; ");
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function formatActiveAgreementIds(pairState: PairState): string {
  const active = rankActiveAgreements(pairState);
  if (active.length === 0) {
    return "none";
  }

  return active
    .slice(0, 5)
    .map((agreement) => `${agreement.id}: ${agreement.text}`)
    .join("; ");
}

function formatOpenLoopIds(pairState: PairState): string {
  const open = rankActiveOpenLoops(pairState);
  if (open.length === 0) {
    return "none";
  }

  return open
    .slice(0, 5)
    .map((loop) => `${loop.id}: ${loop.text}`)
    .join("; ");
}

function formatPairTrajectorySubnotes(subnotes: readonly string[]): string {
  if (subnotes.length === 0) {
    return "No extra pair subtext.";
  }

  return subnotes.slice(0, 4).join(" ");
}

function formatPairSpotlight(spotlightItem: PairSpotlightItem | null): string {
  if (spotlightItem === null) {
    return "No single pair item is being emphasized.";
  }

  return `${spotlightItem.guidance} Use as subtext only.`;
}

function formatParticipants(members: Member[]): string {
  return members.map((member) => `${member.id} (${member.name})`).join(", ");
}

function formatJudgeMemberBriefs(members: Member[]): string {
  return members.map(formatJudgeMemberBrief).join("\n");
}

function formatJudgeMemberBrief(member: Member): string {
  return [
    `- ${member.id} (${member.name})`,
    `  identity: ${member.species}; ${member.realityStatus}; origin: ${member.origin}; dimension: ${member.dimension}.`,
    `  profile: ${truncateForPrompt(member.datingProfile)}`,
    `  brief: ${truncateForPrompt(member.bio)}`,
    `  wants: ${joinAsSentence(member.relationshipNeeds)}`,
    `  relaxes around: ${joinAsSentence(member.preferences)}`,
    `  guarded around: ${joinAsSentence(member.dealbreakers)}`,
    `  current pressure: ${formatJudgeMemberPressure(member)}`,
  ].join("\n");
}

function formatJudgeMemberPressure(member: Member): string {
  return [
    `mood ${scoreBand(member.state.mood, {
      low: "strained",
      middle: "steady",
      high: "good",
    })}`,
    `openness ${scoreBand(member.state.openness, {
      low: "guarded",
      middle: "measured",
      high: "open",
    })}`,
    `burnout ${scoreBand(member.state.burnout, {
      low: "low",
      middle: "present",
      high: "high",
    })}`,
  ].join(", ");
}

function scoreBand(value: number, labels: { low: string; middle: string; high: string }): string {
  if (value >= 70) {
    return labels.high;
  }

  if (value >= 40) {
    return labels.middle;
  }

  return labels.low;
}

function buildJudgeThreadMessages(judgeSnapshots: readonly JudgeSnapshot[]): ModelMessage[] {
  return judgeSnapshots.slice(-6).flatMap((snapshot) => [
    {
      role: "user" as const,
      content: `Prior judge filing for exchange ${snapshot.exchangeIndex}:`,
    },
    {
      role: "assistant" as const,
      content: JSON.stringify(formatJudgeSnapshotForThread(snapshot)),
    },
  ]);
}

function formatJudgeSnapshotForThread(snapshot: JudgeSnapshot) {
  return {
    dateHealthDelta: snapshot.dateHealthDelta,
    statDeltas: snapshot.statDeltas,
    memberMoodDeltas: snapshot.memberMoodDeltas,
    shouldEndEarly: snapshot.shouldEndEarly,
    earlyEndReason: snapshot.earlyEndReason,
    notableMoments: snapshot.notableMoments,
    playerSummary: snapshot.playerSummary,
    memoryCandidates: [],
    agreementCandidates: snapshot.agreementCandidates,
    agreementUpdates: snapshot.agreementUpdates,
    openLoopCandidates: snapshot.openLoopCandidates,
    openLoopUpdates: snapshot.openLoopUpdates,
  };
}

function formatLabeledTranscript(messages: DateMessage[], members: Member[]): string {
  if (messages.length === 0) {
    return "No messages yet.";
  }

  const speakerLabels = new Map(members.map((member) => [member.id, member.name] as const));

  return messages
    .map((message) => {
      if (message.kind === "character") {
        return `${speakerLabels.get(message.speakerId) ?? "Member"}: ${message.text}`;
      }

      if (message.kind === "scenario") {
        return `Scene: ${message.text}`;
      }

      if (message.kind === "cupid") {
        return `Cupid: ${message.text}`;
      }

      return `System: ${message.text}`;
    })
    .join("\n");
}

function truncateForPrompt(text: string, maxLength = 220): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

export function collectRecentSpeakerLines(
  transcript: readonly DateMessage[],
  speakerId: string,
  count: number,
): string[] {
  const lines: string[] = [];

  for (let index = transcript.length - 1; index >= 0 && lines.length < count; index -= 1) {
    const message = transcript[index];

    if (message?.kind === "character" && message.speakerId === speakerId) {
      lines.unshift(message.text);
    }
  }

  return lines;
}

function formatRecentLinesBlock(lines: readonly string[]): string {
  if (lines.length === 0) {
    return "  None yet.";
  }

  return lines.map((line, index) => `  ${index + 1}. ${line}`).join("\n");
}

function buildRepetitionRetryNotice(retry: { repeatedLine: string } | undefined): string[] {
  if (retry === undefined) {
    return [];
  }

  return [
    "",
    "Retry guard:",
    `Your previous attempt was rejected because it repeated this prior line: "${retry.repeatedLine}".`,
    "Do not repeat that line or a lightly reworded version. Make a different conversational move.",
  ];
}

function buildRhythmRetryNotice(
  retry: { repeatedPhrase: string; recentLine: string } | undefined,
): string[] {
  if (retry === undefined) {
    return [];
  }

  return [
    "",
    "Rhythm retry:",
    `Your previous attempt reused the approval phrase "${retry.repeatedPhrase}" from this recent line: "${retry.recentLine}".`,
    "Rewrite with a different sentence shape and no approval opener.",
    "Do not ask a tidy follow-up unless the partner explicitly needs one.",
  ];
}

const REPEATED_APPROVAL_PATTERNS: readonly { label: string; pattern: RegExp }[] = [
  { label: "I respect", pattern: /\bi\s+respect\b/i },
  { label: "works for me", pattern: /\bworks\s+for\s+me\b/i },
  { label: "that's fair", pattern: /\bthat(?:'s| is)\s+fair\b/i },
  { label: "for sure", pattern: /^for\s+sure\b/i },
  { label: "go on", pattern: /^go\s+on\b/i },
  { label: "okay", pattern: /^okay\b/i },
  { label: "fair", pattern: /^fair\b/i },
  { label: "good", pattern: /^good\b/i },
  { label: "right", pattern: /^right\b/i },
];

export function hasRepeatedApprovalPhrase(input: {
  text: string;
  recentLines: readonly string[];
}): { repeatedPhrase: string; recentLine: string } | null {
  for (const approval of REPEATED_APPROVAL_PATTERNS) {
    if (!approval.pattern.test(input.text)) {
      continue;
    }

    const recentLine = input.recentLines.find((line) => approval.pattern.test(line));

    if (recentLine !== undefined) {
      return {
        repeatedPhrase: approval.label,
        recentLine,
      };
    }
  }

  return null;
}

const REPETITION_TOKEN_PATTERN = /[a-z0-9]+/g;

export function hasNearDuplicateRecentLine(input: {
  text: string;
  recentLines: readonly string[];
  jaccardThreshold?: number;
}): { repeatedLine: string } | null {
  const threshold = input.jaccardThreshold ?? 0.6;
  const candidateTokens = tokenizeForRepetition(input.text);

  if (candidateTokens.size < 4) {
    const normalizedCandidate = normalizeForRepetitionCompare(input.text);
    for (const recent of input.recentLines) {
      if (normalizeForRepetitionCompare(recent) === normalizedCandidate) {
        return { repeatedLine: recent };
      }
    }

    return null;
  }

  for (const recent of input.recentLines) {
    const recentTokens = tokenizeForRepetition(recent);

    if (recentTokens.size < 4) {
      continue;
    }

    const similarity = jaccardSimilarity(candidateTokens, recentTokens);

    if (similarity >= threshold) {
      return { repeatedLine: recent };
    }
  }

  return null;
}

function tokenizeForRepetition(text: string): Set<string> {
  const tokens = new Set<string>();
  const matches = text.toLowerCase().match(REPETITION_TOKEN_PATTERN);

  if (matches === null) {
    return tokens;
  }

  for (const token of matches) {
    if (token.length >= 3) {
      tokens.add(token);
    }
  }

  return tokens;
}

function normalizeForRepetitionCompare(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function jaccardSimilarity(first: ReadonlySet<string>, second: ReadonlySet<string>): number {
  if (first.size === 0 && second.size === 0) {
    return 0;
  }

  let intersection = 0;
  const smaller = first.size <= second.size ? first : second;
  const larger = smaller === first ? second : first;

  for (const value of smaller) {
    if (larger.has(value)) {
      intersection += 1;
    }
  }

  const union = first.size + second.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
