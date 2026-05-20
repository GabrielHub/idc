import { useState } from "react";

import {
  Chip,
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocDefList,
  DocFigure,
  DocLink,
  DocList,
  DocPage,
  DocSubsection,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";
import {
  ChevronLinkRow,
  RadioRow,
  SectionHeader,
  SegmentedControl,
  SettingsList,
  SettingsRow,
  Toggle,
} from "../../components/form-primitives";
import {
  HOUSE_BUBBLE_LEFT_CLASS,
  HOUSE_BUBBLE_NAME_CLASS,
  resolveMemberChatBubbleStyle,
} from "../../components/member-chat-bubble-style";
import type { Member } from "../../domain/game";
import { aldricValeMarsh } from "../../fixtures/members/aldric-vale-marsh";
import { seraVohn } from "../../fixtures/members/sera-vohn";
import { venus } from "../../fixtures/members/venus";
import { vhool } from "../../fixtures/members/vhool";

export const meta: DocMeta = {
  slug: "product/visual-design",
  group: "product",
  title: "Visual design",
  description:
    "Aura interface direction, Tailwind theme tokens, per-member chat bubbles, per-member auras, canvas layout, and scenario card system.",
  order: 4,
};

export const lede = (
  <>
    This document owns IDC frontend design and theme. <DocCode>app/app.css</DocCode> owns the
    current theme tokens and fonts. UI agents should use those tokens unless existing product docs
    or code establish a narrower rule. <DocLink to="/docs/product/image-style">Image style</DocLink>{" "}
    owns image asset style, portrait generation, and the cutout pipeline.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "interface-direction",
    title: "Interface direction",
    body: (
      <>
        <P>
          The current UI language is Aura: soft pastel mesh light, rose and fuchsia accents, violet
          glow, cream background, rounded frosted surfaces, and small mono status labels.
        </P>
        <P>
          Use the existing Tailwind theme tokens from <DocCode>app/app.css</DocCode>:
        </P>
        <DocList
          items={[
            <span key="fonts">
              <DocCode>font-sans</DocCode>, <DocCode>font-display</DocCode>,{" "}
              <DocCode>font-mono</DocCode>
            </span>,
            <span key="surfaces">
              <DocCode>bg-aura-bg</DocCode>, <DocCode>text-aura-ink</DocCode>,{" "}
              <DocCode>text-aura-muted</DocCode>, <DocCode>text-aura-rose</DocCode>
            </span>,
            <span key="cards">
              <DocCode>bg-aura-card</DocCode>, <DocCode>border-aura-hairline</DocCode>
            </span>,
            <span key="radius">
              <DocCode>rounded-card</DocCode>, <DocCode>rounded-chip</DocCode>,{" "}
              <DocCode>rounded-pill</DocCode>
            </span>,
            <span key="shadow">
              <DocCode>shadow-card</DocCode>, <DocCode>shadow-cta</DocCode>
            </span>,
          ]}
        />
        <P>
          The product should feel like a polished supernatural dating operations dashboard, not a
          generic SaaS app and not a fantasy RPG menu.
        </P>
      </>
    ),
  },
  {
    id: "surfaces-and-composition",
    title: "Surfaces and composition",
    body: (
      <>
        <P>
          Aura surfaces are layered over the pastel mesh background. Cards are frosted with a
          hairline border, soft inner highlight, and the signature <DocCode>rounded-card</DocCode>{" "}
          radius. Use <DocCode>shadow-card</DocCode> for resting cards and{" "}
          <DocCode>shadow-cta</DocCode> for primary actions.
        </P>
        <P>
          Status and meta labels read in <DocCode>font-mono</DocCode> at{" "}
          <DocCode>text-micro</DocCode> or <DocCode>text-label</DocCode>, uppercase and tracked,
          matching the existing dashboard chrome (<DocCode>// session.0</DocCode>,{" "}
          <DocCode>9 / 11 dim</DocCode>). Body copy is <DocCode>font-sans</DocCode> at{" "}
          <DocCode>text-body</DocCode>. Display headings and KPI numbers use{" "}
          <DocCode>font-display</DocCode>.
        </P>
        <P>
          Type scale floor is 14px. Both <DocCode>text-micro</DocCode> and{" "}
          <DocCode>text-label</DocCode> resolve to <DocCode>0.875rem</DocCode> (14px); they are kept
          as semantic aliases (chip eyebrow vs body caption) rather than separate sizes. Do not
          introduce text below 14px. The Tailwind default <DocCode>text-xs</DocCode> (12px) is
          off-limits for app UI.
        </P>
        <P>
          Portrait cutouts sit inside Aura surfaces; the dashboard provides the frame and the cutout
          provides character. See <DocLink to="/docs/product/image-style">Image style</DocLink> for
          portrait style and UI placement guidance.
        </P>
      </>
    ),
  },
  {
    id: "component-library",
    title: "Component library",
    body: (
      <>
        <P>
          Reusable interface primitives live in two files. Doc-only primitives (
          <DocCode>DocFigure</DocCode>, <DocCode>Chip</DocCode>, <DocCode>BulletList</DocCode>,{" "}
          <DocCode>DocPipeline</DocCode>, etc.) ship from{" "}
          <DocCode>app/components/doc-primitives.tsx</DocCode>. Form and control primitives (
          <DocCode>Toggle</DocCode>, <DocCode>SettingsList</DocCode>, <DocCode>SettingsRow</DocCode>
          , <DocCode>RadioRow</DocCode>, <DocCode>SegmentedControl</DocCode>,{" "}
          <DocCode>ChevronLinkRow</DocCode>, <DocCode>SectionHeader</DocCode>) ship from{" "}
          <DocCode>app/components/form-primitives.tsx</DocCode>. Reach for these before writing a
          new inline control. They read as cream paper in light mode and TIDAL-style raised tiles in
          dark mode without any per-component theme wiring.
        </P>
        <DocCallout variant="note">
          When in doubt, grep <DocCode>doc-primitives.tsx</DocCode> and{" "}
          <DocCode>form-primitives.tsx</DocCode> first. If a one-off chip, card, or row repeats more
          than twice, lift it into one of these files instead of fanning out a third copy.
        </DocCallout>
        <PrimitivesShowcase />
      </>
    ),
  },
  {
    id: "information-visibility",
    title: "Information visibility",
    body: (
      <>
        <P>
          The dashboard starts with sealed case files. Roster cards, dossier panels, and the splash
          riffle may show names, portraits, focused asks, public profile fragments, and sealed
          section hints. They must not show gated member fields, exact Mood, Openness, Burnout,
          retention, full profiles, relationship needs, preferences, dealbreakers, raw scenario
          tags, or numeric pair stats before those facts are represented by filed reads or an
          explicit dev preview. Species, origin, dimension, reality status, and bio are internal
          context fields and do not render as player-facing case labels.
        </P>
        <P>
          Use visible redaction treatments, sealed labels, and filed-read lists instead of hiding
          real text with opacity or placing gated text in invisible DOM. Search, filters, sort
          controls, tooltips, and aria labels follow the same boundary as visible UI.
        </P>
        <P>
          The live date footer can show exact Date Health, turn count, Cupid read count, nudge
          slots, scene slots, and the cut short transport action after it unlocks. The cut short
          affordance needs tooltip copy because it is a consequential pacing command: Cupid files a
          final read, resolves the date, and puts both members into cooldown. Final reports, notes,
          brief panels, and follow-up actions should use nonnumeric outcome and intent copy.
        </P>
        <DocCallout variant="info">
          For the full visibility rule and tier breakdown, see{" "}
          <DocLink to="/docs/gameplay/player-knowledge">Player knowledge</DocLink>.
        </DocCallout>
      </>
    ),
  },
  {
    id: "per-member-chat-bubbles",
    title: "Per-member chat bubbles",
    body: (
      <>
        <P>
          Every member with a distinctive identity should declare a <DocCode>chatBubble</DocCode> on
          their fixture in <DocCode>app/fixtures/members/&lt;member&gt;.ts</DocCode>. The schema
          lives at <DocCode>memberChatBubbleStyleSchema</DocCode> in{" "}
          <DocCode>app/domain/game.ts</DocCode>. The bubble only renders when the member is the
          focused (left) dater on a date; partner-side bubbles always use the cream default. Members
          without a <DocCode>chatBubble</DocCode> fall through to the iMessage blue house style
          (system sans on a <DocCode>#34a0ff → #0a84ff</DocCode> gradient). That fallthrough is the
          right call for ordinary humans whose voice fits a normal phone app (Jenna, Marcus, Sana,
          Toby). The Cupid rose-fuchsia palette now lives on Venus (the on-brand goddess of love)
          and a coral-shifted variation on Cassie (DAYBREAK), both authored through the schema.
        </P>
        <DocCallout variant="info">
          See every focused-side bubble side by side in the{" "}
          <DocLink to="/playground">Playground</DocLink> under the Chat bubble gallery tab. Each
          card uses the same resolver as a live date and lists the axes the fixture set, so you can
          confirm an authoring tweak against neighbouring members before committing.
        </DocCallout>
        <P>The schema is composed of small enum axes plus data-driven colors:</P>
        <DocDefList
          items={[
            {
              term: "background",
              def: "Solid hex or 2 to 3 stop gradient with an explicit angle.",
            },
            {
              term: "textColor",
              def: (
                <>
                  <DocCode>light</DocCode> | <DocCode>dark</DocCode> |{" "}
                  <DocCode>muted-light</DocCode> | <DocCode>muted-dark</DocCode>
                </>
              ),
            },
            {
              term: "shape",
              def: (
                <>
                  <DocCode>soft</DocCode> | <DocCode>sharp</DocCode> | <DocCode>torn</DocCode> |{" "}
                  <DocCode>papercut</DocCode> | <DocCode>scroll</DocCode>
                </>
              ),
            },
            {
              term: "tail",
              def: (
                <>
                  <DocCode>rounded</DocCode> | <DocCode>sharp</DocCode> | <DocCode>fanged</DocCode>{" "}
                  | <DocCode>papercut</DocCode> | <DocCode>none</DocCode>
                </>
              ),
            },
            {
              term: "border",
              def: (
                <>
                  <DocCode>none</DocCode> | <DocCode>hairline</DocCode> | <DocCode>glow</DocCode> |{" "}
                  <DocCode>filigree</DocCode> | <DocCode>crackling</DocCode>
                </>
              ),
            },
            {
              term: "glow",
              def: (
                <>
                  <DocCode>{`{ color, intensity: soft | medium | strong }`}</DocCode> for an outer
                  halo.
                </>
              ),
            },
            {
              term: "texture",
              def: (
                <>
                  <DocCode>parchment</DocCode> | <DocCode>glass</DocCode> | <DocCode>ooze</DocCode>{" "}
                  | <DocCode>holographic</DocCode> | <DocCode>noise</DocCode>
                </>
              ),
            },
            {
              term: "entryAnimation",
              def: (
                <>
                  <DocCode>fade</DocCode> | <DocCode>drift</DocCode> | <DocCode>drip</DocCode> |{" "}
                  <DocCode>snap</DocCode> | <DocCode>settle</DocCode> |{" "}
                  <DocCode>materialize</DocCode> | <DocCode>shimmer</DocCode> |{" "}
                  <DocCode>flicker</DocCode> | <DocCode>type</DocCode> | <DocCode>unfurl</DocCode>.
                  The clip-path animations (<DocCode>drip</DocCode>, <DocCode>type</DocCode>,{" "}
                  <DocCode>unfurl</DocCode>) require shapes that do not already define a clip-path
                  themselves, so do not pair them with <DocCode>torn</DocCode> or{" "}
                  <DocCode>papercut</DocCode>. Filter-based animations (
                  <DocCode>materialize</DocCode>) temporarily override the <DocCode>glow</DocCode>{" "}
                  drop-shadow during entry and let it resolve after.
                </>
              ),
            },
            {
              term: "fontFamily",
              def: (
                <>
                  <DocCode>serif</DocCode> | <DocCode>display</DocCode> | <DocCode>mono</DocCode> |{" "}
                  <DocCode>antique</DocCode> | <DocCode>italic-script</DocCode> |{" "}
                  <DocCode>eldritch</DocCode>. Default is body sans. <DocCode>antique</DocCode> is
                  IM Fell English (knights, scribes). <DocCode>italic-script</DocCode> is Cormorant
                  Garamond italic (faerie courts, old aristocracy). <DocCode>eldritch</DocCode> is
                  Cinzel Decorative for speakers whose voice should not read as coming from a human
                  mouth.
                </>
              ),
            },
            {
              term: "textEffect",
              def: (
                <>
                  <DocCode>shadow</DocCode> | <DocCode>glow</DocCode> | <DocCode>tight</DocCode> |{" "}
                  <DocCode>loose</DocCode>
                </>
              ),
            },
            {
              term: "accentColor",
              def: (
                <>
                  Hex used for the speaker name above the bubble and the streaming caret. Falls back
                  to <DocCode>glow.color</DocCode>, then the first gradient stop, then the solid
                  color. Override this when the fallback would disappear on the cream page
                  background, for example dark solids and pale gradients.
                </>
              ),
            },
          ]}
        />
        <DocSubsection id="bubble-authoring" title="Authoring guidance">
          <DocList
            items={[
              "Match the bubble to the member's voice register and portrait palette. Vhool's eldritch black-to-magenta gradient with a fanged tail and crackling violet glow is the same palette as her portrait.",
              <span key="readability">
                Keep readability primary. If <DocCode>textColor</DocCode> is light, the bubble
                background should be dark enough to carry it; if dark, light enough.
              </span>,
              <span key="usage">
                Use <DocCode>serif</DocCode> for courtly or formal members (Decimus, Bai Wenshu,
                Gideon). Use <DocCode>antique</DocCode> for pre-modern voices like Aldric. Use{" "}
                <DocCode>italic-script</DocCode> for refined courtly registers like Eleanor. Use{" "}
                <DocCode>mono</DocCode> for technical or transactional members (Whiskers, Sera,
                Meridian, Brady, Tasha). Use <DocCode>display</DocCode> for high-presence members
                (Venus, Mei, Mira, Kade).
              </span>,
              <span key="motion">
                The continuous animations (<DocCode>drift</DocCode>, <DocCode>crackling</DocCode>,{" "}
                <DocCode>holographic</DocCode>) are disabled under{" "}
                <DocCode>prefers-reduced-motion</DocCode>.
              </span>,
            ]}
          />
          <P>
            The composed CSS classes live in <DocCode>app/app.css</DocCode> under the{" "}
            <Strong>MEMBER CHAT BUBBLE</Strong> section. Color values that vary per member flow
            through inline <DocCode>style</DocCode> only as CSS variables (
            <DocCode>--member-bubble-tail-color</DocCode>, <DocCode>--member-bubble-glow</DocCode>,{" "}
            <DocCode>--member-bubble-accent</DocCode>) and the resolved gradient string. This is the
            same pattern <DocCode>app/components/scenario-backdrop.tsx</DocCode> uses for
            data-driven backgrounds, and it is the only inline-style use sanctioned for the bubble
            system.
          </P>
        </DocSubsection>
        <DocSubsection id="bubble-reference-examples" title="Reference examples">
          <P>
            Four shipped fixtures cover the spread of registers. Skim these before authoring a new
            bubble; the full set lives in <DocCode>app/fixtures/members/</DocCode> and renders in
            the <DocLink to="/playground">Playground</DocLink> Chat bubble gallery.
          </P>
          <ChatBubbleReferenceExample
            member={venus}
            fixturePath="app/fixtures/members/venus.ts"
            description="On-brand rose-to-fuchsia, display font, soft shape, rounded tail, medium glow, explicit accent color so the speaker name stays readable on cream."
          />
          <ChatBubbleReferenceExample
            member={vhool}
            fixturePath="app/fixtures/members/vhool.ts"
            description="Eldritch three-stop gradient, torn shape, fanged tail, crackling violet border, ooze texture, flicker entry, eldritch font. Use this shape when the member should not read as having a human mouth."
          />
          <ChatBubbleReferenceExample
            member={aldricValeMarsh}
            fixturePath="app/fixtures/members/aldric-vale-marsh.ts"
            description="Pre-modern courtly register, sharp shape and tail with a filigree border, parchment texture, unfurl entry, antique font."
          />
          <ChatBubbleReferenceExample
            member={seraVohn}
            fixturePath="app/fixtures/members/sera-vohn.ts"
            description="Tech-transactional, near-black gradient, sharp shape, no border, cyan glow, noise texture, type entry, mono font."
          />
          <P>
            Members without a <DocCode>chatBubble</DocCode> at all (Jenna, Brady, Marcus, Sana,
            Toby, Tasha) fall through to the iMessage blue house style. Do not set the field if the
            house default is the right call.
          </P>
        </DocSubsection>
        <DocSubsection id="bubble-markdown-subset" title="Member message Markdown subset">
          <P>
            Member bubbles render text through{" "}
            <DocCode>app/components/member-message-markdown.tsx</DocCode>, a tiny hardened renderer
            that accepts a single typographic subset:
          </P>
          <DocList
            items={[
              <span key="prose">Paragraphs of plain prose.</span>,
              <span key="soft">
                Soft line breaks in live date chat render as consecutive same-speaker bubbles.
              </span>,
              <span key="blank">
                A blank line creates the same split while the transcript keeps one saved character
                turn.
              </span>,
              <span key="italic">
                <DocCode>*italic*</DocCode> spans for spoken stress only, never stage directions.
              </span>,
              <span key="strong">
                <DocCode>**strong**</DocCode> spans for a named term or a punch line.
              </span>,
              <span key="heading">
                One <DocCode># SHOUTED LINE</DocCode> ATX heading per message rendered as a
                bubble-local display paragraph, not a semantic heading.
              </span>,
            ]}
          />
          <P>
            Lists, links, images, raw HTML, code, tables, math, Mermaid, blockquotes, footnotes, and
            task syntax are rejected before persistence by the character sanitizer in{" "}
            <DocCode>app/services/character-markdown.ts</DocCode>. The renderer caps a single
            message at three visible blocks after cleanup. In the live date stream, the chat lane
            splits newline-separated blocks into a tight bubble run before handing each segment to
            the renderer. The heading beat lands inside the existing bubble width and tail; it never
            widens the transcript lane or introduces semantic <DocCode>h1</DocCode> through{" "}
            <DocCode>h6</DocCode> elements.
          </P>
          <P>
            See{" "}
            <DocLink to="/docs/product/voice-prompts#member-markdown-subset">Voice prompts</DocLink>{" "}
            for the writer-facing rules and authoring examples.
          </P>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "bubble-authoring", title: "Authoring guidance" },
      { id: "bubble-reference-examples", title: "Reference examples" },
      { id: "bubble-markdown-subset", title: "Member message Markdown subset" },
    ],
  },
  {
    id: "per-member-auras",
    title: "Per-member auras",
    body: (
      <>
        <P>
          Every member declares an ambient aura keyed off internal fixture context, registered in{" "}
          <DocCode>app/components/member-aura-registry.ts</DocCode>. The aura renders behind and
          around the standee on focused MemberCards (state <DocCode>focused</DocCode> only) and
          inside the modal for active members. It does not render on default candidate cards,
          compact cards, closed or quit overlays, the disabled "caseload full" state, or anywhere
          reduced-motion is set. The component is <DocCode>app/components/member-aura.tsx</DocCode>.
          Card density picks fewer particles, modal density picks more.
        </P>
        <DocCallout variant="info">
          To see auras animate live, focus a member in the Roster room of the playable shell or open
          the member modal. The <DocLink to="/playground">Playground</DocLink> Chat bubble gallery
          is also useful as a quick portrait reference when picking a tint, since each aura tint
          should sit comfortably next to the same member's portrait and bubble palette.
        </DocCallout>
        <DocSubsection id="render-slots" title="Render slots">
          <P>
            Each kind splits its particles into two slots so the standee feels embedded in the aura,
            not pasted over it. Callers mount one{" "}
            <DocCode>&lt;MemberAuraLayer slot=... /&gt;</DocCode> per slot in the right place in the
            DOM:
          </P>
          <DocDefList
            items={[
              {
                term: "back",
                def: (
                  <>
                    The bulk of the particles, rendered behind the portrait. On the card this sits
                    between the portrait backdrop and the standee. On the modal the back slot is
                    mounted twice with the <DocCode>mode</DocCode> prop splitting which kinds render
                    where: at modal root with <DocCode>mode="broad"</DocCode> the back aura fills
                    the entire modal width and only the non-light kinds render. Inside the aside's
                    portrait wrap with <DocCode>mode="anchored"</DocCode> only the light kinds (
                    <DocCode>pulse</DocCode>, <DocCode>prism</DocCode>) render, so their gradient is
                    centered on the portrait column. Glow-style kinds render only in{" "}
                    <DocCode>back</DocCode>, never <DocCode>front</DocCode>.
                  </>
                ),
              },
              {
                term: "front",
                def: (
                  <>
                    A minority of the particles, rendered in front of the standee. On the card this
                    is at <DocCode>z-[15]</DocCode> (in front of the portrait but below the info
                    overlay). On the modal it sits inside the aside's portrait wrap so it is
                    contained to the portrait column and never floats over the text.
                  </>
                ),
              },
            ]}
          />
          <P>
            Per-particle slot assignment is deterministic per seed: each layer rolls{" "}
            <DocCode>pickInFront(random, frontShare)</DocCode> once per particle and stores the
            result on the particle, then <DocCode>filterBySlot</DocCode> returns only the matching
            subset. Front share is tuned per kind (15% for godrays, ~40% for sparks); most particles
            stay in back, so the standee remains the focal point.
          </P>
        </DocSubsection>
        <DocSubsection id="aura-kinds" title="Kinds">
          <P>
            The categorization is by archetype, not name. Members within the same kind share the
            animation; per-member tint carries the personality.
          </P>
          <DocDefList
            items={[
              {
                term: "godray",
                def: "Mundane Earth humans on Prime or Prime-adjacent. Wide soft warm sun shafts at screen blend. Jenna, Brady, Kade, Marcus, Sana, Tasha, Toby, Mira, Mei.",
              },
              {
                term: "ectoplasm",
                def: "Members displaced from when they should be. Drifting wispy motes. Gideon (cool cyan), Opal (sepia chrono drift).",
              },
              {
                term: "fieldmote",
                def: "Cryptids, uncanny household companions, the talking cat. Earthy slow-drifting dots with soft glow rising. Calvin (mossy green), Mr Whiskers (warm tan), Junie (moss/old-woods gold).",
              },
              {
                term: "rune",
                def: "Eldritch entities. Small Norse glyphs floating up and rotating. Vhool (deep amethyst), Cthala (drowned blue-violet).",
              },
              {
                term: "petal",
                def: "Mythic and courtly characters. Soft falling petals on curved SVG paths. Aldric (rose), Eleanor (white hawthorn, fae), Wenshu (pink plum, Falling Plum Sect).",
              },
              {
                term: "pulse",
                def: "Characters with their own light source. Staggered radial gradients at screen blend, blooming and expanding. Cassie, Cha, Venus, Decimus, Anubis.",
              },
              {
                term: "pixelrain",
                def: "Futuristic and tech-displaced characters. Twinkling glowing star pixels. Epsy, Sera, Reaver, Meridian.",
              },
              {
                term: "ember",
                def: "Post-conflict refugees. SVG flame teardrops rising with bright cream core. Idris (warm iron ash).",
              },
              {
                term: "prism",
                def: "Bioluminescent or hue-shifting characters. Pulse plus continuous hue-rotate. Naia (Vellaine of the Glow).",
              },
            ]}
          />
        </DocSubsection>
        <DocSubsection id="aura-authoring" title="Authoring guidance for new members">
          <DocList
            items={[
              <span key="species">
                Read the new member's internal fixture context first. If their archetype matches an
                existing kind, register them under that kind and pick a tint that contrasts the
                modal background. The tint is <DocCode>{`{ primary, glow }`}</DocCode> where{" "}
                <DocCode>primary</DocCode> is the bright particle color and <DocCode>glow</DocCode>{" "}
                is the secondary halo/shadow.
              </span>,
              <span key="default">
                Default mundane Earth humans to <DocCode>godray</DocCode>. Prime-adjacent humans
                without supernatural traits also belong here.
              </span>,
              <span key="new-kind">
                Only create a new kind if the member's archetype clearly does not fit any existing
                one. If you do, add the kind to <DocCode>MemberAuraKind</DocCode>, build a sub-layer
                in <DocCode>member-aura.tsx</DocCode> following the <DocCode>FrameRoot</DocCode> +
                particle + slot-filter pattern, return null when the slot has no particles, and add
                a matching <DocCode>member-aura-*</DocCode> keyframe.
              </span>,
              "Particle counts per kind are tuned in the layer constructors; modal density is roughly double card density. Keep both bounded so a roster of focused cards does not paint thousands of particles per frame.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="aura-implementation" title="Implementation rules">
          <DocList
            items={[
              <span key="transform">
                Animations move particles via <DocCode>transform</DocCode> on container query units
                (<DocCode>cqh</DocCode>/<DocCode>cqw</DocCode>) so the same keyframe works at card
                density and modal density. Percent translates are relative to the element, not the
                parent, so they will not work; use container query units instead.
              </span>,
              <span key="pointer">
                <DocCode>pointer-events: none</DocCode> on every aura wrapper so the underlying
                click target still receives input. The button overlay sits at{" "}
                <DocCode>z-10</DocCode> while the front aura sits at <DocCode>z-[15]</DocCode>, both
                with no pointer events on the aura side.
              </span>,
              <span key="blend">
                Glow-style kinds (<DocCode>pulse</DocCode>, <DocCode>prism</DocCode>) use{" "}
                <DocCode>mix-blend-mode: screen</DocCode> so the radial gradient reads as light cast
                onto the surrounding background rather than as a fill.
              </span>,
              "Inline style is permitted on aura particles for the same reason as the chat bubble system: per-member colors and randomized values are data-driven and cannot live in static CSS.",
            ]}
          />
        </DocSubsection>
        <DocSubsection id="aura-reference-examples" title="Reference examples">
          <P>
            Sampled registry entries by kind. The full table lives in{" "}
            <DocCode>app/components/member-aura-registry.ts</DocCode>; focus a member in the Roster
            room of the playable shell to see any of these animate.
          </P>
          <DocCodeBlock language="ts">{`// godray: mundane Earth humans on Prime. Warm sun shafts.
"jenna-pike": {
  kind: "godray",
  tint: { primary: "rgba(255, 224, 168, 0.55)", glow: "rgba(255, 220, 160, 0.35)" },
},

// rune: eldritch entities. Norse glyphs floating up.
vhool: {
  kind: "rune",
  tint: { primary: "rgba(168, 130, 220, 0.85)", glow: "rgba(140, 96, 200, 0.55)" },
},

// petal: mythic, courtly, or fae. Soft falling petals.
"bai-wenshu": {
  kind: "petal",
  tint: { primary: "rgba(244, 114, 182, 0.95)", glow: "rgba(190, 24, 93, 0.65)" },
},

// pulse: characters with their own light source. Radial blooms at screen blend.
venus: {
  kind: "pulse",
  tint: { primary: "rgba(255, 224, 188, 0.55)", glow: "rgba(248, 196, 144, 0.55)" },
},

// pixelrain: tech-displaced or futuristic. Twinkling glowing star pixels.
"sera-vohn": {
  kind: "pixelrain",
  tint: { primary: "rgba(248, 88, 196, 0.85)", glow: "rgba(232, 60, 168, 0.55)" },
},

// ectoplasm: members displaced from when they should be. Drifting wispy motes.
"gideon-glass": {
  kind: "ectoplasm",
  tint: { primary: "rgba(180, 220, 240, 0.65)", glow: "rgba(140, 200, 230, 0.45)" },
},

// fieldmote: cryptids and uncanny companions. Earthy slow-drifting dots.
"calvin-hewes": {
  kind: "fieldmote",
  tint: { primary: "rgba(160, 188, 142, 0.6)", glow: "rgba(124, 156, 110, 0.4)" },
},

// ember: post-conflict refugees. SVG flame teardrops with cream cores.
"idris-mahari": {
  kind: "ember",
  tint: { primary: "rgba(220, 168, 124, 0.7)", glow: "rgba(180, 124, 88, 0.5)" },
},

// prism: bioluminescent or hue-shifting. Pulse plus continuous hue-rotate.
"naia-velorae": {
  kind: "prism",
  tint: { primary: "rgba(168, 232, 220, 0.6)", glow: "rgba(180, 196, 248, 0.55)" },
},`}</DocCodeBlock>
          <P>
            Tint is two rgba strings: <DocCode>primary</DocCode> is the bright particle color and{" "}
            <DocCode>glow</DocCode> is the halo or shadow. Default mundane Earth humans to{" "}
            <DocCode>godray</DocCode> with a warm cream tint; reach for a new kind only when the
            archetype clearly does not fit any existing one.
          </P>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "render-slots", title: "Render slots" },
      { id: "aura-kinds", title: "Kinds" },
      { id: "aura-authoring", title: "Authoring guidance for new members" },
      { id: "aura-implementation", title: "Implementation rules" },
      { id: "aura-reference-examples", title: "Reference examples" },
    ],
  },
  {
    id: "canvas-layout-and-floating-nav",
    title: "Canvas layout and floating nav",
    body: (
      <>
        <P>
          The playable shell uses a canvas-and-floating-nav layout instead of tab strips. After the
          splash, the shell hosts four rooms with their own staging. Live Date is the home room; the
          player lands there after onboarding.
        </P>
        <DocDefList
          items={[
            {
              term: "Live Date",
              def: (
                <>
                  The primary room. Setup happens inside this room and has three states. (1)
                  Planning: a three-step booking flow (focus case, partner, date plan) rendered by{" "}
                  <DocCode>app/components/pre-date-canvas.tsx</DocCode>. Sticky bottom dock carries
                  the Begin date CTA. (2) Active date: the live date UI takes the canvas full-bleed,
                  floating nav hides, and pacing controls live in the transport footer. (3) Wrap:
                  FinalReportPanel stays mounted, the header back button returns to Live Date
                  planning.
                </>
              ),
            },
            {
              term: "Roster",
              def: "Every member on file. Focus cases get a marked card. Closed members get a heart overlay, quit members get a red X overlay. Read-only sheets respect player knowledge visibility.",
            },
            {
              term: "Date Book",
              def: "A workbench, not a list. The left column shows the active budgeted deck as compact tile scenario cards with Roman numeral slot labels. The right column shows the unlocked library as a filtered, internally scrolling tile grid with search, risk filter, and sort dropdown. Clicking any card opens an oversized inspector modal. Add and drop actions are inspector-first, and the whole editor is read-only during an active booking.",
            },
            { term: "Files", def: "Notes archive ported into the canvas treatment." },
          ]}
        />
        <P>
          The floating nav cluster sits at the bottom right of every room. Four round buttons (Live
          Date, Roster, Date Book, Files) with rose accents on the active button. The cluster hides
          while a date is live so the live date room owns the canvas.
        </P>
        <DocSubsection id="scenario-card-system" title="Scenario card system">
          <P>
            <DocCode>app/components/scenario-card.tsx</DocCode> is the shared component used in the
            Date Book deck and library grids and the Live Date planning date-plan step. The
            scenario's <DocCode>assets/scenarios/{`{id}`}/background.webp</DocCode> renders as a
            readable ambient backdrop: barely blurred, held at ~45% opacity, seated under a ~42%
            cream wash plus a faint bottom wash for meter legibility. The image is mood and color,
            not picture. A glass risk badge sits top-left (LOW/MED/HIGH, color-coded). Content sits
            directly over the cream wash without a frosted panel, in three sizes:
          </P>
          <DocDefList
            items={[
              {
                term: "tile",
                def: (
                  <>
                    4:5 aspect, ~140px min height, <DocCode>rounded-[12px]</DocCode>. Used in both
                    Date Book grids. Compact chrome. Carries only the title.
                  </>
                ),
              },
              {
                term: "compact",
                def: (
                  <>
                    ~168px min height, <DocCode>rounded-[14px]</DocCode>. Used as the three drawn
                    cards in the Live Date planning date-plan step. Carries title, location,
                    summary, and compact meter row.
                  </>
                ),
              },
              {
                term: "full",
                def: (
                  <>
                    4:5 aspect, ~260px min height, <DocCode>rounded-[16px]</DocCode>. Retained for
                    feature surfaces. Mono LOCATION caption, title in{" "}
                    <DocCode>font-display</DocCode>, three-line summary, three-up stacked meter row.
                  </>
                ),
              },
            ]}
          />
          <P>
            Card states are <DocCode>default</DocCode>, <DocCode>selected</DocCode>, and{" "}
            <DocCode>disabled</DocCode>. Selected adds a rose ring, intensified shadow, and a{" "}
            <Strong>PICKED</Strong> badge in the top-right. Disabled desaturates the card. An
            orthogonal <DocCode>inHand</DocCode> prop marks today's draw with a rose-tinted ring,
            rose top highlight, and a <Strong>TODAY</Strong> glass chip in the top-right. When both{" "}
            <DocCode>inHand</DocCode> and <DocCode>selected</DocCode> apply, <Strong>PICKED</Strong>{" "}
            takes precedence in the corner. The card never shows raw scenario tags, exact pressure,
            or stat math.
          </P>
          <P>
            Two budget-aware affordances also sit on the card. The footer carries a small monospace
            cost chip (<DocCode>cost</DocCode> is an authored allocation value, so it is
            player-facing). When a budget period discount applies, the chip shows the base cost
            struck through next to the discounted effective cost. After pair commit, the date-plan
            cards may render a single Room Read aggregate pip beside the risk badge:{" "}
            <DocCode>steady</DocCode>, <DocCode>promising</DocCode>, or <DocCode>volatile</DocCode>.
            Tooltip and aria copy describe booking texture, never hidden causes (fit level,
            pressure, ask, boundary risk, tags, rule hits, request ids). See{" "}
            <DocLink to="/docs/gameplay/match-fit">Match fit</DocLink> for the source rules.
          </P>
        </DocSubsection>
      </>
    ),
    subsections: [{ id: "scenario-card-system", title: "Scenario card system" }],
  },
  {
    id: "what-not-to-build",
    title: "What not to build",
    body: (
      <DocCallout variant="danger">
        <DocList
          items={[
            "No marketing landing page for the playable game shell.",
            "No portrait-specific illustrated card backgrounds. Let Aura supply the frame.",
            "No new global CSS classes unless the change needs shared base styling across multiple components.",
            <span key="inline">
              No inline <DocCode>style=</DocCode> attributes for UI work, except the data-driven CSS
              variables on <DocCode>member-bubble</DocCode>, the scenario backdrop, and the member
              aura layer. Use Tailwind utilities through <DocCode>className</DocCode> everywhere
              else.
            </span>,
          ]}
        />
      </DocCallout>
    ),
  },
];

type ChatBubbleConfig = NonNullable<Member["chatBubble"]>;

function ChatBubbleReferenceExample({
  member,
  fixturePath,
  description,
}: {
  member: Member;
  fixturePath: string;
  description: string;
}) {
  const customBubble = member.chatBubble ? resolveMemberChatBubbleStyle(member.chatBubble) : null;
  const bubbleClass = customBubble ? customBubble.className : HOUSE_BUBBLE_LEFT_CLASS;
  const bubbleStyle = customBubble?.style;
  const accentStyle = customBubble?.accentStyle;
  const textColorClass = customBubble ? "" : "text-white";
  const nameClass = customBubble
    ? "text-[color:var(--member-bubble-accent)] opacity-80"
    : HOUSE_BUBBLE_NAME_CLASS;
  const configComment = member.chatBubble
    ? formatBubbleConfigComment(member.chatBubble)
    : "// chatBubble: falls through to the default house style";

  return (
    <article className="my-3 overflow-hidden rounded-tile border border-aura-hairline bg-gradient-to-b from-white/92 to-aura-bg/65 shadow-[0_18px_42px_-28px_rgba(15,23,42,0.22)]">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.74fr)]">
        <div className="flex flex-col gap-4 border-b border-aura-hairline p-5 xl:border-b-0 xl:border-r">
          <div className="space-y-2">
            <p className="font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
              <span className="text-aura-rose">{member.name}</span> // {fixturePath}
            </p>
            <p className="text-body leading-[1.7] text-aura-ink/86">{description}</p>
          </div>
          <div className="flex justify-start py-2">
            <div className="flex max-w-[42rem] flex-col items-start gap-2" style={accentStyle}>
              <span
                className={`relative z-20 px-3 text-left font-mono text-micro font-semibold uppercase tracking-[0.24em] ${nameClass}`}
              >
                {member.firstName}
              </span>
              <div className={bubbleClass} style={bubbleStyle}>
                <p className={`text-body leading-relaxed ${textColorClass}`}>
                  {pickChatBubbleSample(member)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white/55 p-5">
          <p className="mb-3 font-mono text-micro font-semibold uppercase tracking-[0.24em] text-aura-faint">
            // configuration comment
          </p>
          <pre className="overflow-x-auto font-mono text-label leading-[1.62] text-aura-ink/82">
            <code>{configComment}</code>
          </pre>
        </div>
      </div>
    </article>
  );
}

