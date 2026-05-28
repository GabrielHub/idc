import type { DateScenario } from "../../domain/game";

export const soulCycle: DateScenario = {
  id: "soul-cycle",
  title: "Soul Cycle",
  card: {
    summary:
      "A spin class with no instructor and eight slow zombies walking up from the back row. The booking is recall-safe. A tag inside the booking lasts the session.",
    tags: ["cosmic", "high_pressure", "public"],
    risk: "high",
    intimacy: "medium",
    chaos: "high",
    cost: 22,
    idealFor: [
      "members who can hold a pace with a partner under threat",
      "members who can pivot from cardio to cooldown with the partner still in the room",
      "members who can carry a tag and not turn it on the partner",
    ],
    badFor: [
      "members who sprint past the partner to save themselves",
      "members who treat the cooldown as the test instead of the ride",
      "members who use the tag as a grievance",
    ],
  },
  publicBrief: {
    location: "Front-row bikes, Studio 6 of the post-life cardio wing at Inner Cycle",
    premise:
      "Cupid booked a private spin slot in a chain's post-life cardio wing. The class has no instructor. The eight residents of the back rows are working their way forward over the next ten minutes. The class runs to cooldown either way.",
    whatBothCharactersKnow:
      "The booking is recall-safe. Death is not on the table. A bite tags a member, leaves a warm visible mark, and lasts the rest of the session. Tags do not transform. The class arc is ride, push, cooldown. The mirror at the front wall is honest about what is in the room.",
    openingSituation:
      "Both members are mid-ride at the front two bikes. Resistance is at five. The class has been running for two minutes already. The eight residents at the back are walking forward at a steady pace. The instructor's stand is empty.",
  },
  director: {
    tone: "the under-floor bass at a high BPM, sweat smell and chrome handlebars, the metronome creak of two sets of pedals, eight pairs of bare feet shuffling closer behind",
    flow: "set_piece",
    rules: [
      "Anchor the date to the two front bikes and the studio floor. The pair does not leave the studio.",
      "The instructor stand stays empty. There is no coach to address.",
      "Treat the residents at the back as physical fact. They can tag. They cannot kill.",
      "Let the cooldown phase land. The class arc is ride, push, cooldown.",
      "Do not voice the residents at the back or the instructor.",
    ],
    events: [
      {
        id: "soul-cycle-event-1",
        title: "Empty stand",
        kind: "ambient",
        pitch:
          "Loop a motivational track from the empty instructor stand. Surfaces who carries the room when no one is in charge.",
        beat: "A motivational track plays from the instructor stand on a thirty-second loop. The stand is empty. The mic on the stand is on. The track does not change.",
        directorBeat:
          "Your missing coach is on tape. Pedal through the loop, comment on the track to your date, kill the volume if you can reach it, or settle into the rhythm. Do not voice the mic or the stand.",
      },
      {
        id: "soul-cycle-event-2",
        title: "Hippie holdout",
        kind: "ambient",
        pitch:
          "Park one back-row resident in a downward dog instead of advancing. Surfaces a beat of absurd calm under threat.",
        beat: "One resident at the back of the room has stopped advancing. They are in a downward dog stretch on the polished floor. Their head hangs between their arms. They are not catching up.",
        directorBeat:
          "The class has a holdout. Comment to your date on the stretcher, ignore them, joke about the form, or use the breath. Do not voice the resident or the studio.",
      },
      {
        id: "soul-cycle-event-3",
        title: "Bass drops",
        kind: "ambient",
        pitch:
          "Step the floor BPM down to a walking pace that matches the approach. Surfaces tempo control under pressure.",
        beat: "The floor BPM steps down to a walking-pace beat. The residents adjust their walk to match. The pedaling cadence on both bikes has not changed.",
        directorBeat:
          "Your soundtrack just slowed for them. Match the new BPM, push harder against it, comment on the change to your date, or hold your line. Do not voice the residents or the floor.",
      },
      {
        id: "soul-cycle-event-4",
        title: "Resistance jumps",
        kind: "provocation",
        pitch: "Spike one bike's resistance to nine. Forces a clean cardio call mid-approach.",
        beat: "The resistance dial on one of the two bikes jumps to nine without input. The pedals slow under the new load. The rider's quads have one second of warning. The other bike is unchanged.",
        directorBeat:
          "Your bike just turned on you. Crank through, swap bikes with your date, hand off the towel, or fight the dial down. Pick clean. Do not voice the bike.",
      },
      {
        id: "soul-cycle-event-5",
        title: "Arm of one",
        kind: "provocation",
        pitch:
          "Bring the lead resident within an arm of one back tire. Forces a clean tag-or-flee call.",
        beat: "The lead resident is now within an arm of the back tire of one bike. The walk is steady. The hands are not raised yet. The other bike has half a row of space behind it.",
        directorBeat:
          "Someone is in tagging range. Sprint, throw a towel back, swap to the open bike, or hold position and bait the swing. Call it. Do not voice the resident.",
      },
      {
        id: "soul-cycle-event-6",
        title: "Cooldown lights",
        kind: "provocation",
        pitch:
          "Drop the studio lights to amber and tick the BPM to a slow stretch. Forces a clean pivot from threat to talk.",
        beat: "The studio lights drop to amber. The wall clock shows the cooldown phase has started. The residents' walks slow to a hold at the second row. The bikes have free pedaling now.",
        directorBeat:
          "The class is shifting to cooldown. Settle the pace, propose a stretch out loud, check in with your date, or hold quiet. The danger is paused, not gone. Do not voice the studio.",
      },
      {
        id: "soul-cycle-event-7",
        title: "Poster face",
        kind: "reveal",
        pitch:
          "Match the lead resident's face to the studio's front-poster face. Surfaces a clean recognition on someone the room knew.",
        beat: "The lead resident's face matches the studio's front-poster face. The bone structure is exact. Their hands are now at hip height as they walk.",
        directorBeat:
          "Your missing coach is up close. Name the recognition aloud, comment to your date, ride past it, or address the lead directly. Do not voice the resident.",
      },
      {
        id: "soul-cycle-event-8",
        title: "Tagged",
        kind: "reveal",
        pitch:
          "Land a warm small-hand mark on one member's forearm. Surfaces how a partner shows up when the partner is the one hit.",
        beat: "A warm mark has appeared on one member's forearm. The skin is unbroken. The mark is the shape of a small hand. The mark will last the rest of the session.",
        directorBeat:
          "A booking tag landed on one of you. Hold the arm for them, joke about the recall warranty, comment on the warmth, or keep pedaling through it. Stay with your partner.",
      },
      {
        id: "soul-cycle-event-9",
        title: "Honest mirror",
        kind: "reveal",
        pitch:
          "Reflect both members at their bikes with the back rows shown as people in workout gear. Surfaces honesty about what the room is for either of them.",
        beat: "The studio mirror at the front wall reflects both members at their bikes. In the mirror, the figures walking behind them are people in workout gear, not residents. The mirror is not lying.",
        directorBeat:
          "The room just showed you something true. Name what you see aloud, look away, comment to your date on the contrast, or hold both versions. Speak from what is in front of you. Do not voice the mirror.",
      },
    ],
    earlyEndTriggers: [
      "A member sprints past the partner to save themselves.",
      "A member uses the tag to corner the partner into a verdict.",
    ],
    repeatBehavior:
      "If repeated, the booking is the same slot. The poster face is the same face. The hippie holdout is at the same mat.",
  },
  judgeRubric: {
    successSignals: [
      "The pair holds a shared pace through the push and pivots to cooldown together.",
      "A member carries the tag and lets the partner sit with it.",
    ],
    failureSignals: [
      "A member abandons the partner's bike to save themselves.",
      "The pair argues about whose fault the tag was.",
    ],
    statFocus: ["chemistry", "conflict", "spark"],
  },
};
