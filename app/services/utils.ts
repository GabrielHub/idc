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

export function jsonResponse(value: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  return new Response(JSON.stringify(value), {
    ...init,
    headers,
  });
}
