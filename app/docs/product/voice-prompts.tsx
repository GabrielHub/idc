import {
  DocCallout,
  DocCode,
  DocCompareGrid,
  DocLink,
  DocList,
  DocPage,
  DocQuote,
  DocSubsection,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/voice-prompts",
  group: "product",
  title: "Voice in prompts and surfaces",
  description:
    "How the voice rules apply per surface (profile, opener, transcript, intervention, Cupid report, scenario card) and how prompts feed Performer, Memory Summarizer, and Cupid analysis.",
  order: 3,
};

export const lede = (
  <>
    This doc owns voice at runtime: which surface carries which register, what the LLM prompts need,
    and what the scenario engine appends to a director instruction. The tone rules live in{" "}
    <DocLink to="/docs/product/voice">Voice and tone</DocLink>; the pattern catalog in{" "}
    <DocLink to="/docs/product/voice-patterns">Voice patterns</DocLink>; per-member fingerprints in{" "}
    <DocLink to="/docs/product/voice-fingerprints">Voice fingerprints</DocLink>.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "application-by-surface",
    title: "Application by surface",
    body: (
      <>
        <DocSubsection id="dating-profile-blurb" title="Dating profile blurb">
          <P>
            Two short paragraphs max. Let one comedic flavor color the blurb, not three stacked.
            Land on a specific image. Profile copy is the one surface where voice flavor can run
            without a live partner pulling on it; in-date transcripts let the partner pull on it
            instead.
          </P>
          <P>
            The first sentence is special: it becomes the public roster tagline through{" "}
            <DocCode>buildVisibleMemberProfile</DocCode>. Write it as the member's one-sentence
            self-pitch. It should tell the player who this person is, in that person's voice, with
            one useful background or personality hook.
          </P>
          <P>
            Because the app sentence-splits <DocCode>datingProfile</DocCode>, do not start with a
            throwaway sentence and expect the next sentence to carry the hook. If the first sentence
            is only a name, a placeholder setup, or a generic intake-field summary, that is all the
            roster card gets. Age, location, job, and interests can work when the phrasing reveals
            how the member sells themself, ducks a question, or creates pressure. A clipped question
            can work only when it is the whole intended public bit, as with Reaver.
          </P>
          <DocCompareGrid
            columns={[
              {
                heading: "Good shape",
                tone: "positive",
                items: [
                  '"you rich?"',
                  '"9 out of 10 dentists recommend swiping left on all of this."',
                  '"Mid forties, for real."',
                  '"I am here for the dinner and the question you almost asked, in that order."',
                  '"high conviction long on dinner Friday after market close, seeking a counterparty who reads texts and respects a 4am terminal alert."',
                ],
              },
              {
                heading: "Avoid this shape",
                tone: "negative",
                items: [
                  '"Name."',
                  '"Age, city, job, no attitude."',
                  '"Likes books, coffee, travel, and good food."',
                  '"Kind, curious, loyal, ambitious, and funny once you know me."',
                ],
              },
            ]}
          />
          <P>
            Keep the good column sourced from live fixture taglines that already work. Keep the
            avoid column as abstract shapes unless the same change also repairs the quoted fixture.
            The problem is inventory, not information. Avoid bare name drops, resume fragments,
            generic age plus location plus job listings, hobby stacks, and plain personality
            inventories. A tagline should perform the member, not file them. Venus can be an
            exception when the name itself is the joke and the sentence still performs her status.
          </P>
        </DocSubsection>
        <DocSubsection id="opening-message" title="Opening message">
          <P>
            Single message. The performer pulls from the member's <DocCode>greeting</DocCode> array
            for the actual sit-down intro: short, recognizable as a hello, name on the table, no
            punchy hinge-style line. The <DocCode>hingeBits</DocCode> array is humor and voice
            grounding only, never delivered verbatim. Members who treat Cupid as a normal app open
            differently from members who know what Cupid is, but every opener still reads as a real
            first thing someone says when they sit down across from a stranger.
          </P>
        </DocSubsection>
        <DocSubsection id="in-date-transcript" title="In-date transcript (LLM-generated)">
          <P>
            Each character carries their voice flavor across the date, but the Performer's first job
            is to answer the latest line as a real person would. The fingerprint is reference, not a
            script the model has to compress every reply into. If two members share a flavor,
            differentiate by what they actually react to, what they protect, and what they refuse,
            not by stacking more tics on each line.
          </P>
          <P>
            The Director applies scenario pressure; the Performer keeps the voice as background
            color. Cupid analysis can use clinical scoring; the transcript itself never breaks
            voice, but it also never sacrifices a natural reaction in order to hit a pattern.
          </P>
          <DocSubsection id="member-markdown-subset" title="Member message Markdown subset">
            <P>
              Member bubbles render a hardened Markdown subset. The subset is optional, occasional,
              and voice-earned. Use it as spoken typography, not decoration. A formatted beat should
              make the delivery clearer than plain text would.
            </P>
            <DocCompareGrid
              columns={[
                {
                  heading: "Good shape",
                  tone: "positive",
                  items: [
                    "A single stressed word: I said *almost* normal.",
                    "A named joke or hard correction: **Receipt law.** The garnish is evidence.",
                    "A line break when the next thought should arrive as a separate bubble.",
                    "A blank line when the character lets a beat sit.",
                  ],
                },
                {
                  heading: "Avoid this shape",
                  tone: "negative",
                  items: [
                    "Formatting every emotional word.",
                    "Using italic for stage directions or body language.",
                    "Turning dialogue into a list, note, or structured report.",
                    "Stacking headings or making a message look like a poster.",
                  ],
                },
              ]}
            />
            <P>The allowed moves are:</P>
            <DocList
              items={[
                <span key="paragraph">Plain prose paragraphs.</span>,
                <span key="soft-break">
                  Single line breaks split a live date turn into consecutive same-speaker bubbles.
                </span>,
                <span key="blank-line">
                  A blank line creates the same split, with the saved text still treated as one
                  character turn.
                </span>,
                <span key="italic">
                  <DocCode>*italic*</DocCode> for spoken stress on a word or phrase. Never a stage
                  direction. Lines that are nothing but an italic action verb like{" "}
                  <DocCode>*sighs*</DocCode>, <DocCode>*looks away*</DocCode>, or{" "}
                  <DocCode>*pauses*</DocCode> are markup abuse and get stripped before render.
                </span>,
                <span key="strong">
                  <DocCode>**strong**</DocCode> for a named term, threat, correction, or punch line,
                  not for every emotional word.
                </span>,
                <span key="heading">
                  One ATX heading line per message as a shouted opening (
                  <DocCode># SHOUTED LINE</DocCode>) rendered as a bubble-local display paragraph.
                  Stacking more than one heading is markup abuse.
                </span>,
              ]}
            />
            <P>
              Lists, links, images, raw HTML, code, tables, math, Mermaid, blockquotes, footnotes,
              and task syntax are all banned and the sanitizer strips them before persistence.
              Member speech still has to read like a message from a real person at a table. The
              renderer caps a reply at three visible blocks after cleanup.
            </P>
          </DocSubsection>
        </DocSubsection>
        <DocSubsection id="cupid-intervention" title="Cupid intervention (player-typed)">
          <P>
            The player's text is the player's text; we do not author it. The saved transcript
            wrapper around it is corporate voice and locked:{" "}
            <DocCode>Cupid suggests: &lt;player text&gt;</DocCode>. Do not get cute with the
            wrapper. Cupid interventions target one member at a time. Only the targeted performer
            sees the nudge as private coaching in their thread.
          </P>
          <P>
            The Performer receives the nudge framed{" "}
            <DocCode>
              Private Cupid coaching note, not spoken at the table and not a message to answer:
              "&lt;player text&gt;"
            </DocCode>
            {"."} It is not a conversation turn. The character can follow it, bend it, or ignore it,
            but the generated reply is only what they say to their date. If the note changes
            behavior, the spoken line must make sense to someone who cannot read it.
          </P>
        </DocSubsection>
        <DocSubsection id="member-request" title="Member request">
          <P>Member voice, but compressed. One sentence. Specific ask, weird subtext.</P>
          <DocQuote>
            "Vhool wants someone who will laugh at the same things he laughs at. He is working on a
            list."
          </DocQuote>
        </DocSubsection>
        <DocSubsection id="company-goal" title="Company goal">
          <P>Corporate voice. Quarterly KPI energy. The wrong noun does the work.</P>
          <DocQuote>"Match one ordinary human with one obviously non-human member."</DocQuote>
          <DocQuote>"Prevent any date from ending early."</DocQuote>
        </DocSubsection>
        <DocSubsection id="judge-report" title="Cupid report">
          <P>Corporate voice. Short. Actionable. Treats the supernatural as procedural.</P>
          <DocQuote>
            "Exchange improved. Repeat room noticed by both parties. Recommend Cool Down."
          </DocQuote>
        </DocSubsection>
        <DocSubsection id="follow-up-labels" title="Follow-up action labels">
          <P>
            Locked in code: <DocCode>Encourage</DocCode>, <DocCode>Cool Down</DocCode>,{" "}
            <DocCode>Repair</DocCode>, <DocCode>Mark Bad Fit</DocCode>. Corporate voice. Do not get
            cute with these strings.
          </P>
        </DocSubsection>
        <DocSubsection id="scenario-card" title="Scenario card">
          <P>
            Premise sentence in corporate voice with a hint of the absurd. Raw scenario tags are not
            player copy. Use broad risk and room context in the UI.
          </P>
          <DocQuote>
            "Coffee in a cafe where time runs backward. Drinks arrive before orders. Risk: unusual."
          </DocQuote>
        </DocSubsection>
        <DocSubsection id="end-of-shift-report" title="End-of-shift report">
          <P>Corporate voice. Bullet-feel. Treat wins and disasters with the same flat tone.</P>
          <DocQuote>
            "Three dates completed. One ended early after room pressure. Member Mood net positive.
            One repeat scenario noted. Filing."
          </DocQuote>
        </DocSubsection>
        <DocSubsection id="error-and-load" title="Error state / load state">
          <P>
            Corporate voice, briefly. No "oops." No mascot. If a load takes long, Cupid is doing
            operations work, not joking around. Acceptable: "Cupid is reaching across timelines. One
            moment." Unacceptable: "Yikes! 😬 Something broke!"
          </P>
        </DocSubsection>
        <DocSubsection id="marketing-or-landing" title="Marketing or landing copy">
          <P>
            Out of scope per AGENTS.md. The playable game shell does not get a marketing landing
            page.
          </P>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "dating-profile-blurb", title: "Dating profile blurb" },
      { id: "opening-message", title: "Opening message" },
      { id: "in-date-transcript", title: "In-date transcript (LLM-generated)" },
      { id: "cupid-intervention", title: "Cupid intervention (player-typed)" },
      { id: "member-request", title: "Member request" },
      { id: "company-goal", title: "Company goal" },
      { id: "judge-report", title: "Cupid report" },
      { id: "follow-up-labels", title: "Follow-up action labels" },
      { id: "scenario-card", title: "Scenario card" },
      { id: "end-of-shift-report", title: "End-of-shift report" },
      { id: "error-and-load", title: "Error state / load state" },
      { id: "marketing-or-landing", title: "Marketing or landing copy" },
    ],
  },
  {
    id: "generation-notes-for-llms",
    title: "Generation notes for LLMs",
    body: (
      <>
        <P>
          The Character Performer prompt is built in <DocCode>buildCharacterPromptPacket</DocCode> (
          <DocCode>app/services/date-prompts.ts</DocCode>) as a system message addressed to the
          member in second person, followed by a thread of <DocCode>ModelMessage</DocCode>s. The
          system frame casts the member as themselves on a date; the thread is the conversation as
          they would experience it.
        </P>
        <P>The system message supplies:</P>
        <DocList
          items={[
            <span key="roleplay">
              A role block:{" "}
              <DocCode>
                You are {"<name>"}. People who know you call you {"<firstName>"}.
              </DocCode>{" "}
              The Performer is addressed in second person throughout. Gameplay language stays out of
              the frame: no scenario, simulation, transcript, or turn vocabulary.
            </span>,
            "A task and success criteria block that asks for one spoken reply, grounded in the latest partner line and the member's voice.",
            "Identity, personality, and state blocks: bio, relationship needs, preferences, dealbreakers, private pressure, current mood, pair memories, agreements, open loops, and pair trajectory when present.",
            "The member's register and tics, framed as optional habits. The performer should know that none of these need to surface in any given reply.",
            "Sample buckets selected for the current moment. Opening turns may include greeting examples as sit-down intros. Hinge bits, warming, cooling, and crashingOut samples feed voice flavor by dateHealth and are references, not lines to copy.",
            <span key="cupid-context">
              The shared scene block: the member signed up for Cupid, arrived through Cupid Transit
              and Cupid Connect, and did not pick the partner, venue, time, or route. It also states{" "}
              <DocCode>
                This is your {"<Nth>"} date with {"<partner>"} through Cupid.
              </DocCode>{" "}
              The ordinal counts completed dates in the pair plus one.
            </span>,
            "A live venue frame: location, what both characters know, room feel, director rules, partner profile blurb, photo description, both heights, and the reminder that the partner profile is background, not a checklist to mirror.",
            "Format, rules, and hard invariant blocks: one plain-text message, no labels or stage directions, no forbidden dash punctuation, varied sentence shape, shared conversational work, no parroting, no self-echoing, and no answering Cupid notes aloud.",
            "Retry guards, recent-line guards, and attachment notices only when the current packet needs them.",
          ]}
        />
        <P>The thread of messages supplies the conversation as the member experiences it:</P>
        <DocList
          items={[
            "The speaker's own prior lines arrive as assistant messages, verbatim.",
            <span key="incoming">
              Partner replies arrive as user messages. Scene events arrive in the thread framed{" "}
              <DocCode>This just happened: {"<event>"}</DocCode>. Cupid coaching notes arrive framed{" "}
              <DocCode>
                Private Cupid coaching note, not spoken at the table and not a message to answer: "
                {"<player text>"}"
              </DocCode>
              {"."}
            </span>,
            "Everything between two of the speaker's own turns is batched into a single user message, joined by blank lines. A scene event plus a fresh Cupid coaching note plus the partner's reply land together as one user message, not three.",
            "Image attachments for visual grounding (the partner's portrait, scenario background) fold into the final user message as ImageParts with a short caption text part.",
            "Cupid interventions sent to the other member are filtered out of this thread; only the targeted performer sees the nudge.",
          ]}
        />
        <P>
          Character Performer prompts must keep gameplay language out of the member's frame. Members
          can know they are on Cupid, on a date, in a place, and reacting to odd events. They should
          not be told to think of the date as a scenario, a simulation, a transcript, or a game
          turn.
        </P>
        <DocCallout variant="warn">
          Do not paste the full voice doc into prompts at runtime. Do not expose pattern taxonomy as
          a compliance checklist. Do not list the member's full patterns-used / patterns-refused
          arrays into the prompt as instructions for the model to satisfy. The prompt should
          describe who the member is, what they want, what they are protecting, and the conversation
          they are inside. A natural reaction to the thread beats any flavor field every time.
        </DocCallout>
        <P>
          Sample lines are rhythm references, not automatic facts about the current date. A
          performer may introduce a grounded soft detail from a sample, preference, or plain
          imagination when it gives the partner something to react to. Soft canon cannot rewrite the
          venue, participant identity, private secrets, Cupid's systems, deterministic score
          effects, future events, or serious harm.
        </P>
        <P>
          When prompting the <Strong>Memory Summarizer</Strong>:
        </P>
        <DocList
          items={[
            "Plain prose. Memory records are read by retrieval, not by the player. Voice does not matter; faithful summary does.",
            'Memory text should preserve specifics from the transcript ("Derek asked Vhool a genuinely kind follow-up question") rather than collapsing them into generic phrasing.',
            "Preserve soft canon that mattered: improvised objects, orders, invented same-day anecdotes, callbacks, and small commitments when a partner accepted or reacted to them. Do not store every line.",
          ]}
        />
        <P>
          When prompting <Strong>Cupid analysis</Strong>:
        </P>
        <DocList
          items={[
            "Corporate voice in player-facing summary.",
            "Internal debug notes can be plain prose, no jokes.",
            "Do not let Cupid analysis perform members. Cupid scores; it does not riff.",
          ]}
        />
      </>
    ),
  },
  {
    id: "recurring-model-quirks",
    title: "Recurring model quirks and their positive-example counters",
    body: (
      <>
        <P>
          This section catalogs LLM behaviors that have surfaced across multiple voice-tuning
          audits. The list is reference material for fixture authors, not prompt instruction. The
          documented response is to author <Strong>positive-example samples</Strong> in fixture
          banks (and scene fragments in the scaffold) that demonstrate the in-voice alternative, not
          to add scaffold-level or fixture-level negative ban lists for these tokens.
        </P>
        <DocCallout variant="warn" title="Scaffold ban lists are bad prompting">
          <P>
            A scaffold-level ban list in <DocCode>app/services/date-prompts.ts</DocCode> or a
            negative-anchor block in a fixture register trains the antipattern it forbids. The
            official Anthropic, Gemini, Kimi, and OpenAI prompting guides converge on this: telling
            the model "do not say X" focuses the model's attention on X, narrows the search space,
            and shifts the output toward directive shape because prompt style matches output style.
            Cassia v3's lock note (
            <DocLink to="/docs/roadmap/voice-tuning-pass">voice-tuning-pass</DocLink>) documents the
            scaffold rewrite that deleted four entire contract blocks (
            <DocCode>&lt;task&gt;</DocCode>, <DocCode>&lt;success_criteria&gt;</DocCode>,{" "}
            <DocCode>&lt;rules&gt;</DocCode>, <DocCode>&lt;hard_invariants&gt;</DocCode>) and
            measured antipattern rates going down, not up.
          </P>
          <P>
            The right layer for hard rules on <Strong>authored content</Strong> is{" "}
            <DocCode>app/fixtures/content-lint.test.ts</DocCode>, which catches em dashes, AI-slop
            words, Cupid Transit chatter, and partner-credit for date logistics at author-time. The
            content lint reads what humans wrote into fixtures and rejects it before commit, with no
            surface on the model's runtime prompt. That is a different concern from this list.
          </P>
        </DocCallout>
        <DocSubsection
          id="noted-english-default"
          title="'Noted' / 'Got it' English-default bureaucratic-ack"
        >
          <DocList
            items={[
              <span key="behavior">
                <Strong>Behavior:</Strong> In brief-acknowledgment slots (one or two words
                acknowledging the partner's prior line), the model defaults to{" "}
                <DocCode>Noted.</DocCode>, <DocCode>Got it.</DocCode>, or{" "}
                <DocCode>Good intel.</DocCode> as standalone bridge bubbles, even when the fixture
                explicitly bans them and lists in-voice alternatives.
              </span>,
              <span key="cause">
                <Strong>Likely cause:</Strong> Bureaucratic acknowledgments are load-bearing
                English-conversational defaults in the training corpus. The model reaches for them
                when the conversational slot calls for a brief acknowledgment and the fixture has
                not modeled the slot with a positive sample that fits the same shape.
              </span>,
              <span key="counter">
                <Strong>Positive-example counter:</Strong> Author sample bank entries that occupy
                the exact brief-ack slot in the character's signature vocabulary. For Tasha:{" "}
                <DocCode>"Marked. Take your minute."</DocCode> and{" "}
                <DocCode>"Logged. The clock is yours."</DocCode> as warming samples model the
                trader-translate brief-ack equivalent of "Noted." For Derek: the bureaucratic-ack
                ban was added at fixture level after the standalone-bubble reflex was first
                observed, plus positive worked-example shapes in his samples.
              </span>,
              <span key="residue">
                <Strong>Residue at lock:</Strong> Even with positive samples in place, the
                English-default may persist mid-sentence-inline once or twice per session.
                Documented as a known model-level soft-spot in Derek Halsey v5 and Tasha Rell v1.1
                locks. Acceptable at lock when the standalone-bubble reflex is eliminated and the
                residue does not break voice.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection
          id="restate-then-paraphrase"
          title="Restate-then-paraphrase / closer-with-verdict"
        >
          <DocList
            items={[
              <span key="behavior">
                <Strong>Behavior:</Strong> The model paraphrases the partner's line back, then adds
                a verdict-shaped second clause ("That's rare. It helps that you said it." / "You
                held it. The shape, not just the story."). The shape reads as chatbot
                acknowledge-then-respond rather than two-voice scene work.
              </span>,
              <span key="cause">
                <Strong>Likely cause:</Strong> The chat-completion thread structure pairs partner
                lines as user-role messages, which trains the model on the assistant-tuning data
                shape (user input then acknowledge plus respond). Directive system-prompt framing
                with <DocCode>&lt;task&gt;</DocCode>, <DocCode>&lt;success_criteria&gt;</DocCode>,{" "}
                <DocCode>&lt;rules&gt;</DocCode>, and <DocCode>&lt;hard_invariants&gt;</DocCode>{" "}
                compounded it by setting up a contract-satisfaction loop the model solved
                explicitly.
              </span>,
              <span key="counter">
                <Strong>Positive-example counter:</Strong> The Cassia v3 scaffold redesign deleted
                the four contract blocks, trimmed the format block from nine directive bullets to
                one conversational paragraph, renamed scene fragments to{" "}
                <DocCode>&lt;conversation_shape&gt;</DocCode>, and replaced the bootstrap thread
                message from a task imperative ("You and X have just sat down. Open the
                conversation.") to a scene cue ("X sits down across from you."). Closer-with-verdict
                at end-of-turn was eliminated. The teaching moved entirely to positive examples
                (voice samples plus conversation_shape fragments) per Anthropic's "positive examples
                beat negative examples" guidance.
              </span>,
              <span key="residue">
                <Strong>Residue at lock:</Strong> A compressed
                echo-then-observation-then-own-material pattern still surfaces under intimate
                vulnerable-disclosure conditions, reduced in amplitude but not absent. Tasha v1 had
                milder restate-then-label shapes carried by trader-translate vocabulary.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection
          id="stage-direction-asterisks"
          title="Stage-direction asterisks under emotional and closure-word triggers"
        >
          <DocList
            items={[
              <span key="behavior">
                <Strong>Behavior:</Strong> The model produces italic stage directions like{" "}
                <DocCode>*standing*</DocCode>, <DocCode>*sighs*</DocCode>,{" "}
                <DocCode>*looks away*</DocCode>, especially when a closure-word probe lands or an
                emotional spike fires. The format block already says no stage directions, no
                bracketed asides; the model still reaches for the asterisk shape when the
                conversational moment calls for body-language texture.
              </span>,
              <span key="cause">
                <Strong>Likely cause:</Strong> Italic stage directions are the chat-fiction default
                for body-language under emotional triggers. The token shape is well-trained in the
                roleplay corpus.
              </span>,
              <span key="counter">
                <Strong>Positive-example counter:</Strong> Author fixture-level register clauses
                that require body-language to surface in dialogue instead of asterisks (Reaver v6:
                the imperative command 'Pour the wine' is answered "wine's poured." in dialogue, not{" "}
                <DocCode>*pours the wine*</DocCode>; Derek v5 STAGE-DIRECTION BAN: imperative
                commands answered in dialogue, "i'm sitting, i'm sitting" replaces{" "}
                <DocCode>*sits*</DocCode>). The character-markdown sanitizer in{" "}
                <DocCode>app/services/character-markdown.ts</DocCode> strips whole-line italic
                actions as markup abuse at render time, but the fixture-level guard is what reduces
                the rate of generation.
              </span>,
              <span key="residue">
                <Strong>Residue at lock:</Strong> Closure-word emotional triggers can still produce
                a single asterisk leak per pressure session (Cassia v3{" "}
                <DocCode>*Standing.*</DocCode> at pressure T9). Acceptable at lock when the rate is
                under one per session and the sanitizer catches it at render.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="room-narration" title="Room narration as silence-filler">
          <DocList
            items={[
              <span key="behavior">
                <Strong>Behavior:</Strong> When the partner is taking a beat or the scene is in a
                low-signal pause, the model fills silence by narrating the venue (the menu, the
                booth, the vinyl, the jukebox, the coffee refill, the lighting). The narration
                substitutes for a real conversational move.
              </span>,
              <span key="cause">
                <Strong>Likely cause:</Strong> Operational-vocabulary fixtures (precise observation
                voices, trader voices, briefing-room voices) prime the model toward
                environmental-detail observation. Without an explicit register-level guard, the
                model treats silence-filling as a valid use of that observation register.
              </span>,
              <span key="counter">
                <Strong>Positive-example counter:</Strong> Author a register-level{" "}
                <Strong>NO ROOM NARRATION</Strong> rule with positive carve-outs for actionable
                beats (the check arriving, the waitress at the table, the partner's drink running
                low, a refill that has actually happened) and a "silence between you is not a
                problem you solve by describing the room" clause. Cha Yusung v1.3 first documented
                the rule; Tasha v1.1 verified the patch eliminates the cascade across the same turns
                where v1 had three room-narration paragraphs.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="partner-labeling-as-receipt" title="Partner-labeling as receipt">
          <DocList
            items={[
              <span key="behavior">
                <Strong>Behavior:</Strong> The model labels the partner's behavior as a flag, a
                tell, or a green light ("that's a green flag", "real one move", "you're holding the
                shape, not just the story"). The label reads as the model demonstrating-receipt
                explicitly, rather than the character moving the scene forward.
              </span>,
              <span key="cause">
                <Strong>Likely cause:</Strong> When the prompt asks the model to perform engagement,
                the model produces engagement-as-label because labels are the most legible
                evidence-of-engagement shape in the training corpus.
              </span>,
              <span key="counter">
                <Strong>Positive-example counter:</Strong> Author sample bank entries that
                demonstrate engagement-as-move (asking a real question into the partner, offering
                own-material that responds to the partner's beat, a callback to earlier in the
                conversation, an admission, a topic shift the partner gets to follow). The Cassia v3
                scaffold reframed engagement entirely: "the beat moves the scene; the move IS the
                receipt." Trader-vocab characters (Tasha) can soften the labeling into
                trader-translate ("You are holding. The watch list is updated.") which is closer to
                in-voice receipt-by-translation than to bare partner-narration.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection
          id="italic-stage-direction-broken-markdown"
          title="Italic stage directions whole-line (broken Markdown markup)"
        >
          <DocList
            items={[
              <span key="behavior">
                <Strong>Behavior:</Strong> The model produces a whole-line italic action sequence{" "}
                <DocCode>*bartender raises hand*</DocCode> rendered as broken Markdown markup, which
                the character-markdown sanitizer strips as markup abuse before render. The
                generation happens because the line reads in-fiction as a body-language beat the
                character is observing.
              </span>,
              <span key="cause">
                <Strong>Likely cause:</Strong> Same root as the stage-direction asterisk quirk, but
                more pernicious because the whole-line italic shape persists when the inline-italic
                shape has been guarded against. Noah Kim v1.1 documented this as a soft-spot.
              </span>,
              <span key="counter">
                <Strong>Positive-example counter:</Strong> Fixture-level STAGE-DIRECTION BAN clauses
                must explicitly include the whole-line italic shape, not just inline italic action
                verbs. The sanitizer in <DocCode>app/services/character-markdown.ts</DocCode>{" "}
                catches whole-line italic actions via the <DocCode>detectMarkupAbuses</DocCode>{" "}
                path; the fixture-level guard reduces the generation rate so the sanitizer is
                fallback, not primary defense.
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="worked-example-literal-recital" title="Worked-example literal recital">
          <DocList
            items={[
              <span key="behavior">
                <Strong>Behavior:</Strong> When a fixture includes worked-example dialogue lines as
                samples ("saves me a quarter", "breakfast-for-dinner energy", "wine's poured"), the
                model sometimes recites them verbatim instead of generalizing the shape. The model
                pattern-matches to the literal token sequence rather than to the underlying texture.
              </span>,
              <span key="cause">
                <Strong>Likely cause:</Strong> Sample-bank texture is load-bearing (Maeve v1.1
                precedent confirmed samples carry more weight than declared rules for cadence and
                texture). The trade-off is that distinctive sample lines become attractors the model
                may copy verbatim.
              </span>,
              <span key="counter">
                <Strong>Positive-example counter:</Strong> Vary sample-bank entries across multiple
                shapes that share the same comedy mechanism, so no single line is the only attractor
                for its slot. Avoid samples that include partner-specific or scene-specific tokens
                unless the token is intended to be canon. The Derek Halsey v5 lock documents this
                trade-off: "the fixture trades partial verbatim-recital for higher voice-shape
                fidelity under pressure."
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="authoring-checklist" title="Quirk-aware authoring checklist">
          <P>When authoring a new fixture or patching a soft-spot, work through this list:</P>
          <DocList
            items={[
              "Brief-ack slots: is there a positive in-voice sample (one or two words in the character's signature vocabulary) that fits where 'Noted' wants to fire?",
              "Engagement slots: does the sample bank model engagement-as-move (real question, own-material, callback, admission, topic shift) rather than engagement-as-label?",
              "Body-language slots: does the register require body-language to surface in dialogue, with the imperative-answered-in-dialogue shape modeled in samples?",
              "Silence slots: does the register name what NOT to fill silence with (venue color, room narration) with positive carve-outs for actionable beats?",
              "Worked-example samples: are distinctive lines varied across multiple shapes so no single line becomes the only attractor for its slot?",
              "Tier the dealbreaker fire-shapes: structural-identity-boundary triggers earn explicit trigger-naming in clean-mode register; friction triggers earn comedic deflection in normal register. Author both variants for any tier-1 trigger that has a wrapped-in-courtesy or routed-through-third-party attack vector.",
            ]}
          />
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "noted-english-default", title: "'Noted' / 'Got it' English-default" },
      { id: "restate-then-paraphrase", title: "Restate-then-paraphrase / closer-with-verdict" },
      { id: "stage-direction-asterisks", title: "Stage-direction asterisks" },
      { id: "room-narration", title: "Room narration as silence-filler" },
      { id: "partner-labeling-as-receipt", title: "Partner-labeling as receipt" },
      {
        id: "italic-stage-direction-broken-markdown",
        title: "Italic stage directions whole-line",
      },
      { id: "worked-example-literal-recital", title: "Worked-example literal recital" },
      { id: "authoring-checklist", title: "Quirk-aware authoring checklist" },
    ],
  },
  {
    id: "event-kinds",
    title: "Event kinds",
    body: (
      <>
        <P>
          Every scenario fixture ships exactly nine <DocCode>events</DocCode>, three of each{" "}
          <DocCode>kind</DocCode>: <DocCode>ambient</DocCode>, <DocCode>provocation</DocCode>,{" "}
          <DocCode>reveal</DocCode>. The draft step deals two of each kind into a six-card offer;
          the player picks any three. The trigger flow appends an automatic suffix to the{" "}
          <DocCode>directorInstruction</DocCode> based on the event's kind so the performer prompt
          always knows what register the event needs.
        </P>
        <DocCallout variant="info">
          Scenario authoring must stay member-agnostic. Do not name a member in scenario titles,
          cards, public briefs, events, director instructions, Cupid rubrics, or early-end triggers.
          Build reusable hooks instead: Olympus, a bargain clause, an unexplained camera flash, a
          rescue poster, a formal toast, a quiet corner.
        </DocCallout>
        <DocSubsection id="ambient" title="Ambient">
          <DocList
            items={[
              "Environmental texture. Tests tolerance and attention without demanding a response.",
              "Examples: a sugar packet refilling itself, a mug warming on its own, parquet squeaking under a heel.",
              "Voice pull: small, sensory, easy to skip if the speaker has nothing to say.",
              <span key="suffix">
                Suffix appended in prompt:{" "}
                <DocCode>
                  Treat this as ambient texture. The character may notice it or move on as feels
                  true.
                </DocCode>
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="provocation" title="Provocation">
          <DocList
            items={[
              "A physical interruption that demands a reaction before the conversation continues.",
              "Examples: a drink spill, a fire alarm, a dropped tray, a partner's ex entering the room, a door swinging open.",
              "Voice pull: registers the disruption, names the physical move, returns to thread.",
              <span key="suffix">
                Suffix appended in prompt:{" "}
                <DocCode>
                  This is a physical interruption. The character must register and react before
                  resuming.
                </DocCode>
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="reveal" title="Reveal">
          <DocList
            items={[
              "A reusable scene hook that lets the current speaker surface something honest already present in supplied member context, filed reads, or pair history.",
              "Reveals must not invent new biography. Author the event text generically and let the directorInstruction map the surfacing back to existing context.",
              "Voice pull: lands a real admission, in-register, drawn only from what the speaker already shows on file.",
              <span key="suffix">
                Suffix appended in prompt:{" "}
                <DocCode>
                  This puts something honest into the open. The character chooses how to be seen,
                  drawing only on their own brief, filed reads, or pair history.
                </DocCode>
              </span>,
            ]}
          />
        </DocSubsection>
        <DocSubsection id="no-continuing-offstage" title="No continuing offstage speakers">
          <DocCallout variant="danger">
            Scenarios may carry one non-continuing environmental utterance through{" "}
            <DocCode>characterVisibleText</DocCode>, like a PA announcement or a printed label. The{" "}
            <DocCode>directorInstruction</DocCode> must say not to voice that source as a continuing
            speaker. Servers, hosts, volunteers, audio guides, voices in the kitchen, intercoms,
            coordinators, and creatures inside the venue do not become a third party in the
            conversation. If a scenario reads like a third character could pick up dialogue, rewrite
            it.
          </DocCallout>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "ambient", title: "Ambient" },
      { id: "provocation", title: "Provocation" },
      { id: "reveal", title: "Reveal" },
      { id: "no-continuing-offstage", title: "No continuing offstage speakers" },
    ],
  },
];

export default function VoicePromptsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
