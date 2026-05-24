import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, type Ref, useEffect, useMemo, useRef, useState } from "react";

import type { GameSave, Member, MemberRequest, PlayerKnowledgeRecord } from "../domain/game";
import { buildVisibleMemberProfile, type VisibleMemberProfile } from "../services/player-knowledge";
import { noopTutorialUpdate, useTutorialStep } from "../services/tutorial";
import { EASE_OUT_QUART, Eyebrow, Portrait } from "./dashboard-atoms";
import { readKindLabel } from "./date-view-transcript";
import { caseFileNumber, HeightChip, StatusOverlay } from "./member-card-atoms";
import { MemberAuraLayer } from "./member-aura";
import { paletteToCssVars, resolvePortraitPalette } from "./portrait-palette";
import { TutorialCoachMark } from "./tutorial";

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
  save?: GameSave;
  onTutorialUpdate?: (next: GameSave) => void;
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
  save,
  onTutorialUpdate,
  onClose,
}: MemberDetailsModalProps) {
  const tutorialUpdate = onTutorialUpdate ?? noopTutorialUpdate;
  const intelBoardRef = useRef<HTMLElement | null>(null);
  const [modalReady, setModalReady] = useState(false);
  const firstOpenStep = useTutorialStep(
    save ?? null,
    "member.file.first-open",
    save !== undefined,
    tutorialUpdate,
  );
  const profile = useMemo(
    () =>
      buildVisibleMemberProfile(member, playerKnowledge, {
        visibilityMode: revealAllDetails ? "dev_unveiled" : "earned",
      }),
    [member, playerKnowledge, revealAllDetails],
  );
  const palette = resolvePortraitPalette(member);
  const status = member.state.status;
  const publicProfileLead = profile.publicFragments[0];
  const statusLabel = memberStatusLabel(status, isFocused);

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
          layout
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.36, ease: EASE_OUT_QUART }}
          onAnimationComplete={() => setModalReady(true)}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${member.firstName} file`}
          style={paletteToCssVars(palette)}
          className="aura-glass-strong relative grid w-full max-w-[108rem] grid-cols-1 overflow-hidden rounded-card md:w-[calc(100vw-2.5rem)] md:grid-cols-[minmax(260px,330px)_minmax(0,1fr)]"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--char-from)]/26 via-[var(--char-via)]/12 to-[var(--char-to)]/16" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,var(--char-accent-wash)_0%,transparent_34%),radial-gradient(ellipse_at_82%_22%,var(--char-via-wash)_0%,transparent_42%),radial-gradient(ellipse_at_46%_82%,var(--char-to-wash)_0%,transparent_60%)] opacity-45" />
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
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
                  {statusLabel}
                </p>
                <HeightChip heightInInches={member.characterHeightInInches} />
              </div>
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
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
                      {statusLabel}
                    </p>
                    <HeightChip heightInInches={member.characterHeightInInches} />
                  </div>
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
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
                    {statusLabel}
                  </p>
                  <HeightChip heightInInches={member.characterHeightInInches} />
                </div>
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
                sectionRef={intelBoardRef}
              />

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
                {request !== undefined ? (
                  <section>
                    <Eyebrow>// current ask</Eyebrow>
                    <p className="aura-glass mt-2 rounded-2xl px-4 py-3 text-body text-aura-ink/85">
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
                        <li key={read.id} className="aura-glass rounded-2xl p-3">
                          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
                            {readKindLabel(read)}
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

        {firstOpenStep.active && modalReady ? (
          <div onClick={(event) => event.stopPropagation()}>
            <TutorialCoachMark
              target={intelBoardRef}
              placement="top"
              title="Files start mostly sealed"
              body="The public profile is what they wrote. Everything else unseals as Cupid files reads from the dates you run."
              primaryLabel="Got it"
              onPrimary={firstOpenStep.complete}
              dismissLabel="Skip tour"
              onDismiss={firstOpenStep.dismiss}
            />
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}

type RedactedBlock = VisibleMemberProfile["redactedBlocks"][number];

export type IntelBoardTheme = "paper" | "glass";

type IntelThemeTokens = {
  shell: string;
  divider: string;
  cell: string;
  bodyText: string;
  mutedText: string;
  pillBg: string;
  pillRing: string;
  pillText: string;
  sealedBar: string;
  readTile: string;
  readText: string;
  cellTitleText: string;
  sealedLabelText: string;
  readLabelText: string;
};

const INTEL_THEME_TOKENS: Record<IntelBoardTheme, IntelThemeTokens> = {
  paper: {
    shell: "aura-glass-flat",
    divider: "gap-2",
    cell: "aura-glass",
    bodyText: "text-aura-ink/85",
    mutedText: "text-aura-muted",
    pillBg: "bg-aura-rose/5",
    pillRing: "ring-aura-rose/20",
    pillText: "text-aura-rose/70",
    sealedBar: "bg-aura-hairline",
    readTile: "aura-glass",
    readText: "text-aura-ink/85",
    cellTitleText: "text-aura-rose/80",
    sealedLabelText: "text-aura-rose/80",
    readLabelText: "text-aura-rose",
  },
  glass: {
    shell: "aura-liquid-glass",
    divider: "gap-2",
    cell: "aura-liquid-glass",
    bodyText: "text-white/85",
    mutedText: "text-white/55",
    pillBg: "bg-rose-300/15",
    pillRing: "ring-rose-300/40",
    pillText: "text-rose-200",
    sealedBar: "bg-white/15",
    readTile: "aura-liquid-glass",
    readText: "text-white/85",
    cellTitleText: "text-rose-300/90",
    sealedLabelText: "text-rose-300/75",
    readLabelText: "text-rose-300",
  },
};

export function MemberIntelBoard({
  member,
  profile,
  revealAllDetails,
  sectionRef,
  theme = "paper",
}: {
  member: Member;
  profile: VisibleMemberProfile;
  revealAllDetails: boolean;
  sectionRef?: Ref<HTMLElement>;
  theme?: IntelBoardTheme;
}) {
  const tokens = INTEL_THEME_TOKENS[theme];
  const profileContinuation = profile.publicFragments.slice(1);
  const profileBlock = findRedactedBlock(profile, "profile:remainder");
  const needsBlock = findRedactedBlock(profile, "needs:sealed");
  const preferencesBlock = findRedactedBlock(profile, "preferences:sealed");
  const boundaryBlock = findRedactedBlock(profile, "dealbreakers:sealed");
  const needsReads = profile.revealedReads.filter((read) => read.readKind === "ask");
  const preferenceReads = profile.revealedReads.filter((read) => read.readKind === "comfort");
  const boundaryReads = profile.revealedReads.filter((read) => read.readKind === "boundary");

  return (
    <section ref={sectionRef} className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Eyebrow>{revealAllDetails ? "// dev.unveiled" : "// case intel"}</Eyebrow>
        <span
          className={`rounded-pill px-2.5 py-1 font-mono text-micro uppercase tracking-[0.2em] ring-1 ${tokens.pillBg} ${tokens.pillRing} ${tokens.pillText}`}
        >
          {revealAllDetails ? "preview only" : "filed reads only"}
        </span>
      </div>

      <div className={`mt-3 overflow-hidden rounded-2xl ring-1 ${tokens.shell}`}>
        <div className={`grid lg:grid-cols-2 xl:grid-cols-4 ${tokens.divider}`}>
          <IntelCell title="profile continues" tokens={tokens}>
            {profileContinuation.length > 0 ? (
              <div className={`mt-2 space-y-1.5 text-label leading-snug ${tokens.bodyText}`}>
                {profileContinuation.map((fragment) => (
                  <p key={fragment}>{fragment}</p>
                ))}
              </div>
            ) : profileBlock !== undefined ? (
              <SealedLines lineCount={profileBlock.lineCount} theme={theme} />
            ) : (
              <p className={`mt-2 text-label ${tokens.mutedText}`}>No extra profile read filed.</p>
            )}
          </IntelCell>

          <IntelCell title="looking for" tokens={tokens}>
            {revealAllDetails ? (
              <IntelList
                items={member.relationshipNeeds}
                emptyText="No needs on file."
                tokens={tokens}
              />
            ) : needsReads.length > 0 ? (
              <FiledReadSummary reads={needsReads} theme={theme} />
            ) : (
              <SealedLines lineCount={lineCountFor(needsBlock, 3)} theme={theme} />
            )}
          </IntelCell>

          <IntelCell title="preferences" tokens={tokens}>
            {revealAllDetails ? (
              <IntelList
                items={member.preferences}
                emptyText="No soft reads filed."
                tokens={tokens}
              />
            ) : preferenceReads.length > 0 ? (
              <FiledReadSummary reads={preferenceReads} theme={theme} />
            ) : (
              <SealedLines lineCount={lineCountFor(preferencesBlock, 3)} theme={theme} />
            )}
          </IntelCell>

          <IntelCell title="dealbreakers" tokens={tokens}>
            {revealAllDetails ? (
              <IntelList items={member.dealbreakers} emptyText="None on file." tokens={tokens} />
            ) : boundaryReads.length > 0 ? (
              <FiledReadSummary reads={boundaryReads} theme={theme} />
            ) : (
              <SealedLines lineCount={lineCountFor(boundaryBlock, 3)} theme={theme} />
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
  tokens,
  children,
}: {
  title: string;
  className?: string;
  tokens: IntelThemeTokens;
  children: ReactNode;
}) {
  return (
    <article className={`min-h-[6.5rem] p-3 ${tokens.cell} ${className}`}>
      <p
        className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] ${tokens.cellTitleText}`}
      >
        {title}
      </p>
      {children}
    </article>
  );
}

