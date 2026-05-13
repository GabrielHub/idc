# Image Style And Asset Pipeline

This document owns IDC image asset style, portrait generation prompts, and the cutout pipeline. `docs/product/visual-design.md` owns the Aura interface direction and Tailwind theme tokens. Together they define how the world looks on screen.

## Portrait Style

Member portraits use a webtoon, manhwa, and manhua inspired style.

The reference direction is:

- Clean anime-webtoon, manhwa, and manhua line work
- Large expressive eyes
- Polished cel-shaded faces
- Glossy hair with strong highlight shapes
- Elegant costume silhouettes
- Soft gradient shadowing
- High color contrast on accents
- Romantic supernatural drama
- Pretty, readable, character-forward composition

Portraits should look like premium character cards adapted into clean UI cutouts. The style can be glamorous and dramatic, but portraits must still read clearly at member-card size.

## Per-Member Asset Set

Each member gets two neutral baseline images:

- **Full-body portrait**: complete character visible from head to feet. Pose reads like a polished first photo on a dating profile: relaxed, intentional, flattering, character revealing.
- **Upper-half avatar**: same character, used as a profile picture. Pose reads like a realistic profile picture: close, natural, approachable, less theatrical than the full-body.

The avatar and full-body must be visibly different poses while preserving the same character design (hair, face, eyes, color palette, outfit). The avatar is generated as a follow-up to the full-body so the full-body acts as the character anchor.

Approved exception: Junie Marrow's neutral avatar keeps Otis in the opaque background and is still referenced through the runtime avatar path. Treat it as approved avatar art, not as a failed cutout, unless visual direction changes.

Optional date-surface variants are full-body portraits only. Avatars stay neutral.

Supported variant file names:

```text
portrait-flirty.png
portrait-confused.png
portrait-angry.png
```

Members may ship with any subset of these variants. The UI falls back to `portrait.png` when a requested variant is missing or still marked `pending`.

## Portrait Canvas Contract

Full-body portraits are date standee assets, so their canvas geometry is part of the product contract, not a loose generation preference.

- Neutral full-body sources and full-body expression variant sources must be PNG files at exactly `887x1774`.
- The required full-body aspect ratio is `0.500`, matching the good standee-safe reference family.
- Full-body sources must use a plain white opaque background. Runtime cutouts must preserve the same `887x1774` canvas after background removal.
- The complete character must be visible from head to feet, centered, and large on the canvas. The visible character area should use most of the canvas height without cropped hair, feet, carried props, or supernatural silhouette details.
- In a `256x520` standee audit frame, visible character height should land near `470px` or higher unless the approved pose is intentionally seated or crouched and that exception is documented in the asset review.
- If a generation tool returns a nearby tall image, crop or pad to `887x1774` without stretching the character. Do not ship full-body portraits at `1024x1536`, square, landscape, or other wide ratios.
- Do not correct undersized standees with member-specific CSS scaling. Fix the source geometry and rerun the cutout pipeline.

## Character Height Canon

`docs/product/character-heights.md` owns character height canon, source-scale normalization, the playground Height lineup workflow, and genuine profile-height measurement.

Full-body portraits must support that workflow. A portrait that has excess transparent padding, cropped feet, an unmeasurable head, or a pose that cannot be normalized against the roster is not ready for final height review. Use the playground Height lineup view after changing height canon or portrait assets.

## Prompt Construction

Image-generation prompts belong to the independent visual asset workflow, not the member or scenario fixture workflow. Prompts are production working material and must not be stored in member fixtures, scenario fixtures, or `portraitAsset.prompt`.

Image-generation prompts in this project follow the OpenAI image prompting guidance: write in a consistent order (scene then subject then key details then constraints), use labeled segments instead of one long paragraph, and state exclusions explicitly. State what must remain invariant when iterating, so the model does not redesign the character between images.

Every IDC portrait prompt has these labeled segments:

- **Setting**: where the character is rendered. Baseline portraits always use a plain white opaque background.
- **Subject**: who the character is, in one short line.
- **Style**: the webtoon / manhwa / manhua medium and the rendering treatment.
- **Composition**: framing, viewpoint, pose intent, silhouette readability.
- **Expression**: neutral baseline, lightly pleasant.
- **Character details**: pulled from the member fixture (species or origin, age presentation, hair / face / silhouette, outfit language, personality cues, one supernatural visual hook).
- **Constraints**: explicit list of what to exclude.

Keep the character details block tight. Do not paste lore. The details that affect pixels go in; the narrative goes to the Performer at runtime, not to the image model.

### Full-Body Portrait Prompt

