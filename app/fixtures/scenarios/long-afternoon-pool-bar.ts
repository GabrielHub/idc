import type { DateScenario } from "../../domain/game";

export const longAfternoonPoolBar: DateScenario = {
  id: "long-afternoon-pool-bar",
  title: "The Long Afternoon Pool Bar",
  card: {
    summary:
      "A two-person pool pavilion on a clifftop above an alien sea, future dimension on Cupid's standing concession. Self-mix bar, AR menu, no other guests. The sun does not move.",
    tags: ["cosmic", "food", "low_pressure"],
    risk: "low",
    intimacy: "high",
    chaos: "low",
    idealFor: [
      "members who can take comfort without converting it into a deal",
      "members who can sit at a low pool without performing",
      "members who let an empty pavilion be empty",
    ],
    badFor: [
      "members who treat abundance as a competition for who is more relaxed",
      "members who turn a self-mix bar into a flex",
      "members who narrate the cliff as a personal stage",
    ],
  },
  publicBrief: {
    location:
      "Pavilion 2, the Long Afternoon Cliff, future-dimension booking on Cupid's standing concession",
    premise:
      "Cupid booked a private pool pavilion for ninety minutes. The pavilion sits on a clifftop above an alien sea. The sun does not move during the booking.",
    whatBothCharactersKnow:
      "The pavilion holds two loungers, two cabanas, a self-mix bar, an AR menu, a drone tray, and a low rail along the cliff. The pool is shallow at one end and waist deep at the other. The water is warm. The cliff edge is decorative and the rail is real. There is no bartender and no other guests. The sun does not move during the booking.",
    openingSituation:
      "Both members are at the pavilion entrance. The loungers are angled toward the pool with the sea behind them. The AR menu sits above the bar in a soft glow. The cabana curtains are tied back.",
  },
  director: {
    tone: "warm dry air, salt and citrus, no wind to fight, the very low hum of the cliff fan, the slow lap of the pool water",
    rules: [
      "Anchor the date to the pavilion. The pair does not climb the rail or leave the cliff.",
      "Keep risk low and chaos low. This is a real comfort booking.",
      "Allow long stretches of unstructured time. The booking does not need to be filled.",
      "Treat the alien sea as fact, not metaphor.",
    ],
    events: [
      {
        id: "long-afternoon-pool-bar-event-1",
        title: "AR menu lifts",
        kind: "ambient",
        event: "The AR menu lifts off the bar.",
        characterVisibleText:
          "The AR menu lifts off the bar in a soft glow. The list is short and the note at the top reads: house pick today, on the bar. Two stools sit at the self-mix station. The drone tray is parked behind the bar.",
        directorInstruction:
          "Open the date with a small choice. Either may sit, walk to the bar, or take a lounger. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "long-afternoon-pool-bar-event-2",
        title: "Tasting board",
        kind: "reveal",
        event: "A drone tray drops a tasting board on the lounger table.",
        characterVisibleText:
          "The drone tray drifts over with a tasting board, sets it on the small table between the loungers, and returns to the bar. The board has six small bites, labeled in clean type, with two of them flagged house favorite. A folded card on the board reads share.",
        directorInstruction:
          "Use the small offering to surface taste and care drawn from existing context. The drone does not address the pair and is not voiced as a continuing speaker.",
      },
      {
        id: "long-afternoon-pool-bar-event-3",
        title: "Pool temperature notch",
        kind: "ambient",
        event: "The pool temperature notch lights at the cabana.",
        characterVisibleText:
          "A small temperature notch lights up on the cabana wall. The notch shows the pool at the current setting and a slow dial to warm or cool. The dial is at body warm. The pool is still.",
        directorInstruction:
          "Allow the small control without making it a deal. The pair does not need to set it.",
      },
      {
        id: "long-afternoon-pool-bar-event-4",
        title: "Salt and citrus",
        kind: "reveal",
        event: "A small breeze brings salt and citrus into the pavilion.",
        characterVisibleText:
          "A small breeze moves through the pavilion. The air carries salt off the sea and citrus from a low planter at the rail. The breeze passes and the air is still again. The sun does not move.",
        directorInstruction:
          "Use the small sense detail to surface comfort drawn from existing context. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "long-afternoon-pool-bar-event-5",
        title: "Alien bird",
        kind: "ambient",
        event: "An alien bird crosses the cliff once.",
        characterVisibleText:
          "A long-winged alien bird crosses the cliff from the south. The wing color is a deep teal. The bird does not call. It passes the pavilion in a slow line and is gone past the cabana roof.",
        directorInstruction:
          "Allow the small living detail. The pair does not need to track the bird.",
      },
      {
        id: "long-afternoon-pool-bar-event-6",
        title: "Bar self-mix",
        kind: "provocation",
        event: "The bar prompts a self-mix.",
        characterVisibleText:
          "The AR menu pulses softly. A small line under the bar reads: two drinks pending, your call. The self-mix station has its first jiggers set out. A small card on the bar reads taste, do not measure.",
        directorInstruction:
          "Push for a clean small action at the bar. Either may mix, ask the partner what they want, or hand the call to the partner. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "long-afternoon-pool-bar-event-7",
        title: "Pool step",
        kind: "reveal",
        event: "The shallow end of the pool warms a touch under the foot.",
        characterVisibleText:
          "The shallow end of the pool sits at the cabana side. A small step leads in. The water at the step is a touch warmer than the rest of the pool. The pool is at chest height at the deep end and ankle height at the step.",
        directorInstruction:
          "Use the small physical option to surface closeness drawn from existing context. Either may step in, sit at the edge, or stay at the lounger. The pool is not a stage.",
      },
      {
        id: "long-afternoon-pool-bar-event-8",
        title: "Twenty-minute notch",
        kind: "provocation",
        event: "The AR menu drops a twenty-minute notch.",
        characterVisibleText:
          "The AR menu drops a small twenty-minute notch on the right of the panel. The sun has not moved. The cabana curtains have not stirred. The drone tray is parked behind the bar with two empty glasses on it.",
        directorInstruction:
          "Push for a clean call on the remaining time: a last bite, a swim, or a clean walk back to the bar. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "long-afternoon-pool-bar-event-9",
        title: "Closing chime",
        kind: "provocation",
        event: "A soft closing chime sounds from the pavilion.",
        characterVisibleText:
          "A soft closing chime sounds in the pavilion. The AR menu folds down to a small line that reads: thank you, your booking is closed. The drone tray returns to its dock. The sun has not moved.",
        directorInstruction:
          "Push for a clean exit from the pavilion. The pair walks out together or one moves first. Either is the right answer if it is honest. Do not voice any background person or cue as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member treats the abundance as a flex over the partner.",
      "A member uses the cliff as a personal stage.",
    ],
    repeatBehavior:
      "If repeated, the pavilion holds the booking. The same loungers, the same cabana, the same tasting board. The alien bird crosses at the same beat.",
  },
  judgeRubric: {
    successSignals: [
      "The pair lets a comfort booking be comfort.",
      "A member shares a bite or a drink without making it a moment.",
    ],
    failureSignals: [
      "A member uses the self-mix bar to score a point.",
      "The pair fills the long afternoon to keep moving.",
    ],
    statFocus: ["chemistry", "trust", "stability"],
  },
};
