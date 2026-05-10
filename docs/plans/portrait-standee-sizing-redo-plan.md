# Portrait Standee Sizing Redo Plan

Date: 2026-05-09

## Reason

The date standee renders full-body portraits through `object-contain object-bottom`. A wide portrait canvas hits the standee width cap before it can use the available height, so the character appears shorter than portraits in the tall asset family.

Good references from the current shipped set:

| Member        | Runtime asset                                        | Canvas     | Aspect  | Audit displayed visible height |
| ------------- | ---------------------------------------------------- | ---------- | ------- | ------------------------------ |
| Meridian Vale | `public/assets/portraits/meridian-vale/portrait.png` | `887x1774` | `0.500` | `506px`                        |
| Opal Sunday   | `public/assets/portraits/opal-sunday/portrait.png`   | `887x1774` | `0.500` | `477px`                        |
| Gideon Glass  | `public/assets/portraits/gideon-glass/portrait.png`  | `887x1774` | `0.500` | `495px`                        |

Target for redone full-body source assets:

- Required final source canvas is `887x1774` PNG on a plain white opaque background, matching the good reference family.
- Canvas aspect should land near the existing tall family, roughly `0.46` to `0.52`.
- Character alpha should use most of the canvas height after cutout.
- In a `256x520` standee audit frame, visible character height should land near `470px` or higher unless the approved pose is intentionally seated or crouched.
- Do not fix this with member-specific CSS scaling. The asset geometry is the problem.

## Execution Rules

- Work one character batch at a time. The full scope for a batch is every flagged asset for that one character, with no other character touched during that batch.
- Work one asset file at a time. Treat each row in the redo tables as a single transaction.
- Finish that one asset all the way through approved source replacement, single-file cutout, runtime verification, metadata updates if needed, and checklist update before starting the next asset.
- Finish the current character batch before starting another character. A batch is not complete until every flagged asset for that character has a completed transaction log, the character's variants have been checked together in the standee, and the batch closeout is written.
- Do not build a queue of generated replacements waiting to be cut out later. That creates unclear state and makes it too easy to lose track of what actually shipped.
- Do not generate candidates for a second character while the current character batch is in progress.
- Do not regenerate a whole member folder just because one variant is bad.
- The broken image is the reference. The replacement must preserve the same character, face, hair, outfit, palette, carried props, supernatural hook, variant expression, and general pose intent.
- The generation task is not a redesign. It is the same image corrected into the standee-safe canvas family.
- Do not overwrite the final source path until the candidate passes visual comparison and required approval.
- Do not run background removal on a candidate that has not passed visual comparison.
- Do not wire a candidate into `public/assets/portraits` until the approved source has passed background removal and the sizing audit.
- Do not block rows on Playwright artifacts for this plan while the shared browser is occupied by ongoing work. Use the sizing audit plus user manual standee verification in the running app. Record that decision in the transaction log's `Playwright standee check` field.
- If work is interrupted, resume from the last asset with a complete transaction log. Do not infer completion from candidate files alone.
- Keep the progress ledgers in this file current. They are the handoff contract for the next agent.
- Generated assets should be checked in only after human approval, per `docs/world/image-style.md`.

## Resume Protocol

At the start of any work session:

1. Read this plan.
2. Check the Batch Progress Ledger.
3. If a batch is `ACTIVE`, resume that batch only.
4. If no batch is `ACTIVE`, start the first batch whose status is `TODO`.
5. Inside the active batch, check the Asset Progress Ledger.
6. If an asset is `ACTIVE`, resume that asset from its `Current gate`.
7. If no asset is `ACTIVE`, start the first `TODO` asset in the active batch.
8. If a row is `BLOCKED`, read the row note and resolve the blocker before starting another row.
9. Before stopping work, update the asset ledger, batch ledger, and the relevant transaction log or closeout.

Status values:

- `TODO`: not started.
- `ACTIVE`: currently in progress.
- `BLOCKED`: started but waiting on a decision, tool, approval, or fix.
- `COMPLETE`: wired, verified, and logged.
- `SKIPPED_AFTER_REVIEW`: reviewed and intentionally not regenerated. Use only for borderline assets after visual review.

Gate values for active assets:

- `reference-analysis`
- `candidate-generation`
- `candidate-comparison`
- `human-approval`
- `source-replacement`
- `single-file-cutout`
- `cutout-verification`
- `standee-verification`
- `fixture-metadata`
- `final-check`

Ledger rules:

- Exactly one batch may be `ACTIVE`.
- Exactly one asset may be `ACTIVE`.
- A batch cannot become `COMPLETE` until all assets in that batch are `COMPLETE` or `SKIPPED_AFTER_REVIEW`.
- Do not mark an asset `COMPLETE` until its transaction log has `Final status: complete`.
- Do not mark a batch `COMPLETE` until its closeout has `Batch status: complete`.
- If files and the ledger disagree, trust neither blindly. Inspect the files, transaction log, and git diff, then update the ledger to the verified state before continuing.

## Transaction Log Template

Copy this log for each asset and complete it before moving to the next table row:

```text
Asset:
Source reference opened:
Runtime cutout opened:
Good sibling or scale reference opened:
Reference analysis note:
Candidate path: First candidate generated at assets-source/portraits/vhool/review/portrait-flirty-candidate-2026-05-09.png, then rejected and removed before approval.
Candidate comparison note: First candidate was exactly 887x1774 and preserved the flirty open arms, smile, black and magenta robe palette, eye shaped jewels, hair, face, boots, and living shadow hook well enough visually. It failed sizing because the visible character area was only about 855x1480 with a displayed visible height of 427px in the 256x520 standee frame, leaving too much empty white canvas below the feet. Rejected for undersized standee result.
Human approval:
Source replaced:
Single-file cutout command:
Cutout inspection:
Sizing audit result:
Playwright standee check:
Fixture metadata changed:
Verification commands:
Final status:
```

## Character Batch Closeout Template

Copy this closeout once per character batch and complete it before starting the next character:

```text
Character:
Batch assets:
Completed asset transaction logs:
Known-good sibling variants checked:
All variant scale comparison:
Date reactions playground screenshot or notes:
Remaining issues:
Verification commands:
Batch status:
```

## Character Batches

Run these as separate work sessions where possible. Each batch is a bounded scope with its own closeout. Inside each batch, use the per-asset workflow one image at a time.

### Batch 1: Vhool

Clear redo assets:

- `portrait.png`
- `portrait-flirty.png`
- `portrait-confused.png`
- `portrait-angry.png`

Batch goal: fix the original visible standee scale problem and establish the comparison rhythm for the remaining batches.

### Batch 2: Mr Whiskers

Clear redo assets:

- `portrait.png`
- `portrait-flirty.png`
- `portrait-confused.png`
- `portrait-angry.png`

Batch goal: fix the second confirmed small-looking standee character.

### Batch 3: Eleanor Ash

Clear redo assets:

- `portrait.png`
- `portrait-flirty.png`
- `portrait-angry.png`

Known-good sibling reference:

- `portrait-confused.png`

Batch goal: use Eleanor's existing good confused variant as the main scale and identity reference. Do not regenerate `portrait-confused.png` for this sizing issue.

### Batch 4: Mira Park

Clear redo assets:

- `portrait.png`
- `portrait-flirty.png`
- `portrait-confused.png`
- `portrait-angry.png`

Batch goal: correct the whole Mira set, which is in a moderately wide `977x1610` family.

### Batch 5: Sera Vohn

Clear redo assets:

- `portrait.png`

Known-good sibling references:

- `portrait-flirty.png`
- `portrait-confused.png`
- `portrait-angry.png`

Batch goal: fix only the neutral source. Do not touch the three good sibling variants unless visual review finds a separate defect.

### Batch 6: Borderline Review, Toby Wenz

Borderline assets:

- `portrait.png`
- `portrait-flirty.png`
- `portrait-confused.png`
- `portrait-angry.png`

