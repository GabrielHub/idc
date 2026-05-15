import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  DateScenario,
  DateSession,
  GameSave,
  ScenarioEvent,
  ScenarioEventKind,
} from "../domain/game";
import { EVENT_DRAFT_PICKED, findScenarioEventById } from "../services/date-engine";
import { useTutorialStep } from "../services/tutorial";
import { EASE_OUT_QUART, Eyebrow, pad2, PrimaryButton, Tooltip } from "./dashboard-atoms";
import { TutorialCoachMark, TutorialSpotlight } from "./tutorial";

export const SCENARIO_EVENT_KIND_CHIP_CLASS: Record<ScenarioEventKind, string> = {
  ambient: "bg-aura-violet/12 text-black ring-1 ring-aura-violet/30",
  provocation: "bg-aura-rose/15 text-black ring-1 ring-aura-rose/35",
  reveal: "bg-aura-emerald/15 text-black ring-1 ring-aura-emerald/35",
};

export const SCENARIO_EVENT_KIND_COLUMN_META: Record<
  ScenarioEventKind,
  { label: string; blurb: string }
> = {
  ambient: {
    label: "ambient",
    blurb: "Environmental texture. Easy to notice or skip.",
  },
  provocation: {
    label: "provocation",
    blurb: "Physical interruptions. Demand a reaction.",
  },
  reveal: {
    label: "reveal",
    blurb: "Honest beats drawn from what's on file.",
  },
};

const SCENARIO_EVENT_KIND_COLUMN_ORDER: readonly ScenarioEventKind[] = [
  "ambient",
  "provocation",
  "reveal",
];

