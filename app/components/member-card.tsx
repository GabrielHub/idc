import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, type Ref, useEffect, useMemo } from "react";

import type { Member, MemberRequest, PlayerKnowledgeRecord } from "../domain/game";
import { buildVisibleMemberProfile, type VisibleMemberProfile } from "../services/player-knowledge";
import { hashSeedUint32 } from "../services/utils";
import { EASE_OUT_QUART, Eyebrow, Portrait, scoreWidthClass } from "./dashboard-atoms";
import { MemberAuraLayer } from "./member-aura";
import { paletteToCssVars, usePortraitPalette } from "./portrait-palette";

export type MemberCardState = "default" | "focused" | "selected" | "disabled" | "closed" | "quit";

export type MemberCardDensity = "standard" | "compact";

export type MemberCardPill = {
  tone: "rose" | "amber" | "emerald" | "neutral" | "ink";
  label: string;
};

export type MemberCardProps = {
  member: Member;
  state?: MemberCardState;
  density?: MemberCardDensity;
  playerKnowledge?: readonly PlayerKnowledgeRecord[];
  revealAllDetails?: boolean;
  fileNumber?: string;
  priorityIndex?: number;
  askPreview?: string;
  statusPill?: MemberCardPill;
  blurbOverride?: string;
  hideSealedSummary?: boolean;
  index?: number;
  disabled?: boolean;
  cardRef?: Ref<HTMLLIElement>;
  onClick?: () => void;
  onExpand?: () => void;
};

export function caseFileNumber(memberId: string): string {
  return `F-${((hashSeedUint32(memberId) % 9000) + 1000).toString()}`;
}

const STATE_PILL_LABEL: Record<MemberCardState, string> = {
  default: "candidate",
  focused: "focus case",
  selected: "filed",
  disabled: "candidate",
  closed: "case closed",
  quit: "cancelled",
};

