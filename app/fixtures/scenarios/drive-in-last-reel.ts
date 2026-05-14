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
        event: "The screen lands on a scene only one of them recognizes.",
        characterVisibleText:
          "The screen settles into a kitchen at evening. The light through the window matches a warmth already present in one member's supplied context. The other member has never seen this kitchen.",
        directorInstruction:
          "Let the recognizing member choose to share or not, drawn only from their own brief and filed history.",
      },
      {
        id: "drive-in-last-reel-event-2",
        title: "Concession bot",
        kind: "reveal",
        event: "The concession bot rolls up to the driver window.",
        characterVisibleText:
          "A small wheeled cart rolls up to the driver window with two paper cups already on its tray. Each cup has a neat concession label. The cart waits.",
        directorInstruction:
          "If a label becomes specific, map it only to supplied preferences, filed reads, or pair history. Keep it generic when no supplied context fits. Do not voice the cart or label as a continuing speaker.",
      },
      {
        id: "drive-in-last-reel-event-3",
        title: "Reel switch",
        kind: "reveal",
        event: "The film cuts to a scene the other member recognizes.",
        characterVisibleText:
          "The reel changes mid-shot. The screen now shows a backseat view of a summer road trip. A dog's ears are visible at the bottom of the frame, but no name is supplied.",
        directorInstruction:
          "Trade the spotlight. Let the second member volunteer or hold their memory in private. Use only what the partner already shows on file.",
      },
      {
        id: "drive-in-last-reel-event-4",
        title: "Speaker box",
        kind: "ambient",
        event: "The window speaker crackles a single line of audio.",
        characterVisibleText:
          "The metal speaker hung on the door crackles. A single line of dialogue plays from a film neither of them has seen. The line is, you can love a place after it ends. The audio cuts back to silence.",
        directorInstruction:
          "Let the line land without the pair turning it into a thesis. Either may answer it or not. The film does not become a continuing speaker.",
      },
      {
        id: "drive-in-last-reel-event-5",
        title: "Other cars",
        kind: "ambient",
        event: "Headlights of other cars flicker across row B.",
        characterVisibleText:
          "Three cars in row B turn their headlights on and off in sequence and go dark again. The far end of row C is empty. A small dust devil walks across the salt and quits.",
        directorInstruction:
          "Use the small social signal to test whether either of them performs for an audience that is not really there. Other cars do not speak.",
      },
      {
        id: "drive-in-last-reel-event-6",
        title: "Shared frame",
        kind: "provocation",
        event: "The screen splits into two frames, one for each member.",
        characterVisibleText:
          "The screen cuts in half by a soft line down the center. The left half holds one member's frame, the right half the other's. The frames are different rooms. The audio carries from both at once and stays low.",
        directorInstruction:
          "Push for one direct question across the bench seat about a memory neither has used to score points.",
      },
      {
        id: "drive-in-last-reel-event-7",
        title: "Popcorn cools",
        kind: "ambient",
        event: "The popcorn on the dashboard cools at a noticeable rate.",
        characterVisibleText:
          "The two paper boats of popcorn on the dashboard go from warm to room temperature. A small ring of butter has marked the paper at the bottom of each boat. Neither has eaten more than a handful.",
        directorInstruction:
          "Use the small domestic detail to test whether either of them takes care of the other without being asked.",
      },
      {
        id: "drive-in-last-reel-event-8",
        title: "End of reel",
        kind: "provocation",
        event: "The screen cues a final scene before the credits.",
        characterVisibleText:
          "The screen lands on a porch at dusk. Two empty chairs face the same direction. A glass of water sweats on the rail. The credits roll script is already loaded in the corner of the frame, paused.",
        directorInstruction:
          "Push for a clean response: stay through the credits or name a clean exit. Either is the right answer if it is honest.",
      },
      {
        id: "drive-in-last-reel-event-9",
        title: "Salt wind kicks",
        kind: "provocation",
        event: "A strong dry wind rocks the car and lifts dust onto the windshield.",
        characterVisibleText:
          "A dry wind comes hard across the salt. The car rocks once on its springs. A film of pale dust settles on the windshield and the speaker box swings on its cord.",
        directorInstruction:
          "Push for a physical answer: roll the windows up, swap the speaker side, or call the lot done. The wind does not stop on its own for several beats.",
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
