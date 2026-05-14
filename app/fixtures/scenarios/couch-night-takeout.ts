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
    cost: 5,
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
    events: [
      {
        id: "couch-night-takeout-event-1",
        title: "Home screen",
        kind: "provocation",
        event: "The TV times out and the home screen returns.",
        characterVisibleText:
          "The TV home screen returns to the top. The remote sits closer to one member. A small sleep timer starts a countdown in the corner.",
        directorInstruction:
          "Push for a clear pick before the timer expires. Decisiveness, deferral, or care all read as a real answer.",
      },
      {
        id: "couch-night-takeout-event-2",
        title: "Container offered",
        kind: "reveal",
        event: "One container is held out across the cushion.",
        characterVisibleText:
          "One container is held out across the cushion. A fork hovers above it. The other container is still mostly closed.",
        directorInstruction: "Let the pair settle into shared eating or refuse it cleanly.",
      },
      {
        id: "couch-night-takeout-event-3",
        title: "Lamp click",
        kind: "ambient",
        event: "The lamp on the side table clicks down a level.",
        characterVisibleText:
          "The lamp on the side table dims to its lowest setting. The TV keeps playing. Neither member has spoken in a beat.",
        directorInstruction: "Reward members who can sit in silence. Notice members who cannot.",
      },
      {
        id: "couch-night-takeout-event-4",
        title: "Episode end",
        kind: "provocation",
        event: "The episode ends and a next-up countdown starts.",
        characterVisibleText:
          "The credits roll on the screen. A small box in the corner counts down from ten. Neither container has been touched in a while.",
        directorInstruction:
          "Push for a clear move before autoplay: let it run, pick on purpose, or kill the screen.",
      },
      {
        id: "couch-night-takeout-event-5",
        title: "One container empty",
        kind: "reveal",
        event: "One container is empty. The other is half done.",
        characterVisibleText:
          "One takeout container is closed and empty. The other has rice and one piece of broccoli. The chopsticks are pointed at the cushion.",
        directorInstruction: "Use the imbalance to surface generosity or a small ask.",
      },
      {
        id: "couch-night-takeout-event-6",
        title: "Phone face down",
        kind: "ambient",
        event: "One phone goes face down on the coffee table.",
        characterVisibleText:
          "One phone slides face-down onto the coffee table. The screen lit up once before it landed. The other phone is in a pocket.",
        directorInstruction: "Let the small choice be a small choice. Do not narrate it.",
      },
      {
        id: "couch-night-takeout-event-7",
        title: "Foot up",
        kind: "ambient",
        event: "One member puts a foot up on the coffee table.",
        characterVisibleText:
          "One foot goes up on the corner of the coffee table. The empty container shifts an inch. The remote stays where it is.",
        directorInstruction:
          "Use the small relaxation to test whether ease lands the same on both.",
      },
      {
        id: "couch-night-takeout-event-8",
        title: "Still watching",
        kind: "provocation",
        event: "The TV asks if anyone is still watching.",
        characterVisibleText:
          "A prompt fills the TV: still watching? A timer counts down behind the prompt. The remote is still between them.",
        directorInstruction:
          "Push for a clear next step or a clean call it a night before the screen times out. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "couch-night-takeout-event-9",
        title: "Recommendations carousel",
        kind: "reveal",
        event: "The home screen rolls a row of titles tuned to the room.",
        characterVisibleText:
          "A row of recommendations slides across the home screen. Each title sits beside a one-line tag. The remote pulses softly between them.",
        directorInstruction:
          "Let the next speaker name a row title that fits something already true about them on file. Draw only from existing brief or filed reads, not new biography.",
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
