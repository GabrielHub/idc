import type { DateScenario } from "../../domain/game";

export const beachWhereSeaIsAbove: DateScenario = {
  id: "beach-where-sea-is-above",
  title: "Beach Where The Sea Is Above",
  card: {
    summary:
      "A two-chair beach on a branch where the sea hangs as a ceiling. Sun at horizon level below, fish overhead, a self-pour cooler clipped to the chair.",
    tags: ["cosmic", "low_pressure", "food"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who can look up without making it a topic",
      "members who can sit a long quiet on a chair",
      "members who can let a partner not look up",
    ],
    badFor: [
      "members who turn the inverted sea into a personal pitch",
      "members who narrate every shape that passes overhead",
      "members who use the view to skip the conversation",
    ],
  },
  publicBrief: {
    location: "Two-chair pad, branch where the sea is overhead, near the dry seabed line",
    premise:
      "Cupid booked a two-chair pad on a stretch of dry sand on a branch where the ocean hangs as a ceiling.",
    whatBothCharactersKnow:
      "Two folding chairs face the same way. The sun is below at horizon level. The sea sits overhead as a layer of water at the height of a high tide. Fish, kelp, and larger shapes pass through it. A self-pour cooler is clipped to one chair. A printed instruction card on the cooler covers the pour. The booking lasts one hour. The pad does not move.",
    openingSituation:
      "Both members are on the pad. The chairs are unfolded. The cooler is clipped. A small bag of towels is between the chairs. The sea above is calm. A single kelp frond is visible drifting at the surface.",
  },
  director: {
    tone: "no surf sound, the sun warm from below, a faint cool from above, the long quiet of a beach with no wind, the soft slosh of a layer overhead",
    rules: [
      "Anchor the date to the two-chair pad. The pair does not walk under the sea.",
      "Treat the inverted sea as fact. Fish overhead are fish overhead.",
      "Allow either member to skip looking up. Looking up is not a test.",
      "Do not voice the sea, the cooler, or any drifting shape as a continuing speaker.",
    ],
    events: [
      {
        id: "beach-where-sea-is-above-event-1",
        title: "Mackerel school",
        kind: "ambient",
        event: "A small school of mackerel passes overhead.",
        characterVisibleText:
          "A small school of mackerel cuts a clean line across the sea overhead at chair height. The line moves left to right. The school is gone in a few breaths. The water settles.",
        directorInstruction:
          "Allow the small marker. The school is not voiced as a continuing speaker.",
      },
      {
        id: "beach-where-sea-is-above-event-2",
        title: "Sun below",
        kind: "ambient",
        event: "The sun sits below at horizon level.",
        characterVisibleText:
          "The sun sits below the chairs at horizon level. The light comes up through the dry seabed at a shallow angle and warms the front of both shoes. The sky between sun and sea is a thin band of clear air.",
        directorInstruction:
          "Allow the small angle. The sun is not voiced as a continuing speaker.",
      },
      {
        id: "beach-where-sea-is-above-event-3",
        title: "Kelp frond",
        kind: "ambient",
        event: "A single kelp frond drifts down toward them and back up.",
        characterVisibleText:
          "A single kelp frond drifts down from the sea overhead, hangs a foot above the front of the chairs, and drifts back up into the layer. The frond is the length of a forearm. It does not break the surface.",
        directorInstruction:
          "Allow the small visit. The frond is not voiced as a continuing speaker.",
      },
      {
        id: "beach-where-sea-is-above-event-4",
        title: "A drop falls",
        kind: "provocation",
        event: "A single drop falls from the sea overhead.",
        characterVisibleText:
          "A single fat drop falls from the sea overhead and lands on the cooler between the chairs. The drop holds a beat before it runs. The sea above is otherwise still. The drop is cool.",
        directorInstruction:
          "Push for a real small move. Either may catch it, wipe it, or leave it. The drop is not voiced as a continuing speaker.",
      },
      {
        id: "beach-where-sea-is-above-event-5",
        title: "Large shape overhead",
        kind: "provocation",
        event: "A large slow shape passes overhead.",
        characterVisibleText:
          "A long slow shape passes through the sea overhead from left to right. The shape is wider than the pad. The fin is not visible. The light from the sun below dims for a beat as the shape covers it and brightens again.",
        directorInstruction:
          "Push for a real reaction. The pair does not narrate the shape. The shape is not voiced as a continuing speaker.",
      },
      {
        id: "beach-where-sea-is-above-event-6",
        title: "Cooler runs low",
        kind: "provocation",
        event: "The cooler clicks to low ice.",
        characterVisibleText:
          "The cooler clicks once and a small green light at the lid turns amber. The instruction card on the lid shows the low-ice mark. The handles on the cooler are within reach of both chairs.",
        directorInstruction:
          "Push for a real next move. Either may pour now, share the last, or call the cooler done. The cooler is not voiced as a continuing speaker.",
      },
      {
        id: "beach-where-sea-is-above-event-7",
        title: "Trough opens",
        kind: "reveal",
        event: "A wave trough opens overhead and shows open sky.",
        characterVisibleText:
          "A trough opens in the sea overhead between two slow swells. For a long beat the chairs sit under open sky. The stars on the other side of the air are not the local stars. The trough closes.",
        directorInstruction:
          "Use the small window to surface a stance drawn only from existing context. Either may name the stars or leave it. The trough is not voiced as a continuing speaker.",
      },
      {
        id: "beach-where-sea-is-above-event-8",
        title: "Repeat-visitor list",
        kind: "reveal",
        event: "The cooler card holds a small repeat-visitor list.",
        characterVisibleText:
          "The instruction card on the cooler lid carries a small sub-list near the bottom for repeat visitors. The list has two open lines. The card is wet at one corner from the earlier drop.",
        directorInstruction:
          "Use the small option to surface a stance drawn only from existing context. The card is not voiced as a continuing speaker.",
      },
      {
        id: "beach-where-sea-is-above-event-9",
        title: "A buoy drifts in",
        kind: "reveal",
        event: "A small buoy drifts in overhead from the right.",
        characterVisibleText:
          "A small wooden buoy drifts into the layer overhead from the right and settles near the pad. The buoy carries two short pencil names on the side facing them. The pencil mark is fresh enough to read.",
        directorInstruction:
          "Use the small callback to surface a stance drawn only from existing context and pair history. The buoy is not voiced as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the inverted sea as a personal pitch.",
      "A member treats the long shape overhead as content to riff on.",
    ],
    repeatBehavior:
      "If repeated, the pad is held for the pair. The cooler is clipped, the chairs face the same way, the kelp frond visits, the trough opens. The buoy from the prior visit drifts in once during the booking.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a long quiet under the sea be company.",
      "A member matches a partner's choice to look up or not without making it a test.",
    ],
    failureSignals: [
      "A member narrates every shape that passes overhead.",
      "The pair argues about whether the sea is really there.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