Batch goal: review visually before regenerating. These are less severe than the clear failures, but the variants sit outside the good reference band.

### Batch 7: Borderline Review, Kade Sumner

Borderline asset:

- `portrait-confused.png`

Batch goal: review visually before regenerating. Fix only if the standee comparison confirms the variant reads undersized beside Kade's other variants and the good reference portraits.

## Batch Progress Ledger

Update this table at the start and end of each work session.

| Batch | Character   | Status     | Active asset         | Notes                                                                                                           |
| ----- | ----------- | ---------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1     | Vhool       | `COMPLETE` |                      | Batch complete. All four Vhool standee portraits are in the tall 887x1774 family.                               |
| 2     | Mr Whiskers | `ACTIVE`   | `portrait-angry.png` | Neutral, flirty, and confused portraits complete. Angry is blocked on review of the current recanvas candidate. |
| 3     | Eleanor Ash | `TODO`     |                      |                                                                                                                 |
| 4     | Mira Park   | `TODO`     |                      |                                                                                                                 |
| 5     | Sera Vohn   | `TODO`     |                      |                                                                                                                 |
| 6     | Toby Wenz   | `TODO`     |                      | Borderline review batch                                                                                         |
| 7     | Kade Sumner | `TODO`     |                      | Borderline review batch                                                                                         |

## Asset Progress Ledger

Update this table at every gate transition. The next agent should be able to resume from `Status`, `Current gate`, and `Next action` without guessing.

| Batch | Character   | Asset                   | Status     | Current gate     | Next action                                                                                                                   | Transaction log                           |
| ----- | ----------- | ----------------------- | ---------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1     | Vhool       | `portrait.png`          | `COMPLETE` | `final-check`    | Done                                                                                                                          | Vhool neutral portrait transaction        |
| 1     | Vhool       | `portrait-flirty.png`   | `COMPLETE` | `final-check`    | Done                                                                                                                          | Vhool flirty portrait transaction         |
| 1     | Vhool       | `portrait-confused.png` | `COMPLETE` | `final-check`    | Done                                                                                                                          | Vhool confused portrait transaction       |
| 1     | Vhool       | `portrait-angry.png`    | `COMPLETE` | `final-check`    | Done                                                                                                                          | Vhool angry portrait transaction          |
| 2     | Mr Whiskers | `portrait.png`          | `COMPLETE` | `final-check`    | Done                                                                                                                          | Mr Whiskers neutral portrait transaction  |
| 2     | Mr Whiskers | `portrait-flirty.png`   | `COMPLETE` | `final-check`    | Done                                                                                                                          | Mr Whiskers flirty portrait transaction   |
| 2     | Mr Whiskers | `portrait-confused.png` | `COMPLETE` | `final-check`    | Done                                                                                                                          | Mr Whiskers confused portrait transaction |
| 2     | Mr Whiskers | `portrait-angry.png`    | `BLOCKED`  | `human-approval` | Review `assets-source/portraits/mr-whiskers/review/portrait-angry-recanvas-candidate-2026-05-10.png` and approve or reject it | Mr Whiskers angry portrait transaction    |
| 3     | Eleanor Ash | `portrait.png`          | `TODO`     |                  | Start after Mr Whiskers batch is complete                                                                                     |                                           |
| 3     | Eleanor Ash | `portrait-flirty.png`   | `TODO`     |                  | Start after previous Eleanor asset is complete                                                                                |                                           |
| 3     | Eleanor Ash | `portrait-angry.png`    | `TODO`     |                  | Start after previous Eleanor asset is complete                                                                                |                                           |
| 4     | Mira Park   | `portrait.png`          | `TODO`     |                  | Start after Eleanor batch is complete                                                                                         |                                           |
| 4     | Mira Park   | `portrait-flirty.png`   | `TODO`     |                  | Start after previous Mira asset is complete                                                                                   |                                           |
| 4     | Mira Park   | `portrait-confused.png` | `TODO`     |                  | Start after previous Mira asset is complete                                                                                   |                                           |
| 4     | Mira Park   | `portrait-angry.png`    | `TODO`     |                  | Start after previous Mira asset is complete                                                                                   |                                           |
| 5     | Sera Vohn   | `portrait.png`          | `TODO`     |                  | Start after Mira batch is complete                                                                                            |                                           |
| 6     | Toby Wenz   | `portrait.png`          | `TODO`     |                  | Start borderline visual review after clear batches are complete                                                               |                                           |
| 6     | Toby Wenz   | `portrait-flirty.png`   | `TODO`     |                  | Start after previous Toby asset is complete or skipped                                                                        |                                           |
| 6     | Toby Wenz   | `portrait-confused.png` | `TODO`     |                  | Start after previous Toby asset is complete or skipped                                                                        |                                           |
| 6     | Toby Wenz   | `portrait-angry.png`    | `TODO`     |                  | Start after previous Toby asset is complete or skipped                                                                        |                                           |
| 7     | Kade Sumner | `portrait-confused.png` | `TODO`     |                  | Start borderline visual review after Toby batch is complete                                                                   |                                           |

## Transaction Logs

### Vhool Neutral Portrait Transaction

```text
Asset: assets-source/portraits/vhool/portrait.png
Source reference opened: Yes, opened assets-source/portraits/vhool/portrait.png
Runtime cutout opened: Yes, opened public/assets/portraits/vhool/portrait.png
Good sibling or scale reference opened: Yes, opened public/assets/portraits/meridian-vale/portrait.png
Reference analysis note: Vhool must remain the same elegant ancient eldritch god with pale skin, long obsidian hair falling over one eye, violet eyes, a small forehead mark, slim body, ornate black ceremonial robes with magenta panels, gold chains, tassels, eye shaped violet and magenta jewels, ornate boots, and living black shadow with violet eye shapes rising close behind the shoulders. The neutral state is quiet, lonely, controlled, and menacing without a smile. The pose intent is a centered dating profile full body stance with one relaxed hand and one lowered sleeve hand. The current 1024x1536 canvas is too wide for the standee. Its alpha uses most of the source height, but object contain hits the width cap and displays at about 379px in the 256x520 audit frame, much shorter than the tall reference family. Target output is 887x1774 on a plain white opaque background, full body visible from head to feet, with the same character geometry and no redesign.
Candidate path: Generated at assets-source/portraits/vhool/review/portrait-candidate-2026-05-09.png, then approved and retained as assets-source/portraits/vhool/portrait.png. The duplicate review file was removed after source replacement.
Candidate comparison note: Candidate is exactly 887x1774 RGB with an audit visible area of about 739x1714 and displayed visible height of 495px in the 256x520 standee frame. Identity match is close: pale face, violet eyes, forehead mark, long obsidian hair, black and magenta ceremonial robes, gold chains, tassels, eye shaped jewels, ornate boots, and living black shadow with violet eyes are preserved. Expression remains neutral, quiet, and controlled. Pose is slightly taller and more centered with a narrower canvas, both feet visible, and no new scenery, text, frame, or logo. Candidate is acceptable for human approval review before source replacement.
Human approval: Approved by user on 2026-05-09 with "looks good".
Source replaced: Yes, copied approved candidate to assets-source/portraits/vhool/portrait.png. SHA256 matched the review candidate after replacement.
Single-file cutout command: vp run portrait:cutout --input assets-source/portraits/vhool/portrait.png --output public/assets/portraits/vhool/portrait.png --overwrite
Cutout inspection: public/assets/portraits/vhool/portrait.png regenerated at 887x1774 RGBA. Transparent corners are clean. Alpha edge preserves hair, shadow tendrils, robes, tassels, boot details, and thin jewelry. No visible white halo was found in image inspection.
Sizing audit result: Runtime cutout is 887x1774, aspect 0.500, visible alpha about 742x1719, displayed visible height 496px in a 256x520 standee audit frame. This is in the good reference band beside Meridian Vale at 506px, Opal Sunday at 477px, and Gideon Glass at 495px. Existing Vhool flirty, confused, and angry variants were unchanged and remain TODO for their own transactions.
Playwright standee check: Passed on http://localhost:5173/playground at 1920x1080. Date reactions stage loaded Vhool neutral from /assets/portraits/vhool/portrait.png with natural size 887x1774. Screenshot saved to playwright/screenshots/vhool-neutral-standee-stage.png. Image metrics saved to playwright/logs/vhool-neutral-standee-image-metrics.json.
Fixture metadata changed: No. Existing filename, source path, cutout path, and prompt metadata still describe the approved character.
Verification commands: vp run portrait:cutout --input assets-source/portraits/vhool/portrait.png --output public/assets/portraits/vhool/portrait.png --overwrite; vp check; Playwright date reactions stage screenshot and image metrics at 1920x1080.
Final status: complete
```

