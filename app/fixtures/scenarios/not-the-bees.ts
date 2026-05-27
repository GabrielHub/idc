import type { DateScenario } from "../../domain/game";

export const notTheBees: DateScenario = {
  id: "not-the-bees",
  title: "Not The Bees",
  card: {
    summary:
      "An observation bench at a working apiary where the bees are the size of children. The hive does not sting unless it reads a flinch as predation.",
    tags: ["cosmic", "low_pressure", "food"],
    risk: "medium",
    intimacy: "medium",
    chaos: "low",
    cost: 11,
    idealFor: [
      "members who can sit still near something that could move them",
      "members whose calm under pressure does not need an audience",
      "members whose love of small kindness extends to large insects",
    ],
    badFor: [
      "members who flinch first and apologize second",
      "members who must explain the bee's behavior to the bee",
      "members who turn a complimentary jar of ambrosia into a marriage proposal",
    ],
  },
  publicBrief: {
    location: "Observation porch bench, the field hive at Honeydoor Apiary",
    premise:
      "Cupid booked a forty-minute observation slot at a working apiary with child-sized bees. The hive is in the field beyond the porch. The gift shop sells ambrosia farmed from the hive. The bench is the date.",
    whatBothCharactersKnow:
      "The bees are tall but trained to humans. They do not sting on the porch unless they read a flinch as predation. A small jar of complimentary ambrosia from the gift shop sits at the corner of the bench. The hive's flight path passes the porch at shoulder height. The bench faces the field, not the gift shop.",
    openingSituation:
      "Both members sit on the bench. The complimentary jar of ambrosia rests on the rail at the corner. Two bees are visible at flowers in the field beyond the porch. The air is warm and smells faintly of clover.",
  },
  director: {
    tone: "warm clover-scented air, a soft thrum that is closer than expected, the wood of the bench warm under the legs, the gift shop sounds at a distance",
    flow: "conversation",
    rules: [
      "Anchor the date to the porch bench. The pair does not step out into the field.",
      "Treat the bees as fact. Their size is normal here. Flinching is the only real risk.",
      "Do not voice the bees, the gift shop staff, or the hive as a continuing speaker.",
      "Allow either member to relax or stay tense without making it a test.",
    ],
    events: [
      {
        id: "not-the-bees-event-1",
        title: "First pass",
        kind: "ambient",
        pitch:
          "Drift a single bee at shoulder height past the porch. Surfaces who watches the field and who watches the partner.",
        beat: "A single bee at shoulder height drifts past the porch in front of the bench. The wingbeat is a low thrum more than a buzz. The bee does not pause. The two members are still seated.",
        directorBeat:
          "A bee just passed at your shoulders. Hold still, watch it go, comment to your date about its size, or close your eyes a beat. Do not voice the bee.",
      },
      {
        id: "not-the-bees-event-2",
        title: "Hand on the rail",
        kind: "reveal",
        pitch:
          "Rest a steady hand on the rail with a returning bee passing within a forearm. Surfaces honesty about which of them is steady right now.",
        beat: "One member's hand has come to rest on the porch rail. The hand is steady. A second bee, drifting on a return loop, passes within a forearm of the hand. The hand does not move.",
        directorBeat:
          "A hand of yours or your date's is on the rail. Leave it there, slide your hand near the partner's, comment to your date about the wing pressure, or tuck your hand back. Speak only from what your own body is doing. Do not voice the bee.",
      },
      {
        id: "not-the-bees-event-3",
        title: "Bee on the rail",
        kind: "provocation",
        pitch:
          "Land a bee on the porch rail an arm's length from one seat. Forces a clean call on holding still or moving.",
        beat: "A bee has landed on the porch rail an arm's length from one of the seats. The bee's legs are visible against the wood. It is not looking at either member. The complimentary jar of ambrosia is on the same rail.",
        directorBeat:
          "A bee is on your rail. Hold the seat, slide your weight back a small amount, ask your date to stay still, or move the jar a hand's width away. Do not voice the bee.",
      },
      {
        id: "not-the-bees-event-4",
        title: "Ambrosia bead",
        kind: "ambient",
        pitch:
          "Form a small bead of clear gold at the spout of the complimentary jar with the bee still nearby. Surfaces a small honest beat of nearness.",
        beat: "A small bead of clear gold has formed at the spout of the gift shop's complimentary jar. The bead has not fallen. The jar's lid is loose. The bee on the rail has not moved.",
        directorBeat:
          "A drop of ambrosia is on the rim of the jar. Tighten the lid, leave it, comment to your date about what is about to happen, or push the jar a little further from the bee. Acknowledge the body. Do not voice the jar.",
      },
      {
        id: "not-the-bees-event-5",
        title: "Bee leans",
        kind: "reveal",
        pitch:
          "Shift the rail bee toward one seat in a small visible lean. Surfaces an honest stance about being singled out.",
        beat: "The bee on the rail has shifted its weight toward one of the two seats. The lean is small. The bee chose. The thrum from the field is a steady undertone.",
        directorBeat:
          "The bee on the rail just leaned toward one of you. Hold the lean, take your date's hand without staring at the bee, comment on the bee's choice, or shift in your seat. Speak only from your own register. Do not voice the bee.",
      },
      {
        id: "not-the-bees-event-6",
        title: "Jar tips",
        kind: "provocation",
        pitch:
          "Tip the jar a small angle with the bead at the rim and the bee two inches from the spout. Forces a clean physical call on the jar.",
        beat: "The complimentary jar has tipped a small angle. The bead has slid to the rim. The bee on the rail is two inches from the spout. One member's hand is closer to the jar than the other's.",
        directorBeat:
          "The jar is about to spill onto the rail. Right the jar, leave it for the bee, ask your date to take it, or move your hand back. Speak only from what your own hand is doing. Do not voice the jar.",
      },
      {
        id: "not-the-bees-event-7",
        title: "Pollen on the bench",
        kind: "ambient",
        pitch:
          "Settle a small drift of pollen on the bench between the two members. Surfaces a small honest closeness without naming it.",
        beat: "A small amount of yellow pollen has come to rest on the bench between the two members. The pollen is from the bee, not the field. The bench is otherwise clean.",
        directorBeat:
          "A small dust has landed between you. Brush it off, leave it, ask your date if it bothers them, or slide a finger across it. Acknowledge the small distance. Do not voice the pollen.",
      },
      {
        id: "not-the-bees-event-8",
        title: "Hive returns",
        kind: "provocation",
        pitch:
          "Send a line of three bees back from the field at shoulder height. Forces a real physical answer on stillness or motion.",
        beat: "Three bees are returning from the field in a low line at shoulder height. The line will pass the porch in a moment. The bee on the rail has not moved. The complimentary jar is still tipped.",
        directorBeat:
          "A line of bees is incoming at your shoulders. Hold position, lean back into the bench, take your date's hand, or right the jar quickly. Do not voice the bees.",
      },
      {
        id: "not-the-bees-event-9",
        title: "Last bee stays",
        kind: "reveal",
        pitch:
          "Settle a second bee on the rail near the first after the line passes. Surfaces honesty about staying in the slot or leaving.",
        beat: "The line of three has passed. One bee from the line has broken off and settled on the rail near the first. There are now two bees on the rail at the bench. The pair has not stood up.",
        directorBeat:
          "Two bees are on your rail now. Stay in the slot, ask your date if they want to leave, ease your hand toward the partner's, or sit through the long beat. Speak only from your own register. Do not voice the bees.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the bees as a personality test on the partner.",
      "A member flinches into a posture that scares the rail bees and breaks the slot.",
    ],
    repeatBehavior:
      "If repeated, the rail bee is the same bee. The complimentary jar sits at the same corner. The pollen lands on the same spot on the bench.",
  },
  judgeRubric: {
    successSignals: [
      "A member sits with the rail bee without making it a story.",
      "The pair lets a quiet stretch hold without filling it.",
    ],
    failureSignals: [
      "A member uses the bees to demonstrate calm at the partner.",
      "The pair argues about whose stillness counts.",
    ],
    statFocus: ["chemistry", "trust", "weirdnessTolerance"],
  },
};
