import {
  MutedIndicator,
  SettingsMenu,
  type ChromeVariant,
  type DiagnosticsSnapshot,
} from "./settings-menu";

type GlassChromeVariant = Extract<ChromeVariant, "glass" | "glass-ink">;

const CHROME_PILL_CLASS =
  "cursor-pointer rounded-pill border border-aura-hairline bg-white px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black transition hover:border-aura-rose/30 hover:text-aura-rose";

export function ShellChrome({
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
  return (
    <header className="relative z-40 mx-auto flex w-full max-w-canvas items-center justify-between gap-4 px-6 py-4 lg:px-12">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onPunchOut} data-sfx="click" className={CHROME_PILL_CLASS}>
          ← Punch out
        </button>
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black">
          shift {String(shiftNumber).padStart(2, "0")} / livedate
        </span>
      </div>
      <div className="flex items-center gap-2">
        <MutedIndicator variant="cream" />
        <button
          type="button"
          onClick={onOpenAiSetup}
          data-sfx="click"
          className={CHROME_PILL_CLASS}
        >
          ai · {aiStatusLabel}
        </button>
        <SettingsMenu
          isActionPending={isActionPending}
          getDiagnostics={getDiagnostics}
          canExportSave={canExportSave}
          canUseDevMemberDetailsPreview={canUseDevMemberDetailsPreview}
          devRevealAllMemberDetails={devRevealAllMemberDetails}
          align="right"
          variant="cream"
          onOpenAiSetup={onOpenAiSetup}
          onReset={onReset}
          onResetOrientation={onResetOrientation}
          onExportSave={onExportSave}
          onImportSave={onImportSave}
          onCopyDiagnostics={onCopyDiagnostics}
          onDevRevealAllMemberDetailsChange={onDevRevealAllMemberDetailsChange}
          onOpenReleaseNotes={onOpenReleaseNotes}
        />
      </div>
    </header>
  );
}

/**
 * Glass-pill chrome rendered floating over the canvas during a shift — the
 * constellation lobby and the live date view share this surface so the
 * top-left affordances stay consistent across both screens. The caller
 * positions this; we only return the pills + their spacing.
 */
export function GlassChromePills({
  shiftNumber,
  aiStatusLabel,
  isActionPending,
  getDiagnostics,
  canExportSave,
  canUseDevMemberDetailsPreview,
  devRevealAllMemberDetails,
  variant = "glass",
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
  /**
   * `glass` (default) is the lobby/dark-canvas tone with paper text.
   * `glass-ink` flips text and dividers to ink — used over bright date
   * backgrounds.
   */
  variant?: GlassChromeVariant;
  onPunchOut: () => void;
  /**
   * Overrides the leading back/punch-out button when set. Sub-screens within
   * a shift (lobby reselect, the live date) supply this so the icon backs out
   * of the sub-screen instead of leaving the shift entirely.
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
  const isInk = variant === "glass-ink";
  const textColorClass = isInk ? "text-aura-ink" : "text-aura-paper";
  const dividerColorClass = isInk ? "bg-aura-ink/15" : "bg-white/15";
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
        className={`cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full p-2 inline-flex items-center justify-center transition ${textColorClass}`}
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
        <span
          className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${textColorClass}`}
        >
          shift {String(shiftNumber).padStart(2, "0")} · live
        </span>
        <span className={`mx-0.5 h-3 w-px ${dividerColorClass}`} aria-hidden />
        <span className={`h-1.5 w-1.5 rounded-full ${aiDotClass}`} aria-hidden />
      </button>
      <MutedIndicator variant={variant} />
      <SettingsMenu
        isActionPending={isActionPending}
        getDiagnostics={getDiagnostics}
        canExportSave={canExportSave}
        canUseDevMemberDetailsPreview={canUseDevMemberDetailsPreview}
        devRevealAllMemberDetails={devRevealAllMemberDetails}
        align="left"
        variant={variant}
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
