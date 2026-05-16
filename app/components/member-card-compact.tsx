import { motion } from "motion/react";
import type { Ref } from "react";

import type { Member } from "../domain/game";
import { EASE_OUT_QUART, Portrait } from "./dashboard-atoms";
import { ExpandButton, HeightChip, type MemberCardPill, Pill } from "./member-card-atoms";
import type { MemberCardState } from "./member-card-types";

const COMPACT_SURFACE_CLASS: Record<MemberCardState, string> = {
  focused: "bg-white border border-transparent",
  selected: "aura-glass",
  disabled: "aura-glass",
  closed: "aura-glass",
  quit: "aura-glass",
  default: "aura-glass",
};

const COMPACT_INNER_CLASS: Record<MemberCardState, string> = {
  focused: "shadow-aura-soft",
  selected: "ring-2 ring-aura-rose/35 shadow-aura-soft",
  closed: "opacity-85",
  quit: "opacity-85",
  disabled: "aura-glass-lift hover:shadow-aura-soft",
  default: "aura-glass-lift hover:shadow-aura-soft",
};

export function CompactMemberCard({
  cardRef,
  expandButtonRef,
  member,
  state,
  index,
  disabled,
  statusPill,
  askPreview,
  onClick,
  onExpand,
}: {
  cardRef?: Ref<HTMLLIElement>;
  expandButtonRef?: Ref<HTMLButtonElement>;
  member: Member;
  state: MemberCardState;
  index: number;
  disabled: boolean;
  statusPill?: MemberCardPill;
  askPreview?: string;
  onClick?: () => void;
  onExpand?: () => void;
}) {
  const hasFooter = statusPill !== undefined || onExpand !== undefined;

  return (
    <motion.li
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.02, duration: 0.32, ease: EASE_OUT_QUART }}
      className="list-none [contain-intrinsic-size:320px_96px] [content-visibility:auto]"
    >
      <div
        className={`relative h-full rounded-2xl transition-[transform,box-shadow] duration-300 ${
          state === "focused"
            ? "p-[2px] bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet shadow-cta"
            : ""
        }`}
      >
        <div
          className={`${COMPACT_SURFACE_CLASS[state]} relative flex h-full flex-col rounded-2xl text-aura-ink ${COMPACT_INNER_CLASS[state]}`}
        >
          <button
            type="button"
            onClick={onClick}
            disabled={disabled || onClick === undefined}
            data-sfx="click"
            aria-pressed={state === "selected" || state === "focused"}
            aria-label={`${member.firstName} focus tile`}
            className={`flex w-full flex-1 cursor-pointer items-start gap-3 rounded-2xl px-4 pt-4 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
              hasFooter ? "pb-2" : "pb-4"
            }`}
          >
            <Portrait member={member} variant="row" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="min-w-0 truncate font-display text-base font-semibold tracking-tight">
                  {member.firstName}
                </h3>
                <HeightChip heightInInches={member.characterHeightInInches} />
                {state === "closed" || state === "quit" ? (
                  <span className="rounded-pill bg-aura-cream-soft px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
                    {state === "closed" ? "closed" : "quit"}
                  </span>
                ) : null}
              </div>
              {askPreview !== undefined ? (
                <p className="mt-1.5 line-clamp-4 text-sm leading-snug text-aura-muted">
                  {askPreview}
                </p>
              ) : null}
            </div>
          </button>

          {hasFooter ? (
            <div className="flex items-center justify-between gap-2 px-4 pb-3">
              {statusPill !== undefined ? <Pill pill={statusPill} /> : <span aria-hidden />}
              {onExpand === undefined ? (
                <span aria-hidden />
              ) : (
                <ExpandButton
                  onExpand={onExpand}
                  memberFirstName={member.firstName}
                  buttonRef={expandButtonRef}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </motion.li>
  );
}
