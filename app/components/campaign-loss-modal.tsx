import { motion } from "motion/react";
import { useMemo } from "react";

import type { GameSave, Member } from "../domain/game";
import { clientLossLimit, isPairClosureMemory } from "../services/closures";
import { getQuitMembers } from "../services/date-engine";
import {
  EASE_OUT_QUART,
  Eyebrow,
  GhostButton,
  Hairline,
  pad2,
  Portrait,
  PrimaryButton,
} from "./dashboard-atoms";

export type CampaignLossModalProps = {
  save: GameSave;
  isActionPending: boolean;
  onResetCampaign: () => void;
  onExportSave: () => void;
  onPunchOut: () => void;
};

export function CampaignLossModal({
  save,
  isActionPending,
  onResetCampaign,
  onExportSave,
  onPunchOut,
}: CampaignLossModalProps) {
  const quitMembers = useMemo(() => getQuitMembers(save.members), [save.members]);
  const closureCount = save.closureCount;
  const lossCap = clientLossLimit(save);
  const shiftsWorked = save.shifts.length;
  const closedMembers = useMemo(
    () => save.members.filter((member) => member.state.status === "closed").slice(0, 6),
    [save.members],
  );
  const heldOnRoster = useMemo(
    () =>
      save.members.filter(
        (member) => member.state.status === "active" && member.state.retention > 0,
      ).length,
    [save.members],
  );
  const finalShiftLabel = save.shifts.at(-1)?.shiftNumber ?? shiftsWorked;
  const pairClosureCount = useMemo(
    () => save.memories.filter((memory) => isPairClosureMemory(memory)).length,
    [save.memories],
  );

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label="Cupid received a termination notice"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0a13]/90 px-4 py-10 backdrop-blur-2xl sm:px-8 sm:py-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, ease: EASE_OUT_QUART }}
    >
      <CampaignLossBackdrop />

      <motion.section
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.12, ease: EASE_OUT_QUART }}
        className="relative mx-auto w-full max-w-5xl"
      >
        <article className="relative overflow-hidden rounded-card border border-aura-hairline-strong bg-[linear-gradient(180deg,#fffdf7_0%,#fbf4e8_42%,#f5e9d2_100%)] shadow-card">
          <FoldedCornerGlyph />
          <PaperGrainOverlay />
          <TerminatedStamp />
          <PerforatedRule className="absolute inset-x-0 top-0" />
          <PerforatedRule className="absolute inset-x-0 bottom-0" />

          <header className="relative px-8 pt-10 sm:px-14 sm:pt-12">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <Eyebrow>// hr.termination.notice</Eyebrow>
                <p className="mt-1 font-mono text-micro uppercase tracking-[0.32em] text-aura-faint">
                  case file {pad2(finalShiftLabel)} · final action
                </p>
              </div>
              <FileMetaBlock
                quitsRecorded={quitMembers.length}
                lossCap={lossCap}
                closureCount={closureCount}
              />
            </div>

            <h1 className="mt-9 font-eldritch text-[clamp(2rem,5.2vw,3.4rem)] font-bold uppercase leading-[1.05] tracking-[0.04em] text-aura-ink">
              Cupid, the office
              <br className="hidden sm:block" /> continues without you.
            </h1>

            <p className="mt-6 max-w-2xl font-italic-script text-[1.45rem] leading-snug text-aura-ink/85">
              HR forwarded the news with the same letterhead and a different signature.
            </p>
            <p className="mt-4 max-w-2xl font-antique text-base leading-relaxed text-aura-ink/75">
              You burned through {quitMembers.length} client files against a cap of {lossCap}. The
              clipboard, the rolodex, and the queue are returning to inventory. No new dates can be
              booked under your number. We're freeing the desk for another match.
            </p>
          </header>

          <Hairline className="my-10" />

          <section className="relative px-8 sm:px-14">
            <SectionHeading
              eyebrow="// closure ledger"
              title="The final ledger"
              note={`${shiftsWorked} shift${shiftsWorked === 1 ? "" : "s"} on the clock`}
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <LedgerStat label="Files lost" value={quitMembers.length} accent="loss" />
              <LedgerStat label="Cap absorbed" value={lossCap} />
              <LedgerStat label="Pairs closed" value={pairClosureCount} accent="win" />
              <LedgerStat label="On the floor" value={heldOnRoster} />
            </div>
          </section>

          {quitMembers.length === 0 ? null : (
            <section className="relative mt-12 px-8 sm:px-14">
              <SectionHeading
                eyebrow="// files closed against you"
                title="They left the agency."
                note="Marked, dated, and walked out by the manager."
              />
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {quitMembers.slice(0, 8).map((member, index) => (
                  <ClosedFileRow key={member.id} member={member} stampIndex={index} />
                ))}
              </ul>
              {quitMembers.length > 8 ? (
                <p className="mt-4 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
                  · {quitMembers.length - 8} additional file
                  {quitMembers.length - 8 === 1 ? "" : "s"} archived in the back room ·
                </p>
              ) : null}
            </section>
          )}

          {closedMembers.length === 0 ? null : (
            <section className="relative mt-12 px-8 sm:px-14">
              <SectionHeading
                eyebrow="// the win column"
                title="The ones who walked out together."
                note={`${pairClosureCount} closed file${pairClosureCount === 1 ? "" : "s"} on record`}
              />
              <ul className="mt-6 flex flex-wrap gap-3">
                {closedMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-pill border border-emerald-400/40 bg-emerald-50/60 px-3 py-1.5"
                  >
                    <span className="size-8 overflow-hidden rounded-full ring-1 ring-emerald-500/30">
                      <Portrait member={member} variant="chip" />
                    </span>
                    <span className="font-display text-sm font-semibold tracking-tight text-emerald-900">
                      {member.firstName}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="relative mt-14 px-8 pb-12 sm:px-14 sm:pb-14">
            <Hairline className="mb-8" />
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-md">
                <p className="font-mono text-micro uppercase tracking-[0.26em] text-aura-faint">
                  // next steps, courtesy of the manager
                </p>
                <p className="mt-3 font-antique text-base leading-relaxed text-aura-ink/75">
                  Reset the floor and Cupid drafts a clean roster, an empty queue, and a new
                  rolodex. The office continues. You decide whether you do.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:items-end">
                <PrimaryButton onClick={onResetCampaign} disabled={isActionPending}>
                  Start a new campaign →
                </PrimaryButton>
                <div className="flex items-center gap-2">
                  <GhostButton onClick={onExportSave} disabled={isActionPending}>
                    Export final ledger
                  </GhostButton>
                  <GhostButton onClick={onPunchOut} disabled={isActionPending}>
                    Punch out
                  </GhostButton>
                </div>
              </div>
            </div>
          </footer>
        </article>
      </motion.section>
    </motion.div>
  );
}

function CampaignLossBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 top-1/4 size-[40rem] rounded-full bg-aura-mesh-rose opacity-25 mix-blend-screen blur-[120px]" />
      <div className="absolute -right-40 bottom-0 size-[42rem] rounded-full bg-aura-mesh-amber opacity-20 mix-blend-screen blur-[140px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.08)_0%,transparent_55%)]" />
    </div>
  );
}

function PaperGrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(120,53,15,0.45)_1px,transparent_1px),radial-gradient(rgba(190,85,55,0.22)_1px,transparent_1.4px)] opacity-[0.18] mix-blend-multiply [background-position:0_0,2px_2px] [background-size:4px_4px,11px_11px]"
    />
  );
}

function FoldedCornerGlyph() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 size-24 bg-[linear-gradient(135deg,transparent_47%,rgba(15,23,42,0.07)_48%,rgba(15,23,42,0.16)_50%,transparent_51%)] sm:size-32"
    />
  );
}

function PerforatedRule({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none h-2 bg-[radial-gradient(circle,rgba(15,23,42,0.42)_0_1.4px,transparent_1.8px)] [background-position:center] [background-repeat:repeat-x] [background-size:12px_8px] ${className}`}
    />
  );
}

function TerminatedStamp() {
  return (
    <motion.div
      aria-hidden
      initial={{ scale: 2.6, rotate: -22, opacity: 0 }}
      animate={{ scale: 1, rotate: -11, opacity: 1 }}
      transition={{ delay: 0.55, duration: 0.42, ease: [0.4, 0.05, 0.15, 1.04] }}
      className="pointer-events-none absolute right-8 top-24 z-10 select-none sm:right-16 sm:top-28"
    >
      <div className="border-[3px] border-[#b91c1c]/85 px-4 py-2 shadow-[inset_0_0_0_2px_rgba(185,28,28,0.55),0_0_0_2px_rgba(185,28,28,0.18)]">
        <p className="font-eldritch text-sm font-bold uppercase tracking-[0.36em] text-[#b91c1c]">
          case file
        </p>
        <p className="text-center font-eldritch text-2xl font-bold uppercase tracking-[0.14em] text-[#b91c1c] sm:text-3xl">
          terminated
        </p>
      </div>
    </motion.div>
  );
}

function FileMetaBlock({
  quitsRecorded,
  lossCap,
  closureCount,
}: {
  quitsRecorded: number;
  lossCap: number;
  closureCount: number;
}) {
  return (
    <dl className="grid grid-cols-3 gap-x-5 gap-y-1 border-l border-aura-hairline-strong pl-5 text-right font-mono text-micro uppercase tracking-[0.18em] text-aura-muted">
      <dt className="col-start-1 text-aura-faint">quits</dt>
      <dd className="text-aura-ink">{quitsRecorded}</dd>
      <dt className="text-aura-faint">cap</dt>
      <dd className="text-aura-ink">{lossCap}</dd>
      <dt className="text-aura-faint">closures</dt>
      <dd className="text-aura-ink">{closureCount}</dd>
    </dl>
  );
}

function SectionHeading({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-display-sm font-semibold tracking-tight text-aura-ink">
          {title}
        </h2>
      </div>
      {note === undefined ? null : (
        <span className="font-mono text-micro uppercase tracking-[0.2em] text-aura-faint">
          {note}
        </span>
      )}
    </div>
  );
}

function LedgerStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "loss" | "win";
}) {
  const accentClass =
    accent === "loss" ? "text-[#9b1c1c]" : accent === "win" ? "text-emerald-800" : "text-aura-ink";
  return (
    <div className="rounded-tile border border-aura-hairline bg-white/55 p-4 shadow-quiet">
      <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">{label}</p>
      <p className={`mt-2 font-eldritch text-3xl font-bold tracking-tight ${accentClass}`}>
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}

function ClosedFileRow({ member, stampIndex }: { member: Member; stampIndex: number }) {
  const stampRotationClass = stampIndex % 2 === 0 ? "-rotate-[4deg]" : "rotate-[3.5deg]";
  const reason = member.state.recentDateResult ?? "Walked off the floor without a note.";

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 + stampIndex * 0.06, duration: 0.36, ease: EASE_OUT_QUART }}
      className="relative flex items-start gap-4 rounded-tile border border-aura-hairline bg-white/65 p-4 shadow-quiet"
    >
      <div className="relative shrink-0">
        <span className="block size-16 overflow-hidden rounded-full ring-1 ring-aura-hairline-strong grayscale-[0.55]">
          <Portrait member={member} variant="row" />
        </span>
        <span
          className={`absolute -bottom-1 -right-2 select-none border-2 border-[#b91c1c]/70 px-1.5 py-0.5 font-eldritch text-sm font-bold uppercase tracking-[0.18em] text-[#b91c1c] ${stampRotationClass}`}
        >
          quit
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          file ··· {member.id.slice(0, 8)}
        </p>
        <h3 className="mt-0.5 font-display text-base font-semibold tracking-tight text-aura-ink">
          {member.firstName}
        </h3>
        <p className="mt-2 font-antique text-sm leading-snug text-aura-ink/75">{reason}</p>
      </div>
    </motion.li>
  );
}
