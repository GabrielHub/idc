# Gameplay Traits

Gameplay traits are hidden planning signals used by Cupid systems to shape prompts, risk notes, and bounded state changes. They are not UI copy, not relationship truth, and should not be shown to the player.

## Member Fields

Use member fields this way:

- `datingProfile`: authored profile copy. The first sentence is the public roster tagline at intake. It must read like the member speaking about themself in one short sentence, carrying voice, personality, and a concrete hook. Later sentences are revealed only through player knowledge.
- `relationshipNeeds`: authored reasons a member might want a specific kind of date. These are not shown in full at intake.
- `preferences`: authored soft clues for good rooms, partners, and pacing. These are not shown in full at intake.
- `dealbreakers`: authored boundaries a member watches for. These are not shown in full at intake.
- `tags`: hidden deterministic gameplay inputs.
- `voice`: performance instructions for runtime AI only.

Do not add new member fixture fields unless gameplay or UI reads them. Do not reintroduce `traits` or `redFlags`. `traits` were vague public labels. `redFlags` mixed member behavior with things members reject.

## Player Knowledge And Visibility

The player starts with incomplete case files. `GameSave.playerKnowledge` is the save-owned record of what Cupid has filed for the player. It does not live inside `Member`, because fixture-owned member data can hydrate forward while preserving only member state.

Starting public member information:

- Name, first name, portrait assets, and retained or closed-file state.
- The focused member's current ask, because it is the active work order.
- Public profile fragments returned by `buildVisibleMemberProfile`.
- Redacted dossier blocks that show information exists without putting hidden text in visible UI, search, filters, sort modes, tooltips, aria labels, or hidden DOM text.

Gated member information:

- `species`, `origin`, `dimension`, `realityStatus`, and `bio`.
- Full `datingProfile`.
- `relationshipNeeds`, `preferences`, and `dealbreakers`.
- Exact Mood, Openness, Burnout, and retention.

Never player-facing:

- `secrets`, `tags`, `voice`, model prompts, raw rule hits, fixture indexes, exact stat deltas, and prompt-only labels.

Dev builds may expose a settings toggle for visual QA of fully unveiled member files. That preview may show gated member information and exact member state, but it must not file reads, mutate saves, or surface never player-facing fields.

Filed reads are player-facing knowledge, not raw facts. Current read kinds are:

- `profile`: additional public profile context.
- `comfort`: what helps a member relax or engage.
- `boundary`: what pressure or behavior crosses a member line.
- `ask`: whether the focused ask is fitting or blocked by the room.
- `pair_dynamic`: how this pair reads together.
- `scenario_pressure`: how the room is affecting the date.

Runtime AI can propose evidence ids only from a bounded reveal candidate packet. Game services validate those ids against authoritative candidates before persistence. Deterministic services can offer boundary risk candidates, but the judge or reveal filter must have transcript evidence or a reveal beat before a boundary read is filed. `JudgeSnapshot.usedEvidenceIds` stores only accepted ids so UI can attach filed reads to the Judge note that created them.

## Hidden Member Retention

Member `retention` is an internal quit-risk score used by deterministic services. It must not be exposed in player-facing UI as HP, health, or an exact meter. Player surfaces may show closed-file state or qualitative risk copy when needed, while services keep the numeric value for consequences.

## Hidden Tags

Every member needs 3 to 5 hidden tags and exactly one identity tag:

- Identity: `ordinary_human`, `non_human`.
- Needs and sensitivities: `prophecy_averse`, `privacy_sensitive`, `grief_sensitive`, `memory_sensitive`, `status_sensitive`, `needs_low_pressure`, `needs_clear_plan`, `sincerity_seeking`.
- Behaviors and pressure sources: `performative`, `attention_seeking`, `avoidant`, `competitive`, `ceremony_minded`, `career_focused`, `weirdness_native`, `reality_displaced`, `anxious_spiral`, `acquisitive`.

The `acquisitive` tag marks members who run relationships as recruitment funnels into a larger structure they already control. Their pitch is incorporation, not partnership, and their vocabulary treats a counterpart as something to be added to a manifest, a Pact, a fleet, or a household. Authored copy must show the recruiter cadence (Pact talk, manifest talk, equity talk, claim talk) for the tag to be earned. Authors should not stack `acquisitive` with `sincerity_seeking` casually; if both are present, the contradiction is the character (Vhool wants kindred sincerely and is also recruiting for the Lower Choir).

Hidden tags must be supported by authored copy. If a member has `prophecy_averse`, their profile, ask, preferences, or dealbreakers should make prophecy pressure legible to services and eventual filed reads without naming the tag.

## Match Fit

The match fit service scores booking pressure for a pair, a scenario, pair history, and active member asks. It does not decide attraction, compatibility, or whether a relationship works. Runtime AI owns character reaction and the judge reads the actual exchange.

- Internal booking pressure and ask signals.
- Private rule hits for tests and debugging.
- A starting Date Health delta.
- Boundary risk candidates for prompt context and player knowledge.

Use match fit as a nudge, not a verdict. It may say that an ask is hard to honor in this room, that a scene starts under pressure, or that a known boundary is risky. It must not force a pair to fail because an author expected friction. If the LLMs play a surprising warm turn and the judge accepts it, app state should be able to move with that result.

After the date starts, validated judge output owns Date Health deltas, pair stat deltas, member mood deltas, early endings, and evidence use. Match fit must not add per-exchange drift, auto-collapse Date Health, or auto-file a boundary read without transcript evidence or a reveal beat.

The pre-date brief does not show exact fit, pressure, ask, blocked ask copy, named member boundary risks, raw scenario tags, or numeric pair stat meters. Pair visibility comes from prior public notes, filed `pair_dynamic` reads, outcome labels, and nonnumeric follow-up intent copy. Spark, Strain, Relationship Health, tag names, numeric deltas, and exact rule hits stay hidden.

