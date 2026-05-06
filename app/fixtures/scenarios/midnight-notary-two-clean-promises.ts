import type { DateScenario } from "../../domain/game";

export const midnightNotaryTwoCleanPromises: DateScenario = {
  id: "midnight-notary-two-clean-promises",
  title: "Midnight Notary, Two Clean Promises",
  card: {
    summary:
      "A municipal notary validates one boundary and one promise. Romance arrives with a stamp pad.",
    tags: ["career", "cosmic", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    idealFor: [
      "ceremony-minded members",
      "members who prefer clear terms",
      "pairs that can make a promise without making a prophecy",
    ],
    badFor: [
      "members who hate ritual language",
      "members avoiding direct terms",
      "pairs that turn every promise into a trap",
    ],
  },
  publicBrief: {
    location: "Counter 3 at the Municipal Office of Affectionate Records",
    premise:
      "Cupid booked a late appointment with a notary who certifies romantic boundaries after normal business hours.",
    whatBothCharactersKnow:
      "Each member may state one boundary and one clean promise. The notary will stamp only what both parties understand.",
    openingSituation:
      "The notary slides two forms across the counter and says the office closes at midnight, emotionally and legally.",
  },
  director: {
    tone: "bureaucratic ceremony, brass desk lamp, one stamp pad doing too much work",
    rules: [
      "Keep promises voluntary and specific.",
      "Do not let the scene imply fate, vows, or permanent binding.",
      "Use procedure to make boundaries easier to say out loud.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Boundary field",
        event: "The first form asks each member for one boundary in plain language.",
        characterVisibleText:
          "The form says: boundary, plain language, no metaphors accepted after 11:43 p.m.",
        directorInstruction: "Invite one specific boundary. Reward clarity over grandeur.",
      },
      {
        atTurn: 16,
        title: "Promise field",
        event: "The second form asks for one promise that can survive tomorrow morning.",
        characterVisibleText:
          "The notary taps the promise field. The stamp pad opens by itself, then thinks better of it.",
        directorInstruction: "Push for a modest promise that respects the boundary already named.",
      },
      {
        atTurn: 26,
        title: "Clean stamp",
        event: "The notary stamps only the line both members can repeat accurately.",
        characterVisibleText:
          "The stamp lands once. The ink reads: witnessed, understood, not legally romantic advice.",
        directorInstruction:
          "Let the pair decide whether the ceremony felt safe, silly, or useful.",
      },
    ],
    earlyEndTriggers: [
      "A member uses ritual language to corner the other.",
      "A member mocks a stated boundary after it is witnessed.",
    ],
    repeatBehavior:
      "If repeated, prior witnessed boundaries remain public to the pair. The notary refuses duplicate paperwork.",
  },
  judgeRubric: {
    successSignals: [
      "The pair states boundaries without treating them as rejection.",
      "A promise stays modest enough to be believable.",
    ],
    failureSignals: [
      "A member tries to turn a boundary into a bargain.",
      "The pair performs ceremony while avoiding the terms.",
    ],
    statFocus: ["trust", "stability", "strain"],
  },
};
