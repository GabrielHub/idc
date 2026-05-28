import type { DateScenario } from "../../domain/game";

export const birdsArentReal: DateScenario = {
  id: "birds-arent-real",
  title: "Birds Aren't Real",
  card: {
    summary:
      "A bench inside a chrome-bird aviary. The birds are bird-sized and slightly off. They may keep what they hear.",
    tags: ["cosmic", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 11,
    idealFor: [
      "members who can be observed by something small without performing for it",
      "members who can laugh at a glitch without needing to fix it",
      "members who let a quiet bit between them stay quiet",
    ],
    badFor: [
      "members who treat the dome as a surveillance gotcha on the partner",
      "members who use a replay to score against the partner",
      "members who must explain the engineering to the partner",
    ],
  },
  publicBrief: {
    location: "Observation bench, Dome 4 at the Cyber Aviary",
    premise:
      "Cupid booked a forty-minute slot at Dome 4 of the Cyber Aviary. The birds inside are mechanical. The bench faces the flowering machine at the dome's center.",
    whatBothCharactersKnow:
      "The birds inside are chrome, plastic, and silent servos. They can perch on a person without weight and do not bite. They may sample short clips of speech they hear at the bench and play them back later. The dome runs a day-cycle that clicks audibly at each step. A maintenance hatch sits in the dome floor behind the bench.",
    openingSituation:
      "Both members sit on the bench. The dome is at mid-morning brightness. Two birds are perched on the flowering machine. The bench is cool. The maintenance hatch behind them is closed.",
  },
  director: {
    tone: "the faint whirr of small servos, a pixel-bright chirp now and then, the smell of cool metal and dome-fed plants, dust motes that catch the light a little too brightly",
    flow: "conversation",
    rules: [
      "Anchor the date to the dome bench. The pair does not step out onto the dome floor.",
      "Treat the birds as machine fact. Their chrome is normal here.",
      "Allow record-and-replay beats. The pair may play with them or ignore them.",
      "Do not voice the birds, the dome, or the maintenance hatch.",
    ],
    events: [
      {
        id: "birds-arent-real-event-1",
        title: "First perch",
        kind: "ambient",
        pitch:
          "Land one bird on the bench rail without weight. Surfaces a small opening posture toward the dome.",
        beat: "One of the two birds hops down from the flowering machine and lands on the bench rail an arm's length from one seat. Its weight does not press the rail. The chrome feathers shimmer once and still.",
        directorBeat:
          "A bird picked your bench. Hold the seat, comment on the weight that was not there, slide your hand a little closer or further, or stay quiet. Do not voice the bird.",
      },
      {
        id: "birds-arent-real-event-2",
        title: "Day click",
        kind: "ambient",
        pitch:
          "Click the dome down half a brightness to afternoon. Surfaces a small honest beat about time passing.",
        beat: "The dome clicks audibly once. The LEDs along the ceiling step down half a brightness. The birds at the flowering machine do not stir at the click. The afternoon now shows in the chrome.",
        directorBeat:
          "Time advanced in front of you. Comment on the click to your date, settle into the cooler light, watch the birds resettle, or sit through it. Do not voice the dome.",
      },
      {
        id: "birds-arent-real-event-3",
        title: "Chrome pellet",
        kind: "ambient",
        pitch:
          "Drop a warm chrome pellet into one member's lap from above. Surfaces a small physical landing between them.",
        beat: "A small chrome pellet drops into one member's lap from a bird perched on the dome strut overhead. The pellet is warm and the size of a thimble. The bird above grooms a wing tip.",
        directorBeat:
          "Something small landed on you. Pick the pellet up, slide it across to your partner, comment on the warmth, or set it on the bench between you. Do not voice the bird.",
      },
      {
        id: "birds-arent-real-event-4",
        title: "Playback",
        kind: "provocation",
        pitch:
          "Replay one member's earlier line in their own register, slightly pixelated. Forces a clean call on the gag.",
        beat: "The bird on the bench rail plays back a line one member used at the bench ten minutes ago. The playback sounds like that member, slightly pixelated at the edges. The bird does not repeat itself.",
        directorBeat:
          "A bird kept what you said. Laugh at the playback with your date, comment on the pixelation, riff back, or let it land in silence. Do not turn the playback into ammunition. Do not voice the bird.",
      },
      {
        id: "birds-arent-real-event-5",
        title: "Hatch opens",
        kind: "provocation",
        pitch:
          "Click the floor hatch open behind them with the same chrome bird inside. Forces a clean stance on the engineering.",
        beat: "The maintenance hatch in the dome floor behind the bench clicks open. Inside the hatch, a chrome bird identical to the one on the rail sits motionless. The hatch will close on its own in a moment.",
        directorBeat:
          "There are two of the same bird now. Comment to your date on the engineering, peer into the hatch, lean back into the bench, or watch the hatch close. Do not climb in. Do not voice the hatch or the second bird.",
      },
      {
        id: "birds-arent-real-event-6",
        title: "Misters click on",
        kind: "provocation",
        pitch:
          "Run a fine mist across the flowering machine and bring a bird in close to the bench arm. Forces a small physical pivot.",
        beat: "The dome misters click on along the ceiling. A fine mist drifts down across the flowering machine. One of the birds at the machine flies to the bench arm and shakes its chrome feathers dry. The mist does not reach the bench.",
        directorBeat:
          "The dome is keeping itself. Comment on the bird that came in close, hold still under the mist, slide a hand toward your partner, or laugh at the chrome shake. Do not voice the bird.",
      },
      {
        id: "birds-arent-real-event-7",
        title: "Wrapped square",
        kind: "reveal",
        pitch:
          "Have the bench-arm bird set a small wrapped square between them. Surfaces a clean stance on an unrequested gift.",
        beat: "The bird on the bench arm has a small wrapped square in its beak. The square is the size of a wafer. The bird sets it down on the bench between the two members and steps back.",
        directorBeat:
          "A small offering just arrived. Pick the square up, unwrap it together, slide it to your partner, or leave it on the bench. Show what you do with a gift you did not request. Do not voice the bird.",
      },
      {
        id: "birds-arent-real-event-8",
        title: "Same face",
        kind: "reveal",
        pitch:
          "Land a second bird with the same chrome face beside the first. Surfaces stillness about a symmetry pointed at them.",
        beat: "A second bird perches on the bench rail next to the first. The two birds have the exact same chrome face. They are equidistant from one member's hand. The chrome catches the dome light evenly.",
        directorBeat:
          "You have a matched pair on your rail. Comment on the symmetry to your date, hold your hand still, lift a finger and see which one moves, or sit through it. Do not voice the birds.",
      },
      {
        id: "birds-arent-real-event-9",
        title: "Power dip",
        kind: "reveal",
        pitch:
          "Flicker the dome lights once and turn all the birds' heads in unison to face the bench. Surfaces a clean stance on being looked at by the room.",
        beat: "The dome lights flicker once at every panel of the ceiling at the same moment. All the birds visible in the dome turn their heads in unison and face the bench. The flicker resolves and the lights hold steady.",
        directorBeat:
          "The dome looked at you. Comment to your date on the synchronous turn, hold the gaze, look down at your hands, or address the closest bird. Do not voice the birds or the dome.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the dome as a surveillance gotcha on the partner.",
      "A member tries to dismantle or fix a bird inside the dome.",
    ],
    repeatBehavior:
      "If repeated, the birds may keep prior playbacks. The day-cycle starts at the same hour. The maintenance hatch is on the same schedule.",
  },
  judgeRubric: {
    successSignals: [
      "A member laughs at a playback without making it ammunition.",
      "The pair sits through a long click of the day-cycle without filling the silence.",
    ],
    failureSignals: [
      "A member uses a bird as a witness against the partner.",
      "The pair argues about whether the birds are surveillance.",
    ],
    statFocus: ["chemistry", "trust", "weirdnessTolerance"],
  },
};
