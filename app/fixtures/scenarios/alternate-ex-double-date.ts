import type { DateScenario } from "../../domain/game";

export const alternateExDoubleDate: DateScenario = {
  id: "alternate-ex-double-date",
  title: "Alternate Ex Double Date",
  card: {
    summary:
      "A double date with alternate-universe exes who insist they are only here for closure.",
    tags: ["cosmic", "public", "repeat_risk"],
    risk: "high",
    intimacy: "high",
    chaos: "high",
    idealFor: ["high spark pairs", "members who can hold boundaries"],
    badFor: ["jealous members", "members who need a quiet first date"],
  },
  publicBrief: {
    location: "A booth reserved under four versions of the same name",
    premise:
      "Two alternate-universe exes arrive because Cupid's reservation system recognized them as statistically relevant.",
    whatBothCharactersKnow:
      "The exes are not canonical partners in this timeline. They are still annoying.",
    openingSituation:
      "The pair sits down. Two strangers who look emotionally familiar wave from the next booth.",
  },
  director: {
    tone: "socially crowded and emotionally specific",
    rules: [
      "Keep the exes as pressure, not full participants.",
      "Do not invent real past relationships for members unless memory already supports it.",
      "Focus on how the pair handles comparison.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "Wrong toast",
        event: "An alternate ex offers a toast to a relationship that never happened here.",
        characterVisibleText:
          "The next booth raises a glass: to closure, even when closure has the wrong address.",
        directorInstruction: "Invite boundary setting or curiosity from the active pair.",
      },
      {
        atTurn: 14,
        title: "Shared dessert dispute",
        event: "The exes order dessert for the table and claim everyone always liked it.",
        characterVisibleText: "A dessert arrives with four spoons and too much confidence.",
        directorInstruction: "Use a mundane choice to surface autonomy.",
      },
      {
        atTurn: 24,
        title: "Exit offer",
        event: "The exes offer to leave if the pair can say what they want from tonight.",
        characterVisibleText:
          "The alternate exes stand up and ask for one clear sentence before they go.",
        directorInstruction: "Push for a concise desire or a refusal to perform.",
      },
    ],
    earlyEndTriggers: [
      "A member feels triangulated by Cupid.",
      "A member starts arguing with an ex instead of speaking to the date.",
    ],
    repeatBehavior:
      "If repeated, the exes recognize the pair and bring up only public prior outcomes from this scenario.",
  },
  judgeRubric: {
    successSignals: [
      "The pair sets boundaries together.",
      "A member chooses the present date over comparison.",
    ],
    failureSignals: [
      "The pair lets the exes define the conversation.",
      "A member uses alternate history to avoid current honesty.",
    ],
    statFocus: ["chemistry", "conflict", "stability"],
  },
};
