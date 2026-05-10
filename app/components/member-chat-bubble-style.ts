import type { CSSProperties } from "react";

import type {
  MemberChatBubbleAnimation,
  MemberChatBubbleBackground,
  MemberChatBubbleBorder,
  MemberChatBubbleFontFamily,
  MemberChatBubbleShape,
  MemberChatBubbleStyle,
  MemberChatBubbleTail,
  MemberChatBubbleTextColor,
  MemberChatBubbleTextEffect,
  MemberChatBubbleTexture,
} from "../domain/game";

export interface ResolvedMemberChatBubble {
  className: string;
  style: CSSProperties;
  accentStyle: CSSProperties;
  caretClass: string;
}

type MemberBubbleCssVariables = CSSProperties & {
  "--member-bubble-accent"?: string;
  "--member-bubble-glow"?: string;
  "--member-bubble-tail-color"?: string;
};

const SHAPE_CLASS: Record<MemberChatBubbleShape, string> = {
  soft: "member-bubble-shape-soft",
  pill: "member-bubble-shape-pill",
  sharp: "member-bubble-shape-sharp",
  torn: "member-bubble-shape-torn",
  papercut: "member-bubble-shape-papercut",
  scroll: "member-bubble-shape-scroll",
};

const TAIL_CLASS: Record<MemberChatBubbleTail, string> = {
  rounded: "member-bubble-tail-rounded",
  sharp: "member-bubble-tail-sharp",
  fanged: "member-bubble-tail-fanged",
  papercut: "member-bubble-tail-papercut",
  none: "member-bubble-tail-none",
};

const BORDER_CLASS: Record<MemberChatBubbleBorder, string> = {
  none: "member-bubble-border-none",
  hairline: "member-bubble-border-hairline",
  glow: "member-bubble-border-glow",
  filigree: "member-bubble-border-filigree",
  crackling: "member-bubble-border-crackling",
};

const TEXT_COLOR_CLASS: Record<MemberChatBubbleTextColor, string> = {
  light: "member-bubble-text-light",
  dark: "member-bubble-text-dark",
  "muted-light": "member-bubble-text-muted-light",
  "muted-dark": "member-bubble-text-muted-dark",
};

const TEXTURE_CLASS: Record<MemberChatBubbleTexture, string> = {
  parchment: "member-bubble-texture-parchment",
  glass: "member-bubble-texture-glass",
  ooze: "member-bubble-texture-ooze",
  holographic: "member-bubble-texture-holographic",
  noise: "member-bubble-texture-noise",
};

const ANIMATION_CLASS: Record<MemberChatBubbleAnimation, string> = {
  fade: "member-bubble-anim-fade",
  drift: "member-bubble-anim-drift",
  drip: "member-bubble-anim-drip",
  snap: "member-bubble-anim-snap",
  settle: "member-bubble-anim-settle",
};

const FONT_CLASS: Record<MemberChatBubbleFontFamily, string> = {
  serif: "member-bubble-font-serif",
  display: "member-bubble-font-display",
  mono: "member-bubble-font-mono",
};

const TEXT_EFFECT_CLASS: Record<MemberChatBubbleTextEffect, string> = {
  shadow: "member-bubble-effect-shadow",
  glow: "member-bubble-effect-glow",
  tight: "member-bubble-effect-tight",
  loose: "member-bubble-effect-loose",
};

const GLOW_INTENSITY_CLASS = {
  soft: "member-bubble-glow-soft",
  medium: "member-bubble-glow-medium",
  strong: "member-bubble-glow-strong",
} as const;

function resolveBackground(bg: MemberChatBubbleBackground): MemberBubbleCssVariables {
  if (bg.kind === "solid") {
    return {
      backgroundColor: bg.color,
      backgroundImage: "none",
      "--member-bubble-tail-color": bg.color,
    };
  }
  const gradient = `linear-gradient(${bg.angle}deg, ${bg.stops.join(", ")})`;
  const lastStop = bg.stops[bg.stops.length - 1] ?? bg.stops[0];
  return {
    backgroundImage: gradient,
    "--member-bubble-tail-color": lastStop,
  };
}

function resolveAccentColor(bubble: MemberChatBubbleStyle): string {
  if (bubble.accentColor) return bubble.accentColor;
  if (bubble.glow) return bubble.glow.color;
  if (bubble.background.kind === "solid") return bubble.background.color;
  return bubble.background.stops[0];
}

export function resolveMemberChatBubbleStyle(
  bubble: MemberChatBubbleStyle,
): ResolvedMemberChatBubble {
  const classes: string[] = [
    "member-bubble",
    SHAPE_CLASS[bubble.shape],
    TAIL_CLASS[bubble.tail ?? "rounded"],
    BORDER_CLASS[bubble.border ?? "none"],
    TEXT_COLOR_CLASS[bubble.textColor],
  ];

  if (bubble.glow) {
    classes.push(GLOW_INTENSITY_CLASS[bubble.glow.intensity]);
  }
  if (bubble.texture) {
    classes.push(TEXTURE_CLASS[bubble.texture]);
  }
  if (bubble.entryAnimation) {
    classes.push(ANIMATION_CLASS[bubble.entryAnimation]);
  }
  if (bubble.fontFamily) {
    classes.push(FONT_CLASS[bubble.fontFamily]);
  }
  if (bubble.textEffect) {
    classes.push(TEXT_EFFECT_CLASS[bubble.textEffect]);
  }

  const baseStyle = resolveBackground(bubble.background);
  const accentColor = resolveAccentColor(bubble);
  const accentStyle: MemberBubbleCssVariables = { "--member-bubble-accent": accentColor };
  const style: MemberBubbleCssVariables = bubble.glow
    ? { ...baseStyle, ...accentStyle, "--member-bubble-glow": bubble.glow.color }
    : { ...baseStyle, ...accentStyle };

  return {
    className: classes.join(" "),
    style,
    accentStyle,
    caretClass: "bg-[var(--member-bubble-accent)]",
  };
}
