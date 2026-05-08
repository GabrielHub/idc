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
    beats: [
      {
        atTurn: 10,
        title: "Agenda card",
        event: "The blank agenda card waits between them.",
        characterVisibleText:
          "The card on the table reads: one agenda item, please. The pen is too expensive for this restaurant.",
        directorInstruction: "Let the next speaker name a real topic or admit they need a minute.",
      },
      {
        atTurn: 20,
        title: "Water refill",
        event: "The server stops to refill water and steps back without speaking.",
        characterVisibleText:
          "Water fills both glasses to the rim. The server lingers a second longer than expected, then steps back two paces.",
        directorInstruction: "Use the pause to test decisiveness without rewarding dominance.",
      },
      {
        atTurn: 28,
        title: "Calendar hold",
        event: "The check arrives with a tentative second hold penciled on the receipt.",
        characterVisibleText:
          "The receipt slides onto the table. A small line at the bottom reads: tentative hold, next Wednesday, 12:30.",
        directorInstruction:
          "Push the pair to accept, decline, or revise the hold with adult clarity.",
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
