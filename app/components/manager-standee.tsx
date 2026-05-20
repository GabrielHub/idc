import { motion } from "motion/react";
import { type ReactNode } from "react";

import type { ManagerQuip } from "../fixtures/manager-quips";
import { createNamespacedRandom, type RandomSeedPart } from "../services/utils";
import { TUTORIAL_MANAGER_PORTRAIT_SRC } from "./tutorial";

export type ManagerStandeeSide = "left" | "right";
export type ManagerStandeeSurface = "popup" | "preview";

export interface ManagerStandeeProps {
  quip: ManagerQuip;
  side: ManagerStandeeSide;
  surface: ManagerStandeeSurface;
}

const ENTRY_X_OFFSET_PX = 360;
const ENTRY_Y_OFFSET_PX = 220;
const ENTRY_TILT_DEG = 22;
const RESTING_TILT_DEG = 7;

const STANDEE_SURFACE_CLASS: Record<ManagerStandeeSurface, string> = {
  popup: "bottom-[-200px]",
  preview: "bottom-[-160px]",
};

export function ManagerStandee({ quip, side, surface }: ManagerStandeeProps) {
  const isLeft = side === "left";
  const offscreenX = isLeft ? -ENTRY_X_OFFSET_PX : ENTRY_X_OFFSET_PX;
  const entryTilt = isLeft ? ENTRY_TILT_DEG : -ENTRY_TILT_DEG;
  const restingTilt = isLeft ? RESTING_TILT_DEG : -RESTING_TILT_DEG;
  const sideClass = isLeft ? "left-[2%] origin-[25%_95%]" : "right-[2%] origin-[75%_95%]";
  const initial = {
    x: offscreenX,
    y: ENTRY_Y_OFFSET_PX,
    rotate: entryTilt,
    ...(surface === "popup" ? { opacity: 0 } : {}),
  };
  const animate = {
    x: 0,
    y: 0,
    rotate: restingTilt,
    ...(surface === "popup" ? { opacity: 1 } : {}),
  };

  return (
    <motion.div
      className={`pointer-events-none absolute z-10 h-[560px] w-[320px] ${STANDEE_SURFACE_CLASS[surface]} ${sideClass}`}
      initial={initial}
      animate={animate}
      exit={initial}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 18,
        mass: 0.85,
      }}
    >
      <ManagerStandeeBob isLeft={isLeft}>
        <span
          aria-hidden
          className="absolute -inset-8 rounded-full bg-aura-mesh-rose/60 blur-3xl"
        />
        <img
          src={TUTORIAL_MANAGER_PORTRAIT_SRC}
          alt=""
          loading="eager"
          decoding="async"
          className="relative size-full object-contain object-top drop-shadow-[0_30px_42px_rgba(244,63,94,0.22)]"
        />
        <SpeakingMark isLeft={isLeft} />
      </ManagerStandeeBob>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 bottom-3 h-3 rounded-full bg-aura-ink/30 blur-md"
      />
      <ScreenReaderQuip text={quip.text} translation={quip.translation} />
    </motion.div>
  );
}

export function pickNextManagerStandeeSide(
  previous: ManagerStandeeSide | null,
  seedParts: readonly RandomSeedPart[] = [],
): ManagerStandeeSide {
  if (previous === "left") return "right";
  if (previous === "right") return "left";
  const random = createNamespacedRandom("manager-standee-side", seedParts);
  return random() < 0.5 ? "left" : "right";
}

function ManagerStandeeBob({ children, isLeft }: { children: ReactNode; isLeft: boolean }) {
  const swayBase = isLeft ? 1.6 : -1.6;
  return (
    <motion.div
      className="relative size-full"
      animate={{
        y: [0, -7, -2, 4, 0],
        rotate: [0, swayBase, -swayBase * 0.4, swayBase * 0.7, 0],
        x: [0, -2, 1.5, -1, 0],
      }}
      transition={{
        duration: 5.2,
        ease: "easeInOut",
        repeat: Infinity,
        delay: 0.55,
      }}
    >
      {children}
    </motion.div>
  );
}

function SpeakingMark({ isLeft }: { isLeft: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute top-20 inline-flex items-end gap-0.5 rounded-pill border border-aura-hairline bg-white/85 px-2 py-1 shadow-[0_8px_18px_-10px_rgba(244,63,94,0.4)] backdrop-blur ${
        isLeft ? "right-10" : "left-10"
      }`}
    >
      <SpeakingBar delay={0} />
      <SpeakingBar delay={0.12} />
      <SpeakingBar delay={0.24} />
      <SpeakingBar delay={0.36} />
    </span>
  );
}

function SpeakingBar({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block w-[3px] rounded-full bg-gradient-to-t from-aura-rose to-aura-fuchsia"
      animate={{ height: ["6px", "14px", "6px", "10px", "6px"] }}
      transition={{
        duration: 0.9,
        ease: "easeInOut",
        repeat: Infinity,
        delay,
      }}
    />
  );
}

function ScreenReaderQuip({ text, translation }: { text: string; translation?: string }) {
  const announcement = translation ? `${text} (${translation})` : text;
  return (
    <span role="status" className="sr-only">
      Manager check-in: {announcement}
    </span>
  );
}
