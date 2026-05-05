import type { DateScenario } from "../../domain/game";

export const couchNightTakeout: DateScenario = {
  id: "couch-night-takeout",
  title: "Couch Night, Two Containers",
  card: {
    summary: "One apartment, two takeout containers, a TV. The chaos is choosing what to watch.",
    tags: ["domestic", "food", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "burnt out members",
      "members who want to be wanted at home",
      "pairs ready for low ceremony",
    ],
    badFor: ["members who need a venue to perform inside", "members who reject domestic stakes"],
  },
  publicBrief: {
    location: "A quiet living room with a couch and one functional remote",
    premise: "Cupid arranged a low-pressure stay-in. Food is delivered. The couch is the venue.",
    whatBothCharactersKnow:
      "The plan is dinner on the couch and one show or one movie. No surprises are scheduled.",
    openingSituation:
      "Both members arrive. The takeout is on the coffee table. The remote is between them.",
  },
  director: {
    tone: "intimate without ceremony, lit by a TV and one lamp",
    rules: [
      "Resist forcing a confession. Let silence count as connection.",
      "Use the remote, the food, and the couch as the only props.",
      "Do not stage a domestic disaster. The point is that nothing is happening.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Remote handoff",
        event: "One member is asked to pick what they watch.",
        characterVisibleText: "The remote sits closer to one member. The home screen waits.",
        directorInstruction: "Use the choice to expose decisiveness, deferral, or care.",
      },
      {
        atTurn: 16,
        title: "Container swap",
        event: "An offer is made to share a bite from the other container.",
        characterVisibleText: "One container is held out across the cushion. A fork hovers.",
        directorInstruction: "Let the pair settle into shared eating or refuse it cleanly.",
      },
      {
        atTurn: 26,
        title: "Quiet check",
        event: "A long pause arrives that neither member feels obligated to break.",
        characterVisibleText: "The show keeps playing. Neither member has spoken in a while.",
        directorInstruction: "Reward members who can sit in silence. Notice members who cannot.",
      },
    ],
    earlyEndTriggers: [
      "A member tries to convert the date into a content shoot.",
      "A member turns the silence into an interrogation.",
    ],
    repeatBehavior:
      "If repeated, the apartment remembers the prior order and the prior show. The couch makes no comment.",
  },
  judgeRubric: {
    successSignals: [
      "A member rests visibly without apologizing for it.",
      "The pair handles the small choices without making them tests.",
    ],
    failureSignals: [
      "A member treats domestic ease as a sign nothing is happening.",
      "The pair fills silence with performance.",
    ],
    statFocus: ["trust", "stability", "relationshipHealth"],
  },
};
