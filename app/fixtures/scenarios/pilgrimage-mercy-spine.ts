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
        event: "The petition form is on the clipboard at the booth.",
        characterVisibleText:
          "A clipboard rests on the booth counter. The top form has two blank lines for the wish, two signature blocks, and a small block at the bottom that reads: filed jointly or not filed. The pen is uncapped. The ranger is two seats over with a thermos.",
        directorInstruction:
          "Let the form set the bar. Neither member has to fill it. They have ninety minutes before the cairn.",
      },
      {
        id: "pilgrimage-mercy-spine-event-2",
        title: "First marker",
        event: "The first trail marker stands at the base of rib eight.",
        characterVisibleText:
          "A small wooden marker reads marker one, ten percent. The trail past it climbs at a comfortable angle. A faint slow drum pulses through the rock under their feet, twice a minute.",
        directorInstruction:
          "Use the long walk to surface what either of them actually wants but has not said.",
      },
      {
        id: "pilgrimage-mercy-spine-event-3",
        title: "Other pair",
        event: "Another pair passes on their way down with the form unsigned.",
        characterVisibleText:
          "Two other pilgrims pass on their way down the trail. The lead pilgrim carries a clipboard. The petition form clipped to it has both signature lines blank. They nod at the pair and keep walking.",
        directorInstruction:
          "Allow the small benchmark moment. The pair may use it or set it aside.",
      },
      {
        id: "pilgrimage-mercy-spine-event-4",
        title: "Resting bench",
        event: "A resting bench cut from the god's bone sits between markers four and five.",
        characterVisibleText:
          "A bench sits in a notch between two ribs. The bench is carved from a chip of bone. A small plaque reads: bench five, intended for a quiet exchange. A bottle of water has been left by a previous pair.",
        directorInstruction:
          "Use the bench to invite a single direct sentence about what each of them might actually want.",
      },
      {
        id: "pilgrimage-mercy-spine-event-5",
        title: "Heart drum",
        event: "The drum under the rock skips a beat.",
        characterVisibleText:
          "The slow drum under the trail pauses by half a beat and resumes. A sparrow on a rock blinks once. The petition form on the clipboard is still blank.",
        directorInstruction:
          "Treat the small skip as ordinary weather. The deity is asleep. The pair does not need to comment on it.",
      },
      {
        id: "pilgrimage-mercy-spine-event-6",
        title: "Summit approach",
        event: "The summit cairn comes into view above marker eight.",
        characterVisibleText:
          "The summit cairn comes into view at the top of the spine, a stack of small stones at chest height. A flat slate rests on top with a slot for the form. The trail past marker eight gentles toward it.",
        directorInstruction:
          "Push for a real exchange before the cairn. The wish has to fit in one shared sentence.",
      },
      {
        id: "pilgrimage-mercy-spine-event-7",
        title: "Cairn slot",
        event: "The slate on the cairn opens its slot.",
        characterVisibleText:
          "At the cairn, the slate's small slot opens with a soft click. The clipboard pen is still uncapped. The wish lines on the form are still blank. The drum is steady.",
        directorInstruction:
          "Allow whatever happens. A signed shared wish, two different unsigned drafts, or a clean refusal are all real outcomes.",
      },
      {
        id: "pilgrimage-mercy-spine-event-8",
        title: "Descent",
        event: "The form is filed or pocketed and the trail begins descending.",
        characterVisibleText:
          "The clipboard is in one of their hands as the trail begins back down. The form is either in the slot or still on the board. The drum is unchanged. The ranger booth is forty minutes back the way they came.",
        directorInstruction:
          "Push for a clean read on whether the pair shares the descent the way they shared the climb.",
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
