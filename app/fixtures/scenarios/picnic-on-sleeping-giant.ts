import type { DateScenario } from "../../domain/game";

export const picnicOnSleepingGiant: DateScenario = {
  id: "picnic-on-sleeping-giant",
  title: "Picnic On The Sleeping Giant",
  card: {
    summary:
      "A picnic on a mossy hill that is the chest of a giant who lay down at the end of his age and slept rather than die. The hill rises an inch every long breath.",
    tags: ["domestic", "low_pressure", "food", "repeat_risk"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who can sit on a living thing without making it the topic",
      "members who can pay a small respect without performing it",
      "members who can let a long breath set the pace",
    ],
    badFor: [
      "members who turn the giant into a personal pitch",
      "members who narrate every rise and settle",
      "members who use the scale to skip the conversation",
    ],
  },
  publicBrief: {
    location: "Aldwen the Patient, mossy hill in the green country, picnic ledge on the chest",
    premise:
      "Cupid booked a picnic on Aldwen, a giant who chose to sleep at the end of his age. The hill is the chest. The booking is two hours.",
    whatBothCharactersKnow:
      "Aldwen lay down nine centuries ago. The kingdom calls him Aldwen the Patient. Moss covers him. Two oaks stand at one shoulder. A small stream runs down the ribcage. The hill rises an inch every long breath. He does not wake. Birds nest in his beard. The blanket and basket are at the ledge on the chest.",
    openingSituation:
      "Both members stand at the picnic ledge. The blanket is folded at the edge. The basket is closed. The oak shadow falls across half the ledge. The hill is settled in mid-breath.",
  },
  director: {
    tone: "the slow rise and settle of a long breath under the moss, the warm green smell of an old hill, a single bird in the oak, the small stream at the edge of hearing",
    rules: [
      "Anchor the date to the picnic ledge. The pair does not walk along the giant's length.",
      "Treat Aldwen as fact and asleep. He does not wake.",
      "Allow a long quiet between lines. The breath sets the pace.",
      "Do not voice Aldwen, the birds, or any background body as continuing speakers.",
    ],
    events: [
      {
        id: "picnic-on-sleeping-giant-event-1",
        title: "Long breath",
        kind: "ambient",
        event: "The hill rises an inch on a long breath.",
        characterVisibleText:
          "The hill rises an inch under the blanket on a long breath. The basket shifts a finger. The two oaks at the shoulder lean a degree and settle. The breath rolls back out at the same pace.",
        directorInstruction: "Allow the small rise. Aldwen is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-sleeping-giant-event-2",
        title: "Bird in the beard",
        kind: "ambient",
        event: "A bird lands in the beard at the chin slope.",
        characterVisibleText:
          "A small brown bird lands in the beard at the chin slope above the ledge. The bird settles between two coils of beard. It does not fly off. The oak above the ledge is still.",
        directorInstruction:
          "Allow the small visit. The bird does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-sleeping-giant-event-3",
        title: "Stream at the rib",
        kind: "ambient",
        event: "The small stream at the rib runs steady.",
        characterVisibleText:
          "The small stream at the rib runs steady down the slope of the chest into the moss at the lower edge of the ledge. The water is clear. The flow does not change with the breath.",
        directorInstruction:
          "Allow the small detail. The stream is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-sleeping-giant-event-4",
        title: "Deeper breath",
        kind: "provocation",
        event: "A deeper breath shifts the blanket.",
        characterVisibleText:
          "A deeper breath comes up from under the moss. The blanket slides a hand toward the edge of the ledge. The basket tilts. The oak at the shoulder leans further than the last breath and holds.",
        directorInstruction:
          "Push for a real physical move. Either may catch the blanket, steady the basket, or shift the spread. Aldwen is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-sleeping-giant-event-5",
        title: "Oak branch creaks",
        kind: "provocation",
        event: "An oak branch above the ledge creaks.",
        characterVisibleText:
          "A thick oak branch above the ledge creaks and drops a small shower of bark onto the blanket. The branch holds. The bird in the beard does not move. The shadow on the ledge shifts.",
        directorInstruction:
          "Push for a real small move. Either may brush the bark, step out from under, or stay. The oak is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-sleeping-giant-event-6",
        title: "Basket lid tips",
        kind: "provocation",
        event: "The basket lid tips closed on a rise.",
        characterVisibleText:
          "The basket lid tips closed on the next rise. The basket has not been opened yet. The catch is on the side away from the ledge edge. The basket holds.",
        directorInstruction:
          "Push for a real next move. Either may open the basket, move it, or wait through one more breath. The basket is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-sleeping-giant-event-7",
        title: "Foot-of-hill sign",
        kind: "reveal",
        event: "The wooden sign at the foot of the hill is visible from the ledge.",
        characterVisibleText:
          "The wooden sign at the foot of the hill is visible from the ledge through a gap in the oak. The sign carries three letters and a year. The letters are weathered. The year is centuries past.",
        directorInstruction:
          "Use the small marker to surface a stance drawn only from existing context. The sign is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-sleeping-giant-event-8",
        title: "Moss-buried token",
        kind: "reveal",
        event: "A small token is buried under the moss at the ledge corner.",
        characterVisibleText:
          "A small carved wooden token is half buried in the moss at the corner of the ledge. The token is the size of a coin. The carving is a small bird in flight. The moss has not closed over it.",
        directorInstruction:
          "Use the small token to surface a stance drawn only from existing context. The token is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-sleeping-giant-event-9",
        title: "Heart on a rock",
        kind: "reveal",
        event: "A small carved heart is visible on a rock at the shoulder.",
        characterVisibleText:
          "A small heart carved into a rock at the shoulder of the hill is visible from the ledge on a long settle. The heart holds two short initials. The carving is old enough to have moss in the lines.",
        directorInstruction:
          "Use the small callback to surface a stance drawn only from existing context and pair history. The rock is not voiced as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member uses Aldwen as a personal pitch.",
      "A member narrates every rise and settle the hill makes.",
    ],
    repeatBehavior:
      "If repeated, the ledge is held for the pair. The blanket is folded at the edge, the basket is closed, the oak shadow falls across half the ledge. The carved heart at the shoulder of the hill is visible on a long settle.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a long breath be the pace.",
      "A member pays a small respect to Aldwen without performing it.",
    ],
    failureSignals: [
      "A member uses Aldwen as a metaphor for the date.",
      "The pair argues about whether the giant is really asleep.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
