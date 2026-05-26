import type { DateScenario } from "../../domain/game";

export const emptyRoomManyWindows: DateScenario = {
  id: "empty-room-many-windows",
  title: "Empty Room, Many Windows",
  card: {
    summary:
      "A bare gray room. Six windows on the four walls, each open on a different live city. Two cushions in the center. Sixty minutes.",
    tags: ["cosmic", "low_pressure"],
    risk: "low",
    intimacy: "high",
    chaos: "low",
    cost: 8,
    idealFor: [
      "members who can sit with a view without making it a topic",
      "members who let attention be the conversation",
      "members who can share one window without fencing it",
    ],
    badFor: [
      "members who narrate every view at the partner",
      "members who use travel as a personal résumé",
      "members who need an itinerary before they can settle",
    ],
  },
  publicBrief: {
    location: "Booking Room 11, the Frame Office, six-window arrangement on the four walls",
    premise:
      "Cupid booked a sixty-minute room. The room has six windows. Each window opens on a different live city in real time. The room is otherwise empty.",
    whatBothCharactersKnow:
      "The windows are stable. Each one stays on its city for the booking. The cities are Lagos, Reykjavik, Tokyo, Mexico City, Paris, and Buenos Aires. The ambient sound from each window leaks at low volume. The room has two cushions on the wooden floor in the center. There is no other furniture. The door behind them is unmarked and closes on a soft latch.",
    openingSituation:
      "Both members are in the room. The two cushions sit a polite distance apart. The six windows are dim or bright depending on the time of day in each city. The room is at a comfortable temperature.",
  },
  director: {
    tone: "the soft mixed ambient of six cities at low volume, the warm wood of the floor, the slight pressure on the ears of being many places at once",
    rules: [
      "Anchor the date to the room and the cushions. The pair does not walk through any window.",
      "Treat the six cities as live but unrelated to the pair. The cities are themselves, not metaphors.",
      "Allow long quiet stretches. The room does not need filling.",
      "Use each window as a small place, not a backdrop. The view is where someone is living, not a postcard.",
    ],
    events: [
      {
        id: "empty-room-many-windows-event-1",
        title: "First settle",
        kind: "ambient",
        pitch:
          "Anchor the cushions in the center with all six city plates labeled around the room. Forces a small physical choice on where to start.",
        beat: "Two cushions sit on the wooden floor at the center of the room. Six windows are mounted around the walls. A small brass plate under each window names the city: Lagos, Reykjavik, Tokyo, Mexico City, Paris, Buenos Aires. The ambient leaks at low volume from each.",
        directorBeat:
          "Pick where to be in this room. Take a cushion, walk to a window, gesture your date toward one of the plates, or stand a beat to choose. Move your body into a position. Do not voice the plates.",
      },
      {
        id: "empty-room-many-windows-event-2",
        title: "Plates and counters",
        kind: "reveal",
        pitch:
          "Surface visit counters under each plate, from Lagos at four hundred and twelve to Reykjavik at thirty-one. Surfaces taste in which window pulls either of you.",
        beat: "Each brass plate has a small worn counter under the city name. The counter shows the number of bookings that have stood at this window. The Lagos counter reads four hundred and twelve. The Reykjavik counter reads thirty one. The other counters sit between those two.",
        directorBeat:
          "The numbers are telling you which views are well loved. Comment on one, ask your date which pulls them, walk to the least visited, or shrug at the lot. Speak only from what you already carry. Do not voice the plates.",
      },
      {
        id: "empty-room-many-windows-event-3",
        title: "Aurora over Reykjavik",
        kind: "ambient",
        pitch:
          "Lift a green ribbon across the Reykjavik horizon as night moves in. Surfaces whether either turns or stays still.",
        beat: "The Reykjavik window dims as night moves in. A pale green ribbon lifts off the horizon and walks across the dark. The harbor wind is a soft hum under it. The light reaches the room in a faint cool wash.",
        directorBeat:
          "Something rare is happening at one window. Turn to it, point it out to your date, sit with the wash of cool light, or keep facing whoever you are with. Show what your attention is for.",
      },
      {
        id: "empty-room-many-windows-event-4",
        title: "Paris rain",
        kind: "reveal",
        pitch:
          "Drop dusk rain on the Paris cobblestones and slip the cafe chairs inside. Surfaces a small comfort drawn from existing context.",
        beat: "The Paris window is at dusk. Rain starts on the cobblestones and lifts into a soft hiss in the room. The cafe across the way has its sidewalk chairs already inside for the night. The street lamp is on.",
        directorBeat:
          "A small civic rhythm just played out. Comment on the chairs going in, ask your date if they have walked this kind of street, sit and listen to the hiss, or move to another window. Speak from what you already carry.",
      },
      {
        id: "empty-room-many-windows-event-5",
        title: "Tokyo evening",
        kind: "ambient",
        pitch:
          "Click on the Tokyo street lamp as the light dims and a bicycle passes the frame. Surfaces whether the pair lets a small transition be enough.",
        beat: "The Tokyo window holds an early evening side street. A vending machine glows a steady blue. A bicycle passes the frame once and the wheel hum stays a few beats after. The street lamp clicks on as the light dims.",
        directorBeat:
          "The light changed. Comment on the lamp, listen to the wheel hum, point at the vending machine glow, or stay where you are. Do not narrate the side street like a guidebook.",
      },
      {
        id: "empty-room-many-windows-event-6",
        title: "Lagos market peak",
        kind: "provocation",
        pitch:
          "Peak the Lagos volume as a stall opens its tarp wide. Forces a small physical answer: move closer, move away, or sit through it.",
        beat: "The Lagos window's market is at midday. The volume climbs as a stall right at the window opens its tarp wide. The market sound holds at a real volume for a beat. A vendor sets a tray of fruit on the stall and turns to the next person in line without looking up.",
        directorBeat:
          "One window is suddenly loud. Move closer to it, move to a quieter window, comment on the surge, or check your date. Make a body choice. Do not voice the vendor.",
      },
      {
        id: "empty-room-many-windows-event-7",
        title: "Mexico City music",
        kind: "reveal",
        pitch:
          "Carry a low radio melody across the Mexico City courtyard. Surfaces a small comfort drawn only from what either already carries.",
        beat: "The Mexico City window is mid-afternoon. A radio across the courtyard switches on. A song carries in at low volume. The melody is recognizable from the street and not from the room. The counter on the brass plate has not changed.",
        directorBeat:
          "A song just drifted into the room. Hum if you know it, ask your date if they recognize it, comment on the cross-courtyard sound, or sit with the music. Speak only from your own register.",
      },
      {
        id: "empty-room-many-windows-event-8",
        title: "Buenos Aires gust",
        kind: "provocation",
        pitch:
          "Push a gust against the Buenos Aires booking glass with a curtain lift on the city side. Forces a small physical adjustment.",
        beat: "A gust pushes against the booking glass at the Buenos Aires window. The curtain on the city side lifts and falls. A loose newspaper page lifts in the street and settles past the frame. The other five windows are unchanged.",
        directorBeat:
          "Something physical just happened at one window. Glance, shift on the cushion, put a hand on the floor, or stand. Do not let the gust pass without a body response.",
      },
      {
        id: "empty-room-many-windows-event-9",
        title: "Ten-minute chime",
        kind: "provocation",
        pitch:
          "Chime ten minutes left under the door panel. Forces a clean exit choice from the cushions.",
        beat: "A soft chime sounds in the room. A small panel under the door shows ten minutes remaining. The six windows are unchanged. The door is unlocked from this side and the latch is still soft.",
        directorBeat:
          "Ten minutes left in the booking. Pick a last window, stand up to leave together, ask your date which they want to end on, or sit through to the latch. Make the call.",
      },
    ],
    earlyEndTriggers: [
      "A member uses a city to perform a résumé at the partner.",
      "A member treats the room as a problem the partner must fill.",
    ],
    repeatBehavior:
      "If repeated, the room remembers the booking. The same six cities, the same cushions. The brass counters tick up by one.",
  },
  judgeRubric: {
    successSignals: [
      "The pair shares a single window without making it a moment.",
      "A member lets the partner sit at a window in quiet without filling the silence.",
    ],
    failureSignals: [
      "A member runs every city as a personal travel pitch.",
      "The pair argues about which window is best.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
