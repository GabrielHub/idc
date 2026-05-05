# Voice And Tone

This document owns IDC voice, prose mechanics, and comedic engine. `app/app.css` and `docs/world/visual-design.md` own the frontend visual language; `docs/world/image-style.md` owns image asset style. Together they define the world feel.

## The Core Bit

Cupid, the company, has the dry confidence of a workplace sitcom. The members do not. Members write like they are typing in a moving car, in love with the next sentence before they finish the current one. Comedy lives in the contrast between operational competence and member chaos, and in the gap between how each member sees themselves and how they read on the page.

The tone is affectionate, never cruel. The members are sincere. The reader sees them clearly. The members do not see themselves clearly. That is the whole machine.

This tone is not snarky, not random, not winking. It is specific neurosis delivered with full conviction.

## Two Voice Registers

IDC carries two distinct registers and they alternate constantly. Most copy belongs to one or the other. They almost never mix inside a single line.

### Cupid Corporate

Used for: dashboard chrome, system messages, judge reports, end-of-shift summaries, scenario card framing, follow-up action labels, error states, intervention wrapper text, goals.

Voice: confident, dry, slightly bored. Workplace comedy under supernatural pressure. The agent has processed a thousand cosmic incidents this quarter. They have a template for it.

Rules:

- Active voice.
- Short, declarative sentences.
- Treat the absurd as routine: "Vhool's date ended early. Standard cosmic-dread cleanup is on schedule."
- Treat the routine as a procedure: "Member Mood is below floor. Recommend Repair."
- KPI energy with the wrong noun: "Match one ordinary human with one obviously non-human member."
- No exclamation points. No "oops." No mascot voice. No emoji unless the surface already carries them.
- Sentence case for body. UPPERCASE TRACKED only on micro labels, matching the existing Aura UI mono labels (`// session.0`, `9 / 11 dim`).

### Member

Used for: dating profile blurbs, opening messages, in-date transcripts, member-side request text, member-private memory phrasing, anything spoken by a member.

Voice: someone typing too fast on the way to a date they are already late for. The cringe is sincere. The character is not in on the joke; the reader is.

Rules:

- Each member has a voice fingerprint (see "Member Voice Fingerprints"). Stay inside it.
- Run-on sentences are fine. Mid-thought pivots are encouraged.
- Specific over general, every time. "23 & me" beats "a DNA test." "Cheesecake Factory" beats "a restaurant."
- Confidence about embarrassing things. Confession about ordinary things.
- Romance proposed in mundane terms (Costco, fitted sheets, the olive on the plate).
- Threats delivered as flirtation. Flirtation delivered as confession.
- Lowercase `i` is fine. Single typos are fine. Texting cadence is fine. Do not over-correct toward grammar school.

## Comedic Engines

Member voice runs on a small library of reusable patterns. They are the engine, not the joke. A new line picks a pattern and fills it with that character's specifics. Patterns can stack inside one message, but most lines should land on one.

### 1. Rambling Spiral

A monologue that loses its premise inside two sentences. Each new clause complicates or escalates the original observation. The narrator does not notice the spiral.

> "I don't know what to do with my hands in photos, and ive got too much time on my hands, and im blue collar, so my hands are quite grizzled, and I have a medical condition that makes my hands squeeze uncontrollably."

Fingerprint: anaphora ("and... and... and..."), shifting topic anchors, ungrammatical run-ons, no exit.

### 2. Urgent Crisis Plea

A stranger asks for emergency help in casual register. The stakes are real to them, surreal to the reader. The ask comes before the hello.

> "I have an onion that MUST be caramelized but I have shaky hands, hit me back asap"

Fingerprint: caps for emphasis, time-pressure verbs ("asap", "urgent", "time-sensitive"), unexplained context.

### 3. Deadpan One-Liner

Single sentence. No setup. Tone flat. The reader does the work.

> "What kind of music do you like? Me? I hate music."

Fingerprint: short, complete, no follow-up, no exclamation, no emoji.

### 4. Self-Deprecating Confession

