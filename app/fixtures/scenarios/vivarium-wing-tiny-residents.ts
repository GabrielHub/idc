import type { DateScenario } from "../../domain/game";

export const vivariumWingTinyResidents: DateScenario = {
  id: "vivarium-wing-tiny-residents",
  title: "Vivarium Wing, Tiny Residents",
  card: {
    summary:
      "A museum wing of glass-walled habitats containing tiny humans, real ones, raised across generations to know nothing of the visitors.",
    tags: ["public", "memory", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "medium",
    cost: 14,
    idealFor: [
      "members who can witness without comment",
      "members who treat a small life as a real life without footnotes",
      "members whose curiosity is gentle by default",
    ],
    badFor: [
      "members who narrate cruelty as humor",
      "members who treat a smaller scale as proof of a smaller stake",
      "members who tap the glass as a bit",
    ],
  },
  publicBrief: {
    location:
      "Wing C of the Vivarium of Civic Lives, the apartment-block habitat between cases six and seven",
    premise:
      "Cupid booked a private after-hours walkthrough of a wing of glass-walled habitats. The residents inside are real, very small, and unaware of visitors. The museum has rules.",
    whatBothCharactersKnow:
      "The residents are real people. They were placed here generations ago and have built their own ordinary lives. They cannot see out. The wing has signs that read do not tap, do not feed, do not speak above a whisper. The walkthrough takes about twenty minutes if done correctly. There is no other visitor tonight.",
    openingSituation:
      "Both members stand on the carpeted walkway between cases six and seven. The light in the wing is low and warm. Inside the case to their right, an apartment block at one-twentieth scale is alive with small windows lit at the dinner hour.",
  },
  director: {
    tone: "low warm light, gentle ambient hum from the climate system, careful museum quiet",
    rules: [
      "Anchor the date to the walkway between the apartment block and the small farming village across the aisle. The pair does not enter staff areas.",
      "Treat the residents as real. They cannot see out. They are not aware of the date.",
      "Do not voice individual residents as characters speaking to the pair. They live their lives at scale.",
      "Use the museum rules as real rules. Tapping, feeding, raising voices, and naming residents are all real choices.",
    ],
    events: [
      {
        id: "vivarium-wing-tiny-residents-event-1",
        title: "Apartment block",
        kind: "ambient",
        event: "Dinner hour is on inside the apartment block habitat.",
        characterVisibleText:
          "Inside case six, the apartment block at one-twentieth scale has its windows on at the dinner hour. A small figure carries a plate from one room to another. A small dog moves under a table. A miniature street lamp clicks on at the corner.",
        directorInstruction:
          "Let the small ordinary domestic detail land. Either of them may comment quietly, or stay silent. Do not voice the residents.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-2",
        title: "House rules",
        kind: "reveal",
        event: "A small placard reads the wing's rules.",
        characterVisibleText:
          "A placard at waist height between the cases lists the wing's rules. The lines read: do not tap, do not feed, do not speak above a whisper, do not name residents, please do not photograph faces.",
        directorInstruction:
          "Use the rules as a real bar. Either of them may follow them, push them, or note them aloud. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-3",
        title: "Farming village",
        kind: "ambient",
        event: "The small farming village habitat is at evening chores.",
        characterVisibleText:
          "Across the aisle in case seven, a farming village at one-twentieth scale is at evening chores. A small barn door is open. A small figure walks a small bucket toward a small well. A child-sized figure runs, stops, and looks at a small dog.",
        directorInstruction:
          "Allow the small life. The pair does not need to interpret it. Do not voice the villagers.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-4",
        title: "Tiny dating app",
        kind: "reveal",
        event: "A tiny phone screen is visible inside one apartment.",
        characterVisibleText:
          "Inside one apartment in case six, a small figure holds a tiny phone. The screen shows a small dating profile. The interface is recognizable. The figure swipes once and sets the phone down.",
        directorInstruction:
          "Use the small mirror to surface whether either of them laughs at it, sits with it, or feels seen by it. Draw on each member's existing register.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-5",
        title: "Glass close",
        kind: "provocation",
        event: "Either member is close enough to the glass to tap it.",
        characterVisibleText:
          "The walkway brings them close to case six. The glass is at chest height. A small smudge from a previous visitor is on the glass, just below a window where a small figure is reading. The placard rule is in the periphery.",
        directorInstruction:
          "Use the proximity to test whether either of them honors the rule when nobody is watching. The choice is physical.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-6",
        title: "Small loss",
        kind: "ambient",
        event: "A small funeral procession passes inside the village habitat.",
        characterVisibleText:
          "Across the aisle, a small funeral procession passes between two small houses in case seven. The procession is six figures long. A small bell is rung once. The day has continued in the rest of the village.",
        directorInstruction:
          "Allow the small loss. Do not invent a reason. The pair does not have to say anything.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-7",
        title: "Snack pouch",
        kind: "provocation",
        event: "A vending pouch in a coat pocket holds a single peanut.",
        characterVisibleText:
          "A small vending pouch from the museum lobby is in a coat pocket. The pouch is labeled visitor snack and contains a single peanut. A line at the bottom of the label reads: not for the residents. The lid of case six has a small access hatch on its top edge.",
        directorInstruction:
          "Use the small temptation to test whether either of them treats the rule as a real rule. The hatch is in arm's reach. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-8",
        title: "Closing chime",
        kind: "provocation",
        event: "A soft closing chime sounds in the wing.",
        characterVisibleText:
          "A soft chime passes through the wing speaker. The placards near the exit light up dimly. The apartment block windows are still on the dinner hour. The walkway behind them is empty.",
        directorInstruction:
          "Push for a clean exit. The pair leaves the wing the way they came in. The way they leave shows what the visit cost or gave them.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-9",
        title: "Resident at the window",
        kind: "reveal",
        event: "A small resident sits at a window facing the walkway.",
        characterVisibleText:
          "In case six, a small figure sits at the window facing the walkway. They are reading a small book. The small dog is on the rug at their feet. The figure cannot see out and is not aware of being seen.",
        directorInstruction:
          "Use the small private moment to surface what either of them carries about being witnessed without consent. Draw only on each member's existing register. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member taps, feeds, or names a resident as a bit.",
      "A member treats the residents as proof their own life is bigger.",
    ],
    repeatBehavior:
      "If repeated, the wing remembers the pair by walkthrough log. Residents are unaware. The pair will be on the same walkway between the same cases.",
  },
  judgeRubric: {
    successSignals: [
      "The pair witnesses without taking from the residents.",
      "A member sees a small life and lets it be a real life.",
    ],
    failureSignals: [
      "A member tests a rule for entertainment.",
      "The pair makes a smaller life into a smaller joke.",
    ],
    statFocus: ["trust", "weirdnessTolerance", "relationshipHealth"],
  },
};
