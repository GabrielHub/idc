import type { DateScenario } from "../../domain/game";

export const whaleConcertBelowWorld: DateScenario = {
  id: "whale-concert-below-world",
  title: "Belly Of The Beast",
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
        pitch:
          "Hit the first downbeat with the bass at half time of the whale's heartbeat and the seats warm under the legs. Surfaces who adjusts to the new time signature.",
        beat: "The first downbeat lands. The bass is the whale's heartbeat slowed to half time. The strings sit on top of it. The seats are warm under the legs. The pair has not spoken since the lights went down.",
        directorBeat:
          "The set has started. Settle into the bass, glance at your date, comment on the heartbeat, or sit quiet. Do not narrate the music. Do not voice the band.",
      },
      {
        id: "whale-concert-below-world-event-2",
        title: "Phone dead",
        kind: "reveal",
        pitch:
          "Black out a phone in a lap with no signal and dead volume buttons. Surfaces whether either treats it as loss or freedom.",
        beat: "One of their phones, taken out of habit, has gone dark in the lap. The signal bars are gone. The volume buttons do nothing. The band has not paused.",
        directorBeat:
          "Your habit just hit a wall. Comment on the dead phone to your date, pocket it without a word, ask if theirs works, or laugh at the reflex. Speak from your own register. Do not voice the phone.",
      },
      {
        id: "whale-concert-below-world-event-3",
        title: "Heat shift",
        kind: "ambient",
        pitch:
          "Warm the cavity a noticeable degree as Below draws a slow breath with the lights bobbing a half inch. Surfaces the body of the room.",
        beat: "The walls of the cavity warm a noticeable degree as Below draws a slow breath. The lights bob a half inch on their hooks. The pair feels the breath in the floor.",
        directorBeat:
          "Something the size of a building just inhaled around you. Lean back into the warmth, take your date's hand, comment briefly on the lamps, or sit still. Show your relationship with awe.",
      },
      {
        id: "whale-concert-below-world-event-4",
        title: "Mid-set still",
        kind: "reveal",
        pitch:
          "Lower the band's instruments to leave only the heartbeat with the row behind silent. Forces a stance: speak or hold the quiet.",
        beat: "The band lowers their instruments for a moment. The heartbeat is the only sound. It is a long held breath wide. The row behind theirs is silent.",
        directorBeat:
          "The silence between songs is doing its own work. Hold it, speak one honest short sentence to your date, take their hand, or close your eyes. Either is right if it is honest. Do not voice the band.",
      },
      {
        id: "whale-concert-below-world-event-5",
        title: "Hand on rail",
        kind: "reveal",
        pitch:
          "Rest one hand on the brass rail along the seat in front with the other date's hand visible on the armrest. Surfaces whether either closes the small distance.",
        beat: "A small brass rail runs along the back of the seat in front of them. One of them rests a hand on it. The brass is body temperature. The other member's hand is on the armrest, the back of it visible in the low light.",
        directorBeat:
          "Two hands are visible in low light. Slide yours closer, take their hand quietly, comment without making it a moment, or hold your place. Do not stage it.",
      },
      {
        id: "whale-concert-below-world-event-6",
        title: "Band lift",
        kind: "ambient",
        pitch:
          "Lift the band back into a longer piece with the bass still keeping the heartbeat. Surfaces a stretch the pair does not need to fill.",
        beat: "The band lifts back into a longer piece without announcement. The bass keeps the heartbeat under it. A small lamp at the band's feet flickers and steadies.",
        directorBeat:
          "The second half is starting. Stay with the music, lean closer to your date, glance at the lamp, or close your eyes. Do not narrate the lift. Do not voice the band.",
      },
      {
        id: "whale-concert-below-world-event-7",
        title: "Pre-dive cue",
        kind: "provocation",
        pitch:
          "Walk a staff hand with a small lantern down the aisle and place a card on the rail: dive in seven minutes, no encore. Forces one direct line about what either wants from the rest.",
        beat: "A staff hand walks the aisle at low height with a small lantern. The lantern glow passes the row. A folded card is placed on the rail in front of seats six and seven. The card reads: dive in seven minutes, no encore.",
        directorBeat:
          "Seven minutes left under Below. Say one honest line about what you want from the rest, ask your date the same, or hold their hand and stay in the music. Do not voice the staff hand or the card.",
      },
      {
        id: "whale-concert-below-world-event-8",
        title: "Last bar",
        kind: "provocation",
        pitch:
          "Land the last bar as the cavity tilts a small degree and Below begins to sink with the aisle behind clearing. Forces a clean exit.",
        beat: "The last bar lands. The cavity tilts a small degree as Below begins to sink. The lights stay on their hooks. The heartbeat is unchanged. The aisle has begun to clear at the row behind.",
        directorBeat:
          "The set is closing. Stand to walk the aisle with your date, hold a beat to feel the dive begin, propose where to go next, or sit through the last few seconds. Choose how you leave.",
      },
      {
        id: "whale-concert-below-world-event-9",
        title: "Cavity tilt",
        kind: "provocation",
        pitch:
          "Tilt the cavity another two degrees as Below shifts toward the dive with the lamps swinging wider. Forces a clean physical move.",
        beat: "The cavity tilts another two degrees as Below shifts. The lamps swing a wider arc on their hooks. The aisle has cleared the row behind theirs and the band has packed two cases.",
        directorBeat:
          "The floor is moving harder under you. Stand and walk the aisle, hold the rail, take your date's hand and steady, or stay seated through the dive. Move physically now. Do not voice the band.",
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
