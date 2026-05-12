import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { SAVE_SCHEMA_VERSION, type GameConfig } from "../domain/game";
import { APP_VERSION } from "../platform/release-identity";
import { isTauriRuntime } from "../platform/runtime";
import { openTauriLogFolder, openTauriSaveFolder } from "../platform/tauri-log-folder";
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
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isShowingDiagnostics, setIsShowingDiagnostics] = useState(false);
  const [diagnosticsCopied, setDiagnosticsCopied] = useState(false);
  const { isEnabled: sfxEnabled, setEnabled: setSfxEnabled, volume, setVolume, play } = useSfx();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      return;
    }
    setIsConfirmingReset(false);
  }, [isOpen]);

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

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        data-sfx="menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Settings"
        title="Settings"
        onClick={() => setIsOpen((open) => !open)}
        className="flex cursor-pointer items-center justify-center rounded-pill border border-aura-hairline bg-white px-2.5 py-1.5 text-aura-muted transition hover:border-aura-rose/30 hover:text-aura-ink aria-expanded:border-aura-rose/40 aria-expanded:text-aura-ink"
      >
        <SettingsIcon />
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
                        {devRevealAllMemberDetails
                          ? "Member files unveiled"
                          : "Member files sealed"}
                      </MenuButton>
                      <p className="px-2 pb-1 text-xs leading-snug text-aura-muted">
                        Shows earned-file member details without filing reads.
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