function IntelList({
  items,
  emptyText = "No entries on file.",
  tokens,
}: {
  items: readonly string[];
  emptyText?: string;
  tokens: IntelThemeTokens;
}) {
  if (items.length === 0) {
    return <p className={`mt-2 text-label ${tokens.mutedText}`}>{emptyText}</p>;
  }

  return (
    <ul className="mt-2 grid gap-1.5">
      {items.map((item) => (
        <li key={item} className={`text-label leading-snug ${tokens.bodyText}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function FiledReadSummary({
  reads,
  theme = "paper",
}: {
  reads: readonly PlayerKnowledgeRecord[];
  theme?: IntelBoardTheme;
}) {
  const tokens = INTEL_THEME_TOKENS[theme];
  return (
    <ul className="mt-2 grid gap-1.5">
      {reads.map((read) => (
        <li key={read.id} className={`rounded-tile px-2.5 py-1.5 ${tokens.readTile}`}>
          <p
            className={`font-mono text-micro font-semibold uppercase tracking-[0.2em] ${tokens.readLabelText}`}
          >
            {readKindLabel(read)}
          </p>
          <p className={`mt-1 text-label leading-snug ${tokens.readText}`}>{read.readText}</p>
        </li>
      ))}
    </ul>
  );
}

function SealedLines({
  lineCount,
  theme = "paper",
}: {
  lineCount: number;
  theme?: IntelBoardTheme;
}) {
  const normalizedCount = Math.min(Math.max(lineCount, 1), 5);
  const tokens = INTEL_THEME_TOKENS[theme];

  return (
    <>
      <div className="mt-3 space-y-1.5" aria-hidden>
        {Array.from({ length: normalizedCount }, (_, lineIndex) => (
          <span
            key={lineIndex}
            className={`block h-2 rounded-pill last:w-2/3 ${tokens.sealedBar}`}
          />
        ))}
      </div>
      <p
        className={`mt-3 font-mono text-micro uppercase tracking-[0.2em] ${tokens.sealedLabelText}`}
      >
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
      className="aura-glass aura-glass-lift absolute right-4 top-4 z-30 grid size-9 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:text-aura-ink"
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

function memberStatusLabel(status: Member["state"]["status"], isFocused: boolean): string {
  if (status === "closed") return "case closed";
  if (status === "quit") return "cancelled membership";
  return isFocused ? "focus case" : "active file";
}
