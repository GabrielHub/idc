import type { DateScenario } from "../../domain/game";

export const messHallAuriga: DateScenario = {
  id: "mess-hall-auriga",
  title: "Mess Hall, Generation Ship Auriga",
  card: {
    summary:
      "Booth 14 in the Tuesday cafeteria of a colony ship two centuries from any star. The social rotation seated them.",
    tags: ["food", "career", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 19,
    idealFor: [
      "members who can be interesting without spectacle",
      "members who treat a cafeteria as a real venue",
      "members whose small talk does not need a backdrop",
    ],
    badFor: [
      "members who require a setting to perform",
      "members who treat routine as evidence the partner is boring",
      "members who cannot be still for thirty minutes without a feature",
    ],
  },
  publicBrief: {
    location: "Booth 14 in C-deck mess on the colony ship Auriga, third generation underway",
    premise:
      "Cupid surfaced inside Auriga's social rotation algorithm two generations ago. Tonight's dinner pairing is theirs. The mess is open until 21:00 ship time.",
    whatBothCharactersKnow:
      "The ship has been in the dark between two stars for a hundred and ninety years. Auriga is mid-crossing. The window beside booth 14 shows real stars at low resolution. Tuesday is meatloaf night. The mess is fine.",
    openingSituation:
      "Both members sit at booth 14 with full trays. The lights are at the standard mealtime warm setting. The window beside them is on. Two younger crew at the next booth are not looking over.",
  },
  director: {
    tone: "fluorescent but warm, low conversation around the room, the soft hum of life support",
    flow: "conversation",
    rules: [
      "Anchor the date to booth 14. The pair does not tour the ship.",
      "Use the cafeteria as ordinary infrastructure. The future is not a special effect here.",
      "Do not invent ship-wide emergencies. The crossing is uneventful by design.",
      "Let the smallness of the venue test whether either of them needs more than the other to be interesting.",
    ],
    events: [
      {
        id: "mess-hall-auriga-event-1",
        title: "Tray settle",
        kind: "ambient",
        pitch:
          "Click both trays to the booth's mag plate with warm meatloaf and right-temperature water. Surfaces who leads the first line.",
        beat: "Both trays click softly to the booth surface as the magnets engage. The meatloaf is warm. The green beans are slightly overcooked. The cup of water at each tray is the right temperature.",
        directorBeat:
          "The meal just locked in. Pick up the fork, say one honest thing, ask your date how their day on the deck went, or comment on the beans. Start.",
      },
      {
        id: "mess-hall-auriga-event-2",
        title: "Window flicker",
        kind: "ambient",
        pitch:
          "Reload the starfield in a flicker with a nominal caption. Surfaces routine, not omen.",
        beat: "The window beside the booth flickers once and reloads. The same starfield comes back. A small caption at the bottom corner reads: external feed nominal. The next booth does not look up.",
        directorBeat:
          "Routine maintenance just happened in your peripheral. Notice it without dramatizing it, ask your date if they ever look out the window, or stay on the food. Do not turn it into an omen. Do not voice the caption.",
      },
      {
        id: "mess-hall-auriga-event-3",
        title: "Pairing card",
        kind: "reveal",
        pitch:
          "Glow a pairing card between the trays with two thumbprint pads: rotation match, no further obligation. Surfaces a stance on being assigned.",
        beat: "A small text card glows on the booth surface between their trays. It reads: rotation match, Tuesday week 12, no further obligation. Two thumbprint pads sit below the text.",
        directorBeat:
          "The ship just acknowledged you as paired tonight. Read the line aloud, comment on no further obligation, ask your date what they make of it, or press your thumb to the pad. Take a stance. Do not voice the card.",
      },
      {
        id: "mess-hall-auriga-event-4",
        title: "Ration cookie",
        kind: "reveal",
        pitch:
          "Surface two equal-size oat cookies on a courtesy plate. Forces a small generosity decision.",
        beat: "A small plate slides up the table from the booth's center slot. Two oat cookies sit on it. A small card reads: rotation pair courtesy. Both cookies are the same size.",
        directorBeat:
          "Two cookies are between you. Slide one to your date, eat yours first, comment on the equal size, or leave them. Show the small care. Do not voice the card.",
      },
      {
        id: "mess-hall-auriga-event-5",
        title: "Generational shift",
        kind: "reveal",
        pitch:
          "Scroll a low-volume archive update announcement along the wall. Surfaces whether either treats their life as part of a long record.",
        beat: "The deck speakers pass a routine generational shift announcement at low volume. The text scrolls along the wall: archive update, week 12, ancestor logs available. Nobody at any booth turns to read it.",
        directorBeat:
          "The ship just filed a week and offered to show you the logs. Comment on the archive, ask your date what they would put in it, mention what you know about your own line, or let it scroll past. Speak only from what you already carry. Do not voice the speakers.",
      },
      {
        id: "mess-hall-auriga-event-6",
        title: "Window dim",
        kind: "ambient",
        pitch:
          "Dim the starfield a notch and slide it left as the ship rotates a degree. Surfaces whether the pair lets slow movement work without commentary.",
        beat: "The window dims a single notch as the ship rotates a degree on its spin axis. The starfield slides slowly to the left. The lights at booth 14 hold steady.",
        directorBeat:
          "The view just adjusted on you. Stay focused on your date, comment briefly on the spin, lean toward the window, or eat through it. Do not narrate the rotation.",
      },
      {
        id: "mess-hall-auriga-event-7",
        title: "Tray return",
        kind: "provocation",
        pitch:
          "Stand the next booth's two younger crew, walk their trays out, and have them nod once at booth 14. Forces a next move.",
        beat: "The two younger crew at the next booth stand and walk their trays to the return slot. They nod at booth 14 once on the way past. The mess is now thinner. A staff member begins wiping a far table.",
        directorBeat:
          "Other people just left around you. Nod back, comment on the thinning room, ask your date if they want to stay, or pace your meal. Pick a move. Do not voice the crew.",
      },
      {
        id: "mess-hall-auriga-event-8",
        title: "Closing chime",
        kind: "provocation",
        pitch:
          "Pass a soft closing chime and scroll the wall with fifteen minutes left. Forces a clean call on staying or walking.",
        beat: "A soft chime passes through the deck speakers. The wall scroll updates: mess closing in fifteen minutes. The window holds. The cookies, if untaken, are still on the small plate.",
        directorBeat:
          "The mess is calling time. Stay through to night-cycle, ask your date what they want to do after, take the cookies, or stand. Speak the call. Do not voice the chime.",
      },
      {
        id: "mess-hall-auriga-event-9",
        title: "Lights to night",
        kind: "provocation",
        pitch:
          "Cycle the deck to night-blue with the mag plate releasing and other booths clearing themselves. Forces a clean physical move.",
        beat: "The deck lights cycle from mealtime warm to night-cycle blue. Two booths over, the trays clear themselves into the return chute. The mag plate under their trays clicks once to release.",
        directorBeat:
          "The room turned blue and the magnets let your trays go. Rack out and walk back to quarters, take the cookies, propose where to go now, or hold the booth a beat longer. Move.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the ship as proof the partner is small.",
      "A member uses ancestor logs to argue their life means more than the partner's.",
    ],
    repeatBehavior:
      "If repeated, the rotation algorithm remembers them and reseats them at booth 14 on Tuesdays. The cookies arrive without prompting.",
  },
  judgeRubric: {
    successSignals: [
      "The pair holds a conversation across the meal without needing the venue to do work.",
      "A member shows ordinary care, refilling the water, sliding the plate.",
    ],
    failureSignals: [
      "The pair lets the quiet become an argument.",
      "A member treats the assignment as humiliation.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
