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
        pitch:
          "Fill the blank placard with a mild but accurate insecurity about one of the pair. Forces a real reaction and a stance from the other.",
        beat: "The placard at eye level updates: subject worries they are easier to admire than know.",
        directorBeat:
          "A specific line about one of you just appeared on the wall. React in body or one short line: laugh dryly, admit it, deflect, or look at your date. The partner who isn't named must choose whether to be gentle. Do not voice the placard.",
      },
      {
        id: "museum-exhibit-mixup-event-2",
        title: "Pedestal arrives",
        kind: "reveal",
        pitch:
          "Drop a small enamel pin on the pedestal between them with a card: most recent flinch, dated tonight. Surfaces avoidance without forcing exposure.",
        beat: "A small enamel pin sits on the pedestal beside them. The card reads: most recent flinch, dated tonight.",
        directorBeat:
          "Your most recent flinch just got framed. Read the card aloud, pocket the pin, ask your date what theirs is, or step back from the pedestal. Do not turn it into evidence. Do not voice the card.",
      },
      {
        id: "museum-exhibit-mixup-event-3",
        title: "Replica",
        kind: "reveal",
        pitch:
          "Slide a snow globe of the pair with their initials and tonight's date onto a second pedestal. Forces a stance: humor, discomfort, or directness.",
        beat: "A snow globe with two figures inside slides onto the pedestal. The base is engraved with both their initials and tonight's date.",
        directorBeat:
          "You are now in the museum together. Joke about the engraving, ask your date what they make of it, pick the globe up, or stand quiet. Speak from your actual register.",
      },
      {
        id: "museum-exhibit-mixup-event-4",
        title: "Floor squeak",
        kind: "ambient",
        pitch:
          "Squeak the parquet under one heel and update the next placard by one word. Surfaces grace under small unexpected attention.",
        beat: "The parquet under the gallery squeaks once under a heel. The sound is small. The placard at the next pedestal updates a single word.",
        directorBeat:
          "Your shoe just gave you away by one word. Notice the change on the placard, comment on the squeak, shift your weight, or carry on. Show whether the room rattles you.",
      },
      {
        id: "museum-exhibit-mixup-event-5",
        title: "Audio guide booth",
        kind: "ambient",
        pitch:
          "Stand an empty audio guide booth at the gallery entrance with six unsigned-out players. Surfaces a small relief that no third voice will narrate.",
        beat: "An empty audio guide stand sits at the gallery entrance. Six rented players are in their slots. None of them has been signed out tonight.",
        directorBeat:
          "Nobody else is interpreting the room for you. Comment on the empty booth, propose taking a player anyway, or hold the gallery yourselves. Use the absence of a third voice. Do not voice the booth.",
      },
      {
        id: "museum-exhibit-mixup-event-6",
        title: "Velvet rope",
        kind: "ambient",
        pitch:
          "Slide the next exhibit's velvet rope a half inch on its stanchion with a hum starting in the floor. Surfaces a small movement without forcing approach.",
        beat: "A velvet rope across the next exhibit slides a half inch on its stanchion. The placard behind it stays blank. A small hum starts in the floor.",
        directorBeat:
          "The next room just nudged at you. Step toward it, comment on the rope, ask your date if they want to see what is there, or stay at your pedestal. Do not chase every movement.",
      },
      {
        id: "museum-exhibit-mixup-event-7",
        title: "Spotlight shift",
        kind: "provocation",
        pitch:
          "Tilt a track light warmer onto the pair's pedestal and cool the previous placard. Surfaces who steps into attention and who steps out.",
        beat: "A track light overhead tilts a degree warmer and lands on the pedestal between them. The light on the previous placard cools. The snow globe is now in soft shadow.",
        directorBeat:
          "The light just put you under it. Step into the warm circle, slide to the edge, comment on the temperature, or pull your date deeper in. Make your stance on attention visible.",
      },
      {
        id: "museum-exhibit-mixup-event-8",
        title: "Wall update",
        kind: "provocation",
        pitch:
          "Reshuffle the first placard to add: unless they decide otherwise. Forces a clean response, including revising the wall by saying so aloud.",
        beat: "The first placard reshuffles its words. It now reads: subject is easier to admire than know unless they decide otherwise. The pedestal beside it is empty again.",
        directorBeat:
          "The wall just gave you an out. Say what you actually want known, refuse to be summarized, ask your date the same question back, or step away. The wall will print what you say. Do not voice the wall.",
      },
      {
        id: "museum-exhibit-mixup-event-9",
        title: "Gate alarm",
        kind: "provocation",
        pitch:
          "Chirp the exit gate alarm, clack the magnetic latch open, and cool the corridor. Forces a clean choice: walk out together, hold, or split.",
        beat: "The exit gate at the far end of the gallery chirps a low alarm and the magnetic latch clacks open. The corridor beyond the gate has cooled by a noticeable degree.",
        directorBeat:
          "The room is offering you an exit. Walk out together, hold the gallery and finish the conversation, propose splitting the move, or wait for the alarm to loop. Decide cleanly.",
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
