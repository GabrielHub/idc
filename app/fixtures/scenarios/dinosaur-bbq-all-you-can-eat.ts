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
        event: "The sampler plate slides out of the wall track.",
        characterVisibleText:
          "The wall panel opens and a sampler plate slides out: thinly sliced brontosaurus short rib, raptor flank, triceratops ribeye, and a small portion of T-Rex chuck. Two long tongs sit in the middle of the table. The grill is at temperature. The booking timer reads one fifty-eight.",
        directorInstruction:
          "Open the date with the small action of starting the grill. Either may pick up tongs, lay down the first piece, or wait.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-2",
        title: "Tongs",
        event: "One of them picks up tongs first.",
        characterVisibleText:
          "One pair of tongs is now in a hand. The other pair is still on the table. The first piece of brontosaurus short rib hits the grill and sears immediately. The smoke goes up to the vent.",
        directorInstruction:
          "Use the small grip on the tongs to test whether either of them claims the flipper role or shares it.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-3",
        title: "Lazy susan",
        event: "The lazy susan turns to bring sides across.",
        characterVisibleText:
          "The lazy susan in the middle of the table turns at a hand. The kimchi and the scallion salad come around to one member's side. The ssamjang sits in the middle. The lettuce and perilla are stacked under a small dome.",
        directorInstruction:
          "Use the small turn to test whether either of them brings a side around for the partner without being asked.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-4",
        title: "Far call",
        event: "A distant carnivore call carries through the trees.",
        characterVisibleText:
          "A low call from a carnivore carries through the trees on the far side of the platform. The fence does not move. The grill does not change. A second call answers from a different direction. Neither call is close.",
        directorInstruction:
          "Allow the small environmental sound. The fence is solid. The pair does not need to interpret the calls.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-5",
        title: "Refill",
        event: "The first plate is empty and the tablet is open.",
        characterVisibleText:
          "The first sampler plate is bones and char. The tablet shows the refill menu. The triceratops ribeye is the marbled premium cut and has a small note: limited per table. The other cuts are unlimited. The booking timer reads one twenty-two.",
        directorInstruction:
          "Use the tablet order to test how either of them chooses for the partner without overcalling.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-6",
        title: "Best cut",
        event: "One piece of triceratops ribeye sits on the grill.",
        characterVisibleText:
          "The second plate has come out of the wall track. The triceratops ribeye is on the grill, browning at the edges. There is one piece in the cap section, the most marbled cut of the plate. The tongs are within reach of either of them.",
        directorInstruction:
          "Push for one direct moment about who takes the cap piece. Either may take, offer, or split it. Splitting is a real choice.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-7",
        title: "Brontosaurs",
        event: "A small herd of brontosaurs moves past the tree line.",
        characterVisibleText:
          "Past the tree line, three brontosaurs walk slowly across an open stretch. They stop at a tall fern and one of them pulls a frond. The herd is moving the other direction. The fence is closer than the herd.",
        directorInstruction:
          "Allow the small migration. The pair does not need to itemize the animals or make them a metaphor.",
      },
      {
        id: "dinosaur-bbq-all-you-can-eat-event-8",
        title: "Last round",
        event: "The booking timer crosses zero ten.",
        characterVisibleText:
          "The booking timer reads zero ten. The grill has one last piece of raptor flank cooking. The lazy susan has half a portion of kimchi left. The tablet shows a small button at the bottom: wrap and exit.",
        directorInstruction:
          "Push for a clean exit. The pair finishes the last piece together or one of them flags the wrap. Either is the right answer if it is honest.",
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
