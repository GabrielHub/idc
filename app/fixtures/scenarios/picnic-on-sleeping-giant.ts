import type { DateScenario } from "../../domain/game";

export const picnicOnSleepingGiant: DateScenario = {
  id: "picnic-on-sleeping-giant",
  title: "Let Sleeping Giants Lie",
  card: {
    summary:
      "A picnic on a mossy hill that is the chest of a giant who lay down at the end of his age and slept rather than die. The hill rises an inch every long breath.",
    tags: ["domestic", "low_pressure", "food", "repeat_risk"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 25,
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
        pitch:
          "Rise the hill an inch under the blanket on a long breath with the oaks leaning a degree. Surfaces pacing the conversation to the body under you.",
        beat: "The hill rises an inch under the blanket on a long breath. The basket shifts a finger. The two oaks at the shoulder lean a degree and settle. The breath rolls back out at the same pace.",
        directorBeat:
          "Something alive is breathing under your blanket. Slow your line, comment on the shift, sit with the breath, or steady the basket. Match the pace.",
      },
      {
        id: "picnic-on-sleeping-giant-event-2",
        title: "Bird in the beard",
        kind: "ambient",
        pitch:
          "Land a small brown bird in the beard at the chin slope between two coils. Surfaces a small visit that the pair can notice or skip.",
        beat: "A small brown bird lands in the beard at the chin slope above the ledge. The bird settles between two coils of beard. It does not fly off. The oak above the ledge is still.",
        directorBeat:
          "Something small chose to live here for a moment. Point it out, comment on the coils, ask your date if they see it, or stay focused. Do not voice the bird.",
      },
      {
        id: "picnic-on-sleeping-giant-event-3",
        title: "Stream at the rib",
        kind: "ambient",
        pitch:
          "Run the small stream steady down the chest into the moss at the lower edge. Surfaces a small reliable detail without metaphor.",
        beat: "The small stream at the rib runs steady down the slope of the chest into the moss at the lower edge of the ledge. The water is clear. The flow does not change with the breath.",
        directorBeat:
          "Water is moving past the picnic. Comment on the clear flow, listen for it under the breath, or stay with the food. Do not narrate the stream like a guide.",
      },
      {
        id: "picnic-on-sleeping-giant-event-4",
        title: "Deeper breath",
        kind: "provocation",
        pitch:
          "Slide the blanket a hand toward the edge on a deeper breath with the basket tilting and the oak leaning further. Forces a real physical save.",
        beat: "A deeper breath comes up from under the moss. The blanket slides a hand toward the edge of the ledge. The basket tilts. The oak at the shoulder leans further than the last breath and holds.",
        directorBeat:
          "The hill just took a bigger breath. Catch the blanket, steady the basket, slide the spread back, or take your date's hand. Move now.",
      },
      {
        id: "picnic-on-sleeping-giant-event-5",
        title: "Oak branch creaks",
        kind: "provocation",
        pitch:
          "Creak an oak branch above the ledge and drop bark onto the blanket with the bird unmoved. Forces a real small move on staying under or stepping out.",
        beat: "A thick oak branch above the ledge creaks and drops a small shower of bark onto the blanket. The branch holds. The bird in the beard does not move. The shadow on the ledge shifts.",
        directorBeat:
          "The tree above you just said something. Brush the bark off, step out from under the branch, comment to your date, or trust the hold. Decide where your body is.",
      },
      {
        id: "picnic-on-sleeping-giant-event-6",
        title: "Basket lid tips",
        kind: "provocation",
        pitch:
          "Tip the basket lid closed on a rise with the catch on the safe side. Forces a real next move on opening, moving, or waiting.",
        beat: "The basket lid tips closed on the next rise. The basket has not been opened yet. The catch is on the side away from the ledge edge. The basket holds.",
        directorBeat:
          "The basket is asking when you start. Open it now, slide it to the center, ask your date what they want first, or wait through one more breath. Pick.",
      },
      {
        id: "picnic-on-sleeping-giant-event-7",
        title: "Foot-of-hill sign",
        kind: "reveal",
        pitch:
          "Show a weathered wooden sign with three letters and a centuries-old year through a gap in the oak. Surfaces a stance drawn from what each already carries.",
        beat: "The wooden sign at the foot of the hill is visible from the ledge through a gap in the oak. The sign carries three letters and a year. The letters are weathered. The year is centuries past.",
        directorBeat:
          "An old marker is visible from the picnic. Read it aloud, comment on the year, ask your date if they have walked past it before, or leave it alone. Speak only from what you already know.",
      },
      {
        id: "picnic-on-sleeping-giant-event-8",
        title: "Moss-buried token",
        kind: "reveal",
        pitch:
          "Surface a coin-sized wooden token carved as a bird in flight half-buried in the moss at the corner. Surfaces a stance drawn from existing context.",
        beat: "A small carved wooden token is half buried in the moss at the corner of the ledge. The token is the size of a coin. The carving is a small bird in flight. The moss has not closed over it.",
        directorBeat:
          "A small carving is right at the corner of your blanket. Pick it up, read the shape aloud, ask your date if they want it, or leave it where it is. Make the small choice.",
      },
      {
        id: "picnic-on-sleeping-giant-event-9",
        title: "Heart on a rock",
        kind: "reveal",
        pitch:
          "Show a mossed-over carved heart with two initials on the shoulder rock on a long settle. Surfaces a callback for repeat pairs or curiosity for first visits.",
        beat: "A small heart carved into a rock at the shoulder of the hill is visible from the ledge on a long settle. The heart holds two short initials. The carving is old enough to have moss in the lines.",
        directorBeat:
          "Someone before you carved a heart. Read the initials aloud, ask your date if they are yours, claim it if they are, or comment on the moss in the lines. Tie it to what you already carry.",
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
