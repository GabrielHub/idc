import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { PublicReleaseNote } from "../domain/release-notes";
import { normalizeReleaseVersion } from "../services/release-notes";
import { ChromeButton, EASE_OUT_QUART, MutedLabel } from "./dashboard-atoms";

export function ReleaseNotesModal({
  notes,
  initialVersion,
  onClose,
}: {
  notes: readonly PublicReleaseNote[];
  initialVersion: string;
  onClose: () => void;
}) {
  const initialIndex = useMemo(() => {
    const normalized = normalizeReleaseVersion(initialVersion);
    const matchIndex = notes.findIndex((note) => note.version === normalized);
    return matchIndex === -1 ? 0 : matchIndex;
  }, [initialVersion, notes]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((index) => Math.max(0, index - 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((index) => Math.min(notes.length - 1, index + 1));
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [notes.length, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  const activeNote = notes[activeIndex];
  if (activeNote === undefined) {
    return null;
  }

  const canGoNewer = activeIndex > 0;
  const canGoOlder = activeIndex < notes.length - 1;
  const newerNote = canGoNewer ? notes[activeIndex - 1] : undefined;
  const olderNote = canGoOlder ? notes[activeIndex + 1] : undefined;
  const showNewer = () => setActiveIndex((index) => Math.max(0, index - 1));
  const showOlder = () => setActiveIndex((index) => Math.min(notes.length - 1, index + 1));

  return createPortal(
    <motion.div
      key="release-notes-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
      role="dialog"
      aria-modal="true"
      aria-label={`Patch dispatch v${activeNote.version}`}
      onClick={onClose}
      className="fixed inset-0 z-[60] overflow-y-auto bg-aura-ink/45 px-4 py-6 backdrop-blur-xl lg:px-6"
    >
      <motion.section
        key="release-notes-modal"
        layout
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
        onClick={(event) => event.stopPropagation()}
        className="aura-glass-strong relative mx-auto w-full max-w-5xl rounded-card p-5 shadow-card lg:p-8"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-aura-hairline pb-6">
          <div className="min-w-0 max-w-2xl space-y-3">
            <MutedLabel>form 09 // patch dispatch</MutedLabel>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="font-display text-display-md font-semibold leading-[1.02] tracking-tight text-aura-ink">
                Patch v{activeNote.version}
              </h2>
              <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                filed <span className="text-aura-ink">{formatReleaseDate(activeNote.date)}</span>
                <span aria-hidden className="mx-2 text-aura-faint">
                  ::
                </span>
                <span className="text-aura-ink">
                  {activeIndex + 1} of {notes.length}
                </span>
              </span>
            </div>
            <p className="aura-accent text-display-sm leading-snug text-aura-rose">
              &ldquo;{activeNote.headline}&rdquo;
            </p>
            <p className="text-body leading-relaxed text-aura-muted">{activeNote.summary}</p>
          </div>
          <ChromeButton onClick={onClose}>Close</ChromeButton>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]">
          <div className="min-w-0 space-y-5">
            {activeNote.sections.map((section, sectionIndex) => (
              <SectionCard
                key={section.title}
                title={section.title}
                items={section.items}
                ordinal={sectionIndex}
              />
            ))}
          </div>

          <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            <div className="aura-glass rounded-card p-4">
              <div className="flex items-center justify-between gap-3">
                <MutedLabel>patch ledger</MutedLabel>
                <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
                  {notes.length} filed
                </span>
              </div>
              <ol className="mt-3 space-y-1.5">
                {notes.map((note, index) => (
                  <li key={note.version}>
                    <LedgerEntry
                      version={note.version}
                      date={note.date}
                      isActive={index === activeIndex}
                      onSelect={() => setActiveIndex(index)}
                    />
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>

        <footer className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-aura-hairline pt-5">
          <div className="flex min-w-0 items-center justify-start">
            {olderNote === undefined ? null : (
              <NavStep
                direction="older"
                label="show older patch"
                version={olderNote.version}
                onClick={showOlder}
              />
            )}
          </div>

          <button
            type="button"
            data-sfx="dismiss"
            onClick={onClose}
            className="aura-glass-ink cursor-pointer rounded-pill px-6 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.24em] transition hover:bg-aura-rose hover:text-white"
          >
            Done
          </button>

          <div className="flex min-w-0 items-center justify-end">
            {newerNote === undefined ? null : (
              <NavStep
                direction="newer"
                label="show newer patch"
                version={newerNote.version}
                onClick={showNewer}
              />
            )}
          </div>
        </footer>
      </motion.section>
    </motion.div>,
    document.body,
  );
}

/* ================================================================== */
/* Section card                                                       */
/* ================================================================== */

function SectionCard({
  title,
  items,
  ordinal,
}: {
  title: string;
  items: readonly string[];
  ordinal: number;
}) {
  const tag = pad2(ordinal + 1);
  return (
    <section className="rounded-card border border-aura-hairline bg-white/45 p-5">
      <header className="flex items-center gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
          {tag}
        </span>
        <span aria-hidden className="h-px flex-1 bg-aura-hairline-strong" />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          {title}
        </span>
      </header>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-body leading-relaxed text-aura-ink">
            <span
              aria-hidden
              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gradient-to-br from-aura-rose to-aura-fuchsia"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ================================================================== */
/* Patch ledger                                                       */
/* ================================================================== */

function LedgerEntry({
  version,
  date,
  isActive,
  onSelect,
}: {
  version: string;
  date: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  const surface = isActive
    ? "aura-glass-ink"
    : "bg-white/45 text-aura-muted hover:bg-white/70 hover:text-aura-ink";
  const dateClass = isActive ? "text-white/70" : "text-aura-faint";
  return (
    <button
      type="button"
      data-sfx="menu"
      aria-pressed={isActive}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-chip px-3 py-2 text-left transition ${surface}`}
    >
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em]">
        v{version}
      </span>
      <span className={`font-mono text-micro uppercase tracking-[0.18em] ${dateClass}`}>
        {formatLedgerDate(date)}
      </span>
    </button>
  );
}

/* ================================================================== */
/* Footer nav                                                         */
/* ================================================================== */

function NavStep({
  direction,
  label,
  version,
  onClick,
}: {
  direction: "older" | "newer";
  label: string;
  version: string;
  onClick: () => void;
}) {
  const isNewer = direction === "newer";
  const versionClass =
    "hidden font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint transition group-hover:text-aura-rose sm:inline";
  return (
    <button
      type="button"
      data-sfx="menu"
      onClick={onClick}
      aria-label={`${label} (v${version})`}
      title={`${label} (v${version})`}
      className="aura-glass group inline-flex cursor-pointer items-center gap-3 rounded-pill px-3.5 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:text-aura-rose"
    >
      {isNewer ? (
        <>
          <span className={versionClass}>v{version}</span>
          <span>newer</span>
          <ChevronRightIcon />
        </>
      ) : (
        <>
          <ChevronLeftIcon />
          <span>older</span>
          <span className={versionClass}>v{version}</span>
        </>
      )}
    </button>
  );
}

/* ================================================================== */
/* Formatters and icons                                               */
/* ================================================================== */

function formatReleaseDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLedgerDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-3.5"
    >
      <path d="M10 3.5L5.5 8L10 12.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-3.5"
    >
      <path d="M6 3.5L10.5 8L6 12.5" />
    </svg>
  );
}
