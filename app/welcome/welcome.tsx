export function Welcome() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-aura-bg text-aura-ink">
      <Mesh />
      <Sparkles />
      <Stickers />

      <main className="relative z-10 mx-auto max-w-[480px] px-6 pt-8 pb-10 flex flex-col items-center min-h-screen">
        {/* Pre-title pill */}
        <div className="inline-flex items-center gap-2.5 text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted fade-in-up">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 rounded-full bg-aura-rose animate-ping opacity-75" />
            <span className="relative size-1.5 rounded-full bg-aura-rose" />
          </span>
          <span>aura &middot; live across 11 dimensions</span>
        </div>

        {/* Hero with aura rings behind */}
        <div className="relative mt-6 w-full grid place-items-center isolate">
          <AuraRings />
          <h1 className="relative font-display font-bold text-center text-aura-ink leading-[0.88] tracking-tight text-[clamp(52px,7.6vw,96px)] fade-in-up [animation-delay:120ms]">
            you are
            <br />
            a coach
            <br />
            <span className="relative inline-block text-aura-rose">
              of hearts.
              <WavyUnderline />
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="mt-6 text-center text-body leading-relaxed text-aura-muted max-w-sm fade-in-up [animation-delay:200ms]">
          A small bureau across{" "}
          <span className="text-aura-ink font-semibold">eleven dimensions</span> has matched you to{" "}
          <span className="text-aura-ink font-semibold">fourteen lonely strangers</span>.
          They&apos;re waiting.
        </p>

        {/* Frosted session card */}
        <div className="mt-6 w-full rounded-card bg-aura-card backdrop-blur-2xl border border-white/80 p-5 fade-in-up [animation-delay:300ms] shadow-card">
          {/* Card top strip */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-micro uppercase tracking-[0.28em] text-aura-faint font-mono">
              // session.0
            </div>
            <div className="flex items-center gap-1.5 text-micro uppercase tracking-[0.24em] text-aura-emerald font-semibold">
              <span className="size-1.5 rounded-full bg-aura-emerald animate-pulse" />
              ready
            </div>
          </div>

          <Field icon="👤" label="Coach" value="0x7F4A" trail="verified" />
          <Field icon="💌" label="Caseload" value="14 souls" trail="9 / 11 dim" />
          <Field icon="🌌" label="Plane" value="Adjacent" trail="x-timeline" />

          {/* CTA */}
          <a
            href="#"
            className="aura-cta group mt-5 block text-center rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet text-white py-3.5 font-semibold text-body tracking-wide shadow-cta hover:shadow-cta-hover hover:-translate-y-px transition-all"
          >
            Begin first session
            <span className="ml-2 inline-block group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </a>

          {/* Next up, pending hearts preview */}
          <div className="mt-4 pt-3 border-t border-aura-hairline">
            <div className="flex items-center justify-between mb-2">
              <div className="text-micro uppercase tracking-[0.28em] text-aura-muted font-semibold">
                next up
              </div>
              <div className="text-micro uppercase tracking-[0.2em] text-aura-faint font-mono">
                + 11 more
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Mini emoji="🧙" id="v.korv" tone="rose" />
              <Mini emoji="👻" id="g_host" tone="amber" />
              <Mini emoji="🕵" id="det-1959" tone="slate" />
            </div>
          </div>
        </div>

        {/* Footer micro-text */}
        <div className="mt-auto pt-6 text-center text-micro uppercase tracking-[0.28em] text-aura-faint font-medium fade-in-up [animation-delay:440ms]">
          private &middot; local &middot; your exes will never know
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Components                                                         */
/* ------------------------------------------------------------------ */

function Field({
  icon,
  label,
  value,
  trail,
}: {
  icon: string;
  label: string;
  value: string;
  trail?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-aura-hairline last:border-b-0">
      <span className="size-9 rounded-full bg-gradient-to-br from-pink-100 via-fuchsia-50 to-violet-100 grid place-items-center text-base shrink-0 border border-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_2px_6px_-2px_rgba(167,139,250,0.35)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-micro uppercase tracking-[0.28em] text-aura-faint font-semibold">
          {label}
        </div>
        <div className="text-body text-aura-ink font-semibold mt-0.5 truncate">{value}</div>
      </div>
      {trail ? (
        <div className="text-micro uppercase tracking-[0.2em] text-aura-faint font-medium font-mono shrink-0">
          {trail}
        </div>
      ) : null}
    </div>
  );
}

function Mini({
  emoji,
  id,
  tone,
}: {
  emoji: string;
  id: string;
  tone: "rose" | "amber" | "slate";
}) {
  const ring =
    tone === "rose"
      ? "ring-rose-300/80"
      : tone === "amber"
        ? "ring-amber-300/80"
        : "ring-slate-300/80";
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`size-7 rounded-full bg-white grid place-items-center text-sm border border-white ring-2 ${ring} shadow-sm`}
      >
        {emoji}
      </span>
      <span className="text-label text-aura-muted font-mono font-medium">{id}</span>
    </div>
  );
}

