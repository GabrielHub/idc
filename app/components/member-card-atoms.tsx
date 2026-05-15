import type { Ref } from "react";

import { hashSeedUint32 } from "../services/utils";
import { formatMemberHeightShort } from "./date-reactions";

export type MemberCardPill = {
  tone: "rose" | "amber" | "emerald" | "neutral" | "ink";
  label: string;
};

const PILL_TONE: Record<MemberCardPill["tone"], string> = {
  rose: "bg-aura-rose/10 text-aura-rose",
  amber: "bg-amber-500/10 text-amber-700",
  emerald: "bg-emerald-500/10 text-emerald-700",
  neutral: "bg-aura-cream-soft text-aura-muted",
  ink: "bg-aura-ink text-white",
};

export function caseFileNumber(memberId: string): string {
  return `F-${((hashSeedUint32(memberId) % 9000) + 1000).toString()}`;
}

export function Pill({ pill }: { pill: MemberCardPill }) {
  return (
    <span
      className={`rounded-pill px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] ${PILL_TONE[pill.tone]}`}
    >
      {pill.label}
    </span>
  );
}

export function HeightChip({ heightInInches }: { heightInInches: number }) {
  return (
    <span className="pointer-events-none rounded-pill bg-white/85 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-muted ring-1 ring-aura-hairline">
      {formatMemberHeightShort(heightInInches)}
    </span>
  );
}

export function ExpandButton({
  onExpand,
  memberFirstName,
  buttonRef,
}: {
  onExpand: () => void;
  memberFirstName: string;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onExpand();
      }}
      aria-label={`Open ${memberFirstName} file`}
      title="Open file"
      data-sfx="click"
      className="pointer-events-auto grid size-8 cursor-pointer place-items-center rounded-full bg-white/85 text-aura-muted shadow-quiet ring-1 ring-white/60 backdrop-blur-sm transition hover:bg-white hover:text-aura-rose"
    >
      <ExpandGlyph />
    </button>
  );
}

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
      <path
        d="M6 4H12V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function StatusOverlay({
  status,
  placement,
}: {
  status: "closed" | "quit";
  placement: "card" | "modal";
}) {
  const isClosed = status === "closed";
  const bgClass =
    placement === "modal" ? "bg-aura-cream/70" : isClosed ? "bg-aura-cream/75" : "bg-aura-cream/80";
  const labelOffset = placement === "card" ? "bottom-3" : "bottom-4";
  const layerClass = placement === "card" ? "z-20" : "";
  const label = isClosed ? "Case closed." : "Cancelled membership.";

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${layerClass} grid place-items-center ${bgClass} text-aura-rose`}
    >
      {isClosed ? (
        <svg
          viewBox="0 0 60 60"
          className="size-24 drop-shadow-[0_2px_8px_rgba(244,63,94,0.25)]"
          fill="currentColor"
        >
          <path d="M30 50 L8 28 a12 12 0 0 1 17-17 l5 5 5-5 a12 12 0 0 1 17 17 z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 60 60"
          className="size-28 drop-shadow-[0_2px_8px_rgba(244,63,94,0.25)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        >
          <path d="M12 12 L48 48" />
          <path d="M48 12 L12 48" />
        </svg>
      )}
      <span
        className={`absolute ${labelOffset} left-1/2 -translate-x-1/2 rounded-pill bg-aura-rose px-2.5 py-0.5 font-mono text-micro uppercase tracking-[0.22em] text-white shadow-quiet`}
      >
        {label}
      </span>
    </div>
  );
}
