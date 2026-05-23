import { motion } from "motion/react";
import { useState } from "react";
import { Tooltip } from "./dashboard-atoms";

/**
 * `livedate` is the only remaining room — Roster, Date Book, and Files
 * were folded into the constellation lobby. The type is kept as a single-
 * value union so existing call sites (`currentRoom === "livedate"`) stay
 * legible without churn.
 */
export type RoomKey = "livedate";

export type LiveDateState = "idle" | "planning" | "live" | "wrap";

export type FloatingNavClusterProps = {
  current: RoomKey;
  hidden?: boolean;
  liveDateState?: LiveDateState;
  onSelect: (room: RoomKey) => void;
};

const LIVE_DATE_LABEL: Record<LiveDateState, string> = {
  idle: "Live Date",
  planning: "Live Date · Planning",
  live: "On Date · Live",
  wrap: "Date Wrap",
};

/**
 * Single Live Date glass button at the bottom-right of the lobby. Roster,
 * Date Book, and Files affordances now live inside the constellation lobby
 * itself (Lens panel, HoverDetailCard, CaseFilePanel, ReselectDock,
 * ScenarioPanel, NotesOverlay). The pulse / planning / wrap dot reflects
 * date-session state so the player can read whether a date is ready, live,
 * or wrapping without leaving the lobby.
 */
export function FloatingNavCluster({
  current,
  hidden = false,
  liveDateState = "idle",
  onSelect,
}: FloatingNavClusterProps) {
  if (hidden) {
    return null;
  }

  const label = LIVE_DATE_LABEL[liveDateState];
  const active = current === "livedate";

  return (
    <motion.nav
      aria-label="Live date"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, pointerEvents: "auto" }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed bottom-6 right-6 z-40 flex flex-col gap-3"
    >
      <NavButton
        active={active}
        label={label}
        liveDateState={liveDateState}
        onClick={() => onSelect("livedate")}
      />
    </motion.nav>
  );
}

function NavButton({
  active,
  onClick,
  label,
  liveDateState,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  liveDateState: LiveDateState;
}) {
  const [hovered, setHovered] = useState(false);
  const focused = active || hovered;

  const surfaceClass = active
    ? "aura-glass-rose text-aura-rose outline outline-2 outline-offset-2 outline-aura-rose/30"
    : "aura-glass text-aura-rose hover:border-aura-rose/35 hover:text-aura-fuchsia";

  const showLiveDot = liveDateState === "live";
  const showPlanningDot = liveDateState === "planning";
  const showWrapDot = liveDateState === "wrap";

  return (
    <Tooltip message={label} placement="left-center">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        data-sfx="click"
        className={`aura-glass-lift relative grid size-14 cursor-pointer place-items-center rounded-full transition ${surfaceClass}`}
      >
        <span aria-hidden className="drop-shadow-[0_1px_3px_rgba(244,63,94,0.22)]">
          <LiveDateIcon focused={focused} state={liveDateState} />
        </span>
        {showLiveDot ? (
          <span aria-hidden className="absolute right-1.5 top-1.5 grid size-2.5 place-items-center">
            <span className="aura-pulse absolute inset-0 rounded-full bg-aura-rose/55" />
            <span className="relative size-1.5 rounded-full bg-aura-rose shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
          </span>
        ) : showPlanningDot ? (
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-aura-amber/80"
          />
        ) : showWrapDot ? (
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-aura-emerald/80"
          />
        ) : null}
      </button>
    </Tooltip>
  );
}

const LIVE_DATE_ICON_MOTION: Record<
  LiveDateState,
  { animate: { scale: number | number[] }; transition: object }
> = {
  live: {
    animate: { scale: [1, 1.14, 0.96, 1.1, 1] },
    transition: { duration: 0.95, repeat: Infinity, ease: "easeInOut" },
  },
  planning: {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
  },
  wrap: { animate: { scale: 1 }, transition: { duration: 0.25 } },
  idle: { animate: { scale: 1 }, transition: { duration: 0.25 } },
};

function LiveDateIcon({ focused, state }: { focused: boolean; state: LiveDateState }) {
  const filled = focused || state === "wrap" || state === "live";
  const iconMotion = LIVE_DATE_ICON_MOTION[state];
  return (
    <motion.svg
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      animate={iconMotion.animate}
      transition={iconMotion.transition}
    >
      <motion.path
        d="M10 17 C 3 12.5 2 7.5 5.5 5 C 7 4 8.75 4.5 10 6 C 11.25 4.5 13 4 14.5 5 C 18 7.5 17 12.5 10 17 Z"
        fill="currentColor"
        animate={{ fillOpacity: filled ? 0.92 : 0 }}
        transition={{ duration: 0.25 }}
      />
    </motion.svg>
  );
}