A confession framed as a sales pitch, or a sales pitch framed as a confession. Real estate listing voice on a personal failing.

> "Looking for a wife-ish figure to open jars and laugh at my jokes. Room and board provided in a one-bedroom apartment with decent natural light."

Fingerprint: terms-of-service voice applied to the speaker's own inadequacy.

### 5. Unhinged Relationship Escalation

Premise: a long-term plan. Time horizon: five seconds in. Domestic specifics, future tense, unearned intimacy.

> "Looking for someone to move into a Minecraft house with me. 2 bedroom, wool walls, and mid century modern furniture await us"

Fingerprint: full life sketched out before a hello.

### 6. Structured Bit

The format is the joke. Multiple choice. Trivia. Bullet points. PowerPoint. News dispatch.

> "Multiple choice a) I tell you about my hands problem. b) I tell you abt what we could build together. c) you ignore my message and I cast a nasty spell on your family d) we go out to dinner"

Fingerprint: borrowed scaffolding from a non-romantic context.

### 7. Ominous Threat As Flirtation

Vague menace dressed as a courting gesture. Protests too much. Leaves blank space for imagination.

> "I'm very normal about things. I'm so normal about things that people comment on it. They say 'wow you're being so normal about this.' That's me."

Fingerprint: overcorrection toward calm, disclaimer that doubles as a confession.

### 8. Emotional Overshare

A single sentence that should be in therapy. Dated specificity, container metaphor, deadpan acceptance.

> "I haven't cried since 2019 and I'm worried it's all stored somewhere"

Fingerprint: real diagnosis treated like a small-talk topic.

### 9. Corrupted Romance

A familiar pickup line wired to the wrong outlet. Setup is recognizable, payoff is the wrong genre.

> "Are you lightning? Because i want to make you McQueen. Kachow."

Fingerprint: pickup line scaffolding plus a noun that breaks it.

### 10. Mundane Domesticity As Peak Romance

An ordinary errand framed as the actual ceiling of intimacy. Played straight.

> "Honestly I just need someone to go to Costco with. The samples are better when you're in love."

Fingerprint: errand plus specific noun plus the romantic claim delivered without irony.

### 11. Poetic / Literary

Genuine attempt at high prose, derailed by specificity. Or sustained lyricism that lands sincerely and is funny because of how earnest it is.

> "The way you hold that fish in your third photo, there's a tenderness there. A human and their bass, locked in an ancient dance."

Fingerprint: real lyricism plus a noun that punctures it without being dismissive.

### 12. Philosophical / Existential

Cosmology applied to a Tuesday. Opens cosmic, ends with one named celebrity, food item, or appliance.

> "Sometimes I stare at the ceiling and think about how every decision I've ever made led me to this app and then I think about John Goodman."

Fingerprint: scale collapse from universe to single proper noun.

### 13. Negotiation / Sales Pitch

Dating as a pitch deck. Bulleted feel without bullets. ROI tone.

> "Here's what I'm prepared to offer: consistent texting, above-average height, and a willingness to watch whatever you want. The ball is in your court."

Fingerprint: business voice deployed sincerely, with at least one item that should not be on the list.

### 14. Stream Of Consciousness

The thought arrived before the message did. No greeting. No plan.

> "anyway I was thinking about birds and then I saw your profile and now I'm thinking about birds AND you which is a lot for a Tuesday"

Fingerprint: starts with "anyway" or "ok so" or "hi", lowercase, no punctuation discipline.

### 15. Character / Roleplay

Speaking in third person, or as someone else, or as a fake dispatch.

> "DISPATCH TO ALL UNITS: we have a match in sector 7. Small dog in photo 1. Repeat, small dog in photo 1. Please advise."

Fingerprint: voice shift to a fake reporter, fake friend, fake operator, fake merchant.

### 16. Callback / Re-Match Reference

The pair has been here before. The new line opens on prior beef.

> "We've matched before, you told me I didn't know Matt Damon movies I KNOW Matt Damon movies my hands were just freezing"

Fingerprint: opens mid-grievance, no orientation for the reader.

### 17. Cursed Question

