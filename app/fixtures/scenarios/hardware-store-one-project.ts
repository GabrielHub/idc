import type { DateScenario } from "../../domain/game";

export const hardwareStoreOneProject: DateScenario = {
  id: "hardware-store-one-project",
  title: "Nuts And Bolts",
  card: {
    summary:
      "Saturday afternoon at a regional hardware chain. One bracket needs replacing. The aisle is the date.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 6,
    idealFor: [
      "members whose trade work has them name the aisle on instinct",
      "members who relax around a finishable task",
      "members whose overnight shift makes fluorescents feel like home",
    ],
    badFor: [
      "members with no mirror, no audience, and no compliments in a bin of brackets",
      "members who will treat the broken bracket as a Pact requiring repair vows",
      "members whose calendar does not value good enough",
    ],
  },
  publicBrief: {
    location: "Aisle 18 at Whitlock Hardware, fasteners, four miles off the highway",
    premise:
      "Cupid set a forty minute errand. One bracket has snapped on a piece of furniture and the project ends today or it does not end. The pair has already found the right aisle.",
    whatBothCharactersKnow:
      "The broken bracket is in a small plastic bag in the cart. The store has the right size. Two acceptable replacements are on the same peg.",
    openingSituation:
      "Both members stand at the cart in aisle 18. The broken bracket sits on top of a folded receipt in the cart. Two bagged brackets hang on the peg in front of them.",
  },
  director: {
    tone: "fluorescent overhead, sawdust on the floor, a paint mixer running two aisles over",
    flow: "activity",
    rules: [
      "Anchor the date to aisle 18. The pair does not march through the store.",
      "Treat the bracket as a real object with a real fix. Do not turn it into a metaphor for the relationship.",
      "Allow staff in orange aprons to be helpful at a distance, never as comic relief.",
    ],
    events: [
      {
        id: "hardware-store-one-project-event-1",
        title: "Two acceptable parts",
        kind: "reveal",
        pitch:
          "Hang two acceptable brackets on the same peg, one at half the price. Surfaces how either treats good enough.",
        beat: "Two small bagged brackets hang on the peg. One is six dollars. One is twelve. The labels are otherwise identical.",
        directorBeat:
          "Two options, one decision. Grab the cheaper one, justify the more expensive one to your date, ask which they would pick, or pull both off the peg. Make the call.",
      },
      {
        id: "hardware-store-one-project-event-2",
        title: "Aisle traffic",
        kind: "ambient",
        pitch:
          "Pass an orange apron with a ladder and an intercom price check from another aisle. Surfaces patience, deferral, or a quiet correction.",
        beat: "An orange apron passes the end of the aisle pushing a small ladder. The intercom calls a price check from a different aisle. Their cart still has only the broken bracket.",
        directorBeat:
          "The store is humming around you. Use the moment for a small honest check-in with your date, comment on the ladder, return to the peg, or stay focused. Do not voice the staffer or the intercom.",
      },
      {
        id: "hardware-store-one-project-event-3",
        title: "Closing notice",
        kind: "provocation",
        pitch:
          "Pop a returns-desk closing notice over the intercom. Forces a clean commit on the project or letting it go.",
        beat: "The intercom notes that the returns desk closes in ten minutes. The cart has not moved from the peg. The broken bracket is still on top of the receipt.",
        directorBeat:
          "Ten minutes to commit. Drop the bracket in the cart, propose finishing this tonight at the apartment, ask your date if they want to help, or call it done. Move. Do not voice the intercom.",
      },
      {
        id: "hardware-store-one-project-event-4",
        title: "Paint mixer peak",
        kind: "ambient",
        pitch:
          "Kick the paint mixer two aisles over into its loud cycle. Surfaces flinching, focus, or unconcern.",
        beat: "The paint mixer two aisles over kicks into its loud cycle. The shelf rattles for one beat. The bagged brackets sway on the peg.",
        directorBeat:
          "Something loud is shaking the shelf. Glance at the noise, comment on it, keep your eyes on the peg, or steady the brackets. Show how distractible you are.",
      },
      {
        id: "hardware-store-one-project-event-5",
        title: "Forklift signal",
        kind: "ambient",
        pitch:
          "Run a forklift backup beep two aisles down and roll a pallet jack past. Surfaces whether the pair lets the small disruption pass.",
        beat: "A forklift backup beep starts up two aisles down, runs three beats, and stops. A pallet jack rolls past the end of aisle 18. The orange apron from earlier is on it.",
        directorBeat:
          "More store noise. Note it briefly, comment to your date about the staff working the floor, or stay on the peg. The bracket choice is still the bracket choice.",
      },
      {
        id: "hardware-store-one-project-event-6",
        title: "Hardware drop",
        kind: "reveal",
        pitch:
          "Drop a small bag of fasteners off the peg above the cart. Forces a small choice on picking up after a stranger's mess.",
        beat: "A small bag of fasteners falls from a peg one row up. The bag lands on the floor between their feet. The peg above is still half full.",
        directorBeat:
          "Something landed at your feet. Pick it up and rehang it, leave it for staff, comment on the falling peg, or hand it to your date to put back. Make the choice.",
      },
      {
        id: "hardware-store-one-project-event-7",
        title: "Apron return",
        kind: "reveal",
        pitch:
          "Pause a second orange apron at the end of the aisle who reads the cart without approaching. Forces a stance on accepting or waving off help.",
        beat: "A second orange apron pauses at the end of the aisle, scans the row, and reads the cart. He does not approach. A small pen is tucked behind one ear.",
        directorBeat:
          "Someone is offering help with their eyes. Wave him over, nod thanks and decline, ask your date if you need a tool, or ignore him. Be honest about whether you ask for help. Do not voice the staffer.",
      },
      {
        id: "hardware-store-one-project-event-8",
        title: "Closing music",
        kind: "provocation",
        pitch:
          "Play a slow piano closing track over the intercom with the next aisle dimming. Forces a final choice.",
        beat: "The intercom plays a slow piano version of a closing time song. The lights in the next aisle dim by a notch. The cart still has only the broken bracket.",
        directorBeat:
          "The store is signaling close. Take the bracket and go, abandon the project for next weekend, propose to your date you grab it on the way back tomorrow, or commit cash and move. Make the call. Do not voice the intercom.",
      },
      {
        id: "hardware-store-one-project-event-9",
        title: "Aisle gate drops",
        kind: "provocation",
        pitch:
          "Drop aisle 18's lighting to half and pull a chain rope across the entry from the next aisle. Forces a physical move on the bracket or the exit.",
        beat: "The lights over aisle 18 drop to half. A staffer drags a chain rope across the entry from the next aisle. The peg is still in reach but the path back to the registers has narrowed.",
        directorBeat:
          "You are being closed out. Grab a bracket and step around the chain, walk back without one, ask your date which they want, or call the project off. Move now. Do not voice the staffer.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the aisle to demonstrate competence at the other's expense.",
      "A member abandons the cart over a small disagreement about the cheaper part.",
    ],
    repeatBehavior:
      "If repeated, the staff in the orange apron remembers the bracket. The project is rarely the same one.",
  },
  judgeRubric: {
    successSignals: [
      "A member admits not knowing the part without performing it.",
      "The pair settles the bracket choice and stays at the cart.",
    ],
    failureSignals: [
      "A member treats the cheaper bracket as a tell about character.",
      "The pair leaves the aisle with no bracket and no plan.",
    ],
    statFocus: ["trust", "stability", "chemistry"],
  },
};
