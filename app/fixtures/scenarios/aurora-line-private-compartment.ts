import type { DateScenario } from "../../domain/game";

export const auroraLinePrivateCompartment: DateScenario = {
  id: "aurora-line-private-compartment",
  title: "Aurora Line, Private Compartment",
  card: {
    summary:
      "A private compartment on a sealed luxury train that has been circling a frozen earth for eleven years. Two facing armchairs, one window, an auto-rolling meal cart.",
    tags: ["cosmic", "low_pressure", "domestic", "repeat_risk"],
    risk: "medium",
    intimacy: "high",
    chaos: "low",
    cost: 30,
    idealFor: [
      "members who can sit close in a sealed room without filling the air",
      "members who can let a long quiet stretch ride the rails",
      "members who can hand a blanket across without making it a gesture",
    ],
    badFor: [
      "members who treat the ice as a personal pitch",
      "members who narrate every shape outside the window",
      "members who use the sealed room to pin the partner",
    ],
  },
  publicBrief: {
    location: "Compartment 14, Aurora Line, frozen earth route",
    premise:
      "Cupid booked a private compartment on the Aurora Line, a sealed luxury train that has been circling a frozen earth for eleven years without stopping.",
    whatBothCharactersKnow:
      "Compartment 14 has two facing armchairs, a polished wood table on rails between them, a tall window with frost on the outside that the heaters keep clear, two heavy blankets folded on a low shelf, a service button that calls a meal cart. The cart auto-rolls and parks itself. The window does not open. The train never stops. The booking covers two hours.",
    openingSituation:
      "Both members are seated facing each other in compartment 14. The table is bare. The blankets are folded. The window shows a long white plain. The service button has a small green ring on it.",
  },
  director: {
    tone: "the steady hum of the train under the rails, the warm cabin against the cold beyond the glass, the small clicks of the table on its rails, no wind reaching them",
    rules: [
      "Anchor the date to compartment 14. The pair does not leave the compartment.",
      "Treat the frozen world outside as fact. The ice is not a metaphor.",
      "Allow long quiet. The hum is enough.",
      "Do not voice the cart, the train, or any background line as continuing speakers.",
    ],
    events: [
      {
        id: "aurora-line-private-compartment-event-1",
        title: "Frost at the edges",
        kind: "ambient",
        event: "Frost reforms at the edges of the window.",
        characterVisibleText:
          "Frost reforms at the edges of the window in slow lines. The heaters hold the center clear. The plain outside is unbroken. The table sits steady on its rails.",
        directorInstruction:
          "Allow the small marker. The window is not voiced as a continuing speaker.",
      },
      {
        id: "aurora-line-private-compartment-event-2",
        title: "Cart rolls past",
        kind: "ambient",
        event: "The meal cart auto-rolls past in the corridor.",
        characterVisibleText:
          "The meal cart auto-rolls past the compartment door in the corridor. The chime is one short note. The cart does not park. The cart's brass rail catches the cabin light through the door glass.",
        directorInstruction:
          "Allow the small marker. The cart is not voiced as a continuing speaker.",
      },
      {
        id: "aurora-line-private-compartment-event-3",
        title: "Station flashes past",
        kind: "ambient",
        event: "A station sign flashes past the window.",
        characterVisibleText:
          "A station sign flashes past the window at speed. The platform is empty and snowed in. The sign is gone in a beat. The plain returns.",
        directorInstruction:
          "Allow the small marker. The sign is not voiced as a continuing speaker.",
      },
      {
        id: "aurora-line-private-compartment-event-4",
        title: "Dark herd crosses",
        kind: "provocation",
        event: "A dark herd crosses the snow at the two-hour mark.",
        characterVisibleText:
          "A dark herd crosses the snow in a long slow line a hundred yards out. The shapes are taller than the train. The line moves perpendicular to the rails. The herd is gone in a long breath. The plain settles.",
        directorInstruction:
          "Push for a real reaction. The pair does not narrate the shapes. The herd is not voiced as a continuing speaker.",
      },
      {
        id: "aurora-line-private-compartment-event-5",
        title: "Cart parks at the door",
        kind: "provocation",
        event: "The meal cart parks at the compartment door.",
        characterVisibleText:
          "The meal cart parks at the compartment door with a soft chime. The cart's top tray holds two plates and a small thermos. The compartment door slides open a finger on its own. The cart waits.",
        directorInstruction:
          "Push for a real physical move. Either may bring the tray in, hand a plate over, or close the door. The cart is not voiced as a continuing speaker.",
      },
      {
        id: "aurora-line-private-compartment-event-6",
        title: "A deeper rumble",
        kind: "provocation",
        event: "The train hits a deeper rumble crossing something.",
        characterVisibleText:
          "The train hits a long deeper rumble for a count of three. The table on its rails slides a finger and locks. The blanket on the shelf shifts an inch. The window stays clear. The rumble passes.",
        directorInstruction:
          "Push for a real small move. Either may steady the table, hand a blanket across, or hold the chair rail. The train is not voiced as a continuing speaker.",
      },
      {
        id: "aurora-line-private-compartment-event-7",
        title: "Compartment terms binder",
        kind: "reveal",
        event: "A small terms binder is tucked into the table edge.",
        characterVisibleText:
          "A small leather-bound compartment terms binder is tucked into the slot at the table edge. The cover carries the line's seal. The binder is the kind that prints the booking on the back page.",
        directorInstruction:
          "Use the small option to surface a stance drawn only from existing context. The binder is not voiced as a continuing speaker.",
      },
      {
        id: "aurora-line-private-compartment-event-8",
        title: "Ruined city out the window",
        kind: "reveal",
        event: "A ruined city is visible at the one-hour mark.",
        characterVisibleText:
          "A ruined city is visible an hour into the run. The towers are bent and the lower floors are snowed in. The streets between the towers carry a long single line of bootprints from the gate to the station. The line ends at the station. The train does not slow.",
        directorInstruction:
          "Use the small view to surface a stance drawn only from existing context. The city is not voiced as a continuing speaker.",
      },
      {
        id: "aurora-line-private-compartment-event-9",
        title: "Old chit in the cushion",
        kind: "reveal",
        event: "An old chit is folded into the seat cushion.",
        characterVisibleText:
          "A small folded chit is tucked into the seat cushion of one of the armchairs. The chit lists a prior meal order in pencil at the top. The pencil mark is fresh enough to read.",
        directorInstruction:
          "Use the small callback to surface a stance drawn only from existing context and pair history. The chit is not voiced as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the ice as a personal pitch.",
      "A member uses the sealed room to pin the partner.",
    ],
    repeatBehavior:
      "If repeated, compartment 14 is held for the pair. The chairs face each other, the blankets are folded on the shelf, the meal cart auto-rolls. The old chit folded into the seat cushion is from the prior visit.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a long quiet ride the rails.",
      "A member hands a blanket across without making it a gesture.",
    ],
    failureSignals: [
      "A member narrates every shape outside the window.",
      "The pair argues about whether to leave the compartment.",
    ],
    statFocus: ["chemistry", "trust", "stability", "relationshipHealth"],
  },
};