The partner recommendation badge is a conservative booking nudge. It appears only when the top eligible partner is strong, not high pressure, not blocked against the active ask, not carrying boundary risk, and ahead of the next recommendable candidate by a meaningful margin. If the current room produces a tie, a weak top score, or only least-bad options, the UI should show no recommendation and let the player choose.

Exact Date Health remains visible during the live date because it is the fail state players must manage. Final reports and public notes must not repeat exact Date Health, exact Date Health deltas, Spark, Strain, Relationship Health, or projected stat math. The saved `statSummary` field remains for schema stability, but its content is player-safe case copy.

## Member Request Tags

Member requests use a controlled tag taxonomy that is separate from hidden member tags. These tags express deterministic asks for fit scoring. They are not UI copy.

- Date shape: `normal_date`, `quiet_date`, `low_pressure`, `structure`, `grounded`, `choice`.
- Boundary and pressure asks: `prophecy_averse`, `privacy`, `discretion`, `name_discretion`, `career_fatigue`.
- Partner values: `sincerity`, `career`, `respect`, `decisiveness`, `care`.
- Content flavor: `cosmic`, `memory`, `online_creator`, `performative`, `career_intense`, `deity`, `advice_giver`, `cryptid`, `saboteur`, `anxious_rambler`, `midlife`, `tech_illiterate`, `fae`, `widower`.

Avoid one-off request tags. If a new request tag is needed, add it to `memberRequestTagSchema`, update deterministic fit handling when it should affect scoring, and add coverage in the same change.

## Boundary Risk

Boundary risk exists when an authored boundary has enough deterministic evidence to warn the prompt and offer a safe reveal candidate. It does not collapse the date by itself. Examples:

- Prophecy pressure against a prophecy-averse member.
- Museum-style public exposure against a privacy-sensitive member.
- Forced memory intimacy against a grief-sensitive member.

Only the judge can end the date early after reading the exchange. If the transcript supports a boundary read, the judge or deterministic reveal filter may file the player-safe read. The UI shows the filed read, not the raw tag or rule hit.

## Roster Chemistry Pressure

Members are designed against each other, not in isolation, but no member fixture should name another member as a destined match, enemy, failure, or success. Every member should have at least two natural warm pressures and two natural friction pressures in the existing roster, expressed through authored profile fields and voice patterns. The LLM reads needs, preferences, dealbreakers, secrets, and refused voice patterns to perform the friction or fit.

Source chemistry pressure from voice and tone, not from a separate runtime answer key. If a partner's voice patterns or tics would land on this character's `dealbreakers` or `voice.patternsRefused`, the friction is available. If a partner's preferences would let this character relax their guard, warmth is available. Available does not mean guaranteed. The player should learn the shape through the date, filed reads, and notes instead of receiving the answer key on the roster screen.

The map below is an authoring heuristic for humans. It is not prompt copy, not a fixture dependency list, and not a deterministic relationship matrix. Scenarios and member fixtures should imply these pressures through reusable traits and situations rather than naming the intended counterpart.

For every new member, run an LLM-assisted authoring pass after the profile and voice draft exists. Name exactly four natural warm anchors and four natural friction anchors from the current roster. If four warm anchors cannot be found, the member is probably too narrow or too isolated. Use the pass to revise needs, preferences, dealbreakers, tags, and voice. Do not store the four-name list in the member fixture, scenario fixture, prompt, or runtime scoring table. The list is an authoring audit, not a canon relationship answer.

### Four-Anchor Authoring Pass

Use this pass when creating or revising a member. The pass may be done by Codex or another LLM during content development, but it is not part of runtime gameplay.

Prompt shape:

1. Read the drafted member fixture, their voice block, and the current roster.
2. Name four warm anchors from the roster. For each, give one sentence of evidence from needs, preferences, dealbreakers, voice, tags, or reality frame.
3. Name four friction anchors from the roster. For each, give one sentence of evidence from the same fields.
4. Identify which authored fields should change if the anchors are weak, duplicated, or all coming from one trait.
5. Confirm that no member fixture, scenario fixture, prompt, or scoring table needs to name those anchors directly.

Red flags:

- The same member appears as the obvious warm answer for too many unrelated drafts.
- The warm list depends on a specific scenario instead of the member's durable character design.
- The friction list depends on "hero hates villain" style declarations instead of authored needs, refusals, and voice.
- A proposed hidden tag exists only to force one named pair.
- The pass cannot find four plausible warm anchors without inventing facts absent from the fixture.

### Warm clusters in the current roster