const AURA_RINGS = [
  { r: 140, delayClass: "[animation-delay:0s]" },
  { r: 200, delayClass: "[animation-delay:0.9s]" },
  { r: 260, delayClass: "[animation-delay:1.8s]" },
  { r: 320, delayClass: "[animation-delay:2.7s]" },
];

function AuraRings() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 m-auto pointer-events-none"
      width="640"
      height="640"
      viewBox="0 0 640 640"
    >
      <defs>
        <linearGradient id="ring-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#d946ef" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {AURA_RINGS.map((ring) => (
        <circle
          key={ring.r}
          cx="320"
          cy="320"
          r={ring.r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="0.8"
          className={`aura-ring ${ring.delayClass}`}
        />
      ))}
    </svg>
  );
}

function WavyUnderline() {
  return (
    <svg
      aria-hidden
      className="absolute -bottom-3 left-0 w-full h-3 text-aura-rose"
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
    >
      <path
        d="M 0 4 Q 10 0, 20 4 T 40 4 T 60 4 T 80 4 T 100 4"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        className="aura-wave"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Mesh() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full bg-aura-mesh-rose/80   blur-[110px] aura-blob-1" />
      <div className="absolute top-10  -right-32 w-[560px] h-[560px] rounded-full bg-aura-mesh-violet/80 blur-[110px] aura-blob-2" />
      <div className="absolute -bottom-40 left-1/3 w-[700px] h-[700px] rounded-full bg-aura-mesh-amber/90 blur-[110px] aura-blob-3" />
      <div className="absolute bottom-20 -right-20 w-[520px] h-[520px] rounded-full bg-aura-mesh-sky/80   blur-[110px] aura-blob-4" />
    </div>
  );
}

const SPARKLES = [
  {
    size: 14,
    className: "absolute aura-twinkle top-[8%] left-[8%] rotate-[12deg] [animation-delay:0s]",
  },
  {
    size: 18,
    className: "absolute aura-twinkle top-[16%] left-[84%] rotate-[-8deg] [animation-delay:0.6s]",
  },
  {
    size: 10,
    className: "absolute aura-twinkle top-[30%] left-[94%] rotate-[22deg] [animation-delay:0.9s]",
  },
  {
    size: 12,
    className: "absolute aura-twinkle top-[52%] left-[5%] rotate-[18deg] [animation-delay:1.1s]",
  },
  {
    size: 16,
    className: "absolute aura-twinkle top-[70%] left-[92%] rotate-[4deg] [animation-delay:0.3s]",
  },
  {
    size: 14,
    className: "absolute aura-twinkle top-[82%] left-[10%] rotate-[-14deg] [animation-delay:1.4s]",
  },
  {
    size: 8,
    className: "absolute aura-twinkle top-[44%] left-[88%] rotate-[30deg] [animation-delay:1.8s]",
  },
  {
    size: 10,
    className: "absolute aura-twinkle top-[62%] left-[12%] rotate-[-18deg] [animation-delay:2s]",
  },
];

function Sparkles() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {SPARKLES.map((star, i) => (
        <svg
          key={i}
          width={star.size}
          height={star.size}
          viewBox="0 0 24 24"
          className={star.className}
        >
          <path
            d="M12 1 L13.5 9 L22 12 L13.5 15 L12 23 L10.5 15 L2 12 L10.5 9 Z"
            fill="white"
            stroke="#f9a8d4"
            strokeWidth="1"
          />
        </svg>
      ))}
    </div>
  );
}

function Stickers() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none select-none">
      <div className="absolute top-[7%]    right-[7%]  rotate-[14deg]">
        <div className="text-3xl aura-wobble">👽</div>
      </div>
      <div className="absolute top-[42%]   left-[5%]   -rotate-12">
        <div className="text-2xl aura-wobble [animation-delay:0.8s]">🪐</div>
      </div>
      <div className="absolute bottom-[18%] right-[10%] rotate-[18deg]">
        <div className="text-3xl aura-wobble [animation-delay:1.4s]">💋</div>
      </div>
      <div className="absolute bottom-[8%]  left-[10%] -rotate-6">
        <div className="text-2xl aura-wobble [animation-delay:2.1s]">💖</div>
      </div>
      <div className="absolute top-[30%]   left-[8%]   rotate-[10deg]">
        <div className="text-xl  aura-wobble [animation-delay:2.6s]">✨</div>
      </div>
    </div>
  );
}
