import { Link } from "react-router";

import { DocsShell } from "../components/docs-layout";
import { StampMark } from "../components/stamp-mark";
import { listDocGroups, type DocGroup } from "../services/docs-content";

const GROUPS = listDocGroups();
const TOTAL_DOCS = GROUPS.reduce((acc, group) => acc + group.docs.length, 0);
const HAS_REDACTED_DOCS = GROUPS.some((group) =>
  group.docs.some((doc) => doc.visibility === "redacted"),
);

export function meta() {
  return [
    { title: "IDC // documentation" },
    {
      name: "description",
      content: HAS_REDACTED_DOCS
        ? "Public IDC field manual: product contracts, gameplay rules, roadmap notes, and player support guides."
        : "Public IDC field manual: product contracts, gameplay rules, content workflows, and player support guides.",
    },
  ];
}

export default function DocsIndexRoute() {
  return (
    <DocsShell activeSlug="">
      <div className="flex flex-col gap-14 pt-2">
        <header className="flex flex-col gap-5">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            // {pad2(TOTAL_DOCS)} files on shelf
          </p>
          <h1 className="font-display text-display-lg font-semibold leading-[0.95] tracking-tight text-aura-ink">
            <span className="block">Field manual.</span>
            <span className="block font-serif text-display-md font-normal italic text-aura-muted">
              <span className="text-aura-rose">/</span> the rules behind the dashboard.
            </span>
          </h1>
          <p className="max-w-prose font-serif text-lead italic leading-snug text-aura-muted">
            {HAS_REDACTED_DOCS
              ? "The public shelf shows how the operation works. Workflow drawers stay sealed because the office put a stamp on the stamp request."
              : "The public shelf shows how the operation works, including the workflows that keep the case files from wandering into the vents."}
          </p>
        </header>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {GROUPS.map((group, index) => (
            <GroupCard key={group.id} group={group} index={index} />
          ))}
        </section>

        <section className="flex flex-col gap-4 border-t border-aura-hairline pt-10">
          <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
            // ownership
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-card border border-aura-hairline bg-white/72 p-5">
              <p className="mb-1 font-display text-label font-semibold text-aura-ink">
                Product docs
              </p>
              <p className="font-serif text-label italic leading-snug text-aura-muted">
                State rules and constraints. Short implementation notes are fine when they define a
                schema or asset contract. Ordered task checklists belong in workflows.
              </p>
            </div>
            <div className="rounded-card border border-aura-hairline bg-white/72 p-5">
              <p className="mb-1 font-display text-label font-semibold text-aura-ink">
                Workflow docs
              </p>
              <p className="font-serif text-label italic leading-snug text-aura-muted">
                {HAS_REDACTED_DOCS
                  ? "Visible on the shelf, sealed in public builds. The checklist exists. The checklist does not get to make eye contact."
                  : "Ordered steps, required files, and validation commands. They link back to the product doc that owns the rule behind each step."}
              </p>
            </div>
            <div className="rounded-card border border-aura-hairline bg-white/72 p-5">
              <p className="mb-1 font-display text-label font-semibold text-aura-ink">
                Support docs
              </p>
              <p className="font-serif text-label italic leading-snug text-aura-muted">
                Speak to the person installing or operating the app. Avoid internal implementation
                detail unless it affects setup, data, or troubleshooting.
              </p>
            </div>
          </div>
          <p className="max-w-prose font-serif text-label italic leading-snug text-aura-muted">
            {HAS_REDACTED_DOCS
              ? "Public docs cover durable product truth, gameplay rules, roadmap context, and support copy. Internal workflows are represented by sealed records only."
              : "When a change alters a schema, fixture contract, game system, visual surface, prompt rule, or shipped asset requirement, update both the product doc that owns the rule and any workflow that depends on it."}
          </p>
        </section>
      </div>
    </DocsShell>
  );
}

function GroupCard({ group, index }: { group: DocGroup; index: number }) {
  const first = group.docs[0];
  const href = first ? `/docs/${first.slug}` : "/docs";
  const isRedacted =
    group.docs.length > 0 && group.docs.every((doc) => doc.visibility === "redacted");

  if (isRedacted || !first) {
    return (
      <div
        role="link"
        aria-disabled="true"
        title="Workflow drawer redacted"
        className="aura-glass relative flex cursor-not-allowed flex-col gap-4 overflow-hidden rounded-card p-6 opacity-90"
      >
        <div className="pointer-events-none absolute right-4 top-5 rotate-[10deg] opacity-85">
          <StampMark size="sm">Redacted</StampMark>
        </div>
        <GroupCardBody group={group} index={index} redacted />
      </div>
    );
  }

  return (
    <Link
      to={href}
      className="aura-glass aura-glass-lift group flex cursor-pointer flex-col gap-4 rounded-card p-6 transition"
    >
      <GroupCardBody group={group} index={index} redacted={false} />
    </Link>
  );
}

function GroupCardBody({
  group,
  index,
  redacted,
}: {
  group: DocGroup;
  index: number;
  redacted: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="font-mono text-micro font-semibold uppercase tracking-[0.32em] text-aura-rose">
          // section.{pad2(index + 1)}
        </p>
        <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-faint">
          {redacted ? `${pad2(group.docs.length)} sealed` : `${pad2(group.docs.length)} files`}
        </span>
      </div>
      <p className="font-display text-display-sm font-semibold leading-tight tracking-tight text-aura-ink">
        {group.label}
      </p>
      <p className="font-serif text-label italic leading-snug text-aura-muted">{group.blurb}</p>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="font-mono text-micro uppercase tracking-[0.24em] text-aura-muted">
          {redacted ? "drawer sealed" : "open drawer"}
        </span>
        {redacted ? (
          <span className="font-mono text-micro font-semibold uppercase tracking-[0.2em] text-aura-rose">
            [REDACTED]
          </span>
        ) : (
          <span
            aria-hidden
            className="text-lead text-aura-rose transition group-hover:translate-x-0.5"
          >
            →
          </span>
        )}
      </div>
    </>
  );
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}
