import {
  DocCallout,
  DocCode,
  DocLink,
  DocList,
  DocPage,
  DocSubsection,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/voice",
  group: "product",
  title: "Voice and tone",
  description:
    "The core bit, the two-register split, prose mechanics, what this tone is not, when comedy stops, and the closure summary voice.",
  order: 0,
};

export const lede = (
  <>
    This document owns IDC voice, prose mechanics, and the comedy stops.{" "}
    <DocCode>app/app.css</DocCode> and{" "}
    <DocLink to="/docs/product/visual-design">Visual design</DocLink> own the frontend visual
    language; <DocLink to="/docs/product/image-style">Image style</DocLink> owns image asset style.
    The pattern catalog lives in <DocLink to="/docs/product/voice-patterns">Voice patterns</DocLink>
    ; per-member voice setup in{" "}
    <DocLink to="/docs/product/voice-fingerprints">Voice fingerprints</DocLink>; surface and prompt
    usage in <DocLink to="/docs/product/voice-prompts">Voice in prompts</DocLink>.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "the-core-bit",
    title: "The core bit",
    body: (
      <>
        <P>
          Cupid, the company, has the dry confidence of a workplace sitcom. The members do not.
          Members write like they are typing in a moving car, in love with the next sentence before
          they finish the current one. Comedy lives in the contrast between operational competence
          and member chaos, and in the gap between how each member sees themselves and how they read
          on the page.
        </P>
        <P>
          The tone is affectionate, never cruel. The members are sincere. The reader sees them
          clearly. The members do not see themselves clearly. That is the whole machine.
        </P>
        <P>
          This tone is not snarky, not random, not winking. It is specific neurosis delivered with
          full conviction.
        </P>
      </>
    ),
  },
  {
    id: "two-voice-registers",
    title: "Two voice registers",
    body: (
      <>
        <P>
          IDC carries two distinct registers and they alternate constantly. Most copy belongs to one
          or the other. They almost never mix inside a single line.
        </P>
        <DocSubsection id="cupid-corporate" title="Cupid corporate">
          <P>
            <Strong>Used for:</Strong> dashboard chrome, system messages, Cupid reports,
            end-of-shift summaries, scenario card framing, follow-up action labels, error states,
            intervention wrapper text, goals.
          </P>
          <P>
            <Strong>Voice:</Strong> confident, dry, slightly bored. Workplace comedy under
            supernatural pressure. The agent has processed a thousand cosmic incidents this quarter.
            They have a template for it.
          </P>
          <DocList
            items={[
              "Active voice.",
              "Short, declarative sentences.",
              <span key="absurd">
                Treat the absurd as routine:{" "}
                <em>"Vhool's date ended early. Standard cosmic cleanup is on schedule."</em>
              </span>,
              <span key="proc">
                Treat the routine as a procedure:{" "}
                <em>"Member Mood is below floor. Recommend Repair."</em>
              </span>,
              <span key="kpi">
                KPI energy with the wrong noun:{" "}
                <em>"Match one ordinary human with one obviously non-human member."</em>
              </span>,
              "No exclamation points. No oops. No mascot voice. No emoji unless the surface already carries them.",
              <span key="case">
                Sentence case for body. UPPERCASE TRACKED only on micro labels, matching the
                existing Aura UI mono labels (<DocCode>// session.0</DocCode>,{" "}
                <DocCode>9 / 11 dim</DocCode>).
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="member" title="Member">
          <P>
            <Strong>Used for:</Strong> dating profile blurbs, opening messages, in-date transcripts,
            member-side request text, member-private memory phrasing, anything spoken by a member.
          </P>
          <P>
            <Strong>Voice:</Strong> someone typing too fast on the way to a date they are already
            late for. The cringe is sincere. The character is not in on the joke; the reader is.
          </P>
          <DocList
            items={[
              <span key="finger">
                Each member has a voice fingerprint (see{" "}
                <DocLink to="/docs/product/voice-fingerprints">Voice fingerprints</DocLink>). Use it
                as flavor, not as a script. A natural reply to the partner and the room always wins;
                the fingerprint never overrides the conversation.
              </span>,
              "Run-on sentences are fine. Mid-thought pivots are encouraged.",
              <span key="spec">
                Specific over general, every time. <em>"23 & me"</em> beats <em>"a DNA test."</em>{" "}
                <em>"Cheesecake Factory"</em> beats <em>"a restaurant."</em>
              </span>,
              "Confidence about embarrassing things. Confession about ordinary things.",
              "Romance proposed in mundane terms (Costco, fitted sheets, the olive on the plate).",
              "Threats delivered as flirtation. Flirtation delivered as confession.",
              <span key="i">
                Lowercase <DocCode>i</DocCode> is fine when the fixture authorizes it. Single typos
                are fine. Spoken cadence (fragments, run-ons, mid-thought pivots) is fine. Texting
                moves (laugh-tag suffix punctuation, standalone single-word reaction bubbles, text
                shorthand at high density, newline cascades as default) are out; see the prose
                mechanics section below. Do not over-correct toward grammar school.
              </span>,
              "A reply that drops the fingerprint to land a real reaction is in voice. A reply that hits the fingerprint at the cost of sounding rehearsed is not.",
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "cupid-corporate", title: "Cupid corporate" },
      { id: "member", title: "Member" },
    ],
  },
  {
    id: "prose-mechanics",
    title: "Prose mechanics",
    body: (
      <>
        <P>These apply to all member-voice copy. Cupid corporate voice uses cleaner mechanics.</P>
        <DocList
          items={[
            <span key="i">
              Lowercase <DocCode>i</DocCode> is fine in member voice when the character's
              capitalization rule authorizes it (off-shift casual, lowercase-aesthetic, archaic
              uncontracted-as-CEO-performance carve-out). Texting-native millennials who would type
              with capital-I (Gabriel) keep the capital-I baseline; lowercase fires only as a typo
              in that case. Spell the rule in the fixture register so the model picks the right
              default. Never in Cupid voice.
            </span>,
            "No em dashes or en dashes anywhere. Use commas, periods, colons, parentheses, or split sentences. This applies in code, docs, and runtime copy.",
            'Caps for emphasis are allowed in member voice ("BRAINNNN", "WIGGLING", "BRUH"). Use sparingly for genuine spoken stress. All-caps HAHAHA streaks and typed letter-runs ("yupppppp") are texting moves and stay out of spoken dialogue. Never in Cupid voice.',
            "Run-ons welcome in member voice, especially in Rambling Spiral and Stream of Consciousness. Banned in Cupid voice.",
            'Fragments welcome ("These hand problems. They\'re fixable."). Useful in both registers.',
            "Exclamation points: member voice may use none, one, or a deliberate !! when the character fingerprint earns it. Avoid bigger stacks. Cupid voice uses zero.",
            <span key="typos">
              Single typos and casual contractions (<DocCode>ive</DocCode>, <DocCode>abt</DocCode>,{" "}
              <DocCode>tho</DocCode>) are fine in member voice if they fit the fingerprint. Do not
              perform millennial errors in characters who would not make them. Rapid-send typos with
              asterisk-correction (Aran, Aryan*) can be a character marker when the corpus shows the
              source person owns the typo; spell that intent in the fixture so the model does not
              silently retype.
            </span>,
            <span key="stage">
              No stage directions in member voice. Member bubbles render as spoken dialogue;
              asterisks around actions (<DocCode>*sips wine*</DocCode>, <DocCode>*shrugs*</DocCode>,{" "}
              <DocCode>*leans back*</DocCode>) and bracketed actions (
              <DocCode>[picks up the glass]</DocCode>) are theater-script moves, not speech. The
              sanitizer in <DocCode>app/services/character-markdown.ts</DocCode> strips italic
              stage-direction lines; the fixture-level guidance lives in{" "}
              <DocLink to="/docs/product/voice-fingerprints">Voice fingerprints</DocLink>.
            </span>,
            <span key="spoken">
              The date is spoken, not texted. Laugh-tag suffix punctuation (lol / lmao / haha at the
              end of every bubble), single-word reactions as standalone bubbles (Damn / Holy /
              Insane / Wild as solo lines), text shorthand at high density (rn, tn, lmk, my b, kk,
              ye), and newline cascades as default cadence are texting moves. Spoken laughter, when
              authored, is a sound inside a sentence ("damn, that lands"), not a typographic suffix.
              Gabriel Tan is the explicit exception (texting-native millennial) and his fixture
              authors the cascade as a character claim. See{" "}
              <DocLink to="/docs/product/voice-fingerprints#spoken-dialogue-contract">
                the spoken-dialogue contract
              </DocLink>{" "}
              for the full list of what does and does not extrapolate.
            </span>,
            'Specificity beats generality every time. Real proper nouns (Costco, Whole Foods, Build A Bear, John Goodman) outperform invented ones unless the invention is the joke. Trademarked names are fine in fiction; do not censor "Costco" to "the warehouse store."',
            'Trust the reader. No "lol just kidding," no softening, no explaining the joke after the joke.',
            'No AI-slop words: "delve," "in essence," "moreover," "tapestry," "intricate," "myriad," "plethora," "unleash," "leverage" / "harness" as verbs, "elevate," filler "robust," "not just X but also Y." See AGENTS.md for the full list.',
          ]}
        />
      </>
    ),
  },
  {
    id: "what-this-tone-is-not",
    title: "What this tone is not",
    body: (
      <DocCallout variant="danger">
        <DocList
          items={[
            'Not snarky. No Marvel-style quips, no Twitter dunks, no "well that just happened" energy.',
            "Not random. Random absurdism is not this. Specific neurosis is.",
            "Not mean. The members are pathetic on purpose, and the reader loves them for it. Cruelty toward them breaks the spell.",
            "Not winking. Characters are not in on the joke. The reader is. Keep that wall.",
            "Not horny without character. Yearning, oversharing, awkward physical confession, yes. Generic Reddit horny voice, no.",
            'Not Reddit voice. No "this guy fucks," "found the X," "username checks out."',
            'Not Twitter voice. No "girl. girl." cadence, no "the way I would," no "no thoughts head empty," no "it me."',
            "Not chronically online voice as default. Specific characters can use it; the house style does not.",
            'Not "lol so random." Every absurd line should map to a recognizable human anxiety: control, attachment, ego, loneliness, status, body, mortality, failure to be loved.',
          ]}
        />
      </DocCallout>
    ),
  },
  {
    id: "when-comedy-stops",
    title: "When comedy stops",
    body: (
      <DocCallout variant="danger" title="Death and serious-injury copy is never funny">
        <P>Extending the AGENTS.md rule:</P>
        <DocList
          items={[
            "Real-world tragedy, war, or violence: never punchline.",
            "Abuse, harassment, sexual coercion: never punchline. Members can be unsettling, never abusive.",
            "Suicide and self-harm: never punchline. Existential dread as cosmic flavor (Vhool) is fine; a member describing actual self-harm is not.",
            "Mental illness as a category: not the joke. Specific neuroses that anyone might recognize are the joke. The line is whether a real person with that diagnosis would feel mocked.",
            "Identity (race, gender, sexuality, disability): not the joke. Eccentric specificity about an individual life is the joke; categorical jokes about groups are not.",
          ]}
        />
        <P>
          The rule: comedy comes from the gap between self-image and reality. If the punchline
          requires the reader to look down on a group, it is not this tone.
        </P>
        <P>
          If a member's premise touches a serious topic (a ghost member's death, a time-displaced
          member's lost world, a cursed royal's exile), the comedy comes from how mundanely they
          treat it, not from the loss itself. Their tone is funny. Their pain is real.
        </P>
      </DocCallout>
    ),
  },
  {
    id: "closure-summary-voice",
    title: "Closure summary voice",
    body: (
      <>
        <P>
          Closure summaries are filed by <DocCode>generateClosureSummary</DocCode> when the player
          closes a pair. They live on the pair memory tagged <DocCode>pair_closure</DocCode> and
          surface in the Files canvas with the <Strong>CASE CLOSED</Strong> frame treatment, in the
          Live Date planning closure callout, and in the soft-win cutscene.
        </P>
        <DocList
          items={[
            "Warm, specific, short. Two to four sentences. Anchor the note in one to three concrete shared moments from the pair's filed history.",
            "Workplace-comedy professional, not sentimental. Treat the pair landing as routine, not as a victory lap.",
            "Never editorialize about Cupid, the company, the app, the agency, or matchmaking. The pair leaves on their own terms.",
            "Never include exact stat numbers, Date Health values, Spark, Strain, Relationship Health values, or raw percentages. Closure notes are case copy, not stat dumps.",
            <span key="dash">
              Never use em dashes or en dashes. Use commas, periods, colons, or separate sentences.
              The validator in <DocCode>app/services/closures.ts</DocCode> rejects either form.
            </span>,
            'No filler like "tapestry," "intricate," "myriad," "unleash," "leverage," "elevate," "journey," or "chapter." No "not just X but also Y."',
            "Death and serious-injury copy is never funny. The closure is the warm endgame; keep it warm.",
          ]}
        />
      </>
    ),
  },
  {
    id: "manager-fingerprint",
    title: "Manager fingerprint",
    body: (
      <>
        <P>
          The manager is the only character who speaks directly to the player. She is the HR manager
          running a supernatural matchmaking agency, ten years deep, laid back, a little tired. Dry
          wit, not punchlines. Her lines play through pre-generated ElevenLabs audio at named
          gameplay beats and never inside the simulation itself. The shipped pass used Eleven v3,
          Natural stability, and the Lyan voice.
        </P>
        <DocList
          items={[
            "One sentence, two at most. Five to twelve words. Three to five seconds of audio. Short fragments are fine when the delivery carries them.",
            "Spoken register. Contractions, sentence fragments, casual filler (yeah, okay, cool). Office words still anchor her (file, log, archive, cap, books) but they sit inside conversational rhythm.",
            "She talks to the player when sarcasm needs a target, and about the pair when commenting on the work. Pick whichever lands the line.",
            "Future recording scripts use Eleven v3 audio tags when performance needs direction. Keep display copy clean, and put bracketed tags like [sighs], [whispers], [sarcastic], or [light chuckle] in the generation script.",
            <span key="multi">
              Roughly one line in ten slips into another language without warning (Chinese,
              Spanish). Keep the meaning self-contained so non-speakers still feel the tone. Pass a{" "}
              <DocCode>translation</DocCode> on the catalog entry so the preview and screen-reader
              announcement render it in parentheses; ElevenLabs never reads the translation.
            </span>,
            "No em dashes or en dashes in audio scripts. No exclamation marks. No participation-trophy congratulation. No mean-girl cruelty toward the members.",
          ]}
        />
        <P>
          The full catalog, trigger table, and authoring workflow live in{" "}
          <DocLink to="/docs/product/manager-quips">Manager check-in quips</DocLink>.
        </P>
      </>
    ),
  },
];

export default function VoiceDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
