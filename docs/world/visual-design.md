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

## Canvas Layout And Floating Nav

The playable shell uses a canvas-and-floating-nav layout instead of tab strips. After the splash, the shell hosts four rooms with their own staging. Live Date is the home room; the player lands there after onboarding.

- Live Date: the primary room. Has three states. (1) Lobby (no active session): a three-step booking wizard rendered by `app/components/pre-date-canvas.tsx`. Step 1 is the focus case, shown as the four focus slots (compact MemberCards) with cooldown and ready pills. Step 2 is the partner, shown as a roster grid of eligible standard MemberCards with a "best match" pill on the highest match-fit candidate. Step 3 is the date plan, shown as the three drawn `full` ScenarioCards. A sticky bottom dock summarizes the current focus / partner / plan picks and carries the Begin date CTA. The lobby header carries the shift number, slots remaining, quits remaining, and the file-shift CTA. Closure callouts surface above the wizard for any ready pair with at least one focused member. Cupid prefills focus, partner, and plan so a one-tap Begin date still works. (2) Active date: the live date UI takes the canvas full-bleed. The floating nav cluster hides. (3) Wrap (ended session, before the next book): the date view stays mounted with the FinalReportPanel. The header back button returns to the lobby.
- Roster: every member on file. Focus cases get a marked card. Closed members get a heart overlay, quit members get a red X overlay. Read-only sheets respect player knowledge visibility.
- Date Book: a workbench, not a list. The left column shows the active deck as a 4×3 grid of compact `tile` scenario cards with Roman numeral slot labels. The right column shows the library as a filtered, internally scrolling tile grid with a search input, risk filter, sort dropdown, and retired toggle. Clicking any card opens an oversized inspector modal that surfaces the full scenario brief (premise, opening situation, what both characters know, director tone, room constraints, success signals, failure signals, repeat behavior). Swap is inspector-first: open card → click action button → swap-mode banner activates at the top → click target card → instant apply. The dropped plan retires for three shifts. A deck composition strip in the header shows risk/intimacy/chaos distributions and pressure mix so the player can read deck health at a glance.
- Files: notes archive ported into the canvas treatment.

The floating nav cluster sits at the bottom right of every room. Four round buttons (Live Date, Roster, Date Book, Files) with rose accents on the active button. The cluster hides while a date is live so the live date room owns the canvas; in every other state, including the lobby and the post-date wrap, all four buttons are reachable.

### Scenario Card System

`app/components/scenario-card.tsx` is the shared component used in the Date Book deck and library grids, the Date Book inspector modal, and the Live Date lobby's date-plan step. The scenario's `assets/scenarios/{id}/background.webp` renders as a very subtle ambient backdrop: barely blurred (`blur-[2px]`/`blur-[3px]`), held at ~30% opacity, seated under a ~55% uniform cream wash plus a faint bottom wash for meter legibility. The image is mood/color, not picture. A glass risk badge sits top-left (LOW/MED/HIGH, color-coded). Content sits directly over the cream wash without a frosted panel, in two sizes:

- `tile` (4:5 aspect, ~140px min height, `rounded-[12px]`): used in both Date Book grids (active deck and library). Compact chrome. Carries only the title.
- `full` (4:5 aspect, ~260px min height, `rounded-[16px]`): used inside the Date Book inspector modal as the hero preview alongside the scrollable detail panel, and as the three drawn cards in the Live Date lobby's plan step. Carries a small mono LOCATION caption from `publicBrief.location`, the title in `font-display`, a three-line summary in `font-sans` muted, and a three-up stacked meter row showing `Risk · Intim · Chaos` with `LOW`/`MED`/`HIGH` values and matching color dots. Retired entries add a `retired · returns shift N` footnote under the meters.

Card states are `default`, `selected`, `disabled`, and `retired`. Selected adds a rose ring, intensified shadow, and a `PICKED` badge in the top-right. Retired desaturates the card. An orthogonal `inHand` prop marks today's draw with a rose-tinted ring, rose top highlight, and a `TODAY` glass chip in the top-right; this stays inside the card frame and is used in the Date Book to flag which active-deck cards are in tonight's hand. When both `inHand` and `selected` apply, `PICKED` takes precedence in the corner. The card never shows raw scenario tags, exact pressure, or stat math.

## What Not To Build

- No marketing landing page for the playable game shell.
- No portrait-specific illustrated card backgrounds. Let Aura supply the frame.
- No new global CSS classes unless the change needs shared base styling across multiple components.
- No inline `style=` attributes for UI work, except the data-driven CSS variables on `member-bubble` and the scenario backdrop. Use Tailwind utilities through `className` everywhere else.
