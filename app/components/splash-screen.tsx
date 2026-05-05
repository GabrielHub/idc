import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { SAVE_SCHEMA_VERSION, type GameSave, type ShiftState } from "../domain/game";
import {
  createBrowserStorageDriver,
  LocalGameRepository,
} from "../repositories/local-game-repository";
import { getActiveShift } from "../services/game-seed";
import { LiveDot } from "./dashboard-atoms";
import { pad2 } from "./dashboard-views";

const EASE_OUT_QUART: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

const MARQUEE_LINES = [
  "// reality bridge stable",
  "// embedding model warm",
  "// scenarios shuffled",
  "// timesheets pending review",
  "// hopefuls awaiting brief",
  "// prophecy ledger sealed",
  "// coffee inventory: low",
  "// no incidents on file",
];

const FIRST_SHIFT_SUBHEAD =
  "First day on the job. The hopefuls are in the lobby. Reality is, mostly, in one piece.";

const RETURNING_SUBHEAD =
  "The interns left the universe in roughly the same shape you found it. Mostly.";

const BADGE_SEAL = "0231-AC";

type SplashScreenProps = {
  onPunchIn: () => void;
};

export function SplashScreen({ onPunchIn }: SplashScreenProps) {
  const repository = useMemo(() => new LocalGameRepository(createBrowserStorageDriver()), []);
  const [save, setSave] = useState<GameSave | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>("idle");
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [confirmingWipe, setConfirmingWipe] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function readSave() {
      try {
        const existing = await repository.loadGame();
        if (cancelled) {
          return;
        }
        setSave(existing);
        setHasLoaded(true);
      } catch {
        if (cancelled) {
          return;
        }
        // Outdated save schema. Wipe so the splash treats it as a fresh terminal.
        await repository.deleteSave();
        setSave(null);
        setHasLoaded(true);
        setPendingError("Previous save failed schema review. Cupid filed a fresh form.");
      }
    }

    void readSave();

    return () => {
      cancelled = true;
    };
  }, [repository]);

  async function handlePrimary() {
    if (phase !== "idle") {
      return;
    }

    if (save !== null) {
      setPhase("authenticating");
      window.setTimeout(onPunchIn, 520);
      return;
    }

    try {
      setPhase("seeding");
      const fresh = await repository.resetGame();
      setSave(fresh);
      window.setTimeout(onPunchIn, 520);
    } catch (error) {
      setPhase("idle");
      setPendingError(
        error instanceof Error ? error.message : "Cupid could not seed the terminal.",
      );
    }
  }

  async function handleWipeConfirmed() {
    if (phase !== "idle") {
      return;
    }
    setPhase("wiping");
    try {
      await repository.deleteSave();
      window.setTimeout(() => {
        setSave(null);
        setConfirmingWipe(false);
        setPhase("idle");
      }, 720);
    } catch (error) {
      setPhase("idle");
      setPendingError(
        error instanceof Error ? error.message : "Cupid could not wipe the terminal.",
      );
    }
  }

  if (!hasLoaded) {
    return <SplashBootstrap />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-aura-bg text-aura-ink">
      <AmbientMesh />
      <DotGridLayer />
      <Vignette />

      <TopBar />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-40 pt-32 lg:px-10 lg:pb-44 lg:pt-36">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <EditorialColumn hasSave={save !== null} />
          <BadgeColumn
            save={save}
            phase={phase}
            confirmingWipe={confirmingWipe}
            errorMessage={pendingError}
            onPrimary={handlePrimary}
            onAskWipe={() => setConfirmingWipe(true)}
            onCancelWipe={() => setConfirmingWipe(false)}
            onConfirmWipe={handleWipeConfirmed}
            onDismissError={() => setPendingError(null)}
          />
        </div>
      </main>

      <FooterMarquee />
    </div>
  );
}

type SplashPhase = "idle" | "authenticating" | "seeding" | "wiping";

