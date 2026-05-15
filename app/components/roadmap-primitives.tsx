import { Fragment, useCallback, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";

import {
  listRoadmapPlans,
  plansByStatus,
  STATUS_LABEL,
  STATUS_ORDER,
  type RoadmapPlan,
  type RoadmapPlanMeta,
  type RoadmapPlanStatus,
} from "../services/roadmap-content";
import { pad2 } from "./dashboard-atoms";

const STATUS_TONE: Record<
  RoadmapPlanStatus,
  { dot: string; ring: string; text: string; chip: string; rail: string; glow: string }
> = {
  drafting: {
    dot: "bg-violet-400",
    ring: "ring-violet-300/55",
    text: "text-violet-700",
    chip: "bg-violet-50/85 border-violet-300/55",
    rail: "from-violet-400 to-violet-300",
    glow: "shadow-[0_18px_42px_-26px_rgba(167,139,250,0.55)]",
  },
  ready: {
    dot: "bg-sky-400",
    ring: "ring-sky-300/55",
    text: "text-sky-700",
    chip: "bg-sky-50/85 border-sky-300/55",
    rail: "from-sky-400 to-cyan-300",
    glow: "shadow-[0_18px_42px_-26px_rgba(14,165,233,0.5)]",
  },
  "in-flight": {
    dot: "bg-aura-rose",
    ring: "ring-rose-300/55",
    text: "text-rose-700",
    chip: "bg-rose-50/85 border-rose-300/55",
    rail: "from-aura-rose to-aura-fuchsia",
    glow: "shadow-[0_22px_50px_-24px_rgba(244,63,94,0.55)]",
  },
  review: {
    dot: "bg-fuchsia-500",
    ring: "ring-fuchsia-300/55",
    text: "text-fuchsia-700",
    chip: "bg-fuchsia-50/85 border-fuchsia-300/55",
    rail: "from-fuchsia-500 to-pink-300",
    glow: "shadow-[0_22px_50px_-24px_rgba(217,70,239,0.5)]",
  },
  blocked: {
    dot: "bg-amber-500",
    ring: "ring-amber-300/55",
    text: "text-amber-800",
    chip: "bg-amber-50/85 border-amber-300/55",
    rail: "from-amber-400 to-amber-300",
    glow: "shadow-[0_18px_42px_-26px_rgba(245,158,11,0.5)]",
  },
  shipped: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-300/55",
    text: "text-emerald-700",
    chip: "bg-emerald-50/85 border-emerald-300/55",
    rail: "from-emerald-400 to-emerald-300",
    glow: "shadow-[0_18px_42px_-26px_rgba(16,185,129,0.5)]",
  },
  shelved: {
    dot: "bg-slate-400",
    ring: "ring-slate-300/55",
    text: "text-slate-700",
    chip: "bg-slate-100/85 border-slate-300/55",
    rail: "from-slate-400 to-slate-300",
    glow: "shadow-[0_14px_38px_-24px_rgba(71,85,105,0.45)]",
  },
};

