import { Html } from "@react-three/drei";
import type { MouseEvent } from "react";

import type { Member } from "../../domain/game";
import { AuraButton } from "../aura-button";

export function FocusSelectionMarker({
  member,
  avatarRadius,
  onClearFocus,
  onHoverChange,
}: {
  member: Member;
  avatarRadius: number;
  onClearFocus: () => void;
  onHoverChange?: (hovered: boolean) => void;
}) {
  return (
    <Html
      position={[0, -avatarRadius * 1.4, 0.12]}
      zIndexRange={[55, 0]}
      className="pointer-events-none"
    >
      <div
        onPointerEnter={() => onHoverChange?.(true)}
        onPointerLeave={() => onHoverChange?.(false)}
        className="pointer-events-auto aura-liquid-glass aura-liquid-glass-rose inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-pill py-1 pl-3 pr-1 font-mono text-micro uppercase tracking-[0.2em] text-aura-paper whitespace-nowrap shadow-cta"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-aura-rose" />
        <span>Focus · {member.firstName}</span>
        <AuraButton
          tooltip="Drop focus selection"
          aria-label={`Drop ${member.firstName} as focus selection`}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            onClearFocus();
          }}
          className="grid size-5 cursor-pointer place-items-center rounded-full text-white/85 transition hover:bg-white/15 hover:text-aura-paper"
        >
          <svg viewBox="0 0 16 16" className="size-2.5" fill="none" aria-hidden>
            <path
              d="M3 3L13 13M13 3L3 13"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </AuraButton>
      </div>
    </Html>
  );
}
