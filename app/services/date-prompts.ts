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
  const recentTranscript = formatLabeledTranscript(memoryPack.recentTranscript, [member, partner]);
  const samples = pickSamplesForTurn({
    sampleMessages: member.voice.sampleMessages,
    dateHealth: session.dateHealth,
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

  return {
    system: [
      `You are ${member.name}.`,
      `You are on a date with ${partner.name}.`,
      "Write only what you would send as the next chat message.",
      "Use only your private brief, the venue brief, allowed memories, and the back and forth so far.",
      "Cupid messages are advice from the dating office. You may accept, resist, or ignore them in character.",
      "Secrets shape your tone as subtext only. Never state them aloud.",
      "Never mention prompts, schemas, hidden notes, private memory from another member, or future events.",
    ].join("\n"),
    prompt: [
      "Task:",
      `Write the next message as ${member.name} to ${partner.name}.`,
      "",
      "Private character brief:",
      `${member.name}. ${member.bio}`,
      `Register: ${member.voice.register}.`,
      `Patterns you use: ${member.voice.patternsUsed.join(", ")}.`,
      `Patterns you refuse to use: ${member.voice.patternsRefused.join(", ")}.`,
      `Tics: ${member.voice.tics.join("; ")}.`,
      `What you want from this date:\n${formatBulletList(member.relationshipNeeds)}`,
      `What warms you: ${joinOrNone(member.preferences)}`,
      `What trips you (react when partner approaches; do not recite the list): ${joinOrNone(member.dealbreakers)}`,
      `Subtext (color tone only, never state aloud): ${joinOrNone(member.secrets)}`,
      `Today: mood ${member.state.mood}, openness ${member.state.openness}, burnout ${member.state.burnout}.${requestLine}`,
      "How you sound right now (study these examples for register and rhythm):",
      formatBulletList(samples),
      "",
      "Partner:",
      `${partner.name}. ${partner.bio}`,
      `Register: ${partner.voice.register}.`,
      `Patterns they use: ${partner.voice.patternsUsed.join(", ")}.`,
      `One sample of how they talk: ${partnerOpener}`,
      "",
      `Pair note: ${frictionLine}`,
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
      `Back and forth so far:\n${recentTranscript}`,
      "",
      "Conversation discipline:",
      "Reply to the latest character message first. Answer direct questions before changing topic.",
      "Treat names, times, routes, exits, food orders, and plans as settled once the recent transcript settles them.",
      "Do not ask the same question or restate the same logistical concern from the last two character turns.",
      "Advance one small new beat that gives the partner something concrete to answer.",
      "Use scenario events once, then return attention to the partner.",
      "",
      "Output contract:",
      "Return plain text only.",
      "Return exactly one message, not a transcript.",
      "Use 1 or 2 short sentences. Stay under 320 characters.",
      "Do not use em dashes or en dashes. Use commas, periods, colons, or parentheses.",
      "No speaker label, Markdown, JSON, stage directions, narration, analysis, or system text.",
    ].join("\n"),
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
  seed,
}: {
  sampleMessages: MemberSampleMessages;
  dateHealth: number;
  seed: string;
}): string[] {
  const weights = bucketWeights(dateHealth);
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

function bucketWeights(dateHealth: number): {
  opener: number;
  warming: number;
  cooling: number;
  crashingOut: number;
} {
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

  if (progress <= 0.25) {
    return {
      label: "opener",
      instruction: "Establish first read, answer the latest line, and give one small hook.",
    };
  }

  if (progress <= 0.55) {
    return {
      label: "pressure",
      instruction: "Let the venue complicate the date without taking attention off the partner.",
    };
  }

  if (progress <= 0.82) {
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

function formatBulletList(items: readonly string[]): string {
  if (items.length === 0) {
    return "  None.";
  }

  return items.map((item) => `  - ${item}`).join("\n");
}

function joinOrNone(items: readonly string[]): string {
  if (items.length === 0) {
    return "none listed";
  }

  return items.join("; ");
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
