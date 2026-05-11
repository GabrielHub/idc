# Scenario Event Kinds and Content Remediation

## Status

Ready for implementation after this revision. Independent of the other plans. Should land first because the deck and date UI can then treat event-kind language as settled. This plan does not change saved game shape.

## Goal

Restructure scenario events into three explicit kinds: ambient, provocation, and reveal. Remediate every existing scenario to carry exactly 3 of each. Update the draft step to deal a balanced offer. Audit implicit offstage speakers that complicate the LLM flow.

## Background

- Each `dateScenario` carries 8 events today. Schema at [game.ts](../../app/domain/game.ts).
- Draft step deals 6 of 8 events at random. Player picks any 3 to draft.
- Constants at [date-engine.ts](../../app/services/date-engine.ts): `EVENT_POOL_SIZE=8`, `EVENT_DRAFT_OFFERED=6`, `EVENT_DRAFT_PICKED=3`, `MAX_NUDGES_PER_DATE=3`.
- Triggered events appear as `kind:"scenario"` non-character messages with `characterVisibleText`. The current AI prompt reads the latest triggered event through `lastTriggeredEvent` in [date-prompts.ts](../../app/services/date-prompts.ts).
- Most existing events skew atmospheric. The conversation switch is underused.
- The museum scenario already enforces no audio-guide third speaker. Several other scenarios still mention servers, hosts, volunteers, voices, or public systems and need a pass.
- `SAVE_SCHEMA_VERSION` is already 4. Scenario event kinds live in fixtures, not in saved game state, so this plan should not bump the save version.

## Event Kinds

- **ambient**: environmental texture. Tests tolerance and attention without forcing a response. Examples: a sugar packet refilling itself, a mug warming on its own, parquet squeaking under a heel.
- **provocation**: an interruption that demands a reaction. Examples: a drink spill, a fire alarm, a dropped tray, a partner's ex entering the room.
- **reveal**: a reusable scene hook that lets the current speaker surface something honest already present in supplied member context, filed reads, or pair history. Reveals must not invent new biography. For static scenario fixtures, write reveal text generically, then make the `directorInstruction` tell the performer to map it only to existing context.

## Schema Changes

- Add and export a reusable kind schema near `scenarioEventSchema`:
  ```typescript
  export const scenarioEventKindSchema = z.enum(["ambient", "provocation", "reveal"]);
  ```
- Add `kind` to `scenarioEventSchema`:
  ```typescript
  kind: scenarioEventKindSchema,
  ```
- Change `dateScenarioSchema.director.events` to require exactly 9 events and exactly 3 of each kind. Use `.length(9)` plus a `superRefine` count check.
- Update constants at [date-engine.ts](../../app/services/date-engine.ts): `EVENT_POOL_SIZE=9`, `EVENT_DRAFT_OFFERED=6`, `EVENT_DRAFT_PICKED=3`.
- Do not bump `SAVE_SCHEMA_VERSION`. Active saves store event ids, not scenario event objects. Preserve existing event ids where practical so in-progress drafts can still resolve after the fixture update.

## Service Changes

- `drawScenarioEventOffer` in [date-engine.ts](../../app/services/date-engine.ts): deal 2 events from each kind instead of 6 random events from the full pool. Shuffle within each kind using the injected RNG, then interleave the result in a stable kind order so tests can assert counts without depending on display order.
- Clamp injected random values the same way shift planning does, so tests or future callers cannot pass `1` and index past the pool.
- `pickScenarioEvents`: no kind-balance requirement. It still validates that the picked events are a subset of the offer and exactly 3 unique ids.
- `triggerScenarioEvent`: no prompt work here. It should continue to append the non-character message and event id only.
- `date-prompts.ts`: add a helper that formats `Live room pressure` from the latest triggered event. Append an automatic kind suffix to `event.directorInstruction` there:
  - ambient: `Treat this as ambient texture. The character may notice it or move on as feels true.`
  - provocation: `This is a physical interruption. The character must register and react before resuming.`
  - reveal: `This puts something honest into the open. The character chooses how to be seen.`
- The per-event `directorInstruction` continues to lead. The suffix is automatic and prompt-only.

## Content Remediation

For each of the 39 scenarios in [app/fixtures/scenarios](../../app/fixtures/scenarios):

1. Read every event. Tag each as ambient, provocation, or reveal.
2. Identify which kind is short of 3. Author missing events in the existing scenario voice.
3. Keep reveal events generic enough for any pair. A reveal may reference the scenario's machinery, a member's visible behavior, or filed pair history, but it must not hard-code facts from a specific member fixture.
4. Audit every event for offstage speaker violations. The strict ceiling is one non-continuing environmental utterance through `characterVisibleText`, such as a PA line or printed label. The `directorInstruction` must say not to voice that source as a continuing speaker.
5. Rewrite or drop anything that implies a server, clerk, host, volunteer, audio guide, band, deity, creature, or crowd member joins the date as a third participant.
6. Run the content lints below and fix every hard failure.

Estimated authored delta: roughly 39 to 60 new events depending on distribution, plus rewrites for offstage speaker risk.

## UI Changes

- Update `DraftScreen` in [dashboard-views.tsx](../../app/components/dashboard-views.tsx) to label or group the 6 dealt events by kind so the player understands the offer is balanced. Player still picks any 3.
- Use the `frontend-skill` if the draft layout changes materially. A small chip label on existing cards does not need a full screen rethink.
- No other UI changes. The trigger rail, playback controls, and judge UI stay as-is.

## Documentation Updates

- [docs/world/voice.md](../../docs/world/voice.md): add an "Event kinds" section with the three kinds, the voice each should carry, the three prompt suffixes, and the no-continuing-offstage-speakers rule.
- No image-style changes.

## Verification

- `vp check`, `vp test`, `vp build` clean.
- Service tests:
  - `drawScenarioEventOffer` returns exactly 2 of each kind across 100 RNG seeds.
  - `pickScenarioEvents` validates correctly with the new pool size.
- Prompt tests:
  - `buildCharacterPromptPacket` appends the kind-level suffix for ambient, provocation, and reveal events.
  - The suffix does not mutate the scenario fixture or saved session.
- Content lint:
  - Every scenario has exactly 9 events.
  - Every scenario has exactly 3 events of each kind.
  - A heuristic flags likely continuing offstage speakers in `directorInstruction` and `characterVisibleText`. Treat this as a review queue, not an auto-fail for valid one-line PA or label text.
- Playwright run:
  - Start a date, draft events, confirm the offer shows 2 of each kind, then finish the date.

## Out Of Scope

- Deck mechanics, focused cases, shift cadence, cooldown. Lives in the deck-roster-canvas plan.
- Closure mechanics. Lives in the case-closures plan.
- Canvas and nav layout overhaul. Lives in the deck-roster-canvas plan.
- Per-kind nudge weighting. Equal cost stays. Revisit only if playtesting shows ambient picks never get used.
- Adding new scenarios. Library stays at 39.

## Order Of Work

1. Schema change and constants.
2. Service rewrite for `drawScenarioEventOffer`.
3. Prompt helper for kind suffixes.
4. Content remediation pass across all 39 scenarios.
5. Draft UI labels.
6. Content lints.
7. Service, prompt, and Playwright tests.
8. Voice doc update.
