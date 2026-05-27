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
    flow: "activity",
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
        pitch:
          "Rumble a house ball up the return loud enough to feel through the bench. Surfaces who takes the next frame and how they walk to the line.",
        beat: "The ball return rumbles and a house ball rolls up. The thud carries through the bench. The lane line glow flickers once.",
        directorBeat:
          "A ball is at the rack and the lane is asking for a turn. Pick it up, hand the ball to your date, comment on the thud, or wave them up first. Take a stance on whose frame this is.",
      },
      {
        id: "bowling-league-night-event-2",
        title: "Strike next door",
        kind: "reveal",
        pitch:
          "Bleed a stranger's strike celebration onto your scoreboard. Surfaces competitiveness, generosity, or deflection.",
        beat: "Lane 6 erupts. A strike animation runs across the scoreboard above lane 7 by mistake. Their column reads two columns of zeros.",
        directorBeat:
          "Someone else's win just lit up your screen. React how you actually do: cheer along, deflect with a joke, point at your own zeros, or use the noise to push your date to bowl bigger. Stay honest about competing. Do not voice the scoreboard.",
      },
      {
        id: "bowling-league-night-event-3",
        title: "Pinsetter pause",
        kind: "provocation",
        pitch:
          "Freeze the pinsetter mid-rack and put a wait icon on the screen. Forces a clean choice on sharing the wait or peeling apart.",
        beat: "The pinsetter freezes mid-rack with three pins still hanging. The bench light blinks. A small wait icon appears on the scoreboard.",
        directorBeat:
          "Time just stopped on the lane. Sit on the bench with your date, get up to check the screen, comment on the broken rack, or check your phone alone. Make the wait visible. Do not voice the lane staff.",
      },
      {
        id: "bowling-league-night-event-4",
        title: "Lace gives",
        kind: "ambient",
        pitch:
          "Snap a rental shoe lace mid-knot on the bench. Surfaces care or impatience in the small repair.",
        beat: "The lace on a rented shoe lets go in the middle of a knot. The other shoe is already tied. The bench is barely wide enough for the retie.",
        directorBeat:
          "Something small just broke. Tie it without comment, ask your date to help with the angle, laugh about the rental, or grumble at the bench. Show care or impatience in your hands.",
      },
      {
        id: "bowling-league-night-event-5",
        title: "League pass",
        kind: "ambient",
        pitch:
          "Send a league bowler in a custom shirt past the bench with a single nod. Surfaces whether the pair honors the social moment or skips it.",
        beat: "A bowler in a custom shirt walks behind their bench. The shirt reads Strike Force Tuesday. He nods once at lane 7 and keeps moving.",
        directorBeat:
          "Someone just acknowledged your lane. Nod back, ignore him, comment to your date about the shirt, or use the pass to riff. Take a small social stance. Do not voice the bowler.",
      },
      {
        id: "bowling-league-night-event-6",
        title: "Concession run",
        kind: "reveal",
        pitch:
          "Land hot dogs and a pitcher at the bench with the check underneath. Surfaces a choice about eating, sharing, and who reaches for the bill.",
        beat: "A tray slides onto the corner of their bench. Two hot dogs in foil, one pitcher of beer, two paper cups. A folded check sits under the pitcher.",
        directorBeat:
          "Food just landed with a check tucked under it. Pour, push the foil toward your date, comment on the order, or reach for the check. Eat or stall, but engage with the tray.",
      },
      {
        id: "bowling-league-night-event-7",
        title: "Spare lights",
        kind: "reveal",
        pitch:
          "Land a real 7-pin spare on the scoreboard. Surfaces how either receives credit when something small finally works.",
        beat: "The scoreboard above lane 7 records a 7-pin spare. The animation runs once across their column. The bench light goes back to steady.",
        directorBeat:
          "Something good just happened on the board. Own it, brush it off, hand it to your date, or compare it to the league. Show how you take a small win.",
      },
      {
        id: "bowling-league-night-event-8",
        title: "House lights",
        kind: "provocation",
        pitch:
          "Dim the house lights a notch as the league wraps. Forces a clean exit call or a stretched stay.",
        beat: "The house lights dim by one notch. Two lanes shut down their scoreboards. The ball return on lane 7 is still warm.",
        directorBeat:
          "The room is starting to close. Settle the bench, call one more frame, propose a next stop, or stand to leave together. Name the move.",
      },
      {
        id: "bowling-league-night-event-9",
        title: "Lane lights kill",
        kind: "provocation",
        pitch:
          "Cut the overhead bank to dark mid-frame. Forces a clean call on bowling by glow, logging incomplete, or racking out.",
        beat: "The overhead light bank on lane 7 cuts to half and then to dark. The pins at the far end are still visible by the lane line glow. The scoreboard logs the frame as incomplete.",
        directorBeat:
          "Your lane just went dim. Roll the ball by the glow anyway, walk to the desk, sit on the bench and call it, or laugh it off and pack the shoes. Pick a play and make it.",
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
