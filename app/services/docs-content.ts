import type { ComponentType } from "react";

import type { DocGroupId, DocMeta, DocSectionEntry } from "../components/doc-primitives";

export type { DocGroupId } from "../components/doc-primitives";

export interface DocTocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export type DocVisibility = "public" | "redacted";

export interface DocEntry {
  slug: string;
  group: DocGroupId;
  title: string;
  description: string;
  toc: DocTocEntry[];
  Component: ComponentType;
  visibility: DocVisibility;
}

export interface DocGroup {
  id: DocGroupId;
  label: string;
  blurb: string;
  docs: DocEntry[];
}

export interface DocModule {
  meta: DocMeta;
  sections: DocSectionEntry[];
  default: ComponentType;
  plan?: unknown;
}

interface RedactedDocDefinition {
  slug: string;
  group: "workflows";
  title: string;
  description: string;
  order: number;
}

const SHOULD_REDACT_WORKFLOWS = import.meta.env.MODE === "desktop";

const ALL_RAW_DOCS: Record<string, DocModule> = import.meta.glob<DocModule>("../docs/**/*.tsx", {
  eager: true,
});

export function listRawDocModules(): readonly DocModule[] {
  return Object.values(ALL_RAW_DOCS);
}

const RAW_DOCS: Record<string, DocModule> = SHOULD_REDACT_WORKFLOWS
  ? Object.fromEntries(
      Object.entries(ALL_RAW_DOCS).filter(([path]) => !path.includes("/docs/workflows/")),
    )
  : ALL_RAW_DOCS;

const REDACTED_WORKFLOW_DOCS: RedactedDocDefinition[] = [
  {
    slug: "workflows/add-member",
    group: "workflows",
    title: "Add a member",
    description:
      "Internal workflow checklist. The public manual records that it exists, then refuses to photocopy it.",
    order: 0,
  },
  {
    slug: "workflows/add-date-scenario",
    group: "workflows",
    title: "Add a date scenario",
    description:
      "Internal workflow checklist. The public manual records that it exists, then refuses to photocopy it.",
    order: 1,
  },
  {
    slug: "workflows/visual-asset-iteration",
    group: "workflows",
    title: "Visual asset iteration",
    description:
      "Internal workflow checklist. The public manual records that it exists, then refuses to photocopy it.",
    order: 2,
  },
  {
    slug: "workflows/release-checklist",
    group: "workflows",
    title: "Friend-share release checklist",
    description:
      "Internal workflow checklist. The public manual records that it exists, then refuses to photocopy it.",
    order: 3,
  },
];

const GROUP_META: Record<DocGroupId, { label: string; blurb: string; order: number }> = {
  roadmap: {
    label: "Roadmap",
    blurb:
      "Temporary implementation plans, active drafts, blockers, and closeout rules for agent handoffs.",
    order: 0,
  },
  product: {
    label: "Product",
    blurb:
      "Durable contracts for shipped voice, visual language, image style, and character canon.",
    order: 1,
  },
  gameplay: {
    label: "Gameplay",
    blurb:
      "Member fields, player knowledge, match fit, pair memory, case management, and roster chemistry.",
    order: 2,
  },
  workflows: {
    label: "Workflows",
    blurb: "Repeatable checklists for content, asset, and release work.",
    order: 3,
  },
  support: {
    label: "Support",
    blurb: "Player and operator install, update, and troubleshooting guides.",
    order: 4,
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
    visibility: "public",
  };
}

const RedactedDocStub: ComponentType = () => null;

function buildRedactedEntry(definition: RedactedDocDefinition): DocEntry {
  return {
    slug: definition.slug,
    group: definition.group,
    title: definition.title,
    description: definition.description,
    toc: [],
    Component: RedactedDocStub,
    visibility: "redacted",
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
if (SHOULD_REDACT_WORKFLOWS) {
  for (const definition of REDACTED_WORKFLOW_DOCS) {
    ORDER_BY_SLUG.set(definition.slug, definition.order);
  }
}

const DOCS_FOR_MODE = SHOULD_REDACT_WORKFLOWS
  ? Object.values(RAW_DOCS).map(buildEntry).concat(REDACTED_WORKFLOW_DOCS.map(buildRedactedEntry))
  : Object.values(RAW_DOCS).map(buildEntry);

const ALL_DOCS: DocEntry[] = DOCS_FOR_MODE.sort((a, b) => compareDocs(a, b, ORDER_BY_SLUG));

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
