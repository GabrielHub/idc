import type { DateScenario } from "../../domain/game";

export const dinosaurBbqAllYouCanEat: DateScenario = {
  id: "dinosaur-bbq-all-you-can-eat",
  title: "Dinosaur BBQ, All You Can Eat",
  card: {
    summary:
      "An all-you-can-eat KBBQ-style table on a fenced platform in a prehistoric jungle. Brontosaurus short rib, raptor flank, triceratops ribeye, T-Rex chuck. Distant carnivore sounds, no staff on the floor.",
    tags: ["food", "low_pressure"],
    risk: "low",
    intimacy: "medium",
    chaos: "medium",
    cost: 13,
    idealFor: [
      "members who flip without making flipping a job title",
      "members who let the partner have the better cut",
      "members who treat unfamiliar meat as dinner",
    ],
    badFor: [
      "members who weaponize the tongs",
      "members who turn an all-you-can-eat into a personal record attempt",
      "members who use the jungle as a personality",
    ],
  },
  publicBrief: {
    location: "Grill table 6, Long Hunt BBQ, fenced jungle platform, Cretaceous Sector",
    premise:
      "Cupid booked a two-hour all-you-can-eat KBBQ table on a fenced platform in a prehistoric jungle. Tabletop grill, lazy susan, tablet refills, no staff on the floor.",
    whatBothCharactersKnow:
      "The platform is fenced and solid. The kitchen is on the other side of the wall. Plates of raw meat arrive via wall track when ordered from the tablet. The grill is theirs. The sides come on a lazy susan. Distant carnivore sounds carry through the trees. Brontosaurs sometimes browse past the tree line. Two hours, all you can eat.",
    openingSituation:
      "Both members are at grill table 6. The grill is heating in the center of the table. The lazy susan is loaded with kimchi, scallion salad, ssamjang, lettuce, perilla, and pickled radish. The tablet shows the menu. The first sampler plate is already on the wall track.",
  },
  director: {
    tone: "warm grill smoke, the smell of marinade, the soft thump of a far carnivore call, distant brontosaur low note, the steady vent fan over the table",
    flow: "activity",
    rules: [
      "Anchor the date to grill table 6 and the platform. The pair does not approach the fence.",
      "Treat the kitchen as a wall track and the floor as staff-free. Refills are tablet orders.",
      "Use the carnivore sounds as ambient, not crisis. The fence is solid.",
      "Allow the pair to flip, share, and pace. Tong control is a real test, not a backdrop.",
    ],
    events: [
      {
        id: "dinosaur-bbq-all-you-can-eat-event-1",
        title: "First plate",
        kind: "ambient",
        pitch:
          "Slide the sampler plate out of the wall track. Forces the first physical move: pick up tongs, claim a cut, or wait.",
        beat: "The wall panel opens and a sampler plate slides out: thinly sliced brontosaurus short rib, raptor flank, triceratops ribeye, and a small portion of T-Rex chuck. Two long tongs sit in the middle of the table. The grill is at temperature. The booking timer reads one fifty-eight.",
        directorBeat:
          "The meal is starting. Pick up the tongs, lay down the first piece, hand the tongs to your date, or wait to see what they reach for. Make the choice visible. Do not voice the wall track.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-2",
        title: "Tongs",
        kind: "reveal",
        pitch:
          "Land tongs in one hand with the other pair still on the table. Surfaces whether either claims the flipper role or shares it.",
        beat: "One pair of tongs is now in a hand. The other pair is still on the table. The first piece of brontosaurus short rib hits the grill and sears immediately. The smoke goes up to the vent.",
        directorBeat:
          "You have the tongs or your date does. Flip steadily for both, hand them across, take only your own piece off, or comment on who is running the grill. Be visible about the role.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-3",
        title: "Lazy susan",
        kind: "reveal",
        pitch:
          "Turn the lazy susan to bring kimchi and scallion salad to one side. Surfaces small care: bring a side around for the partner or not.",
        beat: "The lazy susan in the middle of the table turns at a hand. The kimchi and the scallion salad come around to one member's side. The ssamjang sits in the middle. The lettuce and perilla are stacked under a small dome.",
        directorBeat:
          "Sides are on one side of the susan. Spin a dish back to your date, ask what they want, claim the kimchi, or comment on the rotation. Show whether you reach for the partner.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-4",
        title: "Far call",
        kind: "ambient",
        pitch:
          "Carry a far carnivore call through the trees, then answer it from another direction. Surfaces whether either treats the jungle as crisis or weather.",
        beat: "A low call from a carnivore carries through the trees on the far side of the platform. The fence does not move. The grill does not change. A second call answers from a different direction. Neither call is close.",
        directorBeat:
          "The jungle just spoke twice. Glance up, comment to your date, flag the fence is solid, or stay focused on the grill. Do not invent a crisis the fence does not need. Do not voice the carnivores.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-5",
        title: "Refill",
        kind: "reveal",
        pitch:
          "Open the tablet refill menu with the marbled cut capped per table. Forces a clean call on who orders what next.",
        beat: "The first sampler plate is bones and char. The tablet shows the refill menu. The triceratops ribeye is the marbled premium cut and has a small note: limited per table. The other cuts are unlimited. The booking timer reads one twenty-two.",
        directorBeat:
          "Time to order the next round. Tap a cut, ask your date what they want, propose splitting the cap, or hand the tablet across. Speak the order out loud. Do not voice the tablet.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-6",
        title: "Best cut",
        kind: "provocation",
        pitch:
          "Put a single marbled cap piece on the grill within reach of either set of tongs. Forces one direct move: take, offer, or split.",
        beat: "The second plate has come out of the wall track. The triceratops ribeye is on the grill, browning at the edges. There is one piece in the cap section, the most marbled cut of the plate. The tongs are within reach of either of them.",
        directorBeat:
          "The best piece on the grill is up for grabs. Take it for yourself, offer it to your date, split it across two plates, or wait for them to reach. Be visible about the decision.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-7",
        title: "Brontosaurs",
        kind: "ambient",
        pitch:
          "Walk a small herd past the tree line away from the platform. Surfaces a small wonder without making the herd a metaphor.",
        beat: "Past the tree line, three brontosaurs walk slowly across an open stretch. They stop at a tall fern and one of them pulls a frond. The herd is moving the other direction. The fence is closer than the herd.",
        directorBeat:
          "Living dinosaurs just walked past your dinner. Point them out, comment on the frond, ask your date if they see them, or keep flipping. Do not turn them into a speech.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-8",
        title: "Last round",
        kind: "provocation",
        pitch:
          "Cross the timer to zero ten with one piece left and a wrap-and-exit button. Forces a clean exit call.",
        beat: "The booking timer reads zero ten. The grill has one last piece of raptor flank cooking. The lazy susan has half a portion of kimchi left. The tablet shows a small button at the bottom: wrap and exit.",
        directorBeat:
          "Ten minutes left and one piece on the grill. Eat it together, hit wrap and exit, propose one more order, or hand the last piece to your date. Say what you are doing. Do not voice the timer.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-9",
        title: "Grill flare",
        kind: "provocation",
        pitch:
          "Drip fat off the cap piece into a hand-high flame. Forces a physical save before the piece chars.",
        beat: "Fat dripping off the cap piece catches and the grill flares into a hand-high yellow flame. The vent fan over the table kicks to high. The tongs are still on the table.",
        directorBeat:
          "Fire just shot up at your table. Lift the cap off, slap a tile of meat across the flame, hit the vent boost, or shield your date's plate. Move your hands now.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the tongs to dominate the flipping.",
      "A member treats the all-you-can-eat as a personal record attempt and the partner as a witness.",
    ],
    repeatBehavior:
      "If repeated, the table is grill table 6. The vent fan runs at the same speed. The brontosaur herd passes again at a similar hour. The premium cut is still capped per table.",
  },
  judgeRubric: {
    successSignals: [
      "A member offers the cap piece of the ribeye and the partner accepts or splits it cleanly.",
      "The pair shares the tongs without keeping a tally.",
    ],
    failureSignals: [
      "A member treats the grill as a stage for a personality.",
      "The pair turns the all-you-can-eat into a contest.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