- **Sincerity tribe**: Jenna, Sana, Marcus, Toby, Mei, Ryan. Marcus + Sana, Marcus + Jenna, Toby + Sana all warm. Mundane domesticity, low pressure, no performance. Mei sits at the high-energy end of the cluster: hyperfocused on her craft, no bit, lets others finish a sentence because she expects the same. Ryan sits at the loud end: bro register on top of sincerity, fresh out of a six year, attention-seeking volume wrapping the same low-pressure ask as the rest. The tribe absorbs him only when partners read the wrapper as wrapper.
- **Ceremony tribe**: Vhool, Aldric, Eleanor, Decimus, Wenshu. Aldric + Vhool (sacred bargain), Aldric + Decimus (soldiers), Eleanor + Decimus (cold formal pair), Wenshu + Vhool (Dao-talk meets Pact-talk, same dialect of seriousness). Shared formal cadence reads as fluency.
- **Reality-displaced peers**: Opal, Aldric, Decimus, Meridian, Sera, Wenshu, Cha, Imani. Mutual recognition of having walked through a wrong door. Their world was normal; this one is the strange one. Sera is the only one displaced from a future. Wenshu is the only one who believes his displacement is a sanctioned trial; the others know better. Cha is displaced from a continuous Awakened branch where Gates opened in his lifetime; he treats 2026 Earth as quiet, not strange. Imani crossed from an adjacent Earth where reapers are union civil service; she treats this branch as similar enough not to comment, brings the bright lunch-hour register her own Earth uses, and parks the job at the door.
- **Grief siblings (low intimacy only)**: Gideon, Marcus, Decimus, Cha, Nawal. Marcus + Decimus is healthy. Decimus + Cha sits clean: two soldiers two centuries apart, both buried teammates, both got shoved onto Cupid by a daughter or sister. High intimacy compounds for the rest. Nawal joins ambiently as the post-career grief register: not an active grief, just six centuries of caseload she now thinks about over Thursday tea. She does not bring it; she does not run from it; the silence around it reads as kin to the others.
- **Career grind**: Tasha, Mr. Whiskers, Meridian, Marcus, Sera. Calendars, decisive plans, no negotiation. Sera + Tasha share confirmation discipline; Sera + Eleanor share Term-and-Bargain protocol fluency.
- **Acquisition register**: Vhool, Reaver, Cthala. Three different modes of treating the date as a recruitment funnel into a structure they already own (Pact / fleet / Spire). Vhool is sincere and apologetic, Reaver is mercenary and announced, Cthala is calm and undeclared. Their vocabularies recognize each other; whether the meeting lands warm or volatile depends on which mode meets which. Match-fit reads `pair:mutual_acquisition` across all three pairings.
- **Glamour cluster**: Venus, Cassie, Naia. Three shapes of dressed-for-the-room. Venus counts compliments and needs the room to name her first. Cassie is brand-trained and runs from publicity, smiles for the camera by reflex. Naia is on the family allowance, gives compliments freely, and keeps no count. They share aesthetic territory without sharing tags, so they do not land deterministically; the comedy lives in how each one's relationship to being looked at destabilizes the others. Naia is the only one of the three who is not anxious about the room.
- **Dry deadpan cluster**: Gabriel, Mei (when she lands), Tasha (off the trading desk), Sera (off duty). Different vocabularies, same low-effort high-taste cadence. Gabriel + Mei is the cleanest sit: both lead with a strange opinion and let the other finish a sentence. Tasha + Gabriel is two clipped registers that share confirmation discipline without renegotiating. Sera + Gabriel is fluent or sterile depending on whether either drops protocol in time.

### Friction zones in the current roster

- **Performer vs sincerity-seeker**: Brady or Kade or Anansi vs Sana, Marcus, Toby, Aldric, Mei, Wenshu, Imani. Sincerity-seekers read bits as evasion. Performers read sincerity as a trap. Mei vs Kade is sharp because Kade wants to film her sets and she will not be content. Mei vs Brady cracks the bit faster than most because her enthusiasm has nowhere for irony to land. Wenshu reads as performative on the surface but is sincerity-seeking underneath; Brady clocks him as a fellow operator and they sit in mutual bit recognition until one cracks. Anansi is the quiet-performer variant: no flourish, no riddle, just small lies aloud and a story that turns out to be the point; the sincerity tribe reads the lying-aloud as evasion before they read the point. Imani is sincerity-seeking under a bright wrapper; performers reach for irony and the K drama setup answers them unironically, and the bit cannot land on a partner who is having a great time talking about a piano scene.
- **Privacy vs attention**: Calvin, Meridian, or Cthala vs Kade. Calvin vs Brady (recorder). Cthala against any partner who reaches for a phone, since the form does not film. Phones on the table are a hard no for the privacy-tagged.
- **Competitive collisions**: Venus vs Tasha, Venus vs Mr. Whiskers, Mr. Whiskers vs Tasha. Spark high, trust low.
- **Prophecy-averse meets ceremony**: Opal vs Vhool ("Pact"), Opal vs Aldric ("Saints"), Opal vs Wenshu ("Fated Counterpart"). Opal has built a binder against this exact energy. Wenshu uses "fated" in his dating profile, which is literally on her list.
- **Anxious-spiral compound**: Toby + Kade, Toby + Opal, Toby + Brady. Two anxious people pull each other tighter.
- **Formal lockup**: Mr. Whiskers vs Eleanor (neither will drop the formality), Meridian vs Mr. Whiskers (both clipped, both armored).
- **Bit collision**: Brady vs Kade. Different vintages, same dishonesty. Each can feel the other doing it. Gabriel vs Brady is the same shape one register colder: Gabriel reads Brady's editor's-note shtick as a slower deadpan that bought itself a costume, Brady reads Gabriel's three-word tests as the work he wishes he was still doing.
- **Deadpan vs influencer / pitch energy**: Gabriel vs Kade, Gabriel vs Mira. Kade reads as soft launch noise; Gabriel will not be a b-roll moment, and one ring-light reach kills the date. Mira opens with founder energy and a Carnegie reference, Gabriel answers in three words, Mira files it as low intentionality. Both pairs die clean by the second course.
- **Deadpan vs sincerity collision**: Gabriel vs Toby, Gabriel vs Aldric, Gabriel vs Naia. Toby's spiral has nowhere to land because Gabriel will not reciprocate the overshare. Aldric reads irony as discourtesy and asks if Gabriel jests. Naia takes the charmander line at face value and the irony has nowhere to go, like the Brady vs Naia shape but Gabriel exits sooner.
- **Protocol vs sincerity**: Sera vs Sana, Sera vs Marcus, Sera vs Jenna, Sera vs Toby. Sera offers Standard Terms and week-three cohabitation review; sincerity-seekers read it as evasion. She reads their pace as missing data.
- **Cha's combat-strength filter**: Cha's narrow read of the roster. He warms to literal combat-tier strength as recognition (Decimus, Aldric, Vhool, Venus on the divine register) and to anxious or fragile members as protection (Toby, Opal, Brady when the bit cracks, Wenshu under his performance). Everyone in between (Sera, Eleanor, Calvin, Mei, Mr. Whiskers, Kade, Naia, modern unmarked humans) gets two-word replies and a polite dismissal. The filter is sharp on purpose; most matches die in warming.

### Volatile but interesting

