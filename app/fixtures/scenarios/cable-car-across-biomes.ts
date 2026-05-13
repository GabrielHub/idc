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
        event: "The cabin crosses the frozen lake at low altitude.",
        characterVisibleText:
          "The window holds a wide frozen lake. The ice is shot through with a pale blue. A thin crack runs from one shore to the other. The wind on the cable is a low hum through the cabin floor.",
        directorInstruction: "Allow the small view. The pair does not need to comment on the ice.",
      },
      {
        id: "cable-car-across-biomes-event-2",
        title: "Tower bump",
        kind: "provocation",
        event: "The cabin clears a support tower with a small jolt.",
        characterVisibleText:
          "The cabin clears a support tower. The car shifts a small jolt and the cable hum changes pitch for a beat. The kettle in its slot rocks once and settles. The seat backs press into shoulders for a half second.",
        directorInstruction:
          "Push for a small physical adjustment: a hand to the seat, a foot to the floor, a shift on the cushion. The cabin is steady again on the next beat.",
      },
      {
        id: "cable-car-across-biomes-event-3",
        title: "Kettle and thermos",
        kind: "reveal",
        event: "The kettle slot opens with a small chime.",
        characterVisibleText:
          "A small chime sounds in the cabin. The kettle slot opens and the thermos slides forward. The thermos is hot to the hand. Two cups sit beside it on a small shelf. A small card on the shelf reads: one each, refill at the oasis.",
        directorInstruction:
          "Use the small offering to surface care drawn from existing context. Either may pour first or wait. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "cable-car-across-biomes-event-4",
        title: "Red dunes",
        kind: "ambient",
        event: "The cabin crosses red dunes.",
        characterVisibleText:
          "The biome below has shifted from frozen lake to red dunes. The dunes are slow under the cable. The shadow of the cabin moves across them in a small dark shape. The window holds a long unbroken view.",
        directorInstruction: "Allow the slow shift. The pair does not need to narrate the change.",
      },
      {
        id: "cable-car-across-biomes-event-5",
        title: "Flock crossing",
        kind: "reveal",
        event: "A flock of long-necked creatures crosses below the cable.",
        characterVisibleText:
          "A flock of long-necked creatures crosses the dunes below in a loose line. The line stretches for a beat and then closes. The flock does not look up. The cabin keeps its pace.",
        directorInstruction:
          "Use the small living detail to surface attention drawn from existing context. The flock does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "cable-car-across-biomes-event-6",
        title: "Salt flat color ribbon",
        kind: "ambient",
        event: "The cabin crosses the glass salt flat and a color ribbon lifts off it.",
        characterVisibleText:
          "The biome below is a wide glass salt flat. A faint color ribbon rises off the surface, a slow shimmer of greens and pinks against the light. The cabin's shadow ripples through it.",
        directorInstruction:
          "Allow the optical event. The pair does not need to interpret the color.",
      },
      {
        id: "cable-car-across-biomes-event-7",
        title: "ETA strip",
        kind: "reveal",
        event: "The ETA strip at the top of the window updates.",
        characterVisibleText:
          "The small ETA strip at the top of the window ticks from twenty minutes to fifteen. The strip carries a small green dot at the right edge. The cabin has crossed into the jungle layer below. The light through the window has warmed by a noticeable degree.",
        directorInstruction:
          "Use the small time marker to surface something honest drawn from existing context. Either may take it as a marker or not. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "cable-car-across-biomes-event-8",
        title: "Thermal lift",
        kind: "provocation",
        event: "A thermal lifts the cabin briefly.",
        characterVisibleText:
          "A thermal lifts the cabin a small height and the cable's tension changes pitch. The kettle in the slot taps the wall once. The horizon through the window tilts a degree and steadies.",
        directorInstruction:
          "Push for a clean physical answer: a brace, a hand to the rail above the window, or a hand to the partner's seat back. The cabin will settle on the next beat.",
      },
      {
        id: "cable-car-across-biomes-event-9",
        title: "Oasis chime",
        kind: "provocation",
        event: "The oasis station chime sounds.",
        characterVisibleText:
          "The cabin plays one soft chime. The ETA strip reads two minutes. The window holds the oasis station, a green ring around a small dome and a low pool. The cable hum has begun to slow.",
        directorInstruction:
          "Push for a clean exit. The pair stands together or one moves first. Either is the right answer if it is honest. Do not voice any background person or cue as a continuing speaker.",
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
