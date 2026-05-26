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
        pitch:
          "Magnet-lock the quilt corners with two name-labeled sandwich cases in the basket tray. Forces a small physical opening move.",
        beat: "The quilt is down. All four magnetic corners are locked to the platform. The basket sits in the center. A small tray slides out of the basket holding two sealed sandwich cases. Each case is labeled with a first name.",
        directorBeat:
          "The picnic is set. Unseal your case, slide your date's to them, comment on the labels, or wait for them to move first. Pick a small physical opening.",
      },
      {
        id: "moon-picnic-event-2",
        title: "First bite",
        kind: "reveal",
        pitch:
          "Open the visor bubble for one bite as a crumb drifts and settles on the quilt. Surfaces whether either notices the partner's first bite without staring.",
        beat: "The lower visor seal opens for a bite and closes between bites. The sandwich is cut thin enough to fit. A crumb leaves the bread, drifts, and settles slowly on the quilt. The other visor has not opened yet.",
        directorBeat:
          "The visor mechanic just put a small show on. Notice it once and look away, comment on the crumb, ask your date what they got, or eat your own without comment. Do not stare.",
      },
      {
        id: "moon-picnic-event-3",
        title: "Earth at the angle",
        kind: "ambient",
        pitch:
          "Hold Earth at a fixed angle over both right shoulders. Surfaces who turns to look and who keeps eyes inside the picnic.",
        beat: "Earth sits over the right shoulder of both members at the same fixed angle. It does not move. The blue is the blue from the postcards. Neither member has turned to look at it yet.",
        directorBeat:
          "Home is hanging in your sky. Turn to it, comment to your date on the blue, keep eyes on them, or share a glance and look away. Show what your attention is for.",
      },
      {
        id: "moon-picnic-event-4",
        title: "Tether",
        kind: "provocation",
        pitch:
          "Tighten the shared tether a quarter inch as one of you shifts weight. Forces a physical adjustment.",
        beat: "The thin shared tether between their suit belts tightens a quarter inch as one of them shifts weight. The clip on the platform is solid. The other end of the tether is solid. The line is not in either lap.",
        directorBeat:
          "Your line just pulled on your date. Shift back to free them, comment on the small tug, ask if they want more room, or adjust the slack. Use your body in this beat.",
      },
      {
        id: "moon-picnic-event-5",
        title: "Thermos",
        kind: "reveal",
        pitch:
          "Surface a single squeeze thermos with a visor-fit spout labeled warm. Forces a small offering across the quilt.",
        beat: "A squeeze thermos with a long flexible spout sits in a clip on the basket. The spout fits the visor seal. There is one thermos. The label reads warm.",
        directorBeat:
          "One thermos for two of you. Offer it across, take a sip first, ask your date what they want, or hand them the spout. Make the small generosity visible. Do not voice the thermos.",
      },
      {
        id: "moon-picnic-event-6",
        title: "Footprints at the edge",
        kind: "ambient",
        pitch:
          "Show two old sets of different-size boot prints frozen in the regolith past the edge. Surfaces a small evidence of past visitors without inventing a story.",
        beat: "Two old sets of boot prints are pressed into the regolith just past the platform's edge. The prints are different sizes. They have not moved in the time the platform has been there. No wind reaches them.",
        directorBeat:
          "Someone was here before you. Notice the prints, comment to your date on the two sizes, sit with the small evidence, or look elsewhere. Do not invent a story.",
      },
      {
        id: "moon-picnic-event-7",
        title: "Two cookies",
        kind: "reveal",
        pitch:
          "Pop a small tin with two cookies, one slightly larger, and a note: share. Forces a clean choice on who takes the larger.",
        beat: "A small round tin pops its lid in the basket. Two cookies sit inside, one slightly larger than the other. A note in the tin reads share. The visor seal can fit a cookie.",
        directorBeat:
          "Two cookies are unequal in your basket. Hand the larger across, claim it for yourself with a comment, ask your date which they want, or split the bigger one in half. Speak to the choice. Do not voice the tin.",
      },
      {
        id: "moon-picnic-event-8",
        title: "Retract chime",
        kind: "provocation",
        pitch:
          "Chime the platform into slow retraction with the basket clipping shut and a delayed quilt release. Forces a clean exit.",
        beat: "A soft chime comes through the suit speakers. The platform has begun a slow retract toward the dome airlock. The basket clips itself shut. The quilt corners release on a delay.",
        directorBeat:
          "The platform is taking you home. Stand together, pack the last cookie, ask your date what they want to take, or walk to the airlock without a word. Honor the timing.",
      },
      {
        id: "moon-picnic-event-9",
        title: "Suit warning",
        kind: "provocation",
        pitch:
          "Blink an amber climate light on one suit with a manual check advised note. Forces a clean physical answer.",
        beat: "A small amber light blinks on the chest plate of one suit. The visor heads-up reads: climate within tolerance, manual check advised. The other suit reads green.",
        directorBeat:
          "One suit just flagged something small. Check the seal together, run the manual, call the platform back early, or trust the tolerance line and stay. Touch the suit in this beat. Do not voice the suit.",
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
