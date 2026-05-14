import { Children, Fragment, isValidElement, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";

export type DocGroupId = "roadmap" | "product" | "gameplay" | "workflows" | "support";

export interface DocMeta {
  slug: string;
  group: DocGroupId;
  title: string;
  description: string;
  order?: number;
}

export interface DocSubsectionEntry {
  id: string;
  title: string;
}

export interface DocSectionEntry {
  id: string;
  title: string;
  level?: 2 | 3;
  body: ReactNode;
  subsections?: DocSubsectionEntry[];
}

export interface DocPageProps {
  meta: DocMeta;
  sections: DocSectionEntry[];
  lede?: ReactNode;
}

export function DocPage({ sections, lede }: DocPageProps) {
  return (
    <div className="flex flex-col gap-2">
      {lede ? <DocLede>{lede}</DocLede> : null}
      {sections.map((section, index) => (
        <DocSection key={section.id} {...section} first={index === 0 && !lede} />
      ))}
    </div>
  );
}

export function DocLede({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 font-serif text-display-xs leading-[1.55] italic text-aura-muted">
      {children}
    </p>
  );
}

function DocSection({ id, title, body, first }: DocSectionEntry & { first: boolean }) {
  return (
    <section className="flex flex-col gap-0">
      <DocHeading id={id} level={2} first={first}>
        {title}
      </DocHeading>
      <div className="flex flex-col gap-4 text-body leading-[1.78] text-aura-ink/86">{body}</div>
    </section>
  );
}

export function DocSubsection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0 pt-2">
      <DocHeading id={id} level={3}>
        {title}
      </DocHeading>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function DocHeading({
  id,
  level,
  first,
  children,
}: {
  id: string;
  level: 2 | 3;
  first?: boolean;
  children: ReactNode;
}) {
  const Tag: "h2" | "h3" = level === 2 ? "h2" : "h3";
  const sizeClass =
    level === 2
      ? "font-display text-display-sm font-semibold tracking-tight leading-[1.12]"
      : "font-display text-lead font-semibold leading-tight";
  const spacingClass =
    level === 2 ? (first ? "pt-0 mt-2" : "mt-12 border-t border-aura-hairline pt-6") : "mt-8 mb-1";

  return (
    <Tag
      id={id}
      className={`group flex items-baseline gap-2 text-aura-ink scroll-mt-28 ${sizeClass} ${spacingClass}`}
    >
      <a
        href={`#${id}`}
        aria-label={`Link to ${id}`}
        className="font-mono text-micro font-normal text-aura-faint opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0 hover:text-aura-rose focus-visible:opacity-100 focus-visible:translate-x-0"
      >
        #
      </a>
      <span>{children}</span>
    </Tag>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-aura-ink">{children}</strong>;
}

export function Em({ children }: { children: ReactNode }) {
  return <em className="font-serif italic">{children}</em>;
}

export function DocPath({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[0.4rem] border border-aura-hairline bg-gradient-to-b from-white/95 to-rose-100/40 px-1.5 py-[0.08em] font-mono text-micro text-aura-ink">
      {children}
    </code>
  );
}

export const DocCode = DocPath;

const REDACTED_DOC_PATH_PREFIX = "/docs/workflows";
const SHOULD_REDACT_WORKFLOW_LINKS = import.meta.env.MODE === "desktop";

function isRedactedDocTarget(to: string): boolean {
  const path = to.split("#")[0]?.split("?")[0] ?? to;
  return path === REDACTED_DOC_PATH_PREFIX || path.startsWith(`${REDACTED_DOC_PATH_PREFIX}/`);
}

export function DocKbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded-[0.4rem] border border-aura-hairline bg-white/85 px-1.5 py-[0.08em] font-mono text-micro text-aura-ink shadow-[0_1px_0_0_rgba(15,23,42,0.08)]">
      {children}
    </kbd>
  );
}

