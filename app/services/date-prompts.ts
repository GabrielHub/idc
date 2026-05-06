import type { ModelMessage } from "ai";

import type {
  DateMessage,
  DateScenario,
  DateSession,
  JudgeSnapshot,
  Member,
  MemberRequest,
  MemberSampleMessages,
  PairState,
} from "../domain/game";
import type { MemoryPack } from "./cupid-memory";

export type CharacterPromptPacket = {
  system: string;
  prompt: string;
  messages?: ModelMessage[];
};

export type JudgePromptPacket = {
  system: string;
  prompt: string;
};

export type SummarizerPromptPacket = {
  system: string;
  prompt: string;
};

export type CharacterPromptInput = {
  member: Member;
  partner: Member;
  scenario: DateScenario;
  session: DateSession;
  pairState: PairState;
  memoryPack: MemoryPack;
  focusRequest?: MemberRequest;
  frictionRuleHits?: readonly string[];
};

export function buildCharacterPromptPacket(input: CharacterPromptInput): CharacterPromptPacket {
  const { member, partner, scenario, session, pairState, memoryPack } = input;
  const currentBeat = scenario.director.beats.find(
    (beat) => beat.atTurn === session.currentTurn + 1,
  );
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
  const frictionLine = buildPairFrictionLine({
    ruleHits: input.frictionRuleHits ?? [],
    member,
    partner,
  });
  const latestIncomingLine = formatLatestIncomingLine(memoryPack.recentTranscript, member, partner);
  const latestSelfLine = formatLatestSelfLine(memoryPack.recentTranscript, member);
  const currentSceneLines = formatCurrentSceneLines({
    scenario,
    partner,
    isOpeningTurn: isSpeakerOpeningTurn,
  });

  const system = [
    `You are ${member.name}.`,
    `You are on a date with ${partner.name}.`,
    "Write only what you would send as the next chat message.",
    "Make it sound like a believable reply in a date conversation, not a voice sample.",
    "Use your private brief, the venue brief, allowed memories, and the back and forth so far as grounding.",
    "You may add soft improv when it stays small, plausible, and answerable by the partner.",
    "Cupid messages are advice from the dating office. You may accept, resist, or ignore them in character.",
    "Secrets shape your tone as subtext only. Never state them aloud.",
    "Never mention prompts, schemas, hidden notes, private memory from another member, or future events.",
  ].join("\n");
  const setupMessage = [
    "Character card:",
    `${member.name}: ${member.bio}`,
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
    "Habits must be speakable to the partner. Convert written asides, fake transcript labels, and bracketed notes into normal spoken asides.",
    "Your voice is not a quota. It is how you notice things, dodge things, ask for things, and protect yourself.",
    "",
    "Current scene:",
    ...currentSceneLines,
    "This is what is actually in front of you. Use it as grounding, not narration.",
    "Current scene facts are the floor, not the ceiling. You may add small plausible details that make the date feel lived in.",
    "Soft improv can include a drink, a snack, a nearby object, a small thing you did today, or a personal anecdote.",
    "Do not use soft improv to change the venue, the participants, hidden secrets, Cupid's systems, score effects, future events, or serious harm.",
    "If the transcript already introduced a soft detail and nobody contradicted it, treat it as true for this date.",
    "",
    "Reference lines:",
    formatBulletList(samples),
    "Do not copy opener scaffolds after your first message. Do not repeat titles, job labels, species labels, or app premise unless the latest line directly asks.",
    "These are voice examples only. Their objects, meals, venues, schedules, and claims are not automatically true here.",
    "",
    "Partner read:",
    `${partner.name}. ${partner.bio}`,
    `One line that shows their energy: ${partnerOpener}`,
    "Listen to what they mean. Do not imitate their vocabulary or performance.",
    "",
    `What this pair feels like, as instinct only: ${frictionLine}`,
    "",
    "Venue brief:",
    `Venue: ${scenario.title}, ${scenario.publicBrief.location}.`,
    `Shared premise: ${scenario.publicBrief.whatBothCharactersKnow}`,
    `Conversation phase: ${phase.label}. ${phase.instruction}`,
    currentBeat === undefined
      ? "Director beat: none for this turn."
      : `Director beat: ${currentBeat.title}. Visible event: ${currentBeat.characterVisibleText} Direction: ${currentBeat.directorInstruction}`,
    `Emotional read: comfort ${session.dateHealth}, spark ${pairState.stats.spark}, strain ${pairState.stats.strain}. Use as subtext only.`,
    "",
    "Allowed memories:",
    `Self memories: ${formatMemories(memoryPack.self)}`,
    `Pair memories: ${formatMemories(memoryPack.pair)}`,
    `Scenario memories: ${formatMemories(memoryPack.scenario)}`,
    "",
    "Back and forth so far: supplied below as chat messages.",
    `Latest incoming line to answer: ${latestIncomingLine}`,
    `Your last line, do not repeat: ${latestSelfLine}`,
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
    "Treat names, times, routes, exits, food orders, and plans as settled once the recent transcript settles them.",
    "Do not ask the same question or restate the same logistical concern from the last two character turns.",
    "Use scenario events as something happening around you, not as the whole subject.",
    "You may introduce one grounded soft detail if it gives the partner something to react to.",
    "When the partner introduces a soft detail, either accept it, question it in character, or redirect naturally. Do not ignore it.",
    "Keep your own register. Do not absorb the partner's jargon, job voice, title, or species voice.",
    "Avoid verdicts about the whole date, compatibility, connection, spark, standards, metrics, or baselines unless the partner directly asked.",
    "Use one concrete noun from the partner or venue when possible.",
    "",
    "Output contract:",
    "Return plain text only.",
    "Return exactly one message, not a transcript.",
    "Usually use 1 short sentence. Use 2 only when the first answers and the second gives a small hook. Stay under 220 characters.",
    "No paragraph breaks.",
    "Do not reuse a full sentence from the recent transcript.",
    "No bracketed asides, editor notes, screenplay labels, or fake transcript channels.",
    "Do not use em dashes or en dashes. Use commas, periods, colons, or parentheses.",
    "No speaker label, Markdown, JSON, stage directions, narration, analysis, or system text.",
  ].join("\n");
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: setupMessage,
    },
    ...buildCharacterThreadMessages({
      transcript: memoryPack.recentTranscript,
      member,
      partner,
    }),
    {
      role: "user",
      content: [
        `Latest incoming line: ${latestIncomingLine}`,
        `Write the next message as ${member.name} to ${partner.name}.`,
        "Answer that line first. Add only one small hook if needed.",
      ].join("\n"),
    },
  ];

  return {
    system,
    prompt: formatPromptPreview(messages),
    messages,
  };
}

