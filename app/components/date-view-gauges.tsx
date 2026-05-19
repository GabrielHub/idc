import { useMemo } from "react";

import type { DateScenario, ScenarioEvent } from "../domain/game";
import { MAX_NUDGES_PER_DATE } from "../services/date-engine";
import { clampScore } from "../services/utils";
import { scoreWidthClass } from "./dashboard-atoms";

export function StatusGauges({
  dateHealth,
  displayedCurrentTurn,
  turnLimit,
  judgePasses,
  nudgesRemaining,
  nudgeButtonEnabled,
  onComposeNudge,
  picks,
  eventsTriggered,
  scenario,
  dropsEnabled,
  containerRef,
  nudgeRef,
  onTriggerEvent,
}: {
  dateHealth: number;
  displayedCurrentTurn: number;
  turnLimit: number;
  judgePasses: number;
  nudgesRemaining: number;
  nudgeButtonEnabled: boolean;
  onComposeNudge: () => void;
  picks: string[];
  eventsTriggered: string[];
  scenario: DateScenario | undefined;
  dropsEnabled: boolean;
  containerRef?: React.Ref<HTMLDivElement>;
  nudgeRef?: React.Ref<HTMLButtonElement>;
  onTriggerEvent: (eventId: string) => void;
}) {
  return (
    <div ref={containerRef} className="flex shrink-0 items-center gap-3 px-1 lg:gap-4 lg:px-2">
      <HealthGauge value={dateHealth} />
      <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
      <TurnGauge current={displayedCurrentTurn} total={turnLimit} />
      <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
      <JudgeGauge passes={judgePasses} />
      <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
      <NudgeGauge
        remaining={nudgesRemaining}
        enabled={nudgeButtonEnabled}
        onCompose={onComposeNudge}
        buttonRef={nudgeRef}
      />
      {picks.length > 0 ? (
        <>
          <span aria-hidden className="hidden h-7 w-px bg-aura-hairline/70 lg:block" />
          <ScenesGauge
            picks={picks}
            eventsTriggered={eventsTriggered}
            scenario={scenario}
            enabled={dropsEnabled}
            onTriggerEvent={onTriggerEvent}
          />
        </>
      ) : null}
    </div>
  );
}

function GaugeLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-micro font-semibold uppercase leading-none tracking-[0.22em] text-aura-faint">
      {children}
    </span>
  );
}

function GaugeColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-start gap-1.5">{children}</div>;
}

function HealthGauge({ value }: { value: number }) {
  const safeValue = clampScore(Math.round(value));
  const ariaLabel = `Date health: ${safeValue} of 100. Drops with conflict, lifts with chemistry.`;

  return (
    <GaugeColumn>
      <GaugeLabel>Health</GaugeLabel>
      <span className="inline-flex items-center gap-2" aria-label={ariaLabel}>
        <span className="font-mono text-label font-semibold tabular-nums leading-none text-aura-ink">
          {safeValue}
        </span>
        <span aria-hidden className="block h-1 w-12 overflow-hidden rounded-pill bg-aura-hairline">
          <span
            className={`block h-full rounded-pill bg-gradient-to-r from-aura-emerald via-aura-rose to-aura-violet ${scoreWidthClass(safeValue)}`}
          />
        </span>
      </span>
    </GaugeColumn>
  );
}

function TurnGauge({ current, total }: { current: number; total: number }) {
  const ariaLabel = `Turn ${current} of ${total}. Cupid reviews every sixth turn.`;
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));

  return (
    <GaugeColumn>
      <GaugeLabel>Turn</GaugeLabel>
      <span className="inline-flex items-center gap-2" aria-label={ariaLabel}>
        <span className="font-mono text-label font-semibold tabular-nums leading-none text-aura-ink">
          {current}
          <span className="text-aura-faint">/{total}</span>
        </span>
        <span aria-hidden className="block h-1 w-12 overflow-hidden rounded-pill bg-aura-hairline">
          <span className={`block h-full rounded-pill bg-aura-violet/80 ${scoreWidthClass(pct)}`} />
        </span>
      </span>
    </GaugeColumn>
  );
}

function JudgeGauge({ passes }: { passes: number }) {
  const ariaLabel = `${passes} Cupid ${passes === 1 ? "read" : "reads"} on file. Each read logs how the date is going.`;

  return (
    <GaugeColumn>
      <GaugeLabel>Cupid</GaugeLabel>
      <span
        className="inline-flex items-center gap-1.5 font-mono text-label font-semibold tabular-nums leading-none text-aura-violet"
        aria-label={ariaLabel}
      >
        <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
          <path
            d="M6 1.5 L7.4 4.6 L10.7 5 L8.3 7.3 L8.9 10.6 L6 9 L3.1 10.6 L3.7 7.3 L1.3 5 L4.6 4.6 Z"
            fill="currentColor"
          />
        </svg>
        {passes}
      </span>
    </GaugeColumn>
  );
}

