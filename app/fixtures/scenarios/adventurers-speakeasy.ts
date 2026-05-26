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
        pitch:
          "Force the password-card moment at the threshold. Surfaces who speaks the word, who hands it over, who hesitates at the lock.",
        beat: "The cellar door is plain oak with a small brass slot at eye level. The card in the hand has a single word written in apothecary ink: keelborn. The slot is open. The lock will respond to the spoken word.",
        directorBeat:
          "The door is waiting. Decide who says the word: speak it yourself, hand the card to your date, joke about saying it, or stall. Pick a stance. Do not let the lock sit unaddressed. Do not voice the door.",
      },
      {
        id: "adventurers-speakeasy-event-2",
        title: "Fireside booth",
        kind: "ambient",
        pitch:
          "Settle the booth as the date's anchor. Surfaces who slides in first and what closeness the pair takes at the bench.",
        beat: "The fireside booth is at the back of the room. The bench is dark oak, the cushions worn. The fire is up at a slow burn. A small placard on the table reads booth seven, nine to eleven. The room beyond holds three other parties at a low murmur.",
        directorBeat:
          "The booth is yours. Pick a seat with intent: slide in first, wait for them, sit close to the fire, take the side facing the room. Use the choice. Do not voice the other parties.",
      },
      {
        id: "adventurers-speakeasy-event-3",
        title: "Menu of the dead",
        kind: "reveal",
        pitch:
          "Drop the dead-hero cocktail menu on the table. Surfaces whether either treats the names with weight or runs them as material.",
        beat: "A small leather menu sits at the booth. The cocktails are named for dead heroes: a Slayer's Reward, a Wizard's Last Word, a Rogue's Tithe, a Ranger's Walk. Each name has a small note under it about how the hero ended. The notes are short and accurate.",
        directorBeat:
          "The menu is in front of you. Read a name aloud, ask your date to pick first, comment on one of the notes, or skip past the names to your order. Whatever you choose, let the names have weight. Do not voice the menu.",
      },
      {
        id: "adventurers-speakeasy-event-4",
        title: "Tray arrives",
        kind: "ambient",
        pitch:
          "Let the silent tray set two glasses down between you. Surfaces who reaches first and whether the moment becomes a toast.",
        beat: "A small wooden tray drifts to the booth at table height. Two glasses set themselves down at the right hand of each member. The tray rises and drifts back to the bar. No one was holding it. The first sip is up to them.",
        directorBeat:
          "Two drinks just landed without a server. Decide: lift your glass and toast, sip without ceremony, comment on the magic doing the work, or wait for them to move first. Pick one and make it visible.",
      },
      {
        id: "adventurers-speakeasy-event-5",
        title: "Crests on the wall",
        kind: "reveal",
        pitch:
          "Make the dead-order crests above the booth catch attention. Surfaces what either of you recognizes or refuses to claim.",
        beat: "Three stained-glass crests are mounted on the wall above the booth. The first reads The Hawkfall Company, ended the year of the long winter. The second reads The Ember Twelve, ended at the bridge. The third has no inscription, only a black sun on a pale field.",
        directorBeat:
          "The crests are above your head. Read one aloud, claim recognition you actually have, ask your date about one, or sit with the blank one and say what it does to you. Speak only from what you already carry. Do not voice the crests.",
      },
      {
        id: "adventurers-speakeasy-event-6",
        title: "Card under the candle",
        kind: "ambient",
        pitch:
          "Surface a stranger's pencil note under the candle. Surfaces whether the pair claims the artifact, ignores it, or makes it their own.",
        beat: "A small card sits under the candle holder, left by a previous patron. The card reads, in pencil, we made it past the bridge tonight. The candle is fresh. The card has not curled in the heat.",
        directorBeat:
          "A stranger's card is under your candle. Notice it: read it aloud, slide it back, ask what your date thinks, or leave it where you found it. Let the small artifact register. Do not voice the card.",
      },
      {
        id: "adventurers-speakeasy-event-7",
        title: "Second round",
        kind: "provocation",
        pitch:
          "Empty the glasses with no tray in sight. Forces a direct ask about whether the pair stays for another round.",
        beat: "Both glasses are empty on the booth. The tray has not returned yet. The menu is still at the table. The booking clock above the fireplace reads ten twenty-two.",
        directorBeat:
          "The glasses are empty. Ask the question outright this turn: do we get another round, are we wrapping up, do you want something else off the menu. Answer for yourself or speak for both. Do not let the question hang. Do not voice the clock.",
      },
      {
        id: "adventurers-speakeasy-event-8",
        title: "Closing chime",
        kind: "provocation",
        pitch:
          "Mark ten fifty-five with a soft chime. Forces a clean walk-out or a deliberate hold of the last beat.",
        beat: "A soft chime sounds over the bar. The clock reads ten fifty-five. The fire has been banked down a notch. The booking placard at the table now reads thank you. The cellar door at the back of the room is unlocked again.",
        directorBeat:
          "The room is closing. Stand to leave, hold the booth through the last beat, propose a next stop, or settle and walk out together. Make the choice clear in your next line. Do not voice the chime.",
      },
      {
        id: "adventurers-speakeasy-event-9",
        title: "Cellar door swings",
        kind: "provocation",
        pitch:
          "Crack the cellar door open in a draft. Forces a physical move on the password card and the exit.",
        beat: "The cellar door at the back of the room swings open a hand's width on a draft. The fireplace flickers in answer. The booking placard on the booth now reads thank you, please return the password card.",
        directorBeat:
          "The door has opened itself. Hand back the card, settle and walk out, or refuse to leave yet and say why. The card is still in someone's hand. Move on the exit now. Do not voice the door.",
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
