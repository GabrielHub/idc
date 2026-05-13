import type { DateScenario } from "../../domain/game";

export const colosseumBoxFour: DateScenario = {
  id: "colosseum-box-four",
  title: "Colosseum, Box Four",
  card: {
    summary:
      "A private box above the sand for two bouts. The fights are real and the death is real. A horn at the rail dedicates a coin to the loser's family.",
    tags: ["cosmic", "public", "high_pressure"],
    risk: "high",
    intimacy: "high",
    chaos: "high",
    idealFor: [
      "members who can witness serious harm without performing a reaction",
      "members who can offer steadiness without speaking for the partner",
      "members who can let a death stay a death",
    ],
    badFor: [
      "members who treat the sand as a metaphor for the date",
      "members who score the partner's reaction to a fight",
      "members who use the box to perform a moral position",
    ],
  },
  publicBrief: {
    location: "Box four, north tier above the sand, private box at the Hadrian Arena",
    premise:
      "Cupid booked a private box for two bouts. The fights are real. The combatants are real. The death is real.",
    whatBothCharactersKnow:
      "The box is private and held for the booking. Two stone seats with cushions face the sand. A horn at the rail can sound once per bout to dedicate a coin to the loser's family. A clay urn at the rail holds a single coin. The fights run on the day's schedule. The booking covers two bouts.",
    openingSituation:
      "Both members are seated in box four. The sand is empty. The day's banner is on the far wall. The horn is on its hook at the rail. The crowd noise is a low steady roar.",
  },
  director: {
    tone: "the low steady roar of the crowd, the sun on the stone, the smell of dust and oil, the box quiet against the size of the building",
    rules: [
      "Anchor the date to box four. The pair does not leave the box during a bout.",
      "Treat the violence as fact. The fight is not spectacle for the pair to riff on.",
      "Use the death as weight. The pair does not score the partner's reaction.",
      "Allow silence. The bout does not need a running commentary.",
      "Do not voice the combatants or any herald as continuing speakers. The banner unfurls without an announcer.",
    ],
    events: [
      {
        id: "colosseum-box-four-event-1",
        title: "Banner unfurls",
        kind: "ambient",
        event: "The day's banner unfurls on the far wall.",
        characterVisibleText:
          "The day's banner unfurls down the far wall of the arena. The banner lists two bouts in clean lettering. The first bout is at the top. The crowd noise climbs a notch.",
        directorInstruction:
          "Allow the small marker. The banner is not voiced as a continuing speaker.",
      },
      {
        id: "colosseum-box-four-event-2",
        title: "First clash",
        kind: "provocation",
        event: "The first bout opens at the east gate.",
        characterVisibleText:
          "The gate at the east end opens. Two combatants walk to the center of the sand. The shorter combatant takes the high guard. The first clash lands. The crowd roar climbs.",
        directorInstruction:
          "Push for a real read on the bout. The pair does not narrate the strikes. The combatants do not speak and are not voiced as continuing speakers.",
      },
      {
        id: "colosseum-box-four-event-3",
        title: "Horn at the rail",
        kind: "reveal",
        event: "The horn at the rail glints in the afternoon light.",
        characterVisibleText:
          "The horn at the rail glints once in the afternoon light. A small placard under it reads: one sound per bout, dedicates the coin. The clay urn holds a single coin. The first bout is at the third minute.",
        directorInstruction:
          "Use the small option to surface stance drawn from existing context. Either may take the horn at the right moment or leave it. The horn does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "colosseum-box-four-event-4",
        title: "Long quiet between rounds",
        kind: "ambient",
        event: "The crowd settles into a long quiet between rounds.",
        characterVisibleText:
          "The combatants step back to the marks. The crowd settles into a long quiet between rounds. The sand has dark spots where it should not. The horn on its hook has not moved.",
        directorInstruction:
          "Allow the quiet. The bout is in a held breath. The pair does not need to fill it.",
      },
      {
        id: "colosseum-box-four-event-5",
        title: "A combatant falls",
        kind: "provocation",
        event: "One combatant falls and does not rise.",
        characterVisibleText:
          "The shorter combatant takes a clean strike and goes down on the sand. The other combatant steps back. The combatant on the sand does not rise. The crowd roar climbs and falls.",
        directorInstruction:
          "Push for a real reaction. The fight is over. The combatants do not speak and are not voiced as continuing speakers.",
      },
      {
        id: "colosseum-box-four-event-6",
        title: "Coin in the urn",
        kind: "reveal",
        event: "The coin in the urn is still in place.",
        characterVisibleText:
          "The clay urn holds the single coin. The horn at the rail is on the hook. The bout is closed. The next bout is on the banner.",
        directorInstruction:
          "Use the small choice to surface care drawn from existing context. Either may dedicate the coin or leave it. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "colosseum-box-four-event-7",
        title: "Carry off in silence",
        kind: "ambient",
        event: "The fallen combatant is carried off in silence.",
        characterVisibleText:
          "The fallen combatant is lifted from the sand by two figures from the east gate. The lift is steady and the line off the sand is straight. The sand is raked once and the next mark is laid down.",
        directorInstruction:
          "Allow the small ritual. The figures do not address the pair and are not voiced as continuing speakers.",
      },
      {
        id: "colosseum-box-four-event-8",
        title: "Second bout opens",
        kind: "provocation",
        event: "The second bout opens at the east gate.",
        characterVisibleText:
          "The east gate opens for the second bout. Two new combatants walk to the marks. The afternoon light has shifted a degree. The horn at the rail is on the hook. The urn has its coin.",
        directorInstruction:
          "Push for a real read on whether the pair stays through the second bout, leaves the box now, or sits the second bout out at the back of the box. The combatants do not speak and are not voiced as continuing speakers.",
      },
      {
        id: "colosseum-box-four-event-9",
        title: "Last call",
        kind: "reveal",
        event: "A small chime under the urn sounds once at the third minute.",
        characterVisibleText:
          "The bout is at the third minute. The shorter combatant has the lower guard. The horn on the hook has not moved. A small chime under the urn sounds once and stops.",
        directorInstruction:
          "Use the small chime to surface what the pair wants drawn from existing context. Either may take the horn, leave it, or stand to leave the box. The chime is not voiced as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the fight as content to riff on.",
      "A member scores the partner's reaction to the death.",
    ],
    repeatBehavior:
      "If repeated, box four is held for the pair. The horn is on the hook. The urn has its coin. The banner lists the day's bouts.",
  },
  judgeRubric: {
    successSignals: [
      "The pair sits with the death without performing a reaction.",
      "A member offers steadiness without speaking for the partner.",
    ],
    failureSignals: [
      "A member uses the sand as a metaphor for the date.",
      "The pair argues about the right reaction to the fight.",
    ],
    statFocus: ["trust", "relationshipHealth", "strain"],
  },
};
