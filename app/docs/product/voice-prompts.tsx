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
    "How the voice rules apply per surface (profile, opener, transcript, intervention, judge, scenario card) and how prompts feed Performer, Memory Summarizer, and Judge.",
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
            Single message. The opener can let voice flavor run, since the character has not yet had
            to react to a real partner. It should still read like a real first message that should
            not have been sent, not like a polished comedy bit. Members who treat Cupid as a normal
            app open differently from members who know what Cupid is.
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
            color. The Judge is allowed to break voice for clinical scoring; the transcript itself
            never breaks voice, but it also never sacrifices a natural reaction in order to hit a
            pattern.
          </P>
        </DocSubsection>
        <DocSubsection id="cupid-intervention" title="Cupid intervention (player-typed)">
          <P>
            The player's text is the player's text; we do not author it. The wrapper around it is
            corporate voice and locked: <DocCode>Cupid suggests: &lt;player text&gt;</DocCode>. Do
            not get cute with the wrapper. Cupid interventions target one member at a time. Only the
            targeted performer sees the nudge in their thread.
          </P>
          <P>
            The Performer receives the nudge as an in-thread user message framed{" "}
            <DocCode>Your dating manager just texted you: "&lt;player text&gt;"</DocCode>, not as a
            system directive. The character reacts to it as a text from their dating manager. They
            can take it, push back on it, refuse it, resent it, or joke about it.
          </P>
        </DocSubsection>
        <DocSubsection id="member-request" title="Member request">
          <P>Member voice, but compressed. One sentence. Specific ask, weird subtext.</P>
          <DocQuote>
            "Vhool wants someone who will laugh at the same things they laugh at. They are working
            on a list."
          </DocQuote>
        </DocSubsection>
        <DocSubsection id="company-goal" title="Company goal">
          <P>Corporate voice. Quarterly KPI energy. The wrong noun does the work.</P>
          <DocQuote>"Match one ordinary human with one obviously non-human member."</DocQuote>
          <DocQuote>"Prevent any date from ending early."</DocQuote>
        </DocSubsection>
        <DocSubsection id="judge-report" title="Judge report">
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
      { id: "judge-report", title: "Judge report" },
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
              A roleplay opener:{" "}
              <DocCode>
                You are {"<name>"}. People who know you call you {"<firstName>"}.
              </DocCode>{" "}
              The Performer is addressed in second person throughout. Gameplay language stays out of
              the frame: no scenario, simulation, transcript, or turn vocabulary.
            </span>,
            "A compact character card: bio, current need, what relaxes them, what makes them guarded, and private pressure as subtext.",
            "The member's conversational register and a few habits from the voice block, framed as optional pressure tells rather than required words. The performer should know that none of these need to surface in any given reply.",
            "One to four sample lines from the member fixture, selected for the current moment. Framed as reference for how they sound when fully themselves, not lines to copy.",
            <span key="cupid-context">
              The shared Cupid context block: the member signed up for a dating app whose platform
              crosses dimensions, a Cupid dating manager set this date up and can text them
              privately during it, and{" "}
              <DocCode>
                This is your {"<Nth>"} date with {"<partner>"} through Cupid.
              </DocCode>{" "}
              The ordinal counts completed dates in the pair plus one.
            </span>,
            "A live scene frame: location, what both characters know about the place, room feel from director tone, and any director rules worth remembering. Then the partner's dating profile blurb, profile photo description, both heights, and a reminder that the speaker does not know the partner's private biography.",
            "Pair context when present: relevant self / pair / place memories, active agreements between them, and open loops still hanging, rewritten into character voice.",
            "A short \"How you write\" block: one short message at a time, plain text, no stage directions or markdown, no echoing the partner back, no closing the date in one line. Recent-line guards list the speaker's last few lines as do-not-repeat and the partner's last few lines as do-not-echo.",
          ]}
        />
        <P>The thread of messages supplies the conversation as the member experiences it:</P>
        <DocList
          items={[
            "The speaker's own prior lines arrive as assistant messages, verbatim.",
            <span key="incoming">
              Partner replies arrive as user messages. Scene events arrive in the thread framed{" "}
              <DocCode>This just happened: {"<event>"}</DocCode>. Cupid nudges arrive framed{" "}
              <DocCode>Your dating manager just texted you: "{"<player text>"}"</DocCode>.
            </span>,
            "Everything between two of the speaker's own turns is batched into a single user message, joined by blank lines. A scene event plus a fresh Cupid nudge plus the partner's reply land together as one user message, not three.",
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
          When prompting the <Strong>Judge</Strong>:
        </P>
        <DocList
          items={[
            "Corporate voice in player-facing summary.",
            "Internal debug notes can be plain prose, no jokes.",
            "Do not let the Judge perform members. The Judge scores; it does not riff.",
          ]}
        />
      </>
    ),
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
          cards, public briefs, events, director instructions, judge rubrics, or early-end triggers.
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
