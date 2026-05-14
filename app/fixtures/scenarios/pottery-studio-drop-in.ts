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
        event: "Both members roll the shared slab. The slab is uneven.",
        characterVisibleText:
          "The slab is rolled out between them. It is too thick on one side and there is a thumb dent near the middle. A fine line of water sits on the surface.",
        directorInstruction:
          "Use the imperfection to surface patience or perfectionism without forcing a confession.",
      },
      {
        id: "pottery-studio-drop-in-event-2",
        title: "Timer rings",
        kind: "ambient",
        event: "The loaner timer on the bench buzzes.",
        characterVisibleText:
          "The timer on the lip of the bench buzzes once and continues. Their hands are wet. The clay is still soft.",
        directorInstruction:
          "Let the pair negotiate the timer without making it a referendum on time.",
      },
      {
        id: "pottery-studio-drop-in-event-3",
        title: "Tape and name",
        kind: "provocation",
        event: "A small piece of tape and a marker land between them.",
        characterVisibleText:
          "A small piece of blue tape and a felt marker sit on the bench. The bisque shelf at the back has thirty pieces and two empty slots.",
        directorInstruction:
          "Push for a small honest sentence about what they made and what they will pick up.",
      },
      {
        id: "pottery-studio-drop-in-event-4",
        title: "Tap drip",
        kind: "reveal",
        event: "The studio's slow tap drips onto the slab.",
        characterVisibleText:
          "A drop from the slow tap above the bench lands on the slab. It widens. Another follows. The slab gets darker on one side.",
        directorInstruction:
          "Use the small accident to test whether either fixes it without making it a project.",
      },
      {
        id: "pottery-studio-drop-in-event-5",
        title: "Kiln tick",
        kind: "ambient",
        event: "The kiln behind the curtain ticks audibly.",
        characterVisibleText:
          "The kiln behind the curtain begins ticking as it cools. The curtain barely moves. The bench is warmer than it was an hour ago.",
        directorInstruction:
          "Allow the small ambient warmth. A working silence here is a kindness, not a vacuum.",
      },
      {
        id: "pottery-studio-drop-in-event-6",
        title: "Rolling pin shift",
        kind: "reveal",
        event: "The rolling pin slides across the bench.",
        characterVisibleText:
          "The rolling pin rolls a quarter turn across the bench and stops against a hand. The handle is wet. The slab between them is now thinner on the wet side.",
        directorInstruction:
          "Use the small mishap to surface generosity with material rather than blame.",
      },
      {
        id: "pottery-studio-drop-in-event-7",
        title: "Apron tie",
        kind: "ambient",
        event: "One apron tie comes loose at the back.",
        characterVisibleText:
          "A wet hand brushes the bench and one apron tie comes loose at the back. The other apron is still cinched. The clay on the slab is still soft.",
        directorInstruction:
          "Let the small adjustment be small. A member who reaches to retie wordlessly is showing care.",
      },
      {
        id: "pottery-studio-drop-in-event-8",
        title: "Bisque shelf rocks",
        kind: "provocation",
        event: "A piece on the bisque shelf rocks once and resettles.",
        characterVisibleText:
          "A piece on the bisque shelf rocks once on its base and resettles. The shelf has thirty other pieces; none of them moved. The kiln tick continues.",
        directorInstruction:
          "Push for a clean closing line about the piece on their own bench, finished or not.",
      },
      {
        id: "pottery-studio-drop-in-event-9",
        title: "Slab collapse",
        kind: "provocation",
        event: "The shared slab folds in on itself between them.",
        characterVisibleText:
          "The slab folds at the thinnest section between them. A wet edge slips off the bench and slaps the floor. A clay smear runs down one apron.",
        directorInstruction:
          "Push for a physical save and a clean call: rebuild the slab, scrap it, or keep what survived. The kiln slot waits either way.",
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
