import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { SAVE_SCHEMA_VERSION, type GameConfig } from "../domain/game";
import { APP_VERSION } from "../platform/release-identity";
import { isTauriRuntime } from "../platform/runtime";
import { openTauriLogFolder, openTauriSaveFolder } from "../platform/tauri-log-folder";
import {
  checkForDesktopUpdate,
  installPendingDesktopUpdate,
  type DesktopUpdateCheckResult,
} from "../platform/tauri-updater";
import { errorToMessage } from "../services/utils";
import type { AiSetupStatus } from "./ai-setup-panel";
import { MenuButton } from "./dashboard-atoms";
import { useSfx } from "./sfx-provider";

export type DiagnosticsSnapshot = {
  appVersion: string;
  saveSchema: number;
  runtime: "tauri" | "browser";
  os: string;
  provider: string;
  chatModel: string;
  embeddingModel: string;
  reasoningLevel: string;
  lastAiCheck: {
    status: AiSetupStatus["status"];
    message: string;
    checkedAt: string | null;
  };
};

type UpdateMenuState =
  | {
      status: "idle";
      message: string;
    }
  | {
      status: "checking";
      message: string;
    }
  | {
      status: "current";
      message: string;
    }
  | {
      status: "unsupported";
      message: string;
    }
  | {
      status: "available";
      version: string;
      notes: string;
      date: string | null;
    }
  | {
      status: "installing";
      version: string;
      downloadedBytes: number;
      totalBytes: number | null;
    }
  | {
      status: "error";
      message: string;
    };

const INITIAL_UPDATE_STATE: UpdateMenuState = {
  status: "idle",
  message: "Check GitHub Releases for a signed desktop build.",
};
const LAUNCH_UPDATE_CHECK_DELAY_MS = 1500;

export function buildDiagnosticsSnapshot(input: {
  config: GameConfig | null;
  localAiStatus: AiSetupStatus;
}): DiagnosticsSnapshot {
  const userAgent = typeof navigator === "undefined" ? "unknown" : navigator.userAgent;

  return {
    appVersion: APP_VERSION,
    saveSchema: SAVE_SCHEMA_VERSION,
    runtime: isTauriRuntime() ? "tauri" : "browser",
    os: userAgent,
    provider: input.config?.aiProvider ?? "unconfigured",
    chatModel: input.config?.chatModel ?? "unconfigured",
    embeddingModel: input.config?.embeddingModel ?? "unconfigured",
    reasoningLevel: input.config?.reasoningLevel ?? "off",
    lastAiCheck: {
      status: input.localAiStatus.status,
      message: input.localAiStatus.message,
      checkedAt: input.localAiStatus.checkedAt ?? null,
    },
  };
}

export function MutedIndicator() {
  const { isEnabled, setEnabled } = useSfx();

  if (isEnabled) {
    return null;
  }

  return (
    <button
      type="button"
      data-sfx="toggle"
      aria-label="Audio is muted. Click to unmute."
      title="Audio muted. Click to unmute."
      onClick={() => setEnabled(true)}
      className="flex cursor-pointer items-center justify-center rounded-pill border border-aura-hairline bg-white px-2.5 py-1.5 text-aura-rose transition hover:border-aura-rose/30"
    >
      <MutedIcon />
    </button>
  );
}

