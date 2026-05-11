import type { DateScenario } from "../../domain/game";

export const olympusBottomlessBrunch: DateScenario = {
  id: "olympus-bottomless-brunch",
  title: "Bottomless Brunch On Olympus",
  card: {
    summary:
      "A balcony booth at a brunch place near the summit of Olympus. Mimosas refill themselves while the glass sits on the table. Two-hour seating.",
    tags: ["cosmic", "food", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    idealFor: [
      "members who can pace a bottomless drink without making a thing of it",
      "members who handle a confession that slipped out without weaponizing it",
      "members who treat a divine view as Tuesday weather",
    ],
    badFor: [
      "members who use auto-refills to avoid choosing how much to drink",
      "members who turn an overshare into ammunition",
      "members who cosplay reverence at every godly thing in the room",
    ],
  },
  publicBrief: {
    location: "Booth 2, balcony level, the brunch place at the eighth tier of Olympus",
    premise:
      "Cupid booked the noon-fifteen window for a balcony booth at a brunch place near the summit of Olympus. Two hours, bottomless, the gods are not at this booth.",
    whatBothCharactersKnow:
      "The booth is theirs from twelve fifteen to two fifteen. Mimosas refill themselves while the glass sits on the table. Food arrives from a wall track. The bill is in the leather folder at the start of the meal. The divine city sits below the balcony rail. No staff are present at the booth.",
    openingSituation:
      "Both members are in the booth. Two glasses on the table are already filled. Two menus are open. The leather folder with the bill is to one side. The divine city moves through its noon below the rail.",
  },
  director: {
    tone: "warm sun on the rail, low marble echo, the small chime of a refill, distant divine traffic that does not come up the steps",
    rules: [
      "Anchor the date to the booth and the rail. The pair does not wander the brunch floor.",
      "Treat the staff as off-screen. Ordering is via menu, refills are ambient, the bill is at the table.",
      "Do not voice individual gods. Divine activity is ambient, not interactive.",
      "Use the bottomless mechanic as a real test. Pacing matters. The hours are limited.",
    ],
    events: [
      {
        id: "olympus-bottomless-brunch-event-1",
        title: "First mimosa",
        kind: "reveal",
        event: "The two glasses are already filled at the booth.",
        characterVisibleText:
          "The two mimosa glasses on the table are already filled to the line. The booth has a soft chime above it that rings once when a glass is put down empty. The chime has not rung yet. The booking timer reads one fifty-eight.",
        directorInstruction:
          "Open the date with a small choice about pace. Each surfaces a stance they already carry, not new biography. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "olympus-bottomless-brunch-event-2",
        title: "Order at the menu",
        kind: "reveal",
        event: "Ordering happens by tapping the menu page.",
        characterVisibleText:
          "The menus have small ink marks beside each item. A tap on a mark commits the order. The ambrosia French toast and the small saver bowl are the two items that have not faded since they sat down. The other items have already faded.",
        directorInstruction:
          "Use the small ordering choice to surface how either of them treats the partner's preference.",
      },
      {
        id: "olympus-bottomless-brunch-event-3",
        title: "First refill",
        kind: "ambient",
        event: "A glass refills itself between sips.",
        characterVisibleText:
          "One of the mimosas is back at the line without a hand or a pitcher. The chime above the booth rang once and the glass refilled. The booking timer reads one forty-six.",
        directorInstruction:
          "Allow the small magic. Either may laugh, ignore, or note it. None of the three is wrong. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "olympus-bottomless-brunch-event-4",
        title: "Divine city",
        kind: "ambient",
        event: "The view of the divine city moves through its noon.",
        characterVisibleText:
          "Below the rail, the divine city is mid-day. A god in a red coat walks across a marble plaza without looking up. A small chariot crosses a bridge. The traffic does not reach the brunch floor. The rail is at chest height.",
        directorInstruction:
          "Allow the view to be ambient. The pair does not need to itemize the gods. Do not voice any god as a continuing speaker.",
      },
      {
        id: "olympus-bottomless-brunch-event-5",
        title: "Food arrives",
        kind: "reveal",
        event: "The track delivers the toast and the saver bowl.",
        characterVisibleText:
          "A small panel slides open on the wall and the food slides out on a warm tray. The ambrosia French toast is in two slices on a single plate. The saver bowl has two spoons. The track closes behind the tray.",
        directorInstruction:
          "Use the shared plate and the two spoons to surface how either of them divides without keeping score.",
      },
      {
        id: "olympus-bottomless-brunch-event-6",
        title: "Third refill",
        kind: "provocation",
        event: "A third refill rings the booth chime.",
        characterVisibleText:
          "The chime rings a third time. Both glasses are at the line again. The booking timer reads one oh-four. A line of conversation neither of them has said aloud yet is sitting close to the surface.",
        directorInstruction:
          "Push for one direct line. Either may say the thing they would not have said in the first ten minutes. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "olympus-bottomless-brunch-event-7",
        title: "Time check",
        kind: "provocation",
        event: "The booking timer crosses the fifteen-minute mark.",
        characterVisibleText:
          "The booking timer reads zero fourteen. The toast plate is empty except for crust. The saver bowl is half done. The chime above the booth is silent.",
        directorInstruction:
          "Push for a call: one more refill or start to pack. The booth will not extend. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "olympus-bottomless-brunch-event-8",
        title: "Folder",
        kind: "provocation",
        event: "The leather folder waits at the side of the table.",
        characterVisibleText:
          "The leather folder is where it has been all morning. The bill inside is paid in full. A small slot for tips is open on the cover. The booking timer reads zero zero.",
        directorInstruction:
          "Push for a clean exit. The pair handles the tip together or one decides. Either is right if it is honest. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "olympus-bottomless-brunch-event-9",
        title: "Sun shifts",
        kind: "ambient",
        event: "The sun moves a few degrees and warms the rail.",
        characterVisibleText:
          "The sun moves a few degrees as the morning runs. The rail beside the booth warms a noticeable amount. The shade across the saver bowl narrows.",
        directorInstruction:
          "Allow the small physical change. The pair does not need to comment on it.",
      },
    ],
    earlyEndTriggers: [
      "A member uses an overshare to extract something from the partner.",
      "A member treats the bottomless mechanic as a competition.",
    ],
    repeatBehavior:
      "If repeated, the booth is the same booth. The bill is in the same folder. The chime above the booth keeps the prior tally on a private ledger and refills as if the prior visit did not happen.",
  },
  judgeRubric: {
    successSignals: [
      "A member receives an overshare without making it a hostage.",
      "The pair paces a bottomless drink without pretending it is not bottomless.",
    ],
    failureSignals: [
      "The pair lets a divine view eat the conversation.",
      "A member uses the auto-refill as a way to avoid the choice of how much to drink.",
    ],
    statFocus: ["chemistry", "trust", "relationshipHealth"],
  },
};
