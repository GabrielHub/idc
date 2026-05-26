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
        pitch:
          "Set the laminated rule sheet between them with creatures are real underlined by a prior pair. Surfaces stance on the bar.",
        beat: "The rule sheet reads, in order: creatures are real, please do not roleplay deities aloud, the step-away button is always live, weather is the cheapest tool, miracles cost the most, the world continues after the session. A pen-mark from a previous pair underlines line one.",
        directorBeat:
          "The rules are between you. Read one aloud, comment on the underline to your date, ask which line they would underline, or skip the sheet. Take a stance. Do not voice the rule sheet.",
      },
      {
        id: "world-sim-operator-booth-event-2",
        title: "First weather",
        kind: "ambient",
        pitch:
          "Open the weather slider over the seeded continent from clear to storm with current population shown. Surfaces how either treats the smallest tool.",
        beat: "The console's first option is a small weather slider over the seeded continent. The slider goes from clear to storm. A small panel beneath shows the current population and the season. The current weather is fair.",
        directorBeat:
          "The smallest control is in reach. Leave it at fair, nudge it one notch, ask your date what they would do, or push the slider firmly. Show your relationship with small power.",
      },
      {
        id: "world-sim-operator-booth-event-3",
        title: "Disagreement",
        kind: "provocation",
        pitch:
          "Open a disease toggle with two consent slots, one per side of the booth. Forces a real consent decision.",
        beat: "The console's second tab is a disease toggle. The toggle has a confirmation dialog with a list of likely outcomes by region. The dialog has two consent slots, one for each side of the booth. Neither slot is checked.",
        directorBeat:
          "A real harmful tool is asking for both consents. Refuse aloud, ask your date how they feel about it, propose a small scope instead, or step back from the dialog. Make the disagreement visible if there is one. Do not voice the console.",
      },
      {
        id: "world-sim-operator-booth-event-4",
        title: "A villager looks up",
        kind: "ambient",
        pitch:
          "Stop a villager mid-walk to look at the sky on the dome. Surfaces a small noticing the pair can respond to or not.",
        beat: "On the dome, a small villager at the edge of a coastal town looks up at the sky and stops walking. The villager is one of about a hundred visible figures in that town. The villager does not move for a few seconds.",
        directorBeat:
          "Someone on the dome just looked up at you. Hold still, comment quietly to your date, refuse to wave, or zoom out. Do not voice the villager.",
      },
      {
        id: "world-sim-operator-booth-event-5",
        title: "Sign tab",
        kind: "reveal",
        pitch:
          "Open the signs tab: rainbow, comet, double sun, locust, none with a note that local institutions interpret. Surfaces stance on losing control of meaning.",
        beat: "The console's signs tab opens. The options are: rainbow, comet, double sun, locust, none. A small text reads: signs are interpreted by the world's own institutions. We do not control how a sign is read.",
        directorBeat:
          "Signs are on offer with interpretation out of your hands. Pick none aloud, ask your date which they would risk, comment on the text, or shut the tab. Speak from your real comfort with that loss of control. Do not voice the signs tab.",
      },
      {
        id: "world-sim-operator-booth-event-6",
        title: "Step-away pulse",
        kind: "reveal",
        pitch:
          "Glow one step-away button once and dim it with a note that pressing returns control to the world. Surfaces a real option the pair can take or decline.",
        beat: "The step-away button at one corner of the console glows once and dims back to a pilot light. The console does not require a reason. A small message reads: pressing returns control to the world for the rest of the session.",
        directorBeat:
          "The booth just offered you a real out. Press it, ask your date if they want to, decline aloud, or comment on the pilot light. Make the call. Do not voice the button.",
      },
      {
        id: "world-sim-operator-booth-event-7",
        title: "Direct question",
        kind: "ambient",
        pitch:
          "Have a small figure on a low hill speak one short clear sentence aloud to the sky with no reply field on the console. Surfaces stance on staying silent.",
        beat: "On the dome, a single figure on a low hill speaks a clear sentence aloud to the sky. The audio comes through the console at low volume. The sentence is short and direct, asking whether anyone is watching. The console offers no reply field.",
        directorBeat:
          "Someone in the world just asked the sky if anyone is watching. Sit with the question silently, glance at your date, comment to them on the absence of a reply field, or lower the volume. Do not invent a reply field. Do not voice the figure.",
      },
      {
        id: "world-sim-operator-booth-event-8",
        title: "Session end",
        kind: "provocation",
        pitch:
          "Hit one minute on the timer with the dome at full night and: world continues, session closing, no save state. Forces a clean read on how the pair leaves the world.",
        beat: "The console's timer reads one minute. The dome shows the seeded continent at full night. A small line at the bottom reads: world continues, session closing, no save state. Both step-away buttons are still glowing softly.",
        directorBeat:
          "The session is closing on a world that will keep going. Press step-away cleanly, leave a small last action, log out quietly with your date, or sit through the minute. Pick how you leave. Do not voice the console.",
      },
      {
        id: "world-sim-operator-booth-event-9",
        title: "Storm front",
        kind: "provocation",
        pitch:
          "Spawn a dark cell over the coastal town with the population ticking down by two and the slider still at fair. Forces a clean physical answer.",
        beat: "On the dome, a dark cell rolls in over the coastal town from the south. The wind reading on the console climbs and the population panel ticks down by two. The weather slider is still at fair on the console side.",
        directorBeat:
          "Something bad is happening to real people in your dome. Push weather to clear, ride the storm out and watch, press step-away, or ask your date what they want to do. The world will not pause. Move.",
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
