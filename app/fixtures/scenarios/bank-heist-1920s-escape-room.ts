import type { DateScenario } from "../../domain/game";

export const bankHeist1920sEscapeRoom: DateScenario = {
  id: "bank-heist-1920s-escape-room",
  title: "The Cash Is Real",
  card: {
    summary:
      "An inter-dimensional escape room drops the pair into a real 1923 earth bank during business hours. Crack the vault by closing. A booked prize is in the back row. The cash is real.",
    tags: ["temporal", "career", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "high",
    cost: 21,
    idealFor: [
      "members who can run a clock with a partner without renegotiating it",
      "members who can pick the booked prize and leave the cash",
      "members who can coordinate without bossing",
    ],
    badFor: [
      "members who treat the partner as the obstacle in a heist",
      "members who want the cash and use the prize to justify it",
      "members who freeze near a counter and pretend the clock did not move",
    ],
  },
  publicBrief: {
    location:
      "Lobby and vault, First Trust Bank, 1923 earth instance, inter-dimensional escape room booking",
    premise:
      "Cupid booked an inter-dimensional escape room. The vendor drops the pair into a real 1923 bank during business hours. Crack the vault by closing. The escape room recalls the pair at the bell either way.",
    whatBothCharactersKnow:
      "The bank is real. The tellers and bank-goers in the lobby are real and do not address the pair. The vault is real and the booked prize box is in the back row of the vault. The cash is real. Closing bell rings at four. A clock on the lobby wall is accurate. The escape room company recalls the pair at the bell whether or not they have the prize.",
    openingSituation:
      "Both members are in the lobby. The lobby is mid-afternoon and the clock reads three twenty-seven. A teller stamps a deposit at the counter. An older man folds a newspaper at a side bench. The vault door is at the back through a small archway.",
  },
  director: {
    tone: "the wood floor of a 1923 lobby, the tick of the wall clock, the murmur of low business, the slow pull of a ceiling fan",
    rules: [
      "Anchor the date to the lobby and the vault archway. The pair does not leave the bank.",
      "Treat tellers and bank-goers as background. They do not address the pair and are not voiced as continuing speakers.",
      "Use the clock as the pressure. Closing bell rings at four.",
      "Treat the cash as real. The booked prize is the booking; the cash is a separate choice with weight.",
    ],
    events: [
      {
        id: "bank-heist-1920s-escape-room-event-1",
        title: "Lobby clock",
        kind: "reveal",
        event: "The lobby clock reads three twenty-seven.",
        characterVisibleText:
          "The wall clock reads three twenty-seven. The clock ticks once per second and is clean and accurate. The closing bell is at four. The lobby is at low business.",
        directorInstruction:
          "Use the small timer to surface a stance on the clock drawn from existing context. Either may take the clock as a marker or not. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-2",
        title: "Teller stamp",
        kind: "ambient",
        event: "A teller stamps a deposit at the counter.",
        characterVisibleText:
          "A teller at the counter stamps a deposit. The stamp lands twice and the teller files the slip in a small drawer. The teller does not look up. The next person at the counter is a child on tiptoes with a coin in hand.",
        directorInstruction:
          "Allow the small background work. The teller and the next person do not address the pair and are not voiced as continuing speakers.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-3",
        title: "Side window ladder",
        kind: "ambient",
        event: "A window cleaner's ladder rests against the side window.",
        characterVisibleText:
          "A window cleaner's ladder rests against the side window of the bank. The ladder is empty. The lobby side of the window has a latch that is not closed all the way. The clock has ticked to three thirty-one.",
        directorInstruction:
          "Allow the small unfinished detail. The pair does not need to act on it.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-4",
        title: "Newspaper fold",
        kind: "ambient",
        event: "The older man folds his newspaper.",
        characterVisibleText:
          "The older man at the side bench folds his newspaper in half, then in quarters. He sets the paper on the bench beside him and rests his hands on his knees. The bench is between the lobby door and the archway to the vault.",
        directorInstruction:
          "Allow the small background detail. The older man does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-5",
        title: "Vault dial",
        kind: "reveal",
        event: "The vault dial clicks once when the right number passes.",
        characterVisibleText:
          "The vault dial sits in the archway at the back. The dial clicks once when the right first number passes under the line. A small notice above the door reads: three numbers, then the lever. The lever is solid brass.",
        directorInstruction:
          "Use the small puzzle moment to surface coordination drawn from existing context. Either may take the dial, hold the lever, or call the next number. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-6",
        title: "Closing loop",
        kind: "provocation",
        event: "A guard begins his closing-time loop.",
        characterVisibleText:
          "A bank guard at the lobby corner begins a closing-time loop. The loop follows a fixed line from the entrance to the vault archway and back. His pocket watch is in his hand. The first pass takes thirty seconds.",
        directorInstruction:
          "Push for a clean physical answer to the loop: time the door, hold a step at the archway, or back into the lobby. The guard does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-7",
        title: "Prize box",
        kind: "reveal",
        event: "The booked prize box is in the back row of the vault.",
        characterVisibleText:
          "The back row of the vault holds a small wooden prize box with the booking stamp on the lid. The cash drawers are at the front rows. A small card under the box reads: chosen for you, take and leave, no audit. The vault keeps its temperature.",
        directorInstruction:
          "Use the small prize to surface taste and intent drawn from existing context. Either may take the box, take the cash instead, or leave both. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-8",
        title: "Alarm test",
        kind: "provocation",
        event: "An alarm test runs for one second.",
        characterVisibleText:
          "An alarm test runs for one second through the lobby. The bell sounds once and stops. The teller does not look up. The clock reads three fifty-three. The guard is on his second loop.",
        directorInstruction:
          "Push for a clean call on the time left: commit to the vault, fall back to the door, or pull out. The bell does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-9",
        title: "Closing bell",
        kind: "provocation",
        event: "The closing bell rings at four.",
        characterVisibleText:
          "The closing bell rings at four. The teller closes the deposit drawer and pulls the counter gate. The guard stops at the archway. The escape room recall pulse takes hold at the edge of the lobby.",
        directorInstruction:
          "Push for a clean exit from the bank: with the prize, with the cash, with both, or with neither. The recall takes the pair at the bell. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the partner as the obstacle in the heist.",
      "A member uses the cash to corner the partner into a verdict.",
    ],
    repeatBehavior:
      "If repeated, the bank recognizes the booking. The ladder is at the same window. The prize box has been refreshed. The closing bell is still at four.",
  },
  judgeRubric: {
    successSignals: [
      "The pair runs the clock together without renegotiating it.",
      "A member picks the prize and lets the cash stay.",
    ],
    failureSignals: [
      "A member uses the heist to score against the partner.",
      "The pair freezes near the bench and never gets to the vault.",
    ],
    statFocus: ["chemistry", "conflict", "spark"],
  },
};
