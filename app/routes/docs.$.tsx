import { Link, useParams } from "react-router";

import { DocsShell, DocsToc } from "../components/docs-layout";
import { StampMark } from "../components/stamp-mark";
import {
  getAdjacentDocs,
  getDocBySlug,
  listDocGroups,
  type DocEntry,
} from "../services/docs-content";

const GROUPS = listDocGroups();

export function meta({ params }: { params: { "*": string } }) {
  const slug = params["*"] ?? "";
  const doc = getDocBySlug(slug);

  if (!doc) {
    return [{ title: "IDC // documentation" }];
  }

  return [
    { title: `${doc.title} // IDC docs` },
    {
      name: "description",
      content: doc.description,
    },
  ];
}

export default function DocsArticleRoute() {
  const params = useParams();
  const slug = params["*"] ?? "";
  const doc = getDocBySlug(slug);

  if (!doc) {
    return (
      <DocsShell activeSlug={slug}>
        <NotFoundPanel slug={slug} />
      </DocsShell>
    );
  }

  const groupLabel = GROUPS.find((group) => group.id === doc.group)?.label ?? null;
  const Component = doc.Component;
  const isRedacted = doc.visibility === "redacted";

  return (
    <DocsShell
      activeSlug={doc.slug}
      activeTitle={doc.title}
      toc={isRedacted ? null : <DocsToc entries={doc.toc} />}
    >
      <article className="flex flex-col gap-8 pt-2">
        <header className="flex flex-col gap-3">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            // file.{slug.split("/").pop()?.replace(/-/g, ".") ?? slug}
            {groupLabel ? (
              <span className="ml-3 text-aura-faint">drawer / {groupLabel.toLowerCase()}</span>
            ) : null}
          </p>
          <h1 className="font-display text-display-lg font-semibold leading-[0.95] tracking-tight text-aura-ink">
            {doc.title}
          </h1>
        </header>

        {isRedacted ? <RedactedWorkflowPanel doc={doc} /> : <Component />}

        <AdjacentNavigation slug={doc.slug} />
      </article>
    </DocsShell>
  );
}

function AdjacentNavigation({ slug }: { slug: string }) {
  const { prev, next } = getAdjacentDocs(slug);

  if (!prev && !next) {
    return null;
  }

  return (
    <nav
      aria-label="Adjacent documents"
      className="mt-6 grid grid-cols-1 gap-3 border-t border-aura-hairline pt-8 sm:grid-cols-2"
    >
      {prev ? <AdjacentLink direction="prev" doc={prev} /> : <span aria-hidden />}
      {next ? <AdjacentLink direction="next" doc={next} /> : null}
    </nav>
  );
}

function AdjacentLink({ direction, doc }: { direction: "prev" | "next"; doc: DocEntry }) {
  const href = `/docs/${doc.slug}`;
  const isNext = direction === "next";
  const isRedacted = doc.visibility === "redacted";

  if (isRedacted) {
    return (
      <div
        role="link"
        aria-disabled="true"
        title="Workflow file redacted"
        className={`aura-glass relative flex cursor-not-allowed flex-col gap-1 overflow-hidden rounded-card px-5 py-4 opacity-90 ${
          isNext ? "sm:col-start-2 sm:items-end sm:text-right" : ""
        }`}
      >
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          {isNext ? "next file" : "previous file"} [REDACTED]
        </span>
        <span className="font-display text-lead font-semibold text-aura-ink">{doc.title}</span>
        <span className="line-clamp-2 font-serif text-label italic text-aura-muted">
          {doc.description}
        </span>
      </div>
    );
  }

  return (
    <Link
      to={href}
      className={`aura-glass aura-glass-lift group flex cursor-pointer flex-col gap-1 rounded-card px-5 py-4 transition ${
        isNext ? "sm:col-start-2 sm:items-end sm:text-right" : ""
      }`}
    >
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
        {isNext ? "next file →" : "← previous file"}
      </span>
      <span className="font-display text-lead font-semibold text-aura-ink">{doc.title}</span>
      <span className="line-clamp-2 font-serif text-label italic text-aura-muted">
        {doc.description}
      </span>
    </Link>
  );
}

const REDACTED_ROWS: Array<{ label: string; widthClass: string }> = [
  { label: "authorization", widthClass: "w-3/4" },
  { label: "operating notes", widthClass: "w-5/6" },
  { label: "release handling", widthClass: "w-2/3" },
];

function RedactedWorkflowPanel({ doc }: { doc: DocEntry }) {
  return (
    <section className="relative overflow-hidden rounded-card border border-aura-rose/25 bg-gradient-to-br from-white/82 via-rose-50/65 to-violet-50/50 p-8 shadow-card">
      <div aria-hidden className="aura-dot-grid absolute inset-0 opacity-35" />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-5">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            // workflow drawer / public view
          </p>
          <h2 className="font-display text-display-md font-semibold leading-tight tracking-tight text-aura-ink">
            Workflow record withheld.
          </h2>
          <p className="max-w-prose font-serif text-lead italic leading-snug text-aura-muted">
            The field manual is public. This checklist is an internal operating file, so the shipped
            build shows the marker and blocks the route. HR insisted this counts as transparency.
          </p>
          <div className="grid gap-2 pt-2">
            {REDACTED_ROWS.map((row) => (
              <RedactedRecordRow key={row.label} label={row.label} widthClass={row.widthClass} />
            ))}
          </div>
        </div>

        <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-card border border-dashed border-aura-rose/35 bg-white/45 p-8">
          <div
            aria-hidden
            className="absolute inset-4 rounded-card border border-aura-hairline bg-white/35"
          />
          <StampMark size="lg" className="relative z-10 rotate-[-9deg]">
            Redacted
          </StampMark>
          <div className="absolute right-5 bottom-5 left-5 flex items-center justify-between gap-3 border-t border-aura-hairline pt-3 font-mono text-micro uppercase tracking-[0.22em] text-aura-faint">
            <span>{doc.slug.replace("workflows/", "file.")}</span>
            <span>access refused</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function RedactedRecordRow({ label, widthClass }: { label: string; widthClass: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] items-center gap-3 rounded-tile border border-aura-hairline bg-white/55 px-3 py-2">
      <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-faint">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <span className={`h-2 rounded-pill bg-aura-ink/18 ${widthClass}`} />
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.18em] text-aura-rose">
          [REDACTED]
        </span>
      </span>
    </div>
  );
}

function NotFoundPanel({ slug }: { slug: string }) {
  return (
    <div className="aura-glass flex flex-col items-start gap-4 rounded-card p-8">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
        // 404 / file not on shelf
      </p>
      <h1 className="font-display text-display-md font-semibold text-aura-ink">
        Cupid does not have a file for {slug || "that path"}.
      </h1>
      <p className="font-serif text-lead italic leading-snug text-aura-muted">
        Either the page was renamed, or the URL is typo prone. Punch back to the index and browse
        the cabinet.
      </p>
      <Link
        to="/docs"
        className="aura-glass-strong inline-flex cursor-pointer items-center gap-2 rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-ink transition hover:text-aura-rose"
      >
        ← back to docs
      </Link>
    </div>
  );
}
