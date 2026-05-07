import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { Member, PortraitMood } from "../domain/game";
import { readyPortraitPath, selectPortraitAsset } from "./date-presentation-signals";
import type { SfxCue } from "./sfx-provider";

export const EASE_OUT_QUART: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

export function pad2(value: number) {
  return value.toString().padStart(2, "0");
}

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

type PortraitVariant =
  | "thumb"
  | "row"
  | "card"
  | "stage"
  | "hero"
  | "transcript"
  | "standee-bottom"
  | "standee-top";

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
  "standee-bottom": "size-full",
  "standee-top": "size-full",
};

const PORTRAIT_IMAGE: Record<PortraitVariant, string> = {
  thumb: "size-full object-cover object-top",
  row: "size-full object-cover object-top",
  card: "size-full object-cover object-top",
  stage: "size-full object-cover object-top",
  hero: "size-full object-contain object-bottom p-2",
  transcript: "size-full object-cover object-top",
  "standee-bottom": "size-full object-contain object-bottom",
  "standee-top": "size-full object-contain object-top",
};

const PORTRAIT_INITIALS: Record<PortraitVariant, string> = {
  thumb: "font-display text-base font-bold text-aura-rose",
  row: "font-display text-lg font-bold text-aura-rose",
  card: "font-display text-2xl font-bold text-aura-rose",
  stage: "font-display text-4xl font-bold text-aura-rose",
  hero: "font-display text-5xl font-bold text-aura-rose",
  transcript: "font-display text-xs font-bold text-aura-rose",
  "standee-bottom": "font-display text-display-xl font-bold text-aura-rose/30",
  "standee-top": "font-display text-display-xl font-bold text-aura-rose/30",
};

export function Portrait({
  member,
  variant,
  asset = "avatar",
  mood = "neutral",
}: {
  member: Member;
  variant: PortraitVariant;
  asset?: "avatar" | "portrait";
  mood?: PortraitMood;
}) {
  const portraitAsset = selectPortraitAsset(member, asset, mood);
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
  const showFallback = imagePath === undefined || failed;
  const activeImageSrc = retryImagePath ?? imagePath;

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden ${PORTRAIT_FRAME[variant]}`}
    >
      <AnimatePresence initial={false} mode="sync">
        {showFallback ? (
          <motion.span
            key="portrait-initials"
            className={`absolute inset-0 grid place-items-center ${PORTRAIT_INITIALS[variant]}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUART }}
          >
            {initialsFor(member.firstName)}
          </motion.span>
        ) : (
          <motion.img
            key={activeImageSrc}
            alt=""
            className={`absolute inset-0 ${PORTRAIT_IMAGE[variant]}`}
            onError={() => setFailed(true)}
            src={activeImageSrc}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.005 }}
            transition={{ duration: 0.42, ease: EASE_OUT_QUART }}
          />
        )}
      </AnimatePresence>
    </div>
  );
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
  const widthClass = scoreWidthClass(value);

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
          className={`aura-bar-fill h-full rounded-pill bg-gradient-to-r ${fillTone} ${widthClass}`}
        />
      </div>
    </div>
  );
}

const SCORE_WIDTH_CLASSES = [
  "w-0",
  "w-[5%]",
  "w-[10%]",
  "w-[15%]",
  "w-[20%]",
  "w-[25%]",
  "w-[30%]",
  "w-[35%]",
  "w-[40%]",
  "w-[45%]",
  "w-[50%]",
  "w-[55%]",
  "w-[60%]",
  "w-[65%]",
  "w-[70%]",
  "w-[75%]",
  "w-[80%]",
  "w-[85%]",
  "w-[90%]",
  "w-[95%]",
  "w-full",
] as const;

