import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";
import {
  RoadmapAcceptance,
  RoadmapDecisionsLog,
  RoadmapDiff,
  RoadmapFileRef,
} from "../../components/roadmap-primitives";

export const meta: DocMeta = {
  slug: "roadmap/authoring-plans",
  group: "roadmap",
  title: "Authoring plans",
  description:
    "How to write temporary implementation plans that future agents can execute without leaving stale roadmap context behind.",
  order: 1,
};

export const lede = (
  <>
    Roadmap plans are temporary work orders for scoped implementation. They should help an agent
    start quickly, make correct changes, verify them, and then remove the plan once the work is
    closed.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "when-to-create-a-plan",
    title: "When to create a plan",
    body: (
      <>
        <P>
          Create a roadmap plan only when work needs continuity across turns, agents, or calendar
          time. A plan is the right tool when the next agent must inherit product context, file
          targets, sequencing, blockers, and acceptance criteria from source control.
        </P>
        <DocCallout variant="danger" title="No stale backlog">
          <P>
            Do not use roadmap plans as a wishlist, idea parking lot, changelog, or postmortem. If
            no one is preparing, readying, doing, reviewing, blocked on, or closing the work, do not
            leave a plan on the board.
          </P>
        </DocCallout>
        <DocList
          items={[
            <span key="create">
              Use a plan for multi-step implementation, risky refactors, fixture migrations, saved
              state work, or cross-doc coordination.
            </span>,
            <span key="skip">
              Skip a plan for one-turn fixes, direct doc edits, exploratory questions, or tasks the
              current agent can finish and verify immediately.
            </span>,
            <span key="durable">
              Put durable product truth in the canonical docs listed on{" "}
              <DocLink to="/docs">the docs index</DocLink>, not in a roadmap plan.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "source-of-truth",
    title: "Source of truth",
    body: (
      <>
        <P>
          The checked-in TSX plan file is authoritative. Browser checkbox clicks are local scratch
          marks while reading. When a task is actually complete, edit the plan file: set the task's{" "}
          <DocCode>defaultDone</DocCode>, update <DocCode>plan.done</DocCode>, bump{" "}
          <DocCode>plan.touched</DocCode>, and change <DocCode>plan.status</DocCode> when the lane
          changes.
        </P>
        <DocCallout variant="danger" title="No draft implementation">
          <P>
            Do not start implementation from a <Strong>drafting</Strong> plan. Promote a scoped plan
            to <Strong>ready</Strong>, then move it to <Strong>in flight</Strong> when code work
            starts. Move it to <Strong>review</Strong> when implementation is ready for audit,
            verification, or defect repair.
          </P>
        </DocCallout>
        <DocCallout variant="info" title="Count progress by source">
          <P>
            <DocCode>plan.tasks</DocCode> and <DocCode>plan.done</DocCode> count every checkbox in
            the executable checklist, including nested subtasks. Keep those numbers in sync with the
            rendered checklist before handing the plan to another agent.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "plan-shape",
    title: "Plan shape",
    body: (
      <>
        <P>
          A good plan reads like an implementation handoff, not a status memo. It gives enough
          context to avoid re-discovery, then turns the work into small verified steps.
        </P>
        <DocDefList
          items={[
            {
              term: "Header",
              def: (
                <>
                  <DocCode>RoadmapPlanHeader</DocCode> with status, owner, dates, summary, tags,
                  blockers, dependencies, and source-tracked progress.
                </>
              ),
            },
            {
              term: "Context",
              def: "Why the work exists, what current code proves, and which product docs constrain the change.",
            },
            {
              term: "Scope",
              def: "What is in scope, what is explicitly out of scope, and which assumptions should be challenged.",
            },
            {
              term: "Acceptance",
              def: "Observable done criteria. Each item should be checkable by command output, UI behavior, tests, or direct code review.",
            },
            {
              term: "Checklist",
              def: "Ordered execution tasks with file references, expected edits, dependencies, and verification notes.",
            },
            {
              term: "Decisions",
              def: "Dated judgment calls made while the plan is active. Move durable decisions to canonical docs before deleting the plan.",
            },
            {
              term: "Verification",
              def: "The exact Vite Plus commands, Playwright path, fixture checks, or manual docs review needed for closeout.",
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "metadata",
    title: "Metadata",
    body: (
      <>
        <P>
          Every active plan exports standard doc metadata plus a <DocCode>plan</DocCode> block. The
          roadmap board lists only files that export <DocCode>plan</DocCode>, so reference docs like
          this page stay off the board.
        </P>
        <DocCodeBlock language="tsx">{`export const meta: DocMeta = {
  slug: "roadmap/<short-kebab-name>",
  group: "roadmap",
  title: "<human title>",
  description: "<one sentence, scoped to the work>",
  order: 10,
};

export const plan: RoadmapPlanMeta = {
  status: "drafting",
  opened: "YYYY-MM-DD",
  touched: "YYYY-MM-DD",
  owner: "unassigned",
  tldr: "<one sentence stating the change and outcome>",
  tasks: 0,
  done: 0,
  tags: ["area", "risk"],
};`}</DocCodeBlock>
        <DocList
          items={[
            <span key="slug">
              Put real plans under <DocCode>app/docs/roadmap/</DocCode> with a short kebab-case
              filename that matches the slug tail.
            </span>,
            <span key="dependencies">
              Use <DocCode>dependencies</DocCode> only for other active roadmap plan slugs. Link
              canonical docs in the body instead.
            </span>,
            <span key="dates">
              Use concrete dates. Update <DocCode>touched</DocCode> whenever the plan body, status,
              or progress changes.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "checklist-writing",
    title: "Checklist writing",
    body: (
      <>
        <P>
          Each task should make one change or answer one blocking question. Write tasks as commands
          with a clear finish line.
        </P>
        <DocList
          items={[
            <span key="file">
              Point at concrete files with <RoadmapFileRef path="app/services/date-engine.ts" /> or
              a narrow directory when the exact file is part of the task.
            </span>,
            <span key="docs">
              Start tasks that touch behavior by reading the canonical docs and current code, then
              name the docs in the task detail.
            </span>,
            <span key="diff">
              Use diff hunks only for small surgical changes. For broad edits, explain the target
              contract and let the agent inspect the file.
            </span>,
            <span key="tests">
              Attach the expected verification to the task or to a final verification section. A
              plan without verification is not actionable.
            </span>,
            <span key="scope">
              Avoid tasks named "polish", "investigate", or "clean up" unless the exit condition is
              specific enough to review.
            </span>,
          ]}
        />
        <RoadmapDiff
          caption="tiny targeted example"
          lines={[
            { kind: "context", text: "export const plan: RoadmapPlanMeta = {" },
            { kind: "remove", text: '  status: "drafting",' },
            { kind: "add", text: '  status: "ready",' },
            { kind: "add", text: '  touched: "2026-05-14",' },
            { kind: "context", text: "};" },
          ]}
        />
      </>
    ),
  },
  {
    id: "acceptance-and-decisions",
    title: "Acceptance and decisions",
    body: (
      <>
        <P>
          Acceptance criteria are the non-negotiable closeout bar. Decisions explain why the plan
          took one route and rejected another while the work was active.
        </P>
        <RoadmapAcceptance
          items={[
            "The requested behavior is implemented in the existing architecture without duplicate services.",
            "The relevant Vite Plus verification commands pass, or the blocker is recorded with exact output.",
            "Durable product rules discovered during the work are moved to canonical docs before the plan is removed.",
          ]}
        />
        <RoadmapDecisionsLog
          entries={[
            {
              date: "YYYY-MM-DD",
              title: "Choose the smallest durable owner",
              outcome: "accepted",
              body: (
                <P>
                  Record the reason a service, fixture, schema, or route owns the change. If the
                  decision should survive the plan, move it to the owning doc during closeout.
                </P>
              ),
            },
            {
              date: "YYYY-MM-DD",
              title: "Reject a parallel implementation path",
              outcome: "rejected",
              body: (
                <P>
                  Name the rejected path and the evidence against it so the next agent does not
                  reopen it without new facts.
                </P>
              ),
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "lifecycle",
    title: "Lifecycle",
    body: (
      <>
        <P>
          Status is a working lane, not a permanent label. The plan should disappear once it stops
          helping current implementation.
        </P>
        <DocList
          items={[
            <span key="drafting">
              <Strong>Drafting</Strong>: scope is being formed. Open questions are allowed. Tasks
              may be rough, but they need enough evidence for a reviewer to judge the plan.
            </span>,
            <span key="ready">
              <Strong>Ready</Strong>: scope, acceptance, and checklist are executable.
              Implementation has not started yet.
            </span>,
            <span key="in-flight">
              <Strong>In flight</Strong>: implementation has started. Tasks should be concrete,
              source-tracked, and kept current as code lands.
            </span>,
            <span key="review">
              <Strong>Review</Strong>: implementation has landed and the plan is under audit,
              verification, or defect repair. Keep remaining gaps in the plan body.
            </span>,
            <span key="blocked">
              <Strong>Blocked</Strong>: work cannot continue without an external decision, missing
              asset, failing environment, or unresolved product call. Put the blocker on the plan
              header.
            </span>,
            <span key="shipped">
              <Strong>Shipped</Strong>: acceptance has passed. Use this briefly during handoff or
              human review, then delete the plan after durable context is moved.
            </span>,
            <span key="shelved">
              <Strong>Shelved</Strong>: the team chose not to ship it. Copy any durable reason to
              the right doc or issue, then delete the plan.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "closeout",
    title: "Closeout",
    body: (
      <>
        <P>
          Closeout is part of the plan. Do not let a completed or rejected plan become a stale
          reference.
        </P>
        <DocList
          items={[
            "Run the commands required by the plan, usually vp check, plus vp test and vp build when behavior, saves, systems, fixtures, integration, or user workflows changed.",
            "Move durable decisions, rules, and workflow changes into the owning product, gameplay, workflow, or support doc.",
            "Delete the plan file and remove dependency links to it once the work is shipped or shelved.",
            "If implementation needs audit or verification, keep the plan in review with exact remaining gaps.",
            "If work cannot continue, keep the plan blocked with exact command output and the next unblock action.",
          ]}
        />
        <DocCodeBlock language="powershell">{`vp check
vp test
vp build`}</DocCodeBlock>
      </>
    ),
  },
];

export default function AuthoringPlansDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
