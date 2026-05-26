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
        pitch:
          "Line up six qualifying boxes at eye level with one on a coupon sticker. Surfaces how the pair compromises or stalls.",
        beat: "Six boxes are at eye level. All of them are short shapes. One has a coupon sticker. The recipe just says short.",
        directorBeat:
          "Pick one. Grab the coupon box, ask your date which shape they like, defer to them, or pull two and propose one each. Make the call. Do not voice the shelf.",
      },
      {
        id: "grocery-run-one-dinner-event-2",
        title: "Optional ingredient",
        kind: "reveal",
        pitch:
          "Drop the optional item two feet from the pasta on a sale tag. Forces a small negotiation without a referendum.",
        beat: "The optional ingredient sits two feet from the pasta. The shelf tag is pink for sale. The recipe line for it has a parenthetical.",
        directorBeat:
          "The parenthetical is asking a question. Toss it in the cart, ask your date if they want it, skip it cleanly, or check the price. Pick and move.",
      },
      {
        id: "grocery-run-one-dinner-event-3",
        title: "Intercom",
        kind: "provocation",
        pitch:
          "Roll an intercom price check past the aisle with their cart still empty. Forces a shared call before they leave the row.",
        beat: "An intercom voice announces a price check on a different aisle. Cart wheels rattle past the end of the row. Their cart still has only the recipe inside.",
        directorBeat:
          "Time to move. Throw the pasta and the tomatoes in, ask your date the missing call, propose splitting the recipe between aisles, or commit to one box. Decide. Do not voice the intercom.",
      },
      {
        id: "grocery-run-one-dinner-event-4",
        title: "Cart squeak",
        kind: "ambient",
        pitch:
          "Squeak the cart and slide the recipe page a quarter inch. Surfaces nerves or patience without naming it.",
        beat: "Their cart squeaks once as a hand bumps it. The recipe page slides a quarter inch and resettles against the handle. The basket below the cart is still empty.",
        directorBeat:
          "Something small fidgeted in your hands. Steady the page, comment on the squeak, ask your date how they want to split this, or just pick a box. Show your tension or your ease.",
      },
      {
        id: "grocery-run-one-dinner-event-5",
        title: "Sample tray",
        kind: "reveal",
        pitch:
          "Walk an herbed cheese sample tray past with two cups unfilled. Forces a small generosity, deferral, or shared appetite.",
        beat: "An employee in a green polo passes the end of the aisle with a tray of small paper cups. Two stayed unfilled. The smell is herbed cheese.",
        directorBeat:
          "A small free thing is two steps away. Walk over and grab two, ask your date if they want a try, comment on the smell, or stay at the cart. Speak only from your own register. Do not voice the employee.",
      },
      {
        id: "grocery-run-one-dinner-event-6",
        title: "Promo tag flap",
        kind: "ambient",
        pitch:
          "Flutter the pink promo tag with a handwritten price correction. Surfaces whether either notices the small detail.",
        beat: "The pink promo tag on the optional ingredient flutters under the AC vent. The shelf is bare on one side. A handwritten correction shows the price changed since lunch.",
        directorBeat:
          "Someone updated the price by hand. Point it out, comment on the bare shelf, ask your date if they want the optional anyway, or move on. Notice the small mark.",
      },
      {
        id: "grocery-run-one-dinner-event-7",
        title: "Cart pass",
        kind: "ambient",
        pitch:
          "Pass another shopper's full cart past with two rotisserie chickens. Surfaces a small benchmark moment.",
        beat: "Another shopper drives a full cart past theirs and slows to read the same shelf. He nods, picks the second cheapest box, and moves on. His cart already has two prepared rotisserie chickens.",
        directorBeat:
          "Someone else just made the decision faster than you. Match the move, comment on the rotisseries, defend why you are slower, or ignore him. Be honest about your pace. Do not voice the shopper.",
      },
      {
        id: "grocery-run-one-dinner-event-8",
        title: "End cap reset",
        kind: "provocation",
        pitch:
          "Stack a tomatoes end cap two strides away as the aisle nears close. Forces one final pasta and one shared decision.",
        beat: "An employee on her knees stacks cans of tomatoes onto a low end cap two strides away. She does not look up. A sleeve of paper price tags is tucked under one arm.",
        directorBeat:
          "The aisle is being reset around you. Grab the box, propose the cart leaves now, ask your date for the last call, or step out of the employee's way. Commit. Do not voice the employee.",
      },
      {
        id: "grocery-run-one-dinner-event-9",
        title: "Cart roll",
        kind: "provocation",
        pitch:
          "Slope the floor enough to roll the cart two strides on its own. Forces a physical save and a clean restart.",
        beat: "The aisle floor has a slight slope toward the dairy end. The cart starts to roll on its own and is two strides down the aisle before either has it. The recipe page lifts and falls back against the handle.",
        directorBeat:
          "Your cart is escaping. Catch it, laugh with your date, hand them the recipe, or just walk it down the slope. Take the body action now.",
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
