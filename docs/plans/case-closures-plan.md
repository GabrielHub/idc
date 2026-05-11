# Case Closure Endgame

## Status

Ready for implementation after the revised deck-roster-canvas plan lands. Depends on `member.state.status`, `focusedMemberIds`, Office, Gallery, and Files canvases from that plan.

## Goal

Add a positive endgame. Pairs that reach a stat threshold can delete the app together. Both members lock out of matchmaking with a short AI-authored closure summary. The campaign quit tolerance rises by 1 per closure. 5 closures triggers a soft-win cutscene once, then the game continues.

## Background

- No pair completion concept exists today. Pairs persist indefinitely.
- Pair stats in [game.ts](../../app/domain/game.ts): chemistry, trust, stability, conflict, weirdnessTolerance, spark, strain, relationshipHealth.
- Pair stats start around 50 to 65 in [game-seed.ts](../../app/services/game-seed.ts). A 75 threshold across positive stats is a real climb.
- Current lose condition is 3 quits through `CLIENT_LOSS_LIMIT` in [date-engine.ts](../../app/services/date-engine.ts).
- The deck-roster-canvas plan moves member lifecycle into `member.state.status` with `active`, `closed`, and `quit`.
- Local AI judges exchange boundaries. Local AI also summarizes completed date memories through `buildSummarizerPromptPacket`; deterministic fallback memory records exist when structured memory output fails.
- Date outcomes are `second_date`, `mixed`, `cool_down`, `bad_fit`, and `early_end`. `second_date` is the best outcome.

## Closure Threshold

```
chemistry >= 75
AND trust >= 75
AND relationshipHealth >= 75
AND strain <= 30
AND conflict <= 30
AND completed date count including the just-finished date >= 3
AND finalReport.outcome === "second_date"
```

The `outcome === "second_date"` gate ties closure to a good date moment. Without it, a pair could close after a cooldown or repair-shaped result if stats were still high from earlier dates.

## Schema Changes

- `dateFinalReportSchema`: add `readyToClose: z.boolean().default(false)`.
- `gameSaveSchema`: add `closureCount: z.number().int().min(0).default(0)`.
- `gameSaveSchema`: add `softWinSeen: z.boolean().default(false)`.
- Do not add a new memory scope. Use existing `scope: "pair"` plus tag `pair_closure`. This keeps memory search, Files filters, and visibility rules inside the current model.
- Bump `SAVE_SCHEMA_VERSION` to 6. No migration.

## Service Changes

[date-engine.ts](../../app/services/date-engine.ts):

- After final report creation, evaluate closure readiness against the updated pair stats, the final report outcome, and completed date count including the current session.
- Set `finalReport.readyToClose` on the completed session.
- Update `isCampaignLost` to compare quit count against `clientLossLimit(save)` instead of a static limit.
- Ensure closed members never become quit members through later retention changes.

New service file `app/services/closures.ts`:

- `evaluateClosureReadiness({ pairState, finalReport, completedDateCount }): boolean`.
- `clientLossLimit(save): number`. Returns `CLIENT_LOSS_LIMIT_BASE + save.closureCount`, where `CLIENT_LOSS_LIMIT_BASE = 3`.
- `getReadyClosurePairs(save)`: returns pairs whose latest completed session has `finalReport.readyToClose === true`, whose current stats still satisfy the threshold, and whose members are still active.
- `closePair(save, pairId, summary, now): GameSave`. Validates readiness, writes a pair memory tagged `pair_closure`, flips both members to `member.state.status = "closed"`, increments `closureCount`, applies +5 retention to remaining active members, removes either member from `focusedMemberIds`, and leaves closed members out of future matchmaking.
- `isSoftWinReached(save): boolean`. Returns `save.closureCount >= 5`.
- `shouldShowSoftWin(save): boolean`. Returns true when `closureCount >= 5` and `softWinSeen` is false.
- `markSoftWinSeen(save): GameSave`. Sets `softWinSeen` to true.

New AI service hook in `app/services/ai/`:

- `generateClosureSummary({ pair, members, history, lastFinalReport })`.
- Returns structured output with a short summary string. Validate length and reject em or en dash characters.
- References shared moments from completed dates, pair memories, and the last final report.
- Does not editorialize about Cupid's role.
- The AI hook does not mutate state. UI orchestration calls the hook, then passes the validated summary into `closePair`.
- If AI summary generation fails, keep the closure callout pending and show a retryable error. Do not close the pair with an empty summary.

