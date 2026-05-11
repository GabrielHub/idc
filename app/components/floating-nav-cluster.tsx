import { motion } from "motion/react";

export type RoomKey = "office" | "gallery" | "casebook" | "stage" | "files";

export type FloatingNavClusterProps = {
  current: RoomKey;
  stageEnabled: boolean;
  hidden?: boolean;
  onSelect: (room: RoomKey) => void;
};

const ROOM_LABELS: Record<RoomKey, string> = {
  office: "Office",
  gallery: "Gallery",
  casebook: "Casebook",
  stage: "Stage",
  files: "Files",
};

export function FloatingNavCluster({
  current,
  stageEnabled,
  hidden = false,
  onSelect,
}: FloatingNavClusterProps) {
  const buttons: RoomKey[] = ["office", "gallery", "casebook", "stage", "files"];

  return (
    <motion.nav
      aria-label="Cupid rooms"
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: hidden ? 0 : 1,
        y: hidden ? 24 : 0,
        pointerEvents: hidden ? "none" : "auto",
      }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed bottom-6 right-6 z-40 flex flex-col gap-3"
    >
      {buttons.map((room) => {
        const disabled = room === "stage" && !stageEnabled;
        const active = current === room;
        return (
          <NavButton
            key={room}
            active={active}
            disabled={disabled}
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
  disabled,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
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
  if (room === "office") {
    return (
      <svg
        viewBox="0 0 20 20"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="6" width="14" height="10" rx="1.5" />
        <path d="M3 9h14" />
        <path d="M7 6V4h6v2" />
      </svg>
    );
  }
  if (room === "gallery") {
    return (
      <svg
        viewBox="0 0 20 20"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="4" width="14" height="12" rx="1.5" />
        <circle cx="8" cy="9" r="1.5" />
        <path d="M3 14l4-4 3 3 4-5 3 4" />
      </svg>
    );
  }
  if (room === "casebook") {
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
  if (room === "stage") {
    return (
      <svg
        viewBox="0 0 20 20"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 7l3-3h8l3 3" />
        <path d="M5 7v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" />
        <path d="M10 12v3" />
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
