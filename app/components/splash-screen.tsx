import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";

import {
  SAVE_SCHEMA_VERSION,
  type GameConfig,
  type GameSave,
  type Member,
  type PlayerKnowledgeRecord,
  type ShiftState,
} from "../domain/game";
import { miraPark, mrWhiskers, starterMembers, vhool } from "../fixtures/members";
import { APP_VERSION } from "../platform/release-identity";
import { lockAiProviderBaseUrlsForRuntime } from "../platform/runtime";
import { tryBackupSave } from "../repositories/backup-save";
import { createGameRepository } from "../repositories/create-game-repository";
import {
  readStoredGatewayApiKey,
  requestLocalAiStatus,
  storeGatewayApiKey,
} from "../services/ai/client";
import { getActiveShift } from "../services/game-seed";
import { errorToMessage } from "../services/utils";
import { buildVisibleMemberProfile } from "../services/player-knowledge";
import { AiSetupPanel, type AiSetupStatus } from "./ai-setup-panel";
import { CupidMark, EASE_OUT_QUART, LiveDot, Portrait, Tooltip, pad2 } from "./dashboard-atoms";

const MARQUEE_LINES = [
  "// reality bridge stable",
  "// embedding model warm",
  "// date plans shuffled",
  "// timesheets pending review",
  "// hopefuls awaiting brief",
  "// prophecy ledger sealed",
  "// coffee inventory: low",
  "// no incidents on file",
];

const FIRST_SHIFT_SUBHEAD =
  "First day on the floor. The hopefuls are in the lobby. Reality is, mostly, in one piece.";

const RETURNING_SUBHEAD =
  "The interns left the universe in roughly the same shape you found it. Mostly.";

const BADGE_SEAL = "0231-AC";
const AGENT_CODE = "OP-0231";
const ROLE_TITLE = "Interdimensional Dating Coach";

/* ------------------------------------------------------------------ */
/* Boot timing                                                        */
/*   Punch card is interactive from t=0. The riffle plays around it   */
/*   as decoration only: each hopeful card fades in at its peek       */
/*   position behind the badge so the avatar and details are visible, */
/*   lingers, then slowly shifts into the paper stack. Cards never    */
/*   move in front of the punch card. Status rows resolve over the    */
/*   same window so the page feels like one boot.                     */
/* ------------------------------------------------------------------ */

const BOOT_FINALE_AT_MS = 1100;

const BOOT_HEAD_DELAY_S = 0.08;
const BOOT_TAIL_DELAY_S = 0.32;
const BOOT_SUBHEAD_DELAY_S = 0.45;
const BOOT_QUOTE_DELAY_S = 0.6;
const BOOT_ROW_BASE_DELAY_MS = 380;
const BOOT_ROW_STAGGER_MS = 90;
const BOOT_ROW_RESOLVE_STAGGER_MS = 55;

const RIFFLE_FADE_IN_DELAY_MS = 180;
const RIFFLE_PER_CARD_DELAY_MS = 240;
const RIFFLE_FADE_IN_DURATION_S = 0.45;
const RIFFLE_LINGER_MS = 900;
const RIFFLE_SETTLE_DURATION_S = 1;

const STAMP_DURATION_MS = 720;

const INITIAL_AI_STATUS: AiSetupStatus = {
  status: "checking",
  message: "Querying AI provider.",
  details: [],
};

/* ------------------------------------------------------------------ */
/* Riffle deck (boot teaser)                                          */
/*   Real members from the starter roster, so the deck previews who   */
/*   the player will actually meet.                                   */
/* ------------------------------------------------------------------ */

type RiffleCardData = {
  member: Member;
  queueIndex: string;
};

const RIFFLE_CARDS: RiffleCardData[] = [
  { member: miraPark, queueIndex: "01" },
  { member: vhool, queueIndex: "09" },
  { member: mrWhiskers, queueIndex: "17" },
];

const RIFFLE_QUEUE_TOTAL = pad2(starterMembers.length);