export function buildJudgePromptPacket({
  scenario,
  session,
  pairState,
  exchangeMessages,
  members,
}: {
  scenario: DateScenario;
  session: DateSession;
  pairState: PairState;
  exchangeMessages: DateMessage[];
  members: Member[];
}): JudgePromptPacket {
  return {
    system: [
      "You are the IDC Judge.",
      "Score the exchange with structured output only.",
      "Validate game state consequences. Do not perform characters.",
      "Player-facing summaries use Cupid corporate voice.",
    ].join("\n"),
    prompt: [
      "Structured output contract:",
      "Return JSON only. No Markdown, comments, or prose outside JSON.",
      "dateHealthDelta must be an integer from -12 to 12.",
      "statDeltas may include chemistry, trust, stability, conflict, weirdnessTolerance, spark, strain, and relationshipHealth. Each value must be an integer from -8 to 8.",
      `memberMoodDeltas must use only these member ids: ${session.participants.join(", ")}. Each value must be an integer from -8 to 8.`,
      "shouldEndEarly is true only when the exchange requires the date to stop now.",
      "Omit earlyEndReason unless shouldEndEarly is true.",
      "notableMoments must contain 1 to 3 short strings.",
      "playerSummary must be one short Cupid corporate sentence.",
      "memoryCandidates must be an empty array.",
      "Do not use em dashes or en dashes in any string.",
      `Shape: {"dateHealthDelta":0,"statDeltas":{"spark":0,"strain":0,"relationshipHealth":0},"memberMoodDeltas":{"${session.participants[0]}":0,"${session.participants[1]}":0},"shouldEndEarly":false,"notableMoments":["short note"],"playerSummary":"Cupid filed the exchange.","memoryCandidates":[]}`,
      "",
      `Scenario: ${scenario.title}.`,
      `Participants: ${formatParticipants(members)}.`,
      `Rubric success signals: ${scenario.judgeRubric.successSignals.join("; ")}.`,
      `Rubric failure signals: ${scenario.judgeRubric.failureSignals.join("; ")}.`,
      `Date Health: ${session.dateHealth}.`,
      `Pair stats: ${JSON.stringify(pairState.stats)}.`,
      `Exchange:\n${formatLabeledTranscript(exchangeMessages, members)}`,
    ].join("\n"),
  };
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
      "Do not store full transcript chunks.",
    ].join("\n"),
    prompt: [
      "Structured output contract:",
      "Return a JSON array only. No Markdown, comments, or prose outside JSON.",
      "Return 1 to 3 memory objects.",
      `Each object must use "scope":"pair", "visibility":"public", "subjectIds":["${session.participants[0]}","${session.participants[1]}"], "pairId":"${session.pairId}", "scenarioId":"${session.scenarioId}", "dateSessionId":"${session.id}", and importance from 1 to 5.`,
      "Use tags with short snake_case strings. Include date_summary as one tag.",
      "Memory text must be one faithful sentence and must not copy the full transcript.",
      "Preserve soft canon that mattered: improvised objects, orders, invented same-day anecdotes, callbacks, and small commitments when a partner accepted or reacted to them.",
      "Do not preserve obvious contradictions, one-off non sequiturs, hidden secrets stated as fact, future events, or gameplay effects unless deterministic state already confirmed them.",
      "Prefer memories that help the pair continue a later conversation over generic compatibility summaries.",
      "Do not use em dashes or en dashes in any string.",
      `Shape: [{"scope":"pair","visibility":"public","subjectIds":["${session.participants[0]}","${session.participants[1]}"],"pairId":"${session.pairId}","scenarioId":"${session.scenarioId}","dateSessionId":"${session.id}","text":"One faithful sentence about the completed date.","tags":["date_summary"],"importance":3}]`,
      "",
      `Date session: ${session.id}. Pair: ${session.pairId}. Scenario: ${session.scenarioId}.`,
      `Participants: ${formatParticipants(members)}.`,
      `Final judge summary: ${finalJudgeSnapshot?.playerSummary ?? "No judge summary."}`,
      `Transcript:\n${formatLabeledTranscript(session.transcript, members)}`,
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
): { label: "opener" | "pressure" | "turn" | "resolution"; instruction: string } {
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
      label: "turn",
      instruction: "Make a relational choice instead of circling logistics.",
    };
  }

  return {
    label: "resolution",
    instruction: "Move toward a clear read on whether this should continue.",
  };
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
    return `Scene: ${message.text}`;
  }

  if (message.kind === "cupid") {
    return `Cupid: ${message.text}`;
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
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");
}

