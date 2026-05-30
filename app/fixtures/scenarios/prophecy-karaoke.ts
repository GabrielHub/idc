import type { DateScenario } from "../../domain/game";

export const prophecyKaraoke: DateScenario = {
  id: "prophecy-karaoke",
  title: "The Writing's On The Wall",
  card: {
    summary:
      "A private karaoke room where the screen keeps queuing songs that imply future breakups. The machine denies liability.",
    tags: ["prophecy", "public", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "high",
    cost: 17,
    idealFor: [
      "members who can file a bad prediction and keep their seat",
      "members who break a machine's framing with one literal answer",
      "members whose audit voice can revise a prediction in writing",
    ],
    badFor: [
      "members who hear the word fated and start calling for the check",
      "members who refuse to perform a future on a screen",
      "members who treat predictions as orders and the date as already over",
    ],
  },
  publicBrief: {
    location: "Room 7 at Sing Tomorrow, a private karaoke room with one couch and one tablet",
    premise:
      "The karaoke machine selects songs that imply future romantic problems. The tablet runs the booth; staff stay outside.",
    whatBothCharactersKnow:
      "The predictions are not binding. The machine has strong opinions and weak evidence. The room is theirs for the hour.",
    openingSituation:
      "Both members sit on the couch facing the screen. The tablet rests between them. A song title is already loaded. Neither has touched the tablet.",
  },
  director: {
    tone: "private, tense, and faintly ridiculous",
    flow: "pressure",
    rules: [
      "Anchor the date to room 7. The pair stays on the couch with the tablet.",
      "Never treat a prophecy as guaranteed truth.",
      "Use song titles and screen text as pressure without writing real song lyrics.",
      "A song-title read is one take plus one next move; do not turn it into music criticism or a full relationship thesis.",
      "Loaded-title shape: say the title or read, then choose sing, skip, or rewrite. Do not narrate picking up the tablet, screens lighting, countdowns, room dimming, or tracks starting.",
      "Song facts are pressure, not research. No origin-chain lectures, version histories, or invented song metadata unless a character is naming their own real work.",
      "Let characters push back against the machine.",
    ],
    events: [
      {
        id: "prophecy-karaoke-event-1",
        title: "First prediction",
        kind: "provocation",
        pitch:
          "Load track one as We Drift Apart Over Scheduling with a ten-second countdown. Forces a clean stance: laugh, object, or panic.",
        beat: "The screen displays: Track 01, We Drift Apart Over Scheduling. The tablet has not been touched. A small countdown reads ten seconds.",
        directorBeat:
          "The machine just predicted your future on a track title. Laugh out loud, name the prediction back, refuse the song, or grab the tablet. Take a stance now. Do not voice the screen.",
      },
      {
        id: "prophecy-karaoke-event-2",
        title: "Duet demand",
        kind: "provocation",
        pitch:
          "Lock the next menu behind a required duet with two pulsing mic icons. Forces a real cooperation choice.",
        beat: "The tablet message reads: duet required for compliance review. The two-mic icons pulse. The next-track menu is greyed out.",
        directorBeat:
          "The room is asking the two of you to do something together. Pick up both mics, ask your date if they will sing with you, refuse the compliance demand, or pass the tablet across. Make the cooperation visible. Do not voice the tablet.",
      },
      {
        id: "prophecy-karaoke-event-3",
        title: "Encore correction",
        kind: "reveal",
        pitch:
          "Open the encore screen with a blank title field and a blinking cursor. Surfaces a chance to reject the predicted ending.",
        beat: "The encore screen opens a blank title field and waits. The cursor blinks. Behind it the previous track titles fade by one shade.",
        directorBeat:
          "You can rewrite what the machine said about you. Type a new title, ask your date what they would name your future, leave it blank on purpose, or close the screen. Speak only from what you actually want.",
      },
      {
        id: "prophecy-karaoke-event-4",
        title: "Volume nudges up",
        kind: "ambient",
        pitch:
          "Nudge the room volume up two notches with an ambient pressure level adjusted note. Surfaces whether either flinches at being heard.",
        beat: "The room speakers nudge the volume up two notches. The screen displays: ambient pressure level adjusted. The tablet shows a small unmute icon.",
        directorBeat:
          "The room just got louder. Mute it, accept the higher volume, comment on the pressure to your date, or sing into it. Show whether being heard rattles you. Do not voice the speakers.",
      },
      {
        id: "prophecy-karaoke-event-5",
        title: "Mic feedback",
        kind: "ambient",
        pitch:
          "Squelch one mic and silence it with a note: feedback adjusted, voice still welcome. Surfaces small noise without explanation.",
        beat: "One of the two mics on the table squelches and goes quiet. The tablet displays: feedback adjusted, voice still welcome. Neither member has picked it up.",
        directorBeat:
          "A mic just gave up on you. Pick the other one up, ignore the squelch, comment to your date on the still-welcome line, or laugh. Do not voice the mic.",
      },
      {
        id: "prophecy-karaoke-event-6",
        title: "Score reveal",
        kind: "reveal",
        pitch:
          "Flash a 78 honesty score with a note: machine has weak evidence and strong opinions. Surfaces whether the pair mocks it together or sits with it.",
        beat: "The screen flashes a number: 78 honesty score, last recorded by this room. The tablet displays: machine has weak evidence and strong opinions.",
        directorBeat:
          "The room is scoring you on what it does not know. Mock the number with your date, dispute it, ignore it, or sit with the read. Speak only from your own tells. Do not voice the screen.",
      },
      {
        id: "prophecy-karaoke-event-7",
        title: "Lights cycle",
        kind: "ambient",
        pitch:
          "Cycle the room lights warm and back with a please-disregard note. Surfaces whether either performs for the room or the partner.",
        beat: "The room lights cycle warm for two beats and return to normal. The tablet displays: mood lighting suggested by the machine, please disregard.",
        directorBeat:
          "The room just staged a romance moment at you. Laugh, lean in to your date inside the staged warmth, comment on the disregard note, or face the screen instead of the partner. Be honest about who you are facing. Do not voice the tablet.",
      },
      {
        id: "prophecy-karaoke-event-8",
        title: "Tablet timeout",
        kind: "provocation",
        pitch:
          "Pop a tablet timeout: still in this room? with a thirty-second countdown. Forces a clean answer to the room.",
        beat: "The tablet displays: still in this room? A small countdown reads thirty seconds. The room lights are level. The mics are at rest.",
        directorBeat:
          "Thirty seconds to decide. Tap yes and stay, tap no and leave, ask your date which they want, or sit out the timeout. Pick. Do not voice the tablet.",
      },
      {
        id: "prophecy-karaoke-event-9",
        title: "Verdict slip",
        kind: "reveal",
        pitch:
          "Print a thermal slip naming each seat as who tends to leave first or stay too long. Surfaces dispute, accept, or rewrite in your own voice.",
        beat: "A small thermal slip slides out of the tablet seam. Two lines: who tends to leave first, who tends to stay too long. Both lines have been auto-filled with the seat positions, not names.",
        directorBeat:
          "The machine just labeled the two of you. Dispute aloud, accept and joke about it, rewrite the lines, or tear the slip up. Speak only from what you already show. Do not voice the slip.",
      },
    ],
    earlyEndTriggers: [
      "A member feels humiliated in the room.",
      "A member treats the prediction as permission to give up.",
    ],
    repeatBehavior:
      "If repeated, the machine may surface the prior title and ask whether management wants a correction.",
  },
  judgeRubric: {
    successSignals: [
      "The pair rejects a bad prediction together.",
      "A member supports the other through the awkwardness in the room.",
    ],
    failureSignals: [
      "A member lets prophecy replace choice.",
      "The pair blames each other for a machine prompt.",
    ],
    statFocus: ["stability", "spark", "weirdnessTolerance"],
  },
};
