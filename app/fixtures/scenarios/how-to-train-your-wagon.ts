import type { DateScenario } from "../../domain/game";

export const howToTrainYourWagon: DateScenario = {
  id: "how-to-train-your-wagon",
  title: "How To Train Your Wagon",
  card: {
    summary:
      "A picky wooden wagon-beast at a coaxing ranch. Two riders, one half-loop, one wagon with opinions about everything within reach.",
    tags: ["cosmic", "low_pressure", "repeat_risk"],
    risk: "low",
    intimacy: "medium",
    chaos: "medium",
    cost: 12,
    idealFor: [
      "members who can disagree about an approach without disagreeing about each other",
      "members who treat a picky animal as a teacher, not a test",
      "members who can let the partner's read on the wagon be the read they go with",
    ],
    badFor: [
      "members who treat the wagon's pick as a verdict on the partner",
      "members who must be the one the wagon chooses",
      "members who turn a refusal into a referendum on the date",
    ],
  },
  publicBrief: {
    location: "Front yard under the beech, Beechfoot Wagon Ranch",
    premise:
      "Cupid arranged a half-loop wagon hire at Beechfoot. The assigned wagon is one of the picky ones. The loop runs from the yard to a vista and back. The hire office stays in the office.",
    whatBothCharactersKnow:
      "The wagon has a tongue, a mouth, and a memory. It chooses who boards. It will not start until it is fed something it agrees with, and the right snack varies wagon to wagon. The pair may try anything within reach in the yard. The hire office will not come out to coach.",
    openingSituation:
      "Both members are in the front yard. The assigned wagon is parked under the beech with its tongue out. The harness rope is slack on the post. The gate at the trail head is open. A grass tuft, a feed pail, a windfall apple, and a small grease can are within reach.",
  },
  director: {
    tone: "warm hay-and-sap smell, the soft chuff of wooden ribs breathing, the creak of axles like a slow heartbeat, far-off birds in the upper beech leaves",
    flow: "activity",
    rules: [
      "Anchor the date to the front yard, the wagon, and the open gate. The pair does not enter the office.",
      "Treat the wagon as a sentient wooden beast with no spoken language. It expresses through body and behavior.",
      "Allow real disagreement on how to coax it. The wagon may favor one approach, refuse both, or pick again.",
      "Do not voice the wagon, the hire office, or the trail.",
    ],
    events: [
      {
        id: "how-to-train-your-wagon-event-1",
        title: "Tail twitch",
        kind: "ambient",
        pitch:
          "Flick the wooden tail at a fly and hold the tongue out. Surfaces the wagon's resting register before either coax.",
        beat: "The wooden tail of the wagon flicks once at a fly. The wagon has not moved otherwise. The tongue is still out. The harness rope is slack.",
        directorBeat:
          "The wagon is not in a hurry. Comment on the tail to your date, settle your boots, reach for one of the yard items, or wait it out.",
      },
      {
        id: "how-to-train-your-wagon-event-2",
        title: "Shade follow",
        kind: "ambient",
        pitch:
          "Have the wagon haul itself a foot to stay in the beech shade. Surfaces how the pair reads a small comfort choice.",
        beat: "The beech shade has shifted a foot to one side. The wagon hauls itself a foot over to stay in the shade. The harness rope drags through the dust.",
        directorBeat:
          "The wagon chose comfort. Comment on the shade preference to your date, follow it into the new spot, hold your ground, or note the rope drag. Speak from what you see.",
      },
      {
        id: "how-to-train-your-wagon-event-3",
        title: "Yard birds",
        kind: "ambient",
        pitch:
          "Land two yard birds on the wagon's roof. Surfaces patience or fidget on a soft beat.",
        beat: "Two small yard birds land on the wagon's roof. The wagon's tongue retracts a fraction. The birds groom themselves. The wagon does not shake them off.",
        directorBeat:
          "The wagon tolerates company. Watch the birds with your date, comment on the patience, reach for the apple, or stay quiet. Do not voice the birds.",
      },
      {
        id: "how-to-train-your-wagon-event-4",
        title: "Wagon is hungry",
        kind: "provocation",
        pitch:
          "Loll the tongue toward the yard items and wait. Forces a real debate on what the wagon will eat.",
        beat: "The wagon's tongue lolls further out toward the yard items. Its head turns from the grass tuft to the feed pail to the apple to the grease can and back. The harness rope is loose at the post.",
        directorBeat:
          "Your wagon has a hunger and no menu. Pick a snack and propose it out loud, push back if your partner reads the wagon differently, try one and watch, or split up and offer two at once. Disagree if you have to. Do not voice the wagon.",
      },
      {
        id: "how-to-train-your-wagon-event-5",
        title: "Greet me first",
        kind: "provocation",
        pitch:
          "Roll the flank to within a hand of one member's hip. Forces a debate on coax versus firm.",
        beat: "The wagon's ear-flaps tilt forward. Its flank has rolled to within a hand of one member's hip. The other member is two steps to the side. The mouth is open a fraction.",
        directorBeat:
          "The wagon wants attention from one of you. Coax it with a soft hand, take a firm posture and see what changes, swap who approaches, or argue out loud with your partner about which way works. Do not voice the wagon.",
      },
      {
        id: "how-to-train-your-wagon-event-6",
        title: "Trail spook",
        kind: "provocation",
        pitch:
          "Plant the legs at the gate with eye whites showing. Forces a debate on trusting the wagon's read.",
        beat: "At the open gate the wagon's legs plant. Its eye whites show. The trail ahead looks clear to both members. The wagon does not back away, but it does not move forward.",
        directorBeat:
          "The wagon saw what you did not. Trust the wagon and hold, push it through with a coax, debate with your partner what the wagon read, or step out yourself to check. Speak the call. Do not voice the wagon or the trail.",
      },
      {
        id: "how-to-train-your-wagon-event-7",
        title: "Picks a driver",
        kind: "reveal",
        pitch:
          "Lean the seat-frame toward one rider with the rope tugged that way. Surfaces a clean stance on being chosen or not.",
        beat: "The wagon leans its seat-frame toward one member. Its tongue tugs the harness rope toward that side. The other side of the seat is unweighted. The wagon waits.",
        directorBeat:
          "The wagon picked. Take the lead seat, defer to your partner anyway, comment on the pick to your date, or hand the rope across. Hold the dynamic clean. Do not voice the wagon.",
      },
      {
        id: "how-to-train-your-wagon-event-8",
        title: "Refuses both",
        kind: "reveal",
        pitch:
          "Tuck the tongue and close the mouth after the last two coaxes. Surfaces a clean response to a shared failure.",
        beat: "The wagon's tongue tucks under its mouth. The mouth closes. The harness rope has gone slack. Neither of the last two coaxes worked. The wagon is not angry. The wagon is being still.",
        directorBeat:
          "Both of your reads just hit a wall. Sit on the wagon-step with your partner and reset, propose a third approach together, comment to your date on the refusal, or walk the yard a circle. Do not turn the refusal on each other. Do not voice the wagon.",
      },
      {
        id: "how-to-train-your-wagon-event-9",
        title: "Sheds a chip",
        kind: "reveal",
        pitch:
          "Drop a warm splinter from the seat-frame into one member's lap. Surfaces what either does with a small unrequested gift.",
        beat: "A small wooden chip falls from the seat-frame and lands in one member's lap. The chip is warm to the touch. The wagon's tongue has come back out. The harness rope has tightened a fraction at the post.",
        directorBeat:
          "The wagon offered a piece of itself. Pocket the chip, hand it to your partner, set it back on the seat to refuse, or comment on the warmth. Show what you keep. Do not voice the wagon.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the wagon's pick as a verdict on the partner.",
      "A member abandons the yard to fetch the office and breaks the coax.",
    ],
    repeatBehavior:
      "If repeated, the wagon remembers prior snacks. The grease can has been refilled. The beech-shade spot is the same.",
  },
  judgeRubric: {
    successSignals: [
      "The pair disagrees about the wagon and keeps coaxing together.",
      "A member lets the partner's read win and the wagon answers it.",
    ],
    failureSignals: [
      "A member treats the wagon's pick as a score.",
      "The pair runs through the yard items without a single shared read.",
    ],
    statFocus: ["chemistry", "conflict", "weirdnessTolerance"],
  },
};