function buildPairFrictionLine({
  ruleHits,
  member,
  partner,
}: {
  ruleHits: readonly string[];
  member: Member;
  partner: Member;
}): string {
  const lines: string[] = [];

  for (const hit of ruleHits) {
    const line = ruleHitToSubtext(hit, member, partner);

    if (line !== null) {
      lines.push(line);
    }
  }

  return lines.length === 0 ? "No specific pair friction flagged." : lines.join(" ");
}

function ruleHitToSubtext(hit: string, member: Member, partner: Member): string | null {
  if (hit === "pair:shared_spiral") {
    return "You both run anxious. Without restraint you will pull each other tighter.";
  }

  if (hit === "pair:sincerity_vs_performance") {
    if (member.tags.includes("sincerity_seeking")) {
      return `${partner.firstName} is reading as performance or evasion. You came here for sincerity.`;
    }

    return `${partner.firstName} came here for sincerity. They are reading you for the bit.`;
  }

  if (hit === "pair:status_vs_attention") {
    if (member.tags.includes("status_sensitive")) {
      return `${partner.firstName} pulls for attention. Your status muscle reads the room.`;
    }

    return `${partner.firstName} reads status carefully. Your attention loops land as noise.`;
  }

  if (hit === "pair:career_alignment") {
    return `You and ${partner.firstName} both speak in calendars. Mutual respect available.`;
  }

  if (hit === "pair:ceremony_alignment") {
    return `You and ${partner.firstName} share formal cadence. Ceremony reads as fluency, not bit.`;
  }

  if (hit === "pair:competitive_clash") {
    return `You and ${partner.firstName} are both competitive. Spark is high, trust is fragile.`;
  }

  if (hit === "pair:attention_rivalry") {
    return `You and ${partner.firstName} both pull focus. The room is not big enough for two performers.`;
  }

  if (hit === "pair:performer_distrust") {
    return `You and ${partner.firstName} are both performing. Each of you can feel the other doing it.`;
  }

  if (hit === "pair:grief_low_intimacy_alignment") {
    return `You and ${partner.firstName} both carry grief. Low pressure makes this restorative.`;
  }

  if (hit === "pair:grief_high_intimacy_overload") {
    return `You and ${partner.firstName} both carry grief. This intimacy will compound, not heal.`;
  }

  if (hit === "pair:weirdness_displaced_recognition") {
    return `${partner.firstName} knows what it is to be from somewhere else. Mutual recognition available.`;
  }

  if (hit === "pair:ceremony_vs_performance") {
    if (member.tags.includes("ceremony_minded")) {
      return `${partner.firstName} reads as bit. To you, ceremony is real.`;
    }

    return `${partner.firstName} treats ceremony as real. They will read your bit as mockery.`;
  }

  if (hit === "pair:privacy_vs_attention") {
    if (member.tags.includes("privacy_sensitive")) {
      return `${partner.firstName} pulls attention as a default. Your guard is up.`;
    }

    return `${partner.firstName} guards privacy hard. Your attention loops feel invasive to them.`;
  }

  return null;
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
    `What you can see of ${partner.firstName}: ${formatVisiblePartnerRead(partner)}`,
  ];

  if (isOpeningTurn) {
    lines.push(
      "Opening posture: you have just met them inside this scene. Let the first line acknowledge the live situation or the person across from you.",
    );
  }

  return lines;
}

