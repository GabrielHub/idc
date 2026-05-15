import { motion } from "motion/react";
import { useMemo, type ReactNode } from "react";
import { Link } from "react-router";

import { CupidMark, EASE_OUT_QUART, LiveDot } from "../dashboard-atoms";
import { WhatsNewUpdatePill } from "../whats-new-update-pill";
import { formatClock, formatDate, useTickingNow } from "./shared";

export function TopBar({
  canOpenReleaseNotes,
  hasUnreadReleaseNotes,
  onOpenReleaseNotes,
}: {
  canOpenReleaseNotes: boolean;
  hasUnreadReleaseNotes: boolean;
  onOpenReleaseNotes: () => void;
}) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="relative flex w-full items-center justify-between gap-3 px-4 pt-4 lg:px-8 lg:pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
          className="aura-glass pointer-events-auto inline-flex items-center gap-3 rounded-pill px-5 py-2.5"
        >
          <CupidMark className="size-4" />
          <span className="font-display text-base font-semibold tracking-tight text-aura-ink">
            Cupid
          </span>
          <span aria-hidden className="h-3 w-px bg-aura-hairline" />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            operations terminal
          </span>
          <span aria-hidden className="hidden h-3 w-px bg-aura-hairline lg:inline-block" />
          <span className="hidden font-mono text-micro uppercase tracking-[0.24em] text-aura-faint lg:inline">
            sub-basement 4
          </span>
        </motion.div>

        {canOpenReleaseNotes ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.02 }}
            className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 lg:top-6"
          >
            <WhatsNewUpdatePill
              hasUnreadNotes={hasUnreadReleaseNotes}
              onOpenReleaseNotes={onOpenReleaseNotes}
            />
          </motion.div>
        ) : null}

        <div className="flex items-center gap-2">
          <DocsPill />
          {import.meta.env.MODE === "desktop" ? null : <PlaygroundPill />}
          <ClockPill />
        </div>
      </div>
    </header>
  );
}

function NavPill({
  to,
  label,
  icon,
  delay,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay }}
      className="pointer-events-auto"
    >
      <Link
        to={to}
        className="aura-glass group inline-flex cursor-pointer items-center gap-2 rounded-pill px-4 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted transition hover:text-aura-rose"
      >
        {icon}
        <span>{label}</span>
        <span
          aria-hidden
          className="hidden translate-x-0 text-aura-faint transition group-hover:translate-x-0.5 group-hover:text-aura-rose lg:inline"
        >
          ↗
        </span>
      </Link>
    </motion.div>
  );
}

function DocsPill() {
  return <NavPill to="/docs" label="docs" icon={<DocsIcon />} delay={0.03} />;
}

function DocsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
      <rect x="3" y="2.5" width="9" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <line
        x1="5.3"
        y1="5.6"
        x2="9.7"
        y2="5.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="5.3"
        y1="8.1"
        x2="9.7"
        y2="8.1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="5.3"
        y1="10.6"
        x2="8"
        y2="10.6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlaygroundPill() {
  return <NavPill to="/playground" label="playground" icon={<PlaygroundIcon />} delay={0.04} />;
}

function PlaygroundIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
      <circle cx="4.2" cy="4.2" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.8" cy="4.2" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4.2" cy="11.8" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.8" cy="11.8" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ClockPill() {
  const now = useTickingNow();
  const formatted = useMemo(() => formatClock(now), [now]);
  const dateLabel = useMemo(() => formatDate(now), [now]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.06 }}
      className="aura-glass pointer-events-auto inline-flex items-center gap-3 rounded-pill px-5 py-2.5"
    >
      <LiveDot tone="emerald" />
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-ink tabular-nums">
        {formatted}
      </span>
      <span aria-hidden className="hidden h-3 w-px bg-aura-hairline lg:inline-block" />
      <span className="hidden font-mono text-micro uppercase tracking-[0.24em] text-aura-faint lg:inline">
        {dateLabel}
      </span>
    </motion.div>
  );
}
