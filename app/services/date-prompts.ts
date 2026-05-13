import type { ImagePart, ModelMessage, TextPart } from "ai";

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
  lastTriggeredEvent,
} from "./date-engine";
import type { RevealCandidate } from "./player-knowledge";

export type CharacterPromptPacket = {
  system: string;
  prompt: string;
  messages?: ModelMessage[];
};

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
  imageAttachments?: readonly CharacterPromptImageAttachment[];
};

export function buildCharacterPromptPacket(input: CharacterPromptInput): CharacterPromptPacket {
  const { member, partner, scenario, session, pairState, memoryPack } = input;
  const visibleTranscript = filterCharacterVisibleTranscript({
    transcript: memoryPack.recentTranscript,
    session,
    member,
  });
  const currentEvent = lastTriggeredEvent(scenario, session);
  const phase = phaseForTurn(session.currentTurn + 1, session.turnLimit);
  const isSpeakerOpeningTurn = !session.transcript.some(
    (message) => message.kind === "character" && message.speakerId === member.id,
  );
  const samples = pickSamplesForTurn({
    sampleMessages: member.voice.sampleMessages,
    dateHealth: session.dateHealth,
    isOpeningTurn: isSpeakerOpeningTurn,
    seed: `${session.id}:${session.currentTurn}:${member.id}`,
  });
  const partnerOpener = pickPartnerOpener({
    sampleMessages: partner.voice.sampleMessages,
    seed: `${session.id}:${session.currentTurn}:${partner.id}:partner`,
  });
  const requestLine =
    input.focusRequest === undefined || input.focusRequest.memberId !== member.id
      ? ""
      : ` Your ask today: "${input.focusRequest.text}".`;
  const latestIncomingLine = formatLatestIncomingLine(visibleTranscript, member, partner);
  const latestSelfLine = formatLatestSelfLine(visibleTranscript, member);
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
  const currentSceneLines = formatCurrentSceneLines({
    scenario,
    partner,
    isOpeningTurn: isSpeakerOpeningTurn,
  });
  const memorySearchAvailable = input.memorySearchAvailable ?? true;

  const system = [
    `You are ${member.name}.`,
    `You are on a date with ${partner.name}.`,
    "Write only what you would say as the next message.",
    "Make it sound like a believable reply in a date conversation, not a voice sample.",
    "Use your private brief, the place, allowed memories, and the back and forth so far as grounding.",
    memorySearchAvailable
      ? "If allowed memories are not enough, use the memory search tool before speaking."
      : "If allowed memories are not enough, stay within the supplied prompt context.",
    "You may add soft improv when it stays small, plausible, and answerable by the partner.",
    "Cupid may send private advice through the app. You may accept, resist, or ignore it in character.",
    "Your origin, dimension, reality status, and reason for using Cupid are your lived context.",
    "React to strange or ordinary claims from that context. Believe, doubt, argue, accept, or misunderstand as feels true.",
    "Secrets shape your tone as subtext only. Never state them aloud.",
    "Stay inside the date. Never mention hidden notes, compatibility labels, private memory from another member, or future events.",
  ].join("\n");
  const setupMessage = [
    "Character card:",
    `${member.name}: ${member.bio}`,
    `Your frame for Cupid: origin ${member.origin}; dimension ${member.dimension}; species ${member.species}; reality status ${member.realityStatus}.`,
    `What you are trying to get from this date: ${joinAsSentence(member.relationshipNeeds)}`,
    `What makes you relax: ${joinAsSentence(member.preferences)}`,
    `What makes you guarded: ${joinAsSentence(member.dealbreakers)}`,
    `Private pressure, for subtext only: ${joinAsSentence(member.secrets)}`,
    `Today: mood ${member.state.mood}, openness ${member.state.openness}, burnout ${member.state.burnout}.${requestLine}`,
    "",
    "Personality in conversation:",
    `You come across as ${member.voice.register}.`,
    `Habits that may surface when they fit: ${joinAsSentence(member.voice.tics)}`,
    "Do not force every habit into the line. Do not announce the habit. Let one pressure point shape the reply.",
    "Habits must be speakable to the partner. Convert written asides, fake labels, and bracketed notes into normal spoken asides.",
    "Your voice is not a quota. It is how you notice things, dodge things, ask for things, and protect yourself.",
    "",
    "Current date:",
    ...currentSceneLines,
    "This is what is actually in front of you. Use it as grounding, not narration.",
    "Current date facts are the floor, not the ceiling. You may add small plausible details that make the date feel lived in.",
    "Soft improv can include a drink, a snack, a nearby object, a small thing you did today, or a personal anecdote.",
    "If the partner asks about an undefined part of your world, you may answer with small lore that fits your frame.",
    "Do not use soft improv to change the venue, the participants, hidden secrets, Cupid's systems, hidden outcomes, future events, or serious harm.",
    "If the conversation already introduced a soft detail and nobody contradicted it, treat it as true for this date.",
    "Treat profile details as app context from before this date, not things the partner said tonight. If you use them, call them profile details or ask about them.",
    "",
    "Reference lines:",
    formatBulletList(samples),
    "Do not copy opener scaffolds after your first message. Do not repeat titles, job labels, species labels, or app premise unless the latest line directly asks.",
    "These are voice examples only. Their objects, meals, venues, schedules, and claims are not automatically true here.",
    "",
    "Partner read:",
    `${partner.name}. ${partner.bio}`,
    `Their public frame: ${partner.species}. ${partner.realityStatus}.`,
    `One line that shows their energy: ${partnerOpener}`,
    "Listen to what they mean. Do not imitate their vocabulary or performance.",
    "Do not assume their claims are true or false because the prompt says so. Let your own frame decide how you receive them.",
    "",
    "Place brief:",
    `Date setting: ${scenario.title}, ${scenario.publicBrief.location}.`,
    `Shared premise: ${scenario.publicBrief.whatBothCharactersKnow}`,
    `Where the date is: ${phase.label}. ${phase.instruction}`,
    currentEvent === undefined
      ? "Live room event: none right now."
      : `Live room event: ${currentEvent.characterVisibleText}`,
    currentEvent === undefined
      ? "Live room pressure: none right now."
      : `Live room pressure: ${formatDirectorInstructionWithKindSuffix(currentEvent.directorInstruction, currentEvent.kind)}`,
    `Emotional weather: ${formatEmotionalWeather(session, pairState)} Use as subtext only.`,
    "",
    "Allowed memories:",
    `Self memories: ${formatCharacterMemories(memoryPack.self)}`,
    `Pair memories: ${formatCharacterMemories(memoryPack.pair)}`,
    `Past visits here: ${formatCharacterMemories(memoryPack.scenario)}`,
    memorySearchAvailable
      ? "Memory search: available for missing self, pair, or place history. Use returned memories only as allowed context."
      : "Memory search: not available in this prompt run.",
    "",
    "Back and forth so far: supplied below as chat messages.",
    `Latest incoming line to answer: ${latestIncomingLine}`,
    `Your last line, do not repeat: ${latestSelfLine}`,
    `Your last ${RECENT_LINE_GUARD_COUNT} lines, do not repeat verbatim or lightly reword:`,
    formatRecentLinesBlock(recentSpeakerLines),
    `${partner.name}'s last ${RECENT_LINE_GUARD_COUNT} lines, do not echo verbatim:`,
    formatRecentLinesBlock(recentPartnerLines),
    "",
    "Conversation target:",
    "Talk to the partner, not to the room and not to Cupid.",
    "If this is your first message in the date, start from the live moment, not from an app-profile review.",
    "Reply to the latest character message first. If they asked a question, answer it before changing topic.",
    "If they asked for a concrete choice, start with the concrete answer before commentary.",
    "Do not begin by rating, classifying, summarizing, or reframing the partner's line.",
    "Make one conversational move: answer, push back, tease, offer a detail, admit a small thing, or ask a clean follow-up.",
    "Do not close the exchange like a polished bit. Leave the partner a loose edge to grab.",
    "Use concrete answers to learn something personal-scale: taste, habit, worry, principle, or a small admission.",
    "Do not repeat or lightly reword your own earlier line. Build from it.",
    "Do not restate a boundary, plan, order, preference, or offer you already named. Use the partner's answer to move one small step forward.",
    "Treat names, times, routes, exits, food orders, and plans as settled once the conversation settles them.",
    "Do not ask the same question or restate the same logistical concern from the last two messages.",
    "Do not repeat the same named plan, time, object, or promise from the last two messages. If the plan is already set, add one new feeling, obstacle, or concrete next step instead of confirming it again.",
    "Use room events as something happening around you, not as the whole subject.",
    "You may introduce one grounded soft detail if it gives the partner something to react to.",
    "When the partner introduces a soft detail, either accept it, question it in character, or redirect naturally. Do not ignore it.",
    "Keep your own register. Do not absorb the partner's jargon, job voice, title, or species voice.",
    "Avoid verdicts about the whole date, compatibility, connection, spark, standards, metrics, or baselines unless the partner directly asked.",
    "Use one concrete noun from the partner or venue when possible.",
    "",
    "Output contract:",
    "Return plain text only.",
    "Return exactly one message, not a conversation log.",
    "Usually use 1 short sentence. Use 2 only when the first answers and the second gives a small hook. Stay under 220 characters.",
    "No paragraph breaks.",
    "Do not reuse a full sentence from the date conversation.",
    "No bracketed asides, editor notes, screenplay labels, or fake channels.",
    "Do not use em dashes or en dashes. Use commas, periods, colons, or parentheses.",
    "No speaker label, Markdown, JSON, stage directions, narration, analysis, or system text.",
    ...buildRepetitionRetryNotice(input.repetitionRetry),
  ].join("\n");
  const finalUserPrompt = buildFinalCharacterPrompt({
    latestIncomingLine,
    member,
    partner,
    imageAttachments: input.imageAttachments ?? [],
  });
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: setupMessage,
    },
    ...buildCharacterThreadMessages({
      transcript: visibleTranscript,
      member,
      partner,
    }),
    {
      role: "user",
      content: buildFinalUserMessageContent(finalUserPrompt, input.imageAttachments ?? []),
    },
  ];

  return {
    system,
    prompt: formatPromptPreview(messages),
    messages,
  };
}

