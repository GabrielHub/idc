import { useEffect, useState } from "react";

export type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type TutorialTarget = HTMLElement | null | TargetRect;

function isElement(target: TutorialTarget): target is HTMLElement {
  return target !== null && typeof (target as HTMLElement).getBoundingClientRect === "function";
}

function readRect(target: TutorialTarget): TargetRect | null {
  if (target === null) return null;
  if (!isElement(target)) return target;
  const rect = target.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

export function useTargetRect(target: TutorialTarget): TargetRect | null {
  const [rect, setRect] = useState<TargetRect | null>(() => readRect(target));

  useEffect(() => {
    if (!isElement(target)) {
      setRect(target);
      return;
    }
    const element = target;

    function update() {
      setRect(readRect(element));
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  }, [target]);

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
