import type { Member } from "../domain/game";

type MemberId = Member["id"];

/**
 * Per-member ambient aura, used behind the standee on focused cards and inside
 * the member modal. Categorized by species/dimension so members read at a
 * glance: mundane Earth humans get soft godrays, eldritch get floating runes,
 * tech-displaced get pixel rain, etc. Tints carry the per-member personality.
 */

export type MemberAuraKind =
  | "godray"
  | "ectoplasm"
  | "fieldmote"
  | "rune"
  | "petal"
  | "pulse"
  | "pixelrain"
  | "ember"
  | "prism";

export type MemberAuraTint = {
  primary: string;
  glow: string;
};

export type MemberAuraConfig = {
  kind: MemberAuraKind;
  tint: MemberAuraTint;
};

const REGISTRY: Record<MemberId, MemberAuraConfig> = {
  "jenna-pike": {
    kind: "godray",
    tint: { primary: "rgba(255, 224, 168, 0.55)", glow: "rgba(255, 220, 160, 0.35)" },
  },
  "brady-strait": {
    kind: "godray",
    tint: { primary: "rgba(248, 232, 200, 0.5)", glow: "rgba(245, 225, 188, 0.3)" },
  },
  "kade-sumner": {
    kind: "godray",
    tint: { primary: "rgba(255, 232, 188, 0.55)", glow: "rgba(255, 220, 168, 0.32)" },
  },
  "marcus-pellish": {
    kind: "godray",
    tint: { primary: "rgba(245, 228, 196, 0.5)", glow: "rgba(238, 220, 180, 0.3)" },
  },
  "sana-karim": {
    kind: "godray",
    tint: { primary: "rgba(255, 235, 200, 0.55)", glow: "rgba(252, 225, 188, 0.32)" },
  },
  "tasha-rell": {
    kind: "godray",
    tint: { primary: "rgba(255, 228, 184, 0.55)", glow: "rgba(252, 218, 170, 0.32)" },
  },
  "toby-wenz": {
    kind: "godray",
    tint: { primary: "rgba(248, 230, 200, 0.5)", glow: "rgba(242, 222, 188, 0.3)" },
  },
  "mira-park": {
    kind: "godray",
    tint: { primary: "rgba(255, 232, 196, 0.55)", glow: "rgba(252, 224, 184, 0.32)" },
  },
  "mei-sato": {
    kind: "godray",
    tint: { primary: "rgba(255, 226, 188, 0.55)", glow: "rgba(252, 218, 174, 0.32)" },
  },
  "gabriel-tan": {
    kind: "godray",
    tint: { primary: "rgba(232, 218, 190, 0.5)", glow: "rgba(220, 206, 178, 0.3)" },
  },
  "noah-kim": {
    kind: "godray",
    tint: { primary: "rgba(248, 220, 172, 0.55)", glow: "rgba(238, 204, 156, 0.34)" },
  },
  "derek-halsey": {
    kind: "godray",
    tint: { primary: "rgba(228, 212, 174, 0.52)", glow: "rgba(212, 196, 156, 0.32)" },
  },
  "ryan-doyle": {
    kind: "godray",
    tint: { primary: "rgba(252, 218, 152, 0.58)", glow: "rgba(238, 196, 120, 0.36)" },
  },
  "alex-yoon": {
    kind: "godray",
    tint: { primary: "rgba(244, 184, 96, 0.6)", glow: "rgba(220, 156, 68, 0.4)" },
  },

  "gideon-glass": {
    kind: "ectoplasm",
    tint: { primary: "rgba(180, 220, 240, 0.65)", glow: "rgba(140, 200, 230, 0.45)" },
  },
  "opal-sunday": {
    kind: "ectoplasm",
    tint: { primary: "rgba(232, 210, 175, 0.6)", glow: "rgba(212, 188, 150, 0.42)" },
  },

  "calvin-hewes": {
    kind: "fieldmote",
    tint: { primary: "rgba(160, 188, 142, 0.6)", glow: "rgba(124, 156, 110, 0.4)" },
  },
  "mr-whiskers": {
    kind: "fieldmote",
    tint: { primary: "rgba(220, 188, 140, 0.6)", glow: "rgba(196, 162, 116, 0.4)" },
  },

  vhool: {
    kind: "rune",
    tint: { primary: "rgba(168, 130, 220, 0.85)", glow: "rgba(140, 96, 200, 0.55)" },
  },
  cthala: {
    kind: "rune",
    tint: { primary: "rgba(132, 150, 220, 0.85)", glow: "rgba(108, 124, 200, 0.55)" },
  },
  maeve: {
    kind: "rune",
    tint: { primary: "rgba(176, 66, 82, 0.82)", glow: "rgba(196, 154, 92, 0.55)" },
  },

  "aldric-vale-marsh": {
    kind: "petal",
    tint: { primary: "rgba(232, 130, 152, 0.85)", glow: "rgba(216, 100, 124, 0.5)" },
  },
  "eleanor-ash": {
    kind: "petal",
    tint: { primary: "rgba(248, 240, 248, 0.9)", glow: "rgba(220, 208, 232, 0.55)" },
  },
  "bai-wenshu": {
    kind: "petal",
    tint: { primary: "rgba(244, 114, 182, 0.95)", glow: "rgba(190, 24, 93, 0.65)" },
  },

  "cassie-conners": {
    kind: "pulse",
    tint: { primary: "rgba(252, 212, 124, 0.55)", glow: "rgba(248, 188, 84, 0.55)" },
  },
  "cha-yusung": {
    kind: "pulse",
    tint: { primary: "rgba(56, 44, 96, 0.6)", glow: "rgba(72, 56, 128, 0.55)" },
  },
  venus: {
    kind: "pulse",
    tint: { primary: "rgba(255, 224, 188, 0.55)", glow: "rgba(248, 196, 144, 0.55)" },
  },
  "decimus-marius-tullio": {
    kind: "pulse",
    tint: { primary: "rgba(180, 36, 48, 0.55)", glow: "rgba(150, 24, 36, 0.55)" },
  },

  epsy: {
    kind: "pixelrain",
    tint: { primary: "rgba(120, 232, 248, 0.85)", glow: "rgba(216, 96, 232, 0.55)" },
  },
  "sera-vohn": {
    kind: "pixelrain",
    tint: { primary: "rgba(248, 88, 196, 0.85)", glow: "rgba(232, 60, 168, 0.55)" },
  },
  reaver: {
    kind: "pixelrain",
    tint: { primary: "rgba(232, 124, 56, 0.8)", glow: "rgba(196, 84, 32, 0.55)" },
  },
  "meridian-vale": {
    kind: "pixelrain",
    tint: { primary: "rgba(176, 196, 220, 0.75)", glow: "rgba(132, 156, 188, 0.5)" },
  },

  "idris-mahari": {
    kind: "ember",
    tint: { primary: "rgba(220, 168, 124, 0.7)", glow: "rgba(180, 124, 88, 0.5)" },
  },
  anansi: {
    kind: "ember",
    tint: { primary: "rgba(252, 186, 84, 0.7)", glow: "rgba(196, 124, 56, 0.55)" },
  },
  "nawal-marrash": {
    kind: "ember",
    tint: { primary: "rgba(208, 172, 124, 0.6)", glow: "rgba(164, 124, 76, 0.45)" },
  },

  "naia-velorae": {
    kind: "prism",
    tint: { primary: "rgba(168, 232, 220, 0.6)", glow: "rgba(180, 196, 248, 0.55)" },
  },

  "imani-wallace": {
    kind: "petal",
    tint: { primary: "rgba(248, 156, 196, 0.75)", glow: "rgba(168, 132, 220, 0.5)" },
  },

  "sienna-bae": {
    kind: "pulse",
    tint: { primary: "rgba(244, 114, 182, 0.65)", glow: "rgba(216, 96, 232, 0.5)" },
  },
};

export function getMemberAuraConfig(id: MemberId): MemberAuraConfig | undefined {
  return REGISTRY[id];
}

const LIGHT_AURA_KINDS: ReadonlySet<MemberAuraKind> = new Set(["pulse", "prism"]);

export function isLightAuraKind(kind: MemberAuraKind): boolean {
  return LIGHT_AURA_KINDS.has(kind);
}
