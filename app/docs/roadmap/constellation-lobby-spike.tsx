import {
  DocCallout,
  DocCode,
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
  slug: "roadmap/constellation-lobby-spike",
  group: "roadmap",
  title: "Constellation lobby R&D spike",
  description:
    "Mock the constellation lobby on a standalone route as a primary-screen design spike before committing to production architecture, flow migration, and cleanup.",
  order: 11,
};

export const plan: RoadmapPlanMeta = {
  status: "ready",
  opened: "2026-05-23",
  touched: "2026-05-23",
  owner: "unassigned",
  tldr: "Define the primary constellation screen in a safe mock first: visual language, density, motion, star treatment, HUD placement, and the minimum interaction model.",
  tasks: 33,
  done: 0,
  dependencies: ["roadmap/constellation-lobby"],
  tags: ["ui", "spike", "design", "prototype"],
};

const tasks: RoadmapTaskItem[] = [
  {
    id: "phase-0",
    label: "Set spike rules and success criteria",
    detail: (
      <P>
        This plan is intentionally exploratory. It may use fixture data, local mock state, and
        temporary route wiring. It should not migrate production behavior, persistence, save
        schemas, AI prompts, or date-engine services.
      </P>
    ),
    children: [
      {
        id: "phase-0-primary-screen",
        label:
          "Build the spike around the primary pre-date screen states, not a landing page or route map",
      },
      {
        id: "phase-0-safe-surface",
        label:
          "Use a standalone temporary route as the spike surface; do not replace the production home route",
      },
      {
        id: "phase-0-route-file",
        label: (
          <>
            Create <RoadmapFileRef path="app/routes/constellation-lobby-spike.tsx" /> as the main
            mock route file
          </>
        ),
      },
      {
        id: "phase-0-register",
        label: (
          <>
            Register a temporary direct route in <RoadmapFileRef path="app/routes.ts" />, for
            example{" "}
            <DocCode>
              route("constellation-lobby-spike", "routes/constellation-lobby-spike.tsx")
            </DocCode>
          </>
        ),
      },
      {
        id: "phase-0-route-chrome",
        label: (
          <>
            Keep the route chrome minimal so the mock reads like the future primary screen, not the
            UI playground
          </>
        ),
      },
      {
        id: "phase-0-no-production",
        label:
          "Record that production handlers may be stubbed or mocked until the design language is approved",
      },
      {
        id: "phase-0-review-bar",
        label:
          "Define review bar: desktop screenshot, all-48 density, focused pair state, scenario state, reduced motion, and design notes",
      },
      {
        id: "phase-0-no-root-artifacts",
        label:
          "Keep browser screenshots, traces, notes, and temporary artifacts out of the repository root",
      },
    ],
  },
  {
    id: "phase-1",
    label: "Audit visual constraints before mocking",
    children: [
      {
        id: "phase-1-current-screen",
        label: (
          <>
            Read <RoadmapFileRef path="app/components/pre-date-canvas.tsx" /> and current pre-date
            subcomponents to understand what information the mock must account for
          </>
        ),
      },
      {
        id: "phase-1-design-docs",
        label: (
          <>
            Read <RoadmapFileRef path="app/docs/product/visual-design.tsx" /> and{" "}
            <RoadmapFileRef path="app/docs/product/image-style.tsx" />
          </>
        ),
      },
      {
        id: "phase-1-pair-board",
        label:
          "Read pair-board playground and layout code for prior spatial UI patterns, then decide what not to inherit visually",
      },
      {
        id: "phase-1-assets",
        label:
          "Audit portraits, avatars, chatBubble colors, portrait palettes, member aura registry, and existing backdrop treatments",
      },
    ],
  },
  {
    id: "phase-2",
    label: "Mock the primary constellation screen",
    detail: (
      <P>
        The mock should feel like the intended first screen of the rewrite, even if data and
        handlers are fake. Avoid building a narrow widget demo that cannot answer the product
        question.
      </P>
    ),
    children: [
      {
        id: "phase-2-field",
        label:
          "Create the full-screen constellation field with member stars, backdrop, connection treatment, and readable labels",
      },
      {
        id: "phase-2-hud",
        label:
          "Place shift status, budget/date slots, AI readiness, roster/date book entry points, and shift actions in the new HUD language",
      },
      {
        id: "phase-2-focus",
        label:
          "Mock focus selection: selected focus star, eligible partner stars, unavailable stars, and lead ask treatment",
      },
      {
        id: "phase-2-pair",
        label:
          "Mock partner selection: binary pair staging, connection intensity, intent controls, and cancel/back affordance",
      },
      {
        id: "phase-2-scenario",
        label:
          "Mock committed pair and scenario choice: three scenario cards, selected scenario, begin-date dock, and date-book lock state",
      },
      {
        id: "phase-2-callouts",
        label:
          "Mock closure, deck repair, pending follow-up, cooldown, and off-tonight callouts in constellation-native form",
      },
    ],
  },
  {
    id: "phase-3",
    label: "Explore design variants",
    children: [
      {
        id: "phase-3-density",
        label:
          "Compare all-48 visible, focus-plus-eligible, and layered roster rail density variants",
      },
      {
        id: "phase-3-backdrop",
        label:
          "Compare CSS/SVG procedural backdrop, generated ambient image direction, and layered hybrid direction",
      },
      {
        id: "phase-3-star",
        label:
          "Compare star-only, avatar-in-star, portrait-on-hover, and card-on-click member treatments",
      },
      {
        id: "phase-3-motion",
        label:
          "Compare camera zoom, orbital movement, restrained fade/scale, and reduced-motion static language",
      },
      {
        id: "phase-3-mobile",
        label: "Do a rough small-viewport read even if production mobile is not the primary target",
      },
    ],
  },
  {
    id: "phase-4",
    label: "Review and lock design language",
    children: [
      {
        id: "phase-4-browser",
        label:
          "Use browser automation at 1920x1080 to inspect the mock and capture reviewer notes; do not write screenshots to repo root",
      },
      {
        id: "phase-4-critique",
        label:
          "Write a critique in the plan: what reads as game, what reads as dashboard, what is too dense, what is too decorative",
      },
      {
        id: "phase-4-decision",
        label:
          "Record accepted design direction in Decisions log: layout density, star treatment, HUD placement, backdrop, and motion posture",
      },
      {
        id: "phase-4-foundation-contract",
        label:
          "Translate the approved mock into concrete foundation requirements for layout, primitives, and rendering constraints",
      },
      {
        id: "phase-4-close",
        label:
          "Move durable design decisions to visual-design docs when implementation begins; delete temporary mock code when superseded",
      },
    ],
  },
];

