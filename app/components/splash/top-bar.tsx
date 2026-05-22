import { motion } from "motion/react";
import { type ReactNode } from "react";
import { Link } from "react-router";

import { CupidMark, EASE_OUT_QUART } from "../dashboard-atoms";
import { AudioSettingsMenu } from "../settings-menu";
import { WhatsNewUpdatePill } from "../whats-new-update-pill";

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
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 pt-4 lg:px-8 lg:pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
          className="aura-glass pointer-events-auto inline-flex min-w-0 max-w-full items-center justify-self-start rounded-pill px-4 py-2.5 sm:gap-3 sm:px-5"
        >
          <CupidMark className="size-4" />
          <span className="font-display text-base font-semibold tracking-tight text-aura-ink">
            Cupid
          </span>
          <span aria-hidden className="hidden h-3 w-px bg-aura-hairline sm:inline-block" />
          <span className="hidden font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose sm:inline">
            operations terminal
          </span>
          <span aria-hidden className="hidden h-3 w-px bg-aura-hairline 2xl:inline-block" />
          <span className="hidden font-mono text-micro uppercase tracking-[0.24em] text-aura-faint 2xl:inline">
            sub-basement 4
          </span>
        </motion.div>

        {canOpenReleaseNotes ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.02 }}
            className="pointer-events-none justify-self-center"
          >
            <WhatsNewUpdatePill
              hasUnreadNotes={hasUnreadReleaseNotes}
              onOpenReleaseNotes={onOpenReleaseNotes}
            />
          </motion.div>
        ) : null}

        <div className="flex min-w-0 items-center justify-self-end gap-2">
          <DocsPill />
          {import.meta.env.MODE === "desktop" ? null : <PlaygroundPill />}
          <SettingsPill />
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
        aria-label={label}
        title={label}
        className="aura-glass group inline-flex cursor-pointer items-center gap-2 rounded-pill px-3 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted transition hover:text-aura-rose xl:px-4"
      >
        {icon}
        <span className="hidden xl:inline">{label}</span>
        <span
          aria-hidden
          className="hidden translate-x-0 text-aura-faint transition group-hover:translate-x-0.5 group-hover:text-aura-rose xl:inline"
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

function SettingsPill() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.05 }}
    >
      <AudioSettingsMenu />
    </motion.div>
  );
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
