import { AnimatePresence, motion } from "motion/react";

import type { GameSave } from "../../domain/game";
import { LiveDot } from "../dashboard-atoms";
import type { AiBootState, SplashPhase } from "./shared";

type ActionStackProps = {
  save: GameSave | null;
  phase: SplashPhase;
  confirmingWipe: boolean;
  aiBoot: AiBootState;
  onPrimary: () => void;
  onAskWipe: () => void;
  onCancelWipe: () => void;
  onConfirmWipe: () => void;
  onConfigureAi: () => void;
};

export function ActionStack({
  save,
  phase,
  confirmingWipe,
  aiBoot,
  onPrimary,
  onAskWipe,
  onCancelWipe,
  onConfirmWipe,
  onConfigureAi,
}: ActionStackProps) {
  const isBusy = phase !== "idle";
  const primaryLabel = derivePrimaryLabel(save, phase);

  return (
    <div className="space-y-3">
      <PrimaryPunchButton
        label={primaryLabel}
        disabled={isBusy}
        loading={phase === "authenticating" || phase === "seeding" || phase === "stamping"}
        onClick={onPrimary}
      />

      <AnimatePresence mode="wait" initial={false}>
        {save === null ? (
          <FreshShiftHint key="hint-empty" aiBoot={aiBoot} onConfigureAi={onConfigureAi} />
        ) : confirmingWipe ? (
          <WipeConfirm
            key="wipe-confirm"
            disabled={phase === "wiping"}
            wiping={phase === "wiping"}
            onCancel={onCancelWipe}
            onConfirm={onConfirmWipe}
          />
        ) : (
          <ReturningFooter
            key="returning-footer"
            aiBoot={aiBoot}
            disabled={isBusy}
            onAskWipe={onAskWipe}
            onConfigureAi={onConfigureAi}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FreshShiftHint({
  aiBoot,
  onConfigureAi,
}: {
  aiBoot: AiBootState;
  onConfigureAi: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.25 }}
      className="space-y-2"
    >
      <p className="text-center font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
        HR will seed your roster on the way in
      </p>
      <FreshAiHint aiBoot={aiBoot} onConfigureAi={onConfigureAi} />
    </motion.div>
  );
}

function FreshAiHint({
  aiBoot,
  onConfigureAi,
}: {
  aiBoot: AiBootState;
  onConfigureAi: () => void;
}) {
  if (aiBoot === "ready") {
    return null;
  }

  return (
    <motion.button
      type="button"
      data-sfx="click"
      onClick={onConfigureAi}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-pill border border-dashed border-aura-amber/55 bg-aura-amber/5 px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-amber transition hover:border-aura-amber/85 hover:bg-aura-amber/10 hover:text-aura-rose"
    >
      <LiveDot tone="amber" />
      <span>configure ai before first date</span>
      <span aria-hidden className="transition group-hover:translate-x-0.5">
        →
      </span>
    </motion.button>
  );
}

function ReturningFooter({
  aiBoot,
  disabled,
  onAskWipe,
  onConfigureAi,
}: {
  aiBoot: AiBootState;
  disabled: boolean;
  onAskWipe: () => void;
  onConfigureAi: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-2"
    >
      {aiBoot === "missing" ? (
        <button
          type="button"
          data-sfx="click"
          onClick={onConfigureAi}
          disabled={disabled}
          className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-pill border border-dashed border-aura-amber/55 bg-aura-amber/5 px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-amber transition hover:border-aura-amber/85 hover:bg-aura-amber/10 hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LiveDot tone="amber" />
          <span>ai provider needs review</span>
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </button>
      ) : null}
      <div className="flex items-center justify-center">
        <button
          type="button"
          data-sfx="danger"
          disabled={disabled}
          onClick={onAskWipe}
          className="group cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="border-b border-dotted border-current/40 pb-0.5 group-hover:border-current">
            Wipe save
          </span>
        </button>
      </div>
    </motion.div>
  );
}

function PrimaryPunchButton({
  label,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-sfx="stamp"
      disabled={disabled}
      onClick={onClick}
      className="aura-cta group relative w-full cursor-pointer overflow-hidden rounded-[20px] bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-6 py-5 text-left text-white shadow-cta ring-1 ring-white/40 ring-inset transition hover:-translate-y-px hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 translate-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-0"
      />

      <span className="relative z-10 flex items-center justify-between gap-4">
        <span className="space-y-1">
          <span className="block font-mono text-micro font-semibold uppercase tracking-[0.34em] text-white/80">
            {loading ? "stamping authorization" : "press to stamp"}
          </span>
          <span className="block font-display text-display-sm font-semibold leading-tight tracking-tight">
            {loading ? "Stamping…" : label}
          </span>
        </span>
        <PunchArrow loading={loading} />
      </span>
    </button>
  );
}

function PunchArrow({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-full bg-white/15 ring-1 ring-white/40"
      >
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-12 place-items-center rounded-full bg-white/15 ring-1 ring-white/40 transition group-hover:bg-white/25 group-hover:ring-white/60"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function WipeConfirm({
  disabled,
  wiping,
  onCancel,
  onConfirm,
}: {
  disabled: boolean;
  wiping: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.25 }}
      className="aura-glass-rose flex items-center justify-between gap-3 rounded-pill px-4 py-2"
    >
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
        {wiping ? "Wiping terminal…" : "Confirm wipe? This is permanent."}
      </span>
      <span className="flex items-center gap-1">
        <button
          type="button"
          data-sfx="dismiss"
          disabled={disabled}
          onClick={onCancel}
          className="cursor-pointer rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          data-sfx="danger"
          disabled={disabled}
          onClick={onConfirm}
          className="cursor-pointer rounded-pill bg-aura-rose px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-white shadow-quiet transition hover:bg-aura-fuchsia disabled:cursor-not-allowed disabled:opacity-50"
        >
          Wipe
        </button>
      </span>
    </motion.div>
  );
}

function derivePrimaryLabel(save: GameSave | null, phase: SplashPhase): string {
  if (save === null) {
    return phase === "seeding" || phase === "stamping"
      ? "Issuing badge…"
      : "Clock in for first shift";
  }
  return phase === "authenticating" || phase === "stamping" ? "Authenticating…" : "Punch in";
}
