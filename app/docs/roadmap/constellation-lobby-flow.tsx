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
  slug: "roadmap/constellation-lobby-flow",
  group: "roadmap",
  title: "Constellation lobby flow",
  description:
    "Rewrite the pre-date selection flow around constellation phases, camera transitions, booking, scenario choice, tutorial anchors, and accessible controls.",
  order: 13,
};

export const plan: RoadmapPlanMeta = {
  status: "drafting",
  opened: "2026-05-23",
  touched: "2026-05-23",
  owner: "unassigned",
  tldr: "Replace the step-panel selection model with a typed constellation flow for focus, partner, intent, commit, scenario, begin-date, cancel, tutorial, and accessibility.",
  tasks: 35,
  done: 0,
  dependencies: [
    "roadmap/constellation-lobby",
    "roadmap/constellation-lobby-spike",
    "roadmap/constellation-lobby-foundation",
  ],
  tags: ["ui", "flow", "tutorial", "rewrite"],
};

const tasks: RoadmapTaskItem[] = [
  {
    id: "phase-0",
    label: "Audit current flow contracts",
    children: [
      {
        id: "phase-0-pre-date",
        label: (
          <>
            Read <RoadmapFileRef path="app/components/pre-date-canvas.tsx" /> and{" "}
            <RoadmapFileRef path="app/components/pre-date-canvas-steps.tsx" />
          </>
        ),
      },
      {
        id: "phase-0-shell",
        label: (
          <>
            Read handler wiring in <RoadmapFileRef path="app/components/cupid-shell.tsx" />
          </>
        ),
      },
      {
        id: "phase-0-services",
        label:
          "Read commitDateBooking, clearActiveBooking, startDateSessionFromBooking, drawHandForBooking, and related tests",
      },
      {
        id: "phase-0-tutorial",
        label: "Read tutorial service and current planning tutorial targets",
      },
    ],
  },
  {
    id: "phase-1",
    label: "Define constellation flow state machine",
    children: [
      {
        id: "phase-1-state",
        label:
          "Define typed phases for idle, focus, partner, intent, committed booking, scenario, ready, and blocked states",
      },
      {
        id: "phase-1-events",
        label:
          "Define typed user intents for star select, empty-space back, escape, intent select, commit, scenario select, and begin date",
      },
      {
        id: "phase-1-reducer",
        label: "Build a reducer or equivalent local state owner with explicit transition tests",
      },
      {
        id: "phase-1-active-booking",
        label: "Handle existing active booking on screen load without losing committed state",
      },
      {
        id: "phase-1-reset",
        label: "Handle roster, focus, shift, and scenario-hand changes without stale selected ids",
      },
      {
        id: "phase-1-tests",
        label: "Unit-test every legal transition and a representative illegal transition set",
      },
    ],
  },
  {
    id: "phase-2",
    label: "Wire constellation interactions",
    children: [
      {
        id: "phase-2-focus",
        label:
          "Click or keyboard-select a focus star to center camera and light eligible partner stars",
      },
      {
        id: "phase-2-partner",
        label: "Select eligible partner star to form the binary pair state",
      },
      {
        id: "phase-2-intent",
        label: "Select, clear, and preserve matchmaking intent through commit",
      },
      {
        id: "phase-2-back",
        label: "Implement empty-space, escape, and explicit back controls for each phase",
      },
      {
        id: "phase-2-disabled",
        label: "Keep unavailable stars visible but disabled with off-tonight or cooldown reasons",
      },
    ],
  },
  {
    id: "phase-3",
    label: "Preserve and expose booking boundaries",
    children: [
      {
        id: "phase-3-commit",
        label:
          "Fire onCommitPair only from a valid focus + partner state, carrying optional matchmaking intent",
      },
      {
        id: "phase-3-committed-state",
        label:
          "After commit, derive the committed pair and drawn scenario hand from activeBooking and drawnScenarios",
      },
      {
        id: "phase-3-scenario",
        label:
          "Select scenario from the drawn hand and expose the existing scenario detail modal path",
      },
      {
        id: "phase-3-begin",
        label: "Fire onStartDate only from active booking plus selected drawn scenario",
      },
      {
        id: "phase-3-cancel",
        label: "Keep onCancelBooking behavior available from committed planning state",
      },
    ],
  },
  {
    id: "phase-4",
    label: "Migrate tutorial and accessibility paths",
    children: [
      {
        id: "phase-4-tutorial-targets",
        label:
          "Re-anchor planning.focus, planning.partner, planning.commit, planning.scenario, planning.begin, planning.file-shift, lazy.closure-ready, and lazy.cooldown-block",
      },
      {
        id: "phase-4-keyboard",
        label:
          "Implement keyboard navigation across stars, intent options, scenario cards, commit, cancel, and begin date",
      },
      {
        id: "phase-4-screen-reader",
        label:
          "Provide accessible names and a non-visual ordered control path for the planning flow",
      },
      {
        id: "phase-4-reduced-motion",
        label:
          "Confirm the reduced-motion path has identical state transitions without camera animation dependency",
      },
      {
        id: "phase-4-tests",
        label:
          "Add focused tests for tutorial gates and flow accessibility affordances where practical",
      },
    ],
  },
  {
    id: "phase-5",
    label: "Verify and hand off to cutover",
    children: [
      { id: "phase-5-vp-check", label: "Run vp check" },
      {
        id: "phase-5-vp-test",
        label: "Run focused tests for flow, tutorial, deck, game smoke, and dashboard views",
      },
      {
        id: "phase-5-browser",
        label:
          "Browser-walk the flow at 1920x1080 against localhost:5173 if the dev server is running",
      },
      {
        id: "phase-5-status",
        label: "Update plan status, touched date, task counts, and blockers",
      },
    ],
  },
];

export const lede = (
  <>
    This child plan owns the actual planning experience rewrite. It replaces the step-panel mental
    model with constellation phases while preserving the game services that commit bookings and
    start dates.
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
          This is where the rewrite becomes real for players: focus, partner, intent, scenario, and
          begin-date interactions move from panels to stars, camera states, and orbital controls.
        </P>
        <DocCallout variant="warn" title="Do not bury service changes">
          <P>
            If the flow needs new booking rules or save shape, stop and create a domain/save child
            plan. Do not hide gameplay changes inside UI state work.
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
          Do not promote this plan to <Strong>ready</Strong> until the spike has locked the primary
          screen language and the foundation plan has a stable exported contract for field,
          star-node, camera, and overlay primitives.
        </P>
        <DocCallout variant="warn" title="No speculative flow wiring">
          <P>
            If foundation APIs are still moving, this plan should remain <Strong>drafting</Strong>.
            Flow work needs stable geometry and component contracts to avoid rewriting transition
            logic twice.
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
          "The full pre-date planning flow can be completed through constellation interactions.",
          "Existing booking and start-date service boundaries still own gameplay consequences.",
          "Tutorial targets work on the new flow.",
          "Keyboard, screen-reader, and reduced-motion paths can complete the flow.",
          "Focused tests and required Vite Plus checks pass.",
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
            title: "Flow rewrite consumes foundation primitives",
            outcome: "accepted",
            body: (
              <P>
                The foundation plan owns drawing and geometry. This plan owns player intent,
                transition rules, tutorial behavior, and accessibility paths.
              </P>
            ),
          },
        ]}
      />
    ),
  },
];

export default function ConstellationLobbyFlowPlan() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
