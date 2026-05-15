import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import {
  listDocGroups,
  searchDocs,
  type DocEntry,
  type DocGroup,
  type DocTocEntry,
} from "../services/docs-content";
import { AmbientMesh } from "./ambient-mesh";
import { CupidMark } from "./dashboard-atoms";

interface BreadcrumbSegment {
  label: string;
  to: string | null;
}

type DocsTheme = "light" | "dark";

const DOCS_THEME_STORAGE_KEY = "idc-docs-theme";

export interface DocsShellProps {
  activeSlug: string;
  activeTitle?: string | null;
  toc?: React.ReactNode;
  children: React.ReactNode;
}

export function DocsShell({ activeSlug, activeTitle, toc, children }: DocsShellProps) {
  const segments = useMemo(
    () => buildBreadcrumb(activeSlug, activeTitle ?? null),
    [activeSlug, activeTitle],
  );

  const [theme, setTheme] = useState<DocsTheme>("light");

  // Read the persisted preference after hydration to avoid SSR/client mismatch.
  // One frame of light flash on first /docs paint is the trade we accept.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DOCS_THEME_STORAGE_KEY);
      if (saved === "dark") {
        setTheme("dark");
      }
    } catch {
      // localStorage may be unavailable (private mode, etc.). Stay on light.
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: DocsTheme = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(DOCS_THEME_STORAGE_KEY, next);
      } catch {
        // Silent: the toggle still works for this session.
      }
      return next;
    });
  };

  return (
    <div data-theme={theme} className="relative isolate min-h-screen bg-aura-bg text-aura-ink">
      <AmbientMesh />
      <DocsHeader segments={segments} theme={theme} onToggleTheme={toggleTheme} />
      <div className="mx-auto flex w-full max-w-[110rem] gap-12 px-6 pt-10 pb-24 lg:px-12">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-28">
            <DocsSidebar activeSlug={activeSlug} />
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 gap-12">
          <div className="min-w-0 flex-1">{children}</div>
          {toc ? (
            <aside className="hidden w-56 shrink-0 xl:block">
              <div className="sticky top-28">{toc}</div>
            </aside>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function DocsHeader({
  segments,
  theme,
  onToggleTheme,
}: {
  segments: BreadcrumbSegment[];
  theme: DocsTheme;
  onToggleTheme: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-aura-hairline bg-aura-veil/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[110rem] items-center gap-6 px-6 py-4 lg:px-12">
        <Link to="/docs" className="flex shrink-0 cursor-pointer items-center gap-3">
          <CupidMark variant="tile" className="size-9 rounded-chip" />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
              IDC // field manual
            </span>
            <span className="font-display text-label font-semibold tracking-tight text-aura-ink">
              Internal records office
            </span>
          </span>
        </Link>

        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 flex-1 items-center gap-2 font-mono text-micro uppercase tracking-[0.24em] text-aura-faint md:flex"
        >
          {segments.map((segment, index) => (
            <span key={`${segment.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className="text-aura-faint">
                  /
                </span>
              ) : null}
              {segment.to ? (
                <Link to={segment.to} className="cursor-pointer transition hover:text-aura-rose">
                  {segment.label}
                </Link>
              ) : (
                <span className="truncate text-aura-ink">{segment.label}</span>
              )}
            </span>
          ))}
        </nav>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <Link
          to="/"
          className="aura-glass inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-pill px-4 py-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-muted transition hover:text-aura-rose"
        >
          <span aria-hidden>←</span>
          <span>back to shell</span>
        </Link>
      </div>
    </header>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: DocsTheme; onToggle: () => void }) {
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="aura-glass inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-pill text-aura-muted transition hover:text-aura-rose"
    >
      {isDark ? <SunGlyph /> : <MoonGlyph />}
    </button>
  );
}

function SunGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

function buildBreadcrumb(slug: string, title: string | null): BreadcrumbSegment[] {
  const root: BreadcrumbSegment = { label: "docs", to: "/docs" };

  if (!slug) {
    return [{ ...root, to: null }];
  }

  const parts = slug.split("/");
  const segments: BreadcrumbSegment[] = [root];
  let path = "";

  for (let i = 0; i < parts.length; i += 1) {
    path += `/${parts[i]}`;
    const isLast = i === parts.length - 1;
    const label = isLast && title ? title : parts[i].replace(/-/g, " ");
    segments.push({
      label,
      to: isLast ? null : `/docs${path}`,
    });
  }

  return segments;
}

function DocsSidebar({ activeSlug }: { activeSlug: string }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => listDocGroups(), []);
  const filteredSlugs = useMemo<Set<string> | null>(() => {
    if (!query.trim()) {
      return null;
    }
    return new Set(searchDocs(query).map((doc) => doc.slug));
  }, [query]);

  const allEmpty =
    filteredSlugs !== null &&
    groups.every((group) => group.docs.every((doc) => !filteredSlugs.has(doc.slug)));

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="mb-2 font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-faint">
          // filter
        </p>
        <div className="group aura-glass flex items-center gap-3 rounded-pill px-4 py-2">
          <span
            aria-hidden
            className="font-mono text-micro text-aura-faint transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-focus-within:-rotate-6 group-focus-within:scale-125"
          >
            ⌕
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="type to narrow"
            aria-label="Filter documentation"
            className="w-full bg-transparent text-label text-aura-ink placeholder:text-aura-faint focus:outline-none"
          />
        </div>
      </div>

      <nav aria-label="Documentation sections" className="flex flex-col gap-6">
        {groups.map((group) => (
          <DocsSidebarGroup
            key={group.id}
            group={group}
            activeSlug={activeSlug}
            filter={filteredSlugs}
          />
        ))}
        {allEmpty ? (
          <p className="font-serif text-label italic text-aura-muted">
            Nothing in the cabinet matches that.
          </p>
        ) : null}
      </nav>
    </div>
  );
}

function DocsSidebarGroup({
  group,
  activeSlug,
  filter,
}: {
  group: DocGroup;
  activeSlug: string;
  filter: Set<string> | null;
}) {
  const visible = filter ? group.docs.filter((doc) => filter.has(doc.slug)) : group.docs;

  if (visible.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-micro font-semibold uppercase tracking-[0.28em] text-aura-rose">
          // {group.label}
        </span>
        <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          {visible.length} {visible.length === 1 ? "file" : "files"}
        </span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {visible.map((doc, index) => (
          <DocsSidebarItem
            key={doc.slug}
            doc={doc}
            index={index}
            active={doc.slug === activeSlug}
          />
        ))}
      </ul>
    </div>
  );
}

function DocsSidebarItem({
  doc,
  index,
  active,
}: {
  doc: DocEntry;
  index: number;
  active: boolean;
}) {
  const href = doc.slug ? `/docs/${doc.slug}` : "/docs";
  const isRedacted = doc.visibility === "redacted";

  if (isRedacted) {
    return (
      <li className="relative">
        {active ? (
          <span aria-hidden className="aura-doc-rail absolute -left-3 top-1.5 bottom-1.5 w-[2px]" />
        ) : null}
        <div
          role="link"
          aria-disabled="true"
          title="Workflow file redacted"
          className={`group flex cursor-not-allowed items-baseline gap-0 rounded-tile px-2 py-1.5 transition ${
            active ? "text-aura-ink" : "text-aura-faint"
          }`}
        >
          <span
            className={`min-w-0 truncate text-label leading-snug ${active ? "font-semibold" : ""}`}
          >
            {doc.title}
          </span>
          <span aria-hidden className="aura-doc-leader" />
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-rose">
            [REDACTED]
          </span>
        </div>
      </li>
    );
  }

  return (
    <li className="relative">
      {active ? (
        <span aria-hidden className="aura-doc-rail absolute -left-3 top-1.5 bottom-1.5 w-[2px]" />
      ) : null}
      <Link
        to={href}
        className={`group flex cursor-pointer items-baseline gap-0 rounded-tile px-2 py-1.5 transition ${
          active ? "text-aura-ink" : "text-aura-muted hover:bg-white/40 hover:text-aura-ink"
        }`}
      >
        <span
          className={`min-w-0 truncate text-label leading-snug ${active ? "font-semibold" : ""}`}
        >
          {doc.title}
        </span>
        <span aria-hidden className="aura-doc-leader" />
        <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          {pad2(index + 1)}
        </span>
      </Link>
    </li>
  );
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

export function DocsToc({ entries }: { entries: DocTocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (intersections) => {
        for (const entry of intersections) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0 },
    );

    const elements = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((element): element is HTMLElement => element !== null);

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [entries]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <nav aria-label="On this page" className="flex flex-col gap-4">
      <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-faint">
        // on this page
      </p>
      <ul className="flex flex-col gap-2 border-l border-aura-hairline py-1 pl-4">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${entry.id}`}
              className={`block cursor-pointer text-label leading-snug transition ${
                entry.id === activeId
                  ? "font-semibold text-aura-rose"
                  : "text-aura-muted hover:text-aura-ink"
              }`}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
