import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import type { PortraitMood } from "../domain/game";
import { mulberry32 } from "../services/utils";
import { EASE_OUT_QUART } from "./dashboard-atoms";

type ScenarioBackdropLoadState = "loading" | "loaded" | "failed";

export type ScenarioBackdropContainment = "fixed" | "absolute";

export type ScenarioBackdropMicroMotion = "off" | "drift" | "pointer" | "drift-pointer";

export type ScenarioBackdropParticleStyle = "off" | "motes" | "embers" | "snow";

export const SCENARIO_BACKDROP_MICRO_MOTION_VARIANTS: readonly ScenarioBackdropMicroMotion[] = [
  "off",
  "drift",
  "pointer",
  "drift-pointer",
];

export const SCENARIO_BACKDROP_PARTICLE_STYLES: readonly ScenarioBackdropParticleStyle[] = [
  "off",
  "motes",
  "embers",
  "snow",
];

const SCENARIO_BACKDROP_MANIFEST_PATH = "/assets/scenarios/manifest.json";
const POINTER_DAMPENING = 0.07;
const POINTER_RANGE_PCT = 1.6;
const PARTICLE_COUNT = 16;

let scenarioBackdropIdCache: ReadonlySet<string> | null = null;
let scenarioBackdropIdRequest: Promise<ReadonlySet<string>> | null = null;

const SCENARIO_BACKDROP_ROOT_FIXED_CLASS =
  "pointer-events-none fixed -inset-[10vmax] z-0 overflow-hidden";
const SCENARIO_BACKDROP_ROOT_ABSOLUTE_CLASS =
  "pointer-events-none absolute inset-0 overflow-hidden";
const SCENARIO_BACKDROP_IMAGE_CLASS =
  "absolute inset-0 size-full object-cover object-center opacity-[0.86] blur-[16px] saturate-[1.22] contrast-[1.04]";
const SCENARIO_BACKDROP_VEIL_CLASS =
  "absolute inset-0 bg-[radial-gradient(ellipse_at_50%_43%,rgba(255,253,249,0.66)_0%,rgba(255,253,249,0.48)_30%,rgba(255,253,249,0.2)_66%,rgba(255,253,249,0.08)_100%)]";
const SCENARIO_BACKDROP_EDGE_CLASS =
  "absolute inset-0 bg-[linear-gradient(180deg,rgba(253,250,246,0.44)_0%,rgba(253,250,246,0.1)_28%,rgba(253,250,246,0.14)_74%,rgba(253,250,246,0.52)_100%)]";

type ParticlePalette = {
  color: string;
  glow: string;
  minSize: number;
  maxSize: number;
  minOpacity: number;
  maxOpacity: number;
  keyframes: string;
  minDuration: number;
  maxDuration: number;
  origin: "bottom" | "top";
};

const PARTICLE_PALETTES: Record<Exclude<ScenarioBackdropParticleStyle, "off">, ParticlePalette> = {
  motes: {
    color: "rgba(255,245,225,1)",
    glow: "0 0 12px rgba(255, 235, 200, 0.5)",
    minSize: 2,
    maxSize: 5,
    minOpacity: 0.25,
    maxOpacity: 0.65,
    keyframes: "aura-particle-mote",
    minDuration: 16,
    maxDuration: 28,
    origin: "bottom",
  },
  embers: {
    color: "rgba(255,178,90,1)",
    glow: "0 0 14px rgba(255, 140, 60, 0.7)",
    minSize: 2,
    maxSize: 6,
    minOpacity: 0.45,
    maxOpacity: 0.9,
    keyframes: "aura-particle-ember",
    minDuration: 10,
    maxDuration: 22,
    origin: "bottom",
  },
  snow: {
    color: "rgba(225,240,255,1)",
    glow: "0 0 10px rgba(190, 220, 255, 0.45)",
    minSize: 2,
    maxSize: 5,
    minOpacity: 0.4,
    maxOpacity: 0.8,
    keyframes: "aura-particle-snow",
    minDuration: 14,
    maxDuration: 24,
    origin: "top",
  },
};

