import {
  DocCallout,
  DocCode,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  P,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "gameplay/member-fields-and-tags",
  group: "gameplay",
  title: "Member fields and tags",
  description:
    "The data contract for Member fixtures: authored fields, hidden tags, request tags, player-knowledge boundaries, and ship-ready content requirements.",
  order: 0,
};

export const lede = (
  <>
    This doc owns member fixture data. Voice authoring rules live in{" "}
    <DocLink to="/docs/product/voice-fingerprints">Member voice authoring</DocLink>. Runtime
    surfaces live in <DocLink to="/docs/product/voice-prompts">Runtime voice surfaces</DocLink>.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "member-fields",
    title: "Member Fields",
    body: (
      <>
        <P>Use the fields this way:</P>
        <DocDefList
          items={[
            {
              term: "identity fields",
              def: (
                <>
                  <DocCode>id</DocCode>, <DocCode>name</DocCode>, <DocCode>firstName</DocCode>,{" "}
                  <DocCode>origin</DocCode>, <DocCode>species</DocCode>,{" "}
                  <DocCode>dimension</DocCode>, and <DocCode>realityStatus</DocCode> establish
                  authoring and prompt context. They are not player-facing case-file fields by
                  default.
                </>
              ),
            },
            {
              term: "bio",
              def: (
                <>
                  Largest prompt-time character context. It should foreground personality and
                  background palette. The full contract lives in{" "}
                  <DocLink to="/docs/product/voice-fingerprints#character-content-architecture">
                    Member voice authoring
                  </DocLink>
                  .
                </>
              ),
            },
            {
              term: "datingProfile",
              def: (
                <>
                  Public profile copy. The first sentence becomes the roster tagline. It must be an
                  in-character hook, not a census row. Cupid owns match, route, venue, and time;
                  profile copy may state preferences but must not assign those logistics to either
                  dater.
                </>
              ),
            },
            {
              term: "relationshipNeeds / preferences / dealbreakers",
              def: "Hidden authored pressure surfaces. They feed fit, risk, player-safe reads, and prompts. They are not shown wholesale at intake.",
            },
            {
              term: "secrets",
              def: "Private background, not free disclosure material. Secrets may surface only when the transcript earns them or a system intentionally exposes player-safe copy.",
            },
            {
              term: "tags",
              def: "Hidden deterministic gameplay inputs. Tags must be proved by authored prose.",
            },
            {
              term: "voice",
              def: (
                <>
                  Flavor reference for the runtime AI. The schema shape lives here; the authoring
                  rules live in{" "}
                  <DocLink to="/docs/product/voice-fingerprints#fixture-contract">
                    Member voice authoring
                  </DocLink>
                  .
                </>
              ),
            },
          ]}
        />
        <DocCallout variant="danger">
          Do not add new fixture fields unless gameplay or UI reads them. Do not reintroduce{" "}
          <DocCode>traits</DocCode> or <DocCode>redFlags</DocCode>.
        </DocCallout>
      </>
    ),
  },
  {
    id: "content-boundaries",
    title: "Content Boundaries",
    body: (
      <DocList
        items={[
          "Voice, gameplay tags, and player knowledge stay separate. Voice tells the performer how the member sounds; tags tell systems how to score; filed reads tell the player what Cupid has earned.",
          "Do not point one member fixture at another named member as a required match, enemy, or failure.",
          "Do not invent image-specific visual canon before a portrait exists. Runtime visual descriptions come from approved neutral portrait art; aura and chat bubble presentation can be authored from the member premise.",
          "A member may state ordinary preferences or schedule limits, but Cupid owns date logistics.",
          "Hidden fields can hint through public profile copy only when the hint is player-safe and character-coherent.",
          "Every authored field should support reusable roster pressure, not a single destined pair.",
        ]}
      />
    ),
  },
  {
    id: "hidden-tags",
    title: "Hidden Tags",
    body: (
      <>
        <P>Every member needs 3 to 5 hidden tags and exactly one identity tag.</P>
        <DocDefList
          items={[
            {
              term: "Identity",
              def: (
                <>
                  <DocCode>ordinary_human</DocCode>, <DocCode>non_human</DocCode>.
                </>
              ),
            },
            {
              term: "Needs and sensitivities",
              def: (
                <>
                  <DocCode>prophecy_averse</DocCode>, <DocCode>privacy_sensitive</DocCode>,{" "}
                  <DocCode>grief_sensitive</DocCode>, <DocCode>memory_sensitive</DocCode>,{" "}
                  <DocCode>status_sensitive</DocCode>, <DocCode>needs_low_pressure</DocCode>,{" "}
                  <DocCode>needs_clear_plan</DocCode>, <DocCode>sincerity_seeking</DocCode>.
                </>
              ),
            },
            {
              term: "Behaviors and pressure sources",
              def: (
                <>
                  <DocCode>performative</DocCode>, <DocCode>attention_seeking</DocCode>,{" "}
                  <DocCode>avoidant</DocCode>, <DocCode>competitive</DocCode>,{" "}
                  <DocCode>ceremony_minded</DocCode>, <DocCode>career_focused</DocCode>,{" "}
                  <DocCode>weirdness_native</DocCode>, <DocCode>reality_displaced</DocCode>,{" "}
                  <DocCode>anxious_spiral</DocCode>, <DocCode>acquisitive</DocCode>.
                </>
              ),
            },
          ]}
        />
        <DocCallout variant="warn">
          A tag is not a wish. If authored prose does not prove it, rewrite the prose or remove the
          tag.
        </DocCallout>
      </>
    ),
  },
  {
    id: "member-request-tags",
    title: "Member Request Tags",
    body: (
      <>
        <P>
          Member requests use a separate controlled taxonomy for deterministic fit. These tags are
          not UI copy.
        </P>
        <DocDefList
          items={[
            {
              term: "Date shape",
              def: (
                <>
                  <DocCode>normal_date</DocCode>, <DocCode>quiet_date</DocCode>,{" "}
                  <DocCode>low_pressure</DocCode>, <DocCode>structure</DocCode>,{" "}
                  <DocCode>grounded</DocCode>, <DocCode>choice</DocCode>.
                </>
              ),
            },
            {
              term: "Boundary and pressure asks",
              def: (
                <>
                  <DocCode>prophecy_averse</DocCode>, <DocCode>privacy</DocCode>,{" "}
                  <DocCode>discretion</DocCode>, <DocCode>name_discretion</DocCode>,{" "}
                  <DocCode>career_fatigue</DocCode>, <DocCode>anti_deference</DocCode>,{" "}
                  <DocCode>anti_fraud</DocCode>.
                </>
              ),
            },
            {
              term: "Partner values",
              def: (
                <>
                  <DocCode>sincerity</DocCode>, <DocCode>career</DocCode>,{" "}
                  <DocCode>respect</DocCode>, <DocCode>decisiveness</DocCode>,{" "}
                  <DocCode>care</DocCode>, <DocCode>challenge</DocCode>.
                </>
              ),
            },
            {
              term: "Content flavor",
              def: (
                <>
                  <DocCode>cosmic</DocCode>, <DocCode>memory</DocCode>,{" "}
                  <DocCode>online_creator</DocCode>, <DocCode>performative</DocCode>,{" "}
                  <DocCode>career_intense</DocCode>, <DocCode>deity</DocCode>,{" "}
                  <DocCode>advice_giver</DocCode>, <DocCode>cryptid</DocCode>,{" "}
                  <DocCode>saboteur</DocCode>, <DocCode>anxious_rambler</DocCode>,{" "}
                  <DocCode>midlife</DocCode>, <DocCode>tech_illiterate</DocCode>,{" "}
                  <DocCode>fae</DocCode>, <DocCode>widower</DocCode>.
                </>
              ),
            },
          ]}
        />
        <DocCallout variant="warn">
          Avoid one-off request tags. If a new request tag is needed, update the schema,
          deterministic fit handling when needed, docs, and tests in the same change.
        </DocCallout>
      </>
    ),
  },
  {
    id: "state-and-visibility",
    title: "State And Visibility",
    body: (
      <>
        <P>
          Member <DocCode>mood</DocCode>, <DocCode>openness</DocCode>, <DocCode>burnout</DocCode>,
          and <DocCode>retention</DocCode> are internal state. They drive deterministic consequences
          and prompt context; they are not exact player-facing meters.
        </P>
        <P>
          Player-safe knowledge rules live in{" "}
          <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink>. Case files may
          show filed reads, qualitative risk, or closure state when earned.
        </P>
      </>
    ),
  },
  {
    id: "ship-ready-contract",
    title: "Ship-Ready Contract",
    body: (
      <>
        <P>New or heavily revised members must satisfy this before they ship:</P>
        <DocList
          items={[
            "Durable roster role with multiple warm and friction pressures against the existing cast.",
            "All hidden tags are proved by prose.",
            "Exactly one identity tag is present.",
            "Voice block is complete and obeys member voice authoring rules.",
            "Dating profile first sentence works as a public tagline.",
            "Member requests exist and currentRequestId points at one of them.",
            "Portrait references use conventional paths and missing approved files are marked pending.",
            "Every member has an aura registry entry, and non-human or distinctive members declare a chatBubble unless the house default is intentional.",
            <span key="workflow">
              The procedural checklist lives in{" "}
              <DocLink to="/docs/workflows/add-member">Add a member</DocLink>.
            </span>,
          ]}
        />
      </>
    ),
  },
];

export default function MemberFieldsAndTagsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
