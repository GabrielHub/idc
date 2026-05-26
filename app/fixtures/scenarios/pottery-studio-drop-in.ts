import type { DateScenario } from "../../domain/game";

export const potteryStudioDropIn: DateScenario = {
  id: "pottery-studio-drop-in",
  title: "Pottery Studio, Shared Workbench",
  card: {
    summary:
      "A community ceramic studio. One shared slab table, one timer, two aprons. The piece will not be ready tonight.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 9,
    idealFor: [
      "members who relax when their hands have a slab and their voice can rest",
      "members whose warm steady voice handles a thumb dent without comment",
      "members whose stoic clipped voice can hold a long working silence",
      "members whose spiral has somewhere to go on a wet bench",
    ],
    badFor: [
      "members who need a measurable outcome that compounds tonight",
      "members who will film the mess and post it before pickup day",
      "members who refuse to be seen mid-mud without a flattering light",
    ],
  },
  publicBrief: {
    location: "A shared slab workbench at Mudline Ceramics, Tuesday evening drop-in",
    premise:
      "Cupid booked the slot. The studio supplies clay, tools, and a spot in the kiln. The piece will not be ready tonight; pickup is in ten days.",
    whatBothCharactersKnow:
      "The bench is theirs for the session. They will not take a finished piece home. The wheel is across the room and is not their station tonight.",
    openingSituation:
      "Both members put on aprons. A shared slab of clay sits between them on the bench. A loaner timer is set on the lip of the bench. The kiln hums behind a curtain.",
  },
  director: {
    tone: "wet clay, a slow-running tap, a kiln humming behind a curtain",
    rules: [
      "Anchor the date to the shared workbench. The pair does not relocate to the wheel or the photo wall.",
      "Treat the clay as real clay. It collapses if it is overworked.",
      "Allow long working silences. The bench can carry them.",
    ],
    events: [
      {
        id: "pottery-studio-drop-in-event-1",
        title: "First slab",
        kind: "reveal",
        pitch:
          "Roll out the shared slab with one thick side and a thumb dent in the middle. Surfaces patience or perfectionism without forcing confession.",
        beat: "The slab is rolled out between them. It is too thick on one side and there is a thumb dent near the middle. A fine line of water sits on the surface.",
        directorBeat:
          "The slab is imperfect already. Roll the thick side flat, leave the thumb dent alone, comment to your date on the dent, or hand them the rolling pin. Show how you handle a flaw you cannot hide.",
      },
      {
        id: "pottery-studio-drop-in-event-2",
        title: "Timer rings",
        kind: "ambient",
        pitch:
          "Buzz the loaner timer while the clay is still soft and hands are wet. Forces a small negotiation about time without a referendum.",
        beat: "The timer on the lip of the bench buzzes once and continues. Their hands are wet. The clay is still soft.",
        directorBeat:
          "The timer is asking for a moment of attention. Reach with a wet hand, ask your date to silence it, comment on the buzz, or ignore it. Make the small call.",
      },
      {
        id: "pottery-studio-drop-in-event-3",
        title: "Tape and name",
        kind: "provocation",
        pitch:
          "Drop blue tape and a felt marker on the bench with two empty slots on the bisque shelf. Forces a small honest sentence about what they made.",
        beat: "A small piece of blue tape and a felt marker sit on the bench. The bisque shelf at the back has thirty pieces and two empty slots.",
        directorBeat:
          "Tape and a marker are asking you to name the piece. Write a name, ask your date if they want to share a slot, propose two separate names, or set the marker aside. Speak honestly about what you made.",
      },
      {
        id: "pottery-studio-drop-in-event-4",
        title: "Tap drip",
        kind: "reveal",
        pitch:
          "Drop a slow tap onto the slab and darken one side. Surfaces whether either fixes it without making it a project.",
        beat: "A drop from the slow tap above the bench lands on the slab. It widens. Another follows. The slab gets darker on one side.",
        directorBeat:
          "Water is changing your clay. Wipe it, sponge it lightly, comment on the asymmetry to your date, or work the wet edge into the design. Do not make it a project.",
      },
      {
        id: "pottery-studio-drop-in-event-5",
        title: "Kiln tick",
        kind: "ambient",
        pitch:
          "Start the kiln's slow cooling tick behind the curtain with the bench warming. Surfaces working silence as a kindness.",
        beat: "The kiln behind the curtain begins ticking as it cools. The curtain barely moves. The bench is warmer than it was an hour ago.",
        directorBeat:
          "The bench is humming with heat now. Work in silence for a beat, comment on the tick, lean closer to your date, or stretch. Let the silence be kind.",
      },
      {
        id: "pottery-studio-drop-in-event-6",
        title: "Rolling pin shift",
        kind: "reveal",
        pitch:
          "Roll the rolling pin a quarter turn into a hand with the slab now thinner on the wet side. Surfaces generosity with material instead of blame.",
        beat: "The rolling pin rolls a quarter turn across the bench and stops against a hand. The handle is wet. The slab between them is now thinner on the wet side.",
        directorBeat:
          "Something small went wrong with the slab. Pass the pin back, fix the thin side without comment, joke about the bench, or hand off to your date. Do not blame the pin.",
      },
      {
        id: "pottery-studio-drop-in-event-7",
        title: "Apron tie",
        kind: "ambient",
        pitch:
          "Loosen one apron tie at the back with the other still cinched. Surfaces care shown by a wordless retie.",
        beat: "A wet hand brushes the bench and one apron tie comes loose at the back. The other apron is still cinched. The clay on the slab is still soft.",
        directorBeat:
          "Someone's apron is coming undone. Retie it without comment, ask your date to fix yours, work past it, or use the moment to step in close. Show or skip the small care.",
      },
      {
        id: "pottery-studio-drop-in-event-8",
        title: "Bisque shelf rocks",
        kind: "provocation",
        pitch:
          "Rock one piece on the bisque shelf once with the rest still. Forces a clean closing line about the piece on the bench.",
        beat: "A piece on the bisque shelf rocks once on its base and resettles. The shelf has thirty other pieces; none of them moved. The kiln tick continues.",
        directorBeat:
          "Something almost fell. Glance over, comment to your date on the rocker, name what your own piece is becoming, or close the work for the night. Speak one honest closing line.",
      },
      {
        id: "pottery-studio-drop-in-event-9",
        title: "Slab collapse",
        kind: "provocation",
        pitch:
          "Fold the slab at the thinnest section and slap a wet edge onto the floor with a clay smear on one apron. Forces a physical save and a clean call.",
        beat: "The slab folds at the thinnest section between them. A wet edge slips off the bench and slaps the floor. A clay smear runs down one apron.",
        directorBeat:
          "Your shared piece just fell apart. Grab the wet edge, scrape the floor, laugh about the smear, ask your date if they want to rebuild, or scrap it and try again. Pick now.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the other's piece as evidence of taste.",
      "A member uses the studio as a content shoot and asks the other to perform.",
    ],
    repeatBehavior:
      "If repeated, the studio remembers the names on the shelf. The kiln runs once a week. Most of the work survives.",
  },
  judgeRubric: {
    successSignals: [
      "A member makes a bad piece and lets it stay bad.",
      "The pair works in silence for one beat without flinching.",
    ],
    failureSignals: [
      "A member competes with the other's piece on the table.",
      "The pair turns a soft material into a contest.",
    ],
    statFocus: ["trust", "chemistry", "stability"],
  },
};
