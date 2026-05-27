import type { DateScenario } from "../../domain/game";

export const brickByBrick: DateScenario = {
  id: "brick-by-brick",
  title: "Brick By Brick",
  card: {
    summary:
      "A 5000-piece brick set in one hour at a build studio. One piece in the box is faintly alive.",
    tags: ["domestic", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 7,
    idealFor: [
      "members whose hands work well in long quiet tasks",
      "members who can divide labor without keeping score",
      "members who finish what they start and let small things be small",
    ],
    badFor: [
      "members who must finish to consider the time spent",
      "members who hoard a single bag and refuse to swap",
      "members who cannot leave the instructions to figure a sub-build out",
    ],
  },
  publicBrief: {
    location: "Project table two, build room two, Lockwood Bricks studio",
    premise:
      "Cupid booked one hour at a build studio. A 5000-piece set sits in opened bags on the table. There is a single instruction booklet. The set will not be finished in the hour. One piece in the box is faintly alive. The studio is otherwise empty.",
    whatBothCharactersKnow:
      "There is one set, two builders, one booklet. The bags are numbered one through fourteen. The alive piece is somewhere in one of the bags. It is small enough to fit between two fingers. It does not bite. It moves slowly. It does not need to be returned to the box. The studio does not refill missing pieces.",
    openingSituation:
      "Both members are at the project table. The fourteen open bags are arranged in a small grid. The instruction booklet is at the center, flat and open to page one. A small empty plate is at the corner for the alive piece if it surfaces. The build base is bare.",
  },
  director: {
    tone: "warm overhead lights, the smell of clean plastic, the small click of bricks as the pair handles the first bags, the studio quiet beyond the table",
    flow: "activity",
    rules: [
      "Anchor the date to the project table. The pair does not get up to walk the studio.",
      "Treat the alive piece as fact. It is a brick that moves slowly. Do not narrate its feelings.",
      "Do not voice the alive piece, the booklet, or any studio attendant as a continuing speaker.",
      "Allow the build to remain unfinished. Completion is not the test.",
    ],
    events: [
      {
        id: "brick-by-brick-event-1",
        title: "Bag one open",
        kind: "ambient",
        pitch:
          "Tip bag one onto the table with the booklet open to page one. Surfaces who picks up the booklet and who picks up the first brick.",
        beat: "Bag one is fully tipped onto the table. The bricks fan out in a small drift. The booklet is open to page one. The first sub-build calls for nine pieces. The bag is now empty.",
        directorBeat:
          "The first bag is open. Pull the nine pieces, ask your date to take the booklet, slide some pieces across the table, or start sorting by color. Make a move. Do not voice the booklet.",
      },
      {
        id: "brick-by-brick-event-2",
        title: "Duplicate minifigure",
        kind: "reveal",
        pitch:
          "Find a duplicate minifigure in bag three with a smudge on one helmet. Surfaces honesty about which one to keep building toward.",
        beat: "A duplicate minifigure has been found in bag three. The two figures are identical except for a small smudge of color on one helmet. The booklet shows only one such figure on the cover. The two figures are now on the small plate together.",
        directorBeat:
          "You have two of someone the booklet only printed once. Pick one and put the other aside, ask your date which they prefer, build them both standing next to each other, or put both back in the bag. Speak only from what is in front of you. Do not voice the booklet.",
      },
      {
        id: "brick-by-brick-event-3",
        title: "Missing piece",
        kind: "provocation",
        pitch:
          "Search a small bag and surface a missing 2x2 blue piece for the current sub-build. Forces a clean stance on adapting.",
        beat: "A small bag has been thoroughly searched. The piece the booklet calls for is not in it. The piece is small, blue, and a two-by-two. The current sub-build cannot continue on this part without it. The other bags have not been opened.",
        directorBeat:
          "A required piece is not in the bag. Look for a near match in another bag, set the sub-build aside, ask your date what they would substitute, or take a different sub-build. Make a call. Do not voice the booklet.",
      },
      {
        id: "brick-by-brick-event-4",
        title: "Instructions skip",
        kind: "ambient",
        pitch:
          "Skip the booklet from page forty-six to forty-eight with the bridging step missing. Surfaces an honest moment of trust in working it out.",
        beat: "Page forty-six of the booklet ends mid-step. Page forty-seven is missing. Page forty-eight starts a new sub-build. The bridge between the two is not in the booklet. The bricks for the missing step are in a bag on the table.",
        directorBeat:
          "The booklet skipped on you. Work the missing step from what is on the table, ask your date to guess the bridge, build forward to the next page anyway, or check the spine for the missing page. Do not voice the booklet.",
      },
      {
        id: "brick-by-brick-event-5",
        title: "One piece moves",
        kind: "reveal",
        pitch:
          "Shift a single 1x2 brick half an inch on its own toward one member's hand. Surfaces honest recognition without commentary.",
        beat: "A single one-by-two brick on the table has shifted half an inch on its own. The shift was small but clean. The brick is now slightly closer to one member's hand. No fingers touched it.",
        directorBeat:
          "The alive piece just moved itself toward one of you. Notice it without naming it, ask your date if they saw the move, pick the piece up gently, or leave it where it landed. Speak only from your own register. Do not voice the brick.",
      },
      {
        id: "brick-by-brick-event-6",
        title: "Cross-set piece",
        kind: "provocation",
        pitch:
          "Surface a piece from a different set at the bottom of bag nine. Forces a clean stance on the foreign part.",
        beat: "A piece from a completely different set has been found at the bottom of bag nine. The piece is from a castle line, not this set. The piece does not fit anywhere in the current build. The booklet does not acknowledge it.",
        directorBeat:
          "A piece from a different box just turned up. Set it aside, hand it to your date, drop it into the build anyway as a small joke, or put it back at the bottom of bag nine. Make the call. Do not voice the piece.",
      },
      {
        id: "brick-by-brick-event-7",
        title: "Studio hum drops",
        kind: "ambient",
        pitch:
          "Drop the room hum by a degree with finished sub-builds at the corner. Surfaces a quiet moment to take stock.",
        beat: "The room hum has dropped a degree. The overhead light has not changed. The pair's pile of finished sub-builds is in the corner of the table. The alive piece is still on the small plate.",
        directorBeat:
          "The studio just quieted a small notch. Take stock of what is done, ask your date what they want to finish next, slide the plate closer, or pick up the booklet. Do not voice the hum.",
      },
      {
        id: "brick-by-brick-event-8",
        title: "Forty minutes left",
        kind: "provocation",
        pitch:
          "Tick the wall clock to forty minutes with the build at a quarter and the booklet at page twenty of one hundred sixty. Forces a clean stance on pace.",
        beat: "A small clock on the wall has ticked to forty minutes. The build is one quarter done by piece count. The booklet is open to page twenty of one hundred and sixty. The pair has not yet swapped bags.",
        directorBeat:
          "Forty minutes is on the clock. Push for a chosen sub-build to finish, propose to your date that the hour is enough as it is, swap bags now, or keep the same pace. Make the call. Do not voice the clock.",
      },
      {
        id: "brick-by-brick-event-9",
        title: "Alive piece walks",
        kind: "reveal",
        pitch:
          "Walk the alive piece off the plate onto the booklet's printed brick image. Surfaces honesty about what the piece is choosing.",
        beat: "The alive piece on the small plate has walked a small distance. The piece is now off the plate and on the booklet. It rests on page twenty-one, half on the printed image of a brick. It has not been touched.",
        directorBeat:
          "The alive piece left the plate. Slide the booklet a small angle to keep it level, ask your date what to do with it, pick up the page edges gently, or leave the piece where it sits. Speak only from what is in front of you. Do not voice the piece.",
      },
    ],
    earlyEndTriggers: [
      "A member declares the unfinished build a moral failing of the partner.",
      "A member treats the alive piece like a pet to acquire and pocket.",
    ],
    repeatBehavior:
      "If repeated, the studio holds project table two. The booklet skips the same page. The alive piece is in a different bag each time.",
  },
  judgeRubric: {
    successSignals: [
      "A member divides bags with the partner without counting pieces.",
      "The pair finishes the hour with one sub-build done and the alive piece left where it landed.",
    ],
    failureSignals: [
      "A member treats the missing piece as evidence the partner did not look.",
      "The pair argues about completion math in the last ten minutes.",
    ],
    statFocus: ["chemistry", "stability", "trust"],
  },
};
