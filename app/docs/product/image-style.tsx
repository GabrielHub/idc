import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocDefList,
  DocImageGrid,
  DocLink,
  DocList,
  DocPage,
  DocPipeline,
  DocSubsection,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/image-style",
  group: "product",
  title: "Image style and asset pipeline",
  description:
    "Portrait style, canvas contract, prompt construction, cutout pipeline, scenario backgrounds, and acceptance checks.",
  order: 5,
};

export const lede = (
  <>
    This document owns IDC image asset style, portrait generation prompts, and the cutout pipeline.{" "}
    <DocLink to="/docs/product/visual-design">Visual design</DocLink> owns the Aura interface
    direction and Tailwind theme tokens. Together they define how the world looks on screen.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "portrait-style",
    title: "Portrait style",
    body: (
      <>
        <P>Member portraits use a webtoon, manhwa, and manhua inspired style.</P>
        <P>The reference direction is:</P>
        <DocList
          items={[
            "Clean anime-webtoon, manhwa, and manhua line work",
            "Large expressive eyes",
            "Polished cel-shaded faces",
            "Glossy hair with strong highlight shapes",
            "Elegant costume silhouettes",
            "Soft gradient shadowing",
            "High color contrast on accents",
            "Romantic supernatural drama",
            "Pretty, readable, character-forward composition",
          ]}
        />
        <P>
          Portraits should look like premium character cards adapted into clean UI cutouts. The
          style can be glamorous and dramatic, but portraits must still read clearly at member-card
          size.
        </P>
        <P>
          Use this lineup as the go-to reference when generating or reviewing a new portrait. It
          covers the working range: regular human baseline, stylized supernatural human, fully
          non-human silhouette, and warm character-forward composition.
        </P>
        <DocImageGrid
          cols={4}
          size="portrait"
          items={[
            {
              src: "/assets/portraits/gabriel-tan/portrait.png",
              alt: "Gabriel Tan full-body reference portrait",
              caption: "Gabriel Tan · regular human baseline",
            },
            {
              src: "/assets/portraits/sienna-bae/portrait.png",
              alt: "Sienna Bae full-body reference portrait",
              caption: "Sienna Bae · stylized supernatural",
            },
            {
              src: "/assets/portraits/anubis/portrait.png",
              alt: "Anubis full-body reference portrait",
              caption: "Anubis · non-human silhouette",
            },
            {
              src: "/assets/portraits/cassie-conners/portrait.png",
              alt: "Cassie Conners full-body reference portrait",
              caption: "Cassie Conners · warm character-forward",
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "per-member-asset-set",
    title: "Per-member asset set",
    body: (
      <>
        <P>Each member gets two neutral baseline images:</P>
        <DocDefList
          items={[
            {
              term: "Full-body portrait",
              def: "Complete character visible from head to feet. Pose reads like a polished first photo on a dating profile: relaxed, intentional, flattering, character revealing.",
            },
            {
              term: "Upper-half avatar",
              def: "Same character, used as a profile picture. Pose reads like a realistic profile picture: close, natural, approachable, less theatrical than the full-body.",
            },
          ]}
        />
        <P>
          The avatar and full-body must be visibly different pictures while preserving the member's
          readable identity. The avatar can use a different perspective, a selfie angle, a
          prop-in-hand crop, or another profile-photo framing when that fits the member. Generate
          the avatar as a follow-up to the full-body so the full-body acts as the character anchor.
        </P>
        <DocImageGrid
          cols={2}
          size="portrait"
          items={[
            {
              src: "/assets/portraits/cassie-conners/portrait.png",
              alt: "Cassie Conners full-body reference",
              caption: "Cassie Conners · full-body · playful in-air pose",
            },
            {
              src: "/assets/portraits/cassie-conners/avatar.png",
              alt: "Cassie Conners avatar reference",
              caption: "Cassie Conners · avatar · closer profile crop",
            },
          ]}
        />
        <P>
          Reaver shows the approved upper-half latitude: the avatar reads as a picture taken by the
          character, not a passport crop of the neutral standee.
        </P>
        <DocImageGrid
          cols={2}
          size="portrait"
          items={[
            {
              src: "/assets/portraits/reaver/portrait.png",
              alt: "Reaver neutral full-body reference",
              caption: "Reaver | neutral full-body",
            },
            {
              src: "/assets/portraits/reaver/avatar.png",
              alt: "Reaver avatar selfie reference",
              caption: "Reaver | avatar | selfie perspective",
            },
          ]}
        />
        <DocCallout variant="info" title="Approved exception">
          Junie Marrow's neutral avatar keeps Otis in the opaque background and is still referenced
          through the runtime avatar path. Treat it as approved avatar art, not as a failed cutout,
          unless visual direction changes.
        </DocCallout>
        <P>Optional date-surface variants are full-body portraits only. Avatars stay neutral.</P>
        <P>Supported variant file names:</P>
        <DocCodeBlock>{`portrait-flirty.png
portrait-confused.png
portrait-angry.png`}</DocCodeBlock>
        <P>
          Members may ship with any subset of these variants. The UI falls back to{" "}
          <DocCode>portrait.png</DocCode> when a requested variant is missing or still marked{" "}
          <DocCode>pending</DocCode>.
        </P>
      </>
    ),
  },
  {
    id: "variation-latitude",
    title: "Variation latitude",
    body: (
      <>
        <P>
          Portraits are pictures of members, not frozen model sheets. Identity anchors still matter,
          but approved asset sets can move the camera, pose, props, and visible form when the change
          fits the member and stays inside the canvas contract.
        </P>
        <DocDefList
          items={[
            {
              term: "Props",
              def: (
                <>
                  Props are exchangeable unless they are part of the body, outfit, required kit, or
                  supernatural hook. A prop that appears in the neutral portrait can disappear,
                  change, or trade for another member-fitting prop in a variant or avatar. Do not
                  treat neutral props as permanent facts unless the fixture or approved visual
                  direction says they are.
                </>
              ),
            },
            {
              term: "Pose and support",
              def: (
                <>
                  Variants may make large pose changes, including sitting, leaning, crouching, or
                  using a support surface. Tasha's flirty asset is the reference: she sits on a
                  fading table even though the neutral image is a standing portrait.
                </>
              ),
            },
            {
              term: "Perspective",
              def: (
                <>
                  Avatars can look like photos taken of the character, including selfie angles,
                  tilted phone framing, or close profile-picture crops. The review target is member
                  identity and small-card readability, not strict camera continuity with the neutral
                  standee.
                </>
              ),
            },
            {
              term: "Mutable form",
              def: (
                <>
                  Some non-human members can visibly change between assets. Vhool and Cthala may
                  shift silhouette details, faces, eyes, aura effects, and apparent form when the
                  change matches their fixture and approved visual direction. Preserve identity,
                  palette logic, and UI readability.
                </>
              ),
            },
          ]}
        />
        <DocImageGrid
          cols={4}
          size="portrait"
          items={[
            {
              src: "/assets/portraits/tasha-rell/portrait.png",
              alt: "Tasha Rell neutral full-body reference",
              caption: "Tasha Rell | neutral | standing baseline",
            },
            {
              src: "/assets/portraits/tasha-rell/portrait-flirty.png",
              alt: "Tasha Rell flirty seated reference",
              caption: "Tasha Rell | flirty | seated table prop",
            },
            {
              src: "/assets/portraits/reaver/portrait.png",
              alt: "Reaver neutral full-body reference",
              caption: "Reaver | neutral | standee camera",
            },
            {
              src: "/assets/portraits/reaver/avatar.png",
              alt: "Reaver avatar selfie reference",
              caption: "Reaver | avatar | picture taken by him",
            },
          ]}
        />
        <DocImageGrid
          cols={4}
          size="portrait"
          items={[
            {
              src: "/assets/portraits/vhool/portrait.png",
              alt: "Vhool neutral full-body reference",
              caption: "Vhool | neutral | contained eldritch form",
            },
            {
              src: "/assets/portraits/vhool/portrait-flirty.png",
              alt: "Vhool flirty mutable-form reference",
              caption: "Vhool | flirty | form expands",
            },
            {
              src: "/assets/portraits/cthala/portrait.png",
              alt: "Cthala neutral full-body reference",
              caption: "Cthala | neutral | chosen form",
            },
            {
              src: "/assets/portraits/cthala/portrait-angry.png",
              alt: "Cthala angry mutable-form reference",
              caption: "Cthala | angry | face changes",
            },
          ]}
        />
        <DocCallout variant="warn" title="Identity still wins">
          These exceptions are not permission to redesign a member. The face, palette logic,
          silhouette family, outfit language, and supernatural read must still connect to the
          fixture and approved references. If the change makes the member hard to identify at card
          or standee size, revise the asset.
        </DocCallout>
      </>
    ),
  },
  {
    id: "portrait-canvas-contract",
    title: "Portrait canvas contract",
    body: (
      <>
        <P>
          Full-body portraits are date standee assets, so their canvas geometry is part of the
          product contract, not a loose generation preference.
        </P>
        <DocList
          items={[
            <span key="canvas">
              Neutral full-body sources and full-body expression variant sources must be PNG files
              at exactly <DocCode>887x1774</DocCode>.
            </span>,
            <span key="aspect">
              The required full-body aspect ratio is <DocCode>0.500</DocCode>, matching the good
              standee-safe reference family.
            </span>,
            <span key="bg">
              Full-body sources must use a plain white opaque background. Runtime cutouts must
              preserve the same <DocCode>887x1774</DocCode> canvas after background removal.
            </span>,
            "The complete character must be visible from head to feet, centered, and large on the canvas. The visible character area should use most of the canvas height without cropped hair, feet, carried props, or supernatural silhouette details.",
            <span key="audit">
              In a <DocCode>256x520</DocCode> standee audit frame, visible character height should
              land near <DocCode>470px</DocCode> or higher unless the approved pose is intentionally
              seated or crouched and that exception is documented in the asset review.
            </span>,
            <span key="crop">
              If a generation tool returns a nearby tall image, crop or pad to{" "}
              <DocCode>887x1774</DocCode> without stretching the character. Do not ship full-body
              portraits at <DocCode>1024x1536</DocCode>, square, landscape, or other wide ratios.
            </span>,
            "Do not correct undersized standees with one-off member-specific CSS scaling at call sites. Fix the source geometry and rerun the cutout pipeline, or update the shared standee source-scale registry only after height review.",
          ]}
        />
      </>
    ),
  },
  {
    id: "character-height-canon",
    title: "Character height canon",
    body: (
      <P>
        <DocLink to="/docs/product/character-heights">Character heights</DocLink> owns character
        height canon, source-scale normalization, the playground Height lineup workflow, and genuine
        profile-height measurement. Full-body portraits must support that workflow. A portrait with
        excess transparent padding, cropped feet, an unmeasurable head, or a pose that cannot be
        normalized against the roster is not ready for final height review. Use the playground
        Height lineup view after changing height canon or portrait assets.
      </P>
    ),
  },
  {
    id: "prompt-construction",
    title: "Prompt construction",
    body: (
      <>
        <P>
          Image-generation prompts belong to the independent visual asset workflow, not the member
          or scenario fixture workflow. Prompts are production working material and must not be
          stored in member fixtures, scenario fixtures, or <DocCode>portraitAsset.prompt</DocCode>.
        </P>
        <P>
          Image-generation prompts in this project follow the OpenAI image prompting guidance: write
          in a consistent order (scene then subject then key details then constraints), use labeled
          segments instead of one long paragraph, and state exclusions explicitly. State what must
          remain invariant when iterating, so the model does not redesign the character between
          images.
        </P>
        <P>Every IDC portrait prompt has these labeled segments:</P>
        <DocDefList
          items={[
            {
              term: "Setting",
              def: "Where the character is rendered. Baseline portraits always use a plain white opaque background.",
            },
            { term: "Subject", def: "Who the character is, in one short line." },
            {
              term: "Style",
              def: "The webtoon / manhwa / manhua medium and the rendering treatment.",
            },
            {
              term: "Composition",
              def: "Framing, viewpoint, pose intent, silhouette readability.",
            },
            { term: "Expression", def: "Neutral baseline, lightly pleasant." },
            {
              term: "Character details",
              def: "Pulled from the member fixture (species or origin, age presentation, hair / face / silhouette, outfit language, personality cues, one supernatural visual hook).",
            },
            { term: "Constraints", def: "Explicit list of what to exclude." },
          ]}
        />
        <DocCallout variant="warn">
          Keep the character details block tight. Do not paste lore. The details that affect pixels
          go in; the narrative goes to the Performer at runtime, not to the image model.
        </DocCallout>
        <DocSubsection id="full-body-prompt" title="Full-body portrait prompt">
          <DocCodeBlock>{`Setting: plain white opaque background. No scenery, no floor, no shadow plane, no props beyond what the character carries.
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
Constraints: no text, no logos, no watermarks, no frames, no UI, no scenery, no cropped feet. Do not copy any existing reference character, outfit, pose, or composition. Avoid photorealism, western comic rendering, chibi proportions, oil-paint texture, sketchy unfinished line work, and busy illustrated backgrounds.`}</DocCodeBlock>
        </DocSubsection>
        <DocSubsection id="avatar-prompt" title="Avatar prompt">
          <P>
            Generate the avatar after the full-body portrait, with the full-body image attached as a
            character reference. Repeat the preservation list every time so drift stays low.
          </P>
          <DocCodeBlock>{`Setting: plain white opaque background. No scenery, no floor, no shadow plane, no loose props unless the avatar uses a member-specific carried prop or selfie crop.
Subject: the same character as the attached full-body portrait, rendered as a profile picture avatar.
Style: webtoon, manhwa, and manhua inspired character art. Clean anime line work, expressive eyes, polished cel shading, glossy hair with strong highlight shapes, soft gradient shadowing. Match the established character design.
Composition: upper-half framing from roughly the chest up, centered or intentionally selfie-framed, with readable silhouette and strong separation from the background. Eye-level or natural phone-camera angle. Pose reads like a realistic profile picture: close, natural, approachable, less theatrical than the full-body.
Expression: neutral baseline, lightly pleasant.
Character preservation: same facial features, hair shape and color, eye color, skin tone, color palette, and outfit as the full-body portrait. Visibly different pose from the full-body. Do not redesign the character.
Constraints: no text, no logos, no watermarks, no frames, no UI, no scenery, no flat corporate avatar look, no cropped face without usable shoulders. Avoid photorealism, western comic rendering, chibi proportions, oil-paint texture, sketchy unfinished line work, and busy illustrated backgrounds.`}</DocCodeBlock>
        </DocSubsection>
        <DocSubsection id="character-details-block" title="Filling the character details block">
          <P>Pull the six details directly from the member fixture. Keep each line concrete:</P>
          <DocList
            items={[
              <span key="origin">
                <Strong>"Species or origin: timeline-displaced 1970s waitress"</Strong> beats
                "human."
              </span>,
              <span key="hair">
                <Strong>
                  "Hair, face, silhouette: shoulder-length copper hair with blunt fringe, high
                  cheekbones, slim shoulders"
                </Strong>{" "}
                beats "pretty."
              </span>,
              <span key="outfit">
                <Strong>
                  "Outfit language: faded mint diner uniform, white apron with order pad in pocket,
                  scuffed white sneakers"
                </Strong>{" "}
                beats "casual outfit."
              </span>,
              <span key="hook">
                <Strong>
                  "Supernatural visual hook: faintly lit clock face on the inside of her left wrist"
                </Strong>{" "}
                beats "magical aura."
              </span>,
            ]}
          />
          <P>If a fixture detail does not change pixels, leave it out.</P>
        </DocSubsection>
        <DocSubsection id="iterating-on-a-portrait" title="Iterating on a portrait">
          <P>
            Make small, single-change follow-ups. After every generated image, inspect the result
            and write adjustment recommendations before generating again. Reference the previous
            image and state what must not change.
          </P>
          <P>
            Example:{" "}
            <em>
              Same character, new pose. Keep facial features, hair, color palette, and outfit
              unchanged. Only change the pose and hand position.
            </em>
          </P>
          <P>
            Do not stack multiple changes per iteration. Drift is harder to debug when several
            variables move at once.
          </P>
        </DocSubsection>
        <DocSubsection id="variant-prompts" title="Full-body expression variants">
          <P>
            Generate expression variants from the approved neutral full-body portrait. Attach only
            the original approved neutral full-body portrait as the character reference unless the
            user explicitly gives another reference image and says to attach it. Do not attach
            failed candidates, previous variant outputs, avatar crops, contact sheets, or a mixed
            image history. This keeps variant generation from inheriting visual drift.
          </P>
          <P>
            Default to preserving the same face, hair, body proportions, outfit, palette,
            supernatural hook, rendering style, and plain white background. Approved exceptions can
            exchange props, add a support surface, change camera perspective, or shift mutable
            supernatural features when the member needs it. The asset must still read as the same
            member.
          </P>
          <DocDefList
            items={[
              {
                term: "flirty",
                def: "Warmer romantic interest. The pose can soften, lean in, or carry a confident smile, but should stay in character.",
              },
              {
                term: "confused",
                def: "Uncertainty, awkward concern, checked-out hesitation, or trying to understand the moment. Avoid slapstick confusion.",
              },
              {
                term: "angry",
                def: "Internal gameplay name for a negative boundary state. The image prompt should not simply ask for anger. Describe the member-specific read: distressed, concerned, guarded, irritated, cold, disinterested, or visibly angry.",
              },
            ]}
          />
          <P>
            Anubis is the reference for a non-human variant set: same outfit, palette, and
            supernatural hook across all four images, with only posture and body language shifting.
            The angry variant reads as guarded and cold rather than literal anger, which is the
            intent.
          </P>
          <DocImageGrid
            cols={4}
            size="portrait"
            items={[
              {
                src: "/assets/portraits/anubis/portrait.png",
                alt: "Anubis neutral full-body reference",
                caption: "neutral",
              },
              {
                src: "/assets/portraits/anubis/portrait-flirty.png",
                alt: "Anubis flirty variant reference",
                caption: "flirty",
              },
              {
                src: "/assets/portraits/anubis/portrait-confused.png",
                alt: "Anubis confused variant reference",
                caption: "confused",
              },
              {
                src: "/assets/portraits/anubis/portrait-angry.png",
                alt: "Anubis angry variant reference",
                caption: "angry · reads as guarded",
              },
            ]}
          />
          <DocCodeBlock>{`Setting: plain white opaque background. No scenery, no floor, no shadow plane, no loose props unless the variant needs a member-specific prop or support surface.
Subject: the same character as the attached approved full-body portrait.
Style: webtoon, manhwa, and manhua inspired character art. Match the established rendering style.
Composition: final PNG canvas must be exactly 887x1774. Full body visible from head to feet, centered, readable silhouette. Character should use most of the canvas height. A seated, leaning, crouched, or perspective-shifted pose is allowed when the variant needs it.
Expression: <variant-specific expression and body language>.
Character preservation: same readable identity, palette logic, outfit language, and supernatural read as the approved full-body portrait. Preserve exact accessories and form unless this member has approved prop exchange or mutable-form direction. Do not redesign the character.
Constraints: no text, no logos, no watermarks, no frames, no UI, no scenery, no cropped feet. Avoid photorealism, western comic rendering, chibi proportions, oil-paint texture, sketchy unfinished line work, and busy illustrated backgrounds.`}</DocCodeBlock>
        </DocSubsection>
      </>
    ),
    subsections: [
      { id: "full-body-prompt", title: "Full-body portrait prompt" },
      { id: "avatar-prompt", title: "Avatar prompt" },
      { id: "character-details-block", title: "Filling the character details block" },
      { id: "iterating-on-a-portrait", title: "Iterating on a portrait" },
      { id: "variant-prompts", title: "Full-body expression variants" },
    ],
  },
  {
    id: "avoid",
    title: "Avoid",
    body: (
      <DocCallout variant="danger">
        <DocList
          items={[
            "Photorealism",
            "Western comic rendering",
            "Chibi proportions",
            "Heavy oil-paint texture",
            "Sketchy unfinished line work",
            "Busy illustrated backgrounds",
            "Cropped faces without usable shoulders or silhouette",
            "Overly tiny full-body portraits that fail when cropped",
            "Flat corporate avatar style",
            <span key="concept">
              Concept-art language ("rough sketch," "study," "WIP"); describe the asset as if it
              already exists
            </span>,
          ]}
        />
      </DocCallout>
    ),
  },
  {
    id: "cutout-pipeline",
    title: "Cutout pipeline",
    body: (
      <>
        <DocPipeline
          title="portrait pipeline"
          steps={[
            {
              id: "source",
              kind: "input",
              label: "Source PNG",
              detail: "assets-source / 887×1774 / white background",
            },
            {
              id: "review",
              kind: "guard",
              label: "Approval review",
              detail: "style, canvas, character match",
            },
            {
              id: "cutout",
              kind: "process",
              label: "Background removal",
              detail: "vp run portrait:cutout / bria-rmbg",
            },
            {
              id: "resize",
              kind: "process",
              label: "Resize avatars",
              detail: "vp run portrait:resize-avatars (128/256/512)",
            },
            {
              id: "palette",
              kind: "process",
              label: "Generate palettes",
              detail: "vp run portrait:palettes",
            },
            {
              id: "ship",
              kind: "output",
              label: "Runtime cutouts",
              detail: "cutouts plus portrait-palettes.generated.ts",
            },
          ]}
        />
        <P>Source images are production-time assets and belong outside the shipped client tree:</P>
        <DocCodeBlock>{`assets-source/portraits/<member-id>/
  portrait.png
  avatar.png
  portrait-flirty.png
  portrait-confused.png
  portrait-angry.png`}</DocCodeBlock>
        <P>Transparent cutouts are runtime assets and belong in:</P>
        <DocCodeBlock>{`public/assets/portraits/<member-id>/
  portrait.png
  avatar.png
  avatar-128.png
  avatar-256.png
  avatar-512.png
  portrait-flirty.png
  portrait-confused.png
  portrait-angry.png`}</DocCodeBlock>
        <P>
          Each member owns one folder in both locations. Use <DocCode>portrait.png</DocCode> for the
          neutral full-body image and <DocCode>avatar.png</DocCode> for the upper-half image. Use{" "}
          <DocCode>portrait-&lt;variant&gt;.png</DocCode> for optional full-body expression
          variants. The <DocCode>avatar-&lt;width&gt;.png</DocCode> files are downscaled siblings
          used by the runtime <DocCode>srcset</DocCode> so the browser fetches a UI-sized PNG
          instead of the multi-megabyte source. Runtime avatar <DocCode>srcset</DocCode> candidates
          intentionally stop at <DocCode>avatar-512.png</DocCode>; do not add{" "}
          <DocCode>avatar.png</DocCode> back as a high-density candidate for avatar surfaces. Do not
          put member files back under <DocCode>public/assets/portraits/cutout/</DocCode>; that flat
          folder no longer matches the fixture contract.
        </P>
        <DocCallout variant="warn">
          Do not place source images under <DocCode>public/assets/portraits/source</DocCode>. Vite
          copies <DocCode>public</DocCode> into the client build, so files there ship even when the
          UI never references them.
        </DocCallout>
        <P>Commands:</P>
        <DocCodeBlock language="bash">{`vp run portrait:cutout --input assets-source/portraits/member-id --output public/assets/portraits/member-id --overwrite
vp run portrait:cutout --input assets-source/portraits --output public/assets/portraits --recursive --overwrite`}</DocCodeBlock>
        <P>
          Default background removal model: <DocCode>bria-rmbg</DocCode>. Only run background
          removal after source images have been approved for check-in.
        </P>
        <P>
          After regenerating an avatar cutout, regenerate the width variants used by the runtime{" "}
          <DocCode>srcset</DocCode>:
        </P>
        <DocCodeBlock language="bash">{`vp run portrait:resize-avatars`}</DocCodeBlock>
        <P>
          The script walks <DocCode>public/assets/portraits/&lt;member-id&gt;/avatar.png</DocCode>,
          writes <DocCode>avatar-128.png</DocCode>, <DocCode>avatar-256.png</DocCode>, and{" "}
          <DocCode>avatar-512.png</DocCode> next to each, and skips files whose variants are newer
          than the source. Pass <DocCode>--overwrite</DocCode> after editing the resize logic
          itself.
        </P>
        <P>
          After changing any full-body portrait cutout, regenerate the standee footing table so live
          date standees ground from the visible feet instead of transparent canvas padding:
        </P>
        <DocCodeBlock language="bash">{`vp run portrait:standee-footing`}</DocCodeBlock>
        <P>
          After changing any neutral full-body portrait cutout, regenerate the portrait palette
          manifest used by roster cards and member modals:
        </P>
        <DocCodeBlock language="bash">{`vp run portrait:palettes`}</DocCodeBlock>
      </>
    ),
  },
  {
    id: "ui-usage",
    title: "UI usage",
    body: (
      <P>
        Use full-body portrait cutouts for roster member-card art, profile panels, selected match
        panels, and date surfaces where the character can occupy a taller frame. Use avatar cutouts
        in compact profile surfaces and circular in-card identity chips. Member-card and member
        modal color palettes come from <DocCode>portrait-palettes.generated.ts</DocCode>, generated
        from approved neutral full-body cutouts at asset time. Do not reintroduce runtime canvas
        sampling for these surfaces. Keep both images large enough to establish character identity.
        Portraits should sit inside the Aura UI language defined in{" "}
        <DocLink to="/docs/product/visual-design">Visual design</DocLink>. Do not give every
        portrait its own illustrated card background. Let the dashboard provide the frame and let
        the cutout provide character.
      </P>
    ),
  },
  {
    id: "scenario-backgrounds",
    title: "Scenario backgrounds",
    body: (
      <>
        <P>
          Scenario backgrounds are ambient room art for the brief and live date scene. They should
          add place and pressure without replacing the Aura operations shell or becoming a card
          texture.
        </P>
        <P>Source images belong outside the shipped client tree:</P>
        <DocCodeBlock>{`assets-source/scenarios/<scenario-id>/background.png`}</DocCodeBlock>
        <P>Runtime images belong in:</P>
        <DocCodeBlock>{`public/assets/scenarios/<scenario-id>/background.webp`}</DocCodeBlock>
        <P>Approved runtime backgrounds must also be listed in:</P>
        <DocCodeBlock>{`public/assets/scenarios/manifest.json`}</DocCodeBlock>
        <P>
          The manifest prevents the app from probing missing image paths. Scenarios not listed in
          the manifest fall back to the default Aura mesh without a broken request.
        </P>
        <P>
          Generate scenario backgrounds as bright webtoon, manhwa, and manhua inspired environment
          art. Use the scenario public brief as the source of truth. Creative contextual details are
          allowed when they fit the public room, but image details must not reveal private member
          facts, hidden outcomes, exact gameplay values, or future event results.
        </P>
        <P>
          Composition should keep the center transcript lane calm: the middle 45 to 55 percent
          should stay bright, lower contrast, and readable after blur. Denser props, architectural
          detail, dramatic lighting, or supernatural pressure can live near the edges, upper
          corners, or far background. The runtime treats scenario backgrounds as cover images, so
          the source must tolerate edge cropping across wide desktop viewports. It always applies
          blur, a cream veil, and edge gradients, so the approved source should still look useful
          when softened and cropped.
        </P>
        <P>
          Scenario backgrounds span a wide genre range. Use this lineup as the reference for how the
          same composition rules (calm center, denser detail at edges, supernatural cues in props
          rather than the middle lane) read across earthly, fantasy, sci-fi, and mythic settings.
        </P>
        <DocImageGrid
          cols={2}
          size="scene"
          items={[
            {
              src: "/assets/scenarios/diner-eleven-pm/background.webp",
              alt: "Diner Eleven PM scenario background reference",
              caption: "diner-eleven-pm · earth · ordinary life, late-night booth",
            },
            {
              src: "/assets/scenarios/hedge-witch-tea-hour/background.webp",
              alt: "Hedge witch tea hour scenario background reference",
              caption: "hedge-witch-tea-hour · fantasy · cozy witch tearoom",
            },
            {
              src: "/assets/scenarios/mess-hall-auriga/background.webp",
              alt: "Mess hall Auriga scenario background reference",
              caption: "mess-hall-auriga · sci-fi · ship mess with starfield viewport",
            },
            {
              src: "/assets/scenarios/olympus-bottomless-brunch/background.webp",
              alt: "Olympus bottomless brunch scenario background reference",
              caption: "olympus-bottomless-brunch · mythic · marble terrace over a cloud city",
            },
          ]}
        />
        <P>
          One background per scenario is the default. Event-specific backgrounds are future scope
          and should only be added if the date flow needs scene-level visual state.
        </P>
      </>
    ),
  },
  {
    id: "acceptance-checks",
    title: "Acceptance checks",
    body: (
      <DocCallout variant="ok" title="A portrait is acceptable when">
        <DocList
          items={[
            "Both images read as webtoon, manhwa, or manhua inspired.",
            "It is an original character.",
            "Both source images have white backgrounds.",
            <span key="cutouts">
              Both images have clean transparent cutouts after <DocCode>bria-rmbg</DocCode>, with no
              halos or fringing.
            </span>,
            <span key="canvas">
              Every full-body source and full-body expression variant source is exactly{" "}
              <DocCode>887x1774</DocCode>.
            </span>,
            <span key="runtime">
              Every full-body runtime cutout preserves the <DocCode>887x1774</DocCode> canvas after
              background removal.
            </span>,
            <span key="standee">
              Every full-body portrait uses a standee-safe visible character scale, with{" "}
              <DocCode>256x520</DocCode> audit visible height near <DocCode>470px</DocCode> or
              higher unless a documented seated or crouched pose requires less.
            </span>,
            "The full-body portrait shows the complete character from head to feet and can be cropped later.",
            "The avatar works at small member-card size.",
            "The avatar preserves the full-body's facial features, hair, color palette, and outfit while showing a visibly different pose.",
            "Expression variants preserve the approved neutral identity anchors. Default changes are expression, posture, and controlled body language, but approved variants may exchange props, use support surfaces, shift perspective, or alter mutable supernatural features when documented and readable.",
            "Both images match the member fixture details.",
            <span key="visual-description">
              The member fixture <DocCode>visualDescription</DocCode> matches the approved neutral
              portrait and stays public, visual, and free of inferred private lore.
            </span>,
            "Neither image fights the Aura interface palette.",
          ]}
        />
      </DocCallout>
    ),
  },
];

export default function ImageStyleDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
