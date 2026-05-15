import { motion } from "motion/react";
import { useId } from "react";

import { EASE_OUT_QUART } from "../dashboard-atoms";
import { expandRect, useTargetRect, type TargetRect, type TutorialTarget } from "./use-target-rect";

export type TutorialSpotlightProps = {
  target: TutorialTarget;
  padding?: number;
  radius?: number;
  scrimOpacity?: number;
  onDismiss?: () => void;
};

export function TutorialSpotlight({
  target,
  padding = 14,
  radius = 20,
  scrimOpacity = 0.6,
  onDismiss,
}: TutorialSpotlightProps) {
  const rect = useTargetRect(target);
  const maskId = useId();
  const lampId = useId();
  const grainId = useId();

  if (rect === null) return null;

  const hole = expandRect(rect, padding);
  const lampCx = hole.left + hole.width / 2;
  const lampCy = hole.top + hole.height / 2;
  const lampR = Math.max(hole.width, hole.height) * 3.8;

  return (
    <motion.div
      key="tutorial-spotlight"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
      className="pointer-events-none fixed inset-0 z-40"
      aria-hidden
    >
      <svg className="absolute inset-0 size-full" preserveAspectRatio="none">
        <defs>
          <radialGradient
            id={lampId}
            cx={lampCx}
            cy={lampCy}
            r={lampR}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="rgba(252, 211, 77, 0)" />
            <stop offset="42%" stopColor="rgba(252, 211, 77, 0)" />
            <stop offset="72%" stopColor={`rgba(120, 53, 15, ${scrimOpacity * 0.18})`} />
            <stop offset="100%" stopColor={`rgba(15, 23, 42, ${scrimOpacity * 0.82})`} />
          </radialGradient>
          <filter id={grainId} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.04 0"
            />
          </filter>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <motion.rect
              initial={false}
              animate={{
                x: hole.left,
                y: hole.top,
                width: hole.width,
                height: hole.height,
              }}
              transition={{ duration: 0.36, ease: EASE_OUT_QUART }}
              rx={radius}
              fill="black"
            />
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#${lampId})`}
          mask={`url(#${maskId})`}
        />
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          mask={`url(#${maskId})`}
          filter={`url(#${grainId})`}
          opacity={0.9}
        />
      </svg>

      <motion.span
        aria-hidden
        className="pointer-events-none fixed"
        style={{
          top: lampCy - lampR,
          left: lampCx - lampR,
          width: lampR * 2,
          height: lampR * 2,
          borderRadius: "9999px",
          background:
            "radial-gradient(closest-side, rgba(254, 215, 170, 0.28), rgba(254, 215, 170, 0.12) 38%, rgba(254, 215, 170, 0) 70%)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: [0.92, 1, 0.96, 1], scale: 1 }}
        transition={{
          opacity: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 0.5, ease: EASE_OUT_QUART },
        }}
      />

      <motion.div
        initial={false}
        animate={{
          top: hole.top - 1,
          left: hole.left - 1,
          width: hole.width + 2,
          height: hole.height + 2,
        }}
        transition={{ duration: 0.36, ease: EASE_OUT_QUART }}
        className="pointer-events-none absolute"
        style={{
          borderRadius: radius + 1,
          boxShadow: [
            "0 0 0 1px rgba(255, 255, 255, 0.68)",
            "0 0 22px 4px rgba(254, 215, 170, 0.45)",
            "0 0 36px 8px rgba(244, 63, 94, 0.34)",
            "0 0 96px 14px rgba(167, 139, 250, 0.22)",
          ].join(", "),
        }}
      />

      <CornerCrops hole={hole} />

      {onDismiss === undefined ? null : <DismissRims hole={hole} onDismiss={onDismiss} />}
    </motion.div>
  );
}

function CornerCrops({ hole }: { hole: TargetRect }) {
  const reach = 14;
  const gap = 10;
  const stroke = "rgba(255, 244, 230, 0.85)";
  const lines = [
    {
      key: "tl-h",
      style: {
        top: hole.top - gap,
        left: hole.left - gap - reach,
        width: reach,
        height: 1,
        background: stroke,
      },
    },
    {
      key: "tl-v",
      style: {
        top: hole.top - gap - reach,
        left: hole.left - gap,
        width: 1,
        height: reach,
        background: stroke,
      },
    },
    {
      key: "tr-h",
      style: {
        top: hole.top - gap,
        left: hole.left + hole.width + gap,
        width: reach,
        height: 1,
        background: stroke,
      },
    },
    {
      key: "tr-v",
      style: {
        top: hole.top - gap - reach,
        left: hole.left + hole.width + gap,
        width: 1,
        height: reach,
        background: stroke,
      },
    },
    {
      key: "bl-h",
      style: {
        top: hole.top + hole.height + gap,
        left: hole.left - gap - reach,
        width: reach,
        height: 1,
        background: stroke,
      },
    },
    {
      key: "bl-v",
      style: {
        top: hole.top + hole.height + gap,
        left: hole.left - gap,
        width: 1,
        height: reach,
        background: stroke,
      },
    },
    {
      key: "br-h",
      style: {
        top: hole.top + hole.height + gap,
        left: hole.left + hole.width + gap,
        width: reach,
        height: 1,
        background: stroke,
      },
    },
    {
      key: "br-v",
      style: {
        top: hole.top + hole.height + gap,
        left: hole.left + hole.width + gap,
        width: 1,
        height: reach,
        background: stroke,
      },
    },
  ];
  return (
    <>
      {lines.map((line) => (
        <span
          key={line.key}
          aria-hidden
          className="pointer-events-none absolute"
          style={line.style}
        />
      ))}
    </>
  );
}

function DismissRims({ hole, onDismiss }: { hole: TargetRect; onDismiss: () => void }) {
  const rims: Array<React.CSSProperties> = [
    { top: 0, left: 0, right: 0, height: Math.max(hole.top, 0) },
    { top: hole.top + hole.height, left: 0, right: 0, bottom: 0 },
    { top: hole.top, left: 0, width: Math.max(hole.left, 0), height: hole.height },
    { top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height },
  ];

  return (
    <>
      {rims.map((style, index) => (
        <button
          key={index}
          type="button"
          aria-label="Dismiss tutorial"
          onClick={onDismiss}
          className="pointer-events-auto absolute cursor-pointer bg-transparent"
          style={style}
        />
      ))}
    </>
  );
}
