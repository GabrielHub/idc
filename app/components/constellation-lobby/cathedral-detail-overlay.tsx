import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { DateScenario } from "../../domain/game";
import {
  SCENARIO_FLOW_BLURB,
  SCENARIO_FLOW_CATHEDRAL_TONE,
  SCENARIO_FLOW_DOT_TONE,
  SCENARIO_FLOW_LABEL,
} from "../scenario-flow";

export function CathedralDetailOverlay({
  open,
  scenario,
  cost,
  eyebrow,
  cta,
  note,
  onClose,
}: {
  open: boolean;
  scenario: DateScenario;
  cost: number;
  eyebrow: string;
  cta: ReactNode;
  note?: string;
  onClose: () => void;
}) {
  // Own the ESC dismiss locally — the lobby's window-level ESC handler
  // early-returns in auto mode (it only fires when the date book is open),
  // so without this listener pressing Escape over an auto-mode info-glyph
  // peek does nothing and the overlay blocks the Begin button.
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const { card, publicBrief, director, judgeRubric } = scenario;
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="detail-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 0.8, 0.2, 1] }}
          onClick={onClose}
          className="absolute inset-0 z-40 grid place-items-end bg-aura-ink/55 px-6 pb-[120px] pt-12 backdrop-blur-md"
        >
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 0.8, 0.2, 1] }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${scenario.title} scenario detail`}
            className="mx-auto flex max-h-full w-full max-w-[860px] flex-col rounded-card aura-liquid-glass aura-liquid-glass-rose p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 leading-tight">
                <div className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
                  {eyebrow}
                </div>
                <div className="mt-1 font-display text-display-md text-aura-paper">
                  {scenario.title}
                </div>
                <div className="mt-1 font-mono text-micro uppercase tracking-[0.18em] text-white/55">
                  {publicBrief.location}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close detail"
                className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover rounded-full px-3 py-1.5 font-display text-label text-aura-paper"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                title={SCENARIO_FLOW_BLURB[director.flow]}
                aria-label={`Flow: ${SCENARIO_FLOW_LABEL[director.flow]}. ${SCENARIO_FLOW_BLURB[director.flow]}`}
                className={`inline-flex items-center gap-2.5 rounded-pill border px-3.5 py-1.5 backdrop-blur-md ${SCENARIO_FLOW_CATHEDRAL_TONE[director.flow].pill}`}
              >
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${SCENARIO_FLOW_DOT_TONE[director.flow]}`}
                />
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-white/60">
                  Plays as
                </span>
                <span className="font-mono text-label font-semibold uppercase tracking-[0.2em]">
                  {SCENARIO_FLOW_LABEL[director.flow]}
                </span>
              </span>
              <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
                cost - {cost}
              </span>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <p className="font-display text-lead leading-relaxed text-aura-paper">
                {publicBrief.premise}
              </p>
              <p className="mt-2 font-sans text-label leading-relaxed text-white/80">
                {publicBrief.openingSituation}
              </p>
              <p className="mt-3 font-sans text-label italic leading-snug text-aura-rose/90">
                {director.tone}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <DetailGlassSection
                  label={`Plays as - ${SCENARIO_FLOW_LABEL[director.flow]}`}
                  labelClass={SCENARIO_FLOW_CATHEDRAL_TONE[director.flow].eyebrow}
                >
                  <p className="font-sans text-label leading-relaxed text-white/80">
                    {SCENARIO_FLOW_BLURB[director.flow]}
                  </p>
                </DetailGlassSection>
                <DetailGlassSection label="Room constraints">
                  <DetailBulletList items={director.rules} dotClass="bg-aura-rose" />
                </DetailGlassSection>
                <DetailGlassSection label="Watch for" labelClass="text-aura-emerald">
                  <DetailBulletList items={judgeRubric.successSignals} dotClass="bg-aura-emerald" />
                </DetailGlassSection>
                <DetailGlassSection label="Avoid" labelClass="text-aura-rose">
                  <DetailBulletList items={judgeRubric.failureSignals} dotClass="bg-aura-rose" />
                </DetailGlassSection>
                <DetailGlassSection label="What both know">
                  <p className="font-sans text-label leading-relaxed text-white/80">
                    {publicBrief.whatBothCharactersKnow}
                  </p>
                </DetailGlassSection>
                <DetailGlassSection label="Vibe meters">
                  <ul className="flex flex-wrap gap-2 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-white/75">
                    <li className="rounded-pill border border-white/15 bg-white/10 px-2.5 py-0.5">
                      risk - {card.risk}
                    </li>
                    <li className="rounded-pill border border-white/15 bg-white/10 px-2.5 py-0.5">
                      warmth - {card.intimacy}
                    </li>
                    <li className="rounded-pill border border-white/15 bg-white/10 px-2.5 py-0.5">
                      chaos - {card.chaos}
                    </li>
                  </ul>
                </DetailGlassSection>
              </div>

              <DetailGlassSection label="Repeat behavior" className="mt-4">
                <p className="font-sans text-label leading-relaxed text-white/80">
                  {director.repeatBehavior}
                </p>
              </DetailGlassSection>

              <p className="mt-4 font-sans text-label leading-relaxed text-white/70">
                {card.summary}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {cta}
              {note === undefined ? null : (
                <span className="font-mono text-micro uppercase tracking-[0.18em] text-aura-amber">
                  {note}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DetailGlassSection({
  label,
  labelClass = "text-aura-rose",
  className = "",
  children,
}: {
  label: string;
  labelClass?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`aura-liquid-glass aura-liquid-glass-ink rounded-card p-4 ring-1 ring-white/10 ${className}`}
    >
      <p className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${labelClass}`}>
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function DetailBulletList({ items, dotClass }: { items: readonly string[]; dotClass: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2 font-sans text-label leading-relaxed text-aura-paper/85"
        >
          <span aria-hidden className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dotClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
