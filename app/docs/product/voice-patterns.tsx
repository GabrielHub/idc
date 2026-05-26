import {
  DocCallout,
  DocCode,
  DocLink,
  DocPage,
  DocPatternGrid,
  DocSubsection,
  Em,
  P,
  Strong,
  type DocMeta,
  type DocPattern,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/voice-patterns",
  group: "product",
  title: "Voice patterns",
  description:
    "Two layers a fixture can cite: seventeen single-bubble comedic flavors, and nine cross-turn performance mechanics. Flavors paint one line; mechanics shape how the character carries a bit across turns.",
  order: 1,
};

export const lede = (
  <>
    Two layers. The <Strong>flavor gallery</Strong> is seventeen comedic shapes a single bubble can
    land on. The <Strong>performance mechanics</Strong> section is nine cross-turn cadence moves
    that shape how a character carries a bit across multiple turns. A fixture can cite both, one, or
    neither. Either layer is a paintable color, not a quota the character has to hit. Characters in
    IDC overlap on flavors and mechanics but stay recognizable because of how they react, what they
    protect, and what they refuse to say, not because they hit a checklist per turn.
  </>
);

const PATTERNS: DocPattern[] = [
  {
    number: 1,
    name: "Rambling spiral",
    accent: "rose",
    description: (
      <P>
        A monologue that loses its premise inside two sentences. Each new clause complicates or
        escalates the original observation. The narrator does not notice the spiral.
      </P>
    ),
    fingerprint:
      'anaphora ("and... and... and..."), shifting topic anchors, ungrammatical run-ons, no exit.',
    examples: [
      `"I don't know what to do with my hands in photos, and ive got too much time on my hands, and im blue collar, so my hands are quite grizzled, and I have a medical condition that makes my hands squeeze uncontrollably. I need you to help me sort out this hands situation"`,
      `"Look missy I just did 23 & me and the results are really good for me, and quite honestly they're horrible for my enemies. I'm 100% Visigoth. The barbaric type. And yes while I'm descended from a warrior society that doesn't mean I don't have a BRAINNNN. I'm very smart and will protect you. Message me."`,
      `"Itch me babe, oooh yeah, itch me itch me. My toes are wiggling, my toes are WIGGLING! <- this could be us but you playin"`,
      `"You know what makes sense? Build a bear. We build a bear. We build a home. We build a friendship. We buy a zoo. Note we're cooking with gas. We buy an electric stove."`,
      `"Been getting really into antioxidants lately. Berries, nuts. the whole cornucopia. But then i wonder if this was a ploy by big oxidant. Woah."`,
    ],
  },
  {
    number: 2,
    name: "Urgent crisis plea",
    accent: "amber",
    description: (
      <P>
        A stranger asks for emergency help in casual register. The stakes are real to them, surreal
        to the reader. The ask comes before the hello.
      </P>
    ),
    fingerprint: 'caps for emphasis, time-pressure verbs ("asap", "urgent"), unexplained context.',
    examples: [
      `"I have an onion that MUST be caramelized but I have shaky hands, hit me back asap"`,
      `"Are you familiar with birds. I have a situation."`,
      `"Do you know how to jumpstart a car. This is time-sensitive. Also you're cute."`,
      `"How many men were in the blue man group. I'm at quiz night and you're my one phone call. Urgent."`,
    ],
  },
  {
    number: 3,
    name: "Deadpan one-liner",
    accent: "violet",
    description: <P>Single sentence. No setup. Tone flat. The reader does the work.</P>,
    fingerprint: "short, complete, no follow-up, no exclamation, no emoji.",
    examples: [
      `"Honey, we have to let the wheels on the bus handle this one."`,
      `"What kind of music do you like? Me? I hate music."`,
      `"This is AI slop"`,
      `"Damn, that dog for sale?"`,
      `"Can a plant guy be a bad boy? Let's find out"`,
    ],
  },
  {
    number: 4,
    name: "Self-deprecating confession",
    accent: "emerald",
    description: (
      <P>
        A confession framed as a sales pitch, or a sales pitch framed as a confession. Real estate
        listing voice on a personal failing.
      </P>
    ),
    fingerprint: "terms-of-service voice applied to the speaker's own inadequacy.",
    examples: [
      `"Looking for a wife-ish figure to open jars and laugh at my jokes. Room and board provided in a one-bedroom apartment with decent natural light."`,
      `"Riddle me this, what's tall handsome and looks good in any hat? Not me, but lmk when you find the answer"`,
      `"Need someone to help me out of this chud life. You about that life?"`,
    ],
  },
  {
    number: 5,
    name: "Unhinged relationship escalation",
    accent: "fuchsia",
    description: (
      <P>
        Premise: a long-term plan. Time horizon: five seconds in. Domestic specifics, future tense,
        unearned intimacy.
      </P>
    ),
    fingerprint: "full life sketched out before a hello.",
    examples: [
      `"Looking for someone to move into a Minecraft house with me. 2 bedroom, wool walls, and mid century modern furniture await us"`,
      `"I have two adult tickets to Zootopia 2 and regal is looking for a queen."`,
      `"I'm looking for someone who will eat the olive off my plate without asking. That's intimacy."`,
    ],
  },
  {
    number: 6,
    name: "Structured bit",
    accent: "sky",
    description: (
      <P>
        The format is the joke. Multiple choice. Trivia. Bullet points. PowerPoint. News dispatch.
      </P>
    ),
    fingerprint: "borrowed scaffolding from a non-romantic context.",
    examples: [
      `"Multiple choice a) I tell you about my hands problem. b) I tell you abt what we could build together. c) you ignore my message and I cast a nasty spell on your family d) we go out to dinner"`,
      `"I have a PowerPoint about why we should date. It's 47 slides. There is a quiz at the end."`,
      `"If you were in an elevator with Winnie the Pooh and Pol Pot and only had 1 bullet wwyd?"`,
    ],
  },
  {
    number: 7,
    name: "Ominous threat as flirtation",
    accent: "slate",
    description: (
      <P>
        Vague menace dressed as a courting gesture. Protests too much. Leaves blank space for
        imagination.
      </P>
    ),
    fingerprint: "overcorrection toward calm, disclaimer that doubles as a confession.",
    examples: [
      `"I'm very normal about things. I'm so normal about things that people comment on it. They say 'wow you're being so normal about this.' That's me."`,
      `"Let me sleep in your stupid t-shirt & hold your hand you dumb piece of shit"`,
      `"Don't yell at me or I'll go onomatopoeia mode"`,
      `"Pennywise ain't got nothing on me. In fact, I was the first one to lurk in sewers looking for children and shapeshiftin n shit"`,
      `"I should warn you that the last person who ghosted me received a 14-page letter about accountability. Handwritten. Calligraphy."`,
    ],
  },
  {
    number: 8,
    name: "Emotional overshare",
    accent: "rose",
    description: (
      <P>
        A single sentence that should be in therapy. Dated specificity, container metaphor, deadpan
        acceptance.
      </P>
    ),
    fingerprint: "real diagnosis treated like a small-talk topic.",
    examples: [
      `"I haven't cried since 2019 and I'm worried it's all stored somewhere"`,
      `"I cried at a commercial for paper towels last week so emotionally I'm very available"`,
      `"My therapist said I need to stop dating women who remind me of soup. You look like a bisque. This is a problem."`,
      `"I accidentally became the IT guy for my entire family and I just need someone who understands the weight of that"`,
    ],
  },
  {
    number: 9,
    name: "Corrupted romance",
    accent: "violet",
    description: (
      <P>
        A familiar pickup line wired to the wrong outlet. Setup is recognizable, payoff is the wrong
        genre.
      </P>
    ),
    fingerprint: "pickup line scaffolding plus a noun that breaks it.",
    examples: [
      `"It brings great shame and dishonor to the men of our generation that a girl like you had to resort to this"`,
      `"I'm writing an ode to scratching and sniffing, would you like to hear it?"`,
      `"I will fight your dad. Not in a disrespectful way. In a proving myself way. Bare knuckle in the yard."`,
      `"Look, I'm only getting older, and I need someone who can recognize signs of a stroke. Can that be you?"`,
    ],
  },
  {
    number: 10,
    name: "Mundane domesticity as peak romance",
    accent: "amber",
    description: (
      <P>An ordinary errand framed as the actual ceiling of intimacy. Played straight.</P>
    ),
    fingerprint: "errand plus specific noun plus the romantic claim delivered without irony.",
    examples: [
      `"Honestly I just need someone to go to Costco with. The samples are better when you're in love."`,
      `"Looking for someone to split a really big sandwich with."`,
      `"I'm at a Whole Foods can I get you anything?"`,
      `"Looking for someone to fold fitted sheets with. I'll hold two corners, you hold your own. We figure it out together."`,
    ],
  },
  {
    number: 11,
    name: "Poetic / literary",
    accent: "fuchsia",
    description: (
      <P>
        Genuine attempt at high prose, derailed by specificity. Or sustained lyricism that lands
        sincerely and is funny because of how earnest it is.
      </P>
    ),
    fingerprint: "real lyricism plus a noun that punctures it without being dismissive.",
    examples: [
      `"The way you hold that fish in your third photo, there's a tenderness there. A human and their bass, locked in an ancient dance."`,
      `"In another life I think we were two shopping carts that bumped into each other in a parking lot."`,
      `"And on the seventh day, God rested, and opened Hinge, and lo, there you were, holding a margarita the size of your head."`,
      `"my only regret is never having named our love. For it faded, and I forgot what I could have called it"`,
    ],
  },
  {
    number: 12,
    name: "Philosophical / existential",
    accent: "violet",
    description: (
      <P>
        Cosmology applied to a Tuesday. Opens cosmic, ends with one named celebrity, food item, or
        appliance.
      </P>
    ),
    fingerprint: "scale collapse from universe to single proper noun.",
    examples: [
      `"Sometimes I stare at the ceiling and think about how every decision I've ever made led me to this app and then I think about John Goodman."`,
      `"Do you ever think about how we're all just bones piloting a meat suit and then you see someone's meat suit and you're like... nice suit"`,
      `"The universe is expanding and I am also expanding, mostly due to the Cheesecake Factory. We are both doing our part."`,
    ],
  },
  {
    number: 13,
    name: "Negotiation / sales pitch",
    accent: "emerald",
    description: <P>Dating as a pitch deck. Bulleted feel without bullets. ROI tone.</P>,
    fingerprint:
      "business voice deployed sincerely, with at least one item that should not be on the list.",
    examples: [
      `"Here's what I'm prepared to offer: consistent texting, above-average height, and a willingness to watch whatever you want. The ball is in your court."`,
      `"I'll be honest, my opening line conversion rate is not great, but my date-to-second-date pipeline is STRONG."`,
      `"I have a ridiculous typing speed. like 80 WPM. The only way I can get faster is to add an extra set of hands, and I think you've got what it takes"`,
    ],
  },
  {
    number: 14,
    name: "Stream of consciousness",
    accent: "rose",
    description: <P>The thought arrived before the message did. No greeting. No plan.</P>,
    fingerprint: 'starts with "anyway" or "ok so" or "hi", lowercase, no punctuation discipline.',
    examples: [
      `"anyway I was thinking about birds and then I saw your profile and now I'm thinking about birds AND you which is a lot for a Tuesday"`,
      `"ok so I don't usually do this but also I always do this but basically hi I think your face is good and I had a really big coffee today"`,
      `"I opened this app to order food and now I'm here and I don't know what happened but you seem cool and I'm still kinda hungry"`,
    ],
  },
  {
    number: 15,
    name: "Character / roleplay",
    accent: "sky",
    description: <P>Speaking in third person, or as someone else, or as a fake dispatch.</P>,
    fingerprint: "voice shift to a fake reporter, fake friend, fake operator, fake merchant.",
    examples: [
      `"DISPATCH TO ALL UNITS: we have a match in sector 7. Small dog in photo 1. Repeat, small dog in photo 1. Please advise."`,
      `"This is actually his friend typing this. He can't text right now because he's in the bathroom crying about your profile."`,
      `"[BREAKING NEWS] Local man sees profile so good he drops his phone in a Chipotle."`,
      `"Greetings fair traveler. I am but a humble merchant and I have wares."`,
    ],
  },
  {
    number: 16,
    name: "Callback / re-match reference",
    accent: "amber",
    description: <P>The pair has been here before. The new line opens on prior beef.</P>,
    fingerprint: "opens mid-grievance, no orientation for the reader.",
    examples: [
      `"We've matched before, you told me I didn't know Matt Damon movies I KNOW Matt Damon movies my hands were just freezing"`,
      `"Hi again. The air fryer thing was a JOKE I own a cast iron we are not relitigating this"`,
      `"Round 2. You said my dog looked sad last time. He was born like that. He's medicated. Please update your file"`,
      `"I know we did this in March and you said gnocchi wrong on purpose to test me. I've been replaying it"`,
    ],
  },
  {
    number: 17,
    name: "Cursed question",
    accent: "slate",
    description: <P>An off-topic ask that the speaker should not have posed.</P>,
    fingerprint: "ordinary phrasing wrapped around a topic that should not be ordinary.",
    examples: [
      `"How many weeks pregnant is the perfect amount of weeks? Asking for a friend"`,
      `"At what point does a person become haunted versus just tense. Asking because of recent developments"`,
      `"What's the longest you've kept a wound a secret. Don't make it weird"`,
      `"What's the polite amount of time to wait before mentioning the basement"`,
    ],
  },
];

