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
    flow: "activity",
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
        pitch:
          "Open the round at a flat par three. Forces a small concrete choice on who tees first and who keeps score.",
        beat: "Hole 1 is a flat par three on stone. Two pink balls sit on the tee. The cup is twenty feet ahead. The two scorecards and two pencils are within reach. Neither pencil has been picked up yet.",
        directorBeat:
          "The round is about to start. Tee up, hand the putter across, claim the scorecard, or wave your date to go first. Set a small rule for how this round runs.",
      },
      {
        id: "cloud-castle-mini-golf-event-2",
        title: "Cloud-floor",
        kind: "ambient",
        pitch:
          "Open hole 4 on springy cloud-floor that squeaks underfoot. Surfaces whether either turns the surface into a curiosity or a stunt.",
        beat: "Hole 4 begins on cloud-floor. The surface is springy underfoot and squeaks lightly with each step. The cup sits in a small stone island a few steps in. Their footprints behind them have already smoothed out.",
        directorBeat:
          "The ground is doing something strange. Bounce on it lightly, point at the smoothed footprints, comment to your date about the squeak, or play the hole straight. Do not turn it into a dare.",
      },
      {
        id: "cloud-castle-mini-golf-event-3",
        title: "Narrow parapet",
        kind: "reveal",
        pitch:
          "Run hole 7 along a narrow parapet with an open-sky drop on the right. Surfaces whether either positions for the partner's safety without making it a show.",
        beat: "Hole 7 is a long par three on a parapet two arms wide. The drop on the right is open sky. A short rope along the left holds for balance. The cup is at the far end, set into the wall.",
        directorBeat:
          "There is a real drop on one side. Move along the rope side, offer your date the inside line, hold their elbow at the turn, or trust them to walk it alone. Show care without making it a rescue.",
      },
      {
        id: "cloud-castle-mini-golf-event-4",
        title: "Turn fountain",
        kind: "reveal",
        pitch:
          "Land the stone fountain and cup dispenser at the turn between 9 and 10. Surfaces small care: fill a cup, drink first, or pass it across.",
        beat: "Between holes 9 and 10, a small stone fountain sits in an alcove. A stack of paper cups is in a dispenser on the wall. The fountain handle is cold to the touch. The path is empty in both directions.",
        directorBeat:
          "Water is in reach and the round is paused. Fill two cups, hand one to your date, drink first, or skip the pause. Make the small gesture or skip it cleanly.",
      },
      {
        id: "cloud-castle-mini-golf-event-5",
        title: "Wind on twelve",
        kind: "provocation",
        pitch:
          "Push a steady crosswind across hole 12 that drifts the first putt off line. Forces a clean call on the stroke, a do-over, or handing the line over.",
        beat: "Hole 12 is a par three on stone with a steady wind across the line. A small windsock at the cup is full. The first putt drifts left of the cup by half a length. The scorecard has space for a second stroke.",
        directorBeat:
          "The wind just took your shot. Take the stroke as written, ask for a do-over, give your date a clean line, or play it from where it lies. Be visible about your scoring.",
      },
      {
        id: "cloud-castle-mini-golf-event-6",
        title: "Windmill",
        kind: "provocation",
        pitch:
          "Plant the windmill on hole 14 with a small opening and a no-dispute placard. Forces a clean moment on timing and turn order.",
        beat: "Hole 14 is the windmill, set on stone. The blades turn at a steady speed. The opening at the base is small. The cup is on the far side. A small placard reads no dispute the windmill.",
        directorBeat:
          "The classic obstacle is in front of you. Time your stroke, hand the putter to your date to try first, joke about the placard, or call your shot. Make timing visible. Do not voice the windmill placard.",
      },
      {
        id: "cloud-castle-mini-golf-event-7",
        title: "Hole 17",
        kind: "reveal",
        pitch:
          "Surface a recoverable smudge on hole 11's pencil mark with a close round in the balance. Forces a stance on rewriting history or leaving it.",
        beat: "Hole 17 is a short par two on cloud-floor. The scorecard shows a close round, one ahead by two strokes. A pencil mark on the card has been smudged at hole 11. The smudge is recoverable if either of them wants to revisit it.",
        directorBeat:
          "Your scorecard has a smudge you could fix. Leave it, rewrite it down, rewrite it up, or call your date over to look at it together. Be transparent about what you did. Do not voice the card.",
      },
      {
        id: "cloud-castle-mini-golf-event-8",
        title: "Putter bin",
        kind: "provocation",
        pitch:
          "End at the drop bin and chute at hole 18. Forces a clean tally and exit, together or separately.",
        beat: "Hole 18 is a flat par three on stone. The cup sits a few feet from the drop bin. Two pink balls go into a small return chute. A slot at the bin takes the scorecards. The exit gate is just past it.",
        directorBeat:
          "The round is closing. Tally the scorecard out loud, drop the putters, walk out together, or split off through the gate. Pick the move.",
      },
      {
        id: "cloud-castle-mini-golf-event-9",
        title: "Cloud thinning",
        kind: "ambient",
        pitch:
          "Thin a patch of cloud-floor under one foot for a beat. Surfaces whether either treats the moment as a stunt or a small wonder.",
        beat: "A patch of cloud-floor thins under one foot. Open sky shows through for a beat before the cloud knits itself back. The squeak underfoot is the same as before.",
        directorBeat:
          "The floor just went translucent for a heartbeat. Step off, look down with your date, comment on the knit, or play the next stroke without breaking stride. Do not turn it into a dare or a test of nerves.",
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