const EMPTY_KNOWLEDGE: readonly PlayerKnowledgeRecord[] = [];

/**
 * Per-card layout keyframes for the boot riffle. Each card sits at its peek
 * position behind the punch card (offset far enough to show avatar or right
 * column details past the badge edges), then slowly shifts back into the
 * paper stack. Cards always render below the punch card on z-axis so the
 * peek reads as paper sticking out from behind a deck, never as a card on
 * top of the badge.
 */
type RiffleLayout = {
  peekX: number;
  peekY: number;
  peekRotate: number;
  tuckX: number;
  tuckY: number;
  tuckRotate: number;
  tuckOpacity: number;
};

const RIFFLE_LAYOUTS: RiffleLayout[] = [
  {
    peekX: 138,
    peekY: -46,
    peekRotate: 7.4,
    tuckX: 40,
    tuckY: 26,
    tuckRotate: 5.2,
    tuckOpacity: 0.72,
  },
  {
    peekX: -146,
    peekY: -34,
    peekRotate: -7.6,
    tuckX: -40,
    tuckY: 28,
    tuckRotate: -4.8,
    tuckOpacity: 0.66,
  },
  {
    peekX: 6,
    peekY: -158,
    peekRotate: 1.8,
    tuckX: 4,
    tuckY: 36,
    tuckRotate: 1.6,
    tuckOpacity: 0.58,
  },
];

type SplashScreenProps = {
  onPunchIn: () => void;
};

type SplashPhase = "idle" | "authenticating" | "seeding" | "wiping" | "stamping";

type AiBootState = "checking" | "ready" | "missing";