/* ================================================================== */
/* Bootstrap                                                          */
/* ================================================================== */

function SplashBootstrap() {
  return (
    <div className="grid min-h-screen place-items-center bg-aura-bg text-aura-ink">
      <div className="flex flex-col items-center gap-3">
        <LiveDot tone="amber" />
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          Reading punch card
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Top bar                                                            */
/* ================================================================== */

function TopBar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="flex w-full items-center justify-between gap-3 px-4 pt-4 lg:px-8 lg:pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
          className="aura-glass pointer-events-auto inline-flex items-center gap-3 rounded-pill px-5 py-2.5"
        >
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            IDC
          </span>
          <span aria-hidden className="h-3 w-px bg-aura-hairline" />
          <span className="font-display text-base font-semibold tracking-tight text-aura-ink">
            Operations Terminal
          </span>
          <span aria-hidden className="hidden h-3 w-px bg-aura-hairline lg:inline-block" />
          <span className="hidden font-mono text-micro uppercase tracking-[0.24em] text-aura-faint lg:inline">
            sub-basement 4
          </span>
        </motion.div>

        <ClockPill />
      </div>
    </header>
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

/* ================================================================== */
/* Editorial column                                                   */
/* ================================================================== */

function EditorialColumn({ hasSave }: { hasSave: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay: 0.1 }}
      className="relative space-y-7"
    >
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
        // reality.idc.gateway
      </p>

      <div className="space-y-2">
        <h1 className="font-display text-display-xl font-semibold leading-[0.95] tracking-tight text-aura-ink">
          {hasSave ? "Welcome " : "Clock "}
          <span className="aura-accent text-display-xl text-aura-rose">
            {hasSave ? "back." : "in."}
          </span>
        </h1>
      </div>

      <p className="max-w-[36ch] text-lead text-aura-muted">
        {hasSave ? RETURNING_SUBHEAD : FIRST_SHIFT_SUBHEAD}
      </p>

      <div className="aura-rule max-w-md" />

      <PullQuote />

      <SystemStatusList />
    </motion.section>
  );
}

function PullQuote() {
  return (
    <figure className="max-w-md">
      <blockquote className="aura-accent text-display-sm leading-snug text-aura-ink">
        “Match made,
        <br />
        paperwork filed.”
      </blockquote>
      <figcaption className="mt-2 font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
        IDC employee handbook, page 1
      </figcaption>
    </figure>
  );
}

function SystemStatusList() {
  return (
    <ul className="space-y-1.5 pt-2 font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
      <SystemRow tone="emerald" label="reality bridge" value="stable" />
      <SystemRow tone="emerald" label="prophecy ledger" value="sealed" />
      <SystemRow tone="amber" label="coffee inventory" value="critically low" />
    </ul>
  );
}

function SystemRow({
  tone,
  label,
  value,
}: {
  tone: "rose" | "emerald" | "amber";
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <LiveDot tone={tone} />
      <span className="text-aura-faint">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
      <span className="font-semibold text-aura-ink">{value}</span>
    </li>
  );
}

/* ================================================================== */
/* Badge column                                                       */
/* ================================================================== */

type BadgeColumnProps = {
  save: GameSave | null;
  phase: SplashPhase;
  confirmingWipe: boolean;
  errorMessage: string | null;
  onPrimary: () => void;
  onAskWipe: () => void;
  onCancelWipe: () => void;
  onConfirmWipe: () => void;
  onDismissError: () => void;
};

