import { type Member, type PairState } from "../../domain/game";
import { MutedLabel, pad2 } from "../../components/dashboard-atoms";
import { makePairId, sortMemberIds } from "../../services/game-seed";

export function TestHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="space-y-2">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
        // active bench
      </p>
      <h2 className="font-display text-display-md font-semibold leading-[1.05] tracking-tight text-aura-ink">
        {title}
      </h2>
      <p className="max-w-[64ch] text-body text-aura-muted">{description}</p>
    </header>
  );
}

export function TextAreaControl({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 block w-full resize-y rounded-card border border-aura-hairline bg-white/60 px-4 py-3 text-body leading-relaxed text-aura-ink outline-none transition focus:border-aura-rose"
      />
    </label>
  );
}

export function NotesShiftStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="space-y-2">
      <MutedLabel>shift number</MutedLabel>
      <div className="inline-flex items-center gap-1 rounded-pill bg-white/60 p-1 ring-1 ring-aura-hairline">
        <button
          type="button"
          aria-label="Decrement shift number"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:text-aura-ink disabled:cursor-not-allowed disabled:text-aura-faint"
        >
          minus
        </button>
        <span className="min-w-12 text-center font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-ink tabular-nums">
          {pad2(value)}
        </span>
        <button
          type="button"
          aria-label="Increment shift number"
          onClick={() => onChange(Math.min(99, value + 1))}
          disabled={value === 99}
          className="cursor-pointer rounded-pill px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:text-aura-ink disabled:cursor-not-allowed disabled:text-aura-faint"
        >
          plus
        </button>
      </div>
    </div>
  );
}

export function buildBoardPairState(a: Member, b: Member, health: number): PairState {
  return {
    id: makePairId(a.id, b.id),
    participantIds: sortMemberIds(a.id, b.id),
    stats: {
      chemistry: 65,
      trust: 60,
      stability: 55,
      conflict: 25,
      weirdnessTolerance: 70,
      spark: 60,
      strain: 30,
      relationshipHealth: health,
    },
    completedDateIds: [],
    scenarioUseCounts: {},
    agreements: [],
    openLoops: [],
  };
}
