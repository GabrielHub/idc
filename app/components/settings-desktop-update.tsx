import { MenuButton } from "./dashboard-atoms";
import {
  updateStatusLabel,
  updateStatusMessage,
  type UpdateMenuState,
} from "./settings-update-state";

export function DesktopUpdateBlock({
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
      <p className="px-2 pt-1 text-sm leading-snug text-aura-muted">{message}</p>
      {state.status === "available" && state.notes.trim().length > 0 ? (
        <p className="mt-1 line-clamp-2 px-2 text-sm leading-snug text-aura-faint">{state.notes}</p>
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
