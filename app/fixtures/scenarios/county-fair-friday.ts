import type { DateScenario } from "../../domain/game";

export const countyFairFriday: DateScenario = {
  id: "county-fair-friday",
  title: "County Fair, Picnic Bench",
  card: {
    summary:
      "A regional county fair on Friday night. One picnic bench between the funnel cake stand and the 4-H pen.",
    tags: ["public", "food", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    idealFor: [
      "members whose warm steady voice handles funnel cake without an edge",
      "members whose tired patience fits a picnic bench and a placard",
      "members who can listen across carousel music without pulling away",
    ],
    badFor: [
      "members who treat overhead lighting and unstructured mingling as injuries",
      "members who refuse to be seen on a lit midway with witnesses",
      "members who cannot run a sightline through a fair crowd",
    ],
  },
  publicBrief: {
    location:
      "A picnic bench at the Logan County Fair, between the funnel cake stand and the 4-H pen",
    premise:
      "Cupid bought two wristbands and dropped the pair at a picnic bench just off the midway. The fair runs until eleven.",
    whatBothCharactersKnow:
      "The wristbands cover all rides. The bench has clear sightlines to the 4-H pen on one side and the funnel cake line on the other. The ferris wheel is two rows behind them.",
    openingSituation:
      "Both members sit at a picnic bench with two paper trays of fair food between them. Their wristbands are bright orange and not subtle.",
  },
  director: {
    tone: "fryer oil, a generator hum, distant carousel music, a child losing a balloon two rows over",
    rules: [
      "Treat the fair as a real fair. Do not let the games rig themselves.",
      "Use the crowd as ambient pressure. Do not invent a heckler.",
      "Anchor the date to the picnic bench. The pair watches the fair, they do not march through it.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "Funnel cake delivery",
        event: "A paper plate of funnel cake lands at their corner of the bench.",
        characterVisibleText:
          "A paper plate of funnel cake slides onto their corner of the bench. Powdered sugar drifts onto the wood. One plastic fork is wedged in the side.",
        directorInstruction: "Use the food to surface generosity, decisiveness, or deferral.",
      },
      {
        atTurn: 20,
        title: "4-H placard",
        event: "A volunteer flips a fresh placard on the goat pen rail in their sightline.",
        characterVisibleText:
          "The placard at the goat pen now lists eight names in marker. One goat has a ribbon. The llama is named Greg. Greg is staring at their bench.",
        directorInstruction:
          "Let the placard slow the pair. A member who reads names is not the same as a member who looks past.",
      },
      {
        atTurn: 28,
        title: "Ferris wheel lights",
        event: "The ferris wheel behind them swings into a synced light cycle.",
        characterVisibleText:
          "The ferris wheel lights cycle blue, white, blue across their bench. The carousel music shifts a half step. The line at the funnel cake stand thins out.",
        directorInstruction: "Push the pair toward a clear next step before the lights cycle off.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the 4-H volunteers as comic relief.",
      "A member uses the noise to deliver a confession the bench cannot answer back to.",
    ],
    repeatBehavior:
      "If repeated, the same llama is in the pen. The bench is held without effort. The volunteer at the gate may recognize the wristbands.",
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
