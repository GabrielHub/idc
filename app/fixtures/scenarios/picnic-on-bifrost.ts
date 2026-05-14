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
        event: "Stars from several cosmologies overlap above the blanket.",
        characterVisibleText:
          "The stars above the blanket sit in two and three at once. One bright cluster is two clusters depending on which eye is dominant. The sky between holds steady against the bridge light.",
        directorInstruction:
          "Allow the small marker. The stars are not voiced as continuing speakers.",
      },
      {
        id: "picnic-on-bifrost-event-2",
        title: "Surface warms",
        kind: "ambient",
        event: "The bridge surface warms a degree under the blanket.",
        characterVisibleText:
          "The surface under the blanket warms a single degree. The warmth comes from below, not from above. The blanket holds the heat at the corners.",
        directorInstruction:
          "Allow the small detail. The bridge is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-bifrost-event-3",
        title: "Soft hum underfoot",
        kind: "ambient",
        event: "A soft hum rises from under the bridge surface.",
        characterVisibleText:
          "A soft low hum rises from under the bridge surface on a slow pulse. The hum is at the edge of hearing. The basket does not shift. The thermos holds steady.",
        directorInstruction:
          "Allow the small pulse. The bridge is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-bifrost-event-4",
        title: "Bridge curves catch the eye",
        kind: "provocation",
        event: "The bridge curves rise and fall at the edge of vision.",
        characterVisibleText:
          "The bridge curves up and down at the edge of vision to other worlds. The curve at the upper edge brightens for a beat as a world surface flashes through cloud. The curve at the lower edge dims to a deep blue. The flat segment under the blanket holds.",
        directorInstruction:
          "Push for a real small move. Either may look, name a world below, or hold the eye on the blanket. The bridge is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-bifrost-event-5",
        title: "A figure passes below",
        kind: "provocation",
        event: "A small winged figure passes far below.",
        characterVisibleText:
          "A small winged figure passes far below the lower curve at a long angle. The wingspan is wider than the bridge edge. The figure does not climb. The figure is gone past the rail in a count of four.",
        directorInstruction:
          "Push for a real reaction. The pair does not narrate the flight. The figure is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-bifrost-event-6",
        title: "Constellation shifts",
        kind: "provocation",
        event: "A constellation shifts mid-look.",
        characterVisibleText:
          "A constellation directly above the blanket holds for a long count and then resettles into a different shape. The new shape sits in a different cosmology. The change holds. The other clusters do not move.",
        directorInstruction:
          "Push for a real reaction. The pair does not narrate the change. The constellation is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-bifrost-event-7",
        title: "Folded note in the basket",
        kind: "reveal",
        event: "A folded note rests in the basket lid.",
        characterVisibleText:
          "A folded note rests in the basket lid. The fold is clean. The paper carries one short line in a careful hand. The note has not been opened.",
        directorInstruction:
          "Use the small option to surface a stance drawn only from existing context. Either may open the note or leave it. The note is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-bifrost-event-8",
        title: "Watchman at his post",
        kind: "reveal",
        event: "The watchman holds at his post at the far end.",
        characterVisibleText:
          "The watchman holds at his post at the far end of the bridge. The figure is small at this distance. The stance has not changed since the start of the booking. The watchman is too far off for the pair to read a face.",
        directorInstruction:
          "Use the far figure to surface a stance drawn only from existing context. The watchman does not approach and is not voiced as a continuing speaker.",
      },
      {
        id: "picnic-on-bifrost-event-9",
        title: "A small coin in the basket",
        kind: "reveal",
        event: "A small coin sits in the basket pocket.",
        characterVisibleText:
          "A small worn coin sits in the basket pocket between the two cups. The coin carries a date and a small mark on the rim. The mark is from the prior visit. The date is recent.",
        directorInstruction:
          "Use the small callback to surface a stance drawn only from existing context and pair history. The coin is not voiced as a continuing speaker.",
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
