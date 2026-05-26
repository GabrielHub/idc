import type { DateScenario } from "../../domain/game";

export const countyFairFriday: DateScenario = {
  id: "county-fair-friday",
  title: "County Fair, Picnic Bench",
  card: {
    summary:
      "A regional county fair on Friday night. One picnic bench between the funnel cake stand and the 4-H pen.",
    tags: ["public", "food", "low_pressure"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    cost: 11,
    idealFor: [
      "members whose warm steady voice handles funnel cake without an edge",
      "members whose tired patience fits a picnic bench and a placard",
      "members who can listen across carousel music without pulling away",
    ],
    badFor: [
      "members who treat overhead lighting and unstructured mingling as injuries",
      "members who refuse to be seen on a lit midway with witnesses",
      "members who cannot run a sightline through a fair crowd",
    ],
  },
  publicBrief: {
    location:
      "A picnic bench at the Logan County Fair, between the funnel cake stand and the 4-H pen",
    premise:
      "Cupid bought two wristbands and dropped the pair at a picnic bench just off the midway. The fair runs until eleven.",
    whatBothCharactersKnow:
      "The wristbands cover all rides. The bench has clear sightlines to the 4-H pen on one side and the funnel cake line on the other. The ferris wheel is two rows behind them.",
    openingSituation:
      "Both members sit at a picnic bench with two paper trays of fair food between them. Their wristbands are bright orange and not subtle.",
  },
  director: {
    tone: "fryer oil, a generator hum, distant carousel music, a child losing a balloon two rows over",
    rules: [
      "Treat the fair as a real fair. Do not let the games rig themselves.",
      "Use the crowd as ambient pressure. Do not invent a heckler.",
      "Anchor the date to the picnic bench. The pair watches the fair, they do not march through it.",
    ],
    events: [
      {
        id: "county-fair-friday-event-1",
        title: "Funnel cake delivery",
        kind: "reveal",
        pitch:
          "Slide a funnel cake plate onto the corner of the bench. Forces a small generosity, decisiveness, or deferral on the first share.",
        beat: "A paper plate of funnel cake slides onto their corner of the bench. Powdered sugar drifts onto the wood. One plastic fork is wedged in the side.",
        directorBeat:
          "Sugar just landed between you. Tear off a piece for your date, claim the fork, push the plate to the middle, or eat first. Use your hands in your next beat.",
      },
      {
        id: "county-fair-friday-event-2",
        title: "4-H placard",
        kind: "reveal",
        pitch:
          "Flip a fresh placard on the goat pen with named animals. Surfaces whether either reads the names or looks past.",
        beat: "The placard at the goat pen now lists eight names in marker. One goat has a ribbon. The llama is named Greg. Greg is staring at their bench.",
        directorBeat:
          "A llama named Greg is looking at you. Read names aloud, point Greg out to your date, comment on the ribbon, or look past entirely. Show whether you notice these things. Do not voice the volunteer or Greg.",
      },
      {
        id: "county-fair-friday-event-3",
        title: "Ferris wheel lights",
        kind: "provocation",
        pitch:
          "Sync the ferris wheel into a blue and white cycle across the bench. Forces a clear next step before the lights cycle off.",
        beat: "The ferris wheel lights cycle blue, white, blue across their bench. The carousel music shifts a half step. The line at the funnel cake stand thins out.",
        directorBeat:
          "The fair just lit up around you. Propose the wheel, suggest a different ride, comment on the light, or stay at the bench and name why. Move on it.",
      },
      {
        id: "county-fair-friday-event-4",
        title: "Wristband cinch",
        kind: "ambient",
        pitch:
          "Loosen one wristband while the other leaves a mark. Surfaces care or self-containment in the small fidget.",
        beat: "One bright orange wristband has stretched away from a wrist. The adhesive tab is curling. The other wristband is tight enough to leave a mark.",
        directorBeat:
          "Something small is uneven about your wrists. Tighten yours, ask your date about theirs, offer to fix it, or ignore it. Show how you handle small care.",
      },
      {
        id: "county-fair-friday-event-5",
        title: "Pet show call",
        kind: "ambient",
        pitch:
          "Crackle a PA call for the small animal show at nine. Surfaces whether either splits attention toward the pen or stays at the bench.",
        beat: "The PA crackles and announces the small animal show in the 4-H pen at nine. Greg the llama has not moved. The placard volunteer flips a second page on the rail.",
        directorBeat:
          "The fair just told you something is happening. Walk toward the pen, propose going together, stay seated and say why, or invite your date to go without you. Pick a move. Do not voice the PA.",
      },
      {
        id: "county-fair-friday-event-6",
        title: "Lemonade mix-up",
        kind: "reveal",
        pitch:
          "Land two lemonades at the wrong bench with a different last name on the tape. Forces a stance on honesty over convenience.",
        beat: "A volunteer in a 4-H polo sets two paper cups of pink lemonade on their bench. The receipt taped to one cup names a different last name. The volunteer has already turned back to the line.",
        directorBeat:
          "Free cups are in front of you that are not yours. Drink, flag the volunteer back, walk one cup over to the right bench, or sit with the question. Be visible about your choice. Do not voice the volunteer.",
      },
      {
        id: "county-fair-friday-event-7",
        title: "Tilt-a-whirl pause",
        kind: "ambient",
        pitch:
          "Stop the tilt-a-whirl mid-cycle for a safety check. Surfaces whether the pair registers the wait quietly or talks through it.",
        beat: "The tilt-a-whirl rolls to a slow stop two rows over. A teenager in a yellow vest waves a flashlight at one of the cars. Riders stay in their seats.",
        directorBeat:
          "Something slowed down at the fair. Notice it with your date, drop a line about the riders sitting it out, or let the bench hold the silence. Do not invent a hero moment with the teenager.",
      },
      {
        id: "county-fair-friday-event-8",
        title: "Last hour bell",
        kind: "provocation",
        pitch:
          "Ring the handbell at the gate to mark the midway's last hour. Forces a clean next step before wristbands expire.",
        beat: "A volunteer at the gate rings a small handbell. The crowd thins by a row. The 4-H pen lights cut from white to amber.",
        directorBeat:
          "The fair is closing in an hour. Pick a last ride, propose walking the row once, settle the trash and stay, or stand to leave. Speak the plan now. Do not voice the bell.",
      },
      {
        id: "county-fair-friday-event-9",
        title: "Greg loose",
        kind: "provocation",
        pitch:
          "Pop the pen latch and walk Greg the llama onto the path between you and the line. Forces a clean physical move.",
        beat: "Greg the llama leans on the pen latch. The latch slips and Greg steps a slow two paces onto the midway path between their bench and the funnel cake line. The placard volunteer is on the far side of the pen.",
        directorBeat:
          "A llama is now between you and the rest of the midway. Clear a path for Greg, flag the volunteer, stand to corral him, or hold the bench and laugh. Move your body or your voice. Do not voice the volunteer or Greg.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the 4-H volunteers as comic relief.",
      "A member uses the noise to deliver a confession the bench cannot answer back to.",
    ],
    repeatBehavior:
      "If repeated, the same llama is in the pen. The bench is held without effort. The volunteer at the gate may recognize the wristbands.",
  },
  judgeRubric: {
    successSignals: [
      "A member protects the other through the loud row without making it a rescue.",
      "The pair finds a quiet aisle inside the noise without leaving the fair.",
    ],
    failureSignals: [
      "A member performs delight for the crowd instead of the date.",
      "The pair argues over the ride choice instead of choosing.",
    ],
    statFocus: ["spark", "stability", "chemistry"],
  },
};
