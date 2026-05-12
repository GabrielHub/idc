import { useReducedMotion } from "motion/react";
import { type CSSProperties, useMemo } from "react";

import type { Member } from "../domain/game";
import {
  getMemberAuraConfig,
  isLightAuraKind,
  type MemberAuraConfig,
  type MemberAuraTint,
} from "./member-aura-registry";
import { hashSeedUint32, mulberry32 } from "../services/utils";

export type MemberAuraDensity = "card" | "modal";
export type MemberAuraSlot = "back" | "front";
export type MemberAuraMode = "all" | "broad" | "anchored";

type AuraVars = CSSProperties & {
  "--member-aura-opacity"?: string;
  "--member-aura-drift"?: string;
  "--member-aura-drift-x"?: string;
  "--member-aura-drift-y"?: string;
};

type Particle = { id: number; style: AuraVars; inFront: boolean };
type RuneParticle = Particle & { glyph: string };

const RUNE_GLYPHS = ["ᚠ", "ᚱ", "ᚷ", "ᛁ", "ᛒ", "ᛝ", "ᛦ"] as const;

export function MemberAuraLayer({
  member,
  density = "card",
  slot,
  mode = "all",
}: {
  member: Member;
  density?: MemberAuraDensity;
  slot: MemberAuraSlot;
  mode?: MemberAuraMode;
}) {
  const reducedMotion = useReducedMotion();
  const config = getMemberAuraConfig(member.id);

  if (reducedMotion === true || config === undefined) return null;

  const isLight = isLightAuraKind(config.kind);
  if (mode === "broad" && isLight) return null;
  if (mode === "anchored" && !isLight) return null;

  const seed = member.id;
  const props: LayerProps = { tint: config.tint, density, seed, slot };

  switch (config.kind) {
    case "godray":
      return <GodrayLayer {...props} />;
    case "ectoplasm":
      return <EctoplasmLayer {...props} />;
    case "fieldmote":
      return <FieldmoteLayer {...props} />;
    case "rune":
      return <RuneLayer {...props} />;
    case "petal":
      return <PetalLayer {...props} />;
    case "pulse":
      return <PulseLayer {...props} />;
    case "pixelrain":
      return <PixelRainLayer {...props} />;
    case "ember":
      return <EmberLayer {...props} />;
    case "prism":
      return <PrismLayer {...props} />;
  }
}

type LayerProps = {
  tint: MemberAuraTint;
  density: MemberAuraDensity;
  seed: string;
  slot: MemberAuraSlot;
};

function FrameRoot({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [contain:paint] [container-type:size]"
    >
      {children}
    </div>
  );
}

function makeRandom(seed: string, salt: number): () => number {
  return mulberry32(hashSeedUint32(seed) + salt);
}

function pickInFront(random: () => number, frontShare: number): boolean {
  return random() < frontShare;
}

function filterBySlot<T extends { inFront: boolean }>(
  particles: readonly T[],
  slot: MemberAuraSlot,
): T[] {
  if (slot === "front") return particles.filter((p) => p.inFront);
  return particles.filter((p) => !p.inFront);
}

