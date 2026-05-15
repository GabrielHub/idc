import type { MemoryRecord } from "../domain/game";

export function matchesSubjectFilter(
  memory: MemoryRecord,
  subjectIds: string[] | undefined,
): boolean {
  if (subjectIds === undefined || subjectIds.length === 0) {
    return true;
  }

  return subjectIds.some((subjectId) => memory.subjectIds.includes(subjectId));
}

export function matchesSingleFilter(
  value: string | undefined,
  filter: string | undefined,
): boolean {
  return filter === undefined || value === filter;
}

export function matchesNumberFilter(
  value: number | undefined,
  filter: number | undefined,
): boolean {
  return filter === undefined || value === filter;
}

export function matchesListFilter<TValue extends string>(
  value: TValue,
  filter: TValue[] | undefined,
): boolean {
  return filter === undefined || filter.length === 0 || filter.includes(value);
}

export function matchesTags(memoryTags: string[], filterTags: string[] | undefined): boolean {
  if (filterTags === undefined || filterTags.length === 0) {
    return true;
  }

  return filterTags.every((tag) => memoryTags.includes(tag));
}
