# Gameplay Traits

Gameplay traits are hidden deterministic tags used by Cupid systems to score match fit. They are not UI copy and should not be shown to the player.

## Member Fields

Use member fields this way:

- `relationshipNeeds`: visible reasons a member might want a specific kind of date.
- `preferences`: visible soft clues for good rooms, partners, and pacing.
- `dealbreakers`: visible icks the member watches for. These are public evidence for hard stops.
- `tags`: hidden deterministic gameplay inputs.
- `voice`: performance instructions for runtime AI only.

Do not add new member fixture fields unless gameplay or UI reads them. Do not reintroduce `traits` or `redFlags`. `traits` were vague public labels. `redFlags` mixed member behavior with things members reject.

## Hidden Member Retention

Member `retention` is an internal quit-risk score used by deterministic services. It must not be exposed in player-facing UI as HP, health, or an exact meter. Player surfaces may show closed-file state or qualitative risk copy when needed, while services keep the numeric value for consequences.

## Hidden Tags

Every member needs 3 to 5 hidden tags and exactly one identity tag:

- Identity: `ordinary_human`, `non_human`.
- Needs and sensitivities: `prophecy_averse`, `privacy_sensitive`, `grief_sensitive`, `memory_sensitive`, `status_sensitive`, `needs_low_pressure`, `needs_clear_plan`, `sincerity_seeking`.
- Behaviors and pressure sources: `performative`, `attention_seeking`, `avoidant`, `competitive`, `ceremony_minded`, `career_focused`, `weirdness_native`, `reality_displaced`, `anxious_spiral`.

Hidden tags must be supported by visible copy. If a member has `prophecy_averse`, their profile, ask, preferences, or dealbreakers should make prophecy pressure legible without naming the tag.

## Match Fit

The match fit service scores a pair, a scenario, pair history, and active member asks. It returns:

- Public signals: `Fit`, `Pressure`, and `Ask`.
- Private rule hits for tests and debugging.
- A starting Date Health delta.
- A small exchange drift after each judge pass.
- An optional hard stop.

The player sees only the public signals. Numeric deltas, tag names, and exact rule hits stay hidden.

## Member Request Tags

Member requests use a controlled tag taxonomy that is separate from hidden member tags. These tags express deterministic asks for fit scoring. They are not UI copy.

- Date shape: `normal_date`, `quiet_date`, `low_pressure`, `structure`, `grounded`, `choice`.
- Boundary and pressure asks: `prophecy_averse`, `privacy`, `discretion`, `name_discretion`, `career_fatigue`.
- Partner values: `sincerity`, `career`, `respect`, `decisiveness`, `care`.
- Content flavor: `cosmic`, `memory`, `online_creator`, `performative`, `career_intense`, `deity`, `advice_giver`, `cryptid`, `saboteur`, `anxious_rambler`, `midlife`, `tech_illiterate`, `fae`, `widower`.

Avoid one-off request tags. If a new request tag is needed, add it to `memberRequestTagSchema`, update deterministic fit handling when it should affect scoring, and add coverage in the same change.

## Hard Stops

A hard stop fires when a visible dealbreaker has enough deterministic evidence to collapse the date. Examples:

- Prophecy pressure against a prophecy-averse member.
- Museum-style public exposure against a privacy-sensitive member.
- Forced memory intimacy against a grief-sensitive member.

A hard stop ends the date early, sets Date Health to 5, clamps relationship health to 5, raises conflict and strain sharply, and records the reason in the judge snapshot. It is not permanent zero, so future repair systems can still exist.

## Roster Compatibility And Friction

Members are designed against each other, not in isolation. Every member should have at least two natural warm partners and two natural friction partners in the existing roster, expressed through the visible fields and voice patterns. The match-fit service rewards or penalizes pair-trait combinations deterministically; the LLM reads needs, preferences, dealbreakers, secrets, and refused voice patterns to perform the friction or fit.

Source the compatibility shape from voice and tone, not from a separate compatibility list. If a partner's voice patterns or tics would land on this character's `dealbreakers` or `voice.patternsRefused`, the friction is real. If a partner's preferences would let this character relax their guard, the warmth is real.

### Warm clusters in the current roster