const MOOD_TINT_GRADIENT: Record<PortraitMood, string | null> = {
  neutral: null,
  flirty:
    "radial-gradient(ellipse at 50% 62%, rgba(244,63,94,0.18) 0%, rgba(244,63,94,0.07) 45%, rgba(244,63,94,0) 78%)",
  confused:
    "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.16) 0%, rgba(79,70,229,0.07) 50%, rgba(79,70,229,0) 80%)",
  angry:
    "radial-gradient(ellipse at 50% 60%, rgba(220,38,38,0.18) 0%, rgba(234,88,12,0.08) 42%, rgba(234,88,12,0) 80%)",
};

export function scenarioBackdropPath(scenarioId: string): string {
  return `/assets/scenarios/${scenarioId}/background.webp`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseScenarioBackdropIds(value: unknown): ReadonlySet<string> {
  if (!isRecord(value) || !Array.isArray(value.backgrounds)) {
    return new Set();
  }

  return new Set(
    value.backgrounds.filter((background): background is string => typeof background === "string"),
  );
}

export function loadScenarioBackdropIds(): Promise<ReadonlySet<string>> {
  if (scenarioBackdropIdCache !== null) {
    return Promise.resolve(scenarioBackdropIdCache);
  }

  scenarioBackdropIdRequest ??= fetch(SCENARIO_BACKDROP_MANIFEST_PATH)
    .then((response) => (response.ok ? response.json() : { backgrounds: [] }))
    .then((value: unknown) => {
      scenarioBackdropIdCache = parseScenarioBackdropIds(value);
      return scenarioBackdropIdCache;
    })
    .catch(() => {
      scenarioBackdropIdCache = new Set();
      return scenarioBackdropIdCache;
    });

  return scenarioBackdropIdRequest;
}

export function ScenarioBackdropLayer({
  scenarioId,
  containment = "fixed",
  microMotion = "drift",
  particles = "off",
  moodTint,
}: {
  scenarioId: string | undefined;
  containment?: ScenarioBackdropContainment;
  microMotion?: ScenarioBackdropMicroMotion;
  particles?: ScenarioBackdropParticleStyle;
  moodTint?: PortraitMood;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    if (scenarioId === undefined) {
      setSrc(null);
      return () => {
        isCurrent = false;
      };
    }

    if (scenarioBackdropIdCache !== null) {
      setSrc(scenarioBackdropIdCache.has(scenarioId) ? scenarioBackdropPath(scenarioId) : null);
      return () => {
        isCurrent = false;
      };
    }

    setSrc(null);
    void loadScenarioBackdropIds().then((backdropIds) => {
      if (isCurrent) {
        setSrc(backdropIds.has(scenarioId) ? scenarioBackdropPath(scenarioId) : null);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [scenarioId]);

  const moodGradient =
    moodTint === undefined || moodTint === "neutral" ? null : MOOD_TINT_GRADIENT[moodTint];
  const particlesActive = particles !== "off";
  const hasAnything = src !== null || particlesActive || moodGradient !== null;

  if (!hasAnything) {
    return null;
  }

  const rootClass =
    containment === "absolute"
      ? SCENARIO_BACKDROP_ROOT_ABSOLUTE_CLASS
      : SCENARIO_BACKDROP_ROOT_FIXED_CLASS;

  return (
    <div aria-hidden className={rootClass}>
      <AnimatePresence mode="sync">
        {src === null ? null : (
          <ScenarioBackdropImage key={src} src={src} microMotion={microMotion} />
        )}
      </AnimatePresence>
      {particlesActive ? <ScenarioParticleLayer style={particles} /> : null}
      <ScenarioMoodTintLayer mood={moodTint ?? null} gradient={moodGradient} />
    </div>
  );
}

function ScenarioBackdropImage({
  src,
  microMotion,
}: {
  src: string;
  microMotion: ScenarioBackdropMicroMotion;
}) {
  const [loadState, setLoadState] = useState<ScenarioBackdropLoadState>("loading");
  const reducedMotion = useReducedMotion();
  const effectiveMotion: ScenarioBackdropMicroMotion = reducedMotion ? "off" : microMotion;
  const driftActive = effectiveMotion === "drift" || effectiveMotion === "drift-pointer";
  const pointerActive = effectiveMotion === "pointer" || effectiveMotion === "drift-pointer";
  const pointerLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = pointerLayerRef.current;

    if (node !== null) {
      node.style.transform = "";
    }

    if (!pointerActive || node === null) {
      return;
    }

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;

    const handleMove = (event: MouseEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * -POINTER_RANGE_PCT;
      target.y = (event.clientY / window.innerHeight - 0.5) * -POINTER_RANGE_PCT;
    };

    const tick = () => {
      current.x += (target.x - current.x) * POINTER_DAMPENING;
      current.y += (target.y - current.y) * POINTER_DAMPENING;
      node.style.transform = `translate3d(${current.x.toFixed(4)}%, ${current.y.toFixed(4)}%, 0)`;
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.cancelAnimationFrame(raf);
      node.style.transform = "";
    };
  }, [pointerActive]);

  if (loadState === "failed") {
    return null;
  }

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: loadState === "loaded" ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT_QUART }}
    >
      <motion.div
        className={`absolute inset-0 ${driftActive ? "will-change-transform" : ""}`}
        animate={
          driftActive
            ? {
                scale: [1, 1.012, 1.008, 1.014, 1],
                x: ["0%", "0.4%", "-0.1%", "-0.4%", "0%"],
                y: ["0%", "-0.3%", "0.2%", "-0.2%", "0%"],
              }
            : { scale: 1, x: "0%", y: "0%" }
        }
        transition={
          driftActive
            ? {
                duration: 22,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }
            : { duration: 0.4, ease: "easeOut" }
        }
      >
        <div ref={pointerLayerRef} className="absolute inset-0">
          <img
            alt=""
            src={src}
            decoding="async"
            loading="eager"
            draggable={false}
            onLoad={() => setLoadState("loaded")}
            onError={() => setLoadState("failed")}
            className={SCENARIO_BACKDROP_IMAGE_CLASS}
          />
        </div>
      </motion.div>
      <span aria-hidden className={SCENARIO_BACKDROP_VEIL_CLASS} />
      <span aria-hidden className={SCENARIO_BACKDROP_EDGE_CLASS} />
    </motion.div>
  );
}

