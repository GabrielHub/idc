import { useCallback } from "react";

import {
  DEFAULT_TUTORIAL_STATE,
  type GameSave,
  type TutorialState,
  type TutorialStepId,
} from "../domain/game";

export function readTutorialState(save: GameSave | null | undefined): TutorialState {
  return save?.tutorial ?? DEFAULT_TUTORIAL_STATE;
}

export function isStepComplete(state: TutorialState, id: TutorialStepId): boolean {
  return state.completedStepIds.includes(id);
}

export function withStepCompleted(save: GameSave, id: TutorialStepId): GameSave {
  const state = readTutorialState(save);
  if (state.completedStepIds.includes(id)) {
    return save;
  }
  return {
    ...save,
    tutorial: {
      ...state,
      completedStepIds: [...state.completedStepIds, id],
    },
  };
}

export function withTourDismissed(save: GameSave, now: Date = new Date()): GameSave {
  const state = readTutorialState(save);
  if (!state.enabled && state.dismissedAt) {
    return save;
  }
  return {
    ...save,
    tutorial: {
      ...state,
      enabled: false,
      dismissedAt: now.toISOString(),
    },
  };
}

export function withOrientationReset(save: GameSave): GameSave {
  return {
    ...save,
    tutorial: {
      enabled: true,
      completedStepIds: [],
      dismissedAt: null,
    },
  };
}

export type TutorialStepHandle = {
  active: boolean;
  done: boolean;
  complete: () => void;
  dismiss: () => void;
};

export function useTutorialStep(
  save: GameSave | null | undefined,
  id: TutorialStepId,
  gate: boolean,
  onUpdate: (next: GameSave) => void,
): TutorialStepHandle {
  const state = readTutorialState(save);
  const done = isStepComplete(state, id);
  const active = save !== null && save !== undefined && state.enabled && gate && !done;

  const complete = useCallback(() => {
    if (!save) return;
    const next = withStepCompleted(save, id);
    if (next === save) return;
    onUpdate(next);
  }, [save, id, onUpdate]);

  const dismiss = useCallback(() => {
    if (!save) return;
    const next = withTourDismissed(save);
    if (next === save) return;
    onUpdate(next);
  }, [save, onUpdate]);

  return { active, done, complete, dismiss };
}
