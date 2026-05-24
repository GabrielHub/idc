import { MutedIndicator, SettingsMenu, type DiagnosticsSnapshot } from "./settings-menu";

const CHROME_PILL_CLASS =
  "cursor-pointer rounded-pill border border-aura-hairline bg-white px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black transition hover:border-aura-rose/30 hover:text-aura-rose";
const DATE_CHROME_PILL_CLASS =
  "aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink transition hover:text-aura-rose";

export function ShellChrome({
  isDateViewActive,
  shiftNumber,
  aiStatusLabel,
  isActionPending,
  getDiagnostics,
  canExportSave,
  canUseDevMemberDetailsPreview,
  devRevealAllMemberDetails,
  onPunchOut,
  onOpenAiSetup,
  onReset,
  onResetOrientation,
  onExportSave,
  onImportSave,
  onCopyDiagnostics,
  onDevRevealAllMemberDetailsChange,
  onOpenReleaseNotes,
}: {
  isDateViewActive: boolean;
  shiftNumber: number;
  aiStatusLabel: string;
  isActionPending: boolean;
  getDiagnostics: () => DiagnosticsSnapshot;
  canExportSave: boolean;
  canUseDevMemberDetailsPreview: boolean;
  devRevealAllMemberDetails: boolean;
  onPunchOut: () => void;
  onOpenAiSetup: () => void;
  onReset: () => void;
  onResetOrientation: () => void;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
  onCopyDiagnostics: () => Promise<boolean>;
  onDevRevealAllMemberDetailsChange: (enabled: boolean) => void;
  onOpenReleaseNotes: () => void;
}) {
  const chromePillClass = isDateViewActive ? DATE_CHROME_PILL_CLASS : CHROME_PILL_CLASS;
  const chromeVariant = isDateViewActive ? "glass" : "cream";
  const punchOutButton = (
    <button type="button" onClick={onPunchOut} data-sfx="click" className={chromePillClass}>
      ← Punch out
    </button>
  );
  const shiftLabel = (
    <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black">
      shift {String(shiftNumber).padStart(2, "0")} / livedate
    </span>
  );
  const aiStatusButton = (
    <button type="button" onClick={onOpenAiSetup} data-sfx="click" className={chromePillClass}>
      ai · {aiStatusLabel}
    </button>
  );
  const settingsMenu = (
    <SettingsMenu
      isActionPending={isActionPending}
      getDiagnostics={getDiagnostics}
      canExportSave={canExportSave}
      canUseDevMemberDetailsPreview={canUseDevMemberDetailsPreview}
      devRevealAllMemberDetails={devRevealAllMemberDetails}
      align={isDateViewActive ? "left" : "right"}
      variant={chromeVariant}
      onOpenAiSetup={onOpenAiSetup}
      onReset={onReset}
      onResetOrientation={onResetOrientation}
      onExportSave={onExportSave}
      onImportSave={onImportSave}
      onCopyDiagnostics={onCopyDiagnostics}
      onDevRevealAllMemberDetailsChange={onDevRevealAllMemberDetailsChange}
      onOpenReleaseNotes={onOpenReleaseNotes}
    />
  );

  if (isDateViewActive) {
    return (
      <div
        aria-label="Live date controls"
        className="fixed left-4 top-4 z-40 flex items-center gap-2 lg:left-8 lg:top-6"
      >
        {punchOutButton}
        {shiftLabel}
        <MutedIndicator variant={chromeVariant} />
        {aiStatusButton}
        {settingsMenu}
      </div>
    );
  }

  return (
    <header className="relative z-40 mx-auto flex w-full max-w-canvas items-center justify-between gap-4 px-6 py-4 lg:px-12">
      <div className="flex items-center gap-3">
        {punchOutButton}
        {shiftLabel}
      </div>
      <div className="flex items-center gap-2">
        <MutedIndicator variant={chromeVariant} />
        {aiStatusButton}
        {settingsMenu}
      </div>
    </header>
  );
}