export function scoreWidthClass(score: number): (typeof SCORE_WIDTH_CLASSES)[number] {
  const boundedScore = Math.min(100, Math.max(0, score));
  const index = Math.round(boundedScore / 5);
  return SCORE_WIDTH_CLASSES[index] ?? "w-full";
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
/* Select input                                                       */
/* ------------------------------------------------------------------ */

export function SelectInput({
  label,
  value,
  options,
  disabled = false,
  className = "",
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <div className="relative mt-2">
        <select
          value={value}
          disabled={disabled}
          aria-label={label}
          onChange={(event) => onChange(event.currentTarget.value)}
          className="block w-full cursor-pointer appearance-none truncate rounded-tile border border-aura-hairline bg-white/70 px-3 py-2.5 pr-9 text-body font-semibold text-aura-ink outline-none transition hover:border-aura-hairline-strong focus:border-aura-rose disabled:cursor-not-allowed disabled:opacity-60"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-aura-faint">
          <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3.5 5.5L7 9L10.5 5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </label>
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
  sfx?: SfxCue | "none";
};

export function PrimaryButton({ children, onClick, disabled, full, sfx = "primary" }: ButtonProps) {
  return (
    <button
      type="button"
      data-sfx={sfx}
      onClick={onClick}
      disabled={disabled}
      className={`aura-cta cursor-pointer rounded-pill bg-gradient-to-r from-aura-rose via-aura-fuchsia to-aura-violet px-7 py-3.5 text-body font-semibold tracking-wide text-white shadow-cta ring-1 ring-white/40 ring-inset transition hover:-translate-y-px hover:shadow-cta-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  ariaPressed,
  sfx = "click",
}: ButtonProps) {
  const pressedClass = ariaPressed
    ? "aura-glass-ink border-transparent"
    : "aura-glass text-aura-muted hover:text-aura-ink";
  return (
    <button
      type="button"
      data-sfx={sfx}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ariaPressed}
      className={`cursor-pointer rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-40 ${pressedClass}`}
    >
      {children}
    </button>
  );
}

export function QuietButton({ children, onClick, disabled, sfx = "click" }: ButtonProps) {
  return (
    <button
      type="button"
      data-sfx={sfx}
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
export function ChromeButton({ children, onClick, disabled, sfx = "click" }: ButtonProps) {
  return (
    <button
      type="button"
      data-sfx={sfx}
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

/* ------------------------------------------------------------------ */
/* Tooltip                                                            */
/* ------------------------------------------------------------------ */

type TooltipPlacement = "bottom-start" | "bottom-end" | "bottom-center" | "top-center";

const TOOLTIP_PLACEMENT: Record<TooltipPlacement, string> = {
  "bottom-start": "left-0 top-full mt-2",
  "bottom-end": "right-0 top-full mt-2",
  "bottom-center": "left-1/2 top-full mt-2 -translate-x-1/2",
  "top-center": "left-1/2 bottom-full mb-2 -translate-x-1/2",
};

export function Tooltip({
  message,
  placement = "bottom-start",
  children,
  className = "",
}: {
  message: React.ReactNode;
  placement?: TooltipPlacement;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-30 w-max max-w-xs translate-y-1 rounded-card border border-aura-hairline bg-white/95 px-3.5 py-2 opacity-0 shadow-card backdrop-blur-sm transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 ${TOOLTIP_PLACEMENT[placement]}`}
      >
        <span className="aura-accent block text-label leading-snug text-aura-muted">{message}</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Cupid brand mark                                                   */
/*   Mirrors public/favicon.svg: rose to fuchsia to violet gradient,  */
/*   white heart pierced by an arrow at -22 degrees.                  */
/* ------------------------------------------------------------------ */

export function CupidMark({
  variant = "glyph",
  className = "",
}: {
  variant?: "glyph" | "tile";
  className?: string;
}) {
  const gradientId = `cupid-mark-${variant}`;
  const glowId = `cupid-mark-glow-${variant}`;

  if (variant === "tile") {
    return (
      <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Cupid">
        <defs>
          <linearGradient
            id={gradientId}
            x1="4"
            y1="2"
            x2="60"
            y2="62"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#f43f5e" />
            <stop offset="0.55" stopColor="#d946ef" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
          <radialGradient id={glowId} cx="22" cy="20" r="36" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
        <rect width="64" height="64" rx="14" fill={`url(#${glowId})`} />
        <g transform="rotate(-22 32 32)">
          <rect x="3" y="30.4" width="58" height="3.2" rx="1.6" fill="#ffffff" />
          <polygon points="3,32 11,27 11,37" fill="#ffffff" />
          <polygon points="9,32 16,28.5 16,35.5" fill="#ffffff" />
          <polygon points="61,32 51,26 51,38" fill="#ffffff" />
        </g>
        <path
          d="M32 51.2 C32 51.2 10.5 38.5 10.5 24.4 C10.5 17.7 15.9 12.6 22.4 12.6 C26.5 12.6 30 14.7 32 18.2 C34 14.7 37.5 12.6 41.6 12.6 C48.1 12.6 53.5 17.7 53.5 24.4 C53.5 38.5 32 51.2 32 51.2 Z"
          fill="#ffffff"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Cupid">
      <defs>
        <linearGradient
          id={gradientId}
          x1="4"
          y1="2"
          x2="60"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f43f5e" />
          <stop offset="0.55" stopColor="#d946ef" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <g transform="rotate(-22 32 32)">
        <rect x="6" y="30.4" width="52" height="2.6" rx="1.3" fill={`url(#${gradientId})`} />
        <polygon points="6,32 13,28 13,36" fill={`url(#${gradientId})`} />
        <polygon points="58,32 50,27 50,37" fill={`url(#${gradientId})`} />
      </g>
      <path
        d="M32 51.2 C32 51.2 10.5 38.5 10.5 24.4 C10.5 17.7 15.9 12.6 22.4 12.6 C26.5 12.6 30 14.7 32 18.2 C34 14.7 37.5 12.6 41.6 12.6 C48.1 12.6 53.5 17.7 53.5 24.4 C53.5 38.5 32 51.2 32 51.2 Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}
