import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { Member, PortraitMood } from "../domain/game";
import {
  readyPortraitMoodPaths,
  readyPortraitPath,
  selectPortraitAsset,
} from "./date-presentation-signals";
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
  | "chip"
  | "thumb"
  | "row"
  | "card"
  | "stage"
  | "hero"
  | "transcript"
  | "standee-bottom";

const PORTRAIT_FRAME: Record<PortraitVariant, string> = {
  chip: "size-7 rounded-full border border-white/85 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100",
  thumb:
    "size-12 rounded-full border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100",
  row: "size-16 rounded-full border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100",
  card: "size-24 rounded-full border-2 border-white/85 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100 shadow-quiet",
  stage:
    "size-44 rounded-full border-2 border-white/85 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100 shadow-card",
  hero: "h-72 w-56 rounded-[32px] border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100 shadow-quiet",
  transcript:
    "size-9 rounded-full border border-white/80 bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100",
  "standee-bottom": "size-full",
};

const PORTRAIT_IMAGE: Record<PortraitVariant, string> = {
  chip: "size-full object-cover object-top",
  thumb: "size-full object-cover object-top",
  row: "size-full object-cover object-top",
  card: "size-full object-cover object-top",
  stage: "size-full object-cover object-top",
  hero: "size-full object-contain object-bottom p-2",
  transcript: "size-full object-cover object-top",
  "standee-bottom": "size-full object-contain object-bottom",
};

const PORTRAIT_INITIALS: Record<PortraitVariant, string> = {
  chip: "font-display text-sm font-bold text-aura-rose",
  thumb: "font-display text-base font-bold text-aura-rose",
  row: "font-display text-lg font-bold text-aura-rose",
  card: "font-display text-2xl font-bold text-aura-rose",
  stage: "font-display text-4xl font-bold text-aura-rose",
  hero: "font-display text-5xl font-bold text-aura-rose",
  transcript: "font-display text-sm font-bold text-aura-rose",
  "standee-bottom": "font-display text-display-xl font-bold text-aura-rose/30",
};

const STANDEE_PORTRAIT_VARIANTS = new Set<PortraitVariant>(["standee-bottom"]);
const PORTRAIT_FADE_CLASS =
  "transition-opacity duration-[420ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]";

// Must match scripts/portraits/resize_avatars.py (DEFAULT_VARIANT_WIDTHS).
const AVATAR_SRCSET_WIDTHS = [128, 256, 512] as const;

