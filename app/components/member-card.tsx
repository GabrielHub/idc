import { motion } from "motion/react";

import type { Member } from "../domain/game";
import { buildVisibleMemberProfile } from "../services/player-knowledge";
import { EASE_OUT_QUART, Portrait } from "./dashboard-atoms";
import {
  caseFileNumber,
  ExpandButton,
  HeightChip,
  type MemberCardPill,
  Pill,
  StatusOverlay,
} from "./member-card-atoms";
import { CompactMemberCard } from "./member-card-compact";
import type { MemberCardProps, MemberCardState } from "./member-card-types";
import { MemberAuraLayer } from "./member-aura";
import { paletteToCssVars, resolvePortraitPalette } from "./portrait-palette";

export { caseFileNumber, type MemberCardPill } from "./member-card-atoms";
export type { MemberCardDensity, MemberCardProps, MemberCardState } from "./member-card-types";
export {
  MemberDetailsModal,
  type MemberDetailsAction,
  type MemberDetailsModalProps,
} from "./member-details-modal";
export { PendingMemberCard, rosterGridFillerClasses } from "./member-card-pending";

const STATE_PILL_LABEL: Record<MemberCardState, string> = {
  default: "candidate",
  focused: "focus case",
  selected: "filed",
  disabled: "candidate",
  closed: "case closed",
  quit: "cancelled",
};

const CARD_FRAME_CLASS: Record<MemberCardState, string> = {
  focused: "border-transparent shadow-aura-soft",
  selected: "border-aura-rose/60 shadow-card ring-2 ring-aura-rose/35",
  disabled: "border-aura-hairline shadow-quiet",
  closed: "border-aura-hairline shadow-quiet opacity-90",
  quit: "border-aura-hairline shadow-quiet opacity-90",
  default:
    "border-aura-hairline shadow-quiet hover:-translate-y-1.5 hover:border-aura-rose/40 hover:shadow-card",
};

export function MemberCard({
  member,
  state = "default",
  density = "standard",
  playerKnowledge,
  revealAllDetails = false,
  fileNumber,
  priorityIndex,
  askPreview,
  statusPill,
  blurbOverride,
  hideSealedSummary = false,
  index = 0,
  disabled = false,
  cardRef,
  expandButtonRef,
  onClick,
  onExpand,
}: MemberCardProps) {
  if (density === "compact") {
    return (
      <CompactMemberCard
        cardRef={cardRef}
        expandButtonRef={expandButtonRef}
        member={member}
        state={state}
        index={index}
        disabled={disabled}
        statusPill={statusPill}
        askPreview={askPreview}
        onClick={onClick}
        onExpand={onExpand}
      />
    );
  }

  const profile = buildVisibleMemberProfile(member, playerKnowledge ?? [], {
    visibilityMode: revealAllDetails ? "dev_unveiled" : "earned",
  });
  const blurb = blurbOverride ?? profile.publicFragments[0];
  const palette = resolvePortraitPalette(member);
  const file = fileNumber ?? caseFileNumber(member.id);
  const sealedCount = profile.redactedBlocks.length;
  const knownCount = profile.revealedReads.length;

  return (
    <motion.li
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 14) * 0.025, duration: 0.42, ease: EASE_OUT_QUART }}
      className="list-none [contain-intrinsic-size:320px_427px] [content-visibility:auto]"
    >
      <div
        className={`group/card relative isolate rounded-card transition-transform duration-300 ${
          state === "focused"
            ? "p-[2px] bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet shadow-cta"
            : "p-px"
        }`}
        style={paletteToCssVars(palette)}
      >
        {state === "default" ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-3 rounded-[36px] bg-[radial-gradient(circle_at_20%_18%,var(--char-accent-glow)_0%,transparent_36%),linear-gradient(135deg,var(--char-from)_0%,var(--char-via)_48%,var(--char-to)_100%)] opacity-0 blur-2xl transition-opacity duration-[600ms] ease-out group-hover/card:opacity-65"
          />
        ) : null}
        <article
          className={`relative flex aspect-[3/4] flex-col overflow-hidden rounded-card border bg-white text-aura-ink transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${CARD_FRAME_CLASS[state]}`}
        >
          <PortraitBackdrop />

          <button
            type="button"
            onClick={onClick}
            disabled={disabled || onClick === undefined}
            data-sfx="click"
            aria-pressed={state === "selected" || state === "focused"}
            aria-label={`${member.firstName} member card`}
            className="absolute inset-0 z-10 cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-100"
          >
            <span className="sr-only">Open {member.firstName} card</span>
          </button>

          {state === "focused" ? (
            <div className="pointer-events-none absolute inset-0 z-0">
              <MemberAuraLayer member={member} density="card" slot="back" />
            </div>
          ) : null}

          <div className="absolute inset-0 z-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover/card:scale-[1.06]">
            <Portrait member={member} variant="standee-bottom" asset="portrait" />
          </div>

          {state === "focused" ? (
            <div className="pointer-events-none absolute inset-0 z-[15]">
              <MemberAuraLayer member={member} density="card" slot="front" />
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pt-3">
            {state === "selected" && priorityIndex !== undefined ? (
              <PriorityBadge index={priorityIndex} />
            ) : (
              <FileNumberChip file={file} />
            )}
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

          {state === "closed" || state === "quit" ? (
            <StatusOverlay status={state} placement="card" />
          ) : null}

          {state === "disabled" ? (
            <div className="pointer-events-none absolute inset-x-0 top-12 z-20 grid place-items-center opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
              <span className="rounded-pill bg-aura-ink/80 px-3 py-1 font-mono text-micro uppercase tracking-[0.22em] text-white shadow-quiet backdrop-blur-sm">
                Caseload full
              </span>
            </div>
          ) : null}

          <InfoOverlay
            member={member}
            state={state}
            blurb={blurb}
            sealedCount={sealedCount}
            knownCount={knownCount}
            askPreview={askPreview}
            statusPill={statusPill}
            hideSealedSummary={hideSealedSummary}
            revealAllDetails={revealAllDetails}
          />
        </article>
      </div>
    </motion.li>
  );
}

function PortraitBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[var(--char-from)] via-[var(--char-via)] to-[var(--char-to)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,var(--char-accent-wash)_0%,transparent_34%),radial-gradient(ellipse_at_82%_28%,var(--char-via-wash)_0%,transparent_42%),radial-gradient(ellipse_at_48%_74%,var(--char-to-wash)_0%,transparent_58%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.24)_0%,transparent_42%,rgba(255,255,255,0.18)_100%)]"
      />
      <div aria-hidden className="aura-dot-grid absolute inset-0 opacity-40" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(ellipse_at_45%_0%,rgba(255,255,255,0.42)_0%,transparent_72%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-white/72 via-white/24 to-transparent"
      />
    </>
  );
}

function InfoOverlay({
  member,
  state,
  blurb,
  sealedCount,
  knownCount,
  askPreview,
  statusPill,
  hideSealedSummary,
  revealAllDetails,
}: {
  member: Member;
  state: MemberCardState;
  blurb: string | undefined;
  sealedCount: number;
  knownCount: number;
  askPreview: string | undefined;
  statusPill: MemberCardPill | undefined;
  hideSealedSummary: boolean;
  revealAllDetails: boolean;
}) {
  if (state === "closed" || state === "quit") return null;
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20">
      {hideSealedSummary ? null : (
        <div className="mb-2 flex justify-end">
          <SealedSummaryChip
            sealedCount={sealedCount}
            knownCount={knownCount}
            revealAllDetails={revealAllDetails}
          />
        </div>
      )}
      <div className="aura-glass-strong rounded-2xl px-3.5 py-3 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.32)]">
        <div className="flex items-start gap-3">
          <span className="relative -mt-7 inline-flex shrink-0 rounded-full ring-2 ring-white/85 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.45)]">
            <Portrait member={member} variant="thumb" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-semibold leading-tight tracking-tight">
                  {member.firstName}
                </h3>
                <p className="mt-0.5 font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
                  {STATE_PILL_LABEL[state]}
                </p>
              </div>
              <HeightChip heightInInches={member.characterHeightInInches} />
            </div>
          </div>
        </div>
        {askPreview === undefined && blurb !== undefined ? (
          <p className="mt-2 line-clamp-2 text-sm leading-snug text-aura-muted">{blurb}</p>
        ) : null}
        {askPreview !== undefined ? (
          <p className="mt-2 line-clamp-2 aura-accent text-label leading-snug text-aura-ink/80">
            {`"${askPreview}"`}
          </p>
        ) : null}
        {statusPill !== undefined ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill pill={statusPill} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FileNumberChip({ file }: { file: string }) {
  return (
    <span className="pointer-events-none rounded-pill bg-white/70 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-ink/70 ring-1 ring-white/55 backdrop-blur-sm">
      {file}
    </span>
  );
}

function PriorityBadge({ index }: { index: number }) {
  return (
    <span className="aura-cta pointer-events-none grid size-8 place-items-center rounded-full bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet font-display text-sm font-bold text-white shadow-cta ring-2 ring-white/65">
      {index + 1}
    </span>
  );
}

function SealedSummaryChip({
  sealedCount,
  knownCount,
  revealAllDetails,
}: {
  sealedCount: number;
  knownCount: number;
  revealAllDetails: boolean;
}) {
  if (revealAllDetails) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-aura-rose/15 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-rose shadow-[0_8px_22px_-12px_rgba(244,63,94,0.55)] ring-1 ring-aura-rose/25 backdrop-blur-md">
        <span aria-hidden className="size-1.5 rounded-full bg-aura-rose" />
        unveiled
      </span>
    );
  }

  const showSealed = sealedCount > 0;
  const showKnown = knownCount > 0;
  if (!showSealed && !showKnown) {
    return (
      <span className="shrink-0 rounded-pill bg-white/55 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-faint shadow-[0_8px_22px_-12px_rgba(15,23,42,0.4)] ring-1 ring-white/55 backdrop-blur-md">
        new
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-white/65 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-muted shadow-[0_8px_22px_-12px_rgba(15,23,42,0.45)] ring-1 ring-white/55 backdrop-blur-md">
      <span aria-hidden className="size-1.5 rounded-full bg-aura-rose" />
      {showKnown ? `${knownCount} read${knownCount === 1 ? "" : "s"}` : `${sealedCount} sealed`}
    </span>
  );
}
