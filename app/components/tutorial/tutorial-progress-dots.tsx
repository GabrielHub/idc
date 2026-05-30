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
    <div role="tablist" aria-label="Tutorial progress" className="inline-flex items-center gap-1.5">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.1em] text-[color:var(--aura-glass-text-faint)] tabular-nums">
        {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
      </span>
      <span aria-hidden className="relative inline-flex items-center">
        <span className="absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 bg-[image:repeating-linear-gradient(to_right,var(--aura-glass-dot-line)_0_2px,transparent_2px_5px)]" />
        <span className="relative inline-flex items-center gap-1.5">
          {dots.map((index) => {
            const isActive = index === active;
            const isPast = index < active;

            const baseClasses = "relative size-2 rounded-full transition";
            const activeNode = (
              <motion.span
                key={index}
                className="relative size-2.5 rounded-full bg-aura-rose shadow-[0_0_0_2px_var(--aura-glass-dot-active-ring),0_0_14px_2px_rgba(244,63,94,0.55)]"
                initial={{ scale: 0.6 }}
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            );
            const pastNode = (
              <span
                key={index}
                className={`${baseClasses} bg-[rgba(244,63,94,0.32)] shadow-[inset_0_0_0_1px_rgba(244,63,94,0.5)]`}
              />
            );
            const futureNode = (
              <span
                key={index}
                className={`${baseClasses} bg-transparent shadow-[inset_0_0_0_1px_var(--aura-glass-dot-future)]`}
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
                  className="cursor-pointer rounded-full border-0 bg-transparent p-0"
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
