import { Link, useParams } from "react-router";

import { DocsShell, DocsToc } from "../components/docs-layout";
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

  return (
    <DocsShell activeSlug={doc.slug} activeTitle={doc.title} toc={<DocsToc entries={doc.toc} />}>
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

        <Component />

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
