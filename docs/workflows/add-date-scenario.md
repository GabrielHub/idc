# Add Date Scenario Workflow

Use this checklist when adding or heavily revising one date scenario. The code contract lives in `dateScenarioSchema` in `app/domain/game.ts`, current fixtures live in `app/fixtures/scenarios/`, and fixture behavior is checked by `app/fixtures/scenarios/scenarios.test.ts` plus the date prompt and event draft tests.

This workflow is the content pass. Complete the scenario's nonvisual game content in one pass, then hand visual design and background art to `docs/workflows/visual-asset-iteration.md`. Do not generate background images or image prompts in the fixture pass.

## Read First

- `docs/product/voice.md`, especially event kinds, no continuing offstage speakers, prose mechanics, and scenario card voice.
- `docs/product/gameplay-traits.md`, especially match fit, member request tags, boundary risk, and player knowledge visibility.
- `docs/product/image-style.md`, especially scenario background acceptance checks.
- Existing scenario fixtures in `app/fixtures/scenarios/`.
- `app/services/match-fit.ts`, `app/services/player-knowledge.ts`, `app/services/date-engine.ts`, and `app/services/date-prompts.ts` when changing tags, event behavior, visibility, or prompt pressure.

## Design Pass

1. Define the room as reusable date pressure, not as a scene for one named member.
2. Pick the practical date shape: meal, errand, ceremony, public room, quiet room, timed task, shared object, performance pressure, or another clear frame.
3. Identify what the room tests: privacy, prophecy, memory, public attention, career pressure, low-pressure care, weirdness tolerance, planning, or intimacy.
4. Confirm the scenario can work for many pairs. It can favor archetypes through hooks, but it must not name a member.
5. Note whether the scenario needs background art later. The fixture can exist without a manifest entry, in which case the runtime falls back to the Aura mesh.

## Fixture Requirements

Add `app/fixtures/scenarios/<scenario-id>.ts` with a `DateScenario` object that satisfies `dateScenarioSchema`:

- `id`: stable kebab-case scenario id.
- `title`: player-facing card title.
- `card.summary`: short Cupid corporate premise.
- `card.tags`: one or more tags from `scenarioTagSchema`.
- `card.risk`, `card.intimacy`, `card.chaos`: `low`, `medium`, or `high`.
- `card.idealFor`: reusable archetype hints, not member names.
- `card.badFor`: reusable pressure warnings, not member names.
- `publicBrief.location`: concrete booking location.
- `publicBrief.premise`: what makes this room distinct.
- `publicBrief.whatBothCharactersKnow`: the shared starting facts.
- `publicBrief.openingSituation`: what is physically happening at turn one.
- `director.tone`: scene pressure and texture for prompts.
- `director.rules`: at least one hard scene rule.
- `director.events`: exactly nine events.
- `director.earlyEndTriggers`: concrete reasons the Judge may end the date early.
- `director.repeatBehavior`: how repeated use should feel for the same pair.
- `judgeRubric.successSignals`: what good exchanges look like.
- `judgeRubric.failureSignals`: what bad exchanges look like.
- `judgeRubric.statFocus`: one or more entries from `relationshipStatSchema`.

## Event Requirements

Every scenario ships exactly nine events:

- 3 `ambient` events.
- 3 `provocation` events.
- 3 `reveal` events.

Each event needs:

- `id`: unique within the scenario.
- `title`: short event title.
- `kind`: `ambient`, `provocation`, or `reveal`.
- `event`: internal event description.
- `characterVisibleText`: what the characters can observe.
- `directorInstruction`: prompt instruction for the next performer.

Use event kinds this way:

- `ambient`: environmental texture. It can be noticed or ignored.
- `provocation`: physical interruption. The next speaker must react before resuming.
- `reveal`: lets existing member context, filed reads, or pair history surface. It must not invent new biography.

Offstage people, announcements, hosts, servers, machines, creatures, crowds, and other environmental sources must not become a continuing third speaker. If an event text includes an utterance, sign, label, voice, or role, the `directorInstruction` must explicitly prevent that source from being voiced as continuing dialogue. `scenarios.test.ts` checks common violations.

## Tag And Scoring Rules

- Use scenario tags from `scenarioTagSchema`: `temporal`, `cosmic`, `domestic`, `career`, `prophecy`, `memory`, `public`, `haunted`, `food`, `low_pressure`, `high_pressure`, `repeat_risk`.
- Tags affect match fit and player knowledge in `app/services/match-fit.ts` and `app/services/player-knowledge.ts`.
- If a new scenario tag is required, add it to `scenarioTagSchema`, update service handling, update product docs, and add tests in the same change.
- Do not use raw tags as player-facing copy.
- Risk, intimacy, and chaos are visible card signals, but exact pressure math and rule hits stay hidden.

## Visual Assets Out Of Scope

Do not create image prompts, generate background images, or commit new scenario background files in this content workflow. The scenario fixture should provide enough public room detail for a later image-capable agent to create background art, but the fixture should not include the prompt used to create that image.

If no approved art exists, leave the scenario out of `public/assets/scenarios/manifest.json`. The app will use the default Aura mesh without probing a missing image path. Add or update `assets-source/scenarios/PLACEHOLDERS.md` only to track that real art is still pending.

## Registration

1. Import the scenario in `app/fixtures/scenarios/index.ts`.
2. Add it to the parsed `starterScenarios` array.
3. Update the `.length(...)` count.
4. Add the named export.
5. Confirm any hard-coded scenario count in `app/fixtures/scenarios/scenarios.test.ts` is still correct.

## Validation

Run the project checks through Vite Plus:

```powershell
vp check
vp test
vp build
```

The scenario fixture tests must pass. They verify scenario count, member-name isolation, unique event ids, likely offstage speaker handling, and reveal text that appears to hard-code new biography.

Use Playwright for UI validation when the scenario affects Date Book cards, scenario inspector, Live Date planning, event draft selection, or live date flow. Background rendering checks belong to the visual asset workflow. The dev server must already be running at `http://localhost:5173/` before Playwright work.
