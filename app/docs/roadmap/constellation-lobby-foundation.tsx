import {
  DocCallout,
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
  slug: "roadmap/constellation-lobby-foundation",
  group: "roadmap",
  title: "Constellation lobby foundation",
  description:
    "Build the shared layout, rendering, visual, and playground foundation for the constellation lobby rewrite.",
  order: 12,
};

export const plan: RoadmapPlanMeta = {
  status: "drafting",
  opened: "2026-05-23",
  touched: "2026-05-23",
  owner: "unassigned",
  tldr: "Create the constellation field architecture: shared types, deterministic layout, star rendering, backdrop strategy, playground fixtures, and foundation tests.",
  tasks: 34,
  done: 0,
  dependencies: ["roadmap/constellation-lobby", "roadmap/constellation-lobby-spike"],
  tags: ["ui", "foundation", "canvas", "rewrite"],
};

const tasks: RoadmapTaskItem[] = [
  {
    id: "phase-0",
    label: "Resolve foundation decisions",
    detail: (
      <P>
        These decisions should start from the accepted R&D spike direction. If foundation work wants
        a different visual language, send that back to the spike plan rather than changing it here.
      </P>
    ),
    children: [
      { id: "phase-0-renderer", label: "Choose SVG/HTML field, canvas, or hybrid renderer" },
      {
        id: "phase-0-layout",
        label: "Choose shift-role rings, curated spiral, or graph-derived layout",
      },
      { id: "phase-0-roster-density", label: "Choose whether all 48 members render in v1" },
      {
        id: "phase-0-backdrop",
        label: "Choose CSS/SVG backdrop, generated image, or layered hybrid",
      },
      { id: "phase-0-type-owner", label: "Choose the owner file for shared lobby display types" },
    ],
  },
  {
    id: "phase-1",
    label: "Audit current reusable primitives",
    children: [
      {
        id: "phase-1-pair-board",
        label: (
          <>
            Read <RoadmapFileRef path="app/components/pair-board-layout.ts" /> and decide what
            layout helpers can be reused or copied into the new owner
          </>
        ),
      },
      {
        id: "phase-1-member-assets",
        label:
          "Audit portraits, avatars, chatBubble accent colors, portrait palette, and member-aura registry inputs",
      },
      {
        id: "phase-1-motion",
        label: "Audit existing motion/react patterns and reduced-motion handling",
      },
      {
        id: "phase-1-playground",
        label: "Audit playground route registration patterns for visual component tests",
      },
      {
        id: "phase-1-docs",
        label:
          "Read visual-design, image-style, case-management, and player-knowledge docs for design constraints",
      },
    ],
  },
  {
    id: "phase-2",
    label: "Build deterministic constellation layout",
    children: [
      {
        id: "phase-2-types",
        label: (
          <>
            Add shared layout types under <RoadmapFileRef path="app/components/" hint="new" /> with
            explicit star roles, rings, and connection geometry
          </>
        ),
      },
      {
        id: "phase-2-seeded",
        label:
          "Use createNamespacedRandom, createSeededRandom, randomIndex, shuffleInPlace, shuffledBySeed, or hash helpers instead of Math.random",
      },
      {
        id: "phase-2-positions",
        label:
          "Produce normalized coordinates for focus members, eligible partners, off-tonight members, committed pair, and scenario anchors",
      },
      {
        id: "phase-2-lines",
        label:
          "Produce deterministic connection line geometry for match-fit and memory/relationship overlays",
      },
      {
        id: "phase-2-tests",
        label:
          "Unit-test stable positions, no overlap above threshold, role buckets, and deterministic output",
      },
    ],
  },
  {
    id: "phase-3",
    label: "Build visual primitives",
    children: [
      {
        id: "phase-3-star",
        label:
          "Build star node primitive with portrait/avatar expansion, aura color, selected, eligible, unavailable, and disabled states",
      },
      {
        id: "phase-3-field",
        label:
          "Build constellation field shell with backdrop, star layer, edge layer, label layer, and overlay slots",
      },
      {
        id: "phase-3-camera",
        label: "Build camera transform primitives for focus, pair, scenario, and reset positions",
      },
      {
        id: "phase-3-backdrop",
        label:
          "Implement chosen backdrop strategy without committing generated assets unless the asset decision approved them",
      },
      {
        id: "phase-3-reduced-motion",
        label: "Make reduced-motion rendering static but functionally equivalent",
      },
    ],
  },
  {
    id: "phase-4",
    label: "Create playground validation",
    children: [
      {
        id: "phase-4-route",
        label: (
          <>
            Add a dedicated playground entry under{" "}
            <RoadmapFileRef path="app/routes/playground/tests/" hint="new" />
          </>
        ),
      },
      {
        id: "phase-4-fixtures",
        label:
          "Include dense, sparse, all-48, focus-only, committed-pair, and off-tonight fixture states",
      },
      {
        id: "phase-4-controls",
        label:
          "Expose controls for layout mode, roster density, selected focus, selected partner, committed pair, and reduced motion",
      },
      {
        id: "phase-4-screenshot",
        label:
          "Browser-check the playground at 1920x1080 and record readability or performance blockers in the plan",
      },
      {
        id: "phase-4-verdict",
        label: "Record a go/no-go decision for the chosen renderer and layout strategy",
      },
    ],
  },
  {
    id: "phase-5",
    label: "Handoff foundation to flow plan",
    children: [
      {
        id: "phase-5-contract",
        label: "Document the exported foundation APIs the flow plan consumes",
      },
      { id: "phase-5-tests", label: "Run vp check and focused layout/playground tests" },
      {
        id: "phase-5-status",
        label: "Update plan status, touched date, task counts, and blockers",
      },
    ],
  },
];

