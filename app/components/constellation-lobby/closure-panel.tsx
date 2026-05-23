import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  CLOSURE_SUMMARY_MAX_LENGTH,
  ClosureSummaryValidationError,
  validateClosureSummary,
  type ReadyClosurePair,
} from "../../services/closures";
import { starterScenarios } from "../../fixtures/scenarios";
import { EASE_OUT_QUART } from "../dashboard-atoms";
import { joinPairFirstNames } from "../notes-format";

export type ClosurePanelConfirmInput = {
  pairId: string;
  summary: string;
  ready: ReadyClosurePair;
};

export type ClosurePanelProps = {
  readyPair: ReadyClosurePair | null;
  defaultSummary?: string;
  isActionPending?: boolean;
  errorMessage?: string | null;
  queuePosition?: number;
  queueTotal?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onClose: () => void;
  onConfirm: (input: ClosurePanelConfirmInput) => void | Promise<void>;
};

export function ClosurePanel({
  readyPair,
  defaultSummary = "",
  isActionPending = false,
  errorMessage,
  queuePosition,
  queueTotal,
  onPrevious,
  onNext,
  onClose,
  onConfirm,
}: ClosurePanelProps) {
  const open = readyPair !== null;
  const [summary, setSummary] = useState(defaultSummary);
  const [isConfirming, setIsConfirming] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mountedRef = useRef(true);
  const pairLabel = readyPair === null ? "ready pair" : formatPairLabel(readyPair);
  const scenarioTitle = readyPair === null ? "Date file" : getScenarioTitle(readyPair);
  const queueLabel =
    queuePosition === undefined || queueTotal === undefined
      ? null
      : `${queuePosition} / ${queueTotal}`;
  const showQueueButtons = onPrevious !== undefined || onNext !== undefined;
  const showQueueControls = queueLabel !== null || showQueueButtons;
  const previousDisabled =
    isActionPending ||
    onPrevious === undefined ||
    (queuePosition !== undefined && queuePosition <= 1);
  const nextDisabled =
    isActionPending ||
    onNext === undefined ||
    (queuePosition !== undefined && queueTotal !== undefined && queuePosition >= queueTotal);
  const placeholder = useMemo(() => {
    if (readyPair === null) {
      return "Draft the closure note the archive will file for this pair.";
    }

    const [first, second] = readyPair.participants;
    return `${first.firstName} and ${second.firstName} are ready to leave together. Write the archive note here.`;
  }, [readyPair]);
  const validationMessage = getClosureSummaryIssue(summary);
  const confirmDisabled =
    readyPair === null || isActionPending || isConfirming || validationMessage !== null;

  useEffect(() => {
    if (!open) return;
    setSummary(defaultSummary);
    setIsConfirming(false);
  }, [defaultSummary, open, readyPair?.pairState.id]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const node = textareaRef.current;
    if (node === null) return;
    node.focus();
    const cursorAt = node.value.length;
    node.setSelectionRange(cursorAt, cursorAt);
  }, [open, readyPair?.pairState.id]);

  async function confirmClosure() {
    if (readyPair === null || confirmDisabled) return;

    setIsConfirming(true);
    try {
      await onConfirm({
        pairId: readyPair.pairState.id,
        summary: summary.trim(),
        ready: readyPair,
      });
    } finally {
      if (mountedRef.current) {
        setIsConfirming(false);
      }
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="closure-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT_QUART }}
          className="fixed inset-0 z-[70] grid place-items-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Confirm closure for ${pairLabel}`}
        >
          <button
            type="button"
            aria-label="Close closure panel"
            onClick={onClose}
            className="absolute inset-0 cursor-pointer bg-aura-ink/55 backdrop-blur-sm"
          />

          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
            className="aura-liquid-glass relative flex max-h-full w-full max-w-[42rem] flex-col overflow-hidden rounded-card"
          >
            <header className="border-b border-white/10 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-sm uppercase tracking-[0.22em] text-white/55">
                    // closure.ready
                  </div>
                  <h2 className="mt-1 font-display text-display-md font-semibold leading-tight text-aura-paper">
                    File closure
                  </h2>
                </div>

                {showQueueControls ? (
                  <div className="flex items-center gap-2">
                    {showQueueButtons ? (
                      <button
                        type="button"
                        onClick={onPrevious}
                        disabled={previousDisabled}
                        className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-3 py-2 font-display text-sm text-aura-paper disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Previous
                      </button>
                    ) : null}
                    {queueLabel === null ? null : (
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 font-mono text-sm tabular-nums text-white/65">
                        {queueLabel}
                      </span>
                    )}
                    {showQueueButtons ? (
                      <button
                        type="button"
                        onClick={onNext}
                        disabled={nextDisabled}
                        className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-3 py-2 font-display text-sm text-aura-paper disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Next
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                <span className="font-semibold text-aura-paper">{pairLabel}</span> cleared the
                threshold after{" "}
                <span className="font-semibold text-aura-paper">{scenarioTitle}</span>. Confirming
                files the note, closes both member records, and frees their focus slots.
              </p>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              {readyPair === null ? (
                <p className="rounded-card border border-aura-amber/30 bg-aura-amber/10 px-4 py-3 text-sm text-aura-amber">
                  No ready closure is selected.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <ClosureDetail label="members" value={pairLabel} />
                  <ClosureDetail label="scenario" value={scenarioTitle} />
                  <ClosureDetail
                    label="dates"
                    value={`${readyPair.pairState.completedDateIds.length} complete`}
                  />
                  <ClosureDetail
                    label="signal"
                    value={formatOutcome(readyPair.finalReport.outcome)}
                  />
                </div>
              )}

              <label className="flex flex-col gap-2">
                <span className="font-mono text-sm uppercase tracking-[0.22em] text-white/55">
                  summary note
                </span>
                <textarea
                  ref={textareaRef}
                  value={summary}
                  maxLength={CLOSURE_SUMMARY_MAX_LENGTH}
                  rows={6}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder={placeholder}
                  aria-describedby="closure-summary-status"
                  className="aura-liquid-glass-ink min-h-40 w-full resize-none rounded-card border border-white/10 bg-white/10 px-4 py-3 text-sm leading-relaxed text-aura-paper outline-none transition placeholder:text-white/40 focus:border-aura-rose/55 focus:bg-white/15"
                />
              </label>

              <div
                id="closure-summary-status"
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <p className={validationMessage === null ? "text-white/55" : "text-aura-amber"}>
                  {summary.trim().length === 0
                    ? "Draft or paste the player-facing closure note."
                    : (validationMessage ?? "Ready to file.")}
                </p>
                <span className="font-mono text-sm tabular-nums text-white/45">
                  {summary.length} / {CLOSURE_SUMMARY_MAX_LENGTH}
                </span>
              </div>

              {errorMessage === undefined || errorMessage === null ? null : (
                <p className="rounded-card border border-aura-rose/35 bg-aura-rose/10 px-4 py-3 text-sm text-aura-rose">
                  {errorMessage}
                </p>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isActionPending}
                className="aura-liquid-glass aura-liquid-glass-hover cursor-pointer rounded-full px-4 py-2 font-display text-sm text-aura-paper disabled:cursor-not-allowed disabled:opacity-55"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClosure}
                disabled={confirmDisabled}
                className="aura-liquid-cta cursor-pointer rounded-full px-5 py-2 font-display text-sm disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isActionPending || isConfirming ? "Filing..." : "Confirm closure"}
              </button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ClosureDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-white/10 bg-white/10 px-4 py-3">
      <div className="font-mono text-sm uppercase tracking-[0.22em] text-white/45">{label}</div>
      <div className="mt-1 truncate font-display text-sm text-aura-paper">{value}</div>
    </div>
  );
}

function formatPairLabel(readyPair: ReadyClosurePair): string {
  const [first, second] = readyPair.participants;
  return joinPairFirstNames([first.firstName, second.firstName]) ?? "Ready pair";
}

function getScenarioTitle(readyPair: ReadyClosurePair): string {
  const scenario = starterScenarios.find(
    (candidate) => candidate.id === readyPair.dateSession.scenarioId,
  );
  return scenario?.title ?? readyPair.dateSession.scenarioId;
}

function formatOutcome(outcome: ReadyClosurePair["finalReport"]["outcome"]): string {
  return outcome.replaceAll("_", " ");
}

function getClosureSummaryIssue(summary: string): string | null {
  const trimmed = summary.trim();

  if (trimmed.length === 0) {
    return "Closure summary is required.";
  }

  try {
    validateClosureSummary(trimmed);
    return null;
  } catch (error) {
    if (error instanceof ClosureSummaryValidationError) {
      return error.message;
    }

    return "Closure summary cannot be filed.";
  }
}
