import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { ManagerQuip } from "../fixtures/manager-quips";
import {
  ManagerStandee,
  pickNextManagerStandeeSide,
  type ManagerStandeeSide,
} from "./manager-standee";
import { useSfx } from "./sfx-provider";

export type ManagerQuipPopupProps = {
  quip: ManagerQuip | null;
  /** Distinct mount key. Increment per dispatch so the same quip id can replay. */
  presentationKey: number;
  onDismissed: () => void;
};

const FALLBACK_VISIBLE_MS = 4400;
const DISMISS_BUFFER_MS = 1100;

export function ManagerQuipPopup({ quip, presentationKey, onDismissed }: ManagerQuipPopupProps) {
  const { playVoiceClip } = useSfx();
  const [side, setSide] = useState<ManagerStandeeSide>("left");
  const lastSideRef = useRef<ManagerStandeeSide | null>(null);
  const onDismissedRef = useRef(onDismissed);
  useEffect(() => {
    onDismissedRef.current = onDismissed;
  }, [onDismissed]);

  useEffect(() => {
    if (quip === null) return;
    const next = pickNextManagerStandeeSide(lastSideRef.current, [quip.id, presentationKey]);
    lastSideRef.current = next;
    setSide(next);
  }, [quip, presentationKey]);

  useEffect(() => {
    if (quip === null) return;
    let timer: number | null = null;
    let cancelled = false;

    const armFallbackTimer = (duration: number) => {
      if (cancelled) return;
      if (typeof window === "undefined") return;
      timer = window.setTimeout(() => onDismissedRef.current(), duration);
    };

    if (quip.status === "recorded") {
      void playVoiceClip(quip.audio)
        .then((playback) => {
          if (cancelled) return;
          const visibleMs = playback.played
            ? Math.max(FALLBACK_VISIBLE_MS, playback.durationMs + DISMISS_BUFFER_MS)
            : FALLBACK_VISIBLE_MS;
          armFallbackTimer(visibleMs);
        })
        .catch(() => armFallbackTimer(FALLBACK_VISIBLE_MS));
    } else {
      armFallbackTimer(FALLBACK_VISIBLE_MS);
    }

    return () => {
      cancelled = true;
      if (timer !== null && typeof window !== "undefined") {
        window.clearTimeout(timer);
      }
    };
  }, [quip, presentationKey, playVoiceClip]);

  return (
    <div
      aria-hidden={quip === null}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-0"
    >
      <AnimatePresence>
        {quip !== null ? (
          <ManagerStandee key={presentationKey} quip={quip} side={side} surface="popup" />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
