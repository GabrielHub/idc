import type { DateScenario } from "../../domain/game";

export const dmvNumberTicket: DateScenario = {
  id: "dmv-number-ticket",
  title: "DMV, A Number Ticket",
  card: {
    summary: "A regional DMV at one in the afternoon. Two seats in row C. The wait is the date.",
    tags: ["career", "public", "low_pressure"],
    risk: "low",
    intimacy: "low",
    chaos: "low",
    idealFor: [
      "members whose trade work has filled out enough forms to relax in a queue",
      "members whose stoic clipped voice fits a paper smell and a printer cycle",
      "members who treat paperwork as a love language and a place to rest",
      "members who read the renewal as a Term and the wait as a Renewal window",
    ],
    badFor: [
      "members who refuse to take a number on principle",
      "members with no stage in row C and no compliments to extract",
      "members who cannot make a one-hour wait compound into anything useful",
    ],
  },
  publicBrief: {
    location: "Row C, the waiting area at the county DMV office on Route 4, Wednesday afternoon",
    premise:
      "Cupid set a one hour appointment around a routine renewal. The plus one came along to sit through it.",
    whatBothCharactersKnow:
      "There is a number ticket between them, twenty rows of plastic chairs, and one display board. The line moves in batches.",
    openingSituation:
      "Both members sit in row C with a paper number ticket and a folded form between them. The display board reads B 47.",
  },
  director: {
    tone: "fluorescent, paper smell, a printer starting and stopping behind the counter",
    rules: [
      "Anchor the date to row C. The pair does not get up to walk the room.",
      "Treat the DMV as a real DMV. Lines move at the speed they move.",
      "The clerks are not theatrical. They are doing their job at a distance.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "Form check",
        event: "A box on the form has been left blank.",
        characterVisibleText:
          "The form on the lap has eighteen boxes. The line for previous address is empty. A clipboard pen is chained to the counter ten feet away.",
        directorInstruction:
          "Use the small lapse to surface care, control, or deferral without scoring it.",
      },
      {
        atTurn: 20,
        title: "Board jumps",
        event: "The display board moves three numbers in a row, then stops.",
        characterVisibleText:
          "The board reads B 50. Their ticket says B 63. The clerk at window two has stood up. The printer behind the counter starts and stops.",
        directorInstruction:
          "Let the wait open a window. A real question is cheaper here than across a table.",
      },
      {
        atTurn: 28,
        title: "Number called",
        event: "Their number lights up on the board.",
        characterVisibleText:
          "The board reads B 63. Window four has its light on. Two minutes of patience are visibly available.",
        directorInstruction:
          "Push the pair to handle the window together or to step apart on purpose.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the clerk as scenery.",
      "A member uses the wait to deliver a complaint that asks more than the room can hold.",
    ],
    repeatBehavior:
      "If repeated, the office is the same office. The display board has not been replaced. A clerk may recognize the form.",
  },
  judgeRubric: {
    successSignals: [
      "A member sits through the wait without making it a performance.",
      "The pair finishes the renewal together without making the clerk a witness.",
    ],
    failureSignals: [
      "A member uses the lull to interrogate the other.",
      "A member treats the form as a personality test.",
    ],
    statFocus: ["trust", "stability", "relationshipHealth"],
  },
};
