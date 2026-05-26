import { pairStateSchema, type OpenLoop, type PairAgreement, type PairState } from "../domain/game";
import { scrubPlayerSafeCopy } from "./player-safe-copy";

export function normalizePairStateActiveMemoryDuplicates(
  pairState: PairState,
  timestamp: string,
): PairState {
  const agreements = normalizeDuplicateActiveAgreements(pairState.agreements, timestamp);
  const openLoops = normalizeDuplicateOpenLoops(pairState.openLoops, timestamp);

  if (agreements === pairState.agreements && openLoops === pairState.openLoops) {
    return pairState;
  }

  return pairStateSchema.parse({
    ...pairState,
    agreements,
    openLoops,
  });
}

export function listUniqueActiveAgreements(
  pairState: Pick<PairState, "agreements">,
): PairAgreement[] {
  return uniqueActiveAgreements(pairState.agreements);
}

export function listUniqueOpenLoops(pairState: Pick<PairState, "openLoops">): OpenLoop[] {
  return uniqueOpenLoops(pairState.openLoops);
}

export function rankActiveAgreements(pairState: PairState): PairAgreement[] {
  return uniqueActiveAgreements(pairState.agreements)
    .map((agreement) => ({
      agreement,
      age: completedDatesAfterSource(pairState, agreement.sourceDateSessionId),
    }))
    .sort(
      (first, second) =>
        second.age - first.age || first.agreement.id.localeCompare(second.agreement.id),
    )
    .map((entry) => entry.agreement);
}

export function rankActiveOpenLoops(pairState: PairState): OpenLoop[] {
  return uniqueOpenLoops(pairState.openLoops)
    .map((loop) => ({
      loop,
      age: completedDatesAfterSource(pairState, loop.sourceDateSessionId),
    }))
    .sort((first, second) => second.age - first.age || first.loop.id.localeCompare(second.loop.id))
    .map((entry) => entry.loop);
}

export function completedDatesAfterSource(
  pairState: PairState,
  sourceDateSessionId: string | undefined,
): number {
  if (sourceDateSessionId === undefined) {
    return 0;
  }

  const sourceIndex = pairState.completedDateIds.indexOf(sourceDateSessionId);
  if (sourceIndex === -1) {
    return 0;
  }

  return Math.max(0, pairState.completedDateIds.length - sourceIndex - 1);
}

export function cleanPairMemoryText(text: string): string {
  return scrubPlayerSafeCopy(text).slice(0, 220);
}

export function pairMemoryTextKey(text: string): string {
  return cleanPairMemoryText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function uniqueActiveAgreements(agreements: readonly PairAgreement[]): PairAgreement[] {
  const seen = new Set<string>();
  const active: PairAgreement[] = [];

  for (const agreement of agreements) {
    if (agreement.status !== "active") continue;
    const key = pairMemoryTextKey(agreement.text);
    if (key.length !== 0) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    active.push(agreement);
  }

  return active;
}

function uniqueOpenLoops(openLoops: readonly OpenLoop[]): OpenLoop[] {
  const seen = new Set<string>();
  const open: OpenLoop[] = [];

  for (const openLoop of openLoops) {
    if (openLoop.status !== "open") continue;
    const key = pairMemoryTextKey(openLoop.text);
    if (key.length !== 0) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    open.push(openLoop);
  }

  return open;
}

function normalizeDuplicateActiveAgreements(
  agreements: readonly PairAgreement[],
  timestamp: string,
): readonly PairAgreement[] {
  const seen = new Set<string>();
  let changed = false;
  const normalized = agreements.map((agreement) => {
    if (agreement.status !== "active") return agreement;
    const key = pairMemoryTextKey(agreement.text);
    if (key.length === 0 || !seen.has(key)) {
      seen.add(key);
      return agreement;
    }
    changed = true;
    return {
      ...agreement,
      status: "retired" as const,
      resolvedAt: agreement.resolvedAt ?? timestamp,
    };
  });

  return changed ? normalized : agreements;
}

function normalizeDuplicateOpenLoops(
  openLoops: readonly OpenLoop[],
  timestamp: string,
): readonly OpenLoop[] {
  const seen = new Set<string>();
  let changed = false;
  const normalized = openLoops.map((openLoop) => {
    if (openLoop.status !== "open") return openLoop;
    const key = pairMemoryTextKey(openLoop.text);
    if (key.length === 0 || !seen.has(key)) {
      seen.add(key);
      return openLoop;
    }
    changed = true;
    return {
      ...openLoop,
      status: "dropped" as const,
      resolvedAt: openLoop.resolvedAt ?? timestamp,
    };
  });

  return changed ? normalized : openLoops;
}
