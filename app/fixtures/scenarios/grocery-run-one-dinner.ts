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
    cost: 5,
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
    events: [
      {
        id: "grocery-run-one-dinner-event-1",
        title: "Pasta shelf",
        kind: "reveal",
        event: "Six boxes on the shelf all qualify under the recipe.",
        characterVisibleText:
          "Six boxes are at eye level. All of them are short shapes. One has a coupon sticker. The recipe just says short.",
        directorInstruction:
          "Use the choice to expose how the pair compromises or stalls. Each draws on what they already show on file. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "grocery-run-one-dinner-event-2",
        title: "Optional ingredient",
        kind: "reveal",
        event: "An optional item is on the same row at eye level.",
        characterVisibleText:
          "The optional ingredient sits two feet from the pasta. The shelf tag is pink for sale. The recipe line for it has a parenthetical.",
        directorInstruction: "Negotiate inclusion without turning it into a referendum.",
      },
      {
        id: "grocery-run-one-dinner-event-3",
        title: "Intercom",
        kind: "provocation",
        event: "An intercom announcement passes overhead.",
        characterVisibleText:
          "An intercom voice announces a price check on a different aisle. Cart wheels rattle past the end of the row. Their cart still has only the recipe inside.",
        directorInstruction:
          "Use the cue to push for a small shared decision before they leave the aisle. Do not voice the intercom as a continuing speaker.",
      },
      {
        id: "grocery-run-one-dinner-event-4",
        title: "Cart squeak",
        kind: "ambient",
        event: "Their cart squeaks as it shifts a few inches.",
        characterVisibleText:
          "Their cart squeaks once as a hand bumps it. The recipe page slides a quarter inch and resettles against the handle. The basket below the cart is still empty.",
        directorInstruction:
          "Let the small fidget read as nerves or as patience without naming it.",
      },
      {
        id: "grocery-run-one-dinner-event-5",
        title: "Sample tray",
        kind: "reveal",
        event: "An employee passes with a tray of small sample cups.",
        characterVisibleText:
          "An employee in a green polo passes the end of the aisle with a tray of small paper cups. Two stayed unfilled. The smell is herbed cheese.",
        directorInstruction:
          "Use the small offer to surface generosity, deferral, or a tiny shared appetite drawn from each member's existing register. The employee does not speak.",
      },
      {
        id: "grocery-run-one-dinner-event-6",
        title: "Promo tag flap",
        kind: "ambient",
        event: "A pink promo tag flutters under the AC vent.",
        characterVisibleText:
          "The pink promo tag on the optional ingredient flutters under the AC vent. The shelf is bare on one side. A handwritten correction shows the price changed since lunch.",
        directorInstruction:
          "Let the small detail catch one of them. The other can choose to look.",
      },
      {
        id: "grocery-run-one-dinner-event-7",
        title: "Cart pass",
        kind: "ambient",
        event: "Another shopper passes their cart in the aisle.",
        characterVisibleText:
          "Another shopper drives a full cart past theirs and slows to read the same shelf. He nods, picks the second cheapest box, and moves on. His cart already has two prepared rotisserie chickens.",
        directorInstruction:
          "Allow a small benchmark moment. Either member may use it or leave it. Do not voice the shopper.",
      },
      {
        id: "grocery-run-one-dinner-event-8",
        title: "End cap reset",
        kind: "provocation",
        event: "An employee resets an end cap of canned tomatoes.",
        characterVisibleText:
          "An employee on her knees stacks cans of tomatoes onto a low end cap two strides away. She does not look up. A sleeve of paper price tags is tucked under one arm.",
        directorInstruction:
          "Push for one final pasta and one shared decision. The aisle will close on time. The employee does not speak.",
      },
      {
        id: "grocery-run-one-dinner-event-9",
        title: "Cart roll",
        kind: "provocation",
        event: "The cart rolls a few feet down the aisle on its own.",
        characterVisibleText:
          "The aisle floor has a slight slope toward the dairy end. The cart starts to roll on its own and is two strides down the aisle before either has it. The recipe page lifts and falls back against the handle.",
        directorInstruction:
          "Push for a physical save and a clear restart of the choice. The cart will not stop without a hand on the bar.",
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
