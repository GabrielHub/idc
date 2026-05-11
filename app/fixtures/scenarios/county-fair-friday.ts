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
    events: [
      {
        id: "county-fair-friday-event-1",
        title: "Funnel cake delivery",
        kind: "reveal",
        event: "A paper plate of funnel cake lands at their corner of the bench.",
        characterVisibleText:
          "A paper plate of funnel cake slides onto their corner of the bench. Powdered sugar drifts onto the wood. One plastic fork is wedged in the side.",
        directorInstruction: "Use the food to surface generosity, decisiveness, or deferral.",
      },
      {
        id: "county-fair-friday-event-2",
        title: "4-H placard",
        kind: "reveal",
        event: "A volunteer flips a fresh placard on the goat pen rail in their sightline.",
        characterVisibleText:
          "The placard at the goat pen now lists eight names in marker. One goat has a ribbon. The llama is named Greg. Greg is staring at their bench.",
        directorInstruction:
          "Let the placard slow the pair. A member who reads names is not the same as a member who looks past. The volunteer does not speak.",
      },
      {
        id: "county-fair-friday-event-3",
        title: "Ferris wheel lights",
        kind: "provocation",
        event: "The ferris wheel behind them swings into a synced light cycle.",
        characterVisibleText:
          "The ferris wheel lights cycle blue, white, blue across their bench. The carousel music shifts a half step. The line at the funnel cake stand thins out.",
        directorInstruction: "Push the pair toward a clear next step before the lights cycle off.",
      },
      {
        id: "county-fair-friday-event-4",
        title: "Wristband cinch",
        kind: "ambient",
        event: "A wristband loosens on one wrist.",
        characterVisibleText:
          "One bright orange wristband has stretched away from a wrist. The adhesive tab is curling. The other wristband is tight enough to leave a mark.",
        directorInstruction: "Use the small fidget to surface care or self-containment.",
      },
      {
        id: "county-fair-friday-event-5",
        title: "Pet show call",
        kind: "ambient",
        event: "A PA announcement names the pet show in the 4-H pen.",
        characterVisibleText:
          "The PA crackles and announces the small animal show in the 4-H pen at nine. Greg the llama has not moved. The placard volunteer flips a second page on the rail.",
        directorInstruction:
          "Let one member volunteer attention to the pen. Let the other choose to follow or stay. Do not voice the PA as a continuing speaker.",
      },
      {
        id: "county-fair-friday-event-6",
        title: "Lemonade mix-up",
        kind: "reveal",
        event: "A volunteer brings two lemonade cups to the wrong bench.",
        characterVisibleText:
          "A volunteer in a 4-H polo sets two paper cups of pink lemonade on their bench. The receipt taped to one cup names a different last name. The volunteer has already turned back to the line.",
        directorInstruction:
          "Use the small windfall to test honesty over convenience without scoring it. The volunteer does not speak.",
      },
      {
        id: "county-fair-friday-event-7",
        title: "Tilt-a-whirl pause",
        kind: "ambient",
        event: "The tilt-a-whirl pauses for a safety check.",
        characterVisibleText:
          "The tilt-a-whirl rolls to a slow stop two rows over. A teenager in a yellow vest waves a flashlight at one of the cars. Riders stay in their seats.",
        directorInstruction:
          "Let the pair register the wait without commenting on it. The bench can hold the silence.",
      },
      {
        id: "county-fair-friday-event-8",
        title: "Last hour bell",
        kind: "provocation",
        event: "A handbell announces the midway's last hour.",
        characterVisibleText:
          "A volunteer at the gate rings a small handbell. The crowd thins by a row. The 4-H pen lights cut from white to amber.",
        directorInstruction:
          "Push for a clear next step before the wristbands time out at the gate. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "county-fair-friday-event-9",
        title: "Greg loose",
        kind: "provocation",
        event: "The llama nudges the pen latch open and steps onto the path.",
        characterVisibleText:
          "Greg the llama leans on the pen latch. The latch slips and Greg steps a slow two paces onto the midway path between their bench and the funnel cake line. The placard volunteer is on the far side of the pen.",
        directorInstruction:
          "Push for a clean physical move: clear a path for Greg, flag the volunteer, or hold the bench. The llama will not return to the pen on its own. Do not voice any background person or cue as a continuing speaker.",
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
