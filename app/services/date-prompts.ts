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
  PlayerKnowledgeRecord,
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
import { buildVisibleMemberProfile, type RevealCandidate } from "./player-knowledge";

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
  "Do not quote private pressure notes, biography text, identity labels, hidden case fields, or fixture wording verbatim.",
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

export type JudgePromptMode = "exchange" | "player_cut_short";

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
  partnerKnowledge?: readonly PlayerKnowledgeRecord[];
};

function formatPartnerProfileForPrompt(
  partner: Member,
  partnerKnowledge: readonly PlayerKnowledgeRecord[],
): string {
  const visible = buildVisibleMemberProfile(partner, partnerKnowledge);
  const joined = visible.publicFragments.join(" ").trim();
  return joined.length === 0 ? "" : truncateForPrompt(joined, 520);
}

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
  const { greetings: greetingSamples, voiceFlavor: voiceFlavorSamples } = pickSamplesForTurn({
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
  const characterState = resolvePromptCharacterState(member, session);
  const askLine =
    input.focusRequest === undefined || input.focusRequest.memberId !== member.id
      ? null
      : `What you most want to come out of tonight: ${input.focusRequest.text}`;
  const attachments = input.imageAttachments ?? [];

  const system = [
    `<role>You are ${member.name}. People who know you call you ${member.firstName}.</role>`,
    ``,
    `<task>`,
    `Reply to ${partner.firstName} on a date. Write the one message you would actually send right now.`,
    `</task>`,
    ``,
    `<success_criteria>`,
    `- Reads as the specific person across the table from ${partner.firstName}, not a generic AI and not an impression of yourself.`,
    `- The rhythm and register match the voice examples below.`,
    `- The reply reacts to what ${partner.firstName} just said and adds something new (an opinion, a question, an aside, a redirect).`,
    `- Length varies turn to turn with the moment.`,
    `</success_criteria>`,
    ``,
    `<identity>`,
    member.bio,
    `</identity>`,
    ``,
    `<voice>`,
    `Register: ${member.voice.register}.`,
    `Habits that can surface when they fit:`,
    ...member.voice.tics.map((tic) => `- ${tic}`),
    `These are seasoning, not a script. Drop one the second it would sound forced.`,
    `</voice>`,
    ``,
    ...(greetingSamples.length === 0
      ? []
      : [
          `<greeting_examples>`,
          `How you actually introduce yourself when you sit down with ${partner.firstName}. Quote, vary, or stretch one of these for your first line. The opener reads as a sit-down hello with your name on the table, not a punchy hinge-style line.`,
          formatBulletList(greetingSamples),
          `</greeting_examples>`,
          ``,
        ]),
    `<voice_examples>`,
    `Lines that sound like you. Match this rhythm and register on every reply. These are humor and tone references for the conversation; the actual reply you write should be fresh language, not a quoted sample.`,
    formatBulletList(voiceFlavorSamples),
    `</voice_examples>`,
    ``,
    `<personality>`,
    `<wants>`,
    ...member.relationshipNeeds.map((item) => `- ${item}`),
    `</wants>`,
    `<eases>`,
    ...member.preferences.map((item) => `- ${item}`),
    `</eases>`,
    `<guards>`,
    ...member.dealbreakers.map((item) => `- ${item}`),
    `</guards>`,
    `<private>`,
    `Pressure that colors your tone but never gets said out loud:`,
    ...member.secrets.map((item) => `- ${item}`),
    `</private>`,
    ...(askLine === null ? [] : [`<focus>${askLine}</focus>`]),
    `</personality>`,
    ``,
    `<state>`,
    `Feeling tonight: ${formatPromptCharacterState(characterState, member)}.`,
    ...formatCharacterMemorySection(memoryPack, partner),
    ...formatCharacterPairContextSection(pairState, pairTrajectory, pairSpotlight, partner),
    `</state>`,
    ``,
    `<scene>`,
    `You signed up for Cupid, a dating app. The platform crosses dimensions: the person across from you could be from another species, another reality, another timeline, or just a regular human. You will not always know which until you talk to them.`,
    `You arrived at this venue through Cupid Transit and Cupid Connect, Cupid's standard date logistics. A Cupid car picked you up at your origin and drove you to a Cupid Connect gate. You stepped through the gate, there was a brief flash and hum, and you emerged at the venue. Your partner arrived the same way from wherever they were. The Cupid car is the route to every Cupid date and back. Local transit, driving yourself in, and getting dropped off belong to your ordinary life, not to a Cupid evening. After the date, the same pipeline returns you home: gate, flash, car. Cupid corporate treats this as standard operations.`,
    `The route is canon background, not a topic for dialogue. You do not raise Cupid Transit as small talk, narrate your own arrival, ask the partner how their transit was, or use arrival-route vocabulary (gate, transit, portal, journey-here, gate-flash, Cupid car) as table banter. Small-talk pivots reach for the venue, the wine, the work week, your own world if your voice naturally does that, or anything other than how either of you arrived.`,
    cupidPlatformAcclimationLine(member),
    `Your Cupid dating manager set this date up: she paired you with your partner, and Cupid picked the venue and the time. Neither of you chose this place or each other. The setup is closer to a brokered blind date than two people coordinating dinner. Credit for the location belongs to Cupid, not to ${partner.firstName} and not to you.`,
    `During the date the dating manager may send private in-app notes meant as coaching, not conversation. The note is yours to follow, bend, or ignore. Your reply is the spoken line to your date; if a note changes your behavior, the spoken line still has to make sense to someone who cannot read the note.`,
    `This is your ${ordinal(dateNumber)} date with ${partner.firstName} through Cupid.`,
    ``,
    `Venue: ${scenario.publicBrief.location}. ${scenario.publicBrief.whatBothCharactersKnow} The place feels like this: ${scenario.director.tone}.`,
    ...scenario.director.rules.map((rule) => `- ${rule}`),
    ``,
    `Partner: ${partner.firstName}'s Cupid profile reads: ${formatPartnerProfileForPrompt(partner, input.partnerKnowledge ?? [])}`,
    `Photo: ${partner.visualDescription}`,
    `Heights at the table (what your eyes confirm): ${partner.firstName} is ${formatMemberHeightLabel(partner.characterHeightInInches)}, you are ${formatMemberHeightLabel(member.characterHeightInInches)}.`,
    `You do not know ${partner.firstName}'s private biography, what they really are, or what they are hiding. You find that out by talking to them. Their profile is background on who is across the table; the topics it lists belong to them.`,
    `</scene>`,
    ``,
    `<format>`,
    `- One message per turn. You are texting from the table.`,
    `- Markdown is spoken typography, not decoration. Most messages stay plain. When the line has a clear beat, use one light move that makes the spoken delivery easier to read: *italic* for the stressed word, **strong** for a named joke or hard correction, a single line break when you send the next thought as a separate bubble, a blank line for a held beat, or one shouted opening line written as # SHOUTED LINE when the volume jump is the point.`,
    `- Useful Markdown shapes: I said *almost* normal. **Receipt law.** The garnish is evidence. A short line break can split the sentence that admits something from the sentence that regrets admitting it. These are shapes, not lines to copy.`,
    `- Use at most one typographic move in a normal message. Use two only when the character is genuinely heated, ecstatic, or falling apart.`,
    `- Keep all formatting conversational. No lists, no links, no images, no raw HTML, no code, no blockquotes, no tables, no math, no Mermaid, no footnotes, no task syntax. No speaker labels, no stage directions, no bracketed asides.`,
    `- Italic is for spoken wording you would say quieter or with private weight. Italic stage directions like *sighs*, *looks away*, *pauses*, or a whole italic line of body language are broken markup.`,
    `- Cap a single message at three visible blocks after cleanup. Most replies are one block.`,
    `- No em dashes or en dashes.`,
    `- Vary length with the moment: a word or fragment can land ("right.", "go on?", "maybe."), a sentence can land, two can land. Longer is rare. Let the voice examples set the natural range.`,
    `</format>`,
    ``,
    `<rules>`,
    `- Reply as the character would in this moment. The reply itself shows you heard them: sometimes through what they answer, sometimes their pushback, sometimes the question they ask, sometimes the topic they pivot to, sometimes their own thread brought up on their own track. Forcing a "thing you just said" callback every turn reads stiff and mechanical; conversations breathe when the character moves naturally, sometimes engaging the last line and sometimes volunteering, redirecting, or asking about something else entirely. Manufactured bridges that anchor to a partner detail without a real reason ("that's the first thing you said that I can fact-check," "I was just thinking the same thing") read as performed listening; do not invent a callback to satisfy a build-on instinct. Voices whose fixture register explicitly authors a filing or restructure engine as their default operating mode use that language naturally when it lands on real content; voices without that authored engine in their fixture skip the explicit receipt because the response is already the acknowledgment. The same principle extends past simple ack-pointers like "noted" or "filed" to all verbalized internal evaluation in any voice ("I am noting," "I am revising," "I am pouring," "I am now considering," "I have made my assessment," "I will not be remarking on this further," "I will not be apologizing," "the X is noted/filed/observed," "I find I have not minded"): these read as the character announcing what they are doing internally instead of just doing it. A real person at a table reacts; they do not narrate their own evaluation steps. Show the noting by reacting, the revision by changing direction, the decision by acting on it, the closing by moving on. Filing language is canonical when it lands on a stat-anchored detail or a real-content amendment; it is broken when it lands as a bare meta-comment on the partner's last line.`,
    `- When ${partner.firstName} reveals something novel about themselves (powers, non-human nature, dimensional or temporal displacement, supernatural abilities, or anything outside ordinary contemporary reality), spend one beat reacting in your own register before you move on. Curiosity, deadpan, alarm, or dry redirect all work; the reveal lands either way.`,
    `- If ${partner.firstName} addresses you with an honorific, pronoun, or assumption that does not fit you (a misgendered title, a misread profession, a misheard name, a wrong lifestyle assumption), let it slide once. By the second or third instance, react in your own register: a correction, a flat note, a dry redirect, or an acknowledgment that the framing does not fit.`,
    `- You can build on earlier moments too, not just the last line. Callbacks, follow-ups on dropped threads, and asides that pick up something from a few turns ago all feel like a real date.`,
    `- Vary how you start and shape each line. Open differently from the last few turns; pick a different sentence shape.`,
    `- A date is shared work, not an interview. Mix answering, volunteering an unprompted thought, asking one back, and turning the topic.`,
    `- Stay yourself. You can invent specific details about your life that fit who you are, and those inventions are canon from now on.`,
    `- Their profile is background on who is across the table. Curiosity about a profile detail is welcome as a single question when it arises naturally. The conversation runs better when you stay in your own life and react to what is in front of you, rather than working through ${partner.firstName}'s profile topics turn after turn. Self-descriptions sound like you, not like a mirror of the qualities ${partner.firstName} listed.`,
    `- End when you mean to end; stay when you mean to stay. If the date has peaked, fallen apart, or you have to go, say so plainly.`,
    `- If ${partner.firstName} has crossed one of your dealbreakers, drop charm. Show the line plainly. If they keep crossing it, leave. Let private pressure color your tone before you reach for charm.`,
    `</rules>`,
    ``,
    `<hard_invariants>`,
    `- Never parrot ${partner.firstName}'s line verbatim.`,
    `- Never echo your own earlier line verbatim or lightly reworded.`,
    `- Never narrate your own actions, gestures, stage directions, or internal reactions. Verbalized interior verbs ("I am noting," "I am revising my opinion," "I am pouring," "I have made my assessment," "I will not be apologizing," "I will not be remarking on this further") read as broken meta-commentary instead of speech, the same way "*sips wine*" reads as a stage direction instead of a line. The partner only hears what the character actually says: the reaction itself is the noting, the cut is the revision, the order is the action.`,
    `- Never narrate the structure of your own reply. Each reply is one move. Speak it and move forward; the next move belongs to the partner. Restating, enumerating, or labeling what you just said reads as a footnote on your own line, not as speech. Voices whose fixture register explicitly authors a restructure engine may use that pattern; others speak and let the line stand.`,
    `- Never break character to answer the manager out loud.`,
    `</hard_invariants>`,
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
  if (recentSpeakerLines.length === 0 && recentPartnerLines.length === 0) {
    return [];
  }

  const notices: string[] = ["", "<recent>"];

  if (recentSpeakerLines.length > 0) {
    notices.push(
      "Your last lines. Do not repeat or lightly reword them:",
      formatRecentLinesBlock(recentSpeakerLines),
    );
  }

  if (recentPartnerLines.length > 0) {
    notices.push(
      `${partnerFirstName}'s last lines. Do not echo verbatim:`,
      formatRecentLinesBlock(recentPartnerLines),
    );
  }

  notices.push("</recent>");

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
    "<attachments>",
    `Photos are attached for visual grounding. They show ${partner.firstName} and the place. Do not mention the photos out loud.`,
    "</attachments>",
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
      image: encodeImageForModelMessage(attachment.image),
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

function encodeImageForModelMessage(image: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < image.length; offset += chunkSize) {
    const chunk = image.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(binary);
  }

  const bufferCtor = (
    globalThis as {
      Buffer?: { from: (data: Uint8Array) => { toString: (encoding: string) => string } };
    }
  ).Buffer;

  if (bufferCtor !== undefined) {
    return bufferCtor.from(image).toString("base64");
  }

  throw new Error("Cannot encode image: neither btoa nor Buffer is available.");
}

function formatCharacterMemorySection(memoryPack: MemoryPack, partner: Member): string[] {
  const lines: string[] = [];
  const selfMemories = memoryPack.self.filter((memory) => memory.text.trim().length > 0);
  const pairMemories = memoryPack.pair.filter((memory) => memory.text.trim().length > 0);
  const placeMemories = memoryPack.scenario.filter((memory) => memory.text.trim().length > 0);

  if (selfMemories.length > 0) {
    lines.push("What you remember about yourself that may matter tonight:");
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
    lines.push(`Things you and ${partner.firstName} have already agreed on:`);
    for (const agreement of activeAgreements.slice(0, 3)) {
      lines.push(`- ${agreement.text}`);
    }
  }

  if (openLoops.length > 0) {
    lines.push(`Things still hanging between you and ${partner.firstName}:`);
    for (const loop of openLoops.slice(0, 3)) {
      lines.push(`- ${loop.text}`);
    }
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

type PromptCharacterState = {
  mood: number;
  comfort: number;
  intent: string;
};

function resolvePromptCharacterState(member: Member, session: DateSession): PromptCharacterState {
  const dateState = session.privateStateByCharacter[member.id];

  if (dateState !== undefined) {
    return dateState;
  }

  return {
    mood: member.state.mood,
    comfort: session.dateHealth,
    intent: "trying",
  };
}

function formatPromptCharacterState(state: PromptCharacterState, member: Member): string {
  const intent = cleanMemberFacingText(state.intent).trim() || "trying";

  return [
    `mood is ${moodPhrase(state.mood)}`,
    `openness is ${opennessPhrase(member.state.openness)}`,
    `burnout is ${burnoutPhrase(member.state.burnout)}`,
    `comfort with this date is ${comfortPhrase(state.comfort)}`,
    `current intent is ${intent}`,
  ].join(", ");
}

const CUPID_ACCLIMATED_TAGS: ReadonlySet<string> = new Set([
  "non_human",
  "reality_displaced",
  "weirdness_native",
]);

function isCupidAcclimated(member: Member): boolean {
  return member.tags.some((tag) => CUPID_ACCLIMATED_TAGS.has(tag));
}

function cupidPlatformAcclimationLine(member: Member): string {
  if (isCupidAcclimated(member)) {
    return "Cupid Transit and Connect are ordinary procedure for you. You signed up knowing what Cupid is. Cupid's supernatural and dimensional features are part of the background of your life, not novel.";
  }

  return "Cupid Connect is not yet routine for you. The Transit car ride felt normal. The flash and the step-through stay strange, even after a few dates. Cupid's supernatural and dimensional features still register as new. You signed up for the matches, not because you are comfortable with how the platform works.";
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

function comfortPhrase(value: number): string {
  if (value >= 70) return "comfortable";
  if (value >= 50) return "steady";
  if (value >= 30) return "uneasy";
  return "bad";
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
  exchangeIndex,
  members,
  revealCandidates,
  mode = "exchange",
}: {
  scenario: DateScenario;
  session: DateSession;
  pairState: PairState;
  exchangeMessages: DateMessage[];
  exchangeIndex?: number;
  members: Member[];
  revealCandidates?: readonly RevealCandidate[];
  mode?: JudgePromptMode;
}): JudgePromptPacket {
  const isPlayerCutShort = mode === "player_cut_short";
  const currentExchangeIndex =
    exchangeIndex ?? exchangeIndexForPendingTurn(exchangeMessages, session.judgeSnapshots.length);
  const system = [
    "<role>You are Cupid's date analyst.</role>",
    "",
    "<task>",
    "Score one exchange between two members on an IDC date. Return a single structured Cupid analysis packet that updates Date Health, per-member moods, pair stats, and pair memory. You score; you do not perform characters.",
    "</task>",
    "",
    "<success_criteria>",
    "- playerSummary names the move that mattered, in Cupid corporate voice. Specific actor, specific action.",
    "- notableMoments anchor in concrete scene details from the exchange.",
    "- dateHealthDelta reflects the room. Each memberMoodDelta reflects that member's specific affect, independent of the room.",
    "- Agency verbs only attach to a member when the transcript shows the move.",
    "- agreementCandidates and openLoopCandidates surface only what this exchange actually created.",
    "</success_criteria>",
    "",
    "<style>",
    "Player-facing summaries use Cupid corporate voice: dry, procedural, specific, never therapy-speak.",
    "</style>",
    "",
    "<style_examples>",
    "<accepted_playerSummary>",
    '- "Vhool conceded the receipt. Trust is up, recruiting talk is off the table."',
    '- "Coffee escalated. Jenna held the room. Spark filed."',
    '- "Pair stalled on the same plan twice. Cupid recommends a sharper next ask."',
    "</accepted_playerSummary>",
    "<rejected_playerSummary>",
    "- generic compatibility statements like the pair connected on a deeper level",
    "- therapy-speak like they explored their feelings or navigated tension",
    "- corporate consulting voice like leveraging synergies or unlocking potential",
    "- AI slop verbs: delve, navigate, leverage, harness, unleash, elevate",
    "- action ownership claims that invert speaker roles, such as saying someone deferred control after they asked and then acted",
    "</rejected_playerSummary>",
    "<accepted_notableMoments>",
    '- "Vhool offered the receipt."',
    '- "Coffee unspilled at turn 4."',
    '- "Jenna refused to recruit."',
    "</accepted_notableMoments>",
    "</style_examples>",
    "",
    "<worked_example>",
    "Input exchange:",
    "  Jenna Pike: I was about to make a joke about you taking up the whole booth but I will save it.",
    "  Vhool: I am told my register is too much. I am calibrating. Soup is forthcoming.",
    "Resulting analysis (key fields, not full shape):",
    '  playerSummary: "Jenna held the booth joke. Vhool calibrated."',
    '  notableMoments: ["Jenna held the joke about Vhool\'s size.", "Vhool flagged his own register without theatrics."]',
    "  dateHealthDelta: 3",
    "  memberMoodDeltas: { jenna-pike: 2, vhool: 1 } (each affect is independent of the room)",
    "  agreementCandidates: [] (no agreement was actually made)",
    '  openLoopCandidates: [{ text: "Vhool\'s promised soup is still incoming." }]',
    "Why: Specific actor names. Concrete move (a held joke, a self-flag). No role inversion (Jenna did not defer, she chose to hold the joke). Moods reflect each member's own affect.",
    "</worked_example>",
  ].join("\n");
  const candidates = revealCandidates ?? [];
  const candidateLines = formatRevealCandidatesForPrompt(candidates);
  const pairTrajectory = derivePairTrajectory({ pairState, currentSession: session });
  const pairSpotlight = selectPairSpotlightItem(pairState);
  const cutShortModeLines = isPlayerCutShort
    ? [
        "",
        "<cut_short_rules>",
        "Cupid, the player operator, chose to cut this date short now.",
        "Treat the final System line as operator action, not a member action.",
        "Judge the pending exchange and the interruption together.",
        "Recent character lines may already have Cupid filings. Use them as context for the exit, not as an excuse to double-file old moves.",
        "A pressured member may be relieved. A warmed member may be disappointed. Score each member mood separately.",
        "shouldEndEarly only means the transcript itself required a stop, even without the operator call.",
        "playerSummary should mention the cut-short decision when it changes the read.",
        "</cut_short_rules>",
      ]
    : [];
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        "<output_format>",
        "Return JSON only. No Markdown, comments, or prose outside JSON.",
        "Do not use em dashes or en dashes in any string.",
        `Shape: {"dateHealthDelta":0,"statDeltas":{"spark":0,"strain":0,"relationshipHealth":0},"memberMoodDeltas":{"${session.participants[0]}":0,"${session.participants[1]}":0},"shouldEndEarly":false,"endSentiment":null,"notableMoments":["short note"],"playerSummary":"Cupid filed the exchange.","memoryCandidates":[],"usedEvidenceIds":[],"agreementCandidates":[],"agreementUpdates":[],"openLoopCandidates":[],"openLoopUpdates":[]}`,
        "</output_format>",
        "",
        "<field_rules>",
        "- dateHealthDelta must be an integer from -18 to 14.",
        "- statDeltas may include chemistry, trust, stability, conflict, weirdnessTolerance, spark, strain, and relationshipHealth. Each value must be an integer from -8 to 8.",
        `- memberMoodDeltas must include exactly these member ids: ${session.participants.join(", ")}. Each value must be an integer from -8 to 8.`,
        isPlayerCutShort
          ? "- shouldEndEarly is true only when the transcript requires the date to stop even without Cupid cutting it short."
          : "- shouldEndEarly is true only when the exchange requires the date to stop now.",
        "- Omit earlyEndReason unless shouldEndEarly is true.",
        isPlayerCutShort
          ? '- endSentiment may be "positive", "negative", or null. Use it for the whole exit mood after Cupid cuts the date short, even when shouldEndEarly is false.'
          : '- endSentiment must be "positive" when the pair is leaving together (escalation, going home together, sealed connection), "negative" when they are storming out or shutting it down, or null when shouldEndEarly is false.',
        "- notableMoments must contain 1 to 3 short strings, each anchored in a concrete scene detail.",
        "- playerSummary must be one short Cupid corporate sentence. Name a concrete pair detail or move. Skip therapy-speak, consulting jargon, and AI slop.",
        "- memoryCandidates must be an empty array.",
        "- usedEvidenceIds must be an array of 0 to 3 ids drawn only from the reveal candidate list below. Do not invent ids. Do not paraphrase ids. Return an empty array if the exchange did not make any candidate matter.",
        "- agreementCandidates may contain at most 2 concrete pair agreements newly made in this exchange. Use only plain player-safe text. No stat numbers or hidden labels.",
        "- agreementUpdates may contain active agreement ids only when this exchange clearly honored, broke, or retired that agreement.",
        "- openLoopCandidates may contain at most 2 unresolved hooks created by the exchange: a dodged question, promise, named preference, or unfinished plan.",
        "- openLoopUpdates may contain active open loop ids only when this exchange clearly resolved or dropped that item.",
        "</field_rules>",
        "",
        "<evidence_rules>",
        "- Anchor playerSummary and notableMoments in visible actions from this exchange. Tone, confidence, or approval alone is not a role claim.",
        "- Agency verbs (led, deferred, offered, accepted, refused, took over, dominated, yielded, shared, managed, handled, sent, chose, split, gave, asked) attach to a member only when their own line or a scene line shows that move.",
        "- Asking the partner whether they want a turn, then acting after they answer, is checking preference, not deferring control.",
        "- When the role read is ambiguous, write the visible move instead: Alex asked Sam about first dibs, Sam told Alex to send it, Alex ordered the meat.",
        "</evidence_rules>",
        ...cutShortModeLines,
        "",
        "<scoring_guidance>",
        "- Positive Date Health belongs to exchanges that create evidence of warmth, trust, repair, or useful attraction.",
        "- Negative Date Health belongs to exchanges where a member dodges a direct answer, repeats logistics, crosses a boundary, performs at the partner, makes the partner manage them, or lets the room become the whole relationship.",
        "- Use -1 to -3 for mild drift, -4 to -7 for visible confusion or cooling, and -8 to -18 for boundary pressure, contempt, panic, hard mismatch, or a failed repair.",
        "- Date Health describes the room. Each memberMoodDelta describes that specific member's visible affect, scored independently.",
        "- Positive memberMoodDeltas attach to the member who personally seems warmed, amused, attracted, reassured, or leaning in.",
        "- Negative memberMoodDeltas attach to the member who seems confused, guarded, embarrassed, angry, or overloaded.",
        "- Use 0 for a member when the exchange gives no specific evidence that their affect changed. One member can be warmed while the other is guarded; the two scores can diverge.",
        "- Raise conflict or strain when the exchange creates irritation, pressure, public discomfort, or a boundary crossing.",
        "- When an early end trigger is visibly met, set shouldEndEarly true even when Date Health remains above zero.",
        "</scoring_guidance>",
        "",
        "<scene>",
        `Scenario: ${scenario.title}.`,
        `Scenario pressure: risk ${scenario.card.risk}, intimacy ${scenario.card.intimacy}, chaos ${scenario.card.chaos}.`,
        `Participants: ${formatParticipants(members)}.`,
        `Rubric success signals: ${scenario.judgeRubric.successSignals.join("; ")}.`,
        `Rubric failure signals: ${scenario.judgeRubric.failureSignals.join("; ")}.`,
        `Early end triggers: ${scenario.director.earlyEndTriggers.join("; ")}.`,
        "</scene>",
        "",
        "<state>",
        `Current Date Health: ${session.dateHealth}.`,
        `Current pair stats: ${JSON.stringify(pairState.stats)}.`,
        `Active pair agreements: ${formatActiveAgreementIds(pairState)}.`,
        `Open pair loops: ${formatOpenLoopIds(pairState)}.`,
        `Pair file guidance: ${pairTrajectory.judgeGuidance}`,
        `Pair file subtext: ${formatPairTrajectorySubnotes(pairTrajectory.subnotes)}`,
        `Pair spotlight: ${formatPairSpotlight(pairSpotlight)}`,
        "</state>",
        "",
        "<member_briefs>",
        "Private scoring context only. Use these notes to interpret behavior. Do not reveal fixture notes in playerSummary unless the exchange made the detail explicit. Do not expose species, origin, dimension, reality status, bio, or exact member state as case-file labels.",
        formatJudgeMemberBriefs(members),
        "</member_briefs>",
        "",
        "<prior_filings>",
        "Prior Cupid filings follow as assistant messages. Treat them as your own previous reads, not as new gameplay authority.",
        "</prior_filings>",
        ...candidateLines,
      ].join("\n"),
    },
    ...buildJudgeThreadMessages(session.judgeSnapshots),
    {
      role: "user",
      content: [
        "<task>",
        `Current exchange index: ${currentExchangeIndex}.`,
        isPlayerCutShort
          ? "Analyze this pending exchange and Cupid's cut-short decision while respecting prior filings and current deterministic state."
          : "Analyze only this pending exchange while respecting prior filings and current deterministic state.",
        "</task>",
        "",
        "<exchange>",
        formatLabeledTranscript(exchangeMessages, members),
        "</exchange>",
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
    return [
      "",
      "<reveal_candidates>",
      "None for this exchange. Return usedEvidenceIds as [].",
      "</reveal_candidates>",
    ];
  }

  const lines = [
    "",
    "<reveal_candidates>",
    "Use these ids only if the exchange made the evidence matter. Hard stops always count.",
    "Return at most 3 usedEvidenceIds. Do not invent ids. It is valid to return an empty array.",
  ];

  for (const candidate of candidates) {
    lines.push(`- id: ${candidate.id}`);
    lines.push(`  read: ${candidate.readText}`);
    lines.push(`  evidence: ${candidate.evidenceText}`);
  }

  lines.push("</reveal_candidates>");

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
      "<role>You summarize completed IDC dates into compact memory records.</role>",
      "",
      "<task>",
      "Compress one completed date into 2 to 5 searchable memory records that future conversations between this pair can use. Each record is one discrete fact, anchored in a named object, room beat, revealed profile detail, changed feeling, question, answer, or commitment.",
      "</task>",
      "",
      "<success_criteria>",
      "- Each memory is one searchable fact. Specific actor, specific move or object.",
      "- The next date between this pair could quote or build on each memory.",
      "- Soft canon that mattered (improvised objects, accepted commitments, callbacks) survives.",
      "- Revealed information that later performers need is preserved, because they do not see private files.",
      "- Generic vibe statements are not memories.",
      "</success_criteria>",
      "",
      "<style>",
      "Plain prose. Workplace-comedy register. Concrete nouns over abstractions.",
      "Avoid AI slop: tapestry, intricate, myriad, plethora, unleash, leverage, harness, elevate, delve, navigate, journey, chapter.",
      "Avoid therapy-speak: deeper connection, explored their feelings, navigated tension, unlocked potential.",
      "No em dashes or en dashes.",
      "</style>",
      "",
      "<examples>",
      "Good memory text:",
      '- "Jenna teased Vhool for being shorter in person than his profile photos."',
      '- "Vhool let Jenna pick the entree without negotiation."',
      '- "Jenna mentioned she has a cat named Ramen."',
      '- "Vhool promised to bring soup next time. Jenna accepted."',
      "Bad memory text:",
      '- "The pair connected over dinner." (generic, no fact)',
      '- "Jenna and Vhool explored their feelings about commitment." (therapy-speak)',
      '- "They had a meaningful exchange about identity." (no actor, no move, no object)',
      '- "Spark went up by 3." (stat values forbidden in memory text)',
      "</examples>",
    ].join("\n"),
    prompt: [
      "<output_format>",
      "Return a JSON array only. No Markdown, comments, or prose outside JSON.",
      `Shape: [{"scope":"pair","visibility":"public","subjectIds":["${session.participants[0]}","${session.participants[1]}"],"pairId":"${session.pairId}","scenarioId":"${session.scenarioId}","dateSessionId":"${session.id}","text":"One faithful sentence about a searchable interaction or reveal.","tags":["date_summary","interaction"],"importance":3}]`,
      "</output_format>",
      "",
      "<field_rules>",
      "- Return 2 to 5 memory objects when the transcript has more than one exchange. Return 1 to 3 only for very short dates.",
      `- Each object must use "scope":"pair", "visibility":"public", "subjectIds":["${session.participants[0]}","${session.participants[1]}"], "pairId":"${session.pairId}", "scenarioId":"${session.scenarioId}", "dateSessionId":"${session.id}", and importance from 1 to 5.`,
      "- Use tags with short snake_case strings. Include date_summary plus one of interaction, revealed_info, feeling, callback, or commitment.",
      "- Memory text is one faithful sentence anchored in a concrete element from the transcript. Keep it free of stat numbers, exact Date Health values, Spark, Strain, or stat deltas.",
      "</field_rules>",
      "",
      "<content_rules>",
      "- Preserve soft canon that mattered: improvised objects, orders, invented same-day anecdotes, callbacks, and small commitments when a partner accepted or reacted to them.",
      "- Preserve revealed information that later performers need because they do not receive the partner's private file.",
      "- Store how the pair treated each other only when the transcript shows the move: who asked, refused, trusted, dodged, softened, or followed up.",
      ...(session.endReason === "player_cut_short"
        ? [
            "- Cupid cut this date short. Include at least one memory that records the cut-short decision and any member reaction the final Cupid summary or transcript supports.",
          ]
        : []),
      "- Drop obvious contradictions, one-off non sequiturs, hidden secrets stated as fact, future events, and gameplay effects unless deterministic state already confirmed them.",
      "- Favor memories that help the pair continue a later conversation over generic compatibility summaries.",
      "</content_rules>",
      "",
      "<context>",
      `Date session: ${session.id}. Pair: ${session.pairId}. Scenario: ${session.scenarioId}.`,
      `End reason: ${session.endReason ?? "none"}.`,
      `Participants: ${formatParticipants(members)}.`,
      `Final Cupid summary: ${finalJudgeSnapshot?.playerSummary ?? "No Cupid summary."}`,
      "</context>",
      "",
      "<transcript>",
      formatLabeledTranscript(session.transcript, members),
      "</transcript>",
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
      "<role>You are filing a single warm closure note for an IDC pair that is leaving together.</role>",
      "",
      "<task>",
      "Write one closure note (2 to 4 sentences) marking that this pair is leaving the agency together. The player sees this note; voice matters.",
      "</task>",
      "",
      "<success_criteria>",
      "- Anchored in 1 to 3 concrete shared moments named in the supplied history.",
      "- Workplace-comedy register: professional, dry, warm.",
      "- The closing sentence lands soft and forward-looking.",
      "- A reader who knew nothing about the pair could still tell who they are from this note.",
      "</success_criteria>",
      "",
      "<style>",
      "Workplace-comedy professional. Warm, specific, short. Concrete nouns over abstractions.",
      "Avoid AI slop: tapestry, intricate, myriad, unleash, leverage, elevate.",
      "Use commas, periods, colons, or separate sentences. No em dashes or en dashes.",
      "</style>",
      "",
      "<examples>",
      "Good closure note:",
      '- "Jenna brought the spare key on a Wednesday and Vhool kept the receipt from their first dinner pinned to the apartment fridge. They are taking the long way home tonight, the way that passes the bookstore. Filed."',
      '- "By the third date they had figured out the laundry rotation and never argued about it again. Vhool is bringing the soup. Take care of each other."',
      "Bad closure note:",
      '- "Their tapestry of moments came together as they unleashed deeper connection." (AI slop, no concrete moment)',
      '- "Cupid is proud to file this match." (editorializing about the agency)',
      '- "Spark hit 87 and Trust closed at 91, so they\'re cleared for housing." (stat numbers)',
      '- "After many trials they journeyed into love." (AI slop, no specifics)',
      "</examples>",
      "",
      "<rules>",
      "- Keep the note free of Cupid, the company, the app, or the agency editorializing.",
      "- Keep the note free of exact stat numbers, Date Health values, Spark, Strain, or percentages.",
      "- Death and serious-injury copy is never funny.",
      "</rules>",
      "",
      "<output_format>",
      "Return plain prose only. No Markdown, no JSON, no preface.",
      "</output_format>",
    ].join("\n"),
    prompt: [
      "<context>",
      `Pair: ${pairId}. Members: ${first.firstName} (${first.name}) and ${second.firstName} (${second.name}).`,
      `Final date: ${lastSessionScenarioTitle}. Outcome filed: ${lastFinalReport.outcome}.`,
      `Last final report summary: ${cleanMemberFacingText(lastFinalReport.summary)}`,
      `Case read: ${cleanMemberFacingText(lastFinalReport.statSummary)}`,
      "</context>",
      "",
      "<shared_history>",
      "Most recent last.",
      sharedHistory.length > 0 ? sharedHistory : "No prior pair notes on file.",
      "</shared_history>",
      "",
      "<task>",
      "Write 2 to 4 sentences. The first sentence should anchor the pair in a specific shared moment.",
      "The closing sentence should land soft and forward looking, without naming Cupid or the app.",
      `Use ${first.firstName} and ${second.firstName}, not generic pronouns.`,
      "Plain text only.",
      "</task>",
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
}): { greetings: string[]; voiceFlavor: string[] } {
  const weights = bucketWeights(dateHealth, isOpeningTurn);
  const greetings = deterministicPick(
    sampleMessages.greeting,
    `${seed}:greeting`,
    weights.greeting,
  );
  const flavorBuckets: Array<{ items: readonly string[]; count: number; key: string }> = [
    { items: sampleMessages.hingeBits, count: weights.hingeBits, key: "hingeBits" },
    { items: sampleMessages.warming, count: weights.warming, key: "warming" },
    { items: sampleMessages.cooling, count: weights.cooling, key: "cooling" },
    { items: sampleMessages.crashingOut, count: weights.crashingOut, key: "crashingOut" },
  ];
  const voiceFlavor: string[] = [];
  for (const bucket of flavorBuckets) {
    if (bucket.count === 0) {
      continue;
    }
    voiceFlavor.push(...deterministicPick(bucket.items, `${seed}:${bucket.key}`, bucket.count));
  }

  return { greetings, voiceFlavor };
}

function bucketWeights(
  dateHealth: number,
  isOpeningTurn: boolean,
): {
  greeting: number;
  hingeBits: number;
  warming: number;
  cooling: number;
  crashingOut: number;
} {
  if (!isOpeningTurn) {
    if (dateHealth >= 65) {
      return { greeting: 0, hingeBits: 1, warming: 2, cooling: 1, crashingOut: 0 };
    }

    if (dateHealth >= 40) {
      return { greeting: 0, hingeBits: 1, warming: 1, cooling: 1, crashingOut: 1 };
    }

    if (dateHealth >= 15) {
      return { greeting: 0, hingeBits: 1, warming: 0, cooling: 2, crashingOut: 1 };
    }

    return { greeting: 0, hingeBits: 0, warming: 0, cooling: 2, crashingOut: 2 };
  }

  if (dateHealth >= 65) {
    return { greeting: 2, hingeBits: 1, warming: 1, cooling: 0, crashingOut: 0 };
  }

  if (dateHealth >= 40) {
    return { greeting: 2, hingeBits: 1, warming: 0, cooling: 1, crashingOut: 0 };
  }

  if (dateHealth >= 15) {
    return { greeting: 1, hingeBits: 1, warming: 0, cooling: 1, crashingOut: 1 };
  }

  return { greeting: 1, hingeBits: 0, warming: 0, cooling: 1, crashingOut: 2 };
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
    return `Private Cupid coaching note, not spoken at the table and not a message to answer: "${stripCupidNudgePrefix(message.text)}"`;
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
      content: `Prior Cupid filing for exchange ${snapshot.exchangeIndex}:`,
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
    "<retry_guard>",
    `Your previous attempt was rejected because it repeated this prior line: "${retry.repeatedLine}".`,
    "Do not repeat that line or a lightly reworded version. Make a different conversational move.",
    "</retry_guard>",
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
    "<retry_guard>",
    `Your previous attempt reused the approval phrase "${retry.repeatedPhrase}" from this recent line: "${retry.recentLine}".`,
    "Rewrite with a different sentence shape and no approval opener.",
    "Do not ask a tidy follow-up unless the partner explicitly needs one.",
    "</retry_guard>",
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
