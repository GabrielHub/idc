# Deck, Roster, and Canvas UI Overhaul

## Status

Ready for implementation after this revision. Depends on the scenario-event-kinds plan only for settled draft-card language, not for save versioning. This is the largest plan in the set and should be split into state services first, then UI rooms.

## Goal

Replace the current automatic roster shuffle and tab dashboard with player-selected focus cases, a 12-card scenario deck, one date per shift, one-shift cooldown, and a canvas plus floating nav layout with five rooms.

## Background

- Today `shiftDateSlots` defaults to 3 in [game.ts](../../app/domain/game.ts), and the dashboard uses four tabs: Roster, Brief, Date, Notes.
- Current featured cases come from `selectFeaturedMemberIds` in [shift-planning.ts](../../app/services/shift-planning.ts). They are random per shift.
- Current scenario deck state is stored on each `ShiftState` as `scenarioDeck`, with drawn ids, offered ids, `heldScenarioId`, and deck powers in [scenario-powers.ts](../../app/services/scenario-powers.ts).
- Per-pair `scenarioUseCounts` already track repeat use.
- Mutable member data currently lives under `member.state`. Fixture hydration preserves member state and refreshes fixture-owned fields. New mutable status fields must live in `memberStateSchema`, not at the top level of `memberSchema`.
- Pair stats start around 50 to 65, derived from openness, mood, and burnout in [game-seed.ts](../../app/services/game-seed.ts).
- No drift, cooldown, completion, or focus-case ownership exists today.
- `SAVE_SCHEMA_VERSION` is already 4. This plan is the next save-shape change and should bump to 5.

## Schema Changes

- `gameSaveSchema` adds:
  - `focusedMemberIds: z.array(memberIdSchema).max(4).default([])`. Onboarding requires exactly 4, but closures can free a slot later.
  - `scenarioDeck: z.object({ cardIds, pendingLibraryPick, retiredCards })`.
- `scenarioDeck.cardIds`: unique scenario ids, length 12 when no library pick is pending, length 11 when `pendingLibraryPick` is present.
- `scenarioDeck.pendingLibraryPick`: optional object with `playedCardId` and `playedAtShift`. This records the open slot created by a completed booking.
- `scenarioDeck.retiredCards`: array of `{ cardId, availableOnShift }`. Use `availableOnShift` instead of `untilShift` so the comparison is unambiguous.
- `gameConfigSchema.shiftDateSlots` default drops from 3 to 1.
- `memberStateSchema` adds:
  - `status: z.enum(["active", "closed", "quit"]).default("active")`
  - `lastDateShift: z.number().int().min(1).optional()`
- `shiftStateSchema` removes `scenarioDeck`, `deckPower`, and `heldScenarioId`. Keep `drawnScenarioIds` as the immutable hand snapshot for that shift.
- `shiftStateSchema.featuredMemberIds` can stay as a per-shift snapshot of current focus cases for reports, requests, and compatibility with existing code. It should be populated from `save.focusedMemberIds`, not random selection.
- Bump `SAVE_SCHEMA_VERSION` to 5. No migration. The repository already treats old save keys as unsupported alpha saves after version changes.

## Service Changes

New service file `app/services/deck.ts`:

- `createInitialScenarioDeck(scenarios)`: returns the starter 12-card deck with no pending pick and no retired cards.
- `drawHand(deck, shiftNumber, random)`: returns 3 card ids from `deck.cardIds`, deterministic for an injected RNG or a shift seed. The hand is written to `shift.drawnScenarioIds` when the shift starts and does not change if the deck changes mid-shift.
- `markCardPlayed(save, cardId)`: after `startDateSession` succeeds, remove `cardId` from `save.scenarioDeck.cardIds` and set `pendingLibraryPick`. Reject if a pick is already pending.
- `pickLibraryCard(save, libraryCardId)`: requires `pendingLibraryPick`, rejects ids already in the deck or not yet available, adds the chosen id, and clears `pendingLibraryPick`.
- `swapCard(save, deckCardId, libraryCardId, currentShift)`: voluntary swap. Removes `deckCardId`, adds `libraryCardId`, and creates a retired entry for the dropped card with `availableOnShift = currentShift + 4`, which means it is unavailable for the next 3 shifts.
- `listLibraryCards(save)`: returns scenarios not currently in the deck, with retired availability metadata.
- `softComposeWarnings(deck, scenarios)`: returns advisory strings such as `no low pressure cards` and `no high pressure cards`. Never blocks.

New service file `app/services/focus-cases.ts`:

- `selectInitialFocusCases(save, memberIds)`: persists the player's initial pick. Requires exactly 4 unique active members.
- `addFocusCase(save, memberId)`: fills an open focus slot. Rejects when 4 focused members already exist.
- `swapFocusCase(save, oldId, newId)`: removes `oldId`, applies a 25-retention penalty and recent result note to that member, then adds `newId`.
- `removeFocusCase(save, memberId)`: used by closure to free a slot without applying the swap penalty.
- `canBeFocusCase(member)`: true only when `member.state.status === "active"`.

[shift-planning.ts](../../app/services/shift-planning.ts):

- Replace random featured selection in shift creation with focused cases from `save.focusedMemberIds`, filtered to active members.
- Keep `selectFeaturedMemberRequestIds`, but feed it focused case ids.
- Add `isMemberInCooldown(member, currentShift): boolean`. It is true when `lastDateShift` is the current shift or the immediately previous shift. It is false after that.
- Company goal selection must continue to filter impossible goals under one date per shift. The existing `goal-complete-three-dates` should no longer appear when `shiftDateSlots` is 1.

[date-engine.ts](../../app/services/date-engine.ts):

- `startDateSession` must reject closed or quit members, focus members outside `save.focusedMemberIds`, cooldown members, scenarios not in the current hand, and bookings while `scenarioDeck.pendingLibraryPick` is unresolved.
- After `startDateSession` succeeds, call `markCardPlayed` for the selected scenario card.
- When a date completes or ends early, set both participants' `member.state.lastDateShift` to the active shift number.
- Update `applyDateFinalReportToMembers`: when retention reaches 0, set `member.state.status` to `quit`.
- Update `isMemberRetained`, `getQuitMembers`, and `isCampaignLost` to use `member.state.status`, not only retention.
- Update `startNextShift` to draw from `save.scenarioDeck` and write the result to `shift.drawnScenarioIds`.
- Remove `scenario-powers.ts` usage and the hold, discard, and request-low-pressure UI paths.

Repositories:

- Remove or replace `saveActiveScenarioDeck` on `GameRepository`, since the deck is no longer owned by the active shift.
- Update hydration to preserve new `member.state` fields and to initialize missing `focusedMemberIds` and `scenarioDeck` only for fresh version 5 saves.

## UI Changes

Use the `frontend-skill` for the room work below.

Replace the tab dashboard with a canvas plus floating nav shell.

### Onboarding Screen

- One-time screen at game start after the save exists and before the Office.
- Player picks 4 focus cases from the full active roster of 28 members.
- Continue validates exactly 4 selected.
- AI setup still gates date booking. Do not bypass the current provider setup flow.

### Floating Nav Cluster

- 5 round buttons at bottom right: Office, Gallery, Casebook, Stage, Files.
- Stage is enabled only when a date is staged or live.
- Hide the cluster during a live date.

### Office Canvas

- Cupid desk staging.
- 4 focus case slots pinned visually. Show name, portrait, current ask, qualitative client-confidence state, last date result, days since last date, and cooldown badge. Do not show exact retention, Mood, Openness, Burnout, or pair stat numbers.
- Today's shift card: focused case, suggested partner, suggested scenario card, and `Begin date`.
- Defaults are prefilled by most date-overdue eligible focus case, top internal match-fit partner, and top hand card. The UI may show broad booking copy, but not exact fit scores, raw hidden tags, blocked ask details, or boundary spoilers.
- Right edge: deck strip showing 12 slots. If one slot is pending replacement, show an open slot state. Tap opens Casebook.

### Gallery Canvas

- Art gallery walk. Every member portrait hangs as a framed piece against gallery wall staging.
- Focus cases get a distinguished frame treatment so the 4 read instantly.
- Active candidates use the standard frame.
- Closed members are disabled for matchmaking, get the closure overlay from the case-closures plan, and remain clickable for a read-only sheet.
- Quit members are disabled for matchmaking, get the quit overlay from the case-closures plan, and remain clickable for a read-only sheet.
- Read-only sheets must still obey player-knowledge visibility rules.

### Casebook Canvas

- Filing cabinet metaphor.
- 12 deck slots face up in the cabinet front.
- Side drawer shows the library: remaining scenarios not currently in the deck, plus retired cards greyed out with availability text.
- Support drag and drop for swaps, but also support click-to-select then confirm. Playwright and keyboard users need a non-drag path.
- Voluntary swap confirmation must state that the dropped card is unavailable for the next 3 shifts.
- Pending library pick has a distinct confirmation flow and no retirement penalty.
- Soft warnings render as a small advisory above the cabinet.

### Stage Canvas

- Existing live date UI ported into the canvas treatment.
- Locked once entered. No nav cluster while the date is live.
- Returns to Office on date completion.

### Files Canvas

- Existing `NotesView` and `NotesArchive` ported into the canvas treatment.

### Scenario Card System

Shared component used in Casebook, Office, Files, the library drawer, and hand selection.