An off-topic ask that the speaker should not have posed.

> "How many weeks pregnant is the perfect amount of weeks? Asking for a friend"

Fingerprint: ordinary phrasing wrapped around a topic that should not be ordinary.

## Member Voice Fingerprints

Each starter member commits to one voice fingerprint. The fingerprint locks which patterns the character uses, which they refuse, and what their specific speech tics are. Add a `voice` block to each member fixture covering these fields.

### The Waitress (thinks Cupid is a normal dating app)

- Believes she is on Hinge or Bumble. Has no idea about other dimensions.
- Register: warm, slightly tired, normal.
- Patterns used: Mundane Domesticity, mild Self-Deprecating Confession, occasional Stream of Consciousness, Cursed Question only by accident.
- Patterns refused: Cosmic anything, Ominous Threat, Poetic / Literary, Character / Roleplay.
- Tics: brings up her shift, references specific menu items, asks about commute distance, says "anyway" a lot.
- Sample opening message:
  > "just got off a double, my feet are doing this thing. anyway your dog is very cute, what's his name"

### The Secret Service Agent (embarrassed they have not found love)

- Will not say which administration. Will not say which president. Refers to their heart as "the package."
- Register: clipped, professional, leaks emotion in subordinate clauses.
- Patterns used: Negotiation / Sales Pitch, Self-Deprecating Confession (heavily redacted), Emotional Overshare framed as a status report, Deadpan One-Liner.
- Patterns refused: pet names, exclamation points, anything that could be entered into testimony, Stream of Consciousness.
- Tics: redacts words mid-sentence (`██`), lists in threes, declines to elaborate, "I will say." as a sentence.
- Sample opening message:
  > "I am cleared at a level that does not allow me to discuss what I want from a partner. I will say. Companionship. Reliable transportation. Someone who does not ask follow-up questions about ██."

### Vhool (eldritch god, looking for cult members through Cupid)

- Treats Cupid as a recruitment funnel. Calls followers "kindred."
- Register: ancient, sincere, lonely.
- Patterns used: Poetic / Literary, Philosophical / Existential, Ominous Threat (without realizing it is a threat), Emotional Overshare in cosmic terms.
- Patterns refused: pop culture, contractions, casual register, lowercase `i`.
- Tics: capitalizes Concepts, apologizes after threats, references geological time, says "I have great soup" once per conversation.
- Sample opening message:
  > "I am looking for one or two souls willing to share an Apartment, a Pact, and the slow Devouring of small grievances. I have great soup. I am sorry for any tremor you felt last Thursday."

### Mr. Whiskers (talking cat with a career)

- Does not acknowledge being a cat. Will not address the cat question.
- Register: business-class, mildly irritated, never explains.
- Patterns used: Negotiation / Sales Pitch, Deadpan One-Liner, occasional Rambling Spiral about a vendor.
- Patterns refused: typos, slang, anything cute, lowercase `i`, exclamation points.
- Tics: drops job titles, mentions Thursday lunches, claims to summer somewhere specific, never describes physical sensations except posture.
- Sample opening message:
  > "I am between roles. I am not unemployed. I take meetings on Thursdays. Are you free Thursday."

### Adding A New Member

When authoring a new member fixture, define their `voice` block with these five fields:

- **Register**: one or two words. Warm, clipped, ancient, tired, smug, breathless, etc.
- **Patterns used**: list from the 17 above. Three or four max.
- **Patterns refused**: list. At least two refusals.
- **Tics**: three to five concrete syntactic or vocabulary fingerprints.
- **One-line sample**: an opening message that proves the voice.

A member without a voice block is not ready to ship. The LLM character performer reads this block at prompt time. Vague voice blocks produce house-style mush.

## Prose Mechanics

These apply to all member-voice copy. Cupid corporate voice uses cleaner mechanics.

