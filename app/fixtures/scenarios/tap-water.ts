import type { DateScenario } from "../../domain/game";

export const tapWater: DateScenario = {
  id: "tap-water",
  title: "Tap Water",
  card: {
    summary:
      "A picnic table by the lager river at a brewery garden. Every fountain, sprinkler, and downspout on the grounds runs the same.",
    tags: ["food", "public", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "medium",
    cost: 9,
    idealFor: [
      "members whose nine-to-five does not punish a soft buzz before five",
      "members who can sit by slow water and trust the bench underneath",
      "members who treat shared bread and shared bitter as a small kindness",
    ],
    badFor: [
      "members who treat sober ground as a moral floor and cannot rest without it",
      "members who must explain the joke of the place out loud",
      "members who turn a buzz into a confession spree",
    ],
  },
  publicBrief: {
    location: "Picnic table seventeen on the riverside bench at Vollerei Garten",
    premise:
      "Cupid booked a forty-minute table by the lager river. The brewery runs the park. Every tap, fountain, sprinkler, downspout, and toilet on the grounds runs the same. No outside water.",
    whatBothCharactersKnow:
      "The river is beer. The hand-washing spigot at the bench end is beer. The drinking fountain is beer. The picnic table holds a small pitcher and two glass mugs. The pitcher is also beer. If the rain comes, the rain is beer. The grass is grass.",
    openingSituation:
      "Both members sit at table seventeen. The pitcher is between them, untouched. A small pretzel basket sits on a paper tray. The river flows three feet from the bench. The river is the color of a pilsner.",
  },
  director: {
    tone: "warm air, the soft slosh of a slow lager river, the smell of malt instead of moss, a brass band tuning at a distance up the hill",
    flow: "conversation",
    rules: [
      "Anchor the date to table seventeen and the bench. The pair stays at the table.",
      "Treat the brewery rule as fact. Every liquid on the grounds is beer. There is no water here.",
      "Do not voice the river, the spigot, the brass band, or any garden staff as a continuing speaker.",
      "Allow accidental buzz to land on a sleeve, a cuff, or a finger without explanation.",
    ],
    events: [
      {
        id: "tap-water-event-1",
        title: "Sprinkler cycle",
        kind: "ambient",
        pitch:
          "Kick a garden sprinkler on in a slow arc that brushes the corner of the table. Surfaces a small shared shrug or a flinch.",
        beat: "A garden sprinkler ten feet from the bench kicks on in a slow arc. The arc clips the corner of the table. A few cool drops land on the pretzel basket. The pitcher remains untouched.",
        directorBeat:
          "The sprinkler just caught the corner. Wipe the basket, shift the pitcher, comment to your date about the smell, or sit through the arc. Acknowledge the body. Do not voice the sprinkler.",
      },
      {
        id: "tap-water-event-2",
        title: "Hand wash",
        kind: "reveal",
        pitch:
          "Surface the bench-end spigot running the same color as the pitcher. Surfaces who registers the rule out loud first.",
        beat: "A small stainless spigot mounted at the end of the bench drips once, then twice. The drip is the color of the pitcher. A small towel hangs on a hook beneath the spigot.",
        directorBeat:
          "The hand-wash is the same as the drink. Notice it, joke about it, hold a cuff under the drip, or leave it alone. Speak from what is in front of you both. Do not voice the spigot.",
      },
      {
        id: "tap-water-event-3",
        title: "Duck arrives",
        kind: "ambient",
        pitch:
          "Drift a duck into the small backwater by the bench. Surfaces a gentle quiet beat the pair can claim.",
        beat: "A duck drifts down the river and into the small backwater by the bench. The duck dips its beak and drinks. The duck does not appear concerned. Its path takes it past the bench and out of view.",
        directorBeat:
          "A duck is drinking from the river next to you. Watch it, comment to your date on the small calm of it, push the basket toward the bench rail, or sit quiet. Do not voice the duck.",
      },
      {
        id: "tap-water-event-4",
        title: "Pitcher waits",
        kind: "provocation",
        pitch:
          "Sit the pitcher between them with two empty mugs in reach. Forces a clean call on who pours.",
        beat: "The pitcher on the table holds enough for two glasses. Condensation has begun to bead on the side. The two glass mugs are within reach of either member. Neither has poured.",
        directorBeat:
          "The pour is up to one of you. Pour for both, pour your own and stop, offer the pitcher to your date, or leave it and reach for the pretzel instead. Make the choice visible. Do not voice the pitcher.",
      },
      {
        id: "tap-water-event-5",
        title: "Held note up the hill",
        kind: "ambient",
        pitch:
          "Hold one brass note from the band up the hill longer than it should sit. Surfaces a beat the pair can sit through together.",
        beat: "A brass band somewhere up the hill holds a single sustained note while tuning. The note holds longer than it should. The river continues to slosh. The pretzel basket cools by a small notch.",
        directorBeat:
          "Something musical is holding above you. Tilt your head toward the sound, comment to your date on how long it sits, turn back to the pitcher, or keep eyes on the river. Do not voice the brass band.",
      },
      {
        id: "tap-water-event-6",
        title: "First sip",
        kind: "provocation",
        pitch:
          "Drop one mug to half full with a small condensation ring on the table. Forces a stance on going second or staying dry.",
        beat: "One mug is now half full. The condensation on the side has formed a small ring on the table. The other mug is empty. The pitcher has dropped by one glass-worth.",
        directorBeat:
          "One of you has started. Pour yours and match, hold off and stay dry for now, ask your date how it tastes, or push the pretzel basket across. Pick a stance. Do not voice the mug.",
      },
      {
        id: "tap-water-event-7",
        title: "Wet sleeve",
        kind: "reveal",
        pitch:
          "Catch a small splash on a cuff from the sprinkler's return. Surfaces a small honest fact about the body.",
        beat: "A small splash from the sprinkler arc has caught a cuff on its return. The sleeve is faintly beer-scented. The skin underneath is slightly cool. The wearer did not flinch when it landed.",
        directorBeat:
          "A cuff is wet now. Roll it up, hold it out to air, comment to your date about the smell, or leave it. Speak only from what your own body is doing. Do not voice the sprinkler.",
      },
      {
        id: "tap-water-event-8",
        title: "Rain begins",
        kind: "provocation",
        pitch:
          "Land a few warm drops on the table from a cloud overhead. Forces a stance on the umbrella, the basket, or staying through it.",
        beat: "A few warm drops land on the table from a cloud overhead. The drops smell like the river. A small umbrella is folded beneath the bench. The pitcher is now mostly empty.",
        directorBeat:
          "The rain just started and the rain is beer. Open the umbrella, push the basket under it, ask your date if they want to stay or move, or sit through it. Do not voice the cloud.",
      },
      {
        id: "tap-water-event-9",
        title: "Ice melts denser",
        kind: "reveal",
        pitch:
          "Melt the dish of beer-ice into a thin denser pool. Surfaces a small honest beat about losing sober ground.",
        beat: "A small dish of beer-ice from the table caddy has melted into a thin amber pool. The pool is denser than the pitcher pour. A finger could be dipped without comment.",
        directorBeat:
          "The ice is gone and the puddle it left is stronger than the pour. Dip a finger, mop the pool with a napkin, comment to your date about how the rule keeps going, or push the dish to the rim. Speak only from your own register. Do not voice the dish.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the brewery rule as a stage for a confession about self.",
      "A member pours the partner's glass without asking when the partner has chosen not to pour.",
    ],
    repeatBehavior:
      "If repeated, the river is the same river. The duck visits the same backwater. The brass band tunes the same note. Table seventeen is held by the garden.",
  },
  judgeRubric: {
    successSignals: [
      "A member acknowledges the soft buzz without making it the subject.",
      "The pair shares the pitcher without keeping score.",
    ],
    failureSignals: [
      "A member uses the brewery rule as permission to confess.",
      "The pair argues about whether the duck is being served.",
    ],
    statFocus: ["chemistry", "stability", "weirdnessTolerance"],
  },
};
