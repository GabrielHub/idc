import type { DateScenario } from "../../domain/game";

export const impossibleLostAndFound: DateScenario = {
  id: "impossible-lost-and-found",
  title: "Things You Haven't Lost Yet",
  card: {
    summary:
      "A municipal lost-and-found returns objects the pair has not lost yet. The window has no clerk tonight.",
    tags: ["temporal", "cosmic", "repeat_risk"],
    risk: "medium",
    intimacy: "medium",
    chaos: "high",
    cost: 15,
    idealFor: [
      "members who treat a future bin as a kindness, not a command",
      "members who can read a claim ticket aloud and still decline what is offered",
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
    flow: "set_piece",
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
        kind: "reveal",
        pitch:
          "Surface a clear-bagged future item with a label that hedges: claimed shortly, probably. Forces a stance on whether to take the hint, reject it, or ask the partner.",
        beat: "The first item is sealed in a clear bag. The label reads: claimed shortly, probably. The bin's other compartment is still closed.",
        directorBeat:
          "Something the office thinks you will lose is in front of you. Take the bag, refuse it aloud, ask your date what they see, or read the label without committing. Draw only from what you already carry. Do not voice the label.",
      },
      {
        id: "impossible-lost-and-found-event-2",
        title: "Almost yours bin",
        kind: "reveal",
        pitch:
          "Roll in a second bin labeled almost yours with the rest smudged. Surfaces patience and partnership over prophecy.",
        beat: "A second bin rolls itself onto the counter. The label reads almost yours and the rest of the line is smudged.",
        directorBeat:
          "The label is hedging on you. Ask your date what they read into it, comment on the smudge, refuse to interpret, or wait for the next bin. Stay curious without making it a verdict. Do not voice the label.",
      },
      {
        id: "impossible-lost-and-found-event-3",
        title: "Claim ticket",
        kind: "provocation",
        pitch:
          "Print a claim ticket with one box: leave it lost. Forces a clean call together or pointedly apart.",
        beat: "A claim ticket prints from the counter slot. It has one unchecked box: leave it lost. A pen sits beside the slot.",
        directorBeat:
          "The office is asking for a choice with a box. Check it together, refuse to check it, ask your date which they want, or sign without checking. Make the decision visible. Do not voice the ticket.",
      },
      {
        id: "impossible-lost-and-found-event-4",
        title: "Tube flicker",
        kind: "ambient",
        pitch:
          "Flicker the fluorescent tube and stop the conveyor. Surfaces patience without asking the pair to fix the room.",
        beat: "The buzzing fluorescent tube above window B flickers and steadies. The conveyor stops. A second tube down the hall is dimmer than it should be.",
        directorBeat:
          "The room just twitched. Notice it, ask your date if they are okay being here, comment on the dim hallway, or stay focused on the counter. Do not try to fix it.",
      },
      {
        id: "impossible-lost-and-found-event-5",
        title: "Third bin",
        kind: "reveal",
        pitch:
          "Roll in a third bin with one object and a label: not yours. Honor it. Surfaces a real refusal that should not be renegotiated.",
        beat: "A third bin rolls itself onto the counter. One object sits inside under a clear lid. The label tape reads: not yours. Honor it.",
        directorBeat:
          "The office is telling you to leave one alone. Step back from the lid, comment on the line to your date, walk away from this bin, or ignore the instruction. Be visible about the refusal or the choice to ignore it. Do not voice the tape.",
      },
      {
        id: "impossible-lost-and-found-event-6",
        title: "Receipt stack",
        kind: "ambient",
        pitch:
          "Pile unread receipts beside the slot with the top one filed at 8:04 PM expected tonight. Surfaces whether the pair feels obligated to read every page.",
        beat: "A small stack of unread receipts collects beside the slot. The top one reads: filed at 8:04 p.m., expected to be claimed by you tonight.",
        directorBeat:
          "Bureaucracy is piling up at your elbow. Read the top receipt aloud, ignore the stack, ask your date if they want to look, or pocket one. Do not feel obligated to read every page. Do not voice the receipts.",
      },
      {
        id: "impossible-lost-and-found-event-7",
        title: "Buzzer hush",
        kind: "provocation",
        pitch:
          "Silence the service buzzer and restart the conveyor on its own. Forces a real exchange between the two of you in the absence.",
        beat: "The service buzzer above the counter, which had been chirping intermittently, goes silent. The chair behind the window stays empty. The conveyor restarts on its own.",
        directorBeat:
          "The room just relaxed. Ask the real question while the room is quiet, comment on the empty chair, propose what you want to do with the rest of the night, or sit with the calm. Speak the honest thing.",
      },
      {
        id: "impossible-lost-and-found-event-8",
        title: "Approved seal",
        kind: "provocation",
        pitch:
          "Drop a new clear lid stamped approved in small green type with the pen on top. Forces one clean choice: claim, leave, or sign together.",
        beat: "A new clear lid drops onto the counter with the word approved printed in small green type. The previous bin is closed. The pen is now on top of the lid.",
        directorBeat:
          "Something just got approved without you. Pick up the pen, sign together, refuse to sign, or leave the lid where it is. Do not stall.",
      },
      {
        id: "impossible-lost-and-found-event-9",
        title: "Conveyor idles",
        kind: "ambient",
        pitch:
          "Run the conveyor at half speed empty under the window. Surfaces whether the pair lets the slow loop pass without fixing it.",
        beat: "The conveyor under window B runs at half speed. No new bin is on it. The hum settles into the floor at chest height.",
        directorBeat:
          "The office is between movements. Sit with the half-speed hum, comment to your date, or use the idle to ask one more honest question. Do not try to fix the loop.",
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
