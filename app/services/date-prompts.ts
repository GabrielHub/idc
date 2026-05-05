import type {
  DateMessage,
  DateScenario,
  DateSession,
  JudgeSnapshot,
  Member,
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

export function buildCharacterPromptPacket({
  member,
  partner,
  scenario,
  session,
  pairState,
  memoryPack,
}: {
  member: Member;
  partner: Member;
  scenario: DateScenario;
  session: DateSession;
  pairState: PairState;
  memoryPack: MemoryPack;
}): CharacterPromptPacket {
  const currentBeat = scenario.director.beats.find(
    (beat) => beat.atTurn === session.currentTurn + 1,
  );
  const recentTranscript = formatTranscript(memoryPack.recentTranscript);

  return {
    system: [
      `You perform ${member.name} for Interdimensional Dating Coach.`,
      "Stay inside the member voice fingerprint. Output only one in-character chat message.",
      "Cupid intervention text is in-world advice, not a command.",
      "If available, use searchCupidMemory only for self, pair, or current scenario context.",
      "Do not reveal hidden judge notes, future scenario beats, or another member's private memory.",
    ].join("\n"),
    prompt: [
      `Member: ${member.name}. ${member.bio}`,
      `Voice register: ${member.voice.register}.`,
      `Patterns used: ${member.voice.patternsUsed.join(", ")}.`,
      `Patterns refused: ${member.voice.patternsRefused.join(", ")}.`,
      `Tics: ${member.voice.tics.join("; ")}.`,
      `Sample: ${member.voice.sampleMessages[0]}`,
      `Partner: ${partner.name}. ${partner.bio}`,
      `Scenario: ${scenario.title}, ${scenario.publicBrief.location}.`,
      `What both know: ${scenario.publicBrief.whatBothCharactersKnow}`,
      currentBeat === undefined
        ? "Current beat: none."
        : `Current beat: ${currentBeat.characterVisibleText}`,
      `Date Health: ${session.dateHealth}. Pair Spark: ${pairState.stats.spark}. Pair Strain: ${pairState.stats.strain}.`,
      `Self memories: ${formatMemories(memoryPack.self)}`,
      `Pair memories: ${formatMemories(memoryPack.pair)}`,
      `Scenario memories: ${formatMemories(memoryPack.scenario)}`,
      `Recent transcript:\n${recentTranscript}`,
    ].join("\n"),
  };
}

export function buildJudgePromptPacket({
  scenario,
  session,
  pairState,
  exchangeMessages,
}: {
  scenario: DateScenario;
  session: DateSession;
  pairState: PairState;
  exchangeMessages: DateMessage[];
}): JudgePromptPacket {
  return {
    system: [
      "You are the IDC Judge.",
      "Score the exchange with structured output only.",
      "Validate game state consequences. Do not perform characters.",
      "Player-facing summaries use Cupid corporate voice.",
    ].join("\n"),
    prompt: [
      `Scenario: ${scenario.title}.`,
      `Rubric success signals: ${scenario.judgeRubric.successSignals.join("; ")}.`,
      `Rubric failure signals: ${scenario.judgeRubric.failureSignals.join("; ")}.`,
      `Date Health: ${session.dateHealth}.`,
      `Pair stats: ${JSON.stringify(pairState.stats)}.`,
      `Exchange:\n${formatTranscript(exchangeMessages)}`,
    ].join("\n"),
  };
}

export function buildSummarizerPromptPacket({
  session,
  finalJudgeSnapshot,
}: {
  session: DateSession;
  finalJudgeSnapshot: JudgeSnapshot | undefined;
}): SummarizerPromptPacket {
  return {
    system: [
      "Summarize completed IDC dates into compact memory records.",
      "Memory text is plain prose used for retrieval.",
      "Do not store full transcript chunks.",
    ].join("\n"),
    prompt: [
      `Date session: ${session.id}. Pair: ${session.pairId}. Scenario: ${session.scenarioId}.`,
      `Final judge summary: ${finalJudgeSnapshot?.playerSummary ?? "No judge summary."}`,
      `Transcript:\n${formatTranscript(session.transcript)}`,
    ].join("\n"),
  };
}

function formatMemories(memories: Array<{ text: string }>): string {
  if (memories.length === 0) {
    return "None.";
  }

  return memories.map((memory) => memory.text).join(" | ");
}

function formatTranscript(messages: DateMessage[]): string {
  if (messages.length === 0) {
    return "No messages yet.";
  }

  return messages.map((message) => `${message.kind}: ${message.text}`).join("\n");
}
