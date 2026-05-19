import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import type { Member, ScenarioEvent } from "../domain/game";
import { MAX_NUDGES_PER_DATE } from "../services/date-engine";
import { EASE_OUT_QUART, Eyebrow, GhostButton, pad2, Portrait } from "./dashboard-atoms";
import {
  SCENARIO_EVENT_KIND_CHIP_CLASS,
  SCENARIO_EVENT_KIND_COLUMN_META,
} from "./date-view-draft-screen";
import type { SfxCue } from "./sfx-provider";

const NUDGE_MAX_CHARS = 240;

export function CutShortIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <path
        d="M2.3 7.2 L8.6 2.4 M3 2.9 L11 11 M5.4 11.4 L11.7 6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

const MODAL_PRIMARY_CTA_CLASS =
  "aura-cta inline-flex cursor-pointer items-center gap-2 rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-5 py-2.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-cta ring-1 ring-white/40 ring-inset transition hover:-translate-y-px hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0";

const MODAL_FOOTER_CLASS =
  "flex flex-wrap items-center justify-between gap-4 border-t border-aura-hairline bg-white/40 px-7 py-4 lg:flex-nowrap lg:px-9 lg:py-5";

function ModalCloseButton({
  onClose,
  label,
  sfx,
}: {
  onClose: () => void;
  label: string;
  sfx?: SfxCue;
}) {
  return (
    <button
      type="button"
      data-sfx={sfx}
      onClick={onClose}
      aria-label={label}
      className="absolute right-4 top-4 z-10 grid size-8 cursor-pointer place-items-center rounded-full text-aura-muted transition hover:bg-white/55 hover:text-aura-ink"
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

function ModalShell({
  ariaLabel,
  closeLabel,
  size,
  onClose,
  children,
  footer,
}: {
  ariaLabel: string;
  closeLabel: string;
  size: "md" | "lg";
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const widthClass = size === "lg" ? "max-w-5xl" : "max-w-2xl";
  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: EASE_OUT_QUART }}
      onClick={onClose}
      className="fixed inset-0 z-40 grid place-items-center bg-aura-bg/55 px-4 py-10 backdrop-blur-xl"
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`aura-glass-strong relative w-full ${widthClass} overflow-hidden rounded-card`}
      >
        <ModalCloseButton onClose={onClose} label={closeLabel} sfx="dismiss" />
        <div className="relative flex flex-col gap-6 px-7 py-7 lg:px-9 lg:py-8">{children}</div>
        <div className={MODAL_FOOTER_CLASS}>{footer}</div>
      </motion.div>
    </motion.aside>
  );
}

