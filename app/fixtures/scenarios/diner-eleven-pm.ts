import type { DateScenario } from "../../domain/game";

export const dinerElevenPm: DateScenario = {
  id: "diner-eleven-pm",
  title: "Diner At Eleven",
  card: {
    summary:
      "Pancakes are available at all hours, and so are silences. One booth, vinyl seats, shared fries.",
    tags: ["food", "domestic", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "service industry members off shift",
      "members who want a conversation without daylight",
      "pairs that talk better after dark",
    ],
    badFor: ["members who need to be impressed", "members with a 5 a.m. obligation"],
  },
  publicBrief: {
    location: "Booth 4 at Connie's, open since 1979",
    premise:
      "Cupid booked a late booth at a 24 hour diner. The waitress has worked here longer than either member has been online.",
    whatBothCharactersKnow:
      "Pancakes are at the breakfast section of the menu and are available now. The waitress refills coffee without asking. Tipping is expected.",
    openingSituation:
      "Both members slide into a booth with cracks in the vinyl. Two laminated menus and a small jukebox tab arrive.",
  },
  director: {
    tone: "warm, slightly worn, lit by hanging pendant fixtures",
    rules: [
      "Honor late night honesty without forcing confession.",
      "The waitress is a real person, not a comic device.",
      "Allow long silences. The booth can hold them.",
    ],
    beats: [
      {
        atTurn: 8,
        title: "Coffee refill",
        event:
          "The waitress arrives with the carafe before either member realizes they wanted more.",
        characterVisibleText:
          "Two cups are topped without comment. A small jug of half and half is centered.",
        directorInstruction: "Use the small mercy to lower the pair's guard.",
      },
      {
        atTurn: 18,
        title: "Shared plate",
        event: "A plate of fries arrives between them.",
        characterVisibleText:
          "The fries are shared by default. There is one ramekin of ranch, one of ketchup.",
        directorInstruction: "Allow eating to be the conversation for one beat.",
      },
      {
        atTurn: 28,
        title: "Last booth check",
        event: "The waitress passes a final time and leaves a check without rushing them.",
        characterVisibleText: "The check sits face down. The waitress is already two booths away.",
        directorInstruction: "Push for one honest sentence before the booth ends.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the staff as scenery.",
      "A member uses the late hour as cover for a confession that asks more than the booth can hold.",
    ],
    repeatBehavior:
      "If repeated, the waitress remembers the order. She may say the word again with mild affection.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a silence land without flinching.",
      "A member treats the staff with respect on the way out.",
    ],
    failureSignals: [
      "A member performs sincerity instead of speaking it.",
      "The pair turns the booth into a confessional booth.",
    ],
    statFocus: ["trust", "chemistry", "relationshipHealth"],
  },
};
