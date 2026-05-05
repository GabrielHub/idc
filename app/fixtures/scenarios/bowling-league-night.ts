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
    idealFor: [
      "members who like a structured bit",
      "competitive members who can lose",
      "pairs who need an activity, not a conversation",
    ],
    badFor: ["members who cannot grip a 9 pound ball", "members who dislike strangers nearby"],
  },
  publicBrief: {
    location: "Lane 7, Strikepoint Lanes, Tuesday league overflow",
    premise:
      "Cupid booked one lane during a Tuesday league. Bumper bowling is in progress for a child two lanes over.",
    whatBothCharactersKnow:
      "The league is not their league. The league captains are aware and indifferent.",
    openingSituation:
      "Both members tie their rented shoes. The ball return delivers the first ball.",
  },
  director: {
    tone: "cheerful, slightly rowdy, lit by overhead fixtures and a glowing lane line",
    rules: [
      "Treat bowling as a real activity. Track score lightly.",
      "Use the league as ambient background. Do not invite a captain to comment on the date.",
      "Allow gutter balls to be funny. Keep them human.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "First frame",
        event: "Both members take their first turn.",
        characterVisibleText: "Two balls are thrown. The pin sweep clears whatever happens.",
        directorInstruction:
          "Use opening throws to establish how each member treats failure in front of the other.",
      },
      {
        atTurn: 18,
        title: "Score check",
        event: "The scoreboard updates and the gap is visible.",
        characterVisibleText:
          "The screen shows the running score. One column is meaningfully ahead.",
        directorInstruction:
          "Use the scoreboard to surface competitiveness, generosity, or deflection.",
      },
      {
        atTurn: 26,
        title: "Tenth frame",
        event: "The last frame approaches with a real chance to change the result.",
        characterVisibleText: "Frame ten is loaded. The pinsetter waits.",
        directorInstruction:
          "Push the pair to choose between winning the frame and choosing the date.",
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
