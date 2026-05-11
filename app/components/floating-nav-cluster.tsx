import { motion } from "motion/react";

export type RoomKey = "livedate" | "roster" | "datebook" | "files";

export type FloatingNavClusterProps = {
  current: RoomKey;
  hidden?: boolean;
  onSelect: (room: RoomKey) => void;
};

const ROOM_LABELS: Record<RoomKey, string> = {
  livedate: "Live Date",
  roster: "Roster",
  datebook: "Date Book",
  files: "Files",
};

export function FloatingNavCluster({ current, hidden = false, onSelect }: FloatingNavClusterProps) {
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
        return (
          <NavButton
            key={room}
            active={active}
            onClick={() => onSelect(room)}
            label={ROOM_LABELS[room]}
            icon={<RoomIcon room={room} />}
          />
        );
      })}
    </motion.nav>
  );
}

function NavButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-sfx="click"
      className={`group relative grid size-14 cursor-pointer place-items-center rounded-full border bg-white text-aura-ink shadow-aura-soft transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-aura-rose ring-2 ring-aura-rose/30"
          : "border-aura-hairline hover:border-aura-rose/30"
      }`}
    >
      <span aria-hidden className="text-aura-rose">
        {icon}
      </span>
      <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-pill bg-aura-ink px-3 py-1 font-mono text-micro uppercase tracking-[0.22em] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

function RoomIcon({ room }: { room: RoomKey }) {
  if (room === "livedate") {
    return (
      <svg
        viewBox="0 0 20 20"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M10 17 C 3 12.5 2 7.5 5.5 5 C 7 4 8.75 4.5 10 6 C 11.25 4.5 13 4 14.5 5 C 18 7.5 17 12.5 10 17 Z" />
      </svg>
    );
  }
  if (room === "roster") {
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
        <circle cx="10" cy="6.5" r="2.5" />
        <path d="M4.5 16.5c0-2.6 2.5-4.5 5.5-4.5s5.5 1.9 5.5 4.5" />
        <circle cx="4" cy="8" r="1.75" />
        <path d="M1.5 15.5c0-1.7 1.1-3 2.75-3" />
        <circle cx="16" cy="8" r="1.75" />
        <path d="M18.5 15.5c0-1.7-1.1-3-2.75-3" />
      </svg>
    );
  }
  if (room === "datebook") {
    return (
      <svg
        viewBox="0 0 20 20"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="4" y="3" width="12" height="14" rx="1.5" />
        <path d="M7 3v14" />
        <path d="M11 7h3M11 10h3M11 13h3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="13" height="13" rx="1.5" />
      <path d="M3 8h13" />
      <path d="M6 4V3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1" />
    </svg>
  );
}
