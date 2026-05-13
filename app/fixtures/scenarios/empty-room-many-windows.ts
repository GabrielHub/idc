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
        event: "Both members find a place in the room.",
        characterVisibleText:
          "Two cushions sit on the wooden floor at the center of the room. Six windows are mounted around the walls. A small brass plate under each window names the city: Lagos, Reykjavik, Tokyo, Mexico City, Paris, Buenos Aires. The ambient leaks at low volume from each.",
        directorInstruction:
          "Open the date with a small physical choice. Either may take a cushion, walk to a window, or stand. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "empty-room-many-windows-event-2",
        title: "Plates and counters",
        kind: "reveal",
        event: "Each brass plate has a small counter under the city name.",
        characterVisibleText:
          "Each brass plate has a small worn counter under the city name. The counter shows the number of bookings that have stood at this window. The Lagos counter reads four hundred and twelve. The Reykjavik counter reads thirty one. The other counters sit between those two.",
        directorInstruction:
          "Use the small numbers to surface taste, drawn from each member's existing context. Either may pick the most-stood-at window, the least, or neither. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "empty-room-many-windows-event-3",
        title: "Aurora over Reykjavik",
        kind: "ambient",
        event: "The Reykjavik window picks up an aurora.",
        characterVisibleText:
          "The Reykjavik window dims as night moves in. A pale green ribbon lifts off the horizon and walks across the dark. The harbor wind is a soft hum under it. The light reaches the room in a faint cool wash.",
        directorInstruction:
          "Allow the view to be present without being topic. Either may turn or not.",
      },
      {
        id: "empty-room-many-windows-event-4",
        title: "Paris rain",
        kind: "reveal",
        event: "The Paris window picks up rain.",
        characterVisibleText:
          "The Paris window is at dusk. Rain starts on the cobblestones and lifts into a soft hiss in the room. The cafe across the way has its sidewalk chairs already inside for the night. The street lamp is on.",
        directorInstruction:
          "Use the small weather change to surface a comfort drawn from existing context. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "empty-room-many-windows-event-5",
        title: "Tokyo evening",
        kind: "ambient",
        event: "The Tokyo window slips from evening to night.",
        characterVisibleText:
          "The Tokyo window holds an early evening side street. A vending machine glows a steady blue. A bicycle passes the frame once and the wheel hum stays a few beats after. The street lamp clicks on as the light dims.",
        directorInstruction: "Allow the small transition. The pair does not need to comment on it.",
      },
      {
        id: "empty-room-many-windows-event-6",
        title: "Lagos market peak",
        kind: "provocation",
        event: "The Lagos window peaks in volume.",
        characterVisibleText:
          "The Lagos window's market is at midday. The volume climbs as a stall right at the window opens its tarp wide. The market sound holds at a real volume for a beat. A vendor sets a tray of fruit on the stall and turns to the next person in line without looking up.",
        directorInstruction:
          "Push for a small physical answer: move closer, move to another window, or sit through it. The vendor does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "empty-room-many-windows-event-7",
        title: "Mexico City music",
        kind: "reveal",
        event: "The Mexico City window picks up a song.",
        characterVisibleText:
          "The Mexico City window is mid-afternoon. A radio across the courtyard switches on. A song carries in at low volume. The melody is recognizable from the street and not from the room. The counter on the brass plate has not changed.",
        directorInstruction:
          "Use the small song to surface a comfort drawn from existing context. The radio is not voiced as a continuing speaker.",
      },
      {
        id: "empty-room-many-windows-event-8",
        title: "Buenos Aires gust",
        kind: "provocation",
        event: "The Buenos Aires window pushes a gust against the booking glass.",
        characterVisibleText:
          "A gust pushes against the booking glass at the Buenos Aires window. The curtain on the city side lifts and falls. A loose newspaper page lifts in the street and settles past the frame. The other five windows are unchanged.",
        directorInstruction:
          "Push for a small physical adjustment in the room: a glance, a shift on the cushion, a hand on the floor. The street does not enter the room.",
      },
      {
        id: "empty-room-many-windows-event-9",
        title: "Ten-minute chime",
        kind: "provocation",
        event: "A soft chime marks ten minutes left on the booking.",
        characterVisibleText:
          "A soft chime sounds in the room. A small panel under the door shows ten minutes remaining. The six windows are unchanged. The door is unlocked from this side and the latch is still soft.",
        directorInstruction:
          "Push for a clean exit choice. The pair leaves together or one of them moves first. Either is the right answer if it is honest. Do not voice any background person or cue as a continuing speaker.",
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
