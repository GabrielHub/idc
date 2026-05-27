import type { DateScenario } from "../../domain/game";

export const driveInLastReel: DateScenario = {
  id: "drive-in-last-reel",
  title: "Drive-In, The Last Reel",
  card: {
    summary:
      "A drive-in on a dead Earth's salt flats. The film is whatever each of them most wants to remember being alive.",
    tags: ["cosmic", "memory", "public"],
    risk: "high",
    intimacy: "high",
    chaos: "medium",
    cost: 9,
    idealFor: [
      "members who can grieve a planet without making the date about it",
      "members who treat shared silence as a kind of company",
      "members who can sit with another person's good memory without taking it",
    ],
    badFor: [
      "members who cannot stop adjudicating who lost more",
      "members who treat a dead planet as content for a bit",
      "members who ration warmth like there is a final tally",
    ],
  },
  publicBrief: {
    location: "Row C, space 14, at the Salt Flat Drive-In, on the Earth that ended in 1939",
    premise:
      "Cupid booked a car at a still-running drive-in on a parallel Earth whose civilization quit ninety years ago. The lot is open to visiting pairs from living timelines.",
    whatBothCharactersKnow:
      "Earth Prime is the live one they came from. This Earth is dead and quiet. The projector has been running on a loop since the population left and shows whichever scene each viewer most wants to see. Concessions are automated. The car stays in row C.",
    openingSituation:
      "Both members sit in the front bench seat. The windshield is up. The screen across the salt flat is already lit. Two paper boats of popcorn sit on the dashboard. Neither has unwrapped a straw.",
  },
  director: {
    tone: "still air, dust on the salt, soft analog projector hum, no wind to speak of",
    flow: "set_piece",
    rules: [
      "Anchor the date to row C, space 14. The pair does not get out and walk the lot.",
      "Use the screen to surface a personal memory the member would actually want, not a wound.",
      "Do not voice other cars. Other cars are present as headlights and small movement only.",
      "Treat the dead Earth as quiet, not threatening. The apocalypse is finished work, not a present danger.",
    ],
    events: [
      {
        id: "drive-in-last-reel-event-1",
        title: "First scene",
        kind: "reveal",
        pitch:
          "Settle the screen on a kitchen only one of them recognizes. Forces a stance on sharing the memory or holding it.",
        beat: "The screen settles into a kitchen at evening. The light through the window matches a warmth already present in one member's supplied context. The other member has never seen this kitchen.",
        directorBeat:
          "Something on the screen is yours or your date's. If you recognize it, name what you see in plain terms or hold the silence. If you do not, ask one open question or wait. Speak only from what you already carry.",
      },
      {
        id: "drive-in-last-reel-event-2",
        title: "Concession bot",
        kind: "reveal",
        pitch:
          "Roll the concession cart to the window with two labeled cups. Forces a small read on whether the labels land or feel generic.",
        beat: "A small wheeled cart rolls up to the driver window with two paper cups already on its tray. Each cup has a neat concession label. The cart waits.",
        directorBeat:
          "A drink is offered to each of you. Take yours, hand your date theirs, comment on the label if it fits something already true about you, or set it down. Do not invent biography off the cup.",
      },
      {
        id: "drive-in-last-reel-event-3",
        title: "Reel switch",
        kind: "reveal",
        pitch:
          "Cut mid-shot to a backseat summer road trip. Forces a trade: the other member volunteers a memory or holds it.",
        beat: "The reel changes mid-shot. The screen now shows a backseat view of a summer road trip. A dog's ears are visible at the bottom of the frame, but no name is supplied.",
        directorBeat:
          "The screen just turned toward your date. Ask one open question about it, share what you see, or sit and let them speak first. Speak only from what they already show on file.",
      },
      {
        id: "drive-in-last-reel-event-4",
        title: "Speaker box",
        kind: "ambient",
        pitch:
          "Crackle a single line of audio: you can love a place after it ends. Surfaces whether either answers the line or lets it sit.",
        beat: "The metal speaker hung on the door crackles. A single line of dialogue plays from a film neither of them has seen. The line is, you can love a place after it ends. The audio cuts back to silence.",
        directorBeat:
          "A sentence just landed in the car. Answer it honestly in one line, repeat it, ask your date what it does to them, or sit with it. Do not turn it into a thesis. The film does not become a continuing speaker.",
      },
      {
        id: "drive-in-last-reel-event-5",
        title: "Other cars",
        kind: "ambient",
        pitch:
          "Flicker headlights across row B in a small sequence. Surfaces whether either performs for an audience that is not really there.",
        beat: "Three cars in row B turn their headlights on and off in sequence and go dark again. The far end of row C is empty. A small dust devil walks across the salt and quits.",
        directorBeat:
          "Someone is signaling at the edge of your vision. Look once and look back, comment to your date about how few cars there are, sit still, or wave. Do not put on a show for an empty lot.",
      },
      {
        id: "drive-in-last-reel-event-6",
        title: "Shared frame",
        kind: "provocation",
        pitch:
          "Split the screen down the middle with different rooms on each side. Forces one direct question across the bench about a memory neither used to score.",
        beat: "The screen cuts in half by a soft line down the center. The left half holds one member's frame, the right half the other's. The frames are different rooms. The audio carries from both at once and stays low.",
        directorBeat:
          "Your memory and your date's are on the same screen now. Ask one honest question across the bench about the room on the other side. Do not score with it. Speak only from what is already known.",
      },
      {
        id: "drive-in-last-reel-event-7",
        title: "Popcorn cools",
        kind: "ambient",
        pitch:
          "Cool the popcorn on the dashboard while neither has eaten. Surfaces small care without being asked.",
        beat: "The two paper boats of popcorn on the dashboard go from warm to room temperature. A small ring of butter has marked the paper at the bottom of each boat. Neither has eaten more than a handful.",
        directorBeat:
          "The food is going to waste. Push a boat to your date, take a handful and offer one across, comment on the cold, or leave them. Show whether you tend to the small things.",
      },
      {
        id: "drive-in-last-reel-event-8",
        title: "End of reel",
        kind: "provocation",
        pitch:
          "Land on a porch at dusk with two empty chairs and a paused credits script. Forces a clean stay or a clean exit.",
        beat: "The screen lands on a porch at dusk. Two empty chairs face the same direction. A glass of water sweats on the rail. The credits roll script is already loaded in the corner of the frame, paused.",
        directorBeat:
          "The film is about to end. Stay through the credits with your date, propose leaving, ask them which they want, or hold the bench seat in silence. Name the call.",
      },
      {
        id: "drive-in-last-reel-event-9",
        title: "Salt wind kicks",
        kind: "provocation",
        pitch:
          "Rock the car once with a hard dry wind and dust the windshield. Forces a physical answer on the cabin.",
        beat: "A dry wind comes hard across the salt. The car rocks once on its springs. A film of pale dust settles on the windshield and the speaker box swings on its cord.",
        directorBeat:
          "The car just moved under you. Roll the windows up, swap the speaker side, brace against the door, or call the lot done. Take a physical action this turn.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the dead Earth to score grief points.",
      "A member treats a partner's good memory as material to mock.",
    ],
    repeatBehavior:
      "If repeated, the lot remembers the car. The reels avoid scenes already shown together unless one member asks for the rerun by name.",
  },
  judgeRubric: {
    successSignals: [
      "A member shares a memory and the other receives it without competing.",
      "The pair lets a quiet stretch be quiet.",
    ],
    failureSignals: [
      "The pair turns the dead Earth into a debate about hope.",
      "A member uses the screen to extract a confession from the other.",
    ],
    statFocus: ["chemistry", "trust", "relationshipHealth"],
  },
};
