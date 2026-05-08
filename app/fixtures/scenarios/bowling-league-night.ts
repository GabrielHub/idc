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
    beats: [
      {
        atTurn: 10,
        title: "Ball return",
        event: "The ball return delivers a ball with a thud they can feel through the bench.",
        characterVisibleText:
          "The ball return rumbles and a house ball rolls up. The thud carries through the bench. The lane line glow flickers once.",
        directorInstruction:
          "Use the small noise to surface how each member treats their turn in front of the other.",
      },
      {
        atTurn: 20,
        title: "Strike next door",
        event: "Lane 6 lights up with a strike celebration.",
        characterVisibleText:
          "Lane 6 erupts. A strike animation runs across the scoreboard above lane 7 by mistake. Their column reads two columns of zeros.",
        directorInstruction:
          "Use the borrowed noise to surface competitiveness, generosity, or deflection.",
      },
      {
        atTurn: 28,
        title: "Pinsetter pause",
        event: "The pinsetter on lane 7 stops mid-cycle.",
        characterVisibleText:
          "The pinsetter freezes mid-rack with three pins still hanging. The bench light blinks. A small wait icon appears on the scoreboard.",
        directorInstruction:
          "Push the pair to share the wait or peel apart toward separate distractions.",
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
