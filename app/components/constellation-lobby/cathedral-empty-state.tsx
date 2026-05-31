import type { CathedralMode } from "./cathedral-types";

export function CathedralEmptyState({ mode }: { mode: CathedralMode }) {
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
