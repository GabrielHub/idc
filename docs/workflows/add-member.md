# Add Member Workflow

Use this checklist when adding or heavily revising one member. The code contracts live in `app/domain/game.ts`, the current roster lives in `app/fixtures/members/`, and the fixture tests in `app/fixtures/members/members.test.ts` enforce several content rules.

This workflow is the content pass. Complete the member's nonvisual game content in one pass, then hand visual design and image assets to `docs/workflows/visual-asset-iteration.md`. Do not generate portraits, avatars, variants, scenario backgrounds, or image prompts in the fixture pass.

## Read First

- `docs/product/gameplay-traits.md`, especially hidden tags, player knowledge, match fit, roster chemistry pressure, and member authoring requirements.
- `docs/product/voice.md`, especially member voice fingerprints, prose mechanics, interdimensionality framing, and generation notes.
- `docs/product/image-style.md`, especially portrait canvas contract, character height canon, and acceptance checks.
- `docs/product/visual-design.md`, especially per-member chat bubbles and per-member auras when existing approved visual direction already exists.
- Existing member fixtures in `app/fixtures/members/`, existing member requests in `app/fixtures/goals/member-requests.ts`, and the current aura registry in `app/components/member-aura-registry.ts`.

## Design Pass

1. Work on one member at a time. Do not batch create members.
2. Define the member's durable role in the roster. A good member creates reusable pressure across the cast, not a single destined match.
3. Place the member into at least one warm cluster and one friction zone from `docs/product/gameplay-traits.md`. If neither fits, reshape the premise.
4. Run the four-anchor authoring pass from `docs/product/gameplay-traits.md`: four warm anchors, four friction anchors, one sentence of evidence for each, and any field revisions needed.
5. Keep the anchor list out of fixtures, scenario fixtures, prompts, and scoring tables. The list is an authoring audit only.
6. Decide the member's reality frame before writing voice: normal app user, non-human who treats their nature as ordinary, displaced human, sanctioned trial participant, competitor, consort market user, handler-routed case, or another specific frame.

## Fixture Requirements

Add `app/fixtures/members/<member-id>.ts` with a `Member` object that satisfies `memberSchema`:

- Identity fields: `id`, `name`, `firstName`, `origin`, `species`, `dimension`, `realityStatus`.
- Height: `apparentHeightInInches`, stored as an integer in inches. Keep shipping roster heights inside the lineup bounds enforced by `members.test.ts`.
- Core prose: `bio`, `datingProfile`, `relationshipNeeds`, `preferences`, `dealbreakers`, `secrets`.
- Hidden tags: 3 to 5 tags from `memberTagSchema`, with exactly one identity tag: `ordinary_human` or `non_human`.
- Voice: `register`, `patternsUsed`, `patternsRefused`, `tics`, and `sampleMessages`.
- State: `mood`, `openness`, `burnout`, `retention`, `currentRequestId`, `recentDateResult`, `status`.
- Portrait references only after approved files exist. Do not generate images in this pass. Do not set `portraitAsset.prompt`.
- Optional presentation such as `chatBubble` only when approved visual direction already exists. Otherwise leave it for the visual asset workflow.

Voice sample counts are enforced by schema:

- `opener`: 3 to 6 lines.
- `warming`: 3 to 6 lines.
- `cooling`: 3 to 6 lines.
- `crashingOut`: 2 to 4 lines.

Voice patterns are also bounded:

- `patternsUsed`: 1 to 4 entries from `voicePatternSchema`.
- `patternsRefused`: at least 2 entries from `voicePatternSchema`.
- `tics`: 3 to 5 concrete syntax or vocabulary fingerprints.

## Prose Rules

- Write member copy in the member's voice. Write system and request framing in Cupid corporate voice when the surface demands it.
- Treat the first sentence of `datingProfile` as the public roster tagline. It appears on member cards before the player has earned deeper reads.
- The public tagline must be one short in-character sentence that tells who the member is through voice, personality, and a concrete hook. Reaver and Cha Yusung are the model shape: job or background lands inside the voice, not as a census row.
- The first sentence must carry the hook by itself. The app sentence-splits `datingProfile`, so a first sentence that only says a name, label, or setup for the next sentence will make the roster card weak even if the second sentence is good. A Reaver-style clipped question is allowed only when it is deliberate and complete as the public bit.
- Do not use a bare name, name plus period, age plus location inventory, or job label as the public tagline. Venus is the narrow exception when the name declaration itself carries the bit.
- Do not name another member as a required match, enemy, success, or failure inside the member fixture. `members.test.ts` checks this.
- Keep player knowledge boundaries intact. Public profile fragments can hint. Hidden fields, secrets, tags, exact state values, prompts, and raw scoring rules stay hidden.
- Every hidden tag must be supported by authored prose. If the prose does not prove the tag, change the prose or remove the tag.
- Do not add a member field unless code or UI reads it.

## Member Requests

1. Add request entries in `app/fixtures/goals/member-requests.ts`.
2. Give the member enough request variety for shift rotation. Current roster pattern is usually four requests per member.
3. Set the fixture `state.currentRequestId` to an existing request id for that member.
4. Use request tags from `memberRequestTagSchema`. If a new tag is needed, update the schema, deterministic fit handling when needed, docs, and tests in the same change.
5. Keep request text member-aware but operational. It should express what the member wants Cupid to book, not reveal hidden facts wholesale.

## Visual Assets Out Of Scope

Do not create image prompts, generate images, run cutouts, or commit new portrait files in this content workflow. The fixture pass can write visual requirements in plain member facts that a later image-capable agent can use, such as apparent height, species or origin, age presentation, outfit language, and supernatural visual hook.

Member fixtures should not include the prompts used to create images. Leave `portraitAsset.prompt` unset.

If approved portrait files do not exist yet, do not claim the member is shippable. Keep the content complete and hand off to `docs/workflows/visual-asset-iteration.md`. Full member fixture validation runs after approved source and runtime assets exist, because `members.test.ts` verifies the asset paths.

## Presentation Hooks

- Add the member import, parse entry, and export in `app/fixtures/members/index.ts`. Update the schema array length.
- Add or confirm member requests are exported through `app/fixtures/goals/index.ts`.
- Add an aura entry in `app/components/member-aura-registry.ts` only if visual direction is already approved. Otherwise leave the aura handoff in the content notes for the visual pass.
- Add `chatBubble` only when the member needs a distinct bubble style and the visual direction is already approved. Otherwise leave it for the visual pass.
- Update `docs/product/gameplay-traits.md` chemistry clusters and friction zones with the member's durable pressures.

## Validation

Run the project checks through Vite Plus:

```powershell
vp check
vp test
vp build
```

The nonvisual content should pass `vp check`. Full `vp test` and `vp build` are required before shipping the member. If approved portrait files do not exist yet, record that full member fixture validation is blocked on the visual asset pass because `members.test.ts` verifies portrait asset paths and avatar srcset files.

Use Playwright for UI validation when the new member affects roster cards, modal layout, date standees, chat bubbles, auras, or onboarding. The dev server must already be running at `http://localhost:5173/` before Playwright work.
