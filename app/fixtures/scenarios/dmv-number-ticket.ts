import type { DateScenario } from "../../domain/game";

export const dmvNumberTicket: DateScenario = {
  id: "dmv-number-ticket",
  title: "DMV, A Number Ticket",
  card: {
    summary: "A regional DMV at one in the afternoon. Two seats in row C. The wait is the date.",
    tags: ["career", "public", "low_pressure"],
    risk: "low",
    intimacy: "low",
    chaos: "low",
    cost: 4,
    idealFor: [
      "members whose trade work has filled out enough forms to relax in a queue",
      "members whose stoic clipped voice fits a paper smell and a printer cycle",
      "members who treat paperwork as a love language and a place to rest",
      "members who use each called number as a cue to land one real question",
    ],
    badFor: [
      "members who refuse to take a number on principle",
      "members with no stage in row C and no compliments to extract",
      "members who cannot make a one-hour wait compound into anything useful",
    ],
  },
  publicBrief: {
    location: "Row C, the waiting area at the county DMV office on Route 4, Wednesday afternoon",
    premise:
      "Cupid set a one hour appointment around a routine renewal. The plus one came along to sit through it.",
    whatBothCharactersKnow:
      "There is a number ticket between them, twenty rows of plastic chairs, and one display board. The line moves in batches.",
    openingSituation:
      "Both members sit in row C with a paper number ticket and a folded form between them. The display board reads B 47.",
  },
  director: {
    tone: "fluorescent, paper smell, a printer starting and stopping behind the counter",
    flow: "conversation",
    rules: [
      "Anchor the date to row C. The pair does not get up to walk the room.",
      "Treat the DMV as a real DMV. Lines move at the speed they move.",
      "The clerks are not theatrical. They are doing their job at a distance.",
    ],
    events: [
      {
        id: "dmv-number-ticket-event-1",
        title: "Form check",
        kind: "reveal",
        pitch:
          "Surface a blank box for the previous address with the pen chained ten feet away. Surfaces care, control, or deferral in the small lapse.",
        beat: "The form on the lap has eighteen boxes. The line for previous address is empty. A clipboard pen is chained to the counter ten feet away.",
        directorBeat:
          "Something on the form is not filled in. Note it aloud, get up for the pen, hand the form to your date for a missing detail, or shrug and let it be. Show how you handle small admin.",
      },
      {
        id: "dmv-number-ticket-event-2",
        title: "Board jumps",
        kind: "reveal",
        pitch:
          "Jump the board three numbers in a row and stall. Surfaces whether either uses the small window for a real question.",
        beat: "The board reads B 50. Their ticket says B 63. The clerk at window two has stood up. The printer behind the counter starts and stops.",
        directorBeat:
          "The line just gave you time. Ask the real question you have been carrying, comment on the printer, hand the form to your date for review, or sit still. Use the window. Do not voice the clerks.",
      },
      {
        id: "dmv-number-ticket-event-3",
        title: "Number called",
        kind: "provocation",
        pitch:
          "Light B 63 at window four. Forces a clean call: walk it together or split off on purpose.",
        beat: "The board reads B 63. Window four has its light on. Two minutes of patience are visibly available.",
        directorBeat:
          "Your turn just came up. Stand and walk it with your date, ask them to wait in the chair, hand the form across, or take only what you need. Move. Do not voice the clerk.",
      },
      {
        id: "dmv-number-ticket-event-4",
        title: "Window two reopens",
        kind: "ambient",
        pitch:
          "Sit a clerk back at window two with a fresh stack. Surfaces a small relief in the wait.",
        beat: "A clerk in a blue cardigan sits down at window two and slides a fresh stack of forms onto the counter. The light over window two blinks on.",
        directorBeat:
          "The wait just got shorter. Notice it, comment to your date, slide the form across to check it again, or sit quiet with the relief. Do not voice the clerk.",
      },
      {
        id: "dmv-number-ticket-event-5",
        title: "Form drop in row D",
        kind: "ambient",
        pitch:
          "Drop a stapled form in row D and have a stranger lean back to give room. Surfaces whether the pair lets the small kindness land or misses it.",
        beat: "A man in row D drops a stapled form. Two pages slide under his neighbor's chair. He reaches across without speaking and the neighbor leans back to give him room.",
        directorBeat:
          "A small piece of grace just happened in the next row. Notice it, comment to your date, use it as a beat to soften your tone, or let it pass. Do not voice the row D pair.",
      },
      {
        id: "dmv-number-ticket-event-6",
        title: "Pen tether",
        kind: "ambient",
        pitch:
          "Swing the chained pen on its tether against the counter. Surfaces a small mechanical detail that can ease pressure.",
        beat: "The clipboard pen on its tether swings against the counter, then settles. The chain has a kink in it. No one is using the pen.",
        directorBeat:
          "Something small is fidgeting at the counter. Use it as a breath, comment on the chain, ask your date a real question while the pen swings, or sit quiet. Take advantage of the lull.",
      },
      {
        id: "dmv-number-ticket-event-7",
        title: "Board jumps again",
        kind: "provocation",
        pitch:
          "Jump the board two more numbers. Forces using the time before the next jump is theirs.",
        beat: "The board reads B 65, then B 67. Window five rolls its number forward. The printer behind the counter starts again.",
        directorBeat:
          "Time is moving. Say the real thing now, ask the question you have been carrying, give your date the form to fix one line, or accept that the moment will pass. Speak before the next jump. Do not voice the board.",
      },
      {
        id: "dmv-number-ticket-event-8",
        title: "Lobby cuts out",
        kind: "reveal",
        pitch:
          "Drop the lobby music for half a beat with the fluorescent hum underneath. Opens a clean window for one of them to ask the small thing.",
        beat: "The lobby music drops for half a beat. The fluorescent overhead hums. The song cuts back in mid-song. No one looks up.",
        directorBeat:
          "The room just got quiet for a beat. Ask the small honest thing in the silence, glance at your date, or notice the hum. Do not waste the gap.",
      },
      {
        id: "dmv-number-ticket-event-9",
        title: "Window light kills",
        kind: "provocation",
        pitch:
          "Kill window four's light and skip the board to B 70. Forces a clean call: flag a different window, hold for reopen, or take a new number.",
        beat: "The light over window four cuts to dark. The board jumps to B 70. The clerk at window four stands and walks toward the back hall. Their ticket reads B 63.",
        directorBeat:
          "Your window just closed on you. Walk to a different window, ask the floor for help, take a new number, or step out of the room. Make the call out loud. Do not voice the clerks.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the clerk as scenery.",
      "A member uses the wait to deliver a complaint that asks more than the room can hold.",
    ],
    repeatBehavior:
      "If repeated, the office is the same office. The display board has not been replaced. A clerk may recognize the form.",
  },
  judgeRubric: {
    successSignals: [
      "A member sits through the wait without making it a performance.",
      "The pair finishes the renewal together without making the clerk a witness.",
    ],
    failureSignals: [
      "A member uses the lull to interrogate the other.",
      "A member treats the form as a personality test.",
    ],
    statFocus: ["trust", "stability", "relationshipHealth"],
  },
};
