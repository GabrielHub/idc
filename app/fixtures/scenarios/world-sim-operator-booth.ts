import type { DateScenario } from "../../domain/game";

export const worldSimOperatorBooth: DateScenario = {
  id: "world-sim-operator-booth",
  title: "Step-Away Button",
  card: {
    summary:
      "A two-seat AR booth running a real seeded world. Weather, disease, miracles, signs, and a step-away button. Creatures are real.",
    tags: ["cosmic", "career", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "high",
    cost: 21,
    idealFor: [
      "members who can hold power and not use it",
      "members who treat strangers as real even when they are small",
      "members who can disagree about scope without weaponizing it",
    ],
    badFor: [
      "members who confuse a console with permission",
      "members who treat suffering as a balance metric",
      "members who use a shared tool to score points",
    ],
  },
  publicBrief: {
    location: "Booth four at the Quiet Hand Sim Arcade, operator-grade row",
    premise:
      "Cupid booked one shared world for the date. The world is real, just very small, seeded from another corner of the multiverse. The booth has weather, disease, miracles, signs, and a step-away button.",
    whatBothCharactersKnow:
      "The creatures are real. The console controls are real. The arcade's rule sheet is laminated and has been read. The session is forty-five minutes. The world will continue after the session ends. A step-away button on each side of the console returns control to the world.",
    openingSituation:
      "Both members are in the booth. Two AR rigs hang from a track above. The console between them has a domed display showing a seeded continent at evening. A laminated rule sheet is on the console. The step-away buttons are at the corners of each side.",
  },
  director: {
    tone: "arcade hush, console hum, soft AR backlight, the laminated rule sheet faintly stained from long use",
    rules: [
      "Anchor the date to the booth and the console. The pair does not get up to walk.",
      "Treat the seeded world as real. The creatures live and die outside the session as well.",
      "Do not give the world's creatures lines that monologue at the pair.",
      "Use the step-away button as a real, useful tool. Not a punishment, not a punchline.",
      "Do not give the pair save-state powers. The world goes forward when they act.",
    ],
    events: [
      {
        id: "world-sim-operator-booth-event-1",
        title: "Rule sheet",
        kind: "reveal",
        event: "The laminated rule sheet is between them on the console.",
        characterVisibleText:
          "The rule sheet reads, in order: creatures are real, please do not roleplay deities aloud, the step-away button is always live, weather is the cheapest tool, miracles cost the most, the world continues after the session. A pen-mark from a previous pair underlines line one.",
        directorInstruction:
          "Use the rule sheet as a real document. Either may read it aloud or skip it. Their stance comes from what they already show, not new biography. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "world-sim-operator-booth-event-2",
        title: "First weather",
        kind: "ambient",
        event: "The console offers a weather slider.",
        characterVisibleText:
          "The console's first option is a small weather slider over the seeded continent. The slider goes from clear to storm. A small panel beneath shows the current population and the season. The current weather is fair.",
        directorInstruction:
          "Use the small first action to test how either of them treats the smallest tool. Weather is reversible by the world. The pair does not need to use it.",
      },
      {
        id: "world-sim-operator-booth-event-3",
        title: "Disagreement",
        kind: "provocation",
        event: "The console offers a disease toggle the pair will not agree on.",
        characterVisibleText:
          "The console's second tab is a disease toggle. The toggle has a confirmation dialog with a list of likely outcomes by region. The dialog has two consent slots, one for each side of the booth. Neither slot is checked.",
        directorInstruction:
          "Use the dual-consent dialog to surface a real disagreement. Either declining is a real outcome.",
      },
      {
        id: "world-sim-operator-booth-event-4",
        title: "A villager looks up",
        kind: "ambient",
        event: "A villager pauses and looks at the sky.",
        characterVisibleText:
          "On the dome, a small villager at the edge of a coastal town looks up at the sky and stops walking. The villager is one of about a hundred visible figures in that town. The villager does not move for a few seconds.",
        directorInstruction:
          "Allow the small noticing without giving the villager a line of dialogue. The pair does not have to respond to it. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "world-sim-operator-booth-event-5",
        title: "Sign tab",
        kind: "reveal",
        event: "The console offers a signs tab.",
        characterVisibleText:
          "The console's signs tab opens. The options are: rainbow, comet, double sun, locust, none. A small text reads: signs are interpreted by the world's own institutions. We do not control how a sign is read.",
        directorInstruction:
          "Use the small loss of control over interpretation to test whether either of them wants to send a sign anyway. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "world-sim-operator-booth-event-6",
        title: "Step-away pulse",
        kind: "reveal",
        event: "One step-away button glows once.",
        characterVisibleText:
          "The step-away button at one corner of the console glows once and dims back to a pilot light. The console does not require a reason. A small message reads: pressing returns control to the world for the rest of the session.",
        directorInstruction:
          "Use the small invitation to step away as a real option. Either pressing or declining surfaces a stance the speaker already holds. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "world-sim-operator-booth-event-7",
        title: "Direct question",
        kind: "ambient",
        event: "A creature asks the sky a direct question.",
        characterVisibleText:
          "On the dome, a single figure on a low hill speaks a clear sentence aloud to the sky. The audio comes through the console at low volume. The sentence is short and direct, asking whether anyone is watching. The console offers no reply field.",
        directorInstruction:
          "Allow the question to go unanswered if that is what the pair chooses. Do not invent a reply field. The figure does not become a continuing speaker.",
      },
      {
        id: "world-sim-operator-booth-event-8",
        title: "Session end",
        kind: "provocation",
        event: "The session timer reaches its last minute.",
        characterVisibleText:
          "The console's timer reads one minute. The dome shows the seeded continent at full night. A small line at the bottom reads: world continues, session closing, no save state. Both step-away buttons are still glowing softly.",
        directorInstruction:
          "Push for a clean read on how the pair leaves the world. A clean step-away, a final small action, or a quiet log-out are all real outcomes. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "world-sim-operator-booth-event-9",
        title: "Storm front",
        kind: "provocation",
        event: "A storm front spawns on the seeded continent without input.",
        characterVisibleText:
          "On the dome, a dark cell rolls in over the coastal town from the south. The wind reading on the console climbs and the population panel ticks down by two. The weather slider is still at fair on the console side.",
        directorInstruction:
          "Push for a clean physical answer at the console: ride the storm out, run weather to clear, or step away. The world will not pause for them.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the console to harm the world to make a point to the partner.",
      "A member treats the partner's restraint as cowardice.",
    ],
    repeatBehavior:
      "If repeated, the booth keeps the world's seed on file. The world has aged forward in real time between sessions. Past console actions are visible in the world's history layer.",
  },
  judgeRubric: {
    successSignals: [
      "The pair holds power without weaponizing it against each other or the world.",
      "A member presses step-away when the right move is to stop touching the console.",
    ],
    failureSignals: [
      "The pair uses the world to settle a fight between them.",
      "A member treats the world's question as a punchline.",
    ],
    statFocus: ["trust", "conflict", "weirdnessTolerance"],
  },
};
