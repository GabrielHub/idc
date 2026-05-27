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
    flow: "conversation",
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
        pitch:
          "Set both trays side by side with the food choices now legible and a stray fortune cookie. Surfaces a small honest exchange based on what each ordered.",
        beat: "The trays sit side by side. The food choices are now an introduction. One tray has a free fortune cookie that did not belong with the order.",
        directorBeat:
          "Your tray is an introduction without you choosing it to be. Comment on what you got, ask your date why they picked theirs, push the fortune cookie across, or eat without speaking. Speak only from what is actually on the trays.",
      },
      {
        id: "mall-food-court-weeknight-event-2",
        title: "Concourse passersby",
        kind: "ambient",
        pitch:
          "Run a toddler with a giant pretzel and a parent jogging behind past the table. Surfaces whether the pair lets the interruption land or ignores it.",
        beat: "A toddler runs past holding a giant pretzel. Their parent jogs three paces behind. A kiosk pitch starts up two stores away.",
        directorBeat:
          "The concourse just walked through your table. Smile at the kid, comment on the pretzel, ignore them entirely, or use the noise to drop a quieter line to your date. Do not voice the toddler or the parent.",
      },
      {
        id: "mall-food-court-weeknight-event-3",
        title: "Trays cleared",
        kind: "provocation",
        pitch:
          "Lift one tray off in a single pass and leave the other. Forces a clear next step or a clean goodbye.",
        beat: "A staffer with a dish bin lifts one tray off the table and walks past. The other tray is still in front of them. The escalators hum two stores away.",
        directorBeat:
          "Your table just got asymmetric. Push the remaining tray toward the middle, finish your bite, propose the next stop, or settle the bill. Move the moment. Do not voice the staffer.",
      },
      {
        id: "mall-food-court-weeknight-event-4",
        title: "Music shifts",
        kind: "reveal",
        pitch:
          "Shift the overhead playlist into a slow saxophone track over the escalator hum. Surfaces a real reaction to ease.",
        beat: "The food court's playlist shifts to a slower track. A soft saxophone runs over the escalator hum. The Sbarro counter pulls a fresh slice from the case.",
        directorBeat:
          "The food court just got softer. Notice it, comment to your date on the sax, lean an inch closer, or ignore it. Show whether you can take ease in fluorescents.",
      },
      {
        id: "mall-food-court-weeknight-event-5",
        title: "Tray return",
        kind: "ambient",
        pitch:
          "Roll a tray return cart down the row with the fortune cookie still untouched. Surfaces a small ambient cleanup the pair can use or ignore.",
        beat: "An employee pushes a tray return cart down the row of tables. He stops twice, lifts trays, and keeps moving. The fortune cookie wrapper is still untouched on their tray.",
        directorBeat:
          "Someone is clearing tables near you. Slide your tray to the edge, comment on the cart, propose cracking the fortune cookie now, or keep going. Do not voice the employee.",
      },
      {
        id: "mall-food-court-weeknight-event-6",
        title: "Bag at twenty-three",
        kind: "ambient",
        pitch:
          "Plant a shopper with department-store bags and a soft pretzel at the next table. Surfaces a small public neighbor to lower the heat.",
        beat: "A shopper sets two department-store bags on the table next to theirs. A receipt is folded under one strap. He sits down and starts on a soft pretzel.",
        directorBeat:
          "Someone with a normal evening just sat next to you. Notice it, comment on the bags, lower your voice, or use the proximity to soften your tone. Do not voice the shopper.",
      },
      {
        id: "mall-food-court-weeknight-event-7",
        title: "Pretzel pull",
        kind: "reveal",
        pitch:
          "Pull a fresh tray of pretzels across the way and carry the smell to the center table. Surfaces a small honest preference.",
        beat: "Across the food court, a fresh tray of soft pretzels comes out of the oven. The smell carries to the center table. No new line forms.",
        directorBeat:
          "A new smell just landed on your table. Suggest a pretzel, decline aloud, ask your date if they want one, or comment on the timing. Speak from what you actually want.",
      },
      {
        id: "mall-food-court-weeknight-event-8",
        title: "Closing chime",
        kind: "provocation",
        pitch:
          "Two-tone chime the mall closing in thirty minutes and roll two store gates halfway down. Forces a clean next step.",
        beat: "A two-tone chime announces the mall closes in 30 minutes. Two of the gated stores roll halfway down. The escalators slow to a walking pace.",
        directorBeat:
          "Thirty minutes left in the building. Propose the next stop, ask your date if they want to walk the concourse, settle the trays, or stay seated and decide what comes next. Speak now. Do not voice the chime.",
      },
      {
        id: "mall-food-court-weeknight-event-9",
        title: "Concourse gate",
        kind: "provocation",
        pitch:
          "Roll the concourse gate to chest height with a staffer standing aside. Forces a clean exit decision before it seats.",
        beat: "The metal gate at the main concourse entrance starts a slow roll downward and stops at chest height. A staffer at the gate stands aside without looking. The food court remains lit.",
        directorBeat:
          "The mall is half-closed around you. Walk out under the gate, propose staying till final close, ask your date which they want, or move now. Decide aloud. Do not voice the staffer.",
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