- Eleanor vs Aldric: she literally cannot lie, he is sworn to Honor. Either click or courtly duel.
- Venus vs Opal: goddess of love meets the professional wedding planner. Electric.
- Brady vs Marcus: forced sincerity collision. Real chance of breaking Brady.
- Calvin vs Vhool: Calvin's "I am normal" act meets Vhool's loud non-normal. Destabilizing for Calvin.
- Sera vs Aldric: 1190 oaths meet 2087 SLAs. Both treat commitment as a binding instrument; the vocabularies cannot decide whether to translate or feud.
- Sera vs Calvin: she clocks him as another non-Prime inside two minutes. Reads as warmth to her, alarm to him.
- Sera vs Eleanor: a contractual fae and a contractual auditor compare ledgers. Either fluent partnership or a lawyered duel.
- Mei vs Gideon: a Brooklyn DJ who reveres house music history meets a 1962 hotel ghost. She wants to ask him about the Palatine lobby piano. He has been practicing one piece for sixty three years. Genuine spark possible if she can listen at his speed.
- Mei vs Aldric: rapid sincere meets knightly sincere. Different vocabularies, same conviction. He will not understand a word about gear. She will not laugh at the Briar Hold. The match is whether either gets a foothold.
- Mei vs Mira: craft career meets corporate career. Mira will pitch monetization. Mei will hear "you should turn your hyperfixation into a brand" and lose interest by the second course.
- Aldric vs Wenshu: Saints vs Sect. Two ceremonialists raised on different scriptures with identical conviction. Either fluent doctrinal feud or surprised warm recognition. Both default to M'Lady on occasion, Aldric by tradition and Wenshu by absorbed internet text.
- Eleanor vs Wenshu: she literally cannot lie. His surface is lyrical lies he believes. He cannot tell which lies he is living inside. She will unmake at least one of them by accident.
- Vhool vs Wenshu: both treat their metaphysics as routine. Pact and Dao recognize each other and the awe drains out of the table. The most likely warm landing for Wenshu in the roster.
- Cha vs Wenshu: he is what Wenshu is pretending to be. Cha sees through to the demoted kid under the flourish. Cold-correct reading shatters Wenshu; quiet pity shatters him worse. Wenshu would rather be defeated by the real article than pitied by it.
- Cha vs Decimus: two soldiers two centuries apart. Both buried teammates, both got pushed onto Cupid by a daughter or sister. Mutual recognition without ceremony. They could share most of a meal silent and call it good.
- Cha vs Aldric: Sir Hunter and Sir Knight, different scriptures, identical conviction. Aldric will not correct his vocabulary; Cha will not correct his.
- Cha vs Vhool: cosmic-tier recognition without sincerity-seeking. Vhool's Pact talk reads as familiar shop talk. The risk is Cha being too level for Vhool's loneliness; the win is Cha letting one too-honest sentence slip and Vhool registering it.
- Cha vs Venus: he respects the divine. He will not perform the compliments she counts. Either she finds the unbothered register fascinating or she rescinds before dessert.
- Cha vs Opal: surprise warm. He refuses cosmic vocabulary at the table. He never says fated. He never says chosen. The safest match Opal has had on Cupid, and she clocks it inside the first course.
- Cha vs Toby: surprise warm. Cha protects anxious people by default; the dead get to finish their sentences and the living get the same courtesy. Toby's spirals do not wear him down.
- Cha vs Calvin: sharp friction. Cha's whole architecture is plain about what he is. Calvin's whole architecture denies what he is. One short flat sentence about it lands and Calvin lawyers up.
- Cha vs Brady: default dismissal. The bit gets two-word replies and falls flat. If Brady cracks, Cha softens; if Brady hardens, the date dies in warming.
- Reaver vs Aldric: mirror-image recruiters. Both pitch a Lady to make the journey home, both name a household with a Mission, both will list equity. Aldric's frame is Saints and Honor; Reaver's frame is Manifest and Recovery. Aldric stays longer than the player expects and departs cleanly when the systems are named. Friction is not deterministic; it lives in the authored fixtures.
- Reaver vs Cassie: openly the heroine and openly the villain. Cassie is Helios-licensed and runs from publicity; Reaver broadcasts the Manifest as the opener. Her dealbreaker on release-form energy fires against his Patron-asking. Friction is not deterministic; the brand-trained Cassie performer and the captain-confident Reaver performer collide on register alone.
- Reaver vs Cha: protector versus predator. Cha hunts to protect Seoul; Reaver runs Recovery contracts. Cha's filter clocks combat-tier strength on the wrong side. Date dies in warming.
- Reaver vs Decimus: retired Republic centurion versus active raiding captain. Decimus would clock him as exactly what the Tenth Legion existed to fight. Cold formal friction.
- Reaver vs Eleanor: surprise warm. She literally cannot lie; he announces what he is. The Bargain has shape on the first message. Possibly her cleanest match in the roster.
- Reaver vs Sera: clipped audit register meets clipped operator register. He sends a Term sheet for queenship; she audits the Liquidity figures. Either fluent partnership or formal breach.
- Reaver vs Vhool: both `acquisitive`. Pact talk meets Manifest talk and neither flinches. Match-fit fires `pair:mutual_acquisition` as volatile-warm. The risk is Reaver being too level for Vhool's loneliness.
- Reaver vs Calvin: both privacy-sensitive in shape, opposite in mode. Calvin denies what he is; Reaver broadcasts. Calvin lawyers up by message three.
- Reaver vs Mr. Whiskers: business-class mutual courtesy. Both refuse to address what they actually do; both hold professional register. Surprise warm.
- Reaver vs sincerity tribe (Sana, Marcus, Toby, Jenna, Mei, Mira): worst-date-ever territory. Mira might pitch him on Series A before catching herself.
- Cthala vs Vhool: peer cosmology, different register, same dimension. Vhool sits in the Lower Choir and apologizes for the tremor; Cthala sits in the Drowned Spire beneath her and does not apologize for anything. Vhool clocks her as kindred and finds her unwilling to apologize back. Cthala does not need Vhool, and that fact wounds the existing engine. Volatile-warm via `pair:mutual_acquisition`; Vhool is the more likely one to crash.
- Cthala vs Eleanor: literal-truth meets predator-truth. Eleanor cannot lie. Cthala does not lie either, plainly. Bargain and chosen form recognize each other on message one. The friction is that any partner asking "what are you" hits Cthala's hardest dealbreaker, and Eleanor's instinct to surface a Bargain may push her there. The match dies cleanly when it dies.
- Cthala vs Sir Aldric: villain-tier ceremony foe. Aldric's order rides against the cosmology Cthala represents. His "blasphemy, casually deployed" dealbreaker has been waiting for a member who actually represents the threat. He will draw the sword at the table. Hard-stop trip is a near certainty; the comedy lives in Aldric arriving with the questionnaire intact.
- Cthala vs Cha Yusung: predator versus hunter. Cha hunts shades. Cthala collects Consorts. His combat-tier filter clocks her as opposition the way Reaver gets clocked as opposition; the date dies in warming with two-word replies. The shade companion's red eyes glow before dessert.
- Cthala vs Sera Vohn: clipped operator register meets clipped sleeper register. Sera audits corporate marriages. Cthala treats Consort acquisition with the same plainness. Either fluent partnership or a contractual duel about whether week-three cohabitation review applies to a dimensional consort agreement.
- Cthala vs Cassie Conners: brand asset meets entity in chosen form. Cassie has been wearing DAYBREAK since she was nineteen. Cthala has been wearing this body for some unspecified period. They recognize each other as performers immediately. The friction is that Cthala does not have a Renata to be told she is being weird about it, and Cassie's release-form energy fires Cthala's no-recording line.
- Naia vs Marcus: surprise clean warm. He is face-value to the bone; she is face-value by culture. He explains a furnace run; she takes it as charming local color and asks one good follow-up. He is mildly bewildered and never put off. The cleanest match Naia has with a modern unmarked human.
- Naia vs Mei: rapid sincere meets celebratory sincere. Naia compares Brooklyn club lighting to lighting in three other branches. Mei has never had a date who has been to dimensional clubs. Both let the other finish a sentence; both expect the same.
- Naia vs Aldric: two cultural envoys treating their customs as normal. He addresses her as Lady; she returns the courtesy. He explains the Briar Hold. She nods through it and asks where the music sits in his order's calendar. Different vocabularies, identical conviction that the customs are obvious.
- Naia vs Vhool: surprise warm. She does not flinch at Pact talk. She also will not enter a Pact (the lease is the lease). She finds Vhool easy and tells them so plainly. Vhool has not heard that sentence at the table before. The risk is Vhool reading her plainness as a soft yes.
- Naia vs Toby: surprise warm. Toby's request for a topic with three branches and freedom to pick one lands naturally on the way she runs first dates. She finds his late-shift grocery stories fascinating. Spirals do not wear her down because she is not tracking exit cost.
- Naia vs Brady: the bit cannot land. She answers his ironic questions sincerely and the irony has nowhere to go. He reaches for sharper jokes; she takes them at face value. Either he cracks earlier than usual or the date dies in warming with him visibly losing his footing.
- Naia vs Mira: Mira clocks "heir from another dimension" and starts pitching her on a partnership. Naia: "I do not invest. I spend. The allowance is not mine to allocate." Mira disengages. Hard exit by dessert with both parties calm about it.
- Naia vs Calvin: privacy-sensitive cryptid meets high-visibility princess. She compliments him three times in two minutes. He retains counsel. The asymmetry is the entire match.
- Naia vs Reaver: clipped princess meets clipped captain. Surface looks warm. Reaver opens the Manifest, names Liquidity, asks her House standing. Her House is fine and she does not negotiate the allowance. He reads her as a non-serious counterparty and disengages. Soft cold breach by second course; neither performs hurt.
- Naia vs Eleanor: both literal, both ceremony-minded, opposite temperatures. Eleanor binds; Naia leases. Eleanor cannot lie; Naia does not bother. Eleanor's instinct to name the Bargain meets Naia's "the lease is the lease" and the Bargain has a quarter-long term whether they like it or not. Either fluent recognition between two literal speakers or a sharp temperature mismatch when commitment surfaces.
- Naia vs Venus: destabilizing for Venus. Naia gives compliments freely and does not need them counted back. Venus does not know how to receive that and either drops the count by surprise or rescinds before dessert. Either outcome is interesting; Venus rarely lands either gracefully.
- Naia vs Cassie: image-trapped meets image-free. Cassie's brand cage is visible next to Naia's freedom. Cassie may envy or harden. Naia compliments DAYBREAK's color story without irony, and Cassie does not know whether to be flattered or audited. Could land warm if Cassie drops the Pose.
- Naia vs Cthala: two members who refuse the "what are you" question, for opposite reasons. Cthala will not name the form; Naia will name the form, the Glow, the regency, and the allowance freely, and still expect the partner not to make her travel a topic. Cthala finds the disclosure register unfamiliar. Naia finds Cthala's reticence charmingly local.
- Ryan vs Jenna: surprise warm. He thinks Cupid is a regular app, she thinks Cupid is a regular app with strange branding, and both have rejected the robe-altar-binder route. He picks a patio bar, confirms once, drives. She lets a fish story land if it actually lands. The risk is the lets gooooo cadence at a tired closer; the win is two people who can describe their day in plain nouns over breadsticks.
- Ryan vs Marcus: cross-generation working-class warm. HVAC route at 52 meets sportfishing deck at 27, both fresh off a long-term (Marcus eight years, Ryan eight weeks). Marcus reads the bro voice as a younger version of the lot guys he eats lunch with. Ryan reads Marcus as the version of himself he is afraid he is not going to make it to. Spirals nowhere, neither apologizes more than once.
- Ryan vs Mei: rapid sincere meets loud sincere. He runs a fish story; she runs a four-deck transition. Neither cuts the other off. Mei treats the deckhand vocabulary the same way she treats gear nerds. The risk is Ryan reaching for a Skrillex line in the cooling phase and Mei filing it.
- Ryan vs Naia: face value meets face value. Naia takes lets gooooo as honest enthusiasm and asks what the boat is called. Ryan takes "the lease is the lease" at face value and respects it without auditing. The compliments do not get counted on either side.
- Ryan vs Toby: anxious-spiral compound, warm-ish. Two recently-bruised men with no exit on their sentences. Toby's spiral lands on Ryan's grief; Ryan's grief is too fresh to hold up the spiral. They will either talk for four hours or both crash out by the entrée.
- Ryan vs Mira: deadpan vs pitch energy collision, loud edition. Mira opens with founder energy and a Carnegie reference; Ryan answers yeee and pitches the marina patio. She files it as low intentionality before the second drink. Hard exit before dessert.
- Ryan vs Sera: clipped audit register meets lets gooooo. Sera offers Standard Terms and a week-three cohabitation review on message two. Ryan reads it as the breakup terms his ex's lawyer threatened and the bro voice gets quieter, then sharper. Friction is real and ugly.
- Ryan vs Brady: bit collision. Brady runs the dispatch shtick; Ryan asks if he is doing okay and means it. The sincerity cracks the bit faster than usual. Either Brady drops the editor's note voice for the first time in months or the date dies in warming with Ryan apologizing for caring.
- Ryan vs Eleanor: literal fae meets imma keep it 100. She cannot lie; he uses no cap and imma keep it 100 as load-bearing vocabulary without irony. The vocabulary mismatch reads as two people speaking different dialects of plain truth. Either fluent recognition or a courtly bewilderment by second course.
- Ryan vs Cha: combat-strength filter dismissal. Cha clocks Ryan as a guy and lands two-word replies through warming. The bro voice does not register as fragility or recognition; the date dies polite and cool.
- Ryan vs Cthala: boundary risk. Ryan asks "yo, what are you, like, exactly" inside the first hour and reaches for his phone to look something up. The recording line trips and the cosmic vocabulary lands at the wrong volume. The date is under serious pressure before the appetizer.
- Ryan vs Calvin: privacy collision. Ryan runs a story about the boat insta and reaches for his phone to show the bluefin. Calvin retains counsel by message three. Going forward.
- Anansi vs Brady: bit recognition between two storytellers, one ancient one editor's-note. Brady clocks the small lies aloud and reaches for the matching register; Anansi declines to escalate, which is its own move. Either fluent operator detente or one of them cracks the other's cover by accident.
- Anansi vs Vhool: cosmic peers, different temperatures. Anansi treats the Pact talk as familiar shop talk and laughs once; Vhool earnestly does not laugh back. Warm because neither flinches; the risk is Vhool reading the trickster's plainness as a soft yes.
- Anansi vs Naia: refuse-to-apologize harmonics. She gives compliments freely and keeps no count; he can receive without paying back. The trick has nothing to do, which makes for one of his cleaner landings.
- Anansi vs Mei: let-the-sentence-finish. Both treat the other's craft as craft. She runs a four-deck transition; he runs a long story about a jug of palm wine. Neither cuts the other off; both expect the same.
- Anansi vs Sana: sincerity-seeker reads the lying-aloud as evasion before she reads the point underneath. He cannot make the lies smaller without dropping the cover entirely; she will not pretend they are not there. Date dies in warming, polite and cool.
- Anansi vs Aldric: Saints meet casual deal-making. Aldric reads the small lies aloud as blasphemy and reaches for the questionnaire; Anansi will not relitigate the questionnaire. Hard friction on register, courteous on exit.
- Anansi vs Cha: combat-strength filter dismissal. Cha clocks performance as a tell, lands two-word replies through warming, and the date ends polite and cool. Anansi does not push; under emotional pressure he goes quiet, not loud, which Cha registers but does not soften toward.
- Anansi vs Opal: storyteller cadence, third-person self-reference, and the rumor of fate around any deity all ring her binder. She is not unkind about it; she just files the date under "no" by the first refill.
- Anansi vs Venus: two narrative-minded performers fighting for the room. She counts compliments; he refuses to pay them back on schedule. Either she finds the unbothered register fascinating and pivots, or she rescinds before dessert and tells the maitre d about it on her way out.
- Anansi vs Eleanor: literal-truth fae meets storyteller. She cannot lie; he lies aloud as routine. Either she unmakes one of his small lies by accident and he respects it, or two registers of literal talk past each other for an hour. Volatile, not deterministic.
- Nawal vs Cha: ex-professional silence pair. Both refuse to flex about the post. Two-word answers count as currency. Cha's combat filter does not fire because Nawal does not register as a threat or as fragility; she registers as a colleague who has also clocked out, and the date can carry most of a meal on shared silence.
- Nawal vs Decimus: two retirees comparing post-career calendars. He says eighteen hundred and she says eighteen hundred and they hold. Neither asks the other to perform recovery; neither asks the other to perform anything. Possibly the easiest match in the cast for either of them.
- Nawal vs Naia: the cleanest landing Nawal has. Naia picks venues with confidence and compliments freely without keeping a count. Nawal returns plain answers; Naia takes plain answers as plain answers. Both leave the calendar at the door.
- Nawal vs Sana: sincerity tribe receives "I do not know yet" as a real answer. Mundane domesticity overlaps clean. Neither asks the other to swear a vow; neither needs the other to be funny about Tuesday.
- Nawal vs Venus: Venus needs to be admired by station and counts compliments aloud; Nawal refuses to perform admiration on any schedule. The compliment economy collapses against civil-service flatness. Venus either rescinds before dessert or files Nawal under withholding.
- Nawal vs Wenshu: Romance Dao requires cosmic vocabulary; Nawal deflates it into preference language by reflex. Her "I no longer hold that office" lands on him as either mockery or a Failure of the Form. The seven Trials have nowhere to file with someone who treats the entire register as paperwork that ended.
- Nawal vs Reaver: she has a stipend, no Manifest, no Liquidity, no Equity. He clocks her as non-serious counterparty by message three. She does not perform offense about it; he does not perform interest. Soft cold breach by the second course, both parties calm.
- Nawal vs Brady: the bit collapses. He runs the dispatch shtick; she answers "what do you actually want" plainly. Without a willing volley, the editor's-note voice has nowhere to land, and Brady can feel the air leave the table.
- Nawal vs Vhool: acquisition register meets retirement register. Vhool reads her as a fellow Pact-bearer and opens kindred talk; she gently declines and Vhool registers it as the closest thing to refusal he has heard from a peer. His loneliness has not met this shape before, which is the entire match.
- Nawal vs Eleanor: two literal speakers comparing contract registers. Eleanor binds and tracks Favors; Nawal ran an office that closed by mutual letter. Either fluent professional recognition between two clerks of different jurisdictions or a sharp disagreement about whether contracts can ever truly close.
- Imani vs Nawal: bright reaper meets retired post-career silence. The one short sentence Imani uses about the work lands as kin to Nawal's silence about her own closed Office, and the K drama recommendation lands as the polite end of the work topic. Both leave the calendar at the door; surprise warm.
- Imani vs Mei: rapid sincere meets rapid sincere with two different specific-hobby vocabularies. Mei runs a four-deck transition; Imani runs a Crash Landing on You setup. Neither cuts the other off; both expect the same. Possibly the cleanest landing either has had.
- Imani vs Naia: face value meets face value. Naia asks which Twice member is the bias and listens; Imani asks where the music in the regency calendar sits. Compliments do not get counted on either side and the K drama is taken seriously.
- Imani vs Toby: volatile-warm. The bright register has somewhere for his spiral to land for the first time, but his stacked apologies read against her smiley-face checks as grading. Either she pulls him out of his head for an hour or the date dies in an apology loop neither of them can stop.
- Imani vs Gideon: bright reaper meets 1962 piano ghost. She knows the practical side of the work he is the result of; she does not bring it. He has been practicing one song for sixty-three years; she lets him talk about it without checking her phone. Either he relaxes for the first time in decades or the bounce reads as new-tenant noise.
- Imani vs Brady: the bit cannot survive sincere K drama enthusiasm. He reaches for sharper irony; she takes it at face value and tells him a real plot summary. Either he cracks (the rarer outcome) or the date dies in warming with him visibly losing the footing.
- Imani vs Kade: filming the reaper is the worst opening move in the roster, and the bright register makes the violation read worse because she answered him warmly first. Hard exit before the appetizer, both parties less calm about it than usual.
- Imani vs Gabriel: bright sincere meets dry deadpan. He will not reciprocate the K drama enthusiasm; she will not file the wordplay as cool. The date dies polite, both calm about it, neither having done anything wrong.
- Imani vs Cha: combat-strength filter dismissal in a new shape. She is death-adjacent but bright, not combat, and not anxious. He clocks the brightness as wrong category and lands two-word replies. Polite cool exit by the second course.
- Imani vs Aldric: he may bristle at the work and then she asks about the Briar Hold with the same sincerity she gives a piano scene; the courtesy holds. One of the warmer cosmic pairs Aldric has, and the one most likely to land with him asking her to send him the show.
- Imani vs Vhool: lonely apologetic cosmic meets bright cosmic-job. Either Vhool finds the bounce healing or the brightness alienates them on contact. Volatile-warm; Vhool is the one who could crash, because Imani is not lonely in the way Vhool needs her to be.
- Imani vs Wenshu: he says "Fated Counterpart" and she answers "lol no thanks :)" in a register that is genuinely warm. The brightness closes his frame faster than any dry refusal would, and he cannot survive being declined kindly. The date is over by the second drink and he is the one who feels worst about it.
- Sienna vs Imani: bright Canadian Korean idol meets bright reaper fan. Two lowercase i registers, two K pop reference frames overlapping, both fan of things publicly. The risk is Imani going self conscious about her bright wrapper in the presence of a working idol; the win is the cleanest sit either has had with a partner who runs hotter than they do.
- Sienna vs Alex: loud start sincere meets pick me sincere. Both say for sure too many times, both pick from a short list, neither asks the other to manage the volume. Surprise warm with two patio orders and no workshopping.
- Sienna vs Naia: generous compliments without keeping count, on both sides. Naia takes literally me at face value and returns the energy unscored. Both running this branch is one of many register without making the tour the topic.
- Sienna vs Mei: peer recognition between working crafts. Different vocabularies (choreography vs gear), identical end of sentence expectation. Mei treats the choreo talk the way she wants her own track talk treated.
- Sienna vs Cassie: mirror, not match. Two camera trained dimensions, opposite postures. Cassie sees the cage and runs; Sienna does not know there is one to be off. Volatile warm if Cassie watches Sienna move through the same pressures without flinching, polite collapse otherwise.
- Sienna vs Gabriel: dry deadpan refuses to volley fan service energy. He goes three words; she fills the silence with a compliment that lands wrong. Polite collapse by the second course, neither having done anything wrong.
- Sienna vs Sera: clipped audit register meets for sure for sure. Sera offers Standard Terms and a cohabitation review on message two; Sienna says yes and panics. The yes saying compounds because she will agree to terms she does not understand. Sera files it as missing data and the breach is soft cold by the entree.
- Sienna vs Cha: shared profession, mismatched register. Combat strength filter clocks her as combat tier, but the pick me wrapper reads as wrong category. Two word replies through warming, dies polite, neither softening toward the other.
- Sienna vs Brady: bit collision in the pick me direction. He runs the editor's note shtick; she answers sincerely with a thank you and a follow up question, and apologizes for being early. He visibly loses the footing. Either he cracks or the date dies in warming with him quieter than usual.
- Sienna vs Mira: Mira clocks an artist with a tour and a unit and starts pitching a brand partnership over the second martini. Sienna says yes, realizes mid entree she has been pitched, and panics about how to back out. The yes saying eats the dinner; both calm at exit, neither happy.
- Sienna vs Kade: filming the table fires her label clause on the first phone reach. The brightness breaks for the first time in months and the apology cycle starts. Hard exit before the appetizer, both parties less calm than usual.
- Sienna vs Mr. Whiskers: he hates baby talk and informal register; she calls the server bud and apologizes to the host for being early. Cold mutual courtesy at best, formal collapse at worst when she compliments his coat three times.