export function SettingsMenu({
  isActionPending,
  diagnostics,
  canExportSave,
  canUseDevMemberDetailsPreview,
  devRevealAllMemberDetails,
  onOpenAiSetup,
  onReset,
  onExportSave,
  onImportSave,
  onCopyDiagnostics,
  onDevRevealAllMemberDetailsChange,
  onOpenReleaseNotes,
}: {
  isActionPending: boolean;
  diagnostics: DiagnosticsSnapshot;
  canExportSave: boolean;
  canUseDevMemberDetailsPreview: boolean;
  devRevealAllMemberDetails: boolean;
  onOpenAiSetup: () => void;
  onReset: () => void;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
  onCopyDiagnostics: () => Promise<boolean>;
  onDevRevealAllMemberDetailsChange: (enabled: boolean) => void;
  onOpenReleaseNotes: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isShowingDiagnostics, setIsShowingDiagnostics] = useState(false);
  const [diagnosticsCopied, setDiagnosticsCopied] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateMenuState>(INITIAL_UPDATE_STATE);
  const { isEnabled: sfxEnabled, setEnabled: setSfxEnabled, volume, setVolume, play } = useSfx();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const launchUpdateCheckStartedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      return;
    }
    setIsConfirmingReset(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isTauriRuntime() || launchUpdateCheckStartedRef.current) {
      return;
    }

    launchUpdateCheckStartedRef.current = true;
    let mounted = true;
    const timer = window.setTimeout(() => {
      void requestUpdateCheck({ silentFailure: true, mounted: () => mounted });
    }, LAUNCH_UPDATE_CHECK_DELAY_MS);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current === null) {
        return;
      }
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  function handleAskReset() {
    setIsConfirmingReset(true);
  }

  function handleCancelReset() {
    setIsConfirmingReset(false);
  }

  function handleConfirmReset() {
    setIsOpen(false);
    setIsConfirmingReset(false);
    onReset();
  }

  function handleOpenAiSetup() {
    setIsOpen(false);
    onOpenAiSetup();
  }

  function handleOpenReleaseNotes() {
    setIsOpen(false);
    onOpenReleaseNotes();
  }

  function handleExportSaveClick() {
    setIsOpen(false);
    onExportSave();
  }

  function handleImportSaveClick() {
    importInputRef.current?.click();
  }

  function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file === undefined) {
      return;
    }

    setIsOpen(false);
    onImportSave(file);
  }

  async function handleCopyDiagnosticsClick() {
    const copied = await onCopyDiagnostics();

    if (!copied) {
      return;
    }

    setDiagnosticsCopied(true);
    window.setTimeout(() => setDiagnosticsCopied(false), 1500);
  }

  async function requestUpdateCheck({
    silentFailure,
    mounted = () => true,
  }: {
    silentFailure: boolean;
    mounted?: () => boolean;
  }) {
    if (!silentFailure) {
      setUpdateState({
        status: "checking",
        message: "Checking the release desk.",
      });
    }

    try {
      const result = await checkForDesktopUpdate();

      if (!mounted()) {
        return;
      }

      setUpdateStateForCheckResult(result);
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

  function setUpdateStateForCheckResult(result: DesktopUpdateCheckResult) {
    if (result.status === "available") {
      setUpdateState({
        status: "available",
        version: result.version,
        notes: result.notes,
        date: result.date,
      });
      return;
    }

    setUpdateState({
      status: result.status,
      message: result.message,
    });
  }

  async function handleCheckForUpdate() {
    await requestUpdateCheck({ silentFailure: false });
  }

  async function handleInstallUpdate() {
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

  function handleToggleSfx() {
    setSfxEnabled(!sfxEnabled);
  }

  function handleToggleDevMemberDetails() {
    onDevRevealAllMemberDetailsChange(!devRevealAllMemberDetails);
  }

  function handleVolumeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value) / 100;
    setVolume(next);

    if (next > 0 && !sfxEnabled) {
      setSfxEnabled(true);
    }
  }

  function handleVolumeRelease() {
    if (sfxEnabled && volume > 0) {
      play("click");
    }
  }

  const volumePercent = Math.round(volume * 100);
  const hasAvailableUpdate = updateState.status === "available";
  const settingsLabel = hasAvailableUpdate
    ? `Settings. Update v${updateState.version} available.`
    : "Settings";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        data-sfx="menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={settingsLabel}
        title={settingsLabel}
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-pill border border-aura-hairline bg-white px-2.5 py-1.5 text-aura-muted transition hover:border-aura-rose/30 hover:text-aura-ink aria-expanded:border-aura-rose/40 aria-expanded:text-aura-ink"
      >
        <SettingsIcon />
        {hasAvailableUpdate ? (
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
            Update
          </span>
        ) : null}
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="settings-menu"
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="aura-glass-strong absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-card p-1.5 shadow-card"
          >
            <div className="px-3 pb-2 pt-2.5">
              <div className="flex items-center justify-between font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
                <span>Volume</span>
                <span className="tabular-nums text-aura-ink">{volumePercent}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={volumePercent}
                onChange={handleVolumeChange}
                onPointerUp={handleVolumeRelease}
                onKeyUp={handleVolumeRelease}
                aria-label="Volume"
                data-sfx="none"
                className={`mt-2 block h-1 w-full cursor-pointer appearance-none rounded-pill bg-aura-hairline-strong accent-aura-rose transition-opacity ${
                  sfxEnabled ? "opacity-100" : "opacity-50"
                }`}
              />
            </div>
            <div className="mx-2 h-px bg-aura-hairline" />
            {isConfirmingReset ? (
              <ResetConfirm
                disabled={isActionPending}
                onCancel={handleCancelReset}
                onConfirm={handleConfirmReset}
              />
            ) : (
              <>
                <MenuButton onClick={handleOpenAiSetup} disabled={isActionPending}>
                  AI setup
                </MenuButton>
                <MenuLink to="/docs" onClick={() => setIsOpen(false)}>
                  Field manual
                </MenuLink>
                <MenuButton onClick={handleOpenReleaseNotes}>What's new</MenuButton>
                <MenuButton
                  role="menuitemcheckbox"
                  ariaChecked={sfxEnabled}
                  sfx="toggle"
                  onClick={handleToggleSfx}
                >
                  {sfxEnabled ? "Mute" : "Unmute"}
                </MenuButton>
                {canUseDevMemberDetailsPreview ? (
                  <>
                    <div className="mx-2 my-1 h-px bg-aura-hairline" />
                    <div className="px-1 py-1.5">
                      <p className="px-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                        Dev preview
                      </p>
                      <MenuButton
                        role="menuitemcheckbox"
                        ariaChecked={devRevealAllMemberDetails}
                        sfx="toggle"
                        onClick={handleToggleDevMemberDetails}
                      >
                        {devRevealAllMemberDetails ? "Case intel previewed" : "Case intel sealed"}
                      </MenuButton>
                      <p className="px-2 pb-1 text-xs leading-snug text-aura-muted">
                        Shows needs, preferences, and dealbreakers without filing reads.
                      </p>
                    </div>
                  </>
                ) : null}
                {isTauriRuntime() ? (
                  <>
                    <MenuButton
                      onClick={() => {
                        void openTauriSaveFolder();
                      }}
                    >
                      Show save folder
                    </MenuButton>
                    <MenuButton
                      onClick={() => {
                        void openTauriLogFolder();
                      }}
                    >
                      Show log folder
                    </MenuButton>
                    <div className="mx-2 my-1 h-px bg-aura-hairline" />
                    <DesktopUpdateBlock
                      state={updateState}
                      disabled={isActionPending}
                      onCheck={() => void handleCheckForUpdate()}
                      onInstall={() => void handleInstallUpdate()}
                    />
                  </>
                ) : null}
                <MenuButton
                  onClick={handleExportSaveClick}
                  disabled={isActionPending || !canExportSave}
                >
                  Export save (JSON)
                </MenuButton>
                <MenuButton onClick={handleImportSaveClick} disabled={isActionPending}>
                  Import save (JSON)
                </MenuButton>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportFileChange}
                  className="hidden"
                  aria-hidden
                />
                <div className="mx-2 my-1 h-px bg-aura-hairline" />
                <DiagnosticsBlock
                  diagnostics={diagnostics}
                  isExpanded={isShowingDiagnostics}
                  isCopied={diagnosticsCopied}
                  onToggle={() => setIsShowingDiagnostics((open) => !open)}
                  onCopy={handleCopyDiagnosticsClick}
                />
                <div className="mx-2 my-1 h-px bg-aura-hairline" />
                <MenuButton tone="danger" onClick={handleAskReset} disabled={isActionPending}>
                  Reset save
                </MenuButton>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      data-sfx="menu"
      onClick={onClick}
      className="block w-full cursor-pointer rounded-chip px-3 py-2 text-left font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
    >
      {children}
    </Link>
  );
}

