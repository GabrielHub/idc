# Image Style And Asset Pipeline

This document owns IDC image asset style, portrait generation prompts, and the cutout pipeline. `docs/world/visual-design.md` owns the Aura interface direction and Tailwind theme tokens. Together they define how the world looks on screen.

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

Portraits should look like premium character cards adapted into clean UI cutouts. The style can be glamorous and dramatic, but the v1 portraits must still read clearly at member-card size.

## Per-Member Asset Set

For v1, each member gets two neutral baseline images:

- **Full-body portrait**: complete character visible from head to feet. Pose reads like a polished first photo on a dating profile: relaxed, intentional, flattering, character revealing.
- **Upper-half avatar**: same character, used as a profile picture. Pose reads like a realistic profile picture: close, natural, approachable, less theatrical than the full-body.

The avatar and full-body must be visibly different poses while preserving the same character design (hair, face, eyes, color palette, outfit). The avatar is generated as a follow-up to the full-body so the full-body acts as the character anchor.

## Prompt Construction

Image-generation prompts in this project follow the OpenAI image prompting guidance: write in a consistent order (scene then subject then key details then constraints), use labeled segments instead of one long paragraph, and state exclusions explicitly. State what must remain invariant when iterating, so the model does not redesign the character between images.

Every IDC portrait prompt has these labeled segments:

- **Setting**: where the character is rendered. For v1 baselines this is always a plain white opaque background.
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
Composition: full body visible from head to feet, centered with negative space on either side, eye-level framing, readable silhouette with strong separation from the background. Pose reads like a polished first photo on a dating profile: relaxed, intentional, flattering, character revealing.
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

Make small, single-change follow-ups. Reference the previous image and state what must not change.

> Same character, new pose. Keep facial features, hair, color palette, and outfit unchanged. Only change the pose and hand position.

Do not stack multiple changes per iteration. Drift is harder to debug when several variables move at once.

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
assets-source/portraits/
```

Transparent cutouts are runtime assets and belong in:

```text
public/assets/portraits/cutout/
```

Do not place source images under `public/assets/portraits/source`. Vite copies `public` into the client build, so files there ship even when the UI never references them.

Use:

```sh
vp run portrait:cutout --input assets-source/portraits/member-id.png --output public/assets/portraits/cutout/member-id.png
vp run portrait:cutout --input assets-source/portraits/member-id-avatar.png --output public/assets/portraits/cutout/member-id-avatar.png
```

Default background removal model:

```text
bria-rmbg
```

Only run background removal after source images have been approved for check-in.

## UI Usage

Use avatar cutouts in member cards and compact profile surfaces. Use full-body portrait cutouts in profile panels, selected match panels, and date surfaces where the character can occupy a taller frame. Keep both images large enough to establish character identity.

Portraits should sit inside the Aura UI language defined in `docs/world/visual-design.md`. Do not give every portrait its own illustrated card background in v1. Let the dashboard provide the frame and let the cutout provide character.

## Acceptance Checks

A portrait is acceptable when:

- Both images read as webtoon, manhwa, or manhua inspired.
- It is an original character.
- Both source images have white backgrounds.
- Both images have clean transparent cutouts after `bria-rmbg`, with no halos or fringing.
- The full-body portrait shows the complete character from head to feet and can be cropped later.
- The avatar works at small member-card size.
- The avatar preserves the full-body's facial features, hair, color palette, and outfit while showing a visibly different pose.
- Both images match the member fixture details.
- Neither image fights the Aura interface palette.
