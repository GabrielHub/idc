import type { DateScenario } from "../../domain/game";

export const groceryRunOneDinner: DateScenario = {
  id: "grocery-run-one-dinner",
  title: "Grocery Run For One Dinner",
  card: {
    summary:
      "Shared cart, one recipe, twenty minutes. The negotiation is pasta shape and whether wine is necessary.",
    tags: ["domestic", "food", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who want low-key partnership",
      "pairs ready to cook later",
      "members who relax around a task",
    ],
    badFor: ["members who refuse domestic stakes", "members who hate small choices in public"],
  },
  publicBrief: {
    location: "A normal grocery store on a normal Saturday",
    premise:
      "Cupid set a 20 minute task: one dinner, one cart, one printed recipe folded in a pocket.",
    whatBothCharactersKnow:
      "The recipe is decided. The substitutions are not. There is no ceremony attached to the meal.",
    openingSituation: "Both members meet at the cart corral. The recipe is unfolded.",
  },
  director: {
    tone: "ordinary errand, bright overhead lighting, cart wheels rattling",
    rules: [
      "Keep the task small and finishable inside the scene.",
      "Use store decisions as low-stakes proxies for shared life.",
      "Do not make the recipe magical. The recipe is a recipe.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Pasta aisle",
        event: "The aisle has six shapes that all qualify under the recipe.",
        characterVisibleText:
          "Six boxes look approximately correct. The recipe says the word short.",
        directorInstruction: "Use the choice to expose how the pair compromises or stalls.",
      },
      {
        atTurn: 16,
        title: "Optional ingredient",
        event: "The recipe lists an optional item. One member wants it, one does not.",
        characterVisibleText:
          "The line on the recipe reads optional in parentheses. The store has it on sale.",
        directorInstruction: "Negotiate inclusion without turning it into a referendum.",
      },
      {
        atTurn: 26,
        title: "Checkout choice",
        event: "Self-checkout or staffed lane. There is no wrong answer.",
        characterVisibleText:
          "Two lanes are open. The self-checkout has a shorter line and one impatient sensor.",
        directorInstruction: "Use the lane choice to wrap the date with one small shared decision.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the recipe as a test of the other.",
      "A member abandons the cart over a small disagreement.",
    ],
    repeatBehavior:
      "If repeated, the recipe is the same. The pair may notice their own past choices in the cart.",
  },
  judgeRubric: {
    successSignals: [
      "The pair finishes the cart inside the time and laughs about something on the receipt.",
      "A member defers gracefully on a small choice without resentment.",
    ],
    failureSignals: [
      "A member turns a small choice into a values argument.",
      "The pair leaves with no plan for what the food becomes.",
    ],
    statFocus: ["trust", "chemistry", "stability"],
  },
};
