import type { DateScenario } from "../../domain/game";

export const hotelBarLastCall: DateScenario = {
  id: "hotel-bar-last-call",
  title: "Hotel Bar, Last Call",
  card: {
    summary:
      "Two stools at a residential hotel bar after the band has packed up. The ice machine hums. The pianist has gone home.",
    tags: ["food", "haunted", "low_pressure"],
    risk: "low",
    intimacy: "high",
    chaos: "low",
    cost: 12,
    idealFor: [
      "members whose stoic clipped voice fits a closed piano and a brass rail",
      "members who already live in old rooms and recognize the room's quiet",
      "members whose warm steady voice can carry a long pause without filling it",
      "members with a long memory and a quiet hand",
    ],
    badFor: [
      "members who will film the lamp clicking on and ruin the room",
      "members with no audience and no patience for sharing the brass rail",
      "members whose silence anxiety will drown the bell taps",
    ],
  },
  publicBrief: {
    location: "The lobby bar at the Marlowe, eight stools and a closed piano",
    premise:
      "Cupid booked the last seating before close. The night clerk at the front desk has been told.",
    whatBothCharactersKnow:
      "Last call is forty minutes out. The kitchen has olives, almonds, and a small cheese plate. The pianist is not coming back tonight.",
    openingSituation:
      "Both members sit at the bar. Two coasters are already in front of them. The bartender is wiping a glass at the far end.",
  },
  director: {
    tone: "low warm sconces, polished brass rail, the smell of old upholstery and lemon peel",
    rules: [
      "Treat the hotel as gently lived in, not theatrical. The piano is closed and stays closed.",
      "Allow long silences. The bar can hold them.",
      "Use room cues, not the bartender's voice. The bartender is a pair of hands.",
    ],
    events: [
      {
        id: "hotel-bar-last-call-event-1",
        title: "First drink",
        kind: "ambient",
        pitch:
          "Land two drinks without ceremony and have the bartender turn back to his work. Surfaces a small mercy that can drop the pair's guard.",
        beat: "The bartender places two glasses on the coasters and turns to wipe a different glass. Two slim straws lean against the rim.",
        directorBeat:
          "Drinks are in front of you with no ceremony. Lift the glass, slide a straw across, nod to your date, or sit with the room a beat first. Do not voice the bartender.",
      },
      {
        id: "hotel-bar-last-call-event-2",
        title: "Lobby quiet",
        kind: "reveal",
        pitch:
          "Click on a floor lamp by the closed piano in an empty lobby. Surfaces a name for the quiet without explaining it.",
        beat: "A floor lamp by the piano clicks on. The bench is closed. No one is near it. The lobby clock reads ten of the hour.",
        directorBeat:
          "The room just got softer on its own. Notice it, comment on the lamp to your date, sit deeper into the stool, or look at the closed bench. Do not turn the lamp into a ghost story. Do not voice the lamp.",
      },
      {
        id: "hotel-bar-last-call-event-3",
        title: "Last call",
        kind: "provocation",
        pitch:
          "Tap the brass rail bell twice and dim the kitchen pass-through. Forces a clear next step or a clean goodbye.",
        beat: "The brass rail bell taps twice down the bar. The kitchen pass-through goes dark. The cheese plate is taken away in one quiet pass.",
        directorBeat:
          "The bar just called time. Order one more, ask your date if they want to stay, propose where to go next, or pay out. Move the moment forward.",
      },
      {
        id: "hotel-bar-last-call-event-4",
        title: "Ice machine pause",
        kind: "ambient",
        pitch:
          "Quiet the ice machine for the first time tonight. Surfaces whether either fills the silence or lets it be the room's.",
        beat: "The ice machine behind the bar quiets for the first time tonight. The ambient hum drops by half. The bartender's wiping cloth makes the only sound.",
        directorBeat:
          "The hum just dropped. Let the silence sit, lean toward your date in the new quiet, comment on the cloth, or sip. A member who fills the silence gives themselves away. Do not voice the cloth.",
      },
      {
        id: "hotel-bar-last-call-event-5",
        title: "Coaster swap",
        kind: "reveal",
        pitch:
          "Swap fresh coasters in and lift the old ones in one motion with the lemon peel gone. Surfaces whether either treats reset as care.",
        beat: "The bartender slides two fresh coasters in front of them and lifts the old ones in one move. A small cocktail napkin lands beside one glass. The lemon peel from earlier is gone.",
        directorBeat:
          "A small unasked care just landed. Receive it, comment to your date on the cleanness, slide the napkin across, or ignore the swap. Show whether you notice tending. Do not voice the bartender.",
      },
      {
        id: "hotel-bar-last-call-event-6",
        title: "Lobby crossing",
        kind: "ambient",
        pitch:
          "Cross a guest in a wool coat toward the elevators without looking at the bar. Surfaces whether the pair stays inside their own conversation.",
        beat: "A guest in a wool coat crosses the lobby toward the elevators. He carries a small leather valise. He does not look at the bar. The lobby clock now reads quarter past.",
        directorBeat:
          "Someone just walked through your peripheral. Keep your eyes on your date, comment on the wool coat, glance and look back, or let him pass without a word. Do not voice the guest.",
      },
      {
        id: "hotel-bar-last-call-event-7",
        title: "Glass swap",
        kind: "reveal",
        pitch:
          "Replace one glass with a fresh one and refill to the same line. Surfaces how either receives small unasked kindness.",
        beat: "The bartender lifts one of their glasses, replaces it with a fresh one, and refills it to the same line. The motion takes four seconds. He does not catch their eye.",
        directorBeat:
          "Your drink just got better without asking. Thank him aloud, hand the line to your date, comment on the four seconds, or accept silently. Show how you receive care from a stranger. Do not voice the bartender.",
      },
      {
        id: "hotel-bar-last-call-event-8",
        title: "Sconces up",
        kind: "provocation",
        pitch:
          "Lift the wall sconces a notch and reveal a folded check at the far stool. Forces one clean line before the bar tilts toward closing.",
        beat: "The wall sconces lift by one notch. The brass rail is now clearly visible end to end. Two coasters and a folded check sit at the far stool.",
        directorBeat:
          "The room just got brighter. Say the honest sentence you have been holding, propose the next stop, or settle the check. Speak before the lights take the cover off.",
      },
      {
        id: "hotel-bar-last-call-event-9",
        title: "Stools up",
        kind: "provocation",
        pitch:
          "Flip the far stools onto the bar and lay your check on the brass between you and the door. Forces a clean exit move.",
        beat: "At the far end of the bar, the bartender flips the first stool upside down onto the rail. The second follows. The folded check at the far stool is set on top of the brass between them and the door.",
        directorBeat:
          "The bar is being unstacked into close. Settle the check, take a last sip together, or stand and walk out. Move physically in this beat. Do not voice the bartender.",
      },
    ],
    earlyEndTriggers: [
      "A member tries to perform sincerity for the room.",
      "A member treats the lamp clicking on as evidence and asks for proof.",
    ],
    repeatBehavior:
      "If repeated, the bartender sets the same drinks without checking. The lamp may or may not click on. Either way it is not a bit.",
  },
  judgeRubric: {
    successSignals: [
      "A member lets a long silence sit without filling it.",
      "The pair names something old together without mocking it.",
    ],
    failureSignals: [
      "A member uses the soft lighting as cover for a confession that asks too much.",
      "A member treats the staff as theatrical scenery.",
    ],
    statFocus: ["trust", "chemistry", "relationshipHealth"],
  },
};