### Vhool Flirty Portrait Transaction

```text
Asset: assets-source/portraits/vhool/portrait-flirty.png
Source reference opened: Yes, opened assets-source/portraits/vhool/portrait-flirty.png
Runtime cutout opened: Yes, opened public/assets/portraits/vhool/portrait-flirty.png
Good sibling or scale reference opened: Yes, opened approved assets-source/portraits/vhool/portrait.png and checked public/assets/portraits/gideon-glass/portrait.png sizing as a tall reference
Reference analysis note: Vhool must remain the same elegant ancient eldritch god as the approved neutral source, with pale skin, violet eyes, small forehead mark, very long obsidian hair falling over one eye, slim elegant body, ornate black ceremonial robes with magenta panels, gold chains, tassels, eye shaped violet and magenta jewels, ornate boots, and living black shadow with many violet eye shapes. The flirty variant state is warmer and more inviting than neutral: both arms open outward with palms visible, chest open, big sincere smile that still reads slightly menacing, direct delighted eye contact, and more active black shadow creeping from robe gaps and sleeve openings. The current 1024x1536 canvas is too wide for the standee. Its visible character area is about 966x1515, but object contain hits the width cap and displays at about 379px in the 256x520 audit frame. Target output is 887x1774 on a plain white opaque background, full body visible from head to feet, with the same flirty pose intent and no redesign.
Candidate path: First candidate generated at assets-source/portraits/vhool/review/portrait-flirty-candidate-2026-05-09.png, then rejected and removed before approval. Approved candidate generated at assets-source/portraits/vhool/review/portrait-flirty-candidate-2-2026-05-09.png.
Candidate comparison note: First candidate was exactly 887x1774 and preserved the flirty open arms, smile, black and magenta robe palette, eye shaped jewels, hair, face, boots, and living shadow hook well enough visually. It failed sizing because the visible character area was only about 855x1480 with a displayed visible height of 427px in the 256x520 standee frame, leaving too much empty white canvas below the feet. Rejected for undersized standee result. Second candidate is exactly 887x1774 RGB with an audit visible area of about 883x1740 and displayed visible height of 502px in the 256x520 standee frame. It preserves Vhool's pale face, violet eyes, forehead mark, long obsidian hair, open arm invitation pose, flirty menacing smile, black and magenta ceremonial robe palette, chains, tassels, eye shaped jewels, ornate boots, and active living shadow. Hands and feet are visible, with no text, logo, frame, scenery, or obvious redesign. Candidate is acceptable for human approval review before source replacement.
Human approval: Approved by user on 2026-05-09 with "I approved it".
Source replaced: Yes, copied approved candidate to assets-source/portraits/vhool/portrait-flirty.png. SHA256 after replacement was CD3A12D51880FE9696779B296E2F651827ADA1E56C02FBCA22706A449B5202DF, matching the review candidate.
Single-file cutout command: vp run portrait:cutout --input assets-source/portraits/vhool/portrait-flirty.png --output public/assets/portraits/vhool/portrait-flirty.png --overwrite
Cutout inspection: public/assets/portraits/vhool/portrait-flirty.png regenerated at 887x1774 RGBA. Transparent corners are clean. Alpha edge preserves hair, robe edges, hands, boots, jewelry, tassels, eye shaped ornaments, and the active black shadow tendrils. No obvious white halo was found in image inspection.
Sizing audit result: Runtime cutout is 887x1774, aspect 0.500, visible alpha about 886x1747, displayed visible height 504px in a 256x520 standee audit frame. This is in the good reference band beside Meridian Vale at 506px, Opal Sunday at 477px, Gideon Glass at 495px, and approved Vhool neutral at 496px. Existing Vhool confused and angry variants were unchanged and remain TODO for their own transactions.
Playwright standee check: User opted to manually verify the standee on 2026-05-09 because the shared Playwright browser remains occupied by ongoing work. No browser artifact is required for this asset transaction.
Fixture metadata changed: No. Existing filename, source path, cutout path, and prompt metadata still describe the approved character.
Verification commands: vp run portrait:cutout --input assets-source/portraits/vhool/portrait-flirty.png --output public/assets/portraits/vhool/portrait-flirty.png --overwrite; vp check; sizing audit script for public/assets/portraits/vhool/portrait-flirty.png and good reference portraits.
Final status: complete
```

### Vhool Confused Portrait Transaction

```text
Asset: assets-source/portraits/vhool/portrait-confused.png
Source reference opened: Yes, opened assets-source/portraits/vhool/portrait-confused.png
Runtime cutout opened: Yes, opened public/assets/portraits/vhool/portrait-confused.png
Good sibling or scale reference opened: Yes, opened approved assets-source/portraits/vhool/portrait.png and checked public/assets/portraits/gideon-glass/portrait.png sizing as a tall reference
Reference analysis note: Vhool must remain the same elegant ancient eldritch god as the approved neutral source, with pale skin, violet eyes, small forehead mark, very long obsidian hair falling over one eye, slim elegant body, ornate black ceremonial robes with magenta panels, gold chains, tassels, belt jewelry, sleeve trim, robe ornaments, ornate boots, violet and magenta eye shaped jewels, and restrained living black shadow close to the body. The confused variant state is polite vulnerable bafflement: shoulders slightly drawn in, one hand open near the chest jewelry with palm up, the other sleeve hand hovering outward in a gentle pause gesture, pinched brows, direct uncertain eyes, mouth slightly parted, and only one or two small violet eyes in the shadow. The current 1024x1536 canvas is too wide for the standee. The runtime cutout visible area is about 741x1506, but object contain hits the width cap and displays at about 376px in the 256x520 audit frame. Approved Vhool neutral displays at about 496px and Gideon Glass at about 495px. Target output is 887x1774 on a plain white opaque background, full body visible from head to feet, with the same confused pose intent and no redesign.
Candidate path: Generated at assets-source/portraits/vhool/review/portrait-confused-candidate-2026-05-09.png, then approved and retained as assets-source/portraits/vhool/portrait-confused.png. The duplicate review file was removed after source replacement.
Candidate comparison note: Candidate is exactly 887x1774 and its approximate foreground area is about 750x1701, with a displayed visible height of 491px in the 256x520 standee frame. It preserves Vhool's pale face, violet eyes, forehead mark, very long black hair, slim body, black and magenta robe palette, gold chains, tassels, belt jewelry, sleeve trim, eye shaped jewels, ornate boots, and restrained living shadow. The confused pose remains readable with one hand open near the chest jewelry, the other hand raised outward in a gentle pause gesture, shoulders slightly drawn in, uncertain violet eyes, and mouth slightly parted. It simplifies some robe ornament density compared with the broken source, but keeps the outfit language and supernatural hook close enough for human approval review. No text, logo, frame, scenery, cropped feet, changed species, or obvious redesign was found.
Human approval: Approved by user on 2026-05-10 with "approved".
Source replaced: Yes, copied approved candidate to assets-source/portraits/vhool/portrait-confused.png. SHA256 after replacement was 0043E3E57C9FABDE3367A0B2AB607AF0925E8EAA21EB277244EC8C1FED7316BB, matching the review candidate.
Single-file cutout command: vp run portrait:cutout --input assets-source/portraits/vhool/portrait-confused.png --output public/assets/portraits/vhool/portrait-confused.png --overwrite
Cutout inspection: public/assets/portraits/vhool/portrait-confused.png regenerated at 887x1774 RGBA. Transparent corners are clean. Alpha edge preserves hair, shadow curls, robe edges, sleeves, hands, boots, jewelry, tassels, and thin hanging ornaments. No obvious white halo was found in image inspection.
Sizing audit result: Runtime cutout is 887x1774, aspect 0.500, visible alpha about 751x1700, displayed visible height 491px in a 256x520 standee audit frame. This is in the good reference band beside approved Vhool neutral at 496px, approved Vhool flirty at 502px, Gideon Glass at 494px, Meridian Vale at 504px, and Opal Sunday at 475px. Existing Vhool angry remains unchanged and is next.
Playwright standee check: Passed on http://localhost:5173/playground at 1920x1080. Date reactions stage loaded Vhool confused from /assets/portraits/vhool/portrait-confused.png with natural size 887x1774, object-fit contain, object-position 50% 100%, and opacity 1. Screenshot saved to playwright/screenshots/vhool-confused-standee-stage.png. Image metrics saved to playwright/logs/vhool-confused-standee-image-metrics.json.
Fixture metadata changed: No.
Verification commands: vp install; vp run portrait:cutout --input assets-source/portraits/vhool/portrait-confused.png --output public/assets/portraits/vhool/portrait-confused.png --overwrite; vp check; sizing audit script for public/assets/portraits/vhool/portrait-confused.png and good reference portraits; Playwright date reactions stage screenshot and image metrics at 1920x1080.
Final status: complete
```

