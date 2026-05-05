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

Member portraits use a webtoon and manhua inspired style.

The reference direction is:

- Clean anime-webtoon line work
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

For v1, each member gets one neutral baseline portrait.

Required:

- Original character design
- Webtoon or manhua inspired rendering
- Neutral or lightly pleasant expression
- Bust, waist-up, or three-quarter portrait
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
- Overly tiny full-body figures that fail at card size
- Flat corporate avatar style

## Prompt Pattern

Use this pattern when generating member portraits:

```text
Original character portrait for Interdimensional Dating Coach, webtoon and manhua inspired character art, clean anime line work, expressive eyes, polished cel shading, glossy hair highlights, elegant supernatural dating-app character design, neutral baseline expression, waist-up portrait, readable silhouette, plain white background, no text, no logo, no frame, no scenery
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

Source portraits belong in:

```text
public/assets/portraits/source/
```

Transparent cutouts belong in:

```text
public/assets/portraits/cutout/
```

Use:

```sh
vp run portrait:cutout -- --input public/assets/portraits/source/member-id.png --output public/assets/portraits/cutout/member-id.png
```

Default background removal model:

```text
bria-rmbg
```

Only run background removal after a source portrait has been approved for check-in.

## UI Usage

Use transparent cutouts in member cards, profile panels, match panels, and date surfaces. Keep portraits large enough to establish character identity.

Portraits should sit inside the Aura UI language. Do not give every portrait its own illustrated card background in v1. Let the dashboard provide the frame and let the cutout provide character.

## Acceptance Checks

A portrait is acceptable when:

- It reads as webtoon or manhua inspired.
- It is an original character.
- It has a white source background.
- It has a clean transparent cutout.
- It works at small member-card size.
- It matches the member fixture.
- It does not fight the Aura interface palette.
