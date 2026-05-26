import type { DateScenario } from "../../domain/game";

export const parkLoopWithADog: DateScenario = {
  id: "park-loop-with-a-dog",
  title: "Park Bench With A Dog",
  card: {
    summary: "One bench at the lake overlook, one borrowed dog, one paved loop visible from here.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 6,
    idealFor: [
      "members who already love dogs and treat their names as a love language",
      "members who can sit on a bench without project managing the geese",
      "members whose spiral has somewhere to land on a paved loop",
      "members who can listen across a bench without rushing the moment",
    ],
    badFor: [
      "members who consider a leash a personal slight",
      "members who read an open path as exposure",
      "members who cannot find an audience among waterfowl",
    ],
  },
  publicBrief: {
    location: "The lake overlook bench at the east loop, Lakeside Park",
    premise:
      "Cupid arranged a sit. The dog belongs to a Cupid contractor and is on its second job today. The handler is at the parking lot, not at the bench.",
    whatBothCharactersKnow:
      "The bench overlooks the loop. Geese pass on the path. Cupid certifies the geese are not a metaphor. The geese are not consulted on this certification.",
    openingSituation:
      "Both members sit on the lake overlook bench. The dog has already chosen one of them and is at their feet. The leash is looped on the bench arm.",
  },
  director: {
    tone: "fresh air, ambient runners, approximately one hour of natural light",
    rules: [
      "Anchor the date to the bench. The pair watches the loop, they do not walk the loop.",
      "Treat weather and geese as flavor, not omens.",
      "Use the dog's small choices as ambient pressure, not stage cues.",
    ],
    events: [
      {
        id: "park-loop-with-a-dog-event-1",
        title: "The dog picks a side",
        kind: "reveal",
        pitch:
          "Slacken the leash as the dog leans its full weight against one shin and exhales. Surfaces a real reaction without scoring points.",
        beat: "The leash slackens against the bench arm. The dog leans its full weight against one member's shin and exhales.",
        directorBeat:
          "A dog just chose someone. Receive it without performing, comment to your date about being picked, scratch the ears, or laugh at the choice. Show how you handle the pick.",
      },
      {
        id: "park-loop-with-a-dog-event-2",
        title: "Geese pass",
        kind: "ambient",
        pitch:
          "Cross six geese in single file with a runner pausing and the dog's ears up but body still. Opens a window for a quieter question.",
        beat: "Six geese cross the paved path in single file. The dog's ears go up but it does not stand. A runner pauses to wait for them.",
        directorBeat:
          "The path just held for a small parade. Use the pause for a real question, comment to your date on the line, watch with the dog, or stay quiet. Take the small window. Do not voice the runner.",
      },
      {
        id: "park-loop-with-a-dog-event-3",
        title: "Handler waves",
        kind: "provocation",
        pitch:
          "Raise the handler's hand from the parking lot with one-hour light turning orange and the dog unaware. Forces a clear next step.",
        beat: "The handler at the parking lot raises a hand. The dog has not noticed. The light has turned the kind of orange that says one hour.",
        directorBeat:
          "Your time with the dog is about to wrap. Wave back, propose handing the leash off, ask your date if they want a few more minutes, or stand to walk. Pick a move. Do not voice the handler.",
      },
      {
        id: "park-loop-with-a-dog-event-4",
        title: "Runner waves",
        kind: "ambient",
        pitch:
          "Bring back a jogger you passed earlier on a second pass with a small wave. Surfaces a familiar stranger without making them a topic.",
        beat: "A jogger they passed earlier comes back around and waves on her second loop. The wave is small. The dog watches her shoes go by and resettles.",
        directorBeat:
          "Someone familiar just passed twice. Nod back, comment on the second loop, ask your date if they want to walk the path eventually, or stay seated. Do not voice the jogger.",
      },
      {
        id: "park-loop-with-a-dog-event-5",
        title: "Leash slack",
        kind: "reveal",
        pitch:
          "Drop the leash off the bench arm onto gravel with the clip slack at the collar. Surfaces trust or vigilance about the dog without scoring either.",
        beat: "The leash slides off the bench arm and lands on the gravel. The clip rests against the dog's collar without tension. The dog has decided it lives here now.",
        directorBeat:
          "The leash is off the bench. Pick it up, leave it on the gravel, comment on the dog's confidence, or loop it back. Show whether you keep things tight.",
      },
      {
        id: "park-loop-with-a-dog-event-6",
        title: "Acorn drop",
        kind: "ambient",
        pitch:
          "Drop an acorn onto a slat with the dog's ears flicking and the acorn rolling into the grass. Surfaces a small startle without making it impact.",
        beat: "An acorn drops from the tree behind them and bounces once off a slat. The dog ears flick. The acorn rolls into the grass.",
        directorBeat:
          "Something small just startled the bench. Watch the dog's ears settle, comment on the acorn, look up at the tree, or carry on. Do not turn it into a moment.",
      },
      {
        id: "park-loop-with-a-dog-event-7",
        title: "Sun shifts",
        kind: "reveal",
        pitch:
          "Slide the sun behind a pine and cool the bench with the dog leaning heavier. Surfaces a small honest preference about staying.",
        beat: "The sun slides behind a pine and the bench loses its warmth. Both members feel it together. The dog leans more heavily into one shin.",
        directorBeat:
          "The bench just got cooler. Comment on the chill, ask your date if they want to move into the sun further down, lean closer, or stay where the dog is. Speak from what you feel.",
      },
      {
        id: "park-loop-with-a-dog-event-8",
        title: "Dog stretches",
        kind: "provocation",
        pitch:
          "Stretch the dog with a small groan facing the parking lot and have the handler raise his hand again. Forces a clean ending.",
        beat: "The dog stretches with a small groan and resettles facing the parking lot. The handler raises his hand again from the truck. The leash has not been picked up.",
        directorBeat:
          "The dog is reading the room. Pick up the leash, propose the walk back, ask your date if they want to stay on after the dog leaves, or stand. End the bench clean.",
      },
      {
        id: "park-loop-with-a-dog-event-9",
        title: "Sprinkler hour",
        kind: "provocation",
        pitch:
          "Click on the path sprinklers at the south end with spray reaching gravel six paces away. Forces a clean physical move.",
        beat: "A click runs through the irrigation line. The path sprinklers at the south end of the loop hiss to life and start their arc. Spray reaches the gravel six paces from the bench.",
        directorBeat:
          "Water is coming for the bench. Shift the seat, walk the dog out, hand the leash off, or stand and laugh. Move now.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the dog as a prop instead of a creature.",
      "A member uses the open setting to avoid arriving at any topic.",
    ],
    repeatBehavior:
      "If repeated, the dog may remember them. The contractor charges Cupid by the half hour and is willing.",
  },
  judgeRubric: {
    successSignals: [
      "The pair finds a rhythm sitting and talking without forcing either.",
      "A member treats the dog with care without making it the date.",
    ],
    failureSignals: [
      "A member uses the bench to dodge a real question.",
      "The pair argues over whether to leave the bench.",
    ],
    statFocus: ["trust", "spark", "relationshipHealth"],
  },
};
