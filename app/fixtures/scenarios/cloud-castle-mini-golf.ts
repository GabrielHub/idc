import type { DateScenario } from "../../domain/game";

export const cloudCastleMiniGolf: DateScenario = {
  id: "cloud-castle-mini-golf",
  title: "Mini-Golf In The Cloud Castle",
  card: {
    summary:
      "Eighteen holes of self-serve mini-golf laid through an abandoned castle floating in the clouds. Cloud-floor stretches, stone parapets, one windmill.",
    tags: ["public", "low_pressure"],
    risk: "low",
    intimacy: "low",
    chaos: "low",
    cost: 22,
    idealFor: [
      "members who keep score honestly without making it a thing",
      "members who can lose a small game without sulking",
      "members who treat a silly date with full attention",
    ],
    badFor: [
      "members who rewrite the scorecard on hole 17",
      "members who turn the windmill into a personal vendetta",
      "members who treat the cloud-floor as a dare to escalate",
    ],
  },
  publicBrief: {
    location: "Hole 1 tee box, Cloud Castle Mini-Golf, abandoned keep above the cumulus line",
    premise:
      "Cupid booked an after-hours round at the cloud castle course. Eighteen holes, two pencils, two scorecards, and the last booking of the night.",
    whatBothCharactersKnow:
      "The course is self-serve. Putters and balls were issued at the entrance gate. Cloud-floor sections are springy but solid. Stone parapets are cold. Hole 12 has a steady wind. Hole 14 is the windmill. The water fountain is at the turn between holes 9 and 10. A drop bin at hole 18 takes the putters when they leave.",
    openingSituation:
      "Both members stand at the hole 1 tee box. Two putters are in their hands. Two pink golf balls sit at the tee. Two scorecards and two short pencils are clipped to a small stone ledge.",
  },
  director: {
    tone: "soft cloud light, distant wind that does not reach hole 1, low echo of stone and sky, no other patrons",
    rules: [
      "Anchor the date to the course route from hole 1 to hole 18. The pair does not leave the marked path.",
      "Treat all venue infrastructure as self-serve. The course is automated and quiet.",
      "Use the cloud-floor as solid for play, not as a stunt surface. The cloud holds.",
      "Allow gentle competition. Cheating, even light cheating, is a real choice with weight.",
    ],
    events: [
      {
        id: "cloud-castle-mini-golf-event-1",
        title: "Hole 1",
        kind: "ambient",
        event: "The first tee opens the round.",
        characterVisibleText:
          "Hole 1 is a flat par three on stone. Two pink balls sit on the tee. The cup is twenty feet ahead. The two scorecards and two pencils are within reach. Neither pencil has been picked up yet.",
        directorInstruction:
          "Open the round with a small concrete choice: who tees first, who keeps score, who carries the pencils.",
      },
      {
        id: "cloud-castle-mini-golf-event-2",
        title: "Cloud-floor",
        kind: "ambient",
        event: "Hole 4 begins on cloud-floor.",
        characterVisibleText:
          "Hole 4 begins on cloud-floor. The surface is springy underfoot and squeaks lightly with each step. The cup sits in a small stone island a few steps in. Their footprints behind them have already smoothed out.",
        directorInstruction:
          "Use the unfamiliar surface to test the difference between curiosity and bravado.",
      },
      {
        id: "cloud-castle-mini-golf-event-3",
        title: "Narrow parapet",
        kind: "reveal",
        event: "Hole 7 runs along a narrow stone parapet.",
        characterVisibleText:
          "Hole 7 is a long par three on a parapet two arms wide. The drop on the right is open sky. A short rope along the left holds for balance. The cup is at the far end, set into the wall.",
        directorInstruction:
          "Use the narrow path to surface whether either of them positions for the partner's safety without making a show of it.",
      },
      {
        id: "cloud-castle-mini-golf-event-4",
        title: "Turn fountain",
        kind: "reveal",
        event: "The water fountain at the turn is between holes 9 and 10.",
        characterVisibleText:
          "Between holes 9 and 10, a small stone fountain sits in an alcove. A stack of paper cups is in a dispenser on the wall. The fountain handle is cold to the touch. The path is empty in both directions.",
        directorInstruction:
          "Use the small pause to surface small care. Either may fill, drink first, or hand a cup across.",
      },
      {
        id: "cloud-castle-mini-golf-event-5",
        title: "Wind on twelve",
        kind: "provocation",
        event: "Hole 12 has a steady crosswind.",
        characterVisibleText:
          "Hole 12 is a par three on stone with a steady wind across the line. A small windsock at the cup is full. The first putt drifts left of the cup by half a length. The scorecard has space for a second stroke.",
        directorInstruction:
          "Push for a clean call: take the stroke, ask for a do-over, or give the partner the line.",
      },
      {
        id: "cloud-castle-mini-golf-event-6",
        title: "Windmill",
        kind: "provocation",
        event: "Hole 14 is the windmill.",
        characterVisibleText:
          "Hole 14 is the windmill, set on stone. The blades turn at a steady speed. The opening at the base is small. The cup is on the far side. A small placard reads no dispute the windmill.",
        directorInstruction:
          "Push for one direct moment about timing and turn order. Either may take the first try. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "cloud-castle-mini-golf-event-7",
        title: "Hole 17",
        kind: "reveal",
        event: "The scorecard count narrows on hole 17.",
        characterVisibleText:
          "Hole 17 is a short par two on cloud-floor. The scorecard shows a close round, one ahead by two strokes. A pencil mark on the card has been smudged at hole 11. The smudge is recoverable if either of them wants to revisit it.",
        directorInstruction:
          "Use the smudge to surface whether either of them rewrites the count or leaves it.",
      },
      {
        id: "cloud-castle-mini-golf-event-8",
        title: "Putter bin",
        kind: "provocation",
        event: "Hole 18 ends at the putter drop bin.",
        characterVisibleText:
          "Hole 18 is a flat par three on stone. The cup sits a few feet from the drop bin. Two pink balls go into a small return chute. A slot at the bin takes the scorecards. The exit gate is just past it.",
        directorInstruction:
          "Push for a clean exit. The pair tallies, drops the putters, and walks out together or apart. Either is the right answer if it is honest.",
      },
      {
        id: "cloud-castle-mini-golf-event-9",
        title: "Cloud thinning",
        kind: "ambient",
        event: "A patch of cloud-floor thins to translucent under one foot.",
        characterVisibleText:
          "A patch of cloud-floor thins under one foot. Open sky shows through for a beat before the cloud knits itself back. The squeak underfoot is the same as before.",
        directorInstruction:
          "Allow the small thinning. The cloud holds. The pair does not need to make it a stunt or a story.",
      },
    ],
    earlyEndTriggers: [
      "A member rewrites the scorecard to keep a lead.",
      "A member uses the cloud-floor as a stunt to test the partner's nerve.",
    ],
    repeatBehavior:
      "If repeated, the course remembers the prior round's strokes. The smudge at hole 11 is still on the prior card in the archive. The windmill placard is unchanged.",
  },
  judgeRubric: {
    successSignals: [
      "The pair plays a silly round with full attention.",
      "A member loses a stroke or a hole gracefully.",
    ],
    failureSignals: [
      "A member turns the scorecard into a contest of integrity by losing it.",
      "The pair makes a casual game into a referendum.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