function NudgeGauge({
  remaining,
  enabled,
  onCompose,
  buttonRef,
}: {
  remaining: number;
  enabled: boolean;
  onCompose: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  const total = MAX_NUDGES_PER_DATE;
  const ariaLabel = enabled
    ? `Whisper a nudge. ${remaining} of ${total} left.`
    : remaining === 0
      ? "Every nudge filed."
      : `${remaining} of ${total} ${remaining === 1 ? "nudge" : "nudges"} left. Pause to whisper.`;

  return (
    <button
      ref={buttonRef}
      type="button"
      data-sfx={enabled ? "click" : undefined}
      disabled={!enabled}
      onClick={onCompose}
      aria-label={ariaLabel}
      className="group -mx-1.5 -my-1 flex cursor-pointer flex-col items-start gap-1.5 rounded-chip px-1.5 py-1 transition disabled:cursor-not-allowed enabled:hover:bg-white/55 enabled:hover:shadow-quiet"
    >
      <GaugeLabel>
        <span className="inline-flex items-center gap-1">
          <span>Nudges</span>
          <svg
            viewBox="0 0 8 8"
            aria-hidden
            className="size-2 text-aura-rose/60 opacity-0 transition group-enabled:group-hover:opacity-100"
          >
            <path
              d="M1.5 4 H6 M4.2 1.8 L6.4 4 L4.2 6.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </GaugeLabel>
      <span className="inline-flex items-center gap-1">
        {Array.from({ length: total }).map((_, index) => {
          const filled = index < remaining;
          return (
            <svg
              key={`nudge-pip-${index}`}
              viewBox="0 0 12 12"
              aria-hidden
              className={`size-3 transition ${filled ? "text-aura-rose group-enabled:group-hover:scale-110" : "text-aura-rose/25"}`}
            >
              <path
                d="M6 10.4 C6 10.4 1.4 7.7 1.4 4.6 C1.4 3.1 2.55 1.95 4.05 1.95 C4.95 1.95 5.65 2.45 6 3.2 C6.35 2.45 7.05 1.95 7.95 1.95 C9.45 1.95 10.6 3.1 10.6 4.6 C10.6 7.7 6 10.4 6 10.4 Z"
                fill="currentColor"
              />
            </svg>
          );
        })}
      </span>
    </button>
  );
}

function ScenesGauge({
  picks,
  eventsTriggered,
  scenario,
  enabled,
  onTriggerEvent,
}: {
  picks: string[];
  eventsTriggered: string[];
  scenario: DateScenario | undefined;
  enabled: boolean;
  onTriggerEvent: (eventId: string) => void;
}) {
  const droppedSet = useMemo(() => new Set(eventsTriggered), [eventsTriggered]);
  const eventById = useMemo(() => {
    if (scenario === undefined) {
      return new Map<string, ScenarioEvent>();
    }
    return new Map(scenario.director.events.map((event) => [event.id, event]));
  }, [scenario]);

  return (
    <GaugeColumn>
      <GaugeLabel>Scenes</GaugeLabel>
      <span className="inline-flex items-center gap-1">
        {picks.map((eventId) => {
          const event = eventById.get(eventId);
          const dropped = droppedSet.has(eventId);
          const interactive = enabled && !dropped && event !== undefined;
          const title = event?.title ?? "Scene";
          const ariaLabel = dropped
            ? `${title} dropped.`
            : interactive
              ? `Preview scene: ${title}.`
              : `${title}. Pause and stop streaming to drop.`;
          return (
            <button
              key={eventId}
              type="button"
              data-sfx={interactive ? "click" : undefined}
              disabled={!interactive}
              onClick={() => {
                if (!interactive) return;
                onTriggerEvent(eventId);
              }}
              aria-label={ariaLabel}
              title={title}
              className={`grid size-5 cursor-pointer place-items-center rounded transition disabled:cursor-not-allowed ${
                dropped
                  ? "text-aura-emerald/80"
                  : interactive
                    ? "text-aura-violet hover:scale-110 hover:text-aura-fuchsia"
                    : "text-aura-violet/40"
              }`}
            >
              {dropped ? (
                <svg viewBox="0 0 12 12" className="size-full" aria-hidden>
                  <path
                    d="M2.5 6.5 L5 9 L9.5 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 12 12" className="size-full" aria-hidden>
                  <path d="M6 1.2 L10.8 6 L6 10.8 L1.2 6 Z" fill="currentColor" />
                </svg>
              )}
            </button>
          );
        })}
      </span>
    </GaugeColumn>
  );
}
