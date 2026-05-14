const DEFAULT_EMBEDDING_DIMENSIONS = 64;

export const DETERMINISTIC_EMBEDDING_MODEL = "deterministic-local";

export function createDeterministicEmbedding(
  text: string,
  dimensions = DEFAULT_EMBEDDING_DIMENSIONS,
): number[] {
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = text.toLowerCase().match(/[a-z0-9_]+/g) ?? [];

  for (const token of tokens) {
    const hash = hashToken(token);
    const bucket = Math.abs(hash) % dimensions;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[bucket] += sign * (1 + Math.min(token.length, 14) / 14);
  }

  if (tokens.length === 0) {
    vector[0] = 1;
  }

  return normalizeVector(vector);
}

export function cosineSimilarity(first: number[], second: number[]): number {
  if (first.length === 0 || first.length !== second.length) {
    return 0;
  }

  let dot = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  for (let index = 0; index < first.length; index += 1) {
    dot += first[index] * second[index];
    firstMagnitude += first[index] * first[index];
    secondMagnitude += second[index] * second[index];
  }

  if (firstMagnitude === 0 || secondMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function hashToken(token: string): number {
  let hash = 2166136261;

  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash;
}
