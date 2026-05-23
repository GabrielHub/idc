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
  slug: "roadmap/constellation-lobby-cutover",
  group: "roadmap",
  title: "Constellation lobby cutover",
  description:
    "Integrate the constellation rewrite into the production shell, migrate HUD surfaces and docs, verify the player workflow, and remove obsolete step UI.",
  order: 14,
};

export const plan: RoadmapPlanMeta = {
  status: "drafting",
  opened: "2026-05-23",
  touched: "2026-05-23",
  owner: "unassigned",
  tldr: "Cut the constellation lobby into production, migrate HUD and callout surfaces, verify the complete workflow, update docs, and remove obsolete pre-date step components.",
  tasks: 30,
  done: 0,
  dependencies: [
    "roadmap/constellation-lobby",
    "roadmap/constellation-lobby-spike",
    "roadmap/constellation-lobby-foundation",
    "roadmap/constellation-lobby-flow",
  ],
  tags: ["ui", "integration", "verification", "cleanup"],
};

const tasks: RoadmapTaskItem[] = [
  {
    id: "phase-1",
    label: "Migrate production HUD and support surfaces",
    children: [
      {
        id: "phase-1-header",
        label: "Integrate PreDateHeader as constellation HUD instead of dashboard header",
      },
      { id: "phase-1-dock", label: "Integrate BeginDateDock with the new scenario-ready state" },
      {
        id: "phase-1-shift-brief",
        label: "Refit ShiftBriefDock as an overlay, side rail, or constellation-native panel",
      },
      { id: "phase-1-lead-ask", label: "Move LeadAskBanner into a focused-star or HUD treatment" },
      {
        id: "phase-1-callouts",
        label: "Refit closure, pending follow-up, and deck-repair callouts into constellation UI",
      },
      {
        id: "phase-1-off-tonight",
        label: "Replace or retire OffTonightSection based on final roster visibility decision",
      },
    ],
  },
  {
    id: "phase-2",
    label: "Cut over production shell",
    children: [
      {
        id: "phase-2-pre-date",
        label: (
          <>
            Replace the production body of{" "}
            <RoadmapFileRef path="app/components/pre-date-canvas.tsx" /> with the constellation
            lobby
          </>
        ),
      },
      {
        id: "phase-2-shell",
        label: (
          <>
            Verify <RoadmapFileRef path="app/components/cupid-shell.tsx" /> handler wiring remains
            correct
          </>
        ),
      },
      {
        id: "phase-2-modals",
        label:
          "Verify member details, scenario details, roster, date book, and pair-file entry points from the new lobby",
      },
      {
        id: "phase-2-routes",
        label:
          "Decide and implement any route navigation changes for notes, pair board, roster, and date book",
      },
      {
        id: "phase-2-fallback",
        label:
          "Decide whether old step UI is retained behind a dev fallback or removed in the same cutover",
      },
    ],
  },
  {
    id: "phase-3",
    label: "Verify complete workflow and performance",
    children: [
      { id: "phase-3-check", label: "Run vp check" },
      { id: "phase-3-test", label: "Run vp test" },
      { id: "phase-3-build", label: "Run vp build" },
      {
        id: "phase-3-browser",
        label:
          "Browser-walk start shift, focus, partner, intent, commit, scenario, begin date, date return, closure/follow-up, and shift close at 1920x1080",
      },
      {
        id: "phase-3-regression",
        label:
          "Verify pair-board, notes, roster, date book, playground, tutorial, and reduced-motion paths still work",
      },
    ],
  },
  {
    id: "phase-4",
    label: "Clean up obsolete implementation and docs",
    children: [
      {
        id: "phase-4-delete-steps",
        label: (
          <>
            Remove <RoadmapFileRef path="app/components/pre-date-canvas-steps.tsx" /> if no fallback
            keeps it alive
          </>
        ),
      },
      {
        id: "phase-4-delete-subcomponents",
        label:
          "Delete or refit pre-date-canvas lead ask, shift brief, off-tonight, callout, and dock files based on final owners",
      },
      {
        id: "phase-4-doc-visual",
        label: (
          <>
            Update <RoadmapFileRef path="app/docs/product/visual-design.tsx" /> with constellation
            rules
          </>
        ),
      },
      {
        id: "phase-4-doc-gameplay",
        label: (
          <>
            Update <RoadmapFileRef path="app/docs/gameplay/case-management.tsx" /> with the new
            planning surface
          </>
        ),
      },
      {
        id: "phase-4-doc-tutorial",
        label: (
          <>
            Update <RoadmapFileRef path="app/docs/product/tutorial-system.tsx" /> and{" "}
            <RoadmapFileRef path="app/docs/product/tutorial-steps.tsx" /> if tutorial behavior
            changed
          </>
        ),
      },
    ],
  },
  {
    id: "phase-5",
    label: "Close out roadmap plans",
    children: [
      {
        id: "phase-5-foundation",
        label: "Move foundation plan to shipped or shelved and delete after durable docs move",
      },
      {
        id: "phase-5-flow",
        label: "Move flow plan to shipped or shelved and delete after durable docs move",
      },
      {
        id: "phase-5-cutover",
        label: "Move this cutover plan to shipped or blocked with exact remaining gaps",
      },
      {
        id: "phase-5-umbrella",
        label: "Close and delete the umbrella plan when all child plans are closed",
      },
    ],
  },
];

export const lede = (
  <>
    This child plan owns production integration and closeout. It should only promote once the
    foundation and flow plans have stable contracts, because this is the phase that touches the real
    player screen and removes old UI.
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
          This is the highest-risk child plan. It replaces the shipped screen, verifies the
          end-to-end workflow, and deletes obsolete code only after the new lobby meets the
          acceptance bar.
        </P>
        <DocCallout variant="danger" title="No silent partial cutover">
          <P>
            If the constellation ships while old and new planning surfaces disagree, record the
            fallback explicitly. Do not leave duplicate primary flows without a status note.
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
          Do not promote this plan to <Strong>ready</Strong> until foundation and flow are both in{" "}
          <Strong>review</Strong> or <Strong>shipped</Strong> with passing checks, a browser-walked
          planning flow, and a clear fallback/removal decision for the old step UI.
        </P>
        <DocCallout variant="danger" title="Production last">
          <P>
            This plan touches the shipped screen. If there is no verified constellation flow yet,
            cutover work should not start.
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
          "The production pre-date screen uses the constellation lobby as the primary UI.",
          "All existing pre-date workflows remain reachable or have an explicit accepted replacement.",
          "vp check, vp test, and vp build pass.",
          "Browser workflow passes at 1920x1080.",
          "Obsolete step UI and stale docs are removed or explicitly retained as fallback.",
          "Durable constellation guidance is moved to canonical docs before roadmap closeout.",
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
            title: "Cutover depends on foundation and flow plans",
            outcome: "accepted",
            body: (
              <P>
                Production replacement waits for stable field primitives and a working constellation
                flow. This plan owns integration, verification, cleanup, and docs.
              </P>
            ),
          },
        ]}
      />
    ),
  },
];

export default function ConstellationLobbyCutoverPlan() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
