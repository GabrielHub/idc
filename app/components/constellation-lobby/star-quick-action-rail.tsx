import { Html } from "@react-three/drei";

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
 * Semantic HTML action rail rendered inside the 3D billboard. Keeping the
 * controls as real buttons preserves keyboard, tooltip, aria, and disabled
 * behavior while still letting the parent position the overlay in world space.
 */
export function StarQuickActionRail({
  actions,
  avatarRadius,
  memberName,
  showActions,
  onHoverChange,
}: {
  actions: readonly StarQuickAction[];
  avatarRadius: number;
  memberName: string;
  showActions: boolean;
  active: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  return (
    <group>
      <Html
        position={[0, -avatarRadius, 0.12]}
        zIndexRange={[50, 0]}
        className="pointer-events-none"
      >
        <span className="aura-liquid-glass aura-liquid-glass-ink inline-block -translate-x-1/2 -translate-y-1/2 rounded-pill px-3 py-1 font-display text-label leading-none text-aura-paper whitespace-nowrap shadow-cta">
          {memberName}
        </span>
      </Html>

      {showActions ? (
        <Html position={[0, 0, 0.16]} zIndexRange={[55, 0]} className="pointer-events-none">
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
        </Html>
      ) : null}
    </group>
  );
}
