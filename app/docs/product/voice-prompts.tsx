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
    <DocLink to="/docs/product/voice-fingerprints">Member voice authoring</DocLink>. Agents doing
    member tuning should start with{" "}
    <DocLink to="/docs/product/voice#voice-tuning-quickstart">Voice tuning quickstart</DocLink> and
    use this doc only when the failing surface is runtime prompt behavior. Provider-aligned rules
    for editing prompt text live in{" "}
    <DocLink to="/docs/product/prompt-authoring">Prompt authoring guidance</DocLink>.
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
        <DocSubsection id="member-chat" title="Member Chat">
          <P>
            The member-chat playground uses the same fixture voice fields, but it is not the live
            date prompt. <DocCode>buildMemberChatPrompt</DocCode> in{" "}
            <DocCode>app/services/ai/playground.ts</DocCode> frames a private one-on-one Cupid chat
            before a date. It produces plain conversational text, not a transcript bubble with
            Markdown.
          </P>
          <DocList
            items={[
              "Answer the latest tester message first. Do not summarize the whole profile unless asked.",
              "Use one complete sentence under 190 characters, or two very short sentences only when needed.",
              "No Markdown, bullets, speaker labels, physical stage directions, narration, system text, em dashes, or en dashes.",
              "Secrets, state, and tooling stay private. They can color subtext, but the member does not confess hidden data just because it is in the prompt.",
              "Sample banks are rhythm references only. Do not copy old facts unless the current chat earns them.",
            ]}
          />
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
      { id: "member-chat", title: "Member Chat" },
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
            "Affect range: neutral, warm or flirty, confused, guarded, angry, overwhelmed, and ready-to-leave are all valid when the turn earns them. Prompt wording should invite the right state instead of keeping every member politely neutral.",
            "Voice flavor: compact register, comedy mechanics, tics, optional member-specific conversation shape, and optional contrast examples. The sit-down opener may surface two greeting samples; in-date sample banks do not flow into the prompt. A single crash-out attractor surfaces only when date health is low and a dealbreaker fire is imminent.",
            "Shared scene: Cupid set the match, route, venue, and time; this is the pair's current date through Cupid.",
            "Venue frame: location, room feel, director rules, partner profile, portrait cues, and heights.",
            "Date play: members may propose or commit to small in-room moves as spoken dialogue, such as ordering, pouring, pressing, handing over, waiting, refusing, or asking before acting. The same block keeps stage directions, partner-control, hidden menus, invented names, invented backstories, invented visible room events, invented object consequences, and invented offscreen consequences out. If a partner asks for unavailable names or histories, the performer answers from visible facts or admits not knowing.",
            "Screen and tablet content stays spoken: the member says what the content is or what choice it creates. They do not narrate lighting changes, countdowns, screens, or tracks starting as prose.",
            "Default live-date shape: one compact spoken move, usually one paragraph and one to three sentences. A second visible block is reserved for a real pause, sharp turn, or member-authored timing beat, not for background explanation. Compact turns still need one character-specific joke, image, risky specific, or sincere pressure point when the moment can hold it.",
            "Pressure scenes bias toward concrete participation: choose, refuse, risk, repair, or ask the live question. The performer reveals only the rule or lore that changes the next move.",
            "Format and invariants: spoken conversation at a table, no labels, no stage directions, no dash punctuation, no parroting, no answering private notes aloud, plus member-specific output constraints.",
            "Visibility retry guard only for actual empty or unfileable generated output. Attachment notices only when the turn really includes attachments.",
          ]}
        />
        <DocCallout variant="danger">
          Do not paste the full voice docs or generic conversation-shape examples into runtime
          prompts. Do not expose pattern taxonomy as a checklist the model must satisfy. The prompt
          should describe who the member is, what they protect, and the conversation they are
          inside. When adding or removing prompt instructions, use{" "}
          <DocLink to="/docs/product/prompt-authoring">Prompt authoring guidance</DocLink>.
        </DocCallout>
        <DocCallout variant="note">
          Runtime prompts must not treat dating success as the default. Flirtation and attraction
          require concrete exchange evidence; confusion, anger, overload, and crash-out pressure are
          first-class reads when member guards or scenario pressure fire.
        </DocCallout>
        <DocCallout variant="danger" title="No style rejection loops">
          Do not reject, rewrite, or retry generated member lines because string matching found a
          disliked voice pattern. A bad or awkward line can happen; it is tuning evidence, not a
          generation failure. Runtime retries are for actual filing failures such as empty output or
          hidden-info leaks.
        </DocCallout>
      </>
    ),
  },
  {
    id: "member-chat-packet",
    title: "Member Chat Packet",
    body: (
      <>
        <P>
          The playground member-chat prompt is a pre-date voice probe. It is useful for fixture
          tuning because it reads the full member fixture without date scene pressure, pair memory,
          interventions, or judge state.
        </P>
        <DocList
          items={[
            "System frame: speak as the member in a private one-on-one Cupid chat with a real person.",
            "Context: origin, species, reality status, bio, dating profile, needs, preferences, dealbreakers, reality frame, voice register, mechanics, constraints, conversation shapes, contrast examples, tics, samples, and secrets.",
            "Output target: one easy-to-answer message that makes a single conversational move.",
            "Format: plain text only. The member-chat path intentionally forbids Markdown even though live date bubbles accept the small spoken-typography subset.",
            "Use it to catch profile-recital drift, off-voice tics, hidden-info leakage, and chat-app artifacts before running a full date tune session.",
          ]}
        />
        <DocCallout variant="warn">
          Do not use member-chat output as proof that the live performer prompt is locked. Live date
          behavior still needs the live tuning path in{" "}
          <DocLink to="/docs/product/voice#voice-tuning-quickstart">
            Voice tuning quickstart
          </DocLink>{" "}
          because scene pressure, pair state, Cupid coaching, samples, and transcript rhythm change
          the model's choices.
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
              def: "The model reaches for bureaucratic acknowledgments in brief receive slots. Mitigate by giving that slot a target move in the member's own voice: answer, ask, tease, choose, refuse, admit, or stay silent.",
            },
            {
              term: "Stage directions",
              def: "Asterisks and brackets recur under emotional pressure, refusal seams, and action prompts. Mitigate in the fixture with spoken replacements. The Markdown sanitizer is fallback, not the primary fix.",
            },
            {
              term: "Room narration",
              def: "When the partner leaves silence, the model fills with venue color. Mitigate with an outcome-first live-date contract: the line should advance the date through an answer, follow-up, choice, refusal, or visible reaction, with the flow mode deciding whether the venue recedes behind conversation or becomes an activity/pressure/set-piece engine.",
            },
            {
              term: "Partner-labeling as receipt",
              def: "The model labels the partner as a green flag, smart, respectful, valid, or a kind of date. Mitigate by modeling engagement as a move: real question, own-material, callback, tease, admission, or choice. During tuning, treat generic positivity as a miss even when the line is pleasant.",
            },
            {
              term: "Meta-acknowledgment drift",
              def: "The model says it noticed, clocked, registered, or will note the partner's move. Mitigate by converting recognition into the reply it creates: ask the question, make the choice, push back, flirt, refuse, or end.",
            },
            {
              term: "Profile receipt",
              def: "The model repeats a partner's full name, job, species, or profile label as proof it recognized the setup. Mitigate by treating names and profile facts as context for the next move, not as acknowledgments. After introductions, prefer first names, pronouns, or the concrete thing the partner just did.",
            },
            {
              term: "Action block leakage",
              def: "Activity and set-piece prompts can make the model append bracketed body movement or private rationale after a spoken line. Mitigate by keeping the live-date contract on bubble text only: physical movement must become a spoken offer, instruction, or commitment the partner can answer.",
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
          on positive behavior and scene context, and runtime generation must not fail a member line
          because it matched a style smell.
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
        <DocCallout variant="note" title="Flow-specific reaction targets">
          Conversation rooms should pull members toward questions, answers, admissions, jokes,
          disagreement, and quiet attention. Pressure, activity, and set-piece rooms can imply
          physical consequences between spoken lines when an event lands or a member commits to a
          move. The performer should answer the result as present scene reality while keeping the
          bubble natural dialogue.
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
          <span key="tuning">
            If a systemic prompt changes, run short spot checks against already-locked voices likely
            to be affected. The one-member tuning sequence lives in{" "}
            <DocLink to="/docs/product/voice#voice-tuning-quickstart">
              Voice tuning quickstart
            </DocLink>
            .
          </span>,
        ]}
      />
    ),
  },
];

export default function VoicePromptsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
