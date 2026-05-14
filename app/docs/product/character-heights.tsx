import {
  DocCallout,
  DocCode,
  DocDefList,
  DocLink,
  DocList,
  DocPage,
  DocSteps,
  P,
  Strong,
  type DocMeta,
  type DocSectionEntry,
} from "../../components/doc-primitives";

export const meta: DocMeta = {
  slug: "product/character-heights",
  group: "product",
  title: "Character heights",
  description:
    "Member height canon, source-scale normalization, playground Height lineup workflow, and profile-height measurement rules.",
  order: 6,
};

export const lede = (
  <>
    Height is product data, not only art direction. It appears on dating profile and dossier
    surfaces, helps the player picture a member, and matters because dating apps treat height as
    visible preference context. The fixture value should be useful as a general ruler when creating
    and comparing members.
  </>
);

export const sections: DocSectionEntry[] = [
  {
    id: "height-fields",
    title: "Height fields",
    body: (
      <>
        <P>Each member fixture owns two integer inch fields:</P>
        <DocDefList
          items={[
            {
              term: "characterHeightInInches",
              def: (
                <>
                  The canonical genuine profile height for the member's date-surface form. This is
                  the value shown to the player. Convert feet and inches before entering data:{" "}
                  <Strong>6 ft 4 in becomes 76</Strong>, <Strong>5 ft 9 in becomes 69</Strong>.
                </>
              ),
            },
            {
              term: "standeeRenderHeightInInches",
              def: (
                <>
                  The runtime standee scale-bucket input. This is a render tuning value, not a
                  character fact. It can differ from <DocCode>characterHeightInInches</DocCode> when
                  source canvas padding, pose, hovering, leaning, bulky silhouettes, or other
                  presentation details make the standee read wrong at the canonical value.
                </>
              ),
            },
          ]}
        />
        <P>
          The playground Height lineup also shows a per-member <DocCode>src</DocCode> scale value.
          That value comes from the shared standee source-scale registry used by live date standees
          and the lineup. It is a runtime asset-normalization multiplier, not dating profile canon.
          Use it to reveal whether a source portrait needs normalization before making height
          decisions. Final remediation should usually happen in the approved source portrait and
          cutout pipeline when the source geometry is wrong.
        </P>
      </>
    ),
  },
  {
    id: "calibration-order",
    title: "Calibration order",
    body: (
      <>
        <P>Always normalize visual scale before deciding final height.</P>
        <DocSteps
          items={[
            <span key="cutout">
              Start from the approved neutral full-body cutout. The source and runtime cutout must
              satisfy the portrait canvas contract in{" "}
              <DocLink to="/docs/product/image-style">Image style</DocLink>.
            </span>,
            <span key="lineup">
              Open the playground Height lineup. Derek Halsey is the single visual guide anchor: his
              genuine height is <DocCode>76</DocCode>, and the <Strong>6 ft</Strong> guide line is
              derived from that rendered 6 ft 4 in standee.
            </span>,
            <span key="src">
              Adjust source-scale review first. Use the lineup <DocCode>src</DocCode> multiplier to
              confirm the shared standee source-scale registry until the member's face and head
              scale read correctly next to comparable members. The face pass comes first because a
              too-small or too-large source portrait will corrupt every height read.
            </span>,
            "Recheck body proportions after the face pass. A lowered head, bent knees, leaning torso, bulky coat, armor, tails, floating posture, or long hair can change the visual read without changing the character's profile height.",
            "Only after the face and source scale read correctly, do the height pass. Compare the normalized image to the Derek-derived 6 ft guide line and to relative roster neighbors.",
            <span key="canonical">
              Update <DocCode>characterHeightInInches</DocCode> to the member's actual date-surface
              profile height.
            </span>,
            <span key="standee">
              Update <DocCode>standeeRenderHeightInInches</DocCode> only as needed to make the
              standee read at that height in the live date path. Keep it inside the lineup bounds
              enforced by <DocCode>app/fixtures/members/members.test.ts</DocCode>.
            </span>,
            "Review the lineup again sorted by height and by body scale. The sorted views should not expose a member whose face scale only works when their height is wrong.",
          ]}
        />
        <DocCallout variant="warn">
          If the only way to make the face scale work is to give the member an implausible{" "}
          <DocCode>standeeRenderHeightInInches</DocCode>, the asset is the problem. Fix the source
          portrait or document why the pose is an approved exception.
        </DocCallout>
      </>
    ),
  },
  {
    id: "measurement-rule",
    title: "Measurement rule",
    body: (
      <>
        <P>
          Current height canon measures the character's genuine profile height: top of skull or head
          to actual foot, excluding shoes.
        </P>
        <P>Ignore anything that is not part of normal body height:</P>
        <DocList
          items={[
            "Hats, crowns, halos, hair ornaments, and head props.",
            "Animal ears, horns, antlers, antennae, or other silhouette extensions above the skull.",
            "Raised hands, weapon tips, carried props, wings, tails, aura effects, shadows, or background debris.",
          ]}
        />
        <P>
          For bottom measurement, start from the lowest shoe or visible foot that belongs to the
          body. Do not measure to a shadow, hover glow, floor effect, robe trail, tail tip, or prop.
          Then subtract the best visual estimate of shoe, heel, boot, or platform height.
        </P>
        <P>
          Because the standee canvas is bottom anchored, record the shoe-to-canvas-bottom distance
          during review. A hovering, flying, seated, leaning, crouched, or badly padded source may
          leave visible empty space below the shoes. Do not count that gap as body height. When
          measuring from a bottom-anchored screenshot, subtract the shoe-to-canvas-bottom gap so the
          visual read is head-to-shoe before the footwear estimate is removed.
        </P>
        <P>
          Compensate for posture and head tilt. A dipped head, cocked head, leaning torso, raised
          heel, bent knee, floating pose, or forward slouch can make the portrait read shorter or
          taller than the upright person. Use judgment so the listed height describes the member
          standing normally in their date-surface form.
        </P>
        <P>Use coarse footwear estimates:</P>
        <DocDefList
          items={[
            {
              term: "0 in",
              def: "Barefoot, socks, very flat sandals, or anatomy with no shoe equivalent.",
            },
            { term: "1 in", def: "Sneakers, flats, dress shoes, and normal boots." },
            { term: "2 in", def: "Chunky boots, modest heels, or thick soles." },
            {
              term: "3 to 5 in",
              def: "Obvious platforms, high heels, stage boots, or supernatural footwear that visibly adds height.",
            },
          ]}
        />
        <P>
          That normalization and footwear estimate explain why{" "}
          <DocCode>standeeRenderHeightInInches</DocCode> may need to differ from{" "}
          <DocCode>characterHeightInInches</DocCode>. It is a render compensation, not a hidden
          biography note.
        </P>
      </>
    ),
  },
  {
    id: "anchors",
    title: "Anchors",
    body: (
      <>
        <P>Generated-height anchor portraits are the calibration set for source scale:</P>
        <DocDefList
          items={[
            { term: "Derek Halsey", def: <DocCode>76</DocCode> },
            { term: "Alex Yoon", def: <DocCode>73</DocCode> },
            { term: "Gabriel Tan", def: <DocCode>69</DocCode> },
            { term: "Noah Kim", def: <DocCode>69</DocCode> },
            { term: "Ryan Doyle", def: <DocCode>69</DocCode> },
          ]}
        />
        <P>
          For anchors, <DocCode>standeeRenderHeightInInches</DocCode> is locked to those values
          because the source portraits are calibrated to them. Derek is the guide-line anchor.
          Normalize the anchor set first so faces, bodies, and proportions read correctly next to
          each other. Then compare every non-anchor source against the locked set.
        </P>
        <P>
          The current date standee path treats <DocCode>68</DocCode> inches as neutral scale. The
          live scale ladder is bounded from <DocCode>0.78</DocCode> for very short date forms to{" "}
          <DocCode>1.24</DocCode> for the tallest date forms. Height scaling is limited to full-body
          standees where characters are compared side by side. The date standee path also applies
          the shared source-scale multiplier before footing so live dates and the Height lineup use
          the same source normalization. Do not apply height scaling to avatars, roster thumbnails,
          compact profile rows, or other cropped identity surfaces.
        </P>
      </>
    ),
  },
  {
    id: "creating-new-members",
    title: "Creating new members",
    body: (
      <>
        <P>
          When authoring a new member, start with the height the designer pictures them at. That
          value is the first draft of <DocCode>characterHeightInInches</DocCode>, not proof that the
          final art reads correctly.
        </P>
        <P>
          After the neutral full-body portrait is approved and cut out, run the calibration order
          above. The height may change after the source-scale pass because the image gives a better
          roster ruler than the initial mental sketch. Keep the value player-facing and date-surface
          specific. For shapeshifters, divine members, eldritch members, synthetic bodies, and other
          scale-unstable characters, use the form Cupid shows on the date surface, not cosmic true
          scale, species scale, mythic title, or hidden lore.
        </P>
        <P>
          Do subtract guessed heel, boot, platform, or shoe-sole inches during the height pass. Keep
          the estimate coarse and visually defensible. The goal is not pixel-perfect anatomy. The
          goal is a dating-profile height that is not obviously wrong when the lineup is compared
          against Derek's ruler.
        </P>
      </>
    ),
  },
  {
    id: "failure-signs",
    title: "Failure signs",
    body: (
      <DocCallout variant="danger" title="Rework needed when any of these appear">
        <DocList
          items={[
            "Face scale only matches anchors at an implausible render height.",
            "A member's listed height contradicts the Derek-derived 6 ft guide after shoe-gap, posture, head-tilt, and footwear normalization.",
            "The body reads shorter or taller only because the source has excess transparent padding.",
            "Hats, ears, props, aura effects, or hair volume are being counted as body height.",
            "A hovering or flying character is measured from the canvas bottom instead of the shoe or foot.",
            "The source portrait uses member-specific CSS or runtime scaling to hide a canvas problem.",
          ]}
        />
      </DocCallout>
    ),
  },
];

export default function CharacterHeightsDoc() {
  return <DocPage meta={meta} sections={sections} lede={lede} />;
}