export function NudgeComposerModal({
  participants,
  recipientId,
  text,
  suggestions,
  nudgesRemaining,
  canIntervene,
  onTextChange,
  onRecipientChange,
  onFile,
  onClose,
}: {
  participants: Member[];
  recipientId: string;
  text: string;
  suggestions: string[];
  nudgesRemaining: number;
  canIntervene: boolean;
  onTextChange: (text: string) => void;
  onRecipientChange: (memberId: string) => void;
  onFile: () => void;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fallbackRecipient = participants[0];
  const recipient =
    participants.find((member) => member.id === recipientId) ?? fallbackRecipient ?? null;
  const effectiveRecipientId = recipient?.id ?? "";
  const recipientName = recipient?.firstName ?? "one";
  const sendDisabled = !canIntervene || text.trim().length === 0;
  const swapEnabled = participants.length >= 2;
  const totalSlots = MAX_NUDGES_PER_DATE;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Cursor goes to end so a prior draft remains intact when the composer reopens.
  useEffect(() => {
    const node = textareaRef.current;
    if (node === null) return;
    node.focus();
    const length = node.value.length;
    node.setSelectionRange(length, length);
  }, []);

  const swapRecipient = () => {
    if (!swapEnabled) return;
    const next = participants.find((member) => member.id !== effectiveRecipientId);
    if (next === undefined) return;
    onRecipientChange(next.id);
  };

  const fileNudge = () => {
    if (sendDisabled) return;
    onFile();
  };

  return (
    <ModalShell
      ariaLabel={`Whisper a nudge to ${recipientName}`}
      closeLabel="Close nudge composer"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint lg:whitespace-nowrap">
            <span className="text-aura-muted">Enter</span> to file ·{" "}
            <span className="text-aura-muted">Shift+Enter</span> for line break ·{" "}
            <span className="text-aura-muted">Esc</span> to close
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <button
              type="button"
              data-sfx="primary"
              onClick={fileNudge}
              disabled={sendDisabled}
              aria-label="File whisper"
              className={MODAL_PRIMARY_CTA_CLASS}
            >
              <span>File whisper</span>
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                <path d="M2 8 L14 2 L11 14 L7.5 9 L2 8 Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </>
      }
    >
      <header className="flex flex-col gap-3">
        <Eyebrow>{"// nudge.compose"}</Eyebrow>
        <h2 className="font-display text-display-sm font-semibold tracking-tight text-aura-ink lg:text-display-md">
          Whisper to {recipientName}
        </h2>
        <p className="aura-accent text-lead text-aura-muted">
          Steer their next move or ask them to share something you want to know. They take it as a
          hunch and never know it came from you.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint">
          to
        </span>
        <button
          type="button"
          data-sfx="toggle"
          onClick={swapRecipient}
          disabled={!swapEnabled}
          aria-label={`Whisper recipient: ${recipientName}. ${swapEnabled ? "Click to swap." : ""}`}
          title={swapEnabled ? "Swap recipient" : undefined}
          className="inline-flex cursor-pointer items-center gap-2 rounded-pill bg-aura-rose py-1.5 pr-4 pl-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-white shadow-quiet transition hover:bg-aura-rose/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {recipient !== null ? <Portrait member={recipient} variant="chip" /> : null}
          <span>{recipientName}</span>
          {swapEnabled ? (
            <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
              <path
                d="M2 4 L10 4 M7 1 L10 4 L7 7 M10 8 L2 8 M5 11 L2 8 L5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </button>
        <span aria-hidden className="h-3 w-px bg-aura-hairline-strong/50" />
        <NudgeSlotMeter remaining={nudgesRemaining} total={totalSlots} />
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          maxLength={NUDGE_MAX_CHARS}
          rows={4}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              fileNudge();
            }
          }}
          placeholder={`What should ${recipientName} do or share next?`}
          aria-label={`Nudge for ${recipientName}`}
          className="block min-h-[7.5rem] w-full resize-none rounded-card border border-aura-hairline bg-white/70 px-5 py-4 font-sans text-body text-aura-ink shadow-quiet outline-none transition placeholder:text-aura-faint focus:border-aura-rose/55 focus:bg-white focus:shadow-card"
        />
        <span className="pointer-events-none absolute bottom-3 right-4 font-mono text-micro tabular-nums text-aura-faint">
          {text.length} / {NUDGE_MAX_CHARS}
        </span>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{"// quick nudges"}</Eyebrow>
          <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            tap to draft
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {suggestions.map((suggestion) => {
            const isActive = text.trim() === suggestion.trim();
            return (
              <button
                key={suggestion}
                type="button"
                data-sfx="click"
                onClick={() => {
                  onTextChange(suggestion);
                  const node = textareaRef.current;
                  if (node !== null) {
                    node.focus();
                    const length = suggestion.length;
                    node.setSelectionRange(length, length);
                  }
                }}
                aria-pressed={isActive}
                className={`group flex h-full cursor-pointer flex-col items-start gap-2 rounded-chip border px-3.5 py-3 text-left transition ${
                  isActive
                    ? "border-aura-rose/60 bg-aura-rose/10 shadow-quiet"
                    : "border-aura-hairline bg-white/60 hover:-translate-y-px hover:border-aura-rose/40 hover:bg-white hover:shadow-quiet"
                }`}
              >
                <span
                  className={`font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                    isActive ? "text-aura-rose" : "text-aura-faint group-hover:text-aura-rose"
                  }`}
                >
                  {suggestionLabel(suggestion)}
                </span>
                <span className="text-label leading-snug text-aura-ink/85">{suggestion}</span>
              </button>
            );
          })}
        </div>
      </section>
    </ModalShell>
  );
}

function NudgeSlotMeter({ remaining, total }: { remaining: number; total: number }) {
  const usedLabel = total - remaining;
  const message =
    remaining === 0
      ? "every nudge filed"
      : `${remaining} of ${total} ${remaining === 1 ? "nudge" : "nudges"} left`;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1">
        {Array.from({ length: total }).map((_, index) => {
          const filled = index < remaining;
          return (
            <svg
              key={`composer-pip-${index}`}
              viewBox="0 0 12 12"
              aria-hidden
              className={`size-3 transition ${filled ? "text-aura-rose" : "text-aura-rose/25"}`}
            >
              <path
                d="M6 10.4 C6 10.4 1.4 7.7 1.4 4.6 C1.4 3.1 2.55 1.95 4.05 1.95 C4.95 1.95 5.65 2.45 6 3.2 C6.35 2.45 7.05 1.95 7.95 1.95 C9.45 1.95 10.6 3.1 10.6 4.6 C10.6 7.7 6 10.4 6 10.4 Z"
                fill="currentColor"
              />
            </svg>
          );
        })}
      </span>
      <span
        className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint"
        aria-label={`${usedLabel} of ${total} nudges used. ${message}.`}
      >
        {message}
      </span>
    </span>
  );
}

