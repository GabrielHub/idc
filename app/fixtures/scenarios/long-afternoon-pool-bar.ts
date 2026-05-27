import type { DateScenario } from "../../domain/game";

export const longAfternoonPoolBar: DateScenario = {
  id: "long-afternoon-pool-bar",
  title: "The Sun Doesn't Move",
  card: {
    summary:
      "A two-person pool pavilion on a clifftop above an alien sea, future dimension on Cupid's standing concession. Self-mix bar, AR menu, no other guests. The sun does not move.",
    tags: ["cosmic", "food", "low_pressure"],
    risk: "low",
    intimacy: "high",
    chaos: "low",
    cost: 12,
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
    flow: "conversation",
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
        pitch:
          "Float the AR menu off the bar with a note: house pick today, on the bar. Forces a small choice on where to start.",
        beat: "The AR menu lifts off the bar in a soft glow. The list is short and the note at the top reads: house pick today, on the bar. Two stools sit at the self-mix station. The drone tray is parked behind the bar.",
        directorBeat:
          "The menu is asking for an opening move. Walk to the bar, take a lounger, ask your date what they want first, or sit on a stool. Pick a position in the room. Do not voice the menu.",
      },
      {
        id: "long-afternoon-pool-bar-event-2",
        title: "Tasting board",
        kind: "reveal",
        pitch:
          "Drift a drone tray over to drop a six-bite tasting board with two house favorites flagged and a card reading share. Surfaces taste and care.",
        beat: "The drone tray drifts over with a tasting board, sets it on the small table between the loungers, and returns to the bar. The board has six small bites, labeled in clean type, with two of them flagged house favorite. A folded card on the board reads share.",
        directorBeat:
          "Small bites just landed between you. Push the board toward your date, claim the house favorite, ask which one they want first, or hold off entirely. Do not voice the drone.",
      },
      {
        id: "long-afternoon-pool-bar-event-3",
        title: "Pool temperature notch",
        kind: "ambient",
        pitch:
          "Light up a pool-temp notch on the cabana wall at body warm. Surfaces whether either reaches for the dial.",
        beat: "A small temperature notch lights up on the cabana wall. The notch shows the pool at the current setting and a slow dial to warm or cool. The dial is at body warm. The pool is still.",
        directorBeat:
          "A small control is at your fingertip. Adjust it, comment on body warm, ask your date what they want, or leave it alone. Do not turn the dial into a deal.",
      },
      {
        id: "long-afternoon-pool-bar-event-4",
        title: "Salt and citrus",
        kind: "reveal",
        pitch:
          "Move a small breeze through with salt and citrus. Surfaces a small honest comfort from what each already carries.",
        beat: "A small breeze moves through the pavilion. The air carries salt off the sea and citrus from a low planter at the rail. The breeze passes and the air is still again. The sun does not move.",
        directorBeat:
          "A specific smell just touched you. Name it to your date, comment on the planter, breathe and stay quiet, or stretch into it. Speak from what you actually feel.",
      },
      {
        id: "long-afternoon-pool-bar-event-5",
        title: "Alien bird",
        kind: "ambient",
        pitch:
          "Cross a long-winged teal alien bird past the cabana roof. Surfaces who watches and who keeps eyes inside.",
        beat: "A long-winged alien bird crosses the cliff from the south. The wing color is a deep teal. The bird does not call. It passes the pavilion in a slow line and is gone past the cabana roof.",
        directorBeat:
          "A piece of the alien world just crossed your view. Point at it, comment to your date on the teal, watch it without speaking, or keep your eyes on them. Do not voice the bird.",
      },
      {
        id: "long-afternoon-pool-bar-event-6",
        title: "Bar self-mix",
        kind: "provocation",
        pitch:
          "Pulse the menu with: two drinks pending, your call, and a card reading taste, do not measure. Forces a clean action at the bar.",
        beat: "The AR menu pulses softly. A small line under the bar reads: two drinks pending, your call. The self-mix station has its first jiggers set out. A small card on the bar reads taste, do not measure.",
        directorBeat:
          "Two drinks are waiting on you. Mix them both, ask your date what they want, hand the call across, or pour by taste. Decide and move. Do not voice the menu.",
      },
      {
        id: "long-afternoon-pool-bar-event-7",
        title: "Pool step",
        kind: "reveal",
        pitch:
          "Warm the shallow pool step a touch above the rest. Surfaces closeness drawn from existing context.",
        beat: "The shallow end of the pool sits at the cabana side. A small step leads in. The water at the step is a touch warmer than the rest of the pool. The pool is at chest height at the deep end and ankle height at the step.",
        directorBeat:
          "The water is inviting you in. Sit at the edge, step in to your ankles, ask your date if they want to swim, or stay on the lounger. Show the closeness you already feel.",
      },
      {
        id: "long-afternoon-pool-bar-event-8",
        title: "Twenty-minute notch",
        kind: "provocation",
        pitch:
          "Drop a twenty-minute notch on the menu with the sun still motionless. Forces a clean call on the remaining time.",
        beat: "The AR menu drops a small twenty-minute notch on the right of the panel. The sun has not moved. The cabana curtains have not stirred. The drone tray is parked behind the bar with two empty glasses on it.",
        directorBeat:
          "Twenty minutes left. Pick a last bite, propose a swim, ask your date what they want to end on, or sit with the time. Use the window.",
      },
      {
        id: "long-afternoon-pool-bar-event-9",
        title: "Closing chime",
        kind: "provocation",
        pitch:
          "Chime closed, fold the AR menu, and dock the drone tray with the sun still up. Forces a clean exit.",
        beat: "A soft closing chime sounds in the pavilion. The AR menu folds down to a small line that reads: thank you, your booking is closed. The drone tray returns to its dock. The sun has not moved.",
        directorBeat:
          "The booking just closed under a sun that did not move. Stand to walk out together, propose what you want next, ask your date which last beat they want, or take a final breath of the air. Move. Do not voice the chime.",
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
