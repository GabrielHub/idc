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
  slug: "product/voice-authoring",
  group: "product",
  title: "Member voice: authoring",
  description:
    "How to build a member performer: bios, the voice engine block, sample banks, dealbreaker fire-shapes, and reality frames.",
  order: 1,
};

export const lede = (
  <>
    This doc owns how a member performer is built. Use it when creating or revising{" "}
    <DocCode>bio</DocCode>, <DocCode>datingProfile</DocCode>, <DocCode>voice</DocCode>, sample
    banks, and dealbreakers. What a finished voice must satisfy lives in{" "}
    <DocLink to="/docs/product/voice-requirements">Member voice: requirements</DocLink>; the flavor
    palette lives in <DocLink to="/docs/product/voice-patterns">Voice patterns</DocLink> and
    ear-training corpora in{" "}
    <DocLink to="/docs/product/voice-references">Voice source references</DocLink>. Hidden gameplay
    tags live in{" "}
    <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink>. Prompt
    hygiene rules live in{" "}
    <DocLink to="/docs/product/prompt-authoring">Prompt authoring guidance</DocLink>.
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
              def: "Optional authoring and test-only two-voice examples. They do not flow into the live date prompt (the model recites them verbatim); carry cadence through register, comedyMechanics, and tics instead. They remain useful as reference data and in the member-chat probe.",
            },
            {
              term: "contrastExamples",
              def: "Optional authoring and test-only preferred-over-tempting examples. They do not flow into the live date prompt: situation-keyed preferred lines get recited verbatim and the tempting line is itself an attractor. Move any load-bearing lesson into register or outputConstraints as a positive target.",
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
              def: "Greeting, hingeBits, warming, cooling, and crashingOut examples. Greeting samples surface in the runtime prompt on sit-down openers. CrashingOut samples surface only as fire attractors when date health is low and a dealbreaker is about to fire. HingeBits is a legacy bucket name for compact source-style flavor lines, not a product promise that IDC dates use dating-app openers. HingeBits, warming, and cooling banks are authoring artifacts and test data; they do not flow into the in-date prompt. Carry voice through register, comedyMechanics, and tics — not banks the model treats as compliance targets.",
            },
          ]}
        />
        <DocCallout variant="warn" title="Examples are not the voice engine">
          A voice is the member&apos;s reaction engine: what they protect, how they answer pressure,
          how they flirt, how they cool, and what syntax they reach for under stress. Samples only
          illustrate that engine. If a sample reads like a pickup line, extract the humor mechanism
          and rewrite the fixture guidance so the live date still sounds like spoken table dialogue.
        </DocCallout>
        <DocCallout variant="info">
          If a voice problem repeats under pressure, patch the smallest authored surface that
          teaches the bad shape: register rule, comedy mechanic, tic wording, output constraint, or
          sample bank. The tuning sequence and the bars a finished voice must clear live in{" "}
          <DocLink to="/docs/product/voice-requirements#running-a-pass">
            Member voice: requirements
          </DocLink>
          .
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
          treats defining boundaries as ordinary friction. The runtime crash-out bar lives in{" "}
          <DocLink to="/docs/product/voice-requirements#state-range">
            Member voice: requirements
          </DocLink>
          .
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

export default function VoiceAuthoringDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
