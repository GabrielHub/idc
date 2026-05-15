import { type Ref, useEffect, useState } from "react";

import type { DateScenario, Member } from "../domain/game";
import { GhostButton, Portrait, PrimaryButton, Tooltip } from "./dashboard-atoms";
import { scenarioBackdropPath } from "./scenario-backdrop";

export type BookingStep = "focus" | "partner" | "date";

function deriveDockStatus({
  shiftClosed,
  deckRepairBlocked,
  isCommitted,
  shiftDateAvailable,
  focus,
  partner,
  scenario,
  aiReady,
}: {
  shiftClosed: boolean;
  deckRepairBlocked: boolean;
  isCommitted: boolean;
  shiftDateAvailable: boolean;
  focus: Member | null;
  partner: Member | null;
  scenario: DateScenario | null;
  aiReady: boolean;
}): string | null {
  if (shiftClosed) return "shift filed, open the next one to book";
  if (deckRepairBlocked && !isCommitted) return "date book is over budget, open it to repair";
  if (!shiftDateAvailable && !isCommitted) return "this shift's date is already booked";
  if (focus === null) return "pick a focus case";
  if (partner === null) return "pick a partner";
  if (isCommitted && scenario === null) return "pick a date plan";
  if (!aiReady) return "ai not ready · set it up to book";
  return null;
}

export function BeginDateDock({
  focus,
  partner,
  scenario,
  canCommit,
  canStart,
  isCommitted,
  aiReady,
  deckRepairBlocked,
  shiftDateAvailable,
  shiftClosed,
  commitButtonRef,
  beginButtonRef,
  onScrollTo,
  onCommit,
  onStart,
  onCancel,
  onOpenAiSetup,
}: {
  focus: Member | null;
  partner: Member | null;
  scenario: DateScenario | null;
  canCommit: boolean;
  canStart: boolean;
  isCommitted: boolean;
  aiReady: boolean;
  deckRepairBlocked: boolean;
  shiftDateAvailable: boolean;
  shiftClosed: boolean;
  commitButtonRef?: Ref<HTMLButtonElement>;
  beginButtonRef?: Ref<HTMLButtonElement>;
  onScrollTo: (step: BookingStep) => void;
  onCommit: () => void;
  onStart: () => void;
  onCancel: () => void;
  onOpenAiSetup: () => void;
}) {
  const status = deriveDockStatus({
    shiftClosed,
    deckRepairBlocked,
    isCommitted,
    shiftDateAvailable,
    focus,
    partner,
    scenario,
    aiReady,
  });

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-6">
      <div className="aura-glass-strong pointer-events-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-pill px-5 py-2.5 shadow-aura-soft">
        <DockSummary focus={focus} partner={partner} scenario={scenario} onScrollTo={onScrollTo} />
        <div className="flex items-center gap-3">
          {status !== null ? (
            <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
              {status}
            </span>
          ) : null}
          {!aiReady && !isCommitted ? (
            <PrimaryButton onClick={onOpenAiSetup}>Set up AI →</PrimaryButton>
          ) : isCommitted ? (
            <>
              <GhostButton onClick={onCancel}>Cancel booking</GhostButton>
              {!aiReady ? (
                <PrimaryButton onClick={onOpenAiSetup}>Set up AI →</PrimaryButton>
              ) : (
                <PrimaryButton buttonRef={beginButtonRef} onClick={onStart} disabled={!canStart}>
                  Begin date →
                </PrimaryButton>
              )}
            </>
          ) : (
            <Tooltip
              message="Committing the pair starts the live date process. The hand is drawn, the Date Book locks, and you cannot switch members until the date resolves."
              placement="top-center"
            >
              <PrimaryButton buttonRef={commitButtonRef} onClick={onCommit} disabled={!canCommit}>
                Commit pair →
              </PrimaryButton>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function DockSummary({
  focus,
  partner,
  scenario,
  onScrollTo,
}: {
  focus: Member | null;
  partner: Member | null;
  scenario: DateScenario | null;
  onScrollTo: (step: BookingStep) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <DockChip label="focus" onClick={() => onScrollTo("focus")}>
        {focus === null ? (
          <span className="text-aura-faint">··</span>
        ) : (
          <span className="flex min-w-0 items-center gap-2">
            <Portrait member={focus} variant="transcript" />
            <span className="truncate font-display text-sm font-semibold tracking-tight">
              {focus.firstName}
            </span>
          </span>
        )}
      </DockChip>
      <DockDivider />
      <DockChip label="partner" onClick={() => onScrollTo("partner")}>
        {partner === null ? (
          <span className="text-aura-faint">··</span>
        ) : (
          <span className="flex min-w-0 items-center gap-2">
            <Portrait member={partner} variant="transcript" />
            <span className="truncate font-display text-sm font-semibold tracking-tight">
              {partner.firstName}
            </span>
          </span>
        )}
      </DockChip>
      <DockDivider />
      <DockChip label="date" onClick={() => onScrollTo("date")}>
        {scenario === null ? (
          <span className="text-aura-faint">··</span>
        ) : (
          <span className="flex min-w-0 items-center gap-2">
            <ScenarioDockAvatar scenario={scenario} />
            <span className="truncate font-display text-sm font-semibold tracking-tight">
              {scenario.title}
            </span>
          </span>
        )}
      </DockChip>
    </div>
  );
}

function ScenarioDockAvatar({ scenario }: { scenario: DateScenario }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [scenario.id]);

  return (
    <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/80 bg-[radial-gradient(circle_at_28%_24%,rgba(254,205,211,0.62)_0%,rgba(221,214,254,0.4)_52%,rgba(186,230,253,0.3)_100%)] shadow-quiet">
      {failed ? null : (
        <img
          src={scenarioBackdropPath(scenario.id)}
          alt=""
          decoding="async"
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full scale-110 object-cover object-center saturate-[1.12]"
        />
      )}
      <span aria-hidden className="absolute inset-0 bg-[rgba(255,253,249,0.18)]" />
      <span aria-hidden className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/65" />
    </span>
  );
}

function DockChip({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-sfx="click"
      aria-label={`Scroll to ${label}`}
      className="-mx-2 flex min-w-0 cursor-pointer flex-col rounded-2xl px-2 py-1 text-left transition hover:bg-white/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/45"
    >
      <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <span className="mt-1 flex min-w-0 items-center text-sm text-aura-ink">{children}</span>
    </button>
  );
}

function DockDivider() {
  return <span aria-hidden className="h-7 w-px bg-aura-hairline" />;
}
