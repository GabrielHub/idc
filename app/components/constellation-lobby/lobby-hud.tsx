import { type ReactNode, type Ref } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { Member } from "../../domain/game";
import type { PortraitPalette } from "../portrait-palette";
import { avatarSrcsetFor, withAlpha } from "./math";
import type { LobbyState, StarMark } from "./types";

export function SideRail({
  focus,
  partner,
  intentSlot,
  intentSlotRef,
  pairDossierSlot,
  containerRef,
  onClearFocus,
  onClearPartner,
}: {
  focus: StarMark | undefined;
  partner: StarMark | undefined;
  intentSlot?: ReactNode;
  intentSlotRef?: Ref<HTMLDivElement>;
  pairDossierSlot?: ReactNode;
  containerRef?: Ref<HTMLDivElement>;
  onClearFocus?: () => void;
  onClearPartner?: () => void;
}) {
  // Pair cards only mount once a partner is locked in — until then the
  // inline focus pill on the focused star handles the selection feedback
  // (see canvas-convention.tsx StarSprite). The cards live in the bottom-
  // center band so they sit above the BottomDock's right-corner CTAs
  // without occluding the scenario cards or the constellation field.
  const showPairCards = focus !== undefined && partner !== undefined;
  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-0 bottom-24 z-30 flex flex-col items-center gap-3 px-6"
    >
      <AnimatePresence>
        {showPairCards ? (
          <motion.div
            key="pair-row"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.32, ease: [0.22, 0.8, 0.2, 1] }}
            className="flex items-stretch justify-center gap-3"
          >
            <PairCard role="focus" star={focus} accent="#fb7185" onClear={onClearFocus} />
            <PairCard role="partner" star={partner} accent="#c4b5fd" onClear={onClearPartner} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {intentSlot === undefined ? null : (
        <div ref={intentSlotRef} className="pointer-events-auto max-w-[44rem]">
          {intentSlot}
        </div>
      )}
      {pairDossierSlot === undefined ? null : (
        <div className="pointer-events-auto w-[280px]">{pairDossierSlot}</div>
      )}
    </div>
  );
}

