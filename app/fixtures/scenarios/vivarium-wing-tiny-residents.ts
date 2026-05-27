import type { DateScenario } from "../../domain/game";

export const vivariumWingTinyResidents: DateScenario = {
  id: "vivarium-wing-tiny-residents",
  title: "Small World",
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
    flow: "pressure",
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
        pitch:
          "Light the apartment-block windows at dinner hour with a small figure carrying a plate and a dog under a table. Surfaces small domestic detail without forcing a story.",
        beat: "Inside case six, the apartment block at one-twentieth scale has its windows on at the dinner hour. A small figure carries a plate from one room to another. A small dog moves under a table. A miniature street lamp clicks on at the corner.",
        directorBeat:
          "An ordinary evening is happening at one-twentieth scale beside you. Comment quietly to your date, watch in silence, or step closer. Do not voice the residents.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-2",
        title: "House rules",
        kind: "reveal",
        pitch:
          "Plant a waist-high placard listing the wing's real rules. Surfaces a real bar without forcing perfect compliance.",
        beat: "A placard at waist height between the cases lists the wing's rules. The lines read: do not tap, do not feed, do not speak above a whisper, do not name residents, please do not photograph faces.",
        directorBeat:
          "The rules are right there. Read them aloud, lower your voice if you have not, comment on the no-naming rule to your date, or nod and walk past. Do not voice the placard.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-3",
        title: "Farming village",
        kind: "ambient",
        pitch:
          "Run a small farming village at evening chores with a barn door open and a child-figure pausing to look at a small dog. Surfaces a small life that does not need interpretation.",
        beat: "Across the aisle in case seven, a farming village at one-twentieth scale is at evening chores. A small barn door is open. A small figure walks a small bucket toward a small well. A child-sized figure runs, stops, and looks at a small dog.",
        directorBeat:
          "A village evening is doing its ordinary work next to you. Watch for a beat, share a quiet line with your date, or move on quietly. Do not voice the villagers.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-4",
        title: "Tiny dating app",
        kind: "reveal",
        pitch:
          "Show a small figure holding a tiny recognizable dating app screen and swiping once. Surfaces whether the pair laughs, sits with it, or feels seen.",
        beat: "Inside one apartment in case six, a small figure holds a tiny phone. The screen shows a small dating profile. The interface is recognizable. The figure swipes once and sets the phone down.",
        directorBeat:
          "You just watched a tiny version of what you are doing. Laugh quietly with your date, sit with the parallel, comment on the swipe, or look away. Speak from what you already carry. Do not voice the figure.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-5",
        title: "Glass close",
        kind: "provocation",
        pitch:
          "Bring the walkway close enough to tap the chest-height glass with a smudge below a window where a figure is reading. Forces a real choice on the rule.",
        beat: "The walkway brings them close to case six. The glass is at chest height. A small smudge from a previous visitor is on the glass, just below a window where a small figure is reading. The placard rule is in the periphery.",
        directorBeat:
          "Your hand can reach the glass. Refuse the tap aloud, step back from the case, comment to your date on the smudge, or honor the rule without naming it. Pick. Do not voice the figure.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-6",
        title: "Small loss",
        kind: "ambient",
        pitch:
          "Pass a small six-figure funeral procession with a single bell ring inside the village habitat. Surfaces a small grief that does not invent a reason.",
        beat: "Across the aisle, a small funeral procession passes between two small houses in case seven. The procession is six figures long. A small bell is rung once. The day has continued in the rest of the village.",
        directorBeat:
          "A small loss is moving through the village. Lower your voice, glance and look away, take your date's hand quietly, or stay still. Do not invent a reason. Do not voice the procession.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-7",
        title: "Snack pouch",
        kind: "provocation",
        pitch:
          "Surface a museum-lobby visitor-snack pouch in a coat pocket with one peanut and a hatch on the case lid within arm's reach. Forces a real choice on the rule.",
        beat: "A small vending pouch from the museum lobby is in a coat pocket. The pouch is labeled visitor snack and contains a single peanut. A line at the bottom of the label reads: not for the residents. The lid of case six has a small access hatch on its top edge.",
        directorBeat:
          "A test of the rule is in your pocket. Keep the peanut to yourself, comment on the hatch to your date, refuse the temptation aloud, or pocket the pouch deeper. Be visible about the call. Do not voice the snack pouch.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-8",
        title: "Closing chime",
        kind: "provocation",
        pitch:
          "Sound a soft closing chime in the wing with the apartment block still at dinner hour and the walkway behind them empty. Forces a clean exit.",
        beat: "A soft chime passes through the wing speaker. The placards near the exit light up dimly. The apartment block windows are still on the dinner hour. The walkway behind them is empty.",
        directorBeat:
          "The wing is closing on you. Walk out the way you came, propose a last quiet look with your date, or stand a beat longer. Show whether the visit cost or gave you something.",
      },
      {
        id: "vivarium-wing-tiny-residents-event-9",
        title: "Resident at the window",
        kind: "reveal",
        pitch:
          "Sit a small figure reading at a window facing the walkway, unaware of being seen. Surfaces what either carries about being witnessed without consent.",
        beat: "In case six, a small figure sits at the window facing the walkway. They are reading a small book. The small dog is on the rug at their feet. The figure cannot see out and is not aware of being seen.",
        directorBeat:
          "A private moment is right in front of you. Step out of the window's line, sit with the asymmetry, comment quietly to your date about being watched without consent, or look away. Speak only from your own register. Do not voice the figure.",
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
