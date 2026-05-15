import { useId, type ReactNode } from "react";
import { Link } from "react-router";

/* ========================================================================
   Form primitives. Reusable building blocks for settings panels, dialogs,
   and any control surface. Built to work in both light and dark themes,
   leaning on the bg-white/X dark-mode remap so the same markup reads as
   cream paper in light mode and TIDAL-style raised tiles in dark mode.
   ======================================================================== */

/* SectionHeader: a flat bold section title. Use to break up long settings
   panels. Optional mono eyebrow above for context. */
export function SectionHeader({ children, eyebrow }: { children: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mt-8 mb-4 flex flex-col gap-1">
      {eyebrow ? (
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
        {children}
      </h3>
    </div>
  );
}

/* Toggle: iOS-style on/off switch. */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border transition-colors duration-150 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${
        checked ? "border-aura-rose/40 bg-aura-rose" : "border-aura-hairline-strong bg-aura-card"
      }`}
    >
      <span
        aria-hidden
        className={`block size-[1.125rem] rounded-full bg-white shadow-quiet transition-transform duration-150 ${
          checked ? "translate-x-[1.4rem]" : "translate-x-[0.1rem]"
        }`}
      />
    </button>
  );
}

/* SettingsList: a group wrapper for stacked SettingsRows. Provides one
   rounded card with hairline dividers between rows. */
export function SettingsList({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col divide-y divide-aura-hairline overflow-hidden rounded-card border border-aura-hairline bg-white/72">
      {children}
    </div>
  );
}

/* SettingsRow: title + optional description + right-aligned control. Designed
   to sit inside SettingsList. When onClick is provided the whole row is a
   button (use for cases without a focusable inner control). */
export function SettingsRow({
  title,
  description,
  control,
  onClick,
}: {
  title: ReactNode;
  description?: ReactNode;
  control?: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-display text-label font-semibold leading-tight text-aura-ink">{title}</p>
        {description ? (
          <p className="text-label leading-snug text-aura-muted">{description}</p>
        ) : null}
      </div>
      {control ? <div className="flex shrink-0 items-center gap-2">{control}</div> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full cursor-pointer items-center gap-4 bg-transparent px-5 py-4 text-left transition hover:bg-white/40"
      >
        {body}
      </button>
    );
  }

  return <div className="flex w-full items-center gap-4 px-5 py-4">{body}</div>;
}

/* RadioRow: a row with a radio bullet, title, description, and optional
   inline trailing control (e.g. a quality dropdown). Pass a stable name to
   group multiple rows into a radio group. */
export function RadioRow<T extends string>({
  value,
  selected,
  onSelect,
  title,
  description,
  trailing,
  name,
}: {
  value: T;
  selected: T;
  onSelect: (v: T) => void;
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  name: string;
}) {
  const checked = value === selected;
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`flex w-full cursor-pointer items-center gap-4 px-5 py-4 transition ${
        checked ? "bg-rose-500/[0.06] ring-1 ring-inset ring-aura-rose/35" : "hover:bg-white/40"
      }`}
    >
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={`relative grid size-5 shrink-0 place-items-center rounded-full border-2 transition ${
          checked ? "border-aura-rose" : "border-aura-hairline-strong"
        }`}
      >
        {checked ? <span className="size-2.5 rounded-full bg-aura-rose" /> : null}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-display text-label font-semibold leading-tight text-aura-ink">{title}</p>
        {description ? (
          <p className="text-label leading-snug text-aura-muted">{description}</p>
        ) : null}
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </label>
  );
}

/* SegmentedControl: pill-style or underline-style tab group. The pill
   variant is the long-running pattern used in DocPatternGrid; the underline
   variant matches TIDAL-style top-level tabs. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  variant = "pill",
}: {
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
  variant?: "pill" | "underline";
}) {
  if (variant === "underline") {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex items-center gap-6 border-b border-aura-hairline"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={`relative cursor-pointer pb-3 font-display text-label font-semibold transition ${
                active ? "text-aura-ink" : "text-aura-muted hover:text-aura-ink"
              }`}
            >
              {option.label}
              {active ? (
                <span
                  aria-hidden
                  className="absolute -bottom-px left-0 right-0 h-[2px] rounded-pill bg-aura-rose"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex items-center gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer rounded-pill px-3.5 py-1.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
              active
                ? "bg-aura-ink text-aura-paper shadow-quiet"
                : "aura-glass text-aura-muted hover:text-aura-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ChevronLinkRow: settings-style row that navigates somewhere. Title +
   description on the left, right-pointing chevron on the right. */
export function ChevronLinkRow({
  to,
  title,
  description,
}: {
  to: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  const isExternal = /^(https?:|mailto:)/i.test(to);
  const inner = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-display text-label font-semibold leading-tight text-aura-ink">{title}</p>
        {description ? (
          <p className="text-label leading-snug text-aura-muted">{description}</p>
        ) : null}
      </div>
      <span aria-hidden className="shrink-0 text-aura-faint">
        <ChevronRightGlyph />
      </span>
    </>
  );

  const className =
    "group flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-white/40";

  if (isExternal) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {inner}
    </Link>
  );
}

function ChevronRightGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