### Vhool Angry Portrait Transaction

```text
Asset: assets-source/portraits/vhool/portrait-angry.png
Source reference opened: Yes, opened assets-source/portraits/vhool/portrait-angry.png
Runtime cutout opened: Yes, opened public/assets/portraits/vhool/portrait-angry.png
Good sibling or scale reference opened: Yes, opened approved assets-source/portraits/vhool/portrait.png and assets-source/portraits/vhool/portrait-confused.png, and checked public/assets/portraits/gideon-glass/portrait.png and approved Vhool variant sizing as tall references
Reference analysis note: Vhool must remain the same elegant ancient eldritch god as the approved neutral, flirty, and confused sources, with pale skin, bright violet eyes, a small violet forehead mark, very long obsidian hair falling over one eye, slim elegant body, black and magenta ceremonial robes, gold chains, tassels, belt jewelry, sleeve trim, robe ornaments, ornate boots, many violet and magenta eye shaped jewels, and living black shadow around the hair, shoulders, robe gaps, and sleeve folds. The angry variant is a boundary-state true identity leak: cold wounded anger, controlled disgust, squared shoulders, face partly crossed by deep shadow, intense violet eyes, mouth barely open with restrained tension, one hand drawn inward near the chest jewelry, the other hanging low with tense precise fingers, multiple shadow tendrils and violet eyes behind the head and around the hairline, plus small sharp teeth and dark mouth shapes visible through robe gaps. The current 1024x1536 canvas is too wide for the standee. The runtime cutout visible area is about 852x1518, but object contain hits the width cap and displays at about 380px in the 256x520 audit frame. Approved Vhool neutral displays at about 496px, flirty at about 502px, confused at about 491px, and Gideon Glass at about 494px. Target output is 887x1774 on a plain white opaque background, full body visible from head to feet, with the same angry pose intent and no redesign.
Candidate path: First candidate generated at assets-source/portraits/vhool/review/portrait-angry-candidate-2026-05-10.png, then rejected and removed before approval. Second candidate generated at assets-source/portraits/vhool/review/portrait-angry-candidate-2-2026-05-10.png, then approved and retained as assets-source/portraits/vhool/portrait-angry.png. The duplicate review file was removed after source replacement.
Candidate comparison note: First candidate was exactly 887x1774 and passed sizing at about 504px displayed visible height, but it lost too much of the upper shadow-eye aura, simplified the robe ornament density, changed the lower silhouette, and hid too much of the two-boot stance. Rejected for identity and supernatural-hook drift. Second candidate is exactly 887x1774 RGB with an approximate foreground area of about 823x1749 and displayed visible height of 505px in the 256x520 standee frame. It preserves Vhool's pale face, intense violet eyes, forehead mark, very long black hair, slim body, black and magenta robe palette, gold chains, tassels, belt jewelry, sleeve trim, eye shaped jewels, ornate boots, cold angry inward-hand pose, lowered tense hand, and the living black shadow hook with many upper tendrils, violet eyes, and dark mouth shapes in robe gaps. The lower stance is slightly more robe-covered than the broken source, but both legs and ornate footwear remain readable enough for approval review. No text, logo, frame, scenery, changed species, exposed organs, blood, gore, or obvious redesign was found.
Human approval: Approved by user on 2026-05-10 with "approved".
Source replaced: Yes, copied approved candidate to assets-source/portraits/vhool/portrait-angry.png. SHA256 after replacement was 6A1559BD8D60B10CF00F873A8569EE05428991E2D5328328FEA60E130729CB82, matching the review candidate.
Single-file cutout command: vp run portrait:cutout --input assets-source/portraits/vhool/portrait-angry.png --output public/assets/portraits/vhool/portrait-angry.png --overwrite
Cutout inspection: public/assets/portraits/vhool/portrait-angry.png regenerated at 887x1774 RGBA. Transparent corners are clean. Alpha edge preserves hair strands, shadow tendrils, upper shadow eyes, robe holes, sleeves, hands, boots, jewelry, tassels, and thin hanging ornaments. No obvious white halo was found in image inspection.
Sizing audit result: Runtime cutout is 887x1774, aspect 0.500, visible alpha about 822x1752, displayed visible height 506px in a 256x520 standee audit frame. This is in the good reference band beside approved Vhool neutral at 496px, approved Vhool flirty at 502px, approved Vhool confused at 491px, Gideon Glass at 494px, Meridian Vale at 504px, and Opal Sunday at 475px.
Playwright standee check: Passed on http://localhost:5173/playground at 1920x1080. Date reactions stage loaded Vhool angry from /assets/portraits/vhool/portrait-angry.png with natural size 887x1774, object-fit contain, object-position 50% 100%, and opacity 1. Screenshot saved to playwright/screenshots/vhool-angry-standee-stage.png. Image metrics saved to playwright/logs/vhool-angry-standee-image-metrics.json.
Fixture metadata changed: No.
Verification commands: image generation with the displayed angry source as strict reference; vp run portrait:cutout --input assets-source/portraits/vhool/portrait-angry.png --output public/assets/portraits/vhool/portrait-angry.png --overwrite; sizing audit script for public/assets/portraits/vhool/portrait-angry.png and good reference portraits; Playwright date reactions stage screenshot and image metrics at 1920x1080.
Final status: complete
```

### Vhool Batch Closeout

```text
Character: Vhool
Batch assets: portrait.png, portrait-flirty.png, portrait-confused.png, portrait-angry.png
Completed asset transaction logs: Vhool neutral portrait transaction; Vhool flirty portrait transaction; Vhool confused portrait transaction; Vhool angry portrait transaction
Known-good sibling variants checked: All four Vhool runtime full-body variants were checked after the angry cutout. They are all 887x1774 with standee-safe audit heights: neutral 496px, flirty 502px, confused 491px, angry 506px.
All variant scale comparison: Vhool variants now sit in the same scale band as Gideon Glass at 494px, Meridian Vale at 504px, and Opal Sunday at 475px. Angry is the tallest Vhool variant, but the larger shadow silhouette is intentional for the boundary-state pose and remains consistent in the standee.
Date reactions playground screenshot or notes: Neutral passed with playwright/screenshots/vhool-neutral-standee-stage.png. Flirty was manually verified by the user on 2026-05-09 because the shared Playwright browser was occupied. Confused passed with playwright/screenshots/vhool-confused-standee-stage.png. Angry passed with playwright/screenshots/vhool-angry-standee-stage.png.
Remaining issues: None for Vhool standee sizing. assets-source/portraits/vhool/review/portrait-flirty-candidate-2-2026-05-09.png remains as pre-existing review residue from the earlier approved flirty transaction and was not touched in this closeout.
Verification commands: vp install; vp run portrait:cutout single-file commands for each approved Vhool replacement as logged above; vp check; Playwright date reactions stage checks for neutral, confused, and angry at 1920x1080; sizing audit script for Vhool and good reference portraits.
Batch status: complete
```

