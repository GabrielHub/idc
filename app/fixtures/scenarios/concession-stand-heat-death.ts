import type { DateScenario } from "../../domain/game";

export const concessionStandHeatDeath: DateScenario = {
  id: "concession-stand-heat-death",
  title: "Concession Stand At The Heat Death",
  card: {
    summary:
      "A 24-hour concession stand at the actual end of time. One star left in the sky. Forty minutes before it quits.",
    tags: ["cosmic", "food", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "low",
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
        event: "The cook waits for the first item.",
        characterVisibleText:
          "The cook stands at the window in a clean apron. A small pad is in the cook's hand. The fryer is warm. The menu has fries, two kinds of soda, and a single pastry of the night. The pair has forty minutes.",
        directorInstruction:
          "Open the date with a small concrete decision. Let either of them order without ceremony.",
      },
      {
        id: "concession-stand-heat-death-event-2",
        title: "Coupon book",
        event: "A small coupon booklet is in a coat pocket.",
        characterVisibleText:
          "A small coupon book is folded in a coat pocket. The coupons are pre-collapse currency, expired by every standard, accepted here without comment. A coupon for one pastry has been torn most of the way out.",
        directorInstruction:
          "Use the small coupon to test whether either of them treats the venue as a transaction or as an evening.",
      },
      {
        id: "concession-stand-heat-death-event-3",
        title: "One star",
        event: "The last star blinks once on schedule.",
        characterVisibleText:
          "Through the window over the cook's shoulder, the last visible star blinks once. The stand window is warm against the dark. A small clock on the back wall reads thirty-eight minutes.",
        directorInstruction:
          "Allow the small countdown without making it a deadline. The pair is not in danger.",
      },
      {
        id: "concession-stand-heat-death-event-4",
        title: "Guestbook",
        event: "The guestbook has one entry already in their handwriting.",
        characterVisibleText:
          "The guestbook is open at the counter. A pen sits on the cover. The most recent entry is in their handwriting, dated tonight, in advance, with a single sentence already written: we ate at the end and it was fine.",
        directorInstruction:
          "Let the small future entry do its work without becoming the topic. Either may sign or leave it.",
      },
      {
        id: "concession-stand-heat-death-event-5",
        title: "Fries land",
        event: "A paper boat of fries lands on the counter.",
        characterVisibleText:
          "A paper boat of fries lands on the counter, hot, salted, the right amount of vinegar in a small cup. Two paper napkins sit beside it. The cook turns to wipe the back counter.",
        directorInstruction:
          "Use the food to test small generosity. Either may hand the boat across or take from the middle.",
      },
      {
        id: "concession-stand-heat-death-event-6",
        title: "Stool tilt",
        event: "One of the folding stools tilts a quarter inch on its leg.",
        characterVisibleText:
          "One of the two folding stools at the window tilts a quarter inch as a foot shifts. The metal foot scrapes once on the gravel. The cook has not turned around.",
        directorInstruction:
          "Use the small body cue to test whether either of them adjusts for the partner's comfort.",
      },
      {
        id: "concession-stand-heat-death-event-7",
        title: "Music skip",
        event: "The canned music skips and resumes.",
        characterVisibleText:
          "The canned music on the speaker over the window skips half a beat and resumes the same loop. The fryer hums. The clock on the back wall reads twelve minutes. The fries are mostly gone.",
        directorInstruction:
          "Allow the small skip. The pair does not need to comment on time. Either may name the next move.",
      },
      {
        id: "concession-stand-heat-death-event-8",
        title: "Star quits",
        event: "The last star reaches the end of its schedule.",
        characterVisibleText:
          "Through the window, the last visible star quits on schedule. The dark beyond the window is complete. The stand lights are unchanged. The cook closes the pad and slides a small receipt across the counter.",
        directorInstruction:
          "Push for a clean ordinary exit. A walk back to the booth, a quiet thank you, or the choice to stay another forty minutes are all real outcomes.",
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