export function DraftScreen({
  scenario,
  session,
  isActionPending,
  save,
  onTutorialUpdate,
  onPickEvents,
}: {
  scenario: DateScenario;
  session: DateSession;
  isActionPending: boolean;
  save: GameSave;
  onTutorialUpdate: (next: GameSave) => void;
  onPickEvents: (eventIds: string[]) => void;
}) {
  const offered = session.eventDraft.offered;
  const offeredEvents = useMemo(
    () =>
      offered
        .map((id) => findScenarioEventById(scenario, id))
        .filter((event): event is ScenarioEvent => event !== undefined),
    [offered, scenario],
  );
  const targetCount = Math.min(EVENT_DRAFT_PICKED, offeredEvents.length);
  const [picks, setPicks] = useState<string[]>([]);
  const canLockIn = picks.length === targetCount;
  const firstSceneCardRef = useRef<HTMLLIElement | null>(null);
  const draftStep = useTutorialStep(
    save,
    "date.draft-events",
    offeredEvents.length > 0 && picks.length === 0,
    onTutorialUpdate,
  );
  useEffect(() => {
    if (offeredEvents.length === 0 && !draftStep.done) {
      draftStep.complete();
    }
  }, [offeredEvents.length, draftStep]);

  const offeredEventsByKind = useMemo(() => {
    const groups: Record<ScenarioEventKind, Array<{ event: ScenarioEvent; sceneIndex: number }>> = {
      ambient: [],
      provocation: [],
      reveal: [],
    };
    offeredEvents.forEach((event, sceneIndex) => {
      groups[event.kind].push({ event, sceneIndex });
    });
    return groups;
  }, [offeredEvents]);

  function togglePick(eventId: string) {
    const willAdd = !picks.includes(eventId) && picks.length < targetCount;
    setPicks((current) => {
      if (current.includes(eventId)) {
        return current.filter((id) => id !== eventId);
      }
      if (current.length >= targetCount) {
        return current;
      }
      return [...current, eventId];
    });
    if (willAdd && draftStep.active) {
      draftStep.complete();
    }
  }

  return (
    <motion.section
      key="draft-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
      className="mt-10"
    >
      <div className="space-y-3 text-center">
        <Eyebrow>// scene draft</Eyebrow>
        <h2 className="font-display text-display-md font-semibold leading-tight tracking-tight text-black lg:text-display-lg">
          Pick three <span className="aura-accent text-aura-rose">scene cards</span>
        </h2>
        <p className="mx-auto max-w-xl text-label text-black">
          Cupid deals two of each scene kind for {scenario.title}. Pick any three to drop into the
          date.
        </p>
      </div>

      <div className="mt-9 grid gap-6 2xl:grid-cols-3">
        {SCENARIO_EVENT_KIND_COLUMN_ORDER.map((kind, columnIndex) => {
          const meta = SCENARIO_EVENT_KIND_COLUMN_META[kind];
          const chipClass = SCENARIO_EVENT_KIND_CHIP_CLASS[kind];
          const items = offeredEventsByKind[kind];
          return (
            <section key={kind} className="flex flex-col gap-3">
              <header className="flex items-baseline justify-between gap-3 px-1">
                <Tooltip
                  message={meta.blurb}
                  placement="bottom-start"
                  messageClassName="text-black"
                >
                  <span
                    tabIndex={0}
                    data-event-kind={kind}
                    className={`cursor-help rounded-full px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.28em] outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/40 ${chipClass}`}
                  >
                    {meta.label}
                  </span>
                </Tooltip>
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-black">
                  {items.length} dealt
                </span>
              </header>
              <ol className="flex flex-col gap-3">
                {items.map(({ event, sceneIndex }, indexInColumn) => {
                  const pickIndex = picks.indexOf(event.id);
                  const selected = pickIndex >= 0;
                  return (
                    <motion.li
                      key={event.id}
                      ref={sceneIndex === 0 ? firstSceneCardRef : undefined}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.32,
                        ease: EASE_OUT_QUART,
                        delay: 0.08 + columnIndex * 0.06 + indexInColumn * 0.04,
                      }}
                    >
                      <Tooltip
                        message={meta.blurb}
                        placement="top-center"
                        className="w-full"
                        messageClassName="text-black"
                      >
                        <button
                          type="button"
                          data-sfx="click"
                          aria-pressed={selected}
                          disabled={isActionPending}
                          onClick={() => togglePick(event.id)}
                          className={`aura-glass-lift flex h-40 w-full flex-col gap-3 overflow-hidden rounded-card px-5 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            selected
                              ? "aura-glass-strong cursor-pointer ring-2 ring-aura-rose/55 shadow-cta"
                              : "aura-glass cursor-pointer shadow-card hover:ring-1 hover:ring-aura-violet/30"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-black">
                              // scene {pad2(sceneIndex + 1)}
                            </span>
                            <DraftPickPip selected={selected} pickIndex={pickIndex} />
                          </div>
                          <h3 className="line-clamp-2 font-display text-display-sm font-semibold leading-tight text-black">
                            {event.title}
                          </h3>
                          <p className="line-clamp-2 text-label leading-relaxed text-black">
                            {event.event}
                          </p>
                        </button>
                      </Tooltip>
                    </motion.li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <div className="mt-9 flex flex-col items-center gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-black">
          {picks.length} of {targetCount} drafted
        </span>
        <PrimaryButton disabled={!canLockIn || isActionPending} onClick={() => onPickEvents(picks)}>
          {canLockIn ? "Lock the lineup" : `Pick ${targetCount - picks.length} more to begin`}
        </PrimaryButton>
        <p className="max-w-sm text-center text-label text-black">
          You can drop these three scenes anytime the date is paused. Cupid never auto-fires them.
        </p>
      </div>

      {draftStep.active ? (
        <>
          <TutorialSpotlight target={firstSceneCardRef} />
          <TutorialCoachMark
            target={firstSceneCardRef}
            placement="right"
            title="Draft three scenes"
            body="Two ambient, two provocations, two reveals. Pick three to drop into the date when you pause. Cupid never auto-fires them."
            dismissLabel="Skip tour"
            onDismiss={draftStep.dismiss}
          />
        </>
      ) : null}
    </motion.section>
  );
}

function DraftPickPip({ selected, pickIndex }: { selected: boolean; pickIndex: number }) {
  if (!selected) {
    return (
      <span
        aria-hidden
        className="grid size-5 place-items-center rounded-full border border-dashed border-black/50 text-black"
      >
        <span className="size-1.5 rounded-full bg-black/45" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-5 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet font-mono text-sm font-semibold leading-none text-white shadow-cta"
    >
      {pickIndex + 1}
    </span>
  );
}