function buildFinalCharacterPrompt({
  latestIncomingLine,
  member,
  partner,
  imageAttachments,
}: {
  latestIncomingLine: string;
  member: Member;
  partner: Member;
  imageAttachments: readonly CharacterPromptImageAttachment[];
}): string {
  return [
    ...formatAttachmentPromptLines(imageAttachments),
    `Latest incoming line: ${latestIncomingLine}`,
    `Write the next message as ${member.name} to ${partner.name}.`,
    "Answer that line first. Add only one small hook if needed.",
  ].join("\n");
}

function formatAttachmentPromptLines(
  imageAttachments: readonly CharacterPromptImageAttachment[],
): string[] {
  if (imageAttachments.length === 0) {
    return [];
  }

  return [
    "Visual references are attached to this user message.",
    ...imageAttachments.map(
      (attachment, index) => `Attached image ${index + 1} is ${attachment.description}.`,
    ),
    "Use the attached images for visual grounding only. Written character, place, and date facts are authoritative.",
    "Do not mention the attached images aloud.",
    "",
  ];
}

function buildFinalUserMessageContent(
  text: string,
  imageAttachments: readonly CharacterPromptImageAttachment[],
): string | Array<TextPart | ImagePart> {
  if (imageAttachments.length === 0) {
    return text;
  }

  const textPart: TextPart = { type: "text", text };
  const imageParts = imageAttachments.map(
    (attachment): ImagePart => ({
      type: "image",
      image: attachment.image,
      mediaType: attachment.mediaType,
    }),
  );

  return [textPart, ...imageParts];
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
    'Accepted notableMoments examples: "Vhool offered the receipt."; "Coffee unspilled at turn 4."; "Jenna refused to recruit."',
  ].join("\n");
  const candidates = revealCandidates ?? [];
  const candidateLines = formatRevealCandidatesForPrompt(candidates);
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        "Structured output contract:",
        "Return JSON only. No Markdown, comments, or prose outside JSON.",
        "dateHealthDelta must be an integer from -12 to 12.",
        "statDeltas may include chemistry, trust, stability, conflict, weirdnessTolerance, spark, strain, and relationshipHealth. Each value must be an integer from -8 to 8.",
        `memberMoodDeltas must use only these member ids: ${session.participants.join(", ")}. Each value must be an integer from -8 to 8.`,
        "shouldEndEarly is true only when the exchange requires the date to stop now.",
        "Omit earlyEndReason unless shouldEndEarly is true.",
        'endSentiment must be "positive" when the pair is leaving together (escalation, going home together, sealed connection), "negative" when they are storming out or shutting it down, or null when shouldEndEarly is false.',
        "notableMoments must contain 1 to 3 short strings, each anchored in a concrete scene detail.",
        "playerSummary must be one short Cupid corporate sentence. Name a concrete pair detail or move. Skip therapy-speak, consulting jargon, and AI slop.",
        "memoryCandidates must be an empty array.",
        "usedEvidenceIds must be an array of 0 to 3 ids drawn only from the reveal candidate list below. Do not invent ids. Do not paraphrase ids. Return an empty array if the exchange did not make any candidate matter.",
        "Do not use em dashes or en dashes in any string.",
        `Shape: {"dateHealthDelta":0,"statDeltas":{"spark":0,"strain":0,"relationshipHealth":0},"memberMoodDeltas":{"${session.participants[0]}":0,"${session.participants[1]}":0},"shouldEndEarly":false,"endSentiment":null,"notableMoments":["short note"],"playerSummary":"Cupid filed the exchange.","memoryCandidates":[],"usedEvidenceIds":[]}`,
        "",
        `Scenario: ${scenario.title}.`,
        `Participants: ${formatParticipants(members)}.`,
        "Member briefs, private scoring context only. Use these notes to interpret behavior. Do not reveal fixture notes in playerSummary unless the exchange made the detail explicit.",
        formatJudgeMemberBriefs(members),
        `Rubric success signals: ${scenario.judgeRubric.successSignals.join("; ")}.`,
        `Rubric failure signals: ${scenario.judgeRubric.failureSignals.join("; ")}.`,
        `Current Date Health: ${session.dateHealth}.`,
        `Current pair stats: ${JSON.stringify(pairState.stats)}.`,
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
      "Return 1 to 3 memory objects.",
      `Each object must use "scope":"pair", "visibility":"public", "subjectIds":["${session.participants[0]}","${session.participants[1]}"], "pairId":"${session.pairId}", "scenarioId":"${session.scenarioId}", "dateSessionId":"${session.id}", and importance from 1 to 5.`,
      "Use tags with short snake_case strings. Include date_summary as one tag.",
      "Memory text must be one faithful sentence anchored in a named object, room beat, or commitment, and must not copy the full transcript.",
      "Preserve soft canon that mattered: improvised objects, orders, invented same-day anecdotes, callbacks, and small commitments when a partner accepted or reacted to them.",
      "Do not preserve obvious contradictions, one-off non sequiturs, hidden secrets stated as fact, future events, or gameplay effects unless deterministic state already confirmed them.",
      "Do not include exact Date Health, Spark, Strain, Health, stat values, or stat deltas in memory text.",
      "Prefer memories that help the pair continue a later conversation over generic compatibility summaries.",
      "Do not use em dashes or en dashes in any string.",
      "Reject phrases like deeper connection, explored their feelings, navigated tension, or unlocked potential. Use plain operational nouns instead.",
      `Shape: [{"scope":"pair","visibility":"public","subjectIds":["${session.participants[0]}","${session.participants[1]}"],"pairId":"${session.pairId}","scenarioId":"${session.scenarioId}","dateSessionId":"${session.id}","text":"One faithful sentence about the completed date.","tags":["date_summary"],"importance":3}]`,
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

