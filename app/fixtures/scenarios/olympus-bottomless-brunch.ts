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
    cost: 26,
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
        pitch:
          "Set both glasses pre-filled with a chime that rings when one goes down empty and one fifty-eight on the timer. Forces a stance on pace.",
        beat: "The two mimosa glasses on the table are already filled to the line. The booth has a soft chime above it that rings once when a glass is put down empty. The chime has not rung yet. The booking timer reads one fifty-eight.",
        directorBeat:
          "The mimosa is pre-set and the chime is waiting. Take the first sip, propose pacing aloud with your date, comment on the auto-refill, or wait for them to lift first. Take a stance. Do not voice the chime.",
      },
      {
        id: "olympus-bottomless-brunch-event-2",
        title: "Order at the menu",
        kind: "reveal",
        pitch:
          "Fade most menu items, leaving only the ambrosia French toast and small saver bowl uncommitted. Surfaces taste for the partner's preference.",
        beat: "The menus have small ink marks beside each item. A tap on a mark commits the order. The ambrosia French toast and the small saver bowl are the two items that have not faded since they sat down. The other items have already faded.",
        directorBeat:
          "Two dishes are still on the table for ordering. Tap one for yourself, ask your date which they want, propose splitting both, or hand them the menu. Make the choice clean.",
      },
      {
        id: "olympus-bottomless-brunch-event-3",
        title: "First refill",
        kind: "ambient",
        pitch:
          "Ring the chime and refill one glass to the line with no pitcher visible. Forces a small choice on what to do with the new pour.",
        beat: "One of the mimosas is back at the line without a hand or a pitcher. The chime above the booth rang once and the glass refilled. The booking timer reads one forty-six.",
        directorBeat:
          "Your glass just came back full on its own. Sip immediately, set it aside, comment on the magic, or laugh at the chime. Show your relationship with abundance. Do not voice the chime.",
      },
      {
        id: "olympus-bottomless-brunch-event-4",
        title: "Divine city",
        kind: "ambient",
        pitch:
          "Show a god in a red coat crossing a plaza and a small chariot on a bridge below the rail. Surfaces divine ambient without making it a topic.",
        beat: "Below the rail, the divine city is mid-day. A god in a red coat walks across a marble plaza without looking up. A small chariot crosses a bridge. The traffic does not reach the brunch floor. The rail is at chest height.",
        directorBeat:
          "A god just walked past your view without noticing you. Comment briefly on the coat, ask your date if they see the chariot, watch quietly, or stay on the meal. Do not voice the god.",
      },
      {
        id: "olympus-bottomless-brunch-event-5",
        title: "Food arrives",
        kind: "reveal",
        pitch:
          "Slide the toast and saver bowl out of the wall track on a warm tray with two spoons. Forces a clean call on dividing without keeping score.",
        beat: "A small panel slides open on the wall and the food slides out on a warm tray. The ambrosia French toast is in two slices on a single plate. The saver bowl has two spoons. The track closes behind the tray.",
        directorBeat:
          "Two slices and two spoons just landed. Push the plate to the middle, take your slice, offer the larger to your date, or claim the saver bowl. Divide visibly.",
      },
      {
        id: "olympus-bottomless-brunch-event-6",
        title: "Third refill",
        kind: "provocation",
        pitch:
          "Ring the chime a third time with both glasses back at the line and one oh-four on the timer. Forces one direct line you would not have said earlier.",
        beat: "The chime rings a third time. Both glasses are at the line again. The booking timer reads one oh-four. A line of conversation neither of them has said aloud yet is sitting close to the surface.",
        directorBeat:
          "An hour in, the chime is offering cover. Say the honest line you have been holding, ask your date the real question, comment on the third pour, or sip and stay quiet. Do not waste the window. Do not voice the chime.",
      },
      {
        id: "olympus-bottomless-brunch-event-7",
        title: "Time check",
        kind: "provocation",
        pitch:
          "Cross the booking timer to zero fourteen with empty crusts on the plate and the saver bowl half done. Forces a call: one more refill or pack out.",
        beat: "The booking timer reads zero fourteen. The toast plate is empty except for crust. The saver bowl is half done. The chime above the booth is silent.",
        directorBeat:
          "Fourteen minutes left. Order one more refill, finish the saver bowl, propose to your date you wrap up, or ask them what they want. Decide. Do not voice the timer.",
      },
      {
        id: "olympus-bottomless-brunch-event-8",
        title: "Folder",
        kind: "provocation",
        pitch:
          "Sit the leather folder with the paid bill open at zero zero with a small tip slot. Forces a clean exit and a tip call.",
        beat: "The leather folder is where it has been all morning. The bill inside is paid in full. A small slot for tips is open on the cover. The booking timer reads zero zero.",
        directorBeat:
          "Time is up. Drop a tip, ask your date how they want to handle it, sign the slip, or stand and walk. Make the closing move clean. Do not voice the folder.",
      },
      {
        id: "olympus-bottomless-brunch-event-9",
        title: "Sun shifts",
        kind: "ambient",
        pitch:
          "Move the sun a few degrees and warm the rail with the shade across the saver bowl narrowing. Surfaces a small physical change without forcing commentary.",
        beat: "The sun moves a few degrees as the morning runs. The rail beside the booth warms a noticeable amount. The shade across the saver bowl narrows.",
        directorBeat:
          "Your shade is shrinking. Move the saver bowl, shift on the bench, comment to your date on the warmth, or stay where you are. Take a small bodily account.",
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
