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
        event: "The iron kettle hums on its hook.",
        characterVisibleText:
          "The iron kettle hums on its hook above the hearth. The hum holds a single low note. The handle is angled toward the room. The water inside is at a steady simmer.",
        directorInstruction:
          "Allow the small marker. The kettle is not voiced as a continuing speaker.",
      },
      {
        id: "hedge-witch-tea-hour-event-2",
        title: "Whisk in the bowl",
        kind: "ambient",
        event: "The bone-handled whisk hums alone in a bowl.",
        characterVisibleText:
          "The bone-handled whisk is set in a small ceramic bowl on the worktable. The whisk hums quietly. The bowl is empty. The handle is steady at the rim.",
        directorInstruction:
          "Allow the small detail. The whisk is not voiced as a continuing speaker.",
      },
      {
        id: "hedge-witch-tea-hour-event-3",
        title: "Forest sound",
        kind: "ambient",
        event: "Forest sound comes through the door.",
        characterVisibleText:
          "A small wave of forest sound comes through the door. A single bird high up, a low wind in the canopy, the small scratch of something small at the path. The door holds. The window is fogged at the top corners.",
        directorInstruction:
          "Allow the small marker. The forest sound is not voiced as a continuing speaker.",
      },
      {
        id: "hedge-witch-tea-hour-event-4",
        title: "Green jar tips",
        kind: "provocation",
        event: "A green jar on the shelf tips a finger and settles.",
        characterVisibleText:
          "A small green jar on the high shelf tips a finger and settles back. The lid stays on. The chalk label on the jar holds a single word in the witch's hand. The note on the door warned about the green jars.",
        directorInstruction:
          "Push for a real small move. Either may steady the jar, leave it, or move it down. The jar is not voiced as a continuing speaker.",
      },
      {
        id: "hedge-witch-tea-hour-event-5",
        title: "Pearl barrel lid pops",
        kind: "provocation",
        event: "The lid of the pearl barrel pops open on its own.",
        characterVisibleText:
          "The lid of the tapioca pearl barrel pops a quarter open on its own and stays. The pearls inside are still. The barrel is in reach of both stools. The tank next to the barrel is calm.",
        directorInstruction:
          "Push for a real next move. Either may close the lid, scoop a serving, or wait. The barrel is not voiced as a continuing speaker.",
      },
      {
        id: "hedge-witch-tea-hour-event-6",
        title: "Kettle pours unbidden",
        kind: "provocation",
        event: "The kettle pours unbidden into a single cup.",
        characterVisibleText:
          "The kettle tips on its hook and pours a single steady stream into one of the two wooden cups on the worktable. The cup fills to the proper line. The kettle resets. The second cup is empty.",
        directorInstruction:
          "Push for a real choice. Either may pour for the partner, leave the second cup empty, or move the full cup across. The kettle is not voiced as a continuing speaker.",
      },
      {
        id: "hedge-witch-tea-hour-event-7",
        title: "Moodboard teapots",
        kind: "reveal",
        event: "The moodboard teapots stand on the long shelf.",
        characterVisibleText:
          "The long shelf above the worktable holds the moodboard teapots in a row. Each teapot has a chalk label in the witch's hand: steady, weeping, sworn, half-asleep, plain. The labels face the room. The teapots are within reach of both stools.",
        directorInstruction:
          "Use the small option to surface a stance drawn only from existing context. Either may pick a teapot or leave the shelf. The teapots are not voiced as continuing speakers.",
      },
      {
        id: "hedge-witch-tea-hour-event-8",
        title: "Foraging note on the door",
        kind: "reveal",
        event: "The witch's foraging note holds on the inside of the door.",
        characterVisibleText:
          "A small paper note hangs on the inside of the door at eye level. The note is in the same chalky hand as the labels. The note lists what the witch is foraging for and the hour mark for her return. The hour mark is after the booking ends.",
        directorInstruction:
          "Use the small note to surface a stance drawn only from existing context. The note is not voiced as a continuing speaker.",
      },
      {
        id: "hedge-witch-tea-hour-event-9",
        title: "A jar with prior dregs",
        kind: "reveal",
        event: "A small jar on the worktable holds prior dregs.",
        characterVisibleText:
          "A small clear jar sits on the worktable behind the cups. The jar holds tea dregs from a prior steeping. A chalk note on the jar carries two short letters at the top. The letters are fresh enough to read.",
        directorInstruction:
          "Use the small callback to surface a stance drawn only from existing context and pair history. The jar is not voiced as a continuing speaker.",
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
