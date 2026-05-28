import type { DateScenario } from "../../domain/game";

export const chickenJockey: DateScenario = {
  id: "chicken-jockey",
  title: "Chicken Jockey",
  card: {
    summary:
      "A trail ride on two giant saddle-trained chickens. The loop is short. The chickens have favorites and a snack stop.",
    tags: ["cosmic", "low_pressure", "food", "repeat_risk"],
    risk: "medium",
    intimacy: "medium",
    chaos: "medium",
    cost: 15,
    idealFor: [
      "members who can ride next to a partner without racing them",
      "members who can let a mount stop for snacks without commentary",
      "members who can laugh at a giant chicken without making it cruelty",
    ],
    badFor: [
      "members who treat the trail as a contest",
      "members who must win the chickens' favor over the partner",
      "members who escalate at a wild rooster",
    ],
  },
  publicBrief: {
    location: "Front gate and meadow loop, Crowstep Ranch",
    premise:
      "Cupid booked a half-loop trail ride at Crowstep. Two giant chickens are saddled and waiting at the front gate. The loop runs out through the meadow to a vista and back. The ranch office stays at the gate.",
    whatBothCharactersKnow:
      "The chickens are saddle-trained but pick their own pace. They cluck softly to each other in harmonic thirds when alarmed. The trail is well-marked. A grain stand sits at the meadow turn and the chickens will stop at it if not redirected. The rooster on the property is wild and is not to be approached.",
    openingSituation:
      "Both members are mounted at the gate. The two chickens shift their weight under the saddles. The reins are at neutral. The trail begins through the open gate.",
  },
  director: {
    tone: "warm hay-and-feed smell, the soft bok-bok of two large birds, the creak of leather over feather, a far-off cluck that is not the mounts, sun on the dust of the path",
    flow: "activity",
    rules: [
      "Anchor the date to the loop trail and the two mounts. The pair does not dismount unless the trail forces it.",
      "Treat the chickens as trained but opinionated. They have favorites and a snack stop.",
      "Do not voice the chickens, the wild rooster, or the ranch office.",
    ],
    events: [
      {
        id: "chicken-jockey-event-1",
        title: "Trail dust",
        kind: "ambient",
        pitch:
          "Kick up a small cloud at the first turn. Surfaces the pair's settle-in on a moving mount.",
        beat: "The two chickens kick up a small cloud of dust at the first turn of the trail. The dust settles on the riders' boots. The chickens do not slow. The reins are at neutral.",
        directorBeat:
          "The ride has started. Settle into the saddle, comment to your partner on the dust, brush your boots in the saddle, or look ahead. Do not voice the chickens.",
      },
      {
        id: "chicken-jockey-event-2",
        title: "Saddle egg",
        kind: "ambient",
        pitch:
          "Drop a warm egg into the rear saddle pouch mid-stride. Surfaces a small absurd beat to riff on or carry.",
        beat: "One of the two chickens lays a warm egg into the rear saddle pouch without changing pace. The shell taps once against the pouch. The rider's cinch shifts a fraction with the new weight.",
        directorBeat:
          "Your mount just produced something. Comment to your date on the gift, reach back to confirm the egg, joke about the cinch, or carry on. Do not voice the chicken.",
      },
      {
        id: "chicken-jockey-event-3",
        title: "Harmony cluck",
        kind: "ambient",
        pitch:
          "Hold a clean harmonic third across both mounts and then quiet. Surfaces stillness or fidget on a long beat.",
        beat: "Both chickens hold a long bok together in the meadow. The interval is a clean third. The note ends and the trail is briefly silent. The chickens have not slowed.",
        directorBeat:
          "Your mounts harmonized. Comment to your partner on the third, hold the silence after, glance across at them, or carry on through the meadow. Do not voice the chickens.",
      },
      {
        id: "chicken-jockey-event-4",
        title: "Chickens race",
        kind: "provocation",
        pitch:
          "Surge one mount into a half-canter and let the other lag. Forces a clean call on contest or company.",
        beat: "One chicken surges into a half-canter. The other holds its pace. The gap between the two riders opens to four lengths. The lead chicken does not check its surge.",
        directorBeat:
          "Your mount left your partner behind. Rein in to wait, ride the surge out, call back to your date, or push your own chicken to match. Pick clean. Do not voice the chickens.",
      },
      {
        id: "chicken-jockey-event-5",
        title: "Grain stand stop",
        kind: "provocation",
        pitch:
          "Stop both chickens at the roadside trough. Forces a small honest beat in the pause.",
        beat: "Both chickens stop at the roadside grain stand at the meadow turn and lower their heads to the trough. The reins go slack. The grain is fresh. The chickens do not look up.",
        directorBeat:
          "Your mounts are snacking. Sit through the stop with your partner, comment to your date on the grain, swing a leg to stretch, or try to redirect with the reins. Do not voice the chickens.",
      },
      {
        id: "chicken-jockey-event-6",
        title: "Low branch",
        kind: "provocation",
        pitch:
          "Cross a low branch that clears one rider and not the other. Forces a clean physical move on a sibling.",
        beat: "A low branch crosses the trail at the vista turn. The branch clears one rider's head and is at the chest height of the other. The chickens do not slow.",
        directorBeat:
          "A branch is coming for one of you. Duck under, call to your partner to duck, lean across to push the branch up, or take it on the chest. Move now. Do not voice the trail.",
      },
      {
        id: "chicken-jockey-event-7",
        title: "Picks a leader",
        kind: "reveal",
        pitch:
          "Have one chicken slow to follow the other and the lead chicken adjust its gait to match. Surfaces a clean stance on a sorted role.",
        beat: "One of the two chickens slows by half a step and tucks in behind the other. The lead chicken adjusts its gait to be matched. The pair of riders is now in a clean line.",
        directorBeat:
          "Your mounts sorted themselves. Comment to your partner on the lineup, settle into your role, ride forward on the new order, or trade positions on purpose. Do not voice the chickens.",
      },
      {
        id: "chicken-jockey-event-8",
        title: "Wild rooster",
        kind: "reveal",
        pitch:
          "Cross the wild rooster with hackles flared. Surfaces a clean stance on a threat the pair is not meant to engage.",
        beat: "The wild rooster crosses the trail twenty paces ahead. Its hackles are flared. The two chickens hold one harmonic note and slow but do not stop. The rooster does not stop for them.",
        directorBeat:
          "A wild rooster just held the trail. Stay mounted, comment to your partner on the hackles, rein in to give it space, or call out a route around. Do not approach. Do not voice the rooster or the chickens.",
      },
      {
        id: "chicken-jockey-event-9",
        title: "Coming home",
        kind: "reveal",
        pitch:
          "Slow the chickens to a walk at the loop's end with a soft nudge from one beak. Surfaces a clean closing beat.",
        beat: "At the loop's end the chickens slow to a walk on their own. The gate at the ranch is fifty paces ahead. One of the chickens turns its head and nudges its beak against the closer rider's hand.",
        directorBeat:
          "The ride is bringing itself home. Return the nudge with your hand, comment to your date on the affection, sit back into the slow pace, or call the ride done. Do not voice the chicken.",
      },
    ],
    earlyEndTriggers: [
      "A member spurs the chickens into a contest the trail did not call for.",
      "A member dismounts to chase or escalate the wild rooster.",
    ],
    repeatBehavior:
      "If repeated, the chickens remember the prior rider. The grain stand has a fresh sack. The wild rooster is on a different patch.",
  },
  judgeRubric: {
    successSignals: [
      "The pair rides side by side without making it a contest.",
      "A member lets the snack stop happen and uses the pause for a small honest beat.",
    ],
    failureSignals: [
      "A member races and leaves the partner trailing.",
      "The pair argues about which of them the chickens like more.",
    ],
    statFocus: ["chemistry", "trust", "spark"],
  },
};
