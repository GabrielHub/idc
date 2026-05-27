import type { DateScenario } from "../../domain/game";

export const wetPaint: DateScenario = {
  id: "wet-paint",
  title: "Wet Paint",
  card: {
    summary:
      "A studio table with two canvases and a palette of flavor-paints. The painting becomes the drink.",
    tags: ["food", "low_pressure"],
    risk: "low",
    intimacy: "high",
    chaos: "low",
    cost: 11,
    idealFor: [
      "members who can finish a small craft and let it be done",
      "members whose work involves small mixtures and small choices about ratio",
      "members who taste before they critique",
    ],
    badFor: [
      "members who treat every craft as an audition for a higher gallery",
      "members who turn a flavor into a personality referendum",
      "members who refuse to drink a partner's mistake",
    ],
  },
  publicBrief: {
    location: "Studio table four at The Wet Palette, the mixology-studio loft",
    premise:
      "Cupid booked a forty-minute session at a paint-the-drink studio. Each color on the palette is a flavor. The canvas warms when the design is near complete. The dispenser at the table arms and pours.",
    whatBothCharactersKnow:
      "There are nine paints on the palette. Each is a flavor. A small spoon on the tray is for tasting the partner's pour. The pair may share one canvas or work two. The studio does not refill paint mid-session. The dispenser pours into the tumbler on the same side as the finished canvas.",
    openingSituation:
      "Both members are seated. Two clean canvases hang on small easels in front of them. The palettes are still wrapped in cellophane. The dispenser at the edge of the table is at rest. A small tasting spoon and two empty glass tumblers sit on a tray at the corner.",
  },
  director: {
    tone: "north-light loft, a small citrus note over a deeper char in the palette, the faint hum of the dispenser at rest, the easels lightly creaking under weight",
    flow: "activity",
    rules: [
      "Anchor the date to table four and the two easels. The pair does not get up to roam the loft.",
      "Treat the flavor-paint as fact. What is painted is what is poured.",
      "Do not voice the dispenser, the canvas, or any studio worker as a continuing speaker.",
      "Allow either member to share a canvas or to keep their own. Either is right.",
    ],
    events: [
      {
        id: "wet-paint-event-1",
        title: "Cellophane off",
        kind: "reveal",
        pitch:
          "Unwrap both palettes at once with nine wells and a small key visible. Surfaces who reads the key and who skips it.",
        beat: "Both palettes are unwrapped at the same moment. Nine small wells are visible on each. The colors are ordered light to dark. A small printed key sits between the two palettes.",
        directorBeat:
          "The colors are open. Pick up the key, point at a well, ask your date which color they would start with, or load a brush without consulting. Speak only from your own taste. Do not voice the key.",
      },
      {
        id: "wet-paint-event-2",
        title: "First stroke",
        kind: "provocation",
        pitch:
          "Land one broad green stroke on one canvas with the other canvas still blank. Forces the share-or-separate call.",
        beat: "One canvas now has a single broad stroke of a green that the palette key labels as cucumber. The other canvas is still blank. The dispenser hum has not changed.",
        directorBeat:
          "One canvas has started. Match on the blank canvas, paint into the same canvas, set your brush down and watch your date, or comment on the green. Make the call visible. Do not voice the canvas.",
      },
      {
        id: "wet-paint-event-3",
        title: "Color runs",
        kind: "ambient",
        pitch:
          "Run a small green bead from the top of one canvas to the lower third. Surfaces a small drift the pair can claim.",
        beat: "A small bead of the cucumber green has run from the top of the canvas down to the lower third. The bead has carried a thinner trail behind it. The drip has not crossed onto the other canvas.",
        directorBeat:
          "A drip has shaped the canvas without you. Lean in to use it, dab it dry, comment to your date about the line it made, or work around it. Acknowledge what the canvas did. Do not voice the canvas.",
      },
      {
        id: "wet-paint-event-4",
        title: "A color twice",
        kind: "reveal",
        pitch:
          "Halve one well of one palette while the other palette is full. Surfaces who notices and who names it.",
        beat: "One color in one palette is now half empty. The wells of the other palette are still full. The brush has been rinsed in the small water cup. The choice has been quiet so far.",
        directorBeat:
          "One of you has gone back to the same color twice. Notice it, ask your date what about that color, leave the choice alone, or load that color too. Speak only from what your hand has already done. Do not voice the palette.",
      },
      {
        id: "wet-paint-event-5",
        title: "Canvas warms",
        kind: "ambient",
        pitch:
          "Warm one canvas a noticeable degree with edges starting to dry. Surfaces a quiet shift in the room.",
        beat: "One canvas warms a noticeable degree on the small easel. The temperature change is visible only by the way the paint has begun to dry along the edges. The dispenser at the corner has not armed.",
        directorBeat:
          "Your canvas is finishing under your hands. Add a small last mark, set your brush down, tell your date what you tried for, or wait. Do not voice the canvas.",
      },
      {
        id: "wet-paint-event-6",
        title: "Spoon offered",
        kind: "provocation",
        pitch:
          "Lift the tasting spoon to the middle of the table with its handle pointed at neither canvas. Forces a clean offer to taste across.",
        beat: "The small tasting spoon has been picked up off the tray and rests now in the middle of the table. The handle points neither toward one canvas nor the other. The partner's canvas is still wet at the center.",
        directorBeat:
          "The spoon is in the middle of the table. Slide it toward your date, hold it back to taste your own pour first, comment on the gesture, or ignore it and keep painting. Show your relationship with the partner's work. Do not voice the spoon.",
      },
      {
        id: "wet-paint-event-7",
        title: "Cross dip",
        kind: "ambient",
        pitch:
          "Touch a loaded brush into a second well and leave a cross-color cloud. Surfaces a small honest mistake.",
        beat: "A brush still loaded with one flavor has been dipped briefly in another well. The well shows a faint cross-color cloud. The brush has been wiped on the rim. The contamination is small.",
        directorBeat:
          "A cross color just happened. Wipe the well, leave the mix in, joke to your date about the mistake, or keep painting through it. Do not voice the well.",
      },
      {
        id: "wet-paint-event-8",
        title: "Dispenser arms",
        kind: "provocation",
        pitch:
          "Click the dispenser on with a green light and twelve minutes left. Forces a clean stance on finishing or pouring early.",
        beat: "The dispenser at the edge of the table clicks once and a small green light comes on. The first finished canvas is ready to pour. The two glass tumblers are still empty. The session timer is at twelve minutes.",
        directorBeat:
          "The dispenser is ready for the first pour. Pour now, ask your date if you should wait until both are done, set your brush down, or keep painting through the green light. Make the call visible. Do not voice the dispenser.",
      },
      {
        id: "wet-paint-event-9",
        title: "Taste first",
        kind: "reveal",
        pitch:
          "Land the first pour in one tumbler matching the canvas color with the spoon in the partner's reach. Surfaces honesty about going first or letting the partner.",
        beat: "A pour has landed in one tumbler. The color in the glass matches the canvas. The spoon is in reach of the partner who did not paint it. The first taste belongs to either of them.",
        directorBeat:
          "The first taste is on the table. Lift the spoon and taste your date's, push the glass across, offer them the spoon, or sit and wait for your own canvas to finish. Speak only from what your own hand has already painted. Do not voice the glass.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the partner's color choice as a confession to be analyzed.",
      "A member refuses to taste the partner's pour and turns the refusal into a verdict.",
    ],
    repeatBehavior:
      "If repeated, the studio holds table four. The cucumber green sits in the same well of the palette. The dispenser arms at the same point on the session timer.",
  },
  judgeRubric: {
    successSignals: [
      "A member tastes the partner's pour without commentary.",
      "The pair shares the canvas warming without competing for the brush.",
    ],
    failureSignals: [
      "A member treats a flavor choice as a verdict on the partner.",
      "The pair refuses each other's tumbler.",
    ],
    statFocus: ["chemistry", "trust", "spark"],
  },
};
