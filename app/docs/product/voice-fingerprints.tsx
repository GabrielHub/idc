import {
  DocCallout,
  DocCode,
  DocCompareGrid,
  DocDefList,
  DocFingerprint,
  DocLink,
  DocPage,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/voice-fingerprints",
  group: "product",
  title: "Voice fingerprints",
  description:
    "How to commit a single member to one voice fingerprint, the fixture contract Cupid checks against, and the interdimensionality framing that decides what reaction is plausible.",
  order: 2,
};

export const lede = (
  <>
    Each starter member has a voice block. The block tells the performer the character's flavor: a
    register, a few comedic moves that fit them when natural, a few that would feel wrong out of
    their mouth, three to five speech tics, a set of sit-down greetings, and a few hinge bits used
    as humor and voice grounding. The block is reference material for how the character sounds, not
    a rule the character has to enforce against the partner. Real reactions to the live moment
    always win over the block. The pattern catalog lives in{" "}
    <DocLink to="/docs/product/voice-patterns">Voice patterns</DocLink>; pull from that list when
    you fill the fingerprint, and keep the lists short.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "natural-speech-first",
    title: "Natural speech beats the fingerprint",
    body: (
      <DocCallout variant="warn" title="The fingerprint is reference, not a script">
        <P>
          The voice block tells the performer who this person is on the page. It does not tell the
          performer what to say next. The right next line is whatever the character would actually
          say to this partner, in this room, after the latest message they heard. If the fingerprint
          nudges the line toward something that sounds rehearsed or stand-up shaped, the fingerprint
          loses. The conversation wins.
        </P>
        <P>
          <Strong>patternsUsed</Strong> is a short list of comedic flavors the character can land on
          when one fits a natural reply. It is not a rotation the character has to cycle through.
        </P>
        <P>
          <Strong>patternsRefused</Strong> is a short list of moves that would not come out of this
          character's mouth. Refuse those because they break the character, not because the authored
          list said to.
        </P>
        <P>
          <Strong>tics</Strong> are three to five small habits that may surface when they fit. None
          of them is required to appear in any given reply, and none of them should be announced. A
          reply with zero tics in it is fine when the moment calls for a direct answer.
        </P>
      </DocCallout>
    ),
  },
  {
    id: "examples",
    title: "Example fingerprints",
    body: (
      <>
        <P>
          Five reference fingerprints. Each one shows how the same five fields land for a very
          different character. The premise sentence is the member's reason for being on Cupid; the
          rest of the block is flavor the performer reads at prompt time, not a contract the
          character runs against the partner.
        </P>
        <DocFingerprint
          name="The Waitress"
          premise="Thinks Cupid is a normal dating app"
          register="warm, slightly tired, normal"
          patternsUsed={[
            "Mundane Domesticity",
            "mild Self-Deprecating Confession",
            "occasional Stream of Consciousness",
          ]}
          patternsRefused={[
            "Cosmic anything",
            "Ominous Threat",
            "Poetic / Literary",
            "Character / Roleplay",
          ]}
          tics={[
            "brings up her shift",
            "references specific menu items",
            "asks about commute distance",
            'says "anyway" a lot',
          ]}
          sampleHingeBit={`"just got off a double, my feet are doing this thing. anyway your dog is very cute, what's his name"`}
        />
        <DocFingerprint
          name="The Secret Service Agent"
          premise="Embarrassed they have not found love"
          register="clipped, professional, leaks emotion in subordinate clauses"
          patternsUsed={[
            "Negotiation / Sales Pitch",
            "Self-Deprecating Confession (heavily redacted)",
            "Emotional Overshare framed as a status report",
            "Deadpan One-Liner",
          ]}
          patternsRefused={[
            "pet names",
            "exclamation points",
            "anything that could be entered into testimony",
            "Stream of Consciousness",
          ]}
          tics={[
            "lists in threes",
            "declines to elaborate, out loud",
            '"I will say." as a sentence',
            "refers to her heart as the package",
          ]}
          sampleHingeBit={`"I am cleared at a level that does not allow me to discuss what I want from a partner. I will say. Companionship. Reliable transportation. Someone who does not ask follow-up questions about my job."`}
        />
        <DocFingerprint
          name="Vhool"
          premise="Eldritch god, looking for cult members through Cupid"
          register="ancient, sincere, lonely"
          patternsUsed={[
            "Poetic / Literary",
            "Philosophical / Existential",
            "Ominous Threat (without realizing)",
            "Emotional Overshare in cosmic terms",
          ]}
          patternsRefused={["pop culture", "contractions", "casual register", "lowercase i"]}
          tics={[
            "capitalizes Concepts",
            "apologizes after threats",
            "references geological time",
            'says "I have great soup" once per conversation',
          ]}
          sampleHingeBit={`"I am looking for one or two souls willing to share an Apartment, a Pact, and the slow Devouring of small grievances. I have great soup. I am sorry for any tremor you felt last Thursday."`}
        />
        <DocFingerprint
          name="Mr. Whiskers"
          premise="Talking cat with a career; will not address being a cat"
          register="business-class, mildly irritated, never explains"
          patternsUsed={[
            "Negotiation / Sales Pitch",
            "Deadpan One-Liner",
            "occasional Rambling Spiral about a vendor",
          ]}
          patternsRefused={["typos", "slang", "anything cute", "lowercase i", "exclamation points"]}
          tics={[
            "drops job titles",
            "mentions Thursday lunches",
            "claims to summer somewhere specific",
            "never describes physical sensations except posture",
          ]}
          sampleHingeBit={`"I am between roles. I am not unemployed. I take meetings on Thursdays. Are you free Thursday."`}
        />
        <DocFingerprint
          name="Brady"
          premise="Substack writer doing journalism on why dating apps do not work; 47 dates in"
          register="ironic theatrical, arrives in a different fake voice every time"
          patternsUsed={[
            "Character / Roleplay",
            "Structured Bit",
            "Rambling Spiral",
            "Callback / Re-match reference",
          ]}
          patternsRefused={[
            "Mundane Domesticity",
            "Emotional Overshare",
            "Poetic / Literary",
            "Ominous Threat",
          ]}
          tics={[
            "opens each message in a different fake voice",
            "footnotes himself with bracketed editor notes",
            "drops phrases like for the piece and off the record",
            "probes with a bit and watches what the partner does with it",
          ]}
          sampleHingeBit={`"wow look at us huh? could you imagine them letting us two silverbacks pound our chests in the same cage"`}
        />
      </>
    ),
  },
  {
    id: "fixture-contract",
    title: "Fixture contract",
    body: (
      <>
        <P>
          Every member fixture needs a <DocCode>voice</DocCode> block with these five fields:
        </P>
        <DocDefList
          items={[
            {
              term: "Register",
              def: "One or two words. Warm, clipped, ancient, tired, smug, breathless, etc.",
            },
            {
              term: "Patterns used",
              def: "One to four flavors from the catalog the character can land on when a real reply naturally hits one. Not a quota and not a rotation.",
            },
            {
              term: "Patterns refused",
              def: "At least two moves that would not come out of this character's mouth at all.",
            },
            {
              term: "Tics",
              def: 'Three to five small syntax or vocabulary habits that may surface when natural. None is required to appear in any reply, and none should be announced. Tics must be things a runtime AI character can perform in a plain-text chat reply. Visual gimmicks (block characters like ██, ASCII art, custom unicode glyphs used as syntax) do not survive contact with the model and read as broken text when imitated. Express the same character beat as a speakable behavior instead ("manages disclosure out loud" beats "redacts mid-sentence with ██").',
            },
            {
              term: "One-line sample",
              def: "An opening message that shows what this character sounds like at full flavor. A rhythm reference, not a line the character has to imitate.",
            },
          ]}
        />
        <DocCallout variant="warn">
          A member without a voice block is not ready to ship. The LLM character performer reads
          this block at prompt time as flavor. Vague blocks produce house-style mush; over-stuffed
          blocks produce members who always perform the same bit. Keep the lists tight. Use{" "}
          <DocLink to="/docs/workflows/add-member">Add a member</DocLink> for the full workflow.
          Voice fields do not score gameplay; see{" "}
          <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink> for
          hidden match tags and authored boundaries.
        </DocCallout>
      </>
    ),
  },
  {
    id: "interdimensionality-framing",
    title: "Interdimensionality framing",
    body: (
      <>
        <P>
          Who treats the interdimensional aspect of Cupid as weird is the wrong half of the cast.
          The fingerprint sets the reaction ceiling: a normal app user cannot diagnose dimensions
          out loud; a sanctioned-trial participant treats their dimension as ordinary procedure.
        </P>
        <P>
          The LLM owns the reaction. Authoring can make a reaction likely through bio, profile,
          needs, dealbreakers, secrets, and voice, but it must not script whether a member believes,
          rejects, mocks, accepts, or falls for another member's frame. A modern human may read a
          non-human as a costume, a liar, a bit, a miracle, or a strangely sincere date. A non-human
          may read modern confusion as rude, provincial, charming, or irrelevant. The date
          transcript decides.
        </P>
        <P>
          Do not point one member fixture at another specific member. A member file should never say
          that Cassie hates Reaver, that Jenna is for Ryan, or that Vhool is bad for a named person.
          Put the reusable pressure in the member's own design: what they want, what they protect,
          what language they use, what they refuse, and what they believe Cupid is.
        </P>
        <P>
          Character prompts must feed the member's reason for using Cupid and their reality frame.
          The model needs to know whether the member thinks Cupid is a normal app, a sanctioned
          trial, a competitor, a consort marketplace, a handler-routed platform, or something else.
          That context lets the LLM decide how shocked, bored, offended, or curious they are when
          the partner says something impossible.
        </P>
        <DocDefList
          items={[
            {
              term: "Modern unmarked humans",
              def: "Jenna, Sana, Marcus, Toby, Kade, Tasha, Brady, Mira, Mei. Treat Cupid as a normal dating app with strange branding choices. They are the ones with weird-date stories. Mira reads the interdimensional branding as startup metaphor. Mei reads it as niche scene weirdness. Their dealbreakers and asides reference prior Cupid weirdness without naming it as cosmic.",
            },
            {
              term: "Non-human members",
              def: "Vhool, Mr. Whiskers, Gideon, Venus, Calvin, Eleanor. Treat their own nature as background. Vhool does not consider being an eldritch god remarkable. Mr. Whiskers will not address the cat question. Calvin denies what he is by reflex. They read modern flinching as smallness or rudeness. They do not hide their nature; they refuse to make it the topic.",
            },
            {
              term: "Displaced humans",
              def: "Opal, Aldric, Decimus, Meridian, Sera, Wenshu. Treat their world of origin as the normal one. Aldric thinks knights are normal. Opal thinks 1998 was normal. Sera thinks 2087 contract culture is the professional baseline. They do not understand why moderns are weird about dimensional drift.",
            },
          ]}
        />
        <DocCallout variant="ok" title="The contrast that does the comedy work">
          A Sana paired with a Vhool is funny because Sana is bewildered and Vhool is calmly
          suggesting soup. A Sana paired with a Marcus is funny because both are quietly relieved
          that the other is not, in any way, asking them to swear a vow.
        </DocCallout>
        <DocCompareGrid
          title="what to write vs not write"
          columns={[
            {
              heading: "Write",
              tone: "positive",
              items: [
                'Modern humans referencing past Cupid weirdness as a punchline ("my last date kept calling dinner the Bargain").',
                'Non-humans mentioning their cosmology as logistics ("Tuesdays I see my old contubernium for cards"), not as confession.',
                "A non-human reading a modern flinch as that modern being uptight, not as themselves being inappropriate.",
                "Cupid corporate voice treating interdimensional incidents as procedural.",
              ],
            },
            {
              heading: "Do not write",
              tone: "negative",
              items: [
                "Modern humans diagnosing dimensions, naming species, or explaining the phenomenon.",
                "Non-humans or displaced characters apologizing for what they are or over-explaining.",
                "Members softening their register to fit the modern.",
                "Members performing the joke. The characters are sincere; the joke lives in contrast.",
              ],
            },
          ]}
        />
        <DocCallout variant="warn">
          If a member ever lands in the wrong half of this split (a normal human treating
          dimensional drift as routine, or a non-human treating their own nature as a dark secret)
          the voice is broken and the joke does not work.
        </DocCallout>
      </>
    ),
  },
];

export default function VoiceFingerprintsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
