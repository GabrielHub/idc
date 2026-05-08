import type { DateScenario } from "../../domain/game";

export const hardwareStoreOneProject: DateScenario = {
  id: "hardware-store-one-project",
  title: "Hardware Store, Fasteners Aisle",
  card: {
    summary:
      "Saturday afternoon at a regional hardware chain. One bracket needs replacing. The aisle is the date.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members whose trade work has them name the aisle on instinct",
      "members who relax around a finishable task",
      "members whose overnight shift makes fluorescents feel like home",
    ],
    badFor: [
      "members with no mirror, no audience, and no compliments in a bin of brackets",
      "members who will treat the broken bracket as a Pact requiring repair vows",
      "members whose calendar does not value good enough",
    ],
  },
  publicBrief: {
    location: "Aisle 18 at Whitlock Hardware, fasteners, four miles off the highway",
    premise:
      "Cupid set a forty minute errand. One bracket has snapped on a piece of furniture and the project ends today or it does not end. The pair has already found the right aisle.",
    whatBothCharactersKnow:
      "The broken bracket is in a small plastic bag in the cart. The store has the right size. Two acceptable replacements are on the same peg.",
    openingSituation:
      "Both members stand at the cart in aisle 18. The broken bracket sits on top of a folded receipt in the cart. Two bagged brackets hang on the peg in front of them.",
  },
  director: {
    tone: "fluorescent overhead, sawdust on the floor, a paint mixer running two aisles over",
    rules: [
      "Anchor the date to aisle 18. The pair does not march through the store.",
      "Treat the bracket as a real object with a real fix. Do not turn it into a metaphor for the relationship.",
      "Allow staff in orange aprons to be helpful at a distance, never as comic relief.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "Two acceptable parts",
        event: "Two brackets on the same peg both fit. One is half the price.",
        characterVisibleText:
          "Two small bagged brackets hang on the peg. One is six dollars. One is twelve. The labels are otherwise identical.",
        directorInstruction: "Let the choice expose how either member treats good enough.",
      },
      {
        atTurn: 20,
        title: "Aisle traffic",
        event: "A staffer in an orange apron passes the end of the aisle without stopping.",
        characterVisibleText:
          "An orange apron passes the end of the aisle pushing a small ladder. The intercom calls a price check from a different aisle. Their cart still has only the broken bracket.",
        directorInstruction:
          "Use the small interruption to surface patience, deferral, or a quiet correction.",
      },
      {
        atTurn: 28,
        title: "Closing notice",
        event: "An overhead voice notes the returns desk closes in ten minutes.",
        characterVisibleText:
          "The intercom notes that the returns desk closes in ten minutes. The cart has not moved from the peg. The broken bracket is still on top of the receipt.",
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
      "A member admits not knowing the part without performing it.",
      "The pair settles the bracket choice and stays at the cart.",
    ],
    failureSignals: [
      "A member treats the cheaper bracket as a tell about character.",
      "The pair leaves the aisle with no bracket and no plan.",
    ],
    statFocus: ["trust", "stability", "chemistry"],
  },
};
