import type { DateScenario } from "../../domain/game";

export const pulseCheck: DateScenario = {
  id: "pulse-check",
  title: "Pulse Check",
  card: {
    summary:
      "Shrunk to thumb-height inside a real blender on a real countertop. Five stages until the blades.",
    tags: ["cosmic", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "high",
    cost: 9,
    idealFor: [
      "members who think clearly under a timer",
      "members whose work has them work hands-free in cramped places",
      "members who can name the next move out loud without dressing it up",
    ],
    badFor: [
      "members who freeze when the room shrinks",
      "members who turn a pressure cycle into a treatise on mortality",
      "members who hoard the climbing route",
    ],
  },
  publicBrief: {
    location:
      "Inside a counter blender on the kitchen island at Smallworks, the shrunk-experience studio",
    premise:
      "Cupid booked a five-minute escape session. The pair has been shrunk to thumb-height and placed inside a real blender on a real countertop. The blender has a five-stage pre-cycle. The lid hatch is the exit. At stage five the blades turn.",
    whatBothCharactersKnow:
      "The blender cycles from stage to stage on its own timer regardless of input. The walls are smooth curved glass. Four foot- and hand-holds run along the inside curve. A small hatch at the top of the lid is the exit. The latch is on the lower edge of the hatch. The studio is otherwise empty.",
    openingSituation:
      "Both members stand at the bottom of the blender on the rubber gasket above the blades. The base panel inside the glass shows the words STAGE ONE PULSE. A green light at the base is steady. The lid hatch is visible six inches up.",
  },
  director: {
    tone: "cold curved glass, the faint smell of yesterday's smoothie at the gasket, a low hum in the motor base under the floor, the studio room a low blur through the glass",
    flow: "set_piece",
    rules: [
      "Anchor the date to inside the blender. The pair does not exit during the events.",
      "Treat the blender as a real appliance. The cycle does not pause. The blades do not wait.",
      "Do not voice the blender, the base panel, or any studio attendant as a continuing speaker.",
      "Allow the pair to coordinate aloud. The stakes are real-feeling, not actually fatal.",
    ],
    events: [
      {
        id: "pulse-check-event-1",
        title: "Stage one steady",
        kind: "ambient",
        pitch:
          "Hold stage one with the base panel and steady green light. Surfaces a beat to take in the curve of the room.",
        beat: "The base panel inside the glass shows the words STAGE ONE PULSE. The green light at the base has not blinked. The hum is even. The gasket is firm under both pairs of feet.",
        directorBeat:
          "You are at the bottom of a glass cylinder and the timer is on. Look up at the lid, place a hand on the curve, ask your date what they see, or breathe out. Acknowledge the room. Do not voice the base panel.",
      },
      {
        id: "pulse-check-event-2",
        title: "Stage one ends",
        kind: "provocation",
        pitch:
          "Click the green light and shift the panel to stage two with a jolt at the gasket. Forces a clean physical move.",
        beat: "The green light at the base blinks once and the base panel shifts to STAGE TWO CHOP. The hum changes pitch. The gasket transmits a small jolt into both pairs of feet. A second hold has appeared at three inches up the curve.",
        directorBeat:
          "The stage just changed. Grab the new hold, brace, ask your date which side they will take, or boost them up first. Make a move. Do not voice the base panel.",
      },
      {
        id: "pulse-check-event-3",
        title: "Foothold gap",
        kind: "reveal",
        pitch:
          "Reveal one missing hold in the route with the remaining three forming a forced shared climb. Surfaces honesty about working together vs alone.",
        beat: "One of the four foot- and hand-holds along the inside curve is missing. The remaining three form a route. The route requires the pair to go up at the same time, not one after the other. The lid hatch is still six inches above.",
        directorBeat:
          "The route forces you both up together. Name the order out loud, offer a hand to your date, ask which hold they want, or start climbing without a plan. Speak only from what is in front of you. Do not voice the curve.",
      },
      {
        id: "pulse-check-event-4",
        title: "Smoothie smell",
        kind: "ambient",
        pitch:
          "Lift the smell of yesterday's banana smoothie off the gasket at three thirty. Surfaces a small reminder of what the room actually is.",
        beat: "The smell of yesterday's banana smoothie has come up off the gasket. The smell is faint, a small reminder that this blender works. The cycle clock is at three minutes thirty.",
        directorBeat:
          "The room just smelled like what it does. Mention it, laugh, hold your breath, or keep climbing. Acknowledge what the room is. Do not voice the gasket.",
      },
      {
        id: "pulse-check-event-5",
        title: "Stage two ends",
        kind: "provocation",
        pitch:
          "Shift the panel to stage three with the glass vibrating at a higher pitch and the lower hold going slick. Forces a real climbing move.",
        beat: "The base panel shifts to STAGE THREE ICE CRUSH. The hum changes again. The glass walls vibrate at a higher frequency for a beat. The lower foothold has gone slick with condensation. The lid hatch is now three inches above the higher pair of holds.",
        directorBeat:
          "The lower hold just got dangerous. Boost up, grab the higher hold, take your date's wrist, or hold position and call the next move. Speak only from what your body can do. Do not voice the base panel.",
      },
      {
        id: "pulse-check-event-6",
        title: "Hatch latch",
        kind: "reveal",
        pitch:
          "Expose the latch under the hatch reachable from only one of the two upper holds. Surfaces honesty about who is in the spot to open it.",
        beat: "The hatch at the top of the lid has a small latch visible from below. The latch must be turned a quarter to release. The latch is on the lower edge of the hatch, reachable from one of the upper holds, not both.",
        directorBeat:
          "Only one of you can reach the latch from where you are. Name who is closer, ask your date to take the other hold, swap positions, or reach. Speak only from what your own hand can do. Do not voice the latch.",
      },
      {
        id: "pulse-check-event-7",
        title: "Lid light",
        kind: "ambient",
        pitch:
          "Slant a small studio light through the hatch onto the gasket in a bright circle. Surfaces a small grace beat in the climb.",
        beat: "The lid above catches a small slant of light from the studio. The light passes through the lid hatch and lands on the gasket in a small bright circle. The cycle clock is at four minutes ten.",
        directorBeat:
          "A small bright circle just landed on the floor below you. Notice it, comment to your date about the light coming through, keep climbing, or take a breath. Do not voice the light.",
      },
      {
        id: "pulse-check-event-8",
        title: "Stage three ends",
        kind: "provocation",
        pitch:
          "Drop the hum to a deeper note as the panel shifts to stage four with the lower holds unreliable. Forces a clean decision about the latch.",
        beat: "The base panel shifts to STAGE FOUR PUREE. The hum drops to a deeper note. The lower footholds are no longer reliable. One member is in reach of the latch.",
        directorBeat:
          "Stage four is on and the lower part of the climb is gone. Turn the latch now, brace the other member, ask your date to hold steady below, or move sideways to swap. Do not voice the base panel.",
      },
      {
        id: "pulse-check-event-9",
        title: "Last hand",
        kind: "reveal",
        pitch:
          "Show one member at the hatch with the other two holds below and fifteen seconds to stage five. Surfaces honest positioning of the pair.",
        beat: "One member has a hand on the loose hatch. The other is two holds below, braced against the curve. The base panel shows fifteen seconds to STAGE FIVE SMOOTHIE. The gasket is no longer firm.",
        directorBeat:
          "The two of you are not in the same place on the curve. Reach back for your date, push the hatch open and pull them up, ask them to climb on your offered hand, or open the hatch alone. Speak only from what your own hand is touching. Do not voice the base panel.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the timer to extract a forced confession from the partner.",
      "A member abandons the upper hold to perform sacrifice when the hatch is in reach.",
    ],
    repeatBehavior:
      "If repeated, the blender is the same blender. The missing hold is in the same spot on the curve. The smoothie smell is fainter each session.",
  },
  judgeRubric: {
    successSignals: [
      "The pair calls the next move out loud without dressing it up.",
      "A member at the hatch reaches back without making it a moment.",
    ],
    failureSignals: [
      "A member treats the timer as a stage to perform a vow.",
      "The pair argues about who climbs first.",
    ],
    statFocus: ["trust", "stability", "weirdnessTolerance"],
  },
};