export function DocLink({ to, children }: { to: string; children: ReactNode }) {
  const isExternal = /^(https?:|mailto:)/i.test(to);
  const className =
    "cursor-pointer text-aura-rose underline decoration-rose-400/45 underline-offset-[4px] transition hover:text-aura-fuchsia hover:decoration-aura-fuchsia";

  if (SHOULD_REDACT_WORKFLOW_LINKS && isRedactedDocTarget(to)) {
    return (
      <span
        role="link"
        aria-disabled="true"
        title="Workflow link redacted"
        className="inline-flex cursor-not-allowed items-baseline gap-1 text-aura-faint"
      >
        <span className="line-through decoration-aura-rose/55 decoration-2">{children}</span>
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-rose">
          [REDACTED]
        </span>
      </span>
    );
  }

  if (isExternal) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

export function DocList({
  items,
  tone = "rose",
}: {
  items: ReactNode[];
  tone?: "rose" | "violet" | "muted";
}) {
  const dot =
    tone === "violet"
      ? "bg-aura-violet shadow-[0_0_0_3px_rgba(167,139,250,0.18)]"
      : tone === "muted"
        ? "bg-aura-muted shadow-[0_0_0_3px_rgba(100,116,139,0.14)]"
        : "bg-aura-rose shadow-[0_0_0_3px_rgba(244,63,94,0.12)]";

  return (
    <ul className="my-2 flex list-none flex-col gap-1.5 pl-0">
      {items.map((item, index) => (
        <li key={index} className="relative pl-6 text-body leading-[1.65]">
          <span
            aria-hidden
            className={`absolute left-2 top-[0.6em] size-[0.34rem] rounded-full ${dot}`}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function DocSteps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="my-2 flex list-none flex-col gap-2 pl-0 [counter-reset:doc-ol]">
      {items.map((item, index) => (
        <li
          key={index}
          className="relative pl-9 text-body leading-[1.65] [counter-increment:doc-ol]"
        >
          <span
            aria-hidden
            className="absolute left-0 top-[0.15em] font-mono text-micro tracking-[0.18em] text-aura-faint [content:counter(doc-ol,decimal-leading-zero)]"
          />
          <span className="absolute left-0 top-[0.15em] font-mono text-micro tracking-[0.18em] text-aura-faint">
            {pad2(index + 1)}
          </span>
          {item}
        </li>
      ))}
    </ol>
  );
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function DocDefList({ items }: { items: Array<{ term: ReactNode; def: ReactNode }> }) {
  return (
    <dl className="my-2 flex flex-col gap-2.5">
      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(11rem,16rem)_1fr] gap-x-5 gap-y-1 border-l-2 border-aura-hairline pl-4 transition hover:border-aura-rose/40"
        >
          <dt className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
            {item.term}
          </dt>
          <dd className="text-body leading-[1.65] text-aura-ink/86">{item.def}</dd>
        </div>
      ))}
    </dl>
  );
}

export type CalloutVariant = "note" | "warn" | "danger" | "info" | "ok";

const CALLOUT_STYLES: Record<
  CalloutVariant,
  { bg: string; border: string; chip: string; label: string }
> = {
  note: {
    bg: "from-rose-50/70 to-white/40",
    border: "border-aura-hairline",
    chip: "text-aura-rose",
    label: "note",
  },
  warn: {
    bg: "from-amber-50/85 to-white/45",
    border: "border-amber-200/70",
    chip: "text-amber-700",
    label: "watch",
  },
  danger: {
    bg: "from-rose-100/80 to-rose-50/40",
    border: "border-rose-300/70",
    chip: "text-rose-700",
    label: "do not",
  },
  info: {
    bg: "from-violet-50/75 to-white/45",
    border: "border-violet-200/60",
    chip: "text-violet-700",
    label: "context",
  },
  ok: {
    bg: "from-emerald-50/70 to-white/45",
    border: "border-emerald-200/60",
    chip: "text-emerald-700",
    label: "ok shape",
  },
};

export function DocCallout({
  variant = "note",
  title,
  children,
}: {
  variant?: CalloutVariant;
  title?: ReactNode;
  children: ReactNode;
}) {
  const style = CALLOUT_STYLES[variant];

  return (
    <aside
      className={`my-2 rounded-tile border ${style.border} bg-gradient-to-br ${style.bg} px-5 py-4`}
    >
      <div
        className={`mb-1.5 flex items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] ${style.chip}`}
      >
        <span>// {style.label}</span>
        {title ? <span className="text-aura-muted">·</span> : null}
        {title ? <span className="text-aura-ink">{title}</span> : null}
      </div>
      <div className="flex flex-col gap-2 text-body leading-[1.7] text-aura-ink/86">{children}</div>
    </aside>
  );
}

export function DocQuote({
  children,
  attribution,
}: {
  children: ReactNode;
  attribution?: ReactNode;
}) {
  return (
    <figure className="my-2 rounded-tile border-l-[3px] border-aura-rose bg-gradient-to-b from-rose-50/55 to-transparent px-5 py-3">
      <blockquote className="font-serif text-lead italic leading-[1.5] text-aura-ink/82">
        {children}
      </blockquote>
      {attribution ? (
        <figcaption className="mt-1.5 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function DocCodeBlock({ children, language }: { children: string; language?: string }) {
  return (
    <div className="my-3 overflow-hidden rounded-tile border border-aura-hairline bg-gradient-to-b from-white/95 to-aura-bg/65 shadow-[0_12px_32px_-22px_rgba(15,23,42,0.18)]">
      {language ? (
        <div className="flex items-center justify-between border-b border-aura-hairline px-4 py-1.5 font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
          <span>// {language}</span>
        </div>
      ) : null}
      <pre className="overflow-x-auto px-5 py-4 font-mono text-label leading-[1.62] text-aura-ink">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function DocTable({ headers, rows }: { headers: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="my-3 overflow-x-auto rounded-tile border border-aura-hairline bg-gradient-to-b from-white/55 to-transparent">
      <table className="w-full border-collapse text-label">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="border-b border-aura-hairline bg-rose-500/[0.06] px-4 py-2.5 text-left font-mono text-micro uppercase tracking-[0.18em] font-semibold text-aura-muted"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border-b border-aura-hairline px-4 py-2.5 align-top text-aura-ink/86 last:border-b-0"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type PipelineStepKind = "input" | "process" | "service" | "guard" | "data" | "output";

const STEP_TONE: Record<PipelineStepKind, { ring: string; chip: string; label: string }> = {
  input: { ring: "ring-violet-300/60", chip: "bg-violet-100 text-violet-700", label: "input" },
  process: { ring: "ring-aura-rose/50", chip: "bg-rose-100 text-rose-700", label: "process" },
  service: { ring: "ring-aura-rose/60", chip: "bg-rose-100 text-rose-700", label: "service" },
  guard: { ring: "ring-amber-300/60", chip: "bg-amber-100 text-amber-800", label: "guard" },
  data: { ring: "ring-sky-300/55", chip: "bg-sky-100 text-sky-700", label: "data" },
  output: { ring: "ring-emerald-300/55", chip: "bg-emerald-100 text-emerald-700", label: "output" },
};

export interface PipelineStep {
  id: string;
  label: string;
  kind: PipelineStepKind;
  detail?: ReactNode;
}

export function DocPipeline({ steps, title }: { steps: PipelineStep[]; title?: string }) {
  return (
    <figure className="my-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/82 to-aura-bg/60 p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.32)]">
      {title ? (
        <figcaption className="mb-4 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // {title}
        </figcaption>
      ) : null}
      <ol className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-0">
        {steps.map((step, index) => {
          const tone = STEP_TONE[step.kind];
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step.id}
              className="relative flex flex-1 flex-col gap-2 md:items-center md:px-2"
            >
              <div
                className={`flex h-full flex-col gap-2 rounded-tile bg-white/72 px-4 py-3 ring-1 ring-inset ${tone.ring} backdrop-blur`}
              >
                <span
                  className={`inline-flex w-fit items-center rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${tone.chip}`}
                >
                  {tone.label}
                </span>
                <p className="font-display text-label font-semibold leading-tight text-aura-ink">
                  {step.label}
                </p>
                {step.detail ? (
                  <p className="font-serif text-[0.85rem] italic leading-snug text-aura-muted">
                    {step.detail}
                  </p>
                ) : null}
              </div>
              {!isLast ? (
                <span
                  aria-hidden
                  className="self-center font-mono text-display-xs leading-none text-aura-faint md:absolute md:-right-[0.45rem] md:top-1/2 md:-translate-y-1/2"
                >
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

export interface FlowNode {
  id: string;
  label: string;
  kind: PipelineStepKind;
  row: number;
  col: number;
  detail?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  kind?: "default" | "guard" | "loop";
}

export function DocFlowchart({
  nodes,
  edges,
  title,
  cols = 4,
  rows,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  title?: string;
  cols?: number;
  rows?: number;
}) {
  const resolvedRows = rows ?? Math.max(...nodes.map((node) => node.row)) + 1;
  const cellWidth = 100 / cols;
  const cellHeight = 100 / resolvedRows;

  const lookup = new Map(nodes.map((node) => [node.id, node]));

  return (
    <figure className="my-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/82 to-aura-bg/55 p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.32)]">
      {title ? (
        <figcaption className="mb-4 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // {title}
        </figcaption>
      ) : null}
      <div className="relative w-full" style={{ aspectRatio: `${cols} / ${resolvedRows * 0.55}` }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          aria-hidden
        >
          <defs>
            <marker
              id="flow-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="rgba(244,63,94,0.55)" />
            </marker>
            <marker
              id="flow-arrow-guard"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="rgba(217,119,6,0.7)" />
            </marker>
          </defs>
          {edges.map((edge, index) => {
            const a = lookup.get(edge.from);
            const b = lookup.get(edge.to);
            if (!a || !b) return null;
            const x1 = (a.col + 0.5) * cellWidth;
            const y1 = (a.row + 0.5) * cellHeight;
            const x2 = (b.col + 0.5) * cellWidth;
            const y2 = (b.row + 0.5) * cellHeight;
            const stroke =
              edge.kind === "guard"
                ? "rgba(217,119,6,0.55)"
                : edge.kind === "loop"
                  ? "rgba(167,139,250,0.6)"
                  : "rgba(244,63,94,0.42)";
            const dash =
              edge.kind === "guard" ? "1.4 1.4" : edge.kind === "loop" ? "0.8 1" : "none";
            const marker = edge.kind === "guard" ? "url(#flow-arrow-guard)" : "url(#flow-arrow)";
            return (
              <line
                key={`${edge.from}-${edge.to}-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth="0.45"
                strokeDasharray={dash}
                markerEnd={marker}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {nodes.map((node) => {
          const tone = STEP_TONE[node.kind];
          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(node.col + 0.5) * cellWidth}%`,
                top: `${(node.row + 0.5) * cellHeight}%`,
                width: `${cellWidth * 0.86}%`,
              }}
            >
              <div
                className={`flex flex-col gap-1 rounded-tile border border-aura-hairline bg-white/88 px-3 py-2 ring-1 ring-inset ${tone.ring} shadow-[0_8px_24px_-18px_rgba(15,23,42,0.4)] backdrop-blur`}
              >
                <span
                  className={`inline-flex w-fit items-center rounded-pill px-1.5 py-[0.05rem] font-mono text-micro font-semibold uppercase tracking-[0.18em] ${tone.chip}`}
                >
                  {tone.label}
                </span>
                <p className="font-display text-label font-semibold leading-tight text-aura-ink">
                  {node.label}
                </p>
                {node.detail ? (
                  <p className="font-serif text-micro italic leading-snug text-aura-muted">
                    {node.detail}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export function DocLayerStack({
  layers,
  title,
}: {
  layers: Array<{ id: string; label: string; owns: ReactNode[]; tone?: "canon" | "ai" | "ui" }>;
  title?: string;
}) {
  return (
    <figure className="my-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/82 to-aura-bg/55 p-5">
      {title ? (
        <figcaption className="mb-3 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // {title}
        </figcaption>
      ) : null}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[12rem_1fr]">
        {layers.map((layer) => {
          const tone =
            layer.tone === "ai"
              ? "border-l-violet-300 from-violet-50/55"
              : layer.tone === "ui"
                ? "border-l-sky-300 from-sky-50/55"
                : "border-l-rose-300 from-rose-50/55";
          return (
            <Fragment key={layer.id}>
              <div
                className={`flex items-center gap-3 border-l-4 ${tone} bg-gradient-to-r to-transparent px-4 py-3`}
              >
                <p className="font-display text-label font-semibold text-aura-ink">{layer.label}</p>
              </div>
              <ul className="flex flex-col gap-1 px-4 py-3 text-label text-aura-ink/86">
                {layer.owns.map((line, index) => (
                  <li key={index} className="flex items-start gap-2 leading-snug">
                    <span
                      aria-hidden
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-aura-rose/65"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Fragment>
          );
        })}
      </div>
    </figure>
  );
}

export type CompareTone = "positive" | "negative" | "neutral";

const COMPARE_TONE: Record<CompareTone, { ring: string; chip: string; label: string }> = {
  positive: {
    ring: "ring-emerald-200/70",
    chip: "bg-emerald-100 text-emerald-700",
    label: "good shape",
  },
  negative: { ring: "ring-rose-300/70", chip: "bg-rose-100 text-rose-700", label: "wrong shape" },
  neutral: { ring: "ring-aura-hairline", chip: "bg-aura-card text-aura-muted", label: "note" },
};

export function DocCompareGrid({
  columns,
  title,
}: {
  columns: Array<{ heading: string; tone: CompareTone; items: ReactNode[] }>;
  title?: string;
}) {
  return (
    <figure className="my-3 flex flex-col gap-3">
      {title ? (
        <figcaption className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // {title}
        </figcaption>
      ) : null}
      <div
        className={`grid gap-3`}
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column, index) => {
          const tone = COMPARE_TONE[column.tone];
          return (
            <div
              key={index}
              className={`flex flex-col gap-3 rounded-card bg-white/72 p-4 ring-1 ring-inset ${tone.ring}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${tone.chip}`}
                >
                  {tone.label}
                </span>
                <p className="font-display text-label font-semibold text-aura-ink">
                  {column.heading}
                </p>
              </div>
              <ul className="flex flex-col gap-1.5 text-label leading-snug text-aura-ink/86">
                {column.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-aura-rose/65"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export type VisibilityTier = "public" | "gated" | "hidden";

export function DocVisibilityTiers({
  tiers,
}: {
  tiers: Array<{ id: string; label: string; tier: VisibilityTier; items: ReactNode[] }>;
}) {
  const tierTone: Record<VisibilityTier, { chip: string; ring: string; label: string }> = {
    public: {
      chip: "bg-emerald-100 text-emerald-700",
      ring: "ring-emerald-200/70",
      label: "public",
    },
    gated: { chip: "bg-amber-100 text-amber-700", ring: "ring-amber-200/70", label: "gated" },
    hidden: { chip: "bg-rose-100 text-rose-700", ring: "ring-rose-300/70", label: "never visible" },
  };

  return (
    <div className="my-3 grid grid-cols-1 gap-3 md:grid-cols-3">
      {tiers.map((tier) => {
        const tone = tierTone[tier.tier];
        return (
          <div
            key={tier.id}
            className={`flex flex-col gap-3 rounded-card bg-white/76 p-4 ring-1 ring-inset ${tone.ring}`}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-label font-semibold text-aura-ink">{tier.label}</p>
              <span
                className={`inline-flex items-center rounded-pill px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${tone.chip}`}
              >
                {tone.label}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5 text-label leading-snug text-aura-ink/86">
              {tier.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 size-1 shrink-0 rounded-full bg-aura-rose/65"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function DocFingerprint({
  name,
  premise,
  register,
  patternsUsed,
  patternsRefused,
  tics,
  sampleOpener,
}: {
  name: string;
  premise: string;
  register: string;
  patternsUsed: string[];
  patternsRefused: string[];
  tics: string[];
  sampleOpener: string;
}) {
  return (
    <article className="my-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/82 to-rose-50/35 p-5">
      <header className="mb-3 flex flex-col gap-1">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // fingerprint
        </p>
        <h4 className="font-display text-lead font-semibold leading-tight text-aura-ink">{name}</h4>
        <p className="font-serif text-label italic leading-snug text-aura-muted">{premise}</p>
      </header>
      <dl className="grid grid-cols-1 gap-3 md:grid-cols-[8rem_1fr]">
        <dt className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
          register
        </dt>
        <dd className="text-label text-aura-ink/86">{register}</dd>
        <dt className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
          uses
        </dt>
        <dd className="text-label text-aura-ink/86">{patternsUsed.join(", ")}</dd>
        <dt className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
          refuses
        </dt>
        <dd className="text-label text-aura-ink/86">{patternsRefused.join(", ")}</dd>
        <dt className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
          tics
        </dt>
        <dd className="text-label text-aura-ink/86">{tics.join(", ")}</dd>
      </dl>
      <DocQuote attribution="opener">{sampleOpener}</DocQuote>
    </article>
  );
}

export type PatternAccent = "rose" | "violet" | "amber" | "emerald" | "sky" | "fuchsia" | "slate";

export interface DocPattern {
  number: number;
  name: string;
  description: ReactNode;
  fingerprint: string;
  examples: string[];
  accent?: PatternAccent;
}

interface PatternAccentTone {
  bubble: string;
  bubbleBorder: string;
  bubbleShadow: string;
  canonTag: string;
  flavorPill: string;
  fpLabel: string;
  threadBorder: string;
  threadLead: string;
  numAccent: string;
  indexHover: string;
}

const PATTERN_ACCENT: Record<PatternAccent, PatternAccentTone> = {
  rose: {
    bubble: "bg-gradient-to-br from-rose-100/85 to-rose-50/35",
    bubbleBorder: "border-rose-200/65",
    bubbleShadow: "shadow-[0_22px_52px_-26px_rgba(244,63,94,0.5)]",
    canonTag: "text-rose-600 border-rose-300/75 bg-rose-50/90",
    flavorPill: "text-rose-700 border-rose-300/70 bg-rose-100/75",
    fpLabel: "text-rose-600",
    threadBorder: "border-rose-300/55",
    threadLead: "bg-rose-300/70",
    numAccent: "text-rose-500",
    indexHover: "hover:text-rose-600 hover:border-rose-300/60",
  },
  violet: {
    bubble: "bg-gradient-to-br from-violet-100/80 to-violet-50/35",
    bubbleBorder: "border-violet-200/65",
    bubbleShadow: "shadow-[0_22px_52px_-26px_rgba(167,139,250,0.5)]",
    canonTag: "text-violet-700 border-violet-300/70 bg-violet-50/90",
    flavorPill: "text-violet-700 border-violet-300/70 bg-violet-100/75",
    fpLabel: "text-violet-700",
    threadBorder: "border-violet-300/55",
    threadLead: "bg-violet-300/70",
    numAccent: "text-violet-500",
    indexHover: "hover:text-violet-700 hover:border-violet-300/60",
  },
  amber: {
    bubble: "bg-gradient-to-br from-amber-100/80 to-amber-50/35",
    bubbleBorder: "border-amber-200/65",
    bubbleShadow: "shadow-[0_22px_52px_-26px_rgba(245,158,11,0.45)]",
    canonTag: "text-amber-700 border-amber-300/70 bg-amber-50/90",
    flavorPill: "text-amber-800 border-amber-300/70 bg-amber-100/75",
    fpLabel: "text-amber-700",
    threadBorder: "border-amber-300/55",
    threadLead: "bg-amber-300/70",
    numAccent: "text-amber-500",
    indexHover: "hover:text-amber-700 hover:border-amber-300/60",
  },
  emerald: {
    bubble: "bg-gradient-to-br from-emerald-100/80 to-emerald-50/35",
    bubbleBorder: "border-emerald-200/65",
    bubbleShadow: "shadow-[0_22px_52px_-26px_rgba(16,185,129,0.45)]",
    canonTag: "text-emerald-700 border-emerald-300/70 bg-emerald-50/90",
    flavorPill: "text-emerald-800 border-emerald-300/70 bg-emerald-100/75",
    fpLabel: "text-emerald-700",
    threadBorder: "border-emerald-300/55",
    threadLead: "bg-emerald-300/70",
    numAccent: "text-emerald-500",
    indexHover: "hover:text-emerald-700 hover:border-emerald-300/60",
  },
  sky: {
    bubble: "bg-gradient-to-br from-sky-100/80 to-sky-50/35",
    bubbleBorder: "border-sky-200/65",
    bubbleShadow: "shadow-[0_22px_52px_-26px_rgba(56,189,248,0.45)]",
    canonTag: "text-sky-700 border-sky-300/70 bg-sky-50/90",
    flavorPill: "text-sky-700 border-sky-300/70 bg-sky-100/75",
    fpLabel: "text-sky-700",
    threadBorder: "border-sky-300/55",
    threadLead: "bg-sky-300/70",
    numAccent: "text-sky-500",
    indexHover: "hover:text-sky-700 hover:border-sky-300/60",
  },
  fuchsia: {
    bubble: "bg-gradient-to-br from-fuchsia-100/80 to-fuchsia-50/35",
    bubbleBorder: "border-fuchsia-200/65",
    bubbleShadow: "shadow-[0_22px_52px_-26px_rgba(217,70,239,0.5)]",
    canonTag: "text-fuchsia-700 border-fuchsia-300/70 bg-fuchsia-50/90",
    flavorPill: "text-fuchsia-700 border-fuchsia-300/70 bg-fuchsia-100/75",
    fpLabel: "text-fuchsia-700",
    threadBorder: "border-fuchsia-300/55",
    threadLead: "bg-fuchsia-300/70",
    numAccent: "text-fuchsia-500",
    indexHover: "hover:text-fuchsia-700 hover:border-fuchsia-300/60",
  },
  slate: {
    bubble: "bg-gradient-to-br from-slate-200/80 to-slate-50/40",
    bubbleBorder: "border-slate-300/65",
    bubbleShadow: "shadow-[0_22px_52px_-26px_rgba(71,85,105,0.45)]",
    canonTag: "text-slate-700 border-slate-400/70 bg-slate-50/90",
    flavorPill: "text-slate-700 border-slate-400/70 bg-slate-100/75",
    fpLabel: "text-slate-700",
    threadBorder: "border-slate-400/55",
    threadLead: "bg-slate-400/70",
    numAccent: "text-slate-500",
    indexHover: "hover:text-slate-700 hover:border-slate-400/60",
  },
};

export function DocPatternGrid({ patterns }: { patterns: DocPattern[] }) {
  const [density, setDensity] = useState<"full" | "compact">("full");
  const total = patterns.length;

  return (
    <div className="my-4 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-micro uppercase tracking-[0.28em] text-aura-faint">
          // {pad2(total)} specimens · canonical sample first, references follow
        </span>
        <div className="inline-flex items-center gap-1 rounded-pill border border-aura-hairline bg-white/70 p-1">
          {(["full", "compact"] as const).map((mode) => {
            const active = density === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setDensity(mode)}
                aria-pressed={active}
                className={`cursor-pointer rounded-pill px-3 py-1 font-mono text-micro font-semibold uppercase tracking-[0.22em] transition ${
                  active ? "bg-aura-ink text-white" : "text-aura-muted hover:text-aura-ink"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      <nav
        aria-label="Specimen index"
        className="sticky top-28 z-10 flex flex-wrap items-center gap-1.5 rounded-card border border-aura-hairline bg-gradient-to-b from-white/82 to-aura-bg/55 px-4 py-3 shadow-[0_14px_38px_-22px_rgba(244,63,94,0.22)] backdrop-blur-[20px]"
      >
        <span className="mr-1 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
          // jump to
        </span>
        {patterns.map((pattern) => {
          const accent = PATTERN_ACCENT[pattern.accent ?? "rose"];
          return (
            <a
              key={pattern.number}
              href={`#pattern-${pattern.number}`}
              className={`group inline-flex cursor-pointer items-baseline gap-1.5 rounded-chip border border-transparent bg-white/45 px-2 py-1 font-mono text-micro tracking-[0.04em] text-aura-muted transition hover:-translate-y-px hover:bg-white/85 ${accent.indexHover}`}
            >
              <span className="font-semibold text-aura-ink group-hover:text-current">
                {pad2(pattern.number)}
              </span>
              <span className="font-sans text-micro normal-case tracking-normal text-aura-muted">
                {pattern.name}
              </span>
            </a>
          );
        })}
      </nav>

      <div className="flex flex-col">
        {patterns.map((pattern, index) => (
          <PatternSpecimen
            key={pattern.number}
            pattern={pattern}
            total={total}
            flipped={index % 2 === 1}
            first={index === 0}
            compact={density === "compact"}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4 font-mono text-micro uppercase tracking-[0.32em] text-aura-faint">
        <span aria-hidden className="h-px w-20 bg-aura-hairline-strong" />
        <span>
          // end of file · {pad2(total)} / {pad2(total)}
        </span>
        <span aria-hidden className="h-px w-20 bg-aura-hairline-strong" />
      </div>
    </div>
  );
}

function PatternSpecimen({
  pattern,
  total,
  flipped,
  first,
  compact,
}: {
  pattern: DocPattern;
  total: number;
  flipped: boolean;
  first: boolean;
  compact: boolean;
}) {
  const accent = PATTERN_ACCENT[pattern.accent ?? "rose"];
  const [canonical, ...references] = pattern.examples;
  const canonicalRotation = flipped ? "rotate-[0.35deg]" : "-rotate-[0.35deg]";
  const canonicalRadius = flipped ? "rounded-[26px_26px_8px_26px]" : "rounded-[26px_26px_26px_8px]";

  return (
    <section
      id={`pattern-${pattern.number}`}
      className={`relative grid scroll-mt-72 gap-x-10 gap-y-6 py-12 ${
        compact ? "lg:py-6" : "lg:py-14"
      } ${first ? "" : "border-t border-dashed border-aura-hairline-strong"} ${
        flipped ? "lg:grid-cols-[1.8fr_1fr]" : "lg:grid-cols-[1fr_1.8fr]"
      }`}
    >
      {!first ? (
        <span
          aria-hidden
          className="absolute -top-[5px] left-1/2 size-2.5 -translate-x-1/2 rounded-full border border-aura-hairline-strong bg-aura-paper"
        />
      ) : null}

      <div
        className={`flex flex-col gap-3 ${flipped ? "lg:order-2 lg:items-end lg:text-right" : ""}`}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-display-xl font-bold leading-none tracking-tight tabular-nums text-aura-ink">
            {pad2(pattern.number)}
          </span>
          <span className="font-mono text-label font-normal tracking-[0.04em] text-aura-faint">
            <span className={accent.numAccent}>/</span> {pad2(total)}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-chip border px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${accent.flavorPill}`}
        >
          <span aria-hidden className="size-1.5 rotate-45 bg-current" />
          flavor · {pattern.accent ?? "rose"}
        </span>
        <h4 className="font-display text-display-sm font-semibold leading-[1.1] tracking-tight text-aura-ink">
          {pattern.name}
        </h4>
        <div className="font-serif text-lead font-light italic leading-snug text-aura-muted lg:max-w-[32ch]">
          {pattern.description}
        </div>
        {!compact ? (
          <div className="mt-2 border-t border-aura-hairline pt-3 lg:max-w-[34ch]">
            <span
              className={`block font-mono text-micro font-semibold uppercase tracking-[0.28em] ${accent.fpLabel}`}
            >
              // fingerprint
            </span>
            <span className="mt-1.5 block font-mono text-label leading-[1.55] text-aura-muted">
              {pattern.fingerprint}
            </span>
          </div>
        ) : null}
      </div>

      <div className={`flex flex-col gap-5 ${flipped ? "lg:order-1" : ""}`}>
        <blockquote
          data-role="canonical"
          className={`relative max-w-[38rem] border px-7 py-7 ${canonicalRadius} ${accent.bubble} ${accent.bubbleBorder} ${accent.bubbleShadow} ${canonicalRotation} transition-transform duration-300 hover:translate-y-[-2px] hover:rotate-0`}
        >
          <span
            className={`absolute -top-2.5 right-6 inline-flex items-center rounded-pill border bg-aura-paper px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.32em] ${accent.canonTag}`}
          >
            canon
          </span>
          <p className="font-serif text-display-sm font-light italic leading-[1.4] tracking-tight text-aura-ink">
            {canonical}
          </p>
          <p className="mt-3 text-right font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            delivered · sample 01
          </p>
        </blockquote>

        {!compact && references.length > 0 ? (
          <div className="max-w-[38rem]">
            <div className="mb-2 flex items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
              <span aria-hidden className={`h-px w-4 ${accent.threadLead}`} />
              <span>// reference reel · {pad2(references.length)} samples</span>
            </div>
            <ul
              className={`flex flex-col gap-1 border-l border-dotted pl-4 ${accent.threadBorder}`}
            >
              {references.map((example, index) => (
                <li key={index}>
                  <blockquote
                    data-role="reference"
                    className="rounded-tile bg-white/40 px-3 py-1.5 font-serif text-label font-light italic leading-snug text-aura-ink/65 transition hover:bg-white/80 hover:text-aura-ink"
                  >
                    {example}
                  </blockquote>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export interface ChemistryMember {
  id: string;
  label: string;
  cluster: string;
}

export type ChemistryKind =
  | "warm"
  | "clean"
  | "volatile"
  | "surprise"
  | "friction"
  | "hard-stop"
  | "acquisition";

export interface ChemistryPair {
  a: string;
  b: string;
  kind: ChemistryKind;
  note: string;
}

const CHEMISTRY_TONE: Record<ChemistryKind, { fill: string; label: string; dot: string }> = {
  warm: {
    fill: "bg-rose-300/85 hover:bg-rose-400",
    label: "Warm",
    dot: "bg-rose-400",
  },
  clean: {
    fill: "bg-emerald-300/85 hover:bg-emerald-400",
    label: "Clean landing",
    dot: "bg-emerald-400",
  },
  volatile: {
    fill: "bg-fuchsia-400/85 hover:bg-fuchsia-500",
    label: "Volatile warm",
    dot: "bg-fuchsia-500",
  },
  surprise: {
    fill: "bg-violet-300/85 hover:bg-violet-400",
    label: "Surprise warm",
    dot: "bg-violet-400",
  },
  friction: {
    fill: "bg-slate-400/80 hover:bg-slate-500",
    label: "Friction",
    dot: "bg-slate-500",
  },
  "hard-stop": {
    fill: "bg-stone-700/85 hover:bg-stone-800",
    label: "Hard stop",
    dot: "bg-stone-800",
  },
  acquisition: {
    fill: "bg-amber-400/85 hover:bg-amber-500",
    label: "Acquisition register",
    dot: "bg-amber-500",
  },
};

export function DocChemistryMatrix({
  members,
  pairs,
}: {
  members: ChemistryMember[];
  pairs: ChemistryPair[];
}) {
  const [selected, setSelected] = useState<ChemistryPair | null>(null);
  const [focusMember, setFocusMember] = useState<string | null>(null);

  const orderedMembers = useMemo(() => {
    const grouped = new Map<string, ChemistryMember[]>();
    for (const member of members) {
      const list = grouped.get(member.cluster) ?? [];
      list.push(member);
      grouped.set(member.cluster, list);
    }
    return Array.from(grouped.values()).flat();
  }, [members]);

  const memberById = useMemo(() => new Map(orderedMembers.map((m) => [m.id, m])), [orderedMembers]);

  const pairLookup = useMemo(() => {
    const map = new Map<string, ChemistryPair>();
    for (const pair of pairs) {
      const key = pairKey(pair.a, pair.b);
      map.set(key, pair);
    }
    return map;
  }, [pairs]);

  const handleCellClick = (a: string, b: string) => {
    if (a === b) return;
    const pair = pairLookup.get(pairKey(a, b));
    if (pair) {
      setSelected(pair);
      setFocusMember(null);
      return;
    }
    setSelected(null);
  };

  const filteredOrderedMembers = focusMember
    ? orderedMembers.filter(
        (m) =>
          m.id === focusMember ||
          pairs.some(
            (p) => (p.a === focusMember && p.b === m.id) || (p.b === focusMember && p.a === m.id),
          ),
      )
    : orderedMembers;

  return (
    <figure className="my-3 flex flex-col gap-4">
      <figcaption className="flex items-center gap-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
        // roster chemistry matrix
        {focusMember ? (
          <button
            type="button"
            onClick={() => {
              setFocusMember(null);
              setSelected(null);
            }}
            className="ml-2 cursor-pointer rounded-pill border border-aura-hairline px-2 py-0.5 font-mono text-micro uppercase tracking-[0.2em] text-aura-muted hover:text-aura-rose"
          >
            reset
          </button>
        ) : null}
      </figcaption>

      <div className="flex flex-wrap gap-2 text-micro">
        {(Object.keys(CHEMISTRY_TONE) as ChemistryKind[]).map((kind) => (
          <span
            key={kind}
            className="inline-flex items-center gap-1.5 rounded-pill border border-aura-hairline bg-white/70 px-2 py-0.5 font-mono uppercase tracking-[0.18em] text-aura-muted"
          >
            <span aria-hidden className={`size-2 rounded-sm ${CHEMISTRY_TONE[kind].dot}`} />
            <span className="normal-case tracking-normal text-aura-ink">
              {CHEMISTRY_TONE[kind].label}
            </span>
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-card border border-aura-hairline bg-gradient-to-br from-white/82 to-aura-bg/55 p-4">
        <div className="inline-grid gap-[1px]">
          <ChemistryMatrixGrid
            members={filteredOrderedMembers}
            pairLookup={pairLookup}
            focusMember={focusMember}
            onCellClick={handleCellClick}
            onMemberClick={(id) => {
              setFocusMember((prev) => (prev === id ? null : id));
              setSelected(null);
            }}
            selectedPair={selected}
          />
        </div>
      </div>

      <ChemistryDetail pair={selected} memberById={memberById} />
    </figure>
  );
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

function ChemistryMatrixGrid({
  members,
  pairLookup,
  focusMember,
  selectedPair,
  onCellClick,
  onMemberClick,
}: {
  members: ChemistryMember[];
  pairLookup: Map<string, ChemistryPair>;
  focusMember: string | null;
  selectedPair: ChemistryPair | null;
  onCellClick: (a: string, b: string) => void;
  onMemberClick: (id: string) => void;
}) {
  const cellSize = 22;
  const labelSize = 130;
  const gridTemplateColumns = `${labelSize}px repeat(${members.length}, ${cellSize}px)`;

  return (
    <div className="grid" style={{ gridTemplateColumns }}>
      <div />
      {members.map((member) => (
        <button
          key={`col-${member.id}`}
          type="button"
          onClick={() => onMemberClick(member.id)}
          className="cursor-pointer origin-bottom-left -rotate-45 whitespace-nowrap py-1 text-left font-mono text-micro uppercase tracking-[0.04em] text-aura-muted hover:text-aura-rose"
          title={member.label}
          style={{ width: cellSize, transformOrigin: "bottom left" }}
        >
          {member.label}
        </button>
      ))}
      {members.map((row) => (
        <Fragment key={`row-${row.id}`}>
          <button
            type="button"
            onClick={() => onMemberClick(row.id)}
            className={`cursor-pointer truncate pr-2 text-right font-mono text-micro uppercase tracking-[0.04em] transition ${
              focusMember === row.id ? "text-aura-rose" : "text-aura-muted hover:text-aura-rose"
            }`}
            style={{ height: cellSize, lineHeight: `${cellSize}px` }}
            title={row.label}
          >
            {row.label}
          </button>
          {members.map((col) => {
            if (row.id === col.id) {
              return (
                <div
                  key={`${row.id}-${col.id}`}
                  className="rounded-[2px] bg-aura-hairline/40"
                  style={{ width: cellSize, height: cellSize }}
                />
              );
            }
            const pair = pairLookup.get(pairKey(row.id, col.id));
            const isSelected =
              selectedPair !== null &&
              pairKey(selectedPair.a, selectedPair.b) === pairKey(row.id, col.id);
            if (!pair) {
              return (
                <div
                  key={`${row.id}-${col.id}`}
                  className="rounded-[2px] bg-white/35"
                  style={{ width: cellSize, height: cellSize }}
                />
              );
            }
            const tone = CHEMISTRY_TONE[pair.kind];
            return (
              <button
                key={`${row.id}-${col.id}`}
                type="button"
                onClick={() => onCellClick(row.id, col.id)}
                className={`group relative cursor-pointer rounded-[2px] ${tone.fill} transition ${
                  isSelected ? "ring-2 ring-aura-ink ring-offset-1 ring-offset-aura-bg" : ""
                }`}
                style={{ width: cellSize, height: cellSize }}
                title={`${row.label} × ${col.label}: ${tone.label}`}
                aria-label={`${row.label} × ${col.label}: ${tone.label}`}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function ChemistryDetail({
  pair,
  memberById,
}: {
  pair: ChemistryPair | null;
  memberById: Map<string, ChemistryMember>;
}) {
  if (!pair) {
    return (
      <p className="rounded-tile border border-dashed border-aura-hairline bg-white/55 px-4 py-3 font-serif text-label italic leading-snug text-aura-muted">
        Click a cell or a member label to read the pressure note. Row × column maps to the cluster
        sort, so warm cells concentrate along clusters and friction spreads off-diagonal.
      </p>
    );
  }

  const a = memberById.get(pair.a)?.label ?? pair.a;
  const b = memberById.get(pair.b)?.label ?? pair.b;
  const tone = CHEMISTRY_TONE[pair.kind];

  return (
    <article className="rounded-card border border-aura-hairline bg-gradient-to-br from-white/85 to-rose-50/45 px-5 py-4">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <p className="font-display text-lead font-semibold text-aura-ink">
          {a} <span className="text-aura-faint">×</span> {b}
        </p>
        <span
          className={`inline-flex items-center gap-1.5 rounded-pill border border-aura-hairline bg-white/80 px-2 py-0.5 font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-ink`}
        >
          <span aria-hidden className={`size-2 rounded-sm ${tone.dot}`} />
          {tone.label}
        </span>
      </header>
      <p className="text-label leading-[1.65] text-aura-ink/86">{pair.note}</p>
    </article>
  );
}

export function DocClusterCard({
  name,
  members,
  note,
}: {
  name: string;
  members: string[];
  note: ReactNode;
}) {
  return (
    <article className="rounded-card border border-aura-hairline bg-white/72 p-4">
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-display text-label font-semibold leading-tight text-aura-ink">
          {name}
        </h4>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          {pad2(members.length)} members
        </span>
      </header>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {members.map((member) => (
          <span
            key={member}
            className="inline-flex items-center rounded-pill border border-aura-hairline bg-white/80 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.06em] text-aura-muted"
          >
            {member}
          </span>
        ))}
      </div>
      <p className="font-serif text-label italic leading-snug text-aura-muted">{note}</p>
    </article>
  );
}

export function DocStateMachine({
  states,
  transitions,
  title,
}: {
  states: Array<{ id: string; label: string; tone?: "default" | "terminal" | "warn" }>;
  transitions: Array<{ from: string; to: string; label?: string }>;
  title?: string;
}) {
  return (
    <figure className="my-3 rounded-card border border-aura-hairline bg-gradient-to-br from-white/82 to-aura-bg/55 p-5">
      {title ? (
        <figcaption className="mb-3 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // {title}
        </figcaption>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {states.map((state, index) => {
          const tone =
            state.tone === "terminal"
              ? "bg-emerald-100 text-emerald-800 ring-emerald-300/60"
              : state.tone === "warn"
                ? "bg-amber-100 text-amber-800 ring-amber-300/60"
                : "bg-white/82 text-aura-ink ring-aura-hairline";
          return (
            <Fragment key={state.id}>
              <span
                className={`inline-flex items-center rounded-pill px-3 py-1 font-mono text-micro uppercase tracking-[0.18em] ring-1 ring-inset ${tone}`}
              >
                {state.label}
              </span>
              {index < states.length - 1 ? (
                <span aria-hidden className="font-mono text-display-xs text-aura-faint">
                  →
                </span>
              ) : null}
            </Fragment>
          );
        })}
      </div>
      {transitions.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1 border-t border-aura-hairline pt-3 font-mono text-micro text-aura-muted">
          {transitions.map((t, index) => (
            <li key={index} className="flex items-baseline gap-2">
              <span className="text-aura-faint">{t.from}</span>
              <span aria-hidden>→</span>
              <span className="text-aura-faint">{t.to}</span>
              {t.label ? (
                <span className="normal-case tracking-normal text-aura-ink">· {t.label}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}

export function DocColumns({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <div
      className="my-3 grid gap-4"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items}
    </div>
  );
}

export type DocImageSize = "portrait" | "avatar" | "scene" | "thumb";

const DOC_IMAGE_SIZE_CLASS: Record<DocImageSize, string> = {
  portrait: "max-h-[360px]",
  avatar: "max-h-[240px]",
  scene: "max-h-[420px]",
  thumb: "max-h-[180px]",
};

export function DocImageGrid({
  items,
  cols = 4,
  size = "portrait",
}: {
  items: Array<{ src: string; alt: string; caption?: ReactNode }>;
  cols?: number;
  size?: DocImageSize;
}) {
  const heightClass = DOC_IMAGE_SIZE_CLASS[size];
  return (
    <div
      className="my-3 grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <figure
          key={item.src}
          className="flex flex-col gap-2 rounded-card border border-aura-hairline bg-gradient-to-br from-white/72 to-aura-bg/45 p-3"
        >
          <div className="flex items-center justify-center">
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className={`w-auto object-contain ${heightClass}`}
            />
          </div>
          {item.caption ? (
            <figcaption className="font-mono text-micro uppercase tracking-[0.22em] text-aura-rose">
              {item.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

export function DocFigureGrid({
  items,
  cols = 2,
}: {
  items: Array<{ id: string; label: ReactNode; body: ReactNode }>;
  cols?: number;
}) {
  return (
    <div
      className="my-3 grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <article
          key={item.id}
          className="flex flex-col gap-2 rounded-card border border-aura-hairline bg-white/72 p-4"
        >
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.22em] text-aura-rose">
            {item.label}
          </p>
          <div className="text-label leading-snug text-aura-ink/86">{item.body}</div>
        </article>
      ))}
    </div>
  );
}
