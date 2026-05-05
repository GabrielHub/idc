# Visual Design

This document owns IDC visual style decisions. `app/app.css` owns the current theme tokens and fonts. UI agents should use those tokens unless an active plan says otherwise.

## Interface Direction

The current UI language is Aura: soft pastel mesh light, rose and fuchsia accents, violet glow, cream background, rounded frosted surfaces, and small mono status labels.

Use the existing Tailwind theme tokens from `app/app.css`:

- `font-sans`, `font-display`, `font-mono`
- `bg-aura-bg`, `text-aura-ink`, `text-aura-muted`, `text-aura-rose`
- `bg-aura-card`, `border-aura-hairline`
- `rounded-card`, `rounded-chip`, `rounded-pill`
- `shadow-card`, `shadow-cta`

The product should feel like a polished supernatural dating operations dashboard, not a generic SaaS app and not a fantasy RPG menu.

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

## Portrait Generation Rules

For v1, each member gets two neutral baseline images: a full-body portrait and an upper-half avatar.

Required:

- Original character design
- Webtoon, manhwa, or manhua inspired rendering
- Neutral or lightly pleasant expression
- Full-body portrait with the complete character visible from head to feet
- Full-body pose should feel like a dating profile picture, relaxed, intentional, and character revealing
- Upper-half avatar for profile picture use, matching the full-body character design
- Full character silhouette visible enough for cutout use
- Plain white background
- Strong separation between character and background
- No text, logos, watermarks, frames, UI, or scenery
- No exact copying of reference characters, outfits, poses, or compositions

Avoid:

- Photorealism
- Western comic rendering
- Chibi proportions
- Heavy oil-paint texture
- Sketchy unfinished line work
- Busy illustrated backgrounds
- Cropped faces without usable shoulders or silhouette
- Overly tiny full-body portraits that fail when cropped
- Flat corporate avatar style

## Prompt Pattern

Use these patterns when generating member portraits.

Full-body portrait:

```text
Original full-body character portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, glossy hair highlights, elegant supernatural dating-app character design, neutral baseline expression, dating profile picture pose, full body visible, readable silhouette, plain white background, no text, no logo, no frame, no scenery
```

Avatar:

```text
Original avatar portrait for Interdimensional Dating Coach, webtoon, manhwa, and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, glossy hair highlights, elegant supernatural dating-app character design, neutral baseline expression, upper half dating profile picture pose, readable silhouette, plain white background, no text, no logo, no frame, no scenery
```

Then add member-specific details from the fixture:

- Species or origin
- Age presentation
- Hair, face, and silhouette details
- Outfit language
- Personality cues
- One supernatural visual hook

Keep prompts focused. Do not include long lore dumps.

## Cutout Pipeline

Source images belong in:

```text
public/assets/portraits/source/
```

Transparent cutouts belong in:

```text
public/assets/portraits/cutout/
```

Use:

```sh
vp run portrait:cutout --input public/assets/portraits/source/member-id.png --output public/assets/portraits/cutout/member-id.png
vp run portrait:cutout --input public/assets/portraits/source/member-id-avatar.png --output public/assets/portraits/cutout/member-id-avatar.png
```

Default background removal model:

```text
bria-rmbg
```

Only run background removal after source images have been approved for check-in.

## UI Usage

Use avatar cutouts in member cards and compact profile surfaces. Use full-body portrait cutouts in profile panels, selected match panels, and date surfaces where the character can occupy a taller frame. Keep both images large enough to establish character identity.

Portraits should sit inside the Aura UI language. Do not give every portrait its own illustrated card background in v1. Let the dashboard provide the frame and let the cutout provide character.

## Acceptance Checks

A portrait is acceptable when:

- Both images read as webtoon, manhwa, or manhua inspired.
- It is an original character.
- Both source images have white backgrounds.
- Both images have clean transparent cutouts.
- The full-body portrait shows the complete character and can be cropped later.
- The avatar works at small member-card size.
- Both images match the member fixture.
- Neither image fights the Aura interface palette.
