import type { ReactNode } from "react";

type StampMarkSize = "sm" | "md" | "lg";

const STAMP_SIZE_CLASS: Record<StampMarkSize, string> = {
  sm: "rounded px-3 py-1 text-label tracking-[0.28em]",
  md: "rounded-md px-6 py-2 text-display-sm tracking-[0.34em]",
  lg: "rounded-md px-10 py-4 text-display-md tracking-[0.42em]",
};

const STAMP_BORDER_CLASS: Record<StampMarkSize, string> = {
  sm: "border-[3px]",
  md: "border-[6px]",
  lg: "border-[10px]",
};

export function StampMark({
  animated = false,
  children,
  className = "",
  size = "md",
}: {
  animated?: boolean;
  children: ReactNode;
  className?: string;
  size?: StampMarkSize;
}) {
  return (
    <div className={`${animated ? "splash-stamp-impact " : ""}relative ${className}`}>
      <div
        className={`border-aura-rose/80 font-mono font-bold uppercase text-aura-rose shadow-cta ${STAMP_BORDER_CLASS[size]} ${STAMP_SIZE_CLASS[size]}`}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="absolute -inset-3 -z-10 rounded-[20px] bg-aura-mesh-rose/45 blur-2xl"
      />
    </div>
  );
}
