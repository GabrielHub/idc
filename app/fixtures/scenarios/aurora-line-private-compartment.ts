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
    flow: "conversation",
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
        pitch:
          "Pull frost back into the corners of the window. Surfaces who looks at the cold and who keeps eyes on the partner.",
        beat: "Frost reforms at the edges of the window in slow lines. The heaters hold the center clear. The plain outside is unbroken. The table sits steady on its rails.",
        directorBeat:
          "The cold is creeping in at the edges. Glance at the window, or refuse to look, or comment on the heater holding the line. Show your relationship with the world outside in your next beat.",
      },
      {
        id: "aurora-line-private-compartment-event-2",
        title: "Cart rolls past",
        kind: "ambient",
        pitch:
          "Send the meal cart past your door without stopping. Surfaces whether either calls it back or lets it ride.",
        beat: "The meal cart auto-rolls past the compartment door in the corridor. The chime is one short note. The cart does not park. The cart's brass rail catches the cabin light through the door glass.",
        directorBeat:
          "Food just rolled by. Call it back through the service button, comment on the chime, or let it go. Make a small visible choice about hunger and pacing.",
      },
      {
        id: "aurora-line-private-compartment-event-3",
        title: "Station flashes past",
        kind: "ambient",
        pitch:
          "Snap a snowed-in station past the window in a single beat. Surfaces whether either notices what is gone almost before it arrives.",
        beat: "A station sign flashes past the window at speed. The platform is empty and snowed in. The sign is gone in a beat. The plain returns.",
        directorBeat:
          "Something just appeared and disappeared. React to the flash: name it, ignore it, or fold it into what you were saying. Do not narrate it like a guidebook.",
      },
      {
        id: "aurora-line-private-compartment-event-4",
        title: "Dark herd crosses",
        kind: "provocation",
        pitch:
          "Push a herd taller than the train across the plain at close range. Forces a real reaction, not commentary.",
        beat: "A dark herd crosses the snow in a long slow line a hundred yards out. The shapes are taller than the train. The line moves perpendicular to the rails. The herd is gone in a long breath. The plain settles.",
        directorBeat:
          "Something huge just passed near your window. Show how you handle it in your body or one short line: stand at the glass, lean toward your date, look anywhere but the window, joke flat. Do not narrate the shapes like a documentary.",
      },
      {
        id: "aurora-line-private-compartment-event-5",
        title: "Cart parks at the door",
        kind: "provocation",
        pitch:
          "Park the meal cart at the door with two plates waiting. Forces a physical move on the food, the tray, or the door.",
        beat: "The meal cart parks at the compartment door with a soft chime. The cart's top tray holds two plates and a small thermos. The compartment door slides open a finger on its own. The cart waits.",
        directorBeat:
          "Two plates and a thermos are waiting at the door. Stand and bring the tray in, hand a plate across, or close the door without taking it. Move physically in your next beat.",
      },
      {
        id: "aurora-line-private-compartment-event-6",
        title: "A deeper rumble",
        kind: "provocation",
        pitch:
          "Drop the train into a deeper rumble for three seconds. Forces a small steadying move between the two of you.",
        beat: "The train hits a long deeper rumble for a count of three. The table on its rails slides a finger and locks. The blanket on the shelf shifts an inch. The window stays clear. The rumble passes.",
        directorBeat:
          "The cabin just shook. Steady the table, hand a blanket across, hold the chair rail, or check your date with a look. Use the body in your next beat.",
      },
      {
        id: "aurora-line-private-compartment-event-7",
        title: "Compartment terms binder",
        kind: "reveal",
        pitch:
          "Slip the booking binder into the table slot. Surfaces taste about contracts, terms, and what either reads aloud.",
        beat: "A small leather-bound compartment terms binder is tucked into the slot at the table edge. The cover carries the line's seal. The binder is the kind that prints the booking on the back page.",
        directorBeat:
          "A formal binder just landed within reach. Open it, ignore it, ask your date if they want to look, or comment on the seal. Speak from what you already know about each other and the kind of evening this is.",
      },
      {
        id: "aurora-line-private-compartment-event-8",
        title: "Ruined city out the window",
        kind: "reveal",
        pitch:
          "Roll a ruined city with a single line of bootprints past the window. Surfaces what either chooses to say or refuse to say.",
        beat: "A ruined city is visible an hour into the run. The towers are bent and the lower floors are snowed in. The streets between the towers carry a long single line of bootprints from the gate to the station. The line ends at the station. The train does not slow.",
        directorBeat:
          "Something specific and sad just held the window for a full minute. Engage with it from what you already carry about loss, distance, or your own life. Do not invent new biography. Speak honestly or stay honestly quiet.",
      },
      {
        id: "aurora-line-private-compartment-event-9",
        title: "Old chit in the cushion",
        kind: "reveal",
        pitch:
          "Surface an old meal-order chit tucked in the cushion. Surfaces a callback to a prior visit if the pair has one, or curiosity if they do not.",
        beat: "A small folded chit is tucked into the seat cushion of one of the armchairs. The chit lists a prior meal order in pencil at the top. The pencil mark is fresh enough to read.",
        directorBeat:
          "A scrap from a previous booking just turned up. Read it aloud, ask if it is from your last visit, slide it across the table, or pocket it. Tie it to what you already know about you and your date. Do not voice the chit.",
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
