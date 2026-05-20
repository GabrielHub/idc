import { AnimatePresence } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  MANAGER_QUIP_CATALOG,
  MANAGER_QUIP_TRIGGER_GROUPS,
  type ManagerQuip,
  type ManagerQuipTriggerGroup,
  type ManagerQuipTriggerKey,
} from "../fixtures/manager-quips";
import {
  ManagerStandee,
  pickNextManagerStandeeSide,
  type ManagerStandeeSide,
} from "./manager-standee";
import { SfxControls } from "./sfx-controls";
import { useSfx, type VoiceClipPlayback } from "./sfx-provider";

export type {
  ManagerQuip,
  ManagerQuipTriggerGroup,
  ManagerQuipTriggerKey,
} from "../fixtures/manager-quips";
export {
  MANAGER_QUIP_CATALOG,
  MANAGER_QUIP_TRIGGER_GROUPS,
  MANAGER_QUIP_IDS,
} from "../fixtures/manager-quips";

const STAGE_VISIBLE_MS = 4200;

interface ActiveQuipState {
  quip: ManagerQuip;
  key: number;
  side: ManagerStandeeSide;
}

interface ManagerStageProps {
  active: ActiveQuipState | null;
}

function ManagerStage({ active }: ManagerStageProps) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-card border border-aura-hairline bg-gradient-to-br from-rose-50/70 via-white/45 to-violet-50/55 shadow-[0_30px_70px_-32px_rgba(167,139,250,0.42),inset_0_1px_0_0_rgba(255,255,255,0.85)]">
      <StageMesh />
      <StageGrid />
      <StageHeader />
      <StageFloorFade />
      <AnimatePresence>
        {active ? (
          <ManagerStandee
            key={active.key}
            quip={active.quip}
            side={active.side}
            surface="preview"
          />
        ) : null}
      </AnimatePresence>
      <StageEmptyHint visible={active === null} />
    </div>
  );
}

function StageMesh() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="aura-blob-1 absolute -left-16 top-10 size-64 rounded-full bg-aura-mesh-rose/60 blur-3xl" />
      <span className="aura-blob-2 absolute right-0 top-0 size-72 rounded-full bg-aura-mesh-violet/55 blur-3xl" />
      <span className="aura-blob-3 absolute bottom-0 left-1/3 size-56 rounded-full bg-aura-mesh-amber/50 blur-3xl" />
    </div>
  );
}

function StageGrid() {
  return (
    <div
      aria-hidden
      className="aura-dot-grid pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
    />
  );
}

function StageHeader() {
  return (
    <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 border-b border-aura-hairline bg-white/45 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <span aria-hidden className="aura-pulse size-1.5 rounded-full bg-aura-rose" />
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-aura-ink">
          Cupid / shift 04
        </span>
        <span className="font-mono text-sm uppercase tracking-[0.2em] text-aura-faint">
          / live date
        </span>
      </div>
      <div className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-aura-faint">
        <span>turn 18 / 24</span>
        <span aria-hidden className="h-3 w-px bg-aura-hairline-strong" />
        <span>health 62</span>
      </div>
    </div>
  );
}

function StageFloorFade() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/65 via-white/15 to-transparent"
    />
  );
}

function StageEmptyHint({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-1 text-center font-serif italic text-aura-muted transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="text-sm">She is offstage. Play a line to bring her up.</span>
    </div>
  );
}

function useQuipPlayback() {
  const { playVoiceClip } = useSfx();
  const [active, setActive] = useState<ActiveQuipState | null>(null);
  const keyRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const lastSideRef = useRef<ManagerStandeeSide | null>(null);
  const playbackRef = useRef<VoiceClipPlayback | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (playbackRef.current !== null) {
      playbackRef.current.stop();
      playbackRef.current = null;
    }
  }, []);

  const play = useCallback(
    (quip: ManagerQuip) => {
      stopPlayback();
      keyRef.current += 1;
      const key = keyRef.current;
      const side = pickNextManagerStandeeSide(lastSideRef.current, [quip.id, key]);
      lastSideRef.current = side;
      setActive({ quip, key, side });
      if (quip.status === "recorded") {
        void playVoiceClip(quip.audio).then((playback) => {
          if (keyRef.current === key) {
            playbackRef.current = playback;
          } else {
            playback.stop();
          }
        });
      }
      clearTimer();
      timeoutRef.current = window.setTimeout(() => {
        setActive((current) => (current && current.key === key ? null : current));
      }, STAGE_VISIBLE_MS);
    },
    [clearTimer, playVoiceClip, stopPlayback],
  );

  const dismiss = useCallback(() => {
    clearTimer();
    stopPlayback();
    setActive(null);
  }, [clearTimer, stopPlayback]);

  return { active, play, dismiss };
}

