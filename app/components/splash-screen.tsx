import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { SAVE_SCHEMA_VERSION, type GameConfig, type GameSave } from "../domain/game";
import { APP_VERSION } from "../platform/release-identity";
import { lockAiProviderBaseUrlsForRuntime } from "../platform/runtime";
import { tryBackupSave } from "../repositories/backup-save";
import { createGameRepository } from "../repositories/create-game-repository";
import {
  readStoredGatewayApiKey,
  requestLocalAiStatus,
  storeGatewayApiKey,
} from "../services/ai/client";
import {
  listReleaseNotesForModal,
  readStoredReleaseNotesVersion,
  writeStoredReleaseNotesVersion,
} from "../services/release-notes";
import { errorToMessage } from "../services/utils";
import { AiSetupPanel, type AiSetupStatus } from "./ai-setup-panel";
import { EASE_OUT_QUART, LiveDot } from "./dashboard-atoms";
import { ReleaseNotesModal } from "./release-notes-modal";
import { ActionStack } from "./splash/action-stack";
import { EditorialColumn } from "./splash/editorial-column";
import { RiffleStack } from "./splash/riffle-stack";
import type { AiBootState, SplashPhase } from "./splash/shared";
import { TopBar } from "./splash/top-bar";
import { StampMark } from "./stamp-mark";

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

const STAMP_DURATION_MS = 720;

const INITIAL_AI_STATUS: AiSetupStatus = {
  status: "checking",
  message: "Querying AI provider.",
  details: [],
};

type SplashScreenProps = {
  onPunchIn: () => void;
};

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
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const [hasUnreadReleaseNotes, setHasUnreadReleaseNotes] = useState(false);

  const releaseNotesForModal = useMemo(
    () => listReleaseNotesForModal({ currentVersion: APP_VERSION }),
    [],
  );

  useEffect(() => {
    if (releaseNotesForModal.length === 0) {
      return;
    }
    const lastSeen = readStoredReleaseNotesVersion();
    if (lastSeen === null || lastSeen !== APP_VERSION) {
      setHasUnreadReleaseNotes(true);
    }
  }, [releaseNotesForModal.length]);

  function handleOpenReleaseNotes() {
    setIsReleaseNotesOpen(true);
  }

  function handleCloseReleaseNotes() {
    setIsReleaseNotesOpen(false);
    writeStoredReleaseNotesVersion(APP_VERSION);
    setHasUnreadReleaseNotes(false);
  }

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

      <TopBar
        canOpenReleaseNotes={releaseNotesForModal.length > 0}
        hasUnreadReleaseNotes={hasUnreadReleaseNotes}
        onOpenReleaseNotes={handleOpenReleaseNotes}
      />

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

      <AnimatePresence>
        {isReleaseNotesOpen && releaseNotesForModal.length > 0 ? (
          <ReleaseNotesModal
            notes={releaseNotesForModal}
            initialVersion={APP_VERSION}
            onClose={handleCloseReleaseNotes}
          />
        ) : null}
      </AnimatePresence>
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

function StampImpact() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: 0.5 }}
      className="pointer-events-none fixed inset-0 z-40 grid place-items-center"
      aria-hidden
    >
      <StampMark animated size="lg">
        Clocked in
      </StampMark>
    </motion.div>
  );
}

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
