import type { DateScenario } from "../../domain/game";

export const dmvNumberTicket: DateScenario = {
  id: "dmv-number-ticket",
  title: "DMV, A Number Ticket",
  card: {
    summary:
      "A regional DMV at one in the afternoon. One member has a routine renewal. The other came along.",
    tags: ["career", "public", "low_pressure"],
    risk: "low",
    intimacy: "low",
    chaos: "low",
    idealFor: [
      "members who relax inside a queue",
      "pairs that can sit on plastic chairs together",
      "members who treat paperwork as a love language",
    ],
    badFor: ["members who need a venue to perform inside", "members who refuse to take a number"],
  },
  publicBrief: {
    location: "The county DMV office on Route 4, Wednesday afternoon",
    premise:
      "Cupid set a one hour appointment around a routine renewal. The plus one came along to sit through it.",
    whatBothCharactersKnow:
      "There is a number ticket, twenty rows of plastic chairs, and one window labeled REGISTRATION. The line moves in batches.",
    openingSituation:
      "Both members sit down with a paper number ticket and a folded form. The display board reads B 47.",
  },
  director: {
    tone: "fluorescent, paper smell, a printer starting and stopping behind the counter",
    rules: [
      "Treat the DMV as a real DMV. Lines move at the speed they move.",
      "The clerks are not theatrical. They are doing their job.",
      "Allow long stretches with nothing happening. The wait is the scene.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Form check",
        event: "One member reviews their form. A box has been left blank.",
        characterVisibleText:
          "The form has eighteen boxes. The line for previous address is empty. A clipboard pen is chained to the counter ten feet away.",
        directorInstruction:
          "Use the small lapse to surface care, control, or deferral without scoring it.",
      },
      {
        atTurn: 16,
        title: "Number called",
        event: "The display board moves three numbers in a row, then stops.",
        characterVisibleText:
          "The board reads B 50. Their ticket says B 63. The clerk at window two has stood up.",
        directorInstruction:
          "Let the wait open a window. A real question is cheaper here than across a table.",
      },
      {
        atTurn: 26,
        title: "Their number",
        event: "Their number is called. The window has two minutes of patience and no more.",
        characterVisibleText:
          "The board reads B 63. Window four waves them up without looking up from the keyboard.",
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
