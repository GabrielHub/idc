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
    cost: 25,
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
        pitch:
          "Unfurl the day's banner with two named bouts on the far wall. Surfaces who reads the schedule and who keeps quiet.",
        beat: "The day's banner unfurls down the far wall of the arena. The banner lists two bouts in clean lettering. The first bout is at the top. The crowd noise climbs a notch.",
        directorBeat:
          "The day's program just hung itself in front of you. Read the lineup, comment to your date on what you see, or stay quiet and let the roar carry. Do not voice the banner.",
      },
      {
        id: "colosseum-box-four-event-2",
        title: "First clash",
        kind: "provocation",
        pitch:
          "Open the bout at the east gate with the first strike landing. Forces a real read on the fight without narrating the strikes.",
        beat: "The gate at the east end opens. Two combatants walk to the center of the sand. The shorter combatant takes the high guard. The first clash lands. The crowd roar climbs.",
        directorBeat:
          "Two people are now fighting for real below you. React in your body or one short line: lean forward, look at your date, set your jaw, or hold your breath. Do not narrate the strikes. Do not voice the combatants.",
      },
      {
        id: "colosseum-box-four-event-3",
        title: "Horn at the rail",
        kind: "reveal",
        pitch:
          "Catch the horn in the afternoon light with its dedication placard. Surfaces stance on the coin and the loser's family.",
        beat: "The horn at the rail glints once in the afternoon light. A small placard under it reads: one sound per bout, dedicates the coin. The clay urn holds a single coin. The first bout is at the third minute.",
        directorBeat:
          "You can dedicate a coin if you choose to. Reach for the horn, ask your date if they want to, leave it on the hook, or comment on the placard. Speak from what you already feel about the cost of this. Do not voice the horn.",
      },
      {
        id: "colosseum-box-four-event-4",
        title: "Long quiet between rounds",
        kind: "ambient",
        pitch:
          "Drop a long quiet between rounds with dark spots on the sand. Surfaces whether either fills the held breath or sits inside it.",
        beat: "The combatants step back to the marks. The crowd settles into a long quiet between rounds. The sand has dark spots where it should not. The horn on its hook has not moved.",
        directorBeat:
          "The arena is holding its breath. Sit with the quiet, take your date's hand, glance away from the sand, or speak one short honest sentence. Do not fill the silence.",
      },
      {
        id: "colosseum-box-four-event-5",
        title: "A combatant falls",
        kind: "provocation",
        pitch:
          "Land the strike that ends the bout. Forces a real reaction to a death you just watched.",
        beat: "The shorter combatant takes a clean strike and goes down on the sand. The other combatant steps back. The combatant on the sand does not rise. The crowd roar climbs and falls.",
        directorBeat:
          "Someone just died in front of you. React the way you actually would: shut your eyes, take your date's wrist, sit still, or look at the horn. Do not perform a moral position. Do not voice the combatants.",
      },
      {
        id: "colosseum-box-four-event-6",
        title: "Coin in the urn",
        kind: "reveal",
        pitch:
          "Sit the coin in the urn at the rail. Forces a clean stance on dedicating it or leaving it.",
        beat: "The clay urn holds the single coin. The horn at the rail is on the hook. The bout is closed. The next bout is on the banner.",
        directorBeat:
          "The coin is right there and so is the horn. Dedicate it, leave it, ask your date which they want, or refuse the choice. Whatever you do, do not perform indifference. Do not voice the urn.",
      },
      {
        id: "colosseum-box-four-event-7",
        title: "Carry off in silence",
        kind: "ambient",
        pitch:
          "Lift the fallen combatant cleanly off the sand and rake the next mark. Surfaces whether either honors the small ritual.",
        beat: "The fallen combatant is lifted from the sand by two figures from the east gate. The lift is steady and the line off the sand is straight. The sand is raked once and the next mark is laid down.",
        directorBeat:
          "A body is being carried out below you. Honor the lift in your body or your line: stand, lower your head, take your date's hand, or simply watch. Do not narrate the carry. Do not voice the figures.",
      },
      {
        id: "colosseum-box-four-event-8",
        title: "Second bout opens",
        kind: "provocation",
        pitch:
          "Open the east gate for the second bout with the light shifted a degree. Forces a clean call: stay, leave, or sit it out at the back of the box.",
        beat: "The east gate opens for the second bout. Two new combatants walk to the marks. The afternoon light has shifted a degree. The horn at the rail is on the hook. The urn has its coin.",
        directorBeat:
          "Another fight is starting. Stay at the rail, ask your date if they want to leave, sit it out at the back of the box, or stand to go. Name the call clearly. Do not voice the combatants.",
      },
      {
        id: "colosseum-box-four-event-9",
        title: "Last call",
        kind: "reveal",
        pitch:
          "Sound a small chime under the urn at the third minute. Surfaces a clean stance on the horn, the coin, or the exit.",
        beat: "The bout is at the third minute. The shorter combatant has the lower guard. The horn on the hook has not moved. A small chime under the urn sounds once and stops.",
        directorBeat:
          "The arena is asking for a final decision. Take the horn, leave it, stand to go, or check what your date wants. Speak from what you actually feel. Do not voice the chime.",
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
