export function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function clampDelta(value: number): number {
  return Math.min(100, Math.max(-100, value));
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

export function jsonResponse(value: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(value), {
    ...init,
    headers,
  });
}
