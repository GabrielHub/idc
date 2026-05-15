import type { DateScenario } from "../../domain/game";

export const museumExhibitMixup: DateScenario = {
  id: "museum-exhibit-mixup",
  title: "Now Showing: You",
  card: {
    summary: "A museum date where one member's placard appears before anyone can explain why.",
    tags: ["public", "memory", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "medium",
    cost: 16,
    idealFor: [
      "members who can absorb a pointed label for the partner",
      "members whose patience holds when a room studies them",
      "members who treat exposure as a fact rather than an attack",
    ],
    badFor: [
      "members carrying their privacy as a working clearance",
      "members already living under a chosen cover name",
      "members who refuse to be reduced to a single sentence on a wall",
    ],
  },
  publicBrief: {
    location: "A quiet gallery in the Museum of Recent Emotional Mistakes",
    premise:
      "The exhibits are mostly harmless until the building decides one member belongs on display.",
    whatBothCharactersKnow:
      "Cupid booked a museum walk. The labels can be uncomfortably specific. The gallery is empty besides them.",
    openingSituation:
      "They stop at a blank placard at eye level. A small empty pedestal stands beside it.",
  },
  director: {
    tone: "clinical, quiet, and increasingly personal",
    rules: [
      "Keep public embarrassment controlled and emotionally fair.",
      "Use exhibit labels and pedestals as pressure. Do not voice an audio guide as a third speaker.",
      "Anchor the date to this one gallery. Do not march them through other rooms.",
    ],
    events: [
      {
        id: "museum-exhibit-mixup-event-1",
        title: "First label",
        kind: "reveal",
        event: "The blank placard fills with a mild but accurate insecurity.",
        characterVisibleText:
          "The placard at eye level updates: subject worries they are easier to admire than know.",
        directorInstruction:
          "Let the affected member react. Let the other decide whether to be gentle. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "museum-exhibit-mixup-event-2",
        title: "Pedestal arrives",
        kind: "reveal",
        event: "A small object appears on the pedestal between them.",
        characterVisibleText:
          "A small enamel pin sits on the pedestal beside them. The card reads: most recent flinch, dated tonight.",
        directorInstruction:
          "Use the artifact to make avoidance visible without forcing exposure. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "museum-exhibit-mixup-event-3",
        title: "Replica",
        kind: "reveal",
        event: "A tiny replica of the pair appears on a second pedestal.",
        characterVisibleText:
          "A snow globe with two figures inside slides onto the pedestal. The base is engraved with both their initials and tonight's date.",
        directorInstruction: "Let the pair choose humor, discomfort, or directness.",
      },
      {
        id: "museum-exhibit-mixup-event-4",
        title: "Floor squeak",
        kind: "ambient",
        event: "The parquet under the gallery squeaks under one heel.",
        characterVisibleText:
          "The parquet under the gallery squeaks once under a heel. The sound is small. The placard at the next pedestal updates a single word.",
        directorInstruction: "Use the tiny disclosure to test grace under unexpected attention.",
      },
      {
        id: "museum-exhibit-mixup-event-5",
        title: "Audio guide booth",
        kind: "ambient",
        event: "An empty audio guide stand stands at the gallery entrance.",
        characterVisibleText:
          "An empty audio guide stand sits at the gallery entrance. Six rented players are in their slots. None of them has been signed out tonight.",
        directorInstruction:
          "Let the absence of a third voice keep the gallery between just the two of them. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "museum-exhibit-mixup-event-6",
        title: "Velvet rope",
        kind: "ambient",
        event: "A velvet rope across an exhibit shifts on its stanchion.",
        characterVisibleText:
          "A velvet rope across the next exhibit slides a half inch on its stanchion. The placard behind it stays blank. A small hum starts in the floor.",
        directorInstruction:
          "Allow the small movement. The pair does not need to step toward it to read it.",
      },
      {
        id: "museum-exhibit-mixup-event-7",
        title: "Spotlight shift",
        kind: "provocation",
        event: "Track lighting tilts onto the pair's pedestal.",
        characterVisibleText:
          "A track light overhead tilts a degree warmer and lands on the pedestal between them. The light on the previous placard cools. The snow globe is now in soft shadow.",
        directorInstruction:
          "Use the small spotlight to test who steps into attention and who steps out.",
      },
      {
        id: "museum-exhibit-mixup-event-8",
        title: "Wall update",
        kind: "provocation",
        event: "The first placard rearranges its words.",
        characterVisibleText:
          "The first placard reshuffles its words. It now reads: subject is easier to admire than know unless they decide otherwise. The pedestal beside it is empty again.",
        directorInstruction:
          "Push for a clean response. Either member can revise the wall by saying so out loud. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "museum-exhibit-mixup-event-9",
        title: "Gate alarm",
        kind: "provocation",
        event: "A door alarm chirps at the gallery exit.",
        characterVisibleText:
          "The exit gate at the far end of the gallery chirps a low alarm and the magnetic latch clacks open. The corridor beyond the gate has cooled by a noticeable degree.",
        directorInstruction:
          "Push for a clean choice: walk out together, hold the gallery, or split the move. The pair must register the alarm and decide before it loops.",
      },
    ],
    earlyEndTriggers: [
      "A member feels turned into an object.",
      "A member uses the exhibit to score points instead of connect.",
    ],
    repeatBehavior:
      "If this pair repeats the museum, labels can refer to the prior visit only in public facts already known to both.",
  },
  judgeRubric: {
    successSignals: [
      "The non-targeted member protects the targeted member's dignity.",
      "The pair turns embarrassment into a real question.",
    ],
    failureSignals: [
      "A member treats vulnerability as evidence.",
      "The pair fixates on the museum and stops relating.",
    ],
    statFocus: ["trust", "conflict", "relationshipHealth"],
  },
};