- **Sincerity tribe**: Jenna, Sana, Marcus, Toby, Mei. Marcus + Sana, Marcus + Jenna, Toby + Sana all warm. Mundane domesticity, low pressure, no performance. Mei sits at the high-energy end of the cluster: hyperfocused on her craft, no bit, lets others finish a sentence because she expects the same.
- **Ceremony tribe**: Vhool, Aldric, Eleanor, Decimus, Wenshu. Aldric + Vhool (sacred bargain), Aldric + Decimus (soldiers), Eleanor + Decimus (cold formal pair), Wenshu + Vhool (Dao-talk meets Pact-talk, same dialect of seriousness). Shared formal cadence reads as fluency.
- **Reality-displaced peers**: Opal, Aldric, Decimus, Meridian, Sera, Wenshu. Mutual recognition of having walked through a wrong door. Their world was normal; this one is the strange one. Sera is the only one displaced from a future. Wenshu is the only one who believes his displacement is a sanctioned trial; the others know better.
- **Grief siblings (low intimacy only)**: Gideon, Marcus, Decimus. Marcus + Decimus is healthy. High intimacy compounds.
- **Career grind**: Tasha, Mr. Whiskers, Meridian, Marcus, Sera. Calendars, decisive plans, no negotiation. Sera + Tasha share confirmation discipline; Sera + Eleanor share Term-and-Bargain protocol fluency.

### Friction zones in the current roster

- **Performer vs sincerity-seeker**: Brady or Kade vs Sana, Marcus, Toby, Aldric, Mei, Wenshu. Sincerity-seekers read bits as evasion. Performers read sincerity as a trap. Mei vs Kade is sharp because Kade wants to film her sets and she will not be content. Mei vs Brady cracks the bit faster than most because her enthusiasm has nowhere for irony to land. Wenshu reads as performative on the surface but is sincerity-seeking underneath; Brady clocks him as a fellow operator and they sit in mutual bit recognition until one cracks.
- **Privacy vs attention**: Calvin or Meridian vs Kade. Calvin vs Brady (recorder). Phones on the table are a hard no for the privacy-tagged.
- **Competitive collisions**: Venus vs Tasha, Venus vs Mr. Whiskers, Mr. Whiskers vs Tasha. Spark high, trust low.
- **Prophecy-averse meets ceremony**: Opal vs Vhool ("Pact"), Opal vs Aldric ("Saints"), Opal vs Wenshu ("Fated Counterpart"). Opal has built a binder against this exact energy. Wenshu uses "fated" in his dating profile, which is literally on her list.
- **Anxious-spiral compound**: Toby + Kade, Toby + Opal, Toby + Brady. Two anxious people pull each other tighter.
- **Formal lockup**: Mr. Whiskers vs Eleanor (neither will drop the formality), Meridian vs Mr. Whiskers (both clipped, both armored).
- **Bit collision**: Brady vs Kade. Different vintages, same dishonesty. Each can feel the other doing it.
- **Protocol vs sincerity**: Sera vs Sana, Sera vs Marcus, Sera vs Jenna, Sera vs Toby. Sera offers Standard Terms and week-three cohabitation review; sincerity-seekers read it as evasion. She reads their pace as missing data.

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

Update this map when adding a member. If a new member does not slot into any cluster or friction zone, that is a sign the design is too generic.

## Adding Members

When adding a member:

1. Read this whole document and `docs/world/voice.md` first. The interdimensionality framing rule in the voice doc decides who treats interdimensional drift as normal and who treats it as weird. Get this wrong and the comedy breaks.
2. Read every existing member fixture in `app/fixtures/members/`. Compatibility design cannot happen in isolation.
3. Identify which warm cluster and which friction zone the new member slots into. If neither, the design is too generic; reshape it.
4. Write the profile, needs, preferences, and dealbreakers first. At least two preferences should plausibly match the behavior of an existing warm partner. At least two dealbreakers should plausibly trip on an existing friction partner. The match should be readable from the prose alone, not from tag overlap.
5. Pick 3 to 5 hidden tags that the visible copy proves. Include exactly one identity tag (`ordinary_human` or `non_human`).
6. Choose voice `patternsUsed` that the cluster shares and `patternsRefused` that the friction partners use. Patterns refused are how the LLM learns who the character recoils from.
7. Avoid one-off tags. If a new tag is needed, add deterministic scoring in `app/services/match-fit.ts` and tests in the same change.
8. Write 15 sample messages across four buckets (`opener`, `warming`, `cooling`, `crashingOut`). The LLM rotates through them deterministically per turn weighted by Date Health.
9. Keep voice authoring separate from gameplay tags. Voice explains how the character talks; tags decide how the game scores them.
10. Update the compatibility map above with the new member's warm and friction anchors.
