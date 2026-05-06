import type { DateScenario } from "../../domain/game";

export const executiveLunchOneAgendaItem: DateScenario = {
  id: "executive-lunch-one-agenda-item",
  title: "Executive Lunch, One Agenda Item",
  card: {
    summary:
      "A quiet business lunch where competence counts as flirting and the server respects calendars.",
    tags: ["career", "food", "low_pressure"],
    risk: "low",
    intimacy: "low",
    chaos: "low",
    idealFor: [
      "members who relax around clear agendas",
      "career-focused members",
      "pairs that treat punctuality as care",
    ],
    badFor: [
      "members who need spectacle",
      "members who resent calendar language",
      "pairs that need a softer room",
    ],
  },
  publicBrief: {
    location: "Table 12 at Mercer Grill, weekday lunch service",
    premise:
      "Cupid booked a sixty minute lunch with one printed agenda item: determine whether this is worth a second meeting.",
    whatBothCharactersKnow:
      "The reservation starts on time, the menu is concise, and the server has already noticed who arrived first.",
    openingSituation:
      "Both members sit down as the server places one menu and one blank agenda card between them.",
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
        atTurn: 6,
        title: "Agenda card",
        event: "The blank agenda card asks for one topic neither member wants to waste.",
        characterVisibleText:
          "The card reads: one agenda item, please. The pen is too expensive for this restaurant.",
        directorInstruction: "Let the next speaker name a real topic or admit they need a minute.",
      },
      {
        atTurn: 16,
        title: "Server check",
        event: "The server asks whether the table needs more time or a decision.",
        characterVisibleText:
          "The server pauses with professional neutrality. More time is available, but not infinite.",
        directorInstruction:
          "Use the interruption to test decisiveness without rewarding dominance.",
      },
      {
        atTurn: 26,
        title: "Calendar hold",
        event: "The check arrives with a tentative second hold penciled on the receipt.",
        characterVisibleText:
          "The receipt includes a small line: tentative hold, next Wednesday, 12:30.",
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