## UI Changes

Use the `frontend-skill` for the screen work below.

### Office Canvas Additions

- Closure callout: when `getReadyClosurePairs(save)` returns a pair involving a focused member, render a prominent but non-blocking callout: `X and Y are ready to delete the app. Close their case?`
- Confirm initiates closure summary generation, then persists `closePair` after validation.
- Cupid contract status: small desk display showing `Quits remaining: N`, where `N = clientLossLimit(save) - currentQuitCount`.

### Gallery Canvas Overlays

- Closed member: heart overlay using the existing Cupid mark or a local SVG that matches [dashboard-atoms.tsx](../../app/components/dashboard-atoms.tsx). Label: `Case closed.`
- Quit member: large red X overlay. Label: `Cancelled membership.`
- Both states are disabled for matchmaking and focus selection, but remain clickable for read-only sheets.

### Soft-Win Cutscene

- Triggers at the start of the next shift after the 5th closure, when `shouldShowSoftWin(save)` is true.
- Full-canvas treatment: title `Cupid received a promotion`, the first 5 closed pairs with closure summaries, and a `Continue` button.
- Continue calls `markSoftWinSeen`.
- Game continues after. The cutscene fires once per save.

### Files Canvas Closure Summary Treatment

- Pair memories tagged `pair_closure` render with a distinct frame treatment and sit at the top of that pair's note list.
- The note remains `scope: "pair"` and follows existing memory visibility rules.

## Documentation Updates

- [docs/world/gameplay-traits.md](../../docs/world/gameplay-traits.md): add a "Case closures and win conditions" section. Cover the threshold, player-initiated close flow, +5 retention bump, dynamic quit cap, soft win at 5 closures, and no-revival rule.
- [docs/world/voice.md](../../docs/world/voice.md): add a "Closure summary voice" entry. Closure summaries are warm, specific, and short. They reference shared moments and do not editorialize about Cupid's role. Restate the no em or en dash rule for the generated memory string.

## Verification

- `vp check`, `vp test`, `vp build` clean.
- Service tests:
  - `evaluateClosureReadiness` covers stat thresholds, completed date count including the current date, and the `second_date` gate.
  - `getReadyClosurePairs` ignores stale older reports after a later non-ready date.
  - `closePair` flips both members to closed, increments `closureCount`, applies +5 retention to other active members, writes a pair memory tagged `pair_closure`, and frees focus slots.
  - `closePair` rejects pairs that are not ready, already closed, or involve quit members.
  - `clientLossLimit` returns 3 with no closures and 8 with 5 closures.
  - `isCampaignLost` compares quit count against the dynamic cap.
  - `shouldShowSoftWin` fires once and `markSoftWinSeen` suppresses repeats.
- AI hook tests:
  - Valid summaries pass schema.
  - Summaries with hidden stat numbers, forbidden dash characters, or Cupid-editorializing text are rejected.
- Playwright runs:
  - Load or seed a ready pair, verify the Office callout appears, close the case, and confirm the summary renders in Files.
  - Verify both closed members get the heart treatment in Gallery and cannot be booked again.
  - Drive or seed a member to retention 0. Verify status flips to quit, red X renders in Gallery, quit count uses the dynamic cap, and campaign continues until the cap is hit.
  - Seed 5 closures. Verify the soft-win cutscene fires once, can be continued, and does not reappear after reload.

## Out Of Scope

- Re-opening closed cases. Closure is permanent.
- Closure summary editing or regeneration by the player.
- Per-pair leaderboard or scoring outside the existing notes archive.
- Member acquisition or roster expansion.
- Additional closure rewards beyond the +5 retention bump and quit cap rise.
- Drift mechanics. Closure reward is real, neglect is not punished.

## Order Of Work

1. Schema changes and version bump to 6.
2. Closure readiness evaluation in date-engine.
3. `closures.ts` service and tests.
4. AI summary generator hook and validation.
5. Dynamic campaign loss cap.
6. Office callout and Cupid contract status display.
7. Gallery overlays for closed and quit.
8. Files closure summary frame treatment.
9. Soft-win cutscene and seen flag.
10. Playwright coverage.
11. Doc updates.