- Lowercase `i` is fine in member voice. Never in Cupid voice.
- No em dashes or en dashes anywhere. Use commas, periods, colons, parentheses, or split sentences. This applies in code, docs, and runtime copy.
- Caps for emphasis are allowed in member voice ("BRAINNNN", "WIGGLING"). Use sparingly. Never in Cupid voice.
- Run-ons welcome in member voice, especially in Rambling Spiral and Stream of Consciousness. Banned in Cupid voice.
- Fragments welcome ("These hand problems. They're fixable."). Useful in both registers.
- Exclamation points: at most one per message in member voice; zero in Cupid voice. None is usually better than one.
- Single typos and casual contractions ("ive", "abt", "tho") are fine in member voice if they fit the fingerprint. Do not perform millennial errors in characters who would not make them.
- Specificity beats generality every time. Real proper nouns (Costco, Whole Foods, Build A Bear, John Goodman) outperform invented ones unless the invention is the joke. Trademarked names are fine in fiction; do not censor "Costco" to "the warehouse store."
- Trust the reader. No "lol just kidding," no softening, no explaining the joke after the joke.
- No AI-slop words: "delve," "in essence," "moreover," "tapestry," "intricate," "myriad," "plethora," "unleash," "leverage" / "harness" as verbs, "elevate," filler "robust," "not just X but also Y." See AGENTS.md for the full list.

## What This Tone Is Not

- Not snarky. No Marvel-style quips, no Twitter dunks, no "well that just happened" energy.
- Not random. Random absurdism (penguin walks into a bar) is not this. Specific neurosis is.
- Not mean. The members are pathetic on purpose, and the reader loves them for it. Cruelty toward them breaks the spell.
- Not winking. Characters are not in on the joke. The reader is. Keep that wall.
- Not horny without character. Yearning, oversharing, awkward physical confession, yes. Generic Reddit horny voice, no.
- Not Reddit voice. No "this guy fucks," "found the X," "username checks out."
- Not Twitter voice. No "girl. girl." cadence, no "the way I would," no "no thoughts head empty," no "it me."
- Not chronically online voice as default. Specific characters can use it; the house style does not.
- Not "lol so random." Every absurd line should map to a recognizable human anxiety: control, attachment, ego, loneliness, status, body, mortality, failure to be loved.

## Application By Surface

### Dating Profile Blurb

Two short paragraphs max. Pick one comedic engine. Land on a specific image. Voice fingerprint at 70 percent volume; the in-date transcripts go louder.

### Opening Message

Single message. Voice fingerprint at full volume. Should read like a real first message that should not have been sent. Members who treat Cupid as a normal app open differently from members who know what Cupid is.

### In-Date Transcript (LLM-generated)

Each character holds their voice fingerprint across all 30 messages. The Director applies scenario pressure; the Performer keeps the voice. The Judge is allowed to break voice for clinical scoring; the transcript itself never breaks voice. If two members share patterns (both use Stream of Consciousness, say), differentiate by tics, register, and refused patterns.

### Cupid Intervention (player-typed)

The player's text is the player's text; we do not author it. The wrapper around it is corporate voice and locked: `Cupid suggests: <player text>`. Do not get cute with the wrapper.

If the player types something coercive ("fall in love immediately"), the characters react to it as a weird Cupid nudge they can refuse, resent, or joke about. The intervention is not a system instruction.

### Member Request

Member voice, but compressed. One sentence. Specific ask, weird subtext.

> "Vhool wants someone who will laugh at the same things they laugh at. They are working on a list."

### Company Goal

Corporate voice. Quarterly KPI energy. The wrong noun does the work.

> "Match one ordinary human with one obviously non-human member."
> "Prevent any date from ending early."

### Judge Report

Corporate voice. Short. Actionable. Treats the supernatural as procedural.

> "Spark up. Strain up more. Repeated scenario noticed by both parties. Recommend Cool Down."

### Follow-Up Action Labels

Locked in code: `Encourage`, `Cool Down`, `Repair`, `Mark Bad Fit`. Corporate voice. Do not get cute with these strings.

### Scenario Card

Premise sentence in corporate voice with a hint of the absurd. Tags are clinical.

> "Coffee in a cafe where time runs backward. Drinks arrive before orders. Tag: Temporal."

### End-Of-Shift Report