### Mr Whiskers Neutral Portrait Transaction

```text
Asset: assets-source/portraits/mr-whiskers/portrait.png
Source reference opened: Yes, opened assets-source/portraits/mr-whiskers/portrait.png
Runtime cutout opened: Yes, opened public/assets/portraits/mr-whiskers/portrait.png
Good sibling or scale reference opened: Yes, opened approved public/assets/portraits/vhool/portrait.png and public/assets/portraits/gideon-glass/portrait.png as tall references
Reference analysis note: Mr Whiskers must remain the same dignified grey tabby cat in an oversized cream double breasted trench coat, with yellow irritated eyes, tabby face markings, small front paws resting at the upturned collar, white dress shirt and burgundy tie visible at the collar, pocket square, gold chain, belted waist, long empty coat sleeves with hollow cuffs, brown trousers, and brown leather shoes. The neutral state is controlled irritated executive composure, not cute, silly, or feral. The pose intent is a centered dating profile full body stance with the coat hanging like an empty human executive body. The current 1024x1536 canvas is too wide for the standee. The runtime cutout visible area is about 549x1417, but object contain hits the width cap and displays at about 354px in the 256x520 audit frame. Approved Vhool neutral displays at about 496px, Gideon Glass at about 494px, Meridian Vale at about 504px, and Opal Sunday at about 475px. Target output is 887x1774 on a plain white opaque background, full body visible from cat ears to shoes, with the same character geometry and no redesign.
Candidate path: Generated at assets-source/portraits/mr-whiskers/review/portrait-candidate-2026-05-10.png, then approved and retained as assets-source/portraits/mr-whiskers/portrait.png. The duplicate review file was removed after source replacement.
Candidate comparison note: Candidate is exactly 887x1774 RGB with an approximate foreground area of about 660x1695 and displayed visible height of 489px in the 256x520 standee frame. It preserves Mr Whiskers as a dignified grey tabby cat with narrowed yellow eyes, tabby face markings, small front paws resting at the upturned collar, oversized cream double breasted trench coat, white shirt, burgundy tie, pocket square, gold chain, belt, long empty sleeves with hollow cuffs, brown trousers, and brown leather shoes. The trench is slightly cleaner and taller in the lower body than the broken source, but the businesslike cat-in-a-coat silhouette, neutral irritated expression, and full-body stance remain close enough for human approval review. No text, logo, frame, scenery, human head, human hands, sleeve paws, extra limbs, cropped ears, cropped shoes, or cute mascot redesign was found.
Human approval: Approved by user on 2026-05-10 with "approved".
Source replaced: Yes, copied approved candidate to assets-source/portraits/mr-whiskers/portrait.png. SHA256 after replacement was B8B763C8CF62E3C2998A5B613B2334D0B0F7CF950FF79C984093FFCCC1098FFB, matching the review candidate.
Single-file cutout command: vp run portrait:cutout --input assets-source/portraits/mr-whiskers/portrait.png --output public/assets/portraits/mr-whiskers/portrait.png --overwrite
Cutout inspection: public/assets/portraits/mr-whiskers/portrait.png regenerated at 887x1774 RGBA. Transparent corners are clean. Alpha edge preserves cat ears, tabby fur, collar paws, trench edges, hollow cuffs, belt, trouser cuffs, and shoe highlights. No obvious white halo was found in image inspection.
Sizing audit result: Runtime cutout is 887x1774, aspect 0.500, visible alpha about 660x1696, displayed visible height 489px in a 256x520 standee audit frame. This is in the good reference band beside approved Vhool neutral at 496px, Vhool angry at 506px, Gideon Glass at 494px, Meridian Vale at 504px, and Opal Sunday at 475px.
Playwright standee check: Passed on http://localhost:5173/playground at 1920x1080. Date reactions stage loaded Mr Whiskers neutral from /assets/portraits/mr-whiskers/portrait.png with natural size 887x1774, object-fit contain, object-position 50% 100%, and opacity 1. Screenshot saved to playwright/screenshots/mr-whiskers-neutral-standee-stage.png. Image metrics saved to playwright/logs/mr-whiskers-neutral-standee-image-metrics.json.
Fixture metadata changed: No.
Verification commands: image generation with the displayed Mr Whiskers neutral source as strict reference; vp run portrait:cutout --input assets-source/portraits/mr-whiskers/portrait.png --output public/assets/portraits/mr-whiskers/portrait.png --overwrite; sizing audit script for public/assets/portraits/mr-whiskers/portrait.png and good reference portraits; Playwright date reactions stage screenshot and image metrics at 1920x1080.
Final status: complete
```

### Mr Whiskers Flirty Portrait Transaction

```text
Asset: assets-source/portraits/mr-whiskers/portrait-flirty.png
Source reference opened: Yes, opened assets-source/portraits/mr-whiskers/portrait-flirty.png
Runtime cutout opened: Yes, opened public/assets/portraits/mr-whiskers/portrait-flirty.png
Good sibling or scale reference opened: Yes, opened approved assets-source/portraits/mr-whiskers/portrait.png and checked public/assets/portraits/gideon-glass/portrait.png as a tall reference
Reference analysis note: Mr Whiskers must remain the same dignified grey tabby cat in an oversized cream double breasted trench coat, with narrowed yellow eyes, tabby face markings, upturned trench collar, white dress shirt and burgundy tie visible at the collar, pocket square, gold chain, belted waist, long empty coat sleeves with hollow cuffs, brown trousers, and brown leather shoes. The flirty variant state is restrained pleading cute cat expression filtered through business irritation: one small paw raised near the mouth with tongue touching it, the other small paw resting near the lapel, softened yellow eyes, and the same formal coat-body stance. It must not become a cute mascot or expose paws from sleeves. The current 1024x1536 canvas is too wide for the standee. The runtime cutout visible area is about 588x1492, but object contain hits the width cap and displays at about 373px in the 256x520 audit frame. Approved Mr Whiskers neutral displays at about 489px, Gideon Glass at about 494px, and Meridian Vale at about 504px. Target output is 887x1774 on a plain white opaque background, full body visible from cat ears to shoes, with the same flirty pose intent and no redesign.
Candidate path: Generated at assets-source/portraits/mr-whiskers/review/portrait-flirty-candidate-2026-05-10.png, then approved and retained as assets-source/portraits/mr-whiskers/portrait-flirty.png. The duplicate review file was removed after source replacement.
Candidate comparison note: Candidate is exactly 887x1774 RGB with an approximate foreground area of about 615x1680 and displayed visible height of 485px in the 256x520 standee frame. It preserves Mr Whiskers as a grey tabby cat with yellow eyes, tabby face markings, one paw raised near the mouth with tongue touching it, the other paw resting on the collar, oversized cream trench coat, white shirt, burgundy tie, pocket square, gold chain, belt, long empty sleeves with hollow cuffs, brown trousers, and brown leather shoes. The lower coat is cleaner and more vertical than the broken source, but the restrained flirty cat-in-a-coat pose and formal stance remain close enough for human approval review. No text, logo, frame, scenery, human head, human hands, sleeve paws, extra limbs, cropped ears, cropped shoes, exposed anatomy, or cute mascot redesign was found.
Human approval: Approved by user on 2026-05-10 with "approved".
Source replaced: Yes, copied approved candidate to assets-source/portraits/mr-whiskers/portrait-flirty.png. SHA256 after replacement was C4CF4246EB5AB31B875A2354A8F824F2FB8F5DB7A718D3E8F767A407B26041B5, matching the review candidate.
Single-file cutout command: vp run portrait:cutout --input assets-source/portraits/mr-whiskers/portrait-flirty.png --output public/assets/portraits/mr-whiskers/portrait-flirty.png --overwrite
Cutout inspection: public/assets/portraits/mr-whiskers/portrait-flirty.png regenerated at 887x1774 RGBA. Transparent corners are clean. Alpha edge preserves cat ears, whiskers, tongue, raised paw, collar paw, coat edges, tie, chain, hollow cuffs, trousers, and shoes. No obvious white halo was found in image inspection.
Sizing audit result: Runtime cutout is 887x1774, aspect 0.500, alpha bounds 136,54,750,1731, alpha size 615x1678, displayed visible height 484px in a 256x520 standee frame. This matches approved Mr Whiskers neutral at 489px and tall references Gideon Glass at 494px and Meridian Vale at 504px.
Playwright standee check: Passed on http://localhost:5173/playground at 1920x1080. Date reactions stage loaded Mr Whiskers flirty from /assets/portraits/mr-whiskers/portrait-flirty.png with natural size 887x1774, object-fit contain, object-position 50% 100%, and opacity 1. Screenshot saved to playwright/screenshots/mr-whiskers-flirty-standee-stage.png. Image metrics saved to playwright/logs/mr-whiskers-flirty-standee-image-metrics.json.
Fixture metadata changed: No.
Verification commands: image generation with the displayed Mr Whiskers flirty source as strict reference; vp run portrait:cutout --input assets-source/portraits/mr-whiskers/portrait-flirty.png --output public/assets/portraits/mr-whiskers/portrait-flirty.png --overwrite; sizing audit script for public/assets/portraits/mr-whiskers/portrait-flirty.png and good scale references; Playwright date reactions stage screenshot and image metrics at 1920x1080.
Final status: complete
```

