import type { DateScenario } from "../../domain/game";

export const cableCarAcrossBiomes: DateScenario = {
  id: "cable-car-across-biomes",
  title: "Cable Car Across The Biomes",
  card: {
    summary:
      "A two-person cable car from a snowy peak to an oasis station, forty minutes across an alien planet. Snow, frozen lake, red dunes, glass salt flat, jungle, oasis.",
    tags: ["cosmic", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 16,
    idealFor: [
      "members who can share a small moving room without filling it",
      "members who let a view shift without narrating it",
      "members who handle a long descent at one pace",
    ],
    badFor: [
      "members who turn each biome into a metaphor",
      "members who treat the descent as a race to the bottom",
      "members who use a small space to crowd the partner",
    ],
  },
  publicBrief: {
    location:
      "Cabin 4, Northridge to Oasis line, the long cable from the snow station to the green station",
    premise:
      "Cupid booked one cable car. The line runs from a peak station above the snow to a station in a small oasis, across an alien planet. The descent takes forty minutes.",
    whatBothCharactersKnow:
      "The cabin holds two seats facing forward. Each side has its own window. The line crosses snow, frozen lake, red dunes, glass salt flat, jungle, then the oasis. A kettle compartment holds a thermos and two cups. A small ETA strip is at the top of one window. The cabin runs on a fixed timetable. The hatches at both stations open on schedule.",
    openingSituation:
      "Both members are in the cabin. The peak station hatch has closed. The cabin has started a smooth descent. The first biome through the window is the snow line and the frozen lake.",
  },
  director: {
    tone: "the steady hum of the cable, small thermal bumps at each tower, wide alien light through both windows, the air dry then warming",
    flow: "conversation",
    rules: [
      "Anchor the date to the cabin and the two seats. The pair does not get up to walk the line.",
      "Treat the biomes as fact, not metaphor.",
      "Allow the cabin to be small. Crowding the partner without need is a fail surface.",
      "Allow the descent to pace the conversation.",
    ],
    events: [
      {
        id: "cable-car-across-biomes-event-1",
        title: "Frozen lake",
        kind: "ambient",
        pitch:
          "Hold the window on a wide blue-cracked frozen lake. Surfaces who watches the view and who watches the partner.",
        beat: "The window holds a wide frozen lake. The ice is shot through with a pale blue. A thin crack runs from one shore to the other. The wind on the cable is a low hum through the cabin floor.",
        directorBeat:
          "A long view is hanging at the window. Look out, point at the crack, comment to your date on the color, or face them instead of the glass. Make the choice visible.",
      },
      {
        id: "cable-car-across-biomes-event-2",
        title: "Tower bump",
        kind: "provocation",
        pitch:
          "Jolt the cabin clean of a support tower. Forces a small physical adjustment between you.",
        beat: "The cabin clears a support tower. The car shifts a small jolt and the cable hum changes pitch for a beat. The kettle in its slot rocks once and settles. The seat backs press into shoulders for a half second.",
        directorBeat:
          "The cabin just jolted. Brace, steady the kettle, lean toward your date, or pretend nothing happened. Use the body in your next beat.",
      },
      {
        id: "cable-car-across-biomes-event-3",
        title: "Kettle and thermos",
        kind: "reveal",
        pitch:
          "Open the kettle slot with a hot thermos and two cups. Forces a small offering: pour for both, wait for them, or skip it.",
        beat: "A small chime sounds in the cabin. The kettle slot opens and the thermos slides forward. The thermos is hot to the hand. Two cups sit beside it on a small shelf. A small card on the shelf reads: one each, refill at the oasis.",
        directorBeat:
          "A warm pour is in reach. Pour for both, ask your date what they want, hand them the thermos, or decline. Show care or distance with your hands. Do not voice the card.",
      },
      {
        id: "cable-car-across-biomes-event-4",
        title: "Red dunes",
        kind: "ambient",
        pitch:
          "Slide red dunes under the cable for a long beat. Surfaces a pacing choice: speak into the view or let it run.",
        beat: "The biome below has shifted from frozen lake to red dunes. The dunes are slow under the cable. The shadow of the cabin moves across them in a small dark shape. The window holds a long unbroken view.",
        directorBeat:
          "The view has changed and slowed. Stay quiet with your date, point at the shadow, raise a topic the dunes pull up for you, or close your eyes a beat. Decide whether to fill the air or let it ride.",
      },
      {
        id: "cable-car-across-biomes-event-5",
        title: "Flock crossing",
        kind: "reveal",
        pitch:
          "Draw a flock of long-necked creatures across the dunes below. Surfaces attention drawn only from what you already see.",
        beat: "A flock of long-necked creatures crosses the dunes below in a loose line. The line stretches for a beat and then closes. The flock does not look up. The cabin keeps its pace.",
        directorBeat:
          "Something living just crossed your window. Point them out, describe the line, ask your date what they see, or watch quietly. Speak only from what is in front of you. Do not voice the flock.",
      },
      {
        id: "cable-car-across-biomes-event-6",
        title: "Salt flat color ribbon",
        kind: "ambient",
        pitch:
          "Lift a slow green and pink color ribbon off the glass salt flat. Surfaces wonder without forcing interpretation.",
        beat: "The biome below is a wide glass salt flat. A faint color ribbon rises off the surface, a slow shimmer of greens and pinks against the light. The cabin's shadow ripples through it.",
        directorBeat:
          "Something strange and pretty is happening below you. Say what colors you see, ask your date if they see the same, sit silent with it, or comment on the shadow rippling through. Stay honest about what is actually visible.",
      },
      {
        id: "cable-car-across-biomes-event-7",
        title: "ETA strip",
        kind: "reveal",
        pitch:
          "Tick the ETA strip down to fifteen minutes. Surfaces who notices time and how it changes the rhythm.",
        beat: "The small ETA strip at the top of the window ticks from twenty minutes to fifteen. The strip carries a small green dot at the right edge. The cabin has crossed into the jungle layer below. The light through the window has warmed by a noticeable degree.",
        directorBeat:
          "The clock just moved on you. Mention the time, propose what you want to fit before the oasis, ask your date the same, or ignore it. Take a stance on the time left.",
      },
      {
        id: "cable-car-across-biomes-event-8",
        title: "Thermal lift",
        kind: "provocation",
        pitch:
          "Lift the cabin briefly on a thermal and tilt the horizon a degree. Forces a clean physical answer: brace, grab a rail, or steady your date.",
        beat: "A thermal lifts the cabin a small height and the cable's tension changes pitch. The kettle in the slot taps the wall once. The horizon through the window tilts a degree and steadies.",
        directorBeat:
          "The floor just rose under you. Brace against the rail, reach for your date's seat back, steady the kettle, or sit still and ride it. Show how you handle small turbulence.",
      },
      {
        id: "cable-car-across-biomes-event-9",
        title: "Oasis chime",
        kind: "provocation",
        pitch:
          "Chime the oasis station at two minutes out. Forces a clean exit from the cabin and a stance on the green ahead.",
        beat: "The cabin plays one soft chime. The ETA strip reads two minutes. The window holds the oasis station, a green ring around a small dome and a low pool. The cable hum has begun to slow.",
        directorBeat:
          "The cabin is landing. Stand together, gesture your date out first, propose what to do at the dome, or comment on the green. Pick a move and own it. Do not voice the chime.",
      },
    ],
    earlyEndTriggers: [
      "A member treats each biome as a metaphor for a relationship complaint.",
      "A member uses the small cabin to crowd the partner.",
    ],
    repeatBehavior:
      "If repeated, the line remembers the cabin. The same kettle, the same thermos. The flock crosses at the same tower.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets the descent pace the conversation.",
      "A member offers a cup across the kettle slot without making it a moment.",
    ],
    failureSignals: [
      "A member uses the dunes as a personal pitch.",
      "The pair argues about which biome is best.",
    ],
    statFocus: ["chemistry", "trust", "weirdnessTolerance"],
  },
};