Update this map when adding a member. If a new member does not slot into any cluster or friction zone, that is a sign the design is too generic.

## Focused Cases And Shift Cadence

Cupid runs four focus cases at a time and one date per shift. This frames the player as a relationship operator who carries small case loads instead of a matchmaker who rerolls every shift.

- The save owns `focusedMemberIds`, capped at 4. Onboarding requires exactly 4 selected from the 38 active members; closures free a slot. `app/services/focus-cases.ts` exposes `selectInitialFocusCases`, `addFocusCase`, `removeFocusCase`, and `swapFocusCase`. The shift's `featuredMemberIds` mirror `focusedMemberIds` for backwards compatibility.
- Swapping a focus case costs 25 retention to the dropped member. Removing a case (through closure or open-slot freeing) does not. Adding into an open slot is free.
- Closed and quit members cannot be focused, matched, or selected for shift requests. Their lifecycle status lives on `member.state.status` as `active`, `closed`, or `quit`. When retention drops to zero the engine flips status to `quit`. Closure is a separate workflow.
- Each shift books one date. After a date finishes (completed or ended early), both participants stamp `member.state.lastDateShift` and enter a one-shift cooldown. `isMemberInCooldown(member, currentShift)` is true on the date shift and the immediately following shift. Cupid cannot book a member while they are in cooldown.
- The deck is a save-owned 12-card library, not a shift-owned hand. Each shift draws 3 cards into `shift.drawnScenarioIds` deterministically from the shift number. Playing a card opens a pending library slot; the player resolves the slot from the date book. Voluntary swaps retire the dropped card for 3 shifts. The just-played card itself goes on a one-shift cooldown (`SCENARIO_PLAYED_COOLDOWN_SHIFTS`) so the player cannot immediately re-add it through the pending slot. See the deck service in `app/services/deck.ts`.
- Default date length is 24 character turns (`CHARACTER_TURN_LIMIT` in `app/services/date-engine.ts`), which produces 4 judged exchanges at the 6-turn judge interval and a phase distribution of roughly 3 opener turns, 9 pressure turns, 6 pivot turns, and 6 resolution turns. The previous 30-turn default dragged late-game on local models without adding judge filings or phase coverage; the new default keeps the same judge cadence while shortening the redundant tail. The schema floor stays at 2 so test fixtures can shorten dates without resetting other defaults.
- For Playwright validation only, the dev shell honors `?seed=closures` when `import.meta.env.DEV` is true and the build is not the desktop variant. The handler in `app/components/cupid-shell.tsx` calls `seedClosedAndQuitMembers` from `app/services/dev-seeds.ts`, which flips one pair to `closed` (filing a pair closure memory) and one member to `quit` (retention zero), then clears the query string. The seed is gated on `import.meta.env.DEV` and the desktop mode check so production and desktop builds cannot trigger it.

