import { motion } from "motion/react";
import type { ReactNode } from "react";

import { scrubPlayerSafeCopy } from "../services/player-safe-copy";
import { EASE_OUT_QUART, Eyebrow, Portrait } from "./dashboard-atoms";
import { joinPairFirstNames } from "./notes-format";
import type { PairDossier } from "./notes-view-helpers";

const NO_BOARD_EDGE_NOTE =
  "No public pair file yet. Cupid pulled the player-safe dossier so you can plan around what is filed.";

export function PairDossierCard({ dossier }: { dossier: PairDossier }) {
  const [first, second] = dossier.participants;
  const title = joinPairFirstNames([first.firstName, second.firstName]) ?? first.firstName;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
      className="aura-glass-strong relative mt-6 overflow-hidden rounded-card ring-1 ring-aura-rose/35"
      aria-label={`Selected pair dossier for ${title}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-aura-rose opacity-60"
      />
      <div className="relative z-10 space-y-5 px-5 py-5 pl-7">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex -space-x-3">
              {dossier.participants.map((member, idx) => (
                <span
                  key={member.id}
                  className={`rounded-full border-2 border-white/90 bg-white shadow-quiet ${
                    idx === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"
                  }`}
                >
                  <Portrait member={member} variant="thumb" />
                </span>
              ))}
            </span>
            <div className="min-w-0">
              <Eyebrow>// pair · dossier</Eyebrow>
              <h4 className="font-display text-display-sm font-semibold leading-tight text-aura-ink">
                {title}
              </h4>
            </div>
          </div>
          {dossier.closureReady ? (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-aura-rose/95 px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.26em] text-white shadow-quiet">
              <span aria-hidden className="size-1.5 rounded-full bg-white/85" />
              Closure ready
            </span>
          ) : null}
        </header>

        <p className="text-label text-aura-muted">{NO_BOARD_EDGE_NOTE}</p>

        {dossier.closureNearMiss ? (
          <p className="aura-accent text-body leading-snug text-aura-ink/85">
            This pair nearly cleared closure last time. Pressure cleanup keeps the file open.
          </p>
        ) : null}

        <DossierGroup label="Public pair notes" empty="No public pair notes have been filed yet.">
          {dossier.publicPairNotes.length === 0 ? null : (
            <ul className="space-y-2">
              {dossier.publicPairNotes.slice(0, 3).map((note) => (
                <li
                  key={note.id}
                  className="rounded-card bg-white/65 px-3 py-2 ring-1 ring-aura-hairline"
                >
                  <p className="aura-accent text-body leading-snug text-aura-ink/90">
                    {scrubPlayerSafeCopy(note.text)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DossierGroup>

        <DossierGroup label="Visible pair reads" empty="No filed pair reads yet.">
          {dossier.pairReads.length === 0 ? null : (
            <ul className="space-y-1.5">
              {dossier.pairReads.map((read) => (
                <li key={read.id} className="text-body leading-snug text-aura-ink/85">
                  {read.readText}
                </li>
              ))}
            </ul>
          )}
        </DossierGroup>
      </div>
    </motion.section>
  );
}

function DossierGroup({
  label,
  empty,
  children,
}: {
  label: string;
  empty: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.26em] text-aura-faint">
        {label}
      </p>
      {children ?? <p className="text-label text-aura-muted">{empty}</p>}
    </div>
  );
}