### Mr Whiskers Confused Portrait Transaction

```text
Asset: assets-source/portraits/mr-whiskers/portrait-confused.png
Source reference opened: Yes, opened assets-source/portraits/mr-whiskers/portrait-confused.png
Runtime cutout opened: Yes, opened public/assets/portraits/mr-whiskers/portrait-confused.png
Good sibling or scale reference opened: Yes, opened approved assets-source/portraits/mr-whiskers/portrait.png and assets-source/portraits/mr-whiskers/portrait-flirty.png, and checked public/assets/portraits/gideon-glass/portrait.png as a tall reference
Reference analysis note: Mr Whiskers must remain the same dignified grey tabby cat in an oversized cream double breasted trench coat, with narrowed yellow eyes, tabby face markings, upturned trench collar, white dress shirt and burgundy tie visible at the collar, pocket square, gold chain, belted waist, long empty coat sleeves with hollow cuffs, brown trousers, and brown leather shoes. The confused variant state is head tilted in controlled confused irritation, one small front paw from the collar opening scratching the ear, the other small front paw resting near the opposite lapel, narrowed yellow eyes, and dry offended disbelief. It must not become a cute mascot, human hybrid, sleeve-paw pose, or casual redesign. The current 1024x1536 canvas is too wide for the standee. The runtime cutout visible area is about 570x1497, but object contain hits the width cap and displays at about 374px in the 256x520 audit frame. Approved Mr Whiskers neutral displays at about 489px, Mr Whiskers flirty at about 484px, and Gideon Glass at about 494px. Target output is 887x1774 on a plain white opaque background, full body visible from cat ears to shoes, with the same confused pose intent and no redesign.
Candidate path: First generated candidate was copied to assets-source/portraits/mr-whiskers/review/portrait-confused-candidate-2026-05-10.png, then rejected and removed before approval because it bent a coat sleeve into a sleeve arm. Second generated candidate used the same review path, then was rejected by the user on 2026-05-10 because the paws still looked broken and needed to come from under the collar, even if the tie and collar must loosen. The duplicate review file was removed. Approved candidate was a deterministic tall recanvas of the existing source at assets-source/portraits/mr-whiskers/review/portrait-confused-recanvas-candidate-2026-05-10.png, copied to source, then removed from review after source replacement.
Candidate comparison note: Approved recanvas candidate is exactly 887x1774 RGB with an approximate foreground area of about 658x1730 and displayed visible height of 499px in the 256x520 standee frame. It preserves the original approved-confused anatomy relationship better than the redraws: both small cat paws come from the collar area, the scratching paw sits beside the ear, the opposite paw rests at the lapel, and both long sleeves remain empty and hanging. It preserves Mr Whiskers as a grey tabby cat with yellow eyes, tabby face markings, oversized cream trench coat, white shirt, burgundy tie, pocket square, gold chain, belt, hollow cuffs, brown trousers, and brown leather shoes. The candidate is a uniform scale and center crop of the existing source, so identity and pose drift are minimal. No text, logo, frame, scenery, human head, human hands, sleeve paws, extra limbs, cropped ears, cropped shoes, exposed anatomy, or cute mascot redesign was found.
Human approval: Approved by user on 2026-05-10 with "approved".
Source replaced: Yes, copied approved candidate to assets-source/portraits/mr-whiskers/portrait-confused.png. SHA256 after replacement was B37926549101520D29F7AE8D1DEFFE57E2F2198F5A6D17DF417D41466C83EF96, matching the review candidate.
Single-file cutout command: vp run portrait:cutout --input assets-source/portraits/mr-whiskers/portrait-confused.png --output public/assets/portraits/mr-whiskers/portrait-confused.png --overwrite
Cutout inspection: public/assets/portraits/mr-whiskers/portrait-confused.png regenerated at 887x1774 RGBA. Transparent corners are clean. Alpha edge preserves cat ears, tabby fur, whiskers, collar paws, scratching paw, trench edges, tie, chain, hollow cuffs, trousers, and shoes. No obvious white halo was found in image inspection.
Sizing audit result: Runtime cutout is 887x1774, aspect 0.500, alpha bounds 131,17,788,1744, alpha size 658x1728, displayed visible height 499px in a 256x520 standee frame. This matches approved Mr Whiskers neutral at 489px, approved Mr Whiskers flirty at 484px, Gideon Glass at 494px, Meridian Vale at 504px, and Opal Sunday at 475px.
Playwright standee check: Not run because http://localhost:5173/playground was unavailable on 2026-05-10, the connection was refused. The row used source approval, runtime cutout inspection, and sizing audit verification instead. The dev server was not started under this repo's Playwright rules.
Fixture metadata changed: No.
Verification commands: vp install; source and runtime visual inspection; image generation with the displayed Mr Whiskers confused source and approved neutral/flirty sources as references for rejected generated candidates; deterministic tall recanvas from existing 1024x1536 source to 887x1774 review candidate; source candidate sizing audit; vp run portrait:cutout --input assets-source/portraits/mr-whiskers/portrait-confused.png --output public/assets/portraits/mr-whiskers/portrait-confused.png --overwrite; runtime cutout inspection; sizing audit script for public/assets/portraits/mr-whiskers/portrait-confused.png and good scale references; local app availability check for http://localhost:5173/playground.
Final status: complete
```

### Mr Whiskers Angry Portrait Transaction

