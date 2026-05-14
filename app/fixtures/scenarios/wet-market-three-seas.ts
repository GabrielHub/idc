import type { DateScenario } from "../../domain/game";

export const wetMarketThreeSeas: DateScenario = {
  id: "wet-market-three-seas",
  title: "Wet Market, Three Seas",
  card: {
    summary:
      "A covered wet market at the join of three seas. Four activity zones the pair can move between in any order. Vendors visible and silent.",
    tags: ["cosmic", "food", "public", "domestic"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    cost: 18,
    idealFor: [
      "members who can run a small errand at the pace of the partner",
      "members who can pick up a knife without being asked",
      "members who can eat a thing they did not name",
    ],
    badFor: [
      "members who treat the market as a pitch deck",
      "members who refuse anything that did not come from a sea they know",
      "members who score the partner's tolerance for a wet floor",
    ],
  },
  publicBrief: {
    location: "Aisle six of the Branch Market, covered hall, two-zone booking",
    premise:
      "Cupid booked the pair into aisle six of a covered market at the join of three seas. The catch is real and the cookware is hot.",
    whatBothCharactersKnow:
      "Aisle six has four zones: a live tank wall, a small angling pool at the back, a shucking counter on the rail, and a back row of two-top hot stone grills. Vendors are on the aisle but do not look up. Chits print from each counter and pay into coin slots. Knives at the shucking counter are chained to the rail. The hot stones run at a fixed temperature.",
    openingSituation:
      "Both members stand at the entrance of aisle six. The live tank wall is on the left. The angling pool is at the back. The shucking counter is on the right. Two long-handled nets hang on hooks at the live tank wall. The aisle is otherwise quiet.",
  },
  director: {
    tone: "wet concrete, the low clatter of ice, the rolling chiller hum, a salt smell that does not match the hall, the steady tap of a cleaver one stall over",
    rules: [
      "Anchor the date to aisle six. The pair does not leave the aisle.",
      "Treat the catch as real catch. The fish do not become a metaphor.",
      "Allow either member to lead a zone change. Either may move on at any time.",
      "Do not voice the vendors, the chits, or any background staff as continuing speakers.",
    ],
    events: [
      {
        id: "wet-market-three-seas-event-1",
        title: "A leap at the tank wall",
        kind: "ambient",
        event: "A fish leaps once in the live tank wall.",
        characterVisibleText:
          "A pale fish leaps once in the third tank along the wall. The water settles. The other tanks hold steady. The two long-handled nets are still on their hooks.",
        directorInstruction:
          "Allow the small marker. The tank does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "wet-market-three-seas-event-2",
        title: "Smoke drift",
        kind: "ambient",
        event: "Smoke drifts past from the grill row.",
        characterVisibleText:
          "A short ribbon of smoke drifts across the aisle from one of the hot stones at the back. The smell is familiar and not. The stone in front of the pair is unlit.",
        directorInstruction:
          "Allow the small invitation. The grill is not voiced as a continuing speaker.",
      },
      {
        id: "wet-market-three-seas-event-3",
        title: "A chit blows past",
        kind: "ambient",
        event: "A printed chit blows past the pair on the floor.",
        characterVisibleText:
          "A small printed chit blows past their shoes on the wet floor. The chit lists a catch and a price in a script that is not local. The chit settles against a tank base.",
        directorInstruction:
          "Allow the small marker. The chit is not voiced as a continuing speaker.",
      },
      {
        id: "wet-market-three-seas-event-4",
        title: "Strike at the angling pool",
        kind: "provocation",
        event: "The angling pool surges at one of the rods.",
        characterVisibleText:
          "The angling pool surges at the rod on the right. The line goes tight and the bucket beside the stool tips a finger. The rod handle is in reach. The water under the surge is darker than the rest of the pool.",
        directorInstruction:
          "Push for a real move. Either may set the rod, ease the line, or step back. The pool does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "wet-market-three-seas-event-5",
        title: "Stone flare",
        kind: "provocation",
        event: "The hot stone in front of the pair flares to ready.",
        characterVisibleText:
          "The hot stone in front of the pair flares once. A small red light at the corner of the two-top turns steady. The tongs at the table hang on a side rail. Whatever lands on the stone in the next minute will cook.",
        directorInstruction:
          "Push for a real next move. The pair may bring something over, wait, or move on. The stone is not voiced as a continuing speaker.",
      },
      {
        id: "wet-market-three-seas-event-6",
        title: "Knife on a stubborn oyster",
        kind: "provocation",
        event: "A shucking knife slips against a stubborn oyster.",
        characterVisibleText:
          "The shucking knife slips on the hinge of an oyster on the rail. The oyster stays shut. The chained handle hits the rail. The towel under the oyster is dry.",
        directorInstruction:
          "Push for a real physical move. Either may take the knife, hand it over, or set it down. The oyster is not voiced as a continuing speaker.",
      },
      {
        id: "wet-market-three-seas-event-7",
        title: "A scale prints a chit",
        kind: "reveal",
        event: "The scale prints a chit naming the sea of origin.",
        characterVisibleText:
          "The scale at the weighing station prints a small chit for a recent catch. The chit lists the catch by weight and names the sea by full name. One of the three is on the chit.",
        directorInstruction:
          "Use the named sea to surface a small honest reaction drawn only from existing context. The chit is not voiced as a continuing speaker.",
      },
      {
        id: "wet-market-three-seas-event-8",
        title: "A tasting cup is offered",
        kind: "reveal",
        event: "A vendor extends a small tasting cup.",
        characterVisibleText:
          "A vendor at the corner stall extends a small clay cup of broth across the rail without looking up. The cup sits on the rail. The broth is steaming. The vendor steps back to the cleaver.",
        directorInstruction:
          "Use the small offering to surface care drawn only from existing context. Either may take the cup or leave it. The vendor does not speak and is not voiced as a continuing speaker.",
      },
      {
        id: "wet-market-three-seas-event-9",
        title: "Old chit on the bulletin",
        kind: "reveal",
        event: "An old chit on the bulletin lists both names.",
        characterVisibleText:
          "The bulletin near the weighing station holds a small wall of old chits. One pinned chit lists a recent catch with both their first names in pencil at the top. The pencil mark is fresh enough to read.",
        directorInstruction:
          "Use the small callback to surface a stance drawn only from existing context and pair history. The bulletin is not voiced as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the aisle as a pitch deck.",
      "A member scores the partner's tolerance for the wet floor.",
    ],
    repeatBehavior:
      "If repeated, aisle six is held for the pair. The tanks are in place, the angling pool is at the back, the shucking counter has its towels, the hot stone is on standby. The bulletin near the weighing station carries the prior chit pinned at the corner.",
  },
  judgeRubric: {
    successSignals: [
      "A member picks up a knife or a net without being asked.",
      "The pair holds the pace of the slower partner across a zone change.",
    ],
    failureSignals: [
      "A member treats the aisle as a metaphor for the date.",
      "The pair argues about which sea the catch was from.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