function pickPartnerOpener({
  sampleMessages,
  seed,
}: {
  sampleMessages: MemberSampleMessages;
  seed: string;
}): string {
  const [opener] = deterministicPick(sampleMessages.opener, seed, 1);
  return opener ?? sampleMessages.opener[0] ?? "";
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
      return { opener: 0, warming: 4, cooling: 0, crashingOut: 0 };
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
    return { opener: 2, warming: 2, cooling: 0, crashingOut: 0 };
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

function phaseForTurn(
  turnIndex: number,
  turnLimit: number,
): { label: "opener" | "pressure" | "pivot" | "resolution"; instruction: string } {
  const progress = turnLimit <= 0 ? 1 : turnIndex / turnLimit;

  if (progress <= 0.14) {
    return {
      label: "opener",
      instruction: "Establish first read, answer the latest line, and give one small hook.",
    };
  }

  if (progress <= 0.5) {
    return {
      label: "pressure",
      instruction:
        "Use one live detail to learn what the partner values, or reveal what you value. Keep the venue as texture.",
    };
  }

  if (progress <= 0.78) {
    return {
      label: "pivot",
      instruction: "Make a relational choice instead of circling logistics.",
    };
  }

  return {
    label: "resolution",
    instruction:
      "Move toward a clear read on whether this should continue. If a plan is already set, close or complicate it without repeating the time, place, object, or promise.",
  };
}

function formatEmotionalWeather(session: DateSession, pairState: PairState): string {
  return [
    dateComfortPhrase(session.dateHealth),
    sparkPhrase(pairState.stats.spark),
    strainPhrase(pairState.stats.strain),
  ].join(" ");
}

function dateComfortPhrase(value: number): string {
  if (value >= 70) {
    return "the date has room to breathe.";
  }

  if (value >= 45) {
    return "the date could still steady itself.";
  }

  return "the date feels fragile.";
}

function sparkPhrase(value: number): string {
  if (value >= 70) {
    return "There is real interest under the oddness.";
  }

  if (value >= 40) {
    return "Interest is possible but not secure.";
  }

  return "Interest is thin unless someone gets specific.";
}

function strainPhrase(value: number): string {
  if (value >= 70) {
    return "Tension is loud.";
  }

  if (value >= 40) {
    return "Tension is present.";
  }

  return "Tension is low.";
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
        content: `The date with ${partner.name} is starting. Send your opener now.`,
      },
    ];
  }

  return transcript.map((message) => {
    if (message.kind === "character" && message.speakerId === member.id) {
      return {
        role: "assistant" as const,
        content: message.text,
      };
    }

    return {
      role: "user" as const,
      content: formatIncomingThreadMessage(message, partner),
    };
  });
}

