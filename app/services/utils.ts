export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

export function clampScore(value: number): number {
  return clamp(value, 0, 100);
}

export function clampDelta(value: number): number {
  return clamp(value, -100, 100);
}

export function replaceById<TItem extends { id: string }>(items: TItem[], item: TItem): TItem[] {
  const existingIndex = items.findIndex((candidate) => candidate.id === item.id);

  if (existingIndex === -1) {
    return [...items, item];
  }

  return items.map((candidate, index) => (index === existingIndex ? item : candidate));
}

export function errorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function pushIntoBucket<TKey, TValue>(
  bucket: Map<TKey, TValue[]>,
  key: TKey,
  value: TValue,
): void {
  const existing = bucket.get(key);
  if (existing === undefined) {
    bucket.set(key, [value]);
    return;
  }
  existing.push(value);
}

export function arraysShallowEqual<T>(left: readonly T[], right: readonly T[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

export function hashSeedUint32(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Clamp a random source value to [0, 1) so Math.floor(value * length) cannot
// index past the end of an array. Non-finite inputs collapse to 0.
export function clampRandom(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), 1 - Number.EPSILON);
}

export type RandomFn = () => number;
export type RandomSeedPart = string | number | boolean | null | undefined;

function normalizeSeedPart(part: RandomSeedPart): string {
  if (part === undefined) return "u:";
  if (part === null) return "l:";
  if (typeof part === "number") return `n:${Number.isFinite(part) ? part.toString() : "0"}`;
  if (typeof part === "boolean") return `b:${part ? "1" : "0"}`;
  return `s:${part.length}:${part}`;
}

export function buildRandomSeed(namespace: string, parts: readonly RandomSeedPart[]): string {
  return [`ns:${namespace.length}:${namespace}`, ...parts.map(normalizeSeedPart)].join("|");
}

function hashSeed128(seed: string): readonly [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let index = 0; index < seed.length; index += 1) {
    const code = seed.charCodeAt(index);
    h1 = h2 ^ Math.imul(h1 ^ code, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ code, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ code, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ code, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);

  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

export function createSeededRandom(seed: string): RandomFn {
  const [initialA, initialB, initialC, initialD] = hashSeed128(seed);
  let a = initialA;
  let b = initialB;
  let c = initialC;
  let d = initialD;

  return () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (a + b + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return t / 4294967296;
  };
}

export function createNamespacedRandom(
  namespace: string,
  parts: readonly RandomSeedPart[],
): RandomFn {
  return createSeededRandom(buildRandomSeed(namespace, parts));
}

export function randomIndex(length: number, random: RandomFn): number {
  if (length <= 0) {
    throw new Error("Cannot select a random index from an empty collection.");
  }
  return Math.floor(clampRandom(random()) * length);
}

export function shuffleInPlace<T>(items: T[], randomFn: RandomFn): void {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, randomFn);
    const current = items[index];
    const swap = items[swapIndex];

    if (current !== undefined && swap !== undefined) {
      items[index] = swap;
      items[swapIndex] = current;
    }
  }
}

export function shuffledBySeed<T>(items: readonly T[], seed: string): T[] {
  const next = [...items];
  shuffleInPlace(next, createSeededRandom(seed));
  return next;
}

export type FreshSelectionCandidate<TItem> = {
  id: string;
  item: TItem;
  score?: number;
};

export type FreshnessPenalty = {
  id: string;
  penalty?: number;
};

export function selectFreshItems<TItem>({
  candidates,
  count,
  random,
  freshnessPenalties = [],
}: {
  candidates: readonly FreshSelectionCandidate<TItem>[];
  count: number;
  random: RandomFn;
  freshnessPenalties?: readonly FreshnessPenalty[];
}): TItem[] {
  if (count <= 0 || candidates.length === 0) {
    return [];
  }

  const penaltyById = new Map<string, number>();
  for (const record of freshnessPenalties) {
    const penalty = record.penalty ?? 1;
    if (!Number.isFinite(penalty) || penalty <= 0) {
      continue;
    }
    penaltyById.set(record.id, (penaltyById.get(record.id) ?? 0) + penalty);
  }

  const shuffled = [...candidates];
  shuffleInPlace(shuffled, random);

  return shuffled
    .map((candidate, index) => {
      const baseScore = candidate.score ?? 0;
      return {
        candidate,
        index,
        adjustedScore: baseScore - (penaltyById.get(candidate.id) ?? 0),
        baseScore,
      };
    })
    .sort(
      (left, right) =>
        right.adjustedScore - left.adjustedScore ||
        right.baseScore - left.baseScore ||
        left.index - right.index,
    )
    .slice(0, count)
    .map((entry) => entry.candidate.item);
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
