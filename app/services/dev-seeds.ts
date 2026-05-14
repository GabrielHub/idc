import {
  gameSaveSchema,
  memoryRecordSchema,
  type GameSave,
  type Member,
  type MemoryRecord,
} from "../domain/game";
import type { GameRepository } from "../repositories/game-repository";
import { PAIR_CLOSURE_TAG } from "./closures";
import { makePairId } from "./game-seed";
import { syncActiveShiftFocusCases } from "./focus-cases";
import { DETERMINISTIC_EMBEDDING_MODEL, createDeterministicEmbedding } from "./vector-memory";

export type DevSeedRequest = "closures";

const DEV_SEED_QUERY_PARAM = "seed";

export type DevSeedClosuresOptions = {
  closedMemberId?: string;
  closedPartnerId?: string;
  quitMemberId?: string;
  now?: Date;
};

// Deterministic so Playwright screenshots stay stable across reruns.
export function seedClosedAndQuitMembers(
  save: GameSave,
  options: DevSeedClosuresOptions = {},
): GameSave {
  const timestamp = (options.now ?? new Date()).toISOString();
  const active = save.members.filter((member) => member.state.status === "active");

  if (active.length < 3) {
    return save;
  }

  const closedMember = pickMember(active, options.closedMemberId) ?? active[0];
  const closedPartner =
    pickMember(active, options.closedPartnerId, [closedMember.id]) ??
    active.find((member) => member.id !== closedMember.id) ??
    active[1];
  const quitMember =
    pickMember(active, options.quitMemberId, [closedMember.id, closedPartner.id]) ??
    active.find((member) => member.id !== closedMember.id && member.id !== closedPartner.id) ??
    active[2];

  const pairId = makePairId(closedMember.id, closedPartner.id);
  const updatedMembers = save.members.map((member) => {
    if (member.id === closedMember.id || member.id === closedPartner.id) {
      return {
        ...member,
        state: {
          ...member.state,
          status: "closed" as const,
          recentDateResult: "Case closed. The pair left Cupid together.",
        },
      };
    }

    if (member.id === quitMember.id) {
      return {
        ...member,
        state: {
          ...member.state,
          status: "quit" as const,
          retention: 0,
          recentDateResult: "Member cancelled their membership.",
        },
      };
    }

    return member;
  });
  const focusedMemberIds = save.focusedMemberIds.filter(
    (id) => id !== closedMember.id && id !== closedPartner.id && id !== quitMember.id,
  );
  const closureMemory = buildSeedClosureMemory({
    pairId,
    participants: [closedMember, closedPartner],
    timestamp,
  });

  const seeded = gameSaveSchema.parse({
    ...save,
    members: updatedMembers,
    focusedMemberIds,
    memories: [...save.memories, closureMemory],
    closureCount: save.closureCount + 1,
    updatedAt: timestamp,
  });

  return syncActiveShiftFocusCases(seeded);
}

function pickMember(
  candidates: readonly Member[],
  preferredId: string | undefined,
  exclude: readonly string[] = [],
): Member | undefined {
  if (preferredId === undefined) {
    return undefined;
  }

  const excluded = new Set(exclude);
  return candidates.find((member) => member.id === preferredId && !excluded.has(member.id));
}

function buildSeedClosureMemory({
  pairId,
  participants,
  timestamp,
}: {
  pairId: string;
  participants: [Member, Member];
  timestamp: string;
}): MemoryRecord {
  const [first, second] = participants;
  const text = `${first.firstName} and ${second.firstName} left Cupid together. Cupid filed the case as closed.`;
  const embedding = createDeterministicEmbedding(text);

  return memoryRecordSchema.parse({
    id: `memory-${pairId}-${PAIR_CLOSURE_TAG}-dev-seed-${timestamp}`,
    scope: "pair",
    visibility: "public",
    subjectIds: [first.id, second.id],
    pairId,
    scenarioId: "couch-night-takeout",
    dateSessionId: `dev-seed-${pairId}`,
    text,
    tags: [PAIR_CLOSURE_TAG, "date_summary", "dev_seed"],
    importance: 5,
    createdAt: timestamp,
    embedding,
    embeddingModel: DETERMINISTIC_EMBEDDING_MODEL,
    embeddingDimensions: embedding.length,
  });
}

export function readDevSeedRequest(): DevSeedRequest | null {
  if (!import.meta.env.DEV) {
    return null;
  }

  if (import.meta.env.MODE === "desktop") {
    return null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const seed = new URLSearchParams(window.location.search).get(DEV_SEED_QUERY_PARAM);
  return seed === "closures" ? "closures" : null;
}

export function clearDevSeedQueryParam(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(DEV_SEED_QUERY_PARAM);
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    return;
  }
}

export async function applyDevSeed(
  repository: GameRepository,
  save: GameSave,
  seed: DevSeedRequest,
): Promise<GameSave> {
  if (seed === "closures") {
    const seeded = seedClosedAndQuitMembers(save);
    await repository.saveGame(seeded);
    return seeded;
  }

  return save;
}
