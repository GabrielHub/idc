# Gameplay Traits

Gameplay traits are hidden deterministic tags used by Cupid systems to score match fit. They are not UI copy and should not be shown to the player.

## Member Fields

Use member fields this way:

- `datingProfile`: authored profile copy. The first sentence can be public at intake. Later sentences are revealed only through player knowledge.
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

Filed reads are player-facing knowledge, not raw facts. Current read kinds are:

- `profile`: additional public profile context.
- `comfort`: what helps a member relax or engage.
- `boundary`: what pressure or behavior crosses a member line.
- `ask`: whether the focused ask is fitting or blocked by the room.
- `pair_dynamic`: how this pair reads together.
- `scenario_pressure`: how the room is affecting the date.

Runtime AI can propose evidence ids only from a bounded reveal candidate packet. Game services validate those ids against authoritative candidates before persistence. Deterministic hard stops can also file or confirm a boundary read. `JudgeSnapshot.usedEvidenceIds` stores only accepted ids so UI can attach filed reads to the Judge note that created them.

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

The match fit service scores a pair, a scenario, pair history, and active member asks. It returns:

- Internal fit, pressure, and ask signals.
- Private rule hits for tests and debugging.
- A starting Date Health delta.
- A small exchange drift after each judge pass.
- An optional hard stop.

The pre-date brief does not show exact fit, pressure, ask, blocked ask copy, named member boundary risks, raw scenario tags, or numeric pair stat meters. Pair visibility comes from prior public notes, filed `pair_dynamic` reads, outcome labels, and nonnumeric follow-up intent copy. Spark, Strain, Relationship Health, tag names, numeric deltas, and exact rule hits stay hidden.

Exact Date Health remains visible during the live date because it is the fail state players must manage. Final reports and public notes must not repeat exact Date Health, exact Date Health deltas, Spark, Strain, Relationship Health, or projected stat math. The saved `statSummary` field remains for schema stability, but its content is player-safe case copy.

## Member Request Tags

Member requests use a controlled tag taxonomy that is separate from hidden member tags. These tags express deterministic asks for fit scoring. They are not UI copy.

- Date shape: `normal_date`, `quiet_date`, `low_pressure`, `structure`, `grounded`, `choice`.
- Boundary and pressure asks: `prophecy_averse`, `privacy`, `discretion`, `name_discretion`, `career_fatigue`.
- Partner values: `sincerity`, `career`, `respect`, `decisiveness`, `care`.
- Content flavor: `cosmic`, `memory`, `online_creator`, `performative`, `career_intense`, `deity`, `advice_giver`, `cryptid`, `saboteur`, `anxious_rambler`, `midlife`, `tech_illiterate`, `fae`, `widower`.

Avoid one-off request tags. If a new request tag is needed, add it to `memberRequestTagSchema`, update deterministic fit handling when it should affect scoring, and add coverage in the same change.

## Hard Stops

A hard stop fires when an authored boundary has enough deterministic evidence to collapse the date. Examples:

- Prophecy pressure against a prophecy-averse member.
- Museum-style public exposure against a privacy-sensitive member.
- Forced memory intimacy against a grief-sensitive member.

A hard stop ends the date early, sets Date Health to 5, clamps relationship health to 5, raises conflict and strain sharply, records the reason in the judge snapshot, and files or confirms a player-facing boundary read. The UI shows the filed read, not the raw tag or rule hit. It is not permanent zero, so future repair systems can still exist.

## Roster Compatibility And Friction

Members are designed against each other, not in isolation. Every member should have at least two natural warm partners and two natural friction partners in the existing roster, expressed through authored profile fields and voice patterns. The match-fit service rewards or penalizes pair-trait combinations deterministically; the LLM reads needs, preferences, dealbreakers, secrets, and refused voice patterns to perform the friction or fit.

Source the compatibility shape from voice and tone, not from a separate compatibility list. If a partner's voice patterns or tics would land on this character's `dealbreakers` or `voice.patternsRefused`, the friction is real. If a partner's preferences would let this character relax their guard, the warmth is real. The player should learn that shape through the date, filed reads, and notes instead of receiving the full answer key on the roster screen.

### Warm clusters in the current roster