export function RoadmapStatusPill({
  status,
  size = "md",
}: {
  status: RoadmapPlanStatus;
  size?: "sm" | "md";
}) {
  const tone = STATUS_TONE[status];
  const padding = size === "sm" ? "px-1.5 py-[0.05rem]" : "px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border bg-white/82 font-mono text-micro font-semibold uppercase tracking-[0.22em] ${tone.chip} ${tone.text} ${padding}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${tone.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

const PROGRESS_SCALE_CLASS: Record<number, string> = {
  0: "scale-x-0",
  5: "scale-x-[0.05]",
  10: "scale-x-[0.1]",
  15: "scale-x-[0.15]",
  20: "scale-x-[0.2]",
  25: "scale-x-[0.25]",
  30: "scale-x-[0.3]",
  35: "scale-x-[0.35]",
  40: "scale-x-[0.4]",
  45: "scale-x-[0.45]",
  50: "scale-x-[0.5]",
  55: "scale-x-[0.55]",
  60: "scale-x-[0.6]",
  65: "scale-x-[0.65]",
  70: "scale-x-[0.7]",
  75: "scale-x-[0.75]",
  80: "scale-x-[0.8]",
  85: "scale-x-[0.85]",
  90: "scale-x-[0.9]",
  95: "scale-x-[0.95]",
  100: "scale-x-100",
};

export function RoadmapProgressBar({
  done,
  total,
  status,
  variant = "full",
}: {
  done: number;
  total: number;
  status: RoadmapPlanStatus;
  variant?: "full" | "compact";
}) {
  const safeTotal = Math.max(total, 1);
  const safeDone = Math.min(Math.max(done, 0), safeTotal);
  const target = Math.min(Math.max(safeDone / safeTotal, 0), 1);
  const tone = STATUS_TONE[status];
  const compact = variant === "compact";
  const bucket = Math.round(target * 20) * 5;
  const scaleClass = PROGRESS_SCALE_CLASS[bucket] ?? PROGRESS_SCALE_CLASS[0];

  return (
    <div className={`flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-pill bg-aura-hairline"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={safeDone}
      >
        <div
          className={`h-full origin-left rounded-pill bg-gradient-to-r transition-transform duration-700 ease-out ${tone.rail} ${scaleClass}`}
        />
      </div>
      <div className="flex items-baseline justify-between font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
        <span className="tabular-nums">
          <span className="text-aura-ink">{pad2(done)}</span> / {pad2(total)} tasks
        </span>
        <span className="tabular-nums text-aura-muted">{Math.round(target * 100)}%</span>
      </div>
    </div>
  );
}

export function RoadmapFileRef({
  path,
  line,
  hint,
}: {
  path: string;
  line?: number;
  hint?: "new" | "edit" | "delete" | "move";
}) {
  const hintTone: Record<NonNullable<typeof hint>, { text: string; bg: string; glyph: string }> = {
    new: { text: "text-emerald-700", bg: "bg-emerald-50/85", glyph: "+" },
    edit: { text: "text-rose-700", bg: "bg-rose-50/85", glyph: "~" },
    delete: { text: "text-slate-600", bg: "bg-slate-100/85", glyph: "-" },
    move: { text: "text-violet-700", bg: "bg-violet-50/85", glyph: "→" },
  };
  const tone = hint ? hintTone[hint] : null;

  return (
    <span className="inline-flex max-w-full items-center gap-1 align-baseline">
      {tone ? (
        <span
          className={`inline-flex h-[1.2em] items-center rounded-[0.3rem] px-1 font-mono text-micro font-semibold ${tone.bg} ${tone.text}`}
        >
          {tone.glyph}
        </span>
      ) : null}
      <code className="inline-flex max-w-full items-center gap-0.5 truncate rounded-[0.4rem] border border-aura-hairline bg-gradient-to-b from-white/95 to-rose-100/40 px-1.5 py-[0.08em] font-mono text-micro text-aura-ink">
        <span aria-hidden className="text-aura-faint">
          ~/
        </span>
        <span className="truncate">{path}</span>
        {typeof line === "number" ? <span className="text-aura-rose">:{line}</span> : null}
      </code>
    </span>
  );
}

export interface RoadmapDiffLine {
  kind: "add" | "remove" | "context";
  text: string;
}

const DIFF_LINE_TONE: Record<
  RoadmapDiffLine["kind"],
  { gutter: string; row: string; gutterTone: string }
> = {
  add: {
    gutter: "+",
    row: "bg-emerald-50/65 text-emerald-900",
    gutterTone: "text-emerald-700",
  },
  remove: {
    gutter: "-",
    row: "bg-rose-50/65 text-rose-900",
    gutterTone: "text-rose-700",
  },
  context: {
    gutter: " ",
    row: "text-aura-ink/86",
    gutterTone: "text-aura-faint",
  },
};

export function RoadmapDiff({ lines, caption }: { lines: RoadmapDiffLine[]; caption?: string }) {
  return (
    <div className="my-3 overflow-hidden rounded-tile border border-aura-hairline bg-gradient-to-b from-white/92 to-aura-bg/55 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.22)]">
      {caption ? (
        <div className="flex items-center justify-between border-b border-aura-hairline px-4 py-1.5 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          <span>// diff · {caption}</span>
          <span>
            <span className="text-emerald-700">
              +{lines.filter((l) => l.kind === "add").length}
            </span>{" "}
            <span className="text-rose-700">
              -{lines.filter((l) => l.kind === "remove").length}
            </span>
          </span>
        </div>
      ) : null}
      <pre className="overflow-x-auto font-mono text-label leading-[1.62] text-aura-ink">
        <code className="block">
          {lines.map((line, index) => {
            const tone = DIFF_LINE_TONE[line.kind];
            return (
              <span key={index} className={`flex ${tone.row}`}>
                <span
                  className={`inline-block w-7 shrink-0 border-r border-aura-hairline px-2 text-right select-none ${tone.gutterTone}`}
                >
                  {tone.gutter}
                </span>
                <span className="whitespace-pre px-3 py-[0.05rem]">{line.text}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

export interface RoadmapTaskItem {
  id: string;
  label: ReactNode;
  detail?: ReactNode;
  defaultDone?: boolean;
  children?: RoadmapTaskItem[];
}

export function RoadmapChecklist({
  planSlug,
  tasks,
  status = "in-flight",
  title,
}: {
  planSlug: string;
  tasks: RoadmapTaskItem[];
  status?: RoadmapPlanStatus;
  title?: string;
}) {
  return (
    <section className="my-3 flex flex-col gap-3" data-plan-slug={planSlug}>
      {title ? (
        <div className="flex items-center gap-3">
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
            // {title}
          </span>
          <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
        </div>
      ) : null}
      <ol className="flex flex-col gap-0">
        {tasks.map((task, index) => (
          <RoadmapTaskNode
            key={task.id}
            task={task}
            status={status}
            indexLabel={pad2(index + 1)}
            isLast={index === tasks.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}

function RoadmapTaskNode({
  task,
  status,
  indexLabel,
  isLast,
}: {
  task: RoadmapTaskItem;
  status: RoadmapPlanStatus;
  indexLabel: string;
  isLast: boolean;
}) {
  const [done, setDone] = useState<boolean>(task.defaultDone ?? false);

  const toggle = useCallback(() => {
    setDone((prev) => !prev);
  }, []);

  return (
    <li className="relative grid grid-cols-[auto_1fr] gap-x-3">
      {!isLast || (task.children && task.children.length > 0) ? (
        <span
          aria-hidden
          className="absolute left-[0.78rem] top-7 bottom-0 w-px bg-aura-hairline"
        />
      ) : null}

      <button
        type="button"
        onClick={toggle}
        aria-pressed={done}
        aria-label={done ? "Mark task incomplete" : "Mark task complete"}
        className={`relative z-[1] mt-1 flex size-[1.55rem] shrink-0 cursor-pointer items-center justify-center rounded-full border transition ${
          done
            ? `border-transparent bg-gradient-to-br ${STATUS_TONE[status].rail} text-white shadow-[0_6px_18px_-8px_rgba(244,63,94,0.65)]`
            : "border-aura-hairline-strong bg-aura-paper text-transparent hover:border-aura-rose hover:bg-white"
        }`}
      >
        {done ? <CheckGlyph /> : null}
      </button>

      <div className="flex flex-col gap-1 pb-5 pt-1.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-micro tabular-nums text-aura-faint">{indexLabel}</span>
          <div
            className={`flex-1 text-body leading-[1.55] ${
              done ? "text-aura-muted line-through decoration-aura-faint/55" : "text-aura-ink"
            }`}
          >
            {task.label}
          </div>
        </div>

        {task.detail ? (
          <div
            className={`mt-1 flex flex-col gap-2 text-label leading-[1.65] ${
              done ? "opacity-55" : ""
            }`}
          >
            {task.detail}
          </div>
        ) : null}

        {task.children && task.children.length > 0 ? (
          <ol className="mt-2 ml-2 flex flex-col gap-0 border-l border-dashed border-aura-hairline pl-4">
            {task.children.map((child, idx) => (
              <RoadmapTaskNode
                key={child.id}
                task={child}
                status={status}
                indexLabel={`${indexLabel}.${pad2(idx + 1)}`}
                isLast={idx === (task.children?.length ?? 0) - 1}
              />
            ))}
          </ol>
        ) : null}
      </div>
    </li>
  );
}

function CheckGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function RoadmapPlanHeader({ slug, plan }: { slug: string; plan: RoadmapPlanMeta }) {
  const done = plan.done;
  const tone = STATUS_TONE[plan.status];

  return (
    <section
      data-plan-slug={slug}
      className={`relative my-4 overflow-hidden rounded-card border border-aura-hairline bg-gradient-to-br from-white/86 to-aura-bg/55 p-6 backdrop-blur-[20px] ${tone.glow}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${tone.rail}`} />

      <div className="flex flex-col gap-5 pl-3">
        <div className="flex flex-wrap items-center gap-2">
          <RoadmapStatusPill status={plan.status} />
          {plan.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-pill border border-aura-hairline bg-white/72 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.2em] text-aura-muted"
            >
              {tag}
            </span>
          ))}
          <span aria-hidden className="h-px flex-1 min-w-[2rem] bg-aura-hairline" />
          <span className="font-mono text-micro tabular-nums uppercase tracking-[0.22em] text-aura-faint">
            opened {plan.opened} · touched {plan.touched}
            {plan.shippedAt ? ` · shipped ${plan.shippedAt}` : null}
          </span>
        </div>

        <p className="font-serif text-display-xs leading-snug italic text-aura-ink/82">
          {plan.tldr}
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
          <RoadmapProgressBar done={done} total={plan.tasks} status={plan.status} />
          <dl className="flex flex-col gap-1 font-mono text-micro uppercase tracking-[0.18em] text-aura-faint">
            {plan.owner ? (
              <div className="flex justify-between gap-2">
                <dt>owner</dt>
                <dd className="text-aura-ink normal-case tracking-normal">{plan.owner}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2">
              <dt>status</dt>
              <dd className={`${tone.text} normal-case tracking-normal`}>
                {STATUS_LABEL[plan.status]}
              </dd>
            </div>
          </dl>
        </div>

        {plan.status === "blocked" && plan.blockedReason ? (
          <div className="rounded-tile border border-amber-200/65 bg-amber-50/50 px-4 py-3 text-label leading-snug text-amber-900">
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-amber-700">
              // blocker
            </span>
            <p className="mt-1">{plan.blockedReason}</p>
          </div>
        ) : null}

        {plan.status === "shelved" && plan.shelvedReason ? (
          <div className="rounded-tile border border-slate-300/55 bg-slate-100/55 px-4 py-3 text-label leading-snug text-slate-700">
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-slate-600">
              // shelved
            </span>
            <p className="mt-1">{plan.shelvedReason}</p>
          </div>
        ) : null}

        {plan.dependencies && plan.dependencies.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
              // depends on
            </span>
            {plan.dependencies.map((dep) => (
              <Link
                key={dep}
                to={`/docs/${dep}`}
                className="inline-flex cursor-pointer items-center gap-1 rounded-pill border border-aura-hairline bg-white/72 px-2 py-0.5 font-mono text-micro uppercase tracking-[0.18em] text-aura-muted transition hover:border-aura-rose hover:text-aura-rose"
              >
                <span aria-hidden>↗</span>
                {dep.replace(/^roadmap\//, "")}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function RoadmapAcceptance({ items }: { items: ReactNode[] }) {
  return (
    <ul className="my-2 flex flex-col gap-1.5">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3 rounded-tile border border-aura-hairline bg-gradient-to-r from-emerald-50/45 to-white/40 px-3 py-2 text-label leading-snug text-aura-ink/86"
        >
          <span
            aria-hidden
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[0.25rem] bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-[0_2px_4px_-2px_rgba(16,185,129,0.6)]"
          >
            <CheckGlyph />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export interface RoadmapDecision {
  date: string;
  title: string;
  body: ReactNode;
  outcome?: "accepted" | "rejected" | "deferred";
}

export function RoadmapDecisionsLog({ entries }: { entries: RoadmapDecision[] }) {
  const outcomeTone: Record<NonNullable<RoadmapDecision["outcome"]>, string> = {
    accepted: "text-emerald-700 border-emerald-300/55 bg-emerald-50/55",
    rejected: "text-rose-700 border-rose-300/55 bg-rose-50/55",
    deferred: "text-amber-800 border-amber-300/55 bg-amber-50/55",
  };

  return (
    <ol className="my-3 flex flex-col gap-0">
      {entries.map((entry, index) => (
        <li
          key={index}
          className="relative grid grid-cols-[auto_1fr] gap-x-4 border-l-2 border-aura-hairline pb-5 last:pb-0"
        >
          <span
            aria-hidden
            className="absolute -left-[5px] top-1 size-2 rounded-full bg-aura-rose ring-4 ring-aura-paper"
          />
          <div className="pl-4 font-mono text-micro uppercase tracking-[0.22em] tabular-nums text-aura-faint">
            {entry.date}
          </div>
          <div className="col-span-2 flex flex-col gap-1 pl-4 pt-1.5">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-display text-label font-semibold text-aura-ink">{entry.title}</p>
              {entry.outcome ? (
                <span
                  className={`inline-flex items-center rounded-pill border px-2 py-[0.05rem] font-mono text-micro font-semibold uppercase tracking-[0.22em] ${outcomeTone[entry.outcome]}`}
                >
                  {entry.outcome}
                </span>
              ) : null}
            </div>
            <div className="text-label leading-snug text-aura-ink/82">{entry.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function RoadmapStatusStrip() {
  const plans = listRoadmapPlans();
  const counts = useMemo(() => {
    const map: Record<RoadmapPlanStatus, number> = {
      drafting: 0,
      ready: 0,
      "in-flight": 0,
      review: 0,
      blocked: 0,
      shipped: 0,
      shelved: 0,
    };
    for (const plan of plans) map[plan.plan.status] += 1;
    return map;
  }, [plans]);

  return (
    <div className="my-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      {STATUS_ORDER.map((status) => {
        const tone = STATUS_TONE[status];
        const count = counts[status];
        return (
          <div
            key={status}
            className={`relative overflow-hidden rounded-card border border-aura-hairline bg-gradient-to-br from-white/85 to-aura-bg/55 p-4`}
          >
            <span
              aria-hidden
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.rail}`}
            />
            <p className="font-mono text-display-xl font-bold leading-none tabular-nums text-aura-ink">
              {pad2(count)}
            </p>
            <p
              className={`mt-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] ${tone.text}`}
            >
              {STATUS_LABEL[status]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function RoadmapBoard() {
  const grouped = useMemo(() => plansByStatus(), []);
  return (
    <div className="my-3 flex flex-col gap-10">
      {STATUS_ORDER.map((status) => {
        const list = grouped[status];
        if (list.length === 0) {
          return <EmptyStatusSection key={status} status={status} />;
        }
        return <RoadmapStatusSection key={status} status={status} plans={list} />;
      })}
    </div>
  );
}

function EmptyStatusSection({ status }: { status: RoadmapPlanStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline gap-3">
        <span
          className={`font-mono text-micro font-semibold uppercase tracking-[0.28em] ${tone.text}`}
        >
          // {STATUS_LABEL[status]}
        </span>
        <span className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          empty lane
        </span>
        <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
      </header>
      <p className="rounded-tile border border-dashed border-aura-hairline bg-white/45 px-4 py-3 font-serif text-label italic leading-snug text-aura-muted">
        Nothing in {STATUS_LABEL[status]} right now.
      </p>
    </section>
  );
}

function RoadmapStatusSection({
  status,
  plans,
}: {
  status: RoadmapPlanStatus;
  plans: RoadmapPlan[];
}) {
  const tone = STATUS_TONE[status];
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline gap-3">
        <span
          className={`font-mono text-micro font-semibold uppercase tracking-[0.28em] ${tone.text}`}
        >
          // {STATUS_LABEL[status]}
        </span>
        <span className="font-mono text-micro tabular-nums uppercase tracking-[0.22em] text-aura-faint">
          {pad2(plans.length)} {plans.length === 1 ? "plan" : "plans"}
        </span>
        <span aria-hidden className="h-px flex-1 bg-aura-hairline" />
      </header>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {plans.map((plan, index) => (
          <RoadmapBoardCard key={plan.slug} plan={plan} indexLabel={pad2(index + 1)} />
        ))}
      </div>
    </section>
  );
}

function RoadmapBoardCard({ plan, indexLabel }: { plan: RoadmapPlan; indexLabel: string }) {
  const tone = STATUS_TONE[plan.plan.status];
  const done = plan.plan.done;
  const isShelved = plan.plan.status === "shelved";

  return (
    <Link
      to={`/docs/${plan.slug}`}
      className={`group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-card border border-aura-hairline bg-gradient-to-br from-white/85 to-aura-bg/55 p-5 transition hover:-translate-y-[2px] hover:border-aura-rose/55 ${tone.glow}`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${tone.rail} opacity-80`}
      />

      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-micro tabular-nums uppercase tracking-[0.24em] text-aura-faint">
          // plan.{indexLabel}
        </span>
        <RoadmapStatusPill status={plan.plan.status} size="sm" />
      </div>

      <h4
        className={`font-display text-lead font-semibold leading-tight tracking-tight text-aura-ink ${
          isShelved ? "decoration-aura-faint/55 line-through" : ""
        }`}
      >
        {plan.title}
      </h4>

      <p className="font-serif text-label italic leading-snug text-aura-muted">{plan.plan.tldr}</p>

      {plan.plan.status !== "shelved" ? (
        <RoadmapProgressBar
          done={done}
          total={plan.plan.tasks}
          status={plan.plan.status}
          variant="compact"
        />
      ) : (
        <p className="font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
          // closed · {plan.plan.tasks} planned tasks
        </p>
      )}

      <div className="mt-1 flex items-center justify-between font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
        <span className="tabular-nums">
          {plan.plan.owner ? <span className="text-aura-muted">{plan.plan.owner}</span> : null}
          {plan.plan.owner ? (
            <span aria-hidden className="mx-1">
              ·
            </span>
          ) : null}
          touched {plan.plan.touched}
        </span>
        <span aria-hidden className="text-aura-rose transition group-hover:translate-x-0.5">
          →
        </span>
      </div>
    </Link>
  );
}

const STATUS_DEFINITION: Record<RoadmapPlanStatus, string> = {
  drafting: "Scoped, not started. Open questions still live in the body.",
  ready: "Scoped, accepted, and waiting for implementation to begin.",
  "in-flight": "Active work. An agent or human is making progress this week.",
  review: "Implementation landed. Audit, verification, or defect repair is active.",
  blocked: "Cannot move without an external unblock. Reason listed on the plan.",
  shipped: "Acceptance criteria met. Use briefly during closeout, then delete the plan.",
  shelved: "Closed without shipping. Move durable context elsewhere, then delete the plan.",
};

export function RoadmapStatusLegend() {
  return (
    <dl className="my-3 grid grid-cols-1 gap-2 md:grid-cols-2">
      {STATUS_ORDER.map((status) => (
        <Fragment key={status}>
          <div className="flex items-start gap-3 rounded-tile border border-aura-hairline bg-white/55 px-4 py-3">
            <span className="mt-0.5">
              <RoadmapStatusPill status={status} size="sm" />
            </span>
            <dd className="text-label leading-snug text-aura-ink/82">
              {STATUS_DEFINITION[status]}
            </dd>
          </div>
        </Fragment>
      ))}
    </dl>
  );
}