```text
Asset: assets-source/portraits/mr-whiskers/portrait-angry.png
Source reference opened: Yes, opened assets-source/portraits/mr-whiskers/portrait-angry.png
Runtime cutout opened: Yes, opened public/assets/portraits/mr-whiskers/portrait-angry.png
Good sibling or scale reference opened: Yes, opened approved public/assets/portraits/mr-whiskers/portrait.png, public/assets/portraits/mr-whiskers/portrait-flirty.png, public/assets/portraits/mr-whiskers/portrait-confused.png, and public/assets/portraits/gideon-glass/portrait.png as tall references
Reference analysis note: Mr Whiskers must remain the same dignified grey tabby cat in an oversized cream double breasted trench coat, with sharp yellow eyes, tabby face markings, open hissing mouth with teeth, two raised front paws emerging from the torn collar area, shredded shirt and collar edges, white dress shirt, burgundy tie, pocket square, gold chain, belted waist, long empty coat sleeves with hollow cuffs, brown trousers, and brown leather shoes. The angry variant state is an offended boundary reaction: raised paws, claws visible, ears tense, mouth open, and coat-body stance still formal underneath the torn collar. It must not become a cute mascot, human hybrid, sleeve-paw pose, or casual redesign. The current 1024x1536 canvas is too wide for the standee. The runtime cutout visible area is about 560x1455, but object contain hits the width cap and displays at about 364px in the 256x520 audit frame. Approved Mr Whiskers neutral displays at about 489px, flirty at about 484px, confused at about 499px, and Gideon Glass at about 494px. Target output is 887x1774 on a plain white opaque background, full body visible from raised paws and ears to shoes, with the same angry pose intent and no redesign.
Candidate path: Current review candidate is a deterministic tall recanvas of the existing source at assets-source/portraits/mr-whiskers/review/portrait-angry-recanvas-candidate-2026-05-10.png.
Candidate comparison note: Current recanvas candidate is exactly 887x1774 RGB with an approximate foreground area of about 664x1731 and displayed visible height of 500px in the 256x520 standee frame. It preserves Mr Whiskers as a grey tabby cat with sharp yellow eyes, tabby face markings, open hissing mouth, raised front paws and claws from the torn collar area, oversized cream trench coat, torn white shirt collar, burgundy tie, pocket square, gold chain, belt, hollow cuffs, brown trousers, and brown leather shoes. The candidate is a uniform scale and center crop of the existing source, so identity, expression, and pose drift are minimal. No text, logo, frame, scenery, human head, human hands, sleeve paws, extra limbs, cropped ears, cropped raised paws, cropped shoes, exposed anatomy, or cute mascot redesign was found.
Human approval: Pending for current recanvas candidate.
Source replaced: No.
Single-file cutout command: Not run. Waiting for human approval before source replacement and background removal.
Cutout inspection: Not started.
Sizing audit result: Source candidate pre-cutout audit only: 887x1774, aspect 0.500, approximate foreground bounds 111,20,774,1750, approximate foreground size 664x1731, displayed visible height 500px in a 256x520 standee frame. Runtime cutout has not been regenerated yet.
Playwright standee check: Not started. Waiting for approval, source replacement, and cutout.
Fixture metadata changed: No.
Verification commands: source and runtime visual inspection; deterministic tall recanvas from existing 1024x1536 source to 887x1774 review candidate; source candidate sizing audit for assets-source/portraits/mr-whiskers/review/portrait-angry-recanvas-candidate-2026-05-10.png and current source.
Final status: blocked pending human approval
```

## Per-Asset Workflow

Use this workflow for one row in the current character batch. Do not start the next row until the current row reaches `Final status: complete` in its transaction log. Do not start another character batch until the current batch reaches `Batch status: complete` in its closeout.

### 1. Open The Broken Reference

Open the listed `assets-source/portraits/<member-id>/<variant>.png` first. Also open the current runtime cutout in `public/assets/portraits/<member-id>/<variant>.png` to understand how it is failing in the standee.

For members with a good sibling variant, open that too. Example: Eleanor's `portrait-confused.png` is a scale reference for her broken neutral, flirty, and angry variants.

For members without a good sibling variant, open one or more good reference portraits from this plan: Meridian Vale, Opal Sunday, or Gideon Glass.

Before generating anything, write a short analysis note covering:

- identity invariants: face shape, hair, eyes, skin tone, body type, outfit, colors, accessories, and props
- supernatural or non-human visual hooks that must survive
- variant state: neutral, flirty, confused, or angry
- pose and silhouette intent
- what is wrong with the current canvas or scale
- target output: `887x1774`, plain white opaque background, full body visible

### 2. Generate A Corrected Source Candidate

Generate from the broken source image as the primary reference. The prompt must say that the output is the same character and same variant, not a redesign.

Required prompt constraints:

```text
Use the attached image as the strict character reference.
Create the same character, same outfit, same face, same hair, same color palette, same accessories, same carried props, same supernatural visual hook, and same variant expression.
Correct only the composition and canvas shape.
Final image: full-body character portrait, complete head to feet, centered, tall portrait canvas, 887x1774, plain white opaque background.
No text, no logo, no frame, no scenery, no new outfit, no new accessories, no changed face, no changed body type, no changed species, no cropped feet.
```

Save candidates somewhere reviewable without replacing the approved source path. A temporary candidate location under `assets-source/portraits/<member-id>/review/` is acceptable during the work, but rejected candidates should not be included in the final handoff.

### 3. Analyze The Candidate Against The Reference

After every generation, inspect the candidate beside the broken source. The agent must write a comparison note before accepting or rejecting it.

Accept only if all checks pass:

- same identity and face read
- same hairstyle and hair color
- same outfit structure, palette, jewelry, trim, props, and footwear
- same supernatural hook
- same variant expression and body language intent
- full body visible from head to feet
- plain white opaque background
- no text, logos, frame, scenery, extra props, or accidental redesign
- final committed source canvas is exactly `887x1774`; if the generator returns a nearby tall image, crop or pad without stretching the character
- character will display near the good reference scale in the `256x520` standee audit frame

Reject and regenerate if any of these fail. Do not try to rescue a mismatched identity with background removal or fixture wiring.

### 4. Replace The Source Only After Match Approval

Once a candidate passes visual comparison and receives required human approval, replace the listed source file under:

```text
assets-source/portraits/<member-id>/<variant>.png
```

If the fixture prompt no longer describes the approved source image, update only that asset's prompt metadata in the matching member fixture.

### 5. Remove Background

Run background removal only after the approved source has replaced the source file:

```sh
vp run portrait:cutout --input assets-source/portraits/<member-id>/<variant>.png --output public/assets/portraits/<member-id>/<variant>.png --overwrite
```

Use the single-file command above for this plan. The cutout script accepts a source image file and an output image file, so there is no need to regenerate a whole member folder while fixing one variant.

### 6. Verify The Cutout

Inspect the regenerated runtime cutout:

```text
public/assets/portraits/<member-id>/<variant>.png
```

Accept only if:

- the alpha edge is clean, with no white halo or missing hair, ribbons, ears, tails, robes, or thin props
- the transparent bounds use most of the tall canvas height
- the cutout still matches the approved source
- the standee audit reports the target aspect band and acceptable displayed visible height

After the cutout passes, compare the member's known-good sibling variants if any exist. They should be unchanged, because the single-file cutout command should only touch the current variant.

### 7. Wire And Validate

The fixture path usually does not change because source and runtime filenames stay the same. Wiring means the approved source and regenerated public cutout are both present at the existing paths.

If any path, filename, or prompt metadata changes, update the matching fixture. Then run:

```sh
vp check
```

If runtime code, fixture contracts, UI behavior, or player-facing workflows changed, also run:

```sh
vp test
vp build
```

For this plan, do not block completion on Playwright if the shared browser is occupied. Use the sizing audit and user manual standee verification in the running app. If Playwright is available and the user asks for it, use the date reactions playground at `1920x1080`. The dev server must already be running at `http://localhost:5173/` before any Playwright work.

## Audit Method

Scan all shipped full-body runtime assets matching:

```text
public/assets/portraits/*/portrait*.png
```

For each image, measure:

- canvas width and height
- canvas aspect
- nontransparent alpha bounds
- displayed alpha height in a `256x520` standee frame using the same `object-contain` behavior as the UI

Assets below are listed at file level because one member can have both good and bad variants. Eleanor is the current example: `portrait-confused.png` is already in the tall family, while neutral, flirty, and angry are not.

## Clear Redo Assets

These are visibly in the wrong canvas family or have the same width-limited behavior as Vhool and Mr Whiskers.

