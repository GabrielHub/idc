import type { DateScenario } from "../../domain/game";

export const hedgeWitchTeaHour: DateScenario = {
  id: "hedge-witch-tea-hour",
  title: "The Witch Is Out",
  card: {
    summary:
      "A self-serve tea hut at the edge of a fantasy forest. The witch is out foraging for the hour. Self-pouring kettle, mood-labeled teapots, a barrel of tapioca pearls grown in a tank.",
    tags: ["domestic", "low_pressure", "food", "repeat_risk"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 12,
    idealFor: [
      "members who can pour for the partner without making it a gesture",
      "members who can pick a labeled teapot and stand by it",
      "members who can sit at a hearth and let a long quiet be the company",
    ],
    badFor: [
      "members who turn the moodboard into a personal pitch",
      "members who treat the absent witch as a bit",
      "members who use the hut to skip the conversation",
    ],
  },
  publicBrief: {
    location: "Mossglade tea hut, edge of the fae forest, one-hour self-serve booking",
    premise:
      "Cupid booked a one-hour self-serve tea sit at a hedge witch's hut. The witch is out foraging for the full booking window.",
    whatBothCharactersKnow:
      "The hut is one room: a hearth in the corner with a self-pouring iron kettle on a hook, a long shelf of clay teapots each chalk-labeled with a mood, a barrel of tapioca pearls next to a small tank where the pearls are grown, a stone bowl of matcha powder, a bone-handled whisk that runs on its own when set in a bowl. Two cushioned tree-stump stools. Two wooden cups. A glass jar of honey from a branch where bees pollinate something else. The witch is not in the hut for the full hour.",
    openingSituation:
      "Both members stand inside the hut. The door is closed behind them. The kettle hums on its hook. The shelf of mood teapots is in clear view. The barrel of pearls is to the side. The two stools face the hearth.",
  },
  director: {
    tone: "the low hum of the kettle, the soft warmth of the hearth, the moss smell from outside the door, a forest quiet that the hut keeps at a polite distance",
    rules: [
      "Anchor the date to the hut. The pair does not leave the door during the booking.",
      "Treat the witch as gone for the booking. She does not return.",
      "Allow either member to choose a teapot. The moodboard is not a test.",
      "Do not voice the witch, the kettle, the whisk, or any forest sound as continuing speakers.",
    ],
    events: [
      {
        id: "hedge-witch-tea-hour-event-1",
        title: "Kettle hum",
        kind: "ambient",
        pitch:
          "Hold the iron kettle on a single low hum above the hearth. Surfaces whether either reaches for the handle or sits with the warmth.",
        beat: "The iron kettle hums on its hook above the hearth. The hum holds a single low note. The handle is angled toward the room. The water inside is at a steady simmer.",
        directorBeat:
          "The kettle is ready and pointed at you. Lift it down, gesture your date toward it, comment on the hum, or settle on a stool first. Make the small move.",
      },
      {
        id: "hedge-witch-tea-hour-event-2",
        title: "Whisk in the bowl",
        kind: "ambient",
        pitch:
          "Run the bone whisk on its own in an empty ceramic bowl. Surfaces a small wonder without making the magic a topic.",
        beat: "The bone-handled whisk is set in a small ceramic bowl on the worktable. The whisk hums quietly. The bowl is empty. The handle is steady at the rim.",
        directorBeat:
          "Something small is doing its own work. Watch it, ask your date if they want matcha, comment on the steady rim, or move on to the kettle. Do not turn the whisk into a speech.",
      },
      {
        id: "hedge-witch-tea-hour-event-3",
        title: "Forest sound",
        kind: "ambient",
        pitch:
          "Carry a small wave of forest sound through the closed door. Surfaces who notices the outside and who keeps eyes inside.",
        beat: "A small wave of forest sound comes through the door. A single bird high up, a low wind in the canopy, the small scratch of something small at the path. The door holds. The window is fogged at the top corners.",
        directorBeat:
          "The forest just brushed your door. Glance at the fog, comment on the bird, ask your date if they heard the scratch, or stay inside the warmth. Show what you choose to attend to.",
      },
      {
        id: "hedge-witch-tea-hour-event-4",
        title: "Green jar tips",
        kind: "provocation",
        pitch:
          "Tip a chalk-labeled green jar a finger on the high shelf with the door note warning about it. Forces a real small move on safety.",
        beat: "A small green jar on the high shelf tips a finger and settles back. The lid stays on. The chalk label on the jar holds a single word in the witch's hand. The note on the door warned about the green jars.",
        directorBeat:
          "Something the witch warned about just shifted. Steady it, move it down to the worktable, comment on the warning, or leave it. Take the small precaution or pointedly skip it.",
      },
      {
        id: "hedge-witch-tea-hour-event-5",
        title: "Pearl barrel lid pops",
        kind: "provocation",
        pitch:
          "Pop the tapioca pearl barrel lid a quarter open in reach of both stools. Forces a clean choice: close, scoop, or wait.",
        beat: "The lid of the tapioca pearl barrel pops a quarter open on its own. The pearls inside are still. The barrel is in reach of both stools. The tank next to the barrel is calm.",
        directorBeat:
          "The barrel just invited you in. Close the lid, scoop a small portion for tea, ask your date if they want pearls, or pretend it did not happen. Pick.",
      },
      {
        id: "hedge-witch-tea-hour-event-6",
        title: "Kettle pours unbidden",
        kind: "provocation",
        pitch:
          "Tip the kettle to fill only one of two wooden cups. Forces a real choice: pour for the partner, leave the second cup empty, or hand the full cup across.",
        beat: "The kettle tips on its hook and pours a single steady stream into one of the two wooden cups on the worktable. The cup fills to the proper line. The kettle resets. The second cup is empty.",
        directorBeat:
          "One cup got served and the other did not. Slide the full cup to your date, pour the second yourself, comment on the kettle's pick, or keep what you have. Show care or claim.",
      },
      {
        id: "hedge-witch-tea-hour-event-7",
        title: "Moodboard teapots",
        kind: "reveal",
        pitch:
          "Line the mood-labeled teapots on the shelf in clear sight: steady, weeping, sworn, half-asleep, plain. Surfaces taste drawn only from what you already carry.",
        beat: "The long shelf above the worktable holds the moodboard teapots in a row. Each teapot has a chalk label in the witch's hand: steady, weeping, sworn, half-asleep, plain. The labels face the room. The teapots are within reach of both stools.",
        directorBeat:
          "Pick a teapot the way you would pick a mood. Take steady, ask your date which fits them, point at half-asleep, or grab plain on purpose. Speak from your own register. Do not voice the teapots.",
      },
      {
        id: "hedge-witch-tea-hour-event-8",
        title: "Foraging note on the door",
        kind: "reveal",
        pitch:
          "Hang the witch's foraging note on the inside of the door with a return hour past the booking. Surfaces a stance on her absence.",
        beat: "A small paper note hangs on the inside of the door at eye level. The note is in the same chalky hand as the labels. The note lists what the witch is foraging for and the hour mark for her return. The hour mark is after the booking ends.",
        directorBeat:
          "The witch is gone for the whole booking. Read the note aloud, comment on what she is foraging, ask your date what they think of being unsupervised, or shrug and pour tea. Engage with the empty hut.",
      },
      {
        id: "hedge-witch-tea-hour-event-9",
        title: "A jar with prior dregs",
        kind: "reveal",
        pitch:
          "Set a clear jar with prior tea dregs and two short chalk letters at the top on the worktable. Surfaces a callback for repeat pairs or curiosity for first visits.",
        beat: "A small clear jar sits on the worktable behind the cups. The jar holds tea dregs from a prior steeping. A chalk note on the jar carries two short letters at the top. The letters are fresh enough to read.",
        directorBeat:
          "Two letters in chalk are sitting where you can see them. Read them aloud, ask your date if they recognize the initials, claim the jar if they are yours, or set it back. Tie it to what you already know. Do not voice the jar.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the moodboard as a pitch deck.",
      "A member treats the absent witch as a bit.",
    ],
    repeatBehavior:
      "If repeated, the hut is held for the pair. The kettle hums on its hook, the whisk hums in its bowl, the moodboard teapots stand on the shelf. The small jar on the worktable holds the dregs from the prior visit with two short chalk letters at the top.",
  },
  judgeRubric: {
    successSignals: [
      "A member pours for the partner without making it a gesture.",
      "The pair picks a labeled teapot and stands by the choice.",
    ],
    failureSignals: [
      "A member uses the moodboard as a metaphor for the date.",
      "The pair argues about whether the witch is really gone.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
