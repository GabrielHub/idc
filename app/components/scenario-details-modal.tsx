import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { DateScenario, GameSave } from "../domain/game";
import { noopTutorialUpdate, useTutorialStep } from "../services/tutorial";
import { EASE_OUT_QUART } from "./dashboard-atoms";
import { scenarioBackdropPath } from "./scenario-backdrop";
import { RISK_DOT_TONE, RISK_SHORT, RISK_TEXT_TONE } from "./scenario-card";
import { TutorialCoachMark } from "./tutorial";

export type ScenarioDetailsAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export type ScenarioDetailsModalProps = {
  scenario: DateScenario;
  eyebrow: string;
  statusLabel?: string;
  primaryAction?: ScenarioDetailsAction;
  save?: GameSave;
  onTutorialUpdate?: (next: GameSave) => void;
  onClose: () => void;
};

export function ScenarioDetailsModal({
  scenario,
  eyebrow,
  statusLabel,
  primaryAction,
  save,
  onTutorialUpdate,
  onClose,
}: ScenarioDetailsModalProps) {
  const tutorialUpdate = onTutorialUpdate ?? noopTutorialUpdate;
  const briefSectionRef = useRef<HTMLElement | null>(null);
  const [modalReady, setModalReady] = useState(false);
  const firstOpenStep = useTutorialStep(
    save ?? null,
    "scenario.file.first-open",
    save !== undefined,
    tutorialUpdate,
  );

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      key="scenario-detail-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-aura-ink/60 px-4 py-8 backdrop-blur-xl"
    >
      <motion.div
        key="scenario-detail-card"
        layout
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
        onAnimationComplete={() => setModalReady(true)}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${scenario.title} scenario detail`}
        className="relative isolate flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-card bg-white/15 shadow-[0_50px_120px_-30px_rgba(15,23,42,0.6)] ring-1 ring-white/60 backdrop-blur-2xl"
      >
        <ScenarioDetailBackdrop scenarioId={scenario.id} />

        <button
          type="button"
          data-sfx="click"
          onClick={onClose}
          aria-label="Close scenario detail"
          className="absolute right-6 top-6 z-30 grid size-10 cursor-pointer place-items-center rounded-full border border-white/35 bg-white/20 text-aura-ink/75 shadow-none transition hover:bg-white/40 hover:text-aura-rose"
        >
          ✕
        </button>

        <div className="relative z-10 flex min-h-0 flex-col">
          <header className="px-4 pt-4 md:px-6 md:pt-6">
            <div className="aura-glass rounded-card border-0 px-6 py-5 pr-16 md:px-10 md:py-7 md:pr-20">
              <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
                {eyebrow}
              </p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.05] text-aura-ink md:text-[2.75rem]">
                {scenario.title}
              </h2>
              <p className="mt-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                {scenario.publicBrief.location}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <VibeChip label="Risk" tone={scenario.card.risk} />
                <VibeChip label="Intimacy" tone={scenario.card.intimacy} />
                <VibeChip label="Chaos" tone={scenario.card.chaos} />
                {statusLabel === undefined ? null : (
                  <span className="aura-glass-strong inline-flex items-center gap-1.5 rounded-pill border border-amber-400/70 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-amber-800">
                    {statusLabel}
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 pb-5 pt-5 md:px-6">
            <div className="grid gap-5 md:grid-cols-[1.25fr_0.95fr]">
              <div className="space-y-5">
                <section
                  ref={briefSectionRef}
                  className={glassSectionClass("px-5 py-5 md:px-6 md:py-6")}
                >
                  <p className="font-display text-lead font-medium leading-relaxed text-aura-ink">
                    {scenario.publicBrief.premise}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-aura-ink">
                    {scenario.publicBrief.openingSituation}
                  </p>

                  <p className="aura-accent mt-6 text-lg leading-snug text-aura-ink">
                    {scenario.director.tone}
                  </p>
                </section>

                <DetailSection label="Room constraints">
                  <BulletList items={scenario.director.rules} tone="rose" />
                </DetailSection>
              </div>

              <div className="space-y-5">
                <SignalList
                  label="Watch for"
                  tone="emerald"
                  items={scenario.judgeRubric.successSignals}
                />
                <SignalList label="Avoid" tone="rose" items={scenario.judgeRubric.failureSignals} />

                <DetailSection label="What both know">
                  {scenario.publicBrief.whatBothCharactersKnow}
                </DetailSection>
                <DetailSection label="Repeat behavior">
                  {scenario.director.repeatBehavior}
                </DetailSection>
              </div>
            </div>
          </div>

          <footer className="relative flex flex-wrap items-center justify-end gap-3 px-4 pb-5 pt-1 md:px-6 md:pb-6">
            <FlatButton onClick={onClose}>Close</FlatButton>
            {primaryAction === undefined ? null : (
              <FlatButton
                variant="primary"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </FlatButton>
            )}
          </footer>
        </div>
      </motion.div>

      {firstOpenStep.active && modalReady ? (
        <div onClick={(event) => event.stopPropagation()}>
          <TutorialCoachMark
            target={briefSectionRef}
            placement="top"
            title="Read the room before you book it"
            body="Every scenario brief lays out the premise, the rules of the room, and what the judge will reward or punish. Skim it so Cupid can match members to the right vibe."
            primaryLabel="Got it"
            onPrimary={firstOpenStep.complete}
            dismissLabel="Skip tour"
            onDismiss={firstOpenStep.dismiss}
          />
        </div>
      ) : null}
    </motion.div>
  );
}

function ScenarioDetailBackdrop({ scenarioId }: { scenarioId: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {failed ? (
        <span className="absolute inset-0 bg-gradient-to-br from-aura-mesh-rose/55 via-white to-aura-mesh-violet/55" />
      ) : (
        <img
          src={scenarioBackdropPath(scenarioId)}
          alt=""
          decoding="async"
          loading="eager"
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full scale-105 object-cover object-center blur-[6px] saturate-[1.3] contrast-[1.05]"
        />
      )}
      <span className="absolute inset-0 bg-[rgba(255,253,249,0.82)]" />
    </div>
  );
}

function VibeChip({ label, tone }: { label: string; tone: "low" | "medium" | "high" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-aura-hairline bg-white/85 px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] shadow-[0_2px_8px_-4px_rgba(15,23,42,0.12)]">
      <span aria-hidden className={`size-1.5 rounded-full ${RISK_DOT_TONE[tone]}`} />
      <span className="text-aura-ink">{label}</span>
      <span className={RISK_TEXT_TONE[tone]}>{RISK_SHORT[tone]}</span>
    </span>
  );
}

function DetailSection({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={glassSectionClass(className)}>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
        {label}
      </p>
      {typeof children === "string" ? (
        <p className="mt-2 text-sm leading-relaxed text-aura-ink">{children}</p>
      ) : (
        <div className="mt-3">{children}</div>
      )}
    </section>
  );
}

function BulletList({ items, tone }: { items: readonly string[]; tone: "rose" | "emerald" }) {
  const dotClass = tone === "emerald" ? "bg-emerald-500" : "bg-aura-rose";
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-aura-ink">
          <span aria-hidden className={`mt-2 size-1.5 shrink-0 rounded-full ${dotClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SignalList({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "emerald" | "rose";
  items: readonly string[];
}) {
  const labelClass = tone === "emerald" ? "text-emerald-700" : "text-aura-rose";
  return (
    <section className={glassSectionClass()}>
      <p className={`font-mono text-micro font-semibold uppercase tracking-[0.28em] ${labelClass}`}>
        {label}
      </p>
      <div className="mt-3">
        <BulletList items={items} tone={tone} />
      </div>
    </section>
  );
}

function FlatButton({
  children,
  onClick,
  disabled,
  variant = "quiet",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "quiet" | "primary";
}) {
  const toneClass =
    variant === "primary"
      ? "border-aura-rose/12 bg-aura-rose/8 text-aura-rose/80 hover:bg-aura-rose/14 hover:text-aura-rose"
      : "border-transparent bg-white/10 text-aura-muted/80 hover:bg-white/25 hover:text-aura-ink";

  return (
    <button
      type="button"
      data-sfx={variant === "primary" ? "primary" : "click"}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-pill border px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] shadow-none transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function glassSectionClass(className = ""): string {
  return ["aura-glass rounded-card border-0 px-5 py-4 text-aura-ink", className]
    .filter(Boolean)
    .join(" ");
}
