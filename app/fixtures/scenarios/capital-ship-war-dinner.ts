import type { DateScenario } from "../../domain/game";

export const capitalShipWarDinner: DateScenario = {
  id: "capital-ship-war-dinner",
  title: "Dinner Above The War",
  card: {
    summary:
      "A small dining room aboard a futuristic country's airborne capital battleship. One table by a panoramic window. The country has opened civilian seating to fund the war below.",
    tags: ["public", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "medium",
    cost: 25,
    idealFor: [
      "members who can hold a serious view without making it about themselves",
      "members who treat a meal under hard conditions with care",
      "members who can name when a date should end",
    ],
    badFor: [
      "members who use a war view as a personal pitch",
      "members who turn an actual war into set dressing",
      "members who confuse luxury with neutrality",
    ],
  },
  publicBrief: {
    location: "Window table 4, civilian dining room, Sovereign Deck of the capital battleship",
    premise:
      "Cupid was offered a window table on the civilian dining deck of an airborne capital battleship. The country has opened the room to fund the war. The bill is paid at seating and the proceeds fund the war below.",
    whatBothCharactersKnow:
      "The country is at war and uses the civilian dining deck to fund operations. The bill was paid at seating from the booking deposit. The proceeds fund the war. The window is reinforced glass at full panoramic width. Service runs on a wall track. No staff are on the floor. The war below is real and ongoing. The pair can leave at any time, including before the second course.",
    openingSituation:
      "Both members are seated at window table 4. White linen, real silverware, a single candle, two menus already open to the night's two-course set. The leather folder with the paid bill rests on the side. Below the window, a city is at war.",
  },
  director: {
    tone: "low engine hum through the deck, the reinforced glass at full silence, candlelight, distant smoke columns visible through the window",
    rules: [
      "Anchor the date to window table 4. The pair does not walk the deck.",
      "Treat the war as real and ongoing. Death and serious injury are never the joke.",
      "Use the luxury as the comedy register. The violence below is not.",
      "Do not voice staff, soldiers, or anyone in the city below. The room is silent service. The view is unspoken.",
      "Allow either member to name a clean exit at any event. Leaving is a real outcome, not a fail.",
    ],
    events: [
      {
        id: "capital-ship-war-dinner-event-1",
        title: "Seated",
        kind: "reveal",
        event: "The booking begins at window table 4.",
        characterVisibleText:
          "The candle on the table is at full burn. The two menus are open to the same set: a bread service, a fish course, and a meat course paired with one wine. The leather folder reads paid, with a number that funds an operation tonight. The booking timer at the side of the table reads two hours.",
        directorInstruction:
          "Open the date with the question of consent in the room. Either may sit, hesitate, or speak about the folder, drawn from each member's existing stance. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "capital-ship-war-dinner-event-2",
        title: "First view",
        kind: "ambient",
        event: "The view through the panoramic window registers.",
        characterVisibleText:
          "Through the reinforced glass, a city sits below at the level of low cloud. Three columns of dark smoke rise from separate districts. A bridge over a river is partly down. The river is brown. None of the sound reaches the window.",
        directorInstruction:
          "Allow the view to land. Do not gloss it. Either may look, look away, or speak. The view does not become a continuing speaker.",
      },
      {
        id: "capital-ship-war-dinner-event-3",
        title: "Bread service",
        kind: "ambient",
        event: "Bread arrives on the wall track.",
        characterVisibleText:
          "A small panel slides open in the wall and the bread service arrives on a warm tray. Two small loaves, salted butter in a stone dish, a tiny bowl of olive oil. The track closes. The candle has not moved.",
        directorInstruction:
          "Allow the small first course. Eating is not a failure. Refusing to eat is not a virtue.",
      },
      {
        id: "capital-ship-war-dinner-event-4",
        title: "Wine pour",
        kind: "reveal",
        event: "The decanter is on the table.",
        characterVisibleText:
          "A glass decanter sits between them with the paired wine, already breathed. Two glasses are dry on the table. The pour is up to them. The booking timer reads one forty.",
        directorInstruction:
          "Use the small ritual to surface how either of them pours for the partner without making it a performance. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "capital-ship-war-dinner-event-5",
        title: "Burst",
        kind: "reveal",
        event: "A small flash visible far below.",
        characterVisibleText:
          "A small flash, low and to the south, far enough below that no sound carries up. A second flash a moment later, smaller, near the same district. A faint column of new smoke begins to rise. The candle does not flicker.",
        directorInstruction:
          "Allow the small visible event without naming it for the pair. Their reaction is the test. Mocking, neutralizing, or grandstanding are all real failures.",
      },
      {
        id: "capital-ship-war-dinner-event-6",
        title: "Fish course",
        kind: "provocation",
        event: "The fish course arrives on the track.",
        characterVisibleText:
          "The wall panel opens and the fish course slides out. A whole small fish on a green sauce, two side plates, two small lemons in a stone cup. The track closes. The booking timer reads one ten.",
        directorInstruction:
          "Push for one direct line about whether either of them wants to continue or to leave. Either answer is real. The meat course is still ahead. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "capital-ship-war-dinner-event-7",
        title: "Quiet stretch",
        kind: "ambient",
        event: "A long quiet sits between them.",
        characterVisibleText:
          "Neither has spoken in a few minutes. The fish is half eaten on each plate. The window has not changed. The booking timer reads zero forty-eight. The folder on the side is unmoved.",
        directorInstruction:
          "Allow the quiet to be honest. Filling it with a personal pitch is the failure. The quiet is the right move if it is honest. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "capital-ship-war-dinner-event-8",
        title: "Walk out",
        kind: "provocation",
        event: "The booking timer crosses zero ten.",
        characterVisibleText:
          "The booking timer reads zero ten. The meat course is still on the track and has not been delivered. The candle is at half. The folder on the side has a small leaf for tip notes if either of them has one. The exit is across the room.",
        directorInstruction:
          "Push for a clean exit. The pair leaves the table together or one of them leaves first. Finishing the meal, leaving early, or leaving without speaking are all real outcomes if they are honest. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "capital-ship-war-dinner-event-9",
        title: "Course delivered",
        kind: "provocation",
        event: "The meat course slides out of the wall track.",
        characterVisibleText:
          "The wall panel opens and the meat course arrives on a warm tray. The cut is small, the sauce dark, two side plates set down. The track closes. The candle is at half.",
        directorInstruction:
          "Push for a clean call: take the course, send it back, or leave the table. Refusing the course is a real answer.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the war view as a personal pitch.",
      "A member treats the city below as a backdrop for a joke.",
      "A member confuses luxury with neutrality.",
    ],
    repeatBehavior:
      "If repeated, the table is window table 4. The folder records the pair's prior visit. The war below has progressed. The view is not the same view.",
  },
  judgeRubric: {
    successSignals: [
      "A member names the room honestly and the partner does not flinch.",
      "The pair leaves at the moment the date stops being honest.",
    ],
    failureSignals: [
      "A member uses the view to extract a confession or a vow.",
      "The pair pretends the room is normal in order to keep the date easy.",
    ],
    statFocus: ["trust", "conflict", "relationshipHealth"],
  },
};