export function ManagerQuipPreview() {
  const { active, play, dismiss } = useQuipPlayback();
  const [quipIndex, setQuipIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [previewCopied, setPreviewCopied] = useState(false);
  const previewCopyResetRef = useRef<number | null>(null);

  const quip = MANAGER_QUIP_CATALOG[quipIndex];

  const handleReplay = useCallback(() => {
    if (quip === undefined) return;
    play(quip);
  }, [play, quip]);

  const handleCycle = useCallback(
    (direction: 1 | -1) => {
      const next =
        (quipIndex + direction + MANAGER_QUIP_CATALOG.length) % MANAGER_QUIP_CATALOG.length;
      setQuipIndex(next);
      const nextQuip = MANAGER_QUIP_CATALOG[next];
      if (nextQuip !== undefined) {
        play(nextQuip);
      }
    },
    [play, quipIndex],
  );

  const handlePlayFromList = useCallback(
    (target: ManagerQuip) => {
      const idx = MANAGER_QUIP_CATALOG.findIndex((entry) => entry.id === target.id);
      if (idx !== -1) setQuipIndex(idx);
      play(target);
    },
    [play],
  );

  const handleCopyPreviewScript = useCallback(async () => {
    const script = quip?.generationScript;
    if (script === undefined) return;
    try {
      await navigator.clipboard.writeText(script);
      setPreviewCopied(true);
      if (previewCopyResetRef.current !== null) {
        window.clearTimeout(previewCopyResetRef.current);
      }
      previewCopyResetRef.current = window.setTimeout(() => {
        setPreviewCopied(false);
        previewCopyResetRef.current = null;
      }, 1800);
    } catch {
      setPreviewCopied(false);
    }
  }, [quip?.generationScript]);

  return (
    <figure className="my-6 flex flex-col gap-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // manager standee, interactive preview
        </span>
        <span className="font-serif text-sm italic leading-snug text-aura-muted">
          Click play. She pops in from a corner, tilted and shifting on stage, recorded audio
          attempts to autoplay, then she drops back the way she came. Draft lines run visual only.
        </span>
      </figcaption>

      <SfxControls />

      <ManagerStage active={active} />

      <PreviewControls
        quip={quip}
        quipIndex={quipIndex}
        total={MANAGER_QUIP_CATALOG.length}
        isPlaying={active !== null}
        isExpanded={expanded}
        isCopied={previewCopied}
        onCycle={handleCycle}
        onReplay={handleReplay}
        onStop={dismiss}
        onToggleExpand={() => setExpanded((prev) => !prev)}
        onCopyScript={handleCopyPreviewScript}
      />

      {expanded ? (
        <ManagerQuipCatalogList
          activeId={active?.quip.id ?? null}
          onPlay={handlePlayFromList}
          onStop={dismiss}
        />
      ) : null}
    </figure>
  );
}

interface PreviewControlsProps {
  quip: ManagerQuip | undefined;
  quipIndex: number;
  total: number;
  isPlaying: boolean;
  isExpanded: boolean;
  isCopied: boolean;
  onCycle: (direction: 1 | -1) => void;
  onReplay: () => void;
  onStop: () => void;
  onToggleExpand: () => void;
  onCopyScript: () => void;
}

function PreviewControls({
  quip,
  quipIndex,
  total,
  isPlaying,
  isExpanded,
  isCopied,
  onCycle,
  onReplay,
  onStop,
  onToggleExpand,
  onCopyScript,
}: PreviewControlsProps) {
  const ordinal = useMemo(
    () => `${(quipIndex + 1).toString().padStart(2, "0")} / ${total.toString().padStart(2, "0")}`,
    [quipIndex, total],
  );

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/80 to-aura-bg/55 px-4 py-3 shadow-[0_12px_30px_-22px_rgba(244,63,94,0.22)] backdrop-blur">
      <button
        type="button"
        onClick={() => onCycle(-1)}
        aria-label="Previous quip"
        className="mt-0.5 inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-aura-hairline bg-white/85 text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose"
      >
        <svg
          viewBox="0 0 10 10"
          aria-hidden
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6.5,2 3,5 6.5,8" />
        </svg>
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-tile border border-aura-hairline bg-white/70 px-3 py-2">
        <span className="font-mono text-sm uppercase tracking-[0.2em] text-aura-faint">
          {ordinal} · {quip?.triggerKey ?? "untriggered"}
        </span>
        <span className="break-words font-serif text-base italic leading-snug text-aura-ink">
          {quip?.text ?? ""}
          {quip?.translation ? (
            <span className="not-italic text-aura-muted"> ({quip.translation})</span>
          ) : null}
        </span>
        {quip?.generationScript ? (
          <span className="break-words font-mono text-sm leading-snug tracking-[0.06em] text-aura-faint">
            <span className="text-aura-muted">tts / </span>
            {quip.generationScript}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onCycle(1)}
        aria-label="Next quip"
        className="mt-0.5 inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-aura-hairline bg-white/85 text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose"
      >
        <svg
          viewBox="0 0 10 10"
          aria-hidden
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3.5,2 7,5 3.5,8" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Hide catalog" : "Show all quips"}
        className="mt-0.5 inline-flex cursor-pointer items-center gap-2 rounded-pill border border-aura-hairline bg-white/85 px-3 py-1.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose"
      >
        <ChevronGlyph direction={isExpanded ? "up" : "down"} />
        {isExpanded ? "Hide all" : `Show all ${total}`}
      </button>

      <button
        type="button"
        onClick={onCopyScript}
        disabled={quip?.generationScript === undefined}
        aria-label="Copy current TTS script"
        className="mt-0.5 inline-flex cursor-pointer items-center gap-2 rounded-pill border border-aura-hairline bg-white/85 px-3 py-1.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCopied ? <CheckGlyph /> : <CopyGlyph />}
        {isCopied ? "Copied" : "Copy tts"}
      </button>

      <button
        type="button"
        onClick={isPlaying ? onStop : onReplay}
        className="mt-0.5 inline-flex cursor-pointer items-center gap-2 rounded-pill bg-[linear-gradient(135deg,#0f172a_0%,#1e1b4b_55%,#831843_100%)] px-4 py-1.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_10px_24px_-10px_rgba(244,63,94,0.52)] transition hover:brightness-110"
      >
        {isPlaying ? <StopGlyph /> : <PlayGlyph />}
        {isPlaying ? "Stop" : "Play"}
      </button>
    </div>
  );
}

