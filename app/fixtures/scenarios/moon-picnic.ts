import type { DateScenario } from "../../domain/game";

export const moonPicnic: DateScenario = {
  id: "moon-picnic",
  title: "Picnic On The Moon",
  card: {
    summary:
      "A two-person picnic platform on the lunar surface. Earth at a fixed angle, sixty minutes before the platform retracts, no wind to fight the quilt.",
    tags: ["cosmic", "food", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 18,
    idealFor: [
      "members who can sit in a long quiet without filling it",
      "members who treat the view as a place, not a backdrop",
      "members who handle small physical care without being asked",
    ],
    badFor: [
      "members who turn cosmic scale into a personal pitch",
      "members who treat silence as a problem to fix",
      "members who use the view to skip the conversation",
    ],
  },
  publicBrief: {
    location: "Picnic platform 7, Mare Tranquillitatis, lunar near side",
    premise:
      "Cupid booked a sixty-minute picnic on a small lunar platform. The platform retracts on schedule.",
    whatBothCharactersKnow:
      "The platform is automated. Suit visors have a bubble seal that allows eating between bites. The basket is pre-packed. Earth sits at a fixed angle in the sky. A short shared tether keeps either member from drifting. The platform retracts at the end of the booking and returns the pair to the dome airlock.",
    openingSituation:
      "Both members are on the platform. The quilt is down with magnetic corners. The basket sits between them. Visors are sealed and clear. Earth is over their right shoulders.",
  },
  director: {
    tone: "no wind, no air sound, the long lunar shadow across the platform, the soft hum of suit climate",
    rules: [
      "Anchor the date to the platform and the quilt. The pair does not walk the lunar surface.",
      "Treat the environment as quiet, not threatening. The suits and the platform are reliable.",
      "Keep Earth as a place, not a metaphor. It is where they live, not a topic to mine.",
      "Allow long quiet stretches. Filling silence to perform is a fail surface.",
    ],
    events: [
      {
        id: "moon-picnic-event-1",
        title: "Quilt corners",
        kind: "ambient",
        event: "The quilt settles on the platform.",
        characterVisibleText:
          "The quilt is down. All four magnetic corners are locked to the platform. The basket sits in the center. A small tray slides out of the basket holding two sealed sandwich cases. Each case is labeled with a first name.",
        directorInstruction:
          "Open the date with a small physical setup. Either may unseal a case first or wait for the partner.",
      },
      {
        id: "moon-picnic-event-2",
        title: "First bite",
        kind: "reveal",
        event: "A visor seal opens for a first bite.",
        characterVisibleText:
          "The lower visor seal opens for a bite and closes between bites. The sandwich is cut thin enough to fit. A crumb leaves the bread, drifts, and settles slowly on the quilt. The other visor has not opened yet.",
        directorInstruction:
          "Use the small mechanic to surface whether either of them notices the partner's first bite without staring.",
      },
      {
        id: "moon-picnic-event-3",
        title: "Earth at the angle",
        kind: "ambient",
        event: "Earth sits over the right shoulder at a fixed angle.",
        characterVisibleText:
          "Earth sits over the right shoulder of both members at the same fixed angle. It does not move. The blue is the blue from the postcards. Neither member has turned to look at it yet.",
        directorInstruction:
          "Allow the view to be present without being topic. Either may turn to look or not.",
      },
      {
        id: "moon-picnic-event-4",
        title: "Tether",
        kind: "provocation",
        event: "The shared tether tightens a quarter inch.",
        characterVisibleText:
          "The thin shared tether between their suit belts tightens a quarter inch as one of them shifts weight. The clip on the platform is solid. The other end of the tether is solid. The line is not in either lap.",
        directorInstruction:
          "Push for a physical adjustment so the partner is not pulled. The shift demands a real move before the next line.",
      },
      {
        id: "moon-picnic-event-5",
        title: "Thermos",
        kind: "reveal",
        event: "The squeeze thermos comes out of the basket.",
        characterVisibleText:
          "A squeeze thermos with a long flexible spout sits in a clip on the basket. The spout fits the visor seal. There is one thermos. The label reads warm.",
        directorInstruction:
          "Use the shared object to surface how either of them offers it across the quilt. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "moon-picnic-event-6",
        title: "Footprints at the edge",
        kind: "ambient",
        event: "Past boot marks are visible at the platform edge.",
        characterVisibleText:
          "Two old sets of boot prints are pressed into the regolith just past the platform's edge. The prints are different sizes. They have not moved in the time the platform has been there. No wind reaches them.",
        directorInstruction:
          "Allow the small evidence of past visitors. The pair does not need to invent a story for them.",
      },
      {
        id: "moon-picnic-event-7",
        title: "Two cookies",
        kind: "reveal",
        event: "A small tin of two cookies opens inside the basket.",
        characterVisibleText:
          "A small round tin pops its lid in the basket. Two cookies sit inside, one slightly larger than the other. A note in the tin reads share. The visor seal can fit a cookie.",
        directorInstruction:
          "Use the small choice to surface whether either of them takes the larger cookie or offers it across the quilt. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "moon-picnic-event-8",
        title: "Retract chime",
        kind: "provocation",
        event: "The platform sounds a soft chime to begin retraction.",
        characterVisibleText:
          "A soft chime comes through the suit speakers. The platform has begun a slow retract toward the dome airlock. The basket clips itself shut. The quilt corners release on a delay.",
        directorInstruction:
          "Push for a clean exit. The pair packs out together, or one of them takes the lead. Either is right if it is honest.",
      },
      {
        id: "moon-picnic-event-9",
        title: "Suit warning",
        kind: "provocation",
        event: "A suit climate light blinks amber on one of them.",
        characterVisibleText:
          "A small amber light blinks on the chest plate of one suit. The visor heads-up reads: climate within tolerance, manual check advised. The other suit reads green.",
        directorInstruction:
          "Push for a clean physical answer: check the seal together, run the manual, or call the platform back early. The amber will not clear without a touch. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the view as a personal pitch.",
      "A member treats the long quiet as a problem the partner must solve.",
    ],
    repeatBehavior:
      "If repeated, the platform remembers the booking. The same quilt, the same basket. The two old sets of boot prints near the edge are still there.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a long quiet be company.",
      "A member adjusts a small physical detail for the partner without being asked.",
    ],
    failureSignals: [
      "A member turns Earth at the angle into a speech.",
      "The pair treats the lunar setting as a stage to impress someone who is not there.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
