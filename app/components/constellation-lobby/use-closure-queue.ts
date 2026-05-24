import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";

import type { ReadyClosurePair } from "../../services/closures";

export function useClosureQueue({
  closurePairId,
  readyClosurePairs,
  setClosurePairId,
}: {
  closurePairId: string | null;
  readyClosurePairs: readonly ReadyClosurePair[];
  setClosurePairId: Dispatch<SetStateAction<string | null>>;
}) {
  const readyPair = useMemo(
    () =>
      closurePairId === null
        ? null
        : (readyClosurePairs.find((ready) => ready.pairState.id === closurePairId) ?? null),
    [closurePairId, readyClosurePairs],
  );

  const readyPairIndex = useMemo(
    () =>
      closurePairId === null
        ? -1
        : readyClosurePairs.findIndex((ready) => ready.pairState.id === closurePairId),
    [closurePairId, readyClosurePairs],
  );

  const openPrevious = useCallback(() => {
    if (readyPairIndex <= 0) return;
    setClosurePairId(readyClosurePairs[readyPairIndex - 1]?.pairState.id ?? null);
  }, [readyPairIndex, readyClosurePairs, setClosurePairId]);

  const openNext = useCallback(() => {
    if (readyPairIndex < 0 || readyPairIndex >= readyClosurePairs.length - 1) return;
    setClosurePairId(readyClosurePairs[readyPairIndex + 1]?.pairState.id ?? null);
  }, [readyPairIndex, readyClosurePairs, setClosurePairId]);

  return {
    readyPair,
    readyPairIndex,
    openPrevious,
    openNext,
  };
}
