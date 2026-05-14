import {
  DocCallout,
  DocCode,
  DocLink,
  DocList,
  DocPage,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";
import {
  RoadmapBoard,
  RoadmapStatusLegend,
  RoadmapStatusStrip,
} from "../../components/roadmap-primitives";

export const meta: DocMeta = {
  slug: "roadmap",
  group: "roadmap",
  title: "Roadmap",
  description:
    "Temporary implementation plans for scoped work. Each active card opens a checklist agents can execute and close out.",
  order: 0,
};

export const lede = (
  <>
    The shared work board for humans and agents. Plans live here only while scoped work is being
    drafted, marked ready, implemented, reviewed, blocked, or closed. Each active card is a
    checked-in TSX work order with concrete file references, acceptance criteria, and verification.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "at-a-glance",
    title: "At a glance",
    body: (
      <>
        <P>
          Plans are grouped into seven working lanes. Counts update when a plan changes status. An
          empty board is healthy: it means there is no active implementation handoff to preserve.
        </P>
        <RoadmapStatusStrip />
      </>
    ),
  },
  {
    id: "status-board",
    title: "Status board",
    body: (
      <>
        <P>
          Grouped by status, sorted by most recent touch. Review, in flight, and blocked sit at the
          top because they are where attention is owed. Shipped and shelved are short-lived closeout
          lanes, not archives.
        </P>
        <RoadmapBoard />
      </>
    ),
  },
  {
    id: "what-each-status-means",
    title: "What each status means",
    body: (
      <>
        <P>
          Status is a contract about what an agent should do with a plan. Move a plan between lanes
          when its situation changes, and remove it once it no longer helps current implementation.
        </P>
        <RoadmapStatusLegend />
        <DocCallout variant="info" title="Promotion rules">
          <P>
            A drafting plan promotes to <Strong>ready</Strong> when scope, acceptance, and checklist
            are concrete enough to execute. Do not start implementation from drafting. Ready
            promotes to <Strong>in flight</Strong> when code work starts. In flight promotes to{" "}
            <Strong>review</Strong> when implementation is ready for audit or verification. Review
            promotes to <Strong>shipped</Strong> when every acceptance criterion is met and durable
            context has moved to canonical docs. Switch to <Strong>blocked</Strong> when work cannot
            continue without an external decision or unblock, and write the reason on the plan
            header. <Strong>Shelved</Strong> means the team decided not to ship it for now; copy any
            durable reason to the right doc or issue, then delete the plan.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "anatomy-of-a-plan",
    title: "Anatomy of a plan",
    body: (
      <>
        <P>
          Every active plan exports a <DocCode>plan</DocCode> metadata block alongside the standard
          doc exports. The plan body uses roadmap primitives so agents see the same structure on
          every page.
        </P>
        <DocList
          items={[
            <span key="header">
              <Strong>Plan header</Strong>: status pill, owner, opened and touched dates, the
              one-line TLDR, and source-tracked progress from <DocCode>plan.tasks</DocCode> and{" "}
              <DocCode>plan.done</DocCode>.
            </span>,
            <span key="context">
              <Strong>Context</Strong>: why the plan exists, what problem it solves, and any prior
              decisions an agent should not re-litigate.
            </span>,
            <span key="acceptance">
              <Strong>Acceptance criteria</Strong>: the testable "done" list. If a criterion cannot
              be checked off, the plan is not finished, even if every task is.
            </span>,
            <span key="checklist">
              <Strong>The checklist</Strong>: ordered tasks with optional rich detail (file refs,
              code blocks, diff hunks, callouts, nested sub-tasks). Browser checkbox clicks are
              scratch marks; real progress is recorded by editing the plan file.
            </span>,
            <span key="decisions">
              <Strong>Decisions log</Strong>: dated entries for resolved questions. Future agents
              read this to avoid reopening settled judgment calls.
            </span>,
          ]}
        />
        <P>
          See <DocLink to="/docs/roadmap/authoring-plans">Authoring plans</DocLink> for the required
          plan shape, metadata rules, checklist guidance, and closeout policy.
        </P>
      </>
    ),
  },
  {
    id: "workflow",
    title: "Workflow",
    body: (
      <>
        <P>How a plan flows through the board, from scope to ship:</P>
        <DocList
          items={[
            <span key="open">
              A new plan starts as <Strong>drafting</Strong>. Capture context and open questions
              first. Do not begin implementation from this lane.
            </span>,
            <span key="ready">
              When scope, acceptance, and checklist are executable, mark the plan{" "}
              <Strong>ready</Strong> and update the touched date.
            </span>,
            <span key="promote">
              When implementation starts, flip the plan to <Strong>in flight</Strong>. Keep the
              checklist, done count, and touched date current as tasks land.
            </span>,
            <span key="review">
              When implementation is ready for audit, verification, or defect repair, mark{" "}
              <Strong>review</Strong> and record any remaining gaps in the plan body.
            </span>,
            <span key="block">
              If something stalls, mark <Strong>blocked</Strong> and write the unblock reason on the
              plan header. Do not park silently.
            </span>,
            <span key="ship">
              When all acceptance criteria pass, mark <Strong>shipped</Strong> during closeout, move
              durable context into canonical docs, and delete the plan file.
            </span>,
            <span key="shelve">
              If the plan no longer makes sense, mark <Strong>shelved</Strong> with a one-line
              reason long enough to close the loop. Move durable context elsewhere, then delete the
              plan file.
            </span>,
          ]}
        />
      </>
    ),
  },
];

export default function RoadmapIndexDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
