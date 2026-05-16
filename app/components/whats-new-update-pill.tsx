import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { isTauriRuntime } from "../platform/runtime";
import {
  checkForDesktopUpdate,
  installPendingDesktopUpdate,
  type DesktopUpdateCheckResult,
} from "../platform/tauri-updater";
import { errorToMessage } from "../services/utils";
import { EASE_OUT_QUART } from "./dashboard-atoms";
import { formatNoteTimestamp } from "./notes-format";
import { formatBytes } from "./settings-update-state";

type UpdatePillState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "current" }
  | { status: "unsupported" }
  | { status: "available"; version: string; notes: string; date: string | null }
  | {
      status: "installing";
      version: string;
      downloadedBytes: number;
      totalBytes: number | null;
    }
  | { status: "error"; message: string };

const INITIAL_STATE: UpdatePillState = { status: "idle" };
const LAUNCH_UPDATE_CHECK_DELAY_MS = 1500;

export function WhatsNewUpdatePill({
  hasUnreadNotes,
  onOpenReleaseNotes,
}: {
  hasUnreadNotes: boolean;
  onOpenReleaseNotes: () => void;
}) {
  const [updateState, setUpdateState] = useState<UpdatePillState>(INITIAL_STATE);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const checkStartedRef = useRef(false);

  useEffect(() => {
    if (!isTauriRuntime() || checkStartedRef.current) {
      return;
    }
    checkStartedRef.current = true;
    let mounted = true;

    const timer = window.setTimeout(() => {
      void runCheck({ silentFailure: true, mounted: () => mounted });
    }, LAUNCH_UPDATE_CHECK_DELAY_MS);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isPopoverOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current === null) {
        return;
      }
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPopoverOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isPopoverOpen]);

  async function runCheck({
    silentFailure,
    mounted = () => true,
  }: {
    silentFailure: boolean;
    mounted?: () => boolean;
  }) {
    if (!silentFailure) {
      setUpdateState({ status: "checking" });
    }

    try {
      const result = await checkForDesktopUpdate();
      if (!mounted()) {
        return;
      }
      applyCheckResult(result);
    } catch (error) {
      if (!mounted() || silentFailure) {
        return;
      }
      setUpdateState({
        status: "error",
        message: errorToMessage(error) || "Update check failed.",
      });
    }
  }

  function applyCheckResult(result: DesktopUpdateCheckResult) {
    if (result.status === "available") {
      setUpdateState({
        status: "available",
        version: result.version,
        notes: result.notes,
        date: result.date,
      });
      return;
    }
    setUpdateState({ status: result.status });
  }

  async function handleInstall() {
    if (updateState.status !== "available") {
      return;
    }
    const version = updateState.version;
    setUpdateState({
      status: "installing",
      version,
      downloadedBytes: 0,
      totalBytes: null,
    });

    try {
      await installPendingDesktopUpdate((progress) => {
        setUpdateState({
          status: "installing",
          version,
          downloadedBytes: progress.downloadedBytes,
          totalBytes: progress.totalBytes,
        });
      });
    } catch (error) {
      setUpdateState({
        status: "error",
        message: errorToMessage(error) || "Update install failed.",
      });
    }
  }

  function handleOpenWhatsNew() {
    setIsPopoverOpen(false);
    onOpenReleaseNotes();
  }

  function handleToggleUpdatePopover() {
    setIsPopoverOpen((open) => !open);
  }

  const showUpdateSegment =
    updateState.status === "available" || updateState.status === "installing";

  return (
    <div ref={wrapperRef} className="pointer-events-auto relative inline-block">
      <motion.div
        layout
        transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
        className="aura-glass inline-flex items-stretch overflow-hidden rounded-pill"
      >
        <button
          type="button"
          data-sfx="menu"
          onClick={handleOpenWhatsNew}
          aria-label={hasUnreadNotes ? "Open What's New (unread updates)" : "Open What's New"}
          title="What's new"
          className="group inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted transition hover:text-aura-rose"
        >
          <SparkIcon />
          <span>what's new</span>
          {hasUnreadNotes ? <UnreadDot /> : null}
        </button>

        {showUpdateSegment ? (
          <>
            <span aria-hidden className="my-2 w-px bg-aura-hairline-strong" />
            <button
              type="button"
              data-sfx="menu"
              onClick={handleToggleUpdatePopover}
              aria-expanded={isPopoverOpen}
              aria-haspopup="dialog"
              aria-label={`Desktop update v${updateState.version} ready`}
              title={`Desktop update v${updateState.version} ready`}
              className="group relative inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose transition hover:bg-aura-rose hover:text-white"
            >
              <UpdatePulseDot active={updateState.status === "available"} />
              <span>{updateState.status === "installing" ? "installing" : "update"}</span>
              <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink transition group-hover:text-white">
                v{updateState.version}
              </span>
              <ChevronDownIcon />
            </button>
          </>
        ) : null}
      </motion.div>

      <AnimatePresence>
        {isPopoverOpen && showUpdateSegment ? (
          <motion.div
            key="update-popover"
            role="dialog"
            aria-modal="false"
            aria-label="Desktop update details"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
            onClick={(event) => event.stopPropagation()}
            className="aura-glass-strong absolute left-1/2 top-full z-50 mt-3 w-80 -translate-x-1/2 overflow-hidden rounded-card p-5 shadow-card"
          >
            <UpdatePopoverBody state={updateState} onInstall={handleInstall} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/* Popover body                                                       */
/* ================================================================== */

function UpdatePopoverBody({
  state,
  onInstall,
}: {
  state: UpdatePillState;
  onInstall: () => void;
}) {
  if (state.status === "available") {
    return (
      <>
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
          desk dispatch // signed build
        </p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
            v{state.version}
          </span>
          {state.date === null ? null : (
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
              filed {formatNoteTimestamp(state.date)}
            </span>
          )}
        </div>
        {state.notes.trim().length > 0 ? (
          <p className="mt-3 line-clamp-3 text-label leading-relaxed text-aura-muted">
            {state.notes.trim()}
          </p>
        ) : (
          <p className="mt-3 text-label leading-relaxed text-aura-muted">
            New signed desktop build is staged. Installing will download, replace, and relaunch
            Cupid.
          </p>
        )}
        <button
          type="button"
          data-sfx="primary"
          onClick={onInstall}
          className="mt-4 block w-full cursor-pointer rounded-pill bg-aura-ink px-4 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-aura-rose"
        >
          Install v{state.version} and relaunch
        </button>
        <p className="mt-2 font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
          cupid restarts on the new build :: saves stay put
        </p>
      </>
    );
  }

  if (state.status === "installing") {
    return (
      <>
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          installing v{state.version}
        </p>
        <p className="mt-2 text-label leading-relaxed text-aura-muted">
          Cupid is pulling the signed build. The window will relaunch when the new copy is staged.
        </p>
        <p className="mt-3 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink tabular-nums">
          {formatInstallProgress(state)}
        </p>
      </>
    );
  }

  if (state.status === "error") {
    return (
      <>
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          dispatch blocked
        </p>
        <p className="mt-2 rounded-tile border border-aura-rose/30 bg-rose-50/75 px-3 py-2 text-label leading-relaxed text-aura-rose">
          {state.message}
        </p>
      </>
    );
  }

  return null;
}

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

function formatInstallProgress(state: Extract<UpdatePillState, { status: "installing" }>): string {
  if (state.totalBytes === null || state.totalBytes <= 0) {
    return `${formatBytes(state.downloadedBytes)} received`;
  }
  const percent = Math.min(100, Math.round((state.downloadedBytes / state.totalBytes) * 100));
  return `${percent}% received :: ${formatBytes(state.downloadedBytes)} / ${formatBytes(state.totalBytes)}`;
}

/* ================================================================== */
/* Glyphs                                                             */
/* ================================================================== */

function SparkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
      <path
        d="M8 1.5L9.2 5.5L13.5 6.8L9.2 8L8 12L6.8 8L2.5 6.8L6.8 5.5L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M13 11.5L13.6 13.2L15.2 13.8L13.6 14.4L13 16L12.4 14.4L10.8 13.8L12.4 13.2L13 11.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UnreadDot() {
  return (
    <span className="relative ml-0.5 inline-flex size-1.5" aria-hidden>
      <span className="absolute inset-0 rounded-full bg-aura-rose opacity-70 aura-pulse" />
      <span className="relative inline-flex size-1.5 rounded-full bg-aura-rose" />
    </span>
  );
}

function UpdatePulseDot({ active }: { active: boolean }) {
  return (
    <span className="relative inline-flex size-1.5" aria-hidden>
      {active ? (
        <span className="absolute inset-0 rounded-full bg-aura-rose opacity-70 aura-pulse" />
      ) : null}
      <span className="relative inline-flex size-1.5 rounded-full bg-aura-rose" />
    </span>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-3 transition group-aria-expanded:rotate-180"
    >
      <path d="M4 6L8 10L12 6" />
    </svg>
  );
}
