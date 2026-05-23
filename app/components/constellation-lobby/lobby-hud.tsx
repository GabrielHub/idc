import { type ReactNode, type Ref } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { Member } from "../../domain/game";
import type { PortraitPalette } from "../portrait-palette";
import { avatarSrcsetFor, withAlpha } from "./math";
import type { LobbyState, StarMark } from "./types";

export function SideRail({
  focus,
  partner,
  pairDossierSlot,
  containerRef,
}: {
  focus: StarMark | undefined;
  partner: StarMark | undefined;
  pairDossierSlot?: ReactNode;
  containerRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute right-6 top-[88px] z-30 flex w-[280px] flex-col gap-3"
    >
      <AnimatePresence>
        {focus !== undefined ? (
          <motion.div
            key="focus-card"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.32, ease: [0.22, 0.8, 0.2, 1] }}
            className="pointer-events-auto aura-liquid-glass aura-liquid-glass-rose aura-liquid-glass-hover rounded-card px-4 py-3"
          >
            <RoleHeader role="focus" />
            <MemberRow member={focus.member} palette={focus.palette} accent="#fb7185" />
          </motion.div>
        ) : null}
        {partner !== undefined ? (
          <motion.div
            key="partner-card"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.32, ease: [0.22, 0.8, 0.2, 1] }}
            className="pointer-events-auto aura-liquid-glass aura-liquid-glass-violet aura-liquid-glass-hover rounded-card px-4 py-3"
          >
            <RoleHeader role="partner" />
            <MemberRow member={partner.member} palette={partner.palette} accent="#c4b5fd" />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {pairDossierSlot}
    </div>
  );
}

function RoleHeader({ role }: { role: "focus" | "partner" }) {
  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.22em] ${role === "focus" ? "text-aura-rose" : "text-aura-violet"}`}
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
        <div className="truncate font-display text-display-sm text-aura-paper">
          {member.firstName}
        </div>
        <div className="truncate font-mono text-micro uppercase tracking-[0.16em] text-white/55">
          {member.origin}
        </div>
      </div>
    </div>
  );
}

export function PortraitChip({
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
  onBeginDate,
  onCancelPair,
  beginDisabled,
  beginButtonRef,
}: {
  state: LobbyState;
  selectedScenarioId: string | null;
  onBeginDate?: () => void;
  onCancelPair?: () => void;
  beginDisabled?: boolean;
  beginButtonRef?: Ref<HTMLButtonElement>;
}) {
  const canBegin =
    (state === "scenario_chosen" ||
      (state === "partner_selected" && selectedScenarioId !== null)) &&
    selectedScenarioId !== null &&
    onBeginDate !== undefined &&
    beginDisabled !== true;
  const showCancelPair = state === "committed_pair" || state === "scenario_chosen";

  if (!showCancelPair && !canBegin) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-end gap-4 px-6 pb-6">
      <div className="pointer-events-auto flex items-center gap-3">
        {showCancelPair ? <ShardButton label="Cancel pair" onClick={onCancelPair} /> : null}
        {canBegin ? (
          <button
            ref={beginButtonRef}
            type="button"
            onClick={onBeginDate}
            className="aura-liquid-cta cursor-pointer rounded-full px-7 py-3 font-display text-display-sm"
          >
            Begin date
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ShardButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-5 py-2.5 font-display text-label text-aura-paper"
    >
      {label}
    </button>
  );
}

export type CalloutTone = "rose" | "amber" | "neutral";

export type Callout = {
  id: string;
  tone: CalloutTone;
  eyebrow: string;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
};

export function CalloutCluster({ callouts }: { callouts: Callout[] }) {
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
        <CalloutCard key={callout.id} callout={callout} />
      ))}
    </motion.div>
  );
}

function CalloutCard({ callout }: { callout: Callout }) {
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