function pickChatBubbleSample(member: Member): string {
  const sample =
    member.voice.sampleMessages.hingeBits[0] ?? member.voice.sampleMessages.greeting[0];
  if (typeof sample === "string" && sample.trim().length > 0) {
    return sample;
  }
  return "I need one clean signal, one workable room, and paperwork that remembers where it lives.";
}

function formatBubbleConfigComment(bubble: ChatBubbleConfig): string {
  const backgroundLines =
    bubble.background.kind === "solid"
      ? [`// background.kind: solid`, `// background.color: ${bubble.background.color}`]
      : [
          `// background.kind: gradient`,
          `// background.angle: ${bubble.background.angle}`,
          `// background.stops: ${bubble.background.stops.join(", ")}`,
        ];

  const lines = [
    "// chatBubble",
    ...backgroundLines,
    `// textColor: ${bubble.textColor}`,
    `// shape: ${bubble.shape}`,
    bubble.tail ? `// tail: ${bubble.tail}` : null,
    bubble.border ? `// border: ${bubble.border}` : null,
    bubble.glow ? `// glow.color: ${bubble.glow.color}` : null,
    bubble.glow ? `// glow.intensity: ${bubble.glow.intensity}` : null,
    bubble.texture ? `// texture: ${bubble.texture}` : null,
    bubble.entryAnimation ? `// entryAnimation: ${bubble.entryAnimation}` : null,
    bubble.fontFamily ? `// fontFamily: ${bubble.fontFamily}` : null,
    bubble.textEffect ? `// textEffect: ${bubble.textEffect}` : null,
    bubble.accentColor ? `// accentColor: ${bubble.accentColor}` : null,
  ];

  return lines.filter((line): line is string => line !== null).join("\n");
}