| Member        | Variant                 | Canvas      | Aspect  | Visible alpha | Audit displayed visible height | Redo source                                                 | Regenerated runtime cutout                                  |
| ------------- | ----------------------- | ----------- | ------- | ------------- | ------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `eleanor-ash` | `portrait.png`          | `1024x1536` | `0.667` | `660x1489`    | `372px`                        | `assets-source/portraits/eleanor-ash/portrait.png`          | `public/assets/portraits/eleanor-ash/portrait.png`          |
| `eleanor-ash` | `portrait-flirty.png`   | `1024x1536` | `0.667` | `882x1458`    | `364px`                        | `assets-source/portraits/eleanor-ash/portrait-flirty.png`   | `public/assets/portraits/eleanor-ash/portrait-flirty.png`   |
| `eleanor-ash` | `portrait-angry.png`    | `1024x1536` | `0.667` | `859x1454`    | `364px`                        | `assets-source/portraits/eleanor-ash/portrait-angry.png`    | `public/assets/portraits/eleanor-ash/portrait-angry.png`    |
| `mira-park`   | `portrait.png`          | `977x1609`  | `0.607` | `488x1545`    | `405px`                        | `assets-source/portraits/mira-park/portrait.png`            | `public/assets/portraits/mira-park/portrait.png`            |
| `mira-park`   | `portrait-flirty.png`   | `977x1610`  | `0.607` | `694x1521`    | `399px`                        | `assets-source/portraits/mira-park/portrait-flirty.png`     | `public/assets/portraits/mira-park/portrait-flirty.png`     |
| `mira-park`   | `portrait-confused.png` | `977x1610`  | `0.607` | `670x1496`    | `392px`                        | `assets-source/portraits/mira-park/portrait-confused.png`   | `public/assets/portraits/mira-park/portrait-confused.png`   |
| `mira-park`   | `portrait-angry.png`    | `977x1610`  | `0.607` | `490x1557`    | `408px`                        | `assets-source/portraits/mira-park/portrait-angry.png`      | `public/assets/portraits/mira-park/portrait-angry.png`      |
| `mr-whiskers` | `portrait.png`          | `1024x1536` | `0.667` | `550x1423`    | `356px`                        | `assets-source/portraits/mr-whiskers/portrait.png`          | `public/assets/portraits/mr-whiskers/portrait.png`          |
| `mr-whiskers` | `portrait-flirty.png`   | `1024x1536` | `0.667` | `590x1497`    | `374px`                        | `assets-source/portraits/mr-whiskers/portrait-flirty.png`   | `public/assets/portraits/mr-whiskers/portrait-flirty.png`   |
| `mr-whiskers` | `portrait-confused.png` | `1024x1536` | `0.667` | `571x1502`    | `376px`                        | `assets-source/portraits/mr-whiskers/portrait-confused.png` | `public/assets/portraits/mr-whiskers/portrait-confused.png` |
| `mr-whiskers` | `portrait-angry.png`    | `1024x1536` | `0.667` | `561x1461`    | `365px`                        | `assets-source/portraits/mr-whiskers/portrait-angry.png`    | `public/assets/portraits/mr-whiskers/portrait-angry.png`    |
| `sera-vohn`   | `portrait.png`          | `1024x1536` | `0.667` | `502x1490`    | `372px`                        | `assets-source/portraits/sera-vohn/portrait.png`            | `public/assets/portraits/sera-vohn/portrait.png`            |
| `vhool`       | `portrait.png`          | `1024x1536` | `0.667` | `708x1515`    | `379px`                        | `assets-source/portraits/vhool/portrait.png`                | `public/assets/portraits/vhool/portrait.png`                |
| `vhool`       | `portrait-flirty.png`   | `1024x1536` | `0.667` | `966x1515`    | `379px`                        | `assets-source/portraits/vhool/portrait-flirty.png`         | `public/assets/portraits/vhool/portrait-flirty.png`         |
| `vhool`       | `portrait-confused.png` | `1024x1536` | `0.667` | `741x1506`    | `376px`                        | `assets-source/portraits/vhool/portrait-confused.png`       | `public/assets/portraits/vhool/portrait-confused.png`       |
| `vhool`       | `portrait-angry.png`    | `1024x1536` | `0.667` | `853x1519`    | `380px`                        | `assets-source/portraits/vhool/portrait-angry.png`          | `public/assets/portraits/vhool/portrait-angry.png`          |

## Borderline Redo Assets

These are not as severe as the `1024x1536` set, but they sit outside the good reference band and are likely to look undersized beside Meridian, Opal, Gideon, Jenna, Venus, Bai Wenshu, and similar portraits. Redo them in the same pass unless a human review decides the current pose scale is intentional.

| Member        | Variant                 | Canvas     | Aspect  | Visible alpha | Audit displayed visible height | Redo source                                                 | Regenerated runtime cutout                                  |
| ------------- | ----------------------- | ---------- | ------- | ------------- | ------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `kade-sumner` | `portrait-confused.png` | `941x1672` | `0.563` | `909x1568`    | `427px`                        | `assets-source/portraits/kade-sumner/portrait-confused.png` | `public/assets/portraits/kade-sumner/portrait-confused.png` |
| `toby-wenz`   | `portrait.png`          | `931x1690` | `0.551` | `502x1656`    | `455px`                        | `assets-source/portraits/toby-wenz/portrait.png`            | `public/assets/portraits/toby-wenz/portrait.png`            |
| `toby-wenz`   | `portrait-flirty.png`   | `931x1689` | `0.551` | `374x1561`    | `429px`                        | `assets-source/portraits/toby-wenz/portrait-flirty.png`     | `public/assets/portraits/toby-wenz/portrait-flirty.png`     |
| `toby-wenz`   | `portrait-confused.png` | `931x1690` | `0.551` | `441x1573`    | `433px`                        | `assets-source/portraits/toby-wenz/portrait-confused.png`   | `public/assets/portraits/toby-wenz/portrait-confused.png`   |
| `toby-wenz`   | `portrait-angry.png`    | `931x1690` | `0.551` | `401x1539`    | `423px`                        | `assets-source/portraits/toby-wenz/portrait-angry.png`      | `public/assets/portraits/toby-wenz/portrait-angry.png`      |

## Assets Checked But Not Flagged

- `eleanor-ash/portrait-confused.png` is already tall enough: `889x1770`, aspect `0.502`, audit displayed visible height `451px`.
- Meridian Vale, Opal Sunday, and Gideon Glass stay in the good reference band and should not be regenerated for this sizing issue.
- Normal pose variation, such as seated or crouched variants, can reduce visible alpha height. Those should be judged visually after the canvas aspect is confirmed to be in the tall family.

## Acceptance Checks

- The Batch Progress Ledger and Asset Progress Ledger reflect the verified current state.
- A handoff can resume from the first `ACTIVE`, `BLOCKED`, or `TODO` row without inspecting unrelated character folders.
- Each redo row has its own completed transaction log.
- Each character batch has its own completed closeout.
- No next asset starts until the previous asset is wired through `assets-source`, `public/assets/portraits`, sizing audit, and standee verification.
- No next character starts until the previous character batch is fully closed.
- Clear redo assets no longer use `1024x1536`, `977x1610`, or other wide standee-shrinking canvas shapes.
- Full-body variants for the same member feel consistent in scale.
- Vhool, Mr Whiskers, Mira Park, Eleanor Ash, and Sera Vohn no longer appear much shorter than Meridian, Opal, Gideon, Jenna, Venus, or Bai Wenshu in the date standee.
- Each accepted replacement has a written before-generation analysis note and a written candidate comparison note.
- No replacement source is accepted if it changes identity, outfit, variant expression, or supernatural hook.
- `vp check` passes after asset metadata or docs updates.
- `vp test` and `vp build` are only needed if fixture paths, runtime code, save behavior, or UI behavior change.
- Playwright artifacts are optional for this sizing pass when the shared browser is occupied. Manual user standee verification may satisfy the transaction log's standee check.
