import type { DateScenario } from "../../domain/game";

export const bowlingLeagueNight: DateScenario = {
  id: "bowling-league-night",
  title: "Bowling Alley, League Night",
  card: {
    summary:
      "House shoes, scoreboards, hot dogs in foil. Mild competition under league chaperones.",
    tags: ["public", "food", "low_pressure"],
    risk: "medium",
    intimacy: "low",
    chaos: "medium",
    cost: 8,
    idealFor: [
      "members whose competitive streak likes a scoreboard with stakes",
      "members who can lose a frame and stay friendly",
      "members whose warm steady voice handles a gutter ball without sulking",
    ],
    badFor: [
      "members who literally cannot grip a 9 pound ball",
      "members who will turn the scoring into a Bargain on the bench",
      "members who count the tenth frame as a Trial",
    ],
  },
  publicBrief: {
    location: "Lane 7, Strikepoint Lanes, Tuesday league overflow",
    premise:
      "Cupid booked one lane during a Tuesday league. The pair shares the lane and the ball return for the evening.",
    whatBothCharactersKnow:
      "The league is not their league. The league captains are aware and indifferent. Bumper bowling is in progress two lanes over.",
    openingSituation:
      "Both members tie their rented shoes at the lane 7 ball return. Two house balls sit on the rack. The scoreboard above is on but unscored.",
  },
  director: {
    tone: "cheerful, slightly rowdy, lit by overhead fixtures and a glowing lane line",
    rules: [
      "Anchor the date to lane 7. The pair does not travel to the bar, the arcade, or the snack counter.",
      "Use the league as ambient background. Do not invite a captain to comment on the date.",
      "Allow gutter balls to be funny. Keep them human.",
    ],
    events: [
      {
        id: "bowling-league-night-event-1",
        title: "Ball return",
        kind: "ambient",
        event: "The ball return delivers a ball with a thud they can feel through the bench.",
        characterVisibleText:
          "The ball return rumbles and a house ball rolls up. The thud carries through the bench. The lane line glow flickers once.",
        directorInstruction:
          "Use the small noise to surface how each member treats their turn in front of the other.",
      },
      {
        id: "bowling-league-night-event-2",
        title: "Strike next door",
        kind: "reveal",
        event: "Lane 6 lights up with a strike celebration.",
        characterVisibleText:
          "Lane 6 erupts. A strike animation runs across the scoreboard above lane 7 by mistake. Their column reads two columns of zeros.",
        directorInstruction:
          "Use the borrowed noise to surface competitiveness, generosity, or deflection drawn from each member's existing register. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "bowling-league-night-event-3",
        title: "Pinsetter pause",
        kind: "provocation",
        event: "The pinsetter on lane 7 stops mid-cycle.",
        characterVisibleText:
          "The pinsetter freezes mid-rack with three pins still hanging. The bench light blinks. A small wait icon appears on the scoreboard.",
        directorInstruction:
          "Push the pair to share the wait or peel apart toward separate distractions. The wait demands a move.",
      },
      {
        id: "bowling-league-night-event-4",
        title: "Lace gives",
        kind: "ambient",
        event: "A rental shoe lace gives mid-knot.",
        characterVisibleText:
          "The lace on a rented shoe lets go in the middle of a knot. The other shoe is already tied. The bench is barely wide enough for the retie.",
        directorInstruction: "Use the small repair to surface care or impatience.",
      },
      {
        id: "bowling-league-night-event-5",
        title: "League pass",
        kind: "ambient",
        event: "A league bowler walks the gap behind the bench.",
        characterVisibleText:
          "A bowler in a custom shirt walks behind their bench. The shirt reads Strike Force Tuesday. He nods once at lane 7 and keeps moving.",
        directorInstruction:
          "Allow a tiny social moment that the pair can ignore or honor. The bowler does not speak.",
      },
      {
        id: "bowling-league-night-event-6",
        title: "Concession run",
        kind: "reveal",
        event: "A tray of hot dogs and a pitcher lands at the bench corner.",
        characterVisibleText:
          "A tray slides onto the corner of their bench. Two hot dogs in foil, one pitcher of beer, two paper cups. A folded check sits under the pitcher.",
        directorInstruction:
          "Let the pair eat or not. Either reads as a real choice in front of league chaperones.",
      },
      {
        id: "bowling-league-night-event-7",
        title: "Spare lights",
        kind: "reveal",
        event: "Their lane finally records a spare.",
        characterVisibleText:
          "The scoreboard above lane 7 records a 7-pin spare. The animation runs once across their column. The bench light goes back to steady.",
        directorInstruction: "Use the small win to test how each member receives credit.",
      },
      {
        id: "bowling-league-night-event-8",
        title: "House lights",
        kind: "provocation",
        event: "House lights dim as the league wraps.",
        characterVisibleText:
          "The house lights dim by one notch. Two lanes shut down their scoreboards. The ball return on lane 7 is still warm.",
        directorInstruction:
          "Push for a clean exit or a stretched stay before the lanes close out.",
      },
      {
        id: "bowling-league-night-event-9",
        title: "Lane lights kill",
        kind: "provocation",
        event: "Lane 7's overhead bank goes dark mid-frame.",
        characterVisibleText:
          "The overhead light bank on lane 7 cuts to half and then to dark. The pins at the far end are still visible by the lane line glow. The scoreboard logs the frame as incomplete.",
        directorInstruction:
          "Push for a clean choice: bowl by the lane glow, log the frame as is, or rack out and head to the bench. The desk will not reset without an answer.",
      },
    ],
    earlyEndTriggers: [
      "A member humiliates the other over a low score.",
      "A member treats the league bowlers as comic relief.",
    ],
    repeatBehavior:
      "If repeated, the lane assignment may pull from prior sessions. Their average is now on file.",
  },
  judgeRubric: {
    successSignals: [
      "A member handles a poor frame without sulking.",
      "The pair laughs at themselves before they laugh at the lane.",
    ],
    failureSignals: [
      "A member uses the score to score a relationship point.",
      "The pair fixates on the league instead of the lane.",
    ],
    statFocus: ["spark", "conflict", "stability"],
  },
};
