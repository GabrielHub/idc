import { useLayoutEffect, useState, type Dispatch, type SetStateAction } from "react";

export type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TutorialElementRef = {
  readonly current: HTMLElement | null;
};

export type TutorialSingleTarget = HTMLElement | null | TargetRect | TutorialElementRef;
export type TutorialTarget = TutorialSingleTarget | readonly TutorialSingleTarget[];

function isElement(target: TutorialSingleTarget): target is HTMLElement {
  return target !== null && typeof (target as HTMLElement).getBoundingClientRect === "function";
}

function isTargetRef(target: TutorialSingleTarget): target is TutorialElementRef {
  return target !== null && typeof target === "object" && "current" in target;
}

function resolveTarget(target: TutorialTarget): TutorialSingleTarget {
  if (Array.isArray(target)) {
    for (const entry of target) {
      const resolved = resolveTarget(entry);
      if (resolved !== null) return resolved;
    }
    return null;
  }
  if (isTargetRef(target)) {
    return target.current;
  }
  return target;
}

function readRect(target: TutorialTarget): TargetRect | null {
  const resolved = resolveTarget(target);
  if (resolved === null) return null;
  if (!isElement(resolved)) return resolved;
  const rect = resolved.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function observeElement(target: TutorialTarget): HTMLElement | null {
  const resolved = resolveTarget(target);
  return isElement(resolved) ? resolved : null;
}

function rectsMatch(first: TargetRect | null, second: TargetRect | null): boolean {
  if (first === null || second === null) return first === second;
  return (
    first.top === second.top &&
    first.left === second.left &&
    first.width === second.width &&
    first.height === second.height
  );
}

function setIfChanged(
  setRect: Dispatch<SetStateAction<TargetRect | null>>,
  next: TargetRect | null,
) {
  setRect((current) => (rectsMatch(current, next) ? current : next));
}

export function useTargetRect(target: TutorialTarget): TargetRect | null {
  const [rect, setRect] = useState<TargetRect | null>(() => readRect(target));

  useLayoutEffect(() => {
    let observer: ResizeObserver | null = null;
    let observedElement: HTMLElement | null = null;
    function update() {
      setIfChanged(setRect, readRect(target));
      const element = observeElement(target);
      if (element === observedElement) return;
      observer?.disconnect();
      observedElement = element;
      if (element === null) {
        observer = null;
        return;
      }
      observer = new ResizeObserver(update);
      observer.observe(element);
    }

    update();
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  });

  return rect;
}

export function expandRect(rect: TargetRect, padding: number): TargetRect {
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}
