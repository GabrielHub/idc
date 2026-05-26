import {
  DocCallout,
  DocCode,
  DocCompareGrid,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  DocQuote,
  DocSubsection,
  P,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/voice-prompts",
  group: "product",
  title: "Runtime voice surfaces",
  description:
    "How voice is used by profiles, openers, live transcript prompts, Markdown rendering, Cupid reports, scenario events, and recurring LLM quirk mitigations.",
  order: 3,
};

export const lede = (
  <>
    This doc owns runtime surfaces. It explains what prompt packets contain, what each UI surface
    should sound like, which Markdown the transcript renderer accepts, and how to respond to
    recurring model quirks. Fixture authoring rules live in{" "}
    <DocLink to="/docs/product/voice-fingerprints">Member voice authoring</DocLink>.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "surface-map",
    title: "Surface Map",
    body: (
      <>
        <DocSubsection id="dating-profile-blurb" title="Dating Profile Blurb">
          <P>
            The first sentence of <DocCode>datingProfile</DocCode> becomes the public roster
            tagline. It must perform the member in one sentence, not file a census row.
          </P>
          <DocCompareGrid
            columns={[
              {
                heading: "Good",
                tone: "positive",
                items: [
                  '"you rich?"',
                  '"Mid forties, for real."',
                  '"I am here for the dinner and the question you almost asked, in that order."',
                ],
              },
              {
                heading: "Weak",
                tone: "negative",
                items: [
                  '"Name."',
                  '"Age, city, job, no attitude."',
                  '"Likes books, coffee, travel, and good food."',
                ],
              },
            ]}
          />
        </DocSubsection>
        <DocSubsection id="opening-message" title="Opening Message">
          <P>
            The performer may use <DocCode>greeting</DocCode> samples for the sit-down intro. It
            should be a hello with the name on the table, not a hinge bit. Openers must not credit
            the partner for venue, route, time, or arrival.
          </P>
        </DocSubsection>
        <DocSubsection id="in-date-transcript" title="In-Date Transcript">
          <P>
            The Character Performer answers the latest partner line as the member. Voice flavor is
            background color. The live conversation wins over pattern satisfaction.
          </P>
        </DocSubsection>
        <DocSubsection id="member-markdown-subset" title="Member Message Markdown Subset">
          <P>
            Member bubbles render a hardened Markdown subset. Use formatting as spoken typography,
            not decoration.
          </P>
          <DocCompareGrid
            columns={[
              {
                heading: "Allowed",
                tone: "positive",
                items: [
                  "A single stressed word: I said *almost* normal.",
                  "A named correction or punch line: **Receipt law.**",
                  "Line breaks for genuine spoken pauses.",
                  "A blank line when the character lets a beat sit.",
                ],
              },
              {
                heading: "Stripped Or Avoided",
                tone: "negative",
                items: [
                  "Italic body actions like *puts feet down* or *grabs coffee*. Italics are for spoken stress, not what your hands or face are doing.",
                  "Bare unscripted action sentences like Puts feet down. or Grabs the coffee. without asterisks.",
                  "Formatting every emotional word.",
                  "Lists, links, code, tables, blockquotes, raw HTML, images, and task syntax.",
                  "Messages that look like posters or structured reports.",
                ],
              },
            ]}
          />
          <P>
            The renderer caps a reply at two visible blocks after cleanup. Whole-line italic actions
            such as <DocCode>*sighs*</DocCode> are markup abuse and get stripped.
          </P>
        </DocSubsection>
        <DocSubsection id="cupid-intervention" title="Cupid Intervention">
          <P>
            Player text is saved as <DocCode>Cupid suggests: &lt;player text&gt;</DocCode>. The
            targeted performer receives it as private coaching, not as a table line and not as a
            message to answer.
          </P>
        </DocSubsection>
        <DocSubsection id="member-request" title="Member Request">
          <P>One sentence. Member-aware, compressed, and specific about the ask.</P>
          <DocQuote>
            "Vhool wants someone who will laugh at the same things he laughs at. He is working on a
            list."
          </DocQuote>
        </DocSubsection>
        <DocSubsection id="cupid-reporting" title="Cupid Reporting">
          <P>
            Company goals, judge reports, follow-up labels, scenario cards, error states, and
            end-of-shift reports use Cupid corporate voice: dry, procedural, short.
          </P>
          <DocQuote>
            "Exchange improved. Repeat room noticed by both parties. Recommend Cool Down."
          </DocQuote>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "dating-profile-blurb", title: "Dating Profile Blurb" },
      { id: "opening-message", title: "Opening Message" },
      { id: "in-date-transcript", title: "In-Date Transcript" },
      { id: "member-markdown-subset", title: "Member Message Markdown Subset" },
      { id: "cupid-intervention", title: "Cupid Intervention" },
      { id: "member-request", title: "Member Request" },
      { id: "cupid-reporting", title: "Cupid Reporting" },
    ],
  },
  {
    id: "character-performer-packet",
    title: "Character Performer Packet",
    body: (
      <>
        <P>
          <DocCode>buildCharacterPromptPacket</DocCode> in{" "}
          <DocCode>app/services/date-prompts.ts</DocCode> builds the prompt addressed to the member
          in second person. Gameplay terms stay out of the member frame.
        </P>
        <DocList
          items={[
            "Role block: the member's name and first name.",
            "Task: produce one spoken reply grounded in the latest partner line.",
            "Identity and state: bio, needs, preferences, dealbreakers, private pressure, current mood, memories, agreements, open loops, and pair trajectory.",
            "State pressure: low mood, bad comfort, and boundary-protection intent must change behavior. Cooling, confusion, refusal, or ending the exchange are valid member replies when the latest line supports them.",
            "Voice flavor: compact register, comedy mechanics, tics, optional member-specific conversation shape, and optional contrast examples. The sit-down opener may surface two greeting samples; in-date sample banks do not flow into the prompt. A single crash-out attractor surfaces only when date health is low and a dealbreaker fire is imminent.",
            "Shared scene: Cupid set the match, route, venue, and time; this is the pair's current date through Cupid.",
            "Venue frame: location, room feel, director rules, partner profile, portrait cues, and heights.",
            "Format and invariants: spoken conversation at a table, no labels, no stage directions, no dash punctuation, no parroting, no answering private notes aloud, plus member-specific output constraints.",
            "Retry guards and attachment notices only when needed.",
          ]}
        />
        <DocCallout variant="danger">
          Do not paste the full voice docs or generic conversation-shape examples into runtime
          prompts. Do not expose pattern taxonomy as a checklist the model must satisfy. The prompt
          should describe who the member is, what they protect, and the conversation they are
          inside.
        </DocCallout>
        <DocCallout variant="note">
          Runtime prompts must not treat dating success as the default. Flirtation and attraction
          require concrete exchange evidence; confusion, anger, overload, and crash-out pressure are
          first-class reads when member guards or scenario pressure fire.
        </DocCallout>
      </>
    ),
  },
  {
    id: "thread-shape",
    title: "Thread Shape",
    body: (
      <DocList
        items={[
          "The speaker's prior lines arrive as assistant messages.",
          "Partner replies arrive as user messages.",
          <span key="events">
            Scene events arrive as <DocCode>This just happened: {"<event>"}</DocCode>.
          </span>,
          <span key="coaching">
            Cupid coaching notes arrive as{" "}
            <DocCode>
              Private Cupid coaching note, not spoken at the table and not a message to answer: "
              {"<text>"}"
            </DocCode>
            .
          </span>,
          "Everything between two of the speaker's own turns is batched into one user message.",
          "Cupid interventions sent to the other member are filtered out.",
        ]}
      />
    ),
  },
  {
    id: "recurring-model-quirks",
    title: "Model Quirks",
    body: (
      <>
        <P>
          These are observed LLM behaviors. The response is usually positive examples in fixtures or
          scene fragments, not larger scaffold ban lists.
        </P>
        <DocDefList
          items={[
            {
              term: "Noted / got it default",
              def: "The model reaches for bureaucratic acknowledgments in brief receive slots. Mitigate by adding in-voice samples that occupy that exact slot. Accept tiny residue only if it no longer reads as the character closing the turn like a chatbot.",
            },
            {
              term: "Stage directions",
              def: "Asterisks and brackets recur under emotional pressure, refusal seams, and action prompts. Mitigate in the fixture with spoken replacements. The Markdown sanitizer is fallback, not the primary fix.",
            },
            {
              term: "Room narration",
              def: "When the partner leaves silence, the model fills with venue color. Mitigate by naming what the character does with silence and by giving positive actionable carve-outs.",
            },
            {
              term: "Partner-labeling as receipt",
              def: "The model labels the partner as a green flag or a kind of date. Mitigate by modeling engagement as a move: real question, own-material, callback, admission, or choice.",
            },
            {
              term: "Worked-example recital",
              def: "Distinctive sample lines can be copied verbatim. Mitigate with sample variance and by putting the behavior rule in register.",
            },
            {
              term: "Single-word Markdown emphasis",
              def: "Inline emphasis like *good*, *that*, or *you* persists across unrelated fixtures. Treat low-rate residue as a runtime watch item unless it becomes stage direction or formatting spam.",
            },
          ]}
        />
        <DocCallout variant="warn" title="Content lint is the hard-rule layer">
          Hard bans on authored fixture content belong in{" "}
          <DocCode>app/fixtures/content-lint.test.ts</DocCode>. Runtime prompts should stay focused
          on positive behavior and scene context.
        </DocCallout>
      </>
    ),
  },
  {
    id: "scenario-event-kinds",
    title: "Scenario Event Kinds",
    body: (
      <>
        <P>
          Date scenario fixtures ship nine events: three <DocCode>ambient</DocCode>, three{" "}
          <DocCode>provocation</DocCode>, and three <DocCode>reveal</DocCode>. The event kind adds a
          director suffix so the performer knows how forcefully to react.
        </P>
        <DocDefList
          items={[
            {
              term: "ambient",
              def: "Environmental texture. The character may notice it or move on.",
            },
            {
              term: "provocation",
              def: "A physical interruption that demands a reaction before conversation continues.",
            },
            {
              term: "reveal",
              def: "Information that changes what the characters understand. The reply should process it, not treat it as wallpaper.",
            },
          ]}
        />
        <DocCallout variant="info">
          Scenario authoring stays member-agnostic. Use reusable hooks: bargain clause, camera
          flash, rescue poster, formal toast, quiet corner. Do not write events for one named
          member.
        </DocCallout>
      </>
    ),
  },
  {
    id: "authoring-checklist",
    title: "Runtime Checklist",
    body: (
      <DocList
        items={[
          "Does this surface use Cupid corporate or member voice, and only one at a time?",
          "Does the opener avoid venue, time, route, match, or arrival credit?",
          "Does the prompt packet describe the member and scene instead of exposing a rule checklist?",
          "Does the fixture provide positive replacements for any recurring model quirk it is likely to trigger?",
          "Does Markdown read as spoken stress rather than stage direction?",
          "If a systemic prompt changes, run short spot checks against already-locked voices likely to be affected.",
        ]}
      />
    ),
  },
];

export default function VoicePromptsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
