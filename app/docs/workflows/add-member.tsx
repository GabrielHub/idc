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
  slug: "workflows/add-member",
  group: "workflows",
  title: "Add a member",
  description:
    "Ordered workflow for adding or heavily revising one member fixture, including voice design, live tune audit, requests, presentation hooks, and validation.",
  order: 0,
};

export const lede = (
  <>
    Use this for one member at a time. Code contracts live in <DocCode>app/domain/game.ts</DocCode>;
    fixtures live in <DocCode>app/fixtures/members/</DocCode>; content lint catches authored prose
    rules.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "read-first",
    title: "Read First",
    body: (
      <DocList
        items={[
          <span key="fields">
            <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink> for
            schema, hidden tags, request tags, and ship-ready data rules.
          </span>,
          <span key="voice">
            <DocLink to="/docs/product/voice">Voice system</DocLink> for house tone;{" "}
            <DocLink to="/docs/product/voice-fingerprints">Member voice authoring</DocLink> for bio,
            voice, sample banks, output invariants, and dealbreakers;{" "}
            <DocLink to="/docs/product/voice-patterns">Voice patterns</DocLink> for the controlled
            pattern catalog;{" "}
            <DocLink to="/docs/product/voice-references">Voice source references</DocLink> for
            curated external reference corpora.
          </span>,
          <span key="runtime">
            <DocLink to="/docs/product/voice-prompts">Runtime voice surfaces</DocLink> for profile
            taglines, openers, Markdown, prompt packet shape, scenario event kinds, and model
            quirks.
          </span>,
          <span key="knowledge">
            <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink>,{" "}
            <DocLink to="/docs/gameplay/match-fit">Match fit</DocLink>, and{" "}
            <DocLink to="/docs/gameplay/roster-chemistry">Roster chemistry</DocLink>.
          </span>,
          <span key="visual">
            <DocLink to="/docs/product/character-heights">Character heights</DocLink>,{" "}
            <DocLink to="/docs/product/visual-design">Visual design</DocLink>, and{" "}
            <DocLink to="/docs/product/image-style">Image style</DocLink> for the visual handoff.
          </span>,
          <span key="existing">
            Existing member fixtures, existing member requests,{" "}
            <DocCode>app/services/member-roster-order.ts</DocCode>,{" "}
            <DocCode>app/components/member-aura-registry.ts</DocCode>, and existing{" "}
            <DocCode>chatBubble</DocCode> fixture blocks.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "design-pass",
    title: "Design Pass",
    body: (
      <DocSteps
        items={[
          "Define the member's durable roster role. A good member creates reusable pressure, not one destined match.",
          "Place the member in at least one warm cluster and one friction zone. If neither exists, reshape the premise.",
          "Run the four-anchor pass: four warm anchors, four friction anchors, one sentence of evidence each.",
          "Decide the reality frame: normal app user, non-human who treats themself as ordinary, displaced human, sanctioned trial, competitor, consort market, handler-routed case, or another explicit frame.",
          "Name the comedy engine before writing samples. If the v0 concept is broken, stop and choose the engine first.",
          "Keep anchor lists out of fixtures, prompts, scoring tables, and scenario fixtures. They are authoring notes only.",
        ]}
      />
    ),
  },
  {
    id: "fixture-pass",
    title: "Fixture Pass",
    body: (
      <>
        <P>
          Add or revise <DocCode>app/fixtures/members/&lt;member-id&gt;.ts</DocCode> with a{" "}
          <DocCode>Member</DocCode> object that satisfies <DocCode>memberSchema</DocCode>.
        </P>
        <DocList
          items={[
            <span key="identity">
              <Strong>Identity:</Strong> id, name, firstName, origin, species, dimension,
              realityStatus, and both height fields.
            </span>,
            <span key="prose">
              <Strong>Core prose:</Strong> bio, datingProfile, relationshipNeeds, preferences,
              dealbreakers, secrets.
            </span>,
            <span key="tags">
              <Strong>Tags:</Strong> 3 to 5 hidden tags, exactly one identity tag, all proved by
              prose.
            </span>,
            <span key="voice">
              <Strong>Voice:</Strong> compact register, comedyMechanics, outputConstraints, optional
              conversationShape and contrastExamples, patternsUsed, patternsRefused, tics,
              sampleMessages.
            </span>,
            <span key="state">
              <Strong>State:</Strong> mood, openness, burnout, retention, currentRequestId,
              recentDateResult, status.
            </span>,
            <span key="visual">
              <Strong>Visual:</Strong> keep <DocCode>visualDescription</DocCode> neutral and point
              portrait references at their conventional future paths. Use{" "}
              <DocCode>model: "pending"</DocCode> for assets whose approved files do not exist yet.
              Portrait asset approval can run later; baseline aura and chat presentation decisions
              belong with the fixture.
            </span>,
          ]}
        />
        <DocCallout variant="danger">
          Do not generate portraits, image prompts, cutouts, or visual canon during the content
          pass.
        </DocCallout>
      </>
    ),
  },
  {
    id: "voice-audit",
    title: "Voice Audit",
    body: (
      <DocSteps
        items={[
          "Check bio structure: personality foreground, hobby and reference palette background.",
          "Check sample banks for trait recital, route/venue/time/arrival credit, stage directions, move-narration, partner-labeling, and generic receipt filler.",
          "Check dealbreakers for tiers: structural-identity boundary vs lower friction.",
          "Author semantic equivalents for structural triggers that partners may wrap in different vocabulary.",
          "Use sample variance for high-pressure crashingOut triggers so one canonical line does not become the only answer.",
          "If the member uses a real-person, bit-compilation, or texting corpus, read the curated source notes and translate traits into spoken date dialogue before writing the fixture.",
        ]}
      />
    ),
  },
  {
    id: "live-tune-audit",
    title: "Live Tune Audit",
    body: (
      <>
        <P>
          Runtime voice must be verified against the AI character pipeline before lock or major
          re-lock.
        </P>
        <DocCodeBlock language="bash">{`vp run tune -- start <focus-id> --partner <warm-partner-id> --name <session-name> --focus-opens
vp run tune -- say "<partner line>" --session <session-name>`}</DocCodeBlock>
        <DocSteps
          items={[
            "Pick one warm pairing and one boundary-pressure pairing from the roster.",
            "Use a named session for every run. Pass the session name on every command after start.",
            "Surface a readable window: up to six focus-member turns plus the partner lines that prompted them.",
            "Read both speakers. Partner drift is still fixture evidence.",
            "Patch the smallest correct surface: fixture register, tic, sample bank, prompt scaffold, or content lint.",
            "Rerun focused checks after patches. A full re-lock is required only when the character engine changed.",
          ]}
        />
      </>
    ),
  },
  {
    id: "member-requests",
    title: "Member Requests",
    body: (
      <DocSteps
        items={[
          <span key="add">
            Add request entries in <DocCode>app/fixtures/goals/member-requests.ts</DocCode>.
          </span>,
          "Give the member enough request variety for shift rotation. Current roster pattern is usually four requests.",
          <span key="current">
            Set <DocCode>state.currentRequestId</DocCode> to one existing request id for the member.
          </span>,
          "Use controlled request tags. If a new tag is needed, update schema, deterministic handling when needed, docs, and tests in the same change.",
          "Keep request text operational. It states what the member wants Cupid to book, not hidden facts wholesale.",
        ]}
      />
    ),
  },
  {
    id: "presentation-hooks",
    title: "Presentation Hooks",
    body: (
      <DocList
        items={[
          <span key="index">
            Export the member through <DocCode>app/fixtures/members/index.ts</DocCode> and update
            schema array length if required.
          </span>,
          <span key="goals">
            Confirm member requests export through <DocCode>app/fixtures/goals/index.ts</DocCode>.
          </span>,
          <span key="order">
            Add the member to <DocCode>app/services/member-roster-order.ts</DocCode> only when the
            roster position is decided.
          </span>,
          <span key="aura">
            Add an aura entry in <DocCode>app/components/member-aura-registry.ts</DocCode> for every
            new member. This is a presentation hook from the member premise and does not wait for
            portrait approval.
          </span>,
          <span key="bubble">
            Add a <DocCode>chatBubble</DocCode> block on the fixture for non-human or otherwise
            distinctive members. Ordinary humans may intentionally use the house default; make that
            decision by comparing nearby fixtures and{" "}
            <DocLink to="/docs/product/visual-design#per-member-chat-bubbles">
              Per-member chat bubbles
            </DocLink>
            .
          </span>,
          <span key="chemistry">
            Update <DocLink to="/docs/gameplay/roster-chemistry">Roster chemistry</DocLink> with
            durable warm and friction pressures.
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
        <P>Run Vite Plus checks before shipping:</P>
        <DocCodeBlock language="bash">{`vp check
vp test
vp build`}</DocCodeBlock>
        <P>
          Member fixture validation is allowed to pass before approved portrait files exist. Keep
          the conventional paths in the fixture and mark missing assets{" "}
          <DocCode>model: "pending"</DocCode>; runtime surfaces fall back to a ready neutral
          portrait when available and otherwise leave the image slot empty.
        </P>
      </>
    ),
  },
];

export default function AddMemberDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
