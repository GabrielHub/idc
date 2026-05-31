import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { AuraButton } from "../aura-button";
import { loadScenarioBackdropIds, scenarioBackdropPath } from "../scenario-backdrop";
import {
  SCENARIO_FLOW_BLURB,
  SCENARIO_FLOW_CATHEDRAL_TONE,
  SCENARIO_FLOW_DOT_TONE,
  SCENARIO_FLOW_LABEL,
} from "../scenario-flow";
import type { CathedralMode, DoorEntry, RoomReadTint } from "./cathedral-types";
import type { LobbyScenario } from "./types";

export function CathedralCard({
  entry,
  mode,
  selected,
  hovered,
  onSelect,
  onOpenDetail,
  onHoverEnter,
  onHoverLeave,
  indexDelay,
  reducedMotion,
  showTooltip = true,
  fill = false,
  animateIn = true,
}: {
  entry: DoorEntry;
  mode: CathedralMode;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  indexDelay: number;
  reducedMotion: boolean;
  // Hover tooltip repeats the title/venue, which is redundant where the card
  // is already large and self-labeled (the card-offer overlay). Off in that
  // context to avoid the tooltip overlapping nearby headings.
  showTooltip?: boolean;
  // When true the card stretches to fill its positioned parent instead of
  // owning a 4/5 aspect box. Used as the front face of a flip, where the slot
  // owns the geometry and the back face must line up exactly.
  fill?: boolean;
  // When false the card skips its own fade/rise entrance, leaving the reveal to
  // the parent (the deal + flip wrapper) so the face never animates twice.
  animateIn?: boolean;
}) {
  const tint = roomReadTint(entry.scenario.roomRead);
  const interactive = entry.disabled !== true;
  const tag = topTagFor(entry, mode);
  const enterDuration = reducedMotion ? 0.001 : 0.32;
  const sizingClass = fill ? "absolute inset-0 size-full" : "aspect-[4/5]";

  return (
    <motion.article
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      initial={animateIn ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: enterDuration, ease: [0.22, 0.8, 0.2, 1], delay: indexDelay }}
      whileHover={interactive && !reducedMotion && !fill ? { y: -3 } : undefined}
      className={`group/door relative flex ${sizingClass} flex-col overflow-hidden rounded-card text-left transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/70 ${interactive ? "cursor-pointer" : "cursor-not-allowed"} ${
        selected ? "shadow-cta ring-2 ring-aura-rose/85" : "ring-1 ring-white/10"
      } ${entry.disabled === true ? "opacity-45" : ""} ${
        hovered && !selected ? "ring-white/30" : ""
      }`}
    >
      <AuraButton
        tooltip={showTooltip ? `${entry.scenario.title}, ${entry.scenario.venue}` : undefined}
        tooltipPlacement="top"
        tooltipAlign="block"
        tooltipClassName="absolute inset-0 z-10"
        aria-label={`${entry.scenario.title}, ${entry.scenario.venue}`}
        onClick={onSelect}
        disabled={!interactive}
        className={`${showTooltip ? "" : "absolute inset-0 z-10 "}h-full w-full cursor-pointer rounded-card border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/70 disabled:cursor-not-allowed`}
      />

      <CardScenarioBackdrop
        scenarioId={entry.scenario.id}
        hovered={hovered}
        reducedMotion={reducedMotion}
        tint={tint}
      />

      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 z-10 h-full w-[2px] ${tint.strip} transition-[box-shadow,opacity] duration-300 ${
          hovered && !reducedMotion ? `opacity-100 ${tint.jambGlow}` : "opacity-90"
        }`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute right-0 top-0 z-10 h-full w-[2px] ${tint.strip} transition-[box-shadow,opacity] duration-300 ${
          hovered && !reducedMotion ? `opacity-100 ${tint.jambGlow}` : "opacity-90"
        }`}
      />

      <div className="pointer-events-none relative z-20 flex items-start justify-between gap-2 px-4 pt-3 pb-2">
        {tag ? (
          <span
            className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] ${tint.eyebrow}`}
          >
            {tag}
          </span>
        ) : (
          <span aria-hidden />
        )}
        <div className="flex items-center gap-2">
          <span className="font-display text-display-sm leading-none text-aura-paper drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            ${entry.scenario.cost}
          </span>
          {interactive ? (
            <AuraButton
              tooltip={`Open ${entry.scenario.title} room brief`}
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetail();
              }}
              className="pointer-events-auto cursor-pointer rounded-full bg-white/15 p-1.5 text-aura-paper ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white/25 hover:ring-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/70"
            >
              <DoorPeekGlyph />
            </AuraButton>
          ) : null}
        </div>
      </div>

      <div className="relative z-0 min-h-0 flex-1" />

      <div className="pointer-events-none relative z-20 mt-auto bg-[linear-gradient(180deg,rgba(7,4,26,0)_0%,rgba(7,4,26,0.6)_30%,rgba(7,4,26,0.92)_100%)] px-4 pb-3 pt-6 backdrop-blur-[2px]">
        <h3 className="font-display text-display-sm leading-tight text-aura-paper drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
          {entry.scenario.title}
        </h3>
        <p className="mt-1 font-mono text-micro uppercase tracking-[0.16em] text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {entry.scenario.venue}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <FlowPill flow={entry.scenario.flow} />
          <span
            className={`inline-flex shrink-0 rounded-pill border px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] backdrop-blur-md ${tint.pill}`}
          >
            {entry.scenario.roomRead}
          </span>
        </div>
      </div>

      {entry.disabled === true ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.04)_0_6px,transparent_6px_12px)]"
        />
      ) : null}
    </motion.article>
  );
}

function CardScenarioBackdrop({
  scenarioId,
  hovered,
  reducedMotion,
  tint,
}: {
  scenarioId: string;
  hovered: boolean;
  reducedMotion: boolean;
  tint: RoomReadTint;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    void loadScenarioBackdropIds().then((ids) => {
      if (cancelled) return;
      setSrc(ids.has(scenarioId) ? scenarioBackdropPath(scenarioId) : null);
    });
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  const hoverScale = hovered && !reducedMotion ? "scale-[1.045]" : "scale-100";

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {src === null ? (
        <span className={`absolute inset-0 ${tint.fallbackBg}`} />
      ) : (
        <img
          src={src}
          alt=""
          decoding="async"
          loading="lazy"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setSrc(null)}
          className={`absolute inset-0 size-full object-cover blur-[3px] saturate-[1.15] contrast-[1.02] transition-[transform,opacity] duration-[600ms] ease-out ${hoverScale} ${loaded ? "opacity-95" : "opacity-0"}`}
        />
      )}
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(7,4,26,0)_0%,rgba(7,4,26,0.18)_55%,rgba(7,4,26,0.55)_100%)]" />
      <span
        className={`absolute inset-0 transition-opacity duration-300 ${
          hovered && !reducedMotion ? "opacity-100" : "opacity-0"
        } ${tint.innerGlow}`}
      />
    </span>
  );
}

function FlowPill({ flow }: { flow: LobbyScenario["flow"] }) {
  const tone = SCENARIO_FLOW_CATHEDRAL_TONE[flow];
  const dot = SCENARIO_FLOW_DOT_TONE[flow];
  return (
    <span
      title={SCENARIO_FLOW_BLURB[flow]}
      aria-label={`Flow: ${SCENARIO_FLOW_LABEL[flow]}. ${SCENARIO_FLOW_BLURB[flow]}`}
      className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] backdrop-blur-md ${tone.pill}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      {SCENARIO_FLOW_LABEL[flow]}
    </span>
  );
}

function DoorPeekGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6.4" />
      <path d="M8 7.2v3.4" />
      <circle cx="8" cy="5.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function roomReadTint(roomRead: LobbyScenario["roomRead"]): RoomReadTint {
  if (roomRead === "promising") {
    return {
      strip: "bg-aura-rose",
      pill: "bg-aura-rose/25 border-aura-rose/50 text-aura-rose",
      eyebrow: "text-aura-rose",
      fallbackBg:
        "bg-[radial-gradient(ellipse_at_50%_45%,rgba(244,63,94,0.55)_0%,rgba(124,30,60,0.45)_55%,rgba(20,8,28,0.95)_100%)]",
      innerGlow:
        "bg-[radial-gradient(ellipse_at_50%_45%,rgba(244,63,94,0.22)_0%,rgba(244,63,94,0)_60%)]",
      jambGlow: "shadow-[0_0_22px_rgba(244,63,94,0.7)]",
    };
  }
  if (roomRead === "volatile") {
    return {
      strip: "bg-aura-amber",
      pill: "bg-aura-amber/25 border-aura-amber/50 text-aura-amber",
      eyebrow: "text-aura-amber",
      fallbackBg:
        "bg-[radial-gradient(ellipse_at_50%_45%,rgba(245,158,11,0.55)_0%,rgba(120,60,12,0.45)_55%,rgba(20,12,8,0.95)_100%)]",
      innerGlow:
        "bg-[radial-gradient(ellipse_at_50%_45%,rgba(245,158,11,0.22)_0%,rgba(245,158,11,0)_60%)]",
      jambGlow: "shadow-[0_0_22px_rgba(245,158,11,0.7)]",
    };
  }
  return {
    strip: "bg-aura-emerald",
    pill: "bg-aura-emerald/25 border-aura-emerald/50 text-aura-emerald",
    eyebrow: "text-aura-emerald",
    fallbackBg:
      "bg-[radial-gradient(ellipse_at_50%_45%,rgba(16,185,129,0.45)_0%,rgba(10,60,46,0.5)_55%,rgba(8,16,20,0.95)_100%)]",
    innerGlow:
      "bg-[radial-gradient(ellipse_at_50%_45%,rgba(16,185,129,0.22)_0%,rgba(16,185,129,0)_60%)]",
    jambGlow: "shadow-[0_0_22px_rgba(16,185,129,0.7)]",
  };
}

function topTagFor(entry: DoorEntry, mode: CathedralMode): string {
  if (entry.kind === "deck") return entry.slotLabel ?? "room card";
  return mode === "auto" ? "" : "room";
}
