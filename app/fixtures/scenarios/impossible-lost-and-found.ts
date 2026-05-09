import type { DateScenario } from "../../domain/game";

export const impossibleLostAndFound: DateScenario = {
  id: "impossible-lost-and-found",
  title: "Impossible Lost And Found",
  card: {
    summary:
      "A municipal lost-and-found returns objects the pair has not lost yet. The window has no clerk tonight.",
    tags: ["temporal", "cosmic", "repeat_risk"],
    risk: "medium",
    intimacy: "medium",
    chaos: "high",
    idealFor: [
      "members who treat a future bin as a kindness, not a command",
      "members who can name the bin a Bargain and read its terms aloud",
      "members who can audit a claim ticket without renegotiating it",
    ],
    badFor: [
      "members whose prophecy aversion is sharp enough to walk on the first hint",
      "members who refuse ownership without a contract on file",
      "members who short any system the moment it claims to know them",
    ],
  },
  publicBrief: {
    location: "Window B at the city lost-and-found office that is not on the directory",
    premise:
      "Cupid received a claim ticket for two items the pair will apparently lose later tonight. The window is unmanned tonight; bins arrive on the conveyor on their own.",
    whatBothCharactersKnow:
      "The office returns future lost items as a courtesy. Accepting an item does not require accepting its meaning. Tonight there is no clerk, just the bins and the printer.",
    openingSituation:
      "A gray bin slides up to the counter on a small conveyor. Two items sit inside, each tagged. The chair behind the window is empty.",
  },
  director: {
    tone: "municipal, uncanny, automated, with one buzzing fluorescent tube",
    rules: [
      "Keep future objects suggestive, not deterministic.",
      "Do not invent major life events or secrets.",
      "Use each object to ask what the member chooses now.",
      "Never voice the office. The room is automated tonight.",
    ],
    events: [
      {
        id: "impossible-lost-and-found-event-1",
        title: "First item",
        event: "The first object sits in a clear bag on top of the bin.",
        characterVisibleText:
          "The first item is sealed in a clear bag. The label reads: claimed shortly, probably. The bin's other compartment is still closed.",
        directorInstruction:
          "Let the affected member decide whether to take the hint, reject it, or ask the partner what they see.",
      },
      {
        id: "impossible-lost-and-found-event-2",
        title: "Almost yours bin",
        event: "A second bin rolls into the window.",
        characterVisibleText:
          "A second bin rolls itself onto the counter. The label reads almost yours and the rest of the line is smudged.",
        directorInstruction:
          "Use uncertainty to test patience and partnership instead of prophecy.",
      },
      {
        id: "impossible-lost-and-found-event-3",
        title: "Claim ticket",
        event: "A claim ticket prints from the slot.",
        characterVisibleText:
          "A claim ticket prints from the counter slot. It has one unchecked box: leave it lost. A pen sits beside the slot.",
        directorInstruction: "Push the pair toward choosing together or clearly choosing apart.",
      },
      {
        id: "impossible-lost-and-found-event-4",
        title: "Tube flicker",
        event: "The buzzing fluorescent tube above the counter flickers.",
        characterVisibleText:
          "The buzzing fluorescent tube above window B flickers and steadies. The conveyor stops. A second tube down the hall is dimmer than it should be.",
        directorInstruction:
          "Use the small instability to test patience. The room is not asking for a fix.",
      },
      {
        id: "impossible-lost-and-found-event-5",
        title: "Third bin",
        event: "A third bin rolls in with a single object inside.",
        characterVisibleText:
          "A third bin rolls itself onto the counter. One object sits inside under a clear lid. The label tape reads: not yours. Honor it.",
        directorInstruction: "Allow the refusal as a real refusal. Do not negotiate it open.",
      },
      {
        id: "impossible-lost-and-found-event-6",
        title: "Receipt stack",
        event: "Unread receipts pile beside the slot.",
        characterVisibleText:
          "A small stack of unread receipts collects beside the slot. The top one reads: filed at 8:04 p.m., expected to be claimed by you tonight.",
        directorInstruction:
          "Let the small bureaucracy hum. The pair is not required to read every page.",
      },
      {
        id: "impossible-lost-and-found-event-7",
        title: "Buzzer hush",
        event: "The service buzzer briefly goes silent.",
        characterVisibleText:
          "The service buzzer above the counter, which had been chirping intermittently, goes silent. The chair behind the window stays empty. The conveyor restarts on its own.",
        directorInstruction: "Use the absence to push for a real exchange between the two of them.",
      },
      {
        id: "impossible-lost-and-found-event-8",
        title: "Approved seal",
        event: "A clear lid prints itself with the word approved.",
        characterVisibleText:
          "A new clear lid drops onto the counter with the word approved printed in small green type. The previous bin is closed. The pen is now on top of the lid.",
        directorInstruction: "Push for one clean choice: claim, leave, or sign together.",
      },
    ],
    earlyEndTriggers: [
      "A member treats a future hint as a command.",
      "A member uses the lost item to corner the other into a promised outcome.",
    ],
    repeatBehavior:
      "If repeated, the office recognizes the pair by claim number. Items may reference prior public choices, not private futures.",
  },
  judgeRubric: {
    successSignals: [
      "The pair treats future hints as choices, not orders.",
      "A member stays curious without making the partner explain the impossible.",
    ],
    failureSignals: [
      "A member weaponizes the object as destiny.",
      "The pair argues about mechanics and avoids the choice in front of them.",
    ],
    statFocus: ["weirdnessTolerance", "trust", "stability"],
  },
};