export const lede = (
  <>
    This child plan owns the field architecture for the rewrite: layout, star rendering, backdrop,
    camera primitives, playground fixtures, and foundation tests. It does not wire production
    booking flow.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "plan-header",
    title: "Plan header",
    body: <RoadmapPlanHeader slug={meta.slug} plan={plan} />,
  },
  {
    id: "scope",
    title: "Scope",
    body: (
      <>
        <P>
          This plan is allowed to be a substantial rewrite of the visual foundation. It should still
          keep the output as reusable UI infrastructure rather than embedding gameplay consequences.
        </P>
        <DocCallout variant="info" title="Foundation output">
          <P>
            The output should be a tested field that the flow plan can drive. If production booking
            behavior starts changing here, split that work out.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "readiness-gate",
    title: "Readiness gate",
    body: (
      <>
        <P>
          Do not promote this plan to <Strong>ready</Strong> until{" "}
          <RoadmapFileRef path="app/docs/roadmap/constellation-lobby-spike.tsx" /> records an
          accepted design verdict for density, star treatment, backdrop, HUD placement, and motion
          posture.
        </P>
        <DocCallout variant="warn" title="Blocked by design lock">
          <P>
            Foundation work should implement the approved design language. If the spike leaves more
            than one viable visual direction, this plan should stay <Strong>drafting</Strong>.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <RoadmapAcceptance
        items={[
          "A deterministic constellation layout produces stable positions and connection geometry.",
          "Reusable star, field, backdrop, and camera primitives exist and are exercised in playground.",
          "Reduced-motion rendering is implemented at the primitive level.",
          "The chosen renderer and layout mode have a recorded decision.",
          "vp check and focused foundation tests pass.",
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
            date: "2026-05-23",
            title: "Split foundation from production flow",
            outcome: "accepted",
            body: (
              <P>
                The field can be built and validated independently. Production booking and tutorial
                flow belong to the flow plan.
              </P>
            ),
          },
        ]}
      />
    ),
  },
];

export default function ConstellationLobbyFoundationPlan() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
