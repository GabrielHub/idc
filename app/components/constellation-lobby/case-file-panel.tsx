/**
 * Case file panel — the inline zoom view triggered from HoverDetailCard's
 * "Open case" or a double-click on a star in the constellation field. The
 * camera lerps to the star (the caller wires `cameraTarget` for that), the
 * field backdrop dims via a scrim, and this panel slides in on the right.
 *
 * Composition is deliberately thin: it reuses MemberIntelBoard, SealedLines,
 * and FiledReadSummary from the existing MemberDetailsModal so the sealed-
 * line rendering and filed-reads stay visually identical to the Roster
 * room's open-file experience.
 *
 * Closing: ESC keypress or scrim click. The caller restores the prior
 * camera target by handling onClose (set selected case to null).
 */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

import type { GameSave, Member, PlayerKnowledgeRecord } from "../../domain/game";
import { PortraitChip } from "../../routes/constellation-lobby-spike";
import { caseFileNumber } from "../member-card-atoms";
import { MemberIntelBoard } from "../member-details-modal";
import { resolvePortraitPalette } from "../portrait-palette";
import { buildVisibleMemberProfile } from "../../services/player-knowledge";
import { readKindLabel } from "../date-view-transcript";

export type CaseFilePanelProps = {
  member: Member;
  playerKnowledge: readonly PlayerKnowledgeRecord[];
  revealAllDetails?: boolean;
  /** When provided, lets MemberIntelBoard's tutorial-coachmark path work. */
  save?: GameSave;
  isFocused: boolean;
  /** Closure indicator surfaced at the bottom (closed_won, closed_lost, quit). */
  status: "active" | "closed" | "quit";
  /** Optional context-aware action row. */
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  onClose: () => void;
};

export function CaseFilePanel({
  member,
  playerKnowledge,
  revealAllDetails = false,
  isFocused,
  status,
  primaryAction,
  secondaryAction,
  onClose,
}: CaseFilePanelProps) {
  const palette = useMemo(() => resolvePortraitPalette(member), [member]);
  const profile = useMemo(
    () =>
      buildVisibleMemberProfile(member, playerKnowledge, {
        visibilityMode: revealAllDetails ? "dev_unveiled" : "earned",
      }),
    [member, playerKnowledge, revealAllDetails],
  );
  const fileNumber = caseFileNumber(member.id);
  const publicProfileLead = profile.publicFragments[0];
  const otherReads = profile.revealedReads.filter(
    (read) =>
      read.readKind !== "ask" && read.readKind !== "comfort" && read.readKind !== "boundary",
  );

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const statusLabel = (() => {
    if (status === "closed") return "case closed";
    if (status === "quit") return "cancelled membership";
    return isFocused ? "focus case" : "active file";
  })();
  const statusBadgeClass = (() => {
    if (status === "closed") return "bg-emerald-500/15 text-emerald-200 ring-emerald-300/30";
    if (status === "quit") return "bg-rose-500/15 text-rose-200 ring-rose-300/30";
    return isFocused
      ? "bg-aura-rose/20 text-aura-rose ring-aura-rose/30"
      : "bg-white/10 text-white/70 ring-white/15";
  })();

  return (
    <AnimatePresence>
      <motion.div
        key="case-file-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 0.8, 0.2, 1] }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-[#07041a]/55 backdrop-blur-sm"
      >
        <motion.aside
          key="case-file-panel"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.36, ease: [0.22, 0.8, 0.2, 1] }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${member.firstName} case file`}
          className="aura-liquid-glass aura-liquid-glass-hover absolute right-0 top-0 z-10 flex h-full w-full max-w-[680px] flex-col overflow-y-auto rounded-l-card border-l border-white/10 px-7 pb-8 pt-7 shadow-[0_-30px_60px_-30px_rgba(0,0,0,0.5)]"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close case file"
            className="absolute right-4 top-4 z-30 grid size-9 cursor-pointer place-items-center rounded-full bg-white/15 text-white/80 ring-1 ring-white/15 transition hover:bg-white/25 hover:text-aura-paper"
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

          <header className="flex items-start gap-4">
            <PortraitChip member={member} palette={palette} accent={palette.accent} size={72} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose/85">
                // file.{fileNumber.toLowerCase()}
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-aura-paper">
                {member.firstName}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-micro uppercase tracking-[0.2em] ring-1 ${statusBadgeClass}`}
                >
                  {statusLabel}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-micro uppercase tracking-[0.2em] text-white/70 ring-1 ring-white/15">
                  {formatHeightShort(member.characterHeightInInches)}
                </span>
              </div>
            </div>
          </header>

          <section className="mt-6">
            <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose/80">
              // public profile
            </p>
            <div className="mt-1.5 space-y-1.5 text-body text-white/85">
              {publicProfileLead === undefined ? (
                <p>No public profile line on file.</p>
              ) : (
                <p>{publicProfileLead}</p>
              )}
            </div>
          </section>

          <MemberIntelBoard member={member} profile={profile} revealAllDetails={revealAllDetails} />

          <section className="mt-5">
            <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose/80">
              // filed reads
            </p>
            {profile.revealedReads.length === 0 ? (
              <p className="mt-2 text-label text-white/65">
                No player-facing reads filed yet. Run a date to learn how this file moves.
              </p>
            ) : otherReads.length === 0 ? (
              <p className="mt-2 text-label text-white/65">
                Filed reads are surfaced in the intel board above.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {otherReads.map((read) => (
                  <li key={read.id} className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/12">
                    <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                      {readKindLabel(read)}
                    </p>
                    <p className="mt-1 text-label leading-snug text-white/85">{read.readText}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {status === "closed" ? (
            <p className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Case closed. Cupid filed this pair as complete.
            </p>
          ) : null}
          {status === "quit" ? (
            <p className="mt-6 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              Cancelled membership. This member is no longer using the app.
            </p>
          ) : null}

          {primaryAction === undefined && secondaryAction === undefined ? null : (
            <div className="mt-auto flex items-center justify-end gap-3 pt-6">
              {secondaryAction === undefined ? null : (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled}
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 aura-liquid-glass aura-liquid-glass-hover rounded-full px-4 py-1.5 font-display text-label text-aura-paper"
                >
                  {secondaryAction.label}
                </button>
              )}
              {primaryAction === undefined ? null : (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 aura-liquid-cta rounded-full px-5 py-2 font-display text-label"
                >
                  {primaryAction.label}
                </button>
              )}
            </div>
          )}
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}

function formatHeightShort(heightInInches: number): string {
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches - feet * 12;
  return `${feet}'${inches}"`;
}