type AudioQuality = "low" | "high" | "max";
type SettingsTab = "general" | "account" | "about";

function PrimitivesShowcase() {
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [explicitContent, setExplicitContent] = useState(true);
  const [audioMetadata, setAudioMetadata] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [quality, setQuality] = useState<AudioQuality>("max");
  const [tab, setTab] = useState<SettingsTab>("general");

  return (
    <div className="my-4 flex flex-col gap-8">
      <DocFigure title="chips" surface="plain">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="rose">rose</Chip>
          <Chip tone="violet">violet</Chip>
          <Chip tone="amber">amber</Chip>
          <Chip tone="emerald">emerald</Chip>
          <Chip tone="sky">sky</Chip>
          <Chip tone="fuchsia">fuchsia</Chip>
          <Chip tone="slate">slate</Chip>
          <Chip tone="neutral">neutral</Chip>
          <Chip tone="rose" dot>
            with dot
          </Chip>
          <Chip tone="emerald" size="tight">
            tight
          </Chip>
        </div>
      </DocFigure>

      <DocFigure title="segmented control" surface="plain">
        <div className="flex flex-wrap items-center gap-6">
          <SegmentedControl
            ariaLabel="Settings tabs"
            variant="underline"
            options={[
              { value: "general", label: "General" },
              { value: "account", label: "Account" },
              { value: "about", label: "About" },
            ]}
            value={tab}
            onChange={setTab}
          />
          <SegmentedControl
            ariaLabel="Density"
            options={[
              { value: "full", label: "full" },
              { value: "compact", label: "compact" },
            ]}
            value="full"
            onChange={() => {}}
          />
        </div>
      </DocFigure>

      <DocFigure title="settings rows" surface="plain">
        <SectionHeader eyebrow="// audio quality">Audio quality</SectionHeader>
        <SettingsList>
          <RadioRow
            name="quality"
            value="low"
            selected={quality}
            onSelect={setQuality}
            title="Low"
            description="Balance audio quality and data consumption"
            trailing={<Chip tone="neutral">320 kbps</Chip>}
          />
          <RadioRow
            name="quality"
            value="high"
            selected={quality}
            onSelect={setQuality}
            title="High"
            description="16-bit, 44.1 kHz"
          />
          <RadioRow
            name="quality"
            value="max"
            selected={quality}
            onSelect={setQuality}
            title="Max"
            description="Up to 24-bit, 192 kHz"
          />
        </SettingsList>

        <SectionHeader eyebrow="// playback">Playback</SectionHeader>
        <SettingsList>
          <SettingsRow
            title="Normalize volume"
            description="Set the same volume level for all tracks."
            control={
              <Toggle
                checked={normalizeVolume}
                onChange={setNormalizeVolume}
                label="Normalize volume"
              />
            }
          />
          <SettingsRow
            title="Autoplay"
            description="Play similar songs after the last track in your queue ends."
            control={<Toggle checked={autoplay} onChange={setAutoplay} label="Autoplay" />}
          />
          <SettingsRow
            title="Explicit content"
            description="Allow or restrict explicit content labeled with the E tag."
            control={
              <Toggle
                checked={explicitContent}
                onChange={setExplicitContent}
                label="Explicit content"
              />
            }
          />
          <ChevronLinkRow
            to="/docs/product/visual-design#component-library"
            title="Blocked"
            description="View and edit your blocked content."
          />
        </SettingsList>

        <SectionHeader eyebrow="// display">Display</SectionHeader>
        <SettingsList>
          <SettingsRow
            title="Audio metadata"
            description="Show additional fields (e.g. BPM) in track lists."
            control={
              <Toggle checked={audioMetadata} onChange={setAudioMetadata} label="Audio metadata" />
            }
          />
        </SettingsList>
      </DocFigure>
    </div>
  );
}

export default function VisualDesignDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
