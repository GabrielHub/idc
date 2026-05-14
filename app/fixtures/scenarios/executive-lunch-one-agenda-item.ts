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
        event: "The blank agenda card waits between them.",
        characterVisibleText:
          "The card on the table reads: one agenda item, please. The pen is too expensive for this restaurant.",
        directorInstruction:
          "Let the next speaker name a real topic or admit they need a minute. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-2",
        title: "Water refill",
        kind: "ambient",
        event: "The server stops to refill water and steps back without speaking.",
        characterVisibleText:
          "Water fills both glasses to the rim. The server lingers a second longer than expected, then steps back two paces.",
        directorInstruction:
          "Use the pause to test decisiveness without rewarding dominance. The server does not speak.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-3",
        title: "Calendar hold",
        kind: "provocation",
        event: "The check arrives with a tentative second hold penciled on the receipt.",
        characterVisibleText:
          "The receipt slides onto the table. A small line at the bottom reads: tentative hold, next Wednesday, 12:30.",
        directorInstruction:
          "Push the pair to accept, decline, or revise the hold with adult clarity. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-4",
        title: "Bread basket",
        kind: "reveal",
        event: "A small bread basket arrives without being asked for.",
        characterVisibleText:
          "A small bread basket lands on the table. Two crisp slices of focaccia, a pat of cold butter, and a folded linen napkin. The basket is the kind that disappears if neither person eats from it.",
        directorInstruction:
          "Use the quiet hospitality to surface ease or the inability to accept ease.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-5",
        title: "Sommelier pass",
        kind: "ambient",
        event: "The sommelier pauses near the table with a list and moves on.",
        characterVisibleText:
          "The sommelier reads the table for half a breath, holds the wine list against his arm, and moves to the next two-top. The agenda card has not moved. The pen has not been picked up.",
        directorInstruction:
          "Let the missed offer go unmentioned. The next sentence is the agenda item. The sommelier does not speak.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-6",
        title: "One vibration",
        kind: "provocation",
        event: "One phone on the table vibrates once.",
        characterVisibleText:
          "One phone on the corner of the table vibrates once and stops. The screen shows nothing visible. The other phone is in a coat draped over the chair.",
        directorInstruction:
          "Use the small interruption to test how the addressee handles a calendar trespass at lunch.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-7",
        title: "Plates clear",
        kind: "ambient",
        event: "Plates are cleared in one quiet pass.",
        characterVisibleText:
          "A server clears both plates in one efficient pass. Crumbs are swept off the cloth with a small folder. The pen on the agenda card has not moved.",
        directorInstruction:
          "Let the table be as clean as the question. The agenda card is now visible from any angle. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-8",
        title: "Next reservation",
        kind: "provocation",
        event: "The host walks past with a tablet showing the table's next seating.",
        characterVisibleText:
          "The host walks past with a small tablet. The screen shows table 12 has a 1:30 reservation under another last name. The host does not stop to mention it.",
        directorInstruction:
          "Push for a clear close. Lunch will end on time whether the date does or not. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "executive-lunch-one-agenda-item-event-9",
        title: "Pen ink test",
        kind: "reveal",
        event: "The expensive pen rolls into reach with a small ink mark already on the cap.",
        characterVisibleText:
          "The pen rolls a quarter inch toward whichever speaker has the lighter touch. A small ink mark on the cap is in the same color as the calendar hold line on the receipt.",
        directorInstruction:
          "Use the small invitation to surface what either of them already wants from the second meeting. Draw on existing register, not new biography.",
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
