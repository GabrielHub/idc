import type { DateScenario } from "../../domain/game";

export const groceryRunOneDinner: DateScenario = {
  id: "grocery-run-one-dinner",
  title: "Grocery Run For One Dinner",
  card: {
    summary:
      "Shared cart, one recipe, one aisle. The negotiation is pasta shape and whether wine is necessary.",
    tags: ["domestic", "food", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who treat a printed recipe as a love language",
      "members with a vehicle and a bench seat made for the trip home",
      "members whose overnight aisle knowledge keeps them calm in fluorescents",
      "members who can pick a pasta shape without a referendum",
    ],
    badFor: [
      "members who cannot perform at a coupon sticker",
      "members who refuse to be seen pushing a cart",
      "members whose calendars have no aisle 7 budget",
    ],
  },
  publicBrief: {
    location: "Aisle 7, the dry goods aisle of a normal grocery store on a normal Saturday",
    premise:
      "Cupid set a 20 minute task: one dinner, one cart, one printed recipe folded against the cart handle.",
    whatBothCharactersKnow:
      "The recipe is decided. The substitutions are not. The aisle has the pasta, the canned tomatoes, and the optional ingredient on the same row.",
    openingSituation:
      "Both members stand at the cart in aisle 7. The recipe is unfolded against the handle. Six pasta boxes are at eye level on the shelf in front of them.",
  },
  director: {
    tone: "ordinary errand, bright overhead lighting, cart wheels rattling",
    rules: [
      "Anchor the date to aisle 7. The pair does not march through the store.",
      "Use shelf decisions as low-stakes proxies for shared life.",
      "Do not make the recipe magical. The recipe is a recipe.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "Pasta shelf",
        event: "Six boxes on the shelf all qualify under the recipe.",
        characterVisibleText:
          "Six boxes are at eye level. All of them are short shapes. One has a coupon sticker. The recipe just says short.",
        directorInstruction: "Use the choice to expose how the pair compromises or stalls.",
      },
      {
        atTurn: 20,
        title: "Optional ingredient",
        event: "An optional item is on the same row at eye level.",
        characterVisibleText:
          "The optional ingredient sits two feet from the pasta. The shelf tag is pink for sale. The recipe line for it has a parenthetical.",
        directorInstruction: "Negotiate inclusion without turning it into a referendum.",
      },
      {
        atTurn: 28,
        title: "Intercom",
        event: "An intercom announcement passes overhead.",
        characterVisibleText:
          "An intercom voice announces a price check on a different aisle. Cart wheels rattle past the end of the row. Their cart still has only the recipe inside.",
        directorInstruction:
          "Use the cue to push for a small shared decision before they leave the aisle.",
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
      "The pair settles the aisle inside the time and laughs about something on the shelf.",
      "A member defers gracefully on a small choice without resentment.",
    ],
    failureSignals: [
      "A member turns a small choice into a values argument.",
      "The pair leaves the aisle with no plan for what the food becomes.",
    ],
    statFocus: ["trust", "chemistry", "stability"],
  },
};
