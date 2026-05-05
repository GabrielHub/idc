import { useEffect, useState } from "react";

import type { Member, PortraitAsset } from "../domain/game";

/* ------------------------------------------------------------------ */
/* Eyebrow + headline                                                 */
/* ------------------------------------------------------------------ */

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
      {children}
    </p>
  );
}

export function MutedLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Hairline rule                                                      */
/* ------------------------------------------------------------------ */

export function Hairline({ className = "" }: { className?: string }) {
  return <div className={`aura-rule ${className}`} />;
}

/* ------------------------------------------------------------------ */
/* Portrait                                                           */
/* ------------------------------------------------------------------ */

type PortraitVariant = "thumb" | "row" | "card" | "stage" | "hero" | "transcript";

const PORTRAIT_FRAME: Record<PortraitVariant, string> = {
  thumb:
    "size-12 rounded-full border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100",
  row: "size-16 rounded-2xl border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100",
  card: "size-24 rounded-full border-2 border-white/85 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100 shadow-quiet",
  stage:
    "size-44 rounded-full border-2 border-white/85 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100 shadow-card",
  hero: "h-72 w-56 rounded-[32px] border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100 shadow-quiet",
  transcript:
    "size-9 rounded-full border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100",
};

const PORTRAIT_IMAGE: Record<PortraitVariant, string> = {
  thumb: "size-full object-cover object-top",
  row: "size-full object-cover object-top",
  card: "size-full object-cover object-top",
  stage: "size-full object-cover object-top",
  hero: "size-full object-contain object-bottom p-2",
  transcript: "size-full object-cover object-top",
};

const PORTRAIT_INITIALS: Record<PortraitVariant, string> = {
  thumb: "font-display text-base font-bold text-aura-rose",
  row: "font-display text-lg font-bold text-aura-rose",
  card: "font-display text-2xl font-bold text-aura-rose",
  stage: "font-display text-4xl font-bold text-aura-rose",
  hero: "font-display text-5xl font-bold text-aura-rose",
  transcript: "font-display text-xs font-bold text-aura-rose",
};

export function Portrait({
  member,
  variant,
  asset = "avatar",
}: {
  member: Member;
  variant: PortraitVariant;
  asset?: "avatar" | "portrait";
}) {
  const portraitAsset =
    asset === "portrait" ? member.portraits.neutral.portrait : member.portraits.neutral.avatar;
  const imagePath = readyPortraitPath(portraitAsset);
  const [failed, setFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    setFailed(false);
    setRetryToken(0);
  }, [imagePath]);

  useEffect(() => {
    if (imagePath === undefined || !failed) {
      return;
    }

    const retryId = window.setTimeout(() => {
      setRetryToken((current) => current + 1);
      setFailed(false);
    }, 2000);

    return () => window.clearTimeout(retryId);
  }, [failed, imagePath, retryToken]);

  const retryImagePath =
    imagePath === undefined ? undefined : portraitPathWithRetryToken(imagePath, retryToken);

  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden ${PORTRAIT_FRAME[variant]}`}>
      {imagePath === undefined || failed ? (
        <span className={PORTRAIT_INITIALS[variant]}>{initialsFor(member.name)}</span>
      ) : (
        <img
          alt=""
          className={PORTRAIT_IMAGE[variant]}
          onError={() => setFailed(true)}
          src={retryImagePath ?? imagePath}
        />
      )}
    </div>
  );
}

function readyPortraitPath(asset: PortraitAsset) {
  return asset.model === "pending" ? undefined : asset.cutoutPath;
}

function portraitPathWithRetryToken(imagePath: string, retryToken: number) {
  if (retryToken === 0) {
    return imagePath;
  }

  const separator = imagePath.includes("?") ? "&" : "?";
  return `${imagePath}${separator}portraitRetry=${retryToken}`;
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part.at(0) ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Meter, used inline; kept hairline thin                             */
/* ------------------------------------------------------------------ */

export function Meter({
  label,
  value,
  tone = "rose",
  size = "sm",
}: {
  label: string;
  value: number;
  tone?: "rose" | "violet" | "emerald" | "amber";
  size?: "sm" | "md";
}) {
  const fillTone =
    tone === "violet"
      ? "from-aura-violet to-aura-fuchsia"
      : tone === "emerald"
        ? "from-aura-emerald to-aura-violet"
        : tone === "amber"
          ? "from-aura-amber to-aura-rose"
          : "from-aura-rose to-aura-fuchsia";
  const trackHeight = size === "md" ? "h-1.5" : "h-1";
  const target = Math.max(0, Math.min(100, value)) / 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted">
          {label}
        </span>
        <span className="font-mono text-micro font-semibold tabular-nums text-aura-ink">
          {value}
        </span>
      </div>
      <div className={`overflow-hidden rounded-pill bg-aura-hairline ${trackHeight}`}>
        <div
          aria-hidden
          className={`aura-bar-fill h-full rounded-pill bg-gradient-to-r ${fillTone}`}
          style={{ "--bar-target": String(target) } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mono status pill, used in the top rail and inline chrome           */
/* ------------------------------------------------------------------ */

const STATUS_TONES = {
  rose: "text-aura-rose",
  violet: "text-violet-600",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  neutral: "text-aura-muted",
} as const;

export function MonoStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: keyof typeof STATUS_TONES;
}) {
  return (
    <span className="inline-flex items-baseline gap-2 font-mono text-micro uppercase tracking-[0.24em]">
      <span className="text-aura-faint">{label}</span>
      <span className={`font-semibold ${STATUS_TONES[tone]}`}>{value}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                            */
/* ------------------------------------------------------------------ */

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  ariaPressed?: boolean;
  full?: boolean;
};

export function PrimaryButton({ children, onClick, disabled, full }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`aura-cta cursor-pointer rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-7 py-3.5 text-body font-semibold tracking-wide text-white shadow-cta ring-1 ring-white/40 ring-inset transition hover:-translate-y-px hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, disabled, ariaPressed }: ButtonProps) {
  const pressedClass = ariaPressed
    ? "aura-glass-ink border-transparent"
    : "aura-glass text-aura-muted hover:text-aura-ink";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ariaPressed}
      className={`cursor-pointer rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-40 ${pressedClass}`}
    >
      {children}
    </button>
  );
}

export function QuietButton({ children, onClick, disabled }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-faint transition hover:text-aura-rose disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * ChromeButton sits inside a parent glass pill (the chrome tools cluster).
 * It carries no surface of its own, only hover + active text shading, so the
 * parent pill provides the floating glass.
 */
export function ChromeButton({ children, onClick, disabled }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer whitespace-nowrap rounded-pill px-3.5 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted transition hover:bg-white/55 hover:text-aura-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Live dot                                                           */
/* ------------------------------------------------------------------ */

export function LiveDot({ tone = "rose" }: { tone?: "rose" | "emerald" | "amber" }) {
  const color =
    tone === "emerald" ? "bg-aura-emerald" : tone === "amber" ? "bg-aura-amber" : "bg-aura-rose";
  return (
    <span className="relative inline-flex size-1.5">
      <span className={`absolute inset-0 rounded-full ${color} opacity-70 aura-pulse`} />
      <span className={`relative size-1.5 rounded-full ${color}`} />
    </span>
  );
}