## Case Closures And Win Conditions

Cupid's positive endgame is the case closure. A pair that earns enough mutual signal can delete the app together. Closure is permanent and rewards the player with a +5 retention bump on every other active member and a +1 raise to the campaign quit cap.

- Threshold lives in `app/services/closures.ts` as `CLOSURE_THRESHOLD`: `chemistry >= 75`, `trust >= 75`, `relationshipHealth >= 75`, `strain <= 30`, `conflict <= 30`, completed date count including the just-finished date `>= 3`, and `finalReport.outcome === "second_date"`. The `second_date` gate ties closure to a good date moment so a pair cannot close from a cool-down or repair-shaped report even if stats are still high.
- `finalizeDateSession` stamps `dateFinalReportSchema.readyToClose` after each completed date. `getReadyClosurePairs(save)` re-checks the threshold against current pair stats and member status so stale `readyToClose` flags from earlier sessions cannot survive a later non-ready filing or a quit.
- Closure is player-initiated. The Live Date planning state renders a callout for any ready pair with at least one focused member. Confirming the callout calls `generateClosureSummary` (AI hook in `app/services/closure-summary.ts`) and then `closePair` (in `app/services/closures.ts`). On failure the callout stays pending with a retryable error. Cupid never closes a pair with an empty summary.
- `closePair` files a pair memory tagged `pair_closure`, flips both members to `member.state.status = "closed"`, removes them from `focusedMemberIds`, bumps `closureCount`, and applies `CLOSURE_RETENTION_BUMP` (+5) to remaining active members. Closure is permanent; closed members never re-enter focus, matchmaking, or shift requests, and retention math will not flip a closed member to `quit`.
- The campaign quit cap is dynamic: `clientLossLimit(save) = CLIENT_LOSS_LIMIT_BASE + closureCount`. The base is 3, so a campaign that has closed 5 pairs can absorb 8 quits before `isCampaignLost(save)` fires.
- `closureCount >= 5` triggers a one-time soft-win cutscene (`SoftWinCutscene` in `app/components/soft-win-cutscene.tsx`). The cutscene shows the first 5 closed pairs and their closure summaries with the title "Cupid received a promotion". Continue calls `markSoftWinSeen`, the game continues after, and the cutscene never fires again on the same save.
- Out of scope for the current closure pass: re-opening closed cases, player-edited closure summaries, regenerating closure summaries, per-pair leaderboards, roster expansion, drift mechanics. Neglect is not punished. Closure is real reward without an inverse penalty.

## Member Authoring Requirements

New members must fit this product contract before they ship:

- The member has a durable roster role with at least two natural warm pressures and two natural friction pressures against the existing cast.
- The authored prose proves every hidden tag. A tag cannot exist only to force a named pair outcome.
- Exactly one identity tag is present: `ordinary_human` or `non_human`.
- Voice, gameplay tags, and player knowledge stay separate. Voice tells the LLM how the character talks. Tags tell services how to score pressure. Filed reads tell the player what Cupid has earned.
- Chemistry anchors stay in this document as a human authoring map. They do not go into member fixtures, scenario fixtures, prompts, or runtime scoring tables.

Use the procedural checklist in `docs/workflows/add-member.md` when adding or revising a member.