function BadgeColumn({
  save,
  phase,
  confirmingWipe,
  errorMessage,
  onPrimary,
  onAskWipe,
  onCancelWipe,
  onConfirmWipe,
  onDismissError,
}: BadgeColumnProps) {
  const showVoidStamp = phase === "wiping";

  return (
    <motion.section
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay: 0.18 }}
      className="relative flex flex-col items-stretch gap-6"
    >
      <PunchCard save={save} showVoidStamp={showVoidStamp} />

      <ActionStack
        save={save}
        phase={phase}
        confirmingWipe={confirmingWipe}
        onPrimary={onPrimary}
        onAskWipe={onAskWipe}
        onCancelWipe={onCancelWipe}
        onConfirmWipe={onConfirmWipe}
      />

      <AnimatePresence>
        {errorMessage === null ? null : (
          <ErrorPill key="splash-error" message={errorMessage} onDismiss={onDismissError} />
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ------------------------------ Punch card ------------------------------ */

function PunchCard({ save, showVoidStamp }: { save: GameSave | null; showVoidStamp: boolean }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-2 -z-10 rounded-[36px] bg-gradient-to-br from-aura-mesh-rose/45 via-aura-mesh-violet/40 to-aura-mesh-amber/40 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 -translate-x-2 translate-y-2 rotate-[-2.4deg] rounded-[28px] aura-glass-rose"
      />

      <motion.article
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT_QUART, delay: 0.22 }}
        className="aura-glass-strong relative overflow-hidden rounded-[28px] p-6 lg:p-7"
      >
        <PunchCardHeader />

        <div className="relative z-10 mt-5 flex items-end gap-5">
          <BadgeChip />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-faint">
              employee
            </p>
            <h2 className="truncate font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
              Cupid
            </h2>
            <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
              operations agent
              <span className="mx-2 text-aura-faint">·</span>
              clearance: interdimensional
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-5">
          <MagneticStripe />
        </div>

        <div className="relative z-10 mt-5">
          {save === null ? <EmptyTerminalGrid /> : <SaveStatGrid save={save} />}
        </div>

        <div className="relative z-10 mt-5 flex items-center justify-between gap-3 font-mono text-micro uppercase tracking-[0.24em]">
          <span className="text-aura-faint">// authorization</span>
          <span className="text-aura-ink">{save === null ? "PENDING" : "CLEARED"}</span>
        </div>

        <AnimatePresence>
          {save !== null && !showVoidStamp ? <ActiveStamp key="active" /> : null}
          {showVoidStamp ? <VoidStamp key="void" /> : null}
        </AnimatePresence>
      </motion.article>
    </div>
  );
}

function PunchCardHeader() {
  return (
    <div className="relative z-10 flex items-baseline justify-between gap-3">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.34em] text-aura-rose">
        IDC // employee.badge
      </p>
      <p className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
        seal {BADGE_SEAL}
      </p>
    </div>
  );
}

function BadgeChip() {
  return (
    <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-[18px] bg-gradient-to-br from-rose-100 via-fuchsia-100 to-violet-100 shadow-quiet ring-1 ring-white/85">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.85),transparent_55%)]"
      />
      <svg viewBox="0 0 32 32" className="relative size-9 text-aura-rose" aria-hidden>
        <defs>
          <linearGradient id="splash-heart" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="60%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <path
          d="M16 27.4S4.5 20.2 4.5 12.5C4.5 8.6 7.6 5.6 11.4 5.6c2.3 0 4 1.1 4.6 2.7.6-1.6 2.3-2.7 4.6-2.7 3.8 0 6.9 3 6.9 6.9 0 7.7-11.5 14.9-11.5 14.9z"
          fill="url(#splash-heart)"
        />
      </svg>
    </div>
  );
}

function MagneticStripe() {
  return (
    <div className="relative h-9 overflow-hidden rounded-[10px] border border-aura-hairline bg-gradient-to-b from-slate-900 to-slate-800">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 right-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_2px,transparent_2px,transparent_6px)]"
      />
      <div aria-hidden className="absolute inset-x-2 top-1.5 h-1.5 rounded-full bg-white/15" />
      <div aria-hidden className="absolute inset-x-12 bottom-1.5 h-1 rounded-full bg-white/10" />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-micro font-semibold uppercase tracking-[0.42em] text-white/60">
        OP-0231-AGENT-CUPID
      </span>
    </div>
  );
}