function GodrayLayer({ tint, density, seed, slot }: LayerProps) {
  const count = density === "modal" ? 7 : 5;
  const shafts = useMemo(() => {
    const random = makeRandom(seed, 0x6041a);
    return Array.from({ length: count }, (_, index): Particle => {
      const left = 2 + random() * 90;
      const angle = 6 + random() * 18;
      const width = 24 + random() * 22;
      const opacity = 0.55 + random() * 0.35;
      const duration = 6 + random() * 5;
      const delay = -random() * duration;
      const inFront = pickInFront(random, 0.15);
      const style: AuraVars = {
        position: "absolute",
        top: "-30%",
        left: `${left}%`,
        width: `${width}%`,
        height: "160%",
        background: `linear-gradient(180deg, transparent 0%, ${tint.primary} 38%, ${tint.primary} 62%, transparent 100%)`,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "top center",
        filter: "blur(10px)",
        mixBlendMode: "screen",
        animation: `member-aura-godray ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        "--member-aura-opacity": opacity.toString(),
      };
      return { id: index, style, inFront };
    });
  }, [count, seed, tint.primary]);

  const visible = filterBySlot(shafts, slot);
  if (visible.length === 0) return null;

  return (
    <FrameRoot>
      {visible.map((shaft) => (
        <span key={shaft.id} style={shaft.style} />
      ))}
    </FrameRoot>
  );
}

function EctoplasmLayer({ tint, density, seed, slot }: LayerProps) {
  const count = density === "modal" ? 16 : 9;
  const wisps = useMemo(() => buildDriftWisps(seed, count, tint, 0x9afe), [count, seed, tint]);
  const visible = filterBySlot(wisps, slot);
  if (visible.length === 0) return null;

  return (
    <FrameRoot>
      {visible.map((wisp) => (
        <span key={wisp.id} style={wisp.style} />
      ))}
    </FrameRoot>
  );
}

function buildDriftWisps(
  seed: string,
  count: number,
  tint: MemberAuraTint,
  salt: number,
): Particle[] {
  const random = makeRandom(seed, salt);
  return Array.from({ length: count }, (_, index): Particle => {
    const size = 8 + random() * 16;
    const top = random() * 90;
    const left = random() * 92;
    const driftX = (random() - 0.5) * 22;
    const driftY = -12 - random() * 26;
    const opacity = 0.4 + random() * 0.45;
    const duration = 9 + random() * 9;
    const delay = -random() * duration;
    const inFront = pickInFront(random, 0.3);
    const style: AuraVars = {
      position: "absolute",
      top: `${top}%`,
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "9999px",
      background: `radial-gradient(circle, ${tint.primary} 0%, ${tint.glow} 55%, transparent 80%)`,
      filter: "blur(3px)",
      animation: `member-aura-ectoplasm ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      "--member-aura-opacity": opacity.toString(),
      "--member-aura-drift-x": `${driftX}cqw`,
      "--member-aura-drift-y": `${driftY}cqh`,
    };
    return { id: index, style, inFront };
  });
}

function FieldmoteLayer({ tint, density, seed, slot }: LayerProps) {
  const count = density === "modal" ? 26 : 14;
  const motes = useMemo(() => {
    const random = makeRandom(seed, 0x4cab);
    return Array.from({ length: count }, (_, index): Particle => {
      const size = 3 + random() * 5;
      const left = random() * 96;
      const driftX = (random() - 0.5) * 10;
      const opacity = 0.65 + random() * 0.3;
      const duration = 12 + random() * 9;
      const delay = -random() * duration;
      const inFront = pickInFront(random, 0.35);
      const style: AuraVars = {
        position: "absolute",
        bottom: 0,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "9999px",
        background: tint.primary,
        boxShadow: `0 0 ${size * 3}px ${tint.glow}`,
        animation: `member-aura-fieldmote ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        "--member-aura-opacity": opacity.toString(),
        "--member-aura-drift": `${driftX}cqw`,
      };
      return { id: index, style, inFront };
    });
  }, [count, seed, tint]);

  const visible = filterBySlot(motes, slot);
  if (visible.length === 0) return null;

  return (
    <FrameRoot>
      {visible.map((mote) => (
        <span key={mote.id} style={mote.style} />
      ))}
    </FrameRoot>
  );
}

function RuneLayer({ tint, density, seed, slot }: LayerProps) {
  const count = density === "modal" ? 14 : 8;
  const glyphs = useMemo<RuneParticle[]>(() => {
    const random = makeRandom(seed, 0x7eda);
    return Array.from({ length: count }, (_, index): RuneParticle => {
      const size = 11 + random() * 14;
      const left = random() * 92;
      const top = 12 + random() * 78;
      const driftY = -22 - random() * 32;
      const rotate = (random() - 0.5) * 80;
      const opacity = 0.7 + random() * 0.3;
      const duration = 9 + random() * 7;
      const delay = -random() * duration;
      const glyph = RUNE_GLYPHS[Math.floor(random() * RUNE_GLYPHS.length)] ?? "ᚠ";
      const inFront = pickInFront(random, 0.3);
      const style: AuraVars = {
        position: "absolute",
        top: `${top}%`,
        left: `${left}%`,
        fontSize: `${size}px`,
        lineHeight: 1,
        color: tint.primary,
        textShadow: `0 0 10px ${tint.glow}, 0 0 20px ${tint.glow}`,
        animation: `member-aura-rune ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        "--member-aura-opacity": opacity.toString(),
        "--member-aura-drift-y": `${driftY}cqh`,
        "--member-aura-drift": `${rotate}deg`,
      };
      return { id: index, style, inFront, glyph };
    });
  }, [count, seed, tint]);

  const visible = filterBySlot(glyphs, slot);
  if (visible.length === 0) return null;

  return (
    <FrameRoot>
      {visible.map((rune) => (
        <span key={rune.id} style={rune.style}>
          {rune.glyph}
        </span>
      ))}
    </FrameRoot>
  );
}

const PETAL_PATH = "M12 2 C 19 6 22 13 19 21 C 16 27 11 28 6 24 C 1 19 4 9 12 2 Z";

function PetalLayer({ tint, density, seed, slot }: LayerProps) {
  const count = density === "modal" ? 24 : 13;
  const petals = useMemo(() => {
    const random = makeRandom(seed, 0x5e1a);
    return Array.from({ length: count }, (_, index): Particle => {
      const size = 8 + random() * 9;
      const left = random() * 95;
      const driftX = (random() - 0.5) * 28;
      const startRotate = random() * 360;
      const spin = 320 + random() * 360;
      const opacity = 0.7 + random() * 0.3;
      const duration = 8 + random() * 7;
      const delay = -random() * duration;
      const inFront = pickInFront(random, 0.35);
      const style: AuraVars = {
        position: "absolute",
        top: "-12%",
        left: `${left}%`,
        width: `${size}px`,
        height: `${size * 1.2}px`,
        transform: `rotate(${startRotate}deg)`,
        animation: `member-aura-petal ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        "--member-aura-opacity": opacity.toString(),
        "--member-aura-drift": `${driftX}cqw`,
        "--member-aura-drift-y": `${spin + startRotate}deg`,
      };
      return { id: index, style, inFront };
    });
  }, [count, seed]);

  const visible = filterBySlot(petals, slot);
  if (visible.length === 0) return null;

  return (
    <FrameRoot>
      {visible.map((petal) => (
        <svg
          key={petal.id}
          viewBox="0 0 24 28"
          style={petal.style}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <radialGradient id={`petal-grad-${seed}-${petal.id}`} cx="55%" cy="40%" r="65%">
              <stop offset="0%" stopColor={tint.primary} stopOpacity="1" />
              <stop offset="65%" stopColor={tint.glow} stopOpacity="0.95" />
              <stop offset="100%" stopColor={tint.glow} stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d={PETAL_PATH}
            fill={`url(#petal-grad-${seed}-${petal.id})`}
            stroke={tint.primary}
            strokeOpacity="0.45"
            strokeWidth="0.6"
          />
        </svg>
      ))}
    </FrameRoot>
  );
}

function PulseLayer({ tint, slot }: LayerProps) {
  if (slot !== "back") return null;

  const baseStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: `radial-gradient(circle at 50% 60%, ${tint.glow} 0%, ${tint.primary} 28%, transparent 60%)`,
    mixBlendMode: "screen",
    filter: "blur(22px)",
    transformOrigin: "50% 60%",
    willChange: "transform, opacity",
  };

  return (
    <FrameRoot>
      <div
        aria-hidden
        style={{
          ...baseStyle,
          animation: "member-aura-pulse-breathe 5.5s ease-out infinite",
        }}
      />
      <div
        aria-hidden
        style={{
          ...baseStyle,
          animation: "member-aura-pulse-breathe 5.5s ease-out infinite",
          animationDelay: "-2.75s",
        }}
      />
    </FrameRoot>
  );
}

function PixelRainLayer({ tint, density, seed, slot }: LayerProps) {
  const count = density === "modal" ? 34 : 20;
  const stars = useMemo(() => {
    const random = makeRandom(seed, 0xa120);
    return Array.from({ length: count }, (_, index): Particle => {
      const size = 1.5 + random() * 3;
      const top = 4 + random() * 92;
      const left = 2 + random() * 96;
      const opacity = 0.55 + random() * 0.4;
      const duration = 4.5 + random() * 5.5;
      const delay = -random() * duration;
      const useGlow = random() > 0.5;
      const color = useGlow ? tint.glow : tint.primary;
      const inFront = pickInFront(random, 0.45);
      const style: AuraVars = {
        position: "absolute",
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "9999px",
        background: color,
        boxShadow: `0 0 ${size * 4}px ${color}, 0 0 ${size * 9}px ${color}`,
        animation: `member-aura-pixelrain ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        "--member-aura-opacity": opacity.toString(),
      };
      return { id: index, style, inFront };
    });
  }, [count, seed, tint]);

  const visible = filterBySlot(stars, slot);
  if (visible.length === 0) return null;

  return (
    <FrameRoot>
      {visible.map((star) => (
        <span key={star.id} style={star.style} />
      ))}
    </FrameRoot>
  );
}

const EMBER_FLAME_PATH =
  "M12 1 C 8.5 6.5 5.5 11 5.5 18 C 5.5 26 8 32 12 32 C 16 32 18.5 26 18.5 18 C 18.5 11 15.5 6.5 12 1 Z";

function EmberLayer({ tint, density, seed, slot }: LayerProps) {
  const count = density === "modal" ? 18 : 10;
  const embers = useMemo(() => {
    const random = makeRandom(seed, 0xe11b);
    return Array.from({ length: count }, (_, index): Particle => {
      const size = 5 + random() * 7;
      const left = random() * 96;
      const driftX = (random() - 0.5) * 14;
      const opacity = 0.7 + random() * 0.3;
      const duration = 5 + random() * 6;
      const delay = -random() * duration;
      const inFront = pickInFront(random, 0.4);
      const style: AuraVars = {
        position: "absolute",
        bottom: "-2%",
        left: `${left}%`,
        width: `${size}px`,
        height: `${size * 1.55}px`,
        filter: `drop-shadow(0 0 ${size * 1.6}px ${tint.glow}) drop-shadow(0 0 ${size * 3}px ${tint.glow})`,
        animation: `member-aura-ember ${duration}s ease-out infinite`,
        animationDelay: `${delay}s`,
        "--member-aura-opacity": opacity.toString(),
        "--member-aura-drift": `${driftX}cqw`,
      };
      return { id: index, style, inFront };
    });
  }, [count, seed, tint]);

  const visible = filterBySlot(embers, slot);
  if (visible.length === 0) return null;

  return (
    <FrameRoot>
      {visible.map((ember) => (
        <svg
          key={ember.id}
          viewBox="0 0 24 33"
          style={ember.style}
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <radialGradient id={`ember-grad-${seed}-${ember.id}`} cx="50%" cy="78%" r="62%">
              <stop offset="0%" stopColor="rgba(255,238,196,1)" />
              <stop offset="35%" stopColor={tint.primary} />
              <stop offset="80%" stopColor={tint.glow} stopOpacity="0.85" />
              <stop offset="100%" stopColor={tint.glow} stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={EMBER_FLAME_PATH} fill={`url(#ember-grad-${seed}-${ember.id})`} />
        </svg>
      ))}
    </FrameRoot>
  );
}

function PrismLayer({ tint, slot }: LayerProps) {
  if (slot !== "back") return null;

  const baseStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: `radial-gradient(circle at 50% 60%, ${tint.glow} 0%, ${tint.primary} 28%, transparent 60%)`,
    mixBlendMode: "screen",
    transformOrigin: "50% 60%",
    willChange: "transform, opacity, filter",
  };

  return (
    <FrameRoot>
      <div
        aria-hidden
        style={{
          ...baseStyle,
          animation:
            "member-aura-pulse-breathe 5.5s ease-out infinite, member-aura-prism-hue 14s linear infinite",
        }}
      />
      <div
        aria-hidden
        style={{
          ...baseStyle,
          animation:
            "member-aura-pulse-breathe 5.5s ease-out infinite, member-aura-prism-hue 14s linear infinite",
          animationDelay: "-2.75s, 0s",
        }}
      />
    </FrameRoot>
  );
}

export type { MemberAuraConfig };
