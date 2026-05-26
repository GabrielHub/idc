import type { DateScenario } from "../../domain/game";

export const executiveLunchOneAgendaItem: DateScenario = {
  id: "executive-lunch-one-agenda-item",
  title: "Executive Lunch, One Agenda Item",
  card: {
    summary:
      "A quiet business lunch where competence counts as flirting and the room respects calendars.",
    tags: ["career", "food", "low_pressure"],
    risk: "low",
    intimacy: "low",
    chaos: "low",
    cost: 10,
    idealFor: [
      "members whose business lunch register fits a printed agenda card",
      "members whose negotiation pitch voice belongs at a meeting that is not a meeting",
      "members who treat a tentative second hold as romantic",
      "members whose Term language reads a receipt as a Renewal draft",
    ],
    badFor: [
      "members who will read the agenda card as a Pact and try to sign it in soup",
      "members who cannot perform for a calendar and will film the pen instead",
      "members whose anxious spiral has no breathing room inside sixty minutes",
    ],
  },
  publicBrief: {
    location: "Table 12 at Mercer Grill, weekday lunch service",
    premise:
      "Cupid booked a sixty minute lunch with one printed agenda item: determine whether this is worth a second meeting.",
    whatBothCharactersKnow:
      "The reservation starts on time, the menu is concise, and a blank agenda card is already on the table.",
    openingSituation:
      "Both members sit down. One menu and one blank agenda card sit between them. A pen rests on the card.",
  },
  director: {
    tone: "polished, punctual, low volume, with quiet silverware and controlled lighting",
    rules: [
      "Let professionalism read as intimacy for members who value competence.",
      "Keep the room efficient without turning the date into a meeting.",
      "Use the agenda card to invite directness, not performance.",
    ],
    events: [
      {
        id: "executive-lunch-one-agenda-item-event-1",
        title: "Agenda card",
        kind: "reveal",
        pitch:
          "Land the printed agenda card asking for one topic with the expensive pen on top. Forces a real topic or an honest admission that one is not ready.",
        beat: "The card on the table reads: one agenda item, please. The pen is too expensive for this restaurant.",
        directorBeat:
          "The card is asking for a topic. Name it out loud, say you need a minute, ask your date to go first, or set the pen back down. Take a stance. Do not voice the card.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-2",
        title: "Water refill",
        kind: "ambient",
        pitch:
          "Refill both glasses and have the server linger half a beat longer than expected. Surfaces decisiveness without rewarding dominance.",
        beat: "Water fills both glasses to the rim. The server lingers a second longer than expected, then steps back two paces.",
        directorBeat:
          "Someone is waiting on you without asking. Order, send them off with a thank you, glance at your date for a cue, or sit with the linger. Make the small decision visible. Do not voice the server.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-3",
        title: "Calendar hold",
        kind: "provocation",
        pitch:
          "Slide the receipt onto the table with a penciled tentative hold for next Wednesday at twelve thirty. Forces an adult call on accepting, declining, or revising the hold.",
        beat: "The receipt slides onto the table. A small line at the bottom reads: tentative hold, next Wednesday, 12:30.",
        directorBeat:
          "A second meeting is being offered. Accept it on the receipt, decline cleanly, propose a different day, or say you need to check. Speak directly. Do not voice the receipt.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-4",
        title: "Bread basket",
        kind: "reveal",
        pitch:
          "Land a small bread basket the table did not order. Surfaces ease or the inability to accept ease.",
        beat: "A small bread basket lands on the table. Two crisp slices of focaccia, a pat of cold butter, and a folded linen napkin. The basket is the kind that disappears if neither person eats from it.",
        directorBeat:
          "A small gift just landed. Pick a slice, push it toward your date, decline aloud, or comment on the timing. Show whether you can accept ease.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-5",
        title: "Sommelier pass",
        kind: "ambient",
        pitch:
          "Drift the sommelier past the table with the wine list held against his arm. Surfaces whether either lets the missed offer go.",
        beat: "The sommelier reads the table for half a breath, holds the wine list against his arm, and moves to the next two-top. The agenda card has not moved. The pen has not been picked up.",
        directorBeat:
          "He almost stopped and did not. Let it go and stay with the agenda, comment on the read, ask your date if they want wine, or flag him back. Speak from your actual register. Do not voice the sommelier.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-6",
        title: "One vibration",
        kind: "provocation",
        pitch:
          "Vibrate one phone on the table corner once and stop. Forces a stance on calendar trespass at lunch.",
        beat: "One phone on the corner of the table vibrates once and stops. The screen shows nothing visible. The other phone is in a coat draped over the chair.",
        directorBeat:
          "Someone outside the room just reached for your time. Flip the phone face down, glance at the screen, comment to your date about boundaries, or ignore it entirely. Make the call clean.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-7",
        title: "Plates clear",
        kind: "ambient",
        pitch:
          "Sweep the plates and crumbs cleanly in one pass. Surfaces whether the agenda card now reads as the obvious next move.",
        beat: "A server clears both plates in one efficient pass. Crumbs are swept off the cloth with a small folder. The pen on the agenda card has not moved.",
        directorBeat:
          "The table is empty of food and the card is in plain sight. Pick up the pen, restate the topic, ask your date for theirs, or look at the time. Use the cleared space. Do not voice the card.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-8",
        title: "Next reservation",
        kind: "provocation",
        pitch:
          "Walk the host past with a tablet showing table twelve is booked at one-thirty. Forces a clear close.",
        beat: "The host walks past with a small tablet. The screen shows table 12 has a 1:30 reservation under another last name. The host does not stop to mention it.",
        directorBeat:
          "Your table has a clock on it now. Settle the second hold, propose a clean close, ask your date one final question, or stand. Lunch ends on time whether the date does or not. Do not voice the host.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-9",
        title: "Pen ink test",
        kind: "reveal",
        pitch:
          "Roll the pen toward the lighter-touch speaker with an ink mark matching the calendar hold line. Surfaces what either already wants from a second meeting.",
        beat: "The pen rolls a quarter inch toward whichever speaker has the lighter touch. A small ink mark on the cap is in the same color as the calendar hold line on the receipt.",
        directorBeat:
          "The pen has been invited toward someone. Pick it up and sign the hold, hand it to your date, write a counter-offer, or set it back. Speak from what you already want, not new biography.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the other as staff.",
      "A member uses business language to dodge every personal question.",
    ],
    repeatBehavior:
      "If repeated, the restaurant remembers the pair's prior table only as reservation history. The agenda item should change.",
  },
  judgeRubric: {
    successSignals: [
      "The pair uses structure to make room for honesty.",
      "A member treats punctuality and clarity as care instead of control.",
    ],
    failureSignals: [
      "A member turns the date into a performance review.",
      "The pair hides behind logistics until lunch ends.",
    ],
    statFocus: ["trust", "stability", "chemistry"],
  },
};