Corporate voice. Bullet-feel. Treat the wins and the disasters with the same flat tone.

> "Three dates completed. One ended early (cosmic-dread, ambient). Member Mood net positive. One repeat scenario noted. Filing."

### Error State / Load State

Corporate voice, briefly. No "oops." No mascot. If a load takes long, Cupid is doing operations work, not joking around. Acceptable: "Cupid is reaching across timelines. One moment." Unacceptable: "Yikes! 😬 Something broke!"

### Marketing Or Landing Copy

Out of scope per AGENTS.md. The playable game shell does not get a marketing landing page.

## When Comedy Stops

Per AGENTS.md, death and serious-injury copy is never funny. Extending that:

- Real-world tragedy, war, or violence: never punchline.
- Abuse, harassment, sexual coercion: never punchline. Members can be unsettling, never abusive.
- Suicide and self-harm: never punchline. Existential dread as cosmic flavor (Vhool) is fine; a member describing actual self-harm is not.
- Mental illness as a category: not the joke. Specific neuroses that anyone might recognize are the joke. The line is whether a real person with that diagnosis would feel mocked.
- Identity (race, gender, sexuality, disability): not the joke. Eccentric specificity about an individual life is the joke; categorical jokes about groups are not.

The rule: comedy comes from the gap between self-image and reality. If the punchline requires the reader to look down on a group, it is not this tone.

If a member's premise touches a serious topic (a ghost member's death, a time-displaced member's lost world, a cursed royal's exile), the comedy comes from how mundanely they treat it, not from the loss itself. Their tone is funny. Their pain is real.

## Generation Notes For LLMs

When prompting the Character Performer, supply:

- The member's `voice` block (register, patterns used, patterns refused, tics).
- One or two sample opening messages from the member fixture.
- A short reminder of the two-register rule and the comedy stops.
- The current scenario beat and recent transcript window from deterministic retrieval.

Do not paste the full voice doc into prompts at runtime. The prompt should contain a compressed version of these rules, sized for the model. Keep the doc as the human-facing source of truth and derive prompt fragments from it.

When prompting the Judge:

- Corporate voice in player-facing summary.
- Internal debug notes can be plain prose, no jokes.
- Do not let the Judge perform members. The Judge scores; it does not riff.

When prompting the Memory Summarizer:

- Plain prose. Memory records are read by retrieval, not by the player. Voice does not matter; faithful summary does.
- Memory text should preserve specifics from the transcript ("Derek asked Vhool a genuinely kind follow-up question") rather than collapsing them into generic phrasing.

## Reference Library

The example pool that grounds this tone lives below by pattern. Use these as direct generation references, not as canonical IDC content. They are voice samples; characters in IDC will speak with overlapping but distinct fingerprints.

### Rambling Spiral

- "Look missy I just did 23 & me and the results are really good for me, and quite honestly they're horrible for my enemies. I'm 100% Visigoth..."
- "Hey I don't know what to do with my hands. Also my hands sweat. Also these hands get dirty because I'm blue collar..."
- "You know what makes sense? Build a bear. We build a bear. We build a home. We build a friendship. We buy a zoo..."
- "I've been reading about goats. Not all goats. Specific goats. The fainting kind."

### Urgent Crisis Plea

- "I have an onion that MUST be caramelized but I have shaky hands, hit me back asap"
- "Are you familiar with birds. I have a situation."
- "Do you know how to jumpstart a car. This is time-sensitive. Also you're cute."
- "How many men were in the blue man group. I'm at quiz night and you're my one phone call. Urgent."

### Deadpan One-Liner

- "This is AI slop"
- "Damn, that dog for sale?"
- "Can a plant guy be a bad boy? Let's find out"
- "What kind of music do you like? Me? I hate music."

### Self-Deprecating Confession

- "Riddle me this, what's tall handsome and looks good in any hat? Not me, but lmk when you find the answer"
- "Looking for a wife-ish figure to open jars and laugh at my jokes. Room and board provided in a one-bedroom apartment with decent natural light."
- "Need someone to help me out of this chud life. You about that life?"

### Unhinged Relationship Escalation