```text
Setting: plain white opaque background. No scenery, no floor, no shadow plane, no props beyond what the character carries.
Subject: an original character for the supernatural dating sim Interdimensional Dating Coach.
Style: webtoon, manhwa, and manhua inspired character art. Clean anime line work, expressive eyes, polished cel shading, glossy hair with strong highlight shapes, soft gradient shadowing, high color contrast on accents.
Composition: final PNG canvas must be exactly 887x1774. Full body visible from head to feet, centered with negative space on either side, eye-level framing, readable silhouette with strong separation from the background. Character should use most of the canvas height. Pose reads like a polished first photo on a dating profile: relaxed, intentional, flattering, character revealing.
Expression: neutral baseline, lightly pleasant.
Character details:
- Species or origin: <from fixture>
- Age presentation: <from fixture>
- Hair, face, silhouette: <from fixture>
- Outfit language: <from fixture>
- Personality cues: <from fixture>
- Supernatural visual hook: <from fixture>
Constraints: no text, no logos, no watermarks, no frames, no UI, no scenery, no cropped feet. Do not copy any existing reference character, outfit, pose, or composition. Avoid photorealism, western comic rendering, chibi proportions, oil-paint texture, sketchy unfinished line work, and busy illustrated backgrounds.
```

### Avatar Prompt

Generate the avatar after the full-body portrait, with the full-body image attached as a character reference. Repeat the preservation list every time so drift stays low.

```text
Setting: plain white opaque background. No scenery, no floor, no shadow plane, no props beyond what the character carries.
Subject: the same character as the attached full-body portrait, rendered as a profile picture avatar.
Style: webtoon, manhwa, and manhua inspired character art. Clean anime line work, expressive eyes, polished cel shading, glossy hair with strong highlight shapes, soft gradient shadowing. Match the established character design.
Composition: upper-half framing from roughly the chest up, centered, eye-level, readable silhouette with strong separation from the background. Pose reads like a realistic profile picture: close, natural, approachable, less theatrical than the full-body.
Expression: neutral baseline, lightly pleasant.
Character preservation: same facial features, hair shape and color, eye color, skin tone, color palette, and outfit as the full-body portrait. Visibly different pose from the full-body. Do not redesign the character.
Constraints: no text, no logos, no watermarks, no frames, no UI, no scenery, no flat corporate avatar look, no cropped face without usable shoulders. Avoid photorealism, western comic rendering, chibi proportions, oil-paint texture, sketchy unfinished line work, and busy illustrated backgrounds.
```

### Filling The Character Details Block

Pull the six details directly from the member fixture. Keep each line concrete:

- "Species or origin: timeline-displaced 1970s waitress" beats "human."
- "Hair, face, silhouette: shoulder-length copper hair with blunt fringe, high cheekbones, slim shoulders" beats "pretty."
- "Outfit language: faded mint diner uniform, white apron with order pad in pocket, scuffed white sneakers" beats "casual outfit."
- "Supernatural visual hook: faintly lit clock face on the inside of her left wrist" beats "magical aura."

If a fixture detail does not change pixels, leave it out.

### Iterating On A Portrait

Make small, single-change follow-ups. After every generated image, inspect the result and write adjustment recommendations before generating again. Reference the previous image and state what must not change.

> Same character, new pose. Keep facial features, hair, color palette, and outfit unchanged. Only change the pose and hand position.

Do not stack multiple changes per iteration. Drift is harder to debug when several variables move at once.

### Full-Body Expression Variants

Generate expression variants from the approved neutral full-body portrait. Attach only the original approved neutral full-body portrait as the character reference unless the user explicitly gives another reference image and says to attach it. Do not attach failed candidates, previous variant outputs, avatar crops, contact sheets, or a mixed image history. This keeps variant generation from inheriting visual drift.

Preserve the same face, hair, body proportions, outfit, palette, supernatural hook, rendering style, and plain white background.

Use these variant meanings:

- `flirty`: warmer romantic interest. The pose can soften, lean in, or carry a confident smile, but should stay in character.
- `confused`: uncertainty, awkward concern, checked-out hesitation, or trying to understand the moment. Avoid slapstick confusion.
- `angry`: internal gameplay name for a negative boundary state. The image prompt should not simply ask for anger. Describe the member-specific read: distressed, concerned, guarded, irritated, cold, disinterested, or visibly angry.

Variant prompt template:

```text
Setting: plain white opaque background. No scenery, no floor, no shadow plane, no props beyond what the character already carries.
Subject: the same character as the attached approved full-body portrait.
Style: webtoon, manhwa, and manhua inspired character art. Match the established rendering style.
Composition: final PNG canvas must be exactly 887x1774. Full body visible from head to feet, centered, eye-level framing, readable silhouette. Character should use most of the canvas height. Preserve the approved outfit, character proportions, and supernatural visual hook.
Expression: <variant-specific expression and body language>.
Character preservation: same facial features, hair shape and color, eye color, skin tone, color palette, outfit, accessories, and supernatural hook as the approved full-body portrait. Do not redesign the character.
Constraints: no text, no logos, no watermarks, no frames, no UI, no scenery, no cropped feet. Avoid photorealism, western comic rendering, chibi proportions, oil-paint texture, sketchy unfinished line work, and busy illustrated backgrounds.
```

## Avoid