function DiagnosticsBlock({
  diagnostics,
  isExpanded,
  isCopied,
  onToggle,
  onCopy,
}: {
  diagnostics: DiagnosticsSnapshot;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const checkedAt = diagnostics.lastAiCheck.checkedAt;
  const checkedAtLabel = checkedAt === null ? "never" : new Date(checkedAt).toLocaleString();

  return (
    <div className="px-1 py-1.5">
      <button
        type="button"
        role="menuitem"
        data-sfx="menu"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-chip px-2 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
      >
        <span>Diagnostics</span>
        <span className="text-aura-faint">{isExpanded ? "−" : "+"}</span>
      </button>
      {isExpanded ? (
        <div className="mt-1 rounded-chip border border-aura-hairline bg-white/55 p-2.5">
          <dl className="space-y-1 font-mono text-micro uppercase tracking-[0.16em] text-aura-muted">
            <DiagnosticsRow label="build" value={diagnostics.appVersion} />
            <DiagnosticsRow label="save" value={`v${diagnostics.saveSchema}`} />
            <DiagnosticsRow label="runtime" value={diagnostics.runtime} />
            <DiagnosticsRow label="provider" value={diagnostics.provider} />
            <DiagnosticsRow label="chat" value={diagnostics.chatModel} />
            <DiagnosticsRow label="embed" value={diagnostics.embeddingModel} />
            <DiagnosticsRow label="reasoning" value={diagnostics.reasoningLevel} />
            <DiagnosticsRow label="ai status" value={diagnostics.lastAiCheck.status} />
            <DiagnosticsRow label="checked" value={checkedAtLabel} />
          </dl>
          <p
            className="mt-2 truncate font-mono text-micro lowercase tracking-[0.04em] text-aura-faint"
            title={diagnostics.os}
          >
            os :: <span className="text-aura-ink">{diagnostics.os}</span>
          </p>
          <button
            type="button"
            data-sfx="menu"
            onClick={onCopy}
            className="mt-2 block w-full cursor-pointer rounded-chip bg-aura-ink px-3 py-1.5 text-center font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-aura-rose"
          >
            {isCopied ? "Copied" : "Copy diagnostic blob"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DesktopUpdateBlock({
  state,
  disabled,
  onCheck,
  onInstall,
}: {
  state: UpdateMenuState;
  disabled: boolean;
  onCheck: () => void;
  onInstall: () => void;
}) {
  const busy = state.status === "checking" || state.status === "installing";
  const canInstall = state.status === "available" && !disabled && !busy;
  const statusLabel = updateStatusLabel(state);
  const message = updateStatusMessage(state);

  return (
    <div className="px-1 py-1.5">
      <div className="flex items-center justify-between gap-2 px-2">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
          Updates
        </p>
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-faint">
          {statusLabel}
        </span>
      </div>
      <p className="px-2 pt-1 text-xs leading-snug text-aura-muted">{message}</p>
      {state.status === "available" && state.notes.trim().length > 0 ? (
        <p className="mt-1 line-clamp-2 px-2 text-xs leading-snug text-aura-faint">{state.notes}</p>
      ) : null}
      <div className="mt-1">
        <MenuButton disabled={disabled || busy} onClick={onCheck}>
          {state.status === "checking" ? "Checking" : "Check for update"}
        </MenuButton>
        {state.status === "available" ? (
          <MenuButton disabled={!canInstall} onClick={onInstall}>
            Install v{state.version}
          </MenuButton>
        ) : null}
      </div>
    </div>
  );
}

function updateStatusLabel(state: UpdateMenuState): string {
  switch (state.status) {
    case "idle":
      return "manual";
    case "checking":
      return "checking";
    case "current":
      return "current";
    case "unsupported":
      return "desktop";
    case "available":
      return `v${state.version}`;
    case "installing":
      return "installing";
    case "error":
      return "blocked";
  }
}

function updateStatusMessage(state: UpdateMenuState): string {
  switch (state.status) {
    case "available": {
      const dateLabel =
        state.date === null ? "" : ` Published ${new Date(state.date).toLocaleDateString()}.`;
      return `Signed update v${state.version} is ready.${dateLabel}`;
    }
    case "installing":
      return `Installing v${state.version}. ${formatUpdateProgress(state)}`;
    default:
      return state.message;
  }
}

function formatUpdateProgress(state: Extract<UpdateMenuState, { status: "installing" }>): string {
  if (state.totalBytes === null || state.totalBytes <= 0) {
    return `${formatBytes(state.downloadedBytes)} received.`;
  }

  const percent = Math.min(100, Math.round((state.downloadedBytes / state.totalBytes) * 100));
  return `${percent}% received.`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DiagnosticsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-baseline gap-2">
      <dt className="text-aura-faint">{label}</dt>
      <dd className="min-w-0 truncate text-aura-ink" title={value}>
        {value}
      </dd>
    </div>
  );
}

function ResetConfirm({
  disabled,
  onCancel,
  onConfirm,
}: {
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="px-3 py-2.5">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
        Reset save? This is permanent.
      </p>
      <p className="mt-1 text-label leading-snug text-aura-muted">
        Cupid keeps a .bak.* copy of the current save before resetting.
      </p>
      <div className="mt-2.5 flex items-center justify-end gap-1">
        <button
          type="button"
          role="menuitem"
          data-sfx="dismiss"
          disabled={disabled}
          onClick={onCancel}
          className="cursor-pointer rounded-chip px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          role="menuitem"
          data-sfx="danger"
          disabled={disabled}
          onClick={onConfirm}
          className="cursor-pointer rounded-chip bg-aura-rose px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-aura-fuchsia disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H7a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}