export function SplashScreen({ onPunchIn }: SplashScreenProps) {
  const repository = useMemo(() => createGameRepository(), []);
  const [save, setSave] = useState<GameSave | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>("idle");
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [confirmingWipe, setConfirmingWipe] = useState(false);
  const [gatewayApiKey, setGatewayApiKey] = useState("");
  const [isGatewayApiKeyLoaded, setIsGatewayApiKeyLoaded] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiSetupStatus>(INITIAL_AI_STATUS);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [stampActive, setStampActive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const storedKey = await readStoredGatewayApiKey();

      if (cancelled) {
        return;
      }

      setGatewayApiKey(storedKey);
      setIsGatewayApiKeyLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
        const backupKey = await tryBackupSave(repository);
        await repository.deleteSave();
        setSave(null);
        setHasLoaded(true);
        setPendingError(
          backupKey === null
            ? "Previous save failed schema review. Cupid filed a fresh form."
            : "Previous save failed schema review. Cupid filed a fresh form. The old file is preserved next to it as a .bak.* file in your saves folder.",
        );
      }
    }

    void readSave();

    return () => {
      cancelled = true;
    };
  }, [repository]);

  const aiReadinessConfig = useMemo(
    () => save?.config ?? null,
    [
      save?.config.aiProvider,
      save?.config.ollamaBaseURL,
      save?.config.gatewayBaseURL,
      save?.config.chatModel,
      save?.config.embeddingModel,
      save?.config.aiSetupComplete,
      save?.config.reasoningLevel,
    ],
  );

  useEffect(() => {
    if (aiReadinessConfig === null) {
      setAiStatus({
        status: "unavailable",
        message: "No save on file. AI provider configures on first shift.",
        details: [],
      });
      return;
    }

    if (!isGatewayApiKeyLoaded) {
      return;
    }

    let cancelled = false;
    setAiStatus(INITIAL_AI_STATUS);

    void (async () => {
      const next = await requestLocalAiStatus(aiReadinessConfig, gatewayApiKey);
      if (cancelled) {
        return;
      }
      setAiStatus(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [aiReadinessConfig, gatewayApiKey, isGatewayApiKeyLoaded]);

  const aiBoot: AiBootState =
    aiStatus.status === "checking" ? "checking" : deriveAiBoot(save, aiStatus);

  async function handlePrimary() {
    if (phase !== "idle" || stampActive) {
      return;
    }

    setStampActive(true);

    if (save !== null) {
      setPhase("stamping");
      window.setTimeout(() => {
        setPhase("authenticating");
        window.setTimeout(onPunchIn, 220);
      }, STAMP_DURATION_MS);
      return;
    }

    setPhase("seeding");
    try {
      const fresh = await repository.resetGame();
      setSave(fresh);
      window.setTimeout(() => {
        setPhase("authenticating");
        window.setTimeout(onPunchIn, 220);
      }, STAMP_DURATION_MS);
    } catch (error) {
      setPhase("idle");
      setStampActive(false);
      setPendingError(errorToMessage(error) || "Cupid could not seed the terminal.");
    }
  }

  async function handleWipeConfirmed() {
    if (phase !== "idle") {
      return;
    }
    setPhase("wiping");
    try {
      await tryBackupSave(repository);
      await repository.deleteSave();
      window.setTimeout(() => {
        setSave(null);
        setConfirmingWipe(false);
        setPhase("idle");
      }, 720);
    } catch (error) {
      setPhase("idle");
      setPendingError(errorToMessage(error) || "Cupid could not wipe the terminal.");
    }
  }

  async function handleConfigureAi() {
    if (phase !== "idle") {
      return;
    }

    if (save === null) {
      try {
        const fresh = await repository.resetGame();
        setSave(fresh);
        setAiPanelOpen(true);
      } catch (error) {
        setPendingError(errorToMessage(error) || "Cupid could not seed the terminal.");
      }
      return;
    }

    setAiPanelOpen(true);
  }

  async function handleSaveAiConfig(nextConfig: GameConfig, nextGatewayApiKey: string) {
    if (save === null) {
      return;
    }
    await storeGatewayApiKey(nextGatewayApiKey);
    setGatewayApiKey(nextGatewayApiKey.trim());
    setIsGatewayApiKeyLoaded(true);
    const nextSave: GameSave = { ...save, config: lockAiProviderBaseUrlsForRuntime(nextConfig) };
    await repository.saveGame(nextSave);
    setSave(nextSave);
  }

  async function handleCheckAiConfig(
    nextConfig: GameConfig,
    nextGatewayApiKey: string,
  ): Promise<AiSetupStatus> {
    const next = await requestLocalAiStatus(nextConfig, nextGatewayApiKey);
    setAiStatus(next);
    return next;
  }

  if (!hasLoaded) {
    return <SplashBootstrap />;
  }

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-aura-bg text-aura-ink ${
        stampActive ? "splash-shake" : ""
      }`}
    >
      <AmbientBackdrop />

      <TopBar />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-40 pt-32 lg:px-10 lg:pb-44 lg:pt-36">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <EditorialColumn
            hasSave={save !== null}
            aiBoot={aiBoot}
            aiMessage={aiStatus.message}
            onConfigureAi={handleConfigureAi}
          />
          <BadgeColumn
            save={save}
            phase={phase}
            confirmingWipe={confirmingWipe}
            errorMessage={pendingError}
            aiBoot={aiBoot}
            onPrimary={handlePrimary}
            onAskWipe={() => setConfirmingWipe(true)}
            onCancelWipe={() => setConfirmingWipe(false)}
            onConfirmWipe={handleWipeConfirmed}
            onConfigureAi={handleConfigureAi}
            onDismissError={() => setPendingError(null)}
          />
        </div>
      </main>

      <FooterMarquee />

      <AnimatePresence>{stampActive ? <StampImpact key="stamp" /> : null}</AnimatePresence>

      {save !== null && aiPanelOpen ? (
        <AiSetupPanel
          config={save.config}
          gatewayApiKey={gatewayApiKey}
          status={aiStatus}
          required={false}
          isActionPending={false}
          onSave={handleSaveAiConfig}
          onCheck={handleCheckAiConfig}
          onClose={() => setAiPanelOpen(false)}
        />
      ) : null}
    </div>
  );
}

function deriveAiBoot(save: GameSave | null, status: AiSetupStatus): AiBootState {
  if (save === null) {
    return "missing";
  }
  if (status.status === "ready" && save.config.aiSetupComplete) {
    return "ready";
  }
  return "missing";
}

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
/* Ambient backdrop                                                   */
/* ================================================================== */

function AmbientBackdrop() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frameId = 0;
    let pendingX = 0;
    let pendingY = 0;

    function handleMove(event: MouseEvent) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      pendingX = ((event.clientX - cx) / cx) * 8;
      pendingY = ((event.clientY - cy) / cy) * 8;
      if (frameId !== 0) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        setParallax({ x: pendingX, y: pendingY });
      });
    }

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        animate={{ x: parallax.x, y: parallax.y }}
        transition={{ type: "spring", stiffness: 60, damping: 18, mass: 0.6 }}
      >
        <div className="absolute -top-40 -left-40 h-[640px] w-[640px] rounded-full bg-aura-mesh-rose/55 blur-[140px] aura-blob-1" />
        <div className="absolute -top-20 right-0 h-[560px] w-[560px] rounded-full bg-aura-mesh-violet/55 blur-[140px] aura-blob-2" />
        <div className="absolute -bottom-40 left-1/4 h-[700px] w-[700px] rounded-full bg-aura-mesh-amber/45 blur-[140px] aura-blob-3" />
        <div className="absolute bottom-0 -right-20 h-[520px] w-[520px] rounded-full bg-aura-mesh-sky/45 blur-[140px] aura-blob-4" />
      </motion.div>

      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 aura-dot-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_75%)]"
        animate={{ x: parallax.x * 0.4, y: parallax.y * 0.4 }}
        transition={{ type: "spring", stiffness: 80, damping: 18, mass: 0.6 }}
      />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_30%,rgba(15,23,42,0.06)_90%)]"
      />
    </>
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

/* ================================================================== */
/* Editorial column                                                   */
/* ================================================================== */

function EditorialColumn({
  hasSave,
  aiBoot,
  aiMessage,
  onConfigureAi,
}: {
  hasSave: boolean;
  aiBoot: AiBootState;
  aiMessage: string;
  onConfigureAi: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay: 0.1 }}
      className="relative space-y-7"
    >
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
        // reality.cupid.gateway
      </p>

      <Headline hasSave={hasSave} />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT_QUART, delay: BOOT_SUBHEAD_DELAY_S }}
        className="max-w-[36ch] text-lead text-aura-muted"
      >
        {hasSave ? RETURNING_SUBHEAD : FIRST_SHIFT_SUBHEAD}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT_QUART, delay: BOOT_SUBHEAD_DELAY_S + 0.05 }}
        className="aura-rule max-w-md origin-left"
      />

      <PullQuote />

      <SystemStatusList aiBoot={aiBoot} aiMessage={aiMessage} onConfigureAi={onConfigureAi} />
    </motion.section>
  );
}

function Headline({ hasSave }: { hasSave: boolean }) {
  const head = hasSave ? "Welcome" : "Clock";
  const tail = hasSave ? "back." : "in.";

  return (
    <h1 className="font-display text-display-xl font-semibold leading-[0.95] tracking-tight text-aura-ink">
      <motion.span
        initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay: BOOT_HEAD_DELAY_S }}
        className="inline-block"
      >
        {head}
      </motion.span>{" "}
      <motion.span
        initial={{ opacity: 0, y: -34, scale: 1.5, rotate: -7 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT_QUART, delay: BOOT_TAIL_DELAY_S }}
        className="aura-accent inline-block text-display-xl text-aura-rose"
      >
        {tail}
      </motion.span>
    </h1>
  );
}

function PullQuote() {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_QUART, delay: BOOT_QUOTE_DELAY_S }}
      className="max-w-sm"
    >
      <blockquote className="aura-accent text-label italic leading-relaxed text-aura-muted">
        &ldquo;Match made, paperwork filed.&rdquo;
      </blockquote>
      <figcaption className="mt-1 font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
        Cupid handbook, page 1
      </figcaption>
    </motion.figure>
  );
}

/* ------------------------------ Status list ------------------------------ */

type StatusRowKind = "static" | "ai";

type StatusRowDef = {
  id: string;
  kind: StatusRowKind;
  label: string;
  finalTone: "rose" | "emerald" | "amber";
  finalValue: string;
};

function SystemStatusList({
  aiBoot,
  aiMessage,
  onConfigureAi,
}: {
  aiBoot: AiBootState;
  aiMessage: string;
  onConfigureAi: () => void;
}) {
  const aiTone: "emerald" | "amber" = aiBoot === "ready" ? "emerald" : "amber";
  const aiValue = aiBoot === "ready" ? "ready" : "configure";

  const rows: StatusRowDef[] = [
    {
      id: "reality",
      kind: "static",
      label: "reality bridge",
      finalTone: "emerald",
      finalValue: "stable",
    },
    {
      id: "prophecy",
      kind: "static",
      label: "prophecy ledger",
      finalTone: "emerald",
      finalValue: "sealed",
    },
    {
      id: "ai",
      kind: "ai",
      label: "ai system",
      finalTone: aiTone,
      finalValue: aiValue,
    },
    {
      id: "coffee",
      kind: "static",
      label: "coffee inventory",
      finalTone: "amber",
      finalValue: "critically low",
    },
  ];

  return (
    <ul className="space-y-1.5 pt-2 font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
      {rows.map((row, index) => (
        <SystemRow
          key={row.id}
          row={row}
          enterDelayMs={BOOT_ROW_BASE_DELAY_MS + index * BOOT_ROW_STAGGER_MS}
          resolveAtMs={BOOT_FINALE_AT_MS + index * BOOT_ROW_RESOLVE_STAGGER_MS}
          aiBoot={aiBoot}
          aiMessage={aiMessage}
          onConfigureAi={onConfigureAi}
        />
      ))}
    </ul>
  );
}

function SystemRow({
  row,
  enterDelayMs,
  resolveAtMs,
  aiBoot,
  aiMessage,
  onConfigureAi,
}: {
  row: StatusRowDef;
  enterDelayMs: number;
  resolveAtMs: number;
  aiBoot: AiBootState;
  aiMessage: string;
  onConfigureAi: () => void;
}) {
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setResolved(true), resolveAtMs);
    return () => window.clearTimeout(id);
  }, [resolveAtMs]);

  const showStaticFinal = resolved && row.kind === "static";
  const showAiFinal = resolved && row.kind === "ai" && aiBoot !== "checking";

  const tone = showStaticFinal || showAiFinal ? row.finalTone : "amber";
  const valueText = showStaticFinal ? row.finalValue : showAiFinal ? row.finalValue : "checking";

  const aiActionable = row.kind === "ai" && resolved && aiBoot === "missing";
  const labelNode = <span className="text-aura-faint">{row.label}</span>;

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT_QUART, delay: enterDelayMs / 1000 }}
      className="flex items-center gap-3"
    >
      <LiveDot tone={tone} />
      {row.kind === "ai" ? (
        <Tooltip message={aiMessage} placement="bottom-start">
          <span
            tabIndex={0}
            className="cursor-help rounded-sm outline-none focus-visible:text-aura-rose"
          >
            {row.label}
          </span>
        </Tooltip>
      ) : (
        labelNode
      )}
      <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
      {aiActionable ? (
        <button
          type="button"
          data-sfx="click"
          onClick={onConfigureAi}
          className="group inline-flex cursor-pointer items-center gap-1.5 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose transition hover:text-aura-fuchsia"
        >
          <span className="border-b border-dotted border-current/50 pb-0.5 transition group-hover:border-current">
            configure
          </span>
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </button>
      ) : (
        <span className={`font-semibold ${valueColorClass(tone, valueText)}`}>{valueText}</span>
      )}
    </motion.li>
  );
}

function valueColorClass(tone: "rose" | "emerald" | "amber", value: string): string {
  if (value === "checking") {
    return "text-aura-amber";
  }
  if (tone === "emerald") {
    return "text-aura-ink";
  }
  if (tone === "amber") {
    return "text-aura-amber";
  }
  return "text-aura-rose";
}

/* ================================================================== */
/* Badge column                                                       */
/* ================================================================== */

type BadgeColumnProps = {
  save: GameSave | null;
  phase: SplashPhase;
  confirmingWipe: boolean;
  errorMessage: string | null;
  aiBoot: AiBootState;
  onPrimary: () => void;
  onAskWipe: () => void;
  onCancelWipe: () => void;
  onConfirmWipe: () => void;
  onConfigureAi: () => void;
  onDismissError: () => void;
};

function BadgeColumn({
  save,
  phase,
  confirmingWipe,
  errorMessage,
  aiBoot,
  onPrimary,
  onAskWipe,
  onCancelWipe,
  onConfirmWipe,
  onConfigureAi,
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
      <RiffleStack save={save} showVoidStamp={showVoidStamp} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_QUART, delay: 0.05 }}
      >
        <ActionStack
          save={save}
          phase={phase}
          confirmingWipe={confirmingWipe}
          aiBoot={aiBoot}
          onPrimary={onPrimary}
          onAskWipe={onAskWipe}
          onCancelWipe={onCancelWipe}
          onConfirmWipe={onConfirmWipe}
          onConfigureAi={onConfigureAi}
        />
      </motion.div>

      <AnimatePresence>
        {errorMessage === null ? null : (
          <ErrorPill key="splash-error" message={errorMessage} onDismiss={onDismissError} />
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ------------------------------ Riffle stack ---------------------------- */

/**
 * Punch card is interactive from t=0. Riffle cards animate around it as
 * decoration: each fades in already peeked out behind the punch card so
 * the avatar and dossier details show, lingers for a beat, then slowly
 * shifts back into the paper stack. Cards stay below the punch card in
 * z-order the entire animation so the peek always reads as paper from
 * behind a deck, never as a card on top of the badge.
 */
function RiffleStack({ save, showVoidStamp }: { save: GameSave | null; showVoidStamp: boolean }) {
  return (
    <div className="relative grid [perspective:1400px]">
      {RIFFLE_CARDS.map((card, index) => {
        const layout = RIFFLE_LAYOUTS[index] ?? RIFFLE_LAYOUTS[0];
        const fadeInDelayMs = RIFFLE_FADE_IN_DELAY_MS + index * RIFFLE_PER_CARD_DELAY_MS;
        return (
          <RiffleCard
            key={card.member.id}
            data={card}
            layout={layout}
            fadeInDelayMs={fadeInDelayMs}
          />
        );
      })}

      <motion.div
        className="relative z-30 [grid-area:1/1]"
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      >
        <PunchCard save={save} showVoidStamp={showVoidStamp} />
      </motion.div>
    </div>
  );
}

type RifflePhase = "hidden" | "peek" | "tucked";

function RiffleCard({
  data,
  layout,
  fadeInDelayMs,
}: {
  data: RiffleCardData;
  layout: RiffleLayout;
  fadeInDelayMs: number;
}) {
  const [phase, setPhase] = useState<RifflePhase>("hidden");

  useEffect(() => {
    const peekTimer = window.setTimeout(() => setPhase("peek"), fadeInDelayMs);
    const tuckTimer = window.setTimeout(
      () => setPhase("tucked"),
      fadeInDelayMs + RIFFLE_FADE_IN_DURATION_S * 1000 + RIFFLE_LINGER_MS,
    );
    return () => {
      window.clearTimeout(peekTimer);
      window.clearTimeout(tuckTimer);
    };
  }, [fadeInDelayMs]);

  const target =
    phase === "tucked"
      ? {
          x: layout.tuckX,
          y: layout.tuckY,
          rotate: layout.tuckRotate,
          scale: 0.97,
          opacity: layout.tuckOpacity,
        }
      : phase === "peek"
        ? {
            x: layout.peekX,
            y: layout.peekY,
            rotate: layout.peekRotate,
            scale: 1,
            opacity: 1,
          }
        : {
            x: layout.peekX,
            y: layout.peekY,
            rotate: layout.peekRotate,
            scale: 0.96,
            opacity: 0,
          };

  const transitionDuration =
    phase === "tucked" ? RIFFLE_SETTLE_DURATION_S : RIFFLE_FADE_IN_DURATION_S;

  return (
    <motion.div
      initial={{
        x: layout.peekX,
        y: layout.peekY,
        rotate: layout.peekRotate,
        scale: 0.96,
        opacity: 0,
      }}
      animate={target}
      transition={{ duration: transitionDuration, ease: EASE_OUT_QUART }}
      className="pointer-events-none relative z-[5] will-change-transform [grid-area:1/1]"
      aria-hidden
    >
      <RiffleCardSlot data={data} />
    </motion.div>
  );
}

/* ------------------------------ Riffle card ----------------------------- */

function RiffleCardSlot({ data }: { data: RiffleCardData }) {
  const visibleProfile = buildVisibleMemberProfile(data.member, EMPTY_KNOWLEDGE);
  const publicFragment =
    visibleProfile.publicFragments[0] ??
    "A hopeful file with several pages, one signature, and a suspiciously warm paperclip.";
  const visibleSeals = visibleProfile.redactedBlocks.slice(0, 3);

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
      <div
        aria-hidden
        className="absolute inset-0 -z-20 translate-x-3 translate-y-4 rotate-[2.1deg] rounded-[28px] aura-glass-strong opacity-60"
      />

      <article className="aura-glass-strong relative overflow-hidden rounded-[28px] p-6 lg:p-7">
        <div className="relative z-10 flex items-baseline justify-between gap-3">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.34em] text-aura-rose">
            Cupid // hopeful.{data.queueIndex}
          </p>
          <p className="inline-flex items-center gap-2 font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
            <LiveDot tone="amber" />
            queue {data.queueIndex} / {RIFFLE_QUEUE_TOTAL}
          </p>
        </div>

        <div className="relative z-10 mt-5 flex items-end gap-5">
          <Portrait member={data.member} variant="card" asset="avatar" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-faint">
              hopeful
            </p>
            <h2 className="truncate font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
              {data.member.firstName}
            </h2>
            <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
              hopeful file
              <span className="mx-2 text-aura-faint">·</span>
              intake queued
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-5">
          <p className="aura-accent line-clamp-2 text-lead leading-snug text-aura-ink/85">
            {publicFragment}
          </p>
        </div>

        <dl className="relative z-10 mt-5 grid grid-cols-3 gap-x-3 gap-y-2">
          {visibleSeals.map((seal) => (
            <RiffleSeal key={seal.id} label={seal.label} lineCount={seal.lineCount} />
          ))}
        </dl>

        <div className="relative z-10 mt-5 flex items-center justify-between gap-3 font-mono text-micro uppercase tracking-[0.24em]">
          <span className="text-aura-faint">// dossier preview</span>
          <span className="text-aura-rose">sealed</span>
        </div>
      </article>
    </div>
  );
}

function RiffleSeal({ label, lineCount }: { label: string; lineCount: number }) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">{label}</dt>
      <dd className="flex items-center gap-1.5">
        {Array.from({ length: lineCount }).map((_, index) => (
          <span
            aria-hidden
            className="block h-1.5 w-5 rounded-full bg-aura-ink/20"
            key={`${label}-${index}`}
          />
        ))}
        <span className="sr-only">sealed</span>
      </dd>
    </div>
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

      <article className="aura-glass-strong relative overflow-hidden rounded-[28px] p-6 lg:p-7">
        <PunchCardHeader />

        <div className="relative z-10 mt-5 flex items-center gap-4">
          <BadgeChip />
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
              {ROLE_TITLE}
            </h2>
            <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
              pair operations
              <span className="mx-2 text-aura-faint">·</span>
              clearance interdimensional
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
      </article>
    </div>
  );
}

function PunchCardHeader() {
  return (
    <div className="relative z-10 flex items-baseline justify-between gap-3">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.34em] text-aura-rose">
        Cupid // employee.badge
      </p>
      <p className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
        seal {BADGE_SEAL}
      </p>
    </div>
  );
}

function BadgeChip() {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-[18px] shadow-quiet ring-1 ring-white/70">
      <CupidMark variant="tile" className="size-20" />
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
      <div
        aria-hidden
        className="splash-stripe-scan pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-micro font-semibold uppercase tracking-[0.42em] text-white/60">
        {AGENT_CODE} // CUPID PAIR OPS
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

  const shiftStatusLabel = activeShift.status === "active" ? "open" : "closed";
  const shiftDateLabel =
    activeShift.dateSlotsUsed > 0
      ? "booked"
      : activeShift.status === "completed"
        ? "skipped"
        : "open";
  const shiftDateSub = activeShift.status === "active" ? "one per shift" : "filed";
  const lifetimeLabel = dateCount === 0 ? "none yet" : `${dateCount} logged`;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-5 gap-y-2">
        <FeaturedStat label="hopefuls" value={`${memberCount}`} sub="on file" />
        <FeaturedStat label="shift date" value={shiftDateLabel} sub={shiftDateSub} />
      </dl>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-2 border-t border-aura-hairline pt-3">
        <Stat label="last in" value={updatedRelative} accent />
        <Stat label="lifetime dates" value={lifetimeLabel} />
      </dl>
      <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        shift {pad2(activeShift.shiftNumber)} // {shiftStatusLabel}
        <span className="mx-2 text-aura-faint">·</span>
        hired {createdAbsolute}
      </p>
    </div>
  );
}

function EmptyTerminalGrid() {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-5 gap-y-2">
        <FeaturedStat label="hopefuls" value="0" sub="awaiting brief" />
        <FeaturedStat label="shift date" value="pending" sub="one per shift" />
      </dl>
      <p className="border-t border-aura-hairline pt-3 text-label text-aura-muted">
        Punch in to seed the roster, draw date plans, and have HR run a prophecy check on your
        behalf.
      </p>
    </div>
  );
}

function FeaturedStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">{label}</dt>
      <dd className="font-display text-display-sm font-semibold leading-tight tracking-tight tabular-nums text-aura-ink">
        {value}
      </dd>
      <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">{sub}</p>
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
  aiBoot: AiBootState;
  onPrimary: () => void;
  onAskWipe: () => void;
  onCancelWipe: () => void;
  onConfirmWipe: () => void;
  onConfigureAi: () => void;
};

function ActionStack({
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
        data-sfx="dismiss"
        onClick={onDismiss}
        className="cursor-pointer font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-rose/80 hover:text-aura-rose"
      >
        Dismiss
      </button>
    </motion.div>
  );
}

/* ================================================================== */
/* Stamp impact (clock-in moment)                                     */
/* ================================================================== */

function StampImpact() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: 0.5 }}
      className="pointer-events-none fixed inset-0 z-40 grid place-items-center"
      aria-hidden
    >
      <div className="splash-stamp-impact relative">
        <div className="rounded-md border-[10px] border-aura-rose/80 px-10 py-4 font-mono text-display-md font-bold uppercase tracking-[0.42em] text-aura-rose shadow-cta">
          Clocked in
        </div>
        <div
          aria-hidden
          className="absolute -inset-3 -z-10 rounded-[20px] bg-aura-mesh-rose/45 blur-2xl"
        />
      </div>
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
          save.v{SAVE_SCHEMA_VERSION} // build.{APP_VERSION}
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
    return phase === "seeding" || phase === "stamping"
      ? "Issuing badge…"
      : "Clock in for first shift";
  }
  return phase === "authenticating" || phase === "stamping" ? "Authenticating…" : "Punch in";
}