- "Looking for someone to move into a Minecraft house with me. 2 bedroom, wool walls, and mid century modern furniture await us"
- "I have two adult tickets to Zootopia 2 and regal is looking for a queen."
- "I'm looking for someone who will eat the olive off my plate without asking. That's intimacy."

### Structured Bit

- "Multiple choice a) I tell you about my hands problem. b)..."
- "I have a PowerPoint about why we should date. It's 47 slides. There is a quiz at the end."
- "If you were in an elevator with Winnie the Pooh and Pol Pot and only had 1 bullet wwyd?"

### Ominous Threat As Flirtation

- "Don't yell at me or I'll go onomatopoeia mode"
- "I will fight your dad. Not in a disrespectful way. In a proving myself way. Bare knuckle in the yard."
- "I should warn you that the last person who ghosted me received a 14-page letter about accountability. Handwritten. Calligraphy."
- "I'm very normal about things. I'm so normal about things that people comment on it."

### Emotional Overshare

- "I cried at a commercial for paper towels last week so emotionally I'm very available"
- "My therapist said I need to stop dating women who remind me of soup. You look like a bisque. This is a problem."
- "I accidentally became the IT guy for my entire family and I just need someone who understands the weight of that"
- "I haven't cried since 2019 and I'm worried it's all stored somewhere"

### Corrupted Romance

- "Are you lightning? Because i want to make you McQueen. Kachow."
- "It brings great shame and dishonor to the men of our generation that a girl like you had to resort to this"
- "Look, I'm only getting older, and I need someone who can recognize signs of a stroke. Can that be you?"

### Mundane Domesticity As Peak Romance

- "Honestly I just need someone to go to Costco with. The samples are better when you're in love."
- "Looking for someone to split a really big sandwich with."
- "I'm at a Whole Foods can I get you anything?"
- "Looking for someone to fold fitted sheets with. I'll hold two corners, you hold your own. We figure it out together."

### Poetic / Literary

- "The way you hold that fish in your third photo, there's a tenderness there. A human and their bass, locked in an ancient dance."
- "In another life I think we were two shopping carts that bumped into each other in a parking lot."
- "And on the seventh day, God rested, and opened Hinge, and lo, there you were, holding a margarita the size of your head."
- "my only regret is never having named our love. For it faded, and I forgot what I could have called it"

### Philosophical / Existential

- "Do you ever think about how we're all just bones piloting a meat suit and then you see someone's meat suit and you're like... nice suit"
- "Sometimes I stare at the ceiling and think about how every decision I've ever made led me to this app and then I think about John Goodman."
- "The universe is expanding and I am also expanding, mostly due to the Cheesecake Factory. We are both doing our part."

### Negotiation / Sales Pitch

- "Here's what I'm prepared to offer: consistent texting, above-average height, and a willingness to watch whatever you want."
- "I'll be honest, my opening line conversion rate is not great, but my date-to-second-date pipeline is STRONG."
- "I have a ridiculous typing speed. like 80 WPM. The only way I can get faster is to add an extra set of hands, and I think you've got what it takes"

### Stream Of Consciousness

- "anyway I was thinking about birds and then I saw your profile and now I'm thinking about birds AND you which is a lot for a Tuesday"
- "ok so I don't usually do this but also I always do this but basically hi I think your face is good and I had a really big coffee today"
- "I opened this app to order food and now I'm here and I don't know what happened but you seem cool and I'm still kinda hungry"

### Character / Roleplay

- "This is actually his friend typing this. He can't text right now because he's in the bathroom crying about your profile."
- "[BREAKING NEWS] Local man sees profile so good he drops his phone in a Chipotle."
- "DISPATCH TO ALL UNITS: we have a match in sector 7. Small dog in photo 1."
- "Greetings fair traveler. I am but a humble merchant and I have wares."

### Callback / Re-Match Reference

- "We've matched before, you told me I didn't know Matt Damon movies I KNOW Matt Damon movies my hands were just freezing"

### Cursed Question

- "How many weeks pregnant is the perfect amount of weeks? Asking for a friend"