function ChevronGlyph({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "down" ? (
        <polyline points="2,3.5 5,6.5 8,3.5" />
      ) : (
        <polyline points="2,6.5 5,3.5 8,6.5" />
      )}
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className="size-3" fill="currentColor">
      <polygon points="2.5,1.5 8,5 2.5,8.5" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden className="size-3" fill="currentColor">
      <rect x="2" y="2" width="6" height="6" rx="1" />
    </svg>
  );
}

function quipsForTrigger(triggerKey: ManagerQuipTriggerKey): ManagerQuip[] {
  return MANAGER_QUIP_CATALOG.filter((quip) => quip.triggerKey === triggerKey);
}

export function ManagerQuipLibrary() {
  const { active, play, dismiss } = useQuipPlayback();
  const activeId = active?.quip.id ?? null;

  return (
    <section className="my-6 flex flex-col gap-5">
      <SfxControls />

      <ManagerStage active={active} />

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // catalog · {MANAGER_QUIP_CATALOG.length.toString().padStart(2, "0")} lines across{" "}
          {MANAGER_QUIP_TRIGGER_GROUPS.length} triggers
        </span>
        {active ? (
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-aura-hairline bg-white/85 px-3 py-1 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose"
          >
            Send her offstage
          </button>
        ) : null}
      </div>

      <ManagerQuipCatalogList activeId={activeId} onPlay={play} onStop={dismiss} />
    </section>
  );
}

interface ManagerQuipCatalogListProps {
  activeId: string | null;
  onPlay: (quip: ManagerQuip) => void;
  onStop: () => void;
}

function ManagerQuipCatalogList({ activeId, onPlay, onStop }: ManagerQuipCatalogListProps) {
  return (
    <div className="flex flex-col gap-6">
      {MANAGER_QUIP_TRIGGER_GROUPS.map((group) => {
        const quips = quipsForTrigger(group.key);
        if (quips.length === 0) return null;
        return (
          <TriggerGroupCard
            key={group.key}
            group={group}
            quips={quips}
            activeId={activeId}
            onPlay={onPlay}
            onStop={onStop}
          />
        );
      })}
    </div>
  );
}

interface TriggerGroupCardProps {
  group: ManagerQuipTriggerGroup;
  quips: ManagerQuip[];
  activeId: string | null;
  onPlay: (quip: ManagerQuip) => void;
  onStop: () => void;
}

const CADENCE_TONE: Record<
  ManagerQuipTriggerGroup["cadence"],
  { chip: string; dot: string; label: string }
> = {
  rare: {
    chip: "bg-violet-100 text-violet-700 border-violet-300/55",
    dot: "bg-violet-400",
    label: "rare",
  },
  regular: {
    chip: "bg-rose-100 text-rose-700 border-rose-300/55",
    dot: "bg-aura-rose",
    label: "regular",
  },
  episodic: {
    chip: "bg-amber-100 text-amber-800 border-amber-300/55",
    dot: "bg-amber-400",
    label: "episodic",
  },
};

