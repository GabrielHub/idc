import { AuraButton } from "../aura-button";
import type { StarQuickAction } from "./types";

function actionPositionClass(visibleCount: number, index: number) {
  if (visibleCount <= 1) return "left-[36px] top-[68px]";
  if (visibleCount === 2) return index === 0 ? "left-[33px] top-[44px]" : "left-[33px] top-[92px]";
  if (index === 0) return "left-[23px] top-[22px]";
  if (index === 1) return "left-[36px] top-[68px]";
  return "left-[23px] top-[114px]";
}

/**
 * Buttons arranged on an arc hugging the right side of the avatar. The bridge
 * wraps the buttons and the gaps between them so hover only toggles at the
 * outer boundary. Callers cap the action list at 3 (see useStarQuickActions).
 */
export function StarQuickActionRail({
  actions,
  onHoverChange,
}: {
  actions: readonly StarQuickAction[];
  onHoverChange: (hovered: boolean) => void;
}) {
  return (
    <div
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
      className="pointer-events-auto absolute left-[50px] top-[-68px] h-[136px] w-[72px]"
    >
      {actions.map((action, index) => {
        const toneClass =
          action.tone === "rose"
            ? "bg-aura-rose text-aura-paper ring-aura-rose/60 hover:bg-aura-fuchsia"
            : action.tone === "amber"
              ? "bg-amber-300 text-[#1a0f2e] ring-amber-100/70 hover:bg-amber-200"
              : "aura-liquid-glass aura-liquid-glass-hover text-aura-paper ring-white/20";

        return (
          <AuraButton
            key={action.id}
            tooltip={action.title ?? action.label}
            tooltipPlacement="right"
            tooltipClassName={`absolute -translate-x-1/2 -translate-y-1/2 ${actionPositionClass(
              actions.length,
              index,
            )}`}
            aria-label={action.label}
            disabled={action.disabled}
            onClick={(event) => {
              event.stopPropagation();
              action.onSelect();
            }}
            className={`grid size-8 cursor-pointer place-items-center rounded-full ring-1 shadow-cta transition disabled:cursor-not-allowed disabled:opacity-45 ${toneClass}`}
          >
            <span className="size-4" aria-hidden>
              {action.icon}
            </span>
          </AuraButton>
        );
      })}
    </div>
  );
}
