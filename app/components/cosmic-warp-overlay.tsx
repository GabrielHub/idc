import { motion } from "motion/react";

type CosmicWarpOverlayProps = {
  originX?: string;
  originY?: string;
};

export function CosmicWarpOverlay({ originX = "50%", originY = "50%" }: CosmicWarpOverlayProps) {
  const startClip = `circle(0% at ${originX} ${originY})`;
  const endClip = `circle(140% at ${originX} ${originY})`;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      initial={{ opacity: 1, clipPath: startClip }}
      animate={{ clipPath: endClip }}
      exit={{ opacity: 0 }}
      transition={{
        clipPath: { duration: 0.65, ease: [0.65, 0, 0.35, 1] },
        opacity: { duration: 0.45, ease: [0.4, 0, 0.6, 1] },
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#1a0f2e_0%,#2a1a3f_36%,#48294f_70%,#6b3d5a_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_62%,rgba(255,180,100,0.55)_0%,rgba(255,140,130,0.35)_30%,transparent_60%)]" />
    </motion.div>
  );
}
