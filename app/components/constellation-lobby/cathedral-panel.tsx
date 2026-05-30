import { type Ref } from "react";
import { AnimatePresence, motion } from "motion/react";

import { DECK_SIZE_MAX } from "../../domain/game";
import { AuraButton } from "../aura-button";
import { CathedralCard } from "./cathedral-card";
import type { CathedralMode, DeckBookShards, DoorEntry } from "./cathedral-types";

export function CathedralPanel({
  open,
  mode,
  doors,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onOpenDetail,
  onClose,
  reducedMotion,
  containerRef,
  scrollRef,
  deckBookShards,
  composeWarnings,
}: {
  open: boolean;
  mode: CathedralMode;
  doors: DoorEntry[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onClose?: () => void;
  reducedMotion: boolean;
  containerRef?: Ref<HTMLDivElement>;
  scrollRef?: Ref<HTMLDivElement>;
  deckBookShards?: DeckBookShards;
  /**
   * Deck composition advisories (no low-pressure cards, no high-pressure
   * cards, etc.). Surfaced as amber "Heads up" pills under the shards row
   * in deck mode so the player notices imbalanced decks before they commit
   * a pair.
   */
  composeWarnings?: readonly string[];
}) {
  const enterDuration = reducedMotion ? 0.001 : 0.36;
  const railReserveClass = mode === "auto" ? "2xl:pr-[24rem]" : "";
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="cathedral-panel"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: enterDuration, ease: [0.22, 0.8, 0.2, 1] }}
          className="pointer-events-none absolute inset-x-0 bottom-[124px] top-16 z-20 px-8"
        >
          <div
            ref={containerRef}
            className={`pointer-events-auto mx-auto flex h-full max-w-[1440px] flex-col ${railReserveClass}`}
          >
            <CathedralHeader
              mode={mode}
              doorCount={doors.length}
              deckBookShards={deckBookShards}
              onClose={onClose}
              composeWarnings={composeWarnings}
            />
            <div ref={scrollRef} className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
              {doors.length === 0 ? (
                <CathedralEmptyState mode={mode} />
              ) : (
                <CathedralGrid
                  doors={doors}
                  mode={mode}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onHover={onHover}
                  onSelect={onSelect}
                  onOpenDetail={onOpenDetail}
                  reducedMotion={reducedMotion}
                />
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CathedralHeader({
  mode,
  doorCount,
  deckBookShards,
  onClose,
  composeWarnings,
}: {
  mode: CathedralMode;
  doorCount: number;
  deckBookShards?: DeckBookShards;
  onClose?: () => void;
  composeWarnings?: readonly string[];
}) {
  const title = mode === "auto" ? "Tonight's draw" : "Date Book";
  const subtitle =
    mode === "auto"
      ? "Pick the room that leads the pair tonight."
      : "Tap a staged room card to drop it. New room cards arrive after dates.";
  const counter =
    mode === "auto"
      ? `${doorCount} drawn`
      : `${doorCount} room ${doorCount === 1 ? "card" : "cards"} staged`;
  const showShards = deckBookShards !== undefined;
  const showDeckPill = mode === "deck";
  const hasWarnings = composeWarnings !== undefined && composeWarnings.length > 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-3">
          {onClose === undefined ? null : <BackButton onClose={onClose} />}
          {showDeckPill ? <DeckModePill deckBookShards={deckBookShards} /> : null}
        </div>
        {showShards ? <DeckShardsRow shards={deckBookShards} /> : null}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="font-mono text-micro uppercase tracking-[0.32em] text-aura-rose/80">
            // pick room · <span className="text-white/55">{counter}</span>
          </div>
          <h2 className="mt-1 font-display text-display-md leading-none text-aura-paper">
            {title}
          </h2>
          <p className="mt-2 font-sans text-label text-white/70">{subtitle}</p>
        </div>
        {hasWarnings ? <DeckWarningsRow warnings={composeWarnings} /> : null}
      </div>
    </div>
  );
}

function BackButton({ onClose }: { onClose: () => void }) {
  return (
    <AuraButton
      tooltip="Close Date Book"
      tooltipPlacement="bottom"
      onClick={onClose}
      aria-label="Close Date Book"
      className="cursor-pointer aura-liquid-glass aura-liquid-glass-hover inline-flex items-center gap-1.5 rounded-pill py-2 pl-3 pr-4 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper"
    >
      <span aria-hidden className="-mt-px text-base leading-none">
        ←
      </span>
      <span>Back to lobby</span>
    </AuraButton>
  );
}

function DeckModePill({ deckBookShards }: { deckBookShards?: DeckBookShards }) {
  const badge =
    deckBookShards === undefined ? undefined : `${deckBookShards.slotCount}/${DECK_SIZE_MAX}`;
  return (
    <div className="inline-flex items-center gap-2 rounded-pill bg-aura-rose px-3.5 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_22px_-10px_rgba(244,63,94,0.7)]">
      <span>Date Book</span>
      {badge === undefined ? null : (
        <span className="font-display text-micro text-white/90">{badge}</span>
      )}
    </div>
  );
}

function DeckWarningsRow({ warnings }: { warnings: readonly string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {warnings.map((warning) => (
        <div
          key={warning}
          className="aura-liquid-glass aura-liquid-glass-amber inline-flex items-center gap-2 rounded-pill py-1.5 pl-2.5 pr-3.5 leading-tight"
        >
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-aura-amber shadow-[0_0_10px_rgba(245,158,11,0.85)]"
          />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-amber">
            heads up
          </span>
          <span className="font-sans text-label text-aura-paper">{warning}</span>
        </div>
      ))}
    </div>
  );
}

function DeckShardsRow({ shards }: { shards: DeckBookShards }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <PillShard
        eyebrow="slots"
        value={`${shards.slotCount} / ${DECK_SIZE_MAX}`}
        tone={shards.slotTone}
      />
      <PillShard
        eyebrow="budget"
        value={`${shards.spend} / ${shards.budgetCap}`}
        tone={shards.budgetTone}
      />
      <AxesPill axes={shards.axes} />
      {shards.pressure === undefined ? null : <PressurePill pressure={shards.pressure} />}
    </div>
  );
}

