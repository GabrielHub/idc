import {
  DocCallout,
  DocCode,
  DocCompareGrid,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  P,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/voice-fingerprints",
  group: "product",
  title: "Member voice authoring",
  description:
    "How to write member bios, voice fingerprints, sample banks, spoken-dialogue rules, output invariants, dealbreaker fire-shapes, and reality frames.",
  order: 2,
};

export const lede = (
  <>
    This doc owns member-facing authored voice. Use it when creating or revising{" "}
    <DocCode>bio</DocCode>, <DocCode>datingProfile</DocCode>, <DocCode>voice</DocCode>, sample
    banks, and dealbreakers. The runtime prompt rules live in{" "}
    <DocLink to="/docs/product/voice-prompts">Runtime voice surfaces</DocLink>; hidden gameplay tags
    live in <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink>.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "character-content-architecture",
    title: "Character Content",
    body: (
      <>
        <P>
          A member fixture needs a character, not a pile of interests. The model reads the whole
          fixture and turns the strongest pattern into behavior, so organize prose by what should
          control the date.
        </P>
        <DocDefList
          items={[
            {
              term: "Foreground personality",
              def: "Lead with who the member is at the table: defenses, pace, attachment style, operating frame, how they receive pressure, and what they protect. These are state claims, not topics.",
            },
            {
              term: "Background palette",
              def: "Hobbies, jobs, places, teams, media taste, and artifacts are material the model can reach for when invited. They must not become the member's only subject.",
            },
            {
              term: "Comedy engine",
              def: "Name the behavior that makes the character funny. A good engine is performable across many topics: bad journalist, deposition dad, hollow CEO confidence, rambling spiral, operational specificity over drama.",
            },
            {
              term: "Bio specificity",
              def: "Specific concrete facts feed the engine. A folded newspaper, a Q1 trade loss, a named sister, a bad install, or an old jersey gives the model usable texture. Generic adjectives do not.",
            },
            {
              term: "Source-character texture",
              def: "If a source character helps, translate the mechanism into behavior. Write 'mock-grand pushback followed by a real case' instead of relying on a name the model may flatten or misread.",
            },
          ]}
        />
        <DocCallout variant="warn" title="Sample banks embody, they do not recite">
          A bank that says "im loud, im picky, im here for the one" teaches trait recital. A bank
          that has the member make a loud take, call an early read, or refuse to stretch a flat date
          teaches behavior. Filing, audit, deposition, and brand-performing voices are the exception
          only when performance is the character's authored engine.
        </DocCallout>
      </>
    ),
  },
  {
    id: "fixture-contract",
    title: "Voice Fixture Contract",
    body: (
      <>
        <P>
          Every member ships a <DocCode>voice</DocCode> block. Keep it tight enough to perform and
          specific enough to resist house style.
        </P>
        <DocDefList
          items={[
            {
              term: "register",
              def: "A compact paragraph that names the member's table sound and primary engine. Keep detailed mechanics, constraints, and examples in their structured fields.",
            },
            {
              term: "comedyMechanics",
              def: "Named performable behavior rules and pressure shapes. This is where cadence engines, recurring bits, fire-shapes, and canon-specific behavior live after migration out of register.",
            },
            {
              term: "outputConstraints",
              def: "Member-specific spoken-surface constraints that belong next to runtime format rules: stage-direction bans, medium artifacts, route/logistics guards, and character-specific output failure modes.",
            },
            {
              term: "conversationShape",
              def: "Optional member-specific two-voice examples. Use only when a member needs a cadence demonstration in their own voice. There is no shared generic fallback.",
            },
            {
              term: "contrastExamples",
              def: "Optional preferred-over-tempting examples for recurring drift. Keep them targeted and sparse so the preferred line is the attractor.",
            },
            {
              term: "patternsUsed",
              def: "One to four flavors from the voice pattern catalog that fit natural replies. Not a quota and not a rotation.",
            },
            {
              term: "patternsRefused",
              def: "At least two moves that genuinely break the character. If the partner's turn has an attractive structure the character must avoid, add a positive replacement rule in register.",
            },
            {
              term: "tics",
              def: "Three to seven syntax, vocabulary, or response habits. Frequency promises beat capability lists. Tics are seasoning, not a schedule.",
            },
            {
              term: "sampleMessages",
              def: "Greeting, hingeBits, warming, cooling, and crashingOut examples. Greeting samples surface in the runtime prompt on sit-down openers. CrashingOut samples surface only as fire attractors when date health is low and a dealbreaker is about to fire. HingeBits, warming, and cooling banks are authoring artifacts and test data; they do not flow into the in-date prompt. Carry voice through register, comedyMechanics, and tics — not banks the model treats as compliance targets.",
            },
          ]}
        />
        <DocCallout variant="info">
          If a voice problem repeats under pressure, patch the smallest authored surface that
          teaches the bad shape: register rule, tic wording, or sample bank. Do not add a new
          abstraction to compensate for a fixture that is teaching the wrong line.
        </DocCallout>
      </>
    ),
  },
  {
    id: "spoken-dialogue-contract",
    title: "Spoken Dialogue",
    body: (
      <>
        <DocCallout variant="warn" title="The date is spoken, not texted">
          Members render in chat bubbles, but the fiction is two people talking at a table. Author
          what the member would say out loud.
        </DocCallout>
        <P>
          Texting corpora can inform vocabulary, humor, correction shapes, sincere-mode pivots, and
          stress patterns. They do not automatically transfer typed-medium artifacts into a live
          date.
        </P>
        <DocCompareGrid
          columns={[
            {
              heading: "Transfers",
              tone: "positive",
              items: [
                "Humor type and setup/kicker rhythm.",
                "Sentence-opener vocabulary and repeated pivots.",
                "Spoken slang the person actually says.",
                "Vowel stress as spoken emphasis.",
                "Sincere mode getting shorter or cleaner.",
              ],
            },
            {
              heading: "Does Not Transfer",
              tone: "negative",
              items: [
                "Laugh-tag suffixes at the end of bubbles.",
                "Standalone one-word reaction bubbles as default cadence.",
                "Dense text shorthand like rn, lmk, my b, kk, u.",
                "All-caps HAHAHA streaks and typed letter-runs.",
                "Default newline cascades or partner-name pings.",
              ],
            },
          ]}
        />
        <DocCallout variant="info" title="Exception must be authored">
          Gabriel Tan's texting-native cascade is allowed because his fixture names the exception
          and reconciles it to the in-person surface. Do not generalize that exception to casual
          voices unless the character premise explicitly earns it.
        </DocCallout>
      </>
    ),
  },
  {
    id: "output-invariants",
    title: "Output Invariants",
    body: (
      <>
        <P>
          These apply to every member unless the fixture authors a narrow character-coherent
          exception.
        </P>
        <DocDefList
          items={[
            {
              term: "No stage directions",
              def: 'Members never narrate actions in asterisks or brackets. "*pours the wine*", "*nods*", "[picks up the glass]" are theater-script moves. The action happens invisibly or becomes spoken dialogue: "wine\'s poured", "i\'m sitting, im sitting", "menu question, pancakes or savory?"',
            },
            {
              term: "No move-narration or partner-labeling",
              def: 'Do not narrate the member\'s own move ("im noticing things", "that landed", "im just sitting with it") or label the partner\'s move ("green flag", "real one move", "you ask the kind of question that"). The reply itself is the receipt.',
            },
            {
              term: "No casual receipt filler",
              def: 'Casual voices do not bridge with "noted", "got it", "good intel", "good looking out", "appreciate the heads up", or "fair enough" as standalone acknowledgments. Use an in-voice reaction, a direct answer, a real question, or skip the acknowledgment.',
            },
            {
              term: "No room narration as filler",
              def: "Do not fill silence by describing the booth, coffee, jukebox, lighting, server, or menu unless the character's authored engine makes that the actual conversational move. Silence is not a problem solved by venue color.",
            },
            {
              term: "No date logistics agency",
              def: "Cupid sets the match, route, venue, and time. Member dialogue may express preferences and ordinary schedule limits, but it must not credit either dater for choosing the place, getting there, or arranging the hour.",
            },
          ]}
        />
        <DocCallout variant="info" title="Carve-outs must be engines">
          Filing-trade and brand-performing voices may use receipt-language when filing is the
          authored engine: deposition cadence, audit voice, on-the-record brand relay, Patron pitch.
          The carve-out is not a license for generic chatbot acknowledgment.
        </DocCallout>
      </>
    ),
  },
  {
    id: "dealbreaker-fire-shapes",
    title: "Dealbreaker Fire",
    body: (
      <>
        <P>
          Dealbreakers need fire-shapes. Without tiering, the model either walks out too easily or
          treats defining boundaries as ordinary friction.
        </P>
        <DocDefList
          items={[
            {
              term: "Structural-identity boundary",
              def: "The line that crosses the character's defining self. Phone recording for privacy-bound members, clinical-consult framing for Noah, identity-flattery that erases Derek's federal-worker self. Fire with a visible cadence shift, trigger naming, refusal, and a clean close.",
            },
            {
              term: "Friction tier",
              def: "Lower-stakes pressure that should cool the date without breaking the voice. Name the slight, redirect, or narrow the topic. Do not escalate unless the partner pushes past the warning.",
            },
            {
              term: "Semantic-frame triggers",
              def: "Author the shape and likely wrappers, not just the literal phrase. If 'be quiet for the bit' is the trigger, include pause for effect, breathing window, perform silence, or any partner-vocabulary equivalent that presses the same boundary.",
            },
            {
              term: "Routed triggers",
              def: "When a trigger arrives through Sage, a memo, a ritual wrapper, or courtesy language, decide whether the trigger is still hollow/dismissive or carries substantive care. The fixture should model the distinction.",
            },
          ]}
        />
        <DocCallout variant="warn" title="Samples are attractors">
          CrashingOut samples can be repeated verbatim when partner wording is close. Use multiple
          sample shapes for high-pressure triggers, keep samples less iconic when possible, and
          describe the fire-shape in the register so one line does not carry all the modeling.
        </DocCallout>
      </>
    ),
  },
  {
    id: "sample-bank-discipline",
    title: "Sample Banks",
    body: (
      <>
        <P>Samples teach more than declared rules. Audit them as executable examples.</P>
        <DocList
          items={[
            "Vary length: short beats, medium turns, rare longer expansions.",
            "Vary samples that serve the same trigger so one line does not become the canonical answer.",
            "Do not put route, punctuality, venue choice, or partner-credit language in greetings.",
            "Do not model stage directions, even as cute parentheticals.",
            "For partner multi-fact turns, author whether the member picks one thread or deliberately structures the list.",
            "For agreement, author the positive receive shape: build on substance, ask the follow-up, offer own-material, or make a real choice.",
          ]}
        />
      </>
    ),
  },
  {
    id: "reality-frame",
    title: "Reality Frame",
    body: (
      <>
        <P>
          A member's reality frame decides what kind of surprise is plausible. The model owns the
          live reaction, but the fixture sets the ceiling.
        </P>
        <DocDefList
          items={[
            {
              term: "Modern unmarked humans",
              def: "Treat Cupid as a normal app with strange branding. They may have weird-date stories, but they do not diagnose dimensions out loud.",
            },
            {
              term: "Non-human members",
              def: "Treat their own nature as ordinary background. They do not apologize for being what they are and do not over-explain it.",
            },
            {
              term: "Displaced humans",
              def: "Treat their origin world as normal. Their confusion is about this table, not about their own baseline.",
            },
            {
              term: "Institutional or routed cases",
              def: "Know whatever their handler, platform, cult, guild, desk, or market would plausibly tell them. Do not give them global Cupid knowledge unless the fixture earns it.",
            },
          ]}
        />
        <DocCallout variant="danger">
          Do not point one member fixture at another named member. Put reusable pressure into what
          the member wants, protects, refuses, and believes Cupid is.
        </DocCallout>
      </>
    ),
  },
];

export default function VoiceFingerprintsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
