import { motion } from "motion/react";

export type TutorialProgressDotsProps = {
  count: number;
  active: number;
  onSelect?: (index: number) => void;
};

export function TutorialProgressDots({ count, active, onSelect }: TutorialProgressDotsProps) {
  const dots = Array.from({ length: count }, (_, index) => index);
  const interactive = typeof onSelect === "function";

  return (
    <div role="tablist" aria-label="Tutorial progress" className="inline-flex items-center gap-2">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint tabular-nums">
        {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
      </span>
      <span aria-hidden className="relative ml-1 inline-flex items-center">
        <span
          className="absolute left-1.5 right-1.5 top-1/2 -translate-y-1/2"
          style={{
            height: 1,
            backgroundImage:
              "repeating-linear-gradient(to right, rgba(15,23,42,0.18) 0 2px, transparent 2px 5px)",
          }}
        />
        <span className="relative inline-flex items-center gap-2.5">
          {dots.map((index) => {
            const isActive = index === active;
            const isPast = index < active;

            const baseClasses = "relative size-2 rounded-full transition";
            const activeNode = (
              <motion.span
                key={index}
                className="relative size-2.5 rounded-full"
                style={{
                  background: "var(--color-aura-rose)",
                  boxShadow: "0 0 0 2px rgba(255,255,255,0.95), 0 0 14px 2px rgba(244,63,94,0.55)",
                }}
                initial={{ scale: 0.6 }}
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            );
            const pastNode = (
              <span
                key={index}
                className={baseClasses}
                style={{
                  background: "rgba(244, 63, 94, 0.32)",
                  boxShadow: "inset 0 0 0 1px rgba(244, 63, 94, 0.5)",
                }}
              />
            );
            const futureNode = (
              <span
                key={index}
                className={baseClasses}
                style={{
                  background: "transparent",
                  boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.22)",
                }}
              />
            );

            const node = isActive ? activeNode : isPast ? pastNode : futureNode;

            if (interactive) {
              return (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Step ${index + 1}`}
                  data-sfx="click"
                  onClick={() => onSelect?.(index)}
                  className="cursor-pointer rounded-full"
                  style={{ background: "transparent", padding: 0, border: 0 }}
                >
                  {node}
                </button>
              );
            }
            return node;
          })}
        </span>
      </span>
    </div>
  );
}
