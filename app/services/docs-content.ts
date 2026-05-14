import type { ComponentType } from "react";

import type { DocGroupId, DocMeta, DocSectionEntry } from "../components/doc-primitives";

export type { DocGroupId } from "../components/doc-primitives";

export interface DocTocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface DocEntry {
  slug: string;
  group: DocGroupId;
  title: string;
  description: string;
  toc: DocTocEntry[];
  Component: ComponentType;
}

export interface DocGroup {
  id: DocGroupId;
  label: string;
  blurb: string;
  docs: DocEntry[];
}

interface DocModule {
  meta: DocMeta;
  sections: DocSectionEntry[];
  default: ComponentType;
}

const RAW_DOCS = import.meta.glob<DocModule>("../docs/**/*.tsx", { eager: true });

const GROUP_META: Record<DocGroupId, { label: string; blurb: string; order: number }> = {
  product: {
    label: "Product",
    blurb:
      "Durable contracts for shipped voice, visual language, image style, and character canon.",
    order: 0,
  },
  gameplay: {
    label: "Gameplay",
    blurb:
      "Member fields, player knowledge, match fit, pair memory, case management, and roster chemistry.",
    order: 1,
  },
  workflows: {
    label: "Workflows",
    blurb: "Repeatable checklists for content, asset, and release work.",
    order: 2,
  },
  support: {
    label: "Support",
    blurb: "Player and operator install, update, and troubleshooting guides.",
    order: 3,
  },
};

const GROUP_ORDER: DocGroupId[] = (Object.keys(GROUP_META) as DocGroupId[]).sort(
  (a, b) => GROUP_META[a].order - GROUP_META[b].order,
);

function buildEntry(module: DocModule): DocEntry {
  const toc: DocTocEntry[] = [];
  for (const section of module.sections) {
    toc.push({ id: section.id, text: section.title, level: 2 });
    if (section.subsections) {
      for (const sub of section.subsections) {
        toc.push({ id: sub.id, text: sub.title, level: 3 });
      }
    }
  }

  return {
    slug: module.meta.slug,
    group: module.meta.group,
    title: module.meta.title,
    description: module.meta.description,
    toc,
    Component: module.default,
  };
}

function compareDocs(a: DocEntry, b: DocEntry, orderById: Map<string, number>): number {
  const ao = orderById.get(a.slug) ?? Number.POSITIVE_INFINITY;
  const bo = orderById.get(b.slug) ?? Number.POSITIVE_INFINITY;
  if (ao !== bo) {
    return ao - bo;
  }
  return a.title.localeCompare(b.title);
}

const ORDER_BY_SLUG = new Map<string, number>();
for (const module of Object.values(RAW_DOCS)) {
  if (typeof module.meta.order === "number") {
    ORDER_BY_SLUG.set(module.meta.slug, module.meta.order);
  }
}

const ALL_DOCS: DocEntry[] = Object.values(RAW_DOCS)
  .map(buildEntry)
  .sort((a, b) => compareDocs(a, b, ORDER_BY_SLUG));

const GROUPS: DocGroup[] = GROUP_ORDER.map((id) => ({
  id,
  label: GROUP_META[id].label,
  blurb: GROUP_META[id].blurb,
  docs: ALL_DOCS.filter((entry) => entry.group === id),
}));

const FLAT_ORDER: DocEntry[] = GROUPS.flatMap((group) => group.docs);

export function listDocGroups(): DocGroup[] {
  return GROUPS;
}

export function getDocBySlug(slug: string): DocEntry | null {
  const normalized = (slug ?? "").replace(/^\/+|\/+$/g, "");
  return ALL_DOCS.find((entry) => entry.slug === normalized) ?? null;
}

export function getAdjacentDocs(slug: string): { prev: DocEntry | null; next: DocEntry | null } {
  const normalized = (slug ?? "").replace(/^\/+|\/+$/g, "");
  const index = FLAT_ORDER.findIndex((entry) => entry.slug === normalized);

  if (index < 0) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? FLAT_ORDER[index - 1] : null,
    next: index < FLAT_ORDER.length - 1 ? FLAT_ORDER[index + 1] : null,
  };
}

export function searchDocs(query: string): DocEntry[] {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    return [];
  }

  return ALL_DOCS.filter((entry) => {
    if (entry.title.toLowerCase().includes(trimmed)) {
      return true;
    }

    if (entry.description.toLowerCase().includes(trimmed)) {
      return true;
    }

    return entry.toc.some((toc) => toc.text.toLowerCase().includes(trimmed));
  });
}