- Photorealism
- Western comic rendering
- Chibi proportions
- Heavy oil-paint texture
- Sketchy unfinished line work
- Busy illustrated backgrounds
- Cropped faces without usable shoulders or silhouette
- Overly tiny full-body portraits that fail when cropped
- Flat corporate avatar style
- Concept-art language ("rough sketch," "study," "WIP"); describe the asset as if it already exists

## Cutout Pipeline

Source images are production-time assets and belong outside the shipped client tree:

```text
assets-source/portraits/<member-id>/
  portrait.png
  avatar.png
  portrait-flirty.png
  portrait-confused.png
  portrait-angry.png
```

Transparent cutouts are runtime assets and belong in:

```text
public/assets/portraits/<member-id>/
  portrait.png
  avatar.png
  avatar-128.png
  avatar-256.png
  avatar-512.png
  portrait-flirty.png
  portrait-confused.png
  portrait-angry.png
```

Each member owns one folder in both locations. Use `portrait.png` for the neutral full-body image and `avatar.png` for the upper-half image. Use `portrait-<variant>.png` for optional full-body expression variants. The `avatar-<width>.png` files are downscaled siblings used by the runtime `srcset` so the browser fetches a member-card-sized PNG (typically 30 KB) instead of the multi-megabyte source. Do not put member files back under `public/assets/portraits/cutout/`; that flat folder no longer matches the fixture contract.

Do not place source images under `public/assets/portraits/source`. Vite copies `public` into the client build, so files there ship even when the UI never references them.

Use:

```sh
vp run portrait:cutout --input assets-source/portraits/member-id --output public/assets/portraits/member-id --overwrite
vp run portrait:cutout --input assets-source/portraits --output public/assets/portraits --recursive --overwrite
```

Default background removal model:

```text
bria-rmbg
```

Only run background removal after source images have been approved for check-in.

After regenerating an avatar cutout, regenerate the width variants used by the runtime `srcset`:

```sh
vp run portrait:resize-avatars
```

The script walks `public/assets/portraits/<member-id>/avatar.png`, writes `avatar-128.png`, `avatar-256.png`, and `avatar-512.png` next to each, and skips files whose variants are newer than the source. Pass `--overwrite` after editing the resize logic itself.

After changing any full-body portrait cutout, regenerate the standee footing table so live date standees ground from the visible feet instead of transparent canvas padding:

```sh
vp run portrait:standee-footing
```

## UI Usage

Use avatar cutouts in member cards and compact profile surfaces. Use full-body portrait cutouts in profile panels, selected match panels, and date surfaces where the character can occupy a taller frame. Keep both images large enough to establish character identity.

Portraits should sit inside the Aura UI language defined in `docs/product/visual-design.md`. Do not give every portrait its own illustrated card background. Let the dashboard provide the frame and let the cutout provide character.

## Scenario Backgrounds

Scenario backgrounds are ambient room art for the brief and live date scene. They should add place and pressure without replacing the Aura operations shell or becoming a card texture.

Source images belong outside the shipped client tree:

```text
assets-source/scenarios/<scenario-id>/background.png
```

Runtime images belong in:

```text
public/assets/scenarios/<scenario-id>/background.webp
```

Approved runtime backgrounds must also be listed in:

```text
public/assets/scenarios/manifest.json
```

The manifest prevents the app from probing missing image paths. Scenarios not listed in the manifest fall back to the default Aura mesh without a broken request.

Generate scenario backgrounds as bright webtoon, manhwa, and manhua inspired environment art. Use the scenario public brief as the source of truth. Creative contextual details are allowed when they fit the public room, but image details must not reveal private member facts, hidden outcomes, exact gameplay values, or future event results.

Composition should keep the center transcript lane calm: the middle 45 to 55 percent should stay bright, lower contrast, and readable after blur. Denser props, architectural detail, dramatic lighting, or supernatural pressure can live near the edges, upper corners, or far background. The runtime treats scenario backgrounds as cover images, so the source must tolerate edge cropping across wide desktop viewports. It always applies blur, a cream veil, and edge gradients, so the approved source should still look useful when softened and cropped.

One background per scenario is the default. Event-specific backgrounds are future scope and should only be added if the date flow needs scene-level visual state.

## Acceptance Checks

A portrait is acceptable when:

- Both images read as webtoon, manhwa, or manhua inspired.
- It is an original character.
- Both source images have white backgrounds.
- Both images have clean transparent cutouts after `bria-rmbg`, with no halos or fringing.
- Every full-body source and full-body expression variant source is exactly `887x1774`.
- Every full-body runtime cutout preserves the `887x1774` canvas after background removal.
- Every full-body portrait uses a standee-safe visible character scale, with `256x520` audit visible height near `470px` or higher unless a documented seated or crouched pose requires less.
- The full-body portrait shows the complete character from head to feet and can be cropped later.
- The avatar works at small member-card size.
- The avatar preserves the full-body's facial features, hair, color palette, and outfit while showing a visibly different pose.
- Expression variants preserve the approved neutral full-body character design and differ only in expression, posture, and controlled body language.
- Both images match the member fixture details.
- Neither image fights the Aura interface palette.
