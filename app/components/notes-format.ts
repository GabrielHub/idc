import type { DateScenario, Member, MemoryRecord, PairState } from "../domain/game";
import { isPairClosureMemory } from "../services/closures";

export const PAIR_NOTE_SCOPES: ReadonlySet<MemoryRecord["scope"]> = new Set(["pair", "date"]);

const MEMORY_TAG_LABELS: Record<string, string> = {
  date: "date",
  date_summary: "date summary",
  ai_summary: "AI filing",
  fallback_summary: "fallback filing",
  scenario_repeat: "repeat room",
  pair_closure: "closure",
  low: "low risk",
  medium: "medium risk",
  high: "high risk",
};

export function isPlayerVisibleNote(memory: MemoryRecord): boolean {
  if (memory.visibility !== "public") return false;
  return memory.scope === "pair" || memory.scope === "date" || memory.scope === "scenario";
}

export function sortMemoriesNewestFirst(first: MemoryRecord, second: MemoryRecord): number {
  const firstIsClosure = isPairClosureMemory(first);
  const secondIsClosure = isPairClosureMemory(second);
  if (firstIsClosure !== secondIsClosure) {
    return firstIsClosure ? -1 : 1;
  }
  if (first.createdAt === second.createdAt) {
    return second.importance - first.importance;
  }
  return first.createdAt < second.createdAt ? 1 : -1;
}

export function visibleMemoryTagLabels(memory: MemoryRecord): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const tag of memory.tags) {
    const label = MEMORY_TAG_LABELS[tag];

    if (label === undefined || seen.has(label)) {
      continue;
    }

    seen.add(label);
    labels.push(label);
  }

  return labels;
}

export function caseNumberFor(memory: MemoryRecord): string {
  const tail = caseNumberTail(memory.id);
  if (isPairClosureMemory(memory)) {
    return `C-CL-${tail}`;
  }
  return `C-${caseNumberPrefix(memory.scope)}-${tail}`;
}

function caseNumberTail(id: string): string {
  return id
    .replace(/[^0-9a-zA-Z]/g, "")
    .slice(-4)
    .toUpperCase()
    .padStart(4, "0");
}

function caseNumberPrefix(scope: MemoryRecord["scope"]): string {
  switch (scope) {
    case "pair":
      return "PR";
    case "date":
      return "DT";
    default:
      return "SC";
  }
}

export function noteCardTitle(
  memory: MemoryRecord,
  pairMembers: Member[],
  scenario: DateScenario | undefined,
): string {
  if (memory.scope === "scenario") {
    return scenario?.title ?? memory.scenarioId ?? "Date plan file";
  }
  return (
    joinPairFirstNames(pairMembers.map((member) => member.firstName)) ??
    memory.pairId ??
    "Pair file"
  );
}

export function noteCardSubhead(
  memory: MemoryRecord,
  scenario: DateScenario | undefined,
): string | null {
  if (memory.scope === "scenario") return null;
  if (scenario === undefined) return null;
  return scenario.title;
}

export function pairLabel(
  pairId: string,
  memberById: Map<string, Member>,
  pairStateById: Map<string, PairState>,
): string {
  const participantIds = pairStateById.get(pairId)?.participantIds ?? [];
  const names = participantIds
    .map((id) => memberById.get(id)?.firstName)
    .filter((name): name is string => name !== undefined);
  return joinPairFirstNames(names) ?? pairId;
}

export function joinPairFirstNames(names: readonly string[]): string | null {
  if (names.length >= 2) return `${names[0]} & ${names[1]}`;
  if (names.length === 1) return names[0];
  return null;
}

export function formatNoteTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatStampDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  const day = parsed.toLocaleDateString(undefined, { day: "2-digit" });
  const month = parsed.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  return `${day} ${month}`;
}
