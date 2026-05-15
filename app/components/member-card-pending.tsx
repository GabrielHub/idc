import { CupidMark } from "./dashboard-atoms";

export function PendingMemberCard({ className = "" }: { className?: string }) {
  return (
    <li className={`list-none ${className}`} aria-hidden>
      <div className="relative h-full p-px">
        <article className="relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-card border border-dashed border-aura-hairline-strong/60 bg-white/45 shadow-quiet">
          <div aria-hidden className="aura-dot-grid absolute inset-0 opacity-35" />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(244,63,94,0.07)_0%,transparent_62%)]"
          />
          <span className="pointer-events-none absolute left-3 top-3 rounded-pill bg-white/55 px-2.5 py-1 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint ring-1 ring-aura-hairline">
            F-PENDING
          </span>
          <CupidMark className="relative size-20 opacity-30" />
          <span className="relative mt-5 font-mono text-micro uppercase tracking-[0.32em] text-aura-rose/55">
            Pending
          </span>
        </article>
      </div>
    </li>
  );
}

/* Visibility class per (showSm, showLg, showXl) tuple. Keys are literal
   so Tailwind's JIT picks up every breakpoint variant used below. */
const FILLER_VISIBILITY_CLASS = {
  "1,1,1": "hidden sm:block",
  "1,1,0": "hidden sm:block xl:hidden",
  "1,0,1": "hidden sm:block lg:hidden xl:block",
  "1,0,0": "hidden sm:block lg:hidden",
  "0,1,1": "hidden lg:block",
  "0,1,0": "hidden lg:block xl:hidden",
  "0,0,1": "hidden xl:block",
} as const;

/* Returns one class string per filler slot needed to round out the
   roster grid. The grid uses 1/2/3/4 cols at base/sm/lg/xl; each filler
   is shown only at the breakpoints where the trailing row has a gap. */
export function rosterGridFillerClasses(memberCount: number): readonly string[] {
  if (memberCount <= 0) return [];
  const holes = {
    sm: (2 - (memberCount % 2)) % 2,
    lg: (3 - (memberCount % 3)) % 3,
    xl: (4 - (memberCount % 4)) % 4,
  };
  const fillerCount = Math.max(holes.sm, holes.lg, holes.xl);
  const result: string[] = [];
  for (let i = 0; i < fillerCount; i++) {
    const sm = i < holes.sm ? "1" : "0";
    const lg = i < holes.lg ? "1" : "0";
    const xl = i < holes.xl ? "1" : "0";
    const key = `${sm},${lg},${xl}` as keyof typeof FILLER_VISIBILITY_CLASS;
    result.push(FILLER_VISIBILITY_CLASS[key]);
  }
  return result;
}
