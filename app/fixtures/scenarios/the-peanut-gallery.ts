import type { DateScenario } from "../../domain/game";

export const thePeanutGallery: DateScenario = {
  id: "the-peanut-gallery",
  title: "The Peanut Gallery",
  card: {
    summary:
      "A small art gallery curated by sentient peanuts. The works on the walls are things peanuts find beautiful: long sun, low gravity, hands that do not crush.",
    tags: ["cosmic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 11,
    idealFor: [
      "members who can be moved by an aesthetic that is not theirs",
      "members who can sit in a low-stakes gallery without making a speech",
      "members who can be watched by a small audience without performing",
    ],
    badFor: [
      "members who turn an alien aesthetic into a personal pitch",
      "members who treat the docents as a bit",
      "members who narrate every plaque to demonstrate taste",
    ],
  },
  publicBrief: {
    location: "Main floor of the Peanut Gallery, off the small dimensional concourse at Vendor Row",
    premise:
      "Cupid booked a forty-minute walkthrough of a small art gallery curated by the local peanut population. The works on the walls were made by peanuts for peanuts. The pair is allowed to walk slowly.",
    whatBothCharactersKnow:
      "The peanuts are sentient and quiet. The docents on the floor do not address visitors directly. The plaques carry short descriptions written for a peanut audience. The pair is welcome to take as long as the booking allows. The gift basin at the door offers shells for taking; it is not a test.",
    openingSituation:
      "Both members are inside the door. A small docent has rolled to a stop a polite distance away. The first work on the left wall is a small bronze of two open palms. The gift basin sits beside the door with a card on the rim.",
  },
  director: {
    tone: "low warm gallery light, a faint nutty smell from the gift basin, the soft rustle of docents shifting on the polished floor, the hush of a room curated by a quieter species",
    flow: "conversation",
    rules: [
      "Anchor the date to the gallery floor. The pair walks slowly between works but does not exit to the concourse.",
      "Treat the peanuts as fact. They are small, quiet, and watching politely.",
      "Allow either member to skip a plaque. Reading every label is not the date.",
      "Do not voice the docents, the plaques, the gift basin, or any peanut as a continuing speaker.",
    ],
    events: [
      {
        id: "the-peanut-gallery-event-1",
        title: "Hands sculpture",
        kind: "ambient",
        pitch:
          "Hold the pair at the small bronze of two open palms with a plaque crediting a peanut historian. Surfaces a small honest beat about touch without forcing it.",
        beat: "The bronze of two open palms sits on a low plinth at chest height. The plaque under it reads: the gift we were not crushed by. The bronze is small enough to hold in one cupped hand. The palms face up.",
        directorBeat:
          "A small bronze of open hands is in front of you. Comment to your date on the palms, ignore the plaque, lift your own hand near it, or move on. Speak from your own register. Do not voice the plaque.",
      },
      {
        id: "the-peanut-gallery-event-2",
        title: "Low warm dome",
        kind: "ambient",
        pitch:
          "Hum the gallery's small sun-like dome on the ceiling at a low warm pitch. Surfaces a small they made this light beat.",
        beat: "The dome on the ceiling glows a low warm color. The light pools on the polished floor between the two members. A small docent has stopped at the edge of the pool. The dome's hum is just audible.",
        directorBeat:
          "The room is lit by something the peanuts made. Look up at the dome, stand in the warm pool a beat, comment to your date on the color, or keep walking. Stay honest about what the light is doing to you.",
      },
      {
        id: "the-peanut-gallery-event-3",
        title: "Docents shift",
        kind: "ambient",
        pitch:
          "Shift the small group of docents into a loose half circle behind the pair. Surfaces being followed politely without forcing a topic.",
        beat: "The small group of docents on the floor has shifted into a loose half circle a polite distance behind the pair. The docents are still. The gallery is otherwise quiet. The next work is two steps ahead.",
        directorBeat:
          "You are being followed at a polite distance. Acknowledge the half circle, ignore it, comment to your date in a low voice, or keep walking at the same pace. Do not voice the docents.",
      },
      {
        id: "the-peanut-gallery-event-4",
        title: "Greeting at the foot",
        kind: "provocation",
        pitch:
          "Roll one docent slowly to one member's foot and stop with a plaque on the wall behind explaining the greeting. Forces a clean physical call.",
        beat: "One docent has rolled across the gallery and stopped at one member's foot. The docent is still. The plaque on the wall behind reads: a hello is a roll to the foot. The other docents are still in the half circle.",
        directorBeat:
          "A docent has greeted you with its body. Crouch and meet it, step back, ask your date what they would do, or lift it carefully into a cupped hand. Use the body in your next beat. Do not voice the plaque or the docent.",
      },
      {
        id: "the-peanut-gallery-event-5",
        title: "The audience turns",
        kind: "provocation",
        pitch:
          "Turn every docent on the floor to watch the pair instead of the art. Forces a clean stance on being watched.",
        beat: "Every docent on the floor has turned to face the pair instead of the art on the walls. The dome is unchanged. The plaques are unchanged. The pair is the only thing being looked at now.",
        directorBeat:
          "The room has stopped watching its own art to watch you. Hold position, sit on the bench in the middle, ask your date how they want to handle it, or quietly leave through the door. Make the call out loud.",
      },
      {
        id: "the-peanut-gallery-event-6",
        title: "Closing bell",
        kind: "provocation",
        pitch:
          "Ring a small bell at the desk with a plaque inviting each guest to choose one work to stand near for the goodbye. Forces a clean choice.",
        beat: "A small bell at the desk has rung once. A plaque beside the bell reads: please stand near the work you want to leave with. The dome has warmed half a degree. The docents are still watching.",
        directorBeat:
          "The booking is closing and each of you has to pick a work to stand near. Walk to your pick, ask your date what they want first, choose the same work as them on purpose, or refuse the rule and stand in the middle. Speak to the choice. Do not voice the plaque or the bell.",
      },
      {
        id: "the-peanut-gallery-event-7",
        title: "The pair painting",
        kind: "reveal",
        pitch:
          "Bring the pair to a small painting of two peanut figures holding stems with a plaque about being held without being crushed. Surfaces what each member projects.",
        beat: "A small painting on the far wall shows two peanut figures holding each other by the stem. The plaque reads: the gift of being held without being crushed. The painting is hand-sized. The frame is dark wood.",
        directorBeat:
          "A painting of two figures holding gently is in front of you. Comment on the framing, ask your date what they see in it, stand quietly with it, or move along. Speak only from what you already feel. Do not voice the plaque.",
      },
      {
        id: "the-peanut-gallery-event-8",
        title: "Audio piece",
        kind: "reveal",
        pitch:
          "Settle the pair near a piece that is a low warm thrumming. Surfaces a meaning that arrives in the body, not the head.",
        beat: "A small alcove holds a piece that is a low warm thrumming. There is no screen and no plaque text inside the alcove. The thrumming is felt in the chest as much as heard. A bench faces into the alcove.",
        directorBeat:
          "An art piece is making your chest hum. Sit on the bench with your date, name what you feel, ask them what they feel, or sit silent in it. Speak from the body, not the head.",
      },
      {
        id: "the-peanut-gallery-event-9",
        title: "Gift basin",
        kind: "reveal",
        pitch:
          "Surface the gift basin by the door with a card inviting visitors to take one shell. Surfaces a stance on accepting a small gift on the way out.",
        beat: "The gift basin by the door is full of clean peanut shells. The card on the rim reads: take one if you would like to come back. The shells are small enough to fit in a pocket. The door is open.",
        directorBeat:
          "A small honest gift is in reach as you leave. Pocket a shell, hand one to your date, take two, or leave the basin and walk out. Speak from how it actually lands on you. Do not voice the card or the basin.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the peanut aesthetic as a joke and performs for the docents.",
      "A member uses a plaque to corner the partner into a verdict on the relationship.",
    ],
    repeatBehavior:
      "If repeated, the gallery remembers the pair. The docent greets the same foot. The gift basin holds a shell with their last visit's date scratched into the inside.",
  },
  judgeRubric: {
    successSignals: [
      "A member lets a piece move them without translating it into a relationship metaphor.",
      "The pair sits under the docents' attention without performing for them.",
    ],
    failureSignals: [
      "A member narrates every plaque to demonstrate taste.",
      "The pair laughs at the peanuts instead of with the room.",
    ],
    statFocus: ["chemistry", "weirdnessTolerance", "trust"],
  },
};
