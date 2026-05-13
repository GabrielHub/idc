# Character Heights

This document owns IDC member height canon, source-scale normalization, and the playground height lineup workflow. `docs/product/image-style.md` owns portrait generation and canvas requirements. `docs/workflows/add-member.md` and `docs/workflows/visual-asset-iteration.md` own the repeatable task steps that use this contract.

Height is product data, not only art direction. It appears on dating profile and dossier surfaces, helps the player picture a member, and matters because dating apps treat height as visible preference context. The fixture value should be useful as a general ruler when creating and comparing members.

## Height Fields

Each member fixture owns two integer inch fields:

- `characterHeightInInches`: the canonical genuine profile height for the member's date-surface form. This is the value shown to the player. Convert feet and inches before entering data: `6 ft 4 in` becomes `76`, `5 ft 9 in` becomes `69`.
- `standeeRenderHeightInInches`: the runtime standee scale-bucket input. This is a render tuning value, not a character fact. It can differ from `characterHeightInInches` when source canvas padding, pose, hovering, leaning, bulky silhouettes, or other presentation details make the standee read wrong at the canonical value.

The playground Height lineup also shows a per-member `src` scale value. That value is a source-scale audit multiplier for the lineup, not dating profile canon. Use it to reveal whether a source portrait needs normalization before making height decisions. Final remediation should usually happen in the approved source portrait and cutout pipeline when the source geometry is wrong.

## Calibration Order

Always normalize visual scale before deciding final height.

1. Start from the approved neutral full-body cutout. The source and runtime cutout must satisfy the portrait canvas contract in `docs/product/image-style.md`.
2. Open the playground Height lineup. Derek Halsey is the single visual guide anchor: his genuine height is `76`, and the `6 ft` guide line is derived from that rendered 6 ft 4 in standee.
3. Adjust source-scale review first. Use the lineup `src` multiplier as the audit control until the member's face and head scale read correctly next to comparable members. The face pass comes first because a too-small or too-large source portrait will corrupt every height read.
4. Recheck body proportions after the face pass. A lowered head, bent knees, leaning torso, bulky coat, armor, tails, floating posture, or long hair can change the visual read without changing the character's profile height.
5. Only after the face and source scale read correctly, do the height pass. Compare the normalized image to the Derek-derived `6 ft` guide line and to relative roster neighbors.
6. Update `characterHeightInInches` to the member's actual date-surface profile height.
7. Update `standeeRenderHeightInInches` only as needed to make the standee read at that height in the live date path. Keep it inside the lineup bounds enforced by `app/fixtures/members/members.test.ts`.
8. Review the lineup again sorted by height and by body scale. The sorted views should not expose a member whose face scale only works when their height is wrong.

If the only way to make the face scale work is to give the member an implausible `standeeRenderHeightInInches`, the asset is the problem. Fix the source portrait or document why the pose is an approved exception.

## Measurement Rule

Current height canon measures the character's genuine profile height: top of skull or head to actual foot, excluding shoes.

Ignore anything that is not part of normal body height:

- Hats, crowns, halos, hair ornaments, and head props.
- Animal ears, horns, antlers, antennae, or other silhouette extensions above the skull.
- Raised hands, weapon tips, carried props, wings, tails, aura effects, shadows, or background debris.

For bottom measurement, start from the lowest shoe or visible foot that belongs to the body. Do not measure to a shadow, hover glow, floor effect, robe trail, tail tip, or prop. Then subtract the best visual estimate of shoe, heel, boot, or platform height.

Because the standee canvas is bottom anchored, record the shoe-to-canvas-bottom distance during review. A hovering, flying, seated, leaning, crouched, or badly padded source may leave visible empty space below the shoes. Do not count that gap as body height. When measuring from a bottom-anchored screenshot, subtract the shoe-to-canvas-bottom gap so the visual read is head-to-shoe before the footwear estimate is removed.

Compensate for posture and head tilt. A dipped head, cocked head, leaning torso, raised heel, bent knee, floating pose, or forward slouch can make the portrait read shorter or taller than the upright person. Use judgment so the listed height describes the member standing normally in their date-surface form.

Use coarse footwear estimates:

- `0 in`: barefoot, socks, very flat sandals, or anatomy with no shoe equivalent.
- `1 in`: sneakers, flats, dress shoes, and normal boots.
- `2 in`: chunky boots, modest heels, or thick soles.
- `3 to 5 in`: obvious platforms, high heels, stage boots, or supernatural footwear that visibly adds height.

That normalization and footwear estimate explain why `standeeRenderHeightInInches` may need to differ from `characterHeightInInches`. It is a render compensation, not a hidden biography note.

## Anchors

Generated-height anchor portraits are the calibration set for source scale:

- Derek Halsey: `76`
- Alex Yoon: `73`
- Gabriel Tan: `69`
- Noah Kim: `69`
- Ryan Doyle: `69`

For anchors, `standeeRenderHeightInInches` is locked to those values because the source portraits are calibrated to them. Derek is the guide-line anchor. Normalize the anchor set first so faces, bodies, and proportions read correctly next to each other. Then compare every non-anchor source against the locked set.

The current date standee path treats `68` inches as neutral scale. The live scale ladder is bounded from `0.78` for very short date forms to `1.24` for the tallest date forms. Height scaling is limited to full-body standees where characters are compared side by side. Do not apply height scaling to avatars, roster thumbnails, compact profile rows, or other cropped identity surfaces.

## Creating New Members

When authoring a new member, start with the height the designer pictures them at. That value is the first draft of `characterHeightInInches`, not proof that the final art reads correctly.

After the neutral full-body portrait is approved and cut out, run the calibration order above. The height may change after the source-scale pass because the image gives a better roster ruler than the initial mental sketch. Keep the value player-facing and date-surface specific. For shapeshifters, divine members, eldritch members, synthetic bodies, and other scale-unstable characters, use the form Cupid shows on the date surface, not cosmic true scale, species scale, mythic title, or hidden lore.

Do subtract guessed heel, boot, platform, or shoe-sole inches during the height pass. Keep the estimate coarse and visually defensible. The goal is not pixel-perfect anatomy. The goal is a dating-profile height that is not obviously wrong when the lineup is compared against Derek's ruler.

## Failure Signs

Rework the source portrait, cutout, or height values when:

- Face scale only matches anchors at an implausible render height.
- A member's listed height contradicts the Derek-derived 6 ft guide after shoe-gap, posture, head-tilt, and footwear normalization.
- The body reads shorter or taller only because the source has excess transparent padding.
- Hats, ears, props, aura effects, or hair volume are being counted as body height.
- A hovering or flying character is measured from the canvas bottom instead of the shoe or foot.
- The source portrait uses member-specific CSS or runtime scaling to hide a canvas problem.
