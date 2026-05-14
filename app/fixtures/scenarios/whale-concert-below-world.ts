import type { DateScenario } from "../../domain/game";

export const whaleConcertBelowWorld: DateScenario = {
  id: "whale-concert-below-world",
  title: "Concert In The Whale Below The World",
  card: {
    summary:
      "A small set inside the rib cavity of a leviathan that surfaces beneath one continent twice a century. Twenty seats. No phones.",
    tags: ["cosmic", "public", "high_pressure"],
    risk: "medium",
    intimacy: "high",
    chaos: "medium",
    cost: 27,
    idealFor: [
      "members who can sit with awe without narrating it",
      "members who let live music be a shared event, not a backdrop to a pitch",
      "members who absorb a strange room as fact",
    ],
    badFor: [
      "members who need to record every moment to feel it counted",
      "members who treat awe as a competition for who is more moved",
      "members who narrate the whale to the partner",
    ],
  },
  publicBrief: {
    location: "Two seats in row two of the rib cavity stage on the leviathan called Below",
    premise:
      "Cupid reserved a small show inside a leviathan that surfaces under one continent twice a century. The set is forty minutes. The whale dives at the end.",
    whatBothCharactersKnow:
      "Below is alive and not aware of them in any meaningful way. The bass is its heartbeat, slow and steady. Phones do not work inside the rib cavity. The set ends when Below dives. There is no encore.",
    openingSituation:
      "Both members are seated in row two. The seats are woven from baleen and slightly warm. The band at the front of the cavity is tuning a stringed instrument made from gut. The ribs above arch into a soft dim.",
  },
  director: {
    tone: "warm wet air, slow heartbeat bass, low oil-lamp light, low conversation in the row behind",
    rules: [
      "Anchor the date to row two, seats six and seven. The pair stays in their seats through the set.",
      "Use the whale as ambient fact. Below does not address the audience.",
      "Do not voice the band as characters. They play, they retune, they nod.",
      "Use the unrecordable nature of the venue to test whether either of them can be present without a record.",
    ],
    events: [
      {
        id: "whale-concert-below-world-event-1",
        title: "First downbeat",
        kind: "ambient",
        event: "The band hits the first measured downbeat.",
        characterVisibleText:
          "The first downbeat lands. The bass is the whale's heartbeat slowed to half time. The strings sit on top of it. The seats are warm under the legs. The pair has not spoken since the lights went down.",
        directorInstruction:
          "Open the set quietly. Let either of them adjust to the new time signature. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "whale-concert-below-world-event-2",
        title: "Phone dead",
        kind: "reveal",
        event: "A phone screen goes dark in a lap.",
        characterVisibleText:
          "One of their phones, taken out of habit, has gone dark in the lap. The signal bars are gone. The volume buttons do nothing. The band has not paused.",
        directorInstruction:
          "Use the small forced presence to surface whether either of them treats it as loss or as freedom, drawn from each member's existing relationship to a phone. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "whale-concert-below-world-event-3",
        title: "Heat shift",
        kind: "ambient",
        event: "The cavity warms a degree as the whale breathes in.",
        characterVisibleText:
          "The walls of the cavity warm a noticeable degree as Below draws a slow breath. The lights bob a half inch on their hooks. The pair feels the breath in the floor.",
        directorInstruction: "Allow the small physical fact. The pair does not need to explain it.",
      },
      {
        id: "whale-concert-below-world-event-4",
        title: "Mid-set still",
        kind: "reveal",
        event: "The band rests between songs and the heartbeat is the only sound.",
        characterVisibleText:
          "The band lowers their instruments for a moment. The heartbeat is the only sound. It is a long held breath wide. The row behind theirs is silent.",
        directorInstruction:
          "Use the silence as the test. Either of them may speak or hold the quiet. Either is right if it is honest. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "whale-concert-below-world-event-5",
        title: "Hand on rail",
        kind: "reveal",
        event: "A hand rests on the brass rail along the seat back in front.",
        characterVisibleText:
          "A small brass rail runs along the back of the seat in front of them. One of them rests a hand on it. The brass is body temperature. The other member's hand is on the armrest, the back of it visible in the low light.",
        directorInstruction:
          "Use the small physical proximity to test whether either of them closes the small distance without making it a moment.",
      },
      {
        id: "whale-concert-below-world-event-6",
        title: "Band lift",
        kind: "ambient",
        event: "The band lifts back into the set without announcement.",
        characterVisibleText:
          "The band lifts back into a longer piece without announcement. The bass keeps the heartbeat under it. A small lamp at the band's feet flickers and steadies.",
        directorInstruction:
          "Let the second half of the set carry. The pair does not need to fill it. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "whale-concert-below-world-event-7",
        title: "Pre-dive cue",
        kind: "provocation",
        event: "A staff hand walks the aisle at low height.",
        characterVisibleText:
          "A staff hand walks the aisle at low height with a small lantern. The lantern glow passes the row. A folded card is placed on the rail in front of seats six and seven. The card reads: dive in seven minutes, no encore.",
        directorInstruction:
          "Push for one direct line about what either of them wants from the rest of the set. The staff hand does not speak.",
      },
      {
        id: "whale-concert-below-world-event-8",
        title: "Last bar",
        kind: "provocation",
        event: "The band lands the last bar and Below begins to sink.",
        characterVisibleText:
          "The last bar lands. The cavity tilts a small degree as Below begins to sink. The lights stay on their hooks. The heartbeat is unchanged. The aisle has begun to clear at the row behind.",
        directorInstruction:
          "Push for a clean exit. The pair walks the aisle together or separately. Either is the right answer if it is chosen. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "whale-concert-below-world-event-9",
        title: "Cavity tilt",
        kind: "provocation",
        event: "The cavity tilts harder as Below shifts toward the dive.",
        characterVisibleText:
          "The cavity tilts another two degrees as Below shifts. The lamps swing a wider arc on their hooks. The aisle has cleared the row behind theirs and the band has packed two cases.",
        directorInstruction:
          "Push for a physical move: stand and walk the aisle, hold the rail, or stay seated through the dive. The cavity will not tilt back. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member tries to capture the venue and refuses to let the venue stay strange.",
      "A member treats the partner's awe as a flaw in the partner.",
    ],
    repeatBehavior:
      "Below surfaces twice a century. If the same pair returns at the next surfacing, the seat assignment defaults to row two, seats six and seven, by record.",
  },
  judgeRubric: {
    successSignals: [
      "The pair sits in awe without having to name it.",
      "A member receives the partner's quiet without filling it.",
    ],
    failureSignals: [
      "A member treats the venue as content to extract.",
      "The pair argues about who is more moved.",
    ],
    statFocus: ["chemistry", "weirdnessTolerance", "relationshipHealth"],
  },
};
