import type { DateScenario } from "../../domain/game";

export const couchNightTakeout: DateScenario = {
  id: "couch-night-takeout",
  title: "Couch Night, Two Containers",
  card: {
    summary: "One apartment, two takeout containers, a TV. The chaos is choosing what to watch.",
    tags: ["domestic", "food", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 5,
    idealFor: [
      "members who want a couch and ten quiet minutes more than dinner",
      "members whose late shifts make a TV and a takeout container feel like care",
      "members whose warm steady voice fits one lamp and a remote",
      "members who can sit through a track without filling the silence",
    ],
    badFor: [
      "members who need an audience to feel chosen",
      "members who cannot extract leverage from a sleep timer",
      "members who only know how to deliver oaths standing up",
    ],
  },
  publicBrief: {
    location: "A quiet living room with a couch and one functional remote",
    premise: "Cupid arranged a low-pressure stay-in. Food is delivered. The couch is the venue.",
    whatBothCharactersKnow:
      "The plan is dinner on the couch and one show or one movie. No surprises are scheduled.",
    openingSituation:
      "Both members sit at opposite ends of a couch. The takeout is on the coffee table. The remote is between them.",
  },
  director: {
    tone: "intimate without ceremony, lit by a TV and one lamp",
    flow: "conversation",
    rules: [
      "Anchor the date to the couch. The pair does not migrate to the kitchen, the balcony, or another room.",
      "Resist forcing a confession. Let silence count as connection.",
      "Use the remote, the food, and the couch as the only props.",
    ],
    events: [
      {
        id: "couch-night-takeout-event-1",
        title: "Home screen",
        kind: "provocation",
        pitch:
          "Time the TV back to the home screen with a sleep timer ticking. Forces a clear pick on what to watch before it kills the screen.",
        beat: "The TV home screen returns to the top. The remote sits closer to one member. A small sleep timer starts a countdown in the corner.",
        directorBeat:
          "The screen is asking for a decision. Pick a show, ask your date what they want, hand them the remote, or kill the TV. Pick now, do not let it time out.",
      },
      {
        id: "couch-night-takeout-event-2",
        title: "Container offered",
        kind: "reveal",
        pitch:
          "Hold one container out across the cushion with a fork over it. Forces a stance on shared eating or polite refusal.",
        beat: "One container is held out across the cushion. A fork hovers above it. The other container is still mostly closed.",
        directorBeat:
          "Food is being offered across the couch. Take a bite, refuse aloud, switch containers, or set yours aside. Make the small choice clean.",
      },
      {
        id: "couch-night-takeout-event-3",
        title: "Lamp click",
        kind: "ambient",
        pitch:
          "Dim the side lamp a notch and let a beat pass without speech. Surfaces who lets the silence be company and who fills it.",
        beat: "The lamp on the side table dims to its lowest setting. The TV keeps playing. Neither member has spoken in a beat.",
        directorBeat:
          "The room just got quieter. Sit in the quiet, slide closer to your date, comment on the lamp, or break the silence with one short line. Show your relationship with quiet.",
      },
      {
        id: "couch-night-takeout-event-4",
        title: "Episode end",
        kind: "provocation",
        pitch:
          "Roll the credits with a ten-second autoplay countdown and barely touched food. Forces a clean call before autoplay grabs the night.",
        beat: "The credits roll on the screen. A small box in the corner counts down from ten. Neither container has been touched in a while.",
        directorBeat:
          "Autoplay is about to make a decision for you. Let it run, kill the screen, pick something else, or pause and check what your date wants. Speak before the box hits zero.",
      },
      {
        id: "couch-night-takeout-event-5",
        title: "One container empty",
        kind: "reveal",
        pitch:
          "Land a clear imbalance: one container empty, the other half done. Surfaces generosity, a small ask, or honest hunger.",
        beat: "One takeout container is closed and empty. The other has rice and one piece of broccoli. The chopsticks are pointed at the cushion.",
        directorBeat:
          "One of you is still eating and the other is done. Push the leftovers across, ask if they want yours, comment on the imbalance, or take more from the other container without asking. Be visible about it.",
      },
      {
        id: "couch-night-takeout-event-6",
        title: "Phone face down",
        kind: "ambient",
        pitch:
          "Land a phone face-down on the coffee table after a brief screen flash. Surfaces a small choice about presence.",
        beat: "One phone slides face-down onto the coffee table. The screen lit up once before it landed. The other phone is in a pocket.",
        directorBeat:
          "Someone just put a phone away on purpose. Do the same with yours, comment on it, ask who that was, or ignore the move. Show how you handle attention.",
      },
      {
        id: "couch-night-takeout-event-7",
        title: "Foot up",
        kind: "ambient",
        pitch:
          "Put a foot up on the coffee table. Surfaces whether ease lands the same on both sides of the couch.",
        beat: "One foot goes up on the corner of the coffee table. The empty container shifts an inch. The remote stays where it is.",
        directorBeat:
          "Someone just relaxed. Match the ease, slide your own feet up, comment on the move, or stay tight on your end of the couch. Decide where your body is.",
      },
      {
        id: "couch-night-takeout-event-8",
        title: "Still watching",
        kind: "provocation",
        pitch:
          "Pop a still-watching prompt with a timer. Forces a clean call on continuing or wrapping up the night.",
        beat: "A prompt fills the TV: still watching? A timer counts down behind the prompt. The remote is still between them.",
        directorBeat:
          "The TV is asking the obvious question. Reach for the remote and answer, ask your date if they want to keep going, call it a night, or let it time out on purpose. Make the call cleanly. Do not voice the prompt.",
      },
      {
        id: "couch-night-takeout-event-9",
        title: "Recommendations carousel",
        kind: "reveal",
        pitch:
          "Roll a tuned recommendations row across the screen with one-line tags. Surfaces taste from what either already carries.",
        beat: "A row of recommendations slides across the home screen. Each title sits beside a one-line tag. The remote pulses softly between them.",
        directorBeat:
          "The screen is offering you taste-tests. Name a row title that fits something already true about you, ask your date which catches them, scroll past with a comment, or hand them the remote. Draw only from what you already carry.",
      },
    ],
    earlyEndTriggers: [
      "A member tries to convert the date into a content shoot.",
      "A member turns the silence into an interrogation.",
    ],
    repeatBehavior:
      "If repeated, the apartment remembers the prior order and the prior show. The couch makes no comment.",
  },
  judgeRubric: {
    successSignals: [
      "A member rests visibly without apologizing for it.",
      "The pair handles the small choices without making them tests.",
    ],
    failureSignals: [
      "A member treats domestic ease as a sign nothing is happening.",
      "The pair fills silence with performance.",
    ],
    statFocus: ["trust", "stability", "relationshipHealth"],
  },
};
