import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "workflows/add-date-scenario",
  group: "workflows",
  title: "Add a date scenario",
  description:
    "Content pass for one scenario fixture: flow type, room test, fixture fields, event deck, tag rules, registration, and validation.",
  order: 1,
};

export const lede = (
  <>
    Use this checklist when adding or heavily revising one date scenario. The code contract lives in{" "}
    <DocCode>dateScenarioSchema</DocCode> in <DocCode>app/domain/game.ts</DocCode>, current fixtures
    live in <DocCode>app/fixtures/scenarios/</DocCode>, and behavior is checked by{" "}
    <DocCode>app/fixtures/scenarios/scenarios.test.ts</DocCode>.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "scope",
    title: "Scope",
    body: (
      <P>
        This workflow is the content pass. Complete the scenario's nonvisual game content in one
        pass, then hand visual design and background art to{" "}
        <DocLink to="/docs/workflows/visual-asset-iteration">Visual asset iteration</DocLink>. Do
        not generate background images or image prompts in the fixture pass.
      </P>
    ),
  },
  {
    id: "read-first",
    title: "Read first",
    body: (
      <DocList
        items={[
          <span key="voice">
            <DocLink to="/docs/product/voice-prompts">Runtime voice surfaces</DocLink> for event
            kinds, no continuing offstage speakers, and scenario card voice.{" "}
            <DocLink to="/docs/product/voice">Voice system</DocLink> for the register and prose
            rules every scenario card and Cupid line must obey.
          </span>,
          <span key="prompt-authoring">
            <DocLink to="/docs/product/prompt-authoring">Prompt authoring guidance</DocLink> before
            adding event instructions, negative rules, examples, or runtime prompt pressure.
          </span>,
          <span key="match-fit">
            <DocLink to="/docs/gameplay/match-fit">Match fit</DocLink> for tag-driven booking
            pressure and boundary risk.
          </span>,
          <span key="tags">
            <DocLink to="/docs/gameplay/member-fields-and-tags">Member fields and tags</DocLink> for
            the request tag taxonomy that scenarios overlap with.
          </span>,
          <span key="knowledge">
            <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink> for what the
            player can see at brief and after the date.
          </span>,
          <span key="image-style">
            <DocLink to="/docs/product/image-style">Image style</DocLink> for scenario background
            acceptance checks.
          </span>,
          <span key="fixtures">
            Existing scenario fixtures in <DocCode>app/fixtures/scenarios/</DocCode>.
          </span>,
          <span key="services">
            <DocCode>app/services/match-fit.ts</DocCode>,{" "}
            <DocCode>app/services/player-knowledge.ts</DocCode>,{" "}
            <DocCode>app/services/date-engine.ts</DocCode>, and{" "}
            <DocCode>app/services/date-prompts.ts</DocCode> when changing tags, event behavior,
            visibility, or prompt pressure.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "design-pass",
    title: "Design pass",
    body: (
      <>
        <P>
          Start with the kind of situation the scenario puts members in. The flow is the scenario's
          operating type; the event kinds are the later draft deck inside that type.
        </P>
        <DocSteps
          items={[
            "Pick the primary flow first: conversation, activity, pressure, or set_piece.",
            "Define the room as reusable date pressure, not as a scene for one named member.",
            "Pick the practical date shape: meal, errand, ceremony, public room, quiet room, timed task, shared object, performance pressure, evolving set piece, or another clear frame.",
            "Identify what the room tests: privacy, prophecy, memory, public attention, career pressure, low-pressure care, weirdness tolerance, planning, intimacy, physical cooperation, or choice under time pressure.",
            "Confirm the scenario can work for many pairs. It can favor archetypes through hooks, but it must not name a member.",
            "Note whether the scenario needs background art later. The fixture can exist without a manifest entry, in which case the runtime falls back to the Aura mesh.",
          ]}
        />
      </>
    ),
  },
  {
    id: "title",
    title: "Title",
    body: (
      <>
        <P>
          Aim for a joke first, if one fits. The strongest scenario titles are real English phrases
          whose meaning literally describes the room. "Dim Sum and Then Some" works because the
          idiom means "and more," and the room is dim sum and more. "Cart Before The Horse" works
          because the cafe runs in wrong order. "Belly Of The Beast" works because you are inside a
          leviathan. "Let Sleeping Giants Lie" works because the picnic blanket sits on one.
        </P>
        <P>
          A punchline lifted from the premise is a strong fallback. "The Bear Is Real," "Consent Is
          The Appetizer," and "Name Tag: Emotional Availability" all state the absurd flat.
        </P>
        <P>
          Deadpan-concrete titles are fine when no joke fits. "Couch Night, Two Containers" and
          "Executive Lunch, One Agenda Item" do the work by naming the room and one telling detail.
          Do not force a pun that only rhymes. The bar is that the title should mean the room, not
          just sound like a word in it.
        </P>
      </>
    ),
  },
  {
    id: "fixture-requirements",
    title: "Fixture requirements",
    body: (
      <>
        <P>
          Add <DocCode>app/fixtures/scenarios/&lt;scenario-id&gt;.ts</DocCode> with a{" "}
          <DocCode>DateScenario</DocCode> object that satisfies{" "}
          <DocCode>dateScenarioSchema</DocCode>:
        </P>
        <DocList
          items={[
            <span key="id">
              <DocCode>id</DocCode>: stable kebab-case scenario id.
            </span>,
            <span key="title">
              <DocCode>title</DocCode>: player-facing card title. See{" "}
              <DocLink to="/docs/workflows/add-date-scenario#title">Title</DocLink> for the
              funny-first principle.
            </span>,
            <span key="summary">
              <DocCode>card.summary</DocCode>: short Cupid corporate premise.
            </span>,
            <span key="card-tags">
              <DocCode>card.tags</DocCode>: one or more tags from{" "}
              <DocCode>scenarioTagSchema</DocCode>.
            </span>,
            <span key="riskinit">
              <DocCode>card.risk</DocCode>, <DocCode>card.intimacy</DocCode>,{" "}
              <DocCode>card.chaos</DocCode>: <DocCode>low</DocCode>, <DocCode>medium</DocCode>, or{" "}
              <DocCode>high</DocCode>.
            </span>,
            <span key="ideal">
              <DocCode>card.idealFor</DocCode>: reusable archetype hints, not member names.
            </span>,
            <span key="bad">
              <DocCode>card.badFor</DocCode>: reusable pressure warnings, not member names.
            </span>,
            <span key="brief">
              <DocCode>publicBrief.location</DocCode>: concrete booking location.
            </span>,
            <span key="premise">
              <DocCode>publicBrief.premise</DocCode>: what makes this room distinct.
            </span>,
            <span key="know">
              <DocCode>publicBrief.whatBothCharactersKnow</DocCode>: shared starting facts.
            </span>,
            <span key="open">
              <DocCode>publicBrief.openingSituation</DocCode>: what is physically happening at turn
              one.
            </span>,
            <span key="director">
              <DocCode>director.tone</DocCode>: scene pressure and texture for prompts.
            </span>,
            <span key="flow">
              <DocCode>director.flow</DocCode>: one of <DocCode>conversation</DocCode>,{" "}
              <DocCode>activity</DocCode>, <DocCode>pressure</DocCode>, or{" "}
              <DocCode>set_piece</DocCode>. This sets the default date length and judge cadence.
            </span>,
            <span key="rules">
              <DocCode>director.rules</DocCode>: at least one hard scene rule.
            </span>,
            <span key="events">
              <DocCode>director.events</DocCode>: exactly nine events.
            </span>,
            <span key="early">
              <DocCode>director.earlyEndTriggers</DocCode>: concrete reasons Cupid may end the date
              early.
            </span>,
            <span key="repeat">
              <DocCode>director.repeatBehavior</DocCode>: how repeated use should feel for the same
              pair.
            </span>,
            <span key="success">
              <DocCode>judgeRubric.successSignals</DocCode>: what good exchanges look like.
            </span>,
            <span key="failure">
              <DocCode>judgeRubric.failureSignals</DocCode>: what bad exchanges look like.
            </span>,
            <span key="focus">
              <DocCode>judgeRubric.statFocus</DocCode>: one or more entries from{" "}
              <DocCode>relationshipStatSchema</DocCode>.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "flow",
    title: "Flow",
    body: (
      <>
        <P>
          Pick the date flow from what the room asks the pair to do. This is the scenario's type:
          conversational rooms are designed to keep members with each other, activity rooms put
          shared handling in their hands, pressure rooms demand a choice, and set pieces evolve
          through multiple physical beats. Do not add custom turn counts to individual fixtures. The
          runtime resolves the preset into a saved <DocCode>turnLimit</DocCode> and{" "}
          <DocCode>judgeTurnInterval</DocCode> when the session starts. Test and debug harnesses
          that need a fixed length should set <DocCode>dateMessageLimitOverride</DocCode>;{" "}
          <DocCode>defaultDateMessageLimit</DocCode> remains the legacy setting and should not be
          used to express "pick exactly the default number."
        </P>
        <DocList
          items={[
            <span key="conversation">
              <Strong>conversation:</Strong> twelve turns, judge every six. Use for diners, bars,
              quiet rooms, benches, transit compartments, and rooms where the main test is talking
              or sitting with attention. The opening situation should establish seating and
              immediate shared context, not load the first prompt with prop details the model will
              echo. Tune for members asking, answering, admitting, disagreeing, joking, or letting a
              quiet beat sit.
            </span>,
            <span key="activity">
              <Strong>activity:</Strong> fourteen turns, judge every four. Use for meals with shared
              handling, crafts, errands, games, and task dates where members should make repeated
              small choices. The target is dialogue shaped by handling, not a report about handling.
            </span>,
            <span key="pressure">
              <Strong>pressure:</Strong> eight turns, judge every four. Use for moral dilemmas,
              public exposure, prophecy, command decisions, and rooms where drifting would weaken
              the premise. Actions may become real between lines when a member commits to a move or
              an event lands; the next line should answer the consequence as dialogue.
            </span>,
            <span key="set-piece">
              <Strong>set_piece:</Strong> sixteen turns, judge every four. Use for evolving rooms,
              escape-room structures, loops, performances, and action dates with multiple physical
              beats. Each beat should create something the next member can answer, choose, refuse,
              or escalate.
            </span>,
          ]}
        />
        <DocCallout variant="warn" title="Do not sort scenarios by event kind">
          <P>
            <DocCode>ambient</DocCode>, <DocCode>provocation</DocCode>, and{" "}
            <DocCode>reveal</DocCode> are required event-card kinds, not scenario categories. A
            pressure scenario still ships quiet ambient events; a conversation scenario still ships
            provocations. The flow decides the situation and cadence.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "event-requirements",
    title: "Event requirements",
    body: (
      <>
        <P>
          Every scenario ships exactly nine events: 3 ambient, 3 provocation, 3 reveal. These are
          draftable scene beats inside the selected flow, not the scenario's design category. Events
          are real shifts in the room, not whispers of ambient flavor. When the player drops one,
          the next character turn must visibly engage with it. Author each event as something that
          can move the mood or direction of the date. An event should change the live situation, not
          merely make an unused prop available.
        </P>
        <P>
          Pressure and set-piece events need a consequence on arrival. "The controller is lifted,
          but nothing has moved" leaves the performers waiting for permission. "The first move has
          already cost a pawn" gives them something to reason about, react to, and answer in
          dialogue.
        </P>
        <P>
          Author pressure consequences as playable facts, not narration instructions. The target
          response is natural dialogue that treats the consequence as already visible: a member can
          gasp at a living chess piece, refuse the next move, take the next move, accuse the room,
          or ask the partner what they just did.
        </P>
        <P>Each event needs:</P>
        <DocList
          items={[
            <span key="id">
              <DocCode>id</DocCode>: unique within the scenario.
            </span>,
            <span key="title">
              <DocCode>title</DocCode>: short event title shown on the pick card and gauge button.
              Plain phrase, no em dashes.
            </span>,
            <span key="kind">
              <DocCode>kind</DocCode>: <DocCode>ambient</DocCode>, <DocCode>provocation</DocCode>,
              or <DocCode>reveal</DocCode>.
            </span>,
            <span key="pitch">
              <DocCode>pitch</DocCode>: one sentence shown to the player at pick time. State plainly
              what dropping this event will do to the date in player vocabulary. No em dashes, no
              stat numbers, no fixture-only jargon.
            </span>,
            <span key="beat">
              <DocCode>beat</DocCode>: plain prose narration that lands in the transcript when the
              player drops the event. Describe what shifts in the room. No bracketed stage
              directions, no asterisks, no quoted dialogue from third parties.
            </span>,
            <span key="director">
              <DocCode>directorBeat</DocCode>: explicit instruction for the next character turn,
              wired into the system prompt. Tell the LLM what the responding character should do or
              choose as a positive target. The kind suffix is appended automatically.
            </span>,
          ]}
        />
        <P>Use event kinds this way:</P>
        <DocList
          items={[
            <span key="ambient">
              <Strong>ambient:</Strong> the room shifts in a quiet way. The character must let it
              color their next beat even if they do not name it directly.
            </span>,
            <span key="provocation">
              <Strong>provocation:</Strong> a physical interruption. The character must register and
              react before resuming.
            </span>,
            <span key="reveal">
              <Strong>reveal:</Strong> something honest surfaces. The character engages with it from
              what they already know about themselves or the pair. It must not invent new biography.
            </span>,
          ]}
        />
        <DocCallout variant="danger" title="Beat copy hygiene">
          <P>
            The <DocCode>beat</DocCode> string is appended to the transcript as plain prose and seen
            by the character LLM. Authoring choices leak straight into character replies. Use a
            clear result-first beat, then keep the constraint list short.
          </P>
          <DocList
            items={[
              "No em dashes anywhere in pitch, beat, or title. They are user-facing.",
              "No bracketed stage directions like [she tilts] and no asterisk-wrapped actions like *folds hands*. Both leak as narration in character replies.",
              "Third-party figures (servers, hosts, crowds, machines, creatures) may act in the beat but must not be quoted speaking. Quoted dialogue from a non-character introduces an invisible speaker the model will start answering.",
              "Italic emphasis with single asterisks around words is fine when needed for rendering. Action wraps are not.",
              "Keep the beat to plain prose: what just shifted in the room. The character's reaction belongs to the next turn, not to the beat copy.",
            ]}
          />
        </DocCallout>
        <DocCallout variant="danger" title="No continuing offstage speakers">
          <P>
            Offstage people, announcements, hosts, servers, machines, creatures, crowds, and other
            environmental sources must not become a continuing third speaker. If a beat references
            an utterance, sign, label, voice, or role, the <DocCode>directorBeat</DocCode> must
            explicitly prevent that source from being voiced as continuing dialogue.{" "}
            <DocCode>scenarios.test.ts</DocCode> checks common violations.
          </P>
        </DocCallout>
      </>
    ),
  },
  {
    id: "tag-and-scoring-rules",
    title: "Tag and scoring rules",
    body: (
      <DocList
        items={[
          <span key="taxonomy">
            Use scenario tags from <DocCode>scenarioTagSchema</DocCode>: <DocCode>temporal</DocCode>
            , <DocCode>cosmic</DocCode>, <DocCode>domestic</DocCode>, <DocCode>career</DocCode>,{" "}
            <DocCode>prophecy</DocCode>, <DocCode>memory</DocCode>, <DocCode>public</DocCode>,{" "}
            <DocCode>haunted</DocCode>, <DocCode>food</DocCode>, <DocCode>low_pressure</DocCode>,{" "}
            <DocCode>high_pressure</DocCode>, <DocCode>repeat_risk</DocCode>.
          </span>,
          <span key="services">
            Tags affect match fit and player knowledge in{" "}
            <DocCode>app/services/match-fit.ts</DocCode> and{" "}
            <DocCode>app/services/player-knowledge.ts</DocCode>.
          </span>,
          "If a new scenario tag is required, add it to the schema, update service handling, update product docs, and add tests in the same change.",
          "Do not use raw tags as player-facing copy.",
          "Risk, intimacy, and chaos are visible card signals, but exact pressure math and rule hits stay hidden.",
        ]}
      />
    ),
  },
  {
    id: "visual-assets-out-of-scope",
    title: "Visual assets out of scope",
    body: (
      <DocCallout variant="danger" title="No image prompts or generation here">
        <P>
          Do not create image prompts, generate background images, or commit new scenario background
          files in this content workflow. The scenario fixture should provide enough public room
          detail for a later image-capable agent to create background art, but the fixture should
          not include the prompt used to create that image.
        </P>
        <P>
          If no approved art exists, leave the scenario out of{" "}
          <DocCode>public/assets/scenarios/manifest.json</DocCode>. The app will use the default
          Aura mesh without probing a missing image path. Add or update{" "}
          <DocCode>assets-source/scenarios/PLACEHOLDERS.md</DocCode> only to track that real art is
          still pending.
        </P>
      </DocCallout>
    ),
  },
  {
    id: "registration",
    title: "Registration",
    body: (
      <DocSteps
        items={[
          <span key="import">
            Import the scenario in <DocCode>app/fixtures/scenarios/index.ts</DocCode>.
          </span>,
          <span key="parse">
            Add it to the parsed <DocCode>starterScenarios</DocCode> array. The array parse plus the
            id-uniqueness test cover the catalog; there is no count or named export to maintain.
          </span>,
        ]}
      />
    ),
  },
  {
    id: "validation",
    title: "Validation",
    body: (
      <>
        <P>Run the project checks through Vite Plus:</P>
        <DocCodeBlock language="powershell">{`vp check
vp test
vp build`}</DocCodeBlock>
        <P>
          The scenario fixture tests must pass. They verify scenario id uniqueness, member-name
          isolation, unique event ids, likely offstage speaker handling, and reveal text that
          appears to hard-code new biography.
        </P>
        <P>
          Use Playwright for UI validation when the scenario affects Date Book cards, scenario
          inspector, Live Date planning, event draft selection, or live date flow. Background
          rendering checks belong to the visual asset workflow. The dev server must already be
          running at <DocCode>http://localhost:5173/</DocCode> before Playwright work.
        </P>
      </>
    ),
  },
];

export default function AddDateScenarioDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
