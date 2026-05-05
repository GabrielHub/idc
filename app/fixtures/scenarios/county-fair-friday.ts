import type { DateScenario } from "../../domain/game";

export const countyFairFriday: DateScenario = {
  id: "county-fair-friday",
  title: "County Fair, Friday Wristband",
  card: {
    summary:
      "A regional county fair on Friday night. One wristband each. Lights on the ferris wheel, lights on the food trucks, a 4-H pen behind the main stage.",
    tags: ["public", "food", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    idealFor: [
      "members who like a route, a snack, and a goal",
      "pairs that need an activity and a way to step out of it",
      "members who find a kind of courage in a noisy room",
    ],
    badFor: [
      "members who treat overhead lighting as exposure",
      "members who refuse to be seen on a midway",
    ],
  },
  publicBrief: {
    location: "The east entrance of the Logan County Fair, Friday at 8 p.m.",
    premise:
      "Cupid bought two wristbands. The fair runs until eleven. The 4-H pen, the ferris wheel, and the funnel cake stand are all in walking distance.",
    whatBothCharactersKnow:
      "The wristbands cover all rides. Food is paper-ticket only. The 4-H pen has goats, one llama, and a sign with names written in marker.",
    openingSituation:
      "Both members get their wristbands snapped on at the gate. The wristbands are bright orange and not subtle.",
  },
  director: {
    tone: "fryer oil, a generator hum, distant carousel music, a child losing a balloon two rows over",
    rules: [
      "Treat the fair as a real fair. Do not let the games rig themselves.",
      "Use the crowd as ambient pressure. Do not invent a heckler.",
      "Allow either member to step off the midway for a quieter row of booths.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Funnel cake or corn",
        event: "They reach the food row. Two stands have lines.",
        characterVisibleText:
          "The funnel cake stand is on the left. A sweet corn stand is on the right. Both lines are five deep.",
        directorInstruction:
          "Use the food choice to surface generosity, decisiveness, or deferral.",
      },
      {
        atTurn: 16,
        title: "4-H pen",
        event: "They drift past the 4-H pen. A small placard names every animal.",
        characterVisibleText:
          "The placard at the goat pen lists eight names in marker. One goat has won a ribbon. The llama is named Greg.",
        directorInstruction:
          "Let the placard slow the pair. A member who reads names is not the same as a member who walks past.",
      },
      {
        atTurn: 26,
        title: "Ferris wheel line",
        event: "They reach the ferris wheel. The line is two cars deep.",
        characterVisibleText:
          "The ferris wheel operator waves the next pair forward. Each car is a two seater with a metal bar.",
        directorInstruction:
          "Push the pair to ride, sit out, or leave together. Each choice is information.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the 4-H volunteers as comic relief.",
      "A member uses the noise to deliver a confession the booth cannot answer back to.",
    ],
    repeatBehavior:
      "If repeated, the same llama is in the pen. The volunteer at the gate may recognize the wristbands and joke without naming names.",
  },
  judgeRubric: {
    successSignals: [
      "A member protects the other through the loud row without making it a rescue.",
      "The pair finds a quiet aisle inside the noise without leaving the fair.",
    ],
    failureSignals: [
      "A member performs delight for the crowd instead of the date.",
      "The pair argues over the ride choice instead of choosing.",
    ],
    statFocus: ["spark", "stability", "chemistry"],
  },
};
