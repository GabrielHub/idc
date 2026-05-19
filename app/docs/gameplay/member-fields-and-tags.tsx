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
                  only through a filed <DocCode>profile</DocCode> read. Profile copy must honor the
                  Cupid blind date setup: the dating manager pairs the members, and Cupid picks the
                  venue and time. A member may state venue preferences, schedule limits, or arrival
                  behavior, but must not claim that either dater chose the place or hour.
                </>
              ),
            },
            {
              term: "relationshipNeeds",
              def: (
                <>
                  Authored reasons a member might want a specific kind of date. These are not shown
                  in full at intake. Player-safe <DocCode>ask</DocCode> reads are filed when a focus
                  request or transcript evidence makes the need visible.
                </>
              ),
            },
            {
              term: "preferences",
              def: (
                <>
                  Authored soft clues for good rooms, partners, and pacing. These are not shown in
                  full at intake. Player-safe <DocCode>comfort</DocCode> reads are filed when a
                  comfort beat or transcript evidence makes the preference visible.
                </>
              ),
            },
            {
              term: "dealbreakers",
              def: (
                <>
                  Authored boundaries a member watches for. These are not shown in full at intake.
                  Player-safe <DocCode>boundary</DocCode> reads are filed when risk or transcript
                  evidence makes the boundary visible.
                </>
              ),
            },
            { term: "tags", def: "Hidden deterministic gameplay inputs." },
            {
              term: "voice",
              def: "Flavor reference for the runtime AI: register, tics, sample buckets, and short lists of comedic moves that fit or break the character. The performer reads it to know who this person sounds like, then answers the live conversation naturally. Voice is not a script the character has to enforce against the partner.",
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
          Avoid one-off request tags. If a new request tag is needed, add it to{" "}
          <DocCode>memberRequestTagSchema</DocCode>, update deterministic fit handling when it
          should affect scoring, and add coverage in the same change.
        </DocCallout>
      </>
    ),
  },
  {
    id: "bio-authoring-contract",
    title: "Bio authoring contract: personality foreground, hobby background",
    body: (
      <>
        <P>
          A member's <DocCode>bio</DocCode> is the largest piece of voice-shaping context the
          runtime AI reads at prompt time. Two failure modes recur if the bio is not authored to a
          contract: (1) single-point-of-interest fixation where one hobby (a band, a team, a job, a
          city) absorbs the whole character and every reply routes back through it, and (2)
          directive-as-personality where bio text reads to the model as "the character must discuss
          X" rather than "the character is Y." Both produce characters that feel scripted in
          transcripts.
        </P>
        <P>The contract that addresses both failure modes:</P>
        <DocDefList
          items={[
            {
              term: "Foreground: personality state claims",
              def: 'Lead the bio with claims that describe who the member IS at the table. Debater-first-listener-second. Loud-by-default-without-noticing-until-pointed-out-twice. Here-for-the-one-not-here-to-stretch-a-date. Mortifies-easily-recovers-quickly. Treats-strangers-as-tomorrow\'s-anecdote. These are facts about the character, not topics the character will raise. They are written as second-person assertions ("you are," "you do," "your default is") and they describe energy, posture, defenses, and operating-frame, not interests.',
            },
            {
              term: "Background: palette",
              def: "After the personality is established, the bio backgrounds palette the LLM can freestyle off of without those topics owning the character. Hobbies (Kanye discography ranking, the 2014 Lakers, 2K league with college friends, Korean cooking badly, AF1 in dead colorways). Environments (the apartment with a TV bigger than the couch, the booth at the brass cat, the kitchen mom would weep over). Reference catalogs (Ringer columns, Bill Simmons commute, Coens-Soderbergh-PTA solo theater days). Specific small artifacts (the middle school AAU jersey folded in a drawer, the in-n-out animal-style burger he brings up more than he should). The model will reach into this palette when a partner gives it room; the character will not BE the palette.",
            },
            {
              term: "Sample banks: embody, do not recite",
              def: 'Sample messages teach the model the pattern. A bank that recites trait labels ("im picky, im loud, im here for the one, ill call an early read at the half" stacked as introductory disclosure) teaches the model to recite trait labels at scale. A bank that embodies personality through action, energy, takes, and substance teaches the model to embody. Filing-trade voices (audit, deposition, brand relay, on-the-record) and brand-performing voices are the canonical exception because their characters are canonically performing; everyone else cuts self-announcement.',
            },
          ]}
        />
        <P>
          Cross-provider prompt-engineering guidance supports this contract directly. State-claim
          framing for character behavior is the dominant recommendation. Anthropic: "Setting a role
          in the system prompt focuses Claude's behavior and tone for your use case. Even a single
          sentence makes a difference." Google Gemini and Moonshot Kimi both recommend persona /
          role framing as the primary lever. OpenAI is explicit on outcome-over-process for
          character behavior: "Persona: &lt;one sentence&gt;" anchors behavior, and "Add detail only
          where it changes behavior" guards against over-direction. Few-shot examples (sample banks)
          carry the same weight as instructions: Anthropic warns to "vary enough that Claude doesn't
          pick up unintended patterns," and Gemini notes "the model attempts to identify patterns
          and relationships from the examples and applies them when generating a response." Recital
          patterns in the bank are unintended patterns the model picks up.
        </P>
        <DocCallout variant="info" title="Test the contract in transcripts">
          <P>
            The visible failure mode is: open a tune session, count how many turns route through a
            single hobby or topic; count how many sample-bank phrases the character utters near-
            verbatim in the first three turns. Single-point-of-interest fixation shows as topic-mass
            concentration. Self-announcement shows as bank-recital frequency. The fix is in the bio
            (move trait claims to foreground, hobbies to background palette) and in the sample bank
            (rewrite recital entries to embody through action). See the Alex Yoon entries in the
            voice-tuning-pass roadmap decisions log for the precedent.
          </P>
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
