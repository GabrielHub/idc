import {
  DocCallout,
  DocList,
  DocPage,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";
import {
  RoadmapAcceptance,
  RoadmapChecklist,
  RoadmapDecisionsLog,
  RoadmapFileRef,
  RoadmapPlanHeader,
  type RoadmapTaskItem,
} from "../../components/roadmap-primitives";
import type { RoadmapPlanMeta } from "../../services/roadmap-content";

export const meta: DocMeta = {
  slug: "roadmap/constellation-lobby",
  group: "roadmap",
  title: "Constellation lobby rewrite",
  description:
    "Umbrella roadmap for replacing the pre-date dashboard with a constellation-first lobby across layout, interaction flow, HUD surfaces, tutorial, and closeout.",
  order: 10,
};

export const plan: RoadmapPlanMeta = {
  status: "drafting",
  opened: "2026-05-22",
  touched: "2026-05-23",
  owner: "unassigned",
  tldr: "Coordinate the full constellation lobby rewrite by splitting R&D, foundation, interaction, and cutover work into dependent roadmap plans.",
  tasks: 20,
  done: 0,
  tags: ["ui", "lobby", "umbrella", "rewrite"],
};

const tasks: RoadmapTaskItem[] = [
  {
    id: "rewrite-boundaries",
    label: "Decide the rewrite boundaries before migration child plans promote to ready",
    detail: (
      <P>
        This umbrella intentionally describes a large replacement. The constraint is not "small
        change"; it is "clear ownership." If a later decision requires save, domain, or AI changes,
        create a separate child plan instead of hiding that work in UI tasks.
      </P>
    ),
    children: [
      { id: "rewrite-boundaries-screen", label: "Confirm this replaces the full pre-date screen" },
      {
        id: "rewrite-boundaries-routes",
        label:
          "Confirm whether roster, notes, date book, and pair-board stay as routes or become lobby modes",
      },
      {
        id: "rewrite-boundaries-domain",
        label:
          "Confirm whether gameplay/domain/save changes are out of scope, or split them into a separate roadmap plan",
      },
      {
        id: "rewrite-boundaries-assets",
        label: "Confirm whether generated backdrop or star assets are approved production scope",
      },
      {
        id: "rewrite-boundaries-fallback",
        label: "Confirm whether the old step dashboard remains as a fallback during rollout",
      },
    ],
  },
  {
    id: "child-plans",
    label: "Keep the rewrite split across executable child plans",
    detail: (
      <P>
        Each child plan owns one slice of the rewrite and can move through the roadmap board
        independently. This avoids a single 100-task checklist where architecture, visuals,
        tutorial, and cutover blur together.
      </P>
    ),
    children: [
      {
        id: "child-plans-spike",
        label: (
          <>
            R&D design spike:{" "}
            <RoadmapFileRef path="app/docs/roadmap/constellation-lobby-spike.tsx" />
          </>
        ),
      },
      {
        id: "child-plans-foundation",
        label: (
          <>
            Foundation and field architecture:{" "}
            <RoadmapFileRef path="app/docs/roadmap/constellation-lobby-foundation.tsx" />
          </>
        ),
      },
      {
        id: "child-plans-flow",
        label: (
          <>
            Interaction flow and selection state:{" "}
            <RoadmapFileRef path="app/docs/roadmap/constellation-lobby-flow.tsx" />
          </>
        ),
      },
      {
        id: "child-plans-cutover",
        label: (
          <>
            HUD integration, verification, docs, and cleanup:{" "}
            <RoadmapFileRef path="app/docs/roadmap/constellation-lobby-cutover.tsx" />
          </>
        ),
      },
    ],
  },
  {
    id: "governance",
    label: "Maintain cross-plan contracts while the rewrite is active",
    detail: (
      <P>
        Massive rewrite does not mean every layer is up for grabs in the same diff. Child plans
        should name which boundaries they own and which boundaries they consume.
      </P>
    ),
    children: [
      {
        id: "governance-current-code",
        label:
          "Each child plan must start by reading current code, tests, fixtures, and relevant TSX docs",
      },
      {
        id: "governance-shared-types",
        label:
          "Shared lobby types should live in one narrow owner and be imported, not duplicated across child plans",
      },
      {
        id: "governance-verification",
        label:
          "Every child plan records its own vp check, vp test, vp build, and browser verification bar",
      },
      {
        id: "governance-status",
        label:
          "Update touched dates, status, task counts, and done counts whenever a child plan changes state",
      },
    ],
  },
  {
    id: "closeout",
    label: "Close the umbrella when the child plans either ship or get shelved",
    children: [
      {
        id: "closeout-docs",
        label:
          "Move durable constellation rules into product, gameplay, workflow, and support docs before deletion",
      },
      {
        id: "closeout-board",
        label:
          "Delete shipped or shelved child plans after their durable decisions move to canonical docs",
      },
      {
        id: "closeout-umbrella",
        label:
          "Delete this umbrella plan after all child plans are shipped, shelved, or replaced by narrower active plans",
      },
    ],
  },
];

export const lede = (
  <>
    The constellation lobby is a full-screen rewrite, not a polish pass. This umbrella keeps that
    ambition explicit while splitting the work into smaller roadmap plans with clear boundaries: R&D
    design spike, foundation, interaction flow, and production cutover.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "plan-header",
    title: "Plan header",
    body: <RoadmapPlanHeader slug={meta.slug} plan={plan} />,
  },
  {
    id: "position",
    title: "Position",
    body: (
      <>
        <P>
          The target product direction is a constellation-first lobby where members are spatial
          stars, pair selection is camera and orbit driven, scenario choice is staged around the
          chosen pair, and existing pre-date panels stop being the primary mental model.
        </P>
        <P>
          The earlier smaller migration plan was too conservative for this intent. The revised
          approach treats the work as a major UI refactor while still refusing uncontrolled sprawl:
          every child plan must state its code owners, dependencies, acceptance criteria, and
          verification.
        </P>
        <DocCallout variant="warn" title="Drafting means not executable yet">
          <P>
            The rewrite can be massive, but production migration cannot start from{" "}
            <Strong>drafting</Strong>. The R&D spike may be <Strong>ready</Strong> while it answers
            design questions; foundation, flow, and cutover should promote only after their
            decisions and acceptance criteria are concrete.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "child-plan-map",
    title: "Child plan map",
    body: (
      <DocList
        items={[
          <span key="spike">
            <Strong>R&D spike:</Strong> first-pass primary-screen mock, art direction, motion
            language, density experiments, and design verdict before architecture hardens.
          </span>,
          <span key="foundation">
            <Strong>Foundation:</Strong> layout engine, star primitives, field rendering, backdrop
            strategy, playground validation, and shared types.
          </span>,
          <span key="flow">
            <Strong>Flow:</Strong> constellation state machine, focus/partner/intent/scenario
            transitions, camera behavior, keyboard path, tutorial anchors, and booking boundaries.
          </span>,
          <span key="cutover">
            <Strong>Cutover:</Strong> HUD surfaces, callouts, route and shell integration, browser
            verification, docs, removal of old step components, and closeout.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <RoadmapAcceptance
        items={[
          "The rewrite is split into active child roadmap plans with explicit dependencies and no duplicated ownership.",
          "No migration child plan moves out of drafting while its blocking decisions remain open.",
          "The production pre-date dashboard is replaced by the constellation lobby when the child plans ship.",
          "The final shipped work has canonical product and gameplay docs, not only temporary roadmap text.",
          "The umbrella and shipped child plans are deleted during closeout.",
        ]}
      />
    ),
  },
  {
    id: "checklist",
    title: "Checklist",
    body: <RoadmapChecklist planSlug={meta.slug} tasks={tasks} status={plan.status} />,
  },
  {
    id: "decisions-log",
    title: "Decisions log",
    body: (
      <RoadmapDecisionsLog
        entries={[
          {
            date: "2026-05-22",
            title:
              "Reject 2.5D shared-scene lounge with generated member tableaus for this rewrite",
            outcome: "rejected",
            body: (
              <P>
                The shared lounge concept creates too much asset identity, perspective, and review
                risk. The constellation keeps the dramatic spatial idea without requiring generated
                seated tableaus for every member.
              </P>
            ),
          },
          {
            date: "2026-05-23",
            title: "Treat constellation lobby as a full rewrite, not an adapter migration",
            outcome: "accepted",
            body: (
              <P>
                The plan now assumes a major replacement of the pre-date dashboard. The safety
                mechanism is plan splitting and explicit contracts, not shrinking the scope.
              </P>
            ),
          },
        ]}
      />
    ),
  },
];

export default function ConstellationLobbyRewritePlan() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
