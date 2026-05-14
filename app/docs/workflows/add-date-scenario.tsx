import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "workflows/add-date-scenario",
  group: "workflows",
  title: "Add a date scenario",
  description:
    "Content pass for one scenario fixture: design, fixture fields, nine events, tag rules, registration, and validation.",
  order: 1,
};

export const lede = (
  <>
    Use this checklist when adding or heavily revising one date scenario. The code contract lives in{" "}
    <DocCode>dateScenarioSchema</DocCode> in <DocCode>app/domain/game.ts</DocCode>, current fixtures
    live in <DocCode>app/fixtures/scenarios/</DocCode>, and behavior is checked by{" "}
    <DocCode>app/fixtures/scenarios/scenarios.test.ts</DocCode>.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "scope",
    title: "Scope",
    body: (
      <P>
        This workflow is the content pass. Complete the scenario's nonvisual game content in one
        pass, then hand visual design and background art to{" "}
        <DocLink to="/docs/workflows/visual-asset-iteration">Visual asset iteration</DocLink>. Do
        not generate background images or image prompts in the fixture pass.
      </P>
    ),
  },
  {
    id: "read-first",
    title: "Read first",
    body: (
      <DocList
        items={[
          <span key="voice">
            <DocLink to="/docs/product/voice-prompts">Voice in prompts</DocLink> for event kinds, no
            continuing offstage speakers, and scenario card voice.{" "}
            <DocLink to="/docs/product/voice">Voice and tone</DocLink> for the register and prose
            rules every scenario card and judge line must obey.
          </span>,
          <span key="match-fit">
            <DocLink to="/docs/gameplay/match-fit">Match fit</DocLink> for tag-driven booking
            pressure and boundary risk.
          </span>,
          <span key="tags">
            <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink> for
            the request tag taxonomy that scenarios overlap with.
          </span>,
          <span key="knowledge">
            <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink> for what the
            player can see at brief and after the date.
          </span>,
          <span key="image-style">
            <DocLink to="/docs/product/image-style">Image style</DocLink> for scenario background
            acceptance checks.
          </span>,
          <span key="fixtures">
            Existing scenario fixtures in <DocCode>app/fixtures/scenarios/</DocCode>.
          </span>,
          <span key="services">
            <DocCode>app/services/match-fit.ts</DocCode>,{" "}
            <DocCode>app/services/player-knowledge.ts</DocCode>,{" "}
            <DocCode>app/services/date-engine.ts</DocCode>, and{" "}
            <DocCode>app/services/date-prompts.ts</DocCode> when changing tags, event behavior,
            visibility, or prompt pressure.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "design-pass",
    title: "Design pass",
    body: (
      <DocSteps
        items={[
          "Define the room as reusable date pressure, not as a scene for one named member.",
          "Pick the practical date shape: meal, errand, ceremony, public room, quiet room, timed task, shared object, performance pressure, or another clear frame.",
          "Identify what the room tests: privacy, prophecy, memory, public attention, career pressure, low-pressure care, weirdness tolerance, planning, or intimacy.",
          "Confirm the scenario can work for many pairs. It can favor archetypes through hooks, but it must not name a member.",
          "Note whether the scenario needs background art later. The fixture can exist without a manifest entry, in which case the runtime falls back to the Aura mesh.",
        ]}
      />
    ),
  },
  {
    id: "fixture-requirements",
    title: "Fixture requirements",
    body: (
      <>
        <P>
          Add <DocCode>app/fixtures/scenarios/&lt;scenario-id&gt;.ts</DocCode> with a{" "}
          <DocCode>DateScenario</DocCode> object that satisfies{" "}
          <DocCode>dateScenarioSchema</DocCode>:
        </P>
        <DocList
          items={[
            <span key="id">
              <DocCode>id</DocCode>: stable kebab-case scenario id.
            </span>,
            <span key="title">
              <DocCode>title</DocCode>: player-facing card title.
            </span>,
            <span key="summary">
              <DocCode>card.summary</DocCode>: short Cupid corporate premise.
            </span>,
            <span key="card-tags">
              <DocCode>card.tags</DocCode>: one or more tags from{" "}
              <DocCode>scenarioTagSchema</DocCode>.
            </span>,
            <span key="riskinit">
              <DocCode>card.risk</DocCode>, <DocCode>card.intimacy</DocCode>,{" "}
              <DocCode>card.chaos</DocCode>: <DocCode>low</DocCode>, <DocCode>medium</DocCode>, or{" "}
              <DocCode>high</DocCode>.
            </span>,
            <span key="ideal">
              <DocCode>card.idealFor</DocCode>: reusable archetype hints, not member names.
            </span>,
            <span key="bad">
              <DocCode>card.badFor</DocCode>: reusable pressure warnings, not member names.
            </span>,
            <span key="brief">
              <DocCode>publicBrief.location</DocCode>: concrete booking location.
            </span>,
            <span key="premise">
              <DocCode>publicBrief.premise</DocCode>: what makes this room distinct.
            </span>,
            <span key="know">
              <DocCode>publicBrief.whatBothCharactersKnow</DocCode>: shared starting facts.
            </span>,
            <span key="open">
              <DocCode>publicBrief.openingSituation</DocCode>: what is physically happening at turn
              one.
            </span>,
            <span key="director">
              <DocCode>director.tone</DocCode>: scene pressure and texture for prompts.
            </span>,
            <span key="rules">
              <DocCode>director.rules</DocCode>: at least one hard scene rule.
            </span>,
            <span key="events">
              <DocCode>director.events</DocCode>: exactly nine events.
            </span>,
            <span key="early">
              <DocCode>director.earlyEndTriggers</DocCode>: concrete reasons the Judge may end the
              date early.
            </span>,
            <span key="repeat">
              <DocCode>director.repeatBehavior</DocCode>: how repeated use should feel for the same
              pair.
            </span>,
            <span key="success">
              <DocCode>judgeRubric.successSignals</DocCode>: what good exchanges look like.
            </span>,
            <span key="failure">
              <DocCode>judgeRubric.failureSignals</DocCode>: what bad exchanges look like.
            </span>,
            <span key="focus">
              <DocCode>judgeRubric.statFocus</DocCode>: one or more entries from{" "}
              <DocCode>relationshipStatSchema</DocCode>.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "event-requirements",
    title: "Event requirements",
    body: (
      <>
        <P>Every scenario ships exactly nine events: 3 ambient, 3 provocation, 3 reveal.</P>
        <P>Each event needs:</P>
        <DocList
          items={[
            <span key="id">
              <DocCode>id</DocCode>: unique within the scenario.
            </span>,
            <span key="title">
              <DocCode>title</DocCode>: short event title.
            </span>,
            <span key="kind">
              <DocCode>kind</DocCode>: <DocCode>ambient</DocCode>, <DocCode>provocation</DocCode>,
              or <DocCode>reveal</DocCode>.
            </span>,
            <span key="ev">
              <DocCode>event</DocCode>: internal event description.
            </span>,
            <span key="visible">
              <DocCode>characterVisibleText</DocCode>: what the characters can observe.
            </span>,
            <span key="director">
              <DocCode>directorInstruction</DocCode>: prompt instruction for the next performer.
            </span>,
          ]}
        />
        <P>Use event kinds this way:</P>
        <DocList
          items={[
            <span key="ambient">
              <Strong>ambient:</Strong> environmental texture. It can be noticed or ignored.
            </span>,
            <span key="provocation">
              <Strong>provocation:</Strong> physical interruption. The next speaker must react
              before resuming.
            </span>,
            <span key="reveal">
              <Strong>reveal:</Strong> lets existing member context, filed reads, or pair history
              surface. It must not invent new biography.
            </span>,
          ]}
        />
        <DocCallout variant="danger" title="No continuing offstage speakers">
          <P>
            Offstage people, announcements, hosts, servers, machines, creatures, crowds, and other
            environmental sources must not become a continuing third speaker. If an event text
            includes an utterance, sign, label, voice, or role, the{" "}
            <DocCode>directorInstruction</DocCode> must explicitly prevent that source from being
            voiced as continuing dialogue. <DocCode>scenarios.test.ts</DocCode> checks common
            violations.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "tag-and-scoring-rules",
    title: "Tag and scoring rules",
    body: (
      <DocList
        items={[
          <span key="taxonomy">
            Use scenario tags from <DocCode>scenarioTagSchema</DocCode>: <DocCode>temporal</DocCode>
            , <DocCode>cosmic</DocCode>, <DocCode>domestic</DocCode>, <DocCode>career</DocCode>,{" "}
            <DocCode>prophecy</DocCode>, <DocCode>memory</DocCode>, <DocCode>public</DocCode>,{" "}
            <DocCode>haunted</DocCode>, <DocCode>food</DocCode>, <DocCode>low_pressure</DocCode>,{" "}
            <DocCode>high_pressure</DocCode>, <DocCode>repeat_risk</DocCode>.
          </span>,
          <span key="services">
            Tags affect match fit and player knowledge in{" "}
            <DocCode>app/services/match-fit.ts</DocCode> and{" "}
            <DocCode>app/services/player-knowledge.ts</DocCode>.
          </span>,
          "If a new scenario tag is required, add it to the schema, update service handling, update product docs, and add tests in the same change.",
          "Do not use raw tags as player-facing copy.",
          "Risk, intimacy, and chaos are visible card signals, but exact pressure math and rule hits stay hidden.",
        ]}
      />
    ),
  },
  {
    id: "visual-assets-out-of-scope",
    title: "Visual assets out of scope",
    body: (
      <DocCallout variant="danger" title="No image prompts or generation here">
        <P>
          Do not create image prompts, generate background images, or commit new scenario background
          files in this content workflow. The scenario fixture should provide enough public room
          detail for a later image-capable agent to create background art, but the fixture should
          not include the prompt used to create that image.
        </P>
        <P>
          If no approved art exists, leave the scenario out of{" "}
          <DocCode>public/assets/scenarios/manifest.json</DocCode>. The app will use the default
          Aura mesh without probing a missing image path. Add or update{" "}
          <DocCode>assets-source/scenarios/PLACEHOLDERS.md</DocCode> only to track that real art is
          still pending.
        </P>
      </DocCallout>
    ),
  },
  {
    id: "registration",
    title: "Registration",
    body: (
      <DocSteps
        items={[
          <span key="import">
            Import the scenario in <DocCode>app/fixtures/scenarios/index.ts</DocCode>.
          </span>,
          <span key="parse">
            Add it to the parsed <DocCode>starterScenarios</DocCode> array.
          </span>,
          <span key="length">
            Update the <DocCode>.length(...)</DocCode> count.
          </span>,
          "Add the named export.",
          <span key="count">
            Confirm any hard-coded scenario count in{" "}
            <DocCode>app/fixtures/scenarios/scenarios.test.ts</DocCode> is still correct.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "validation",
    title: "Validation",
    body: (
      <>
        <P>Run the project checks through Vite Plus:</P>
        <DocCodeBlock language="powershell">{`vp check
vp test
vp build`}</DocCodeBlock>
        <P>
          The scenario fixture tests must pass. They verify scenario count, member-name isolation,
          unique event ids, likely offstage speaker handling, and reveal text that appears to
          hard-code new biography.
        </P>
        <P>
          Use Playwright for UI validation when the scenario affects Date Book cards, scenario
          inspector, Live Date planning, event draft selection, or live date flow. Background
          rendering checks belong to the visual asset workflow. The dev server must already be
          running at <DocCode>http://localhost:5173/</DocCode> before Playwright work.
        </P>
      </>
    ),
  },
];

export default function AddDateScenarioDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