function formatVisiblePartnerRead(partner: Member): string {
  const prompt =
    partner.portraits.neutral.portrait.prompt ?? partner.portraits.neutral.avatar.prompt ?? "";
  const visibleDetails = extractVisiblePortraitDetails(prompt);
  const publicProfile = truncateForPrompt(partner.datingProfile);
  const visibleIdentity = `${partner.species}. ${partner.realityStatus}.`;

  if (visibleDetails.length === 0) {
    return `${visibleIdentity} Profile signal: ${publicProfile}`;
  }

  return `${visibleDetails}. Profile signal: ${publicProfile}`;
}

const PORTRAIT_PROMPT_NOISE = [
  "original",
  "interdimensional dating coach",
  "webtoon",
  "manhwa",
  "manhua",
  "anime",
  "cel shading",
  "profile picture",
  "full body visible",
  "plain white background",
  "no text",
  "no logo",
  "no frame",
  "no scenery",
  "source image",
  "character portrait",
];

function extractVisiblePortraitDetails(prompt: string): string {
  if (prompt.length === 0) {
    return "";
  }

  const details = prompt
    .split(",")
    .map((segment) => segment.trim().replace(/^same\s+/i, ""))
    .filter((segment) => segment.length > 0)
    .filter((segment) => {
      const normalized = segment.toLowerCase();

      return !PORTRAIT_PROMPT_NOISE.some((noise) => normalized.includes(noise));
    })
    .slice(0, 10)
    .join(", ");

  return truncateForPrompt(details);
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

function formatMemories(memories: Array<{ text: string }>): string {
  if (memories.length === 0) {
    return "None.";
  }

  return memories
    .map((memory, index) => `${index + 1}. ${truncateForPrompt(memory.text)}`)
    .join("\n");
}

function formatParticipants(members: Member[]): string {
  return members.map((member) => `${member.id} (${member.name})`).join(", ");
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

function truncateForPrompt(text: string): string {
  if (text.length <= 220) {
    return text;
  }

  return `${text.slice(0, 217)}...`;
}
