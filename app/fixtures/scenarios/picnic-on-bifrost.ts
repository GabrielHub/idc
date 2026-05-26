import type { DateScenario } from "../../domain/game";

export const picnicOnBifrost: DateScenario = {
  id: "picnic-on-bifrost",
  title: "Picnic On The Bifrost",
  card: {
    summary:
      "A two-person picnic on a flat segment of the rainbow bridge between worlds. The surface holds, the watchman stands at his post very far off, the sky above carries several cosmologies at once.",
    tags: ["cosmic", "low_pressure", "food", "repeat_risk"],
    risk: "low",
    intimacy: "medium",
    chaos: "low",
    cost: 28,
    idealFor: [
      "members who can sit on a sacred road without making it the topic",
      "members who can let a long quiet ride a cosmic surface",
      "members who can name a worry only when they want to",
    ],
    badFor: [
      "members who turn the bridge into a personal pitch",
      "members who treat the worlds below as content to riff on",
      "members who use the scale to skip the conversation",
    ],
  },
  publicBrief: {
    location: "Bifrost, flat midpoint segment, two-person picnic",
    premise:
      "Cupid booked a two-person picnic on a flat segment of the rainbow bridge between worlds. The surface holds steady. The booking is one hour.",
    whatBothCharactersKnow:
      "The bridge runs between worlds. The flat segment under the blanket is steady and warm. The watchman stands at his post very far off and does not approach. The basket holds two cups, a thermos, and a folded note. The sky above carries stars from several cosmologies overlapping. The bridge has a low rail along the edge. The booking lasts one hour.",
    openingSituation:
      "Both members are on the blanket on the flat segment. The basket sits between them. The thermos is upright. The watchman is visible at the far end of the bridge as a small steady figure. The bridge curves up and down to other worlds at the edge of vision.",
  },
  director: {
    tone: "the soft hum of a cosmic surface, the warmth from below the bridge, the long quiet of a high road, the stars overlapping in two and three at once",
    rules: [
      "Anchor the date to the flat segment. The pair does not walk along the bridge.",
      "Treat the watchman as a horizon detail. He does not approach.",
      "Allow either member to name the worlds below or leave them.",
      "Do not voice the watchman, the bridge, or any constellation as continuing speakers.",
    ],
    events: [
      {
        id: "picnic-on-bifrost-event-1",
        title: "Overlapping stars",
        kind: "ambient",
        pitch:
          "Set stars from several cosmologies overlapping in two and three at once above the blanket. Surfaces small wonder without making the sky a topic.",
        beat: "The stars above the blanket sit in two and three at once. One bright cluster is two clusters depending on which eye is dominant. The sky between holds steady against the bridge light.",
        directorBeat:
          "Two skies are doing the work of one. Notice them, comment on the doubled cluster, ask your date which they see, or stay quiet under the layering. Do not narrate the sky like a star map.",
      },
      {
        id: "picnic-on-bifrost-event-2",
        title: "Surface warms",
        kind: "ambient",
        pitch:
          "Warm the bridge surface a degree from below under the blanket. Surfaces a small physical comfort that does not need narration.",
        beat: "The surface under the blanket warms a single degree. The warmth comes from below, not from above. The blanket holds the heat at the corners.",
        directorBeat:
          "The bridge just got warmer under you. Lean back into it, comment to your date on the corners holding the heat, or stay quiet with the change. Do not turn the warmth into a metaphor.",
      },
      {
        id: "picnic-on-bifrost-event-3",
        title: "Soft hum underfoot",
        kind: "ambient",
        pitch:
          "Pulse a low hum from under the bridge surface at the edge of hearing. Surfaces presence without forcing comment.",
        beat: "A soft low hum rises from under the bridge surface on a slow pulse. The hum is at the edge of hearing. The basket does not shift. The thermos holds steady.",
        directorBeat:
          "Something far below is keeping time. Listen for it, mention it to your date once, or let it ride under your breath. Do not voice the bridge.",
      },
      {
        id: "picnic-on-bifrost-event-4",
        title: "Bridge curves catch the eye",
        kind: "provocation",
        pitch:
          "Brighten the upper curve as a world surface flashes through cloud, and dim the lower to deep blue. Forces a real small move on looking or staying on the blanket.",
        beat: "The bridge curves up and down at the edge of vision to other worlds. The curve at the upper edge brightens for a beat as a world surface flashes through cloud. The curve at the lower edge dims to a deep blue. The flat segment under the blanket holds.",
        directorBeat:
          "The bridge just showed you two of the worlds it connects. Look up, look down, name one to your date, or hold your eyes on the blanket. Do not let the scale push you into a speech.",
      },
      {
        id: "picnic-on-bifrost-event-5",
        title: "A figure passes below",
        kind: "provocation",
        pitch:
          "Pass a small winged figure with a wingspan wider than the bridge edge far below in four counts. Forces a real reaction, not narration.",
        beat: "A small winged figure passes far below the lower curve at a long angle. The wingspan is wider than the bridge edge. The figure does not climb. The figure is gone past the rail in a count of four.",
        directorBeat:
          "Something with wings just crossed under you. React in body or one short line: hold still, take your date's hand, comment quietly, or look down. Do not narrate the flight.",
      },
      {
        id: "picnic-on-bifrost-event-6",
        title: "Constellation shifts",
        kind: "provocation",
        pitch:
          "Resettle a constellation directly above the blanket into a shape from a different cosmology. Forces a real reaction.",
        beat: "A constellation directly above the blanket holds for a long count and then resettles into a different shape. The new shape sits in a different cosmology. The change holds. The other clusters do not move.",
        directorBeat:
          "Your sky just rewrote itself. Comment on the change to your date, ask which cosmology they see now, sit still with it, or close your eyes. Speak from what you already carry.",
      },
      {
        id: "picnic-on-bifrost-event-7",
        title: "Folded note in the basket",
        kind: "reveal",
        pitch:
          "Place a clean-folded note with one short line in a careful hand in the basket lid. Surfaces a stance on opening or leaving.",
        beat: "A folded note rests in the basket lid. The fold is clean. The paper carries one short line in a careful hand. The note has not been opened.",
        directorBeat:
          "A small note is waiting on you. Open it and read aloud, hand it to your date, leave it folded, or comment on the careful hand. Make the small choice. Do not voice the note.",
      },
      {
        id: "picnic-on-bifrost-event-8",
        title: "Watchman at his post",
        kind: "reveal",
        pitch:
          "Hold the watchman at his post at the far end of the bridge, too small to read a face. Surfaces a stance from what either already carries.",
        beat: "The watchman holds at his post at the far end of the bridge. The figure is small at this distance. The stance has not changed since the start of the booking. The watchman is too far off for the pair to read a face.",
        directorBeat:
          "You can see him and he is not approaching. Comment on the distance, ask your date what they make of being watched gently, or look away and back to the blanket. Do not voice the watchman.",
      },
      {
        id: "picnic-on-bifrost-event-9",
        title: "A small coin in the basket",
        kind: "reveal",
        pitch:
          "Tuck a small worn coin with a recent date and a prior-visit mark into the basket pocket. Surfaces callback for repeat pairs or curiosity for first visits.",
        beat: "A small worn coin sits in the basket pocket between the two cups. The coin carries a date and a small mark on the rim. The mark is from the prior visit. The date is recent.",
        directorBeat:
          "A small artifact of your prior bridge sits between the cups. Pick it up, read the date aloud, ask your date if they remember leaving it, or set it back. Tie it to what you already know.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the bridge as a personal pitch.",
      "A member treats the worlds below as content to riff on.",
    ],
    repeatBehavior:
      "If repeated, the flat segment is held for the pair. The blanket is at the center, the basket has the cups, the watchman holds at his post very far off. The worn coin in the basket pocket is from the prior visit.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a long quiet ride a cosmic surface.",
      "A member names a small worry only when they want to.",
    ],
    failureSignals: [
      "A member uses the bridge to perform a position.",
      "The pair argues about which world below is real.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
