import { motion } from "motion/react";
import { useEffect } from "react";

import { EASE_OUT_QUART } from "../dashboard-atoms";

export type WelcomeBeat = {
  label: string;
  copy: string;
};

export type TutorialWelcomeModalProps = {
  agentCode: string;
  shiftLabel: string;
  title: string;
  hook: string;
  beats: readonly WelcomeBeat[];
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary: () => void;
};

export function TutorialWelcomeModal({
  agentCode,
  shiftLabel,
  title,
  hook,
  beats,
  primaryLabel = "Begin orientation",
  secondaryLabel = "Skip, I've worked here before",
  onPrimary,
  onSecondary,
}: TutorialWelcomeModalProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onSecondary();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onSecondary]);

  return (
    <motion.div
      key="tutorial-welcome-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
      className="fixed inset-0 z-50 grid place-items-center bg-aura-ink/60 px-4 py-8 backdrop-blur-xl"
    >
      <motion.div
        key="tutorial-welcome-card"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.36, ease: EASE_OUT_QUART }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-welcome-title"
        className="aura-glass-strong relative w-full max-w-2xl overflow-hidden rounded-card p-8 shadow-card md:p-10"
      >
        <WelcomeBackdrop />

        <div className="relative z-10">
          <header className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
              new hire orientation // {shiftLabel}
            </p>
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
              agent {agentCode}
            </p>
          </header>

          <h2
            id="tutorial-welcome-title"
            className="mt-4 font-display text-display-md font-semibold leading-[1.05] text-aura-ink md:text-display-lg"
          >
            {title}
          </h2>

          <p className="aura-accent mt-3 text-lead leading-snug text-aura-muted">{hook}</p>

          <ol className="mt-6 grid gap-3 md:grid-cols-3">
            {beats.map((beat, index) => (
              <li
                key={beat.label}
                className="aura-glass aura-dock-rise rounded-chip p-4"
                style={{ animationDelay: `${120 + index * 80}ms` }}
              >
                <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                  {String(index + 1).padStart(2, "0")} // {beat.label}
                </p>
                <p className="mt-2 text-label leading-relaxed text-aura-ink">{beat.copy}</p>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              data-sfx="click"
              onClick={onSecondary}
              className="cursor-pointer rounded-pill border border-transparent bg-white/30 px-4 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/60 hover:text-aura-ink"
            >
              {secondaryLabel}
            </button>
            <button
              type="button"
              data-sfx="primary"
              onClick={onPrimary}
              className="cursor-pointer rounded-pill bg-aura-ink px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta transition hover:bg-aura-rose"
            >
              {primaryLabel}
            </button>
          </div>

          <p className="mt-4 font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
            standard cosmic onboarding :: skippable :: replayable from settings
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function WelcomeBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute -left-20 -top-24 size-72 rounded-full bg-aura-mesh-rose/55 blur-3xl aura-blob-1" />
      <span className="absolute -right-24 top-1/3 size-80 rounded-full bg-aura-mesh-violet/55 blur-3xl aura-blob-2" />
      <span className="absolute -bottom-32 left-1/4 size-96 rounded-full bg-aura-mesh-amber/45 blur-3xl aura-blob-3" />
    </div>
  );
}
