import type { DateScenario } from "../../domain/game";

export const potteryStudioDropIn: DateScenario = {
  id: "pottery-studio-drop-in",
  title: "Pottery Studio, Drop-In",
  card: {
    summary:
      "A three hour drop in at a community ceramic studio. One wheel, one slab table, one timer. Aprons are loaners.",
    tags: ["domestic", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    idealFor: [
      "members who relax with their hands occupied",
      "pairs ready to be quiet at the same task",
      "members willing to make something that does not have to be good",
    ],
    badFor: [
      "members who need a measurable outcome",
      "members who refuse to be photographed mid-mess",
    ],
  },
  publicBrief: {
    location: "The drop-in studio at Mudline Ceramics, Tuesday evening session",
    premise:
      "Cupid booked the slot. The studio supplies clay, tools, and a spot in the kiln. The piece will not be ready tonight.",
    whatBothCharactersKnow:
      "The session is three hours. They will not take a finished piece home. Pickup is in ten days.",
    openingSituation:
      "Both members put on aprons. A loaner timer sits between them set to forty five minutes for the wheel.",
  },
  director: {
    tone: "wet clay, a slow-running tap, a kiln humming behind a curtain",
    rules: [
      "Treat the clay as real clay. It collapses if it is overworked.",
      "Allow long working silences. The wheel can carry them.",
      "Let either member be bad at this. The studio expects it.",
    ],
    beats: [
      {
        atTurn: 6,
        title: "First slab",
        event: "Each member rolls a slab. Neither slab is even.",
        characterVisibleText:
          "Two pale slabs sit on the table. One has a thumb dent. One is too thick on one side.",
        directorInstruction:
          "Use the imperfection to surface patience or perfectionism without forcing a confession.",
      },
      {
        atTurn: 16,
        title: "Wheel timer",
        event: "The wheel timer rings. One member is mid-pull.",
        characterVisibleText:
          "The timer is buzzing. The wheel has not stopped. The piece on the wheel is still soft and uneven.",
        directorInstruction:
          "Let the pair negotiate the wheel without making it a referendum on time.",
      },
      {
        atTurn: 26,
        title: "Bisque shelf",
        event: "They place their pieces on the bisque shelf with a slip of tape and their names.",
        characterVisibleText:
          "The shelf has thirty pieces. Their two pieces sit at the back with a small piece of blue tape and one name on each.",
        directorInstruction:
          "Push for a small honest sentence about what they made and what they will pick up.",
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
