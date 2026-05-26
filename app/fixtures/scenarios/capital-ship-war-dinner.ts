import type { DateScenario } from "../../domain/game";

export const capitalShipWarDinner: DateScenario = {
  id: "capital-ship-war-dinner",
  title: "Dinner And A Show",
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
        pitch:
          "Open the booking with the paid folder visible and the two-course set on the menu. Forces a stance on consenting to dine while the receipt funds the war below.",
        beat: "The candle on the table is at full burn. The two menus are open to the same set: a bread service, a fish course, and a meat course paired with one wine. The leather folder reads paid, with a number that funds an operation tonight. The booking timer at the side of the table reads two hours.",
        directorBeat:
          "The room and the folder are both in front of you. Pick up the menu, name the folder out loud, ask your date what they want to do with this, or sit without committing. Take a stance on being here. Do not voice the folder.",
      },
      {
        id: "capital-ship-war-dinner-event-2",
        title: "First view",
        kind: "ambient",
        pitch:
          "Hold the panoramic window on three columns of smoke and a downed bridge in silence. Surfaces who looks at the city and who keeps eyes inside the room.",
        beat: "Through the reinforced glass, a city sits below at the level of low cloud. Three columns of dark smoke rise from separate districts. A bridge over a river is partly down. The river is brown. None of the sound reaches the window.",
        directorBeat:
          "The view just landed. Look at it, refuse to look, say what you are seeing in a flat sentence, or speak only to your date. Do not gloss it and do not riff. Stay honest.",
      },
      {
        id: "capital-ship-war-dinner-event-3",
        title: "Bread service",
        kind: "ambient",
        pitch:
          "Land the bread service from the wall track. Forces a small choice on eating, refusing, or stalling at the first course.",
        beat: "A small panel slides open in the wall and the bread service arrives on a warm tray. Two small loaves, salted butter in a stone dish, a tiny bowl of olive oil. The track closes. The candle has not moved.",
        directorBeat:
          "Food is in front of you and the room is quiet. Take a slice, push the tray to your date, decline aloud, or comment on how easy it is to eat here. Make the choice clear without making it a verdict on the partner.",
      },
      {
        id: "capital-ship-war-dinner-event-4",
        title: "Wine pour",
        kind: "reveal",
        pitch:
          "Put the breathed decanter on the table with two dry glasses. Surfaces who pours, who waits, who declines the wine.",
        beat: "A glass decanter sits between them with the paired wine, already breathed. Two glasses are dry on the table. The pour is up to them. The booking timer reads one forty.",
        directorBeat:
          "A decanter is asking for a hand. Pour for your date, pour your own, decline the wine entirely, or wait for them to move. Show care or distance with the pour. Do not voice the room.",
      },
      {
        id: "capital-ship-war-dinner-event-5",
        title: "Burst",
        kind: "reveal",
        pitch:
          "Flash two small explosions in a southern district without sound. Surfaces the real test: how either reacts when violence registers in the window.",
        beat: "A small flash, low and to the south, far enough below that no sound carries up. A second flash a moment later, smaller, near the same district. A faint column of new smoke begins to rise. The candle does not flicker.",
        directorBeat:
          "Something just happened to real people. React in body or one short line: set your fork down, look away, name what you saw without aestheticizing it, or hold your date's eye. Mocking, neutralizing, and grandstanding are all failures.",
      },
      {
        id: "capital-ship-war-dinner-event-6",
        title: "Fish course",
        kind: "provocation",
        pitch:
          "Send the fish course out on the track with one ten still on the timer. Forces one direct line on staying through the rest or walking.",
        beat: "The wall panel opens and the fish course slides out. A whole small fish on a green sauce, two side plates, two small lemons in a stone cup. The track closes. The booking timer reads one ten.",
        directorBeat:
          "The second course just landed. Ask your date if they want to keep eating, name your own choice, propose leaving, or commit to the meal. Pick and say it. Do not voice the track.",
      },
      {
        id: "capital-ship-war-dinner-event-7",
        title: "Quiet stretch",
        kind: "ambient",
        pitch:
          "Drop a long silence between the two of you with the fish half eaten. Surfaces whether either fills the quiet with a personal pitch or lets it be honest.",
        beat: "Neither has spoken in a few minutes. The fish is half eaten on each plate. The window has not changed. The booking timer reads zero forty-eight. The folder on the side is unmoved.",
        directorBeat:
          "The quiet between you is doing its own work. Stay with it, look at your date, reach across the table, or break it with one short honest sentence. Do not fill the silence with a pitch. Do not voice the candle.",
      },
      {
        id: "capital-ship-war-dinner-event-8",
        title: "Walk out",
        kind: "provocation",
        pitch:
          "Cross the timer to zero ten with the meat course still on the track. Forces a clean choice on finishing the meal or standing now.",
        beat: "The booking timer reads zero ten. The meat course is still on the track and has not been delivered. The candle is at half. The folder on the side has a small leaf for tip notes if either of them has one. The exit is across the room.",
        directorBeat:
          "Ten minutes left. Stand to leave, ask your date if they want to go now, hold for the meat, or write a tip note and walk. Decide cleanly in your next line. Do not voice the timer.",
      },
      {
        id: "capital-ship-war-dinner-event-9",
        title: "Course delivered",
        kind: "provocation",
        pitch:
          "Slide the meat course out at half a candle. Forces a clean call: take it, refuse it, or leave the table.",
        beat: "The wall panel opens and the meat course arrives on a warm tray. The cut is small, the sauce dark, two side plates set down. The track closes. The candle is at half.",
        directorBeat:
          "The course is on the table and the room is asking what you want. Take the plate, send it back through the track, push it toward your date, or stand. Refusing is a real answer. Make the call.",
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
