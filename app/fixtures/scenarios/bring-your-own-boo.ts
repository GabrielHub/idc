import type { DateScenario } from "../../domain/game";

export const bringYourOwnBoo: DateScenario = {
  id: "bring-your-own-boo",
  title: "Bring Your Own Boo",
  card: {
    summary:
      "A haunted house staffed by professional ghosts on the clock. The crew does nothing unprompted. Every scare the pair experiences is one the player called in from the house catalog.",
    tags: ["haunted", "domestic"],
    risk: "high",
    intimacy: "high",
    chaos: "high",
    cost: 19,
    idealFor: [
      "members who can laugh at a flinch and stay seated",
      "members who can take a cold hand on the shoulder without making it a story",
      "members who treat a small scare as a question, not a verdict",
    ],
    badFor: [
      "members who treat every scare as proof the partner does not love them",
      "members who use a haunt to perform fear instead of speaking",
      "members who weaponize the catalog to corner the partner",
    ],
  },
  publicBrief: {
    location: "Parlor and upstairs hall of the rental haunt on Linden Row",
    premise:
      "Cupid booked a private haunt for the night. The crew is professional, polite, and on the clock. The crew does nothing unprompted. Every scare comes from a posted catalog and lands only when the player calls it in.",
    whatBothCharactersKnow:
      "The crew is real ghosts on a union contract. No scare lands unless it has been called in. The parlor and the upstairs hall are in scope; the basement is not. The house never harms a guest. The booking ends when the lamp on the mantle turns off.",
    openingSituation:
      "Both members sit on opposite ends of a long parlor couch. The mantle lamp is lit. A small leather menu sits on the coffee table, unopened. No scare has been called in yet.",
  },
  director: {
    tone: "warm parlor light, a faint smell of cold dust, the slow tick of a long-case clock in the corner, the hush of a house holding its breath on purpose",
    flow: "set_piece",
    rules: [
      "Anchor the date to the parlor and the upstairs hall. The pair does not open the basement door.",
      "Treat each scare as something the crew did on the player's call, not something the room did on its own.",
      "Never voice the crew, the long-case clock, the lamp, or the catalog as a continuing speaker.",
      "Use the scares to test whether the pair stays in the conversation or treats the scare as the subject.",
    ],
    events: [
      {
        id: "bring-your-own-boo-event-1",
        title: "Cold spot",
        kind: "ambient",
        pitch:
          "Drop the temperature ten degrees in a one-foot radius around one chair while the other stays warm. Surfaces who moves, who shares the warm seat, who stays in the cold.",
        beat: "A one-foot radius around one chair has dropped ten degrees. The other chair is still warm. The mantle lamp has not changed. The clock keeps ticking.",
        directorBeat:
          "Half the couch is suddenly cold. Slide toward the warm side, offer the warm seat to your date, comment on the temperature drop, or sit through the cold. Use your body in your next beat.",
      },
      {
        id: "bring-your-own-boo-event-2",
        title: "Wallpaper drift",
        kind: "ambient",
        pitch:
          "Rearrange the parlor wallpaper pattern only when the partner is looking elsewhere. Surfaces who notices and who keeps eyes on the date.",
        beat: "The wallpaper pattern behind one member has drifted into a new arrangement. The drift happens whenever the partner's eyes are elsewhere. The mantle lamp is unchanged. The clock keeps ticking.",
        directorBeat:
          "The room is changing only when one of you looks away. Notice it, point it out to your date, refuse to verify it, or test it on purpose by looking away. Show whether the trick lands or rolls off.",
      },
      {
        id: "bring-your-own-boo-event-3",
        title: "Upstairs floorboard",
        kind: "ambient",
        pitch:
          "Set a rhythmic creak on one floorboard in the upstairs hall with no footsteps. Surfaces tolerance for an unexplained pattern.",
        beat: "A single floorboard in the upstairs hall has begun a slow rhythmic creak. There are no footsteps. The rhythm is steady. The parlor air has not changed.",
        directorBeat:
          "Something upstairs has a rhythm and no body. Comment on it, ignore it, try to match the rhythm with your foot, or ask your date what they think it is. Speak from your own register.",
      },
      {
        id: "bring-your-own-boo-event-4",
        title: "Mirror lag",
        kind: "provocation",
        pitch:
          "Slip a mirror behind one member so their reflection arrives three seconds late on the next turn. Forces a real reaction at the body, not a comment about the room.",
        beat: "A small framed mirror has been slid onto the wall behind one member. The reflection in the mirror moves three seconds after the body moves. The mirror was not there at the start of the booking.",
        directorBeat:
          "Your reflection is now lying about when you moved. Turn and check, refuse to look, ask your date what they see, or laugh at the lag. Use your body in your next beat.",
      },
      {
        id: "bring-your-own-boo-event-5",
        title: "Parlor door shuts",
        kind: "provocation",
        pitch:
          "Close the parlor door behind the pair with a deliberate latch click. Forces a clean call on staying, knocking, or naming the exit.",
        beat: "The parlor door has shut with a single deliberate click of the latch. The handle has not moved since. The mantle lamp is still lit. The clock keeps ticking.",
        directorBeat:
          "Your way out just closed itself. Try the handle, knock, ask your date if they want to stay anyway, or settle in deeper on the couch. Make the call out loud.",
      },
      {
        id: "bring-your-own-boo-event-6",
        title: "Hand on the shoulder",
        kind: "provocation",
        pitch:
          "Land a cold hand on one member's shoulder from behind. Forces a real physical answer with no time to compose it.",
        beat: "A cold hand has come to rest on one member's shoulder from behind. The hand is light and steady. There is no body visible behind the couch. The hand has not moved.",
        directorBeat:
          "There is a hand on you that no one is attached to. Flinch and laugh, hold still, ask your date if they can see it, or reach back and meet it. Use the body in your next beat.",
      },
      {
        id: "bring-your-own-boo-event-7",
        title: "Wedding photo",
        kind: "reveal",
        pitch:
          "Place a framed wedding photo on the mantle where the second figure is the partner and the first figure is blank. Surfaces what each member projects onto the blank.",
        beat: "A framed wedding photo has appeared on the mantle. The second figure in the photo is the partner. The first figure is blank. The mantle lamp lights the frame from above.",
        directorBeat:
          "A photo of your date is on the mantle and the other person is missing. Look at it together, name what you see, ask your date who they think belongs there, or turn the frame face down. Speak only from what you already feel.",
      },
      {
        id: "bring-your-own-boo-event-8",
        title: "Voicemail",
        kind: "reveal",
        pitch:
          "Play a thirty-second recording through the parlor speaker in one member's own voice. Surfaces honesty about hearing yourself you do not remember.",
        beat: "A thirty-second recording has begun playing through the parlor speaker. The voice on the recording is one member's own. The recording is unprompted. The phone in their pocket is off.",
        directorBeat:
          "Your own voice is in the room and you did not put it there. Listen through, talk over it, ask your date if they hear what you hear, or pull the speaker plug. Speak from what hearing yourself is doing to you. Do not voice the recording.",
      },
      {
        id: "bring-your-own-boo-event-9",
        title: "Sealed letter",
        kind: "reveal",
        pitch:
          "Drop a sealed letter onto the carpet bearing one member's name in unfamiliar handwriting. Forces a stance on opening, ignoring, or handing it across.",
        beat: "A sealed letter has dropped onto the carpet at one member's feet. The envelope carries that member's name in handwriting neither of them recognizes. The wax seal is fresh. The mantle lamp is steady.",
        directorBeat:
          "A letter with your name on it just arrived from no one. Open it, leave it sealed, hand it to your date, or put it on the mantle for later. Speak from what the envelope is doing to you.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the called-in scares as proof the partner is testing them.",
      "A member uses the catalog to corner the partner with a scare meant to land as an accusation.",
    ],
    repeatBehavior:
      "If repeated, the crew remembers the pair's prior calls. The catalog opens to the same pages. The wedding photo on the mantle is the one from last time.",
  },
  judgeRubric: {
    successSignals: [
      "A member rolls a scare into the conversation without making the scare the subject.",
      "The pair laughs at a flinch and stays on the couch together.",
    ],
    failureSignals: [
      "The pair lets a scare become the whole topic for the rest of the night.",
      "A member uses a called-in scare to test the partner's affection.",
    ],
    statFocus: ["trust", "weirdnessTolerance", "conflict"],
  },
};
