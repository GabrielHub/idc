/**
 * Case file modal — the centered, full-detail surface triggered from
 * HoverDetailCard's "View case" CTA or a double-click on a star in the
 * constellation field.
 *
 * Visual contract:
 *   - Shared `layoutId` matches the HoverDetailCard so Motion drives a
 *     smooth shared-layout morph from the anchored dossier into this
 *     centered modal — the small card visibly grows into the full file.
 *   - One unified glass shell: a single palette wash flows diagonally across
 *     the whole modal, strongest near the portrait and receding into the
 *     content side, so the portrait reads as part of the same surface
 *     rather than a separate column.
 *   - Portrait column renders the neutral standee `Portrait` with both
 *     `MemberAuraLayer` slots so the aura still moves around the figure.
 *
 * Closing: ESC keypress or scrim click.
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

import type { GameSave, Member, PlayerKnowledgeRecord } from "../../domain/game";
import { caseFileNumber, StatusOverlay } from "../member-card-atoms";
import { Portrait } from "../dashboard-atoms";
import { MemberAuraLayer } from "../member-aura";
import { MemberIntelBoard } from "../member-details-modal";
import { paletteToCssVars, resolvePortraitPalette } from "../portrait-palette";
import { buildVisibleMemberProfile } from "../../services/player-knowledge";
import { readKindLabel } from "../date-view-transcript";
import { formatHeightShort } from "./math";

export type CaseFilePanelProps = {
  member: Member;
  playerKnowledge: readonly PlayerKnowledgeRecord[];
  revealAllDetails?: boolean;
  /** Passed through for parity with the previous panel; not yet consumed. */
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
  const reducedMotion = useReducedMotion() === true;

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

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const statusLabel = (() => {
    if (status === "closed") return "case closed";
    if (status === "quit") return "cancelled membership";
    return isFocused ? "focus case" : "active file";
  })();
  const statusBadgeClass = (() => {
    if (status === "closed") return "aura-liquid-glass text-emerald-100";
    if (status === "quit") return "aura-liquid-glass aura-liquid-glass-rose text-rose-100";
    return isFocused
      ? "aura-liquid-glass aura-liquid-glass-rose text-aura-paper"
      : "aura-liquid-glass text-white/75";
  })();

  // Same shared-layout transition the HoverDetailCard uses, so the spring
  // shape (stiffness/damping) reads identically across the morph.
  const morphTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.7 };

  return (
    <AnimatePresence>
      <motion.div
        key="case-file-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 0.8, 0.2, 1] }}
        onClick={onClose}
        className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-[#07041a]/65 px-4 py-4 backdrop-blur-md md:px-8 md:py-8"
      >
        <motion.div
          key="case-file-modal"
          layoutId={`constellation-case-card-${member.id}`}
          transition={morphTransition}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${member.firstName} case file`}
          style={paletteToCssVars(palette)}
          className="aura-liquid-glass relative grid max-h-[min(1080px,calc(100vh-3rem))] w-full max-w-[1440px] grid-cols-1 overflow-hidden rounded-card md:grid-cols-[minmax(420px,520px)_minmax(0,1fr)]"
        >
          {/*
           * Single palette wash that flows across the entire modal — strongest
           * in the top-left where the portrait sits and receding into the
           * content side. This is what makes the portrait read as part of the
           * glass shell rather than a separate panel.
           */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--char-from)]/24 via-[var(--char-via)]/10 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_28%,var(--char-accent-glow)_0%,transparent_55%)] opacity-45" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_92%,var(--char-via-wash)_0%,transparent_45%)] opacity-30" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07041a]/24 to-transparent" />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close case file"
            className="aura-liquid-glass aura-liquid-glass-hover absolute right-5 top-5 z-30 grid size-10 cursor-pointer place-items-center rounded-full text-white/85 transition hover:text-aura-paper"
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

          <aside className="relative z-10 hidden min-h-[680px] overflow-hidden md:block">
            {status === "active" ? (
              <div className="pointer-events-none absolute inset-0 z-[1] [mask-image:radial-gradient(ellipse_60%_72%_at_45%_58%,black_55%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_60%_72%_at_45%_58%,black_55%,transparent_100%)]">
                <MemberAuraLayer member={member} density="modal" slot="back" mode="anchored" />
              </div>
            ) : null}
            <div className="absolute inset-0 z-[2] [mask-image:linear-gradient(to_right,black_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_72%,transparent_100%)]">
              <Portrait member={member} variant="standee-bottom" asset="portrait" />
            </div>
            {status === "active" ? (
              <div className="pointer-events-none absolute inset-0 z-[3] [mask-image:linear-gradient(to_right,black_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_72%,transparent_100%)]">
                <MemberAuraLayer member={member} density="modal" slot="front" />
              </div>
            ) : null}
            {status === "closed" || status === "quit" ? (
              <div className="absolute inset-0 z-[4]">
                <StatusOverlay status={status} placement="modal" />
              </div>
            ) : null}
          </aside>

          <div className="relative z-10 flex min-h-0 flex-col overflow-y-auto px-7 pb-8 pt-8 md:px-10 md:pb-10 md:pt-12">
            <div className="mb-5 flex items-center gap-3 md:hidden">
              <div
                className="relative size-14 shrink-0 overflow-hidden rounded-full"
                style={{
                  background: `linear-gradient(160deg, ${palette.from}, ${palette.to})`,
                  boxShadow: `0 0 0 1.5px ${palette.accent}, 0 0 18px rgba(0,0,0,0.18)`,
                }}
              >
                <Portrait member={member} variant="row" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose/85">
                  // file.{fileNumber.toLowerCase()}
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-aura-paper">
                  {member.firstName}
                </h2>
              </div>
            </div>

            <header className="hidden md:block">
              <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-rose/85">
                // file.{fileNumber.toLowerCase()}
              </p>
              <h2 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-aura-paper">
                {member.firstName}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 font-mono text-micro uppercase tracking-[0.2em] ring-1 ${statusBadgeClass}`}
                >
                  {statusLabel}
                </span>
                <span className="aura-liquid-glass rounded-full px-3 py-1 font-mono text-micro uppercase tracking-[0.2em] text-white/75">
                  {formatHeightShort(member.characterHeightInInches)}
                </span>
                <span className="aura-liquid-glass rounded-full px-3 py-1 font-mono text-micro uppercase tracking-[0.2em] text-white/75">
                  {profile.revealedReads.length} read · {profile.redactedBlocks.length} sealed
                </span>
              </div>
            </header>

            <section className="aura-liquid-glass mt-6 rounded-3xl px-5 py-4">
              <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-rose/85">
                // public profile
              </p>
              <div className="mt-2 space-y-2 text-body leading-relaxed text-white/90">
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
              theme="glass"
            />

            <section className="aura-liquid-glass mt-6 rounded-3xl px-5 py-4">
              <p className="font-mono text-micro uppercase tracking-[0.24em] text-aura-rose/85">
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
                <ul className="mt-3 space-y-2">
                  {otherReads.map((read) => (
                    <li key={read.id} className="aura-liquid-glass rounded-2xl p-3">
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
              <p className="aura-liquid-glass mt-6 rounded-3xl px-5 py-4 text-sm text-emerald-100">
                Case closed. Cupid filed this pair as complete.
              </p>
            ) : null}
            {status === "quit" ? (
              <p className="aura-liquid-glass aura-liquid-glass-rose mt-6 rounded-3xl px-5 py-4 text-sm text-rose-100">
                Cancelled membership. This member is no longer using the app.
              </p>
            ) : null}

            {primaryAction === undefined && secondaryAction === undefined ? null : (
              <div className="mt-auto flex flex-wrap items-center justify-end gap-3 pt-8">
                {secondaryAction === undefined ? null : (
                  <button
                    type="button"
                    onClick={secondaryAction.onClick}
                    disabled={secondaryAction.disabled}
                    className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-5 py-2 font-display text-label text-aura-paper disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {secondaryAction.label}
                  </button>
                )}
                {primaryAction === undefined ? null : (
                  <button
                    type="button"
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.disabled}
                    className="aura-liquid-cta cursor-pointer rounded-full px-6 py-2.5 font-display text-label disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {primaryAction.label}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
