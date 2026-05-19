import {
  DocCallout,
  DocCode,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  DocTable,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/tutorial-system",
  group: "product",
  title: "Tutorial system",
  description:
    "How first-run orientation, lazy coach marks, tutorial state, and tutorial UI primitives work.",
  order: 7,
};

export const lede = (
  <>
    The tutorial is a surface-owned orientation layer for the first booked date. It teaches the
    player to pick focus cases, draft the Date Book, commit a two-member booking, choose one room,
    run the date, read Cupid's analysis, file a follow-up, and close the shift. It points at shipped
    UI. It does not replace gameplay systems or carry hidden state.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "contract",
    title: "Contract",
    body: (
      <>
        <DocCallout variant="warn" title="Companion catalog">
          <P>
            The verbatim copy for every coach mark lives in{" "}
            <DocLink to="/docs/product/tutorial-steps">Tutorial steps</DocLink>. Any time you add,
            remove, rename, or rewrite a step, update that page in the same change. This doc owns
            the contract; that doc owns the strings.
          </P>
        </DocCallout>
        <P>
          Tutorial behavior follows the same boundary rules as the rest of the app. App-owned save
          state is authoritative. Surfaces decide when a step is relevant. Game services still own
          gameplay consequences.
        </P>
        <DocList
          items={[
            <span key="state">
              <DocCode>GameSave.tutorial</DocCode> stores whether orientation is enabled, which
              steps are complete, and when the player skipped the tour.
            </span>,
            <span key="service">
              <DocCode>app/services/tutorial.ts</DocCode> owns read, complete, dismiss, reset, and
              hook helpers. Do not duplicate tutorial mutation logic in components.
            </span>,
            <span key="surface">
              Each surface calls <DocCode>useTutorialStep</DocCode> near the UI it owns. Avoid a
              global tour config that needs to know every screen.
            </span>,
            <span key="provider">
              Runtime AI providers do not know about tutorial state. They do not complete steps,
              dismiss marks, or decide what the player can see.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "state-and-ids",
    title: "State and ids",
    body: (
      <>
        <P>
          Step ids are typed in <DocCode>tutorialStepIdSchema</DocCode> in{" "}
          <DocCode>app/domain/game.ts</DocCode>. Add an id there before any component can persist
          it. Keep ids stable once they ship, because old saves store completed ids as strings.
        </P>
        <DocTable
          headers={["Area", "Step ids", "Purpose"]}
          rows={[
            [
              "Onboarding",
              <DocCode key="ids">onboarding.focus.* / onboarding.deck.*</DocCode>,
              "Teach four focus cases, starter deck size, budget cap, and deck versus hand.",
            ],
            [
              "Planning",
              <DocCode key="ids">planning.focus / partner / commit / scenario / begin</DocCode>,
              "Teach the two-member booking spine and the three-card hand after commit.",
            ],
            [
              "Live date",
              <DocCode key="ids">
                date.draft-events / footer.* / judge-note / nudge.compose
              </DocCode>,
              "Teach scene draft, footer gauges, transport, the first Cupid note, and nudges.",
            ],
            [
              "Wrap",
              <DocCode key="ids">date.followup / planning.file-shift</DocCode>,
              "Teach follow-up filing and shift close after the first date resolves.",
            ],
            [
              "Lazy support",
              <DocCode key="ids">lazy.*</DocCode>,
              "One-time marks for roster swaps, Date Book locks, repair blocks, cooldowns, closures, and pair files.",
            ],
          ]}
        />
        <DocCallout variant="warn" title="Save merges matter">
          <P>
            Completing a tutorial step often happens in the same click as a gameplay action. Shell
            persistence preserves the latest tutorial state while saving gameplay changes, so action
            handlers should complete the tutorial step before they call the gameplay callback.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "primitives",
    title: "Primitives",
    body: (
      <>
        <P>
          Tutorial UI primitives live in <DocCode>app/components/tutorial/</DocCode>. They are
          presentation only. They do not decide when a step should appear or mutate the save by
          themselves.
        </P>
        <DocDefList
          items={[
            {
              term: <DocCode>TutorialCoachMark</DocCode>,
              def: "The paper note. Use it for copy, progress dots, the skip control, and optional manager art.",
            },
            {
              term: <DocCode>TutorialSpotlight</DocCode>,
              def: "The dimmed canvas with a cutout. Use it when the player must notice or click a surface element.",
            },
            {
              term: <DocCode>TutorialPulseRing</DocCode>,
              def: "The nonblocking ring for small controls, primary CTAs, and footer buttons.",
            },
            {
              term: <DocCode>TutorialProgressDots</DocCode>,
              def: "Use only for short sequences where the player benefits from knowing position.",
            },
            {
              term: <DocCode>TutorialManagerPortraitOver</DocCode>,
              def: "Reserved for the first welcome beat. Do not turn the manager into a gameplay actor.",
            },
          ]}
        />
        <DocCallout variant="note" title="Target refs">
          <DocList
            items={[
              <span key="refs">
                Pass ref objects to tutorial primitives, not <DocCode>ref.current</DocCode>. Ref
                assignment does not cause a React render, so passing <DocCode>.current</DocCode> can
                leave the mark with a null target.
              </span>,
              <span key="fallback">
                Pass an array like <DocCode>{`[selectedCardRef, sectionRef]`}</DocCode> when the
                specific card may not exist yet. The first available target wins.
              </span>,
              "Inline geometry from target rects is allowed inside tutorial primitives. Cosmetic styling should stay in Tailwind utilities or shared component classes.",
            ]}
          />
        </DocCallout>
      </>
    ),
  },
  {
    id: "completion",
    title: "Completion rules",
    body: (
      <>
        <P>
          A tutorial step should complete at the moment the player has done the thing the copy asks
          for. Do not mark an action step complete from a generic acknowledgement button.
        </P>
        <DocTable
          headers={["Step kind", "Complete when", "Primary button"]}
          rows={[
            [
              "Informational",
              "The player acknowledges the concept, for example footer gauges or the first Cupid note.",
              "A short Got it button is fine.",
            ],
            [
              "Action",
              "The player takes the real action, for example selecting a card, committing a pair, starting a date, filing follow-up, or closing a shift.",
              "Omit it, or make it perform the real action.",
            ],
            [
              "Auto-skip",
              "The gameplay state has already moved past the step, for example a trivial scene draft that starts paused.",
              "No button. Complete in an effect.",
            ],
            [
              "Lazy support",
              "The player acknowledges a one-time rule that is not required for the first date path.",
              "A short Got it button is fine.",
            ],
          ]}
        />
        <P>
          Dismissal is global. <DocCode>withTourDismissed</DocCode> disables orientation and records
          <DocCode>dismissedAt</DocCode>. The Settings menu row <Strong>Reset orientation</Strong>{" "}
          calls <DocCode>withOrientationReset</DocCode> and replays every step.
        </P>
      </>
    ),
  },
  {
    id: "adding-steps",
    title: "Adding steps",
    body: (
      <DocSteps
        items={[
          <span key="read">
            Read the owning product docs first. For UI placement, start with{" "}
            <DocLink to="/docs/product/visual-design">Visual design</DocLink>. For player
            visibility, read{" "}
            <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink>.
          </span>,
          <span key="schema">
            Add a stable id to <DocCode>tutorialStepIdSchema</DocCode>. Use a dotted area prefix
            that names the owning surface.
          </span>,
          <span key="surface">
            In the owning component, create a ref for the target and call{" "}
            <DocCode>useTutorialStep(save, id, gate, onTutorialUpdate)</DocCode>.
          </span>,
          "Gate the step from current UI state. Required steps should not stack. Lazy steps should wait while a required step is active.",
          "Complete the step in the same handler as the player action, or in an effect only when the state has already moved past the lesson.",
          "Write copy in Cupid's corporate register. Keep it procedural, dry, and specific. Avoid hidden stat names and never-visible fixture fields.",
          <span key="catalog">
            Add the new step to <DocLink to="/docs/product/tutorial-steps">Tutorial steps</DocLink>{" "}
            in the same change. Place it in the phase that matches when the player will hit it, and
            include the verbatim title, body, trigger, and completes-on copy.
          </span>,
          <span key="verify">
            Run <DocCode>vp check</DocCode>. Run <DocCode>vp test</DocCode> and{" "}
            <DocCode>vp build</DocCode> for gameplay, save, integration, or user-flow changes.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "refactors",
    title: "Refactors",
    body: (
      <>
        <P>
          When a surface moves, move its tutorial gate with it. The step belongs near the component
          that owns the target and the player action.
        </P>
        <DocList
          items={[
            "Keep tutorial state on the save. Do not put tutorial progress in local component state, runtime AI memory, or provider responses.",
            "Keep target refs attached to stable visible elements. If the target can disappear, pass a fallback target array.",
            "Keep lazy support marks quiet while required path marks are active.",
            "If a flow no longer exists, remove its step id only with a save migration decision. Completed saves may still contain the old id.",
            "Update this page when adding a primitive, changing completion semantics, or moving a step to a new surface.",
            <span key="catalog">
              Update <DocLink to="/docs/product/tutorial-steps">Tutorial steps</DocLink> whenever a
              step is added, removed, renamed, rewritten, or relocated. The catalog is the page copy
              reviewers iterate against; drift between this doc and that one is a real bug.
            </span>,
          ]}
        />
      </>
    ),
  },
];

export default function TutorialSystemProductDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
