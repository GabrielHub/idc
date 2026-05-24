import type { MatchmakingIntent } from "../../domain/game";
import {
  MATCHMAKING_INTENT_SHORT_LABEL,
  MATCHMAKING_INTENT_TOOLTIP,
  MATCHMAKING_INTENTS,
} from "../../services/matchmaking-intent";

/**
 * Optional intent picker that mounts inside the bottom-center pair rail once
 * both focus and partner are committed. Locked once the booking is active so
 * the rail still reads as the filed intent without offering a no-op edit.
 */
export function IntentRail({
  selectedIntent,
  locked,
  onSelect,
}: {
  selectedIntent: MatchmakingIntent | null;
  locked: boolean;
  onSelect: (intent: MatchmakingIntent | null) => void;
}) {
  const hint =
    selectedIntent === null
      ? "Optional booking read"
      : `Filed as ${MATCHMAKING_INTENT_SHORT_LABEL[selectedIntent].toLowerCase()}`;

  return (
    <div className="aura-liquid-glass flex flex-wrap items-center justify-center gap-2 rounded-full px-3 py-2">
      <span className="px-1 font-mono text-micro uppercase tracking-[0.18em] text-white/55">
        {hint}
      </span>
      {MATCHMAKING_INTENTS.map((intent) => {
        const picked = selectedIntent === intent;
        if (locked && !picked) return null;
        const tone = picked
          ? "aura-liquid-glass-rose text-aura-paper"
          : "text-white/70 hover:bg-white/10 hover:text-aura-paper";
        return (
          <button
            key={intent}
            type="button"
            title={MATCHMAKING_INTENT_TOOLTIP[intent]}
            aria-pressed={picked}
            disabled={locked}
            onClick={() => onSelect(picked ? null : intent)}
            className={`cursor-pointer rounded-full px-3 py-1.5 font-mono text-micro uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-65 ${tone}`}
          >
            {MATCHMAKING_INTENT_SHORT_LABEL[intent]}
          </button>
        );
      })}
    </div>
  );
}