const AVATAR_SIZES_FOR_VARIANT: Record<PortraitVariant, string | undefined> = {
  chip: "28px",
  thumb: "48px",
  row: "64px",
  card: "96px",
  stage: "176px",
  hero: "224px",
  transcript: "36px",
  "standee-bottom": undefined,
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
  const layerPaths = useMemo(() => buildPortraitLayerPaths(member, asset), [member.id, asset]);
  const activePath = readyPortraitPath(selectPortraitAsset(member, asset, mood));

  const [loadedPaths, setLoadedPaths] = useState<ReadonlySet<string>>(() => new Set());
  const [failedPaths, setFailedPaths] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    setLoadedPaths(new Set());
    setFailedPaths(new Set());
  }, [member.id, asset]);

  const isStandee = STANDEE_PORTRAIT_VARIANTS.has(variant);
  const activeReady =
    activePath !== undefined && loadedPaths.has(activePath) && !failedPaths.has(activePath);
  const avatarSrcSet = asset === "avatar" ? buildAvatarSrcSet(activePath) : undefined;
  const avatarSizes = asset === "avatar" ? AVATAR_SIZES_FOR_VARIANT[variant] : undefined;

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden ${PORTRAIT_FRAME[variant]}`}
    >
      {layerPaths.map((path) => {
        const isActive = path === activePath;
        const loaded = loadedPaths.has(path);
        const failed = failedPaths.has(path);
        const visible = isActive && loaded && !failed;

        return (
          <img
            key={path}
            ref={(node) => {
              if (node?.complete !== true) {
                return;
              }
              if (node.naturalWidth > 0) {
                addPath(setLoadedPaths, path);
              } else {
                addPath(setFailedPaths, path);
              }
            }}
            alt=""
            src={path}
            srcSet={isActive ? avatarSrcSet : undefined}
            sizes={isActive ? avatarSizes : undefined}
            className={`absolute inset-0 will-change-[opacity] ${PORTRAIT_FADE_CLASS} ${
              PORTRAIT_IMAGE[variant]
            } ${visible ? "opacity-100" : "opacity-0"}`}
            decoding="async"
            fetchPriority={isStandee ? "high" : "auto"}
            loading={isStandee ? "eager" : "lazy"}
            onLoad={() => addPath(setLoadedPaths, path)}
            onError={() => addPath(setFailedPaths, path)}
          />
        );
      })}
      <span
        aria-hidden="true"
        className={`absolute inset-0 grid place-items-center ${PORTRAIT_FADE_CLASS} ${
          PORTRAIT_INITIALS[variant]
        } ${activeReady ? "opacity-0" : "opacity-100"}`}
      >
        {initialsFor(member.firstName)}
      </span>
    </div>
  );
}

function buildAvatarSrcSet(activePath: string | undefined): string | undefined {
  if (activePath === undefined) {
    return undefined;
  }

  const lastDot = activePath.lastIndexOf(".");

  if (lastDot === -1) {
    return undefined;
  }

  const base = activePath.slice(0, lastDot);
  const extension = activePath.slice(lastDot);
  const widthEntries = AVATAR_SRCSET_WIDTHS.map(
    (width) => `${base}-${width}${extension} ${width}w`,
  );

  return [...widthEntries, `${activePath} 1024w`].join(", ");
}

function buildPortraitLayerPaths(member: Member, asset: "avatar" | "portrait"): string[] {
  if (asset === "avatar") {
    const avatarPath = readyPortraitPath(selectPortraitAsset(member, "avatar"));
    return avatarPath === undefined ? [] : [avatarPath];
  }

  return readyPortraitMoodPaths(member);
}

function addPath(
  setter: (updater: (current: ReadonlySet<string>) => ReadonlySet<string>) => void,
  path: string,
): void {
  setter((current) => {
    if (current.has(path)) {
      return current;
    }

    const next = new Set(current);
    next.add(path);
    return next;
  });
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part.at(0) ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
/* Select input                                                       */
/* ------------------------------------------------------------------ */

type SelectInputLayout = "field" | "inline" | "toolbar";
type SelectInputAlign = "left" | "right";

export type SelectInputOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export function SelectInput<TValue extends string = string>({
  label,
  value,
  options,
  disabled = false,
  layout = "field",
  align = "left",
  placeholder = "Select",
  className = "",
  onChange,
}: {
  label: string;
  value: TValue;
  options: ReadonlyArray<SelectInputOption<TValue>>;
  disabled?: boolean;
  layout?: SelectInputLayout;
  align?: SelectInputAlign;
  placeholder?: string;
  className?: string;
  onChange: (value: TValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const activeOption = options.find((option) => option.value === value);
  const activeLabel = activeOption?.label ?? (value.length > 0 ? value : placeholder);
  const isDisabled = disabled || options.length === 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current === null) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (isDisabled) {
      setOpen(false);
    }
  }, [isDisabled]);

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    event.preventDefault();
    setOpen(true);
  }

  function handleOptionSelect(option: SelectInputOption<TValue>) {
    if (option.value !== value) {
      onChange(option.value);
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={selectInputRootClass(layout, className)}>
      {layout === "toolbar" ? null : <span className={selectInputLabelClass(layout)}>{label}</span>}
      <div className={layout === "field" ? "relative mt-2" : "relative"}>
        <button
          type="button"
          data-sfx="menu"
          disabled={isDisabled}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={`${label}: ${activeLabel}`}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleTriggerKeyDown}
          className={selectInputTriggerClass(layout)}
        >
          {layout === "toolbar" ? <span className="text-aura-faint">{label}</span> : null}
          <span
            className={`min-w-0 flex-1 truncate text-left ${
              layout === "toolbar" ? "text-aura-ink" : ""
            }`}
          >
            {activeLabel}
          </span>
          <SelectInputChevron open={open} />
        </button>
        <AnimatePresence>
          {open ? (
            <motion.ul
              id={menuId}
              key="select-input-menu"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: EASE_OUT_QUART }}
              role="menu"
              aria-label={label}
              className={selectInputMenuClass(layout, align)}
            >
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <li key={option.value} role="none">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      data-sfx="menu"
                      onClick={() => handleOptionSelect(option)}
                      className={selectInputOptionClass(layout, selected)}
                    >
                      <span className="min-w-0 truncate">{option.label}</span>
                      {selected ? <SelectInputCheck /> : null}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function selectInputRootClass(layout: SelectInputLayout, className: string): string {
  const base =
    layout === "field"
      ? "block"
      : layout === "inline"
        ? "inline-flex items-center gap-2"
        : "relative";
  return [base, className].filter(Boolean).join(" ");
}

function selectInputLabelClass(layout: Exclude<SelectInputLayout, "toolbar">): string {
  const base = "font-mono text-micro font-semibold uppercase text-aura-faint";
  return layout === "field" ? `${base} tracking-[0.24em]` : `${base} tracking-[0.22em]`;
}

function selectInputTriggerClass(layout: SelectInputLayout): string {
  const base =
    "flex cursor-pointer items-center justify-between gap-2 border border-aura-hairline outline-none transition hover:border-aura-rose/40 focus-visible:border-aura-rose disabled:cursor-not-allowed disabled:opacity-60";

  if (layout === "field") {
    return `${base} w-full rounded-tile bg-white/70 px-3 py-2.5 text-body font-semibold text-aura-ink`;
  }

  if (layout === "inline") {
    return `${base} min-w-[8.5rem] max-w-[18rem] rounded-pill bg-white/70 px-3 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-ink`;
  }

  return `${base} rounded-pill bg-white/65 px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-muted hover:text-aura-ink`;
}

function selectInputMenuClass(layout: SelectInputLayout, align: SelectInputAlign): string {
  const side = align === "right" ? "right-0" : "left-0";
  const width = layout === "field" ? "w-full min-w-full" : "min-w-[14rem]";
  return `aura-glass-strong absolute ${side} z-50 mt-2 max-h-72 ${width} overflow-auto rounded-card p-1 shadow-card`;
}

function selectInputOptionClass(layout: SelectInputLayout, selected: boolean): string {
  const base =
    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-tile px-3 py-2 text-left transition";
  const typography =
    layout === "field"
      ? "text-body font-semibold"
      : "font-mono text-micro font-semibold uppercase tracking-[0.22em]";
  const tone = selected
    ? "bg-aura-ink text-white"
    : "text-aura-muted hover:bg-white/65 hover:text-aura-ink";
  return `${base} ${typography} ${tone}`;
}

function SelectInputChevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 14 14"
      fill="none"
      className={`size-3.5 shrink-0 text-aura-faint transition ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M3.5 5.5L7 9L10.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SelectInputCheck() {
  return (
    <svg aria-hidden viewBox="0 0 14 14" fill="none" className="size-3.5 shrink-0">
      <path
        d="M3.25 7.25L5.75 9.75L10.75 4.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
  buttonRef?: React.Ref<HTMLButtonElement>;
};

export function PrimaryButton({
  children,
  onClick,
  disabled,
  full,
  sfx = "primary",
  buttonRef,
}: ButtonProps) {
  return (
    <button
      ref={buttonRef}
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
  buttonRef,
}: ButtonProps) {
  const pressedClass = ariaPressed
    ? "aura-glass-ink border-transparent"
    : "aura-glass text-aura-muted hover:text-aura-ink";
  return (
    <button
      ref={buttonRef}
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

export function MenuButton({
  children,
  onClick,
  disabled,
  tone = "default",
  role = "menuitem",
  ariaChecked,
  sfx,
}: ButtonProps & {
  tone?: "default" | "danger";
  role?: "menuitem" | "menuitemcheckbox";
  ariaChecked?: boolean;
}) {
  const toneClass =
    tone === "danger"
      ? "text-aura-muted hover:bg-aura-rose/10 hover:text-aura-rose"
      : "text-aura-muted hover:bg-white/55 hover:text-aura-ink";
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === "menuitemcheckbox" ? ariaChecked : undefined}
      data-sfx={sfx ?? (tone === "danger" ? "danger" : "menu")}
      onClick={onClick}
      disabled={disabled}
      className={`block w-full cursor-pointer rounded-chip px-3 py-2 text-left font-mono text-micro font-semibold uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
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

type TooltipPlacement =
  | "bottom-start"
  | "bottom-end"
  | "bottom-center"
  | "top-center"
  | "left-center";

const TOOLTIP_REVEAL_Y = {
  rest: "translate-y-1",
  active: "group-hover:translate-y-0 group-focus-within:translate-y-0",
} as const;
const TOOLTIP_REVEAL_X = {
  rest: "translate-x-1",
  active: "group-hover:translate-x-0 group-focus-within:translate-x-0",
} as const;

const TOOLTIP_PLACEMENT: Record<
  TooltipPlacement,
  { position: string; rest: string; active: string }
> = {
  "bottom-start": { position: "left-0 top-full mt-2", ...TOOLTIP_REVEAL_Y },
  "bottom-end": { position: "right-0 top-full mt-2", ...TOOLTIP_REVEAL_Y },
  "bottom-center": {
    position: "left-1/2 top-full mt-2 -translate-x-1/2",
    ...TOOLTIP_REVEAL_Y,
  },
  "top-center": {
    position: "left-1/2 bottom-full mb-2 -translate-x-1/2",
    ...TOOLTIP_REVEAL_Y,
  },
  "left-center": {
    position: "right-full top-1/2 mr-3 -translate-y-1/2",
    ...TOOLTIP_REVEAL_X,
  },
};

export function Tooltip({
  message,
  placement = "bottom-start",
  children,
  className = "",
  messageClassName = "text-aura-muted",
}: {
  message: React.ReactNode;
  placement?: TooltipPlacement;
  children: React.ReactNode;
  className?: string;
  messageClassName?: string;
}) {
  const placementClass = TOOLTIP_PLACEMENT[placement];

  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-30 w-max max-w-xs rounded-card border border-aura-hairline bg-white/95 px-3.5 py-2 opacity-0 shadow-card backdrop-blur-sm transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100 ${placementClass.position} ${placementClass.rest} ${placementClass.active}`}
      >
        <span className={`aura-accent block text-label leading-snug ${messageClassName}`}>
          {message}
        </span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Cupid brand mark                                                   */
/*   Mirrors public/favicon.svg: aura gradient tile, scattered motes, */
/*   white heart with a rose dater dot and violet partner dot inside  */
/*   around a cream pair-fit spark.                                   */
/* ------------------------------------------------------------------ */

export function CupidMark({
  variant = "glyph",
  className = "",
}: {
  variant?: "glyph" | "tile";
  className?: string;
}) {
  const gradientId = `cupid-mark-${variant}`;
  const highlightId = `cupid-mark-highlight-${variant}`;
  const heartFillId = `cupid-mark-heart-${variant}`;
  const coreId = `cupid-mark-core-${variant}`;

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
          <radialGradient id={highlightId} cx="20" cy="16" r="42" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.42" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id={heartFillId}
            x1="14"
            y1="13"
            x2="50"
            y2="51"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#fff1f4" />
          </linearGradient>
          <radialGradient id={coreId} cx="32" cy="29.5" r="9" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff7e6" />
            <stop offset="0.55" stopColor="#fde68a" stopOpacity="0.7" />
            <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
        <rect width="64" height="64" rx="14" fill={`url(#${highlightId})`} />
        <g fill="#ffffff">
          <circle cx="12" cy="20" r="1.1" opacity="0.85" />
          <circle cx="52" cy="14" r="0.9" opacity="0.7" />
          <circle cx="53" cy="47" r="1.0" opacity="0.8" />
          <circle cx="33" cy="9" r="0.7" opacity="0.55" />
          <circle cx="56" cy="31" r="0.7" opacity="0.65" />
          <circle cx="7" cy="33" r="0.7" opacity="0.55" />
        </g>
        <circle cx="10" cy="46" r="0.9" fill="#fef3c7" opacity="0.85" />
        <g>
          <circle cx="8" cy="14" r="0.6" fill="#ffffff" opacity="0.35" />
          <circle cx="13" cy="9" r="0.7" fill="#ffffff" opacity="0.55" />
          <circle cx="19" cy="6.5" r="0.85" fill="#ffffff" opacity="0.7" />
          <circle cx="25.5" cy="6" r="1.0" fill="#ffffff" opacity="0.85" />
        </g>
        <path
          d="M32 51 C32 51 10.5 38.2 10.5 24.3 C10.5 17.7 15.9 12.6 22.4 12.6 C26.5 12.6 30 14.7 32 18.2 C34 14.7 37.5 12.6 41.6 12.6 C48.1 12.6 53.5 17.7 53.5 24.3 C53.5 38.2 32 51 32 51 Z"
          fill={`url(#${heartFillId})`}
        />
        <ellipse cx="32" cy="29.5" rx="9.5" ry="7" fill={`url(#${coreId})`} opacity="0.95" />
        <circle cx="27.4" cy="29.5" r="1.7" fill="#f43f5e" />
        <circle cx="36.6" cy="29.5" r="1.7" fill="#a78bfa" />
        <circle cx="32" cy="29.5" r="1.05" fill="#ffffff" />
        <circle cx="32" cy="29.5" r="0.5" fill="#fef9c3" />
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
        <radialGradient id={coreId} cx="32" cy="29.5" r="9" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M32 51 C32 51 10.5 38.2 10.5 24.3 C10.5 17.7 15.9 12.6 22.4 12.6 C26.5 12.6 30 14.7 32 18.2 C34 14.7 37.5 12.6 41.6 12.6 C48.1 12.6 53.5 17.7 53.5 24.3 C53.5 38.2 32 51 32 51 Z"
        fill={`url(#${gradientId})`}
      />
      <ellipse cx="32" cy="29.5" rx="9.5" ry="7" fill={`url(#${coreId})`} />
      <circle cx="27.4" cy="29.5" r="1.8" fill="#f43f5e" />
      <circle cx="36.6" cy="29.5" r="1.8" fill="#a78bfa" />
      <circle cx="32" cy="29.5" r="1.1" fill="#fff7e6" />
    </svg>
  );
}
