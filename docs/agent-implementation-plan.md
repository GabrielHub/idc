# Agent Implementation Plan

## Current Task: Marcus Pellish Image Assets

Status: completed

Goal: add Marcus Pellish portrait source and runtime cutout assets using the v1 portrait pipeline.

Acceptance criteria:

- Source portrait and avatar live under `assets-source/portraits/marcus-pellish/`.
- Runtime cutouts live under `public/assets/portraits/marcus-pellish/`.
- Marcus reads as a fifty two year old ordinary human in an off-duty going-out outfit.
- Source images use plain white backgrounds and no readable logo or text.
- The avatar preserves the approved full-body character design while using a different pose.
- Marcus fixture metadata no longer marks the portrait assets as pending.
- Marcus is included in approved portrait smoke coverage.
- `vp check`, `vp test`, and `vp build` pass.

Notes:

- Full-body portrait direction approved: off-duty going-out outfit, no work props, no hands in pockets, simplified webtoon face style.
- Avatar direction approved by request to remove the background and wire the asset in.
- Source images and runtime cutouts have been generated for Marcus.
- `vp check`, `vp test`, and `vp build` pass.

## Current Task: Eleanor Ash Image Assets

Status: in progress

Goal: add Eleanor Ash portrait source and runtime cutout assets using the v1 portrait pipeline.

Acceptance criteria:

- Source portrait and avatar live under `assets-source/portraits/eleanor-ash/`.
- Runtime cutouts live under `public/assets/portraits/eleanor-ash/`.
- Eleanor reads as a fae noblewoman in glamour from the Court of Lower Hawthorn.
- Eleanor has shoulder length silver ash hair, sharp pale wintergreen eyes, fair cool-toned skin, subtly pointed ears, and a dark thorn hair pin.
- Clothing direction blends fantasy courtwear with modern high fashion.
- Pose direction is noble and seductive without explicit styling.
- Source images use plain white backgrounds and no readable logo or text.
- The avatar preserves the approved full-body character design while using a different pose.
- Eleanor fixture metadata no longer marks the portrait assets as pending.
- `vp check`, `vp test`, and `vp build` pass.

Notes:

- The user provided reference images for pale high-fashion glamour, sharp brows, clear eyes, and a poised expression. Use them as inspiration only. Do not copy an existing person's likeness, outfit, pose, or composition.

## Current Task: Aldric Vale Marsh Image Assets

Status: completed

Goal: add Sir Aldric of Vale Marsh portrait source and runtime cutout assets using the v1 portrait pipeline.

Acceptance criteria:

- Source portrait and avatar live under `assets-source/portraits/aldric-vale-marsh/`.
- Runtime cutouts live under `public/assets/portraits/aldric-vale-marsh/`.
- Aldric reads as an alternate reality crusader knight in huge bulky armor.
- Aldric is always wearing the armor and helmet.
- The full-body portrait may hide the face behind the helmet.
- The avatar preserves the approved full-body armor and helmet design while showing the eyes through the helmet eye holes.
- Source images use plain white backgrounds and no readable logo or text.
- The avatar preserves the approved full-body character design while using a different pose.
- Aldric fixture metadata no longer marks the portrait assets as pending.
- `vp check`, `vp test`, and `vp build` pass.

Notes:

- Portrait and avatar sources were approved and saved under `assets-source/portraits/aldric-vale-marsh/`.
- Runtime cutouts were generated under `public/assets/portraits/aldric-vale-marsh/` with `bria-rmbg`.
- Aldric fixture metadata now points at the approved source and runtime cutout assets.
- Aldric is included in approved portrait smoke coverage.
- `vp check`, `vp test`, and `vp build` pass.

## Current Task: Playable Gap Cleanup

Status: completed

Goal: resolve the remaining playable-status gaps without adding a non-AI date mode.

Acceptance criteria:

- Documentation removes stale product-plan ownership references.
- Documentation states that Ollama-gated date play is intentional.
- The shift report can open the next shift without wiping completed campaign state.
- Smoke coverage verifies next-shift continuation.
- `vp check`, `vp test`, and `vp build` pass.

Notes:

- Code, tests, fixtures, and assets are now documented as the source of truth for implemented gameplay.
- `startNextShift` creates a fresh active shift after the current shift is filed while preserving prior dates, reports, follow-ups, pair state, and memories.

## Current Task: Token Streaming Date Messages

Status: completed

Goal: stream local AI performer messages into the date transcript while preserving deterministic app-owned gameplay state.

Acceptance criteria:

- Character turns stream into the browser incrementally during date advance.
- Streamed draft text is replaced by the validated saved transcript when the server completes the exchange.
- The existing non-streaming JSON API remains available for fallback paths.
- `vp check`, `vp test`, and `vp build` pass.
- Browser playtest confirms a date can be advanced with streamed transcript text and a final committed judge pass.

Notes:

