import {
  DocCallout,
  DocCode,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "gameplay/member-fields-and-tags",
  group: "gameplay",
  title: "Member fields and tags",
  description:
    "Authored fields on a Member fixture, the hidden tag taxonomy, member request tags, and the ship-ready contract for new members.",
  order: 0,
};

export const lede = (
  <>
    Gameplay tags are hidden planning signals used by Cupid systems to shape prompts, risk notes,
    and bounded state changes. They are not UI copy, not relationship truth, and should not be shown
    to the player. This doc owns the authored data shape on a member.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "member-fields",
    title: "Member fields",
    body: (
      <>
        <P>Use member fields this way:</P>
        <DocDefList
          items={[
            {
              term: "datingProfile",
              def: (
                <>
                  Authored profile copy. The first sentence is the public roster tagline at intake.
                  It must read like the member speaking about themself in one short sentence,
                  carrying voice, personality, and a concrete hook. Later sentences are revealed
                  only through player knowledge.
                </>
              ),
            },
            {
              term: "relationshipNeeds",
              def: "Authored reasons a member might want a specific kind of date. These are not shown in full at intake.",
            },
            {
              term: "preferences",
              def: "Authored soft clues for good rooms, partners, and pacing. These are not shown in full at intake.",
            },
            {
              term: "dealbreakers",
              def: "Authored boundaries a member watches for. These are not shown in full at intake.",
            },
            { term: "tags", def: "Hidden deterministic gameplay inputs." },
            {
              term: "voice",
              def: "Flavor reference for the runtime AI: register, tics, a few sample lines, and short lists of comedic moves that fit or break the character. The performer reads it to know who this person sounds like, then answers the live conversation naturally. Voice is not a script the character has to enforce against the partner.",
            },
          ]}
        />
        <DocCallout variant="danger">
          Do not add new member fixture fields unless gameplay or UI reads them. Do not reintroduce{" "}
          <DocCode>traits</DocCode> or <DocCode>redFlags</DocCode>. <DocCode>traits</DocCode> were
          vague public labels. <DocCode>redFlags</DocCode> mixed member behavior with things members
          reject.
        </DocCallout>
        <DocCallout variant="warn" title="Internal context fields">
          <DocCode>species</DocCode>, <DocCode>origin</DocCode>, <DocCode>dimension</DocCode>,{" "}
          <DocCode>realityStatus</DocCode>, and <DocCode>bio</DocCode> are authoring, prompt,
          fixture, and asset context. They are not player-facing case file fields. Use public
          profile copy and filed reads for player surfaces.
        </DocCallout>
      </>
    ),
  },
  {
    id: "hidden-tags",
    title: "Hidden tags",
    body: (
      <>
        <P>Every member needs 3 to 5 hidden tags and exactly one identity tag:</P>
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
        <DocCallout variant="info" title="acquisitive">
          The <DocCode>acquisitive</DocCode> tag marks members who run relationships as recruitment
          funnels into a larger structure they already control. Their pitch is incorporation, not
          partnership, and their vocabulary treats a counterpart as something to be added to a
          manifest, a Pact, a fleet, or a household. Authored copy must show the recruiter cadence
          (Pact talk, manifest talk, equity talk, claim talk) for the tag to be earned. Do not stack{" "}
          <DocCode>acquisitive</DocCode> with <DocCode>sincerity_seeking</DocCode> casually; if both
          are present, the contradiction is the character (Vhool wants kindred sincerely and is also
          recruiting for the Lower Choir).
        </DocCallout>
        <DocCallout variant="warn">
          Hidden tags must be supported by authored copy. If a member has{" "}
          <DocCode>prophecy_averse</DocCode>, their profile, ask, preferences, or dealbreakers
          should make prophecy pressure legible to services and eventual filed reads without naming
          the tag.
        </DocCallout>
      </>
    ),
  },
  {
    id: "hidden-member-retention",
    title: "Hidden member retention",
    body: (
      <P>
        Member <DocCode>retention</DocCode> is an internal quit-risk score used by deterministic
        services. It must not be exposed in player-facing UI as HP, health, or an exact meter. The
        broader player-facing policy for Mood, Openness, Burnout, and retention is still unsettled,
        so case files should not show exact values. Player surfaces may show closed-file state or
        qualitative risk copy when needed, while services keep the numeric value for consequences.
        See <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink> for the full
        visibility tier.
      </P>
    ),
  },
  {
    id: "member-request-tags",
    title: "Member request tags",
    body: (
      <>
        <P>
          Member requests use a controlled tag taxonomy that is separate from hidden member tags.
          These tags express deterministic asks for fit scoring. They are not UI copy.
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
                  <DocCode>career_fatigue</DocCode>.
                </>
              ),
            },
            {
              term: "Partner values",
              def: (
                <>
                  <DocCode>sincerity</DocCode>, <DocCode>career</DocCode>,{" "}
                  <DocCode>respect</DocCode>, <DocCode>decisiveness</DocCode>,{" "}
                  <DocCode>care</DocCode>.
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
          Avoid one-off request tags. If a new request tag is needed, add it to{" "}
          <DocCode>memberRequestTagSchema</DocCode>, update deterministic fit handling when it
          should affect scoring, and add coverage in the same change.
        </DocCallout>
      </>
    ),
  },
  {
    id: "member-authoring-requirements",
    title: "Member authoring requirements",
    body: (
      <>
        <P>New members must fit this product contract before they ship:</P>
        <DocList
          items={[
            "The member has a durable roster role with at least two natural warm pressures and two natural friction pressures against the existing cast.",
            "The authored prose proves every hidden tag. A tag cannot exist only to force a named pair outcome.",
            <span key="id">
              Exactly one identity tag is present: <DocCode>ordinary_human</DocCode> or{" "}
              <DocCode>non_human</DocCode>.
            </span>,
            "Voice, gameplay tags, and player knowledge stay separate. Voice gives the LLM flavor for how the character naturally sounds; the character still has to answer the live conversation. Tags tell services how to score pressure. Filed reads tell the player what Cupid has earned.",
            <span key="chem">
              Chemistry anchors stay in{" "}
              <DocLink to="/docs/gameplay/roster-chemistry">Roster chemistry</DocLink> as a human
              authoring map. They do not go into member fixtures, scenario fixtures, prompts, or
              runtime scoring tables.
            </span>,
          ]}
        />
        <P>
          Use the procedural checklist in{" "}
          <DocLink to="/docs/workflows/add-member">Add a member</DocLink> when adding or revising a
          member. <Strong>Voice</Strong> rules live in{" "}
          <DocLink to="/docs/product/voice">Voice and tone</DocLink>.
        </P>
      </>
    ),
  },
];

export default function MemberFieldsAndTagsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
