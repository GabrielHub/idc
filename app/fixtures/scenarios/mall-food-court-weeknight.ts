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
    cost: 5,
    idealFor: [
      "members who can read a tray and an exit at the same time",
      "members whose dry deadpan handles a Sbarro with no drama",
      "members who will spiral kindly across a plastic table",
    ],
    badFor: [
      "members who treat fluorescents and unstructured mingling as personal insults",
      "members who cannot find a mirror or a bow in a food court",
      "members who cannot pitch from a tray return",
    ],
  },
  publicBrief: {
    location: "Center table, food court, second floor of a regional mall",
    premise:
      "Cupid set the meeting at a public food court. There is no reservation. The concourse is open until nine.",
    whatBothCharactersKnow:
      "Each member orders for themselves. The shared elements are the table and the time. The Sbarro is, regrettably, present.",
    openingSituation:
      "Both members are seated at the center table. Both trays are already in front of them with food choices visible.",
  },
  director: {
    tone: "fluorescent, cheerful in a tired way, lightly echoing",
    rules: [
      "Anchor the date to the center table. The pair stays seated through the date.",
      "Use public foot traffic as ambient pressure, not as a plot device.",
      "Do not let the food court turn supernatural. Members can.",
    ],
    events: [
      {
        id: "mall-food-court-weeknight-event-1",
        title: "Tray reveal",
        kind: "reveal",
        event: "Both trays are now between them. Choices are visible.",
        characterVisibleText:
          "The trays sit side by side. The food choices are now an introduction. One tray has a free fortune cookie that did not belong with the order.",
        directorInstruction:
          "Use the food choices to start a small honest exchange. Each draws on what they actually order, not invented preferences.",
      },
      {
        id: "mall-food-court-weeknight-event-2",
        title: "Concourse passersby",
        kind: "ambient",
        event: "A small public moment passes their table.",
        characterVisibleText:
          "A toddler runs past holding a giant pretzel. Their parent jogs three paces behind. A kiosk pitch starts up two stores away.",
        directorInstruction:
          "Let the interruption land or be ignored. Both reveal the pair. Do not voice the toddler, parent, or kiosk staff.",
      },
      {
        id: "mall-food-court-weeknight-event-3",
        title: "Trays cleared",
        kind: "provocation",
        event: "A staffer clears one tray and leaves the other.",
        characterVisibleText:
          "A staffer with a dish bin lifts one tray off the table and walks past. The other tray is still in front of them. The escalators hum two stores away.",
        directorInstruction:
          "Push for a small clear next step or a clean goodbye. The staffer does not speak.",
      },
      {
        id: "mall-food-court-weeknight-event-4",
        title: "Music shifts",
        kind: "reveal",
        event: "The food court's overhead playlist shifts to a slow track.",
        characterVisibleText:
          "The food court's playlist shifts to a slower track. A soft saxophone runs over the escalator hum. The Sbarro counter pulls a fresh slice from the case.",
        directorInstruction:
          "Use the small atmosphere change to surface a real reaction to ease. The speaker draws on what they already show, not new claims.",
      },
      {
        id: "mall-food-court-weeknight-event-5",
        title: "Tray return",
        kind: "ambient",
        event: "An employee pushes a tray return cart along the seating row.",
        characterVisibleText:
          "An employee pushes a tray return cart down the row of tables. He stops twice, lifts trays, and keeps moving. The fortune cookie wrapper is still untouched on their tray.",
        directorInstruction:
          "Allow the small ambient cleanup. The pair can use the ten seconds or let it pass. The employee does not speak.",
      },
      {
        id: "mall-food-court-weeknight-event-6",
        title: "Bag at twenty-three",
        kind: "ambient",
        event: "A shopper sets two large bags down at the next table.",
        characterVisibleText:
          "A shopper sets two department-store bags on the table next to theirs. A receipt is folded under one strap. He sits down and starts on a soft pretzel.",
        directorInstruction:
          "Use the small public neighbor to lower the heat between them. Do not voice the shopper.",
      },
      {
        id: "mall-food-court-weeknight-event-7",
        title: "Pretzel pull",
        kind: "reveal",
        event: "A pretzel comes out of the oven at a counter across the way.",
        characterVisibleText:
          "Across the food court, a fresh tray of soft pretzels comes out of the oven. The smell carries to the center table. No new line forms.",
        directorInstruction:
          "Let the small temptation surface a small honest preference drawn from what each member already shows. Refusing counts.",
      },
      {
        id: "mall-food-court-weeknight-event-8",
        title: "Closing chime",
        kind: "provocation",
        event: "A closing chime sounds. Mall closes in 30 minutes.",
        characterVisibleText:
          "A two-tone chime announces the mall closes in 30 minutes. Two of the gated stores roll halfway down. The escalators slow to a walking pace.",
        directorInstruction:
          "Push for a clean next step. The food court is the only thing still open. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "mall-food-court-weeknight-event-9",
        title: "Concourse gate",
        kind: "provocation",
        event: "A metal gate begins rolling down at the food court entrance.",
        characterVisibleText:
          "The metal gate at the main concourse entrance starts a slow roll downward and stops at chest height. A staffer at the gate stands aside without looking. The food court remains lit.",
        directorInstruction:
          "Push for a clean exit decision before the gate seats. Stay through the slow close, walk out under the gate, or call it now. Do not voice any background person or cue as a continuing speaker.",
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
