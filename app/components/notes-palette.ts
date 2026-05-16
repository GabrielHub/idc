import type { MemoryRecord } from "../domain/game";
import { isPairClosureMemory } from "../services/closures";

export type NoteScopeKey = "pair" | "date" | "scenario" | "closure";

export type ScopePalette = {
  label: string;
  ribbon: string;
  rail: string;
  watermark: string;
  glyphRing: string;
  glyphFill: string;
  caseDot: string;
};

export const NOTE_SCOPE_PALETTE: Record<NoteScopeKey, ScopePalette> = {
  pair: {
    label: "PAIR FILE",
    ribbon: "bg-aura-rose/95 text-white",
    rail: "bg-aura-rose",
    watermark: "text-aura-rose",
    glyphRing: "ring-aura-rose/35",
    glyphFill: "from-rose-100 via-aura-paper to-fuchsia-50",
    caseDot: "bg-aura-rose",
  },
  date: {
    label: "DATE FILE",
    ribbon: "bg-aura-fuchsia/95 text-white",
    rail: "bg-aura-fuchsia",
    watermark: "text-aura-fuchsia",
    glyphRing: "ring-aura-fuchsia/35",
    glyphFill: "from-fuchsia-100 via-aura-paper to-violet-50",
    caseDot: "bg-aura-fuchsia",
  },
  scenario: {
    label: "SCENARIO FILE",
    ribbon: "bg-aura-amber/95 text-white",
    rail: "bg-aura-amber",
    watermark: "text-aura-amber",
    glyphRing: "ring-aura-amber/40",
    glyphFill: "from-amber-100 via-aura-paper to-rose-50",
    caseDot: "bg-aura-amber",
  },
  closure: {
    label: "CASE CLOSED",
    ribbon: "bg-aura-ink text-white",
    rail: "bg-gradient-to-b from-aura-rose via-aura-fuchsia to-aura-amber",
    watermark: "text-aura-rose",
    glyphRing: "ring-aura-rose/50",
    glyphFill: "from-aura-cream via-rose-50 to-fuchsia-100",
    caseDot: "bg-aura-ink",
  },
};

export function paletteForMemory(memory: MemoryRecord): ScopePalette {
  if (isPairClosureMemory(memory)) {
    return NOTE_SCOPE_PALETTE.closure;
  }
  return paletteForScope(memory.scope);
}

export function paletteForScope(scope: MemoryRecord["scope"]): ScopePalette {
  if (scope === "pair" || scope === "date" || scope === "scenario") {
    return NOTE_SCOPE_PALETTE[scope];
  }
  return NOTE_SCOPE_PALETTE.pair;
}