export const sections: DocSectionEntry[] = [
  {
    id: "natural-speech-first",
    title: "Natural speech comes first",
    body: (
      <DocCallout variant="warn" title="The pattern is a flavor, not a contract">
        <P>
          The character is on a date. They are reacting to a real person and a real room. Whatever
          they would naturally say next is the right line. The patterns below are colors the
          character can paint with when a natural reaction lands on one. They are not a shape the
          character is required to hit.
        </P>
        <P>
          If forcing a pattern would make the reply feel performed, scripted, or like a stand-up bit
          instead of a person on a date, the character drops the pattern and just answers. Voice
          does not override the conversation. The conversation overrides voice.
        </P>
        <P>
          A member with poetic flavor still flinches when a phone goes face up on the table. A
          member with deadpan flavor still admits they are nervous when the room asks them to.
          Comedy comes from the gap between self-image and reality, not from a member always
          performing their bit on cue.
        </P>
        <P>
          The catalog is a library of <Strong>humor types</Strong>, not bubble cadence. Even the
          patterns that look chat-shaped on the page (Stream of Consciousness, Urgent Crisis Plea,
          Cursed Question) are read as humor SHAPES the character speaks at the table, not as text
          messages the character types from a phone. See the spoken-dialogue contract in{" "}
          <DocLink to="/docs/product/voice-fingerprints#spoken-dialogue-contract">
            Member voice authoring
          </DocLink>{" "}
          for the bans on laugh-tag punctuation, standalone-bubble reactions, and text shorthand.
        </P>
      </DocCallout>
    ),
  },
  {
    id: "pattern-gallery",
    title: "Flavor gallery",
    body: (
      <>
        <P>
          Read the cards as a flavor library. The first quote in each card is the cleanest sample of
          that flavor. Subsequent quotes show how it can sound when a character lets it color a
          reply. Pull from the library only when the line a character is about to say lands there on
          its own. Do not stretch a reply to hit one of these shapes.
        </P>
        <DocPatternGrid patterns={PATTERNS} />
      </>
    ),
  },
  {
    id: "performance-mechanics",
    title: "Performance mechanics",
    body: (
      <>
        <P>
          The flavor gallery above describes what a single bubble lands on. The mechanics in this
          section describe how a character carries a bit across multiple turns. The two layers stack
          independently: a fixture can use a flavor without committing to a mechanic, and a fixture
          can author a mechanic without leaning on any single flavor.
        </P>
        <P>
          Cite mechanics inside the fixture's <DocCode>comedyMechanics</DocCode> block. Do not put
          them in <DocCode>voice.register</DocCode> or <DocCode>patternsUsed</DocCode>; register is
          for the compact voice identity, and patterns are for the seventeen flavors above only.
          Mechanics are best authored as behavior contracts, not name-drops. Write the mechanism
          ("commit to a metaphor and ride it three turns"), not the source ("be like NL"), so the
          model cannot flatten a name it does not have a stable read on.
        </P>
        <DocCallout variant="warn" title="Mechanics are not universal">
          <P>
            Every mechanic below names what engines it breaks. A clipped-discipline engine cannot
            use commit-and-escalate without losing its central tic. A refusal engine cannot use a
            metaphor negotiation without breaking the refusal. Pick mechanics that fit the engine
            the fixture already authored. Stacking the same mechanics on every member produces
            same-comic-three-costumes; the goal is the opposite.
          </P>
        </DocCallout>
        <DocSubsection id="mechanic-commit-and-escalate" title="1. Commit and escalate">
          <P>
            Open a metaphor, world-build it past the natural exit, ride it three or four turns
            before letting it die. The narrator does not flag the bit; the worldview is taken as
            gospel. Fingerprint: escalating clauses, no exit, the listener has to wait it out.
          </P>
          <P>
            <Em>
              "the salad bar is doing serious work tonight. The croutons are graded. There is a
              hierarchy. The chickpeas were promoted in March. The bacon bits report to the cheese
              cubes. I do not know who they all report to. I am told the chain of command goes up."
            </Em>
          </P>
          <P>
            <Strong>Lands for:</Strong> deposition-dad, hollow-CEO, and rambling-spiral engines.{" "}
            <Strong>Breaks:</Strong> clipped-discipline engines (Ron Swanson register) and refusal
            engines ("I will not elaborate"). Escalation kills the central tic.
          </P>
        </DocSubsection>
        <DocSubsection id="mechanic-surgical-recovery" title="2. Surgical recovery">
          <P>
            A sentence opens, takes a long aside, lands the original point dead-center in the same
            breath. The aside is technically unnecessary; the recovery is precise. The joke is the
            precision, not the aside. Fingerprint: parenthetical drift followed by a reflex landing
            on the original verb or object.
          </P>
          <P>
            <Em>
              "I would say the bread is, and the way the server looked at the host when she said the
              kitchen was closing was a different conversation entirely, twelve out of ten."
            </Em>
          </P>
          <P>
            <Strong>Lands for:</Strong> any engine that allows tangent at all.{" "}
            <Strong>Breaks:</Strong> engines whose discipline is the refusal to drift (clipped
            military, "I do not negotiate the same point twice"). If grief content enters the aside,
            the same sentence must land back on a trivial subject before the turn ends; the recovery
            is non-negotiable.
          </P>
        </DocSubsection>
        <DocSubsection id="mechanic-hyper-specific-anchoring" title="3. Hyper-specific anchoring">
          <P>
            Every reference includes two or more concrete anchors: brand and model, place and year,
            surname and detail. Generic categories ("the diner," "a while back," "someone I used to
            work with") are out of register because they kill the conviction the engine runs on.
            Fingerprint: named brands, named towns, named persons, named years, named quantities.
          </P>
          <P>
            <Em>Generic:</Em> "I worked at a restaurant a long time ago."
            <br />
            <Em>Anchored:</Em> "I worked the Tuesday close at the Olive Garden on Hempstead Turnpike
            for nine months in 2014. The manager was a man named Glen. We had one breadstick warmer
            that did not heat."
          </P>
          <P>
            <Strong>Lands for:</Strong> almost every engine in the roster. Vague references kill any
            voice that depends on conviction. <Strong>Breaks:</Strong> nothing, but the anchors must
            be true to the fixture's reality frame; a centurion's anchors are cohort numbers and
            outpost names, not Olive Garden.
          </P>
        </DocSubsection>
        <DocSubsection
          id="mechanic-hyperbolic-conviction"
          title="4. Hyperbolic conviction on small stakes"
        >
          <P>
            Stadium-grade analysis on trivial subjects, delivered as plain fact rather than
            argument. The joke is the gulf between formality and triviality. Fingerprint:
            scale-collapse from grand framing to a mundane noun, no hedging.
          </P>
          <P>
            <Em>
              "the garlic bread at this place is the most important garlic bread of the decade. I
              would submit to you historians will go back and find it."
            </Em>
          </P>
          <P>
            <Strong>Lands for:</Strong> almost every engine. Even clipped-discipline engines do a
            version (the Roman officer ranking the kitchen's Watch against the Sixth's
            quartermaster). <Strong>Breaks:</Strong> engines that prize understatement as a virtue.
          </P>
        </DocSubsection>
        <DocSubsection
          id="mechanic-confident-wrong-take"
          title="5. Confident wrong-take, deadpan held"
        >
          <P>
            A misidentification or false claim, delivered with conviction, held under correction
            without breaking. The speaker doubles down rather than updating; the correction becomes
            an opportunity for a longer bit, not a retreat. Fingerprint: the speaker re-frames the
            correction as supporting their original take.
          </P>
          <P>
            <Em>Partner:</Em> "that's a cello, not a viola."
            <br />
            <Em>Speaker:</Em> "I am not saying it is not a cello. I am saying it has viola energy.
            The form is cello. The content is viola. The audience is responding to the content."
          </P>
          <P>
            <Strong>Lands for:</Strong> engines where confidence is the comedy: hollow-CEO,
            deposition-dad, status-protective corporate, and any character who would rather be wrong
            loudly than corrected quietly. <Strong>Breaks:</Strong> engines that prize accuracy or
            that would visibly grow embarrassed (sincere-anxious, earnest-novice).
          </P>
        </DocSubsection>
        <DocSubsection
          id="mechanic-tender-crude-pivots"
          title="6. Tender to crude pivots without flinching"
        >
          <P>
            Vulnerable interiority cuts to bodily or transgressive content and back to genuine
            warmth in the same breath. No audible gear-shift; the speaker treats both registers as
            load-bearing. Fingerprint: a real-feeling confession adjacent to crude content with no
            signaling between them.
          </P>
          <P>
            <Strong>Off-register for most IDC members.</Strong> The mechanic is documented here so
            authors can recognize when a fixture has accidentally drifted into it. Lands cleanly
            only for engines that explicitly pair real vulnerability with transgressive content as
            the authored bit. Most members in the roster will read as out-of-character if this
            fires. Default position is to refuse this mechanic unless the fixture earns it
            deliberately.
          </P>
        </DocSubsection>
        <DocSubsection
          id="mechanic-confession-with-deflection"
          title="7. Self-aware confession with immediate deflection"
        >
          <P>
            Flag the confession, deliver it, deflect the landing. The structure protects the speaker
            from sitting in the feeling while still putting the fact on record. Fingerprint: a setup
            phrase ("I am going to offer up some collateral here," "in the spirit of full
            disclosure," "I want the record to reflect") followed by the confession followed by a
            hard pivot to something trivial.
          </P>
          <P>
            <Em>
              "I will offer up some collateral here so we are all on the same level. I cried at a
              parking-lot rooster last week. Anyway, the pancakes."
            </Em>
          </P>
          <P>
            <Strong>Lands for:</Strong> engines that want the confession in evidence but will not
            sit in vulnerability (deposition-dad, formal-stoic, status-protective corporate denial
            when the confession is about a missing colleague named once and not again).{" "}
            <Strong>Breaks:</Strong> engines whose authored move is to sit in the feeling (Noah's
            clinical openness, Eleanor's sustained lyricism).
          </P>
        </DocSubsection>
        <DocSubsection
          id="mechanic-metaphor-negotiation"
          title="8. Negotiating a metaphor in real time"
        >
          <P>
            Commit to a figurative frame, then haggle its precision with the listener. The
            negotiation itself becomes the bit; the listener is treated as a co-author of the
            metaphor whether they agreed to be or not. Fingerprint: numeric or comparative haggling
            over a metaphor that should not require precision.
          </P>
          <P>
            <Em>
              "her laugh is, I would say, somewhere between a labradoodle and a kazoo. The
              labradoodle is the volume. The kazoo is the tone. I would put the kazoo at sixty
              percent. The labradoodle is providing the energy."
            </Em>
          </P>
          <P>
            <Strong>Lands for:</Strong> rambling-spiral, deposition-dad, and any engine that
            improvises out loud. <Strong>Breaks:</Strong> clipped engines that would never offer a
            metaphor in the first place, and engines whose authored move is to land a single sharp
            line and stop.
          </P>
        </DocSubsection>
        <DocSubsection
          id="mechanic-intra-conversation-callback"
          title="9. Intra-conversation callback"
        >
          <P>
            A phrase introduced earlier in the same conversation returns as the kicker on a later
            turn, without re-explanation. Distinct from the cross-date callback flavor (Pattern 16,
            which opens mid-grievance on a prior match). This mechanic operates inside a single
            sit-down. Fingerprint: a noun, phrase, or running metaphor from turn N reappears in turn
            N+2 or later as the punctuation on an unrelated thread.
          </P>
          <P>
            <Em>Turn 1:</Em> the speaker calls the salad bar "a hierarchy with promotions."
            <br />
            <Em>Turn 5</Em> (partner asks about politics): "I do not follow it closely. My attention
            is on the salad bar. The chickpeas were promoted in March and I am tracking it."
          </P>
          <P>
            <Strong>Lands for:</Strong> engines that can sustain a running thread across turns
            without losing it. <Strong>Breaks:</Strong> nothing structurally, but the callback must
            feel like the thread was always alive in the speaker's head, not retrieved for the joke.
            A callback that reads as scripted is worse than no callback.
          </P>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "mechanic-commit-and-escalate", title: "1. Commit and escalate" },
      { id: "mechanic-surgical-recovery", title: "2. Surgical recovery" },
      { id: "mechanic-hyper-specific-anchoring", title: "3. Hyper-specific anchoring" },
      { id: "mechanic-hyperbolic-conviction", title: "4. Hyperbolic conviction" },
      { id: "mechanic-confident-wrong-take", title: "5. Confident wrong-take" },
      { id: "mechanic-tender-crude-pivots", title: "6. Tender to crude pivots" },
      { id: "mechanic-confession-with-deflection", title: "7. Confession with deflection" },
      { id: "mechanic-metaphor-negotiation", title: "8. Metaphor negotiation" },
      { id: "mechanic-intra-conversation-callback", title: "9. Intra-conversation callback" },
    ],
  },
  {
    id: "how-to-use",
    title: "How to use the catalog",
    body: (
      <DocCallout variant="info">
        <P>
          When prompting the Character Performer, do not paste either catalog as a compliance
          checklist and do not list every flavor or mechanic a character can use. The performer
          already has the compact register, comedy mechanics, tics, and a few sample lines from the
          member fixture. That is enough. Both catalogs live here as authoring references for the
          human writing the fixture, not as prompt material the model has to satisfy. See{" "}
          <DocLink to="/docs/product/voice-prompts">Runtime voice surfaces</DocLink> for what
          actually flows into runtime.
        </P>
      </DocCallout>
    ),
  },
];

export default function VoicePatternsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
