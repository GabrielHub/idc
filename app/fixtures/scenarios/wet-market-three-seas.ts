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
    flow: "activity",
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
        pitch:
          "Leap a pale fish once in the third tank with the nets still on their hooks. Surfaces a small marker the pair can claim or skip.",
        beat: "A pale fish leaps once in the third tank along the wall. The water settles. The other tanks hold steady. The two long-handled nets are still on their hooks.",
        directorBeat:
          "Something live just moved in the tank wall. Point it out, comment on the nets, ask your date if they want to try the angling pool, or move past. Make a small choice. Do not voice the tank.",
      },
      {
        id: "wet-market-three-seas-event-2",
        title: "Smoke drift",
        kind: "ambient",
        pitch:
          "Drift a short ribbon of smoke from the grill row past the pair with their own stone unlit. Surfaces a small invitation.",
        beat: "A short ribbon of smoke drifts across the aisle from one of the hot stones at the back. The smell is familiar and not. The stone in front of the pair is unlit.",
        directorBeat:
          "A smell just crossed your face from the grill row. Name what it pulls up, ask your date if they want to head there, or stay on the tank wall. Speak from your own register.",
      },
      {
        id: "wet-market-three-seas-event-3",
        title: "A chit blows past",
        kind: "ambient",
        pitch:
          "Blow a non-local chit past the pair's shoes to settle at a tank base. Surfaces a small foreign marker.",
        beat: "A small printed chit blows past their shoes on the wet floor. The chit lists a catch and a price in a script that is not local. The chit settles against a tank base.",
        directorBeat:
          "A stranger's chit is at your feet. Pick it up, read the script aloud, ask your date if they recognize it, or step over it. Make the small read.",
      },
      {
        id: "wet-market-three-seas-event-4",
        title: "Strike at the angling pool",
        kind: "provocation",
        pitch:
          "Surge the angling pool at the right rod with the line tight and the bucket tipping. Forces a real move on the rod.",
        beat: "The angling pool surges at the rod on the right. The line goes tight and the bucket beside the stool tips a finger. The rod handle is in reach. The water under the surge is darker than the rest of the pool.",
        directorBeat:
          "A real strike is on the line. Set the rod, ease it, ask your date to take it, or step back. Move now. Do not voice the pool.",
      },
      {
        id: "wet-market-three-seas-event-5",
        title: "Stone flare",
        kind: "provocation",
        pitch:
          "Flare the hot stone in front of the pair to ready with the corner light steady. Forces a real next move at the grill.",
        beat: "The hot stone in front of the pair flares once. A small red light at the corner of the two-top turns steady. The tongs at the table hang on a side rail. Whatever lands on the stone in the next minute will cook.",
        directorBeat:
          "The grill is ready. Bring something from the tank, ask your date what they want cooked, decline and step away, or pick up the tongs. The minute is counting. Do not voice the stone.",
      },
      {
        id: "wet-market-three-seas-event-6",
        title: "Knife on a stubborn oyster",
        kind: "provocation",
        pitch:
          "Slip a shucking knife on an oyster hinge with the chain hitting the rail. Forces a real physical move on the knife.",
        beat: "The shucking knife slips on the hinge of an oyster on the rail. The oyster stays shut. The chained handle hits the rail. The towel under the oyster is dry.",
        directorBeat:
          "A real knife and a real oyster need a hand. Take the knife and reset, hand it across to your date, or step back. Use your hands. Do not voice the oyster.",
      },
      {
        id: "wet-market-three-seas-event-7",
        title: "A scale prints a chit",
        kind: "reveal",
        pitch:
          "Print a chit at the scale naming the full sea of origin for the catch. Surfaces a small honest reaction drawn from existing context.",
        beat: "The scale at the weighing station prints a small chit for a recent catch. The chit lists the catch by weight and names the sea by full name. One of the three is on the chit.",
        directorBeat:
          "A specific sea just got named on a small slip. Read it aloud, ask your date if they know that water, comment on the weight, or set the chit aside. Stay honest. Do not voice the scale.",
      },
      {
        id: "wet-market-three-seas-event-8",
        title: "A tasting cup is offered",
        kind: "reveal",
        pitch:
          "Extend a small clay cup of steaming broth across the rail without a word from the corner vendor. Surfaces care drawn only from existing context.",
        beat: "A vendor at the corner stall extends a small clay cup of broth across the rail without looking up. The cup sits on the rail. The broth is steaming. The vendor steps back to the cleaver.",
        directorBeat:
          "A small free taste is on the rail for you. Take it, hand it to your date, decline politely, or comment to your date on the steam. Show how you receive care from a stranger. Do not voice the vendor.",
      },
      {
        id: "wet-market-three-seas-event-9",
        title: "Old chit on the bulletin",
        kind: "reveal",
        pitch:
          "Pin an old chit on the bulletin near the scale with both their first names in pencil. Surfaces a callback for repeat pairs or curiosity for first visits.",
        beat: "The bulletin near the weighing station holds a small wall of old chits. One pinned chit lists a recent catch with both their first names in pencil at the top. The pencil mark is fresh enough to read.",
        directorBeat:
          "Your names are on the bulletin already. Read the chit aloud, ask your date if they remember the catch, comment on the pencil mark, or pin it back. Tie it to what you already know. Do not voice the bulletin.",
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