function formatIncomingThreadMessage(message: DateMessage, partner: Member): string {
  if (message.kind === "character") {
    return `${message.speakerId === partner.id ? partner.name : "Date partner"}: ${message.text}`;
  }

  if (message.kind === "scenario") {
    return `Room: ${message.text}`;
  }

  if (message.kind === "cupid") {
    return `Private Cupid nudge to you: ${message.text}`;
  }

  return `System: ${message.text}`;
}

function formatLatestIncomingLine(
  transcript: DateMessage[],
  member: Member,
  partner: Member,
): string {
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const message = transcript[index];

    if (message === undefined) {
      continue;
    }

    if (message.kind === "character" && message.speakerId !== member.id) {
      return formatIncomingThreadMessage(message, partner);
    }
  }

  return `The date with ${partner.name} is starting.`;
}

function formatLatestSelfLine(transcript: DateMessage[], member: Member): string {
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const message = transcript[index];

    if (message !== undefined && message.kind === "character" && message.speakerId === member.id) {
      return message.text;
    }
  }

  return "None yet.";
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

function formatCurrentSceneLines({
  scenario,
  partner,
  isOpeningTurn,
}: {
  scenario: DateScenario;
  partner: Member;
  isOpeningTurn: boolean;
}): string[] {
  const lines = [
    `Where you are: ${scenario.publicBrief.location}. ${scenario.publicBrief.openingSituation}`,
    `What both of you understand: ${scenario.publicBrief.whatBothCharactersKnow}`,
    `Room feel: ${scenario.director.tone}.`,
    ...scenario.director.rules.map((rule) => `Room constraint: ${rule}`),
    `What you can see of ${partner.firstName}: ${formatVisiblePartnerRead(partner)}`,
  ];

  if (isOpeningTurn) {
    lines.push(
      "Opening posture: you have just met them inside this moment. Let the first line acknowledge the live situation or the person across from you.",
    );
  }

  return lines;
}

