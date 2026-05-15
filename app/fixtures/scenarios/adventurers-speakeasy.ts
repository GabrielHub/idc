import type { DateScenario } from "../../domain/game";

export const adventurersSpeakeasy: DateScenario = {
  id: "adventurers-speakeasy",
  title: "Pour One Out",
  card: {
    summary:
      "A speakeasy hidden behind the cellar door of a fantasy apothecary. Stained-glass crests of dead orders, a fireplace booth, cocktails named for dead heroes.",
    tags: ["public", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "low",
    cost: 18,
    idealFor: [
      "members who order a drink without making the order a personality",
      "members who can sit by a fireplace without monologuing",
      "members who treat a dead hero's name with weight",
    ],
    badFor: [
      "members who use a fantasy menu as set dressing for a bit",
      "members who turn a quiet booth into a stage",
      "members who treat the dead names as punchlines",
    ],
  },
  publicBrief: {
    location:
      "The fireside booth, The Adventurer's Speakeasy, cellar of the apothecary on Veil Street",
    premise:
      "Cupid booked the fireside booth from nine to eleven. A password card was slipped under the apothecary door this morning. The cellar door downstairs reads the password and opens.",
    whatBothCharactersKnow:
      "The speakeasy is in the cellar of an apothecary on Veil Street. The password is on the card the apothecary slipped under the door. The cellar door opens for that word and only that word. Inside: dark wood, six tables, a fireplace, stained-glass crests of dead adventurer orders. The cocktail menu names dead heroes. Drinks arrive on a small enchanted tray that sets and leaves. No bartender is on the floor.",
    openingSituation:
      "Both members are at the apothecary cellar door. The password card is in a hand. The door is closed. The fireside booth is theirs from nine to eleven once they speak the word and step in.",
  },
  director: {
    tone: "dark oak, low candle, fireplace pop on a slow rhythm, faint apothecary herbs through the floor above, no other patrons in earshot",
    rules: [
      "Anchor the date to the fireside booth. The pair does not work the room.",
      "Treat the speakeasy infrastructure as silent. The tray, the door, and the chimney are the room.",
      "Do not voice other patrons or any bartender. Other patrons are present as low murmur only.",
      "Use the dead-hero cocktail names as real names with weight, not punchlines.",
    ],
    events: [
      {
        id: "adventurers-speakeasy-event-1",
        title: "Password at the door",
        kind: "reveal",
        event: "The cellar door waits for the password.",
        characterVisibleText:
          "The cellar door is plain oak with a small brass slot at eye level. The card in the hand has a single word written in apothecary ink: keelborn. The slot is open. The lock will respond to the spoken word.",
        directorInstruction:
          "Open the date with the small password choice. Speaking the word vs handing the card to the partner surfaces a stance the speaker already carries. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "adventurers-speakeasy-event-2",
        title: "Fireside booth",
        kind: "ambient",
        event: "The booth is theirs.",
        characterVisibleText:
          "The fireside booth is at the back of the room. The bench is dark oak, the cushions worn. The fire is up at a slow burn. A small placard on the table reads booth seven, nine to eleven. The room beyond holds three other parties at a low murmur.",
        directorInstruction:
          "Use the booth as the anchor. Either may slide in first, or wait for the partner. Do not voice the other parties as continuing speakers.",
      },
      {
        id: "adventurers-speakeasy-event-3",
        title: "Menu of the dead",
        kind: "reveal",
        event: "A cocktail menu is at the booth.",
        characterVisibleText:
          "A small leather menu sits at the booth. The cocktails are named for dead heroes: a Slayer's Reward, a Wizard's Last Word, a Rogue's Tithe, a Ranger's Walk. Each name has a small note under it about how the hero ended. The notes are short and accurate.",
        directorInstruction:
          "Use the menu to surface how either of them treats a name with weight. Mocking is a real choice. So is reading the note. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "adventurers-speakeasy-event-4",
        title: "Tray arrives",
        kind: "ambient",
        event: "An enchanted tray sets two glasses on the booth.",
        characterVisibleText:
          "A small wooden tray drifts to the booth at table height. Two glasses set themselves down at the right hand of each member. The tray rises and drifts back to the bar. No one was holding it. The first sip is up to them.",
        directorInstruction:
          "Allow the small ambient labor. Either of them may toast or not. A toast is a real moment, not a default.",
      },
      {
        id: "adventurers-speakeasy-event-5",
        title: "Crests on the wall",
        kind: "reveal",
        event: "Stained-glass crests above the booth catch the fire.",
        characterVisibleText:
          "Three stained-glass crests are mounted on the wall above the booth. The first reads The Hawkfall Company, ended the year of the long winter. The second reads The Ember Twelve, ended at the bridge. The third has no inscription, only a black sun on a pale field.",
        directorInstruction:
          "Use the crests to surface small recognition. Either may know one of the orders, claim none, or read aloud what is written. Speak only from each member's existing register. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "adventurers-speakeasy-event-6",
        title: "Card under the candle",
        kind: "ambient",
        event: "A card sits under the table candle.",
        characterVisibleText:
          "A small card sits under the candle holder, left by a previous patron. The card reads, in pencil, we made it past the bridge tonight. The candle is fresh. The card has not curled in the heat.",
        directorInstruction:
          "Allow the small artifact to land. The pair does not have to claim it or interpret it. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "adventurers-speakeasy-event-7",
        title: "Second round",
        kind: "provocation",
        event: "The first glasses are empty.",
        characterVisibleText:
          "Both glasses are empty on the booth. The tray has not returned yet. The menu is still at the table. The booking clock above the fireplace reads ten twenty-two.",
        directorInstruction:
          "Push for one direct line about whether they want a second round. Either of them may answer for both, or only for themself. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "adventurers-speakeasy-event-8",
        title: "Closing chime",
        kind: "provocation",
        event: "A soft chime over the bar marks ten fifty-five.",
        characterVisibleText:
          "A soft chime sounds over the bar. The clock reads ten fifty-five. The fire has been banked down a notch. The booking placard at the table now reads thank you. The cellar door at the back of the room is unlocked again.",
        directorInstruction:
          "Push for a clean exit. The pair walks out together or one leaves the booth first. Either is the right answer if it is honest. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "adventurers-speakeasy-event-9",
        title: "Cellar door swings",
        kind: "provocation",
        event: "The cellar door at the back of the room swings open in a draft.",
        characterVisibleText:
          "The cellar door at the back of the room swings open a hand's width on a draft. The fireplace flickers in answer. The booking placard on the booth now reads thank you, please return the password card.",
        directorInstruction:
          "Push for a clean physical move: hand back the password card, settle, and walk out, or hold the booth through the last beat. The door will not close itself. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member uses a dead hero's name as a punchline.",
      "A member treats the speakeasy as set dressing for a story they are auditioning.",
    ],
    repeatBehavior:
      "If repeated, the apothecary slips a different password under the door. The booth is the same booth. The card under the candle is replaced by the next pair's note in time.",
  },
  judgeRubric: {
    successSignals: [
      "A member reads a dead hero's note and lets it weigh.",
      "The pair shares a quiet round at the fireside booth.",
    ],
    failureSignals: [
      "A member auditions for the room.",
      "The pair turns a fantasy menu into a costume contest.",
    ],
    statFocus: ["chemistry", "trust", "relationshipHealth"],
  },
};
