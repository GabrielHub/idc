import type { DateScenario } from "../../domain/game";

export const concessionStandHeatDeath: DateScenario = {
  id: "concession-stand-heat-death",
  title: "Closing Time",
  card: {
    summary:
      "A 24-hour concession stand at the actual end of time. One star left in the sky. Forty minutes before it quits.",
    tags: ["cosmic", "food", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "low",
    cost: 10,
    idealFor: [
      "members who can hold a small night without reaching for meaning",
      "members who treat a fryer that still works as a small gift",
      "members who do not need a closing speech",
    ],
    badFor: [
      "members who turn every moment into a manifesto",
      "members who hoard the last of anything by reflex",
      "members who confuse the end of time with the end of the date",
    ],
  },
  publicBrief: {
    location: "The order window of the 24-hour concession stand at the Last Verge, end of time",
    premise:
      "Cupid booked a window seat at a small concession stand kept open at the heat death of the universe. One star is still on a schedule. The stand serves until the last patron leaves.",
    whatBothCharactersKnow:
      "The universe is two degrees above absolute zero. The stand has hot water, a working fryer, a soft drink fountain, and a guestbook. The last visible star is on a schedule. The pair has roughly forty minutes. The pair is the only patron tonight.",
    openingSituation:
      "Both members stand at the order window. A laminated menu is on the counter. Two folding stools sit beside the window. The cook on the other side of the window is patient and does not rush the order.",
  },
  director: {
    tone: "deep cold outside, warm air at the window, fryer hum, faint canned music on a low loop",
    flow: "conversation",
    rules: [
      "Anchor the date to the stand window and its two stools. The pair does not wander the dark.",
      "Use the end of time as quiet, not as crisis. There is nothing to save.",
      "Treat the cook as ambient labor. The cook does not deliver speeches.",
      "Allow the date to be small. Profundity is not the win condition.",
    ],
    events: [
      {
        id: "concession-stand-heat-death-event-1",
        title: "First order",
        kind: "provocation",
        pitch:
          "Bring the cook to the window with the pad open. Forces a clean first order without ceremony.",
        beat: "The cook stands at the window in a clean apron. A small pad is in the cook's hand. The fryer is warm. The menu has fries, two kinds of soda, and a single pastry of the night. The pair has forty minutes.",
        directorBeat:
          "Someone is waiting to take your order. Order for yourself, order for your date, ask them what they want, or stall by reading the menu aloud. Pick a move now. Do not voice the cook.",
      },
      {
        id: "concession-stand-heat-death-event-2",
        title: "Coupon book",
        kind: "reveal",
        pitch:
          "Surface a pre-collapse coupon book with one pastry coupon mostly torn. Surfaces whether either treats the venue as a transaction or as an evening.",
        beat: "A small coupon book is folded in a coat pocket. The coupons are pre-collapse currency, expired by every standard, accepted here without comment. A coupon for one pastry has been torn most of the way out.",
        directorBeat:
          "You have a coupon that should not work but does. Tear it the rest of the way out, ask your date if they want to use it, pocket it without trying, or laugh at the absurdity of having it. Make the small choice visible.",
      },
      {
        id: "concession-stand-heat-death-event-3",
        title: "One star",
        kind: "ambient",
        pitch:
          "Blink the last visible star on schedule with thirty-eight minutes on the clock. Surfaces who notices the countdown and who keeps eyes inside.",
        beat: "Through the window over the cook's shoulder, the last visible star blinks once. The stand window is warm against the dark. A small clock on the back wall reads thirty-eight minutes.",
        directorBeat:
          "The sky just told you how much time is left. Glance, say what you saw, point it out to your date, or refuse to look up. Do not turn the count into a deadline. Do not voice the star.",
      },
      {
        id: "concession-stand-heat-death-event-4",
        title: "Guestbook",
        kind: "reveal",
        pitch:
          "Surface a guestbook with one entry already in their handwriting, dated tonight. Forces a stance on the small future entry without making it the topic.",
        beat: "The guestbook is open at the counter. A pen sits on the cover. The most recent entry is in their handwriting, dated tonight, in advance, with a single sentence already written: we ate at the end and it was fine.",
        directorBeat:
          "There is a sentence in your own handwriting that you have not written yet. Read it aloud, hand the pen across, sign under it, or close the book. Speak from how that lands, not from a speech. Do not voice the book.",
      },
      {
        id: "concession-stand-heat-death-event-5",
        title: "Fries land",
        kind: "reveal",
        pitch:
          "Land a hot boat of fries on the counter with a small vinegar cup. Forces a small generosity: hand the boat across, share, or claim it.",
        beat: "A paper boat of fries lands on the counter, hot, salted, the right amount of vinegar in a small cup. Two paper napkins sit beside it. The cook turns to wipe the back counter.",
        directorBeat:
          "Food is warm in front of you. Push the boat to the middle, hand your date a fry, take one for yourself first, or pour the vinegar without asking. Show care or claim with your hands. Do not voice the cook.",
      },
      {
        id: "concession-stand-heat-death-event-6",
        title: "Stool tilt",
        kind: "ambient",
        pitch:
          "Tilt one folding stool a quarter inch with a scrape on gravel. Surfaces whether either adjusts for the partner's comfort.",
        beat: "One of the two folding stools at the window tilts a quarter inch as a foot shifts. The metal foot scrapes once on the gravel. The cook has not turned around.",
        directorBeat:
          "Something small went off balance under you or your date. Steady the stool, offer to switch, prop a foot under the leg, or ignore it. Show whether you notice these things. Do not voice the stool.",
      },
      {
        id: "concession-stand-heat-death-event-7",
        title: "Music skip",
        kind: "ambient",
        pitch:
          "Skip the canned music a half beat with twelve minutes left and the fries mostly gone. Surfaces who names the time or the next move.",
        beat: "The canned music on the speaker over the window skips half a beat and resumes the same loop. The fryer hums. The clock on the back wall reads twelve minutes. The fries are mostly gone.",
        directorBeat:
          "The night is winding down quietly. Comment on the skip, say what you want to do with the last twelve minutes, ask your date the same, or sit with it. Name something honest. Do not voice the music.",
      },
      {
        id: "concession-stand-heat-death-event-8",
        title: "Star quits",
        kind: "provocation",
        pitch:
          "End the star on schedule with the receipt slid across. Forces a clean ordinary exit without ceremony.",
        beat: "Through the window, the last visible star quits on schedule. The dark beyond the window is complete. The stand lights are unchanged. The cook closes the pad and slides a small receipt across the counter.",
        directorBeat:
          "The lights outside just went out forever. Take the receipt, propose the walk back to the booth, ask your date for one more forty minutes, or stand. Do not make a speech. Do not voice the cook.",
      },
      {
        id: "concession-stand-heat-death-event-9",
        title: "Window shutter",
        kind: "provocation",
        pitch:
          "Roll the metal shutter halfway across the window. Forces a clean physical move on the receipt and the exit.",
        beat: "A metal shutter rolls halfway down across the order window. The fryer light cuts to half. The receipt is still on the counter under the shutter line.",
        directorBeat:
          "The window is closing on you. Grab the receipt, ask the cook to hold the shutter, slide back from the counter, or step away with your date. Move your body in your next beat. Do not voice the cook.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the end of time to extract a confession from the partner.",
      "A member treats the small evening as beneath them.",
    ],
    repeatBehavior:
      "If repeated, the stand keeps the pair's order on file. The guestbook entry is the same. The fries are the same. The cook nods.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a small evening be small.",
      "A member shares the fries without making it a metaphor.",
    ],
    failureSignals: [
      "The pair turns the heat death into a fight about meaning.",
      "A member hoards the last good thing.",
    ],
    statFocus: ["chemistry", "stability", "relationshipHealth"],
  },
};
