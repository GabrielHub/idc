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
      "members who want a couch and ten quiet minutes more than dinner",
      "members whose late shifts make a TV and a takeout container feel like care",
      "members whose warm steady voice fits one lamp and a remote",
      "members who can sit through a track without filling the silence",
    ],
    badFor: [
      "members who need an audience to feel chosen",
      "members who cannot extract leverage from a sleep timer",
      "members who only know how to deliver oaths standing up",
    ],
  },
  publicBrief: {
    location: "A quiet living room with a couch and one functional remote",
    premise: "Cupid arranged a low-pressure stay-in. Food is delivered. The couch is the venue.",
    whatBothCharactersKnow:
      "The plan is dinner on the couch and one show or one movie. No surprises are scheduled.",
    openingSituation:
      "Both members sit at opposite ends of a couch. The takeout is on the coffee table. The remote is between them.",
  },
  director: {
    tone: "intimate without ceremony, lit by a TV and one lamp",
    rules: [
      "Anchor the date to the couch. The pair does not migrate to the kitchen, the balcony, or another room.",
      "Resist forcing a confession. Let silence count as connection.",
      "Use the remote, the food, and the couch as the only props.",
    ],
    beats: [
      {
        atTurn: 10,
        title: "Home screen",
        event: "The TV times out and the home screen returns.",
        characterVisibleText:
          "The TV home screen returns to the top. The remote sits closer to one member. A small sleep timer starts a countdown in the corner.",
        directorInstruction: "Use the choice to expose decisiveness, deferral, or care.",
      },
      {
        atTurn: 20,
        title: "Container offered",
        event: "One container is held out across the cushion.",
        characterVisibleText:
          "One container is held out across the cushion. A fork hovers above it. The other container is still mostly closed.",
        directorInstruction: "Let the pair settle into shared eating or refuse it cleanly.",
      },
      {
        atTurn: 28,
        title: "Lamp click",
        event: "The lamp on the side table clicks down a level.",
        characterVisibleText:
          "The lamp on the side table dims to its lowest setting. The TV keeps playing. Neither member has spoken in a beat.",
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
