/**
 * The one canonical face-down room card. Every place that shows a room card
 * from behind (the onboarding draw fan, the Room Manifest slots, and the
 * in-lobby draw before a card flips face-up) renders this so the deck reads as
 * a single physical object instead of two competing treatments.
 *
 * The art is built entirely from percentage-based geometry and a vector
 * emblem, so the same component reads correctly from a ~40px manifest pip up
 * to a ~320px hero card in the draw. Callers own the outer size and rounding;
 * this fills the parent and inherits its radius.
 */
export function RoomCardBack({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative block size-full overflow-hidden rounded-[inherit] bg-[linear-gradient(155deg,#0b0b1a_0%,#16142a_46%,#0a0a17_100%)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] ring-1 ring-white/15 ${className ?? ""}`}
    >
      {/* Inner registration frame — reads as a card border at every scale. */}
      <span className="absolute inset-[7%] rounded-[8%] ring-1 ring-white/12" />
      {/* Rose/fuchsia bloom behind the sigil. */}
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(244,63,94,0.26)_0%,rgba(217,70,239,0.12)_34%,transparent_64%)]" />
      {/* Centered Cupid sigil, sized as a fraction of the card. */}
      <span className="absolute inset-0 grid place-items-center">
        <span className="block aspect-square w-[42%] max-w-[120px]">
          <CardBackSigil />
        </span>
      </span>
      {/* Diagonal sheen for a printed-foil feel. */}
      <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_42%,rgba(255,255,255,0.07)_50%,transparent_58%)]" />
    </span>
  );
}

function CardBackSigil() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-full drop-shadow-[0_0_6px_rgba(244,63,94,0.55)]"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="room-card-back-spark" x1="20" y1="8" x2="80" y2="92">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="55%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="34" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      <path
        d="M50 6C54.5 33 67 45.5 94 50C67 54.5 54.5 67 50 94C45.5 67 33 54.5 6 50C33 45.5 45.5 33 50 6Z"
        fill="url(#room-card-back-spark)"
      />
      <circle cx="50" cy="50" r="6" fill="#fff5f7" opacity="0.92" />
    </svg>
  );
}