export const lede = (
  <>
    Before the rewrite migrates behavior, this spike defines what the constellation lobby should
    actually feel like as the primary screen. It lives on a standalone temporary route so the mock
    can use the full viewport without playground framing. It is a safe place to be bold: mock the
    whole screen, try density and motion variants, and lock the design language before foundation
    and flow plans harden it into architecture.
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
          This plan exists because the primary-screen design should be decided before production
          migration starts. The mock can be a direct route on this branch as long as it is isolated,
          clearly temporary, and does not replace the production home route.
        </P>
        <DocCallout variant="info" title="Spike output">
          <P>
            The output is not production completeness. It is a reviewed design direction and enough
            concrete UI evidence for the foundation plan to build the right primitives.
          </P>
        </DocCallout>
        <DocCallout variant="warn" title="Ready scope">
          <P>
            This plan is marked <Strong>ready</Strong> only for the standalone route spike. It does
            not authorize foundation, flow, or cutover work. Those plans remain gated on the
            recorded design verdict from this spike.
          </P>
        </DocCallout>
        <P>
          <Strong>In scope:</Strong>
        </P>
        <DocList
          items={[
            "Primary pre-date screen mock with realistic fixture data on a standalone route.",
            "Visual language for field, stars, labels, HUD, callouts, scenario cards, and begin-date dock.",
            "Density and motion variants.",
            "Browser review at 1920x1080.",
            "Design decisions that become requirements for the foundation plan.",
          ]}
        />
        <P>
          <Strong>Out of scope:</Strong>
        </P>
        <DocList
          items={[
            "Production data migration.",
            "Save schema, domain, AI, or date-engine changes.",
            "Full tutorial migration.",
            "Deleting old pre-date components.",
            "Claiming the rewrite is ready before the mock is reviewed.",
          ]}
        />
      </>
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance",
    body: (
      <RoadmapAcceptance
        items={[
          "A full primary-screen constellation mock exists in an isolated safe surface.",
          "The mock covers idle, focus selected, partner selected, committed pair, scenario selected, and callout-heavy states.",
          "Density, backdrop, star treatment, HUD placement, and motion posture have recorded decisions.",
          "The foundation plan has concrete requirements derived from the approved mock.",
          "Temporary spike route is either explicitly retained as design reference or deleted when superseded.",
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
            title: "Add R&D spike before foundation and flow work",
            outcome: "accepted",
            body: (
              <P>
                The constellation rewrite needs a first-screen design lock before architecture and
                production migration. This spike owns that exploration and feeds the foundation
                plan.
              </P>
            ),
          },
          {
            date: "2026-05-23",
            title: "Use a standalone temporary route as the safe spike surface",
            outcome: "accepted",
            body: (
              <P>
                The spike should live at{" "}
                <RoadmapFileRef path="app/routes/constellation-lobby-spike.tsx" /> and be registered
                from <RoadmapFileRef path="app/routes.ts" /> as a temporary direct route. It can use
                fixture data and mock state, but it must not replace production routing or gameplay
                handlers.
              </P>
            ),
          },
        ]}
      />
    ),
  },
];

export default function ConstellationLobbySpikePlan() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
