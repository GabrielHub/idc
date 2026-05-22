import type { RoomKey } from "./floating-nav-cluster";
import { MutedIndicator, SettingsMenu, type DiagnosticsSnapshot } from "./settings-menu";

const CHROME_PILL_CLASS =
  "cursor-pointer rounded-pill border border-aura-hairline bg-white px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black transition hover:border-aura-rose/30 hover:text-aura-rose";

export function ShellChrome({
  isDateViewActive,
  shiftNumber,
  currentRoom,
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
  currentRoom: RoomKey;
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
  const punchOutButton = (
    <button type="button" onClick={onPunchOut} data-sfx="click" className={CHROME_PILL_CLASS}>
      ← Punch out
    </button>
  );
  const shiftLabel = (
    <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-black">
      shift {String(shiftNumber).padStart(2, "0")} / {currentRoom}
    </span>
  );
  const aiStatusButton = (
    <button type="button" onClick={onOpenAiSetup} data-sfx="click" className={CHROME_PILL_CLASS}>
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
        <MutedIndicator />
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
        <MutedIndicator />
        {aiStatusButton}
        {settingsMenu}
      </div>
    </header>
  );
}
