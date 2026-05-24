import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { loadScenarioBackdropIds, scenarioBackdropPath } from "../scenario-backdrop";
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
}) {
  const tint = roomReadTint(entry.scenario.roomRead);
  const interactive = entry.disabled !== true;
  const tag = topTagFor(entry, mode);
  const enterDuration = reducedMotion ? 0.001 : 0.32;

  return (
    <motion.article
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: enterDuration, ease: [0.22, 0.8, 0.2, 1], delay: indexDelay }}
      whileHover={interactive && !reducedMotion ? { y: -3 } : undefined}
      className={`group/door relative flex aspect-[4/5] flex-col overflow-hidden rounded-card text-left transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/70 ${interactive ? "cursor-pointer" : "cursor-not-allowed"} ${
        selected ? "shadow-cta ring-2 ring-aura-rose/85" : "ring-1 ring-white/10"
      } ${entry.disabled === true ? "opacity-45" : ""} ${
        entry.alreadyInDeck === true && !selected ? "opacity-80" : ""
      } ${hovered && !selected ? "ring-white/30" : ""}`}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={!interactive}
        aria-label={`${entry.scenario.title} - ${entry.scenario.venue}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-card border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/70 disabled:cursor-not-allowed"
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
          {entry.alreadyInDeck === true ? (
            <span className="rounded-pill border border-aura-rose/45 bg-aura-rose/25 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-rose backdrop-blur-md">
              in deck
            </span>
          ) : null}
          <span className="font-display text-display-sm leading-none text-aura-paper drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            ${entry.scenario.cost}
          </span>
          {interactive ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetail();
              }}
              aria-label={`Open ${entry.scenario.title} details`}
              className="pointer-events-auto cursor-pointer rounded-full bg-white/15 p-1.5 text-aura-paper ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white/25 hover:ring-white/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-rose/70"
            >
              <DoorPeekGlyph />
            </button>
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

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <AxisMeter value={entry.scenario.axes.risk} kind="risk" />
            <AxisMeter value={entry.scenario.axes.intimacy} kind="warmth" />
            <AxisMeter value={entry.scenario.axes.chaos} kind="chaos" />
          </div>
          <span
            className={`inline-flex shrink-0 rounded-pill border px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.18em] backdrop-blur-md ${tint.pill}`}
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

function AxisMeter({ value, kind }: { value: number; kind: "risk" | "warmth" | "chaos" }) {
  const segments = 3;
  const filled = Math.max(0, Math.min(segments, Math.round(value)));
  const fillBg =
    kind === "risk" ? "bg-aura-rose" : kind === "warmth" ? "bg-aura-violet" : "bg-aura-amber";
  const fullName = kind === "risk" ? "Risk" : kind === "warmth" ? "Warmth" : "Chaos";
  const levelName = filled <= 1 ? "low" : filled === 2 ? "medium" : "high";
  const blurb =
    kind === "risk"
      ? "How likely the room is to skew the night - embarrassment, conflict, an exit."
      : kind === "warmth"
        ? "How intimately the table runs - eye contact, quiet stretches, lean-in beats."
        : "How chaotic the room is - interruptions, side characters, unexpected turns.";

  return (
    <div className="group/axis relative flex items-center gap-2">
      <span
        aria-label={fullName}
        className="inline-block overflow-hidden whitespace-nowrap font-mono text-micro font-semibold uppercase tracking-[0.16em] text-white/75 transition-[max-width] duration-300 ease-out [max-width:0.625rem] group-hover/door:[max-width:4.5rem]"
      >
        {fullName.toUpperCase()}
      </span>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className={`h-1.5 flex-1 rounded-full ${i < filled ? fillBg : "bg-white/15"}`}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-full left-0 z-40 mb-2 w-max max-w-[220px] -translate-y-0.5 opacity-0 transition-opacity duration-150 group-hover/axis:opacity-100">
        <div className="aura-liquid-glass aura-liquid-glass-ink rounded-card px-3 py-2 shadow-cta ring-1 ring-white/15">
          <div className="font-mono text-micro uppercase tracking-[0.22em] text-white/65">
            {fullName} - {levelName}
          </div>
          <p className="mt-1 font-sans text-label leading-snug text-aura-paper/90">{blurb}</p>
        </div>
      </div>
    </div>
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
  if (entry.kind === "deck") return entry.slotLabel ?? "deck slot";
  if (entry.kind === "draw") return mode === "auto" ? "" : "scenario";
  return "library";
}