- The local AI performer path now streams typed NDJSON events from `/api/game?intent=stream`.
- The browser renders uncommitted draft bubbles during streaming and replaces them with the validated saved transcript after completion.
- `Advance` and `Resolve date` both use the streaming client path.
- Browser playtest captured a midstream draft at `playwright/screenshots/streaming-draft-midflight.png` and a committed exchange at `playwright/screenshots/streaming-committed-after-advance.png`.

## Current Task: Judge Reaction Effects And Streaming Research

Status: completed

Goal: add deterministic live reaction effects around date portraits and evaluate the right streaming and local Ollama speed path.

Acceptance criteria:

- Portrait reaction effects derive from validated judge snapshots, not direct LLM emoji selection.
- Effects appear beside the active date portraits without blocking chat or footer controls.
- Research notes use primary AI SDK and Ollama docs.
- `vp check` passes after UI changes.
- Browser playtest confirms reactions render after an exchange.

Notes:

- Reaction effects now derive from the latest judge snapshot and render beside each desktop standee.
- Ollama chat calls are capped to 8192 context tokens with a 10 minute keep-alive.
- Warm measured exchange time after the context cap was about 2.7 seconds.

## Current Task: Ollama Readiness And Playtest

Status: completed

Goal: fix local Ollama readiness detection and validate the booking flow with browser playtesting.

Acceptance criteria:

- The local AI status endpoint reports ready when Ollama is running with the configured models.
- Gemma chat calls do not spend bounded response budgets on hidden thinking output before visible text.
- Date booking and at least one AI exchange work from the browser.
- `vp check`, `vp test`, and `vp build` pass.

Notes:

- Warm measured exchange time was about 3.2 seconds for embeddings, two character turns, and the judge.
- Browser playtest confirmed Local AI online, date booking, one generated exchange, and one judge pass.

## Current Task: Local AI Date Generation Contract

Status: completed

Goal: tighten local Gemma date generation so character turns read like short text conversation messages and return inside the gameplay request timeout.

Acceptance criteria:

- Character generation uses deterministic memory context instead of performer-selected memory tool calls.
- Character prompts are organized into task, context, constraints, and output contract sections.
- Character output is capped to one short chat message suitable for the date transcript.
- Structured judge and memory generation remain schema validated.
- Existing UI refactor files are not touched.
- `vp check`, `vp test`, and `vp build` pass.

## Current Task: Save Schema Reset

Status: completed

Goal: make the homepage wipe and reset paths use the current save schema and stop showing stale schema copy.

Acceptance criteria:

- The save schema version is defined in one shared contract.
- Browser saves use a storage key that matches the current schema version.
- Existing valid saves under the old key migrate to the current key.
- Wipe and reset remove stale legacy save keys.
- The homepage displays the current save schema version.
- `vp check`, `vp test`, and `vp build` pass.

## Current Task: Brief Header Cleanup

Status: completed

Goal: remove duplicate orientation controls from the brief header.

Acceptance criteria:

- The brief header no longer repeats the selected pair in a call sheet subheader.
- The brief header no longer includes the duplicate roster button.
- The reservation count copy remains visible.
- `vp check`, `vp test`, and `vp build` pass.

## Current Task: Brady Strait Image Assets

Status: completed

Goal: revise Brady Strait portrait source and runtime cutout assets using the v1 portrait pipeline.

Acceptance criteria:

- Source portrait and avatar live under `assets-source/portraits/brady-strait/`.
- Runtime cutouts live under `public/assets/portraits/brady-strait/`.
- Brady uses a modern fashionable outfit with no neck lanyard and no hands in pockets.
- Brady fixture metadata no longer marks the portrait assets as pending.
- `vp check`, `vp test`, and `vp build` pass.

## Current Task: Toby Wenz Image Assets

Status: completed

Goal: add Toby Wenz portrait source and runtime cutout assets using the v1 portrait pipeline.

Acceptance criteria:

- Source portrait and avatar live under `assets-source/portraits/toby-wenz/`.
- Runtime cutouts live under `public/assets/portraits/toby-wenz/`.
- Toby fixture metadata no longer marks the portrait assets as pending.
- `vp check`, `vp test`, and `vp build` pass.

## Current Task: Calvin Hewes Image Assets

Status: completed

Goal: add Calvin Hewes portrait source and runtime cutout assets using the v1 portrait pipeline.

Acceptance criteria:

- Source portrait and avatar live under `assets-source/portraits/calvin-hewes/`.
- Runtime cutouts live under `public/assets/portraits/calvin-hewes/`.
- Calvin reads as a mothman in a very nice fashion-forward suit with no lanyard.
- The avatar preserves the full-body character design while using a different pose.
- Calvin fixture metadata no longer marks the portrait assets as pending.
- Calvin is included in approved portrait smoke coverage.
- `vp check`, `vp test`, and `vp build` pass.
