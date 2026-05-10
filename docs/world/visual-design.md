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

## Per-Member Chat Bubbles

Every member with a distinctive identity should declare a `chatBubble` on their fixture in `app/fixtures/members/<member>.ts`. The schema lives at `memberChatBubbleStyleSchema` in `app/domain/game.ts`. The bubble only renders when the member is the focused (left) dater on a date; partner-side bubbles always use the cream default. Members without a `chatBubble` fall through to the iMessage blue house style (system sans on a `#34a0ff → #0a84ff` gradient). That fallthrough is the right call for ordinary humans whose voice fits a normal phone app (Jenna, Marcus, Sana, Toby). The Cupid rose-fuchsia palette now lives on Venus (the on-brand goddess of love) and a coral-shifted variation on Cassie (DAYBREAK), both authored through the schema.

The schema is composed of small enum axes plus data-driven colors:

- `background`: solid hex or 2 to 3 stop gradient with an explicit angle.
- `textColor`: `light` | `dark` | `muted-light` | `muted-dark`.
- `shape`: `soft` | `sharp` | `torn` | `papercut` | `scroll`.
- `tail`: `rounded` | `sharp` | `fanged` | `papercut` | `none`.
- `border`: `none` | `hairline` | `glow` | `filigree` | `crackling`.
- `glow`: `{ color, intensity: soft | medium | strong }` for an outer halo.
- `texture`: `parchment` | `glass` | `ooze` | `holographic` | `noise`.
- `entryAnimation`: `fade` | `drift` | `drip` | `snap` | `settle` | `materialize` | `shimmer` | `flicker` | `type` | `unfurl`. Drift loops on the gradient. `materialize` is a slow opacity fade with a brief blur (apparition feel: the drop-shadow glow resolves last; ghosts, summoners). `shimmer` is a tiny scale wobble suggesting a glamour stabilizing (fae). `flicker` dips opacity twice mid-entry for an uncanny presence (cryptids, eldritch). `type` reveals the bubble left to right via clip-path (digital, terminal print). `unfurl` opens from the top center via clip-path with a small downward drop (scrolls, banners). The clip-path animations (`drip`, `type`, `unfurl`) require shapes that do not already define a clip-path themselves, so do not pair them with `torn` or `papercut`. Filter-based animations (`materialize`) temporarily override the `glow` drop-shadow during entry and let it resolve after.
- `fontFamily`: `serif` | `display` | `mono` | `antique` | `italic-script` | `eldritch`. Default is body sans. `antique` is IM Fell English, a weathered humanist serif for period or pre-modern voices (knights, scribes). `italic-script` is Cormorant Garamond italic, an elegant courtly italic for refined or ceremonial registers (faerie courts, old aristocracy). `eldritch` is Cinzel Decorative, an ornamented engraved Roman face (capitals-only with flourishes), reserved for speakers whose voice should not read as coming from a human mouth (eldritch entities, cryptids in denial). Lowercase letters render as small caps, so the bubble reads like a chiseled inscription.
- `textEffect`: `shadow` | `glow` | `tight` | `loose`.
- `accentColor`: hex used for the speaker name above the bubble and the streaming caret. Falls back to `glow.color`, then the first gradient stop, then the solid color. Override this when the fallback would disappear on the cream page background, for example dark solids and pale gradients.

Authoring guidance:

- Match the bubble to the member's voice register and portrait palette. Vhool's eldritch black-to-magenta gradient with a fanged tail and crackling violet glow is the same palette as her portrait.
- Keep readability primary. If `textColor` is light, the bubble background should be dark enough to carry it; if dark, light enough.
- Use `serif` for courtly or formal members (Decimus, Bai Wenshu, Gideon). Use `antique` for pre-modern voices like Aldric. Use `italic-script` for refined courtly registers like Eleanor. Use `mono` for technical or transactional members (Whiskers, Sera, Meridian, Brady, Tasha). Use `display` for high-presence members (Venus, Mei, Mira, Kade).
- The continuous animations (`drift`, `crackling`, `holographic`) are disabled under `prefers-reduced-motion`.

The composed CSS classes live in `app/app.css` under the `MEMBER CHAT BUBBLE` section. Color values that vary per member flow through inline `style` only as CSS variables (`--member-bubble-tail-color`, `--member-bubble-glow`, `--member-bubble-accent`) and the resolved gradient string. This is the same pattern `app/components/scenario-backdrop.tsx` uses for data-driven backgrounds, and it is the only inline-style use sanctioned for the bubble system.

## What Not To Build

- No marketing landing page for the playable game shell.
- No portrait-specific illustrated card backgrounds. Let Aura supply the frame.
- No new global CSS classes unless the change needs shared base styling across multiple components.
- No inline `style=` attributes for UI work, except the data-driven CSS variables on `member-bubble` and the scenario backdrop. Use Tailwind utilities through `className` everywhere else.