- **Sincerity tribe**: Jenna, Sana, Marcus, Toby, Mei. Marcus + Sana, Marcus + Jenna, Toby + Sana all warm. Mundane domesticity, low pressure, no performance. Mei sits at the high-energy end of the cluster: hyperfocused on her craft, no bit, lets others finish a sentence because she expects the same.
- **Ceremony tribe**: Vhool, Aldric, Eleanor, Decimus, Wenshu. Aldric + Vhool (sacred bargain), Aldric + Decimus (soldiers), Eleanor + Decimus (cold formal pair), Wenshu + Vhool (Dao-talk meets Pact-talk, same dialect of seriousness). Shared formal cadence reads as fluency.
- **Reality-displaced peers**: Opal, Aldric, Decimus, Meridian, Sera, Wenshu, Cha. Mutual recognition of having walked through a wrong door. Their world was normal; this one is the strange one. Sera is the only one displaced from a future. Wenshu is the only one who believes his displacement is a sanctioned trial; the others know better. Cha is displaced from a continuous Awakened branch where Gates opened in his lifetime; he treats 2026 Earth as quiet, not strange.
- **Grief siblings (low intimacy only)**: Gideon, Marcus, Decimus, Cha. Marcus + Decimus is healthy. Decimus + Cha sits clean: two soldiers two centuries apart, both buried teammates, both got shoved onto Cupid by a daughter or sister. High intimacy compounds for the rest.
- **Career grind**: Tasha, Mr. Whiskers, Meridian, Marcus, Sera. Calendars, decisive plans, no negotiation. Sera + Tasha share confirmation discipline; Sera + Eleanor share Term-and-Bargain protocol fluency.
- **Acquisition register**: Vhool, Reaver, Cthala. Three different modes of treating the date as a recruitment funnel into a structure they already own (Pact / fleet / Spire). Vhool is sincere and apologetic, Reaver is mercenary and announced, Cthala is calm and undeclared. Their vocabularies recognize each other; whether the meeting lands warm or volatile depends on which mode meets which. Match-fit reads `pair:mutual_acquisition` across all three pairings.
- **Glamour cluster**: Venus, Cassie, Naia. Three shapes of dressed-for-the-room. Venus counts compliments and needs the room to name her first. Cassie is brand-trained and runs from publicity, smiles for the camera by reflex. Naia is on the family allowance, gives compliments freely, and keeps no count. They share aesthetic territory without sharing tags, so they do not land deterministically; the comedy lives in how each one's relationship to being looked at destabilizes the others. Naia is the only one of the three who is not anxious about the room.

### Friction zones in the current roster

- **Performer vs sincerity-seeker**: Brady or Kade vs Sana, Marcus, Toby, Aldric, Mei, Wenshu. Sincerity-seekers read bits as evasion. Performers read sincerity as a trap. Mei vs Kade is sharp because Kade wants to film her sets and she will not be content. Mei vs Brady cracks the bit faster than most because her enthusiasm has nowhere for irony to land. Wenshu reads as performative on the surface but is sincerity-seeking underneath; Brady clocks him as a fellow operator and they sit in mutual bit recognition until one cracks.
- **Privacy vs attention**: Calvin, Meridian, or Cthala vs Kade. Calvin vs Brady (recorder). Cthala against any partner who reaches for a phone, since the form does not film. Phones on the table are a hard no for the privacy-tagged.
- **Competitive collisions**: Venus vs Tasha, Venus vs Mr. Whiskers, Mr. Whiskers vs Tasha. Spark high, trust low.
- **Prophecy-averse meets ceremony**: Opal vs Vhool ("Pact"), Opal vs Aldric ("Saints"), Opal vs Wenshu ("Fated Counterpart"). Opal has built a binder against this exact energy. Wenshu uses "fated" in his dating profile, which is literally on her list.
- **Anxious-spiral compound**: Toby + Kade, Toby + Opal, Toby + Brady. Two anxious people pull each other tighter.
- **Formal lockup**: Mr. Whiskers vs Eleanor (neither will drop the formality), Meridian vs Mr. Whiskers (both clipped, both armored).
- **Bit collision**: Brady vs Kade. Different vintages, same dishonesty. Each can feel the other doing it.
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

Update this map when adding a member. If a new member does not slot into any cluster or friction zone, that is a sign the design is too generic.

## Focused Cases And Shift Cadence

Cupid runs four focus cases at a time and one date per shift. This frames the player as a relationship operator who carries small case loads instead of a matchmaker who rerolls every shift.

- The save owns `focusedMemberIds`, capped at 4. Onboarding requires exactly 4 selected from the 28 active members; closures free a slot. `app/services/focus-cases.ts` exposes `selectInitialFocusCases`, `addFocusCase`, `removeFocusCase`, and `swapFocusCase`. The shift's `featuredMemberIds` mirror `focusedMemberIds` for backwards compatibility.
- Swapping a focus case costs 25 retention to the dropped member. Removing a case (through closure or open-slot freeing) does not. Adding into an open slot is free.
- Closed and quit members cannot be focused, matched, or selected for shift requests. Their lifecycle status lives on `member.state.status` as `active`, `closed`, or `quit`. When retention drops to zero the engine flips status to `quit`. Closure is a separate workflow.
- Each shift books one date. After a date finishes (completed or ended early), both participants stamp `member.state.lastDateShift` and enter a one-shift cooldown. `isMemberInCooldown(member, currentShift)` is true on the date shift and the immediately following shift. Cupid cannot book a member while they are in cooldown.
- The deck is a save-owned 12-card library, not a shift-owned hand. Each shift draws 3 cards into `shift.drawnScenarioIds` deterministically from the shift number. Playing a card opens a pending library slot; the player resolves the slot from the casebook. Voluntary swaps retire the dropped card for 3 shifts. See the deck service in `app/services/deck.ts`.
- The `goal-complete-three-dates` goal is filtered out when shifts only book one date.