function PairCard({
  role,
  star,
  accent,
  onClear,
}: {
  role: "focus" | "partner";
  star: StarMark;
  accent: string;
  onClear?: () => void;
}) {
  const surface = role === "focus" ? "aura-liquid-glass-rose" : "aura-liquid-glass-violet";
  return (
    <div
      className={`group pointer-events-auto aura-liquid-glass ${surface} aura-liquid-glass-hover w-[280px] rounded-card px-4 py-3`}
    >
      <div className="flex items-center justify-between gap-2">
        <RoleHeader role={role} />
        {onClear === undefined ? null : (
          <button
            type="button"
            onClick={onClear}
            aria-label={role === "focus" ? "Drop focus selection" : "Drop partner selection"}
            className="grid size-6 cursor-pointer place-items-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-aura-paper"
          >
            <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden>
              <path
                d="M3 3L13 13M13 3L3 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
      <MemberRow member={star.member} palette={star.palette} accent={accent} />
    </div>
  );
}

function RoleHeader({ role }: { role: "focus" | "partner" }) {
  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.22em] ${role === "focus" ? "text-rose-200" : "text-violet-200"}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${role === "focus" ? "bg-aura-rose" : "bg-aura-violet"}`}
      />
      {role === "focus" ? "focus case" : "partner"}
    </div>
  );
}

function MemberRow({
  member,
  palette,
  accent,
}: {
  member: Member;
  palette: PortraitPalette;
  accent: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <PortraitChip member={member} palette={palette} accent={accent} />
      <div className="min-w-0 leading-tight">
        <div className="truncate font-display text-display-sm text-aura-paper group-hover:overflow-visible group-hover:whitespace-normal">
          {member.firstName}
        </div>
        <div className="truncate font-mono text-micro uppercase tracking-[0.16em] text-white/70 group-hover:overflow-visible group-hover:whitespace-normal">
          {member.origin}
        </div>
      </div>
    </div>
  );
}

function PortraitChip({
  member,
  palette,
  accent,
  size = 48,
}: {
  member: Member;
  palette: PortraitPalette;
  accent: string;
  size?: number;
}) {
  const srcset = avatarSrcsetFor(member.id);
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `linear-gradient(160deg, ${palette.from}, ${palette.to})`,
        boxShadow: `0 0 0 1.5px ${accent}, 0 0 18px ${withAlpha(accent, 0.5)}`,
      }}
    >
      <img
        src={srcset.src}
        srcSet={srcset.srcset}
        sizes={`${size}px`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top"
        loading="lazy"
      />
    </div>
  );
}

export function BottomDock({
  state,
  selectedScenarioId,
  onCommitPair,
  onBeginDate,
  onCancelPair,
  commitDisabled,
  commitDisabledReason,
  beginDisabled,
  beginDisabledReason,
  beginButtonRef,
  briefSlot,
}: {
  state: LobbyState;
  selectedScenarioId: string | null;
  onCommitPair?: () => void;
  onBeginDate?: () => void;
  onCancelPair?: () => void;
  commitDisabled?: boolean;
  commitDisabledReason?: string;
  beginDisabled?: boolean;
  beginDisabledReason?: string;
  beginButtonRef?: Ref<HTMLButtonElement>;
  /**
   * Slot for the shift-brief pill. Sits inline with the Cancel / Begin CTAs in
   * the bottom-right cluster, except when both Cancel and Commit render
   * (partner_selected) — there the brief stacks above the button row so the
   * wide CTAs aren't crowded and the brief fills the empty vertical space.
   */
  briefSlot?: ReactNode;
}) {
  const showCommit = state === "partner_selected" && onCommitPair !== undefined;
  const showBegin =
    state === "scenario_chosen" && selectedScenarioId !== null && onBeginDate !== undefined;
  const commitBlocked = commitDisabled === true;
  const beginBlocked = beginDisabled === true;
  const showCommitReason = showCommit && commitBlocked && commitDisabledReason !== undefined;
  const showBeginReason = showBegin && beginBlocked && beginDisabledReason !== undefined;
  const showCancelPair = state === "partner_selected";
  // The "Pair locked" hint is redundant when a more specific block reason is
  // showing alongside; the reason supersedes it. Otherwise (e.g. plain idle on
  // scenario_chosen with no block) keep the lock notice.
  const lockedPair =
    (state === "committed_pair" || state === "scenario_chosen") && !showBeginReason;

  if (!showCancelPair && !showCommit && !showBegin && !lockedPair && briefSlot === undefined) {
    return null;
  }

  const stackBriefAbove = showCancelPair && showCommit;

  const ctaRow = (
    <>
      {showCancelPair ? <ShardButton label="Cancel pair" onClick={onCancelPair} /> : null}
      {lockedPair ? <ShardLabel label="Pair locked" /> : null}
      {showCommitReason ? <ShardLabel label={commitDisabledReason} /> : null}
      {showCommit ? (
        <button
          type="button"
          disabled={commitBlocked}
          title={commitDisabledReason}
          onClick={onCommitPair}
          className="aura-liquid-cta cursor-pointer rounded-full px-7 py-3 font-display text-display-sm disabled:cursor-not-allowed disabled:opacity-55"
        >
          Commit pair
        </button>
      ) : null}
      {showBeginReason ? <ShardLabel label={beginDisabledReason} /> : null}
      {showBegin ? (
        <button
          ref={beginButtonRef}
          type="button"
          disabled={beginBlocked}
          title={beginDisabledReason}
          onClick={onBeginDate}
          className="aura-liquid-cta cursor-pointer rounded-full px-7 py-3 font-display text-display-sm disabled:cursor-not-allowed disabled:opacity-55"
        >
          Begin date
        </button>
      ) : null}
    </>
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-end gap-4 px-6 pb-6">
      {stackBriefAbove ? (
        <div className="pointer-events-auto flex flex-col items-end gap-3">
          {briefSlot}
          <div className="flex items-end gap-3">{ctaRow}</div>
        </div>
      ) : (
        <div className="pointer-events-auto flex items-end gap-3">
          {briefSlot}
          {ctaRow}
        </div>
      )}
    </div>
  );
}

function ShardLabel({ label }: { label: string }) {
  return (
    <span className="aura-liquid-glass rounded-full px-5 py-2.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-paper/80">
      {label}
    </span>
  );
}

function ShardButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-7 py-3 font-display text-display-sm text-aura-paper"
    >
      {label}
    </button>
  );
}

type CalloutTone = "rose" | "amber" | "neutral";

export type Callout = {
  id: string;
  tone: CalloutTone;
  eyebrow: string;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
};

export function CalloutCluster({
  callouts,
  calloutRefs,
}: {
  callouts: Callout[];
  /**
   * Optional per-callout refs keyed by `callout.id`. Used by the planning
   * tutorial to anchor coach marks on specific situational callouts (e.g.
   * pointing at the closures-ready callout when a focused pair becomes
   * closable for the first time).
   */
  calloutRefs?: Partial<Record<string, Ref<HTMLDivElement>>>;
}) {
  if (callouts.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.36, ease: [0.22, 0.8, 0.2, 1] }}
      className="pointer-events-none absolute bottom-[120px] left-6 z-30 flex w-[360px] flex-col gap-3"
    >
      {callouts.map((callout) => (
        <CalloutCard key={callout.id} callout={callout} cardRef={calloutRefs?.[callout.id]} />
      ))}
    </motion.div>
  );
}

function CalloutCard({ callout, cardRef }: { callout: Callout; cardRef?: Ref<HTMLDivElement> }) {
  const toneSurface =
    callout.tone === "rose"
      ? "aura-liquid-glass-rose"
      : callout.tone === "amber"
        ? "aura-liquid-glass-amber"
        : "";
  const toneEyebrow =
    callout.tone === "rose"
      ? "text-aura-rose"
      : callout.tone === "amber"
        ? "text-aura-amber"
        : "text-white/65";
  return (
    <div
      ref={cardRef}
      className={`pointer-events-auto aura-liquid-glass ${toneSurface} aura-liquid-glass-hover rounded-card px-5 py-4`}
    >
      <div className={`font-mono text-micro uppercase tracking-[0.18em] ${toneEyebrow}`}>
        {callout.eyebrow}
      </div>
      <div className="mt-1 font-display text-display-sm text-aura-paper">{callout.title}</div>
      {callout.body === undefined ? null : (
        <div className="mt-1 font-sans text-label text-white/70">{callout.body}</div>
      )}
      {callout.action === undefined ? null : (
        <button
          type="button"
          onClick={callout.action.onClick}
          className="mt-3 aura-liquid-glass aura-liquid-glass-ink aura-liquid-glass-hover cursor-pointer rounded-full px-4 py-1.5 font-display text-label"
        >
          {callout.action.label}
        </button>
      )}
    </div>
  );
}
