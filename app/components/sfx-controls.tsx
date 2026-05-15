import { useEffect, useRef, type ChangeEvent } from "react";

import { useSfx } from "./sfx-provider";

export type SfxControlsVariant = "menu" | "panel";

export function SfxControls({
  variant = "panel",
  className = "",
}: {
  variant?: SfxControlsVariant;
  className?: string;
}) {
  const { isEnabled, setEnabled, volume, setVolume, play } = useSfx();
  const volumeRef = useRef(volume);
  const isEnabledRef = useRef(isEnabled);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  function handleToggleSfx() {
    setEnabled(!isEnabledRef.current);
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value) / 100;
    volumeRef.current = next;
    setVolume(next);

    if (next > 0 && !isEnabledRef.current) {
      isEnabledRef.current = true;
      setEnabled(true);
    }
  }

  function handleVolumeRelease() {
    if (isEnabledRef.current && volumeRef.current > 0) {
      play("click");
    }
  }

  const volumePercent = Math.round(volume * 100);
  const volumeClass =
    "block h-1 w-full cursor-pointer appearance-none rounded-pill bg-aura-hairline-strong accent-aura-rose transition-opacity";

  if (variant === "menu") {
    return (
      <div className={className}>
        <div className="px-3 pb-2 pt-2.5">
          <div className="flex items-center justify-between font-mono text-sm font-semibold uppercase tracking-[0.22em] text-aura-muted">
            <span>Volume</span>
            <span className="tabular-nums text-aura-ink">{volumePercent}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volumePercent}
            onChange={handleVolumeChange}
            onPointerUp={handleVolumeRelease}
            onKeyUp={handleVolumeRelease}
            aria-label="Volume"
            data-sfx="none"
            className={`mt-2 ${volumeClass} ${isEnabled ? "opacity-100" : "opacity-50"}`}
          />
        </div>
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={isEnabled}
          data-sfx="toggle"
          onClick={handleToggleSfx}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-chip px-3 py-2 text-left font-mono text-sm font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
        >
          <span>{isEnabled ? "Mute" : "Unmute"}</span>
          <span className={isEnabled ? "text-aura-rose" : "text-aura-faint"}>
            {isEnabled ? "on" : "off"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-card border border-aura-hairline bg-white/72 px-4 py-3 shadow-[0_12px_30px_-24px_rgba(244,63,94,0.24)] ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[14rem] flex-1">
          <div className="flex items-center justify-between gap-3 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-aura-muted">
            <span>Audio preview</span>
            <span className="tabular-nums text-aura-ink">{volumePercent}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volumePercent}
            onChange={handleVolumeChange}
            onPointerUp={handleVolumeRelease}
            onKeyUp={handleVolumeRelease}
            aria-label="Audio preview volume"
            data-sfx="none"
            className={`mt-2 ${volumeClass} ${isEnabled ? "opacity-100" : "opacity-50"}`}
          />
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          data-sfx="toggle"
          onClick={handleToggleSfx}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-pill border px-3 py-1.5 font-mono text-sm font-semibold uppercase tracking-[0.22em] transition ${
            isEnabled
              ? "border-aura-rose/35 bg-aura-rose/10 text-aura-rose"
              : "border-aura-hairline bg-white/80 text-aura-muted hover:border-aura-rose/40 hover:text-aura-rose"
          }`}
        >
          <span
            aria-hidden
            className={`size-2 rounded-full ${isEnabled ? "bg-aura-rose" : "bg-aura-faint"}`}
          />
          {isEnabled ? "Mute" : "Unmute"}
        </button>
      </div>
    </div>
  );
}
