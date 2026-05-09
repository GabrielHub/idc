# Visual Design

This document owns IDC frontend design and theme. `app/app.css` owns the current theme tokens and fonts. UI agents should use those tokens unless existing product docs or code establish a narrower rule. `docs/world/image-style.md` owns image asset style, portrait generation, and the cutout pipeline.

## Interface Direction

The current UI language is Aura: soft pastel mesh light, rose and fuchsia accents, violet glow, cream background, rounded frosted surfaces, and small mono status labels.

Use the existing Tailwind theme tokens from `app/app.css`:

- `font-sans`, `font-display`, `font-mono`
- `bg-aura-bg`, `text-aura-ink`, `text-aura-muted`, `text-aura-rose`
- `bg-aura-card`, `border-aura-hairline`
- `rounded-card`, `rounded-chip`, `rounded-pill`
- `shadow-card`, `shadow-cta`

The product should feel like a polished supernatural dating operations dashboard, not a generic SaaS app and not a fantasy RPG menu.

## Surfaces And Composition

Aura surfaces are layered over the pastel mesh background. Cards are frosted with a hairline border, soft inner highlight, and the signature `rounded-card` radius. Use `shadow-card` for resting cards and `shadow-cta` for primary actions.

Status and meta labels read in `font-mono` at `text-micro` or `text-label`, uppercase and tracked, matching the existing dashboard chrome (`// session.0`, `9 / 11 dim`). Body copy is `font-sans` at `text-body`. Display headings and KPI numbers use `font-display`.

Portrait cutouts sit inside Aura surfaces; the dashboard provides the frame and the cutout provides character. See `docs/world/image-style.md` for portrait style and UI placement guidance.

## Information Visibility

The dashboard starts with sealed case files. Roster cards, dossier panels, and the splash riffle may show names, portraits, focused asks, public profile fragments, and sealed section hints. They must not show gated member fields, exact Mood, Openness, Burnout, retention, species, origin, reality status, full profiles, relationship needs, preferences, dealbreakers, raw scenario tags, or numeric pair stats before those facts are represented by filed reads.

Use visible redaction treatments, sealed labels, and filed-read lists instead of hiding real text with opacity or placing gated text in invisible DOM. Search, filters, sort controls, tooltips, and aria labels follow the same boundary as visible UI.

The live date footer can show exact Date Health, turn count, Judge count, nudge slots, and scene slots. Final reports, notes, brief panels, and follow-up actions should use nonnumeric outcome and intent copy.

## What Not To Build

- No marketing landing page for the playable game shell.
- No portrait-specific illustrated card backgrounds. Let Aura supply the frame.
- No new global CSS classes unless the change needs shared base styling across multiple components.
- No inline `style=` attributes for UI work. Use Tailwind utilities through `className`.
