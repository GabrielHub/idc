import type { DateScenario } from "../../domain/game";

export const mallFoodCourtWeeknight: DateScenario = {
  id: "mall-food-court-weeknight",
  title: "Mall Food Court, Weeknight",
  card: {
    summary: "A plastic table under fluorescents. Each member picks their own counter.",
    tags: ["food", "public", "low_pressure"],
    risk: "low",
    intimacy: "low",
    chaos: "low",
    idealFor: [
      "low-trust pairs that need an exit ramp",
      "indecisive members who can compromise",
      "members who want a public buffer",
    ],
    badFor: [
      "members who need a controlled tone",
      "members who treat fluorescents as personal insult",
    ],
  },
  publicBrief: {
    location: "Center table, food court, second floor of a regional mall",
    premise:
      "Cupid set the meeting at a public food court. There is no reservation. The concourse is open until nine.",
    whatBothCharactersKnow:
      "Each member orders for themselves. The shared elements are the table and the time. The Sbarro is, regrettably, present.",
    openingSituation: "Both members meet at the table with their trays already in hand.",
  },
  director: {
    tone: "fluorescent, cheerful in a tired way, lightly echoing",
    rules: [
      "Use the public foot traffic as ambient pressure, not as a plot device.",
      "Do not let the food court turn supernatural. Members can.",
      "Allow the pair to leave when they are done. There is no closing speech.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Tray reveal",
        event: "Both trays are now on the table. Choices are visible.",
        characterVisibleText:
          "The trays sit side by side. The food choices are now an introduction.",
        directorInstruction: "Use the food choices to start a small honest exchange.",
      },
      {
        atTurn: 16,
        title: "Concourse interruption",
        event: "A small public moment passes their table. A toddler, a kiosk pitch, a stroller.",
        characterVisibleText:
          "A toddler runs past holding a giant pretzel. Their parent jogs three paces behind.",
        directorInstruction: "Let the interruption land or be ignored. Both reveal the pair.",
      },
      {
        atTurn: 26,
        title: "Tray return",
        event: "Trays go to the rack. One member offers to walk the other to their car or transit.",
        characterVisibleText: "The trays stack on the rack. The escalators hum two stores away.",
        directorInstruction: "Push for a small clear next step or a clean goodbye.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the venue as evidence Cupid does not respect them.",
      "A member uses the public setting to avoid actually talking.",
    ],
    repeatBehavior:
      "If repeated, the same table tends to be available. Cupid claims this is coincidence.",
  },
  judgeRubric: {
    successSignals: [
      "The pair makes the public space feel intimate without forcing it.",
      "A member chooses honesty over charm at least once.",
    ],
    failureSignals: [
      "A member performs for the food court instead of the date.",
      "The pair lets the surroundings dictate the tone.",
    ],
    statFocus: ["chemistry", "stability", "weirdnessTolerance"],
  },
};