function TriggerGroupCard({ group, quips, activeId, onPlay, onStop }: TriggerGroupCardProps) {
  const tone = CADENCE_TONE[group.cadence];
  return (
    <article className="flex flex-col gap-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/85 to-aura-bg/45 p-5 shadow-[0_18px_42px_-26px_rgba(244,63,94,0.22)]">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-aura-hairline pb-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lead font-semibold leading-tight text-aura-ink">
              {group.label}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] ${tone.chip}`}
            >
              <span aria-hidden className={`size-1.5 rounded-full ${tone.dot}`} />
              {tone.label}
            </span>
          </div>
          <p className="font-serif text-sm italic leading-snug text-aura-muted">{group.summary}</p>
        </div>
        <code className="rounded-tile border border-aura-hairline bg-white/70 px-2 py-0.5 font-mono text-sm text-aura-ink">
          {group.key}
        </code>
      </header>

      <ul className="flex flex-col gap-2">
        {quips.map((quip) => (
          <QuipRow
            key={quip.id}
            quip={quip}
            isActive={quip.id === activeId}
            onPlay={onPlay}
            onStop={onStop}
          />
        ))}
      </ul>
    </article>
  );
}

interface QuipRowProps {
  quip: ManagerQuip;
  isActive: boolean;
  onPlay: (quip: ManagerQuip) => void;
  onStop: () => void;
}

function QuipRow({ quip, isActive, onPlay, onStop }: QuipRowProps) {
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<number | null>(null);

  const handleCopyScript = useCallback(async () => {
    const script = quip.generationScript;
    if (script === undefined) return;
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      if (copyResetRef.current !== null) {
        window.clearTimeout(copyResetRef.current);
      }
      copyResetRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetRef.current = null;
      }, 1800);
    } catch {
      setCopied(false);
    }
  }, [quip.generationScript]);

  const statusTone =
    quip.status === "recorded"
      ? "bg-emerald-100 text-emerald-700 border-emerald-300/55"
      : "bg-slate-100 text-slate-700 border-slate-300/55";
  const statusDot = quip.status === "recorded" ? "bg-emerald-500" : "bg-slate-400";
  const rowState = isActive
    ? "border-aura-rose/60 bg-gradient-to-br from-rose-50/85 to-white/65 shadow-[0_14px_36px_-22px_rgba(244,63,94,0.45)]"
    : "border-aura-hairline bg-white/72 hover:border-aura-rose/40";
  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] items-start gap-4 rounded-tile border px-4 py-3 transition ${rowState}`}
    >
      <button
        type="button"
        onClick={() => (isActive ? onStop() : onPlay(quip))}
        aria-label={isActive ? `Stop ${quip.id}` : `Play ${quip.id}`}
        className="mt-0.5 inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white shadow-[0_8px_18px_-8px_rgba(244,63,94,0.6)] transition hover:scale-[1.04]"
      >
        {isActive ? (
          <svg viewBox="0 0 10 10" aria-hidden className="size-3.5" fill="currentColor">
            <rect x="3" y="2.5" width="1.5" height="5" rx="0.4" />
            <rect x="5.5" y="2.5" width="1.5" height="5" rx="0.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 10 10" aria-hidden className="size-3.5" fill="currentColor">
            <polygon points="2.8,2 8,5 2.8,8" />
          </svg>
        )}
      </button>

      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="font-serif text-base italic leading-snug text-aura-ink">
          {quip.text}
          {quip.translation ? (
            <span className="not-italic text-aura-muted"> ({quip.translation})</span>
          ) : null}
        </p>
        {quip.generationScript ? (
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 break-words font-mono text-sm leading-snug tracking-[0.06em] text-aura-muted">
              <span className="text-aura-faint">tts / </span>
              {quip.generationScript}
            </p>
            <button
              type="button"
              onClick={handleCopyScript}
              aria-label={`Copy TTS script for ${quip.id}`}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-pill border border-aura-hairline bg-white/85 px-2.5 py-1 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-aura-muted transition hover:border-aura-rose/40 hover:text-aura-rose"
            >
              {copied ? <CheckGlyph /> : <CopyGlyph />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-aura-faint">
          <code className="rounded-tile bg-white/70 px-1.5 py-0.5 text-aura-ink">{quip.id}</code>
          <span aria-hidden>·</span>
          <span className="break-all">{quip.audio}</span>
        </div>
      </div>

      <span
        className={`mt-0.5 inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] ${statusTone}`}
      >
        <span aria-hidden className={`size-1.5 rounded-full ${statusDot}`} />
        {quip.status}
      </span>
    </li>
  );
}

function CopyGlyph() {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="5.5" height="5.5" rx="1" />
      <path d="M2 6.5 V2 a0.6 0.6 0 0 1 0.6 -0.6 H6.5" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="2,5.5 4.2,7.5 8,3" />
    </svg>
  );
}
