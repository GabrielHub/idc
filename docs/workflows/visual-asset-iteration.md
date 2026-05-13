# Visual Asset Iteration Workflow

Use this workflow for member portraits, member portrait variants, avatars, and scenario backgrounds. This is separate from fixture authoring. The member or scenario content pass should already be complete enough to provide public visual facts, but it should not have generated image prompts or images.

Use an agent with image generation capability for this workflow.

## Ground Rules

- Work one subject at a time. Do not batch create members, portraits, variants, avatars, or scenario backgrounds.
- Keep each image thread clean. Do not carry failed candidates into later generations unless the user explicitly asks for that image as a reference.
- After each generated image, inspect the image and write adjustment recommendations before the next generation.
- Do not store image prompts in member fixtures, scenario fixtures, or `portraitAsset.prompt`.
- Use fixture facts as visual inputs. Do not reveal hidden member facts, future outcomes, private secrets, exact gameplay values, or unearned player knowledge in an image.
- Check final assets against `docs/product/image-style.md` before approval.

## Member Portrait Sequence

1. Start with one member only.
2. Draft a neutral full-body portrait prompt from public fixture facts and pixel-relevant details.
3. Generate one neutral full-body candidate.
4. Inspect the candidate. Check canvas ratio, complete head-to-feet framing, white background, character scale, outfit, face readability, visual hook, and fit with Aura.
5. Give adjustment recommendations. Keep the next prompt to one or two controlled changes.
6. Repeat until the neutral full-body portrait is approved.
7. Generate the avatar only after the neutral full-body portrait is approved. Attach the approved neutral full-body portrait as the character reference.
8. Inspect the avatar. Check face match, pose difference, small-card readability, white background, and absence of redesign.
9. Give adjustment recommendations and iterate until approved.

## Variant Sequence

Variants are full-body portraits only: `portrait-flirty.png`, `portrait-confused.png`, and `portrait-angry.png`.

For every variant:

1. Start from the original approved neutral full-body portrait.
2. Attach only that neutral full-body portrait unless the user provides another reference image and explicitly says to attach it.
3. Do not attach failed candidates, previous variant outputs, avatar crops, contact sheets, or a mixed image history.
4. Generate one variant candidate.
5. Inspect the candidate. Check character identity, outfit, body proportions, canvas size, pose, expression, and whether the variant differs only in expression, posture, and controlled body language.
6. Give adjustment recommendations before any next generation.
7. Repeat until approved.

The internal `angry` variant name means a negative boundary state. The art direction can be guarded, distressed, cold, irritated, concerned, or visibly angry as fits the member.

## Scenario Background Sequence

1. Start with one scenario only.
2. Draft the prompt from `publicBrief`, `card.summary`, and scene rules that are visible to both characters.
3. Generate one background candidate.
4. Inspect the candidate. Check center transcript calm, edge detail, cover-crop tolerance, Aura compatibility, no private member facts, no future event results, and no hidden outcome spoilers.
5. Give adjustment recommendations. Keep the next prompt to one or two controlled changes.
6. Repeat until approved.

## Asset Landing

Approved member source images go under:

```text
assets-source/portraits/<member-id>/
```

Approved member runtime cutouts go under:

```text
public/assets/portraits/<member-id>/
```

After source approval, run:

```powershell
vp run portrait:cutout --input assets-source/portraits/<member-id> --output public/assets/portraits/<member-id> --overwrite
vp run portrait:resize-avatars
```

Approved scenario source backgrounds go under:

```text
assets-source/scenarios/<scenario-id>/background.png
```

Approved scenario runtime backgrounds go under:

```text
public/assets/scenarios/<scenario-id>/background.webp
```

Only add a scenario id to `public/assets/scenarios/manifest.json` after the approved runtime background exists.

## Validation

Run:

```powershell
vp check
vp test
vp build
```

Use Playwright for visual validation when assets affect roster cards, member modals, date standees, scenario cards, scenario inspector, background rendering, or live date flow. The dev server must already be running at `http://localhost:5173/` before Playwright work.