function PillShard({
  eyebrow,
  value,
  tone,
}: {
  eyebrow: string;
  value: string;
  tone: "rose" | "neutral";
}) {
  const toneClass = tone === "rose" ? "aura-liquid-glass-rose" : "";
  const valueClass = tone === "rose" ? "text-aura-rose" : "text-aura-paper";
  return (
    <div className={`aura-liquid-glass ${toneClass} rounded-full px-3 py-1 leading-tight`}>
      <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
        {eyebrow}
      </span>
      <span className={`ml-1.5 font-display text-label ${valueClass}`}>{value}</span>
    </div>
  );
}

function AxesPill({ axes }: { axes: DeckBookShards["axes"] }) {
  return (
    <div className="aura-liquid-glass rounded-full px-3 py-1 leading-tight flex items-center gap-1.5">
      <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">axes</span>
      <AxisDot label="R" level={axes.risk} />
      <AxisDot label="I" level={axes.intimacy} />
      <AxisDot label="C" level={axes.chaos} />
    </div>
  );
}

function AxisDot({ label, level }: { label: string; level: "low" | "medium" | "high" }) {
  const dot =
    level === "high" ? "bg-aura-rose" : level === "medium" ? "bg-aura-amber" : "bg-aura-emerald";
  const text =
    level === "high"
      ? "text-aura-rose"
      : level === "medium"
        ? "text-aura-amber"
        : "text-aura-emerald";
  return (
    <span className={`inline-flex items-center gap-1 font-display text-label ${text}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      <span>{label}</span>
    </span>
  );
}

function PressurePill({ pressure }: { pressure: { lowPressure: number; highPressure: number } }) {
  return (
    <div className="aura-liquid-glass rounded-full px-3 py-1 leading-tight">
      <span className="font-mono text-micro uppercase tracking-[0.18em] text-white/55">
        pressure
      </span>
      <span className="ml-1.5 font-display text-label text-aura-paper">
        {pressure.lowPressure} <span className="text-white/45">low</span> - {pressure.highPressure}{" "}
        <span className="text-white/45">high</span>
      </span>
    </div>
  );
}

function CathedralEmptyState({ mode }: { mode: CathedralMode }) {
  const copy =
    mode === "deck"
      ? "Date Book is empty. New room cards arrive after dates."
      : "Commit a focus case and partner to draw tonight's rooms.";
  return (
    <div className="flex h-full items-center justify-center">
      <div className="aura-liquid-glass aura-liquid-glass-ink rounded-card px-6 py-5 text-center">
        <div className="font-mono text-micro uppercase tracking-[0.28em] text-white/55">
          // pick room empty
        </div>
        <p className="mt-2 font-sans text-label text-aura-paper/85">{copy}</p>
      </div>
    </div>
  );
}

function CathedralGrid({
  doors,
  mode,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onOpenDetail,
  reducedMotion,
}: {
  doors: DoorEntry[];
  mode: CathedralMode;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  reducedMotion: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {doors.map((entry, idx) => (
        <CathedralCard
          key={entry.scenario.id}
          entry={entry}
          mode={mode}
          selected={selectedId === entry.scenario.id}
          hovered={hoveredId === entry.scenario.id}
          onSelect={() => onSelect(entry.scenario.id)}
          onOpenDetail={() => onOpenDetail(entry.scenario.id)}
          onHoverEnter={() => onHover(entry.scenario.id)}
          onHoverLeave={() => onHover(null)}
          indexDelay={reducedMotion ? 0 : Math.min(idx, 11) * 0.02}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}