function formatVisiblePartnerRead(partner: Member): string {
  const publicProfile = truncateForPrompt(partner.datingProfile);
  const visibleIdentity = `${partner.species}. ${partner.realityStatus}.`;

  return `${visibleIdentity} Profile signal: ${publicProfile}`;
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

function formatCharacterMemories(memories: Array<{ text: string }>): string {
  if (memories.length === 0) {
    return "None.";
  }

  return memories
    .map(
      (memory, index) => `${index + 1}. ${truncateForPrompt(cleanMemberFacingText(memory.text))}`,
    )
    .join("\n");
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

export function cleanMemberFacingText(text: string): string {
  return text
    .replace(/\bscenario\b/gi, "date")
    .replace(/\bscenarios\b/gi, "dates")
    .replace(/\btranscript\b/gi, "conversation")
    .replace(/\btranscripts\b/gi, "conversations")
    .replace(/\bturn\b/gi, "message")
    .replace(/\bturns\b/gi, "messages")
    .replace(/\bDate Health\b/g, "comfort")
    .replace(/\bgameplay\b/gi, "date")
    .replace(/\bsimulation\b/gi, "date")
    .replace(/\bsim\b/gi, "date");
}

function truncateForPrompt(text: string): string {
  if (text.length <= 220) {
    return text;
  }

  return `${text.slice(0, 217)}...`;
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
