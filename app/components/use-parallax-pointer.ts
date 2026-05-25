import { useEffect } from "react";

const LERP_FACTOR = 0.045;
const PARALLAX_X_PROP = "--parallax-x";
const PARALLAX_Y_PROP = "--parallax-y";

type ParallaxState = {
  attachedCount: number;
  raf: number;
  listenerAttached: boolean;
  target: { x: number; y: number };
  current: { x: number; y: number };
};

const state: ParallaxState = {
  attachedCount: 0,
  raf: 0,
  listenerAttached: false,
  target: { x: 0, y: 0 },
  current: { x: 0, y: 0 },
};

function handleMove(event: MouseEvent): void {
  state.target.x = (event.clientX / window.innerWidth - 0.5) * 2;
  state.target.y = (event.clientY / window.innerHeight - 0.5) * 2;
}

function tick(): void {
  state.current.x += (state.target.x - state.current.x) * LERP_FACTOR;
  state.current.y += (state.target.y - state.current.y) * LERP_FACTOR;
  const root = document.documentElement;
  root.style.setProperty(PARALLAX_X_PROP, state.current.x.toFixed(4));
  root.style.setProperty(PARALLAX_Y_PROP, state.current.y.toFixed(4));
  state.raf = window.requestAnimationFrame(tick);
}

function start(): void {
  if (state.listenerAttached) {
    return;
  }
  window.addEventListener("mousemove", handleMove, { passive: true });
  state.raf = window.requestAnimationFrame(tick);
  state.listenerAttached = true;
}

function stop(): void {
  if (!state.listenerAttached) {
    return;
  }
  window.removeEventListener("mousemove", handleMove);
  window.cancelAnimationFrame(state.raf);
  state.listenerAttached = false;
  state.target.x = 0;
  state.target.y = 0;
  state.current.x = 0;
  state.current.y = 0;
  const root = document.documentElement;
  root.style.removeProperty(PARALLAX_X_PROP);
  root.style.removeProperty(PARALLAX_Y_PROP);
}

/**
 * Subscribes to a shared pointer-parallax loop. While any consumer is mounted,
 * a single `mousemove` listener + RAF writes eased pointer offset (-1..1) to
 * `--parallax-x` / `--parallax-y` on `document.documentElement`, where any
 * CSS rule can read it via `calc(var(--parallax-x) * 8px)`-style transforms.
 *
 * Pass `active=false` (e.g. when `prefers-reduced-motion: reduce` is on) to
 * unsubscribe without unmounting.
 */
export function useParallaxPointer(active: boolean = true): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    state.attachedCount += 1;
    start();
    return () => {
      state.attachedCount = Math.max(0, state.attachedCount - 1);
      if (state.attachedCount === 0) {
        stop();
      }
    };
  }, [active]);
}
