import { motion } from "motion/react";

export const TUTORIAL_MANAGER_PORTRAIT_SRC = "/assets/tutorial/onboarding-manager/portrait.png";
export const TUTORIAL_MANAGER_AVATAR_SRC = "/assets/tutorial/onboarding-manager/avatar.png";

export type TutorialManagerAvatarPeekProps = {
  size?: number;
  loading?: "eager" | "lazy";
};

export function TutorialManagerAvatarPeek({
  size = 56,
  loading = "lazy",
}: TutorialManagerAvatarPeekProps) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute z-10"
      initial={{ opacity: 0, scale: 0.84, rotate: -6 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: -3,
        y: [0, -1.4, 0, 1, 0],
      }}
      transition={{
        opacity: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] },
        scale: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
        rotate: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
        y: { duration: 5.4, repeat: Infinity, ease: "easeInOut" },
      }}
      style={{
        width: size,
        height: size,
        top: -Math.round(size * 0.42),
        left: 14,
      }}
    >
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{
          inset: -7,
          background:
            "radial-gradient(closest-side, rgba(254, 215, 170, 0.42), rgba(254, 215, 170, 0.12) 55%, rgba(254, 215, 170, 0) 78%)",
          filter: "blur(4px)",
        }}
      />
      <span
        className="relative block size-full overflow-hidden rounded-full bg-aura-paper"
        style={{
          boxShadow: [
            "0 0 0 1.5px rgba(255, 255, 255, 0.96)",
            "0 0 0 2.5px rgba(244, 63, 94, 0.18)",
            "0 9px 16px -5px rgba(87, 36, 68, 0.48)",
            "0 2px 5px rgba(15, 23, 42, 0.12)",
          ].join(", "),
        }}
      >
        <img
          src={TUTORIAL_MANAGER_AVATAR_SRC}
          alt=""
          loading={loading}
          decoding="async"
          className="block size-full object-cover object-[52%_28%]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow:
              "inset 0 1px 0 0 rgba(255, 255, 255, 0.55), inset 0 -3px 8px 0 rgba(244, 63, 94, 0.16)",
          }}
        />
      </span>
    </motion.span>
  );
}

export type TutorialManagerPortraitOverProps = {
  height?: number;
  rightOffset?: number;
  topOffset?: number;
  loading?: "eager" | "lazy";
};

export function TutorialManagerPortraitOver({
  height = 320,
  rightOffset = 110,
  topOffset = -36,
  loading = "lazy",
}: TutorialManagerPortraitOverProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10"
      style={{
        right: -rightOffset,
        top: topOffset,
        height,
      }}
    >
      <motion.div
        className="relative h-full"
        initial={{ opacity: 0, x: 18 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, -3, 0, 2, 0],
        }}
        transition={{
          opacity: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
          x: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
          y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
        }}
      >
        <span
          aria-hidden
          className="absolute"
          style={{
            inset: "4% -16% 14% -16%",
            background:
              "radial-gradient(45% 55% at 50% 28%, rgba(244, 63, 94, 0.2), rgba(167, 139, 250, 0.1) 50%, rgba(167, 139, 250, 0) 80%)",
            filter: "blur(22px)",
          }}
        />
        <img
          src={TUTORIAL_MANAGER_PORTRAIT_SRC}
          alt=""
          loading={loading}
          decoding="async"
          className="relative h-full w-auto object-contain object-top"
          style={{
            filter: "drop-shadow(-6px 12px 16px rgba(87, 36, 68, 0.22))",
          }}
        />
      </motion.div>
    </div>
  );
}
