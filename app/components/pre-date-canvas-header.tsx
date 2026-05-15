import type { Ref } from "react";

import { GhostButton, pad2, PrimaryButton, Tooltip } from "./dashboard-atoms";

export function PreDateHeader({
  shiftNumber,
  shiftDateAvailable,
  eligibleFocusCount,
  focusedTotal,
  quitsRemaining,
  lossLimit,
  closureCount,
  shiftClosed,
  activeBookingLocked,
  isActionPending,
  fileShiftButtonRef,
  onCloseShift,
  onStartNextShift,
}: {
  shiftNumber: number;
  shiftDateAvailable: boolean;
  eligibleFocusCount: number;
  focusedTotal: number;
  quitsRemaining: number;
  lossLimit: number;
  closureCount: number;
  shiftClosed: boolean;
  activeBookingLocked: boolean;
  isActionPending: boolean;
  fileShiftButtonRef?: Ref<HTMLButtonElement>;
  onCloseShift: () => void;
  onStartNextShift: () => void;
}) {
  const quitsTone = quitsToneClass(quitsRemaining);
  const statusLabel = shiftStatusLabel({ shiftClosed, activeBookingLocked, shiftDateAvailable });

  return (
    <header className="mb-8">
      <p className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose">
        // livedate.shift.{pad2(shiftNumber)}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-aura-ink lg:text-4xl">
            Tonight's date
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-aura-muted">
            Pick a focus case, pick their partner, commit, then read the room. Cupid drafts the
            scenarios from your Date Book.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
            <span>{statusLabel}</span>
            <span aria-hidden>•</span>
            <span>
              {eligibleFocusCount} ready / {focusedTotal} on file
            </span>
            <span aria-hidden>•</span>
            <span
              className={quitsTone}
              title={`Cap rises by 1 with each closed pair. ${closureCount} closure${closureCount === 1 ? "" : "s"} on file.`}
            >
              quits remaining: {quitsRemaining} / {lossLimit}
            </span>
          </div>
          <ShiftCta
            shiftClosed={shiftClosed}
            activeBookingLocked={activeBookingLocked}
            shiftDateAvailable={shiftDateAvailable}
            isActionPending={isActionPending}
            fileShiftButtonRef={fileShiftButtonRef}
            onCloseShift={onCloseShift}
            onStartNextShift={onStartNextShift}
          />
        </div>
      </div>
    </header>
  );
}

function quitsToneClass(quitsRemaining: number): string {
  if (quitsRemaining <= 1) return "text-aura-rose";
  if (quitsRemaining <= 2) return "text-aura-amber";
  return "text-aura-faint";
}

function shiftStatusLabel({
  shiftClosed,
  activeBookingLocked,
  shiftDateAvailable,
}: {
  shiftClosed: boolean;
  activeBookingLocked: boolean;
  shiftDateAvailable: boolean;
}): string {
  if (shiftClosed) return "shift closed";
  if (activeBookingLocked) return "booking committed";
  if (shiftDateAvailable) return "date open";
  return "date booked";
}

function ShiftCta({
  shiftClosed,
  activeBookingLocked,
  shiftDateAvailable,
  isActionPending,
  fileShiftButtonRef,
  onCloseShift,
  onStartNextShift,
}: {
  shiftClosed: boolean;
  activeBookingLocked: boolean;
  shiftDateAvailable: boolean;
  isActionPending: boolean;
  fileShiftButtonRef?: Ref<HTMLButtonElement>;
  onCloseShift: () => void;
  onStartNextShift: () => void;
}) {
  if (shiftClosed) {
    return (
      <PrimaryButton onClick={onStartNextShift} disabled={isActionPending}>
        Open next shift →
      </PrimaryButton>
    );
  }

  if (activeBookingLocked) {
    return (
      <Tooltip
        message="Start or cancel the committed booking before filing this shift."
        placement="bottom-end"
      >
        <GhostButton disabled>Resolve booking first</GhostButton>
      </Tooltip>
    );
  }

  if (shiftDateAvailable) {
    return (
      <Tooltip
        message="End this shift without booking a date. Cupid files the day, applies any ignored request fallout, and lets you open the next shift."
        placement="bottom-end"
      >
        <GhostButton
          buttonRef={fileShiftButtonRef}
          onClick={onCloseShift}
          disabled={isActionPending}
        >
          File the shift
        </GhostButton>
      </Tooltip>
    );
  }

  return (
    <PrimaryButton buttonRef={fileShiftButtonRef} onClick={onCloseShift} disabled={isActionPending}>
      Close the shift →
    </PrimaryButton>
  );
}
