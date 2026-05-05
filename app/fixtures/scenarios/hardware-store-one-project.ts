import type { DateScenario } from "../../domain/game";

export const hardwareStoreOneProject: DateScenario = {
  id: "hardware-store-one-project",
  title: "Hardware Store, One Project",
  card: {
    summary:
      "Saturday afternoon at a regional hardware chain. One bracket needs replacing. Returns desk closes at six.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who relax around a finishable task",
      "pairs ready to take a small thing seriously",
      "members who can name the right aisle",
    ],
    badFor: [
      "members who need ceremony to feel chosen",
      "members who treat a parts list as a status quiz",
    ],
  },
  publicBrief: {
    location: "Aisle 18 at Whitlock Hardware, fasteners, four miles off the highway",
    premise:
      "Cupid set a forty minute errand. One bracket has snapped on a piece of furniture and the project ends today or it does not end.",
    whatBothCharactersKnow:
      "The broken bracket is in a small plastic bag. The store has the right size. The project is small and finishable in one trip.",
    openingSituation:
      "Both members meet at the cart corral. The broken bracket sits on top of a folded receipt.",
  },
  director: {
    tone: "fluorescent overhead, sawdust on the floor, a paint mixer running two aisles over",
    rules: [
      "Treat the bracket as a real object with a real fix. Do not turn it into a metaphor for the relationship.",
      "Allow the staff in orange aprons to be helpful. They are not the comic relief.",
      "Honor a member who knows the aisle and a member who does not.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Wrong aisle",
        event: "They begin in the wrong aisle and have to walk back.",
        characterVisibleText:
          "Aisle 12 is plumbing. The bracket is in fasteners. A staff member in an orange apron points without speaking.",
        directorInstruction:
          "Use the small mistake to surface patience, deferral, or a quiet correction.",
      },
      {
        atTurn: 16,
        title: "Two acceptable parts",
        event: "Two brackets in the bin would both work. One is half the price.",
        characterVisibleText:
          "Two small bagged brackets sit on the peg. One is six dollars. One is twelve.",
        directorInstruction: "Let the choice expose how either member treats good enough.",
      },
      {
        atTurn: 26,
        title: "Self checkout",
        event: "They reach checkout. Returns close in ten minutes if the bracket is wrong.",
        characterVisibleText:
          "The self checkout has a green light. The staffed lane has one customer with a ladder.",
        directorInstruction:
          "Push the pair to commit to the project together or leave it as one person's task.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the aisle to demonstrate competence at the other's expense.",
      "A member abandons the cart over a small disagreement about the cheaper part.",
    ],
    repeatBehavior:
      "If repeated, the staff in the orange apron remembers the bracket. The project is rarely the same one.",
  },
  judgeRubric: {
    successSignals: [
      "A member admits not knowing the aisle without performing it.",
      "The pair finishes the errand and leaves with the right size.",
    ],
    failureSignals: [
      "A member treats the cheaper bracket as a tell about character.",
      "The pair leaves with no bracket and no plan.",
    ],
    statFocus: ["trust", "stability", "chemistry"],
  },
};
