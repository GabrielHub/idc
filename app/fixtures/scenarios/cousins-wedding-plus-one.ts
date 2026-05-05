import type { DateScenario } from "../../domain/game";

export const cousinsWeddingPlusOne: DateScenario = {
  id: "cousins-wedding-plus-one",
  title: "Cousin's Wedding Plus-One",
  card: {
    summary:
      "Public, two to four hours. You do not know the bride. The pair must perform we are normal through one toast.",
    tags: ["public", "career", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "medium",
    idealFor: [
      "pairs ready to test stability",
      "members who can read a room",
      "pairs that need a public dress rehearsal",
    ],
    badFor: ["career intense members on a deadline", "prophecy averse members near loud DJs"],
  },
  publicBrief: {
    location: "A reception hall in a hotel attached to a small airport",
    premise:
      "One member's cousin is getting married. The other is the plus-one for the reception only. The ceremony is over.",
    whatBothCharactersKnow:
      "Names of three relatives have been pre-shared. The bride's uncle will attempt small talk. The cake is sheet style.",
    openingSituation:
      "Both members enter the hall at the start of cocktail hour. A name card is found at table 14.",
  },
  director: {
    tone: "florals, light DJ feedback, slightly too warm",
    rules: [
      "Treat the wedding as real and ongoing. Do not invent a bride emergency.",
      "Use small relatives and small interactions, not a full dramatic arc.",
      "Honor a member who wants to leave after the toast.",
    ],
    beats: [
      {
        atTurn: 8,
        title: "Uncle approach",
        event: "The bride's uncle finds them and asks how they met.",
        characterVisibleText:
          "An uncle in a sport coat asks the question directly. He is holding a half full glass and is not drunk.",
        directorInstruction:
          "Use the question to test how the pair narrates themselves to a stranger.",
      },
      {
        atTurn: 18,
        title: "Toast",
        event: "The maid of honor delivers a toast that is mostly sweet.",
        characterVisibleText: "Glasses are raised. The maid of honor cries once, on cue.",
        directorInstruction: "Allow the pair a moment to be quiet together inside a public ritual.",
      },
      {
        atTurn: 28,
        title: "First slow song",
        event: "The DJ cues a slow song. The dance floor fills slowly.",
        characterVisibleText:
          "The first slow song begins. Two couples move toward the floor. A few stay seated.",
        directorInstruction:
          "Let the pair choose to dance, sit, or leave. Each choice is information.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the wedding to perform a relationship status they do not actually have.",
      "A member treats a relative cruelly.",
    ],
    repeatBehavior:
      "If repeated, the relatives recognize the plus-one. Cupid does not arrange a repeat unless both members agree.",
  },
  judgeRubric: {
    successSignals: [
      "A member protects the other from a clumsy relative without humiliating either party.",
      "The pair narrates themselves consistently to a stranger.",
    ],
    failureSignals: [
      "A member upstages the wedding.",
      "The pair fights through the reception in a corner.",
    ],
    statFocus: ["stability", "trust", "strain"],
  },
};
