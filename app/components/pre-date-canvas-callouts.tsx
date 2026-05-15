import type { ReadyClosurePair } from "../services/closures";
import { GhostButton, Portrait, PrimaryButton } from "./dashboard-atoms";

export function DeckRepairCallout({ onOpenDateBook }: { onOpenDateBook: () => void }) {
  return (
    <div className="mt-6 rounded-card border border-amber-300/70 bg-amber-50/80 p-4 text-amber-900">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em]">
        // date book over budget
      </p>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          A budget cut put the deck above the cap. Drop cards in the Date Book before committing a
          new pair.
        </p>
        <GhostButton onClick={onOpenDateBook}>Open the date book →</GhostButton>
      </div>
    </div>
  );
}

export function ClosureCallout({
  entries,
  closingPairId,
  closureError,
  isActionPending,
  onConfirm,
  onDismissError,
}: {
  entries: ReadyClosurePair[];
  closingPairId: string | null;
  closureError: { pairId: string; message: string } | null;
  isActionPending: boolean;
  onConfirm: (pairId: string) => void;
  onDismissError: () => void;
}) {
  return (
    <section className="mb-6 mt-2 space-y-3">
      {entries.map((entry) => {
        const [first, second] = entry.participants;
        const isClosing = closingPairId === entry.pairState.id;
        const errorForEntry =
          closureError !== null && closureError.pairId === entry.pairState.id
            ? closureError.message
            : null;
        return (
          <article
            key={entry.pairState.id}
            className="aura-glass-strong relative flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-aura-rose/40 bg-white/80 p-4 shadow-aura-soft"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
                  <Portrait member={first} variant="card" />
                </span>
                <span className="rounded-full border-2 border-white/90 bg-white shadow-quiet">
                  <Portrait member={second} variant="card" />
                </span>
              </div>
              <div>
                <p className="font-mono text-micro uppercase tracking-[0.26em] text-aura-rose">
                  // closure.ready
                </p>
                <h2 className="font-display text-lg font-semibold tracking-tight text-aura-ink">
                  {first.firstName} and {second.firstName} are ready to delete the app.
                </h2>
                <p className="mt-1 text-sm text-aura-muted">
                  Close their case to file a pair memory, free their focus slots, and raise the
                  client cap by one.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PrimaryButton
                onClick={() => onConfirm(entry.pairState.id)}
                disabled={isActionPending || isClosing}
              >
                {isClosing ? "Filing closure…" : "Close their case →"}
              </PrimaryButton>
            </div>
            {errorForEntry !== null ? (
              <div className="basis-full rounded-2xl border border-aura-rose/30 bg-aura-rose/5 px-4 py-2 text-sm text-aura-rose">
                <div className="flex items-center justify-between gap-2">
                  <span>{errorForEntry}</span>
                  <button
                    type="button"
                    onClick={onDismissError}
                    data-sfx="click"
                    className="cursor-pointer rounded-pill border border-aura-rose/40 px-3 py-1 font-mono text-micro uppercase tracking-[0.18em]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
