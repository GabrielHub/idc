import { motion } from "motion/react";
import { useState } from "react";
import { Tooltip } from "./dashboard-atoms";

export type RoomKey = "livedate" | "roster" | "datebook" | "files";

export type LiveDateState = "idle" | "planning" | "live" | "wrap";

export type FloatingNavClusterProps = {
  current: RoomKey;
  hidden?: boolean;
  liveDateState?: LiveDateState;
  onSelect: (room: RoomKey) => void;
};

const STATIC_LABELS: Record<Exclude<RoomKey, "livedate">, string> = {
  roster: "Roster",
  datebook: "Date Book",
  files: "Files",
};

const LIVE_DATE_LABEL: Record<LiveDateState, string> = {
  idle: "Live Date",
  planning: "Live Date · Planning",
  live: "On Date · Live",
  wrap: "Date Wrap",
};

export function FloatingNavCluster({
  current,
  hidden = false,
  liveDateState = "idle",
  onSelect,
}: FloatingNavClusterProps) {
  const buttons: RoomKey[] = ["livedate", "roster", "datebook", "files"];

  if (hidden) {
    return null;
  }

  return (
    <motion.nav
      aria-label="Cupid rooms"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, pointerEvents: "auto" }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed bottom-6 right-6 z-40 flex flex-col gap-3"
    >
      {buttons.map((room) => {
        const active = current === room;
        const label = room === "livedate" ? LIVE_DATE_LABEL[liveDateState] : STATIC_LABELS[room];
        return (
          <NavButton
            key={room}
            room={room}
            active={active}
            label={label}
            liveDateState={room === "livedate" ? liveDateState : undefined}
            onClick={() => onSelect(room)}
          />
        );
      })}
    </motion.nav>
  );
}

function NavButton({
  room,
  active,
  onClick,
  label,
  liveDateState,
}: {
  room: RoomKey;
  active: boolean;
  onClick: () => void;
  label: string;
  liveDateState?: LiveDateState;
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
        className={`aura-glass-lift relative grid size-14 cursor-pointer place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${surfaceClass}`}
      >
        <span aria-hidden className="drop-shadow-[0_1px_3px_rgba(244,63,94,0.22)]">
          <RoomIcon room={room} focused={focused} liveDateState={liveDateState} />
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

function RoomIcon({
  room,
  focused,
  liveDateState,
}: {
  room: RoomKey;
  focused: boolean;
  liveDateState?: LiveDateState;
}) {
  if (room === "livedate") {
    return <LiveDateIcon focused={focused} state={liveDateState ?? "idle"} />;
  }
  if (room === "roster") {
    return <RosterIcon focused={focused} />;
  }
  if (room === "datebook") {
    return <DateBookIcon focused={focused} />;
  }
  return <FilesIcon focused={focused} />;
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

function RosterIcon({ focused }: { focused: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.g
        animate={{ x: focused ? -1.5 : 1.5, opacity: focused ? 1 : 0.55 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <circle cx="4" cy="8" r="1.75" />
        <path d="M1.5 15.5c0-1.7 1.1-3 2.75-3" />
      </motion.g>
      <motion.g
        animate={{ y: focused ? -0.5 : 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <circle cx="10" cy="6.5" r="2.5" />
        <path d="M4.5 16.5c0-2.6 2.5-4.5 5.5-4.5s5.5 1.9 5.5 4.5" />
      </motion.g>
      <motion.g
        animate={{ x: focused ? 1.5 : -1.5, opacity: focused ? 1 : 0.55 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <circle cx="16" cy="8" r="1.75" />
        <path d="M18.5 15.5c0-1.7-1.1-3-2.75-3" />
      </motion.g>
    </svg>
  );
}

function DateBookIcon({ focused }: { focused: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <motion.g
        initial={false}
        animate={{ opacity: focused ? 0 : 1 }}
        transition={{ duration: 0.18 }}
      >
        <rect x="5.5" y="3" width="9" height="14" rx="1" />
        <line x1="7.75" y1="3" x2="7.75" y2="17" strokeWidth="0.9" />
      </motion.g>
      <motion.g
        initial={false}
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.25, delay: focused ? 0.12 : 0 }}
      >
        <path d="M3 5 L 10 5.5 L 10 16.5 L 3 17 Z" />
        <path d="M17 5 L 10 5.5 L 10 16.5 L 17 17 Z" />
        <line x1="5" y1="9" x2="8.5" y2="9" strokeWidth="0.7" />
        <line x1="5" y1="11.25" x2="8.5" y2="11.25" strokeWidth="0.7" />
        <line x1="5" y1="13.5" x2="8.5" y2="13.5" strokeWidth="0.7" />
        <line x1="11.5" y1="9" x2="15" y2="9" strokeWidth="0.7" />
        <line x1="11.5" y1="11.25" x2="15" y2="11.25" strokeWidth="0.7" />
        <line x1="11.5" y1="13.5" x2="15" y2="13.5" strokeWidth="0.7" />
      </motion.g>
    </svg>
  );
}

function FilesIcon({ focused }: { focused: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <motion.g
        initial={false}
        animate={{ opacity: focused ? 0 : 1 }}
        transition={{ duration: 0.18 }}
      >
        <path d="M3 6 L 8 6 L 10 8 L 17 8 L 17 16 L 3 16 Z" />
      </motion.g>
      <motion.g
        initial={false}
        animate={{ opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.25, delay: focused ? 0.12 : 0 }}
      >
        <path d="M3 5 L 8 5 L 10 7 L 17 7 L 17 12 L 3 12 Z" />
        <line x1="5.5" y1="9.5" x2="14.5" y2="9.5" strokeWidth="0.8" />
        <path d="M4.5 12 L 15.5 12 L 17.5 17 L 2.5 17 Z" />
      </motion.g>
    </svg>
  );
}