function SaveStatGrid({ save }: { save: GameSave }) {
  const activeShift = useMemo<ShiftState>(() => getActiveShift(save), [save]);
  const memberCount = save.members.length;
  const dateCount = save.dateSessions.length;
  const updatedRelative = useTickingRelative(save.updatedAt);
  const createdAbsolute = useMemo(() => formatTimestamp(save.createdAt), [save.createdAt]);

  const shiftLabel = `${pad2(activeShift.shiftNumber)} // ${activeShift.status === "active" ? "open" : "closed"}`;
  const slotsLabel = `${activeShift.dateSlotsUsed} / ${activeShift.dateSlotsTotal} booked`;

  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-3">
      <Stat label="shift" value={shiftLabel} />
      <Stat label="dates this shift" value={slotsLabel} />
      <Stat label="hopefuls" value={`${memberCount} on file`} />
      <Stat label="lifetime dates" value={dateCount === 0 ? "none yet" : `${dateCount} logged`} />
      <Stat label="last in" value={updatedRelative} accent />
      <Stat label="hired" value={createdAbsolute} />
    </dl>
  );
}

function EmptyTerminalGrid() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-5 gap-y-4">
        <Stat label="shift" value="awaiting issue" />
        <Stat label="hopefuls" value="0 on file" />
        <Stat label="last in" value="never" />
        <Stat label="lifetime dates" value="none" accent />
      </div>
      <p className="border-t border-aura-hairline pt-4 text-label text-aura-muted">
        No active terminal. Clock in to seed the roster, draw scenarios, and have HR run a prophecy
        check on your behalf.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">{label}</dt>
      <dd
        className={`truncate font-display text-lead font-semibold tracking-tight ${accent ? "text-aura-rose" : "text-aura-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function ActiveStamp() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: 6 }}
      animate={{ opacity: 1, scale: 1, rotate: 14 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.6 }}
      className="pointer-events-none absolute right-7 top-1/2 z-10 select-none -translate-y-2"
      aria-hidden
    >
      <div className="rounded-md border-[3px] border-aura-emerald/70 bg-emerald-50/40 px-3 py-1.5 font-mono text-label font-bold uppercase tracking-[0.32em] text-aura-emerald shadow-quiet">
        Active
      </div>
    </motion.div>
  );
}

function VoidStamp() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.2, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: -10 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
      className="pointer-events-none absolute inset-0 z-20 grid select-none place-items-center"
      aria-hidden
    >
      <div className="rounded-md border-[6px] border-aura-rose/80 px-6 py-2 font-mono text-display-sm font-bold uppercase tracking-[0.4em] text-aura-rose/85 shadow-cta">
        VOID
      </div>
    </motion.div>
  );
}

/* ------------------------------ Action stack ----------------------------- */

type ActionStackProps = {
  save: GameSave | null;
  phase: SplashPhase;
  confirmingWipe: boolean;
  onPrimary: () => void;
  onAskWipe: () => void;
  onCancelWipe: () => void;
  onConfirmWipe: () => void;
};

function ActionStack({
  save,
  phase,
  confirmingWipe,
  onPrimary,
  onAskWipe,
  onCancelWipe,
  onConfirmWipe,
}: ActionStackProps) {
  const isBusy = phase !== "idle";
  const primaryLabel = derivePrimaryLabel(save, phase);

  return (
    <div className="space-y-3">
      <PrimaryPunchButton
        label={primaryLabel}
        disabled={isBusy}
        loading={phase === "authenticating" || phase === "seeding"}
        onClick={onPrimary}
      />

      <AnimatePresence mode="wait" initial={false}>
        {save === null ? (
          <motion.p
            key="hint-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center font-mono text-micro uppercase tracking-[0.28em] text-aura-faint"
          >
            HR will seed your roster on the way in
          </motion.p>
        ) : confirmingWipe ? (
          <WipeConfirm
            key="wipe-confirm"
            disabled={phase === "wiping"}
            wiping={phase === "wiping"}
            onCancel={onCancelWipe}
            onConfirm={onConfirmWipe}
          />
        ) : (
          <motion.div
            key="wipe-link"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-center"
          >
            <button
              type="button"
              disabled={isBusy}
              onClick={onAskWipe}
              className="group cursor-pointer rounded-pill px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="border-b border-dotted border-current/40 pb-0.5 group-hover:border-current">
                Wipe save
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
          disabled={disabled}
          onClick={onCancel}
          className="cursor-pointer rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
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

function ErrorPill({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.25 }}
      className="aura-glass-rose flex items-start justify-between gap-3 rounded-card px-4 py-3 text-aura-rose"
    >
      <p className="text-label leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="cursor-pointer font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose/80 hover:text-aura-rose"
      >
        Dismiss
      </button>
    </motion.div>
  );
}

/* ================================================================== */
/* Marquee + footer                                                   */
/* ================================================================== */

function FooterMarquee() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div className="flex items-center justify-between gap-4 px-4 pb-4 lg:px-8 lg:pb-6">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.4 }}
          className="aura-glass pointer-events-auto inline-flex items-center gap-2 rounded-pill px-4 py-1.5 font-mono text-micro uppercase tracking-[0.28em] text-aura-faint"
        >
          <span className="size-1 rounded-full bg-aura-faint aura-caret" />
          save.v{SAVE_SCHEMA_VERSION} // build.20260504
        </motion.span>

        <Marquee />

        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_QUART, delay: 0.45 }}
          className="aura-glass pointer-events-auto hidden items-center gap-2 rounded-pill px-4 py-1.5 font-mono text-micro uppercase tracking-[0.28em] text-aura-muted lg:inline-flex"
        >
          dept // pair operations
        </motion.span>
      </div>
    </div>
  );
}

function Marquee() {
  return (
    <div className="aura-glass pointer-events-auto hidden h-8 max-w-xl flex-1 items-center overflow-hidden rounded-pill px-4 md:inline-flex">
      <div className="flex animate-[splash-marquee_36s_linear_infinite] gap-10 whitespace-nowrap font-mono text-micro uppercase tracking-[0.28em] text-aura-muted">
        {[...MARQUEE_LINES, ...MARQUEE_LINES].map((line, index) => (
          <span key={`${line}-${index}`} className="shrink-0">
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Mesh + atmosphere                                                  */
/* ================================================================== */

function AmbientMesh() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[640px] w-[640px] rounded-full bg-aura-mesh-rose/55 blur-[140px] aura-blob-1" />
      <div className="absolute -top-20 right-0 h-[560px] w-[560px] rounded-full bg-aura-mesh-violet/55 blur-[140px] aura-blob-2" />
      <div className="absolute -bottom-40 left-1/4 h-[700px] w-[700px] rounded-full bg-aura-mesh-amber/45 blur-[140px] aura-blob-3" />
      <div className="absolute bottom-0 -right-20 h-[520px] w-[520px] rounded-full bg-aura-mesh-sky/45 blur-[140px] aura-blob-4" />
    </div>
  );
}

function DotGridLayer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 aura-dot-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_75%)]"
    />
  );
}

function Vignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_30%,rgba(15,23,42,0.06)_90%)]"
    />
  );
}

/* ================================================================== */
/* Hooks + helpers                                                    */
/* ================================================================== */

function useTickingNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

function useTickingRelative(iso: string): string {
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

function formatClock(now: Date): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

function formatDate(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function derivePrimaryLabel(save: GameSave | null, phase: SplashPhase): string {
  if (save === null) {
    return phase === "seeding" ? "Issuing badge…" : "Clock in for first shift";
  }
  return phase === "authenticating" ? "Authenticating…" : "Punch in";
}