const PILL_TONE: Record<MemberCardPill["tone"], string> = {
  rose: "bg-aura-rose/10 text-aura-rose",
  amber: "bg-amber-500/10 text-amber-700",
  emerald: "bg-emerald-500/10 text-emerald-700",
  neutral: "bg-aura-cream-soft text-aura-muted",
  ink: "bg-aura-ink text-white",
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
  onClick,
  onExpand,
}: MemberCardProps) {
  const profile = useMemo(
    () =>
      buildVisibleMemberProfile(member, playerKnowledge ?? [], {
        visibilityMode: revealAllDetails ? "dev_unveiled" : "earned",
      }),
    [member, playerKnowledge, revealAllDetails],
  );
  const blurb = blurbOverride ?? profile.publicFragments[0];
  const palette = usePortraitPalette(member);
  const file = fileNumber ?? caseFileNumber(member.id);
  const sealedCount = profile.redactedBlocks.length;
  const knownCount = profile.revealedReads.length;

  if (density === "compact") {
    return (
      <CompactMemberCard
        cardRef={cardRef}
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

  return (
    <motion.li
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 14) * 0.025, duration: 0.42, ease: EASE_OUT_QUART }}
      className="list-none"
    >
      <div
        className={`group relative isolate rounded-card transition-transform duration-300 ${
          state === "focused"
            ? "p-[2px] bg-gradient-to-br from-aura-rose via-aura-fuchsia to-aura-violet shadow-cta"
            : "p-px"
        }`}
        style={paletteToCssVars(palette)}
      >
        {state === "default" ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-3 rounded-[36px] bg-gradient-to-br from-[var(--char-from)] via-[var(--char-via)] to-[var(--char-to)] opacity-0 blur-2xl transition-opacity duration-[600ms] ease-out group-hover:opacity-55"
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

          <div className="absolute inset-0 z-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]">
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
              <ExpandButton onExpand={onExpand} memberFirstName={member.firstName} />
            )}
          </div>

          {state === "closed" || state === "quit" ? (
            <StatusOverlay status={state} placement="card" />
          ) : null}

          {state === "disabled" ? (
            <div className="pointer-events-none absolute inset-x-0 top-12 z-20 grid place-items-center">
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
      <div aria-hidden className="aura-dot-grid absolute inset-0 opacity-40" />
      <div
        aria-hidden
        className="absolute -left-16 -top-12 size-44 rounded-full bg-white/40 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-12 top-16 size-36 rounded-full bg-white/30 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-white/85 via-white/35 to-transparent"
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
              {hideSealedSummary ? null : (
                <SealedSummaryChip
                  sealedCount={sealedCount}
                  knownCount={knownCount}
                  revealAllDetails={revealAllDetails}
                />
              )}
            </div>
          </div>
        </div>
        {askPreview === undefined && blurb !== undefined ? (
          <p className="mt-2 line-clamp-2 text-xs leading-snug text-aura-muted">{blurb}</p>
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

function CompactMemberCard({
  cardRef,
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
      className="list-none"
    >
      <div
        className={`group relative h-full rounded-2xl transition-[transform,box-shadow] duration-300 ${
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
                <h3 className="truncate font-display text-base font-semibold tracking-tight">
                  {member.firstName}
                </h3>
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
                <ExpandButton onExpand={onExpand} memberFirstName={member.firstName} />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </motion.li>
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
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-aura-rose/10 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-rose ring-1 ring-aura-rose/20">
        <span aria-hidden className="size-1.5 rounded-full bg-aura-rose" />
        unveiled
      </span>
    );
  }

  const showSealed = sealedCount > 0;
  const showKnown = knownCount > 0;
  if (!showSealed && !showKnown) {
    return (
      <span className="shrink-0 rounded-pill bg-white/65 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-faint ring-1 ring-aura-hairline">
        new
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-white/85 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-muted ring-1 ring-aura-hairline">
      <span aria-hidden className="size-1.5 rounded-full bg-aura-rose" />
      {showKnown ? `${knownCount} read${knownCount === 1 ? "" : "s"}` : `${sealedCount} sealed`}
    </span>
  );
}

function Pill({ pill }: { pill: MemberCardPill }) {
  return (
    <span
      className={`rounded-pill px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] ${PILL_TONE[pill.tone]}`}
    >
      {pill.label}
    </span>
  );
}

function ExpandButton({
  onExpand,
  memberFirstName,
}: {
  onExpand: () => void;
  memberFirstName: string;
}) {
  return (
    <button
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

function StatusOverlay({
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

/* ------------------------------------------------------------------ */
/* MemberDetailsModal                                                  */
/* ------------------------------------------------------------------ */

export type MemberDetailsAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export type MemberDetailsModalProps = {
  member: Member;
  playerKnowledge: readonly PlayerKnowledgeRecord[];
  revealAllDetails?: boolean;
  request?: MemberRequest;
  primaryAction?: MemberDetailsAction;
  secondaryAction?: MemberDetailsAction;
  isFocused?: boolean;
  onClose: () => void;
};

export function MemberDetailsModal({
  member,
  playerKnowledge,
  revealAllDetails = false,
  request,
  primaryAction,
  secondaryAction,
  isFocused = false,
  onClose,
}: MemberDetailsModalProps) {
  const profile = useMemo(
    () =>
      buildVisibleMemberProfile(member, playerKnowledge, {
        visibilityMode: revealAllDetails ? "dev_unveiled" : "earned",
      }),
    [member, playerKnowledge, revealAllDetails],
  );
  const palette = usePortraitPalette(member);
  const status = member.state.status;
  const publicProfileLead = profile.publicFragments[0];

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const statusLabel =
    status === "active"
      ? isFocused
        ? "focus case"
        : "active file"
      : status === "closed"
        ? "case closed"
        : "cancelled membership";

  return (
    <AnimatePresence>
      <motion.div
        key="member-details-modal-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
        onClick={onClose}
        className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-aura-ink/45 px-3 py-3 backdrop-blur-xl md:px-5 md:py-5"
      >
        <motion.div
          key="member-details-modal-card"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.36, ease: EASE_OUT_QUART }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${member.firstName} file`}
          style={paletteToCssVars(palette)}
          className="aura-glass-strong relative grid w-full max-w-[108rem] grid-cols-1 overflow-hidden rounded-card md:w-[calc(100vw-2.5rem)] md:grid-cols-[minmax(260px,330px)_minmax(0,1fr)]"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--char-from)] via-[var(--char-via)] to-[var(--char-to)]" />
            <div className="aura-dot-grid absolute inset-0 opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-white/10" />
          </div>

          {status === "active" ? (
            <div className="pointer-events-none absolute inset-0 z-[1]">
              <MemberAuraLayer member={member} density="modal" slot="back" mode="broad" />
            </div>
          ) : null}

          <ModalTint />
          <ModalCloseTab onClose={onClose} />

          <aside className="relative z-10 hidden flex-col items-center justify-end gap-4 px-4 pb-5 pt-8 md:flex">
            <div className="absolute inset-0 z-0 overflow-hidden">
              {status === "active" ? (
                <div className="pointer-events-none absolute inset-0">
                  <MemberAuraLayer member={member} density="modal" slot="back" mode="anchored" />
                </div>
              ) : null}
              <Portrait member={member} variant="standee-bottom" asset="portrait" />
              {status === "active" ? (
                <div className="pointer-events-none absolute inset-0">
                  <MemberAuraLayer member={member} density="modal" slot="front" />
                </div>
              ) : null}
              {status === "closed" || status === "quit" ? (
                <StatusOverlay status={status} placement="modal" />
              ) : null}
            </div>
            <div className="aura-glass-strong relative z-10 w-full rounded-2xl px-4 py-3 text-center shadow-[0_18px_50px_-18px_rgba(15,23,42,0.32)]">
              <Eyebrow>// file.{caseFileNumber(member.id).toLowerCase()}</Eyebrow>
              <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight text-aura-ink">
                {member.firstName}
              </h2>
              <p className="mt-1 font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
                {statusLabel}
              </p>
            </div>
          </aside>

          <div className="relative z-10 flex min-h-0 flex-col">
            <div className="flex items-center justify-between gap-4 px-6 pb-2 pt-7 md:hidden">
              <div className="flex items-center gap-3">
                <span className="relative inline-block shrink-0">
                  <Portrait member={member} variant="row" />
                </span>
                <div>
                  <Eyebrow>// file.{caseFileNumber(member.id).toLowerCase()}</Eyebrow>
                  <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight">
                    {member.firstName}
                  </h2>
                  <p className="mt-0.5 font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
                    {statusLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-4 px-7 pt-7 md:flex">
              <span className="relative inline-flex shrink-0 rounded-full ring-2 ring-white/90 shadow-[0_10px_28px_-12px_rgba(15,23,42,0.45)]">
                <Portrait member={member} variant="row" />
              </span>
              <div>
                <Eyebrow>// member.snapshot</Eyebrow>
                <h2 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight text-aura-ink">
                  {member.firstName}
                </h2>
                <p className="mt-0.5 font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
                  {statusLabel}
                </p>
              </div>
            </div>

            <div className="px-6 pb-5 pt-4 md:px-7 md:pt-4">
              <section>
                <Eyebrow>// public profile</Eyebrow>
                <div className="mt-1.5 space-y-1.5 text-body text-aura-muted">
                  {publicProfileLead === undefined ? (
                    <p>No public profile line on file.</p>
                  ) : (
                    <p>{publicProfileLead}</p>
                  )}
                </div>
              </section>

              <MemberIntelBoard
                member={member}
                profile={profile}
                revealAllDetails={revealAllDetails}
              />

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
                {request !== undefined ? (
                  <section>
                    <Eyebrow>// current ask</Eyebrow>
                    <p className="mt-2 rounded-2xl bg-white/55 px-4 py-3 text-body text-aura-ink/85 ring-1 ring-aura-hairline">
                      {request.text}
                    </p>
                  </section>
                ) : null}

                <section>
                  <Eyebrow>// filed reads</Eyebrow>
                  {profile.revealedReads.length === 0 ? (
                    <p className="mt-2 text-label text-aura-muted">
                      No player-facing reads filed yet. Run a date to learn how this file moves.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {profile.revealedReads.map((read) => (
                        <li
                          key={read.id}
                          className="rounded-2xl bg-white/55 p-3 ring-1 ring-aura-hairline"
                        >
                          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                            {readKindLabel(read.readKind, read.confidence)}
                          </p>
                          <p className="mt-1 text-label leading-snug text-aura-ink/85">
                            {read.readText}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              {status === "closed" ? (
                <p className="mt-6 rounded-2xl border border-aura-hairline bg-aura-cream-soft px-4 py-3 text-sm text-aura-muted">
                  Case closed. Cupid filed this pair as complete.
                </p>
              ) : null}
              {status === "quit" ? (
                <p className="mt-6 rounded-2xl border border-aura-rose/30 bg-aura-rose/5 px-4 py-3 text-sm text-aura-rose">
                  Cancelled membership. This member is no longer using the app.
                </p>
              ) : null}
              <div className="h-2" aria-hidden />
            </div>

            {primaryAction === undefined && secondaryAction === undefined ? null : (
              <div className="relative shrink-0 px-6 pb-6 pt-3 md:px-9 md:pb-8">
                <div className="relative flex items-center justify-end gap-3">
                  {secondaryAction === undefined ? null : (
                    <button
                      type="button"
                      onClick={secondaryAction.onClick}
                      disabled={secondaryAction.disabled}
                      data-sfx="click"
                      className="cursor-pointer rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:text-aura-ink disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {secondaryAction.label}
                    </button>
                  )}
                  {primaryAction === undefined ? null : (
                    <button
                      type="button"
                      onClick={primaryAction.onClick}
                      disabled={primaryAction.disabled}
                      data-sfx="primary"
                      className="aura-cta cursor-pointer rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-6 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta ring-1 ring-white/40 ring-inset transition hover:-translate-y-px hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {primaryAction.label}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type RedactedBlock = VisibleMemberProfile["redactedBlocks"][number];

function MemberIntelBoard({
  member,
  profile,
  revealAllDetails,
}: {
  member: Member;
  profile: VisibleMemberProfile;
  revealAllDetails: boolean;
}) {
  const profileContinuation = profile.publicFragments.slice(1);
  const profileBlock = findRedactedBlock(profile, "profile:remainder");
  const needsBlock = findRedactedBlock(profile, "needs:sealed");
  const boundaryBlock = findRedactedBlock(profile, "dealbreakers:sealed");
  const needsReads = profile.revealedReads.filter(
    (read) => read.readKind === "comfort" || read.readKind === "ask",
  );
  const boundaryReads = profile.revealedReads.filter((read) => read.readKind === "boundary");

  return (
    <section className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Eyebrow>{revealAllDetails ? "// dev.unveiled" : "// case intel"}</Eyebrow>
        <span className="rounded-pill bg-aura-rose/5 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.2em] text-aura-rose/70 ring-1 ring-aura-rose/20">
          {revealAllDetails ? "preview only" : "filed reads only"}
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl bg-aura-hairline ring-1 ring-aura-hairline">
        <div className="grid gap-px lg:grid-cols-2 xl:grid-cols-3">
          <IntelCell title="identity">
            {revealAllDetails ? (
              <dl className="mt-3 space-y-2 text-label">
                <UnveiledRow label="species" value={member.species} />
                <UnveiledRow label="origin" value={member.origin} />
                <UnveiledRow label="dimension" value={member.dimension} />
                <UnveiledRow label="reality" value={member.realityStatus} />
              </dl>
            ) : (
              <SealedLines lineCount={4} />
            )}
          </IntelCell>

          <IntelCell title="current state">
            {revealAllDetails ? (
              <div className="mt-3 grid gap-2">
                <StateMeter label="Mood" value={member.state.mood} />
                <StateMeter label="Openness" value={member.state.openness} />
                <StateMeter label="Burnout" value={member.state.burnout} />
                <StateMeter label="Retention" value={member.state.retention} />
              </div>
            ) : (
              <SealedLines lineCount={4} />
            )}
          </IntelCell>

          <IntelCell title="profile continues">
            {profileContinuation.length > 0 ? (
              <div className="mt-2 space-y-1.5 text-label leading-snug text-aura-ink/85">
                {profileContinuation.map((fragment) => (
                  <p key={fragment}>{fragment}</p>
                ))}
              </div>
            ) : profileBlock !== undefined ? (
              <SealedLines lineCount={profileBlock.lineCount} />
            ) : (
              <p className="mt-2 text-label text-aura-muted">No extra profile read filed.</p>
            )}
            {revealAllDetails ? (
              <div className="mt-3 border-t border-aura-hairline pt-3">
                <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/80">
                  bio
                </p>
                <p className="mt-2 text-label leading-snug text-aura-ink/85">{member.bio}</p>
              </div>
            ) : null}
          </IntelCell>

          <IntelCell title="looking for">
            {revealAllDetails ? (
              <IntelList items={member.relationshipNeeds} emptyText="No needs on file." />
            ) : needsReads.length > 0 ? (
              <FiledReadSummary reads={needsReads} />
            ) : (
              <SealedLines lineCount={lineCountFor(needsBlock, 3)} />
            )}
          </IntelCell>

          <IntelCell title="preferences">
            {revealAllDetails ? (
              <IntelList items={member.preferences} emptyText="No soft reads filed." />
            ) : (
              <SealedLines lineCount={3} />
            )}
          </IntelCell>

          <IntelCell title="dealbreakers">
            {revealAllDetails ? (
              <IntelList items={member.dealbreakers} emptyText="None on file." />
            ) : boundaryReads.length > 0 ? (
              <FiledReadSummary reads={boundaryReads} />
            ) : (
              <SealedLines lineCount={lineCountFor(boundaryBlock, 3)} />
            )}
          </IntelCell>
        </div>
      </div>
    </section>
  );
}

function findRedactedBlock(
  profile: VisibleMemberProfile,
  idFragment: string,
): RedactedBlock | undefined {
  return profile.redactedBlocks.find((block) => block.id.includes(idFragment));
}

function lineCountFor(block: RedactedBlock | undefined, fallback: number): number {
  return block?.lineCount ?? fallback;
}

function IntelCell({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article className={`min-h-[6.5rem] bg-white/55 p-3 ${className}`}>
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose/80">
        {title}
      </p>
      {children}
    </article>
  );
}

function UnveiledRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.75rem_1fr] gap-2">
      <dt className="font-mono text-micro uppercase tracking-[0.2em] text-aura-rose/65">{label}</dt>
      <dd className="text-aura-ink/85">{value}</dd>
    </div>
  );
}

function StateMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 font-mono text-micro uppercase tracking-[0.2em]">
        <span className="text-aura-rose/65">{label}</span>
        <span className="tabular-nums text-aura-ink">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-aura-hairline">
        <div className={`h-full rounded-pill bg-aura-rose ${scoreWidthClass(value)}`} />
      </div>
    </div>
  );
}

function IntelList({
  items,
  emptyText = "No entries on file.",
}: {
  items: readonly string[];
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p className="mt-2 text-label text-aura-muted">{emptyText}</p>;
  }

  return (
    <ul className="mt-2 grid gap-1.5">
      {items.map((item) => (
        <li key={item} className="text-label leading-snug text-aura-ink/85">
          {item}
        </li>
      ))}
    </ul>
  );
}

function FiledReadSummary({ reads }: { reads: readonly PlayerKnowledgeRecord[] }) {
  return (
    <ul className="mt-2 grid gap-1.5">
      {reads.map((read) => (
        <li key={read.id} className="rounded-tile bg-aura-rose/5 px-2.5 py-1.5">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-rose">
            {readKindLabel(read.readKind, read.confidence)}
          </p>
          <p className="mt-1 text-label leading-snug text-aura-ink/85">{read.readText}</p>
        </li>
      ))}
    </ul>
  );
}

function SealedLines({ lineCount }: { lineCount: number }) {
  const normalizedCount = Math.min(Math.max(lineCount, 1), 5);

  return (
    <>
      <div className="mt-3 space-y-1.5" aria-hidden>
        {Array.from({ length: normalizedCount }, (_, lineIndex) => (
          <span key={lineIndex} className="block h-2 rounded-pill bg-aura-hairline last:w-2/3" />
        ))}
      </div>
      <p className="mt-3 font-mono text-micro uppercase tracking-[0.2em] text-aura-rose/80">
        sealed
      </p>
    </>
  );
}

function ModalTint() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-70 mix-blend-soft-light"
    >
      <div className="absolute -left-24 -top-32 size-[28rem] rounded-full bg-[var(--char-from)] blur-3xl" />
      <div className="absolute -right-24 top-20 size-[26rem] rounded-full bg-[var(--char-via)] blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 size-[30rem] rounded-full bg-[var(--char-to)] blur-3xl" />
    </div>
  );
}

function ModalCloseTab({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      data-sfx="click"
      aria-label="Close file"
      className="absolute right-4 top-4 z-30 grid size-9 cursor-pointer place-items-center rounded-full bg-white/85 text-aura-muted shadow-quiet ring-1 ring-aura-hairline transition hover:bg-white hover:text-aura-ink"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden>
        <path
          d="M3 3L13 13M13 3L3 13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

function readKindLabel(
  readKind: PlayerKnowledgeRecord["readKind"],
  confidence: PlayerKnowledgeRecord["confidence"],
): string {
  if (readKind === "pair_dynamic") {
    return confidence === "confirmed" ? "confirmed pair read" : "filed pair read";
  }
  if (readKind === "scenario_pressure") {
    return confidence === "confirmed" ? "confirmed room read" : "filed room read";
  }
  return confidence === "confirmed" ? `confirmed ${readKind}` : `filed ${readKind}`;
}
