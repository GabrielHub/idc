import type { ReactNode } from "react";

import type { OllamaModelSummary } from "../services/ai/model-catalog";
import { MutedLabel } from "./dashboard-atoms";

export function FormSection({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-aura-hairline bg-white/45 p-5">
      <header className="space-y-1.5">
        <MutedLabel>{label}</MutedLabel>
        {title === undefined ? null : (
          <h3 className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
            {title}
          </h3>
        )}
        {description === undefined ? null : (
          <p className="text-label leading-relaxed text-aura-muted">{description}</p>
        )}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AdvancedDetails({
  label = "Advanced settings",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-card border border-aura-hairline bg-white/40 px-4 py-2 open:py-3 open:shadow-quiet">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint transition hover:text-aura-ink">
        <span>{label}</span>
        <span
          aria-hidden="true"
          className="text-aura-faint transition group-open:rotate-180 group-hover:text-aura-ink"
        >
          ▾
        </span>
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

export function SetupFeedback({
  saveError,
  saveHint,
  className = "",
}: {
  saveError: string | null;
  saveHint: string | null;
  className?: string;
}) {
  if (saveError !== null) {
    return (
      <p
        className={`rounded-tile border border-aura-rose/30 bg-rose-50/75 px-3 py-2 text-label leading-relaxed text-aura-rose ${className}`}
      >
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em]">
          save failed ::
        </span>{" "}
        {saveError}
      </p>
    );
  }

  if (saveHint !== null) {
    return (
      <p
        className={`rounded-tile border border-aura-amber/40 bg-aura-amber/10 px-3 py-2 text-label leading-relaxed text-aura-ink ${className}`}
      >
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-amber">
          pending ::
        </span>{" "}
        {saveHint}
      </p>
    );
  }

  return null;
}

export function TextInput({
  label,
  value,
  type = "text",
  placeholder,
  disabled = false,
  prominence = "normal",
  onChange,
}: {
  label: string;
  value: string;
  type?: "password" | "text";
  placeholder?: string;
  disabled?: boolean;
  prominence?: "normal" | "primary";
  onChange: (value: string) => void;
}) {
  const disabledClass = disabled ? "cursor-not-allowed opacity-60" : "focus:border-aura-rose";
  const labelClass =
    prominence === "primary"
      ? "text-aura-rose tracking-[0.26em]"
      : "text-aura-faint tracking-[0.24em]";
  const inputClass =
    prominence === "primary" ? "px-4 py-4 text-body font-semibold" : "px-3 py-2.5 text-label";

  return (
    <label className="block">
      <span className={`font-mono text-micro font-semibold uppercase ${labelClass}`}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        className={`mt-2 block w-full rounded-tile border border-aura-hairline bg-white/65 font-mono text-aura-ink outline-none transition placeholder:text-aura-faint ${inputClass} ${disabledClass}`}
      />
    </label>
  );
}

export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
        {label}
      </span>
      <p className="mt-2 rounded-tile border border-aura-hairline bg-white/55 px-3 py-2.5 font-mono text-label text-aura-ink">
        {value}
      </p>
    </div>
  );
}

export function uniqueModelOptions(
  models: Array<OllamaModelSummary | { id: string; label: string }>,
): OllamaModelSummary[] {
  const seen = new Set<string>();
  const options: OllamaModelSummary[] = [];

  for (const model of models) {
    const name = "name" in model ? model.name : model.id;

    if (seen.has(name)) {
      continue;
    }

    seen.add(name);
    options.push({
      name,
      running: "running" in model ? model.running : undefined,
    });
  }

  return options;
}
