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
    flow: "set_piece",
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
        pitch:
          "Anchor the clock at three twenty-seven. Surfaces who runs the time and who treats the bell as someone else's problem.",
        beat: "The wall clock reads three twenty-seven. The clock ticks once per second and is clean and accurate. The closing bell is at four. The lobby is at low business.",
        directorBeat:
          "The clock is now a character in your night. Name the time aloud, set a pace, ask your date for a plan, or signal you are not on the clock. Take a stance on the bell. Do not voice the lobby.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-2",
        title: "Teller stamp",
        kind: "ambient",
        pitch:
          "Set the lobby's everyday rhythm with a teller stamp and a child at the counter. Surfaces whether the pair stays cool inside ordinary cover.",
        beat: "A teller at the counter stamps a deposit. The stamp lands twice and the teller files the slip in a small drawer. The teller does not look up. The next person at the counter is a child on tiptoes with a coin in hand.",
        directorBeat:
          "The bank is humming on around you. Use the cover: drift toward the vault, lower your voice, pretend to fill a slip, or comment on the child. Show how you blend in your next beat. Do not voice the teller or the child.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-3",
        title: "Side window ladder",
        kind: "ambient",
        pitch:
          "Plant an empty cleaner's ladder and an unlatched side window. Surfaces whether either of you treats it as a backup exit or ignores it.",
        beat: "A window cleaner's ladder rests against the side window of the bank. The ladder is empty. The lobby side of the window has a latch that is not closed all the way. The clock has ticked to three thirty-one.",
        directorBeat:
          "Someone left an exit half-open. Note it aloud, file it as a backup, dismiss it, or close the latch on your way past. Show whether you are the kind who hoards options or the kind who trusts the front door.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-4",
        title: "Newspaper fold",
        kind: "ambient",
        pitch:
          "Set an older man folding his paper across the archway. Surfaces whether the pair reads him as obstacle, audience, or harmless.",
        beat: "The older man at the side bench folds his newspaper in half, then in quarters. He sets the paper on the bench beside him and rests his hands on his knees. The bench is between the lobby door and the archway to the vault.",
        directorBeat:
          "Someone is sitting near your route. Read him: keep walking, slow down, glance over, comment to your date about him under your breath, or change the angle of approach. Make the read visible. Do not voice him.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-5",
        title: "Vault dial",
        kind: "reveal",
        pitch:
          "Click the vault dial on the first right number. Surfaces who calls the next number, who holds the lever, who runs point.",
        beat: "The vault dial sits in the archway at the back. The dial clicks once when the right first number passes under the line. A small notice above the door reads: three numbers, then the lever. The lever is solid brass.",
        directorBeat:
          "A puzzle just opened in front of you. Take the dial, hold the lever, call the next number, or hand it to your date. Coordinate visibly in your next beat. Do not voice the notice.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-6",
        title: "Closing loop",
        kind: "provocation",
        pitch:
          "Send the guard onto a thirty-second loop between the door and the vault. Forces a clean choice on timing the gap.",
        beat: "A bank guard at the lobby corner begins a closing-time loop. The loop follows a fixed line from the entrance to the vault archway and back. His pocket watch is in his hand. The first pass takes thirty seconds.",
        directorBeat:
          "You now have a thirty-second window. Time the gap, hold a step at the archway, back into the lobby, or break and run the dial through the loop. Pick the play and call it. Do not voice the guard.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-7",
        title: "Prize box",
        kind: "reveal",
        pitch:
          "Land the booked prize box in the back row beside open cash drawers. Forces a clean read on what either of you actually wants out of this.",
        beat: "The back row of the vault holds a small wooden prize box with the booking stamp on the lid. The cash drawers are at the front rows. A small card under the box reads: chosen for you, take and leave, no audit. The vault keeps your temperature.",
        directorBeat:
          "Two things are within reach: the prize you came for and the cash that is real. Take the box, take the cash, take both, or leave it all and say why. Pick and say it. Do not voice the card.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-8",
        title: "Alarm test",
        kind: "provocation",
        pitch:
          "Run a one-second alarm bell at three fifty-three. Forces a commit, fall back, or pull out call.",
        beat: "An alarm test runs for one second through the lobby. The bell sounds once and stops. The teller does not look up. The clock reads three fifty-three. The guard is on his second loop.",
        directorBeat:
          "Seven minutes left and the bell just spooked you. Commit to the vault, fall back to the door, or call the pull. Name the call clearly and act on it. Do not voice the alarm.",
      },
      {
        id: "bank-heist-1920s-escape-room-event-9",
        title: "Closing bell",
        kind: "provocation",
        pitch:
          "Ring the closing bell at four with the recall pulse forming at the door. Forces a clean exit with the prize, with cash, with both, or with neither.",
        beat: "The closing bell rings at four. The teller closes the deposit drawer and pulls the counter gate. The guard stops at the archway. The escape room recall pulse takes hold at the edge of the lobby.",
        directorBeat:
          "Time is up and the recall is here. Walk to the pulse with the prize, with the cash, with both, or with empty hands. Name what you are carrying out. Do not voice the bell or the guard.",
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
