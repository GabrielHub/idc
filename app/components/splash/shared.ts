import { useEffect, useMemo, useRef, useState } from "react";

import { pad2 } from "../dashboard-atoms";

export type SplashPhase = "idle" | "authenticating" | "seeding" | "wiping" | "stamping";

export type AiBootState = "checking" | "ready" | "missing";

export function useTickingNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

export function useTickingRelative(iso: string): string {
  const [tick, setTick] = useState(0);
  const lastIsoRef = useRef(iso);

  useEffect(() => {
    if (lastIsoRef.current !== iso) {
      lastIsoRef.current = iso;
      setTick((value) => value + 1);
    }

    const intervalId = window.setInterval(() => setTick((value) => value + 1), 30_000);
    return () => window.clearInterval(intervalId);
  }, [iso]);

  return useMemo(() => formatRelativeTime(iso, new Date()), [iso, tick]);
}

function formatRelativeTime(iso: string, now: Date): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "unknown";
  }

  const diff = Math.max(0, now.getTime() - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) {
    return "moments ago";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0 ? `${hours}h ago` : `${hours}h ${remainingMinutes}m ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return days === 1 ? "yesterday" : `${days}d ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }
  return `${Math.floor(months / 12)}y ago`;
}

export function formatClock(now: Date): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

export function formatDate(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
