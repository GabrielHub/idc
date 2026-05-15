import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_TUTORIAL_STATE,
  type GameSave,
  type TutorialState,
  type TutorialStepId,
} from "../domain/game";

export function readTutorialState(save: GameSave | null | undefined): TutorialState {
  return save?.tutorial ?? DEFAULT_TUTORIAL_STATE;
}

export function noopTutorialUpdate(): void {}

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

export function isRequiredTutorialStepId(id: TutorialStepId): boolean {
  return id.startsWith("onboarding.") || id.startsWith("planning.") || id.startsWith("date.");
}

type TutorialActivityListener = () => void;

type TutorialActivityRegistry = {
  setActive: (id: TutorialStepId, active: boolean) => void;
  hasRequiredActive: () => boolean;
  subscribe: (listener: TutorialActivityListener) => () => void;
};

function createTutorialActivityRegistry(): TutorialActivityRegistry {
  const requiredActive = new Set<TutorialStepId>();
  const listeners = new Set<TutorialActivityListener>();

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    setActive(id, active) {
      if (!isRequiredTutorialStepId(id)) return;
      const had = requiredActive.has(id);
      if (active && !had) {
        requiredActive.add(id);
        notify();
      } else if (!active && had) {
        requiredActive.delete(id);
        notify();
      }
    },
    hasRequiredActive() {
      return requiredActive.size > 0;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const FALLBACK_TUTORIAL_ACTIVITY_REGISTRY: TutorialActivityRegistry = {
  setActive: () => undefined,
  hasRequiredActive: () => false,
  subscribe: () => () => undefined,
};

const TutorialActivityContext = createContext<TutorialActivityRegistry>(
  FALLBACK_TUTORIAL_ACTIVITY_REGISTRY,
);

export function TutorialActivityProvider({ children }: { children: ReactNode }) {
  const registry = useMemo(() => createTutorialActivityRegistry(), []);
  return createElement(TutorialActivityContext.Provider, { value: registry }, children);
}

export function useIsRequiredTutorialActive(): boolean {
  const registry = useContext(TutorialActivityContext);
  return useSyncExternalStore(
    registry.subscribe,
    registry.hasRequiredActive,
    registry.hasRequiredActive,
  );
}

function useTutorialActivityRegistration(id: TutorialStepId, active: boolean): void {
  const registry = useContext(TutorialActivityContext);
  useEffect(() => {
    registry.setActive(id, active);
    return () => {
      registry.setActive(id, false);
    };
  }, [registry, id, active]);
}

export function useTutorialStep(
  save: GameSave | null | undefined,
  id: TutorialStepId,
  gate: boolean,
  onUpdate: (next: GameSave) => void,
): TutorialStepHandle {
  const state = readTutorialState(save);
  const done = isStepComplete(state, id);
  const active = save !== null && save !== undefined && state.enabled && gate && !done;

  useTutorialActivityRegistration(id, active);

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
