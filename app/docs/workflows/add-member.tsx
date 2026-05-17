import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  DocSubsection,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "workflows/add-member",
  group: "workflows",
  title: "Add a member",
  description:
    "Content pass for one member fixture: design, fixture fields, prose rules, requests, registration, and validation.",
  order: 0,
};

export const lede = (
  <>
    Use this checklist when adding or heavily revising one member. Code contracts live in{" "}
    <DocCode>app/domain/game.ts</DocCode>, fixtures live in <DocCode>app/fixtures/members/</DocCode>
    , and fixture tests enforce several content rules.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "scope",
    title: "Scope",
    body: (
      <>
        <P>
          This workflow is the content pass. Complete the member's nonvisual game content in one
          pass, then hand visual design and image assets to{" "}
          <DocLink to="/docs/workflows/visual-asset-iteration">Visual asset iteration</DocLink>. Do
          not generate portraits, avatars, variants, scenario backgrounds, or image prompts in the
          fixture pass.
        </P>
      </>
    ),
  },
  {
    id: "read-first",
    title: "Read first",
    body: (
      <DocList
        items={[
          <span key="member-fields">
            <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink> for
            schema, identity tag, voice block contract, and authoring requirements.
          </span>,
          <span key="knowledge">
            <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink> for what is
            public, gated, or never visible.
          </span>,
          <span key="match-fit">
            <DocLink to="/docs/gameplay/match-fit">Match fit</DocLink> for tag-driven booking
            pressure and boundary risk.
          </span>,
          <span key="roster-chemistry">
            <DocLink to="/docs/gameplay/roster-chemistry">Roster chemistry</DocLink> for warm
            clusters, friction zones, and the four-anchor authoring pass.
          </span>,
          <span key="voice">
            <DocLink to="/docs/product/voice">Voice and tone</DocLink> for registers, prose
            mechanics, and what the tone is not.{" "}
            <DocLink to="/docs/product/voice-fingerprints">Voice fingerprints</DocLink> for the
            per-member voice block (register, patterns used and refused, tics, greeting, hinge bits)
            read as flavor, not a script, plus interdimensionality framing.{" "}
            <DocLink to="/docs/product/voice-patterns">Voice patterns</DocLink> for the comedic
            flavor library you draw from when filling the block.
          </span>,
          <span key="heights">
            <DocLink to="/docs/product/character-heights">Character heights</DocLink> for genuine
            profile height canon and the playground Height lineup workflow.
          </span>,
          <span key="image-style">
            <DocLink to="/docs/product/image-style">Image style</DocLink> for the portrait canvas
            contract, prompt construction, and acceptance checks.
          </span>,
          <span key="visual-design">
            <DocLink to="/docs/product/visual-design">Visual design</DocLink>, especially per-member
            chat bubbles and per-member auras when approved direction already exists.
          </span>,
          <span key="existing">
            Existing member fixtures in <DocCode>app/fixtures/members/</DocCode>, existing requests
            in <DocCode>app/fixtures/goals/member-requests.ts</DocCode>, and the aura registry in{" "}
            <DocCode>app/components/member-aura-registry.ts</DocCode>.
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
          "Work on one member at a time. Do not batch create members.",
          "Define the member's durable role in the roster. A good member creates reusable pressure across the cast, not a single destined match.",
          <span key="clusters">
            Place the member into at least one warm cluster and one friction zone from{" "}
            <DocLink to="/docs/gameplay/roster-chemistry">Roster chemistry</DocLink>. If neither
            fits, reshape the premise.
          </span>,
          <span key="anchor">
            Run the four-anchor authoring pass: four warm anchors, four friction anchors, one
            sentence of evidence for each, and any field revisions needed.
          </span>,
          "Keep the anchor list out of fixtures, scenario fixtures, prompts, and scoring tables. The list is an authoring audit only.",
          "Decide the member's reality frame before writing voice: normal app user, non-human who treats their nature as ordinary, displaced human, sanctioned trial participant, competitor, consort market user, handler routed case, or another specific frame.",
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
          Add <DocCode>app/fixtures/members/&lt;member-id&gt;.ts</DocCode> with a{" "}
          <DocCode>Member</DocCode> object that satisfies <DocCode>memberSchema</DocCode>:
        </P>
        <DocList
          items={[
            <span key="identity">
              <Strong>Identity fields:</Strong> <DocCode>id</DocCode>, <DocCode>name</DocCode>,{" "}
              <DocCode>firstName</DocCode>, <DocCode>origin</DocCode>, <DocCode>species</DocCode>,{" "}
              <DocCode>dimension</DocCode>, <DocCode>realityStatus</DocCode>.
            </span>,
            <span key="height">
              <Strong>Height:</Strong> two integer inch fields.{" "}
              <DocCode>characterHeightInInches</DocCode> is the canonical date-surface profile
              height shown on labels.<DocCode>standeeRenderHeightInInches</DocCode> is the standee
              scale bucket. Tune the second after source-scale normalization. Keep it inside the
              lineup bounds enforced by <DocCode>members.test.ts</DocCode>.
            </span>,
            <span key="prose">
              <Strong>Core prose:</Strong> <DocCode>bio</DocCode>, <DocCode>datingProfile</DocCode>,{" "}
              <DocCode>relationshipNeeds</DocCode>, <DocCode>preferences</DocCode>,{" "}
              <DocCode>dealbreakers</DocCode>, <DocCode>secrets</DocCode>. Do not fill{" "}
              <DocCode>visualDescription</DocCode> in this initial content pass.
            </span>,
            <span key="tags">
              <Strong>Hidden tags:</Strong> 3 to 5 tags from <DocCode>memberTagSchema</DocCode>,
              with exactly one identity tag: <DocCode>ordinary_human</DocCode> or{" "}
              <DocCode>non_human</DocCode>.
            </span>,
            <span key="voice">
              <Strong>Voice:</Strong> <DocCode>register</DocCode>, <DocCode>patternsUsed</DocCode>,{" "}
              <DocCode>patternsRefused</DocCode>, <DocCode>tics</DocCode>, and{" "}
              <DocCode>sampleMessages</DocCode>.
            </span>,
            <span key="state">
              <Strong>State:</Strong> <DocCode>mood</DocCode>, <DocCode>openness</DocCode>,{" "}
              <DocCode>burnout</DocCode>, <DocCode>retention</DocCode>,{" "}
              <DocCode>currentRequestId</DocCode>, <DocCode>recentDateResult</DocCode>,{" "}
              <DocCode>status</DocCode>.
            </span>,
            <span key="portrait">
              <Strong>Portrait references</Strong> only after approved files exist. Do not generate
              images in this pass. Do not set <DocCode>portraitAsset.prompt</DocCode>.{" "}
              <DocCode>visualDescription</DocCode> is added only after the neutral portrait is
              approved in the visual asset workflow.
            </span>,
            <span key="bubble">
              Optional presentation such as <DocCode>chatBubble</DocCode> only when approved visual
              direction already exists. Otherwise leave it for the visual asset workflow.
            </span>,
          ]}
        />
        <DocSubsection id="sample-counts" title="Sample and pattern counts (schema-enforced)">
          <P>
            The counts below are upper bounds, not quotas the performer is meant to hit. Sample
            lines are rhythm references for the model; pattern entries are flavors the character can
            land on when natural. None of them is required to appear in any given reply.
          </P>
          <DocList
            items={[
              <span key="greeting">
                <DocCode>greeting</DocCode>: 3 to 6 lines. Actual sit-down intros, not punchy bits.
                These are the only samples the performer is allowed to repeat or stretch as a
                literal first line.
              </span>,
              <span key="hingeBits">
                <DocCode>hingeBits</DocCode>: 3 to 6 lines. Humor and voice grounding, written as
                the kind of bit this character would post on a dating app. Reference only; never
                used verbatim.
              </span>,
              <span key="warming">
                <DocCode>warming</DocCode>: 3 to 6 lines.
              </span>,
              <span key="cooling">
                <DocCode>cooling</DocCode>: 3 to 6 lines.
              </span>,
              <span key="crashing">
                <DocCode>crashingOut</DocCode>: 2 to 4 lines.
              </span>,
              <span key="used">
                <DocCode>patternsUsed</DocCode>: 1 to 4 flavors from{" "}
                <DocCode>voicePatternSchema</DocCode>. Keep this tight. A long list reads to the
                performer as a quota and produces members who always do the bit.
              </span>,
              <span key="refused">
                <DocCode>patternsRefused</DocCode>: at least 2 entries from{" "}
                <DocCode>voicePatternSchema</DocCode> that genuinely break the character.
              </span>,
              <span key="tics">
                <DocCode>tics</DocCode>: 3 to 5 concrete syntax or vocabulary habits that may
                surface when natural. Not stage directions the performer has to perform.
              </span>,
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [{ id: "sample-counts", title: "Sample and pattern counts (schema-enforced)" }],
  },
  {
    id: "prose-rules",
    title: "Prose rules",
    body: (
      <DocList
        items={[
          "Write member copy in the member's voice. Write system and request framing in Cupid corporate voice when the surface demands it.",
          <span key="tagline">
            Treat the first sentence of <DocCode>datingProfile</DocCode> as the public roster
            tagline. It appears on member cards before the player has earned deeper reads.
          </span>,
          "The public tagline must be one short in-character sentence that tells who the member is through voice, personality, and a concrete hook. Reaver and Cha Yusung are the model shape: job or background lands inside the voice, not as a census row.",
          "The first sentence must carry the hook by itself. The app sentence-splits the profile, so a first sentence that only says a name, label, or setup for the next sentence will make the roster card weak even if the second sentence is good.",
          "Do not use a bare name, name plus period, age plus location inventory, or job label as the public tagline. Venus is the narrow exception when the name declaration itself carries the bit.",
          <span key="no-name">
            Do not name another member as a required match, enemy, success, or failure inside the
            member fixture. <DocCode>members.test.ts</DocCode> checks this.
          </span>,
          "Keep player knowledge boundaries intact. Public profile fragments can hint. Hidden fields, secrets, tags, exact state values, prompts, and raw scoring rules stay hidden.",
          "Do not invent visual canon before a portrait exists. Runtime visual descriptions come from approved neutral portrait art, not from the initial member-writing agent.",
          "Every hidden tag must be supported by authored prose. If the prose does not prove the tag, change the prose or remove the tag.",
          "Do not add a member field unless code or UI reads it.",
        ]}
      />
    ),
  },
  {
    id: "member-requests",
    title: "Member requests",
    body: (
      <DocSteps
        items={[
          <span key="add">
            Add request entries in <DocCode>app/fixtures/goals/member-requests.ts</DocCode>.
          </span>,
          "Give the member enough request variety for shift rotation. Current roster pattern is usually four requests per member.",
          <span key="state">
            Set the fixture <DocCode>state.currentRequestId</DocCode> to an existing request id for
            that member.
          </span>,
          <span key="tags">
            Use request tags from <DocCode>memberRequestTagSchema</DocCode>. If a new tag is needed,
            update the schema, deterministic fit handling when needed, docs, and tests in the same
            change.
          </span>,
          "Keep request text member-aware but operational. It should express what the member wants Cupid to book, not reveal hidden facts wholesale.",
        ]}
      />
    ),
  },
  {
    id: "visual-assets-out-of-scope",
    title: "Visual assets out of scope",
    body: (
      <DocCallout variant="danger" title="Do not generate images here">
        <P>
          Do not create image prompts, generate images, run cutouts, or commit new portrait files in
          this content workflow. The fixture pass can write visual requirements in plain member
          facts that a later image-capable agent can use: intended profile height, species or
          origin, age presentation, outfit language, and supernatural visual hook.
        </P>
        <P>
          Member fixtures should not include the prompts used to create images. Leave{" "}
          <DocCode>portraitAsset.prompt</DocCode> unset.
        </P>
        <P>
          If approved portrait files do not exist yet, do not claim the member is shippable. Keep
          the content complete and hand off to{" "}
          <DocLink to="/docs/workflows/visual-asset-iteration">Visual asset iteration</DocLink>.
          Full member fixture validation runs after approved source and runtime assets exist,
          because <DocCode>members.test.ts</DocCode> verifies the asset paths.
        </P>
      </DocCallout>
    ),
  },
  {
    id: "presentation-hooks",
    title: "Presentation hooks",
    body: (
      <DocList
        items={[
          <span key="index">
            Add the member import, parse entry, and export in{" "}
            <DocCode>app/fixtures/members/index.ts</DocCode>. Update the schema array length.
          </span>,
          <span key="goals">
            Add or confirm member requests are exported through{" "}
            <DocCode>app/fixtures/goals/index.ts</DocCode>.
          </span>,
          <span key="aura">
            Add an aura entry in <DocCode>app/components/member-aura-registry.ts</DocCode> only if
            visual direction is already approved. Otherwise leave the aura handoff in the content
            notes for the visual pass. The kind table, render slots, and per-kind tint examples live
            in{" "}
            <DocLink to="/docs/product/visual-design#per-member-auras">
              Visual design, Per-member auras
            </DocLink>
            ; focus a member in the Roster room of the playable shell to see auras animate.
          </span>,
          <span key="bubble">
            Add <DocCode>chatBubble</DocCode> only when the member needs a distinct bubble style and
            the visual direction is already approved. Otherwise leave it for the visual pass. The
            schema axes and four reference fixtures (Venus, Vhool, Aldric, Sera) are in{" "}
            <DocLink to="/docs/product/visual-design#per-member-chat-bubbles">
              Visual design, Per-member chat bubbles
            </DocLink>
            ; the <DocLink to="/playground">Playground</DocLink> Chat bubble gallery shows every
            shipped bubble side by side.
          </span>,
          <span key="chemistry">
            Update <DocLink to="/docs/gameplay/roster-chemistry">Roster chemistry</DocLink> clusters
            and friction zones with the member's durable pressures.
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
          The nonvisual content should pass <DocCode>vp check</DocCode>. Full{" "}
          <DocCode>vp test</DocCode> and <DocCode>vp build</DocCode> are required before shipping
          the member. If approved portrait files do not exist yet, record that full member fixture
          validation is blocked on the visual asset pass because <DocCode>members.test.ts</DocCode>{" "}
          verifies portrait asset paths and avatar srcset files.
        </P>
        <P>
          Use Playwright for UI validation when the new member affects roster cards, modal layout,
          date standees, chat bubbles, auras, or onboarding. The dev server must already be running
          at <DocCode>http://localhost:5173/</DocCode> before Playwright work.
        </P>
      </>
    ),
  },
];

export default function AddMemberDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
