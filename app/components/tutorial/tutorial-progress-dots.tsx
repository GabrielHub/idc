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
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint tabular-nums">
        {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
      </span>
      <span aria-hidden className="ml-2 inline-flex items-center gap-1">
        {dots.map((index) => {
          const isActive = index === active;
          const isPast = index < active;
          const tone = isActive
            ? "bg-aura-rose shadow-[0_0_8px_rgba(244,63,94,0.55)]"
            : isPast
              ? "bg-aura-rose/55"
              : "bg-aura-hairline-strong";
          const size = isActive ? "size-2" : "size-1.5";

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
                className={`cursor-pointer rounded-full transition ${size} ${tone}`}
              />
            );
          }
          return <span key={index} className={`rounded-full transition ${size} ${tone}`} />;
        })}
      </span>
    </div>
  );
}