export function SceneConfirmModal({
  event,
  pickIndex,
  canDrop,
  onConfirm,
  onClose,
}: {
  event: ScenarioEvent;
  pickIndex: number;
  canDrop: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        onClose();
        return;
      }
      if (keyEvent.key === "Enter" && canDrop) {
        const target = keyEvent.target as HTMLElement | null;
        if (
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable === true
        ) {
          return;
        }
        keyEvent.preventDefault();
        onConfirm();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onConfirm, canDrop]);

  const meta = SCENARIO_EVENT_KIND_COLUMN_META[event.kind];
  const chipClass = SCENARIO_EVENT_KIND_CHIP_CLASS[event.kind];
  const slotLabel = pickIndex >= 0 ? `scene ${pad2(pickIndex + 1)} of 03` : "scene preview";

  return (
    <ModalShell
      ariaLabel={`Drop scene: ${event.title}`}
      closeLabel="Close scene preview"
      size="md"
      onClose={onClose}
      footer={
        <>
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint lg:whitespace-nowrap">
            <span className="text-aura-muted">Enter</span> to drop ·{" "}
            <span className="text-aura-muted">Esc</span> to close
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <button
              type="button"
              data-sfx="primary"
              onClick={onConfirm}
              disabled={!canDrop}
              aria-label={`Drop scene ${event.title}`}
              className={MODAL_PRIMARY_CTA_CLASS}
            >
              <span>Drop scene</span>
              <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden>
                <path d="M6 1.2 L10.8 6 L6 10.8 L1.2 6 Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </>
      }
    >
      <header className="flex flex-col gap-3">
        <Eyebrow>{`// ${slotLabel}`}</Eyebrow>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.28em] ${chipClass}`}
          >
            {meta.label}
          </span>
          <span className="text-label text-aura-muted">{meta.blurb}</span>
        </div>
        <h2 className="font-display text-display-sm font-semibold tracking-tight text-aura-ink lg:text-display-md">
          {event.title}
        </h2>
      </header>

      <section className="flex flex-col gap-2">
        <Eyebrow>{"// the beat"}</Eyebrow>
        <p className="text-body leading-relaxed text-aura-ink">{event.event}</p>
      </section>

      <section className="flex flex-col gap-2">
        <Eyebrow>{"// what they see"}</Eyebrow>
        <p className="text-body leading-relaxed text-aura-ink/85">{event.characterVisibleText}</p>
      </section>

      {!canDrop ? (
        <p
          role="status"
          className="rounded-chip border border-aura-amber/40 bg-aura-amber/10 px-3 py-2 font-mono text-micro uppercase tracking-[0.22em] text-aura-amber"
        >
          Pause the date to drop this scene.
        </p>
      ) : null}
    </ModalShell>
  );
}

export function CutShortConfirmModal({
  participants,
  canCutShort,
  onConfirm,
  onClose,
}: {
  participants: Member[];
  canCutShort: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        onClose();
        return;
      }
      if (keyEvent.key === "Enter" && canCutShort) {
        const target = keyEvent.target as HTMLElement | null;
        if (
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable === true
        ) {
          return;
        }
        keyEvent.preventDefault();
        onConfirm();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onConfirm, canCutShort]);

  const [first, second] = participants;
  const participantLine =
    first === undefined || second === undefined
      ? "both members"
      : `${first.firstName} and ${second.firstName}`;

  return (
    <ModalShell
      ariaLabel="Cut the date short"
      closeLabel="Close cut short confirmation"
      size="md"
      onClose={onClose}
      footer={
        <>
          <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint lg:whitespace-nowrap">
            <span className="text-aura-muted">Enter</span> to cut ·{" "}
            <span className="text-aura-muted">Esc</span> to close
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <button
              type="button"
              data-sfx="primary"
              onClick={onConfirm}
              disabled={!canCutShort}
              aria-label="Cut the date short"
              className={MODAL_PRIMARY_CTA_CLASS}
            >
              <span>Cut short</span>
              <CutShortIcon />
            </button>
          </div>
        </>
      }
    >
      <header className="flex flex-col gap-3">
        <Eyebrow>{"// operator.exit"}</Eyebrow>
        <h2 className="font-display text-display-sm font-semibold tracking-tight text-aura-ink lg:text-display-md">
          Cut the room short
        </h2>
        <p className="aura-accent text-lead text-aura-muted">
          Cupid files one final read from the evidence on screen. The date resolves now, unused
          scenes stay unused, and {participantLine} enter cooldown.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-chip border border-aura-amber/35 bg-aura-amber/10 px-4 py-3">
        <Eyebrow>{"// consequence"}</Eyebrow>
        <p className="text-body leading-relaxed text-aura-ink/85">
          A protected exit can soften a bad room. An interrupted warm room can still sting. Cupid
          lets the final read decide which filing cabinet gets louder.
        </p>
      </section>
    </ModalShell>
  );
}

function suggestionLabel(suggestion: string): string {
  if (suggestion.includes("Share something")) {
    return "Share something";
  }

  if (suggestion.includes("favorite song")) {
    return "Drop a favorite";
  }

  if (suggestion.includes("boundary")) {
    return "Name boundary";
  }

  if (suggestion.includes("logistics")) {
    return "Move past logistics";
  }

  if (suggestion.includes("follow-up")) {
    return "Ask follow-up";
  }

  if (suggestion.includes("small plan")) {
    return "Hand the wheel";
  }

  return "Ground it";
}
