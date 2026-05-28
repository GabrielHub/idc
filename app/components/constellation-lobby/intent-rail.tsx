import type { MatchmakingIntent } from "../../domain/game";
import {
  MATCHMAKING_INTENT_LABEL,
  MATCHMAKING_INTENT_SHORT_LABEL,
  MATCHMAKING_INTENT_TOOLTIP,
  MATCHMAKING_INTENTS,
} from "../../services/matchmaking-intent";
import { AuraTooltip } from "../aura-tooltip";

const READ_LABEL_TOOLTIP =
  "Tell Cupid what you're aiming for from this booking. The date gets graded against your read and the post-date note is phrased around it. Skip it to let the room speak for itself.";

const READ_LOCKED_TOOLTIP =
  "Read filed. Cupid will grade the date against this lens and phrase the post-date note around it.";

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
      ? "Read (optional)"
      : `Filed as ${MATCHMAKING_INTENT_SHORT_LABEL[selectedIntent].toLowerCase()}`;
  const labelTooltip = selectedIntent === null ? READ_LABEL_TOOLTIP : READ_LOCKED_TOOLTIP;

  return (
    <div className="aura-liquid-glass flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2">
      <AuraTooltip label={labelTooltip} placement="top">
        <span className="flex cursor-help items-center gap-1 font-mono text-micro uppercase tracking-[0.18em] text-white/55">
          {hint}
          <InfoGlyph />
        </span>
      </AuraTooltip>
      {MATCHMAKING_INTENTS.map((intent) => {
        const picked = selectedIntent === intent;
        if (locked && !picked) return null;
        const tone = picked
          ? "aura-liquid-glass-rose text-aura-paper"
          : "text-white/70 hover:bg-white/10 hover:text-aura-paper";
        return (
          <AuraTooltip
            key={intent}
            label={
              <>
                <span className="block font-semibold text-white">
                  {MATCHMAKING_INTENT_LABEL[intent]}
                </span>
                <span className="mt-1 block">{MATCHMAKING_INTENT_TOOLTIP[intent]}</span>
              </>
            }
            placement="top"
          >
            <button
              type="button"
              aria-label={MATCHMAKING_INTENT_LABEL[intent]}
              aria-pressed={picked}
              disabled={locked}
              onClick={() => onSelect(picked ? null : intent)}
              className={`cursor-pointer rounded-full px-3 py-1.5 font-mono text-micro uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-65 ${tone}`}
            >
              {MATCHMAKING_INTENT_SHORT_LABEL[intent]}
            </button>
          </AuraTooltip>
        );
      })}
    </div>
  );
}

function InfoGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 14 14" fill="none" className="size-3 shrink-0 text-white/45">
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 6.25v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7" cy="4.4" r="0.7" fill="currentColor" />
    </svg>
  );
}