type ParticleStyle = CSSProperties & {
  "--aura-particle-opacity": string;
  "--aura-particle-drift": string;
};

type ParticleSpec = {
  id: number;
  style: ParticleStyle;
};

function ScenarioParticleLayer({
  style,
}: {
  style: Exclude<ScenarioBackdropParticleStyle, "off">;
}) {
  const reducedMotion = useReducedMotion();
  const particles = useMemo(() => buildParticles(style), [style]);

  if (reducedMotion) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          aria-hidden
          className="absolute rounded-full"
          style={particle.style}
        />
      ))}
    </div>
  );
}

function buildParticles(style: Exclude<ScenarioBackdropParticleStyle, "off">): ParticleSpec[] {
  const palette = PARTICLE_PALETTES[style];
  const seedBase = STYLE_SEED[style];
  const positionAnchor = palette.origin === "top" ? { top: 0 } : { bottom: 0 };

  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const random = mulberry32(seedBase + index * 7919);
    const size = palette.minSize + random() * (palette.maxSize - palette.minSize);
    const opacity = palette.minOpacity + random() * (palette.maxOpacity - palette.minOpacity);
    const duration = palette.minDuration + random() * (palette.maxDuration - palette.minDuration);
    const delay = -random() * duration;
    const left = random() * 100;
    const drift = (random() - 0.5) * 8;
    const inlineStyle: ParticleStyle = {
      ...positionAnchor,
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      background: palette.color,
      boxShadow: palette.glow,
      opacity: 0,
      animation: `${palette.keyframes} ${duration}s linear infinite`,
      animationDelay: `${delay}s`,
      "--aura-particle-opacity": opacity.toString(),
      "--aura-particle-drift": `${drift}vw`,
    };

    return { id: index, style: inlineStyle };
  });
}

const STYLE_SEED: Record<Exclude<ScenarioBackdropParticleStyle, "off">, number> = {
  motes: 0x4d2,
  embers: 0xb1a2e,
  snow: 0x5009,
};

function ScenarioMoodTintLayer({
  mood,
  gradient,
}: {
  mood: PortraitMood | null;
  gradient: string | null;
}) {
  return (
    <AnimatePresence mode="sync">
      {gradient === null ? null : (
        <motion.span
          key={mood ?? "none"}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: gradient }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: EASE_OUT_QUART }}
        />
      )}
    </AnimatePresence>
  );
}
