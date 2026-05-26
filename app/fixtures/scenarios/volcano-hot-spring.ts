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
    cost: 21,
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
        kind: "ambient",
        pitch:
          "Bring both members into the hot mineral water with the steam settling between them. Forces a small physical opening move.",
        beat: "The first step in is a hot wrap up the calf and the thigh. The pool floor is smooth stone. They settle on opposite ends of the small pool. The water is at chest height. The steam settles between them.",
        directorBeat:
          "You are in the heat now. Comment to your date on the wrap up the leg, exhale into the bench, or sit silent with the steam. Take the small physical opening.",
      },
      {
        id: "volcano-hot-spring-event-2",
        title: "Vent",
        kind: "ambient",
        pitch:
          "Glow the protected vent at the far end with slow-moving lava behind it at eye height when seated. Surfaces awe without making it a topic.",
        beat: "The protected vent in the far stone wall holds a small window onto the lava behind the spring house. The lava moves slowly. The vent is at eye height when seated on the bench inside the pool. The glow is steady, not flickering.",
        directorBeat:
          "The lava is a window away from you. Turn to look, comment to your date on the steady glow, sit with the awe, or keep eyes inside the pool. Choose what your attention is for.",
      },
      {
        id: "volcano-hot-spring-event-3",
        title: "Kettle",
        kind: "reveal",
        pitch:
          "Set a brass kettle, two cups, and a tin of loose tea on the side table at pool edge. Surfaces how either prepares a cup for the other.",
        beat: "A small brass kettle sits on a stone trivet on the side table at the pool edge. Two ceramic cups sit beside it. A tin of loose tea leaves and a small infuser are next to the cups. The kettle has been hot since they arrived.",
        directorBeat:
          "Tea is in reach. Stand and pour one for your date, ask them which leaves they want, decline tea aloud, or wait for them to move. Show care or stillness with your hands.",
      },
      {
        id: "volcano-hot-spring-event-4",
        title: "Drift",
        kind: "reveal",
        pitch:
          "Slow-current one of them an inch closer to the center along a long bench. Surfaces whether either closes the gap or keeps the distance.",
        beat: "A slow current moves through the pool from the inflow stone. One of them drifts an inch closer to the center of the pool. The bench under the water is long enough to slide along.",
        directorBeat:
          "The water is pulling you closer to your date. Lean into the drift, hold your position with a small push of the heel, comment on the current, or slide along the bench to meet them. Make the small read.",
      },
      {
        id: "volcano-hot-spring-event-5",
        title: "Heat threshold",
        kind: "provocation",
        pitch:
          "Flush one of them at the cheeks and shoulders with a stone shelf at half-out height available. Forces a clean physical move on heat tolerance.",
        beat: "One of them is flushed in the cheeks and shoulders. The pool edge has a stone shelf at the level where someone could sit half out of the water. A small step out for a minute is part of the routine here.",
        directorBeat:
          "Your body has had enough of the heat for a beat. Move to the stone shelf, slide to the cooler end, ask your date to check on you, or hold through it. Take the real body answer.",
      },
      {
        id: "volcano-hot-spring-event-6",
        title: "Long quiet",
        kind: "ambient",
        pitch:
          "Drop a three or four minute quiet between them with only the slow lap of water. Surfaces whether either fills it to perform.",
        beat: "Neither of them has spoken in three or four minutes. The water is the only sound, a slow lap against the stone. The vent glow has not changed. The cups on the side table have steam off them.",
        directorBeat:
          "The quiet is the conversation here. Stay with it, slide closer along the bench, take a sip, or speak one honest short line. Do not fill the silence to perform.",
      },
      {
        id: "volcano-hot-spring-event-7",
        title: "Reheat",
        kind: "reveal",
        pitch:
          "Run a reheat through the inflow with a single wall chime. Surfaces whether either takes the moment as a marker for something honest.",
        beat: "The inflow stone runs a small reheat through the pool. The water around their ankles warms a noticeable degree. A small chime on the wall rings once and stops.",
        directorBeat:
          "The pool just announced itself again. Notice the warmth at your ankles, use the small marker for one honest line, ask your date how they feel about the heat, or sit deeper. Speak from what you already feel.",
      },
      {
        id: "volcano-hot-spring-event-8",
        title: "Robes",
        kind: "provocation",
        pitch:
          "Drop the booking timer to zero five with robes on hooks and towels folded. Forces a clean exit.",
        beat: "A small clock on the deck reads zero five. The robes are on the hooks where they were left. The towels are dry and folded. The kettle is still on the trivet. The vent is unchanged.",
        directorBeat:
          "Five minutes left in the booking. Stand and step out, ask your date when they want to leave, propose holding the last minute in silence, or reach for a robe. Decide how this ends. Do not voice the clock.",
      },
      {
        id: "volcano-hot-spring-event-9",
        title: "Vent surge",
        kind: "provocation",
        pitch:
          "Brighten the vent and ring the chime twice with the inflow running hotter and the cups trembling. Forces a physical answer to the surge.",
        beat: "The lava behind the protected vent brightens for a beat. The chime on the wall rings twice instead of once. The water around the inflow stone runs hotter and the cups on the side table tremble in their saucers.",
        directorBeat:
          "The volcano is louder for a beat. Take the stone shelf, slide to the cool end, check on your date, or call the booking early. The pool will keep heating; move now.",
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
