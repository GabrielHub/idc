import type { CSSProperties } from "react";

import type { Member } from "../domain/game";
import { hashSeedUint32 } from "../services/utils";
import { PRECOMPUTED_PORTRAIT_PALETTES } from "./portrait-palettes.generated";

/**
 * Per-character gradient derived from the approved neutral full-body cutout.
 * Generated offline by the portrait asset pipeline so roster pages do not run
 * browser image decoding or canvas sampling for card tint.
 */
export type PortraitPalette = {
  from: string;
  via: string;
  to: string;
  accent: string;
};

const FALLBACK_PALETTE: PortraitPalette = {
  from: "rgb(254, 226, 232)",
  via: "rgb(252, 232, 248)",
  to: "rgb(236, 232, 255)",
  accent: "rgb(244, 114, 182)",
};

const FALLBACK_VARIANTS: readonly PortraitPalette[] = [
  {
    from: "rgb(254, 226, 232)",
    via: "rgb(252, 232, 248)",
    to: "rgb(236, 232, 255)",
    accent: "rgb(244, 114, 182)",
  },
  {
    from: "rgb(255, 240, 217)",
    via: "rgb(254, 226, 232)",
    to: "rgb(252, 232, 248)",
    accent: "rgb(251, 146, 60)",
  },
  {
    from: "rgb(224, 240, 255)",
    via: "rgb(236, 232, 255)",
    to: "rgb(254, 226, 232)",
    accent: "rgb(96, 165, 250)",
  },
  {
    from: "rgb(220, 246, 232)",
    via: "rgb(224, 240, 255)",
    to: "rgb(236, 232, 255)",
    accent: "rgb(52, 211, 153)",
  },
  {
    from: "rgb(236, 232, 255)",
    via: "rgb(252, 232, 248)",
    to: "rgb(255, 240, 217)",
    accent: "rgb(168, 85, 247)",
  },
  {
    from: "rgb(252, 232, 248)",
    via: "rgb(254, 226, 232)",
    to: "rgb(224, 240, 255)",
    accent: "rgb(217, 70, 239)",
  },
];

function fallbackFor(seed: string): PortraitPalette {
  const variants = FALLBACK_VARIANTS;
  return variants[hashSeedUint32(`palette:${seed}`) % variants.length] ?? FALLBACK_PALETTE;
}

type PaletteCssVarName =
  | "--char-from"
  | "--char-via"
  | "--char-to"
  | "--char-accent"
  | "--char-from-wash"
  | "--char-via-wash"
  | "--char-to-wash"
  | "--char-accent-wash"
  | "--char-accent-glow";

type PortraitPaletteCssVars = CSSProperties & Record<PaletteCssVarName, string>;

export function paletteToCssVars(palette: PortraitPalette): CSSProperties {
  const vars: PortraitPaletteCssVars = {
    "--char-from": palette.from,
    "--char-via": palette.via,
    "--char-to": palette.to,
    "--char-accent": palette.accent,
    "--char-from-wash": rgbCssWithAlpha(palette.from, 0.5),
    "--char-via-wash": rgbCssWithAlpha(palette.via, 0.46),
    "--char-to-wash": rgbCssWithAlpha(palette.to, 0.5),
    "--char-accent-wash": rgbCssWithAlpha(palette.accent, 0.38),
    "--char-accent-glow": rgbCssWithAlpha(palette.accent, 0.5),
  };
  return vars;
}

export function resolvePortraitPalette(member: Pick<Member, "id">): PortraitPalette {
  return PRECOMPUTED_PORTRAIT_PALETTES[member.id] ?? fallbackFor(member.id);
}

function rgbCssWithAlpha(rgb: string, alpha: number): string {
  const channels = rgb.match(/\d+/g)?.slice(0, 3);
  if (channels === undefined || channels.length !== 3) {
    return rgb;
  }
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
}
