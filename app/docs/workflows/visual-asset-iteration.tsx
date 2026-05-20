import {
  DocCallout,
  DocCode,
  DocCodeBlock,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  P,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "workflows/visual-asset-iteration",
  group: "workflows",
  title: "Visual asset iteration",
  description:
    "Independent workflow for member portraits, expression variants, avatars, and scenario backgrounds. Image agent only.",
  order: 2,
};

export const lede = (
  <>
    Use this workflow for member portraits, member portrait variants, avatars, and scenario
    backgrounds. This is separate from fixture authoring. The member or scenario content pass should
    already be complete enough to provide public visual facts, but it should not have generated
    image prompts or images.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "ground-rules",
    title: "Ground rules",
    body: (
      <>
        <P>Use an agent with image generation capability for this workflow.</P>
        <DocList
          items={[
            "Work one subject at a time. Do not batch create members, portraits, variants, avatars, or scenario backgrounds.",
            "Keep each image thread clean. Do not carry failed candidates into later generations unless the user explicitly asks for that image as a reference.",
            "After each generated image, inspect the image and write adjustment recommendations before the next generation.",
            <span key="no-prompt">
              Do not store image prompts in member fixtures, scenario fixtures, or{" "}
              <DocCode>portraitAsset.prompt</DocCode>.
            </span>,
            "Use fixture facts as visual inputs. Do not reveal hidden member facts, future outcomes, private secrets, exact gameplay values, or unearned player knowledge in an image.",
            <span key="image-style">
              Check final assets against{" "}
              <DocLink to="/docs/product/image-style">Image style</DocLink> before approval.
            </span>,
            <span key="variation-latitude">
              Check prop exchange, perspective changes, seated poses, and mutable forms against{" "}
              <DocLink to="/docs/product/image-style#variation-latitude">
                Image style, Variation latitude
              </DocLink>
              .
            </span>,
            <span key="heights">
              Check member full-body height reads against{" "}
              <DocLink to="/docs/product/character-heights">Character heights</DocLink> after the
              approved cutout exists.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "member-portrait-sequence",
    title: "Member portrait sequence",
    body: (
      <DocSteps
        items={[
          "Start with one member only.",
          "Draft a neutral full-body portrait prompt from public fixture facts and pixel-relevant details.",
          "Generate one neutral full-body candidate.",
          "Inspect the candidate. Check canvas ratio, complete head-to-feet framing, white background, character scale, outfit, face readability, visual hook, and fit with Aura.",
          "Give adjustment recommendations. Keep the next prompt to one or two controlled changes.",
          "Repeat until the neutral full-body portrait is approved.",
          <span key="visual-description">
            After approval, write <DocCode>visualDescription</DocCode> into the member fixture from
            the approved neutral portrait. Keep it visual, public, and roleplay-safe: body read,
            hair, outfit, posture, visible accessories, and supernatural visual hook only. Do not
            infer private biography, secrets, species labels, hidden tags, mood stats, or future
            outcomes from the image.
          </span>,
          "Generate the avatar only after the neutral full-body portrait is approved. Attach the approved neutral full-body portrait as the character reference.",
          "Inspect the avatar. Check face match, in-character perspective, small-card readability, white background, and absence of redesign. Selfie angles and picture taken of the member framing are allowed when they fit the member.",
          "Give adjustment recommendations and iterate until approved.",
        ]}
      />
    ),
  },
  {
    id: "member-height-calibration",
    title: "Member height calibration",
    body: (
      <>
        <P>
          Run this pass after the approved neutral full-body cutout exists and before treating a
          member's height values as final.
        </P>
        <DocSteps
          items={[
            "Open the playground Height lineup.",
            "Compare the member against locked generated-height anchors and nearby roster members.",
            "Adjust source-scale review first until the face and head scale read correctly next to the anchors.",
            "Then compare the normalized visual height against the Derek-derived 6 ft guide and relative characters.",
            "Ignore hats, ears, props, aura effects, and empty shoe-to-canvas-bottom space when reading body height.",
            "Subtract an estimated footwear amount, then compensate for head tilt, lean, crouch, or floating posture.",
            <span key="apply">
              Apply any fixture changes using the rules in{" "}
              <DocLink to="/docs/product/character-heights">Character heights</DocLink>.
            </span>,
          ]}
        />
      </>
    ),
  },
  {
    id: "variant-sequence",
    title: "Variant sequence",
    body: (
      <>
        <P>
          Variants are full-body portraits only: <DocCode>portrait-flirty.png</DocCode>,{" "}
          <DocCode>portrait-confused.png</DocCode>, and <DocCode>portrait-angry.png</DocCode>.
        </P>
        <P>
          Variants usually change expression, posture, and controlled body language. They can also
          exchange props, add a support surface, change camera perspective, or shift mutable
          supernatural features when the member's approved visual direction calls for it.
        </P>
        <P>For every variant:</P>
        <DocSteps
          items={[
            "Start from the original approved neutral full-body portrait.",
            "Attach only that neutral full-body portrait unless the user provides another reference image and explicitly says to attach it.",
            "Do not attach failed candidates, previous variant outputs, avatar crops, contact sheets, or a mixed image history.",
            "Generate one variant candidate.",
            "Inspect the candidate. Check character identity, outfit language, body proportions, canvas size, pose, expression, and whether prop exchange, support surfaces, perspective shifts, or mutable-form changes are intentional and readable.",
            "Give adjustment recommendations before any next generation.",
            "Repeat until approved.",
          ]}
        />
        <DocCallout variant="info">
          The internal <DocCode>angry</DocCode> variant name means a negative boundary state. The
          art direction can be guarded, distressed, cold, irritated, concerned, or visibly angry as
          fits the member. Tasha's seated flirty asset, Reaver's selfie avatar, and the Vhool and
          Cthala mutable-form sets are approved reference shapes, not failures to correct.
        </DocCallout>
      </>
    ),
  },
  {
    id: "scenario-background-sequence",
    title: "Scenario background sequence",
    body: (
      <DocSteps
        items={[
          "Start with one scenario only.",
          <span key="draft">
            Draft the prompt from <DocCode>publicBrief</DocCode>, <DocCode>card.summary</DocCode>,
            and scene rules that are visible to both characters.
          </span>,
          "Generate one background candidate.",
          "Inspect the candidate. Check center transcript calm, edge detail, cover-crop tolerance, Aura compatibility, no private member facts, no future event results, and no hidden outcome spoilers.",
          "Give adjustment recommendations. Keep the next prompt to one or two controlled changes.",
          "Repeat until approved.",
        ]}
      />
    ),
  },
  {
    id: "asset-landing",
    title: "Asset landing",
    body: (
      <>
        <P>Approved member source images go under:</P>
        <DocCodeBlock>{`assets-source/portraits/<member-id>/`}</DocCodeBlock>
        <P>Approved member runtime cutouts go under:</P>
        <DocCodeBlock>{`public/assets/portraits/<member-id>/`}</DocCodeBlock>
        <P>After source approval, run:</P>
        <DocCodeBlock language="powershell">{`vp run portrait:cutout --input assets-source/portraits/<member-id> --output public/assets/portraits/<member-id> --overwrite
vp run portrait:resize-avatars
vp run portrait:standee-footing
vp run portrait:palettes`}</DocCodeBlock>
        <P>
          After the neutral portrait is locked, update the member fixture{" "}
          <DocCode>visualDescription</DocCode>. This field is runtime prompt context for models
          without image input. It is canonical visual description, not an image prompt and not
          initial member lore.
        </P>
        <P>Approved scenario source backgrounds go under:</P>
        <DocCodeBlock>{`assets-source/scenarios/<scenario-id>/background.png`}</DocCodeBlock>
        <P>Approved scenario runtime backgrounds go under:</P>
        <DocCodeBlock>{`public/assets/scenarios/<scenario-id>/background.webp`}</DocCodeBlock>
        <P>
          Only add a scenario id to <DocCode>public/assets/scenarios/manifest.json</DocCode> after
          the approved runtime background exists.
        </P>
      </>
    ),
  },
  {
    id: "validation",
    title: "Validation",
    body: (
      <>
        <P>Run:</P>
        <DocCodeBlock language="powershell">{`vp check
vp test
vp build`}</DocCodeBlock>
        <P>
          Use Playwright for visual validation when assets affect roster cards, member modals, date
          standees, scenario cards, scenario inspector, background rendering, or live date flow. The
          dev server must already be running at <DocCode>http://localhost:5173/</DocCode> before
          Playwright work.
        </P>
      </>
    ),
  },
];

export default function VisualAssetIterationDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