## Case Closures And Win Conditions

Cupid's positive endgame is the case closure. A pair that earns enough mutual signal can delete the app together. Closure is permanent and rewards the player with a +5 retention bump on every other active member and a +1 raise to the campaign quit cap.

- Threshold lives in `app/services/closures.ts` as `CLOSURE_THRESHOLD`: `chemistry >= 75`, `trust >= 75`, `relationshipHealth >= 75`, `strain <= 30`, `conflict <= 30`, completed date count including the just-finished date `>= 3`, and `finalReport.outcome === "second_date"`. The `second_date` gate ties closure to a good date moment so a pair cannot close from a cool-down or repair-shaped report even if stats are still high.
- `finalizeDateSession` stamps `dateFinalReportSchema.readyToClose` after each completed date. `getReadyClosurePairs(save)` re-checks the threshold against current pair stats and member status so stale `readyToClose` flags from earlier sessions cannot survive a later non-ready filing or a quit.
- Closure is player-initiated. The Office canvas renders a callout for any ready pair with at least one focused member. Confirming the callout calls `generateClosureSummary` (AI hook in `app/services/closure-summary.ts`) and then `closePair` (in `app/services/closures.ts`). On failure the callout stays pending with a retryable error. Cupid never closes a pair with an empty summary.
- `closePair` files a pair memory tagged `pair_closure`, flips both members to `member.state.status = "closed"`, removes them from `focusedMemberIds`, bumps `closureCount`, and applies `CLOSURE_RETENTION_BUMP` (+5) to remaining active members. Closure is permanent; closed members never re-enter focus, matchmaking, or shift requests, and retention math will not flip a closed member to `quit`.
- The campaign quit cap is dynamic: `clientLossLimit(save) = CLIENT_LOSS_LIMIT_BASE + closureCount`. The base is 3, so a campaign that has closed 5 pairs can absorb 8 quits before `isCampaignLost(save)` fires.
- `closureCount >= 5` triggers a one-time soft-win cutscene (`SoftWinCutscene` in `app/components/soft-win-cutscene.tsx`). The cutscene shows the first 5 closed pairs and their closure summaries with the title "Cupid received a promotion". Continue calls `markSoftWinSeen`, the game continues after, and the cutscene never fires again on the same save.
- Out of scope for the current closure pass: re-opening closed cases, player-edited closure summaries, regenerating closure summaries, per-pair leaderboards, roster expansion, drift mechanics. Neglect is not punished. Closure is real reward without an inverse penalty.

## Adding Members

When adding a member:

1. Read this whole document and `docs/world/voice.md` first. The interdimensionality framing rule in the voice doc decides who treats interdimensional drift as normal and who treats it as weird. Get this wrong and the comedy breaks.
2. Read every existing member fixture in `app/fixtures/members/`. Compatibility design cannot happen in isolation.
3. Identify which warm cluster and which friction zone the new member slots into. If neither, the design is too generic; reshape it.
4. Write the profile, needs, preferences, and dealbreakers first. At least two preferences should plausibly match the behavior of an existing warm partner. At least two dealbreakers should plausibly trip on an existing friction partner. The match should be readable from the authored prose when the service sees it, but the player should only receive safe profile fragments and filed reads.
5. Pick 3 to 5 hidden tags that the authored copy proves. Include exactly one identity tag (`ordinary_human` or `non_human`).
6. Choose voice `patternsUsed` that the cluster shares and `patternsRefused` that the friction partners use. Patterns refused are how the LLM learns who the character recoils from.
7. Avoid one-off tags. If a new tag is needed, add deterministic scoring in `app/services/match-fit.ts` and tests in the same change.
8. Write 15 sample messages across four buckets (`opener`, `warming`, `cooling`, `crashingOut`). The LLM rotates through them deterministically per turn weighted by Date Health.
9. Keep voice authoring separate from gameplay tags and player knowledge. Voice explains how the character talks, tags decide how the game scores them, and filed reads decide what the player has earned.
10. Update the compatibility map above with the new member's warm and friction anchors.