- Card face: title, one-line summary, player-safe chips, and three small risk dots for risk, intimacy, and chaos. Do not show raw `scenario.card.tags`.
- Expanded face: premise sentence from `publicBrief`, `idealFor` and `badFor` in player-safe language, repeat behavior, and broad booking notes for active cases.
- Booking notes can be sorted by internal match fit, but visible copy must be based on public asks and filed reads. Do not show hidden tags, exact fit labels, exact pressure, named boundary risks, or stat math.
- Event list is never shown pre-date. Files reveals the full 9-event roster only for scenarios the player has actually run.

## Starter Deck

The default deck for a new save should satisfy 4 low-risk, 5 medium-risk, and 3 high-risk cards. The previous draft list was 5 low, 4 medium, and 3 high, and its `no tag appears more than twice` assertion was impossible with the current 3-tag scenario fixtures.

Proposed starter deck:

1. dmv-number-ticket
2. dinosaur-bbq-all-you-can-eat
3. listening-booth-after-close
4. grocery-run-one-dinner
5. memory-course-dinner
6. midnight-notary-two-clean-promises
7. temporal-coffee-shop
8. impossible-lost-and-found
9. pilgrimage-mercy-spine
10. cousins-wedding-plus-one
11. vivarium-wing-tiny-residents
12. prophecy-karaoke

Validation targets:

- Risk count is exactly 4 low, 5 medium, 3 high.
- Required flavor coverage includes temporal, cosmic, prophecy, memory, food, domestic, career, public, haunted, and repeat-risk.
- No non-pressure flavor tag should exceed 4 cards without a deliberate note.
- Low-pressure and high-pressure tags are allowed to be concentrated because they are pressure axes, not venue flavor. Review the counts instead of enforcing a hard cap.

## Documentation Updates

- [docs/world/visual-design.md](../../docs/world/visual-design.md): add a "Canvas layout and floating nav" section documenting the 5 rooms, nav cluster, staging principles, and scenario card system.
- [docs/world/gameplay-traits.md](../../docs/world/gameplay-traits.md): add a "Focused cases and shift cadence" section. Cover the 4-case focus, open slots after closure, 25-retention swap cost, one-date-per-shift cadence, one-shift cooldown, and no-drift policy.
- [README.md](../../README.md) and [docs/desktop-install-guide.md](../../docs/desktop-install-guide.md): scan for tab and dashboard references and update if found.
- Update tests or docs that still describe the starter roster as 17 members. The fixture roster is 28 members.

## Verification

- `vp check`, `vp test`, `vp build` clean.
- Service tests:
  - Initial deck has 12 unique cards and satisfies starter validation.
  - `drawHand` returns 3 cards and writes a stable hand for the shift.
  - `markCardPlayed` creates an 11-card deck with one pending library pick.
  - `pickLibraryCard` only works when `pendingLibraryPick` exists and restores the deck to 12 cards.
  - `swapCard` retires the dropped card for exactly 3 future shifts.
  - `selectInitialFocusCases` rejects fewer or more than 4 selected.
  - `addFocusCase`, `removeFocusCase`, and `swapFocusCase` preserve the max 4 invariant.
  - `swapFocusCase` deducts 25 retention from the dropped member.
  - `isMemberInCooldown` is true in the date shift and the shift after, false thereafter.
  - `applyDateFinalReportToMembers` flips status to `quit` when retention reaches 0.
  - Closed and quit members cannot be matched, focused, or selected for shift requests.
- Playwright run:
  - Start a new game, pick 4 focus cases, and land on Office.
  - Verify all 4 focus slots render without exact retention or mood numbers.
  - Begin a date with default selections. Verify the nav cluster hides.
  - Finish the date and return to Office. Verify the dated members are in cooldown next shift.
  - Open Casebook, fill the pending library slot, and perform a voluntary swap with 3-shift retirement.
  - Open Gallery and verify focus frames plus disabled closed and quit treatments when seeded.

## Out Of Scope

- Event kind changes. Separate plan, lands first.
- Closure threshold and case closure flow. Separate plan, lands after.
- Drift mechanics. Members do not get frustrated about not going on dates.
- Mobile-specific layout work.
- Member acquisition. Roster stays at 28.

## Order Of Work

1. Schema changes and version bump to 5.
2. Deck service and tests.
3. Focus case service and tests.
4. Shift planning integration.
5. Date-engine integration for booking, pending library picks, cooldown, and status.
6. Repository interface cleanup.
7. Scenario card component.
8. Onboarding screen.
9. Office canvas.
10. Casebook canvas.
11. Gallery canvas.
12. Stage canvas port.
13. Files canvas port.
14. Floating nav cluster.
15. Playwright coverage.
16. Doc updates.
