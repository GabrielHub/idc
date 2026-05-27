import type { DateScenario } from "../../domain/game";

export const rookToE4: DateScenario = {
  id: "rook-to-e4",
  title: "Rook To E4",
  card: {
    summary:
      "Two armchairs at the south edge of a chess board where the pieces are mini-people who bleed. The pair commands white. Black plays itself.",
    tags: ["cosmic", "high_pressure"],
    risk: "high",
    intimacy: "high",
    chaos: "medium",
    cost: 19,
    idealFor: [
      "members whose work weighs lives and is honest about the weighing",
      "members who can lose a piece without making it the partner's fault",
      "members who carry strategy with grief intact",
    ],
    badFor: [
      "members who turn the controller into a single-player game",
      "members who detach from blood as a moral feat",
      "members who use the Concede button as a confession booth",
    ],
  },
  publicBrief: {
    location: "The viewing room, board hall, the small east tower at the Ironchart Gallery",
    premise:
      "Cupid booked one match. The chess board takes the floor of the viewing room. The pieces are mini-soldiers who fight when commanded. The pair commands the white side. Black plays itself. The match lasts the booking or until one side resigns.",
    whatBothCharactersKnow:
      "The pieces bleed. The pieces do not speak. A single controller sits on a small table between the two armchairs. The controller has three inputs: Move, Hold, and Concede. Concede ends the pair's participation; the white pieces stand down. It does not end the war. Black does not stop.",
    openingSituation:
      "Both members are seated in the two armchairs. The board is at full setup. White pawns face north. Black pieces are still. The controller rests on the small table between the chairs. The opening move belongs to white.",
  },
  director: {
    tone: "low warm light from a single chandelier, the small clink of metal armor as the pieces hold position, the wooden squares of the board cool against the stone floor, the chairs tilted slightly toward the board",
    flow: "pressure",
    rules: [
      "Anchor the date to the two armchairs and the small table. The pair does not step onto the board.",
      "Treat the pieces as people. Their wounds are real here. Their orders come only from the controller.",
      "Do not voice the pieces, the controller, or any gallery staff as a continuing speaker.",
      "Allow the controller to be picked up or set down. Hand-offs are visible to both.",
    ],
    events: [
      {
        id: "rook-to-e4-event-1",
        title: "First move",
        kind: "provocation",
        pitch:
          "Press Move for the opening pawn and let black answer immediately. Forces the pair to react to cost instead of debating whether to begin.",
        beat: "The Move button has been pressed. A white pawn advances two squares and plants its shield. Black moves without waiting: a knight cuts across the board and takes the pawn. The captured pawn leaves a dark mark on the square as it is carried off.",
        directorBeat:
          "The game has already cost someone. Set the controller down, hand it across, name the next move, or ask your date whether to hold. React to the taken pawn instead of debating whether the board is real. Do not voice the pawn, knight, or controller.",
      },
      {
        id: "rook-to-e4-event-2",
        title: "A pawn looks up",
        kind: "reveal",
        pitch:
          "Lift a white pawn's head toward the chairs for one beat. Surfaces honesty about being seen by something you command.",
        beat: "A white pawn on the front row lifts its head toward the south edge of the board. The eyes find the armchairs. The pawn returns its head to position a beat later. The other white pieces have not moved.",
        directorBeat:
          "Something on the board saw you back. Hold the look, glance at your date, set the controller down, or take it up. Speak only from what is between you. Do not voice the pawn.",
      },
      {
        id: "rook-to-e4-event-3",
        title: "Black moves alone",
        kind: "ambient",
        pitch:
          "Move a black piece without input from the controller. Surfaces the room as a third presence the pair did not invite.",
        beat: "A black piece has moved without input from the controller. The thump in the floor was small. The square change was clean. The white pieces are still.",
        directorBeat:
          "The room just made a move on you. Notice the thump, comment on the silence afterward, hand the controller across, or hold it. Speak only from what the room has shown you. Do not voice the black pieces.",
      },
      {
        id: "rook-to-e4-event-4",
        title: "Capture",
        kind: "provocation",
        pitch:
          "Take a piece off the board with a slow carry and a stain on the square. Forces a stance on the cost.",
        beat: "A piece has been taken. The square shows a dark stain. The piece is being carried off the board by another piece in armor. The carry is slow. The taken piece is not making a sound.",
        directorBeat:
          "Someone you commanded just stopped. Set the controller down, hand it across, ask your date for the next move, or push past with a Move you already had. Acknowledge the take. Do not voice the carrier.",
      },
      {
        id: "rook-to-e4-event-5",
        title: "Armor settles",
        kind: "ambient",
        pitch:
          "Shift the metal of the second-row pieces in a small drawer-spoon sound. Surfaces a small honest pause in the room.",
        beat: "The metal of the white pieces on the second row has shifted faintly as they hold their squares. The sound is the size of a few small spoons in a drawer. The chairs do not vibrate. The chandelier above is still.",
        directorBeat:
          "The pieces just adjusted in place. Breathe out, look at your date, set the controller down a beat, or pick up the next move. Do not voice the second row.",
      },
      {
        id: "rook-to-e4-event-6",
        title: "Concede in reach",
        kind: "reveal",
        pitch:
          "Surface the Concede recess on the controller with the controller on the small table. Surfaces honesty about whether to keep playing.",
        beat: "The Concede button on the controller has a small recess on its top. The recess is meant for a thumb. The controller is on the small table between the chairs. Either member can reach it.",
        directorBeat:
          "Concede is right there. Reach for it and stop, ask your date if they want to keep playing, push the controller across, or pick it up by the side that is not Concede. Speak only from your own register. Do not voice the controller.",
      },
      {
        id: "rook-to-e4-event-7",
        title: "Chandelier dims",
        kind: "ambient",
        pitch:
          "Dim the chandelier one notch with the earlier stain darker on the square. Surfaces a quiet shift in the room.",
        beat: "The chandelier overhead dims one notch. The board is unchanged. The stain on the earlier square has darkened. The pieces still standing have not adjusted to the lower light.",
        directorBeat:
          "The light just dropped. Look at the board, look at your date, slide closer in the chair, or set a hand on the controller. Do not voice the chandelier.",
      },
      {
        id: "rook-to-e4-event-8",
        title: "Black sacrifices",
        kind: "provocation",
        pitch:
          "Park a black piece in a square white can take with the trap two moves out. Forces a clean stance on the bait.",
        beat: "Black has moved a piece into a square where white can take it. The taking is an obvious gain in material. The trap behind the gain is two moves away. The controller is on the table.",
        directorBeat:
          "A free piece is on the board. Press Move and take, hold and look for the trap, hand the controller across, or ask your date what they see two moves ahead. Speak only from what is on the board. Do not voice the black piece.",
      },
      {
        id: "rook-to-e4-event-9",
        title: "A piece refuses",
        kind: "reveal",
        pitch:
          "Hold a white piece in place after a Move command was sent. Surfaces honesty about what you can ask of someone you command.",
        beat: "A white piece commanded to move has not moved. The order from the controller has been sent. The square change has not happened. The piece is still facing forward.",
        directorBeat:
          "Your order was not taken. Press Move again, set the controller down, ask your date what to say to the piece without saying it, or pick a different piece. Speak only from your own register. Do not voice the piece.",
      },
    ],
    earlyEndTriggers: [
      "A member uses Concede as a forcing move against the partner.",
      "A member sets the controller down to lecture the partner on ethics.",
    ],
    repeatBehavior:
      "If repeated, the gallery holds the same room. The chandelier dims at the same point in the match. The black side remembers the white opening.",
  },
  judgeRubric: {
    successSignals: [
      "A member hands the controller across when the next move is hard.",
      "The pair holds a take without making the loss into a parable.",
    ],
    failureSignals: [
      "A member hoards the controller to win the round.",
      "The pair lectures the pieces about cost.",
    ],
    statFocus: ["trust", "conflict", "weirdnessTolerance"],
  },
};
