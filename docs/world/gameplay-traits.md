# Gameplay Traits

Gameplay traits are hidden deterministic tags used by Cupid systems to score match fit. They are not UI copy and should not be shown to the player.

## Member Fields

Use member fields this way:

- `relationshipNeeds`: visible reasons a member might want a specific kind of date.
- `preferences`: visible soft clues for good rooms, partners, and pacing.
- `dealbreakers`: visible icks the member watches for. These are public evidence for hard stops.
- `tags`: hidden deterministic gameplay inputs.
- `voice`: performance instructions for local AI only.

Do not add new member fixture fields unless gameplay or UI reads them. Do not reintroduce `traits` or `redFlags`. `traits` were vague public labels. `redFlags` mixed member behavior with things members reject.

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

## Hard Stops

A hard stop fires when a visible dealbreaker has enough deterministic evidence to collapse the date. Examples:

- Prophecy pressure against a prophecy-averse member.
- Museum-style public exposure against a privacy-sensitive member.
- Forced memory intimacy against a grief-sensitive member.

A hard stop ends the date early, sets Date Health to 5, clamps relationship health to 5, raises conflict and strain sharply, and records the reason in the judge snapshot. It is not permanent zero, so future repair systems can still exist.

## Adding Members

When adding a member:

1. Write the profile, needs, preferences, and dealbreakers first.
2. Pick 3 to 5 hidden tags that the visible copy proves.
3. Include exactly one identity tag.
4. Avoid one-off tags. If a new tag is needed, add deterministic scoring and tests in the same change.
5. Keep voice authoring separate. Voice can explain how the member talks. Tags decide how the game scores them.
