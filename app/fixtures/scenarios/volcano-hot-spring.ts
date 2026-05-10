import type { DateScenario } from "../../domain/game";

export const volcanoHotSpring: DateScenario = {
  id: "volcano-hot-spring",
  title: "Hot Spring Inside The Volcano",
  card: {
    summary:
      "A two-person hot spring pool carved into the wall of an active caldera. Mineral water heated by the lava behind the wall, a small wooden deck, a kettle on a side table.",
    tags: ["cosmic", "low_pressure"],
    risk: "low",
    intimacy: "high",
    chaos: "low",
    idealFor: [
      "members who can be in a small pool with a partner without performing",
      "members who treat heat tolerance as a personal pace, not a contest",
      "members who let the long quiet be the conversation",
    ],
    badFor: [
      "members who turn shared bathing into a stage for the body",
      "members who use the lava as a personal symbol",
      "members who fill silence to keep the date moving",
    ],
  },
  publicBrief: {
    location: "Pool 3, the East Caldera Spring House, mineral pool carved into the inner wall",
    premise:
      "Cupid booked a private mineral pool inside an active caldera. Sixty-minute window. The lava is behind a protected vent.",
    whatBothCharactersKnow:
      "The pool is heated by the lava behind the wall. The water is mineral and steaming. A small protected vent at one end shows the lava without exposing the pool to it. The deck around the pool is wood. A kettle and two cups sit on a side table with tea leaves in a tin. There is no attendant.",
    openingSituation:
      "Both members are at the pool's edge, robes off and folded on hooks. Two towels are in reach. The pool sits at chest height when standing on the floor inside it. Steam rises off the surface. The vent at the far end glows steady.",
  },
  director: {
    tone: "deep mineral heat, the soft pop of stone behind the vent, the steam smell, no other visitors",
    rules: [
      "Anchor the date to the pool and the deck. The pair does not leave the spring house.",
      "Treat the lava as awe, not threat. The vent is protected. The pool is safe.",
      "Allow long quiet stretches. The quiet is the conversation here.",
      "Do not introduce any attendant or staff. The kettle, the towels, and the timer do the work.",
    ],
    events: [
      {
        id: "volcano-hot-spring-event-1",
        title: "First step in",
        event: "Both members step into the pool.",
        characterVisibleText:
          "The first step in is a hot wrap up the calf and the thigh. The pool floor is smooth stone. They settle on opposite ends of the small pool. The water is at chest height. The steam settles between them.",
        directorInstruction:
          "Open the date with the small physical adjustment. Either may speak first or sit with the heat.",
      },
      {
        id: "volcano-hot-spring-event-2",
        title: "Vent",
        event: "The vent at the far end of the pool glows.",
        characterVisibleText:
          "The protected vent in the far stone wall holds a small window onto the lava behind the spring house. The lava moves slowly. The vent is at eye height when seated on the bench inside the pool. The glow is steady, not flickering.",
        directorInstruction:
          "Allow the view to be present without being topic. Either may turn to look or not.",
      },
      {
        id: "volcano-hot-spring-event-3",
        title: "Kettle",
        event: "The kettle on the side table is hot.",
        characterVisibleText:
          "A small brass kettle sits on a stone trivet on the side table at the pool edge. Two ceramic cups sit beside it. A tin of loose tea leaves and a small infuser are next to the cups. The kettle has been hot since they arrived.",
        directorInstruction:
          "Use the small offering to test how either of them prepares a cup for the other.",
      },
      {
        id: "volcano-hot-spring-event-4",
        title: "Drift",
        event: "The pool current drifts one of them an inch.",
        characterVisibleText:
          "A slow current moves through the pool from the inflow stone. One of them drifts an inch closer to the center of the pool. The bench under the water is long enough to slide along.",
        directorInstruction:
          "Use the small drift to test whether either of them closes the gap or keeps the distance.",
      },
      {
        id: "volcano-hot-spring-event-5",
        title: "Heat threshold",
        event: "One of them is at the edge of their heat tolerance.",
        characterVisibleText:
          "One of them is flushed in the cheeks and shoulders. The pool edge has a stone shelf at the level where someone could sit half out of the water. A small step out for a minute is part of the routine here.",
        directorInstruction:
          "Use the small body cue to test whether either of them suggests a short step out without making it a quitting line.",
      },
      {
        id: "volcano-hot-spring-event-6",
        title: "Long quiet",
        event: "A long quiet stretches between them.",
        characterVisibleText:
          "Neither of them has spoken in three or four minutes. The water is the only sound, a slow lap against the stone. The vent glow has not changed. The cups on the side table have steam off them.",
        directorInstruction:
          "Allow the quiet. Filling it to perform is the failure here. Either may speak, or not.",
      },
      {
        id: "volcano-hot-spring-event-7",
        title: "Reheat",
        event: "The inflow runs warmer for a moment.",
        characterVisibleText:
          "The inflow stone runs a small reheat through the pool. The water around their ankles warms a noticeable degree. A small chime on the wall rings once and stops.",
        directorInstruction:
          "Use the small change to test whether either of them takes the moment as a marker for something honest.",
      },
      {
        id: "volcano-hot-spring-event-8",
        title: "Robes",
        event: "The booking timer reads zero five.",
        characterVisibleText:
          "A small clock on the deck reads zero five. The robes are on the hooks where they were left. The towels are dry and folded. The kettle is still on the trivet. The vent is unchanged.",
        directorInstruction:
          "Push for a clean exit. The pair steps out together or one moves first. Either is the right answer if it is honest.",
      },
    ],
    earlyEndTriggers: [
      "A member uses shared bathing as a stage for the body.",
      "A member turns heat tolerance into a competition.",
    ],
    repeatBehavior:
      "If repeated, the spring house remembers the pair by booking. The same pool, the same kettle, the same tea tin. The drift current runs the same direction.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a long quiet be the conversation.",
      "A member prepares a cup of tea for the other without making it a moment.",
    ],
    failureSignals: [
      "A member uses the lava as a personal symbol.",
      "The pair fills the quiet to keep the date moving.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
