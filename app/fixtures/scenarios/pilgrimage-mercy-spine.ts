import type { DateScenario } from "../../domain/game";

export const pilgrimageMercySpine: DateScenario = {
  id: "pilgrimage-mercy-spine",
  title: "Pilgrimage Trail, Mercy God's Spine",
  card: {
    summary:
      "A 90-minute marked trail up the vertebrae of a sleeping deity. The summit cairn grants one shared wish.",
    tags: ["cosmic", "prophecy", "low_pressure"],
    risk: "medium",
    intimacy: "high",
    chaos: "low",
    cost: 24,
    idealFor: [
      "members who can want the same thing on purpose",
      "members who treat a wish form as a real document",
      "members who let a long quiet stretch do its own work",
    ],
    badFor: [
      "members who treat a shared wish as a contest",
      "members who refuse to say a want out loud",
      "members who turn a slow walk into a debrief",
    ],
  },
  publicBrief: {
    location: "Trail seven, between rib pair eight, on the spine of the Mercy God",
    premise:
      "Cupid booked a 90-minute pilgrimage on the back of a deity asleep on its side for an age. The summit cairn between the shoulder blades grants one wish per pair, signed jointly.",
    whatBothCharactersKnow:
      "The god is asleep. The trail is marked. The cairn requires both pilgrims to speak the same wish out loud, the same words, no edits, with the petition signed in the same minute. Most pairs hike back unsigned. The slow drum under the stone is the god's heart.",
    openingSituation:
      "Both members stand at the ranger booth at the trailhead between rib seven and rib eight. The booth has a clipboard with a blank petition form on top. The ranger is on a tea break. The first marker on the trail is visible up the slope.",
  },
  director: {
    tone: "slow drum under the stone, cool air on warm rock, mild altitude, sparse other pilgrims",
    rules: [
      "Anchor the date to the trail, ranger booth, and summit cairn. Do not detour onto the god's flanks.",
      "Treat the god as asleep. The deity is scenery and weather, not a speaker.",
      "Use the petition form as a real document, not a metaphor. It has signature lines.",
      "Allow the wish to remain unsigned. An unsigned form is a real outcome.",
    ],
    events: [
      {
        id: "pilgrimage-mercy-spine-event-1",
        title: "Ranger booth",
        kind: "reveal",
        pitch:
          "Set the petition clipboard on the booth counter with two wish lines, two signature blocks, and: filed jointly or not filed. Forces the bar without forcing a fill.",
        beat: "A clipboard rests on the booth counter. The top form has two blank lines for the wish, two signature blocks, and a small block at the bottom that reads: filed jointly or not filed. The pen is uncapped. The ranger is two seats over with a thermos.",
        directorBeat:
          "The form is right there. Pick up the pen, comment on the joint filing rule, ask your date if they want to try, or walk past it for now. Take a stance on the bar. Do not voice the ranger.",
      },
      {
        id: "pilgrimage-mercy-spine-event-2",
        title: "First marker",
        kind: "reveal",
        pitch:
          "Plant marker one ten percent up at the base of rib eight with a slow drum twice a minute. Surfaces what either of you actually wants but has not said.",
        beat: "A small wooden marker reads marker one, ten percent. The trail past it climbs at a comfortable angle. A faint slow drum pulses through the rock under their feet, twice a minute.",
        directorBeat:
          "Ninety percent of the trail is still ahead. Use the long walk: name a want, ask your date what they would put on the form, or stay quiet and pace with the drum. Speak only from your own register. Do not voice the marker.",
      },
      {
        id: "pilgrimage-mercy-spine-event-3",
        title: "Other pair",
        kind: "ambient",
        pitch:
          "Pass two other pilgrims on their way down carrying a clipboard with both signature lines blank. Surfaces a small benchmark.",
        beat: "Two other pilgrims pass on their way down the trail. The lead pilgrim carries a clipboard. The petition form clipped to it has both signature lines blank. They nod at the pair and keep walking.",
        directorBeat:
          "Someone else just walked back without filing. Nod, comment quietly to your date on the unsigned form, or sit with what that means for you. Do not voice the pilgrims.",
      },
      {
        id: "pilgrimage-mercy-spine-event-4",
        title: "Resting bench",
        kind: "reveal",
        pitch:
          "Carve a bench from a chip of bone in a notch with a plaque: intended for a quiet exchange. Forces one direct sentence about what either actually wants.",
        beat: "A bench sits in a notch between two ribs. The bench is carved from a chip of bone. A small plaque reads: bench five, intended for a quiet exchange. A bottle of water has been left by a previous pair.",
        directorBeat:
          "The bench is asking for one direct line. Sit, name a want aloud, ask your date theirs, or hand them the water and listen. Stay honest. Do not voice the plaque.",
      },
      {
        id: "pilgrimage-mercy-spine-event-5",
        title: "Heart drum",
        kind: "ambient",
        pitch:
          "Skip the drum under the trail by half a beat with a sparrow's single blink. Surfaces small weather without forcing comment.",
        beat: "The slow drum under the trail pauses by half a beat and resumes. A sparrow on a rock blinks once. The petition form on the clipboard is still blank.",
        directorBeat:
          "The deity's pulse just shifted a hair. Treat it as weather, comment briefly, or carry on the climb. Do not invent an omen.",
      },
      {
        id: "pilgrimage-mercy-spine-event-6",
        title: "Summit approach",
        kind: "provocation",
        pitch:
          "Bring the cairn into view past marker eight with the slate ready and the trail gentling. Forces a real exchange before the cairn.",
        beat: "The summit cairn comes into view at the top of the spine, a stack of small stones at chest height. A flat slate rests on top with a slot for the form. The trail past marker eight gentles toward it.",
        directorBeat:
          "The cairn is in sight. Test the shared sentence aloud with your date, name what you each actually want, or admit you do not have one. The wish has to fit in one shared sentence.",
      },
      {
        id: "pilgrimage-mercy-spine-event-7",
        title: "Cairn slot",
        kind: "provocation",
        pitch:
          "Click the slate's slot open at the cairn with the pen uncapped and the form still blank. Forces a clean physical move before it closes.",
        beat: "At the cairn, the slate's small slot opens with a soft click. The clipboard pen is still uncapped. The wish lines on the form are still blank. The drum is steady.",
        directorBeat:
          "The slot is open. Write the shared wish and file it, hold the form back, ask your date one last time if this is the wish they mean, or step aside together. Do not stall through the closing beat.",
      },
      {
        id: "pilgrimage-mercy-spine-event-8",
        title: "Descent",
        kind: "provocation",
        pitch:
          "Start back down with the clipboard in one of their hands and the booth forty minutes back. Forces a clean read on sharing the descent.",
        beat: "The clipboard is in one of their hands as the trail begins back down. The form is either in the slot or still on the board. The drum is unchanged. The ranger booth is forty minutes back the way they came.",
        directorBeat:
          "The walk home is starting. Take or give the clipboard, comment on the choice you just made, ask your date how they feel about it, or pace the descent quiet. Make the read. Do not voice the drum.",
      },
      {
        id: "pilgrimage-mercy-spine-event-9",
        title: "Wind through ribs",
        kind: "ambient",
        pitch:
          "Funnel a slow wind between rib seven and rib eight with the clipboard pages lifting and settling. Surfaces a small breath that does not need interpretation.",
        beat: "A slow wind funnels between rib seven and rib eight and carries across the trail. The clipboard pages lift and settle. The drum continues its slow count.",
        directorBeat:
          "Wind just crossed your path. Hold the clipboard steady, comment on the rib gap, or carry on at the same pace. Do not invent meaning for the breeze.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the cairn to corner the partner into a wish they did not choose.",
      "A member treats the partner's wish as evidence in a future argument.",
    ],
    repeatBehavior:
      "If repeated, the ranger booth remembers the pair by name. Old unsigned forms are kept on file and may be brought out without comment.",
  },
  judgeRubric: {
    successSignals: [
      "The pair shares a wish they actually mean and sign it together.",
      "The pair refuses the cairn and speaks a real reason out loud.",
    ],
    failureSignals: [
      "A member edits the partner's wish without consent.",
      "The pair fakes a wish to satisfy the cairn.",
    ],
    statFocus: ["trust", "stability", "relationshipHealth"],
  },
};
