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
        event: "Both trays settle on the booth's mag plate.",
        characterVisibleText:
          "Both trays click softly to the booth surface as the magnets engage. The meatloaf is warm. The green beans are slightly overcooked. The cup of water at each tray is the right temperature.",
        directorInstruction:
          "Open the meal without ceremony. Let either of them lead the first line.",
      },
      {
        id: "mess-hall-auriga-event-2",
        title: "Window flicker",
        kind: "ambient",
        event: "The window's star feed reloads.",
        characterVisibleText:
          "The window beside the booth flickers once and reloads. The same starfield comes back. A small caption at the bottom corner reads: external feed nominal. The next booth does not look up.",
        directorInstruction:
          "Treat the moment as routine. Do not mistake it for an omen. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "mess-hall-auriga-event-3",
        title: "Pairing card",
        kind: "reveal",
        event: "A pairing card surfaces on the booth surface.",
        characterVisibleText:
          "A small text card glows on the booth surface between their trays. It reads: rotation match, Tuesday week 12, no further obligation. Two thumbprint pads sit below the text.",
        directorInstruction:
          "Let the small bureaucratic acknowledgment test how each of them holds being assigned. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "mess-hall-auriga-event-4",
        title: "Ration cookie",
        kind: "reveal",
        event: "Two ration cookies arrive on a small plate.",
        characterVisibleText:
          "A small plate slides up the table from the booth's center slot. Two oat cookies sit on it. A small card reads: rotation pair courtesy. Both cookies are the same size.",
        directorInstruction:
          "Use the small offering to test small generosity. Either may take, leave, or split. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "mess-hall-auriga-event-5",
        title: "Generational shift",
        kind: "reveal",
        event: "An announcement passes through the deck speakers.",
        characterVisibleText:
          "The deck speakers pass a routine generational shift announcement at low volume. The text scrolls along the wall: archive update, week 12, ancestor logs available. Nobody at any booth turns to read it.",
        directorInstruction:
          "Use the routine cue to surface whether either of them treats their own life as part of a long record. Do not voice the deck speakers as continuing dialogue.",
      },
      {
        id: "mess-hall-auriga-event-6",
        title: "Window dim",
        kind: "ambient",
        event: "The starfield dims a notch as the ship rotates.",
        characterVisibleText:
          "The window dims a single notch as the ship rotates a degree on its spin axis. The starfield slides slowly to the left. The lights at booth 14 hold steady.",
        directorInstruction:
          "Allow the slow movement. The pair does not need to comment on it for it to do its work.",
      },
      {
        id: "mess-hall-auriga-event-7",
        title: "Tray return",
        kind: "provocation",
        event: "The next booth over clears their trays.",
        characterVisibleText:
          "The two younger crew at the next booth stand and walk their trays to the return slot. They nod at booth 14 once on the way past. The mess is now thinner. A staff member begins wiping a far table.",
        directorInstruction:
          "Push for the next move from one of them. The mess is not closing yet, but the room has begun the slow turn. The next booth does not speak.",
      },
      {
        id: "mess-hall-auriga-event-8",
        title: "Closing chime",
        kind: "provocation",
        event: "The mess closing chime sounds at low volume.",
        characterVisibleText:
          "A soft chime passes through the deck speakers. The wall scroll updates: mess closing in fifteen minutes. The window holds. The cookies, if untaken, are still on the small plate.",
        directorInstruction:
          "Push for a clean answer to the chime. Either staying through the closing minutes or walking back to quarters is the right answer. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "mess-hall-auriga-event-9",
        title: "Lights to night",
        kind: "provocation",
        event: "The mess shifts to night-cycle lighting.",
        characterVisibleText:
          "The deck lights cycle from mealtime warm to night-cycle blue. Two booths over, the trays clear themselves into the return chute. The mag plate under their trays clicks once to release.",
        directorInstruction:
          "Push for a clean physical move: rack out and walk back to quarters, take the cookies, or hold the booth as the mess clears.",
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
