# Playthrough Findings, 2026-05-05

## Scope

Browser playthrough covered one full shift on the local dev server at `http://localhost:5173/`.

Played flow:

- Punch in from the splash screen.
- Book Gideon and Jenna at Temporal Coffee Shop.
- Advance two exchanges, file one Cupid nudge, resolve the date, and file Encourage.
- Book Tasha and Mr. Whiskers at Museum Exhibit Mixup.
- Advance once, hit an early end, and file Repair.
- Book Decimus and Aldric at Museum Exhibit Mixup.
- Resolve the date, file Encourage, and end the shift.

Artifacts are under `playwright/artifacts/`.

## Findings

- Overall goals were understandable at the shift report, but weak during the shift. The brief kept showing goals as `open` until the final report and did not show reservation progress in the header.
- Switching from a long date back to Roster or Brief preserved the deep scroll offset. The player landed halfway down the next screen and missed the page header.
- The Date tab kept saying `live` after a date wrapped or ended early. That made completed dates look active.
- The transcript showed `Cupid is listening` while idle. It looked like the app was waiting on local AI when the player needed to press `Advance`.
- Single advance turns felt acceptable. The first two live exchanges took about four seconds each and streamed clearly.
- `Resolve date` felt slow because it can generate the rest of a 30 turn date in one run. It is useful, but it needs clear status because the player waits for a long operation.
- The Gideon and Jenna date started well. The nudge was honored and the characters answered each other. The full 30 turn resolve became repetitive around Jenna's name, pastries, oat milk, and the same coffee shop logistics.
- The Tasha and Whiskers date ended early after one exchange. The result matched the deterministic hard stop, but the brief did not make the likely consequence obvious enough before booking.
- The Decimus and Aldric date had the right formal register, but long auto resolve made them loop on exits, schedules, feast logistics, and confirming times. The pair often talked around the same operational topic instead of building a conversation.

## Fixes Applied

- View changes now reset scroll to the top.
- The Date tab now reports `live`, `filed`, `early end`, or `no booking` from the actual date status.
- Idle date screens now show `Next exchange ready`. `Cupid is listening` appears only while an action is pending.
- The brief header now shows reservation progress for the shift.
- The brief dock now adds a short warning for high pressure, risky, or blocked bookings.
- Character prompts now include stronger conversation discipline and a longer recent transcript window, so performers answer the latest line and avoid repeating settled facts.
- Pinned goals now show live progress during the shift instead of staying `open` until the final report.
- `Resolve date` now shows resolving-specific status while the long operation is running.
- Shift goal metric calculation now lives in the date service and has smoke coverage before the shift report is filed.
- Runtime local AI prompts and sanitizers now block em dashes and en dashes in generated transcript, judge, and memory text.

## Remediation Plan

### Keep As Is For Now

- Single `Advance` turns felt good. Keep them as the primary pacing path.
- Full `Resolve date` can stay available for testing and for players who want the paperwork finished, but it needs guardrails before it becomes the default path.

### Next Code Work

- Add chunked auto-resolve. Advance 4 to 6 turns per run, persist after each chunk, and return control to the player between chunks. This keeps local AI as the runtime performer while reducing one long wait.
- Add a resolver progress cue that reads from current turn, turn limit, and pending action. The UI should show exactly where the date is, not just that Cupid is busy.
- Add an anti-loop conversation ledger owned by deterministic app state. Track settled facts, active topic, and recently closed logistics, then pass that validated context into performer prompts.
- Add a judge repetition signal. If a pair keeps repeating settled plans, the judge should mark the exchange stale and the next prompt should force a pivot.
- Add scenario phase metadata: opener, pressure beat, turn, resolution. Director beats should move the conversation through phases instead of letting logistics dominate all 30 turns.

### Content And Design Work

- Rewrite high-risk booking warnings with visible evidence from public member copy and scenario copy. Do not expose hidden tags or exact scoring rules.
- Give hard-stop-prone pairs a clearer pre-booking consequence line. The player should understand that the date might end early before they book it.
- Review Gideon, Jenna, Decimus, and Aldric sample messages for logistics-heavy phrasing. Their voices should still care about schedules and order, but each sample bucket needs at least one emotional or relational move.
- Add a short playtest checklist for date loops: repeated names, repeated food orders, repeated exits, repeated appointment times, and partner questions left unanswered.