/**
 * Glass-pill chrome rendered inline by the constellation lobby in place of the
 * cream `ShellChrome` header. Same controls, restyled with `aura-liquid-glass`
 * so they sit cleanly on the 3D canvas. The lobby positions this; we only
 * return the pills + their spacing.
 */
export function LobbyChromePills({
  shiftNumber,
  aiStatusLabel,
  isActionPending,
  getDiagnostics,
  canExportSave,
  canUseDevMemberDetailsPreview,
  devRevealAllMemberDetails,
  onPunchOut,
  onBack,
  onOpenAiSetup,
  onReset,
  onResetOrientation,
  onExportSave,
  onImportSave,
  onCopyDiagnostics,
  onDevRevealAllMemberDetailsChange,
  onOpenReleaseNotes,
}: {
  shiftNumber: number;
  aiStatusLabel: string;
  isActionPending: boolean;
  getDiagnostics: () => DiagnosticsSnapshot;
  canExportSave: boolean;
  canUseDevMemberDetailsPreview: boolean;
  devRevealAllMemberDetails: boolean;
  onPunchOut: () => void;
  /**
   * Overrides the leading back/punch-out button when set. The lobby supplies
   * this when a sub-screen (e.g. the reselect case manager) needs the
   * back affordance to close that screen instead of leaving the shift.
   */
  onBack?: () => void;
  onOpenAiSetup: () => void;
  onReset: () => void;
  onResetOrientation: () => void;
  onExportSave: () => void;
  onImportSave: (file: File) => void;
  onCopyDiagnostics: () => Promise<boolean>;
  onDevRevealAllMemberDetailsChange: (enabled: boolean) => void;
  onOpenReleaseNotes: () => void;
}) {
  const backHandler = onBack ?? onPunchOut;
  const backAriaLabel = onBack === undefined ? "Punch out of shift" : "Back to lobby";
  const backTitle = onBack === undefined ? "Punch out" : "Back";
  const aiDotClass =
    aiStatusLabel === "ready"
      ? "bg-aura-emerald"
      : aiStatusLabel === "checking"
        ? "bg-aura-amber"
        : aiStatusLabel === "setup"
          ? "bg-aura-amber"
          : "bg-aura-rose";
  return (
    <>
      <button
        type="button"
        onClick={backHandler}
        data-sfx="click"
        aria-label={backAriaLabel}
        title={backTitle}
        className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full p-2 inline-flex items-center justify-center text-aura-paper transition"
      >
        <PunchOutGlyph />
      </button>
      <button
        type="button"
        onClick={onOpenAiSetup}
        data-sfx="click"
        aria-label={`Shift ${String(shiftNumber).padStart(2, "0")} live · AI ${aiStatusLabel} · open AI setup`}
        title={`AI · ${aiStatusLabel}`}
        className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3 py-1.5 inline-flex items-center gap-2 transition"
      >
        <span className="aura-pulse h-2 w-2 rounded-full bg-aura-rose" />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-paper">
          shift {String(shiftNumber).padStart(2, "0")} · live
        </span>
        <span className="mx-0.5 h-3 w-px bg-white/15" aria-hidden />
        <span className={`h-1.5 w-1.5 rounded-full ${aiDotClass}`} aria-hidden />
      </button>
      <MutedIndicator variant="glass" />
      <SettingsMenu
        isActionPending={isActionPending}
        getDiagnostics={getDiagnostics}
        canExportSave={canExportSave}
        canUseDevMemberDetailsPreview={canUseDevMemberDetailsPreview}
        devRevealAllMemberDetails={devRevealAllMemberDetails}
        align="left"
        variant="glass"
        onOpenAiSetup={onOpenAiSetup}
        onReset={onReset}
        onResetOrientation={onResetOrientation}
        onExportSave={onExportSave}
        onImportSave={onImportSave}
        onCopyDiagnostics={onCopyDiagnostics}
        onDevRevealAllMemberDetailsChange={onDevRevealAllMemberDetailsChange}
        onOpenReleaseNotes={onOpenReleaseNotes}
      />
    </>
  );
}

function PunchOutGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" className="size-4">
      <path
        d="M9.5 4 6 8l3.5 4M6 8h7M3 3v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
