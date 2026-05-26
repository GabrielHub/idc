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
    cost: 23,
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
        pitch:
          "Run a school of mackerel across the sea-ceiling at chair height. Surfaces who looks up and who keeps their eyes on the company.",
        beat: "A small school of mackerel cuts a clean line across the sea overhead at chair height. The line moves left to right. The school is gone in a few breaths. The water settles.",
        directorBeat:
          "Fish just crossed your sky. Glance up, refuse to look, point them out to your date, or comment on the line and angle. Show whether you are the kind who watches the world or watches the person across from you.",
      },
      {
        id: "beach-where-sea-is-above-event-2",
        title: "Sun below",
        kind: "ambient",
        pitch:
          "Push the sun's warmth up through the dry seabed onto your shoes. Surfaces a small bodily comfort the pair can claim together or alone.",
        beat: "The sun sits below the chairs at horizon level. The light comes up through the dry seabed at a shallow angle and warms the front of both shoes. The sky between sun and sea is a thin band of clear air.",
        directorBeat:
          "The warmth is coming from your feet up. Stretch into it, kick your shoes off, mention the heat to your date, or sit quiet with it. Acknowledge the body in your next beat. Do not voice the sun.",
      },
      {
        id: "beach-where-sea-is-above-event-3",
        title: "Kelp frond",
        kind: "ambient",
        pitch:
          "Dip a forearm-length kelp frond down toward the chairs and back up. Surfaces a small near-touch the pair can claim, decline, or ignore.",
        beat: "A single kelp frond drifts down from the sea overhead, hangs a foot above the front of the chairs, and drifts back up into the layer. The frond is the length of a forearm. It does not break the surface.",
        directorBeat:
          "Something living almost touched you. Reach for it, recoil, comment to your date about it, or stay still and watch it go back. Make a small visible choice about closeness with the sea.",
      },
      {
        id: "beach-where-sea-is-above-event-4",
        title: "A drop falls",
        kind: "provocation",
        pitch:
          "Drop a single cool bead onto the cooler between you. Forces a small physical move on the drop or the question of more.",
        beat: "A single fat drop falls from the sea overhead and lands on the cooler between the chairs. The drop holds a beat before it runs. The sea above is otherwise still. The drop is cool.",
        directorBeat:
          "Water just landed within reach. Wipe it, catch it on a finger, joke about whether more is coming, or scoot the chairs in. Use your hands in your next beat.",
      },
      {
        id: "beach-where-sea-is-above-event-5",
        title: "Large shape overhead",
        kind: "provocation",
        pitch:
          "Slide a long shape wider than the pad through the sea above. Forces a real reaction, not a narration of what passed.",
        beat: "A long slow shape passes through the sea overhead from left to right. The shape is wider than the pad. The fin is not visible. The light from the sun below dims for a beat as the shape covers it and brightens again.",
        directorBeat:
          "Something huge just dimmed the sun. React in body or one short line: take your date's wrist, hold still, laugh thinly, or look down and refuse to follow it. Do not narrate the shape like a guide.",
      },
      {
        id: "beach-where-sea-is-above-event-6",
        title: "Cooler runs low",
        kind: "provocation",
        pitch:
          "Click the cooler from green to amber. Forces a clean call on the last pour, sharing, or wrapping up.",
        beat: "The cooler clicks once and a small green light at the lid turns amber. The instruction card on the lid shows the low-ice mark. The handles on the cooler are within reach of both chairs.",
        directorBeat:
          "You have one round left. Pour now, offer the last to your date, call the cooler done, or save it for later. Make the decision out loud.",
      },
      {
        id: "beach-where-sea-is-above-event-7",
        title: "Trough opens",
        kind: "reveal",
        pitch:
          "Open a brief window of stars that are not the local stars. Surfaces a stance: name what is up there, or hold the silence.",
        beat: "A trough opens in the sea overhead between two slow swells. For a long beat the chairs sit under open sky. The stars on the other side of the air are not the local stars. The trough closes.",
        directorBeat:
          "Something genuinely strange just opened above you. Engage with it from what you already know about your own life or this pair, not invented biography. Name a constellation if you carry one, or sit honestly in the not-knowing.",
      },
      {
        id: "beach-where-sea-is-above-event-8",
        title: "Repeat-visitor list",
        kind: "reveal",
        pitch:
          "Surface the repeat-visitor sub-list on the cooler card. Surfaces whether the pair claims the line or leaves it blank.",
        beat: "The instruction card on the cooler lid carries a small sub-list near the bottom for repeat visitors. The list has two open lines. The card is wet at one corner from the earlier drop.",
        directorBeat:
          "There are two empty signature lines on the card asking for your names. Offer to sign, ask your date if they would, decline, or joke about being recorded. Speak from how you actually feel about coming back.",
      },
      {
        id: "beach-where-sea-is-above-event-9",
        title: "A buoy drifts in",
        kind: "reveal",
        pitch:
          "Drift a small wooden buoy into the layer with two pencil names on its side. Surfaces a callback for repeat pairs or open curiosity for first visits.",
        beat: "A small wooden buoy drifts into the layer overhead from the right and settles near the pad. The buoy carries two short pencil names on the side facing them. The pencil mark is fresh enough to read.",
        directorBeat:
          "A small artifact just floated into your space. Read the names aloud, ask your date if they recognize either, claim them if you do, or let it drift on. Tie it to what you already know about this pair. Do not voice the buoy.",
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
